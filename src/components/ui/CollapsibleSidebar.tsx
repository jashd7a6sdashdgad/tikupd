'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  side?: 'left' | 'right';
  title?: string;
  icon?: React.ReactNode;
  width?: string;
  collapsedWidth?: string;
}

export function CollapsibleSidebar({
  children,
  className,
  defaultOpen = false,
  side = 'right',
  title,
  icon,
  width = 'w-80',
  collapsedWidth = 'w-12'
}: CollapsibleSidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const sideClasses = {
    left: {
      position: 'left-0',
      rounded: 'rounded-r-3xl',
      shadow: 'shadow-2xl shadow-black/10',
      chevron: isOpen ? ChevronLeft : ChevronRight,
      buttonPosition: isOpen ? 'right-4' : 'right-2'
    },
    right: {
      position: 'right-0',
      rounded: 'rounded-l-3xl',
      shadow: 'shadow-2xl shadow-black/10',
      chevron: isOpen ? ChevronRight : ChevronLeft,
      buttonPosition: isOpen ? 'left-4' : 'left-2'
    }
  };

  const ChevronIcon = sideClasses[side].chevron;

  return (
    <div
      className={cn(
        'fixed top-0 h-full z-40 transition-all duration-500 ease-out',
        sideClasses[side].position,
        isOpen ? width : collapsedWidth,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Backdrop blur background */}
      <div className={cn(
        'h-full bg-white/90 backdrop-blur-xl border border-white/20',
        sideClasses[side].rounded,
        sideClasses[side].shadow,
        'transition-all duration-500 ease-out'
      )}>
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 z-10',
            'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600',
            'hover:from-blue-600 hover:to-purple-700',
            'text-black font-bold shadow-lg transition-all duration-300',
            'flex items-center justify-center',
            'hover:scale-110 hover:shadow-blue-500/25',
            sideClasses[side].buttonPosition,
            isHovered && !isOpen && 'scale-110'
          )}
        >
          <ChevronIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        {(title || icon) && (
          <div className={cn(
            'p-6 border-b border-white/10 bg-gradient-to-r from-blue-50/50 to-purple-50/50',
            'transition-all duration-300',
            !isOpen && 'opacity-0 scale-95 pointer-events-none'
          )}>
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  {icon}
                </div>
              )}
              {title && isOpen && (
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {title}
                </h2>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'p-6 h-full overflow-y-auto transition-all duration-300',
          !isOpen && 'opacity-0 scale-95 pointer-events-none',
          (title || icon) && 'pt-0'
        )}>
          <div className={cn(
            'transition-all duration-500 delay-100',
            isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          )}>
            {children}
          </div>
        </div>

        {/* Collapsed state icon */}
        {!isOpen && icon && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg text-black font-bold">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}