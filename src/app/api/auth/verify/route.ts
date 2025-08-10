import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    // Check Authorization header presence and format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Basic token format validation (replace with your real validation)
    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // TODO: Replace this mock with real token validation & decoding
    // Example: decode JWT, verify signature, check expiration, fetch user info

    return NextResponse.json({
      valid: true,
      user: {
        id: 'mock-user-id',
        email: 'user@example.com',
        name: 'Mock User',
      },
      permissions: ['read', 'write'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
