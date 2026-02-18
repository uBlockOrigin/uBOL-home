# config.js

**Path:** `custom/config/config.js`

## Purpose

Single source of configuration for the custom ad and notification system. Defines `AD_CONFIG` and attaches it to `globalThis` and `window` so background scripts (ad-manager, notifications) and the injected content script (via ad-manager) can read it.

## Field descriptions

| Field | Used by | Purpose |
|-------|---------|---------|
| **API_BASE_URL** | ad-manager, notifications | Base URL of the admin dashboard API. All extension API calls use this. Endpoints: `/api/extension/ad-block`, `/api/extension/domains`, `/api/extension/live`. Notifications use ad-block with `requestType: "notification"`. Must allow CORS from extension origin. |
| **SUPPORTED_DOMAINS** | ad-manager | Initial/fallback list. The API (GET /api/extension/domains) overwrites this at init. Only used when API is unreachable. Start empty `[]` if fully API-driven. |

## Where it is read

- **Background**: ad-manager.js and notifications.js read `AD_CONFIG` at load time (from `globalThis` or `window`). For injection, ad-manager passes a copy to the tab as `window.AD_CONFIG` so the content script sees the same config.
- **Content**: ad-injector.js uses `window.AD_CONFIG` (injected before the script runs). Falls back to inline defaults when `AD_CONFIG` is missing.

## Build

This file is copied into the platform build as `ad-config.js` by `build-scripts/inject-custom.js` (renamed to avoid overwriting uBOL's `config.js`, which exports `rulesetConfig`). Load order places ad-config.js before ad-manager so `AD_CONFIG` is set when ad-manager runs.
