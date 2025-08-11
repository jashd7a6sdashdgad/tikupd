import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage } from '@/lib/storage/secureJsonStorage';

// Debug endpoint for token system troubleshooting
export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Token debug endpoint called');
    
    // Get all tokens and storage info
    const debugInfo = await secureTokenStorage.debugGetAllTokens();
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const testToken = searchParams.get('testToken');
    
    const response = {
      message: 'Token debug information',
      timestamp: new Date().toISOString(),
      storageInfo: debugInfo.storageInfo,
      tokenCount: debugInfo.tokens.length,
      tokens: debugInfo.tokens.map((token: any) => ({
        id: token.id,
        name: token.name,
        status: token.status,
        permissions: token.permissions,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        tokenHashPrefix: token.tokenHashPrefix,
        isExpired: token.expiresAt ? new Date(token.expiresAt) <= new Date() : false
      })),
      validationTest: testToken ? await testTokenValidation(testToken) : null
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('DEBUG: Token debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function testTokenValidation(testToken: string) {
  try {
    console.log('DEBUG: Testing token validation for:', testToken.substring(0, 10) + '...');
    
    const validationResult = await secureTokenStorage.validateToken(testToken);
    
    return {
      tokenPrefix: testToken.substring(0, 10) + '...',
      isValid: !!validationResult,
      tokenData: validationResult ? {
        id: validationResult.id,
        name: validationResult.name,
        status: validationResult.status,
        permissions: validationResult.permissions,
        expiresAt: validationResult.expiresAt
      } : null
    };
  } catch (error) {
    return {
      tokenPrefix: testToken.substring(0, 10) + '...',
      isValid: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Create a test token
export async function POST(request: NextRequest) {
  try {
    console.log('DEBUG: Creating test token...');
    
    const body = await request.json();
    const { name = 'Debug Test Token', permissions = ['read', 'write'], expiresInDays = 30 } = body;
    
    // Generate test token
    const crypto = await import('crypto');
    const plainToken = 'mpa_' + crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();
    
    // Calculate expiration
    let expiresAt: string | undefined;
    if (expiresInDays && expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }
    
    // Create token data
    const tokenData = {
      id,
      name: name.trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'active' as const
    };
    
    console.log('DEBUG: Creating token with data:', tokenData);
    
    // Save token
    const savedToken = await secureTokenStorage.createToken(plainToken, tokenData);
    
    // Verify by trying to validate
    const validationResult = await secureTokenStorage.validateToken(plainToken);
    
    console.log('DEBUG: Token created and validation result:', !!validationResult);
    
    return NextResponse.json({
      message: 'Debug token created successfully',
      token: {
        id: savedToken.id,
        token: plainToken, // Return full token for testing
        name: savedToken.name,
        permissions: savedToken.permissions,
        createdAt: savedToken.createdAt,
        expiresAt: savedToken.expiresAt,
        status: savedToken.status
      },
      validationTest: {
        immediate: !!validationResult,
        tokenData: validationResult
      },
      testUrls: {
        validate: `/api/validate-token?token=${plainToken}`,
        debug: `/api/debug-tokens-new?testToken=${plainToken}`
      }
    });
  } catch (error) {
    console.error('DEBUG: Create test token error:', error);
    return NextResponse.json({
      error: 'Failed to create debug token',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}