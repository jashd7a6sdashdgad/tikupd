'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Grid3X3, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Move,
  Settings,
  BarChart3,
  Calendar,
  Mail,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  Clock,
  Star,
  Heart,
  Zap,
  Target,
  Globe,
  Camera,
  Search,
  Save,
  X,
  GripVertical
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  name: string;
  type: 'chart' | 'stat' | 'list' | 'calendar' | 'custom';
  description: string;
  icon: string;
  enabled: boolean;
  position: { row: number; col: number };
  size: { width: number; height: number };
  data: {
    source?: string;
    query?: string;
    refresh?: number;
    color?: string;
  };
  settings: {
    showHeader: boolean;
    allowResize: boolean;
    showBorder: boolean;
    backgroundColor: string;
  };
  custom: boolean;
  category: 'analytics' | 'productivity' | 'social' | 'finance' | 'general';
}

const iconMap = {
  BarChart3, Calendar, Mail, DollarSign, Users, Activity, TrendingUp, 
  Clock, Star, Heart, Zap, Target, Globe, Camera, Search
};

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'expenses-chart',
    name: 'Expenses Chart',
    type: 'chart',
    description: 'Monthly expenses breakdown',
    icon: 'DollarSign',
    enabled: true,
    position: { row: 0, col: 0 },
    size: { width: 2, height: 1 },
    data: { source: 'expenses', refresh: 300 },
    settings: { showHeader: true, allowResize: true, showBorder: true, backgroundColor: '#ffffff' },
    custom: false,
    category: 'finance'
  },
  {
    id: 'calendar-events',
    name: 'Upcoming Events',
    type: 'list',
    description: 'Next 5 calendar events',
    icon: 'Calendar',
    enabled: true,
    position: { row: 0, col: 2 },
    size: { width: 1, height: 1 },
    data: { source: 'calendar', query: 'next-5', refresh: 60 },
    settings: { showHeader: true, allowResize: true, showBorder: true, backgroundColor: '#ffffff' },
    custom: false,
    category: 'productivity'
  },
  {
    id: 'email-stats',
    name: 'Email Stats',
    type: 'stat',
    description: 'Unread emails count',
    icon: 'Mail',
    enabled: true,
    position: { row: 1, col: 0 },
    size: { width: 1, height: 1 },
    data: { source: 'email', query: 'unread', refresh: 120 },
    settings: { showHeader: true, allowResize: false, showBorder: true, backgroundColor: '#ffffff' },
    custom: false,
    category: 'productivity'
  },
  {
    id: 'activity-feed',
    name: 'Activity Feed',
    type: 'list',
    description: 'Recent activities',
    icon: 'Activity',
    enabled: false,
    position: { row: 1, col: 1 },
    size: { width: 2, height: 1 },
    data: { source: 'activity', refresh: 180 },
    settings: { showHeader: true, allowResize: true, showBorder: true, backgroundColor: '#ffffff' },
    custom: false,
    category: 'general'
  }
];

