import { tokenStorage, ApiToken } from '@/lib/storage/tokenStorage';

export type { ApiToken } from '@/lib/storage/tokenStorage';

/**
 * Validates the Bearer token from Authorization header:
 * - Checks format
 * - Loads tokens from storage
 * - Finds active token matching the string
 * - Checks expiration
 */
export async function validateApiToken(authHeader: string | null): Promise<{ isValid: boolean; token?: ApiToken; error?: string }> {
  console.log('Validating API token, authHeader:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid auth header format');
    return { isValid: false, error: 'Missing or invalid authorization header' };
  }

  const tokenStr = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Extracted token:', tokenStr.substring(0, 20) + '...');

  try {
    const tokens = await tokenStorage.loadTokens();
    console.log('Loaded tokens count:', tokens.length);

    const foundToken = tokens.find(t => t.token === tokenStr && t.status === 'active');
    console.log('Found token:', foundToken ? { id: foundToken.id, name: foundToken.name } : 'null');

    if (!foundToken) {
      console.log('Token validation failed - token not found or inactive');
      return { isValid: false, error: 'Invalid or inactive token' };
    }

    if (foundToken.expiresAt && new Date(foundToken.expiresAt) < new Date()) {
      console.log('Token has expired');
      return { isValid: false, error: 'Token has expired' };
    }

    console.log('Token validation successful');
    return { isValid: true, token: foundToken };
  } catch (error) {
    console.error('Error validating API token:', error);
    return { isValid: false, error: 'Error validating token' };
  }
}

/**
 * Check if the token has the required permission.
 * Wildcards '*' grant all permissions.
 */
export function hasPermission(token: ApiToken, requiredPermission: string): boolean {
  return (
    token.permissions.includes('*') ||
    token.permissions.includes(requiredPermission)
  );
}
