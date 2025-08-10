import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';

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

    // TODO: Replace this with actual expense data from your database
    // For now, return sample data to test the integration
    const sampleExpenses = [
      {
        id: '1',
        amount: 25.50,
        category: 'food',
        description: 'Lunch at restaurant',
        date: '2025-08-10',
        merchant: 'Local Restaurant'
      },
      {
        id: '2',
        amount: 15.00,
        category: 'transportation',
        description: 'Bus fare',
        date: '2025-08-10',
        merchant: 'City Transit'
      },
      {
        id: '3',
        amount: 89.99,
        category: 'shopping',
        description: 'New headphones',
        date: '2025-08-09',
        merchant: 'Electronics Store'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses: sampleExpenses,
        total: sampleExpenses.length,
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

    // TODO: Save the expense to your actual database
    // For now, just return success
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category,
      description,
      date: date || new Date().toISOString().split('T')[0],
      merchant: merchant || 'Unknown',
      createdAt: new Date().toISOString()
    };

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