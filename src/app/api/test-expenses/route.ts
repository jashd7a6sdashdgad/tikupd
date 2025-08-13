import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint for N8N without authentication requirements
export async function GET(request: NextRequest) {
  try {
    console.log('Test expenses endpoint accessed');
    
    // Return real test expense data without authentication
    const testExpenses = [
      {
        id: 'real_exp_001',
        amount: 125.5,
        category: 'groceries',
        description: 'Weekly grocery shopping at Lulu Hypermarket',
        date: '2025-08-13',
        merchant: 'Lulu Hypermarket',
        createdAt: '2025-08-13T02:32:20.468Z',
        updatedAt: '2025-08-13T02:32:20.468Z',
        originalData: {
          from: 'Bank Card ****1234',
          debitAmount: 125.5,
          creditAmount: 0,
          availableBalance: 2875.5
        }
      },
      {
        id: 'real_exp_002',
        amount: 45.75,
        category: 'fuel',
        description: 'ADNOC fuel station - tank full',
        date: '2025-08-12',
        merchant: 'ADNOC Station',
        createdAt: '2025-08-13T02:32:20.468Z',
        updatedAt: '2025-08-13T02:32:20.468Z',
        originalData: {
          from: 'Credit Card ****5678',
          debitAmount: 45.75,
          creditAmount: 0,
          availableBalance: 2829.75
        }
      },
      {
        id: 'real_exp_003',
        amount: 89.99,
        category: 'dining',
        description: 'Lunch with colleagues at Emirates Palace',
        date: '2025-08-11',
        merchant: 'Emirates Palace Cafe',
        createdAt: '2025-08-13T02:32:20.468Z',
        updatedAt: '2025-08-13T02:32:20.468Z',
        originalData: {
          from: 'Credit Card ****5678',
          debitAmount: 89.99,
          creditAmount: 0,
          availableBalance: 2739.76
        }
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