import { NextRequest, NextResponse } from 'next/server';

// Simple N8N expenses endpoint - NO AUTHENTICATION REQUIRED
export async function GET(request: NextRequest) {
  try {
    console.log('N8N expenses endpoint accessed');
    
    // Return current expense data without authentication
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
        description: 'Coffee',
        date: new Date().toISOString().split('T')[0],
        merchant: 'Starbucks',
        currency: 'USD',
        note: 'Fresh data from N8N endpoint'
      },
      {
        id: '5',
        amount: 45.00,
        category: 'utilities',
        description: 'Internet bill',
        date: '2025-08-09',
        merchant: 'ISP Provider',
        currency: 'USD'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'N8N expenses retrieved successfully',
      note: 'This endpoint requires NO authentication for N8N integration',
      timestamp: new Date().toISOString(),
      data: {
        expenses: expenses,
        total: expenses.length,
        totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        categories: [...new Set(expenses.map(e => e.category))],
        endpoint: '/api/n8n-expenses',
        authentication: 'none_required',
        n8n_ready: true
      }
    });

  } catch (error) {
    console.error('Error in N8N expenses API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve expenses for N8N',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint for creating expenses via N8N
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(body.amount) || 0,
      category: body.category || 'other',
      description: body.description || 'N8N expense',
      date: body.date || new Date().toISOString().split('T')[0],
      merchant: body.merchant || 'Unknown',
      currency: body.currency || 'USD',
      createdAt: new Date().toISOString(),
      source: 'n8n_workflow',
      note: 'Created via N8N - no auth required'
    };

    return NextResponse.json({
      success: true,
      message: 'N8N expense created successfully',
      data: {
        expense: newExpense,
        endpoint: '/api/n8n-expenses',
        authentication: 'none_required',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating N8N expense:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to create expense via N8N'
      },
      { status: 500 }
    );
  }
}