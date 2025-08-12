'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { Youtube, Play, Eye, ThumbsUp, MessageSquare, Upload, BarChart3, ExternalLink, Settings, TrendingUp } from 'lucide-react';

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
}

export default function YouTubePage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [channelStats, setChannelStats] = useState({
    subscribers: 0,
    totalViews: 0,
    totalVideos: 0,
    avgViewDuration: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error' | 'config_missing'>('unknown');

  // Function to watch video on YouTube
  const watchVideo = (videoId: string) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    fetchYouTubeData();
  }, []);

  const fetchYouTubeData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/youtube?action=channel_stats');
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        
        if (data.data) {
          setChannelStats({
            subscribers: data.data.subscriberCount || 0,
            totalViews: data.data.viewCount || 0,
            totalVideos: data.data.videoCount || 0,
            avgViewDuration: 4.2 // This would need to be calculated from analytics
          });
        }
        
        // Fetch recent videos
        const videosResponse = await fetch('/api/youtube?action=videos');
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (videosData.success && videosData.data) {
            setVideos(videosData.data.map((video: any) => ({
              id: video.videoId,
              title: video.title,
              description: video.description,
              thumbnail: video.thumbnails?.maxres?.url || 
                        video.thumbnails?.standard?.url || 
                        video.thumbnails?.high?.url || 
                        video.thumbnails?.medium?.url || 
                        video.thumbnails?.default?.url || '',
              published_at: video.publishedAt,
              view_count: 0, // Would need additional API call for stats
              like_count: 0,
              comment_count: 0,
              duration: '0:00'
            })));
          }
        }
      } else {
        setIsConnected(false);
        setError(data.message);
        
        if (data.message?.includes('not configured') || data.message?.includes('API key')) {
          setConnectionStatus('config_missing');
        } else {
          setConnectionStatus('error');
        }
        
        // Use mock data as fallback
        setChannelStats({
          subscribers: 25400,
          totalViews: 1250000,
          totalVideos: 89,
          avgViewDuration: 4.2
        });
        
        setVideos([]);
      }
    } catch (error: any) {
      console.error('Error fetching YouTube data:', error);
      setIsConnected(false);
      setError(error.message || 'Failed to connect to YouTube');
      setConnectionStatus('error');
      
      // No fallback - service must be configured
      setChannelStats({
        subscribers: 0,
        totalViews: 0,
        totalVideos: 0,
        avgViewDuration: 0
      });
      
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const connectYouTube = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/youtube?action=connect');
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        await fetchYouTubeData();
      } else {
        alert(t('settingsError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Error connecting to YouTube:', error);
      alert(t('settingsError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
              <Youtube className="h-8 w-8 text-black font-bold" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                YouTube Analytics
              </h1>
              <p className="text-gray-600 font-medium mt-1">Track your channel performance and manage content</p>
            </div>
          </div>
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center">
              <Youtube className="h-8 w-8 mr-3 text-red-600" />
              {t('youtubeTitle')}
            </h1>
            <p className="text-black mt-2">{t('profileDescription')}</p>
          </div>
          
          <Button onClick={connectYouTube} disabled={isLoading}>
            <Youtube className="h-4 w-4 mr-2" />
            {isLoading ? t('loading') : isConnected ? t('refresh') : t('youtubeTitle')}
          </Button>
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
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <strong>{t('settingsError')}:</strong> {error}
                </p>
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
                  <strong>{t('connected')}:</strong> {t('youtubeTitle')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Channel Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('contacts')}</p>
                  <p className="text-2xl font-bold text-primary">{channelStats.subscribers.toLocaleString()}</p>
                </div>
                <Play className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('overview')}</p>
                  <p className="text-2xl font-bold text-primary">{channelStats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('events')}</p>
                  <p className="text-2xl font-bold text-primary">{channelStats.totalVideos}</p>
                </div>
                <Upload className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="palette-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{t('analytics')}</p>
                  <p className="text-2xl font-bold text-primary">{channelStats.avgViewDuration}m</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Videos - Modern Grid Layout */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Recent Videos</h2>
                <p className="text-gray-600">Your latest YouTube content</p>
              </div>
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