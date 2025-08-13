'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { getBusinessConfig, getBusinessDefaults, getBusinessStatuses, getBusinessPriorities, getBusinessCurrencies } from '@/lib/config';
import { 
  Briefcase, 
  Plus, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  PieChart,
  BarChart3,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Building,
  CreditCard,
  Receipt,
  Calculator,
  Banknote,
  Handshake,
  UserCheck,
  Settings,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface BusinessMetrics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  expenses: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  profit: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    margin: number;
  };
  clients: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'prospect';
  totalValue: number;
  lastContact: string;
  projects: number;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  progress: number;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function BusinessPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Business data states
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
    expenses: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
    profit: { total: 0, thisMonth: 0, lastMonth: 0, margin: 0 },
    clients: { total: 0, active: 0, new: 0, retention: 0 }
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Form states
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      
      // Get business configuration
      const businessDefaults = getBusinessDefaults();
      
      // Use configured defaults instead of hardcoded values
      const mockMetrics: BusinessMetrics = businessDefaults.metrics;
      
      // Use configured sample data
      const mockClients: Client[] = businessDefaults.sampleClients.map(client => ({
        ...client,
        status: client.status as 'active' | 'inactive' | 'prospect',
        lastContact: new Date(client.lastContact).toISOString()
      }));
      
      const mockProjects: Project[] = businessDefaults.sampleProjects.map(project => ({
        ...project,
        status: project.status as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled',
        priority: project.priority as 'high' | 'medium' | 'low'
      }));
      
      const mockInvoices: Invoice[] = businessDefaults.sampleInvoices.map(invoice => ({
        ...invoice,
        status: invoice.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
      }));
      
      setMetrics(mockMetrics);
      setClients(mockClients);
      setProjects(mockProjects);
      setInvoices(mockInvoices);
      
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planning':
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-hold':
      case 'overdue':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'prospect':
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const businessConfig = getBusinessConfig();
    const defaultCurrency = currency || businessConfig.currency;
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: defaultCurrency
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-slate-500 to-gray-600 rounded-3xl shadow-2xl">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  {getBusinessConfig().name} Management
                </h1>
                <p className="text-gray-600 font-medium text-lg">
                  Manage your clients, projects, and financials
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setLoading(true)}
                variant="outline"
                className="bg-white/60 hover:bg-white/80"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setActiveTab('reports')}
                className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-bold"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-2 shadow-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white data-[state=active]:font-bold">
              <PieChart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:font-bold">
              <Users className="h-4 w-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:font-bold">
              <Target className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:font-bold">
              <Receipt className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:font-bold">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue Card */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">{formatCurrency(metrics.revenue.total)}</div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>{formatPercentage(metrics.revenue.growth)} from last month</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {formatCurrency(metrics.revenue.thisMonth)} this month
                  </p>
                </CardContent>
              </Card>

              {/* Expenses Card */}
              <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-3xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
                  <CreditCard className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-800">{formatCurrency(metrics.expenses.total)}</div>
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>{formatPercentage(metrics.expenses.growth)} from last month</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    {formatCurrency(metrics.expenses.thisMonth)} this month
                  </p>
                </CardContent>
              </Card>

              {/* Profit Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-3xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Net Profit</CardTitle>
                  <Banknote className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">{formatCurrency(metrics.profit.total)}</div>
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <span>{metrics.profit.margin}% profit margin</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {formatCurrency(metrics.profit.thisMonth)} this month
                  </p>
                </CardContent>
              </Card>

              {/* Clients Card */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Active Clients</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">{metrics.clients.active}</div>
                  <div className="flex items-center gap-1 text-xs text-purple-600">
                    <UserCheck className="h-3 w-3" />
                    <span>{metrics.clients.retention}% retention rate</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    {metrics.clients.new} new this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Projects */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Recent Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="p-4 bg-gradient-to-r from-white/60 to-white/40 rounded-xl border border-white/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.clientName}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 mt-3">
                        <span>{project.progress}% complete</span>
                        <span>{formatCurrency(project.budget)} budget</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="p-4 bg-gradient-to-r from-white/60 to-white/40 rounded-xl border border-white/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{invoice.number}</h4>
                          <p className="text-sm text-gray-600">{invoice.clientName}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 mt-3">
                        <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Client Management</h2>
              <Button
                onClick={() => setShowAddClient(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <Card key={client.id} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-800">{client.name}</CardTitle>
                        {client.company && (
                          <p className="text-sm text-gray-600">{client.company}</p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Total Value</p>
                        <p className="font-bold text-green-600">{formatCurrency(client.totalValue)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Projects</p>
                        <p className="font-bold text-blue-600">{client.projects}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Project Management</h2>
              <Button
                onClick={() => setShowAddProject(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{project.name}</h3>
                        <p className="text-gray-600">{project.clientName}</p>
                        {project.description && (
                          <p className="text-sm text-gray-500 mt-2">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadgeColor(project.priority)}>
                          {project.priority} priority
                        </Badge>
                        <Badge className={getStatusBadgeColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="font-bold text-blue-600">{formatCurrency(project.budget)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Spent</p>
                        <p className="font-bold text-red-600">{formatCurrency(project.spent)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Remaining</p>
                        <p className="font-bold text-green-600">{formatCurrency(project.budget - project.spent)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Progress</p>
                        <p className="font-bold text-purple-600">{project.progress}%</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                      {project.endDate && (
                        <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Time Log
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Invoice Management</h2>
              <Button
                onClick={() => setShowAddInvoice(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-800">{invoice.number}</CardTitle>
                        <p className="text-sm text-gray-600">{invoice.clientName}</p>
                      </div>
                      <Badge className={getStatusBadgeColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-3 bg-gradient-to-r from-white/40 to-white/20 rounded-xl">
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(invoice.amount, invoice.currency)}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Issue Date:</span>
                        <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                      {invoice.paidDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Paid Date:</span>
                          <span className="text-green-600">{new Date(invoice.paidDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Business Reports</h2>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Revenue Report', description: 'Monthly revenue breakdown and trends', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
                { title: 'Expense Analysis', description: 'Detailed expense categories and analysis', icon: BarChart3, color: 'from-red-500 to-rose-600' },
                { title: 'Client Report', description: 'Client activity and value analysis', icon: Users, color: 'from-blue-500 to-cyan-600' },
                { title: 'Project Status', description: 'Active projects and completion rates', icon: Target, color: 'from-purple-500 to-pink-600' },
                { title: 'Invoice Summary', description: 'Outstanding and paid invoices overview', icon: Receipt, color: 'from-yellow-500 to-orange-600' },
                { title: 'Profit & Loss', description: 'Complete P&L statement with comparisons', icon: Calculator, color: 'from-indigo-500 to-purple-600' }
              ].map((report, index) => {
                const IconComponent = report.icon;
                return (
                  <Card key={index} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 bg-gradient-to-r ${report.color} rounded-xl`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{report.title}</h3>
                          <p className="text-sm text-gray-600">{report.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}