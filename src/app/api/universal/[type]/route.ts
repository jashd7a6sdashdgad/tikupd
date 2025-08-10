import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import { universalStorage } from '@/lib/storage/universalStorage';

// GET /api/universal/[type] - Get all items of a specific type
export async function GET(
  request: NextRequest,
  context: { params: { type: string } }
) {
  const { params } = context;
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
    const { type } = params;
    
    // Check if token has required permissions for this type
    const readPermission = `read:${type}`;
    if (!hasPermission(validToken, readPermission) && !hasPermission(validToken, '*')) {
      return NextResponse.json(
        { error: `Insufficient permissions. Token requires ${readPermission} permission or wildcard (*)` },
        { status: 403 }
      );
    }

    // Load data from storage
    const items = await universalStorage.loadData(type);

    return NextResponse.json({
      success: true,
      message: `${type} data retrieved successfully`,
      data: {
        type,
        items,
        total: items.length,
        storageType: universalStorage.getStorageType(),
        token: {
          name: validToken.name,
          permissions: validToken.permissions,
          createdAt: validToken.createdAt
        }
      }
    });

  } catch (error) {
    console.error(`Error in universal API for ${params.type}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/universal/[type] - Create a new item of the specified type
export async function POST(
  request: NextRequest,
  context: { params: { type: string } }
) {
  const { params } = context;
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
    const { type } = params;
    
    // Check if token has write permissions for this type
    const writePermission = `write:${type}`;
    if (!hasPermission(validToken, writePermission) && !hasPermission(validToken, '*')) {
      return NextResponse.json(
        { error: `Insufficient permissions. Token requires ${writePermission} permission or wildcard (*)` },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object' },
        { status: 400 }
      );
    }

    // Save item to storage
    const newItem = await universalStorage.addItem(type, body);

    return NextResponse.json({
      success: true,
      message: `${type} item created successfully`,
      data: {
        item: newItem,
        token: {
          name: validToken.name,
          permissions: validToken.permissions
        }
      }
    });

  } catch (error) {
    console.error(`Error creating ${params.type} item:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/universal/[type] - Update an existing item
export async function PUT(
  request: NextRequest,
  context: { params: { type: string } }
) {
  const { params } = context;
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
    const { type } = params;
    
    // Check if token has write permissions for this type
    const writePermission = `write:${type}`;
    if (!hasPermission(validToken, writePermission) && !hasPermission(validToken, '*')) {
      return NextResponse.json(
        { error: `Insufficient permissions. Token requires ${writePermission} permission or wildcard (*)` },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required for updates' },
        { status: 400 }
      );
    }

    // Update item in storage
    const updatedItem = await universalStorage.updateItem(type, id, updates);
    
    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} item updated successfully`,
      data: {
        item: updatedItem,
        token: {
          name: validToken.name,
          permissions: validToken.permissions
        }
      }
    });

  } catch (error) {
    console.error(`Error updating ${params.type} item:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/universal/[type] - Delete an item
export async function DELETE(
  request: NextRequest,
  context: { params: { type: string } }
) {
  const { params } = context;
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
    const { type } = params;
    
    // Check if token has write permissions for this type
    const writePermission = `write:${type}`;
    if (!hasPermission(validToken, writePermission) && !hasPermission(validToken, '*')) {
      return NextResponse.json(
        { error: `Insufficient permissions. Token requires ${writePermission} permission or wildcard (*)` },
        { status: 403 }
      );
    }

    // Get item ID from query parameters or body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    
    if (!id) {
      const body = await request.json();
      id = body.id;
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required for deletion' },
        { status: 400 }
      );
    }

    // Delete item from storage
    const deleted = await universalStorage.deleteItem(type, id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} item deleted successfully`,
      data: {
        deletedId: id,
        token: {
          name: validToken.name,
          permissions: validToken.permissions
        }
      }
    });

  } catch (error) {
    console.error(`Error deleting ${params.type} item:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}