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
  Mic, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Save,
  X,
  Search,
  Zap,
  MessageSquare,
  Navigation,
  Calendar,
  Mail,
  FileText,
  Music,
  Phone,
  Clock,
  Globe,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  Command
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  trigger: string[];
  name: string;
  description: string;
  action: {
    type: 'navigate' | 'execute' | 'speak' | 'api' | 'script';
    target: string;
    params?: Record<string, any>;
  };
  enabled: boolean;
  category: 'navigation' | 'productivity' | 'entertainment' | 'system' | 'custom';
  confidence: number;
  language: string[];
  custom: boolean;
  examples: string[];
  response?: string;
}

const defaultCommands: VoiceCommand[] = [
  {
    id: 'navigate-dashboard',
    trigger: ['go to dashboard', 'open dashboard', 'show dashboard'],
    name: 'Navigate to Dashboard',
    description: 'Navigate to the main dashboard page',
    action: { type: 'navigate', target: '/dashboard' },
    enabled: true,
    category: 'navigation',
    confidence: 0.8,
    language: ['en'],
    custom: false,
    examples: ['Go to dashboard', 'Open dashboard', 'Show me the dashboard'],
    response: 'Opening dashboard'
  },
  {
    id: 'check-email',
    trigger: ['check email', 'open email', 'show emails'],
    name: 'Check Email',
    description: 'Open the email interface',
    action: { type: 'navigate', target: '/email' },
    enabled: true,
    category: 'productivity',
    confidence: 0.85,
    language: ['en'],
    custom: false,
    examples: ['Check email', 'Open my emails', 'Show unread emails'],
    response: 'Opening your emails'
  },
  {
    id: 'add-expense',
    trigger: ['add expense', 'record expense', 'log spending'],
    name: 'Add Expense',
    description: 'Navigate to add new expense',
    action: { type: 'navigate', target: '/expenses' },
    enabled: true,
    category: 'productivity',
    confidence: 0.9,
    language: ['en'],
    custom: false,
    examples: ['Add expense', 'Record new expense', 'Log my spending'],
    response: 'Opening expense tracker'
  },
  {
    id: 'weather-check',
    trigger: ['what\'s the weather', 'check weather', 'weather today'],
    name: 'Check Weather',
    description: 'Get current weather information',
    action: { type: 'navigate', target: '/weather' },
    enabled: true,
    category: 'entertainment',
    confidence: 0.85,
    language: ['en'],
    custom: false,
    examples: ['What\'s the weather like?', 'Check today\'s weather', 'How\'s the weather?'],
    response: 'Checking the weather for you'
  },
  {
    id: 'time-check',
    trigger: ['what time is it', 'current time', 'tell me the time'],
    name: 'Tell Current Time',
    description: 'Speak the current time',
    action: { type: 'speak', target: 'current-time' },
    enabled: true,
    category: 'system',
    confidence: 0.9,
    language: ['en'],
    custom: false,
    examples: ['What time is it?', 'Tell me the time', 'Current time please'],
    response: 'The current time is...'
  }
];

const actionIcons = {
  navigate: Navigation,
  execute: Zap,
  speak: MessageSquare,
  api: Globe,
  script: FileText
};

const categoryColors = {
  navigation: 'bg-blue-100 text-blue-800 border-blue-200',
  productivity: 'bg-green-100 text-green-800 border-green-200',
  entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
  system: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  custom: 'bg-pink-100 text-pink-800 border-pink-200'
};

interface VoiceCommandsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function VoiceCommands({ onUnsavedChanges }: VoiceCommandsProps) {
  const [commands, setCommands] = useState<VoiceCommand[]>(defaultCommands);
  const [selectedCommand, setSelectedCommand] = useState<VoiceCommand | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Partial<VoiceCommand>>({});
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [testPhrase, setTestPhrase] = useState('');

  useEffect(() => {
    const hasCustom = commands.some(c => c.custom);
    onUnsavedChanges(hasCustom);
  }, [commands, onUnsavedChanges]);

