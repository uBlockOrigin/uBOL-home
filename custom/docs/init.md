# init.js (background)

**Path:** custom/background/init.js

## Purpose

Coordinates initialization of all custom background modules: identity (visitorId), notifications, and ad manager. Single init run; dependent modules in order.

## How it works

### Load order

1. Identity: identityModule.getHashedHardwareId() (visitorId for notifications and ad-manager).
2. Notifications: notificationsModule.initNotifications() (SSE, fetch notifications).
3. Ad manager: adManagerModule.initAdManager() (pre-fetch visitorId; tab/message listeners already registered at module load).

Modules must be loaded before init (e.g. by extension background script list). config.js should load before ad-manager.js so globalThis.AD_CONFIG is set.

### When init runs

- chrome.runtime.onStartup with setTimeout 1000.
- chrome.runtime.onInstalled: on install; on update only if not already initialized.
- One-time delayed run (1500 ms) if extension already running and not initialized.

### State

isInitialized set true after all three steps. initializationInProgress and initializationPromise prevent concurrent init; other callers wait on same promise.

### Exports

initializeCustomModules as initCustomModules on window and globalThis for manual use.
