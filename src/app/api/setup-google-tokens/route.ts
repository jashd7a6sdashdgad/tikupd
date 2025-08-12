import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;
    
    if (!access_token) {
      return NextResponse.json({
        success: false,
        error: 'access_token is required'
      }, { status: 400 });
    }
    
    console.log('🔐 Setting up Google OAuth tokens...');
    
    // Create tokens directory if it doesn't exist
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    const tokensDir = path.join(process.cwd(), 'data', 'tokens');
    try {
      await fs.mkdir(tokensDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Save tokens to file
    const tokenData = {
      access_token,
      refresh_token,
      created_at: new Date().toISOString(),
      expires_in: 3600, // Standard 1 hour for Google tokens
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    };
    
    const tokensFile = path.join(tokensDir, 'google-oauth-tokens.json');
    await fs.writeFile(tokensFile, JSON.stringify(tokenData, null, 2));
    
    console.log('✅ Google OAuth tokens saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Google OAuth tokens configured successfully',
      data: {
        access_token_length: access_token.length,
        refresh_token_available: !!refresh_token,
        tokens_file: tokensFile,
        created_at: tokenData.created_at
      }
    });
    
  } catch (error: any) {
    console.error('Error setting up Google tokens:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup Google tokens',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Google OAuth token status...');
    
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    // Check environment variables
    const envTokens = {
      access_token: process.env.GOOGLE_ACCESS_TOKEN ? 'PRESENT' : 'MISSING',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ? 'PRESENT' : 'MISSING'
    };
    
    // Check stored tokens file
    const tokensFile = path.join(process.cwd(), 'data', 'tokens', 'google-oauth-tokens.json');
    let fileTokens: any = null;
    try {
      const fileContent = await fs.readFile(tokensFile, 'utf-8');
      const tokenData = JSON.parse(fileContent);
      fileTokens = {
        access_token: tokenData.access_token ? 'PRESENT' : 'MISSING',
        refresh_token: tokenData.refresh_token ? 'PRESENT' : 'MISSING',
        created_at: tokenData.created_at,
        file_exists: true
      };
    } catch (error) {
      fileTokens = {
        file_exists: false,
        error: 'Token file not found'
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Google OAuth token status',
      data: {
        environment_variables: envTokens,
        stored_tokens_file: fileTokens,
        instructions: {
          setup_tokens: 'POST to this endpoint with access_token and refresh_token',
          get_tokens: 'Complete OAuth flow on the website and tokens will be automatically stored'
        }
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check token status',
      message: error.message
    }, { status: 500 });
  }
}