import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'birthday' | 'task' | 'holiday' | 'event';
  description?: string | null;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'completed' | 'cancelled';
  location?: string | null;
}

interface CalendarData {
  upcomingEvents: CalendarEvent[];
  todayEvents: CalendarEvent[];
  thisWeekEvents: CalendarEvent[];
  thisMonthEvents: CalendarEvent[];
  statistics: {
    totalEvents: number;
    pendingTasks: number;
    upcomingBirthdays: number;
    upcomingHolidays: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Fetching calendar data from real sources...');

    // Get OAuth tokens from cookies
    const cookies = request.cookies;
    const accessToken = cookies.get('google_access_token')?.value;
    const refreshToken = cookies.get('google_refresh_token')?.value;

    const calendarEvents: CalendarEvent[] = [];

    // Fetch from Google Calendar if authenticated
    if (accessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Get events from primary calendar
        const now = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(now.getMonth() + 1);

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: now.toISOString(),
          timeMax: oneMonthLater.toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const googleEvents = response.data.items || [];
        
        calendarEvents.push(...googleEvents.map((event, index) => ({
          id: event.id || `google-${index}`,
          title: event.summary || 'Untitled Event',
          date: event.start?.date || event.start?.dateTime || now.toISOString(),
          type: determineEventType(event.summary || ''),
          description: event.description,
          location: event.location,
          status: 'pending' as const
        })));

        console.log(`✅ Fetched ${googleEvents.length} events from Google Calendar`);
      } catch (calendarError) {
        console.warn('⚠️ Google Calendar fetch failed:', calendarError);
      }
    }

