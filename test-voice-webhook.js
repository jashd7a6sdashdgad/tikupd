// Test script to verify N8N webhook connectivity for voice assistant
async function testVoiceWebhook() {
  const webhookUrl = 'https://n8n.1000273.xyz/webhook/990e6a3a-6881-4ae3-a345-5d5ef28f5f58';
  
  console.log('🎤 Testing Voice Assistant N8N Webhook...');
  console.log('Webhook URL:', webhookUrl);
  
  const testPayload = {
    type: 'voice_message',
    action: 'send',
    audioBase64: 'dGVzdCBhdWRpbyBkYXRh', // "test audio data" in base64
    fileName: 'test_voice.webm',
    mimeType: 'audio/webm',
    duration: 5,
    size: 1024,
    timestamp: new Date().toISOString(),
    userId: 'test-user',
    userName: 'Test User'
  };
  
  try {
    console.log('📡 Sending test payload to N8N...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      console.log('✅ JSON Response received:', result);
    } else if (contentType && contentType.includes('audio/')) {
      console.log('✅ Audio response received, content type:', contentType);
      const audioBuffer = await response.arrayBuffer();
      console.log('Audio buffer size:', audioBuffer.byteLength);
    } else {
      const text = await response.text();
      console.log('✅ Text response received:', text);
    }
    
    console.log('🎉 Webhook test completed successfully!');
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    console.error('Details:', error);
  }
}

// Test webhook through local API endpoint
async function testLocalAPI() {
  console.log('\n🔍 Testing local voice-messages API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/voice-messages', {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Local API is running:', result);
    } else {
      console.log('⚠️ Local API returned:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Local API test failed:', error.message);
  }
}

// Run both tests
testVoiceWebhook()
  .then(() => testLocalAPI())
  .catch(console.error);