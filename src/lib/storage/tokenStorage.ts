import { promises as fs } from 'fs';
import path from 'path';

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
    this.filePath = path.join(process.cwd(), 'data', 'tokens.json');
  }

  private async ensureDataDir(): Promise<void> {
    const dataDir = path.dirname(this.filePath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    try {
      await this.ensureDataDir();
      const data = await fs.readFile(this.filePath, 'utf-8');
      const tokens = JSON.parse(data);
      
      // Validate and filter tokens
      return this.validateTokens(tokens);
    } catch {
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    await this.ensureDataDir();
    const validTokens = this.validateTokens(tokens);
    await fs.writeFile(this.filePath, JSON.stringify(validTokens, null, 2));
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

// Cloudflare R2 storage (for production)
export class CloudflareTokenStorage implements TokenStorage {
  private readonly bucket: any;

  constructor() {
    // Access R2 bucket from Cloudflare Workers environment
    this.bucket = (globalThis as any).NEXT_INC_CACHE_R2_BUCKET || null;
  }

  async loadTokens(): Promise<ApiToken[]> {
    if (!this.bucket) {
      throw new Error('R2 bucket not available');
    }

    try {
      const object = await this.bucket.get('tokens.json');
      if (!object) return [];
      
      const data = await object.text();
      const tokens = JSON.parse(data);
      return this.validateTokens(tokens);
    } catch {
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    if (!this.bucket) {
      throw new Error('R2 bucket not available');
    }

    const validTokens = this.validateTokens(tokens);
    const data = JSON.stringify(validTokens, null, 2);
    await this.bucket.put('tokens.json', data, {
      httpMetadata: { contentType: 'application/json' }
    });
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

// In-memory storage as fallback (for Vercel when R2 is not available)
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
    if (!this.initialized) {
      this.initializeFromEnv();
    }
    return this.validateTokens([...this.tokens]);
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
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

// Hybrid storage that automatically chooses the best option
export class HybridTokenStorage implements TokenStorage {
  private storage: TokenStorage;

  constructor() {
    // Check if we're in a Cloudflare environment
    if (typeof globalThis !== 'undefined' && (globalThis as any).NEXT_INC_CACHE_R2_BUCKET) {
      console.log('Using Cloudflare R2 storage');
      this.storage = new CloudflareTokenStorage();
    } else if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      // In production (Vercel), use in-memory storage as fallback
      console.log('Using in-memory storage (production fallback)');
      this.storage = new InMemoryTokenStorage();
    } else {
      // In development, use local file storage
      console.log('Using local file storage');
      this.storage = new LocalTokenStorage();
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    return this.storage.loadTokens();
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    return this.storage.saveTokens(tokens);
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