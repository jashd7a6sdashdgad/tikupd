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
  X
} from 'lucide-react';

interface HindiSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  audioUrl: string;
  imageUrl: string;
}

// Fallback songs if local music loading fails
const FALLBACK_SONGS: HindiSong[] = [
  {
    id: '1',
    title: 'Sample Track',
    artist: 'Local Music',
    album: 'Demo',
    duration: '0:00',
    audioUrl: 'https://www.soundjay.com/misc/sounds-of-nature/nature-sounds-1.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
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
          const localSongs: HindiSong[] = result.tracks.map((track: any) => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.artist, // Use artist as album for now
            duration: track.duration || '0:00',
            audioUrl: track.audioUrl,
            imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
          }));
          
          setSongs(localSongs);
          setCurrentSong(localSongs[0]);
          console.log('🎵 Hindi music player updated with', localSongs.length, 'local tracks');
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
    const handleEnded = () => playNext();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error('❌ Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
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
      audio.removeEventListener('error', handleError);
    };
  }, [currentSong]);

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
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
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
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-80 h-auto'
      }`}>
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-orange-600" />
              {!isMinimized && (
                <span className="text-sm font-medium text-gray-800">
                  {isLoadingMusic ? 'Loading Music...' : `Local Music (${songs.length})`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Current Song Info */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title}
                  className="w-12 h-12 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {currentSong.title}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {currentSong.artist}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ea580c 0%, #ea580c ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playPrevious}
                  className="h-8 w-8 p-0"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlay}
                  className="h-10 w-10 p-0 border-orange-200 hover:bg-orange-50"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Play className="h-5 w-5 text-orange-600" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playNext}
                  className="h-8 w-8 p-0"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-6 w-6 p-0"
                >
                  {isMuted ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : globalVolume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ea580c 0%, #ea580c ${(isMuted ? 0 : globalVolume) * 100}%, #e5e7eb ${(isMuted ? 0 : globalVolume) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </>
          )}

          {/* Minimized view */}
          {isMinimized && (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-orange-600" />
                ) : (
                  <Play className="h-4 w-4 text-orange-600" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating music note animation when playing */}
      {isPlaying && (
        <div className="fixed bottom-20 right-8 z-40 pointer-events-none">
          <div className="animate-bounce">
            <Music className="h-6 w-6 text-orange-500 opacity-60" />
          </div>
        </div>
      )}
    </>
  );
}