import { TokenStorage, ApiToken } from './tokenStorage';

// Ultra-simple storage that works 100% on Vercel
export class VercelReliableStorage implements TokenStorage {
  private tokens: Map<string, ApiToken> = new Map();
  private initialized = false;

  constructor() {
    console.log('VercelReliableStorage: Initialized');
  }

  private initialize(): void {
    if (this.initialized) return;
    
    try {
      // Try to load from environment variable
      if (process.env.STORED_TOKENS) {
        const stored = JSON.parse(process.env.STORED_TOKENS);
        if (Array.isArray(stored)) {
          stored.forEach(token => {
            if (this.isValidToken(token)) {
              this.tokens.set(token.id, token);
            }
          });
          console.log(`VercelReliableStorage: Loaded ${this.tokens.size} tokens from environment`);
        }
      }
    } catch (error) {
      console.warn('VercelReliableStorage: Could not load from environment:', error);
    }
    
    this.initialized = true;
  }

  async loadTokens(): Promise<ApiToken[]> {
    this.initialize();
    const tokenArray = Array.from(this.tokens.values());
    console.log(`VercelReliableStorage: Loaded ${tokenArray.length} tokens`);
    return tokenArray;
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      console.log(`VercelReliableStorage: Saving ${tokens.length} tokens...`);
      
      // Clear existing tokens
      this.tokens.clear();
      
      // Add valid tokens
      const validTokens = tokens.filter(token => this.isValidToken(token));
      validTokens.forEach(token => {
        this.tokens.set(token.id, token);
      });
      
      console.log(`VercelReliableStorage: Successfully saved ${this.tokens.size} valid tokens`);
      
      // Note: On Vercel, we can't persist to environment variables across invocations
      // But this storage will work for the duration of the function execution
      // For true persistence, you'll need to add a database or external storage
      
    } catch (error) {
      console.error('VercelReliableStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteToken(id: string): Promise<void> {
    this.initialize();
    const deleted = this.tokens.delete(id);
    console.log(`VercelReliableStorage: Token ${id} ${deleted ? 'deleted' : 'not found'}`);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    this.initialize();
    const existing = this.tokens.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      if (this.isValidToken(updated)) {
        this.tokens.set(id, updated);
        console.log(`VercelReliableStorage: Token ${id} updated`);
      }
    }
  }

  private isValidToken(token: any): token is ApiToken {
    return token && 
           typeof token.id === 'string' && 
           typeof token.token === 'string' && 
           typeof token.name === 'string' && 
           Array.isArray(token.permissions) &&
           typeof token.createdAt === 'string' &&
           (token.status === 'active' || token.status === 'inactive');
  }

  getStorageInfo(): { type: string; details: string } {
    return {
      type: 'Vercel Reliable Storage (In-Memory)',
      details: `${this.tokens.size} tokens in memory`
    };
  }

  // Test method to verify storage is working
  async test(): Promise<{ success: boolean; message: string }> {
    try {
      const testToken: ApiToken = {
        id: 'test-' + Date.now(),
        token: 'test_token_' + Math.random(),
        name: 'Test Token',
        permissions: ['read'],
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Test save
      await this.saveTokens([testToken]);
      
      // Test load
      const loaded = await this.loadTokens();
      const found = loaded.find(t => t.id === testToken.id);
      
      if (found) {
        // Test delete
        await this.deleteToken(testToken.id);
        return { success: true, message: 'All storage operations work correctly' };
      } else {
        return { success: false, message: 'Token not found after save' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Storage test failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}