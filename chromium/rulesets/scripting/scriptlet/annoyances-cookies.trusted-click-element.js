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
const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","500"],["button[title=\"REJECT ALL\"]","","1000"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","800"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[id=\"ue-accept-notice-button\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Aceitar todos\"]","","1000"],["button.cta-button[title=\"Tümünü reddet\"]"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","800"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1000"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[onclick=\"cookiesAlert.rejectAll()\"]","","1000"],["button[title=\"Alle ablehnen\"]","","1800"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1500"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["button.cmplz-deny","","1000"],["button[aria-label=\"Reject all\"]","","1000"],["button[title=\"Aceptar y continuar\"]","","1000"],["button[title=\"Accettare e continuare\"]","","1000"],["button[title=\"Concordar\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["button.css-15p2x3e.e112qvla0","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1600"],["button[data-testing=\"cookie-bar-deny-all\"]","","1000"],["button.shared-elements-cookies-popup__modify-button","","1100"],["button.shared-cookies-modal__current-button","","1300"],["button#cookie-custom","","1200"],["button#cookie-save","","1800"],["div.rejectLink___zHIdj","","1000"],[".cmp-root-container >>> .cmp-button-accept-all","","1000"],["a[data-mrf-role=\"userPayToReject\"]","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button.primary","","1000"],["a[onclick=\"denyCookiePolicyAndSetHash();\"]","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","2800"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button#wp-declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["button[data-test-id=\"decline-button\"]","","2400"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#btn-accept-required-banner","","1000"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","1800"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],["a.ea_ignore","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button.btn-secondary","","1800"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["input#popup_ok","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"]];
const hostnamesMap = new Map([["consent.google.*",0],["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["theguardian.com",6],["bloomberg.com",[7,8]],["forbes.com",[7,73]],["nike.com",7],["consent.fastcar.co.uk",7],["tapmaster.ca",7],["cmpv2.standard.co.uk",[9,10]],["cmpv2.independent.co.uk",[11,12,13,171]],["wetransfer.com",[14,15]],["spiegel.de",[16,17]],["nytimes.com",[18,167]],["consent.yahoo.com",19],["tumblr.com",20],["fplstatistics.co.uk",21],["fplstatistics.com",21],["e-shop.leonidas.com",22],["cdn.privacy-mgmt.com",[23,24,43,45,46,47,48,92,94,101,108,115,116,117,128,129,130,133,135,136,143,160,185,202,215,216,219,220,221,238,287,420,567,590,628,646]],["walmart.ca",25],["sams.com.mx",26],["my.tonies.com",27],["cambio-carsharing.de",27],["festool.*",27],["festoolcanada.com",27],["fuso-trucks.*",27],["tracker.fressnapf.de",27],["myfabrics.co.uk",27],["consent.ladbible.com",[28,29]],["consent.unilad.com",[28,29]],["consent.uniladtech.com",[28,29]],["consent.gamingbible.com",[28,29]],["consent.sportbible.com",[28,29]],["consent.tyla.com",[28,29]],["consent.ladbiblegroup.com",[28,29]],["m2o.it",30],["deejay.it",30],["capital.it",30],["ilmattino.it",[30,31]],["leggo.it",[30,31]],["libero.it",30],["tiscali.it",30],["consent-manager.ft.com",[32,33,34]],["hertz.*",35],["mediaworld.it",36],["mediamarkt.*",36],["mediamarktsaturn.com",37],["uber.com",[38,168]],["ubereats.com",[38,168]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["ilgiornale.it",44],["telekom.com",49],["telekom.net",49],["telekom.de",49],["abola.pt",50],["flytap.com",50],["ansons.de",50],["blick.ch",50],["buienradar.be",50],["crunchyroll.com",50],["digi24.ro",50],["digisport.ro",50],["digitalfoundry.net",50],["egx.net",50],["emirates.com",50],["eurogamer.it",50],["gmx.*",50],["kizi.com",50],["mail.com",50],["mcmcomiccon.com",50],["nachrichten.at",50],["nintendolife.com",50],["oe24.at",50],["paxsite.com",50],["peacocktv.com",50],["player.pl",50],["plus500.*",50],["pricerunner.com",50],["pricerunner.se",50],["pricerunner.dk",50],["proximus.be",[50,623]],["proximus.com",50],["purexbox.com",50],["pushsquare.com",50],["rugbypass.com",50],["southparkstudios.com",50],["southwest.com",50],["starwarscelebration.com",50],["sweatybetty.com",50],["theaa.ie",50],["thehaul.com",50],["timeextension.com",50],["travelandleisure.com",50],["tunein.com",50],["uefa.com",50],["videoland.com",50],["wizzair.com",50],["wetter.at",50],["dicebreaker.com",[51,52]],["eurogamer.cz",[51,52]],["eurogamer.es",[51,52]],["eurogamer.net",[51,52]],["eurogamer.nl",[51,52]],["eurogamer.pl",[51,52]],["eurogamer.pt",[51,52]],["gamesindustry.biz",[51,52]],["jelly.deals",[51,52]],["reedpop.com",[51,52]],["rockpapershotgun.com",[51,52]],["thepopverse.com",[51,52]],["vg247.com",[51,52]],["videogameschronicle.com",[51,52]],["eurogamer.de",53],["roadtovr.com",54],["jotex.*",54],["mundodeportivo.com",[55,123]],["m.youtube.com",56],["www.youtube.com",56],["ohra.nl",57],["corriere.it",58],["gazzetta.it",58],["oggi.it",58],["cmp.sky.it",59],["tennisassa.fi",60],["formula1.com",61],["f1racing.pl",62],["music.amazon.*",[63,64]],["consent-pref.trustarc.com",65],["highlights.legaseriea.it",66],["calciomercato.com",66],["sosfanta.com",67],["chrono24.*",[68,69]],["wetter.com",70],["youmath.it",71],["pip.gov.pl",72],["dailybuzz.nl",74],["bnn.de",74],["dosenbach.ch",74],["dw.com",74],["kinepolis.*",74],["mediaite.com",74],["winfuture.de",74],["lippu.fi",74],["racingnews365.com",74],["reifendirekt.ch",74],["vaillant.*",74],["bauhaus.no",75],["bauhaus.se",75],["beko-group.de",75],["billiger.de",75],["burda.com",75],["vanharen.nl",75],["deichmann.com",[75,97,448]],["meraluna.de",75],["slashdot.org",75],["hermann-saunierduval.it",75],["protherm.cz",75],["saunierduval.es",75],["protherm.sk",75],["protherm.ua",75],["saunierduval.hu",75],["saunierduval.ro",75],["saunierduval.at",75],["awb.nl",75],["spar.hu",76],["group.vattenfall.com",76],["mediaset.it",77],["fortune.com",78],["ilrestodelcarlino.it",79],["quotidiano.net",79],["lanazione.it",79],["ilgiorno.it",79],["iltelegrafolivorno.it",79],["auto.it",80],["beauxarts.com",80],["beinsports.com",80],["bfmtv.com",[80,124]],["boursobank.com",80],["boursorama.com",[80,124]],["boursier.com",[80,209]],["brut.media",80],["canalplus.com",80],["decathlon.fr",[80,206]],["diverto.tv",80],["eden-park.com",80],["foodvisor.io",80],["frandroid.com",80],["jobijoba.*",80],["hotelsbarriere.com",80],["intersport.*",[80,182]],["idealista.it",80],["o2.fr",80],["lejdd.fr",[80,123]],["lechorepublicain.fr",80],["la-croix.com",80],["linfo.re",80],["lamontagne.fr",80],["laredoute.fr",80],["largus.fr",80],["leprogres.fr",80],["lesnumeriques.com",80],["libramemoria.com",80],["lopinion.fr",80],["marieclaire.fr",80],["maville.com",80],["michelin.*",80],["midilibre.fr",[80,650]],["meteofrance.com",80],["mondialtissus.fr",80],["orange.fr",80],["orpi.com",80],["oscaro.com",80],["ouest-france.fr",[80,93,124,651]],["parismatch.com",80],["pagesjaunes.fr",80],["programme-television.org",[80,124]],["publicsenat.fr",[80,124]],["rmcbfmplay.com",[80,124]],["science-et-vie.com",[80,123]],["seloger.com",80],["societe.com",80],["suzuki.fr",80],["sudouest.fr",80],["web-agri.fr",80],["nutri-plus.de",81],["aa.com",82],["americanairlines.*",82],["consent.capital.fr",83],["consent.voici.fr",83],["programme-tv.net",83],["cmpv2.finn.no",84],["cmp.e24.no",[85,86]],["minmote.no",[85,86]],["cmp.vg.no",[85,86]],["huffingtonpost.fr",87],["rainews.it",88],["remarkable.com",89],["netzwelt.de",90],["money.it",91],["allocine.fr",93],["jeuxvideo.com",93],["ozap.com",93],["le10sport.com",93],["xataka.com",93],["cmp.fitbook.de",94],["cmp.autobild.de",94],["sourcepoint.sport.de",94],["cmp-sp.tagesspiegel.de",94],["cmp.bz-berlin.de",94],["cmp.cicero.de",94],["cmp.techbook.de",94],["cmp.stylebook.de",94],["cmp2.bild.de",94],["cmp2.freiepresse.de",94],["sourcepoint.wetter.de",94],["consent.finanzen.at",94],["consent.up.welt.de",94],["sourcepoint.n-tv.de",94],["sourcepoint.kochbar.de",94],["sourcepoint.rtl.de",94],["cmp.computerbild.de",94],["cmp.petbook.de",94],["cmp-sp.siegener-zeitung.de",94],["cmp-sp.sportbuzzer.de",94],["klarmobil.de",94],["technikum-wien.at",95],["eneco.nl",96],["blackpoolgazette.co.uk",98],["lep.co.uk",98],["northamptonchron.co.uk",98],["scotsman.com",98],["shieldsgazette.com",98],["thestar.co.uk",98],["portsmouth.co.uk",98],["sunderlandecho.com",98],["northernirelandworld.com",98],["3addedminutes.com",98],["anguscountyworld.co.uk",98],["banburyguardian.co.uk",98],["bedfordtoday.co.uk",98],["biggleswadetoday.co.uk",98],["bucksherald.co.uk",98],["burnleyexpress.net",98],["buxtonadvertiser.co.uk",98],["chad.co.uk",98],["daventryexpress.co.uk",98],["derbyshiretimes.co.uk",98],["derbyworld.co.uk",98],["derryjournal.com",98],["dewsburyreporter.co.uk",98],["doncasterfreepress.co.uk",98],["falkirkherald.co.uk",98],["fifetoday.co.uk",98],["glasgowworld.com",98],["halifaxcourier.co.uk",98],["harboroughmail.co.uk",98],["harrogateadvertiser.co.uk",98],["hartlepoolmail.co.uk",98],["hemeltoday.co.uk",98],["hucknalldispatch.co.uk",98],["lancasterguardian.co.uk",98],["leightonbuzzardonline.co.uk",98],["lincolnshireworld.com",98],["liverpoolworld.uk",98],["londonworld.com",98],["lutontoday.co.uk",98],["manchesterworld.uk",98],["meltontimes.co.uk",98],["miltonkeynes.co.uk",98],["newcastleworld.com",98],["newryreporter.com",98],["newsletter.co.uk",98],["northantstelegraph.co.uk",98],["northumberlandgazette.co.uk",98],["nottinghamworld.com",98],["peterboroughtoday.co.uk",98],["rotherhamadvertiser.co.uk",98],["stornowaygazette.co.uk",98],["surreyworld.co.uk",98],["thescarboroughnews.co.uk",98],["thesouthernreporter.co.uk",98],["totallysnookered.com",98],["wakefieldexpress.co.uk",98],["walesworld.com",98],["warwickshireworld.com",98],["wigantoday.net",98],["worksopguardian.co.uk",98],["yorkshireeveningpost.co.uk",98],["yorkshirepost.co.uk",98],["eurocard.com",99],["saseurobonusmastercard.se",100],["tver.jp",102],["linkedin.com",103],["elmundo.es",[104,124]],["expansion.com",104],["s-pankki.fi",105],["srf.ch",105],["alternate.de",105],["bayer04.de",105],["douglas.de",105],["dr-beckmann.com",105],["falke.com",105],["fitnessfirst.de",105],["flaschenpost.de",105],["gloeckle.de",105],["hornbach.nl",105],["hypofriend.de",105],["lactostop.de",105],["neumann.com",105],["postbank.de",105],["immowelt.de",106],["joyn.*",106],["morenutrition.de",106],["mapillary.com",107],["cmp.seznam.cz",109],["marca.com",110],["raiplay.it",111],["raiplaysound.it",111],["derstandard.at",112],["derstandard.de",112],["faz.net",112],["automoto.it",113],["ansa.it",113],["delladio.it",113],["huffingtonpost.it",113],["internazionale.it",113],["lastampa.it",113],["macitynet.it",113],["moto.it",113],["movieplayer.it",113],["multiplayer.it",113],["repubblica.it",113],["tomshw.it",113],["spaziogames.it",113],["tuttoandroid.net",113],["tuttotech.net",113],["ilgazzettino.it",114],["ilmessaggero.it",114],["ilsecoloxix.it",114],["privacy.motorradonline.de",117],["consent.watson.de",117],["consent.kino.de",117],["consent.desired.de",117],["spp.nextpit.de",117],["dailystar.co.uk",[118,119,120,121]],["mirror.co.uk",[118,119,120,121]],["idnes.cz",122],["20minutes.fr",123],["20minutos.es",123],["24sata.hr",123],["abc.es",123],["actu.fr",123],["antena3.com",123],["antena3internacional.com",123],["atresmedia.com",123],["atresmediapublicidad.com",123],["atresmediastudios.com",123],["atresplayer.com",123],["autopista.es",123],["belfasttelegraph.co.uk",123],["bemad.es",123],["bonduelle.it",123],["bonniernews.se",123],["bt.se",123],["cadenadial.com",123],["caracol.com.co",123],["cas.sk",123],["charentelibre.fr",123],["ciclismoafondo.es",123],["cnews.fr",123],["cope.es",123],["correryfitness.com",123],["courrier-picard.fr",123],["cuatro.com",123],["decathlon.nl",123],["decathlon.pl",123],["di.se",123],["diariocordoba.com",123],["diariodenavarra.es",123],["diariosur.es",123],["diariovasco.com",123],["diepresse.com",123],["divinity.es",123],["dn.se",123],["dnevnik.hr",123],["dumpert.nl",123],["ebuyclub.com",123],["edreams.de",123],["edreams.net",123],["elcomercio.es",123],["elconfidencial.com",123],["elcorreo.com",123],["eldesmarque.com",123],["eldiario.es",123],["eldiariomontanes.es",123],["elespanol.com",123],["elle.fr",123],["elpais.com",123],["elpais.es",123],["elperiodico.com",123],["elperiodicodearagon.com",123],["elplural.com",123],["energytv.es",123],["engadget.com",123],["es.ara.cat",123],["euronews.com",123],["europafm.com",123],["expressen.se",123],["factoriadeficcion.com",123],["filmstarts.de",123],["flooxernow.com",123],["folkbladet.nu",123],["footmercato.net",123],["france.tv",123],["france24.com",123],["francetvinfo.fr",123],["fussballtransfers.com",123],["fyndiq.se",123],["ghacks.net",123],["gva.be",123],["hbvl.be",123],["heraldo.es",123],["hoy.es",123],["ideal.es",123],["idealista.pt",123],["k.at",123],["krone.at",123],["kurier.at",123],["lacoste.com",123],["ladepeche.fr",123],["lalibre.be",123],["lanouvellerepublique.fr",123],["larazon.es",123],["lasexta.com",123],["lasprovincias.es",123],["latribune.fr",123],["lavanguardia.com",123],["laverdad.es",123],["lavozdegalicia.es",123],["leboncoin.fr",123],["lecturas.com",123],["ledauphine.com",123],["lejsl.com",123],["leparisien.fr",123],["lesoir.be",123],["letelegramme.fr",123],["levoixdunord.fr",123],["libremercado.com",123],["los40.com",123],["lotoquebec.com",123],["lunion.fr",123],["m6.fr",123],["marianne.cz",123],["marmiton.org",123],["mediaset.es",123],["melodia-fm.com",123],["metronieuws.nl",123],["moviepilot.de",123],["mtmad.es",123],["multilife.com.pl",123],["naszemiasto.pl",123],["nationalgeographic.com.es",123],["nicematin.com",123],["nieuwsblad.be",123],["notretemps.com",123],["numerama.com",123],["okdiario.com",123],["ondacero.es",123],["podiumpodcast.com",123],["portail.lotoquebec.com",123],["profil.at",123],["public.fr",123],["publico.es",123],["radiofrance.fr",123],["rankia.com",123],["rfi.fr",123],["rossmann.pl",123],["rtbf.be",[123,206]],["rtl.lu",123],["sensacine.com",123],["sfgame.net",123],["shure.com",123],["silicon.es",123],["sncf-connect.com",123],["sport.es",123],["sydsvenskan.se",123],["techcrunch.com",123],["telegraaf.nl",123],["telequebec.tv",123],["tf1.fr",123],["tradingsat.com",123],["trailrun.es",123],["video-streaming.orange.fr",123],["xpress.fr",123],["ivoox.com",124],["as.com",124],["slam.nl",124],["bienpublic.com",124],["funradio.fr",124],["gamepro.de",[124,179,180]],["lemon.fr",124],["lexpress.fr",124],["shadow.tech",124],["letemps.ch",124],["mein-mmo.de",124],["heureka.sk",124],["film.at",124],["dhnet.be",124],["lesechos.fr",[124,211]],["marianne.net",[124,206]],["jeanmarcmorandini.com",[124,207]],["dna.fr",124],["sudinfo.be",124],["europe1.fr",[124,207]],["rtl.be",[124,206]],["reviewingthebrew.com",124],["jaysjournal.com",124],["reignoftroy.com",124],["ryobitools.eu",[125,126]],["americanexpress.com",127],["consent.radiotimes.com",130],["sp-consent.szbz.de",131],["cmp.omni.se",132],["cmp.svd.se",132],["cmp.aftonbladet.se",132],["cmp.tv.nu",132],["consent.economist.com",134],["studentagency.cz",134],["cmpv2.foundryco.com",135],["cmpv2.infoworld.com",135],["cmpv2.arnnet.com.au",135],["sp-cdn.pcgames.de",136],["sp-cdn.pcgameshardware.de",136],["consentv2.sport1.de",136],["cmp.mz.de",136],["cmpv2.tori.fi",137],["cdn.privacy-mgmt.co",138],["consent.spielaffe.de",139],["bondekompaniet.no",140],["degiro.*",140],["epochtimes.de",140],["vikingline.com",140],["tfl.gov.uk",140],["drklein.de",140],["hildegardis-krankenhaus.de",140],["kleer.se",140],["lekiaviation.com",140],["lotto.pl",140],["mineralstech.com",140],["volunteer.digitalboost.org.uk",140],["starhotels.com",140],["tefl.com",140],["universumglobal.com",140],["1und1.de",141],["infranken.de",142],["cmp.bunte.de",143],["cmp.chip.de",143],["cmp.focus.de",[143,475]],["estadiodeportivo.com",144],["tameteo.*",144],["tempo.pt",144],["meteored.*",144],["pogoda.com",144],["yourweather.co.uk",144],["tempo.com",144],["theweather.net",144],["tiempo.com",144],["ilmeteo.net",144],["daswetter.com",144],["kicker.de",145],["formulatv.com",146],["web.de",147],["lefigaro.fr",148],["linternaute.com",149],["consent.caminteresse.fr",150],["volksfreund.de",151],["rp-online.de",151],["dailypost.co.uk",152],["the-express.com",152],["bluray-disc.de",153],["elio-systems.com",153],["stagatha-fachklinik.de",153],["tarife.mediamarkt.de",153],["lz.de",153],["gaggenau.com",153],["saturn.de",154],["eltiempo.es",[155,156]],["otempo.pt",157],["atlasformen.*",158],["cmp-sp.goettinger-tageblatt.de",159],["cmp-sp.saechsische.de",159],["cmp-sp.ln-online.de",159],["cz.de",159],["dewezet.de",159],["dnn.de",159],["haz.de",159],["gnz.de",159],["landeszeitung.de",159],["lvz.de",159],["maz-online.de",159],["ndz.de",159],["op-marburg.de",159],["ostsee-zeitung.de",159],["paz-online.de",159],["reisereporter.de",159],["rga.de",159],["rnd.de",159],["siegener-zeitung.de",159],["sn-online.de",159],["solinger-tageblatt.de",159],["sportbuzzer.de",159],["szlz.de",159],["tah.de",159],["torgauerzeitung.de",159],["waz-online.de",159],["privacy.maennersache.de",159],["sinergy.ch",161],["agglo-valais-central.ch",161],["biomedcentral.com",162],["hsbc.*",163],["hsbcnet.com",163],["hsbcinnovationbanking.com",163],["create.hsbc",163],["gbm.hsbc.com",163],["hsbc.co.uk",164],["internationalservices.hsbc.com",164],["history.hsbc.com",164],["about.hsbc.co.uk",165],["privatebanking.hsbc.com",166],["independent.co.uk",169],["privacy.crash.net",169],["the-independent.com",170],["argos.co.uk",172],["poco.de",[173,174]],["moebelix.*",173],["moemax.*",173],["xxxlutz.*",173],["xxxlesnina.*",173],["moebel24.ch",174],["meubles.fr",174],["meubelo.nl",174],["moebel.de",174],["lipo.ch",175],["schubiger.ch",176],["aedt.de",177],["berlin-live.de",177],["connect.de",177],["gutefrage.net",177],["insideparadeplatz.ch",177],["morgenpost.de",177],["play3.de",177],["thueringen24.de",177],["pdfupload.io",178],["gamestar.de",[179,180,215]],["verksamt.se",181],["acmemarkets.com",182],["amtrak.com",182],["beko.com",182],["bepanthen.com.au",182],["berocca.com.au",182],["booking.com",182],["carrefour.fr",182],["centrum.sk",182],["claratyne.com.au",182],["credit-suisse.com",182],["ceskatelevize.cz",182],["deporvillage.*",182],["de.vanguard",182],["dhl.de",182],["digikey.*",182],["drafthouse.com",182],["dunelm.com",182],["fello.se",182],["fielmann.*",182],["flashscore.fr",182],["flightradar24.com",182],["fnac.es",182],["foodandwine.com",182],["fourseasons.com",182],["khanacademy.org",182],["konami.com",182],["jll.*",182],["jobs.redbull.com",182],["hellenicbank.com",182],["gemini.pl",182],["groceries.asda.com",182],["lamborghini.com",182],["menshealth.com",182],["n26.com",182],["nintendo.com",182],["nokia.com",182],["oneweb.net",182],["omnipod.com",182],["oralb.*",182],["panasonic.com",182],["parkside-diy.com",182],["pluto.tv",182],["popularmechanics.com",182],["polskieradio.pl",182],["pringles.com",182],["radissonhotels.com",182],["ricardo.ch",182],["rockstargames.com",182],["rte.ie",182],["salesforce.com",182],["samsonite.*",182],["spiele.heise.de",182],["spirit.com",182],["stenaline.co.uk",182],["swisscom.ch",182],["swisspass.ch",182],["technologyfromsage.com",182],["telenet.be",182],["tntsports.co.uk",182],["theepochtimes.com",182],["toujeo.com",182],["uber-platz.de",182],["questdiagnostics.com",182],["wallapop.com",182],["wickes.co.uk",182],["workingtitlefilms.com",182],["vattenfall.de",182],["winparts.fr",182],["yoigo.com",182],["zoominfo.com",182],["allegiantair.com",183],["hallmarkchannel.com",183],["incorez.com",183],["noovle.com",183],["otter.ai",183],["plarium.com",183],["telsy.com",183],["timenterprise.it",183],["tim.it",183],["tradersunion.com",183],["fnac.*",183],["yeti.com",183],["here.com",[184,659]],["vodafone.com",184],["cmp.heise.de",186],["cmp.am-online.com",186],["cmp.motorcyclenews.com",186],["consent.newsnow.co.uk",186],["cmp.todays-golfer.com",186],["spp.nextpit.com",186],["koeser.com",187],["shop.schaette-pferd.de",187],["schaette.de",187],["ocre-project.eu",188],["central-bb.de",189],["brainmarket.pl",190],["getroots.app",191],["cart-in.re",[192,586]],["prestonpublishing.pl",193],["zara.com",194],["lepermislibre.fr",194],["negociardivida.spcbrasil.org.br",195],["adidas.*",196],["privacy.topreality.sk",197],["privacy.autobazar.eu",197],["vu.lt",198],["adnkronos.com",[199,200]],["cornwalllive.com",[199,200]],["cyprus-mail.com",[199,200]],["einthusan.tv",[199,200]],["informazione.it",[199,200]],["mymovies.it",[199,200]],["tuttoeuropei.com",[199,200]],["video.lacnews24.it",[199,200]],["protothema.gr",199],["flash.gr",199],["taxscouts.com",201],["online.no",203],["telenor.no",203],["austrian.com",204],["lufthansa.com",204],["kampfkunst-herz.de",205],["glow25.de",205],["hornetsecurity.com",205],["kayzen.io",205],["wasserkunst-hamburg.de",205],["zahnspange-oelde.de",205],["bnc.ca",206],["egora.fr",206],["engelvoelkers.com",206],["estrategiasdeinversion.com",206],["festo.com",206],["francebleu.fr",206],["francemediasmonde.com",206],["geny.com",206],["giphy.com",206],["idealista.com",206],["infolibre.es",206],["information.tv5monde.com",206],["ing.es",206],["knipex.de",206],["laprovence.com",206],["lemondeinformatique.fr",206],["libertaddigital.com",206],["mappy.com",206],["orf.at",206],["philibertnet.com",206],["researchgate.net",206],["standaard.be",206],["stroilioro.com",206],["taxfix.de",206],["telecinco.es",206],["vistaalegre.com",206],["zimbra.free.fr",206],["usinenouvelle.com",208],["reussir.fr",210],["bruendl.at",212],["latamairlines.com",213],["elisa.ee",214],["baseendpoint.brigitte.de",215],["baseendpoint.gala.de",215],["baseendpoint.haeuser.de",215],["baseendpoint.stern.de",215],["baseendpoint.urbia.de",215],["cmp.tag24.de",215],["cmp-sp.handelsblatt.com",215],["cmpv2.berliner-zeitung.de",215],["golem.de",215],["consent.t-online.de",215],["sp-consent.stuttgarter-nachrichten.de",216],["sp-consent.stuttgarter-zeitung.de",216],["regjeringen.no",217],["sp-manager-magazin-de.manager-magazin.de",218],["consent.11freunde.de",218],["centrum24.pl",222],["replay.lsm.lv",223],["ltv.lsm.lv",223],["bernistaba.lsm.lv",223],["stadt-wien.at",224],["verl.de",224],["cubo-sauna.de",224],["mbl.is",224],["auto-medienportal.net",224],["mobile.de",225],["cookist.it",226],["fanpage.it",226],["geopop.it",226],["lexplain.it",226],["royalmail.com",227],["gmx.net",228],["gmx.ch",229],["mojehobby.pl",230],["super-hobby.*",230],["sp.stylevamp.de",231],["cmp.wetteronline.de",231],["audi.*",232],["easyjet.com",232],["experian.co.uk",232],["postoffice.co.uk",232],["tescobank.com",232],["internetaptieka.lv",[233,234]],["wells.pt",235],["dskdirect.bg",236],["cmpv2.dba.dk",237],["spcmp.crosswordsolver.com",238],["ecco.com",239],["georgjensen.com",239],["thomann.*",240],["landkreis-kronach.de",241],["northcoast.com",242],["chaingpt.org",242],["bandenconcurrent.nl",243],["bandenexpert.be",243],["reserved.com",244],["metro.it",245],["makro.es",245],["metro.sk",245],["metro-cc.hr",245],["makro.nl",245],["metro.bg",245],["metro.at",245],["metro-tr.com",245],["metro.de",245],["metro.fr",245],["makro.cz",245],["metro.ro",245],["makro.pt",245],["makro.pl",245],["sklepy-odido.pl",245],["rastreator.com",245],["metro.ua",246],["metro.rs",246],["metro-kz.com",246],["metro.md",246],["metro.hu",246],["metro-cc.ru",246],["metro.pk",246],["balay.es",247],["constructa.com",247],["dafy-moto.com",248],["akku-shop.nl",249],["akkushop-austria.at",249],["akkushop-b2b.de",249],["akkushop.de",249],["akkushop.dk",249],["batterie-boutique.fr",249],["akkushop-schweiz.ch",250],["evzuttya.com.ua",251],["eobuv.cz",251],["eobuwie.com.pl",251],["ecipele.hr",251],["eavalyne.lt",251],["efootwear.eu",251],["eschuhe.ch",251],["eskor.se",251],["chaussures.fr",251],["ecipo.hu",251],["eobuv.com.ua",251],["eobuv.sk",251],["epantofi.ro",251],["epapoutsia.gr",251],["escarpe.it",251],["eschuhe.de",251],["obuvki.bg",251],["zapatos.es",251],["swedbank.ee",252],["mudanzavila.es",253],["bienmanger.com",254],["gesipa.*",255],["gesipausa.com",255],["beckhoff.com",255],["zitekick.dk",256],["eltechno.dk",256],["okazik.pl",256],["batteryempire.*",257],["maxi.rs",258],["garmin.com",259],["invisalign.*",259],["one4all.ie",259],["osprey.com",259],["wideroe.no",260],["bmw.*",261],["kijk.nl",262],["nordania.dk",263],["danskebank.*",263],["danskeci.com",263],["danicapension.dk",263],["dehn.*",264],["gewerbegebiete.de",265],["cordia.fr",266],["vola.fr",267],["lafi.fr",268],["skyscanner.*",269],["coolblue.*",270],["sanareva.*",271],["atida.fr",271],["bbva.*",272],["bbvauk.com",272],["expertise.unimi.it",273],["altenberg.de",274],["vestel.es",275],["tsb.co.uk",276],["buienradar.nl",[277,278]],["linsenplatz.de",279],["budni.de",280],["erstecardclub.hr",280],["teufel.de",[281,282]],["abp.nl",283],["simplea.sk",284],["flip.bg",285],["kiertokanki.com",286],["leirovins.be",288],["vias.be",289],["edf.fr",290],["virbac.com",290],["diners.hr",290],["squarehabitat.fr",290],["arbitrobancariofinanziario.it",291],["ivass.it",291],["economiapertutti.bancaditalia.it",291],["smit-sport.de",292],["gekko-computer.de",292],["jysk.al",293],["go-e.com",294],["malerblatt-medienservice.de",295],["architekturbuch.de",295],["medienservice-holz.de",295],["leuchtstark.de",295],["casius.nl",296],["coolinarika.com",297],["giga-hamburg.de",297],["vakgaragevannunen.nl",297],["fortuluz.es",297],["finna.fi",297],["eurogrow.es",297],["topnatur.cz",297],["topnatur.eu",297],["vakgaragevandertholen.nl",297],["whufc.com",297],["zomaplast.cz",297],["envafors.dk",298],["dabbolig.dk",[299,300]],["daruk-emelok.hu",301],["exakta.se",302],["larca.de",303],["roli.com",304],["okazii.ro",305],["lr-shop-direkt.de",305],["portalprzedszkolny.pl",305],["tgvinoui.sncf",306],["l-bank.de",307],["interhyp.de",308],["indigoneo.*",309],["transparency.meta.com",310],["dojusagro.lt",311],["eok.ee",311],["kripa.it",311],["nextdaycatering.co.uk",311],["safran-group.com",311],["sr-ramenendeuren.be",311],["ilovefreegle.org",311],["tribexr.com",311],["understandingsociety.ac.uk",311],["bestbuycyprus.com",312],["strato.*",313],["strato-hosting.co.uk",313],["auto.de",314],["contentkingapp.com",315],["comune.palermo.it",316],["get-in-engineering.de",317],["spp.nextpit.es",318],["spp.nextpit.it",319],["spp.nextpit.com.br",320],["spp.nextpit.fr",321],["otterbox.com",322],["stoertebeker-brauquartier.com",323],["stoertebeker.com",323],["stoertebeker-eph.com",323],["aparts.pl",324],["sinsay.com",[325,326]],["benu.cz",327],["stockholmresilience.org",328],["ludvika.se",328],["kammarkollegiet.se",328],["cazenovecapital.com",329],["statestreet.com",330],["beopen.lv",331],["cesukoncertzale.lv",332],["dodo.fr",333],["pepper.it",334],["pepper.pl",334],["preisjaeger.at",334],["mydealz.de",334],["dealabs.com",334],["hotukdeals.com",334],["chollometro.com",334],["makelaarsland.nl",335],["bricklink.com",336],["bestinver.es",337],["icvs2023.conf.tuwien.ac.at",338],["racshop.co.uk",[339,340]],["baabuk.com",341],["sapien.io",341],["app.lepermislibre.fr",342],["multioferta.es",343],["testwise.com",[344,345]],["tonyschocolonely.com",346],["fitplus.is",346],["fransdegrebber.nl",346],["lilliputpress.ie",346],["lexibo.com",346],["marin-milou.com",346],["dare2tri.com",346],["t3micro.*",346],["la-vie-naturelle.com",[347,348]],["inovelli.com",349],["uonetplus.vulcan.net.pl",[350,351]],["consent.helagotland.se",352],["oper.koeln",[353,354]],["deezer.com",355],["console.scaleway.com",356],["hoteldesartssaigon.com",357],["autoritedelaconcurrence.fr",358],["groupeonepoint.com",358],["geneanet.org",358],["carrieres.groupegalerieslafayette.com",358],["immo-banques.fr",358],["lingvanex.com",358],["turncamp.com",359],["ejobs.ro",[360,361]],["kupbilecik.*",[362,363]],["coolbe.com",364],["serienjunkies.de",365],["computerhoy.20minutos.es",366],["clickskeks.at",367],["clickskeks.de",367],["abt-sportsline.de",367],["exemplary.ai",368],["forbo.com",368],["stores.sk",368],["nerdstar.de",368],["prace.cz",368],["profesia.sk",368],["profesia.cz",368],["pracezarohem.cz",368],["atmoskop.cz",368],["seduo.sk",368],["seduo.cz",368],["teamio.com",368],["arnold-robot.com",368],["cvonline.lt",368],["cv.lv",368],["cv.ee",368],["dirbam.lt",368],["visidarbi.lv",368],["otsintood.ee",368],["webtic.it",368],["gerth.de",369],["pamiatki.pl",370],["initse.com",371],["salvagny.org",372],["augsburger-allgemeine.de",373],["stabila.com",374],["stwater.co.uk",375],["suncalc.org",[376,377]],["swisstph.ch",378],["taxinstitute.ie",379],["get-in-it.de",380],["tempcover.com",[381,382]],["guildford.gov.uk",383],["easyparts.*",[384,385]],["easyparts-recambios.es",[384,385]],["easyparts-rollerteile.de",[384,385]],["drimsim.com",386],["canyon.com",[387,388]],["vevovo.be",[389,390]],["vendezvotrevoiture.be",[389,390]],["wirkaufendeinauto.at",[389,390]],["vikoberallebiler.dk",[389,390]],["wijkopenautos.nl",[389,390]],["vikoperdinbil.se",[389,390]],["noicompriamoauto.it",[389,390]],["vendezvotrevoiture.fr",[389,390]],["compramostucoche.es",[389,390]],["wijkopenautos.be",[389,390]],["auto-doc.*",391],["autodoc.*",391],["autodoc24.*",391],["topautoosat.fi",391],["autoteiledirekt.de",391],["autoczescionline24.pl",391],["tuttoautoricambi.it",391],["onlinecarparts.co.uk",391],["autoalkatreszek24.hu",391],["autodielyonline24.sk",391],["reservdelar24.se",391],["pecasauto24.pt",391],["reservedeler24.co.no",391],["piecesauto24.lu",391],["rezervesdalas24.lv",391],["besteonderdelen.nl",391],["recambioscoche.es",391],["antallaktikaexartimata.gr",391],["piecesauto.fr",391],["teile-direkt.ch",391],["lpi.org",392],["divadelniflora.cz",393],["mahle-aftermarket.com",394],["refurbed.*",395],["flyingtiger.com",[396,534]],["borgomontecedrone.it",396],["recaro-shop.com",396],["gartenhotel-crystal.at",396],["fayn.com",397],["sklavenitis.gr",398],["eam-netz.de",399],["umicore.*",400],["veiligverkeer.be",400],["vsv.be",400],["dehogerielen.be",400],["gera.de",401],["mfr-chessy.fr",402],["mfr-lamure.fr",402],["mfr-saint-romain.fr",402],["mfr-lapalma.fr",402],["mfrvilliemorgon.asso.fr",402],["mfr-charentay.fr",402],["mfr.fr",402],["nationaltrust.org.uk",403],["hej-natural.*",404],["ib-hansmeier.de",405],["rsag.de",406],["esaa-eu.org",406],["aknw.de",406],["answear.*",407],["theprotocol.it",[408,409]],["lightandland.co.uk",410],["etransport.pl",411],["wohnen-im-alter.de",412],["johnmuirhealth.com",[413,414]],["markushaenni.com",415],["airbaltic.com",416],["gamersgate.com",416],["zorgzaam010.nl",417],["etos.nl",418],["paruvendu.fr",419],["cmpv2.bistro.sk",421],["privacy.bazar.sk",421],["hennamorena.com",422],["newsello.pl",423],["porp.pl",424],["golfbreaks.com",425],["lieferando.de",426],["just-eat.*",426],["justeat.*",426],["pyszne.pl",426],["lieferando.at",426],["takeaway.com",426],["thuisbezorgd.nl",426],["holidayhypermarket.co.uk",427],["atu.de",428],["atu-flottenloesungen.de",428],["but.fr",428],["edeka.de",428],["fortuneo.fr",428],["maif.fr",428],["particuliers.sg.fr",428],["sparkasse.at",428],["group.vig",428],["tf1info.fr",428],["dpdgroup.com",429],["dpd.fr",429],["dpd.com",429],["cosmosdirekt.de",429],["bstrongoutlet.pt",430],["nobbot.com",431],["isarradweg.de",[432,433]],["flaxmanestates.com",433],["inland-casas.com",433],["finlayson.fi",[434,435]],["cowaymega.ca",[434,435]],["arktis.de",436],["desktronic.de",436],["belleek.com",436],["brauzz.com",436],["cowaymega.com",436],["dockin.de",436],["dryrobe.com",[436,437]],["formswim.com",436],["hairtalk.se",436],["hallmark.co.uk",[436,437]],["loopearplugs.com",[436,437]],["oleus.com",436],["peopleofshibuya.com",436],["pullup-dip.com",436],["sanctum.shop",436],["tartanblanketco.com",436],["desktronic.*",437],["tepedirect.com",437],["maxi-pet.ro",437],["paper-republic.com",437],["pullup-dip.*",437],["vitabiotics.com",437],["smythstoys.com",438],["beam.co.uk",[439,440]],["autobahn.de",441],["consent-cdn.zeit.de",442],["coway-usa.com",443],["steiners.shop",444],["ecmrecords.com",445],["malaikaraiss.com",445],["koch-mit.de",445],["zeitreisen.zeit.de",445],["wefashion.com",446],["merkur.dk",447],["ionos.*",449],["omegawatches.com",450],["carefully.be",451],["aerotime.aero",451],["rocket-league.com",452],["dws.com",453],["bosch-homecomfort.com",454],["elmleblanc-optibox.fr",454],["monservicechauffage.fr",454],["boschrexroth.com",454],["home-connect.com",455],["lowrider.at",[456,457]],["mesto.de",458],["intersport.gr",459],["intersport.bg",459],["intersport.com.cy",459],["intersport.ro",459],["ticsante.com",460],["techopital.com",460],["millenniumprize.org",461],["hepster.com",462],["ellisphere.fr",463],["peterstaler.de",464],["blackforest-still.de",464],["tiendaplayaundi.com",465],["ajtix.co.uk",466],["raja.fr",467],["rajarani.de",467],["rajapack.*",[467,468]],["avery-zweckform.com",469],["1xinternet.de",469],["futterhaus.de",469],["dasfutterhaus.at",469],["frischeparadies.de",469],["fmk-steuer.de",469],["selgros.de",469],["transgourmet.de",469],["mediapart.fr",470],["athlon.com",471],["alumniportal-deutschland.org",472],["snoopmedia.com",472],["myguide.de",472],["study-in-germany.de",472],["daad.de",472],["cornelsen.de",[473,474]],["vinmonopolet.no",476],["tvp.info",477],["tvp.pl",477],["tvpworld.com",477],["brtvp.pl",477],["tvpparlament.pl",477],["belsat.eu",477],["warnung.bund.de",478],["mediathek.lfv-bayern.de",479],["allegro.*",480],["allegrolokalnie.pl",480],["ceneo.pl",480],["czc.cz",480],["eon.pl",[481,482]],["ylasatakunta.fi",[483,484]],["mega-image.ro",485],["louisvuitton.com",486],["bodensee-airport.eu",487],["department56.com",488],["allendesignsstudio.com",488],["designsbylolita.co",488],["shop.enesco.com",488],["savoriurbane.com",489],["miumiu.com",490],["church-footwear.com",490],["clickdoc.fr",491],["car-interface.com",492],["monolithdesign.it",492],["thematchahouse.com",492],["smileypack.de",[493,494]],["malijunaki.si",495],["finom.co",496],["orange.es",[497,498]],["fdm-travel.dk",499],["hummel.dk",499],["jysk.nl",499],["power.no",499],["skousen.dk",499],["velliv.dk",499],["whiteaway.com",499],["whiteaway.no",499],["whiteaway.se",499],["skousen.no",499],["energinet.dk",499],["elkjop.no",500],["medimax.de",501],["costautoricambi.com",502],["lotto.it",502],["readspeaker.com",502],["team.blue",502],["ibistallinncenter.ee",503],["aaron.ai",504],["futureverse.com",505],["tandem.co.uk",505],["insights.com",506],["thebathcollection.com",507],["coastfashion.com",[508,509]],["oasisfashion.com",[508,509]],["warehousefashion.com",[508,509]],["misspap.com",[508,509]],["karenmillen.com",[508,509]],["boohooman.com",[508,509]],["hdt.de",510],["wolt.com",511],["myprivacy.dpgmedia.nl",512],["myprivacy.dpgmedia.be",512],["www.dpgmediagroup.com",512],["xohotels.com",513],["sim24.de",514],["tnt.com",515],["uza.be",516],["uzafoundation.be",516],["uzajobs.be",516],["bergzeit.*",[517,518]],["cinemas-lumiere.com",519],["cdiscount.com",520],["brabus.com",521],["roborock.com",522],["strumentimusicali.net",523],["maisonmargiela.com",524],["webfleet.com",525],["dragonflyshipping.ca",526],["broekhuis.nl",527],["groningenairport.nl",527],["nemck.cz",528],["bokio.se",529],["sap-press.com",530],["roughguides.com",[531,532]],["korvonal.com",533],["rexbo.*",535],["itau.com.br",536],["bbg.gv.at",537],["portal.taxi.eu",538],["topannonces.fr",539],["homap.fr",540],["artifica.fr",541],["plan-interactif.com",541],["ville-cesson.fr",541],["moismoliere.com",542],["unihomes.co.uk",543],["bkk.hu",544],["coiffhair.com",545],["ptc.eu",546],["ziegert-group.com",[547,656]],["lassuranceretraite.fr",548],["interieur.gouv.fr",548],["toureiffel.paris",548],["economie.gouv.fr",548],["education.gouv.fr",548],["livoo.fr",548],["su.se",548],["zappo.fr",548],["smdv.de",549],["digitalo.de",549],["petiteamelie.*",550],["mojanorwegia.pl",551],["koempf24.ch",[552,553]],["teichitekten24.de",[552,553]],["koempf24.de",[552,553]],["wolff-finnhaus-shop.de",[552,553]],["asnbank.nl",554],["blgwonen.nl",554],["regiobank.nl",554],["snsbank.nl",554],["vulcan.net.pl",[555,556]],["ogresnovads.lv",557],["partenamut.be",558],["pirelli.com",559],["unicredit.it",560],["effector.pl",561],["zikodermo.pl",[562,563]],["wassererleben.ch",564],["devolksbank.nl",565],["caixabank.es",566],["cyberport.de",568],["cyberport.at",568],["slevomat.cz",569],["kfzparts24.de",570],["runnersneed.com",571],["aachener-zeitung.de",572],["sportpursuit.com",573],["druni.es",[574,587]],["druni.pt",[574,587]],["delta.com",575],["onliner.by",[576,577]],["vejdirektoratet.dk",578],["usaa.com",579],["consorsbank.de",580],["metroag.de",581],["kupbilecik.pl",582],["oxfordeconomics.com",583],["oxfordeconomics.com.au",[584,585]],["routershop.nl",586],["woo.pt",586],["e-jumbo.gr",588],["alza.*",589],["rmf.fm",591],["rmf24.pl",591],["tracfone.com",592],["lequipe.fr",593],["gala.fr",594],["purepeople.com",595],["3sat.de",596],["zdf.de",596],["filmfund.lu",597],["welcometothejungle.com",597],["triblive.com",598],["rai.it",599],["fbto.nl",600],["europa.eu",601],["caisse-epargne.fr",602],["banquepopulaire.fr",602],["bigmammagroup.com",603],["studentagency.sk",603],["studentagency.eu",603],["winparts.be",604],["winparts.nl",604],["winparts.eu",605],["winparts.ie",605],["winparts.se",605],["sportano.*",[606,607]],["crocs.*",608],["chronext.ch",609],["chronext.de",609],["chronext.at",609],["chronext.com",610],["chronext.co.uk",610],["chronext.fr",611],["chronext.nl",612],["chronext.it",613],["galerieslafayette.com",614],["bazarchic.com",615],["stilord.*",616],["tiko.pt",617],["nsinternational.com",618],["laposte.fr",619],["meinbildkalender.de",620],["gls-group.com",621],["gls-group.eu",621],["chilis.com",622],["account.bhvr.com",624],["everand.com",624],["lucidchart.com",624],["intercars.ro",[624,625]],["scribd.com",624],["guidepoint.com",624],["erlebnissennerei-zillertal.at",626],["hintertuxergletscher.at",626],["tiwag.at",626],["anwbvignetten.nl",627],["playseatstore.com",627],["swiss-sport.tv",629],["targobank-magazin.de",630],["zeit-verlagsgruppe.de",630],["online-physiotherapie.de",630],["kieferorthopaede-freisingsmile.de",631],["nltraining.nl",632],["kmudigital.at",633],["mintysquare.com",634],["consent.thetimes.com",635],["cadenaser.com",636],["berlinale.de",637],["lebonlogiciel.com",638],["pharmastar.it",639],["washingtonpost.com",640],["brillenplatz.de",641],["angelplatz.de",641],["dt.mef.gov.it",642],["raffeldeals.com",643],["stepstone.de",644],["kobo.com",645],["zoxs.de",647],["offistore.fi",648],["collinsaerospace.com",649],["radioapp.lv",652],["hagengrote.de",653],["hemden-meister.de",653],["vorteilshop.com",654],["capristores.gr",655],["getaround.com",657],["technomarket.bg",658],["epiphone.com",660],["gibson.com",660],["maestroelectronics.com",660],["cropp.com",[661,662]],["housebrand.com",[661,662]],["mohito.com",[661,662]],["autoczescizielonki.pl",663],["b-s.de",664],["earpros.com",665],["portalridice.cz",666],["kitsapcu.org",667],["nutsinbulk.*",668],["berlin-buehnen.de",669],["metropoliten.rs",670],["educa2.madrid.org",671],["immohal.de",672],["sourcepoint.theguardian.com",673],["rtlplay.be",674],["natgeotv.com",674],["llama.com",675],["meta.com",675],["setasdesevilla.com",676],["cruyff-foundation.org",677],["allianz.*",678],["energiedirect-bayern.de",679],["postnl.be",680],["postnl.nl",680],["sacyr.com",681],["volkswagen-newsroom.com",682],["openbank.*",683],["tagus-eoficina.grupogimeno.com",684],["knax.de",685],["ordblindenetvaerket.dk",686],["boligbeton.dk",686],["dukh.dk",686],["pevgrow.com",687],["ya.ru",688],["ipolska24.pl",689],["17bankow.com",689],["5mindlazdrowia.pl",689],["kazimierzdolny.pl",689],["vpolshchi.pl",689],["dobreprogramy.pl",689],["essanews.com",689],["dailywrap.ca",689],["dailywrap.uk",689],["money.pl",689],["autokult.pl",689],["komorkomania.pl",689],["polygamia.pl",689],["autocentrum.pl",689],["allani.pl",689],["homebook.pl",689],["domodi.pl",689],["jastrzabpost.pl",689],["open.fm",689],["gadzetomania.pl",689],["fotoblogia.pl",689],["abczdrowie.pl",689],["parenting.pl",689],["kafeteria.pl",689],["vibez.pl",689],["wakacje.pl",689],["extradom.pl",689],["totalmoney.pl",689],["superauto.pl",689],["nerwica.com",689],["forum.echirurgia.pl",689],["dailywrap.net",689],["pysznosci.pl",689],["genialne.pl",689],["finansowysupermarket.pl",689],["deliciousmagazine.pl",689],["audioteka.com",689],["easygo.pl",689],["so-magazyn.pl",689],["o2.pl",689],["pudelek.pl",689],["benchmark.pl",689],["wp.pl",689],["altibox.dk",690],["altibox.no",690],["talksport.com",691],["zuiderzeemuseum.nl",692],["gota.io",693]]);
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
