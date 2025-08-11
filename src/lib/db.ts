import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Simple JSON-based database implementation for free hosting
 * This provides database-like operations while being completely free
 * and working on any hosting platform including Vercel
 */

export interface DbRecord {
  id: string;
  [key: string]: any;
}

export interface Database {
  tokens: TokenRecord[];
  metadata: {
    version: string;
    lastUpdated: string;
    encryptionEnabled: boolean;
  };
}

export interface TokenRecord {
  id: string;
  name: string;
  tokenHash: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  expiresAt?: string;
}

class SimpleDatabase {
  private readonly dbPath: string;
  private readonly encryptionKey: string;
  private cache: Database | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'database.json');
    this.encryptionKey = this.getEncryptionKey();
    console.log('SimpleDatabase: Initialized with path:', this.dbPath);
  }

  private getEncryptionKey(): string {
    // Use environment variable or generate from NEXTAUTH_SECRET
    return process.env.DB_ENCRYPTION_KEY || 
           crypto.createHash('sha256')
                 .update(process.env.NEXTAUTH_SECRET || 'default-key')
                 .digest('hex')
                 .substring(0, 32);
  }

  private async ensureDataDir(): Promise<void> {
    try {
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // On Vercel, we might not be able to create directories
      console.warn('Could not create data directory:', error);
    }
  }

  private encrypt(data: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.warn('Encryption failed, storing as plain text:', error);
      return data;
    }
  }

  private decrypt(encryptedData: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex');
      
      const textParts = encryptedData.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encrypted = textParts.join(':');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed:', error);
      return encryptedData;
    }
  }

  private getEmptyDatabase(): Database {
    return {
      tokens: [],
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        encryptionEnabled: true
      }
    };
  }

  private isCacheValid(): boolean {
    return this.cache !== null && (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
  }

  /**
   * Load database from storage
   */
  private async loadDatabase(): Promise<Database> {
    // Return cached version if valid
    if (this.isCacheValid() && this.cache) {
      return this.cache;
    }

    try {
      await this.ensureDataDir();
      
      // Try to load from file first
      try {
        const encryptedData = await fs.readFile(this.dbPath, 'utf-8');
        const decryptedData = this.decrypt(encryptedData);
        const database: Database = JSON.parse(decryptedData);
        
        // Update cache
        this.cache = database;
        this.cacheTimestamp = Date.now();
        
        console.log('SimpleDatabase: Loaded from file with', database.tokens.length, 'tokens');
        return database;
      } catch (fileError) {
        console.log('Database file not found, checking environment variable...');
        
        // Fallback to environment variable for Vercel
        const envData = process.env.DATABASE_JSON;
        if (envData) {
          const decryptedData = this.decrypt(envData);
          const database: Database = JSON.parse(decryptedData);
          
          // Update cache
          this.cache = database;
          this.cacheTimestamp = Date.now();
          
          console.log('SimpleDatabase: Loaded from environment with', database.tokens.length, 'tokens');
          return database;
        }
        
        console.log('No database found, creating empty database');
        const emptyDb = this.getEmptyDatabase();
        
        // Update cache
        this.cache = emptyDb;
        this.cacheTimestamp = Date.now();
        
        return emptyDb;
      }
    } catch (error) {
      console.error('SimpleDatabase: Failed to load database:', error);
      const emptyDb = this.getEmptyDatabase();
      
      // Update cache with empty database
      this.cache = emptyDb;
      this.cacheTimestamp = Date.now();
      
      return emptyDb;
    }
  }

  /**
   * Save database to storage
   */
  private async saveDatabase(database: Database): Promise<void> {
    try {
      // Update metadata
      database.metadata.lastUpdated = new Date().toISOString();
      
      // Encrypt and save
      const dataToStore = JSON.stringify(database, null, 2);
      const encryptedData = this.encrypt(dataToStore);
      
      // Try to save to file first
      try {
        await this.ensureDataDir();
        await fs.writeFile(this.dbPath, encryptedData);
        console.log('SimpleDatabase: Saved to file with', database.tokens.length, 'tokens');
      } catch (fileError) {
        console.warn('Could not save to file, using environment fallback');
        
        // Store in process environment for current session
        process.env.DATABASE_JSON = encryptedData;
        console.log('SimpleDatabase: Saved to environment with', database.tokens.length, 'tokens');
      }
      
      // Update cache
      this.cache = database;
      this.cacheTimestamp = Date.now();
      
    } catch (error) {
      console.error('SimpleDatabase: Failed to save database:', error);
      throw new Error(`Failed to save database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all tokens from database
   */
  async getTokens(): Promise<TokenRecord[]> {
    const database = await this.loadDatabase();
    return database.tokens || [];
  }

  /**
   * Add a new token to database
   */
  async addToken(token: TokenRecord): Promise<void> {
    const database = await this.loadDatabase();
    
    // Check if token with same ID already exists
    const existingIndex = database.tokens.findIndex(t => t.id === token.id);
    if (existingIndex !== -1) {
      throw new Error(`Token with ID ${token.id} already exists`);
    }
    
    database.tokens.push(token);
    await this.saveDatabase(database);
  }

  /**
   * Update an existing token
   */
  async updateToken(id: string, updates: Partial<TokenRecord>): Promise<void> {
    const database = await this.loadDatabase();
    const tokenIndex = database.tokens.findIndex(t => t.id === id);
    
    if (tokenIndex === -1) {
      throw new Error(`Token with ID ${id} not found`);
    }
    
    database.tokens[tokenIndex] = { 
      ...database.tokens[tokenIndex], 
      ...updates 
    };
    
    await this.saveDatabase(database);
  }

  /**
   * Delete a token from database
   */
  async deleteToken(id: string): Promise<void> {
    const database = await this.loadDatabase();
    const initialLength = database.tokens.length;
    
    database.tokens = database.tokens.filter(t => t.id !== id);
    
    if (database.tokens.length === initialLength) {
      throw new Error(`Token with ID ${id} not found`);
    }
    
    await this.saveDatabase(database);
  }

  /**
   * Find a token by hash
   */
  async findTokenByHash(tokenHash: string): Promise<TokenRecord | null> {
    const database = await this.loadDatabase();
    const token = database.tokens.find(t => 
      t.tokenHash === tokenHash && 
      t.status === 'active' &&
      (!t.expiresAt || new Date(t.expiresAt) > new Date())
    );
    
    return token || null;
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const database = await this.loadDatabase();
    const now = new Date();
    const initialLength = database.tokens.length;
    
    database.tokens = database.tokens.filter(token => 
      !token.expiresAt || new Date(token.expiresAt) > now
    );
    
    const cleanedCount = initialLength - database.tokens.length;
    
    if (cleanedCount > 0) {
      await this.saveDatabase(database);
      console.log(`Cleaned up ${cleanedCount} expired tokens`);
    }
    
    return cleanedCount;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    lastUpdated: string;
  }> {
    const database = await this.loadDatabase();
    const now = new Date();
    
    const activeTokens = database.tokens.filter(t => 
      t.status === 'active' && (!t.expiresAt || new Date(t.expiresAt) > now)
    ).length;
    
    const expiredTokens = database.tokens.filter(t => 
      t.expiresAt && new Date(t.expiresAt) <= now
    ).length;
    
    return {
      totalTokens: database.tokens.length,
      activeTokens,
      expiredTokens,
      lastUpdated: database.metadata.lastUpdated
    };
  }

  /**
   * Hash a token for secure storage
   */
  hashToken(plainToken: string): string {
    return crypto.createHash('sha256')
                 .update(plainToken + this.encryptionKey)
                 .digest('hex');
  }

  /**
   * Get database connection info
   */
  getConnectionInfo(): {
    type: string;
    path: string;
    encrypted: boolean;
    cached: boolean;
  } {
    return {
      type: 'SimpleJsonDatabase',
      path: this.dbPath,
      encrypted: true,
      cached: this.isCacheValid()
    };
  }
}

// Export singleton instance
export const db = new SimpleDatabase();

// Export the class for custom instances if needed
export { SimpleDatabase };