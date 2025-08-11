import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';
import crypto from 'crypto';

// Debug endpoint to check storage status
export async function GET(request: NextRequest) {
  try {
    console.log('=== SECURE STORAGE STATUS DEBUG ===');
    
    // Environment check
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelUrl: process.env.VERCEL_URL,
      vercelEnv: process.env.VERCEL_ENV,
      platform: process.platform,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    };
    
    console.log('Environment info:', envInfo);
    
    // Storage info
    const storageInfo = secureTokenStorage.getStorageInfo();
    
    console.log('Storage info:', storageInfo);
    
    // Try to load tokens
    let loadResult;
    try {
      const tokens = await secureTokenStorage.loadTokens();
      loadResult = {
        success: true,
        count: tokens.length,
        tokens: tokens.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          createdAt: t.createdAt
        }))
      };
      console.log('Load test successful:', loadResult.count, 'tokens');
    } catch (loadError) {
      loadResult = {
        success: false,
        error: loadError instanceof Error ? loadError.message : String(loadError)
      };
      console.error('Load test failed:', loadResult.error);
    }
    
    // Try to save test (create and immediately delete a test token)
    let saveResult;
    const testTokenId = 'diagnostic_' + Date.now();
    const plainTestToken = `diagnostic_token_${crypto.randomBytes(16).toString('hex')}`;
    try {
      const tokenData: Omit<ApiToken, 'tokenHash'> = {
        id: testTokenId,
        name: 'Diagnostic Test Token',
        permissions: ['read'],
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await secureTokenStorage.createToken(plainTestToken, tokenData);
      
      // Verify save by validating
      const validatedToken = await secureTokenStorage.validateToken(plainTestToken);
      
      if (validatedToken && validatedToken.id === testTokenId) {
        // Clean up test token
        await secureTokenStorage.deleteToken(testTokenId);
        saveResult = {
          success: true,
          message: 'Save, validate, and delete test successful'
        };
        console.log('Save test successful');
      } else {
        saveResult = {
          success: false,
          error: 'Test token not found after save/validate'
        };
        console.error('Save test failed: token not persisted or validated');
      }
    } catch (saveError) {
      saveResult = {
        success: false,
        error: saveError instanceof Error ? saveError.message : String(saveError)
      };
      console.error('Save test failed:', saveResult.error);
    }
    
    const result = {
      success: true,
      environment: envInfo,
      storage: {
        type: storageInfo.type,
        info: storageInfo
      },
      tests: {
        load: loadResult,
        save: saveResult
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('=== SECURE STORAGE STATUS DEBUG COMPLETE ===');
    console.log('Final result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('=== SECURE STORAGE STATUS DEBUG FAILED ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Storage status check failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