    // Fetch Oman holidays from API
    try {
      const currentYear = new Date().getFullYear();
      const holidayResponse = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/OM`);
      
      if (holidayResponse.ok) {
        const holidays = await holidayResponse.json();
        
        calendarEvents.push(...holidays.map((holiday: any) => ({
          id: `holiday-${holiday.date}`,
          title: holiday.name,
          date: holiday.date,
          type: 'holiday' as const,
          description: `Public holiday in Oman`,
          status: 'pending' as const
        })));

        console.log(`✅ Fetched ${holidays.length} Oman holidays`);
      }
    } catch (holidayError) {
      console.warn('⚠️ Holiday API fetch failed:', holidayError);
    }

    // Add Mahboob AlBulushi birthday (from environment or config)
    const mahboobBirthday = process.env.MAHBOOB_BIRTHDAY;
    if (mahboobBirthday && mahboobBirthday !== 'your_birthday_here') {
      try {
        const [year, month, day] = mahboobBirthday.split('-');
        const currentYear = new Date().getFullYear();
        const nextBirthday = new Date(currentYear, parseInt(month) - 1, parseInt(day));
        
        // If birthday has passed this year, use next year
        if (nextBirthday < new Date()) {
          nextBirthday.setFullYear(currentYear + 1);
        }

        calendarEvents.push({
          id: 'mahboob-birthday',
          title: 'Mahboob AlBulushi Birthday',
          date: nextBirthday.toISOString().split('T')[0],
          type: 'birthday',
          description: 'Birthday celebration for Mahboob AlBulushi',
          priority: 'high',
          status: 'pending'
        });

        console.log(`✅ Added Mahboob AlBulushi birthday: ${nextBirthday.toDateString()}`);
      } catch (error) {
        console.warn('⚠️ Invalid birthday format in MAHBOOB_BIRTHDAY environment variable');
      }
    }

    // Fetch tasks from Google Sheets if authenticated
    if (accessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const spreadsheetId = process.env.GOOGLE_SHEETS_EXPENSES_ID;
        
        if (spreadsheetId) {
          // Try to fetch tasks from a "Tasks" sheet or similar
          const taskRanges = ['Tasks!A:E', 'ToDo!A:E', 'Task List!A:E'];
          
          for (const range of taskRanges) {
            try {
              const taskResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: range,
              });

              const taskRows = taskResponse.data.values || [];
              if (taskRows.length > 1) {
                const taskHeaders = taskRows[0];
                const taskData = taskRows.slice(1);
                
                // Find relevant columns
                const taskNameIndex = taskHeaders.findIndex(h => h && 
                  h.toLowerCase().includes('task') || h.toLowerCase().includes('title') || h.toLowerCase().includes('name'));
                const dueDateIndex = taskHeaders.findIndex(h => h && 
                  h.toLowerCase().includes('due') || h.toLowerCase().includes('date') || h.toLowerCase().includes('deadline'));
                const statusIndex = taskHeaders.findIndex(h => h && 
                  h.toLowerCase().includes('status') || h.toLowerCase().includes('complete'));
                const priorityIndex = taskHeaders.findIndex(h => h && 
                  h.toLowerCase().includes('priority'));

                taskData.forEach((row, index) => {
                  const taskName = row[taskNameIndex];
                  const dueDate = row[dueDateIndex];
                  const status = row[statusIndex];
                  const priority = row[priorityIndex];
                  
                  if (taskName && dueDate) {
                    try {
                      const parsedDate = new Date(dueDate);
                      if (!isNaN(parsedDate.getTime()) && parsedDate >= new Date()) {
                        calendarEvents.push({
                          id: `task-${index}`,
                          title: taskName,
                          date: parsedDate.toISOString().split('T')[0],
                          type: 'task',
                          description: `Task from Google Sheets`,
                          priority: priority?.toLowerCase() === 'high' ? 'high' : 'medium',
                          status: status?.toLowerCase().includes('complete') ? 'completed' : 'pending'
                        });
                      }
                    } catch (dateError) {
                      // Skip invalid dates
                    }
                  }
                });

                console.log(`✅ Fetched ${taskData.length} tasks from Google Sheets`);
                break; // Found tasks, no need to try other ranges
              }
            } catch (rangeError) {
              // Try next range
              continue;
            }
          }
        }
      } catch (taskError) {
        console.warn('⚠️ Task fetch from Google Sheets failed:', taskError);
      }
    }

    // Sort events by date
    calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter events by time periods
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const oneWeekLater = new Date();
    oneWeekLater.setDate(today.getDate() + 7);
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    const todayEvents = calendarEvents.filter(event => 
      event.date.split('T')[0] === todayStr
    );

    const thisWeekEvents = calendarEvents.filter(event => 
      new Date(event.date) <= oneWeekLater && new Date(event.date) >= today
    );

    const thisMonthEvents = calendarEvents.filter(event => 
      new Date(event.date) <= oneMonthLater && new Date(event.date) >= today
    );

    const upcomingEvents = calendarEvents.slice(0, 10); // Next 10 events

    // Calculate statistics
    const statistics = {
      totalEvents: calendarEvents.length,
      pendingTasks: calendarEvents.filter(e => e.type === 'task' && e.status === 'pending').length,
      upcomingBirthdays: calendarEvents.filter(e => e.type === 'birthday').length,
      upcomingHolidays: calendarEvents.filter(e => e.type === 'holiday').length
    };

    const calendarData: CalendarData = {
      upcomingEvents,
      todayEvents,
      thisWeekEvents,
      thisMonthEvents,
      statistics
    };

    console.log('✅ Calendar data compiled successfully');
    console.log(`📊 Statistics:`, statistics);

    return NextResponse.json({
      success: true,
      data: calendarData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Calendar data fetch error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch calendar data: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

function determineEventType(title: string): 'birthday' | 'task' | 'holiday' | 'event' {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('birthday') || titleLower.includes('birth')) {
    return 'birthday';
  }
  
  if (titleLower.includes('task') || titleLower.includes('todo') || 
      titleLower.includes('complete') || titleLower.includes('deadline')) {
    return 'task';
  }
  
  if (titleLower.includes('holiday') || titleLower.includes('national') || 
      titleLower.includes('public')) {
    return 'holiday';
  }
  
  return 'event';
}