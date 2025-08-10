import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Copying local tokens to Vercel storage...');
    
    // Read the local tokens file
    const localTokensPath = path.join(process.cwd(), 'data', 'tokens.json');
    const localTokensData = await fs.readFile(localTokensPath, 'utf-8');
    const localTokens = JSON.parse(localTokensData);
    
    console.log(`Found ${localTokens.length} local tokens`);
    
    // Find a good token for N8N (one with "*" permission or expenses permissions)
    const bestToken = localTokens.find(token => 
      token.status === 'active' && 
      (token.permissions.includes('*') || 
       (token.permissions.includes('read:expenses') && token.permissions.includes('write:expenses')))
    );
    
    if (!bestToken) {
      return NextResponse.json({
        success: false,
        error: 'No suitable active token found in local storage'
      });
    }
    
    // Check if token is not expired
    const now = new Date();
    if (bestToken.expiresAt && new Date(bestToken.expiresAt) <= now) {
      return NextResponse.json({
        success: false,
        error: 'Best token found is expired',
        token: {
          name: bestToken.name,
          expiresAt: bestToken.expiresAt
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Found working token from local storage',
      recommendedToken: {
        token: bestToken.token,
        name: bestToken.name,
        permissions: bestToken.permissions,
        expiresAt: bestToken.expiresAt,
        status: bestToken.status
      },
      instructions: {
        usage: `Bearer ${bestToken.token}`,
        forN8N: 'Use this exact value in your N8N Authorization header',
        note: 'Make sure there is a SPACE between "Bearer" and the token'
      },
      totalLocalTokens: localTokens.length
    });
    
  } catch (error) {
    console.error('Failed to read local tokens:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read local tokens',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return POST({} as NextRequest);
}