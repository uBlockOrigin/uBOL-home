/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2014-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock

*/

// ruleset: annoyances-cookies

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_trustedClickElement() {

/******************************************************************************/

function trustedClickElement(
    selectors = '',
    extraMatch = '',
    delay = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-click-element', selectors, extraMatch, delay);

    if ( extraMatch !== '' ) {
        const assertions = safe.String_split.call(extraMatch, ',').map(s => {
            const pos1 = s.indexOf(':');
            const s1 = pos1 !== -1 ? s.slice(0, pos1) : s;
            const not = s1.startsWith('!');
            const type = not ? s1.slice(1) : s1;
            const s2 = pos1 !== -1 ? s.slice(pos1+1).trim() : '';
            if ( s2 === '' ) { return; }
            const out = { not, type };
            const match = /^\/(.+)\/(i?)$/.exec(s2);
            if ( match !== null ) {
                out.re = new RegExp(match[1], match[2] || undefined);
                return out;
            }
            const pos2 = s2.indexOf('=');
            const key = pos2 !== -1 ? s2.slice(0, pos2).trim() : s2;
            const value = pos2 !== -1 ? s2.slice(pos2+1).trim() : '';
            out.re = new RegExp(`^${this.escapeRegexChars(key)}=${this.escapeRegexChars(value)}`);
            return out;
        }).filter(details => details !== undefined);
        const allCookies = assertions.some(o => o.type === 'cookie')
            ? getAllCookiesFn()
            : [];
        const allStorageItems = assertions.some(o => o.type === 'localStorage')
            ? getAllLocalStorageFn()
            : [];
        const hasNeedle = (haystack, needle) => {
            for ( const { key, value } of haystack ) {
                if ( needle.test(`${key}=${value}`) ) { return true; }
            }
            return false;
        };
        for ( const { not, type, re } of assertions ) {
            switch ( type ) {
            case 'cookie':
                if ( hasNeedle(allCookies, re) === not ) { return; }
                break;
            case 'localStorage':
                if ( hasNeedle(allStorageItems, re) === not ) { return; }
                break;
            }
        }
    }

    const getShadowRoot = elem => {
        // Firefox
        if ( elem.openOrClosedShadowRoot ) {
            return elem.openOrClosedShadowRoot;
        }
        // Chromium
        if ( typeof chrome === 'object' ) {
            if ( chrome.dom && chrome.dom.openOrClosedShadowRoot ) {
                return chrome.dom.openOrClosedShadowRoot(elem);
            }
        }
        return null;
    };

    const querySelectorEx = (selector, context = document) => {
        const pos = selector.indexOf(' >>> ');
        if ( pos === -1 ) { return context.querySelector(selector); }
        const outside = selector.slice(0, pos).trim();
        const inside = selector.slice(pos + 5).trim();
        const elem = context.querySelector(outside);
        if ( elem === null ) { return null; }
        const shadowRoot = getShadowRoot(elem);
        return shadowRoot && querySelectorEx(inside, shadowRoot);
    };

    const selectorList = safe.String_split.call(selectors, /\s*,\s*/)
        .filter(s => {
            try {
                void querySelectorEx(s);
            } catch {
                return false;
            }
            return true;
        });
    if ( selectorList.length === 0 ) { return; }

    const clickDelay = parseInt(delay, 10) || 1;
    const t0 = Date.now();
    const tbye = t0 + 10000;
    let tnext = selectorList.length !== 1 ? t0 : t0 + clickDelay;

    const terminate = ( ) => {
        selectorList.length = 0;
        next.stop();
        observe.stop();
    };

    const next = notFound => {
        if ( selectorList.length === 0 ) {
            safe.uboLog(logPrefix, 'Completed');
            return terminate();
        }
        const tnow = Date.now();
        if ( tnow >= tbye ) {
            safe.uboLog(logPrefix, 'Timed out');
            return terminate();
        }
        if ( notFound ) { observe(); }
        const delay = Math.max(notFound ? tbye - tnow : tnext - tnow, 1);
        next.timer = setTimeout(( ) => {
            next.timer = undefined;
            process();
        }, delay);
        safe.uboLog(logPrefix, `Waiting for ${selectorList[0]}...`);
    };
    next.stop = ( ) => {
        if ( next.timer === undefined ) { return; }
        clearTimeout(next.timer);
        next.timer = undefined;
    };

    const observe = ( ) => {
        if ( observe.observer !== undefined ) { return; }
        observe.observer = new MutationObserver(( ) => {
            if ( observe.timer !== undefined ) { return; }
            observe.timer = setTimeout(( ) => {
                observe.timer = undefined;
                process();
            }, 20);
        });
        observe.observer.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    };
    observe.stop = ( ) => {
        if ( observe.timer !== undefined ) {
            clearTimeout(observe.timer);
            observe.timer = undefined;
        }
        if ( observe.observer ) {
            observe.observer.disconnect();
            observe.observer = undefined;
        }
    };

    const process = ( ) => {
        next.stop();
        if ( Date.now() < tnext ) { return next(); }
        const selector = selectorList.shift();
        if ( selector === undefined ) { return terminate(); }
        const elem = querySelectorEx(selector);
        if ( elem === null ) {
            selectorList.unshift(selector);
            return next(true);
        }
        safe.uboLog(logPrefix, `Clicked ${selector}`);
        elem.click();
        tnext += clickDelay;
        next();
    };

    runAtHtmlElementFn(process);
}

function getAllCookiesFn() {
    const safe = safeSelf();
    return safe.String_split.call(document.cookie, /\s*;\s*/).map(s => {
        const pos = s.indexOf('=');
        if ( pos === 0 ) { return; }
        if ( pos === -1 ) { return `${s.trim()}=`; }
        const key = s.slice(0, pos).trim();
        const value = s.slice(pos+1).trim();
        return { key, value };
    }).filter(s => s !== undefined);
}

function getAllLocalStorageFn(which = 'localStorage') {
    const storage = self[which];
    const out = [];
    for ( let i = 0; i < storage.length; i++ ) {
        const key = storage.key(i);
        const value = storage.getItem(key);
        return { key, value };
    }
    return out;
}

function runAtHtmlElementFn(fn) {
    if ( document.documentElement ) {
        fn();
        return;
    }
    const observer = new MutationObserver(( ) => {
        observer.disconnect();
        fn();
    });
    observer.observe(document, { childList: true });
}

function safeSelf() {
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'Object_hasOwn': Object.hasOwn.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String': self.String,
        'String_fromCharCode': String.fromCharCode,
        'String_split': String.prototype.split,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true, expect: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
            }
            catch {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            if ( bcBuffer === undefined ) {
                return bc.postMessage({ what: 'messageToLogger', type, text });
            }
            bcBuffer.push({ type, text });
        };
        bc.onmessage = ev => {
            const msg = ev.data;
            switch ( msg ) {
            case 'iamready!':
                if ( bcBuffer === undefined ) { break; }
                bcBuffer.forEach(({ type, text }) =>
                    bc.postMessage({ what: 'messageToLogger', type, text })
                );
                bcBuffer = undefined;
                break;
            case 'setScriptletLogLevelToOne':
                safe.logLevel = 1;
                break;
            case 'setScriptletLogLevelToTwo':
                safe.logLevel = 2;
                break;
            }
        };
        bc.postMessage('areyouready?');
    } catch {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[aria-labelledby=\"manage_cookies_title\"] [aria-hidden=\"true\"]:has(> [aria-disabled=\"true\"][role=\"button\"]) + [aria-label][role=\"button\"][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","500"],["button[title=\"REJECT ALL\"]","","1000"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","800"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[id=\"ue-accept-notice-button\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","800"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1000"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["a.cookie-permission--accept-button","","1000"],["button[title=\"Alle ablehnen\"]","","1800"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1000"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["button.css-15p2x3e.e112qvla0","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","1000"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button#wp-declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],[".b1m5dgh8 .deorxlo button[data-test-id=\"decline-button\"]","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#btn-accept-required-banner","","1000"],["button#elc-decline-all-link","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button[data-role=\"reject-rodo\"]","","1500"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","1600"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","1800"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],["a.ea_ignore","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["div[aria-labelledby=\"dialog-heading\"] div[class^=\"StyledButtonsWrapper\"] > button + button, #dialog-dynamic-section div[class^=\"StyledButtonsWrapper\"] > button + button","","500"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button#onetrust-accept-btn-handler"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"]];
const hostnamesMap = new Map([["consent.google.*",0],["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["theguardian.com",6],["bloomberg.com",[7,8]],["forbes.com",[7,73]],["nike.com",7],["consent.fastcar.co.uk",7],["tapmaster.ca",7],["cmpv2.standard.co.uk",[9,10]],["cmpv2.independent.co.uk",[11,12,13,168]],["wetransfer.com",[14,15]],["spiegel.de",[16,17]],["nytimes.com",[18,164]],["consent.yahoo.com",19],["tumblr.com",20],["fplstatistics.co.uk",21],["fplstatistics.com",21],["e-shop.leonidas.com",22],["cdn.privacy-mgmt.com",[23,24,43,45,46,47,48,92,94,101,108,115,125,126,127,130,132,133,140,157,182,198,211,212,215,216,217,234,283,399,543,567,605]],["walmart.ca",25],["sams.com.mx",26],["my.tonies.com",27],["cambio-carsharing.de",27],["festool.*",27],["festoolcanada.com",27],["fuso-trucks.*",27],["tracker.fressnapf.de",27],["consent.ladbible.com",[28,29]],["consent.unilad.com",[28,29]],["consent.uniladtech.com",[28,29]],["consent.gamingbible.com",[28,29]],["consent.sportbible.com",[28,29]],["consent.tyla.com",[28,29]],["consent.ladbiblegroup.com",[28,29]],["m2o.it",30],["deejay.it",30],["capital.it",30],["ilmattino.it",[30,31]],["leggo.it",[30,31]],["libero.it",30],["tiscali.it",30],["consent-manager.ft.com",[32,33,34]],["hertz.*",35],["mediaworld.it",36],["mediamarkt.*",36],["mediamarktsaturn.com",37],["uber.com",[38,165]],["ubereats.com",[38,165]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["ilgiornale.it",44],["telekom.com",49],["telekom.net",49],["telekom.de",49],["abola.pt",50],["flytap.com",50],["ansons.de",50],["blick.ch",50],["buienradar.be",50],["crunchyroll.com",50],["digi24.ro",50],["digisport.ro",50],["digitalfoundry.net",50],["egx.net",50],["emirates.com",50],["eurogamer.it",50],["gmx.*",50],["kizi.com",50],["mail.com",50],["mcmcomiccon.com",50],["nachrichten.at",50],["nintendolife.com",50],["oe24.at",50],["paxsite.com",50],["peacocktv.com",50],["player.pl",50],["plus500.*",50],["pricerunner.com",50],["pricerunner.se",50],["pricerunner.dk",50],["proximus.be",[50,600]],["proximus.com",50],["purexbox.com",50],["pushsquare.com",50],["rugbypass.com",50],["southparkstudios.com",50],["southwest.com",50],["starwarscelebration.com",50],["sweatybetty.com",50],["thehaul.com",50],["timeextension.com",50],["travelandleisure.com",50],["tunein.com",50],["videoland.com",50],["wizzair.com",50],["wetter.at",50],["dicebreaker.com",[51,52]],["eurogamer.cz",[51,52]],["eurogamer.es",[51,52]],["eurogamer.net",[51,52]],["eurogamer.nl",[51,52]],["eurogamer.pl",[51,52]],["eurogamer.pt",[51,52]],["gamesindustry.biz",[51,52]],["jelly.deals",[51,52]],["reedpop.com",[51,52]],["rockpapershotgun.com",[51,52]],["thepopverse.com",[51,52]],["vg247.com",[51,52]],["videogameschronicle.com",[51,52]],["eurogamer.de",53],["roadtovr.com",54],["jotex.*",54],["mundodeportivo.com",[55,121]],["m.youtube.com",56],["www.youtube.com",56],["ohra.nl",57],["corriere.it",58],["gazzetta.it",58],["oggi.it",58],["cmp.sky.it",59],["tennisassa.fi",60],["formula1.com",61],["f1racing.pl",62],["music.amazon.*",[63,64]],["consent-pref.trustarc.com",65],["highlights.legaseriea.it",66],["calciomercato.com",66],["sosfanta.com",67],["chrono24.*",[68,69]],["wetter.com",70],["youmath.it",71],["pip.gov.pl",72],["dailybuzz.nl",74],["bnn.de",74],["dosenbach.ch",74],["dw.com",74],["kinepolis.*",74],["mediaite.com",74],["winfuture.de",74],["lippu.fi",74],["racingnews365.com",74],["reifendirekt.ch",74],["vaillant.*",74],["bauhaus.no",75],["bauhaus.se",75],["beko-group.de",75],["billiger.de",75],["burda.com",75],["vanharen.nl",75],["deichmann.com",[75,97,425]],["meraluna.de",75],["slashdot.org",75],["hermann-saunierduval.it",75],["protherm.cz",75],["saunierduval.es",75],["protherm.sk",75],["protherm.ua",75],["saunierduval.hu",75],["saunierduval.ro",75],["saunierduval.at",75],["awb.nl",75],["spar.hu",76],["group.vattenfall.com",76],["mediaset.it",77],["fortune.com",78],["ilrestodelcarlino.it",79],["quotidiano.net",79],["lanazione.it",79],["ilgiorno.it",79],["iltelegrafolivorno.it",79],["auto.it",80],["beauxarts.com",80],["beinsports.com",80],["bfmtv.com",80],["boursobank.com",80],["boursorama.com",80],["boursier.com",[80,205]],["brut.media",80],["canalplus.com",80],["decathlon.fr",[80,202]],["diverto.tv",80],["eden-park.com",80],["foodvisor.io",80],["frandroid.com",80],["jobijoba.*",80],["hotelsbarriere.com",80],["intersport.*",[80,179]],["idealista.it",80],["o2.fr",80],["lejdd.fr",[80,121]],["lechorepublicain.fr",80],["la-croix.com",80],["linfo.re",80],["lamontagne.fr",80],["laredoute.fr",80],["largus.fr",80],["leprogres.fr",80],["lesnumeriques.com",80],["libramemoria.com",80],["lopinion.fr",80],["marieclaire.fr",80],["maville.com",80],["michelin.*",80],["midilibre.fr",[80,623]],["meteofrance.com",80],["mondialtissus.fr",80],["orange.fr",80],["oscaro.com",80],["ouest-france.fr",[80,93,624]],["parismatch.com",80],["pagesjaunes.fr",80],["programme-television.org",80],["publicsenat.fr",80],["rmcbfmplay.com",80],["science-et-vie.com",[80,121]],["seloger.com",80],["societe.com",80],["suzuki.fr",80],["sudouest.fr",80],["web-agri.fr",80],["nutri-plus.de",81],["aa.com",82],["americanairlines.*",82],["consent.capital.fr",83],["consent.voici.fr",83],["programme-tv.net",83],["cmpv2.finn.no",84],["cmp.e24.no",[85,86]],["cmp.vg.no",[85,86]],["huffingtonpost.fr",87],["rainews.it",88],["remarkable.com",89],["netzwelt.de",90],["money.it",91],["allocine.fr",93],["jeuxvideo.com",93],["ozap.com",93],["le10sport.com",93],["xataka.com",93],["cmp.fitbook.de",94],["cmp.autobild.de",94],["cmp-sp.tagesspiegel.de",94],["cmp.bz-berlin.de",94],["cmp.cicero.de",94],["cmp.techbook.de",94],["cmp.stylebook.de",94],["cmp2.bild.de",94],["cmp2.freiepresse.de",94],["sourcepoint.wetter.de",94],["consent.finanzen.at",94],["consent.up.welt.de",94],["sourcepoint.n-tv.de",94],["sourcepoint.kochbar.de",94],["sourcepoint.rtl.de",94],["cmp.computerbild.de",94],["cmp.petbook.de",94],["cmp-sp.siegener-zeitung.de",94],["cmp-sp.sportbuzzer.de",94],["klarmobil.de",94],["technikum-wien.at",95],["eneco.nl",96],["blackpoolgazette.co.uk",98],["lep.co.uk",98],["northamptonchron.co.uk",98],["scotsman.com",98],["shieldsgazette.com",98],["thestar.co.uk",98],["portsmouth.co.uk",98],["sunderlandecho.com",98],["northernirelandworld.com",98],["3addedminutes.com",98],["anguscountyworld.co.uk",98],["banburyguardian.co.uk",98],["bedfordtoday.co.uk",98],["biggleswadetoday.co.uk",98],["bucksherald.co.uk",98],["burnleyexpress.net",98],["buxtonadvertiser.co.uk",98],["chad.co.uk",98],["daventryexpress.co.uk",98],["derbyshiretimes.co.uk",98],["derbyworld.co.uk",98],["derryjournal.com",98],["dewsburyreporter.co.uk",98],["doncasterfreepress.co.uk",98],["falkirkherald.co.uk",98],["fifetoday.co.uk",98],["glasgowworld.com",98],["halifaxcourier.co.uk",98],["harboroughmail.co.uk",98],["harrogateadvertiser.co.uk",98],["hartlepoolmail.co.uk",98],["hemeltoday.co.uk",98],["hucknalldispatch.co.uk",98],["lancasterguardian.co.uk",98],["leightonbuzzardonline.co.uk",98],["lincolnshireworld.com",98],["liverpoolworld.uk",98],["londonworld.com",98],["lutontoday.co.uk",98],["manchesterworld.uk",98],["meltontimes.co.uk",98],["miltonkeynes.co.uk",98],["newcastleworld.com",98],["newryreporter.com",98],["newsletter.co.uk",98],["northantstelegraph.co.uk",98],["northumberlandgazette.co.uk",98],["nottinghamworld.com",98],["peterboroughtoday.co.uk",98],["rotherhamadvertiser.co.uk",98],["stornowaygazette.co.uk",98],["surreyworld.co.uk",98],["thescarboroughnews.co.uk",98],["thesouthernreporter.co.uk",98],["totallysnookered.com",98],["wakefieldexpress.co.uk",98],["walesworld.com",98],["warwickshireworld.com",98],["wigantoday.net",98],["worksopguardian.co.uk",98],["yorkshireeveningpost.co.uk",98],["yorkshirepost.co.uk",98],["eurocard.com",99],["saseurobonusmastercard.se",100],["tver.jp",102],["linkedin.com",103],["elmundo.es",104],["expansion.com",104],["s-pankki.fi",105],["srf.ch",105],["alternate.de",105],["bayer04.de",105],["douglas.de",105],["dr-beckmann.com",105],["falke.com",105],["fitnessfirst.de",105],["flaschenpost.de",105],["gloeckle.de",105],["hornbach.nl",105],["hypofriend.de",105],["lactostop.de",105],["postbank.de",105],["immowelt.de",106],["joyn.*",106],["morenutrition.de",106],["mapillary.com",107],["cmp.seznam.cz",109],["marca.com",110],["raiplay.it",111],["derstandard.at",112],["derstandard.de",112],["faz.net",112],["ansa.it",113],["delladio.it",113],["huffingtonpost.it",113],["internazionale.it",113],["lastampa.it",113],["macitynet.it",113],["movieplayer.it",113],["multiplayer.it",113],["repubblica.it",113],["tomshw.it",113],["spaziogames.it",113],["tuttoandroid.net",113],["tuttotech.net",113],["ilgazzettino.it",114],["ilmessaggero.it",114],["ilsecoloxix.it",114],["privacy.motorradonline.de",115],["consent.watson.de",115],["consent.kino.de",115],["consent.desired.de",115],["dailystar.co.uk",[116,117,118,119]],["mirror.co.uk",[116,117,118,119]],["idnes.cz",120],["20minutes.fr",121],["20minutos.es",121],["24sata.hr",121],["abc.es",121],["actu.fr",121],["antena3.com",121],["antena3internacional.com",121],["atresmedia.com",121],["atresmediapublicidad.com",121],["atresmediastudios.com",121],["atresplayer.com",121],["autopista.es",121],["belfasttelegraph.co.uk",121],["bemad.es",121],["bonduelle.it",121],["bonniernews.se",121],["bt.se",121],["cadenadial.com",121],["caracol.com.co",121],["charentelibre.fr",121],["ciclismoafondo.es",121],["cnews.fr",121],["cope.es",121],["correryfitness.com",121],["courrier-picard.fr",121],["cuatro.com",121],["decathlon.nl",121],["decathlon.pl",121],["di.se",121],["diariocordoba.com",121],["diariodenavarra.es",121],["diariosur.es",121],["diariovasco.com",121],["diepresse.com",121],["divinity.es",121],["dn.se",121],["dnevnik.hr",121],["dumpert.nl",121],["ebuyclub.com",121],["edreams.de",121],["edreams.net",121],["elcomercio.es",121],["elconfidencial.com",121],["elcorreo.com",121],["eldesmarque.com",121],["eldiario.es",121],["eldiariomontanes.es",121],["elespanol.com",121],["elle.fr",121],["elpais.com",121],["elpais.es",121],["elperiodico.com",121],["elperiodicodearagon.com",121],["elplural.com",121],["energytv.es",121],["engadget.com",121],["es.ara.cat",121],["euronews.com",121],["europafm.com",121],["expressen.se",121],["factoriadeficcion.com",121],["filmstarts.de",121],["flooxernow.com",121],["folkbladet.nu",121],["footmercato.net",121],["france.tv",121],["france24.com",121],["francetvinfo.fr",121],["fussballtransfers.com",121],["fyndiq.se",121],["ghacks.net",121],["gva.be",121],["hbvl.be",121],["heraldo.es",121],["hoy.es",121],["ideal.es",121],["idealista.pt",121],["k.at",121],["krone.at",121],["kurier.at",121],["lacoste.com",121],["ladepeche.fr",121],["lalibre.be",121],["lanouvellerepublique.fr",121],["larazon.es",121],["lasexta.com",121],["lasprovincias.es",121],["latribune.fr",121],["lavanguardia.com",121],["laverdad.es",121],["lavozdegalicia.es",121],["leboncoin.fr",121],["lecturas.com",121],["ledauphine.com",121],["lejsl.com",121],["leparisien.fr",121],["lesoir.be",121],["letelegramme.fr",121],["levoixdunord.fr",121],["libremercado.com",121],["los40.com",121],["lotoquebec.com",121],["lunion.fr",121],["m6.fr",121],["marianne.cz",121],["marmiton.org",121],["mediaset.es",121],["melodia-fm.com",121],["metronieuws.nl",121],["moviepilot.de",121],["mtmad.es",121],["multilife.com.pl",121],["naszemiasto.pl",121],["nationalgeographic.com.es",121],["nicematin.com",121],["nieuwsblad.be",121],["notretemps.com",121],["numerama.com",121],["okdiario.com",121],["ondacero.es",121],["podiumpodcast.com",121],["portail.lotoquebec.com",121],["profil.at",121],["public.fr",121],["publico.es",121],["radiofrance.fr",121],["rankia.com",121],["rfi.fr",121],["rossmann.pl",121],["rtbf.be",[121,202]],["rtl.lu",121],["sensacine.com",121],["sfgame.net",121],["shure.com",121],["silicon.es",121],["sncf-connect.com",121],["sport.es",121],["sydsvenskan.se",121],["techcrunch.com",121],["telegraaf.nl",121],["telequebec.tv",121],["tf1.fr",121],["tradingsat.com",121],["trailrun.es",121],["video-streaming.orange.fr",121],["xpress.fr",121],["ryobitools.eu",[122,123]],["americanexpress.com",124],["consent.radiotimes.com",127],["sp-consent.szbz.de",128],["cmp.omni.se",129],["cmp.svd.se",129],["cmp.aftonbladet.se",129],["cmp.tv.nu",129],["consent.economist.com",131],["studentagency.cz",131],["cmpv2.foundryco.com",132],["cmpv2.infoworld.com",132],["cmpv2.arnnet.com.au",132],["sp-cdn.pcgames.de",133],["sp-cdn.pcgameshardware.de",133],["consentv2.sport1.de",133],["cmp.mz.de",133],["cmpv2.tori.fi",134],["cdn.privacy-mgmt.co",135],["consent.spielaffe.de",136],["degiro.*",137],["epochtimes.de",137],["vikingline.com",137],["tfl.gov.uk",137],["drklein.de",137],["hildegardis-krankenhaus.de",137],["kleer.se",137],["lotto.pl",137],["mineralstech.com",137],["volunteer.digitalboost.org.uk",137],["starhotels.com",137],["tefl.com",137],["universumglobal.com",137],["1und1.de",138],["infranken.de",139],["cmp.bunte.de",140],["cmp.chip.de",140],["cmp.focus.de",[140,452]],["estadiodeportivo.com",141],["tameteo.*",141],["tempo.pt",141],["meteored.*",141],["pogoda.com",141],["yourweather.co.uk",141],["tempo.com",141],["theweather.net",141],["tiempo.com",141],["ilmeteo.net",141],["daswetter.com",141],["kicker.de",142],["formulatv.com",143],["web.de",144],["lefigaro.fr",145],["linternaute.com",146],["consent.caminteresse.fr",147],["volksfreund.de",148],["rp-online.de",148],["dailypost.co.uk",149],["the-express.com",149],["bluray-disc.de",150],["elio-systems.com",150],["stagatha-fachklinik.de",150],["tarife.mediamarkt.de",150],["lz.de",150],["gaggenau.com",150],["saturn.de",151],["eltiempo.es",[152,153]],["otempo.pt",154],["atlasformen.*",155],["cmp-sp.goettinger-tageblatt.de",156],["cmp-sp.saechsische.de",156],["cmp-sp.ln-online.de",156],["cz.de",156],["dewezet.de",156],["dnn.de",156],["haz.de",156],["gnz.de",156],["landeszeitung.de",156],["lvz.de",156],["maz-online.de",156],["ndz.de",156],["op-marburg.de",156],["ostsee-zeitung.de",156],["paz-online.de",156],["reisereporter.de",156],["rga.de",156],["rnd.de",156],["siegener-zeitung.de",156],["sn-online.de",156],["solinger-tageblatt.de",156],["sportbuzzer.de",156],["szlz.de",156],["tah.de",156],["torgauerzeitung.de",156],["waz-online.de",156],["privacy.maennersache.de",156],["sinergy.ch",158],["agglo-valais-central.ch",158],["biomedcentral.com",159],["hsbc.*",160],["hsbcnet.com",160],["hsbcinnovationbanking.com",160],["create.hsbc",160],["gbm.hsbc.com",160],["hsbc.co.uk",161],["internationalservices.hsbc.com",161],["history.hsbc.com",161],["about.hsbc.co.uk",162],["privatebanking.hsbc.com",163],["independent.co.uk",166],["privacy.crash.net",166],["the-independent.com",167],["argos.co.uk",169],["poco.de",[170,171]],["moebelix.*",170],["moemax.*",170],["xxxlutz.*",170],["xxxlesnina.*",170],["moebel24.ch",171],["meubles.fr",171],["meubelo.nl",171],["moebel.de",171],["lipo.ch",172],["schubiger.ch",173],["aedt.de",174],["berlin-live.de",174],["connect.de",174],["gutefrage.net",174],["insideparadeplatz.ch",174],["morgenpost.de",174],["play3.de",174],["thueringen24.de",174],["pdfupload.io",175],["gamestar.de",[176,177,211]],["gamepro.de",[176,177]],["verksamt.se",178],["acmemarkets.com",179],["amtrak.com",179],["beko.com",179],["bepanthen.com.au",179],["berocca.com.au",179],["booking.com",179],["centrum.sk",179],["claratyne.com.au",179],["credit-suisse.com",179],["ceskatelevize.cz",179],["deporvillage.*",179],["de.vanguard",179],["dhl.de",179],["digikey.*",179],["drafthouse.com",179],["dunelm.com",179],["fello.se",179],["flashscore.fr",179],["flightradar24.com",179],["fnac.es",179],["foodandwine.com",179],["fourseasons.com",179],["khanacademy.org",179],["konami.com",179],["jll.*",179],["jobs.redbull.com",179],["hellenicbank.com",179],["gemini.pl",179],["groceries.asda.com",179],["lamborghini.com",179],["menshealth.com",179],["n26.com",179],["nintendo.com",179],["oneweb.net",179],["panasonic.com",179],["parkside-diy.com",179],["pluto.tv",179],["popularmechanics.com",179],["polskieradio.pl",179],["radissonhotels.com",179],["ricardo.ch",179],["rockstargames.com",179],["rte.ie",179],["salesforce.com",179],["samsonite.*",179],["spirit.com",179],["stenaline.co.uk",179],["swisscom.ch",179],["swisspass.ch",179],["technologyfromsage.com",179],["telenet.be",179],["theepochtimes.com",179],["toujeo.com",179],["questdiagnostics.com",179],["wallapop.com",179],["workingtitlefilms.com",179],["vattenfall.de",179],["winparts.fr",179],["yoigo.com",179],["zoominfo.com",179],["allegiantair.com",180],["hallmarkchannel.com",180],["incorez.com",180],["noovle.com",180],["otter.ai",180],["plarium.com",180],["telsy.com",180],["timenterprise.it",180],["tim.it",180],["tradersunion.com",180],["fnac.*",180],["yeti.com",180],["here.com",[181,632]],["vodafone.com",181],["cmp.heise.de",183],["cmp.am-online.com",183],["cmp.motorcyclenews.com",183],["consent.newsnow.co.uk",183],["cmp.todays-golfer.com",183],["koeser.com",184],["central-bb.de",185],["brainmarket.pl",186],["getroots.app",187],["cart-in.re",[188,563]],["prestonpublishing.pl",189],["zara.com",190],["lepermislibre.fr",190],["negociardivida.spcbrasil.org.br",191],["adidas.*",192],["privacy.topreality.sk",193],["privacy.autobazar.eu",193],["vu.lt",194],["adnkronos.com",[195,196]],["cornwalllive.com",[195,196]],["cyprus-mail.com",[195,196]],["einthusan.tv",[195,196]],["informazione.it",[195,196]],["mymovies.it",[195,196]],["tuttoeuropei.com",[195,196]],["video.lacnews24.it",[195,196]],["protothema.gr",195],["flash.gr",195],["taxscouts.com",197],["online.no",199],["telenor.no",199],["austrian.com",200],["lufthansa.com",200],["kampfkunst-herz.de",201],["glow25.de",201],["hornetsecurity.com",201],["kayzen.io",201],["wasserkunst-hamburg.de",201],["zahnspange-oelde.de",201],["bnc.ca",202],["egora.fr",202],["engelvoelkers.com",202],["estrategiasdeinversion.com",202],["festo.com",202],["francebleu.fr",202],["francemediasmonde.com",202],["geny.com",202],["giphy.com",202],["idealista.com",202],["infolibre.es",202],["information.tv5monde.com",202],["ing.es",202],["knipex.de",202],["laprovence.com",202],["lemondeinformatique.fr",202],["libertaddigital.com",202],["mappy.com",202],["marianne.net",202],["orf.at",202],["philibertnet.com",202],["researchgate.net",202],["rtl.be",202],["standaard.be",202],["stroilioro.com",202],["taxfix.de",202],["telecinco.es",202],["vistaalegre.com",202],["zimbra.free.fr",202],["jeanmarcmorandini.com",203],["europe1.fr",203],["usinenouvelle.com",204],["reussir.fr",206],["lesechos.fr",207],["bruendl.at",208],["latamairlines.com",209],["elisa.ee",210],["baseendpoint.brigitte.de",211],["baseendpoint.gala.de",211],["baseendpoint.haeuser.de",211],["baseendpoint.stern.de",211],["baseendpoint.urbia.de",211],["cmp.tag24.de",211],["cmp-sp.handelsblatt.com",211],["cmpv2.berliner-zeitung.de",211],["golem.de",211],["consent.t-online.de",211],["sp-consent.stuttgarter-nachrichten.de",212],["sp-consent.stuttgarter-zeitung.de",212],["regjeringen.no",213],["sp-manager-magazin-de.manager-magazin.de",214],["consent.11freunde.de",214],["centrum24.pl",218],["replay.lsm.lv",219],["ltv.lsm.lv",219],["bernistaba.lsm.lv",219],["stadt-wien.at",220],["verl.de",220],["cubo-sauna.de",220],["mbl.is",220],["auto-medienportal.net",220],["mobile.de",221],["cookist.it",222],["fanpage.it",222],["geopop.it",222],["lexplain.it",222],["royalmail.com",223],["gmx.net",224],["gmx.ch",225],["mojehobby.pl",226],["super-hobby.*",226],["sp.stylevamp.de",227],["cmp.wetteronline.de",227],["audi.*",228],["easyjet.com",228],["experian.co.uk",228],["postoffice.co.uk",228],["tescobank.com",228],["internetaptieka.lv",[229,230]],["wells.pt",231],["dskdirect.bg",232],["cmpv2.dba.dk",233],["spcmp.crosswordsolver.com",234],["ecco.com",235],["thomann.de",236],["landkreis-kronach.de",237],["northcoast.com",238],["chaingpt.org",238],["bandenconcurrent.nl",239],["bandenexpert.be",239],["reserved.com",240],["metro.it",241],["makro.es",241],["metro.sk",241],["metro-cc.hr",241],["makro.nl",241],["metro.bg",241],["metro.at",241],["metro-tr.com",241],["metro.de",241],["metro.fr",241],["makro.cz",241],["metro.ro",241],["makro.pt",241],["makro.pl",241],["sklepy-odido.pl",241],["rastreator.com",241],["metro.ua",242],["metro.rs",242],["metro-kz.com",242],["metro.md",242],["metro.hu",242],["metro-cc.ru",242],["metro.pk",242],["balay.es",243],["constructa.com",243],["dafy-moto.com",244],["akku-shop.nl",245],["akkushop-austria.at",245],["akkushop-b2b.de",245],["akkushop.de",245],["akkushop.dk",245],["batterie-boutique.fr",245],["akkushop-schweiz.ch",246],["evzuttya.com.ua",247],["eobuv.cz",247],["eobuwie.com.pl",247],["ecipele.hr",247],["eavalyne.lt",247],["efootwear.eu",247],["eschuhe.ch",247],["eskor.se",247],["chaussures.fr",247],["ecipo.hu",247],["eobuv.com.ua",247],["eobuv.sk",247],["epantofi.ro",247],["epapoutsia.gr",247],["escarpe.it",247],["eschuhe.de",247],["obuvki.bg",247],["zapatos.es",247],["swedbank.ee",248],["mudanzavila.es",249],["bienmanger.com",250],["gesipa.*",251],["gesipausa.com",251],["beckhoff.com",251],["zitekick.dk",252],["eltechno.dk",252],["okazik.pl",252],["batteryempire.*",253],["maxi.rs",254],["garmin.com",255],["invisalign.*",255],["one4all.ie",255],["osprey.com",255],["wideroe.no",256],["bmw.*",257],["kijk.nl",258],["nordania.dk",259],["danskebank.*",259],["danskeci.com",259],["danicapension.dk",259],["dehn.*",260],["gewerbegebiete.de",261],["cordia.fr",262],["vola.fr",263],["lafi.fr",264],["skyscanner.*",265],["coolblue.*",266],["sanareva.*",267],["atida.fr",267],["bbva.*",268],["bbvauk.com",268],["expertise.unimi.it",269],["altenberg.de",270],["vestel.es",271],["tsb.co.uk",272],["buienradar.nl",[273,274]],["linsenplatz.de",275],["budni.de",276],["erstecardclub.hr",276],["teufel.de",[277,278]],["abp.nl",279],["simplea.sk",280],["flip.bg",281],["kiertokanki.com",282],["leirovins.be",284],["vias.be",285],["edf.fr",286],["virbac.com",286],["diners.hr",286],["squarehabitat.fr",286],["arbitrobancariofinanziario.it",287],["ivass.it",287],["economiapertutti.bancaditalia.it",287],["smit-sport.de",288],["gekko-computer.de",288],["jysk.al",289],["go-e.com",290],["malerblatt-medienservice.de",291],["architekturbuch.de",291],["medienservice-holz.de",291],["leuchtstark.de",291],["casius.nl",292],["coolinarika.com",293],["giga-hamburg.de",293],["vakgaragevannunen.nl",293],["fortuluz.es",293],["finna.fi",293],["eurogrow.es",293],["vakgaragevandertholen.nl",293],["whufc.com",293],["envafors.dk",294],["dabbolig.dk",[295,296]],["spp.nextpit.fr",297],["daruk-emelok.hu",298],["exakta.se",299],["larca.de",300],["roli.com",301],["okazii.ro",302],["lr-shop-direkt.de",302],["portalprzedszkolny.pl",302],["tgvinoui.sncf",303],["l-bank.de",304],["interhyp.de",305],["indigoneo.*",306],["transparency.meta.com",307],["dojusagro.lt",308],["eok.ee",308],["safran-group.com",308],["sr-ramenendeuren.be",308],["ilovefreegle.org",308],["tribexr.com",308],["strato.*",309],["strato-hosting.co.uk",309],["auto.de",310],["contentkingapp.com",311],["otterbox.com",312],["stoertebeker-brauquartier.com",313],["stoertebeker.com",313],["stoertebeker-eph.com",313],["aparts.pl",314],["sinsay.com",[315,316]],["benu.cz",317],["stockholmresilience.org",318],["ludvika.se",318],["kammarkollegiet.se",318],["cazenovecapital.com",319],["statestreet.com",320],["beopen.lv",321],["cesukoncertzale.lv",322],["dodo.fr",323],["pepper.it",324],["pepper.pl",324],["preisjaeger.at",324],["mydealz.de",324],["dealabs.com",324],["hotukdeals.com",324],["chollometro.com",324],["makelaarsland.nl",325],["bricklink.com",326],["bestinver.es",327],["icvs2023.conf.tuwien.ac.at",328],["racshop.co.uk",[329,330]],["baabuk.com",331],["sapien.io",331],["app.lepermislibre.fr",332],["multioferta.es",333],["testwise.com",[334,335]],["tonyschocolonely.com",336],["fitplus.is",336],["fransdegrebber.nl",336],["lilliputpress.ie",336],["lexibo.com",336],["marin-milou.com",336],["dare2tri.com",336],["t3micro.*",336],["la-vie-naturelle.com",[337,338]],["inovelli.com",339],["uonetplus.vulcan.net.pl",[340,341]],["consent.helagotland.se",342],["oper.koeln",[343,344]],["deezer.com",345],["console.scaleway.com",346],["hoteldesartssaigon.com",347],["autoritedelaconcurrence.fr",348],["groupeonepoint.com",348],["geneanet.org",348],["carrieres.groupegalerieslafayette.com",348],["clickskeks.at",349],["clickskeks.de",349],["abt-sportsline.de",349],["forbo.com",350],["stores.sk",350],["nerdstar.de",350],["prace.cz",350],["profesia.sk",350],["profesia.cz",350],["pracezarohem.cz",350],["atmoskop.cz",350],["seduo.sk",350],["seduo.cz",350],["teamio.com",350],["arnold-robot.com",350],["cvonline.lt",350],["cv.lv",350],["cv.ee",350],["dirbam.lt",350],["visidarbi.lv",350],["otsintood.ee",350],["webtic.it",350],["gerth.de",351],["pamiatki.pl",352],["initse.com",353],["salvagny.org",354],["augsburger-allgemeine.de",355],["stabila.com",356],["stwater.co.uk",357],["suncalc.org",[358,359]],["swisstph.ch",360],["taxinstitute.ie",361],["get-in-it.de",362],["tempcover.com",[363,364]],["guildford.gov.uk",365],["easyparts.*",[366,367]],["easyparts-recambios.es",[366,367]],["easyparts-rollerteile.de",[366,367]],["drimsim.com",368],["canyon.com",[369,370]],["vevovo.be",[371,372]],["vendezvotrevoiture.be",[371,372]],["wirkaufendeinauto.at",[371,372]],["vikoberallebiler.dk",[371,372]],["wijkopenautos.nl",[371,372]],["vikoperdinbil.se",[371,372]],["noicompriamoauto.it",[371,372]],["vendezvotrevoiture.fr",[371,372]],["compramostucoche.es",[371,372]],["wijkopenautos.be",[371,372]],["auto-doc.*",373],["autodoc.*",373],["autodoc24.*",373],["topautoosat.fi",373],["autoteiledirekt.de",373],["autoczescionline24.pl",373],["tuttoautoricambi.it",373],["onlinecarparts.co.uk",373],["autoalkatreszek24.hu",373],["autodielyonline24.sk",373],["reservdelar24.se",373],["pecasauto24.pt",373],["reservedeler24.co.no",373],["piecesauto24.lu",373],["rezervesdalas24.lv",373],["besteonderdelen.nl",373],["recambioscoche.es",373],["antallaktikaexartimata.gr",373],["piecesauto.fr",373],["teile-direkt.ch",373],["lpi.org",374],["refurbed.*",375],["flyingtiger.com",[376,511]],["borgomontecedrone.it",376],["recaro-shop.com",376],["gartenhotel-crystal.at",376],["swffm.de",376],["fayn.com",377],["eam-netz.de",378],["umicore.*",379],["veiligverkeer.be",379],["vsv.be",379],["dehogerielen.be",379],["gera.de",380],["mfr-chessy.fr",381],["mfr-lamure.fr",381],["mfr-saint-romain.fr",381],["mfr-lapalma.fr",381],["mfrvilliemorgon.asso.fr",381],["mfr-charentay.fr",381],["mfr.fr",381],["nationaltrust.org.uk",382],["hej-natural.*",383],["ib-hansmeier.de",384],["rsag.de",385],["esaa-eu.org",385],["aknw.de",385],["answear.*",386],["theprotocol.it",[387,388]],["lightandland.co.uk",389],["etransport.pl",390],["wohnen-im-alter.de",391],["johnmuirhealth.com",[392,393]],["markushaenni.com",394],["airbaltic.com",395],["gamersgate.com",395],["zorgzaam010.nl",396],["etos.nl",397],["paruvendu.fr",398],["cmpv2.bistro.sk",400],["privacy.bazar.sk",400],["hennamorena.com",401],["newsello.pl",402],["porp.pl",403],["golfbreaks.com",404],["lieferando.de",405],["just-eat.*",405],["justeat.*",405],["pyszne.pl",405],["lieferando.at",405],["takeaway.com",405],["thuisbezorgd.nl",405],["holidayhypermarket.co.uk",406],["atu.de",407],["atu-flottenloesungen.de",407],["but.fr",407],["edeka.de",407],["fortuneo.fr",407],["maif.fr",407],["particuliers.sg.fr",407],["sparkasse.at",407],["group.vig",407],["tf1info.fr",407],["dpdgroup.com",408],["dpd.fr",408],["dpd.com",408],["cosmosdirekt.de",408],["bstrongoutlet.pt",409],["nobbot.com",410],["isarradweg.de",[411,412]],["flaxmanestates.com",412],["inland-casas.com",412],["finlayson.fi",[413,414]],["cowaymega.ca",[413,414]],["arktis.de",415],["desktronic.de",415],["belleek.com",415],["brauzz.com",415],["cowaymega.com",415],["dockin.de",415],["dryrobe.com",415],["formswim.com",415],["hairtalk.se",415],["hallmark.co.uk",415],["loopearplugs.com",415],["oleus.com",415],["peopleofshibuya.com",415],["pullup-dip.com",415],["sanctum.shop",415],["tartanblanketco.com",415],["beam.co.uk",[416,417]],["autobahn.de",418],["consent-cdn.zeit.de",419],["coway-usa.com",420],["steiners.shop",421],["ecmrecords.com",422],["malaikaraiss.com",422],["koch-mit.de",422],["zeitreisen.zeit.de",422],["wefashion.com",423],["merkur.dk",424],["ionos.*",426],["omegawatches.com",427],["carefully.be",428],["aerotime.aero",428],["rocket-league.com",429],["dws.com",430],["bosch-homecomfort.com",431],["elmleblanc-optibox.fr",431],["monservicechauffage.fr",431],["boschrexroth.com",431],["home-connect.com",432],["lowrider.at",[433,434]],["mesto.de",435],["intersport.gr",436],["intersport.bg",436],["intersport.com.cy",436],["intersport.ro",436],["ticsante.com",437],["techopital.com",437],["millenniumprize.org",438],["hepster.com",439],["ellisphere.fr",440],["peterstaler.de",441],["blackforest-still.de",441],["tiendaplayaundi.com",442],["ajtix.co.uk",443],["raja.fr",444],["rajarani.de",444],["rajapack.*",[444,445]],["avery-zweckform.com",446],["1xinternet.de",446],["futterhaus.de",446],["dasfutterhaus.at",446],["frischeparadies.de",446],["fmk-steuer.de",446],["selgros.de",446],["transgourmet.de",446],["mediapart.fr",447],["athlon.com",448],["alumniportal-deutschland.org",449],["snoopmedia.com",449],["myguide.de",449],["study-in-germany.de",449],["daad.de",449],["cornelsen.de",[450,451]],["vinmonopolet.no",453],["tvp.info",454],["tvp.pl",454],["tvpworld.com",454],["brtvp.pl",454],["tvpparlament.pl",454],["belsat.eu",454],["warnung.bund.de",455],["mediathek.lfv-bayern.de",456],["allegro.*",457],["allegrolokalnie.pl",457],["ceneo.pl",[457,562]],["czc.cz",457],["eon.pl",[458,459]],["ylasatakunta.fi",[460,461]],["mega-image.ro",462],["louisvuitton.com",463],["bodensee-airport.eu",464],["department56.com",465],["allendesignsstudio.com",465],["designsbylolita.co",465],["shop.enesco.com",465],["savoriurbane.com",466],["miumiu.com",467],["church-footwear.com",467],["clickdoc.fr",468],["car-interface.com",469],["monolithdesign.it",469],["smileypack.de",[470,471]],["malijunaki.si",472],["finom.co",473],["orange.es",[474,475]],["fdm-travel.dk",476],["hummel.dk",476],["jysk.nl",476],["power.no",476],["skousen.dk",476],["velliv.dk",476],["whiteaway.com",476],["whiteaway.no",476],["whiteaway.se",476],["skousen.no",476],["energinet.dk",476],["elkjop.no",477],["medimax.de",478],["lotto.it",479],["readspeaker.com",479],["team.blue",479],["ibistallinncenter.ee",480],["aaron.ai",481],["futureverse.com",482],["insights.com",483],["thebathcollection.com",484],["coastfashion.com",[485,486]],["oasisfashion.com",[485,486]],["warehousefashion.com",[485,486]],["misspap.com",[485,486]],["karenmillen.com",[485,486]],["boohooman.com",[485,486]],["hdt.de",487],["wolt.com",488],["myprivacy.dpgmedia.nl",489],["myprivacy.dpgmedia.be",489],["www.dpgmediagroup.com",489],["xohotels.com",490],["sim24.de",491],["tnt.com",492],["uza.be",493],["uzafoundation.be",493],["uzajobs.be",493],["bergzeit.*",[494,495]],["cinemas-lumiere.com",496],["cdiscount.com",497],["brabus.com",498],["roborock.com",499],["strumentimusicali.net",500],["maisonmargiela.com",501],["webfleet.com",502],["dragonflyshipping.ca",503],["broekhuis.nl",504],["groningenairport.nl",504],["nemck.cz",505],["bokio.se",506],["sap-press.com",507],["roughguides.com",[508,509]],["korvonal.com",510],["rexbo.*",512],["itau.com.br",513],["bbg.gv.at",514],["portal.taxi.eu",515],["topannonces.fr",516],["homap.fr",517],["artifica.fr",518],["plan-interactif.com",518],["ville-cesson.fr",518],["moismoliere.com",519],["unihomes.co.uk",520],["bkk.hu",521],["coiffhair.com",522],["ptc.eu",523],["ziegert-group.com",[524,629]],["lassuranceretraite.fr",525],["interieur.gouv.fr",525],["toureiffel.paris",525],["economie.gouv.fr",525],["education.gouv.fr",525],["livoo.fr",525],["su.se",525],["zappo.fr",525],["smdv.de",526],["digitalo.de",526],["petiteamelie.*",527],["mojanorwegia.pl",528],["koempf24.ch",[529,530]],["teichitekten24.de",[529,530]],["koempf24.de",[529,530]],["wolff-finnhaus-shop.de",[529,530]],["asnbank.nl",531],["blgwonen.nl",531],["regiobank.nl",531],["snsbank.nl",531],["vulcan.net.pl",[532,533]],["ogresnovads.lv",534],["partenamut.be",535],["pirelli.com",536],["unicredit.it",537],["effector.pl",538],["zikodermo.pl",[539,540]],["wassererleben.ch",541],["devolksbank.nl",542],["cyberport.de",544],["slevomat.cz",545],["kfzparts24.de",546],["runnersneed.com",547],["aachener-zeitung.de",548],["sportpursuit.com",549],["druni.es",[550,564]],["druni.pt",[550,564]],["delta.com",551],["onliner.by",[552,553]],["vejdirektoratet.dk",554],["usaa.com",555],["consorsbank.de",556],["metroag.de",557],["kupbilecik.pl",558],["oxfordeconomics.com",559],["oxfordeconomics.com.au",[560,561]],["routershop.nl",563],["woo.pt",563],["e-jumbo.gr",565],["alza.*",566],["rmf.fm",568],["rmf24.pl",568],["tracfone.com",569],["lequipe.fr",570],["gala.fr",571],["purepeople.com",572],["3sat.de",573],["zdf.de",573],["filmfund.lu",574],["welcometothejungle.com",574],["triblive.com",575],["rai.it",576],["fbto.nl",577],["europa.eu",578],["caisse-epargne.fr",579],["banquepopulaire.fr",579],["bigmammagroup.com",580],["studentagency.sk",580],["studentagency.eu",580],["winparts.be",581],["winparts.nl",581],["winparts.eu",582],["winparts.ie",582],["winparts.se",582],["sportano.*",[583,584]],["crocs.*",585],["chronext.ch",586],["chronext.de",586],["chronext.at",586],["chronext.com",587],["chronext.co.uk",587],["chronext.fr",588],["chronext.nl",589],["chronext.it",590],["galerieslafayette.com",591],["bazarchic.com",592],["stilord.*",593],["tiko.pt",594],["nsinternational.com",595],["laposte.fr",596],["meinbildkalender.de",597],["gls-group.com",598],["chilis.com",599],["account.bhvr.com",601],["everand.com",601],["lucidchart.com",601],["intercars.ro",[601,602]],["scribd.com",601],["guidepoint.com",601],["erlebnissennerei-zillertal.at",603],["hintertuxergletscher.at",603],["tiwag.at",603],["anwbvignetten.nl",604],["playseatstore.com",604],["swiss-sport.tv",606],["targobank-magazin.de",607],["zeit-verlagsgruppe.de",607],["online-physiotherapie.de",607],["kieferorthopaede-freisingsmile.de",608],["nltraining.nl",609],["kmudigital.at",610],["mintysquare.com",611],["consent.thetimes.com",612],["cadenaser.com",613],["berlinale.de",614],["lebonlogiciel.com",615],["pharmastar.it",616],["washingtonpost.com",617],["brillenplatz.de",618],["angelplatz.de",618],["dt.mef.gov.it",619],["raffeldeals.com",620],["offistore.fi",621],["collinsaerospace.com",622],["radioapp.lv",625],["hagengrote.de",626],["hemden-meister.de",626],["vorteilshop.com",627],["capristores.gr",628],["getaround.com",630],["technomarket.bg",631],["epiphone.com",633],["gibson.com",633],["maestroelectronics.com",633],["cropp.com",[634,635]],["housebrand.com",[634,635]],["mohito.com",[634,635]],["autoczescizielonki.pl",636],["portalridice.cz",637],["kitsapcu.org",638],["nutsinbulk.*",639],["berlin-buehnen.de",640],["metropoliten.rs",641],["educa2.madrid.org",642],["immohal.de",643],["sourcepoint.theguardian.com",644],["max.com",645],["rtlplay.be",646],["natgeotv.com",646],["llama.com",647],["meta.com",647],["ya.ru",648],["ipolska24.pl",649],["17bankow.com",649],["5mindlazdrowia.pl",649],["kazimierzdolny.pl",649],["vpolshchi.pl",649],["dobreprogramy.pl",649],["essanews.com",649],["dailywrap.ca",649],["dailywrap.uk",649],["money.pl",649],["autokult.pl",649],["komorkomania.pl",649],["polygamia.pl",649],["autocentrum.pl",649],["allani.pl",649],["homebook.pl",649],["domodi.pl",649],["jastrzabpost.pl",649],["open.fm",649],["gadzetomania.pl",649],["fotoblogia.pl",649],["abczdrowie.pl",649],["parenting.pl",649],["kafeteria.pl",649],["vibez.pl",649],["wakacje.pl",649],["extradom.pl",649],["totalmoney.pl",649],["superauto.pl",649],["nerwica.com",649],["forum.echirurgia.pl",649],["dailywrap.net",649],["pysznosci.pl",649],["genialne.pl",649],["finansowysupermarket.pl",649],["deliciousmagazine.pl",649],["audioteka.com",649],["easygo.pl",649],["so-magazyn.pl",649],["o2.pl",649],["pudelek.pl",649],["benchmark.pl",649],["wp.pl",649],["altibox.dk",650],["altibox.no",650],["uefa.com",651],["talksport.com",652],["zuiderzeemuseum.nl",653]]);
const exceptionsMap = new Map([]);
const hasEntities = true;
const hasAncestors = false;

const collectArgIndices = (hn, map, out) => {
    let argsIndices = map.get(hn);
    if ( argsIndices === undefined ) { return; }
    if ( typeof argsIndices !== 'number' ) {
        for ( const argsIndex of argsIndices ) {
            out.add(argsIndex);
        }
    } else {
        out.add(argsIndices);
    }
};

const indicesFromHostname = (hostname, suffix = '') => {
    const hnParts = hostname.split('.');
    const hnpartslen = hnParts.length;
    if ( hnpartslen === 0 ) { return; }
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = `${hnParts.slice(i).join('.')}${suffix}`;
        collectArgIndices(hn, hostnamesMap, todoIndices);
        collectArgIndices(hn, exceptionsMap, tonotdoIndices);
    }
    if ( hasEntities ) {
        const n = hnpartslen - 1;
        for ( let i = 0; i < n; i++ ) {
            for ( let j = n; j > i; j-- ) {
                const en = `${hnParts.slice(i,j).join('.')}.*${suffix}`;
                collectArgIndices(en, hostnamesMap, todoIndices);
                collectArgIndices(en, exceptionsMap, tonotdoIndices);
            }
        }
    }
};

const entries = (( ) => {
    const docloc = document.location;
    const origins = [ docloc.origin ];
    if ( docloc.ancestorOrigins ) {
        origins.push(...docloc.ancestorOrigins);
    }
    return origins.map((origin, i) => {
        const beg = origin.lastIndexOf('://');
        if ( beg === -1 ) { return; }
        const hn = origin.slice(beg+3)
        const end = hn.indexOf(':');
        return { hn: end === -1 ? hn : hn.slice(0, end), i };
    }).filter(a => a !== undefined);
})();
if ( entries.length === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = new Set();

indicesFromHostname(entries[0].hn);
if ( hasAncestors ) {
    for ( const entry of entries ) {
        if ( entry.i === 0 ) { continue; }
        indicesFromHostname(entry.hn, '>>');
    }
}

// Apply scriplets
for ( const i of todoIndices ) {
    if ( tonotdoIndices.has(i) ) { continue; }
    try { trustedClickElement(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
