import { promises as fs } from 'fs';
import path from 'path';

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  expiresAt: string;
}

export async function validateApiToken(authHeader: string | null): Promise<{ isValid: boolean; token?: ApiToken; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const tokensFile = path.join(dataDir, 'tokens.json');
    
    // Check if tokens file exists
    try {
      await fs.access(tokensFile);
    } catch {
      return { isValid: false, error: 'No tokens found' };
    }
    
    const tokensData = await fs.readFile(tokensFile, 'utf-8');
    const tokens: ApiToken[] = JSON.parse(tokensData);
    
    const foundToken = tokens.find(t => t.token === token && t.status === 'active');
    
    if (!foundToken) {
      return { isValid: false, error: 'Invalid or inactive token' };
    }
    
    // Check if token has expired
    if (foundToken.expiresAt && new Date(foundToken.expiresAt) < new Date()) {
      return { isValid: false, error: 'Token has expired' };
    }
    
    return { isValid: true, token: foundToken };
  } catch (error) {
    console.error('Error validating API token:', error);
    return { isValid: false, error: 'Error validating token' };
  }
}

export function hasPermission(token: ApiToken, requiredPermission: string): boolean {
  return token.permissions.includes('*') || token.permissions.includes(requiredPermission);
} 