import { NextRequest, NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/storage/tokenStorage';

// Debug endpoint to check storage status
export async function GET(request: NextRequest) {
  try {
    console.log('=== STORAGE STATUS DEBUG ===');
    
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
    const storageType = tokenStorage.getStorageType();
    const storageInfo = tokenStorage.getStorageInfo();
    
    console.log('Storage type:', storageType);
    console.log('Storage info:', storageInfo);
    
    // Try to load tokens
    let loadResult;
    try {
      const tokens = await tokenStorage.loadTokens();
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
    try {
      const currentTokens = await tokenStorage.loadTokens();
      const testToken = {
        id: 'diagnostic_' + Date.now(),
        token: 'test_token_value',
        name: 'Diagnostic Test Token',
        permissions: ['read'],
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };
      
      const tokensToSave = [...currentTokens, testToken];
      await tokenStorage.saveTokens(tokensToSave);
      
      // Verify save
      const reloadedTokens = await tokenStorage.loadTokens();
      const foundTest = reloadedTokens.find(t => t.id === testToken.id);
      
      if (foundTest) {
        // Clean up test token
        await tokenStorage.deleteToken(testToken.id);
        saveResult = {
          success: true,
          message: 'Save and delete test successful'
        };
        console.log('Save test successful');
      } else {
        saveResult = {
          success: false,
          error: 'Test token not found after save'
        };
        console.error('Save test failed: token not persisted');
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
        type: storageType,
        info: storageInfo
      },
      tests: {
        load: loadResult,
        save: saveResult
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('=== STORAGE STATUS DEBUG COMPLETE ===');
    console.log('Final result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('=== STORAGE STATUS DEBUG FAILED ===');
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