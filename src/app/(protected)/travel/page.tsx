'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  Plane,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Mic,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Navigation,
  Train,
  Car,
  Bus,
  Ship,
  Wallet,
  FileCheck,
  Languages,
  Camera,
  Bell,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Compass,
  Route,
  Hotel,
  Utensils,
  Coffee,
  ShoppingBag,
  Fuel,
  ParkingCircle,
  Ticket,
  CreditCard,
  Banknote,
  Calculator,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  ChevronDown,
  MapIcon,
  CloudSun
} from 'lucide-react';

interface TravelItinerary {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  accommodation?: string;
  transportation?: Transportation[];
  budget: number;
  currency: string;
  status: 'planning' | 'confirmed' | 'ongoing' | 'completed';
}

interface Activity {
  id: string;
  name: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  cost: number;
  currency: string;
  category: 'sightseeing' | 'dining' | 'accommodation' | 'transport' | 'shopping' | 'other';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  notes?: string;
}

interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car' | 'ship';
  from: string;
  to: string;
  departure: Date;
  arrival: Date;
  provider: string;
  bookingReference: string;
  cost: number;
  currency: string;
  status: 'booked' | 'checked-in' | 'delayed' | 'cancelled' | 'completed';
  gate?: string;
  seat?: string;
  trackingUrl?: string;
}

interface TravelExpense {
  id: string;
  itineraryId: string;
  category: 'accommodation' | 'transport' | 'food' | 'activities' | 'shopping' | 'other';
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  description: string;
  date: Date;
  location: string;
  paymentMethod: 'cash' | 'card' | 'digital';
  receipt?: string;
}

interface TravelDocument {
  id: string;
  type: 'passport' | 'visa' | 'ticket' | 'insurance' | 'booking' | 'other';
  name: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingCountry?: string;
  fileUrl?: string;
  notes?: string;
  reminders: boolean;
}

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', OMR: 'ر.ع.', AED: 'د.إ', SAR: 'ر.س', THB: '฿'
};

// Available currencies for conversion
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'OMR', 'AED', 'SAR', 'THB'];


const transportIcons = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
  ship: Ship
};

const categoryColors = {
  accommodation: 'bg-blue-100 text-blue-800 border-blue-200',
  transport: 'bg-green-100 text-green-800 border-green-200',
  food: 'bg-orange-100 text-orange-800 border-orange-200',
  activities: 'bg-purple-100 text-purple-800 border-purple-200',
  shopping: 'bg-pink-100 text-pink-800 border-pink-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
  sightseeing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  dining: 'bg-red-100 text-red-800 border-red-200'
};

