// Test script to verify ModernVoiceWidget N8N webhook integration
async function testModernVoiceWebhook() {
  const webhookUrl = 'https://n8n.srv903406.hstgr.cloud/webhook/990e6a3a-6881-4ae3-a345-5d5ef28f5f58';
  
  console.log('🎤 Testing ModernVoiceWidget N8N Webhook Integration...');
  console.log('Webhook URL:', webhookUrl);
  
  // Simulate the exact payload that ModernVoiceWidget sends
  const testPayload = {
    type: 'voice_message',
    action: 'send',
    audioBase64: 'dGVzdCBhdWRpbyBkYXRh', // "test audio data" in base64
    fileName: `voice_${Date.now()}.webm`,
    mimeType: 'audio/webm',
    duration: 5,
    size: 1024,
    timestamp: new Date().toISOString(),
    userId: 'modern-voice-widget',
    userName: 'Voice User',
    source: 'modern_voice_widget'
  };
  
  try {
    console.log('📡 Sending ModernVoiceWidget payload to N8N...');
    console.log('Payload:', {
      type: testPayload.type,
      action: testPayload.action,
      fileName: testPayload.fileName,
      userId: testPayload.userId,
      source: testPayload.source,
      audioLength: testPayload.audioBase64.length
    });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ModernVoiceWidget/1.0'
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
    console.log('Content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (responseText.trim()) {
        try {
          const result = JSON.parse(responseText);
          console.log('✅ JSON Response received:', result);
      
          if (result.transcription) {
            console.log('📝 Transcription:', result.transcription);
          }
          if (result.aiResponse || result.response) {
            console.log('🤖 AI Response:', result.aiResponse || result.response);
          }
          if (result.audioResponse || result.audioBase64) {
            console.log('🔊 Audio response received (length:', (result.audioResponse || result.audioBase64).length, ')');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse JSON response:', parseError.message);
          console.log('Raw response was:', responseText);
        }
      } else {
        console.log('⚠️ Response text is empty - N8N webhook responded but returned no content');
      }
      
    } else if (contentType && contentType.includes('audio/')) {
      console.log('✅ Audio response received, content type:', contentType);
      const audioBuffer = await response.arrayBuffer();
      console.log('Audio buffer size:', audioBuffer.byteLength);
      
    } else {
      const text = await response.text();
      console.log('✅ Text response received:', text);
    }
    
    console.log('🎉 ModernVoiceWidget webhook test completed successfully!');
    
  } catch (error) {
    console.error('❌ ModernVoiceWidget webhook test failed:', error.message);
    console.error('Details:', error);
  }
}

// Run the test
testModernVoiceWebhook();