import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';

// Helper function to get Google auth from cookies
function getGoogleAuth(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;
  
  if (!accessToken) {
    throw new Error('Google authentication required');
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
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
    const calendar = google.calendar({ version: 'v3', auth });
    
    const body = await request.json();
    const { eventId } = await params;
    
    // Update event
    const event = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: body.event
    });
    
    return NextResponse.json({
      success: true,
      data: event.data,
      message: 'Event updated successfully'
    });
    
  } catch (error: any) {
    console.error('Calendar event PUT error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update event'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
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
    const calendar = google.calendar({ version: 'v3', auth });
    
    const { eventId } = await params;
    
    // Delete event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Calendar event DELETE error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete event'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}