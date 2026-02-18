#!/usr/bin/env node
/**
 * Inject custom Ad Warden popup files into custom-dist
 * Copies custom/popup/ to custom-dist/chromium/ and custom-dist/firefox/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const POPUP_FILES = [
    { src: 'custom/popup/popup.html', dest: 'popup.html' },
    { src: 'custom/popup/css/popup.css', dest: 'css/popup.css' },
];

const PLATFORMS = ['custom-dist/chromium', 'custom-dist/firefox'];

function injectPopup() {
    console.log('🔧 Injecting custom popup files into custom-dist...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const platform of PLATFORMS) {
        const platformDir = path.join(rootDir, platform);
        if (!fs.existsSync(platformDir)) {
            console.warn(`⚠️  Platform directory not found: ${platform}`);
            continue;
        }

        for (const file of POPUP_FILES) {
            const srcPath = path.join(rootDir, file.src);
            const destPath = path.join(platformDir, file.dest);

            if (!fs.existsSync(srcPath)) {
                console.warn(`⚠️  Source not found: ${file.src}`);
                continue;
            }

            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            try {
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ ${platform}/${file.dest}`);
                successCount++;
            } catch (err) {
                console.error(`❌ ${platform}/${file.dest}: ${err.message}`);
                errorCount++;
            }
        }
    }

    console.log(`\n📊 Popup injection: ${successCount} files copied, ${errorCount} failed`);
    if (errorCount > 0) {
        process.exit(1);
    }
    console.log('✅ Custom popup injection complete!\n');
}

injectPopup();
