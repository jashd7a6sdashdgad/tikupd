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
    
    // Filter for audio files (MP3 and WAV, excluding Zone.Identifier files)
    const audioFiles = files.filter(file => 
      (file.endsWith('.mp3') || file.endsWith('.wav')) && !file.includes('Zone.Identifier')
    );

    console.log('🎵 Found audio files:', audioFiles);

    // Convert audio files to track objects
    const tracks: LocalMusicTrack[] = audioFiles.map((filename, index) => {
      // Extract title and artist from filename
      const { title, artist } = parseFilename(filename);
      
      return {
        id: (index + 1).toString(),
        title,
        artist,
        filename,
        audioUrl: `/api/music/serve/${encodeURIComponent(filename)
          .replace(/'/g, '%27')
          .replace(/\(/g, '%28')
          .replace(/\)/g, '%29')
          .replace(/#/g, '%23')
          .replace(/&/g, '%26')}`,
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
  // Remove audio file extensions
  const nameWithoutExt = filename.replace(/\.(mp3|wav)$/i, '');
  
  // Special cases for known tracks (check these first!)
  if (nameWithoutExt.toLowerCase().includes('channa mereya')) {
    return { artist: 'Arijit Singh', title: 'Channa Mereya' };
  } else if (nameWithoutExt.includes('حسين الجسمي') || nameWithoutExt.includes('امي جنة')) {
    return { artist: 'Hussain Al Jassmi', title: 'Ommi Jannah' };
  } else if (nameWithoutExt.toLowerCase().includes('lag jaa gale')) {
    return { artist: 'SANAM', title: 'Lag Jaa Gale - Acoustic' };
  } else if (nameWithoutExt.toLowerCase().includes('mahboob')) {
    return { artist: 'Original', title: "Mahboob's Madness" };
  } else if (nameWithoutExt.toLowerCase().includes('big sis mariya') && nameWithoutExt.toLowerCase().includes('birthday flex')) {
    return { artist: 'Original', title: "Big Sis Mariya's Birthday Flex" };
  } else if (nameWithoutExt.toLowerCase().includes('big sis mariya') && nameWithoutExt.toLowerCase().includes('birthday')) {
    return { artist: 'Original', title: "Big Sis Mariya's Birthday" };
  } else if (nameWithoutExt.toLowerCase().includes('carry the name')) {
    return { artist: 'Original', title: 'Carry the Name' };
  } else if (nameWithoutExt.toLowerCase().includes('forever us')) {
    return { artist: 'Original', title: 'Forever Us' };
  } else if (nameWithoutExt.toLowerCase().includes('tom cruise') && nameWithoutExt.toLowerCase().includes('vault')) {
    return { artist: 'Behind The Scenes', title: 'How Tom Cruise Mastered the Vault Scene' };
  } else if (nameWithoutExt.toLowerCase().includes('manaf') && nameWithoutExt.toLowerCase().includes('hustle')) {
    return { artist: 'Original', title: "Manaf's Hustle" };
  } else if (nameWithoutExt.toLowerCase().includes('srt') && nameWithoutExt.toLowerCase().includes('heavy')) {
    return { artist: 'SRT', title: 'Heavy' };
  } else if (nameWithoutExt.toLowerCase().includes('what have you done')) {
    return { artist: 'Original', title: 'What Have You Done' };
  }
  
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
  
  // Fallback: use filename as title
  return { 
    artist: 'Unknown Artist', 
    title: nameWithoutExt.substring(0, 50) // Limit length
  };
}