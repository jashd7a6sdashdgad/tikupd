/**
 * N8N MCP (Model Context Protocol) Integration Service
 * Uses Gemini 2.0 Flash to build and manage N8N workflows
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { mcpClient, ensureMCPInitialized } from './mcpClient';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'automation' | 'communication' | 'finance' | 'health';
  trigger: {
    type: 'webhook' | 'schedule' | 'voice' | 'condition';
    config: any;
  };
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters: any;
}

interface WorkflowConnection {
  sourceNode: string;
  sourceOutput: string;
  targetNode: string;
  targetInput: string;
}

interface WorkflowExecutionContext {
  userId: string;
  triggerType: 'voice' | 'api' | 'schedule' | 'webhook';
  data?: any;
  voiceCommand?: string;
  conditions?: {
    calendar?: any;
    location?: any;
    weather?: any;
  };
}

class N8NMCPService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp' });
  }

  /**
   * Generate a workflow based on natural language description
   */
  async generateWorkflow(description: string, context?: any): Promise<WorkflowTemplate> {
    const prompt = `
You are an expert N8N workflow designer. Create a complete N8N workflow based on this description: "${description}"

Context information:
- User has access to: Calendar, Email (Gmail), Expenses (Google Sheets), Weather API, Voice Assistant, Photos
- Available integrations: Google OAuth, Facebook, YouTube, Instagram, Messenger
- N8N instance: ${process.env.N8N_WEBHOOK_URL}

Generate a complete workflow with:
1. Appropriate trigger (webhook, schedule, or condition-based)
2. All necessary nodes with proper configuration
3. Node connections and data flow
4. Error handling and conditional logic
5. Voice command integration if applicable

Return ONLY valid JSON in this format:
{
  "id": "generated_unique_id",
  "name": "Workflow Name",
  "description": "Detailed description",
  "category": "productivity|automation|communication|finance|health",
  "trigger": {
    "type": "webhook|schedule|voice|condition",
    "config": {}
  },
  "nodes": [
    {
      "id": "node_id",
      "name": "Node Name", 
      "type": "n8n-nodes-base.HttpRequest",
      "position": {"x": 100, "y": 200},
      "parameters": {}
    }
  ],
  "connections": [
    {
      "sourceNode": "node1",
      "sourceOutput": "main",
      "targetNode": "node2", 
      "targetInput": "main"
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const workflow = JSON.parse(jsonMatch[0]);
      return workflow;
    } catch (error) {
      console.error('Error generating workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Failed to generate workflow: ' + errorMessage);
    }
  }

  /**
   * Create a workflow in N8N instance using MCP
   */
  async createWorkflowInN8N(workflow: WorkflowTemplate): Promise<{ id: string; webhookUrl?: string }> {
    try {
      // Ensure MCP client is initialized
      await ensureMCPInitialized();
      
      // Convert our workflow format to N8N format
      const n8nWorkflow = this.convertToN8NFormat(workflow);
      
      // Try MCP first
      try {
        const result = await mcpClient.createWorkflow(n8nWorkflow);
        
        return {
          id: result.id || result.workflow_id,
          webhookUrl: this.extractWebhookUrl(workflow)
        };
      } catch (mcpError) {
        console.warn('MCP workflow creation failed, falling back to direct API:', mcpError);
        
        // Fallback to direct N8N API
        const response = await fetch(`${process.env.N8N_API_URL}/api/v1/workflows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
          },
          body: JSON.stringify(n8nWorkflow)
        });

        if (!response.ok) {
          throw new Error(`N8N API error: ${response.statusText}`);
        }

        const result = await response.json();
        
        return {
          id: result.id,
          webhookUrl: this.extractWebhookUrl(workflow)
        };
      }
    } catch (error) {
      console.error('Error creating workflow in N8N:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow with voice trigger
   */
  async executeWorkflowByVoice(
    voiceCommand: string, 
    context: WorkflowExecutionContext
  ): Promise<any> {
    try {
      // Find matching workflow based on voice command
      const matchingWorkflow = await this.findWorkflowByVoiceCommand(voiceCommand);
      
      if (!matchingWorkflow) {
        throw new Error('No workflow found for voice command');
      }

      // Execute the workflow
      return await this.executeWorkflow(matchingWorkflow.id, {
        ...context,
        triggerType: 'voice',
        voiceCommand
      });
    } catch (error) {
      console.error('Error executing workflow by voice:', error);
      throw error;
    }
  }

  /**
   * Get pre-built workflow templates
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'morning-routine',
        name: 'Morning Routine Automation',
        description: 'Automated morning workflow: check weather, read calendar, summarize emails',
        category: 'productivity',
        trigger: {
          type: 'schedule',
          config: { cron: '0 7 * * *' } // 7 AM daily
        },
        nodes: [
          {
            id: 'weather-node',
            name: 'Get Weather',
            type: 'n8n-nodes-base.HttpRequest',
            position: { x: 100, y: 100 },
            parameters: {
              url: '{{$env.WEATHER_API_URL}}',
              method: 'GET'
            }
          },
          {
            id: 'calendar-node', 
            name: 'Get Today\'s Events',
            type: 'n8n-nodes-base.GoogleCalendar',
            position: { x: 300, y: 100 },
            parameters: {
              operation: 'getAll',
              timeMin: '{{$now}}',
              timeMax: '{{$now.plus(1, "day")}}'
            }
          },
          {
            id: 'voice-summary',
            name: 'Generate Voice Summary',
            type: 'n8n-nodes-base.HttpRequest',
            position: { x: 500, y: 100 },
            parameters: {
              url: '{{$env.N8N_WEBHOOK_URL}}/webhook/voice-response',
              method: 'POST'
            }
          }
        ],
        connections: [
          {
            sourceNode: 'weather-node',
            sourceOutput: 'main',
            targetNode: 'voice-summary',
            targetInput: 'main'
          },
          {
            sourceNode: 'calendar-node',
            sourceOutput: 'main', 
            targetNode: 'voice-summary',
            targetInput: 'main'
          }
        ]
      },
      {
        id: 'expense-tracker',
        name: 'Smart Expense Tracking',
        description: 'Voice-activated expense logging with categorization',
        category: 'finance',
        trigger: {
          type: 'voice',
          config: { 
            keywords: ['expense', 'spent', 'bought', 'cost'],
            webhookUrl: '{{$env.N8N_WEBHOOK_URL}}/webhook/expense-tracker'
          }
        },
        nodes: [
          {
            id: 'parse-expense',
            name: 'Parse Expense Data',
            type: 'n8n-nodes-base.Code',
            position: { x: 100, y: 100 },
            parameters: {
              code: `
                const voiceData = items[0].json;
                const expense = {
                  amount: voiceData.amount,
                  description: voiceData.description,
                  category: voiceData.category || 'Other',
                  date: new Date().toISOString()
                };
                return { expense };
              `
            }
          },
          {
            id: 'save-to-sheets',
            name: 'Save to Expense Sheet',
            type: 'n8n-nodes-base.GoogleSheets',
            position: { x: 300, y: 100 },
            parameters: {
              operation: 'append',
              sheetId: '{{$env.GOOGLE_SHEETS_ID}}',
              range: 'Expenses!A:E'
            }
          }
        ],
        connections: [
          {
            sourceNode: 'parse-expense',
            sourceOutput: 'main',
            targetNode: 'save-to-sheets',
            targetInput: 'main'
          }
        ]
      },
      {
        id: 'email-manager',
        name: 'Smart Email Management', 
        description: 'Prioritize and summarize important emails',
        category: 'communication',
        trigger: {
          type: 'schedule',
          config: { cron: '0 */2 * * *' } // Every 2 hours
        },
        nodes: [
          {
            id: 'fetch-emails',
            name: 'Fetch New Emails',
            type: 'n8n-nodes-base.Gmail',
            position: { x: 100, y: 100 },
            parameters: {
              operation: 'getAll',
              filters: { isUnread: true }
            }
          },
          {
            id: 'prioritize-emails',
            name: 'AI Email Prioritization',
            type: 'n8n-nodes-base.HttpRequest',
            position: { x: 300, y: 100 },
            parameters: {
              url: '{{$env.GEMINI_API_URL}}/v1/models/gemini-pro:generateContent',
              method: 'POST'
            }
          },
          {
            id: 'voice-notification',
            name: 'Voice Notification',
            type: 'n8n-nodes-base.HttpRequest',
            position: { x: 500, y: 100 },
            parameters: {
              url: '{{$env.N8N_WEBHOOK_URL}}/webhook/voice-notification'
            }
          }
        ],
        connections: [
          {
            sourceNode: 'fetch-emails',
            sourceOutput: 'main',
            targetNode: 'prioritize-emails', 
            targetInput: 'main'
          },
          {
            sourceNode: 'prioritize-emails',
            sourceOutput: 'main',
            targetNode: 'voice-notification',
            targetInput: 'main'
          }
        ]
      }
    ];
  }

  /**
   * Convert workflow to N8N format
   */
  private convertToN8NFormat(workflow: WorkflowTemplate): any {
    return {
      name: workflow.name,
      active: true,
      nodes: workflow.nodes.map((node, index) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        typeVersion: 1,
        position: [node.position.x, node.position.y],
        parameters: node.parameters
      })),
      connections: this.convertConnections(workflow.connections),
      settings: {
        executionOrder: 'v1'
      },
      staticData: null,
      meta: {
        templateCreatedBy: 'smart-workflow-builder'
      }
    };
  }

  /**
   * Convert connections to N8N format
   */
  private convertConnections(connections: WorkflowConnection[]): any {
    const n8nConnections: any = {};
    
    connections.forEach(conn => {
      if (!n8nConnections[conn.sourceNode]) {
        n8nConnections[conn.sourceNode] = {};
      }
      if (!n8nConnections[conn.sourceNode][conn.sourceOutput]) {
        n8nConnections[conn.sourceNode][conn.sourceOutput] = [];
      }
      
      n8nConnections[conn.sourceNode][conn.sourceOutput].push({
        node: conn.targetNode,
        type: conn.targetInput,
        index: 0
      });
    });
    
    return n8nConnections;
  }

  /**
   * Extract webhook URL from workflow
   */
  private extractWebhookUrl(workflow: WorkflowTemplate): string | undefined {
    const webhookNode = workflow.nodes.find(node => 
      node.type === 'n8n-nodes-base.Webhook'
    );
    
    if (webhookNode) {
      return `${process.env.N8N_WEBHOOK_URL}/webhook/${webhookNode.parameters.path}`;
    }
    
    return undefined;
  }

  /**
   * Find workflow by voice command
   */
  private async findWorkflowByVoiceCommand(voiceCommand: string): Promise<WorkflowTemplate | null> {
    // Use Gemini to match voice command to workflow
    const prompt = `
    Match this voice command to the most appropriate workflow: "${voiceCommand}"
    
    Available workflows:
    ${this.getWorkflowTemplates().map(w => `- ${w.name}: ${w.description}`).join('\n')}
    
    Return only the workflow ID that best matches, or "none" if no match.
    `;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const workflowId = response.text().trim();
      
      if (workflowId === 'none') {
        return null;
      }
      
      return this.getWorkflowTemplates().find(w => w.id === workflowId) || null;
    } catch (error) {
      console.error('Error matching voice command:', error);
      return null;
    }
  }

  /**
   * Execute workflow
   */
  private async executeWorkflow(workflowId: string, context: WorkflowExecutionContext): Promise<any> {
    try {
      const response = await fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(context)
      });

      if (!response.ok) {
        throw new Error(`Workflow execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }
}

export const n8nMCPService = new N8NMCPService();
export type { WorkflowTemplate, WorkflowNode, WorkflowConnection, WorkflowExecutionContext };