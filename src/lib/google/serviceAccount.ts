import { google } from 'googleapis';

// Service Account approach for accessing Google Sheets without OAuth
export async function getServiceAccountSheetsClient() {
  try {
    // Try to use service account if credentials are available
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('📊 Using Google Service Account for Sheets access');
      
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const authClient = await auth.getClient();
      return google.sheets({ version: 'v4', auth: authClient });
    }
    
    throw new Error('Service account credentials not configured');
  } catch (error) {
    console.error('❌ Service account setup failed:', error);
    throw error;
  }
}

// Fetch expenses directly from Google Sheets using service account
export async function fetchExpensesFromSheets(spreadsheetId: string) {
  try {
    const sheets = await getServiceAccountSheetsClient();
    
    const range = 'Expenses!A:H'; // Same range as your existing config
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return { expenses: [], analytics: null };
    }

    // Skip header row and convert to structured data
    const dataRows = rows.slice(1);
    const expenses = dataRows.map((row, index) => ({
      id: row[7] || `sheet_${index + 1}`,
      from: row[0] || '',
      date: row[1] || '',
      creditAmount: parseFloat(row[2]) || 0,
      debitAmount: parseFloat(row[3]) || 0,
      category: row[4] || 'General',
      description: row[5] || '',
      availableBalance: parseFloat(row[6]) || 0,
      // Transform for API format
      amount: parseFloat(row[3]) || parseFloat(row[2]) || 0, // Use debit first, then credit
      merchant: row[0] || 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Calculate analytics
    const total = expenses.reduce((sum, expense) => sum + ((expense.debitAmount || 0) - (expense.creditAmount || 0)), 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + ((expense.debitAmount || 0) - (expense.creditAmount || 0));
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      total,
      count: expenses.length,
      categoryTotals,
      averageExpense: expenses.length > 0 ? total / expenses.length : 0
    };

    console.log(`✅ Successfully fetched ${expenses.length} expenses from Google Sheets via service account`);
    return { expenses, analytics };

  } catch (error) {
    console.error('❌ Failed to fetch from Google Sheets:', error);
    throw error;
  }
}