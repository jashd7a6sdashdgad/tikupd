import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== N8N DEBUG ENDPOINT ===');
    
    // Log all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
      console.log(`Header: ${key} = ${value}`);
    });
    
    // Get Authorization header specifically
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader);
    
    // Get request body
    let body = null;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (e) {
      console.log('No JSON body or invalid JSON');
    }
    
    // Return comprehensive debug info
    return NextResponse.json({
      success: true,
      message: 'N8N debug endpoint reached successfully',
      debug: {
        method: request.method,
        url: request.url,
        headers: headers,
        authorizationHeader: authHeader,
        hasAuthHeader: !!authHeader,
        authHeaderFormat: authHeader ? (authHeader.startsWith('Bearer ') ? 'correct' : 'incorrect') : 'missing',
        body: body,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('N8N debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}