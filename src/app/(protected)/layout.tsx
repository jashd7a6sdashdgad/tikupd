'use client';

import { Navigation } from '@/components/Navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useTheme } from '@/hooks/useTheme';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  useTheme(); // Apply saved theme settings

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:pl-72 pt-16 lg:pt-0" role="main" tabIndex={-1}>
        {children}
      </main>
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