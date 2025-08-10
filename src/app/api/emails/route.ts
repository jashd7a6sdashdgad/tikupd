import { NextRequest, NextResponse } from 'next/server';
import { withTokenAuth } from '@/lib/apiWrapper';
import { PERMISSIONS } from '@/lib/tokenAuth';

// GET /api/emails - Read emails with token authentication
const getEmails = async (request: NextRequest, context: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '50';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Log API usage
    console.log(`[TOKEN AUTH] Emails accessed by: ${context?.token?.name || 'Unknown'}`);

    // Mock email data for N8N (replace with actual Gmail API integration)
    const mockEmails = [
      {
        id: 'email_1',
        threadId: 'thread_1',
        snippet: 'Your expense report has been processed',
        payload: {
          headers: [
            { name: 'From', value: 'noreply@bankmuscat.com' },
            { name: 'Subject', value: 'Bank Statement - Expense Alert' },
            { name: 'Date', value: new Date().toISOString() }
          ]
        },
        unread: true,
        category: 'finance',
        priority: 'high'
      },
      {
        id: 'email_2',
        threadId: 'thread_2',
        snippet: 'Meeting reminder for tomorrow',
        payload: {
          headers: [
            { name: 'From', value: 'calendar@gmail.com' },
            { name: 'Subject', value: 'Meeting Reminder' },
            { name: 'Date', value: new Date(Date.now() - 3600000).toISOString() }
          ]
        },
        unread: false,
        category: 'calendar',
        priority: 'medium'
      }
    ];

    let filteredEmails = mockEmails;

    // Apply filters
    if (unreadOnly) {
      filteredEmails = filteredEmails.filter(email => email.unread);
    }

    if (query) {
      filteredEmails = filteredEmails.filter(email => 
        email.snippet.toLowerCase().includes(query.toLowerCase()) ||
        email.payload.headers.some(header => 
          header.value.toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    // Apply limit
    const limit = parseInt(maxResults, 10);
    if (!isNaN(limit) && limit > 0) {
      filteredEmails = filteredEmails.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        emails: filteredEmails,
        totalCount: mockEmails.length,
        filteredCount: filteredEmails.length,
        unreadCount: mockEmails.filter(e => e.unread).length
      },
      meta: {
        query,
        maxResults: limit,
        unreadOnly,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch emails',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// POST /api/emails - Send email with token authentication
const sendEmail = async (request: NextRequest, context: any) => {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, priority = 'medium' } = body;

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['to', 'subject', 'body']
      }, { status: 400 });
    }

    // Log API usage
    console.log(`[TOKEN AUTH] Email sent by: ${context?.token?.name || 'Unknown'}`);

    // Mock email sending (replace with actual Gmail API integration)
    const emailId = `sent_${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        id: emailId,
        to,
        subject,
        body: emailBody,
        priority,
        sentAt: new Date().toISOString(),
        sentBy: context?.token?.name || 'API'
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// Export wrapped handlers
export const GET = withTokenAuth(getEmails, PERMISSIONS.READ_EMAILS);
export const POST = withTokenAuth(sendEmail, PERMISSIONS.WRITE_EMAILS);