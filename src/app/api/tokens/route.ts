import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

// In-memory storage for tokens (in production, use a database)
const tokens: ApiToken[] = [];

// Generate a secure random token
function generateSecureToken(): string {
  return 'mpa_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/tokens - List all tokens
export async function GET() {
  try {
    // Return tokens without the actual token value for security
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      permissions: token.permissions,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      lastUsed: token.lastUsed,
      isActive: token.isActive
    }));

    return NextResponse.json({ tokens: safeTokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

// POST /api/tokens - Create a new token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions = [], expiresInDays } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Token name is required' }, { status: 400 });
    }

    // Generate token
    const token = generateSecureToken();
    const id = crypto.randomUUID();
    
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
      isActive: true
    };

    // Store token
    tokens.push(newToken);

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
        isActive: newToken.isActive
      }
    });

  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
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

    const tokenIndex = tokens.findIndex(token => token.id === tokenId);
    
    if (tokenIndex === -1) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Remove token
    tokens.splice(tokenIndex, 1);

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

    const tokenIndex = tokens.findIndex(token => token.id === tokenId);
    
    if (tokenIndex === -1) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Update allowed fields
    const { name, permissions, isActive } = body;
    
    if (name && typeof name === 'string') {
      tokens[tokenIndex].name = name.trim();
    }
    
    if (Array.isArray(permissions)) {
      tokens[tokenIndex].permissions = permissions;
    }
    
    if (typeof isActive === 'boolean') {
      tokens[tokenIndex].isActive = isActive;
    }

    return NextResponse.json({
      message: 'Token updated successfully',
      token: {
        id: tokens[tokenIndex].id,
        name: tokens[tokenIndex].name,
        permissions: tokens[tokenIndex].permissions,
        createdAt: tokens[tokenIndex].createdAt,
        expiresAt: tokens[tokenIndex].expiresAt,
        lastUsed: tokens[tokenIndex].lastUsed,
        isActive: tokens[tokenIndex].isActive
      }
    });

  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
  }
}

// Utility function to validate a token (used by other API routes)
function validateApiToken(tokenString: string): ApiToken | null {
  if (!tokenString || !tokenString.startsWith('mpa_')) {
    return null;
  }

  const token = tokens.find(t => 
    t.token === tokenString && 
    t.isActive &&
    (!t.expiresAt || new Date(t.expiresAt) > new Date())
  );

  if (token) {
    // Update last used timestamp
    token.lastUsed = new Date().toISOString();
  }

  return token || null;
}

