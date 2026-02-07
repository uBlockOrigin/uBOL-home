// Ad Injector Content Script
// Runs in web page context, finds safe injection points and renders ads

(function () {
    'use strict';

    // Get config from global (set by ad-domains.js via background)
    const CONFIG = (typeof window !== 'undefined' && window.AD_CONFIG) ||
                   {
                       MAX_ADS_PER_PAGE: 2,
                       SCAN_DEBOUNCE_MS: 1000,
                       LAYOUT_SHIFT_THRESHOLD_PX: 50,
                       MIN_AD_WIDTH: 300,
                       MIN_AD_HEIGHT: 250,
                   };

    // State
    let ads = [];
    let injectedAdIds = new Set();
    let injectedContainers = [];
    let mutationObserver = null;
    let scanDebounceTimer = null;
    let currentUrl = window.location.href;
    let isInitialized = false;

    /**
     * Get current domain
     * @returns {string}
     */
    function getDomain() {
        return window.location.hostname.replace(/^www\./, '');
    }

    /**
     * Request ads from background script
     * @returns {Promise<Array>}
     */
    async function requestAds() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: 'GET_ADS', domain: getDomain() },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[AdInjector] Message error:', chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    if (response && response.ads) {
                        resolve(response.ads);
                    } else {
                        resolve([]);
                    }
                }
            );
        });
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
     * Find injection slots for Instagram
     * @returns {Array<HTMLElement>} Array of parent elements to inject into
     */
    function findInstagramSlots() {
        const slots = [];
        
        // Instagram feed: look for article elements in main feed
        // Selector: main[role="main"] article (or similar)
        const feedContainer = document.querySelector('main[role="main"]') || 
                             document.querySelector('main') ||
                             document.querySelector('[role="main"]');
        
        if (!feedContainer) {
            return slots;
        }

        // Find all feed items (articles)
        const feedItems = Array.from(feedContainer.querySelectorAll('article'));
        
        if (feedItems.length === 0) {
            return slots;
        }

        // Insert ads after every Nth item (e.g., after 3rd and 7th)
        const insertPositions = [3, 7];
        
        for (const pos of insertPositions) {
            if (pos < feedItems.length) {
                const item = feedItems[pos - 1]; // 0-indexed
                const parent = item.parentElement;
                if (parent && isVisible(parent) && !hasOverflowHidden(parent)) {
                    slots.push({ parent, afterElement: item });
                }
            }
        }

        return slots;
    }

    /**
     * Find injection slots for CNN
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

        // Strategy 2: Between paragraphs in article body
        const articleBody = document.querySelector('article .zn-body__paragraph, article p, .article-body p');
        if (articleBody) {
            const paragraphs = Array.from(articleBody.parentElement.querySelectorAll('p'));
            if (paragraphs.length >= 3) {
                // Insert after 3rd paragraph
                const targetPara = paragraphs[2];
                if (targetPara && isVisible(targetPara)) {
                    slots.push({ parent: targetPara.parentElement, afterElement: targetPara });
                }
            }
        }

        // Strategy 3: Sidebar gaps
        const sidebar = document.querySelector('.zn-body__read-all, aside, .sidebar');
        if (sidebar && isVisible(sidebar)) {
            const rect = sidebar.getBoundingClientRect();
            if (rect.width >= CONFIG.MIN_AD_WIDTH) {
                slots.push({ parent: sidebar, prepend: true });
            }
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
                // Check if already has injected ad
                if (el.querySelector('[data-custom-ad]')) {
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
     * Find injection slots based on domain
     * @returns {Array} Array of slot objects
     */
    function findInjectionSlots() {
        const domain = getDomain();
        
        if (domain === 'instagram.com' || domain.includes('instagram.com')) {
            return findInstagramSlots();
        } else if (domain === 'cnn.com' || domain.includes('cnn.com')) {
            return findCNNSlots();
        } else {
            return findGenericSlots();
        }
    }

    /**
     * Create safe ad container (isolated from host styles)
     * @param {object} ad - Ad object from API
     * @returns {HTMLElement}
     */
    function createAdContainer(ad) {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-custom-ad', 'true');
        wrapper.setAttribute('data-custom-ad-id', ad.id);
        
        // Reset all styles and apply our own
        wrapper.style.cssText = `
            all: initial;
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
            box-sizing: border-box;
        `;

        // Sponsored label
        const sponsoredLabel = document.createElement('div');
        sponsoredLabel.textContent = 'Sponsored';
        sponsoredLabel.style.cssText = `
            font-size: 11px;
            color: #8e8e8e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 12px 4px;
            font-weight: 600;
        `;
        wrapper.appendChild(sponsoredLabel);

        // Image container
        if (ad.imageUrl) {
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = `
                width: 100%;
                height: 200px;
                overflow: hidden;
                background: #f0f0f0;
            `;
            const img = document.createElement('img');
            img.src = ad.imageUrl;
            img.alt = ad.name || 'Ad';
            img.loading = 'lazy';
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            imageContainer.appendChild(img);
            wrapper.appendChild(imageContainer);
        }

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            padding: 12px;
        `;

        // Title
        if (ad.name) {
            const title = document.createElement('h3');
            title.textContent = ad.name;
            title.style.cssText = `
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #000000;
                line-height: 1.4;
            `;
            contentContainer.appendChild(title);
        }

        // Description
        if (ad.description) {
            const desc = document.createElement('p');
            desc.textContent = ad.description;
            desc.style.cssText = `
                font-size: 14px;
                color: #666666;
                margin: 0 0 12px 0;
                line-height: 1.5;
            `;
            contentContainer.appendChild(desc);
        }

        // CTA Link
        if (ad.targetUrl) {
            const link = document.createElement('a');
            link.href = ad.targetUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Learn More';
            link.style.cssText = `
                display: inline-block;
                padding: 8px 16px;
                background: #0095f6;
                color: #ffffff;
                text-decoration: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
            `;
            contentContainer.appendChild(link);
        }

        wrapper.appendChild(contentContainer);

        return wrapper;
    }

    /**
     * Inject ad into slot with layout-shift protection
     * @param {object} slot - Slot object with parent and position info
     * @param {object} ad - Ad object
     * @returns {boolean} Success
     */
    function injectAd(slot, ad) {
        try {
            const { parent, afterElement, replaceElement, prepend } = slot;
            
            if (!parent) {
                return false;
            }

            // Skip if ad already injected
            if (injectedAdIds.has(ad.id)) {
                return false;
            }

            // Snapshot parent height before injection
            const beforeHeight = parent.scrollHeight;

            // Create ad container
            const adContainer = createAdContainer(ad);

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

            // Check for layout shift
            requestAnimationFrame(() => {
                const afterHeight = parent.scrollHeight;
                const shift = Math.abs(afterHeight - beforeHeight);

                if (shift > CONFIG.LAYOUT_SHIFT_THRESHOLD_PX) {
                    console.warn(`[AdInjector] Layout shift detected (${shift}px), removing ad`);
                    adContainer.remove();
                    return false;
                }

                // Success - track injected ad
                injectedAdIds.add(ad.id);
                injectedContainers.push(adContainer);
                console.log(`[AdInjector] Injected ad: ${ad.name || ad.id}`);
            });

            return true;
        } catch (error) {
            console.error('[AdInjector] Failed to inject ad:', error);
            return false;
        }
    }

    /**
     * Scan and inject ads
     */
    function scanAndInject() {
        if (ads.length === 0) {
            return;
        }

        // Limit number of ads
        const adsToInject = ads.slice(0, CONFIG.MAX_ADS_PER_PAGE);
        
        // Find slots
        const slots = findInjectionSlots();
        
        if (slots.length === 0) {
            console.log('[AdInjector] No injection slots found');
            return;
        }

        // Inject ads into available slots
        let injectedCount = 0;
        for (let i = 0; i < Math.min(slots.length, adsToInject.length); i++) {
            const slot = slots[i];
            const ad = adsToInject[i];
            
            if (injectAd(slot, ad)) {
                injectedCount++;
            }
        }

        // Log if ads were injected
        if (injectedCount > 0) {
            logAdEvent(getDomain());
        }
    }

    /**
     * Clean up injected ads
     */
    function cleanup() {
        injectedContainers.forEach(container => {
            try {
                container.remove();
            } catch (e) {
                // Ignore errors
            }
        });
        injectedContainers = [];
        injectedAdIds.clear();
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
            
            // Re-scan after a delay
            setTimeout(() => {
                scanAndInject();
            }, 500);
        }
    }

    /**
     * Set up MutationObserver for SPA support
     */
    function setupMutationObserver() {
        if (mutationObserver) {
            mutationObserver.disconnect();
        }

        mutationObserver = new MutationObserver(() => {
            // Debounce scans
            if (scanDebounceTimer) {
                clearTimeout(scanDebounceTimer);
            }

            scanDebounceTimer = setTimeout(() => {
                handleSPANavigation();
                
                // Re-scan for new content
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
        if (isInitialized) {
            return;
        }

        console.log('[AdInjector] Initializing...');

        // Request ads from background
        try {
            ads = await requestAds();
            console.log(`[AdInjector] Received ${ads.length} ads`);

            if (ads.length === 0) {
                console.log('[AdInjector] No ads available');
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
        } catch (error) {
            console.error('[AdInjector] Initialization error:', error);
        }
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
