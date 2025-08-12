import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { ENV_VARS } from '@/lib/env-validation';
import { getApiConfig, getSocialConfig } from '@/lib/config';

// Use single user token from .env.local for main account
const FACEBOOK_USER_ACCESS_TOKEN = process.env.FACEBOOK_USER_TOKEN;
const { facebookApiUrl: FACEBOOK_API_URL } = getApiConfig();
const socialConfig = getSocialConfig();
// No page ID needed - using main account

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
  action: 'connect' | 'post' | 'get_posts' | 'get_insights' | 'get_page_info' | 'get_user_info' | 'get_user_stats' | 'test_token';
  message?: string;
  link?: string;
  scheduled_publish_time?: number;
  published?: boolean;
  limit?: number;
}

export async function GET(request: NextRequest) {
  // Simple GET endpoint to check configuration status
  return NextResponse.json({
    success: true,
    config: {
      hasToken: !!process.env.FACEBOOK_USER_TOKEN,
      tokenLength: process.env.FACEBOOK_USER_TOKEN?.length || 0,
      accountType: 'User Account (not Page)',
      message: 'Facebook API configuration check - using main account'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('🔍 Facebook API Debug Info:');
    console.log('🔍 FACEBOOK_USER_TOKEN exists:', !!process.env.FACEBOOK_USER_TOKEN);
    console.log('🔍 FACEBOOK_USER_TOKEN length:', process.env.FACEBOOK_USER_TOKEN?.length || 0);
    console.log('🔍 FACEBOOK_USER_ACCESS_TOKEN exists:', !!FACEBOOK_USER_ACCESS_TOKEN);
    console.log('🔍 FACEBOOK_USER_ACCESS_TOKEN length:', FACEBOOK_USER_ACCESS_TOKEN?.length || 0);
    console.log('🔍 Account Type: User Account');
    
    // Verify user authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    
    if (!FACEBOOK_USER_ACCESS_TOKEN) {
      const tokenMask = FACEBOOK_USER_ACCESS_TOKEN ? 
        `${FACEBOOK_USER_ACCESS_TOKEN.substring(0, 6)}...${FACEBOOK_USER_ACCESS_TOKEN.substring(FACEBOOK_USER_ACCESS_TOKEN.length - 4)}` : 
        'NOT_SET';
      
      console.error('🚨 Facebook configuration missing:');
      console.error(`  Access Token: ${tokenMask} (Length: ${FACEBOOK_USER_ACCESS_TOKEN?.length || 0})`);
      console.error(`  Environment variable FACEBOOK_USER_TOKEN: ${process.env.FACEBOOK_USER_TOKEN ? 'EXISTS' : 'MISSING'}`);
      console.error(`  Environment variable length: ${process.env.FACEBOOK_USER_TOKEN?.length || 0}`);
      console.error('  Please check your .env.local file and ensure variables are properly set');
      
      return NextResponse.json({
        success: false, 
        message: 'Facebook API is not configured. Please set FACEBOOK_USER_TOKEN in your .env.local file.',
        error: 'FACEBOOK_CONFIG_ERROR',
        help: 'Check your .env.local file and restart the server',
        details: {
          missingToken: !FACEBOOK_USER_ACCESS_TOKEN,
          tokenLength: FACEBOOK_USER_ACCESS_TOKEN?.length || 0,
          envVarExists: !!process.env.FACEBOOK_USER_TOKEN,
          envVarLength: process.env.FACEBOOK_USER_TOKEN?.length || 0
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
      case 'connect':
        // Test the connection by getting basic user account info
        console.log('🔗 Testing Facebook connection...');
        console.log(`🔗 Token (first 20 chars): ${FACEBOOK_USER_ACCESS_TOKEN?.substring(0, 20)}...`);
        
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/me?fields=id,name,email&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
        );
        
        // Log the response for debugging
        const connectResult = await facebookResponse.text();
        console.log('🔗 Facebook connect response status:', facebookResponse.status);
        console.log('🔗 Facebook connect response:', connectResult);
        
        // Re-create response for further processing
        facebookResponse = new Response(connectResult, {
          status: facebookResponse.status,
          statusText: facebookResponse.statusText,
          headers: facebookResponse.headers
        });
        break;
        
      case 'post':
        if (!body.message && !body.link) {
          return NextResponse.json(
            { success: false, message: 'Message or link is required for posting' },
            { status: 400 }
          );
        }
        
        const postData: any = {
          access_token: FACEBOOK_USER_ACCESS_TOKEN
        };
        
        if (body.message) postData.message = body.message;
        if (body.link) postData.link = body.link;
        if (body.scheduled_publish_time) {
          postData.scheduled_publish_time = body.scheduled_publish_time;
          postData.published = false;
        } else {
          postData.published = body.published !== false;
        }
        
        facebookResponse = await fetch(`${FACEBOOK_API_URL}/me/feed`, {
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
          `${FACEBOOK_API_URL}/me/posts?limit=${limit}&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
        );
        break;
        
      case 'get_insights':
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/me/insights?metric=page_impressions,page_reach,page_likes&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
        );
        break;
        
      case 'get_page_info':
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/me?fields=id,name,email,about,website,phone&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
        );
        break;
        
      case 'get_user_info':
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/me?fields=id,name,email,about,website,phone,friends&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
        );
        break;
        
      case 'get_user_stats':
        // For USER accounts, we can get friends count and basic profile info
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/me?fields=id,name,friends.limit(0).summary(true)&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
        );
        break;
        
      case 'test_token':
        // Test the access token validity by getting basic user account info
        console.log('🔍 Testing Facebook token validity...');
        console.log(`🔍 Token (first 20 chars): ${FACEBOOK_USER_ACCESS_TOKEN?.substring(0, 20)}...`);
        
        facebookResponse = await fetch(
          `${FACEBOOK_API_URL}/me?fields=id,name,email&access_token=${FACEBOOK_USER_ACCESS_TOKEN}`
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
          { success: false, message: 'Invalid action. Use connect, post, get_posts, get_insights, get_page_info, get_user_info, get_user_stats, or test_token' },
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
      
      const tokenMask = FACEBOOK_USER_ACCESS_TOKEN ? 
        `${FACEBOOK_USER_ACCESS_TOKEN.substring(0, 6)}...${FACEBOOK_USER_ACCESS_TOKEN.substring(FACEBOOK_USER_ACCESS_TOKEN.length - 4)}` : 
        'NOT_SET';
      
      console.error('🚨 Facebook API Error:');
      console.error(`  Status: ${facebookResponse.status}`);
      console.error(`  Error: ${errorDetail}`);
      console.error(`  Token: ${tokenMask}`);
      console.error(`  Account: User Account`);
      
      // Check for specific error types
      if (isFacebookTokenExpired(errorDetail)) {
        console.error('  🕒 Facebook token has EXPIRED - please refresh your access token');
        return NextResponse.json({
          success: false,
          message: `Facebook token expired: ${errorDetail}. Please generate a new long-lived access token from Facebook Developer Console.`,
          error: 'FACEBOOK_TOKEN_EXPIRED',
          help: 'Go to Facebook Developer Console → Graph API Explorer → Generate new long-lived token',
          details: { errorDetail, tokenMask, accountType: 'User Account' }
        }, { status: 401 });
      }
      
      if (isFacebookTokenInvalid(errorDetail)) {
        console.error('  🔑 Facebook token is INVALID - please check your access token');
        return NextResponse.json({
          success: false,
          message: `Facebook token invalid: ${errorDetail}. Please verify your FACEBOOK_USER_TOKEN is correct.`,
          error: 'FACEBOOK_TOKEN_INVALID',
          help: 'Verify your access token from Facebook Developer Console',
          details: { errorDetail, tokenMask, accountType: 'User Account' }
        }, { status: 401 });
      }
      
      // Handle other status codes
      if (facebookResponse.status === 400) {
        console.error('  📋 Facebook API configuration error');
        return NextResponse.json({
          success: false,
          message: `Facebook API configuration error: ${errorDetail}. Please verify your token permissions.`,
          error: 'FACEBOOK_CONFIG_ERROR',
          help: 'Check your FACEBOOK_USER_TOKEN and ensure it has required permissions',
          details: { errorDetail, tokenMask, accountType: 'User Account' }
        }, { status: 400 });
      }
      
      if (facebookResponse.status === 403) {
        console.error('  🚫 Facebook permission denied');
        return NextResponse.json({
          success: false,
          message: `Facebook permission denied: ${errorDetail}. Your token may not have sufficient permissions.`,
          error: 'FACEBOOK_PERMISSION_ERROR',
          help: 'Ensure your access token has user_posts and user_status permissions',
          details: { errorDetail, tokenMask, accountType: 'User Account' }
        }, { status: 403 });
      }
      
      // Generic error
      console.error('  ❌ Unexpected Facebook API error');
      throw new Error(`Facebook API failed with status: ${facebookResponse.status} - ${errorDetail}`);
    }
    
    let facebookResult;
    
    // Handle different response types based on action
    if (body.action === 'connect' || body.action === 'test_token') {
      // For connect and test_token, we already have the response text
      try {
        facebookResult = JSON.parse(await facebookResponse.text());
      } catch (e) {
        // If parsing fails, create a basic response
        facebookResult = { status: 'connected', message: 'Facebook API response received' };
      }
    } else if (body.action === 'get_user_stats') {
      // Parse user stats and format for social media dashboard
      try {
        const rawData = await facebookResponse.json();
        facebookResult = {
          id: rawData.id,
          name: rawData.name,
          friends_count: rawData.friends?.summary?.total_count || 0,
          followers_count: rawData.friends?.summary?.total_count || 0, // For USER accounts, friends = followers
          connected: true,
          account_type: 'user',
          message: `Successfully retrieved stats for user: ${rawData.name}`
        };
      } catch (e) {
        facebookResult = { 
          friends_count: 0, 
          followers_count: 0, 
          connected: false, 
          error: 'Failed to parse user stats' 
        };
      }
    } else {
      // For other actions, parse normally
      facebookResult = await facebookResponse.json();
    }
    
    console.log('Facebook API response:', facebookResult);
    
    // For test_token action, provide more detailed response
    if (body.action === 'test_token') {
      return NextResponse.json({
        success: true,
        data: facebookResult,
        message: `Token validation successful. User: ${facebookResult?.name || 'Unknown'}`,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    }
    
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


// Removed duplicate GET endpoint - using the simple one above for configuration check

// Removed unused page-based function

// Removed unused page-based function

// Removed unused page-based function