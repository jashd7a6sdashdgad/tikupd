'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Mail,
  FileSpreadsheet,
  Search,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  X,
  Facebook,
  MessageCircle,
  Youtube,
  Globe,
  Brain,
  Sun,
  Camera,
  Share2,
  Moon,
  Shield,
  Palette,
  Compass,
  Key,
  Briefcase,
  Music
} from 'lucide-react';
import { useState, ComponentType } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { VoiceNavigationSystem } from '@/components/VoiceNavigationSystem';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  key: string;
  name: string;
  href: string;
  icon: ComponentType<any>;
}

const getNavigation = (t: (key: string) => string): NavigationItem[] => [
  {
    key: 'dashboard',
    name: t('dashboard'),
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    key: 'chat',
    name: t('chat'),
    href: '/chat',
    icon: Search
  },
  {
    key: 'think-tool',
    name: t('thinkTool'),
    href: '/think-tool',
    icon: Brain
  },
  {
    key: 'workflow-builder',
    name: 'Workflow Builder',
    href: '/workflow-builder',
    icon: Brain
  },
  {
    key: 'calendar',
    name: t('calendar'),
    href: '/calendar',
    icon: Calendar
  },
  {
    key: 'email',
    name: t('email'),
    href: '/email',
    icon: Mail
  },
  {
    key: 'expenses',
    name: t('expenses'),
    href: '/expenses',
    icon: FileSpreadsheet
  },
  {
    key: 'shopping',
    name: t('shoppingList'),
    href: '/shopping',
    icon: FileSpreadsheet
  },
  {
    key: 'contacts',
    name: t('contacts'),
    href: '/contacts',
    icon: FileSpreadsheet
  },
  {
    key: 'diary',
    name: t('diary'),
    href: '/diary',
    icon: FileSpreadsheet
  },
  {
    key: 'photos',
    name: t('photos'),
    href: '/photos',
    icon: Camera
  },
  {
    key: 'budget',
    name: t('budget'),
    href: '/budget',
    icon: FileSpreadsheet
  },
  {
    key: 'tracking',
    name: t('tracking'),
    href: '/tracking',
    icon: Stethoscope
  },
  {
    key: 'youtube',
    name: t('youtube'),
    href: '/youtube',
    icon: Youtube
  },
  {
    key: 'music',
    name: t('music') || 'Music',
    href: '/music',
    icon: Music
  },
  {
    key: 'weather',
    name: t('weather'),
    href: '/weather',
    icon: Sun
  },
  {
    key: 'webScraper',
    name: t('webScraper'),
    href: '/web-scraper',
    icon: Globe
  },
  {
    key: 'islamic-settings',
    name: 'Islamic Settings',
    href: '/islamic-settings',
    icon: Moon
  },
  {
    key: 'security',
    name: t('security'),
    href: '/security',
    icon: Shield
  },
  {
    key: 'travel',
    name: t('travel') || 'Travel Companion',
    href: '/travel',
    icon: Compass
  },
  {
    key: 'customization',
    name: 'Customization',
    href: '/customization',
    icon: Palette
  },
  {
    key: 'api-tokens',
    name: 'API Tokens',
    href: '/api-tokens',
    icon: Key
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { language, isRTL } = useSettings();
  const { t } = useTranslation(language);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  
  const navigation = getNavigation(t);

  const handleLogout = async () => {
    await logout();
  };

  const handleGoogleConnect = async () => {
    try {
      setIsConnectingGoogle(true);
      console.log('Initiating Google OAuth flow...');
      const response = await fetch('/api/google/auth');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setIsConnectingGoogle(false);
      alert('Failed to connect to Google. Please try again.');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gradient-to-br from-slate-50/95 via-blue-50/95 to-indigo-100/95 backdrop-blur-xl border-r border-white/20 shadow-2xl px-6 pb-4">
          <div className="flex h-20 shrink-0 items-center justify-center">
            <div className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-xl">
              <h1 className="text-xl font-bold text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {language === 'ar' ? 'المساعد الشخصي' : 'Personal Assistant'}
              </h1>
            </div>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-2">
                  {navigation.map((item: NavigationItem) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href as any}
                          className={cn(
                            'group flex gap-x-4 rounded-2xl p-4 text-sm leading-6 font-semibold transition-all duration-500 ease-out relative overflow-hidden',
                            isActive
                              ? 'bg-white/90 backdrop-blur-lg text-blue-700 font-bold shadow-xl shadow-blue-500/20 border border-blue-200/50 scale-105 transform'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-white/70 hover:backdrop-blur-lg hover:shadow-lg hover:shadow-blue-500/10 hover:border hover:border-blue-200/30 hover:scale-102 hover:transform',
                            'hover:translate-x-2'
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-xl transition-all duration-500",
                            isActive
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
                              : "bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:shadow-lg"
                          )}>
                            <item.icon className={cn(
                              "h-5 w-5 shrink-0 transition-all duration-500",
                              isActive 
                                ? "text-white transform scale-110" 
                                : "text-gray-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6"
                            )} />
                          </div>
                          <span className="transition-all duration-500 group-hover:translate-x-1 flex-1">
                            {item.name}
                          </span>
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 animate-pulse rounded-2xl"></div>
                          )}
                          <div className={cn(
                            "w-1 h-8 rounded-full transition-all duration-500",
                            isActive 
                              ? "bg-gradient-to-b from-blue-500 to-indigo-600 shadow-lg" 
                              : "bg-transparent group-hover:bg-gradient-to-b group-hover:from-blue-400 group-hover:to-indigo-500"
                          )} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              <li className="mt-auto">
                <div className="space-y-3 pt-6 border-t border-white/20">
                  
                  {/* Google Connect Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mb-4 bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-blue-200 hover:border-blue-400 text-gray-700 hover:text-blue-700 font-semibold py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={handleGoogleConnect}
                    disabled={isConnectingGoogle}
                  >
                    {isConnectingGoogle ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span>{isConnectingGoogle ? t('connecting') : t('connectGoogle')}</span>
                  </Button>
                  
                  <Link
                    href="/settings"
                    className={cn(
                      'group flex gap-x-4 rounded-2xl p-4 text-sm leading-6 font-semibold transition-all duration-500 ease-out relative overflow-hidden',
                      pathname === '/settings'
                        ? 'bg-white/90 backdrop-blur-lg text-blue-700 font-bold shadow-xl shadow-blue-500/20 border border-blue-200/50 scale-105 transform'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-white/70 hover:backdrop-blur-lg hover:shadow-lg hover:shadow-blue-500/10 hover:border hover:border-blue-200/30 hover:scale-102 hover:transform hover:translate-x-2'
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl transition-all duration-500",
                      pathname === '/settings'
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
                        : "bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:shadow-lg"
                    )}>
                      <Settings className={cn(
                        "h-5 w-5 shrink-0 transition-all duration-500",
                        pathname === '/settings'
                          ? "text-white transform scale-110" 
                          : "text-gray-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6"
                      )} />
                    </div>
                    <span className="transition-all duration-500 group-hover:translate-x-1 flex-1">
                      {t('settings')}
                    </span>
                    {pathname === '/settings' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 animate-pulse rounded-2xl"></div>
                    )}
                    <div className={cn(
                      "w-1 h-8 rounded-full transition-all duration-500",
                      pathname === '/settings'
                        ? "bg-gradient-to-b from-blue-500 to-indigo-600 shadow-lg" 
                        : "bg-transparent group-hover:bg-gradient-to-b group-hover:from-blue-400 group-hover:to-indigo-500"
                    )} />
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="group flex w-full gap-x-4 rounded-2xl p-4 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-white/70 hover:backdrop-blur-lg hover:shadow-lg hover:shadow-red-500/10 hover:border hover:border-red-200/30 hover:scale-102 hover:transform hover:translate-x-2 transition-all duration-500 ease-out relative overflow-hidden"
                  >
                    <div className="p-2 rounded-xl bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-red-600 group-hover:shadow-lg transition-all duration-500">
                      <LogOut className="h-5 w-5 shrink-0 transition-all duration-500 text-gray-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <span className="transition-all duration-500 group-hover:translate-x-1 flex-1">
                      {t('signOut')}
                    </span>
                    <div className="w-1 h-8 rounded-full bg-transparent group-hover:bg-gradient-to-b group-hover:from-red-400 group-hover:to-red-500 transition-all duration-500" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        {/* Mobile menu button */}
        <div className="fixed top-0 left-0 z-50 flex h-16 w-full items-center gap-x-4 bg-gradient-to-r from-slate-50/95 via-blue-50/95 to-indigo-100/95 backdrop-blur-xl border-b border-white/20 shadow-xl px-4 sm:gap-x-6 sm:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 hover:text-blue-700 hover:bg-white/70 rounded-xl transition-all duration-300 lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex items-center justify-between text-sm font-semibold leading-6">
            <div className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl px-4 py-2 shadow-lg">
              <span className="text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-bold">
                {language === 'ar' ? 'المساعد الشخصي' : 'Personal Assistant'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            
            <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-gradient-to-br from-slate-50/95 via-blue-50/95 to-indigo-100/95 backdrop-blur-xl px-6 py-6 shadow-2xl sm:max-w-sm border-r border-white/20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 shadow-lg">
                  <h1 className="text-lg font-bold text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {language === 'ar' ? 'المساعد الشخصي' : 'Personal Assistant'}
                  </h1>
                </div>
                <button
                  type="button"
                  className="-m-2.5 rounded-xl p-2.5 text-gray-700 hover:text-blue-700 hover:bg-white/70 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="mt-6">
                <ul role="list" className="space-y-1">
                  {navigation.map((item: NavigationItem) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href as any}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300 ease-in-out relative overflow-hidden',
                            isActive
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-black font-bold shadow-lg shadow-primary/20 scale-105'
                              : 'text-black hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-md hover:shadow-primary/10 hover:scale-102 hover:translate-x-1'
                          )}
                        >
                          <item.icon className={cn(
                            "h-6 w-6 shrink-0 transition-all duration-300",
                            isActive 
                              ? "text-black font-bold transform rotate-3 scale-110" 
                              : "group-hover:text-primary group-hover:scale-110 group-hover:rotate-3"
                          )} />
                          <span className="transition-all duration-300 group-hover:translate-x-1">
                            {item.name}
                          </span>
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 animate-pulse"></div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                  
                  
                  {/* Google Connect Button for Mobile */}
                  <li className="mb-4">
                    <div className="px-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-blue-200 hover:border-blue-400 text-gray-700 hover:text-blue-700 font-semibold py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        onClick={handleGoogleConnect}
                        disabled={isConnectingGoogle}
                      >
                        {isConnectingGoogle ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : (
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        <span>{isConnectingGoogle ? t('connecting') : t('connectGoogle')}</span>
                      </Button>
                    </div>
                  </li>

                  <li className="mt-8">
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300 ease-in-out relative overflow-hidden',
                        pathname === '/settings'
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-black font-bold shadow-lg shadow-primary/20 scale-105'
                          : 'text-black hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-md hover:shadow-primary/10 hover:scale-102 hover:translate-x-1'
                      )}
                    >
                      <Settings className={cn(
                        "h-6 w-6 shrink-0 transition-all duration-300",
                        pathname === '/settings'
                          ? "text-black font-bold transform rotate-3 scale-110" 
                          : "group-hover:text-primary group-hover:scale-110 group-hover:rotate-3"
                      )} />
                      <span className="transition-all duration-300 group-hover:translate-x-1">
                        {t('settings')}
                      </span>
                      {pathname === '/settings' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 animate-pulse"></div>
                      )}
                    </Link>
                  </li>
                  
                  <li>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="group flex w-full gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold text-black hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-md hover:shadow-red-200/50 hover:scale-102 hover:translate-x-1 transition-all duration-300 ease-in-out"
                    >
                      <LogOut className="h-6 w-6 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:text-red-600" />
                      <span className="transition-all duration-300 group-hover:translate-x-1">
                        {t('signOut')}
                      </span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Mobile top spacing */}
      <div className="lg:hidden h-16" />
    </>
  );
}