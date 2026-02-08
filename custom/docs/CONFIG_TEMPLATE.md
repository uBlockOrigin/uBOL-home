# Configuration template (summary)

Full details: [../background/CONFIG_TEMPLATE.md](../background/CONFIG_TEMPLATE.md).

## Quick reference

- **API base URL**: Set in `custom/config/ad-domains.js` as `API_BASE_URL` (e.g. `http://localhost:3000` for local, or your production dashboard URL).
- **Endpoints**: `/api/extension/notifications`, `/api/extension/ad-block`. Both use `visitorId` (hashed hardware ID); user registration is handled automatically by the API.
- **Setup**: Update `API_BASE_URL` → run `./build-scripts/build-custom.sh` → load extension → verify console and dashboard.

See CONFIG_TEMPLATE.md in the background folder for environment table, testing checklist, and security notes.
