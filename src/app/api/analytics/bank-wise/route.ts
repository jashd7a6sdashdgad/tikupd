import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
// Code-based AI insights (no external API)

interface BankAnalysis {
  bankType: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  insights: string;
  trend: 'up' | 'down' | 'stable';
  healthScore: number;
  availableBalance: number;
}

interface BankAnalyticsResponse {
  success: boolean;
  data?: {
    bankAnalysis: BankAnalysis[];
    totalExpenses: number;
    overallHealthScore: number;
    topSpendingBank: string;
    mostActiveBank: string;
    bestPerformingBank: string;
    aiRecommendations: string[];
    analysisStatus: string;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<BankAnalyticsResponse>> {
  try {
    console.log('🏦 Starting REAL bank-wise analytics with Gemini AI...');

    // Initialize Google Sheets API using OAuth2 tokens
    // Try multiple sources for tokens: cookies, env vars, or file storage
    // eslint-disable-next-line prefer-const
    let accessToken: string | undefined;
    // eslint-disable-next-line prefer-const
    let refreshToken: string | undefined;

    // Method 1: Try from cookies (most reliable after OAuth flow)
    const cookies = request.cookies;
    accessToken = cookies.get('google_access_token')?.value;
    refreshToken = cookies.get('google_refresh_token')?.value;
    
    console.log('🍪 Checking cookies for tokens...', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });

    // Method 2: Try from environment variables (fallback)
    if (!accessToken || !refreshToken) {
      accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      console.log('🌍 Checking env vars for tokens...', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken 
      });
    }

    // Method 3: Try from file storage (if implemented)
    if (!accessToken || !refreshToken) {
      try {
        const { promises: fs } = await import('fs');
        const path = await import('path');
        const tokensFile = path.join(process.cwd(), 'data', 'tokens', 'google-oauth-tokens.json');
        const tokenData = JSON.parse(await fs.readFile(tokensFile, 'utf8'));
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token;
        console.log('📁 Checking file storage for tokens...', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken 
        });
      } catch (fileError) {
        console.log('⚠️ File token storage not available:', fileError);
      }
    }

    if (!accessToken) {
      console.error('❌ No Google OAuth access token found in any source');
      return NextResponse.json({ 
        success: false, 
        error: 'No Google OAuth access token found. Please visit /api/auth/google to authenticate.' 
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

    console.log('🔑 OAuth2 client configured with tokens from available source');

    // Set up token refresh
    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        console.log('🔄 New refresh token received');
        // In production, you'd want to save this back to your database or env
      }
      if (tokens.access_token) {
        console.log('🔄 Access token refreshed');
      }
    });

