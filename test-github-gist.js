#!/usr/bin/env node

/**
 * Test script for GitHub Gist token storage
 * Run this after setting up GitHub Gist storage
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testGitHubGistSetup() {
  console.log('🧪 Testing GitHub Gist Token Storage Setup\n');
  
  try {
    // Test 1: Check storage type
    console.log('1️⃣ Testing storage type detection...');
    const storageResponse = await fetch(`${BASE_URL}/api/debug/storage`);
    
    if (!storageResponse.ok) {
      throw new Error(`Storage endpoint failed: ${storageResponse.status}`);
    }
    
    const storageInfo = await storageResponse.json();
    console.log('✅ Storage info:', storageInfo);
    
    if (storageInfo.type.includes('GitHub Gist')) {
      console.log('🎉 GitHub Gist storage is active!');
    } else {
      console.log('⚠️  GitHub Gist storage is NOT active');
      console.log('   Current storage:', storageInfo.type);
      console.log('   Check your environment variables:');
      console.log('   - GITHUB_TOKEN');
      console.log('   - GITHUB_GIST_ID');
      return;
    }
    
    // Test 2: Create a test token
    console.log('\n2️⃣ Testing token creation...');
    const createResponse = await fetch(`${BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'github-gist-test',
        permissions: ['read:expenses', 'write:expenses']
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Token creation failed: ${createResponse.status} - ${error}`);
    }
    
    const newToken = await createResponse.json();
    console.log('✅ Token created successfully:', {
      id: newToken.id,
      name: newToken.name,
      permissions: newToken.permissions,
      status: newToken.status
    });
    
    // Test 3: List tokens to verify persistence
    console.log('\n3️⃣ Testing token listing...');
    const listResponse = await fetch(`${BASE_URL}/api/tokens`);
    
    if (!listResponse.ok) {
      throw new Error(`Token listing failed: ${listResponse.status}`);
    }
    
    const tokens = await listResponse.json();
    console.log('✅ Tokens listed successfully');
    console.log(`   Found ${tokens.length} tokens`);
    
    const testToken = tokens.find(t => t.name === 'github-gist-test');
    if (testToken) {
      console.log('✅ Test token found in list (persistence working)');
    } else {
      console.log('❌ Test token NOT found in list (persistence issue)');
    }
    
    // Test 4: Test token persistence after delay
    console.log('\n4️⃣ Testing token persistence (waiting 5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const persistenceResponse = await fetch(`${BASE_URL}/api/tokens`);
    const persistentTokens = await persistenceResponse.json();
    
    const persistentTestToken = persistentTokens.find(t => t.name === 'github-gist-test');
    if (persistentTestToken) {
      console.log('✅ Token persists after delay (GitHub Gist working correctly)');
    } else {
      console.log('❌ Token lost after delay (GitHub Gist not working)');
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   Storage Type: ${storageInfo.type}`);
    console.log(`   Environment: ${storageInfo.environment}`);
    console.log(`   Vercel Detected: ${storageInfo.vercelDetected}`);
    console.log(`   Total Tokens: ${tokens.length}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your environment variables are set correctly');
    console.log('2. Verify the GitHub token has gist permissions');
    console.log('3. Ensure the gist ID is correct');
    console.log('4. Check Vercel function logs for errors');
    console.log('5. Try the /api/debug/storage endpoint manually');
  }
}

// Run the test
if (require.main === module) {
  testGitHubGistSetup();
}

module.exports = { testGitHubGistSetup }; 