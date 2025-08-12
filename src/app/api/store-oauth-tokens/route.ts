import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const TOKENS_DIR = path.join(process.cwd(), 'data', 'tokens');

// Store OAuth tokens for API access
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    
    // Get OAuth tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'Google authentication required. Please log in with Google first.',
        instructions: 'Visit /auth and connect with Google to get OAuth tokens'
      }, { status: 400 });
    }

    // Ensure tokens directory exists
    await fs.mkdir(TOKENS_DIR, { recursive: true });
    
    // Store tokens with user ID
    const tokenData = {
      userId: user.id,
      accessToken,
      refreshToken,
      updatedAt: new Date().toISOString(),
      note: 'OAuth tokens for API access to Google Sheets'
    };
    
    const tokensFile = path.join(TOKENS_DIR, 'google-oauth-tokens.json');
    await fs.writeFile(tokensFile, JSON.stringify(tokenData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'OAuth tokens stored successfully for API access',
      data: {
        userId: user.id,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        updatedAt: tokenData.updatedAt,
        note: 'These tokens will be used for API requests that need Google Sheets access'
      }
    });

  } catch (error: any) {
    console.error('OAuth token storage error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to store OAuth tokens'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    verifyToken(token);
    
    const tokensFile = path.join(TOKENS_DIR, 'google-oauth-tokens.json');
    
    try {
      const data = await fs.readFile(tokensFile, 'utf-8');
      const tokenData = JSON.parse(data);
      
      return NextResponse.json({
        success: true,
        message: 'OAuth tokens status',
        data: {
          userId: tokenData.userId,
          hasAccessToken: !!tokenData.accessToken,
          hasRefreshToken: !!tokenData.refreshToken,
          updatedAt: tokenData.updatedAt,
          note: tokenData.note
        }
      });
    } catch (fileError) {
      return NextResponse.json({
        success: false,
        message: 'No stored OAuth tokens found',
        instructions: 'Use POST to store your current Google OAuth tokens for API access'
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('OAuth token check error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to check OAuth tokens'
    }, { status: 500 });
  }
}