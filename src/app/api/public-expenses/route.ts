import { NextRequest, NextResponse } from 'next/server';

// PUBLIC EXPENSES API - NO AUTHENTICATION REQUIRED
// This endpoint is specifically designed for N8N workflows and external integrations
export async function GET(request: NextRequest) {
  try {
    console.log('Public expenses endpoint accessed for N8N');
    
    // Return current expenses without any authentication
    const expenses = [
      {
        id: '1',
        amount: 25.50,
        category: 'food',
        description: 'Lunch at restaurant',
        date: '2025-08-10',
        merchant: 'Local Restaurant',
        currency: 'USD',
        tags: ['business', 'meal']
      },
      {
        id: '2', 
        amount: 15.00,
        category: 'transportation',
        description: 'Bus fare',
        date: '2025-08-10',
        merchant: 'City Transit',
        currency: 'USD',
        tags: ['commute']
      },
      {
        id: '3',
        amount: 89.99,
        category: 'shopping',
        description: 'New headphones',
        date: '2025-08-09',
        merchant: 'Electronics Store',
        currency: 'USD',
        tags: ['electronics', 'work']
      },
      {
        id: '4',
        amount: 12.50,
        category: 'food',
        description: 'Morning coffee',
        date: new Date().toISOString().split('T')[0],
        merchant: 'Starbucks',
        currency: 'USD',
        tags: ['coffee', 'daily']
      },
      {
        id: '5',
        amount: 45.00,
        category: 'utilities',
        description: 'Internet bill',
        date: '2025-08-09',
        merchant: 'ISP Provider',
        currency: 'USD',
        tags: ['monthly', 'utilities']
      },
      {
        id: '6',
        amount: 32.75,
        category: 'food',
        description: 'Grocery shopping',
        date: '2025-08-08',
        merchant: 'Supermarket',
        currency: 'USD',
        tags: ['groceries', 'weekly']
      }
    ];

    // Calculate summary statistics
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categories = [...new Set(expenses.map(e => e.category))];
    const categoryTotals = categories.map(category => ({
      category,
      total: expenses.filter(e => e.category === category)
                   .reduce((sum, e) => sum + e.amount, 0),
      count: expenses.filter(e => e.category === category).length
    }));

    return NextResponse.json({
      success: true,
      message: 'Public expenses retrieved successfully',
      timestamp: new Date().toISOString(),
      api_info: {
        endpoint: '/api/public-expenses',
        authentication: 'none_required',
        purpose: 'N8N and external integrations',
        rate_limit: 'none'
      },
      data: {
        expenses: expenses,
        summary: {
          total_expenses: expenses.length,
          total_amount: totalAmount,
          currency: 'USD',
          date_range: {
            earliest: Math.min(...expenses.map(e => new Date(e.date).getTime())),
            latest: Math.max(...expenses.map(e => new Date(e.date).getTime()))
          }
        },
        categories: categoryTotals,
        recent_expense: expenses[expenses.length - 1]
      }
    });

  } catch (error) {
    console.error('Error in public expenses API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve public expenses',
        timestamp: new Date().toISOString(),
        endpoint: '/api/public-expenses'
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
      tags: body.tags || ['api'],
      created_at: new Date().toISOString(),
      created_via: 'public_api',
      source: 'n8n_or_external'
    };

    return NextResponse.json({
      success: true,
      message: 'Public expense created successfully',
      timestamp: new Date().toISOString(),
      api_info: {
        endpoint: '/api/public-expenses',
        method: 'POST',
        authentication: 'none_required'
      },
      data: {
        expense: newExpense,
        next_actions: [
          'Use GET /api/public-expenses to retrieve all expenses',
          'Use POST with JSON body to create more expenses'
        ]
      }
    });

  } catch (error) {
    console.error('Error creating public expense:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to create public expense',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}