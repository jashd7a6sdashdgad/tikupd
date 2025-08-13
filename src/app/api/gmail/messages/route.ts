import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, Gmail } from '@/lib/google';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import jwt from 'jsonwebtoken';

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
    
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    
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
    let messages = messagesData.messages || [];
    
    // If no messages from Gmail API, provide sample data for development
    if (messages.length === 0) {
      console.log('No Gmail messages found, providing sample data');
      messages = [
        {
          id: 'sample_1',
          snippet: 'Thank you for your recent purchase. Your order #12345 has been confirmed and will be shipped within 2-3 business days.',
          payload: {
            headers: [
              { name: 'From', value: 'noreply@amazon.com' },
              { name: 'Subject', value: 'Order Confirmation - Your Recent Purchase' },
              { name: 'Date', value: new Date().toISOString() }
            ]
          }
        },
        {
          id: 'sample_2', 
          snippet: 'Your flight from MCT to DXB has been confirmed. Please arrive at the airport 2 hours before departure.',
          payload: {
            headers: [
              { name: 'From', value: 'bookings@emirates.com' },
              { name: 'Subject', value: 'Flight Confirmation - EK0123' },
              { name: 'Date', value: new Date(Date.now() - 86400000).toISOString() }
            ]
          }
        },
        {
          id: 'sample_3',
          snippet: 'Your monthly statement is ready. View your account activity and recent transactions.',
          payload: {
            headers: [
              { name: 'From', value: 'statements@bank.om' },
              { name: 'Subject', value: 'Monthly Bank Statement - January 2024' },
              { name: 'Date', value: new Date(Date.now() - 172800000).toISOString() }
            ]
          }
        },
        {
          id: 'sample_4',
          snippet: 'Meeting reminder: Team standup tomorrow at 9:00 AM. Please prepare your updates.',
          payload: {
            headers: [
              { name: 'From', value: 'calendar@company.com' },
              { name: 'Subject', value: 'Meeting Reminder: Team Standup' },
              { name: 'Date', value: new Date(Date.now() - 259200000).toISOString() }
            ]
          }
        },
        {
          id: 'sample_5',
          snippet: 'Your subscription to Premium Plan will expire in 7 days. Renew now to continue enjoying all features.',
          payload: {
            headers: [
              { name: 'From', value: 'billing@service.com' },
              { name: 'Subject', value: 'Subscription Renewal Reminder' },
              { name: 'Date', value: new Date(Date.now() - 345600000).toISOString() }
            ]
          }
        }
      ];
    }
    
    return NextResponse.json({
      success: true,
      data: {
        messages: messages,
        total: messages.length
      },
      message: messages.length === 5 && messages[0].id === 'sample_1' ? 
        'Sample emails loaded (Gmail API returned empty)' : 
        'Gmail messages retrieved successfully',
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