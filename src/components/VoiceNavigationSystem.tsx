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
  Youtube,
  Search,
  Phone,
  ShoppingBag,
  Image,
  MessageSquare,
  Briefcase,
  Camera,
  MapPin
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
      pattern: ['youtube', 'videos', 'yt'],
      action: () => router.push('/youtube'),
      description: 'Open YouTube',
      icon: <Youtube className="h-4 w-4" />,
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
      pattern: ['messenger', 'chat', 'messaging'],
      action: () => router.push('/messenger'),
      description: 'Open Messenger',
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
      pattern: ['photos', 'pictures', 'images', 'gallery'],
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
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={toggleListening}
          disabled={!isEnabled}
          className={`p-2 ${isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title="Voice Navigation"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        
        {feedback && (
          <span className="text-xs text-blue-600 font-medium animate-fade-in">
            {feedback}
          </span>
        )}
      </div>
    );
  }

  // Compact mode - just show the voice control button
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={toggleListening}
          disabled={!isEnabled}
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg animate-pulse'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isListening ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
          {showLabel && (
            <span className="hidden sm:inline">
              {isListening ? 'Stop' : 'Voice'}
            </span>
          )}
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-1 text-red-600 animate-pulse text-xs">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <span className="hidden md:inline font-medium">Listening</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-lg backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Voice Navigation</h3>
            <p className="text-sm text-gray-600">Navigate hands-free with voice commands</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCommands(!showCommands)}
            variant="outline"
            size="sm"
            className="text-gray-600"
          >
            <Command className="h-4 w-4 mr-2" />
            Commands
          </Button>
          
          <Button
            onClick={toggleEnabled}
            variant="outline"
            size="sm"
            className={isEnabled ? 'text-blue-600' : 'text-gray-400'}
          >
            {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={toggleListening}
          disabled={!isEnabled}
          className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg animate-pulse'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-6 w-6 mr-3" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-6 w-6 mr-3" />
              Start Voice Navigation
            </>
          )}
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-2 text-red-600 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <span className="font-medium">Listening...</span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">{feedback}</p>
        </div>
      )}

      {transcript && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Heard:</strong> "{transcript}"
          </p>
        </div>
      )}

      {lastCommand && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Last Command:</strong> {lastCommand}
          </p>
        </div>
      )}

      {showCommands && (
        <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4">Available Voice Commands:</h4>
          
          {['navigation', 'control'].map(category => (
            <div key={category} className="mb-4">
              <h5 className="text-sm font-medium text-gray-600 mb-2 capitalize">
                {category} Commands
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {voiceCommands
                  .filter(cmd => cmd.category === category)
                  .map((command, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {command.icon}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{command.description}</p>
                        <p className="text-xs text-gray-500">
                          Say: "{command.pattern[0]}"
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          
          <Button
            onClick={() => setShowCommands(false)}
            size="sm"
            variant="outline"
            className="mt-4"
          >
            Close Commands
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceNavigationSystem;