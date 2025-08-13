import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import jwt from 'jsonwebtoken';

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
      if (!hasPermission(validToken, 'read:dashboard')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions. Token requires read:dashboard permission' 
          },
          { status: 403 }
        );
      }
    }

    // Get Google authentication from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
    const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;

    // Fetch data from various APIs
    let expensesData: any = null;
    let calendarData: any = null;
    let gmailData: any = null;

    // Fetch expenses data
    try {
      if (accessToken) {
        const expensesResponse = await fetch(`${new URL(request.url).origin}/api/expenses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': `google_access_token=${accessToken}${rawRefreshToken ? `; google_refresh_token=${rawRefreshToken}` : ''}`
          }
        });
        if (expensesResponse.ok) {
          const data = await expensesResponse.json();
          expensesData = data.data;
        }
      }
    } catch (error) {
      console.log('Failed to fetch expenses data:', error);
    }

    // Fetch calendar data
    try {
      if (accessToken) {
        const calendarResponse = await fetch(`${new URL(request.url).origin}/api/calendar/events`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': `google_access_token=${accessToken}${rawRefreshToken ? `; google_refresh_token=${rawRefreshToken}` : ''}`
          }
        });
        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          calendarData = data.data;
        }
      }
    } catch (error) {
      console.log('Failed to fetch calendar data:', error);
    }

    // Fetch Gmail data
    try {
      if (accessToken) {
        const gmailResponse = await fetch(`${new URL(request.url).origin}/api/gmail/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': `google_access_token=${accessToken}${rawRefreshToken ? `; google_refresh_token=${rawRefreshToken}` : ''}`
          }
        });
        if (gmailResponse.ok) {
          const data = await gmailResponse.json();
          gmailData = data.data;
        }
      }
    } catch (error) {
      console.log('Failed to fetch Gmail data:', error);
    }

    // Generate dashboard HTML
    const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mahboob Personal Assistant - Dashboard</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #2563eb; 
            font-size: 2.5rem;
            margin: 0;
            font-weight: 700;
        }
        .header p { 
            color: #666; 
            font-size: 1.1rem;
            margin-top: 10px;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px;
        }
        .card { 
            background: #fff; 
            border-radius: 12px; 
            padding: 25px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .card h3 { 
            color: #1f2937; 
            margin-top: 0;
            font-size: 1.3rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .icon {
            width: 24px;
            height: 24px;
            background: #3b82f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .stat {
            font-size: 2rem;
            font-weight: bold;
            color: #059669;
            margin: 10px 0;
        }
        .list-item {
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
            font-size: 0.9rem;
        }
        .list-item:last-child {
            border-bottom: none;
        }
        .auth-info {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .auth-info strong {
            color: #0369a1;
        }
        .no-data {
            color: #6b7280;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Mahboob Personal Assistant</h1>
            <p>Your AI-powered dashboard with real-time Google integrations</p>
        </div>

        <div class="auth-info">
            <strong>Authentication:</strong> ${authType} | 
            <strong>User:</strong> ${validToken.name} | 
            <strong>Google OAuth:</strong> ${accessToken ? '✅ Connected' : '❌ Not Connected'}
        </div>

        <div class="grid">
            <div class="card">
                <h3><span class="icon">💰</span>Expenses</h3>
                ${expensesData ? `
                    <div class="stat">${expensesData.total || 0} records</div>
                    <div>Total: ${expensesData.analytics?.total?.toFixed(2) || 0} OMR</div>
                    <div>Average: ${expensesData.analytics?.averageExpense?.toFixed(2) || 0} OMR</div>
                    <div style="margin-top: 15px;">
                        <strong>Recent transactions:</strong>
                        ${(expensesData.expenses || []).slice(0, 3).map((exp: any) => 
                            `<div class="list-item">${exp.description} - ${exp.amount} OMR</div>`
                        ).join('')}
                    </div>
                ` : '<div class="no-data">Unable to load expenses data</div>'}
            </div>

            <div class="card">
                <h3><span class="icon">📅</span>Calendar</h3>
                ${calendarData ? `
                    <div class="stat">${calendarData.events?.length || 0} events</div>
                    <div style="margin-top: 15px;">
                        <strong>Upcoming events:</strong>
                        ${(calendarData.events || []).slice(0, 3).map((event: any) => 
                            `<div class="list-item">${event.summary || 'Untitled Event'}</div>`
                        ).join('') || '<div class="list-item">No upcoming events</div>'}
                    </div>
                ` : '<div class="no-data">Unable to load calendar data</div>'}
            </div>

            <div class="card">
                <h3><span class="icon">📧</span>Gmail</h3>
                ${gmailData ? `
                    <div class="stat">${gmailData.messages?.length || 0} messages</div>
                    <div style="margin-top: 15px;">
                        <strong>Recent messages:</strong>
                        ${(gmailData.messages || []).slice(0, 3).map((msg: any) => 
                            `<div class="list-item">Message ID: ${msg.id}</div>`
                        ).join('') || '<div class="list-item">No messages found</div>'}
                    </div>
                ` : '<div class="no-data">Unable to load Gmail data</div>'}
            </div>

            <div class="card">
                <h3><span class="icon">⚡</span>System Status</h3>
                <div class="stat">✅ Online</div>
                <div>APIs: ${expensesData ? '✅' : '❌'} Expenses | ${calendarData ? '✅' : '❌'} Calendar | ${gmailData ? '✅' : '❌'} Gmail</div>
                <div>Auth Type: ${authType}</div>
                <div>Google OAuth: ${accessToken ? 'Connected' : 'Disconnected'}</div>
            </div>

            <div class="card">
                <h3><span class="icon">🔧</span>API Information</h3>
                <div><strong>Token Type:</strong> ${validToken.type}</div>
                <div><strong>Permissions:</strong> ${validToken.permissions.join(', ')}</div>
                <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>Status:</strong> All systems operational</div>
            </div>

            <div class="card">
                <h3><span class="icon">📊</span>Quick Stats</h3>
                <div>Dashboard loads: Real-time</div>
                <div>Last update: ${new Date().toLocaleString()}</div>
                <div>Data source: Live Google APIs</div>
                <div>Integration: N8N Compatible</div>
            </div>
        </div>

        <div class="footer">
            <p>🤖 Generated with Mahboob Personal Assistant API | ${new Date().toISOString()}</p>
            <p>For API documentation: <a href="/api/docs" style="color: #2563eb;">/api/docs</a></p>
        </div>
    </div>
</body>
</html>`;

    return new NextResponse(dashboardHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-API-Type': authType,
        'X-User': validToken.name
      }
    });

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to generate dashboard',
      error: 'DASHBOARD_API_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}