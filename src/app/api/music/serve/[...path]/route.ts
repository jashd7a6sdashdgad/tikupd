import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { stat } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    // Get the file path from the dynamic route
    const urlPath = request.nextUrl.pathname;
    // Remove the API route prefix to get the file path
    const prefix = '/api/music/serve/';
    let filePath = urlPath.startsWith(prefix) ? urlPath.slice(prefix.length) : '';
    filePath = decodeURIComponent(filePath);
    const musicDir = path.join(process.cwd(), 'public', 'Music');
    const fullPath = path.join(musicDir, filePath);

    console.log('🎵 Serving music file:', filePath);
    console.log('🎵 Full path:', fullPath);

    // Security check: ensure the file is within the Music directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedMusicDir = path.resolve(musicDir);
    
    if (!resolvedPath.startsWith(resolvedMusicDir)) {
      console.error('❌ Security violation: Path traversal attempt');
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    try {
      const fileStats = await stat(fullPath);
      if (!fileStats.isFile()) {
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('❌ File not found:', fullPath);
      return new NextResponse('Not Found', { status: 404 });
    }

    // Only serve MP3 files
    if (!filePath.toLowerCase().endsWith('.mp3')) {
      return new NextResponse('Unsupported Media Type', { status: 415 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(fullPath);
    
    // Set appropriate headers for audio streaming
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Handle range requests for audio seeking
    const range = request.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
      
      if (start >= fileBuffer.length || end >= fileBuffer.length) {
        headers.set('Content-Range', `bytes */${fileBuffer.length}`);
        return new NextResponse('Range Not Satisfiable', { status: 416, headers });
      }
      
      const chunkSize = (end - start) + 1;
      const chunk = fileBuffer.slice(start, end + 1);
      
      headers.set('Content-Range', `bytes ${start}-${end}/${fileBuffer.length}`);
      headers.set('Content-Length', chunkSize.toString());
      
      return new NextResponse(chunk, { status: 206, headers });
    }

    console.log('✅ Successfully serving music file:', filePath);
    return new NextResponse(fileBuffer, { status: 200, headers });

  } catch (error) {
    console.error('❌ Error serving music file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}