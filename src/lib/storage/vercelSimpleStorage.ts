import { TokenStorage, ApiToken } from './tokenStorage';

// Simple storage that works on Vercel using temporary file system
export class VercelSimpleStorage implements TokenStorage {
  private tokens: ApiToken[] = [];
  private initialized = false;

  constructor() {
    console.log('VercelSimpleStorage: Initialized');
    this.initializeFromTempFile();
  }

  private async initializeFromTempFile(): Promise<void> {
    try {
      if (typeof process !== 'undefined' && process.env) {
        // Try to read from /tmp directory (writable on Vercel)
        const tmpPath = '/tmp/tokens.json';
        const fs = await import('fs/promises');
        
        try {
          const data = await fs.readFile(tmpPath, 'utf-8');
          this.tokens = JSON.parse(data);
          this.initialized = true;
          console.log('VercelSimpleStorage: Loaded tokens from temp file');
        } catch (error) {
          console.log('VercelSimpleStorage: No existing temp file found');
        }
      }
    } catch (error) {
      console.log('VercelSimpleStorage: Failed to initialize from temp file:', error);
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    try {
      if (!this.initialized) {
        await this.initializeFromTempFile();
      }
      
      const tokens = this.validateTokens([...this.tokens]);
      console.log(`VercelSimpleStorage: Loaded ${tokens.length} tokens`);
      return tokens;
    } catch (error) {
      console.error('VercelSimpleStorage: Failed to load tokens:', error);
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      console.log(`VercelSimpleStorage: Saving ${tokens.length} tokens...`);
      const validTokens = this.validateTokens(tokens);
      this.tokens = validTokens;
      
      // Try to save to /tmp directory (writable on Vercel)
      if (typeof process !== 'undefined' && process.env) {
        try {
          const tmpPath = '/tmp/tokens.json';
          const fs = await import('fs/promises');
          const data = JSON.stringify(validTokens, null, 2);
          await fs.writeFile(tmpPath, data);
          console.log('VercelSimpleStorage: Tokens saved to temp file');
        } catch (error) {
          console.warn('VercelSimpleStorage: Could not persist to temp file:', error);
        }
      }
      
      this.initialized = true;
      console.log('VercelSimpleStorage: Tokens saved successfully');
    } catch (error) {
      console.error('VercelSimpleStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteToken(id: string): Promise<void> {
    this.tokens = this.tokens.filter(token => token.id !== id);
    await this.saveTokens(this.tokens);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    const tokenIndex = this.tokens.findIndex(token => token.id === id);
    if (tokenIndex !== -1) {
      this.tokens[tokenIndex] = { ...this.tokens[tokenIndex], ...updates };
      await this.saveTokens(this.tokens);
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

  getStorageInfo(): { type: string; details: string } {
    return {
      type: 'Vercel Simple Storage (FREE)',
      details: `In-memory with temp file backup, ${this.tokens.length} tokens`
    };
  }
}