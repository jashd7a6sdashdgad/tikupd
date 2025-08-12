'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { Facebook, Users, MessageCircle, TrendingUp, Calendar } from 'lucide-react';

interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  likes: number;
  comments: number;
}

export default function FacebookPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [insights, setInsights] = useState({
    followers: 0,
    engagement: 0,
    reach: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error' | 'config_missing'>('unknown');

  useEffect(() => {
    // Reset connection status on mount
    setConnectionStatus('unknown');
    setIsConnected(false);
    setError(null);
    
    // Debug environment variable
    console.log('🔍 Checking Facebook environment variable...');
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    
    fetchFacebookData();
  }, []);

  const fetchFacebookData = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Fetching Facebook data...');
    
    try {
      // For user accounts, we need to use different endpoints
      const response = await fetch('/api/facebook?action=test_token');
      
      console.log('🔍 Facebook API response status:', response.status);
      console.log('🔍 Facebook API response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('🔍 Facebook API response data:', data);
      
      if (data.success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        
        // For user accounts, we'll show basic user info instead of posts
        if (data.data) {
          setPosts([
            {
              id: 'user-info',
              message: `Connected as: ${data.data.name || 'Unknown User'}`,
              created_time: new Date().toISOString(),
              likes: 0,
              comments: 0
            }
          ]);
          
          // Set some basic user info
          setInsights({
            followers: 0, // User accounts don't have followers like pages
            engagement: 0,
            reach: 0
          });
        } else {
          console.log('🔍 No data in Facebook response:', data);
        }
        
                // For user accounts, set basic insights
        setInsights({
          followers: 0, // User accounts don't have followers like pages
          engagement: 0,
          reach: 0
        });
      } else {
        setIsConnected(false);
        setError(data.message);
        
        if (data.error === 'FACEBOOK_CONFIG_ERROR') {
          setConnectionStatus('config_missing');
        } else if (data.error === 'FACEBOOK_AUTH_ERROR' || data.error === 'FACEBOOK_TOKEN_EXPIRED' || data.error === 'FACEBOOK_TOKEN_INVALID') {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('error');
        }
        
        // Show placeholder data while troubleshooting
        setInsights({
          followers: 0,
          engagement: 0,
          reach: 0
        });
        
        setPosts([
          {
            id: 'placeholder',
            message: 'Facebook connection required to view posts',
            created_time: new Date().toISOString(),
            likes: 0,
            comments: 0
          }
        ]);
      }
    } catch (error: any) {
      console.error('Error fetching Facebook data:', error);
      setIsConnected(false);
      setError(error.message || 'Failed to connect to Facebook');
      setConnectionStatus('error');
      
      // Show placeholder data while troubleshooting
      setInsights({
        followers: 0,
        engagement: 0,
        reach: 0
      });
      
      setPosts([
        {
          id: 'placeholder',
          message: 'Facebook connection required to view posts',
          created_time: new Date().toISOString(),
          likes: 0,
          comments: 0
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const testFacebookToken = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing Facebook token...');
      
      // Test the token directly with Facebook Graph API
      const response = await fetch('/api/facebook?action=test_token');
      const data = await response.json();
      
      console.log('🔍 Facebook token test response:', data);
      
      if (data.success) {
        console.log('✅ Facebook token is valid');
        setConnectionStatus('connected');
        setError(null);
      } else {
        console.log('❌ Facebook token test failed:', data.error);
        setConnectionStatus('error');
        setError(data.error || 'Token validation failed');
      }
    } catch (error: any) {
      console.error('❌ Facebook token test error:', error);
      setConnectionStatus('error');
      setError(`Token test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const debugFacebookAPI = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔧 Running comprehensive Facebook API debug...');
      
      const response = await fetch('/api/facebook-debug');
      const data = await response.json();
      
      console.log('🔧 Facebook API debug results:', data);
      
      if (data.success) {
        console.log('✅ Facebook API debug completed successfully');
        setConnectionStatus('connected');
        setError(`✅ Debug Complete: ${data.summary}. Check console for details.`);
      } else {
        console.log('❌ Facebook API debug found issues:', data);
        setConnectionStatus('error');
        setError(`❌ Debug Failed: ${data.error || 'Unknown error'}. Check console for details.`);
      }
    } catch (error: any) {
      console.error('❌ Facebook API debug error:', error);
      setConnectionStatus('error');
      setError(`Debug failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const connectFacebook = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First test the connection
      const response = await fetch('/api/facebook?action=connect');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Facebook connect response:', data);
      
      if (data.success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        await fetchFacebookData();
      } else {
        setIsConnected(false);
        setError(data.message);
        
        // Set connection status based on error type
        if (data.error === 'FACEBOOK_CONFIG_ERROR') {
          setConnectionStatus('config_missing');
        } else {
          setConnectionStatus('error');
        }
        
        console.error('Facebook connection failed:', data);
      }
    } catch (error: any) {
      console.error('Error connecting to Facebook:', error);
      setIsConnected(false);
      setError(error.message || 'Failed to connect to Facebook');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/facebook?action=test_token');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Token validation response:', data);
      
      if (data.success && data.data) {
        setError(`✅ Token is valid! User: ${data.data?.name || 'Unknown'}`);
        setConnectionStatus('connected');
      } else {
        const errorMessage = data.message || data.error || 'Unknown error';
        const helpText = data.help ? `\n\nHelp: ${data.help}` : '';
        setError(`❌ Token validation failed: ${errorMessage}${helpText}`);
        setConnectionStatus('error');
      }
    } catch (error: any) {
      console.error('Error validating token:', error);
      setError(`❌ Token validation error: ${error.message}`);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <Facebook className="h-8 w-8 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('facebookTitle')}
                </h1>
                <p className="text-gray-600 font-medium mt-1">{t('profileDescription')}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={connectFacebook} disabled={isLoading}>
                <Facebook className="h-4 w-4 mr-2" />
                {isLoading ? t('loading') : isConnected ? t('refresh') : t('facebookTitle')}
              </Button>
              <Button onClick={validateToken} disabled={isLoading} variant="outline">
                🔍 Validate Token
              </Button>
              <Button onClick={testFacebookToken} disabled={isLoading} variant="outline">
                🚀 Test Token
              </Button>
              <Button onClick={debugFacebookAPI} disabled={isLoading} variant="outline">
                🔧 Debug API
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Status Banner */}
        {connectionStatus === 'config_missing' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>{t('settings')}:</strong> {t('profileDescription')}
                </p>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'error' && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-800">
                  <strong>{t('settingsError')}:</strong> {error}
                </p>
                {error.includes('Token validation failed') && (
                  <div className="mt-2 text-xs text-red-700">
                    <p><strong>Troubleshooting:</strong></p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Check if your Facebook Page Access Token is correct</li>
                      <li>Verify your Facebook Page ID is valid</li>
                      <li>Ensure the token has not expired (Facebook tokens typically last 60 days)</li>
                      <li>Check token permissions: pages_read_engagement, pages_manage_posts</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  <strong>Connected:</strong> Facebook
                </p>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'unknown' && !isLoading && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-800">
                  <strong>Status:</strong> Not Connected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('contacts')}</p>
                  <p className="text-2xl font-bold text-primary">{insights.followers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('analytics')}</p>
                  <p className="text-2xl font-bold text-primary">{insights.engagement}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('overview')}</p>
                  <p className="text-2xl font-bold text-primary">{insights.reach.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-black">
                <MessageCircle className="h-5 w-5 mr-2" />
                {t('events')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="p-4 bg-muted rounded-lg">
                    <p className="text-black mb-2">{post.message}</p>
                    <div className="flex items-center justify-between text-sm text-black">
                      <span>{(() => {
                  const date = new Date(post.created_time);
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                })()}</span>
                      <div className="flex space-x-4">
                        <span>👍 {post.likes}</span>
                        <span>💬 {post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">{t('quickActions')}</CardTitle>
              <CardDescription className="text-black">{t('profileDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('create')}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {t('events')}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('analyticsTitle')}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                {t('settings')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}