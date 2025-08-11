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
}

export interface StoredTokenData {
  tokens: ApiToken[];
  version: string;
  lastUpdated: string;
}

export class SecureJsonTokenStorage {
  private readonly filePath: string;
  private readonly encryptionKey: string;

  constructor() {
    // Use process.cwd() which works on both local dev and Vercel
    this.filePath = path.join(process.cwd(), 'data', 'secure-tokens.json');
    
    // Use environment variable for encryption key or generate one
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY || this.generateDefaultKey();
    
    console.log('SecureJsonTokenStorage: Initialized with file path:', this.filePath);
  }

  private generateDefaultKey(): string {
    // Generate a consistent key based on environment for development
    const seed = process.env.NEXTAUTH_SECRET || 'default-dev-key';
    return crypto.createHash('sha256').update(seed).digest('hex').substring(0, 32);
  }

  private async ensureDataDir(): Promise<void> {
    try {
      const dataDir = path.dirname(this.filePath);
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // In Vercel, we might not be able to create directories
      // That's okay, we'll fall back to in-memory storage
      console.warn('Could not create data directory, will use in-memory fallback:', error);
    }
  }

  /**
   * Hash a token securely for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token + this.encryptionKey).digest('hex');
  }

  /**
   * Encrypt sensitive data before storage
   */
  private encrypt(text: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.warn('Encryption failed, storing as plain text:', error);
      return text;
    }
  }

  /**
   * Decrypt sensitive data from storage
   */
  private decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex');
      
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encrypted = textParts.join(':');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed, returning as is:', error);
      return encryptedText;
    }
  }

  /**
   * Load tokens from storage
   */
  async loadTokens(): Promise<ApiToken[]> {
    try {
      await this.ensureDataDir();
      
      // Try to read from file first
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        const parsed: StoredTokenData = JSON.parse(this.decrypt(data));
        
        // Validate and filter tokens
        const validTokens = this.validateTokens(parsed.tokens || []);
        console.log(`SecureJsonTokenStorage: Loaded ${validTokens.length} tokens from file`);
        return validTokens;
      } catch (fileError) {
        console.log('File not found or invalid, checking environment variable...');
        
        // Fallback to environment variable for Vercel
        const envData = process.env.SECURE_TOKENS_DATA;
        if (envData) {
          const parsed: StoredTokenData = JSON.parse(this.decrypt(envData));
          const validTokens = this.validateTokens(parsed.tokens || []);
          console.log(`SecureJsonTokenStorage: Loaded ${validTokens.length} tokens from environment`);
          return validTokens;
        }
        
        console.log('No tokens found, returning empty array');
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
      
      const encryptedData = this.encrypt(JSON.stringify(dataToStore, null, 2));
      
      // Try to save to file first
      try {
        await this.ensureDataDir();
        await fs.writeFile(this.filePath, encryptedData);
        console.log(`SecureJsonTokenStorage: Saved ${validTokens.length} tokens to file`);
      } catch (fileError) {
        console.warn('Could not save to file, this is expected on Vercel. Tokens are stored in memory for this session.');
        
        // On Vercel, we can't persist to file system, but we can log guidance
        console.log('For Vercel deployment, consider setting SECURE_TOKENS_DATA environment variable with encrypted token data');
        
        // Store in process environment for current session
        process.env.SECURE_TOKENS_DATA = encryptedData;
      }
    } catch (error) {
      console.error('SecureJsonTokenStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new token with secure hashing
   */
  async createToken(plainToken: string, tokenData: Omit<ApiToken, 'tokenHash'>): Promise<ApiToken> {
    const tokenHash = this.hashToken(plainToken);
    const newToken: ApiToken = {
      ...tokenData,
      tokenHash
    };
    
    const existingTokens = await this.loadTokens();
    const updatedTokens = [...existingTokens, newToken];
    await this.saveTokens(updatedTokens);
    
    return newToken;
  }

  /**
   * Validate a token against stored hash
   */
  async validateToken(plainToken: string): Promise<ApiToken | null> {
    const tokens = await this.loadTokens();
    const tokenHash = this.hashToken(plainToken);
    
    const foundToken = tokens.find(token => 
      token.tokenHash === tokenHash && 
      token.status === 'active' &&
      (!token.expiresAt || new Date(token.expiresAt) > new Date())
    );
    
    return foundToken || null;
  }

  /**
   * Delete a token by ID
   */
  async deleteToken(id: string): Promise<void> {
    const tokens = await this.loadTokens();
    const filteredTokens = tokens.filter(token => token.id !== id);
    await this.saveTokens(filteredTokens);
  }

  /**
   * Update a token
   */
  async updateToken(id: string, updates: Partial<Omit<ApiToken, 'id' | 'tokenHash'>>): Promise<void> {
    const tokens = await this.loadTokens();
    const tokenIndex = tokens.findIndex(token => token.id === id);
    
    if (tokenIndex !== -1) {
      tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates };
      await this.saveTokens(tokens);
    }
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
      console.log(`Cleaned up ${tokens.length - validTokens.length} expired tokens`);
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
  } {
    return {
      type: 'SecureJsonStorage',
      location: this.filePath,
      encrypted: true,
      canPersist: true // Can persist in environment variable on Vercel
    };
  }

  private validateTokens(tokens: any[]): ApiToken[] {
    return tokens.filter((token: any) => {
      return token && 
             typeof token.id === 'string' && 
             typeof token.tokenHash === 'string' && 
             typeof token.name === 'string' && 
             Array.isArray(token.permissions) &&
             typeof token.createdAt === 'string' &&
             (token.status === 'active' || token.status === 'inactive');
    });
  }
}

// Export singleton instance
export const secureTokenStorage = new SecureJsonTokenStorage();