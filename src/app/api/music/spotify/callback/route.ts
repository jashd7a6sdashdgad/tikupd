import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle authorization errors
    if (error) {
      console.error('Spotify authorization error:', error);
      return NextResponse.redirect(new URL('/music?error=access_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/music?error=no_code', request.url));
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('Spotify credentials not configured');
      return NextResponse.redirect(new URL('/music?error=config_missing', request.url));
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${new URL(request.url).origin}/api/music/spotify/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Spotify token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/music?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user profile
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to get Spotify user profile');
      return NextResponse.redirect(new URL('/music?error=profile_failed', request.url));
    }

    const userData = await userResponse.json();

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/music?connected=true', request.url));
    
    // Store tokens in secure httpOnly cookies
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    
    response.cookies.set('spotify_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });
    
    if (refresh_token) {
      response.cookies.set('spotify_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      });
    }
    
    response.cookies.set('spotify_user_id', userData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
    });

    return response;

  } catch (error: any) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(new URL('/music?error=callback_failed', request.url));
  }
}