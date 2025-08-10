# Vercel Deployment Guide

## Overview
This guide covers deploying the Mahboob Personal Assistant to Vercel with proper configuration for the hybrid token storage system.

## Token Storage System

The application now uses a hybrid storage system that automatically adapts to different environments:

- **Local Development**: Uses local file system (`data/tokens.json`)
- **GitHub Gist**: Uses GitHub gists (100% FREE, recommended for production)
- **Vercel KV**: Uses Vercel KV storage (FREE tier: 100MB, 100K requests/month)
- **Cloudflare R2**: Uses R2 bucket storage (paid, but reliable)
- **Vercel**: Uses Vercel-optimized storage with file system + fallback to in-memory
- **Other Production**: Uses in-memory storage as fallback

### Storage Priority (Production - FREE First)
1. **GitHub Gist** (if `GITHUB_TOKEN` and `GITHUB_GIST_ID` are set) - **🆓 FREE & RECOMMENDED**
2. **Vercel KV** (if `KV_URL` is set) - **🆓 FREE tier**
3. **Cloudflare R2** (if `NEXT_INC_CACHE_R2_BUCKET` is set) - **💰 PAID**
4. **Vercel File System** (if on Vercel platform) - **🆓 FREE**
5. **In-Memory** (fallback, data resets on restart) - **🆓 FREE**

## Environment Variables

### Required for Vercel

1. **NODE_ENV**: Set to `production`
2. **TOKENS_DATA**: (Optional) Initial tokens data as JSON string

### 🆓 **FREE Options (Recommended)**

#### Option 1: GitHub Gist (100% Free)
```bash
GITHUB_TOKEN=ghp_your_token_here
GITHUB_GIST_ID=your_gist_id_here
```
**Benefits**: Unlimited storage, high reliability, version history

#### Option 2: Vercel KV (Free Tier)
```bash
KV_URL=your_kv_url_here
KV_REST_API_URL=your_rest_api_url_here
KV_REST_API_TOKEN=your_rest_api_token_here
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token_here
```
**Benefits**: 100MB free, 100K requests/month, built-in Vercel integration

### 💰 **Paid Option (Cloudflare R2)**

1. **NEXT_INC_CACHE_R2_BUCKET**: R2 bucket binding name
2. **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID
3. **CLOUDFLARE_API_TOKEN**: API token with R2 permissions

**Why Free Options?** They solve the "failed to create token" issue on Vercel without any cost!

## Vercel Configuration

### 1. vercel.json
```json
{
  "functions": {
    "src/app/api/tokens/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_INC_CACHE_R2_BUCKET": "@mahboob-personal-assistant-r2"
  }
}
```

### 2. Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

```
NODE_ENV=production
TOKENS_DATA=[{"id":"...","token":"...","name":"...","permissions":[...],"status":"active","createdAt":"...","expiresAt":"..."}]
```

## Storage Behavior on Vercel

### Vercel-Optimized Storage
The new `VercelTokenStorage` class provides:

1. **Primary**: File system storage in `/tmp` directory (persistent during function execution)
2. **Fallback**: In-memory storage if file operations fail
3. **Automatic Detection**: Automatically detects Vercel environment
4. **Error Handling**: Graceful fallback without breaking the application

### Why Tokens Were Failing Before
- **Previous Issue**: Used `InMemoryTokenStorage` which lost data on every function call
- **New Solution**: Uses file system when possible, falls back to in-memory only when necessary

## 🆓 **Quick Fix: FREE Options Setup**

**For immediate token persistence fix on Vercel (100% FREE):**

### Option 1: GitHub Gist (Recommended)
1. **Follow the complete setup guide**: `FREE_STORAGE_OPTIONS.md`
2. **Set environment variables** in Vercel:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_GIST_ID=  # Leave empty initially
   ```
3. **Deploy** - check logs for gist ID, then set it and redeploy

### Option 2: Vercel KV (Alternative)
1. **Install Vercel KV**: `npm install @vercel/kv`
2. **Create KV database** in Vercel Dashboard
3. **Set environment variables** in Vercel:
   ```
   KV_URL=your_kv_url_here
   KV_REST_API_URL=your_rest_api_url_here
   KV_REST_API_TOKEN=your_rest_api_token_here
   KV_REST_API_READ_ONLY_TOKEN=your_readonly_token_here
   ```
4. **Deploy** - tokens will now persist reliably

**Both options are completely FREE and solve your token persistence issue!**

## Deployment Steps

### 1. Build and Deploy
```bash
npm run build
vercel --prod
```

### 2. Verify Token Storage
After deployment, test the token creation endpoint:
```bash
curl -X POST https://your-domain.vercel.app/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"name":"test","permissions":["read:expenses"]}'
```

### 3. Debug Storage System
Check the storage configuration:
```bash
curl https://your-domain.vercel.app/api/debug/storage
```

**Expected Response**: Shows storage type, mode, and any issues

### 4. Test R2 Setup (if using Cloudflare R2)
Run the test script to verify everything works:
```bash
node test-r2-setup.js
```

**Expected Output**: All tests should pass, showing R2 is active and tokens persist

## Troubleshooting

### Token Creation Fails
1. **Check Vercel function logs** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Test storage system** using `/api/debug/storage` endpoint
4. **Check function timeout** is sufficient (30s)

### Storage Not Persisting
1. **Vercel storage**: Should persist during function execution
2. **File system issues**: Check if fallback to in-memory is working
3. **Consider Cloudflare R2** for persistent storage across deployments

### Debug Storage Issues
Use the new debug endpoint:
```bash
curl https://your-domain.vercel.app/api/debug/storage
```

This will show:
- Current storage type and mode
- Environment detection
- Token count and any errors
- Specific recommendations for your setup

## Cloudflare R2 Setup (Optional)

For persistent storage across Vercel deployments:

1. Create a Cloudflare R2 bucket
2. Configure the bucket binding in `wrangler.jsonc`
3. Set the `NEXT_INC_CACHE_R2_BUCKET` environment variable

## Local vs Production

| Environment | Storage Type | Persistence | Use Case |
|-------------|--------------|-------------|----------|
| Local Dev   | File System  | ✅ Persistent | Development & Testing |
| Vercel      | Vercel-Optimized | ✅ Persistent (during execution) | Production |
| Cloudflare  | R2 Bucket    | ✅ Persistent | Production (cross-deployment) |

## Best Practices

1. **Development**: Use local file storage for testing
2. **Vercel Production**: Vercel-optimized storage handles most cases
3. **Enterprise**: Use Cloudflare R2 for cross-deployment persistence
4. **Security**: Never commit sensitive tokens to version control
5. **Monitoring**: Use `/api/debug/storage` to monitor storage health

## Migration from Local to Vercel

1. Export your local tokens:
   ```bash
   cat data/tokens.json
   ```

2. Set the `TOKENS_DATA` environment variable in Vercel with the exported data

3. Deploy and test token functionality

4. Verify storage is working using the debug endpoint

5. Consider setting up Cloudflare R2 for production use

## Support

If you encounter issues:
1. Check Vercel function logs
2. Use `/api/debug/storage` endpoint
3. Verify environment variable configuration
4. Test with minimal token data
5. Consider using Cloudflare R2 for production deployments