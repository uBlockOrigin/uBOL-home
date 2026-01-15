# uBO Lite

| Browser | Install from ... | Browser | Install from ... |
| --- | --- | --- | --- |
| <img src="https://github.com/user-attachments/assets/d5033882-0c94-424f-9e8b-e00ed832acf7" alt="Get uBO Lite for Chromium"> | <a href="https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh">Chrome Web Store</a> | <img src="https://github.com/user-attachments/assets/8a33b8ba-57ee-4a54-a83c-7d21f9b2dafb" alt="Get uBlock Origin Lite for Firefox"> | <a href="https://github.com/uBlockOrigin/uBOL-home/releases">Self-distributed</a> |
| <img src="https://github.com/user-attachments/assets/acff1f85-d3f0-49eb-928e-7c43c5ef8f6c" alt="Get uBlock Origin Lite for Microsoft Edge"> | <a href="https://microsoftedge.microsoft.com/addons/detail/ublock-origin-lite/cimighlppcgcoapaliogpjjdehbnofhn">Edge Add-ons</a> | <img src="https://github.com/user-attachments/assets/d267b13e-b403-4040-93ea-fff38fea8c1b" alt="Get uBlock Origin Lite for Safari"> | <a href="https://apps.apple.com/us/app/ublock-origin-lite/id6745342698">Safari App Store</a> or<br>[Beta version via TestFlight](https://testflight.apple.com/join/mA7E47r1) |

## Description

[Frequently asked questions (FAQ)](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ))

**uBO Lite** (uBOL) is an efficient content blocker based on the [MV3 API](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3).

uBOL operates entirely declaratively, meaning no permanent process is required for filtering. The browser handles CSS/JS injection for content filtering, ensuring that uBOL does not consume CPU or memory resources while blocking content. The service worker process is only active when interacting with the popup panel or options pages.

The default ruleset includes at least uBlock Origin's default filter set:

- uBlock Origin's built-in filter lists
- EasyList
- EasyPrivacy
- Peter Lowe’s Ad and tracking server list

You can enable additional rulesets by visiting the options page — click the _Cogs_ icon in the popup panel.

## Changelog

