// Test script to verify updated analytics tracking API
async function testAnalyticsTracking() {
  console.log('📊 Testing Enhanced Analytics Tracking API...');
  
  // Create a test JWT token
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign(
    { userId: '1', username: 'test-user', email: 'test@example.com', type: 'website-jwt' },
    'punz', // JWT_SECRET
    { expiresIn: '1h' }
  );
  
  try {
    console.log('📡 Sending request to analytics tracking API...');
    
    const response = await fetch('http://localhost:3000/api/analytics/tracking', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Analytics Tracking API Response:');
    console.log('📈 Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n📊 Overview Data:');
      console.log('  - Total Events:', result.data.overview?.totalEvents || 0);
      console.log('  - Total Emails:', result.data.overview?.totalEmails || 0);
      console.log('  - Total Expenses:', result.data.overview?.totalExpenses || 0);
      console.log('  - Total Contacts:', result.data.overview?.totalContacts || 0);
      
      console.log('\n🏦 Bank-wise Breakdown:');
      if (result.data.bankWiseBreakdown && result.data.bankWiseBreakdown.length > 0) {
        result.data.bankWiseBreakdown.forEach(bank => {
          console.log(`\n📊 ${bank.bankType}:`);
          console.log(`  💰 Total Amount: ${bank.amount} OMR`);
          console.log(`  💳 Credit Amount: ${bank.creditAmount} OMR`);
          console.log(`  💸 Debit Amount: ${bank.debitAmount} OMR`);
          console.log(`  📈 Percentage: ${bank.percentage.toFixed(2)}%`);
          console.log(`  🔢 Transactions: ${bank.transactionCount}`);
          console.log(`  💰 Available Balance: ${bank.availableBalance} OMR`);
          console.log(`  ⚡ Health Score: ${bank.healthScore}`);
          console.log(`  📝 Insights: ${bank.insights}`);
          console.log(`  📊 Trend: ${bank.trend}`);
        });
      } else {
        console.log('  - No bank-wise data available');
      }
      
      console.log('\n🎂 Upcoming Events:');
      console.log('  - Total Upcoming:', result.data.upcomingEvents?.totalUpcoming || 0);
      console.log('  - Birthdays:', result.data.upcomingEvents?.birthdays?.length || 0);
      console.log('  - Omani Events:', result.data.upcomingEvents?.omaniEvents?.length || 0);
      
      console.log('\n📱 App Usage:');
      if (result.data.appUsage) {
        console.log('  - Total Workflows:', result.data.appUsage.totalWorkflows || 0);
        console.log('  - Music Library:', result.data.appUsage.totalMusicLibrary || 0);
        console.log('  - Diary Entries:', result.data.appUsage.totalDiaryEntries || 0);
        console.log('  - Workflow Activity:', result.data.appUsage.workflowActivity || 'Unknown');
        console.log('  - Music Activity:', result.data.appUsage.musicActivity || 'Unknown');
        console.log('  - Journal Activity:', result.data.appUsage.journalActivity || 'Unknown');
      }
      
      console.log('\n🔍 Debug Info:');
      if (result.data.debug?.apiResponses) {
        Object.entries(result.data.debug.apiResponses).forEach(([source, info]) => {
          console.log(`  - ${source}:`, info);
        });
      }
      
      console.log('\n🎉 Analytics tracking test completed successfully!');
    } else {
      console.log('⚠️ No data received or request failed');
    }
    
  } catch (error) {
    console.error('❌ Analytics tracking test failed:', error.message);
    console.error('Details:', error);
  }
}

// Run the test
testAnalyticsTracking();