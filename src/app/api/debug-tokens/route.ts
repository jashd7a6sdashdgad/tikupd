import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage } from '@/lib/storage/secureJsonStorage';
import { validateApiToken } from '@/lib/api/auth/tokenValidation';

export async function GET(request: NextRequest) {
  try {
    console.log('=== SECURE TOKEN DEBUG ENDPOINT ===');
    
    // Load all tokens
    const allTokens = await secureTokenStorage.loadTokens();
    console.log('Total tokens loaded:', allTokens.length);
    
    // Get storage info
    const storageInfo = secureTokenStorage.getStorageInfo();
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
          tokenHashPrefix: token.tokenHash.substring(0, 10) + '...',
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
