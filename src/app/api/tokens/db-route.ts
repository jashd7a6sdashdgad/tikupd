import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

// Generate a secure random token
function generateSecureToken(): string {
  return 'mpa_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/tokens - List all tokens
export async function GET() {
  try {
    // Clean up expired tokens first
    await db.cleanupExpiredTokens();
    
    const tokens = await db.getTokens();
    
    // Return tokens without the token hash for security
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
    console.log('POST /api/tokens: Starting token creation with database...');
    const connectionInfo = db.getConnectionInfo();
    console.log('Database connection info:', connectionInfo);
    
    body = await request.json();
    const { name, permissions = [], expiresInDays } = body;
    console.log('Request body:', { name, permissions, expiresInDays });

    if (!name || typeof name !== 'string') {
      console.log('Validation failed: name is required and must be string');
      return NextResponse.json({ error: 'Token name is required' }, { status: 400 });
    }

    console.log('Starting cleanup of expired tokens...');
    // Clean up expired tokens first
    try {
      const cleanedCount = await db.cleanupExpiredTokens();
      console.log(`Expired tokens cleanup completed, removed ${cleanedCount} tokens`);
    } catch (cleanupError) {
      console.warn('Expired tokens cleanup failed, continuing:', cleanupError);
    }
    
    console.log('Generating new token...');
    // Generate token
    const plainToken = generateSecureToken();
    const id = crypto.randomUUID();
    console.log('Generated token with ID:', id);
    
    // Calculate expiration date if specified
    let expiresAt: string | undefined;
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Hash the token for secure storage
    const tokenHash = db.hashToken(plainToken);

    // Create token record for database
    const tokenRecord = {
      id,
      name: name.trim(),
      tokenHash,
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'active' as const
    };
    console.log('Created token record:', { id: tokenRecord.id, name: tokenRecord.name, permissions: tokenRecord.permissions });

    // Save token to database
    console.log('Saving token to database...');
    try {
      await db.addToken(tokenRecord);
      console.log('Token saved successfully to database');
      
      // Verify the save worked by trying to find the token
      const validationResult = await db.findTokenByHash(tokenHash);
      if (!validationResult) {
        console.warn('Token not found after save - database may have issues');
      } else {
        console.log('Token verified after save');
      }
    } catch (saveError) {
      console.error('Failed to save token to database:', saveError);
      throw new Error(`Token creation failed: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
    }

    // Return the token (only time it will be shown in full)
    // NOTE: The plain token is returned here for the user to copy
    // but is stored securely hashed in the database
    return NextResponse.json({
      message: 'Token created successfully',
      token: {
        id: tokenRecord.id,
        token: plainToken, // Full token returned only on creation
        name: tokenRecord.name,
        permissions: tokenRecord.permissions,
        createdAt: tokenRecord.createdAt,
        expiresAt: tokenRecord.expiresAt,
        status: tokenRecord.status
      }
    });

  } catch (error) {
    console.error('POST /api/tokens: Error creating token:', error);
    console.error('POST /api/tokens: Error details:', {
      name: body?.name,
      permissions: body?.permissions,
      expiresInDays: body?.expiresInDays,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Return more detailed error information for debugging
    return NextResponse.json({ 
      error: 'Failed to create token',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      storageType: 'Database'
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

    await db.deleteToken(tokenId);
    return NextResponse.json({ message: 'Token deleted successfully' });

  } catch (error) {
    console.error('Error deleting token:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
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

    // Update token (excluding sensitive fields like tokenHash)
    const allowedUpdates = {
      name: body.name,
      permissions: body.permissions,
      status: body.status,
      expiresAt: body.expiresAt
    };

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    await db.updateToken(tokenId, filteredUpdates);

    // Get updated token info
    const tokens = await db.getTokens();
    const updatedToken = tokens.find(token => token.id === tokenId);

    if (!updatedToken) {
      return NextResponse.json({ error: 'Token not found after update' }, { status: 404 });
    }

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
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
  }
}

// PATCH /api/tokens - Test endpoint to check database system
export async function PATCH(request: NextRequest) {
  try {
    console.log('PATCH /api/tokens: Testing database system...');
    
    // Test database connection
    const connectionInfo = db.getConnectionInfo();
    console.log('Database connection info:', connectionInfo);
    
    // Get database statistics
    const stats = await db.getStats();
    console.log('Database stats:', stats);
    
    // Test cleanup
    const cleanedCount = await db.cleanupExpiredTokens();
    console.log('Database test completed successfully');
    
    return NextResponse.json({ 
      message: 'Database test completed',
      connectionInfo,
      stats,
      cleanedTokens: cleanedCount,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasProcess: typeof process !== 'undefined',
        hasEnv: typeof process !== 'undefined' && !!process.env,
        cwd: typeof process !== 'undefined' ? process.cwd() : 'undefined'
      }
    });
  } catch (error) {
    console.error('PATCH /api/tokens: Database test failed:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}

/**
 * Validate API token for authentication
 * This function can be used by other API routes to validate incoming tokens
 */
export async function validateApiToken(token: string): Promise<{
  valid: boolean;
  tokenData?: any;
  error?: string;
}> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token format' };
    }

    // Hash the provided token and look it up in database
    const tokenHash = db.hashToken(token);
    const tokenRecord = await db.findTokenByHash(tokenHash);
    
    if (!tokenRecord) {
      return { valid: false, error: 'Token not found or expired' };
    }

    return { 
      valid: true, 
      tokenData: {
        id: tokenRecord.id,
        name: tokenRecord.name,
        permissions: tokenRecord.permissions,
        status: tokenRecord.status
      }
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { 
      valid: false, 
      error: 'Token validation failed' 
    };
  }
}