// Ad Manager Background Module
// Handles domain matching, API communication, and content script injection

(function () {
    'use strict';

    // Get config from global (set by ad-domains.js)
    const CONFIG = (typeof globalThis !== 'undefined' && globalThis.AD_CONFIG) ||
        (typeof window !== 'undefined' && window.AD_CONFIG) ||
    {
        API_BASE_URL: 'http://localhost:3000',
        SUPPORTED_DOMAINS: ['www.instagram.com', 'cnn.com'],
        MAX_ADS_PER_PAGE: 2,
        CACHE_TTL_MS: 10 * 60 * 1000,
    };

    // In-memory cache for ad responses
    const adCache = new Map(); // domain -> { data: [], timestamp: number }

    // Track injected tabs to prevent duplicate injection
    const injectedTabs = new Set(); // tabId -> true

    // Visitor ID cache (set during initialization)
    let visitorId = null;

    /**
     * Extract hostname from URL
     * @param {string} url - Full URL
     * @returns {string|null} Hostname or null
     */
    function getHostname(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, '');
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if domain is supported for ad injection
     * Static check - no network request
     * @param {string} hostname - Domain hostname
     * @returns {boolean}
     */
    function isSupportedDomain(hostname) {
        if (!hostname) return false;
        return CONFIG.SUPPORTED_DOMAINS.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );
    }

    /**
     * Get visitor ID (hashed hardware ID)
     * @returns {Promise<string>}
     */
    async function getVisitorId() {
        if (visitorId) {
            return visitorId;
        }

        try {
            if (typeof globalThis !== 'undefined' && globalThis.identityModule) {
                visitorId = await globalThis.identityModule.getHashedHardwareId();
                return visitorId;
            } else if (typeof window !== 'undefined' && window.identityModule) {
                visitorId = await window.identityModule.getHashedHardwareId();
                return visitorId;
            } else {
                console.error('[AdManager] Identity module not available');
                // Fallback: generate a temporary ID
                visitorId = 'temp-' + Date.now();
                return visitorId;
            }
        } catch (error) {
            console.error('[AdManager] Failed to get visitor ID:', error);
            visitorId = 'temp-' + Date.now();
            return visitorId;
        }
    }

    /**
     * Fetch ads from API for a domain
     * @param {string} domain - Domain name
     * @returns {Promise<Array>} Array of ad objects
     */
    async function fetchAds(domain) {
        // Check cache first
        const cached = adCache.get(domain);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < CONFIG.CACHE_TTL_MS) {
                console.log(`[AdManager] Using cached ads for ${domain}`);
                return cached.data;
            }
            // Cache expired
            adCache.delete(domain);
        }

        try {
            const visitorId = await getVisitorId();
            const url = `${CONFIG.API_BASE_URL}/api/extension/ad-block`;
            console.log(`[AdManager] Fetching ads from ${url} for domain ${domain}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visitorId,
                    domain,
                    requestType: 'ad',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Validate response format: { ads: [...], notifications: [] }
            if (!data || !Array.isArray(data.ads)) {
                console.error('[AdManager] Invalid API response format');
                return [];
            }

            const ads = data.ads;

            // Cache the response
            adCache.set(domain, {
                data: ads,
                timestamp: Date.now(),
            });

            console.log(`[AdManager] Fetched ${ads.length} ads for ${domain}`);
            return ads;
        } catch (error) {
            console.error(`[AdManager] Failed to fetch ads for ${domain}:`, error);
            return [];
        }
    }

    /**
     * Log ad event to API
     * Note: Logging is now automatic via the ad-block endpoint, but keeping this
     * for backward compatibility or future use if needed
     * @param {string} domain - Domain name
     * @returns {Promise<void>}
     */
    async function logAdEvent(domain) {
        // Logging is now automatic via the ad-block endpoint
        // This function is kept for backward compatibility
        console.log(`[AdManager] Ad event logged automatically for ${domain}`);
    }

    /**
     * Inject ad-injector content script into tab
     * @param {number} tabId - Chrome tab ID
     * @returns {Promise<void>}
     */
    async function injectContentScript(tabId) {
        try {
            // Check if already injected
            if (injectedTabs.has(tabId)) {
                console.log(`[AdManager] Content script already injected for tab ${tabId}`);
                return;
            }

            // Inject the content script
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['/js/scripting/ad-injector.js'],
            });

            injectedTabs.add(tabId);
            console.log(`[AdManager] Injected content script into tab ${tabId}`);

            // Clean up tracking when tab is closed
            chrome.tabs.onRemoved.addListener((removedTabId) => {
                if (removedTabId === tabId) {
                    injectedTabs.delete(tabId);
                }
            });
        } catch (error) {
            console.error(`[AdManager] Failed to inject content script into tab ${tabId}:`, error);
        }
    }

    /**
     * Handle tab updates - check if domain is supported and inject script
     * @param {number} tabId - Chrome tab ID
     * @param {object} changeInfo - Change information
     * @param {chrome.tabs.Tab} tab - Tab object
     */
    async function handleTabUpdate(tabId, changeInfo, tab) {
        // Only proceed when page is fully loaded
        if (changeInfo.status !== 'complete') {
            return;
        }

        // Check if tab has a valid URL
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }

        const hostname = getHostname(tab.url);
        if (!hostname) {
            return;
        }

        // Static domain check - no network request
        if (isSupportedDomain(hostname)) {
            console.log(`[AdManager] Supported domain detected: ${hostname}`);

            // Reset injection tracking for this tab (new page load)
            injectedTabs.delete(tabId);

            // Inject content script
            await injectContentScript(tabId);
        }
    }

    /**
     * Handle messages from content script
     * @param {object} message - Message object
     * @param {chrome.runtime.MessageSender} sender - Message sender info
     * @param {function} sendResponse - Response callback
     * @returns {boolean|Promise} true if async response
     */
    async function handleMessage(message, sender, sendResponse) {
        try {
            if (message.type === 'GET_ADS') {
                const { domain } = message;
                if (!domain) {
                    sendResponse({ error: 'Domain is required' });
                    return;
                }

                const ads = await fetchAds(domain);
                sendResponse({ ads });
                return true; // Indicates async response
            }

            if (message.type === 'LOG_AD_EVENT') {
                const { domain } = message;
                if (!domain) {
                    sendResponse({ error: 'Domain is required' });
                    return;
                }

                // Log asynchronously, don't wait
                logAdEvent(domain).catch(err => {
                    console.error('[AdManager] Log error:', err);
                });
                sendResponse({ success: true });
                return true;
            }

            // Unknown message type
            sendResponse({ error: 'Unknown message type' });
        } catch (error) {
            console.error('[AdManager] Message handler error:', error);
            sendResponse({ error: error.message });
        }
    }

    /**
     * Initialize ad manager
     * Sets up tab listener and message handler
     */
    async function initAdManager() {
        console.log('[AdManager] Initializing ad manager...');

        // Set up tab update listener
        if (chrome.tabs && chrome.tabs.onUpdated) {
            chrome.tabs.onUpdated.addListener(handleTabUpdate);
            console.log('[AdManager] Tab update listener registered');
        } else {
            console.error('[AdManager] chrome.tabs.onUpdated not available');
        }

        // Set up message listener
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(handleMessage);
            console.log('[AdManager] Message listener registered');
        } else {
            console.error('[AdManager] chrome.runtime.onMessage not available');
        }

        // Pre-fetch visitor ID
        await getVisitorId();

        console.log('[AdManager] Ad manager initialized');
    }

    // Export module
    if (typeof globalThis !== 'undefined') {
        globalThis.adManagerModule = {
            initAdManager,
            fetchAds,
            logAdEvent,
            getVisitorId,
        };
    }

    if (typeof window !== 'undefined') {
        window.adManagerModule = {
            initAdManager,
            fetchAds,
            logAdEvent,
            getVisitorId,
        };
    }

    console.log('[AdManager] Module loaded');
})();
