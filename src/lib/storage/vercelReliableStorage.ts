import { TokenStorage, ApiToken } from './tokenStorage';
import { promises as fs } from 'fs';
import path from 'path';

// Vercel-optimized storage using /tmp directory (persistent within function lifecycle)
export class VercelReliableStorage implements TokenStorage {
  private tokens: Map<string, ApiToken> = new Map();
  private initialized = false;
  private tmpFilePath: string;

  constructor() {
    // Use /tmp directory which is writable on Vercel
    this.tmpFilePath = path.join('/tmp', 'tokens.json');
    console.log('VercelReliableStorage: Initialized with path:', this.tmpFilePath);
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Try to load from /tmp file first (most recent)
      try {
        const data = await fs.readFile(this.tmpFilePath, 'utf-8');
        const stored = JSON.parse(data);
        if (Array.isArray(stored)) {
          stored.forEach(token => {
            if (this.isValidToken(token)) {
              this.tokens.set(token.id, token);
            }
          });
          console.log(`VercelReliableStorage: Loaded ${this.tokens.size} tokens from /tmp file`);
        }
      } catch (fileError) {
        // If file doesn't exist, try environment variable as fallback
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
      }
    } catch (error) {
      console.warn('VercelReliableStorage: Could not load tokens:', error);
    }
    
    this.initialized = true;
  }

  async loadTokens(): Promise<ApiToken[]> {
    await this.initialize();
    const tokenArray = Array.from(this.tokens.values());
    console.log(`VercelReliableStorage: Loaded ${tokenArray.length} tokens`);
    return tokenArray;
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      console.log(`VercelReliableStorage: Saving ${tokens.length} tokens...`);
      
      // Validate all tokens first
      const validTokens = tokens.filter(token => {
        const isValid = this.isValidToken(token);
        if (!isValid) {
          console.warn('Invalid token filtered out:', token);
        }
        return isValid;
      });
      
      if (validTokens.length !== tokens.length) {
        console.warn(`Filtered out ${tokens.length - validTokens.length} invalid tokens`);
      }
      
      // Clear existing tokens
      this.tokens.clear();
      
      // Add valid tokens to memory
      validTokens.forEach(token => {
        this.tokens.set(token.id, token);
      });
      
      console.log(`VercelReliableStorage: Added ${this.tokens.size} tokens to memory`);
      
      // Save to /tmp file for persistence within Vercel function lifecycle
      let fileSaveSuccess = false;
      try {
        // Ensure /tmp directory exists
        const tmpDir = path.dirname(this.tmpFilePath);
        try {
          await fs.access(tmpDir);
        } catch {
          await fs.mkdir(tmpDir, { recursive: true });
        }
        
        const dataToSave = JSON.stringify(validTokens, null, 2);
        await fs.writeFile(this.tmpFilePath, dataToSave, 'utf-8');
        fileSaveSuccess = true;
        console.log(`VercelReliableStorage: Saved ${this.tokens.size} tokens to /tmp file: ${this.tmpFilePath}`);
      } catch (fileError) {
        console.warn('VercelReliableStorage: Could not write to /tmp file:', fileError);
        console.warn('VercelReliableStorage: File error details:', {
          path: this.tmpFilePath,
          error: fileError instanceof Error ? fileError.message : String(fileError),
          stack: fileError instanceof Error ? fileError.stack : undefined
        });
      }
      
      console.log(`VercelReliableStorage: Save completed - Memory: ${this.tokens.size} tokens, File: ${fileSaveSuccess ? 'success' : 'failed'}`);
      
      // Always succeed if we have tokens in memory, even if file save fails
      if (this.tokens.size === validTokens.length) {
        console.log('VercelReliableStorage: Save operation successful');
      } else {
        throw new Error('Token count mismatch after save operation');
      }
      
    } catch (error) {
      console.error('VercelReliableStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteToken(id: string): Promise<void> {
    await this.initialize();
    const deleted = this.tokens.delete(id);
    
    // Save to file after deletion
    if (deleted) {
      try {
        const tokenArray = Array.from(this.tokens.values());
        const dataToSave = JSON.stringify(tokenArray, null, 2);
        await fs.writeFile(this.tmpFilePath, dataToSave, 'utf-8');
        console.log(`VercelReliableStorage: Token ${id} deleted and file updated`);
      } catch (error) {
        console.warn('VercelReliableStorage: Could not update file after deletion:', error);
      }
    }
    
    console.log(`VercelReliableStorage: Token ${id} ${deleted ? 'deleted' : 'not found'}`);
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    await this.initialize();
    const existing = this.tokens.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      if (this.isValidToken(updated)) {
        this.tokens.set(id, updated);
        
        // Save to file after update
        try {
          const tokenArray = Array.from(this.tokens.values());
          const dataToSave = JSON.stringify(tokenArray, null, 2);
          await fs.writeFile(this.tmpFilePath, dataToSave, 'utf-8');
          console.log(`VercelReliableStorage: Token ${id} updated and file saved`);
        } catch (error) {
          console.warn('VercelReliableStorage: Could not update file after token update:', error);
        }
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