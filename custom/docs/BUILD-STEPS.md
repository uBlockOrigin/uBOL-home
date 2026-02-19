# Ad Warden Build Steps

Complete steps to build the Ad Warden extension (custom uBOL-home with popup UI, notifications, etc.).

## Prerequisites

- **Node.js 22+** (required by uBOL)
- **npm** (comes with Node)

## Quick Build (chromium/ and firefox/ already exist)

If you already have `chromium/` and `firefox/` directories at the project root (e.g. from a previous build or release):

```bash
./build-scripts/build-custom.sh
```

**Output:** `custom-dist/chromium/` and `custom-dist/firefox/` — load these in Chrome/Firefox.

---

## Full Build (from scratch)

Use this when `chromium/` or `firefox/` are missing.

### Step 1: Initialize submodules

```bash
git submodule update --init --recursive
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Build uBlock (creates base extension)

```bash
# Chromium (Chrome/Edge)
make -C uBlock/ mv3-chromium

# Firefox (optional)
make -C uBlock/ mv3-firefox
```

This creates:
- `uBlock/dist/build/uBOLite.chromium`
- `uBlock/dist/build/uBOLite.firefox`

### Step 4: Copy build output to project root

```bash
# Chromium
rm -rf chromium
cp -R uBlock/dist/build/uBOLite.chromium chromium

# Firefox (optional)
rm -rf firefox
cp -R uBlock/dist/build/uBOLite.firefox firefox
```

### Step 5: Run custom build

```bash
./build-scripts/build-custom.sh
```

---

## What build-custom.sh Does

| Step | Action |
|------|--------|
| 0 | Clean `custom-dist/` and leftover files |
| 1 | (Placeholder) uBlock build check |
| 2 | Copy `chromium/` and `firefox/` → `custom-dist/` |
| 2b | Inject custom popup (Ad Warden UI) |
| 3 | Replace icons |
| 4 | Update extension name to "Ad Warden" |
| 5 | Inject custom files (notifications, ad-manager, etc.) |
| 6 | Inject background script imports |
| 7 | Merge manifests |
| 8 | Verify build |

---

## Important: Use Node, Not Bash

All build scripts in `build-scripts/` are **Node.js** scripts. Run them with `node`:

```bash
# Correct
node build-scripts/inject-background.js

# Wrong (causes "syntax error" / "Is a directory")
bash build-scripts/inject-background.js
```

---

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `custom-dist/chromium` folder

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `chromium/ directory not found` | Run Step 3–4 above to build uBlock and copy output |
| `syntax error` when running a script | Use `node`, not `bash` |
| Popup doesn't open / toggle broken | Rebuild and reload the extension from `custom-dist/chromium` |
