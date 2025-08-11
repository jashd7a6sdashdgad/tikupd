import { NextResponse } from 'next/server';
import { secureTokenStorage } from '@/lib/storage/secureJsonStorage';

export async function GET() {
  try {
    // Get storage information
    const storageInfo = secureTokenStorage.getStorageInfo();
    
    // Try to load tokens to test storage
    let tokenCount = 0;
    let loadError: string | null = null;
    
    try {
      const tokens = await secureTokenStorage.loadTokens();
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

  if (storageInfo.type === 'SecureJsonStorage' && envInfo.VERCEL_URL && !process.env.SECURE_TOKENS_DATA) {
    recommendations.push('Running on Vercel, but SECURE_TOKENS_DATA environment variable is not set. Persistence might rely on file system which is not reliable on Vercel.');
  }

  if (storageInfo.loadError) {
    recommendations.push(`Storage error detected: ${storageInfo.loadError}. Check Vercel function logs.`);
  }

  return recommendations;
}