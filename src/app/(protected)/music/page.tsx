'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModernCard } from '@/components/ui/ModernCard';
import { Button } from '@/components/ui/button';
import { MusicPlayer } from '@/components/MusicPlayer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  HeartOff,
  Search,
  Plus,
  MoreHorizontal,
  Music,
  Shuffle,
  Repeat,
  ExternalLink,
  Music2,
  Video,
  Download,
  List,
  Grid,
  Filter,
  Star,
  Clock,
  User,
  Album,
  Headphones,
  Radio,
  TrendingUp,
  Settings,
  Share2
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';

interface Song {
  id: string;
  title: string;
  artist: string;
  artists: string[];
  album: string;
  duration: number;
  imageUrl: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  previewUrl?: string;
  isLiked: boolean;
  genre: string;
  year: number;
  platform: 'spotify' | 'youtube' | 'local';
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  imageUrl: string;
  isPublic: boolean;
  createdAt: Date;
}

export default function MusicPage() {
  const { language, isRTL } = useSettings();
  const { t } = useTranslation(language);
  
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'library' | 'playlists' | 'discover'>('library');
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume] = useState(75);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [userLibrary, setUserLibrary] = useState<Song[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sample data
  const sampleSongs: Song[] = [
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      artists: ['Queen'],
      album: 'A Night at the Opera',
      duration: 355000,
      imageUrl: '/api/placeholder/300/300',
      spotifyUrl: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J',
      youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
      isLiked: true,
      genre: 'Rock',
      year: 1975,
      platform: 'spotify'
    },
    {
      id: '2',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      artists: ['The Weeknd'],
      album: 'After Hours',
      duration: 200000,
      imageUrl: '/api/placeholder/300/300',
      spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUKNGf0rE8vstt',
      youtubeUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
      isLiked: false,
      genre: 'Pop',
      year: 2019,
      platform: 'spotify'
    },
    {
      id: '3',
      title: 'Hotel California',
      artist: 'Eagles',
      artists: ['Eagles'],
      album: 'Hotel California',
      duration: 390000,
      imageUrl: '/api/placeholder/300/300',
      spotifyUrl: 'https://open.spotify.com/track/40riOy7x9W7GXjyGp4pjAv',
      youtubeUrl: 'https://www.youtube.com/watch?v=09839DpTctU',
      isLiked: true,
      genre: 'Rock',
      year: 1976,
      platform: 'spotify'
    }
  ];

  const samplePlaylists: Playlist[] = [
    {
      id: '1',
      name: 'My Favorites',
      description: 'All-time favorite songs',
      songs: sampleSongs.filter(s => s.isLiked),
      imageUrl: '/api/placeholder/300/300',
      isPublic: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Rock Classics',
      description: 'Classic rock hits from the golden era',
      songs: sampleSongs.filter(s => s.genre === 'Rock'),
      imageUrl: '/api/placeholder/300/300',
      isPublic: true,
      createdAt: new Date('2024-02-01')
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user library
      const libraryResponse = await fetch('/api/music/library?action=get_all');
      if (libraryResponse.ok) {
        const libraryData = await libraryResponse.json();
        setUserLibrary(libraryData.data.songs || []);
        setAllSongs(libraryData.data.songs || []);
      }
      
      // Load user playlists
      const playlistsResponse = await fetch('/api/music/playlists');
      if (playlistsResponse.ok) {
        const playlistsData = await playlistsResponse.json();
        setPlaylists(playlistsData.data.playlists || []);
      }
      
      // If no songs in library, show sample songs
      if (allSongs.length === 0) {
        setAllSongs(sampleSongs);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to sample data
      setAllSongs(sampleSongs);
      setPlaylists(samplePlaylists);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedSongs = searchQuery && searchResults.length > 0 ? searchResults : allSongs;
  const filteredSongs = displayedSongs.filter(song =>
    !searchQuery || 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debounce search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchMusic(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const togglePlayPause = useCallback((song?: Song) => {
    if (song && song.id !== currentSong?.id) {
      setCurrentSong(song);
      setCurrentPlaylist(searchResults.length > 0 ? searchResults : allSongs);
      setIsPlaying(true);
      
      // Increment play count in library
      incrementPlayCount(song.id);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [currentSong, searchResults, allSongs]);

  const toggleLike = useCallback(async (songId: string) => {
    try {
      const response = await fetch('/api/music/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_like',
          songId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedSong = data.data.song;
        
        // Update local state
        setAllSongs(prev => prev.map(song =>
          song.id === songId ? { ...song, isLiked: updatedSong.isLiked } : song
        ));
        setUserLibrary(prev => prev.map(song =>
          song.id === songId ? { ...song, isLiked: updatedSong.isLiked } : song
        ));
        setSearchResults(prev => prev.map(song =>
          song.id === songId ? { ...song, isLiked: updatedSong.isLiked } : song
        ));
        
        if (currentSong?.id === songId) {
          setCurrentSong(prev => prev ? { ...prev, isLiked: updatedSong.isLiked } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setError('Failed to update like status');
    }
  }, [currentSong]);

  const openExternalLink = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const searchMusic = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query,
          platform: 'both',
          limit: 20
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data.tracks || []);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error searching music:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToLibrary = useCallback(async (song: Song) => {
    try {
      const response = await fetch('/api/music/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          song
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data.isNew) {
          setUserLibrary(prev => [data.data.song, ...prev]);
          setAllSongs(prev => [data.data.song, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error adding to library:', error);
      setError('Failed to add song to library');
    }
  }, []);

  const incrementPlayCount = useCallback(async (songId: string) => {
    try {
      await fetch('/api/music/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'increment_play',
          songId
        })
      });
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }, []);

  const playNext = useCallback(() => {
    if (!currentPlaylist.length || !currentSong) return;
    
    const currentIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    let nextIndex;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      nextIndex = (currentIndex + 1) % currentPlaylist.length;
    }
    
    const nextSong = currentPlaylist[nextIndex];
    setCurrentSong(nextSong);
    incrementPlayCount(nextSong.id);
  }, [currentPlaylist, currentSong, isShuffled]);

  const playPrevious = useCallback(() => {
    if (!currentPlaylist.length || !currentSong) return;
    
    const currentIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    let prevIndex;
    
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      prevIndex = currentIndex > 0 ? currentIndex - 1 : currentPlaylist.length - 1;
    }
    
    const prevSong = currentPlaylist[prevIndex];
    setCurrentSong(prevSong);
    incrementPlayCount(prevSong.id);
  }, [currentPlaylist, currentSong, isShuffled]);

  const SongCard = ({ song }: { song: Song }) => (
    <ModernCard className="group hover:shadow-lg transition-all duration-300" gradient="none" blur="lg">
      <div className="p-4">
        <div className="relative mb-3">
          <div className="w-full aspect-square bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-3">
            <Music className="h-8 w-8 text-white" />
          </div>
          <Button
            onClick={() => togglePlayPause(song)}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
          >
            {currentSong?.id === song.id && isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white" />
            )}
          </Button>
        </div>
        
        <h3 className="font-semibold text-gray-900 truncate mb-1">{song.title}</h3>
        <p className="text-sm text-gray-600 truncate mb-1">{song.artist}</p>
        <p className="text-xs text-gray-500 truncate mb-3">{song.album} • {song.year}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{Math.floor(song.duration / 60000)}:{Math.floor((song.duration % 60000) / 1000).toString().padStart(2, '0')}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLike(song.id)}
              className={song.isLiked ? 'text-red-500' : 'text-gray-400'}
            >
              <Heart className="h-4 w-4" fill={song.isLiked ? 'currentColor' : 'none'} />
            </Button>
            
            {song.spotifyUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openExternalLink(song.spotifyUrl!)}
                className="text-green-600"
              >
                <Music2 className="h-4 w-4" />
              </Button>
            )}
            
            {song.youtubeUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openExternalLink(song.youtubeUrl!)}
                className="text-red-600"
              >
                <Video className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </ModernCard>
  );

  const PlaylistCard = ({ playlist }: { playlist: Playlist }) => (
    <ModernCard className="group hover:shadow-lg transition-all duration-300" gradient="none" blur="lg">
      <div className="p-4">
        <div className="relative mb-3">
          <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
            <List className="h-8 w-8 text-white" />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
            <Button
              onClick={() => playlist.songs.length > 0 && togglePlayPause(playlist.songs[0])}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12 p-0"
            >
              <Play className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-900 truncate mb-1">{playlist.name}</h3>
        <p className="text-sm text-gray-600 truncate mb-2">{playlist.description}</p>
        <p className="text-xs text-gray-500">{playlist.songs.length} songs</p>
      </div>
    </ModernCard>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pb-32">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <ModernCard gradient="blue" blur="xl" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl">
                  <Headphones className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    Music & Playlist Library
                  </h1>
                  <p className="text-gray-600 font-medium mt-2 text-lg">
                    Search, discover, and organize your music
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-500">{allSongs.length} songs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-gray-500">{playlists.length} playlists</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Music2 className="h-4 w-4 mr-2" />
                  Connect Spotify
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Video className="h-4 w-4 mr-2" />
                  Connect YouTube
                </Button>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Controls Bar */}
        <ModernCard gradient="none" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'library', label: 'My Library', icon: Music },
              { id: 'playlists', label: 'Playlists', icon: List },
              { id: 'discover', label: 'Discover', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </ModernCard>

        {/* Error Message */}
        {error && (
          <ModernCard gradient="none" blur="lg" className="p-4 bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </ModernCard>
        )}

        {/* Loading State */}
        {isLoading && (
          <ModernCard gradient="none" blur="lg" className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-500">Please wait while we fetch your music</p>
          </ModernCard>
        )}

        {/* Content */}
        {!isLoading && activeTab === 'library' && (
          <div>
            {searchQuery && searchResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Search Results ({searchResults.length})
                </h3>
                <div className="grid gap-4 grid-cols-1">
                  {searchResults.map((song) => (
                    <div key={`${song.platform}-${song.id}`} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{song.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{song.artist}</p>
                        <p className="text-xs text-gray-500 truncate">{song.album} • {song.platform}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToLibrary(song)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          onClick={() => togglePlayPause(song)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {currentSong?.id === song.id && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={`grid gap-6 ${
              currentView === 'grid' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                : 'grid-cols-1'
            }`}>
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'playlists' && !isLoading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
            
            {/* Create New Playlist */}
            <ModernCard className="group hover:shadow-lg transition-all duration-300 border-2 border-dashed border-gray-300" gradient="none" blur="lg">
              <div className="p-8 text-center">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-600 mb-2">Create New Playlist</h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Playlist
                </Button>
              </div>
            </ModernCard>
          </div>
        )}

        {activeTab === 'discover' && !isLoading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <ModernCard gradient="orange" blur="lg" className="p-6">
              <div className="flex items-center gap-4">
                <Radio className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Trending Now</h3>
                  <p className="text-sm text-gray-600">Popular songs this week</p>
                </div>
              </div>
            </ModernCard>
            
            <ModernCard gradient="green" blur="lg" className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Recommended</h3>
                  <p className="text-sm text-gray-600">Based on your taste</p>
                </div>
              </div>
            </ModernCard>
            
            <ModernCard gradient="purple" blur="lg" className="p-6">
              <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Top Charts</h3>
                  <p className="text-sm text-gray-600">Most played globally</p>
                </div>
              </div>
            </ModernCard>
          </div>
        )}

        {filteredSongs.length === 0 && searchQuery && !isLoading && (
          <ModernCard gradient="none" blur="lg" className="p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No songs found</h3>
            <p className="text-gray-500">Try searching with different keywords</p>
          </ModernCard>
        )}
      </div>

      {/* Music Player */}
      {currentSong && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-80 z-40">
          <MusicPlayer
            currentSong={currentSong}
            playlist={currentPlaylist}
            isPlaying={isPlaying}
            volume={volume}
            isShuffled={isShuffled}
            repeatMode={repeatMode}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onNext={playNext}
            onPrevious={playPrevious}
            onVolumeChange={setVolume}
            onToggleShuffle={() => setIsShuffled(!isShuffled)}
            onToggleRepeat={() => setRepeatMode(
              repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off'
            )}
            onToggleLike={toggleLike}
            onAddToPlaylist={(song) => console.log('Add to playlist:', song)}
          />
        </div>
      )}
    </div>
  );
}