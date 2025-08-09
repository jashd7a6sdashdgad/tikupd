/**
 * MCP (Model Context Protocol) Client
 * Handles communication with N8N MCP server
 */

interface MCPRequest {
  method: string;
  params?: any;
  id?: string | number;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

class MCPClient {
  private endpoint: string;

  constructor(endpoint: string = process.env.N8N_MCP_ENDPOINT || 'http://localhost:3001/mcp/n8n') {
    this.endpoint = endpoint;
  }

  /**
   * Send MCP request
   */
  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MCP client error:', error);
      throw error;
    }
  }

  /**
   * Initialize MCP connection
   */
  async initialize(): Promise<void> {
    const request: MCPRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'mahboob-personal-assistant',
          version: '1.0.0'
        }
      },
      id: 1
    };

    const response = await this.sendRequest(request);
    if (response.error) {
      throw new Error(`MCP initialization failed: ${response.error.message}`);
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    const request: MCPRequest = {
      method: 'tools/list',
      id: 2
    };

    const response = await this.sendRequest(request);
    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    return response.result?.tools || [];
  }

  /**
   * Call a tool
   */
  async callTool(name: string, arguments_: Record<string, any>): Promise<any> {
    const request: MCPRequest = {
      method: 'tools/call',
      params: {
        name,
        arguments: arguments_
      },
      id: Date.now()
    };

    const response = await this.sendRequest(request);
    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Create N8N workflow using MCP
   */
  async createWorkflow(workflowData: any): Promise<any> {
    return await this.callTool('create_workflow', {
      workflow: workflowData
    });
  }

  /**
   * Get N8N workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<any> {
    return await this.callTool('get_workflow', {
      workflow_id: workflowId
    });
  }

  /**
   * List all N8N workflows
   */
  async listWorkflows(): Promise<any> {
    return await this.callTool('list_workflows', {});
  }

  /**
   * Execute N8N workflow
   */
  async executeWorkflow(workflowId: string, data: any = {}): Promise<any> {
    return await this.callTool('execute_workflow', {
      workflow_id: workflowId,
      data
    });
  }

  /**
   * Update N8N workflow
   */
  async updateWorkflow(workflowId: string, workflowData: any): Promise<any> {
    return await this.callTool('update_workflow', {
      workflow_id: workflowId,
      workflow: workflowData
    });
  }

  /**
   * Delete N8N workflow
   */
  async deleteWorkflow(workflowId: string): Promise<any> {
    return await this.callTool('delete_workflow', {
      workflow_id: workflowId
    });
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutions(workflowId: string, limit: number = 10): Promise<any> {
    return await this.callTool('get_workflow_executions', {
      workflow_id: workflowId,
      limit
    });
  }

  /**
   * Create webhook for workflow
   */
  async createWebhook(workflowId: string, webhookConfig: any): Promise<any> {
    return await this.callTool('create_webhook', {
      workflow_id: workflowId,
      webhook_config: webhookConfig
    });
  }
}

// Singleton instance
export const mcpClient = new MCPClient();

// Initialize MCP client on import
let initialized = false;
export async function ensureMCPInitialized(): Promise<void> {
  if (!initialized) {
    try {
      await mcpClient.initialize();
      initialized = true;
      console.log('✅ MCP client initialized successfully');
    } catch (error) {
      console.warn('⚠️ MCP client initialization failed, falling back to direct API:', error);
      // Don't throw - allow fallback to direct API
    }
  }
}

export type { MCPTool, MCPRequest, MCPResponse };