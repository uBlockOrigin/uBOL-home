// Custom notification system for uBOL-home
// Polls every 10 seconds (placeholder - will be replaced with Supabase integration)

(function () {
    'use strict';

    // Notification polling interval (10 seconds)
    const POLL_INTERVAL_MS = 10000;

    let notificationInterval = null;
    let notificationIdCounter = 0;

    // Initialize notification system
    function initNotifications() {
        console.log('[Notifications] Initializing notification system...');

        // Request notification permission
        if (chrome.notifications) {
            // Start polling for notifications
            startNotificationPolling();

            // Listen for notification clicks
            chrome.notifications.onClicked.addListener(handleNotificationClick);

            // Listen for notification closed events
            chrome.notifications.onClosed.addListener(handleNotificationClosed);
        } else {
            console.error('[Notifications] chrome.notifications API not available');
        }
    }

    // Start polling for notifications every 10 seconds
    function startNotificationPolling() {
        // Clear any existing interval
        if (notificationInterval) {
            clearInterval(notificationInterval);
        }

        // Show initial notification
        showTestNotification();

        // Set up interval for periodic notifications
        notificationInterval = setInterval(() => {
            showTestNotification();
        }, POLL_INTERVAL_MS);

        console.log(`[Notifications] Started polling every ${POLL_INTERVAL_MS / 1000} seconds`);
    }

    // Show a test notification
    function showTestNotification() {
        const notificationId = `notification-${++notificationIdCounter}`;
        const timestamp = new Date().toLocaleTimeString();

        const notificationOptions = {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('img/icon_64.png'),
            title: 'uBOL Custom Notification',
            message: `Test notification at ${timestamp}\n\nThis is a placeholder notification. Future versions will connect to Supabase for real notifications.`,
            priority: 1
        };

        chrome.notifications.create(notificationId, notificationOptions, (createdId) => {
            if (chrome.runtime.lastError) {
                console.error('[Notifications] Error creating notification:', chrome.runtime.lastError.message);
            } else {
                console.log(`[Notifications] Notification created: ${createdId} at ${timestamp}`);
            }
        });
    }

    // Handle notification click
    function handleNotificationClick(notificationId) {
        console.log(`[Notifications] Notification clicked: ${notificationId}`);

        // Optional: Open extension popup or specific URL
        // chrome.action.openPopup();
        // or
        // chrome.tabs.create({ url: 'https://example.com' });
    }

    // Handle notification closed
    function handleNotificationClosed(notificationId, byUser) {
        console.log(`[Notifications] Notification closed: ${notificationId}, byUser: ${byUser}`);
    }

    // Stop notification polling
    function stopNotificationPolling() {
        if (notificationInterval) {
            clearInterval(notificationInterval);
            notificationInterval = null;
            console.log('[Notifications] Stopped polling');
        }
    }

    // Initialize when extension starts
    if (chrome.runtime && chrome.runtime.onStartup) {
        chrome.runtime.onStartup.addListener(() => {
            console.log('[Notifications] Extension started, initializing notifications...');
            initNotifications();
        });
    }

    // Initialize when extension is installed or updated
    if (chrome.runtime && chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('[Notifications] Extension installed/updated:', details.reason);
            initNotifications();
        });
    }

    // Initialize immediately if already running
    if (chrome.runtime && chrome.runtime.id) {
        initNotifications();
    }

    // Export for potential external use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initNotifications,
            stopNotificationPolling,
            showTestNotification
        };
    }
})();
