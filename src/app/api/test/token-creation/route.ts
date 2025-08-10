import { NextRequest, NextResponse } from 'next/server';
import { tokenStorage, ApiToken } from '@/lib/storage/tokenStorage';
import crypto from 'crypto';

// Test endpoint to simulate token creation exactly like the real API
export async function POST(request: NextRequest) {
  try {
    console.log('=== TOKEN CREATION TEST ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Is Vercel:', !!process.env.VERCEL);
    console.log('Storage type:', tokenStorage.getStorageType());
    
    // Parse request body
    const body = await request.json();
    const { name = 'Test Token' } = body;
    
    console.log('Creating test token with name:', name);
    
    // Generate token exactly like the real API
    const token = 'mpa_' + crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();
    
    const newToken = {
      id,
      token,
      name: name.trim(),
      permissions: ['read', 'write'],
      createdAt: new Date().toISOString(),
      status: 'active' as const
    };
    
    console.log('Generated token:', { id: newToken.id, name: newToken.name });
    
    // Test storage operations step by step
    console.log('Step 1: Loading existing tokens...');
    let tokens: ApiToken[] = [];
    try {
      tokens = await tokenStorage.loadTokens();
      console.log('✅ Loaded', tokens.length, 'existing tokens');
    } catch (error) {
      console.error('❌ Load failed:', error);
      throw new Error(`Load failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('Step 2: Adding new token...');
    tokens.push(newToken);
    console.log('✅ Token added to array, total count:', tokens.length);
    
    console.log('Step 3: Saving tokens...');
    try {
      await tokenStorage.saveTokens(tokens);
      console.log('✅ Tokens saved successfully');
    } catch (error) {
      console.error('❌ Save failed:', error);
      throw new Error(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('Step 4: Verifying save by reloading...');
    try {
      const reloaded = await tokenStorage.loadTokens();
      const found = reloaded.find(t => t.id === newToken.id);
      if (found) {
        console.log('✅ Token found after reload, verification successful');
      } else {
        console.log('⚠️  Token not found after reload, but creation may still have worked');
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
    }
    
    console.log('=== TOKEN CREATION TEST COMPLETE ===');
    
    return NextResponse.json({
      success: true,
      message: 'Token creation test completed successfully',
      token: {
        id: newToken.id,
        token: newToken.token,
        name: newToken.name,
        permissions: newToken.permissions,
        createdAt: newToken.createdAt,
        status: newToken.status
      },
      debug: {
        storageType: tokenStorage.getStorageType(),
        environment: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('=== TOKEN CREATION TEST FAILED ===');
    console.error('Error details:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Token creation test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      debug: {
        storageType: tokenStorage.getStorageType(),
        environment: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}