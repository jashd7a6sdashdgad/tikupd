import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Exchange authorization code for tokens using server-side credentials
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Google OAuth token exchange failed:', await tokenResponse.text());
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    // Return tokens to client (client secret is not included)
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
    });

  } catch (error) {
    console.error('Google OAuth exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 