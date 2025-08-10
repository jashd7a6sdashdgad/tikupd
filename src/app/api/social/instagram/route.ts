import { NextRequest, NextResponse } from 'next/server';

const FACEBOOK_API_URL = 'https://graph.facebook.com/v18.0';
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  if (!PAGE_ID || !ACCESS_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'Instagram credentials not configured'
    }, { status: 400 });
  }

  try {
    let data;

    switch (action) {
      case 'stats':
        data = await getInstagramStats();
        break;
      case 'posts':
        data = await getInstagramPosts();
        break;
      case 'profile':
        data = await getInstagramProfile();
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Instagram API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch Instagram data'
    }, { status: 500 });
  }
}

async function getInstagramStats() {
  try {
    // Get Instagram Business Account ID from Facebook Page
    const pageResponse = await fetch(
      `${FACEBOOK_API_URL}/${PAGE_ID}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`
    );
    
    if (!pageResponse.ok) {
      throw new Error('Failed to get Instagram business account');
    }
    
    const pageData = await pageResponse.json();
    const instagramAccountId = pageData.instagram_business_account?.id;
    
    if (!instagramAccountId) {
      // Return default stats if no Instagram account connected
      return {
        followers_count: 0,
        media_count: 0,
        engagement_rate: 0,
        connected: false
      };
    }

    // Get Instagram account stats
    const statsResponse = await fetch(
      `${FACEBOOK_API_URL}/${instagramAccountId}?fields=followers_count,media_count&access_token=${ACCESS_TOKEN}`
    );
    
    if (!statsResponse.ok) {
      throw new Error('Failed to get Instagram stats');
    }
    
    const statsData = await statsResponse.json();
    
    // Calculate engagement rate (this would need more complex logic in real implementation)
    const engagementRate = 5.2; // Placeholder - would need to calculate from actual engagement data
    
    return {
      followers_count: statsData.followers_count || 0,
      media_count: statsData.media_count || 0,
      engagement_rate: engagementRate,
      connected: true,
      account_id: instagramAccountId
    };
  } catch (error) {
    console.error('Error getting Instagram stats:', error);
    // Return default stats on error
    return {
      followers_count: 0,
      media_count: 0,
      engagement_rate: 0,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getInstagramPosts() {
  try {
    // Get Instagram Business Account ID
    const pageResponse = await fetch(
      `${FACEBOOK_API_URL}/${PAGE_ID}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`
    );
    
    if (!pageResponse.ok) {
      throw new Error('Failed to get Instagram business account');
    }
    
    const pageData = await pageResponse.json();
    const instagramAccountId = pageData.instagram_business_account?.id;
    
    if (!instagramAccountId) {
      return [];
    }

    // Get recent Instagram posts
    const postsResponse = await fetch(
      `${FACEBOOK_API_URL}/${instagramAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${ACCESS_TOKEN}`
    );
    
    if (!postsResponse.ok) {
      throw new Error('Failed to get Instagram posts');
    }
    
    const postsData = await postsResponse.json();
    return postsData.data || [];
  } catch (error) {
    console.error('Error getting Instagram posts:', error);
    return [];
  }
}

async function getInstagramProfile() {
  try {
    // Get Instagram Business Account ID
    const pageResponse = await fetch(
      `${FACEBOOK_API_URL}/${PAGE_ID}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`
    );
    
    if (!pageResponse.ok) {
      throw new Error('Failed to get Instagram business account');
    }
    
    const pageData = await pageResponse.json();
    const instagramAccountId = pageData.instagram_business_account?.id;
    
    if (!instagramAccountId) {
      return {
        connected: false,
        message: 'No Instagram Business Account connected to this Facebook Page'
      };
    }

    // Get Instagram profile info
    const profileResponse = await fetch(
      `${FACEBOOK_API_URL}/${instagramAccountId}?fields=username,name,profile_picture_url,biography,website&access_token=${ACCESS_TOKEN}`
    );
    
    if (!profileResponse.ok) {
      throw new Error('Failed to get Instagram profile');
    }
    
    const profileData = await profileResponse.json();
    return {
      ...profileData,
      connected: true
    };
  } catch (error) {
    console.error('Error getting Instagram profile:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}