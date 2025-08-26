import { NextRequest, NextResponse } from 'next/server';

// Generate contextual follow-up questions based on search results
export async function POST(request: NextRequest) {
  try {
    const { query, intent, results, language } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const questions = await generateFollowUpQuestions(query, intent, results, language);
    
    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Follow-up questions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      { status: 500 }
    );
  }
}

async function generateFollowUpQuestions(
  query: string,
  intent: string,
  results: Array<{ title: string; content: string }>,
  language: string
): Promise<string[]> {
  const questions: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Generate questions based on search intent and results
  switch (intent) {
    case 'weather':
      questions.push(
        `What's the weather forecast for tomorrow in ${extractLocation(query) || 'your area'}?`,
        `Is there a chance of rain this week in ${extractLocation(query) || 'your area'}?`,
        `What's the best time to go outside today in ${extractLocation(query) || 'your area'}?`
      );
      break;
      
    case 'places':
      const location = extractLocation(query);
      questions.push(
        `What are the best restaurants near ${location || 'this area'}?`,
        `What are the opening hours for places like these?`,
        `How do I get directions to ${location || 'these places'}?`
      );
      break;
      
    case 'images':
      const subject = query.replace(/\b(image|photo|picture)s?\b/gi, '').trim();
      questions.push(
        `Where can I find more ${subject} photos?`,
        `What's the story behind these ${subject} images?`,
        `How can I download these ${subject} pictures?`
      );
      break;
      
    case 'news':
      questions.push(
        `What are the latest updates on ${query}?`,
        `Who are the key people involved in ${query}?`,
        `What caused this ${query} situation?`
      );
      break;
      
    case 'shopping':
      const product = extractProduct(query);
      questions.push(
        `Where can I find the best deals on ${product}?`,
        `What are customer reviews saying about ${product}?`,
        `Are there alternatives to ${product}?`
      );
      break;
      
    default:
      // General web search follow-ups
      questions.push(
        `What are the latest developments in ${query}?`,
        `How does ${query} work?`,
        `What are the benefits of ${query}?`
      );
  }
  
  // Add questions based on result analysis
  if (results && results.length > 0) {
    const resultTopics = extractTopicsFromResults(results);
    
    // Generate questions based on detected topics
    resultTopics.forEach(topic => {
      if (topic.toLowerCase() !== query.toLowerCase()) {
        questions.push(`Tell me more about ${topic} related to ${query}`);
      }
    });
  }
  
  // Add some universal follow-ups
  questions.push(
    `What are common questions people ask about ${query}?`,
    `What should I know before learning about ${query}?`
  );
  
  // Remove duplicates and limit to 5 questions
  const uniqueQuestions = [...new Set(questions)];
  return uniqueQuestions.slice(0, 5);
}

function extractLocation(query: string): string | null {
  const locationPatterns = [
    /in ([A-Z][a-zA-Z\s]+)/,
    /at ([A-Z][a-zA-Z\s]+)/,
    /near ([A-Z][a-zA-Z\s]+)/,
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractProduct(query: string): string {
  // Remove shopping-related words to get the product name
  return query
    .replace(/\b(buy|purchase|shop|price|cost|deal|sale)\b/gi, '')
    .trim();
}

function extractTopicsFromResults(results: Array<{ title: string; content: string }>): string[] {
  const topics: string[] = [];
  
  // Extract potential topics from titles
  results.forEach(result => {
    // Simple extraction - look for capitalized words that might be topics
    const titleWords = result.title.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || [];
    topics.push(...titleWords);
  });
  
  // Count frequency and return most common
  const topicCount: { [key: string]: number } = {};
  topics.forEach(topic => {
    topicCount[topic] = (topicCount[topic] || 0) + 1;
  });
  
  return Object.entries(topicCount)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);
}