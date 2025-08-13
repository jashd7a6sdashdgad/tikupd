import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({
        error: 'Google OAuth not configured',
        message: 'GOOGLE_CLIENT_ID is missing'
      }, { status: 500 });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.mahboobagents.fun'
      : 'http://localhost:3000';

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${baseUrl}/api/youtube/auth/callback`,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtubepartner',
        'https://www.googleapis.com/auth/yt-analytics.readonly'
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      url: authUrl,
      message: 'Authorization URL generated'
    });

  } catch (error) {
    console.error('Auth URL generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate auth URL'
    }, { status: 500 });
  }
}