import { NextRequest, NextResponse } from 'next/server';
// Code-based expense sorting (no external API)

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
    console.log('🔄 Using code-based smart sorting...');
    
    // Code-based smart sorting algorithm
    const expensesWithPriority = expenses.map((expense, index) => {
      const amount = Math.abs((expense.creditAmount || 0) + (expense.debitAmount || 0));
      const category = expense.category || 'General';
      const isCredit = (expense.creditAmount || 0) > 0;
      const date = new Date(expense.date);
      const daysOld = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let priority = 0;
      
      // Amount priority (40% weight)
      if (amount > 1000) priority += 40;
      else if (amount > 500) priority += 30;
      else if (amount > 100) priority += 20;
      else priority += 10;
      
      // Category priority (30% weight)
      const essentialCategories = ['Medical', 'Utilities', 'Food', 'Transportation'];
      const importantCategories = ['Business', 'Education', 'Travel'];
      if (essentialCategories.includes(category)) priority += 30;
      else if (importantCategories.includes(category)) priority += 20;
      else if (category.includes('Credit')) priority += 25;
      else priority += 10;
      
      // Recency priority (20% weight)
      if (daysOld <= 7) priority += 20;
      else if (daysOld <= 30) priority += 15;
      else priority += 5;
      
      // Transaction type priority (10% weight)
      if (isCredit && amount > 500) priority += 10; // Large credits need attention
      else if (!isCredit && amount > 200) priority += 8; // Large debits
      else priority += 5;
      
      return { ...expense, originalIndex: index, priority, amount };
    });
    
    // Sort by priority (highest first)
    const sortedExpenses = expensesWithPriority
      .sort((a, b) => b.priority - a.priority)
      .map(({ originalIndex, priority, ...expense }) => expense);
    
    console.log('✅ Code-based smart sorting completed');
    return sortedExpenses;

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
    console.log('🔄 Using code-based recategorization...');
    
    const categoryRules = {
      'Food': {
        keywords: ['restaurant', 'cafe', 'food', 'grocery', 'supermarket', 'mcdonald', 'kfc', 'pizza', 'starbucks', 'dining'],
        patterns: [/restaurant|cafe|food|grocery|supermarket|dining/i]
      },
      'Transportation': {
        keywords: ['uber', 'taxi', 'gas', 'fuel', 'petrol', 'parking', 'bus', 'metro', 'airline', 'flight'],
        patterns: [/uber|taxi|gas|fuel|transport|parking|airline/i]
      },
      'Medical': {
        keywords: ['hospital', 'clinic', 'pharmacy', 'doctor', 'medical', 'health', 'medicine'],
        patterns: [/hospital|clinic|pharmacy|medical|health/i]
      },
      'Shopping': {
        keywords: ['amazon', 'store', 'shop', 'mall', 'retail', 'clothing', 'electronics'],
        patterns: [/amazon|shop|store|mall|retail/i]
      },
      'Utilities': {
        keywords: ['electricity', 'water', 'internet', 'phone', 'utility', 'telecom'],
        patterns: [/electric|water|internet|phone|utility/i]
      },
      'Entertainment': {
        keywords: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'entertainment'],
        patterns: [/movie|cinema|netflix|spotify|entertainment/i]
      },
      'Business': {
        keywords: ['office', 'business', 'professional', 'service', 'software', 'license'],
        patterns: [/office|business|professional|software/i]
      }
    };
    
    const categorizedExpenses = expenses.map((expense) => {
      const description = (expense.description || '').toLowerCase();
      const from = (expense.from || '').toLowerCase();
      const searchText = `${description} ${from}`;
      
      // Check if it's a credit/debit transaction
      if (expense.creditAmount > 0) {
        return { ...expense, category: '1. Credit', aiCategorized: true };
      } else if (expense.debitAmount > 0) {
        return { ...expense, category: '2. Debit', aiCategorized: true };
      }
      
      // Find best category match
      let bestMatch = { category: 'General', score: 0 };
      
      for (const [category, rules] of Object.entries(categoryRules)) {
        let score = 0;
        
        // Check keywords
        for (const keyword of rules.keywords) {
          if (searchText.includes(keyword)) {
            score += 1;
          }
        }
        
        // Check patterns
        for (const pattern of rules.patterns) {
          if (pattern.test(searchText)) {
            score += 2;
          }
        }
        
        if (score > bestMatch.score) {
          bestMatch = { category, score };
        }
      }
      
      return {
        ...expense,
        category: bestMatch.score > 0 ? bestMatch.category : (expense.category || 'General'),
        aiCategorized: bestMatch.score > 0
      };
    });
    
    console.log('✅ Code-based recategorization completed');
    return categorizedExpenses;

  } catch (error) {
    console.error('AI recategorization failed:', error);
    return expenses;
  }
}