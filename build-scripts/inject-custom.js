#!/usr/bin/env node
/**
 * Custom file injection script for uBOL-home
 * Copies custom background scripts to platform-specific directories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Platform directories
// Note: chromium/ and firefox/ are kept untouched, custom-dist/ contains custom builds
const PLATFORMS = ['custom-dist/chromium', 'custom-dist/firefox'];
const CUSTOM_SCRIPTS = [
    'custom/background/identity.js',
    'custom/background/user-registration.js',
    'custom/background/notifications.js',
    'custom/background/init.js',
    'custom/background/ad-manager.js',
    'custom/config/ad-domains.js'
];
const TARGET_DIR = 'js';

// Content scripts (go to js/scripting/)
const CUSTOM_CONTENT_SCRIPTS = [
    { src: 'custom/content/ad-injector.js', dest: 'js/scripting/ad-injector.js' },
];

function injectCustomFiles() {
    console.log('🔧 Injecting custom files into platform builds...\n');

    let successCount = 0;
    let errorCount = 0;

    // Inject into each platform
    for (const platform of PLATFORMS) {
        const platformDir = path.join(rootDir, platform);
        const targetJsDir = path.join(platformDir, TARGET_DIR);

        try {
            // Check if platform directory exists
            if (!fs.existsSync(platformDir)) {
                console.warn(`⚠️  Platform directory not found: ${platform}`);
                continue;
            }

            // Ensure js directory exists
            if (!fs.existsSync(targetJsDir)) {
                fs.mkdirSync(targetJsDir, { recursive: true });
                console.log(`📁 Created directory: ${targetJsDir}`);
            }

            // Copy each custom script
            for (const customScript of CUSTOM_SCRIPTS) {
                const customScriptPath = path.join(rootDir, customScript);
                
                // Check if custom script exists
                if (!fs.existsSync(customScriptPath)) {
                    console.warn(`⚠️  Custom script not found: ${customScript}`);
                    continue;
                }

                const scriptName = path.basename(customScript);
                const targetScriptPath = path.join(targetJsDir, scriptName);

                // Copy custom script to platform js directory
                fs.copyFileSync(customScriptPath, targetScriptPath);
                console.log(`✅ Injected: ${platform}/js/${scriptName}`);
                successCount++;
            }

            // Copy content scripts to js/scripting/
            const scriptingDir = path.join(targetJsDir, 'scripting');
            if (!fs.existsSync(scriptingDir)) {
                fs.mkdirSync(scriptingDir, { recursive: true });
                console.log(`📁 Created directory: ${scriptingDir}`);
            }

            for (const contentScript of CUSTOM_CONTENT_SCRIPTS) {
                const srcPath = path.join(rootDir, contentScript.src);
                
                // Check if source file exists
                if (!fs.existsSync(srcPath)) {
                    console.warn(`⚠️  Content script not found: ${contentScript.src}`);
                    continue;
                }

                const destPath = path.join(platformDir, contentScript.dest);
                const destDir = path.dirname(destPath);
                
                // Ensure destination directory exists
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }

                // Copy content script
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ Injected: ${platform}/${contentScript.dest}`);
                successCount++;
            }

        } catch (error) {
            console.error(`❌ Error injecting into ${platform}:`, error.message);
            errorCount++;
        }
    }

    console.log(`\n📊 Injection Summary: ${successCount} successful, ${errorCount} failed`);

    if (errorCount > 0) {
        process.exit(1);
    }

    console.log('✅ Custom file injection complete!\n');
}

// Run injection
injectCustomFiles();
