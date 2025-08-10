'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Palette,
  Eye,
  Download,
  Upload,
  Save,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Brush,
  Droplets,
  Zap,
  Copy,
  Trash2,
  Plus,
  Settings,
  Smartphone
} from 'lucide-react';

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  gradients: {
    primary: string[];
    secondary: string[];
    hero: string[];
  };
  effects: {
    glassmorphism: boolean;
    shadows: 'minimal' | 'medium' | 'heavy';
    animations: boolean;
    blur: number;
    roundness: number;
  };
  darkMode: boolean;
  custom: boolean;
}

const defaultPresets: ThemePreset[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Clean and professional blue theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#06b6d4',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      muted: '#64748b'
    },
    gradients: {
      primary: ['#3b82f6', '#1d4ed8'],
      secondary: ['#06b6d4', '#0891b2'],
      hero: ['#f8fafc', '#e2e8f0', '#cbd5e1']
    },
    effects: {
      glassmorphism: true,
      shadows: 'medium',
      animations: true,
      blur: 12,
      roundness: 16
    },
    darkMode: false,
    custom: false
  },
  {
    id: 'purple-gradient',
    name: 'Purple Gradient',
    description: 'Vibrant purple with gradients',
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#ec4899',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280'
    },
    gradients: {
      primary: ['#8b5cf6', '#7c3aed'],
      secondary: ['#ec4899', '#db2777'],
      hero: ['#faf5ff', '#f3e8ff', '#e9d5ff']
    },
    effects: {
      glassmorphism: true,
      shadows: 'heavy',
      animations: true,
      blur: 16,
      roundness: 24
    },
    darkMode: false,
    custom: false
  },
  {
    id: 'emerald-nature',
    name: 'Emerald Nature',
    description: 'Fresh green nature-inspired theme',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#f59e0b',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#111827',
      muted: '#6b7280'
    },
    gradients: {
      primary: ['#10b981', '#059669'],
      secondary: ['#f59e0b', '#d97706'],
      hero: ['#f0fdf4', '#dcfce7', '#bbf7d0']
    },
    effects: {
      glassmorphism: false,
      shadows: 'minimal',
      animations: true,
      blur: 8,
      roundness: 12
    },
    darkMode: false,
    custom: false
  }
];

