import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'config';

    switch (testType) {
      case 'config':
        return NextResponse.json({
          success: true,
          data: {
            hasClientId: !!SPOTIFY_CLIENT_ID,
            hasClientSecret: !!SPOTIFY_CLIENT_SECRET,
            clientId: SPOTIFY_CLIENT_ID ? `${SPOTIFY_CLIENT_ID.slice(0, 8)}...` : 'Not set',
            environment: process.env.NODE_ENV,
            expectedRedirectUris: [
              'http://localhost:3000/api/music/spotify/callback',
              'https://www.mahboobagents.fun/api/music/spotify/callback',
              'https://mahboobagents.fun/api/music/spotify/callback'
            ]
          },
          message: 'Spotify configuration check'
        });

      case 'auth':
        if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
          return NextResponse.json({
            success: false,
            message: 'Spotify credentials not configured'
          }, { status: 400 });
        }

        // Test client credentials flow
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: 'grant_type=client_credentials'
          });

          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              success: true,
              data: {
                tokenReceived: !!data.access_token,
                tokenType: data.token_type,
                expiresIn: data.expires_in
              },
              message: 'Spotify API authentication successful'
            });
          } else {
            const errorData = await response.text();
            return NextResponse.json({
              success: false,
              data: {
                status: response.status,
                statusText: response.statusText,
                error: errorData
              },
              message: 'Spotify API authentication failed'
            }, { status: 400 });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Auth test failed: ${error.message}`
          }, { status: 500 });
        }

      case 'search':
        // Test search functionality
        try {
          const authResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: 'grant_type=client_credentials'
          });

          if (!authResponse.ok) {
            throw new Error('Failed to get access token');
          }

          const authData = await authResponse.json();
          
          const searchResponse = await fetch(
            'https://api.spotify.com/v1/search?q=test&type=track&limit=1',
            {
              headers: {
                'Authorization': `Bearer ${authData.access_token}`
              }
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            return NextResponse.json({
              success: true,
              data: {
                tracksFound: searchData.tracks?.items?.length || 0,
                sampleTrack: searchData.tracks?.items?.[0]?.name || 'None'
              },
              message: 'Spotify search test successful'
            });
          } else {
            const errorData = await searchResponse.text();
            return NextResponse.json({
              success: false,
              data: {
                status: searchResponse.status,
                error: errorData
              },
              message: 'Spotify search test failed'
            }, { status: 400 });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Search test failed: ${error.message}`
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid test type. Use: config, auth, or search'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Spotify test error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Test failed'
    }, { status: 500 });
  }
}