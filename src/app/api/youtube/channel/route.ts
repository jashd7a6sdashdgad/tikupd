import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('youtube_access_token');
  const refreshToken = cookieStore.get('youtube_refresh_token');
  const expiresAt = cookieStore.get('youtube_expires_at');

  if (!accessToken || !expiresAt) {
    return null;
  }

  const now = Date.now();
  const expires = parseInt(expiresAt.value);

  if (now < expires) {
    return accessToken.value;
  }

  if (!refreshToken) {
    return null;
  }

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
      return refreshData.access_token;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No valid access token',
        message: 'Please authenticate with YouTube first'
      }, { status: 401 });
    }

    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!channelResponse.ok) {
      const errorData = await channelResponse.text();
      console.error('YouTube API error:', errorData);
      return NextResponse.json({
        success: false,
        error: 'YouTube API error',
        message: `Failed to fetch channel data: ${channelResponse.status}`
      }, { status: channelResponse.status });
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No channel found',
        message: 'No YouTube channel found for this account'
      }, { status: 404 });
    }

    const channel = channelData.items[0];
    
    return NextResponse.json({
      success: true,
      data: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
        customUrl: channel.snippet.customUrl || null,
        publishedAt: channel.snippet.publishedAt,
        country: channel.snippet.country || null
      }
    });

  } catch (error) {
    console.error('Channel API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch channel data'
    }, { status: 500 });
  }
}