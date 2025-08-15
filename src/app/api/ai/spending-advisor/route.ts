import { NextRequest, NextResponse } from 'next/server';
// Code-based spending analysis (no external API)

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

    console.log('🔄 Generating code-based spending insights...');
    
    // Generate insights using code logic
    let insights: SpendingInsight[] = generateCodeBasedInsights(expensesSummary, selectedBank, monthlyBudget);

    // Ensure we have at least 3 insights
    if (insights.length < 3) {
      insights = [...insights, ...generateFallbackInsights(expensesSummary)].slice(0, 5);
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

function generateCodeBasedInsights(summary: any, selectedBank: string, monthlyBudget: number): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  
  // Analysis 1: Budget adherence
  if (monthlyBudget > 0) {
    const budgetUsage = (summary.totalSpent / monthlyBudget) * 100;
    if (budgetUsage > 100) {
      insights.push({
        type: 'warning',
        title: 'Budget Exceeded',
        description: `Spent ${budgetUsage.toFixed(0)}% of monthly budget (${summary.totalSpent.toFixed(0)} vs ${monthlyBudget})`,
        impact: 'high',
        actionable: 'Review expenses and cut non-essential spending immediately'
      });
    } else if (budgetUsage > 80) {
      insights.push({
        type: 'warning',
        title: 'Approaching Budget Limit',
        description: `Used ${budgetUsage.toFixed(0)}% of monthly budget - ${(monthlyBudget - summary.totalSpent).toFixed(0)} remaining`,
        impact: 'medium',
        actionable: 'Monitor remaining spending carefully for the rest of the month'
      });
    } else {
      insights.push({
        type: 'achievement',
        title: 'Budget On Track',
        description: `Using ${budgetUsage.toFixed(0)}% of budget - good financial discipline`,
        impact: 'low',
        actionable: 'Continue current spending patterns and consider increasing savings'
      });
    }
  }
  
  // Analysis 2: Credit vs Debit usage
  if (summary.creditTotal > 0 && summary.debitTotal > 0) {
    const creditRatio = (summary.creditTotal / summary.totalSpent) * 100;
    if (creditRatio > 60) {
      insights.push({
        type: 'warning',
        title: 'High Credit Usage',
        description: `${creditRatio.toFixed(0)}% of spending on credit - potential debt risk`,
        impact: 'high',
        actionable: 'Switch to debit/cash for daily expenses to control spending'
      });
    } else if (creditRatio > 30) {
      insights.push({
        type: 'tip',
        title: 'Moderate Credit Usage',
        description: `${creditRatio.toFixed(0)}% credit usage - monitor for interest charges`,
        impact: 'medium',
        actionable: 'Pay credit balance in full each month to avoid interest'
      });
    } else {
      insights.push({
        type: 'achievement',
        title: 'Balanced Payment Methods',
        description: `Good mix of credit (${creditRatio.toFixed(0)}%) and debit usage`,
        impact: 'low',
        actionable: 'Continue balanced approach while earning credit rewards'
      });
    }
  }
  
  // Analysis 3: Category spending analysis
  const categories = Object.entries(summary.categoryBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number));
  
  if (categories.length > 0) {
    const [topCategory, topAmount] = categories[0];
    const topPercentage = ((topAmount as number) / summary.totalSpent) * 100;
    
    if (topPercentage > 40) {
      insights.push({
        type: 'trend',
        title: `Heavy ${topCategory} Spending`,
        description: `${topCategory} accounts for ${topPercentage.toFixed(0)}% (${(topAmount as number).toFixed(0)}) of total spending`,
        impact: 'medium',
        actionable: `Set specific limits for ${topCategory} and track daily spending in this category`
      });
    } else {
      insights.push({
        type: 'tip',
        title: `Top Category: ${topCategory}`,
        description: `${topCategory} is ${topPercentage.toFixed(0)}% of spending - manageable level`,
        impact: 'low',
        actionable: `Review ${topCategory} expenses for potential savings opportunities`
      });
    }
  }
  
  // Analysis 4: Transaction frequency
  const avgTransaction = summary.averageTransaction;
  if (avgTransaction > 200) {
    insights.push({
      type: 'trend',
      title: 'Large Average Transactions',
      description: `Average transaction is ${avgTransaction.toFixed(0)} - indicates big purchases`,
      impact: 'medium',
      actionable: 'Consider breaking large purchases into smaller, planned expenses'
    });
  } else if (avgTransaction < 20) {
    insights.push({
      type: 'tip',
      title: 'Many Small Transactions',
      description: `Average transaction is ${avgTransaction.toFixed(0)} - lots of small purchases`,
      impact: 'low',
      actionable: 'Small purchases add up - track daily spending with a expense app'
    });
  }
  
  // Analysis 5: Bank-specific insights
  if (selectedBank !== 'all' && summary.bankSpecific) {
    const bankExpenses = summary.bankSpecific.filteredExpenses;
    const bankName = selectedBank === 'ahli' ? 'Ahli Bank' : selectedBank === 'wafrah' ? 'Wafrah Bank' : selectedBank;
    
    insights.push({
      type: 'tip',
      title: `${bankName} Activity`,
      description: `${bankExpenses} transactions analyzed for ${bankName} account`,
      impact: 'medium',
      actionable: `Optimize ${bankName} account usage and explore account-specific benefits`
    });
  }
  
  return insights.slice(0, 5);
}