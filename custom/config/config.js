/**
 * Extension configuration. Loaded first so AD_CONFIG is available to
 * ad-manager, notifications, and the content script (injected).
 */
const AD_CONFIG = {
  API_BASE_URL: 'https://test.buildyourresume.in',
  SUPPORTED_DOMAINS: [],
};

if (typeof globalThis !== 'undefined') {
  globalThis.AD_CONFIG = AD_CONFIG;
}
if (typeof window !== 'undefined') {
  window.AD_CONFIG = AD_CONFIG;
}
