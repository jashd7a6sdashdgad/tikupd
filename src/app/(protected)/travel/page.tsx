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
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', OMR: 'ر.ع.', AED: 'د.إ', SAR: 'ر.س'
};

// Top 50 languages for translation
const languages = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mr', name: 'Marathi' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' }
];

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
  
  // Currency and exchange rates
  const [baseCurrency, setBaseCurrency] = useState('OMR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  
  // Translation states
  const [translateFrom, setTranslateFrom] = useState('en');
  const [translateTo, setTranslateTo] = useState('ar');
  const [textToTranslate, setTextToTranslate] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  
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

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Voice recognition implementation would go here
    if (!isRecording) {
      // Start recording
      console.log('Starting voice recording for itinerary planning...');
    } else {
      // Stop recording and process
      console.log('Processing voice input...');
      setVoiceInput('Sample voice input: Add visit to Gold Souk on December 16th at 2 PM');
    }
  };

  const translateText = async () => {
    if (!textToTranslate.trim()) {
      setTranslatedText('Please enter text to translate');
      return;
    }
    
    try {
      // Mock translation with more comprehensive examples
      const translations: Record<string, Record<string, string>> = {
        'Hello': {
          ar: 'مرحبا', es: 'Hola', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', 
          pt: 'Olá', ru: 'Привет', ja: 'こんにちは', ko: '안녕하세요', zh: '你好'
        },
        'Thank you': {
          ar: 'شكرا لك', es: 'Gracias', fr: 'Merci', de: 'Danke', it: 'Grazie',
          pt: 'Obrigado', ru: 'Спасибо', ja: 'ありがとう', ko: '감사합니다', zh: '谢谢'
        },
        'Where is the airport?': {
          ar: 'أين المطار؟', es: '¿Dónde está el aeropuerto?', fr: 'Où est l\'aéroport?',
          de: 'Wo ist der Flughafen?', it: 'Dov\'è l\'aeroporto?', pt: 'Onde fica o aeroporto?'
        },
        'How much does this cost?': {
          ar: 'كم يكلف هذا؟', es: '¿Cuánto cuesta esto?', fr: 'Combien ça coûte?',
          de: 'Wie viel kostet das?', it: 'Quanto costa?', pt: 'Quanto custa isto?'
        },
        'I need help': {
          ar: 'أحتاج المساعدة', es: 'Necesito ayuda', fr: 'J\'ai besoin d\'aide',
          de: 'Ich brauche Hilfe', it: 'Ho bisogno di aiuto', pt: 'Preciso de ajuda'
        },
        'Where is the hotel?': {
          ar: 'أين الفندق؟', es: '¿Dónde está el hotel?', fr: 'Où est l\'hôtel?',
          de: 'Wo ist das Hotel?', it: 'Dov\'è l\'hotel?', pt: 'Onde fica o hotel?'
        }
      };
      
      const result = translations[textToTranslate]?.[translateTo] || 
                    `Translation from ${languages.find(l => l.code === translateFrom)?.name} to ${languages.find(l => l.code === translateTo)?.name} not available for "${textToTranslate}"`;
      
      setTranslatedText(result);
    } catch (error) {
      setTranslatedText('Translation failed. Please try again.');
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

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    const rate = exchangeRates[from] / exchangeRates[to];
    return amount * rate;
  };

  const getTotalExpenses = (itineraryId: string): number => {
    return expenses
      .filter(exp => exp.itineraryId === itineraryId)
      .reduce((total, exp) => total + exp.convertedAmount, 0);
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
                className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'} text-black font-bold`}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? t('stopRecording') || 'Stop Recording' : t('voiceInput') || 'Voice Input'}
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
            <TabsTrigger value="translate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-black data-[state=active]:font-bold">
              <Languages className="h-4 w-4 mr-2" />
              {t('translate') || 'Translate'}
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
                      className={`w-full h-12 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'} text-black font-bold`}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording ? 'Recording...' : 'Add Activity by Voice'}
                    </Button>
                    
                    {voiceInput && (
                      <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-700">Voice Input:</p>
                        <p className="text-sm text-gray-700">{voiceInput}</p>
                      </div>
                    )}
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

          <TabsContent value="translate">
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Language Translation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From</Label>
                    <Select value={translateFrom} onValueChange={setTranslateFrom}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>To</Label>
                    <Select value={translateTo} onValueChange={setTranslateTo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Textarea
                  value={textToTranslate}
                  onChange={(e) => setTextToTranslate(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="min-h-[100px]"
                />
                
                <div className="space-y-3">
                  <Button onClick={translateText} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold">
                    <Languages className="h-4 w-4 mr-2" />
                    Translate
                  </Button>
                  
                  {/* Common Travel Phrases */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => setTextToTranslate('Hello')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      Hello
                    </Button>
                    <Button 
                      onClick={() => setTextToTranslate('Thank you')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      Thank you
                    </Button>
                    <Button 
                      onClick={() => setTextToTranslate('Where is the airport?')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      Airport?
                    </Button>
                    <Button 
                      onClick={() => setTextToTranslate('How much does this cost?')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      How much?
                    </Button>
                    <Button 
                      onClick={() => setTextToTranslate('I need help')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      Need help
                    </Button>
                    <Button 
                      onClick={() => setTextToTranslate('Where is the hotel?')}
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      Hotel?
                    </Button>
                  </div>
                </div>
                
                {translatedText && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <Label className="text-sm font-semibold text-indigo-700">Translation:</Label>
                    <p className="text-gray-800 mt-2">{translatedText}</p>
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