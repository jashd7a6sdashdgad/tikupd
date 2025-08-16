'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import {
  Camera, Upload, Download, Trash2, Search, Grid, List, Heart, Share2,
  Eye, Plus, Filter, ImageIcon, Mic, Brain, Sparkles, Album, Copy, Zap,
  Tag, MapPin, Calendar, Users, Palette, X, XCircle, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import PhotoDashboard from '@/components/PhotoDashboard';

// --- Fix: Add the necessary imports for PhotoIntelligence and useVoiceInput ---
import { PhotoIntelligence } from '@/lib/photoIntelligence';
import { useVoiceInput } from '@/hooks/useVoiceInput';

// --- Interfaces ---
interface Photo {
  id: string;
  name: string;
  size?: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  isFavorite?: boolean;
}

interface SmartAlbum {
  id: string;
  name: string;
  description: string;
  photoCount: number;
  thumbnailUrl?: string;
  createdAt: Date;
  criteria: {
    type: 'event' | 'time' | 'people' | 'location' | 'theme';
    value: any;
  };
}

interface PhotoMetadata {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  createdTime: Date;
  modifiedTime: Date;
  searchableText?: string;
  aiTags?: string[];
  textContent?: string[];
  people?: string[];
}

// --- Helper Functions ---
const formatFileSize = (size: string | number | undefined) => {
  if (!size) return 'Unknown size';
  const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// --- DriveImage Component ---
const DriveImage = ({ photo, alt, className, quality = 85 }: { photo: Photo, alt: string, className?: string, quality?: number }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const src = photo.thumbnailLink || photo.webContentLink;

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}>
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-200 text-red-500 ${className}`}>
        <XCircle className="h-8 w-8" />
        <p className="text-xs mt-1 text-center text-gray-500">Failed to load</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="cover"
        onLoadingComplete={handleLoadingComplete}
        onError={handleImageError}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        quality={quality}
      />
    </div>
  );
};

// --- Main Component ---
export default function PhotosPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- State Management ---
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Smart photo features state
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [smartAlbums, setSmartAlbums] = useState<SmartAlbum[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<string[][]>([]);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');

  // --- Hooks & Instances ---
  const photoIntelligence = useMemo(() => new PhotoIntelligence(), []);
  const {
    isListening, transcript, startListening, stopListening, resetTranscript, isSupported
  } = useVoiceInput();

  // --- Utility Functions ---
  const showNotification = useCallback((type: 'success' | 'error', message: string, duration = 4000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    if (type === 'success') {
      setSuccessMessage(message);
      setError(null);
    } else {
      setError(message);
      setSuccessMessage(null);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, duration);
  }, []);

  // --- Data Fetching & Auth ---
  const checkGoogleAuth = useCallback(async () => {
    try {
      // Check if user has Google tokens by calling our auth check endpoint
      const response = await fetch('/api/google/drive/photos');
      const data = await response.json();
      
      if (data.needsAuth || response.status === 401) {
        setNeedsAuth(true);
        setIsLoading(false);
        return false;
      }
      
      setNeedsAuth(false);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      setNeedsAuth(true);
      setIsLoading(false);
      return false;
    }
  }, []);

  const loadPhotosFromDrive = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the existing Google Drive API that handles token management
      const response = await fetch('/api/google/drive/photos');
      const data = await response.json();
      
      if (!response.ok) {
        if (data.needsAuth || response.status === 401) {
          setNeedsAuth(true);
          throw new Error('Please connect your Google account using the sidebar.');
        }
        throw new Error(data.error || 'Failed to load photos');
      }
      
      if (data.success) {
        const loadedPhotos: Photo[] = data.photos || [];
        setPhotos(loadedPhotos);
        const metadata = loadedPhotos.map(photo => ({
          id: photo.id, name: photo.name, url: photo.webViewLink,
          thumbnailUrl: photo.thumbnailLink,
          size: photo.size ? parseInt(photo.size, 10) : undefined,
          mimeType: photo.mimeType, createdTime: new Date(photo.createdTime),
          modifiedTime: new Date(photo.modifiedTime),
          searchableText: (photo.name || '').toLowerCase()
        }));
        setPhotoMetadata(metadata);
        console.log('📸 Loaded', loadedPhotos.length, 'photos from Google Drive');
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Failed to load photos:', err);
      showNotification('error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const loadPhotos = useCallback(async () => {
    const isAuthed = await checkGoogleAuth();
    if (isAuthed) {
      await loadPhotosFromDrive();
    }
  }, [checkGoogleAuth, loadPhotosFromDrive]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // --- Photo Management ---
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check auth first
    const isAuthed = await checkGoogleAuth();
    if (!isAuthed) {
      showNotification('error', 'Please connect your Google account using the sidebar first.');
      setNeedsAuth(true);
      return;
    }

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async file => {
      try {
        if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image.`);
        if (file.size > 50 * 1024 * 1024) throw new Error(`"${file.name}" is too large (max 50MB).`);

        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch('/api/google/drive/photos', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok) {
          if (data.needsAuth || response.status === 401) setNeedsAuth(true);
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
        return data.photo;
      } catch (err: any) {
        throw new Error(`Upload failed for ${file.name}: ${err.message}`);
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads: Photo[] = [];
    const failedUploads: string[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successfulUploads.push(result.value);
      } else if (result.status === 'rejected') {
        failedUploads.push(result.reason.message);
      }
    });

    if (successfulUploads.length > 0) {
      setPhotos(prev => [...successfulUploads, ...prev]);
      showNotification('success', `Successfully uploaded ${successfulUploads.length} photo(s).`);
      successfulUploads.forEach(photo => analyzeNewPhoto(photo).catch(console.warn));
    }

    if (failedUploads.length > 0) {
      showNotification('error', `Failed to upload ${failedUploads.length} photo(s): ${failedUploads.join(', ')}`, 8000);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [checkGoogleAuth, showNotification]);

  const deletePhoto = useCallback(async (photoId: string) => {
    // Check auth first
    const isAuthed = await checkGoogleAuth();
    if (!isAuthed) {
      showNotification('error', 'Please connect your Google account using the sidebar first.');
      setNeedsAuth(true);
      return;
    }

    const originalPhotos = photos;
    setPhotos(prev => prev.filter(p => p.id !== photoId));

    try {
      const response = await fetch(`/api/google/drive/photos?id=${photoId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.needsAuth || response.status === 401) setNeedsAuth(true);
        throw new Error(data.error || 'Failed to delete photo');
      }
      showNotification('success', 'Photo deleted successfully.');
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
    } catch (err: any) {
      showNotification('error', err.message);
      setPhotos(originalPhotos);
    }
  }, [checkGoogleAuth, photos, selectedPhoto, showNotification]);

  const toggleFavorite = useCallback((photoId: string) => {
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId
          ? { ...photo, isFavorite: !photo.isFavorite }
          : photo
      )
    );
  }, []);

  // --- AI & Smart Features ---
  const analyzeNewPhoto = useCallback(async (photo: Photo) => {
    if (!photo?.id) return;
    try {
      const metadata: PhotoMetadata = {
        id: photo.id, name: photo.name, url: photo.webViewLink,
        mimeType: photo.mimeType, createdTime: new Date(photo.createdTime),
        modifiedTime: new Date(photo.modifiedTime)
      };
      const analyzed = await photoIntelligence.analyzePhoto(photo.webViewLink || '', metadata);
      setPhotoMetadata(prev => [analyzed, ...prev.filter(p => p.id !== photo.id)]);
      console.log('🤖 AI analysis completed for:', photo.name);
    } catch (err) {
      console.error('AI analysis failed for photo:', photo.name, err);
      const basicMetadata: PhotoMetadata = {
        id: photo.id, name: photo.name, url: photo.webViewLink,
        mimeType: photo.mimeType, createdTime: new Date(photo.createdTime),
        modifiedTime: new Date(photo.modifiedTime),
        searchableText: (photo.name || '').toLowerCase()
      };
      setPhotoMetadata(prev => [basicMetadata, ...prev.filter(p => p.id !== photo.id)]);
    }
  }, [photoIntelligence]);

  const analyzeAllPhotos = useCallback(async () => {
    if (photos.length === 0) return;
    setIsAnalyzing(true);
    try {
      const metadataToAnalyze = photos.map(p => ({
        id: p.id, name: p.name, url: p.webViewLink, mimeType: p.mimeType,
        createdTime: new Date(p.createdTime), modifiedTime: new Date(p.modifiedTime)
      }));

      const analysisPromises = metadataToAnalyze.map(meta =>
        photoIntelligence.analyzePhoto(meta.url || '', meta).catch(err => {
          console.error(`Failed to analyze ${meta.name}:`, err);
          return { ...meta, searchableText: (meta.name || '').toLowerCase() };
        })
      );

      const analyzedMetadata = await Promise.all(analysisPromises);

      setPhotoMetadata(analyzedMetadata);
      showNotification('success', `🤖 AI analysis completed for ${analyzedMetadata.length} photos`);
    } catch (err: any) {
      showNotification('error', 'Failed to complete batch analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [photos, photoIntelligence, showNotification]);

  const handleVoiceSearch = useCallback(async (query: string) => {
    if (photoMetadata.length === 0) return;
    try {
      const results = await photoIntelligence.searchPhotosByVoice(query, photoMetadata);
      const resultIds = new Set(results.map(r => r.id));

      const voiceFilteredPhotos = photos.filter(photo => resultIds.has(photo.id));

      setSearchTerm(`voice_query:"${query}"`);

      showNotification('success', `🎤 Found ${voiceFilteredPhotos.length} photos matching "${query}"`);
    } catch (err) {
      showNotification('error', 'Voice search failed');
    }
  }, [photoMetadata, photoIntelligence, photos, showNotification]);

  useEffect(() => {
    if (transcript && !isListening) {
      setVoiceSearchQuery(transcript);
      handleVoiceSearch(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript, handleVoiceSearch]);

  // --- Memoized Derived State ---
  const filteredPhotos = useMemo(() => {
    let result = photos;

    if (showFavoritesOnly) {
      result = result.filter(photo => photo.isFavorite);
    }

    if (searchTerm) {
      if (searchTerm.startsWith('voice_query:')) {
        const lowercasedTerm = searchTerm.replace('voice_query:', '').replace(/"/g, '').toLowerCase();
        const searchResults = photoMetadata.filter(metadata =>
          metadata.searchableText?.includes(lowercasedTerm) ||
          metadata.aiTags?.some(tag => tag.toLowerCase().includes(lowercasedTerm)) ||
          metadata.textContent?.some(text => text.toLowerCase().includes(lowercasedTerm))
        );
        const resultIds = new Set(searchResults.map(r => r.id));
        result = result.filter(photo => resultIds.has(photo.id));
      } else {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (photoMetadata.length > 0) {
          const searchResults = photoMetadata.filter(metadata =>
            metadata.searchableText?.includes(lowercasedTerm) ||
            metadata.aiTags?.some(tag => tag.toLowerCase().includes(lowercasedTerm)) ||
            metadata.textContent?.some(text => text.toLowerCase().includes(lowercasedTerm))
          );
          const resultIds = new Set(searchResults.map(r => r.id));
          result = result.filter(photo => resultIds.has(photo.id));
        } else {
          result = result.filter(photo => photo.name.toLowerCase().includes(lowercasedTerm));
        }
      }
    }

    return result;
  }, [photos, photoMetadata, searchTerm, showFavoritesOnly]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg">
                <Camera className="h-8 w-8 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('photos')}
                </h1>
                <p className="text-gray-600 font-medium mt-1">{t('manageYourPhotoAlbum')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isLoading} className="gap-2">
                {isUploading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{t('uploading')}</>
                ) : (
                  <><Upload className="h-4 w-4" />{t('uploadPhotos')}</>
                )}
              </Button>
              <Button onClick={loadPhotos} disabled={isLoading} variant="outline" className="gap-2">
                {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : '🔄'}
                Refresh
              </Button>
            </div>
          </div>
        </div>

      {/* Notifications */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 text-red-800">
          <CardContent className="p-4 flex justify-between items-center">
            <p>{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}
      {successMessage && (
        <Card className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CardContent className="p-4 flex justify-between items-center">
            <p>{successMessage}</p>
            <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      {/* Auth Screen */}
      {needsAuth && (
        <Card className="my-10 text-center">
          <CardHeader>
            <CardTitle>Google Drive Connection Required</CardTitle>
            <CardDescription>
              To manage your photos, please connect your Google account using the "Connect Google" button in the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">
                  👈 Look for the <strong>"Connect Google"</strong> button in the sidebar
                </p>
                <p className="text-xs text-blue-600">
                  After connecting, refresh this page to access your photos.
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content (when authenticated) */}
      {!needsAuth && (
        <>
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={photoMetadata.length > 0 ? "Search by name, tags, or AI-detected content..." : t('searchPhotos')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showFavoritesOnly ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current text-red-500' : ''}`} />
                    {t('favorites')}
                  </Button>
                  <Button variant={viewMode === 'grid' ? "secondary" : "outline"} size="sm" onClick={() => setViewMode('grid')}>
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === 'list' ? "secondary" : "outline"} size="sm" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Grid/List */}
          {isLoading ? (
            <div className="text-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading photos from Google Drive...</p>
            </div>
          ) : filteredPhotos.length > 0 ? (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPhotos.map((photo) => (
                    <Card key={photo.id} className="relative group overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <DriveImage
                          photo={photo}
                          alt={photo.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          quality={75}
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button
                          onClick={() => toggleFavorite(photo.id)}
                          variant="ghost"
                          size="sm"
                          className={`text-black font-bold hover:text-red-500 ${photo.isFavorite ? 'text-red-500' : ''}`}
                        >
                          <Heart className={`h-4 w-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-sm font-medium text-black font-bold line-clamp-1">{photo.name}</p>
                        <p className="text-xs text-gray-300">{formatFileSize(photo.size)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredPhotos.map((photo) => (
                    <Card key={photo.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <DriveImage
                            photo={photo}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{photo.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(photo.size)} • {(() => {
                const date = new Date(photo.createdTime);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
              })()}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button
                            onClick={() => toggleFavorite(photo.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Heart className={`h-4 w-4 ${photo.isFavorite ? 'fill-current text-red-500' : ''}`} />
                          </Button>
                          <Button
                            onClick={() => deletePhoto(photo.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-10 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">No Photos Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search or filters." : "Upload your first photo to get started."}
              </p>
              <Button onClick={() => fileInputRef.current?.click()} className="mt-4 gap-2">
                <Upload className="h-4 w-4" />
                Upload a Photo
              </Button>
            </div>
          )}
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      </div>
    </div>
  );
}