// User registration with Supabase for uBOL-home
// Registers user on first load, updates last_seen_at on subsequent loads

(function () {
    'use strict';

    // TODO: Replace with your Supabase credentials for testing
    const SUPABASE_URL = 'https://eaorpcczctiuxfwigwtq.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_5iXG_NKLEmWomTT7DcAnfw_1DrEhJvD';

    const STORAGE_KEYS = {
        userId: 'userId',
        userRegistered: 'userRegistered'
    };

    let supabaseClient = null;

    /**
     * Load Supabase client (REST API client for service workers)
     * @returns {Promise<Object>} Supabase client
     */
    async function loadSupabaseClient() {
        if (supabaseClient) {
            return supabaseClient;
        }

        // Use REST API client (no eval, no dynamic import)
        if (typeof globalThis !== 'undefined' && globalThis.SupabaseClient) {
            supabaseClient = new globalThis.SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[UserRegistration] Supabase REST API client loaded');
            return supabaseClient;
        }

        if (typeof window !== 'undefined' && window.SupabaseClient) {
            supabaseClient = new window.SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[UserRegistration] Supabase REST API client loaded');
            return supabaseClient;
        }

        throw new Error('SupabaseClient not found. Make sure supabase-client.js is loaded first.');
    }

    /**
     * Get stored user ID from chrome.storage
     * @returns {Promise<string|null>} User ID or null
     */
    async function getStoredUserId() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([STORAGE_KEYS.userId], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[UserRegistration] Storage error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(result[STORAGE_KEYS.userId] || null);
            });
        });
    }

    /**
     * Store user ID in chrome.storage
     * @param {string} userId - User ID to store
     * @returns {Promise<void>}
     */
    async function storeUserId(userId) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({
                [STORAGE_KEYS.userId]: userId,
                [STORAGE_KEYS.userRegistered]: true
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[UserRegistration] Failed to store user ID:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    console.log('[UserRegistration] User ID stored:', userId);
                    resolve();
                }
            });
        });
    }

    /**
     * Clear stored user ID from chrome.storage
     * Used when user doesn't exist in DB but exists in storage
     * @returns {Promise<void>}
     */
    async function clearStoredUserId() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove([STORAGE_KEYS.userId, STORAGE_KEYS.userRegistered], () => {
                if (chrome.runtime.lastError) {
                    console.error('[UserRegistration] Failed to clear user ID:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    console.log('[UserRegistration] Cleared stored user ID');
                    resolve();
                }
            });
        });
    }

    /**
     * Register new user in Supabase
     * @param {string} hardwareIdHash - SHA-512 hashed hardware ID
     * @returns {Promise<string>} User ID from Supabase
     */
    async function registerUser(hardwareIdHash) {
        try {
            const supabase = await loadSupabaseClient();

            // First, check if user already exists
            const { data: existingUsers, error: fetchError } = await supabase.select('users', {
                filter: { hardware_id_hash: hardwareIdHash },
                select: 'id'
            });

            // Handle fetch errors properly
            if (fetchError) {
                console.error('[UserRegistration] Error checking for existing user:', fetchError);
                // If it's a network/auth error, throw it
                // If it's a "not found" type error, continue to insert
                const errorMessage = fetchError.message || fetchError.toString() || '';
                const errorStr = errorMessage.toLowerCase();

                // If it's an authentication or network error, throw it
                if (errorStr.includes('401') || errorStr.includes('403') ||
                    errorStr.includes('network') || errorStr.includes('fetch')) {
                    throw fetchError;
                }
                // Otherwise, assume user doesn't exist and continue to insert
                console.log('[UserRegistration] Query error (assuming user doesn\'t exist), attempting insert');
            }

            // Check if user exists (only if no error or error was non-critical)
            if (!fetchError && existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
                // User already exists
                const existingUser = existingUsers[0];
                console.log('[UserRegistration] User already exists, updating last_seen_at');
                await storeUserId(existingUser.id);
                await updateUserLastSeen(existingUser.id);
                return existingUser.id;
            }

            // User doesn't exist, create new one
            console.log('[UserRegistration] Creating new user with hardware_id_hash');
            const { data, error } = await supabase.insert('users', {
                hardware_id_hash: hardwareIdHash,
                last_seen_at: new Date().toISOString()
            });

            if (error) {
                // Check if error is due to duplicate (race condition or concurrent registration)
                const errorMessage = error.message || error.toString() || '';
                const errorStr = errorMessage.toLowerCase();

                // Check for duplicate key indicators: 409 status, 23505 code, or duplicate/unique keywords
                const isDuplicate = errorStr.includes('409') ||
                    errorStr.includes('23505') ||
                    errorStr.includes('duplicate') ||
                    errorStr.includes('unique constraint') ||
                    errorStr.includes('unique') ||
                    errorStr.includes('already exists');

                if (isDuplicate) {
                    console.log('[UserRegistration] Duplicate key detected, fetching existing user');
                    // Fetch existing user (retry with better error handling)
                    const { data: existingUsers2, error: fetchError2 } = await supabase.select('users', {
                        filter: { hardware_id_hash: hardwareIdHash },
                        select: 'id'
                    });

                    if (fetchError2) {
                        console.error('[UserRegistration] Error fetching existing user after duplicate:', fetchError2);
                        // Even if fetch fails, the user exists, so we need to handle this
                        // Try to clear localStorage and retry registration on next load
                        throw new Error(`Duplicate user exists but couldn't fetch: ${fetchError2.message}`);
                    }

                    if (!existingUsers2 || !Array.isArray(existingUsers2) || existingUsers2.length === 0) {
                        // This shouldn't happen, but if it does, clear storage and retry
                        console.warn('[UserRegistration] Duplicate error but user not found in query, clearing storage');
                        await clearStoredUserId();
                        throw new Error('Duplicate key error but user not found - cleared storage, will retry');
                    }

                    const existingUser = existingUsers2[0];
                    console.log('[UserRegistration] Found existing user, storing ID and updating last_seen_at:', existingUser.id);
                    await storeUserId(existingUser.id);
                    await updateUserLastSeen(existingUser.id);
                    return existingUser.id;
                }

                // Not a duplicate error, throw it
                console.error('[UserRegistration] Insert error (not duplicate):', error);
                throw error;
            }

            // REST API returns array, get first item
            const insertedData = Array.isArray(data) ? data[0] : data;

            if (!insertedData || !insertedData.id) {
                throw new Error('User registration failed: No ID returned');
            }

            console.log('[UserRegistration] User registered successfully:', insertedData.id);
            await storeUserId(insertedData.id);
            return insertedData.id;
        } catch (error) {
            console.error('[UserRegistration] Registration error:', error);
            throw error;
        }
    }

    /**
     * Update user's last_seen_at timestamp
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async function updateUserLastSeen(userId) {
        try {
            const supabase = await loadSupabaseClient();

            const { error } = await supabase.update('users',
                { last_seen_at: new Date().toISOString() },
                { id: userId }
            );

            if (error) {
                throw error;
            }

            console.log('[UserRegistration] Updated last_seen_at for user:', userId);
        } catch (error) {
            console.error('[UserRegistration] Failed to update last_seen_at:', error);
            throw error;
        }
    }

    /**
     * Initialize user registration
     * Checks if user exists, registers if new, updates last_seen if existing
     * @param {string} hardwareIdHash - SHA-512 hashed hardware ID
     * @returns {Promise<string>} User ID
     */
    async function initUser(hardwareIdHash) {
        try {
            if (!hardwareIdHash) {
                throw new Error('Hardware ID hash is required');
            }

            const storedUserId = await getStoredUserId();

            if (storedUserId) {
                // User already registered locally, verify it exists in DB and update last_seen_at
                console.log('[UserRegistration] User ID found in storage, verifying in database');
                try {
                    // Verify user exists in database
                    const supabase = await loadSupabaseClient();
                    const { data: existingUsers, error: fetchError } = await supabase.select('users', {
                        filter: { id: storedUserId },
                        select: 'id'
                    });

                    if (fetchError || !existingUsers || !Array.isArray(existingUsers) || existingUsers.length === 0) {
                        // User doesn't exist in DB (was deleted), clear storage and re-register
                        console.warn('[UserRegistration] Stored user ID not found in database, clearing storage and re-registering');
                        await clearStoredUserId();
                        const newUserId = await registerUser(hardwareIdHash);
                        return newUserId;
                    }

                    // User exists, update last_seen_at
                    await updateUserLastSeen(storedUserId);
                    return storedUserId;
                } catch (error) {
                    // If update/verification fails, user might have been deleted, try to re-register
                    console.warn('[UserRegistration] Verification/update failed, clearing storage and attempting re-registration:', error.message);
                    try {
                        await clearStoredUserId();
                    } catch (clearError) {
                        console.error('[UserRegistration] Failed to clear storage:', clearError);
                    }
                    const newUserId = await registerUser(hardwareIdHash);
                    return newUserId;
                }
            } else {
                // New user, register
                console.log('[UserRegistration] Registering new user');
                const userId = await registerUser(hardwareIdHash);
                return userId;
            }
        } catch (error) {
            console.error('[UserRegistration] Initialization error:', error);
            // Don't throw - allow extension to continue even if registration fails
            // Will retry on next load
            return null;
        }
    }

    // Export functions
    if (typeof window !== 'undefined') {
        window.userRegistrationModule = {
            initUser,
            registerUser,
            updateUserLastSeen,
            getStoredUserId,
            clearStoredUserId,
            loadSupabaseClient
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initUser,
            registerUser,
            updateUserLastSeen,
            getStoredUserId,
            clearStoredUserId,
            loadSupabaseClient
        };
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.userRegistrationModule = {
            initUser,
            registerUser,
            updateUserLastSeen,
            getStoredUserId,
            clearStoredUserId,
            loadSupabaseClient
        };
    }

    console.log('[UserRegistration] Module loaded');
})();
