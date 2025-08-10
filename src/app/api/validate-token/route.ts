import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/api/auth/tokenValidation';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TOKEN VALIDATION TEST ===');
    
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
    
    const validation = await validateApiToken(authHeader);
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error || 'Token validation failed',
          debug: {
            hasAuthHeader: !!authHeader,
            authHeaderFormat: authHeader?.startsWith('Bearer ') || false,
            timestamp: new Date().toISOString()
          }
        }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      tokenInfo: {
        id: validation.token?.id,
        name: validation.token?.name,
        permissions: validation.token?.permissions,
        status: validation.token?.status,
        createdAt: validation.token?.createdAt,
        expiresAt: validation.token?.expiresAt
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token validation endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint to test without token (for debugging)
export async function GET(request: NextRequest) {
  try {
    console.log('=== TOKEN VALIDATION DEBUG (GET) ===');
    
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
    
    // Test the validation function
    const validation = await validateApiToken(authHeader);
    console.log('Validation result:', validation);
    
    return NextResponse.json({
      debug: true,
      authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'null',
      validation: {
        isValid: validation.isValid,
        error: validation.error,
        hasToken: !!validation.token
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token validation debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}