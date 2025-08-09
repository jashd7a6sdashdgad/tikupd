'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'none';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const gradientClasses = {
  blue: 'bg-gradient-to-br from-blue-50/80 to-indigo-100/80',
  purple: 'bg-gradient-to-br from-purple-50/80 to-pink-100/80',
  pink: 'bg-gradient-to-br from-pink-50/80 to-rose-100/80',
  green: 'bg-gradient-to-br from-green-50/80 to-emerald-100/80',
  orange: 'bg-gradient-to-br from-orange-50/80 to-amber-100/80',
  none: 'bg-white/90'
};

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl'
};

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export function ModernCard({
  children,
  className,
  hover = true,
  blur = 'lg',
  gradient = 'none',
  size = 'md',
  onClick
}: ModernCardProps) {
  return (
    <div
      className={cn(
        // Base styles
        'rounded-3xl border border-white/20 shadow-xl',
        // Background and blur
        gradientClasses[gradient],
        blurClasses[blur],
        // Sizing
        sizeClasses[size],
        // Hover effects
        hover && 'transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-black/10',
        // Interactive
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}