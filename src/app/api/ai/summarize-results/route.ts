import { NextRequest, NextResponse } from 'next/server';

// AI-powered search result summarization
export async function POST(request: NextRequest) {
  try {
    const { query, intent, results, language } = await request.json();

    if (!query || !results) {
      return NextResponse.json(
        { error: 'Query and results are required' },
        { status: 400 }
      );
    }

    // Generate summary based on search results
    const summary = await generateResultSummary(query, intent, results, language);
    
    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Result summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize results' },
      { status: 500 }
    );
  }
}

async function generateResultSummary(
  query: string, 
  intent: string, 
  results: Array<{ title: string; content: string }>,
  language: string
) {
  if (results.length === 0) {
    return `No results found for "${query}". Try a different search term.`;
  }

  // Extract key information from top results
  const keyPoints: string[] = [];
  const titles = results.map(r => r.title);
  
  // Create a simple summary based on intent and results
  let summary = '';
  
  switch (intent) {
    case 'weather':
      summary = `Found ${results.length} weather-related results for "${query}". `;
      if (results.some(r => r.content.includes('temperature') || r.content.includes('°'))) {
        summary += 'The results include current temperature and forecast information.';
      }
      break;
      
    case 'places':
      summary = `Found ${results.length} places related to "${query}". `;
      if (results.some(r => r.content.includes('address') || r.content.includes('location'))) {
        summary += 'The results include location details and addresses.';
      }
      break;
      
    case 'images':
      summary = `Found ${results.length} image results for "${query}". `;
      summary += 'Browse through the images to find what you\'re looking for.';
      break;
      
    case 'news':
      summary = `Found ${results.length} news articles about "${query}". `;
      const recentKeywords = ['today', 'latest', 'breaking', 'update'];
      if (results.some(r => recentKeywords.some(keyword => 
        r.title.toLowerCase().includes(keyword) || r.content.toLowerCase().includes(keyword)))) {
        summary += 'The results include recent news and updates.';
      }
      break;
      
    case 'shopping':
      summary = `Found ${results.length} shopping results for "${query}". `;
      if (results.some(r => r.content.includes('price') || r.content.includes('$'))) {
        summary += 'The results include pricing information and purchase options.';
      }
      break;
      
    default:
      // General web search summary
      summary = `Found ${results.length} web results for "${query}". `;
      
      // Identify common themes in the results
      const commonWords = extractCommonThemes(results);
      if (commonWords.length > 0) {
        summary += `The results mainly cover topics like ${commonWords.slice(0, 3).join(', ')}.`;
      }
  }

  // Add a helpful suggestion
  if (results.length > 5) {
    summary += ` Review the top results for the most relevant information.`;
  }

  return summary;
}

function extractCommonThemes(results: Array<{ title: string; content: string }>): string[] {
  const wordCount: { [key: string]: number } = {};
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'a', 'an']);

  // Count words from titles and content
  results.forEach(result => {
    const text = `${result.title} ${result.content}`.toLowerCase();
    const words = text.match(/\b[a-z]+\b/g) || [];
    
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
  });

  // Return most common words
  return Object.entries(wordCount)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}