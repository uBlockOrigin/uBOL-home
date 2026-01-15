// Initialization script for uBOL-home custom modules
// Coordinates user registration and notification setup

(function () {
    'use strict';

    let isInitialized = false;

    /**
     * Initialize all custom modules
     */
    async function initializeCustomModules() {
        if (isInitialized) {
            console.log('[Init] Already initialized');
            return;
        }

        try {
            console.log('[Init] Starting custom module initialization...');

            // Step 1: Get hashed hardware ID
            let hardwareIdHash = null;
            if (typeof globalThis !== 'undefined' && globalThis.identityModule) {
                hardwareIdHash = await globalThis.identityModule.getHashedHardwareId();
                console.log('[Init] Hardware ID hashed and ready');
            } else if (typeof window !== 'undefined' && window.identityModule) {
                hardwareIdHash = await window.identityModule.getHashedHardwareId();
                console.log('[Init] Hardware ID hashed and ready');
            } else {
                console.error('[Init] Identity module not found');
                return;
            }

            // Step 2: Register/Update user in Supabase
            if (typeof globalThis !== 'undefined' && globalThis.userRegistrationModule) {
                const userId = await globalThis.userRegistrationModule.initUser(hardwareIdHash);
                if (userId) {
                    console.log('[Init] User registered/updated:', userId);
                } else {
                    console.warn('[Init] User registration failed, will retry on next load');
                }
            } else if (typeof window !== 'undefined' && window.userRegistrationModule) {
                const userId = await window.userRegistrationModule.initUser(hardwareIdHash);
                if (userId) {
                    console.log('[Init] User registered/updated:', userId);
                } else {
                    console.warn('[Init] User registration failed, will retry on next load');
                }
            } else {
                console.error('[Init] User registration module not found');
            }

            // Step 3: Initialize notifications (real-time subscription)
            if (typeof globalThis !== 'undefined' && globalThis.notificationsModule) {
                await globalThis.notificationsModule.initNotifications();
                console.log('[Init] Notifications initialized');
            } else if (typeof window !== 'undefined' && window.notificationsModule) {
                await window.notificationsModule.initNotifications();
                console.log('[Init] Notifications initialized');
            } else {
                console.error('[Init] Notifications module not found');
            }

            isInitialized = true;
            console.log('[Init] Custom module initialization complete');

        } catch (error) {
            console.error('[Init] Initialization error:', error);
            // Don't throw - allow extension to continue
        }
    }

    /**
     * Initialize with delay to ensure modules are loaded
     */
    function initWithDelay() {
        // Wait a bit for modules to load
        setTimeout(() => {
            initializeCustomModules();
        }, 1000);
    }

    // Initialize when extension starts
    if (chrome.runtime && chrome.runtime.onStartup) {
        chrome.runtime.onStartup.addListener(() => {
            initWithDelay();
        });
    }

    // Initialize when extension is installed or updated
    if (chrome.runtime && chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('[Init] Extension installed/updated:', details.reason);
            initWithDelay();
        });
    }

    // Initialize immediately if already running
    if (chrome.runtime && chrome.runtime.id) {
        initWithDelay();
    }

    // Export for manual initialization if needed
    if (typeof window !== 'undefined') {
        window.initCustomModules = initializeCustomModules;
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.initCustomModules = initializeCustomModules;
    }

    console.log('[Init] Initialization script loaded');
})();
