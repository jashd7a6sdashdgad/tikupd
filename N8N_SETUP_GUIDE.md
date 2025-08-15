# 🚀 Analytics API Fix Guide for N8N

## Problem
The `/api/analytics/tracking` endpoint returns zeros because Google OAuth tokens are expired.

## Root Cause
- ✅ API endpoint works correctly
- ✅ Token fetching logic works  
- ❌ Tokens are expired (401 errors from Google APIs)
- ❌ Refresh token is also invalid ("unauthorized_client")

## Quick Fix

### Method 1: Browser Re-authentication (Easiest)
1. Open in your browser: `http://localhost:3001/api/auth/google`
2. Complete Google OAuth flow
3. Fresh tokens will be saved automatically
4. N8N will now get real data from the API

### Method 2: Manual Environment Update
Update your `.env.local` with fresh tokens from Google OAuth Playground:
1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select scopes: Calendar API v3, Gmail API v1, Google Sheets API v4
3. Authorize and get tokens
4. Update environment:
```env
GOOGLE_ACCESS_TOKEN=ya29.a0AX9GBd...
GOOGLE_REFRESH_TOKEN=1//05_Z9gp0...
```

### Method 3: N8N Header Method
Send tokens directly in N8N HTTP requests:
```http
GET /api/analytics/tracking
Authorization: Bearer YOUR_JWT_TOKEN
X-Google-Access-Token: YOUR_FRESH_GOOGLE_ACCESS_TOKEN
```

## Expected Result After Fix
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEvents": 25,
      "totalEmails": 150, 
      "totalExpenses": 2500.50,
      "totalContacts": 48
    },
    "debug": {
      "hasRealData": true,
      "apiResponses": {
        "calendar": {"success": true, "count": 25},
        "email": {"success": true, "count": 150},
        "expenses": {"success": true, "count": 45}
      }
    }
  }
}
```

---

# Original N8N Setup Guide

### Step 1: N8N Instance Setup

#### Option A: Self-Hosted N8N (Recommended)
```bash
# Using Docker (easiest method)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e WEBHOOK_URL=http://localhost:5678/ \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-secure-password \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

