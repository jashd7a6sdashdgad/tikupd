'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  gradients: {
    primary: string[];
    secondary: string[];
    hero: string[];
  };
  effects: {
    glassmorphism: boolean;
    shadows: 'minimal' | 'medium' | 'heavy';
    animations: boolean;
    blur: number;
    roundness: number;
  };
  darkMode: boolean;
  custom: boolean;
}

export const defaultPresets: ThemePreset[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Clean and professional blue theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#06b6d4',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      muted: '#64748b'
    },
    gradients: {
      primary: ['#3b82f6', '#1d4ed8'],
      secondary: ['#06b6d4', '#0891b2'],
      hero: ['#f8fafc', '#e2e8f0', '#cbd5e1']
    },
    effects: {
      glassmorphism: true,
      shadows: 'medium',
      animations: true,
      blur: 12,
      roundness: 16
    },
    darkMode: false,
    custom: false
  },
  {
    id: 'purple-gradient',
    name: 'Modern Blue Purple Gradient',
    description: 'Vibrant purple with blue gradients',
    colors: {
      primary: '#8b5cf6',
      secondary: '#3b82f6',
      accent: '#ec4899',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280'
    },
    gradients: {
      primary: ['#8b5cf6', '#3b82f6'],
      secondary: ['#ec4899', '#3b82f6'],
      hero: ['#faf5ff', '#f3e8ff', '#ddd6fe']
    },
    effects: {
      glassmorphism: true,
      shadows: 'heavy',
      animations: true,
      blur: 16,
      roundness: 24
    },
    darkMode: false,
    custom: false
  },
  {
    id: 'emerald-nature',
    name: 'Emerald Nature',
    description: 'Fresh green nature-inspired theme',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#f59e0b',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#111827',
      muted: '#6b7280'
    },
    gradients: {
      primary: ['#10b981', '#059669'],
      secondary: ['#f59e0b', '#d97706'],
      hero: ['#f0fdf4', '#dcfce7', '#bbf7d0']
    },
    effects: {
      glassmorphism: false,
      shadows: 'minimal',
      animations: true,
      blur: 8,
      roundness: 12
    },
    darkMode: false,
    custom: false
  }
];

interface ThemeContextType {
  currentTheme: ThemePreset;
  customPresets: ThemePreset[];
  applyTheme: (preset: ThemePreset) => void;
  saveCustomPreset: (preset: ThemePreset) => void;
  deleteCustomPreset: (id: string) => void;
  updateCurrentTheme: (updates: Partial<ThemePreset>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(defaultPresets[0]);
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);

