import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google';
import { SPREADSHEET_ID, getSheetConfig, SheetHelpers } from '@/lib/sheets-config';

const CONTACTS_CONFIG = getSheetConfig('contacts');

// Helper function to get Google auth from cookies or env
function getGoogleAuth(request: NextRequest) {
  // Try cookies first
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : undefined;
  
  if (accessToken) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }
  
  // Fallback to environment variables
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (envAccessToken) {
    return {
      access_token: envAccessToken,
      refresh_token: envRefreshToken
    };
  }
  
  throw new Error('Google authentication required');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Get Google authentication
    const googleTokens = getGoogleAuth(request);

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token,
      refresh_token: googleTokens.refresh_token
    });
    
    try {
      const range = CONTACTS_CONFIG.range;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No contacts found',
          timestamp: new Date().toISOString()
        });
      }

      // Skip header row and convert to structured data
      const dataRows = rows.slice(1);
      let contacts = dataRows.map((row, index) => ({
        id: (index + 1).toString(),
        name: row[0] || '',
        email: row[1] || '',
        phone: row[2] || '',
        company: row[3] || '',
        notes: row[4] || '',
        dateAdded: row[5] || ''
      }));

      // Apply search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        contacts = contacts.filter(contact => 
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.email.toLowerCase().includes(searchTerm) ||
          contact.company.toLowerCase().includes(searchTerm)
        );
      }

      return NextResponse.json({
        success: true,
        data: contacts,
        message: 'Contacts retrieved successfully',
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
    console.error('Contacts fetch error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to fetch contacts'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email = '', phone = '', company = '', notes = '' } = body;
    
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Contact name is required'
      }, { status: 400 });
    }

    // Get Google authentication
    const googleTokens = getGoogleAuth(request);

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token,
      refresh_token: googleTokens.refresh_token
    });
    
    // Check if sheet exists, if not create it
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [`${CONTACTS_CONFIG.name}!A1`]
      });
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: CONTACTS_CONFIG.name
              }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${CONTACTS_CONFIG.name}!A1:F1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [CONTACTS_CONFIG.columns]
        }
      });
    }

    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: CONTACTS_CONFIG.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [SheetHelpers.contacts.formatRow({ name, email, phone, company, notes })]
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          spreadsheetId: SPREADSHEET_ID,
          updatedRange: response.data.updates?.updatedRange,
          updatedRows: response.data.updates?.updatedRows
        },
        message: 'Contact added successfully',
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
    console.error('Contact add error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to add contact'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, phone, company, notes } = body;
    
    if (!id || !name) {
      return NextResponse.json({
        success: false,
        message: 'ID and name are required'
      }, { status: 400 });
    }

    // Get Google authentication
    const googleTokens = getGoogleAuth(request);

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token,
      refresh_token: googleTokens.refresh_token
    });
    const rowIndex = parseInt(id) + 1; // +1 for header row

    try {
      // Get current date to preserve it
      const currentRange = `${CONTACTS_CONFIG.name}!A${rowIndex}:F${rowIndex}`;
      const currentResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: currentRange,
      });
      
      const originalDate = currentResponse.data.values?.[0]?.[5] || new Date().toISOString().split('T')[0];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: currentRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [SheetHelpers.contacts.formatRow({ name, email, phone, company, notes, dateAdded: originalDate })]
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Contact updated successfully',
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
    console.error('Contact update error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to update contact'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/sheets/contacts: Starting contact deletion...');
    
    const body = await request.json();
    const { id } = body;
    console.log('DELETE /api/sheets/contacts: Deleting contact with ID:', id);
    
    if (!id) {
      console.log('DELETE /api/sheets/contacts: No contact ID provided');
      return NextResponse.json({
        success: false,
        message: 'Contact ID is required'
      }, { status: 400 });
    }

    // Get Google authentication
    const googleTokens = getGoogleAuth(request);
    
    console.log('DELETE /api/sheets/contacts: OAuth tokens - accessToken exists:', !!googleTokens.access_token, 'refreshToken exists:', !!googleTokens.refresh_token);

    const sheets = await getGoogleSheetsClient({
      access_token: googleTokens.access_token,
      refresh_token: googleTokens.refresh_token
    });
    console.log('DELETE /api/sheets/contacts: Google Sheets client created successfully');
    
    // Get sheet info to find the correct sheetId
    let sheetId = 0;
    try {
      console.log('DELETE /api/sheets/contacts: Fetching spreadsheet info for ID:', SPREADSHEET_ID);
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });
      
      const contactsSheet = spreadsheet.data.sheets?.find(
        sheet => sheet.properties?.title === CONTACTS_CONFIG.name
      );
      
      console.log('DELETE /api/sheets/contacts: Found contacts sheet:', {
        title: contactsSheet?.properties?.title,
        sheetId: contactsSheet?.properties?.sheetId,
        configName: CONTACTS_CONFIG.name
      });
      
      if (contactsSheet?.properties?.sheetId !== undefined && contactsSheet.properties.sheetId !== null) {
        sheetId = contactsSheet.properties.sheetId;
        console.log('DELETE /api/sheets/contacts: Using sheet ID:', sheetId);
      } else {
        console.log('DELETE /api/sheets/contacts: Using default sheet ID 0');
      }
    } catch (sheetError) {
      console.error('DELETE /api/sheets/contacts: Error getting sheet info:', sheetError);
      console.log('DELETE /api/sheets/contacts: Continuing with default sheetId = 0');
      // Continue with default sheetId = 0
    }

    // ID is 1-based index from the dataRows array (after header), so calculate actual row
    const contactIndex = parseInt(id); // This is 1-based from frontend
    const actualRowIndex = contactIndex + 1; // +1 for header row (so row 2 = first data row)
    console.log('DELETE /api/sheets/contacts: Contact index:', contactIndex, 'Actual row index:', actualRowIndex);
    
    // First, validate that the row exists by getting current data
    console.log('DELETE /api/sheets/contacts: Fetching current data from range:', `${CONTACTS_CONFIG.name}!A:F`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CONTACTS_CONFIG.name}!A:F`
    });

    const rows = response.data.values || [];
    console.log('DELETE /api/sheets/contacts: Found', rows.length, 'total rows (including header)');
    
    // Check if the contact index corresponds to a valid data row
    const dataRows = rows.slice(1); // Skip header
    if (contactIndex < 1 || contactIndex > dataRows.length) {
      console.log('DELETE /api/sheets/contacts: Invalid contact index:', { contactIndex, dataRowsCount: dataRows.length });
      return NextResponse.json({
        success: false,
        message: 'Contact not found'
      }, { status: 404 });
    }
    
    console.log('DELETE /api/sheets/contacts: Row validation passed, proceeding with deletion');

    try {
      // Delete the row (Google Sheets API uses 0-based indexing for rows)
      // actualRowIndex is already calculated correctly above (contactIndex + 1 for header)
      // We need to convert to 0-based for the API
      const deleteRowIndex = actualRowIndex - 1; // Convert 1-based to 0-based for API
      
      console.log('DELETE /api/sheets/contacts: Attempting to delete row with params:', {
        spreadsheetId: SPREADSHEET_ID,
        sheetId: sheetId,
        startIndex: deleteRowIndex,
        endIndex: deleteRowIndex + 1,
        actualRowIndex: actualRowIndex,
        contactIndex: contactIndex,
        explanation: `Deleting contact ${contactIndex} from row ${actualRowIndex} (API index ${deleteRowIndex})`
      });
      
      const deleteResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: deleteRowIndex,
                endIndex: deleteRowIndex + 1
              }
            }
          }]
        }
      });
      
      console.log('DELETE /api/sheets/contacts: Delete operation successful:', deleteResponse.data);

      // Verify the deletion by checking if the row still exists
      try {
        console.log('DELETE /api/sheets/contacts: Verifying deletion...');
        const verifyResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${CONTACTS_CONFIG.name}!A:F`
        });
        
        const updatedRows = verifyResponse.data.values || [];
        console.log('DELETE /api/sheets/contacts: After deletion, found', updatedRows.length, 'rows');
        
        if (updatedRows.length < rows.length) {
          console.log('DELETE /api/sheets/contacts: Row deletion verified - row count reduced');
        } else {
          console.log('DELETE /api/sheets/contacts: WARNING - Row count unchanged, deletion may have failed');
        }
      } catch (verifyError) {
        console.warn('DELETE /api/sheets/contacts: Could not verify deletion:', verifyError);
      }

      return NextResponse.json({
        success: true,
        message: 'Contact deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      console.error('DELETE /api/sheets/contacts: API error during deletion:', apiError);
      
      if (apiError.message?.includes('not been used') || apiError.message?.includes('disabled')) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API has not been used in project 573350886841 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=573350886841 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.'
        }, { status: 500 });
      }
      
      // Try alternative deletion method - clear the row content instead of deleting the row
      try {
        console.log('DELETE /api/sheets/contacts: Trying alternative method - clearing row content');
        
        const clearResponse = await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `${CONTACTS_CONFIG.name}!A${actualRowIndex}:F${actualRowIndex}`
        });
        
        console.log('DELETE /api/sheets/contacts: Alternative deletion successful:', clearResponse.data);
        
        return NextResponse.json({
          success: true,
          message: 'Contact cleared successfully (row preserved)',
          timestamp: new Date().toISOString()
        });
        
      } catch (clearError: any) {
        console.error('DELETE /api/sheets/contacts: Alternative deletion also failed:', clearError);
        throw apiError; // Throw the original error
      }
    }

  } catch (error: any) {
    console.error('Contact delete error:', error);
    console.error('Error details:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status
    });
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to delete contact',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}