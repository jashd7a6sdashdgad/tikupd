'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Volume2, Copy, Loader2, Languages } from 'lucide-react';

interface Language {
  code: string;
  name: string;
}

const sourceLanguages: Language[] = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'th', name: 'Thai' }
];

const targetLanguages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'th', name: 'Thai' }
];

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ar');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          source: sourceLang,
          target: targetLang,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTranslatedText(data.translatedText);
      } else {
        console.error('Translation failed:', data.error);
        setTranslatedText('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Network error. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      // Map language codes to proper TTS language codes with fallbacks
      const langMap: { [key: string]: string[] } = {
        'en': ['en-US', 'en-GB', 'en'],
        'ar': ['ar-SA', 'ar-EG', 'ar-AE', 'ar'],
        'ru': ['ru-RU', 'ru'],
        'th': ['th-TH', 'th']
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
        // Show user-friendly message
        alert(`Speech synthesis failed for ${lang}. This language voice may not be installed on your system.`);
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

  useEffect(() => {
    const delayedTranslate = setTimeout(() => {
      if (sourceText.trim()) {
        handleTranslate();
      }
    }, 500);

    return () => clearTimeout(delayedTranslate);
  }, [sourceText, sourceLang, targetLang]);

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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Translator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Translate text instantly between multiple languages with text-to-speech
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Source Language Panel */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span>From</span>
                </CardTitle>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="w-48 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sourceLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter text to translate..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="min-h-40 resize-none bg-white/80 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpeak(sourceText, sourceLang)}
                    disabled={!sourceText.trim() || isSpeaking || sourceLang === 'auto'}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    {isSpeaking ? 'Stop' : 'Speak'}
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Translation Controls */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span>To</span>
                </CardTitle>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-48 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {targetLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
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
                    placeholder="Translation will appear here..."
                    value={translatedText}
                    readOnly
                    className="min-h-40 resize-none bg-gray-50/80 border-gray-200 cursor-default"
                  />
                  {isTranslating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Translating...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Swap Languages Button */}
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleSwapLanguages}
            disabled={isTranslating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <ArrowLeftRight className="h-5 w-5 mr-2" />
            Swap Languages
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <Languages className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Auto-Detect + 4 Languages</h3>
            <p className="text-gray-600">Auto-detect source language plus English, Arabic, Russian, and Thai</p>
          </Card>
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <Volume2 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Text-to-Speech</h3>
            <p className="text-gray-600">Hear perfect pronunciation in any language</p>
          </Card>
          <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time</h3>
            <p className="text-gray-600">Instant translation as you type</p>
          </Card>
        </div>
      </div>
    </div>
  );
}