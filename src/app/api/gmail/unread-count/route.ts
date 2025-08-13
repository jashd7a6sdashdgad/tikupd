import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, Gmail } from '@/lib/google';

// Helper function to get Google auth from cookies or env
function getGoogleAuth(request: NextRequest) {
  // Try cookies first
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (accessToken) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }
  
  // Fallback to environment variables
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (envAccessToken) {
    return {
      access_token: envAccessToken,
      refresh_token: envRefreshToken
    };
  }
  
  throw new Error('Google authentication required');
}

export async function GET(request: NextRequest) {
  try {
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    const gmail = new Gmail(googleTokens.access_token);
    
    // Get unread count
    const count = await gmail.getUnreadCount();
    
    return NextResponse.json({
      success: true,
      data: { count },
      message: 'Gmail unread count retrieved successfully'
    });
    
  } catch (error: any) {
    console.error('Gmail unread count error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to retrieve unread count'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}