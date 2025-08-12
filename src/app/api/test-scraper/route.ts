import { NextRequest, NextResponse } from 'next/server';

// Function to extract expense data from website HTML
function extractExpensesFromWebsite(html: string): any[] {
  const expenses: any[] = [];
  
  try {
    // Since the website is client-side rendered, we'll look for potential data patterns
    
    // Pattern 1: Look for JSON data in script tags
    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?expenses[\s\S]*?<\/script>/gi);
    if (scriptMatches) {
      for (const script of scriptMatches) {
        const jsonMatch = script.match(/expenses["']?\s*:\s*(\[[^\]]+\])/gi);
        if (jsonMatch) {
          try {
            const expensesData = JSON.parse(jsonMatch[0].split(':')[1]);
            expenses.push(...expensesData.map((exp: any, index: number) => ({
              id: exp.id || `scraped_${index + 1}`,
              from: exp.from || exp.merchant || 'Website',
              date: exp.date || new Date().toISOString().split('T')[0],
              creditAmount: parseFloat(exp.creditAmount) || 0,
              debitAmount: parseFloat(exp.debitAmount) || parseFloat(exp.amount) || 0,
              category: exp.category || 'General',
              description: exp.description || 'Scraped expense',
              availableBalance: parseFloat(exp.availableBalance) || 0
            })));
          } catch (parseError) {
            console.log('Failed to parse JSON from script:', parseError);
          }
        }
      }
    }

    // Pattern 2: Look for Next.js data chunks (since it's a Next.js app)
    const nextDataMatch = html.match(/self\.__next_f\.push\(\[1,"([^"]*?)"\]\)/g);
    if (nextDataMatch && expenses.length === 0) {
      for (const chunk of nextDataMatch) {
        try {
          const dataMatch = chunk.match(/"([^"]*?)"/);
          if (dataMatch) {
            const decodedData = decodeURIComponent(dataMatch[1]);
            // Look for expense-like patterns in the data
            const expensePattern = /amount["\']?\s*:\s*(\d+\.?\d*)/gi;
            const amounts = [...decodedData.matchAll(expensePattern)];
            
            amounts.forEach((match, index) => {
              expenses.push({
                id: `nextjs_scraped_${index + 1}`,
                from: 'Website Data',
                date: new Date().toISOString().split('T')[0],
                creditAmount: 0,
                debitAmount: parseFloat(match[1]),
                category: 'General',
                description: `Scraped from Next.js data chunk`,
                availableBalance: 0
              });
            });
          }
        } catch (parseError) {
          console.log('Failed to parse Next.js chunk:', parseError);
        }
      }
    }

    console.log(`🔍 Web scraper extracted ${expenses.length} expenses from website`);
    
  } catch (parseError) {
    console.error('HTML parsing error:', parseError);
  }

  return expenses;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing web scraper (no authentication required)...');
    
    const response = await fetch('https://www.mahboobagents.fun/expenses', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expenses page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('✅ Fetched HTML from expenses page, size:', html.length, 'bytes');
    
    // Extract expenses from the website
    const scrapedExpenses = extractExpensesFromWebsite(html);
    
    if (scrapedExpenses.length > 0) {
      console.log(`✅ Web scraper found ${scrapedExpenses.length} expenses`);
      
      const analytics = {
        total: scrapedExpenses.reduce((sum, exp) => sum + (exp.debitAmount - exp.creditAmount), 0),
        count: scrapedExpenses.length,
        categoryTotals: scrapedExpenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + (exp.debitAmount - exp.creditAmount);
          return acc;
        }, {} as Record<string, number>),
        averageExpense: scrapedExpenses.length > 0 ? scrapedExpenses.reduce((sum, exp) => sum + (exp.debitAmount - exp.creditAmount), 0) / scrapedExpenses.length : 0
      };
      
      return NextResponse.json({
        success: true,
        message: `Successfully scraped ${scrapedExpenses.length} expenses from website`,
        data: {
          expenses: scrapedExpenses,
          analytics,
          htmlSize: html.length,
          source: 'website_scraping_test'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Return analysis of what we found in the HTML
      return NextResponse.json({
        success: false,
        message: 'No expense data found in website HTML',
        data: {
          htmlSize: html.length,
          analysis: {
            scriptTags: html.match(/<script[^>]*>/gi)?.length || 0,
            nextDataChunks: html.match(/self\.__next_f\.push/g)?.length || 0,
            expenseKeywords: html.match(/expense/gi)?.length || 0,
            amountPatterns: html.match(/\$?(\d+\.?\d*)/g)?.length || 0
          },
          source: 'website_scraping_test'
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Web scraper test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Web scraper test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}