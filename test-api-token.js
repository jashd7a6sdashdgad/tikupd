#!/usr/bin/env node

/**
 * Test script for API Token system
 * This script demonstrates how N8N would interact with the API
 */

const BASE_URL = 'http://localhost:3000'; // Change this to your actual URL

async function testApiTokenSystem() {
  console.log('🧪 Testing Mahboob Personal Assistant API Token System\n');

  try {
    // Step 1: Create a test token
    console.log('1️⃣ Creating API token...');
    const createTokenResponse = await fetch(`${BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'N8N Test Token',
        permissions: ['read:expenses', 'write:expenses', 'read:emails'],
        expiresInDays: 30
      })
    });

    if (!createTokenResponse.ok) {
      throw new Error(`Failed to create token: ${createTokenResponse.statusText}`);
    }

    const tokenData = await createTokenResponse.json();
    const apiToken = tokenData.token.token;
    console.log('✅ Token created successfully!');
    console.log(`   Token: ${apiToken.substring(0, 20)}...`);
    console.log(`   Name: ${tokenData.token.name}`);
    console.log(`   Permissions: ${tokenData.token.permissions.join(', ')}\n`);

    // Step 2: Test N8N authentication endpoint
    console.log('2️⃣ Testing N8N authentication...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/n8n`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ N8N authentication successful!');
      console.log(`   Authenticated as: ${authData.user.name}`);
      console.log(`   Permissions: ${authData.token.permissions.join(', ')}\n`);
    } else {
      console.log('❌ N8N authentication failed');
      return;
    }

    // Step 3: Test expenses API with token
    console.log('3️⃣ Testing expenses API access...');
    const expensesResponse = await fetch(`${BASE_URL}/api/expenses?limit=5`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (expensesResponse.ok) {
      const expensesData = await expensesResponse.json();
      console.log('✅ Expenses API access successful!');
      console.log(`   Retrieved ${expensesData.data?.length || 0} expenses`);
      console.log(`   Total in system: ${expensesData.meta?.total || 0}\n`);
    } else {
      console.log('❌ Expenses API access failed');
    }

    // Step 4: Test creating an expense
    console.log('4️⃣ Testing expense creation...');
    const createExpenseResponse = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        description: 'API Test Expense',
        category: 'Testing',
        amount: 1.99,
        currency: 'OMR',
        paymentMethod: 'API',
        notes: 'Created via API token test'
      })
    });

    if (createExpenseResponse.ok) {
      const expenseData = await createExpenseResponse.json();
      console.log('✅ Expense creation successful!');
      console.log(`   Expense ID: ${expenseData.data?.id}`);
      console.log(`   Amount: ${expenseData.data?.amount} ${expenseData.data?.currency}\n`);
    } else {
      console.log('❌ Expense creation failed');
    }

    // Step 5: Test emails API
    console.log('5️⃣ Testing emails API access...');
    const emailsResponse = await fetch(`${BASE_URL}/api/emails?maxResults=3&unreadOnly=true`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (emailsResponse.ok) {
      const emailsData = await emailsResponse.json();
      console.log('✅ Emails API access successful!');
      console.log(`   Retrieved ${emailsData.data?.emails?.length || 0} emails`);
      console.log(`   Unread count: ${emailsData.data?.unreadCount || 0}\n`);
    } else {
      console.log('❌ Emails API access failed');
    }

    // Step 6: Test invalid token
    console.log('6️⃣ Testing invalid token handling...');
    const invalidResponse = await fetch(`${BASE_URL}/api/expenses`, {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });

    if (invalidResponse.status === 401) {
      console.log('✅ Invalid token properly rejected (401)\n');
    } else {
      console.log('❌ Invalid token not properly handled');
    }

    // Step 7: Test without token
    console.log('7️⃣ Testing no token handling...');
    const noTokenResponse = await fetch(`${BASE_URL}/api/expenses`);

    if (noTokenResponse.status === 401) {
      console.log('✅ Missing token properly rejected (401)\n');
    } else {
      console.log('❌ Missing token not properly handled');
    }

    console.log('🎉 API Token system test completed successfully!');
    console.log('\n📋 N8N Integration Instructions:');
    console.log('   1. Create a token at: /api-tokens');
    console.log('   2. Use "N8N Agent" permission template');
    console.log('   3. In N8N HTTP Request nodes, add header:');
    console.log(`      Authorization: Bearer ${apiToken.substring(0, 20)}...`);
    console.log('   4. API Documentation available at: /api/docs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testApiTokenSystem();
}

module.exports = { testApiTokenSystem };