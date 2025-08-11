'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Shield,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { PERMISSIONS, PERMISSION_GROUPS } from '@/lib/tokenAuth';

interface ApiToken {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  status: 'active' | 'inactive';
  token?: string; // Only present when first created
}

export default function ApiTokensPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);
  const [showTokenValue, setShowTokenValue] = useState<string | null>(null);
  
  // Form state
  const [tokenName, setTokenName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [permissionGroup, setPermissionGroup] = useState('');

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tokens');
      const data = await response.json();
      
      if (response.ok) {
        setTokens(data.tokens || []);
      } else {
        console.error('Failed to fetch tokens:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!tokenName.trim()) {
      alert('Please enter a token name');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tokenName.trim(),
          permissions: selectedPermissions,
          expiresInDays: expiresInDays || undefined
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewToken(data.token);
        setShowCreateForm(false);
        fetchTokens();
        
        // Reset form
        setTokenName('');
        setSelectedPermissions([]);
        setExpiresInDays('');
        setPermissionGroup('');
      } else {
        alert(data.error || 'Failed to create token');
      }
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Failed to create token');
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/tokens/${tokenId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchTokens();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete token');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handlePermissionGroupChange = (group: string) => {
    setPermissionGroup(group);
    if (group === 'custom') {
      setSelectedPermissions([]);
    } else if (PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]) {
      setSelectedPermissions(PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
    setPermissionGroup('custom');
  };

  const getTokenStatus = (token: ApiToken) => {
    if (token.status !== 'active') return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return { status: 'expired', color: 'bg-red-100 text-red-800' };
    }
    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl shadow-2xl">
                <Key className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  API Tokens
                </h1>
                <p className="text-gray-600 font-medium text-lg">
                  Manage API tokens for N8N and other integrations
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </div>
        </div>

        {/* New Token Display */}
        {newToken && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Token Created Successfully!
              </CardTitle>
              <CardDescription className="text-green-700">
                Copy this token now - it will not be shown again for security reasons.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border">
                <code className="flex-1 font-mono text-sm break-all">
                  {showTokenValue === newToken.id ? newToken.token : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTokenValue(
                    showTokenValue === newToken.id ? null : newToken.id
                  )}
                >
                  {showTokenValue === newToken.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newToken.token || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setNewToken(null)}
              >
                Got it, dismiss this message
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Token Form */}
        {showCreateForm && (
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl mb-8">
            <CardHeader>
              <CardTitle>Create New API Token</CardTitle>
              <CardDescription>
                Generate a secure token for accessing your personal assistant APIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Name */}
              <div>
                <Label htmlFor="tokenName">Token Name *</Label>
                <Input
                  id="tokenName"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g., N8N Integration, Mobile App, etc."
                  className="mt-2"
                />
              </div>

              {/* Permission Groups */}
              <div>
                <Label>Permission Template</Label>
                <Select value={permissionGroup} onValueChange={handlePermissionGroupChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a permission template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N8N_AGENT">N8N Agent (Recommended)</SelectItem>
                    <SelectItem value="READ_ONLY">Read Only</SelectItem>
                    <SelectItem value="FULL_ACCESS">Full Access</SelectItem>
                    <SelectItem value="custom">Custom Permissions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Individual Permissions */}
              {permissionGroup === 'custom' && (
                <div>
                  <Label>Individual Permissions</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(PERMISSIONS).map(([key, permission]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiration */}
              <div>
                <Label htmlFor="expires">Expires In (days)</Label>
                <Input
                  id="expires"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Leave empty for no expiration"
                  className="mt-2"
                  min="1"
                  max="365"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createToken}
                  disabled={loading || !tokenName.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                >
                  {loading ? 'Creating...' : 'Create Token'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tokens List */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle>Existing Tokens</CardTitle>
            <CardDescription>
              Manage your API tokens and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && tokens.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading tokens...</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No API tokens found. Create your first token to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => {
                  const status = getTokenStatus(token);
                  return (
                    <div
                      key={token.id}
                      className="p-6 bg-gradient-to-r from-white/60 to-white/40 rounded-2xl border border-white/40"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{token.name}</h3>
                          <p className="text-gray-600 text-sm">
                            Created {new Date(token.createdAt).toLocaleDateString()}
                            {token.lastUsed && ` • Last used ${new Date(token.lastUsed).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={status.color}>
                            {status.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteToken(token.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                        <div className="flex flex-wrap gap-2">
                          {token.permissions.length > 0 ? (
                            token.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Full Access
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expiration */}
                      {token.expiresAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Expires {new Date(token.expiresAt).toLocaleDateString()}
                          </span>
                          {new Date(token.expiresAt) < new Date() && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Setup Guide */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-3xl shadow-xl mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Setup for N8N
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Token</h3>
                <p className="text-sm text-gray-600">
                  Click "Create Token" and choose "N8N Agent" template
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Copy Token</h3>
                <p className="text-sm text-gray-600">
                  Copy the generated token immediately after creation
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Configure N8N</h3>
                <p className="text-sm text-gray-600">
                  Use the token in N8N HTTP Request nodes with header "Authorization: Bearer YOUR_TOKEN"
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 mt-6">
              <h4 className="font-semibold mb-2">Example N8N HTTP Request Configuration:</h4>
              <pre className="text-sm bg-gray-50 p-3 rounded-md overflow-x-auto">
{`URL: ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/expenses
Method: GET
Headers:
  Authorization: Bearer mpa_your_token_here
  Content-Type: application/json`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}