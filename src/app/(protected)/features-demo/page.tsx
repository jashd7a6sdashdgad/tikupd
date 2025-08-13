'use client';

import React from 'react';
import { ModernCard } from '@/components/ui/ModernCard';
import { CustomizableWidgets } from '@/components/CustomizableWidgets';
import { VoiceNavigationSystem } from '@/components/VoiceNavigationSystem';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Mic,
  Hand,
  Zap,
  Layout,
  Command,
  Settings,
  ArrowRight,
  CheckCircle,
  Star,
  Heart,
  Rocket
} from 'lucide-react';

export default function FeaturesDemoPage() {
  const features = [
    {
      id: 'voice-navigation',
      title: 'Voice-First Navigation',
      description: 'Navigate hands-free with natural speech commands',
      icon: <Mic className="h-8 w-8" />,
      color: 'from-blue-500 to-indigo-600',
      status: 'Active',
      commands: [
        'Say "Go home" to navigate to dashboard',
        'Say "Calendar" to open your schedule',
        'Say "Expenses" for financial overview',
        'Say "Help" to see all available commands'
      ]
    },
    {
      id: 'customizable-widgets',
      title: 'Customizable Widgets',
      description: 'Drag-and-drop dashboard with personalized widgets',
      icon: <Layout className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-600',
      status: 'Active',
      commands: [
        'Drag widgets to reorder them',
        'Click "Edit Mode" to customize layout',
        'Add new widgets from the library',
        'Hide/show widgets as needed'
      ]
    },
  ];

  const achievements = [
    {
      title: 'Enhanced User Experience',
      description: 'Multi-modal interaction with voice, touch, and traditional inputs',
      icon: <Star className="h-6 w-6 text-yellow-500" />
    },
    {
      title: 'Accessibility First',
      description: 'Voice navigation supports users with different abilities',
      icon: <Heart className="h-6 w-6 text-red-500" />
    },
    {
      title: 'Mobile Optimized',
      description: 'Responsive design provides excellent mobile experience',
      icon: <Rocket className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Personalization',
      description: 'Fully customizable dashboard fits your workflow',
      icon: <Settings className="h-6 w-6 text-gray-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <ModernCard gradient="blue" blur="xl" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10" />
          <div className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Advanced Features Demo
                </h1>
                <p className="text-gray-600 font-medium mt-2 text-lg">
                  Experience next-generation interaction methods
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-500">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Voice Navigation Demo */}
        <ModernCard gradient="none" blur="lg" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Voice Navigation Demo</h2>
              <p className="text-gray-600">Try the voice commands below</p>
            </div>
          </div>
          
          <VoiceNavigationSystem className="mb-6" />
        </ModernCard>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <ModernCard
              key={feature.id}
              gradient="none"
              blur="lg"
              className="p-6 hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                  {feature.icon}
                  <div className="text-white text-xs">
                    {feature.icon}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{feature.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      {feature.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">How to use:</h4>
                    <ul className="space-y-1">
                      {feature.commands.map((command, cmdIndex) => (
                        <li key={cmdIndex} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {command}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </ModernCard>
          ))}
        </div>

        {/* Customizable Widgets Demo */}
        <div className="space-y-6">
          <ModernCard gradient="none" blur="lg" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Customizable Widgets</h2>
                <p className="text-gray-600">Personalize your dashboard layout</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 text-sm">
                💡 <strong>Pro Tip:</strong> Click "Edit Mode" to start customizing, then drag widgets to reorder them!
              </p>
            </div>
          </ModernCard>

          <CustomizableWidgets />
        </div>

        {/* Achievements */}
        <ModernCard gradient="none" blur="lg" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Key Achievements</h2>
              <p className="text-gray-600">What these features bring to your experience</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {achievement.icon}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>

        {/* Getting Started */}
        <ModernCard gradient="purple" blur="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10" />
          <div className="relative p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Explore?</h2>
              <p className="text-gray-600 mb-6 text-lg">
                All features are now active and ready to use throughout your application
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  <Mic className="h-4 w-4 mr-2" />
                  Try Voice Commands
                </Button>
                
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                  <Layout className="h-4 w-4 mr-2" />
                  Customize Widgets
                </Button>
                
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                <p>💡 Simply say "Help" for voice commands or use the responsive mobile interface</p>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}