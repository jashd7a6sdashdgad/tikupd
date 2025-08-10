import { NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/storage/tokenStorage';

export async function GET() {
  try {
    // Get storage information
    const storageInfo = tokenStorage.getStorageInfo();
    
    // Try to load tokens to test storage
    let tokenCount = 0;
    let loadError: string | null = null;
    
    try {
      const tokens = await tokenStorage.loadTokens();
      tokenCount = tokens.length;
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error);
    }

    // Get environment variables (without exposing sensitive data)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL ? 'set' : 'not set',
      VERCEL: process.env.VERCEL ? 'set' : 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_INC_CACHE_R2_BUCKET: process.env.NEXT_INC_CACHE_R2_BUCKET ? 'set' : 'not set',
      hasProcess: typeof process !== 'undefined',
      hasEnv: typeof process !== 'undefined' && !!process.env,
      cwd: typeof process !== 'undefined' ? process.cwd() : 'not available'
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storage: {
        ...storageInfo,
        tokenCount,
        loadError
      },
      environment: envInfo,
      recommendations: getRecommendations(storageInfo, envInfo)
    });

  } catch (error) {
    console.error('Debug storage endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getRecommendations(storageInfo: any, envInfo: any): string[] {
  const recommendations: string[] = [];

  if (storageInfo.vercelDetected && storageInfo.type.includes('InMemory')) {
    recommendations.push('Vercel detected but using in-memory storage. Consider setting up Cloudflare R2 for persistence.');
  }

  if (storageInfo.type.includes('fallback')) {
    recommendations.push('Storage is using fallback mode. Check file system permissions on Vercel.');
  }

  if (envInfo.NODE_ENV === 'production' && !envInfo.VERCEL_URL) {
    recommendations.push('Production environment detected but Vercel not detected. Check environment variables.');
  }

  if (storageInfo.tokenCount === 0 && !storageInfo.loadError) {
    recommendations.push('No tokens found. This might be expected for a fresh deployment.');
  }

  if (storageInfo.loadError) {
    recommendations.push(`Storage error detected: ${storageInfo.loadError}. Check Vercel function logs.`);
  }

  return recommendations;
} 