// Test script to verify AI Voice Assistant API
async function testAIVoiceAssistant() {
  console.log('🤖 Testing AI Voice Assistant API...');
  
  const testPayload = {
    message: 'Hello, can you help me?',
    language: 'en',
    context: [],
    audioBase64: 'dGVzdCBhdWRpbyBkYXRh' // "test audio data" in base64
  };
  
  try {
    console.log('📡 Sending test message to AI Voice Assistant...');
    
    const response = await fetch('http://localhost:3000/api/ai/voice-assistant', {
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
    
    const result = await response.json();
    console.log('✅ AI Voice Assistant Response:', result);
    
    if (result.success) {
      console.log('🎉 AI Voice Assistant is working!');
      console.log('Response text:', result.response);
      console.log('Source:', result.source);
      if (result.audioBase64) {
        console.log('🔊 Audio response received (length:', result.audioBase64.length, ')');
      }
    } else {
      console.log('⚠️ AI Voice Assistant returned unsuccessful response');
    }
    
  } catch (error) {
    console.error('❌ AI Voice Assistant test failed:', error.message);
  }
}

// Test the API
testAIVoiceAssistant();