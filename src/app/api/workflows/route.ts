import { NextRequest, NextResponse } from 'next/server';
import { n8nMCPService } from '@/lib/n8nMCP';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        // Get pre-built workflow templates
        const templates = n8nMCPService.getWorkflowTemplates();
        return NextResponse.json({
          success: true,
          data: templates,
          message: 'Workflow templates retrieved successfully'
        });

      case 'list':
        // List user's custom workflows (would need database storage)
        return NextResponse.json({
          success: true,
          data: [], // TODO: Implement database storage for user workflows
          message: 'User workflows retrieved successfully'
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

        console.log(`🔧 Generating workflow: "${description}"`);
        const generatedWorkflow = await n8nMCPService.generateWorkflow(description, {
          userId: '1',
          userName: 'User',
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
          userId: '1',
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