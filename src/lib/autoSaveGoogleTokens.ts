// Auto-save Google OAuth tokens functionality
// This runs in the browser to automatically capture and save new tokens

export function setupAutoSaveGoogleTokens() {
  if (typeof window === 'undefined') return; // Only run in browser
  
  console.log('🔄 Setting up auto-save for Google OAuth tokens...');
  
  // Monitor cookie changes for Google access token
  let lastAccessToken = getCookie('google_access_token');
  let lastRefreshToken = getCookie('google_refresh_token');
  
  // Check for token changes every 30 seconds
  const checkInterval = setInterval(() => {
    const currentAccessToken = getCookie('google_access_token');
    const currentRefreshToken = getCookie('google_refresh_token');
    
    // If access token changed, save it
    if (currentAccessToken && currentAccessToken !== lastAccessToken) {
      console.log('🔄 New Google access token detected, saving...');
      saveTokenToAPI(currentAccessToken, currentRefreshToken);
      lastAccessToken = currentAccessToken;
      lastRefreshToken = currentRefreshToken;
    }
  }, 30000); // Check every 30 seconds
  
  // Also hook into common OAuth events
  setupOAuthEventListeners();
  
  // Save cleanup function to window for debugging
  (window as any).stopGoogleTokenAutoSave = () => {
    clearInterval(checkInterval);
    console.log('🛑 Stopped Google token auto-save');
  };
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

async function saveTokenToAPI(accessToken: string, refreshToken: string | null) {
  try {
    const response = await fetch('/api/save-google-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken ? decodeURIComponent(refreshToken) : null
      })
    });
    
    if (response.ok) {
      console.log('✅ Google token saved successfully to API');
    } else {
      console.error('❌ Failed to save Google token to API:', response.status);
    }
  } catch (error) {
    console.error('❌ Error saving Google token to API:', error);
  }
}

function setupOAuthEventListeners() {
  // Listen for storage events (when tokens are updated in localStorage)
  window.addEventListener('storage', (event) => {
    if (event.key?.includes('google') && event.key?.includes('token')) {
      console.log('🔄 Google token storage event detected');
      // Small delay to ensure cookies are updated
      setTimeout(() => {
        const accessToken = getCookie('google_access_token');
        const refreshToken = getCookie('google_refresh_token');
        if (accessToken) {
          saveTokenToAPI(accessToken, refreshToken);
        }
      }, 1000);
    }
  });
  
  // Listen for focus events (when user comes back to tab after OAuth)
  window.addEventListener('focus', () => {
    // Small delay to check for new tokens after OAuth redirect
    setTimeout(() => {
      const accessToken = getCookie('google_access_token');
      const refreshToken = getCookie('google_refresh_token');
      if (accessToken) {
        saveTokenToAPI(accessToken, refreshToken);
      }
    }, 1000);
  });
}

// Initialize auto-save when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAutoSaveGoogleTokens);
  } else {
    setupAutoSaveGoogleTokens();
  }
}