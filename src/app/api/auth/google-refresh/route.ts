import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting Google OAuth token refresh...');

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Google OAuth client credentials not configured'
      });
    }

    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Google refresh token not found. Please re-authenticate via /api/auth/google'
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    console.log('🔄 Refreshing access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token) {
      console.log('✅ New access token obtained');
      
      // Test the new token with a simple API call
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      
      try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_EXPENSES_ID || 
                             process.env.GOOGLE_SPREADSHEET_EXPENSES_ID || 
                             process.env.EXPENSES_SPREADSHEET_ID;
        
        if (spreadsheetId) {
          console.log('🧪 Testing new token with sheets access...');
          await sheets.spreadsheets.get({ spreadsheetId });
          console.log('✅ Token test successful - can access spreadsheet');
        }
      } catch (testError) {
        console.log('⚠️ Token test failed, but token was refreshed:', testError);
      }

      return NextResponse.json({
        success: true,
        message: 'Google OAuth token refreshed successfully',
        tokenInfo: {
          hasAccessToken: !!credentials.access_token,
          hasRefreshToken: !!credentials.refresh_token,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'Unknown'
        }
      });
    } else {
      throw new Error('No access token received from refresh');
    }

  } catch (error: any) {
    console.error('❌ Token refresh failed:', error);
    
    if (error.message?.includes('invalid_grant')) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token is invalid or expired. Please re-authenticate via /api/auth/google',
        requiresReauth: true
      });
    }

    return NextResponse.json({
      success: false,
      error: `Token refresh failed: ${error.message || 'Unknown error'}`
    });
  }
}