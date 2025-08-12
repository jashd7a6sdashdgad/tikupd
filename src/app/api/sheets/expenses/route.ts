import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { SPREADSHEET_ID, getSheetConfig, SheetHelpers } from '@/lib/sheets-config';

const EXPENSES_CONFIG = getSheetConfig('expenses');

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

  // If no real data found, return empty array (will trigger fallback)
  return expenses;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    
    // Get OAuth tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    
    if (!accessToken) {
      throw new Error('Google authentication required');
    }

    const sheets = await getGoogleSheetsClient({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    try {
      const range = EXPENSES_CONFIG.range;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            expenses: [],
            analytics: {
              total: 0,
              count: 0,
              categoryTotals: {},
              averageExpense: 0
            }
          },
          message: 'No expenses found',
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }

      // Skip header row and convert to structured data
      const dataRows = rows.slice(1);
      let expenses = dataRows.map((row, index) => ({
        id: row[7] || (index + 1).toString(),
        from: row[0] || '',
        date: row[1] || '',
        creditAmount: parseFloat(row[2]) || 0,
        debitAmount: parseFloat(row[3]) || 0,
        category: row[4] || 'General',
        description: row[5] || '',
        availableBalance: parseFloat(row[6]) || 0
      }));

      // Apply filters
      if (startDate || endDate) {
        expenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          if (startDate && expenseDate < new Date(startDate)) return false;
          if (endDate && expenseDate > new Date(endDate)) return false;
          return true;
        });
      }

      if (category) {
        expenses = expenses.filter(expense =>
          expense.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Calculate analytics
      const total = expenses.reduce((sum, expense) => sum + (expense.debitAmount - expense.creditAmount), 0);
      const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + (expense.debitAmount - expense.creditAmount);
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        data: {
          expenses,
          analytics: {
            total,
            count: expenses.length,
            categoryTotals,
            averageExpense: expenses.length > 0 ? total / expenses.length : 0
          }
        },
        message: 'Expenses retrieved successfully',
        userId: user.id,
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      if (apiError.message?.includes('not been used') || apiError.message?.includes('disabled')) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API has not been used in project 573350886841 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.'
        }, { status: 500 });
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error('Expenses fetch error:', error);
    
    // FALLBACK: Try web scraping from website if Google Sheets is not available
    try {
      console.log('📡 Google Sheets failed, trying web scraper fallback...');
      
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

      if (response.ok) {
        const html = await response.text();
        console.log('🌐 Fetched website HTML, parsing for expense data...');
        
        // Extract expenses from the website (basic extraction since it's client-side rendered)
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
            data: {
              expenses: scrapedExpenses,
              analytics
            },
            message: 'Expenses retrieved via web scraping (Google Sheets unavailable)',
            timestamp: new Date().toISOString(),
            source: 'website_scraping'
          });
        }
      }
    } catch (scraperError) {
      console.log('🚫 Web scraper also failed:', scraperError);
    }
    
    // FINAL FALLBACK: Use sample data with notification
    console.log('📝 Using sample data as final fallback');
    const fallbackExpenses = [
      {
        id: '1',
        from: 'Bank of Oman',
        date: new Date().toISOString().split('T')[0],
        creditAmount: 0,
        debitAmount: 125.50,
        category: 'Food',
        description: 'Weekly grocery shopping at Lulu (Sample Data)',
        availableBalance: 984.50
      },
      {
        id: '2',
        from: 'ADNOC Station',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        creditAmount: 0,
        debitAmount: 45.75,
        category: 'Transportation',
        description: 'Gas station fill-up (Sample Data)',
        availableBalance: 938.75
      },
      {
        id: '3',
        from: 'Emirates Palace',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        creditAmount: 0,
        debitAmount: 89.99,
        category: 'Food',
        description: 'Lunch with colleagues (Sample Data)',
        availableBalance: 848.76
      }
    ];
    
    const analytics = {
      total: fallbackExpenses.reduce((sum, exp) => sum + (exp.debitAmount - exp.creditAmount), 0),
      count: fallbackExpenses.length,
      categoryTotals: fallbackExpenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + (exp.debitAmount - exp.creditAmount);
        return acc;
      }, {} as Record<string, number>),
      averageExpense: fallbackExpenses.length > 0 ? fallbackExpenses.reduce((sum, exp) => sum + (exp.debitAmount - exp.creditAmount), 0) / fallbackExpenses.length : 0
    };
    
    return NextResponse.json({
      success: false,
      data: {
        expenses: fallbackExpenses,
        analytics
      },
      message: `Google Sheets API error: ${error.message}. Showing sample data.`,
      timestamp: new Date().toISOString(),
      source: 'fallback_sample'
    }, { status: 200 }); // Return 200 with data instead of 500 error
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const body = await request.json();
    const { from, creditAmount, debitAmount, category = 'General', description, availableBalance, id } = body;
    
    if (!description || (!creditAmount && !debitAmount)) {
      return NextResponse.json({
        success: false,
        message: 'Description and either credit or debit amount are required'
      }, { status: 400 });
    }

    // Get OAuth tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    
    if (!accessToken) {
      throw new Error('Google authentication required');
    }

    const sheets = await getGoogleSheetsClient({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    // Check if sheet exists, if not create it
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [`${EXPENSES_CONFIG.name}!A1`]
      });
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: EXPENSES_CONFIG.name
              }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${EXPENSES_CONFIG.name}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [EXPENSES_CONFIG.columns]
        }
      });
    }

    try {
      const rowData = SheetHelpers.expenses.formatRow({
        from,
        date: new Date().toISOString().split('T')[0],
        creditAmount,
        debitAmount,
        category,
        description,
        availableBalance,
        id
      });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: EXPENSES_CONFIG.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          spreadsheetId: SPREADSHEET_ID,
          updatedRange: response.data.updates?.updatedRange,
          updatedRows: response.data.updates?.updatedRows
        },
        message: 'Expense added successfully',
        userId: user.id,
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      if (apiError.message?.includes('not been used') || apiError.message?.includes('disabled')) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API has not been used in project 573350886841 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.'
        }, { status: 500 });
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error('Expense add error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to add expense'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const body = await request.json();
    const { id, from, creditAmount, debitAmount, category, description, availableBalance } = body;
    
    if (!id || !description || (!creditAmount && !debitAmount)) {
      return NextResponse.json({
        success: false,
        message: 'ID, description and either credit or debit amount are required'
      }, { status: 400 });
    }

    // Get OAuth tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    
    if (!accessToken) {
      throw new Error('Google authentication required');
    }

    const sheets = await getGoogleSheetsClient({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    const rowIndex = parseInt(id) + 1; // +1 for header row

    try {
      // Get current entry to preserve date
      const currentRange = `${EXPENSES_CONFIG.name}!A${rowIndex}:H${rowIndex}`;
      const currentResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: currentRange,
      });
      
      const originalDate = currentResponse.data.values?.[0]?.[1] || new Date().toISOString().split('T')[0];

      const rowData = SheetHelpers.expenses.formatRow({
        from,
        date: originalDate,
        creditAmount,
        debitAmount,
        category,
        description,
        availableBalance,
        id
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: currentRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Expense updated successfully',
        userId: user.id,
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      if (apiError.message?.includes('not been used') || apiError.message?.includes('disabled')) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API has not been used in project 573350886841 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.'
        }, { status: 500 });
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error('Expense update error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to update expense'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Expense ID is required'
      }, { status: 400 });
    }

    // Get OAuth tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    
    if (!accessToken) {
      throw new Error('Google authentication required');
    }

    const sheets = await getGoogleSheetsClient({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    try {
      // First get all data to find the correct row
      const range = EXPENSES_CONFIG.range;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) {
        throw new Error('No data rows found to delete');
      }

      // Find the row with matching ID (skip header row)
      const dataRows = rows.slice(1);
      let targetRowIndex = -1;
      
      for (let i = 0; i < dataRows.length; i++) {
        const rowId = dataRows[i][7] || (i + 1).toString(); // Column H (ID) or fallback to index
        if (rowId === id) {
          targetRowIndex = i + 2; // +2 because: +1 for header row, +1 for 1-based indexing
          break;
        }
      }

      if (targetRowIndex === -1) {
        throw new Error(`Expense with ID ${id} not found`);
      }

      // Get the spreadsheet to find the correct sheet ID
      const spreadsheetResponse = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });
      
      const expensesSheet = spreadsheetResponse.data.sheets?.find(
        sheet => sheet.properties?.title === EXPENSES_CONFIG.name
      );
      
      if (!expensesSheet || expensesSheet.properties?.sheetId === undefined) {
        throw new Error(`Sheet '${EXPENSES_CONFIG.name}' not found`);
      }
      
      const sheetId = expensesSheet.properties.sheetId;

      // Delete the specific row (using 0-based indexing for the API)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: targetRowIndex - 1, // Convert to 0-based indexing
                endIndex: targetRowIndex        // End is exclusive, so this deletes just one row
              }
            }
          }]
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Expense deleted successfully',
        userId: user.id,
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      if (apiError.message?.includes('not been used') || apiError.message?.includes('disabled')) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API has not been used in project 573350886841 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.'
        }, { status: 500 });
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error('Expense delete error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to delete expense'
    }, { status: 500 });
  }
}