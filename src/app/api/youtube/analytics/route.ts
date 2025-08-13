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

    // Get channel ID first
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
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

    const channelId = channelData.items[0].id;
    
    // Generate date ranges for analytics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    try {
      // Try to get YouTube Analytics data (requires additional permissions)
      const analyticsResponse = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?` +
        `ids=channel==${channelId}&` +
        `startDate=${startDateStr}&` +
        `endDate=${endDateStr}&` +
        `metrics=views,comments,likes,dislikes,shares,estimatedMinutesWatched,averageViewDuration&` +
        `dimensions=day`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        
        return NextResponse.json({
          success: true,
          data: {
            timeRange: {
              startDate: startDateStr,
              endDate: endDateStr
            },
            analytics: analyticsData.rows || [],
            columnHeaders: analyticsData.columnHeaders || [],
            kind: analyticsData.kind
          }
        });
      } else {
        // Fallback to basic channel statistics if analytics not available
        const basicStatsResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (basicStatsResponse.ok) {
          const basicStatsData = await basicStatsResponse.json();
          const stats = basicStatsData.items[0]?.statistics || {};
          
          return NextResponse.json({
            success: true,
            data: {
              timeRange: {
                startDate: startDateStr,
                endDate: endDateStr
              },
              basicStats: {
                totalViews: parseInt(stats.viewCount) || 0,
                totalSubscribers: parseInt(stats.subscriberCount) || 0,
                totalVideos: parseInt(stats.videoCount) || 0,
                hiddenSubscriberCount: stats.hiddenSubscriberCount || false
              },
              note: 'Advanced analytics require YouTube Analytics API permissions'
            }
          });
        }
      }
    } catch (analyticsError) {
      console.error('Analytics API error:', analyticsError);
    }

    // Ultimate fallback - return mock analytics structure
    return NextResponse.json({
      success: true,
      data: {
        timeRange: {
          startDate: startDateStr,
          endDate: endDateStr
        },
        mockData: true,
        analytics: [
          // Sample data structure
          {
            date: endDateStr,
            views: 0,
            watchTime: 0,
            subscribers: 0
          }
        ],
        note: 'Analytics data requires additional YouTube Analytics API permissions. Connect your channel with proper scopes to view detailed analytics.'
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}