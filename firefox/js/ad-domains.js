// Ad injection domain configuration
// Shared configuration for ad-manager.js background module

const AD_CONFIG = {
  // Base URL of the admin dashboard API
  // Update this to your production URL when deploying
  API_BASE_URL: 'http://localhost:3000',
  
  // Domains where ad injection is enabled
  // Static check - no network request needed
  SUPPORTED_DOMAINS: ['instagram.com', 'cnn.com'],
  
  // Maximum number of ads to inject per page
  MAX_ADS_PER_PAGE: 2,
  
  // Cache TTL for ad responses (10 minutes)
  CACHE_TTL_MS: 10 * 60 * 1000,
  
  // Debounce delay for SPA mutation observer scans (1 second)
  SCAN_DEBOUNCE_MS: 1000,
  
  // Maximum layout shift before rollback (pixels)
  LAYOUT_SHIFT_THRESHOLD_PX: 50,
  
  // Minimum dimensions for ad containers
  MIN_AD_WIDTH: 300,
  MIN_AD_HEIGHT: 250,
};

// Export for use in background module
if (typeof globalThis !== 'undefined') {
  globalThis.AD_CONFIG = AD_CONFIG;
}
if (typeof window !== 'undefined') {
  window.AD_CONFIG = AD_CONFIG;
}