    // Try to refresh token proactively
    try {
      console.log('🔄 Refreshing OAuth2 token...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('✅ Token refreshed successfully');
    } catch (refreshError: any) {
      console.error('⚠️ Token refresh failed:', refreshError.message);
      // Continue anyway - might work with existing token
    }

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Check for spreadsheet ID with multiple possible env var names
    const spreadsheetId = process.env.GOOGLE_SHEETS_EXPENSES_ID || 
                          process.env.GOOGLE_SPREADSHEET_EXPENSES_ID || 
                          process.env.EXPENSES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.error('❌ Google Sheets ID not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Google Sheets expenses ID not found in environment variables' 
      });
    }

    console.log('🔑 Using OAuth2 authentication with spreadsheet:', spreadsheetId);

    // Fetch REAL expense data from Google Sheets
    console.log('📊 Fetching REAL expense data from Google Sheets...');
    let response;
    
    // Try different sheet names and ranges (same as balance-report)
    const possibleRanges = [
      'Expenses!A:Z',  // Extended range - preferred
      'Sheet1!A:Z',    // Extended range - default sheet
      'A:Z'            // Extended without sheet name
    ];
    
    let fetchError: any = null;
    for (const range of possibleRanges) {
      try {
        console.log(`🔍 Trying range: ${range}`);
        response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: range,
        });
        console.log(`✅ Successfully fetched data with range: ${range}`);
        break;
      } catch (rangeError: any) {
        console.log(`⚠️ Failed range ${range}:`, rangeError.message);
        fetchError = rangeError;
        continue;
      }
    }
    
    if (!response) {
      console.error('❌ All sheet ranges failed');
      
      // Handle token expiration and invalid_grant errors
      if (fetchError?.code === 401 || fetchError?.message?.includes('invalid_grant')) {
        return NextResponse.json({ 
          success: false, 
          error: 'OAuth token expired or invalid. Please visit /api/auth/google to re-authenticate with Google.' 
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Google Sheets API Error: ${fetchError?.message || 'All ranges failed'}. Check spreadsheet permissions and data format.` 
      });
    }

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      console.error('❌ No real data found in Google Sheets');
      return NextResponse.json({
        success: false,
        error: 'No transaction data found in Google Sheets - please add data to Sheet1'
      });
    }

    // Process the REAL data
    const headers = rows[0];
    const expenseData = rows.slice(1);
    
    console.log(`📈 Processing ${expenseData.length} REAL transactions...`);
    console.log('📋 Headers found:', headers);
    console.log('📊 Sample data (first 5 rows):', expenseData.slice(0, 5));
    
    // Debug: Show what bank names we actually have in the data  
    const bankIndex = headers.findIndex(h => h && (
      h.toLowerCase().includes('account type') || 
      h.toLowerCase().includes('account name') ||
      h.toLowerCase().includes('account type/name') ||
      h.toLowerCase().includes('bank')
    ));
    const creditAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('credit amount'));
    const debitAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('debit amount'));
    
    // Fallback to generic amount column if specific ones not found
    const amountIndex = creditAmountIndex !== -1 || debitAmountIndex !== -1 ? -1 : 
                      headers.findIndex(h => h && h.toLowerCase().includes('amount'));
    
    console.log('📍 Column indices:', { bankIndex, creditAmountIndex, debitAmountIndex, amountIndex });
    console.log('📋 Headers:', headers);
    
    const uniqueBanks = [...new Set(expenseData
      .filter(row => row[bankIndex])
      .map(row => row[bankIndex])
    )];
    console.log('🏦 Unique bank names in data:', uniqueBanks);
    
    // Show sample transactions with bank names and amounts
    const sampleTransactions = expenseData.slice(0, 10).map((row, index) => ({
      row: index + 2, // +2 because row 1 is headers and we're 0-indexed
      bank: row[bankIndex],
      creditAmount: row[creditAmountIndex],
      debitAmount: row[debitAmountIndex], 
      amount: row[amountIndex],
      fullRow: row
    }));
    console.log('💰 Sample transactions:', sampleTransactions);

    // Analyze REAL bank data
    const bankAnalysis = analyzeBankData(expenseData, headers);
    
    if (bankAnalysis.totalExpenses === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid expense data found - check data format in Google Sheets'
      });
    }

    // Generate AI insights using Gemini with REAL data
    console.log('🤖 Generating AI insights with REAL transaction data...');
    const aiInsights = await generateAIInsights(bankAnalysis, expenseData);
    
    console.log('✅ REAL bank analytics completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        ...bankAnalysis,
        ...aiInsights,
        analysisStatus: `Real analysis completed - ${expenseData.length} transactions processed`
      }
    });

  } catch (error) {
    console.error('❌ Error in REAL bank analytics:', error);
    return NextResponse.json({
      success: false,
      error: `Real data analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

function analyzeBankData(expenseData: any[][], headers: string[]) {
  const bankTypes = [
    'Ahli Bank Saving Debit Account',
    'Ahli (Wafrah)', 
    'Ahli Bank Overdraft Current Account',
    'Ahli Bank Main Credit Card',
    'Bank Muscat Main Debit Account'
  ];

  const bankIndex = headers.findIndex(h => h && (
    h.toLowerCase().includes('account type') || 
    h.toLowerCase().includes('account name') ||
    h.toLowerCase().includes('account type/name') ||
    h.toLowerCase().includes('bank')
  ));
  const creditAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('credit amount'));
  const debitAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('debit amount'));
  
  // Find balance columns (same logic as balance-report)
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
  
  console.log('💰 Balance columns detection:');
  console.log(`   All headers: [${headers.map((h, i) => `${i}:"${h}"`).join(', ')}]`);
  console.log(`   Date: ${dateIndex} (${headers[dateIndex] || 'NOT FOUND'})`);
  console.log(`   Credit Card Balance: ${creditCardBalanceIndex} (${headers[creditCardBalanceIndex] || 'NOT FOUND'})`);
  console.log(`   Debit Card Balance: ${debitCardBalanceIndex} (${headers[debitCardBalanceIndex] || 'NOT FOUND'})`);
  
  // Debug: Check each header for balance patterns
  headers.forEach((header, index) => {
    if (header && (header.toLowerCase().includes('balance') || header.toLowerCase().includes('card'))) {
      console.log(`   🔍 Found balance/card related header at ${index}: "${header}"`);
    }
  });
  
  // Fallback to generic amount column if specific ones not found
  const amountIndex = creditAmountIndex !== -1 || debitAmountIndex !== -1 ? -1 : 
                    headers.findIndex(h => h && h.toLowerCase().includes('amount'));

  const bankData: { [key: string]: { amount: number; count: number; transactions: any[]; availableBalance: number } } = {};
  let totalExpenses = 0;

  // Initialize bank data
  bankTypes.forEach(bank => {
    bankData[bank] = { amount: 0, count: 0, transactions: [], availableBalance: 0 };
  });
  
  // Process balance data first (same logic as balance-report)
  const balanceData: { [key: string]: { balance: number; lastUpdatedRow: number; rowIndex: number } } = {};
  
  console.log('💰 Starting balance data processing...');
  console.log(`   Processing ${expenseData.length} rows for balance data`);
  console.log(`   Looking for balance columns: Credit(${creditCardBalanceIndex}), Debit(${debitCardBalanceIndex})`);
  
  expenseData.forEach((row, rowIndex) => {
    const bankName = row[bankIndex] || '';
    if (!bankName.trim()) return;
    
    const actualRowNumber = rowIndex + 2; // +2 because of header row and 0-based index
    
    // Check for balance in appropriate columns
    let balance = 0;
    
    // Try Credit Card Balance column first
    if (creditCardBalanceIndex !== -1) {
      const rawValue = row[creditCardBalanceIndex];
      if (rawValue !== undefined && rawValue !== '' && rawValue !== null) {
        const parsed = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed) && parsed !== 0) {
          balance = parsed;
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
        }
      }
    }
    
    // Debug: Log balance processing for first few rows
    if (rowIndex < 5) {
      console.log(`   🔍 Row ${actualRowNumber}: Bank="${bankName}", Credit="${row[creditCardBalanceIndex]}", Debit="${row[debitCardBalanceIndex]}", Balance=${balance}`);
    }
    
    // Update balance data if this is a newer row with valid balance
    if (balance !== 0) {
      const existingEntry = balanceData[bankName];
      
      if (!existingEntry || actualRowNumber > existingEntry.lastUpdatedRow) {
        balanceData[bankName] = {
          balance: balance,
          lastUpdatedRow: actualRowNumber,
          rowIndex: rowIndex
        };
        
        console.log(`💰 Latest balance for "${bankName}": ${balance} OMR (Row ${actualRowNumber})`);
      }
    }
  });

  // Log balance processing results
  console.log('💰 Balance processing completed:');
  console.log(`   Found ${Object.keys(balanceData).length} unique banks with balances`);
  Object.entries(balanceData).forEach(([bank, data]) => {
    console.log(`   📊 "${bank}": ${data.balance} OMR (Row ${data.lastUpdatedRow})`);
  });

  // Track unmatched banks for debugging
  const unmatchedBanks = new Set<string>();
  
  // Process transactions
  expenseData.forEach(row => {
    const bankName = row[bankIndex] || '';
    
    // Handle separate credit and debit columns
    let amount = 0;
    let transactionType = '';
    
    if (creditAmountIndex !== -1 && debitAmountIndex !== -1) {
      const creditAmount = parseFloat(row[creditAmountIndex] || '0');
      const debitAmount = parseFloat(row[debitAmountIndex] || '0');
      
      if (creditAmount > 0) {
        amount = creditAmount;
        transactionType = 'credit';
      } else if (debitAmount > 0) {
        amount = -Math.abs(debitAmount); // Make debit amounts negative
        transactionType = 'debit';
      }
    } else if (amountIndex !== -1) {
      // Fallback to single amount column
      amount = parseFloat(row[amountIndex] || '0');
      transactionType = amount >= 0 ? 'credit' : 'debit';
    }

    // Improved bank name matching (specific patterns first to avoid conflicts)
    let matchedBank: string | null = null;
    const normalizedBankName = bankName.toLowerCase().trim();
    
    // STEP 1: Match exact bank names from your Google Sheets
    
    // "Debit Card (Wafrah)" → "Ahli (Wafrah)"
    if (!matchedBank && normalizedBankName === 'debit card (wafrah)') {
      matchedBank = 'Ahli (Wafrah)';
    }
    
    // "Overdraft Current Account" → "Ahli Bank Overdraft Current Account"
    if (!matchedBank && normalizedBankName === 'overdraft current account') {
      matchedBank = 'Ahli Bank Overdraft Current Account';
    }
    
    // "Credit Card" → "Ahli Bank Main Credit Card"  
    if (!matchedBank && normalizedBankName === 'credit card') {
      matchedBank = 'Ahli Bank Main Credit Card';
    }
    
    // "Saving Debit Account (Tofer)" → "Ahli Bank Saving Debit Account"
    if (!matchedBank && normalizedBankName === 'saving debit account (tofer)') {
      matchedBank = 'Ahli Bank Saving Debit Account';
    }
    
    // "Bank Muscat IBKY/IBE Main Debit Account" → "Bank Muscat Main Debit Account"
    if (!matchedBank && normalizedBankName.includes('bank muscat') && normalizedBankName.includes('ibky')) {
      matchedBank = 'Bank Muscat Main Debit Account';
    }
    
    // STEP 2: Fallback patterns (in case of slight variations)
    if (!matchedBank) {
      // Wafrah pattern
      if (normalizedBankName.includes('wafrah') || normalizedBankName.includes('wafra')) {
        matchedBank = 'Ahli (Wafrah)';
      }
      // Overdraft pattern
      else if (normalizedBankName.includes('overdraft')) {
        matchedBank = 'Ahli Bank Overdraft Current Account';
      }
      // Credit card pattern
      else if (normalizedBankName.includes('credit') && normalizedBankName.includes('card')) {
        matchedBank = 'Ahli Bank Main Credit Card';
      }
      // Bank Muscat pattern
      else if (normalizedBankName.includes('muscat') || (normalizedBankName.includes('bank') && normalizedBankName.includes('muscat'))) {
        matchedBank = 'Bank Muscat Main Debit Account';
      }
      // Saving/Tofer pattern
      else if (normalizedBankName.includes('tofer') || (normalizedBankName.includes('saving') && normalizedBankName.includes('debit'))) {
        matchedBank = 'Ahli Bank Saving Debit Account';
      }
    }
    
    // STEP 2: Fallback to exact/contains matching if no specific pattern matched
    if (!matchedBank) {
      const foundBank = bankTypes.find(bank => {
        const normalizedTargetBank = bank.toLowerCase();
        
        // Exact match
        if (normalizedBankName === normalizedTargetBank) return true;
        
        // Contains match (both ways)
        if (normalizedBankName.includes(normalizedTargetBank) || 
            normalizedTargetBank.includes(normalizedBankName)) return true;
        
        return false;
      });
      matchedBank = foundBank || null;
    }
    
    console.log(`🔍 Bank matching: "${bankName}" (${transactionType}: ${amount})`);
    console.log(`   Normalized: "${normalizedBankName}"`);
    console.log(`   -> Matched: "${matchedBank || 'NO MATCH'}"`);
    
    // Detailed matching debug
    if (!matchedBank && bankName.trim()) {
      console.log(`   ❓ Why no match for "${bankName}"?`);
      console.log(`      - Contains 'wafrah'? ${normalizedBankName.includes('wafrah')}`);
      console.log(`      - Contains 'wafra'? ${normalizedBankName.includes('wafra')}`);
      console.log(`      - Contains 'ahli'? ${normalizedBankName.includes('ahli')}`);
      console.log(`      - Contains 'alhli'? ${normalizedBankName.includes('alhli')}`);
      console.log(`      - Contains 'muscat'? ${normalizedBankName.includes('muscat')}`);
      console.log(`      - Contains 'overdraft'? ${normalizedBankName.includes('overdraft')}`);
      console.log(`      - Contains 'credit'? ${normalizedBankName.includes('credit')}`);
      console.log(`      - Contains 'card'? ${normalizedBankName.includes('card')}`);
    }

    if (matchedBank && amount !== 0) {
      bankData[matchedBank].amount += amount;
      bankData[matchedBank].count += 1;
      bankData[matchedBank].transactions.push(row);
      
      // Track expenses (negative amounts)
      if (amount < 0) {
        totalExpenses += Math.abs(amount);
      }
    } else if (bankName.trim()) {
      // Track unmatched banks
      unmatchedBanks.add(bankName);
    }
  });
  
  // Log unmatched banks for debugging
  if (unmatchedBanks.size > 0) {
    console.log('🚨 Unmatched bank names:', Array.from(unmatchedBanks));
    console.log('🎯 Expected bank types:', bankTypes);
    
    // Show which specific patterns we're looking for vs what we found
    Array.from(unmatchedBanks).forEach(unmatchedBank => {
      console.log(`❓ "${unmatchedBank}" failed to match any of these patterns:`);
      bankTypes.forEach(expectedBank => {
        const normalizedUnmatched = unmatchedBank.toLowerCase().trim();
        const normalizedExpected = expectedBank.toLowerCase();
        console.log(`  - "${expectedBank}": contains check (${normalizedUnmatched.includes(normalizedExpected) || normalizedExpected.includes(normalizedUnmatched)})`);
      });
    });
  }

  // Assign available balances to matched bank types
  console.log('💰 Assigning available balances to bank types...');
  Object.entries(balanceData).forEach(([bankName, balanceInfo]) => {
    // Find which bank type this balance belongs to (same matching logic as transactions)
    let matchedBankType: string | null = null;
    const normalizedBankName = bankName.toLowerCase().trim();
    
    // Use the same matching patterns as transaction processing
    if (normalizedBankName === 'debit card (wafrah)') {
      matchedBankType = 'Ahli (Wafrah)';
    } else if (normalizedBankName === 'overdraft current account') {
      matchedBankType = 'Ahli Bank Overdraft Current Account';
    } else if (normalizedBankName === 'credit card') {
      matchedBankType = 'Ahli Bank Main Credit Card';
    } else if (normalizedBankName === 'saving debit account (tofer)') {
      matchedBankType = 'Ahli Bank Saving Debit Account';
    } else if (normalizedBankName.includes('bank muscat') && normalizedBankName.includes('ibky')) {
      matchedBankType = 'Bank Muscat Main Debit Account';
    } else {
      // Fallback patterns
      if (normalizedBankName.includes('wafrah') || normalizedBankName.includes('wafra')) {
        matchedBankType = 'Ahli (Wafrah)';
      } else if (normalizedBankName.includes('overdraft')) {
        matchedBankType = 'Ahli Bank Overdraft Current Account';
      } else if (normalizedBankName.includes('credit') && normalizedBankName.includes('card')) {
        matchedBankType = 'Ahli Bank Main Credit Card';
      } else if (normalizedBankName.includes('muscat')) {
        matchedBankType = 'Bank Muscat Main Debit Account';
      } else if (normalizedBankName.includes('tofer') || (normalizedBankName.includes('saving') && normalizedBankName.includes('debit'))) {
        matchedBankType = 'Ahli Bank Saving Debit Account';
      }
    }
    
    if (matchedBankType && bankData[matchedBankType]) {
      bankData[matchedBankType].availableBalance = balanceInfo.balance;
      console.log(`💰 Assigned balance ${balanceInfo.balance} OMR to "${matchedBankType}" from "${bankName}"`);
    } else {
      console.log(`⚠️ Could not match balance for "${bankName}" to any bank type`);
    }
  });

  // Log summary of matched banks
  console.log('✅ Bank matching summary:');
  bankTypes.forEach(bank => {
    const data = bankData[bank];
    console.log(`  ${bank}: ${data.count} transactions, ${data.amount.toFixed(2)} OMR, Available: ${data.availableBalance.toFixed(2)} OMR`);
  });

  // Calculate percentages and create analysis
  const bankAnalysis: BankAnalysis[] = bankTypes.map(bank => {
    const data = bankData[bank];
    const percentage = totalExpenses > 0 ? (Math.abs(data.amount) / totalExpenses) * 100 : 0;
    
    return {
      bankType: bank,
      amount: data.amount,
      percentage: percentage,
      transactionCount: data.count,
      insights: generateBankInsight(bank, data.amount, data.count),
      trend: determineTrend(data.amount, data.count),
      healthScore: calculateHealthScore(data.amount, data.count, bank),
      availableBalance: data.availableBalance
    };
  });

  // Determine top banks
  const topSpendingBank = bankAnalysis.reduce((max, bank) => 
    Math.abs(bank.amount) > Math.abs(max.amount) ? bank : max
  ).bankType;

  const mostActiveBank = bankAnalysis.reduce((max, bank) => 
    bank.transactionCount > max.transactionCount ? bank : max
  ).bankType;

  const bestPerformingBank = bankAnalysis.reduce((max, bank) => 
    bank.healthScore > max.healthScore ? bank : max
  ).bankType;

  const overallHealthScore = Math.round(
    bankAnalysis.reduce((sum, bank) => sum + bank.healthScore, 0) / bankAnalysis.length
  );

  return {
    bankAnalysis,
    totalExpenses,
    overallHealthScore,
    topSpendingBank,
    mostActiveBank,
    bestPerformingBank
  };
}

