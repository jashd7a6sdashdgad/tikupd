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

interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  songs: PlaylistSong[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags: string[];
  totalDuration: number;
}

interface PlaylistSong {
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
  addedAt: Date;
  addedBy: string;
  platform: 'spotify' | 'youtube' | 'local';
}

interface PlaylistRequest {
  action: 'create' | 'update' | 'delete' | 'add_song' | 'remove_song' | 'get_all' | 'get_one' | 'duplicate' | 'share';
  playlistId?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;
  tags?: string[];
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
    platform: 'spotify' | 'youtube' | 'local';
  };
  songs?: PlaylistSong[];
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const body: PlaylistRequest = await request.json();
    
    if (!body.action) {
      return NextResponse.json({ success: false, message: 'Action is required' }, { status: 400 });
    }

    const playlistsKey = `playlists_${user.id}`;

    let playlists: Playlist[] = [];
    try {
      const existingData = await musicStorage.getData(playlistsKey);
      if (existingData) {
        playlists = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('No existing playlists found, starting fresh');
    }

    let result: any = null;

    switch (body.action) {
      case 'create':
        if (!body.name) {
          return NextResponse.json({ success: false, message: 'Playlist name is required' }, { status: 400 });
        }

        const newPlaylist: Playlist = {
          id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: body.name,
          description: body.description || '',
          imageUrl: body.imageUrl || '',
          songs: [],
          isPublic: body.isPublic || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user.id,
          tags: body.tags || [],
          totalDuration: 0
        };

        playlists.push(newPlaylist);
        await musicStorage.storeData(playlistsKey, JSON.stringify(playlists));

        result = { playlist: newPlaylist, message: 'Playlist created successfully' };
        break;

      // ... (other cases remain the same, they just use the `playlists` array)
      case 'update':
        if (!body.playlistId) {
          return NextResponse.json(
            { success: false, message: 'Playlist ID is required' },
            { status: 400 }
          );
        }

        const playlistIndex = playlists.findIndex(p => p.id === body.playlistId && p.userId === user.id);
        if (playlistIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Playlist not found' },
            { status: 404 }
          );
        }

        const updatedPlaylist = {
          ...playlists[playlistIndex],
          name: body.name || playlists[playlistIndex].name,
          description: body.description !== undefined ? body.description : playlists[playlistIndex].description,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl : playlists[playlistIndex].imageUrl,
          isPublic: body.isPublic !== undefined ? body.isPublic : playlists[playlistIndex].isPublic,
          tags: body.tags || playlists[playlistIndex].tags,
          updatedAt: new Date()
        };

        playlists[playlistIndex] = updatedPlaylist;
        await musicStorage.storeData(playlistsKey, JSON.stringify(playlists));

        result = {
          playlist: updatedPlaylist,
          message: 'Playlist updated successfully'
        };
        break;

      case 'delete':
        if (!body.playlistId) {
          return NextResponse.json(
            { success: false, message: 'Playlist ID is required' },
            { status: 400 }
          );
        }

        const deleteIndex = playlists.findIndex(p => p.id === body.playlistId && p.userId === user.id);
        if (deleteIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Playlist not found' },
            { status: 404 }
          );
        }

        const deletedPlaylist = playlists[deleteIndex];
        playlists.splice(deleteIndex, 1);
        await musicStorage.storeData(playlistsKey, JSON.stringify(playlists));

        result = {
          playlist: deletedPlaylist,
          message: 'Playlist deleted successfully'
        };
        break;

      case 'add_song':
        if (!body.playlistId || !body.song) {
          return NextResponse.json(
            { success: false, message: 'Playlist ID and song are required' },
            { status: 400 }
          );
        }

        const addToIndex = playlists.findIndex(p => p.id === body.playlistId && p.userId === user.id);
        if (addToIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Playlist not found' },
            { status: 404 }
          );
        }

        const songExists = playlists[addToIndex].songs.some(s => 
          s.id === body.song!.id && s.platform === body.song!.platform
        );

        if (songExists) {
          return NextResponse.json(
            { success: false, message: 'Song already exists in playlist' },
            { status: 400 }
          );
        }

        const newSong: PlaylistSong = {
          ...body.song,
          addedAt: new Date(),
          addedBy: user.id
        };

        playlists[addToIndex].songs.push(newSong);
        playlists[addToIndex].totalDuration += body.song.duration || 0;
        playlists[addToIndex].updatedAt = new Date();

        await musicStorage.storeData(playlistsKey, JSON.stringify(playlists));

        result = {
          playlist: playlists[addToIndex],
          song: newSong,
          message: 'Song added to playlist successfully'
        };
        break;

      case 'remove_song':
        if (!body.playlistId || !body.song?.id) {
          return NextResponse.json(
            { success: false, message: 'Playlist ID and song ID are required' },
            { status: 400 }
          );
        }

        const removeFromIndex = playlists.findIndex(p => p.id === body.playlistId && p.userId === user.id);
        if (removeFromIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Playlist not found' },
            { status: 404 }
          );
        }

        const songIndex = playlists[removeFromIndex].songs.findIndex(s => 
          s.id === body.song!.id && s.platform === body.song!.platform
        );

        if (songIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Song not found in playlist' },
            { status: 404 }
          );
        }

        const removedSong = playlists[removeFromIndex].songs[songIndex];
        playlists[removeFromIndex].songs.splice(songIndex, 1);
        playlists[removeFromIndex].totalDuration -= removedSong.duration || 0;
        playlists[removeFromIndex].updatedAt = new Date();

        await musicStorage.storeData(playlistsKey, JSON.stringify(playlists));

        result = {
          playlist: playlists[removeFromIndex],
          removedSong,
          message: 'Song removed from playlist successfully'
        };
        break;

      case 'duplicate':
        if (!body.playlistId) {
          return NextResponse.json(
            { success: false, message: 'Playlist ID is required' },
            { status: 400 }
          );
        }

        const originalIndex = playlists.findIndex(p => p.id === body.playlistId);
        if (originalIndex === -1) {
          return NextResponse.json(
            { success: false, message: 'Playlist not found' },
            { status: 404 }
          );
        }

        const originalPlaylist = playlists[originalIndex];
        const duplicatedPlaylist: Playlist = {
          ...originalPlaylist,
          id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${originalPlaylist.name} (Copy)`,
          userId: user.id,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          songs: originalPlaylist.songs.map(song => ({
            ...song,
            addedAt: new Date(),
            addedBy: user.id
          }))
        };

        playlists.push(duplicatedPlaylist);
        await musicStorage.storeData(playlistsKey, JSON.stringify(playlists));

        result = {
          playlist: duplicatedPlaylist,
          original: originalPlaylist,
          message: 'Playlist duplicated successfully'
        };
        break;

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result, userId: user.id, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error('Playlist API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to process playlist request' }, { status: 500 });
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
    const playlistId = searchParams.get('id');
    const includePublic = searchParams.get('include_public') === 'true';

    const playlistsKey = `playlists_${user.id}`;

    let userPlaylists: Playlist[] = [];
    try {
      const existingData = await musicStorage.getData(playlistsKey);
      if (existingData) {
        userPlaylists = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('No existing playlists found');
    }

    let result: any = null;

    if (playlistId) {
      const playlist = userPlaylists.find(p => p.id === playlistId);
      if (!playlist) {
        return NextResponse.json({ success: false, message: 'Playlist not found' }, { status: 404 });
      }
      result = { playlist, songCount: playlist.songs.length, totalDuration: playlist.totalDuration };
    } else {
      const allPlaylists = userPlaylists;
      if (includePublic) {
        // In a real app, you'd fetch public playlists from a shared storage
      }
      allPlaylists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      result = { playlists: allPlaylists, total: allPlaylists.length, userPlaylists: userPlaylists.length, publicPlaylists: 0 };
    }

    return NextResponse.json({ success: true, data: result, userId: user.id, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error('Playlist GET API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch playlists' }, { status: 500 });
  }
}
