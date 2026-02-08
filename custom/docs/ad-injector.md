# ad-injector.js (content script)

**Path:** custom/content/ad-injector.js

## Purpose

Runs on supported web pages. Requests ads from the background, finds injection slots (empty ad-like containers, domain-specific areas, or generic fallbacks), and either renders red debug boxes (when DEBUG_AD_FRAMES is true) or injects real ad cards into those slots using Shadow DOM.

## How it works

### Config

Reads window.AD_CONFIG (injected by the background). Falls back to inline defaults. Single source of truth for debug mode should be injected config from ad-domains.js; fallback to true only when AD_CONFIG is missing.

### Ads request

- requestAds() sends GET_ADS with current domain; receives ads; normalizes each ad with normalizeAd() (dataUrl, imageData, image, imageUrl). Retries once after 600 ms if first response has no ads.

### Slot detection

- findInjectionSlots(): (1) Domain-specific: CNN or Instagram via findCNNSlots/findInstagramSlots (feed items, articles, sidebars). (2) Empty ad frames: detectEmptyAdFrames then filterEmptyFrameSlots (ad keywords, common selectors, hidden-by-blocker, iframes). (3) Generic: findGenericSlots scans body children, skips nav/header/footer/fixed, scores by distance from viewport center. Slots are objects like parent, afterElement, replaceElement, prepend, rect, reason.

### Creating the ad container

- createAdContainer(ad): Shadow host (obfuscated class/attr), closed shadow root, wrapper div with card styling. Image: if ad has imageDataUrl (API base64), sets img.src to it; else sends GET_IMAGE and sets img.src to response.dataUrl in callback. Title, description, CTA link from ad.

### Injection

- injectAd(slot, ad, slotIndex): Inserts container via replaceElement.replaceWith, or insertBefore firstChild, or afterElement.after, or appendChild. Tracks injected IDs and containers; layout-shift check when replacing; may remove ad if shift exceeds threshold.

### Debug mode

- When CONFIG.DEBUG_AD_FRAMES is true, scanAndInject only runs slot detection and renderDebugBoxes(slots) (red bordered boxes with slot index and size). No real ads. If no slots, a fixed test box is rendered.

### Scan and lifecycle

- scanAndInject(): Gets slots; then either debug boxes or injects up to MAX_ADS_PER_PAGE ads (same ad per slot). cleanup() removes all injected containers and debug boxes. MutationObserver for SPA navigation and re-scan; skips mutations from our own nodes.

## Image handling (base64)

- API base64: dataUrl/imageData or image as data URL in normalizeAd becomes ad.imageDataUrl; used directly. No network from page.
- URL path: Content sends GET_IMAGE with ad.image; background returns dataUrl or error. Content sets img.src or logs failure. GET_IMAGE can fail due to CORS or opaque responses (see ad-manager.md). Prefer API returning base64.

## Placement (current vs planned)

Current: Replaces existing elements (empty ad containers, blocked iframes) or inserts after domain-specific nodes. Host uses obfuscated class/attr, not a stable duck class. Planned (MEMORY.md Stage 3): New divs with class duck and generic integrator that injects into these containers.
