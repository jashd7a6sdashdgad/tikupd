import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { tokenStorage } from '@/lib/storage/tokenStorage';

// Wrapper to use existing persistent storage for music data
class MusicDataStorage {
  async getToken(key: string): Promise<string | null> {
    try {
      // Use the existing token storage system for music data
      const tokens = await tokenStorage.loadTokens();
      const musicToken = tokens.find(t => t.name === key && t.status === 'active');
      return musicToken ? musicToken.token : null;
    } catch (error) {
      console.error('Error loading music data:', error);
      return null;
    }
  }
  
  async storeToken(key: string, value: string): Promise<void> {
    try {
      // Load existing tokens
      const tokens = await tokenStorage.loadTokens();
      
      // Remove existing music data token with this key
      const filteredTokens = tokens.filter(t => !(t.name === key && t.permissions?.includes('music_data')));
      
      // Add new music data token
      const musicToken = {
        id: `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: key,
        token: value,
        permissions: ['music_data'],
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        expiresAt: undefined
      };
      
      filteredTokens.push(musicToken);
      await tokenStorage.saveTokens(filteredTokens);
    } catch (error) {
      console.error('Error saving music data:', error);
    }
  }
}

const musicStorage = new MusicDataStorage();

interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  artists: string[];
  album: string;
  duration: number;
  imageUrl: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  previewUrl?: string;
  isLiked: boolean;
  genre: string;
  year: number;
  platform: 'spotify' | 'youtube' | 'local';
  addedAt: Date;
  lastPlayedAt?: Date;
  playCount: number;
  tags: string[];
  rating?: number; // 1-5 stars
  lyrics?: string;
  isExplicit: boolean;
  popularity: number;
}

interface LibraryRequest {
  action: 'add' | 'remove' | 'update' | 'toggle_like' | 'set_rating' | 'add_tags' | 'remove_tags' | 'increment_play' | 'search' | 'get_stats';
  song?: {
    id: string;
    title: string;
    artist: string;
    artists: string[];
    album: string;
    duration: number;
    imageUrl: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
    previewUrl?: string;
    genre: string;
    year: number;
    platform: 'spotify' | 'youtube' | 'local';
    isExplicit?: boolean;
    popularity?: number;
  };
  songId?: string;
  rating?: number;
  tags?: string[];
  query?: string;
  filters?: {
    genre?: string;
    year?: { min?: number; max?: number; };
    platform?: string;
    isLiked?: boolean;
    rating?: { min?: number; max?: number; };
  };
  sortBy?: 'addedAt' | 'lastPlayedAt' | 'playCount' | 'rating' | 'title' | 'artist' | 'album';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    const body: LibraryRequest = await request.json();
    
    console.log('Music Library API request:', body);

    if (!body.action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    const storage = musicStorage;
    const libraryKey = `music_library_${user.id}`;

    // Get existing library
    let library: LibrarySong[] = [];
    try {
      const existingData = await storage.getToken(libraryKey);
      if (existingData) {
        library = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('No existing music library found, starting fresh');
    }

    let result: any = null;

    switch (body.action) {
      case 'add':
        if (!body.song) {
          return NextResponse.json(
            { success: false, message: 'Song data is required' },
            { status: 400 }
          );
        }

        // Check if song already exists
        const existingIndex = library.findIndex(s => 
          s.id === body.song!.id && s.platform === body.song!.platform
        );

        if (existingIndex !== -1) {
          result = {
            song: library[existingIndex],
            message: 'Song already exists in library',
            isNew: false
          };
        } else {
          const newLibrarySong: LibrarySong = {
            ...body.song,
            isLiked: false,
            addedAt: new Date(),
            playCount: 0,
            tags: [],
            isExplicit: body.song.isExplicit || false,
            popularity: body.song.popularity || 0
          };

          library.push(newLibrarySong);
          await storage.storeToken(libraryKey, JSON.stringify(library));

          result = {
            song: newLibrarySong,
            message: 'Song added to library successfully',
            isNew: true
          };
        }
        break;

      case 'remove':
        if (!body.songId) {
          return NextResponse.json(
            { success: false, message: 'Song ID is required' },
            { status: 400 }
          );
        }

        const removeIndex = library.findIndex(s => s.id === body.songId);
        if (removeIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Song not found in library' },
            { status: 404 }
          );
        }

        const removedSong = library[removeIndex];
        library.splice(removeIndex, 1);
        await storage.storeToken(libraryKey, JSON.stringify(library));

        result = {
          song: removedSong,
          message: 'Song removed from library successfully'
        };
        break;

      case 'toggle_like':
        if (!body.songId) {
          return NextResponse.json(
            { success: false, message: 'Song ID is required' },
            { status: 400 }
          );
        }

        const likeIndex = library.findIndex(s => s.id === body.songId);
        if (likeIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Song not found in library' },
            { status: 404 }
          );
        }

        library[likeIndex].isLiked = !library[likeIndex].isLiked;
        await storage.storeToken(libraryKey, JSON.stringify(library));

        result = {
          song: library[likeIndex],
          message: `Song ${library[likeIndex].isLiked ? 'liked' : 'unliked'} successfully`
        };
        break;

      case 'set_rating':
        if (!body.songId || body.rating === undefined) {
          return NextResponse.json(
            { success: false, message: 'Song ID and rating are required' },
            { status: 400 }
          );
        }

        if (body.rating < 1 || body.rating > 5) {
          return NextResponse.json(
            { success: false, message: 'Rating must be between 1 and 5' },
            { status: 400 }
          );
        }

        const ratingIndex = library.findIndex(s => s.id === body.songId);
        if (ratingIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Song not found in library' },
            { status: 404 }
          );
        }

        library[ratingIndex].rating = body.rating;
        await storage.storeToken(libraryKey, JSON.stringify(library));

        result = {
          song: library[ratingIndex],
          message: 'Song rating updated successfully'
        };
        break;

      case 'add_tags':
        if (!body.songId || !body.tags || body.tags.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Song ID and tags are required' },
            { status: 400 }
          );
        }

        const addTagsIndex = library.findIndex(s => s.id === body.songId);
        if (addTagsIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Song not found in library' },
            { status: 404 }
          );
        }

        // Add new tags that don't already exist
        const newTags = body.tags.filter(tag => !library[addTagsIndex].tags.includes(tag));
        library[addTagsIndex].tags.push(...newTags);
        await storage.storeToken(libraryKey, JSON.stringify(library));

        result = {
          song: library[addTagsIndex],
          addedTags: newTags,
          message: `${newTags.length} tags added successfully`
        };
        break;

      case 'increment_play':
        if (!body.songId) {
          return NextResponse.json(
            { success: false, message: 'Song ID is required' },
            { status: 400 }
          );
        }

        const playIndex = library.findIndex(s => s.id === body.songId);
        if (playIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Song not found in library' },
            { status: 404 }
          );
        }

        library[playIndex].playCount += 1;
        library[playIndex].lastPlayedAt = new Date();
        await storage.storeToken(libraryKey, JSON.stringify(library));

        result = {
          song: library[playIndex],
          message: 'Play count incremented successfully'
        };
        break;

      case 'search':
        const query = body.query?.toLowerCase() || '';
        const filters = body.filters || {};
        
        let filteredLibrary = library;

        // Text search
        if (query) {
          filteredLibrary = filteredLibrary.filter(song =>
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            song.album.toLowerCase().includes(query) ||
            song.artists.some(artist => artist.toLowerCase().includes(query)) ||
            song.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        // Apply filters
        if (filters.genre) {
          filteredLibrary = filteredLibrary.filter(song =>
            song.genre.toLowerCase() === filters.genre!.toLowerCase()
          );
        }

        if (filters.year) {
          filteredLibrary = filteredLibrary.filter(song => {
            const year = song.year;
            return (!filters.year!.min || year >= filters.year!.min) &&
                   (!filters.year!.max || year <= filters.year!.max);
          });
        }

        if (filters.platform) {
          filteredLibrary = filteredLibrary.filter(song =>
            song.platform === filters.platform
          );
        }

        if (filters.isLiked !== undefined) {
          filteredLibrary = filteredLibrary.filter(song =>
            song.isLiked === filters.isLiked
          );
        }

        if (filters.rating) {
          filteredLibrary = filteredLibrary.filter(song => {
            const rating = song.rating || 0;
            return (!filters.rating!.min || rating >= filters.rating!.min) &&
                   (!filters.rating!.max || rating <= filters.rating!.max);
          });
        }

        // Sort results
        const sortBy = body.sortBy || 'addedAt';
        const sortOrder = body.sortOrder || 'desc';
        
        filteredLibrary.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sortBy) {
            case 'addedAt':
              aValue = new Date(a.addedAt).getTime();
              bValue = new Date(b.addedAt).getTime();
              break;
            case 'lastPlayedAt':
              aValue = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
              bValue = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
              break;
            case 'playCount':
              aValue = a.playCount;
              bValue = b.playCount;
              break;
            case 'rating':
              aValue = a.rating || 0;
              bValue = b.rating || 0;
              break;
            case 'title':
              aValue = a.title.toLowerCase();
              bValue = b.title.toLowerCase();
              break;
            case 'artist':
              aValue = a.artist.toLowerCase();
              bValue = b.artist.toLowerCase();
              break;
            case 'album':
              aValue = a.album.toLowerCase();
              bValue = b.album.toLowerCase();
              break;
            default:
              aValue = a.addedAt;
              bValue = b.addedAt;
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        });

        // Pagination
        const offset = body.offset || 0;
        const limit = body.limit || filteredLibrary.length;
        const paginatedResults = filteredLibrary.slice(offset, offset + limit);

        result = {
          songs: paginatedResults,
          total: filteredLibrary.length,
          offset,
          limit,
          hasMore: offset + limit < filteredLibrary.length,
          query,
          filters,
          sortBy,
          sortOrder
        };
        break;

      case 'get_stats':
        const stats = {
          totalSongs: library.length,
          totalDuration: library.reduce((sum, song) => sum + (song.duration || 0), 0),
          totalPlays: library.reduce((sum, song) => sum + song.playCount, 0),
          likedSongs: library.filter(song => song.isLiked).length,
          ratedSongs: library.filter(song => song.rating && song.rating > 0).length,
          averageRating: library.filter(song => song.rating).reduce((sum, song) => sum + (song.rating || 0), 0) / library.filter(song => song.rating).length || 0,
          platforms: {
            spotify: library.filter(song => song.platform === 'spotify').length,
            youtube: library.filter(song => song.platform === 'youtube').length,
            local: library.filter(song => song.platform === 'local').length
          },
          topGenres: Object.entries(
            library.reduce((acc: Record<string, number>, song) => {
              acc[song.genre] = (acc[song.genre] || 0) + 1;
              return acc;
            }, {})
          ).sort(([,a], [,b]) => b - a).slice(0, 5),
          topArtists: Object.entries(
            library.reduce((acc: Record<string, number>, song) => {
              acc[song.artist] = (acc[song.artist] || 0) + 1;
              return acc;
            }, {})
          ).sort(([,a], [,b]) => b - a).slice(0, 10),
          recentlyAdded: library
            .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
            .slice(0, 10),
          mostPlayed: library
            .filter(song => song.playCount > 0)
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 10),
          recentlyPlayed: library
            .filter(song => song.lastPlayedAt)
            .sort((a, b) => new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime())
            .slice(0, 10)
        };

        result = {
          stats,
          message: 'Library statistics retrieved successfully'
        };
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Music Library API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process library request'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const storage = musicStorage;
    const libraryKey = `music_library_${user.id}`;

    // Get library
    let library: LibrarySong[] = [];
    try {
      const existingData = await storage.getToken(libraryKey);
      if (existingData) {
        library = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('No existing music library found');
    }

    let result: any = null;

    switch (action) {
      case 'get_all':
        const paginatedLibrary = library
          .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
          .slice(offset, offset + limit);

        result = {
          songs: paginatedLibrary,
          total: library.length,
          offset,
          limit,
          hasMore: offset + limit < library.length
        };
        break;

      case 'get_liked':
        const likedSongs = library
          .filter(song => song.isLiked)
          .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
          .slice(offset, offset + limit);

        result = {
          songs: likedSongs,
          total: library.filter(song => song.isLiked).length,
          offset,
          limit,
          hasMore: offset + limit < library.filter(song => song.isLiked).length
        };
        break;

      case 'get_recent':
        const recentSongs = library
          .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
          .slice(0, limit);

        result = {
          songs: recentSongs,
          total: recentSongs.length
        };
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Music Library GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch library'
      },
      { status: 500 }
    );
  }
}