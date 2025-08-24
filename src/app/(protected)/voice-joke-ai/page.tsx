'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ChatEntry {
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

export default function VoiceJokeAIPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  
  // Generate or retrieve persistent session ID
  const [sessionId] = useState(() => {
    // Try to get existing session ID from localStorage
    const savedSessionId = localStorage.getItem('voiceJokeAI_sessionId');
    if (savedSessionId) {
      return savedSessionId;
    }
    
    // Generate new persistent session ID
    const newSessionId = `voice-joke-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('voiceJokeAI_sessionId', newSessionId);
    return newSessionId;
  });
  
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentJoke, setCurrentJoke] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Try to get saved language preference
    const savedLanguage = localStorage.getItem('voiceJokeAI_language');
    return savedLanguage || 'en-US';
  });

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // n8n webhook URL
  const webhookUrl = 'https://n8n.1000273.xyz/webhook/jooka';

  // Supported languages for speech recognition
  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'ar-SA', name: 'Arabic (Saudi)', flag: '🇸🇦' },
    { code: 'ar-EG', name: 'Arabic (Egypt)', flag: '🇪🇬' },
    { code: 'ar-AE', name: 'Arabic (UAE)', flag: '🇦🇪' },
    { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
    { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
    { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
    { code: 'ru-RU', name: 'Russian (Russia)', flag: '🇷🇺' },
    { code: 'ja-JP', name: 'Japanese (Japan)', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean (Korea)', flag: '🇰🇷' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
    { code: 'hi-IN', name: 'Hindi (India)', flag: '🇮🇳' },
    { code: 'ur-PK', name: 'Urdu (Pakistan)', flag: '🇵🇰' },
    { code: 'tr-TR', name: 'Turkish (Turkey)', flag: '🇹🇷' },
    { code: 'nl-NL', name: 'Dutch (Netherlands)', flag: '🇳🇱' },
    { code: 'sv-SE', name: 'Swedish (Sweden)', flag: '🇸🇪' }
  ];

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check browser support
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    
    if (!speechRecognitionSupported || !speechSynthesisSupported) {
      setIsSupported(false);
      setError('Speech features not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError('');
        setSuccess('');
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          processJokeRequest(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}`);
      };
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices if they haven't loaded yet
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        console.log('🎤 Loaded voices:', voices.length);
        if (voices.length > 0) {
          console.log('🌍 Available languages:', [...new Set(voices.map(v => v.lang))].sort());
          console.log('👩 Female voice options:', voices.filter(v => 
            ['Female', 'Woman', 'Girl', 'Sara', 'Samantha', 'Victoria', 'Karen', 'Susan', 'Zira', 'Hazel', 'Tessa', 'Moira', 'Fiona'].some(name => v.name.includes(name))
          ).map(v => ({ name: v.name, lang: v.lang })));
        }
      };
      
      // Load voices immediately if available
      loadVoices();
      
      // Also listen for voice changes (some browsers load them asynchronously)
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [transcript, selectedLanguage]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    setTranscript('');
    setError('');
    setSuccess('');

    try {
      recognitionRef.current.start();
    } catch (error) {
      setError('Could not start speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processJokeRequest = async (userText: string) => {
    setIsProcessing(true);
    setError('');

    console.log('🚀 Starting webhook request...');
    console.log('📝 User text:', userText);
    console.log('🔗 Webhook URL:', webhookUrl);

    try {
      // Build URL with query parameters for GET request
      const url = new URL(webhookUrl);
      url.searchParams.append('message', userText);
      url.searchParams.append('timestamp', new Date().toISOString());
      url.searchParams.append('sessionId', sessionId);
      url.searchParams.append('userId', sessionId); // Alias for compatibility
      url.searchParams.append('language', selectedLanguage);
      url.searchParams.append('languageCode', selectedLanguage.split('-')[0]); // Just the language part
      
      console.log('📦 Request URL with params:', url.toString());
      console.log('🆔 Session ID:', sessionId);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const jokeText = await response.text();
      console.log('✅ Received joke:', jokeText);
      
      if (!jokeText || jokeText.trim() === '') {
        throw new Error('Empty response from webhook');
      }
      
      setCurrentJoke(jokeText);
      
      // Add to chat history
      setChatHistory(prev => [
        ...prev,
        { sender: 'user', message: userText, timestamp: new Date() },
        { sender: 'ai', message: jokeText, timestamp: new Date() }
      ]);

      // Speak the joke
      speakJoke(jokeText);
      setSuccess('Joke received! Playing now...');

    } catch (error) {
      console.error('❌ Full error object:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      
      // More detailed error message
      let errorMessage = 'Sorry, I couldn\'t get a joke right now. ';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Network connection issue - check if the webhook URL is accessible.';
      } else if (error instanceof Error) {
        errorMessage += `Error: ${error.message}`;
      } else {
        errorMessage += 'Please try again!';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakJoke = (joke: string) => {
    if (!synthRef.current) {
      setError('Text-to-speech not available');
      return;
    }

    // Stop any current speech
    synthRef.current.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(joke);
    utteranceRef.current.rate = 0.85;
    utteranceRef.current.pitch = 1.2; // Higher pitch for female voice
    utteranceRef.current.volume = 0.9;

    // Set language for TTS based on selected language
    utteranceRef.current.lang = selectedLanguage;

    // Find the best female voice for the selected language
    const voices = synthRef.current.getVoices();
    console.log('🔊 Available voices:', voices.map(v => ({ name: v.name, lang: v.lang, gender: v.name })));
    
    // Language code for matching (e.g., 'ar' from 'ar-SA')
    const langCode = selectedLanguage.split('-')[0];
    
    // Priority order for voice selection
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    // 1. Try to find female voices for the specific language
    const femaleNames = ['Female', 'Woman', 'Girl', 'Sara', 'Samantha', 'Victoria', 'Karen', 'Susan', 'Zira', 'Hazel', 'Tessa', 'Moira', 'Fiona', 'Alex', 'Amelie', 'Anna', 'Ellen', 'Zosia', 'Luciana', 'Paulina', 'Carmit', 'Lina', 'Melina', 'Nora', 'Laila', 'Maged', 'Tarik'];
    
    // First try: Exact language match with female name
    selectedVoice = voices.find(voice => 
      voice.lang === selectedLanguage && 
      femaleNames.some(name => voice.name.includes(name))
    ) ?? null;
    
    // Second try: Language code match with female name
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith(langCode) && 
        femaleNames.some(name => voice.name.includes(name))
      ) ?? null;
    }
    
    // Third try: Any voice for exact language
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang === selectedLanguage) ?? null;
    }
    
    // Fourth try: Any voice for language code
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith(langCode)) ?? null;
    }
    
    // Fifth try: Default female English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        femaleNames.some(name => voice.name.includes(name))
      ) ?? null;
    }
    
    // Sixth try: Any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en')) ?? null;
    }
    
    // Final fallback: First available voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0] ?? null;
    }
    
    if (selectedVoice) {
      utteranceRef.current.voice = selectedVoice;
      console.log('🎭 Selected voice:', selectedVoice.name, 'for language:', selectedLanguage);
    } else {
      console.warn('⚠️ No suitable voice found for language:', selectedLanguage);
    }

    utteranceRef.current.onstart = () => {
      setIsSpeaking(true);
    };

    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current.onerror = (event) => {
      setIsSpeaking(false);
      console.error('TTS Error:', event);
      setError('Could not play speech. Check your audio settings.');
    };

    synthRef.current.speak(utteranceRef.current);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const repeatLastJoke = () => {
    if (currentJoke) {
      speakJoke(currentJoke);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    setCurrentJoke('');
    setTranscript('');
    setSuccess('Chat history cleared!');
  };

  const generateNewSession = () => {
    const newSessionId = `voice-joke-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('voiceJokeAI_sessionId', newSessionId);
    // Force page reload to get new session ID
    window.location.reload();
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('voiceJokeAI_language', languageCode);
  };

  const testVoice = () => {
    const testMessages = {
      'en': 'Hello! I am your voice assistant. I can tell jokes in multiple languages!',
      'ar': 'مرحبا! أنا مساعدك الصوتي. يمكنني أن أحكي نكت بلغات متعددة!',
      'es': '¡Hola! Soy tu asistente de voz. ¡Puedo contar chistes en varios idiomas!',
      'fr': 'Bonjour! Je suis votre assistant vocal. Je peux raconter des blagues en plusieurs langues!',
      'de': 'Hallo! Ich bin Ihr Sprachassistent. Ich kann Witze in mehreren Sprachen erzählen!',
      'it': 'Ciao! Sono il tuo assistente vocale. Posso raccontare barzellette in più lingue!',
      'pt': 'Olá! Eu sou seu assistente de voz. Posso contar piadas em vários idiomas!',
      'ru': 'Привет! Я ваш голосовой помощник. Я могу рассказывать анекдоты на разных языках!',
      'ja': 'こんにちは！私はあなたの音声アシスタントです。複数の言語でジョークを話すことができます！',
      'ko': '안녕하세요! 저는 당신의 음성 어시스턴트입니다. 여러 언어로 농담을 할 수 있습니다!',
      'zh': '你好！我是你的语音助手。我可以用多种语言讲笑话！',
      'hi': 'नमस्ते! मैं आपका आवाज सहायक हूँ। मैं कई भाषाओं में चुटकुले सुना सकता हूँ!',
      'ur': 'السلام علیکم! میں آپ کا صوتی معاون ہوں۔ میں کئی زبانوں میں چٹکلے سنا سکتا ہوں!',
      'tr': 'Merhaba! Ben senin ses asistanınım. Birden fazla dilde şaka anlatabilirim!',
      'nl': 'Hallo! Ik ben je spraakassistent. Ik kan grappen vertellen in meerdere talen!',
      'sv': 'Hej! Jag är din röstassistent. Jag kan berätta skämt på flera språk!'
    };
    
    const langCode = selectedLanguage.split('-')[0];
    const message = testMessages[langCode as keyof typeof testMessages] || testMessages['en'];
    
    speakJoke(message);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
    } else if (!isProcessing) {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              🎭 Voice Joke AI
            </h1>
            <p className="text-gray-600 text-lg mb-2">Your Voice-Powered Comedy Companion</p>
            <p className="text-gray-500">
              Click the microphone and speak your request for jokes! Ask for specific types, topics, or just say "tell me a joke" to get started.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Language Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <p className="text-gray-600 text-sm">Choose your language for speech recognition:</p>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                disabled={isListening || isProcessing}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 text-center">
                Selected: <strong>{supportedLanguages.find(l => l.code === selectedLanguage)?.name}</strong>
              </p>
              <Button
                onClick={testVoice}
                disabled={isSpeaking || isProcessing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Test Voice
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voice Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Voice Interface</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* Voice Button */}
            <div className="flex justify-center">
              <Button
                onClick={toggleVoiceInput}
                disabled={!isSupported || isProcessing}
                className={`w-32 h-32 rounded-full text-4xl transition-all duration-300 ${
                  isListening 
                    ? 'bg-green-500 hover:bg-green-600 animate-pulse' 
                    : isSpeaking 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : isProcessing 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isListening ? (
                  <Mic className="w-8 h-8" />
                ) : isSpeaking ? (
                  <Volume2 className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>

            {/* Status */}
            <div className="text-lg font-medium">
              {isListening && `🎤 Listening in ${supportedLanguages.find(l => l.code === selectedLanguage)?.name}... Speak now!`}
              {isProcessing && "⚡ Processing your request..."}
              {isSpeaking && "🔊 Playing joke..."}
              {!isListening && !isProcessing && !isSpeaking && "Click the microphone to start talking"}
            </div>

            {/* Transcript */}
            {transcript && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">You said:</p>
                  <p className="text-gray-800 font-medium">"{transcript}"</p>
                </CardContent>
              </Card>
            )}

            {/* Current Joke */}
            {currentJoke && (
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Latest Joke:</p>
                  <p className="text-gray-800 font-medium">{currentJoke}</p>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                variant="outline"
                className="flex items-center gap-2"
              >
                <VolumeX className="w-4 h-4" />
                Stop Speaking
              </Button>
              <Button
                onClick={repeatLastJoke}
                disabled={!currentJoke || isSpeaking || isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Repeat Joke
              </Button>
              <Button
                onClick={() => processJokeRequest("Tell me a funny joke")}
                disabled={isProcessing || isSpeaking}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Test Webhook
              </Button>
              <Button
                onClick={clearHistory}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear History
              </Button>
              <Button
                onClick={generateNewSession}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                New Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.slice(-10).map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      entry.sender === 'user' 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'bg-green-50 border-l-4 border-green-500'
                    }`}
                  >
                    <div className="text-sm text-gray-600 mb-1">
                      {entry.sender === 'user' ? 'You' : 'Joke AI'}:
                    </div>
                    <div className="text-gray-800">{entry.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-medium text-blue-800 mb-2">Session Information</h4>
              <div className="space-y-2 text-sm text-blue-600">
                <p>
                  <strong>Session ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-xs">{sessionId}</code>
                </p>
                <p>
                  <strong>Language:</strong> <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                    {supportedLanguages.find(l => l.code === selectedLanguage)?.flag} {supportedLanguages.find(l => l.code === selectedLanguage)?.name}
                  </span>
                </p>
              </div>
              <p className="text-xs text-blue-500 mt-2">
                This ID helps the AI remember our conversation. Click "New Session" to start fresh or reset memory.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Browser Support Info */}
        {!isSupported && (
          <Card className="mt-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-5 h-5" />
                <span>
                  Some features may not work properly in this browser. 
                  Please use Chrome, Edge, or Safari for the best experience.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}