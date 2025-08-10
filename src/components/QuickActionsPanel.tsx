'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Minus,
  Calendar,
  Mail,
  DollarSign,
  Users,
  Phone,
  MessageSquare,
  Camera,
  ShoppingBag,
  Search,
  Settings,
  Zap,
  Clock,
  Star,
  BookOpen,
  BarChart3,
  Home,
  Navigation,
  Command,
  Mic,
  Edit,
  FileText,
  Upload,
  Download,
  Share2,
  Heart,
  Bookmark,
  Archive,
  Trash2,
  RefreshCw,
  Power,
  Volume2,
  Wifi,
  Battery,
  Sun,
  Moon,
  Globe,
  Map,
  Target,
  Award,
  Briefcase,
  Coffee,
  Music,
  Video
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  category: 'navigation' | 'communication' | 'productivity' | 'media' | 'system';
  hotkey?: string;
}

interface QuickActionsPanelProps {
  className?: string;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  className = ''
}) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customActions, setCustomActions] = useState<QuickAction[]>([]);
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Default quick actions
  const defaultActions: QuickAction[] = [
    // Navigation
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      action: () => router.push('/dashboard'),
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'navigation',
      hotkey: 'H'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-5 w-5" />,
      action: () => router.push('/calendar'),
      color: 'bg-green-500 hover:bg-green-600',
      category: 'navigation',
      hotkey: 'C'
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <DollarSign className="h-5 w-5" />,
      action: () => router.push('/expenses'),
      color: 'bg-yellow-500 hover:bg-yellow-600',
      category: 'navigation',
      hotkey: 'E'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => router.push('/tracking'),
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'navigation',
      hotkey: 'A'
    },

    // Communication
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="h-5 w-5" />,
      action: () => router.push('/email'),
      color: 'bg-red-500 hover:bg-red-600',
      category: 'communication',
      hotkey: 'M'
    },
    {
      id: 'messenger',
      label: 'Messages',
      icon: <MessageSquare className="h-5 w-5" />,
      action: () => router.push('/messenger'),
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'communication'
    },
    {
      id: 'voice-chat',
      label: 'Voice Chat',
      icon: <Phone className="h-5 w-5" />,
      action: () => router.push('/voice-chat'),
      color: 'bg-emerald-500 hover:bg-emerald-600',
      category: 'communication'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Users className="h-5 w-5" />,
      action: () => router.push('/contacts'),
      color: 'bg-teal-500 hover:bg-teal-600',
      category: 'communication'
    },

    // Productivity
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-5 w-5" />,
      action: () => router.push('/search'),
      color: 'bg-gray-500 hover:bg-gray-600',
      category: 'productivity',
      hotkey: 'S'
    },
    {
      id: 'diary',
      label: 'Diary',
      icon: <BookOpen className="h-5 w-5" />,
      action: () => router.push('/diary'),
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'productivity'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: <Briefcase className="h-5 w-5" />,
      action: () => router.push('/workflows'),
      color: 'bg-cyan-500 hover:bg-cyan-600',
      category: 'productivity'
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: <ShoppingBag className="h-5 w-5" />,
      action: () => router.push('/shopping'),
      color: 'bg-pink-500 hover:bg-pink-600',
      category: 'productivity'
    },

    // Media
    {
      id: 'photos',
      label: 'Photos',
      icon: <Camera className="h-5 w-5" />,
      action: () => router.push('/photo-album'),
      color: 'bg-violet-500 hover:bg-violet-600',
      category: 'media'
    },
    {
      id: 'youtube',
      label: 'YouTube',
      icon: <Video className="h-5 w-5" />,
      action: () => router.push('/youtube'),
      color: 'bg-red-600 hover:bg-red-700',
      category: 'media'
    },

    // System
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      action: () => router.push('/settings'),
      color: 'bg-slate-500 hover:bg-slate-600',
      category: 'system'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <RefreshCw className="h-5 w-5" />,
      action: () => window.location.reload(),
      color: 'bg-blue-600 hover:bg-blue-700',
      category: 'system',
      hotkey: 'R'
    }
  ];

  // Quick system actions
  const systemActions: QuickAction[] = [
    {
      id: 'new-expense',
      label: 'Add Expense',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        // Trigger expense creation modal or navigate to add expense
        router.push('/expenses?action=add');
      },
      color: 'bg-green-500 hover:bg-green-600',
      category: 'productivity'
    },
    {
      id: 'new-event',
      label: 'New Event',
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        router.push('/calendar?action=add');
      },
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'productivity'
    },
    {
      id: 'quick-note',
      label: 'Quick Note',
      icon: <Edit className="h-4 w-4" />,
      action: () => {
        router.push('/diary?action=quick-note');
      },
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'productivity'
    },
    {
      id: 'voice-command',
      label: 'Voice Command',
      icon: <Mic className="h-4 w-4" />,
      action: () => {
        // Trigger voice navigation
        const event = new CustomEvent('activate-voice-navigation');
        window.dispatchEvent(event);
      },
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'system'
    }
  ];

  const allActions = [...defaultActions, ...systemActions, ...customActions];

  const categories = [
    { id: 'all', label: 'All', icon: <Zap className="h-4 w-4" /> },
    { id: 'navigation', label: 'Navigation', icon: <Navigation className="h-4 w-4" /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'productivity', label: 'Productivity', icon: <Target className="h-4 w-4" /> },
    { id: 'media', label: 'Media', icon: <Camera className="h-4 w-4" /> },
    { id: 'system', label: 'System', icon: <Settings className="h-4 w-4" /> }
  ];

  const filteredActions = selectedCategory === 'all' 
    ? allActions 
    : allActions.filter(action => action.category === selectedCategory);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Ctrl/Cmd + Shift + key
      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        const action = allActions.find(a => a.hotkey?.toLowerCase() === event.key.toLowerCase());
        if (action) {
          event.preventDefault();
          action.action();
        }
      }
      
      // Toggle panel with Ctrl/Cmd + Space
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
        event.preventDefault();
        setIsExpanded(!isExpanded);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allActions, isExpanded]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowCustomizeMenu(false);
      }
    };

    if (isExpanded || showCustomizeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, showCustomizeMenu]);

  const addCustomAction = (label: string, url: string, icon: string, color: string) => {
    const newAction: QuickAction = {
      id: `custom-${Date.now()}`,
      label,
      icon: <Globe className="h-5 w-5" />, // Default icon for custom actions
      action: () => {
        if (url.startsWith('http')) {
          window.open(url, '_blank');
        } else {
          router.push(url);
        }
      },
      color: color || 'bg-gray-500 hover:bg-gray-600',
      category: 'productivity'
    };

    setCustomActions([...customActions, newAction]);
    localStorage.setItem('quick-actions-custom', JSON.stringify([...customActions, newAction]));
  };

  // Load custom actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quick-actions-custom');
    if (saved) {
      try {
        setCustomActions(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading custom actions:', error);
      }
    }
  }, []);

  return (
    <div ref={panelRef} className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Main Toggle Button */}
      <div className="relative">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 ${
            isExpanded ? 'rotate-45' : 'rotate-0'
          }`}
        >
          {isExpanded ? (
            <Minus className="h-8 w-8" />
          ) : (
            <Plus className="h-8 w-8" />
          )}
        </Button>

        {/* Tooltip */}
        {!isExpanded && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Quick Actions (Ctrl+Space)
          </div>
        )}
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-6 w-80 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">Quick Actions</h3>
            </div>
            
            <Button
              onClick={() => setShowCustomizeMenu(!showCustomizeMenu)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Customize
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 mb-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            {filteredActions.slice(0, 12).map(action => (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  setIsExpanded(false);
                }}
                className={`${action.color} p-3 rounded-xl text-white flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg`}
                title={action.hotkey ? `${action.label} (Ctrl+Shift+${action.hotkey})` : action.label}
              >
                {action.icon}
                <span className="text-xs font-medium truncate w-full text-center">
                  {action.label}
                </span>
                {action.hotkey && (
                  <span className="text-xs opacity-75 bg-black/20 px-1 rounded">
                    {action.hotkey}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* More Actions Indicator */}
          {filteredActions.length > 12 && (
            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500">
                +{filteredActions.length - 12} more actions
              </span>
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Use Ctrl+Shift+Key for quick access
            </p>
          </div>
        </div>
      )}

      {/* Customize Menu */}
      {showCustomizeMenu && (
        <div className="absolute bottom-20 right-20 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64">
          <h4 className="font-semibold text-gray-800 mb-3">Customize Actions</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Action Label</label>
              <input
                type="text"
                placeholder="e.g., My App"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL or Path</label>
              <input
                type="text"
                placeholder="e.g., /my-page or https://example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Action
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustomizeMenu(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionsPanel;