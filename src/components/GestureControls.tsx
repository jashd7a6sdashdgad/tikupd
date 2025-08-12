'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Hand,
  Smartphone,
  Settings,
  Eye,
  EyeOff,
  Zap,
  Navigation,
  Command,
  RefreshCw,
  Home,
  Search,
  Calendar,
  Mail,
  DollarSign,
  Users,
  BarChart3,
  BookOpen,
  MessageSquare,
  Phone,
  Camera,
  ShoppingBag,
  Youtube,
  Facebook
} from 'lucide-react';

interface GestureConfig {
  id: string;
  name: string;
  description: string;
  gesture: string;
  action: () => void;
  enabled: boolean;
  icon?: React.ReactNode;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureControlsProps {
  className?: string;
  showIndicator?: boolean;
}

export const GestureControls: React.FC<GestureControlsProps> = ({
  className = '',
  showIndicator = true
}) => {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(true);
  const [showGestureIndicator, setShowGestureIndicator] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [gestureConfigs, setGestureConfigs] = useState<GestureConfig[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [gestureHistory, setGestureHistory] = useState<string[]>([]);

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchMoveRef = useRef<TouchPoint[]>([]);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current page context for dynamic gestures
  const getCurrentPage = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '';
  };

  // Default gesture configurations
  const defaultGestures: GestureConfig[] = [
    {
      id: 'swipe-right',
      name: 'Swipe Right',
      description: 'Go back to previous page',
      gesture: 'swipe-right',
      action: () => router.back(),
      enabled: true,
      icon: <ArrowLeft className="h-4 w-4" />
    },
    {
      id: 'swipe-left',
      name: 'Swipe Left',
      description: 'Go to next page or refresh',
      gesture: 'swipe-left',
      action: () => window.location.reload(),
      enabled: true,
      icon: <RefreshCw className="h-4 w-4" />
    },
    {
      id: 'swipe-up',
      name: 'Swipe Up',
      description: 'Context-aware navigation up',
      gesture: 'swipe-up',
      action: () => {
        const currentPage = getCurrentPage();
        console.log('🔥 SWIPE UP EXECUTED from:', currentPage);
        
        // Context-aware navigation based on current page
        if (currentPage.includes('/dashboard')) {
          console.log('📱 Navigating from dashboard to search');
          router.push('/search');
        } else if (currentPage.includes('/search')) {
          console.log('📱 Navigating from search to voice-chat');
          router.push('/voice-chat');
        } else if (currentPage.includes('/expenses')) {
          console.log('📱 Navigating from expenses to budget');
          router.push('/budget');
        } else {
          console.log('📱 Default navigation to dashboard');
          router.push('/dashboard');
        }
      },
      enabled: true,
      icon: <ArrowUp className="h-4 w-4" />
    },
    {
      id: 'swipe-down',
      name: 'Swipe Down',
      description: 'Context-aware navigation down',
      gesture: 'swipe-down',
      action: () => {
        const currentPage = getCurrentPage();
        console.log('🔥 SWIPE DOWN EXECUTED from:', currentPage);
        
        // Context-aware navigation based on current page
        if (currentPage.includes('/dashboard')) {
          console.log('📱 Navigating from dashboard to expenses');
          router.push('/expenses');
        } else if (currentPage.includes('/search')) {
          console.log('📱 Navigating from search to dashboard');
          router.push('/dashboard');
        } else {
          console.log('📱 Default navigation to search');
          router.push('/search');
        }
      },
      enabled: true,
      icon: <ArrowDown className="h-4 w-4" />
    },
    {
      id: 'double-tap',
      name: 'Double Tap',
      description: 'Refresh current page',
      gesture: 'double-tap',
      action: () => window.location.reload(),
      enabled: true,
      icon: <RefreshCw className="h-4 w-4" />
    },
    {
      id: 'long-press',
      name: 'Long Press',
      description: 'Show context menu or settings',
      gesture: 'long-press',
      action: () => setShowSettings(!showSettings),
      enabled: true,
      icon: <Settings className="h-4 w-4" />
    },
    {
      id: 'two-finger-swipe-up',
      name: 'Two-Finger Swipe Up',
      description: 'Go to calendar',
      gesture: 'two-finger-swipe-up',
      action: () => router.push('/calendar'),
      enabled: true,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'two-finger-swipe-down',
      name: 'Two-Finger Swipe Down',
      description: 'Go to expenses',
      gesture: 'two-finger-swipe-down',
      action: () => router.push('/expenses'),
      enabled: true,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      id: 'three-finger-tap',
      name: 'Three-Finger Tap',
      description: 'Open voice navigation',
      gesture: 'three-finger-tap',
      action: () => {
        const event = new CustomEvent('activate-voice-navigation');
        window.dispatchEvent(event);
      },
      enabled: true,
      icon: <Command className="h-4 w-4" />
    },
    {
      id: 'pinch-in',
      name: 'Pinch In',
      description: 'Zoom out or minimize content',
      gesture: 'pinch-in',
      action: () => {
        document.body.style.transform = 'scale(0.9)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 300);
      },
      enabled: false,
      icon: <ArrowDown className="h-4 w-4" />
    },
    {
      id: 'pinch-out',
      name: 'Pinch Out',
      description: 'Zoom in or maximize content',
      gesture: 'pinch-out',
      action: () => {
        document.body.style.transform = 'scale(1.1)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 300);
      },
      enabled: false,
      icon: <ArrowUp className="h-4 w-4" />
    }
  ];

  // Initialize gesture configurations
  useEffect(() => {
    const saved = localStorage.getItem('gesture-controls-config');
    if (saved) {
      try {
        const savedConfigs = JSON.parse(saved);
        setGestureConfigs(savedConfigs);
      } catch (error) {
        console.error('Error loading gesture configs:', error);
        setGestureConfigs(defaultGestures);
      }
    } else {
      setGestureConfigs(defaultGestures);
    }
  }, []);

  // Save configurations to localStorage
  const saveConfigurations = useCallback((configs: GestureConfig[]) => {
    setGestureConfigs(configs);
    localStorage.setItem('gesture-controls-config', JSON.stringify(configs));
  }, []);

  // Calculate distance between two points
  const calculateDistance = (point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate angle of swipe
  const calculateAngle = (start: TouchPoint, end: TouchPoint): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // Determine gesture from touch data
  const determineGesture = (
    touches: TouchList,
    startPoint: TouchPoint,
    movePoints: TouchPoint[]
  ): string => {
    const touchCount = touches.length;
    const endPoint = movePoints[movePoints.length - 1];
    
    if (!endPoint || !startPoint) return '';

    const distance = calculateDistance(startPoint, endPoint);
    const angle = calculateAngle(startPoint, endPoint);
    const duration = endPoint.timestamp - startPoint.timestamp;

    // Minimum distance for swipe recognition
    const minSwipeDistance = 50;
    
    if (distance < minSwipeDistance) {
      // Check for tap gestures
      if (duration < 300) {
        if (touchCount === 1) return 'tap';
        if (touchCount === 2) return 'two-finger-tap';
        if (touchCount === 3) return 'three-finger-tap';
      } else if (duration > 500) {
        return 'long-press';
      }
      return '';
    }

    // Determine swipe direction
    const getSwipeDirection = () => {
      if (angle >= -45 && angle <= 45) return 'right';
      if (angle >= 135 || angle <= -135) return 'left';
      if (angle >= 45 && angle <= 135) return 'down';
      if (angle >= -135 && angle <= -45) return 'up';
      return '';
    };

    const direction = getSwipeDirection();
    
    if (touchCount === 1) {
      return `swipe-${direction}`;
    } else if (touchCount === 2) {
      return `two-finger-swipe-${direction}`;
    } else if (touchCount === 3) {
      return `three-finger-swipe-${direction}`;
    }

    return '';
  };

  // Handle touch start
  const handleTouchStart = useCallback((event: Event) => {
    const touchEvent = event as TouchEvent;
    if (!isEnabled) return;

    console.log('👆 TOUCH START detected', touchEvent.touches.length, 'fingers');
    
    const touch = touchEvent.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    touchMoveRef.current = [];
    setCurrentGesture('');
    
    // Clear previous gesture timeout
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    
    // Show gesture indicator
    if (showIndicator) {
      setShowGestureIndicator(true);
    }
  }, [isEnabled, showIndicator]);

  // Handle touch move
  const handleTouchMove = useCallback((event: Event) => {
    const touchEvent = event as TouchEvent;
    if (!isEnabled || !touchStartRef.current) return;

    const touch = touchEvent.touches[0];
    const movePoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    touchMoveRef.current.push(movePoint);
    
    // Update current gesture indication
    const gesture = determineGesture(touchEvent.touches, touchStartRef.current, touchMoveRef.current);
    if (gesture) {
      setCurrentGesture(gesture);
    }
  }, [isEnabled]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: Event) => {
    const touchEvent = event as TouchEvent;
    if (!isEnabled || !touchStartRef.current) return;

    console.log('👆 TOUCH END detected');

    const gesture = determineGesture(
      touchEvent.changedTouches, 
      touchStartRef.current, 
      touchMoveRef.current
    );
    
    console.log('🎯 DETERMINED GESTURE:', gesture);
    
    if (gesture) {
      // Find and execute gesture action
      const gestureConfig = gestureConfigs.find(
        config => config.gesture === gesture && config.enabled
      );
      
      console.log('🎯 FOUND CONFIG:', gestureConfig);
      
      if (gestureConfig) {
        console.log('🎯 GESTURE DETECTED:', gesture);
        console.log('🎯 GESTURE CONFIG:', gestureConfig);
        console.log('🎯 ABOUT TO EXECUTE ACTION');
        
        setLastGesture(`${gestureConfig.name} executed`);
        setGestureHistory(prev => [gesture, ...prev.slice(0, 4)]);
        
        // Execute the action immediately with logging
        try {
          console.log('🚀 EXECUTING GESTURE ACTION NOW');
          gestureConfig.action();
          console.log('✅ GESTURE ACTION COMPLETED');
        } catch (error) {
          console.error('❌ GESTURE ACTION FAILED:', error);
          setLastGesture(`Error executing ${gestureConfig.name}`);
        }
        
        // Provide haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else {
        console.log('❌ GESTURE NOT CONFIGURED:', gesture);
        setLastGesture(`Gesture "${gesture}" not configured`);
      }
    }
    
    // Reset state
    touchStartRef.current = null;
    touchMoveRef.current = [];
    setCurrentGesture('');
    setShowGestureIndicator(false);
    
    // Auto-hide feedback after 2 seconds
    gestureTimeoutRef.current = setTimeout(() => {
      setLastGesture('');
    }, 2000);
  }, [isEnabled, gestureConfigs]);

  // Handle double tap detection
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout>();

  const handleClick = useCallback((event: Event) => {
    if (!isEnabled) return;

    setTapCount(prev => prev + 1);

    if (tapTimer) {
      clearTimeout(tapTimer);
    }

    const timer = setTimeout(() => {
      if (tapCount === 1) {
        // Single tap - do nothing special
      } else if (tapCount >= 2) {
        // Double tap detected
        const doubleClickConfig = gestureConfigs.find(
          config => config.gesture === 'double-tap' && config.enabled
        );
        if (doubleClickConfig) {
          doubleClickConfig.action();
          setLastGesture('Double tap executed');
        }
      }
      setTapCount(0);
    }, 300);

    setTapTimer(timer);
  }, [isEnabled, gestureConfigs, tapCount, tapTimer]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current || document;
    
    if (isEnabled) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
      container.addEventListener('click', handleClick);
    }

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('click', handleClick);
    };
  }, [isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleClick]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
      if (tapTimer) {
        clearTimeout(tapTimer);
      }
    };
  }, [tapTimer]);

  const toggleGesture = (gestureId: string) => {
    const updatedConfigs = gestureConfigs.map(config =>
      config.id === gestureId
        ? { ...config, enabled: !config.enabled }
        : config
    );
    saveConfigurations(updatedConfigs);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Gesture Indicator */}
      {showGestureIndicator && currentGesture && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium animate-fade-in backdrop-blur-sm">
            <Hand className="h-4 w-4 inline mr-2" />
            {currentGesture.replace('-', ' ').toUpperCase()}
          </div>
        </div>
      )}

      {/* Last Gesture Feedback */}
      {lastGesture && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium animate-bounce">
            ✓ {lastGesture}
          </div>
        </div>
      )}

      {/* Gesture Controls Status/Settings */}
      <div className="fixed top-4 right-4 z-40">
        <div className="flex items-center gap-2">
          {/* Enable/Disable Toggle */}
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`p-2 rounded-full shadow-lg transition-all ${
              isEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
            title={`Gesture Controls ${isEnabled ? 'Enabled' : 'Disabled'}`}
          >
            {isEnabled ? <Hand className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/90 hover:bg-white text-gray-600 rounded-full shadow-lg transition-all"
            title="Gesture Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-14 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">Gesture Controls</h3>
            </div>

            <div className="space-y-3">
              {gestureConfigs.map(config => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {config.icon}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{config.name}</p>
                      <p className="text-xs text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleGesture(config.id)}
                    className={`w-10 h-6 rounded-full transition-all ${
                      config.enabled
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    } relative`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                        config.enabled ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Gesture History */}
            {gestureHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Gestures</h4>
                <div className="space-y-1">
                  {gestureHistory.map((gesture, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      {gesture}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Use touch gestures on mobile devices. Desktop users can simulate gestures with mouse clicks and movements.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureControls;