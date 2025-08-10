#!/usr/bin/env node

/**
 * Test script to verify Cloudflare R2 setup
 * Run this after setting up R2 to ensure everything works
 */

const https = require('https');

// Configuration - update these with your actual values
const config = {
  baseUrl: process.env.VERCEL_URL || 'http://localhost:3000',
  debugEndpoint: '/api/debug/storage',
  tokenEndpoint: '/api/tokens'
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy());
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Test the debug storage endpoint
 */
async function testDebugEndpoint() {
  console.log('🔍 Testing debug storage endpoint...');
  
  try {
    const url = `${config.baseUrl}${config.debugEndpoint}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      console.log('✅ Debug endpoint working');
      console.log('📊 Storage Info:', response.data.storage);
      console.log('🌍 Environment:', response.data.environment);
      
      if (response.data.storage.type === 'R2') {
        console.log('🎉 Cloudflare R2 is active!');
        return true;
      } else {
        console.log('⚠️  Not using R2 storage:', response.data.storage.type);
        return false;
      }
    } else {
      console.log('❌ Debug endpoint failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Debug endpoint error:', error.message);
    return false;
  }
}

/**
 * Test token creation
 */
async function testTokenCreation() {
  console.log('\n🔑 Testing token creation...');
  
  try {
    const tokenData = {
      name: 'Test Token',
      permissions: ['read', 'write'],
      status: 'active'
    };

    const url = `${config.baseUrl}${config.tokenEndpoint}`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });

    if (response.status === 201 || response.status === 200) {
      console.log('✅ Token created successfully');
      console.log('📝 Token ID:', response.data.id);
      return response.data.id;
    } else {
      console.log('❌ Token creation failed:', response.status);
      console.log('📄 Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Token creation error:', error.message);
    return null;
  }
}

/**
 * Test token persistence
 */
async function testTokenPersistence(tokenId) {
  if (!tokenId) {
    console.log('⚠️  Skipping persistence test (no token created)');
    return;
  }

  console.log('\n💾 Testing token persistence...');
  
  try {
    // Wait a bit to simulate time passing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check debug endpoint again to see if token count increased
    const url = `${config.baseUrl}${config.debugEndpoint}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      const tokenCount = response.data.storage.tokenCount;
      console.log(`📊 Current token count: ${tokenCount}`);
      
      if (tokenCount > 0) {
        console.log('✅ Tokens are persisting!');
        return true;
      } else {
        console.log('❌ No tokens found - persistence may not be working');
        return false;
      }
    } else {
      console.log('❌ Failed to check persistence');
      return false;
    }
  } catch (error) {
    console.log('❌ Persistence test error:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Cloudflare R2 Setup Tests\n');
  console.log(`📍 Testing against: ${config.baseUrl}`);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  // Test 1: Debug endpoint
  const debugWorking = await testDebugEndpoint();
  
  // Test 2: Token creation
  const tokenId = await testTokenCreation();
  
  // Test 3: Token persistence
  const persistenceWorking = await testTokenPersistence(tokenId);

  // Summary
  console.log('\n📋 Test Summary');
  console.log('================');
  console.log(`Debug Endpoint: ${debugWorking ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Creation: ${tokenId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Persistence: ${persistenceWorking ? '✅ PASS' : '❌ FAIL'}`);

  if (debugWorking && tokenId && persistenceWorking) {
    console.log('\n🎉 All tests passed! Your R2 setup is working correctly.');
    console.log('💡 Tokens will now persist reliably on Vercel.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the setup guide and try again.');
    console.log('📖 See CLOUDFLARE_R2_SETUP.md for detailed instructions.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testDebugEndpoint, testTokenCreation, testTokenPersistence }; 