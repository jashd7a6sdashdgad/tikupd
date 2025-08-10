import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';

// Environment variables
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface MusicRequest {
  action: 'search' | 'get_playlists' | 'create_playlist' | 'add_to_playlist' | 'get_user_profile' | 'get_top_tracks' | 'get_recommendations';
  query?: string;
  platform?: 'spotify' | 'youtube' | 'both';
  playlist_id?: string;
  track_ids?: string[];
  limit?: number;
  market?: string;
  seed_artists?: string[];
  seed_tracks?: string[];
  seed_genres?: string[];
}

// Spotify API helper functions
class SpotifyAPI {
  private static async getAccessToken(): Promise<string | null> {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('Spotify credentials not configured');
      return null;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  static async searchTracks(query: string, limit: number = 20, market: string = 'US') {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=${market}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.tracks?.items?.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        artists: track.artists?.map((a: any) => a.name) || [],
        album: track.album?.name || 'Unknown Album',
        duration: track.duration_ms,
        imageUrl: track.album?.images?.[0]?.url || '',
        spotifyUrl: track.external_urls?.spotify || '',
        previewUrl: track.preview_url || '',
        isExplicit: track.explicit || false,
        popularity: track.popularity || 0,
        genre: 'Unknown', // Spotify doesn't provide genre in search results
        year: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : 0,
        platform: 'spotify'
      })) || [];
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      return [];
    }
  }

  static async getRecommendations(options: {
    seed_artists?: string[];
    seed_tracks?: string[];
    seed_genres?: string[];
    limit?: number;
    market?: string;
  }) {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    try {
      const params = new URLSearchParams({
        limit: (options.limit || 20).toString(),
        market: options.market || 'US'
      });

      if (options.seed_artists?.length) {
        params.append('seed_artists', options.seed_artists.join(','));
      }
      if (options.seed_tracks?.length) {
        params.append('seed_tracks', options.seed_tracks.join(','));
      }
      if (options.seed_genres?.length) {
        params.append('seed_genres', options.seed_genres.join(','));
      }

      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify recommendations failed: ${response.status}`);
      }

      const data = await response.json();
      return data.tracks?.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        artists: track.artists?.map((a: any) => a.name) || [],
        album: track.album?.name || 'Unknown Album',
        duration: track.duration_ms,
        imageUrl: track.album?.images?.[0]?.url || '',
        spotifyUrl: track.external_urls?.spotify || '',
        previewUrl: track.preview_url || '',
        isExplicit: track.explicit || false,
        popularity: track.popularity || 0,
        genre: 'Unknown',
        year: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : 0,
        platform: 'spotify'
      })) || [];
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error);
      return [];
    }
  }

  static async getAvailableGenres() {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    try {
      const response = await fetch(
        'https://api.spotify.com/v1/recommendations/available-genre-seeds',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify genres failed: ${response.status}`);
      }

      const data = await response.json();
      return data.genres || [];
    } catch (error) {
      console.error('Error getting Spotify genres:', error);
      return [];
    }
  }
}

// YouTube API helper functions
class YouTubeAPI {
  static async searchVideos(query: string, limit: number = 20) {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=${limit}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`YouTube search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.items?.map((item: any) => ({
        id: item.id?.videoId || '',
        title: item.snippet?.title || '',
        artist: item.snippet?.channelTitle || 'Unknown Channel',
        artists: [item.snippet?.channelTitle || 'Unknown Channel'],
        album: 'YouTube',
        duration: 0, // Would need additional API call to get duration
        imageUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
        previewUrl: '',
        isExplicit: false,
        popularity: 0,
        genre: 'Unknown',
        year: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).getFullYear() : 0,
        platform: 'youtube'
      })) || [];
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  }

  static async getVideoDetails(videoIds: string[]) {
    if (!YOUTUBE_API_KEY || videoIds.length === 0) {
      return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`YouTube video details failed: ${response.status}`);
      }

      const data = await response.json();
      return data.items?.map((item: any) => ({
        id: item.id || '',
        title: item.snippet?.title || '',
        artist: item.snippet?.channelTitle || 'Unknown Channel',
        artists: [item.snippet?.channelTitle || 'Unknown Channel'],
        album: 'YouTube',
        duration: this.parseDuration(item.contentDetails?.duration || ''),
        imageUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
        previewUrl: '',
        isExplicit: false,
        popularity: parseInt(item.statistics?.viewCount || '0'),
        genre: 'Unknown',
        year: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).getFullYear() : 0,
        platform: 'youtube',
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0')
      })) || [];
    } catch (error) {
      console.error('Error getting YouTube video details:', error);
      return [];
    }
  }

  private static parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return (hours * 3600 + minutes * 60 + seconds) * 1000; // Return in milliseconds
  }
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
    const body: MusicRequest = await request.json();
    
    console.log('Music API request:', body);

    if (!body.action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    let result: any = null;

    switch (body.action) {
      case 'search':
        if (!body.query) {
          return NextResponse.json(
            { success: false, message: 'Query is required for search' },
            { status: 400 }
          );
        }

        const results: any[] = [];
        const platform = body.platform || 'both';

        if (platform === 'spotify' || platform === 'both') {
          const spotifyTracks = await SpotifyAPI.searchTracks(body.query, body.limit || 20, body.market);
          if (spotifyTracks) {
            results.push(...spotifyTracks);
          }
        }

        if (platform === 'youtube' || platform === 'both') {
          const youtubeTracks = await YouTubeAPI.searchVideos(body.query, body.limit || 20);
          results.push(...youtubeTracks);
        }

        result = {
          tracks: results,
          total: results.length,
          query: body.query,
          platform: platform
        };
        break;

      case 'get_recommendations':
        const recommendations = await SpotifyAPI.getRecommendations({
          seed_artists: body.seed_artists,
          seed_tracks: body.seed_tracks,
          seed_genres: body.seed_genres,
          limit: body.limit || 20,
          market: body.market || 'US'
        });

        result = {
          tracks: recommendations || [],
          total: recommendations?.length || 0,
          seeds: {
            artists: body.seed_artists || [],
            tracks: body.seed_tracks || [],
            genres: body.seed_genres || []
          }
        };
        break;

      case 'get_playlists':
        // This would require user authentication with Spotify
        result = {
          playlists: [],
          message: 'User playlist access requires Spotify user authentication'
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
    console.error('Music API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process music request'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_genres';

    let result: any = null;

    switch (action) {
      case 'get_genres':
        const genres = await SpotifyAPI.getAvailableGenres();
        result = {
          genres: genres || [],
          total: genres?.length || 0
        };
        break;

      case 'health':
        result = {
          spotify: {
            configured: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET),
            status: 'ready'
          },
          youtube: {
            configured: !!YOUTUBE_API_KEY,
            status: 'ready'
          }
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
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Music API GET error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process music request'
      },
      { status: 500 }
    );
  }
}