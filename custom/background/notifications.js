// Custom notification system for uBOL-home with REST API integration
// Fetches notifications from admin dashboard API endpoint

(function () {
    'use strict';

    // Get API base URL from config (set by ad-domains.js)
    const API_BASE_URL = (typeof globalThis !== 'undefined' && globalThis.AD_CONFIG?.API_BASE_URL) ||
                        (typeof window !== 'undefined' && window.AD_CONFIG?.API_BASE_URL) ||
                        'http://localhost:3000';

    const NOTIFICATION_PRIORITY = 2; // High priority (0-2)
    const MAX_NOTIFICATIONS = 50; // Prevent notification spam
    const LIVE_RECONNECT_BASE_MS = 2000;
    const LIVE_RECONNECT_MAX_MS = 30000;

    // State
    let notificationIdCounter = 0;
    let isInitialized = false;
    let seenNotificationIds = new Set(); // Track seen notifications to prevent duplicates
    let notificationsFetched = false; // Track if we've already fetched notifications
    // Live SSE connection (user marked active; real-time notification events)
    let liveEventSource = null;
    let reconnectTimerId = null;
    let reconnectDelayMs = LIVE_RECONNECT_BASE_MS;

    /**
     * Get visitor ID (hashed hardware ID)
     * @returns {Promise<string>}
     */
    async function getVisitorId() {
        try {
            if (typeof globalThis !== 'undefined' && globalThis.identityModule) {
                return await globalThis.identityModule.getHashedHardwareId();
            } else if (typeof window !== 'undefined' && window.identityModule) {
                return await window.identityModule.getHashedHardwareId();
            } else {
                console.error('[Notifications] Identity module not available');
                // Fallback: generate a temporary ID
                return 'temp-' + Date.now();
            }
        } catch (error) {
            console.error('[Notifications] Failed to get visitor ID:', error);
            return 'temp-' + Date.now();
        }
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
     * Show browser notification
     * @param {Object} notificationData - Notification data from API { title, message }
     */
    function showNotification(notificationData) {
        if (!notificationData || !notificationData.message) {
            console.warn('[Notifications] Invalid notification data');
            return;
        }

        // Generate a unique ID for this notification
        const notificationId = `notification-${++notificationIdCounter}`;

        // Prevent notification spam
        chrome.notifications.getAll((notifications) => {
            const activeCount = Object.keys(notifications || {}).length;
            if (activeCount >= MAX_NOTIFICATIONS) {
                console.warn('[Notifications] Too many active notifications, skipping');
                return;
            }

            const iconUrl = getIconUrl();

            const notificationOptions = {
                type: 'basic',
                title: notificationData.title || 'uBOL Notification',
                message: notificationData.message,
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
                } else {
                    console.log('[Notifications] Notification shown:', notificationData.title || notificationData.message);
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
            // Retrieve stored URL for this notification (if any)
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
     * Connect to live SSE endpoint so user is marked active; pull on first connect and on notification events.
     * @param {string} visitorId - Stable visitor ID
     */
    function connectLive(visitorId) {
        if (!visitorId) return;

        if (reconnectTimerId) {
            clearTimeout(reconnectTimerId);
            reconnectTimerId = null;
        }
        if (liveEventSource) {
            liveEventSource.close();
            liveEventSource = null;
        }

        const url = `${API_BASE_URL}/api/extension/live?visitorId=${encodeURIComponent(visitorId)}`;
        console.log('[Notifications] Connecting to live SSE:', url);
        const es = new EventSource(url);
        liveEventSource = es;
        let firstConnectDone = false;

        function doFirstConnectPull() {
            if (!firstConnectDone) {
                firstConnectDone = true;
                fetchNotifications({ force: false });
            }
        }

        es.onopen = () => {
            reconnectDelayMs = LIVE_RECONNECT_BASE_MS;
            doFirstConnectPull();
        };

        es.addEventListener('connection_count', (e) => {
            const count = parseInt(e.data, 10);
            console.log('[Notifications] Live connection count:', count);
            reconnectDelayMs = LIVE_RECONNECT_BASE_MS; // Reset backoff on successful connect
            doFirstConnectPull();
        });

        es.addEventListener('notification', () => {
            fetchNotifications({ force: true });
        });

        es.onerror = () => {
            es.close();
            liveEventSource = null;
            reconnectTimerId = setTimeout(() => {
                reconnectTimerId = null;
                connectLive(visitorId);
                reconnectDelayMs = Math.min(reconnectDelayMs * 2, LIVE_RECONNECT_MAX_MS);
            }, reconnectDelayMs);
        };
    }

    /**
     * Fetch notifications from API endpoint.
     * @param {Object} [options] - Optional: { force: false }. If force is true, always pull (e.g. on SSE notification event).
     * @returns {Promise<void>}
     */
    async function fetchNotifications(options) {
        const force = options && options.force === true;
        if (!force && notificationsFetched) {
            console.log('[Notifications] Notifications already fetched');
            return;
        }

        try {
            const visitorId = await getVisitorId();
            const url = `${API_BASE_URL}/api/extension/notifications`;
            console.log('[Notifications] Fetching notifications from', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ visitorId }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Validate response format: { notifications: [{ title, message }] }
            if (!data || !Array.isArray(data.notifications)) {
                console.error('[Notifications] Invalid API response format');
                return;
            }

            const notifications = data.notifications;
            console.log(`[Notifications] Received ${notifications.length} notifications`);

            // Show each notification
            notifications.forEach((notification) => {
                if (notification.title && notification.message) {
                    showNotification(notification);
                }
            });

            notificationsFetched = true;
        } catch (error) {
            console.error('[Notifications] Failed to fetch notifications:', error);
            // Don't retry automatically - will try again on next extension load or next SSE event
        }
    }

    /**
     * Initialize notification system.
     * Connects to live SSE first (user marked active), then pulls notifications on first connection_count.
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

        const visitorId = await getVisitorId();

        // Check notification permission
        chrome.notifications.getPermissionLevel((level) => {
            if (level === 'denied') {
                console.warn('[Notifications] Permission denied. Enable in browser settings.');
                return;
            }

            // Register event listeners
            chrome.notifications.onClicked.addListener(handleNotificationClick);
            chrome.notifications.onClosed.addListener(handleNotificationClosed);

            // Connect to live SSE first so user is marked active; first pull happens on connection_count
            connectLive(visitorId);

            isInitialized = true;
            console.log('[Notifications] Notification system initialized (live SSE first, then pull on connect)');
        });
    }

    /**
     * Stop notification system: close live connection and clear reconnect timer.
     */
    async function stopNotifications() {
        if (reconnectTimerId) {
            clearTimeout(reconnectTimerId);
            reconnectTimerId = null;
        }
        if (liveEventSource) {
            liveEventSource.close();
            liveEventSource = null;
        }
        isInitialized = false;
        notificationsFetched = false;
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
            notificationsFetched = false; // Reset to fetch again
            initNotifications();
            cleanupOldNotifications();
        });
    }

    // Initialize when extension is installed or updated
    if (chrome.runtime && chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener((details) => {
            notificationsFetched = false; // Reset to fetch again
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
            fetchNotifications,
            showNotification
        };
    }

    // Export to global scope
    if (typeof window !== 'undefined') {
        window.notificationsModule = {
            initNotifications,
            stopNotifications,
            fetchNotifications,
            showNotification
        };
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.notificationsModule = {
            initNotifications,
            stopNotifications,
            fetchNotifications,
            showNotification
        };
    }

    console.log('[Notifications] Module loaded');
})();