See the [_Releases_](https://github.com/uBlockOrigin/uBOL-home/releases) section.

Older releases: [Wiki/Release notes (salvaged)](https://github.com/uBlockOrigin/uBOL-home/wiki/Release-notes-(salvaged)).

## Issues

uBO Lite _extension_ issues can be reported [here](https://github.com/uBlockOrigin/uBOL-home/issues).

Filter/website issues (ads, detection, trackers, breakage, etc.) need to be reported via the 💬 _Chat_ icon in uBOL while on the affected site.

Support questions can be asked [here](https://github.com/uBlockOrigin/uBOL-home/discussions).

## Admin Policies

uBOL exposes settings that can be defined by administrators through [managed storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed). See [Managed settings](https://github.com/uBlockOrigin/uBOL-home/wiki/Managed-settings).

## Frequently Asked Questions (FAQ)

For more information, check the [_Wiki_](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ)).

---

## Custom Build and Workflows

This fork includes custom build scripts, GitHub Actions workflows, and a notification system.

### Branch Strategy

- **`main`**: Synced with upstream (uBlockOrigin/uBOL-home), kept clean
- **`custom`**: Working branch with customizations (notifications, custom scripts, etc.)

### GitHub Actions Workflows

#### 1. Sync Workflow (`.github/workflows/sync-upstream.yml`)

Automatically keeps branches in sync:

- **Schedule**: Runs nightly at 03:00 UTC
- **Manual trigger**: Available via `workflow_dispatch` in GitHub Actions UI
- **Process**:
  1. Fetches updates from upstream (uBlockOrigin/uBOL-home)
  2. Merges `upstream/main` into local `main`
  3. Rebases `custom` branch on updated `main`
  4. Pushes both branches (uses `--force-with-lease` for safe force push)

**Usage**:
- Automatic: Runs every night at 03:00 UTC
- Manual: Go to Actions → "Sync upstream and reapply custom changes" → Run workflow

**Conflict Resolution**:
- If rebase conflicts occur, the workflow will fail
- Manually resolve conflicts and push to `custom` branch
- The workflow will continue on the next scheduled run

#### 2. Build Workflow (`.github/workflows/build-extension.yml`)

Builds the extension with custom files and creates downloadable ZIP artifacts:

- **Triggers**: 
  - Pushes to `custom` branch
  - Manual trigger via `workflow_dispatch`
- **Process**:
  1. Checks out repository with submodules
  2. Installs dependencies
  3. Builds uBOL-home extension (if needed)
  4. Injects custom files (`custom/background/notifications.js`)
  5. Merges custom scripts into platform manifests
  6. Creates ZIP archives for Chrome and Firefox
  7. Uploads ZIPs as GitHub Actions artifacts

**Downloading Build Artifacts**:
1. Go to Actions tab in GitHub
2. Select the latest "Build Extension and Create ZIP Artifacts" run
3. Scroll to "Artifacts" section
4. Download `chrome-extension` or `firefox-extension` ZIP files
5. Artifacts are retained for 7 days

**Note**: This workflow does NOT publish to Chrome Web Store, Firefox Add-ons, or Edge Add-ons. ZIPs are only available as downloadable artifacts.

### Custom Build Scripts

#### File Structure

```
uBOL-home/
├── custom/
│   └── background/
│       └── notifications.js          # Custom notification script
├── build-scripts/
│   ├── inject-custom.js              # Injects custom files into platforms
│   ├── merge-manifest.js              # Updates manifests with custom scripts
│   └── build-custom.sh                # Complete build wrapper
├── chromium/                         # Chrome/Chromium build output
│   ├── manifest.json                 # Updated with custom scripts
│   └── js/
│       └── notifications.js           # Injected custom file
└── firefox/                          # Firefox build output
    ├── manifest.json                 # Updated with custom scripts
    └── js/
        └── notifications.js          # Injected custom file
```

#### Build Process

1. **Native Build**: uBOL-home's native build process creates `chromium/` and `firefox/` directories
2. **File Injection**: `inject-custom.js` copies custom files to platform `js/` directories
3. **Manifest Merging**: `merge-manifest.js` updates manifests to include custom scripts and permissions
4. **Packaging**: Build workflow creates ZIP archives for distribution

**Local Build**:
```bash
# Run custom build wrapper
./build-scripts/build-custom.sh

# Or run steps individually
node build-scripts/inject-custom.js
node build-scripts/merge-manifest.js
```

### Notification System

#### Current Implementation

The extension includes a custom notification system that:

- **Polls every 10 seconds** (placeholder interval)
- Shows test notifications with timestamps
- Uses Chrome notifications API (`chrome.notifications.create`)
- Ready for future Supabase integration

#### Notification Script Location

- **Source**: `custom/background/notifications.js`
- **Injected to**: `chromium/js/notifications.js` and `firefox/js/notifications.js`
- **Manifest**: Automatically added to `background.scripts` array and `permissions`

#### Testing Notifications

1. Build the extension using the build workflow or local build scripts
2. Load the extension in Chrome/Firefox:
   - Chrome: `chrome://extensions` → Developer mode → Load unpacked → Select `chromium/` directory
   - Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → Select `firefox/manifest.json`
3. Notifications will appear every 10 seconds
4. Check browser console for notification logs

#### Future: Supabase Integration

The notification system is structured to easily integrate with Supabase:

- Replace 10-second polling with Supabase Realtime subscription
- Fetch notifications from backend queue
- Support user-specific notification targeting
- Store notification history

**Integration Plan**:
1. Set up Supabase project and database
2. Create notifications table
3. Replace polling interval with Supabase Realtime subscription
4. Update notification script to fetch from Supabase
5. Add user authentication/identification

### Workflow Permissions

- **Sync Workflow**: Requires `contents: write` permission (for pushing branches)
- **Build Workflow**: Requires `contents: read` permission (for checking out code)
- **No Publishing**: Neither workflow publishes to extension stores

### Troubleshooting

**Sync Workflow Fails**:
- Check for merge/rebase conflicts
- Manually resolve conflicts and push
- Verify upstream remote is correctly configured

**Build Workflow Fails**:
- Verify submodules are initialized
- Check that `chromium/` and `firefox/` directories exist
- Ensure Node.js 22+ is available
- Review build logs for specific errors

**Notifications Not Appearing**:
- Verify `notifications` permission is in manifest
- Check that `notifications.js` is in platform `js/` directory
- Check browser console for errors
- Ensure extension has notification permissions enabled in browser settings
