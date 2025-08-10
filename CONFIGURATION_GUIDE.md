# Configuration Management Guide

## Overview

The Mahboob Personal Assistant has been updated to eliminate hardcoded values and provide a flexible, centralized configuration system. This guide explains how to configure your application properly.

## 🚨 Security First

**CRITICAL**: The following hardcoded values have been removed and MUST be configured:

1. **Weather API Key** - Was previously exposed in source code
2. **N8N Webhook URLs** - Were previously hardcoded with production URLs
3. **Social Media Information** - Business details were hardcoded

## Configuration Architecture

### 1. Environment Variables (.env.local)
Primary configuration method for:
- API keys and secrets
- Service URLs and endpoints
- Feature flags
- Timeout and performance settings

### 2. Configuration Files (src/config/)
JSON-based configuration for:
- Business information
- Social media profiles
- UI templates and content

### 3. Centralized Configuration API (src/lib/config.ts)
Provides type-safe access to all configuration with environment variable overrides.

## Setup Instructions

### Step 1: Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in required values** (application will not work without these):
   ```env
   # CRITICAL - Get from WeatherAPI.com
   WEATHER_API_KEY=your_actual_weather_api_key
   
   # CRITICAL - Get from Google AI Studio
   GEMINI_API_KEY=your_actual_gemini_api_key
   
   # Your N8N instance details
   N8N_API_URL=https://your-n8n-instance.com
   N8N_API_KEY=your_actual_n8n_api_key
   N8N_VOICE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/voice
   ```

### Step 2: Business Configuration

Option A: Use Environment Variables (Quick Setup)
```env
BUSINESS_NAME="Your Company Name"
BUSINESS_DOMAIN=yoursite.com
BUSINESS_EMAIL=contact@yoursite.com
BUSINESS_PHONE=+1234567890
```

Option B: Edit Configuration File (Advanced)
Edit `src/config/social.json` to customize:
- Business details
- Social media profiles
- Contact information
- Bio templates

### Step 3: Feature Configuration

Enable/disable features as needed:
```env
VOICE_ASSISTANT_ENABLED=true
EXPENSE_TRACKING_ENABLED=true
SOCIAL_MEDIA_ENABLED=true
MOCK_DEPLOYMENT_ENABLED=true  # For N8N testing
```

## Configuration Categories

### API Services
| Variable | Purpose | Required |
|----------|---------|----------|
| `WEATHER_API_KEY` | Weather data access | ✅ Yes |
| `GEMINI_API_KEY` | AI/voice processing | ✅ Yes |
| `N8N_API_URL` | Workflow automation | Optional |
| `FIRECRAWL_API_KEY` | Web scraping | Optional |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Social media integration | Optional |

### Business Information
| Variable | Purpose | Default Source |
|----------|---------|----------------|
| `BUSINESS_NAME` | Company/personal name | config/social.json |
| `BUSINESS_EMAIL` | Contact email | config/social.json |
| `BUSINESS_PHONE` | Contact phone | config/social.json |
| `BUSINESS_DOMAIN` | Website domain | config/social.json |

### Performance Settings
| Variable | Purpose | Default |
|----------|---------|---------|
| `API_TIMEOUT` | API request timeout (ms) | 30000 |
| `RETRY_COUNT` | Failed request retries | 3 |
| `RETRY_DELAY` | Retry delay (ms) | 1000 |
| `MAX_CONVERSATION_HISTORY` | Voice chat history | 10 |

### Feature Flags
| Variable | Purpose | Default |
|----------|---------|---------|
| `VOICE_ASSISTANT_ENABLED` | Enable voice features | true |
| `EXPENSE_TRACKING_ENABLED` | Enable expense management | true |
| `MOCK_DEPLOYMENT_ENABLED` | Allow N8N mock testing | true |
| `DEBUG_MODE` | Enhanced logging | false |

## Using Configuration in Code

### Import and Use
```typescript
import { getBusinessConfig, getApiConfig, getFeatureConfig } from '@/lib/config';

// Get business information
const business = getBusinessConfig();
console.log(business.name); // Your configured business name

// Get API configuration
const api = getApiConfig();
const weatherData = await fetch(`${api.weatherApiUrl}?key=${api.weatherApiKey}`);

// Check feature flags
const features = getFeatureConfig();
if (features.voiceAssistantEnabled) {
  // Enable voice features
}
```

### Type Safety
All configuration functions return typed interfaces:
- `BusinessConfig` - Business information
- `ApiConfig` - API endpoints and keys
- `FeatureConfig` - Feature flags
- `TimeoutConfig` - Performance settings

## Migration from Hardcoded Values

The following changes have been made:

### ✅ Secured
- Weather API key moved to environment variable
- N8N webhook URLs now configurable
- Social media URLs now configurable
- Contact information centralized

### ✅ Environment Variable Support
- All API endpoints now use env vars with fallbacks
- Timeout values configurable
- Feature flags implemented
- Business information overridable

### ✅ Configuration Files
- `src/config/social.json` - Business and social media
- `.env.example` - Complete environment template
- `src/lib/config.ts` - Type-safe configuration API

## Deployment Considerations

### Development
1. Use `.env.local` for local development
2. Enable `DEBUG_MODE=true` for detailed logging
3. Use `MOCK_DEPLOYMENT_ENABLED=true` for N8N testing

### Production
1. Set environment variables in your hosting platform
2. Disable debug mode: `DEBUG_MODE=false`
3. Use secure API keys and tokens
4. Configure proper domain: `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

### Docker
```dockerfile
# In your Dockerfile, copy config files
COPY src/config/ /app/src/config/
# Environment variables will be provided at runtime
```

## Troubleshooting

### "API key not configured" Errors
- Check `.env.local` exists and has correct variable names
- Verify no typos in environment variable names
- Restart development server after changes

### Features Not Working
- Check feature flags in environment variables
- Verify required API keys are configured
- Check browser console for configuration errors

### Social Media Not Updating
- Check if using environment variable overrides
- Verify `src/config/social.json` is valid JSON
- Restart application after config changes

## Security Best Practices

1. **Never commit** `.env.local` or `.env.production`
2. **Use different API keys** for development and production
3. **Rotate API keys** regularly
4. **Set restrictive permissions** on API keys when possible
5. **Monitor API usage** for unusual activity

## Support

If you encounter issues with configuration:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure all required dependencies are installed
4. Restart the development server after configuration changes

The configuration system provides flexibility while maintaining security and type safety. All previously hardcoded values are now properly configurable through environment variables or configuration files.