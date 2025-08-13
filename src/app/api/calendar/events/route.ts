import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, GoogleCalendar } from '@/lib/google';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import jwt from 'jsonwebtoken';
import { parseNaturalLanguageDate, parseNaturalLanguageTime } from '@/lib/utils';
import { smartCalendar } from '@/lib/smartCalendar';
import { locationServices } from '@/lib/locationServices';

// Helper function to get Google auth from cookies
function getGoogleAuth(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (!accessToken) {
    throw new Error('Google authentication required');
  }
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken
  };
}

export async function GET(request: NextRequest) {
  let validToken: any = null;
  let authType = 'unknown';
  
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Try to validate as website JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
      validToken = {
        id: decoded.userId || '1',
        name: decoded.username || 'website-user',
        permissions: ['*'],
        email: decoded.email,
        type: 'website-jwt'
      };
      authType = 'website-jwt';
    } catch (jwtError: any) {
      // Try to validate as API token
      const validation = await validateApiToken(authHeader);
      
      if (!validation.isValid || !validation.token) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid token. Please check your API token or JWT.' 
          },
          { status: 401 }
        );
      }
      
      validToken = validation.token;
      authType = 'api-token';
      
      // Check permissions for API tokens
      if (!hasPermission(validToken, 'read:calendar')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions. Token requires read:calendar permission' 
          },
          { status: 403 }
        );
      }
    }
    
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    const calendar = new GoogleCalendar(googleTokens.access_token);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const paramTimeMin = searchParams.get('timeMin');
    const paramTimeMax = searchParams.get('timeMax');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    
    // List events - direct API call to avoid TypeScript issues
    const now = new Date();
    const timeMin = paramTimeMin || now.toISOString();
    const timeMax = paramTimeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${googleTokens.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status} ${response.statusText}`);
    }

    const eventsResponse = await response.json();
    const events = eventsResponse.items || [];
    
    return NextResponse.json({
      success: true,
      data: {
        events: events,
        total: events.length
      },
      message: 'Calendar events retrieved successfully',
      authType,
      token: {
        name: validToken.name,
        permissions: validToken.permissions,
        type: validToken.type
      }
    });
    
  } catch (error: any) {
    console.error('Calendar events GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to retrieve events'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    verifyToken(token);
    
    // Get Google authentication
    const auth = getGoogleAuth(request);
    const calendar = new GoogleCalendar(auth);
    
    const body = await request.json();
    
    // Handle natural language input with smart calendar
    if (body.naturalLanguage) {
      try {
        // Use smart calendar for natural language processing
        const schedulingResult = await smartCalendar.processVoiceScheduling(body.naturalLanguage);
        
        if (schedulingResult.confidence > 0.7) {
          // Create event with smart features
          const eventData = convertIntentToEventData(schedulingResult);
          const smartEvent = await smartCalendar.createEvent(eventData);
          
          // Convert to Google Calendar format and sync
          const googleEvent = await convertSmartEventToGoogle(smartEvent);
          const createdEvent = await calendar.createEvent(googleEvent);
          
          return NextResponse.json({
            success: true,
            data: createdEvent,
            smartFeatures: {
              conflictResolution: smartEvent.conflictResolution,
              travelTime: smartEvent.travelTime,
              preparationItems: smartEvent.preparationItems
            },
            message: 'Smart event created successfully with conflict detection and travel time!'
          });
        } else {
          // Fallback to basic parsing
          const event = parseNaturalLanguageEvent(body.naturalLanguage);
          if (!event) {
            return NextResponse.json(
              { success: false, message: 'Could not parse the event from natural language' },
              { status: 400 }
            );
          }
          body.event = event;
        }
      } catch (smartError) {
        console.error('Smart calendar processing failed:', smartError);
        // Fallback to basic parsing
        const event = parseNaturalLanguageEvent(body.naturalLanguage);
        if (!event) {
          return NextResponse.json(
            { success: false, message: 'Could not parse the event from natural language' },
            { status: 400 }
          );
        }
        body.event = event;
      }
    }
    
    // Enhanced regular event creation with smart features
    if (body.event) {
      const enhancedEvent = await enhanceEventWithSmartFeatures(body.event);
      const event = await calendar.createEvent(enhancedEvent.googleEvent);
      
      return NextResponse.json({
        success: true,
        data: event,
        smartFeatures: enhancedEvent.smartFeatures,
        message: 'Event created successfully'
      });
    }
    
  } catch (error: any) {
    console.error('Calendar events POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create event'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

// Helper function to parse natural language into calendar event
function parseNaturalLanguageEvent(input: string): any | null {
  try {
    const lowerInput = input.toLowerCase();
    
    // Extract title (everything before time/date indicators)
    const timeIndicators = ['at', 'on', 'next', 'tomorrow', 'today', 'this'];
    let title = input;
    for (const indicator of timeIndicators) {
      const index = lowerInput.indexOf(indicator);
      if (index > 0) {
        title = input.substring(0, index).trim();
        break;
      }
    }
    
    // Parse date
    const date = parseNaturalLanguageDate(input);
    if (!date) {
      return null;
    }
    
    // Parse time
    const time = parseNaturalLanguageTime(input);
    const startTime = new Date(date);
    
    if (time) {
      startTime.setHours(time.hour, time.minute, 0, 0);
    } else {
      // Default to current time if no time specified
      const now = new Date();
      startTime.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
    
    // Default 1 hour duration
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    
    return {
      summary: title,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      description: `Created from natural language: "${input}"`
    };
  } catch (error) {
    console.error('Error parsing natural language event:', error);
    return null;
  }
}

// Helper functions for smart calendar integration

function convertIntentToEventData(schedulingRequest: any): any {
  const { parsedIntent } = schedulingRequest;
  
  const eventData: any = {
    title: parsedIntent.title || 'Scheduled Event',
    category: parsedIntent.category || 'other',
    priority: 'medium',
    isRecurring: !!parsedIntent.recurrence,
    recurrenceRule: parsedIntent.recurrence
  };
  
  // Set start time
  if (parsedIntent.startTime) {
    eventData.startTime = parsedIntent.startTime;
  } else {
    eventData.startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  }
  
  // Set end time
  if (parsedIntent.endTime) {
    eventData.endTime = parsedIntent.endTime;
  } else if (parsedIntent.duration) {
    eventData.endTime = new Date(eventData.startTime.getTime() + parsedIntent.duration * 60 * 1000);
  } else {
    eventData.endTime = new Date(eventData.startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
  }
  
  // Set location if specified
  if (parsedIntent.location) {
    eventData.location = {
      address: parsedIntent.location,
      type: getLocationType(parsedIntent.location)
    };
  }
  
  return eventData;
}

function getLocationType(location: string): string {
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes('gym') || locationLower.includes('fitness')) return 'gym';
  if (locationLower.includes('office') || locationLower.includes('work')) return 'office';
  if (locationLower.includes('home')) return 'home';
  if (locationLower.includes('restaurant') || locationLower.includes('cafe')) return 'restaurant';
  
  return 'other';
}

async function convertSmartEventToGoogle(smartEvent: any): Promise<any> {
  return {
    summary: smartEvent.title,
    description: `${smartEvent.description || ''}\n\n${smartEvent.travelTime ? `🚗 Travel time: ${smartEvent.travelTime.estimatedDuration} minutes\n` : ''}${smartEvent.conflictResolution?.length > 0 ? '⚠️ Conflicts detected and resolved\n' : ''}🧠 Created with Smart Calendar`,
    start: {
      dateTime: smartEvent.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: smartEvent.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: smartEvent.location?.address,
    reminders: {
      useDefault: false,
      overrides: smartEvent.reminders?.map((r: any) => ({
        method: r.type === 'notification' ? 'popup' : r.type,
        minutes: r.minutesBefore
      })) || [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 60 }
      ]
    }
  };
}

async function enhanceEventWithSmartFeatures(baseEvent: any): Promise<{ googleEvent: any; smartFeatures: any }> {
  try {
    // Auto-detect location and add travel time
    const smartFeatures: any = {};
    
    // Enhance location if present
    if (baseEvent.location) {
      try {
        const locationData = await locationServices.resolveLocation(baseEvent.location);
        smartFeatures.resolvedLocation = locationData;
        
        // Calculate travel time
        const travelTime = await locationServices.calculateTravelTime(
          'Home', // Default origin - would be user configurable
          locationData,
          'driving'
        );
        
        if (travelTime) {
          smartFeatures.travelTime = travelTime;
          // Adjust description to include travel info
          baseEvent.description = `${baseEvent.description || ''}\n\n🚗 Travel time: ${travelTime.duration} minutes (${travelTime.mode})`;
        }
      } catch (locationError) {
        console.error('Location enhancement failed:', locationError);
      }
    }
    
    // Check for conflicts (simplified)
    const startTime = new Date(baseEvent.start.dateTime);
    const endTime = new Date(baseEvent.end.dateTime);
    const conflicts = await smartCalendar.detectConflicts({
      id: 'temp',
      title: baseEvent.summary,
      startTime,
      endTime
    } as any);
    
    if (conflicts.length > 0) {
      smartFeatures.conflicts = conflicts;
      baseEvent.description = `${baseEvent.description || ''}\n\n⚠️ Note: ${conflicts.length} potential conflict(s) detected`;
    }
    
    return {
      googleEvent: baseEvent,
      smartFeatures
    };
    
  } catch (error) {
    console.error('Smart enhancement failed:', error);
    return {
      googleEvent: baseEvent,
      smartFeatures: {}
    };
  }
}