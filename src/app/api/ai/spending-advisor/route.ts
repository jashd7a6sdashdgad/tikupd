import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface SpendingInsight {
  type: 'warning' | 'tip' | 'achievement' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: string;
}

export async function POST(request: NextRequest) {
  try {
    const { expenses, selectedBank, monthlyBudget } = await request.json();
    
    if (!expenses || expenses.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No expenses provided for analysis'
      }, { status: 400 });
    }

    // Prepare expense data for AI analysis
    const expensesSummary = {
      totalExpenses: expenses.length,
      selectedBank: selectedBank,
      monthlyBudget: monthlyBudget,
      totalSpent: expenses.reduce((sum: number, expense: any) => {
        return sum + (expense.creditAmount || 0) + (expense.debitAmount || 0);
      }, 0),
      creditTotal: expenses.reduce((sum: number, expense: any) => sum + (expense.creditAmount || 0), 0),
      debitTotal: expenses.reduce((sum: number, expense: any) => sum + (expense.debitAmount || 0), 0),
      categoryBreakdown: expenses.reduce((acc: any, expense: any) => {
        const category = expense.category || 'General';
        const amount = (expense.creditAmount || 0) + (expense.debitAmount || 0);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {}),
      averageTransaction: expenses.length > 0 ? 
        expenses.reduce((sum: number, expense: any) => {
          return sum + (expense.creditAmount || 0) + (expense.debitAmount || 0);
        }, 0) / expenses.length : 0,
      bankSpecific: selectedBank !== 'all' ? {
        bank: selectedBank,
        filteredExpenses: expenses.filter((expense: any) => 
          expense.from?.toLowerCase().includes(selectedBank)
        ).length
      } : null
    };

    const prompt = `
You are a financial advisor AI. Analyze the following spending data and provide 3-5 actionable insights.

Spending Data:
- Bank Focus: ${selectedBank === 'ahli' ? 'Ahli Bank' : selectedBank === 'wafrah' ? 'Wafrah Bank' : 'All Banks'}
- Total Transactions: ${expensesSummary.totalExpenses}
- Total Spent: $${expensesSummary.totalSpent.toFixed(2)}
- Credit Transactions: $${expensesSummary.creditTotal.toFixed(2)}
- Debit Transactions: $${expensesSummary.debitTotal.toFixed(2)}
- Monthly Budget: $${monthlyBudget}
- Average Transaction: $${expensesSummary.averageTransaction.toFixed(2)}
- Category Spending: ${JSON.stringify(expensesSummary.categoryBreakdown)}

Provide insights in this exact JSON format:
{
  "insights": [
    {
      "type": "warning|tip|achievement|trend",
      "title": "Clear, concise title",
      "description": "Brief description of the insight",
      "impact": "high|medium|low",
      "actionable": "Specific actionable recommendation"
    }
  ]
}

Focus on:
1. Credit vs Debit usage patterns
2. Category spending analysis  
3. Budget adherence
4. Bank-specific insights (if applicable)
5. Spending frequency and patterns

Make insights specific to ${selectedBank === 'ahli' ? 'Ahli Bank' : selectedBank === 'wafrah' ? 'Wafrah Bank' : 'the user\'s financial'} situation.
Keep titles under 50 characters and descriptions under 150 characters.
Provide actionable recommendations that are practical and implementable.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response
    let insights: SpendingInsight[] = [];
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      insights = parsed.insights || [];
      
      // Validate and clean insights
      insights = insights.filter(insight => 
        insight.title && insight.description && insight.actionable
      ).slice(0, 5); // Limit to 5 insights
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to rule-based insights
      insights = generateFallbackInsights(expensesSummary);
    }

    // Add some additional insights based on bank selection
    if (selectedBank === 'ahli') {
      insights.unshift({
        type: 'tip',
        title: 'Ahli Bank Account Analysis',
        description: `Analyzing ${expensesSummary.bankSpecific?.filteredExpenses || 0} Ahli Bank transactions.`,
        impact: 'medium',
        actionable: 'Consider using Ahli\'s mobile app features for better expense tracking and budgeting.'
      });
    } else if (selectedBank === 'wafrah') {
      insights.unshift({
        type: 'tip', 
        title: 'Wafrah Bank Account Analysis',
        description: `Analyzing ${expensesSummary.bankSpecific?.filteredExpenses || 0} Wafrah Bank transactions.`,
        impact: 'medium',
        actionable: 'Explore Wafrah\'s savings products and automated saving features to optimize your finances.'
      });
    }

    return NextResponse.json({
      success: true,
      insights: insights,
      summary: {
        totalAnalyzed: expenses.length,
        totalSpent: expensesSummary.totalSpent,
        bank: selectedBank,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('AI Spending Advisor error:', error);
    
    // Return fallback insights on error
    const fallbackInsights = [{
      type: 'tip' as const,
      title: 'AI Analysis Unavailable',
      description: 'Using basic analysis while AI service is temporarily unavailable.',
      impact: 'low' as const,
      actionable: 'Continue tracking expenses for more detailed insights when service is restored.'
    }];

    return NextResponse.json({
      success: true,
      insights: fallbackInsights,
      error: 'AI analysis temporarily unavailable',
      summary: {
        totalAnalyzed: 0,
        totalSpent: 0,
        bank: 'unknown',
        generatedAt: new Date().toISOString()
      }
    });
  }
}

function generateFallbackInsights(summary: any): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  
  // Credit vs Debit analysis
  if (summary.creditTotal > summary.debitTotal * 1.5) {
    insights.push({
      type: 'warning',
      title: 'High Credit Card Usage',
      description: `Credit spending (${summary.creditTotal.toFixed(2)}) exceeds debit significantly.`,
      impact: 'high',
      actionable: 'Consider using debit more often to avoid interest charges and better control spending.'
    });
  }

  // Budget analysis
  if (summary.monthlyBudget > 0 && summary.totalSpent > summary.monthlyBudget) {
    insights.push({
      type: 'warning',
      title: 'Budget Exceeded',
      description: `Spent $${summary.totalSpent.toFixed(2)} vs budget of $${summary.monthlyBudget}`,
      impact: 'high',
      actionable: 'Review and adjust your budget or identify areas to reduce spending.'
    });
  }

  // Category analysis
  const topCategory = Object.entries(summary.categoryBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  if (topCategory) {
    insights.push({
      type: 'trend',
      title: `Top Spending: ${topCategory[0]}`,
      description: `${topCategory[0]} accounts for $${(topCategory[1] as number).toFixed(2)} of spending.`,
      impact: 'medium',
      actionable: `Monitor ${topCategory[0]} expenses and set category-specific limits.`
    });
  }

  return insights;
}