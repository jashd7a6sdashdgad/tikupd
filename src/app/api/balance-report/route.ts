import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

interface BalanceReportEntry {
  bankAccountType: string;
  availableBalance: number;
  lastUpdatedRow: number;
  balanceSource: string;
  lastUpdatedDate?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generating latest balance report from Google Sheets...');

    // Get OAuth tokens from cookies
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

    // Fetch data from Google Sheets
    const possibleRanges = ['Expenses!A:Z', 'Sheet1!A:Z', 'A:Z'];
    let response: any = null;
    
    for (const range of possibleRanges) {
      try {
        response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: range,
        });
        console.log(`✅ Data fetched with range: ${range}`);
        break;
      } catch (rangeError) {
        console.log(`⚠️ Range ${range} failed`);
        continue;
      }
    }

    if (!response) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch data from Google Sheets',
      });
    }

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({
        success: false,
        error: 'No data found in Google Sheets',
      });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log('📋 Headers found:', headers);
    console.log(`📊 Processing ${dataRows.length} rows...`);

    // Find column indices
    const bankIndex = headers.findIndex(h => h && (
      h.toLowerCase().includes('account type') || 
      h.toLowerCase().includes('account name') ||
      h.toLowerCase().includes('account type/name') ||
      h.toLowerCase().includes('bank')
    ));

    const dateIndex = headers.findIndex(h => h && (
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('timestamp')
    ));

    const creditCardBalanceIndex = headers.findIndex(h => h && (
      h.toLowerCase().includes('credit card balance') ||
      h.toLowerCase().trim() === 'credit card balance' ||
      h.trim() === 'Credit Card Balance'
    ));
    
    const debitCardBalanceIndex = headers.findIndex(h => h && (
      h.toLowerCase().includes('debit card balance') ||
      h.toLowerCase().trim() === 'debit card balance' ||
      h.trim() === 'Debit Card Balance'
    ));

    console.log('📍 Column indices found:');
    console.log(`   Bank/Account: ${bankIndex} (${headers[bankIndex] || 'NOT FOUND'})`);
    console.log(`   Date: ${dateIndex} (${headers[dateIndex] || 'NOT FOUND'})`);
    console.log(`   Credit Card Balance: ${creditCardBalanceIndex} (${headers[creditCardBalanceIndex] || 'NOT FOUND'})`);
    console.log(`   Debit Card Balance: ${debitCardBalanceIndex} (${headers[debitCardBalanceIndex] || 'NOT FOUND'})`);

    if (bankIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find bank/account type column',
      });
    }

    if (creditCardBalanceIndex === -1 && debitCardBalanceIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find Credit Card Balance or Debit Card Balance columns',
      });
    }

    // Process data to find latest balance for each bank/account type
    const balanceData: { [key: string]: BalanceReportEntry } = {};

    dataRows.forEach((row, rowIndex) => {
      const bankAccountType = row[bankIndex];
      if (!bankAccountType || bankAccountType.trim() === '') return;

      const actualRowNumber = rowIndex + 2; // +2 because of header row and 0-based index
      const dateValue = dateIndex !== -1 ? row[dateIndex] : '';

      // Check for balance in appropriate column
      let balance = 0;
      let balanceSource = '';

      // Try Credit Card Balance column first (for all account types)
      if (creditCardBalanceIndex !== -1) {
        const rawValue = row[creditCardBalanceIndex];
        if (rawValue !== undefined && rawValue !== '' && rawValue !== null) {
          const parsed = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
          if (!isNaN(parsed) && parsed !== 0) {
            balance = parsed;
            balanceSource = 'Credit Card Balance';
          }
        }
      }

      // If no credit card balance found, try Debit Card Balance column
      if (balance === 0 && debitCardBalanceIndex !== -1) {
        const rawValue = row[debitCardBalanceIndex];
        if (rawValue !== undefined && rawValue !== '' && rawValue !== null) {
          const parsed = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
          if (!isNaN(parsed) && parsed !== 0) {
            balance = parsed;
            balanceSource = 'Debit Card Balance';
          }
        }
      }

      // Update balance data if this is a newer row with valid balance
      if (balance !== 0) {
        const existingEntry = balanceData[bankAccountType];
        
        if (!existingEntry || actualRowNumber > existingEntry.lastUpdatedRow) {
          balanceData[bankAccountType] = {
            bankAccountType,
            availableBalance: balance,
            lastUpdatedRow: actualRowNumber,
            balanceSource,
            lastUpdatedDate: dateValue
          };
          
          console.log(`💰 Latest balance for "${bankAccountType}": ${balance} OMR (Row ${actualRowNumber}, ${balanceSource})`);
        }
      }
    });

    // Convert to array and sort by bank name
    const balanceReport = Object.values(balanceData).sort((a, b) => 
      a.bankAccountType.localeCompare(b.bankAccountType)
    );

    console.log('✅ Balance report generated successfully');
    console.log(`📊 Found balances for ${balanceReport.length} unique bank accounts`);

    return NextResponse.json({
      success: true,
      data: {
        reportTitle: 'Latest Available Balances by Bank & Account Type',
        generatedAt: new Date().toISOString(),
        totalAccounts: balanceReport.length,
        balanceReport: balanceReport,
        columnInfo: {
          bankColumnHeader: headers[bankIndex],
          dateColumnHeader: dateIndex !== -1 ? headers[dateIndex] : 'Not found',
          creditCardBalanceHeader: creditCardBalanceIndex !== -1 ? headers[creditCardBalanceIndex] : 'Not found',
          debitCardBalanceHeader: debitCardBalanceIndex !== -1 ? headers[debitCardBalanceIndex] : 'Not found'
        }
      }
    });

  } catch (error) {
    console.error('❌ Balance report error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to generate balance report: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}