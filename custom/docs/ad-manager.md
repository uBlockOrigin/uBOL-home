# ad-manager.js (background)

Path: `custom/background/ad-manager.js`

## Purpose

- Check if the current tab domain is supported for ad injection (static list).
- Fetch ads from the admin API; optionally pre-fetch before content script runs.
- Inject the content script (ad-injector.js) and `window.AD_CONFIG` into supported tabs when the page has finished loading.
- Handle messages: GET_ADS, LOG_AD_EVENT, GET_IMAGE (URL to base64).

## Config

Reads AD_CONFIG from globalThis or window (set by ad-domains.js). Uses fallback defaults if not set.

## Domain check

- getHostname(url) normalizes to hostname without www.
- isSupportedDomain(hostname) is true if in CONFIG.SUPPORTED_DOMAINS or a subdomain.

## Fetching ads

fetchAds(domain) POSTs to CONFIG.API_BASE_URL/api/extension/ad-block with visitorId, domain, requestType: 'ad'. Stores result in preFetchedAds. On tab complete, if supported: pre-fetch ads then inject content script. lastInjectedUrl prevents duplicate inject per URL.

## Content script injection

doInject(tabId): (1) set window.AD_CONFIG = config, (2) executeScript with files: /js/scripting/ad-injector.js.

## Message handling

- GET_ADS: Return recent pre-fetch or fetchAds(domain) and send ads. Returns true when async.
- LOG_AD_EVENT: logAdEvent(domain). Returns false.
- GET_IMAGE: Fetch url, convert to base64 data URL, send dataUrl or error. Returns true.

## GET_IMAGE flow

1. fetch(url, mode: 'cors') then res.blob() then FileReader.readAsDataURL then sendResponse({ dataUrl }).
2. On failure (e.g. CORS): fetch(url) then same blob to dataURL then send.
3. On fallback failure: sendResponse({ error: message }).

Why base64 can fail: CORS (no Access-Control-Allow-Origin); fallback fetch can yield opaque response and invalid data URL; non-2xx (toBase64 throws). Prefer API returning base64 (dataUrl/imageData). See MEMORY.md Stage 2.

## Exports

adManagerModule on globalThis and window: initAdManager, fetchAds, logAdEvent, getVisitorId.
