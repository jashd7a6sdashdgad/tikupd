'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { Youtube, Play, Eye, ThumbsUp, MessageSquare, Upload, BarChart3, ExternalLink, Settings, TrendingUp, Video, Users, Clock, Calendar } from 'lucide-react';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: string;
  url: string;
}

interface YouTubeAuth {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
}

interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  customUrl?: string;
}

export default function YouTubePage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [channelStats, setChannelStats] = useState({ subscribers: 0, totalVideos: 0 });

  // Check authentication status on load (but don't auto-redirect)
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/youtube/auth/status');
      const data = await response.json();
      
      if (data.authenticated) {
        setIsConnected(true);
        await loadYouTubeData();
      } else {
        setIsConnected(false);
        const authResponse = await fetch('/api/youtube/auth/url');
        const authData = await authResponse.json();
        if (authData.url) {
          setAuthUrl(authData.url);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Failed to check authentication status');
    }
  };

  const loadYouTubeData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load channel info
      const channelResponse = await fetch('/api/youtube/channel');
      const channelData = await channelResponse.json();
      
      if (channelData.success) {
        setChannelData(channelData.data);
        setChannelStats({
          subscribers: channelData.data.subscriberCount || 0,
          totalVideos: channelData.data.videoCount || 0
        });
      }
      
      // Load recent videos
      const videosResponse = await fetch('/api/youtube/videos');
      const videosData = await videosResponse.json();
      
      if (videosData.success) {
        setVideos(videosData.data.map((video: any) => ({
          id: video.id.videoId || video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
          published_at: video.snippet.publishedAt,
          view_count: video.statistics?.viewCount || 0,
          like_count: video.statistics?.likeCount || 0,
          comment_count: video.statistics?.commentCount || 0,
          duration: video.contentDetails?.duration || 'PT0S',
          url: `https://www.youtube.com/watch?v=${video.id.videoId || video.id}`
        })));
      }
      
      // Load recent activity/analytics
      const activityResponse = await fetch('/api/youtube/analytics');
      const activityData = await activityResponse.json();
      
      if (activityData.success) {
        setRecentActivity(activityData.data || []);
      }
      
    } catch (error: any) {
      console.error('Error loading YouTube data:', error);
      setError(error.message || 'Failed to load YouTube data');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateYouTubeAuth = () => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'width=600,height=600');
      
      // Listen for auth completion
      const checkAuth = setInterval(() => {
        checkAuthStatus().then(() => {
          if (isConnected) {
            clearInterval(checkAuth);
          }
        });
      }, 2000);
      
      // Clean up after 2 minutes
      setTimeout(() => {
        clearInterval(checkAuth);
      }, 120000);
    }
  };
  
  const disconnectYouTube = async () => {
    try {
      await fetch('/api/youtube/auth/revoke', { method: 'POST' });
      setIsConnected(false);
      setChannelData(null);
      setVideos([]);
      setRecentActivity([]);
      await checkAuthStatus();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };
  
  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
  };
  
  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const watchVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl shadow-lg">
                <Youtube className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                  YouTube Studio
                </h1>
                <p className="text-gray-600 font-medium mt-1">
                  {isConnected && channelData 
                    ? `Managing ${channelData.title}` 
                    : 'Connect your YouTube channel via OAuth2'
                  }
                </p>
              </div>
            </div>
            
            {/* Auth Button */}
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Connected
                  </div>
                  <Button 
                    onClick={() => loadYouTubeData()} 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                  <Button 
                    onClick={disconnectYouTube} 
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={initiateYouTubeAuth} 
                  disabled={!authUrl}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg font-semibold"
                >
                  <Youtube className="h-5 w-5 mr-2" />
                  Connect with OAuth2
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isConnected && !error && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Youtube className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Ready to Connect:</strong> Authenticate with your YouTube account using OAuth2 to access your channel data, videos, and analytics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Channel Stats */}
        {isConnected && channelData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Subscribers</p>
                  <p className="text-3xl font-bold text-red-600">{formatNumber(channelData.subscriberCount)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total followers</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Views</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(channelData.viewCount)}</p>
                  <p className="text-xs text-gray-500 mt-1">All-time views</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Videos</p>
                  <p className="text-3xl font-bold text-green-600">{channelData.videoCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Published content</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                  <Video className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Engagement</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {channelData.viewCount > 0 ? 
                      Math.round((channelData.subscriberCount / channelData.viewCount) * 10000) / 100 : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Subscriber rate</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Videos - Modern Grid Layout */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Recent Videos</h2>
                    <p className="text-gray-600">
                      {isConnected ? 'Your latest YouTube content' : 'Connect to view your videos'}
                    </p>
                  </div>
                </div>
                
                {isConnected && videos.length > 0 && (
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Youtube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg mb-2">No videos found</p>
                <p className="text-gray-500">Connect your YouTube account to see your videos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-gray-200 overflow-hidden">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <Play className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <button
                          onClick={() => watchVideo(video.id)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transform scale-100 hover:scale-110 transition-all duration-200 shadow-2xl"
                        >
                          <Play className="h-6 w-6 ml-1" fill="white" />
                        </button>
                      </div>
                      
                      {/* Video Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
                        {video.duration || '0:00'}
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {video.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {video.description}
                      </p>

                      {/* Video Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="bg-gray-100 px-2 py-1 rounded-full">
                          {(() => {
                            const date = new Date(video.published_at);
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                        
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.view_count.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {video.like_count.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {video.comment_count}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => watchVideo(video.id)}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Watch on YouTube
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Quick Actions - Modernized */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
                  <p className="text-gray-600 text-sm">YouTube management tools</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl">
                  <Upload className="h-4 w-4" />
                  Upload Video
                </button>
                
                <button className="w-full bg-white/70 hover:bg-white/90 text-gray-800 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  View Analytics
                </button>
                
                <button className="w-full bg-white/70 hover:bg-white/90 text-gray-800 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  Manage Comments
                </button>
                
                <button className="w-full bg-white/70 hover:bg-white/90 text-gray-800 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                  <Play className="h-4 w-4 text-red-600" />
                  Create Content
                </button>
                
                <button className="w-full bg-white/70 hover:bg-white/90 text-gray-800 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                  <Eye className="h-4 w-4 text-orange-600" />
                  Channel Settings
                </button>
              </div>
            </div>

            {/* Channel Stats Card */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">Channel Growth</h3>
                  <p className="text-red-600 text-sm">This month's performance</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-2xl font-bold text-red-700">{channelStats.subscribers.toLocaleString()}</p>
                  <p className="text-xs text-red-600">Subscribers</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-2xl font-bold text-orange-700">{channelStats.totalVideos}</p>
                  <p className="text-xs text-orange-600">Videos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}