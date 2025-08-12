import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing JWT authentication...');
    
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No Authorization header found',
        expected: 'Bearer TOKEN_HERE'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token:', token.substring(0, 30) + '...');
    console.log('JWT Secret from env:', process.env.JWT_SECRET);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
      console.log('✅ JWT decoded successfully:', decoded);
      
      return NextResponse.json({
        success: true,
        message: 'JWT authentication successful!',
        decoded: {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          exp: new Date(decoded.exp * 1000).toISOString(),
          isExpired: decoded.exp * 1000 < Date.now()
        }
      });

    } catch (jwtError: any) {
      console.log('❌ JWT validation failed:', jwtError.message);
      
      return NextResponse.json({
        success: false,
        error: 'JWT validation failed',
        details: {
          message: jwtError.message,
          tokenPreview: token.substring(0, 30) + '...',
          secretUsed: process.env.JWT_SECRET || 'punz'
        }
      }, { status: 401 });
    }

  } catch (error: any) {
    console.error('Test JWT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}