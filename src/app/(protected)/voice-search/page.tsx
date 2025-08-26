'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  Search, 
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MapPin,
  ImageIcon,
  Globe,
  Loader2,
  ExternalLink,
  Clock,
  Star,
  Filter,
  RefreshCw,
  Eye,
  Map
} from 'lucide-react';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  score: number;
  img_src?: string;
  thumbnail_src?: string;
  template?: string;
}

interface ImageResult {
  title: string;
  url: string;
  img_src: string;
  thumbnail_src: string;
  content: string;
  engine: string;
}

interface PlaceResult {
  title: string;
  url: string;
  content: string;
  address?: string | Record<string, any>;
  coordinates?: [number, number];
  img_src?: string;
  engine: string;
}

interface SmartSearchResult {
  enhancedQuery: string;
  intent: 'web' | 'images' | 'places' | 'weather' | 'news' | 'shopping';
  confidence: number;
  suggestions: string[];
  summary?: string;
}

interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
  intent: string;
}

// Add this after imports for SpeechRecognition type support
// @ts-expect-error: TypeScript does not have built-in types for SpeechRecognition in all environments
// This alias allows useRef<SpeechRecognition | null>
type SpeechRecognition = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

export default function VoiceSearchPage() {
  const { language, voiceSettings } = useSettings();
  const { t } = useTranslation(language);
  
  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'web' | 'images' | 'places'>('web');
  
  // Smart search state
  const [smartResult, setSmartResult] = useState<SmartSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [resultSummary, setResultSummary] = useState<string>('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs for voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Convert blob to base64 for voice processing
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Text-to-speech function
  const speakText = useCallback((text: string) => {
    if (!voiceSettings.voiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSettings.voiceSpeed;
    utterance.volume = voiceSettings.voiceVolume;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [voiceSettings]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Start voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);

      // Use Web Speech API for real-time transcription if available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        // Support multiple languages for voice recognition
        recognition.lang = getVoiceLanguageCode(language);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceTranscript(transcript);
          setQuery(transcript);
          setIsRecording(false);
          
          // Auto-search after voice input
          if (transcript.trim()) {
            performSearch(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          setError(`Voice recognition error: ${event.error}`);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } else {
        // Fallback to audio recording for server processing
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          
          // Process audio for transcription (you could integrate with your N8N or other service)
          await processVoiceInput(audioBlob);
          setIsRecording(false);
        };

        mediaRecorder.start();
      }
    } catch (err: any) {
      setError(`Failed to start voice recording: ${err.message}`);
      setIsRecording(false);
    }
  }, [language]);

  // Stop voice recording
  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Process voice input (fallback method)
  const processVoiceInput = useCallback(async (audioBlob: Blob) => {
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      
      // Send to your N8N service for transcription
      const response = await fetch('https://n8n.1000273.xyz/webhook/voice-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          language: language === 'ar' ? 'ar' : 'en'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const transcript = result.transcript || result.text || '';
        setVoiceTranscript(transcript);
        setQuery(transcript);
        
        if (transcript.trim()) {
          performSearch(transcript);
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setError('Failed to process voice input');
    }
  }, [blobToBase64, language]);

  // Get voice recognition language code
  const getVoiceLanguageCode = useCallback((lang: string): string => {
    const languageMap: { [key: string]: string } = {
      'en': 'en-US',
      'ar': 'ar-SA',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'hi': 'hi-IN',
      'tr': 'tr-TR',
      'nl': 'nl-NL',
      'sv': 'sv-SE',
      'da': 'da-DK',
      'no': 'nb-NO',
      'fi': 'fi-FI',
      'pl': 'pl-PL',
      'cs': 'cs-CZ',
      'hu': 'hu-HU',
      'ro': 'ro-RO',
      'bg': 'bg-BG',
      'hr': 'hr-HR',
      'sk': 'sk-SK',
      'sl': 'sl-SI',
      'et': 'et-EE',
      'lv': 'lv-LV',
      'lt': 'lt-LT',
      'mt': 'mt-MT',
      'el': 'el-GR',
      'he': 'he-IL',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'id': 'id-ID',
      'ms': 'ms-MY',
      'tl': 'tl-PH',
      'sw': 'sw-KE',
      'am': 'am-ET',
      'bn': 'bn-BD',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'mr': 'mr-IN',
      'ne': 'ne-NP',
      'pa': 'pa-IN',
      'si': 'si-LK',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'ur': 'ur-PK',
      'fa': 'fa-IR',
      'ka': 'ka-GE',
      'hy': 'hy-AM',
      'az': 'az-AZ',
      'kk': 'kk-KZ',
      'ky': 'ky-KG',
      'mn': 'mn-MN',
      'my': 'my-MM',
      'km': 'km-KH',
      'lo': 'lo-LA',
      'is': 'is-IS'
    };
    
    return languageMap[lang] || 'en-US';
  }, []);

  // Detect language from text
  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.language || language;
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }
    
    return language;
  }, [language]);

  // Translate query if needed
  const translateQuery = useCallback(async (query: string, fromLang: string, toLang: string = 'en'): Promise<string> => {
    if (fromLang === toLang) return query;
    
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          from: fromLang,
          to: toLang
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.translatedText || query;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
    
    return query;
  }, []);

  // Basic intent detection fallback
  const detectIntent = useCallback((query: string): 'web' | 'images' | 'places' | 'weather' | 'news' | 'shopping' => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('forecast')) {
      return 'web'; // Weather searches go to web for now
    }
    if (lowerQuery.includes('image') || lowerQuery.includes('photo') || lowerQuery.includes('picture')) {
      return 'images';
    }
    if (lowerQuery.includes('location') || lowerQuery.includes('place') || lowerQuery.includes('near me') || 
        lowerQuery.includes('restaurant') || lowerQuery.includes('hotel')) {
      return 'places';
    }
    if (lowerQuery.includes('news') || lowerQuery.includes('latest') || lowerQuery.includes('today')) {
      return 'web';
    }
    if (lowerQuery.includes('buy') || lowerQuery.includes('price') || lowerQuery.includes('shop')) {
      return 'web';
    }
    
    return 'web';
  }, []);

  // Generate search suggestions
  const generateSuggestions = useCallback((query: string): string[] => {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('weather')) {
      suggestions.push(`${query} today`, `${query} forecast`, `${query} this week`);
    } else if (lowerQuery.includes('restaurant')) {
      suggestions.push(`${query} near me`, `best ${query}`, `${query} reviews`);
    } else {
      suggestions.push(`${query} 2024`, `latest ${query}`, `best ${query}`);
    }
    
    return suggestions.slice(0, 3);
  }, []);

  // Smart query enhancement using AI
  const enhanceQuery = useCallback(async (rawQuery: string): Promise<SmartSearchResult> => {
    try {
      setIsEnhancing(true);
      
      const response = await fetch('/api/ai/enhance-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: rawQuery,
          language,
          context: searchHistory.slice(-5) // Last 5 searches for context
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          enhancedQuery: result.enhancedQuery || rawQuery,
          intent: result.intent || 'web',
          confidence: result.confidence || 0.5,
          suggestions: result.suggestions || [],
          summary: result.summary
        };
      }
    } catch (error) {
      console.error('Query enhancement error:', error);
    } finally {
      setIsEnhancing(false);
    }
    
    // Fallback: basic intent detection
    const intent = detectIntent(rawQuery);
    return {
      enhancedQuery: rawQuery,
      intent,
      confidence: 0.7,
      suggestions: generateSuggestions(rawQuery)
    };
  }, [language, searchHistory, detectIntent, generateSuggestions]);


  // Add to search history
  const addToHistory = useCallback((query: string, resultCount: number, intent: string) => {
    const newEntry: SearchHistory = {
      query,
      timestamp: new Date(),
      resultCount,
      intent
    };
    
    setSearchHistory(prev => [newEntry, ...prev.slice(0, 49)]); // Keep last 50 searches
  }, []);

  // Perform search using SearXNG with smart enhancements
  const performSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setResultSummary('');
    
    try {
      // Detect language of the query
      const detectedLang = await detectLanguage(searchQuery);
      setDetectedLanguage(detectedLang);
      
      // Translate query to English if needed for better search results
      const translatedQuery = detectedLang !== 'en' ? await translateQuery(searchQuery, detectedLang, 'en') : searchQuery;
      
      // First, enhance the query with AI
      const smartResult = await enhanceQuery(translatedQuery);
      setSmartResult(smartResult);
      setSuggestions(smartResult.suggestions);
      
      // Use enhanced query for search
      const enhancedQuery = smartResult.enhancedQuery;
      
      // Auto-switch tab based on detected intent
      if (smartResult.confidence > 0.8) {
        setActiveTab(smartResult.intent === 'weather' || smartResult.intent === 'news' || smartResult.intent === 'shopping' ? 'web' : smartResult.intent);
      }
      
      // Search for web results using local API proxy
      const webResponse = await fetch(`/api/search?q=${encodeURIComponent(enhancedQuery)}&categories=general&format=json&safesearch=1`);
      const webData = await webResponse.json();
      
      // Search for images
      const imageResponse = await fetch(`/api/search?q=${encodeURIComponent(enhancedQuery)}&categories=images&format=json&safesearch=1`);
      const imageData = await imageResponse.json();
      
      // Search for places/maps
      const placeResponse = await fetch(`/api/search?q=${encodeURIComponent(enhancedQuery)}&categories=map&format=json&safesearch=1`);
      const placeData = await placeResponse.json();
      
      // Process results with error handling for each response
      if (webData.error) {
        console.warn('Web search error:', webData.error);
      }
      if (imageData.error) {
        console.warn('Image search error:', imageData.error);
      }
      if (placeData.error) {
        console.warn('Places search error:', placeData.error);
      }

      // Debug log the responses
      console.log('Search responses:', {
        web: webData,
        images: imageData,
        places: placeData
      });

      // Debug image URLs specifically
      if (imageData.results && imageData.results.length > 0) {
        console.log('Image search returned', imageData.results.length, 'results');
        console.log('First few image results:', imageData.results.slice(0, 3).map(img => ({
          title: img.title,
          img_src: img.img_src,
          thumbnail_src: img.thumbnail_src,
          url: img.url,
          engine: img.engine
        })));
        
        // Count how many images have valid URLs
        const validImages = imageData.results.filter(img => {
          const imageUrl = img.img_src || img.thumbnail_src;
          try {
            if (!imageUrl || typeof imageUrl !== 'string') return false;
            new URL(imageUrl);
            return true;
          } catch {
            return false;
          }
        });
        console.log(`${validImages.length} out of ${imageData.results.length} images have valid URLs`);
      } else {
        console.log('No image results returned or imageData.results is empty/invalid');
        console.log('imageData structure:', imageData);
      }

      // Set results or empty arrays if there are errors
      const webResults = webData.results || [];
      const imageResultsData = imageData.results || [];
      const placeResultsData = placeData.results || [];
      
      setSearchResults(webResults);
      setImageResults(imageResultsData);
      setPlaceResults(placeResultsData);
      
      // Add to search history
      const totalResults = webResults.length + imageResultsData.length + placeResultsData.length;
      addToHistory(searchQuery, totalResults, smartResult.intent);
      
      // Generate AI summary and follow-up questions if we have results
      if (totalResults > 0) {
        generateResultSummary(webResults, smartResult.intent, enhancedQuery);
        generateFollowUpQuestions(enhancedQuery, smartResult.intent, webResults);
      }
      
      // Announce results if voice is enabled
      if (voiceSettings.voiceEnabled && voiceSettings.autoPlayResponses) {
        const announcement = smartResult.summary || 
          `Found ${totalResults} results for ${searchQuery}. ${smartResult.confidence > 0.8 ? `I detected this is a ${smartResult.intent} search.` : ''}`;
        speakText(announcement);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, voiceSettings, speakText, enhanceQuery, addToHistory, detectLanguage, translateQuery]);

  // Generate AI summary of search results
  const generateResultSummary = useCallback(async (results: SearchResult[], intent: string, query: string) => {
    try {
      const topResults = results.slice(0, 5).map(r => ({
        title: r.title,
        content: r.content.substring(0, 200)
      }));
      
      const response = await fetch('/api/ai/summarize-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          intent,
          results: topResults,
          language
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResultSummary(data.summary || '');
      }
    } catch (error) {
      console.error('Summary generation error:', error);
    }
  }, [language]);

  // Generate contextual follow-up questions
  const generateFollowUpQuestions = useCallback(async (query: string, intent: string, results: SearchResult[]) => {
    try {
      const response = await fetch('/api/ai/follow-up-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          intent,
          results: results.slice(0, 3).map(r => ({ title: r.title, content: r.content.substring(0, 150) })),
          language
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowUpQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Follow-up questions error:', error);
    }
  }, [language]);

  // Handle search form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  }, [performSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl">
              <Search className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Voice Search
              </h1>
              <p className="text-gray-600 font-medium text-lg flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-500" />
                Search the web, images, and places with your voice
              </p>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-blue-600" />
                  Search Query
                </CardTitle>
                <CardDescription>
                  Type your search or use voice input
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter your search query..."
                        className="pr-12 h-12 text-lg"
                        disabled={isSearching}
                      />
                      {query && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setQuery('')}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSearching || !query.trim()}
                      className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {isSearching ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  
                  {voiceTranscript && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Voice input:</strong> "{voiceTranscript}"
                      </p>
                    </div>
                  )}
                  
                  {/* Smart Query Enhancement Display */}
                  {isEnhancing && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <p className="text-sm text-purple-800">Enhancing your search with AI...</p>
                    </div>
                  )}
                  
                  {smartResult && smartResult.enhancedQuery !== query && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Enhanced query:</strong> "{smartResult.enhancedQuery}"
                        <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">
                          {smartResult.intent} ({Math.round(smartResult.confidence * 100)}% confidence)
                        </span>
                        {detectedLanguage && detectedLanguage !== language && (
                          <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                            Detected: {detectedLanguage.toUpperCase()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Voice Controls */}
          <div>
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-green-600" />
                  Voice Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voice Input Button */}
                <Button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={isSearching}
                  className={`w-full h-16 text-lg font-medium transition-all duration-300 ${
                    isRecording 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 animate-pulse' 
                      : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-6 w-6 mr-3" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-6 w-6 mr-3" />
                      Start Voice Search
                    </>
                  )}
                </Button>

                {/* Stop Speaking Button */}
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    variant="outline"
                    className="w-full"
                  >
                    <VolumeX className="h-4 w-4 mr-2" />
                    Stop Speaking
                  </Button>
                )}

                {/* Voice Status */}
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-full">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    isRecording ? 'bg-red-500 animate-pulse' :
                    isSpeaking ? 'bg-green-500 animate-pulse' :
                    isSearching ? 'bg-yellow-500 animate-pulse' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-600">
                    {isRecording ? 'Listening...' :
                     isSpeaking ? 'Speaking...' :
                     isSearching ? 'Searching...' :
                     'Ready'}
                  </span>
                </div>

                {/* Voice Commands Help */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 text-sm mb-1">Voice Commands:</h4>
                  <ul className="text-xs text-green-700 space-y-0.5">
                    <li>• "Search for [query]"</li>
                    <li>• "Find images of [subject]"</li>
                    <li>• "Show me places in [location]"</li>
                    <li>• "Weather in [city]"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 border-2 border-red-200 rounded-2xl mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-red-700 font-medium">{error}</p>
                <Button
                  onClick={() => setError(null)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Smart Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                    }}
                    className="text-sm hover:bg-blue-50"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* AI Result Summary */}
        {resultSummary && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-blue-600" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{resultSummary}</p>
              {voiceSettings.voiceEnabled && (
                <Button
                  onClick={() => speakText(resultSummary)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={isSpeaking}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {isSpeaking ? 'Speaking...' : 'Read Summary'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-green-600" />
                Related Questions
              </CardTitle>
              <CardDescription>
                Continue your search with these related questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followUpQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-4 bg-white/60 hover:bg-white/80 border-green-200 hover:border-green-300"
                    onClick={() => {
                      setQuery(question);
                      performSearch(question);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{question}</span>
                    </div>
                  </Button>
                ))}
              </div>
              
              {/* Voice Follow-up */}
              {voiceSettings.voiceEnabled && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <Button
                    onClick={() => {
                      const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
                      speakText(`Here's a related question: ${randomQuestion}. Say yes to search for this, or ask your own question.`);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-green-700 hover:text-green-800"
                    disabled={isSpeaking}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Suggest Question
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Tabs */}
        {(searchResults.length > 0 || imageResults.length > 0 || placeResults.length > 0) && (
          <div className="space-y-6">
            {/* Tab Navigation with Smart Intent Indicator */}
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setActiveTab('web')}
                    variant={activeTab === 'web' ? 'primary' : 'ghost'}
                    className={`flex-1 relative ${activeTab === 'web' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : ''}`}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Web ({searchResults.length})
                    {smartResult?.intent === 'web' && smartResult.confidence > 0.8 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('images')}
                    variant={activeTab === 'images' ? 'primary' : 'ghost'}
                    className={`flex-1 relative ${activeTab === 'images' ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white' : ''}`}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Images ({imageResults.length})
                    {smartResult?.intent === 'images' && smartResult.confidence > 0.8 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('places')}
                    variant={activeTab === 'places' ? 'primary' : 'ghost'}
                    className={`flex-1 relative ${activeTab === 'places' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Places ({placeResults.length})
                    {smartResult?.intent === 'places' && smartResult.confidence > 0.8 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </Button>
                </div>
                
                {/* Search History Quick Access */}
                {searchHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.slice(0, 3).map((item, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuery(item.query);
                            performSearch(item.query);
                          }}
                          className="text-xs px-2 py-1 h-auto bg-white/60 hover:bg-white/80"
                        >
                          {item.query.substring(0, 20)}{item.query.length > 20 ? '...' : ''}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Web Results */}
            {activeTab === 'web' && searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.slice(0, 10).map((result, index) => (
                  <Card key={result.url || index} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              {result.title}
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-3">{result.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {result.engine}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Score: {result.score}
                            </span>
                          </div>
                        </div>
                        {result.img_src && (
                          <div className="flex-shrink-0">
                            <img
                              src={result.img_src}
                              alt={result.title}
                              width={120}
                              height={80}
                              className="rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Image Results */}
            {activeTab === 'images' && imageResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageResults.slice(0, 20).filter(image => {
                  const imageUrl = image.img_src || image.thumbnail_src;
                  try {
                    if (!imageUrl || typeof imageUrl !== 'string') return false;
                    new URL(imageUrl); // Test if URL is valid
                    return true;
                  } catch {
                    return false;
                  }
                }).map((image, index) => {
                  const imageUrl = image.img_src || image.thumbnail_src;
                  console.log(`Image ${index}:`, imageUrl); // Debug each image URL
                  
                  let hostname = '';
                  try {
                    hostname = new URL(imageUrl).hostname;
                  } catch {
                    hostname = 'invalid-url';
                  }
                  
                  return (
                    <div key={image.url || index} className="border rounded p-2 bg-white hover:shadow-lg transition-shadow cursor-pointer">
                      <a href={image.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={imageUrl}
                          alt={image.title}
                          width="200"
                          height="200"
                          style={{display: 'block', width: '100%', height: '200px', objectFit: 'cover'}}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/cccccc/000000?text=No+Image';
                          }}
                        />
                        <p className="text-sm mt-1 hover:text-blue-600">{image.title}</p>
                        <small className="text-gray-500">{image.engine}</small>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Image Results */}
            {activeTab === 'images' && imageResults.length === 0 && !isSearching && query && (
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Images Found</h3>
                    <p className="text-gray-600">Try a different search term or check your spelling.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Place Results */}
            {activeTab === 'places' && placeResults.length > 0 && (
              <div className="space-y-4">
                {placeResults.slice(0, 10).map((place, index) => (
                  <Card key={place.url || index} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                            <a href={place.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              {place.title}
                              <MapPin className="h-4 w-4" />
                            </a>
                          </h3>
                          <p className="text-gray-600 mb-3">{place.content}</p>
                          {place.address && (
                            <p className="text-gray-500 text-sm mb-2">
                              📍 {typeof place.address === 'object' 
                                ? Object.values(place.address).filter(Boolean).join(', ')
                                : place.address
                              }
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Map className="h-3 w-3" />
                              {place.engine}
                            </span>
                            {place.coordinates && (
                              <span>
                                {place.coordinates[0]}, {place.coordinates[1]}
                              </span>
                            )}
                          </div>
                        </div>
                        {place.img_src && (
                          <div className="flex-shrink-0">
                            <img
                              src={place.img_src}
                              alt={place.title}
                              width={120}
                              height={80}
                              className="rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Web Results */}
            {activeTab === 'web' && searchResults.length === 0 && !isSearching && query && (
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Web Results Found</h3>
                    <p className="text-gray-600">Try a different search term or check your spelling.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Place Results */}
            {activeTab === 'places' && placeResults.length === 0 && !isSearching && query && (
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Places Found</h3>
                    <p className="text-gray-600">Try searching for a specific location or landmark.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchResults.length === 0 && imageResults.length === 0 && placeResults.length === 0 && !query && (
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mb-6 inline-block">
                  <Search className="h-16 w-16 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Search</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Use voice input or type your query to search the web, find images, and discover places.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={startVoiceRecording}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    size="lg"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Voice Search
                  </Button>
                  <Button
                    onClick={() => setQuery('beautiful places in Oman')}
                    variant="outline"
                    size="lg"
                  >
                    Try Example Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}