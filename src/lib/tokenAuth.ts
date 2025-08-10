import { NextRequest } from 'next/server';

interface ApiToken {
  id: string;
  token: string;
  name: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  isActive: boolean;
}

// Import tokens from the API route (in production, this would use a database)
import { validateApiToken } from '@/app/api/tokens/route';

export interface TokenAuthResult {
  success: boolean;
  token?: ApiToken;
  error?: string;
}

/**
 * Extract API token from request headers
 */
export function extractApiToken(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');
  if (tokenParam) {
    return tokenParam;
  }

  return null;
}

/**
 * Authenticate request using API token
 */
export function authenticateWithToken(request: NextRequest): TokenAuthResult {
  try {
    const tokenString = extractApiToken(request);
    
    if (!tokenString) {
      return {
        success: false,
        error: 'No API token provided'
      };
    }

    const token = validateApiToken(tokenString);
    
    if (!token) {
      return {
        success: false,
        error: 'Invalid or expired API token'
      };
    }

    return {
      success: true,
      token
    };
  } catch (error) {
    console.error('Token authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Check if token has required permission
 */
export function hasPermission(token: ApiToken, requiredPermission: string): boolean {
  // If no permissions specified, grant full access
  if (!token.permissions || token.permissions.length === 0) {
    return true;
  }

  // Check for specific permission or wildcard
  return token.permissions.includes(requiredPermission) || 
         token.permissions.includes('*') ||
         token.permissions.includes('admin');
}

/**
 * Middleware function for API routes that require token authentication
 */
export function requireApiToken(requiredPermission?: string) {
  return (request: NextRequest) => {
    const auth = authenticateWithToken(request);
    
    if (!auth.success) {
      return { 
        authenticated: false, 
        error: auth.error 
      };
    }

    // Check permission if required
    if (requiredPermission && auth.token && !hasPermission(auth.token, requiredPermission)) {
      return { 
        authenticated: false, 
        error: 'Insufficient permissions' 
      };
    }

    return { 
      authenticated: true, 
      token: auth.token 
    };
  };
}

/**
 * Available permissions for tokens
 */
export const PERMISSIONS = {
  // Data access permissions
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
  
  // System permissions
  ADMIN: 'admin',
  WILDCARD: '*',
  
  // Social media permissions
  READ_FACEBOOK: 'read:facebook',
  WRITE_FACEBOOK: 'write:facebook',
  READ_YOUTUBE: 'read:youtube',
  WRITE_YOUTUBE: 'write:youtube',
  
  // AI and automation permissions
  AI_ASSISTANT: 'ai:assistant',
  VOICE_COMMANDS: 'voice:commands',
  WORKFLOWS: 'workflows',
  
  // Analytics permissions
  READ_ANALYTICS: 'read:analytics',
  READ_TRACKING: 'read:tracking'
} as const;

/**
 * Permission groups for easy assignment
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
    PERMISSIONS.READ_TRACKING
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
    PERMISSIONS.READ_ANALYTICS
  ]
};