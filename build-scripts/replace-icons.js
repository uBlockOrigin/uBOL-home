#!/usr/bin/env node
/**
 * Replace all extension icons with duck.png variations
 * 
 * Usage:
 *   node replace-icons.js [path/to/duck.png]
 * 
 * If no path is provided, looks for duck.png in the custom/ folder.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get uBOL-home root (one level up from build-scripts/)
const UBOL_HOME_ROOT = path.resolve(__dirname, '..');

// Default source image path - look in custom folder
const DEFAULT_SOURCE_IMAGE = path.join(UBOL_HOME_ROOT, 'custom', 'duck.png');

/**
 * Extract size from icon filename
 * Examples:
 *   icon_16.png -> 16
 *   icon_32_off.png -> 32
 *   icon_64-loading.png -> 64
 */
function extractSize(filename) {
    const match = filename.match(/icon_(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Determine variant type from filename
 * Returns: 'normal', 'off', or 'loading'
 */
function getVariantType(filename) {
    if (filename.includes('_off') || filename.includes('-off')) {
        return 'off';
    }
    if (filename.includes('_loading') || filename.includes('-loading')) {
        return 'loading';
    }
    return 'normal';
}

/**
 * Process image for a specific variant
 */
async function processVariant(image, size, variant) {
    // First resize the image
    let processed = image.resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
    }).ensureAlpha();

    switch (variant) {
        case 'off':
            // Desaturate and reduce brightness for "off" state
            processed = processed.modulate({
                saturation: 0.3,
                brightness: 0.7
            });
            // Apply 50% opacity by modifying alpha channel
            // Get the image as raw buffer to modify alpha
            const offRaw = await processed.raw().toBuffer({ resolveWithObject: true });
            const offPixels = offRaw.data;
            // Modify alpha channel (every 4th byte starting at index 3)
            for (let i = 3; i < offPixels.length; i += 4) {
                offPixels[i] = Math.floor(offPixels[i] * 0.5); // 50% opacity
            }
            processed = sharp(offPixels, {
                raw: {
                    width: offRaw.info.width,
                    height: offRaw.info.height,
                    channels: 4
                }
            });
            break;
        case 'loading':
            // Slightly dimmed (80% opacity) for "loading" state
            const loadingRaw = await processed.raw().toBuffer({ resolveWithObject: true });
            const loadingPixels = loadingRaw.data;
            // Modify alpha channel (every 4th byte starting at index 3)
            for (let i = 3; i < loadingPixels.length; i += 4) {
                loadingPixels[i] = Math.floor(loadingPixels[i] * 0.8); // 80% opacity
            }
            processed = sharp(loadingPixels, {
                raw: {
                    width: loadingRaw.info.width,
                    height: loadingRaw.info.height,
                    channels: 4
                }
            });
            break;
        case 'normal':
        default:
            // Full color, no modification
            break;
    }

    return processed;
}

/**
 * Find all icon files in the codebase (excluding submodules)
 */
function findIconFiles(rootDir) {
    const iconFiles = [];

    function walkDir(dir) {
        if (!fs.existsSync(dir)) {
            return;
        }

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(rootDir, fullPath);

            // Skip submodules (uBlock is a submodule)
            if (entry.isDirectory()) {
                const dirName = entry.name;
                // Skip known submodule directories and original chromium/ and firefox/ (keep them untouched)
                if (dirName === 'node_modules' ||
                    dirName === '.git' ||
                    dirName === 'uBlock' ||  // uBlock is a submodule
                    dirName === 'chromium' ||  // Keep chromium/ untouched (only process custom-dist/chromium/)
                    dirName === 'firefox' ||  // Keep firefox/ untouched (only process custom-dist/firefox/)
                    (dirName === 'dist' && !fullPath.includes('safari'))) {
                    continue;
                }
                walkDir(fullPath);
            } else if (entry.isFile() && entry.name.match(/^icon_\d+.*\.png$/)) {
                // Only include files from custom-dist/ directories
                // Exclude anything under uBlock/ submodule and original chromium/ and firefox/
                if (!relativePath.startsWith('uBlock' + path.sep) &&
                    !relativePath.startsWith('uBlock' + '/') &&
                    !relativePath.startsWith('chromium' + path.sep) &&
                    !relativePath.startsWith('chromium' + '/') &&
                    !relativePath.startsWith('firefox' + path.sep) &&
                    !relativePath.startsWith('firefox' + '/')) {
                    iconFiles.push(fullPath);
                }
            }
        }
    }

    walkDir(rootDir);
    return iconFiles;
}

/**
 * Main function
 */
async function main() {
    // Get source image path
    const sourceImagePath = process.argv[2] || DEFAULT_SOURCE_IMAGE;

    if (!fs.existsSync(sourceImagePath)) {
        console.error(`❌ Source image not found: ${sourceImagePath}`);
        console.error(`   Please provide path to duck.png or place it at: ${DEFAULT_SOURCE_IMAGE}`);
        process.exit(1);
    }

    console.log(`🦆 Using source image: ${sourceImagePath}`);
    console.log(`📁 Searching for icon files in: ${UBOL_HOME_ROOT}\n`);

    // Find all icon files
    const iconFiles = findIconFiles(UBOL_HOME_ROOT);

    if (iconFiles.length === 0) {
        console.log('⚠️  No icon files found!');
        process.exit(0);
    }

    console.log(`📋 Found ${iconFiles.length} icon file(s):\n`);

    // Load source image
    let sourceImage;
    try {
        sourceImage = sharp(sourceImagePath);
        // Verify it's a valid image
        await sourceImage.metadata();
    } catch (error) {
        console.error(`❌ Failed to load source image: ${error.message}`);
        process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each icon file
    for (const iconPath of iconFiles) {
        const filename = path.basename(iconPath);
        const size = extractSize(filename);
        const variant = getVariantType(filename);

        if (!size) {
            console.log(`⚠️  Skipping ${iconPath} (could not extract size)`);
            continue;
        }

        try {
            // Clone the source image for processing
            const imageClone = sourceImage.clone();

            // Process the image
            const processed = await processVariant(imageClone, size, variant);

            // Save to file
            await processed.png().toFile(iconPath);

            const relativePath = path.relative(UBOL_HOME_ROOT, iconPath);
            console.log(`✅ ${relativePath} (${size}x${size}, ${variant})`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to process ${iconPath}: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount}`);
        process.exit(1);
    }
    console.log(`\n🎉 All icons replaced successfully!`);
}

// Run main function
main().catch(error => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
});
