import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { ENV_VARS } from '@/lib/env-validation';
import { getApiConfig, getSocialConfig } from '@/lib/config';

// Use validated environment variables
const socialConfig = getSocialConfig();
const { messengerApiUrl: MESSENGER_API_URL } = getApiConfig();
// Use single user token from .env.local for main account
const MESSENGER_USER_ACCESS_TOKEN = process.env.FACEBOOK_USER_TOKEN;
// Note: Messenger Business API requires a Facebook Page, not a personal account

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    
    if (!MESSENGER_USER_ACCESS_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        message: 'Messenger credentials not configured. Please set FACEBOOK_USER_TOKEN in your .env.local file.',
        error: 'MESSENGER_CONFIG_ERROR',
        note: 'Messenger Business API requires a Facebook Page, not a personal account'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'conversations';
    const limit = searchParams.get('limit') || '25';

    try {
      let data;
      
      switch (action) {
        case 'conversations':
          data = await getConversations(limit);
          break;
        case 'messages':
          const conversationId = searchParams.get('conversation_id');
          if (!conversationId) {
            return NextResponse.json({ 
              success: false, 
              message: 'Conversation ID is required for messages' 
            }, { status: 400 });
          }
          data = await getMessages(conversationId, limit);
          break;
        case 'profile':
          data = await getPageInfo();
          break;
        case 'connect':
          // Test connection by getting page info
          data = await getPageInfo();
          break;
        default:
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid action. Available: conversations, messages, profile, connect' 
          }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data,
        message: `Messenger ${action} retrieved successfully`,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Messenger API error:', error);
      return NextResponse.json({
        success: false,
        message: error.message || 'Failed to fetch Messenger data',
        userId: user.id,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Messenger route error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error'
    }, { status: error.message?.includes('Invalid token') ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    
    if (!MESSENGER_USER_ACCESS_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        message: 'Messenger credentials not configured. Please set FACEBOOK_USER_TOKEN in your .env.local file.',
        error: 'MESSENGER_CONFIG_ERROR',
        note: 'Messenger Business API requires a Facebook Page, not a personal account'
      }, { status: 500 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    try {
      let data;
      
      switch (action) {
        case 'send_message':
          if (!params.recipient_id || !params.message) {
            return NextResponse.json({ 
              success: false, 
              message: 'Recipient ID and message are required' 
            }, { status: 400 });
          }
          data = await sendMessage(params.recipient_id, params.message);
          break;
        case 'mark_read':
          if (!params.conversation_id) {
            return NextResponse.json({ 
              success: false, 
              message: 'Conversation ID is required' 
            }, { status: 400 });
          }
          data = await markAsRead(params.conversation_id);
          break;
        default:
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid action. Available: send_message, mark_read' 
          }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data,
        message: `Messenger ${action} completed successfully`,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Messenger POST error:', error);
      return NextResponse.json({
        success: false,
        message: error.message || 'Failed to perform Messenger action',
        userId: user.id,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Messenger POST route error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error'
    }, { status: error.message?.includes('Invalid token') ? 401 : 500 });
  }
}

// Helper functions for Messenger API calls
async function getConversations(limit: string) {
  // Messenger Business API requires a Facebook Page, not a personal account
  return {
    data: [],
    message: 'Messenger Business API requires a Facebook Page, not a personal account.',
    note: 'To use Messenger Business features, you need to connect your account to a Facebook Page.'
  };
}

async function getMessages(conversationId: string, limit: string) {
  // Messenger Business API requires a Facebook Page, not a personal account
  return {
    data: [],
    message: 'Messenger Business API requires a Facebook Page, not a personal account.',
    note: 'To use Messenger Business features, you need to connect your account to a Facebook Page.'
  };
}

async function getPageInfo() {
  // Messenger Business API requires a Facebook Page, not a personal account
  return {
    id: null,
    name: null,
    about: null,
    follower_count: 0,
    fan_count: 0,
    message: 'Messenger Business API requires a Facebook Page, not a personal account.',
    note: 'To use Messenger Business features, you need to connect your account to a Facebook Page.'
  };
}

async function sendMessage(recipientId: string, message: string) {
  // Messenger Business API requires a Facebook Page, not a personal account
  throw new Error('Messenger Business API requires a Facebook Page, not a personal account. To send messages, you need to connect your account to a Facebook Page.');
}

async function markAsRead(conversationId: string) {
  // Messenger Business API requires a Facebook Page, not a personal account
  throw new Error('Messenger Business API requires a Facebook Page, not a personal account. To mark messages as read, you need to connect your account to a Facebook Page.');
}