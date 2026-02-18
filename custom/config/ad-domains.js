// Ad injection domain configuration
// Shared configuration for ad-manager.js background module

const AD_CONFIG = {
  // Base URL of the admin dashboard API
  // Update this to your production URL when deploying.
  // The API must allow CORS from the extension origin (chrome-extension://<your-extension-id>)
  // for /api/extension/ad-block and /api/extension/notifications, or requests will fail with "Failed to fetch".
  API_BASE_URL: 'https://test.buildyourresume.in',

  // Domains where ad injection is enabled
  // Static check - no network request needed
  SUPPORTED_DOMAINS: ['instagram.com'],

  // Maximum number of ads to inject per page
  MAX_ADS_PER_PAGE: 2,

  // Cache TTL for ad responses (10 minutes)
  CACHE_TTL_MS: 10 * 60 * 1000,

  // Debounce delay for SPA mutation observer scans (1 second)
  SCAN_DEBOUNCE_MS: 1000,

  // Maximum layout shift before rollback (pixels)
  LAYOUT_SHIFT_THRESHOLD_PX: 50,

  // Debug mode: main switch. When true, content script shows red debug boxes instead of actual ads; set false for production, true for debugging.
  DEBUG_AD_FRAMES: false,
};

// Export for use in background module
if (typeof globalThis !== 'undefined') {
  globalThis.AD_CONFIG = AD_CONFIG;
}
if (typeof window !== 'undefined') {
  window.AD_CONFIG = AD_CONFIG;
}
