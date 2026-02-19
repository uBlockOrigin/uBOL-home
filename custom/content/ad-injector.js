// Ad Injector Content Script
// Runs in web page context, injects HTML ads into body (popup modal or inline)

(function () {
    'use strict';

    // Suppress "Extension context invalidated" in console when extension is reloaded while tab is open
    const prevOnError = typeof window !== 'undefined' ? window.onerror : null;
    if (typeof window !== 'undefined') {
        window.onerror = function (msg) {
            if (msg && String(msg).includes('Extension context invalidated')) return true;
            return prevOnError ? prevOnError.apply(this, arguments) : false;
        };
    }

    // State
    let ads = [];
    let injectedContainers = [];
    const injectedRootElements = new Set(); // Root elements we injected (to ignore our own mutations)
    let mutationObserver = null;
    let scanDebounceTimer = null;
    let currentUrl = window.location.href;
    let isInitialized = false;

    const SCAN_DEBOUNCE_MS = 1000; // Debounce for mutation observer; SPAs like Gmail trigger many mutations
    const REINIT_COOLDOWN_MS = 3000; // Prevent rapid re-init from SPA navigation
    let lastInitTime = 0;
    let popupDismissedByUser = false; // Do not re-show popup after user closes it

    const DEBUG = !!(typeof window !== 'undefined' && (window.AD_DEBUG || (window.AD_CONFIG && window.AD_CONFIG.DEBUG)));
    function debugLog(...args) { if (DEBUG) console.log('[AdInjector]', ...args); }

    // Generate obfuscated attribute name once per page load
    const OBFUSCATED_ATTR = '_x' + Math.random().toString(36).substr(2, 5);
    const OBFUSCATED_HOST_CLASS = '_h' + Math.random().toString(36).substr(2, 5);

    /**
     * Get current domain
     * @returns {string}
     */
    function getDomain() {
        return window.location.hostname.replace(/^www\./, '');
    }

    /**
     * Rewrite ad-like class/id names to avoid uBOL cosmetic filter conflicts.
     * @param {string} html - Raw HTML from API
     * @returns {string} Sanitized HTML
     */
    function sanitizeAdLikeSelectors(html) {
        if (!html || typeof html !== 'string') return html;
        const div = document.createElement('div');
        div.innerHTML = html;
        const classMap = {
            ad: 'aw-c', ads: 'aw-s', advertisement: 'aw-v', 'ad-container': 'aw-cn',
            'ad-wrapper': 'aw-w', 'ad-block': 'aw-b', banner: 'aw-bn', 'banner-ad': 'aw-ba',
            bannerad: 'aw-bd', sponsored: 'aw-sp', promo: 'aw-pr', promotion: 'aw-pm'
        };
        const adLikeIds = new Set(['ad', 'ads', 'advertisement', 'banner', 'ad-container', 'ad-wrapper']);
        function walk(el) {
            if (el.nodeType !== 1) return;
            if (el.className && typeof el.className === 'string') {
                el.className = el.className.split(/\s+/).map(c => classMap[c] || c).join(' ');
            }
            if (el.id && adLikeIds.has(el.id)) {
                el.id = 'aw-' + el.id.replace(/[^a-z0-9]/gi, '');
            }
            for (let i = 0; i < el.children.length; i++) walk(el.children[i]);
        }
        walk(div);
        return div.innerHTML;
    }

    /**
     * Normalize ad: HTML content for direct injection
     * API may send image/imageUrl, dataUrl/imageData, or html (string) with optional type (e.g. 'popup')
     * @param {object} ad
     * @returns {object}
     */
    function normalizeAd(ad) {
        const a = { ...ad };
        if (a.html != null && typeof a.html !== 'string') {
            a.html = String(a.html);
        }
        if (a.type != null && typeof a.type !== 'string') {
            a.type = String(a.type);
        }
        // Map API fields: htmlCode -> html, displayAs -> type
        if ((a.html == null || a.html === '') && a.htmlCode != null && typeof a.htmlCode === 'string') {
            a.html = a.htmlCode.trim();
        }
        if (a.displayAs != null && typeof a.displayAs === 'string') {
            a.type = a.displayAs;
        }
        // Build HTML from image/imageUrl when html is missing (image-only ads from API)
        const hasHtml = a.html && typeof a.html === 'string' && a.html.trim().length > 0;
        if (!hasHtml) {
            const imageUrl = a.dataUrl || a.imageDataUrl || a.imageUrl || a.image_url || a.image;
            const imgSrc = (imageUrl && typeof imageUrl === 'string' && (imageUrl.startsWith('data:') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) ? imageUrl : null;
            const redirectUrl = a.redirectUrl || a.redirect_url || '#';
            if (imgSrc) {
                const href = (redirectUrl && typeof redirectUrl === 'string' && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://') || redirectUrl === '#')) ? redirectUrl : '#';
                const safeHref = href.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeImgSrc = imgSrc.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                a.html = `<a href="${safeHref}" target="_blank" rel="noopener"><img src="${safeImgSrc}" alt="" style="max-width:100%;height:auto;"></a>`;
                if (!a.type && !a.displayAs) a.type = 'inline';
            }
        }
        return a;
    }

    /**
     * Get chrome.runtime if available. Returns null if context invalidated (avoids uncaught throws).
     */
    function getChromeRuntime() {
        try {
            if (typeof chrome === 'undefined') return null;
            const r = chrome.runtime;
            return r && typeof r.id !== 'undefined' ? r : null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Check if extension context is still valid (e.g. extension not reloaded).
     * Double try-catch: Chrome can throw "Extension context invalidated" in ways that bypass inner catch.
     */
    function isExtensionContextValid() {
        try {
            return !!getChromeRuntime();
        } catch (_) {
            return false;
        }
    }

    /**
     * Request ads from background script (with retries to avoid race with background fetch).
     * @returns {Promise<Array>}
     */
    async function requestAds() {
        const domain = getDomain();

        function doRequest() {
            return new Promise((resolve) => {
                const r = getChromeRuntime();
                if (!r || !r.sendMessage) {
                    resolve([]);
                    return;
                }
                try {
                    r.sendMessage(
                        { type: 'GET_ADS', domain },
                        (response) => {
                            try {
                                if (response && Array.isArray(response.ads)) {
                                    resolve(response.ads.map(normalizeAd));
                                } else {
                                    resolve([]);
                                }
                            } catch (_) {
                                resolve([]);
                            }
                        }
                    );
                } catch (_) {
                    resolve([]);
                }
            });
        }

        let result = await doRequest();
        if (result.length === 0) {
            // console.log('[AdInjector] ⚠️ No ads in first response; retrying in 600ms...');
            await new Promise(r => setTimeout(r, 600));
            result = await doRequest();
            if (result.length > 0) {
                // console.log(`[AdInjector] ✅ Got ${result.length} ads on retry`);
            }
        }
        if (result.length === 0) {
            // console.log('[AdInjector] ⚠️ No ads in API response after retry');
        }
        return result;
    }

    /**
     * Log ad event to background
     * @param {string} domain
     */
    function logAdEvent(domain) {
        const r = getChromeRuntime();
        if (!r || !r.sendMessage) return;
        try {
            r.sendMessage({ type: 'LOG_AD_EVENT', domain }, function() {});
        } catch (_) {
            /* Extension context invalidated - ignore */
        }
    }

    /**
     * Show API-supplied HTML in a popup modal via iframe. When displayAs is 'popup', the HTML is
     * placed inside an iframe so any positioning (relative/fixed to body/html) is scoped to the
     * iframe's document, not the main page.
     * @param {Array} ads - Normalized ad objects; uses first ad that has .html
     * @returns {boolean} true if popup was shown
     */
    function showHtmlAdModal(ads) {
        const withHtml = ads.filter(a => a.html && typeof a.html === 'string' && a.html.trim().length > 0);
        if (withHtml.length === 0) return false;
        const adHtml = sanitizeAdLikeSelectors(withHtml[0].html.trim());
        // Wrap in full document so body/html exist; ad's position:relative/fixed will be relative to iframe
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${adHtml}</body></html>`;
        const popup = document.createElement('div');
        popup.setAttribute(OBFUSCATED_ATTR, 'true');
        popup.className = OBFUSCATED_HOST_CLASS + ' adwarden-injected';
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            box-sizing: border-box;
            background: rgba(0,0,0,0.25);
        `;
        const inner = document.createElement('div');
        inner.style.cssText = `
            position: relative;
            min-width: 50vw;
            min-height: 50vh;
            width: 50vw;
            height: 50vh;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            box-sizing: border-box;
            padding: 40px 20px 24px 20px;
            margin-bottom: 24px;
        `;
        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.style.cssText = `
            display: block;
            width: 100%;
            height: calc(100% - 48px);
            min-height: 200px;
            border: none;
            border-radius: 12px;
        `;
        iframe.srcdoc = html;
        inner.appendChild(iframe);

        function dismissPopup() {
            popupDismissedByUser = true;
            popup.remove();
            const idx = injectedContainers.indexOf(popup);
            if (idx !== -1) injectedContainers.splice(idx, 1);
            injectedRootElements.delete(popup);
        }

        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument;
                if (doc && doc.body) {
                    const observer = new MutationObserver((mutations) => {
                        if (!popup.isConnected) return;
                        for (const m of mutations) {
                            if (m.type === 'childList' && m.removedNodes.length > 0) {
                                observer.disconnect();
                                dismissPopup();
                                return;
                            }
                        }
                    });
                    observer.observe(doc.body, { childList: true, subtree: true });
                }
            } catch (_) { /* srcdoc may be opaque in some contexts */ }
        };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(0,0,0,0.1);
            border-radius: 4px;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
            z-index: 10;
        `;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissPopup();
        });
        inner.appendChild(closeBtn);
        popup.appendChild(inner);
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                dismissPopup();
            }
        });
        document.body.insertBefore(popup, document.body.firstChild);
        injectedContainers.push(popup);
        injectedRootElements.add(popup);
        // console.log('[AdInjector] HTML ad popup shown (iframe, content isolated in modal)');
        return true;
    }

    /**
     * Inject API-supplied HTML ads into body (non-popup / simple ads).
     * Uses iframe with data: URL to isolate from page's cosmetic filters (complete mode).
     * @param {Array} ads - Normalized ad objects with .html
     * @returns {boolean} true if any ad was injected
     */
    function injectHtmlAdIntoBody(ads) {
        const inlineAds = ads.filter(a =>
            a.html && typeof a.html === 'string' && a.html.trim().length > 0 &&
            (a.displayAs !== 'popup' && a.type !== 'popup')
        );
        if (inlineAds.length === 0) return false;
        for (const ad of inlineAds) {
            const html = sanitizeAdLikeSelectors(ad.html.trim());
            const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0}</style></head><body>${html}</body></html>`;
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(docHtml);
            const wrapper = document.createElement('div');
            wrapper.setAttribute(OBFUSCATED_ATTR, 'true');
            wrapper.className = OBFUSCATED_HOST_CLASS + ' adwarden-injected';
            wrapper.style.cssText = 'display:block !important;visibility:visible !important;min-height:100px;';
            const iframe = document.createElement('iframe');
            iframe.src = dataUrl;
            iframe.style.cssText = 'display:block;width:100%;min-height:100px;border:none;';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            wrapper.appendChild(iframe);
            // Insert at top of body so ad is visible above the fold
            document.body.insertBefore(wrapper, document.body.firstChild);
            injectedContainers.push(wrapper);
            injectedRootElements.add(wrapper);
        }
        return true;
    }

    /**
     * Scan and inject ads
     */
    function scanAndInject() {
        // console.log('[AdInjector] ========================================');
        // console.log('[AdInjector] 🚀 Starting scan and inject process...');
        // console.log(`[AdInjector] 📊 Ads available: ${ads.length}`);
        // console.log('[AdInjector] ========================================');

        // Liveness check: if we previously injected but all containers were removed from DOM, reset state
        if (injectedContainers.length > 0) {
            const alive = injectedContainers.filter(c => document.contains(c));
            if (alive.length === 0) {
                // console.log('[AdInjector] All previously injected ads removed from DOM, resetting state');
                injectedContainers = [];
                injectedRootElements.clear();
            } else {
                injectedContainers = alive;
            }
        }

        // HTML-from-API path: popup -> modal; inline -> inject into body
        const adsWithHtml = ads.filter(a => a.html && typeof a.html === 'string' && a.html.trim().length > 0);
        const popupAds = adsWithHtml.filter(a => a.displayAs === 'popup' || a.type === 'popup');
        let inlineAds = adsWithHtml.filter(a => a.displayAs !== 'popup' && a.type !== 'popup');
        // Fallback: if user dismissed popup, show popup ads as inline so they still see the ad
        if (inlineAds.length === 0 && popupAds.length > 0 && popupDismissedByUser) {
            inlineAds = popupAds;
        }
        debugLog('scanAndInject:', { popupAds: popupAds.length, inlineAds: inlineAds.length, popupDismissed: popupDismissedByUser });
        if (popupAds.length > 0 || inlineAds.length > 0) {
            let shown = false;
            if (popupAds.length > 0 && !popupDismissedByUser && showHtmlAdModal(popupAds)) {
                shown = true;
                debugLog('Popup modal shown');
            }
            if (inlineAds.length > 0 && injectHtmlAdIntoBody(inlineAds)) {
                shown = true;
                debugLog('Inline ad(s) injected at top of body');
            }
            if (shown) {
                logAdEvent(getDomain());
            }
            // console.log('[AdInjector] ========================================');
            return;
        }

        // No HTML ads to display
        // console.log('[AdInjector] ⚠️ No HTML ads in API response (ads must include html or htmlCode)');
        // console.log('[AdInjector] ========================================');
    }

    /**
     * Clean up injected ads
     */
    function cleanup() {
        document.documentElement.dataset.adInjectorActive = '';
        // Clean up injected ads
        injectedContainers.forEach(container => {
            try {
                container.remove();
            } catch (e) {
                // Ignore errors
            }
        });
        injectedContainers = [];
        injectedRootElements.clear();
        popupDismissedByUser = false;
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
            currentUrl = newUrl;
            cleanup();
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

        mutationObserver = new MutationObserver((mutations) => {
            // Ignore mutations we caused (our ad containers) to avoid re-scan loop
            if (isMutationFromUs(mutations)) return;

            // Debounce scans
            if (scanDebounceTimer) {
                clearTimeout(scanDebounceTimer);
            }

            scanDebounceTimer = setTimeout(() => {
                handleSPANavigation();
                if (ads.length > 0) {
                    scanAndInject();
                }
            }, SCAN_DEBOUNCE_MS);
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
        // Re-init cooldown: prevent rapid re-init when SPA does multiple navigations in quick succession
        if (lastInitTime > 0 && (Date.now() - lastInitTime) < REINIT_COOLDOWN_MS) {
            return;
        }
        lastInitTime = Date.now();

        // Cross-context guard: prevent double injection when script runs in two JS contexts
        if (document.documentElement.dataset.adInjectorActive === '1') {
            // console.log('[AdInjector] Another context already active, skipping...');
            return;
        }
        document.documentElement.dataset.adInjectorActive = '1';

        if (isInitialized) {
            // console.log('[AdInjector] Already initialized, skipping...');
            return;
        }

        setTimeout(() => {
            if (!window.AD_CONFIG) {
                // console.log('[AdInjector] AD_CONFIG not set – background may not have injected config.');
            }
        }, 100);

        // console.log('[AdInjector] ========================================');
        // console.log('[AdInjector] 🎯 Initializing Ad Injector...');
        // console.log(`[AdInjector] 🌐 Domain: ${getDomain()}`);
        // console.log('[AdInjector] ========================================');

        // Request ads from background (even in debug mode, we might want to show them later)
        if (!isExtensionContextValid()) {
            document.documentElement.dataset.adInjectorActive = '';
            return; // Extension was reloaded; user should refresh the page
        }
        try {
            ads = await requestAds();
            debugLog('Received', ads.length, 'ads');
        } catch (error) {
            debugLog('requestAds failed:', error?.message || error);
            document.documentElement.dataset.adInjectorActive = '';
            return; // Exit silently (Extension context invalidated, etc. - refresh page to fix)
        }
        if (ads.length === 0 && isExtensionContextValid()) {
            // console.log('[AdInjector] ⚠️ No ads on first request - retrying in 2s...');
            await new Promise(r => setTimeout(r, 2000));
            if (!isExtensionContextValid()) return;
            try {
                ads = await requestAds();
            } catch (err) {
                /* Exit silently on retry failure */
            }
        }

        if (ads.length === 0) {
            debugLog('No ads available - exiting');
            return;
        }

        const adsWithHtml = ads.filter(a => a.html && typeof a.html === 'string' && a.html.trim().length > 0);
        if (adsWithHtml.length === 0) {
            debugLog('No HTML ads in API response (ads must include html or htmlCode) - exiting');
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
        // console.log('[AdInjector] ✅ Initialization complete');
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

    // console.log('[AdInjector] Content script loaded');
})();
