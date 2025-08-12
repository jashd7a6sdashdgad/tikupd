import { NextRequest, NextResponse } from 'next/server';

const FACEBOOK_API_URL = 'https://graph.facebook.com/v18.0';
// Use single user token from .env.local for main account
const ACCESS_TOKEN = process.env.FACEBOOK_USER_TOKEN;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  if (!ACCESS_TOKEN) {
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
    // For personal accounts, Instagram Business accounts are typically connected to Facebook Pages
    // Since we're using a personal account, we'll return a message about this limitation
    return {
      followers_count: 0,
      media_count: 0,
      engagement_rate: 0,
      connected: false,
      message: 'Instagram Business accounts require a Facebook Page. Using personal account.',
      note: 'To access Instagram Business features, you need to connect your Instagram account to a Facebook Page.'
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
    // For personal accounts, Instagram Business accounts are typically connected to Facebook Pages
    return {
      posts: [],
      message: 'Instagram Business accounts require a Facebook Page. Using personal account.',
      note: 'To access Instagram posts, you need to connect your Instagram account to a Facebook Page.'
    };
  } catch (error) {
    console.error('Error getting Instagram posts:', error);
    return {
      posts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getInstagramProfile() {
  try {
    // For personal accounts, Instagram Business accounts are typically connected to Facebook Pages
    return {
      connected: false,
      message: 'Instagram Business accounts require a Facebook Page. Using personal account.',
      note: 'To access Instagram profile, you need to connect your Instagram account to a Facebook Page.',
      username: null,
      name: null,
      profile_picture_url: null,
      biography: null,
      website: null
    };
  } catch (error) {
    console.error('Error getting Instagram profile:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}