'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ModernCard } from './ModernCard';
import { cn } from '@/lib/utils';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Loader2,
  Settings,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
  isPlaying?: boolean;
}

interface ModernVoiceWidgetProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ModernVoiceWidget({ 
  className, 
  collapsed = false, 
  onToggleCollapse 
}: ModernVoiceWidgetProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed textInput - voice-only mode
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  
  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const processingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Convert blob to base64
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

  // Handle voice message only
  const handleVoiceMessage = useCallback(async (audioBlob: Blob, duration?: number) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    setError(null);

    const userMessage: VoiceMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: 'Processing voice...',
      timestamp: new Date(),
      duration: duration
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const payload = {
        type: 'voice_message',
        action: 'send',
        audioBase64,
        fileName: `voice_${Date.now()}.webm`,
        mimeType: audioBlob.type,
        duration: duration || 0,
        size: audioBlob.size,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/voice-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const result = await response.json();

      // Update user message with transcription if available
      if (result.data?.transcription) {
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, content: result.data.transcription }
            : msg
        ));
      }

      // Add AI response
      if (result.data?.aiResponse) {
        const aiMessage: VoiceMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: result.data.aiResponse,
          timestamp: new Date(),
          audioUrl: result.data.audioResponse,
          duration: result.data.responseDuration || 3
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Automatically play audio response immediately
        if (result.data.audioResponse) {
          console.log('🔊 Auto-playing binary audio response from N8N');
          playAudioFromBase64(result.data.audioResponse);
        } else if (result.data.aiResponse) {
          console.log('🗣️ Auto-playing text-to-speech response');
          speakText(result.data.aiResponse);
        }

        // Check for workflow commands
        if (result.data.transcription) {
          await checkForWorkflowCommands(result.data.transcription);
        }
      }
    } catch (err: any) {
      console.error('Error processing message:', err);
      setError(err.message || 'Failed to process message');
      
      const errorMessage: VoiceMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [blobToBase64]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    if (isProcessing || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = Date.now() - startTime;
        
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          handleVoiceMessage(audioBlob, Math.round(duration / 1000));
        }
        
        setIsRecording(false);
      };

      const startTime = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone');
      setIsRecording(false);
    }
  }, [isProcessing, isRecording, handleVoiceMessage]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Play audio from base64
  const playAudioFromBase64 = useCallback((audioBase64: string) => {
    try {
      // Stop any current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsSpeaking(false);
    }
  }, []);

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }, []);

  // Stop all audio/speech
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, []);

  // Check for workflow-related voice commands
  const checkForWorkflowCommands = useCallback(async (transcription: string) => {
    const workflowKeywords = ['workflow', 'automate', 'create automation', 'trigger', 'run workflow'];
    const lowerTranscription = transcription.toLowerCase();
    
    if (workflowKeywords.some(keyword => lowerTranscription.includes(keyword))) {
      try {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute-voice',
            voiceCommand: transcription
          })
        });
        
        if (response.ok) {
          console.log('🔧 Workflow command processed via voice');
        }
      } catch (error) {
        console.error('Error processing workflow command:', error);
      }
    }
  }, []);

  // Voice-only mode - text input removed

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    stopSpeaking();
  }, [stopSpeaking]);

  if (collapsed) {
    return (
      <div className={cn('fixed bottom-6 right-6 z-50', className)}>
        <Button
          onClick={onToggleCollapse}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700 text-black font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110 border-2 border-white/20 backdrop-blur-sm"
          title="Open Voice Assistant"
        >
          {isRecording ? (
            <div className="relative">
              <Mic className="h-7 w-7" />
              <div className="absolute inset-0 bg-red-400 opacity-50 rounded-full animate-ping" />
            </div>
          ) : isSpeaking ? (
            <Volume2 className="h-7 w-7 animate-pulse" />
          ) : (
            <Bot className="h-7 w-7" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 w-96 max-h-[80vh]', className)}>
      <ModernCard 
        gradient="blue" 
        blur="xl" 
        className="overflow-hidden shadow-2xl border-2 border-white/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Bot className="h-5 w-5 text-black font-bold" />
              {(isRecording || isSpeaking) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">AI Voice Assistant</h3>
              <p className="text-xs text-gray-600">
                {isRecording ? '🎤 Recording...' : 
                 isSpeaking ? '🔊 Speaking...' : 
                 isProcessing ? '🧠 Processing...' : 
                 '⚡ Ready to help'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <Button
                onClick={stopSpeaking}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              onClick={clearMessages}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-4">
                <Mic className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">Voice Assistant Ready</h3>
              <p className="text-sm text-gray-500">
                Tap the microphone to start speaking
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-in slide-in-from-bottom-2',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm">
                    <Bot className="h-4 w-4 text-black font-bold" />
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-black font-bold'
                      : 'bg-white/80 backdrop-blur-sm border border-white/40 text-gray-800'
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {message.duration && (
                      <p className="text-xs opacity-70">
                        {message.duration}s
                      </p>
                    )}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                    <User className="h-4 w-4 text-black font-bold" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm">
                  <Bot className="h-4 w-4 text-black font-bold" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/20 bg-gradient-to-r from-gray-50/50 to-white/50 backdrop-blur-sm space-y-3">
          {/* Voice-Only Mode - Text input removed */}

          {/* Voice Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={cn(
                'relative h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110',
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 animate-pulse' 
                  : 'bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700'
              )}
            >
              {isRecording && (
                <div className="absolute inset-0 bg-red-400/50 rounded-full animate-ping" />
              )}
              {isRecording ? (
                <MicOff className="h-6 w-6 text-black font-bold relative z-10" />
              ) : (
                <Mic className="h-6 w-6 text-black font-bold relative z-10" />
              )}
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full">
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors',
                isRecording ? 'bg-red-500 animate-pulse' :
                isSpeaking ? 'bg-green-500 animate-pulse' :
                isProcessing ? 'bg-yellow-500 animate-pulse' :
                'bg-blue-500'
              )} />
              <span className="text-xs font-medium text-gray-600">
                {isRecording ? 'Recording...' :
                 isSpeaking ? 'Speaking...' :
                 isProcessing ? 'Processing...' :
                 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </ModernCard>
    </div>
  );
}