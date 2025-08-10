# 🚀 Vercel Deployment Checklist for Token System

## ✅ Pre-Deployment Checks

### 1. Code Changes Applied
- [ ] `src/lib/storage/tokenStorage.ts` - Hybrid storage system created
- [ ] `src/app/api/tokens/route.ts` - Updated to use storage abstraction
- [ ] `src/lib/api/auth/tokenValidation.ts` - Updated to use storage abstraction
- [ ] `vercel.json` - Vercel configuration created
- [ ] `VERCEL_DEPLOYMENT.md` - Updated deployment guide

### 2. Local Testing
- [ ] Test token creation locally: `POST /api/tokens`
- [ ] Test token listing locally: `GET /api/tokens`
- [ ] Test token validation locally
- [ ] Verify local file storage works

## 🔧 Vercel Configuration

### 3. Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```
NODE_ENV=production
TOKENS_DATA=[{"id":"...","token":"...","name":"...","permissions":[...],"status":"active","createdAt":"...","expiresAt":"..."}]
```

**Note**: Copy your existing tokens from `data/tokens.json` and format as a single line JSON string.

### 4. Vercel Settings
- [ ] Function timeout: Set to 30 seconds for `/api/tokens`
- [ ] Environment: Production, Preview, Development
- [ ] Region: Choose closest to your users

## 🚀 Deployment Steps

### 5. Deploy to Vercel
```bash
# Option 1: Vercel CLI
vercel --prod

# Option 2: Git push (if connected)
git push origin main
```

### 6. Verify Deployment
- [ ] Check Vercel dashboard for successful deployment
- [ ] Verify environment variables are loaded
- [ ] Test API endpoints are accessible

## 🧪 Post-Deployment Testing

### 7. Test Token Creation
```bash
curl -X POST https://your-domain.vercel.app/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"name":"vercel-test","permissions":["read:expenses"]}'
```

**Expected Response**: 200 OK with token details

### 8. Test Token Listing
```bash
curl https://your-domain.vercel.app/api/tokens
```

**Expected Response**: 200 OK with array of tokens (without actual token values)

### 9. Test Token Validation
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-domain.vercel.app/api/expenses
```

**Expected Response**: 200 OK or 401 Unauthorized based on token validity

## 🔍 Troubleshooting

### 10. Common Issues & Solutions

#### Issue: "Failed to create token"
**Check**:
- [ ] Vercel function logs for errors
- [ ] Environment variables are set correctly
- [ ] Function timeout is sufficient (30s)

#### Issue: Tokens not persisting
**Check**:
- [ ] Using in-memory storage (expected on Vercel)
- [ ] Consider Cloudflare R2 for persistence
- [ ] Environment variable `TOKENS_DATA` contains initial tokens

#### Issue: API returns 500 errors
**Check**:
- [ ] Vercel function logs
- [ ] Storage system initialization
- [ ] Environment variable format

### 11. Vercel Function Logs
1. Go to Vercel Dashboard → Functions
2. Click on `/api/tokens`
3. Check "Logs" tab for errors
4. Look for storage system messages

## 🔄 Storage System Behavior

### 12. Environment Detection
The system automatically detects and uses:

| Environment | Storage Type | Persistence | Use Case |
|-------------|--------------|-------------|----------|
| **Local Dev** | File System | ✅ Persistent | Development & Testing |
| **Vercel** | In-Memory | ❌ Resets on restart | Production (temporary) |
| **Cloudflare** | R2 Bucket | ✅ Persistent | Production (persistent) |

### 13. Fallback Strategy
1. **Primary**: Cloudflare R2 (if available)
2. **Secondary**: Local files (development)
3. **Fallback**: In-memory (Vercel production)

## 📊 Monitoring & Maintenance

### 14. Regular Checks
- [ ] Monitor Vercel function performance
- [ ] Check token creation success rate
- [ ] Verify storage system logs
- [ ] Monitor API response times

### 15. Token Management
- [ ] Regularly rotate API tokens
- [ ] Monitor token usage and permissions
- [ ] Clean up expired tokens
- [ ] Audit token access logs

## 🆘 Support Resources

### 16. When Things Go Wrong
1. **Check Vercel Logs** first
2. **Verify Environment Variables**
3. **Test with minimal data**
4. **Check storage system messages**
5. **Review this checklist**

### 17. Getting Help
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Project Issues: Check GitHub issues

## 🎯 Success Criteria

### 18. Deployment Success
- [ ] ✅ Tokens can be created on Vercel
- [ ] ✅ Tokens can be listed on Vercel
- [ ] ✅ Token validation works on Vercel
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ No "Failed to create token" errors
- [ ] ✅ Storage system initializes properly

---

**🎉 If all items are checked, your token system is successfully deployed on Vercel!**

The hybrid storage system ensures your app works in all environments while providing the best possible storage solution for each deployment scenario. 