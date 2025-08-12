'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useThemeContext, defaultPresets, type ThemePreset } from '@/contexts/ThemeContext';
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
  Target
} from 'lucide-react';

export default function CustomizationWorkingPage() {
  const { currentTheme, customPresets, applyTheme, saveCustomPreset, updateCurrentTheme } = useThemeContext();
  const [activeTab, setActiveTab] = useState('theme');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

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
    alert(`Saved theme: ${themeName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl">
                <Palette className="h-10 w-10 text-black font-bold" />
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Controls */}
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
                    <h4 className="font-medium text-gray-800 mb-3">Custom Themes</h4>
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
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Preview mode:</strong> {previewMode}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Theme:</strong> {currentTheme.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}