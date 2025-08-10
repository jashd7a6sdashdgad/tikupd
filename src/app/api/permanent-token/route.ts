import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { tokenStorage } from '@/lib/storage/tokenStorage';

// Create a permanent token that will be saved to the local file system
export async function POST(request: NextRequest) {
  try {
    console.log('Creating permanent token for N8N...');
    
    // Generate a permanent token
    const permanentToken = {
      id: 'n8n-permanent',
      token: 'mpa_permanent_n8n_' + crypto.randomBytes(32).toString('hex'),
      name: 'N8N Permanent Token',
      permissions: ['*', 'read:expenses', 'write:expenses', 'read:emails', 'write:emails'],
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
    };
    
    // Load existing tokens
    const tokens = await tokenStorage.loadTokens();
    
    // Remove any existing permanent token
    const filteredTokens = tokens.filter(t => t.id !== 'n8n-permanent');
    
    // Add new permanent token
    filteredTokens.push(permanentToken);
    
    // Save tokens
    await tokenStorage.saveTokens(filteredTokens);
    console.log('Permanent token saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Permanent token created for N8N',
      token: permanentToken.token,
      expiresAt: permanentToken.expiresAt,
      usage: `Authorization: Bearer ${permanentToken.token}`
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
    const tokens = await tokenStorage.loadTokens();
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
      token: permanentToken.token,
      status: permanentToken.status,
      expiresAt: permanentToken.expiresAt,
      usage: `Authorization: Bearer ${permanentToken.token}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve permanent token'
    }, { status: 500 });
  }
}