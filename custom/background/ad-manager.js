// Ad Manager Background Module
// Handles domain matching, API communication, and content script injection

(function () {
    'use strict';

    // Get config from global (set by ad-domains.js)
    const CONFIG = (typeof globalThis !== 'undefined' && globalThis.AD_CONFIG) ||
        (typeof window !== 'undefined' && window.AD_CONFIG) ||
    {
        API_BASE_URL: 'http://localhost:3000',
        SUPPORTED_DOMAINS: ['instagram.com', 'cnn.com'],
        MAX_ADS_PER_PAGE: 2,
        CACHE_TTL_MS: 10 * 60 * 1000,
    };

    // Track injected tabs to prevent duplicate injection
    const injectedTabs = new Set(); // tabId -> true
    // Track last injected URL per tab so we only run once per (tab, url) and avoid duplicate fetches
    const lastInjectedUrl = new Map(); // tabId -> url string
    // Pre-fetched ads for current page load only (reused for GET_ADS to avoid duplicate request)
    const preFetchedAds = new Map(); // domain -> { data: [], timestamp: number }
    const PREFETCH_REUSE_MS = 5000; // reuse pre-fetch for GET_ADS within 5s

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
     * Fetch image from URL and convert to base64 data URL at ~10% size (resize + JPEG).
     * Used in worker so content script never hits external image URLs.
     * @param {string} imageUrl - HTTP(S) image URL
     * @returns {Promise<string|null>} data URL or null on failure
     */
    async function fetchImageAsBase64Reduced(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string' || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
            return null;
        }
        const scale = 0.316; // sqrt(0.1) -> ~10% pixel count
        const jpegQuality = 0.75;
        let blob;
        try {
            let res = await fetch(imageUrl, { mode: 'cors' }).catch(() => null);
            if (!res || !res.ok) {
                res = await fetch(imageUrl).catch(() => null);
            }
            if (!res || !res.ok) return null;
            blob = await res.blob();
        } catch (e) {
            console.warn('[AdManager] fetchImageAsBase64Reduced fetch failed:', imageUrl, e?.message);
            return null;
        }
        try {
            if (typeof createImageBitmap === 'undefined' || typeof OffscreenCanvas === 'undefined') {
                const dataUrl = await new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = () => reject(new Error('FileReader failed'));
                    fr.readAsDataURL(blob);
                });
                return dataUrl;
            }
            const bitmap = await createImageBitmap(blob);
            const w = bitmap.width;
            const h = bitmap.height;
            const w2 = Math.max(1, Math.round(w * scale));
            const h2 = Math.max(1, Math.round(h * scale));
            const canvas = new OffscreenCanvas(w2, h2);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                bitmap.close();
                return null;
            }
            ctx.drawImage(bitmap, 0, 0, w2, h2);
            bitmap.close();
            const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality });
            const dataUrl = await new Promise((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(fr.result);
                fr.onerror = () => reject(new Error('FileReader failed'));
                fr.readAsDataURL(outBlob);
            });
            console.log('[AdManager] Image converted to base64 (~10% size):', imageUrl, 'original ~', w, 'x', h, '->', w2, 'x', h2);
            return dataUrl;
        } catch (e) {
            console.warn('[AdManager] fetchImageAsBase64Reduced convert failed:', imageUrl, e?.message);
            return null;
        }
    }

    /**
     * Enrich ads with base64 dataUrl for each image URL (done in worker; content script receives ready dataUrl).
     * Replaces image URL with converted data so content never fetches external images.
     */
    async function enrichAdsWithBase64Images(ads) {
        if (!ads || !Array.isArray(ads)) return ads;
        for (const ad of ads) {
            const hasData = ad.dataUrl || (ad.imageDataUrl && String(ad.imageDataUrl).trim().startsWith('data:'));
            const imageUrl = ad.image || ad.imageUrl || ad.image_url;
            if (hasData || !imageUrl || typeof imageUrl !== 'string') continue;
            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) continue;
            const dataUrl = await fetchImageAsBase64Reduced(imageUrl);
            if (dataUrl) {
                ad.dataUrl = dataUrl;
                ad.imageDataUrl = dataUrl;
                ad.image = dataUrl;
            }
        }
        return ads;
    }

    /**
     * Fetch ads from API for a domain
     * @param {string} domain - Domain name
     * @returns {Promise<Array>} Array of ad objects
     */
    async function fetchAds(domain) {
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

            // Convert image URLs to base64 in worker (~10% size); then send to content script
            await enrichAdsWithBase64Images(ads);

            // Store for reuse by GET_ADS (avoids duplicate request in same page load)
            preFetchedAds.set(domain, { data: ads, timestamp: Date.now() });

            console.log(`[AdManager] Fetched ${ads.length} ads for ${domain}`);
            console.log('[AdManager] Full API response:', JSON.stringify(data, null, 2));
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
                            lastInjectedUrl.delete(removedTabId);
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
            // Inject on every page load (including refresh with same URL) so ads show again
            console.log(`[AdManager] Supported domain detected: ${hostname}`);

            // Pre-fetch ads so they're ready before content script runs (avoids race)
            await fetchAds(hostname).catch(() => {});

            // Reset injection tracking for this tab (new page load)
            injectedTabs.delete(tabId);

            // Inject content script
            await injectContentScript(tabId);

            lastInjectedUrl.set(tabId, tab.url);
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

        if (message.type === 'GET_IMAGE') {
            const { url } = message;
            if (!url || typeof url !== 'string') {
                sendResponse({ error: 'URL is required' });
                return false;
            }
            console.log('[AdManager] GET_IMAGE requested url:', url);
            function toBase64(res) {
                if (!res.ok) throw new Error(res.statusText);
                return res.blob();
            }
            function blobToDataUrl(blob) {
                return new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = () => reject(new Error('FileReader failed'));
                    fr.readAsDataURL(blob);
                });
            }
            function logDataUrl(dataUrl, label) {
                const preview = typeof dataUrl === 'string' ? dataUrl.substring(0, 60) + (dataUrl.length > 60 ? '...' : '') : '(not a string)';
                console.log('[AdManager] GET_IMAGE base64', label || 'OK', 'url:', url, 'dataUrl length:', dataUrl?.length, 'preview:', preview);
            }
            function isValidDataUrl(dataUrl) {
                if (!dataUrl || typeof dataUrl !== 'string') return false;
                const s = dataUrl.trim();
                if (!s.startsWith('data:')) return false;
                if (s.startsWith('data:image/') && s.length > 100) return true;
                if (s.indexOf('base64,') !== -1 && s.length > 100) return true;
                return false;
            }
            function sendDataUrl(dataUrl) {
                if (!isValidDataUrl(dataUrl)) {
                    sendError('Invalid or opaque image response (CORS may block this URL). Prefer API returning base64.');
                    return;
                }
                logDataUrl(dataUrl, 'ok');
                sendResponse({ dataUrl });
            }
            function sendError(msg) {
                const reason = msg && String(msg).trim() ? msg : 'Failed to load image';
                console.warn('[AdManager] GET_IMAGE failed, no dataUrl. url:', url, 'reason:', reason);
                sendResponse({ error: reason });
            }
            fetch(url, { mode: 'cors' })
                .then(toBase64)
                .then(blobToDataUrl)
                .then(sendDataUrl)
                .catch((err) => {
                    console.warn('[AdManager] GET_IMAGE (cors) failed:', url, err?.message || err);
                    fetch(url)
                        .then(toBase64)
                        .then(blobToDataUrl)
                        .then(sendDataUrl)
                        .catch((err2) => {
                            console.warn('[AdManager] GET_IMAGE failed:', url, err2?.message || err2);
                            sendError(err2?.message || 'Failed to load image');
                        });
                });
            return true;
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
