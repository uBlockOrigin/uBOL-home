// Ad Injector Content Script
// Runs in web page context, finds safe injection points and renders ads

(function () {
    'use strict';
    console.log('[AdInjector] Script file loaded');

    // Get config from global (set by ad-domains.js via background). Single source of truth for DEBUG_AD_FRAMES is injected AD_CONFIG; fallback to true only when AD_CONFIG is missing.
    const CONFIG = (typeof window !== 'undefined' && window.AD_CONFIG) ||
        { MAX_ADS_PER_PAGE: 2, SCAN_DEBOUNCE_MS: 1000, LAYOUT_SHIFT_THRESHOLD_PX: 50, DEBUG_AD_FRAMES: true };

    const MIN_AD_WIDTH = 300;
    const MIN_AD_HEIGHT = 250;

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
    let instagramUrlPollId = null; // SPA URL check when we skip mutation observer on Instagram

    const MAX_SLOT_RETRIES = 3;
    const SLOT_RETRY_DELAYS_MS = [1500, 3500, 6000];
    let slotRetryCount = 0;
    let popupDismissedByUser = false; // Do not re-show popup after user closes it

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
     * Normalize ad: image URL or API-supplied base64 data URL; or HTML content for direct injection
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
     * @param {Array} slots - Array of slot objects from findInjectionSlots()
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
                    actualRect = { width: elRect.width, height: Math.max(elRect.height, MIN_AD_HEIGHT) };
                }
                if (!actualRect && replaceElement && replaceElement.getBoundingClientRect) {
                    actualRect = replaceElement.getBoundingClientRect();
                }
                const safeRect = actualRect || { width: MIN_AD_WIDTH, height: MIN_AD_HEIGHT };
                const width = Math.max(safeRect.width || MIN_AD_WIDTH, MIN_AD_WIDTH);
                const height = Math.max(safeRect.height || MIN_AD_HEIGHT, MIN_AD_HEIGHT);

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
     * Find injection slots based on domain.
     * Instagram only: uses findInstagramSlots. Other domains return empty.
     * @returns {Array} Array of slot objects
     */
    function findInjectionSlots() {
        console.log('[AdInjector] 🔍 Scanning for ad injection slots...');

        const domain = getDomain();
        const isInstagram = domain === 'instagram.com' || domain.includes('instagram.com');

        if (isInstagram) {
            const allSlots = findInstagramSlots();
            const slots = allSlots.slice(0, 1);
            console.log(`[AdInjector] Instagram strategy found ${allSlots.length} slots, using ${slots.length}`);
            if (slots.length > 0) {
                logSlots(slots, 'domain-specific');
                return slots;
            }
        }

        return [];
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
     * Show API-supplied HTML in a popup modal via iframe. When displayAs is 'popup', the HTML is
     * placed inside an iframe so any positioning (relative/fixed to body/html) is scoped to the
     * iframe's document, not the main page.
     * @param {Array} ads - Normalized ad objects; uses first ad that has .html
     * @returns {boolean} true if popup was shown
     */
    function showHtmlAdModal(ads) {
        const withHtml = ads.filter(a => a.html && typeof a.html === 'string' && a.html.trim().length > 0);
        if (withHtml.length === 0) return false;
        const adHtml = withHtml[0].html.trim();
        // Wrap in full document so body/html exist; ad's position:relative/fixed will be relative to iframe
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${adHtml}</body></html>`;
        const popup = document.createElement('div');
        popup.setAttribute(OBFUSCATED_ATTR, 'true');
        popup.className = OBFUSCATED_HOST_CLASS;
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
            padding: 20px;
            box-sizing: border-box;
            background: rgba(0,0,0,0.35);
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
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            box-sizing: border-box;
            padding: 40px 16px 16px 16px;
        `;
        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.style.cssText = `
            display: block;
            width: 100%;
            height: calc(100% - 48px);
            min-height: 200px;
            border: none;
            border-radius: 4px;
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
        console.log('[AdInjector] HTML ad popup shown (iframe, content isolated in modal)');
        return true;
    }

    /**
     * Inject API-supplied HTML ads directly into body (non-popup / simple ads).
     * Expects ads with ad.html and displayAs/type !== 'popup'.
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
            const html = ad.html.trim();
            const wrapper = document.createElement('div');
            wrapper.setAttribute(OBFUSCATED_ATTR, 'true');
            wrapper.className = OBFUSCATED_HOST_CLASS;
            wrapper.innerHTML = html;
            document.body.appendChild(wrapper);
            injectedContainers.push(wrapper);
            injectedRootElements.add(wrapper);
        }
        console.log(`[AdInjector] Injected ${inlineAds.length} HTML ad(s) into body`);
        return true;
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
     * @param {object} [slot] - Optional slot object; if slot.isInstagramPost, use Instagram style
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

        const isInstagramPost = slot && slot.isInstagramPost;
        // Create wrapper inside shadow root
        const wrapper = document.createElement('div');
        wrapper.style.cssText = isInstagramPost
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
            imageContainer.style.cssText = isInstagramPost
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

        // HTML-from-API path: popup -> modal; simple/inline -> inject into body
        const adsWithHtml = ads.filter(a => a.html && typeof a.html === 'string' && a.html.trim().length > 0);
        const popupAds = adsWithHtml.filter(a => a.displayAs === 'popup' || a.type === 'popup');
        const inlineAds = adsWithHtml.filter(a => a.displayAs !== 'popup' && a.type !== 'popup');
        if (popupAds.length > 0 || inlineAds.length > 0) {
            let shown = false;
            if (popupAds.length > 0 && !popupDismissedByUser && showHtmlAdModal(popupAds)) {
                shown = true;
                console.log('[AdInjector] ✅ HTML ad modal displayed (popup)');
            }
            if (inlineAds.length > 0 && injectHtmlAdIntoBody(inlineAds)) {
                shown = true;
                console.log('[AdInjector] ✅ HTML ad(s) injected into body');
            }
            if (shown) {
                logAdEvent(getDomain());
            }
            console.log('[AdInjector] ========================================');
            return;
        }

        // Find slots (empty frames or domain-specific) for card-style ads
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
