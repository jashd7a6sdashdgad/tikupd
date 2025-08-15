'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Navigation,
  Command,
  Zap,
  ArrowRight,
  Settings,
  Home,
  Calendar,
  Mail,
  DollarSign,
  Users,
  BarChart3,
  BookOpen,
  Facebook,
  Search,
  Phone,
  ShoppingBag,
  Image,
  MessageSquare,
  Briefcase,
  Camera,
  MapPin,
  Music,
  Eye,
  Globe,
  Waves
} from 'lucide-react';

interface VoiceCommand {
  pattern: string[];
  action: () => void;
  description: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'control';
}

interface VoiceNavigationSystemProps {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

export const VoiceNavigationSystem: React.FC<VoiceNavigationSystemProps> = ({
  className = '',
  compact = false,
  showLabel = true
}) => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [showCommands, setShowCommands] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice commands configuration
  const voiceCommands: VoiceCommand[] = [
    // Navigation Commands
    {
      pattern: ['go home', 'home page', 'dashboard', 'main page'],
      action: () => router.push('/dashboard'),
      description: 'Go to Dashboard',
      icon: <Home className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['calendar', 'events', 'schedule', 'appointments'],
      action: () => router.push('/calendar'),
      description: 'Open Calendar',
      icon: <Calendar className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['email', 'emails', 'mail', 'messages'],
      action: () => router.push('/email'),
      description: 'Open Email',
      icon: <Mail className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['expenses', 'money', 'budget', 'financial', 'spending'],
      action: () => router.push('/expenses'),
      description: 'Open Expenses',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['contacts', 'people', 'address book', 'phonebook'],
      action: () => router.push('/contacts'),
      description: 'Open Contacts',
      icon: <Users className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['analytics', 'tracking', 'reports', 'statistics'],
      action: () => router.push('/tracking'),
      description: 'Open Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['diary', 'journal', 'notes', 'writing'],
      action: () => router.push('/diary'),
      description: 'Open Diary',
      icon: <BookOpen className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['facebook', 'social media', 'fb'],
      action: () => router.push('/facebook'),
      description: 'Open Facebook',
      icon: <Facebook className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['search', 'find', 'look for'],
      action: () => router.push('/search'),
      description: 'Open Search',
      icon: <Search className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['messenger', 'messaging'],
      action: () => router.push('/messenger'),
      description: 'Open Messenger',
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['chat', 'conversation', 'ai chat'],
      action: () => router.push('/chat'),
      description: 'Open Chat',
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['shopping', 'shop', 'buy', 'purchase'],
      action: () => router.push('/shopping'),
      description: 'Open Shopping',
      icon: <ShoppingBag className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['photos', 'pictures', 'images', 'gallery', 'photo album'],
      action: () => router.push('/photo-album'),
      description: 'Open Photo Album',
      icon: <Camera className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['settings', 'preferences', 'config', 'options'],
      action: () => router.push('/settings'),
      description: 'Open Settings',
      icon: <Settings className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['voice chat', 'talk', 'conversation'],
      action: () => router.push('/voice-chat'),
      description: 'Open Voice Chat',
      icon: <Phone className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['workflows', 'automation', 'tasks'],
      action: () => router.push('/workflows'),
      description: 'Open Workflows',
      icon: <Briefcase className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['weather', 'forecast', 'temperature'],
      action: () => router.push('/weather'),
      description: 'Open Weather',
      icon: <MapPin className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['customization', 'customize', 'personalize', 'themes'],
      action: () => router.push('/customization'),
      description: 'Open Customization',
      icon: <Settings className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['api tokens', 'tokens', 'api keys', 'keys'],
      action: () => router.push('/api-tokens'),
      description: 'Open API Tokens',
      icon: <Command className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['business', 'work', 'professional'],
      action: () => router.push('/business'),
      description: 'Open Business',
      icon: <Briefcase className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['travel', 'trip', 'journey', 'vacation'],
      action: () => router.push('/travel'),
      description: 'Open Travel Companion',
      icon: <Navigation className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['islamic settings', 'islamic', 'prayer', 'religious'],
      action: () => router.push('/islamic-settings'),
      description: 'Open Islamic Settings',
      icon: <Command className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['security', 'privacy', 'protection'],
      action: () => router.push('/security'),
      description: 'Open Security',
      icon: <Command className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['workflow builder', 'workflows builder', 'automation builder'],
      action: () => router.push('/workflow-builder'),
      description: 'Open Workflow Builder',
      icon: <Zap className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['think tool', 'thinking', 'brain'],
      action: () => router.push('/think-tool'),
      description: 'Open Think Tool',
      icon: <Command className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['web scraper', 'scraper', 'web crawl'],
      action: () => router.push('/web-scraper'),
      description: 'Open Web Scraper',
      icon: <Command className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['budget', 'budgeting', 'financial planning'],
      action: () => router.push('/budget'),
      description: 'Open Budget',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['hotel expenses', 'hotel', 'accommodation'],
      action: () => router.push('/hotel-expenses'),
      description: 'Open Hotel Expenses',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['music', 'songs', 'spotify', 'audio', 'player'],
      action: () => router.push('/music'),
      description: 'Open Music Player',
      icon: <Music className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['image generation', 'generate image', 'create image', 'ai image'],
      action: () => router.push('/image-generation'),
      description: 'Open Image Generation',
      icon: <Image className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['firecrawl', 'web crawl', 'scrape web', 'crawl website'],
      action: () => router.push('/firecrawl'),
      description: 'Open Firecrawl',
      icon: <Globe className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['email intelligence', 'smart email', 'email ai'],
      action: () => router.push('/email-intelligence'),
      description: 'Open Email Intelligence',
      icon: <Mail className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['email summary', 'email digest', 'summarize email'],
      action: () => router.push('/email-summary'),
      description: 'Open Email Summary',
      icon: <Mail className="h-4 w-4" />,
      category: 'navigation'
    },
    {
      pattern: ['features demo', 'demo', 'showcase', 'features'],
      action: () => router.push('/features-demo'),
      description: 'Open Features Demo',
      icon: <Eye className="h-4 w-4" />,
      category: 'navigation'
    },

    // Control Commands
    {
      pattern: ['go back', 'back', 'previous', 'return'],
      action: () => router.back(),
      description: 'Go Back',
      icon: <ArrowRight className="h-4 w-4 rotate-180" />,
      category: 'control'
    },
    {
      pattern: ['refresh', 'reload', 'update'],
      action: () => window.location.reload(),
      description: 'Refresh Page',
      icon: <Command className="h-4 w-4" />,
      category: 'control'
    },
    {
      pattern: ['stop listening', 'disable voice', 'turn off'],
      action: () => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      },
      description: 'Stop Voice Navigation',
      icon: <MicOff className="h-4 w-4" />,
      category: 'control'
    },
    {
      pattern: ['help', 'commands', 'what can you do'],
      action: () => setShowCommands(true),
      description: 'Show Voice Commands',
      icon: <Command className="h-4 w-4" />,
      category: 'control'
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const SpeechSynthesis = (window as any).speechSynthesis;
      
      if (SpeechRecognition && SpeechSynthesis) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        synthRef.current = SpeechSynthesis;
        
        const recognition = recognitionRef.current;
        if (recognition) {
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 3;
          
          recognition.onresult = handleSpeechResult;
          recognition.onerror = handleSpeechError;
          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
        }
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSpeechResult = useCallback((event: any) => {
    const result = event.results[0];
    const transcript = result[0].transcript.toLowerCase().trim();
    
    setTranscript(transcript);
    console.log('Voice transcript:', transcript);
    
    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => 
      cmd.pattern.some(pattern => 
        transcript.includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(transcript)
      )
    );
    
    if (matchedCommand) {
      setLastCommand(matchedCommand.description);
      setFeedback(`Executing: ${matchedCommand.description}`);
      speakFeedback(`${matchedCommand.description}`);
      
      // Execute command after a short delay for feedback
      setTimeout(() => {
        matchedCommand.action();
        setFeedback('');
      }, 1000);
    } else {
      setFeedback(`Command not recognized: "${transcript}"`);
      speakFeedback('Command not recognized. Say "help" for available commands.');
      
      setTimeout(() => setFeedback(''), 3000);
    }
  }, [voiceCommands]);

