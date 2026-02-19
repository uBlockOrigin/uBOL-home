#!/bin/bash
# Custom build wrapper for uBOL-home
# Orchestrates native build, custom file injection, and manifest merging

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting Ad Warden custom build process..."
echo ""

# Step 0: Clean previous build outputs
echo "🧹 Step 0: Cleaning previous build outputs..."
if [ -d "$ROOT_DIR/custom-dist" ]; then
    echo "   🗑️  Removing existing custom-dist/..."
    rm -rf "$ROOT_DIR/custom-dist"
    echo "   ✅ custom-dist/ removed"
else
    echo "   ℹ️  No existing custom-dist/ to remove"
fi

# Clean any leftover custom files from source directories
echo "   🧹 Cleaning leftover custom files from source directories..."
if [ -f "$ROOT_DIR/chromium/js/user-registration.js" ]; then
    echo "   🗑️  Removing chromium/js/user-registration.js..."
    rm -f "$ROOT_DIR/chromium/js/user-registration.js"
fi
if [ -f "$ROOT_DIR/firefox/js/user-registration.js" ]; then
    echo "   🗑️  Removing firefox/js/user-registration.js..."
    rm -f "$ROOT_DIR/firefox/js/user-registration.js"
fi
if [ -f "$ROOT_DIR/chromium/js/notifications.js" ]; then
    echo "   🗑️  Removing chromium/js/notifications.js..."
    rm -f "$ROOT_DIR/chromium/js/notifications.js"
fi
if [ -f "$ROOT_DIR/firefox/js/notifications.js" ]; then
    echo "   🗑️  Removing firefox/js/notifications.js..."
    rm -f "$ROOT_DIR/firefox/js/notifications.js"
fi
echo "   ✅ Source directories cleaned"
echo ""

# Step 1: Run uBOL-home's native build process
echo "📦 Step 1: Running uBOL-home native build..."
echo "   (This may take a while...)"
echo ""

# Check if Makefile exists and has a build target
if [ -f "$ROOT_DIR/Makefile" ]; then
    # Check what build targets are available
    # For now, we'll assume the build is already done or use npm/pnpm
    echo "   Makefile found. Checking build requirements..."
    
    # Check if uBlock submodule is initialized
    if [ ! -d "$ROOT_DIR/uBlock" ] || [ -z "$(ls -A "$ROOT_DIR/uBlock" 2>/dev/null)" ]; then
        echo "   ⚠️  uBlock submodule not initialized. Initializing..."
        cd "$ROOT_DIR"
        git submodule update --init --recursive || true
    fi
else
    echo "   ℹ️  No Makefile found. Assuming build output already exists."
fi

# Note: uBOL-home's actual build process may need to be run separately
# This script assumes chromium/ and firefox/ directories already contain built files
# If build is needed, it should be run before this script

echo ""

# Step 2: Copy chromium/ and firefox/ to custom-dist/ (keep originals untouched)
echo "📋 Step 2: Copying chromium/ and firefox/ to custom-dist/..."
if [ ! -d "$ROOT_DIR/chromium" ]; then
    echo "   ❌ chromium/ directory not found!"
    echo "   Please run the uBlock build process first to create chromium/"
    exit 1
fi

if [ ! -d "$ROOT_DIR/firefox" ]; then
    echo "   ⚠️  firefox/ directory not found (will skip firefox build)"
fi

# Create custom-dist directory (already cleaned in Step 0)
mkdir -p "$ROOT_DIR/custom-dist"

# Copy chromium to custom-dist/chromium
echo "   📦 Copying chromium/ → custom-dist/chromium/..."
cp -r "$ROOT_DIR/chromium" "$ROOT_DIR/custom-dist/chromium"

if [ $? -ne 0 ]; then
    echo "   ❌ Failed to copy chromium/ to custom-dist/chromium/!"
    exit 1
fi

# Copy firefox to custom-dist/firefox (if it exists)
if [ -d "$ROOT_DIR/firefox" ]; then
    echo "   📦 Copying firefox/ → custom-dist/firefox/..."
    cp -r "$ROOT_DIR/firefox" "$ROOT_DIR/custom-dist/firefox"
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Failed to copy firefox/ to custom-dist/firefox/!"
        exit 1
    fi
fi

echo "   ✅ custom-dist/ created successfully"
echo ""

# Step 2b: Inject custom popup (Ad Warden UI)
echo "🖼️  Step 2b: Injecting custom popup UI..."
cd "$ROOT_DIR"
node build-scripts/inject-popup.js

if [ $? -ne 0 ]; then
    echo "❌ Popup injection failed!"
    exit 1
fi

