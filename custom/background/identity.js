// Hardware ID generation and hashing for uBOL-home
// Generates a unique ID, stores it permanently, and hashes with SHA-512

(function () {
    'use strict';

    const STORAGE_KEY = 'hardwareId';
    let hardwareIdGenerationInProgress = false;
    let hardwareIdGenerationPromise = null;

    /**
     * Generate a random UUID v4
     * @returns {string} UUID string
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Hash a string with SHA-512 using Web Crypto API
     * @param {string} data - Data to hash
     * @returns {Promise<string>} Hex-encoded SHA-512 hash
     */
    async function hashSHA512(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            console.error('[Identity] SHA-512 hashing failed:', error);
            throw error;
        }
    }

    /**
     * Generate hardware ID if it doesn't exist, otherwise retrieve stored one
     * Uses a promise queue to prevent race conditions when called concurrently
     * @returns {Promise<string>} Hardware ID (UUID)
     */
    async function generateHardwareId() {
        // If generation is in progress, wait for it and return the same promise
        if (hardwareIdGenerationInProgress && hardwareIdGenerationPromise) {
            console.log('[Identity] Hardware ID generation in progress, waiting...');
            return hardwareIdGenerationPromise;
        }

        // Mark as in progress and create promise
        hardwareIdGenerationInProgress = true;
        hardwareIdGenerationPromise = new Promise((resolve, reject) => {
            chrome.storage.local.get([STORAGE_KEY], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Identity] Storage error:', chrome.runtime.lastError);
                    hardwareIdGenerationInProgress = false;
                    hardwareIdGenerationPromise = null;
                    reject(chrome.runtime.lastError);
                    return;
                }

                if (result[STORAGE_KEY]) {
                    // Hardware ID already exists
                    console.log('[Identity] Using existing hardware ID');
                    hardwareIdGenerationInProgress = false;
                    hardwareIdGenerationPromise = null;
                    resolve(result[STORAGE_KEY]);
                } else {
                    // Generate new hardware ID
                    const newId = generateUUID();
                    chrome.storage.local.set({ [STORAGE_KEY]: newId }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('[Identity] Failed to store hardware ID:', chrome.runtime.lastError);
                            hardwareIdGenerationInProgress = false;
                            hardwareIdGenerationPromise = null;
                            reject(chrome.runtime.lastError);
                        } else {
                            console.log('[Identity] Generated new hardware ID:', newId);
                            hardwareIdGenerationInProgress = false;
                            hardwareIdGenerationPromise = null;
                            resolve(newId);
                        }
                    });
                }
            });
        });

        return hardwareIdGenerationPromise;
    }

    /**
     * Get stored hardware ID
     * @returns {Promise<string|null>} Hardware ID or null if not found
     */
    async function getHardwareId() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([STORAGE_KEY], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Identity] Storage error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(result[STORAGE_KEY] || null);
            });
        });
    }

    /**
     * Hash hardware ID with SHA-512
     * @param {string} id - Hardware ID to hash
     * @returns {Promise<string>} SHA-512 hash (hex-encoded)
     */
    async function hashHardwareId(id) {
        if (!id) {
            throw new Error('Hardware ID is required for hashing');
        }
        return await hashSHA512(id);
    }

    /**
     * Get hashed hardware ID (used as visitorId)
     * Generates ID if it doesn't exist, then hashes it
     * @returns {Promise<string>} SHA-512 hashed hardware ID
     */
    async function getHashedHardwareId() {
        try {
            const hardwareId = await generateHardwareId();
            const hashedId = await hashHardwareId(hardwareId);
            console.log('[Identity] Hashed hardware ID ready (visitorId)');
            return hashedId;
        } catch (error) {
            console.error('[Identity] Failed to get hashed hardware ID:', error);
            throw error;
        }
    }

    // Export functions for use in other modules
    if (typeof window !== 'undefined') {
        window.identityModule = {
            generateHardwareId,
            getHardwareId,
            hashHardwareId,
            getHashedHardwareId
        };
    }

    // For ES module compatibility
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            generateHardwareId,
            getHardwareId,
            hashHardwareId,
            getHashedHardwareId
        };
    }

    // For direct script execution (IIFE)
    if (typeof globalThis !== 'undefined') {
        globalThis.identityModule = {
            generateHardwareId,
            getHardwareId,
            hashHardwareId,
            getHashedHardwareId
        };
    }

    console.log('[Identity] Module loaded');
})();
