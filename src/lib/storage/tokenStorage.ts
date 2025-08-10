import { promises as fs } from 'fs';
import path from 'path';

// Import the new free storage options
import { GitHubGistTokenStorage } from './githubGistStorage';
import { VercelBlobTokenStorage } from './vercelBlobStorage';
import { VercelSimpleStorage } from './vercelSimpleStorage';
import { VercelReliableStorage } from './vercelReliableStorage';

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  expiresAt?: string;
}

export interface TokenStorage {
  loadTokens(): Promise<ApiToken[]>;
  saveTokens(tokens: ApiToken[]): Promise<void>;
  deleteToken(id: string): Promise<void>;
  updateToken(id: string, updates: Partial<ApiToken>): Promise<void>;
}

// Local file-based storage (for development)
export class LocalTokenStorage implements TokenStorage {
  private readonly filePath: string;

  constructor() {
    try {
      this.filePath = path.join(process.cwd(), 'data', 'tokens.json');
      console.log('LocalTokenStorage: File path set to:', this.filePath);
    } catch (error) {
      console.error('LocalTokenStorage: Failed to set file path:', error);
      // Fallback to a relative path
      this.filePath = './data/tokens.json';
      console.log('LocalTokenStorage: Using fallback path:', this.filePath);
    }
  }

