import { NextRequest, NextResponse } from 'next/server';
import { VercelBlobTokenStorage } from '@/lib/storage/vercelBlobStorage';

export async function GET(request: NextRequest) {
  try {
    console.log('=== VERCEL BLOB STORAGE TEST ===');
    
    // Check environment
    const envInfo = {
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isVercel: !!process.env.VERCEL
    };
    
    console.log('Environment info:', envInfo);
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'BLOB_READ_WRITE_TOKEN not found',
        message: 'Please set up Vercel Blob storage first',
        setup: {
          steps: [
            '1. Run: vercel blob --create-database tokens-storage',
            '2. Copy the BLOB_READ_WRITE_TOKEN from the output',
            '3. Add to Vercel env: vercel env add BLOB_READ_WRITE_TOKEN',
            '4. Deploy your app'
          ]
        },
        environment: envInfo
      });
    }
    
    // Test Vercel Blob storage
    const blobStorage = new VercelBlobTokenStorage();
    const storageInfo = blobStorage.getStorageInfo();
    const isAvailable = blobStorage.isAvailable();
    
    console.log('Blob storage info:', storageInfo);
    console.log('Blob storage available:', isAvailable);
    
    // Test operations
    const testResults = {
      load: { success: false, error: null as string | null },
      save: { success: false, error: null as string | null },
      delete: { success: false, error: null as string | null }
    };
    
    // Test load
    try {
      const tokens = await blobStorage.loadTokens();
      testResults.load = { success: true, error: null };
      console.log('Load test successful, tokens count:', tokens.length);
    } catch (error) {
      testResults.load = { success: false, error: error instanceof Error ? error.message : String(error) };
      console.error('Load test failed:', error);
    }
    
    // Test save
    try {
      const testTokens = [{
        id: 'test_' + Date.now(),
        name: 'Test Token',
        token: 'test_token_value_' + Math.random(),
        permissions: ['read'],
        status: 'active' as const,
        createdAt: new Date().toISOString()
      }];
      
      await blobStorage.saveTokens(testTokens);
      testResults.save = { success: true, error: null };
      console.log('Save test successful');
      
      // Test delete (cleanup)
      try {
        await blobStorage.deleteToken(testTokens[0].id);
        testResults.delete = { success: true, error: null };
        console.log('Delete test successful');
      } catch (deleteError) {
        testResults.delete = { success: false, error: deleteError instanceof Error ? deleteError.message : String(deleteError) };
        console.error('Delete test failed:', deleteError);
      }
      
    } catch (saveError) {
      testResults.save = { success: false, error: saveError instanceof Error ? saveError.message : String(saveError) };
      console.error('Save test failed:', saveError);
    }
    
    const allTestsPassed = testResults.load.success && testResults.save.success && testResults.delete.success;
    
    console.log('=== VERCEL BLOB STORAGE TEST COMPLETE ===');
    
    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed ? 'Vercel Blob storage is working correctly!' : 'Some tests failed',
      environment: envInfo,
      storage: storageInfo,
      tests: testResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('=== VERCEL BLOB STORAGE TEST FAILED ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Blob storage test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}