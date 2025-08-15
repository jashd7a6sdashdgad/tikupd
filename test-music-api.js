// Test script to verify local music API functionality
async function testMusicAPI() {
  console.log('🎵 Testing Local Music API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/music/local');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('🎵 API Response:', result);
    
    if (result.success && result.tracks) {
      console.log('✅ Success! Found', result.tracks.length, 'tracks:');
      result.tracks.forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.title} by ${track.artist}`);
        console.log(`     URL: ${track.audioUrl}`);
      });
    } else {
      console.log('⚠️ No tracks found or API error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMusicAPI();