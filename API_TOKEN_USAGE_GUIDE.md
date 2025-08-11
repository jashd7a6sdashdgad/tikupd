# 🔑 API Token Usage Guide

This guide shows you exactly how to use your API token `mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2` with all available API endpoints.

## 🎯 **Token Authentication Method**

Your API token should be sent using the **Authorization header** with the Bearer scheme:

```
Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2
```

## 📋 **Available API Resources**

### 🔐 **1. Token Management**

#### List All Tokens
```bash
curl -X GET "https://your-app.vercel.app/api/tokens" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Create New Token
```bash
curl -X POST "https://your-app.vercel.app/api/tokens" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New API Token",
    "permissions": ["read", "write"],
    "expiresInDays": 30
  }'
```

#### Delete Token
```bash
curl -X DELETE "https://your-app.vercel.app/api/tokens/{token-id}" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Validate Token
```bash
curl -X GET "https://your-app.vercel.app/api/validate-token" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 💰 **2. Expenses Management**

#### Get All Expenses
```bash
curl -X GET "https://your-app.vercel.app/api/expenses" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Add New Expense
```bash
curl -X POST "https://your-app.vercel.app/api/expenses" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25.50,
    "description": "Coffee meeting",
    "category": "business",
    "date": "2025-08-11"
  }'
```

#### Process Bank Emails for Expenses
```bash
curl -X POST "https://your-app.vercel.app/api/expenses/auto-process" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 📊 **3. Google Sheets Integration**

#### Shopping List
```bash
# Get shopping list
curl -X GET "https://your-app.vercel.app/api/sheets/shopping-list" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Add item to shopping list
curl -X POST "https://your-app.vercel.app/api/sheets/shopping-list" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Milk",
    "quantity": 2,
    "category": "dairy"
  }'
```

#### Contacts Management
```bash
# Get all contacts
curl -X GET "https://your-app.vercel.app/api/sheets/contacts" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Search contacts
curl -X GET "https://your-app.vercel.app/api/sheets/contacts?search=john" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Add new contact
curl -X POST "https://your-app.vercel.app/api/sheets/contacts" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Tech Corp"
  }'
```

#### Personal Diary
```bash
# Get diary entries
curl -X GET "https://your-app.vercel.app/api/sheets/diary" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Add diary entry
curl -X POST "https://your-app.vercel.app/api/sheets/diary" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Today was productive. Finished the API integration.",
    "mood": "happy",
    "tags": ["work", "productivity"]
  }'
```

#### Hotel Expenses
```bash
# Get hotel expenses
curl -X GET "https://your-app.vercel.app/api/sheets/hotel-expenses" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Add hotel expense
curl -X POST "https://your-app.vercel.app/api/sheets/hotel-expenses" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "hotel": "Grand Hotel",
    "amount": 150.00,
    "location": "New York",
    "category": "accommodation",
    "businessPurpose": "Client meeting"
  }'
```

#### Budget Management
```bash
# Get budget data
curl -X GET "https://your-app.vercel.app/api/sheets/budget" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 📅 **4. Calendar Management**

#### Get Calendar Events
```bash
# Get today's events
curl -X GET "https://your-app.vercel.app/api/calendar/events" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Get events for date range
curl -X GET "https://your-app.vercel.app/api/calendar/events?start=2025-08-11&end=2025-08-18" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Create Calendar Event
```bash
curl -X POST "https://your-app.vercel.app/api/calendar/events" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Team Meeting",
    "description": "Weekly team sync",
    "start": "2025-08-12T10:00:00",
    "end": "2025-08-12T11:00:00",
    "location": "Conference Room A"
  }'
```

#### Smart Schedule
```bash
curl -X POST "https://your-app.vercel.app/api/calendar/smart-schedule" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dentist appointment",
    "duration": 60,
    "preferredTime": "next Thursday 3 PM"
  }'
```

---

### 📧 **5. Gmail Integration**

#### Get Unread Email Count
```bash
curl -X GET "https://your-app.vercel.app/api/gmail/unread-count" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Get Email Messages
```bash
# Get recent messages
curl -X GET "https://your-app.vercel.app/api/gmail/messages" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Search messages
curl -X GET "https://your-app.vercel.app/api/gmail/messages?q=from:important@example.com" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Send Email
```bash
curl -X POST "https://your-app.vercel.app/api/emails" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "API Test Email",
    "body": "This email was sent via API token authentication."
  }'
```

---

### 🎵 **6. Music Integration**

#### Search Music
```bash
curl -X GET "https://your-app.vercel.app/api/music?search=favorite+song" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Get Music Library
```bash
curl -X GET "https://your-app.vercel.app/api/music/library" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Get Playlists
```bash
curl -X GET "https://your-app.vercel.app/api/music/playlists" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Voice Music Control
```bash
curl -X POST "https://your-app.vercel.app/api/music/voice-control" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "play my jazz playlist"
  }'
```

---

### 🎥 **7. YouTube Integration**

#### Get Channel Info
```bash
curl -X GET "https://your-app.vercel.app/api/youtube/channel" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Get Videos
```bash
curl -X GET "https://your-app.vercel.app/api/youtube/videos" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Update Video
```bash
curl -X PUT "https://your-app.vercel.app/api/youtube/videos/{videoId}" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Video Title",
    "description": "Updated description"
  }'
```

---

### 📱 **8. Social Media**

