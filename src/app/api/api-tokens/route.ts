import { NextRequest, NextResponse } from 'next/server';
import { secureTokenStorage } from '@/lib/storage/secureJsonStorage';
import crypto from 'crypto';

// Generate a secure random token
function generateSecureToken(): string {
  return 'mpa_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/api-tokens - List all tokens
export async function GET() {
  try {
    await secureTokenStorage.cleanupExpiredTokens();
    const tokens = await secureTokenStorage.loadTokens();
    
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      permissions: token.permissions,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      status: token.status
    }));

    return NextResponse.json({ 
      success: true,
      data: safeTokens,
      total: safeTokens.length,
      message: 'API tokens retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching API tokens:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch API tokens',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/api-tokens - Create a new API token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions = ['read:expenses', 'write:expenses'], expiresInDays = 365 } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: 'Token name is required' 
      }, { status: 400 });
    }

    // Clean up expired tokens first
    await secureTokenStorage.cleanupExpiredTokens();
    
    // Generate token
    const plainToken = generateSecureToken();
    const id = crypto.randomUUID();
    
    // Calculate expiration date
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expiresInDays);
    const expiresAt = expDate.toISOString();

    // Create token object
    const tokenData = {
      id,
      name: name.trim(),
      permissions: Array.isArray(permissions) ? permissions : ['read:expenses'],
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'active' as const
    };

    // Save token with secure hashing
    await secureTokenStorage.createToken(plainToken, tokenData);

    return NextResponse.json({
      success: true,
      message: 'API token created successfully',
      data: {
        id: tokenData.id,
        token: plainToken, // Only shown once during creation
        name: tokenData.name,
        permissions: tokenData.permissions,
        createdAt: tokenData.createdAt,
        expiresAt: tokenData.expiresAt,
        status: tokenData.status,
        usage: `Bearer ${plainToken}`
      }
    });

  } catch (error) {
    console.error('Error creating API token:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create API token',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE /api/api-tokens - Delete a token
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId } = body;

    if (!tokenId) {
      return NextResponse.json({ 
        success: false,
        error: 'Token ID is required' 
      }, { status: 400 });
    }

    await secureTokenStorage.deleteToken(tokenId);
    
    return NextResponse.json({ 
      success: true,
      message: 'API token deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting API token:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete API token',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}