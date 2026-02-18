# ad-manager.js (background)

Path: `custom/background/ad-manager.js`

## Purpose

- Check if the current tab domain is supported for ad injection (static list).
- Fetch ads from the admin API; optionally pre-fetch before content script runs.
- Inject the content script (ad-injector.js) and `window.AD_CONFIG` into supported tabs when the page has finished loading.
- Handle messages: GET_ADS, LOG_AD_EVENT.

## Config

Reads AD_CONFIG from globalThis or window (set by config.js). Uses fallback defaults if not set.

## Domain check

- getHostname(url) normalizes to hostname without www.
- isSupportedDomain(hostname) is true if in CONFIG.SUPPORTED_DOMAINS or a subdomain.
- **Autofetch on domains event**: When the live SSE emits a `domains` event (admin changed platforms), notifications.js calls fetchTargetDomains() to refresh SUPPORTED_DOMAINS from `GET /api/extension/domains`.

## Fetching ads

fetchAds(domain) POSTs to CONFIG.API_BASE_URL/api/extension/ad-block with visitorId, domain. On tab complete, if supported: fetch ads then inject content script.

## Content script injection

doInject(tabId): (1) set window.AD_CONFIG = config, (2) executeScript with files: /js/scripting/ad-injector.js.

## Message handling

- GET_ADS: fetchAds(domain) and send ads. Returns true when async.
- LOG_AD_EVENT: logAdEvent(domain). Returns false.

## Exports

adManagerModule on globalThis and window: initAdManager, fetchAds, logAdEvent, getVisitorId.
