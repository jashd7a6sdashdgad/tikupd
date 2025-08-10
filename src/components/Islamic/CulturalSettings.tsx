'use client';

import { useState, useEffect } from 'react';
import { CurrentPrayerTimes } from './CurrentPrayerTimes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Moon,
  Heart,
  Clock,
  MapPin,
  Bell,
  Calendar,
  DollarSign,
  BookOpen,
  Shield,
  Settings,
  Save,
  RotateCcw,
  Star
} from 'lucide-react';

import { prayerTimesService, PrayerSettings } from '@/lib/islamic/prayerTimes';
import { ramadanModeService, RamadanSettings } from '@/lib/islamic/ramadanMode';
import { islamicFinanceService } from '@/lib/islamic/financeCompliance';
import { islamicCalendarService } from '@/lib/islamic/islamicCalendar';

export default function CulturalSettings() {
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(prayerTimesService.getSettings());
  const [ramadanSettings, setRamadanSettings] = useState<RamadanSettings>(ramadanModeService.getSettings());
  const [activeTab, setActiveTab] = useState('prayer');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      setPrayerSettings(prayerTimesService.getSettings());
      setRamadanSettings(ramadanModeService.getSettings());
    };

    loadSettings();
  }, []);

  const handlePrayerSettingsChange = (updates: Partial<PrayerSettings>) => {
    const newSettings = { ...prayerSettings, ...updates };
    setPrayerSettings(newSettings);
    setUnsavedChanges(true);
  };

  const handleRamadanSettingsChange = (updates: Partial<RamadanSettings>) => {
    const newSettings = { ...ramadanSettings, ...updates };
    setRamadanSettings(newSettings);
    setUnsavedChanges(true);
  };

  const saveSettings = () => {
    prayerTimesService.updateSettings(prayerSettings);
    ramadanModeService.updateSettings(ramadanSettings);
    setUnsavedChanges(false);
  };

  const resetToDefaults = () => {
    setPrayerSettings(prayerTimesService.getSettings());
    setRamadanSettings(ramadanModeService.getSettings());
    setUnsavedChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Modern Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={!unsavedChanges}
          size="sm"
          className="bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-orange-200 hover:border-orange-400 text-orange-700 hover:text-orange-800"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={saveSettings}
          disabled={!unsavedChanges}
          size="sm"
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <main className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-2 shadow-lg">
            <TabsTrigger value="prayer" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/50">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Prayer Times</span>
              <span className="sm:hidden">Prayer</span>
            </TabsTrigger>
            <TabsTrigger value="ramadan" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/50">
              <Moon className="h-4 w-4" />
              <span>Ramadan</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/50">
              <Shield className="h-4 w-4" />
              <span>Finance</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/50">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-black data-[state=active]:font-bold rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/50">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
          </TabsList>

          {/* Prayer Times Settings */}
          <TabsContent value="prayer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calculation Method */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                      <Clock className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Calculation Settings</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Configure how prayer times are calculated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculationMethod">Calculation Method</Label>
                    <Select
                      value={prayerSettings.calculationMethod}
                      onValueChange={(value: any) => 
                        handlePrayerSettingsChange({ calculationMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MWL">Muslim World League</SelectItem>
                        <SelectItem value="ISNA">Islamic Society of North America</SelectItem>
                        <SelectItem value="Egypt">Egyptian General Authority</SelectItem>
                        <SelectItem value="Makkah">Umm Al-Qura University, Makkah</SelectItem>
                        <SelectItem value="Karachi">University of Islamic Sciences, Karachi</SelectItem>
                        <SelectItem value="Tehran">Institute of Geophysics, Tehran</SelectItem>
                        <SelectItem value="Jafari">Shia Ithna-Ashari (Jafari)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="madhab">Madhab (School of Thought)</Label>
                    <Select
                      value={prayerSettings.madhab}
                      onValueChange={(value: any) => 
                        handlePrayerSettingsChange({ madhab: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shafi">Shafi</SelectItem>
                        <SelectItem value="Hanafi">Hanafi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Location Settings */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                      <MapPin className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Location</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Set your location for accurate prayer times
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={prayerSettings.location.useAutoLocation}
                      onCheckedChange={(checked) =>
                        handlePrayerSettingsChange({
                          location: { ...prayerSettings.location, useAutoLocation: checked }
                        })
                      }
                    />
                    <Label>Use automatic location detection</Label>
                  </div>

                  {!prayerSettings.location.useAutoLocation && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={prayerSettings.location.manualLocation?.city || ''}
                            onChange={(e) =>
                              handlePrayerSettingsChange({
                                location: {
                                  ...prayerSettings.location,
                                  manualLocation: {
                                    ...prayerSettings.location.manualLocation!,
                                    city: e.target.value
                                  }
                                }
                              })
                            }
                            placeholder="Muscat"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={prayerSettings.location.manualLocation?.country || ''}
                            onChange={(e) =>
                              handlePrayerSettingsChange({
                                location: {
                                  ...prayerSettings.location,
                                  manualLocation: {
                                    ...prayerSettings.location.manualLocation!,
                                    country: e.target.value
                                  }
                                }
                              })
                            }
                            placeholder="Oman"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.0001"
                            value={prayerSettings.location.manualLocation?.latitude || ''}
                            onChange={(e) =>
                              handlePrayerSettingsChange({
                                location: {
                                  ...prayerSettings.location,
                                  manualLocation: {
                                    ...prayerSettings.location.manualLocation!,
                                    latitude: parseFloat(e.target.value) || 0
                                  }
                                }
                              })
                            }
                            placeholder="23.6100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.0001"
                            value={prayerSettings.location.manualLocation?.longitude || ''}
                            onChange={(e) =>
                              handlePrayerSettingsChange({
                                location: {
                                  ...prayerSettings.location,
                                  manualLocation: {
                                    ...prayerSettings.location.manualLocation!,
                                    longitude: parseFloat(e.target.value) || 0
                                  }
                                }
                              })
                            }
                            placeholder="58.5922"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-md">
                      <Bell className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Notifications</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Configure prayer time notifications and reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={prayerSettings.notifications.enabled}
                      onCheckedChange={(checked) =>
                        handlePrayerSettingsChange({
                          notifications: { ...prayerSettings.notifications, enabled: checked }
                        })
                      }
                    />
                    <Label>Enable prayer time notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={prayerSettings.notifications.adhanSound}
                      onCheckedChange={(checked) =>
                        handlePrayerSettingsChange({
                          notifications: { ...prayerSettings.notifications, adhanSound: checked }
                        })
                      }
                    />
                    <Label>Play Adhan sound</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={prayerSettings.notifications.muteDuringMeetings}
                      onCheckedChange={(checked) =>
                        handlePrayerSettingsChange({
                          notifications: { ...prayerSettings.notifications, muteDuringMeetings: checked }
                        })
                      }
                    />
                    <Label>Mute during meetings</Label>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-700 font-semibold">Reminder Times (minutes before prayer)</Label>
                    <div className="flex flex-wrap gap-3">
                      {[5, 10, 15, 30, 60].map(minutes => (
                        <Badge
                          key={minutes}
                          variant={prayerSettings.notifications.reminderMinutes.includes(minutes) ? 'default' : 'outline'}
                          className={`cursor-pointer px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                            prayerSettings.notifications.reminderMinutes.includes(minutes) 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-black border-2 border-blue-300 shadow-md hover:shadow-lg' 
                              : 'bg-white/70 text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            const currentReminders = prayerSettings.notifications.reminderMinutes;
                            const newReminders = currentReminders.includes(minutes)
                              ? currentReminders.filter(m => m !== minutes)
                              : [...currentReminders, minutes].sort((a, b) => b - a);
                            
                            handlePrayerSettingsChange({
                              notifications: { ...prayerSettings.notifications, reminderMinutes: newReminders }
                            });
                          }}
                        >
                          {minutes}m
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Prayer Times Display */}
              <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                      <Clock className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Today's Prayer Times</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Current prayer times with adjustments applied
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CurrentPrayerTimes settings={prayerSettings} />
                </CardContent>
              </Card>

              {/* Prayer Time Adjustments */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-md">
                      <Settings className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Manual Adjustments</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Fine-tune prayer times (in minutes)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(prayerSettings.adjustments).map(([prayer, adjustment]) => (
                    <div key={prayer} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                      <Label className="capitalize font-semibold text-gray-700">{prayer}</Label>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePrayerSettingsChange({
                              adjustments: {
                                ...prayerSettings.adjustments,
                                [prayer]: adjustment - 1
                              }
                            })
                          }
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-16 text-center font-mono">
                          {adjustment > 0 ? '+' : ''}{adjustment}m
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePrayerSettingsChange({
                              adjustments: {
                                ...prayerSettings.adjustments,
                                [prayer]: adjustment + 1
                              }
                            })
                          }
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Positive values make prayer times later, negative values make them earlier. 
                      Adjustments are useful for personal preferences or local variations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ramadan Settings */}
          <TabsContent value="ramadan" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ramadan Mode */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
                      <Moon className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Ramadan Mode</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Enable special features during the holy month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.enabled}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({ enabled: checked })
                      }
                    />
                    <Label>Enable Ramadan Mode</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.autoDetect}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({ autoDetect: checked })
                      }
                    />
                    <Label>Auto-detect Ramadan period</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Fasting Reminders */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md">
                      <Clock className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Fasting Reminders</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Configure Suhoor and Iftar notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.fastingReminders.enabled}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({
                          fastingReminders: { ...ramadanSettings.fastingReminders, enabled: checked }
                        })
                      }
                    />
                    <Label>Enable fasting reminders</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Suhoor reminder (minutes before Fajr)</Label>
                      <Input
                        type="number"
                        value={ramadanSettings.fastingReminders.suhoorReminder}
                        onChange={(e) =>
                          handleRamadanSettingsChange({
                            fastingReminders: {
                              ...ramadanSettings.fastingReminders,
                              suhoorReminder: parseInt(e.target.value) || 30
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Iftar reminder (minutes before Maghrib)</Label>
                      <Input
                        type="number"
                        value={ramadanSettings.fastingReminders.iftarReminder}
                        onChange={(e) =>
                          handleRamadanSettingsChange({
                            fastingReminders: {
                              ...ramadanSettings.fastingReminders,
                              iftarReminder: parseInt(e.target.value) || 15
                            }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ramadanSettings.fastingReminders.suhoorRecipesSuggestions}
                        onCheckedChange={(checked) =>
                          handleRamadanSettingsChange({
                            fastingReminders: {
                              ...ramadanSettings.fastingReminders,
                              suhoorRecipesSuggestions: checked
                            }
                          })
                        }
                      />
                      <Label>Suhoor recipe suggestions</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ramadanSettings.fastingReminders.iftarRecipesSuggestions}
                        onCheckedChange={(checked) =>
                          handleRamadanSettingsChange({
                            fastingReminders: {
                              ...ramadanSettings.fastingReminders,
                              iftarRecipesSuggestions: checked
                            }
                          })
                        }
                      />
                      <Label>Iftar recipe suggestions</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Spiritual Goals */}
              <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
                      <BookOpen className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Spiritual Goals</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Set your spiritual objectives for Ramadan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Daily Quran reading goal (pages)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={ramadanSettings.spiritual.quranReadingGoal}
                      onChange={(e) =>
                        handleRamadanSettingsChange({
                          spiritual: {
                            ...ramadanSettings.spiritual,
                            quranReadingGoal: parseInt(e.target.value) || 1
                          }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ramadanSettings.spiritual.dhikrReminders}
                        onCheckedChange={(checked) =>
                          handleRamadanSettingsChange({
                            spiritual: { ...ramadanSettings.spiritual, dhikrReminders: checked }
                          })
                        }
                      />
                      <Label>Dhikr reminders</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ramadanSettings.spiritual.charityTracking}
                        onCheckedChange={(checked) =>
                          handleRamadanSettingsChange({
                            spiritual: { ...ramadanSettings.spiritual, charityTracking: checked }
                          })
                        }
                      />
                      <Label>Charity tracking</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ramadanSettings.spiritual.qiyamAlLaylReminders}
                        onCheckedChange={(checked) =>
                          handleRamadanSettingsChange({
                            spiritual: { ...ramadanSettings.spiritual, qiyamAlLaylReminders: checked }
                          })
                        }
                      />
                      <Label>Qiyam al-Layl (night prayer) reminders</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wellness Settings */}
              <Card className="bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 border-2 border-pink-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-md">
                      <Heart className="h-5 w-5 text-black font-bold" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Wellness</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Health and wellness reminders during fasting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.wellness.hydrationReminders}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({
                          wellness: { ...ramadanSettings.wellness, hydrationReminders: checked }
                        })
                      }
                    />
                    <Label>Hydration reminders after Iftar</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.wellness.restReminders}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({
                          wellness: { ...ramadanSettings.wellness, restReminders: checked }
                        })
                      }
                    />
                    <Label>Rest reminders</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.wellness.moderateExerciseOnly}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({
                          wellness: { ...ramadanSettings.wellness, moderateExerciseOnly: checked }
                        })
                      }
                    />
                    <Label>Moderate exercise recommendations only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ramadanSettings.wellness.fastingHealthTips}
                      onCheckedChange={(checked) =>
                        handleRamadanSettingsChange({
                          wellness: { ...ramadanSettings.wellness, fastingHealthTips: checked }
                        })
                      }
                    />
                    <Label>Fasting health tips</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Islamic Finance Settings */}
          <TabsContent value="finance" className="space-y-6">
            <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                    <Shield className="h-6 w-6 text-black font-bold" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Halal Investment Screening</span>
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium text-lg">
                  Configure Islamic finance compliance checking for your investments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Screening Criteria</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Maximum Debt Ratio (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
value="33"
                          placeholder="33"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Commonly accepted: 33%
                        </p>
                      </div>

                      <div>
                        <Label>Maximum Interest Income Ratio (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
value="5"
                          placeholder="5"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Commonly accepted: 5%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Prohibited Industries</h4>
                    <div className="space-y-2">
                      {[
                        'Alcohol & Tobacco',
                        'Gambling & Casinos',
                        'Conventional Banking',
                        'Insurance',
                        'Adult Entertainment',
                        'Weapons Manufacturing',
                        'Pork Products'
                      ].map(industry => (
                        <div key={industry} className="flex items-center space-x-2">
                          <Switch checked={true} />
                          <Label className="text-sm">{industry}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Preferred Shariah Boards</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'AAOIFI',
                      'Dow Jones Islamic',
                      'FTSE Shariah',
                      'MSCI Islamic',
                      'S&P Shariah'
                    ].map(board => (
                      <Badge key={board} variant="outline" className="cursor-pointer">
                        {board}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Islamic Calendar Settings */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                    <Calendar className="h-6 w-6 text-black font-bold" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Islamic Calendar Integration</span>
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium text-lg">
                  Display Islamic dates and holidays alongside Gregorian calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={true} />
                  <Label>Show Hijri dates in calendar</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={true} />
                  <Label>Display Islamic holidays</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={true} />
                  <Label>Remind about upcoming Islamic events</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch />
                  <Label>Use Arabic month names</Label>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Holiday Notification Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7, 14, 30].map(days => (
                      <Badge
                        key={days}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        {days} day{days > 1 ? 's' : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Cultural Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 border-2 border-gray-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl shadow-lg">
                    <Settings className="h-6 w-6 text-black font-bold" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">General Cultural Preferences</span>
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium text-lg">
                  Configure language, regional preferences, and cultural adaptations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Preferred Language</Label>
                      <Select value="en" onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                          <SelectItem value="ur">اردو (Urdu)</SelectItem>
                          <SelectItem value="fa">فارسی (Persian)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date Format</Label>
                      <Select value="gregorian" onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gregorian">Gregorian Only</SelectItem>
                          <SelectItem value="hijri">Hijri Only</SelectItem>
                          <SelectItem value="both">Both (Gregorian / Hijri)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Week Start</Label>
                      <Select value="sunday" onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="monday">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>Use Islamic greetings</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>Show Islamic quotes and reminders</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>Respect prayer times in scheduling</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>Friday (Jummah) considerations</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Floating Save Button */}
        {unsavedChanges && (
          <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-1 shadow-2xl border border-white/30">
              <Button 
                onClick={saveSettings} 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-black font-bold shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 rounded-2xl px-8 py-4 border-2 border-emerald-300 hover:border-emerald-200"
              >
                <Save className="h-5 w-5 mr-3 animate-pulse" />
                <span className="text-lg">Save All Changes</span>
              </Button>
            </div>
          </div>
        )}
        
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 -z-10 opacity-5">
          <div className="absolute top-1/4 left-1/4 transform -rotate-12">
            <Moon className="h-32 w-32 text-emerald-500" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 transform rotate-12">
            <Star className="h-24 w-24 text-purple-500" />
          </div>
        </div>
      </main>
    </div>
  );
}