'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { ModernCard } from '@/components/ui/ModernCard';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Mail,
  DollarSign,
  Clock,
  Target,
  Activity,
  RefreshCw,
  Download,
  Users,
  Building2,
  Zap,
  TrendingDown,
  Award,
  Eye,
  Flag,
  Brain,
  PieChart,
  Star,
  AlertCircle
} from 'lucide-react';

interface BankAnalysis {
  bankType: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  insights: string;
  trend: 'up' | 'down' | 'stable';
  healthScore: number;
  availableBalance: number;
  balanceStatus: 'healthy' | 'warning' | 'critical';
}

interface BankAnalyticsData {
  bankAnalysis: BankAnalysis[];
  totalExpenses: number;
  overallHealthScore: number;
  topSpendingBank: string;
  mostActiveBank: string;
  bestPerformingBank: string;
  aiRecommendations: string[];
  analysisStatus: string;
}

interface AnalyticsData {
  overview: {
    totalEvents: number;
    totalEmails: number;
    totalExpenses: number;
    totalContacts: number;
  };
  trends: {
    eventsThisMonth: number;
    emailsThisMonth: number;
    expensesThisMonth: number;
    lastMonthEvents: number;
    lastMonthEmails: number;
    lastMonthExpenses: number;
  };
  categories: {
    expensesByCategory: { [key: string]: number };
    eventsByType: { [key: string]: number };
  };
  productivity: {
    averageEventsPerDay: number;
    averageEmailsPerDay: number;
    busyDaysThisMonth: number;
    completionRate: number;
  };
  debug?: {
    hasRealData: boolean;
    apiResponses?: any;
  };
}

// Colorblind-friendly bank color function 
const getBankColors = (bankType: string) => {
  const normalizedBank = bankType.toLowerCase();
  
  // Light, harmonious colors with 30-40% opacity maintaining original hues
  if (normalizedBank.includes('wafrah') || normalizedBank.includes('wafra')) {
    return { 
      bg: 'from-yellow-50/80 to-amber-100/60', 
      border: 'border-yellow-200/80', 
      text: 'text-yellow-800', 
      icon: 'from-yellow-500 to-amber-600',
      shadow: 'shadow-yellow-100/50',
      progressBg: 'bg-yellow-100/40',
      progressBar: 'from-yellow-400/70 to-amber-500/70'
    };
  }
  
  if (normalizedBank.includes('credit') && normalizedBank.includes('card')) {
    return { 
      bg: 'from-blue-50/80 to-indigo-100/60', 
      border: 'border-blue-200/80', 
      text: 'text-blue-800', 
      icon: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-100/50',
      progressBg: 'bg-blue-100/40',
      progressBar: 'from-blue-400/70 to-indigo-500/70'
    };
  }
  
  if (normalizedBank.includes('overdraft')) {
    return { 
      bg: 'from-red-50/80 to-pink-100/60', 
      border: 'border-red-200/80', 
      text: 'text-red-800', 
      icon: 'from-red-500 to-pink-600',
      shadow: 'shadow-red-100/50',
      progressBg: 'bg-red-100/40',
      progressBar: 'from-red-400/70 to-pink-500/70'
    };
  }
  
  if (normalizedBank.includes('muscat')) {
    return { 
      bg: 'from-green-50/80 to-emerald-100/60', 
      border: 'border-green-200/80', 
      text: 'text-green-800', 
      icon: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-100/50',
      progressBg: 'bg-green-100/40',
      progressBar: 'from-green-400/70 to-emerald-500/70'
    };
  }
  
  if (normalizedBank.includes('debit') || normalizedBank.includes('saving')) {
    return { 
      bg: 'from-purple-50/80 to-violet-100/60', 
      border: 'border-purple-200/80', 
      text: 'text-purple-800', 
      icon: 'from-purple-500 to-violet-600',
      shadow: 'shadow-purple-100/50',
      progressBg: 'bg-purple-100/40',
      progressBar: 'from-purple-400/70 to-violet-500/70'
    };
  }
  
  if (normalizedBank.includes('ahli') || normalizedBank.includes('alhli')) {
    return { 
      bg: 'from-orange-50/80 to-red-100/60', 
      border: 'border-orange-200/80', 
      text: 'text-orange-800', 
      icon: 'from-orange-500 to-red-600',
      shadow: 'shadow-orange-100/50',
      progressBg: 'bg-orange-100/40',
      progressBar: 'from-orange-400/70 to-red-500/70'
    };
  }
  
  // Fallback to light teal for any unmatched banks
  return { 
    bg: 'from-teal-50/80 to-cyan-100/60', 
    border: 'border-teal-200/80', 
    text: 'text-teal-800', 
    icon: 'from-teal-500 to-cyan-600',
    shadow: 'shadow-teal-100/50',
    progressBg: 'bg-teal-100/40',
    progressBar: 'from-teal-400/70 to-cyan-500/70'
  };
};

