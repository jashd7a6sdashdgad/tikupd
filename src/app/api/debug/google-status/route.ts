import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check cookies for Google tokens
    const accessToken = request.cookies.get('google_access_token')?.value;
    const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
    const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
    
    // Check environment variables
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const googleSheetsId = process.env.GOOGLE_SHEETS_ID;
    
    const status = {
      cookies: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length || 0
      },
      environment: {
        hasAccessToken: !!envAccessToken,
        hasRefreshToken: !!envRefreshToken,
        hasSheetsId: !!googleSheetsId,
        accessTokenLength: envAccessToken?.length || 0
      },
      sheetsId: googleSheetsId
    };
    
    // Try to test Google Sheets access
    let sheetsTest: any = null;
    const finalAccessToken = accessToken || envAccessToken;
    
    if (finalAccessToken && googleSheetsId) {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}/values/Expenses!A1:K1`,
          {
            headers: {
              'Authorization': `Bearer ${finalAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          sheetsTest = {
            success: true,
            headers: data.values?.[0] || null,
            status: response.status
          };
        } else {
          const errorText = await response.text();
          sheetsTest = {
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
            status: response.status
          };
        }
      } catch (error) {
        sheetsTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        sheetsTest,
        hasValidTokens: !!(finalAccessToken && googleSheetsId),
        recommendation: !finalAccessToken ? 'Need to authenticate with Google' :
                      !googleSheetsId ? 'Need to set GOOGLE_SHEETS_ID environment variable' :
                      sheetsTest?.success ? 'Google connection looks good!' :
                      'Google Sheets API access failed - may need to re-authenticate'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}