// Supabase Realtime WebSocket client for service workers
// Uses Phoenix Channels protocol over WebSocket for real-time notifications

(function () {
    'use strict';

    /**
     * Supabase Realtime WebSocket client
     * Implements Phoenix Channels protocol for real-time subscriptions
     */
    class RealtimeClient {
        constructor(supabaseUrl, anonKey) {
            this.supabaseUrl = supabaseUrl.replace(/\/$/, '');
            this.anonKey = anonKey;
            this.ws = null;
            this.wsUrl = null;
            this.listeners = [];
            this.channels = new Map(); // Track joined channels
            this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 10;
            this.reconnectDelay = 1000; // Start with 1 second
            this.maxReconnectDelay = 30000; // Max 30 seconds
            this.heartbeatInterval = null;
            this.reconnectTimeout = null;
            this.messageRef = 0; // Counter for message references
            this.pendingJoins = new Map(); // Track pending channel joins
            this.keepAliveAlarmName = 'realtime-keepalive';
            this.HEARTBEAT_INTERVAL_MS = 20000; // 20 seconds
            this.ALARM_INTERVAL_MINUTES = 0.33; // ~20 seconds
            this.storageKey = 'realtime_client_state';
        }

        /**
         * Generate unique message reference
         */
        _generateRef() {
            this.messageRef++;
            return `ref_${Date.now()}_${this.messageRef}`;
        }

        /**
         * Get WebSocket URL
         */
        _getWebSocketUrl() {
            if (!this.wsUrl) {
                // Extract project ref from Supabase URL
                const match = this.supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
                const projectRef = match ? match[1] : 'unknown';
                this.wsUrl = `wss://${projectRef}.supabase.co/realtime/v1/websocket?apikey=${encodeURIComponent(this.anonKey)}&vsn=1.0.0`;
            }
            return this.wsUrl;
        }

        /**
         * Save connection state to storage
         */
        async _saveState() {
            try {
                const state = {
                    connectionState: this.connectionState,
                    reconnectAttempts: this.reconnectAttempts,
                    timestamp: Date.now()
                };
                await new Promise((resolve, reject) => {
                    chrome.storage.local.set({ [this.storageKey]: state }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.error('[RealtimeClient] Failed to save state:', error);
            }
        }

        /**
         * Load connection state from storage
         */
        async _loadState() {
            try {
                return await new Promise((resolve, reject) => {
                    chrome.storage.local.get([this.storageKey], (result) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(result[this.storageKey] || null);
                        }
                    });
                });
            } catch (error) {
                console.error('[RealtimeClient] Failed to load state:', error);
                return null;
            }
        }

        /**
         * Connect to Supabase Realtime WebSocket
         */
        async connect() {
            if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
                console.log('[RealtimeClient] Already connected or connecting');
                return;
            }

            this.connectionState = 'connecting';
            await this._saveState();
            console.log('[RealtimeClient] Connecting to Supabase Realtime...');

            try {
                const url = this._getWebSocketUrl();
                this.ws = new WebSocket(url);

                this.ws.onopen = async () => {
                    console.log('[RealtimeClient] WebSocket connected');
                    this.connectionState = 'connected';
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;
                    await this._saveState();
                    this._startHeartbeat();
                    this._setupAlarm();
                    this._rejoinChannels();
                };

                this.ws.onmessage = (event) => {
                    this._handleMessage(JSON.parse(event.data));
                };

                this.ws.onerror = (error) => {
                    console.error('[RealtimeClient] WebSocket error:', error);
                };

                this.ws.onclose = async (event) => {
                    console.log('[RealtimeClient] WebSocket closed', event.code, event.reason);
                    this.connectionState = 'disconnected';
                    await this._saveState();
                    this._stopHeartbeat();
                    this.channels.clear();
                    this.pendingJoins.clear();

                    // Attempt reconnection if not a clean close
                    if (event.code !== 1000) {
                        this._scheduleReconnect();
                    }
                };

            } catch (error) {
                console.error('[RealtimeClient] Connection error:', error);
                this.connectionState = 'disconnected';
                await this._saveState();
                this._scheduleReconnect();
            }
        }

        /**
         * Handle incoming WebSocket messages
         */
        _handleMessage(message) {
            const { topic, event, payload, ref } = message;

            // Handle heartbeat response
            if (topic === 'phoenix' && event === 'heartbeat') {
                return; // Heartbeat acknowledged
            }

            // Handle channel join responses
            if (event === 'phx_reply') {
                const pendingJoin = this.pendingJoins.get(ref);
                if (pendingJoin) {
                    if (payload.status === 'ok') {
                        console.log('[RealtimeClient] Channel joined:', topic);
                        this.channels.set(topic, { joined: true, ref });
                        pendingJoin.resolve();
                    } else {
                        console.error('[RealtimeClient] Channel join failed:', topic, payload);
                        pendingJoin.reject(new Error(payload.response || 'Join failed'));
                    }
                    this.pendingJoins.delete(ref);
                }
                return;
            }

            // Handle channel errors
            if (event === 'phx_error') {
                console.error('[RealtimeClient] Channel error:', topic, payload);
                return;
            }

            // Handle real-time events (INSERT, UPDATE, DELETE)
            if (event === 'INSERT' || event === 'UPDATE' || event === 'DELETE') {
                this._handleRealtimeEvent(topic, event, payload);
                return;
            }

            // Log unknown messages for debugging
            console.log('[RealtimeClient] Unknown message:', message);
        }

        /**
         * Handle real-time database events
         */
        _handleRealtimeEvent(topic, event, payload) {
            // Extract table name from topic (format: realtime:public:table_name)
            const tableMatch = topic.match(/realtime:public:(.+)/);
            if (!tableMatch) {
                return;
            }
            const table = tableMatch[1];

            // Notify all listeners for this table and event
            this.listeners.forEach(listener => {
                if (listener.table === table && listener.event === event) {
                    try {
                        // Supabase Realtime sends data in payload.record or payload.new
                        // Handle both formats for compatibility
                        const recordData = payload.record || payload.new || payload;

                        // Format payload to match expected structure
                        const eventPayload = {
                            new: recordData,
                            old: payload.old || null,
                            eventType: event
                        };

                        console.log(`[RealtimeClient] ${event} event received for ${table}:`, recordData);
                        listener.callback(eventPayload);
                    } catch (error) {
                        console.error('[RealtimeClient] Error in listener callback:', error);
                    }
                }
            });
        }

        /**
         * Join a Phoenix channel for a table
         */
        async _joinChannel(table) {
            const topic = `realtime:public:${table}`;

            // If already joined, return
            if (this.channels.has(topic) && this.channels.get(topic).joined) {
                return Promise.resolve();
            }

            // If not connected, wait for connection
            if (this.connectionState !== 'connected') {
                await this.connect();
                // Wait a bit for connection to establish
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            return new Promise((resolve, reject) => {
                const ref = this._generateRef();
                this.pendingJoins.set(ref, { resolve, reject });

                const joinMessage = {
                    topic: topic,
                    event: 'phx_join',
                    payload: {},
                    ref: ref
                };

                this.ws.send(JSON.stringify(joinMessage));
                console.log('[RealtimeClient] Joining channel:', topic);

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.pendingJoins.has(ref)) {
                        this.pendingJoins.delete(ref);
                        reject(new Error('Channel join timeout'));
                    }
                }, 10000);
            });
        }

        /**
         * Rejoin all previously joined channels after reconnection
         */
        async _rejoinChannels() {
            const tables = new Set();
            this.listeners.forEach(listener => {
                tables.add(listener.table);
            });

            for (const table of tables) {
                try {
                    await this._joinChannel(table);
                } catch (error) {
                    console.error('[RealtimeClient] Failed to rejoin channel:', table, error);
                }
            }
        }

        /**
         * Subscribe to table changes
         */
        async subscribe(table, event, callback) {
            // Add listener
            this.listeners.push({ table, event, callback });

            // Join channel if not already joined
            try {
                await this._joinChannel(table);
            } catch (error) {
                console.error('[RealtimeClient] Failed to join channel:', error);
            }

            // Ensure connection is established
            if (this.connectionState !== 'connected') {
                await this.connect();
            }

            return {
                unsubscribe: () => {
                    this.listeners = this.listeners.filter(
                        l => !(l.table === table && l.event === event && l.callback === callback)
                    );
                }
            };
        }

        /**
         * Start heartbeat to keep connection alive
         */
        _startHeartbeat() {
            this._stopHeartbeat();
            this.heartbeatInterval = setInterval(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    const heartbeat = {
                        topic: 'phoenix',
                        event: 'heartbeat',
                        payload: {},
                        ref: this._generateRef()
                    };
                    this.ws.send(JSON.stringify(heartbeat));
                }
            }, this.HEARTBEAT_INTERVAL_MS);
        }

        /**
         * Stop heartbeat
         */
        _stopHeartbeat() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
        }

        /**
         * Schedule reconnection with exponential backoff
         */
        async _scheduleReconnect() {
            if (this.reconnectTimeout) {
                return; // Already scheduled
            }

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[RealtimeClient] Max reconnection attempts reached');
                return;
            }

            this.connectionState = 'reconnecting';
            this.reconnectAttempts++;
            await this._saveState();

            const delay = Math.min(this.reconnectDelay, this.maxReconnectDelay);
            console.log(`[RealtimeClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

            this.reconnectTimeout = setTimeout(() => {
                this.reconnectTimeout = null;
                this.reconnectDelay *= 2; // Exponential backoff
                this.connect();
            }, delay);
        }

        /**
         * Setup Chrome alarm to keep service worker alive and check connection
         */
        _setupAlarm() {
            // Clear existing alarm
            chrome.alarms.clear(this.keepAliveAlarmName);

            // Create recurring alarm
            chrome.alarms.create(this.keepAliveAlarmName, {
                periodInMinutes: this.ALARM_INTERVAL_MINUTES
            });

            // Listen for alarm events
            chrome.alarms.onAlarm.addListener((alarm) => {
                if (alarm.name === this.keepAliveAlarmName) {
                    this._onAlarm();
                }
            });
        }

        /**
         * Handle alarm event - check connection and reconnect if needed
         */
        _onAlarm() {
            if (this.connectionState === 'disconnected' ||
                (this.ws && this.ws.readyState !== WebSocket.OPEN)) {
                console.log('[RealtimeClient] Alarm: Connection lost, reconnecting...');
                this.connect();
            } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Connection is good, send a heartbeat to keep it alive
                const heartbeat = {
                    topic: 'phoenix',
                    event: 'heartbeat',
                    payload: {},
                    ref: this._generateRef()
                };
                try {
                    this.ws.send(JSON.stringify(heartbeat));
                } catch (error) {
                    console.error('[RealtimeClient] Error sending heartbeat from alarm:', error);
                    this.connect();
                }
            }
        }

        /**
         * Disconnect WebSocket
         */
        async disconnect() {
            console.log('[RealtimeClient] Disconnecting...');
            this.connectionState = 'disconnected';
            await this._saveState();
            this._stopHeartbeat();
            chrome.alarms.clear(this.keepAliveAlarmName);

            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }

            if (this.ws) {
                this.ws.close(1000, 'Client disconnect');
                this.ws = null;
            }

            this.channels.clear();
            this.pendingJoins.clear();
            this.listeners = [];

            // Clear saved state
            chrome.storage.local.remove([this.storageKey]);
        }

        /**
         * Initialize - connect and setup
         */
        async initialize() {
            console.log('[RealtimeClient] Initializing WebSocket connection...');

            // Load previous state if available
            const savedState = await this._loadState();
            if (savedState) {
                console.log('[RealtimeClient] Loaded previous state:', savedState);
                // Don't restore reconnect attempts, start fresh
                this.reconnectAttempts = 0;
            }

            await this.connect();
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

    console.log('[RealtimeClient] WebSocket-based real-time client loaded');
})();
