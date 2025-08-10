# Vercel Deployment Guide

## ✅ Fixed: Hardcoded Data Issue

The tracking page hardcoded data issue has been resolved. The problem was caused by:
1. Incorrect base URL configuration on Vercel
2. Failed API calls falling back to sample data
3. Missing environment variables

## Required Environment Variables for Vercel

### 🚨 Critical Variables (Application won't work without these):

```bash
# Base URL Configuration - CRITICAL for Vercel
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app

# API Keys - REQUIRED
WEATHER_API_KEY=your_weather_api_key_from_weatherapi.com
GEMINI_API_KEY=your_gemini_api_key_from_google

# Google OAuth - REQUIRED for real data
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Google Sheets - REQUIRED for expenses/contacts
EXPENSES_SPREADSHEET_ID=your_google_sheets_id
CONTACTS_SPREADSHEET_ID=your_contacts_sheets_id
DIARY_SPREADSHEET_ID=your_diary_sheets_id
```

### 📊 For Analytics to Work (Optional but Recommended):

```bash
# Social Media APIs
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_token
FACEBOOK_PAGE_ID=your_facebook_page_id
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_youtube_channel_id

# N8N Integration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key
N8N_VOICE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/voice

# External APIs
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

## Vercel Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above with your actual values
4. **IMPORTANT**: Set them for Production, Preview, and Development environments

### 2. Update Your Domain URLs

Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL:
- `NEXTAUTH_URL=https://your-actual-app.vercel.app`
- `NEXT_PUBLIC_APP_URL=https://your-actual-app.vercel.app`

### 3. Google OAuth Setup for Vercel

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add these to **Authorized redirect URIs**:
   ```
   https://your-vercel-app.vercel.app/api/auth/callback/google
   https://your-vercel-app.vercel.app/api/google/callback
   ```

### 4. Verify Deployment

After deployment, check these URLs:
- `https://your-vercel-app.vercel.app/api/analytics/tracking` (should show real data)
- `https://your-vercel-app.vercel.app/tracking` (should show actual analytics)

## Troubleshooting

### Issue: Still seeing "0" values on tracking page
**Solution**: Check Vercel Function logs for API call errors:
1. Go to Vercel Dashboard → Functions
2. Click on `/api/analytics/tracking`
3. Check logs for specific error messages

### Issue: "Authentication required" errors
**Solution**: Verify Google OAuth is working:
1. Test login at `/auth`
2. Check browser dev tools for cookie presence
3. Verify `NEXTAUTH_URL` matches your actual domain

### Issue: API timeouts on Vercel
**Solution**: Add timeout configuration:
```bash
API_TIMEOUT=25000  # Vercel functions timeout at 30s
RETRY_COUNT=2
```

## Environment Variable Checklist

Before deploying, ensure you have:

- [ ] `NEXTAUTH_URL` set to your Vercel app URL
- [ ] `NEXT_PUBLIC_APP_URL` set to your Vercel app URL  
- [ ] `WEATHER_API_KEY` from WeatherAPI.com
- [ ] `GEMINI_API_KEY` from Google AI Studio
- [ ] Google OAuth credentials configured
- [ ] Google Sheets IDs for your data
- [ ] All variables set for Production environment in Vercel

## Testing Real Data

1. **Deploy to Vercel** with all environment variables
2. **Authenticate with Google** at `/auth`
3. **Visit tracking page** - should show real data, not hardcoded values
4. **Check console logs** in Vercel Functions for debugging

## What Was Fixed

✅ Removed hardcoded sample data fallback
✅ Fixed base URL configuration for Vercel
✅ Added proper error handling and logging
✅ Used centralized configuration management
✅ Added timeout handling for Vercel functions

The tracking page now shows:
- **Real event counts** from Google Calendar
- **Actual email counts** from Gmail
- **True expense data** from Google Sheets
- **Genuine contact numbers** from your contacts sheet
- **Zero values** when no data exists (instead of fake numbers)

If you're still seeing hardcoded data after following this guide, check the Vercel Function logs for specific error messages.