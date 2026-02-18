# Custom modules (Ad Warden)

Ad-injection and notification system for the Ad Warden extension. All custom code lives here.

## Structure

| Folder   | Contents |
|----------|----------|
| **config/**  | `config.js` – API_BASE_URL, SUPPORTED_DOMAINS |
| **content/** | `ad-injector.js` – Content script; injects ads into pages |
| **background/** | `identity.js`, `notifications.js`, `ad-manager.js`, `init.js` |
| **docs/** | Module docs, config setup, MEMORY |

## Build

```bash
./build-scripts/build-custom.sh
```

Output: `custom-dist/chromium/`, `custom-dist/firefox/`

## Docs

See **docs/README.md** for the full index. For API setup, see **docs/config-setup.md**.
