# ad-injector.js (content script)

**Path:** custom/content/ad-injector.js

## Purpose

Runs on supported web pages. Requests ads from the background and injects HTML ads directly into document.body. Supports popup modal or inline injection.

## How it works

### Ads request

- requestAds() sends GET_ADS with current domain; receives ads; normalizes each ad with normalizeAd() (html, htmlCode, displayAs, type). Retries once after 600 ms if first response has no ads.

### Injection

- showHtmlAdModal(ads): For popup HTML ads (displayAs/type === 'popup'), shows modal iframe.
- injectHtmlAdIntoBody(ads): For inline HTML ads, appends wrapper divs to body.

### Scan and lifecycle

- scanAndInject(): HTML ads path: popup first, then inline. cleanup() removes all injected containers. MutationObserver for SPA navigation and re-scan (debounced); skips mutations from our own nodes.

## API requirements

Ads must include `html` or `htmlCode` for injection. Ads without HTML are ignored.

## Placement

HTML ads are appended as wrapper divs to document.body or shown in a modal (popup).
