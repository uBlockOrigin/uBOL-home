# notifications.js (background)

**Path:** custom/background/notifications.js

## Purpose

Fetches notifications from the admin dashboard API and shows them as browser notifications. Maintains a live SSE connection so the user is marked active and can receive real-time notification events.

## How it works

### Config

Uses AD_CONFIG.API_BASE_URL from globalThis or window (config.js). Fallback: empty string.

### Visitor ID

Calls identityModule.getHashedHardwareId() (or temp ID if identity missing) for API requests. Same visitorId as ad-block and notifications endpoints.

### API

- Fetch notifications: `POST /api/extension/ad-block` with `{ visitorId, requestType: "notification" }`. Response `{ ads: [], notifications: [...] }` used to show browser notifications (title, message). Count capped with MAX_NOTIFICATIONS.
- Live SSE: Connects to server-sent events endpoint to keep user active and receive real-time events. Reconnects with backoff on disconnect.
- **Domains event**: When the server emits a `domains` event (admin created/updated/deleted a platform), calls `adManagerModule.fetchTargetDomains()` to refresh the target domains list from `GET /api/extension/domains`.

### showNotification(notificationData)

Uses chrome.notifications.create() with type basic, optional icon from extension. On failure (e.g. icon load), retries without icon.

### Init

initNotifications() called from init.js after identity is ready. Starts live SSE and may trigger initial fetch of notifications.
