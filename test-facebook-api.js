// Test Facebook USER stats API endpoint
async function testFacebookAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Facebook USER stats API endpoint...');
  
  try {
    // Test the new get_user_stats action
    const response = await fetch(`${baseUrl}/api/facebook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Add a basic auth cookie for testing - in real app this comes from login
        'Cookie': 'auth_token=test'
      },
      body: JSON.stringify({ 
        action: 'get_user_stats' 
      })
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('🎉 SUCCESS: Facebook USER stats API is working!');
      console.log(`📈 Stats found:`);
      console.log(`   - User: ${data.data.name || 'Unknown'}`);
      console.log(`   - Friends: ${data.data.friends_count || 0}`);
      console.log(`   - Followers: ${data.data.followers_count || 0}`);
    } else {
      console.log('⚠️  API returned success=false or missing data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFacebookAPI();