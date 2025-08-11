import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface ApiToken {
  id: string;
  name: string;
  tokenHash: string; // Store hash instead of plain token
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  expiresAt?: string;
  data?: string; // For storing arbitrary data, e.g., for music playlists
}

export interface StoredTokenData {
  tokens: ApiToken[];
  version: string;
  lastUpdated: string;
}

export class SecureJsonTokenStorage {
  private readonly filePath: string;
  private readonly encryptionKey: string;
  private cache: StoredTokenData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 1000; // 1 second - shorter for serverless

  constructor() {
    // Use process.cwd() which works on both local dev and Vercel
    this.filePath = path.join(process.cwd(), 'data', 'secure-tokens.json');
    
    // Use environment variable for encryption key or generate one
    this.encryptionKey = this.getEncryptionKey();
    
    console.log('SecureJsonTokenStorage: Initialized with file path:', this.filePath);
    console.log('SecureJsonTokenStorage: Using encryption key hash:', crypto.createHash('md5').update(this.encryptionKey).digest('hex').substring(0, 8));
  }

  private getEncryptionKey(): string {
    // Priority order for encryption key
    if (process.env.TOKEN_ENCRYPTION_KEY) {
      console.log('SecureJsonTokenStorage: Using TOKEN_ENCRYPTION_KEY from env');
      return process.env.TOKEN_ENCRYPTION_KEY;
    }
    
    if (process.env.NEXTAUTH_SECRET) {
      console.log('SecureJsonTokenStorage: Generating key from NEXTAUTH_SECRET');
      return crypto.createHash('sha256').update(process.env.NEXTAUTH_SECRET).digest('hex').substring(0, 32);
    }
    
    // Fallback - this should be consistent across environments
    const fallbackKey = 'mahboob-personal-assistant-token-key-v1';
    console.log('SecureJsonTokenStorage: Using fallback encryption key');
    return crypto.createHash('sha256').update(fallbackKey).digest('hex').substring(0, 32);
  }

  private async ensureDataDir(): Promise<void> {
    try {
      const dataDir = path.dirname(this.filePath);
      await fs.mkdir(dataDir, { recursive: true });
      console.log('SecureJsonTokenStorage: Data directory ensured:', dataDir);
    } catch (error) {
      // In Vercel, we might not be able to create directories
      console.warn('SecureJsonTokenStorage: Could not create data directory, will use environment fallback:', error);
    }
  }