async function generateAIInsights(bankAnalysis: any, expenseData: any[][]): Promise<{ aiRecommendations: string[] }> {
  console.log('🤖 Generating code-based insights...');
  
  try {

    // Prepare REAL data for analysis
    const totalTransactions = expenseData.length;
    const bankSummary = bankAnalysis.bankAnalysis.map((bank: any) => ({
      name: bank.bankType,
      amount: bank.amount,
      percentage: bank.percentage,
      transactions: bank.transactionCount,
      healthScore: bank.healthScore
    }));

    // Analyze spending patterns from real data
    const monthlySpending = Math.abs(bankAnalysis.totalExpenses);
    const highestSpender = bankAnalysis.topSpendingBank;
    const mostActive = bankAnalysis.mostActiveBank;
    const bestPerformer = bankAnalysis.bestPerformingBank;
    
    // Create generic prompt without personal details
    const prompt = `You are a professional financial advisor analyzing bank transaction patterns. 

TRANSACTION SUMMARY (ANONYMIZED):
- Total Transactions: ${totalTransactions}
- Total Monthly Amount: ${monthlySpending.toFixed(2)} OMR
- Primary Spending Account: Account with highest activity
- Most Used Account: Account with most transactions
- Best Account: Account with best health score

ACCOUNT DISTRIBUTION:
${bankSummary.map((bank, index) => 
  `• Account ${index + 1}: ${Math.abs(bank.amount).toFixed(0)} OMR (${bank.percentage.toFixed(0)}%) - ${bank.transactions} transactions`
).join('\n')}

Based on these general spending patterns, provide exactly 3 financial recommendations:

1. 🎯 One spending optimization strategy
2. ⚠️ One financial risk to watch
3. 📊 One improvement for better financial health

Requirements:
- Keep each recommendation under 80 characters
- Be actionable and professional
- Use general financial advice principles
- Start each with the specified emoji`;

    console.log('🔄 Analyzing spending patterns with code logic...');
    
    // Code-based analysis logic
    const recommendations = generateCodeBasedRecommendations(bankAnalysis, expenseData);

    // Validate we have 3 recommendations
    if (recommendations && recommendations.length >= 3) {
      console.log('✅ Code-based recommendations generated successfully:', recommendations);
      return { aiRecommendations: recommendations };
    } else {
      console.error('❌ Code analysis incomplete - only got', recommendations?.length, 'recommendations');
      throw new Error(`Code analysis returned only ${recommendations?.length} recommendations instead of 3`);
    }

  } catch (error: any) {
    console.error('❌ Code-based analysis failed:', error);
    throw error;
  }
}