# Step 2c: Patch css-api.js for Extension context invalidated
echo "🔧 Step 2c: Patching css-api.js..."
node build-scripts/patch-css-api.js

echo ""

# Step 3: Replace icons with duck image
echo "🦆 Step 3: Replacing icons with duck image..."
cd "$ROOT_DIR"
node build-scripts/replace-icons.js

if [ $? -ne 0 ]; then
    echo "❌ Icon replacement failed!"
    exit 1
fi

# Step 3a: Patch dashboard logo (ublock.svg -> icon_64.png)
echo "🖼️  Step 3a: Patching dashboard logo..."
node build-scripts/patch-dashboard.js

echo ""

# Step 4: Update extension name to Ad Warden
echo "📝 Step 4: Updating extension name to 'Ad Warden'..."
cd "$ROOT_DIR"
node build-scripts/update-extension-name.js

if [ $? -ne 0 ]; then
    echo "❌ Extension name update failed!"
    exit 1
fi

echo ""

# Step 5: Inject custom files
echo "📥 Step 5: Injecting custom files into platform builds..."
cd "$ROOT_DIR"
node build-scripts/inject-custom.js

if [ $? -ne 0 ]; then
    echo "❌ Custom file injection failed!"
    exit 1
fi

echo ""


# Step 6: Inject notifications into background.js for Manifest V3 (Chrome)
echo "📥 Step 6: Injecting notifications into background.js (Manifest V3)..."
node build-scripts/inject-background.js

echo ""

# Step 7: Merge manifests
echo "📝 Step 7: Merging custom scripts into manifests..."
node build-scripts/merge-manifest.js

if [ $? -ne 0 ]; then
    echo "❌ Manifest merging failed!"
    exit 1
fi

echo ""

# Step 8: Verify custom files are present
echo "🔍 Step 8: Verifying custom files in build outputs..."
VERIFICATION_FAILED=0

# Check custom-dist/chromium/ (custom build)
CUSTOM_DIST_CHROMIUM_FILE="$ROOT_DIR/custom-dist/chromium/js/notifications.js"
if [ -f "$CUSTOM_DIST_CHROMIUM_FILE" ]; then
    echo "   ✅ custom-dist/chromium/js/notifications.js exists"
else
    echo "   ❌ custom-dist/chromium/js/notifications.js NOT FOUND"
    VERIFICATION_FAILED=1
fi

# Check custom-dist/firefox/ (if it exists)
if [ -d "$ROOT_DIR/custom-dist/firefox" ]; then
    CUSTOM_DIST_FIREFOX_FILE="$ROOT_DIR/custom-dist/firefox/js/notifications.js"
    if [ -f "$CUSTOM_DIST_FIREFOX_FILE" ]; then
        echo "   ✅ custom-dist/firefox/js/notifications.js exists"
    else
        echo "   ❌ custom-dist/firefox/js/notifications.js NOT FOUND"
        VERIFICATION_FAILED=1
    fi
fi

# Verify chromium/ is untouched (should NOT have custom files)
CHROMIUM_CUSTOM_FILE="$ROOT_DIR/chromium/js/notifications.js"
if [ -f "$CHROMIUM_CUSTOM_FILE" ]; then
    echo "   ⚠️  WARNING: chromium/js/notifications.js exists (chromium/ should be untouched!)"
    echo "   💡 This file may be from a previous build. Consider cleaning chromium/ directory."
    # Don't fail - just warn, as this might be from a previous run
else
    echo "   ✅ chromium/ is untouched (no custom files)"
fi

# Verify firefox/ is untouched (should NOT have custom files)
if [ -d "$ROOT_DIR/firefox" ]; then
    FIREFOX_CUSTOM_FILE="$ROOT_DIR/firefox/js/notifications.js"
    if [ -f "$FIREFOX_CUSTOM_FILE" ]; then
        echo "   ⚠️  WARNING: firefox/js/notifications.js exists (firefox/ should be untouched!)"
        echo "   💡 This file may be from a previous build. Consider cleaning firefox/ directory."
        # Don't fail - just warn
    else
        echo "   ✅ firefox/ is untouched (no custom files)"
    fi
fi

if [ $VERIFICATION_FAILED -eq 1 ]; then
    echo ""
    echo "❌ Verification failed! Custom files are missing in custom-dist/."
    exit 1
fi

echo ""
echo "✅ Custom build complete!"
echo ""
echo "📦 Build outputs:"
echo "   - chromium/              → Pure uBlock build (untouched)"
echo "   - firefox/               → Pure uBlock build (untouched)"
echo "   - custom-dist/chromium/ → Custom build with all updates"
echo "   - custom-dist/firefox/  → Custom build with all updates"
echo ""
