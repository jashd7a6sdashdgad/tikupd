'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useTheme } from '@/hooks/useTheme';
import { ModernVoiceWidget } from '@/components/ui/ModernVoiceWidget';
import { VoiceNavigationSystem } from '@/components/VoiceNavigationSystem';
import { ThemeProvider } from '@/contexts/ThemeContext';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  useTheme(); // Apply saved theme settings
  const [isVoiceCollapsed, setIsVoiceCollapsed] = useState(true);

  // Setup auto-save for Google OAuth tokens
  useEffect(() => {
    const setupAutoSave = async () => {
      const { setupAutoSaveGoogleTokens } = await import('@/lib/autoSaveGoogleTokens');
      setupAutoSaveGoogleTokens();
    };
    setupAutoSave();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:pl-72 pt-16 lg:pt-0" role="main" tabIndex={-1}>
        {children}
      </main>
      
      {/* Voice Navigation System - Modern floating widget */}
      <div className="fixed bottom-6 left-6 z-50 lg:left-78">
        <VoiceNavigationSystem compact={true} />
      </div>
      
      
      {/* Global AI Voice Assistant */}
      <ModernVoiceWidget
        collapsed={isVoiceCollapsed}
        onToggleCollapse={() => setIsVoiceCollapsed(!isVoiceCollapsed)}
      />
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ThemeProvider>
        <ProtectedLayoutContent>
          {children}
        </ProtectedLayoutContent>
      </ThemeProvider>
    </AuthGuard>
  );
}