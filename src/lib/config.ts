/**
 * Centralized configuration management
 * Handles loading and managing application configuration from various sources
 */

import socialConfig from '@/config/social.json';

export interface BusinessConfig {
  name: string;
  domain: string;
  email: string;
  phone: string;
  location: string;
  description: string;
}

export interface SocialPlatform {
  platform: string;
  name: string;
  username: string;
  url: string;
  pageId?: string;
  followers?: number;
  verified: boolean;
  description?: string;
  isActive: boolean;
}

export interface SocialConfig {
  business: BusinessConfig;
  social: Record<string, SocialPlatform>;
  templates: Record<string, string>;
}

/**
 * Get business configuration with environment variable overrides
 */
export function getBusinessConfig(): BusinessConfig {
  const config = socialConfig.business;
  
  return {
    name: process.env.BUSINESS_NAME || config.name,
    domain: process.env.BUSINESS_DOMAIN || config.domain,
    email: process.env.BUSINESS_EMAIL || config.email,
    phone: process.env.BUSINESS_PHONE || config.phone,
    location: process.env.BUSINESS_LOCATION || config.location,
    description: process.env.BUSINESS_DESCRIPTION || config.description
  };
}

/**
 * Get social media configuration with environment variable overrides
 */
export function getSocialConfig(): Record<string, SocialPlatform> {
  const config = socialConfig.social;
  const result: Record<string, SocialPlatform> = {};
  
  for (const [key, platform] of Object.entries(config)) {
    result[key] = {
      ...platform,
      url: process.env[`SOCIAL_${key.toUpperCase()}_URL`] || platform.url,
      username: process.env[`SOCIAL_${key.toUpperCase()}_USERNAME`] || platform.username,
      isActive: process.env[`SOCIAL_${key.toUpperCase()}_ACTIVE`] === 'false' ? false : platform.isActive
    };
  }
  
  return result;
}

/**
 * Get bio templates with variable substitution
 */
export function getBioTemplates(): Record<string, string> {
  const business = getBusinessConfig();
  const templates = socialConfig.templates;
  const result: Record<string, string> = {};
  
  for (const [key, template] of Object.entries(templates)) {
    result[key] = template
      .replace('{website}', business.domain)
      .replace('{email}', business.email)
      .replace('{phone}', business.phone)
      .replace('{location}', business.location)
      .replace('{description}', business.description);
  }
  
  return result;
}

/**
 * Get complete social configuration
 */
export function getFullSocialConfig(): SocialConfig {
  return {
    business: getBusinessConfig(),
    social: getSocialConfig(),
    templates: getBioTemplates()
  };
}

/**
 * Get API configuration with environment variables
 */
export interface ApiConfig {
  weatherApiKey?: string;
  weatherApiUrl: string;
  n8nVoiceWebhookUrl?: string;
  n8nApiUrl?: string;
  n8nApiKey?: string;
  firecrawlApiUrl: string;
  facebookApiUrl: string;
  messengerApiUrl: string;
  gmailApiUrl: string;
  maxConversationHistory: number;
}

export function getApiConfig(): ApiConfig {
  return {
    weatherApiKey: process.env.WEATHER_API_KEY,
    weatherApiUrl: process.env.WEATHER_API_URL || 'http://api.weatherapi.com/v1/current.json',
    n8nVoiceWebhookUrl: process.env.N8N_VOICE_WEBHOOK_URL,
    n8nApiUrl: process.env.N8N_API_URL,
    n8nApiKey: process.env.N8N_API_KEY,
    firecrawlApiUrl: process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v0',
    facebookApiUrl: process.env.FACEBOOK_API_URL || 'https://graph.facebook.com/v18.0',
    messengerApiUrl: process.env.MESSENGER_API_URL || 'https://graph.facebook.com/v18.0',
    gmailApiUrl: process.env.GMAIL_API_URL || 'https://gmail.googleapis.com/gmail/v1',
    maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY || '10')
  };
}

/**
 * Get timeout and limit configuration
 */
export interface TimeoutConfig {
  apiTimeout: number;
  retryCount: number;
  retryDelay: number;
  uploadTimeout: number;
  voiceTimeout: number;
  locationTimeout: number;
  locationMaxAge: number;
}

export function getTimeoutConfig(): TimeoutConfig {
  return {
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retryCount: parseInt(process.env.RETRY_COUNT || '3'),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
    uploadTimeout: parseInt(process.env.UPLOAD_TIMEOUT || '60000'),
    voiceTimeout: parseInt(process.env.VOICE_TIMEOUT || '10000'),
    locationTimeout: parseInt(process.env.LOCATION_TIMEOUT || '10000'),
    locationMaxAge: parseInt(process.env.LOCATION_MAX_AGE || '600000')
  };
}

/**
 * Get feature flags configuration
 */
export interface FeatureConfig {
  ramadanModeEnabled: boolean;
  mockDeploymentEnabled: boolean;
  voiceAssistantEnabled: boolean;
  expenseTrackingEnabled: boolean;
  socialMediaEnabled: boolean;
  debugMode: boolean;
}

export function getFeatureConfig(): FeatureConfig {
  return {
    ramadanModeEnabled: process.env.RAMADAN_MODE_ENABLED === 'true',
    mockDeploymentEnabled: process.env.MOCK_DEPLOYMENT_ENABLED !== 'false',
    voiceAssistantEnabled: process.env.VOICE_ASSISTANT_ENABLED !== 'false',
    expenseTrackingEnabled: process.env.EXPENSE_TRACKING_ENABLED !== 'false',
    socialMediaEnabled: process.env.SOCIAL_MEDIA_ENABLED !== 'false',
    debugMode: process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true'
  };
}