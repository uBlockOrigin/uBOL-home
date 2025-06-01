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
const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","500"],["button[title=\"REJECT ALL\"]","","1000"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","1000"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[action-name=\"agreeAll\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Aceitar todos\"]","","1000"],["button.cta-button[title=\"Tümünü reddet\"]"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","1500"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1500"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[onclick=\"cookiesAlert.rejectAll()\"]","","1000"],["button[title=\"Alle ablehnen\"]","","1800"],["button.pixelmate-general-deny","","1000"],["a.mmcm-btn-decline","","1000"],["button.hi-cookie-btn-accept-necessary","","1000"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1500"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["button.cmplz-deny","","1000"],["button[aria-label=\"Reject all\"]","","1000"],["button[title=\"Aceptar y continuar\"]","","1000"],["button[title=\"Accettare e continuare\"]","","1000"],["button[title=\"Concordar\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.cookieselection-confirm-necessary","","2500"],["button[value=\"essential\"]","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["button.css-15p2x3e.e112qvla0","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1600"],["button[data-testing=\"cookie-bar-deny-all\"]","","1000"],["button.shared-elements-cookies-popup__modify-button","","1100"],["button.shared-cookies-modal__current-button","","1300"],["button#cookie-custom","","1200"],["button#cookie-save","","1800"],["div.rejectLink___zHIdj","","1000"],[".cmp-root-container >>> .cmp-button-accept-all","","1000"],["a[data-mrf-role=\"userPayToReject\"]","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button.primary","","1000"],["a[onclick=\"denyCookiePolicyAndSetHash();\"]","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#btn-accept-required-banner","","1000"],["button.js-cookies-panel-reject-all","","1000"],["button.acbut.continue","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button.swal2-cancel","","1000"],["button[data-component-name=\"reject\"]","","1000"],["button.fides-reject-all-button","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["div[aria-label=\"Only allow essential cookies\"]","","1000"],["button[title=\"Agree & Continue\"]","","1800"],["button[title=\"Reject All\"]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","2800"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button#wp-declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["button[data-test-id=\"decline-button\"]","","2400"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","2500"],["button[onclick*=\"(()=>{ CassieWidgetLoader.Widget.rejectAll\"]","","1000"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],["a.ea_ignore","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.gdpr-accept-all-btn","","1000"],["span[data-ga-action=\"disallow_all_cookies\"]","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button.btn-secondary","","1800"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["input#popup_ok","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"],["#cmpwrapper >>> a.cust-btn[onclick*=\"__cmp('setConsent'","1)\"]","","1500"]];
const hostnamesMap = new Map([["consent.google.*",0],["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["theguardian.com",6],["bloomberg.com",[7,8]],["forbes.com",[7,73]],["nike.com",7],["consent.fastcar.co.uk",7],["tapmaster.ca",7],["cmpv2.standard.co.uk",[9,10]],["cmpv2.independent.co.uk",[11,12,13,171]],["wetransfer.com",[14,15]],["spiegel.de",[16,17]],["nytimes.com",[18,167]],["consent.yahoo.com",19],["tumblr.com",20],["fplstatistics.co.uk",21],["fplstatistics.com",21],["e-shop.leonidas.com",22],["cdn.privacy-mgmt.com",[23,24,43,45,46,47,48,92,94,101,108,115,116,117,128,129,130,133,135,136,143,160,185,205,218,219,222,223,224,241,290,425,455,581,604,642,660]],["walmart.ca",25],["sams.com.mx",26],["my.tonies.com",27],["cambio-carsharing.de",27],["festool.*",27],["festoolcanada.com",27],["fuso-trucks.*",27],["tracker.fressnapf.de",27],["myfabrics.co.uk",27],["zinus.*",27],["consent.ladbible.com",[28,29]],["consent.unilad.com",[28,29]],["consent.uniladtech.com",[28,29]],["consent.gamingbible.com",[28,29]],["consent.sportbible.com",[28,29]],["consent.tyla.com",[28,29]],["consent.ladbiblegroup.com",[28,29]],["m2o.it",30],["deejay.it",30],["capital.it",30],["ilmattino.it",[30,31]],["leggo.it",[30,31]],["libero.it",30],["tiscali.it",30],["consent-manager.ft.com",[32,33,34]],["hertz.*",35],["mediaworld.it",36],["mediamarkt.*",36],["mediamarktsaturn.com",37],["uber.com",[38,168]],["ubereats.com",[38,168]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["ilgiornale.it",44],["telekom.com",49],["telekom.net",49],["telekom.de",49],["abola.pt",50],["flytap.com",50],["ansons.de",50],["blick.ch",50],["buienradar.be",50],["crunchyroll.com",50],["digi24.ro",50],["digisport.ro",50],["digitalfoundry.net",50],["egx.net",50],["emirates.com",50],["eurogamer.it",50],["foto-erhardt.de",50],["gmx.*",50],["kizi.com",50],["mail.com",50],["mcmcomiccon.com",50],["nachrichten.at",50],["nintendolife.com",50],["oe24.at",50],["paxsite.com",50],["peacocktv.com",50],["player.pl",50],["plus500.*",50],["pricerunner.com",50],["pricerunner.se",50],["pricerunner.dk",50],["proximus.be",[50,637]],["proximus.com",50],["purexbox.com",50],["pushsquare.com",50],["rugbypass.com",50],["southparkstudios.com",50],["southwest.com",50],["starwarscelebration.com",50],["sweatybetty.com",50],["theaa.ie",50],["thehaul.com",50],["timeextension.com",50],["travelandleisure.com",50],["tunein.com",50],["uefa.com",50],["videoland.com",50],["wizzair.com",50],["wetter.at",50],["dicebreaker.com",[51,52]],["eurogamer.cz",[51,52]],["eurogamer.es",[51,52]],["eurogamer.net",[51,52]],["eurogamer.nl",[51,52]],["eurogamer.pl",[51,52]],["eurogamer.pt",[51,52]],["gamesindustry.biz",[51,52]],["jelly.deals",[51,52]],["reedpop.com",[51,52]],["rockpapershotgun.com",[51,52]],["thepopverse.com",[51,52]],["vg247.com",[51,52]],["videogameschronicle.com",[51,52]],["eurogamer.de",53],["roadtovr.com",54],["jotex.*",54],["mundodeportivo.com",[55,123]],["m.youtube.com",56],["www.youtube.com",56],["ohra.nl",57],["corriere.it",58],["gazzetta.it",58],["oggi.it",58],["cmp.sky.it",59],["tennisassa.fi",60],["formula1.com",61],["f1racing.pl",62],["music.amazon.*",[63,64]],["consent-pref.trustarc.com",65],["highlights.legaseriea.it",66],["calciomercato.com",66],["sosfanta.com",67],["chrono24.*",[68,69]],["wetter.com",70],["youmath.it",71],["pip.gov.pl",72],["dailybuzz.nl",74],["bnn.de",74],["dosenbach.ch",74],["dw.com",74],["kinepolis.*",74],["mediaite.com",74],["nzz.ch",74],["winfuture.de",74],["lippu.fi",74],["racingnews365.com",74],["reifendirekt.ch",74],["vaillant.*",74],["bauhaus.no",75],["bauhaus.se",75],["beko-group.de",75],["billiger.de",75],["burda.com",75],["vanharen.nl",75],["deichmann.com",[75,97,463]],["meraluna.de",75],["slashdot.org",75],["hermann-saunierduval.it",75],["protherm.cz",75],["saunierduval.es",75],["protherm.sk",75],["protherm.ua",75],["saunierduval.hu",75],["saunierduval.ro",75],["saunierduval.at",75],["awb.nl",75],["spar.hu",76],["group.vattenfall.com",76],["mediaset.it",77],["fortune.com",78],["ilrestodelcarlino.it",79],["quotidiano.net",79],["lanazione.it",79],["ilgiorno.it",79],["iltelegrafolivorno.it",79],["auto.it",80],["beauxarts.com",80],["beinsports.com",80],["bfmtv.com",[80,124]],["boursobank.com",80],["boursorama.com",[80,124]],["boursier.com",[80,212]],["brut.media",80],["canalplus.com",80],["decathlon.fr",[80,209]],["diverto.tv",80],["eden-park.com",80],["foodvisor.io",80],["frandroid.com",80],["jobijoba.*",80],["hotelsbarriere.com",80],["intersport.*",[80,182]],["idealista.it",80],["o2.fr",80],["lejdd.fr",[80,123]],["lechorepublicain.fr",80],["la-croix.com",80],["linfo.re",80],["lamontagne.fr",80],["laredoute.fr",80],["largus.fr",80],["leprogres.fr",80],["lesnumeriques.com",80],["libramemoria.com",80],["lopinion.fr",80],["marieclaire.fr",80],["maville.com",80],["michelin.*",80],["midilibre.fr",[80,664]],["meteofrance.com",80],["mondialtissus.fr",80],["orange.fr",80],["orpi.com",80],["oscaro.com",80],["ouest-france.fr",[80,93,124,665]],["parismatch.com",80],["pagesjaunes.fr",80],["programme-television.org",[80,124]],["publicsenat.fr",[80,124]],["rmcbfmplay.com",[80,124]],["science-et-vie.com",[80,123]],["seloger.com",80],["societe.com",80],["suzuki.fr",80],["sudouest.fr",80],["web-agri.fr",80],["nutri-plus.de",81],["aa.com",82],["americanairlines.*",82],["consent.capital.fr",83],["consent.voici.fr",83],["programme-tv.net",83],["cmpv2.finn.no",84],["cmp.e24.no",[85,86]],["minmote.no",[85,86]],["cmp.vg.no",[85,86]],["huffingtonpost.fr",87],["rainews.it",88],["remarkable.com",89],["netzwelt.de",90],["money.it",91],["allocine.fr",93],["jeuxvideo.com",93],["ozap.com",93],["le10sport.com",93],["xataka.com",93],["cmp.fitbook.de",94],["cmp.autobild.de",94],["sourcepoint.sport.de",94],["cmp-sp.tagesspiegel.de",94],["cmp.bz-berlin.de",94],["cmp.cicero.de",94],["cmp.techbook.de",94],["cmp.stylebook.de",94],["cmp2.bild.de",94],["cmp2.freiepresse.de",94],["sourcepoint.wetter.de",94],["consent.finanzen.at",94],["consent.finanzen.net",94],["consent.up.welt.de",94],["sourcepoint.n-tv.de",94],["sourcepoint.kochbar.de",94],["sourcepoint.rtl.de",94],["cmp.computerbild.de",94],["cmp.petbook.de",94],["cmp-sp.siegener-zeitung.de",94],["cmp-sp.sportbuzzer.de",94],["klarmobil.de",94],["technikum-wien.at",95],["eneco.nl",96],["blackpoolgazette.co.uk",98],["lep.co.uk",98],["northamptonchron.co.uk",98],["scotsman.com",98],["shieldsgazette.com",98],["thestar.co.uk",98],["portsmouth.co.uk",98],["sunderlandecho.com",98],["northernirelandworld.com",98],["3addedminutes.com",98],["anguscountyworld.co.uk",98],["banburyguardian.co.uk",98],["bedfordtoday.co.uk",98],["biggleswadetoday.co.uk",98],["bucksherald.co.uk",98],["burnleyexpress.net",98],["buxtonadvertiser.co.uk",98],["chad.co.uk",98],["daventryexpress.co.uk",98],["derbyshiretimes.co.uk",98],["derbyworld.co.uk",98],["derryjournal.com",98],["dewsburyreporter.co.uk",98],["doncasterfreepress.co.uk",98],["falkirkherald.co.uk",98],["fifetoday.co.uk",98],["glasgowworld.com",98],["halifaxcourier.co.uk",98],["harboroughmail.co.uk",98],["harrogateadvertiser.co.uk",98],["hartlepoolmail.co.uk",98],["hemeltoday.co.uk",98],["hucknalldispatch.co.uk",98],["lancasterguardian.co.uk",98],["leightonbuzzardonline.co.uk",98],["lincolnshireworld.com",98],["liverpoolworld.uk",98],["londonworld.com",98],["lutontoday.co.uk",98],["manchesterworld.uk",98],["meltontimes.co.uk",98],["miltonkeynes.co.uk",98],["newcastleworld.com",98],["newryreporter.com",98],["newsletter.co.uk",98],["northantstelegraph.co.uk",98],["northumberlandgazette.co.uk",98],["nottinghamworld.com",98],["peterboroughtoday.co.uk",98],["rotherhamadvertiser.co.uk",98],["stornowaygazette.co.uk",98],["surreyworld.co.uk",98],["thescarboroughnews.co.uk",98],["thesouthernreporter.co.uk",98],["totallysnookered.com",98],["wakefieldexpress.co.uk",98],["walesworld.com",98],["warwickshireworld.com",98],["wigantoday.net",98],["worksopguardian.co.uk",98],["yorkshireeveningpost.co.uk",98],["yorkshirepost.co.uk",98],["eurocard.com",99],["saseurobonusmastercard.se",100],["tver.jp",102],["linkedin.com",103],["elmundo.es",[104,124]],["expansion.com",104],["s-pankki.fi",105],["srf.ch",105],["alternate.de",105],["bayer04.de",105],["douglas.de",105],["dr-beckmann.com",105],["falke.com",105],["fitnessfirst.de",105],["flaschenpost.de",105],["gloeckle.de",105],["hornbach.nl",105],["hypofriend.de",105],["lactostop.de",105],["neumann.com",105],["postbank.de",105],["immowelt.de",106],["joyn.*",106],["morenutrition.de",106],["mapillary.com",107],["cmp.seznam.cz",109],["marca.com",110],["raiplay.it",111],["raiplaysound.it",111],["derstandard.at",112],["derstandard.de",112],["faz.net",112],["automoto.it",113],["ansa.it",113],["delladio.it",113],["huffingtonpost.it",113],["internazionale.it",113],["lastampa.it",113],["macitynet.it",113],["moto.it",113],["movieplayer.it",113],["multiplayer.it",113],["repubblica.it",113],["tomshw.it",113],["skuola.net",113],["spaziogames.it",113],["tuttoandroid.net",113],["tuttotech.net",113],["ilgazzettino.it",114],["ilmessaggero.it",114],["ilsecoloxix.it",114],["privacy.motorradonline.de",117],["consent.watson.de",117],["consent.kino.de",117],["consent.desired.de",117],["cmpv2.fn.de",117],["spp.nextpit.de",117],["dailystar.co.uk",[118,119,120,121]],["mirror.co.uk",[118,119,120,121]],["idnes.cz",122],["20minutes.fr",123],["20minutos.es",123],["24sata.hr",123],["abc.es",123],["actu.fr",123],["antena3.com",123],["antena3internacional.com",123],["atresmedia.com",123],["atresmediapublicidad.com",123],["atresmediastudios.com",123],["atresplayer.com",123],["autopista.es",123],["belfasttelegraph.co.uk",123],["bemad.es",123],["bonduelle.it",123],["bonniernews.se",123],["bt.se",123],["cadenadial.com",123],["caracol.com.co",123],["cas.sk",123],["charentelibre.fr",123],["ciclismoafondo.es",123],["cnews.fr",123],["cope.es",123],["correryfitness.com",123],["courrier-picard.fr",123],["cuatro.com",123],["decathlon.nl",123],["decathlon.pl",123],["di.se",123],["diariocordoba.com",123],["diariodenavarra.es",123],["diariosur.es",123],["diariovasco.com",123],["diepresse.com",123],["divinity.es",123],["dn.se",123],["dnevnik.hr",123],["dumpert.nl",123],["ebuyclub.com",123],["edreams.de",123],["edreams.net",123],["elcomercio.es",123],["elconfidencial.com",123],["elcorreo.com",123],["eldesmarque.com",123],["eldiario.es",123],["eldiariomontanes.es",123],["elespanol.com",123],["elle.fr",123],["elpais.com",123],["elpais.es",123],["elperiodico.com",123],["elperiodicodearagon.com",123],["elplural.com",123],["energytv.es",123],["engadget.com",123],["es.ara.cat",123],["euronews.com",123],["europafm.com",123],["expressen.se",123],["factoriadeficcion.com",123],["filmstarts.de",123],["flooxernow.com",123],["folkbladet.nu",123],["footmercato.net",123],["france.tv",123],["france24.com",123],["francetvinfo.fr",123],["fussballtransfers.com",123],["fyndiq.se",123],["ghacks.net",123],["gva.be",123],["hbvl.be",123],["heraldo.es",123],["hoy.es",123],["ideal.es",123],["idealista.pt",123],["k.at",123],["krone.at",123],["kurier.at",123],["lacoste.com",123],["ladepeche.fr",123],["lalibre.be",123],["lanouvellerepublique.fr",123],["larazon.es",123],["lasexta.com",123],["lasprovincias.es",123],["latribune.fr",123],["lavanguardia.com",123],["laverdad.es",123],["lavozdegalicia.es",123],["leboncoin.fr",123],["lecturas.com",123],["ledauphine.com",123],["lejsl.com",123],["leparisien.fr",123],["lesoir.be",123],["letelegramme.fr",123],["levoixdunord.fr",123],["libremercado.com",123],["los40.com",123],["lotoquebec.com",123],["lunion.fr",123],["m6.fr",123],["marianne.cz",123],["marmiton.org",123],["mediaset.es",123],["melodia-fm.com",123],["metronieuws.nl",123],["moviepilot.de",123],["mtmad.es",123],["multilife.com.pl",123],["naszemiasto.pl",123],["nationalgeographic.com.es",123],["nicematin.com",123],["nieuwsblad.be",123],["notretemps.com",123],["numerama.com",123],["okdiario.com",123],["ondacero.es",123],["podiumpodcast.com",123],["portail.lotoquebec.com",123],["profil.at",123],["public.fr",123],["publico.es",123],["radiofrance.fr",123],["rankia.com",123],["rfi.fr",123],["rossmann.pl",123],["rtbf.be",[123,209]],["rtl.lu",123],["sensacine.com",123],["sfgame.net",123],["shure.com",123],["silicon.es",123],["sncf-connect.com",123],["sport.es",123],["sydsvenskan.se",123],["techcrunch.com",123],["telegraaf.nl",123],["telequebec.tv",123],["tf1.fr",123],["tradingsat.com",123],["trailrun.es",123],["video-streaming.orange.fr",123],["xpress.fr",123],["ivoox.com",124],["as.com",124],["slam.nl",124],["bienpublic.com",124],["funradio.fr",124],["gamepro.de",[124,179,180]],["lemon.fr",124],["lexpress.fr",124],["shadow.tech",124],["letemps.ch",124],["mein-mmo.de",124],["heureka.sk",124],["film.at",124],["dhnet.be",124],["lesechos.fr",[124,214]],["marianne.net",[124,209]],["jeanmarcmorandini.com",[124,210]],["dna.fr",124],["sudinfo.be",124],["europe1.fr",[124,210]],["rtl.be",[124,209]],["reviewingthebrew.com",124],["jaysjournal.com",124],["reignoftroy.com",124],["ryobitools.eu",[125,126]],["americanexpress.com",127],["consent.radiotimes.com",130],["sp-consent.szbz.de",131],["cmp.omni.se",132],["cmp.svd.se",132],["cmp.aftonbladet.se",132],["cmp.tv.nu",132],["consent.economist.com",134],["studentagency.cz",134],["cmpv2.foundryco.com",135],["cmpv2.infoworld.com",135],["cmpv2.arnnet.com.au",135],["sp-cdn.pcgames.de",136],["sp-cdn.pcgameshardware.de",136],["consentv2.sport1.de",136],["cmp.mz.de",136],["cmpv2.tori.fi",137],["cdn.privacy-mgmt.co",138],["consent.spielaffe.de",139],["bondekompaniet.no",140],["degiro.*",140],["epochtimes.de",140],["vikingline.com",140],["tfl.gov.uk",140],["drklein.de",140],["hildegardis-krankenhaus.de",140],["kleer.se",140],["lekiaviation.com",140],["lotto.pl",140],["mineralstech.com",140],["volunteer.digitalboost.org.uk",140],["starhotels.com",140],["tefl.com",140],["universumglobal.com",140],["1und1.de",141],["infranken.de",142],["cmp.bunte.de",143],["cmp.chip.de",143],["cmp.focus.de",[143,490]],["estadiodeportivo.com",144],["tameteo.*",144],["tempo.pt",144],["meteored.*",144],["pogoda.com",144],["yourweather.co.uk",144],["tempo.com",144],["theweather.net",144],["tiempo.com",144],["ilmeteo.net",144],["daswetter.com",144],["kicker.de",145],["formulatv.com",146],["web.de",147],["lefigaro.fr",148],["linternaute.com",149],["consent.caminteresse.fr",150],["volksfreund.de",151],["rp-online.de",151],["dailypost.co.uk",152],["the-express.com",152],["bluray-disc.de",153],["elio-systems.com",153],["stagatha-fachklinik.de",153],["tarife.mediamarkt.de",153],["lz.de",153],["gaggenau.com",153],["saturn.de",154],["eltiempo.es",[155,156]],["otempo.pt",157],["atlasformen.*",158],["cmp-sp.goettinger-tageblatt.de",159],["cmp-sp.saechsische.de",159],["cmp-sp.ln-online.de",159],["cz.de",159],["dewezet.de",159],["dnn.de",159],["haz.de",159],["gnz.de",159],["landeszeitung.de",159],["lvz.de",159],["maz-online.de",159],["ndz.de",159],["op-marburg.de",159],["ostsee-zeitung.de",159],["paz-online.de",159],["reisereporter.de",159],["rga.de",159],["rnd.de",159],["siegener-zeitung.de",159],["sn-online.de",159],["solinger-tageblatt.de",159],["sportbuzzer.de",159],["szlz.de",159],["tah.de",159],["torgauerzeitung.de",159],["waz-online.de",159],["privacy.maennersache.de",159],["sinergy.ch",161],["agglo-valais-central.ch",161],["biomedcentral.com",162],["hsbc.*",163],["hsbcnet.com",163],["hsbcinnovationbanking.com",163],["create.hsbc",163],["gbm.hsbc.com",163],["hsbc.co.uk",164],["internationalservices.hsbc.com",164],["history.hsbc.com",164],["about.hsbc.co.uk",165],["privatebanking.hsbc.com",166],["independent.co.uk",169],["privacy.crash.net",169],["the-independent.com",170],["argos.co.uk",172],["poco.de",[173,174]],["moebelix.*",173],["moemax.*",173],["xxxlutz.*",173],["xxxlesnina.*",173],["moebel24.ch",174],["meubles.fr",174],["meubelo.nl",174],["moebel.de",174],["lipo.ch",175],["schubiger.ch",176],["aedt.de",177],["berlin-live.de",177],["connect.de",177],["gutefrage.net",177],["insideparadeplatz.ch",177],["morgenpost.de",177],["play3.de",177],["thueringen24.de",177],["pdfupload.io",178],["gamestar.de",[179,180,218]],["verksamt.se",181],["acmemarkets.com",182],["amtrak.com",182],["beko.com",182],["bepanthen.com.au",182],["berocca.com.au",182],["booking.com",182],["carrefour.fr",182],["centrum.sk",182],["claratyne.com.au",182],["credit-suisse.com",182],["ceskatelevize.cz",182],["deporvillage.*",182],["de.vanguard",182],["dhl.de",182],["digikey.*",182],["drafthouse.com",182],["dunelm.com",182],["fello.se",182],["fielmann.*",182],["flashscore.fr",182],["flightradar24.com",182],["fnac.es",182],["foodandwine.com",182],["fourseasons.com",182],["khanacademy.org",182],["konami.com",182],["jll.*",182],["jobs.redbull.com",182],["hellenicbank.com",182],["gemini.pl",182],["groceries.asda.com",182],["lamborghini.com",182],["menshealth.com",182],["n26.com",182],["nintendo.com",182],["nokia.com",182],["oneweb.net",182],["omnipod.com",182],["oralb.*",182],["panasonic.com",182],["parkside-diy.com",182],["pluto.tv",182],["popularmechanics.com",182],["polskieradio.pl",182],["pringles.com",182],["radissonhotels.com",182],["ricardo.ch",182],["rockstargames.com",182],["rte.ie",182],["salesforce.com",182],["samsonite.*",182],["spiele.heise.de",182],["spirit.com",182],["stenaline.co.uk",182],["swisscom.ch",182],["swisspass.ch",182],["technologyfromsage.com",182],["telenet.be",182],["tntsports.co.uk",182],["theepochtimes.com",182],["toujeo.com",182],["uber-platz.de",182],["questdiagnostics.com",182],["wallapop.com",182],["wickes.co.uk",182],["workingtitlefilms.com",182],["vattenfall.de",182],["winparts.fr",182],["yoigo.com",182],["zoominfo.com",182],["allegiantair.com",183],["hallmarkchannel.com",183],["incorez.com",183],["noovle.com",183],["otter.ai",183],["plarium.com",183],["telsy.com",183],["timenterprise.it",183],["tim.it",183],["tradersunion.com",183],["fnac.*",183],["yeti.com",183],["here.com",[184,673]],["vodafone.com",184],["cmp.heise.de",186],["cmp.am-online.com",186],["cmp.motorcyclenews.com",186],["consent.newsnow.co.uk",186],["cmp.todays-golfer.com",186],["spp.nextpit.com",186],["koeser.com",187],["shop.schaette-pferd.de",187],["schaette.de",187],["ocre-project.eu",188],["central-bb.de",189],["fitnessfoodcorner.de",190],["kuehlungsborn.de",191],["espressocoffeeshop.com",192],["brainmarket.pl",193],["getroots.app",194],["cart-in.re",[195,600]],["prestonpublishing.pl",196],["zara.com",197],["lepermislibre.fr",197],["negociardivida.spcbrasil.org.br",198],["adidas.*",199],["privacy.topreality.sk",200],["privacy.autobazar.eu",200],["vu.lt",201],["adnkronos.com",[202,203]],["cornwalllive.com",[202,203]],["cyprus-mail.com",[202,203]],["einthusan.tv",[202,203]],["informazione.it",[202,203]],["mymovies.it",[202,203]],["tuttoeuropei.com",[202,203]],["video.lacnews24.it",[202,203]],["protothema.gr",202],["flash.gr",202],["taxscouts.com",204],["online.no",206],["telenor.no",206],["austrian.com",207],["lufthansa.com",207],["kampfkunst-herz.de",208],["glow25.de",208],["hornetsecurity.com",208],["kayzen.io",208],["wasserkunst-hamburg.de",208],["zahnspange-oelde.de",208],["bnc.ca",209],["egora.fr",209],["engelvoelkers.com",209],["estrategiasdeinversion.com",209],["festo.com",209],["franceinfo.fr",209],["francebleu.fr",209],["francemediasmonde.com",209],["geny.com",209],["giphy.com",209],["idealista.com",209],["infolibre.es",209],["information.tv5monde.com",209],["ing.es",209],["knipex.de",209],["laprovence.com",209],["lemondeinformatique.fr",209],["libertaddigital.com",209],["mappy.com",209],["orf.at",209],["philibertnet.com",209],["researchgate.net",209],["standaard.be",209],["stroilioro.com",209],["taxfix.de",209],["telecinco.es",209],["vistaalegre.com",209],["zimbra.free.fr",209],["usinenouvelle.com",211],["reussir.fr",213],["bruendl.at",215],["latamairlines.com",216],["elisa.ee",217],["baseendpoint.brigitte.de",218],["baseendpoint.gala.de",218],["baseendpoint.haeuser.de",218],["baseendpoint.stern.de",218],["baseendpoint.urbia.de",218],["cmp.tag24.de",218],["cmp-sp.handelsblatt.com",218],["cmpv2.berliner-zeitung.de",218],["golem.de",218],["consent.t-online.de",218],["sp-consent.stuttgarter-nachrichten.de",219],["sp-consent.stuttgarter-zeitung.de",219],["regjeringen.no",220],["sp-manager-magazin-de.manager-magazin.de",221],["consent.11freunde.de",221],["centrum24.pl",225],["replay.lsm.lv",226],["ltv.lsm.lv",226],["bernistaba.lsm.lv",226],["stadt-wien.at",227],["verl.de",227],["cubo-sauna.de",227],["mbl.is",227],["auto-medienportal.net",227],["mobile.de",228],["cookist.it",229],["fanpage.it",229],["geopop.it",229],["lexplain.it",229],["royalmail.com",230],["gmx.net",231],["gmx.ch",232],["mojehobby.pl",233],["super-hobby.*",233],["sp.stylevamp.de",234],["cmp.wetteronline.de",234],["audi.*",235],["easyjet.com",235],["experian.co.uk",235],["postoffice.co.uk",235],["tescobank.com",235],["internetaptieka.lv",[236,237]],["wells.pt",238],["dskdirect.bg",239],["cmpv2.dba.dk",240],["spcmp.crosswordsolver.com",241],["ecco.com",242],["georgjensen.com",242],["thomann.*",243],["landkreis-kronach.de",244],["northcoast.com",245],["chaingpt.org",245],["bandenconcurrent.nl",246],["bandenexpert.be",246],["reserved.com",247],["metro.it",248],["makro.es",248],["metro.sk",248],["metro-cc.hr",248],["makro.nl",248],["metro.bg",248],["metro.at",248],["metro-tr.com",248],["metro.de",248],["metro.fr",248],["makro.cz",248],["metro.ro",248],["makro.pt",248],["makro.pl",248],["sklepy-odido.pl",248],["rastreator.com",248],["metro.ua",249],["metro.rs",249],["metro-kz.com",249],["metro.md",249],["metro.hu",249],["metro-cc.ru",249],["metro.pk",249],["balay.es",250],["constructa.com",250],["dafy-moto.com",251],["akku-shop.nl",252],["akkushop-austria.at",252],["akkushop-b2b.de",252],["akkushop.de",252],["akkushop.dk",252],["batterie-boutique.fr",252],["akkushop-schweiz.ch",253],["evzuttya.com.ua",254],["eobuv.cz",254],["eobuwie.com.pl",254],["ecipele.hr",254],["eavalyne.lt",254],["efootwear.eu",254],["eschuhe.ch",254],["eskor.se",254],["chaussures.fr",254],["ecipo.hu",254],["eobuv.com.ua",254],["eobuv.sk",254],["epantofi.ro",254],["epapoutsia.gr",254],["escarpe.it",254],["eschuhe.de",254],["obuvki.bg",254],["zapatos.es",254],["swedbank.ee",255],["mudanzavila.es",256],["bienmanger.com",257],["gesipa.*",258],["gesipausa.com",258],["beckhoff.com",258],["zitekick.dk",259],["eltechno.dk",259],["okazik.pl",259],["batteryempire.*",260],["maxi.rs",261],["garmin.com",262],["invisalign.*",262],["one4all.ie",262],["osprey.com",262],["wideroe.no",263],["bmw.*",264],["kijk.nl",265],["nordania.dk",266],["danskebank.*",266],["danskeci.com",266],["danicapension.dk",266],["dehn.*",267],["gewerbegebiete.de",268],["cordia.fr",269],["vola.fr",270],["lafi.fr",271],["skyscanner.*",272],["coolblue.*",273],["sanareva.*",274],["atida.fr",274],["bbva.*",275],["bbvauk.com",275],["expertise.unimi.it",276],["altenberg.de",277],["vestel.es",278],["tsb.co.uk",279],["buienradar.nl",[280,281]],["linsenplatz.de",282],["budni.de",283],["erstecardclub.hr",283],["teufel.de",[284,285]],["abp.nl",286],["simplea.sk",287],["flip.bg",288],["kiertokanki.com",289],["leirovins.be",291],["vias.be",292],["edf.fr",293],["virbac.com",293],["diners.hr",293],["squarehabitat.fr",293],["arbitrobancariofinanziario.it",294],["ivass.it",294],["economiapertutti.bancaditalia.it",294],["smit-sport.de",295],["gekko-computer.de",295],["jysk.al",296],["go-e.com",297],["malerblatt-medienservice.de",298],["architekturbuch.de",298],["medienservice-holz.de",298],["leuchtstark.de",298],["casius.nl",299],["coolinarika.com",300],["giga-hamburg.de",300],["vakgaragevannunen.nl",300],["fortuluz.es",300],["finna.fi",300],["eurogrow.es",300],["topnatur.cz",300],["topnatur.eu",300],["vakgaragevandertholen.nl",300],["whufc.com",300],["zomaplast.cz",300],["envafors.dk",301],["dabbolig.dk",[302,303]],["daruk-emelok.hu",304],["exakta.se",305],["larca.de",306],["roli.com",307],["okazii.ro",308],["lr-shop-direkt.de",308],["portalprzedszkolny.pl",308],["tgvinoui.sncf",309],["l-bank.de",310],["interhyp.de",311],["indigoneo.*",312],["transparency.meta.com",313],["dojusagro.lt",314],["eok.ee",314],["kripa.it",314],["nextdaycatering.co.uk",314],["safran-group.com",314],["sr-ramenendeuren.be",314],["ilovefreegle.org",314],["tribexr.com",314],["understandingsociety.ac.uk",314],["bestbuycyprus.com",315],["strato.*",316],["strato-hosting.co.uk",316],["auto.de",317],["contentkingapp.com",318],["comune.palermo.it",319],["get-in-engineering.de",320],["spp.nextpit.es",321],["spp.nextpit.it",322],["spp.nextpit.com.br",323],["spp.nextpit.fr",324],["otterbox.com",325],["stoertebeker-brauquartier.com",326],["stoertebeker.com",326],["stoertebeker-eph.com",326],["aparts.pl",327],["sinsay.com",[328,329]],["benu.cz",330],["stockholmresilience.org",331],["ludvika.se",331],["kammarkollegiet.se",331],["cazenovecapital.com",332],["statestreet.com",333],["beopen.lv",334],["cesukoncertzale.lv",335],["dodo.fr",336],["pepper.it",337],["pepper.pl",337],["preisjaeger.at",337],["mydealz.de",337],["dealabs.com",337],["hotukdeals.com",337],["chollometro.com",337],["makelaarsland.nl",338],["bezirk-schwaben.de",339],["nutsinbulk.co.uk",340],["bricklink.com",341],["bestinver.es",342],["icvs2023.conf.tuwien.ac.at",343],["racshop.co.uk",[344,345]],["baabuk.com",346],["sapien.io",346],["tradedoubler.com",346],["app.lepermislibre.fr",347],["multioferta.es",348],["testwise.com",[349,350]],["tonyschocolonely.com",351],["fitplus.is",351],["fransdegrebber.nl",351],["lilliputpress.ie",351],["lexibo.com",351],["marin-milou.com",351],["dare2tri.com",351],["t3micro.*",351],["la-vie-naturelle.com",[352,353]],["inovelli.com",354],["uonetplus.vulcan.net.pl",[355,356]],["consent.helagotland.se",357],["oper.koeln",[358,359]],["deezer.com",360],["console.scaleway.com",361],["hoteldesartssaigon.com",362],["autoritedelaconcurrence.fr",363],["groupeonepoint.com",363],["geneanet.org",363],["carrieres.groupegalerieslafayette.com",363],["immo-banques.fr",363],["lingvanex.com",363],["turncamp.com",364],["ejobs.ro",[365,366]],["kupbilecik.*",[367,368]],["coolbe.com",369],["serienjunkies.de",370],["computerhoy.20minutos.es",371],["clickskeks.at",372],["clickskeks.de",372],["abt-sportsline.de",372],["exemplary.ai",373],["forbo.com",373],["stores.sk",373],["nerdstar.de",373],["prace.cz",373],["profesia.sk",373],["profesia.cz",373],["pracezarohem.cz",373],["atmoskop.cz",373],["seduo.sk",373],["seduo.cz",373],["teamio.com",373],["arnold-robot.com",373],["cvonline.lt",373],["cv.lv",373],["cv.ee",373],["dirbam.lt",373],["visidarbi.lv",373],["otsintood.ee",373],["webtic.it",373],["gerth.de",374],["pamiatki.pl",375],["initse.com",376],["salvagny.org",377],["augsburger-allgemeine.de",378],["stabila.com",379],["stwater.co.uk",380],["suncalc.org",[381,382]],["swisstph.ch",383],["taxinstitute.ie",384],["get-in-it.de",385],["tempcover.com",[386,387]],["guildford.gov.uk",388],["easyparts.*",[389,390]],["easyparts-recambios.es",[389,390]],["easyparts-rollerteile.de",[389,390]],["drimsim.com",391],["canyon.com",[392,393]],["vevovo.be",[394,395]],["vendezvotrevoiture.be",[394,395]],["wirkaufendeinauto.at",[394,395]],["vikoberallebiler.dk",[394,395]],["wijkopenautos.nl",[394,395]],["vikoperdinbil.se",[394,395]],["noicompriamoauto.it",[394,395]],["vendezvotrevoiture.fr",[394,395]],["compramostucoche.es",[394,395]],["wijkopenautos.be",[394,395]],["auto-doc.*",396],["autodoc.*",396],["autodoc24.*",396],["topautoosat.fi",396],["autoteiledirekt.de",396],["autoczescionline24.pl",396],["tuttoautoricambi.it",396],["onlinecarparts.co.uk",396],["autoalkatreszek24.hu",396],["autodielyonline24.sk",396],["reservdelar24.se",396],["pecasauto24.pt",396],["reservedeler24.co.no",396],["piecesauto24.lu",396],["rezervesdalas24.lv",396],["besteonderdelen.nl",396],["recambioscoche.es",396],["antallaktikaexartimata.gr",396],["piecesauto.fr",396],["teile-direkt.ch",396],["lpi.org",397],["divadelniflora.cz",398],["mahle-aftermarket.com",399],["refurbed.*",400],["eingutertag.org",401],["flyingtiger.com",[401,549]],["borgomontecedrone.it",401],["maharishistore.com",401],["recaro-shop.com",401],["gartenhotel-crystal.at",401],["fayn.com",402],["serica-watches.com",402],["sklavenitis.gr",403],["eam-netz.de",404],["umicore.*",405],["veiligverkeer.be",405],["vsv.be",405],["dehogerielen.be",405],["gera.de",406],["mfr-chessy.fr",407],["mfr-lamure.fr",407],["mfr-saint-romain.fr",407],["mfr-lapalma.fr",407],["mfrvilliemorgon.asso.fr",407],["mfr-charentay.fr",407],["mfr.fr",407],["nationaltrust.org.uk",408],["hej-natural.*",409],["ib-hansmeier.de",410],["rsag.de",411],["esaa-eu.org",411],["aknw.de",411],["answear.*",412],["theprotocol.it",[413,414]],["lightandland.co.uk",415],["etransport.pl",416],["wohnen-im-alter.de",417],["johnmuirhealth.com",[418,419]],["markushaenni.com",420],["airbaltic.com",421],["gamersgate.com",421],["zorgzaam010.nl",422],["etos.nl",423],["paruvendu.fr",424],["cmpv2.bistro.sk",426],["privacy.bazar.sk",426],["hennamorena.com",427],["newsello.pl",428],["porp.pl",429],["golfbreaks.com",430],["lieferando.de",431],["just-eat.*",431],["justeat.*",431],["pyszne.pl",431],["lieferando.at",431],["takeaway.com",431],["thuisbezorgd.nl",431],["holidayhypermarket.co.uk",432],["unisg.ch",433],["wassererleben.ch",433],["psgaz.pl",434],["play-asia.com",435],["atu.de",436],["atu-flottenloesungen.de",436],["but.fr",436],["edeka.de",436],["fortuneo.fr",436],["maif.fr",436],["particuliers.sg.fr",436],["sparkasse.at",436],["group.vig",436],["tf1info.fr",436],["dpdgroup.com",437],["dpd.fr",437],["dpd.com",437],["cosmosdirekt.de",437],["bstrongoutlet.pt",438],["nobbot.com",439],["isarradweg.de",[440,441]],["flaxmanestates.com",441],["inland-casas.com",441],["finlayson.fi",[442,443]],["cowaymega.ca",[442,443]],["arktis.de",444],["desktronic.de",444],["belleek.com",444],["brauzz.com",444],["cowaymega.com",444],["dockin.de",444],["dryrobe.com",[444,445]],["formswim.com",444],["hairtalk.se",444],["hallmark.co.uk",[444,445]],["loopearplugs.com",[444,445]],["oleus.com",444],["peopleofshibuya.com",444],["pullup-dip.com",444],["sanctum.shop",444],["tartanblanketco.com",444],["desktronic.*",445],["hq-germany.com",445],["tepedirect.com",445],["maxi-pet.ro",445],["paper-republic.com",445],["pullup-dip.*",445],["vitabiotics.com",445],["smythstoys.com",446],["beam.co.uk",[447,448]],["autobahn.de",449],["krakow.pl",450],["shop.app",451],["shopify.com",451],["wufoo.com",452],["consent.dailymotion.com",453],["laposte.fr",453],["help.instagram.com",454],["consent-manager.thenextweb.com",456],["consent-cdn.zeit.de",457],["coway-usa.com",458],["steiners.shop",459],["ecmrecords.com",460],["malaikaraiss.com",460],["koch-mit.de",460],["zeitreisen.zeit.de",460],["wefashion.com",461],["merkur.dk",462],["ionos.*",464],["omegawatches.com",465],["carefully.be",466],["aerotime.aero",466],["rocket-league.com",467],["dws.com",468],["bosch-homecomfort.com",469],["elmleblanc-optibox.fr",469],["monservicechauffage.fr",469],["boschrexroth.com",469],["home-connect.com",470],["lowrider.at",[471,472]],["mesto.de",473],["intersport.gr",474],["intersport.bg",474],["intersport.com.cy",474],["intersport.ro",474],["ticsante.com",475],["techopital.com",475],["millenniumprize.org",476],["hepster.com",477],["ellisphere.fr",478],["peterstaler.de",479],["blackforest-still.de",479],["tiendaplayaundi.com",480],["ajtix.co.uk",481],["raja.fr",482],["rajarani.de",482],["rajapack.*",[482,483]],["avery-zweckform.com",484],["1xinternet.de",484],["futterhaus.de",484],["dasfutterhaus.at",484],["frischeparadies.de",484],["fmk-steuer.de",484],["selgros.de",484],["transgourmet.de",484],["mediapart.fr",485],["athlon.com",486],["alumniportal-deutschland.org",487],["snoopmedia.com",487],["myguide.de",487],["study-in-germany.de",487],["daad.de",487],["cornelsen.de",[488,489]],["vinmonopolet.no",491],["tvp.info",492],["tvp.pl",492],["tvpworld.com",492],["brtvp.pl",492],["tvpparlament.pl",492],["belsat.eu",492],["warnung.bund.de",493],["mediathek.lfv-bayern.de",494],["allegro.*",495],["allegrolokalnie.pl",495],["ceneo.pl",495],["czc.cz",495],["eon.pl",[496,497]],["ylasatakunta.fi",[498,499]],["mega-image.ro",500],["louisvuitton.com",501],["bodensee-airport.eu",502],["department56.com",503],["allendesignsstudio.com",503],["designsbylolita.co",503],["shop.enesco.com",503],["savoriurbane.com",504],["miumiu.com",505],["church-footwear.com",505],["clickdoc.fr",506],["car-interface.com",507],["monolithdesign.it",507],["thematchahouse.com",507],["smileypack.de",[508,509]],["malijunaki.si",510],["finom.co",511],["orange.es",[512,513]],["fdm-travel.dk",514],["hummel.dk",514],["jysk.nl",514],["power.no",514],["skousen.dk",514],["velliv.dk",514],["whiteaway.com",514],["whiteaway.no",514],["whiteaway.se",514],["skousen.no",514],["energinet.dk",514],["elkjop.no",515],["medimax.de",516],["costautoricambi.com",517],["lotto.it",517],["readspeaker.com",517],["team.blue",517],["ibistallinncenter.ee",518],["aaron.ai",519],["futureverse.com",520],["tandem.co.uk",520],["insights.com",521],["thebathcollection.com",522],["coastfashion.com",[523,524]],["oasisfashion.com",[523,524]],["warehousefashion.com",[523,524]],["misspap.com",[523,524]],["karenmillen.com",[523,524]],["boohooman.com",[523,524]],["hdt.de",525],["wolt.com",526],["myprivacy.dpgmedia.nl",527],["myprivacy.dpgmedia.be",527],["www.dpgmediagroup.com",527],["xohotels.com",528],["sim24.de",529],["tnt.com",530],["uza.be",531],["uzafoundation.be",531],["uzajobs.be",531],["bergzeit.*",[532,533]],["cinemas-lumiere.com",534],["cdiscount.com",535],["brabus.com",536],["roborock.com",537],["strumentimusicali.net",538],["maisonmargiela.com",539],["webfleet.com",540],["dragonflyshipping.ca",541],["broekhuis.nl",542],["groningenairport.nl",542],["nemck.cz",543],["bokio.se",544],["sap-press.com",545],["roughguides.com",[546,547]],["korvonal.com",548],["rexbo.*",550],["itau.com.br",551],["bbg.gv.at",552],["portal.taxi.eu",553],["topannonces.fr",554],["homap.fr",555],["artifica.fr",556],["plan-interactif.com",556],["ville-cesson.fr",556],["moismoliere.com",557],["unihomes.co.uk",558],["bkk.hu",559],["coiffhair.com",560],["ptc.eu",561],["ziegert-group.com",[562,670]],["lassuranceretraite.fr",563],["interieur.gouv.fr",563],["toureiffel.paris",563],["economie.gouv.fr",563],["education.gouv.fr",563],["livoo.fr",563],["su.se",563],["zappo.fr",563],["smdv.de",564],["digitalo.de",564],["petiteamelie.*",565],["mojanorwegia.pl",566],["koempf24.ch",[567,568]],["teichitekten24.de",[567,568]],["koempf24.de",[567,568]],["wolff-finnhaus-shop.de",[567,568]],["asnbank.nl",569],["blgwonen.nl",569],["regiobank.nl",569],["snsbank.nl",569],["vulcan.net.pl",[570,571]],["ogresnovads.lv",572],["partenamut.be",573],["pirelli.com",574],["unicredit.it",575],["effector.pl",576],["zikodermo.pl",[577,578]],["devolksbank.nl",579],["caixabank.es",580],["cyberport.de",582],["cyberport.at",582],["slevomat.cz",583],["kfzparts24.de",584],["runnersneed.com",585],["aachener-zeitung.de",586],["sportpursuit.com",587],["druni.es",[588,601]],["druni.pt",[588,601]],["delta.com",589],["onliner.by",[590,591]],["vejdirektoratet.dk",592],["usaa.com",593],["consorsbank.de",594],["metroag.de",595],["kupbilecik.pl",596],["oxfordeconomics.com",597],["oxfordeconomics.com.au",[598,599]],["routershop.nl",600],["woo.pt",600],["e-jumbo.gr",602],["alza.*",603],["rmf.fm",605],["rmf24.pl",605],["tracfone.com",606],["lequipe.fr",607],["global.abb",608],["gala.fr",609],["purepeople.com",610],["3sat.de",611],["zdf.de",611],["filmfund.lu",612],["welcometothejungle.com",612],["triblive.com",613],["rai.it",614],["fbto.nl",615],["europa.eu",616],["caisse-epargne.fr",617],["banquepopulaire.fr",617],["bigmammagroup.com",618],["studentagency.sk",618],["studentagency.eu",618],["winparts.be",619],["winparts.nl",619],["winparts.eu",620],["winparts.ie",620],["winparts.se",620],["sportano.*",[621,622]],["crocs.*",623],["chronext.ch",624],["chronext.de",624],["chronext.at",624],["chronext.com",625],["chronext.co.uk",625],["chronext.fr",626],["chronext.nl",627],["chronext.it",628],["galerieslafayette.com",629],["bazarchic.com",630],["stilord.*",631],["tiko.pt",632],["nsinternational.com",633],["meinbildkalender.de",634],["gls-group.com",635],["gls-group.eu",635],["chilis.com",636],["account.bhvr.com",638],["everand.com",638],["lucidchart.com",638],["intercars.ro",[638,639]],["scribd.com",638],["guidepoint.com",638],["erlebnissennerei-zillertal.at",640],["hintertuxergletscher.at",640],["tiwag.at",640],["anwbvignetten.nl",641],["playseatstore.com",641],["swiss-sport.tv",643],["targobank-magazin.de",644],["zeit-verlagsgruppe.de",644],["online-physiotherapie.de",644],["kieferorthopaede-freisingsmile.de",645],["nltraining.nl",646],["kmudigital.at",647],["mintysquare.com",648],["consent.thetimes.com",649],["cadenaser.com",650],["berlinale.de",651],["lebonlogiciel.com",652],["pharmastar.it",653],["washingtonpost.com",654],["brillenplatz.de",655],["angelplatz.de",655],["dt.mef.gov.it",656],["raffeldeals.com",657],["stepstone.de",658],["kobo.com",659],["zoxs.de",661],["offistore.fi",662],["collinsaerospace.com",663],["radioapp.lv",666],["hagengrote.de",667],["hemden-meister.de",667],["vorteilshop.com",668],["capristores.gr",669],["getaround.com",671],["technomarket.bg",672],["epiphone.com",674],["gibson.com",674],["maestroelectronics.com",674],["cropp.com",[675,676]],["housebrand.com",[675,676]],["mohito.com",[675,676]],["autoczescizielonki.pl",677],["b-s.de",678],["novakid.pl",679],["piecesauto24.com",680],["earpros.com",681],["portalridice.cz",682],["kitsapcu.org",683],["nutsinbulk.*",684],["berlin-buehnen.de",685],["metropoliten.rs",686],["educa2.madrid.org",687],["immohal.de",688],["sourcepoint.theguardian.com",689],["rtlplay.be",690],["natgeotv.com",690],["llama.com",691],["meta.com",691],["setasdesevilla.com",692],["cruyff-foundation.org",693],["allianz.*",694],["energiedirect-bayern.de",695],["postnl.be",696],["postnl.nl",696],["sacyr.com",697],["volkswagen-newsroom.com",698],["openbank.*",699],["tagus-eoficina.grupogimeno.com",700],["knax.de",701],["ordblindenetvaerket.dk",702],["boligbeton.dk",702],["dukh.dk",702],["pevgrow.com",703],["ya.ru",704],["ipolska24.pl",705],["17bankow.com",705],["5mindlazdrowia.pl",705],["kazimierzdolny.pl",705],["vpolshchi.pl",705],["dobreprogramy.pl",705],["essanews.com",705],["dailywrap.ca",705],["dailywrap.uk",705],["money.pl",705],["autokult.pl",705],["komorkomania.pl",705],["polygamia.pl",705],["autocentrum.pl",705],["allani.pl",705],["homebook.pl",705],["domodi.pl",705],["jastrzabpost.pl",705],["open.fm",705],["gadzetomania.pl",705],["fotoblogia.pl",705],["abczdrowie.pl",705],["parenting.pl",705],["kafeteria.pl",705],["vibez.pl",705],["wakacje.pl",705],["extradom.pl",705],["totalmoney.pl",705],["superauto.pl",705],["nerwica.com",705],["forum.echirurgia.pl",705],["dailywrap.net",705],["pysznosci.pl",705],["genialne.pl",705],["finansowysupermarket.pl",705],["deliciousmagazine.pl",705],["audioteka.com",705],["easygo.pl",705],["so-magazyn.pl",705],["o2.pl",705],["pudelek.pl",705],["benchmark.pl",705],["wp.pl",705],["altibox.dk",706],["altibox.no",706],["talksport.com",707],["zuiderzeemuseum.nl",708],["gota.io",709],["nwzonline.de",710]]);
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