function generateBankInsight(bankType: string, amount: number, transactionCount: number): string {
  if (bankType.includes('Credit Card')) {
    return amount < -1000 ? 'High credit usage this month' : 'Moderate credit card activity';
  } else if (bankType.includes('Wafrah')) {
    return amount > 0 ? 'Positive savings growth' : 'Consider increasing savings contributions';
  } else if (bankType.includes('Overdraft')) {
    return Math.abs(amount) > 500 ? 'High overdraft usage detected' : 'Controlled overdraft usage';
  } else if (bankType.includes('Saving')) {
    return transactionCount > 50 ? 'Very active primary account' : 'Regular account usage';
  } else {
    return 'Standard account activity';
  }
}

function determineTrend(amount: number, count: number): 'up' | 'down' | 'stable' {
  // Simple trend determination - in real scenario, compare with previous period
  if (Math.abs(amount) > 1000) return 'up';
  if (Math.abs(amount) < 100) return 'down';
  return 'stable';
}

function calculateHealthScore(amount: number, transactionCount: number, bankType: string): number {
  let score = 50; // Base score
  
  // Adjust based on bank type
  if (bankType.includes('Wafrah') && amount > 0) score += 30; // Savings growth is good
  if (bankType.includes('Credit Card') && Math.abs(amount) > 2000) score -= 20; // High credit usage is risky
  if (bankType.includes('Overdraft') && Math.abs(amount) > 1000) score -= 15; // High overdraft usage
  
  // Adjust based on transaction count
  if (transactionCount > 0 && transactionCount < 100) score += 10; // Reasonable activity
  if (transactionCount > 100) score -= 5; // Very high activity might indicate poor budgeting
  
  return Math.max(0, Math.min(100, score));
}

