'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  ArrowLeftRight, 
  Volume2, 
  Copy, 
  Loader2, 
  Languages, 
  Mic,
  MicOff,
  Star,
  StarOff,
  History,
  Brain,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Globe,
  Sparkles
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag?: string;
}

interface TranslationHistory {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
  isFavorite?: boolean;
}

interface TranslationQuality {
  score: number;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

interface SmartSuggestion {
  text: string;
  type: 'grammar' | 'context' | 'style' | 'alternative';
  confidence: number;
  icon: string;
  description: string;
}

const sourceLanguages: Language[] = [
  { code: 'auto', name: 'Auto Detect', flag: '🌐' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
];

const targetLanguages: Language[] = sourceLanguages.filter(lang => lang.code !== 'auto');

export default function SmartTranslatePage() {
  const { language, voiceSettings } = useSettings();
  const { t } = useTranslation(language);
  
  // Basic translation state
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Smart features state
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [translationQuality, setTranslationQuality] = useState<TranslationQuality | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextHint, setContextHint] = useState('');
  const [currentTranslationId, setCurrentTranslationId] = useState<string>('');
  
  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Voice language mapping function
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
      'th': 'th-TH',
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
      'el': 'el-GR',
      'he': 'he-IL',
      'vi': 'vi-VN',
      'id': 'id-ID',
      'ms': 'ms-MY',
      'tl': 'tl-PH',
      'bn': 'bn-BD',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'mr': 'mr-IN',
      'pa': 'pa-IN',
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
      'is': 'is-IS'
    };
    
