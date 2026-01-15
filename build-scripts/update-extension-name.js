#!/usr/bin/env node
/**
 * Update extension name to "duck" in all locale files
 * 
 * Usage:
 *   node update-extension-name.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get uBOL-home root
const UBOL_HOME_ROOT = path.resolve(__dirname, '..');

/**
 * Find all messages.json files
 */
function findMessagesFiles(rootDir) {
    const messagesFiles = [];

    function walkDir(dir) {
        if (!fs.existsSync(dir)) {
            return;
        }

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules, .git
            if (entry.isDirectory()) {
                const dirName = entry.name;
                if (dirName === 'node_modules' || dirName === '.git') {
                    continue;
                }
                walkDir(fullPath);
            } else if (entry.isFile() && entry.name === 'messages.json') {
                messagesFiles.push(fullPath);
            }
        }
    }

    walkDir(rootDir);
    return messagesFiles;
}

/**
 * Update extension name in a messages.json file
 */
function updateExtensionName(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const messages = JSON.parse(content);

        // Only update extName if it exists
        if (messages.extName && messages.extName.message) {
            const oldName = messages.extName.message;
            messages.extName.message = 'duck';

            // Write back
            const updatedContent = JSON.stringify(messages, null, 2) + '\n';
            fs.writeFileSync(filePath, updatedContent, 'utf8');

            return { updated: true, oldName };
        }

        return { updated: false };
    } catch (error) {
        return { updated: false, error: error.message };
    }
}

/**
 * Main function
 */
function main() {
    console.log(`📁 Searching for messages.json files in: ${UBOL_HOME_ROOT}\n`);

    // Find all messages.json files
    const messagesFiles = findMessagesFiles(UBOL_HOME_ROOT);

    if (messagesFiles.length === 0) {
        console.log('⚠️  No messages.json files found!');
        process.exit(0);
    }

    console.log(`📋 Found ${messagesFiles.length} messages.json file(s)\n`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each file
    for (const filePath of messagesFiles) {
        const result = updateExtensionName(filePath);
        const relativePath = path.relative(UBOL_HOME_ROOT, filePath);

        if (result.error) {
            console.error(`❌ ${relativePath}: ${result.error}`);
            errorCount++;
        } else if (result.updated) {
            console.log(`✅ ${relativePath} (${result.oldName} → duck)`);
            successCount++;
        } else {
            console.log(`⏭️  ${relativePath} (no extName found)`);
            skippedCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    if (skippedCount > 0) {
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
    }
    if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount}`);
        process.exit(1);
    }
    console.log(`\n🎉 All extension names updated to "duck"!`);
}

// Run main function
main();
