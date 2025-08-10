'use client';

import CulturalSettings from '@/components/Islamic/CulturalSettings';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { Moon, Star } from 'lucide-react';

export default function IslamicSettingsPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300 hover:bg-white/90">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl">
                <Moon className="h-10 w-10 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  Islamic Settings
                </h1>
                <p className="text-gray-600 font-medium text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Cultural and religious preferences and features
                </p>
              </div>
            </div>
            
            {/* Decorative Islamic Pattern */}
            <div className="hidden lg:flex items-center space-x-3 opacity-20">
              <Star className="h-8 w-8 text-emerald-500" />
              <Moon className="h-10 w-10 text-emerald-600" />
              <Star className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          
          {/* Quick Stats or Current Status */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl border border-blue-300">
              <span className="text-blue-800 font-semibold text-sm">🕌 Prayer Times Configured</span>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl border border-purple-300">
              <span className="text-purple-800 font-semibold text-sm">🌙 Ramadan Mode Ready</span>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl border border-green-300">
              <span className="text-green-800 font-semibold text-sm">💚 Halal Finance Compliance</span>
            </div>
          </div>
        </div>

        <CulturalSettings />
      </div>
    </div>
  );
}