  private async ensureDataDir(): Promise<void> {
    try {
      const dataDir = path.dirname(this.filePath);
      console.log('LocalTokenStorage: Checking data directory:', dataDir);
      
      try {
        await fs.access(dataDir);
        console.log('LocalTokenStorage: Data directory exists');
      } catch {
        console.log('LocalTokenStorage: Creating data directory:', dataDir);
        await fs.mkdir(dataDir, { recursive: true });
        console.log('LocalTokenStorage: Data directory created successfully');
      }
    } catch (error) {
      console.error('LocalTokenStorage: Failed to ensure data directory:', error);
      throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    try {
      console.log('LocalTokenStorage: Loading tokens from:', this.filePath);
      await this.ensureDataDir();
      
      const data = await fs.readFile(this.filePath, 'utf-8');
      console.log('LocalTokenStorage: File read successfully, size:', data.length);
      
      const tokens = JSON.parse(data);
      console.log('LocalTokenStorage: Parsed tokens count:', tokens.length);
      
      // Validate and filter tokens
      const validTokens = this.validateTokens(tokens);
      console.log('LocalTokenStorage: Valid tokens count:', validTokens.length);
      return validTokens;
    } catch (error) {
      console.warn('LocalTokenStorage: Failed to load tokens, returning empty array:', error);
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      await this.ensureDataDir();
      const validTokens = this.validateTokens(tokens);
      console.log(`LocalTokenStorage: Saving ${validTokens.length} tokens to ${this.filePath}`);
      await fs.writeFile(this.filePath, JSON.stringify(validTokens, null, 2));
      console.log('LocalTokenStorage: Tokens saved successfully');
    } catch (error) {
      console.error('LocalTokenStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens locally: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteToken(id: string): Promise<void> {
    const tokens = await this.loadTokens();
    const filteredTokens = tokens.filter(token => token.id !== id);
    await this.saveTokens(filteredTokens);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    const tokens = await this.loadTokens();
    const tokenIndex = tokens.findIndex(token => token.id === id);
    if (tokenIndex !== -1) {
      tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates };
      await this.saveTokens(tokens);
    }
  }

  private validateTokens(tokens: any[]): ApiToken[] {
    return tokens.filter((token: any) => {
      return token && 
             typeof token.id === 'string' && 
             typeof token.token === 'string' && 
             typeof token.name === 'string' && 
             Array.isArray(token.permissions) &&
             typeof token.createdAt === 'string' &&
             (token.status === 'active' || token.status === 'inactive');
    });
  }
}

// Free storage options only


// In-memory storage as fallback (for Vercel when other storage is not available)
export class InMemoryTokenStorage implements TokenStorage {
  private tokens: ApiToken[] = [];
  private initialized = false;

  constructor() {
    // Try to initialize from environment variable if available
    this.initializeFromEnv();
  }

  private initializeFromEnv(): void {
    try {
      const envTokens = process.env.TOKENS_DATA;
      if (envTokens) {
        this.tokens = JSON.parse(envTokens);
        this.initialized = true;
        console.log('Initialized in-memory storage from environment variable');
      }
    } catch (error) {
      console.warn('Failed to initialize tokens from environment variable:', error);
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    try {
      if (!this.initialized) {
        this.initializeFromEnv();
      }
      const tokens = this.validateTokens([...this.tokens]);
      console.log(`InMemoryTokenStorage: Loaded ${tokens.length} tokens`);
      return tokens;
    } catch (error) {
      console.error('InMemoryTokenStorage: Failed to load tokens:', error);
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      console.log(`InMemoryTokenStorage: Saving ${tokens.length} tokens`);
      const validTokens = this.validateTokens(tokens);
      this.tokens = validTokens;
      
      // Try to persist to environment variable (for Vercel)
      try {
        if (typeof process !== 'undefined' && process.env) {
          // Note: This won't persist across function invocations, but it's a fallback
          console.log('Tokens saved to in-memory storage (will reset on next function call)');
        }
      } catch (error) {
        console.warn('Could not persist tokens to environment:', error);
      }
      
      console.log('InMemoryTokenStorage: Tokens saved successfully');
    } catch (error) {
      console.error('InMemoryTokenStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens in memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteToken(id: string): Promise<void> {
    this.tokens = this.tokens.filter(token => token.id !== id);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    const tokenIndex = this.tokens.findIndex(token => token.id === id);
    if (tokenIndex !== -1) {
      this.tokens[tokenIndex] = { ...this.tokens[tokenIndex], ...updates };
    }
  }

  private validateTokens(tokens: any[]): ApiToken[] {
    return tokens.filter((token: any) => {
      return token && 
             typeof token.id === 'string' && 
             typeof token.token === 'string' && 
             typeof token.name === 'string' && 
             Array.isArray(token.permissions) &&
             typeof token.createdAt === 'string' &&
             (token.status === 'active' || token.status === 'inactive');
    });
  }
}

// Vercel-specific storage for persistent data
export class VercelTokenStorage implements TokenStorage {
  private readonly filePath: string;
  private fallbackStorage: InMemoryTokenStorage;
  private useFallback: boolean = false;

  constructor() {
    try {
      this.filePath = path.join(process.cwd(), 'data', 'tokens.json');
      console.log('VercelTokenStorage: File path set to:', this.filePath);
      this.fallbackStorage = new InMemoryTokenStorage();
    } catch (error) {
      console.error('VercelTokenStorage: Failed to set file path:', error);
      // Fallback to a relative path
      this.filePath = './data/tokens.json';
      console.log('VercelTokenStorage: Using fallback path:', this.filePath);
      this.fallbackStorage = new InMemoryTokenStorage();
    }
  }

  private async ensureDataDir(): Promise<void> {
    try {
      const dataDir = path.dirname(this.filePath);
      console.log('VercelTokenStorage: Checking data directory:', dataDir);
      
      try {
        await fs.access(dataDir);
        console.log('VercelTokenStorage: Data directory exists');
      } catch {
        console.log('VercelTokenStorage: Creating data directory:', dataDir);
        await fs.mkdir(dataDir, { recursive: true });
        console.log('VercelTokenStorage: Data directory created successfully');
      }
    } catch (error) {
      console.error('VercelTokenStorage: Failed to ensure data directory:', error);
      console.log('VercelTokenStorage: Switching to fallback in-memory storage');
      this.useFallback = true;
      throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    // If we're using fallback, use in-memory storage
    if (this.useFallback) {
      console.log('VercelTokenStorage: Using fallback in-memory storage for loading');
      return this.fallbackStorage.loadTokens();
    }

    try {
      console.log('VercelTokenStorage: Loading tokens from:', this.filePath);
      await this.ensureDataDir();
      
      const data = await fs.readFile(this.filePath, 'utf-8');
      console.log('VercelTokenStorage: File read successfully, size:', data.length);
      
      const tokens = JSON.parse(data);
      console.log('VercelTokenStorage: Parsed tokens count:', tokens.length);
      
      // Validate and filter tokens
      const validTokens = this.validateTokens(tokens);
      console.log('VercelTokenStorage: Valid tokens count:', validTokens.length);
      return validTokens;
    } catch (error) {
      console.warn('VercelTokenStorage: Failed to load tokens from file, switching to fallback:', error);
      this.useFallback = true;
      return this.fallbackStorage.loadTokens();
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    // If we're using fallback, use in-memory storage
    if (this.useFallback) {
      console.log('VercelTokenStorage: Using fallback in-memory storage for saving');
      return this.fallbackStorage.saveTokens(tokens);
    }

    try {
      await this.ensureDataDir();
      const validTokens = this.validateTokens(tokens);
      console.log(`VercelTokenStorage: Saving ${validTokens.length} tokens to ${this.filePath}`);
      await fs.writeFile(this.filePath, JSON.stringify(validTokens, null, 2));
      console.log('VercelTokenStorage: Tokens saved successfully');
    } catch (error) {
      console.error('VercelTokenStorage: Failed to save tokens to file, switching to fallback:', error);
      this.useFallback = true;
      return this.fallbackStorage.saveTokens(tokens);
    }
  }

  async deleteToken(id: string): Promise<void> {
    if (this.useFallback) {
      return this.fallbackStorage.deleteToken(id);
    }
    
    const tokens = await this.loadTokens();
    const filteredTokens = tokens.filter(token => token.id !== id);
    await this.saveTokens(filteredTokens);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    if (this.useFallback) {
      return this.fallbackStorage.updateToken(id, updates);
    }
    
    const tokens = await this.loadTokens();
    const tokenIndex = tokens.findIndex(token => token.id === id);
    if (tokenIndex !== -1) {
      tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates };
      await this.saveTokens(tokens);
    }
  }

  private validateTokens(tokens: any[]): ApiToken[] {
    return tokens.filter((token: any) => {
      return token && 
             typeof token.id === 'string' && 
             typeof token.token === 'string' && 
             typeof token.name === 'string' && 
             Array.isArray(token.permissions) &&
             typeof token.createdAt === 'string' &&
             (token.status === 'active' || token.status === 'inactive');
    });
  }

  /**
   * Get the current storage mode
   */
  getStorageMode(): string {
    return this.useFallback ? 'fallback-in-memory' : 'file-system';
  }
}

// Hybrid storage that automatically chooses the best option
export class HybridTokenStorage implements TokenStorage {
  private storage: TokenStorage;

  constructor() {
    console.log('HybridTokenStorage: Initializing...');
    console.log('Environment check:', {
      hasProcess: typeof process !== 'undefined',
      hasEnv: typeof process !== 'undefined' && !!process.env,
      nodeEnv: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : 'undefined',
      vercelUrl: typeof process !== 'undefined' && process.env ? process.env.VERCEL_URL : 'undefined',
      isVercel: typeof process !== 'undefined' && process.env && process.env.VERCEL_URL ? true : false
    });

    // Priority order: FREE options only
    // 1. GitHub Gist (100% free, requires GitHub token, most reliable)
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_GIST_ID) {
      console.log('Using GitHub Gist storage (FREE, persistent)');
      this.storage = new GitHubGistTokenStorage();
    }
    // 2. Vercel Blob Storage (reliable, free tier: 100GB, 1M requests/month)  
    else if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Using Vercel Blob storage (FREE, reliable)');
      this.storage = new VercelBlobTokenStorage();
    }
    // 3. Local file system (free, persistent locally and on some deployments)
    else if (!this.isVercelEnvironment()) {
      console.log('Using local file storage (FREE, persistent)');
      this.storage = new LocalTokenStorage();
    }
    // 4. Vercel file storage with fallback (attempts file system first)
    else if (this.isVercelEnvironment()) {
      console.log('Using Vercel file storage with in-memory fallback');
      this.storage = new VercelTokenStorage();
    }
    // 5. In-memory (free, but data resets - last resort)
    else {
      console.log('Using in-memory storage (FREE, but data resets)');
      this.storage = new InMemoryTokenStorage();
    }
    
    console.log('HybridTokenStorage: Initialized with', this.getStorageType(), 'storage');
  }

  /**
   * Detect if we're running on Vercel
   */
  private isVercelEnvironment(): boolean {
    // Check for Vercel-specific environment variables
    if (typeof process !== 'undefined' && process.env) {
      return !!(process.env.VERCEL_URL || process.env.VERCEL || process.env.VERCEL_ENV);
    }
    return false;
  }

  // Method to get current storage type for debugging
  getStorageType(): string {
    if (this.storage instanceof VercelReliableStorage) return 'Vercel Reliable (FREE)';
    if (this.storage instanceof VercelBlobTokenStorage) return 'Vercel Blob (FREE)';
    if (this.storage instanceof GitHubGistTokenStorage) return 'GitHub Gist (FREE)';
    if (this.storage instanceof VercelTokenStorage) return `Vercel File (FREE)`;
    if (this.storage instanceof InMemoryTokenStorage) return 'InMemory (FREE)';
    if (this.storage instanceof LocalTokenStorage) return 'Local (FREE)';
    return 'Unknown';
  }

  /**
   * Get detailed storage information for debugging
   */
  getStorageInfo(): {
    type: string;
    details: string;
    environment: string;
    vercelDetected: boolean;
  } {
    const type = this.getStorageType();
    let details = '';
    let environment = 'unknown';

    if (typeof process !== 'undefined' && process.env) {
      environment = process.env.NODE_ENV || 'unknown';
    }

    if (this.storage instanceof GitHubGistTokenStorage) {
      const gistStorage = this.storage as GitHubGistTokenStorage;
      details = gistStorage.getStorageInfo().details;
    } else if (this.storage instanceof VercelBlobTokenStorage) {
      const blobStorage = this.storage as VercelBlobTokenStorage;
      details = blobStorage.getStorageInfo().details;
    } else if (this.storage instanceof VercelTokenStorage) {
      details = `Mode: ${this.storage.getStorageMode()}`;
    } else if (this.storage instanceof InMemoryTokenStorage) {
      details = 'In-memory storage (data resets on restart)';
    } else if (this.storage instanceof LocalTokenStorage) {
      details = 'Local file system storage';
    }

    return {
      type,
      details,
      environment,
      vercelDetected: this.isVercelEnvironment()
    };
  }

  async loadTokens(): Promise<ApiToken[]> {
    return this.storage.loadTokens();
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    console.log(`HybridTokenStorage: Using ${this.getStorageType()} storage to save ${tokens.length} tokens`);
    try {
      await this.storage.saveTokens(tokens);
      console.log(`HybridTokenStorage: Successfully saved tokens using ${this.getStorageType()} storage`);
    } catch (error) {
      console.error(`HybridTokenStorage: Failed to save tokens using ${this.getStorageType()} storage:`, error);
      throw error;
    }
  }

  async deleteToken(id: string): Promise<void> {
    return this.storage.deleteToken(id);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    return this.storage.updateToken(id, updates);
  }
}

// Export the default storage instance
export const tokenStorage = new HybridTokenStorage(); 