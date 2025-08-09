import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ClickableIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel: string;
}

export const ClickableIcon = React.forwardRef<HTMLButtonElement, ClickableIconProps>(
  ({ icon: Icon, variant = 'default', size = 'md', ariaLabel, className, ...props }, ref) => {
    const baseClasses = 'clickable-icon';
    
    const variants = {
      default: 'clickable-icon-primary',
      primary: 'clickable-icon-primary',
      destructive: 'clickable-icon-destructive',
      success: 'clickable-icon-success'
    };
    
    const sizes = {
      sm: 'clickable-icon-sm',
      md: '',
      lg: 'clickable-icon-lg'
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          'force-purple-icon', // Add a class to ensure purple styling
          className
        )}
        aria-label={ariaLabel}
        {...props}
      >
        <Icon className={cn(iconSizes[size], 'text-purple-600')} />
      </button>
    );
  }
);

ClickableIcon.displayName = 'ClickableIcon';