interface DashboardWidgetsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function DashboardWidgets({ onUnsavedChanges }: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Partial<DashboardWidget>>({});
  const [previewLayout, setPreviewLayout] = useState(false);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hasCustom = widgets.some(w => w.custom);
    onUnsavedChanges(hasCustom);
  }, [widgets, onUnsavedChanges]);

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filter) {
      case 'enabled': return widget.enabled && matchesSearch;
      case 'disabled': return !widget.enabled && matchesSearch;
      case 'custom': return widget.custom && matchesSearch;
      default: return matchesSearch;
    }
  });

  const handleCreateWidget = () => {
    setIsCreating(true);
    setEditingWidget({
      name: '',
      type: 'stat',
      description: '',
      icon: 'BarChart3',
      enabled: true,
      position: { row: 0, col: 0 },
      size: { width: 1, height: 1 },
      data: { refresh: 300 },
      settings: { 
        showHeader: true, 
        allowResize: true, 
        showBorder: true, 
        backgroundColor: '#ffffff' 
      },
      custom: true,
      category: 'general'
    });
  };

  const handleEditWidget = (widget: DashboardWidget) => {
    setSelectedWidget(widget);
    setEditingWidget({ ...widget });
    setIsEditing(true);
  };

  const handleSaveWidget = () => {
    if (isCreating) {
      const newWidget: DashboardWidget = {
        ...editingWidget as DashboardWidget,
        id: `custom-${Date.now()}`
      };
      setWidgets(prev => [...prev, newWidget]);
    } else {
      setWidgets(prev => prev.map(w => 
        w.id === editingWidget.id ? { ...editingWidget as DashboardWidget } : w
      ));
    }
    
    setIsEditing(false);
    setIsCreating(false);
    setEditingWidget({});
    setSelectedWidget(null);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
    }
  };

  const handleDuplicateWidget = (widget: DashboardWidget) => {
    const duplicatedWidget: DashboardWidget = {
      ...widget,
      id: `${widget.id}-copy-${Date.now()}`,
      name: `${widget.name} (Copy)`,
      custom: true,
      position: { row: widget.position.row + 1, col: widget.position.col }
    };
    setWidgets(prev => [...prev, duplicatedWidget]);
  };

  const handleToggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'productivity': return 'bg-green-100 text-green-800 border-green-200';
      case 'social': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'finance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chart': return BarChart3;
      case 'stat': return TrendingUp;
      case 'list': return Activity;
      case 'calendar': return Calendar;
      default: return Grid3X3;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-2 border-white/30"
            />
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Widgets</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setPreviewLayout(!previewLayout)}
            className="bg-white/60 hover:bg-white/80"
          >
            {previewLayout ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={handleCreateWidget}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-black font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Widget
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWidgets.map((widget) => {
          const TypeIcon = getTypeIcon(widget.type);
          const IconComponent = iconMap[widget.icon as keyof typeof iconMap] || BarChart3;
          
          return (
            <Card key={widget.id} className={`bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ${widget.enabled ? 'hover:scale-105' : 'opacity-60'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl shadow-md ${widget.enabled ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : 'bg-gray-300'}`}>
                      <IconComponent className="h-5 w-5 text-black font-bold" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {widget.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getCategoryColor(widget.category)}>
                          {widget.category}
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {widget.type}
                        </Badge>
                        {widget.custom && (
                          <Badge className="bg-emerald-500 text-white text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Switch
                    checked={widget.enabled}
                    onCheckedChange={() => handleToggleWidget(widget.id)}
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{widget.description}</p>
                
                {/* Widget Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 mb-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-700">Preview</div>
                    <div className="text-xs text-gray-500">
                      {widget.size.width}×{widget.size.height}
                    </div>
                  </div>
                  <div className="h-16 bg-white rounded-lg border flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                
                {/* Widget Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditWidget(widget)}
                    className="flex-1 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateWidget(widget)}
                    className="hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="hover:bg-red-50 text-red-600"
                    disabled={!widget.custom}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Widget Editor Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {isCreating ? 'Create New Widget' : 'Edit Widget'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setEditingWidget({});
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Widget Name</Label>
                  <Input
                    id="name"
                    value={editingWidget.name || ''}
                    onChange={(e) => setEditingWidget(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter widget name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Widget Type</Label>
                  <Select
                    value={editingWidget.type || 'stat'}
                    onValueChange={(value: any) => setEditingWidget(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">Chart</SelectItem>
                      <SelectItem value="stat">Statistic</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingWidget.category || 'general'}
                    onValueChange={(value: any) => setEditingWidget(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={editingWidget.icon || 'BarChart3'}
                    onValueChange={(value) => setEditingWidget(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(iconMap).map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          {iconName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingWidget.description || ''}
                  onChange={(e) => setEditingWidget(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this widget does"
                  rows={3}
                />
              </div>

              {/* Size and Position */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={editingWidget.size?.width || 1}
                    onChange={(e) => setEditingWidget(prev => ({
                      ...prev,
                      size: { 
                        width: parseInt(e.target.value) || 1, 
                        height: prev.size?.height || 1 
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={editingWidget.size?.height || 1}
                    onChange={(e) => setEditingWidget(prev => ({
                      ...prev,
                      size: { 
                        width: prev.size?.width || 1,
                        height: parseInt(e.target.value) || 1 
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Row</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingWidget.position?.row || 0}
                    onChange={(e) => setEditingWidget(prev => ({
                      ...prev,
                      position: { 
                        row: parseInt(e.target.value) || 0,
                        col: prev.position?.col || 0
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Column</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingWidget.position?.col || 0}
                    onChange={(e) => setEditingWidget(prev => ({
                      ...prev,
                      position: { 
                        row: prev.position?.row || 0,
                        col: parseInt(e.target.value) || 0
                      }
                    }))}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Widget Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Header</Label>
                    <Switch
                      checked={editingWidget.settings?.showHeader ?? true}
                      onCheckedChange={(checked) => setEditingWidget(prev => ({
                        ...prev,
                        settings: { 
                          showHeader: checked,
                          allowResize: prev.settings?.allowResize ?? true,
                          showBorder: prev.settings?.showBorder ?? true,
                          backgroundColor: prev.settings?.backgroundColor ?? '#ffffff'
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Allow Resize</Label>
                    <Switch
                      checked={editingWidget.settings?.allowResize ?? true}
                      onCheckedChange={(checked) => setEditingWidget(prev => ({
                        ...prev,
                        settings: { 
                          showHeader: prev.settings?.showHeader ?? true,
                          allowResize: checked,
                          showBorder: prev.settings?.showBorder ?? true,
                          backgroundColor: prev.settings?.backgroundColor ?? '#ffffff'
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Show Border</Label>
                    <Switch
                      checked={editingWidget.settings?.showBorder ?? true}
                      onCheckedChange={(checked) => setEditingWidget(prev => ({
                        ...prev,
                        settings: { 
                          showHeader: prev.settings?.showHeader ?? true,
                          allowResize: prev.settings?.allowResize ?? true,
                          showBorder: checked,
                          backgroundColor: prev.settings?.backgroundColor ?? '#ffffff'
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Enabled</Label>
                    <Switch
                      checked={editingWidget.enabled ?? true}
                      onCheckedChange={(checked) => setEditingWidget(prev => ({
                        ...prev,
                        enabled: checked
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setEditingWidget({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveWidget}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-bold"
                  disabled={!editingWidget.name}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create Widget' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{widgets.length}</div>
              <div className="text-sm text-gray-600">Total Widgets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{widgets.filter(w => w.enabled).length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{widgets.filter(w => w.custom).length}</div>
              <div className="text-sm text-gray-600">Custom</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{new Set(widgets.map(w => w.category)).size}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}