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

  // Debug mode: main switch. When true, content script shows red debug boxes instead of actual ads; set false for production, true for debugging.
  DEBUG_AD_FRAMES: false,

  // When true, CNN uses content-flow slots when findCNNSlots returns 0 (e.g. article pages)
  CNN_FALLBACK_TO_CONTENT_FLOW: true,

  // When true, CNN uses a header banner when all other slot strategies return 0
  CNN_HEADER_FALLBACK: true,

  // Content-flow placement: insert ads after these 1-based block indices (e.g. after 2nd and 5th block in main content)
  CONTENT_FLOW_INSERT_AFTER_INDICES: [2, 5],
  MAX_CONTENT_FLOW_SLOTS: 2,

  // Common ad-related keywords for detecting empty ad containers
  AD_KEYWORDS: [
    'ad', 'ads', 'advert', 'advertisement', 'advertising',
    'banner', 'sponsor', 'sponsored', 'promo', 'promotion',
    'dfp', 'gpt-ad', 'gpt', 'taboola', 'outbrain',
    'adsense', 'doubleclick', 'adtech', 'adserver',
    'adunit', 'adslot', 'adcontainer', 'ad-wrapper',
    'ad-box', 'ad-frame', 'ad-zone', 'ad-placeholder'
  ],

  // Standard IAB ad sizes (width x height)
  STANDARD_AD_SIZES: [
    { width: 300, height: 250 }, // Medium Rectangle
    { width: 728, height: 90 },  // Leaderboard
    { width: 160, height: 600 },  // Wide Skyscraper
    { width: 320, height: 50 },   // Mobile Banner
    { width: 300, height: 600 },  // Half Page
    { width: 970, height: 250 },  // Billboard
    { width: 970, height: 90 },   // Large Leaderboard
    { width: 336, height: 280 },  // Large Rectangle
  ],
};

// Export for use in background module
if (typeof globalThis !== 'undefined') {
  globalThis.AD_CONFIG = AD_CONFIG;
}
if (typeof window !== 'undefined') {
  window.AD_CONFIG = AD_CONFIG;
}