  const filteredCommands = commands.filter(command => {
    const matchesSearch = command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         command.trigger.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter === 'all' || 
                         (filter === 'enabled' && command.enabled) ||
                         (filter === 'disabled' && !command.enabled) ||
                         (filter === 'custom' && command.custom);
    const matchesCategory = categoryFilter === 'all' || command.category === categoryFilter;
    
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const handleCreateCommand = () => {
    setIsCreating(true);
    setEditingCommand({
      trigger: [''],
      name: '',
      description: '',
      action: { type: 'navigate', target: '' },
      enabled: true,
      category: 'custom',
      confidence: 0.8,
      language: ['en'],
      custom: true,
      examples: [''],
      response: ''
    });
  };

  const handleEditCommand = (command: VoiceCommand) => {
    setSelectedCommand(command);
    setEditingCommand({ ...command });
    setIsEditing(true);
  };

  const handleSaveCommand = () => {
    if (isCreating) {
      const newCommand: VoiceCommand = {
        ...editingCommand as VoiceCommand,
        id: `custom-${Date.now()}`
      };
      setCommands(prev => [...prev, newCommand]);
    } else {
      setCommands(prev => prev.map(c => 
        c.id === editingCommand.id ? { ...editingCommand as VoiceCommand } : c
      ));
    }
    
    setIsEditing(false);
    setIsCreating(false);
    setEditingCommand({});
    setSelectedCommand(null);
  };

  const handleDeleteCommand = (commandId: string) => {
    if (window.confirm('Are you sure you want to delete this voice command?')) {
      setCommands(prev => prev.filter(c => c.id !== commandId));
    }
  };

  const handleDuplicateCommand = (command: VoiceCommand) => {
    const duplicatedCommand: VoiceCommand = {
      ...command,
      id: `${command.id}-copy-${Date.now()}`,
      name: `${command.name} (Copy)`,
      custom: true
    };
    setCommands(prev => [...prev, duplicatedCommand]);
  };

  const handleToggleCommand = (commandId: string) => {
    setCommands(prev => prev.map(c => 
      c.id === commandId ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const handleTestCommand = (command: VoiceCommand) => {
    // Simulate command execution
    console.log(`Testing command: ${command.name}`);
    if (command.response) {
      // Would trigger TTS here
      console.log(`Response: ${command.response}`);
    }
  };

  const updateTriggers = (triggers: string) => {
    const triggerArray = triggers.split(',').map(t => t.trim()).filter(t => t);
    setEditingCommand(prev => ({ ...prev, trigger: triggerArray }));
  };

  const updateExamples = (examples: string) => {
    const exampleArray = examples.split(',').map(e => e.trim()).filter(e => e);
    setEditingCommand(prev => ({ ...prev, examples: exampleArray }));
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-2 border-white/30"
            />
          </div>
          
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commands</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={handleCreateCommand}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-bold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Command
        </Button>
      </div>

      {/* Voice Testing Panel */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
              <Mic className="h-5 w-5 text-black font-bold" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Voice Testing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="test-phrase">Test Phrase</Label>
              <Input
                id="test-phrase"
                value={testPhrase}
                onChange={(e) => setTestPhrase(e.target.value)}
                placeholder="Say something like 'go to dashboard' or 'check email'"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsListening(!isListening)}
              className={`${isListening ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
            >
              {isListening ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
              {isListening ? 'Stop' : 'Listen'}
            </Button>
            <Button
              onClick={() => {
                // Test matching logic here
                console.log(`Testing phrase: ${testPhrase}`);
              }}
              disabled={!testPhrase}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCommands.map((command) => {
          const ActionIcon = actionIcons[command.action.type] || Zap;
          
          return (
            <Card key={command.id} className={`bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ${command.enabled ? 'hover:scale-105' : 'opacity-60'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl shadow-md ${command.enabled ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gray-300'}`}>
                      <ActionIcon className="h-5 w-5 text-black font-bold" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {command.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={categoryColors[command.category]}>
                          {command.category}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                          {command.action.type}
                        </Badge>
                        {command.custom && (
                          <Badge className="bg-pink-500 text-white text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Switch
                    checked={command.enabled}
                    onCheckedChange={() => handleToggleCommand(command.id)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">{command.description}</p>
                
                {/* Trigger Phrases */}
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-2 block">TRIGGER PHRASES</Label>
                  <div className="flex flex-wrap gap-2">
                    {command.trigger.slice(0, 3).map((trigger, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        "{trigger}"
                      </Badge>
                    ))}
                    {command.trigger.length > 3 && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                        +{command.trigger.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Response Preview */}
                {command.response && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <Label className="text-xs font-semibold text-green-700 mb-1 block">RESPONSE</Label>
                    <p className="text-sm text-green-800 italic">"{command.response}"</p>
                  </div>
                )}

                {/* Confidence & Languages */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="font-semibold text-gray-700">Confidence</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${command.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-600">{Math.round(command.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-700">Languages</Label>
                    <div className="flex gap-1 mt-1">
                      {command.language.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestCommand(command)}
                    className="hover:bg-green-50 text-green-600"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCommand(command)}
                    className="hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateCommand(command)}
                    className="hover:bg-yellow-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCommand(command.id)}
                    className="hover:bg-red-50 text-red-600"
                    disabled={!command.custom}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Command Editor Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {isCreating ? 'Create Voice Command' : 'Edit Voice Command'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setEditingCommand({});
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
                  <Label htmlFor="command-name">Command Name</Label>
                  <Input
                    id="command-name"
                    value={editingCommand.name || ''}
                    onChange={(e) => setEditingCommand(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter command name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingCommand.category || 'custom'}
                    onValueChange={(value: any) => setEditingCommand(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navigation">Navigation</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingCommand.description || ''}
                  onChange={(e) => setEditingCommand(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this command does"
                  rows={2}
                />
              </div>

              {/* Trigger Phrases */}
              <div className="space-y-2">
                <Label htmlFor="triggers">Trigger Phrases (comma-separated)</Label>
                <Textarea
                  id="triggers"
                  value={editingCommand.trigger?.join(', ') || ''}
                  onChange={(e) => updateTriggers(e.target.value)}
                  placeholder="go to dashboard, open dashboard, show dashboard"
                  rows={3}
                />
              </div>

              {/* Action Configuration */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Action Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="action-type">Action Type</Label>
                    <Select
                      value={editingCommand.action?.type || 'navigate'}
                      onValueChange={(value: any) => setEditingCommand(prev => ({
                        ...prev,
                        action: { 
                          type: value,
                          target: prev.action?.target || '',
                          params: prev.action?.params || {}
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="navigate">Navigate to Page</SelectItem>
                        <SelectItem value="execute">Execute Function</SelectItem>
                        <SelectItem value="speak">Speak Response</SelectItem>
                        <SelectItem value="api">API Call</SelectItem>
                        <SelectItem value="script">Run Script</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="action-target">Target</Label>
                    <Input
                      id="action-target"
                      value={editingCommand.action?.target || ''}
                      onChange={(e) => setEditingCommand(prev => ({
                        ...prev,
                        action: { 
                          type: prev.action?.type || 'navigate',
                          target: e.target.value,
                          params: prev.action?.params || {}
                        }
                      }))}
                      placeholder="/dashboard, function-name, or API endpoint"
                    />
                  </div>
                </div>
              </div>

              {/* Response */}
              <div className="space-y-2">
                <Label htmlFor="response">Voice Response (optional)</Label>
                <Input
                  id="response"
                  value={editingCommand.response || ''}
                  onChange={(e) => setEditingCommand(prev => ({ ...prev, response: e.target.value }))}
                  placeholder="What should the assistant say when this command is executed?"
                />
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Advanced Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Confidence Threshold</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editingCommand.confidence || 0.8}
                      onChange={(e) => setEditingCommand(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Enabled</Label>
                    <Switch
                      checked={editingCommand.enabled ?? true}
                      onCheckedChange={(checked) => setEditingCommand(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <Label htmlFor="examples">Usage Examples (comma-separated)</Label>
                <Textarea
                  id="examples"
                  value={editingCommand.examples?.join(', ') || ''}
                  onChange={(e) => updateExamples(e.target.value)}
                  placeholder="Go to dashboard, Open dashboard, Show me the main page"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setEditingCommand({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCommand}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-bold"
                  disabled={!editingCommand.name || !editingCommand.trigger?.length}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create Command' : 'Save Changes'}
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
              <div className="text-2xl font-bold text-gray-800">{commands.length}</div>
              <div className="text-sm text-gray-600">Total Commands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{commands.filter(c => c.enabled).length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{commands.filter(c => c.custom).length}</div>
              <div className="text-sm text-gray-600">Custom</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {commands.reduce((acc, cmd) => acc + cmd.trigger.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Phrases</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}