import { NextRequest, NextResponse } from 'next/server';
import { withTokenAuth } from '@/lib/apiWrapper';
import { PERMISSIONS } from '@/lib/tokenAuth';
import { getGoogleSheetsClient } from '@/lib/google';
import { SPREADSHEET_ID, getSheetConfig } from '@/lib/sheets-config';

const EXPENSES_CONFIG = getSheetConfig('expenses');

// GET /api/expenses - Read expenses with token authentication
const getExpenses = async (request: NextRequest, context: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    // Log API usage
    console.log(`[TOKEN AUTH] Expenses accessed by: ${context?.token?.name || 'Unknown'}`);

    // Get Google Sheets client
    const client = await getGoogleSheetsClient();
    if (!client) {
      return NextResponse.json({ 
        success: false, 
        error: 'Google Sheets service unavailable' 
      }, { status: 503 });
    }

    // Read expenses from Google Sheets
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: EXPENSES_CONFIG.range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        message: 'No expenses found' 
      });
    }

    // Parse expenses data
    const headers = rows[0];
    const expenses = rows.slice(1).map((row, index) => {
      const expense: any = { id: index + 1 };
      headers.forEach((header, colIndex) => {
        expense[header.toLowerCase()] = row[colIndex] || '';
      });
      return expense;
    });

    // Apply filters
    let filteredExpenses = expenses;
    
    if (startDate || endDate || category) {
      filteredExpenses = expenses.filter((expense) => {
        // Date filtering
        if (startDate && expense.date) {
          const expenseDate = new Date(expense.date);
          if (expenseDate < new Date(startDate)) return false;
        }
        if (endDate && expense.date) {
          const expenseDate = new Date(expense.date);
          if (expenseDate > new Date(endDate)) return false;
        }
        
        // Category filtering
        if (category && expense.category?.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
        
        return true;
      });
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredExpenses = filteredExpenses.slice(0, limitNum);
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredExpenses,
      meta: {
        total: expenses.length,
        filtered: filteredExpenses.length,
        filters: { startDate, endDate, category, limit }
      }
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch expenses',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// POST /api/expenses - Create new expense with token authentication
const createExpense = async (request: NextRequest, context: any) => {
  try {
    const body = await request.json();
    const {
      date,
      description,
      category,
      amount,
      currency = 'OMR',
      paymentMethod,
      notes
    } = body;

    // Validate required fields
    if (!date || !description || !category || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['date', 'description', 'category', 'amount']
      }, { status: 400 });
    }

    // Log API usage
    console.log(`[TOKEN AUTH] Expense created by: ${context?.token?.name || 'Unknown'}`);

    // Get Google Sheets client
    const client = await getGoogleSheetsClient();
    if (!client) {
      return NextResponse.json({ 
        success: false, 
        error: 'Google Sheets service unavailable' 
      }, { status: 503 });
    }

    // Prepare expense data
    const timestamp = new Date().toISOString();
    const expenseRow = [
      timestamp, // Timestamp
      date,
      description,
      category,
      parseFloat(amount).toFixed(2),
      currency,
      paymentMethod || '',
      notes || '',
      context?.token?.name || 'API',
      'Active'
    ];

    // Append to Google Sheets
    const response = await client.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: EXPENSES_CONFIG.range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [expenseRow]
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Expense created successfully',
      data: {
        id: timestamp,
        date,
        description,
        category,
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        notes,
        createdBy: context?.token?.name || 'API',
        createdAt: timestamp
      }
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create expense',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// Export wrapped handlers
export const GET = withTokenAuth(getExpenses, PERMISSIONS.READ_EXPENSES);
export const POST = withTokenAuth(createExpense, PERMISSIONS.WRITE_EXPENSES);