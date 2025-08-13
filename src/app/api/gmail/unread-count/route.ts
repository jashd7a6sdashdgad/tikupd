import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, Gmail } from '@/lib/google';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import jwt from 'jsonwebtoken';

// Helper function to get Google auth from cookies
function getGoogleAuth(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (!accessToken) {
    throw new Error('Google authentication required');
  }
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken
  };
}

export async function GET(request: NextRequest) {
  let validToken: any = null;
  let authType = 'unknown';
  
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Try to validate as website JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
      validToken = {
        id: decoded.userId || '1',
        name: decoded.username || 'website-user',
        permissions: ['*'],
        email: decoded.email,
        type: 'website-jwt'
      };
      authType = 'website-jwt';
    } catch (jwtError: any) {
      // Try to validate as API token
      const validation = await validateApiToken(authHeader);
      
      if (!validation.isValid || !validation.token) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid token. Please check your API token or JWT.' 
          },
          { status: 401 }
        );
      }
      
      validToken = validation.token;
      authType = 'api-token';
      
      // Check permissions for API tokens
      if (!hasPermission(validToken, 'read:gmail')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions. Token requires read:gmail permission' 
          },
          { status: 403 }
        );
      }
    }
    
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    const gmail = new Gmail(googleTokens.access_token);
    
    // Get unread count
    const count = await gmail.getUnreadCount();
    
    return NextResponse.json({
      success: true,
      data: { count },
      message: 'Gmail unread count retrieved successfully',
      authType,
      token: {
        name: validToken.name,
        permissions: validToken.permissions,
        type: validToken.type
      }
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