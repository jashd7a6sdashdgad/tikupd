import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';
import crypto from 'crypto';

// Test endpoint to verify token storage is working on Vercel
export async function POST(request: NextRequest) {
  try {
    console.log('=== SECURE STORAGE FIX TEST ===');
    
    // Get storage info
    const storageInfo = secureTokenStorage.getStorageInfo();
    
    console.log('Using storage:', storageInfo.type);
    console.log('Storage details:', storageInfo);
    
    // Test 1: Load existing tokens
    console.log('Test 1: Loading existing tokens...');
    const existingTokens = await secureTokenStorage.loadTokens();
    console.log(`Found ${existingTokens.length} existing tokens`);
    
    // Test 2: Create a new token
    console.log('Test 2: Creating new token...');
    const testTokenId = crypto.randomUUID();
    const plainTestToken = 'mpa_test_' + crypto.randomBytes(16).toString('hex');
    const tokenData: Omit<ApiToken, 'tokenHash'> = {
      id: testTokenId,
      name: 'Storage Test Token',
      permissions: ['read', 'write'],
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    
    await secureTokenStorage.createToken(plainTestToken, tokenData);
    console.log(`Token created with ID: ${testTokenId}`);
    
    // Test 3: Verify token was saved
    console.log('Test 3: Verifying token was saved...');
    const validatedToken = await secureTokenStorage.validateToken(plainTestToken);
    
    if (!validatedToken || validatedToken.id !== testTokenId) {
      throw new Error('Token was not found after save - storage not working');
    }
    
    console.log('✅ Token found after save!');
    
    // Test 4: Update token
    console.log('Test 4: Testing token update...');
    await secureTokenStorage.updateToken(testTokenId, { name: 'Updated Test Token' });
    
    const updatedTokens = await secureTokenStorage.loadTokens();
    const updatedToken = updatedTokens.find(t => t.id === testTokenId);
    
    if (!updatedToken || updatedToken.name !== 'Updated Test Token') {
      throw new Error('Token update failed');
    }
    
    console.log('✅ Token update works!');
    
    // Test 5: Delete test token (cleanup)
    console.log('Test 5: Cleaning up test token...');
    await secureTokenStorage.deleteToken(testTokenId);
    
    const finalTokens = await secureTokenStorage.loadTokens();
    const deletedToken = finalTokens.find(t => t.id === testTokenId);
    
    if (deletedToken) {
      throw new Error('Token was not deleted - cleanup failed');
    }
    
    console.log('✅ Token deletion works!');
    console.log('=== ALL TESTS PASSED ===');
    
    return NextResponse.json({
      success: true,
      message: 'All secure storage tests passed successfully',
      results: {
        storageType: storageInfo.type,
        storageInfo,
        testsCompleted: 5,
        existingTokenCount: existingTokens.length,
        finalTokenCount: finalTokens.length,
        testTokenId: testTokenId
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('=== SECURE STORAGE TEST FAILED ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Secure storage test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET method to just show storage status
export async function GET(request: NextRequest) {
  try {
    const storageInfo = secureTokenStorage.getStorageInfo();
    const tokens = await secureTokenStorage.loadTokens();
    
    return NextResponse.json({
      success: true,
      storageType: storageInfo.type,
      storageInfo,
      tokenCount: tokens.length,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
