import { TokenStorage, ApiToken } from './tokenStorage';
import { put, head } from '@vercel/blob';

export class VercelBlobTokenStorage implements TokenStorage {
  private readonly fileName = 'tokens.json';

  constructor() {
    console.log('VercelBlobTokenStorage: Initialized');
    console.log('Environment check:', {
      hasBlobReadWriteToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    });
  }

  async loadTokens(): Promise<ApiToken[]> {
    try {
      console.log('VercelBlobTokenStorage: Loading tokens...');
      
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('VercelBlobTokenStorage: BLOB_READ_WRITE_TOKEN not found');
        return [];
      }
      
      // Check if blob exists and get its URL
      let blobUrl: string;
      try {
        const headResult = await head(this.fileName);
        console.log('VercelBlobTokenStorage: Blob exists, size:', headResult.size);
        blobUrl = headResult.url;
      } catch (error) {
        console.log('VercelBlobTokenStorage: Blob does not exist, returning empty array');
        return [];
      }

      // Fetch blob content using the actual blob URL
      const response = await fetch(blobUrl);

      if (!response.ok) {
        console.warn('VercelBlobTokenStorage: Failed to fetch blob content, status:', response.status);
        return [];
      }

      const data = await response.text();
      
      if (!data.trim()) {
        console.log('VercelBlobTokenStorage: Empty blob content, returning empty array');
        return [];
      }
      
      const tokens = JSON.parse(data);
      const validTokens = this.validateTokens(Array.isArray(tokens) ? tokens : []);
      
      console.log(`VercelBlobTokenStorage: Successfully loaded ${validTokens.length} tokens`);
      return validTokens;
      
    } catch (error) {
      console.error('VercelBlobTokenStorage: Failed to load tokens:', error);
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      const validTokens = this.validateTokens(tokens);
      console.log(`VercelBlobTokenStorage: Saving ${validTokens.length} tokens...`);
      
      const data = JSON.stringify(validTokens, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      
      const result = await put(this.fileName, blob, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      console.log('VercelBlobTokenStorage: Tokens saved successfully to:', result.url);
    } catch (error) {
      console.error('VercelBlobTokenStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens to Vercel Blob: ${error instanceof Error ? error.message : String(error)}`);
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

  getStorageInfo(): { type: string; details: string } {
    return {
      type: 'Vercel Blob Storage (FREE)',
      details: `File: ${this.fileName}, Has Token: ${!!process.env.BLOB_READ_WRITE_TOKEN}`
    };
  }

  isAvailable(): boolean {
    return !!process.env.BLOB_READ_WRITE_TOKEN;
  }
}