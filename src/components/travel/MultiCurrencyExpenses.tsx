'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Camera,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calculator,
  RefreshCw,
  Download,
  Upload,
  CreditCard,
  Banknote,
  Smartphone,
  PieChart,
  BarChart3,
  Calendar,
  MapPin,
  Filter,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Coins,
  ExchangeIcon
} from 'lucide-react';

interface TravelExpense {
  id: string;
  itineraryId?: string;
  category: 'accommodation' | 'transport' | 'food' | 'activities' | 'shopping' | 'other';
  subcategory?: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  exchangeRate: number;
  description: string;
  date: Date;
  location: string;
  paymentMethod: 'cash' | 'card' | 'digital' | 'other';
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  merchantName?: string;
  cardLast4?: string;
}

interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate to base currency
  flag?: string;
}

interface BudgetAlert {
  id: string;
  category: string;
  threshold: number;
  spent: number;
  currency: string;
  type: 'warning' | 'exceeded';
}

const categoryIcons = {
  accommodation: '🏨',
  transport: '✈️',
  food: '🍽️',
  activities: '🎭',
  shopping: '🛍️',
  other: '📝'
};

const categoryColors = {
  accommodation: 'bg-blue-100 text-blue-800 border-blue-200',
  transport: 'bg-green-100 text-green-800 border-green-200',
  food: 'bg-orange-100 text-orange-800 border-orange-200',
  activities: 'bg-purple-100 text-purple-800 border-purple-200',
  shopping: 'bg-pink-100 text-pink-800 border-pink-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  digital: Smartphone,
  other: Wallet
};

interface MultiCurrencyExpensesProps {
  itineraryId?: string;
  baseCurrency?: string;
}

