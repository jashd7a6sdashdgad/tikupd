'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMusic } from '@/contexts/MusicContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Minimize2,
  Maximize2,
  X,
  Heart,
  Shuffle,
  Repeat,
  List,
  Download,
  Share2,
  MoreHorizontal,
  Loader2,
  Headphones
} from 'lucide-react';

interface HindiSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  audioUrl: string;
  imageUrl: string;
  isLiked?: boolean;
  genre?: string;
  year?: number;
}

// Fallback songs if local music loading fails
const FALLBACK_SONGS: HindiSong[] = [
  {
    id: '1',
    title: 'No Local Music Found',
    artist: 'System Message',
    album: 'Upload MP3 files to /public/Music',
    duration: '0:00',
    audioUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    isLiked: false,
    genre: 'Info',
    year: new Date().getFullYear()
  }
];

export function GlobalHindiMusicPlayer() {
  const { isGlobalMusicEnabled, volume: globalVolume, setVolume: setGlobalVolume } = useMusic();
  const [songs, setSongs] = useState<HindiSong[]>(FALLBACK_SONGS);
  const [currentSong, setCurrentSong] = useState<HindiSong>(FALLBACK_SONGS[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingMusic, setIsLoadingMusic] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load local music on component mount
  useEffect(() => {
    const loadLocalMusic = async () => {
      try {
        console.log('🎵 Loading local music from /public/Music folder...');
        const response = await fetch('/api/music/local');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🎵 Local music API response:', result);
        
        if (result.success && result.tracks && result.tracks.length > 0) {
          console.log('✅ Found local music tracks:', result.tracks.length);
          
          // Convert local tracks to HindiSong format
          const localSongs: HindiSong[] = result.tracks.map((track: any, index: number) => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.artist,
            duration: track.duration || '0:00',
            audioUrl: track.audioUrl,
            imageUrl: `https://images.unsplash.com/photo-${1493225457124 + index}-a3eb161ffa5f?w=400&h=400&fit=crop`,
            isLiked: false,
            genre: 'Hindi',
            year: 2023
          }));
          
          setSongs(localSongs);
          setCurrentSong(localSongs[0]);
          console.log('🎵 Hindi music player updated with', localSongs.length, 'local tracks');
          
          // Show a subtle notification that music is ready
          if (localSongs.length > 0) {
            setTimeout(() => {
              console.log('🎵 Music player ready with', localSongs.length, 'tracks');
            }, 1000);
          }
        } else {
          console.log('⚠️ No local music found or invalid response:', result);
          console.log('Using fallback songs...');
          setSongs(FALLBACK_SONGS);
          setCurrentSong(FALLBACK_SONGS[0]);
        }
      } catch (error) {
        console.error('❌ Failed to load local music:', error);
        console.log('Using fallback songs due to error...');
        setSongs(FALLBACK_SONGS);
        setCurrentSong(FALLBACK_SONGS[0]);
      } finally {
        setIsLoadingMusic(false);
      }
    };
    
    loadLocalMusic();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all' || isShuffled) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasError(false);
      setIsBuffering(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsBuffering(true);
    const handleCanPlay = () => {
      setIsBuffering(false);
      setHasError(false);
      setRetryCount(0);
    };
    const handleError = (e: any) => {
      console.error('❌ Audio error for:', currentSong.title, 'URL:', currentSong.audioUrl, 'Error:', e);
      setIsPlaying(false);
      setIsBuffering(false);
      setHasError(true);
      
      // Log more details about the error
      if (audio.error) {
        console.error('Audio error code:', audio.error.code);
        console.error('Audio error message:', audio.error.message);
      }
      
      // Auto-retry up to 3 times
      if (retryCount < 3) {
        console.log(`🔄 Retrying audio load (${retryCount + 1}/3) for:`, currentSong.title);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          if (audio.src) {
            audio.load();
          }
        }, 1000 * (retryCount + 1));
      } else {
        console.error('❌ Max retries reached for:', currentSong.title);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    // Auto-play on mount (with user interaction)
    const playAudio = async () => {
      try {
        audio.volume = globalVolume;
        // Note: Auto-play will only work after user interaction
      } catch (error) {
        console.log('Auto-play prevented by browser');
      }
    };

    playAudio();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [currentSong, repeatMode, isShuffled, retryCount]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : globalVolume;
    }
  }, [globalVolume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      // setIsPlaying will be handled by pause event listener
    } else {
      console.log('🎵 Attempting to play:', currentSong.title, 'from', currentSong.audioUrl);
      audio.play().catch(error => {
        console.error('❌ Audio playback failed:', error);
        console.log('Current song URL:', currentSong.audioUrl);
        setIsPlaying(false);
      });
      // setIsPlaying will be handled by play event listener
    }
  };

  const playNext = () => {
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    setCurrentIndex(nextIndex);
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
    setHasError(false);
    setRetryCount(0);
  };

  const playPrevious = () => {
    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * songs.length);
    } else {
      prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    }
    setCurrentIndex(prevIndex);
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
    setHasError(false);
    setRetryCount(0);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const toggleLike = () => {
    const updatedSongs = songs.map(song => 
      song.id === currentSong.id 
        ? { ...song, isLiked: !song.isLiked }
        : song
    );
    setSongs(updatedSongs);
    setCurrentSong({ ...currentSong, isLiked: !currentSong.isLiked });
  };

  const playSongByIndex = (index: number) => {
    setCurrentIndex(index);
    setCurrentSong(songs[index]);
    setIsPlaying(true);
    setHasError(false);
    setRetryCount(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setGlobalVolume(newVolume);
    setIsMuted(false);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isGlobalMusicEnabled) return null;

  return (
    <>
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        preload="metadata"
      />

      {/* Player UI */}
      <div className={`fixed bottom-32 right-4 z-40 transition-all duration-500 ease-in-out ${
        isMinimized ? 'w-16 h-16' : 'w-96 h-auto'
      } ${!isMinimized ? 'animate-in slide-in-from-bottom-8 fade-in duration-700' : ''}`}>
        <div className="bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              {!isMinimized && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Hindi Music Player</h3>
                  <p className="text-xs text-gray-600">
                    {isLoadingMusic ? 'Loading...' : `${songs.length} tracks available`}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="h-8 w-8 p-0 hover:bg-white/20 rounded-xl"
                >
                  <List className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 space-y-4">
              {/* Current Song Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={currentSong.imageUrl}
                    alt={currentSong.title}
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-gray-900 truncate mb-1">
                    {currentSong.title}
                  </h4>
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {currentSong.artist}
                  </p>
                  <div className="flex items-center gap-2">
                    {currentSong.genre && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {currentSong.genre}
                      </span>
                    )}
                    {currentSong.year && (
                      <span className="text-xs text-gray-500">{currentSong.year}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLike}
                  className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                    currentSong.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className="h-4 w-4" fill={currentSong.isLiked ? 'currentColor' : 'none'} />
                </Button>
              </div>

              {/* Status Messages */}
              {hasError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-red-700 font-medium">Playback Error</p>
                  <p className="text-xs text-red-600 mt-1">
                    {retryCount < 3 ? `Retrying... (${retryCount + 1}/3)` : `Unable to play "${currentSong.title}"`}
                  </p>
                  {retryCount >= 3 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600">
                        This may be due to special characters in the filename.
                      </p>
                      <p className="text-xs text-red-500 font-medium mt-1">
                        File: {currentSong.title}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {isBuffering && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-700 font-medium">Loading track...</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div 
                      className="w-3 h-3 bg-white border-2 border-purple-500 rounded-full shadow-lg transition-all duration-100"
                      style={{ marginLeft: `calc(${progress}% - 6px)` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-medium">{formatTime(currentTime)}</span>
                  <span className="font-medium">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleShuffle}
                    className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                      isShuffled ? 'text-purple-600 bg-purple-100' : 'text-gray-600 hover:text-purple-600'
                    }`}
                    title="Shuffle"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRepeat}
                    className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 relative ${
                      repeatMode !== 'off' ? 'text-purple-600 bg-purple-100' : 'text-gray-600 hover:text-purple-600'
                    }`}
                    title={`Repeat: ${repeatMode}`}
                  >
                    <Repeat className="h-4 w-4" />
                    {repeatMode === 'one' && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">1</span>
                      </span>
                    )}
                  </Button>
                </div>

                {/* Main controls */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={playPrevious}
                    disabled={songs.length <= 1}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    onClick={togglePlay}
                    disabled={isBuffering || hasError || !currentSong.audioUrl}
                    className="h-12 w-12 p-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {isBuffering ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={playNext}
                    disabled={songs.length <= 1}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🎵 Debug info:');
                      console.log('Current song:', currentSong);
                      console.log('Audio URL:', currentSong.audioUrl);
                      console.log('Has error:', hasError);
                      console.log('Is buffering:', isBuffering);
                      console.log('Retry count:', retryCount);
                      if (audioRef.current) {
                        console.log('Audio element src:', audioRef.current.src);
                        console.log('Audio element error:', audioRef.current.error);
                      }
                    }}
                    className="h-8 w-8 p-0 rounded-xl text-gray-600 hover:text-purple-600 transition-all duration-200"
                    title="Debug audio (check console)"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-8 w-8 p-0 rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : globalVolume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(isMuted ? 0 : globalVolume) * 100}%, #e5e7eb ${(isMuted ? 0 : globalVolume) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium min-w-[3rem] text-right">
                  {Math.round((isMuted ? 0 : globalVolume) * 100)}%
                </span>
              </div>

              {/* Playlist */}
              {showPlaylist && (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {songs.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => playSongByIndex(index)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          currentSong.id === song.id 
                            ? 'bg-purple-100 border border-purple-200' 
                            : 'hover:bg-white/50'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                          {currentSong.id === song.id && isPlaying ? (
                            <Pause className="h-3 w-3 text-white" />
                          ) : (
                            <Play className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{song.title}</p>
                          <p className="text-xs text-gray-600 truncate">{song.artist}</p>
                        </div>
                        {song.isLiked && (
                          <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Minimized view */}
          {isMinimized && (
            <div className="p-2">
              <Button
                variant="ghost"
                onClick={togglePlay}
                disabled={isBuffering || hasError || !currentSong.audioUrl}
                className="h-12 w-12 p-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {isBuffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* Add custom CSS for sliders */}
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #8b5cf6;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }
          .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #8b5cf6;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>

      {/* Floating music visualization when playing */}
      {isPlaying && !isMinimized && (
        <div className="fixed bottom-56 right-8 z-30 pointer-events-none">
          <div className="flex items-center gap-1 animate-pulse">
            <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', height: '12px' }}></div>
            <div className="w-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', height: '20px' }}></div>
            <div className="w-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms', height: '16px' }}></div>
            <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '450ms', height: '24px' }}></div>
            <div className="w-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '600ms', height: '18px' }}></div>
          </div>
        </div>
      )}
      
      {/* Floating notification */}
      {isPlaying && isMinimized && (
        <div className="fixed bottom-48 right-8 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-purple-600 animate-pulse" />
              <span className="text-sm font-medium text-gray-800 truncate max-w-32">
                {currentSong.title}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}