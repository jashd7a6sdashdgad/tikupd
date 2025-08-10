import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tracking?error=oauth_denied`
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tracking?error=no_code`
      );
    }

    console.log('🔄 Exchanging authorization code for tokens...');

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    console.log('✅ Tokens received successfully');

    // Create response with tokens in cookies
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tracking?success=oauth_complete`
    );

    // Set cookies with tokens (handle different token structure)
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiresIn = tokens.expiry_date ? 
      Math.floor((tokens.expiry_date - Date.now()) / 1000) : 
      3600;

    if (accessToken) {
      response.cookies.set('google_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn
      });
    }

    if (refreshToken) {
      response.cookies.set('google_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    console.log('🍪 Tokens stored in cookies');
    return response;

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tracking?error=token_exchange_failed`
    );
  }
}