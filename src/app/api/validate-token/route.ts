import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage } from '@/lib/storage/secureJsonStorage';

/**
 * Token validation endpoint for n8n and other external services
 * GET/POST /api/validate-token
 * 
 * Headers: Authorization: Bearer <token>
 * OR
 * Body: { "token": "<token>" }
 * OR
 * Query: ?token=<token>
 */

async function validateTokenFromRequest(request: NextRequest): Promise<{
  token?: string;
  valid: boolean;
  tokenData?: any;
  error?: string;
  debugInfo?: any;
}> {
  let token: string | undefined;

  console.log('VALIDATE: Starting token validation process');

  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    console.log('VALIDATE: Token found in Authorization header');
  }

  // Try to get token from request body (for POST requests)
  if (!token && request.method === 'POST') {
    try {
      const body = await request.json();
      token = body.token;
      if (token) {
        console.log('VALIDATE: Token found in request body');
      }
    } catch (error) {
      console.log('VALIDATE: No valid JSON body found');
    }
  }

  // Try to get token from query parameters
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('token') || undefined;
    if (token) {
      console.log('VALIDATE: Token found in query parameter');
    }
  }

  if (!token) {
    console.log('VALIDATE: No token provided in any format');
    return { 
      valid: false, 
      error: 'No token provided. Use Authorization header, request body, or query parameter.' 
    };
  }

  console.log('VALIDATE: Token prefix:', token.substring(0, 10));

  try {
    // Get storage info for debugging
    const storageInfo = secureTokenStorage.getStorageInfo();
    console.log('VALIDATE: Storage info:', storageInfo);

    // Attempt validation
    const tokenData = await secureTokenStorage.validateToken(token);
    console.log('VALIDATE: Validation result:', !!tokenData);
    
    if (!tokenData) {
      // Get debug info for troubleshooting
      const debugInfo = await secureTokenStorage.debugGetAllTokens();
      
      return { 
        token: token.substring(0, 10) + '...',
        valid: false, 
        error: 'Invalid or expired token',
        debugInfo: {
          storageInfo,
          tokenCount: debugInfo.tokens.length,
          encryptionKeyHash: storageInfo.encryptionKeyHash
        }
      };
    }

    console.log('VALIDATE: Token validation successful for:', tokenData.name);

    return { 
      token: token.substring(0, 10) + '...',
      valid: true, 
      tokenData: {
        id: tokenData.id,
        name: tokenData.name,
        permissions: tokenData.permissions,
        status: tokenData.status,
        createdAt: tokenData.createdAt,
        expiresAt: tokenData.expiresAt
      }
    };
  } catch (error) {
    console.error('VALIDATE: Token validation error:', error);
    return { 
      token: token.substring(0, 10) + '...',
      valid: false, 
      error: 'Token validation failed: ' + (error instanceof Error ? error.message : String(error)),
      debugInfo: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined
      }
    };
  }
}

// GET /api/validate-token
export async function GET(request: NextRequest) {
  try {
    const result = await validateTokenFromRequest(request);
    
    if (!result.valid) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json({
      message: 'Token is valid',
      ...result
    });
  } catch (error) {
    console.error('GET /api/validate-token error:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Validation service error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/validate-token
export async function POST(request: NextRequest) {
  try {
    const result = await validateTokenFromRequest(request);
    
    if (!result.valid) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json({
      message: 'Token is valid',
      ...result
    });
  } catch (error) {
    console.error('POST /api/validate-token error:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Validation service error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}