  const handleSpeechError = useCallback((event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    
    if (event.error === 'no-speech') {
      setFeedback('No speech detected. Try again.');
    } else if (event.error === 'not-allowed') {
      setFeedback('Microphone access denied.');
      setIsEnabled(false);
    } else {
      setFeedback(`Speech error: ${event.error}`);
    }
    
    setTimeout(() => setFeedback(''), 3000);
  }, []);

  const speakFeedback = (text: string) => {
    if (synthRef.current && isEnabled) {
      synthRef.current.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      synthRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && isEnabled && !isListening) {
      setTranscript('');
      setFeedback('Listening...');
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFeedback('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleEnabled = () => {
    if (isEnabled) {
      stopListening();
      setIsEnabled(false);
      speakFeedback('Voice navigation disabled');
    } else {
      setIsEnabled(true);
      speakFeedback('Voice navigation enabled');
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800">
          Voice navigation is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Button
          onClick={toggleListening}
          disabled={!isEnabled}
          className={`flex items-center gap-3 px-6 py-4 text-base font-bold rounded-2xl transition-all duration-300 shadow-2xl border-0 ${
            isListening
              ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white animate-pulse scale-110 shadow-red-500/50'
              : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-800 text-white hover:scale-105 shadow-blue-500/50'
          }`}
          title="Voice Navigation"
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          {showLabel && (
            <span className="hidden sm:inline text-lg">
              {isListening ? 'Stop Voice' : 'Voice Command'}
            </span>
          )}
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border-2 border-red-300 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-red-700 font-bold text-sm">LISTENING</span>
          </div>
        )}
        
        {feedback && !isListening && (
          <div className="bg-blue-100 px-4 py-2 rounded-full border-2 border-blue-300 animate-fade-in">
            <span className="text-blue-700 font-semibold text-sm">
              {feedback}
            </span>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className={`bg-white/95 backdrop-blur-2xl border-2 border-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 rounded-3xl p-8 shadow-2xl ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
            <Navigation className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 bg-clip-text text-transparent">
              AI Voice Navigation
            </h3>
            <p className="text-lg text-gray-600 font-medium">Navigate hands-free with natural speech commands</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${
                isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className={`text-sm font-semibold ${
                isEnabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {isEnabled ? 'System Active' : 'System Disabled'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCommands(!showCommands)}
            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-xl border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Command className="h-5 w-5 mr-2" />
            Show Commands
          </Button>
          
          <Button
            onClick={toggleEnabled}
            className={`px-6 py-3 rounded-xl font-semibold border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isEnabled 
                ? 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-800 border-green-300'
                : 'bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-800 border-red-300'
            }`}
          >
            {isEnabled ? (
              <>
                <Volume2 className="h-5 w-5 mr-2" />
                Enabled
              </>
            ) : (
              <>
                <VolumeX className="h-5 w-5 mr-2" />
                Disabled
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <Button
          onClick={toggleListening}
          disabled={!isEnabled}
          className={`flex items-center gap-4 px-12 py-6 text-xl font-bold rounded-2xl transition-all duration-500 border-0 shadow-2xl min-w-[280px] ${
            isListening
              ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white animate-pulse scale-105 shadow-red-500/50'
              : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-800 text-white hover:scale-105 shadow-blue-500/50'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-8 w-8" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-8 w-8" />
              Start Voice Command
            </>
          )}
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-4 bg-gradient-to-r from-red-100 to-red-200 px-6 py-4 rounded-2xl border-2 border-red-300 shadow-xl animate-pulse">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            </div>
            <span className="font-bold text-red-700 text-lg">LISTENING FOR COMMANDS</span>
            <div className="flex gap-1">
              <div className="w-2 h-6 bg-red-500 rounded animate-pulse"></div>
              <div className="w-2 h-8 bg-red-600 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-4 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-7 bg-red-600 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div className="mb-6 p-5 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl shadow-lg">
          <p className="text-lg text-blue-800 font-bold flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            {feedback}
          </p>
        </div>
      )}

      {transcript && (
        <div className="mb-6 p-5 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-2xl shadow-lg">
          <p className="text-lg text-gray-800 font-semibold">
            <strong className="text-gray-600">Heard:</strong> <span className="text-gray-900">"{transcript}"</span>
          </p>
        </div>
      )}

      {lastCommand && (
        <div className="mb-6 p-5 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl shadow-lg">
          <p className="text-lg text-green-800 font-bold flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <strong>Last Command:</strong> {lastCommand}
          </p>
        </div>
      )}

      {showCommands && (
        <div className="mt-8 p-6 bg-white/90 backdrop-blur-xl border-2 border-gray-300 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Command className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-gray-800">Available Voice Commands</h4>
          </div>
          
          {['navigation', 'control'].map(category => (
            <div key={category} className="mb-8">
              <h5 className="text-xl font-bold text-gray-700 mb-4 capitalize flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                {category} Commands
              </h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {voiceCommands
                  .filter(cmd => cmd.category === category)
                  .slice(0, 12) // Limit to first 12 for better display
                  .map((command, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-102">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-800 mb-1">{command.description}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          Say: <span className="text-blue-600 font-bold">"{command.pattern[0]}"</span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              {voiceCommands.filter(cmd => cmd.category === category).length > 12 && (
                <p className="text-sm text-gray-500 mt-4 text-center font-medium">
                  ...and {voiceCommands.filter(cmd => cmd.category === category).length - 12} more commands
                </p>
              )}
            </div>
          ))}
          
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setShowCommands(false)}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Close Commands
            </Button>
          </div>
        </div>
      )}
      
      {/* Quick Command Examples */}
      {!showCommands && (
        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl">
          <h4 className="text-lg font-bold text-indigo-800 mb-4">Quick Examples - Try saying:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-200">
              <p className="text-indigo-700 font-semibold">"Go home"</p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-200">
              <p className="text-indigo-700 font-semibold">"Open calendar"</p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-200">
              <p className="text-indigo-700 font-semibold">"Show expenses"</p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-200">
              <p className="text-indigo-700 font-semibold">"Help"</p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-200">
              <p className="text-indigo-700 font-semibold">"Play music"</p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-200">
              <p className="text-indigo-700 font-semibold">"Go back"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceNavigationSystem;