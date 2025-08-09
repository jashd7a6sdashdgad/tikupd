import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { conditionalAutomation } from '@/lib/conditionalAutomation';
import { n8nMCPService } from '@/lib/n8nMCP';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'rules':
        // Get all automation rules
        const rules = conditionalAutomation.getAutomationRules();
        return NextResponse.json({
          success: true,
          data: rules,
          message: 'Automation rules retrieved successfully'
        });

      case 'check':
        // Check automation rules against current context
        console.log('🔄 Checking automation rules...');
        const context = await conditionalAutomation.gatherContextData();
        const triggeredWorkflows = await conditionalAutomation.checkAutomationRules(context);
        
        // Execute triggered workflows
        const results: Array<{
          workflowId: string;
          success: boolean;
          status?: number;
          error?: string;
        }> = [];
        
        for (const workflowId of triggeredWorkflows) {
          try {
            const result = await fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/${workflowId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                triggerType: 'automation',
                context: context,
                timestamp: new Date().toISOString()
              })
            });
            
            results.push({
              workflowId,
              success: result.ok,
              status: result.status
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push({
              workflowId,
              success: false,
              error: errorMessage
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            context,
            triggeredWorkflows,
            executionResults: results
          },
          message: `Checked automation rules, triggered ${triggeredWorkflows.length} workflows`
        });

      case 'context':
        // Get current context data only
        const currentContext = await conditionalAutomation.gatherContextData();
        return NextResponse.json({
          success: true,
          data: currentContext,
          message: 'Context data retrieved successfully'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Automation API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process automation request',
        error: 'AUTOMATION_API_ERROR'
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
      case 'create-rule':
        // Create new automation rule
        const { rule } = body;
        if (!rule) {
          return NextResponse.json(
            { success: false, message: 'Rule data is required' },
            { status: 400 }
          );
        }

        const newRule = conditionalAutomation.addAutomationRule(rule);
        return NextResponse.json({
          success: true,
          data: newRule,
          message: 'Automation rule created successfully'
        });

      case 'update-rule':
        // Update existing automation rule
        const { ruleId, updates } = body;
        if (!ruleId || !updates) {
          return NextResponse.json(
            { success: false, message: 'Rule ID and updates are required' },
            { status: 400 }
          );
        }

        const updated = conditionalAutomation.updateAutomationRule(ruleId, updates);
        if (!updated) {
          return NextResponse.json(
            { success: false, message: 'Rule not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Automation rule updated successfully'
        });

      case 'delete-rule':
        // Delete automation rule
        const { ruleId: deleteId } = body;
        if (!deleteId) {
          return NextResponse.json(
            { success: false, message: 'Rule ID is required' },
            { status: 400 }
          );
        }

        const deleted = conditionalAutomation.deleteAutomationRule(deleteId);
        if (!deleted) {
          return NextResponse.json(
            { success: false, message: 'Rule not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Automation rule deleted successfully'
        });

      case 'generate-rule':
        // Generate automation rule using AI
        const { description, contextType } = body;
        if (!description) {
          return NextResponse.json(
            { success: false, message: 'Description is required' },
            { status: 400 }
          );
        }

        // Use Gemini to generate automation rule
        const generatedRule = await generateAutomationRule(description, contextType);
        
        return NextResponse.json({
          success: true,
          data: generatedRule,
          message: 'Automation rule generated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Automation API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process automation request',
        error: 'AUTOMATION_API_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate automation rule using AI
 */
async function generateAutomationRule(description: string, contextType?: string) {
  // This would use Gemini AI to generate automation rules
  // For now, return a simple template
  return {
    name: 'Generated Rule',
    description: description,
    conditions: [
      {
        type: contextType || 'time',
        operator: 'equals',
        value: { hour: 9, minute: 0 }
      }
    ],
    logicOperator: 'AND',
    workflowId: 'generated-workflow',
    isActive: true
  };
}