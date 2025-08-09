'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import SearchTrigger from '@/components/GlobalSearch/SearchTrigger';
import SearchDashboard from '@/components/GlobalSearch/SearchDashboard';
import { searchAnalytics } from '@/lib/search/searchAnalytics';
import { 
  Search, 
  Brain, 
  Filter, 
  TrendingUp, 
  Sparkles,
  BookOpen,
  BarChart3,
  Settings,
  Lightbulb
} from 'lucide-react';

export default function SearchPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const { indexData, getSearchStats } = useGlobalSearch();
  
  const [activeTab, setActiveTab] = useState<'search' | 'analytics'>('search');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    loadSearchData();
  }, []);

  const loadSearchData = async () => {
    try {
      // Get search statistics
      const stats = getSearchStats();
      setSearchStats(stats);
      
      // Get suggestions
      const suggestions = searchAnalytics.generateSuggestions();
      setSuggestions(suggestions);
      
      // Load recent queries from storage
      const stored = localStorage.getItem('searchHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setRecentQueries(history.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  };

  const handleReindexData = async () => {
    await indexData();
    loadSearchData();
  };

  const searchExamples = [
    {
      query: "restaurant expenses last month",
      description: "Find all restaurant spending from the previous month",
      type: "Natural Language"
    },
    {
      query: "contacts from Microsoft",
      description: "Search for contacts working at Microsoft",
      type: "Filtered Search"
    },
    {
      query: "diary entries about work",
      description: "Find diary entries mentioning work topics",
      type: "Content Search"
    },
    {
      query: "expenses over $100",
      description: "Find high-value expense transactions",
      type: "Amount Filter"
    },
    {
      query: "calendar events this week",
      description: "Show upcoming calendar events",
      type: "Time Range"
    },
    {
      query: "photos from vacation",
      description: "Find photos tagged with vacation",
      type: "Tag Search"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('search') || 'Advanced Search'}
                </h1>
                <p className="text-gray-600 font-medium mt-1">
                  Search across all your data with natural language and AI-powered filters
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setActiveTab('search')}
                variant={activeTab === 'search' ? 'primary' : 'outline'}
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                onClick={() => setActiveTab('analytics')}
                variant={activeTab === 'analytics' ? 'primary' : 'outline'} 
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        <main className="space-y-8">
        {activeTab === 'analytics' ? (
          <SearchDashboard />
        ) : (
          <div className="space-y-8">
            {/* Search Interface */}
            <Card className="glass-widget p-6">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                    Search Everything
                  </h2>
                  <p className="text-gray-600 font-medium mb-6">
                    Use natural language to find exactly what you're looking for
                  </p>
                  
                  <div className="max-w-2xl mx-auto">
                    <SearchTrigger 
                      variant="input"
                      placeholder="Try 'restaurant expenses last month' or 'contacts from work'"
                      size="lg"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Search Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-fit mx-auto mb-4">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-black text-lg mb-2">Natural Language</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Search using everyday language, just like talking to a person
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-fit mx-auto mb-4">
                      <Filter className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-black text-lg mb-2">Smart Filters</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      AI-powered filters that understand your intent and patterns
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl w-fit mx-auto mb-4">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-black text-lg mb-2">Global Search</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Search across expenses, contacts, diary, calendar, and more
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Statistics */}
            {searchStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass-widget p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black mb-1">Searchable Items</p>
                        <p className="text-3xl font-bold text-primary">{searchStats.totalDocuments}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-widget p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black mb-1">Data Types</p>
                        <p className="text-3xl font-bold text-primary">
                          {Object.keys(searchStats.documentsByType).length}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-widget p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black mb-1">Index Size</p>
                        <p className="text-3xl font-bold text-primary">{searchStats.indexSize}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-widget p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black mb-1">Words Indexed</p>
                        <p className="text-3xl font-bold text-primary">{searchStats.totalWords}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl">
                        <Search className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Queries and Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Search Examples */}
              <Card className="glass-widget p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-black">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <span>Search Examples</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Try these example queries to see what's possible
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {searchExamples.map((example, index) => (
                      <div key={index} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono bg-primary/10 text-primary px-3 py-1 rounded-lg font-medium">
                            {example.query}
                          </code>
                          <Badge variant="outline" className="text-xs bg-white/80">
                            {example.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{example.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions and Recent */}
              <div className="space-y-6">
                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <Card className="glass-widget p-6">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="flex items-center space-x-2 text-lg font-bold text-black">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <span>Smart Suggestions</span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Personalized suggestions based on your usage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-3">
                        {suggestions.slice(0, 5).map((suggestion, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-300">
                            <span className="text-sm font-medium text-black">{suggestion.text}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Queries */}
                {recentQueries.length > 0 && (
                  <Card className="glass-widget p-6">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="flex items-center space-x-2 text-lg font-bold text-black">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span>Recent Searches</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-3">
                        {recentQueries.map((query, index) => (
                          <div key={index} className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-300 cursor-pointer">
                            <code className="text-sm font-mono text-primary font-medium">{query}</code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Index Management */}
                <Card className="glass-widget p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg font-bold text-black">
                      <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      <span>Search Index</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">
                      Manage your search data and indexing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <Button onClick={handleReindexData} className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Reindex All Data
                      </Button>
                      <p className="text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                        <strong>Last updated:</strong> {new Date().toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}