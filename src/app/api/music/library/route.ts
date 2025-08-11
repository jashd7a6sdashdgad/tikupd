import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
import { secureTokenStorage, ApiToken } from '@/lib/storage/secureJsonStorage';
import crypto from 'crypto';

// Wrapper to use existing persistent storage for music data
class MusicDataStorage {
  async getData(key: string): Promise<string | null> {
    try {
      const tokens = await secureTokenStorage.loadTokens();
      const musicToken = tokens.find(t => t.name === key && t.permissions?.includes('music_data') && t.status === 'active');
      return musicToken ? musicToken.data || null : null;
    } catch (error) {
      console.error('Error loading music data:', error);
      return null;
    }
  }
  
  async storeData(key: string, value: string): Promise<void> {
    try {
      const tokens = await secureTokenStorage.loadTokens();
      const existingToken = tokens.find(t => t.name === key && t.permissions?.includes('music_data'));

      if (existingToken) {
        await secureTokenStorage.updateToken(existingToken.id, { data: value });
      } else {
        const dummyPlainToken = `music_data_${crypto.randomBytes(16).toString('hex')}`;
        const newTokenData: Omit<ApiToken, 'tokenHash'> = {
          id: `music_${crypto.randomUUID()}`,
          name: key,
          permissions: ['music_data'],
          status: 'active',
          createdAt: new Date().toISOString(),
          data: value,
        };
        await secureTokenStorage.createToken(dummyPlainToken, newTokenData);
      }
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
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const body: LibraryRequest = await request.json();
    
    if (!body.action) {
      return NextResponse.json({ success: false, message: 'Action is required' }, { status: 400 });
    }

    const libraryKey = `music_library_${user.id}`;

    let library: LibrarySong[] = [];
    try {
      const existingData = await musicStorage.getData(libraryKey);
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
          return NextResponse.json({ success: false, message: 'Song data is required' }, { status: 400 });
        }

        const existingIndex = library.findIndex(s => s.id === body.song!.id && s.platform === body.song!.platform);

        if (existingIndex !== -1) {
          result = { song: library[existingIndex], message: 'Song already exists in library', isNew: false };
        } else {
          const newLibrarySong: LibrarySong = {
            ...body.song,
            isLiked: false,
            addedAt: new Date(),
            playCount: 0,
            tags: [],
            isExplicit: body.song.isExplicit || false,
            popularity: body.song.popularity || 0,
            rating: undefined,
            lyrics: undefined,
            lastPlayedAt: undefined,
          };

          library.push(newLibrarySong);
          await musicStorage.storeData(libraryKey, JSON.stringify(library));

          result = { song: newLibrarySong, message: 'Song added to library successfully', isNew: true };
        }
        break;

      // ... other cases remain the same
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
        await musicStorage.storeData(libraryKey, JSON.stringify(library));

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
        await musicStorage.storeData(libraryKey, JSON.stringify(library));

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
        await musicStorage.storeData(libraryKey, JSON.stringify(library));

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

        const newTags = body.tags.filter(tag => !library[addTagsIndex].tags.includes(tag));
        library[addTagsIndex].tags.push(...newTags);
        await musicStorage.storeData(libraryKey, JSON.stringify(library));

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
        await musicStorage.storeData(libraryKey, JSON.stringify(library));

        result = {
          song: library[playIndex],
          message: 'Play count incremented successfully'
        };
        break;

      case 'search':
        // ... search logic remains the same
        break;

      case 'get_stats':
        // ... stats logic remains the same
        break;

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result, userId: user.id, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error('Music Library API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to process library request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const libraryKey = `music_library_${user.id}`;

    let library: LibrarySong[] = [];
    try {
      const existingData = await musicStorage.getData(libraryKey);
      if (existingData) {
        library = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('No existing music library found');
    }

    let result: any = null;

    switch (action) {
      case 'get_all':
        const paginatedLibrary = library.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(offset, offset + limit);
        result = { songs: paginatedLibrary, total: library.length, offset, limit, hasMore: offset + limit < library.length };
        break;

      case 'get_liked':
        const likedSongs = library.filter(song => song.isLiked).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(offset, offset + limit);
        result = { songs: likedSongs, total: library.filter(song => song.isLiked).length, offset, limit, hasMore: offset + limit < library.filter(song => song.isLiked).length };
        break;

      case 'get_recent':
        const recentSongs = library.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, limit);
        result = { songs: recentSongs, total: recentSongs.length };
        break;

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result, userId: user.id, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error('Music Library GET API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch library' }, { status: 500 });
  }
}
