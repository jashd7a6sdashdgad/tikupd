import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface LocalMusicTrack {
  id: string;
  title: string;
  artist: string;
  filename: string;
  audioUrl: string;
  duration?: string;
}

export async function GET(request: NextRequest) {
  try {
    const musicDir = path.join(process.cwd(), 'public', 'Music');
    
    // Check if Music directory exists
    try {
      await fs.access(musicDir);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Music directory not found'
      });
    }

    // Read all files in Music directory
    const files = await fs.readdir(musicDir);
    
    // Filter for MP3 files (excluding Zone.Identifier files)
    const mp3Files = files.filter(file => 
      file.endsWith('.mp3') && !file.includes('Zone.Identifier')
    );

    console.log('🎵 Found MP3 files:', mp3Files);

    // Convert MP3 files to track objects
    const tracks: LocalMusicTrack[] = mp3Files.map((filename, index) => {
      // Extract title and artist from filename
      const { title, artist } = parseFilename(filename);
      
      return {
        id: (index + 1).toString(),
        title,
        artist,
        filename,
        audioUrl: `/api/music/serve/${encodeURIComponent(filename)}`,
        duration: '0:00' // Will be updated by frontend
      };
    });

    console.log('🎵 Processed tracks:', tracks);

    return NextResponse.json({
      success: true,
      tracks,
      count: tracks.length,
      musicDir: musicDir
    });

  } catch (error) {
    console.error('❌ Error reading local music:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to read local music: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

function parseFilename(filename: string): { title: string; artist: string } {
  // Remove .mp3 extension
  const nameWithoutExt = filename.replace('.mp3', '');
  
  // Handle different filename patterns
  if (nameWithoutExt.includes(' - ')) {
    // Pattern: "Artist - Title" or "Title - Artist"
    const parts = nameWithoutExt.split(' - ');
    if (parts.length >= 2) {
      // Try to determine which is artist and which is title
      const first = parts[0].trim();
      const second = parts[1].trim();
      
      // Common artist patterns
      if (first.toLowerCase().includes('sanam')) {
        return { artist: 'SANAM', title: second };
      } else if (first.toLowerCase().includes('arijit') || first.toLowerCase().includes('singh')) {
        return { artist: first, title: second };
      } else if (first.toLowerCase().includes('حسين') || first.toLowerCase().includes('الجسمي')) {
        return { artist: 'Hussain Al Jassmi', title: 'Ommi Jannah' };
      } else {
        // Default: assume first part is title, second is artist info
        return { artist: second, title: first };
      }
    }
  }
  
  // Special cases for known tracks
  if (nameWithoutExt.toLowerCase().includes('channa mereya')) {
    return { artist: 'Arijit Singh', title: 'Channa Mereya' };
  } else if (nameWithoutExt.includes('حسين الجسمي') || nameWithoutExt.includes('امي جنة')) {
    return { artist: 'Hussain Al Jassmi', title: 'Ommi Jannah' };
  } else if (nameWithoutExt.toLowerCase().includes('lag jaa gale')) {
    return { artist: 'SANAM', title: 'Lag Jaa Gale - Acoustic' };
  } else if (nameWithoutExt.toLowerCase().includes('mahboob')) {
    return { artist: 'Original', title: "Mahboob's Madness" };
  }
  
  // Fallback: use filename as title
  return { 
    artist: 'Unknown Artist', 
    title: nameWithoutExt.substring(0, 50) // Limit length
  };
}