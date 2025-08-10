import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { ENV_VARS } from '@/lib/env-validation';
import { getApiConfig, getSocialConfig } from '@/lib/config';

// Use validated environment variables
const FACEBOOK_PAGE_ACCESS_TOKEN = ENV_VARS.FACEBOOK_PAGE_ACCESS_TOKEN;
const { facebookApiUrl: FACEBOOK_API_URL } = getApiConfig();
const socialConfig = getSocialConfig();
const FACEBOOK_PAGE_ID = ENV_VARS.FACEBOOK_PAGE_ID || socialConfig.facebook?.pageId;

// Helper function to check if token is expired
function isFacebookTokenExpired(errorMessage: string): boolean {
  return errorMessage.includes('Session has expired') || 
         errorMessage.includes('token has expired') ||
         errorMessage.includes('expired') ||
         errorMessage.includes('OAuthException');
}

// Helper function to check if token is invalid
function isFacebookTokenInvalid(errorMessage: string): boolean {
  return errorMessage.includes('Invalid OAuth access token') ||
         errorMessage.includes('Malformed access token') ||
         errorMessage.includes('Error validating access token');
}

interface FacebookPostRequest {
  action: 'post' | 'get_posts' | 'get_insights' | 'get_page_info' | 'test_token';
  message?: string;
  link?: string;
  scheduled_publish_time?: number;
  published?: boolean;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    
    if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
      const tokenMask = FACEBOOK_PAGE_ACCESS_TOKEN ? 
        `${FACEBOOK_PAGE_ACCESS_TOKEN.substring(0, 6)}...${FACEBOOK_PAGE_ACCESS_TOKEN.substring(FACEBOOK_PAGE_ACCESS_TOKEN.length - 4)}` : 
        'NOT_SET';
      
      console.error('🚨 Facebook configuration missing:');
      console.error(`  Access Token: ${tokenMask} (Length: ${FACEBOOK_PAGE_ACCESS_TOKEN?.length || 0})`);
      console.error(`  Page ID: ${FACEBOOK_PAGE_ID || 'NOT_SET'}`);
      console.error('  Please check your .env.local file and ensure variables are properly set');
      
