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
 * Wraps an API route handler with authentication support.
 * Supports token-based and session-based authentication.
 * Enforces required permissions if specified.
 */
export function withAuth(
  handler: AuthenticatedHandler,
  config: RouteConfig = {}
) {
  const {
    requireAuth = true,
    requiredPermission,
    allowTokenAuth = true,
    allowSessionAuth = true,
  } = config;

  return async (request: NextRequest) => {
    try {
      let isAuthenticated = false;
      let tokenAuth: any = null;
      let hasRequiredPermission = true;

      // If authentication is required
      if (requireAuth) {
        // Token-based authentication
        if (allowTokenAuth) {
          const auth = await authenticateWithToken(request);

          if (auth.error) {
            return NextResponse.json(
              {
                error: 'Authorization failed - please check your credentials',
                details: auth.error,
              },
              { status: 401 }
            );
          }

          if (auth.success && auth.token) {
            isAuthenticated = true;
            tokenAuth = auth.token;

            // Check for required permission if specified
            if (requiredPermission) {
              hasRequiredPermission = hasPermission(auth.token, requiredPermission);
            }
          }
        }

        // Optionally, you can add session-based authentication here
        // For now, focusing on token-based auth only

        if (!isAuthenticated) {
          return NextResponse.json(
            {
              error: 'Authentication required',
              message:
                'Please provide a valid API token via Authorization header, X-API-Key header, or token query parameter',
            },
            { status: 401 }
          );
        }

        if (!hasRequiredPermission) {
          return NextResponse.json(
            {
              error: 'Insufficient permissions',
              message: `Required permission: ${requiredPermission}`,
            },
            { status: 403 }
          );
        }
      }

      // Attach auth info in context
      const context = {
        authenticated: isAuthenticated,
        token: tokenAuth,
        user: tokenAuth
          ? {
              id: 'api-user',
              name: tokenAuth.name,
              type: 'api-token',
              permissions: tokenAuth.permissions,
            }
          : null,
      };

      // Call original handler with auth context
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
 * Preconfigured wrappers for common cases
 */
export const withTokenAuth = (
  handler: AuthenticatedHandler,
  permission?: string
) =>
  withAuth(handler, {
    requireAuth: true,
    requiredPermission: permission,
    allowTokenAuth: true,
    allowSessionAuth: false,
  });

export const withOptionalAuth = (handler: AuthenticatedHandler) =>
  withAuth(handler, {
    requireAuth: false,
    allowTokenAuth: true,
    allowSessionAuth: true,
  });

export const withPublicAccess = (handler: AuthenticatedHandler) =>
  withAuth(handler, {
    requireAuth: false,
  });