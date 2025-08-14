import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Google Sheets access...');

    // Try to get tokens from multiple sources
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    // Method 1: Try from cookies
    const cookies = request.cookies;
    accessToken = cookies.get('google_access_token')?.value;
    refreshToken = cookies.get('google_refresh_token')?.value;
    
    console.log('🍪 Cookies check:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });

    // Method 2: Try from environment variables
    if (!accessToken || !refreshToken) {
      accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      console.log('🌍 Env vars check:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken 
      });
    }

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No Google OAuth tokens found. Please authenticate via /api/auth/google',
        tokenSources: {
          cookies: { hasAccess: false, hasRefresh: false },
          envVars: { hasAccess: !!process.env.GOOGLE_ACCESS_TOKEN, hasRefresh: !!process.env.GOOGLE_REFRESH_TOKEN }
        }
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Get spreadsheet ID from env
    const spreadsheetId = process.env.GOOGLE_SHEETS_EXPENSES_ID || 
                          process.env.GOOGLE_SPREADSHEET_EXPENSES_ID || 
                          process.env.EXPENSES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'No spreadsheet ID found in environment variables',
        config: {
          GOOGLE_SHEETS_EXPENSES_ID: !!process.env.GOOGLE_SHEETS_EXPENSES_ID,
          GOOGLE_SPREADSHEET_EXPENSES_ID: !!process.env.GOOGLE_SPREADSHEET_EXPENSES_ID,
          EXPENSES_SPREADSHEET_ID: !!process.env.EXPENSES_SPREADSHEET_ID
        }
      });
    }

    console.log('📊 Testing access to spreadsheet:', spreadsheetId);

    // Test 1: Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('✅ Spreadsheet metadata retrieved');

    // Test 2: Try to read some data and show actual content
    const possibleRanges = ['Expenses!A1:H50', 'Sheet1!A1:H50', 'A1:H50'];
    let dataResult: { range: string; rows: number } | null = null;
    let actualData: any = null;
    
    for (const range of possibleRanges) {
      try {
        console.log(`🔍 Testing range: ${range}`);
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: range,
        });
        const rows = result.data.values || [];
        dataResult = { range, rows: rows.length };
        actualData = rows.slice(0, 10); // Show first 10 rows for debugging
        console.log(`✅ Data found in range ${range}: ${dataResult.rows} rows`);
        console.log('📋 Sample data:', actualData);
        break;
      } catch (rangeError: any) {
        console.log(`⚠️ Range ${range} failed:`, rangeError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Google Sheets access test successful',
      spreadsheet: {
        id: spreadsheetId,
        title: metadata.data.properties?.title,
        sheets: metadata.data.sheets?.map(sheet => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId,
          rowCount: sheet.properties?.gridProperties?.rowCount,
          columnCount: sheet.properties?.gridProperties?.columnCount
        }))
      },
      dataTest: dataResult,
      sampleData: actualData, // Show actual data for debugging
      tokenSource: accessToken === cookies.get('google_access_token')?.value ? 'cookies' : 'environment'
    });

  } catch (error: any) {
    console.error('❌ Sheets test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: `Google Sheets test failed: ${error.message}`,
      errorCode: error.code,
      details: error.response?.data || error.toString()
    });
  }
}