export default function TravelCompanionPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [itineraries, setItineraries] = useState<TravelItinerary[]>([]);
  const [expenses, setExpenses] = useState<TravelExpense[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<TravelItinerary | null>(null);
  
  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Currency and exchange rates
  const [baseCurrency, setBaseCurrency] = useState('OMR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  
  // Currency conversion states
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('EUR');
  const [amountToConvert, setAmountToConvert] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');
  
  // Form management states
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  
  // Form data states
  const [newDocument, setNewDocument] = useState({
    type: 'passport',
    name: '',
    documentNumber: '',
    expiryDate: '',
    issuingCountry: '',
    notes: ''
  });
  
  const [newTrip, setNewTrip] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: baseCurrency
  });
  
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    cost: '',
    category: 'other',
    priority: 'medium'
  });
  
  const [newTransport, setNewTransport] = useState({
    type: 'flight',
    from: '',
    to: '',
    departure: '',
    arrival: '',
    provider: '',
    bookingReference: '',
    cost: ''
  });
  
  const [newExpense, setNewExpense] = useState({
    category: 'other',
    amount: '',
    description: '',
    location: '',
    paymentMethod: 'card'
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleItinerary: TravelItinerary = {
      id: '1',
      destination: 'Dubai, UAE',
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-20'),
      budget: 2000,
      currency: process.env.TRAVEL_DEFAULT_CURRENCY || 'OMR',
      status: 'planning',
      activities: [
        {
          id: '1',
          name: 'Visit Burj Khalifa',
          description: 'Observation deck visit at sunset',
          date: new Date('2024-12-16'),
          time: '18:00',
          location: 'Dubai Mall, Dubai',
          cost: 150,
          currency: 'AED',
          category: 'sightseeing',
          priority: 'high',
          completed: false
        },
        {
          id: '2',
          name: 'Desert Safari',
          description: 'Evening desert safari with BBQ dinner',
          date: new Date('2024-12-17'),
          time: '15:00',
          location: 'Dubai Desert',
          cost: 200,
          currency: 'AED',
          category: 'other',
          priority: 'high',
          completed: false
        }
      ],
      transportation: [
        {
          id: '1',
          type: 'flight',
          from: 'Muscat (MCT)',
          to: 'Dubai (DXB)',
          departure: new Date('2024-12-15T08:00'),
          arrival: new Date('2024-12-15T09:30'),
          provider: 'Emirates',
          bookingReference: 'EK123456',
          cost: 300,
          currency: process.env.TRAVEL_DEFAULT_CURRENCY || 'OMR',
          status: 'booked',
          seat: '12A'
        }
      ]
    };

    setItineraries([sampleItinerary]);
    setSelectedItinerary(sampleItinerary);

    // Sample expenses
    setExpenses([
      {
        id: '1',
        itineraryId: '1',
        category: 'accommodation',
        amount: 120,
        currency: 'USD',
        convertedAmount: 46.2,
        baseCurrency: process.env.TRAVEL_DEFAULT_CURRENCY || 'OMR',
        description: 'Hotel booking - 2 nights',
        date: new Date(),
        location: 'Dubai Marina',
        paymentMethod: 'card'
      }
    ]);

    // Sample documents
    setDocuments([
      {
        id: '1',
        type: 'passport',
        name: 'Passport',
        documentNumber: 'A12345678',
        expiryDate: new Date('2030-01-15'),
        issuingCountry: 'Oman',
        reminders: true
      }
    ]);

    // Fetch exchange rates (mock data)
    setExchangeRates({
      USD: 2.6,
      EUR: 2.8,
      GBP: 3.2,
      AED: 0.7,
      SAR: 0.69,
      OMR: 1
    });
  }, []);

  const playAudio = async (audioPath: string) => {
    try {
      console.log('Attempting to play audio:', audioPath);
      const audio = new Audio(audioPath);
      
      // Add event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('Audio loadstart'));
      audio.addEventListener('canplay', () => console.log('Audio canplay'));
      audio.addEventListener('play', () => console.log('Audio playing'));
      audio.addEventListener('error', (e) => console.error('Audio error event:', e));
      
      // Preload the audio
      audio.preload = 'auto';
      
      try {
        await audio.play();
        console.log('Audio played successfully');
      } catch (playError) {
        console.error('Error playing audio:', playError);
        if (playError instanceof Error) {
          console.error('Play error name:', playError.name);
          console.error('Play error message:', playError.message);
        } else if (playError && typeof playError === 'object') {
          console.error('Play error name:', (playError as any).name);
          console.error('Play error message:', (playError as any).message);
        }
        
        // If autoplay is blocked, try to enable audio on user interaction
        if (
          (playError instanceof Error && playError.name === 'NotAllowedError') ||
          (playError && typeof playError === 'object' && (playError as any).name === 'NotAllowedError')
        ) {
          console.log('Autoplay blocked - this is normal for first interaction');
          // The audio will play on subsequent interactions after user allows it
        }
      }
    } catch (error) {
      console.error('Error creating audio object:', error);
    }
  };

  const enableAudio = async () => {
    try {
      // Create a silent audio context to enable audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContext.resume();
      setAudioEnabled(true);
      console.log('Audio context enabled');
    } catch (error) {
      console.error('Error enabling audio context:', error);
    }
  };

  const testWebhookConnection = async () => {
    try {
      console.log('🧪 Testing webhook connection...');
      const response = await fetch('https://n8n.srv903406.hstgr.cloud/webhook/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          message: 'Connection test from travel page',
          timestamp: new Date().toISOString()
        }),
        mode: 'cors'
      });

      console.log('🧪 Test response status:', response.status);
      console.log('🧪 Test response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.text();
        console.log('✅ Webhook is accessible, response:', result);
        
        // Only play response audio if we get exactly "Email sent successfully"
        let parsedResult;
        try {
          parsedResult = JSON.parse(result);
        } catch {
          parsedResult = { message: result };
        }
        
        if (parsedResult.message === 'Email sent successfully') {
          console.log('🔊 Test got exact email confirmation - playing response audio...');
          await playAudio('/travel/VOICE RESPONSE.wav');
        }
        
        setVoiceInput(`Webhook test successful: ${result}`);
        return true;
      } else {
        console.warn('⚠️ Webhook returned non-OK status:', response.status);
        const errorText = await response.text();
        console.warn('⚠️ Error response:', errorText);
        
        setVoiceInput(`Webhook test failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Webhook connection test failed:', error);
      let message = 'Webhook test error';
      if (error instanceof Error) {
        message += ': ' + error.message;
      } else if (error && typeof error === 'object') {
        message += ': ' + (error as any).message;
      }
      setVoiceInput(message);
      return false;
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendAudioToWebhook = async (base64Audio: string) => {
    try {
      console.log('🚀 Sending audio to n8n webhook...');
      console.log('📊 Audio data size:', base64Audio.length, 'characters');
      console.log('🔗 Webhook URL:', 'https://n8n.srv903406.hstgr.cloud/webhook/travel');
      
      const payload = {
        audio: base64Audio,
        timestamp: new Date().toISOString(),
        source: 'travel-page',
        audioFormat: 'audio/webm;codecs=opus',
        dataSize: base64Audio.length
      };
      
      console.log('📦 Payload:', {
        ...payload,
        audio: `${base64Audio.substring(0, 50)}...(${base64Audio.length} chars total)`
      });
      
      const response = await fetch('https://n8n.srv903406.hstgr.cloud/webhook/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Travel-Voice-Assistant/1.0'
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        try {
          const result = await response.json();
          console.log('✅ Webhook response:', result);
          return result;
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError);
          const textResponse = await response.text();
          console.log('📄 Raw response text:', textResponse);
          return { message: 'Webhook received but response was not JSON', rawResponse: textResponse };
        }
      } else {
        console.error('❌ Webhook request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Network error sending audio to webhook:', error);
      let name = '', message = '', stack = '';
      if (error instanceof Error) {
        name = error.name;
        message = error.message;
        stack = error.stack || '';
      } else if (error && typeof error === 'object') {
        name = (error as any).name;
        message = (error as any).message;
        stack = (error as any).stack || '';
      }
      console.error('❌ Error details:', { name, message, stack });
      return null;
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting voice recording...');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setIsProcessing(true);
        
        // Create blob from chunks
        const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        
        // Convert to base64
        const base64Audio = await convertBlobToBase64(audioBlob);
        console.log('Audio converted to base64, length:', base64Audio.length);
        
        // Send to webhook
        console.log('📤 About to send audio to webhook...');
        const webhookResponse = await sendAudioToWebhook(base64Audio);
        console.log('📥 Webhook call completed, response:', webhookResponse);
        
        // Only play response audio when n8n confirms email was sent with "Email sent successfully"
        if (webhookResponse && webhookResponse.message === 'Email sent successfully') {
          console.log('🔊 Email confirmed sent by n8n - playing response audio...');
          await playAudio('/travel/VOICE RESPONSE.wav');
          setVoiceInput('Email sent successfully');
        } else if (webhookResponse !== null) {
          console.log('⏳ Webhook responded but no email confirmation...');
          console.log('📋 Response message:', webhookResponse.message || webhookResponse);
          setVoiceInput(webhookResponse.message || JSON.stringify(webhookResponse) || 'Request processed');
        } else {
          console.log('❌ Webhook failed');
          setVoiceInput('Voice input processed (webhook failed)');
        }
        
        setIsProcessing(false);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Manually stopping recording...');
      mediaRecorder.stop();
    }
  };

  const handleVoiceInput = async () => {
    // Enable audio on first user interaction if not already enabled
    if (!audioEnabled) {
      await enableAudio();
    }
    
    if (!isRecording && !isProcessing) {
      // Test webhook connection first
      console.log('🔍 Testing webhook before starting recording...');
      const webhookAvailable = await testWebhookConnection();
      if (!webhookAvailable) {
        console.warn('⚠️ Webhook test failed, but proceeding with recording anyway...');
      }
      
      // Start recording
      setIsRecording(true);
      console.log('🎤 Playing start audio and beginning recording...');
      
      // Play start audio
      await playAudio('/travel/TRAVEL VOICE.wav');
      
      // Start recording after a brief delay to avoid capturing the start sound
      setTimeout(() => {
        startRecording();
      }, 500);
      
    } else if (isRecording) {
      // Stop recording manually
      setIsRecording(false);
      stopRecording();
    }
  };

  const handleCurrencyConvert = () => {
    if (!amountToConvert.trim() || isNaN(parseFloat(amountToConvert))) {
      setConvertedAmount('Please enter a valid amount');
      return;
    }
    const amount = parseFloat(amountToConvert);
    // Simple currency conversion rates (these would normally come from an API)
    const exchangeRates: Record<string, Record<string, number>> = {
      USD: { EUR: 0.85, GBP: 0.73, JPY: 110, OMR: 0.38, AED: 3.67, SAR: 3.75, THB: 34.5, USD: 1 },
      EUR: { USD: 1.18, GBP: 0.86, JPY: 129, OMR: 0.45, AED: 4.33, SAR: 4.42, THB: 40.7, EUR: 1 },
      GBP: { USD: 1.37, EUR: 1.16, JPY: 150, OMR: 0.52, AED: 5.03, SAR: 5.14, THB: 47.3, GBP: 1 },
      JPY: { USD: 0.0091, EUR: 0.0078, GBP: 0.0067, OMR: 0.0035, AED: 0.034, SAR: 0.034, THB: 0.31, JPY: 1 },
      OMR: { USD: 2.60, EUR: 2.21, GBP: 1.90, JPY: 286, AED: 9.53, SAR: 9.75, THB: 89.7, OMR: 1 },
      AED: { USD: 0.27, EUR: 0.23, GBP: 0.20, JPY: 29.4, OMR: 0.10, SAR: 1.02, THB: 9.4, AED: 1 },
      SAR: { USD: 0.27, EUR: 0.23, GBP: 0.19, JPY: 29.3, OMR: 0.10, AED: 0.98, THB: 9.2, SAR: 1 },
      THB: { USD: 0.029, EUR: 0.025, GBP: 0.021, JPY: 3.23, OMR: 0.011, AED: 0.106, SAR: 0.109, THB: 1 }
    };
    if (currencyFrom === currencyTo) {
      setConvertedAmount(amount.toFixed(2));
      return;
    }
    const rate = exchangeRates[currencyFrom]?.[currencyTo];
    if (rate) {
      const converted = amount * rate;
      setConvertedAmount(converted.toFixed(2));
    } else {
      setConvertedAmount('Conversion rate not available');
    }
  };

  // Document management functions
  const addDocument = () => {
    if (!newDocument.name.trim()) return;
    
    const document: TravelDocument = {
      id: Date.now().toString(),
      type: newDocument.type as TravelDocument['type'],
      name: newDocument.name,
      documentNumber: newDocument.documentNumber,
      expiryDate: newDocument.expiryDate ? new Date(newDocument.expiryDate) : undefined,
      issuingCountry: newDocument.issuingCountry,
      notes: newDocument.notes,
      reminders: true
    };
    
    setDocuments([...documents, document]);
    resetDocumentForm();
  };
  
  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };
  
  // Reset form functions
  const resetTripForm = () => {
    setNewTrip({
      destination: '',
      startDate: '',
      endDate: '',
      budget: '',
      currency: baseCurrency
    });
    setShowTripForm(false);
  };
  
  const resetActivityForm = () => {
    setNewActivity({
      name: '',
      description: '',
      date: '',
      time: '',
      location: '',
      cost: '',
      category: 'other',
      priority: 'medium'
    });
    setShowActivityForm(false);
  };
  
  const resetTransportForm = () => {
    setNewTransport({
      type: 'flight',
      from: '',
      to: '',
      departure: '',
      arrival: '',
      provider: '',
      bookingReference: '',
      cost: ''
    });
    setShowTransportForm(false);
  };
  
  const resetExpenseForm = () => {
    setNewExpense({
      category: 'other',
      amount: '',
      description: '',
      location: '',
      paymentMethod: 'card'
    });
    setShowExpenseForm(false);
  };
  
  const resetDocumentForm = () => {
    setNewDocument({
      type: 'passport',
      name: '',
      documentNumber: '',
      expiryDate: '',
      issuingCountry: '',
      notes: ''
    });
    setShowDocumentForm(false);
  };
  
  // Activity and itinerary functions
  const showTripFormHandler = () => {
    setShowTripForm(true);
  };
  
  const addTripFromForm = () => {
    if (!newTrip.destination || !newTrip.startDate || !newTrip.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    const trip: TravelItinerary = {
      id: Date.now().toString(),
      destination: newTrip.destination,
      startDate: new Date(newTrip.startDate),
      endDate: new Date(newTrip.endDate),
      activities: [],
      budget: parseFloat(newTrip.budget) || 1000,
      currency: newTrip.currency,
      status: 'planning'
    };
    
    setItineraries([...itineraries, trip]);
    setSelectedItinerary(trip);
    resetTripForm();
  };
  
  const showActivityFormHandler = () => {
    setShowActivityForm(true);
  };
  
  const addActivityFromForm = () => {
    if (!selectedItinerary || !newActivity.name || !newActivity.date) {
      alert('Please fill in all required fields');
      return;
    }
    
    const activity: Activity = {
      id: Date.now().toString(),
      name: newActivity.name,
      description: newActivity.description,
      date: new Date(newActivity.date),
      time: newActivity.time,
      location: newActivity.location,
      cost: parseFloat(newActivity.cost) || 0,
      currency: selectedItinerary.currency,
      category: newActivity.category as Activity['category'],
      priority: newActivity.priority as Activity['priority'],
      completed: false
    };
    
    const updatedItinerary = {
      ...selectedItinerary,
      activities: [...(selectedItinerary.activities || []), activity]
    };
    
    setItineraries(itineraries.map(it => it.id === selectedItinerary.id ? updatedItinerary : it));
    setSelectedItinerary(updatedItinerary);
    resetActivityForm();
  };
  
  const showTransportFormHandler = () => {
    setShowTransportForm(true);
  };
  
  const addTransportFromForm = () => {
    if (!selectedItinerary || !newTransport.from || !newTransport.to || !newTransport.departure) {
      alert('Please fill in all required fields');
      return;
    }
    
    const transport: Transportation = {
      id: Date.now().toString(),
      type: newTransport.type as Transportation['type'],
      from: newTransport.from,
      to: newTransport.to,
      departure: new Date(newTransport.departure),
      arrival: new Date(newTransport.arrival || newTransport.departure),
      provider: newTransport.provider,
      bookingReference: newTransport.bookingReference,
      cost: parseFloat(newTransport.cost) || 0,
      currency: selectedItinerary.currency,
      status: 'booked'
    };
    
    const updatedItinerary = {
      ...selectedItinerary,
      transportation: [...(selectedItinerary.transportation || []), transport]
    };
    
    setItineraries(itineraries.map(it => it.id === selectedItinerary.id ? updatedItinerary : it));
    setSelectedItinerary(updatedItinerary);
    resetTransportForm();
  };
  
  const showExpenseFormHandler = () => {
    setShowExpenseForm(true);
  };
  
  const addExpenseFromForm = () => {
    if (!selectedItinerary || !newExpense.description || !newExpense.amount) {
      alert('Please fill in all required fields');
      return;
    }
    
    const amount = parseFloat(newExpense.amount);
    const expense: TravelExpense = {
      id: Date.now().toString(),
      itineraryId: selectedItinerary.id,
      category: newExpense.category as TravelExpense['category'],
      amount: amount,
      currency: selectedItinerary.currency,
      convertedAmount: convertCurrency(amount, selectedItinerary.currency, baseCurrency),
      baseCurrency: baseCurrency,
      description: newExpense.description,
      date: new Date(),
      location: newExpense.location || selectedItinerary.destination,
      paymentMethod: newExpense.paymentMethod as TravelExpense['paymentMethod']
    };
    
    setExpenses([...expenses, expense]);
    resetExpenseForm();
  };

  const getTotalExpenses = (itineraryId: string): number => {
    return expenses
      .filter(exp => exp.itineraryId === itineraryId)
      .reduce((total, exp) => total + exp.convertedAmount, 0);
  };

  // Logic function for currency conversion
  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    if (!exchangeRates[from] || !exchangeRates[to]) return amount;
    const rate = exchangeRates[from] / exchangeRates[to];
    return amount * rate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl shadow-2xl">
                <Compass className="h-10 w-10 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  {t('travelCompanion') || 'Travel Companion'}
                </h1>
                <p className="text-gray-600 font-medium text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  {t('planTrackManage') || 'Plan, track, and manage your journeys'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleVoiceInput}
                disabled={isProcessing}
                className={`${
                  isProcessing 
                    ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' 
                    : isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
                } text-white font-bold`}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isProcessing 
                  ? 'Processing...' 
                  : isRecording 
                    ? t('stopRecording') || 'Stop Recording' 
                    : t('voiceInput') || 'Voice Input'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-2 shadow-lg">
            <TabsTrigger value="itinerary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-black data-[state=active]:font-bold">
              <Route className="h-4 w-4 mr-2" />
              {t('itinerary') || 'Itinerary'}
            </TabsTrigger>
            <TabsTrigger value="transport" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-black data-[state=active]:font-bold">
              <Plane className="h-4 w-4 mr-2" />
              {t('transport') || 'Transport'}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-black data-[state=active]:font-bold">
              <Wallet className="h-4 w-4 mr-2" />
              {t('expenses')}
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-black data-[state=active]:font-bold">
              <FileText className="h-4 w-4 mr-2" />
              {t('documents') || 'Documents'}
            </TabsTrigger>
            <TabsTrigger value="convert" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-black data-[state=active]:font-bold">
              <DollarSign className="h-4 w-4 mr-2" />
              {t('currency_convert') || 'Currency Convert'}
            </TabsTrigger>
          </TabsList>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Itinerary List */}
              <div className="xl:col-span-2 space-y-6">
                <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-2xl text-gray-800">Your Itineraries</CardTitle>
                      <Button 
                        onClick={showTripFormHandler}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Trip
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {itineraries.map((itinerary) => (
                      <div key={itinerary.id} className="p-4 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all cursor-pointer"
                           onClick={() => setSelectedItinerary(itinerary)}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{itinerary.destination}</h3>
                            <p className="text-gray-600 text-sm flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {itinerary.startDate.toLocaleDateString()} - {itinerary.endDate.toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`${itinerary.status === 'planning' ? 'bg-yellow-100 text-yellow-800' : 
                                            itinerary.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            itinerary.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'}`}>
                            {itinerary.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-500">Budget</p>
                            <p className="font-bold text-gray-800">{currencySymbols[itinerary.currency]}{itinerary.budget}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">Activities</p>
                            <p className="font-bold text-gray-800">{itinerary.activities?.length || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">Spent</p>
                            <p className="font-bold text-purple-600">{currencySymbols[baseCurrency]}{getTotalExpenses(itinerary.id).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Activities List */}
                {selectedItinerary && (
                  <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-gray-800">Activities - {selectedItinerary.destination}</CardTitle>
                        <Button 
                          onClick={showActivityFormHandler}
                          variant="outline" 
                          className="bg-white/60 hover:bg-white/80"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Activity
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedItinerary.activities?.map((activity) => (
                        <div key={activity.id} className="p-4 bg-gradient-to-r from-white/60 to-white/40 rounded-xl border border-white/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${activity.priority === 'high' ? 'bg-red-100' : activity.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                <Star className={`h-4 w-4 ${activity.priority === 'high' ? 'text-red-600' : activity.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                                <p className="text-sm text-gray-600">{activity.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={categoryColors[activity.category]}>
                              {activity.category}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-xs text-gray-600 mt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {activity.date.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {currencySymbols[activity.currency]}{activity.cost}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Actions Sidebar */}
              <div className="space-y-6">
                {/* Voice Input Panel */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                      <Mic className="h-5 w-5 text-blue-600" />
                      Voice Planning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleVoiceInput}
                      disabled={isProcessing}
                      className={`w-full h-12 ${
                        isProcessing 
                          ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' 
                          : isRecording 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
                      } text-white font-bold`}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isProcessing 
                        ? 'Processing...' 
                        : isRecording 
                          ? 'Recording... (Click to stop)' 
                          : 'Add Activity by Voice'}
                    </Button>
                    
                    {(isRecording || isProcessing) && (
                      <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-700">
                          {isRecording ? '🎤 Listening... (Click button again to stop)' : '⚡ Processing audio...'}
                        </p>
                      </div>
                    )}
                    
                    {voiceInput && !isRecording && !isProcessing && (
                      <div className="p-3 bg-white/60 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-700">Voice Input Result:</p>
                        <p className="text-sm text-gray-700">{voiceInput}</p>
                      </div>
                    )}

                    {/* Debug buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={testWebhookConnection}
                        variant="outline"
                        className="w-full h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm"
                      >
                        🧪 Test Webhook Connection
                      </Button>
                      <Button
                        onClick={async () => {
                          console.log('🧪 Testing webhook with fake audio...');
                          setIsProcessing(true);
                          const fakeAudioData = btoa('fake-audio-data-for-testing');
                          const response = await sendAudioToWebhook(fakeAudioData);
                          console.log('🧪 Fake audio test response:', response);
                          
                          // Only play response audio if we get exactly "Email sent successfully"
                          if (response && response.message === 'Email sent successfully') {
                            console.log('🔊 Fake audio test got exact email confirmation - playing response audio...');
                            await playAudio('/travel/VOICE RESPONSE.wav');
                            setVoiceInput('Fake audio test: Email sent successfully');
                          } else {
                            setVoiceInput(response ? `Fake audio test response: ${response.message || JSON.stringify(response)}` : 'Fake audio test failed');
                          }
                          setIsProcessing(false);
                        }}
                        variant="outline"
                        className="w-full h-10 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium text-sm"
                      >
                        🎵 Test Webhook with Fake Audio
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Weather Widget */}
                {selectedItinerary && (
                  <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-3xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                        <CloudSun className="h-5 w-5 text-cyan-600" />
                        Weather Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">28°C</p>
                        <p className="text-sm text-gray-600">Sunny</p>
                        <p className="text-xs text-gray-500 mt-2">{selectedItinerary.destination}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Trip Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedItinerary && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Budget</span>
                          <span className="font-bold text-gray-800">{currencySymbols[selectedItinerary.currency]}{selectedItinerary.budget}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Spent</span>
                          <span className="font-bold text-red-600">{currencySymbols[baseCurrency]}{getTotalExpenses(selectedItinerary.id).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Remaining</span>
                          <span className="font-bold text-green-600">{currencySymbols[baseCurrency]}{(selectedItinerary.budget - getTotalExpenses(selectedItinerary.id)).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((getTotalExpenses(selectedItinerary.id) / selectedItinerary.budget) * 100, 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs content will be added here */}
          <TabsContent value="transport">
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-gray-800">Transportation Tracking</CardTitle>
                  <Button 
                    onClick={showTransportFormHandler}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transport
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItinerary?.transportation?.map((transport) => {
                  const TransportIcon = transportIcons[transport.type];
                  return (
                    <div key={transport.id} className="p-6 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl border border-white/40 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl">
                            <TransportIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{transport.provider}</h3>
                            <p className="text-gray-600">{transport.from} → {transport.to}</p>
                          </div>
                        </div>
                        <Badge className={`${transport.status === 'booked' ? 'bg-blue-100 text-blue-800' : 
                                          transport.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                                          transport.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                                          transport.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'}`}>
                          {transport.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Departure</p>
                          <p className="font-bold text-gray-800">{transport.departure.toLocaleDateString()}</p>
                          <p className="text-gray-600">{transport.departure.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Arrival</p>
                          <p className="font-bold text-gray-800">{transport.arrival.toLocaleDateString()}</p>
                          <p className="text-gray-600">{transport.arrival.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Cost</p>
                          <p className="font-bold text-gray-800">{currencySymbols[transport.currency]}{transport.cost}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Reference</p>
                          <p className="font-bold text-gray-800">{transport.bookingReference}</p>
                          {transport.seat && <p className="text-gray-600">Seat: {transport.seat}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(!selectedItinerary?.transportation || selectedItinerary.transportation.length === 0) && (
                  <div className="text-center py-8">
                    <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transportation bookings yet</p>
                    <p className="text-sm text-gray-400">Add your flights, trains, or other transport</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="space-y-6">
              {/* Expense Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl shadow-xl">
                  <CardContent className="p-6 text-center">
                    <Wallet className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-800">{currencySymbols[baseCurrency]}{getTotalExpenses(selectedItinerary?.id || '').toFixed(2)}</p>
                    <p className="text-sm text-purple-600">Total Spent</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-3xl shadow-xl">
                  <CardContent className="p-6 text-center">
                    <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">{selectedItinerary ? currencySymbols[selectedItinerary.currency] + (selectedItinerary.budget - getTotalExpenses(selectedItinerary.id)).toFixed(2) : 'N/A'}</p>
                    <p className="text-sm text-blue-600">Remaining</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl shadow-xl">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800">{expenses.filter(e => e.itineraryId === selectedItinerary?.id).length}</p>
                    <p className="text-sm text-green-600">Transactions</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-3xl shadow-xl">
                  <CardContent className="p-6 text-center">
                    <Banknote className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-800">{selectedItinerary ? Math.round((getTotalExpenses(selectedItinerary.id) / selectedItinerary.budget) * 100) : 0}%</p>
                    <p className="text-sm text-orange-600">Budget Used</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expense List */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl text-gray-800">Expense Management</CardTitle>
                    <Button 
                      onClick={showExpenseFormHandler}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expenses.filter(exp => exp.itineraryId === selectedItinerary?.id).map((expense) => (
                    <div key={expense.id} className="p-6 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl border border-white/40 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${categoryColors[expense.category]}`}>
                            {expense.category === 'accommodation' && <Hotel className="h-6 w-6" />}
                            {expense.category === 'transport' && <Car className="h-6 w-6" />}
                            {expense.category === 'food' && <Utensils className="h-6 w-6" />}
                            {expense.category === 'activities' && <Camera className="h-6 w-6" />}
                            {expense.category === 'shopping' && <ShoppingBag className="h-6 w-6" />}
                            {expense.category === 'other' && <DollarSign className="h-6 w-6" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{expense.description}</h3>
                            <p className="text-gray-600">{expense.location}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={categoryColors[expense.category]}>
                          {expense.category}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Amount</p>
                          <p className="font-bold text-gray-800">{currencySymbols[expense.currency]}{expense.amount}</p>
                          <p className="text-gray-600 text-xs">≈ {currencySymbols[expense.baseCurrency]}{expense.convertedAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Date</p>
                          <p className="font-bold text-gray-800">{expense.date.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Payment</p>
                          <p className="font-bold text-gray-800 capitalize">{expense.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Receipt</p>
                          <p className="text-gray-600">{expense.receipt ? 'Available' : 'Not saved'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {expenses.filter(exp => exp.itineraryId === selectedItinerary?.id).length === 0 && (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No expenses recorded yet</p>
                      <p className="text-sm text-gray-400">Start tracking your travel expenses</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              {/* Document Management */}
              <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl text-gray-800">Travel Documents</CardTitle>
                    <Button 
                      onClick={() => setShowDocumentForm(true)}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Document Form */}
                  {showDocumentForm && (
                    <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 space-y-4">
                      <h3 className="text-lg font-bold text-gray-800">Add New Document</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Document Type</Label>
                          <Select value={newDocument.type} onValueChange={(value) => setNewDocument({...newDocument, type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="visa">Visa</SelectItem>
                              <SelectItem value="ticket">Ticket</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="booking">Booking</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Document Name</Label>
                          <Input 
                            value={newDocument.name}
                            onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                            placeholder="e.g., US Passport"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Document Number</Label>
                          <Input 
                            value={newDocument.documentNumber}
                            onChange={(e) => setNewDocument({...newDocument, documentNumber: e.target.value})}
                            placeholder="Document number"
                          />
                        </div>
                        
                        <div>
                          <Label>Issuing Country</Label>
                          <Input 
                            value={newDocument.issuingCountry}
                            onChange={(e) => setNewDocument({...newDocument, issuingCountry: e.target.value})}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Expiry Date</Label>
                        <Input 
                          type="date"
                          value={newDocument.expiryDate}
                          onChange={(e) => setNewDocument({...newDocument, expiryDate: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label>Notes</Label>
                        <Textarea 
                          value={newDocument.notes}
                          onChange={(e) => setNewDocument({...newDocument, notes: e.target.value})}
                          placeholder="Additional notes..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button onClick={addDocument} className="bg-green-600 hover:bg-green-700 text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Save Document
                        </Button>
                        <Button onClick={resetDocumentForm} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Documents List */}
                  <div className="space-y-4">
                    {documents.map((document) => (
                      <div key={document.id} className="p-6 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl border border-white/40 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl">
                              {document.type === 'passport' && <FileCheck className="h-6 w-6 text-orange-600" />}
                              {document.type === 'visa' && <FileText className="h-6 w-6 text-orange-600" />}
                              {document.type === 'ticket' && <Ticket className="h-6 w-6 text-orange-600" />}
                              {document.type === 'insurance' && <FileCheck className="h-6 w-6 text-orange-600" />}
                              {document.type === 'booking' && <FileText className="h-6 w-6 text-orange-600" />}
                              {document.type === 'other' && <FileText className="h-6 w-6 text-orange-600" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-800">{document.name}</h3>
                              <p className="text-gray-600 capitalize">{document.type}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => deleteDocument(document.id)}
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {document.documentNumber && (
                            <div>
                              <p className="text-gray-500 font-medium">Number</p>
                              <p className="font-bold text-gray-800">{document.documentNumber}</p>
                            </div>
                          )}
                          {document.issuingCountry && (
                            <div>
                              <p className="text-gray-500 font-medium">Issued by</p>
                              <p className="font-bold text-gray-800">{document.issuingCountry}</p>
                            </div>
                          )}
                          {document.expiryDate && (
                            <div>
                              <p className="text-gray-500 font-medium">Expires</p>
                              <p className={`font-bold ${
                                new Date(document.expiryDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) 
                                  ? 'text-red-600' : 'text-gray-800'
                              }`}>
                                {new Date(document.expiryDate).toLocaleDateString()}
                              </p>
                              {new Date(document.expiryDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) && (
                                <p className="text-xs text-red-600">Expires soon!</p>
                              )}
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 font-medium">Status</p>
                            <Badge className={`${
                              document.expiryDate && new Date(document.expiryDate) < new Date() 
                                ? 'bg-red-100 text-red-800' 
                                : document.expiryDate && new Date(document.expiryDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {document.expiryDate && new Date(document.expiryDate) < new Date() 
                                ? 'Expired' 
                                : document.expiryDate && new Date(document.expiryDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                                  ? 'Expiring Soon'
                                  : 'Valid'}
                            </Badge>
                          </div>
                        </div>
                        
                        {document.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{document.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {documents.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No documents added yet</p>
                        <p className="text-sm text-gray-400">Add your travel documents for easy access</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="convert">
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Currency Converter</CardTitle>
                <p className="text-sm text-gray-600">Convert between currencies using real-time math calculations</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Currency</Label>
                    <Select value={currencyFrom} onValueChange={setCurrencyFrom}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency} {currencySymbols[currency as keyof typeof currencySymbols]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>To Currency</Label>
                    <Select value={currencyTo} onValueChange={setCurrencyTo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency} {currencySymbols[currency as keyof typeof currencySymbols]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Amount to Convert</Label>
                  <input
                    type="number"
                    value={amountToConvert}
                    onChange={(e) => setAmountToConvert(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="space-y-3">
                  <Button onClick={handleCurrencyConvert} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Convert Currency
                  </Button>
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      onClick={() => setAmountToConvert('10')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      10
                    </Button>
                    <Button 
                      onClick={() => setAmountToConvert('50')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      50
                    </Button>
                    <Button 
                      onClick={() => setAmountToConvert('100')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      100
                    </Button>
                    <Button 
                      onClick={() => setAmountToConvert('500')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      500
                    </Button>
                    <Button 
                      onClick={() => setAmountToConvert('1000')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      1,000
                    </Button>
                    <Button 
                      onClick={() => setAmountToConvert('5000')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      5,000
                    </Button>
                  </div>
                </div>
                
                {convertedAmount && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <Label className="text-sm font-semibold text-indigo-700">Converted Amount:</Label>
                    <p className="text-gray-800 mt-2 text-xl font-bold">
                      {amountToConvert} {currencyFrom} = {convertedAmount} {currencyTo}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Exchange rate: 1 {currencyFrom} = {(parseFloat(convertedAmount) / parseFloat(amountToConvert)).toFixed(4)} {currencyTo}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Forms */}
        
        {/* Trip Form Modal */}
        {showTripForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add New Trip</CardTitle>
                  <Button onClick={resetTripForm} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Destination *</Label>
                  <Input 
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                    placeholder="e.g., Paris, France"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Input 
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input 
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Budget</Label>
                    <Input 
                      type="number"
                      value={newTrip.budget}
                      onChange={(e) => setNewTrip({...newTrip, budget: e.target.value})}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={newTrip.currency} onValueChange={(value) => setNewTrip({...newTrip, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(currencySymbols).map((currency) => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={addTripFromForm} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Create Trip
                  </Button>
                  <Button onClick={resetTripForm} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Form Modal */}
        {showActivityForm && selectedItinerary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add Activity - {selectedItinerary.destination}</CardTitle>
                  <Button onClick={resetActivityForm} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Activity Name *</Label>
                  <Input 
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                    placeholder="e.g., Visit Eiffel Tower"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                    placeholder="Activity details..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input 
                      type="date"
                      value={newActivity.date}
                      onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input 
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input 
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                    placeholder="Location or address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Cost</Label>
                    <Input 
                      type="number"
                      value={newActivity.cost}
                      onChange={(e) => setNewActivity({...newActivity, cost: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={newActivity.category} onValueChange={(value) => setNewActivity({...newActivity, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sightseeing">Sightseeing</SelectItem>
                        <SelectItem value="dining">Dining</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={newActivity.priority} onValueChange={(value) => setNewActivity({...newActivity, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={addActivityFromForm} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                  <Button onClick={resetActivityForm} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transport Form Modal */}
        {showTransportForm && selectedItinerary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add Transport - {selectedItinerary.destination}</CardTitle>
                  <Button onClick={resetTransportForm} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Transport Type</Label>
                  <Select value={newTransport.type} onValueChange={(value) => setNewTransport({...newTransport, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flight">Flight</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From *</Label>
                    <Input 
                      value={newTransport.from}
                      onChange={(e) => setNewTransport({...newTransport, from: e.target.value})}
                      placeholder="Origin city/airport"
                    />
                  </div>
                  <div>
                    <Label>To *</Label>
                    <Input 
                      value={newTransport.to}
                      onChange={(e) => setNewTransport({...newTransport, to: e.target.value})}
                      placeholder="Destination city/airport"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Departure *</Label>
                    <Input 
                      type="datetime-local"
                      value={newTransport.departure}
                      onChange={(e) => setNewTransport({...newTransport, departure: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Arrival</Label>
                    <Input 
                      type="datetime-local"
                      value={newTransport.arrival}
                      onChange={(e) => setNewTransport({...newTransport, arrival: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Provider</Label>
                    <Input 
                      value={newTransport.provider}
                      onChange={(e) => setNewTransport({...newTransport, provider: e.target.value})}
                      placeholder="Airline/Company name"
                    />
                  </div>
                  <div>
                    <Label>Booking Reference</Label>
                    <Input 
                      value={newTransport.bookingReference}
                      onChange={(e) => setNewTransport({...newTransport, bookingReference: e.target.value})}
                      placeholder="Booking/Flight number"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cost</Label>
                  <Input 
                    type="number"
                    value={newTransport.cost}
                    onChange={(e) => setNewTransport({...newTransport, cost: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={addTransportFromForm} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Add Transport
                  </Button>
                  <Button onClick={resetTransportForm} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expense Form Modal */}
        {showExpenseForm && selectedItinerary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add Expense - {selectedItinerary.destination}</CardTitle>
                  <Button onClick={resetExpenseForm} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description *</Label>
                  <Input 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="e.g., Hotel booking, Restaurant meal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount *</Label>
                    <Input 
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="activities">Activities</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Input 
                      value={newExpense.location}
                      onChange={(e) => setNewExpense({...newExpense, location: e.target.value})}
                      placeholder="Location of expense"
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={newExpense.paymentMethod} onValueChange={(value) => setNewExpense({...newExpense, paymentMethod: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="digital">Digital Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={addExpenseFromForm} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                  <Button onClick={resetExpenseForm} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}