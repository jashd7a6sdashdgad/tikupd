import { NextRequest, NextResponse } from 'next/server';
import { Gmail } from '@/lib/google';

// Helper function to get Google auth from cookies or env
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
    // no-cache to avoid any edge caching glitch
    cache: 'no-store'
  });
  if (!tokenResponse.ok) throw new Error('Failed to refresh token');
  return tokenResponse.json() as Promise<{ access_token: string; expires_in?: number }>;
}

function getGoogleAuth(request: NextRequest) {
  // Try cookies first
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (accessToken) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }
  
  // Fallback to environment variables
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (envAccessToken) {
    return {
      access_token: envAccessToken,
      refresh_token: envRefreshToken
    };
  }
  
  throw new Error('Google authentication required');
}

export async function GET(request: NextRequest) {
  try {
    // Try to get tokens from cookies/env
    let googleTokens = (() => {
      try { return getGoogleAuth(request); } catch { return null; }
    })();

    const refreshToken = request.cookies.get('google_refresh_token')?.value
      ? decodeURIComponent(request.cookies.get('google_refresh_token')!.value)
      : undefined;

    // If no access token but we have a refresh token, try to refresh
    let response: NextResponse | null = null;
    if (!googleTokens?.access_token && refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        googleTokens = { access_token: refreshed.access_token, refresh_token: refreshToken } as any;
        response = NextResponse.next();
        response.cookies.set('google_access_token', refreshed.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: (refreshed.expires_in || 3600)
        });
      } catch (e) {
        // fall through; will return 401 below
      }
    }

    if (!googleTokens?.access_token) {
      return NextResponse.json({ success: false, message: 'Google authentication required' }, { status: 401 });
    }

    const gmail = new Gmail(googleTokens.access_token);
    
    // Get unread count
    const count = await gmail.getUnreadCount();
    
    const payload = {
      success: true,
      data: { count },
      message: 'Gmail unread count retrieved successfully'
    };
    return response ? NextResponse.json(payload, { headers: response.headers }) : NextResponse.json(payload);
    
  } catch (error: any) {
    console.error('Gmail unread count error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to retrieve unread count'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}