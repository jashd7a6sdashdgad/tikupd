'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Expense } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  RefreshCw,
  PieChart,
  BarChart3,
  Mic,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Brain,
  Camera,
  Zap,
  Target,
  Eye,
  Flag,
  Filter,
  SortAsc,
  SortDesc,
  Building2,
  CreditCard
} from 'lucide-react';
// import { useVoiceInput } from '@/hooks/useVoiceInput'; // Removed for stability
import AddExpenseForm from '@/components/AddExpenseForm';
import { ExpenseIntelligence, SmartExpense } from '@/lib/expenseIntelligence';
import ExpenseInsightsDashboard from '@/components/ExpenseInsightsDashboard';
import BudgetAdvisorDashboard from '@/components/BudgetAdvisorDashboard';
import { AISpendingAdvisor } from '@/components/AISpendingAdvisor';

interface ExpenseAnalytics {
  total: number;
  count: number;
  categoryTotals: Record<string, number>;
  averageExpense: number;
}

export default function ExpensesPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form fields for voice input
  const [description, setDescription] = useState('');
  const [debitAmount, setDebitAmount] = useState('');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [showBudgetAdvisor, setShowBudgetAdvisor] = useState(false);
  const [smartExpenses, setSmartExpenses] = useState<SmartExpense[]>([]);

  // New features state
  const [selectedBank, setSelectedBank] = useState<'all' | 'ahli' | 'wafrah'>('all');
  const [sortMethod, setSortMethod] = useState<string>('date-recent');
  const [isAISorting, setIsAISorting] = useState(false);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);

  // Voice input temporarily disabled for stability
  // const { 
  //   isListening, 
  //   transcript, 
  //   startListening, 
  //   stopListening, 
  //   resetTranscript, 
  //   isSupported 
  // } = useVoiceInput();

  // Mock voice input values
  const isListening = false;
  const transcript = '';
  const startListening = () => {};
  const stopListening = () => {};
  const resetTranscript = () => {};
  const isSupported = false;

  const categories = [
    { value: 'Food', label: t('food') },
    { value: 'Transportation', label: t('transportation') },
            { value: 'Business', label: t('businessExpense') },
    { value: 'Medical', label: t('medical') },
    { value: 'Entertainment', label: t('entertainment') },
    { value: 'Shopping', label: t('shopping') },
    { value: 'Utilities', label: t('utilities') },
    { value: 'Travel', label: t('travel') },
    { value: 'Education', label: t('education') },
    { value: 'Banks', label: t('banks') },
    { value: 'General', label: t('general') }
  ];

  // Filter function to remove duplicates with 00 values and specific unwanted expenses
  const filterDuplicatesWithZeros = (expenses: any[]) => {
    return expenses.filter(expense => {
      // Remove expenses that have both credit and debit as 0 or 0.00
      const creditAmount = parseFloat(expense.creditAmount) || 0;
      const debitAmount = parseFloat(expense.debitAmount) || 0;
      
      // Remove specific unwanted expenses by description
      const description = expense.description?.toUpperCase() || '';
      if (description.includes('AL MODHISH CAR WASH')) {
        return false;
      }
      
      // Keep the expense if it has a non-zero credit OR debit amount
      return creditAmount !== 0 || debitAmount !== 0;
    });
  };

  const fetchExpenses = useCallback(async () => {
    setLoading(true);

    // FIX: Define the instance here so it's available in all code paths.
    const expenseIntelligenceInstance = new ExpenseIntelligence();
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await fetch(`/api/sheets/expenses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const rawExpenses = data.data.expenses || [];
        const filteredExpenses = filterDuplicatesWithZeros(rawExpenses);
        setExpenses(filteredExpenses);
        
        const enhancedExpenses = filteredExpenses.map(expense => 
          expenseIntelligenceInstance.classifyExpense(expense)
        );
        setSmartExpenses(enhancedExpenses);
        
        setAnalytics(data.data.analytics || null);
      } else {
        console.error('Failed to fetch expenses:', data.message);
        setUsingMockData(true);
        // Use mock data as fallback when API is not available
        const mockExpenses = [
          {
            id: '1',
            from: 'Bank of Oman',
            date: new Date().toISOString().split('T')[0],
            creditAmount: 0,
            debitAmount: 15.500,
            category: 'Food',
            description: 'Lunch at restaurant',
            availableBalance: 984.500
          },
          {
            id: '2',
            from: 'Credit Card',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            creditAmount: 0,
            debitAmount: 25.000,
            category: 'Transportation',
            description: 'Taxi to airport',
            availableBalance: 959.500
          },
          {
            id: '3',
            from: 'Business Account',
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            creditAmount: 0,
            debitAmount: 120.750,
            category: 'Business',
            description: 'Office supplies',
            availableBalance: 838.750
          }
        ];
        
        const filteredMockExpenses = filterDuplicatesWithZeros(mockExpenses);
        setExpenses(filteredMockExpenses);
        
        const enhancedMockExpenses = filteredMockExpenses.map(expense => 
          expenseIntelligenceInstance.classifyExpense(expense)
        );
        setSmartExpenses(enhancedMockExpenses);
        
        setAnalytics({
          total: filteredMockExpenses.reduce((sum, exp) => sum + ((exp.debitAmount || 0) - (exp.creditAmount || 0)), 0),
          count: filteredMockExpenses.length,
          categoryTotals: filteredMockExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + ((exp.debitAmount || 0) - (exp.creditAmount || 0));
            return acc;
          }, {} as Record<string, number>),
          averageExpense: filteredMockExpenses.length > 0 ? filteredMockExpenses.reduce((sum, exp) => sum + ((exp.debitAmount || 0) - (exp.creditAmount || 0)), 0) / filteredMockExpenses.length : 0
        });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setUsingMockData(true);
      // Use mock data as fallback when there's a network error
      const mockExpenses = [
        {
          id: '1',
          from: 'Bank of Oman',
          date: new Date().toISOString().split('T')[0],
          creditAmount: 0,
          debitAmount: 15.500,
          category: 'Food',
          description: 'Lunch at restaurant',
          availableBalance: 984.500
        },
        {
          id: '2',
          from: 'Credit Card',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          creditAmount: 0,
          debitAmount: 25.000,
          category: 'Transportation',
          description: 'Taxi to airport',
          availableBalance: 959.500
        }
      ];
      
      const filteredFallbackExpenses = filterDuplicatesWithZeros(mockExpenses);
      setExpenses(filteredFallbackExpenses);
      
      const enhancedFallbackExpenses = filteredFallbackExpenses.map(expense => 
        expenseIntelligenceInstance.classifyExpense(expense)
      );
      setSmartExpenses(enhancedFallbackExpenses);
      
      setAnalytics({
        total: filteredFallbackExpenses.reduce((sum, exp) => sum + ((exp.debitAmount || 0) - (exp.creditAmount || 0)), 0),
        count: filteredFallbackExpenses.length,
        categoryTotals: filteredFallbackExpenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + ((exp.debitAmount || 0) - (exp.creditAmount || 0));
          return acc;
        }, {} as Record<string, number>),
        averageExpense: filteredFallbackExpenses.length > 0 ? filteredFallbackExpenses.reduce((sum, exp) => sum + ((exp.debitAmount || 0) - (exp.creditAmount || 0)), 0) / filteredFallbackExpenses.length : 0
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    if (transcript && !isListening) {
      parseVoiceExpense(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const parseVoiceExpense = (voiceInput: string) => {
    const input = voiceInput.toLowerCase();
    const expensePattern = /(?:add|spent)\s+(\d+(?:\.\d{1,3})?)\s+(?:omr\s+)?(?:expense\s+)?(?:for|on)\s+(.+)/i;
    const match = input.match(expensePattern);
    
    if (match) {
      setDebitAmount(match[1]);
      setDescription(match[2].trim());
      setShowAddForm(true);
    } else {
      setDescription(voiceInput);
      setShowAddForm(true);
    }
  };


  const deleteExpense = async (expenseId: string) => {
    if (!confirm(t('delete') + ' ' + t('expenses') + '?')) {
      return;
    }

    setDeleting(expenseId);
    try {
      const response = await fetch('/api/sheets/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expenseId })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchExpenses();
      } else {
        alert(t('settingsError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert(t('settingsError'));
    } finally {
      setDeleting(null);
    }
  };

  const clearForm = () => {
    setShowAddForm(false);
    setDescription('');
    setDebitAmount('');
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00 OMR';
    }
    return `${amount.toFixed(3)} OMR`;
  };

  // Check if expense is from Ahli Bank email
  const isFromAhliBank = (expense: Expense) => {
    return expense.from && expense.from.toLowerCase().includes('noreply@cards.ahlibank.om');
  };

  // Check if expense is from Bank Muscat email
  const isFromBankMuscat = (expense: Expense) => {
    return expense.from && expense.from.toLowerCase().includes('noreply@bankmuscat.com');
  };

  // Check if expense is from Ahli Bank general email
  const isFromAhliBankGeneral = (expense: Expense) => {
    return expense.from && expense.from.toLowerCase().includes('ahlibank@ahlibank.om');
  };

  // Filter expenses by selected bank
  const getFilteredExpenses = () => {
    let filteredExpenses = expenses;
    
    if (selectedBank === 'ahli') {
      filteredExpenses = expenses.filter(expense => 
        expense.from?.toLowerCase().includes('ahli') || 
        expense.from?.toLowerCase().includes('noreply@cards.ahlibank.om')
      );
    } else if (selectedBank === 'wafrah') {
      filteredExpenses = expenses.filter(expense => 
        expense.from?.toLowerCase().includes('wafrah') ||
        expense.from?.toLowerCase().includes('bankmuscat') // If Wafrah data comes from Bank Muscat
      );
    }
    
    return filteredExpenses;
  };

  // AI Sorting function
  const handleAISort = async (method: string) => {
    setIsAISorting(true);
    try {
      const response = await fetch('/api/ai/expense-sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: getFilteredExpenses(),
          sortCriteria: method
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExpenses(data.sortedExpenses);
          setSortMethod(method);
        }
      }
    } catch (error) {
      console.error('AI sorting failed:', error);
    } finally {
      setIsAISorting(false);
    }
  };

  const getPaginatedExpenses = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filtered = getFilteredExpenses();
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getExpenseEmoji = (expense: Expense) => {
    // If it's a credit (money coming in), show happy emoji
    if (expense.creditAmount && expense.creditAmount > 0) {
      return '😊'; // Happy face
    }
    // If it's a debit (money going out), show sad emoji
    if (expense.debitAmount && expense.debitAmount > 0) {
      return '😢'; // Sad face
    }
    return '😐'; // Neutral face for edge cases
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                <DollarSign className="h-8 w-8 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('expensesTitle')}
                </h1>
                <p className="text-gray-600 font-medium mt-1">{t('profileDescription')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchExpenses} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
              <Button 
                onClick={() => setShowInsights(!showInsights)} 
                variant="outline" 
                size="sm"
                className={showInsights ? 'bg-blue-50 text-blue-700' : ''}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
              <Button 
                onClick={() => setShowBudgetAdvisor(!showBudgetAdvisor)} 
                variant="outline" 
                size="sm"
                className={showBudgetAdvisor ? 'bg-green-50 text-green-700' : ''}
              >
                <Target className="h-4 w-4 mr-2" />
                Budget Advisor
              </Button>
              <Button 
                onClick={() => setShowAIAdvisor(!showAIAdvisor)} 
                variant="outline" 
                size="sm"
                className={showAIAdvisor ? 'bg-purple-50 text-purple-700' : ''}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Advisor
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addExpense')}
              </Button>
            </div>
          </div>
        </div>

        {/* Bank Filtering and AI Sorting Controls */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Bank Filter */}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Bank Filter:</span>
              <div className="flex gap-2">
                <Button
                  variant={selectedBank === 'all' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBank('all')}
                >
                  All Banks
                </Button>
                <Button
                  variant={selectedBank === 'ahli' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBank('ahli')}
                  className={selectedBank === 'ahli' ? 'bg-blue-600 text-white' : ''}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Ahli
                </Button>
                <Button
                  variant={selectedBank === 'wafrah' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBank('wafrah')}
                  className={selectedBank === 'wafrah' ? 'bg-green-600 text-white' : ''}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Wafrah
                </Button>
              </div>
            </div>

            {/* AI Sorting */}
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">AI Sort:</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAISort('ai-smart')}
                  disabled={isAISorting}
                  className="text-purple-600 border-purple-300"
                >
                  {isAISorting ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-1" />
                  )}
                  Smart Sort
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAISort('ai-categorize')}
                  disabled={isAISorting}
                  className="text-indigo-600 border-indigo-300"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  AI Categorize
                </Button>
              </div>
            </div>
          </div>
          
          {/* Current Filter Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {getFilteredExpenses().length} expenses 
                {selectedBank !== 'all' && ` from ${selectedBank === 'ahli' ? 'Ahli Bank' : 'Wafrah Bank'}`}
              </span>
              {sortMethod && (
                <span className="flex items-center gap-1">
                  <SortAsc className="h-4 w-4" />
                  Sorted by: {sortMethod.replace('ai-', 'AI ').replace('-', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <main className="space-y-8">
        {/* AI Spending Advisor */}
        {showAIAdvisor && (
          <div className="mb-8">
            <AISpendingAdvisor 
              expenses={getFilteredExpenses()} 
              selectedBank={selectedBank}
            />
          </div>
        )}

        {/* Budget Advisor Dashboard */}
        {showBudgetAdvisor && (
          <div className="mb-8">
            {/* FIX: Pass the smartExpenses array to the BudgetAdvisorDashboard */}
            <BudgetAdvisorDashboard 
              expenses={smartExpenses} 
              onRefresh={fetchExpenses}
            />
          </div>
        )}

        {/* AI Insights Dashboard */}
        {showInsights && (
          <div className="mb-8">
            {/* FIX: Pass the smartExpenses array to the ExpenseInsightsDashboard */}
            <ExpenseInsightsDashboard 
              expenses={smartExpenses} 
              onRefresh={fetchExpenses}
            />
          </div>
        )}
        {/* API Status Banner */}
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 0 11-2 0 1 1 0 012 0zm-1-8a1 0 00-1 1v3a1 0 002 0V6a1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>{t('demoMode')}:</strong> Google Sheets API is not available. Showing sample data. 
                  <a href="https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline ml-1">
                    {t('enableSheetsApi')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Voice Add Expense Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 hover:shadow-3xl hover:bg-white/80 transition-all duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-lg border border-gray-200">
              <Plus className="h-6 w-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Add Expense
              </h2>
              <p className="text-gray-600 font-medium">Quick expense tracking with smart categorization</p>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={isListening ? stopListening : startListening}
                className={isListening ? 'voice-active bg-accent text-accent-foreground' : ''}
                disabled={!isSupported}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isListening ? t('stopRecording') : t('voiceInput')}
              </Button>
              {transcript && (
                <p className="text-sm text-black italic">"{transcript}"</p>
              )}
            </div>
          </div>
        </div>


        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="palette-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{t('expenses')}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(analytics.total)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="palette-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{t('expenses')}</p>
                    <p className="text-2xl font-bold text-primary">{analytics.count}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="palette-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{t('statistics')}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(analytics.averageExpense)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-black" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="palette-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{t('category')}</p>
                    <p className="text-2xl font-bold text-primary">{Object.keys(analytics.categoryTotals).length}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t('startTime')}</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-black"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t('endTime')}</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-black"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t('category')}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white shadow-md"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{t('category')}</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} style={{ color: '#000000', backgroundColor: '#ffffff' }}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Expense Form */}
        {showAddForm && (
          <div className="mb-8">
            <AddExpenseForm onAdded={() => {
              fetchExpenses();
              setShowAddForm(false);
            }} />
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={clearForm}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">{t('expenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-black">{t('loading')}</p>
              </div>
            ) : smartExpenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-black">No expenses found</p>
                <p className="text-gray-600 text-sm">Start by adding your first expense or upload receipt images</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button onClick={() => setShowAddForm(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                  <Button onClick={() => setShowInsights(true)} variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {getPaginatedExpenses().map((expense) => {
                    const smartExpense = smartExpenses.find(se => se.id === expense.id);
                    const isSmartExpense = smartExpense !== undefined;
                    
                    return (
                      <div key={expense.id} className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        smartExpense?.budgetStatus === 'over_budget' ? 'border-red-200 bg-red-50' :
                        smartExpense?.budgetStatus === 'significant_expense' ? 'border-orange-200 bg-orange-50' :
                        smartExpense?.anomalyScore && smartExpense.anomalyScore > 0.7 ? 'border-purple-200 bg-purple-50' :
                        'border-border bg-white'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1 flex-wrap">
                              <span className="font-medium text-black">{expense.description}</span>
                              
                              {/* Yellow flag for Ahli Bank emails */}
                              {isFromAhliBank(expense) && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  Ahli Bank
                                </span>
                              )}

                              {/* Light blue flag for Bank Muscat emails */}
                              {isFromBankMuscat(expense) && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  Bank Muscat
                                </span>
                              )}

                              {/* Light red flag for Ahli Bank general emails */}
                              {isFromAhliBankGeneral(expense) && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  Ahli Bank
                                </span>
                              )}
                              
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {expense.category}
                              </span>
                              
                              {isSmartExpense && smartExpense?.autoCategory && smartExpense.autoCategory !== expense.category && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                  <Brain className="h-3 w-3" />
                                  AI: {smartExpense.autoCategory}
                                  {smartExpense.confidence && (
                                    <span className="text-xs">({Math.round(smartExpense.confidence * 100)}%)</span>
                                  )}
                                </span>
                              )}
                              
                              {smartExpense?.budgetStatus === 'over_budget' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Over Budget
                                </span>
                              )}
                              
                              {smartExpense?.budgetStatus === 'significant_expense' && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Large Expense
                                </span>
                              )}
                              
                              {smartExpense?.anomalyScore && smartExpense.anomalyScore > 0.7 && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  Unusual
                                </span>
                              )}
                              
                              {'recurringPattern' in (smartExpense || {}) && smartExpense?.recurringPattern && smartExpense.recurringPattern !== 'irregular' && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  {smartExpense.recurringPattern}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {expense.date && <span>{new Date(expense.date).toLocaleDateString()}</span>}
                              {'merchant' in (smartExpense || {}) && smartExpense?.merchant && smartExpense.merchant !== expense.from && (
                                <span className="ml-2">• Merchant: {smartExpense.merchant}</span>
                              )}
                              {expense.from && (
                                <span className="ml-2">• From: {expense.from}</span>
                              )}
                              {expense.accountNumber && (
                                <span className="ml-2">• Account: {expense.accountNumber}</span>
                              )}
                              {expense.accountTypeName && (
                                <span className="ml-2">• Type: {expense.accountTypeName}</span>
                              )}
                            </div>
                            
                            {'tags' in (smartExpense || {}) && smartExpense?.tags && smartExpense.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {smartExpense.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {'suggestedActions' in (smartExpense || {}) && smartExpense?.suggestedActions && smartExpense.suggestedActions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {smartExpense.suggestedActions.slice(0, 2).map((action, idx) => (
                                  <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">
                                    💡 {action}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {(expense.creditCardBalance !== undefined && expense.creditCardBalance !== null && expense.creditCardBalance !== 0) && (
                              <div className="text-sm text-gray-600 mt-1">
                                Credit Card Balance: {formatCurrency(Number(expense.creditCardBalance))}
                              </div>
                            )}
                            {(expense.debitCardBalance !== undefined && expense.debitCardBalance !== null && expense.debitCardBalance !== 0) && (
                              <div className="text-sm text-gray-600 mt-1">
                                Debit Card Balance: {formatCurrency(Number(expense.debitCardBalance))}
                              </div>
                            )}
                            
                            {expense.id && (
                              <div className="text-sm text-gray-600 mt-1">
                                ID: {expense.id.startsWith('http') ? (
                                  <a 
                                    href={expense.id} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                                  >
                                    {expense.id}
                                  </a>
                                ) : (
                                  <span className="ml-1">{expense.id}</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-4">
                              {expense.creditAmount && expense.creditAmount > 0 && (
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                  <span>😊</span>
                                  <span>+{formatCurrency(expense.creditAmount)}</span>
                                </div>
                              )}
                              {expense.debitAmount && expense.debitAmount > 0 && (
                                <div className="text-sm text-red-600 flex items-center gap-1">
                                  <span>😢</span>
                                  <span>-{formatCurrency(expense.debitAmount)}</span>
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => expense.id && deleteExpense(expense.id)}
                              disabled={deleting === expense.id}
                              className="hover:bg-gray-100"
                            >
                              <Trash2 className={`h-4 w-4 ${deleting === expense.id ? 'animate-spin' : ''}`} 
                                style={{ color: '#8b0000' }} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {t('showingEntries', { 
                        start: String(((currentPage - 1) * itemsPerPage) + 1), 
                        end: String(Math.min(currentPage * itemsPerPage, expenses.length)), 
                        total: String(expenses.length) 
                      })}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t('previous')}
                      </Button>
                      <span className="flex items-center px-3 py-2 text-sm">
                        {currentPage} / {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        {t('next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  );
}