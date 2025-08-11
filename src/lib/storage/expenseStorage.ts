import { promises as fs } from 'fs';
import path from 'path';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  merchant?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseStorage {
  loadExpenses(): Promise<Expense[]>;
  saveExpenses(expenses: Expense[]): Promise<void>;
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null>;
  deleteExpense(id: string): Promise<boolean>;
}

// Local file-based storage for expenses
export class LocalExpenseStorage implements ExpenseStorage {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'expenses.json');
  }

  private async ensureDataDir(): Promise<void> {
    try {
      const dataDir = path.dirname(this.filePath);
      console.log('LocalExpenseStorage: Checking data directory:', dataDir);
      
      try {
        await fs.access(dataDir);
      } catch {
        console.log('LocalExpenseStorage: Creating data directory:', dataDir);
        await fs.mkdir(dataDir, { recursive: true });
      }
    } catch (error) {
      console.error('LocalExpenseStorage: Failed to ensure data directory:', error);
      throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadExpenses(): Promise<Expense[]> {
    try {
      console.log('LocalExpenseStorage: Loading expenses from:', this.filePath);
      await this.ensureDataDir();
      
      const data = await fs.readFile(this.filePath, 'utf-8');
      console.log('LocalExpenseStorage: File read successfully, size:', data.length);
      
      const expenses = JSON.parse(data);
      console.log('LocalExpenseStorage: Parsed expenses count:', expenses.length);
      
      return this.validateExpenses(expenses);
    } catch (error) {
      console.warn('LocalExpenseStorage: Failed to load expenses, returning sample data:', error);
      return this.getSampleExpenses();
    }
  }

  async saveExpenses(expenses: Expense[]): Promise<void> {
    try {
      await this.ensureDataDir();
      const validExpenses = this.validateExpenses(expenses);
      console.log(`LocalExpenseStorage: Saving ${validExpenses.length} expenses to ${this.filePath}`);
      await fs.writeFile(this.filePath, JSON.stringify(validExpenses, null, 2));
      console.log('LocalExpenseStorage: Expenses saved successfully');
    } catch (error) {
      console.error('LocalExpenseStorage: Failed to save expenses:', error);
      throw new Error(`Failed to save expenses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const expenses = await this.loadExpenses();
    
    const newExpense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    expenses.push(newExpense);
    await this.saveExpenses(expenses);
    
    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const expenses = await this.loadExpenses();
    const expenseIndex = expenses.findIndex(expense => expense.id === id);
    
    if (expenseIndex === -1) {
      return null;
    }
    
    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.saveExpenses(expenses);
    return expenses[expenseIndex];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const expenses = await this.loadExpenses();
    const initialLength = expenses.length;
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    
    if (filteredExpenses.length === initialLength) {
      return false; // No expense was deleted
    }
    
    await this.saveExpenses(filteredExpenses);
    return true;
  }

  private validateExpenses(expenses: any[]): Expense[] {
    return expenses.filter((expense: any) => {
      return expense && 
             typeof expense.id === 'string' && 
             typeof expense.amount === 'number' && 
             typeof expense.category === 'string' && 
             typeof expense.description === 'string' &&
             typeof expense.date === 'string' &&
             typeof expense.createdAt === 'string';
    });
  }

  private getSampleExpenses(): Expense[] {
    return [
      {
        id: 'sample-1',
        amount: 25.50,
        category: 'food',
        description: 'Lunch at restaurant',
        date: '2025-08-10',
        merchant: 'Local Restaurant',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sample-2',
        amount: 15.00,
        category: 'transportation',
        description: 'Bus fare',
        date: '2025-08-10',
        merchant: 'City Transit',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sample-3',
        amount: 89.99,
        category: 'shopping',
        description: 'New headphones',
        date: '2025-08-09',
        merchant: 'Electronics Store',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

// In-memory storage (for when file system isn't available)
export class InMemoryExpenseStorage implements ExpenseStorage {
  private expenses: Expense[] = [];
  private initialized = false;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    if (!this.initialized) {
      this.expenses = [
        {
          id: 'memory-1',
          amount: 25.50,
          category: 'food',
          description: 'Lunch at restaurant',
          date: '2025-08-10',
          merchant: 'Local Restaurant',
          createdAt: new Date().toISOString()
        },
        {
          id: 'memory-2',
          amount: 15.00,
          category: 'transportation',
          description: 'Bus fare',
          date: '2025-08-10',
          merchant: 'City Transit',
          createdAt: new Date().toISOString()
        },
        {
          id: 'memory-3',
          amount: 89.99,
          category: 'shopping',
          description: 'New headphones',
          date: '2025-08-09',
          merchant: 'Electronics Store',
          createdAt: new Date().toISOString()
        }
      ];
      this.initialized = true;
    }
  }

  async loadExpenses(): Promise<Expense[]> {
    console.log(`InMemoryExpenseStorage: Loaded ${this.expenses.length} expenses`);
    return [...this.expenses];
  }

  async saveExpenses(expenses: Expense[]): Promise<void> {
    console.log(`InMemoryExpenseStorage: Saving ${expenses.length} expenses`);
    this.expenses = [...expenses];
  }

  async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const newExpense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.expenses.push(newExpense);
    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const expenseIndex = this.expenses.findIndex(expense => expense.id === id);
    
    if (expenseIndex === -1) {
      return null;
    }
    
    this.expenses[expenseIndex] = {
      ...this.expenses[expenseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.expenses[expenseIndex];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const initialLength = this.expenses.length;
    this.expenses = this.expenses.filter(expense => expense.id !== id);
    return this.expenses.length < initialLength;
  }
}

// Hybrid storage that automatically chooses the best option
export class HybridExpenseStorage implements ExpenseStorage {
  private storage: ExpenseStorage;

  constructor() {
    console.log('HybridExpenseStorage: Initializing...');
    
    // Use persistent storage for both development and production
    // In production, we want to access the real expense data, not in-memory sample data
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      console.log('Using local file expense storage (production) - accessing real website data');
      this.storage = new LocalExpenseStorage();
    } else {
      console.log('Using local file expense storage (development)');
      this.storage = new LocalExpenseStorage();
    }
  }

  async loadExpenses(): Promise<Expense[]> {
    return this.storage.loadExpenses();
  }

  async saveExpenses(expenses: Expense[]): Promise<void> {
    return this.storage.saveExpenses(expenses);
  }

  async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return this.storage.addExpense(expenseData);
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    return this.storage.updateExpense(id, updates);
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.storage.deleteExpense(id);
  }

  getStorageType(): string {
    if (this.storage instanceof LocalExpenseStorage) return 'Local File';
    if (this.storage instanceof InMemoryExpenseStorage) return 'In-Memory';
    return 'Unknown';
  }
}

// Export the default storage instance
export const expenseStorage = new HybridExpenseStorage();