// Code-based recommendation engine
function generateCodeBasedRecommendations(bankAnalysis: any, expenseData: any[][]): string[] {
  const recommendations: string[] = [];
  const { bankAnalysis: banks, totalExpenses, topSpendingBank, mostActiveBank } = bankAnalysis;
  
  // Analysis 1: High spending analysis
  const highSpendingBank = banks.find((bank: any) => Math.abs(bank.amount) > 2000);
  if (highSpendingBank) {
    recommendations.push(`🎯 High spending detected on ${highSpendingBank.bankType} - Consider setting monthly limits`);
  } else {
    recommendations.push(`🎯 Spending levels are manageable - Continue current budgeting approach`);
  }
  
  // Analysis 2: Credit card usage warning
  const creditCardBank = banks.find((bank: any) => bank.bankType.includes('Credit Card'));
  if (creditCardBank && Math.abs(creditCardBank.amount) > 1500) {
    recommendations.push(`⚠️ High credit card usage (${Math.abs(creditCardBank.amount).toFixed(0)} OMR) - Pay down balance`);
  } else if (creditCardBank && Math.abs(creditCardBank.amount) > 500) {
    recommendations.push(`⚠️ Monitor credit card spending - Currently at ${Math.abs(creditCardBank.amount).toFixed(0)} OMR`);
  } else {
    recommendations.push(`⚠️ Credit usage is controlled - Good financial discipline maintained`);
  }
  
  // Analysis 3: Savings and debit optimization
  const savingsBank = banks.find((bank: any) => bank.bankType.includes('Saving') || bank.bankType.includes('Wafrah'));
  const debitBanks = banks.filter((bank: any) => bank.bankType.includes('Debit'));
  
  if (savingsBank && savingsBank.amount > 0) {
    recommendations.push(`📊 Positive savings growth in ${savingsBank.bankType} - Keep building emergency fund`);
  } else if (debitBanks.length > 0 && debitBanks.some((bank: any) => Math.abs(bank.amount) > 1000)) {
    recommendations.push(`📊 Heavy debit usage detected - Consider automated savings transfers`);
  } else {
    recommendations.push(`📊 Balance spending across accounts - Optimize cash flow management`);
  }
  
  // Analysis 4: Account activity patterns
  const veryActiveBank = banks.find((bank: any) => bank.transactionCount > 50);
  if (veryActiveBank) {
    recommendations.push(`💳 ${veryActiveBank.bankType} is very active (${veryActiveBank.transactionCount} transactions) - Review for unnecessary fees`);
  }
  
  // Analysis 5: Overdraft warning
  const overdraftBank = banks.find((bank: any) => bank.bankType.includes('Overdraft'));
  if (overdraftBank && Math.abs(overdraftBank.amount) > 800) {
    recommendations.push(`🚨 High overdraft usage (${Math.abs(overdraftBank.amount).toFixed(0)} OMR) - Urgent attention needed`);
  }
  
  // Return top 3 most relevant recommendations
  return recommendations.slice(0, 3);
}