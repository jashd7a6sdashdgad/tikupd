'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useThemeContext, defaultPresets, type ThemePreset } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  Palette, 
  Eye,
  Save,
  Plus,
  Settings,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet,
  Target,
  Layout,
  Mic,
  Bell,
  Volume2,
  Moon,
  Sun,
  Zap,
  Globe,
  User,
  Camera,
  MessageSquare,
  Calendar
} from 'lucide-react';

export default function CustomizationPage() {
  const { currentTheme, customPresets, applyTheme, saveCustomPreset, updateCurrentTheme } = useThemeContext();
  const { uiSettings, voiceSettings, layoutSettings, updateUISettings, updateVoiceSettings, updateLayoutSettings } = useSettings();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('themes');

  const updateThemeColors = (colorKey: keyof ThemePreset['colors'], value: string) => {
    updateCurrentTheme({
      colors: {
        ...currentTheme.colors,
        [colorKey]: value
      }
    });
  };

  const handleSavePreset = () => {
    const themeName = `Custom Theme ${customPresets.length + 1}`;
    saveCustomPreset({
      ...currentTheme,
      name: themeName,
      description: 'Custom created theme'
    });
    alert(`✅ Saved theme: ${themeName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl">
                <Palette className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  Customization
                </h1>
                <p className="text-gray-600 font-medium text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Advanced customization and personalization
                </p>
              </div>
            </div>
            
            {/* Preview Device Selector */}
            <div className="flex gap-2">
              {[
                { mode: 'desktop', icon: Monitor },
                { mode: 'tablet', icon: Tablet },
                { mode: 'mobile', icon: Smartphone }
              ].map(({ mode, icon: Icon }) => (
                <Button
                  key={mode}
                  variant={previewMode === mode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode(mode as any)}
                  className="capitalize"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Customization Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-2 shadow-lg">
            <TabsTrigger value="themes" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl py-3 px-4">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
            <TabsTrigger value="interface" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl py-3 px-4">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Interface</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-xl py-3 px-4">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Voice & Audio</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-xl py-3 px-4">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
          </TabsList>

          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Theme Controls */}
              <div className="xl:col-span-2 space-y-6">
                {/* Current Theme Info */}
                <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-blue-600" />
                      Current Theme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{currentTheme.name}</h3>
                    <p className="text-gray-600">{currentTheme.description}</p>
                    {currentTheme.custom && (
                      <p className="text-emerald-600 text-sm mt-1">✓ Custom Theme</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {Object.values(currentTheme.colors).slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Presets */}
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Theme Presets
                </CardTitle>
                <CardDescription>
                  Choose from built-in themes or create your own
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {defaultPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        currentTheme.id === preset.id
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => applyTheme(preset)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }}
                        />
                        <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                      <div className="flex space-x-1">
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
                </div>

                {/* Custom Presets */}
                {customPresets.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Your Custom Themes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative ${
                            currentTheme.id === preset.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => applyTheme(preset)}
                        >
                          <div className="absolute -top-2 -right-2">
                            <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">Custom</span>
                          </div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }}
                            />
                            <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                          </div>
                          <div className="flex space-x-1">
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
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                  onClick={handleSavePreset}
                  disabled={!currentTheme.custom}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Current as New Preset
                </Button>
              </CardContent>
            </Card>

            {/* Color Customization */}
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Color Customization
                </CardTitle>
                <CardDescription>
                  Customize colors to create your perfect theme
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Colors are automatically applied as you change them. Save your custom theme when you're happy with the results!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-yellow-600" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your theme looks in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    previewMode === 'desktop' ? 'aspect-[16/10]' : 
                    previewMode === 'tablet' ? 'aspect-[4/3]' : 
                    'aspect-[9/16] max-w-[200px] mx-auto'
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
                        backgroundColor: currentTheme.colors.surface,
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
                          backgroundColor: currentTheme.colors.surface,
                          borderRadius: `${Math.max(currentTheme.effects.roundness - 4, 4)}px`
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ 
                              backgroundColor: i === 1 ? currentTheme.colors.primary : 
                                             i === 2 ? currentTheme.colors.secondary : 
                                             currentTheme.colors.accent 
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
                
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Preview mode:</strong> {previewMode}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Active theme:</strong> {currentTheme.name}
                  </p>
                  {currentTheme.custom && (
                    <p className="text-sm text-emerald-600 font-medium">
                      ✨ This is a custom theme you've created
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => applyTheme(defaultPresets[0])}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('/dashboard', '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview in Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Interface Tab */}
      <TabsContent value="interface" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Display & Appearance */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                Display & Appearance
              </CardTitle>
              <CardDescription>
                Customize the visual appearance and accessibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </Label>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
                <Switch
                  checked={uiSettings.darkMode}
                  onCheckedChange={(checked) => updateUISettings({ darkMode: checked })}
                />
              </div>
              
              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Reduce Animations
                  </Label>
                  <p className="text-sm text-gray-600">Minimize motion for accessibility</p>
                </div>
                <Switch
                  checked={uiSettings.reducedMotions}
                  onCheckedChange={(checked) => updateUISettings({ reducedMotions: checked })}
                />
              </div>
              
              {/* Font Size */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Font Size</Label>
                <div className="space-y-2">
                  <Slider
                    value={[uiSettings.fontSize]}
                    onValueChange={([value]) => updateUISettings({ fontSize: value })}
                    max={24}
                    min={12}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Small (12px)</span>
                    <span className="font-medium">{uiSettings.fontSize}px</span>
                    <span>Large (24px)</span>
                  </div>
                </div>
              </div>
              
              {/* Border Radius */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Border Roundness</Label>
                <div className="space-y-2">
                  <Slider
                    value={[uiSettings.borderRadius]}
                    onValueChange={([value]) => updateUISettings({ borderRadius: value })}
                    max={24}
                    min={0}
                    step={2}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sharp</span>
                    <span className="font-medium">{uiSettings.borderRadius}px</span>
                    <span>Round</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* UI Elements */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-purple-600" />
                UI Elements
              </CardTitle>
              <CardDescription>
                Toggle various interface elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Compact Mode</Label>
                  <p className="text-sm text-gray-600">Reduce spacing for more content</p>
                </div>
                <Switch
                  checked={uiSettings.compactMode}
                  onCheckedChange={(checked) => updateUISettings({ compactMode: checked })}
                />
              </div>
              
              {/* Show Avatars */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Show Avatars
                  </Label>
                  <p className="text-sm text-gray-600">Display profile pictures</p>
                </div>
                <Switch
                  checked={uiSettings.showAvatars}
                  onCheckedChange={(checked) => updateUISettings({ showAvatars: checked })}
                />
              </div>
              
              {/* Card Shadows */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Card Shadows</Label>
                  <p className="text-sm text-gray-600">Add depth with shadows</p>
                </div>
                <Switch
                  checked={uiSettings.cardShadows}
                  onCheckedChange={(checked) => updateUISettings({ cardShadows: checked })}
                />
              </div>
              
              {/* Blur Effects */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Blur Effects</Label>
                  <p className="text-sm text-gray-600">Background blur on cards</p>
                </div>
                <Switch
                  checked={uiSettings.blurEffects}
                  onCheckedChange={(checked) => updateUISettings({ blurEffects: checked })}
                />
              </div>
              
              {/* Animation Speed */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Animation Speed</Label>
                <div className="space-y-2">
                  <Slider
                    value={[uiSettings.animationSpeed]}
                    onValueChange={([value]) => updateUISettings({ animationSpeed: value })}
                    max={1000}
                    min={100}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Fast</span>
                    <span className="font-medium">{uiSettings.animationSpeed}ms</span>
                    <span>Slow</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Save Button */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardContent className="pt-6">
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
              onClick={() => {
                alert('✅ Interface settings are automatically saved!');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Interface Settings Auto-Saved
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Voice Tab */}
      <TabsContent value="voice" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voice Settings */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-green-600" />
                Voice Assistant Settings
              </CardTitle>
              <CardDescription>
                Configure voice recognition and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Enabled */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Enable Voice Assistant
                  </Label>
                  <p className="text-sm text-gray-600">Turn on voice commands</p>
                </div>
                <Switch
                  checked={voiceSettings.voiceEnabled}
                  onCheckedChange={(checked) => updateVoiceSettings({ voiceEnabled: checked })}
                />
              </div>
              
              {/* Voice Speed */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Speech Speed</Label>
                <div className="space-y-2">
                  <Slider
                    value={[voiceSettings.voiceSpeed]}
                    onValueChange={([value]) => updateVoiceSettings({ voiceSpeed: value })}
                    max={2.0}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Slow (0.5x)</span>
                    <span className="font-medium">{voiceSettings.voiceSpeed.toFixed(1)}x</span>
                    <span>Fast (2.0x)</span>
                  </div>
                </div>
              </div>
              
              {/* Voice Volume */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voice Volume
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[voiceSettings.voiceVolume]}
                    onValueChange={([value]) => updateVoiceSettings({ voiceVolume: value })}
                    max={1.0}
                    min={0.0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Quiet</span>
                    <span className="font-medium">{Math.round(voiceSettings.voiceVolume * 100)}%</span>
                    <span>Loud</span>
                  </div>
                </div>
              </div>
              
              {/* Auto-play Responses */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Auto-play Responses</Label>
                  <p className="text-sm text-gray-600">Automatically speak AI responses</p>
                </div>
                <Switch
                  checked={voiceSettings.autoPlayResponses}
                  onCheckedChange={(checked) => updateVoiceSettings({ autoPlayResponses: checked })}
                />
              </div>
              
              {/* Voice Feedback */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Voice Feedback</Label>
                  <p className="text-sm text-gray-600">Confirm voice commands with audio</p>
                </div>
                <Switch
                  checked={voiceSettings.voiceFeedback}
                  onCheckedChange={(checked) => updateVoiceSettings({ voiceFeedback: checked })}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Audio & Notifications */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-orange-600" />
                Audio & Notifications
              </CardTitle>
              <CardDescription>
                Control sounds and notification audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Sound Effects
                  </Label>
                  <p className="text-sm text-gray-600">UI interaction sounds</p>
                </div>
                <Switch
                  checked={voiceSettings.soundEffects}
                  onCheckedChange={(checked) => updateVoiceSettings({ soundEffects: checked })}
                />
              </div>
              
              {/* Notification Sounds */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notification Sounds
                  </Label>
                  <p className="text-sm text-gray-600">Audio alerts for notifications</p>
                </div>
                <Switch
                  checked={voiceSettings.notificationSounds}
                  onCheckedChange={(checked) => updateVoiceSettings({ notificationSounds: checked })}
                />
              </div>
              
              {/* Voice Test */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Test Voice Settings</Label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (voiceSettings.voiceEnabled && 'speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(
                        'Hello Mahboob! This is a test of your voice settings.'
                      );
                      utterance.rate = voiceSettings.voiceSpeed;
                      utterance.volume = voiceSettings.voiceVolume;
                      speechSynthesis.speak(utterance);
                    } else {
                      alert('Voice synthesis not available or disabled');
                    }
                  }}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Test Voice Output
                </Button>
              </div>
              
              {/* Voice Commands Help */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-medium text-green-800 mb-2">Available Voice Commands:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• "Hey Mahboob, open [page name]"</li>
                  <li>• "Show me my expenses"</li>
                  <li>• "What's the weather like?"</li>
                  <li>• "Add expense: [amount] for [description]"</li>
                  <li>• "Send message to [contact]"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Save Button */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardContent className="pt-6">
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold"
              onClick={() => {
                alert('🎤 Voice & Audio settings are automatically saved!');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Voice Settings Auto-Saved
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Layout Tab */}
      <TabsContent value="layout" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dashboard Layout */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Layout className="h-5 w-5 text-orange-600" />
                Dashboard Layout
              </CardTitle>
              <CardDescription>
                Customize your dashboard appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Widget Spacing */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Widget Spacing</Label>
                <Select
                  value={layoutSettings.widgetSpacing}
                  onValueChange={(value) => updateLayoutSettings({ widgetSpacing: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Cards Per Row */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Cards Per Row (Desktop)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[layoutSettings.cardsPerRow]}
                    onValueChange={([value]) => updateLayoutSettings({ cardsPerRow: value })}
                    max={4}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>1</span>
                    <span className="font-medium">{layoutSettings.cardsPerRow} cards</span>
                    <span>4</span>
                  </div>
                </div>
              </div>
              
              {/* Header Style */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Header Style</Label>
                <Select
                  value={layoutSettings.headerStyle}
                  onValueChange={(value) => updateLayoutSettings({ headerStyle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sidebar Settings */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Collapsed Sidebar</Label>
                  <p className="text-sm text-gray-600">Start with sidebar minimized</p>
                </div>
                <Switch
                  checked={layoutSettings.sidebarCollapsed}
                  onCheckedChange={(checked) => updateLayoutSettings({ sidebarCollapsed: checked })}
                />
              </div>
              
              {/* Footer Visible */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Show Footer</Label>
                  <p className="text-sm text-gray-600">Display footer information</p>
                </div>
                <Switch
                  checked={layoutSettings.footerVisible}
                  onCheckedChange={(checked) => updateLayoutSettings({ footerVisible: checked })}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Widget Visibility */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                Widget Visibility
              </CardTitle>
              <CardDescription>
                Choose which widgets to display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show Weather */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Weather Widget
                  </Label>
                  <p className="text-sm text-gray-600">Current weather information</p>
                </div>
                <Switch
                  checked={layoutSettings.showWeather}
                  onCheckedChange={(checked) => updateLayoutSettings({ showWeather: checked })}
                />
              </div>
              
              {/* Show Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Actions
                  </Label>
                  <p className="text-sm text-gray-600">Shortcuts to common tasks</p>
                </div>
                <Switch
                  checked={layoutSettings.showQuickActions}
                  onCheckedChange={(checked) => updateLayoutSettings({ showQuickActions: checked })}
                />
              </div>
              
              {/* Show Recent Activity */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recent Activity
                  </Label>
                  <p className="text-sm text-gray-600">Timeline of recent actions</p>
                </div>
                <Switch
                  checked={layoutSettings.showRecentActivity}
                  onCheckedChange={(checked) => updateLayoutSettings({ showRecentActivity: checked })}
                />
              </div>
              
              {/* Layout Preview */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <h4 className="font-medium text-orange-800 mb-2">Current Layout:</h4>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>• Spacing: <span className="font-medium capitalize">{layoutSettings.widgetSpacing}</span></p>
                  <p>• Cards per row: <span className="font-medium">{layoutSettings.cardsPerRow}</span></p>
                  <p>• Header: <span className="font-medium capitalize">{layoutSettings.headerStyle}</span></p>
                  <p>• Sidebar: <span className="font-medium">{layoutSettings.sidebarCollapsed ? 'Collapsed' : 'Expanded'}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Save Button */}
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardContent className="pt-6">
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold"
              onClick={() => {
                alert('🎯 Layout settings are automatically saved!');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Layout Settings Auto-Saved
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      </Tabs>
      </div>
    </div>
  );
}