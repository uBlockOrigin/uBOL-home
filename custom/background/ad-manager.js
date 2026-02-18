// Ad Manager Background Module
// Handles domain matching, API communication, and content script injection

(function () {
    'use strict';

    // Get config from global (set by config.js - loaded first)
    const CONFIG = (typeof globalThis !== 'undefined' && globalThis.AD_CONFIG) ||
        (typeof window !== 'undefined' && window.AD_CONFIG) ||
        { SUPPORTED_DOMAINS: [] };

    // Track injected tabs to prevent duplicate injection
    const injectedTabs = new Set(); // tabId -> true
    // Pre-fetched ads for reuse by GET_ADS (avoids duplicate API calls)
    const preFetchedAds = new Map(); // domain -> { data: [], timestamp: number }
    const PREFETCH_REUSE_MS = 5000; // reuse pre-fetch for GET_ADS within 5s
    // Skip duplicate handleTabUpdate for same (tabId, url) within 2s (SPAs fire multiple 'complete' events)
    const lastProcessedTabUrl = new Map(); // tabId -> { url, ts }
    const TAB_UPDATE_DEBOUNCE_MS = 2000;

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
        const domains = CONFIG.SUPPORTED_DOMAINS || [];
        return domains.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );
    }

    /**
     * Get visitor ID (hashed hardware ID)
     * @returns {Promise<string>}
     */
    async function getVisitorId() {
        try {
            if (typeof globalThis !== 'undefined' && globalThis.identityModule) {
                return await globalThis.identityModule.getHashedHardwareId();
            }
            if (typeof window !== 'undefined' && window.identityModule) {
                return await window.identityModule.getHashedHardwareId();
            }
            console.error('[AdManager] Identity module not available');
            return 'temp-' + Date.now();
        } catch (error) {
            console.error('[AdManager] Failed to get visitor ID:', error);
            return 'temp-' + Date.now();
        }
    }

    /**
     * Fetch all active target domains from backend (GET /api/extension/domains).
     * Updates CONFIG.SUPPORTED_DOMAINS. Called during init.
     * @returns {Promise<string[]>} Array of domain strings
     */
    async function fetchTargetDomains() {
        try {
            if (!CONFIG.API_BASE_URL) {
                console.warn('[AdManager] API_BASE_URL not set, skipping target domains fetch');
                return CONFIG.SUPPORTED_DOMAINS || [];
            }
            const url = `${CONFIG.API_BASE_URL}/api/extension/domains`;
            console.log('[AdManager] Requesting target domains from backend:', url);

            const response = await fetch(url).catch((err) => {
                console.warn('[AdManager] Failed to fetch target domains:', err?.message || err);
                return null;
            });

            if (!response || !response.ok) {
                console.warn('[AdManager] Target domains API returned', response?.status || 'no response');
                return CONFIG.SUPPORTED_DOMAINS || [];
            }

            const data = await response.json();
            const domains = Array.isArray(data?.domains) ? data.domains : [];
            console.log('[AdManager] Target domains fetched:', domains);

            // Update config (shared reference - config.js and injected content see this)
            const config = (typeof globalThis !== 'undefined' && globalThis.AD_CONFIG) ||
                (typeof window !== 'undefined' && window.AD_CONFIG);
            if (config) {
                config.SUPPORTED_DOMAINS = domains;
            }
            return domains;
        } catch (error) {
            console.warn('[AdManager] Error fetching target domains:', error?.message || error);
            return CONFIG.SUPPORTED_DOMAINS || [];
        }
    }

    /**
     * Fetch ads from API for a domain
     * @param {string} domain - Domain name
     * @returns {Promise<Array>} Array of ad objects
     */
    async function fetchAds(domain) {
        try {
            if (!CONFIG.API_BASE_URL) {
                console.warn('[AdManager] API_BASE_URL not set (config.js must load first)');
                return [];
            }
            const visitorId = await getVisitorId();
            const url = `${CONFIG.API_BASE_URL}/api/extension/ad-block`;
            console.log(`[AdManager] Targeted URL (fetch): domain=${domain}, api=${url}`);

            let response;
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        visitorId,
                        domain,
                        // requestType: 'ad',
                    }),
                });
            } catch (fetchErr) {
                console.warn('[AdManager] Request failed (no response). Possible causes: CORS (allow extension origin on the API), network error, or invalid SSL.', fetchErr?.message || fetchErr);
                throw fetchErr;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error || `API returned ${response.status}: ${response.statusText}`;
                console.warn(`[AdManager] API error ${response.status} for ${domain}:`, msg);
                throw new Error(msg);
            }

            const data = await response.json();

            // Validate response format: { ads: [...], notifications: [] }
            if (!data || !Array.isArray(data.ads)) {
                console.error('[AdManager] Invalid API response format');
                return [];
            }

            const ads = data.ads;

            // Show domain-specific notifications from ad-block response
            const domainNotifications = Array.isArray(data.notifications) ? data.notifications : [];
            if (domainNotifications.length > 0) {
                const notificationsModule = (typeof globalThis !== 'undefined' && globalThis.notificationsModule) ||
                    (typeof window !== 'undefined' && window.notificationsModule);
                if (notificationsModule?.showNotification) {
                    domainNotifications.forEach((n) => {
                        if (n?.title && n?.message) {
                            notificationsModule.showNotification(n);
                        }
                    });
                }
            }

            // Store for reuse by GET_ADS (avoids duplicate request in same page load)
            preFetchedAds.set(domain, { data: ads, timestamp: Date.now() });

            console.log(`[AdManager] Fetched ${ads.length} ads for ${domain}`);
            return ads;
        } catch (error) {
            console.error(`[AdManager] Failed to fetch ads for ${domain}:`, error?.message || error);
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

    const INJECT_RETRY_DELAY_MS = 800;
    const INJECT_MAX_ATTEMPTS = 4;

    /**
     * Perform one injection attempt (config + ad-injector script).
     * @param {number} tabId - Chrome tab ID
     * @throws if executeScript fails
     */
    async function doInject(tabId) {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: (config) => {
                if (typeof window !== 'undefined') {
                    window.AD_CONFIG = config;
                }
            },
            args: [CONFIG],
        });
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['/js/scripting/ad-injector.js'],
        });
    }

    /**
     * Inject ad-injector content script into tab, with retry on failure.
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

            let lastError;
            for (let attempt = 1; attempt <= INJECT_MAX_ATTEMPTS; attempt++) {
                try {
                    await doInject(tabId);
                    injectedTabs.add(tabId);
                    console.log(`[AdManager] Injected content script into tab ${tabId}`);
                    // Clean up tracking when tab is closed
                    chrome.tabs.onRemoved.addListener((removedTabId) => {
                        if (removedTabId === tabId) {
                            injectedTabs.delete(removedTabId);
                            lastProcessedTabUrl.delete(removedTabId);
                        }
                    });
                    return;
                } catch (error) {
                    lastError = error;
                    if (attempt < INJECT_MAX_ATTEMPTS) {
                        console.warn(`[AdManager] Injection attempt ${attempt} failed for tab ${tabId}, retrying in ${INJECT_RETRY_DELAY_MS}ms...`, error?.message || error);
                        await new Promise((r) => setTimeout(r, INJECT_RETRY_DELAY_MS));
                        const tab = await chrome.tabs.get(tabId).catch(() => null);
                        if (!tab?.url || !isSupportedDomain(getHostname(tab.url))) {
                            console.log(`[AdManager] Tab ${tabId} no longer valid for injection, skipping retry`);
                            break;
                        }
                    }
                }
            }
            const errMsg = lastError?.message || String(lastError);
            console.error(`[AdManager] Failed to inject content script into tab ${tabId} after ${INJECT_MAX_ATTEMPTS} attempt(s):`, errMsg, lastError);
        } catch (error) {
            const errMsg = error?.message || String(error);
            console.error(`[AdManager] Failed to inject content script into tab ${tabId}:`, errMsg, error);
        }
    }

    // Register listeners at module load so we don't miss tabs opened before init runs
    if (chrome.tabs && chrome.tabs.onUpdated) {
        chrome.tabs.onUpdated.addListener(handleTabUpdate);
        console.log('[AdManager] Tab update listener registered');
    } else {
        console.error('[AdManager] chrome.tabs.onUpdated not available');
    }
    if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(handleMessage);
        console.log('[AdManager] Message listener registered');
    } else {
        console.error('[AdManager] chrome.runtime.onMessage not available');
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
            // Skip duplicate handleTabUpdate for same (tabId, url) within debounce window
            const last = lastProcessedTabUrl.get(tabId);
            if (last && last.url === tab.url && (Date.now() - last.ts) < TAB_UPDATE_DEBOUNCE_MS) {
                return;
            }
            lastProcessedTabUrl.set(tabId, { url: tab.url, ts: Date.now() });

            // Inject on every page load (including refresh with same URL) so ads show again
            console.log(`[AdManager] Targeted URL (initial load):`, tab.url);
            console.log(`[AdManager] Supported domain detected: ${hostname}`);

            // Pre-fetch ads so they're ready before content script runs (avoids race)
            const ads = await fetchAds(hostname).catch(() => []);

            // Only inject content script when we have ads to show
            if (ads.length === 0) {
                console.log(`[AdManager] No ads for ${hostname}, skipping content script injection`);
                return;
            }

            // Reset injection tracking for this tab (new page load)
            injectedTabs.delete(tabId);

            // Inject content script
            await injectContentScript(tabId);

        }
    }

    /**
     * Handle messages from content script
     * Must return true SYNCHRONOUSLY when we will call sendResponse later (Chrome closes the port otherwise).
     * @param {object} message - Message object
     * @param {chrome.runtime.MessageSender} sender - Message sender info
     * @param {function} sendResponse - Response callback
     * @returns {boolean} true if async response (keeps message channel open)
     */
    function handleMessage(message, sender, sendResponse) {
        if (message.type === 'GET_ADS') {
            const { domain } = message;
            if (!domain) {
                sendResponse({ error: 'Domain is required' });
                return false;
            }
            // Reuse pre-fetched ads if we have a recent result (avoids duplicate request in same page load)
            const prefetched = preFetchedAds.get(domain);
            if (prefetched && (Date.now() - prefetched.timestamp) < PREFETCH_REUSE_MS) {
                console.log(`[AdManager] Sending ${prefetched.data.length} ads to content script for ${domain} (from pre-fetch)`);
                sendResponse({ ads: prefetched.data });
                return false;
            }
            fetchAds(domain)
                .then((ads) => {
                    console.log(`[AdManager] Sending ${ads.length} ads to content script for ${domain}`);
                    sendResponse({ ads });
                })
                .catch((err) => {
                    console.error('[AdManager] GET_ADS failed:', err);
                    sendResponse({ ads: [], error: err.message });
                });
            return true; // Keep channel open for async sendResponse (must return true synchronously)
        }

        if (message.type === 'LOG_AD_EVENT') {
            const { domain } = message;
            if (!domain) {
                sendResponse({ error: 'Domain is required' });
                return false;
            }
            logAdEvent(domain).catch((err) => console.error('[AdManager] Log error:', err));
            sendResponse({ success: true });
            return false;
        }

        sendResponse({ error: 'Unknown message type' });
        return false;
    }

    /**
     * Initialize ad manager (visitor ID etc.).
     * Tab and message listeners are registered at module load so tabs are not missed.
     */
    async function initAdManager() {
        console.log('[AdManager] Initializing ad manager...');

        // Pre-fetch visitor ID
        await getVisitorId();

        // Fetch target domains from backend (GET /api/extension/domains)
        await fetchTargetDomains();

        console.log('[AdManager] Ad manager initialized');
    }

    // Export module
    if (typeof globalThis !== 'undefined') {
        globalThis.adManagerModule = {
            initAdManager,
            fetchAds,
            fetchTargetDomains,
            logAdEvent,
            getVisitorId,
        };
    }

    if (typeof window !== 'undefined') {
        window.adManagerModule = {
            initAdManager,
            fetchAds,
            fetchTargetDomains,
            logAdEvent,
            getVisitorId,
        };
    }

    console.log('[AdManager] Module loaded');
})();
