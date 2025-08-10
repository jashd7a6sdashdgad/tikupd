# Cloudflare R2 Setup Guide for Token Persistence

This guide will help you set up Cloudflare R2 storage to fix the token persistence issue on Vercel.

## Why This Fixes Your Problem

**Current Issue**: Tokens created on Vercel are lost after each API call because:
- Vercel uses serverless functions that reset after each request
- `InMemoryTokenStorage` doesn't persist data across function invocations
- `TOKENS_DATA` environment variable only works for the current function call

**Solution**: Cloudflare R2 provides persistent, globally distributed storage that works perfectly with Vercel's serverless architecture.

## Step 1: Create Cloudflare R2 Bucket

1. **Sign up/Login to Cloudflare**:
   - Go to [cloudflare.com](https://cloudflare.com)
   - Create account or login

2. **Navigate to R2**:
   - Dashboard → R2 Object Storage
   - Click "Create bucket"

3. **Configure Bucket**:
   - **Bucket name**: `mahboob-tokens` (or any name you prefer)
   - **Location**: Choose closest to your users
   - Click "Create bucket"

## Step 2: Get API Tokens

1. **Go to API Tokens**:
   - Dashboard → My Profile → API Tokens
   - Click "Create Token"

2. **Configure Token**:
   - **Token name**: `mahboob-r2-token`
   - **Permissions**: 
     - `Cloudflare R2:Edit` (for the specific bucket)
   - **Account Resources**: All accounts
   - **Zone Resources**: All zones
   - Click "Continue to summary" → "Create Token"

3. **Save the token** (you'll need it for Vercel)

## Step 3: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**:
   - Navigate to your project
   - Settings → Environment Variables

2. **Add these variables**:
   ```
   NEXT_INC_CACHE_R2_BUCKET = your-bucket-name
   CLOUDFLARE_ACCOUNT_ID = your-cloudflare-account-id
   CLOUDFLARE_API_TOKEN = your-api-token-from-step-2
   ```

3. **Deploy to apply changes**

## Step 4: Update Your Next.js Configuration

Create or update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@cloudflare/workers-types']
  },
  env: {
    NEXT_INC_CACHE_R2_BUCKET: process.env.NEXT_INC_CACHE_R2_BUCKET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  }
}

module.exports = nextConfig
```

## Step 5: Test the Setup

1. **Deploy to Vercel**
2. **Visit your debug endpoint**: `/api/debug/storage`
3. **Expected output**:
   ```json
   {
     "storage": {
       "type": "R2",
       "details": "Cloudflare R2: R2 Bucket Active",
       "environment": "production",
       "vercelDetected": true
     }
   }
   ```

## Step 6: Test Token Creation

1. **Create a token** via your API
2. **Check the debug endpoint** again - should show token count > 0
3. **Wait a few minutes** and check again - tokens should persist

## Troubleshooting

### Issue: "R2 Bucket Not Available"
**Cause**: Environment variables not set correctly
**Solution**: 
- Verify `NEXT_INC_CACHE_R2_BUCKET` is set in Vercel
- Redeploy after setting environment variables

### Issue: "Failed to save tokens to R2"
**Cause**: API token permissions incorrect
**Solution**:
- Ensure API token has `Cloudflare R2:Edit` permission
- Check bucket name matches exactly

### Issue: Still using InMemory storage
**Cause**: R2 bucket not accessible
**Solution**:
- Check Cloudflare account ID is correct
- Verify API token is valid
- Check bucket exists and is accessible

## Alternative: Use TOKENS_DATA for Initial Seeding

If you want to keep using `TOKENS_DATA` as initial data:

1. **Set TOKENS_DATA** in Vercel environment variables
2. **The system will**:
   - Load initial tokens from `TOKENS_DATA`
   - Save them to R2 for persistence
   - Future tokens will be stored in R2

## Benefits of This Solution

✅ **Persistent Storage**: Tokens survive function restarts
✅ **Global Distribution**: Fast access worldwide
✅ **Vercel Compatible**: Works perfectly with serverless
✅ **Scalable**: Handles unlimited tokens
✅ **Cost Effective**: R2 pricing is very reasonable

## Cost Estimate

- **R2 Storage**: ~$0.015 per GB/month
- **Class A Operations** (writes): ~$4.50 per million
- **Class B Operations** (reads): ~$0.36 per million

For typical token storage usage: **~$0.01-0.05/month**

## Next Steps

1. Follow the setup guide above
2. Test with your debug endpoint
3. Create a few test tokens
4. Verify persistence across deployments

Your tokens will now persist reliably on Vercel! 🎉 