import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test SearXNG directly
    const response = await fetch('https://searxng.1000273.xyz/search?q=test&categories=images&format=json&safesearch=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DebugBot/1.0)',
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `SearXNG returned ${response.status}: ${response.statusText}`,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      resultCount: data.results?.length || 0,
      hasResults: !!data.results,
      sampleResults: data.results?.slice(0, 2).map((r: any) => ({
        title: r.title,
        img_src: r.img_src,
        thumbnail_src: r.thumbnail_src,
        engine: r.engine
      })) || [],
      responseStructure: {
        keys: Object.keys(data),
        resultsIsArray: Array.isArray(data.results)
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to connect to SearXNG',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}