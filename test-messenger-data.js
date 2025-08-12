// Test what real Messenger data we can access with USER token
async function testMessengerData() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Messenger real data API endpoints...');
  
  try {
    // Test configuration
    console.log('\n📋 1. Testing Configuration:');
    const configResponse = await fetch(`${baseUrl}/api/messenger/test?type=config`);
    const configData = await configResponse.json();
    console.log('Config:', configData);
    
    if (!configData.data?.hasUserToken) {
      console.log('❌ No USER token found - check .env.local');
      return;
    }
    
    // Test user profile
    console.log('\n👤 2. Testing User Profile:');
    const profileResponse = await fetch(`${baseUrl}/api/messenger/test?type=profile`);
    const profileData = await profileResponse.json();
    console.log('Profile:', profileData);
    
    // Test friends data
    console.log('\n👥 3. Testing Friends Data:');
    const friendsResponse = await fetch(`${baseUrl}/api/messenger/test?type=friends`);
    const friendsData = await friendsResponse.json();
    console.log('Friends:', friendsData);
    
    // Test conversations
    console.log('\n💬 4. Testing Conversations:');
    const conversationsResponse = await fetch(`${baseUrl}/api/messenger/test?type=conversations`);
    const conversationsData = await conversationsResponse.json();
    console.log('Conversations:', conversationsData);
    
    // Test actual API endpoint
    console.log('\n🔧 5. Testing Messenger API Endpoint:');
    const messengerResponse = await fetch(`${baseUrl}/api/messenger?action=conversations`);
    const messengerData = await messengerResponse.json();
    console.log('Messenger API:', messengerData);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    if (profileData.success && profileData.data?.friendsCount > 0) {
      console.log(`✅ Real Data Available: ${profileData.data.userName} with ${profileData.data.friendsCount} friends`);
      console.log(`📈 Estimated Conversations: ${profileData.data.estimatedConversations}`);
      console.log(`📤 Estimated Messages: ${profileData.data.estimatedMessages}`);
    } else {
      console.log('⚠️ Limited data access - check Facebook token permissions');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMessengerData();