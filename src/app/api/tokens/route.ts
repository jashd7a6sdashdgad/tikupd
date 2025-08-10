import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { tokenStorage, ApiToken } from '@/lib/storage/tokenStorage';

// Generate a secure random token
function generateSecureToken(): string {
  return 'mpa_' + crypto.randomBytes(32).toString('hex');
}

// Clean up expired tokens
async function cleanupExpiredTokens(): Promise<void> {
  try {
    const tokens = await tokenStorage.loadTokens();
    const now = new Date();
    const validTokens = tokens.filter(token => {
      if (!token.expiresAt) return true; // No expiration
      return new Date(token.expiresAt) > now;
    });
    
    if (validTokens.length !== tokens.length) {
      console.log(`Cleaning up ${tokens.length - validTokens.length} expired tokens`);
      await tokenStorage.saveTokens(validTokens);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

// GET /api/tokens - List all tokens
export async function GET() {
  try {
    // Clean up expired tokens first
    await cleanupExpiredTokens();
    
    const tokens = await tokenStorage.loadTokens();
    
    // Return tokens without the actual token value for security
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      permissions: token.permissions,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      status: token.status
    }));

    return NextResponse.json({ tokens: safeTokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

// POST /api/tokens - Create a new token
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { name, permissions = [], expiresInDays } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Token name is required' }, { status: 400 });
    }

    // Clean up expired tokens first
    await cleanupExpiredTokens();
    
    // Load existing tokens
    const tokens = await tokenStorage.loadTokens();
    console.log('Loaded existing tokens:', tokens.length);
    
    // Generate token
    const token = generateSecureToken();
    const id = crypto.randomUUID();
    console.log('Generated token with ID:', id);
    
    // Calculate expiration date if specified
    let expiresAt: string | undefined;
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Create token object
    const newToken: ApiToken = {
      id,
      token,
      name: name.trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'active'
    };
    console.log('Created token object:', { id: newToken.id, name: newToken.name, permissions: newToken.permissions });

    // Add token and save
    tokens.push(newToken);
    console.log('Saving tokens...');
    console.log('Full token object being saved:', JSON.stringify(newToken, null, 2));
    await tokenStorage.saveTokens(tokens);
    console.log('Tokens saved successfully');

    // Return the token (only time it will be shown in full)
    return NextResponse.json({
      message: 'Token created successfully',
      token: {
        id: newToken.id,
        token: newToken.token, // Full token returned only on creation
        name: newToken.name,
        permissions: newToken.permissions,
        createdAt: newToken.createdAt,
        expiresAt: newToken.expiresAt,
        status: newToken.status
      }
    });

  } catch (error) {
    console.error('Error creating token:', error);
    console.error('Error details:', {
      name: body?.name,
      permissions: body?.permissions,
      expiresInDays: body?.expiresInDays,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ 
      error: 'Failed to create token',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE /api/tokens/[id] - Delete a token
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const tokenId = pathParts[pathParts.length - 1];

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    await tokenStorage.deleteToken(tokenId);
    return NextResponse.json({ message: 'Token deleted successfully' });

  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}

// PUT /api/tokens/[id] - Update a token
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const tokenId = pathParts[pathParts.length - 1];
    const body = await request.json();

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const tokens = await tokenStorage.loadTokens();
    const tokenIndex = tokens.findIndex(token => token.id === tokenId);
    
    if (tokenIndex === -1) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Update token
    const updatedToken = { ...tokens[tokenIndex], ...body };
    tokens[tokenIndex] = updatedToken;
    await tokenStorage.saveTokens(tokens);

    return NextResponse.json({ 
      message: 'Token updated successfully',
      token: {
        id: updatedToken.id,
        name: updatedToken.name,
        permissions: updatedToken.permissions,
        createdAt: updatedToken.createdAt,
        expiresAt: updatedToken.expiresAt,
        status: updatedToken.status
      }
    });

  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
  }
}

// Note: validateApiToken function has been moved to src/lib/api/auth/tokenValidation.ts

