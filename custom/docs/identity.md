# identity.js (background)

**Path:** `custom/background/identity.js`

## Purpose

Generates and stores a persistent hardware-style ID for the extension instance, then provides a SHA-512 hashed version used as the **visitorId** for API calls (ads, notifications). No PII; the hash is used only to identify the device/extension instance.

## How it works

### Storage

- **Key**: `hardwareId` in `chrome.storage.local`.
- **Value**: A UUID v4 string. Generated once; reused on later loads.

### Generation

- **generateUUID()** – returns a random UUID v4.
- **generateHardwareId()** – reads from storage; if missing, generates a new UUID, writes it, and returns it. Uses a promise queue so concurrent callers get the same result and only one write happens.

### Hashing

- **hashSHA512(data)** – Web Crypto API `crypto.subtle.digest('SHA-512', dataBuffer)`; returns hex string.
- **hashHardwareId(id)** – hashes the stored hardware ID.
- **getHashedHardwareId()** – `generateHardwareId()` then `hashHardwareId()`. This is the **visitorId** used by ad-manager and notifications.

### Exports

Attaches `identityModule` to `window`, `globalThis`, and (if present) `module.exports`: `generateHardwareId`, `getHardwareId`, `hashHardwareId`, `getHashedHardwareId`.
