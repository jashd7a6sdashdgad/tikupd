import { NextRequest, NextResponse } from 'next/server';
import { Gmail } from '@/lib/google';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import jwt from 'jsonwebtoken';

async function refreshAccessToken(refreshToken: string) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }),
    cache: 'no-store'
  });
  if (!tokenResponse.ok) throw new Error('Failed to refresh token');
  return tokenResponse.json() as Promise<{ access_token: string; expires_in?: number }>;
}

// Helper function to get Google auth from cookies
function getGoogleAuth(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (!accessToken) {
    throw new Error('Google authentication required');
  }
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken
  };
}

export async function GET(request: NextRequest) {
  let validToken: any = null;
  let authType = 'unknown';
  
  try {
    // Check if we have Google OAuth tokens in cookies (for protected pages)
    const hasGoogleTokens = request.cookies.get('google_access_token')?.value;
    
    // Get the Authorization header (for API tokens)
    const authHeader = request.headers.get('authorization');
    
    // If no Google tokens and no auth header, require authentication
    if (!hasGoogleTokens && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json(
        { error: 'Authentication required. Either Google OAuth cookies or Authorization header needed.' },
        { status: 401 }
      );
    }

    // If we have an auth header, validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      // Try to validate as website JWT first
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
        validToken = {
          id: decoded.userId || '1',
          name: decoded.username || 'website-user',
          permissions: ['*'],
          email: decoded.email,
          type: 'website-jwt'
        };
        authType = 'website-jwt';
      } catch (jwtError: any) {
        // Try to validate as API token
        const validation = await validateApiToken(authHeader);
        
        if (!validation.isValid || !validation.token) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Invalid token. Please check your API token or JWT.' 
            },
            { status: 401 }
          );
        }
        
        validToken = validation.token;
        authType = 'api-token';
        
        // Check permissions for API tokens
        if (!hasPermission(validToken, 'read:gmail')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Insufficient permissions. Token requires read:gmail permission' 
            },
            { status: 403 }
          );
        }
      }
    } else {
      // Using Google OAuth cookies (protected page)
      validToken = {
        id: '1',
        name: 'google-oauth-user',
        permissions: ['*'],
        email: 'user@example.com',
        type: 'google-oauth'
      };
      authType = 'google-oauth';
    }
    
    // Get Google authentication, with refresh fallback
    let googleTokens: { access_token: string; refresh_token?: string } | null = null;
    try {
      googleTokens = getGoogleAuth(request);
    } catch {}
    const refreshToken = request.cookies.get('google_refresh_token')?.value
      ? decodeURIComponent(request.cookies.get('google_refresh_token')!.value)
      : undefined;
    if (!googleTokens?.access_token && refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        googleTokens = { access_token: refreshed.access_token, refresh_token: refreshToken };
      } catch {}
    }
    if (!googleTokens?.access_token) {
      return NextResponse.json({ success: false, message: 'Google authentication required' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    
    // List messages - direct API call to avoid TypeScript issues
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${googleTokens.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    const messagesData = await response.json();
    const messages = messagesData.messages || [];
    
    // Fetch message details to include headers/snippet required by client classifier
    const detailed = await Promise.all(
      messages.slice(0, maxResults).map(async (m: any) => {
        try {
          const d = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
            {
              headers: {
                'Authorization': `Bearer ${googleTokens!.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (!d.ok) return null;
          const detail = await d.json();
          return {
            id: detail.id,
            snippet: detail.snippet || '',
            payload: { headers: detail.payload?.headers || [] },
            labelIds: detail.labelIds || [],
            internalDate: detail.internalDate ? new Date(parseInt(detail.internalDate)) : new Date(),
          };
        } catch {
          return null;
        }
      })
    );
    const emails = detailed.filter(Boolean);
    
    console.log(`📧 Retrieved ${emails.length} detailed Gmail messages from API`);
    
    return NextResponse.json({
      success: true,
      data: emails,
      message: 'Gmail messages retrieved successfully',
      authType,
      token: {
        name: validToken.name,
        permissions: validToken.permissions,
        type: validToken.type
      }
    });
    
  } catch (error: any) {
    console.error('Gmail messages GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to retrieve messages'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let validToken: any = null;
  
  try {
    // Check if we have Google OAuth tokens in cookies (for protected pages)
    const hasGoogleTokens = request.cookies.get('google_access_token')?.value;
    
    // Get the Authorization header (for API tokens)
    const authHeader = request.headers.get('authorization');
    
    // If no Google tokens and no auth header, require authentication
    if (!hasGoogleTokens && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json(
        { error: 'Authentication required. Either Google OAuth cookies or Authorization header needed.' },
        { status: 401 }
      );
    }

    // If we have an auth header, validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      // Try to validate as website JWT first
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
        validToken = {
          id: decoded.userId || '1',
          name: decoded.username || 'website-user',
          permissions: ['*'],
          email: decoded.email,
          type: 'website-jwt'
        };
      } catch (jwtError: any) {
        // Try to validate as API token
        const validation = await validateApiToken(authHeader);
        
        if (!validation.isValid || !validation.token) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Invalid token. Please check your API token or JWT.' 
            },
            { status: 401 }
          );
        }
        
        validToken = validation.token;
        
        // Check permissions for API tokens
        if (!hasPermission(validToken, 'write:gmail')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Insufficient permissions. Token requires write:gmail permission' 
            },
            { status: 403 }
          );
        }
      }
    } else {
      // Using Google OAuth cookies (protected page)
      validToken = {
        id: '1',
        name: 'google-oauth-user',
        permissions: ['*'],
        email: 'user@example.com',
        type: 'google-oauth'
      };
    }
    
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    const gmail = new Gmail(googleTokens.access_token);
    
    const body = await request.json();
    const { to, subject, message, html } = body;
    
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'To, subject, and message are required' },
        { status: 400 }
      );
    }
    
    // Send email (Note: Gmail class would need sendMessage method)
    return NextResponse.json({
      success: true,
      message: 'Email sending not yet implemented - Gmail API integration needed',
      token: {
        name: validToken.name,
        permissions: validToken.permissions,
        type: validToken.type
      }
    });
    
  } catch (error: any) {
    console.error('Gmail send error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send email'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  let validToken: any = null;
  
  try {
    // Check if we have Google OAuth tokens in cookies (for protected pages)
    const hasGoogleTokens = request.cookies.get('google_access_token')?.value;
    
    // Get the Authorization header (for API tokens)
    const authHeader = request.headers.get('authorization');
    
    // If no Google tokens and no auth header, require authentication
    if (!hasGoogleTokens && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json(
        { error: 'Authentication required. Either Google OAuth cookies or Authorization header needed.' },
        { status: 401 }
      );
    }

    // If we have an auth header, validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      // Try to validate as website JWT first
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
        validToken = {
          id: decoded.userId || '1',
          name: decoded.username || 'website-user',
          permissions: ['*'],
          email: decoded.email,
          type: 'website-jwt'
        };
      } catch (jwtError: any) {
        // Try to validate as API token
        const validation = await validateApiToken(authHeader);
        
        if (!validation.isValid || !validation.token) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Invalid token. Please check your API token or JWT.' 
            },
            { status: 401 }
          );
        }
        
        validToken = validation.token;
        
        // Check permissions for API tokens
        if (!hasPermission(validToken, 'delete:gmail')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Insufficient permissions. Token requires delete:gmail permission' 
            },
            { status: 403 }
          );
        }
      }
    } else {
      // Using Google OAuth cookies (protected page)
      validToken = {
        id: '1',
        name: 'google-oauth-user',
        permissions: ['*'],
        email: 'user@example.com',
        type: 'google-oauth'
      };
    }
    
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    const gmail = new Gmail(googleTokens.access_token);
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // Delete message (Note: Gmail class would need deleteMessage method)
    return NextResponse.json({
      success: true,
      message: 'Message deletion not yet implemented - Gmail API integration needed',
      token: {
        name: validToken.name,
        permissions: validToken.permissions,
        type: validToken.type
      }
    });
    
  } catch (error: any) {
    console.error('Gmail delete error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete message'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}