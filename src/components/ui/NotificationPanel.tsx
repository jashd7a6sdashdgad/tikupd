'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Bell, Calendar, Mail, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ModernCard } from './ModernCard';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  unread?: boolean;
  actionable?: boolean;
}

interface NotificationPanelProps {
  notifications?: NotificationItem[];
  className?: string;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
}

const typeConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-200/50',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-200/50',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-500'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50/50',
    borderColor: 'border-green-200/50',
    textColor: 'text-green-900',
    iconColor: 'text-green-500'
  },
  error: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50/50',
    borderColor: 'border-red-200/50',
    textColor: 'text-red-900',
    iconColor: 'text-red-500'
  }
};

const defaultNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'New Email Received',
    message: 'Important update from your bank regarding account security.',
    time: '2 minutes ago',
    type: 'info',
    unread: true,
    actionable: true
  },
  {
    id: '2',
    title: 'Meeting Reminder',
    message: 'Team standup meeting starts in 15 minutes.',
    time: '13 minutes ago',
    type: 'warning',
    unread: true
  },
  {
    id: '3',
    title: 'Expense Processed',
    message: 'Your lunch expense of $25.50 has been added successfully.',
    time: '1 hour ago',
    type: 'success',
    unread: false
  },
  {
    id: '4',
    title: 'Voice Command Completed',
    message: 'N8N workflow processed your voice command successfully.',
    time: '2 hours ago',
    type: 'info',
    unread: false
  }
];

export function NotificationPanel({
  notifications = defaultNotifications,
  className,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Smart Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">{unreadCount} unread</p>
            )}
          </div>
        </div>
        
        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            onClick={onMarkAllAsRead}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-200"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.map((notification) => {
          const config = typeConfig[notification.type];
          const IconComponent = config.icon;

          return (
            <div
              key={notification.id}
              className={cn(
                'p-4 rounded-2xl border transition-all duration-300 hover:scale-102 cursor-pointer relative',
                config.bgColor,
                config.borderColor,
                notification.unread && 'ring-2 ring-blue-300/30 shadow-md'
              )}
              onClick={() => onMarkAsRead?.(notification.id)}
            >
              {/* Dismiss button */}
              {onDismiss && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}

              <div className="flex items-start space-x-3 group">
                <div className={cn('flex-shrink-0 mt-1', config.iconColor)}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={cn('text-sm font-semibold truncate', config.textColor)}>
                      {notification.title}
                    </h4>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className={cn('text-sm opacity-80 mt-1 line-clamp-2', config.textColor)}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className={cn('text-xs opacity-60', config.textColor)}>
                      {notification.time}
                    </p>
                    {notification.actionable && (
                      <button className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/20">
        <button className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
          View All Notifications
        </button>
      </div>
    </div>
  );
}