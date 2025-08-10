#!/usr/bin/env node

/**
 * Test script for Vercel Token System
 * This script tests token creation on your Vercel deployment
 */

const BASE_URL = process.argv[2] || 'https://your-domain.vercel.app'; // Pass your Vercel URL as argument

async function testVercelTokenSystem() {
  console.log('🧪 Testing Vercel Token System\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  try {
    // Step 1: Check storage system status
    console.log('1️⃣ Checking storage system status...');
    const storageResponse = await fetch(`${BASE_URL}/api/debug/storage`);
    
    if (storageResponse.ok) {
      const storageData = await storageResponse.json();
      console.log('✅ Storage system check successful!');
      console.log(`   Storage Type: ${storageData.storage.type}`);
      console.log(`   Environment: ${storageData.environment.NODE_ENV}`);
      console.log(`   Vercel Detected: ${storageData.storage.vercelDetected}`);
      console.log(`   Token Count: ${storageData.storage.tokenCount}`);
      
      if (storageData.recommendations.length > 0) {
        console.log('   Recommendations:');
        storageData.recommendations.forEach(rec => console.log(`     - ${rec}`));
      }
    } else {
      console.log('❌ Storage system check failed');
      console.log(`   Status: ${storageResponse.status}`);
      const errorData = await storageResponse.text();
      console.log(`   Error: ${errorData}`);
    }
    console.log('');

    // Step 2: Create a test token
    console.log('2️⃣ Creating API token...');
    const createTokenResponse = await fetch(`${BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Vercel Test Token',
        permissions: ['read:expenses', 'write:expenses'],
        expiresInDays: 30
      })
    });

    if (createTokenResponse.ok) {
      const tokenData = await createTokenResponse.json();
      const apiToken = tokenData.token.token;
      console.log('✅ Token created successfully!');
      console.log(`   Token: ${apiToken.substring(0, 20)}...`);
      console.log(`   Name: ${tokenData.token.name}`);
      console.log(`   Permissions: ${tokenData.token.permissions.join(', ')}\n`);
    } else {
      const errorData = await createTokenResponse.json();
      console.log('❌ Token creation failed');
      console.log(`   Status: ${createTokenResponse.status}`);
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
      if (errorData.details) {
        console.log(`   Details: ${errorData.details}`);
      }
      return;
    }

    // Step 3: Verify token was saved by listing tokens
    console.log('3️⃣ Verifying token persistence...');
    const listResponse = await fetch(`${BASE_URL}/api/tokens`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Token listing successful!');
      console.log(`   Total tokens: ${listData.tokens.length}`);
      
      const testToken = listData.tokens.find(t => t.name === 'Vercel Test Token');
      if (testToken) {
        console.log('✅ Test token found in storage!');
        console.log(`   ID: ${testToken.id}`);
        console.log(`   Status: ${testToken.status}`);
      } else {
        console.log('❌ Test token not found in storage');
      }
    } else {
      console.log('❌ Token listing failed');
      console.log(`   Status: ${listResponse.status}`);
    }

    console.log('\n🎉 Vercel token system test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  if (!BASE_URL.includes('vercel.app') && !BASE_URL.includes('localhost')) {
    console.log('⚠️  Warning: This doesn\'t look like a Vercel URL or localhost');
    console.log('   Make sure to pass your Vercel deployment URL as an argument:');
    console.log('   node test-vercel-tokens.js https://your-app.vercel.app');
    console.log('');
  }
  
  testVercelTokenSystem();
}

module.exports = { testVercelTokenSystem }; 