export default function TrackingPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [timeRange, setTimeRange] = useState('30d');
  const [bankAnalytics, setBankAnalytics] = useState<BankAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar data state for reminders
  const [calendarData, setCalendarData] = useState<{
    upcomingEvents: Array<{
      id: string;
      title: string;
      date: string;
      type: 'birthday' | 'task' | 'holiday' | 'event';
      description?: string;
      priority?: 'high' | 'medium' | 'low';
      location?: string;
    }>;
    todayEvents: Array<{
      id: string;
      title: string;
      description?: string;
      type: 'birthday' | 'task' | 'holiday' | 'event';
      priority?: 'high' | 'medium' | 'low';
    }>;
    statistics: {
      totalEvents: number;
      pendingTasks: number;
      upcomingBirthdays: number;
      upcomingHolidays: number;
    };
  } | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalEvents: 0,
      totalEmails: 0,
      totalExpenses: 0,
      totalContacts: 0
    },
    trends: {
      eventsThisMonth: 0,
      emailsThisMonth: 0,
      expensesThisMonth: 0,
      lastMonthEvents: 0,
      lastMonthEmails: 0,
      lastMonthExpenses: 0
    },
    categories: {
      expensesByCategory: {},
      eventsByType: {}
    },
    productivity: {
      averageEventsPerDay: 0,
      averageEmailsPerDay: 0,
      busyDaysThisMonth: 0,
      completionRate: 0
    }
  });

  // Separate bank categories for display
  const separateBankCategories = (expensesByCategory: { [key: string]: number }) => {
    const separated: { [key: string]: number } = {};
    
    // Process each category and normalize bank names
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      if (!category || amount === 0) return;
      
      const normalizedCategory = category.toLowerCase().trim();
      
      // Determine if this is a debit (negative amount) or credit (positive amount)
      let adjustedAmount = amount;
      let isDebit = false;
      
      // Check for debit indicators in category name or amount
      if (normalizedCategory.includes('debit') || 
          normalizedCategory.includes('payment') || 
          normalizedCategory.includes('purchase') ||
          normalizedCategory.includes('withdrawal') ||
          normalizedCategory.includes('transfer out') ||
          normalizedCategory.includes('spending') ||
          amount < 0) {
        isDebit = true;
        adjustedAmount = Math.abs(amount) * -1; // Ensure negative
      }
      
      // Map various bank name variations to standard names with color coding
      if (normalizedCategory.includes('ahli') || normalizedCategory.includes('alhli')) {
        if (normalizedCategory.includes('cards')) {
          separated['💳 Ahli Bank (Cards)'] = (separated['💳 Ahli Bank (Cards)'] || 0) + adjustedAmount;
        } else if (normalizedCategory.includes('credit')) {
          separated['💰 Ahli Bank (Credit)'] = (separated['💰 Ahli Bank (Credit)'] || 0) + adjustedAmount;
        } else if (normalizedCategory.includes('debit')) {
          separated['💸 Ahli Bank (Debit)'] = (separated['💸 Ahli Bank (Debit)'] || 0) + adjustedAmount;
        } else {
          separated['🏦 Ahli Bank (General)'] = (separated['🏦 Ahli Bank (General)'] || 0) + adjustedAmount;
        }
      } else if (normalizedCategory.includes('muscat') || normalizedCategory.includes('bank muscat')) {
        separated['🏛️ Bank Muscat'] = (separated['🏛️ Bank Muscat'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('food') || normalizedCategory.includes('restaurant') || normalizedCategory.includes('dining')) {
        separated['🍽️ Food & Dining'] = (separated['🍽️ Food & Dining'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('transportation') || normalizedCategory.includes('taxi') || normalizedCategory.includes('uber') || normalizedCategory.includes('fuel') || normalizedCategory.includes('gas')) {
        separated['🚗 Transportation'] = (separated['🚗 Transportation'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('business') || normalizedCategory.includes('office') || normalizedCategory.includes('work')) {
        separated['💼 Business & Work'] = (separated['💼 Business & Work'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('medical') || normalizedCategory.includes('health') || normalizedCategory.includes('pharmacy') || normalizedCategory.includes('hospital')) {
        separated['⚕️ Healthcare & Medical'] = (separated['⚕️ Healthcare & Medical'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('entertainment') || normalizedCategory.includes('movie') || normalizedCategory.includes('cinema') || normalizedCategory.includes('game')) {
        separated['🎬 Entertainment'] = (separated['🎬 Entertainment'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('shopping') || normalizedCategory.includes('retail') || normalizedCategory.includes('store') || normalizedCategory.includes('mall')) {
        separated['🛍️ Shopping & Retail'] = (separated['🛍️ Shopping & Retail'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('utilities') || normalizedCategory.includes('electricity') || normalizedCategory.includes('water') || normalizedCategory.includes('internet') || normalizedCategory.includes('phone')) {
        separated['🔌 Utilities & Bills'] = (separated['🔌 Utilities & Bills'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('travel') || normalizedCategory.includes('hotel') || normalizedCategory.includes('flight') || normalizedCategory.includes('vacation')) {
        separated['✈️ Travel & Tourism'] = (separated['✈️ Travel & Tourism'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('education') || normalizedCategory.includes('school') || normalizedCategory.includes('university') || normalizedCategory.includes('course')) {
        separated['📚 Education & Learning'] = (separated['📚 Education & Learning'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('grocery') || normalizedCategory.includes('supermarket') || normalizedCategory.includes('market')) {
        separated['🛒 Groceries'] = (separated['🛒 Groceries'] || 0) + adjustedAmount;
      } else if (normalizedCategory.includes('subscription') || normalizedCategory.includes('netflix') || normalizedCategory.includes('spotify')) {
        separated['📱 Subscriptions'] = (separated['📱 Subscriptions'] || 0) + adjustedAmount;
      } else {
        // Keep other categories as-is but capitalize first letter and add an icon
        const displayName = '💰 ' + category.charAt(0).toUpperCase() + category.slice(1);
        separated[displayName] = (separated[displayName] || 0) + adjustedAmount;
      }
    });
    
    return separated;
  };

  // Fetch calendar data for reminders
  const fetchCalendarData = async () => {
    setCalendarLoading(true);
    try {
      console.log('📅 Fetching calendar data for reminders...');
      const response = await fetch('/api/calendar/data');
      const result = await response.json();
      
      if (result.success) {
        setCalendarData(result.data);
        console.log('✅ Calendar data fetched successfully:', result.data);
      } else {
        console.error('❌ Calendar data fetch failed:', result.error);
        setCalendarData(null);
      }
    } catch (error) {
      console.error('❌ Calendar data fetch error:', error);
      setCalendarData(null);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchBankAnalytics = async () => {
    try {
      console.log('🏦 Fetching REAL bank analytics...');
      
      const response = await fetch('/api/analytics/bank-wise', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success && result.data) {
        console.log('✅ REAL bank analytics received:', result.data);
        setBankAnalytics(result.data);
      } else {
        console.error('❌ REAL bank analytics API failed:', result.error || 'Unknown error');
        setBankAnalytics({
          bankAnalysis: [],
          totalExpenses: 0,
          overallHealthScore: 0,
          topSpendingBank: '',
          mostActiveBank: '',
          bestPerformingBank: '',
          aiRecommendations: [],
          analysisStatus: `Configuration Error: ${result.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('❌ Error fetching REAL bank analytics:', error);
      setBankAnalytics({
        bankAnalysis: [],
        totalExpenses: 0,
        overallHealthScore: 0,
        topSpendingBank: '',
        mostActiveBank: '',
        bestPerformingBank: '',
        aiRecommendations: [],
        analysisStatus: `Network Error: ${error instanceof Error ? error.message : 'Connection failed'}`
      });
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    console.log('📊 Fetching analytics data from centralized API...');
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch('/api/analytics/tracking', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Analytics data received:', result.data);
        setAnalyticsData(result.data);
        
        try {
          localStorage.setItem('analytics-cache', JSON.stringify({
            data: result.data,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.error('Failed to cache analytics data:', cacheError);
        }
      } else {
        console.error('❌ Analytics API failed:', result.message);
        throw new Error(result.message || 'Failed to fetch analytics');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      try {
        const cachedData = localStorage.getItem('analytics-cache');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed.timestamp && (Date.now() - parsed.timestamp < 86400000)) {
            console.log('🔄 Using cached analytics data');
            setAnalyticsData(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
      
      console.log('📊 Using fallback empty data');
      setAnalyticsData({
        overview: {
          totalEvents: 0,
          totalEmails: 0,
          totalExpenses: 0,
          totalContacts: 0
        },
        trends: {
          eventsThisMonth: 0,
          emailsThisMonth: 0,
          expensesThisMonth: 0,
          lastMonthEvents: 0,
          lastMonthEmails: 0,
          lastMonthExpenses: 0
        },
        categories: {
          expensesByCategory: {},
          eventsByType: {}
        },
        productivity: {
          averageEventsPerDay: 0,
          averageEmailsPerDay: 0,
          busyDaysThisMonth: 0,
          completionRate: 0
        }
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchBankAnalytics();
    fetchCalendarData();
  }, [timeRange]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) * 100) / previous;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} OMR`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const exportData = () => {
    const exportData = {
      analytics: analyticsData,
      bankAnalytics: bankAnalytics,
      exportDate: new Date().toISOString(),
      timeRange: timeRange
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const initiateGoogleAuth = async () => {
    try {
      console.log('🔄 Initiating Google OAuth...');
      const response = await fetch('/api/google/auth');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        console.log('✅ Redirecting to Google OAuth...');
        window.location.href = data.authUrl;
      } else {
        console.error('❌ Failed to get OAuth URL:', data.message);
      }
    } catch (error) {
      console.error('❌ Error initiating Google OAuth:', error);
    }
  };

  const cardHoverEffects = "hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 transform";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 lg:p-4">
      <div className="w-full space-y-6">
        {/* Modern Header */}
        <ModernCard gradient="blue" blur="xl" className={`${cardHoverEffects} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    Analytics & Tracking
                  </h1>
                  <p className="text-gray-600 font-medium mt-2 text-lg">Real-time insights and performance metrics</p>
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      const hasRealData = analyticsData.debug?.hasRealData || 
                        analyticsData.overview.totalEvents > 0 || 
                        analyticsData.overview.totalEmails > 0 || 
                        analyticsData.overview.totalExpenses > 0;
                      
                      const hasBankData = bankAnalytics && bankAnalytics.bankAnalysis.length > 0;
                      
                      const connectionStatus = hasRealData || hasBankData ? 'connected' : 
                        (bankAnalytics?.analysisStatus.includes('OAuth') ? 'auth-error' : 'not-connected');
                      
                      return (
                        <>
                          <div className={`w-2 h-2 rounded-full ${
                            connectionStatus === 'connected' ? 'bg-green-500' : 
                            connectionStatus === 'auth-error' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-500">
                            {connectionStatus === 'connected' ? 'Google Connected' : 
                             connectionStatus === 'auth-error' ? 'Google Auth Required' : 'Google Not Connected'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white bg-opacity-80 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
                <Button onClick={fetchAnalytics} className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm border border-gray-300 text-gray-800">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportData} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={initiateGoogleAuth} 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Connect Google
                </Button>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernCard gradient="blue" blur="lg" className={cardHoverEffects}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Events</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{analyticsData.overview.totalEvents}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600 font-medium">
                      {formatPercentage(calculateChange(
                        analyticsData.trends.eventsThisMonth,
                        analyticsData.trends.lastMonthEvents
                      ))} from last month
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </ModernCard>

          <ModernCard gradient="green" blur="lg" className={cardHoverEffects}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">Emails</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{analyticsData.overview.totalEmails}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600 font-medium">
                      {formatPercentage(calculateChange(
                        analyticsData.trends.emailsThisMonth,
                        analyticsData.trends.lastMonthEmails
                      ))} from last month
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </ModernCard>

          <ModernCard gradient="orange" blur="lg" className={cardHoverEffects}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Expenses</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {formatCurrency(analyticsData.overview.totalExpenses)}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <p className="text-sm text-red-600 font-medium">
                      {formatPercentage(calculateChange(
                        analyticsData.trends.expensesThisMonth,
                        analyticsData.trends.lastMonthExpenses
                      ))} from last month
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </ModernCard>

          <ModernCard gradient="purple" blur="lg" className={cardHoverEffects}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wider">Contacts</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{analyticsData.overview.totalContacts}</p>
                  <p className="text-sm text-purple-600 font-medium mt-2">Active contacts</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Productivity Analytics */}
          <ModernCard gradient="none" blur="lg" className={cardHoverEffects}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Productivity Analytics</h3>
                  <p className="text-sm text-gray-600">Performance metrics and insights</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">Daily Events</p>
                      <p className="text-xl font-bold text-blue-800">{analyticsData.productivity.averageEventsPerDay}</p>
                    </div>
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-700">Daily Emails</p>
                      <p className="text-xl font-bold text-green-800">{analyticsData.productivity.averageEmailsPerDay}</p>
                    </div>
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-orange-700">Completion Rate</p>
                      <p className="text-xl font-bold text-orange-800">{analyticsData.productivity.completionRate}%</p>
                    </div>
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Bank-wise Breakdown */}
          <ModernCard gradient="none" blur="lg" className={cardHoverEffects}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Bank-wise Breakdown</h3>
                  <p className="text-sm text-gray-600">Account-specific transactions</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {bankAnalytics && bankAnalytics.bankAnalysis.length > 0 ? (
                  bankAnalytics.bankAnalysis.slice(0, 5).map((bank, index) => {
                    const colors = getBankColors(bank.bankType);

                    // Determine emoji based on debit transaction count (higher debit count = sad, lower = happy)
                    const averageDebitCount = 10; // You can adjust this threshold
                    const isHighDebitCount = bank.transactionCount > averageDebitCount;
                    const debitEmoji = isHighDebitCount ? '😢' : '😊';
                    
                    return (
                      <div key={bank.bankType} className={`p-3 bg-gradient-to-r ${colors.bg} border-2 ${colors.border} rounded-xl shadow-lg ${colors.shadow} hover:shadow-xl hover:scale-105 transition-all duration-300`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 bg-gradient-to-r ${colors.icon} rounded-lg shadow-md`}>
                            <DollarSign className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-sm font-bold ${colors.text} flex items-center gap-1`}>
                              {bank.bankType.includes('Wafrah') && '💰 '}
                              {bank.bankType.includes('Credit Card') && '💳 '}
                              {bank.bankType.includes('Bank Muscat') && '🏛️ '}
                              {bank.bankType.includes('Debit') && '💸 '}
                              {bank.bankType.includes('General') && '🏦 '}
                              {bank.bankType}
                              <span className="ml-1">{debitEmoji}</span>
                            </h4>
                            <p className="text-xs opacity-80 font-medium">{bank.insights}</p>
                            {/* Available Balance Display */}
                            <div className="mt-1 text-xs font-semibold">
                              <span className="text-gray-700">Available: </span>
                              <span className={`${colors.text}`}>
                                {bank.availableBalance ? formatCurrency(bank.availableBalance) : 'Loading...'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${colors.text}`}>
                              {formatCurrency(Math.abs(bank.amount))}
                            </span>
                            <div className="text-xs opacity-70 font-medium">
                              {bank.percentage.toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                        <div className={`w-full ${colors.progressBg || 'bg-gray-100/40'} rounded-full h-2 shadow-inner`}>
                          <div 
                            className={`bg-gradient-to-r ${colors.progressBar || colors.icon} h-2 rounded-full shadow-sm`}
                            style={{ width: `${Math.min(bank.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs opacity-70 font-medium">
                            Transactions: {bank.transactionCount}
                          </span>
                          <span className="text-xs font-semibold">
                            {isHighDebitCount ? 'High Activity' : 'Low Activity'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-red-800">Configuration Required</h4>
                        <p className="text-xs text-red-600">Real data source not available</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-red-800 font-medium">Status: {bankAnalytics?.analysisStatus}</p>
                    </div>
                    <div className="mt-3 text-xs text-red-700">
                      <p><strong>Required Setup:</strong></p>
                      <div className="mt-1 space-y-1">
                        {bankAnalytics?.analysisStatus.includes('OAuth') && (
                          <div className="p-2 bg-yellow-100 rounded border border-yellow-300">
                            <p className="text-yellow-800 font-semibold">🔑 OAuth Token Issue Detected</p>
                          </div>
                        )}
                        <div className="pl-2">
                          <ul className="list-disc text-xs space-y-1">
                            <li><strong>Visit:</strong> <a href="/api/auth/google" className="text-blue-600 underline hover:text-blue-800">/api/auth/google</a> to re-authenticate</li>
                            <li>Grant access to Google Sheets in the authorization flow</li>
                            <li>Ensure your Google account has access to the expense spreadsheet</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModernCard>

          {/* Category Breakdown */}
          <ModernCard gradient="none" blur="lg" className={cardHoverEffects}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Category Breakdown</h3>
                  <p className="text-sm text-gray-600">All categories with debit credit tracking</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {Object.keys(analyticsData.categories.expensesByCategory).length === 0 ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="space-y-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(separateBankCategories(analyticsData.categories.expensesByCategory)).map(([category, amount]) => {
                      const total = Object.values(separateBankCategories(analyticsData.categories.expensesByCategory)).reduce((a, b) => Math.abs(a) + Math.abs(b), 0);
                      const percentage = total > 0 ? (Math.abs(amount) * 100) / total : 0;
                      const isNegative = amount < 0;
                      
                      return (
                        <div key={category} className={`p-2 rounded-lg border ${isNegative ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-800">{category}</span>
                            <span className={`text-sm font-bold ${isNegative ? 'text-red-700' : 'text-green-700'}`}>
                              {isNegative ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100/60 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${isNegative ? 'bg-gradient-to-r from-red-400/70 to-rose-500/70' : 'bg-gradient-to-r from-green-400/70 to-emerald-500/70'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{(percentage || 0).toFixed(1)}% of total</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ModernCard>

          {/* Smart Insights */}
          <ModernCard gradient="none" blur="lg" className={cardHoverEffects}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Smart Insights</h3>
                  <p className="text-sm text-gray-600">AI-powered analysis</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Peak Time</span>
                      <span className="font-bold text-blue-600">
                        {analyticsData.overview.totalEvents > 0 ? '10:00 AM' : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Efficiency</span>
                      <span className="font-bold text-green-600">
                        {analyticsData.productivity.completionRate > 0 ? `${Math.round(analyticsData.productivity.completionRate)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Monthly Trends</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-700">📧 Email Activity</p>
                        <p className="text-xs text-green-600">This month: {analyticsData.trends.emailsThisMonth}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700">📅 Event Planning</p>
                        <p className="text-xs text-blue-600">This month: {analyticsData.trends.eventsThisMonth}</p>
                      </div>
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Bank-wise Analytics Section */}
        <ModernCard gradient="none" blur="xl" className={`${cardHoverEffects} mt-6`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Bank-wise Analytics</h3>
                <p className="text-sm text-gray-600">Detailed financial performance across all accounts</p>
              </div>
            </div>
            
            {bankAnalytics && bankAnalytics.bankAnalysis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAnalytics.bankAnalysis.map((bank, index) => {
                  const colors = getBankColors(bank.bankType);
                  const isHighDebitCount = bank.transactionCount > 10;
                  const debitEmoji = isHighDebitCount ? '😢' : '😊';
                  
                  return (
                    <div key={bank.bankType} className={`p-4 bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-xl shadow-lg ${colors.shadow} hover:shadow-xl transition-all duration-300`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 bg-gradient-to-r ${colors.icon} rounded-lg shadow-md`}>
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold ${colors.text} flex items-center gap-1`}>
                            {bank.bankType.includes('Wafrah') && '💰 '}
                            {bank.bankType.includes('Credit Card') && '💳 '}
                            {bank.bankType.includes('Bank Muscat') && '🏛️ '}
                            {bank.bankType.includes('Debit') && '💸 '}
                            {bank.bankType.includes('General') && '🏦 '}
                            {bank.bankType}
                            <span className="ml-1">{debitEmoji}</span>
                          </h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium opacity-80">Total Amount</span>
                          <span className={`text-lg font-bold ${colors.text}`}>
                            {formatCurrency(Math.abs(bank.amount))}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium opacity-80">Available Balance</span>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {bank.availableBalance ? formatCurrency(bank.availableBalance) : 'Loading...'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium opacity-80">Transactions</span>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {bank.transactionCount}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium opacity-80">Health Score</span>
                          <span className={`text-sm font-bold ${bank.healthScore >= 70 ? 'text-green-700' : bank.healthScore >= 40 ? 'text-yellow-700' : 'text-red-700'}`}>
                            {bank.healthScore}/100
                          </span>
                        </div>
                        
                        <div className={`w-full ${colors.progressBg || 'bg-gray-100/40'} rounded-full h-2 shadow-inner`}>
                          <div 
                            className={`bg-gradient-to-r ${colors.progressBar || colors.icon} h-2 rounded-full shadow-sm`}
                            style={{ width: `${Math.min(bank.percentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xs opacity-80 font-medium mt-2">{bank.insights}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-xl">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="text-lg font-bold text-yellow-800">No Bank Analytics Available</h4>
                  <p className="text-yellow-700 mt-1">Connect your Google Sheets to view detailed bank analytics</p>
                </div>
              </div>
            )}
          </div>
        </ModernCard>

        {/* Calendar Reminders Section - CMB Colorblind Friendly */}
        <ModernCard gradient="none" blur="xl" className={`${cardHoverEffects} mt-6`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Calendar Reminders</h3>
                <p className="text-sm text-gray-600">Upcoming events, holidays, and birthdays</p>
              </div>
            </div>
            
            {calendarLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="p-4 bg-gray-100 rounded-xl shadow-lg animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : calendarData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Omani Holidays - CMB Friendly */}
                {(() => {
                  const holidays = calendarData.upcomingEvents.filter(event => 
                    event.type === 'holiday' && (
                      event.title.includes('National') || 
                      event.title.includes('Renaissance') || 
                      event.title.includes('New Year')
                    )
                  ).slice(0, 3);
                  
                  if (holidays.length > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 border-l-8 border-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                            <Flag className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-blue-900">🇴🇲 Omani Holidays</h4>
                            <p className="text-xs text-blue-700 font-medium">National celebrations</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {holidays.map(holiday => (
                            <div key={holiday.id} className="p-2 bg-blue-50 border border-blue-300 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-blue-800">{holiday.title}</span>
                                <span className="text-xs text-blue-600">
                                  {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Birthdays - CMB Friendly */}
                {(() => {
                  const birthdays = calendarData.upcomingEvents.filter(event => event.type === 'birthday').slice(0, 3);
                  
                  if (birthdays.length > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 border-l-8 border-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-600 rounded-lg shadow-md">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-purple-900">🎂 Birthdays</h4>
                            <p className="text-xs text-purple-700 font-medium">Friends & family</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {birthdays.map(birthday => (
                            <div key={birthday.id} className="p-2 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-purple-800">{birthday.title}</span>
                                <span className="text-xs text-purple-600">
                                  {new Date(birthday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Regular Events - CMB Friendly */}
                {(() => {
                  const events = calendarData.upcomingEvents.filter(event => 
                    event.type === 'event' && !event.title.toLowerCase().includes('task')
                  ).slice(0, 3);
                  
                  if (events.length > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 border-r-8 border-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-600 rounded-lg shadow-md">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-green-900">⏰ Upcoming Events</h4>
                            <p className="text-xs text-green-700 font-medium">Personal & work</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {events.map(event => (
                            <div key={event.id} className="p-2 bg-green-50 border-t-4 border-green-400 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-green-800">{event.title}</span>
                                <span className="text-xs text-green-600">
                                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Islamic Events - CMB Friendly */}
                {(() => {
                  const islamicEvents = calendarData.upcomingEvents.filter(event => 
                    event.type === 'holiday' && (
                      event.title.includes('Eid') || 
                      event.title.includes('Ramadan') ||
                      event.title.includes('Hijri') ||
                      event.title.includes('Prophet') ||
                      event.title.includes('Isra')
                    )
                  ).slice(0, 3);
                  
                  if (islamicEvents.length > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 border-b-8 border-orange-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-orange-600 rounded-lg shadow-md">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-orange-900">☪️ Islamic Events</h4>
                            <p className="text-xs text-orange-700 font-medium">Religious observances</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {islamicEvents.map(event => (
                            <div key={event.id} className="p-2 bg-orange-50 border border-orange-400 rounded-lg shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-orange-800">{event.title}</span>
                                <span className="text-xs text-orange-600">
                                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Tasks - CMB Friendly */}
                {(() => {
                  const tasks = calendarData.upcomingEvents.filter(event => event.type === 'task').slice(0, 3);
                  
                  if (tasks.length > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 border-l-8 border-r-4 border-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-red-600 rounded-lg shadow-md">
                            <Target className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-red-900">💼 Tasks</h4>
                            <p className="text-xs text-red-700 font-medium">Things to do</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {tasks.map(task => (
                            <div key={task.id} className="p-2 bg-red-50 border-l-4 border-red-500 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-red-800">{task.title}</span>
                                <span className="text-xs text-red-600">
                                  {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Today's Events - CMB Friendly */}
                {(() => {
                  const todayEvents = calendarData.todayEvents.slice(0, 3);
                  
                  if (todayEvents.length > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-br from-teal-100 to-teal-200 border-4 border-dotted border-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-teal-600 rounded-lg shadow-md">
                            <Eye className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-teal-900">📅 Today's Events</h4>
                            <p className="text-xs text-teal-700 font-medium">Happening today</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {todayEvents.map(event => (
                            <div key={event.id} className="p-2 bg-teal-50 border-2 border-teal-400 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-teal-800">{event.title}</span>
                                <span className="text-xs text-teal-600">Today</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-xl">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="text-lg font-bold text-yellow-800">No Calendar Data Available</h4>
                  <p className="text-yellow-700 mt-1">Connect your Google Calendar to view reminders</p>
                </div>
              </div>
            )}
          </div>
        </ModernCard>
      </div>
    </div>
  );
}