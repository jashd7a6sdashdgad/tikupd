import { promises as fs } from 'fs';
import path from 'path';

export interface UniversalDataItem {
  id: string;
  type: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface UniversalStorage {
  loadData(type: string): Promise<UniversalDataItem[]>;
  saveData(type: string, items: UniversalDataItem[]): Promise<void>;
  addItem(type: string, data: Record<string, any>): Promise<UniversalDataItem>;
  updateItem(type: string, id: string, updates: Record<string, any>): Promise<UniversalDataItem | null>;
  deleteItem(type: string, id: string): Promise<boolean>;
  getAllTypes(): Promise<string[]>;
}

// Local file-based storage for universal data
export class LocalUniversalStorage implements UniversalStorage {
  private readonly basePath: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'universal');
  }

  private async ensureDataDir(): Promise<void> {
    try {
      console.log('LocalUniversalStorage: Checking data directory:', this.basePath);
      
      try {
        await fs.access(this.basePath);
      } catch {
        console.log('LocalUniversalStorage: Creating data directory:', this.basePath);
        await fs.mkdir(this.basePath, { recursive: true });
      }
    } catch (error) {
      console.error('LocalUniversalStorage: Failed to ensure data directory:', error);
      throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getFilePath(type: string): string {
    return path.join(this.basePath, `${type}.json`);
  }

  async loadData(type: string): Promise<UniversalDataItem[]> {
    try {
      const filePath = this.getFilePath(type);
      console.log(`LocalUniversalStorage: Loading ${type} data from:`, filePath);
      await this.ensureDataDir();
      
      const data = await fs.readFile(filePath, 'utf-8');
      console.log(`LocalUniversalStorage: File read successfully for ${type}, size:`, data.length);
      
      const items = JSON.parse(data);
      console.log(`LocalUniversalStorage: Parsed ${type} items count:`, items.length);
      
      return this.validateItems(items);
    } catch (error) {
      console.warn(`LocalUniversalStorage: Failed to load ${type} data, returning sample data:`, error);
      return this.getSampleData(type);
    }
  }

  async saveData(type: string, items: UniversalDataItem[]): Promise<void> {
    try {
      await this.ensureDataDir();
      const validItems = this.validateItems(items);
      const filePath = this.getFilePath(type);
      console.log(`LocalUniversalStorage: Saving ${validItems.length} ${type} items to ${filePath}`);
      await fs.writeFile(filePath, JSON.stringify(validItems, null, 2));
      console.log(`LocalUniversalStorage: ${type} data saved successfully`);
    } catch (error) {
      console.error(`LocalUniversalStorage: Failed to save ${type} data:`, error);
      throw new Error(`Failed to save ${type} data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addItem(type: string, data: Record<string, any>): Promise<UniversalDataItem> {
    const items = await this.loadData(type);
    
    const newItem: UniversalDataItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    items.push(newItem);
    await this.saveData(type, items);
    
    return newItem;
  }

  async updateItem(type: string, id: string, updates: Record<string, any>): Promise<UniversalDataItem | null> {
    const items = await this.loadData(type);
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return null;
    }
    
    items[itemIndex] = {
      ...items[itemIndex],
      data: { ...items[itemIndex].data, ...updates },
      updatedAt: new Date().toISOString()
    };
    
    await this.saveData(type, items);
    return items[itemIndex];
  }

  async deleteItem(type: string, id: string): Promise<boolean> {
    const items = await this.loadData(type);
    const initialLength = items.length;
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === initialLength) {
      return false; // No item was deleted
    }
    
    await this.saveData(type, filteredItems);
    return true;
  }

  async getAllTypes(): Promise<string[]> {
    try {
      await this.ensureDataDir();
      const files = await fs.readdir(this.basePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.warn('LocalUniversalStorage: Failed to get all types:', error);
      return [];
    }
  }

  private validateItems(items: any[]): UniversalDataItem[] {
    return items.filter((item: any) => {
      return item && 
             typeof item.id === 'string' && 
             typeof item.type === 'string' && 
             typeof item.data === 'object' &&
             typeof item.createdAt === 'string';
    });
  }

  private getSampleData(type: string): UniversalDataItem[] {
    const sampleData: Record<string, UniversalDataItem[]> = {
      expenses: [
        {
          id: 'sample-exp-1',
          type: 'expenses',
          data: {
            amount: 25.50,
            category: 'food',
            description: 'Lunch at restaurant',
            date: '2025-08-10',
            merchant: 'Local Restaurant'
          },
          createdAt: new Date().toISOString()
        },
        {
          id: 'sample-exp-2',
          type: 'expenses',
          data: {
            amount: 15.00,
            category: 'transportation',
            description: 'Bus fare',
            date: '2025-08-10',
            merchant: 'City Transit'
          },
          createdAt: new Date().toISOString()
        }
      ],
      contacts: [
        {
          id: 'sample-contact-1',
          type: 'contacts',
          data: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1-555-0123',
            company: 'Tech Corp'
          },
          createdAt: new Date().toISOString()
        }
      ],
      diary: [
        {
          id: 'sample-diary-1',
          type: 'diary',
          data: {
            title: 'Today was a good day',
            content: 'Had a productive meeting and completed several tasks.',
            mood: 'happy',
            tags: ['work', 'productive']
          },
          createdAt: new Date().toISOString()
        }
      ],
      calendar: [
        {
          id: 'sample-event-1',
          type: 'calendar',
          data: {
            title: 'Team Meeting',
            description: 'Weekly team sync',
            startTime: '2025-08-11T10:00:00.000Z',
            endTime: '2025-08-11T11:00:00.000Z',
            location: 'Conference Room A'
          },
          createdAt: new Date().toISOString()
        }
      ],
      analytics: [
        {
          id: 'sample-analytics-1',
          type: 'analytics',
          data: {
            metric: 'page_views',
            value: 1250,
            date: '2025-08-10',
            source: 'google_analytics'
          },
          createdAt: new Date().toISOString()
        }
      ],
      emails: [
        {
          id: 'sample-email-1',
          type: 'emails',
          data: {
            subject: 'Project Update',
            from: 'manager@company.com',
            to: 'user@company.com',
            body: 'Here is the latest project update...',
            read: false,
            important: true
          },
          createdAt: new Date().toISOString()
        }
      ],
      tasks: [
        {
          id: 'sample-task-1',
          type: 'tasks',
          data: {
            title: 'Complete API documentation',
            description: 'Write comprehensive API docs for the new endpoints',
            status: 'pending',
            priority: 'high',
            dueDate: '2025-08-15'
          },
          createdAt: new Date().toISOString()
        }
      ],
      settings: [
        {
          id: 'sample-setting-1',
          type: 'settings',
          data: {
            key: 'theme',
            value: 'dark',
            category: 'appearance'
          },
          createdAt: new Date().toISOString()
        }
      ]
    };

    return sampleData[type] || [];
  }
}

// In-memory storage (for when file system isn't available)
export class InMemoryUniversalStorage implements UniversalStorage {
  private data: Map<string, UniversalDataItem[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    if (!this.initialized) {
      // Initialize with sample data for all major page types
      const sampleTypes = ['expenses', 'contacts', 'diary', 'calendar', 'analytics', 'emails', 'tasks', 'settings'];
      
      sampleTypes.forEach(type => {
        this.data.set(type, this.getSampleDataForType(type));
      });
      
      this.initialized = true;
      console.log('InMemoryUniversalStorage: Initialized with sample data for', sampleTypes.length, 'types');
    }
  }

  async loadData(type: string): Promise<UniversalDataItem[]> {
    if (!this.data.has(type)) {
      this.data.set(type, []);
    }
    
    const items = this.data.get(type) || [];
    console.log(`InMemoryUniversalStorage: Loaded ${items.length} ${type} items`);
    return [...items];
  }

  async saveData(type: string, items: UniversalDataItem[]): Promise<void> {
    console.log(`InMemoryUniversalStorage: Saving ${items.length} ${type} items`);
    this.data.set(type, [...items]);
  }

  async addItem(type: string, data: Record<string, any>): Promise<UniversalDataItem> {
    const items = await this.loadData(type);
    
    const newItem: UniversalDataItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    items.push(newItem);
    await this.saveData(type, items);
    
    return newItem;
  }

  async updateItem(type: string, id: string, updates: Record<string, any>): Promise<UniversalDataItem | null> {
    const items = await this.loadData(type);
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return null;
    }
    
    items[itemIndex] = {
      ...items[itemIndex],
      data: { ...items[itemIndex].data, ...updates },
      updatedAt: new Date().toISOString()
    };
    
    await this.saveData(type, items);
    return items[itemIndex];
  }

  async deleteItem(type: string, id: string): Promise<boolean> {
    const items = await this.loadData(type);
    const initialLength = items.length;
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length < initialLength) {
      await this.saveData(type, filteredItems);
      return true;
    }
    
    return false;
  }

  async getAllTypes(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  private getSampleDataForType(type: string): UniversalDataItem[] {
    const baseData = {
      expenses: { amount: 25.50, category: 'food', description: 'Sample expense', date: '2025-08-10' },
      contacts: { name: 'Sample Contact', email: 'contact@example.com', phone: '+1-555-0123' },
      diary: { title: 'Sample Entry', content: 'Sample diary content', mood: 'neutral' },
      calendar: { title: 'Sample Event', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
      analytics: { metric: 'sample_metric', value: 100, date: '2025-08-10' },
      emails: { subject: 'Sample Email', from: 'test@example.com', body: 'Sample content' },
      tasks: { title: 'Sample Task', status: 'pending', priority: 'medium' },
      settings: { key: 'sample_setting', value: 'sample_value' }
    };

    const data = baseData[type as keyof typeof baseData] || { title: 'Sample Item' };

    return [
      {
        id: `sample-${type}-1`,
        type,
        data,
        createdAt: new Date().toISOString()
      }
    ];
  }
}

// Hybrid storage that automatically chooses the best option
export class HybridUniversalStorage implements UniversalStorage {
  private storage: UniversalStorage;

  constructor() {
    console.log('HybridUniversalStorage: Initializing...');
    
    // Use local file storage for development, in-memory for production
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      console.log('Using in-memory universal storage (production)');
      this.storage = new InMemoryUniversalStorage();
    } else {
      console.log('Using local file universal storage (development)');
      this.storage = new LocalUniversalStorage();
    }
  }

  async loadData(type: string): Promise<UniversalDataItem[]> {
    return this.storage.loadData(type);
  }

  async saveData(type: string, items: UniversalDataItem[]): Promise<void> {
    return this.storage.saveData(type, items);
  }

  async addItem(type: string, data: Record<string, any>): Promise<UniversalDataItem> {
    return this.storage.addItem(type, data);
  }

  async updateItem(type: string, id: string, updates: Record<string, any>): Promise<UniversalDataItem | null> {
    return this.storage.updateItem(type, id, updates);
  }

  async deleteItem(type: string, id: string): Promise<boolean> {
    return this.storage.deleteItem(type, id);
  }

  async getAllTypes(): Promise<string[]> {
    return this.storage.getAllTypes();
  }

  getStorageType(): string {
    if (this.storage instanceof LocalUniversalStorage) return 'Local File';
    if (this.storage instanceof InMemoryUniversalStorage) return 'In-Memory';
    return 'Unknown';
  }
}

// Export the default storage instance
export const universalStorage = new HybridUniversalStorage();