// Ad Injector Content Script
// Runs in web page context, finds safe injection points and renders ads

(function () {
    'use strict';
    console.log('[AdInjector] Script file loaded');

    // Get config from global (set by ad-domains.js via background). Single source of truth for DEBUG_AD_FRAMES is injected AD_CONFIG; fallback to true only when AD_CONFIG is missing.
    const CONFIG = (typeof window !== 'undefined' && window.AD_CONFIG) ||
    {
        MAX_ADS_PER_PAGE: 2,
        SCAN_DEBOUNCE_MS: 1000,
        LAYOUT_SHIFT_THRESHOLD_PX: 50,
        MIN_AD_WIDTH: 300,
        MIN_AD_HEIGHT: 250,
        DEBUG_AD_FRAMES: true,
        AD_KEYWORDS: [
            'ad', 'ads', 'advert', 'advertisement', 'advertising',
            'banner', 'sponsor', 'sponsored', 'promo', 'promotion',
            'dfp', 'gpt-ad', 'gpt', 'taboola', 'outbrain',
            'adsense', 'doubleclick', 'adtech', 'adserver',
            'adunit', 'adslot', 'adcontainer', 'ad-wrapper',
            'ad-box', 'ad-frame', 'ad-zone', 'ad-placeholder'
        ],
        STANDARD_AD_SIZES: [
            { width: 300, height: 250 },
            { width: 728, height: 90 },
            { width: 160, height: 600 },
            { width: 320, height: 50 },
            { width: 300, height: 600 },
            { width: 970, height: 250 },
            { width: 970, height: 90 },
            { width: 336, height: 280 },
        ],
    };

    // State
    let ads = [];
    let injectedAdIds = new Set();
    let injectedContainers = [];
    let debugBoxes = []; // Track debug boxes for cleanup
    const injectedRootElements = new Set(); // Root elements we injected (to ignore our own mutations)
    let mutationObserver = null;
    let scanDebounceTimer = null;
    let currentUrl = window.location.href;
    let isInitialized = false;
    const INSTAGRAM_RETRY_DELAYS_MS = [2500, 5000, 8000];
    const INSTAGRAM_MAX_RETRIES = 3;
    let instagramRetryCount = 0;
    let instagramUrlPollId = null; // SPA URL check when we skip mutation observer on Instagram

    const MAX_SLOT_RETRIES = 3;
    const SLOT_RETRY_DELAYS_MS = [1500, 3500, 6000];
    let slotRetryCount = 0;

    // Generate obfuscated attribute name once per page load
    const OBFUSCATED_ATTR = '_x' + Math.random().toString(36).substr(2, 5);
    const OBFUSCATED_HOST_CLASS = '_h' + Math.random().toString(36).substr(2, 5);

    // Duck container: predictable, selectable wrapper for our ads (class "duck")
    const DUCK_CONTAINER_CLASS = 'duck';

    /**
     * Get current domain
     * @returns {string}
     */
    function getDomain() {
        return window.location.hostname.replace(/^www\./, '');
    }

    /**
     * Check if string is a valid image URL (http/https/data)
     * @param {*} s
     * @returns {boolean}
     */
    function isImageUrl(s) {
        if (!s || typeof s !== 'string') return false;
        const t = s.trim();
        return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:');
    }

    /**
     * Normalize ad: image URL or API-supplied base64 data URL
     * API may send image: "Yes" and actual URL in imageUrl; or dataUrl/imageData/image as data: URL
     * @param {object} ad
     * @returns {object}
     */
    function normalizeAd(ad) {
        const a = { ...ad };
        const dataUrlRaw = a.dataUrl || a.imageData || (a.image && typeof a.image === 'string' && a.image.trim().startsWith('data:') ? a.image : null);
        if (dataUrlRaw && typeof dataUrlRaw === 'string' && dataUrlRaw.trim().startsWith('data:')) {
            a.imageDataUrl = dataUrlRaw.trim();
        }
        const rawImage = a.imageUrl || a.image_url || a.image;
        if (rawImage && isImageUrl(rawImage) && !a.imageDataUrl) {
            a.image = rawImage;
        } else if (!a.imageDataUrl && (!a.image || a.image === 'Yes' || a.image === true || !isImageUrl(a.image))) {
            const url = (a.imageUrl && isImageUrl(a.imageUrl)) ? a.imageUrl : (a.image_url && isImageUrl(a.image_url)) ? a.image_url : null;
            a.image = url;
        }
        return a;
    }

    /**
     * Request ads from background script (with retries to avoid race with background fetch)
     * @returns {Promise<Array>}
     */
    async function requestAds() {
        const domain = getDomain();

        function doRequest() {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { type: 'GET_ADS', domain },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('[AdInjector] Message error:', chrome.runtime.lastError);
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        if (response && Array.isArray(response.ads)) {
                            const normalized = response.ads.map(normalizeAd);
                            const count = normalized.length;
                            if (count > 0) {
                                console.log(`[AdInjector] ✅ Received ${count} ads from API:`);
                                normalized.forEach((ad, index) => {
                                    console.log(`[AdInjector]   Ad ${index + 1}:`, {
                                        id: ad.id,
                                        title: ad.title,
                                        description: ad.description?.substring(0, 50) + '...',
                                        image: ad.image ? ad.image : '(none)',
                                        redirectUrl: ad.redirectUrl
                                    });
                                });
                            }
                            resolve(normalized);
                        } else {
                            resolve([]);
                        }
                    }
                );
            });
        }

        let result = await doRequest();
        if (result.length === 0) {
            console.log('[AdInjector] ⚠️ No ads in first response; retrying in 600ms...');
            await new Promise(r => setTimeout(r, 600));
            result = await doRequest();
            if (result.length > 0) {
                console.log(`[AdInjector] ✅ Got ${result.length} ads on retry`);
            }
        }
        if (result.length === 0) {
            console.log('[AdInjector] ⚠️ No ads in API response after retry');
        }
        return result;
    }

    /**
     * Log ad event to background
     * @param {string} domain
     */
    function logAdEvent(domain) {
        chrome.runtime.sendMessage(
            { type: 'LOG_AD_EVENT', domain },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('[AdInjector] Log error:', chrome.runtime.lastError);
                }
            }
        );
    }

    /**
     * Check if element is visible
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    function isVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }

    /**
     * Check if element has overflow hidden
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    function hasOverflowHidden(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden';
    }

    /**
     * Check if element is in viewport
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    function isInViewport(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Get class name as string (HTMLElement has string; SVGElement has SVGAnimatedString)
     * @param {Element} el
     * @returns {string}
     */
    function getClassNameString(el) {
        if (!el || el.className == null) return '';
        const c = el.className;
        if (typeof c === 'string') return c;
        if (typeof c === 'object' && typeof c.baseVal === 'string') return c.baseVal;
        return String(c);
    }

    /**
     * Check if element has ad-related keywords in class or ID
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    function hasAdKeywords(el) {
        if (!el) return false;
        const adKeywords = CONFIG.AD_KEYWORDS || [];
        const className = getClassNameString(el).toLowerCase();
        const id = (el.id != null ? String(el.id) : '').toLowerCase();

        return adKeywords.some(keyword =>
            className.includes(keyword) || id.includes(keyword)
        );
    }

    /**
     * Check if element matches standard ad dimensions
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    function matchesStandardAdSize(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const standardSizes = CONFIG.STANDARD_AD_SIZES || [];

        // Allow 5px tolerance for each dimension
        return standardSizes.some(size => {
            const widthMatch = Math.abs(rect.width - size.width) <= 5;
            const heightMatch = Math.abs(rect.height - size.height) <= 5;
            return widthMatch && heightMatch && rect.width > 0 && rect.height > 0;
        });
    }

    /**
     * Check if element is hidden by cosmetic filters (display:none!important)
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    function isHiddenByBlocker(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        // Check if display is none with important flag (signature of cosmetic filters)
        if (style.display === 'none') {
            // Check if it has ad-related identifiers
            return hasAdKeywords(el);
        }
        return false;
    }

    /**
     * Detect empty ad frames across the entire DOM
     * @returns {Array} Array of slot objects with element, rect, reason, originalSelector
     */
    function detectEmptyAdFrames() {
        const slots = [];
        const seenElements = new Set();
        const adKeywords = CONFIG.AD_KEYWORDS || [];

        // Strategy 1: Empty/collapsed iframes
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            if (seenElements.has(iframe)) continue;

            const rect = iframe.getBoundingClientRect();
            const style = window.getComputedStyle(iframe);

            // Check if iframe is collapsed or hidden
            if ((rect.width === 0 && rect.height === 0) ||
                style.display === 'none' ||
                style.visibility === 'hidden') {

                // Check if it has ad-related attributes or is in ad container
                const parent = iframe.parentElement;
                if (hasAdKeywords(iframe) || (parent && hasAdKeywords(parent))) {
                    seenElements.add(iframe);
                    slots.push({
                        element: iframe,
                        rect: rect,
                        reason: 'empty-iframe',
                        originalSelector: iframe.id || getClassNameString(iframe) || 'iframe',
                        parent: parent || iframe.parentElement,
                        replaceElement: iframe
                    });
                }
            }
        }

        // Strategy 2: Empty ad containers (by keyword matching)
        // Use a more comprehensive selector
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            if (seenElements.has(el)) continue;
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue;

            // Check if element has ad-related keywords
            if (!hasAdKeywords(el)) continue;

            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);

            // Check if empty or collapsed
            const isEmpty = el.children.length === 0 &&
                el.textContent.trim() === '' &&
                el.innerHTML.trim() === '';

            const isCollapsed = rect.width === 0 && rect.height === 0;
            const isHidden = style.display === 'none' || style.visibility === 'hidden';
            const hasZeroHeight = el.scrollHeight === 0 || el.clientHeight === 0;

            // Must meet minimum size requirements if visible
            const meetsMinSize = rect.width >= CONFIG.MIN_AD_WIDTH &&
                rect.height >= CONFIG.MIN_AD_HEIGHT;

            if ((isEmpty || isCollapsed || isHidden || hasZeroHeight) &&
                (isHidden || meetsMinSize || matchesStandardAdSize(el))) {

                seenElements.add(el);
                const firstClass = getClassNameString(el).trim().split(/\s+/)[0];
                const selector = el.id ? `#${el.id}` :
                    firstClass ? `.${firstClass}` :
                        el.tagName.toLowerCase();

                slots.push({
                    element: el,
                    rect: rect,
                    reason: isEmpty ? 'empty-container' :
                        isHidden ? 'hidden-by-blocker' :
                            'collapsed-container',
                    originalSelector: selector,
                    parent: el.parentElement,
                    replaceElement: el
                });
            }
        }

        // Strategy 3: Elements matching standard ad sizes (even if not empty)
        // These might be placeholders waiting for ads
        for (const el of allElements) {
            if (seenElements.has(el)) continue;
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;

            // Check if matches standard ad size
            if (matchesStandardAdSize(el)) {
                // Check if it's empty or has minimal content
                const isEmpty = el.children.length === 0 &&
                    el.textContent.trim().length < 20;

                const style = window.getComputedStyle(el);
                const isHidden = style.display === 'none';

                if ((isEmpty || isHidden) && !seenElements.has(el)) {
                    seenElements.add(el);
                    const firstClass = getClassNameString(el).trim().split(/\s+/)[0];
                    const selector = el.id ? `#${el.id}` :
                        firstClass ? `.${firstClass}` :
                            el.tagName.toLowerCase();

                    slots.push({
                        element: el,
                        rect: rect,
                        reason: 'standard-ad-size',
                        originalSelector: selector,
                        parent: el.parentElement,
                        replaceElement: el
                    });
                }
            }
        }

        // Strategy 4: Elements hidden by blocker with ad keywords
        for (const el of allElements) {
            if (seenElements.has(el)) continue;
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue;

            if (isHiddenByBlocker(el)) {
                const rect = el.getBoundingClientRect();
                seenElements.add(el);
                const firstClass = getClassNameString(el).trim().split(/\s+/)[0];
                const selector = el.id ? `#${el.id}` :
                    firstClass ? `.${firstClass}` :
                        el.tagName.toLowerCase();

                slots.push({
                    element: el,
                    rect: rect,
                    reason: 'hidden-by-blocker',
                    originalSelector: selector,
                    parent: el.parentElement,
                    replaceElement: el
                });
            }
        }

        // Strategy 5: Common ad placement areas (sidebar, aside, etc.) even without keywords
        const commonAdSelectors = [
            'aside', '.sidebar', '.side-bar', '.ad-sidebar',
            '[role="complementary"]', '.widget', '.widget-area',
            '.ad-container', '.ad-wrapper', '.ad-box', '.ad-slot',
            '[id*="ad"]', '[class*="ad"]', '[id*="banner"]', '[class*="banner"]'
        ];

        for (const selector of commonAdSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    if (seenElements.has(el)) continue;
                    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue;

                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);

                    // Check if it's empty or has minimal content
                    const isEmpty = el.children.length === 0 && el.textContent.trim().length < 50;
                    const isHidden = style.display === 'none';
                    const hasMinSize = rect.width >= CONFIG.MIN_AD_WIDTH && rect.height >= CONFIG.MIN_AD_HEIGHT;

                    if ((isEmpty || isHidden || matchesStandardAdSize(el)) &&
                        (isHidden || hasMinSize || matchesStandardAdSize(el))) {
                        seenElements.add(el);
                        const firstClass = getClassNameString(el).trim().split(/\s+/)[0];
                        const sel = el.id ? `#${el.id}` :
                            firstClass ? `.${firstClass}` :
                                selector;

                        slots.push({
                            element: el,
                            rect: rect,
                            reason: isEmpty ? 'empty-common-area' :
                                isHidden ? 'hidden-common-area' :
                                    'common-ad-area',
                            originalSelector: sel,
                            parent: el.parentElement,
                            replaceElement: el
                        });
                    }
                }
            } catch (e) {
                // Invalid selector, skip
            }
        }

        // Strategy 6: Iframes that might be ad containers (even if not collapsed)
        for (const iframe of iframes) {
            if (seenElements.has(iframe)) continue;

            const rect = iframe.getBoundingClientRect();
            const style = window.getComputedStyle(iframe);

            // Check if iframe matches ad size or is in ad container
            if ((matchesStandardAdSize(iframe) ||
                (rect.width >= CONFIG.MIN_AD_WIDTH && rect.height >= CONFIG.MIN_AD_HEIGHT)) &&
                (style.display === 'none' || hasAdKeywords(iframe) ||
                    (iframe.parentElement && hasAdKeywords(iframe.parentElement)))) {

                seenElements.add(iframe);
                slots.push({
                    element: iframe,
                    rect: rect,
                    reason: 'iframe-ad-container',
                    originalSelector: iframe.id || getClassNameString(iframe) || 'iframe',
                    parent: iframe.parentElement,
                    replaceElement: iframe
                });
            }
        }

        console.log(`[AdInjector] 🔍 Detection complete: found ${slots.length} potential slots before filtering`);

        // Limit results and sort by size (prefer larger slots)
        const filteredSlots = slots
            .filter(slot => {
                // For hidden elements, accept any size
                if (slot.reason === 'hidden-by-blocker' || slot.reason === 'hidden-common-area') {
                    return true;
                }
                // For visible elements, require minimum size
                return slot.rect.width >= CONFIG.MIN_AD_WIDTH ||
                    slot.rect.height >= CONFIG.MIN_AD_HEIGHT ||
                    matchesStandardAdSize(slot.element);
            })
            .sort((a, b) => (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height))
            .slice(0, CONFIG.MAX_ADS_PER_PAGE * 3); // Get more candidates in debug mode

        console.log(`[AdInjector] ✅ Filtered to ${filteredSlots.length} valid slots`);
        return filteredSlots;
    }

    /**
     * Create a Shadow DOM host element with obfuscated naming
     * @returns {HTMLElement} Host element with shadow root
     */
    function createShadowHost() {
        const host = document.createElement('div');
        host.className = OBFUSCATED_HOST_CLASS;
        host.setAttribute(OBFUSCATED_ATTR, 'true');
        host.style.cssText = `
            all: initial;
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        `;
        return host;
    }

    /**
     * Render red debug boxes in detected empty frames using Shadow DOM
     * @param {Array} slots - Array of slot objects from detectEmptyAdFrames()
     */
    function renderDebugBoxes(slots) {
        // Clean up existing debug boxes first
        debugBoxes.forEach(box => {
            try {
                if (box.host) {
                    injectedRootElements.delete(box.host);
                    if (box.host.parentElement) {
                        box.host.parentElement.removeChild(box.host);
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        });
        debugBoxes = [];

        if (!slots || slots.length === 0) {
            console.log('[AdInjector] ⚠️ No empty frames detected; will show test box if none rendered');
        } else {
            console.log(`[AdInjector] 🎨 Rendering ${slots.length} red debug boxes...`);
        }

        // Limit to MAX_ADS_PER_PAGE but show more if in debug mode
        const maxBoxes = (slots && slots.length > 0) && CONFIG.DEBUG_AD_FRAMES
            ? Math.min(slots.length, CONFIG.MAX_ADS_PER_PAGE * 3)
            : (slots && slots.length) || 0;
        const slotsToRender = (slots && slots.length) ? slots.slice(0, maxBoxes) : [];

        for (let i = 0; i < slotsToRender.length; i++) {
            const slot = slotsToRender[i];
            try {
                const { element, rect, reason, originalSelector, parent, replaceElement, afterElement } = slot;

                // Get actual dimensions (domain-specific slots may have no rect/element, only parent/afterElement)
                let actualRect = rect && typeof rect.width === 'number' ? rect : null;
                if (!actualRect && element && element.getBoundingClientRect) {
                    const elementRect = element.getBoundingClientRect();
                    if (elementRect.width > 0 || elementRect.height > 0) {
                        actualRect = elementRect;
                    }
                }
                if (!actualRect && afterElement && afterElement.getBoundingClientRect) {
                    const elRect = afterElement.getBoundingClientRect();
                    actualRect = { width: elRect.width, height: Math.max(elRect.height, CONFIG.MIN_AD_HEIGHT) };
                }
                if (!actualRect && replaceElement && replaceElement.getBoundingClientRect) {
                    actualRect = replaceElement.getBoundingClientRect();
                }
                const safeRect = actualRect || { width: CONFIG.MIN_AD_WIDTH, height: CONFIG.MIN_AD_HEIGHT };
                const width = Math.max(safeRect.width || CONFIG.MIN_AD_WIDTH, CONFIG.MIN_AD_WIDTH);
                const height = Math.max(safeRect.height || CONFIG.MIN_AD_HEIGHT, CONFIG.MIN_AD_HEIGHT);

                // Determine insertion point
                let insertionParent = parent;
                let insertionMethod = 'append';

                if (replaceElement && replaceElement.parentElement) {
                    insertionParent = replaceElement.parentElement;
                    insertionMethod = 'replace';
                } else if (!insertionParent && element && element.parentElement) {
                    insertionParent = element.parentElement;
                    insertionMethod = 'append';
                }

                if (!insertionParent) {
                    console.warn(`[AdInjector] ⚠️ Slot ${i + 1}: No parent found, skipping`);
                    continue;
                }

                const slotReason = (reason && String(reason)) || 'domain-slot';
                const slotSelector = (originalSelector && String(originalSelector)) || '(domain)';

                // Create shadow host with explicit dimensions
                const host = createShadowHost();

                host.style.cssText = `
                    all: initial;
                    display: block !important;
                    position: relative !important;
                    width: ${width}px !important;
                    height: ${height}px !important;
                    min-width: ${width}px !important;
                    min-height: ${height}px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    z-index: 999999 !important;
                `;

                // Create shadow root (closed mode for maximum isolation)
                const shadowRoot = host.attachShadow({ mode: 'closed' });

                // Create debug box inside shadow root - make it VERY visible
                const debugBox = document.createElement('div');
                debugBox.style.cssText = `
                    display: block !important;
                    width: 100% !important;
                    height: 100% !important;
                    min-width: ${width}px !important;
                    min-height: ${height}px !important;
                    border: 4px solid #ff0000 !important;
                    background: rgba(255, 0, 0, 0.15) !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    z-index: 999999 !important;
                `;

                // Create large label badge
                const label = document.createElement('div');
                label.textContent = `AD SLOT ${i + 1}: ${Math.round(width)}×${Math.round(height)} B64: N/A`;
                label.style.cssText = `
                    position: absolute !important;
                    top: 8px !important;
                    left: 8px !important;
                    background: #ff0000 !important;
                    color: #ffffff !important;
                    padding: 6px 12px !important;
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    border-radius: 4px !important;
                    z-index: 1000000 !important;
                    white-space: nowrap !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
                `;

                // Create reason badge
                const reasonBadge = document.createElement('div');
                reasonBadge.textContent = slotReason.toUpperCase();
                reasonBadge.style.cssText = `
                    position: absolute !important;
                    top: 8px !important;
                    right: 8px !important;
                    background: rgba(255, 0, 0, 0.95) !important;
                    color: #ffffff !important;
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    border-radius: 4px !important;
                    z-index: 1000000 !important;
                    white-space: nowrap !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
                `;

                debugBox.appendChild(label);
                debugBox.appendChild(reasonBadge);
                shadowRoot.appendChild(debugBox);

                // Insert into DOM
                if (insertionMethod === 'replace' && replaceElement) {
                    replaceElement.replaceWith(host);
                    console.log(`[AdInjector] ✅ Box ${i + 1}: Replaced element "${slotSelector}"`);
                } else if (insertionParent) {
                    insertionParent.appendChild(host);
                    console.log(`[AdInjector] ✅ Box ${i + 1}: Appended to parent`);
                } else {
                    console.warn(`[AdInjector] ⚠️ Box ${i + 1}: Could not insert`);
                    continue;
                }

                debugBoxes.push({ host, shadowRoot, slot });
                injectedRootElements.add(host);
                console.log(`[AdInjector] 🟥 Rendered red box ${i + 1}/${slotsToRender.length}: ${Math.round(width)}×${Math.round(height)}px (${slotReason})`);
            } catch (error) {
                console.error(`[AdInjector] ❌ Failed to render debug box ${i + 1}:`, error);
            }
        }

        console.log(`[AdInjector] ✅ Successfully rendered ${debugBoxes.length} red debug boxes out of ${slotsToRender.length} slots`);

        // If no boxes were rendered, create a test box to verify visibility
        if (debugBoxes.length === 0) {
            console.log('[AdInjector] ⚠️ No boxes rendered, creating test box...');
            try {
                const testHost = createShadowHost();
                testHost.style.cssText = `
                    all: initial;
                    display: block !important;
                    position: fixed !important;
                    top: 100px !important;
                    right: 20px !important;
                    width: 300px !important;
                    height: 250px !important;
                    z-index: 999999 !important;
                    background: transparent !important;
                `;

                const testShadow = testHost.attachShadow({ mode: 'closed' });
                const testBox = document.createElement('div');
                testBox.style.cssText = `
                    display: block !important;
                    width: 100% !important;
                    height: 100% !important;
                    border: 6px solid #ff0000 !important;
                    background: rgba(255, 0, 0, 0.2) !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                `;

                const testLabel = document.createElement('div');
                testLabel.textContent = 'TEST: Ad Injector is working!';
                testLabel.style.cssText = `
                    position: absolute !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    background: #ff0000 !important;
                    color: #ffffff !important;
                    padding: 20px !important;
                    font-size: 18px !important;
                    font-weight: 700 !important;
                    border-radius: 8px !important;
                    z-index: 1000000 !important;
                    text-align: center !important;
                `;

                testBox.appendChild(testLabel);
                testShadow.appendChild(testBox);
                document.body.appendChild(testHost);
                debugBoxes.push({ host: testHost, shadowRoot: testShadow });
                injectedRootElements.add(testHost);
                console.log('[AdInjector] ✅ Test box created in top-right corner');
            } catch (e) {
                console.error('[AdInjector] ❌ Failed to create test box:', e);
            }
        }
    }

    /**
     * Find injection slots for Instagram
     * Uses stable feed container (main) so the ad is not virtualized away on scroll.
     * @returns {Array<HTMLElement>} Array of parent elements to inject into
     */
    function findInstagramSlots() {
        const slots = [];

        const feedContainer = document.querySelector('main[role="main"]')
            || document.querySelector('main')
            || document.querySelector('[role="main"]');

        if (!feedContainer) {
            return slots;
        }

        // Check if we already have a duck container inside the feed
        if (feedContainer.querySelector('.' + DUCK_CONTAINER_CLASS)) {
            return slots;
        }

        // Find actual feed posts (articles) and insert after the first one.
        // Use the article's parent as the insertion parent so the ad sits
        // between posts in the feed list, not at the bottom of main.
        const articles = feedContainer.querySelectorAll('article');
        if (articles.length > 0) {
            const firstArticle = articles[0];
            const feedList = firstArticle.parentElement;
            if (feedList) {
                slots.push({ parent: feedList, afterElement: firstArticle, isInstagramPost: true });
                return slots;
            }
        }

        // Fallback: prepend to feed container
        slots.push({ parent: feedContainer, prepend: true, isInstagramPost: true });
        return slots;
    }

    /**
     * Find injection slots for CNN (including edition.cnn.com and other subdomains)
     * @returns {Array<HTMLElement>} Array of parent elements to inject into
     */
    function findCNNSlots() {
        const slots = [];

        // Strategy 1: Empty ad containers (now empty because blocked)
        const emptyAdContainers = Array.from(document.querySelectorAll('.ad, .ad-container, .ad-wrapper, [class*="ad-"], [id*="ad-"]'));
        for (const container of emptyAdContainers) {
            if (container.children.length === 0 && isVisible(container)) {
                const rect = container.getBoundingClientRect();
                if (rect.width >= CONFIG.MIN_AD_WIDTH && rect.height >= CONFIG.MIN_AD_HEIGHT) {
                    slots.push({ parent: container.parentElement, replaceElement: container });
                }
            }
        }

        // Strategy 2: Between paragraphs in article body (multiple selectors for cnn.com vs edition.cnn.com)
        const articleBodySelectors = [
            'article .zn-body__paragraph',
            'article p',
            '.article-body p',
            '.article__content p',
            'main p',
            '[class*="article"] p',
            '[class*="content"] p'
        ];
        let paragraphs = [];
        let paragraphParent = null;
        for (const sel of articleBodySelectors) {
            const first = document.querySelector(sel);
            if (first && first.parentElement) {
                paragraphParent = first.parentElement;
                paragraphs = Array.from(paragraphParent.querySelectorAll('p'));
                if (paragraphs.length >= 2) break;
            }
        }
        if (paragraphs.length >= 2) {
            const targetPara = paragraphs[Math.min(2, paragraphs.length - 1)];
            if (targetPara && isVisible(targetPara) && paragraphParent) {
                slots.push({ parent: paragraphParent, afterElement: targetPara });
            }
        }

        // Strategy 3: Sidebar gaps
        const sidebar = document.querySelector('.zn-body__read-all, aside, .sidebar, [class*="sidebar"]');
        if (sidebar && isVisible(sidebar)) {
            const rect = sidebar.getBoundingClientRect();
            if (rect.width >= CONFIG.MIN_AD_WIDTH) {
                slots.push({ parent: sidebar, prepend: true });
            }
        }

        // Strategy 4: After first substantial block in main/article (for edition.cnn.com and sparse layouts)
        if (slots.length === 0) {
            const mainOrArticle = document.querySelector('main, article, [role="main"]');
            if (mainOrArticle && isVisible(mainOrArticle)) {
                const children = Array.from(mainOrArticle.querySelectorAll('p, div[class*="content"], div[class*="body"], .paragraph'));
                const firstBlock = children.find(el => isVisible(el) && el.getBoundingClientRect().height > 50);
                if (firstBlock && firstBlock.parentElement) {
                    slots.push({ parent: firstBlock.parentElement, afterElement: firstBlock });
                }
            }
        }

        return slots;
    }

    /**
     * CNN header banner fallback: insert a full-width banner below the navigation bar.
     * Used when findCNNSlots and findContentFlowSlots both return 0.
     * CNN page structure: [top ad area] -> [header/nav] -> [ticker bar] -> [main content]
     * @returns {Array} Array with 0 or 1 slot objects
     */
    function findCNNHeaderSlot() {
        // Try to find the header/nav element
        const header = document.querySelector('header')
            || document.querySelector('nav')
            || document.querySelector('[class*="header"]');
        if (header && header.parentElement) {
            console.log('[AdInjector] CNN header fallback: inserting after header/nav');
            return [{ parent: header.parentElement, afterElement: header, isHeaderBanner: true }];
        }

        // Fallback: prepend to main content area
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main) {
            console.log('[AdInjector] CNN header fallback: prepending to main');
            return [{ parent: main, prepend: true, isHeaderBanner: true }];
        }

        // Last resort: prepend to body
        console.log('[AdInjector] CNN header fallback: prepending to body');
        return [{ parent: document.body, prepend: true, isHeaderBanner: true }];
    }

    /**
     * Content-flow slots: find main content container and insert after every N blocks (e.g. after 2nd and 5th).
     * Does not rely on server-side ad placeholders; places ads in natural reading flow.
     * @returns {Array} Slot objects with parent and afterElement
     */
    function findContentFlowSlots() {
        const slots = [];
        const insertAfterIndices = (CONFIG.CONTENT_FLOW_INSERT_AFTER_INDICES && Array.isArray(CONFIG.CONTENT_FLOW_INSERT_AFTER_INDICES))
            ? CONFIG.CONTENT_FLOW_INSERT_AFTER_INDICES
            : [2, 5];
        const maxSlots = typeof CONFIG.MAX_CONTENT_FLOW_SLOTS === 'number' ? CONFIG.MAX_CONTENT_FLOW_SLOTS : CONFIG.MAX_ADS_PER_PAGE;

        let mainContainer = document.querySelector('main') || document.querySelector('article') || document.querySelector('[role="main"]');
        if (!mainContainer || !isVisible(mainContainer) || hasOverflowHidden(mainContainer)) {
            mainContainer = null;
        }
        if (!mainContainer) {
            const withParagraphs = document.querySelectorAll('div');
            for (const div of withParagraphs) {
                const ps = div.querySelectorAll('p');
                if (ps.length >= 3 && isVisible(div) && !hasOverflowHidden(div)) {
                    mainContainer = div;
                    break;
                }
            }
        }
        if (!mainContainer) return slots;

        const BLOCK_TAGS = ['P', 'DIV', 'SECTION', 'ARTICLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'FIGURE', 'UL', 'OL'];
        const blocks = Array.from(mainContainer.children).filter(el => {
            if (!el || el.nodeType !== 1) return false;
            if (!BLOCK_TAGS.includes(el.tagName)) return false;
            if (!isVisible(el)) return false;
            const rect = el.getBoundingClientRect();
            return rect.height >= 20;
        });

        for (const oneBasedIndex of insertAfterIndices) {
            if (slots.length >= maxSlots) break;
            const zeroBasedIndex = oneBasedIndex - 1;
            if (zeroBasedIndex < 0 || zeroBasedIndex >= blocks.length) continue;
            const block = blocks[zeroBasedIndex];
            const parent = block.parentElement;
            if (!parent) continue;
            if (parent.querySelector && (parent.querySelector('.duck') || parent.querySelector(`[${OBFUSCATED_ATTR}]`))) continue;
            slots.push({ parent, afterElement: block });
        }
        return slots;
    }

    /**
     * Generic fallback: find safe injection slots
     * @returns {Array<HTMLElement>} Array of parent elements to inject into
     */
    function findGenericSlots() {
        const slots = [];
        const skipTags = ['NAV', 'HEADER', 'FOOTER', 'FORM', 'INPUT', 'VIDEO', 'AUDIO', 'SCRIPT', 'STYLE'];
        const skipSelectors = ['nav', 'header', 'footer', 'form', 'input', 'video', 'audio'];

        // Scan visible containers
        const allElements = document.querySelectorAll('body > *');

        for (const el of allElements) {
            // Skip certain elements
            if (skipTags.includes(el.tagName) || skipSelectors.some(sel => el.matches(sel))) {
                continue;
            }

            // Skip fixed position elements
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
                continue;
            }

            // Skip if overflow hidden
            if (hasOverflowHidden(el)) {
                continue;
            }

            // Check if visible and has minimum size
            if (!isVisible(el)) {
                continue;
            }

            const rect = el.getBoundingClientRect();
            if (rect.width >= CONFIG.MIN_AD_WIDTH && rect.height >= CONFIG.MIN_AD_HEIGHT) {
                // Check if already has injected ad (using obfuscated attribute)
                if (el.querySelector(`[${OBFUSCATED_ATTR}]`) ||
                    el.querySelector(`.${OBFUSCATED_HOST_CLASS}`)) {
                    continue;
                }

                // Score by viewport position (prefer center)
                const viewportCenter = window.innerHeight / 2;
                const elementCenter = rect.top + rect.height / 2;
                const distanceFromCenter = Math.abs(elementCenter - viewportCenter);

                slots.push({
                    parent: el,
                    score: 1000 - distanceFromCenter, // Higher score = better
                });
            }
        }

        // Sort by score (highest first)
        slots.sort((a, b) => (b.score || 0) - (a.score || 0));

        return slots.slice(0, CONFIG.MAX_ADS_PER_PAGE);
    }

    /**
     * Filter out low-quality empty-frame slots (overlays, modals, 0×0, tiny UI elements)
     * @param {Array} slots - Slots from detectEmptyAdFrames()
     * @returns {Array} Filtered slots
     */
    function filterEmptyFrameSlots(slots) {
        const badPatterns = [
            'ad-feedback', 'modal-overlay', 'text-tracks', 'technical-issues',
            'content-container', 'submitted', 'overlay'
        ];
        const minDimension = 50; // Skip slots that are tiny in both dimensions
        return slots.filter(slot => {
            const sel = (slot.originalSelector || '') + (slot.element?.id || '') + (slot.element?.className || '');
            const isBadSelector = badPatterns.some(p => sel.toLowerCase().includes(p));
            const w = slot.rect?.width ?? 0;
            const h = slot.rect?.height ?? 0;
            const isTiny = w < minDimension && h < minDimension;
            if (isBadSelector) {
                console.log(`[AdInjector] 🚫 Skipping bad slot: ${slot.originalSelector} (${w}×${h})`);
                return false;
            }
            if (isTiny && (w === 0 || h === 0)) {
                console.log(`[AdInjector] 🚫 Skipping zero/tiny slot: ${slot.originalSelector} (${w}×${h})`);
                return false;
            }
            return true;
        });
    }

    /**
     * Find injection slots based on domain
     * CNN/Instagram: domain-specific slots only (no fallback to empty frames or generic).
     * Others: content-flow, then empty frames, then generic.
     * @returns {Array} Array of slot objects
     */
    function findInjectionSlots() {
        console.log('[AdInjector] 🔍 Scanning for ad injection slots...');

        const domain = getDomain();
        const isCNN = domain === 'cnn.com' || domain.includes('cnn.com');
        const isInstagram = domain === 'instagram.com' || domain.includes('instagram.com');

        // CNN: CNN-specific slots -> content-flow fallback -> header banner fallback
        if (isCNN) {
            const slots = findCNNSlots();
            console.log(`[AdInjector] CNN strategy found ${slots.length} slots`);
            if (slots.length > 0) {
                logSlots(slots, 'domain-specific');
                return slots;
            }
            if (CONFIG.CNN_FALLBACK_TO_CONTENT_FLOW !== false) {
                const contentFlowSlots = findContentFlowSlots();
                if (contentFlowSlots.length > 0) {
                    console.log(`[AdInjector] CNN: no CNN slots, using content-flow fallback (${contentFlowSlots.length} slots)`);
                    logSlots(contentFlowSlots, 'content-flow');
                    return contentFlowSlots;
                }
            }
            // Ultimate fallback: header banner
            if (CONFIG.CNN_HEADER_FALLBACK !== false) {
                const headerSlots = findCNNHeaderSlot();
                if (headerSlots.length > 0) {
                    console.log('[AdInjector] CNN: using header banner fallback');
                    logSlots(headerSlots, 'header-banner');
                    return headerSlots;
                }
            }
            console.log('[AdInjector] CNN: no slots found at all');
            return [];
        }

        // Instagram: only one ad slot to avoid duplicates when feed loads or script runs twice
        if (isInstagram) {
            const allSlots = findInstagramSlots();
            const slots = allSlots.slice(0, 1);
            console.log(`[AdInjector] Instagram strategy found ${allSlots.length} slots, using ${slots.length}`);
            if (slots.length > 0) {
                logSlots(slots, 'domain-specific');
                return slots;
            }
            return [];
        }

        // Content-flow first for generic sites (main content, after N blocks); then empty frames; then generic
        const contentFlowSlots = findContentFlowSlots();
        if (contentFlowSlots.length > 0) {
            console.log(`[AdInjector] ✅ Content-flow strategy found ${contentFlowSlots.length} slots`);
            logSlots(contentFlowSlots, 'content-flow');
            return contentFlowSlots;
        }

        // Empty ad frames (fallback)
        let emptyFrames = detectEmptyAdFrames();
        emptyFrames = filterEmptyFrameSlots(emptyFrames);
        if (emptyFrames.length > 0) {
            console.log(`[AdInjector] ✅ Found ${emptyFrames.length} empty ad frames (after filtering):`);
            emptyFrames.forEach((slot, index) => {
                console.log(`[AdInjector]   Slot ${index + 1}:`, {
                    reason: slot.reason,
                    size: `${Math.round(slot.rect?.width ?? 0)}×${Math.round(slot.rect?.height ?? 0)}`,
                    selector: slot.originalSelector
                });
            });
            return emptyFrames;
        }

        // Generic fallback
        const slots = findGenericSlots();
        console.log(`[AdInjector] Generic strategy found ${slots.length} slots`);
        if (slots.length > 0) logSlots(slots, 'generic');
        else console.log('[AdInjector] No slots from content-flow, empty frames, or generic');
        return slots;
    }

    function logSlots(slots, kind) {
        slots.forEach((slot, index) => {
            const rect = slot.element?.getBoundingClientRect() || slot.rect || {};
            console.log(`[AdInjector]   ${kind} Slot ${index + 1}:`, {
                size: `${Math.round(rect.width || 0)}×${Math.round(rect.height || 0)}`,
                hasParent: !!slot.parent,
                hasReplaceElement: !!slot.replaceElement,
                selector: slot.originalSelector || '(none)'
            });
        });
    }

    /**
     * Create a duck container (div.duck) at each slot position and mutate slots so parent = duck.
     * After this, injectAd will append the ad into the duck.
     * @param {Array} slots - Slot objects with parent, and optionally afterElement, replaceElement, prepend
     * @returns {Array} Same slots array (mutated)
     */
    function ensureDuckContainers(slots) {
        if (!slots || !Array.isArray(slots)) return slots;
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const parent = slot.parent;
            if (!parent || !parent.appendChild) continue;
            const duckDiv = document.createElement('div');
            duckDiv.className = DUCK_CONTAINER_CLASS;
            duckDiv.setAttribute('data-ad-slot', String(i + 1));
            duckDiv.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:0;padding:0;margin-top:1rem;margin-bottom:1rem;opacity:0;transition:opacity 0.3s ease-in;';
            // Fade in after a frame so the transition is visible
            requestAnimationFrame(() => { duckDiv.style.opacity = '1'; });
            if (slot.isHeaderBanner) {
                duckDiv.style.marginTop = '0';
                duckDiv.style.marginBottom = '0';
            }
            // Reserve space on Instagram to match post-like ad (square image + caption)
            const domain = getDomain();
            if (domain === 'instagram.com' || domain.includes('instagram.com')) {
                duckDiv.style.minHeight = 'min(100vw, 500px)';
            }
            if (slot.replaceElement && slot.replaceElement.parentNode) {
                slot.replaceElement.replaceWith(duckDiv);
            } else if (slot.prepend) {
                parent.insertBefore(duckDiv, parent.firstChild);
            } else if (slot.afterElement && slot.afterElement.parentNode) {
                slot.afterElement.after(duckDiv);
            } else {
                parent.appendChild(duckDiv);
            }
            slot.parent = duckDiv;
            slot.duckContainer = duckDiv;
            delete slot.replaceElement;
            delete slot.afterElement;
            delete slot.prepend;
        }
        return slots;
    }

    /**
     * In debug mode: log B64 status for the first ad (API base64 or GET_IMAGE result) so all ad UI paths are covered.
     * @param {object} ad - Normalized ad object
     */
    function debugLogFirstAdImage(ad) {
        const hasImageDataUrl = ad.imageDataUrl && typeof ad.imageDataUrl === 'string' && ad.imageDataUrl.trim().startsWith('data:');
        const hasImageUrl = ad.image && isImageUrl(ad.image);
        if (hasImageDataUrl) {
            console.log('[AdInjector] Debug Ad 1 image: API base64, length=', ad.imageDataUrl.length);
            return;
        }
        if (!hasImageUrl) {
            console.log('[AdInjector] Debug Ad 1 image: no image URL or base64');
            return;
        }
        chrome.runtime.sendMessage(
            { type: 'GET_IMAGE', url: ad.image },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[AdInjector] Debug Ad 1 image: GET_IMAGE error:', chrome.runtime.lastError.message);
                    return;
                }
                const hasDataUrl = response && response.dataUrl && typeof response.dataUrl === 'string';
                if (hasDataUrl) {
                    console.log('[AdInjector] Debug Ad 1 image: GET_IMAGE success, base64 length=', response.dataUrl.length);
                } else {
                    const errMsg = (response && (response.error != null && response.error !== '')) ? response.error : 'unknown';
                    console.warn('[AdInjector] Debug Ad 1 image: GET_IMAGE failed:', errMsg);
                }
            }
        );
    }

    /**
     * Create safe ad container using Shadow DOM (isolated from host styles and cosmetic filters)
     * @param {object} ad - Ad object from API
     * @param {object} [slot] - Optional slot object; if slot.isHeaderBanner, use leaderboard style
     * @returns {HTMLElement} Host element with shadow root containing ad content
     */
    function createAdContainer(ad, slot) {
        // Create shadow host with obfuscated naming
        const host = createShadowHost();

        // Use title or index as unique identifier (stored on host, not in shadow)
        const adId = ad.id || ad.title || `ad-${Date.now()}`;
        host.setAttribute(OBFUSCATED_ATTR + '-id', adId);

        // Create shadow root (closed mode for maximum isolation)
        const shadowRoot = host.attachShadow({ mode: 'closed' });

        const isHeader = slot && slot.isHeaderBanner;
        const isInstagramPost = slot && slot.isInstagramPost;
        // Create wrapper inside shadow root
        const wrapper = document.createElement('div');
        wrapper.style.cssText = isHeader
            ? `all: initial;
               display: block;
               width: 100%;
               max-width: 100%;
               margin: 0;
               padding: 0;
               font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
               overflow: hidden;
               background: #f0f0f0;
               color: #000000;
               box-sizing: border-box;
               text-align: center;
               border-bottom: 1px solid #d0d0d0;`
            : isInstagramPost
                ? `all: initial;
                   display: block;
                   width: 100%;
                   max-width: 100%;
                   margin: 0;
                   padding: 0;
                   font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                   overflow: hidden;
                   background: #262626;
                   color: #fafafa;
                   box-sizing: border-box;`
                : `all: initial;
                   display: block;
                   width: 100%;
                   max-width: 320px;
                   margin: 12px auto;
                   font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                   border-radius: 8px;
                   overflow: hidden;
                   box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                   background: #ffffff;
                   color: #000000;
                   box-sizing: border-box;`;

        // Image container: use API-supplied base64 when present, else fetch via background and convert to base64
        const hasImageDataUrl = ad.imageDataUrl && typeof ad.imageDataUrl === 'string' && ad.imageDataUrl.trim().startsWith('data:');
        const hasImageUrl = ad.image && isImageUrl(ad.image);
        if (hasImageDataUrl || hasImageUrl) {
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = isHeader
                ? `width: 100%; height: 90px; overflow: hidden; background: #e8e8e8;`
                : isInstagramPost
                    ? `width: 100%; aspect-ratio: 1; overflow: hidden; background: #1a1a1a;`
                    : `width: 100%; height: 200px; overflow: hidden; background: #f0f0f0;`;
            const img = document.createElement('img');
            img.alt = ad.title || '';
            img.loading = 'lazy';
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            img.onerror = () => {
                img.style.background = '#f0f0f0';
            };
            if (hasImageDataUrl) {
                console.log('[AdInjector] Ad image: using API base64, length=', ad.imageDataUrl.length);
                img.src = ad.imageDataUrl;
            } else {
                chrome.runtime.sendMessage(
                    { type: 'GET_IMAGE', url: ad.image },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn('[AdInjector] Ad image: GET_IMAGE error:', chrome.runtime.lastError.message);
                            return;
                        }
                        const hasDataUrl = response && response.dataUrl && typeof response.dataUrl === 'string';
                        const preview = hasDataUrl ? response.dataUrl.substring(0, 60) + (response.dataUrl.length > 60 ? '...' : '') : '(none)';
                        console.log('[AdInjector] GET_IMAGE response: hasDataUrl=', !!hasDataUrl, 'length=', hasDataUrl ? response.dataUrl.length : 0, 'preview=', preview);
                        if (hasDataUrl) {
                            console.log('[AdInjector] Ad image set from base64, length=', response.dataUrl.length);
                            img.src = response.dataUrl;
                        } else {
                            const errMsg = (response && (response.error != null && response.error !== '')) ? response.error : (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'unknown';
                            console.warn('[AdInjector] Ad image: no base64 (GET_IMAGE failed:', errMsg, '). Consider API returning dataUrl.');
                        }
                    }
                );
            }
            imageContainer.appendChild(img);
            wrapper.appendChild(imageContainer);
        }

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = isInstagramPost ? 'padding: 12px 16px;' : 'padding: 12px;';

        // Title
        if (ad.title) {
            const title = document.createElement(isInstagramPost ? 'span' : 'h3');
            title.textContent = ad.title;
            title.style.cssText = isInstagramPost
                ? 'font-size: 14px; font-weight: 600; margin: 0 4px 0 0; color: #fafafa; line-height: 1.4;'
                : 'font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #000000; line-height: 1.4;';
            contentContainer.appendChild(title);
        }

        // Description
        if (ad.description) {
            const desc = document.createElement('p');
            desc.textContent = ad.description;
            desc.style.cssText = isInstagramPost
                ? 'font-size: 14px; color: #a8a8a8; margin: 0 0 4px 0; line-height: 1.4; display: inline;'
                : 'font-size: 14px; color: #666666; margin: 0 0 12px 0; line-height: 1.5;';
            contentContainer.appendChild(desc);
        }

        // CTA Link
        if (ad.redirectUrl) {
            const link = document.createElement('a');
            link.href = ad.redirectUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = isInstagramPost ? 'Learn more' : 'Learn More';
            link.style.cssText = isInstagramPost
                ? 'color: #0095f6; text-decoration: none; font-size: 14px; margin-left: 4px;'
                : `display: inline-block;
                   padding: 8px 16px;
                   background: #0095f6;
                   color: #ffffff;
                   text-decoration: none;
                   border-radius: 4px;
                   font-size: 14px;
                   font-weight: 600;`;
            contentContainer.appendChild(link);
        }

        wrapper.appendChild(contentContainer);
        shadowRoot.appendChild(wrapper);

        // Store shadow root reference on host for later access
        host._shadowRoot = shadowRoot;

        return host;
    }

    /**
     * Inject ad into slot with layout-shift protection
     * @param {object} slot - Slot object with parent and position info
     * @param {object} ad - Ad object
     * @param {number} slotIndex - Index of this slot (allows same ad in every frame)
     * @returns {boolean} Success
     */
    function injectAd(slot, ad, slotIndex) {
        try {
            const { parent, afterElement, replaceElement, prepend } = slot;

            if (!parent) {
                return false;
            }

            // Unique id per slot so the same ad can be shown in every frame
            const slotId = (ad.id != null ? String(ad.id) : ad.title || 'ad') + '-slot-' + slotIndex;
            if (injectedAdIds.has(slotId)) {
                return false;
            }

            // Snapshot parent height before injection
            const beforeHeight = parent.scrollHeight;
            // Capture replaced element size before we replace it (for layout-shift policy)
            const replacedRect = replaceElement ? replaceElement.getBoundingClientRect() : null;

            // Create ad container
            const adContainer = createAdContainer(ad, slot);

            // Insert into DOM
            if (replaceElement) {
                replaceElement.replaceWith(adContainer);
            } else if (prepend) {
                parent.insertBefore(adContainer, parent.firstChild);
            } else if (afterElement) {
                afterElement.after(adContainer);
            } else {
                parent.appendChild(adContainer);
            }

            // Check for layout shift only when replacing an element that was already substantial.
            // Replacing a tiny/0×0 element with an ad is expected to cause large shift—don't remove in that case.
            requestAnimationFrame(() => {
                if (replaceElement && replacedRect) {
                    const area = replacedRect.width * replacedRect.height;
                    const minSide = Math.min(replacedRect.width, replacedRect.height);
                    const wasSubstantial = area >= 10000 || minSide >= 80;
                    if (wasSubstantial) {
                        const afterHeight = parent.scrollHeight;
                        const shift = Math.abs(afterHeight - beforeHeight);
                        if (shift > CONFIG.LAYOUT_SHIFT_THRESHOLD_PX) {
                            console.warn(`[AdInjector] Layout shift detected (${shift}px), removing ad`);
                            (slot.duckContainer || adContainer).remove();
                            return false;
                        }
                    }
                }

                // Success - track injected ad by slot id; track duck for cleanup so whole block is removed
                injectedAdIds.add(slotId);
                const rootForCleanup = slot.duckContainer || adContainer;
                injectedContainers.push(rootForCleanup);
                injectedRootElements.add(rootForCleanup);
                console.log(`[AdInjector] Injected ad: ${ad.title || slotId}`);
            });

            return true;
        } catch (error) {
            console.error('[AdInjector] Failed to inject ad:', error);
            return false;
        }
    }

    /**
     * Scan and inject ads or render debug boxes
     */
    function scanAndInject() {
        console.log('[AdInjector] ========================================');
        console.log('[AdInjector] 🚀 Starting scan and inject process...');
        console.log(`[AdInjector] 📊 Ads available: ${ads.length}`);
        console.log(`[AdInjector] 🔧 Debug mode: ${CONFIG.DEBUG_AD_FRAMES ? 'ON' : 'OFF'}`);
        console.log('[AdInjector] ========================================');

        // Liveness check: if we previously injected but all containers were removed from DOM, reset state
        if (injectedContainers.length > 0) {
            const alive = injectedContainers.filter(c => document.contains(c));
            if (alive.length === 0) {
                console.log('[AdInjector] All previously injected ads removed from DOM, resetting state');
                injectedContainers = [];
                injectedAdIds.clear();
                injectedRootElements.clear();
            } else {
                injectedContainers = alive;
            }
        }

        // Find slots (empty frames or domain-specific)
        const slots = findInjectionSlots();

        console.log(`[AdInjector] 📍 Total slots found: ${slots.length}`);

        // In debug mode always show something: red boxes on slots, or a test box if no slots
        if (CONFIG.DEBUG_AD_FRAMES) {
            if (slots.length > 0) {
                console.log(`[AdInjector] 🎨 DEBUG MODE: Rendering red boxes for ${slots.length} detected slots`);
                renderDebugBoxes(slots);
            } else {
                console.log('[AdInjector] ⚠️ No slots found; showing test red box so you can confirm injector is running');
                renderDebugBoxes([]); // Renders the fixed test box in top-right
            }
            if (ads.length > 0) {
                debugLogFirstAdImage(ads[0]);
            }
            console.log(`[AdInjector] ✅ Debug mode complete: ${debugBoxes.length} red box(es) should be visible`);
            return;
        }

        if (slots.length === 0) {
            const domain = getDomain();
            const isInstagram = domain === 'instagram.com' || domain.includes('instagram.com');
            if (slotRetryCount < MAX_SLOT_RETRIES) {
                const delay = SLOT_RETRY_DELAYS_MS[slotRetryCount] || 3000;
                slotRetryCount++;
                if (isInstagram) {
                    console.log(`[AdInjector] ⚠️ No slots on Instagram (feed may still load) - retry ${slotRetryCount}/${MAX_SLOT_RETRIES} in ${delay}ms`);
                } else {
                    console.log(`[AdInjector] ⚠️ No slots found - retry ${slotRetryCount}/${MAX_SLOT_RETRIES} in ${delay}ms`);
                }
                setTimeout(scanAndInject, delay);
            } else {
                console.log('[AdInjector] ⚠️ No injection slots found after max retries - nothing to display');
            }
            return;
        }

        // Normal mode: inject actual ads
        if (ads.length === 0) {
            console.log('[AdInjector] ⚠️ No ads available to inject');
            return;
        }

        // Cap slots by number of ads from API (inject at most ads.length ads)
        const slotsToUse = slots.slice(0, ads.length);
        console.log(`[AdInjector] 📦 Injecting ${slotsToUse.length} ads into ${slotsToUse.length} slots`);

        ensureDuckContainers(slotsToUse);

        let injectedCount = 0;
        for (let i = 0; i < slotsToUse.length; i++) {
            const slot = slotsToUse[i];
            const ad = ads[i];
            console.log(`[AdInjector] 💉 Injecting ad into slot ${i + 1}: "${ad.title || ad.id}"`);
            if (injectAd(slot, ad, i)) {
                injectedCount++;
            }
        }

        // Log if ads were injected; reset slot retry count for next page/rescan
        if (injectedCount > 0) {
            slotRetryCount = 0;
            logAdEvent(getDomain());
            console.log(`[AdInjector] ✅ Successfully injected ${injectedCount} ads`);
        } else {
            console.log('[AdInjector] ⚠️ No ads were successfully injected');
        }

        console.log('[AdInjector] ========================================');
    }

    /**
     * Clean up injected ads and debug boxes
     */
    function cleanup() {
        if (instagramUrlPollId) {
            clearInterval(instagramUrlPollId);
            instagramUrlPollId = null;
        }
        document.documentElement.dataset.adInjectorActive = '';
        slotRetryCount = 0;
        // Clean up injected ads
        injectedContainers.forEach(container => {
            try {
                container.remove();
            } catch (e) {
                // Ignore errors
            }
        });
        injectedContainers = [];
        injectedAdIds.clear();

        // Clean up debug boxes
        debugBoxes.forEach(box => {
            try {
                if (box.host && box.host.parentElement) {
                    box.host.parentElement.removeChild(box.host);
                }
            } catch (e) {
                // Ignore errors
            }
        });
        debugBoxes = [];
        injectedRootElements.clear();
        isInitialized = false;
    }

    /**
     * Return true if any of the mutations were caused by our injected nodes (so we skip re-scan).
     * @param {MutationRecord[]} mutations
     * @returns {boolean}
     */
    function isMutationFromUs(mutations) {
        if (injectedRootElements.size === 0) return false;
        const roots = Array.from(injectedRootElements);
        for (const m of mutations) {
            const target = m.target;
            if (target && target.nodeType === 1) {
                if (injectedRootElements.has(target)) return true;
                for (const root of roots) {
                    if (root && target.contains && target.contains(root)) return true;
                }
            }
            const checkNode = (node) => {
                if (!node || node.nodeType !== 1) return false;
                if (injectedRootElements.has(node)) return true;
                for (const root of roots) {
                    if (root && node.contains && node.contains(root)) return true;
                }
                return false;
            };
            for (const node of m.addedNodes) {
                if (checkNode(node)) return true;
            }
            for (const node of m.removedNodes) {
                if (checkNode(node)) return true;
            }
        }
        return false;
    }

    /**
     * Handle SPA navigation (URL change)
     */
    function handleSPANavigation() {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            console.log('[AdInjector] SPA navigation detected');
            currentUrl = newUrl;
            cleanup();

            // Full re-init after a delay (re-request ads and re-scan)
            setTimeout(init, 500);
        }
    }

    /**
     * Set up MutationObserver for SPA support
     */
    function setupMutationObserver() {
        if (mutationObserver) {
            mutationObserver.disconnect();
        }
        if (instagramUrlPollId) {
            clearInterval(instagramUrlPollId);
            instagramUrlPollId = null;
        }

        const domain = getDomain();
        const isInstagram = domain === 'instagram.com' || domain.includes('instagram.com');

        // Instagram: do not observe DOM at all. Scroll/virtualization triggers constant mutations
        // and causes layout/UX issues. Use a URL poll for SPA navigation instead.
        if (isInstagram) {
            instagramUrlPollId = setInterval(handleSPANavigation, 2500);
            return;
        }

        mutationObserver = new MutationObserver((mutations) => {
            // Ignore mutations we caused (our debug boxes or ad containers) to avoid re-scan loop
            if (isMutationFromUs(mutations)) return;

            // Debounce scans
            if (scanDebounceTimer) {
                clearTimeout(scanDebounceTimer);
            }

            scanDebounceTimer = setTimeout(() => {
                handleSPANavigation();

                // For CNN do not re-scan on DOM mutations (e.g. scroll); only URL change triggers re-inject
                const isCNN = domain === 'cnn.com' || domain.includes('cnn.com');
                if (isCNN) {
                    return;
                }

                // Re-scan for new content (generic sites only)
                if (ads.length > 0 && injectedContainers.length < CONFIG.MAX_ADS_PER_PAGE) {
                    scanAndInject();
                }
            }, CONFIG.SCAN_DEBOUNCE_MS);
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Initialize ad injector
     */
    async function init() {
        // Cross-context guard: prevent double injection when script runs in two JS contexts
        if (document.documentElement.dataset.adInjectorActive === '1') {
            console.log('[AdInjector] Another context already active, skipping...');
            return;
        }
        document.documentElement.dataset.adInjectorActive = '1';

        if (isInitialized) {
            console.log('[AdInjector] Already initialized, skipping...');
            return;
        }

        setTimeout(() => {
            if (!window.AD_CONFIG) {
                console.log('[AdInjector] AD_CONFIG not set – background may not have injected config.');
            }
        }, 100);

        console.log('[AdInjector] ========================================');
        console.log('[AdInjector] 🎯 Initializing Ad Injector...');
        console.log(`[AdInjector] 🌐 Domain: ${getDomain()}`);
        console.log(`[AdInjector] 🔧 Debug mode: ${CONFIG.DEBUG_AD_FRAMES ? 'ON' : 'OFF'}`);
        console.log('[AdInjector] ========================================');

        // Request ads from background (even in debug mode, we might want to show them later)
        try {
            ads = await requestAds();
        } catch (error) {
            console.error('[AdInjector] ❌ Failed to fetch ads:', error);
            ads = [];
        }
        if (ads.length === 0) {
            console.log('[AdInjector] ⚠️ No ads on first request - retrying in 2s...');
            await new Promise(r => setTimeout(r, 2000));
            try {
                ads = await requestAds();
            } catch (err) {
                console.error('[AdInjector] ❌ Retry fetch failed:', err);
            }
            if (ads.length > 0) {
                console.log('[AdInjector] ✅ Got ads on retry');
            }
        }

        // In debug mode, we can still scan and show boxes even without ads
        // In normal mode, we need ads to inject
        if (!CONFIG.DEBUG_AD_FRAMES && ads.length === 0) {
            console.log('[AdInjector] ⚠️ No ads available and debug mode is off - exiting');
            return;
        }

        // Use requestIdleCallback if available, otherwise setTimeout
        const scanFn = () => {
            scanAndInject();
            setupMutationObserver();
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(scanFn, { timeout: 2000 });
        } else {
            setTimeout(scanFn, 1000);
        }

        isInitialized = true;
        console.log('[AdInjector] ✅ Initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
        cleanup();
        setTimeout(init, 500);
    });

    console.log('[AdInjector] Content script loaded');
})();
