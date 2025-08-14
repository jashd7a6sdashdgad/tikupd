'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MusicContextType {
  isGlobalMusicEnabled: boolean;
  toggleGlobalMusic: () => void;
  currentSong: string | null;
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isGlobalMusicEnabled, setIsGlobalMusicEnabled] = useState(true);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Load music preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('globalMusicPreferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      setIsGlobalMusicEnabled(preferences.enabled ?? true);
      setVolume(preferences.volume ?? 0.5);
    }
  }, []);

  // Save music preferences to localStorage
  useEffect(() => {
    localStorage.setItem('globalMusicPreferences', JSON.stringify({
      enabled: isGlobalMusicEnabled,
      volume: volume
    }));
  }, [isGlobalMusicEnabled, volume]);

  const toggleGlobalMusic = () => {
    setIsGlobalMusicEnabled(!isGlobalMusicEnabled);
  };

  return (
    <MusicContext.Provider value={{
      isGlobalMusicEnabled,
      toggleGlobalMusic,
      currentSong,
      isPlaying,
      volume,
      setVolume
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}