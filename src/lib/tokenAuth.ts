import { NextRequest } from 'next/server';

export interface ApiToken {
  id: string;
  token: string;
  name: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  isActive: boolean;
}

// In-memory token store (replace with DB in production)
const tokens: ApiToken[] = [];

/**
 * Validate the token string:
 * - Must start with 'mpa_'
 * - Must be active, not expired
 * Updates lastUsed timestamp on success.
 */
export async function validateApiToken(tokenString: string): Promise<ApiToken | null> {
  if (!tokenString || !tokenString.startsWith('mpa_')) {
    return null;
  }

  // Find token in store
  const token = tokens.find(t =>
    t.token === tokenString &&
    t.isActive &&
    (!t.expiresAt || new Date(t.expiresAt) > new Date())
  );

  if (token) {
    // Update lastUsed timestamp
    token.lastUsed = new Date().toISOString();
    // TODO: persist update if using DB
    return token;
  }

  return null;
}

export interface TokenAuthResult {
  success: boolean;
  token?: ApiToken;
  error?: string;
}

/**
 * Extract API token from request headers or query string.
 */
export function extractApiToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  try {
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) return tokenParam;
  } catch {
    // ignore malformed URL error
  }

  return null;
}

/**
 * Authenticate the request using extracted token.
 */
export async function authenticateWithToken(request: NextRequest): Promise<TokenAuthResult> {
  try {
    const tokenString = extractApiToken(request);
    if (!tokenString) {
      return { success: false, error: 'No API token provided' };
    }

    const token = await validateApiToken(tokenString);
    if (!token) {
      return { success: false, error: 'Invalid or expired API token' };
    }

    return { success: true, token };
  } catch (error) {
    console.error('Token authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Check if token has the required permission.
 * Wildcards '*' or 'admin' grant all permissions.
 */
export function hasPermission(token: ApiToken, requiredPermission: string): boolean {
  if (!token.permissions || token.permissions.length === 0) {
    return true; // default allow if no permissions specified
  }

  return (
    token.permissions.includes(requiredPermission) ||
    token.permissions.includes('*') ||
    token.permissions.includes('admin')
  );
}

/**
 * Middleware helper for API routes:
 * Returns auth result and token if valid, else error info.
 */
export function requireApiToken(requiredPermission?: string) {
  return async (request: NextRequest) => {
    const auth = await authenticateWithToken(request);
    if (!auth.success) {
      return { authenticated: false, error: auth.error };
    }

    if (requiredPermission && auth.token && !hasPermission(auth.token, requiredPermission)) {
      return { authenticated: false, error: 'Insufficient permissions' };
    }

    return { authenticated: true, token: auth.token };
  };
}

/**
 * Constants for permissions.
 */
export const PERMISSIONS = {
  READ_EXPENSES: 'read:expenses',
  WRITE_EXPENSES: 'write:expenses',
  READ_EMAILS: 'read:emails',
  WRITE_EMAILS: 'write:emails',
  READ_CONTACTS: 'read:contacts',
  WRITE_CONTACTS: 'write:contacts',
  READ_CALENDAR: 'read:calendar',
  WRITE_CALENDAR: 'write:calendar',
  READ_DIARY: 'read:diary',
  WRITE_DIARY: 'write:diary',

  ADMIN: 'admin',
  WILDCARD: '*',

  READ_FACEBOOK: 'read:facebook',
  WRITE_FACEBOOK: 'write:facebook',
  READ_YOUTUBE: 'read:youtube',
  WRITE_YOUTUBE: 'write:youtube',

  AI_ASSISTANT: 'ai:assistant',
  VOICE_COMMANDS: 'voice:commands',
  WORKFLOWS: 'workflows',

  READ_ANALYTICS: 'read:analytics',
  READ_TRACKING: 'read:tracking',
} as const;

/**
 * Permission groups for easy assignment.
 */
export const PERMISSION_GROUPS = {
  READ_ONLY: [
    PERMISSIONS.READ_EXPENSES,
    PERMISSIONS.READ_EMAILS,
    PERMISSIONS.READ_CONTACTS,
    PERMISSIONS.READ_CALENDAR,
    PERMISSIONS.READ_DIARY,
    PERMISSIONS.READ_FACEBOOK,
    PERMISSIONS.READ_YOUTUBE,
    PERMISSIONS.READ_ANALYTICS,
    PERMISSIONS.READ_TRACKING,
  ],

  FULL_ACCESS: [PERMISSIONS.WILDCARD],

  N8N_AGENT: [
    PERMISSIONS.READ_EXPENSES,
    PERMISSIONS.WRITE_EXPENSES,
    PERMISSIONS.READ_EMAILS,
    PERMISSIONS.WRITE_EMAILS,
    PERMISSIONS.READ_CONTACTS,
    PERMISSIONS.WRITE_CONTACTS,
    PERMISSIONS.READ_CALENDAR,
    PERMISSIONS.WRITE_CALENDAR,
    PERMISSIONS.AI_ASSISTANT,
    PERMISSIONS.VOICE_COMMANDS,
    PERMISSIONS.WORKFLOWS,
    PERMISSIONS.READ_ANALYTICS,
  ],
};
