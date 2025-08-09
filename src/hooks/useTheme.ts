'use client';

import { useEffect } from 'react';

export function useTheme() {
  useEffect(() => {
    // Function to apply theme from localStorage
    const applyTheme = () => {
      const savedSettings = localStorage.getItem('app-settings');
      
      // Debug: Log what's in localStorage to help identify issues
      console.log('Theme hook - saved settings:', savedSettings);
      
      if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const appearance = parsed.appearance;
        
        if (appearance) {
          // Apply theme - only apply dark if explicitly set to 'dark', default to light otherwise
          if (appearance.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            // Always explicitly remove dark theme to prevent it from sticking
            document.documentElement.removeAttribute('data-theme');
          }

          // Apply color scheme
          if (appearance.colorScheme) {
            document.documentElement.setAttribute('data-color-scheme', appearance.colorScheme);
            
            // Apply color scheme CSS properties
            const colorSchemes: { [key: string]: { primary: string; secondary: string; accent: string } } = {
              'default': { primary: '271 81% 56%', secondary: '35 26% 79%', accent: '7 83% 49%' },
              'ocean': { primary: '199 89% 48%', secondary: '199 89% 48%', accent: '199 89% 48%' },
              'forest': { primary: '158 64% 52%', secondary: '158 64% 52%', accent: '158 64% 52%' },
              'sunset': { primary: '20 91% 48%', secondary: '0 84% 60%', accent: '0 84% 60%' },
              'royal': { primary: '256 91% 73%', secondary: '256 91% 73%', accent: '256 91% 73%' },
              'rose': { primary: '336 84% 57%', secondary: '336 84% 57%', accent: '336 84% 57%' },
              'cyber': { primary: '185 84% 44%', secondary: '185 84% 44%', accent: '185 84% 44%' },
              'gold': { primary: '38 92% 50%', secondary: '38 92% 50%', accent: '38 92% 50%' }
            };
            
            const scheme = colorSchemes[appearance.colorScheme] || colorSchemes['default'];
            document.documentElement.style.setProperty('--color-primary', scheme.primary);
            document.documentElement.style.setProperty('--color-secondary', scheme.secondary);
            document.documentElement.style.setProperty('--color-accent', scheme.accent);
          }

          // Apply font size
          if (appearance.fontSize) {
            const fontSize = appearance.fontSize === 'small' ? '14px' : 
                            appearance.fontSize === 'large' ? '18px' : '16px';
            document.documentElement.style.setProperty('--base-font-size', fontSize);
            document.body.style.fontSize = fontSize;
          }
        }
      } catch (error) {
        console.error('Failed to apply saved theme:', error);
        // If localStorage is corrupted, remove it to prevent further issues
        localStorage.removeItem('app-settings');
        // Ensure clean state
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.setAttribute('data-color-scheme', 'default');
        // Apply default color scheme manually
        document.documentElement.style.setProperty('--color-primary', '271 81% 56%');
        document.documentElement.style.setProperty('--color-secondary', '35 26% 79%');
        document.documentElement.style.setProperty('--color-accent', '7 83% 49%');
      }
    } else {
      console.log('Theme hook - no saved settings, using defaults');
      // If no saved settings, ensure we start with a clean, light theme state
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.setAttribute('data-color-scheme', 'default');
      // Apply default color scheme manually
      document.documentElement.style.setProperty('--color-primary', '271 81% 56%');
      document.documentElement.style.setProperty('--color-secondary', '35 26% 79%');
      document.documentElement.style.setProperty('--color-accent', '7 83% 49%');
    }
    };

    // Apply theme immediately
    applyTheme();

    // Listen for localStorage changes from other components (like settings page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-settings') {
        console.log('Theme hook - localStorage changed, reapplying theme');
        applyTheme();
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events in case of same-tab localStorage changes
    const handleCustomStorageChange = () => {
      console.log('Theme hook - custom storage change event, reapplying theme');
      applyTheme();
    };

    window.addEventListener('settings-changed', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings-changed', handleCustomStorageChange);
    };
  }, []);
}