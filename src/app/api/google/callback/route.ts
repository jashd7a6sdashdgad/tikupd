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
    
    // ALSO save tokens to file for API access
    try {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      
      // Create tokens directory if it doesn't exist
      const tokensDir = path.join(process.cwd(), 'data', 'tokens');
      await fs.mkdir(tokensDir, { recursive: true });
      
      // Save Google OAuth tokens to file for API access
      const tokenData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString()
      };
      
      const tokensFile = path.join(tokensDir, 'google-oauth-tokens.json');
      await fs.writeFile(tokensFile, JSON.stringify(tokenData, null, 2));
      
      console.log('💾 Google OAuth tokens also saved to file for API access');
      
    } catch (fileError) {
      console.log('⚠️ Could not save tokens to file:', fileError);
      // Don't fail the OAuth flow, just log the error
    }
    
    return response;

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tracking?error=token_exchange_failed`
    );
  }
}