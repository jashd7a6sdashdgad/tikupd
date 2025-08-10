import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';

export async function POST(request: NextRequest) {
  try {
    console.log('=== N8N TEST ENDPOINT ===');
    
    // Validate token
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header received:', authHeader ? 'Bearer ***' : 'none');
    
    const validation = await validateApiToken(authHeader);
    console.log('Token validation:', validation.isValid ? 'SUCCESS' : 'FAILED');
    
    if (!validation.isValid) {
      console.log('Validation error:', validation.error);
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          message: validation.error,
          success: false
        }, 
        { status: 401 }
      );
    }
    
    // Check permissions (example)
    const token = validation.token!;
    const hasWritePermission = hasPermission(token, 'write') || hasPermission(token, '*');
    
    console.log('Token permissions:', token.permissions);
    console.log('Has write permission:', hasWritePermission);
    
    // Process the request body
    const body = await request.json();
    console.log('Request body received:', Object.keys(body));
    
    // Success response
    const response = {
      success: true,
      message: 'N8N webhook processed successfully',
      data: {
        receivedAt: new Date().toISOString(),
        tokenInfo: {
          id: token.id,
          name: token.name,
          permissions: token.permissions
        },
        payload: body,
        hasWritePermission
      }
    };
    
    console.log('Sending success response');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('N8N test endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        success: false
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== N8N TEST ENDPOINT (GET) ===');
    
    // Validate token
    const authHeader = request.headers.get('Authorization');
    const validation = await validateApiToken(authHeader);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          message: validation.error,
          success: false,
          help: {
            format: 'Authorization: Bearer YOUR_TOKEN',
            example: 'Authorization: Bearer mpa_abcd1234...',
            getToken: 'Create token at /api/debug-tokens (POST)'
          }
        }, 
        { status: 401 }
      );
    }
    
    const token = validation.token!;
    
    return NextResponse.json({
      success: true,
      message: 'N8N test endpoint is working',
      tokenInfo: {
        id: token.id,
        name: token.name,
        permissions: token.permissions,
        status: token.status
      },
      endpoints: {
        post: 'Send JSON data to this endpoint',
        get: 'Check authentication status'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('N8N test GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false
      }, 
      { status: 500 }
    );
  }
}