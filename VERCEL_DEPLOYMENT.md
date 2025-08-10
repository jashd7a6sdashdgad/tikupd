# Vercel Deployment Guide

## Overview
This guide covers deploying the Mahboob Personal Assistant to Vercel with proper configuration for the hybrid token storage system.

## Token Storage System

The application now uses a hybrid storage system that automatically adapts to different environments:

- **Local Development**: Uses local file system (`data/tokens.json`)
- **Cloudflare**: Uses R2 bucket storage
- **Vercel**: Uses Vercel-optimized storage with file system + fallback to in-memory
- **Other Production**: Uses in-memory storage as fallback

## Environment Variables

### Required for Vercel

1. **NODE_ENV**: Set to `production`
2. **TOKENS_DATA**: (Optional) Initial tokens data as JSON string

### Optional for Cloudflare R2

1. **NEXT_INC_CACHE_R2_BUCKET**: R2 bucket binding name

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