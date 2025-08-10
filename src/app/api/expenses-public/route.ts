import { NextRequest, NextResponse } from 'next/server';
import { universalStorage } from '@/lib/storage/universalStorage';

// PUBLIC EXPENSES API - ZERO AUTHENTICATION REQUIRED
// Specifically designed for N8N workflows and external integrations
export async function GET(request: NextRequest) {
  try {
    console.log('Public expenses endpoint accessed - no auth required');
    
    // Load real expense data from storage without authentication
    const expenseItems = await universalStorage.loadData('expenses');
    
    // Transform the universal storage format to expense format
    const expenses = expenseItems.map(item => ({
      id: item.id,
      amount: item.data.amount || 0,
      category: item.data.category || 'other',
      description: item.data.description || 'No description',
      date: item.data.date || item.createdAt.split('T')[0],
      merchant: item.data.merchant || 'Unknown',
      currency: item.data.currency || 'USD',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt
    }));

    // Calculate summary statistics from real data
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
      data: {
        expenses: expenses,
        total: expenses.length,
        totalAmount: totalAmount,
        categories: categoryTotals,
        summary: {
          total_expenses: expenses.length,
          total_amount: totalAmount,
          currency: 'USD',
          date_range: expenses.length > 0 ? {
            earliest: Math.min(...expenses.map(e => new Date(e.date).getTime())),
            latest: Math.max(...expenses.map(e => new Date(e.date).getTime()))
          } : null
        },
        storageType: universalStorage.getStorageType(),
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
    
    // Create expense data in the format expected by universal storage
    const expenseData = {
      amount: parseFloat(body.amount) || 0,
      category: body.category || 'other',
      description: body.description || 'New expense',
      date: body.date || new Date().toISOString().split('T')[0],
      merchant: body.merchant || 'Unknown',
      currency: body.currency || 'USD',
      created_via: 'public_api',
      source: 'n8n_or_external'
    };

    // Save to real storage without authentication
    const newExpenseItem = await universalStorage.addItem('expenses', expenseData);
    
    // Transform back to expense format for response
    const newExpense = {
      id: newExpenseItem.id,
      amount: newExpenseItem.data.amount,
      category: newExpenseItem.data.category,
      description: newExpenseItem.data.description,
      date: newExpenseItem.data.date,
      merchant: newExpenseItem.data.merchant,
      currency: newExpenseItem.data.currency,
      createdAt: newExpenseItem.createdAt,
      updatedAt: newExpenseItem.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Public expense created and saved successfully',
      timestamp: new Date().toISOString(),
      data: {
        expense: newExpense,
        endpoint: '/api/expenses-public',
        authentication: 'none_required',
        storageType: universalStorage.getStorageType()
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