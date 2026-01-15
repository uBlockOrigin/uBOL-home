#!/usr/bin/env node
/**
 * Manifest merger script for uBOL-home
 * Updates platform-specific manifests to include custom scripts and permissions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Platform directories and their manifest paths
const PLATFORMS = [
  { name: 'chromium', manifest: 'chromium/manifest.json' },
  { name: 'firefox', manifest: 'firefox/manifest.json' }
];

const CUSTOM_SCRIPT = 'js/notifications.js';
const NOTIFICATIONS_PERMISSION = 'notifications';

function mergeManifest(platform) {
  const manifestPath = path.join(rootDir, platform.manifest);
  
  // Check if manifest exists
  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️  Manifest not found: ${platform.manifest}`);
    return false;
  }

  try {
    // Read manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    let updated = false;

    // Handle background scripts
    if (manifest.background) {
      // Chrome/Edge Manifest V3: has service_worker, may also have scripts array
      if (manifest.background.service_worker) {
        // For Manifest V3, we can add scripts array alongside service_worker
        if (!manifest.background.scripts) {
          manifest.background.scripts = [];
        }
        
        // Add custom script if not already present
        if (!manifest.background.scripts.includes(CUSTOM_SCRIPT)) {
          manifest.background.scripts.push(CUSTOM_SCRIPT);
          updated = true;
          console.log(`  ✓ Added ${CUSTOM_SCRIPT} to background.scripts`);
        }
      }
      // Firefox Manifest V2/V3: has scripts array
      else if (manifest.background.scripts && Array.isArray(manifest.background.scripts)) {
        // Add custom script if not already present
        if (!manifest.background.scripts.includes(CUSTOM_SCRIPT)) {
          manifest.background.scripts.push(CUSTOM_SCRIPT);
          updated = true;
          console.log(`  ✓ Added ${CUSTOM_SCRIPT} to background.scripts`);
        }
      }
    }

    // Handle permissions
    if (!manifest.permissions) {
      manifest.permissions = [];
    }

    // Add notifications permission if not present
    if (!manifest.permissions.includes(NOTIFICATIONS_PERMISSION)) {
      manifest.permissions.push(NOTIFICATIONS_PERMISSION);
      updated = true;
      console.log(`  ✓ Added "${NOTIFICATIONS_PERMISSION}" permission`);
    }

    // Write updated manifest
    if (updated) {
      const updatedContent = JSON.stringify(manifest, null, 2);
      fs.writeFileSync(manifestPath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${platform.manifest}\n`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${platform.manifest}\n`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error processing ${platform.manifest}:`, error.message);
    return false;
  }
}

function mergeAllManifests() {
  console.log('🔧 Merging custom scripts into platform manifests...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const platform of PLATFORMS) {
    console.log(`Processing ${platform.name}...`);
    const result = mergeManifest(platform);
    
    if (result === false) {
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`📊 Manifest Merge Summary: ${successCount} successful, ${errorCount} failed`);

  if (errorCount > 0) {
    process.exit(1);
  }

  console.log('✅ Manifest merging complete!\n');
}

// Run manifest merging
mergeAllManifests();
