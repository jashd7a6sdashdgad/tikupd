import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging bank names from Google Sheets...');

    // Get tokens from cookies
    const cookies = request.cookies;
    const accessToken = cookies.get('google_access_token')?.value;
    const refreshToken = cookies.get('google_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No Google OAuth access token found. Please authenticate via /api/auth/google',
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
    const spreadsheetId = process.env.GOOGLE_SHEETS_EXPENSES_ID;

    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets expenses ID not found in environment variables',
      });
    }

    // Try different ranges to get data
    const possibleRanges = ['Expenses!A1:H50', 'Sheet1!A1:H50', 'A1:H50'];
    let response: any = null;
    
    for (const range of possibleRanges) {
      try {
        response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: range,
        });
        console.log(`✅ Data found with range: ${range}`);
        break;
      } catch (rangeError) {
        console.log(`❌ Range ${range} failed`);
        continue;
      }
    }

    if (!response) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch data from any range',
      });
    }

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({
        success: false,
        error: 'No data found in spreadsheet',
      });
    }

    const headers = rows[0];
    const expenseData = rows.slice(1);

    // Find the account type/name column
    const bankIndex = headers.findIndex(h => h && (
      h.toLowerCase().includes('account type') || 
      h.toLowerCase().includes('account name') ||
      h.toLowerCase().includes('account type/name') ||
      h.toLowerCase().includes('bank')
    ));

    const creditAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('credit amount'));
    const debitAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('debit amount'));

    if (bankIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find account type/name column in headers',
        headers: headers,
        bankIndex,
        creditAmountIndex,
        debitAmountIndex
      });
    }

    // Get all unique bank names
    const uniqueBankNames = [...new Set(expenseData
      .filter(row => row[bankIndex])
      .map(row => String(row[bankIndex]))
    )] as string[];

    // Show sample transactions
    const sampleTransactions = expenseData.slice(0, 20).map((row, index) => ({
      row: index + 2,
      accountType: row[bankIndex],
      creditAmount: row[creditAmountIndex],
      debitAmount: row[debitAmountIndex],
    }));

    // Test matching logic
    const bankTypes = [
      'Ahli Bank Saving Debit Account',
      'Ahli (Wafrah)', 
      'Ahli Bank Overdraft Current Account',
      'Ahli Bank Main Credit Card',
      'Bank Muscat Main Debit Account'
    ];

    const matchingResults = uniqueBankNames.map((bankName: string) => {
      // Test the current matching logic
      let matchedBank: string | null = null;
      const normalizedBankName = bankName.toLowerCase().trim();
      
      // Ahli (Wafrah) - CHECK FIRST
      if (!matchedBank && (normalizedBankName.includes('wafrah') || normalizedBankName.includes('wafra'))) {
        const wafrahBank = bankTypes.find(bank => bank.includes('Ahli (Wafrah)'));
        if (wafrahBank && (normalizedBankName.includes('ahli') || normalizedBankName.includes('alhli'))) {
          matchedBank = wafrahBank;
        }
      }
      
      // Ahli Overdraft
      if (!matchedBank && normalizedBankName.includes('overdraft')) {
        const overdraftBank = bankTypes.find(bank => bank.includes('Overdraft'));
        if (overdraftBank && (normalizedBankName.includes('ahli') || normalizedBankName.includes('alhli'))) {
          matchedBank = overdraftBank;
        }
      }
      
      // Ahli Credit Card
      if (!matchedBank && (normalizedBankName.includes('credit') || normalizedBankName.includes('card'))) {
        const creditBank = bankTypes.find(bank => bank.includes('Credit Card'));
        if (creditBank && (normalizedBankName.includes('ahli') || normalizedBankName.includes('alhli'))) {
          matchedBank = creditBank;
        }
      }
      
      // Bank Muscat
      if (!matchedBank && (normalizedBankName.includes('muscat') || normalizedBankName.includes('bm '))) {
        const muscatBank = bankTypes.find(bank => bank.includes('Bank Muscat'));
        if (muscatBank) {
          matchedBank = muscatBank;
        }
      }
      
      // Ahli Bank Saving Debit Account
      if (!matchedBank && (normalizedBankName.includes('ahli') || normalizedBankName.includes('alhli'))) {
        const savingBank = bankTypes.find(bank => bank.includes('Ahli Bank Saving'));
        if (savingBank) {
          matchedBank = savingBank;
        }
      }

      return {
        original: bankName,
        normalized: normalizedBankName,
        matched: matchedBank || 'NO MATCH'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        headers: headers,
        columnIndices: {
          bankIndex,
          creditAmountIndex,
          debitAmountIndex
        },
        totalRows: expenseData.length,
        uniqueBankNames: uniqueBankNames,
        sampleTransactions: sampleTransactions,
        matchingResults: matchingResults,
        expectedBankTypes: bankTypes
      }
    });

  } catch (error) {
    console.error('❌ Debug banks error:', error);
    return NextResponse.json({
      success: false,
      error: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}