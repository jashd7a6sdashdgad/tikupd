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

    // Load expenses from storage
    const expenses = await expenseStorage.loadExpenses();

    return NextResponse.json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses: expenses,
        total: expenses.length,
        storageType: expenseStorage.getStorageType(),
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