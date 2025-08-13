import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    const expiresAt = cookieStore.get('youtube_expires_at');

    if (!accessToken || !refreshToken || !expiresAt) {
      return NextResponse.json({
        authenticated: false,
        message: 'No YouTube tokens found'
      });
    }

    const now = Date.now();
    const expires = parseInt(expiresAt.value);

    if (now >= expires) {
      // Token expired, try to refresh
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken.value,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshData.access_token) {
          // Update cookies with new token
          const response = NextResponse.json({
            authenticated: true,
            message: 'Token refreshed successfully'
          });

          response.cookies.set('youtube_access_token', refreshData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: refreshData.expires_in || 3600,
          });

          response.cookies.set('youtube_expires_at', (now + (refreshData.expires_in * 1000)).toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: refreshData.expires_in || 3600,
          });

          return response;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }

      return NextResponse.json({
        authenticated: false,
        message: 'Token expired and refresh failed'
      });
    }

    return NextResponse.json({
      authenticated: true,
      message: 'Valid authentication'
    });

  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'Authentication check failed'
    }, { status: 500 });
  }
}