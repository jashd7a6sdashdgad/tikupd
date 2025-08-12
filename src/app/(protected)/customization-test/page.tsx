'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeContext, defaultPresets } from '@/contexts/ThemeContext';
import { Palette, Sparkles } from 'lucide-react';

export default function CustomizationTestPage() {
  const { currentTheme, customPresets, applyTheme, saveCustomPreset } = useThemeContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl">
              <Palette className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Theme Test
              </h1>
              <p className="text-gray-600 font-medium text-lg">
                Testing theme context integration
              </p>
            </div>
          </div>
        </div>

        {/* Current Theme Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Current Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {currentTheme.name}</p>
                <p><strong>Description:</strong> {currentTheme.description}</p>
                <p><strong>Custom:</strong> {currentTheme.custom ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p><strong>Colors:</strong></p>
                <div className="flex gap-2 mt-2">
                  <div 
                    className="w-6 h-6 rounded border" 
                    style={{ backgroundColor: currentTheme.colors.primary }}
                    title="Primary"
                  />
                  <div 
                    className="w-6 h-6 rounded border" 
                    style={{ backgroundColor: currentTheme.colors.secondary }}
                    title="Secondary"
                  />
                  <div 
                    className="w-6 h-6 rounded border" 
                    style={{ backgroundColor: currentTheme.colors.accent }}
                    title="Accent"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Available Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {defaultPresets.map((preset) => (
                <div key={preset.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{preset.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                  <div className="flex gap-2 mb-3">
                    {Object.values(preset.colors).slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button 
                    onClick={() => applyTheme(preset)}
                    variant={currentTheme.id === preset.id ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                  >
                    {currentTheme.id === preset.id ? 'Current' : 'Apply'}
                  </Button>
                </div>
              ))}
            </div>

            {customPresets.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Custom Themes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="border rounded-lg p-4 bg-green-50">
                      <h3 className="font-semibold mb-2">{preset.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                      <div className="flex gap-2 mb-3">
                        {Object.values(preset.colors).slice(0, 3).map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button 
                        onClick={() => applyTheme(preset)}
                        variant={currentTheme.id === preset.id ? 'primary' : 'outline'}
                        size="sm"
                        className="w-full"
                      >
                        {currentTheme.id === preset.id ? 'Current' : 'Apply'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}