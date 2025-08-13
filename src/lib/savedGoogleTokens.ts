import { promises as fs } from 'fs';
import path from 'path';

export interface SavedGoogleTokens {
  access_token: string;
  refresh_token?: string;
  created_at: string;
  expires_at: string;
}

export async function getSavedGoogleTokens(): Promise<SavedGoogleTokens | null> {
  try {
    const tokensFile = path.join(process.cwd(), 'data', 'tokens', 'google-oauth-tokens.json');
    const tokenData = await fs.readFile(tokensFile, 'utf-8');
    const tokens = JSON.parse(tokenData);
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    
    if (now >= expiresAt) {
      console.log('⚠️ Saved Google access token is expired');
      return null;
    }
    
    console.log('✅ Using saved Google access token');
    return tokens;
  } catch (error) {
    console.log('📝 No saved Google tokens found or error reading tokens');
    return null;
  }
}

export async function getGoogleTokensFromMultipleSources(request: any): Promise<{ access_token: string; refresh_token?: string } | null> {
  // Priority order:
  // 1. Cookies (real-time from browser)
  // 2. Saved tokens file (automatically saved)
  // 3. Environment variables (manual backup)
  
  // Try cookies first (most up-to-date)
  const cookieAccessToken = request.cookies?.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies?.get('google_refresh_token')?.value;
  
  if (cookieAccessToken) {
    console.log('🍪 Using Google tokens from cookies');
    return {
      access_token: cookieAccessToken,
      refresh_token: rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined
    };
  }
  
  // Try saved tokens file
  const savedTokens = await getSavedGoogleTokens();
  if (savedTokens) {
    console.log('💾 Using saved Google tokens from file');
    return {
      access_token: savedTokens.access_token,
      refresh_token: savedTokens.refresh_token
    };
  }
  
  // Try environment variables as final fallback
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (envAccessToken) {
    console.log('🌍 Using Google tokens from environment variables');
    return {
      access_token: envAccessToken,
      refresh_token: envRefreshToken
    };
  }
  
  console.log('❌ No Google tokens found from any source');
  return null;
}