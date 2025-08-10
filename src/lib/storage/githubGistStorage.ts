import { TokenStorage, ApiToken } from './tokenStorage';

interface GitHubGistFile {
  content: string;
  filename: string;
}

interface GitHubGist {
  id: string;
  files: Record<string, GitHubGistFile>;
  description: string;
  public: boolean;
}

export class GitHubGistTokenStorage implements TokenStorage {
  private readonly gistId: string | null;
  private readonly githubToken: string | null;
  private readonly gistDescription: string = 'Mahboob Personal Assistant - API Tokens';
  private readonly filename: string = 'tokens.json';

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || null;
    this.gistId = process.env.GITHUB_GIST_ID || null;
    
    console.log('GitHubGistTokenStorage: Initialized with:', {
      hasGithubToken: !!this.githubToken,
      hasGistId: !!this.gistId,
      gistDescription: this.gistDescription,
      filename: this.filename
    });
  }

  private async createGist(): Promise<string> {
    if (!this.githubToken) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: this.gistDescription,
          public: false, // Private gist for security
          files: {
            [this.filename]: {
              content: JSON.stringify([], null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create GitHub gist: ${response.status} ${error}`);
      }

      const gist: GitHubGist = await response.json();
      console.log('GitHubGistTokenStorage: Created new gist with ID:', gist.id);
      
      // Store the gist ID for future use
      console.log('GitHubGistTokenStorage: Please set GITHUB_GIST_ID environment variable to:', gist.id);
      
      return gist.id;
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to create gist:', error);
      throw new Error(`Failed to create GitHub gist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateGist(gistId: string, content: string): Promise<void> {
    if (!this.githubToken) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: this.gistDescription,
          files: {
            [this.filename]: {
              content: content
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update GitHub gist: ${response.status} ${error}`);
      }

      console.log('GitHubGistTokenStorage: Gist updated successfully');
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to update gist:', error);
      throw new Error(`Failed to update GitHub gist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getGist(gistId: string): Promise<GitHubGist> {
    if (!this.githubToken) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch GitHub gist: ${response.status} ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to fetch gist:', error);
      throw new Error(`Failed to fetch GitHub gist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadTokens(): Promise<ApiToken[]> {
    try {
      let gistId = this.gistId;
      
      // If no gist ID exists, create one
      if (!gistId) {
        console.log('GitHubGistTokenStorage: No gist ID found, creating new gist...');
        gistId = await this.createGist();
        // Note: We can't use the new gist ID immediately since we don't have it stored
        // The user will need to set the environment variable and restart
        throw new Error('New gist created. Please set GITHUB_GIST_ID environment variable and restart the application.');
      }

      console.log('GitHubGistTokenStorage: Loading tokens from gist:', gistId);
      const gist = await this.getGist(gistId);
      
      const file = gist.files[this.filename];
      if (!file) {
        console.log('GitHubGistTokenStorage: No tokens file found in gist, returning empty array');
        return [];
      }

      const tokens = JSON.parse(file.content);
      console.log('GitHubGistTokenStorage: Loaded tokens count:', tokens.length);
      
      // Validate and filter tokens
      const validTokens = this.validateTokens(tokens);
      console.log('GitHubGistTokenStorage: Valid tokens count:', validTokens.length);
      
      return validTokens;
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to load tokens:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  async saveTokens(tokens: ApiToken[]): Promise<void> {
    try {
      let gistId = this.gistId;
      
      // If no gist ID exists, create one
      if (!gistId) {
        console.log('GitHubGistTokenStorage: No gist ID found, creating new gist...');
        gistId = await this.createGist();
        throw new Error('New gist created. Please set GITHUB_GIST_ID environment variable and restart the application.');
      }

      const validTokens = this.validateTokens(tokens);
      const content = JSON.stringify(validTokens, null, 2);
      
      console.log(`GitHubGistTokenStorage: Saving ${validTokens.length} tokens to gist:`, gistId);
      await this.updateGist(gistId, content);
      console.log('GitHubGistTokenStorage: Tokens saved successfully to GitHub gist');
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to save tokens:', error);
      throw new Error(`Failed to save tokens to GitHub gist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private validateTokens(tokens: any[]): ApiToken[] {
    if (!Array.isArray(tokens)) {
      console.warn('GitHubGistTokenStorage: Invalid tokens format, expected array');
      return [];
    }

    return tokens.filter(token => {
      if (!token || typeof token !== 'object') return false;
      if (!token.id || !token.token || !token.name) return false;
      if (!Array.isArray(token.permissions)) return false;
      return true;
    });
  }

  /**
   * Check if this storage is available
   */
  isAvailable(): boolean {
    return !!(this.githubToken && this.gistId);
  }

  async deleteToken(id: string): Promise<void> {
    try {
      const tokens = await this.loadTokens();
      const filteredTokens = tokens.filter(token => token.id !== id);
      await this.saveTokens(filteredTokens);
      console.log('GitHubGistTokenStorage: Token deleted successfully');
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to delete token:', error);
      throw new Error(`Failed to delete token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateToken(id: string, updates: Partial<ApiToken>): Promise<void> {
    try {
      const tokens = await this.loadTokens();
      const tokenIndex = tokens.findIndex(token => token.id === id);
      if (tokenIndex !== -1) {
        tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates };
        await this.saveTokens(tokens);
        console.log('GitHubGistTokenStorage: Token updated successfully');
      } else {
        throw new Error(`Token with id ${id} not found`);
      }
    } catch (error) {
      console.error('GitHubGistTokenStorage: Failed to update token:', error);
      throw new Error(`Failed to update token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get storage information
   */
  getStorageInfo(): { type: string; status: string; details: string } {
    return {
      type: 'github-gist',
      status: this.isAvailable() ? 'available' : 'unavailable',
      details: this.isAvailable() 
        ? `Using GitHub gist: ${this.gistId}`
        : `Missing GITHUB_TOKEN or GITHUB_GIST_ID environment variables`
    };
  }
} 