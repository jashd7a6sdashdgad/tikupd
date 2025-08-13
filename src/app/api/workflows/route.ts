import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { validateApiToken, hasPermission } from '@/lib/api/auth/tokenValidation';
import jwt from 'jsonwebtoken';
import { n8nMCPService } from '@/lib/n8nMCP';

export async function GET(request: NextRequest) {
  let validToken: any = null;
  let authType = 'unknown';
  
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required. Use format: Bearer YOUR_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Try to validate as website JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'punz') as any;
      validToken = {
        id: decoded.userId || '1',
        name: decoded.username || 'website-user',
        permissions: ['*'],
        email: decoded.email,
        type: 'website-jwt'
      };
      authType = 'website-jwt';
    } catch (jwtError: any) {
      // Try to validate as API token
      const validation = await validateApiToken(authHeader);
      
      if (!validation.isValid || !validation.token) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid token. Please check your API token or JWT.' 
          },
          { status: 401 }
        );
      }
      
      validToken = validation.token;
      authType = 'api-token';
      
      // Check permissions for API tokens
      if (!hasPermission(validToken, 'read:workflows')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions. Token requires read:workflows permission' 
          },
          { status: 403 }
        );
      }
    }
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        // Get pre-built workflow templates
        const templates = n8nMCPService.getWorkflowTemplates();
        return NextResponse.json({
          success: true,
          data: templates,
          message: 'Workflow templates retrieved successfully',
          authType,
          token: {
            name: validToken.name,
            permissions: validToken.permissions,
            type: validToken.type
          }
        });

      case 'list':
        // List user's custom workflows (would need database storage)
        return NextResponse.json({
          success: true,
          data: [], // TODO: Implement database storage for user workflows
          message: 'User workflows retrieved successfully',
          authType,
          token: {
            name: validToken.name,
            permissions: validToken.permissions,
            type: validToken.type
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Workflow API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process workflow request',
        error: 'WORKFLOW_API_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate':
        // Generate workflow from natural language description
        const { description, context } = body;
        if (!description) {
          return NextResponse.json(
            { success: false, message: 'Description is required' },
            { status: 400 }
          );
        }

        console.log(`🔧 Generating workflow for user ${user.id}: "${description}"`);
        const generatedWorkflow = await n8nMCPService.generateWorkflow(description, {
          userId: user.id,
          userName: (user as any).name || 'User',
          ...context
        });

        return NextResponse.json({
          success: true,
          data: generatedWorkflow,
          message: 'Workflow generated successfully'
        });

      case 'create':
        // Create workflow in N8N instance
        const { workflow } = body;
        if (!workflow) {
          return NextResponse.json(
            { success: false, message: 'Workflow data is required' },
            { status: 400 }
          );
        }

        console.log(`🚀 Creating workflow in N8N: ${workflow.name}`);
        
        try {
          const createdWorkflow = await n8nMCPService.createWorkflowInN8N(workflow);

          return NextResponse.json({
            success: true,
            data: createdWorkflow,
            message: 'Workflow created in N8N successfully'
          });
        } catch (workflowError: any) {
          console.error('❌ Workflow creation failed:', workflowError);
          
          // Return specific error message from the service
          return NextResponse.json({
            success: false,
            message: workflowError.message || 'Failed to create workflow in N8N',
            error: 'WORKFLOW_CREATION_FAILED',
            details: {
              workflowName: workflow.name,
              timestamp: new Date().toISOString()
            }
          }, { status: 500 });
        }

      case 'execute-voice':
        // Execute workflow via voice command
        const { voiceCommand, conditions } = body;
        if (!voiceCommand) {
          return NextResponse.json(
            { success: false, message: 'Voice command is required' },
            { status: 400 }
          );
        }

        console.log(`🎤 Executing workflow via voice: "${voiceCommand}"`);
        const executionResult = await n8nMCPService.executeWorkflowByVoice(voiceCommand, {
          userId: user.id,
          triggerType: 'voice',
          data: body.data,
          conditions: conditions
        });

        return NextResponse.json({
          success: true,
          data: executionResult,
          message: 'Workflow executed successfully via voice'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Workflow API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process workflow request',
        error: 'WORKFLOW_API_ERROR'
      },
      { status: 500 }
    );
  }
}