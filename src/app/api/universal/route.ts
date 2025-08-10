import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/api/auth/tokenValidation';
import { universalStorage } from '@/lib/storage/universalStorage';

// GET /api/universal - Get all available data types and their counts
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    // Validate the token
    const validation = await validateApiToken(authHeader);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }
    
    const validToken = validation.token!;

    // Get all available types
    const types = await universalStorage.getAllTypes();
    
    // Get counts for each type
    const typesWithCounts = await Promise.all(
      types.map(async (type) => {
        const items = await universalStorage.loadData(type);
        return {
          type,
          count: items.length,
          lastUpdated: items.length > 0 
            ? items.reduce((latest, item) => {
                const itemDate = new Date(item.updatedAt || item.createdAt);
                return itemDate > latest ? itemDate : latest;
              }, new Date(0)).toISOString()
            : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Available data types retrieved successfully',
      data: {
        storageType: universalStorage.getStorageType(),
        totalTypes: types.length,
        types: typesWithCounts,
        endpoints: {
          get: 'GET /api/universal/{type} - Get all items of a type',
          post: 'POST /api/universal/{type} - Create new item',
          put: 'PUT /api/universal/{type} - Update existing item',
          delete: 'DELETE /api/universal/{type}?id={id} - Delete item'
        },
        examples: {
          expenses: '/api/universal/expenses',
          contacts: '/api/universal/contacts',
          diary: '/api/universal/diary',
          calendar: '/api/universal/calendar',
          analytics: '/api/universal/analytics',
          emails: '/api/universal/emails',
          tasks: '/api/universal/tasks',
          settings: '/api/universal/settings',
          anyCustomType: '/api/universal/your-custom-type'
        },
        token: {
          name: validToken.name,
          permissions: validToken.permissions,
          createdAt: validToken.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error in universal API overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/universal - Bulk operations or custom queries
export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    // Validate the token
    const validation = await validateApiToken(authHeader);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }
    
    const validToken = validation.token!;
    const body = await request.json();

    if (body.action === 'bulk_get') {
      // Get multiple types at once
      const { types } = body;
      
      if (!Array.isArray(types)) {
        return NextResponse.json(
          { error: 'types must be an array for bulk_get action' },
          { status: 400 }
        );
      }

      const results = await Promise.all(
        types.map(async (type: string) => {
          try {
            const items = await universalStorage.loadData(type);
            return {
              type,
              success: true,
              items,
              count: items.length
            };
          } catch (error) {
            return {
              type,
              success: false,
              error: error instanceof Error ? error.message : String(error),
              items: [],
              count: 0
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        message: 'Bulk data retrieval completed',
        data: {
          results,
          token: {
            name: validToken.name,
            permissions: validToken.permissions
          }
        }
      });
    }

    if (body.action === 'search') {
      // Search across all types
      const { query, types: searchTypes } = body;
      
      if (!query || typeof query !== 'string') {
        return NextResponse.json(
          { error: 'query string is required for search action' },
          { status: 400 }
        );
      }

      const typesToSearch = searchTypes && Array.isArray(searchTypes) 
        ? searchTypes 
        : await universalStorage.getAllTypes();

      const searchResults = await Promise.all(
        typesToSearch.map(async (type: string) => {
          try {
            const items = await universalStorage.loadData(type);
            const matchingItems = items.filter(item => {
              const dataString = JSON.stringify(item.data).toLowerCase();
              return dataString.includes(query.toLowerCase());
            });

            return {
              type,
              matches: matchingItems,
              count: matchingItems.length
            };
          } catch (error) {
            return {
              type,
              matches: [],
              count: 0,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );

      const totalMatches = searchResults.reduce((sum, result) => sum + result.count, 0);

      return NextResponse.json({
        success: true,
        message: `Search completed. Found ${totalMatches} matches.`,
        data: {
          query,
          totalMatches,
          results: searchResults.filter(result => result.count > 0),
          token: {
            name: validToken.name,
            permissions: validToken.permissions
          }
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: bulk_get, search' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in universal API bulk operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}