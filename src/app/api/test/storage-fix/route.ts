import { NextRequest, NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/storage/tokenStorage';
import crypto from 'crypto';

// Test endpoint to verify token storage is working on Vercel
export async function POST(request: NextRequest) {
  try {
    console.log('=== STORAGE FIX TEST ===');
    
    // Get storage info
    const storageType = tokenStorage.getStorageType();
    const storageInfo = tokenStorage.getStorageInfo();
    
    console.log('Using storage:', storageType);
    console.log('Storage details:', storageInfo);
    
    // Test 1: Load existing tokens
    console.log('Test 1: Loading existing tokens...');
    const existingTokens = await tokenStorage.loadTokens();
    console.log(`Found ${existingTokens.length} existing tokens`);
    
    // Test 2: Create a new token
    console.log('Test 2: Creating new token...');
    const testToken = {
      id: crypto.randomUUID(),
      token: 'mpa_test_' + crypto.randomBytes(16).toString('hex'),
      name: 'Storage Test Token',
      permissions: ['read', 'write'],
      createdAt: new Date().toISOString(),
      status: 'active' as const
    };
    
    const allTokens = [...existingTokens, testToken];
    await tokenStorage.saveTokens(allTokens);
    console.log(`Token created with ID: ${testToken.id}`);
    
    // Test 3: Verify token was saved
    console.log('Test 3: Verifying token was saved...');
    const reloadedTokens = await tokenStorage.loadTokens();
    const foundToken = reloadedTokens.find(t => t.id === testToken.id);
    
    if (!foundToken) {
      throw new Error('Token was not found after save - storage not working');
    }
    
    console.log('✅ Token found after save!');
    
    // Test 4: Update token
    console.log('Test 4: Testing token update...');
    await tokenStorage.updateToken(testToken.id, { name: 'Updated Test Token' });
    
    const updatedTokens = await tokenStorage.loadTokens();
    const updatedToken = updatedTokens.find(t => t.id === testToken.id);
    
    if (!updatedToken || updatedToken.name !== 'Updated Test Token') {
      throw new Error('Token update failed');
    }
    
    console.log('✅ Token update works!');
    
    // Test 5: Delete test token (cleanup)
    console.log('Test 5: Cleaning up test token...');
    await tokenStorage.deleteToken(testToken.id);
    
    const finalTokens = await tokenStorage.loadTokens();
    const deletedToken = finalTokens.find(t => t.id === testToken.id);
    
    if (deletedToken) {
      throw new Error('Token was not deleted - cleanup failed');
    }
    
    console.log('✅ Token deletion works!');
    console.log('=== ALL TESTS PASSED ===');
    
    return NextResponse.json({
      success: true,
      message: 'All storage tests passed successfully',
      results: {
        storageType,
        storageInfo,
        testsCompleted: 5,
        existingTokenCount: existingTokens.length,
        finalTokenCount: finalTokens.length,
        testTokenId: testToken.id
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('=== STORAGE TEST FAILED ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET method to just show storage status
export async function GET(request: NextRequest) {
  try {
    const storageType = tokenStorage.getStorageType();
    const storageInfo = tokenStorage.getStorageInfo();
    const tokens = await tokenStorage.loadTokens();
    
    return NextResponse.json({
      success: true,
      storageType,
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