import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint for N8N without authentication requirements
export async function GET(request: NextRequest) {
  try {
    console.log('Test expenses endpoint accessed');
    
    // Return test expense data without authentication
    const testExpenses = [
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
      },
      {
        id: '4',
        amount: 12.50,
        category: 'food',
        description: 'Coffee',
        date: new Date().toISOString().split('T')[0],
        merchant: 'Starbucks',
        note: 'Test endpoint - no auth required'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Test expenses retrieved successfully',
      note: 'This is a test endpoint for N8N integration without authentication',
      data: {
        expenses: testExpenses,
        total: testExpenses.length,
        timestamp: new Date().toISOString(),
        endpoint: '/api/test-expenses',
        authentication: 'none_required'
      }
    });

  } catch (error) {
    console.error('Error in test expenses API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for testing creation without auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newExpense = {
      id: Date.now().toString(),
      ...body,
      date: body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      note: 'Created via test endpoint - no auth required'
    };

    return NextResponse.json({
      success: true,
      message: 'Test expense created successfully',
      data: {
        expense: newExpense,
        endpoint: '/api/test-expenses',
        authentication: 'none_required'
      }
    });

  } catch (error) {
    console.error('Error creating test expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}