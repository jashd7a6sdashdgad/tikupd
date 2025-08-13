import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token) {
      return NextResponse.json(
        { success: false, error: 'access_token is required' },
        { status: 400 }
      );
    }

    // Save tokens to a secure file
    const tokensDir = path.join(process.cwd(), 'data', 'tokens');
    const tokensFile = path.join(tokensDir, 'google-oauth-tokens.json');

    // Ensure directory exists
    try {
      await fs.mkdir(tokensDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const tokenData = {
      access_token,
      refresh_token: refresh_token || null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    };

    await fs.writeFile(tokensFile, JSON.stringify(tokenData, null, 2));
    
    console.log('✅ Google OAuth tokens saved successfully');
    console.log('📅 Access token expires at:', tokenData.expires_at);

    return NextResponse.json({
      success: true,
      message: 'Google OAuth tokens saved successfully',
      expires_at: tokenData.expires_at
    });

  } catch (error: any) {
    console.error('❌ Failed to save Google OAuth tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save tokens', details: error.message },
      { status: 500 }
    );
  }
}