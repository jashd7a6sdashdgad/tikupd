# Vercel Deployment Guide

## Overview
This guide covers deploying the Mahboob Personal Assistant to Vercel with proper configuration for the hybrid token storage system.

## Token Storage System

The application now uses a hybrid storage system that automatically adapts to different environments:

- **Local Development**: Uses local file system (`data/tokens.json`)
- **Cloudflare**: Uses R2 bucket storage
- **Vercel**: Uses in-memory storage with environment variable fallback

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

## Troubleshooting

### Token Creation Fails
- Check Vercel function logs for errors
- Verify environment variables are set correctly
- Ensure the API route is properly configured

### Storage Not Persisting
- In-memory storage resets on each function invocation
- Consider setting up Cloudflare R2 for persistent storage
- Use environment variables for initial token data

## Cloudflare R2 Setup (Optional)

For persistent storage on Vercel:

1. Create a Cloudflare R2 bucket
2. Configure the bucket binding in `wrangler.jsonc`
3. Set the `NEXT_INC_CACHE_R2_BUCKET` environment variable

## Local vs Production

| Environment | Storage Type | Persistence |
|-------------|--------------|-------------|
| Local Dev   | File System  | ✅ Persistent |
| Vercel      | In-Memory    | ❌ Resets on restart |
| Cloudflare  | R2 Bucket    | ✅ Persistent |

## Best Practices

1. **Development**: Use local file storage for testing
2. **Production**: Use Cloudflare R2 for persistent storage
3. **Fallback**: In-memory storage ensures the app works on Vercel
4. **Security**: Never commit sensitive tokens to version control
5. **Monitoring**: Check Vercel function logs for storage-related errors

## Migration from Local to Vercel

1. Export your local tokens:
   ```bash
   cat data/tokens.json
   ```

2. Set the `TOKENS_DATA` environment variable in Vercel with the exported data

3. Deploy and test token functionality

4. Consider setting up Cloudflare R2 for production use

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variable configuration
3. Test with minimal token data
4. Consider using Cloudflare R2 for production deployments