interface ThemeBuilderProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function ThemeBuilder({ onUnsavedChanges }: ThemeBuilderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(defaultPresets[0]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);
  
  useEffect(() => {
    onUnsavedChanges(currentTheme.custom);
  }, [currentTheme, onUnsavedChanges]);

  const updateThemeColors = (colorKey: keyof ThemePreset['colors'], value: string) => {
    setCurrentTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      },
      custom: true
    }));
  };

  const updateThemeEffects = (effectKey: keyof ThemePreset['effects'], value: any) => {
    setCurrentTheme(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effectKey]: value
      },
      custom: true
    }));
  };

  const saveThemePreset = () => {
    const newPreset = {
      ...currentTheme,
      id: `custom-${Date.now()}`,
      name: `Custom Theme ${customPresets.length + 1}`,
      description: 'Custom created theme',
      custom: true
    };
    setCustomPresets(prev => [...prev, newPreset]);
    onUnsavedChanges(false);
  };

  const applyThemePreset = (preset: ThemePreset) => {
    setCurrentTheme(preset);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Theme Controls */}
      <div className="xl:col-span-2 space-y-6">
        {/* Theme Presets */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                <Palette className="h-5 w-5 text-black font-bold" />
              </div>
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Theme Presets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {defaultPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    currentTheme.id === preset.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => applyThemePreset(preset)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{preset.description}</p>
                  <div className="flex space-x-1 mt-3">
                    {Object.values(preset.colors).slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Custom Presets */}
              {customPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative ${
                    currentTheme.id === preset.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => applyThemePreset(preset)}
                >
                  <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white">
                    Custom
                  </Badge>
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {Object.values(preset.colors).slice(0, 4).map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-black font-bold"
              onClick={saveThemePreset}
              disabled={!currentTheme.custom}
            >
              <Plus className="h-4 w-4 mr-2" />
              Save as New Preset
            </Button>
          </CardContent>
        </Card>

        {/* Color Customization */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md">
                <Brush className="h-5 w-5 text-black font-bold" />
              </div>
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Colors</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentTheme.colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize font-medium text-gray-700">{key}</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) => updateThemeColors(key as keyof ThemePreset['colors'], e.target.value)}
                      className="w-12 h-12 p-1 rounded-xl border-2 border-gray-300 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => updateThemeColors(key as keyof ThemePreset['colors'], e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Effects */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
                  <Sparkles className="h-5 w-5 text-black font-bold" />
                </div>
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Advanced Effects</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">Glassmorphism</Label>
                  <p className="text-sm text-gray-600">Frosted glass effect</p>
                </div>
                <Switch
                  checked={currentTheme.effects.glassmorphism}
                  onCheckedChange={(checked) => updateThemeEffects('glassmorphism', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">Animations</Label>
                  <p className="text-sm text-gray-600">Smooth transitions</p>
                </div>
                <Switch
                  checked={currentTheme.effects.animations}
                  onCheckedChange={(checked) => updateThemeEffects('animations', checked)}
                />
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-6 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <Label className="font-medium">Blur Intensity: {currentTheme.effects.blur}px</Label>
                  <Slider
                    value={[currentTheme.effects.blur]}
                    onValueChange={([value]) => updateThemeEffects('blur', value)}
                    max={24}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="font-medium">Border Radius: {currentTheme.effects.roundness}px</Label>
                  <Slider
                    value={[currentTheme.effects.roundness]}
                    onValueChange={([value]) => updateThemeEffects('roundness', value)}
                    max={32}
                    min={0}
                    step={2}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="space-y-6">
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl sticky top-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-md">
                  <Eye className="h-5 w-5 text-black font-bold" />
                </div>
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Live Preview</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="h-8 w-8 p-0"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="h-8 w-8 p-0"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                previewMode === 'desktop' ? 'aspect-[16/10]' : 'aspect-[9/16] max-w-[200px] mx-auto'
              }`}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.background}, ${currentTheme.colors.surface})`,
              }}
            >
              {/* Mini Dashboard Preview */}
              <div className="p-4 space-y-3">
                {/* Header */}
                <div 
                  className="p-3 rounded-xl shadow-sm"
                  style={{
                    background: currentTheme.effects.glassmorphism 
                      ? `rgba(255, 255, 255, 0.8)` 
                      : currentTheme.colors.surface,
                    backdropFilter: currentTheme.effects.glassmorphism ? `blur(${currentTheme.effects.blur}px)` : 'none',
                    borderRadius: `${currentTheme.effects.roundness}px`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
                    />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                  </div>
                </div>
                
                {/* Cards */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg shadow-sm"
                    style={{
                      background: currentTheme.effects.glassmorphism 
                        ? `rgba(255, 255, 255, 0.6)` 
                        : currentTheme.colors.surface,
                      backdropFilter: currentTheme.effects.glassmorphism ? `blur(${currentTheme.effects.blur}px)` : 'none',
                      borderRadius: `${Math.max(currentTheme.effects.roundness - 4, 4)}px`
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ 
                          backgroundColor: i === 1 ? currentTheme.colors.primary : i === 2 ? currentTheme.colors.secondary : currentTheme.colors.accent 
                        }}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="w-full h-1 bg-gray-200 rounded" />
                        <div className="w-2/3 h-1 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Theme Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Current Theme:</span>
                <span className="text-sm text-gray-600">{currentTheme.name}</span>
              </div>
              {currentTheme.custom && (
                <Badge variant="outline" className="w-full justify-center text-emerald-600 border-emerald-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Custom Theme
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-black font-bold"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview in New Tab
          </Button>
          <Button 
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Theme
          </Button>
        </div>
      </div>
    </div>
  );
}