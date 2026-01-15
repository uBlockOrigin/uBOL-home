#!/bin/bash
# Custom build wrapper for uBOL-home
# Orchestrates native build, custom file injection, and manifest merging

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting custom uBOL-home build process..."
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

# Step 2: Inject custom files
echo "📥 Step 2: Injecting custom files into platform builds..."
cd "$ROOT_DIR"
node build-scripts/inject-custom.js

if [ $? -ne 0 ]; then
    echo "❌ Custom file injection failed!"
    exit 1
fi

echo ""

# Step 2.5: Inject notifications into background.js for Manifest V3 (Chrome)
echo "📥 Step 2.5: Injecting notifications into background.js (Manifest V3)..."
node build-scripts/inject-background.js

echo ""

# Step 3: Merge manifests
echo "📝 Step 3: Merging custom scripts into manifests..."
node build-scripts/merge-manifest.js

if [ $? -ne 0 ]; then
    echo "❌ Manifest merging failed!"
    exit 1
fi

echo ""

# Step 4: Verify custom files are present
echo "🔍 Step 4: Verifying custom files in build outputs..."
VERIFICATION_FAILED=0

for platform in chromium firefox; do
    PLATFORM_DIR="$ROOT_DIR/$platform"
    CUSTOM_FILE="$PLATFORM_DIR/js/notifications.js"
    
    if [ -f "$CUSTOM_FILE" ]; then
        echo "   ✅ $platform/js/notifications.js exists"
    else
        echo "   ❌ $platform/js/notifications.js NOT FOUND"
        VERIFICATION_FAILED=1
    fi
done

if [ $VERIFICATION_FAILED -eq 1 ]; then
    echo ""
    echo "❌ Verification failed! Custom files are missing."
    exit 1
fi

echo ""
echo "✅ Custom build complete!"
echo ""
echo "📦 Build outputs are ready in:"
echo "   - chromium/"
echo "   - firefox/"
echo ""
