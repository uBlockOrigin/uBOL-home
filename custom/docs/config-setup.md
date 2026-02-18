# Configuration Setup

## API Base URL Setup

Before testing, you need to update the API base URL in the configuration file:

**`custom/config/config.js`**
- Line ~7: `API_BASE_URL: 'http://localhost:3000'` (for local development)
- Update to your production dashboard URL when deploying (e.g., `'https://your-dashboard.example.com'`)

## Environment URLs

| Environment | Base URL |
|-------------|---------|
| Local      | `http://localhost:3000` |
| Production | Your deployed dashboard origin (e.g. `https://your-dashboard.example.com`) |

## How It Works

The extension uses REST API endpoints that automatically handle user registration:

- **`/api/extension/ad-block`** - Fetches ads and/or notifications. Use `requestType: "notification"` for notifications only (no domain needed). User registration happens automatically.

Both endpoints automatically:
- Upsert `extension_users` by `visitorId` (updating `lastSeenAt`, incrementing `totalRequests`)
- Insert into `request_logs` for analytics

**No separate registration call is required.** The `visitorId` is generated from the hardware ID hash (via `identity.js`).

## Quick Setup

1. Update `API_BASE_URL` in `custom/config/config.js`
2. Rebuild extension: `./build-scripts/build-custom.sh`
3. Load extension in Chrome/Firefox
4. Check browser console for initialization logs
5. Verify API calls are made to your dashboard

## Testing Checklist

After updating the API base URL:

1. ✅ Update `API_BASE_URL` in `custom/config/config.js`
2. ✅ Ensure your admin dashboard is running and accessible
3. ✅ Rebuild extension: `./build-scripts/build-custom.sh`
4. ✅ Load extension in browser
5. ✅ Check browser console for initialization logs
6. ✅ Verify API requests appear in dashboard logs
7. ✅ Test notifications and ad injection on supported domains

## Security Note

- The API base URL is safe to commit (it's just the endpoint URL)
- Ensure your dashboard has proper CORS configuration for extension origins
- The `visitorId` is a hashed hardware ID (SHA-512) and doesn't expose user identity
