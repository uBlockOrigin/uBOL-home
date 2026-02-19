/**
 * Ad Warden - Simplified popup UI
 * Uses uBlock Origin's existing APIs: popupPanelData, setFilteringMode, action.getBadgeText
 * Supports 4 filtering levels: 0=none, 1=basic, 2=optimal, 3=complete (same as original)
 */

import { browser, runtime, sendMessage } from './ext.js';

const MODE_NAMES = ['no filtering', 'basic', 'optimal', 'complete'];
const BLOCKING_MODE_MAX = 3;

const toggleEl = document.getElementById('adwarden-toggle');
const countEl = document.getElementById('adwarden-count');
const actionEl = document.getElementById('adwarden-action');
const hostnameEl = document.getElementById('adwarden-hostname');
const filterSliderEl = document.getElementById('adwarden-filter-slider');
const filterModeNameEl = document.getElementById('adwarden-filter-mode-name');

let currentTab = null;
let hostname = '';
let level = 1;
let autoReload = false;
let isHTTP = false;
let isToggling = false;

/** Retry sendMessage (service worker may be evicted). Uses callback API for reliability. */
async function sendMessageWithRetry(msg, maxAttempts = 5) {
    const r = browser?.runtime ?? chrome?.runtime;
    if (!r) return undefined;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const result = await new Promise((resolve, reject) => {
                r.sendMessage(msg, (response) => {
                    const err = r.lastError;
                    if (err) reject(new Error(err.message || 'Message failed'));
                    else resolve(response);
                });
            });
            if (result !== undefined && result !== null) return result;
        } catch (e) {
            if (i === maxAttempts - 1) return undefined;
        }
        await new Promise(r => setTimeout(r, 80 * (i + 1)));
    }
    return undefined;
}

function render() {
    const on = level > 0;
    toggleEl.setAttribute('aria-checked', String(on));
    toggleEl.classList.toggle('on', on);
    actionEl.textContent = on ? 'Disable Blocking' : 'Enable Blocking';
    actionEl.disabled = !isHTTP;
    actionEl.classList.toggle('adwarden-cta--enable', !on);

    filterSliderEl.dataset.level = level;
    filterSliderEl.style.pointerEvents = isHTTP ? '' : 'none';
    filterSliderEl.style.opacity = isHTTP ? '1' : '0.5';
    filterModeNameEl.textContent = MODE_NAMES[level] ?? 'basic';
}

async function fetchBadgeCount() {
    if (!currentTab?.id) return '0';
    try {
        const action = browser?.action ?? browser?.browserAction;
        if (!action?.getBadgeText) return '0';
        const text = await action.getBadgeText({ tabId: currentTab.id });
        return text && text !== '' ? text : '0';
    } catch {
        return '0';
    }
}

async function load() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
        countEl.textContent = '—';
        hostnameEl.textContent = '—';
        toggleEl.disabled = true;
        return;
    }

    currentTab = tab;
    let url;
    try {
        url = new URL(tab.url);
    } catch {
        countEl.textContent = '—';
        hostnameEl.textContent = '—';
        toggleEl.disabled = true;
        return;
    }

    isHTTP = url.protocol === 'http:' || url.protocol === 'https:';
    hostname = url.hostname;

    hostnameEl.textContent = hostname || '—';

    if (!isHTTP) {
        countEl.textContent = '—';
        toggleEl.disabled = true;
        render();
        return;
    }

    toggleEl.disabled = false;

    const response = await sendMessageWithRetry({
        what: 'popupPanelData',
        origin: url.origin,
        hostname,
    });

    if (response && typeof response.level === 'number') {
        level = response.level;
        autoReload = !!response.autoReload;
    }
    console.log('[AdWarden] load() ran, response.level=', response?.level);

    const count = await fetchBadgeCount();
    countEl.textContent = count;
    countEl.classList.add('updated');

    render();
}

async function setFilteringLevel(newLevel) {
    if (!isHTTP || !hostname || isToggling) return;
    isToggling = true;
    const beforeLevel = level;

    if (newLevel > 1 && beforeLevel <= 1) {
        sendMessageWithRetry({
            what: 'setPendingFilteringMode',
            tabId: currentTab?.id,
            url: currentTab?.url,
            hostname,
            beforeLevel,
            afterLevel: newLevel,
        });
        let granted = false;
        try {
            granted = await browser.permissions.request({
                origins: [`*://*.${hostname}/*`],
            });
        } catch {
            /* ignore */
        }
        if (!granted) {
            newLevel = beforeLevel;
        }
    }

    level = newLevel;
    render();

    // Wake background (service worker may be evicted)
    let origin = '';
    try {
        origin = currentTab?.url ? new URL(currentTab.url).origin : '';
    } catch { }
    await sendMessageWithRetry({ what: 'popupPanelData', origin, hostname });

    const actualLevel = await sendMessageWithRetry({
        what: 'setFilteringMode',
        hostname,
        level: newLevel,
    });

    if (typeof actualLevel === 'number') {
        level = actualLevel;
    } else {
        // Message may have failed (e.g. SW evicted) but change could have succeeded
        const fetched = await sendMessageWithRetry({ what: 'getFilteringMode', hostname });
        level = typeof fetched === 'number' ? fetched : beforeLevel;
    }
    console.log('[AdWarden] setFilteringLevel beforeLevel=', beforeLevel, 'newLevel=', newLevel, 'actualLevel=', actualLevel, 'reverted=', beforeLevel !== newLevel && level === beforeLevel);

    render();

    if (level !== beforeLevel && autoReload && currentTab?.id) {
        setTimeout(() => {
            browser.tabs.reload(currentTab.id);
        }, 300);
    }

    isToggling = false;
}

async function onToggleClick(ev) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    if (toggleEl.disabled) return;
    const newLevel = level === 0 ? 1 : 0;
    await setFilteringLevel(newLevel);
}

function onFilterSegmentClick(ev) {
    const span = ev.target.closest('span[data-level]');
    if (!span || isToggling) return;
    const newLevel = parseInt(span.dataset.level, 10);
    if (isNaN(newLevel) || newLevel < 0 || newLevel > 3) return;
    setFilteringLevel(newLevel);
}

function onActionClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (actionEl.disabled) return;
    const newLevel = level === 0 ? 1 : 0;
    setFilteringLevel(newLevel);
}

function handleToggle(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    onToggleClick(ev);
}

toggleEl.addEventListener('mousedown', handleToggle);
actionEl.addEventListener('click', onActionClick);
filterSliderEl.addEventListener('click', onFilterSegmentClick);

load();
