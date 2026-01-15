// Supabase REST API client for service workers
// Works without eval() or dynamic import() - uses fetch only

(function () {
    'use strict';

    /**
     * Supabase REST API client
     * Uses fetch API directly - no external library needed
     */
    class SupabaseClient {
        constructor(url, anonKey) {
            this.url = url.replace(/\/$/, ''); // Remove trailing slash
            this.anonKey = anonKey;
            this.headers = {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };
        }

        /**
         * Make a request to Supabase REST API
         * @private
         */
        async _request(method, table, options = {}) {
            const { data, filter, select } = options;
            let url = `${this.url}/rest/v1/${table}`;

            // Add query parameters
            const params = new URLSearchParams();
            if (select) {
                params.append('select', select);
            }
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    params.append(key, `eq.${value}`);
                });
            }
            if (params.toString()) {
                url += '?' + params.toString();
            }

            const requestOptions = {
                method: method,
                headers: this.headers
            };

            if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
                requestOptions.body = JSON.stringify(data);
            }

            try {
                const response = await fetch(url, requestOptions);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Supabase API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                // Handle empty responses
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const json = await response.json();
                    return { data: json, error: null };
                } else {
                    return { data: null, error: null };
                }
            } catch (error) {
                console.error('[SupabaseClient] Request failed:', error);
                return { data: null, error };
            }
        }

        /**
         * Insert data into a table
         */
        async insert(table, data) {
            return this._request('POST', table, { data });
        }

        /**
         * Update data in a table
         */
        async update(table, data, filter = {}) {
            let url = `${this.url}/rest/v1/${table}`;

            // Add filter as query parameters
            const params = new URLSearchParams();
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    params.append(key, `eq.${value}`);
                });
            }
            if (params.toString()) {
                url += '?' + params.toString();
            }

            try {
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: this.headers,
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Supabase API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const json = await response.json();
                return { data: json, error: null };
            } catch (error) {
                console.error('[SupabaseClient] Update failed:', error);
                return { data: null, error };
            }
        }

        /**
         * Select data from a table
         */
        async select(table, options = {}) {
            const { filter, select: selectFields } = options;
            let url = `${this.url}/rest/v1/${table}`;

            // Add query parameters
            const params = new URLSearchParams();
            if (selectFields) {
                params.append('select', selectFields);
            }
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    params.append(key, `eq.${value}`);
                });
            }
            if (params.toString()) {
                url += '?' + params.toString();
            }

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: this.headers
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Supabase API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const json = await response.json();
                return { data: json, error: null };
            } catch (error) {
                console.error('[SupabaseClient] Select failed:', error);
                return { data: null, error };
            }
        }

        /**
         * Create a real-time channel subscription
         * Note: Real-time requires WebSocket, which is complex in service workers
         * This is a placeholder - actual real-time will use a different approach
         */
        channel(name) {
            return {
                on: () => this,
                subscribe: () => {
                    console.warn('[SupabaseClient] Real-time subscriptions not supported via REST API');
                    return this;
                }
            };
        }

        /**
         * Remove channel (placeholder)
         */
        async removeChannel(channel) {
            // No-op for REST API client
            return Promise.resolve();
        }
    }

    // Export
    if (typeof window !== 'undefined') {
        window.SupabaseClient = SupabaseClient;
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.SupabaseClient = SupabaseClient;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SupabaseClient;
    }

    console.log('[SupabaseClient] REST API client loaded');
})();