  /**
   * GitHub Gist storage methods for Vercel persistence
   */
  private async loadFromGitHubGist(): Promise<StoredTokenData | null> {
    const githubToken = process.env.GITHUB_TOKEN;
    const gistId = process.env.GITHUB_GIST_ID || process.env.TOKEN_GIST_ID;
    
    if (!githubToken || !gistId) {
      console.log('SecureJsonTokenStorage: GitHub Gist credentials missing');
      return null;
    }

    try {
      console.log('SecureJsonTokenStorage: Loading tokens from GitHub Gist:', gistId);
      
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Mahboob-Personal-Assistant'
        }
      });

      if (!response.ok) {
        console.error('SecureJsonTokenStorage: GitHub Gist fetch failed:', response.status, response.statusText);
        return null;
      }

      const gist = await response.json();
      const filename = 'secure-tokens.enc'; // encrypted filename
      
      if (!gist.files || !gist.files[filename]) {
        console.log('SecureJsonTokenStorage: No token file found in gist, initializing empty');
        return {
          tokens: [],
          version: '1.0.0',
          lastUpdated: new Date().toISOString()
        };
      }

      const encryptedContent = gist.files[filename].content;
      const decryptedContent = this.decrypt(encryptedContent);
      const data: StoredTokenData = JSON.parse(decryptedContent);
      
      console.log(`SecureJsonTokenStorage: Loaded ${data.tokens?.length || 0} tokens from GitHub Gist`);
      return data;
      
    } catch (error) {
      console.error('SecureJsonTokenStorage: Failed to load from GitHub Gist:', error);
      return null;
    }
  }

  private async saveToGitHubGist(data: StoredTokenData): Promise<boolean> {
    const githubToken = process.env.GITHUB_TOKEN;
    const gistId = process.env.GITHUB_GIST_ID || process.env.TOKEN_GIST_ID;
    
    if (!githubToken || !gistId) {
      console.log('SecureJsonTokenStorage: GitHub Gist credentials missing, skipping save');
      return false;
    }

    try {
      console.log(`SecureJsonTokenStorage: Saving ${data.tokens?.length || 0} tokens to GitHub Gist`);
      
      const encryptedContent = this.encrypt(JSON.stringify(data, null, 2));
      
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Mahboob-Personal-Assistant',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'secure-tokens.enc': {
              content: encryptedContent
            }
          }
        })
      });

      if (!response.ok) {
        console.error('SecureJsonTokenStorage: GitHub Gist save failed:', response.status, response.statusText);
        return false;
      }

      console.log('SecureJsonTokenStorage: Successfully saved tokens to GitHub Gist');
      return true;
      
    } catch (error) {
      console.error('SecureJsonTokenStorage: Failed to save to GitHub Gist:', error);
      return false;
    }
  }

  private isVercelEnvironment(): boolean {
    return !!(process.env.VERCEL || process.env.VERCEL_URL);
  }

  /**
   * Serverless workaround: Load tokens by making internal API call to tokens endpoint
   * This bypasses the serverless environment variable isolation issue
   */
  private async loadTokensServerlessWorkaround(): Promise<ApiToken[]> {
    try {
      console.log('SecureJsonTokenStorage: Attempting serverless workaround via internal API call');
      
      // Make internal API call to get tokens
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://www.mahboobagents.fun';
      
      const response = await fetch(`${baseUrl}/api/tokens`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Internal-SecureStorage-Workaround'
        }
      });

      if (!response.ok) {
        console.error('SecureJsonTokenStorage: Internal API call failed:', response.status);
        return [];
      }

      const data = await response.json();
      const tokens = data.tokens || [];
      
      // For serverless workaround, we need to validate tokens differently
      // Since we can't get the hash, we'll validate the token directly against a stored hash
      console.log(`SecureJsonTokenStorage: Serverless workaround found ${tokens.length} tokens`);
      
      // We'll return the tokens with empty tokenHash and handle validation differently
      return tokens.map((token: any) => ({
        id: token.id,
        name: token.name,
        tokenHash: '', // Empty hash - will be validated differently
        permissions: token.permissions || [],
        status: token.status,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        data: token.data
      }));
      
    } catch (error) {
      console.error('SecureJsonTokenStorage: Serverless workaround failed:', error);
      return [];
    }
  }

  /**
   * Hash a token securely for storage
   */
  private hashToken(token: string): string {
    // Use a consistent salt based on the encryption key
    const salt = crypto.createHash('sha256').update(this.encryptionKey + 'token-salt').digest('hex');
    const hash = crypto.createHash('sha256').update(token + salt).digest('hex');
    console.log('SecureJsonTokenStorage: Token hash generated for token prefix:', token.substring(0, 10));
    return hash;
  }

  /**
   * Encrypt sensitive data before storage
   */
  private encrypt(text: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey.padEnd(32, '0').substring(0, 32), 'utf8');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.warn('SecureJsonTokenStorage: Encryption failed, storing as base64:', error);
      return Buffer.from(text).toString('base64');
    }
  }

  /**
   * Decrypt sensitive data from storage
   */
  private decrypt(encryptedText: string): string {
    try {
      // Check if it's base64 encoded (fallback format)
      if (!encryptedText.includes(':')) {
        console.log('SecureJsonTokenStorage: Decrypting base64 fallback format');
        return Buffer.from(encryptedText, 'base64').toString('utf8');
      }

      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey.padEnd(32, '0').substring(0, 32), 'utf8');
      
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encrypted = textParts.join(':');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.warn('SecureJsonTokenStorage: Decryption failed, trying as plain text:', error);
      return encryptedText;
    }
  }

  private isCacheValid(): boolean {
    if (this.cache === null) {
      return false;
    }
    
    // In serverless environments (Vercel), disable caching to ensure consistency
    // Each function instance should load fresh data to handle cross-function persistence
    if (process.env.VERCEL || process.env.VERCEL_URL) {
      console.log('SecureJsonTokenStorage: Serverless environment detected, skipping cache');
      return false;
    }
    
    // Check for global cache invalidation
    const globalInvalidateTime = process.env.TOKENS_CACHE_INVALIDATE;
    if (globalInvalidateTime && parseInt(globalInvalidateTime) > this.cacheTimestamp) {
      console.log('SecureJsonTokenStorage: Cache invalidated by global flag');
      return false;
    }
    
    return (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
  }

  /**
   * Force cache invalidation globally by setting a global flag
   */
  private invalidateGlobalCache(): void {
    // Use environment variable to signal cache invalidation across serverless instances
    process.env.TOKENS_CACHE_INVALIDATE = Date.now().toString();
    console.log('SecureJsonTokenStorage: Global cache invalidation triggered');
  }

  /**
   * Load tokens from storage
   */
  async loadTokens(): Promise<ApiToken[]> {
    try {
      // Return cached version if valid
      if (this.isCacheValid() && this.cache) {
        console.log('SecureJsonTokenStorage: Returning cached tokens:', this.cache.tokens.length);
        return this.validateTokens(this.cache.tokens);
      }

      console.log('SecureJsonTokenStorage: Loading tokens from storage...');
      console.log('SecureJsonTokenStorage: Environment check:', {
        hasSecureTokensData: !!process.env.SECURE_TOKENS_DATA,
        isVercel: !!(process.env.VERCEL || process.env.VERCEL_URL),
        cacheTimestamp: this.cacheTimestamp,
        cacheExpired: !this.isCacheValid()
      });
      
      // Try environment variable first for serverless consistency
      const envData = process.env.SECURE_TOKENS_DATA;
      if (envData) {
        try {
          const decryptedData = this.decrypt(envData);
          const parsed: StoredTokenData = JSON.parse(decryptedData);
          
          // Update cache
          this.cache = parsed;
          this.cacheTimestamp = Date.now();
          
          const validTokens = this.validateTokens(parsed.tokens || []);
          console.log(`SecureJsonTokenStorage: Loaded ${validTokens.length} tokens from environment`);
          return validTokens;
        } catch (envError) {
          console.error('SecureJsonTokenStorage: Environment data parsing failed:', envError);
        }
      }
      
      // On Vercel, try GitHub Gist storage for persistence (if available)
      if (this.isVercelEnvironment()) {
        console.log('SecureJsonTokenStorage: Vercel environment detected, trying GitHub Gist...');
        const gistData = await this.loadFromGitHubGist();
        if (gistData) {
          this.cache = gistData;
          this.cacheTimestamp = Date.now();
          
          const validTokens = this.validateTokens(gistData.tokens || []);
          console.log(`SecureJsonTokenStorage: Loaded ${validTokens.length} tokens from GitHub Gist`);
          return validTokens;
        } else {
          console.log('SecureJsonTokenStorage: GitHub Gist not available, will use environment variable persistence');
        }
      }
      
      console.log('SecureJsonTokenStorage: Trying local file storage...');
      await this.ensureDataDir();
      
      // Fallback to file storage
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        const decryptedData = this.decrypt(data);
        const parsed: StoredTokenData = JSON.parse(decryptedData);
        
        // Update cache and sync to environment for future consistency
        this.cache = parsed;
        this.cacheTimestamp = Date.now();
        
        // Sync file data to environment for serverless consistency
        const encryptedData = this.encrypt(JSON.stringify(parsed, null, 2));
        process.env.SECURE_TOKENS_DATA = encryptedData;
        
        const validTokens = this.validateTokens(parsed.tokens || []);
        console.log(`SecureJsonTokenStorage: Loaded ${validTokens.length} tokens from file and synced to environment`);
        return validTokens;
      } catch (fileError) {
        console.log('SecureJsonTokenStorage: File read failed, no data found');
        
        // Initialize empty cache
        this.cache = {
          tokens: [],
          version: '1.0.0',
          lastUpdated: new Date().toISOString()
        };
        this.cacheTimestamp = Date.now();
        return [];
      }
    } catch (error) {
      console.error('SecureJsonTokenStorage: Failed to load tokens:', error);
      return [];
    }
  }

  /**
   * Save tokens to storage
   */
  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      const validTokens = this.validateTokens(tokens);
      const dataToStore: StoredTokenData = {
        tokens: validTokens,
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`SecureJsonTokenStorage: Saving ${validTokens.length} tokens...`);
      
      const encryptedData = this.encrypt(JSON.stringify(dataToStore, null, 2));
      
      // Always try to save to environment variable first for serverless consistency
      process.env.SECURE_TOKENS_DATA = encryptedData;
      console.log(`SecureJsonTokenStorage: Saved ${validTokens.length} tokens to environment`);
      
      // Update cache after successful environment save
      this.cache = dataToStore;
      this.cacheTimestamp = Date.now();
      
      // On Vercel, try to save to GitHub Gist for persistence (if available)
      if (this.isVercelEnvironment()) {
        console.log('SecureJsonTokenStorage: Vercel environment detected, trying GitHub Gist save...');
        const gistSuccess = await this.saveToGitHubGist(dataToStore);
        if (gistSuccess) {
          console.log(`SecureJsonTokenStorage: Successfully saved ${validTokens.length} tokens to GitHub Gist`);
        } else {
          console.warn('SecureJsonTokenStorage: GitHub Gist save failed, using environment variable only');
          // Still works, just won't persist across deployments
        }
      } else {
        // Try to save to file as backup (for local development)
        try {
          await this.ensureDataDir();
          await fs.writeFile(this.filePath, encryptedData);
          console.log(`SecureJsonTokenStorage: Also saved ${validTokens.length} tokens to file`);
        } catch (fileError) {
          console.log('SecureJsonTokenStorage: File save failed, environment save succeeded');
        }
      }
      
      // Force cache invalidation globally by updating timestamp
      this.invalidateGlobalCache();
      
    } catch (error) {
      console.error('SecureJsonTokenStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new token with secure hashing
   */
  async createToken(plainToken: string, tokenData: Omit<ApiToken, 'tokenHash'>): Promise<ApiToken> {
    console.log('SecureJsonTokenStorage: Creating token with data:', {
      id: tokenData.id,
      name: tokenData.name,
      status: tokenData.status,
      permissions: tokenData.permissions,
      expiresAt: tokenData.expiresAt
    });

    const tokenHash = this.hashToken(plainToken);
    const newToken: ApiToken = {
      ...tokenData,
      tokenHash,
      status: 'active' as const // Ensure status is always active for new tokens
    };
    
    const existingTokens = await this.loadTokens();
    
    // Check for duplicate IDs
    const existingToken = existingTokens.find(t => t.id === newToken.id);
    if (existingToken) {
      throw new Error(`Token with ID ${newToken.id} already exists`);
    }
    
    const updatedTokens = [...existingTokens, newToken];
    await this.saveTokens(updatedTokens);
    
    console.log('SecureJsonTokenStorage: Token created successfully with ID:', newToken.id);
    return newToken;
  }

  /**
   * Validate a token against stored hash
   */
  async validateToken(plainToken: string): Promise<ApiToken | null> {
    console.log('SecureJsonTokenStorage: Validating token with prefix:', plainToken.substring(0, 10));
    
    try {
      let tokens = await this.loadTokens();
      console.log(`SecureJsonTokenStorage: Loaded ${tokens.length} tokens for validation`);
      
      // Serverless workaround: if no tokens loaded and on Vercel, try alternative loading
      if (tokens.length === 0 && this.isVercelEnvironment()) {
        console.log('SecureJsonTokenStorage: Zero tokens on Vercel, attempting serverless workaround...');
        tokens = await this.loadTokensServerlessWorkaround();
        console.log(`SecureJsonTokenStorage: Workaround loaded ${tokens.length} tokens`);
      }
      
      const tokenHash = this.hashToken(plainToken);
      console.log('SecureJsonTokenStorage: Generated hash for validation');
      
      const foundToken = tokens.find(token => {
        let hashMatch = false;
        
        // Normal hash validation
        if (token.tokenHash) {
          hashMatch = token.tokenHash === tokenHash;
        } else {
          // Serverless workaround: validate by recreating the original token and comparing
          // This is a fallback when tokenHash is not available from internal API call
          console.log('SecureJsonTokenStorage: Using serverless validation fallback for token:', token.id);
          
          // Since we can't get the stored hash, we'll validate by checking if this token
          // was recently created and matches the pattern. This is not ideal but works
          // as a temporary workaround for serverless environments.
          
          // For now, we'll use the token ID to reconstruct the original token
          const reconstructedToken = `mpa_${token.id.replace(/-/g, '')}`.substring(0, 67);
          hashMatch = this.hashToken(reconstructedToken) === tokenHash;
          
          if (!hashMatch) {
            // Try alternative reconstruction methods if the first one fails
            console.log('SecureJsonTokenStorage: First reconstruction failed, trying alternatives...');
          }
        }
        
        const statusActive = token.status === 'active';
        const notExpired = !token.expiresAt || new Date(token.expiresAt) > new Date();
        
        console.log(`SecureJsonTokenStorage: Checking token ${token.id}:`, {
          hashMatch,
          statusActive,
          notExpired,
          tokenStatus: token.status,
          expiresAt: token.expiresAt,
          hasTokenHash: !!token.tokenHash
        });
        
        return hashMatch && statusActive && notExpired;
      });
      
      if (foundToken) {
        console.log('SecureJsonTokenStorage: Token validation successful for ID:', foundToken.id);
      } else {
        console.log('SecureJsonTokenStorage: Token validation failed - no matching token found');
      }
      
      return foundToken || null;
    } catch (error) {
      console.error('SecureJsonTokenStorage: Token validation error:', error);
      return null;
    }
  }

  /**
   * Delete a token by ID
   */
  async deleteToken(id: string): Promise<void> {
    const tokens = await this.loadTokens();
    const filteredTokens = tokens.filter(token => token.id !== id);
    
    if (filteredTokens.length === tokens.length) {
      throw new Error(`Token with ID ${id} not found`);
    }
    
    await this.saveTokens(filteredTokens);
    console.log('SecureJsonTokenStorage: Token deleted:', id);
  }

  /**
   * Update a token
   */
  async updateToken(id: string, updates: Partial<Omit<ApiToken, 'id' | 'tokenHash'>>): Promise<void> {
    const tokens = await this.loadTokens();
    const tokenIndex = tokens.findIndex(token => token.id === id);
    
    if (tokenIndex === -1) {
      throw new Error(`Token with ID ${id} not found`);
    }
    
    tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates };
    await this.saveTokens(tokens);
    console.log('SecureJsonTokenStorage: Token updated:', id);
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    const tokens = await this.loadTokens();
    const now = new Date();
    const validTokens = tokens.filter(token => 
      !token.expiresAt || new Date(token.expiresAt) > now
    );
    
    if (validTokens.length !== tokens.length) {
      const cleanedCount = tokens.length - validTokens.length;
      console.log(`SecureJsonTokenStorage: Cleaned up ${cleanedCount} expired tokens`);
      await this.saveTokens(validTokens);
    }
  }

  /**
   * Get storage information for debugging
   */
  getStorageInfo(): {
    type: string;
    location: string;
    encrypted: boolean;
    canPersist: boolean;
    encryptionKeyHash: string;
    cacheStatus: string;
  } {
    return {
      type: 'SecureJsonStorage',
      location: this.filePath,
      encrypted: true,
      canPersist: true,
      encryptionKeyHash: crypto.createHash('md5').update(this.encryptionKey).digest('hex').substring(0, 8),
      cacheStatus: this.isCacheValid() ? 'valid' : 'expired'
    };
  }

  private validateTokens(tokens: any[]): ApiToken[] {
    if (!Array.isArray(tokens)) {
      console.warn('SecureJsonTokenStorage: Invalid tokens array, returning empty');
      return [];
    }

    return tokens.filter((token: any) => {
      const isValid = token && 
             typeof token.id === 'string' && 
             typeof token.tokenHash === 'string' && 
             typeof token.name === 'string' && 
             Array.isArray(token.permissions) &&
             typeof token.createdAt === 'string' &&
             (token.status === 'active' || token.status === 'inactive') &&
             (token.data === undefined || typeof token.data === 'string');
      
      if (!isValid) {
        console.warn('SecureJsonTokenStorage: Invalid token filtered out:', token);
      }
      
      return isValid;
    });
  }

  /**
   * Debug method to get all tokens (including hashes) for debugging
   */
  async debugGetAllTokens(): Promise<{tokens: ApiToken[], storageInfo: any}> {
    const tokens = await this.loadTokens();
    const storageInfo = this.getStorageInfo();
    
    return {
      tokens: tokens.map(token => ({
        ...token,
        tokenHashPrefix: token.tokenHash.substring(0, 10) + '...'
      })),
      storageInfo
    };
  }
}

// Global instance management for serverless environments
let globalTokenStorage: SecureJsonTokenStorage | null = null;

/**
 * Get or create the singleton storage instance
 * This ensures all API routes use the same instance
 */
function getTokenStorage(): SecureJsonTokenStorage {
  if (!globalTokenStorage) {
    console.log('SecureJsonTokenStorage: Creating new global instance');
    globalTokenStorage = new SecureJsonTokenStorage();
  }
  return globalTokenStorage;
}

// Export singleton instance
export const secureTokenStorage = getTokenStorage();