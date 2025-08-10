// Simple test script to diagnose token storage issues
const { tokenStorage } = require('./src/lib/storage/tokenStorage.ts');

async function testTokenStorage() {
  try {
    console.log('Testing token storage system...');
    
    // Test storage type detection
    const storageType = tokenStorage.getStorageType();
    console.log('Storage type:', storageType);
    
    // Test loading tokens
    console.log('Loading tokens...');
    const tokens = await tokenStorage.loadTokens();
    console.log('Loaded tokens count:', tokens.length);
    
    // Test saving tokens
    console.log('Saving tokens...');
    await tokenStorage.saveTokens(tokens);
    console.log('Tokens saved successfully');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

testTokenStorage(); 