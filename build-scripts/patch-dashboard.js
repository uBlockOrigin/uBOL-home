#!/usr/bin/env node
/**
 * Patch dashboard.html:
 * - Use Ad Warden logo (icon_64.png) instead of ublock.svg
 * - Remove About page link from nav
 * Run after replace-icons.js so icon_64.png has the custom logo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PLATFORMS = ['custom-dist/chromium', 'custom-dist/firefox'];

function patchDashboard() {
    console.log('🔧 Patching dashboard logo to Ad Warden...\n');

    let successCount = 0;
    for (const platform of PLATFORMS) {
        const dashboardPath = path.join(rootDir, platform, 'dashboard.html');
        if (!fs.existsSync(dashboardPath)) {
            console.warn(`⚠️  Dashboard not found: ${platform}/dashboard.html`);
            continue;
        }

        let html = fs.readFileSync(dashboardPath, 'utf8');
        const original = html;

        // Replace ublock.svg logo with icon_64.png (already replaced with Ad Warden logo by replace-icons)
        html = html.replace(
            /src="img\/ublock\.svg"/g,
            'src="img/icon_64.png"'
        );
        html = html.replace(
            /alt="uBO Lite"/g,
            'alt="Ad Warden"'
        );

        // Remove About page link from nav
        html = html.replace(
            /<!--\s*-->\s*<button[^>]*data-pane="about"[^>]*><\/button>/g,
            ''
        );

        if (html !== original) {
            fs.writeFileSync(dashboardPath, html);
            console.log(`✅ ${platform}/dashboard.html (logo updated)`);
            successCount++;
        } else {
            console.log(`ℹ️  ${platform}/dashboard.html (no changes needed)`);
        }
    }

    // Also patch click2load.html if it uses the logo
    for (const platform of PLATFORMS) {
        const click2loadPath = path.join(rootDir, platform, 'web_accessible_resources', 'click2load.html');
        if (!fs.existsSync(click2loadPath)) continue;

        let html = fs.readFileSync(click2loadPath, 'utf8');
        const original = html;
        html = html.replace(/src="\.\.\/img\/ublock\.svg"/g, 'src="../img/icon_64.png"');
        if (html !== original) {
            fs.writeFileSync(click2loadPath, html);
            console.log(`✅ ${platform}/web_accessible_resources/click2load.html (logo updated)`);
            successCount++;
        }
    }

    console.log(`\n✅ Dashboard logo patch complete (${successCount} file(s) updated)\n`);
}

patchDashboard();
