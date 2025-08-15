import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Refreshing music library...');
    
    // Revalidate the music local API to refresh the cache
    revalidatePath('/api/music/local');
    
    console.log('✅ Music library refresh triggered');
    
    return NextResponse.json({
      success: true,
      message: 'Music library refresh triggered. Reload the page to see updated music.'
    });

  } catch (error) {
    console.error('❌ Error refreshing music library:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to refresh music library: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}