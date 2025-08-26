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
        recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';

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

  // Perform search using SearXNG
  const performSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    
    try {
      // Search for web results using local API proxy
      const webResponse = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&categories=general&format=json&safesearch=1`);
      const webData = await webResponse.json();
      
      // Search for images
      const imageResponse = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&categories=images&format=json&safesearch=1`);
      const imageData = await imageResponse.json();
      
      // Search for places/maps
      const placeResponse = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&categories=map&format=json&safesearch=1`);
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
      setSearchResults(webData.results || []);
      setImageResults(imageData.results || []);
      setPlaceResults(placeData.results || []);
      
      // Announce results if voice is enabled
      if (voiceSettings.voiceEnabled && voiceSettings.autoPlayResponses) {
        const resultCount = (webData.results || []).length;
        const announcement = `Found ${resultCount} results for ${searchQuery}`;
        speakText(announcement);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, voiceSettings, speakText]);

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

        {/* Results Tabs */}
        {(searchResults.length > 0 || imageResults.length > 0 || placeResults.length > 0) && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setActiveTab('web')}
                    variant={activeTab === 'web' ? 'primary' : 'ghost'}
                    className={`flex-1 ${activeTab === 'web' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : ''}`}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Web ({searchResults.length})
                  </Button>
                  <Button
                    onClick={() => setActiveTab('images')}
                    variant={activeTab === 'images' ? 'primary' : 'ghost'}
                    className={`flex-1 ${activeTab === 'images' ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white' : ''}`}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Images ({imageResults.length})
                  </Button>
                  <Button
                    onClick={() => setActiveTab('places')}
                    variant={activeTab === 'places' ? 'primary' : 'ghost'}
                    className={`flex-1 ${activeTab === 'places' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Places ({placeResults.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Web Results */}
            {activeTab === 'web' && searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.slice(0, 10).map((result, index) => (
                  <Card key={index} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
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
                    <div className="border rounded p-2 bg-white hover:shadow-lg transition-shadow cursor-pointer">
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
                  <Card key={index} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
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