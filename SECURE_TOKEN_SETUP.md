# Secure Token Storage Setup Guide

This guide explains how to set up secure token storage for your Next.js application without using paid services like Vercel Blob.

## 🔒 Security Features

- **Secure Hashing**: Tokens are hashed with SHA-256 + salt before storage
- **Encryption**: All stored data is encrypted using AES-256-CBC
- **Token Privacy**: Plain tokens are only shown once during creation
- **Automatic Cleanup**: Expired tokens are automatically removed
- **Free Storage**: Works with JSON files and environment variables

## 📁 Storage Options

### Option 1: JSON File Storage (Recommended for Local Development)

The system automatically creates and manages a `data/secure-tokens.json` file.

**Local Development:**
- Tokens are stored in `/data/secure-tokens.json` (encrypted)
- Automatically creates directory if needed
- Works offline and persists between restarts

**Vercel Production:**
- File system is read-only, so falls back to environment variables
- Tokens persist for the duration of the session only
- Consider using Option 2 for persistent storage on Vercel

### Option 2: Environment Variable Storage (Vercel Compatible)

For persistent storage on Vercel, you can store encrypted token data in environment variables.

## 🔧 Environment Variables

Add these to your `.env.local` (development) and Vercel dashboard (production):

```env
# Optional: Custom encryption key (recommended for production)
TOKEN_ENCRYPTION_KEY=your-64-character-hex-key-here

# Optional: For Vercel persistent storage
SECURE_TOKENS_DATA=encrypted-json-data-here
```

### Generating an Encryption Key

```bash
# Generate a secure 32-byte key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 API Endpoints

### Create Token
```bash
POST /api/tokens
Content-Type: application/json

{
  "name": "My API Token",
  "permissions": ["read", "write"],
  "expiresInDays": 30  // optional
}
```

**Response:**
```json
{
  "message": "Token created successfully",
  "token": {
    "id": "uuid",
    "token": "mpa_...",  // ONLY shown here, save it!
    "name": "My API Token",
    "permissions": ["read", "write"],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-31T00:00:00.000Z",
    "status": "active"
  }
}
```

### List Tokens
```bash
GET /api/tokens
```

**Response:**
```json
{
  "tokens": [
    {
      "id": "uuid",
      "name": "My API Token",
      "permissions": ["read", "write"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "expiresAt": "2025-01-31T00:00:00.000Z",
      "status": "active"
      // Note: token hash is NOT included for security
    }
  ]
}
```

### Validate Token
```bash
GET /api/validate-token
Authorization: Bearer mpa_your_token_here

# OR
POST /api/validate-token
Content-Type: application/json
{
  "token": "mpa_your_token_here"
}

# OR
GET /api/validate-token?token=mpa_your_token_here
```

**Success Response:**
```json
{
  "message": "Token is valid",
  "valid": true,
  "tokenData": {
    "id": "uuid",
    "name": "My API Token",
    "permissions": ["read", "write"],
    "status": "active",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-31T00:00:00.000Z"
  }
}
```

### Delete Token
```bash
DELETE /api/tokens/[token-id]
```

### Update Token
```bash
PUT /api/tokens/[token-id]
Content-Type: application/json

{
  "name": "Updated Name",
  "permissions": ["read"],
  "status": "inactive"
}
```

## 🤖 n8n Integration

### Using Authorization Header
```javascript
// In n8n HTTP Request node
{
  "method": "GET",
  "url": "https://your-app.vercel.app/api/your-protected-endpoint",
  "headers": {
    "Authorization": "Bearer mpa_your_token_here"
  }
}
```

### Validating Tokens in n8n
```javascript
// n8n workflow to validate token
{
  "method": "GET",
  "url": "https://your-app.vercel.app/api/validate-token",
  "headers": {
    "Authorization": "Bearer {{ $json.token }}"
  }
}
```

## 🔨 Implementation Details

### Token Format
- Prefix: `mpa_` (Mahboob Personal Assistant)
- Length: 68 characters total
- Format: `mpa_` + 64 hex characters

### Storage Security
1. Plain tokens are **never stored**
2. Tokens are hashed with SHA-256 + application secret
3. All data is encrypted before storage
4. Tokens are only shown in full during creation
5. Automatic cleanup of expired tokens

### Error Handling
- Invalid tokens return `401 Unauthorized`
- Missing tokens return helpful error messages
- Expired tokens are automatically cleaned up
- Storage failures are logged but don't crash the app

## 🏗️ Migration from Vercel Blob

The new system maintains the **exact same API response format**, so your frontend code won't need any changes. The migration is transparent to users.

### What Changed:
- ❌ No more Vercel Blob dependency
- ❌ No more paid storage costs
- ✅ Secure token hashing instead of plain storage
- ✅ Encrypted data storage
- ✅ Free storage options
- ✅ Same API responses

### What Stays the Same:
- ✅ All API endpoint URLs
- ✅ All response formats
- ✅ All request formats
- ✅ Frontend compatibility
- ✅ n8n integration

## 🔍 Debugging

### Test Storage System
```bash
curl -X PATCH http://localhost:3001/api/tokens
```

### Check Token Validation
```bash
curl -X GET "http://localhost:3001/api/validate-token?token=YOUR_TOKEN"
```

### View Storage Info
The PATCH endpoint returns detailed storage information for debugging.

## 📊 Production Deployment

### Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `TOKEN_ENCRYPTION_KEY`: Your secure encryption key
   - `SECURE_TOKENS_DATA`: Leave empty initially (will be populated)

### First Token Creation
1. Deploy your app
2. Create your first token via the API
3. The system will automatically handle storage

## ⚠️ Security Best Practices

1. **Never log tokens**: Plain tokens should never appear in logs
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate tokens**: Regularly rotate API tokens
4. **Limit permissions**: Give tokens only the permissions they need
5. **Set expiration**: Use short expiration times when possible
6. **Monitor usage**: Check token usage regularly

## 🆘 Troubleshooting

### Tokens Not Persisting on Vercel
- Ensure `SECURE_TOKENS_DATA` environment variable is set
- Check Vercel function logs for storage errors
- Verify environment variables are set for all environments

### Token Validation Failing
- Check token format (should start with `mpa_`)
- Verify token hasn't expired
- Check for typos in the token string
- Ensure the token was created successfully

### Storage Errors
- Check file system permissions (local development)
- Verify encryption key is consistent
- Check Vercel function logs for detailed errors

---

## 🎉 You're Done!

Your token storage is now:
- ✅ **Free** (no paid services required)
- ✅ **Secure** (hashed + encrypted storage)
- ✅ **Compatible** (works with existing code)
- ✅ **Scalable** (works locally and on Vercel)
- ✅ **n8n Ready** (perfect for automation)

The frontend will continue working exactly as before, but now you have secure, free token storage!