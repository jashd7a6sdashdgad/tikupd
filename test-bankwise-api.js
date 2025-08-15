// Test script to debug bank-wise API
async function testBankWiseAPI() {
  console.log('🏦 Testing Bank-wise API directly...');
  
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign(
    { userId: '1', username: 'test-user', email: 'test@example.com', type: 'website-jwt' },
    'punz',
    { expiresIn: '1h' }
  );
  
  try {
    console.log('📡 Calling bank-wise API...');
    
    const response = await fetch('http://localhost:3000/api/analytics/bank-wise', {
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
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Bank-wise API Response:');
    console.log('Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n🏦 Bank Analysis:');
      if (result.data.bankAnalysis && result.data.bankAnalysis.length > 0) {
        result.data.bankAnalysis.forEach(bank => {
          console.log(`\n📊 ${bank.bankType}:`);
          console.log(`  💰 Amount: ${bank.amount} OMR`);
          console.log(`  📈 Percentage: ${bank.percentage.toFixed(2)}%`);
          console.log(`  🔢 Transactions: ${bank.transactionCount}`);
          console.log(`  💳 Available Balance: ${bank.availableBalance} OMR`);
          console.log(`  ⚡ Health Score: ${bank.healthScore}`);
          console.log(`  📝 Insights: ${bank.insights}`);
          console.log(`  📊 Trend: ${bank.trend}`);
        });
      } else {
        console.log('❌ No bank analysis data found');
      }
      
      console.log('\n📈 Summary:');
      console.log(`  Total Expenses: ${result.data.totalExpenses} OMR`);
      console.log(`  Top Spending Bank: ${result.data.topSpendingBank}`);
      console.log(`  Most Active Bank: ${result.data.mostActiveBank}`);
      console.log(`  Best Performing Bank: ${result.data.bestPerformingBank}`);
      console.log(`  Overall Health Score: ${result.data.overallHealthScore}`);
      
      if (result.data.aiRecommendations) {
        console.log('\n🤖 AI Recommendations:');
        result.data.aiRecommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
    } else {
      console.log('❌ No data in response or failed request');
      console.log('Full response:', result);
    }
    
  } catch (error) {
    console.error('❌ Bank-wise API test failed:', error.message);
    console.error('Details:', error);
  }
}

testBankWiseAPI();