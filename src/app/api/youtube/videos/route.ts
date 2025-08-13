import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('youtube_access_token');
  const refreshToken = cookieStore.get('youtube_refresh_token');
  const expiresAt = cookieStore.get('youtube_expires_at');

  if (!accessToken || !expiresAt) return null;

  const now = Date.now();
  const expires = parseInt(expiresAt.value);

  if (now < expires) return accessToken.value;
  if (!refreshToken) return null;

  try {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken.value,
        grant_type: 'refresh_token',
      }),
    });

    const refreshData = await refreshResponse.json();
    if (refreshData.access_token) return refreshData.access_token;
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
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!channelResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch channel',
        message: 'Could not retrieve channel information'
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

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=12&order=date`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!videosResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch videos',
        message: 'Could not retrieve video list'
      }, { status: videosResponse.status });
    }

    const videosData = await videosResponse.json();

    if (!videosData.items) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No videos found'
      });
    }

    const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId).join(',');
    
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    const statsData = statsResponse.ok ? await statsResponse.json() : { items: [] };
    
    const statsMap = new Map();
    if (statsData.items) {
      statsData.items.forEach((item: any) => {
        statsMap.set(item.id, {
          viewCount: parseInt(item.statistics.viewCount) || 0,
          likeCount: parseInt(item.statistics.likeCount) || 0,
          commentCount: parseInt(item.statistics.commentCount) || 0,
          duration: item.contentDetails.duration || 'PT0S'
        });
      });
    }

    const videos = videosData.items.map((item: any) => {
      const videoId = item.contentDetails.videoId;
      const stats = statsMap.get(videoId) || { viewCount: 0, likeCount: 0, commentCount: 0, duration: 'PT0S' };
      
      return {
        id: { videoId },
        snippet: {
          title: item.snippet.title,
          description: item.snippet.description || '',
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails || {},
          channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle
        },
        statistics: stats,
        contentDetails: {
          duration: stats.duration
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: videos,
      total: videos.length
    });

  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch videos'
    }, { status: 500 });
  }
}