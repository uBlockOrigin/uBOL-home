# Custom modules documentation

This folder documents the Ad Warden custom ad-injection and notification system. All custom code lives under `custom/`. The build script copies it into platform builds (see `build-scripts/inject-custom.js`).

## Index

- **ad-manager.md** – Background: domain check, fetch ads, inject content script.
- **ad-injector.md** – Content script: injectHtmlAdIntoBody, showHtmlAdModal (HTML ads only).
- **init.md** – Background init: load order, identity then notifications then ad-manager.
- **notifications.md** – Notifications API, SSE, visitorId, showNotification.
- **identity.md** – Hardware ID, storage, SHA-512, getHashedHardwareId.
- **config.md** – AD_CONFIG: API_BASE_URL, SUPPORTED_DOMAINS, MAX_ADS_PER_PAGE.
- **config-setup.md** – API setup, testing checklist, environment URLs.
- **MEMORY.md** – Multi-stage task: B64, duck containers, generic integrator.

## Data flow

- **Config**: config.js sets `globalThis.AD_CONFIG`. Ad-manager injects `window.AD_CONFIG` into the tab before the content script.
- **Ads**: Background fetches ads from the API (POST with visitorId, domain). Content script sends GET_ADS and receives the list.
- **HTML ads**: API returns html/htmlCode; content injects directly (popup or inline).
