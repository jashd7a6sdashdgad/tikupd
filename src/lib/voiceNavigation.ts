// Voice-First Navigation System
// Provides complete hands-free operation with speech commands

import React from 'react';

export interface VoiceCommand {
  command: string;
  patterns: string[];
  action: () => void | Promise<void>;
  description: string;
  category: 'navigation' | 'actions' | 'data' | 'controls';
}

export interface VoiceNavigationState {
  isListening: boolean;
  isEnabled: boolean;
  currentCommand: string;
  confidence: number;
  lastCommand: string;
  commandHistory: string[];
}

class VoiceNavigationSystem {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private commands: Map<string, VoiceCommand> = new Map();
  private state: VoiceNavigationState;
  private listeners: Set<(state: VoiceNavigationState) => void> = new Set();

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.state = {
      isListening: false,
      isEnabled: false,
      currentCommand: '',
      confidence: 0,
      lastCommand: '',
      commandHistory: []
    };

    this.initializeSpeechRecognition();
    this.registerDefaultCommands();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.updateState({ isListening: true });
      };

      this.recognition.onend = () => {
        this.updateState({ isListening: false });
        // Auto-restart if enabled
        if (this.state.isEnabled) {
          setTimeout(() => this.startListening(), 1000);
        }
      };

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.trim().toLowerCase();
        const confidence = result[0].confidence;

        this.updateState({ 
          currentCommand: transcript, 
          confidence: confidence 
        });

        if (result.isFinal && confidence > 0.7) {
          this.processCommand(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.speak('Sorry, I had trouble hearing that. Please try again.');
      };
    }
  }

  private registerDefaultCommands() {
    // Navigation Commands
    this.registerCommand({
      command: 'go-dashboard',
      patterns: ['go to dashboard', 'open dashboard', 'show dashboard', 'home'],
      action: () => { window.location.href = '/dashboard'; },
      description: 'Navigate to dashboard',
      category: 'navigation'
    });

    this.registerCommand({
      command: 'go-expenses',
      patterns: ['go to expenses', 'open expenses', 'show expenses', 'expenses'],
      action: () => { window.location.href = '/expenses'; },
      description: 'Navigate to expenses',
      category: 'navigation'
    });

    this.registerCommand({
      command: 'go-tracking',
      patterns: ['go to tracking', 'open tracking', 'show tracking', 'analytics'],
      action: () => { window.location.href = '/tracking'; },
      description: 'Navigate to tracking',
      category: 'navigation'
    });

    this.registerCommand({
      command: 'go-calendar',
      patterns: ['go to calendar', 'open calendar', 'show calendar', 'calendar'],
      action: () => { window.location.href = '/calendar'; },
      description: 'Navigate to calendar',
      category: 'navigation'
    });

    this.registerCommand({
      command: 'go-settings',
      patterns: ['go to settings', 'open settings', 'show settings', 'settings'],
      action: () => { window.location.href = '/settings'; },
      description: 'Navigate to settings',
      category: 'navigation'
    });

    // Control Commands
    this.registerCommand({
      command: 'scroll-up',
      patterns: ['scroll up', 'go up', 'page up'],
      action: () => { window.scrollBy(0, -300); },
      description: 'Scroll page up',
      category: 'controls'
    });

    this.registerCommand({
      command: 'scroll-down',
      patterns: ['scroll down', 'go down', 'page down'],
      action: () => { window.scrollBy(0, 300); },
      description: 'Scroll page down',
      category: 'controls'
    });

    this.registerCommand({
      command: 'go-back',
      patterns: ['go back', 'back', 'previous page'],
      action: () => { window.history.back(); },
      description: 'Go to previous page',
      category: 'controls'
    });

    this.registerCommand({
      command: 'refresh',
      patterns: ['refresh page', 'reload', 'refresh'],
      action: () => { window.location.reload(); },
      description: 'Refresh current page',
      category: 'controls'
    });

    // Action Commands
    this.registerCommand({
      command: 'add-expense',
      patterns: ['add expense', 'new expense', 'create expense'],
      action: () => {
        const button = document.querySelector('[data-voice="add-expense"]') as HTMLButtonElement;
        if (button) button.click();
        else this.speak('Add expense button not found on this page');
      },
      description: 'Add new expense',
      category: 'actions'
    });

    this.registerCommand({
      command: 'search',
      patterns: ['search', 'find', 'look for'],
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          this.speak('Search field focused. What would you like to search for?');
        } else {
          this.speak('Search field not found on this page');
        }
      },
      description: 'Focus search field',
      category: 'actions'
    });

    // Help Commands
    this.registerCommand({
      command: 'help',
      patterns: ['help', 'what can you do', 'commands', 'voice help'],
      action: () => { this.showHelp(); },
      description: 'Show available voice commands',
      category: 'controls'
    });

    this.registerCommand({
      command: 'stop-listening',
      patterns: ['stop listening', 'disable voice', 'turn off voice'],
      action: () => { this.disable(); },
      description: 'Disable voice navigation',
      category: 'controls'
    });
  }

  registerCommand(command: VoiceCommand) {
    this.commands.set(command.command, command);
  }

  private processCommand(transcript: string) {
    console.log('Processing voice command:', transcript);

    // Find matching command
    for (const [key, command] of this.commands) {
      const matches = command.patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\s+/g, '\\s+'), 'i');
        return regex.test(transcript);
      });

      if (matches) {
        this.updateState({ 
          lastCommand: command.command,
          commandHistory: [...this.state.commandHistory.slice(-9), command.command]
        });

        try {
          command.action();
          this.speak(`Executing ${command.description}`);
        } catch (error) {
          console.error('Command execution error:', error);
          this.speak('Sorry, there was an error executing that command');
        }
        return;
      }
    }

    // No matching command found
    this.speak('Sorry, I didn\'t understand that command. Say "help" for available commands.');
  }

  private showHelp() {
    const categories = Array.from(this.commands.values()).reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, VoiceCommand[]>);

    let helpText = 'Available voice commands: ';
    Object.entries(categories).forEach(([category, commands]) => {
      helpText += `${category}: `;
      helpText += commands.map(cmd => cmd.patterns[0]).join(', ');
      helpText += '. ';
    });

    this.speak(helpText);
  }

  enable(): boolean {
    if (!this.recognition) {
      this.speak('Voice navigation is not supported in this browser');
      return false;
    }

    this.updateState({ isEnabled: true });
    this.startListening();
    this.speak('Voice navigation enabled. Say "help" for commands.');
    return true;
  }

  disable() {
    this.updateState({ isEnabled: false, isListening: false });
    if (this.recognition) {
      this.recognition.stop();
    }
    this.speak('Voice navigation disabled');
  }

  private startListening() {
    if (this.recognition && this.state.isEnabled && !this.state.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Speech recognition start error:', error);
      }
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (this.synthesis) {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 0.8;

      // Use a pleasant voice if available
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.synthesis.speak(utterance);
    }
  }

  private updateState(updates: Partial<VoiceNavigationState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  getState(): VoiceNavigationState {
    return { ...this.state };
  }

  subscribe(listener: (state: VoiceNavigationState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Check if speech recognition is supported
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

// Global instance
let voiceNavigationInstance: VoiceNavigationSystem | null = null;

export function getVoiceNavigation(): VoiceNavigationSystem {
  if (typeof window === 'undefined') {
    throw new Error('Voice navigation is only available in browser environment');
  }

  if (!voiceNavigationInstance) {
    voiceNavigationInstance = new VoiceNavigationSystem();
  }

  return voiceNavigationInstance;
}

// React hook for voice navigation
export function useVoiceNavigation() {
  // Always call hooks first, before any conditional logic
  const [state, setState] = React.useState<VoiceNavigationState>({
    isListening: false,
    isEnabled: false,
    currentCommand: '',
    confidence: 0,
    lastCommand: '',
    commandHistory: []
  });

  React.useEffect(() => {
    // Only set up the subscription if we're in a browser environment
    if (typeof window !== 'undefined') {
      const voiceNav = getVoiceNavigation();
      const unsubscribe = voiceNav.subscribe(setState);
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      state,
      enable: () => false,
      disable: () => {},
      speak: () => {},
      registerCommand: () => {}
    };
  }

  const voiceNav = getVoiceNavigation();

  return {
    isSupported: VoiceNavigationSystem.isSupported(),
    state,
    enable: () => voiceNav.enable(),
    disable: () => voiceNav.disable(),
    speak: (text: string, options?: any) => voiceNav.speak(text, options),
    registerCommand: (command: VoiceCommand) => voiceNav.registerCommand(command)
  };
}