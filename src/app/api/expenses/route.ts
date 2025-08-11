import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import { expenseStorage } from '@/lib/storage/expenseStorage';

// GET /api/expenses - Get all expenses (requires valid API token)
export async function GET(request: NextRequest) {
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
    
    // Check if token has required permissions
    if (!hasPermission(validToken, 'read:expenses')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Token requires read:expenses permission' },
        { status: 403 }
      );
    }

    // Load expenses from the same source as the website (Google Sheets)
    let expenses: any[] = [];
    let storageType = 'Local Storage (Fallback)';
    
    try {
      // Try to get expenses from Google Sheets (same as website)
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : request.url.split('/api/')[0];
        
      console.log('Attempting to fetch expenses from Google Sheets API...');
      
      // Make internal API call to get real expense data from Google Sheets
      // Note: This requires Google OAuth cookies which API tokens don't have
      const sheetsResponse = await fetch(`${baseUrl}/api/sheets/expenses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Internal-API-Expenses-Integration',
          // Copy cookies for authentication if available (likely empty for API calls)
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      console.log('Google Sheets API response status:', sheetsResponse.status);

      if (sheetsResponse.ok) {
        const sheetsData = await sheetsResponse.json();
        if (sheetsData.success && sheetsData.data.expenses) {
          expenses = sheetsData.data.expenses;
          storageType = 'Google Sheets (Website Data)';
          console.log(`Loaded ${expenses.length} expenses from Google Sheets`);
        } else {
          console.log('Google Sheets API returned no data, falling back to local storage');
          expenses = await expenseStorage.loadExpenses();
        }
      } else {
        console.log('Google Sheets API not available, falling back to local storage');
        expenses = await expenseStorage.loadExpenses();
      }
    } catch (error) {
      console.error('Error fetching from Google Sheets, falling back to local storage:', error);
      expenses = await expenseStorage.loadExpenses();
    }
    
    // If still no real data, check if we should create sample data in persistent storage
    if (expenses.length === 0 || (expenses.length > 0 && expenses[0].id?.includes('sample'))) {
      console.log('No real expense data found. Add expenses via POST to this endpoint or through the website.');
      console.log('For testing purposes, API will return sample data. To add real data:');
      console.log('POST /api/expenses with: {"amount": 50, "category": "food", "description": "Real expense"}');
    }

    return NextResponse.json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses: expenses,
        total: expenses.length,
        storageType: storageType,
        token: {
          name: validToken.name,
          permissions: validToken.permissions,
          createdAt: validToken.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error in expenses API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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