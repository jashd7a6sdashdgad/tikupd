import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');

    if (accessToken) {
      // Revoke the token with Google
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken.value}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (error) {
        console.error('Token revocation failed:', error);
      }
    }

    // Clear all YouTube cookies
    const response = NextResponse.json({
      success: true,
      message: 'YouTube authentication revoked'
    });

    response.cookies.delete('youtube_access_token');
    response.cookies.delete('youtube_refresh_token');
    response.cookies.delete('youtube_expires_at');

    return response;

  } catch (error) {
    console.error('Revoke error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to revoke authentication'
    }, { status: 500 });
  }
}