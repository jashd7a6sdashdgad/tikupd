import { NextRequest, NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/storage/tokenStorage';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Token storage diagnostics starting...');
    
    // Get storage information
    const storageType = tokenStorage.getStorageType();
    const storageInfo = tokenStorage.getStorageInfo();
    
    console.log('Storage type:', storageType);
    console.log('Storage info:', storageInfo);
    
    // Try to load tokens
    const tokens = await tokenStorage.loadTokens();
    console.log('Loaded tokens count:', tokens.length);
    
    // Environment variables check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasKV_URL: !!process.env.KV_URL,
      hasBLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      hasGITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      hasGITHUB_GIST_ID: !!process.env.GITHUB_GIST_ID,
      cwd: process.cwd(),
      platform: process.platform
    };
    
    console.log('Environment check:', envCheck);
    
    // Test token creation
    let testResult: string | null = null;
    try {
      // Test load
      const testTokens = await tokenStorage.loadTokens();
      console.log('Test load successful, token count:', testTokens.length);
      
      // Test save with a temporary token
      const tempToken = {
        id: `test_${Date.now()}`,
        name: 'Test Token',
        token: 'test_token_value',
        permissions: ['read'],
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };
      
      const currentTokens = await tokenStorage.loadTokens();
      const updatedTokens = [...currentTokens, tempToken];
      await tokenStorage.saveTokens(updatedTokens);
      
      // Verify the token was saved
      const verifyTokens = await tokenStorage.loadTokens();
      const saved = verifyTokens.find(t => t.id === tempToken.id);
      
      if (saved) {
        // Clean up - remove the test token
        const cleanTokens = verifyTokens.filter(t => t.id !== tempToken.id);
        await tokenStorage.saveTokens(cleanTokens);
        testResult = 'All storage operations passed: load, save, and cleanup successful';
      } else {
        testResult = 'Storage test failed: token not persisted';
      }
    } catch (error) {
      console.error('Test failed:', error);
      testResult = `Test failed: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        storageType,
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