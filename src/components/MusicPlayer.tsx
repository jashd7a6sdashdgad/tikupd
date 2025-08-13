'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/ModernCard';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Music2,
  Video,
  Plus,
  MoreHorizontal,
  Download,
  Share2,
  List,
  Loader
} from 'lucide-react';

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

interface MusicPlayerProps {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (songId: string) => void;
  onAddToPlaylist: (song: Song) => void;
  className?: string;
}

export function MusicPlayer({
  currentSong,
  playlist,
  isPlaying,
  volume,
  isShuffled,
  repeatMode,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onAddToPlaylist,
  className = ''
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleLoadStart = () => setIsBuffering(true);
    const handleCanPlay = () => {
      setIsBuffering(false);
      setPlaybackError(null);
    };
    const handleError = () => {
      setIsBuffering(false);
      setPlaybackError('Unable to play this track');
    };
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        onNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, onNext]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Playback failed:', error);
          setPlaybackError('Playback failed. Please try again.');
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume]);

  // Update audio source when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    // Clear any previous errors when switching songs
    setPlaybackError(null);

    // Use preview URL if available
    let audioSource = '';
    if (currentSong.previewUrl) {
      audioSource = currentSong.previewUrl;
    } else {
      // No direct playback available - show appropriate message
      setPlaybackError(`No preview available for "${currentSong.title}". ${currentSong.spotifyUrl ? 'Open in Spotify' : 'Open in YouTube'} for full playback.`);
      return;
    }

    if (audioSource && audioSource !== audio.src) {
      audio.src = audioSource;
      audio.load();
    } else if (!audioSource) {
      audio.removeAttribute('src');
      audio.load();
    }
  }, [currentSong]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const openExternalLink = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  if (!currentSong) {
    return (
      <ModernCard className={`p-4 ${className}`} blur="xl" gradient="none">
        <div className="flex items-center justify-center text-gray-500">
          <Music2 className="h-8 w-8 mr-3" />
          <span>Select a song to play</span>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard className={`${className}`} blur="xl" gradient="none">
      <audio ref={audioRef} preload="metadata" />
      
      <div className="p-4 space-y-4">
        {/* Song Info */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {currentSong.imageUrl ? (
              <img
                src={currentSong.imageUrl}
                alt={`${currentSong.title} cover`}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Music2 className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-lg">
              {currentSong.title}
            </h3>
            <p className="text-gray-600 truncate">
              {currentSong.artist}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {currentSong.album} {currentSong.year && `• ${currentSong.year}`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleLike(currentSong.id)}
              className={currentSong.isLiked ? 'text-red-500' : 'text-gray-400'}
            >
              <Heart className="h-4 w-4" fill={currentSong.isLiked ? 'currentColor' : 'none'} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddToPlaylist(currentSong)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {currentSong.spotifyUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openExternalLink(currentSong.spotifyUrl!)}
                className="text-green-600"
                title="Open in Spotify"
              >
                <Music2 className="h-4 w-4" />
              </Button>
            )}

            {currentSong.youtubeUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openExternalLink(currentSong.youtubeUrl!)}
                className="text-red-600"
                title="Open in YouTube"
              >
                <Video className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div 
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : formatTime(currentSong.duration / 1000)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleShuffle}
              className={isShuffled ? 'text-blue-600' : 'text-gray-600'}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleRepeat}
              className={repeatMode !== 'off' ? 'text-blue-600' : 'text-gray-600'}
              title={`Repeat ${repeatMode}`}
            >
              <Repeat className="h-4 w-4" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">1</span>
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={!playlist.length}
              className="hover:bg-gray-100"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={isPlaying ? onPause : onPlay}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 p-0"
              disabled={isBuffering || !!playbackError}
            >
              {isBuffering ? (
                <Loader className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={onNext}
              disabled={!playlist.length}
              className="hover:bg-gray-100"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 200)}
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              {showVolumeSlider && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border p-2"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" title="Queue">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {playbackError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Music2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-700 font-medium">Preview Not Available</p>
                <p className="text-xs text-orange-600 mt-1">{playbackError}</p>
                <div className="flex gap-2 mt-2">
                  {currentSong.spotifyUrl && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openExternalLink(currentSong.spotifyUrl!)}
                    >
                      <Music2 className="h-3 w-3 mr-1" />
                      Open in Spotify
                    </Button>
                  )}
                  {currentSong.youtubeUrl && (
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => openExternalLink(currentSong.youtubeUrl!)}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Open in YouTube
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Notice */}
        {currentSong.previewUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-600">
              🎵 Playing 30-second preview. Open in {currentSong.spotifyUrl ? 'Spotify' : 'YouTube'} for full track.
            </p>
          </div>
        )}
      </div>
    </ModernCard>
  );
}

export default MusicPlayer;