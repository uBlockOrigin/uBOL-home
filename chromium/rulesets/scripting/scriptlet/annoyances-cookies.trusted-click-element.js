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
const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","800"],["button[title=\"REJECT ALL\"]","","1200"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","1000"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[action-name=\"agreeAll\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Aceitar todos\"]","","1000"],["button.cta-button[title=\"Tümünü reddet\"]"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["div.decline","","1000"],["button#declineAllConsentSummary","","1500"],["button.deny-btn","","1000"],["span#idxrcookiesKO","","1000"],["button[data-action=\"cookie-consent#onToggleShowManager\"]","","900"],["button[data-action=\"cookie-consent#onSaveSetting\"]","","1200"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","1500"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1500"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[onclick=\"cookiesAlert.rejectAll()\"]","","1000"],["button[title=\"Alle ablehnen\"]","","1800"],["button.pixelmate-general-deny","","1000"],["a.mmcm-btn-decline","","1000"],["button.hi-cookie-btn-accept-necessary","","1000"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1500"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["button.cmplz-deny","","1000"],["button[aria-label=\"Reject all\"]","","1000"],["button[title=\"Aceptar y continuar\"]","","1000"],["button[title=\"Accettare e continuare\"]","","1000"],["button[title=\"Concordar\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.cookieselection-confirm-necessary","","2500"],["button[value=\"essential\"]","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1600"],["button[data-testing=\"cookie-bar-deny-all\"]","","1000"],["button.shared-elements-cookies-popup__modify-button","","1100"],["button.shared-cookies-modal__current-button","","1300"],["button#cookie-custom","","1200"],["button#cookie-save","","1800"],["div.rejectLink___zHIdj","","1000"],[".cmp-root-container >>> .cmp-button-accept-all","","1000"],["a[data-mrf-role=\"userPayToReject\"]","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button.primary","","1000"],["a[onclick=\"denyCookiePolicyAndSetHash();\"]","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#btn-accept-required-banner","","1000"],["button.js-cookies-panel-reject-all","","1000"],["button.acbut.continue","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button.swal2-cancel","","1000"],["button[data-component-name=\"reject\"]","","1000"],["button.fides-reject-all-button","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["div[aria-label=\"Only allow essential cookies\"]","","1000"],["button[title=\"Agree & Continue\"]","","1800"],["button[title=\"Reject All\"]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","2800"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button#wp-declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["button[data-test-id=\"decline-button\"]","","2400"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","2500"],["button[onclick*=\"(()=>{ CassieWidgetLoader.Widget.rejectAll\"]","","1000"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],["a.ea_ignore","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.gdpr-accept-all-btn","","1000"],["span[data-ga-action=\"disallow_all_cookies\"]","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button.btn-secondary","","1800"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["input#popup_ok","","1000"],["button[data-test=\"terms-accept-button\"]","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"],["#cmpwrapper >>> a.cust-btn[onclick*=\"__cmp('setConsent'","1)\"]","","1500"],["button#CybotCookiebotDialogBodyButtonDecline"],["button.cta-size-big.cta-outline"]];
const hostnamesMap = new Map([["consent.google.*",0],["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["theguardian.com",6],["bloomberg.com",[7,8]],["forbes.com",[7,73]],["nike.com",7],["consent.fastcar.co.uk",7],["tapmaster.ca",7],["cmpv2.standard.co.uk",[9,10]],["cmpv2.independent.co.uk",[11,12,13,177]],["wetransfer.com",[14,15]],["spiegel.de",[16,17]],["nytimes.com",[18,173]],["consent.yahoo.com",19],["tumblr.com",20],["fplstatistics.co.uk",21],["fplstatistics.com",21],["e-shop.leonidas.com",22],["cdn.privacy-mgmt.com",[23,24,43,45,46,47,48,92,94,101,108,115,116,117,128,129,130,133,135,136,149,166,191,211,224,225,228,229,230,247,296,430,460,586,609,647,665]],["walmart.ca",25],["sams.com.mx",26],["my.tonies.com",27],["cambio-carsharing.de",27],["festool.*",27],["festoolcanada.com",27],["fuso-trucks.*",27],["tracker.fressnapf.de",27],["myfabrics.co.uk",27],["zinus.*",27],["consent.ladbible.com",[28,29]],["consent.unilad.com",[28,29]],["consent.uniladtech.com",[28,29]],["consent.gamingbible.com",[28,29]],["consent.sportbible.com",[28,29]],["consent.tyla.com",[28,29]],["consent.ladbiblegroup.com",[28,29]],["m2o.it",30],["deejay.it",30],["capital.it",30],["ilmattino.it",[30,31]],["leggo.it",[30,31]],["libero.it",30],["tiscali.it",30],["consent-manager.ft.com",[32,33,34]],["hertz.*",35],["mediaworld.it",36],["mediamarkt.*",36],["mediamarktsaturn.com",37],["uber.com",[38,174]],["ubereats.com",[38,174]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["ilgiornale.it",44],["telekom.com",49],["telekom.net",49],["telekom.de",49],["abola.pt",50],["flytap.com",50],["ansons.de",50],["blick.ch",50],["buienradar.be",50],["crunchyroll.com",50],["digi24.ro",50],["digisport.ro",50],["digitalfoundry.net",50],["egx.net",50],["emirates.com",50],["eurogamer.it",50],["foto-erhardt.de",50],["gmx.*",50],["kizi.com",50],["mail.com",50],["mcmcomiccon.com",50],["nachrichten.at",50],["nintendolife.com",50],["oe24.at",50],["paxsite.com",50],["peacocktv.com",50],["player.pl",50],["plus500.*",50],["pricerunner.com",50],["pricerunner.se",50],["pricerunner.dk",50],["proximus.be",[50,642]],["proximus.com",50],["purexbox.com",50],["pushsquare.com",50],["rugbypass.com",50],["southparkstudios.com",50],["southwest.com",50],["starwarscelebration.com",50],["sweatybetty.com",50],["theaa.ie",50],["thehaul.com",50],["timeextension.com",50],["travelandleisure.com",50],["tunein.com",50],["uefa.com",50],["videoland.com",50],["wizzair.com",50],["wetter.at",50],["dicebreaker.com",[51,52]],["eurogamer.cz",[51,52]],["eurogamer.es",[51,52]],["eurogamer.net",[51,52]],["eurogamer.nl",[51,52]],["eurogamer.pl",[51,52]],["eurogamer.pt",[51,52]],["gamesindustry.biz",[51,52]],["jelly.deals",[51,52]],["reedpop.com",[51,52]],["rockpapershotgun.com",[51,52]],["thepopverse.com",[51,52]],["vg247.com",[51,52]],["videogameschronicle.com",[51,52]],["eurogamer.de",53],["roadtovr.com",54],["jotex.*",54],["mundodeportivo.com",[55,123]],["m.youtube.com",56],["www.youtube.com",56],["ohra.nl",57],["corriere.it",58],["gazzetta.it",58],["oggi.it",58],["cmp.sky.it",59],["tennisassa.fi",60],["formula1.com",61],["f1racing.pl",62],["music.amazon.*",[63,64]],["consent-pref.trustarc.com",65],["highlights.legaseriea.it",66],["calciomercato.com",66],["sosfanta.com",67],["chrono24.*",[68,69]],["wetter.com",70],["youmath.it",71],["pip.gov.pl",72],["dailybuzz.nl",74],["bnn.de",74],["dosenbach.ch",74],["dw.com",74],["kinepolis.*",74],["mediaite.com",74],["nzz.ch",74],["winfuture.de",74],["lippu.fi",74],["racingnews365.com",74],["reifendirekt.ch",74],["vaillant.*",74],["bauhaus.no",75],["bauhaus.se",75],["beko-group.de",75],["billiger.de",75],["burda.com",75],["vanharen.nl",75],["deichmann.com",[75,97,468]],["meraluna.de",75],["slashdot.org",75],["hermann-saunierduval.it",75],["protherm.cz",75],["saunierduval.es",75],["protherm.sk",75],["protherm.ua",75],["saunierduval.hu",75],["saunierduval.ro",75],["saunierduval.at",75],["awb.nl",75],["spar.hu",76],["group.vattenfall.com",76],["mediaset.it",77],["fortune.com",78],["ilrestodelcarlino.it",79],["quotidiano.net",79],["lanazione.it",79],["ilgiorno.it",79],["iltelegrafolivorno.it",79],["auto.it",80],["beauxarts.com",80],["beinsports.com",80],["bfmtv.com",[80,124]],["boursobank.com",80],["boursorama.com",[80,124]],["boursier.com",[80,218]],["brut.media",80],["canalplus.com",80],["decathlon.fr",[80,215]],["diverto.tv",80],["eden-park.com",80],["foodvisor.io",80],["frandroid.com",80],["jobijoba.*",80],["hotelsbarriere.com",80],["intersport.*",[80,188]],["idealista.it",80],["o2.fr",80],["lejdd.fr",[80,123]],["lechorepublicain.fr",80],["la-croix.com",80],["linfo.re",80],["lamontagne.fr",80],["laredoute.fr",80],["largus.fr",80],["leprogres.fr",80],["lesnumeriques.com",80],["libramemoria.com",80],["lopinion.fr",80],["marieclaire.fr",80],["maville.com",80],["michelin.*",80],["midilibre.fr",[80,669]],["meteofrance.com",80],["mondialtissus.fr",80],["orange.fr",80],["orpi.com",80],["oscaro.com",80],["ouest-france.fr",[80,93,124,670]],["parismatch.com",80],["pagesjaunes.fr",80],["programme-television.org",[80,124]],["publicsenat.fr",[80,124]],["rmcbfmplay.com",[80,124]],["science-et-vie.com",[80,123]],["seloger.com",80],["societe.com",80],["suzuki.fr",80],["sudouest.fr",80],["web-agri.fr",80],["nutri-plus.de",81],["aa.com",82],["americanairlines.*",82],["consent.capital.fr",83],["consent.voici.fr",83],["programme-tv.net",83],["cmpv2.finn.no",84],["cmp.e24.no",[85,86]],["minmote.no",[85,86]],["cmp.vg.no",[85,86]],["huffingtonpost.fr",87],["rainews.it",88],["remarkable.com",89],["netzwelt.de",90],["money.it",91],["allocine.fr",93],["jeuxvideo.com",93],["ozap.com",93],["le10sport.com",93],["xataka.com",93],["cmp.fitbook.de",94],["cmp.autobild.de",94],["sourcepoint.sport.de",94],["cmp-sp.tagesspiegel.de",94],["cmp.bz-berlin.de",94],["cmp.cicero.de",94],["cmp.techbook.de",94],["cmp.stylebook.de",94],["cmp2.bild.de",94],["cmp2.freiepresse.de",94],["sourcepoint.wetter.de",94],["consent.finanzen.at",94],["consent.finanzen.net",94],["consent.up.welt.de",94],["sourcepoint.n-tv.de",94],["sourcepoint.kochbar.de",94],["sourcepoint.rtl.de",94],["cmp.computerbild.de",94],["cmp.petbook.de",94],["cmp-sp.siegener-zeitung.de",94],["cmp-sp.sportbuzzer.de",94],["klarmobil.de",94],["technikum-wien.at",95],["eneco.nl",96],["blackpoolgazette.co.uk",98],["lep.co.uk",98],["northamptonchron.co.uk",98],["scotsman.com",98],["shieldsgazette.com",98],["thestar.co.uk",98],["portsmouth.co.uk",98],["sunderlandecho.com",98],["northernirelandworld.com",98],["3addedminutes.com",98],["anguscountyworld.co.uk",98],["banburyguardian.co.uk",98],["bedfordtoday.co.uk",98],["biggleswadetoday.co.uk",98],["bucksherald.co.uk",98],["burnleyexpress.net",98],["buxtonadvertiser.co.uk",98],["chad.co.uk",98],["daventryexpress.co.uk",98],["derbyshiretimes.co.uk",98],["derbyworld.co.uk",98],["derryjournal.com",98],["dewsburyreporter.co.uk",98],["doncasterfreepress.co.uk",98],["falkirkherald.co.uk",98],["fifetoday.co.uk",98],["glasgowworld.com",98],["halifaxcourier.co.uk",98],["harboroughmail.co.uk",98],["harrogateadvertiser.co.uk",98],["hartlepoolmail.co.uk",98],["hemeltoday.co.uk",98],["hucknalldispatch.co.uk",98],["lancasterguardian.co.uk",98],["leightonbuzzardonline.co.uk",98],["lincolnshireworld.com",98],["liverpoolworld.uk",98],["londonworld.com",98],["lutontoday.co.uk",98],["manchesterworld.uk",98],["meltontimes.co.uk",98],["miltonkeynes.co.uk",98],["newcastleworld.com",98],["newryreporter.com",98],["newsletter.co.uk",98],["northantstelegraph.co.uk",98],["northumberlandgazette.co.uk",98],["nottinghamworld.com",98],["peterboroughtoday.co.uk",98],["rotherhamadvertiser.co.uk",98],["stornowaygazette.co.uk",98],["surreyworld.co.uk",98],["thescarboroughnews.co.uk",98],["thesouthernreporter.co.uk",98],["totallysnookered.com",98],["wakefieldexpress.co.uk",98],["walesworld.com",98],["warwickshireworld.com",98],["wigantoday.net",98],["worksopguardian.co.uk",98],["yorkshireeveningpost.co.uk",98],["yorkshirepost.co.uk",98],["eurocard.com",99],["saseurobonusmastercard.se",100],["tver.jp",102],["linkedin.com",103],["elmundo.es",[104,124]],["expansion.com",104],["s-pankki.fi",105],["srf.ch",105],["alternate.de",105],["bayer04.de",105],["douglas.de",105],["dr-beckmann.com",105],["falke.com",105],["fitnessfirst.de",105],["flaschenpost.de",105],["gloeckle.de",105],["hornbach.nl",105],["hypofriend.de",105],["lactostop.de",105],["neumann.com",105],["postbank.de",105],["immowelt.de",106],["joyn.*",106],["morenutrition.de",106],["mapillary.com",107],["cmp.seznam.cz",109],["marca.com",110],["raiplay.it",111],["raiplaysound.it",111],["derstandard.at",112],["derstandard.de",112],["faz.net",112],["automoto.it",113],["ansa.it",113],["delladio.it",113],["huffingtonpost.it",113],["internazionale.it",113],["lastampa.it",113],["macitynet.it",113],["moto.it",113],["movieplayer.it",113],["multiplayer.it",113],["repubblica.it",113],["tomshw.it",113],["skuola.net",113],["spaziogames.it",113],["tuttoandroid.net",113],["tuttotech.net",113],["ilgazzettino.it",114],["ilmessaggero.it",114],["ilsecoloxix.it",114],["privacy.motorradonline.de",117],["consent.watson.de",117],["consent.kino.de",117],["consent.desired.de",117],["cmpv2.fn.de",117],["spp.nextpit.de",117],["dailystar.co.uk",[118,119,120,121]],["mirror.co.uk",[118,119,120,121]],["idnes.cz",122],["20minutes.fr",123],["20minutos.es",123],["24sata.hr",123],["abc.es",123],["actu.fr",123],["antena3.com",123],["antena3internacional.com",123],["atresmedia.com",123],["atresmediapublicidad.com",123],["atresmediastudios.com",123],["atresplayer.com",123],["autopista.es",123],["belfasttelegraph.co.uk",123],["bemad.es",123],["bonduelle.it",123],["bonniernews.se",123],["bt.se",123],["cadenadial.com",123],["caracol.com.co",123],["cas.sk",123],["charentelibre.fr",123],["ciclismoafondo.es",123],["cnews.fr",123],["cope.es",123],["correryfitness.com",123],["courrier-picard.fr",123],["cuatro.com",123],["decathlon.nl",123],["decathlon.pl",123],["di.se",123],["diariocordoba.com",123],["diariodenavarra.es",123],["diariosur.es",123],["diariovasco.com",123],["diepresse.com",123],["divinity.es",123],["dn.se",123],["dnevnik.hr",123],["dumpert.nl",123],["ebuyclub.com",123],["edreams.de",123],["edreams.net",123],["elcomercio.es",123],["elconfidencial.com",123],["elcorreo.com",123],["eldesmarque.com",123],["eldiario.es",123],["eldiariomontanes.es",123],["elespanol.com",123],["elle.fr",123],["elpais.com",123],["elpais.es",123],["elperiodico.com",123],["elperiodicodearagon.com",123],["elplural.com",123],["energytv.es",123],["engadget.com",123],["es.ara.cat",123],["euronews.com",123],["europafm.com",123],["expressen.se",123],["factoriadeficcion.com",123],["filmstarts.de",123],["flooxernow.com",123],["folkbladet.nu",123],["footmercato.net",123],["france.tv",123],["france24.com",123],["francetvinfo.fr",123],["fussballtransfers.com",123],["fyndiq.se",123],["ghacks.net",123],["gva.be",123],["hbvl.be",123],["heraldo.es",123],["hoy.es",123],["ideal.es",123],["idealista.pt",123],["k.at",123],["krone.at",123],["kurier.at",123],["lacoste.com",123],["ladepeche.fr",123],["lalibre.be",123],["lanouvellerepublique.fr",123],["larazon.es",123],["lasexta.com",123],["lasprovincias.es",123],["latribune.fr",123],["lavanguardia.com",123],["laverdad.es",123],["lavozdegalicia.es",123],["leboncoin.fr",123],["lecturas.com",123],["ledauphine.com",123],["lejsl.com",123],["leparisien.fr",123],["lesoir.be",123],["letelegramme.fr",123],["levoixdunord.fr",123],["libremercado.com",123],["los40.com",123],["lotoquebec.com",123],["lunion.fr",123],["m6.fr",123],["marianne.cz",123],["marmiton.org",123],["mediaset.es",123],["melodia-fm.com",123],["metronieuws.nl",123],["moviepilot.de",123],["mtmad.es",123],["multilife.com.pl",123],["naszemiasto.pl",123],["nationalgeographic.com.es",123],["nicematin.com",123],["nieuwsblad.be",123],["notretemps.com",123],["numerama.com",123],["okdiario.com",123],["ondacero.es",123],["podiumpodcast.com",123],["portail.lotoquebec.com",123],["profil.at",123],["public.fr",123],["publico.es",123],["radiofrance.fr",123],["rankia.com",123],["rfi.fr",123],["rossmann.pl",123],["rtbf.be",[123,215]],["rtl.lu",123],["sensacine.com",123],["sfgame.net",123],["shure.com",123],["silicon.es",123],["sncf-connect.com",123],["sport.es",123],["sydsvenskan.se",123],["techcrunch.com",123],["telegraaf.nl",123],["telequebec.tv",123],["tf1.fr",123],["tradingsat.com",123],["trailrun.es",123],["video-streaming.orange.fr",123],["xpress.fr",123],["ivoox.com",124],["as.com",124],["slam.nl",124],["bienpublic.com",124],["funradio.fr",124],["gamepro.de",[124,185,186]],["lemon.fr",124],["lexpress.fr",124],["shadow.tech",124],["letemps.ch",124],["mein-mmo.de",124],["heureka.sk",124],["film.at",124],["dhnet.be",124],["lesechos.fr",[124,220]],["marianne.net",[124,215]],["jeanmarcmorandini.com",[124,216]],["dna.fr",124],["sudinfo.be",124],["europe1.fr",[124,216]],["rtl.be",[124,215]],["reviewingthebrew.com",124],["jaysjournal.com",124],["reignoftroy.com",124],["ryobitools.eu",[125,126]],["americanexpress.com",127],["consent.radiotimes.com",130],["sp-consent.szbz.de",131],["cmp.omni.se",132],["cmp.svd.se",132],["cmp.aftonbladet.se",132],["cmp.tv.nu",132],["consent.economist.com",134],["studentagency.cz",134],["cmpv2.foundryco.com",135],["cmpv2.infoworld.com",135],["cmpv2.arnnet.com.au",135],["sp-cdn.pcgames.de",136],["sp-cdn.pcgameshardware.de",136],["consentv2.sport1.de",136],["cmp.mz.de",136],["cmpv2.tori.fi",137],["cdn.privacy-mgmt.co",138],["consent.spielaffe.de",139],["bondekompaniet.no",140],["degiro.*",140],["epochtimes.de",140],["vikingline.com",140],["tfl.gov.uk",140],["drklein.de",140],["hildegardis-krankenhaus.de",140],["kleer.se",140],["lekiaviation.com",140],["lotto.pl",140],["mineralstech.com",140],["volunteer.digitalboost.org.uk",140],["starhotels.com",140],["tefl.com",140],["universumglobal.com",140],["tui.com",141],["rexel.*",142],["csob.sk",143],["greenstuffworld.com",144],["morele.net",[145,146]],["1und1.de",147],["infranken.de",148],["cmp.bunte.de",149],["cmp.chip.de",149],["cmp.focus.de",[149,495]],["estadiodeportivo.com",150],["tameteo.*",150],["tempo.pt",150],["meteored.*",150],["pogoda.com",150],["yourweather.co.uk",150],["tempo.com",150],["theweather.net",150],["tiempo.com",150],["ilmeteo.net",150],["daswetter.com",150],["kicker.de",151],["formulatv.com",152],["web.de",153],["lefigaro.fr",154],["linternaute.com",155],["consent.caminteresse.fr",156],["volksfreund.de",157],["rp-online.de",157],["dailypost.co.uk",158],["the-express.com",158],["vide-greniers.org",158],["bluray-disc.de",159],["elio-systems.com",159],["stagatha-fachklinik.de",159],["tarife.mediamarkt.de",159],["lz.de",159],["gaggenau.com",159],["saturn.de",160],["eltiempo.es",[161,162]],["otempo.pt",163],["atlasformen.*",164],["cmp-sp.goettinger-tageblatt.de",165],["cmp-sp.saechsische.de",165],["cmp-sp.ln-online.de",165],["cz.de",165],["dewezet.de",165],["dnn.de",165],["haz.de",165],["gnz.de",165],["landeszeitung.de",165],["lvz.de",165],["maz-online.de",165],["ndz.de",165],["op-marburg.de",165],["ostsee-zeitung.de",165],["paz-online.de",165],["reisereporter.de",165],["rga.de",165],["rnd.de",165],["siegener-zeitung.de",165],["sn-online.de",165],["solinger-tageblatt.de",165],["sportbuzzer.de",165],["szlz.de",165],["tah.de",165],["torgauerzeitung.de",165],["waz-online.de",165],["privacy.maennersache.de",165],["sinergy.ch",167],["agglo-valais-central.ch",167],["biomedcentral.com",168],["hsbc.*",169],["hsbcnet.com",169],["hsbcinnovationbanking.com",169],["create.hsbc",169],["gbm.hsbc.com",169],["hsbc.co.uk",170],["internationalservices.hsbc.com",170],["history.hsbc.com",170],["about.hsbc.co.uk",171],["privatebanking.hsbc.com",172],["independent.co.uk",175],["privacy.crash.net",175],["the-independent.com",176],["argos.co.uk",178],["poco.de",[179,180]],["moebelix.*",179],["moemax.*",179],["xxxlutz.*",179],["xxxlesnina.*",179],["moebel24.ch",180],["meubles.fr",180],["meubelo.nl",180],["moebel.de",180],["lipo.ch",181],["schubiger.ch",182],["aedt.de",183],["berlin-live.de",183],["connect.de",183],["gutefrage.net",183],["insideparadeplatz.ch",183],["morgenpost.de",183],["play3.de",183],["thueringen24.de",183],["pdfupload.io",184],["gamestar.de",[185,186,224]],["verksamt.se",187],["acmemarkets.com",188],["amtrak.com",188],["beko.com",188],["bepanthen.com.au",188],["berocca.com.au",188],["booking.com",188],["carrefour.fr",188],["centrum.sk",188],["claratyne.com.au",188],["credit-suisse.com",188],["ceskatelevize.cz",188],["deporvillage.*",188],["de.vanguard",188],["dhl.de",188],["digikey.*",188],["drafthouse.com",188],["dunelm.com",188],["eurosport.fr",188],["fello.se",188],["fielmann.*",188],["flashscore.fr",188],["flightradar24.com",188],["fnac.es",188],["foodandwine.com",188],["fourseasons.com",188],["khanacademy.org",188],["konami.com",188],["jll.*",188],["jobs.redbull.com",188],["hellenicbank.com",188],["gemini.pl",188],["groceries.asda.com",188],["lamborghini.com",188],["menshealth.com",188],["n26.com",188],["nintendo.com",188],["nokia.com",188],["oneweb.net",188],["omnipod.com",188],["oralb.*",188],["panasonic.com",188],["parkside-diy.com",188],["pluto.tv",188],["popularmechanics.com",188],["polskieradio.pl",188],["pringles.com",188],["radissonhotels.com",188],["ricardo.ch",188],["rockstargames.com",188],["rte.ie",188],["salesforce.com",188],["samsonite.*",188],["spiele.heise.de",188],["spirit.com",188],["stenaline.co.uk",188],["swisscom.ch",188],["swisspass.ch",188],["technologyfromsage.com",188],["telenet.be",188],["tntsports.co.uk",188],["theepochtimes.com",188],["toujeo.com",188],["uber-platz.de",188],["questdiagnostics.com",188],["wallapop.com",188],["wickes.co.uk",188],["workingtitlefilms.com",188],["vattenfall.de",188],["winparts.fr",188],["yoigo.com",188],["zoominfo.com",188],["allegiantair.com",189],["hallmarkchannel.com",189],["incorez.com",189],["noovle.com",189],["otter.ai",189],["plarium.com",189],["telsy.com",189],["timenterprise.it",189],["tim.it",189],["tradersunion.com",189],["fnac.*",189],["yeti.com",189],["here.com",[190,678]],["vodafone.com",190],["cmp.heise.de",192],["cmp.am-online.com",192],["cmp.motorcyclenews.com",192],["consent.newsnow.co.uk",192],["cmp.todays-golfer.com",192],["spp.nextpit.com",192],["koeser.com",193],["shop.schaette-pferd.de",193],["schaette.de",193],["ocre-project.eu",194],["central-bb.de",195],["fitnessfoodcorner.de",196],["kuehlungsborn.de",197],["espressocoffeeshop.com",198],["brainmarket.pl",199],["getroots.app",200],["cart-in.re",[201,605]],["prestonpublishing.pl",202],["zara.com",203],["lepermislibre.fr",203],["negociardivida.spcbrasil.org.br",204],["adidas.*",205],["privacy.topreality.sk",206],["privacy.autobazar.eu",206],["vu.lt",207],["adnkronos.com",[208,209]],["cornwalllive.com",[208,209]],["cyprus-mail.com",[208,209]],["einthusan.tv",[208,209]],["informazione.it",[208,209]],["mymovies.it",[208,209]],["tuttoeuropei.com",[208,209]],["video.lacnews24.it",[208,209]],["protothema.gr",208],["flash.gr",208],["taxscouts.com",210],["online.no",212],["telenor.no",212],["austrian.com",213],["lufthansa.com",213],["kampfkunst-herz.de",214],["glow25.de",214],["hornetsecurity.com",214],["kayzen.io",214],["wasserkunst-hamburg.de",214],["zahnspange-oelde.de",214],["bnc.ca",215],["egora.fr",215],["engelvoelkers.com",215],["estrategiasdeinversion.com",215],["festo.com",215],["franceinfo.fr",215],["francebleu.fr",215],["francemediasmonde.com",215],["geny.com",215],["giphy.com",215],["idealista.com",215],["infolibre.es",215],["information.tv5monde.com",215],["ing.es",215],["knipex.de",215],["laprovence.com",215],["lemondeinformatique.fr",215],["libertaddigital.com",215],["mappy.com",215],["orf.at",215],["philibertnet.com",215],["researchgate.net",215],["standaard.be",215],["stroilioro.com",215],["taxfix.de",215],["telecinco.es",215],["vistaalegre.com",215],["zimbra.free.fr",215],["usinenouvelle.com",217],["reussir.fr",219],["bruendl.at",221],["latamairlines.com",222],["elisa.ee",223],["baseendpoint.brigitte.de",224],["baseendpoint.gala.de",224],["baseendpoint.haeuser.de",224],["baseendpoint.stern.de",224],["baseendpoint.urbia.de",224],["cmp.tag24.de",224],["cmp-sp.handelsblatt.com",224],["cmpv2.berliner-zeitung.de",224],["golem.de",224],["consent.t-online.de",224],["sp-consent.stuttgarter-nachrichten.de",225],["sp-consent.stuttgarter-zeitung.de",225],["regjeringen.no",226],["sp-manager-magazin-de.manager-magazin.de",227],["consent.11freunde.de",227],["centrum24.pl",231],["replay.lsm.lv",232],["ltv.lsm.lv",232],["bernistaba.lsm.lv",232],["stadt-wien.at",233],["verl.de",233],["cubo-sauna.de",233],["mbl.is",233],["auto-medienportal.net",233],["mobile.de",234],["cookist.it",235],["fanpage.it",235],["geopop.it",235],["lexplain.it",235],["royalmail.com",236],["gmx.net",237],["gmx.ch",238],["mojehobby.pl",239],["super-hobby.*",239],["sp.stylevamp.de",240],["cmp.wetteronline.de",240],["audi.*",241],["easyjet.com",241],["experian.co.uk",241],["postoffice.co.uk",241],["tescobank.com",241],["internetaptieka.lv",[242,243]],["wells.pt",244],["dskdirect.bg",245],["cmpv2.dba.dk",246],["spcmp.crosswordsolver.com",247],["ecco.com",248],["georgjensen.com",248],["thomann.*",249],["landkreis-kronach.de",250],["effectiefgeven.be",251],["northcoast.com",251],["chaingpt.org",251],["bandenconcurrent.nl",252],["bandenexpert.be",252],["reserved.com",253],["metro.it",254],["makro.es",254],["metro.sk",254],["metro-cc.hr",254],["makro.nl",254],["metro.bg",254],["metro.at",254],["metro-tr.com",254],["metro.de",254],["metro.fr",254],["makro.cz",254],["metro.ro",254],["makro.pt",254],["makro.pl",254],["sklepy-odido.pl",254],["rastreator.com",254],["metro.ua",255],["metro.rs",255],["metro-kz.com",255],["metro.md",255],["metro.hu",255],["metro-cc.ru",255],["metro.pk",255],["balay.es",256],["constructa.com",256],["dafy-moto.com",257],["akku-shop.nl",258],["akkushop-austria.at",258],["akkushop-b2b.de",258],["akkushop.de",258],["akkushop.dk",258],["batterie-boutique.fr",258],["akkushop-schweiz.ch",259],["evzuttya.com.ua",260],["eobuv.cz",260],["eobuwie.com.pl",260],["ecipele.hr",260],["eavalyne.lt",260],["efootwear.eu",260],["eschuhe.ch",260],["eskor.se",260],["chaussures.fr",260],["ecipo.hu",260],["eobuv.com.ua",260],["eobuv.sk",260],["epantofi.ro",260],["epapoutsia.gr",260],["escarpe.it",260],["eschuhe.de",260],["obuvki.bg",260],["zapatos.es",260],["swedbank.ee",261],["mudanzavila.es",262],["bienmanger.com",263],["gesipa.*",264],["gesipausa.com",264],["beckhoff.com",264],["zitekick.dk",265],["eltechno.dk",265],["okazik.pl",265],["batteryempire.*",266],["maxi.rs",267],["garmin.com",268],["invisalign.*",268],["one4all.ie",268],["osprey.com",268],["wideroe.no",269],["bmw.*",270],["kijk.nl",271],["nordania.dk",272],["danskebank.*",272],["danskeci.com",272],["danicapension.dk",272],["dehn.*",273],["gewerbegebiete.de",274],["cordia.fr",275],["vola.fr",276],["lafi.fr",277],["skyscanner.*",278],["coolblue.*",279],["sanareva.*",280],["atida.fr",280],["bbva.*",281],["bbvauk.com",281],["expertise.unimi.it",282],["altenberg.de",283],["vestel.es",284],["tsb.co.uk",285],["buienradar.nl",[286,287]],["linsenplatz.de",288],["budni.de",289],["erstecardclub.hr",289],["teufel.de",[290,291]],["abp.nl",292],["simplea.sk",293],["flip.bg",294],["kiertokanki.com",295],["leirovins.be",297],["vias.be",298],["edf.fr",299],["virbac.com",299],["diners.hr",299],["squarehabitat.fr",299],["arbitrobancariofinanziario.it",300],["ivass.it",300],["economiapertutti.bancaditalia.it",300],["smit-sport.de",301],["gekko-computer.de",301],["jysk.al",302],["go-e.com",303],["malerblatt-medienservice.de",304],["architekturbuch.de",304],["medienservice-holz.de",304],["leuchtstark.de",304],["casius.nl",305],["coolinarika.com",306],["giga-hamburg.de",306],["vakgaragevannunen.nl",306],["fortuluz.es",306],["finna.fi",306],["eurogrow.es",306],["topnatur.cz",306],["topnatur.eu",306],["vakgaragevandertholen.nl",306],["whufc.com",306],["zomaplast.cz",306],["envafors.dk",307],["dabbolig.dk",[308,309]],["daruk-emelok.hu",310],["exakta.se",311],["larca.de",312],["roli.com",313],["okazii.ro",314],["lr-shop-direkt.de",314],["portalprzedszkolny.pl",314],["tgvinoui.sncf",315],["l-bank.de",316],["interhyp.de",317],["indigoneo.*",318],["transparency.meta.com",319],["dojusagro.lt",320],["eok.ee",320],["kripa.it",320],["nextdaycatering.co.uk",320],["safran-group.com",320],["sr-ramenendeuren.be",320],["ilovefreegle.org",320],["tribexr.com",320],["understandingsociety.ac.uk",320],["bestbuycyprus.com",321],["strato.*",322],["strato-hosting.co.uk",322],["auto.de",323],["contentkingapp.com",324],["comune.palermo.it",325],["get-in-engineering.de",326],["spp.nextpit.es",327],["spp.nextpit.it",328],["spp.nextpit.com.br",329],["spp.nextpit.fr",330],["otterbox.com",331],["stoertebeker-brauquartier.com",332],["stoertebeker.com",332],["stoertebeker-eph.com",332],["aparts.pl",333],["sinsay.com",[334,335]],["benu.cz",336],["stockholmresilience.org",337],["ludvika.se",337],["kammarkollegiet.se",337],["cazenovecapital.com",338],["statestreet.com",339],["beopen.lv",340],["cesukoncertzale.lv",341],["dodo.fr",342],["pepper.it",343],["pepper.pl",343],["preisjaeger.at",343],["mydealz.de",343],["dealabs.com",343],["hotukdeals.com",343],["chollometro.com",343],["makelaarsland.nl",344],["bezirk-schwaben.de",345],["nutsinbulk.co.uk",346],["bricklink.com",347],["bestinver.es",348],["icvs2023.conf.tuwien.ac.at",349],["racshop.co.uk",[350,351]],["baabuk.com",352],["sapien.io",352],["tradedoubler.com",352],["app.lepermislibre.fr",353],["multioferta.es",354],["testwise.com",[355,356]],["tonyschocolonely.com",357],["fitplus.is",357],["fransdegrebber.nl",357],["lilliputpress.ie",357],["lexibo.com",357],["marin-milou.com",357],["dare2tri.com",357],["t3micro.*",357],["la-vie-naturelle.com",[358,359]],["inovelli.com",360],["uonetplus.vulcan.net.pl",[361,362]],["consent.helagotland.se",363],["oper.koeln",[364,365]],["deezer.com",366],["hoteldesartssaigon.com",367],["autoritedelaconcurrence.fr",368],["groupeonepoint.com",368],["geneanet.org",368],["carrieres.groupegalerieslafayette.com",368],["immo-banques.fr",368],["lingvanex.com",368],["turncamp.com",369],["ejobs.ro",[370,371]],["kupbilecik.*",[372,373]],["coolbe.com",374],["serienjunkies.de",375],["computerhoy.20minutos.es",376],["clickskeks.at",377],["clickskeks.de",377],["abt-sportsline.de",377],["exemplary.ai",378],["forbo.com",378],["stores.sk",378],["nerdstar.de",378],["prace.cz",378],["profesia.sk",378],["profesia.cz",378],["pracezarohem.cz",378],["atmoskop.cz",378],["seduo.sk",378],["seduo.cz",378],["teamio.com",378],["arnold-robot.com",378],["cvonline.lt",378],["cv.lv",378],["cv.ee",378],["dirbam.lt",378],["visidarbi.lv",378],["otsintood.ee",378],["webtic.it",378],["gerth.de",379],["pamiatki.pl",380],["initse.com",381],["salvagny.org",382],["augsburger-allgemeine.de",383],["stabila.com",384],["stwater.co.uk",385],["suncalc.org",[386,387]],["swisstph.ch",388],["taxinstitute.ie",389],["get-in-it.de",390],["tempcover.com",[391,392]],["guildford.gov.uk",393],["easyparts.*",[394,395]],["easyparts-recambios.es",[394,395]],["easyparts-rollerteile.de",[394,395]],["drimsim.com",396],["canyon.com",[397,398]],["vevovo.be",[399,400]],["vendezvotrevoiture.be",[399,400]],["wirkaufendeinauto.at",[399,400]],["vikoberallebiler.dk",[399,400]],["wijkopenautos.nl",[399,400]],["vikoperdinbil.se",[399,400]],["noicompriamoauto.it",[399,400]],["vendezvotrevoiture.fr",[399,400]],["compramostucoche.es",[399,400]],["wijkopenautos.be",[399,400]],["auto-doc.*",401],["autodoc.*",401],["autodoc24.*",401],["topautoosat.fi",401],["autoteiledirekt.de",401],["autoczescionline24.pl",401],["tuttoautoricambi.it",401],["onlinecarparts.co.uk",401],["autoalkatreszek24.hu",401],["autodielyonline24.sk",401],["reservdelar24.se",401],["pecasauto24.pt",401],["reservedeler24.co.no",401],["piecesauto24.lu",401],["rezervesdalas24.lv",401],["besteonderdelen.nl",401],["recambioscoche.es",401],["antallaktikaexartimata.gr",401],["piecesauto.fr",401],["teile-direkt.ch",401],["lpi.org",402],["divadelniflora.cz",403],["mahle-aftermarket.com",404],["refurbed.*",405],["eingutertag.org",406],["flyingtiger.com",[406,554]],["borgomontecedrone.it",406],["maharishistore.com",406],["recaro-shop.com",406],["gartenhotel-crystal.at",406],["fayn.com",407],["serica-watches.com",407],["sklavenitis.gr",408],["eam-netz.de",409],["umicore.*",410],["veiligverkeer.be",410],["vsv.be",410],["dehogerielen.be",410],["gera.de",411],["mfr-chessy.fr",412],["mfr-lamure.fr",412],["mfr-saint-romain.fr",412],["mfr-lapalma.fr",412],["mfrvilliemorgon.asso.fr",412],["mfr-charentay.fr",412],["mfr.fr",412],["nationaltrust.org.uk",413],["hej-natural.*",414],["ib-hansmeier.de",415],["rsag.de",416],["esaa-eu.org",416],["aknw.de",416],["answear.*",417],["theprotocol.it",[418,419]],["lightandland.co.uk",420],["etransport.pl",421],["wohnen-im-alter.de",422],["johnmuirhealth.com",[423,424]],["markushaenni.com",425],["airbaltic.com",426],["gamersgate.com",426],["zorgzaam010.nl",427],["etos.nl",428],["paruvendu.fr",429],["cmpv2.bistro.sk",431],["privacy.bazar.sk",431],["hennamorena.com",432],["newsello.pl",433],["porp.pl",434],["golfbreaks.com",435],["lieferando.de",436],["just-eat.*",436],["justeat.*",436],["pyszne.pl",436],["lieferando.at",436],["takeaway.com",436],["thuisbezorgd.nl",436],["holidayhypermarket.co.uk",437],["unisg.ch",438],["wassererleben.ch",438],["psgaz.pl",439],["play-asia.com",440],["atu.de",441],["atu-flottenloesungen.de",441],["but.fr",441],["edeka.de",441],["fortuneo.fr",441],["maif.fr",441],["particuliers.sg.fr",441],["sparkasse.at",441],["group.vig",441],["tf1info.fr",441],["dpdgroup.com",442],["dpd.fr",442],["dpd.com",442],["cosmosdirekt.de",442],["bstrongoutlet.pt",443],["nobbot.com",444],["isarradweg.de",[445,446]],["flaxmanestates.com",446],["inland-casas.com",446],["finlayson.fi",[447,448]],["cowaymega.ca",[447,448]],["arktis.de",449],["desktronic.de",449],["belleek.com",449],["brauzz.com",449],["cowaymega.com",449],["dockin.de",449],["dryrobe.com",[449,450]],["formswim.com",449],["hairtalk.se",449],["hallmark.co.uk",[449,450]],["loopearplugs.com",[449,450]],["oleus.com",449],["peopleofshibuya.com",449],["pullup-dip.com",449],["sanctum.shop",449],["tartanblanketco.com",449],["desktronic.*",450],["hq-germany.com",450],["tepedirect.com",450],["maxi-pet.ro",450],["paper-republic.com",450],["pullup-dip.*",450],["vitabiotics.com",450],["smythstoys.com",451],["beam.co.uk",[452,453]],["autobahn.de",454],["krakow.pl",455],["shop.app",456],["shopify.com",456],["wufoo.com",457],["consent.dailymotion.com",458],["laposte.fr",458],["help.instagram.com",459],["consent-manager.thenextweb.com",461],["consent-cdn.zeit.de",462],["coway-usa.com",463],["steiners.shop",464],["ecmrecords.com",465],["malaikaraiss.com",465],["koch-mit.de",465],["zeitreisen.zeit.de",465],["wefashion.com",466],["merkur.dk",467],["ionos.*",469],["omegawatches.com",470],["carefully.be",471],["aerotime.aero",471],["rocket-league.com",472],["dws.com",473],["bosch-homecomfort.com",474],["elmleblanc-optibox.fr",474],["monservicechauffage.fr",474],["boschrexroth.com",474],["home-connect.com",475],["lowrider.at",[476,477]],["mesto.de",478],["intersport.gr",479],["intersport.bg",479],["intersport.com.cy",479],["intersport.ro",479],["ticsante.com",480],["techopital.com",480],["millenniumprize.org",481],["hepster.com",482],["ellisphere.fr",483],["peterstaler.de",484],["blackforest-still.de",484],["tiendaplayaundi.com",485],["ajtix.co.uk",486],["raja.fr",487],["rajarani.de",487],["rajapack.*",[487,488]],["avery-zweckform.com",489],["1xinternet.de",489],["futterhaus.de",489],["dasfutterhaus.at",489],["frischeparadies.de",489],["fmk-steuer.de",489],["selgros.de",489],["transgourmet.de",489],["mediapart.fr",490],["athlon.com",491],["alumniportal-deutschland.org",492],["snoopmedia.com",492],["myguide.de",492],["study-in-germany.de",492],["daad.de",492],["cornelsen.de",[493,494]],["vinmonopolet.no",496],["tvp.info",497],["tvp.pl",497],["tvpworld.com",497],["brtvp.pl",497],["tvpparlament.pl",497],["belsat.eu",497],["warnung.bund.de",498],["mediathek.lfv-bayern.de",499],["allegro.*",500],["allegrolokalnie.pl",500],["ceneo.pl",500],["czc.cz",500],["eon.pl",[501,502]],["ylasatakunta.fi",[503,504]],["mega-image.ro",505],["louisvuitton.com",506],["bodensee-airport.eu",507],["department56.com",508],["allendesignsstudio.com",508],["designsbylolita.co",508],["shop.enesco.com",508],["savoriurbane.com",509],["miumiu.com",510],["church-footwear.com",510],["clickdoc.fr",511],["car-interface.com",512],["monolithdesign.it",512],["thematchahouse.com",512],["smileypack.de",[513,514]],["malijunaki.si",515],["finom.co",516],["orange.es",[517,518]],["fdm-travel.dk",519],["hummel.dk",519],["jysk.nl",519],["power.no",519],["skousen.dk",519],["velliv.dk",519],["whiteaway.com",519],["whiteaway.no",519],["whiteaway.se",519],["skousen.no",519],["energinet.dk",519],["elkjop.no",520],["medimax.de",521],["costautoricambi.com",522],["lotto.it",522],["readspeaker.com",522],["team.blue",522],["ibistallinncenter.ee",523],["aaron.ai",524],["futureverse.com",525],["tandem.co.uk",525],["insights.com",526],["thebathcollection.com",527],["coastfashion.com",[528,529]],["oasisfashion.com",[528,529]],["warehousefashion.com",[528,529]],["misspap.com",[528,529]],["karenmillen.com",[528,529]],["boohooman.com",[528,529]],["hdt.de",530],["wolt.com",531],["myprivacy.dpgmedia.nl",532],["myprivacy.dpgmedia.be",532],["www.dpgmediagroup.com",532],["xohotels.com",533],["sim24.de",534],["tnt.com",535],["uza.be",536],["uzafoundation.be",536],["uzajobs.be",536],["bergzeit.*",[537,538]],["cinemas-lumiere.com",539],["cdiscount.com",540],["brabus.com",541],["roborock.com",542],["strumentimusicali.net",543],["maisonmargiela.com",544],["webfleet.com",545],["dragonflyshipping.ca",546],["broekhuis.nl",547],["groningenairport.nl",547],["nemck.cz",548],["bokio.se",549],["sap-press.com",550],["roughguides.com",[551,552]],["korvonal.com",553],["rexbo.*",555],["itau.com.br",556],["bbg.gv.at",557],["portal.taxi.eu",558],["topannonces.fr",559],["homap.fr",560],["artifica.fr",561],["plan-interactif.com",561],["ville-cesson.fr",561],["moismoliere.com",562],["unihomes.co.uk",563],["bkk.hu",564],["coiffhair.com",565],["ptc.eu",566],["ziegert-group.com",[567,675]],["lassuranceretraite.fr",568],["interieur.gouv.fr",568],["toureiffel.paris",568],["economie.gouv.fr",568],["education.gouv.fr",568],["livoo.fr",568],["su.se",568],["zappo.fr",568],["smdv.de",569],["digitalo.de",569],["petiteamelie.*",570],["mojanorwegia.pl",571],["koempf24.ch",[572,573]],["teichitekten24.de",[572,573]],["koempf24.de",[572,573]],["wolff-finnhaus-shop.de",[572,573]],["asnbank.nl",574],["blgwonen.nl",574],["regiobank.nl",574],["snsbank.nl",574],["vulcan.net.pl",[575,576]],["ogresnovads.lv",577],["partenamut.be",578],["pirelli.com",579],["unicredit.it",580],["effector.pl",581],["zikodermo.pl",[582,583]],["devolksbank.nl",584],["caixabank.es",585],["cyberport.de",587],["cyberport.at",587],["slevomat.cz",588],["kfzparts24.de",589],["runnersneed.com",590],["aachener-zeitung.de",591],["sportpursuit.com",592],["druni.es",[593,606]],["druni.pt",[593,606]],["delta.com",594],["onliner.by",[595,596]],["vejdirektoratet.dk",597],["usaa.com",598],["consorsbank.de",599],["metroag.de",600],["kupbilecik.pl",601],["oxfordeconomics.com",602],["oxfordeconomics.com.au",[603,604]],["routershop.nl",605],["woo.pt",605],["e-jumbo.gr",607],["alza.*",608],["rmf.fm",610],["rmf24.pl",610],["tracfone.com",611],["lequipe.fr",612],["global.abb",613],["gala.fr",614],["purepeople.com",615],["3sat.de",616],["zdf.de",616],["filmfund.lu",617],["welcometothejungle.com",617],["triblive.com",618],["rai.it",619],["fbto.nl",620],["europa.eu",621],["caisse-epargne.fr",622],["banquepopulaire.fr",622],["bigmammagroup.com",623],["studentagency.sk",623],["studentagency.eu",623],["winparts.be",624],["winparts.nl",624],["winparts.eu",625],["winparts.ie",625],["winparts.se",625],["sportano.*",[626,627]],["crocs.*",628],["chronext.ch",629],["chronext.de",629],["chronext.at",629],["chronext.com",630],["chronext.co.uk",630],["chronext.fr",631],["chronext.nl",632],["chronext.it",633],["galerieslafayette.com",634],["bazarchic.com",635],["stilord.*",636],["tiko.pt",637],["nsinternational.com",638],["meinbildkalender.de",639],["gls-group.com",640],["gls-group.eu",640],["chilis.com",641],["account.bhvr.com",643],["everand.com",643],["lucidchart.com",643],["intercars.ro",[643,644]],["scribd.com",643],["guidepoint.com",643],["erlebnissennerei-zillertal.at",645],["hintertuxergletscher.at",645],["tiwag.at",645],["anwbvignetten.nl",646],["playseatstore.com",646],["swiss-sport.tv",648],["targobank-magazin.de",649],["zeit-verlagsgruppe.de",649],["online-physiotherapie.de",649],["kieferorthopaede-freisingsmile.de",650],["nltraining.nl",651],["kmudigital.at",652],["mintysquare.com",653],["consent.thetimes.com",654],["cadenaser.com",655],["berlinale.de",656],["lebonlogiciel.com",657],["pharmastar.it",658],["washingtonpost.com",659],["brillenplatz.de",660],["angelplatz.de",660],["dt.mef.gov.it",661],["raffeldeals.com",662],["stepstone.de",663],["kobo.com",664],["zoxs.de",666],["offistore.fi",667],["collinsaerospace.com",668],["radioapp.lv",671],["hagengrote.de",672],["hemden-meister.de",672],["vorteilshop.com",673],["capristores.gr",674],["getaround.com",676],["technomarket.bg",677],["epiphone.com",679],["gibson.com",679],["maestroelectronics.com",679],["cropp.com",[680,681]],["housebrand.com",[680,681]],["mohito.com",[680,681]],["autoczescizielonki.pl",682],["b-s.de",683],["novakid.pl",684],["piecesauto24.com",685],["earpros.com",686],["portalridice.cz",687],["kitsapcu.org",688],["nutsinbulk.*",689],["berlin-buehnen.de",690],["metropoliten.rs",691],["educa2.madrid.org",692],["immohal.de",693],["sourcepoint.theguardian.com",694],["rtlplay.be",695],["natgeotv.com",695],["llama.com",696],["meta.com",696],["setasdesevilla.com",697],["cruyff-foundation.org",698],["allianz.*",699],["energiedirect-bayern.de",700],["postnl.be",701],["postnl.nl",701],["sacyr.com",702],["volkswagen-newsroom.com",703],["openbank.*",704],["tagus-eoficina.grupogimeno.com",705],["tidal.com",706],["knax.de",707],["ordblindenetvaerket.dk",708],["boligbeton.dk",708],["dukh.dk",708],["pevgrow.com",709],["ya.ru",710],["ipolska24.pl",711],["17bankow.com",711],["5mindlazdrowia.pl",711],["kazimierzdolny.pl",711],["vpolshchi.pl",711],["dobreprogramy.pl",711],["essanews.com",711],["dailywrap.ca",711],["dailywrap.uk",711],["money.pl",711],["autokult.pl",711],["komorkomania.pl",711],["polygamia.pl",711],["autocentrum.pl",711],["allani.pl",711],["homebook.pl",711],["domodi.pl",711],["jastrzabpost.pl",711],["open.fm",711],["gadzetomania.pl",711],["fotoblogia.pl",711],["abczdrowie.pl",711],["parenting.pl",711],["kafeteria.pl",711],["vibez.pl",711],["wakacje.pl",711],["extradom.pl",711],["totalmoney.pl",711],["superauto.pl",711],["nerwica.com",711],["forum.echirurgia.pl",711],["dailywrap.net",711],["pysznosci.pl",711],["genialne.pl",711],["finansowysupermarket.pl",711],["deliciousmagazine.pl",711],["audioteka.com",711],["easygo.pl",711],["so-magazyn.pl",711],["o2.pl",711],["pudelek.pl",711],["benchmark.pl",711],["wp.pl",711],["altibox.dk",712],["altibox.no",712],["talksport.com",713],["zuiderzeemuseum.nl",714],["gota.io",715],["nwzonline.de",716],["wero-wallet.eu",717],["scaleway.com",718]]);
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