#### Facebook Integration
```bash
curl -X GET "https://your-app.vercel.app/api/facebook" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Instagram Integration
```bash
curl -X GET "https://your-app.vercel.app/api/social/instagram" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Messenger
```bash
curl -X GET "https://your-app.vercel.app/api/messenger" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 🔍 **9. Search & Research**

#### MCP Search (Medical/Research)
```bash
curl -X POST "https://your-app.vercel.app/api/search/mcp" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "diabetes research 2025",
    "sources": ["pubmed", "medical"]
  }'
```

#### Firecrawl Web Search
```bash
curl -X POST "https://your-app.vercel.app/api/search/firecrawl" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "extract": "text"
  }'
```

#### General Firecrawl
```bash
curl -X POST "https://your-app.vercel.app/api/firecrawl" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.example.com",
    "scrapeType": "article"
  }'
```

---

### 🌤️ **10. Weather**

#### Get Weather Info
```bash
curl -X GET "https://your-app.vercel.app/api/weather" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

# Get weather for specific location
curl -X GET "https://your-app.vercel.app/api/weather?location=New+York" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 🤖 **11. AI & Voice Assistant**

#### Voice Assistant
```bash
curl -X POST "https://your-app.vercel.app/api/ai/voice-assistant" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Schedule a meeting for tomorrow at 2 PM"
  }'
```

#### Process Natural Language Commands
```bash
curl -X POST "https://your-app.vercel.app/api/ai/process-command" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Add $25 expense for lunch meeting today"
  }'
```

#### Voice Messages
```bash
curl -X GET "https://your-app.vercel.app/api/voice-messages" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 📊 **12. Analytics & Tracking**

#### Analytics Overview
```bash
curl -X GET "https://your-app.vercel.app/api/analytics/overview" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Track Events
```bash
curl -X POST "https://your-app.vercel.app/api/analytics/tracking" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "api_call",
    "properties": {
      "endpoint": "/api/expenses",
      "method": "GET"
    }
  }'
```

---

### 🔧 **13. Automation & Workflows**

#### N8N Webhook Integration
```bash
curl -X POST "https://your-app.vercel.app/api/n8n/webhook" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "expense-processing",
    "data": {
      "amount": 50.00,
      "description": "Business lunch"
    }
  }'
```

#### General Automation
```bash
curl -X POST "https://your-app.vercel.app/api/automation" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "process_expenses",
    "params": {
      "source": "bank_email"
    }
  }'
```

#### Workflows
```bash
curl -X GET "https://your-app.vercel.app/api/workflows" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 🔒 **14. Security & Notifications**

#### Security Status
```bash
curl -X GET "https://your-app.vercel.app/api/security" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

#### Notifications
```bash
curl -X GET "https://your-app.vercel.app/api/notifications" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

### 📱 **15. Universal API**

#### Universal Resource Access
```bash
# Generic resource access
curl -X GET "https://your-app.vercel.app/api/universal/contacts" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"

curl -X GET "https://your-app.vercel.app/api/universal/expenses" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

---

## 🌐 **JavaScript/Fetch Examples**

### Basic Fetch with Token
```javascript
const API_TOKEN = 'mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2';
const API_BASE = 'https://your-app.vercel.app/api';

// Generic API call function
async function callAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  return response.json();
}

// Examples
const expenses = await callAPI('/expenses');
const newExpense = await callAPI('/expenses', {
  method: 'POST',
  body: JSON.stringify({
    amount: 25.50,
    description: 'Coffee',
    category: 'business'
  })
});
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

function useAPIData(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`https://your-app.vercel.app/api${endpoint}`, {
      headers: {
        'Authorization': 'Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2'
      }
    })
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    });
  }, [endpoint]);
  
  return { data, loading };
}

// Usage
function ExpensesList() {
  const { data: expenses, loading } = useAPIData('/expenses');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {expenses?.map(expense => (
        <li key={expense.id}>${expense.amount} - {expense.description}</li>
      ))}
    </ul>
  );
}
```

---

## ❗ **Important Notes**

### **Authentication Requirements**
1. **Always include the Authorization header** with `Bearer ` prefix
2. **Token format**: `Bearer mpa_your_token_here`
3. **Some endpoints may require additional Google OAuth** (for Gmail, Calendar, etc.)

### **Response Formats**
Most endpoints return JSON in this format:
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

Error responses:
```json
{
  "error": "Error description",
  "status": 401
}
```

### **Rate Limits**
- Token validation is cached for performance
- Some Google API endpoints have their own rate limits
- Monitor your usage through the analytics endpoints

### **Permissions**
Your token may have specific permissions. Check the token validation endpoint to see what permissions your token has.

---

## 🎯 **Quick Test**

Test your token is working:
```bash
curl -X GET "https://your-app.vercel.app/api/validate-token" \
  -H "Authorization: Bearer mpa_bb9f7c258e0ce95be389741ca6ea69cd1294954127fa3e6822168d0d7df09ad2"
```

Expected response:
```json
{
  "message": "Token is valid",
  "valid": true,
  "tokenData": {
    "id": "...",
    "name": "...",
    "permissions": [...],
    "status": "active"
  }
}
```

---

**🎉 You're now ready to use your API token with all available endpoints!**

Replace `https://your-app.vercel.app` with your actual domain, and you can start making authenticated API calls to any of these resources.