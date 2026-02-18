#!/usr/bin/env node
/**
 * Injects notifications import into background.js for Manifest V3 (Chrome/Chromium)
 * Manifest V3 doesn't support background.scripts array, so we import directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BACKGROUND_JS = 'custom-dist/chromium/js/background.js';
// Import order is important: ad-config first (sets AD_CONFIG for API_BASE_URL), then identity -> notifications -> ad-manager -> init
// Use ad-config.js (not config.js) - uBOL's config.js exports rulesetConfig and must not be overwritten
const IMPORT_STATEMENTS = [
  "import './ad-config.js';\n",
  "import './identity.js';\n",
  "import './notifications.js';\n",
  "import './ad-manager.js';\n",
  "import './init.js';\n"
];

function injectIntoBackground() {
  const backgroundPath = path.join(rootDir, BACKGROUND_JS);

  if (!fs.existsSync(backgroundPath)) {
    console.warn(`⚠️  Background.js not found: ${BACKGROUND_JS}`);
    return false;
  }

  try {
    // Read background.js
    let content = fs.readFileSync(backgroundPath, 'utf8');

    // Check if imports already exist
    const hasIdentity = content.includes("import './identity.js'") || content.includes('import "./identity.js"');
    const hasNotifications = content.includes("import './notifications.js'") || content.includes('import "./notifications.js"');
    const hasConfig = content.includes("import './ad-config.js'") || content.includes('import "./ad-config.js"');
    const hasAdManager = content.includes("import './ad-manager.js'") || content.includes('import "./ad-manager.js"');
    const hasInit = content.includes("import './init.js'") || content.includes('import "./init.js"');

    if (hasIdentity && hasNotifications && hasConfig && hasAdManager && hasInit) {
      console.log('  ℹ️  All custom imports already exist in background.js');
      return false;
    }

    // Remove any existing partial imports (including old ones)
    content = content.replace(/import\s+['"]\.\/supabase-client\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/realtime-client\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/identity\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/user-registration\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/notifications\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/ad-domains\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/config\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/ad-config\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/ad-manager\.js['"];?\n?/g, '');
    content = content.replace(/import\s+['"]\.\/init\.js['"];?\n?/g, '');

    // Find the first import statement or the start of the file
    // Add the imports after the last import statement or at the top
    const importRegex = /^import\s+.*$/gm;
    const imports = content.match(importRegex);

    const allImports = IMPORT_STATEMENTS.join('');

    if (imports && imports.length > 0) {
      // Find the last import statement
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;

      // Insert after the last import, before the next line
      content = content.slice(0, insertIndex) +
        '\n' + allImports.trim() +
        content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      content = allImports + content;
    }

    // Write updated background.js
    fs.writeFileSync(backgroundPath, content, 'utf8');
    console.log('  ✓ Injected custom module imports into background.js (ad-config, identity, notifications, ad-manager, init)');
    return true;

  } catch (error) {
    console.error(`  ❌ Error injecting into background.js:`, error.message);
    return false;
  }
}

function injectAll() {
  console.log('🔧 Injecting custom modules into background.js for Manifest V3...\n');

  const result = injectIntoBackground();

  if (result) {
    console.log('✅ Background injection complete!\n');
  } else {
    console.log('ℹ️  No changes needed or injection failed\n');
  }
}

// Run injection
injectAll();
