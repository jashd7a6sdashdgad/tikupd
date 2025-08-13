import { cookies } from 'next/headers';

export async function getGoogleAccessToken() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('google_access_token')?.value;
    const rawRefreshToken = cookieStore.get('google_refresh_token')?.value;
    // Decode URL-encoded refresh token
    const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : null;

    console.log('🔍 Checking Google tokens:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });

    // If no access token, return null
    if (!accessToken && !refreshToken) {
      console.log('❌ No Google tokens found');
      return null;
    }

    // Test token validity
    if (accessToken) {
      try {
        const check = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
        if (check.ok) {
          console.log('✅ Access token is valid');
          return accessToken;
        } else {
          console.log('❌ Access token is invalid, attempting refresh');
        }
      } catch (error) {
        console.error('Error checking token validity:', error);
      }
    }

    // If invalid, try refresh
    if (refreshToken) {
      console.log('🔄 Refreshing access token...');
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Token refresh failed:', res.status, errorText);
          throw new Error(`Failed to refresh token: ${res.status}`);
        }
        
        const data = await res.json();
        accessToken = data.access_token;
        console.log('✅ Token refreshed successfully');

        // Update cookie
        if (accessToken) {
          cookieStore.set('google_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: data.expires_in || 3600
          });
          console.log('🍪 Updated access token cookie');
        }

        return accessToken;
      } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
      }
    }

    console.log('❌ No valid tokens available');
    return null;
  } catch (error) {
    console.error('Error in getGoogleAccessToken:', error);
    return null;
  }
}

// Export as named export to match the import in index.ts
export const googleTokens = {
  getGoogleAccessToken
};
