import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithToken, hasPermission } from '@/lib/tokenAuth';

export interface AuthenticatedHandler {
  (request: NextRequest, context?: any): Promise<NextResponse> | NextResponse;
}

export interface RouteConfig {
  requireAuth?: boolean;
  requiredPermission?: string;
  allowTokenAuth?: boolean;
  allowSessionAuth?: boolean;
}

/**
 * Wraps an API route handler with authentication support
 * Supports both token-based and session-based authentication
 */
export function withAuth(
  handler: AuthenticatedHandler,
  config: RouteConfig = {}
) {
  const {
    requireAuth = true,
    requiredPermission,
    allowTokenAuth = true,
    allowSessionAuth = true
  } = config;

  return async (request: NextRequest) => {
    try {
      let isAuthenticated = false;
      let tokenAuth = null;
      let hasRequiredPermission = true;

      // If authentication is required
      if (requireAuth) {
        // Try token-based authentication first
        if (allowTokenAuth) {
          const auth = authenticateWithToken(request);
          if (auth.success && auth.token) {
            isAuthenticated = true;
            tokenAuth = auth.token;
            
            // Check permissions
            if (requiredPermission) {
              hasRequiredPermission = hasPermission(auth.token, requiredPermission);
            }
          }
        }

        // If token auth failed and session auth is allowed, could add session check here
        // For now, we'll focus on token auth for N8N

        // If still not authenticated and auth is required
        if (!isAuthenticated) {
          return NextResponse.json(
            { 
              error: 'Authentication required',
              message: 'Please provide a valid API token via Authorization header, X-API-Key header, or token query parameter'
            },
            { status: 401 }
          );
        }

        // Check permissions
        if (!hasRequiredPermission) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              message: `Required permission: ${requiredPermission}`
            },
            { status: 403 }
          );
        }
      }

      // Add authentication context to the request
      const context = {
        authenticated: isAuthenticated,
        token: tokenAuth,
        user: tokenAuth ? {
          id: 'api-user',
          name: tokenAuth.name,
          type: 'api-token',
          permissions: tokenAuth.permissions
        } : null
      };

      // Call the original handler
      return await handler(request, context);

    } catch (error) {
      console.error('API wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Pre-configured wrappers for common use cases
 */
export const withTokenAuth = (handler: AuthenticatedHandler, permission?: string) =>
  withAuth(handler, {
    requireAuth: true,
    requiredPermission: permission,
    allowTokenAuth: true,
    allowSessionAuth: false
  });

export const withOptionalAuth = (handler: AuthenticatedHandler) =>
  withAuth(handler, {
    requireAuth: false,
    allowTokenAuth: true,
    allowSessionAuth: true
  });

export const withPublicAccess = (handler: AuthenticatedHandler) =>
  withAuth(handler, {
    requireAuth: false
  });