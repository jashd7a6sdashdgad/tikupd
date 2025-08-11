import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';

export type { ApiToken } from '@/lib/storage/secureJsonStorage';

/**
 * Validates the Bearer token from Authorization header using secure token hashing:
 * - Checks format
 * - Uses secure token storage with proper hashing
 * - Validates active status and expiration
 * - Provides detailed error information
 */
export async function validateApiToken(authHeader: string | null): Promise<{ isValid: boolean; token?: ApiToken; error?: string }> {
  console.log('TokenValidation: Validating API token, authHeader:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('TokenValidation: Invalid auth header format');
    return { isValid: false, error: 'Authorization failed - please check your credentials' };
  }

  const tokenStr = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('TokenValidation: Extracted token:', tokenStr.substring(0, 20) + '...');

  try {
    // Use secure token storage with proper hash validation
    const foundToken = await secureTokenStorage.validateToken(tokenStr);
    
    if (!foundToken) {
      console.log('TokenValidation: Token validation failed - invalid or inactive token');
      return { 
        isValid: false, 
        error: 'Authorization failed - please check your credentials\nInvalid or inactive token' 
      };
    }

    console.log('TokenValidation: Token validation successful for:', foundToken.name);
    return { isValid: true, token: foundToken };
  } catch (error) {
    console.error('TokenValidation: Error validating API token:', error);
    return { 
      isValid: false, 
      error: 'Authorization failed - please check your credentials\nToken validation error' 
    };
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