      return NextResponse.json({
        success: false, 
        message: 'Facebook API is not configured. Please set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in your environment variables.',
        error: 'FACEBOOK_CONFIG_ERROR',
        help: 'Check your .env.local file and restart the server',
        details: {
          missingToken: !FACEBOOK_PAGE_ACCESS_TOKEN,
          missingPageId: !FACEBOOK_PAGE_ID,
          tokenLength: FACEBOOK_PAGE_ACCESS_TOKEN?.length || 0
        }
      }, { status: 500 });
    }
    
    const body: FacebookPostRequest = await request.json();
    console.log('Facebook API request:', body);
    
    // Validate required fields
    if (!body.action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }
    
    let facebookResponse;
    
    switch (body.action) {
      case 'post':
        if (!body.message && !body.link) {
          return NextResponse.json(
            { success: false, message: 'Message or link is required for posting' },
            { status: 400 }
          );
        }
        
        const postData: any = {
          access_token: FACEBOOK_PAGE_ACCESS_TOKEN
        };
        
        if (body.message) postData.message = body.message;
        if (body.link) postData.link = body.link;
        if (body.scheduled_publish_time) {
          postData.scheduled_publish_time = body.scheduled_publish_time;
          postData.published = false;
        } else {
          postData.published = body.published !== false;
        }
        
        facebookResponse = await fetch(`${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
        break;
        
      case 'get_posts':
        const limit = body.limit || 10;
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}/posts?limit=${limit}&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
        );
        break;
        
      case 'get_insights':
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}/insights?metric=page_impressions,page_reach,page_likes&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
        );
        break;
        
      case 'get_page_info':
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}?fields=name,likes,followers_count,about,website,phone&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
        );
        break;
        
      case 'test_token':
        // Test the access token validity by getting basic page info
        console.log('🔍 Testing Facebook token validity...');
        console.log(`🔍 Page ID: ${FACEBOOK_PAGE_ID}`);
        console.log(`🔍 Token (first 20 chars): ${FACEBOOK_PAGE_ACCESS_TOKEN?.substring(0, 20)}...`);
        
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}?fields=id,name,access_token&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
        );
        
        // Log the response for debugging
        const testResult = await facebookResponse.text();
        console.log('🔍 Facebook test response status:', facebookResponse.status);
        console.log('🔍 Facebook test response:', testResult);
        
        // Re-create response for further processing
        facebookResponse = new Response(testResult, {
          status: facebookResponse.status,
          statusText: facebookResponse.statusText,
          headers: facebookResponse.headers
        });
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use post, get_posts, get_insights, get_page_info, or test_token' },
          { status: 400 }
        );
    }
    
    if (!facebookResponse.ok) {
      const errorText = await facebookResponse.text();
      
      let errorDetail = errorText;
      let errorJson: any = null;
      
      try {
        errorJson = JSON.parse(errorText);
        errorDetail = errorJson?.error?.message || errorText;
      } catch (e) {
        // Use raw text if not JSON
      }
      
      const tokenMask = FACEBOOK_PAGE_ACCESS_TOKEN ? 
        `${FACEBOOK_PAGE_ACCESS_TOKEN.substring(0, 6)}...${FACEBOOK_PAGE_ACCESS_TOKEN.substring(FACEBOOK_PAGE_ACCESS_TOKEN.length - 4)}` : 
        'NOT_SET';
      
      console.error('🚨 Facebook API Error:');
      console.error(`  Status: ${facebookResponse.status}`);
      console.error(`  Error: ${errorDetail}`);
      console.error(`  Token: ${tokenMask}`);
      console.error(`  Page ID: ${FACEBOOK_PAGE_ID}`);
      
      // Check for specific error types
      if (isFacebookTokenExpired(errorDetail)) {
        console.error('  🕒 Facebook token has EXPIRED - please refresh your access token');
        return NextResponse.json({
          success: false,
          message: `Facebook token expired: ${errorDetail}. Please generate a new long-lived access token from Facebook Developer Console.`,
          error: 'FACEBOOK_TOKEN_EXPIRED',
          help: 'Go to Facebook Developer Console → Graph API Explorer → Generate new long-lived token',
          details: { errorDetail, tokenMask, pageId: FACEBOOK_PAGE_ID }
        }, { status: 401 });
      }
      
      if (isFacebookTokenInvalid(errorDetail)) {
        console.error('  🔑 Facebook token is INVALID - please check your access token');
        return NextResponse.json({
          success: false,
          message: `Facebook token invalid: ${errorDetail}. Please verify your FACEBOOK_PAGE_ACCESS_TOKEN is correct.`,
          error: 'FACEBOOK_TOKEN_INVALID',
          help: 'Verify your access token from Facebook Developer Console',
          details: { errorDetail, tokenMask, pageId: FACEBOOK_PAGE_ID }
        }, { status: 401 });
      }
      
      // Handle other status codes
      if (facebookResponse.status === 400) {
        console.error('  📋 Facebook API configuration error');
        return NextResponse.json({
          success: false,
          message: `Facebook API configuration error: ${errorDetail}. Please verify your page ID and token permissions.`,
          error: 'FACEBOOK_CONFIG_ERROR',
          help: 'Check your FACEBOOK_PAGE_ID and ensure your token has required permissions',
          details: { errorDetail, tokenMask, pageId: FACEBOOK_PAGE_ID }
        }, { status: 400 });
      }
      
      if (facebookResponse.status === 403) {
        console.error('  🚫 Facebook permission denied');
        return NextResponse.json({
          success: false,
          message: `Facebook permission denied: ${errorDetail}. Your token may not have sufficient permissions.`,
          error: 'FACEBOOK_PERMISSION_ERROR',
          help: 'Ensure your access token has pages_read_engagement and pages_manage_posts permissions',
          details: { errorDetail, tokenMask, pageId: FACEBOOK_PAGE_ID }
        }, { status: 403 });
      }
      
      // Generic error
      console.error('  ❌ Unexpected Facebook API error');
      throw new Error(`Facebook API failed with status: ${facebookResponse.status} - ${errorDetail}`);
    }
    
    const facebookResult = await facebookResponse.json();
    console.log('Facebook API response:', facebookResult);
    
    return NextResponse.json({
      success: true,
      data: facebookResult,
      message: `${body.action} completed successfully`,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Facebook API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process Facebook request'
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'page_info';

  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'Facebook credentials not configured'
    }, { status: 400 });
  }

  try {
    let data;

    switch (action) {
      case 'page_info':
        data = await getPageInfo();
        break;
      case 'posts':
        data = await getPagePosts();
        break;
      case 'insights':
        data = await getPageInsights();
        break;
      case 'followers':
        data = await getPageFollowers();
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
    console.error('Facebook API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch Facebook data'
    }, { status: 500 });
  }
}

async function getPageInfo() {
  try {
    const response = await fetch(
      `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}?fields=id,name,username,fan_count,followers_count,verification_status,category,phone,website,location,description,cover,profile_picture&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get Facebook page info');
    }
    
    const pageData = await response.json();
    
    // Calculate engagement rate (this would need more complex logic in real implementation)
    const engagementRate = 8.2; // Placeholder - would need to calculate from actual engagement data
    
    return {
      ...pageData,
      engagement_rate: engagementRate,
      connected: true
    };
  } catch (error) {
    console.error('Error getting Facebook page info:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getPagePosts() {
  try {
    const response = await fetch(
      `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}/posts?fields=id,message,created_time,type,permalink_url,full_picture,shares,comments.summary(true),reactions.summary(true)&limit=10&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get Facebook posts');
    }
    
    const postsData = await response.json();
    return postsData.data || [];
  } catch (error) {
    console.error('Error getting Facebook posts:', error);
    return [];
  }
}

async function getPageInsights() {
  try {
    // Get page insights for the last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const until = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}/insights?metric=page_views_total,page_fans,page_fan_adds,page_impressions,page_engaged_users&period=day&since=${since}&until=${until}&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get Facebook insights');
    }
    
    const insightsData = await response.json();
    return insightsData.data || [];
  } catch (error) {
    console.error('Error getting Facebook insights:', error);
    return [];
  }
}

async function getPageFollowers() {
  try {
    const response = await fetch(
      `${FACEBOOK_API_URL}/${FACEBOOK_PAGE_ID}?fields=followers_count,followers&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get Facebook followers');
    }
    
    const followersData = await response.json();
    return {
      total_followers: followersData.followers_count || 0,
      followers: followersData.followers?.data || []
    };
  } catch (error) {
    console.error('Error getting Facebook followers:', error);
    return {
      total_followers: 0,
      followers: []
    };
  }
}