  // Load theme and custom presets from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.customTheme) {
          setCurrentTheme(parsed.customTheme);
        }
      }

      const savedCustomPresets = localStorage.getItem('custom-theme-presets');
      if (savedCustomPresets) {
        const parsedPresets = JSON.parse(savedCustomPresets);
        setCustomPresets(parsedPresets);
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    }
  }, []);

  // Apply theme to the DOM with global CSS overrides
  const applyThemeToDOM = (theme: ThemePreset) => {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-muted', theme.colors.muted);

    // Apply gradients
    root.style.setProperty('--theme-gradient-primary', `linear-gradient(135deg, ${theme.gradients.primary.join(', ')})`);
    root.style.setProperty('--theme-gradient-secondary', `linear-gradient(135deg, ${theme.gradients.secondary.join(', ')})`);
    root.style.setProperty('--theme-gradient-hero', `linear-gradient(135deg, ${theme.gradients.hero.join(', ')})`);

    // Apply effects
    root.style.setProperty('--theme-blur', `${theme.effects.blur}px`);
    root.style.setProperty('--theme-roundness', `${theme.effects.roundness}px`);
    root.style.setProperty('--theme-shadow', theme.effects.shadows === 'minimal' ? '0 1px 3px rgba(0,0,0,0.1)' : 
                                           theme.effects.shadows === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' : 
                                           '0 10px 25px rgba(0,0,0,0.15)');

    // Apply glassmorphism class
    if (theme.effects.glassmorphism) {
      root.classList.add('glassmorphism-enabled');
    } else {
      root.classList.remove('glassmorphism-enabled');
    }

    // Apply animations
    if (theme.effects.animations) {
      root.classList.add('animations-enabled');
    } else {
      root.classList.remove('animations-enabled');
    }

    // Apply dark mode
    if (theme.darkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    // Apply global CSS overrides to affect existing components
    applyGlobalCSSOverrides(theme);
  };

  // Function to inject global CSS that overrides existing styles
  const applyGlobalCSSOverrides = (theme: ThemePreset) => {
    // Remove existing theme style tag if it exists
    const existingStyle = document.getElementById('dynamic-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style tag with global overrides
    const style = document.createElement('style');
    style.id = 'dynamic-theme-styles';
    style.textContent = `
      /* Global theme CSS overrides */
      :root {
        --primary-rgb: ${hexToRgb(theme.colors.primary)};
        --secondary-rgb: ${hexToRgb(theme.colors.secondary)};
        --accent-rgb: ${hexToRgb(theme.colors.accent)};
        --background-rgb: ${hexToRgb(theme.colors.background)};
        --surface-rgb: ${hexToRgb(theme.colors.surface)};
      }

      /* Override page backgrounds */
      body {
        background: ${theme.colors.background} !important;
      }

      /* Override gradient backgrounds */
      .bg-gradient-to-br.from-slate-50.via-blue-50.to-indigo-100 {
        background: ${theme.gradients.hero.join(', ')} !important;
        background: linear-gradient(135deg, ${theme.gradients.hero.join(', ')}) !important;
      }

      /* Override card backgrounds */
      .bg-white\\/80,
      .bg-white\\/70,
      .bg-white\\/60 {
        background: ${theme.colors.surface} !important;
        background-color: ${hexToRgba(theme.colors.surface, 0.9)} !important;
      }

      /* Override glass effects */
      .glass-widget,
      .glass-widget-dark {
        background: ${hexToRgba(theme.colors.surface, 0.8)} !important;
        backdrop-filter: blur(${theme.effects.blur}px) !important;
        border-radius: ${theme.effects.roundness}px !important;
        box-shadow: ${theme.effects.shadows === 'minimal' ? '0 1px 3px rgba(0,0,0,0.1)' : 
                     theme.effects.shadows === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' : 
                     '0 10px 25px rgba(0,0,0,0.15)'} !important;
      }

      /* Override button styles */
      .bg-gradient-to-r.from-blue-500.to-indigo-600,
      .bg-gradient-to-r.from-blue-600.to-indigo-700 {
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}) !important;
      }

      .bg-gradient-to-r.from-purple-500.to-pink-600,
      .bg-gradient-to-r.from-purple-600.to-pink-700 {
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent}) !important;
      }

      .bg-gradient-to-r.from-emerald-500.to-teal-600 {
        background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary}) !important;
      }

      /* Override navigation colors */
      .bg-gradient-to-br.from-slate-50\\/95.via-blue-50\\/95.to-indigo-100\\/95 {
        background: linear-gradient(135deg, ${hexToRgba(theme.colors.background, 0.95)}, ${hexToRgba(theme.colors.surface, 0.95)}, ${hexToRgba(theme.colors.primary, 0.1)}) !important;
      }

      /* Override icon containers */
      .bg-gradient-to-br.from-blue-500.to-indigo-600 {
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}) !important;
      }

      .bg-gradient-to-br.from-purple-500.to-pink-600 {
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent}) !important;
      }

      .bg-gradient-to-br.from-emerald-500.to-teal-600 {
        background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary}) !important;
      }

      /* Override text colors to maintain readability */
      .text-gray-800,
      .text-gray-900 {
        color: ${theme.colors.text} !important;
      }

      .text-gray-600 {
        color: ${theme.colors.muted} !important;
      }

      /* Override border radius based on theme */
      ${theme.effects.roundness > 16 ? `
      .rounded-xl,
      .rounded-2xl,
      .rounded-3xl {
        border-radius: ${theme.effects.roundness}px !important;
      }
      ` : ''}

      /* Animations based on theme settings */
      ${theme.effects.animations ? `
      * {
        transition: all 0.3s ease !important;
      }
      ` : `
      * {
        transition: none !important;
      }
      `}

      /* Glassmorphism effects */
      ${theme.effects.glassmorphism ? `
      .glassmorphism-enabled .bg-white\\/80,
      .glassmorphism-enabled .bg-white\\/70,
      .glassmorphism-enabled .bg-white\\/60 {
        backdrop-filter: blur(${theme.effects.blur}px) saturate(180%) !important;
        background: ${hexToRgba(theme.colors.surface, 0.7)} !important;
        border: 1px solid ${hexToRgba(theme.colors.primary, 0.2)} !important;
      }
      ` : ''}

      /* Shadow overrides */
      .shadow-xl,
      .shadow-2xl,
      .shadow-3xl {
        box-shadow: ${theme.effects.shadows === 'minimal' ? '0 1px 3px rgba(0,0,0,0.1)' : 
                     theme.effects.shadows === 'medium' ? '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)' : 
                     '0 25px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)'} !important;
      }

      /* Override specific component gradients */
      [style*="from-blue-500"]:not(.bg-gradient-to-r) {
        background: ${theme.colors.primary} !important;
      }

      [style*="from-purple-500"]:not(.bg-gradient-to-r) {
        background: ${theme.colors.accent} !important;
      }

      [style*="from-emerald-500"]:not(.bg-gradient-to-r) {
        background: ${theme.colors.secondary} !important;
      }
    `;

    document.head.appendChild(style);
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
      '0, 0, 0';
  };

  // Helper function to convert hex to RGBA
  const hexToRgba = (hex: string, alpha: number): string => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb}, ${alpha})`;
  };

  const applyTheme = (preset: ThemePreset) => {
    setCurrentTheme(preset);
    applyThemeToDOM(preset);

    // Save to localStorage
    try {
      const savedSettings = localStorage.getItem('app-settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      settings.customTheme = preset;
      localStorage.setItem('app-settings', JSON.stringify(settings));

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('settings-changed'));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const saveCustomPreset = (preset: ThemePreset) => {
    const newPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      custom: true
    };

    const updatedCustomPresets = [...customPresets, newPreset];
    setCustomPresets(updatedCustomPresets);

    // Save to localStorage
    try {
      localStorage.setItem('custom-theme-presets', JSON.stringify(updatedCustomPresets));
    } catch (error) {
      console.error('Failed to save custom preset:', error);
    }

    return newPreset;
  };

  const deleteCustomPreset = (id: string) => {
    const updatedCustomPresets = customPresets.filter(preset => preset.id !== id);
    setCustomPresets(updatedCustomPresets);

    // Save to localStorage
    try {
      localStorage.setItem('custom-theme-presets', JSON.stringify(updatedCustomPresets));
    } catch (error) {
      console.error('Failed to delete custom preset:', error);
    }
  };

  const updateCurrentTheme = (updates: Partial<ThemePreset>) => {
    const updatedTheme = { ...currentTheme, ...updates, custom: true };
    setCurrentTheme(updatedTheme);
    applyThemeToDOM(updatedTheme);
  };

  // Apply theme on mount and when currentTheme changes
  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      customPresets,
      applyTheme,
      saveCustomPreset,
      deleteCustomPreset,
      updateCurrentTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}