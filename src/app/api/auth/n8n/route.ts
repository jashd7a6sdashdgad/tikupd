import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithToken } from '@/lib/tokenAuth';

/**
 * N8N Authentication endpoint
 * This endpoint allows N8N to authenticate and get user context
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate using token
    const auth = authenticateWithToken(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error, authenticated: false },
        { status: 401 }
      );
    }

    // Return authentication success with token info
    return NextResponse.json({
      authenticated: true,
      token: {
        name: auth.token?.name,
        permissions: auth.token?.permissions,
        lastUsed: auth.token?.lastUsed
      },
      user: {
        // Provide a virtual user context for N8N
        id: 'n8n-agent',
        name: 'N8N Agent',
        role: 'automation',
        permissions: auth.token?.permissions || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('N8N authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', authenticated: false },
      { status: 500 }
    );
  }
}

/**
 * Token validation endpoint for N8N workflows
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Authenticate using token
    const auth = authenticateWithToken(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error, authenticated: false },
        { status: 401 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'validate':
        return NextResponse.json({
          valid: true,
          token: auth.token?.name,
          permissions: auth.token?.permissions
        });

      case 'get_context':
        return NextResponse.json({
          user: {
            id: 'n8n-agent',
            name: 'N8N Agent',
            role: 'automation'
          },
          app: {
            name: 'Mahboob Personal Assistant',
            version: '1.0.0',
            features: {
              expenses: true,
              emails: true,
              contacts: true,
              calendar: true,
              diary: true,
              analytics: true,
              voice: true,
              ai: true
            }
          },
          permissions: auth.token?.permissions || []
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('N8N endpoint error:', error);
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}