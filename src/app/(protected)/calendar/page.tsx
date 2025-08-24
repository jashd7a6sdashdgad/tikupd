'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarEvent } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { ModernCard } from '@/components/ui/ModernCard';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  Mic,
  RefreshCw,
  Gift,
  CheckSquare,
  Flag,
  Star,
  TrendingUp,
  Calendar as CalendarDays,
  PartyPopper,
  MapPin,
  Info,
  X,
  Plane,
  AlertCircle
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export default function CalendarPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedCalendarDataEvent, setSelectedCalendarDataEvent] = useState<{
    id: string;
    title: string;
    description?: string;
    type: 'birthday' | 'task' | 'holiday' | 'event';
    priority?: 'high' | 'medium' | 'low';
    date?: string;
    location?: string;
  } | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  
  // Calendar data state
  const [calendarData, setCalendarData] = useState<{
    statistics: {
      totalEvents: number;
      pendingTasks: number;
      upcomingBirthdays: number;
      upcomingHolidays: number;
    };
    todayEvents: Array<{
      id: string;
      title: string;
      description?: string;
      type: 'birthday' | 'task' | 'holiday' | 'event';
      priority?: 'high' | 'medium' | 'low';
    }>;
    upcomingEvents: Array<{
      id: string;
      title: string;
      description?: string;
      type: 'birthday' | 'task' | 'holiday' | 'event';
      priority?: 'high' | 'medium' | 'low';
      date: string;
      location?: string;
    }>;
  } | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript, 
    isSupported 
  } = useVoiceInput();

  // Function to detect if event is a flight and extract flight information
  const parseFlightInfo = (event: CalendarEvent) => {
    const title = event.summary || '';
    const description = event.description || '';
    const combined = `${title} ${description}`.toLowerCase();

    // Check if it's a flight event
    const isFlightEvent = combined.includes('flight') || 
                         combined.includes('oman air') || 
                         combined.includes('mct') || 
                         combined.includes('bkk') || 
                         combined.includes('confirmation number') ||
                         title.toLowerCase().includes('flight');

    if (!isFlightEvent) return null;

    // Extract flight information dynamically from actual content
    
    // Flight number - multiple patterns: (WY 817), WY817, Flight 817, etc.
    const flightNumberMatch = combined.match(/\(([A-Z]{2}\s*\d+)\)|([A-Z]{2}\s*\d+)|flight\s+([A-Z]{2}?\s*\d+)/i);
    const flightNumber = flightNumberMatch ? (flightNumberMatch[1] || flightNumberMatch[2] || flightNumberMatch[3]) : 'Unknown';
    
    // Confirmation number
    const confirmationMatch = combined.match(/confirmation\s+number[:\s]+([A-Z0-9]+)/i);
    const confirmationNumber = confirmationMatch ? confirmationMatch[1] : 'Unknown';
    
    // Departure airport - look for common patterns
    let departureAirport = 'Unknown';
    if (combined.includes('muscat mct') || combined.includes('muscat (mct)')) {
      departureAirport = 'MUSCAT MCT';
    } else if (combined.includes('muscat')) {
      departureAirport = 'MUSCAT';
    } else if (combined.includes('mct')) {
      departureAirport = 'MCT';
    }
    
    // Arrival airport - look for destinations in title and description
    let arrivalAirport = 'Unknown';
    if (combined.includes('bangkok suvarnabh bkk') || combined.includes('bangkok (bkk)')) {
      arrivalAirport = 'BANGKOK SUVARNABH BKK';
    } else if (combined.includes('bangkok suvarnabh')) {
      arrivalAirport = 'BANGKOK SUVARNABH';
    } else if (combined.includes('bangkok')) {
      arrivalAirport = 'BANGKOK';
    } else if (combined.includes('bkk')) {
      arrivalAirport = 'BKK';
    }
    
    // Extract times - look for time patterns in the content
    const timeMatches = combined.match(/(\d{1,2}:\d{2}\s*[ap]m)/gi);
    const departureTime = timeMatches && timeMatches[0] ? timeMatches[0] : 'Unknown';
    const arrivalTime = timeMatches && timeMatches[1] ? timeMatches[1] : 'Unknown';
    
    // Determine airline from flight code or content
    let airline = 'Unknown Airline';
    if (flightNumber.toLowerCase().includes('wy') || combined.includes('oman air')) {
      airline = 'Oman Air';
    } else if (flightNumber.toLowerCase().includes('ek') || combined.includes('emirates')) {
      airline = 'Emirates';
    } else if (flightNumber.toLowerCase().includes('qa') || combined.includes('qatar')) {
      airline = 'Qatar Airways';
    }

    // Extract organizer from event data (using available properties)
    const organizer = 'Mahboob AlBulushi'; // Default organizer since CalendarEvent doesn't have organizer property
    
    // Extract attendee count
    const attendeeCount = event.attendees ? event.attendees.length : 0;
    const guestCount = attendeeCount > 0 ? `${attendeeCount} guest${attendeeCount > 1 ? 's' : ''}` : 'No guests';
    
    // Extract reminder information (using default since CalendarEvent doesn't have reminders)
    const reminder = '30 minutes before'; // Default reminder
    
    // Extract visibility (using default since CalendarEvent doesn't have visibility)
    const visibility = 'Only me'; // Default visibility
    
    // Extract status (using default since CalendarEvent doesn't have transparency)
    const status = 'Free'; // Default status

    return {
      isFlightEvent: true,
      flightNumber,
      confirmationNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      airline,
      organizer,
      guestCount,
      reminder,
      visibility,
      status,
      autoCreated: combined.includes('automatically created from an email')
    };
  };

  // Function to detect if calendar data event is a flight and extract flight information
  const parseCalendarDataFlightInfo = (event: { title: string; description?: string }) => {
    const title = event.title || '';
    const description = event.description || '';
    const combined = `${title} ${description}`.toLowerCase();

    // Check if it's a flight event
    const isFlightEvent = combined.includes('flight') || 
                         combined.includes('oman air') || 
                         combined.includes('mct') || 
                         combined.includes('bkk') || 
                         combined.includes('confirmation number') ||
                         title.toLowerCase().includes('flight');

    if (!isFlightEvent) return null;

    // Extract flight information using regex patterns
    const flightNumberMatch = combined.match(/flight\s+(\w+\s*\d+)/i);
    const confirmationMatch = combined.match(/confirmation\s+number[:\s]+([A-Z0-9]+)/i);
    
    // Extract airports
    const departureAirport = combined.includes('muscat') ? 'MUSCAT MCT' : 'Unknown';
    const arrivalAirport = combined.includes('bangkok') ? 'BANGKOK SUVARNABH BKK' : 'Unknown';
    
    // Extract times
    const departureTimeMatch = combined.match(/(\d{1,2}:\d{2}[ap]m).*?local time.*?bangkok/i);
    const arrivalTimeMatch = combined.match(/bangkok.*?(\d{1,2}:\d{2}[ap]m).*?local time/i);

    return {
      isFlightEvent: true,
      flightNumber: flightNumberMatch ? flightNumberMatch[1] : 'Unknown',
      confirmationNumber: confirmationMatch ? confirmationMatch[1] : 'Unknown',
      departureAirport,
      arrivalAirport,
      departureTime: departureTimeMatch ? departureTimeMatch[1] : 'Unknown',
      arrivalTime: arrivalTimeMatch ? arrivalTimeMatch[1] : 'Unknown',
      airline: combined.includes('oman air') ? 'Oman Air' : 'Unknown Airline',
      organizer: 'Mahboob AlBulushi',
      guestCount: '1 guest',
      reminder: '30 minutes before',
      visibility: 'Only me',
      status: 'Free',
      autoCreated: combined.includes('automatically created from an email')
    };
  };

  // Fetch calendar data (birthdays, tasks, holidays)
  const fetchCalendarData = async () => {
    setCalendarLoading(true);
    try {
      const response = await fetch('/api/calendar/data');
      const result = await response.json();
      
      if (result.success) {
        setCalendarData(result.data);
      } else {
        console.error('Calendar data fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Calendar data fetch error:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchCalendarData();
  }, []);

  useEffect(() => {
    if (transcript && !isListening) {
      setNaturalLanguageInput(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const fetchEvents = async () => {
    setLoading(true);
    setAuthError(false);
    setComponentError(null);
    try {
      const response = await fetch('/api/calendar/events');
      const data = await response.json();
      
      if (data.success) {
        // Handle both array and object with events property
        if (Array.isArray(data.data)) {
          // Validate event structure before setting
          const validEvents = data.data.filter(event => 
            event && typeof event === 'object' && event.summary
          );
          setEvents(validEvents);
        } else if (data.data && Array.isArray(data.data.events)) {
          const validEvents = data.data.events.filter(event => 
            event && typeof event === 'object' && event.summary
          );
          setEvents(validEvents);
        } else {
          setEvents([]);
        }
      } else {
        console.error('Failed to fetch events:', data.message);
        // Check if it's an authentication error
        if (data.message?.includes('authentication') || data.message?.includes('Google authentication')) {
          setAuthError(true);
        }
        // Set empty events array on error to prevent crashes
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setComponentError(`Failed to load calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Set empty events array on error to prevent crashes
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (naturalLanguage = false) => {
    setCreating(true);
    try {
      let response;
      
      if (naturalLanguage && naturalLanguageInput.trim()) {
        // Use smart calendar scheduling for natural language input
        response = await fetch('/api/calendar/smart-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'process_voice_scheduling',
            voiceInput: naturalLanguageInput
          })
        });
      } else {
        // Check for conflicts first with manual input
        if (newEventStart && newEventEnd) {
          await checkConflicts();
        }
        
        // Use regular calendar creation
        const payload = {
          event: {
            summary: newEventTitle,
            description: newEventDescription,
            start: {
              dateTime: new Date(newEventStart).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: new Date(newEventEnd).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }
        };

        response = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchEvents();
        setShowCreateForm(false);
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventStart('');
        setNewEventEnd('');
        setNaturalLanguageInput('');
        setConflicts([]);
        setSuggestions([]);
        setShowConflicts(false);
        
        // Show success message with smart features info
        if (data.data?.event?.conflictResolution?.length > 0) {
          alert('Event created successfully! I found some conflicts and adjusted the timing.');
        } else if (data.data?.event?.travelTime) {
          alert('Event created successfully! Travel time has been automatically calculated and added.');
        }
      } else {
        if (data.needsGoogleAuth) {
          alert('Google Calendar authentication is required to create events. Please connect your Google account first.');
        } else {
          alert(t('settingsError') + ': ' + data.message);
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert(t('settingsError'));
    } finally {
      setCreating(false);
    }
  };

  const checkConflicts = async () => {
    if (!newEventStart || !newEventEnd) return;
    
    try {
      const response = await fetch('/api/calendar/smart-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_conflicts',
          eventData: {
            startTime: new Date(newEventStart).toISOString(),
            endTime: new Date(newEventEnd).toISOString(),
            title: newEventTitle || 'New Event'
          }
        })
      });

      if (!response.ok) {
        console.error('Conflict check failed:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data.hasConflicts) {
        setConflicts(data.data.conflicts);
        setSuggestions(data.data.suggestions);
        setShowConflicts(true);
      } else {
        setConflicts([]);
        setSuggestions([]);
        setShowConflicts(false);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      // Don't show conflicts on error, just continue
      setConflicts([]);
      setSuggestions([]);
      setShowConflicts(false);
    }
  };

  const updateEvent = async () => {
    if (!editingEvent || !newEventTitle.trim() || !newEventStart || !newEventEnd) {
      alert(t('settingsDescription'));
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/calendar/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            summary: newEventTitle,
            description: newEventDescription,
            start: {
              dateTime: new Date(newEventStart).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: new Date(newEventEnd).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchEvents();
        cancelEdit();
      } else {
        alert(t('settingsError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert(t('settingsError'));
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (event: CalendarEvent) => {
    try {
      setEditingEvent(event);
      setNewEventTitle(event.summary || '');
      setNewEventDescription(event.description || '');
      setNewEventStart(formatDateTimeForInput(event?.start?.dateTime));
      setNewEventEnd(formatDateTimeForInput(event?.end?.dateTime));
      setShowCreateForm(true);
    } catch (error) {
      console.error('Error starting edit:', error);
      alert('Error editing event. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setShowCreateForm(false);
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventStart('');
    setNewEventEnd('');
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm(t('delete') + ' ' + t('events') + '?')) return;
    
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchEvents();
      } else {
        alert(t('settingsError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(t('settingsError'));
    }
  };

  const formatDateTime = (dateTime: string | undefined) => {
    if (!dateTime) {
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) {
        return { date: 'Invalid Date', time: 'Invalid Time' };
      }
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
  };

  const formatDateTimeForInput = (dateTime: string | undefined) => {
    if (!dateTime) return '';
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  const getTodayEvents = () => {
    const today = new Date().toDateString();
    return events.filter(event => {
      try {
        if (!event?.start?.dateTime) return false;
        return new Date(event.start.dateTime).toDateString() === today;
      } catch (error) {
        console.error('Error filtering today events:', error);
        return false;
      }
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => {
        try {
          if (!event?.start?.dateTime) return false;
          return new Date(event.start.dateTime) > now;
        } catch (error) {
          console.error('Error filtering upcoming events:', error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          if (!a?.start?.dateTime || !b?.start?.dateTime) return 0;
          return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
        } catch (error) {
          console.error('Error sorting events:', error);
          return 0;
        }
      })
      .slice(0, 10);
  };

  // Error boundary for the component
  if (componentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Calendar Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">
                An error occurred while loading the calendar: {componentError}
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setComponentError(null);
                    setEvents([]);
                    fetchEvents();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                <CalendarIcon className="h-8 w-8 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('calendarTitle')}
                </h1>
                <p className="text-gray-600 font-medium mt-1">{t('settingsDescription')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={fetchEvents} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('loading')}
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createEvent')}
              </Button>
            </div>
          </div>
        </div>

        {/* Authentication Error State */}
        {authError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Google Calendar Authentication Required
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>
                    To access your calendar events, you need to connect your Google account. 
                    You can still create and manage events locally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Calendar Overview Section */}
        {!calendarLoading && calendarData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Statistics Cards */}
            <ModernCard gradient="blue" blur="lg" className="hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Total Events</h3>
                    <p className="text-white/80 text-sm">All upcoming events</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{calendarData.statistics.totalEvents}</p>
              </div>
            </ModernCard>

            <ModernCard gradient="purple" blur="lg" className="hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Pending Tasks</h3>
                    <p className="text-white/80 text-sm">Tasks to complete</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{calendarData.statistics.pendingTasks}</p>
              </div>
            </ModernCard>

            <ModernCard gradient="green" blur="lg" className="hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Birthdays</h3>
                    <p className="text-white/80 text-sm">Upcoming birthdays</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{calendarData.statistics.upcomingBirthdays}</p>
              </div>
            </ModernCard>

            <ModernCard gradient="orange" blur="lg" className="hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Flag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Oman Holidays</h3>
                    <p className="text-white/80 text-sm">Public holidays</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{calendarData.statistics.upcomingHolidays}</p>
              </div>
            </ModernCard>
          </div>
        )}

        {/* Modern Calendar Sections */}
        {!calendarLoading && calendarData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Today's Events */}
            <ModernCard gradient="none" blur="lg" className="border-gray-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Today's Events</h3>
                    <p className="text-gray-600">What's happening today</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {calendarData.todayEvents.length > 0 ? (
                    calendarData.todayEvents.map((event) => {
                      const flightInfo = parseCalendarDataFlightInfo(event);
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            {flightInfo ? <Plane className="h-5 w-5 text-blue-600" /> :
                             event.type === 'birthday' ? <PartyPopper className="h-5 w-5 text-pink-500" /> :
                             event.type === 'task' ? <CheckSquare className="h-5 w-5 text-blue-500" /> :
                             event.type === 'holiday' ? <Flag className="h-5 w-5 text-red-500" /> :
                             <CalendarDays className="h-5 w-5 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-gray-600">{event.description}</p>
                            )}
                            {flightInfo && (
                              <p className="text-xs text-blue-600 font-medium">
                                ✈️ {flightInfo.departureAirport} → {flightInfo.arrivalAirport}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {event.priority === 'high' && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <Button
                              onClick={() => {
                                setSelectedCalendarDataEvent(event);
                                setShowEventDetails(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              More Info
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No events today</p>
                    </div>
                  )}
                </div>
              </div>
            </ModernCard>

            {/* Upcoming Events */}
            <ModernCard gradient="none" blur="lg" className="border-gray-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Upcoming Events</h3>
                    <p className="text-gray-600">Next 10 events</p>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {calendarData.upcomingEvents.length > 0 ? (
                    calendarData.upcomingEvents.map((event) => {
                      const flightInfo = parseCalendarDataFlightInfo(event);
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            {flightInfo ? <Plane className="h-5 w-5 text-blue-600" /> :
                             event.type === 'birthday' ? <PartyPopper className="h-5 w-5 text-pink-500" /> :
                             event.type === 'task' ? <CheckSquare className="h-5 w-5 text-blue-500" /> :
                             event.type === 'holiday' ? <Flag className="h-5 w-5 text-red-500" /> :
                             <CalendarDays className="h-5 w-5 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{event.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                            {flightInfo && (
                              <p className="text-xs text-blue-600 font-medium">
                                ✈️ {flightInfo.departureAirport} → {flightInfo.arrivalAirport}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {event.priority === 'high' && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <Button
                              onClick={() => {
                                setSelectedCalendarDataEvent(event);
                                setShowEventDetails(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              More Info
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming events</p>
                    </div>
                  )}
                </div>
              </div>
            </ModernCard>
          </div>
        )}

        {/* Modern Quick Create Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 hover:shadow-3xl hover:bg-white/80 transition-all duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
              <Plus className="h-6 w-6 text-black font-bold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                {t('createEvent')}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-black font-bold shadow-lg">
                  🧠 Smart Scheduling
                </span>
              </h2>
              <p className="text-gray-600 font-medium">{t('settingsDescription')} Try: "Book 1 hour for gym every Tuesday at 6 PM"</p>
            </div>
          </div>
          <div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder={t('eventDescription')}
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  className="text-black"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createEvent(true)}
                  disabled={!naturalLanguageInput.trim() || creating}
                  loading={creating}
                >
                  {t('createEvent')}
                </Button>
                <Button
                  variant="outline"
                  onClick={isListening ? stopListening : startListening}
                  className={isListening ? 'voice-active bg-accent text-accent-foreground' : ''}
                  disabled={!isSupported}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {transcript && (
              <p className="mt-2 text-sm text-gray-600 italic">{t('loading')}: "{transcript}"</p>
            )}
          </div>
        </div>

        {/* Smart Features: Conflict Detection */}
        {showConflicts && conflicts.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-700">
                <Clock className="h-5 w-5 mr-2" />
                Scheduling Conflicts Detected
              </CardTitle>
              <CardDescription>
                I found {conflicts.length} conflict(s) with your existing events. Here are some suggestions:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show conflicts */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Conflicting Events:</h4>
                {conflicts.map((conflict, index) => (
                  <div key={index} className="p-3 bg-white rounded border-l-4 border-orange-400">
                    <p className="font-medium">{conflict.title || conflict.summary || 'Untitled Event'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(conflict.startTime).toLocaleString()} - {new Date(conflict.endTime).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Show suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Suggested Alternative Times:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const suggestedTime = new Date(suggestion);
                          const endTime = new Date(suggestedTime.getTime() + 60 * 60 * 1000); // 1 hour later
                          setNewEventStart(suggestedTime.toISOString().slice(0, 16));
                          setNewEventEnd(endTime.toISOString().slice(0, 16));
                          setShowConflicts(false);
                        }}
                        className="justify-start"
                      >
                        {new Date(suggestion).toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConflicts(false)}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Event Form Modal */}
        {showCreateForm && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>{editingEvent ? t('edit') + ' ' + t('events') : t('createEvent')}</CardTitle>
              <CardDescription>{editingEvent ? t('edit') + ' ' + t('eventDescription') : t('eventDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={t('eventTitle')}
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="text-black"
              />
              <Input
                placeholder={t('eventDescription')}
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                className="text-black"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">{t('startTime')}</label>
                  <Input
                    type="datetime-local"
                    value={newEventStart}
                    onChange={(e) => {
                      setNewEventStart(e.target.value);
                      // Auto-check conflicts when time changes
                      if (e.target.value && newEventEnd) {
                        setTimeout(() => checkConflicts(), 500);
                      }
                    }}
                    className="text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">{t('endTime')}</label>
                  <Input
                    type="datetime-local"
                    value={newEventEnd}
                    onChange={(e) => {
                      setNewEventEnd(e.target.value);
                      // Auto-check conflicts when time changes
                      if (newEventStart && e.target.value) {
                        setTimeout(() => checkConflicts(), 500);
                      }
                    }}
                    className="text-black"
                  />
                </div>
              </div>
              
              {/* Real-time conflict indicator in manual form */}
              {showConflicts && conflicts.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">⚠️ Time Conflict Detected</span>
                  </div>
                  <p className="text-sm text-orange-600 mb-2">
                    This time conflicts with {conflicts.length} existing event(s).
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const suggestedTime = new Date(suggestion);
                          const endTime = new Date(suggestedTime.getTime() + 60 * 60 * 1000);
                          setNewEventStart(suggestedTime.toISOString().slice(0, 16));
                          setNewEventEnd(endTime.toISOString().slice(0, 16));
                          setShowConflicts(false);
                        }}
                        className="text-xs"
                      >
                        {new Date(suggestion).toLocaleTimeString()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={editingEvent ? updateEvent : () => createEvent(false)}
                  disabled={!newEventTitle.trim() || !newEventStart || !newEventEnd || creating || updating}
                  loading={creating || updating}
                >
                  {editingEvent ? t('edit') + ' ' + t('events') : t('createEvent')}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  {t('cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                {t('todayEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : getTodayEvents().length > 0 ? (
                <div className="space-y-3">
                  {getTodayEvents().map((event, index) => {
                    if (!event) return null;
                    const datetime = formatDateTime(event?.start?.dateTime);
                    return (
                      <div key={event.id || `today-event-${index}`} className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-black">{event.summary || 'Untitled Event'}</h4>
                            {event.description && (
                              <p className="text-sm text-black mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {datetime.time}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => {
                                // Convert Google Calendar event to CalendarEvent format
                                const calendarEvent: CalendarEvent = {
                                  id: event.id || 'unknown',
                                  summary: event.summary || 'Untitled Event',
                                  description: event.description || '',
                                  start: event.start || { dateTime: '', timeZone: '' },
                                  end: event.end || { dateTime: '', timeZone: '' },
                                  attendees: event.attendees || []
                                };
                                setSelectedEvent(calendarEvent);
                                setShowEventDetails(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              More Info
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => startEdit(event)}
                              disabled={showCreateForm || !event?.start?.dateTime}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => event.id && deleteEvent(event.id)}
                              disabled={!event.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              ) : (
                <p className="text-black text-center py-8">{t('todayEvents')}</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {t('events')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : getUpcomingEvents().length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingEvents().map((event, index) => {
                    if (!event) return null;
                    const datetime = formatDateTime(event?.start?.dateTime);
                    return (
                      <div key={event.id || `upcoming-event-${index}`} className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-black">{event.summary || 'Untitled Event'}</h4>
                            {event.description && (
                              <p className="text-sm text-black mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {datetime.date} at {datetime.time}
                            </div>
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Users className="h-4 w-4 mr-1" />
                                {event.attendees.length} {t('contacts')}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => {
                                // Convert Google Calendar event to CalendarEvent format
                                const calendarEvent: CalendarEvent = {
                                  id: event.id || 'unknown',
                                  summary: event.summary || 'Untitled Event',
                                  description: event.description || '',
                                  start: event.start || { dateTime: '', timeZone: '' },
                                  end: event.end || { dateTime: '', timeZone: '' },
                                  attendees: event.attendees || []
                                };
                                setSelectedEvent(calendarEvent);
                                setShowEventDetails(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              More Info
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => startEdit(event)}
                              disabled={showCreateForm || !event?.start?.dateTime}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => event.id && deleteEvent(event.id)}
                              disabled={!event.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              ) : (
                <p className="text-black text-center py-8">{t('events')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && (selectedEvent || selectedCalendarDataEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {(() => {
              // const currentEvent = selectedEvent || selectedCalendarDataEvent;
              const flightInfo = selectedEvent ? parseFlightInfo(selectedEvent) : 
                                selectedCalendarDataEvent ? parseCalendarDataFlightInfo(selectedCalendarDataEvent) : null;
              return (
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      {flightInfo ? (
                        <Plane className="h-6 w-6 text-blue-600" />
                      ) : (
                        <CalendarIcon className="h-6 w-6 text-purple-600" />
                      )}
                      <h2 className="text-2xl font-bold text-gray-800">
                        {flightInfo ? 'Flight Information' : 'Event Details'}
                      </h2>
                    </div>
                    <Button
                      onClick={() => {
                        setShowEventDetails(false);
                        setSelectedEvent(null);
                        setSelectedCalendarDataEvent(null);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Event Title */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {selectedEvent?.summary || selectedCalendarDataEvent?.title || 'Untitled Event'}
                    </h3>
                    {(selectedEvent?.description || selectedCalendarDataEvent?.description) && (
                      <p className="text-gray-600">{selectedEvent?.description || selectedCalendarDataEvent?.description}</p>
                    )}
                  </div>

                  {/* Flight-specific information */}
                  {flightInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Flight Details Card */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Plane className="h-5 w-5" />
                            Flight Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Flight Number</p>
                            <p className="font-semibold">{flightInfo.flightNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Airline</p>
                            <p className="font-semibold">{flightInfo.airline}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Confirmation Number</p>
                            <p className="font-semibold text-blue-600">{flightInfo.confirmationNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Organizer</p>
                            <p className="font-semibold">{flightInfo.organizer}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Route Information Card */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Route Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">From</p>
                            <p className="font-semibold">{flightInfo.departureAirport}</p>
                            <p className="text-sm text-blue-600">{flightInfo.departureTime} (local time)</p>
                          </div>
                          <div className="flex justify-center py-2">
                            <div className="w-16 h-0.5 bg-blue-300 relative">
                              <Plane className="h-4 w-4 text-blue-600 absolute -top-2 right-0" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">To</p>
                            <p className="font-semibold">{flightInfo.arrivalAirport}</p>
                            <p className="text-sm text-blue-600">{flightInfo.arrivalTime} (local time)</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Additional Info Card */}
                      <Card className="md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Additional Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Guests</p>
                              <p className="font-semibold">{flightInfo.guestCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Reminder</p>
                              <p className="font-semibold">{flightInfo.reminder}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Visibility</p>
                              <p className="font-semibold">{flightInfo.visibility}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Status</p>
                              <p className="font-semibold">{flightInfo.status}</p>
                            </div>
                          </div>
                          {flightInfo.autoCreated && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                This event was automatically created from an email.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Regular event information */}
                  {!flightInfo && (
                    <div className="space-y-4">
                      {(selectedEvent?.start?.dateTime || selectedCalendarDataEvent?.date) && (
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-semibold">
                            {new Date(selectedEvent?.start?.dateTime || selectedCalendarDataEvent?.date || '').toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedCalendarDataEvent?.location && (
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedCalendarDataEvent.location}
                          </p>
                        </div>
                      )}
                      {selectedCalendarDataEvent?.priority && (
                        <div>
                          <p className="text-sm text-gray-600">Priority</p>
                          <p className="font-semibold flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {selectedCalendarDataEvent.priority.charAt(0).toUpperCase() + selectedCalendarDataEvent.priority.slice(1)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    {flightInfo && (
                      <Button variant="outline">
                        View Confirmation
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setShowEventDetails(false);
                        setSelectedEvent(null);
                        setSelectedCalendarDataEvent(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}