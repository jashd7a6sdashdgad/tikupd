// Use global fetch or import if needed
const globalFetch = typeof fetch !== 'undefined' ? fetch : globalThis.fetch;

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google/callback`;

if (!GOOGLE_CLIENT_ID) {
  console.error('❌ Missing Google OAuth credentials. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.');
}

// Generate Google OAuth authorization URL
export function getAuthUrl(): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID not configured');
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
  ];

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await globalFetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Token exchange failed:', errorData);
    throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Google Sheets Client
export async function getGoogleSheetsClient(tokens: { access_token: string; refresh_token: string }) {
  const { access_token } = tokens;
  
  return {
    spreadsheets: {
      values: {
        get: async ({ spreadsheetId, range }: { spreadsheetId: string; range: string }) => {
          const response = await globalFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
            {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
          }

          return { data: await response.json() };
        },
        update: async ({ spreadsheetId, range, valueInputOption, requestBody }: any) => {
          const response = await globalFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=${valueInputOption}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
          }

          return { data: await response.json() };
        },
        append: async ({ spreadsheetId, range, valueInputOption, requestBody }: any) => {
          const response = await globalFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=${valueInputOption}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
          }

          return { data: await response.json() };
        }
      }
    }
  };
}

// Generic authenticated client for Google APIs
export async function getAuthenticatedClient(tokens: { access_token: string; refresh_token: string }) {
  const { access_token } = tokens;
  
  return {
    request: async (url: string, options: RequestInit = {}) => {
      const response = await globalFetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      return response;
    }
  };
}

// Gmail client
export class Gmail {
  constructor(private accessToken: string) {}

  async getMessages(maxResults = 100) {
    const response = await globalFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUnreadCount() {
    const response = await globalFetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread',
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages ? data.messages.length : 0;
  }
}

// Google Calendar client
export class GoogleCalendar {
  constructor(private accessToken: string) {}

  async getEvents(maxResults = 100) {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    const response = await globalFetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// YouTube client
export class YouTube {
  constructor(private accessToken: string) {}

  async getChannelStats() {
    const response = await globalFetch(
      'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getVideos(maxResults = 50) {
    const response = await globalFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Google Drive client
export class GoogleDrive {
  constructor(private accessToken: string) {}

  async listFiles(pageSize = 100) {
    const response = await globalFetch(
      `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getFile(fileId: string) {
    const response = await globalFetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}