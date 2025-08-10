'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useTheme } from '@/hooks/useTheme';
import { ModernVoiceWidget } from '@/components/ui/ModernVoiceWidget';
import { VoiceNavigationSystem } from '@/components/VoiceNavigationSystem';
import { QuickActionsPanel } from '@/components/QuickActionsPanel';
import { GestureControls } from '@/components/GestureControls';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  useTheme(); // Apply saved theme settings
  const [isVoiceCollapsed, setIsVoiceCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:pl-72 pt-16 lg:pt-0" role="main" tabIndex={-1}>
        {children}
      </main>
      
      {/* Voice Navigation System - Compact floating widget */}
      <div className="fixed bottom-4 left-4 z-50">
        <VoiceNavigationSystem compact={true} />
      </div>
      
      {/* Quick Actions Panel - Floating action button */}
      <QuickActionsPanel />
      
      {/* Gesture Controls - Touch/swipe navigation */}
      <GestureControls showIndicator={true} />
      
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
      <ProtectedLayoutContent>
        {children}
      </ProtectedLayoutContent>
    </AuthGuard>
  );
}