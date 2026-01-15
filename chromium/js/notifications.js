// Custom notification system for uBOL-home
// Polls every 10 seconds (placeholder - will be replaced with Supabase integration)
// This file can be imported as ES module or loaded as standalone script

(function () {
    'use strict';

    // Configuration
    const POLL_INTERVAL_MS = 30000; // 30 seconds - will be replaced with Supabase Realtime
    const NOTIFICATION_PRIORITY = 2; // High priority (0-2)
    const MAX_NOTIFICATIONS = 50; // Prevent notification spam

    // State
    let notificationInterval = null;
    let notificationIdCounter = 0;
    let isInitialized = false;

    // Initialize notification system
    function initNotifications() {
        // Prevent multiple initializations
        if (isInitialized) {
            return;
        }

        // Check if notifications API is available
        if (!chrome.notifications) {
            console.error('[Notifications] API not available');
            return;
        }

        // Check notification permission
        chrome.notifications.getPermissionLevel((level) => {
            if (level === 'denied') {
                console.warn('[Notifications] Permission denied. Enable in browser settings.');
                return;
            }

            // Start polling for notifications
            startNotificationPolling();

            // Register event listeners
            chrome.notifications.onClicked.addListener(handleNotificationClick);
            chrome.notifications.onClosed.addListener(handleNotificationClosed);

            isInitialized = true;
        });
    }

    // Start polling for notifications every 10 seconds
    function startNotificationPolling() {
        // Clear any existing interval
        if (notificationInterval) {
            clearInterval(notificationInterval);
        }

        // Set up interval for periodic notifications
        notificationInterval = setInterval(() => {
            showTestNotification();
        }, POLL_INTERVAL_MS);
    }

    // Get icon URL with fallback
    function getIconUrl() {
        const iconPaths = ['/img/icon_64.png', 'img/icon_64.png', '/img/icon_128.png'];

        for (const iconPath of iconPaths) {
            try {
                const url = chrome.runtime.getURL(iconPath);
                if (url && url.startsWith('chrome-extension://')) {
                    return url;
                }
            } catch (e) {
                continue;
            }
        }
        return null; // Will use default extension icon
    }

    // Show a test notification
    // TODO: Replace with Supabase notification fetching
    function showTestNotification() {
        // Prevent notification spam
        chrome.notifications.getAll((notifications) => {
            const activeCount = Object.keys(notifications || {}).length;
            if (activeCount >= MAX_NOTIFICATIONS) {
                console.warn('[Notifications] Too many active notifications, skipping');
                return;
            }

            const notificationId = `notification-${++notificationIdCounter}`;
            const timestamp = new Date().toLocaleTimeString();
            const iconUrl = getIconUrl();

            const notificationOptions = {
                type: 'basic',
                title: 'uBOL Custom Notification',
                message: `Test notification at ${timestamp}\n\nThis is a placeholder. Future versions will connect to Supabase for real notifications.`,
                priority: NOTIFICATION_PRIORITY,
                requireInteraction: false,
                silent: false
            };

            // Add icon if available
            if (iconUrl) {
                notificationOptions.iconUrl = iconUrl;
            }

            chrome.notifications.create(notificationId, notificationOptions, (createdId) => {
                if (chrome.runtime.lastError) {
                    console.error('[Notifications] Error:', chrome.runtime.lastError.message);

                    // Retry without icon if image loading failed
                    if (chrome.runtime.lastError.message.includes('image') ||
                        chrome.runtime.lastError.message.includes('download')) {
                        delete notificationOptions.iconUrl;
                        chrome.notifications.create(notificationId, notificationOptions);
                    }
                }
            });
        });
    }

    // Handle notification click
    function handleNotificationClick(notificationId) {
        // TODO: Handle notification click - open relevant page or extension popup
        // Example: chrome.tabs.create({ url: 'https://example.com' });
        // Or: chrome.action.openPopup();
    }

    // Handle notification closed
    function handleNotificationClosed(notificationId, byUser) {
        // Cleanup if needed
        // TODO: Mark notification as read in Supabase when integrated
    }

    // Stop notification polling
    function stopNotificationPolling() {
        if (notificationInterval) {
            clearInterval(notificationInterval);
            notificationInterval = null;
            isInitialized = false;
        }
    }

    // Clean up old notifications (prevent accumulation)
    function cleanupOldNotifications() {
        chrome.notifications.getAll((notifications) => {
            const notificationIds = Object.keys(notifications || {});
            if (notificationIds.length > MAX_NOTIFICATIONS) {
                // Clear oldest notifications
                const toRemove = notificationIds.slice(0, notificationIds.length - MAX_NOTIFICATIONS);
                toRemove.forEach(id => chrome.notifications.clear(id));
            }
        });
    }

    // Initialize when extension starts
    if (chrome.runtime && chrome.runtime.onStartup) {
        chrome.runtime.onStartup.addListener(() => {
            initNotifications();
            cleanupOldNotifications();
        });
    }

    // Initialize when extension is installed or updated
    if (chrome.runtime && chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener((details) => {
            initNotifications();
            // Clean up on update
            if (details.reason === 'update') {
                cleanupOldNotifications();
            }
        });
    }

    // Initialize immediately if already running
    if (chrome.runtime && chrome.runtime.id) {
        initNotifications();
        // Clean up old notifications on load
        setTimeout(cleanupOldNotifications, 5000);
    }

    // Periodic cleanup (every 5 minutes)
    setInterval(cleanupOldNotifications, 5 * 60 * 1000);

    // Export for potential external use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initNotifications,
            stopNotificationPolling,
            showTestNotification
        };
    }
})();
