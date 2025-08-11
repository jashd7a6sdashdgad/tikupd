import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Secure token storage diagnostics starting...');
    
    // Get storage information
    const storageInfo = secureTokenStorage.getStorageInfo();
    
    console.log('Storage info:', storageInfo);
    
    // Try to load tokens
    const tokens = await secureTokenStorage.loadTokens();
    console.log('Loaded tokens count:', tokens.length);
    
    // Environment variables check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasSECURE_TOKENS_DATA: !!process.env.SECURE_TOKENS_DATA,
      hasTOKEN_ENCRYPTION_KEY: !!process.env.TOKEN_ENCRYPTION_KEY,
      cwd: process.cwd(),
      platform: process.platform
    };
    
    console.log('Environment check:', envCheck);
    
    // Test token creation and validation
    let testResult: string | null = null;
    const testTokenId = `test_${Date.now()}`;
    const plainTestToken = `test_token_${crypto.randomBytes(16).toString('hex')}`;

    try {
      // Test create
      const tokenData: Omit<ApiToken, 'tokenHash'> = {
        id: testTokenId,
        name: 'Test Token',
        permissions: ['read'],
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await secureTokenStorage.createToken(plainTestToken, tokenData);
      console.log('Test token created');

      // Test validate
      const validatedToken = await secureTokenStorage.validateToken(plainTestToken);
      if (validatedToken && validatedToken.id === testTokenId) {
        console.log('Test token validated successfully');
        
        // Test delete
        await secureTokenStorage.deleteToken(testTokenId);
        console.log('Test token deleted');

        // Verify deletion
        const finalTokens = await secureTokenStorage.loadTokens();
        if (!finalTokens.find(t => t.id === testTokenId)) {
          testResult = 'All secure storage operations passed: create, validate, and delete successful';
        } else {
          testResult = 'Storage test failed: token not properly deleted';
        }
      } else {
        testResult = 'Storage test failed: token not validated';
        // Cleanup just in case
        await secureTokenStorage.deleteToken(testTokenId);
      }
    } catch (error) {
      console.error('Test failed:', error);
      testResult = `Test failed: ${error instanceof Error ? error.message : String(error)}`;
      // Cleanup just in case
      try {
        await secureTokenStorage.deleteToken(testTokenId);
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        storageType: storageInfo.type,
        storageInfo,
        tokensCount: tokens.length,
        environment: envCheck,
        testResult,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Debug tokens error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
