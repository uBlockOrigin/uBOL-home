/**
 * Minimal ext for Ad Warden popup - works in both Chrome and Firefox
 * Self-contained; does not overwrite platform ext.js (used by background)
 */

const webext = (typeof chrome !== 'undefined' && chrome?.runtime) ? chrome : (typeof browser !== 'undefined' ? browser : null);

export const browser = webext;
export const runtime = webext?.runtime;

/**
 * Send message to background - uses callback API for reliability
 * (Chrome's Promise-based sendMessage can swallow errors)
 */
export function sendMessage(msg) {
    if (!runtime) return Promise.reject(new Error('Extension runtime not available'));
    return new Promise((resolve, reject) => {
        runtime.sendMessage(msg, (response) => {
            if (runtime.lastError) {
                reject(new Error(runtime.lastError.message || 'Message failed'));
            } else {
                resolve(response);
            }
        });
    });
}
