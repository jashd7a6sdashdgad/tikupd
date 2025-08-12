import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import { verifyToken } from '@/lib/auth';
import { expenseStorage } from '@/lib/storage/expenseStorage';
import { fetchExpensesFromSheets } from '@/lib/google/serviceAccount';
import jwt from 'jsonwebtoken';

// GET /api/expenses - Get all expenses (supports both API tokens and website JWT)
export async function GET(request: NextRequest) {
  // Declare variables at function level so they're accessible throughout
  let expenses: any[] = [];
  let storageType = 'Google Sheets (Real Data)';
  let analyticsData: any = null;
  let validToken: any = null;
  let authType = 'unknown';
  
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Try to validate as website JWT first (your specific token)
    try {
      console.log('🔍 Trying to validate as website JWT...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
      console.log('✅ Website JWT validated successfully:', decoded);
      
      validToken = {
        id: decoded.userId || '1',
        name: decoded.username || 'website-user',
        permissions: ['*'], // Website JWT has full permissions
        email: decoded.email,
        type: 'website-jwt'
      };
      authType = 'website-jwt';
      
    } catch (jwtError) {
      console.log('⚠️ Website JWT validation failed:', jwtError.message);
      console.log('🔍 Trying API token validation...');
      
      // Try to validate as API token
      const validation = await validateApiToken(authHeader);
      
      if (!validation.isValid) {
        console.log('❌ Both JWT and API token validation failed');
        return NextResponse.json(
          { 
            success: false,
            error: 'Authentication failed',
            message: 'Invalid token. Please use either a valid website JWT or API token.',
            details: {
              jwtError: jwtError.message,
              apiTokenError: validation.error,
              tokenPreview: token.substring(0, 20) + '...'
            }
          },
          { status: 401 }
        );
      }
      
      validToken = validation.token!;
      authType = 'api-token';
      
      // Check if API token has required permissions
      if (!hasPermission(validToken, 'read:expenses')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions. Token requires read:expenses permission' 
          },
          { status: 403 }
        );
      }
    }

    // INTEGRATION FIX: Fetch real data from Google Sheets using multiple methods
    
    const spreadsheetId = process.env.EXPENSES_SPREADSHEET_ID || '1d2OgyNgTKSX-ACVkdWjarBp6WHh1mDvtflOrUO1dCNk';
    
    // Method 1: Try Service Account (direct Google Sheets API access)
    try {
      console.log('📊 Method 1: Trying Service Account access to Google Sheets...');
      const sheetsData = await fetchExpensesFromSheets(spreadsheetId);
      
      expenses = sheetsData.expenses;
      analyticsData = sheetsData.analytics;
      storageType = 'Google Sheets (Service Account)';
      console.log(`✅ Method 1 Success: Fetched ${expenses.length} expenses via Service Account`);
      
    } catch (serviceAccountError: any) {
      console.log('⚠️ Method 1 Failed: Service Account not available:', serviceAccountError.message);
      
      // Method 2: Try direct Google Sheets access with OAuth tokens from environment or default user
      try {
        console.log('🔗 Method 2: Trying direct Google Sheets API with OAuth...');
        
        // For API token access, we'll use a service approach - check for stored OAuth tokens
        // This assumes you have OAuth tokens stored for the system user
        const { getGoogleSheetsClient } = await import('@/lib/google');
        const { SPREADSHEET_ID, getSheetConfig, SheetHelpers } = await import('@/lib/sheets-config');
        
        // Try to get OAuth tokens from multiple sources
        let accessToken = request.cookies?.get('google_access_token')?.value || process.env.GOOGLE_ACCESS_TOKEN;
        let refreshToken = request.cookies?.get('google_refresh_token')?.value || process.env.GOOGLE_REFRESH_TOKEN;
        
        // If no tokens from cookies/env, try to read from stored tokens file
        if (!accessToken) {
          try {
            const { promises: fs } = await import('fs');
            const path = await import('path');
            const tokensFile = path.join(process.cwd(), 'data', 'tokens', 'google-oauth-tokens.json');
            const tokenData = JSON.parse(await fs.readFile(tokensFile, 'utf-8'));
            accessToken = tokenData.accessToken;
            refreshToken = tokenData.refreshToken;
            console.log('📁 Using stored OAuth tokens for API access');
          } catch (fileError: any) {
            console.log('📁 No stored OAuth tokens found:', fileError.message);
          }
        }
        
        if (!accessToken) {
          throw new Error('Google OAuth tokens not available. User must authenticate with Google first or use /api/copy-local-tokens to store tokens.');
        }

        const sheets = await getGoogleSheetsClient({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        const EXPENSES_CONFIG = getSheetConfig('expenses');
        const range = EXPENSES_CONFIG.range;
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range,
        });

        const rows = response.data.values || [];
        
        if (rows.length === 0) {
          expenses = [];
          storageType = 'Google Sheets (Direct OAuth - No Data)';
        } else {
          // Skip header row and convert to structured data
          const dataRows = rows.slice(1);
          const rawExpenses = dataRows.map((row, index) => ({
            id: row[7] || (index + 1).toString(),
            from: row[0] || '',
            date: row[1] || '',
            creditAmount: parseFloat(row[2]) || 0,
            debitAmount: parseFloat(row[3]) || 0,
            category: row[4] || 'General',
            description: row[5] || '',
            availableBalance: parseFloat(row[6]) || 0
          }));

          // Transform to API format
          expenses = rawExpenses.map((expense: any) => ({
            id: expense.id,
            amount: Math.abs(expense.debitAmount - expense.creditAmount), // Use net amount
            category: expense.category?.toLowerCase() || 'general',
            description: expense.description || 'Expense from Google Sheets',
            date: expense.date || new Date().toISOString().split('T')[0],
            merchant: expense.from || 'Unknown Merchant',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Preserve original Google Sheets fields
            originalData: {
              from: expense.from,
              creditAmount: expense.creditAmount,
              debitAmount: expense.debitAmount,
              availableBalance: expense.availableBalance
            }
          }));

          // Calculate analytics from real data
          const total = rawExpenses.reduce((sum, expense) => sum + (expense.debitAmount - expense.creditAmount), 0);
          const categoryTotals = rawExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + (expense.debitAmount - expense.creditAmount);
            return acc;
          }, {} as Record<string, number>);

          analyticsData = {
            total,
            count: expenses.length,
            categoryTotals,
            averageExpense: expenses.length > 0 ? total / expenses.length : 0
          };

          storageType = 'Google Sheets (Direct OAuth)';
          console.log(`✅ Method 2 Success: Fetched ${expenses.length} real expenses from Google Sheets`);
        }
      } catch (oauthError: any) {
        console.log('⚠️ Method 2 Failed: Direct OAuth failed:', oauthError.message);
        throw new Error('All Google Sheets access methods failed: ' + oauthError.message);
      }
    }
    
    // If we get here without throwing, we have real data!
    console.log(`🎉 SUCCESS: Retrieved ${expenses.length} real expenses from ${storageType}`);
    
  } catch (allMethodsError: any) {
    console.log('⚠️ All Google Sheets access methods failed:', allMethodsError.message);
      
    // Return error instead of mock data - user wants real data only
    return NextResponse.json({
      success: false,
      error: 'Unable to access real expense data',
      message: 'Google Sheets API access failed. Please ensure you are authenticated with Google and have proper permissions.',
      details: {
        spreadsheetId: process.env.EXPENSES_SPREADSHEET_ID || 'Not configured',
        error: allMethodsError.message,
        suggestions: [
          'Make sure you are logged in with Google OAuth',
          'Check that Google Sheets API is enabled for your project',
          'Verify the spreadsheet ID is correct',
          'Ensure the spreadsheet is accessible by your Google account'
        ]
      }
    }, { status: 503 }); // Service Unavailable
  }

  // Calculate analytics if not provided by Google Sheets
  if (!analyticsData) {
    const total = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const categoryTotals = expenses.reduce((acc: any, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});
    
    analyticsData = {
      total,
      count: expenses.length,
      categoryTotals,
      averageExpense: expenses.length > 0 ? total / expenses.length : 0
    };
  }

  return NextResponse.json({
    success: true,
    message: `Expenses retrieved successfully from ${storageType}`,
    data: {
      expenses: expenses,
      total: expenses.length,
      analytics: analyticsData,
      storageType: storageType,
      spreadsheetId: process.env.EXPENSES_SPREADSHEET_ID || 'Not configured',
      token: {
        name: validToken ? validToken.name : 'Unknown',
        permissions: validToken ? validToken.permissions : [],
        type: authType,
        createdAt: validToken ? validToken.createdAt : new Date().toISOString()
      }
    }
  });
}

// POST /api/expenses - Create new expense (requires write permission)
export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    // Validate the token
    const validation = await validateApiToken(authHeader);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }
    
    const validToken = validation.token!;
    
    // Check if token has write permissions
    if (!hasPermission(validToken, 'write:expenses')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Token requires write:expenses permission' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { amount, category, description, date, merchant } = body;

    // Validate required fields
    if (!amount || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, category, and description are required' },
        { status: 400 }
      );
    }

    // Save expense to storage
    const newExpense = await expenseStorage.addExpense({
      amount: parseFloat(amount),
      category,
      description,
      date: date || new Date().toISOString().split('T')[0],
      merchant: merchant || 'Unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Expense created successfully',
      data: {
        expense: newExpense,
        token: {
          name: validToken.name,
          permissions: validToken.permissions
        }
      }
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}