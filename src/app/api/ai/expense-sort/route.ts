import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { expenses, sortCriteria } = await request.json();
    
    if (!expenses || expenses.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No expenses provided for sorting'
      }, { status: 400 });
    }

    // If sortCriteria is 'ai-smart', use AI to intelligently sort
    if (sortCriteria === 'ai-smart') {
      const sortedExpenses = await aiSmartSort(expenses);
      return NextResponse.json({
        success: true,
        sortedExpenses,
        sortMethod: 'AI Smart Sort',
        description: 'Expenses sorted by AI based on spending patterns, importance, and financial impact'
      });
    }

    // If sortCriteria is 'ai-categorize', use AI to re-categorize
    if (sortCriteria === 'ai-categorize') {
      const categorizedExpenses = await aiRecategorize(expenses);
      return NextResponse.json({
        success: true,
        sortedExpenses: categorizedExpenses,
        sortMethod: 'AI Categorization',
        description: 'Expenses re-categorized by AI for better organization'
      });
    }

    // Standard sorting options
    const sortedExpenses = [...expenses];
    
    switch (sortCriteria) {
      case 'amount-high':
        sortedExpenses.sort((a, b) => {
          const amountA = (a.creditAmount || 0) + (a.debitAmount || 0);
          const amountB = (b.creditAmount || 0) + (b.debitAmount || 0);
          return amountB - amountA;
        });
        break;
      case 'amount-low':
        sortedExpenses.sort((a, b) => {
          const amountA = (a.creditAmount || 0) + (a.debitAmount || 0);
          const amountB = (b.creditAmount || 0) + (b.debitAmount || 0);
          return amountA - amountB;
        });
        break;
      case 'date-recent':
        sortedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-oldest':
        sortedExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'category':
        sortedExpenses.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'bank':
        sortedExpenses.sort((a, b) => (a.from || '').localeCompare(b.from || ''));
        break;
      default:
        // No sorting
        break;
    }

    return NextResponse.json({
      success: true,
      sortedExpenses,
      sortMethod: sortCriteria,
      description: `Expenses sorted by ${sortCriteria}`
    });

  } catch (error: any) {
    console.error('Expense sorting error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sort expenses',
      error: error.message
    }, { status: 500 });
  }
}

async function aiSmartSort(expenses: any[]): Promise<any[]> {
  try {
    const expenseData = expenses.map((expense, index) => ({
      index,
      amount: (expense.creditAmount || 0) + (expense.debitAmount || 0),
      category: expense.category || 'General',
      description: expense.description || '',
      from: expense.from || '',
      date: expense.date,
      isCredit: (expense.creditAmount || 0) > 0
    }));

    const prompt = `
Analyze these expense transactions and sort them by financial importance and impact. Consider:
1. Large amounts that significantly impact budget
2. Essential vs non-essential categories  
3. Unusual or suspicious transactions
4. Credit vs debit implications
5. Recent vs older transactions

Expenses data: ${JSON.stringify(expenseData)}

Return a JSON array with the original expense indices in order of importance (most important first):
{
  "sortedIndices": [3, 1, 7, 2, 5, ...]
}

Prioritize:
- Large amounts (over $100)
- Essential categories (food, medical, utilities)
- Recent credit transactions  
- Unusual spending patterns
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    const sortedIndices = parsed.sortedIndices || expenses.map((_, i) => i);

    // Return expenses in AI-determined order
    return sortedIndices.map((index: number) => expenses[index]).filter(Boolean);

  } catch (error) {
    console.error('AI smart sort failed:', error);
    // Fallback to amount-based sorting
    return expenses.sort((a, b) => {
      const amountA = (a.creditAmount || 0) + (a.debitAmount || 0);
      const amountB = (b.creditAmount || 0) + (b.debitAmount || 0);
      return amountB - amountA;
    });
  }
}

async function aiRecategorize(expenses: any[]): Promise<any[]> {
  try {
    const expenseData = expenses.map((expense, index) => ({
      index,
      description: expense.description || '',
      from: expense.from || '',
      amount: (expense.creditAmount || 0) + (expense.debitAmount || 0),
      currentCategory: expense.category || 'General'
    }));

    const categories = [
      '1. Credit', '2. Debit', 'Food', 'Transportation', 'Business', 'Medical',
      'Entertainment', 'Shopping', 'Utilities', 'Travel', 'Education', 'Banks', 'General'
    ];

    const prompt = `
Re-categorize these expense transactions based on their descriptions and sources. Use these exact categories: ${categories.join(', ')}

Expense data: ${JSON.stringify(expenseData)}

Return JSON with each expense index and its suggested category:
{
  "categorizations": [
    {"index": 0, "category": "Food"},
    {"index": 1, "category": "Transportation"},
    ...
  ]
}

Rules:
- Use "1. Credit" for credit card transactions
- Use "2. Debit" for debit card transactions  
- Categorize based on description and merchant name
- Be specific (Food for restaurants/groceries, Transportation for gas/Uber, etc.)
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    const categorizations = parsed.categorizations || [];

    // Apply AI categorizations
    const updatedExpenses = expenses.map((expense, index) => {
      const aiCategorization = categorizations.find((cat: any) => cat.index === index);
      if (aiCategorization) {
        return {
          ...expense,
          category: aiCategorization.category,
          aiCategorized: true
        };
      }
      return expense;
    });

    return updatedExpenses;

  } catch (error) {
    console.error('AI recategorization failed:', error);
    return expenses;
  }
}