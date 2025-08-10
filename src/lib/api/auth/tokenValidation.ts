import { promises as fs } from 'fs';
import path from 'path';

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  expiresAt?: string;
}

export async function validateApiToken(authHeader: string | null): Promise<{ isValid: boolean; token?: ApiToken; error?: string }> {
  console.log('Validating API token, authHeader:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid auth header format');
    return { isValid: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Extracted token:', token.substring(0, 20) + '...');
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const tokensFile = path.join(dataDir, 'tokens.json');
    console.log('Looking for tokens file:', tokensFile);
    
    // Check if tokens file exists
    try {
      await fs.access(tokensFile);
      console.log('Tokens file exists');
    } catch {
      console.log('Tokens file does not exist');
      return { isValid: false, error: 'No tokens found' };
    }
    
    const tokensData = await fs.readFile(tokensFile, 'utf-8');
    const tokens: ApiToken[] = JSON.parse(tokensData);
    console.log('Loaded tokens:', tokens.length);
    console.log('Token details:', tokens.map(t => ({ id: t.id, name: t.name, status: t.status })));
    
    const foundToken = tokens.find(t => t.token === token && t.status === 'active');
    console.log('Found token:', foundToken ? { id: foundToken.id, name: foundToken.name } : 'null');
    
    if (!foundToken) {
      console.log('Token validation failed - token not found or inactive');
      return { isValid: false, error: 'Invalid or inactive token' };
    }
    
    // Check if token has expired
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

export function hasPermission(token: ApiToken, requiredPermission: string): boolean {
  return token.permissions.includes('*') || token.permissions.includes(requiredPermission);
} 