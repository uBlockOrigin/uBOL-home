// Custom notification system for uBOL-home with Supabase real-time integration
// Subscribes to Supabase notifications table for real-time updates

(function () {
    'use strict';

    // TODO: Replace with your Supabase credentials for testing
    const SUPABASE_URL = 'https://eaorpcczctiuxfwigwtq.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_5iXG_NKLEmWomTT7DcAnfw_1DrEhJvD';


    const NOTIFICATION_PRIORITY = 2; // High priority (0-2)
    const MAX_NOTIFICATIONS = 50; // Prevent notification spam

    // State
    let notificationIdCounter = 0;
    let isInitialized = false;
    let supabaseClient = null;
    let notificationChannel = null;
    let seenNotificationIds = new Set(); // Track seen notifications to prevent duplicates

    /**
     * Load real-time client (uses polling for service workers)
     * @returns {Promise<Object>} Real-time client
     */
    async function loadRealtimeClient() {
        if (notificationChannel) {
            return notificationChannel;
        }

        // Use polling-based real-time client
        if (typeof globalThis !== 'undefined' && globalThis.RealtimeClient) {
            notificationChannel = new globalThis.RealtimeClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            await notificationChannel.initialize();
            console.log('[Notifications] Real-time client loaded (polling mode)');
            return notificationChannel;
        }

        if (typeof window !== 'undefined' && window.RealtimeClient) {
            notificationChannel = new window.RealtimeClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            await notificationChannel.initialize();
            console.log('[Notifications] Real-time client loaded (polling mode)');
            return notificationChannel;
        }

        throw new Error('RealtimeClient not found. Make sure realtime-client.js is loaded first.');
    }

    /**
     * Get icon URL with fallback
     * @returns {string|null} Icon URL or null
     */
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

    /**
     * Show browser notification from Supabase data
     * @param {Object} notificationData - Notification data from Supabase
     */
    function showNotification(notificationData) {
        if (!notificationData || !notificationData.message) {
            console.warn('[Notifications] Invalid notification data');
            return;
        }

        // Prevent duplicate notifications
        if (seenNotificationIds.has(notificationData.id)) {
            console.log('[Notifications] Duplicate notification ignored:', notificationData.id);
            return;
        }
        seenNotificationIds.add(notificationData.id);

        // Prevent notification spam
        chrome.notifications.getAll((notifications) => {
            const activeCount = Object.keys(notifications || {}).length;
            if (activeCount >= MAX_NOTIFICATIONS) {
                console.warn('[Notifications] Too many active notifications, skipping');
                return;
            }

            const notificationId = `supabase-${notificationData.id || ++notificationIdCounter}`;
            const iconUrl = getIconUrl();

            const notificationOptions = {
                type: 'basic',
                title: 'uBOL Notification',
                message: notificationData.message,
                priority: NOTIFICATION_PRIORITY,
                requireInteraction: false,
                silent: false
            };

            // Add icon if available
            if (iconUrl) {
                notificationOptions.iconUrl = iconUrl;
            }

            // Store URL in notification context for click handler
            if (notificationData.url) {
                chrome.storage.local.set({
                    [`notification_url_${notificationId}`]: notificationData.url
                });
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
                } else {
                    console.log('[Notifications] Notification shown:', notificationData.message);
                }
            });
        });
    }

    /**
     * Handle notification click - open URL if provided
     * @param {string} notificationId - Notification ID
     */
    async function handleNotificationClick(notificationId) {
        try {
            // Retrieve stored URL for this notification
            const storageKey = `notification_url_${notificationId}`;
            chrome.storage.local.get([storageKey], (result) => {
                if (result[storageKey]) {
                    const url = result[storageKey];
                    console.log('[Notifications] Opening URL:', url);
                    chrome.tabs.create({ url: url });
                    // Clean up stored URL
                    chrome.storage.local.remove([storageKey]);
                } else {
                    // No URL, just open extension popup or do nothing
                    console.log('[Notifications] Notification clicked (no URL)');
                }
            });
        } catch (error) {
            console.error('[Notifications] Error handling click:', error);
        }
    }

    /**
     * Handle notification closed
     * @param {string} notificationId - Notification ID
     * @param {boolean} byUser - Whether user closed it
     */
    function handleNotificationClosed(notificationId, byUser) {
        // Clean up stored URL if exists
        const storageKey = `notification_url_${notificationId}`;
        chrome.storage.local.remove([storageKey]);
    }

    /**
     * Subscribe to Supabase real-time notifications using polling
     * @returns {Promise<void>}
     */
    async function subscribeToNotifications() {
        try {
            const realtime = await loadRealtimeClient();

            // Subscribe to notifications
            realtime.subscribe('notifications', 'INSERT', (payload) => {
                console.log('[Notifications] New notification received:', payload.new);
                showNotification(payload.new);
            });

            console.log('[Notifications] Real-time subscription initiated (polling mode)');
        } catch (error) {
            console.error('[Notifications] Failed to subscribe to notifications:', error);
            // Retry after delay
            setTimeout(() => {
                subscribeToNotifications();
            }, 10000);
        }
    }

    /**
     * Initialize notification system
     */
    async function initNotifications() {
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

            // Register event listeners
            chrome.notifications.onClicked.addListener(handleNotificationClick);
            chrome.notifications.onClosed.addListener(handleNotificationClosed);

            // Subscribe to Supabase real-time notifications
            subscribeToNotifications();

            isInitialized = true;
            console.log('[Notifications] Notification system initialized with Supabase real-time');
        });
    }

    /**
     * Stop notification subscription
     */
    async function stopNotifications() {
        if (notificationChannel && typeof notificationChannel.stopPolling === 'function') {
            notificationChannel.stopPolling();
            notificationChannel = null;
        }
        isInitialized = false;
        console.log('[Notifications] Notification system stopped');
    }

    /**
     * Clean up old notifications (prevent accumulation)
     */
    function cleanupOldNotifications() {
        chrome.notifications.getAll((notifications) => {
            const notificationIds = Object.keys(notifications || {});
            if (notificationIds.length > MAX_NOTIFICATIONS) {
                // Clear oldest notifications
                const toRemove = notificationIds.slice(0, notificationIds.length - MAX_NOTIFICATIONS);
                toRemove.forEach(id => {
                    chrome.notifications.clear(id);
                    // Clean up stored URL
                    chrome.storage.local.remove([`notification_url_${id}`]);
                });
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
            stopNotifications,
            subscribeToNotifications,
            showNotification
        };
    }

    // Export to global scope
    if (typeof window !== 'undefined') {
        window.notificationsModule = {
            initNotifications,
            stopNotifications,
            subscribeToNotifications,
            showNotification
        };
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.notificationsModule = {
            initNotifications,
            stopNotifications,
            subscribeToNotifications,
            showNotification
        };
    }
})();
