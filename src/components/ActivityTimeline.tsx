'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  Calendar,
  Mail,
  DollarSign,
  BookOpen,
  Camera,
  MessageSquare,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'calendar' | 'email' | 'expense' | 'diary' | 'photo' | 'voice' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
  metadata?: any;
}

interface ActivityTimelineProps {
  dashboardData: any;
  className?: string;
}

export default function ActivityTimeline({ dashboardData, className = '' }: ActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const generateTimelineEvents = (): TimelineEvent[] => {
    const timelineEvents: TimelineEvent[] = [];
    const now = new Date();

    // Add recent calendar events (actual events from data)
    if (dashboardData.allEvents?.length > 0) {
      // Get events from the last 7 days
      const recentEvents = dashboardData.allEvents.filter((event: any) => {
        const eventTime = new Date(event.start?.dateTime || event.start?.date);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return eventTime >= weekAgo && eventTime <= now;
      }).slice(0, 5); // Limit to 5 recent events

      recentEvents.forEach((event: any) => {
        const eventTime = new Date(event.start?.dateTime || event.start?.date);
        timelineEvents.push({
          id: `calendar-${event.id}`,
          type: 'calendar',
          title: event.summary || 'Untitled Event',
          description: `${eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.location || 'No location'}`,
          timestamp: eventTime,
          icon: <Calendar className="h-4 w-4" />,
          color: 'text-blue-600',
          metadata: { location: event.location, attendees: event.attendees?.length || 0 }
        });
      });
    }

    // Add email activity (only if we have real unread emails)
    if (dashboardData.unreadEmails > 0) {
      // Use a more realistic timestamp - within the last hour
      const emailTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      timelineEvents.push({
        id: 'email-recent',
        type: 'email',
        title: 'New Emails Received',
        description: `${dashboardData.unreadEmails} unread messages in your inbox`,
        timestamp: emailTime,
        icon: <Mail className="h-4 w-4" />,
        color: 'text-green-600',
        metadata: { count: dashboardData.unreadEmails }
      });
    }

    // Add recent expense entries (actual expenses from data)
    if (dashboardData.allExpenses?.length > 0) {
      // Get expenses from the last 7 days
      const recentExpenses = dashboardData.allExpenses
        .filter((expense: any) => {
          const expenseDate = new Date(expense.date);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= weekAgo && expenseDate <= now;
        })
        .slice(0, 5); // Limit to 5 recent expenses

      recentExpenses.forEach((expense: any, index: number) => {
        const expenseDate = new Date(expense.date);
        // Use actual expense date, but add some time variation for display
        const expenseTime = new Date(expenseDate.getTime() + index * 60 * 60 * 1000);
        
        const creditAmount = parseFloat(String(expense.creditAmount || '0'));
        const debitAmount = parseFloat(String(expense.debitAmount || '0'));
        const legacyAmount = parseFloat(String(expense.amount || '0'));
        const netAmount = (creditAmount || debitAmount) ? (debitAmount - creditAmount) : legacyAmount;

        timelineEvents.push({
          id: `expense-${expense.id || index}`,
          type: 'expense',
          title: `Expense: ${expense.category || 'General'}`,
          description: `${netAmount.toFixed(2)} OMR - ${expense.description || 'No description'}`,
          timestamp: expenseTime,
          icon: <DollarSign className="h-4 w-4" />,
          color: 'text-yellow-600',
          metadata: { amount: netAmount, category: expense.category }
        });
      });
    }

    // Only show dashboard access if we actually have recent activity
    if (timelineEvents.length > 0) {
      const loginTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
      timelineEvents.push({
        id: 'system-login',
        type: 'system',
        title: 'Dashboard Access',
        description: 'Logged into personal assistant dashboard',
        timestamp: loginTime,
        icon: <Activity className="h-4 w-4" />,
        color: 'text-purple-600'
      });
    }

    // Sort by timestamp (most recent first)
    return timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const refreshTimeline = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setEvents(generateTimelineEvents());
    setIsLoading(false);
  };

  useEffect(() => {
    setEvents(generateTimelineEvents());
  }, [dashboardData]);

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'calendar': return <Calendar className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'expense': return <DollarSign className="h-3 w-3" />;
      case 'diary': return <BookOpen className="h-3 w-3" />;
      case 'photo': return <Camera className="h-3 w-3" />;
      case 'voice': return <MessageSquare className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.type === filter);

  const eventTypes = [
    { id: 'all', label: 'All', count: events.length },
    { id: 'calendar', label: 'Calendar', count: events.filter(e => e.type === 'calendar').length },
    { id: 'email', label: 'Email', count: events.filter(e => e.type === 'email').length },
    { id: 'expense', label: 'Expenses', count: events.filter(e => e.type === 'expense').length },
    { id: 'photo', label: 'Photos', count: events.filter(e => e.type === 'photo').length }
  ].filter(type => type.count > 0);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-black">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshTimeline}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {eventTypes.map((type) => (
            <Button
              key={type.id}
              variant={filter === type.id ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter(type.id)}
              className="text-xs"
            >
              <div className="flex items-center gap-1">
                {getTypeIcon(type.id as TimelineEvent['type'])}
                {type.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {type.count}
                </Badge>
              </div>
            </Button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-black">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to show</p>
            </div>
          ) : (
            filteredEvents.slice(0, 10).map((event, index) => (
              <div key={event.id} className="flex items-start gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full bg-white border-2 ${event.color.replace('text-', 'border-')}`}>
                    <div className={event.color}>
                      {event.icon}
                    </div>
                  </div>
                  {index < filteredEvents.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2" />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-black">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="text-xs text-black ml-auto">
                      {getRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-black">
                    {event.description}
                  </p>
                  
                  {/* Metadata */}
                  {event.metadata && (
                    <div className="flex gap-2 mt-2">
                      {event.metadata.count && (
                        <Badge variant="secondary" className="text-xs">
                          {event.metadata.count} items
                        </Badge>
                      )}
                      {event.metadata.amount && (
                        <Badge variant="secondary" className="text-xs">
                          ${event.metadata.amount.toFixed(2)}
                        </Badge>
                      )}
                      {event.metadata.category && (
                        <Badge variant="secondary" className="text-xs">
                          {event.metadata.category}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {filteredEvents.length > 10 && (
          <div className="text-center mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              Load More Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}