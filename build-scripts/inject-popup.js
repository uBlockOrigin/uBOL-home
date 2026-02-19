#!/usr/bin/env node
/**
 * Inject custom Ad Warden popup modifications into custom-dist
 * Uses original uBlock popup, removes Dashboard & Report buttons, adds Ad Warden styling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PLATFORMS = ['custom-dist/chromium', 'custom-dist/firefox'];

/** Remove gotoReport and gotoDashboard from popup HTML */
function patchPopupHtml(html) {
    // Remove gotoReport span (Report an issue)
    const gotoReportBlock = `        <span id="gotoReport" class="tool enabled" tabindex="0">
            <span class="fa-icon">comment-alt</span>
            <span data-i18n="popupTipReport">_</span>
        </span>
`;
    html = html.replace(gotoReportBlock, '');

    // Remove gotoDashboard span (Dashboard)
    const gotoDashboardBlock = `        <span id="gotoDashboard" class="fa-icon tool enabled" tabindex="0" data-i18n-title="popupTipDashboard">cogs<span class="caption" data-i18n="popupTipDashboard"></span></span>
`;
    html = html.replace(gotoDashboardBlock, '');
    // Add extension name at top, before hostname
    html = html.replace(
        '<main>\n    <div id="hostname">',
        '<main>\n    <div class="adwarden-header"><span data-i18n="extName">_</span></div>\n    <!-- -------- -->\n    <div id="hostname">'
    );
    // Add Ad Warden override CSS before </head>
    if (!html.includes('popup-adwarden-override.css')) {
        html = html.replace(
            '<link rel="stylesheet" href="css/popup.css">',
            '<link rel="stylesheet" href="css/popup.css">\n<link rel="stylesheet" href="css/popup-adwarden-override.css">'
        );
    }
    return html;
}

function injectPopup() {
    console.log('🔧 Injecting Ad Warden popup modifications into custom-dist...\n');

    const srcPopupPath = path.join(rootDir, 'chromium', 'popup.html');
    const srcCssPath = path.join(rootDir, 'custom', 'popup', 'css', 'popup-adwarden-override.css');

    if (!fs.existsSync(srcPopupPath)) {
        console.error('❌ Source popup not found: chromium/popup.html');
        process.exit(1);
    }
    if (!fs.existsSync(srcCssPath)) {
        console.error('❌ Ad Warden override CSS not found: custom/popup/css/popup-adwarden-override.css');
        process.exit(1);
    }

    let html = fs.readFileSync(srcPopupPath, 'utf8');
    html = patchPopupHtml(html);

    let successCount = 0;
    for (const platform of PLATFORMS) {
        const platformDir = path.join(rootDir, platform);
        if (!fs.existsSync(platformDir)) {
            console.warn(`⚠️  Platform directory not found: ${platform}`);
            continue;
        }

        const popupDest = path.join(platformDir, 'popup.html');
        const cssDest = path.join(platformDir, 'css', 'popup-adwarden-override.css');
        const cssDestDir = path.dirname(cssDest);

        try {
            fs.writeFileSync(popupDest, html);
            console.log(`✅ ${platform}/popup.html (original, patched)`);
            successCount++;

            if (!fs.existsSync(cssDestDir)) {
                fs.mkdirSync(cssDestDir, { recursive: true });
            }
            fs.copyFileSync(srcCssPath, cssDest);
            console.log(`✅ ${platform}/css/popup-adwarden-override.css`);
            successCount++;
        } catch (err) {
            console.error(`❌ ${platform}: ${err.message}`);
        }
    }

    console.log(`\n📊 Popup injection: ${successCount} files, Dashboard & Report buttons removed`);
    console.log('✅ Ad Warden popup injection complete!\n');
}

injectPopup();
