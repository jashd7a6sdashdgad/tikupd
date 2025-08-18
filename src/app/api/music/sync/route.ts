import { NextRequest, NextResponse } from 'next/server';
import { readdir, copyFile, stat } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Starting automatic music sync...');
    
    const sourceMusicDir = '/home/haherech/mahboob-personal-assistant/Music';
    const publicMusicDir = '/home/haherech/mahboob-personal-assistant/public/Music';
    
    let copiedFiles = 0;
    const newSongs: string[] = [];
    
    try {
      // Get all audio files from source Music directory (MP3 and WAV)
      const sourceFiles = await readdir(sourceMusicDir);
      const sourceAudioFiles = sourceFiles.filter(file => 
        file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.wav')
      );
      
      // Get all audio files from public Music directory (MP3 and WAV)
      const publicFiles = await readdir(publicMusicDir);
      const publicAudioFiles = publicFiles.filter(file => 
        file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.wav')
      );
      
      console.log(`🎵 Found ${sourceAudioFiles.length} audio files in source directory`);
      console.log(`🎵 Found ${publicAudioFiles.length} audio files in public directory`);
      
      // Find new files that don't exist in public directory
      const newFiles = sourceAudioFiles.filter(file => !publicAudioFiles.includes(file));
      
      if (newFiles.length === 0) {
        console.log('🎵 No new music files to sync');
        return NextResponse.json({
          success: true,
          message: 'No new music files found',
          copiedFiles: 0,
          newSongs: []
        });
      }
      
      console.log(`🎵 Found ${newFiles.length} new music files to copy:`, newFiles);
      
      // Copy new files
      for (const file of newFiles) {
        try {
          const sourcePath = join(sourceMusicDir, file);
          const destPath = join(publicMusicDir, file);
          
          // Check if source file exists and get its stats
          const sourceStats = await stat(sourcePath);
          
          if (sourceStats.isFile()) {
            await copyFile(sourcePath, destPath);
            copiedFiles++;
            newSongs.push(file);
            console.log(`✅ Copied: ${file}`);
          }
        } catch (error) {
          console.error(`❌ Failed to copy ${file}:`, error);
        }
      }
      
      console.log(`🎵 Successfully copied ${copiedFiles} new music files`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${copiedFiles} new music files`,
        copiedFiles,
        newSongs,
        totalSongs: publicAudioFiles.length + copiedFiles
      });
      
    } catch (error) {
      console.error('❌ Error accessing music directories:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to access music directories',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Music sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync music',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current sync status
    const sourceMusicDir = '/home/haherech/mahboob-personal-assistant/Music';
    const publicMusicDir = '/home/haherech/mahboob-personal-assistant/public/Music';
    
    const sourceFiles = await readdir(sourceMusicDir);
    const sourceAudioFiles = sourceFiles.filter(file => 
      file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.wav')
    );
    
    const publicFiles = await readdir(publicMusicDir);
    const publicAudioFiles = publicFiles.filter(file => 
      file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.wav')
    );
    
    const newFiles = sourceAudioFiles.filter(file => !publicAudioFiles.includes(file));
    
    return NextResponse.json({
      sourceCount: sourceAudioFiles.length,
      publicCount: publicAudioFiles.length,
      newFilesCount: newFiles.length,
      newFiles: newFiles,
      lastCheck: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking music sync status:', error);
    return NextResponse.json({
      error: 'Failed to check sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}