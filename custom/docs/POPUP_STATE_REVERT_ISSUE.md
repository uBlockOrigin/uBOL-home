# Popup State Revert Issue – Problem Statement

## Summary

When the user toggles the extension (on/off) or changes the filter level (basic, optimal, complete) in the Ad Warden popup, the UI updates for a split second and then reverts to the previous/default state. The change does not persist.

## Environment

- **Project**: Ad Warden (uBOL-home fork with custom popup)
- **Popup**: Custom UI in `custom/popup/` (popup.html, popup-adwarden.js, popup.css)
- **Build**: `custom-dist/chromium/` after running `./build-scripts/build-custom.sh`
- **Browser**: Chrome (extension loaded from custom-dist/chromium)

## Observed Behavior

1. User clicks the header toggle (on → off) or the "Disable Blocking" button
2. UI briefly shows the new state (toggle off, "Enable Blocking")
3. Within a split second, UI reverts to the previous state (toggle on, "Disable Blocking")

4. User clicks a filter segment (e.g. "optimal" or "complete")
5. Segmented bar briefly shows the new level
6. Within a split second, it reverts to the previous level (e.g. "basic")

## Relevant Code

### Current popup logic (`custom/popup/js/popup-adwarden.js`)

- **State source**: `popupPanelData` from `sendMessage({ what: 'popupPanelData', origin, hostname })` returns `{ level, autoReload, ... }`
- **State change**: `sendMessage({ what: 'setFilteringMode', hostname, level })` – background persists and returns the new level
- **Flow**: `setFilteringLevel(newLevel)` does:
  1. Optimistic update: `level = newLevel`, `render()`
  2. `await sendMessageWithRetry({ setFilteringMode, hostname, level })`
  3. If `actualLevel` is a number: `level = actualLevel`; else: `level = beforeLevel` (revert)
  4. `render()`
  5. `isToggling = false`

### Messaging

- Uses callback-based `runtime.sendMessage(msg, callback)` with retries (up to 5 attempts)
- Fallback: `browser?.runtime ?? chrome?.runtime`

### visibilitychange listener

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isToggling) {
        load();
    }
});
```

- `load()` fetches `popupPanelData` and sets `level = response.level`
- Guard `!isToggling` was added to avoid running `load()` during `setFilteringLevel`

## Fixes Already Tried

### 1. Guard visibilitychange with `!isToggling`

**Hypothesis**: `visibilitychange` was firing during the async `setFilteringMode` call, causing `load()` to run and overwrite `level` with stale `popupPanelData`.

**Change**: Only call `load()` when `!isToggling`.

**Result**: Issue persists.

### 2. Earlier attempts (from conversation history)

- Switched from `popup-ext.js` to platform `ext.js` for messaging
- Used callback-based `sendMessage` instead of Promise-based
- Used `mousedown` instead of `click` for the toggle
- Added retry logic (5 attempts) for `sendMessage`
- Optimistic UI update before awaiting the API response

## Original uBlock Popup Behavior

The original popup (`chromium/js/popup.js`) does **not** use `visibilitychange`:

- Runs `tryInit()` once on load → `init()` → fetches `popupPanelData`
- Never refetches; no visibilitychange listener
- Uses `sendMessage` from `ext.js` (Promise-based, returns `undefined` on catch)
- On filter change: `commitFilteringMode()` → `sendMessage({ setFilteringMode })` → updates UI from response

## Possible Remaining Causes

1. **Message failure**: `sendMessageWithRetry` may be returning `undefined` (e.g. service worker evicted, callback never fires), causing `level = beforeLevel` and revert.

2. **Background not persisting**: `setFilteringMode` in the background may not be completing before the popup receives a response, or may be failing silently.

3. **Different trigger for revert**: Something other than `visibilitychange` may be calling `load()` or overwriting `level` (e.g. another event, timer, or focus change).

4. **Chrome extension popup lifecycle**: Popup may be closing/reopening or reloading on interaction, causing a fresh `load()` on open.

5. **Tab/context mismatch**: `hostname` or `currentTab` might be wrong when sending `setFilteringMode`, so the background applies the change to a different context.

## Files to Inspect

| File | Purpose |
|------|---------|
| `custom/popup/js/popup-adwarden.js` | Popup logic, state, messaging |
| `chromium/js/popup.js` | Original popup (reference) |
| `chromium/js/background.js` | Message handlers for `popupPanelData`, `setFilteringMode` |
| `chromium/js/mode-manager.js` | `setFilteringMode`, `getFilteringMode` implementation |
| `chromium/js/ext.js` | `sendMessage` implementation |

## Debugging Suggestions

1. Add `console.log` in `setFilteringLevel`: log `beforeLevel`, `newLevel`, `actualLevel`, and whether revert occurs.
2. Add `console.log` in `load()`: log when it runs and the `response.level` it receives.
3. Add `console.log` in the `visibilitychange` handler: log when it fires and whether `load()` is called.
4. Inspect the popup in DevTools (right-click popup → Inspect) and watch the Console while reproducing the issue.
5. Verify the background receives `setFilteringMode`: add logging in `chromium/js/background.js` in the `setFilteringMode` case.
6. Try removing the `visibilitychange` listener entirely (match original behavior) and see if the issue persists.

## Desired Outcome

- Toggle off → UI stays off
- Toggle on → UI stays on
- Filter level change → selection persists
- Close and reopen popup → state reflects what was last set
