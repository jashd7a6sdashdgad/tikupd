import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';
import crypto from 'crypto';

// Test endpoint to simulate token creation exactly like the real API
export async function POST(request: NextRequest) {
  try {
    console.log('=== SECURE TOKEN CREATION TEST ===');
    const storageInfo = secureTokenStorage.getStorageInfo();
    console.log('Storage info:', storageInfo);
    
    // Parse request body
    const body = await request.json();
    const { name = 'Test Token' } = body;
    
    console.log('Creating test token with name:', name);
    
    // Generate token exactly like the real API
    const plainToken = 'mpa_' + crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();
    
    const tokenData: Omit<ApiToken, 'tokenHash'> = {
      id,
      name: name.trim(),
      permissions: ['read', 'write'],
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    
    console.log('Generated token data:', { id: tokenData.id, name: tokenData.name });
    
    // Test storage operations step by step
    console.log('Step 1: Creating token...');
    let savedToken: ApiToken;
    try {
      savedToken = await secureTokenStorage.createToken(plainToken, tokenData);
      console.log('✅ Token created successfully');
    } catch (error) {
      console.error('❌ Create failed:', error);
      throw new Error(`Create failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('Step 2: Verifying creation by validating...');
    try {
      const validatedToken = await secureTokenStorage.validateToken(plainToken);
      if (validatedToken && validatedToken.id === id) {
        console.log('✅ Token validated successfully after creation');
      } else {
        console.log('⚠️  Token not validated after creation');
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
    }
    
    console.log('=== SECURE TOKEN CREATION TEST COMPLETE ===');
    
    return NextResponse.json({
      success: true,
      message: 'Token creation test completed successfully',
      token: {
        id: savedToken.id,
        token: plainToken, // Return plain token for testing
        name: savedToken.name,
        permissions: savedToken.permissions,
        createdAt: savedToken.createdAt,
        status: savedToken.status
      },
      debug: {
        storageType: storageInfo.type,
        environment: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('=== SECURE TOKEN CREATION TEST FAILED ===');
    console.error('Error details:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Token creation test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      debug: {
        storageType: secureTokenStorage.getStorageInfo().type,
        environment: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
