import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  
  const apiDocs = {
    info: {
      title: "Mahboob Personal Assistant API",
      version: "1.0.0",
      description: "API documentation for N8N and other integrations",
      contact: {
        name: "API Support"
      }
    },
    servers: [
      {
        url: baseUrl,
        description: "Production server"
      }
    ],
    authentication: {
      type: "Bearer Token",
      description: "Use API tokens created in the dashboard",
      header: "Authorization: Bearer mpa_your_token_here",
      alternatives: [
        "X-API-Key: mpa_your_token_here",
        "Query parameter: ?token=mpa_your_token_here"
      ]
    },
    endpoints: {
      // Authentication
      "/api/auth/n8n": {
        "GET": {
          description: "Authenticate N8N agent and get context",
          headers: ["Authorization: Bearer TOKEN"],
          response: {
            authenticated: true,
            token: { name: "Token Name", permissions: ["*"] },
            user: { id: "n8n-agent", name: "N8N Agent", role: "automation" }
          }
        },
        "POST": {
          description: "Validate token and get app context",
          body: { action: "validate" | "get_context", data: {} },
          response: {
            valid: true,
            permissions: ["*"]
          }
        }
      },
      
      // Expenses API
      "/api/expenses": {
        "GET": {
          description: "Get expenses with filtering",
          permissions: ["read:expenses"],
          parameters: {
            startDate: "YYYY-MM-DD (optional)",
            endDate: "YYYY-MM-DD (optional)",
            category: "string (optional)",
            limit: "number (optional)"
          },
          response: {
            success: true,
            data: [
              {
                id: "1",
                date: "2024-01-01",
                description: "Coffee",
                category: "Food",
                amount: "5.50",
                currency: "OMR"
              }
            ],
            meta: {
              total: 100,
              filtered: 50
            }
          }
        },
        "POST": {
          description: "Create new expense",
          permissions: ["write:expenses"],
          body: {
            date: "2024-01-01",
            description: "Coffee",
            category: "Food",
            amount: 5.50,
            currency: "OMR",
            paymentMethod: "Card",
            notes: "Optional notes"
          },
          response: {
            success: true,
            message: "Expense created successfully",
            data: {
              id: "timestamp_id",
              date: "2024-01-01",
              description: "Coffee",
              category: "Food",
              amount: 5.50
            }
          }
        }
      },
      
      // Emails API
      "/api/emails": {
        "GET": {
          description: "Get emails with filtering",
          permissions: ["read:emails"],
          parameters: {
            q: "search query (optional)",
            maxResults: "number (default: 50)",
            unreadOnly: "boolean (optional)"
          },
          response: {
            success: true,
            data: {
              emails: [
                {
                  id: "email_1",
                  snippet: "Email preview",
                  unread: true,
                  category: "finance",
                  priority: "high"
                }
              ],
              totalCount: 100,
              unreadCount: 25
            }
          }
        },
        "POST": {
          description: "Send email",
          permissions: ["write:emails"],
          body: {
            to: "recipient@example.com",
            subject: "Email subject",
            body: "Email content",
            priority: "medium"
          },
          response: {
            success: true,
            message: "Email sent successfully"
          }
        }
      },
      
      // Contacts API (future)
      "/api/contacts": {
        "GET": {
          description: "Get contacts",
          permissions: ["read:contacts"],
          response: {
            success: true,
            data: []
          }
        }
      },
      
      // Analytics API (future)
      "/api/analytics": {
        "GET": {
          description: "Get analytics data",
          permissions: ["read:analytics"],
          response: {
            success: true,
            data: {
              expenses: { total: 1000, thisMonth: 200 },
              emails: { total: 500, unread: 25 }
            }
          }
        }
      }
    },
    
    // N8N Integration Examples
    n8nExamples: {
      "HTTP Request Node Configuration": {
        url: `${baseUrl}/api/expenses`,
        method: "GET",
        headers: {
          "Authorization": "Bearer mpa_your_token_here",
          "Content-Type": "application/json"
        }
      },
      
      "Create Expense Workflow": {
        description: "Example workflow to create expense from email",
        nodes: [
          {
            type: "Gmail Trigger",
            description: "Trigger on new emails from bank"
          },
          {
            type: "Extract Data",
            description: "Parse expense amount and description from email"
          },
          {
            type: "HTTP Request",
            url: `${baseUrl}/api/expenses`,
            method: "POST",
            headers: { "Authorization": "Bearer TOKEN" },
            body: {
              "date": "{{new Date().toISOString().split('T')[0]}}",
              "description": "{{$json.description}}",
              "category": "Bank Transfer",
              "amount": "{{$json.amount}}",
              "currency": "OMR"
            }
          }
        ]
      },
      
      "Daily Email Summary": {
        description: "Get unread emails summary",
        nodes: [
          {
            type: "Cron Trigger",
            schedule: "0 9 * * *",
            description: "Daily at 9 AM"
          },
          {
            type: "HTTP Request",
            url: `${baseUrl}/api/emails?unreadOnly=true`,
            method: "GET",
            headers: { "Authorization": "Bearer TOKEN" }
          },
          {
            type: "Process Data",
            description: "Format email summary"
          },
          {
            type: "Send Notification",
            description: "Send summary via preferred channel"
          }
        ]
      }
    },
    
    permissions: {
      "read:expenses": "View expense data",
      "write:expenses": "Create and modify expenses",
      "read:emails": "View email data",
      "write:emails": "Send emails",
      "read:contacts": "View contacts",
      "write:contacts": "Manage contacts",
      "read:calendar": "View calendar events",
      "write:calendar": "Manage calendar events",
      "read:analytics": "View analytics data",
      "*": "Full access to all endpoints",
      "admin": "Administrative access"
    },
    
    errorCodes: {
      "401": "Unauthorized - Invalid or missing API token",
      "403": "Forbidden - Insufficient permissions",
      "400": "Bad Request - Invalid request parameters",
      "404": "Not Found - Endpoint does not exist",
      "429": "Rate Limited - Too many requests",
      "500": "Internal Server Error"
    },
    
    rateLimits: {
      description: "Rate limits apply per token",
      limits: {
        "default": "100 requests per minute",
        "burst": "10 requests per second"
      }
    }
  };

  // Return HTML documentation if browser request, JSON if API request
  const acceptHeader = request.headers.get('Accept') || '';
  if (acceptHeader.includes('text/html')) {
    const htmlDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mahboob Personal Assistant API Documentation</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1, h2, h3 { color: #2c3e50; }
        h1 { border-bottom: 3px solid #3498db; padding-bottom: 0.5rem; }
        h2 { color: #e74c3c; margin-top: 2rem; }
        h3 { color: #f39c12; }
        pre { 
            background: #f8f9fa; 
            padding: 1rem; 
            border-radius: 0.5rem; 
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        code { 
            background: #f8f9fa; 
            padding: 0.2rem 0.4rem; 
            border-radius: 0.25rem; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .endpoint { 
            background: #f8f9fa; 
            margin: 1rem 0; 
            padding: 1rem; 
            border-radius: 0.5rem;
            border-left: 4px solid #27ae60;
        }
        .method { 
            display: inline-block; 
            padding: 0.25rem 0.5rem; 
            border-radius: 0.25rem; 
            color: white; 
            font-weight: bold; 
            font-size: 0.8rem;
        }
        .get { background: #27ae60; }
        .post { background: #3498db; }
        .put { background: #f39c12; }
        .delete { background: #e74c3c; }
        .token-example {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Mahboob Personal Assistant API</h1>
        
        <div class="token-example">
            <h3>🔑 Quick Start for N8N</h3>
            <p>1. Go to <strong>/api-tokens</strong> page in your dashboard</p>
            <p>2. Create a new token with "N8N Agent" permissions</p>
            <p>3. Use the token in your N8N HTTP Request nodes:</p>
            <pre style="background: rgba(255,255,255,0.1); border-left: none;">Authorization: Bearer mpa_your_token_here</pre>
        </div>

        <h2>📋 Available Endpoints</h2>
        
        <div class="endpoint">
            <h3><span class="method get">GET</span> /api/expenses</h3>
            <p><strong>Description:</strong> Retrieve expenses with optional filtering</p>
            <p><strong>Permission:</strong> <code>read:expenses</code></p>
            <p><strong>Parameters:</strong></p>
            <ul>
                <li><code>startDate</code> - Filter from date (YYYY-MM-DD)</li>
                <li><code>endDate</code> - Filter to date (YYYY-MM-DD)</li>
                <li><code>category</code> - Filter by category</li>
                <li><code>limit</code> - Limit number of results</li>
            </ul>
        </div>

        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/expenses</h3>
            <p><strong>Description:</strong> Create a new expense</p>
            <p><strong>Permission:</strong> <code>write:expenses</code></p>
            <pre>{
  "date": "2024-01-01",
  "description": "Coffee",
  "category": "Food",
  "amount": 5.50,
  "currency": "OMR",
  "paymentMethod": "Card",
  "notes": "Optional notes"
}</pre>
        </div>

        <div class="endpoint">
            <h3><span class="method get">GET</span> /api/emails</h3>
            <p><strong>Description:</strong> Retrieve emails with filtering</p>
            <p><strong>Permission:</strong> <code>read:emails</code></p>
            <p><strong>Parameters:</strong></p>
            <ul>
                <li><code>q</code> - Search query</li>
                <li><code>maxResults</code> - Number of results (default: 50)</li>
                <li><code>unreadOnly</code> - Only unread emails (true/false)</li>
            </ul>
        </div>

        <h2>🔐 Authentication</h2>
        <p>All API endpoints require authentication via API token. You can provide the token in three ways:</p>
        <ul>
            <li><strong>Authorization Header:</strong> <code>Authorization: Bearer mpa_your_token</code></li>
            <li><strong>API Key Header:</strong> <code>X-API-Key: mpa_your_token</code></li>
            <li><strong>Query Parameter:</strong> <code>?token=mpa_your_token</code></li>
        </ul>

        <h2>🛠️ N8N Integration Examples</h2>
        
        <h3>Example 1: Get Unread Emails</h3>
        <pre>
URL: ${baseUrl}/api/emails?unreadOnly=true&maxResults=10
Method: GET
Headers:
  Authorization: Bearer mpa_your_token_here
  Content-Type: application/json
        </pre>

        <h3>Example 2: Create Expense</h3>
        <pre>
URL: ${baseUrl}/api/expenses
Method: POST
Headers:
  Authorization: Bearer mpa_your_token_here
  Content-Type: application/json
Body:
{
  "date": "{{new Date().toISOString().split('T')[0]}}",
  "description": "Automated expense from N8N",
  "category": "Automation",
  "amount": 10.00,
  "currency": "OMR"
}
        </pre>

        <h2>📊 Response Format</h2>
        <p>All API responses follow this standard format:</p>
        <pre>{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "message": "Optional message"
}</pre>

        <h2>⚠️ Error Codes</h2>
        <ul>
            <li><strong>401 Unauthorized:</strong> Invalid or missing API token</li>
            <li><strong>403 Forbidden:</strong> Insufficient permissions</li>
            <li><strong>400 Bad Request:</strong> Invalid request parameters</li>
            <li><strong>500 Internal Server Error:</strong> Server error</li>
        </ul>

        <p style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <strong>Need help?</strong> Visit the <a href="/api-tokens" style="color: #3498db;">API Tokens</a> page in your dashboard to create and manage tokens.
        </p>
    </div>
</body>
</html>`;
    
    return new NextResponse(htmlDoc, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
  
  return NextResponse.json(apiDocs);
}