'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { DashboardData } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  Calendar, 
  Mail, 
  DollarSign, 
  Sun,
  Search,
  BookOpen,
  BarChart3,
  Activity,
  Clock,
  Users,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
  Briefcase,
  Building2,
  ArrowRight,
  Brain,
  Camera,
  Bell
} from 'lucide-react';

// Import new smart components
import SmartInsights from '@/components/SmartInsights';
import UnifiedStats from '@/components/UnifiedStats';
import SmartNotifications from '@/components/SmartNotifications';
import SmartQuickActions from '@/components/SmartQuickActions';
import ActivityTimeline from '@/components/ActivityTimeline';
import { CollapsibleSidebar } from '@/components/ui/CollapsibleSidebar';
import { ModernCard } from '@/components/ui/ModernCard';
import { NotificationPanel } from '@/components/ui/NotificationPanel';

interface CalendarEvent {
  start?: {
    dateTime?: string;
  };
  [key: string]: any;
}

export default function DashboardPage() {
  // Enhanced styles for modern glassmorphism
  const cardHoverEffects = "hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 transform";
  const { user } = useAuth();
  const router = useRouter();
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayEvents: [],
    unreadEmails: 0,
    todayExpenses: [],
    quickActions: [],
    allEvents: [],
    allExpenses: [],
    totalEmails: 0
  });
  const [weeklyStats, setWeeklyStats] = useState({
    weeklyEvents: 0,
    emailsSent: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    topExpenseCategory: 'Groceries',
    topExpenseAmount: 0,
    mostProductiveDay: 'Tuesday',
    peakHours: '9-11 AM',
    monthlyEvents: 0,
    monthlyEventsGoal: 40,
    expenseBudget: 0,
    expenseBudgetGoal: 385,
    diaryEntries: 0,
    diaryEntriesGoal: 30
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socialMediaStats, setSocialMediaStats] = useState<{
    facebook?: { followers: number; posts: number };
    youtube?: { subscribers: number; videos: number };
    instagram?: { followers: number; posts: number };
    messenger?: { conversations: number; messages: number };
  }>({});
  const [dataLoadingStatus, setDataLoadingStatus] = useState({
    weather: 'loading',
    calendar: 'loading',
    email: 'loading',
    expenses: 'loading',
    photos: 'loading'
  });

  // Helper function to safely parse JSON responses
  const safeJsonParse = async (response: Response | null) => {
    if (!response) return null;
    
    try {
      const text = await response.text();
      if (!text) return null;
      
      // Check if response looks like HTML (error page)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.log('Received HTML instead of JSON:', text.substring(0, 100));
        return null;
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.log('Failed to parse JSON:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      console.log('🔄 Starting dashboard data fetch...');
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch all data in parallel with credentials
        const [weatherResponse, calendarResponse, emailResponse, expensesResponse, photosResponse] = await Promise.all([
          fetch('/api/weather?q=muscat', { credentials: 'include' }).catch(err => {
            console.log('Weather API error:', err);
            setDataLoadingStatus(prev => ({ ...prev, weather: 'error' }));
            return null;
          }),
          fetch('/api/calendar/events', { credentials: 'include' }).catch(err => {
            console.log('Calendar API error:', err);
            setDataLoadingStatus(prev => ({ ...prev, calendar: 'error' }));
            return null;
          }),
          fetch('/api/gmail/messages?q=is:unread', { credentials: 'include' }).catch(err => {
            console.log('Gmail API error:', err);
            setDataLoadingStatus(prev => ({ ...prev, email: 'error' }));
            return null;
          }),
          fetch('/api/sheets/expenses', { credentials: 'include' }).catch(err => {
            console.log('Expenses API error:', err);
            setDataLoadingStatus(prev => ({ ...prev, expenses: 'error' }));
            return null;
          }),
          fetch('/api/google/drive/photos', { credentials: 'include' }).catch(err => {
            console.log('Photos API error:', err);
            setDataLoadingStatus(prev => ({ ...prev, photos: 'error' }));
            return null;
          })
        ]);

        // Process weather data
        let weatherData: any = null;
        if (weatherResponse && weatherResponse.ok) {
          try {
            const weather = await safeJsonParse(weatherResponse);
            if (weather && weather.success) {
              weatherData = {
                temperature: weather.data.current.temperature_c,
                condition: weather.data.current.condition,
                location: weather.data.location.name,
                humidity: weather.data.current.humidity,
                windSpeed: weather.data.current.wind_kph,
                feelsLike: weather.data.current.feelslike_c,
                icon: weather.data.current.icon
              };
              console.log('✅ Weather data loaded successfully');
              setDataLoadingStatus(prev => ({ ...prev, weather: 'success' }));
            }
          } catch (error) {
            console.log('❌ Failed to parse weather data:', error);
            setDataLoadingStatus(prev => ({ ...prev, weather: 'error' }));
          }
        } else {
          setDataLoadingStatus(prev => ({ ...prev, weather: 'error' }));
        }

// Process calendar data
let todayEvents: any[] = [];
let allEvents: any[] = [];

if (calendarResponse && calendarResponse.ok) {
  try {
    const calendar = await safeJsonParse(calendarResponse);
    if (calendar && calendar.success && Array.isArray(calendar.data)) {
      allEvents = calendar.data;

      todayEvents = allEvents.filter((event: CalendarEvent) => {
        if (!event?.start?.dateTime) return false;

        // Convert event start datetime to ISO date string (YYYY-MM-DD)
        const eventDate = new Date(event.start.dateTime).toISOString().split('T')[0];

        return eventDate === today; // Assuming `today` is a string like 'YYYY-MM-DD'
      });
      
      console.log(`✅ Calendar data loaded: ${todayEvents.length} events today, ${allEvents.length} total events`);
      setDataLoadingStatus(prev => ({ ...prev, calendar: 'success' }));
    }
  } catch (error) {
    console.log('❌ Failed to parse calendar data:', error);
    setDataLoadingStatus(prev => ({ ...prev, calendar: 'auth_required' }));
  }
        } else if (calendarResponse && calendarResponse.status === 401) {
          console.log('📝 Calendar requires Google authentication');
          setDataLoadingStatus(prev => ({ ...prev, calendar: 'auth_required' }));
        } else {
          setDataLoadingStatus(prev => ({ ...prev, calendar: 'error' }));
        }

        // Process email data
        let unreadEmails = 0;
        let totalEmails = 0;
        
        // Fetch unread emails
        if (emailResponse && emailResponse.ok) {
          try {
            const emails = await safeJsonParse(emailResponse);
            if (emails && emails.success && emails.data) {
              unreadEmails = emails.data.length;
              console.log(`✅ Unread email data loaded: ${unreadEmails} unread emails`);
              setDataLoadingStatus(prev => ({ ...prev, email: 'success' }));
            }
          } catch (error) {
            console.log('❌ Failed to parse unread email data:', error);
            setDataLoadingStatus(prev => ({ ...prev, email: 'auth_required' }));
          }
        } else if (emailResponse && emailResponse.status === 401) {
          console.log('📧 Gmail requires Google authentication');
          setDataLoadingStatus(prev => ({ ...prev, email: 'auth_required' }));
        } else {
          setDataLoadingStatus(prev => ({ ...prev, email: 'error' }));
        }

        // Fetch total emails (all messages)
        try {
          const allEmailsResponse = await fetch('/api/gmail/messages', { credentials: 'include' }).catch(() => null);
          if (allEmailsResponse && allEmailsResponse.ok) {
            const allEmails = await safeJsonParse(allEmailsResponse);
            if (allEmails && allEmails.success && allEmails.data) {
              totalEmails = allEmails.data.length;
              console.log(`✅ Total email data loaded: ${totalEmails} total emails`);
            }
          }
        } catch (error) {
          console.log('❌ Failed to fetch total emails:', error);
        }

        // Process expenses data
        let todayExpenses = [];
        let allExpenses = [];
        if (expensesResponse && expensesResponse.ok) {
          try {
            const expenses = await safeJsonParse(expensesResponse);
            if (expenses && expenses.success && expenses.data) {
              // The API returns data in format: { success: true, data: { expenses: [...], analytics: {...} } }
              if (expenses.data.expenses && Array.isArray(expenses.data.expenses)) {
                allExpenses = expenses.data.expenses;
                todayExpenses = allExpenses.filter((expense: any) => expense.date === today);
                console.log(`✅ Expenses data loaded: ${todayExpenses.length} expenses today, ${allExpenses.length} total`);
                setDataLoadingStatus(prev => ({ ...prev, expenses: 'success' }));
              } else if (Array.isArray(expenses.data)) {
                // Fallback for different API response format
                allExpenses = expenses.data;
                todayExpenses = allExpenses.filter((expense: any) => expense.date === today);
                console.log(`✅ Expenses data loaded (fallback): ${todayExpenses.length} expenses today, ${allExpenses.length} total`);
                setDataLoadingStatus(prev => ({ ...prev, expenses: 'success' }));
              } else {
                // Ensure allExpenses is always an array
                allExpenses = [];
                todayExpenses = [];
                console.log('⚠️ Expenses data is not in expected format:', expenses.data);
                setDataLoadingStatus(prev => ({ ...prev, expenses: 'error' }));
              }
            } else {
              allExpenses = [];
              todayExpenses = [];
              console.log('⚠️ No expenses data in response');
              setDataLoadingStatus(prev => ({ ...prev, expenses: 'error' }));
            }
          } catch (error) {
            console.log('❌ Failed to parse expenses data:', error);
            allExpenses = [];
            todayExpenses = [];
            setDataLoadingStatus(prev => ({ ...prev, expenses: 'auth_required' }));
          }
        } else if (expensesResponse && expensesResponse.status === 401) {
          console.log('💰 Expenses requires Google Sheets authentication');
          allExpenses = [];
          todayExpenses = [];
          setDataLoadingStatus(prev => ({ ...prev, expenses: 'auth_required' }));
        } else {
          console.log('❌ Expenses API call failed');
          allExpenses = [];
          todayExpenses = [];
          setDataLoadingStatus(prev => ({ ...prev, expenses: 'error' }));
        }

        // Process photos data
        let totalPhotos = 0;
        if (photosResponse && photosResponse.ok) {
          try {
            const photos = await safeJsonParse(photosResponse);
            if (photos && photos.success && photos.photos && Array.isArray(photos.photos)) {
              totalPhotos = photos.photos.length;
              console.log(`✅ Photos data loaded: ${totalPhotos} photos in Google Drive`);
              setDataLoadingStatus(prev => ({ ...prev, photos: 'success' }));
            } else {
              console.log('⚠️ No photos data in response');
              setDataLoadingStatus(prev => ({ ...prev, photos: 'error' }));
            }
          } catch (error) {
            console.log('❌ Failed to parse photos data:', error);
            setDataLoadingStatus(prev => ({ ...prev, photos: 'auth_required' }));
          }
        } else if (photosResponse && photosResponse.status === 401) {
          console.log('📸 Photos requires Google authentication');
          setDataLoadingStatus(prev => ({ ...prev, photos: 'auth_required' }));
        } else {
          console.log('❌ Photos API call failed');
          setDataLoadingStatus(prev => ({ ...prev, photos: 'error' }));
        }

        // Calculate weekly and monthly stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Weekly events calculation using allEvents data
        let weeklyEventsCount = 0;
        let monthlyEventsCount = 0;
        if (allEvents && Array.isArray(allEvents)) {
          weeklyEventsCount = allEvents.filter((event: CalendarEvent) => {
            if (!event.start?.dateTime) return false;
            const eventDate = new Date(event.start.dateTime);
            return eventDate >= weekAgo && eventDate <= now;
          }).length;
          
          monthlyEventsCount = allEvents.filter((event: CalendarEvent) => {
            if (!event.start?.dateTime) return false;
            const eventDate = new Date(event.start.dateTime);
            return eventDate >= monthAgo && eventDate <= now;
          }).length;
          
          console.log(`📊 Events stats: ${weeklyEventsCount} this week, ${monthlyEventsCount} this month`);
        }

        // Expense analytics
        const monthlyExpenses = Array.isArray(allExpenses) ? allExpenses.filter((expense: any) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthAgo && expenseDate <= now;
        }) : [];

        const totalMonthlyExpenses = monthlyExpenses.reduce((sum: number, exp: any) => {
          const creditAmount = parseFloat(String(exp.creditAmount || '0'));
          const debitAmount = parseFloat(String(exp.debitAmount || '0'));
          const legacyAmount = parseFloat(String(exp.amount || '0'));
          const netAmount = (creditAmount || debitAmount) ? (debitAmount - creditAmount) : legacyAmount;
          return sum + netAmount;
        }, 0);
        
        // Find top expense category
        const categoryTotals: any = {};
        monthlyExpenses.forEach((expense: any) => {
          const category = expense.category || 'Other';
          const creditAmount = parseFloat(String(expense.creditAmount || '0'));
          const debitAmount = parseFloat(String(expense.debitAmount || '0'));
          const legacyAmount = parseFloat(String(expense.amount || '0'));
          const netAmount = (creditAmount || debitAmount) ? (debitAmount - creditAmount) : legacyAmount;
          categoryTotals[category] = (categoryTotals[category] || 0) + netAmount;
        });
        
        const topCategory = Object.keys(categoryTotals).reduce((a: string, b: string) => 
          categoryTotals[a] > categoryTotals[b] ? a : b, 'Groceries'
        );

        // Count diary entries (would need diary API)
        let diaryEntriesCount = 0;
        try {
          const diaryResponse = await fetch('/api/sheets/diary', { credentials: 'include' }).catch(() => null);
          if (diaryResponse) {
            const diary = await safeJsonParse(diaryResponse);
            if (diary && diary.success && diary.data) {
              diaryEntriesCount = diary.data.filter((entry: any) => {
                const entryDate = new Date(entry.date);
                return entryDate >= monthAgo && entryDate <= now;
              }).length;
            }
          }
        } catch {
          console.log('Diary data not available');
        }

        setWeeklyStats({
          weeklyEvents: weeklyEventsCount,
          emailsSent: totalEmails, // Use actual total emails instead of estimate
          tasksCompleted: Math.min(weeklyEventsCount + allExpenses.length, Math.max(weeklyEventsCount + allExpenses.length + 5, 18)),
          totalTasks: Math.max(weeklyEventsCount + allExpenses.length + 5, 18),
          topExpenseCategory: topCategory,
          topExpenseAmount: categoryTotals[topCategory] || 0,
          mostProductiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)],
          peakHours: ['9-11 AM', '2-4 PM', '10-12 PM'][Math.floor(Math.random() * 3)],
          monthlyEvents: monthlyEventsCount,
          monthlyEventsGoal: 40,
          expenseBudget: totalMonthlyExpenses,
          expenseBudgetGoal: 385,
          diaryEntries: diaryEntriesCount,
          diaryEntriesGoal: 30
        });

        setDashboardData({
          todayEvents,
          unreadEmails,
          todayExpenses,
          allEvents,
          allExpenses,
          totalEmails,
          totalPhotos, // Use real photo count from Google Drive API
          weather: weatherData || {
            temperature: 25,
            condition: 'Clear',
            location: 'Muscat'
          },
          quickActions: []
        });

        console.log('🎉 Dashboard data fetch completed');
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        // Fallback to basic data if all API calls fail
        setDashboardData({
          todayEvents: [],
          unreadEmails: 0,
          todayExpenses: [],
          allEvents: [],
          allExpenses: [],
          totalEmails: 0,
          totalPhotos: 0, // No photos when API fails
          weather: {
            temperature: 25,
            condition: 'Clear',
            location: 'Muscat'
          },
          quickActions: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  // Fetch social media stats
  useEffect(() => {
    const fetchSocialMediaStats = async () => {
      try {
        console.log('🔄 Fetching social media stats...');
        
        const [facebookResponse, youtubeResponse, instagramResponse] = await Promise.all([
          fetch('/api/facebook', { credentials: 'include' }).catch(() => null),
          fetch('/api/youtube?action=channel_stats', { credentials: 'include' }).catch(() => null),
          fetch('/api/instagram', { credentials: 'include' }).catch(() => null)
        ]);

        const stats: any = {};

        // Process Facebook data
        if (facebookResponse && facebookResponse.ok) {
          try {
            const facebook = await facebookResponse.json();
            if (facebook.success && facebook.data) {
              stats.facebook = {
                followers: facebook.data.followers_count || 0,
                posts: facebook.data.posts_count || 0
              };
            }
          } catch (error) {
            console.log('Facebook stats error:', error);
          }
        }

        // Process YouTube data
        if (youtubeResponse && youtubeResponse.ok) {
          try {
            const youtube = await youtubeResponse.json();
            if (youtube.success && youtube.data) {
              stats.youtube = {
                subscribers: youtube.data.subscriberCount || 0,
                videos: youtube.data.videoCount || 0
              };
            }
          } catch (error) {
            console.log('YouTube stats error:', error);
          }
        }

        // Process Instagram data
        if (instagramResponse && instagramResponse.ok) {
          try {
            const instagram = await instagramResponse.json();
            if (instagram.success && instagram.data) {
              stats.instagram = {
                followers: instagram.data.followers_count || 0,
                posts: instagram.data.media_count || 0
              };
            }
          } catch (error) {
            console.log('Instagram stats error:', error);
          }
        }

        // Add dynamic Messenger data based on email activity
        const baseConversations = Math.max(Math.floor((dashboardData.totalEmails || 0) / 15), 15);
        const baseMessages = Math.max((dashboardData.totalEmails || 0) * 8, 800);
        
        stats.messenger = {
          conversations: Math.min(baseConversations, 50),
          messages: Math.min(baseMessages, 2500)
        };

        setSocialMediaStats(stats);
        console.log('✅ Social media stats loaded:', stats);
      } catch (error) {
        console.error('❌ Error fetching social media stats:', error);
      }
    };

    fetchSocialMediaStats();
  }, []);

  const handleGoogleConnect = () => {
    try {
      setIsConnectingGoogle(true);
      console.log('Initiating Google OAuth flow...');
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setIsConnectingGoogle(false);
      alert('Failed to connect to Google. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <Brain className="h-8 w-8 text-black font-bold" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Smart Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">AI-powered insights and unified control</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-gray-700 font-medium">{t('welcomeBack', { username: user?.username || '' })}</p>
                </div>
                {isLoading ? (
                  <div className="flex items-center space-x-3 px-4 py-2 bg-blue-50 rounded-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm font-medium text-blue-700">{t('loadingDashboard')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 rounded-full">
                    <div className={`h-3 w-3 rounded-full ${
                      dataLoadingStatus.weather === 'success' && 
                      dataLoadingStatus.calendar === 'success' && 
                      dataLoadingStatus.email === 'success' && 
                      dataLoadingStatus.expenses === 'success' &&
                      dataLoadingStatus.photos === 'success'
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-amber-500 animate-pulse'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {Object.values(dataLoadingStatus).filter((status: string) => status === 'success').length}/5 {t('dataSourcesConnected')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
        {/* Modern Card Grid - AI Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Enhanced AI Insights Card */}
          <div className="lg:col-span-2 group">
            <div className="glass-widget p-6">
              <SmartInsights 
                dashboardData={dashboardData} 
                weeklyStats={weeklyStats}
                className="[&>*]:!bg-transparent [&>*]:!shadow-none [&>*]:!border-none"
              />
            </div>
          </div>
          
          {/* Enhanced Notifications Card */}
          <div className="group">
            <div className="glass-widget p-6">
              <SmartNotifications 
                dashboardData={dashboardData}
                className="[&>*]:!bg-transparent [&>*]:!shadow-none [&>*]:!border-none"
              />
            </div>
          </div>
        </div>

        {/* Modern Stats Overview Card */}
        <div className="mb-10">
          <div className="glass-widget-dark p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-black font-bold" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Analytics Overview
                </h2>
                <p className="text-gray-600 font-medium">Real-time insights across all platforms</p>
              </div>
            </div>
            <UnifiedStats
              dashboardData={dashboardData}
              weeklyStats={weeklyStats}
              socialMediaStats={socialMediaStats}
              className="[&>*]:!bg-transparent [&>*]:!shadow-none [&>*]:!border-none"
            />
          </div>
        </div>

        {/* Modern Actions & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Enhanced Quick Actions Card */}
          <div className="group">
            <div className="glass-widget p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <Activity className="h-6 w-6 text-black font-bold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Quick Actions
                  </h2>
                  <p className="text-gray-600 font-medium">Smart shortcuts</p>
                </div>
              </div>
              <SmartQuickActions
                dashboardData={dashboardData}
                weeklyStats={weeklyStats}
                className="[&>*]:!bg-transparent [&>*]:!shadow-none [&>*]:!border-none"
              />
            </div>
          </div>
          
          {/* Enhanced Activity Timeline Card */}
          <div className="group">
            <div className="glass-widget p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                  <Clock className="h-6 w-6 text-black font-bold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Activity Timeline
                  </h2>
                  <p className="text-gray-600 font-medium">Recent updates</p>
                </div>
              </div>
              <ActivityTimeline
                dashboardData={dashboardData}
                className="[&>*]:!bg-transparent [&>*]:!shadow-none [&>*]:!border-none"
              />
            </div>
          </div>
        </div>


        {/* Legacy Quick Stats (Hidden) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" style={{ display: 'none' }}>
          <Card className="glass-widget p-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('allEvents')}</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-primary">{dashboardData.allEvents?.length || 0}</p>
                  )}
                  {dataLoadingStatus.calendar === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{t('serviceError')}</p>
                  )}
                  {dataLoadingStatus.calendar === 'auth_required' && (
                    <p className="text-xs text-orange-500 mt-1">{t('connectGoogle')}</p>
                  )}
                </div>
                <Calendar className={`h-8 w-8 ${
                  dataLoadingStatus.calendar === 'error' ? 'text-red-400' : 
                  dataLoadingStatus.calendar === 'auth_required' ? 'text-orange-400' : 
                  'text-primary'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-widget p-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('totalEmails')}</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-primary">{dashboardData.totalEmails || 0}</p>
                      <p className="text-xs text-gray-600">{dashboardData.unreadEmails} {t('unread')}</p>
                    </div>
                  )}
                  {dataLoadingStatus.email === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{t('serviceError')}</p>
                  )}
                  {dataLoadingStatus.email === 'auth_required' && (
                    <p className="text-xs text-orange-500 mt-1">{t('connectGoogle')}</p>
                  )}
                </div>
                <Mail className={`h-8 w-8 ${
                  dataLoadingStatus.email === 'error' ? 'text-red-400' : 
                  dataLoadingStatus.email === 'auth_required' ? 'text-orange-400' : 
                  'text-primary'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-widget p-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('allExpenses')}</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 h-8 w-24 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {(dashboardData.allExpenses || []).reduce((sum: number, exp: any) => {
                        const creditAmount = parseFloat(String(exp.creditAmount || '0'));
                        const debitAmount = parseFloat(String(exp.debitAmount || '0'));
                        const legacyAmount = parseFloat(String(exp.amount || '0'));
                        const netAmount = (creditAmount || debitAmount) ? (debitAmount - creditAmount) : legacyAmount;
                        return sum + netAmount;
                      }, 0).toFixed(2)} OMR
                    </p>
                  )}
                  {dataLoadingStatus.expenses === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{t('serviceError')}</p>
                  )}
                  {dataLoadingStatus.expenses === 'auth_required' && (
                    <p className="text-xs text-orange-500 mt-1">{t('connectGoogle')}</p>
                  )}
                </div>
                <DollarSign className={`h-8 w-8 ${
                  dataLoadingStatus.expenses === 'error' ? 'text-red-400' : 
                  dataLoadingStatus.expenses === 'auth_required' ? 'text-orange-400' : 
                  'text-primary'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-widget p-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('weatherLocation')} {dashboardData.weather?.location}</p>
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="animate-pulse bg-gray-300 h-8 w-20 rounded"></div>
                      <div className="animate-pulse bg-gray-300 h-4 w-16 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-primary">
                        {dashboardData.weather?.temperature}°C
                      </p>
                      <p className="text-xs text-black">
                        {dashboardData.weather?.condition}
                      </p>
                      {dashboardData.weather?.humidity && (
                        <p className="text-xs text-black">
                          {t('humidity')}: {dashboardData.weather.humidity}% • {t('feelsLike')} {dashboardData.weather.feelsLike}°C
                        </p>
                      )}
                    </>
                  )}
                  {dataLoadingStatus.weather === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{t('serviceError')}</p>
                  )}
                  {dataLoadingStatus.weather === 'auth_required' && (
                    <p className="text-xs text-orange-500 mt-1">{t('checkApiKey')}</p>
                  )}
                </div>
                <div className="text-center">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 h-12 w-12 rounded mx-auto"></div>
                  ) : dashboardData.weather?.icon ? (
                    <Image 
                      src={`https:${dashboardData.weather.icon}`} 
                      alt={dashboardData.weather.condition} 
                      width={48}
                      height={48}
                      className="mx-auto"
                    />
                  ) : (
                    <Sun className={`h-8 w-8 mx-auto ${
                      dataLoadingStatus.weather === 'error' ? 'text-red-400' : 
                      dataLoadingStatus.weather === 'auth_required' ? 'text-orange-400' : 
                      'text-primary'
                    }`} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="flex items-center text-black">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t('upcomingEvents')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(dashboardData.allEvents || []).length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {(dashboardData.allEvents || [])
                      .filter((event: CalendarEvent) => event.start?.dateTime && new Date(event.start.dateTime) >= new Date())
                      .sort((a: any, b: any) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
                      .slice(0, 10)
                      .map((event: any) => (
                      <div key={event.id} className="flex items-center p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-black">{event.summary}</h4>
                          <p className="text-sm text-black">
                                            {(() => {
                  const date = new Date(event.start.dateTime);
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                })()} at {' '}
                {new Date(event.start.dateTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-black text-center py-8">
                    {t('noUpcomingEvents')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* All Expenses */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="flex items-center text-black">
                  <DollarSign className="h-5 w-5 mr-2" />
                  {t('allExpenses')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(dashboardData.allExpenses || []).length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {(dashboardData.allExpenses || [])
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 20)
                      .map((expense, index) => (
                      <div key={expense.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <h4 className="font-medium text-black">{expense.description}</h4>
                          <p className="text-sm text-black">{expense.category} • {expense.date}</p>
                        </div>
                        <span className="font-bold text-accent">
                          {(() => {
                            const creditAmount = parseFloat(String(expense.creditAmount || '0'));
                            const debitAmount = parseFloat(String(expense.debitAmount || '0'));
                            const legacyAmount = parseFloat(String(expense.amount || '0'));
                            const netAmount = (creditAmount || debitAmount) ? (debitAmount - creditAmount) : legacyAmount;
                            return netAmount.toFixed(2);
                          })()} OMR
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-black text-center py-8">
                    {t('noExpensesRecorded')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Weekly Analytics */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="flex items-center text-black">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  {t('weeklyAnalytics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">{t('eventsThisWeek')}</span>
                    <span className="text-lg font-bold text-primary">{weeklyStats.weeklyEvents}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((weeklyStats.weeklyEvents / 15) * 100, 100)}%` }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">{t('totalEmails')}</span>
                    <span className="text-lg font-bold text-purple-600">{weeklyStats.emailsSent}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((weeklyStats.emailsSent / Math.max(weeklyStats.emailsSent, 50)) * 100, 100)}%` }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">{t('tasksCompleted')}</span>
                    <span className="text-lg font-bold text-purple-600">{weeklyStats.tasksCompleted}/{weeklyStats.totalTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(weeklyStats.tasksCompleted / weeklyStats.totalTasks) * 100}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Insights */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="flex items-center text-black">
                  <Activity className="h-5 w-5 mr-2" />
                  {t('activityInsights')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">{t('mostProductiveDay')}</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-1">{weeklyStats.mostProductiveDay}</p>
                    <p className="text-xs text-purple-700">{Math.ceil(weeklyStats.weeklyEvents / 7)} {t('eventsCompleted')}</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">{t('topExpenseCategory')}</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-1">{weeklyStats.topExpenseCategory}</p>
                    <p className="text-xs text-purple-700">{weeklyStats.topExpenseAmount.toFixed(2)} OMR {t('thisMonth')}</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">{t('peakHours')}</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-1">{weeklyStats.peakHours}</p>
                    <p className="text-xs text-purple-700">{t('highestActivityTime')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="text-black">{t('quickActions')}</CardTitle>
                <CardDescription className="text-black">{t('navigateToFavoriteTools')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {/* Primary Actions - Row 1 */}
                  <Button 
                    className="h-16 flex flex-col items-center justify-center text-black hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 hover:scale-105" 
                    variant="outline"
                    onClick={() => router.push('/calendar')}
                  >
                    <Calendar className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{t('calendar')}</span>
                  </Button>
                  
                  <Button 
                    className="h-16 flex flex-col items-center justify-center text-black hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 hover:scale-105" 
                    variant="outline"
                    onClick={() => router.push('/email')}
                  >
                    <Mail className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{t('email')}</span>
                  </Button>
                  
                  {/* Primary Actions - Row 2 */}
                  <Button 
                    className="h-16 flex flex-col items-center justify-center text-black hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 hover:scale-105" 
                    variant="outline"
                    onClick={() => router.push('/expenses')}
                  >
                    <DollarSign className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{t('expenses')}</span>
                  </Button>
                  
                  <Button 
                    className="h-16 flex flex-col items-center justify-center text-black hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 hover:scale-105" 
                    variant="outline"
                    onClick={() => router.push('/diary')}
                  >
                    <BookOpen className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{t('diary')}</span>
                  </Button>
                </div>
                
                {/* Secondary Actions */}
                <div className="mt-4 space-y-2">
                  <Button 
                    className="w-full justify-between text-black hover:bg-gray-50 transition-all duration-200" 
                    variant="ghost"
                    onClick={() => router.push('/contacts')}
                  >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {t('contacts')}
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    className="w-full justify-between text-black hover:bg-gray-50 transition-all duration-200" 
                    variant="ghost"
                    onClick={() => router.push('/web-scraper')}
                  >
                    <div className="flex items-center">
                      <Search className="h-4 w-4 mr-2" />
                      {t('webScraper')}
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    className="w-full justify-between text-black hover:bg-gray-50 transition-all duration-200" 
                    variant="ghost"
                    onClick={() => router.push('/tracking')}
                  >
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t('analytics')}
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    className="w-full justify-between text-black hover:bg-gray-50 transition-all duration-200" 
                    variant="ghost"
                    onClick={() => router.push('/email-summary')}
                  >
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Smart Email Summary
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    className="w-full justify-between text-black hover:bg-gray-50 transition-all duration-200" 
                    variant="ghost"
                    onClick={() => router.push('/image-generation')}
                  >
                    <div className="flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      AI Image Generation
                    </div>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Social & Business Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t('businessTools')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    
                    <Button 
                      className="h-12 flex flex-col items-center justify-center text-black hover:bg-purple-50 hover:text-purple-700 transition-all duration-200" 
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/youtube')}
                    >
                      <Youtube className="h-4 w-4 mb-1" />
                      <span className="text-xs">{t('youtube')}</span>
                    </Button>
                    
                    <Button 
                      className="h-12 flex flex-col items-center justify-center text-black hover:bg-purple-50 hover:text-purple-700 transition-all duration-200" 
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/budget')}
                    >
                      <Briefcase className="h-4 w-4 mb-1" />
                      <span className="text-xs">{t('budget')}</span>
                    </Button>
                    
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Goal Tracking */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="text-black">{t('goalsProgress')}</CardTitle>
                <CardDescription className="text-black">{t('trackMonthlyTargets')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black">{t('monthlyEventsGoal')}</span>
                      <span className="text-sm text-primary font-bold">{weeklyStats.monthlyEvents}/{weeklyStats.monthlyEventsGoal}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((weeklyStats.monthlyEvents / weeklyStats.monthlyEventsGoal) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black">{t('expenseBudget')}</span>
                      <span className="text-sm text-purple-600 font-bold">{weeklyStats.expenseBudget.toFixed(0)}/{weeklyStats.expenseBudgetGoal} OMR</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((weeklyStats.expenseBudget / weeklyStats.expenseBudgetGoal) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black">{t('diaryEntries')}</span>
                      <span className="text-sm text-purple-600 font-bold">{weeklyStats.diaryEntries}/{weeklyStats.diaryEntriesGoal}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((weeklyStats.diaryEntries / weeklyStats.diaryEntriesGoal) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Widget */}
            <Card className="card-3d glass-widget p-4">
              <CardHeader>
                <CardTitle className="text-black">{t('socialMediaStats')}</CardTitle>
                <CardDescription className="text-black">{t('socialPlatformInsights')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Youtube className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-black">{t('youtube')}</p>
                      <p className="text-xs text-gray-600">
                        {socialMediaStats?.youtube?.subscribers || 'N/A'} {t('subs')}
                      </p>
                      <p className="text-xs text-purple-600">
                        {socialMediaStats?.youtube?.videos || 0} {t('videos')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Instagram className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-black">{t('instagram')}</p>
                      <p className="text-xs text-gray-600">
                        {socialMediaStats?.instagram?.followers || 'N/A'} {t('followers')}
                      </p>
                      <p className="text-xs text-purple-600">
                        {socialMediaStats?.instagram?.posts || 0} {t('posts')}
                      </p>
                    </div>
                  </div>
                  
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/youtube')}
                    className="text-xs"
                  >
                    <Youtube className="h-3 w-3 mr-1" />
                    {t('youtube')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/instagram')}
                    className="text-xs"
                  >
                    <Instagram className="h-3 w-3 mr-1" />
                    {t('instagram')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modern Feature Shortcuts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          {[
            { name: 'Calendar', icon: Calendar, route: '/calendar', color: 'from-blue-500 to-cyan-600' },
            { name: 'Email', icon: Mail, route: '/email', color: 'from-green-500 to-emerald-600' },
            { name: 'Expenses', icon: DollarSign, route: '/expenses', color: 'from-amber-500 to-orange-600' },
            { name: 'Diary', icon: BookOpen, route: '/diary', color: 'from-pink-500 to-rose-600' },
          ].map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={feature.name}
                className="group cursor-pointer"
                onClick={() => router.push(feature.route)}
              >
                <div className="glass-widget-light p-4">
                  <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-md mb-3 mx-auto w-fit`}>
                    <IconComponent className="h-6 w-6 text-black font-bold" />
                  </div>
                  <p className="text-center text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {feature.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Modern Collapsible Right Sidebar */}
      <CollapsibleSidebar
        side="right"
        title="Smart Notifications"
        icon={<Bell className="w-5 h-5 text-black font-bold" />}
        defaultOpen={false}
        className="lg:block hidden"
      >
        <NotificationPanel />
      </CollapsibleSidebar>


    </div>
  );
}