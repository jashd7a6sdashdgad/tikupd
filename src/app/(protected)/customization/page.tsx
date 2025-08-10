'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Grid3X3, 
  Mic, 
  Plus, 
  Settings, 
  Eye,
  Save,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  ChevronRight,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { ThemeBuilder } from '@/components/customization/ThemeBuilder';
import { DashboardWidgets } from '@/components/customization/DashboardWidgets';
import { VoiceCommands } from '@/components/customization/VoiceCommands';

export default function CustomizationPage() {
  const [activeTab, setActiveTab] = useState('theme');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/60 hover:bg-white/80 border-2 border-gray-300 hover:border-gray-400"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/60 hover:bg-white/80 border-2 border-blue-300 hover:border-blue-400"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {hasUnsavedChanges && (
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-bold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </Button>
              )}
            </div>
          </div>
          
          {/* Quick Preview Device Selector */}
          <div className="mt-6 flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl border border-blue-300">
              <Monitor className="h-4 w-4 text-blue-700" />
              <span className="text-blue-800 font-semibold text-sm">Desktop Preview</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl border border-purple-300">
              <Tablet className="h-4 w-4 text-purple-700" />
              <span className="text-purple-800 font-semibold text-sm">Tablet Ready</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl border border-green-300">
              <Smartphone className="h-4 w-4 text-green-700" />
              <span className="text-green-800 font-semibold text-sm">Mobile Optimized</span>
            </div>
          </div>
        </div>

        {/* Main Customization Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-2 shadow-lg">
            <TabsTrigger 
              value="theme" 
              className="flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-4 px-6 transition-all duration-300 hover:bg-white/50"
            >
              <Palette className="h-5 w-5" />
              <span className="text-lg">Theme Builder</span>
            </TabsTrigger>
            <TabsTrigger 
              value="widgets" 
              className="flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-4 px-6 transition-all duration-300 hover:bg-white/50"
            >
              <Grid3X3 className="h-5 w-5" />
              <span className="text-lg">Dashboard Widgets</span>
            </TabsTrigger>
            <TabsTrigger 
              value="voice" 
              className="flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-4 px-6 transition-all duration-300 hover:bg-white/50"
            >
              <Mic className="h-5 w-5" />
              <span className="text-lg">Voice Commands</span>
            </TabsTrigger>
          </TabsList>

          {/* Theme Builder Tab */}
          <TabsContent value="theme" className="space-y-6">
            <ThemeBuilder onUnsavedChanges={setHasUnsavedChanges} />
          </TabsContent>

          {/* Dashboard Widgets Tab */}
          <TabsContent value="widgets" className="space-y-6">
            <DashboardWidgets onUnsavedChanges={setHasUnsavedChanges} />
          </TabsContent>

          {/* Voice Commands Tab */}
          <TabsContent value="voice" className="space-y-6">
            <VoiceCommands onUnsavedChanges={setHasUnsavedChanges} />
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110"
              onClick={() => {
                // Quick action based on active tab
                if (activeTab === 'theme') {
                  // Add new theme preset
                } else if (activeTab === 'widgets') {
                  // Add new widget
                } else if (activeTab === 'voice') {
                  // Add new voice command
                }
              }}
            >
              <Plus className="h-6 w-6 text-white" />
            </Button>
            
            {/* Preview Toggle */}
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-14 rounded-full bg-white/80 backdrop-blur-xl border-2 border-white/30 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Eye className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}