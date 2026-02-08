# ad-domains.js (config)

**Path:** `custom/config/ad-domains.js`

## Purpose

Single source of configuration for the custom ad and notification system. Defines `AD_CONFIG` and attaches it to `globalThis` and `window` so background scripts (ad-manager, notifications, init) and the injected content script (via ad-manager) can read it.

## What is configured

- **API_BASE_URL** – Admin dashboard base (e.g. `http://localhost:3000`). Used for ads (`/api/extension/ad-block`) and notifications.
- **SUPPORTED_DOMAINS** – List of hostnames (e.g. `['instagram.com', 'cnn.com']`) where ad injection is enabled. Static check only.
- **MAX_ADS_PER_PAGE** – Cap on number of ads injected per page.
- **CACHE_TTL_MS** – Pre-fetch reuse window for GET_ADS.
- **SCAN_DEBOUNCE_MS** – Debounce for mutation-based re-scan in the content script.
- **LAYOUT_SHIFT_THRESHOLD_PX** – Max layout shift before an injected ad is rolled back.
- **MIN_AD_WIDTH / MIN_AD_HEIGHT** – Minimum slot dimensions.
- **DEBUG_AD_FRAMES** – When `true`, content script shows red debug boxes instead of real ads. Main switch for debug mode; set `false` for production, `true` for debugging.
- **AD_KEYWORDS** – Keywords used to detect empty ad containers (class/id).
- **STANDARD_AD_SIZES** – IAB-style dimensions for slot matching.

## Where it is read

- **Background**: ad-manager.js and notifications.js read `AD_CONFIG` at load time (from `globalThis` or `window`). For injection, ad-manager passes a copy to the tab as `window.AD_CONFIG` so the content script sees the same config.
- **Content**: ad-injector.js uses `window.AD_CONFIG` (injected before the script runs). It should prefer this over its own inline defaults so `DEBUG_AD_FRAMES` and other options are controlled from one place (ad-domains.js).

## Build

This file is copied into the platform build by `build-scripts/inject-custom.js`. Ensure load order in the extension background places ad-domains before ad-manager so `AD_CONFIG` is set when ad-manager runs.
