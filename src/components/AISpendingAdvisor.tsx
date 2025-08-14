'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/types';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  PiggyBank,
  CreditCard,
  DollarSign,
  Calendar,
  BarChart3,
  Lightbulb,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

interface SpendingInsight {
  type: 'warning' | 'tip' | 'achievement' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: string;
}

interface AISpendingAdvisorProps {
  expenses: Expense[];
  selectedBank?: 'ahli' | 'wafrah' | 'all';
}

export function AISpendingAdvisor({ expenses, selectedBank = 'all' }: AISpendingAdvisorProps) {
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (expenses.length > 0) {
      generateInsights();
    }
  }, [expenses, selectedBank]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    // Filter expenses by bank if specified
    let filteredExpenses = expenses;
    if (selectedBank !== 'all') {
      filteredExpenses = expenses.filter(expense => 
        expense.from?.toLowerCase().includes(selectedBank)
      );
    }
    
    try {
      const response = await fetch('/api/ai/spending-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: filteredExpenses,
          selectedBank,
          monthlyBudget: monthlyBudget || calculateEstimatedBudget(filteredExpenses)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate spending insights. Please try again.');
      // Fallback to local analysis
      setInsights(generateLocalInsights(filteredExpenses));
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedBudget = (expenseList: Expense[]): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthExpenses = expenseList.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalSpent = thisMonthExpenses.reduce((sum, expense) => {
      return sum + (expense.creditAmount || 0) + (expense.debitAmount || 0);
    }, 0);
    
    return Math.round(totalSpent * 1.2); // Assume 20% buffer
  };

  const generateLocalInsights = (expenseList: Expense[]): SpendingInsight[] => {
    const insights: SpendingInsight[] = [];
    
    // Calculate spending by category
    const categorySpending = expenseList.reduce((acc, expense) => {
      const category = expense.category || 'General';
      const amount = (expense.creditAmount || 0) + (expense.debitAmount || 0);
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    // Find highest spending category
    const highestCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    if (highestCategory && highestCategory[1] > 0) {
      insights.push({
        type: 'trend',
        title: `Highest Spending: ${highestCategory[0]}`,
        description: `You've spent $${highestCategory[1].toFixed(2)} on ${highestCategory[0]} this period.`,
        impact: 'high',
        actionable: `Consider setting a monthly limit for ${highestCategory[0]} expenses.`
      });
    }

    // Check for frequent small transactions
    const smallTransactions = expenseList.filter(expense => {
      const amount = (expense.creditAmount || 0) + (expense.debitAmount || 0);
      return amount < 20 && amount > 0;
    });

    if (smallTransactions.length > 10) {
      insights.push({
        type: 'warning',
        title: 'Frequent Small Purchases',
        description: `You have ${smallTransactions.length} transactions under $20.`,
        impact: 'medium',
        actionable: 'Consider bundling small purchases or using cash for better expense tracking.'
      });
    }

    // Credit vs Debit analysis
    const creditTotal = expenseList.reduce((sum, expense) => sum + (expense.creditAmount || 0), 0);
    const debitTotal = expenseList.reduce((sum, expense) => sum + (expense.debitAmount || 0), 0);
    
    if (creditTotal > debitTotal * 1.5) {
      insights.push({
        type: 'warning',
        title: 'High Credit Usage',
        description: `Credit transactions (${creditTotal.toFixed(2)}) are significantly higher than debit (${debitTotal.toFixed(2)}).`,
        impact: 'high',
        actionable: 'Consider using debit more often to avoid credit card interest and fees.'
      });
    }

    return insights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'tip': return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'achievement': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default: return <Brain className="h-5 w-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">AI Spending Advisor</CardTitle>
              <CardDescription>
                Personalized insights for {selectedBank === 'all' ? 'all accounts' : selectedBank === 'ahli' ? 'Ahli Bank' : 'Wafrah Bank'}
                {lastUpdated && (
                  <span className="ml-2 text-xs">
                    • Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={generateInsights} 
            disabled={loading || expenses.length === 0}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Analyzing...' : 'Refresh Insights'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expenses to Analyze</h3>
            <p className="text-gray-600">Add some expenses to get personalized spending insights.</p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{insight.description}</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Recommendation</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Looking Good!</h3>
            <p className="text-gray-600">Your spending patterns appear healthy. Keep up the good work!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}