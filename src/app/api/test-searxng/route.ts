import { NextResponse } from 'next/server';

// Test route to check SearXNG connectivity and image results
export async function GET() {
  try {
    console.log('Testing direct SearXNG connection...');
    
    // Test a simple image search
    const testQuery = 'beautiful sunset';
    const searxngUrl = `https://searxng.1000273.xyz/search?q=${encodeURIComponent(testQuery)}&categories=images&format=json&safesearch=1`;
    
    console.log('Fetching from:', searxngUrl);
    
    const response = await fetch(searxngUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MahboobPersonalAssistant-Test/1.0',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      return NextResponse.json({
        error: `SearXNG responded with ${response.status}: ${response.statusText}`,
        url: searxngUrl,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Log the structure
    console.log('Response structure:', {
      hasResults: !!data.results,
      resultCount: data.results ? data.results.length : 0,
      firstResult: data.results && data.results[0] ? {
        title: data.results[0].title,
        img_src: data.results[0].img_src,
        thumbnail_src: data.results[0].thumbnail_src,
        url: data.results[0].url,
        engine: data.results[0].engine
      } : null
    });

    return NextResponse.json({
      success: true,
      query: testQuery,
      resultCount: data.results ? data.results.length : 0,
      sampleResults: data.results ? data.results.slice(0, 3).map((result: any) => ({
        title: result.title,
        img_src: result.img_src,
        thumbnail_src: result.thumbnail_src,
        url: result.url,
        engine: result.engine,
        hasImageUrl: !!(result.img_src || result.thumbnail_src)
      })) : [],
      fullResponse: data
    });

  } catch (error) {
    console.error('SearXNG test error:', error);
    return NextResponse.json({
      error: 'Failed to connect to SearXNG',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}