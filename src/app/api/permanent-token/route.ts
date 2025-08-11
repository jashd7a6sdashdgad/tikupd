import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';

// Create a permanent token that will be saved to the local file system
export async function POST(request: NextRequest) {
  try {
    console.log('Creating permanent token for N8N...');
    
    const plainToken = 'mpa_permanent_n8n_' + crypto.randomBytes(32).toString('hex');
    
    const permanentTokenData: Omit<ApiToken, 'tokenHash'> = {
      id: 'n8n-permanent',
      name: 'N8N Permanent Token',
      permissions: ['*', 'read:expenses', 'write:expenses', 'read:emails', 'write:emails'],
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
    };
    
    // Delete any existing permanent token first
    try {
      await secureTokenStorage.deleteToken('n8n-permanent');
      console.log('Existing permanent token deleted.');
    } catch (error) {
      // Ignore if it doesn't exist
    }
    
    // Create the new permanent token
    await secureTokenStorage.createToken(plainToken, permanentTokenData);
    console.log('Permanent token saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Permanent token created for N8N',
      token: plainToken, // Return the plain text token ONCE upon creation
      expiresAt: permanentTokenData.expiresAt,
      usage: `Authorization: Bearer ${plainToken}`
    });
    
  } catch (error) {
    console.error('Failed to create permanent token:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create permanent token',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tokens = await secureTokenStorage.loadTokens();
    const permanentToken = tokens.find(t => t.id === 'n8n-permanent');
    
    if (!permanentToken) {
      return NextResponse.json({
        success: false,
        message: 'No permanent token found. Create one using POST method.'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Permanent token found',
      status: permanentToken.status,
      expiresAt: permanentToken.expiresAt,
      // Note: The token value is not returned for security reasons.
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve permanent token'
    }, { status: 500 });
  }
}
