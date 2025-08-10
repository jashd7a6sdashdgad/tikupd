import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_VOICE_ASSISTANT_WEBHOOK_URL;
const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // Get N8N workflow statistics and integration data
    const n8nStats = await getN8NStats();
    
    return NextResponse.json({
      success: true,
      data: n8nStats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('N8N Stats API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch N8N stats'
    }, { status: 500 });
  }
}

async function getN8NStats() {
  try {
    // If we have N8N API credentials, fetch real stats
    if (N8N_API_URL && N8N_API_KEY) {
      return await getRealN8NStats();
    }
    
    // Otherwise, return sample data based on webhook activity
    return await getSampleN8NStats();
  } catch (error) {
    console.error('Error getting N8N stats:', error);
    return getDefaultN8NStats();
  }
}

async function getRealN8NStats() {
  try {
    // Fetch workflows from N8N API
    const workflowsResponse = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY!,
        'Content-Type': 'application/json'
      }
    });

    if (!workflowsResponse.ok) {
      throw new Error('Failed to fetch N8N workflows');
    }

    const workflows = await workflowsResponse.json();
    
    // Get execution statistics
    const executionsResponse = await fetch(`${N8N_API_URL}/executions`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY!,
        'Content-Type': 'application/json'
      }
    });

    const executions = executionsResponse.ok ? await executionsResponse.json() : { data: [] };

    // Calculate stats
    const activeWorkflows = workflows.filter((wf: any) => wf.active).length;
    const totalExecutions = executions.data?.length || 0;
    const successfulExecutions = executions.data?.filter((ex: any) => ex.finished && !ex.error).length || 0;
    const failedExecutions = executions.data?.filter((ex: any) => ex.finished && ex.error).length || 0;
    
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      totalWorkflows: workflows.length,
      activeWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: Math.round(successRate * 100) / 100,
      lastExecution: executions.data?.[0]?.startedAt || null,
      webhookUrl: N8N_WEBHOOK_URL ? 'Configured' : 'Not configured',
      connected: true
    };
  } catch (error) {
    console.error('Error fetching real N8N stats:', error);
    return getDefaultN8NStats();
  }
}

async function getSampleN8NStats() {
  // Return sample data based on typical N8N usage patterns
  return {
    totalWorkflows: 12,
    activeWorkflows: 8,
    totalExecutions: 1247,
    successfulExecutions: 1189,
    failedExecutions: 58,
    successRate: 95.3,
    lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    webhookUrl: N8N_WEBHOOK_URL ? 'Configured' : 'Not configured',
    connected: !!N8N_WEBHOOK_URL,
    sampleData: true
  };
}

function getDefaultN8NStats() {
  return {
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    successRate: 0,
    lastExecution: null,
    webhookUrl: N8N_WEBHOOK_URL ? 'Configured' : 'Not configured',
    connected: false,
    error: 'Unable to fetch N8N statistics'
  };
} 