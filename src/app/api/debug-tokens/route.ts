import { NextRequest, NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/storage/tokenStorage';
import { validateApiToken } from '@/lib/api/auth/tokenValidation';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TOKEN DEBUG ENDPOINT ===');
    
    // Load all tokens
    const allTokens = await tokenStorage.loadTokens();
    console.log('Total tokens loaded:', allTokens.length);
    
    // Get storage info
    const storageInfo = tokenStorage.getStorageInfo();
    console.log('Storage info:', storageInfo);
    
    // Test token from auth header
    const authHeader = request.headers.get('Authorization');
    let testValidation: any = null;
    if (authHeader) {
      testValidation = await validateApiToken(authHeader);
      console.log('Auth header validation:', testValidation);
    }
    
    // Return comprehensive debug info
    const debugInfo = {
      storage: storageInfo,
      tokens: {
        total: allTokens.length,
        active: allTokens.filter(t => t.status === 'active').length,
        inactive: allTokens.filter(t => t.status === 'inactive').length,
        list: allTokens.map(token => ({
          id: token.id,
          name: token.name,
          status: token.status,
          permissions: token.permissions,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
          tokenPrefix: token.token.substring(0, 10) + '...',
          tokenLength: token.token.length
        }))
      },
      authTest: authHeader ? {
        hasHeader: true,
        headerFormat: authHeader.startsWith('Bearer '),
        validation: testValidation
      } : {
        hasHeader: false,
        message: 'No Authorization header provided'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Debug info prepared:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('Token debug endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE TEST TOKEN ===');
    
    const body = await request.json();
    const { name = 'Test Token', permissions = ['*'] } = body;
    
    // Generate test token
    const testToken = {
      id: `test_${Date.now()}`,
      token: `mpa_test_${Math.random().toString(36).substr(2, 32)}`,
      name,
      permissions,
      status: 'active' as const,
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating test token:', { id: testToken.id, name: testToken.name });
    
    // Load existing tokens and add test token
    const tokens = await tokenStorage.loadTokens();
    tokens.push(testToken);
    
    await tokenStorage.saveTokens(tokens);
    console.log('Test token saved successfully');
    
    // Verify it was saved
    const verifyTokens = await tokenStorage.loadTokens();
    const savedToken = verifyTokens.find(t => t.id === testToken.id);
    
    return NextResponse.json({
      success: true,
      message: 'Test token created',
      token: {
        id: testToken.id,
        name: testToken.name,
        token: testToken.token,
        permissions: testToken.permissions,
        status: testToken.status,
        createdAt: testToken.createdAt
      },
      verification: {
        saved: !!savedToken,
        status: savedToken?.status,
        tokensCount: verifyTokens.length
      },
      usage: {
        curlExample: `curl -H "Authorization: Bearer ${testToken.token}" https://your-app.vercel.app/api/validate-token`,
        n8nSetup: `Use token: ${testToken.token}`
      }
    });
    
  } catch (error) {
    console.error('Test token creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test token',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}