import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging Google OAuth token detection...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      sources: {}
    };
    
    // Check cookies
    const cookieAccessToken = request.cookies.get('google_access_token')?.value;
    const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
    const decodedRefreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : null;
    
    results.sources.cookies = {
      google_access_token: cookieAccessToken ? `FOUND (${cookieAccessToken.length} chars)` : 'NOT FOUND',
      google_refresh_token_raw: rawRefreshToken ? `FOUND (${rawRefreshToken.length} chars)` : 'NOT FOUND',
      google_refresh_token_decoded: decodedRefreshToken ? `FOUND (${decodedRefreshToken.length} chars)` : 'NOT FOUND',
      tokens_match: rawRefreshToken && decodedRefreshToken ? (rawRefreshToken === decodedRefreshToken ? 'NO_ENCODING' : 'URL_ENCODED') : 'N/A',
      all_cookies: Object.fromEntries(
        Array.from(request.cookies.getAll()).map(cookie => [cookie.name, cookie.value.length])
      )
    };
    
    // Check environment variables
    results.sources.environment = {
      GOOGLE_ACCESS_TOKEN: process.env.GOOGLE_ACCESS_TOKEN ? `FOUND (${process.env.GOOGLE_ACCESS_TOKEN.length} chars)` : 'NOT FOUND',
      GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN ? `FOUND (${process.env.GOOGLE_REFRESH_TOKEN.length} chars)` : 'NOT FOUND',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'FOUND' : 'NOT FOUND',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'FOUND' : 'NOT FOUND'
    };
    
    // Check stored token files
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    const tokensFile = path.join(process.cwd(), 'data', 'tokens', 'google-oauth-tokens.json');
    try {
      const fileContent = await fs.readFile(tokensFile, 'utf-8');
      const tokenData = JSON.parse(fileContent);
      results.sources.stored_file = {
        file_exists: true,
        file_path: tokensFile,
        access_token: tokenData.access_token ? `FOUND (${tokenData.access_token.length} chars)` : 'NOT FOUND',
        refresh_token: tokenData.refresh_token ? `FOUND (${tokenData.refresh_token.length} chars)` : 'NOT FOUND',
        created_at: tokenData.created_at,
        expires_at: tokenData.expires_at
      };
    } catch (fileError) {
      results.sources.stored_file = {
        file_exists: false,
        error: fileError instanceof Error ? fileError.message : String(fileError),
        file_path: tokensFile
      };
    }
    
    // Check for any token-related files in data directory
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const dataFiles = await fs.readdir(dataDir);
      results.sources.data_directory = {
        files: dataFiles,
        path: dataDir
      };
    } catch (dirError) {
      results.sources.data_directory = {
        error: dirError instanceof Error ? dirError.message : String(dirError)
      };
    }
    
    // Test token refresh if we have a refresh token
    if (decodedRefreshToken) {
      try {
        console.log('🔄 Testing token refresh with decoded token...');
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: decodedRefreshToken,
            grant_type: 'refresh_token'
          })
        });

        if (res.ok) {
          const tokenData = await res.json();
          results.token_refresh_test = {
            success: true,
            new_access_token_length: tokenData.access_token ? tokenData.access_token.length : 0,
            expires_in: tokenData.expires_in
          };
          console.log('✅ Token refresh successful!');
        } else {
          const errorText = await res.text();
          results.token_refresh_test = {
            success: false,
            error: `${res.status}: ${errorText}`
          };
          console.log('❌ Token refresh failed:', res.status, errorText);
        }
      } catch (refreshError) {
        results.token_refresh_test = {
          success: false,
          error: refreshError instanceof Error ? refreshError.message : String(refreshError)
        };
        console.log('❌ Token refresh error:', refreshError);
      }
    } else {
      results.token_refresh_test = {
        success: false,
        error: 'No refresh token available for testing'
      };
    }

    // Summary recommendation
    let recommendation = '';
    if (cookieAccessToken || results.sources.stored_file.access_token === 'FOUND' || process.env.GOOGLE_ACCESS_TOKEN) {
      recommendation = '✅ Tokens found! The API should work.';
    } else if (results.token_refresh_test.success) {
      recommendation = '✅ Refresh token works! Can obtain new access tokens.';
    } else {
      recommendation = '❌ No tokens found or refresh failed. You need to authenticate with Google on the website first.';
    }
    
    results.recommendation = recommendation;
    
    return NextResponse.json({
      success: true,
      message: 'Google OAuth token debugging complete',
      data: results
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      message: error.message
    }, { status: 500 });
  }
}