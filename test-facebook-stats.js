const FACEBOOK_USER_TOKEN = process.env.FACEBOOK_USER_TOKEN;
const FACEBOOK_API_URL = 'https://graph.facebook.com/v18.0';

async function testFacebookUserStats() {
  if (!FACEBOOK_USER_TOKEN) {
    console.error('❌ FACEBOOK_USER_TOKEN not found in environment');
    return;
  }
  
  console.log('🔍 Testing Facebook USER token stats...');
  console.log(`🔑 Token: ${FACEBOOK_USER_TOKEN.slice(0, 10)}...`);
  
  try {
    // Test basic user info
    const userInfoUrl = `${FACEBOOK_API_URL}/me?fields=id,name,email&access_token=${FACEBOOK_USER_TOKEN}`;
    const userResponse = await fetch(userInfoUrl);
    
    if (!userResponse.ok) {
      console.error('❌ User info request failed:', userResponse.status);
      const errorText = await userResponse.text();
      console.error('Error:', errorText);
      return;
    }
    
    const userData = await userResponse.json();
    console.log('✅ User info:', userData);
    
    // Test friends count (if permission available)
    const friendsUrl = `${FACEBOOK_API_URL}/me?fields=id,name,friends.limit(0).summary(true)&access_token=${FACEBOOK_USER_TOKEN}`;
    const friendsResponse = await fetch(friendsUrl);
    
    if (friendsResponse.ok) {
      const friendsData = await friendsResponse.json();
      console.log('✅ Friends data:', friendsData);
      
      const friendsCount = friendsData.friends?.summary?.total_count || 0;
      console.log(`📊 Friends Count: ${friendsCount}`);
      
      if (friendsCount > 0) {
        console.log('🎉 SUCCESS: Facebook USER stats are working!');
        console.log(`📈 Data for social media dashboard:`);
        console.log(`   - Name: ${userData.name}`);
        console.log(`   - Friends/Followers: ${friendsCount}`);
        console.log(`   - Estimated Engagement: ${Math.round((friendsCount / 100) * 5.2) / 10}%`);
      } else {
        console.log('⚠️  Friends count is 0 - may need user_friends permission');
      }
    } else {
      console.log('⚠️  Friends data not accessible - may need user_friends permission');
      const friendsError = await friendsResponse.text();
      console.log('Friends error:', friendsError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run the test
testFacebookUserStats();