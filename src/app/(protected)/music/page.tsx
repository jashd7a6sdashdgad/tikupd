'use client';

import React, { useState, useEffect } from 'react';
import { ModernCard } from '@/components/ui/ModernCard';
import { Button } from '@/components/ui/button';
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
  album: string;
  duration: string;
  imageUrl: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  isLiked: boolean;
  genre: string;
  year: number;
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

  // Sample data
  const sampleSongs: Song[] = [
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration: '5:55',
      imageUrl: '/api/placeholder/300/300',
      spotifyUrl: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J',
      youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
      isLiked: true,
      genre: 'Rock',
      year: 1975
    },
    {
      id: '2',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: '3:20',
      imageUrl: '/api/placeholder/300/300',
      spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUKNGf0rE8vstt',
      youtubeUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
      isLiked: false,
      genre: 'Pop',
      year: 2019
    },
    {
      id: '3',
      title: 'Hotel California',
      artist: 'Eagles',
      album: 'Hotel California',
      duration: '6:30',
      imageUrl: '/api/placeholder/300/300',
      spotifyUrl: 'https://open.spotify.com/track/40riOy7x9W7GXjyGp4pjAv',
      youtubeUrl: 'https://www.youtube.com/watch?v=09839DpTctU',
      isLiked: true,
      genre: 'Rock',
      year: 1976
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
    setAllSongs(sampleSongs);
    setPlaylists(samplePlaylists);
  }, []);

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayPause = (song?: Song) => {
    if (song && song.id !== currentSong?.id) {
      setCurrentSong(song);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleLike = (songId: string) => {
    setAllSongs(prev => prev.map(song =>
      song.id === songId ? { ...song, isLiked: !song.isLiked } : song
    ));
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  const PlayerControls = () => (
    <ModernCard className="fixed bottom-4 left-4 right-4 lg:left-80 z-40 p-4" blur="xl" gradient="none">
      <div className="flex items-center gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentSong?.title || 'No song selected'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentSong?.artist || 'Select a song to play'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShuffled(!isShuffled)}
            className={isShuffled ? 'text-blue-600' : 'text-gray-600'}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => togglePlayPause()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full w-10 h-10 p-0"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <Button variant="ghost" size="sm">
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRepeatMode(
              repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off'
            )}
            className={repeatMode !== 'off' ? 'text-blue-600' : 'text-gray-600'}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume & External Links */}
        <div className="hidden lg:flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-gray-600" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-20"
          />
          
          {currentSong?.spotifyUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openExternalLink(currentSong.spotifyUrl!)}
              className="text-green-600"
            >
              <Music2 className="h-4 w-4" />
            </Button>
          )}
          
          {currentSong?.youtubeUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openExternalLink(currentSong.youtubeUrl!)}
              className="text-red-600"
            >
              <Video className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </ModernCard>
  );

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
          <span className="text-xs text-gray-500">{song.duration}</span>
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
                    Store your favorite playlists and songs
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
              />
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

        {/* Content */}
        {activeTab === 'library' && (
          <div className={`grid gap-6 ${
            currentView === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            {filteredSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}

        {activeTab === 'playlists' && (
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

        {activeTab === 'discover' && (
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

        {filteredSongs.length === 0 && searchQuery && (
          <ModernCard gradient="none" blur="lg" className="p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No songs found</h3>
            <p className="text-gray-500">Try searching with different keywords</p>
          </ModernCard>
        )}
      </div>

      {/* Player Controls */}
      <PlayerControls />
    </div>
  );
}