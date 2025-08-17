import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google';
import { getGoogleAccessToken } from '@/lib/google/googleTokens';
import { SPREADSHEET_ID, getSheetConfig, SheetHelpers } from '@/lib/sheets-config';

const DIARY_CONFIG = getSheetConfig('diary');

// Helper function to get Google auth using existing token management
async function getGoogleAuthTokens() {
  const accessToken = await getGoogleAccessToken();
  
  if (!accessToken) {
    throw new Error('Google authentication required - please connect your Google account');
  }
  
  return {
    access_token: accessToken
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mood = searchParams.get('mood');
    
    // Get Google authentication
    const googleTokens = await getGoogleAuthTokens();

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token
    });
    
    try {
      const range = DIARY_CONFIG.range;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No diary entries found',
          timestamp: new Date().toISOString()
        });
      }

      // Skip header row and convert to structured data
      const dataRows = rows.slice(1);
      
      // Create entries with actual sheet row positions for reliable deletion
      const allEntries = dataRows.map((row, index) => ({
        id: `row_${index + 2}`, // Use actual 1-based sheet row as ID
        sheetRow: index + 2, // Actual 1-based row position in sheet
        date: row[0] || '',
        content: row[1] || '',
        mood: row[2] || '',
        tags: row[3] || '',
        dateTime: row[4] || ''
      }));
      
      // Filter out empty entries for display
      let entries = allEntries.filter(entry => 
        entry.date || entry.content || entry.mood || entry.tags || entry.dateTime
      );
      
      console.log('📖 Found', entries.length, 'diary entries with content out of', allEntries.length, 'total rows');

      // Apply filters
      if (startDate || endDate) {
        entries = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          if (startDate && entryDate < new Date(startDate)) return false;
          if (endDate && entryDate > new Date(endDate)) return false;
          return true;
        });
      }

      if (mood) {
        entries = entries.filter(entry => 
          entry.mood.toLowerCase().includes(mood.toLowerCase())
        );
      }

      return NextResponse.json({
        success: true,
        data: entries,
        message: 'Diary entries retrieved successfully',
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
    console.error('Diary fetch error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to fetch diary entries'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, mood = '', tags = [] } = body;
    
    // Convert tags array to comma-separated string for storage
    const tagsString = Array.isArray(tags) ? tags.join(', ') : tags || '';
    
    if (!content) {
      return NextResponse.json({
        success: false,
        message: 'Diary content is required'
      }, { status: 400 });
    }

    // Get Google authentication
    const googleTokens = await getGoogleAuthTokens();

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token
    });
    
    // Check if sheet exists, if not create it
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [`${DIARY_CONFIG.name}!A1`]
      });
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: DIARY_CONFIG.name
              }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${DIARY_CONFIG.name}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [DIARY_CONFIG.columns]
        }
      });
    }

    try {
      const now = new Date();
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: DIARY_CONFIG.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [SheetHelpers.diary.formatRow({ content, mood, tags: tagsString })]
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          spreadsheetId: SPREADSHEET_ID,
          updatedRange: response.data.updates?.updatedRange,
          updatedRows: response.data.updates?.updatedRows
        },
        message: 'Diary entry added successfully',
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
    console.error('Diary add error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to add diary entry'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, mood, tags } = body;
    
    // Convert tags array to comma-separated string for storage
    const tagsString = Array.isArray(tags) ? tags.join(', ') : tags || '';
    
    if (!id || !content) {
      return NextResponse.json({
        success: false,
        message: 'ID and content are required'
      }, { status: 400 });
    }

    // Get Google authentication
    const googleTokens = await getGoogleAuthTokens();

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token
    });
    const rowIndex = parseInt(id) + 1; // +1 for header row

    try {
      // Get current entry to preserve date
      const currentRange = `${DIARY_CONFIG.name}!A${rowIndex}:E${rowIndex}`;
      const currentResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: currentRange,
      });
      
      const originalDate = currentResponse.data.values?.[0]?.[0] || new Date().toISOString().split('T')[0];
      const originalDateTime = currentResponse.data.values?.[0]?.[4] || new Date().toISOString();

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: currentRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [SheetHelpers.diary.formatRow({ date: originalDate, content, mood, tags: tagsString, dateTime: originalDateTime })]
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Diary entry updated successfully',
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
    console.error('Diary update error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to update diary entry'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    console.log('🗑️ DELETE request received for diary entry ID:', id);
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Diary entry ID is required'
      }, { status: 400 });
    }

    // Get Google authentication
    const googleTokens = await getGoogleAuthTokens();

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token
    });
    
    // Get sheet info to find the correct sheetId
    let sheetId = 0;
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });
      
      console.log('Available sheets:', spreadsheet.data.sheets?.map(s => ({ 
        title: s.properties?.title, 
        id: s.properties?.sheetId 
      })));
      
      const diarySheet = spreadsheet.data.sheets?.find(
        sheet => sheet.properties?.title === DIARY_CONFIG.name
      );
      
      if (diarySheet?.properties?.sheetId !== undefined && diarySheet.properties.sheetId !== null) {
        sheetId = diarySheet.properties.sheetId;
        console.log('Found diary sheet with ID:', sheetId);
      } else {
        console.log('Diary sheet not found, using default sheetId = 0');
        // If diary sheet doesn't exist, it might be the first/default sheet
        if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
          sheetId = spreadsheet.data.sheets[0].properties?.sheetId || 0;
          console.log('Using first sheet ID:', sheetId);
        }
      }
    } catch (sheetError) {
      console.error('Error getting sheet info:', sheetError);
      // Continue with default sheetId = 0
    }

    // Extract sheet row from the ID format "row_X"
    let sheetRow: number;
    if (id.startsWith('row_')) {
      sheetRow = parseInt(id.replace('row_', ''));
    } else {
      // Fallback for old ID format
      sheetRow = parseInt(id) + 1;
    }
    
    console.log('📍 Sheet row from ID:', sheetRow, '(1-based)');
    
    // First, validate that the row exists by getting current data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${DIARY_CONFIG.name}!A:E`
    });

    const rows = response.data.values || [];
    
    console.log('📊 Total rows in sheet:', rows.length, '(including header)');
    console.log('📊 Target sheet row:', sheetRow, '(1-based)');
    
    // Validate sheet row exists
    if (sheetRow < 2 || sheetRow > rows.length) {
      console.log('❌ Invalid sheet row:', sheetRow, 'valid range: 2 to', rows.length);
      return NextResponse.json({
        success: false,
        message: 'Diary entry not found'
      }, { status: 404 });
    }

    // Get the data that will be deleted (for logging)
    const rowData = rows[sheetRow - 1]; // Convert to 0-based for array access
    console.log('🎯 Row data to be cleared:', rowData);

    try {
      // Clear the row content using the direct sheet row number
      console.log('🧹 Clearing content from sheet row:', sheetRow, '(1-based)');
      
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${DIARY_CONFIG.name}!A${sheetRow}:E${sheetRow}`
      });
      
      console.log('✅ Successfully cleared row content at row:', sheetRow);

      return NextResponse.json({
        success: true,
        message: 'Diary entry deleted successfully (content cleared)',
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      console.error('Row clear failed:', apiError.message);
      
      if (apiError.message?.includes('not been used') || apiError.message?.includes('disabled')) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API has not been used in project 573350886841 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.'
        }, { status: 500 });
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error('Diary delete error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to delete diary entry'
    }, { status: 500 });
  }
}