export function MultiCurrencyExpenses({ itineraryId, baseCurrency = 'OMR' }: MultiCurrencyExpensesProps) {
  const [expenses, setExpenses] = useState<TravelExpense[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  // Form state
  const [formData, setFormData] = useState({
    category: 'other' as TravelExpense['category'],
    amount: '',
    currency: baseCurrency,
    description: '',
    location: '',
    paymentMethod: 'card' as TravelExpense['paymentMethod'],
    notes: '',
    merchantName: ''
  });

  useEffect(() => {
    // Initialize with sample currencies
    const sampleCurrencies: CurrencyRate[] = [
      { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', rate: 1, flag: '🇴🇲' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.385, flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.357, flag: '🇪🇺' },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.312, flag: '🇬🇧' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 1.43, flag: '🇦🇪' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', rate: 1.45, flag: '🇸🇦' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 0.0036, flag: '🇯🇵' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 0.046, flag: '🇮🇳' }
    ];
    setCurrencies(sampleCurrencies);

    // Sample expenses
    const sampleExpenses: TravelExpense[] = [
      {
        id: '1',
        itineraryId: itineraryId || '1',
        category: 'accommodation',
        amount: 120,
        currency: 'USD',
        convertedAmount: 46.2,
        baseCurrency: 'OMR',
        exchangeRate: 0.385,
        description: 'Hotel Marina Bay - 2 nights',
        date: new Date('2024-12-15'),
        location: 'Dubai Marina',
        paymentMethod: 'card',
        merchantName: 'Marina Bay Hotel',
        cardLast4: '1234',
        tags: ['accommodation', 'luxury']
      },
      {
        id: '2',
        itineraryId: itineraryId || '1',
        category: 'food',
        amount: 45,
        currency: 'AED',
        convertedAmount: 12.31,
        baseCurrency: 'OMR',
        exchangeRate: 1.43,
        description: 'Dinner at Burj Al Arab',
        date: new Date('2024-12-16'),
        location: 'Burj Al Arab, Dubai',
        paymentMethod: 'card',
        merchantName: 'Al Muntaha Restaurant',
        tags: ['fine-dining', 'special-occasion']
      },
      {
        id: '3',
        itineraryId: itineraryId || '1',
        category: 'transport',
        amount: 25,
        currency: 'AED',
        convertedAmount: 6.84,
        baseCurrency: 'OMR',
        exchangeRate: 1.43,
        description: 'Taxi to Dubai Mall',
        date: new Date('2024-12-16'),
        location: 'Dubai',
        paymentMethod: 'cash',
        tags: ['taxi', 'sightseeing']
      },
      {
        id: '4',
        itineraryId: itineraryId || '1',
        category: 'shopping',
        amount: 200,
        currency: 'AED',
        convertedAmount: 54.75,
        baseCurrency: 'OMR',
        exchangeRate: 1.43,
        description: 'Souvenirs and gifts',
        date: new Date('2024-12-17'),
        location: 'Gold Souk, Dubai',
        paymentMethod: 'card',
        merchantName: 'Gold Souk Traders',
        tags: ['gifts', 'souvenirs', 'gold']
      }
    ];

    setExpenses(sampleExpenses);

    // Generate budget alerts
    const alerts: BudgetAlert[] = [
      {
        id: '1',
        category: 'food',
        threshold: 50,
        spent: 45.2,
        currency: 'OMR',
        type: 'warning'
      }
    ];
    setBudgetAlerts(alerts);
  }, [itineraryId, baseCurrency]);

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesCurrency = selectedCurrency === 'all' || expense.currency === selectedCurrency;
    const matchesSearch = searchQuery === '' || 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.merchantName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesCurrency && matchesSearch;
  });

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
    return (amount / fromRate) * toRate;
  };

  const getTotalByCategory = () => {
    const totals: Record<string, number> = {};
    expenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.convertedAmount;
    });
    return totals;
  };

  const getTotalSpent = (): number => {
    return expenses.reduce((total, expense) => total + expense.convertedAmount, 0);
  };

  const handleAddExpense = () => {
    const newExpense: TravelExpense = {
      id: Date.now().toString(),
      itineraryId: itineraryId || '1',
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      convertedAmount: convertCurrency(parseFloat(formData.amount), formData.currency, baseCurrency),
      baseCurrency,
      exchangeRate: currencies.find(c => c.code === formData.currency)?.rate || 1,
      description: formData.description,
      date: new Date(),
      location: formData.location,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      merchantName: formData.merchantName,
      tags: []
    };

    setExpenses(prev => [...prev, newExpense]);
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: 'other',
      amount: '',
      currency: baseCurrency,
      description: '',
      location: '',
      paymentMethod: 'card',
      notes: '',
      merchantName: ''
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };

  const refreshExchangeRates = () => {
    // Mock refresh - in real app, fetch from API
    console.log('Refreshing exchange rates...');
    // Update exchange rates and recalculate converted amounts
  };

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-xl border ${alert.type === 'exceeded' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${alert.type === 'exceeded' ? 'text-red-600' : 'text-yellow-600'}`} />
                <div>
                  <p className={`font-semibold ${alert.type === 'exceeded' ? 'text-red-800' : 'text-yellow-800'}`}>
                    Budget Alert: {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                  </p>
                  <p className={`text-sm ${alert.type === 'exceeded' ? 'text-red-700' : 'text-yellow-700'}`}>
                    Spent {getCurrencySymbol(alert.currency)}{alert.spent.toFixed(2)} of {getCurrencySymbol(alert.currency)}{alert.threshold} budget
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-2 border-white/30"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="accommodation">🏨 Accommodation</SelectItem>
              <SelectItem value="transport">✈️ Transport</SelectItem>
              <SelectItem value="food">🍽️ Food & Dining</SelectItem>
              <SelectItem value="activities">🎭 Activities</SelectItem>
              <SelectItem value="shopping">🛍️ Shopping</SelectItem>
              <SelectItem value="other">📝 Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {currencies.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
              className="bg-white/60 hover:bg-white/80"
            >
              {viewMode === 'list' ? <PieChart className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshExchangeRates}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Rates
          </Button>
          
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-black font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-green-800">
                  {getCurrencySymbol(baseCurrency)}{getTotalSpent().toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-xl">
                <Wallet className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Transactions</p>
                <p className="text-2xl font-bold text-blue-800">{expenses.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl">
                <Receipt className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Currencies</p>
                <p className="text-2xl font-bold text-purple-800">
                  {new Set(expenses.map(e => e.currency)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-xl">
                <Coins className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg/Day</p>
                <p className="text-2xl font-bold text-orange-800">
                  {getCurrencySymbol(baseCurrency)}{expenses.length > 0 ? (getTotalSpent() / Math.max(new Set(expenses.map(e => e.date.toDateString())).size, 1)).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800">Travel Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredExpenses.map(expense => {
            const PaymentIcon = paymentIcons[expense.paymentMethod];
            
            return (
              <div key={expense.id} className="p-4 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{categoryIcons[expense.category]}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{expense.description}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {expense.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {expense.date.toLocaleDateString()}
                        </span>
                        {expense.merchantName && (
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            {expense.merchantName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={categoryColors[expense.category]}>
                        {expense.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-500">
                        <PaymentIcon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-800">
                        {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                      </p>
                      {expense.currency !== baseCurrency && (
                        <p className="text-sm text-gray-600">
                          ≈ {getCurrencySymbol(baseCurrency)}{expense.convertedAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    {expense.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs bg-gray-50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Expenses Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory !== 'all' || selectedCurrency !== 'all' 
                  ? 'No expenses match your current filters.' 
                  : 'Start tracking your travel expenses.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl text-gray-800">Add New Expense</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accommodation">🏨 Accommodation</SelectItem>
                      <SelectItem value="transport">✈️ Transport</SelectItem>
                      <SelectItem value="food">🍽️ Food & Dining</SelectItem>
                      <SelectItem value="activities">🎭 Activities</SelectItem>
                      <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                      <SelectItem value="other">📝 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="digital">📱 Digital Wallet</SelectItem>
                      <SelectItem value="other">💼 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Lunch at restaurant, Hotel booking, etc."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Dubai Mall, Tokyo"
                  />
                </div>
                
                <div>
                  <Label>Merchant Name (Optional)</Label>
                  <Input
                    value={formData.merchantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, merchantName: e.target.value }))}
                    placeholder="e.g., Restaurant name, Store name"
                  />
                </div>
              </div>
              
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this expense"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-black font-bold"
                  disabled={!formData.amount || !formData.description}
                >
                  Add Expense
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}