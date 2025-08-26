import { NextRequest, NextResponse } from 'next/server';

// API route to proxy SearXNG searches to avoid CORS issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const categories = searchParams.get('categories') || 'general';
    const format = searchParams.get('format') || 'json';
    const safesearch = searchParams.get('safesearch') || '1';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Build SearXNG API URL
    const searxngUrl = new URL('https://searxng.1000273.xyz/search');
    searxngUrl.searchParams.append('q', query);
    searxngUrl.searchParams.append('categories', categories);
    searxngUrl.searchParams.append('format', format);
    searxngUrl.searchParams.append('safesearch', safesearch);

    // Make request to SearXNG
    const response = await fetch(searxngUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'MahboobPersonalAssistant/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `SearXNG API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Add CORS headers to allow frontend access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    return NextResponse.json(data, { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}