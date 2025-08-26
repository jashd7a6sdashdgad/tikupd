'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// UI Settings Interface
interface UISettings {
  darkMode: boolean;
  reducedMotions: boolean;
  fontSize: number;
  borderRadius: number;
  animationSpeed: number;
  compactMode: boolean;
  showAvatars: boolean;
  cardShadows: boolean;
  blurEffects: boolean;
}

// Voice Settings Interface
interface VoiceSettings {
  voiceEnabled: boolean;
  voiceSpeed: number;
  voiceVolume: number;
  autoPlayResponses: boolean;
  voiceFeedback: boolean;
  soundEffects: boolean;
  notificationSounds: boolean;
}

// Layout Settings Interface
interface LayoutSettings {
  widgetSpacing: string;
  cardsPerRow: number;
  showWeather: boolean;
  showQuickActions: boolean;
  showRecentActivity: boolean;
  sidebarCollapsed: boolean;
  headerStyle: string;
  footerVisible: boolean;
}

interface SettingsContextType {
  language: string;
  timezone: string;
  uiSettings: UISettings;
  voiceSettings: VoiceSettings;
  layoutSettings: LayoutSettings;
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  updateLayoutSettings: (settings: Partial<LayoutSettings>) => void;
  isRTL: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

// Default settings
const defaultUISettings: UISettings = {
  darkMode: false,
  reducedMotions: false,
  fontSize: 16,
  borderRadius: 8,
  animationSpeed: 300,
  compactMode: false,
  showAvatars: true,
  cardShadows: true,
  blurEffects: true
};

const defaultVoiceSettings: VoiceSettings = {
  voiceEnabled: true,
  voiceSpeed: 1.0,
  voiceVolume: 0.8,
  autoPlayResponses: true,
  voiceFeedback: true,
  soundEffects: true,
  notificationSounds: true
};

const defaultLayoutSettings: LayoutSettings = {
  widgetSpacing: 'normal',
  cardsPerRow: 3,
  showWeather: true,
  showQuickActions: true,
  showRecentActivity: true,
  sidebarCollapsed: false,
  headerStyle: 'modern',
  footerVisible: true
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [language, setLanguageState] = useState('en');
  const [timezone, setTimezoneState] = useState('Asia/Muscat');
  const [uiSettings, setUISettingsState] = useState<UISettings>(defaultUISettings);
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(defaultVoiceSettings);
  const [layoutSettings, setLayoutSettingsState] = useState<LayoutSettings>(defaultLayoutSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language');
    const savedTimezone = localStorage.getItem('app-timezone');
    const savedUISettings = localStorage.getItem('mahboob_ui_settings');
    const savedVoiceSettings = localStorage.getItem('mahboob_voice_settings');
    const savedLayoutSettings = localStorage.getItem('mahboob_layout_settings');
    
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
    
    if (savedTimezone) {
      setTimezoneState(savedTimezone);
    } else {
      // Default to Asia/Muscat (GMT+4)
      setTimezoneState('Asia/Muscat');
    }
    
    // Load customization settings
    if (savedUISettings) {
      try {
        const parsedUISettings = JSON.parse(savedUISettings);
        setUISettingsState({ ...defaultUISettings, ...parsedUISettings });
      } catch (error) {
        console.warn('Failed to parse UI settings:', error);
      }
    }
    
    if (savedVoiceSettings) {
      try {
        const parsedVoiceSettings = JSON.parse(savedVoiceSettings);
        setVoiceSettingsState({ ...defaultVoiceSettings, ...parsedVoiceSettings });
      } catch (error) {
        console.warn('Failed to parse voice settings:', error);
      }
    }
    
    if (savedLayoutSettings) {
      try {
        const parsedLayoutSettings = JSON.parse(savedLayoutSettings);
        setLayoutSettingsState({ ...defaultLayoutSettings, ...parsedLayoutSettings });
      } catch (error) {
        console.warn('Failed to parse layout settings:', error);
      }
    }
    
    // Always use LTR direction regardless of language
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = savedLanguage || 'en';
  }, []);

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    localStorage.setItem('app-language', newLanguage);
    
    // Always use LTR direction regardless of language
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const setTimezone = (newTimezone: string) => {
    setTimezoneState(newTimezone);
    localStorage.setItem('app-timezone', newTimezone);
  };
  
  const updateUISettings = (newSettings: Partial<UISettings>) => {
    const updatedSettings = { ...uiSettings, ...newSettings };
    setUISettingsState(updatedSettings);
    localStorage.setItem('mahboob_ui_settings', JSON.stringify(updatedSettings));
    
    // Apply UI changes immediately
    applyUISettings(updatedSettings);
  };
  
  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    const updatedSettings = { ...voiceSettings, ...newSettings };
    setVoiceSettingsState(updatedSettings);
    localStorage.setItem('mahboob_voice_settings', JSON.stringify(updatedSettings));
  };
  
  const updateLayoutSettings = (newSettings: Partial<LayoutSettings>) => {
    const updatedSettings = { ...layoutSettings, ...newSettings };
    setLayoutSettingsState(updatedSettings);
    localStorage.setItem('mahboob_layout_settings', JSON.stringify(updatedSettings));
    
    // Apply layout changes immediately
    applyLayoutSettings(updatedSettings);
  };
  
  // Apply UI settings to the DOM
  const applyUISettings = (settings: UISettings) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties for dynamic styling
    root.style.setProperty('--app-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--app-border-radius', `${settings.borderRadius}px`);
    root.style.setProperty('--app-animation-speed', `${settings.animationSpeed}ms`);
    
    // Apply dark mode class
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply reduced motion preference
    if (settings.reducedMotions) {
      root.style.setProperty('--app-animation-speed', '0ms');
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    
    // Apply other UI settings as data attributes for CSS targeting
    root.setAttribute('data-show-avatars', settings.showAvatars.toString());
    root.setAttribute('data-card-shadows', settings.cardShadows.toString());
    root.setAttribute('data-blur-effects', settings.blurEffects.toString());
  };
  
  // Apply layout settings to the DOM
  const applyLayoutSettings = (settings: LayoutSettings) => {
    const root = document.documentElement;
    
    // Apply layout settings as data attributes for CSS targeting
    root.setAttribute('data-widget-spacing', settings.widgetSpacing);
    root.setAttribute('data-cards-per-row', settings.cardsPerRow.toString());
    root.setAttribute('data-header-style', settings.headerStyle);
    root.setAttribute('data-sidebar-collapsed', settings.sidebarCollapsed.toString());
    root.setAttribute('data-footer-visible', settings.footerVisible.toString());
    root.setAttribute('data-show-weather', settings.showWeather.toString());
    root.setAttribute('data-show-quick-actions', settings.showQuickActions.toString());
    root.setAttribute('data-show-recent-activity', settings.showRecentActivity.toString());
  };

  const isRTL = false; // Always use LTR layout

  // Apply UI settings on mount and when they change
  useEffect(() => {
    applyUISettings(uiSettings);
  }, [uiSettings]);
  
  // Apply layout settings on mount and when they change
  useEffect(() => {
    applyLayoutSettings(layoutSettings);
  }, [layoutSettings]);

  return (
    <SettingsContext.Provider value={{
      language,
      timezone,
      uiSettings,
      voiceSettings,
      layoutSettings,
      setLanguage,
      setTimezone,
      updateUISettings,
      updateVoiceSettings,
      updateLayoutSettings,
      isRTL
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}