    return languageMap[lang] || 'en-US';
  }, []);

  // Check voice recognition availability
  const isVoiceRecognitionAvailable = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  // Voice input functionality
  const startVoiceInput = useCallback(async () => {
    try {
      if (!isVoiceRecognitionAvailable()) {
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      
      setIsRecording(true);
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        // For auto-detect, use English by default but we'll detect language from text
        recognition.lang = sourceLang === 'auto' ? 'en-US' : getVoiceLanguageCode(sourceLang);
        
        // If auto-detect and user has used another language before, try that
        if (sourceLang === 'auto' && detectedLanguage) {
          recognition.lang = getVoiceLanguageCode(detectedLanguage);
        }
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSourceText(transcript);
          setIsRecording(false);
          
          // Provide feedback to user
          console.log('Voice input successful:', transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          // Provide user-friendly error messages
          const errorMessages = {
            'not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
            'no-speech': 'No speech detected. Please try speaking more clearly.',
            'audio-capture': 'Microphone not found. Please check your microphone connection.',
            'network': 'Network error. Please check your internet connection.',
            'service-not-allowed': 'Speech recognition service not available.',
            'bad-grammar': 'Speech not recognized. Please try again.'
          };
          
          const errorMessage = errorMessages[event.error as keyof typeof errorMessages] || `Speech recognition error: ${event.error}`;
          alert(errorMessage);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognition.start();
        recognitionRef.current = recognition;
        
        console.log(`Voice recognition started for language: ${recognition.lang}`);
      }
    } catch (error) {
      console.error('Voice input error:', error);
      setIsRecording(false);
      alert('Failed to start voice input. Please check your microphone permissions.');
    }
  }, [sourceLang, detectedLanguage, getVoiceLanguageCode, isVoiceRecognitionAvailable]);
  
  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);
  
  // Favorites functionality
  const toggleFavorite = useCallback((id: string) => {
    setTranslationHistory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  }, []);
  
  const loadFromHistory = useCallback((item: TranslationHistory) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setShowHistory(false);
  }, []);

  const handleSmartTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setIsAnalyzing(true);
    
    try {
      // Step 1: Detect language if auto
      let actualSourceLang = sourceLang;
      if (sourceLang === 'auto') {
        const detectResponse = await fetch('/api/ai/detect-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText })
        });
        
        if (detectResponse.ok) {
          const detectData = await detectResponse.json();
          actualSourceLang = detectData.language || 'en';
          setDetectedLanguage(actualSourceLang);
        }
      }
      
      // Step 2: Enhanced translation with context
      const translationResponse = await fetch('/api/ai/smart-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          source: actualSourceLang,
          target: targetLang,
          context: contextHint,
          previousTranslations: translationHistory.slice(-3)
        })
      });

      if (translationResponse.ok) {
        const data = await translationResponse.json();
        setTranslatedText(data.translatedText || data.translation);
        
        // Step 3: Analyze translation quality
        if (data.quality) {
          setTranslationQuality(data.quality);
        } else {
          await analyzeTranslationQuality(sourceText, data.translatedText || data.translation, actualSourceLang, targetLang);
        }
        
        // Step 4: Generate smart suggestions
        if (data.suggestions) {
          setSmartSuggestions(data.suggestions);
        } else {
          await generateSmartSuggestions(sourceText, data.translatedText || data.translation, actualSourceLang, targetLang);
        }
        
        // Step 5: Add to history
        const translationId = Date.now().toString();
        setCurrentTranslationId(translationId);
        addToHistory(sourceText, data.translatedText || data.translation, actualSourceLang, targetLang, translationId);
        
      } else {
        // Fallback to basic translation
        await handleBasicTranslate();
      }
    } catch (error) {
      console.error('Smart translation error:', error);
      await handleBasicTranslate();
    } finally {
      setIsTranslating(false);
      setIsAnalyzing(false);
    }
  };
  
  const handleBasicTranslate = async () => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          source: sourceLang === 'auto' ? 'en' : sourceLang,
          target: targetLang,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTranslatedText(data.translatedText);
        const translationId = Date.now().toString();
        setCurrentTranslationId(translationId);
        addToHistory(sourceText, data.translatedText, sourceLang, targetLang, translationId);
      } else {
        setTranslatedText('Translation failed. Please try again.');
      }
    } catch (error) {
      setTranslatedText('Network error. Please try again.');
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return; // Can't swap with auto-detect
    
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
    
    // Clear smart features when swapping
    setTranslationQuality(null);
    setSmartSuggestions([]);
    setDetectedLanguage('');
  };

  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      // Comprehensive language mapping for TTS
      const langMap: { [key: string]: string[] } = {
        'en': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'],
        'ar': ['ar-SA', 'ar-EG', 'ar-AE', 'ar-MA', 'ar'],
        'es': ['es-ES', 'es-MX', 'es-AR', 'es-US', 'es'],
        'fr': ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr'],
        'de': ['de-DE', 'de-AT', 'de-CH', 'de'],
        'it': ['it-IT', 'it-CH', 'it'],
        'pt': ['pt-PT', 'pt-BR', 'pt'],
        'ru': ['ru-RU', 'ru'],
        'ja': ['ja-JP', 'ja'],
        'ko': ['ko-KR', 'ko'],
        'zh': ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
        'hi': ['hi-IN', 'hi'],
        'th': ['th-TH', 'th'],
        'tr': ['tr-TR', 'tr'],
        'nl': ['nl-NL', 'nl-BE', 'nl'],
        'sv': ['sv-SE', 'sv'],
        'da': ['da-DK', 'da'],
        'no': ['nb-NO', 'nn-NO', 'no'],
        'fi': ['fi-FI', 'fi'],
        'pl': ['pl-PL', 'pl'],
        'cs': ['cs-CZ', 'cs'],
        'hu': ['hu-HU', 'hu'],
        'ro': ['ro-RO', 'ro'],
        'bg': ['bg-BG', 'bg'],
        'hr': ['hr-HR', 'hr'],
        'sk': ['sk-SK', 'sk'],
        'sl': ['sl-SI', 'sl'],
        'et': ['et-EE', 'et'],
        'lv': ['lv-LV', 'lv'],
        'lt': ['lt-LT', 'lt'],
        'el': ['el-GR', 'el'],
        'he': ['he-IL', 'he'],
        'vi': ['vi-VN', 'vi'],
        'id': ['id-ID', 'id'],
        'ms': ['ms-MY', 'ms'],
        'tl': ['tl-PH', 'tl'],
        'bn': ['bn-BD', 'bn-IN', 'bn'],
        'gu': ['gu-IN', 'gu'],
        'kn': ['kn-IN', 'kn'],
        'ml': ['ml-IN', 'ml'],
        'mr': ['mr-IN', 'mr'],
        'pa': ['pa-IN', 'pa'],
        'ta': ['ta-IN', 'ta-LK', 'ta'],
        'te': ['te-IN', 'te'],
        'ur': ['ur-PK', 'ur-IN', 'ur'],
        'fa': ['fa-IR', 'fa'],
        'ka': ['ka-GE', 'ka'],
        'hy': ['hy-AM', 'hy'],
        'az': ['az-AZ', 'az']
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      // Try to find a voice that supports the language
      const voices = speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      let selectedVoice: SpeechSynthesisVoice | null = null;
      const langCodes = langMap[lang] || [lang];
      
      // Try each language code in order of preference
      for (const langCode of langCodes) {
        const foundVoice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
        if (foundVoice) {
          selectedVoice = foundVoice;
          break;
        }
        // If exact match not found, try prefix match
        const langPrefix = langCode.split('-')[0];
        const prefixVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
        if (prefixVoice) {
          selectedVoice = prefixVoice;
          break;
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      } else {
        // Fallback to setting language code even without specific voice
        utterance.lang = langCodes[0];
        console.warn(`No voice found for ${lang}, using default with lang: ${langCodes[0]}`);
        
        // For missing voices, show helpful message
        if (lang === 'ar' || lang === 'th') {
          setTimeout(() => {
            if (confirm(`${lang === 'ar' ? 'Arabic' : 'Thai'} voice not installed. Would you like to install it?\n\nGo to Windows Settings → Time & Language → Language → Add ${lang === 'ar' ? 'Arabic' : 'Thai'} → Download Speech pack`)) {
              // Open Windows language settings
              window.open('ms-settings:regionlanguage', '_blank');
            }
          }, 100);
        }
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('TTS Error:', e.error || e);
        setIsSpeaking(false);
        // Show user-friendly message based on error type
        const langName = sourceLanguages.find(l => l.code === lang)?.name || lang;
        if (e.error === 'not-allowed') {
          alert(`Speech synthesis not allowed. Please allow microphone access.`);
        } else if (e.error === 'network') {
          alert(`Speech synthesis failed. Please check your internet connection.`);
        } else if (e.error === 'voice-unavailable') {
          alert(`Voice not available for ${langName}. This language voice may not be installed on your system.`);
        } else {
          alert(`Speech synthesis failed for ${langName}. Please try again or check your system settings.`);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Add AI analysis and smart features
  const analyzeTranslationQuality = useCallback(async (source: string, translation: string, sourceLang: string, targetLang: string) => {
    try {
      const response = await fetch('/api/ai/analyze-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, translation, sourceLang, targetLang })
      });
      
      if (response.ok) {
        const quality = await response.json();
        setTranslationQuality(quality);
      }
    } catch (error) {
      console.error('Quality analysis error:', error);
    }
  }, []);
  
  const generateSmartSuggestions = useCallback(async (source: string, translation: string, sourceLang: string, targetLang: string) => {
    try {
      const response = await fetch('/api/ai/translation-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, translation, sourceLang, targetLang })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSmartSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  }, []);
  
  const addToHistory = useCallback((sourceText: string, translatedText: string, sourceLang: string, targetLang: string, id: string) => {
    const newEntry: TranslationHistory = {
      id,
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: new Date()
    };
    
    setTranslationHistory(prev => [newEntry, ...prev.slice(0, 49)]); // Keep last 50
  }, []);
  
  useEffect(() => {
    const delayedTranslate = setTimeout(() => {
      if (sourceText.trim()) {
        handleSmartTranslate();
      } else {
        setTranslatedText('');
        setTranslationQuality(null);
        setSmartSuggestions([]);
        setDetectedLanguage('');
      }
    }, 800);

    return () => clearTimeout(delayedTranslate);
  }, [sourceText, sourceLang, targetLang, contextHint]);

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        speechSynthesis.getVoices();
      };
      
      // Load voices immediately
      loadVoices();
      
      // Also listen for voiceschanged event
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Smart Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Languages className="h-10 w-10 text-indigo-600" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Smart AI Translator
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            AI-powered translation with context awareness, quality assessment, and smart suggestions
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {sourceLanguages.length - 1} Languages
            </span>
            <span className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              AI Quality Analysis
            </span>
            <span className="flex items-center gap-1">
              <Mic className="h-4 w-4" />
              Voice Input
            </span>
          </div>
        </div>

        {/* Context Hint Input */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-indigo-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Context Hint
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Optional</span>
            </CardTitle>
            <CardDescription>
              Provide context (e.g., "medical", "technical", "business") for more accurate translation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={contextHint}
              onChange={(e) => setContextHint(e.target.value)}
              placeholder="e.g., medical document, technical manual, business email..."
              className="bg-white/60"
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Source Language Panel */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span>From</span>
                  {detectedLanguage && sourceLang === 'auto' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Detected: {sourceLanguages.find(l => l.code === detectedLanguage)?.flag} {sourceLanguages.find(l => l.code === detectedLanguage)?.name}
                    </span>
                  )}
                </CardTitle>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="w-56 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sourceLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Enter text to translate... or use voice input"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="min-h-40 resize-none bg-white/80 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 pr-12"
                  />
                  {isAnalyzing && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-2 text-xs text-indigo-600">
                        <Brain className="h-3 w-3 animate-pulse" />
                        Analyzing...
                      </div>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                        Listening...
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpeak(sourceText, sourceLang === 'auto' ? detectedLanguage || 'en' : sourceLang)}
                    disabled={!sourceText.trim() || isSpeaking || sourceLang === 'auto' && !detectedLanguage}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    {isSpeaking ? 'Stop' : 'Speak'}
                  </Button>
                  
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopVoiceInput : startVoiceInput}
                    disabled={false} // Always allow voice input
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      isRecording 
                        ? 'animate-pulse shadow-md' 
                        : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                    }`}
                    title={isRecording 
                      ? 'Click to stop voice recording' 
                      : sourceLang === 'auto' 
                        ? 'Voice input will help detect language' 
                        : `Voice input in ${sourceLanguages.find(l => l.code === sourceLang)?.name}`
                    }
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 animate-bounce" />
                        <span className="hidden sm:inline">Stop Recording</span>
                        <span className="sm:hidden">Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        <span className="hidden sm:inline">Voice Input</span>
                        <span className="sm:hidden">Voice</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(sourceText)}
                    disabled={!sourceText.trim()}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Language Panel */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span>To</span>
                  {translationQuality && (
                    <div className="flex items-center gap-2">
                      {translationQuality.score >= 80 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        translationQuality.score >= 80 
                          ? 'bg-green-100 text-green-700' 
                          : translationQuality.score >= 60
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        Quality: {translationQuality.score}%
                      </span>
                    </div>
                  )}
                </CardTitle>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-56 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {targetLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="AI-powered translation will appear here..."
                    value={translatedText}
                    readOnly
                    className={`min-h-40 resize-none border-gray-200 cursor-default ${
                      translatedText ? 'bg-white/80' : 'bg-gray-50/80'
                    }`}
                  />
                  {isTranslating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Smart Translating...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpeak(translatedText, targetLang)}
                    disabled={!translatedText.trim() || isSpeaking}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    {isSpeaking ? 'Stop' : 'Speak'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(translatedText)}
                    disabled={!translatedText.trim()}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(currentTranslationId)}
                    disabled={!currentTranslationId}
                    className="flex items-center gap-2"
                  >
                    {translationHistory.find(t => t.id === currentTranslationId)?.isFavorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                    Favorite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Swap Languages Button */}
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleSwapLanguages}
            disabled={isTranslating || sourceLang === 'auto'}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            <ArrowLeftRight className="h-5 w-5 mr-2" />
            Swap Languages
          </Button>
        </div>

        {/* Smart Features Section */}
        {(translationQuality || smartSuggestions.length > 0 || showHistory) && (
          <div className="space-y-6 mt-8">
            {/* Translation Quality Analysis */}
            {translationQuality && translationQuality.issues.length > 0 && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="h-5 w-5" />
                    Translation Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Quality Score:</span>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          translationQuality.score >= 80 
                            ? 'bg-green-100 text-green-800' 
                            : translationQuality.score >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {translationQuality.score}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Confidence:</span>
                        <span className="text-gray-600">{Math.round(translationQuality.confidence * 100)}%</span>
                      </div>
                    </div>
                    
                    {translationQuality.issues.length > 0 && (
                      <div>
                        <p className="font-medium text-orange-800 mb-2">Issues Found:</p>
                        <ul className="space-y-1">
                          {translationQuality.issues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {translationQuality.suggestions.length > 0 && (
                      <div>
                        <p className="font-medium text-orange-800 mb-2">Suggestions:</p>
                        <ul className="space-y-1">
                          {translationQuality.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                              <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Sparkles className="h-5 w-5" />
                    Smart Suggestions
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    AI-powered alternatives and improvements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {smartSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-white/60 rounded-lg border border-blue-100 hover:bg-white/80 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{suggestion.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-blue-800">
                                {suggestion.description}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {Math.round(suggestion.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-2">{suggestion.text}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTranslatedText(suggestion.text)}
                              className="text-xs h-7"
                            >
                              Use This
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Translation History */}
            {showHistory && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <History className="h-5 w-5" />
                      Translation History
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(false)}
                      className="text-purple-600"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {translationHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No translation history yet</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {translationHistory.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white/60 rounded-lg border border-purple-100 hover:bg-white/80 transition-colors cursor-pointer"
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span>{sourceLanguages.find(l => l.code === item.sourceLang)?.flag}</span>
                              <ArrowLeftRight className="h-3 w-3" />
                              <span>{targetLanguages.find(l => l.code === item.targetLang)?.flag}</span>
                              <span className="text-xs text-gray-500">
                                {item.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {item.isFavorite ? (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm">
                            <p className="text-gray-600 truncate">{item.sourceText}</p>
                            <p className="text-gray-800 truncate font-medium">{item.translatedText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative inline-block mb-4">
              <Languages className="h-12 w-12 text-indigo-600 mx-auto" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{sourceLanguages.length - 1} Languages</h3>
            <p className="text-gray-600">Auto-detect plus 50+ language pairs with cultural adaptation</p>
          </Card>
          
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative inline-block mb-4">
              <Brain className="h-12 w-12 text-indigo-600 mx-auto" />
              <CheckCircle className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Quality Analysis</h3>
            <p className="text-gray-600">Real-time quality scoring with intelligent suggestions</p>
          </Card>
          
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative inline-block mb-4">
              <Mic className="h-12 w-12 text-indigo-600 mx-auto" />
              <Volume2 className="h-4 w-4 text-blue-500 absolute -top-1 -right-1" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Voice I/O</h3>
            <p className="text-gray-600">Voice input and text-to-speech in 50+ languages</p>
          </Card>
          
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative inline-block mb-4">
              <Lightbulb className="h-12 w-12 text-indigo-600 mx-auto" />
              <Star className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Context</h3>
            <p className="text-gray-600">Context-aware translations with style variations</p>
          </Card>
        </div>
        
        {/* Additional Smart Features Info */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-8 w-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-indigo-800">Powered by Advanced AI</h2>
            </div>
            <p className="text-gray-700 text-lg mb-6 max-w-3xl mx-auto">
              Our smart translator uses advanced AI to provide context-aware translations, quality assessment, 
              style variations, and cultural adaptations for the most accurate results.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2 text-indigo-700">
                <CheckCircle className="h-4 w-4" />
                <span>Context Detection</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-indigo-700">
                <CheckCircle className="h-4 w-4" />
                <span>Quality Scoring</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-indigo-700">
                <CheckCircle className="h-4 w-4" />
                <span>Smart Suggestions</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}