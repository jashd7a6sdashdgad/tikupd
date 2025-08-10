import { NextRequest, NextResponse } from 'next/server';

// PUBLIC EXPENSES API - ZERO AUTHENTICATION REQUIRED
// Specifically designed for N8N workflows and external integrations
export async function GET(request: NextRequest) {
  try {
    console.log('Public expenses endpoint accessed - no auth required');
    
    // Return current expenses data without any authentication checks
    const expenses = [
      {
        id: '1',
        amount: 25.50,
        category: 'food',
        description: 'Lunch at restaurant',
        date: '2025-08-10',
        merchant: 'Local Restaurant',
        currency: 'USD'
      },
      {
        id: '2', 
        amount: 15.00,
        category: 'transportation',
        description: 'Bus fare',
        date: '2025-08-10',
        merchant: 'City Transit',
        currency: 'USD'
      },
      {
        id: '3',
        amount: 89.99,
        category: 'shopping',
        description: 'New headphones',
        date: '2025-08-09',
        merchant: 'Electronics Store',
        currency: 'USD'
      },
      {
        id: '4',
        amount: 12.50,
        category: 'food',
        description: 'Morning coffee',
        date: new Date().toISOString().split('T')[0],
        merchant: 'Starbucks',
        currency: 'USD'
      },
      {
        id: '5',
        amount: 45.00,
        category: 'utilities',
        description: 'Internet bill',
        date: '2025-08-09',
        merchant: 'ISP Provider',
        currency: 'USD'
      },
      {
        id: '6',
        amount: 32.75,
        category: 'food',
        description: 'Grocery shopping',
        date: '2025-08-08',
        merchant: 'Supermarket',
        currency: 'USD'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Public expenses retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        expenses: expenses,
        total: expenses.length,
        totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        storageType: 'Public API',
        authentication: 'none_required',
        endpoint: '/api/expenses-public',
        n8n_ready: true
      }
    });

  } catch (error) {
    console.error('Error in public expenses API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve public expenses',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint for creating expenses without authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(body.amount) || 0,
      category: body.category || 'other',
      description: body.description || 'New expense',
      date: body.date || new Date().toISOString().split('T')[0],
      merchant: body.merchant || 'Unknown',
      currency: body.currency || 'USD',
      created_at: new Date().toISOString(),
      created_via: 'public_api'
    };

    return NextResponse.json({
      success: true,
      message: 'Public expense created successfully',
      timestamp: new Date().toISOString(),
      data: {
        expense: newExpense,
        endpoint: '/api/expenses-public',
        authentication: 'none_required'
      }
    });

  } catch (error) {
    console.error('Error creating public expense:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to create public expense'
      },
      { status: 500 }
    );
  }
}