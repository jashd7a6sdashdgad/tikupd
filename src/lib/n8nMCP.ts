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
      // Check for required configuration
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        console.error('❌ N8N configuration missing:', {
          hasApiUrl: !!n8nApiUrl,
          hasApiKey: !!n8nApiKey
        });
        throw new Error('N8N configuration is incomplete. Please set N8N_API_URL and N8N_API_KEY environment variables.');
      }
      
      // Ensure MCP client is initialized
      try {
        await ensureMCPInitialized();
      } catch (mcpInitError) {
        console.warn('MCP client initialization failed, will use direct API:', mcpInitError);
      }
      
      // Convert our workflow format to N8N format
      const n8nWorkflow = this.convertToN8NFormat(workflow);
      
      console.log(`🔧 Converting workflow "${workflow.name}" to N8N format...`);
      console.log(`📋 N8N Workflow nodes: ${n8nWorkflow.nodes?.length || 0}`);
      
      // Try MCP first if available
      try {
        if (mcpClient) {
          console.log('🔗 Attempting to create workflow via MCP...');
          const result = await mcpClient.createWorkflow(n8nWorkflow);
          
          console.log('✅ Workflow created via MCP successfully:', result);
          return {
            id: result.id || result.workflow_id,
            webhookUrl: this.extractWebhookUrl(workflow)
          };
        }
      } catch (mcpError) {
        console.warn('⚠️ MCP workflow creation failed, falling back to direct API:', mcpError);
      }
      
      // Fallback to direct N8N API
      console.log(`🌐 Creating workflow via direct N8N API: ${n8nApiUrl}/api/v1/workflows`);
      
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify(n8nWorkflow)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ N8N API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: `${n8nApiUrl}/api/v1/workflows`,
          workflowName: workflow.name
        });
        
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch (parseError) {
          // Error is not JSON, use as-is
        }
        
        throw new Error(`N8N API error (${response.status}): ${response.statusText}. ${errorMessage}`);
      }

      const result = await response.json();
      console.log('✅ Workflow created via N8N API successfully:', result);
      
      return {
        id: result.id,
        webhookUrl: this.extractWebhookUrl(workflow)
      };
      
    } catch (error) {
      console.error('💥 Error creating workflow in N8N:', error);
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('N8N configuration')) {
          throw new Error('N8N is not configured. Please set up your N8N instance URL and API key in environment variables.');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Cannot connect to N8N instance. Please check if N8N is running and accessible.');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred while creating workflow in N8N');
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
    // N8N API expects only specific fields to avoid "additional properties" error
    const n8nWorkflow = {
      name: workflow.name,
      active: false, // Start inactive for safety
      nodes: workflow.nodes.map((node, index) => {
        // Validate and clean node data
        const cleanNode = {
          id: node.id || `node_${index}`,
          name: node.name || `Node ${index}`,
          type: node.type || 'n8n-nodes-base.NoOp',
          typeVersion: 1,
          position: [node.position?.x || 100, node.position?.y || 100],
          parameters: node.parameters || {}
        };
        
        // Remove any undefined or null values
        Object.keys(cleanNode).forEach(key => {
          if (cleanNode[key] === undefined || cleanNode[key] === null) {
            delete cleanNode[key];
          }
        });
        
        return cleanNode;
      }),
      connections: this.convertConnections(workflow.connections)
    };

    // Only add settings if needed and valid
    if (workflow.nodes.length > 0) {
      n8nWorkflow['settings'] = {
        executionOrder: 'v1'
      };
    }

    console.log('🔧 N8N workflow format:', JSON.stringify(n8nWorkflow, null, 2));
    return n8nWorkflow;
  }

  /**
   * Convert connections to N8N format
   */
  private convertConnections(connections: WorkflowConnection[]): any {
    const n8nConnections: any = {};
    
    // Handle empty connections array
    if (!connections || connections.length === 0) {
      return {};
    }
    
    connections.forEach(conn => {
      // Validate connection properties
      if (!conn.sourceNode || !conn.targetNode) {
        console.warn('⚠️ Skipping invalid connection:', conn);
        return;
      }
      
      const sourceOutput = conn.sourceOutput || 'main';
      const targetInput = conn.targetInput || 'main';
      
      if (!n8nConnections[conn.sourceNode]) {
        n8nConnections[conn.sourceNode] = {};
      }
      if (!n8nConnections[conn.sourceNode][sourceOutput]) {
        n8nConnections[conn.sourceNode][sourceOutput] = [];
      }
      
      n8nConnections[conn.sourceNode][sourceOutput].push({
        node: conn.targetNode,
        type: targetInput,
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

  /**
   * Update an existing workflow
   */
  async updateWorkflow(workflowId: string, updates: Partial<WorkflowTemplate>): Promise<boolean> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          await mcpClient.updateWorkflow(workflowId, updates);
          return true;
        } catch (mcpError) {
          console.warn('MCP update failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          await mcpClient.deleteWorkflow(workflowId);
          return true;
        } catch (mcpError) {
          console.warn('MCP delete failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutions(workflowId: string, limit: number = 10): Promise<any[]> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          return await mcpClient.getWorkflowExecutions(workflowId, limit);
        } catch (mcpError) {
          console.warn('MCP get executions failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(
        `${n8nApiUrl}/api/v1/workflows/${workflowId}/executions?limit=${limit}`,
        {
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get workflow executions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error getting workflow executions:', error);
      throw error;
    }
  }

  /**
   * Activate/deactivate a workflow
   */
  async toggleWorkflowStatus(workflowId: string, active: boolean): Promise<boolean> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          await mcpClient.updateWorkflow(workflowId, { active });
          return true;
        } catch (mcpError) {
          console.warn('MCP toggle status failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify({ active })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle workflow status: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      throw error;
    }
  }

  /**
   * Test workflow execution with sample data
   */
  async testWorkflow(workflowId: string, testData?: any): Promise<any> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          return await mcpClient.executeWorkflow(workflowId, testData);
        } catch (mcpError) {
          console.warn('MCP test workflow failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify({ data: testData || {} })
      });

      if (!response.ok) {
        throw new Error(`Failed to test workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics and metrics
   */
  async getWorkflowStats(workflowId: string): Promise<any> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          return await mcpClient.getWorkflow(workflowId);
        } catch (mcpError) {
          console.warn('MCP get stats failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}/stats`, {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow stats:', error);
      throw error;
    }
  }

  /**
   * Validate workflow configuration
   */
  async validateWorkflow(workflow: WorkflowTemplate): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!workflow.name) errors.push('Workflow name is required');
    if (!workflow.trigger) errors.push('Workflow trigger is required');
    if (!workflow.nodes || workflow.nodes.length === 0) errors.push('Workflow must have at least one node');

    // Validate nodes
    workflow.nodes?.forEach((node, index) => {
      if (!node.id) errors.push(`Node ${index + 1} must have an ID`);
      if (!node.type) errors.push(`Node ${index + 1} must have a type`);
      if (!node.position) errors.push(`Node ${index + 1} must have a position`);
    });

    // Validate connections
    workflow.connections?.forEach((conn, index) => {
      if (!conn.sourceNode) errors.push(`Connection ${index + 1} must have a source node`);
      if (!conn.targetNode) errors.push(`Connection ${index + 1} must have a target node`);
      
      // Check if referenced nodes exist
      const sourceExists = workflow.nodes?.some(n => n.id === conn.sourceNode);
      const targetExists = workflow.nodes?.some(n => n.id === conn.targetNode);
      
      if (!sourceExists) errors.push(`Connection ${index + 1} references non-existent source node: ${conn.sourceNode}`);
      if (!targetExists) errors.push(`Connection ${index + 1} references non-existent target node: ${conn.targetNode}`);
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export workflow as JSON
   */
  exportWorkflow(workflow: WorkflowTemplate): string {
    return JSON.stringify(workflow, null, 2);
  }

  /**
   * Import workflow from JSON
   */
  async importWorkflow(jsonString: string): Promise<WorkflowTemplate> {
    try {
      const workflow = JSON.parse(jsonString);
      const validation = await this.validateWorkflow(workflow);
      
      if (!validation.valid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
      }
      
      return workflow;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  }

  /**
   * Clone workflow with new ID
   */
  cloneWorkflow(workflow: WorkflowTemplate, newName?: string): WorkflowTemplate {
    const cloned = JSON.parse(JSON.stringify(workflow));
    cloned.id = `cloned_${Date.now()}`;
    cloned.name = newName || `${workflow.name} (Copy)`;
    
    // Update node IDs to avoid conflicts
    const nodeIdMap = new Map<string, string>();
    cloned.nodes?.forEach((node: WorkflowNode) => {
      const oldId = node.id;
      node.id = `cloned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMap.set(oldId, node.id);
    });
    
    // Update connections with new node IDs
    cloned.connections?.forEach((conn: WorkflowConnection) => {
      if (nodeIdMap.has(conn.sourceNode)) {
        conn.sourceNode = nodeIdMap.get(conn.sourceNode)!;
      }
      if (nodeIdMap.has(conn.targetNode)) {
        conn.targetNode = nodeIdMap.get(conn.targetNode)!;
      }
    });
    
    return cloned;
  }

  /**
   * Get all workflows from N8N instance
   */
  async getAllWorkflows(): Promise<WorkflowTemplate[]> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          const workflows = await mcpClient.listWorkflows();
          return workflows.map((w: any) => this.convertFromN8NFormat(w));
        } catch (mcpError) {
          console.warn('MCP list workflows failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflows: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.map((w: any) => this.convertFromN8NFormat(w)) || [];
    } catch (error) {
      console.error('Error getting all workflows:', error);
      throw error;
    }
  }

  /**
   * Convert N8N format back to our WorkflowTemplate format
   */
  private convertFromN8NFormat(n8nWorkflow: any): WorkflowTemplate {
    return {
      id: n8nWorkflow.id,
      name: n8nWorkflow.name,
      description: n8nWorkflow.description || '',
      category: this.detectCategory(n8nWorkflow),
      trigger: this.extractTrigger(n8nWorkflow),
      nodes: n8nWorkflow.nodes?.map((node: any) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        position: { x: node.position[0], y: node.position[1] },
        parameters: node.parameters || {}
      })) || [],
      connections: this.convertFromN8NConnections(n8nWorkflow.connections)
    };
  }

  /**
   * Convert N8N connections back to our format
   */
  private convertFromN8NConnections(n8nConnections: any): WorkflowConnection[] {
    const connections: WorkflowConnection[] = [];
    
    if (!n8nConnections) return connections;
    
    Object.entries(n8nConnections).forEach(([sourceNode, outputs]: [string, any]) => {
      Object.entries(outputs).forEach(([sourceOutput, targets]: [string, any]) => {
        if (Array.isArray(targets)) {
          targets.forEach((target: any) => {
            connections.push({
              sourceNode,
              sourceOutput,
              targetNode: target.node,
              targetInput: target.type
            });
          });
        }
      });
    });
    
    return connections;
  }

  /**
   * Detect workflow category based on nodes and connections
   */
  private detectCategory(workflow: any): WorkflowTemplate['category'] {
    const nodeTypes = workflow.nodes?.map((n: any) => n.type) || [];
    
    if (nodeTypes.some((t: string) => t.includes('Gmail') || t.includes('Email'))) {
      return 'communication';
    }
    if (nodeTypes.some((t: string) => t.includes('GoogleSheets') || t.includes('Expense'))) {
      return 'finance';
    }
    if (nodeTypes.some((t: string) => t.includes('GoogleCalendar') || t.includes('Schedule'))) {
      return 'productivity';
    }
    if (nodeTypes.some((t: string) => t.includes('Health') || t.includes('Fitness'))) {
      return 'health';
    }
    
    return 'automation';
  }

  /**
   * Extract trigger information from N8N workflow
   */
  private extractTrigger(workflow: any): WorkflowTemplate['trigger'] {
    const triggerNode = workflow.nodes?.find((n: any) => 
      n.type.includes('Trigger') || n.type.includes('Webhook') || n.type.includes('Schedule')
    );
    
    if (!triggerNode) {
      return {
        type: 'webhook',
        config: {}
      };
    }
    
    if (triggerNode.type.includes('Schedule')) {
      return {
        type: 'schedule',
        config: { cron: triggerNode.parameters?.rule || '0 * * * *' }
      };
    }
    
    if (triggerNode.type.includes('Webhook')) {
      return {
        type: 'webhook',
        config: { path: triggerNode.parameters?.path || 'webhook' }
      };
    }
    
    return {
      type: 'condition',
      config: {}
    };
  }

  /**
   * Validate N8N configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!process.env.GEMINI_API_KEY) {
      errors.push('GEMINI_API_KEY environment variable is required');
    }
    
    if (!process.env.N8N_API_URL) {
      errors.push('N8N_API_URL environment variable is required');
    }
    
    if (!process.env.N8N_API_KEY) {
      errors.push('N8N_API_KEY environment variable is required');
    }
    
    if (!process.env.N8N_WEBHOOK_URL) {
      errors.push('N8N_WEBHOOK_URL environment variable is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      gemini: boolean;
      n8n: boolean;
      mcp: boolean;
    };
    details: string[];
  }> {
    const checks = {
      gemini: false,
      n8n: false,
      mcp: false
    };
    
    const details: string[] = [];
    
    // Check Gemini
    try {
      await this.model.generateContent('test');
      checks.gemini = true;
    } catch (error) {
      details.push(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Check N8N
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      if (n8nApiUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(`${n8nApiUrl}/api/v1/health`, { 
            signal: controller.signal 
          });
          clearTimeout(timeoutId);
          checks.n8n = response.ok;
          if (!response.ok) {
            details.push(`N8N health check failed: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            details.push('N8N health check timed out after 5 seconds');
          } else {
            throw fetchError;
          }
        }
      } else {
        details.push('N8N_API_URL not configured');
      }
    } catch (error) {
      details.push(`N8N connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Check MCP
    try {
      if (mcpClient) {
        await mcpClient.initialize();
        checks.mcp = true;
      } else {
        details.push('MCP client not available');
      }
    } catch (error) {
      details.push(`MCP error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (healthyChecks === 3) {
      status = 'healthy';
    } else if (healthyChecks >= 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return { status, checks, details };
  }

  /**
   * Get workflow execution logs
   */
  async getWorkflowLogs(workflowId: string, executionId?: string): Promise<any[]> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      let url = `${n8nApiUrl}/api/v1/workflows/${workflowId}/executions`;
      if (executionId) {
        url += `/${executionId}/logs`;
      } else {
        url += '/logs';
      }

      const response = await fetch(url, {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow logs: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error getting workflow logs:', error);
      throw error;
    }
  }

  /**
   * Retry failed workflow execution
   */
  async retryWorkflowExecution(workflowId: string, executionId: string): Promise<any> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}/executions/${executionId}/retry`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to retry workflow execution: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrying workflow execution:', error);
      throw error;
    }
  }

  /**
   * Get workflow performance metrics
   */
  async getWorkflowMetrics(workflowId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      const now = new Date();
      let startTime: Date;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const response = await fetch(
        `${n8nApiUrl}/api/v1/workflows/${workflowId}/executions?since=${startTime.toISOString()}`,
        {
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get workflow metrics: ${response.statusText}`);
      }

      const executions = await response.json();
      const data = executions.data || [];
      
      // Calculate metrics
      const totalExecutions = data.length;
      const successfulExecutions = data.filter((e: any) => e.finished && !e.error).length;
      const failedExecutions = data.filter((e: any) => e.finished && e.error).length;
      const averageExecutionTime = data
        .filter((e: any) => e.finished && e.startedAt && e.finishedAt)
        .reduce((acc: number, e: any) => {
          const duration = new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime();
          return acc + duration;
        }, 0) / Math.max(successfulExecutions, 1);

      return {
        timeRange,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        averageExecutionTime: Math.round(averageExecutionTime),
        executions: data
      };
    } catch (error) {
      console.error('Error getting workflow metrics:', error);
      throw error;
    }
  }

  /**
   * Create workflow backup
   */
  async createWorkflowBackup(workflowId: string): Promise<string> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      const backup = {
        ...workflow,
        backupCreatedAt: new Date().toISOString(),
        backupVersion: '1.0'
      };
      
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Error creating workflow backup:', error);
      throw error;
    }
  }

  /**
   * Restore workflow from backup
   */
  async restoreWorkflowFromBackup(backupJson: string, newName?: string): Promise<WorkflowTemplate> {
    try {
      const backup = JSON.parse(backupJson);
      
      // Validate backup format
      if (!backup.id || !backup.name || !backup.nodes) {
        throw new Error('Invalid backup format');
      }
      
      // Create new workflow with backup data
      const restoredWorkflow = {
        ...backup,
        id: `restored_${Date.now()}`,
        name: newName || `${backup.name} (Restored)`,
        backupCreatedAt: undefined,
        backupVersion: undefined
      };
      
      // Validate the restored workflow
      const validation = await this.validateWorkflow(restoredWorkflow);
      if (!validation.valid) {
        throw new Error(`Invalid restored workflow: ${validation.errors.join(', ')}`);
      }
      
      return restoredWorkflow;
    } catch (error) {
      console.error('Error restoring workflow from backup:', error);
      throw error;
    }
  }

  /**
   * Get workflow by ID (helper method)
   */
  private async getWorkflow(workflowId: string): Promise<any> {
    try {
      const n8nApiUrl = process.env.N8N_API_URL;
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiUrl || !n8nApiKey) {
        throw new Error('N8N configuration is incomplete');
      }

      // Try MCP first
      if (mcpClient) {
        try {
          return await mcpClient.getWorkflow(workflowId);
        } catch (mcpError) {
          console.warn('MCP get workflow failed, falling back to direct API:', mcpError);
        }
      }

      // Fallback to direct API
      const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw error;
    }
  }
}

// Export the service instance and types
export const n8nMCPService = new N8NMCPService();
export type { 
  WorkflowTemplate, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowExecutionContext 
};

// Export utility functions for easier access
export const n8nUtils = {
  /**
   * Quick workflow validation
   */
  validateWorkflow: (workflow: WorkflowTemplate) => n8nMCPService.validateWorkflow(workflow),
  
  /**
   * Export workflow to JSON string
   */
  exportWorkflow: (workflow: WorkflowTemplate) => n8nMCPService.exportWorkflow(workflow),
  
  /**
   * Import workflow from JSON string
   */
  importWorkflow: (jsonString: string) => n8nMCPService.importWorkflow(jsonString),
  
  /**
   * Clone workflow
   */
  cloneWorkflow: (workflow: WorkflowTemplate, newName?: string) => n8nMCPService.cloneWorkflow(workflow, newName),
  
  /**
   * Validate configuration
   */
  validateConfiguration: () => n8nMCPService.validateConfiguration(),
  
  /**
   * Get health status
   */
  getHealthStatus: () => n8nMCPService.getHealthStatus()
};