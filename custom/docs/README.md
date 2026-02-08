# Custom modules documentation

This folder documents the uBOL-home custom ad-injection and notification system. All custom code lives under `custom/`. The build script copies it into platform builds (see `build-scripts/inject-custom.js`).

## Index

- **ad-manager.md** – Background: domain check, fetch ads, inject content script, GET_IMAGE (URL to base64).
- **ad-injector.md** – Content script: slot detection, createAdContainer, injectAd, debug boxes.
- **init.md** – Background init: load order, identity then notifications then ad-manager.
- **notifications.md** – Notifications API, SSE, visitorId, showNotification.
- **identity.md** – Hardware ID, storage, SHA-512, getHashedHardwareId.
- **ad-domains.md** – AD_CONFIG: API_BASE_URL, SUPPORTED_DOMAINS, DEBUG_AD_FRAMES, etc.
- **CONFIG_TEMPLATE.md** – API setup and testing; full doc in `../background/CONFIG_TEMPLATE.md`.
- **MEMORY.md** – Multi-stage task: B64, duck containers, generic integrator.

## Data flow

- **Config**: ad-domains.js sets `globalThis.AD_CONFIG`. Ad-manager injects `window.AD_CONFIG` into the tab before the content script.
- **Ads**: Background fetches ads from the API (POST with visitorId, domain). Content script sends GET_ADS and receives the list (or pre-fetched ads).
- **Images**: Content uses API-supplied base64 (dataUrl/imageData) or sends GET_IMAGE; background returns dataUrl. Prefer API base64 to avoid CORS/CSP issues.
