import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return new Response(`
        <html>
          <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2 style="color: #dc2626;">Authorization Failed</h2>
              <p>Error: ${error}</p>
              <p style="color: #6b7280;">You can close this window and try again.</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!code) {
      return new Response(`
        <html>
          <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2 style="color: #dc2626;">Missing Authorization Code</h2>
              <p style="color: #6b7280;">You can close this window and try again.</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.mahboobagents.fun'
      : 'http://localhost:3000';

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/youtube/auth/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return new Response(`
        <html>
          <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2 style="color: #dc2626;">Token Exchange Failed</h2>
              <p style="color: #6b7280;">Please try again or check your configuration.</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </div>
          </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Create response with success page
    const response = new Response(`
      <html>
        <head>
          <title>YouTube Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 20px;
              padding: 50px;
              text-align: center;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
              max-width: 500px;
              animation: slideIn 0.5s ease-out;
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #ff0000, #cc0000);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 30px;
              color: white;
              font-size: 36px;
              font-weight: bold;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 20px;
              font-size: 28px;
            }
            p {
              color: #6b7280;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .button {
              background: linear-gradient(135deg, #ff0000, #cc0000);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .countdown {
              color: #9ca3af;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">▶</div>
            <h1>YouTube Connected!</h1>
            <p>Your YouTube account has been successfully connected via OAuth2. You can now access your channel data, videos, and analytics.</p>
            <button class="button" onclick="window.close()">Close Window</button>
            <div class="countdown">This window will close automatically in <span id="countdown">10</span> seconds</div>
          </div>
          
          <script>
            let seconds = 10;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              seconds--;
              countdownElement.textContent = seconds;
              
              if (seconds <= 0) {
                clearInterval(timer);
                window.close();
              }
            }, 1000);
            
            // Also try to refresh the parent window
            if (window.opener) {
              try {
                window.opener.location.reload();
              } catch (e) {
                console.log('Could not refresh parent window');
              }
            }
          </script>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

    // Set secure HTTP-only cookies
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    const cookieStore = await cookies();

    cookieStore.set('youtube_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenData.expires_in || 3600,
      path: '/'
    });

    if (tokenData.refresh_token) {
      cookieStore.set('youtube_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
    }

    cookieStore.set('youtube_expires_at', expiresAt.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenData.expires_in || 3600,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`
      <html>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2 style="color: #dc2626;">Connection Failed</h2>
            <p>An error occurred while connecting to YouTube.</p>
            <p style="color: #6b7280;">Please try again or contact support.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 5000);
            </script>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}