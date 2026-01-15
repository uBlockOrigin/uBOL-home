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

const BACKGROUND_JS = 'chromium/js/background.js';
const IMPORT_STATEMENT = "import './notifications.js';\n";

function injectIntoBackground() {
  const backgroundPath = path.join(rootDir, BACKGROUND_JS);
  
  if (!fs.existsSync(backgroundPath)) {
    console.warn(`⚠️  Background.js not found: ${BACKGROUND_JS}`);
    return false;
  }

  try {
    // Read background.js
    let content = fs.readFileSync(backgroundPath, 'utf8');
    
    // Check if import already exists
    if (content.includes("import './notifications.js'") || 
        content.includes('import "./notifications.js"') ||
        content.includes("import './js/notifications.js'") ||
        content.includes('import "./js/notifications.js"')) {
      console.log('  ℹ️  Notifications import already exists in background.js');
      return false;
    }

    // Find the first import statement or the start of the file
    // Add the import after the last import statement or at the top
    const importRegex = /^import\s+.*$/gm;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      // Find the last import statement
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      // Insert after the last import, before the next line
      content = content.slice(0, insertIndex) + 
                '\n' + IMPORT_STATEMENT.trim() + 
                content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      content = IMPORT_STATEMENT + content;
    }

    // Write updated background.js
    fs.writeFileSync(backgroundPath, content, 'utf8');
    console.log('  ✓ Injected notifications import into background.js');
    return true;

  } catch (error) {
    console.error(`  ❌ Error injecting into background.js:`, error.message);
    return false;
  }
}

function injectAll() {
  console.log('🔧 Injecting notifications into background.js for Manifest V3...\n');
  
  const result = injectIntoBackground();
  
  if (result) {
    console.log('✅ Background injection complete!\n');
  } else {
    console.log('ℹ️  No changes needed or injection failed\n');
  }
}

// Run injection
injectAll();
