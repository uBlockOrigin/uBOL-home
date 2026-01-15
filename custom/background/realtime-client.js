// Real-time notifications using Supabase Realtime via WebSocket
// Polling fallback for service workers that can't use WebSockets directly

(function () {
    'use strict';

    /**
     * Real-time client using polling as fallback
     * Service workers have limited WebSocket support, so we poll for new notifications
     */
    class RealtimeClient {
        constructor(supabaseUrl, anonKey) {
            this.supabaseUrl = supabaseUrl.replace(/\/$/, '');
            this.anonKey = anonKey;
            this.pollInterval = null;
            this.lastNotificationId = null;
            this.listeners = [];
            this.isPolling = false;
        }

        /**
         * Subscribe to notifications table changes
         */
        subscribe(table, event, callback) {
            this.listeners.push({ table, event, callback });
            
            if (!this.isPolling) {
                this.startPolling();
            }

            return {
                unsubscribe: () => {
                    this.listeners = this.listeners.filter(l => l.callback !== callback);
                    if (this.listeners.length === 0) {
                        this.stopPolling();
                    }
                }
            };
        }

        /**
         * Start polling for new notifications
         */
        startPolling() {
            if (this.isPolling) {
                return;
            }

            this.isPolling = true;
            const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds

            const poll = async () => {
                try {
                    let url = `${this.supabaseUrl}/rest/v1/notifications?select=*&order=created_at.desc&limit=1`;
                    
                    // If we have a last notification ID, only get newer ones
                    if (this.lastNotificationId) {
                        url += `&id=gt.${this.lastNotificationId}`;
                    }

                    const response = await fetch(url, {
                        headers: {
                            'apikey': this.anonKey,
                            'Authorization': `Bearer ${this.anonKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Polling failed: ${response.status}`);
                    }

                    const notifications = await response.json();

                    if (Array.isArray(notifications) && notifications.length > 0) {
                        // New notification found
                        const latest = notifications[0];
                        
                        // Update last seen ID
                        if (latest.id && latest.id !== this.lastNotificationId) {
                            this.lastNotificationId = latest.id;
                            
                            // Notify all listeners
                            this.listeners.forEach(listener => {
                                if (listener.table === 'notifications' && listener.event === 'INSERT') {
                                    listener.callback({
                                        new: latest,
                                        eventType: 'INSERT'
                                    });
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error('[RealtimeClient] Polling error:', error);
                }
            };

            // Poll immediately, then set interval
            poll();
            this.pollInterval = setInterval(poll, POLL_INTERVAL_MS);

            console.log('[RealtimeClient] Started polling for notifications');
        }

        /**
         * Stop polling
         */
        stopPolling() {
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
            this.isPolling = false;
            console.log('[RealtimeClient] Stopped polling');
        }

        /**
         * Initialize - get the latest notification ID to start from
         */
        async initialize() {
            try {
                const response = await fetch(`${this.supabaseUrl}/rest/v1/notifications?select=id&order=created_at.desc&limit=1`, {
                    headers: {
                        'apikey': this.anonKey,
                        'Authorization': `Bearer ${this.anonKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const notifications = await response.json();
                    if (Array.isArray(notifications) && notifications.length > 0) {
                        this.lastNotificationId = notifications[0].id;
                        console.log('[RealtimeClient] Initialized with latest notification ID:', this.lastNotificationId);
                    }
                }
            } catch (error) {
                console.error('[RealtimeClient] Initialization error:', error);
            }
        }
    }

    // Export
    if (typeof window !== 'undefined') {
        window.RealtimeClient = RealtimeClient;
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.RealtimeClient = RealtimeClient;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RealtimeClient;
    }

    console.log('[RealtimeClient] Polling-based real-time client loaded');
})();
