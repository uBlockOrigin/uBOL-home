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
const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","500"],["button[title=\"REJECT ALL\"]","","1000"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","800"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[id=\"ue-accept-notice-button\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","800"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1000"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[onclick=\"cookiesAlert.rejectAll()\"]","","1000"],["button[title=\"Alle ablehnen\"]","","1800"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1000"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["button.css-15p2x3e.e112qvla0","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","1000"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button#wp-declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],[".b1m5dgh8 .deorxlo button[data-test-id=\"decline-button\"]","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#btn-accept-required-banner","","1000"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","1800"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],["a.ea_ignore","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button#onetrust-accept-btn-handler"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"]];
const hostnamesMap = new Map([["consent.google.*",0],["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["theguardian.com",6],["bloomberg.com",[7,8]],["forbes.com",[7,73]],["nike.com",7],["consent.fastcar.co.uk",7],["tapmaster.ca",7],["cmpv2.standard.co.uk",[9,10]],["cmpv2.independent.co.uk",[11,12,13,169]],["wetransfer.com",[14,15]],["spiegel.de",[16,17]],["nytimes.com",[18,165]],["consent.yahoo.com",19],["tumblr.com",20],["fplstatistics.co.uk",21],["fplstatistics.com",21],["e-shop.leonidas.com",22],["cdn.privacy-mgmt.com",[23,24,43,45,46,47,48,92,94,101,108,115,126,127,128,131,133,134,141,158,183,200,213,214,217,218,219,236,285,403,550,573,611,629]],["walmart.ca",25],["sams.com.mx",26],["my.tonies.com",27],["cambio-carsharing.de",27],["festool.*",27],["festoolcanada.com",27],["fuso-trucks.*",27],["tracker.fressnapf.de",27],["consent.ladbible.com",[28,29]],["consent.unilad.com",[28,29]],["consent.uniladtech.com",[28,29]],["consent.gamingbible.com",[28,29]],["consent.sportbible.com",[28,29]],["consent.tyla.com",[28,29]],["consent.ladbiblegroup.com",[28,29]],["m2o.it",30],["deejay.it",30],["capital.it",30],["ilmattino.it",[30,31]],["leggo.it",[30,31]],["libero.it",30],["tiscali.it",30],["consent-manager.ft.com",[32,33,34]],["hertz.*",35],["mediaworld.it",36],["mediamarkt.*",36],["mediamarktsaturn.com",37],["uber.com",[38,166]],["ubereats.com",[38,166]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["ilgiornale.it",44],["telekom.com",49],["telekom.net",49],["telekom.de",49],["abola.pt",50],["flytap.com",50],["ansons.de",50],["blick.ch",50],["buienradar.be",50],["crunchyroll.com",50],["digi24.ro",50],["digisport.ro",50],["digitalfoundry.net",50],["egx.net",50],["emirates.com",50],["eurogamer.it",50],["gmx.*",50],["kizi.com",50],["mail.com",50],["mcmcomiccon.com",50],["nachrichten.at",50],["nintendolife.com",50],["oe24.at",50],["paxsite.com",50],["peacocktv.com",50],["player.pl",50],["plus500.*",50],["pricerunner.com",50],["pricerunner.se",50],["pricerunner.dk",50],["proximus.be",[50,606]],["proximus.com",50],["purexbox.com",50],["pushsquare.com",50],["rugbypass.com",50],["southparkstudios.com",50],["southwest.com",50],["starwarscelebration.com",50],["sweatybetty.com",50],["thehaul.com",50],["timeextension.com",50],["travelandleisure.com",50],["tunein.com",50],["videoland.com",50],["wizzair.com",50],["wetter.at",50],["dicebreaker.com",[51,52]],["eurogamer.cz",[51,52]],["eurogamer.es",[51,52]],["eurogamer.net",[51,52]],["eurogamer.nl",[51,52]],["eurogamer.pl",[51,52]],["eurogamer.pt",[51,52]],["gamesindustry.biz",[51,52]],["jelly.deals",[51,52]],["reedpop.com",[51,52]],["rockpapershotgun.com",[51,52]],["thepopverse.com",[51,52]],["vg247.com",[51,52]],["videogameschronicle.com",[51,52]],["eurogamer.de",53],["roadtovr.com",54],["jotex.*",54],["mundodeportivo.com",[55,121]],["m.youtube.com",56],["www.youtube.com",56],["ohra.nl",57],["corriere.it",58],["gazzetta.it",58],["oggi.it",58],["cmp.sky.it",59],["tennisassa.fi",60],["formula1.com",61],["f1racing.pl",62],["music.amazon.*",[63,64]],["consent-pref.trustarc.com",65],["highlights.legaseriea.it",66],["calciomercato.com",66],["sosfanta.com",67],["chrono24.*",[68,69]],["wetter.com",70],["youmath.it",71],["pip.gov.pl",72],["dailybuzz.nl",74],["bnn.de",74],["dosenbach.ch",74],["dw.com",74],["kinepolis.*",74],["mediaite.com",74],["winfuture.de",74],["lippu.fi",74],["racingnews365.com",74],["reifendirekt.ch",74],["vaillant.*",74],["bauhaus.no",75],["bauhaus.se",75],["beko-group.de",75],["billiger.de",75],["burda.com",75],["vanharen.nl",75],["deichmann.com",[75,97,431]],["meraluna.de",75],["slashdot.org",75],["hermann-saunierduval.it",75],["protherm.cz",75],["saunierduval.es",75],["protherm.sk",75],["protherm.ua",75],["saunierduval.hu",75],["saunierduval.ro",75],["saunierduval.at",75],["awb.nl",75],["spar.hu",76],["group.vattenfall.com",76],["mediaset.it",77],["fortune.com",78],["ilrestodelcarlino.it",79],["quotidiano.net",79],["lanazione.it",79],["ilgiorno.it",79],["iltelegrafolivorno.it",79],["auto.it",80],["beauxarts.com",80],["beinsports.com",80],["bfmtv.com",[80,122]],["boursobank.com",80],["boursorama.com",[80,122]],["boursier.com",[80,207]],["brut.media",80],["canalplus.com",80],["decathlon.fr",[80,204]],["diverto.tv",80],["eden-park.com",80],["foodvisor.io",80],["frandroid.com",80],["jobijoba.*",80],["hotelsbarriere.com",80],["intersport.*",[80,180]],["idealista.it",80],["o2.fr",80],["lejdd.fr",[80,121]],["lechorepublicain.fr",80],["la-croix.com",80],["linfo.re",80],["lamontagne.fr",80],["laredoute.fr",80],["largus.fr",80],["leprogres.fr",80],["lesnumeriques.com",80],["libramemoria.com",80],["lopinion.fr",80],["marieclaire.fr",80],["maville.com",80],["michelin.*",80],["midilibre.fr",[80,633]],["meteofrance.com",80],["mondialtissus.fr",80],["orange.fr",80],["orpi.com",80],["oscaro.com",80],["ouest-france.fr",[80,93,122,634]],["parismatch.com",80],["pagesjaunes.fr",80],["programme-television.org",[80,122]],["publicsenat.fr",[80,122]],["rmcbfmplay.com",[80,122]],["science-et-vie.com",[80,121]],["seloger.com",80],["societe.com",80],["suzuki.fr",80],["sudouest.fr",80],["web-agri.fr",80],["nutri-plus.de",81],["aa.com",82],["americanairlines.*",82],["consent.capital.fr",83],["consent.voici.fr",83],["programme-tv.net",83],["cmpv2.finn.no",84],["cmp.e24.no",[85,86]],["minmote.no",[85,86]],["cmp.vg.no",[85,86]],["huffingtonpost.fr",87],["rainews.it",88],["remarkable.com",89],["netzwelt.de",90],["money.it",91],["allocine.fr",93],["jeuxvideo.com",93],["ozap.com",93],["le10sport.com",93],["xataka.com",93],["cmp.fitbook.de",94],["cmp.autobild.de",94],["sourcepoint.sport.de",94],["cmp-sp.tagesspiegel.de",94],["cmp.bz-berlin.de",94],["cmp.cicero.de",94],["cmp.techbook.de",94],["cmp.stylebook.de",94],["cmp2.bild.de",94],["cmp2.freiepresse.de",94],["sourcepoint.wetter.de",94],["consent.finanzen.at",94],["consent.up.welt.de",94],["sourcepoint.n-tv.de",94],["sourcepoint.kochbar.de",94],["sourcepoint.rtl.de",94],["cmp.computerbild.de",94],["cmp.petbook.de",94],["cmp-sp.siegener-zeitung.de",94],["cmp-sp.sportbuzzer.de",94],["klarmobil.de",94],["technikum-wien.at",95],["eneco.nl",96],["blackpoolgazette.co.uk",98],["lep.co.uk",98],["northamptonchron.co.uk",98],["scotsman.com",98],["shieldsgazette.com",98],["thestar.co.uk",98],["portsmouth.co.uk",98],["sunderlandecho.com",98],["northernirelandworld.com",98],["3addedminutes.com",98],["anguscountyworld.co.uk",98],["banburyguardian.co.uk",98],["bedfordtoday.co.uk",98],["biggleswadetoday.co.uk",98],["bucksherald.co.uk",98],["burnleyexpress.net",98],["buxtonadvertiser.co.uk",98],["chad.co.uk",98],["daventryexpress.co.uk",98],["derbyshiretimes.co.uk",98],["derbyworld.co.uk",98],["derryjournal.com",98],["dewsburyreporter.co.uk",98],["doncasterfreepress.co.uk",98],["falkirkherald.co.uk",98],["fifetoday.co.uk",98],["glasgowworld.com",98],["halifaxcourier.co.uk",98],["harboroughmail.co.uk",98],["harrogateadvertiser.co.uk",98],["hartlepoolmail.co.uk",98],["hemeltoday.co.uk",98],["hucknalldispatch.co.uk",98],["lancasterguardian.co.uk",98],["leightonbuzzardonline.co.uk",98],["lincolnshireworld.com",98],["liverpoolworld.uk",98],["londonworld.com",98],["lutontoday.co.uk",98],["manchesterworld.uk",98],["meltontimes.co.uk",98],["miltonkeynes.co.uk",98],["newcastleworld.com",98],["newryreporter.com",98],["newsletter.co.uk",98],["northantstelegraph.co.uk",98],["northumberlandgazette.co.uk",98],["nottinghamworld.com",98],["peterboroughtoday.co.uk",98],["rotherhamadvertiser.co.uk",98],["stornowaygazette.co.uk",98],["surreyworld.co.uk",98],["thescarboroughnews.co.uk",98],["thesouthernreporter.co.uk",98],["totallysnookered.com",98],["wakefieldexpress.co.uk",98],["walesworld.com",98],["warwickshireworld.com",98],["wigantoday.net",98],["worksopguardian.co.uk",98],["yorkshireeveningpost.co.uk",98],["yorkshirepost.co.uk",98],["eurocard.com",99],["saseurobonusmastercard.se",100],["tver.jp",102],["linkedin.com",103],["elmundo.es",[104,122]],["expansion.com",104],["s-pankki.fi",105],["srf.ch",105],["alternate.de",105],["bayer04.de",105],["douglas.de",105],["dr-beckmann.com",105],["falke.com",105],["fitnessfirst.de",105],["flaschenpost.de",105],["gloeckle.de",105],["hornbach.nl",105],["hypofriend.de",105],["lactostop.de",105],["neumann.com",105],["postbank.de",105],["immowelt.de",106],["joyn.*",106],["morenutrition.de",106],["mapillary.com",107],["cmp.seznam.cz",109],["marca.com",110],["raiplay.it",111],["derstandard.at",112],["derstandard.de",112],["faz.net",112],["automoto.it",113],["ansa.it",113],["delladio.it",113],["huffingtonpost.it",113],["internazionale.it",113],["lastampa.it",113],["macitynet.it",113],["moto.it",113],["movieplayer.it",113],["multiplayer.it",113],["repubblica.it",113],["tomshw.it",113],["spaziogames.it",113],["tuttoandroid.net",113],["tuttotech.net",113],["ilgazzettino.it",114],["ilmessaggero.it",114],["ilsecoloxix.it",114],["privacy.motorradonline.de",115],["consent.watson.de",115],["consent.kino.de",115],["consent.desired.de",115],["dailystar.co.uk",[116,117,118,119]],["mirror.co.uk",[116,117,118,119]],["idnes.cz",120],["20minutes.fr",121],["20minutos.es",121],["24sata.hr",121],["abc.es",121],["actu.fr",121],["antena3.com",121],["antena3internacional.com",121],["atresmedia.com",121],["atresmediapublicidad.com",121],["atresmediastudios.com",121],["atresplayer.com",121],["autopista.es",121],["belfasttelegraph.co.uk",121],["bemad.es",121],["bonduelle.it",121],["bonniernews.se",121],["bt.se",121],["cadenadial.com",121],["caracol.com.co",121],["cas.sk",121],["charentelibre.fr",121],["ciclismoafondo.es",121],["cnews.fr",121],["cope.es",121],["correryfitness.com",121],["courrier-picard.fr",121],["cuatro.com",121],["decathlon.nl",121],["decathlon.pl",121],["di.se",121],["diariocordoba.com",121],["diariodenavarra.es",121],["diariosur.es",121],["diariovasco.com",121],["diepresse.com",121],["divinity.es",121],["dn.se",121],["dnevnik.hr",121],["dumpert.nl",121],["ebuyclub.com",121],["edreams.de",121],["edreams.net",121],["elcomercio.es",121],["elconfidencial.com",121],["elcorreo.com",121],["eldesmarque.com",121],["eldiario.es",121],["eldiariomontanes.es",121],["elespanol.com",121],["elle.fr",121],["elpais.com",121],["elpais.es",121],["elperiodico.com",121],["elperiodicodearagon.com",121],["elplural.com",121],["energytv.es",121],["engadget.com",121],["es.ara.cat",121],["euronews.com",121],["europafm.com",121],["expressen.se",121],["factoriadeficcion.com",121],["filmstarts.de",121],["flooxernow.com",121],["folkbladet.nu",121],["footmercato.net",121],["france.tv",121],["france24.com",121],["francetvinfo.fr",121],["fussballtransfers.com",121],["fyndiq.se",121],["ghacks.net",121],["gva.be",121],["hbvl.be",121],["heraldo.es",121],["hoy.es",121],["ideal.es",121],["idealista.pt",121],["k.at",121],["krone.at",121],["kurier.at",121],["lacoste.com",121],["ladepeche.fr",121],["lalibre.be",121],["lanouvellerepublique.fr",121],["larazon.es",121],["lasexta.com",121],["lasprovincias.es",121],["latribune.fr",121],["lavanguardia.com",121],["laverdad.es",121],["lavozdegalicia.es",121],["leboncoin.fr",121],["lecturas.com",121],["ledauphine.com",121],["lejsl.com",121],["leparisien.fr",121],["lesoir.be",121],["letelegramme.fr",121],["levoixdunord.fr",121],["libremercado.com",121],["los40.com",121],["lotoquebec.com",121],["lunion.fr",121],["m6.fr",121],["marianne.cz",121],["marmiton.org",121],["mediaset.es",121],["melodia-fm.com",121],["metronieuws.nl",121],["moviepilot.de",121],["mtmad.es",121],["multilife.com.pl",121],["naszemiasto.pl",121],["nationalgeographic.com.es",121],["nicematin.com",121],["nieuwsblad.be",121],["notretemps.com",121],["numerama.com",121],["okdiario.com",121],["ondacero.es",121],["podiumpodcast.com",121],["portail.lotoquebec.com",121],["profil.at",121],["public.fr",121],["publico.es",121],["radiofrance.fr",121],["rankia.com",121],["rfi.fr",121],["rossmann.pl",121],["rtbf.be",[121,204]],["rtl.lu",121],["sensacine.com",121],["sfgame.net",121],["shure.com",121],["silicon.es",121],["sncf-connect.com",121],["sport.es",121],["sydsvenskan.se",121],["techcrunch.com",121],["telegraaf.nl",121],["telequebec.tv",121],["tf1.fr",121],["tradingsat.com",121],["trailrun.es",121],["video-streaming.orange.fr",121],["xpress.fr",121],["ivoox.com",122],["as.com",122],["slam.nl",122],["bienpublic.com",122],["funradio.fr",122],["gamepro.de",[122,177,178]],["lemon.fr",122],["lexpress.fr",122],["shadow.tech",122],["letemps.ch",122],["mein-mmo.de",122],["heureka.sk",122],["film.at",122],["dhnet.be",122],["lesechos.fr",[122,209]],["marianne.net",[122,204]],["jeanmarcmorandini.com",[122,205]],["dna.fr",122],["sudinfo.be",122],["europe1.fr",[122,205]],["rtl.be",[122,204]],["reviewingthebrew.com",122],["jaysjournal.com",122],["reignoftroy.com",122],["ryobitools.eu",[123,124]],["americanexpress.com",125],["consent.radiotimes.com",128],["sp-consent.szbz.de",129],["cmp.omni.se",130],["cmp.svd.se",130],["cmp.aftonbladet.se",130],["cmp.tv.nu",130],["consent.economist.com",132],["studentagency.cz",132],["cmpv2.foundryco.com",133],["cmpv2.infoworld.com",133],["cmpv2.arnnet.com.au",133],["sp-cdn.pcgames.de",134],["sp-cdn.pcgameshardware.de",134],["consentv2.sport1.de",134],["cmp.mz.de",134],["cmpv2.tori.fi",135],["cdn.privacy-mgmt.co",136],["consent.spielaffe.de",137],["bondekompaniet.no",138],["degiro.*",138],["epochtimes.de",138],["vikingline.com",138],["tfl.gov.uk",138],["drklein.de",138],["hildegardis-krankenhaus.de",138],["kleer.se",138],["lekiaviation.com",138],["lotto.pl",138],["mineralstech.com",138],["volunteer.digitalboost.org.uk",138],["starhotels.com",138],["tefl.com",138],["universumglobal.com",138],["1und1.de",139],["infranken.de",140],["cmp.bunte.de",141],["cmp.chip.de",141],["cmp.focus.de",[141,458]],["estadiodeportivo.com",142],["tameteo.*",142],["tempo.pt",142],["meteored.*",142],["pogoda.com",142],["yourweather.co.uk",142],["tempo.com",142],["theweather.net",142],["tiempo.com",142],["ilmeteo.net",142],["daswetter.com",142],["kicker.de",143],["formulatv.com",144],["web.de",145],["lefigaro.fr",146],["linternaute.com",147],["consent.caminteresse.fr",148],["volksfreund.de",149],["rp-online.de",149],["dailypost.co.uk",150],["the-express.com",150],["bluray-disc.de",151],["elio-systems.com",151],["stagatha-fachklinik.de",151],["tarife.mediamarkt.de",151],["lz.de",151],["gaggenau.com",151],["saturn.de",152],["eltiempo.es",[153,154]],["otempo.pt",155],["atlasformen.*",156],["cmp-sp.goettinger-tageblatt.de",157],["cmp-sp.saechsische.de",157],["cmp-sp.ln-online.de",157],["cz.de",157],["dewezet.de",157],["dnn.de",157],["haz.de",157],["gnz.de",157],["landeszeitung.de",157],["lvz.de",157],["maz-online.de",157],["ndz.de",157],["op-marburg.de",157],["ostsee-zeitung.de",157],["paz-online.de",157],["reisereporter.de",157],["rga.de",157],["rnd.de",157],["siegener-zeitung.de",157],["sn-online.de",157],["solinger-tageblatt.de",157],["sportbuzzer.de",157],["szlz.de",157],["tah.de",157],["torgauerzeitung.de",157],["waz-online.de",157],["privacy.maennersache.de",157],["sinergy.ch",159],["agglo-valais-central.ch",159],["biomedcentral.com",160],["hsbc.*",161],["hsbcnet.com",161],["hsbcinnovationbanking.com",161],["create.hsbc",161],["gbm.hsbc.com",161],["hsbc.co.uk",162],["internationalservices.hsbc.com",162],["history.hsbc.com",162],["about.hsbc.co.uk",163],["privatebanking.hsbc.com",164],["independent.co.uk",167],["privacy.crash.net",167],["the-independent.com",168],["argos.co.uk",170],["poco.de",[171,172]],["moebelix.*",171],["moemax.*",171],["xxxlutz.*",171],["xxxlesnina.*",171],["moebel24.ch",172],["meubles.fr",172],["meubelo.nl",172],["moebel.de",172],["lipo.ch",173],["schubiger.ch",174],["aedt.de",175],["berlin-live.de",175],["connect.de",175],["gutefrage.net",175],["insideparadeplatz.ch",175],["morgenpost.de",175],["play3.de",175],["thueringen24.de",175],["pdfupload.io",176],["gamestar.de",[177,178,213]],["verksamt.se",179],["acmemarkets.com",180],["amtrak.com",180],["beko.com",180],["bepanthen.com.au",180],["berocca.com.au",180],["booking.com",180],["carrefour.fr",180],["centrum.sk",180],["claratyne.com.au",180],["credit-suisse.com",180],["ceskatelevize.cz",180],["deporvillage.*",180],["de.vanguard",180],["dhl.de",180],["digikey.*",180],["drafthouse.com",180],["dunelm.com",180],["fello.se",180],["flashscore.fr",180],["flightradar24.com",180],["fnac.es",180],["foodandwine.com",180],["fourseasons.com",180],["khanacademy.org",180],["konami.com",180],["jll.*",180],["jobs.redbull.com",180],["hellenicbank.com",180],["gemini.pl",180],["groceries.asda.com",180],["lamborghini.com",180],["menshealth.com",180],["n26.com",180],["nintendo.com",180],["oneweb.net",180],["omnipod.com",180],["oralb.*",180],["panasonic.com",180],["parkside-diy.com",180],["pluto.tv",180],["popularmechanics.com",180],["polskieradio.pl",180],["radissonhotels.com",180],["ricardo.ch",180],["rockstargames.com",180],["rte.ie",180],["salesforce.com",180],["samsonite.*",180],["spirit.com",180],["stenaline.co.uk",180],["swisscom.ch",180],["swisspass.ch",180],["technologyfromsage.com",180],["telenet.be",180],["tntsports.co.uk",180],["theepochtimes.com",180],["toujeo.com",180],["questdiagnostics.com",180],["wallapop.com",180],["wickes.co.uk",180],["workingtitlefilms.com",180],["vattenfall.de",180],["winparts.fr",180],["yoigo.com",180],["zoominfo.com",180],["allegiantair.com",181],["hallmarkchannel.com",181],["incorez.com",181],["noovle.com",181],["otter.ai",181],["plarium.com",181],["telsy.com",181],["timenterprise.it",181],["tim.it",181],["tradersunion.com",181],["fnac.*",181],["yeti.com",181],["here.com",[182,642]],["vodafone.com",182],["cmp.heise.de",184],["cmp.am-online.com",184],["cmp.motorcyclenews.com",184],["consent.newsnow.co.uk",184],["cmp.todays-golfer.com",184],["koeser.com",185],["shop.schaette-pferd.de",185],["schaette.de",185],["ocre-project.eu",186],["central-bb.de",187],["brainmarket.pl",188],["getroots.app",189],["cart-in.re",[190,569]],["prestonpublishing.pl",191],["zara.com",192],["lepermislibre.fr",192],["negociardivida.spcbrasil.org.br",193],["adidas.*",194],["privacy.topreality.sk",195],["privacy.autobazar.eu",195],["vu.lt",196],["adnkronos.com",[197,198]],["cornwalllive.com",[197,198]],["cyprus-mail.com",[197,198]],["einthusan.tv",[197,198]],["informazione.it",[197,198]],["mymovies.it",[197,198]],["tuttoeuropei.com",[197,198]],["video.lacnews24.it",[197,198]],["protothema.gr",197],["flash.gr",197],["taxscouts.com",199],["online.no",201],["telenor.no",201],["austrian.com",202],["lufthansa.com",202],["kampfkunst-herz.de",203],["glow25.de",203],["hornetsecurity.com",203],["kayzen.io",203],["wasserkunst-hamburg.de",203],["zahnspange-oelde.de",203],["bnc.ca",204],["egora.fr",204],["engelvoelkers.com",204],["estrategiasdeinversion.com",204],["festo.com",204],["francebleu.fr",204],["francemediasmonde.com",204],["geny.com",204],["giphy.com",204],["idealista.com",204],["infolibre.es",204],["information.tv5monde.com",204],["ing.es",204],["knipex.de",204],["laprovence.com",204],["lemondeinformatique.fr",204],["libertaddigital.com",204],["mappy.com",204],["orf.at",204],["philibertnet.com",204],["researchgate.net",204],["standaard.be",204],["stroilioro.com",204],["taxfix.de",204],["telecinco.es",204],["vistaalegre.com",204],["zimbra.free.fr",204],["usinenouvelle.com",206],["reussir.fr",208],["bruendl.at",210],["latamairlines.com",211],["elisa.ee",212],["baseendpoint.brigitte.de",213],["baseendpoint.gala.de",213],["baseendpoint.haeuser.de",213],["baseendpoint.stern.de",213],["baseendpoint.urbia.de",213],["cmp.tag24.de",213],["cmp-sp.handelsblatt.com",213],["cmpv2.berliner-zeitung.de",213],["golem.de",213],["consent.t-online.de",213],["sp-consent.stuttgarter-nachrichten.de",214],["sp-consent.stuttgarter-zeitung.de",214],["regjeringen.no",215],["sp-manager-magazin-de.manager-magazin.de",216],["consent.11freunde.de",216],["centrum24.pl",220],["replay.lsm.lv",221],["ltv.lsm.lv",221],["bernistaba.lsm.lv",221],["stadt-wien.at",222],["verl.de",222],["cubo-sauna.de",222],["mbl.is",222],["auto-medienportal.net",222],["mobile.de",223],["cookist.it",224],["fanpage.it",224],["geopop.it",224],["lexplain.it",224],["royalmail.com",225],["gmx.net",226],["gmx.ch",227],["mojehobby.pl",228],["super-hobby.*",228],["sp.stylevamp.de",229],["cmp.wetteronline.de",229],["audi.*",230],["easyjet.com",230],["experian.co.uk",230],["postoffice.co.uk",230],["tescobank.com",230],["internetaptieka.lv",[231,232]],["wells.pt",233],["dskdirect.bg",234],["cmpv2.dba.dk",235],["spcmp.crosswordsolver.com",236],["ecco.com",237],["thomann.de",238],["landkreis-kronach.de",239],["northcoast.com",240],["chaingpt.org",240],["bandenconcurrent.nl",241],["bandenexpert.be",241],["reserved.com",242],["metro.it",243],["makro.es",243],["metro.sk",243],["metro-cc.hr",243],["makro.nl",243],["metro.bg",243],["metro.at",243],["metro-tr.com",243],["metro.de",243],["metro.fr",243],["makro.cz",243],["metro.ro",243],["makro.pt",243],["makro.pl",243],["sklepy-odido.pl",243],["rastreator.com",243],["metro.ua",244],["metro.rs",244],["metro-kz.com",244],["metro.md",244],["metro.hu",244],["metro-cc.ru",244],["metro.pk",244],["balay.es",245],["constructa.com",245],["dafy-moto.com",246],["akku-shop.nl",247],["akkushop-austria.at",247],["akkushop-b2b.de",247],["akkushop.de",247],["akkushop.dk",247],["batterie-boutique.fr",247],["akkushop-schweiz.ch",248],["evzuttya.com.ua",249],["eobuv.cz",249],["eobuwie.com.pl",249],["ecipele.hr",249],["eavalyne.lt",249],["efootwear.eu",249],["eschuhe.ch",249],["eskor.se",249],["chaussures.fr",249],["ecipo.hu",249],["eobuv.com.ua",249],["eobuv.sk",249],["epantofi.ro",249],["epapoutsia.gr",249],["escarpe.it",249],["eschuhe.de",249],["obuvki.bg",249],["zapatos.es",249],["swedbank.ee",250],["mudanzavila.es",251],["bienmanger.com",252],["gesipa.*",253],["gesipausa.com",253],["beckhoff.com",253],["zitekick.dk",254],["eltechno.dk",254],["okazik.pl",254],["batteryempire.*",255],["maxi.rs",256],["garmin.com",257],["invisalign.*",257],["one4all.ie",257],["osprey.com",257],["wideroe.no",258],["bmw.*",259],["kijk.nl",260],["nordania.dk",261],["danskebank.*",261],["danskeci.com",261],["danicapension.dk",261],["dehn.*",262],["gewerbegebiete.de",263],["cordia.fr",264],["vola.fr",265],["lafi.fr",266],["skyscanner.*",267],["coolblue.*",268],["sanareva.*",269],["atida.fr",269],["bbva.*",270],["bbvauk.com",270],["expertise.unimi.it",271],["altenberg.de",272],["vestel.es",273],["tsb.co.uk",274],["buienradar.nl",[275,276]],["linsenplatz.de",277],["budni.de",278],["erstecardclub.hr",278],["teufel.de",[279,280]],["abp.nl",281],["simplea.sk",282],["flip.bg",283],["kiertokanki.com",284],["leirovins.be",286],["vias.be",287],["edf.fr",288],["virbac.com",288],["diners.hr",288],["squarehabitat.fr",288],["arbitrobancariofinanziario.it",289],["ivass.it",289],["economiapertutti.bancaditalia.it",289],["smit-sport.de",290],["gekko-computer.de",290],["jysk.al",291],["go-e.com",292],["malerblatt-medienservice.de",293],["architekturbuch.de",293],["medienservice-holz.de",293],["leuchtstark.de",293],["casius.nl",294],["coolinarika.com",295],["giga-hamburg.de",295],["vakgaragevannunen.nl",295],["fortuluz.es",295],["finna.fi",295],["eurogrow.es",295],["vakgaragevandertholen.nl",295],["whufc.com",295],["envafors.dk",296],["dabbolig.dk",[297,298]],["spp.nextpit.fr",299],["daruk-emelok.hu",300],["exakta.se",301],["larca.de",302],["roli.com",303],["okazii.ro",304],["lr-shop-direkt.de",304],["portalprzedszkolny.pl",304],["tgvinoui.sncf",305],["l-bank.de",306],["interhyp.de",307],["indigoneo.*",308],["transparency.meta.com",309],["dojusagro.lt",310],["eok.ee",310],["kripa.it",310],["nextdaycatering.co.uk",310],["safran-group.com",310],["sr-ramenendeuren.be",310],["ilovefreegle.org",310],["tribexr.com",310],["bestbuycyprus.com",311],["strato.*",312],["strato-hosting.co.uk",312],["auto.de",313],["contentkingapp.com",314],["otterbox.com",315],["stoertebeker-brauquartier.com",316],["stoertebeker.com",316],["stoertebeker-eph.com",316],["aparts.pl",317],["sinsay.com",[318,319]],["benu.cz",320],["stockholmresilience.org",321],["ludvika.se",321],["kammarkollegiet.se",321],["cazenovecapital.com",322],["statestreet.com",323],["beopen.lv",324],["cesukoncertzale.lv",325],["dodo.fr",326],["pepper.it",327],["pepper.pl",327],["preisjaeger.at",327],["mydealz.de",327],["dealabs.com",327],["hotukdeals.com",327],["chollometro.com",327],["makelaarsland.nl",328],["bricklink.com",329],["bestinver.es",330],["icvs2023.conf.tuwien.ac.at",331],["racshop.co.uk",[332,333]],["baabuk.com",334],["sapien.io",334],["app.lepermislibre.fr",335],["multioferta.es",336],["testwise.com",[337,338]],["tonyschocolonely.com",339],["fitplus.is",339],["fransdegrebber.nl",339],["lilliputpress.ie",339],["lexibo.com",339],["marin-milou.com",339],["dare2tri.com",339],["t3micro.*",339],["la-vie-naturelle.com",[340,341]],["inovelli.com",342],["uonetplus.vulcan.net.pl",[343,344]],["consent.helagotland.se",345],["oper.koeln",[346,347]],["deezer.com",348],["console.scaleway.com",349],["hoteldesartssaigon.com",350],["autoritedelaconcurrence.fr",351],["groupeonepoint.com",351],["geneanet.org",351],["carrieres.groupegalerieslafayette.com",351],["clickskeks.at",352],["clickskeks.de",352],["abt-sportsline.de",352],["forbo.com",353],["stores.sk",353],["nerdstar.de",353],["prace.cz",353],["profesia.sk",353],["profesia.cz",353],["pracezarohem.cz",353],["atmoskop.cz",353],["seduo.sk",353],["seduo.cz",353],["teamio.com",353],["arnold-robot.com",353],["cvonline.lt",353],["cv.lv",353],["cv.ee",353],["dirbam.lt",353],["visidarbi.lv",353],["otsintood.ee",353],["webtic.it",353],["gerth.de",354],["pamiatki.pl",355],["initse.com",356],["salvagny.org",357],["augsburger-allgemeine.de",358],["stabila.com",359],["stwater.co.uk",360],["suncalc.org",[361,362]],["swisstph.ch",363],["taxinstitute.ie",364],["get-in-it.de",365],["tempcover.com",[366,367]],["guildford.gov.uk",368],["easyparts.*",[369,370]],["easyparts-recambios.es",[369,370]],["easyparts-rollerteile.de",[369,370]],["drimsim.com",371],["canyon.com",[372,373]],["vevovo.be",[374,375]],["vendezvotrevoiture.be",[374,375]],["wirkaufendeinauto.at",[374,375]],["vikoberallebiler.dk",[374,375]],["wijkopenautos.nl",[374,375]],["vikoperdinbil.se",[374,375]],["noicompriamoauto.it",[374,375]],["vendezvotrevoiture.fr",[374,375]],["compramostucoche.es",[374,375]],["wijkopenautos.be",[374,375]],["auto-doc.*",376],["autodoc.*",376],["autodoc24.*",376],["topautoosat.fi",376],["autoteiledirekt.de",376],["autoczescionline24.pl",376],["tuttoautoricambi.it",376],["onlinecarparts.co.uk",376],["autoalkatreszek24.hu",376],["autodielyonline24.sk",376],["reservdelar24.se",376],["pecasauto24.pt",376],["reservedeler24.co.no",376],["piecesauto24.lu",376],["rezervesdalas24.lv",376],["besteonderdelen.nl",376],["recambioscoche.es",376],["antallaktikaexartimata.gr",376],["piecesauto.fr",376],["teile-direkt.ch",376],["lpi.org",377],["refurbed.*",378],["flyingtiger.com",[379,517]],["borgomontecedrone.it",379],["recaro-shop.com",379],["gartenhotel-crystal.at",379],["fayn.com",380],["sklavenitis.gr",381],["eam-netz.de",382],["umicore.*",383],["veiligverkeer.be",383],["vsv.be",383],["dehogerielen.be",383],["gera.de",384],["mfr-chessy.fr",385],["mfr-lamure.fr",385],["mfr-saint-romain.fr",385],["mfr-lapalma.fr",385],["mfrvilliemorgon.asso.fr",385],["mfr-charentay.fr",385],["mfr.fr",385],["nationaltrust.org.uk",386],["hej-natural.*",387],["ib-hansmeier.de",388],["rsag.de",389],["esaa-eu.org",389],["aknw.de",389],["answear.*",390],["theprotocol.it",[391,392]],["lightandland.co.uk",393],["etransport.pl",394],["wohnen-im-alter.de",395],["johnmuirhealth.com",[396,397]],["markushaenni.com",398],["airbaltic.com",399],["gamersgate.com",399],["zorgzaam010.nl",400],["etos.nl",401],["paruvendu.fr",402],["cmpv2.bistro.sk",404],["privacy.bazar.sk",404],["hennamorena.com",405],["newsello.pl",406],["porp.pl",407],["golfbreaks.com",408],["lieferando.de",409],["just-eat.*",409],["justeat.*",409],["pyszne.pl",409],["lieferando.at",409],["takeaway.com",409],["thuisbezorgd.nl",409],["holidayhypermarket.co.uk",410],["atu.de",411],["atu-flottenloesungen.de",411],["but.fr",411],["edeka.de",411],["fortuneo.fr",411],["maif.fr",411],["particuliers.sg.fr",411],["sparkasse.at",411],["group.vig",411],["tf1info.fr",411],["dpdgroup.com",412],["dpd.fr",412],["dpd.com",412],["cosmosdirekt.de",412],["bstrongoutlet.pt",413],["nobbot.com",414],["isarradweg.de",[415,416]],["flaxmanestates.com",416],["inland-casas.com",416],["finlayson.fi",[417,418]],["cowaymega.ca",[417,418]],["arktis.de",419],["desktronic.de",419],["belleek.com",419],["brauzz.com",419],["cowaymega.com",419],["dockin.de",419],["dryrobe.com",[419,420]],["formswim.com",419],["hairtalk.se",419],["hallmark.co.uk",[419,420]],["loopearplugs.com",[419,420]],["oleus.com",419],["peopleofshibuya.com",419],["pullup-dip.com",419],["sanctum.shop",419],["tartanblanketco.com",419],["desktronic.*",420],["tepedirect.com",420],["paper-republic.com",420],["pullup-dip.*",420],["smythstoys.com",421],["beam.co.uk",[422,423]],["autobahn.de",424],["consent-cdn.zeit.de",425],["coway-usa.com",426],["steiners.shop",427],["ecmrecords.com",428],["malaikaraiss.com",428],["koch-mit.de",428],["zeitreisen.zeit.de",428],["wefashion.com",429],["merkur.dk",430],["ionos.*",432],["omegawatches.com",433],["carefully.be",434],["aerotime.aero",434],["rocket-league.com",435],["dws.com",436],["bosch-homecomfort.com",437],["elmleblanc-optibox.fr",437],["monservicechauffage.fr",437],["boschrexroth.com",437],["home-connect.com",438],["lowrider.at",[439,440]],["mesto.de",441],["intersport.gr",442],["intersport.bg",442],["intersport.com.cy",442],["intersport.ro",442],["ticsante.com",443],["techopital.com",443],["millenniumprize.org",444],["hepster.com",445],["ellisphere.fr",446],["peterstaler.de",447],["blackforest-still.de",447],["tiendaplayaundi.com",448],["ajtix.co.uk",449],["raja.fr",450],["rajarani.de",450],["rajapack.*",[450,451]],["avery-zweckform.com",452],["1xinternet.de",452],["futterhaus.de",452],["dasfutterhaus.at",452],["frischeparadies.de",452],["fmk-steuer.de",452],["selgros.de",452],["transgourmet.de",452],["mediapart.fr",453],["athlon.com",454],["alumniportal-deutschland.org",455],["snoopmedia.com",455],["myguide.de",455],["study-in-germany.de",455],["daad.de",455],["cornelsen.de",[456,457]],["vinmonopolet.no",459],["tvp.info",460],["tvp.pl",460],["tvpworld.com",460],["brtvp.pl",460],["tvpparlament.pl",460],["belsat.eu",460],["warnung.bund.de",461],["mediathek.lfv-bayern.de",462],["allegro.*",463],["allegrolokalnie.pl",463],["ceneo.pl",463],["czc.cz",463],["eon.pl",[464,465]],["ylasatakunta.fi",[466,467]],["mega-image.ro",468],["louisvuitton.com",469],["bodensee-airport.eu",470],["department56.com",471],["allendesignsstudio.com",471],["designsbylolita.co",471],["shop.enesco.com",471],["savoriurbane.com",472],["miumiu.com",473],["church-footwear.com",473],["clickdoc.fr",474],["car-interface.com",475],["monolithdesign.it",475],["smileypack.de",[476,477]],["malijunaki.si",478],["finom.co",479],["orange.es",[480,481]],["fdm-travel.dk",482],["hummel.dk",482],["jysk.nl",482],["power.no",482],["skousen.dk",482],["velliv.dk",482],["whiteaway.com",482],["whiteaway.no",482],["whiteaway.se",482],["skousen.no",482],["energinet.dk",482],["elkjop.no",483],["medimax.de",484],["costautoricambi.com",485],["lotto.it",485],["readspeaker.com",485],["team.blue",485],["ibistallinncenter.ee",486],["aaron.ai",487],["futureverse.com",488],["tandem.co.uk",488],["insights.com",489],["thebathcollection.com",490],["coastfashion.com",[491,492]],["oasisfashion.com",[491,492]],["warehousefashion.com",[491,492]],["misspap.com",[491,492]],["karenmillen.com",[491,492]],["boohooman.com",[491,492]],["hdt.de",493],["wolt.com",494],["myprivacy.dpgmedia.nl",495],["myprivacy.dpgmedia.be",495],["www.dpgmediagroup.com",495],["xohotels.com",496],["sim24.de",497],["tnt.com",498],["uza.be",499],["uzafoundation.be",499],["uzajobs.be",499],["bergzeit.*",[500,501]],["cinemas-lumiere.com",502],["cdiscount.com",503],["brabus.com",504],["roborock.com",505],["strumentimusicali.net",506],["maisonmargiela.com",507],["webfleet.com",508],["dragonflyshipping.ca",509],["broekhuis.nl",510],["groningenairport.nl",510],["nemck.cz",511],["bokio.se",512],["sap-press.com",513],["roughguides.com",[514,515]],["korvonal.com",516],["rexbo.*",518],["itau.com.br",519],["bbg.gv.at",520],["portal.taxi.eu",521],["topannonces.fr",522],["homap.fr",523],["artifica.fr",524],["plan-interactif.com",524],["ville-cesson.fr",524],["moismoliere.com",525],["unihomes.co.uk",526],["bkk.hu",527],["coiffhair.com",528],["ptc.eu",529],["ziegert-group.com",[530,639]],["lassuranceretraite.fr",531],["interieur.gouv.fr",531],["toureiffel.paris",531],["economie.gouv.fr",531],["education.gouv.fr",531],["livoo.fr",531],["su.se",531],["zappo.fr",531],["smdv.de",532],["digitalo.de",532],["petiteamelie.*",533],["mojanorwegia.pl",534],["koempf24.ch",[535,536]],["teichitekten24.de",[535,536]],["koempf24.de",[535,536]],["wolff-finnhaus-shop.de",[535,536]],["asnbank.nl",537],["blgwonen.nl",537],["regiobank.nl",537],["snsbank.nl",537],["vulcan.net.pl",[538,539]],["ogresnovads.lv",540],["partenamut.be",541],["pirelli.com",542],["unicredit.it",543],["effector.pl",544],["zikodermo.pl",[545,546]],["wassererleben.ch",547],["devolksbank.nl",548],["caixabank.es",549],["cyberport.de",551],["cyberport.at",551],["slevomat.cz",552],["kfzparts24.de",553],["runnersneed.com",554],["aachener-zeitung.de",555],["sportpursuit.com",556],["druni.es",[557,570]],["druni.pt",[557,570]],["delta.com",558],["onliner.by",[559,560]],["vejdirektoratet.dk",561],["usaa.com",562],["consorsbank.de",563],["metroag.de",564],["kupbilecik.pl",565],["oxfordeconomics.com",566],["oxfordeconomics.com.au",[567,568]],["routershop.nl",569],["woo.pt",569],["e-jumbo.gr",571],["alza.*",572],["rmf.fm",574],["rmf24.pl",574],["tracfone.com",575],["lequipe.fr",576],["gala.fr",577],["purepeople.com",578],["3sat.de",579],["zdf.de",579],["filmfund.lu",580],["welcometothejungle.com",580],["triblive.com",581],["rai.it",582],["fbto.nl",583],["europa.eu",584],["caisse-epargne.fr",585],["banquepopulaire.fr",585],["bigmammagroup.com",586],["studentagency.sk",586],["studentagency.eu",586],["winparts.be",587],["winparts.nl",587],["winparts.eu",588],["winparts.ie",588],["winparts.se",588],["sportano.*",[589,590]],["crocs.*",591],["chronext.ch",592],["chronext.de",592],["chronext.at",592],["chronext.com",593],["chronext.co.uk",593],["chronext.fr",594],["chronext.nl",595],["chronext.it",596],["galerieslafayette.com",597],["bazarchic.com",598],["stilord.*",599],["tiko.pt",600],["nsinternational.com",601],["laposte.fr",602],["meinbildkalender.de",603],["gls-group.com",604],["chilis.com",605],["account.bhvr.com",607],["everand.com",607],["lucidchart.com",607],["intercars.ro",[607,608]],["scribd.com",607],["guidepoint.com",607],["erlebnissennerei-zillertal.at",609],["hintertuxergletscher.at",609],["tiwag.at",609],["anwbvignetten.nl",610],["playseatstore.com",610],["swiss-sport.tv",612],["targobank-magazin.de",613],["zeit-verlagsgruppe.de",613],["online-physiotherapie.de",613],["kieferorthopaede-freisingsmile.de",614],["nltraining.nl",615],["kmudigital.at",616],["mintysquare.com",617],["consent.thetimes.com",618],["cadenaser.com",619],["berlinale.de",620],["lebonlogiciel.com",621],["pharmastar.it",622],["washingtonpost.com",623],["brillenplatz.de",624],["angelplatz.de",624],["dt.mef.gov.it",625],["raffeldeals.com",626],["stepstone.de",627],["kobo.com",628],["zoxs.de",630],["offistore.fi",631],["collinsaerospace.com",632],["radioapp.lv",635],["hagengrote.de",636],["hemden-meister.de",636],["vorteilshop.com",637],["capristores.gr",638],["getaround.com",640],["technomarket.bg",641],["epiphone.com",643],["gibson.com",643],["maestroelectronics.com",643],["cropp.com",[644,645]],["housebrand.com",[644,645]],["mohito.com",[644,645]],["autoczescizielonki.pl",646],["b-s.de",647],["earpros.com",648],["portalridice.cz",649],["kitsapcu.org",650],["nutsinbulk.*",651],["berlin-buehnen.de",652],["metropoliten.rs",653],["educa2.madrid.org",654],["immohal.de",655],["sourcepoint.theguardian.com",656],["rtlplay.be",657],["natgeotv.com",657],["llama.com",658],["meta.com",658],["setasdesevilla.com",659],["cruyff-foundation.org",660],["allianz.*",661],["energiedirect-bayern.de",662],["postnl.be",663],["postnl.nl",663],["sacyr.com",664],["openbank.*",665],["knax.de",666],["ordblindenetvaerket.dk",667],["boligbeton.dk",667],["dukh.dk",667],["pevgrow.com",668],["ya.ru",669],["ipolska24.pl",670],["17bankow.com",670],["5mindlazdrowia.pl",670],["kazimierzdolny.pl",670],["vpolshchi.pl",670],["dobreprogramy.pl",670],["essanews.com",670],["dailywrap.ca",670],["dailywrap.uk",670],["money.pl",670],["autokult.pl",670],["komorkomania.pl",670],["polygamia.pl",670],["autocentrum.pl",670],["allani.pl",670],["homebook.pl",670],["domodi.pl",670],["jastrzabpost.pl",670],["open.fm",670],["gadzetomania.pl",670],["fotoblogia.pl",670],["abczdrowie.pl",670],["parenting.pl",670],["kafeteria.pl",670],["vibez.pl",670],["wakacje.pl",670],["extradom.pl",670],["totalmoney.pl",670],["superauto.pl",670],["nerwica.com",670],["forum.echirurgia.pl",670],["dailywrap.net",670],["pysznosci.pl",670],["genialne.pl",670],["finansowysupermarket.pl",670],["deliciousmagazine.pl",670],["audioteka.com",670],["easygo.pl",670],["so-magazyn.pl",670],["o2.pl",670],["pudelek.pl",670],["benchmark.pl",670],["wp.pl",670],["altibox.dk",671],["altibox.no",671],["uefa.com",672],["talksport.com",673],["zuiderzeemuseum.nl",674],["gota.io",675]]);
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