#### Option B: N8N Cloud
1. Sign up at [n8n.cloud](https://n8n.cloud)
2. Create a new instance
3. Get your instance URL (e.g., `https://your-instance.app.n8n.cloud`)

### Step 2: Enable API Access

1. **In N8N Interface:**
   - Go to Settings → API
   - Enable "Allow API access"
   - Generate an API key and copy it

2. **Set API Permissions:**
   - Enable "Workflow management"
   - Enable "Execution access"
   - Save settings

### Step 3: Configure Environment Variables

Add these environment variables to your deployment:

#### Required Variables
```env
# N8N API Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here
N8N_WEBHOOK_URL=https://your-n8n-instance.com

# Optional: Gemini AI for workflow generation
GEMINI_API_KEY=your-gemini-api-key
```

#### For Different Deployment Platforms:

**Vercel:**
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add the variables above

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add the variables above

**Self-hosted:**
Add to your `.env.local` file:
```env
N8N_API_URL=http://localhost:5678
N8N_API_KEY=your-api-key-here
N8N_WEBHOOK_URL=http://localhost:5678
GEMINI_API_KEY=your-gemini-api-key
```

## 🧪 Testing Your Setup

### 1. Test N8N Connection
Visit your workflow builder at `/workflow-builder` and try:
- Loading templates (should show pre-built workflows)
- Generating a workflow with AI
- Deploying a simple workflow

### 2. Verify API Access
Test the N8N API directly:
```bash
curl -X GET "https://your-n8n-instance.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: your-api-key-here"
```

### 3. Test Workflow Deployment
1. Go to `/workflow-builder`
2. Select a template (e.g., "Morning Routine Automation")
3. Click "Deploy" - should show success message
4. Check your N8N instance for the new workflow

## 🔄 Sample N8N Workflows

### Morning Routine Workflow
```json
{
  "name": "Morning Routine",
  "active": true,
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.Cron",
      "parameters": {
        "rule": "0 7 * * *"
      }
    },
    {
      "name": "Get Weather",
      "type": "n8n-nodes-base.HttpRequest",
      "parameters": {
        "url": "https://api.openweathermap.org/data/2.5/weather",
        "qs": {
          "q": "Your City",
          "appid": "your-weather-api-key"
        }
      }
    }
  ]
}
```

### Expense Tracking Workflow
```json
{
  "name": "Expense Tracker",
  "active": true,
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.Webhook",
      "parameters": {
        "path": "expense-tracker"
      }
    },
    {
      "name": "Save to Google Sheets",
      "type": "n8n-nodes-base.GoogleSheets",
      "parameters": {
        "operation": "append",
        "sheetId": "your-sheet-id",
        "range": "A:E"
      }
    }
  ]
}
```

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "N8N is not configured" Error
**Problem:** Environment variables not set
**Solution:** 
- Check that `N8N_API_URL` and `N8N_API_KEY` are set
- Restart your application after adding variables
- Verify variables are accessible: `console.log(process.env.N8N_API_URL)`

#### 2. "Cannot connect to N8N" Error
**Problem:** Network connectivity issues
**Solutions:**
- Ensure N8N instance is running and accessible
- Check firewall settings (port 5678 for self-hosted)
- Verify URL format (include `http://` or `https://`)
- Test direct access: `curl https://your-n8n-instance.com/api/v1/health`

#### 3. "Invalid API Key" Error
**Problem:** API key configuration issues
**Solutions:**
- Regenerate API key in N8N settings
- Ensure API access is enabled in N8N
- Check for extra spaces or characters in the key

#### 4. Webhook URLs Not Working
**Problem:** Webhook configuration issues
**Solutions:**
- Set correct `N8N_WEBHOOK_URL` (usually same as `N8N_API_URL`)
- Ensure webhooks are enabled in N8N settings
- Check webhook path configuration in workflows

### Development vs Production Setup

#### Development (Local Testing)
```env
N8N_API_URL=http://localhost:5678
N8N_WEBHOOK_URL=http://localhost:5678
```

#### Production (Cloud Deployment)
```env
N8N_API_URL=https://your-domain.com
N8N_WEBHOOK_URL=https://your-domain.com
```

## 🔐 Security Best Practices

1. **API Key Security:**
   - Never commit API keys to version control
   - Use environment variables only
   - Rotate API keys regularly

2. **Network Security:**
   - Use HTTPS for production
   - Implement IP restrictions if possible
   - Enable basic auth for N8N interface

3. **Workflow Security:**
   - Limit webhook access
   - Validate input data
   - Use secure connections for external APIs

## 📚 Advanced Configuration

### Custom Node Installation
Add custom nodes to N8N:
```bash
# Inside N8N Docker container
npm install n8n-nodes-your-custom-node
```

### Environment-Specific Settings
```env
# Development
N8N_BASIC_AUTH_ACTIVE=false
N8N_LOG_LEVEL=debug

# Production  
N8N_BASIC_AUTH_ACTIVE=true
N8N_SECURE_COOKIE=true
N8N_LOG_LEVEL=warn
```

### Backup and Recovery
```bash
# Backup N8N data
docker cp n8n:/home/node/.n8n ./n8n-backup

# Restore N8N data
docker cp ./n8n-backup n8n:/home/node/.n8n
```

## 🚀 Getting Started Checklist

- [ ] N8N instance running and accessible
- [ ] API access enabled in N8N settings
- [ ] API key generated and copied
- [ ] Environment variables configured
- [ ] Application restarted/redeployed
- [ ] Workflow builder page loads without errors
- [ ] Template workflows visible
- [ ] Test workflow deployment successful
- [ ] Webhook endpoints responding

## 🆘 Still Having Issues?

### Mock Mode for Testing
If you can't get N8N running immediately, use mock mode:
1. Visit `/workflow-builder` 
2. When you see the N8N error, click "Try Mock Deploy"
3. This simulates workflow deployment for testing UI

### Support Resources
- [N8N Documentation](https://docs.n8n.io/)
- [N8N API Reference](https://docs.n8n.io/api/)
- [N8N Community Forum](https://community.n8n.io/)
- [Docker Installation Guide](https://docs.n8n.io/hosting/installation/docker/)

### Contact Information
For setup assistance with your Personal Assistant:
- Create an issue in the project repository
- Include error messages and environment details
- Specify your deployment platform (Vercel, Netlify, etc.)

---

## 🎯 Quick Test Commands

Test your setup with these curl commands:

```bash
# Test N8N health
curl -X GET "${N8N_API_URL}/api/v1/health"

# Test API key
curl -X GET "${N8N_API_URL}/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}"

# Test workflow creation
curl -X POST "${N8N_API_URL}/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Workflow","active":false,"nodes":[]}'
```

Once all tests pass, your N8N integration should work perfectly! 🎉