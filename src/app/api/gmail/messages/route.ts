import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, Gmail } from '@/lib/google';

// Helper function to get Google auth from cookies or env
function getGoogleAuth(request: NextRequest) {
  // Try cookies first
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (accessToken) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }
  
  // Fallback to environment variables
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (envAccessToken) {
    return {
      access_token: envAccessToken,
      refresh_token: envRefreshToken
    };
  }
  
  throw new Error('Google authentication required');
}

export async function GET(request: NextRequest) {
  try {
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    
    // List messages - direct API call
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${googleTokens.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    const messagesData = await response.json();
    const messages = messagesData.messages || [];
    
    return NextResponse.json({
      success: true,
      data: {
        messages: messages,
        total: messages.length
      },
      message: 'Gmail messages retrieved successfully'
    });
    
  } catch (error: any) {
    console.error('Gmail messages GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to retrieve messages'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    
    const body = await request.json();
    const { to, subject, message, html } = body;
    
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'To, subject, and message are required' },
        { status: 400 }
      );
    }
    
    // Send email (Note: Gmail class would need sendMessage method)
    return NextResponse.json({
      success: true,
      message: 'Email sending not yet implemented - Gmail API integration needed'
    });
    
  } catch (error: any) {
    console.error('Gmail send error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send email'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // Delete message (Note: Gmail class would need deleteMessage method)
    return NextResponse.json({
      success: true,
      message: 'Message deletion not yet implemented - Gmail API integration needed'
    });
    
  } catch (error: any) {
    console.error('Gmail delete error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete message'
      },
      { status: error.message?.includes('authentication') ? 401 : 500 }
    );
  }
}