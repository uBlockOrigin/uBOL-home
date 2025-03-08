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
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[aria-labelledby=\"manage_cookies_title\"] [aria-hidden=\"true\"]:has(> [aria-disabled=\"true\"][role=\"button\"]) + [aria-label][role=\"button\"][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","500"],["button[title=\"REJECT ALL\"]","","1000"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[title^=\"Continuer sans accepter\"]"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],["#cmp-btn-accept","!cookie:/^gpt_ppid[^=]+=/","5000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["button[title=\"Accept all\"i]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1000"],["button[title^=\"Alle akzeptieren\"]"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[id=\"ue-accept-notice-button\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#onetrust-pc-btn-handler"],[".save-preference-btn-handler","","1000"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1000"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1000"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","1600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","1000"],["button[title=\"Accept\"]","","1000"],["button.js-decline-all-cookies","","1000"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#popin_tc_privacy_button_2","","1000"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","1000"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-accept-cookie=\"true\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["div[data-test-id=\"CookieConsentsBanner.Root\"] button[data-test-id=\"decline-button\"]","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1000"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#btn-accept-required-banner","","1000"],["button#elc-decline-all-link","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button[data-role=\"reject-rodo\"]","","1500"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","1000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","1000"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],["button.cc-nb-reject","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["#cookiescript_reject","","500"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["button.tm-button.secondary-invert","","1000"]];
const hostnamesMap = new Map([["consent.google.*",0],["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["theguardian.com",6],["bloomberg.com",7],["forbes.com",[7,71]],["nike.com",7],["consent.fastcar.co.uk",7],["cmpv2.standard.co.uk",[8,9]],["cmpv2.independent.co.uk",[10,11,12]],["wetransfer.com",[13,14]],["spiegel.de",[15,16]],["nytimes.com",[17,162]],["consent.yahoo.com",18],["tumblr.com",19],["fplstatistics.co.uk",20],["e-shop.leonidas.com",21],["cdn.privacy-mgmt.com",[22,23,43,44,45,46,85,90,92,99,106,113,123,124,125,128,130,131,138,155,178,188,197,198,201,202,203,268,370,501,515]],["walmart.ca",24],["sams.com.mx",25],["cambio-carsharing.de",26],["festool.*",26],["festoolcanada.com",26],["fuso-trucks.*",26],["tracker.fressnapf.de",26],["s-pankki.fi",26],["dr-beckmann.com",26],["consent.ladbible.com",[27,28]],["consent.unilad.com",[27,28]],["consent.uniladtech.com",[27,28]],["consent.gamingbible.com",[27,28]],["consent.sportbible.com",[27,28]],["consent.tyla.com",[27,28]],["consent.ladbiblegroup.com",[27,28]],["m2o.it",29],["deejay.it",29],["capital.it",29],["ilmattino.it",[29,30]],["leggo.it",[29,30]],["libero.it",29],["tiscali.it",29],["consent-manager.ft.com",[31,32,33]],["hertz.*",34],["mediaworld.it",35],["mediamarkt.*",35],["mediamarktsaturn.com",36],["tf1info.fr",37],["uber.com",[38,163]],["ubereats.com",[38,163]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["telekom.com",47],["telekom.net",47],["telekom.de",47],["abola.pt",48],["flytap.com",48],["ansons.de",48],["blick.ch",48],["buienradar.be",48],["crunchyroll.com",48],["digi24.ro",48],["digisport.ro",48],["digitalfoundry.net",48],["egx.net",48],["emirates.com",48],["eurogamer.it",48],["gmx.*",48],["mail.com",48],["mcmcomiccon.com",48],["nachrichten.at",48],["nintendolife.com",48],["oe24.at",48],["paxsite.com",48],["peacocktv.com",48],["player.pl",48],["plus500.*",48],["pricerunner.com",48],["pricerunner.se",48],["pricerunner.dk",48],["proximus.be",48],["proximus.com",48],["purexbox.com",48],["pushsquare.com",48],["rugbypass.com",48],["southparkstudios.com",48],["southwest.com",48],["starwarscelebration.com",48],["sweatybetty.com",48],["thehaul.com",48],["timeextension.com",48],["travelandleisure.com",48],["tunein.com",48],["videoland.com",48],["wizzair.com",48],["wetter.at",48],["dicebreaker.com",[49,50]],["eurogamer.cz",[49,50]],["eurogamer.es",[49,50]],["eurogamer.net",[49,50]],["eurogamer.nl",[49,50]],["eurogamer.pl",[49,50]],["eurogamer.pt",[49,50]],["gamesindustry.biz",[49,50]],["jelly.deals",[49,50]],["reedpop.com",[49,50]],["rockpapershotgun.com",[49,50]],["thepopverse.com",[49,50]],["vg247.com",[49,50]],["videogameschronicle.com",[49,50]],["eurogamer.de",51],["roadtovr.com",52],["mundodeportivo.com",[53,119]],["m.youtube.com",54],["www.youtube.com",54],["ohra.nl",55],["corriere.it",56],["gazzetta.it",56],["oggi.it",56],["cmp.sky.it",57],["tennisassa.fi",58],["formula1.com",59],["f1racing.pl",60],["music.amazon.*",[61,62]],["consent-pref.trustarc.com",63],["highlights.legaseriea.it",64],["calciomercato.com",64],["sosfanta.com",65],["chrono24.*",[66,67]],["wetter.com",68],["youmath.it",69],["pip.gov.pl",70],["bnn.de",72],["dosenbach.ch",72],["dw.com",72],["kinepolis.*",72],["winfuture.de",72],["lippu.fi",72],["racingnews365.com",72],["reifendirekt.ch",72],["vaillant.*",72],["bauhaus.no",73],["beko-group.de",73],["billiger.de",73],["vanharen.nl",73],["deichmann.com",[73,95,392]],["meraluna.de",73],["slashdot.org",73],["hermann-saunierduval.it",73],["protherm.cz",73],["saunierduval.es",73],["protherm.sk",73],["protherm.ua",73],["saunierduval.hu",73],["saunierduval.ro",73],["saunierduval.at",73],["awb.nl",73],["spar.hu",74],["group.vattenfall.com",74],["mediaset.it",75],["fortune.com",76],["ilrestodelcarlino.it",77],["quotidiano.net",77],["lanazione.it",77],["ilgiorno.it",77],["iltelegrafolivorno.it",77],["auto.it",78],["beauxarts.com",78],["beinsports.com",78],["bfmtv.com",78],["boursobank.com",78],["boursorama.com",78],["boursier.com",78],["brut.media",78],["canalplus.com",78],["diverto.tv",78],["eden-park.com",78],["frandroid.com",78],["jobijoba.*",78],["hotelsbarriere.com",78],["intersport.*",[78,175]],["idealista.it",78],["o2.fr",78],["lejdd.fr",[78,119]],["la-croix.com",78],["linfo.re",78],["lamontagne.fr",78],["lesnumeriques.com",78],["maville.com",78],["midilibre.fr",78],["meteofrance.com",78],["mondialtissus.fr",78],["orange.fr",78],["oscaro.com",78],["ouest-france.fr",78],["parismatch.com",78],["programme-television.org",78],["publicsenat.fr",78],["rmcbfmplay.com",78],["science-et-vie.com",[78,119]],["seloger.com",78],["suzuki.fr",78],["sudouest.fr",78],["nutri-plus.de",79],["aa.com",80],["americanairlines.*",80],["consent.capital.fr",81],["consent.voici.fr",81],["programme-tv.net",81],["cmp.e24.no",[82,83]],["cmp.vg.no",[82,83]],["huffingtonpost.fr",84],["rainews.it",86],["remarkable.com",87],["netzwelt.de",88],["money.it",89],["allocine.fr",91],["jeuxvideo.com",91],["ozap.com",91],["le10sport.com",91],["cmp-sp.tagesspiegel.de",92],["cmp.bz-berlin.de",92],["cmp.cicero.de",92],["cmp.techbook.de",92],["cmp.stylebook.de",92],["cmp2.bild.de",92],["sourcepoint.wetter.de",92],["consent.finanzen.at",92],["consent.up.welt.de",92],["sourcepoint.n-tv.de",92],["sourcepoint.kochbar.de",92],["sourcepoint.rtl.de",92],["cmp.computerbild.de",92],["cmp.petbook.de",92],["cmp-sp.siegener-zeitung.de",92],["cmp-sp.sportbuzzer.de",92],["klarmobil.de",92],["technikum-wien.at",93],["eneco.nl",94],["blackpoolgazette.co.uk",96],["lep.co.uk",96],["northamptonchron.co.uk",96],["scotsman.com",96],["shieldsgazette.com",96],["thestar.co.uk",96],["portsmouth.co.uk",96],["sunderlandecho.com",96],["northernirelandworld.com",96],["3addedminutes.com",96],["anguscountyworld.co.uk",96],["banburyguardian.co.uk",96],["bedfordtoday.co.uk",96],["biggleswadetoday.co.uk",96],["bucksherald.co.uk",96],["burnleyexpress.net",96],["buxtonadvertiser.co.uk",96],["chad.co.uk",96],["daventryexpress.co.uk",96],["derbyshiretimes.co.uk",96],["derbyworld.co.uk",96],["derryjournal.com",96],["dewsburyreporter.co.uk",96],["doncasterfreepress.co.uk",96],["falkirkherald.co.uk",96],["fifetoday.co.uk",96],["glasgowworld.com",96],["halifaxcourier.co.uk",96],["harboroughmail.co.uk",96],["harrogateadvertiser.co.uk",96],["hartlepoolmail.co.uk",96],["hemeltoday.co.uk",96],["hucknalldispatch.co.uk",96],["lancasterguardian.co.uk",96],["leightonbuzzardonline.co.uk",96],["lincolnshireworld.com",96],["liverpoolworld.uk",96],["londonworld.com",96],["lutontoday.co.uk",96],["manchesterworld.uk",96],["meltontimes.co.uk",96],["miltonkeynes.co.uk",96],["newcastleworld.com",96],["newryreporter.com",96],["newsletter.co.uk",96],["northantstelegraph.co.uk",96],["northumberlandgazette.co.uk",96],["nottinghamworld.com",96],["peterboroughtoday.co.uk",96],["rotherhamadvertiser.co.uk",96],["stornowaygazette.co.uk",96],["surreyworld.co.uk",96],["thescarboroughnews.co.uk",96],["thesouthernreporter.co.uk",96],["totallysnookered.com",96],["wakefieldexpress.co.uk",96],["walesworld.com",96],["warwickshireworld.com",96],["wigantoday.net",96],["worksopguardian.co.uk",96],["yorkshireeveningpost.co.uk",96],["yorkshirepost.co.uk",96],["eurocard.com",97],["saseurobonusmastercard.se",98],["tver.jp",100],["linkedin.com",101],["elmundo.es",102],["srf.ch",103],["alternate.de",103],["bayer04.de",103],["douglas.de",103],["falke.com",103],["flaschenpost.de",103],["gloeckle.de",103],["hornbach.nl",103],["postbank.de",103],["immowelt.de",104],["joyn.*",104],["morenutrition.de",104],["mapillary.com",105],["cmp.seznam.cz",107],["marca.com",108],["raiplay.it",109],["derstandard.at",110],["derstandard.de",110],["faz.net",110],["ansa.it",111],["delladio.it",111],["huffingtonpost.it",111],["lastampa.it",111],["movieplayer.it",111],["multiplayer.it",111],["repubblica.it",111],["tomshw.it",111],["tuttoandroid.net",111],["tuttotech.net",111],["ilgazzettino.it",112],["ilmessaggero.it",112],["ilsecoloxix.it",112],["privacy.motorradonline.de",113],["consent.watson.de",113],["consent.kino.de",113],["dailystar.co.uk",[114,115,116,117]],["mirror.co.uk",[114,115,116,117]],["idnes.cz",118],["20minutes.fr",119],["20minutos.es",119],["24sata.hr",119],["abc.es",119],["actu.fr",119],["antena3.com",119],["antena3internacional.com",119],["atresmedia.com",119],["atresmediapublicidad.com",119],["atresmediastudios.com",119],["atresplayer.com",119],["autopista.es",119],["belfasttelegraph.co.uk",119],["bt.se",119],["bonduelle.it",119],["bonniernews.se",119],["caracol.com.co",119],["ciclismoafondo.es",119],["cnews.fr",119],["cope.es",119],["correryfitness.com",119],["courrier-picard.fr",119],["decathlon.nl",119],["decathlon.pl",119],["di.se",119],["diariocordoba.com",119],["diepresse.com",119],["dn.se",119],["dnevnik.hr",119],["dumpert.nl",119],["ebuyclub.com",119],["edreams.de",119],["edreams.net",119],["elcomercio.es",119],["elconfidencial.com",119],["eldesmarque.com",119],["elespanol.com",119],["elpais.com",119],["elpais.es",119],["engadget.com",119],["euronews.com",119],["europafm.com",119],["expressen.se",119],["filmstarts.de",119],["flooxernow.com",119],["folkbladet.nu",119],["france.tv",119],["france24.com",119],["francetvinfo.fr",119],["fussballtransfers.com",119],["fyndiq.se",119],["ghacks.net",119],["gva.be",119],["hbvl.be",119],["idealista.pt",119],["k.at",119],["krone.at",119],["kurier.at",119],["ladepeche.fr",119],["lalibre.be",119],["lanouvellerepublique.fr",119],["lasexta.com",119],["lasprovincias.es",119],["ledauphine.com",119],["leparisien.fr",119],["lesoir.be",119],["letelegramme.fr",119],["levoixdunord.fr",119],["xpress.fr",119],["libremercado.com",119],["lotoquebec.com",119],["lunion.fr",119],["okdiario.com",119],["marmiton.org",119],["marianne.cz",119],["melodia-fm.com",119],["moviepilot.de",119],["m6.fr",119],["metronieuws.nl",119],["multilife.com.pl",119],["naszemiasto.pl",119],["nicematin.com",119],["nieuwsblad.be",119],["numerama.com",119],["ondacero.es",119],["profil.at",119],["portail.lotoquebec.com",119],["radiofrance.fr",119],["rankia.com",119],["rfi.fr",119],["rossmann.pl",119],["rtbf.be",[119,192]],["rtl.lu",119],["sensacine.com",119],["sfgame.net",119],["shure.com",119],["silicon.es",119],["sncf-connect.com",119],["sport.es",119],["sydsvenskan.se",119],["techcrunch.com",119],["telegraaf.nl",119],["telequebec.tv",119],["trailrun.es",119],["video-streaming.orange.fr",119],["ryobitools.eu",[120,121]],["americanexpress.com",122],["consent.radiotimes.com",125],["sp-consent.szbz.de",126],["cmp.omni.se",127],["cmp.svd.se",127],["cmp.aftonbladet.se",127],["consent.economist.com",129],["studentagency.cz",129],["cmpv2.foundryco.com",130],["cmpv2.infoworld.com",130],["cmpv2.arnnet.com.au",130],["sp-cdn.pcgames.de",131],["sp-cdn.pcgameshardware.de",131],["consentv2.sport1.de",131],["cmpv2.tori.fi",132],["cdn.privacy-mgmt.co",133],["consent.spielaffe.de",134],["degiro.*",135],["vikingline.com",135],["tfl.gov.uk",135],["drklein.de",135],["1und1.de",136],["infranken.de",137],["cmp.bunte.de",138],["cmp.chip.de",138],["cmp.focus.de",[138,420]],["estadiodeportivo.com",139],["tameteo.*",139],["tempo.pt",139],["meteored.*",139],["pogoda.com",139],["yourweather.co.uk",139],["tempo.com",139],["tiempo.com",139],["ilmeteo.net",139],["daswetter.com",139],["kicker.de",140],["formulatv.com",141],["web.de",142],["lefigaro.fr",143],["linternaute.com",144],["consent.caminteresse.fr",145],["volksfreund.de",146],["dailypost.co.uk",147],["the-express.com",147],["tarife.mediamarkt.de",148],["gaggenau.com",148],["saturn.de",149],["eltiempo.es",[150,151]],["otempo.pt",152],["atlasformen.*",153],["cmp-sp.goettinger-tageblatt.de",154],["cmp-sp.saechsische.de",154],["cmp-sp.ln-online.de",154],["cz.de",154],["dewezet.de",154],["dnn.de",154],["haz.de",154],["gnz.de",154],["landeszeitung.de",154],["lvz.de",154],["maz-online.de",154],["ndz.de",154],["op-marburg.de",154],["ostsee-zeitung.de",154],["paz-online.de",154],["reisereporter.de",154],["rga.de",154],["rnd.de",154],["siegener-zeitung.de",154],["sn-online.de",154],["solinger-tageblatt.de",154],["sportbuzzer.de",154],["szlz.de",154],["tah.de",154],["torgauerzeitung.de",154],["waz-online.de",154],["privacy.maennersache.de",154],["sinergy.ch",156],["agglo-valais-central.ch",156],["biomedcentral.com",157],["hsbc.*",158],["hsbcnet.com",158],["hsbcinnovationbanking.com",158],["create.hsbc",158],["gbm.hsbc.com",158],["hsbc.co.uk",159],["internationalservices.hsbc.com",159],["history.hsbc.com",159],["about.hsbc.co.uk",160],["privatebanking.hsbc.com",161],["independent.co.uk",164],["privacy.crash.net",164],["the-independent.com",165],["argos.co.uk",166],["poco.de",[167,168]],["moebelix.*",167],["moemax.*",167],["xxxlutz.*",167],["xxxlesnina.*",167],["moebel24.ch",168],["meubles.fr",168],["meubelo.nl",168],["moebel.de",168],["lipo.ch",169],["schubiger.ch",170],["aedt.de",171],["berlin-live.de",171],["gutefrage.net",171],["insideparadeplatz.ch",171],["morgenpost.de",171],["play3.de",171],["thueringen24.de",171],["pdfupload.io",172],["gamestar.de",[173,197]],["gamepro.de",173],["verksamt.se",174],["acmemarkets.com",175],["amtrak.com",175],["beko.com",175],["bepanthen.com.au",175],["berocca.com.au",175],["booking.com",175],["centrum.sk",175],["claratyne.com.au",175],["credit-suisse.com",175],["ceskatelevize.cz",175],["de.vanguard",175],["dhl.de",175],["fello.se",175],["flashscore.fr",175],["fnac.es",175],["foodandwine.com",175],["khanacademy.org",175],["konami.com",175],["jll.*",175],["groceries.asda.com",175],["n26.com",175],["nintendo.com",175],["panasonic.com",175],["pluto.tv",175],["ricardo.ch",175],["rockstargames.com",175],["rte.ie",175],["salesforce.com",175],["samsonite.*",175],["spirit.com",175],["stenaline.co.uk",175],["swisscom.ch",175],["swisspass.ch",175],["telenet.be",175],["toujeo.com",175],["questdiagnostics.com",175],["wallapop.com",175],["vattenfall.de",175],["yoigo.com",175],["hallmarkchannel.com",176],["noovle.com",176],["otter.ai",176],["telsy.com",176],["timenterprise.it",176],["tim.it",176],["fnac.*",176],["yeti.com",176],["here.com",177],["vodafone.com",177],["cmp.heise.de",179],["cmp.am-online.com",179],["consent.newsnow.co.uk",179],["zara.com",180],["lepermislibre.fr",180],["negociardivida.spcbrasil.org.br",181],["adidas.*",182],["privacy.topreality.sk",183],["privacy.autobazar.eu",183],["vu.lt",184],["adnkronos.com",[185,186]],["cornwalllive.com",[185,186]],["cyprus-mail.com",[185,186]],["informazione.it",[185,186]],["mymovies.it",[185,186]],["tuttoeuropei.com",[185,186]],["video.lacnews24.it",[185,186]],["taxscouts.com",187],["online.no",189],["telenor.no",189],["austrian.com",190],["lufthansa.com",190],["hornetsecurity.com",191],["kayzen.io",191],["wasserkunst-hamburg.de",191],["bnc.ca",192],["egora.fr",192],["festo.com",192],["standaard.be",192],["engelvoelkers.com",192],["francemediasmonde.com",192],["francebleu.fr",192],["knipex.de",192],["giphy.com",192],["idealista.com",192],["information.tv5monde.com",192],["laprovence.com",192],["latribune.fr",192],["lemondeinformatique.fr",192],["mappy.com",192],["marianne.net",192],["orf.at",192],["ing.es",192],["taxfix.de",192],["tf1.fr",192],["rtl.be",192],["researchgate.net",192],["europe1.fr",193],["bruendl.at",194],["latamairlines.com",195],["elisa.ee",196],["baseendpoint.brigitte.de",197],["baseendpoint.gala.de",197],["baseendpoint.haeuser.de",197],["baseendpoint.stern.de",197],["baseendpoint.urbia.de",197],["cmp.tag24.de",197],["cmpv2.berliner-zeitung.de",197],["golem.de",197],["consent.t-online.de",197],["cmp-sp.handelsblatt.com",197],["sp-consent.stuttgarter-nachrichten.de",198],["regjeringen.no",199],["sp-manager-magazin-de.manager-magazin.de",200],["consent.11freunde.de",200],["centrum24.pl",204],["replay.lsm.lv",205],["ltv.lsm.lv",205],["bernistaba.lsm.lv",205],["stadt-wien.at",206],["verl.de",206],["cubo-sauna.de",206],["mobile.de",207],["cookist.it",208],["fanpage.it",208],["geopop.it",208],["lexplain.it",208],["royalmail.com",209],["gmx.net",210],["gmx.ch",211],["mojehobby.pl",212],["super-hobby.*",212],["sp.stylevamp.de",213],["cmp.wetteronline.de",213],["audi.*",214],["easyjet.com",214],["experian.co.uk",214],["postoffice.co.uk",214],["tescobank.com",214],["internetaptieka.lv",[215,216]],["wells.pt",217],["dskdirect.bg",218],["cmpv2.dba.dk",219],["spcmp.crosswordsolver.com",220],["thomann.de",221],["landkreis-kronach.de",222],["northcoast.com",223],["chaingpt.org",223],["bandenconcurrent.nl",224],["bandenexpert.be",224],["reserved.com",225],["metro.it",226],["makro.es",226],["metro.sk",226],["metro-cc.hr",226],["makro.nl",226],["metro.bg",226],["metro.at",226],["metro-tr.com",226],["metro.de",226],["metro.fr",226],["makro.cz",226],["metro.ro",226],["makro.pt",226],["makro.pl",226],["sklepy-odido.pl",226],["rastreator.com",226],["metro.ua",227],["metro.rs",227],["metro-kz.com",227],["metro.md",227],["metro.hu",227],["metro-cc.ru",227],["metro.pk",227],["balay.es",228],["constructa.com",228],["dafy-moto.com",229],["akku-shop.nl",230],["akkushop-austria.at",230],["akkushop-b2b.de",230],["akkushop.de",230],["akkushop.dk",230],["batterie-boutique.fr",230],["akkushop-schweiz.ch",231],["evzuttya.com.ua",232],["eobuv.cz",232],["eobuwie.com.pl",232],["ecipele.hr",232],["eavalyne.lt",232],["efootwear.eu",232],["eschuhe.ch",232],["eskor.se",232],["chaussures.fr",232],["ecipo.hu",232],["eobuv.com.ua",232],["eobuv.sk",232],["epantofi.ro",232],["epapoutsia.gr",232],["escarpe.it",232],["eschuhe.de",232],["obuvki.bg",232],["zapatos.es",232],["swedbank.ee",233],["mudanzavila.es",234],["bienmanger.com",235],["gesipa.*",236],["gesipausa.com",236],["beckhoff.com",236],["zitekick.dk",237],["eltechno.dk",237],["okazik.pl",237],["batteryempire.*",238],["maxi.rs",239],["garmin.com",240],["invisalign.*",240],["one4all.ie",240],["wideroe.no",241],["bmw.*",242],["kijk.nl",243],["nordania.dk",244],["danskebank.*",244],["danskeci.com",244],["danicapension.dk",244],["dehn.*",245],["gewerbegebiete.de",246],["cordia.fr",247],["vola.fr",248],["lafi.fr",249],["skyscanner.*",250],["coolblue.*",251],["sanareva.*",252],["atida.fr",252],["bbva.*",253],["bbvauk.com",253],["expertise.unimi.it",254],["altenberg.de",255],["vestel.es",256],["tsb.co.uk",257],["buienradar.nl",[258,259]],["linsenplatz.de",260],["budni.de",261],["erstecardclub.hr",261],["teufel.de",[262,263]],["abp.nl",264],["simplea.sk",265],["flip.bg",266],["kiertokanki.com",267],["leirovins.be",269],["vias.be",270],["virbac.com",271],["diners.hr",271],["squarehabitat.fr",271],["arbitrobancariofinanziario.it",272],["smit-sport.de",273],["go-e.com",274],["malerblatt-medienservice.de",275],["architekturbuch.de",275],["medienservice-holz.de",275],["leuchtstark.de",275],["casius.nl",276],["coolinarika.com",277],["vakgaragevannunen.nl",277],["fortuluz.es",277],["finna.fi",277],["eurogrow.es",277],["vakgaragevandertholen.nl",277],["envafors.dk",278],["dabbolig.dk",[279,280]],["daruk-emelok.hu",281],["exakta.se",282],["larca.de",283],["roli.com",284],["okazii.ro",285],["tgvinoui.sncf",286],["l-bank.de",287],["interhyp.de",288],["indigoneo.*",289],["transparency.meta.com",290],["safran-group.com",291],["sr-ramenendeuren.be",291],["strato.*",292],["strato-hosting.co.uk",292],["auto.de",293],["contentkingapp.com",294],["otterbox.com",295],["stoertebeker-brauquartier.com",296],["stoertebeker.com",296],["stoertebeker-eph.com",296],["aparts.pl",297],["sinsay.com",[298,299]],["benu.cz",300],["stockholmresilience.org",301],["ludvika.se",301],["kammarkollegiet.se",301],["cazenovecapital.com",302],["statestreet.com",303],["beopen.lv",304],["cesukoncertzale.lv",305],["dodo.fr",306],["pepper.it",307],["pepper.pl",307],["preisjaeger.at",307],["mydealz.de",307],["dealabs.com",307],["hotukdeals.com",307],["chollometro.com",307],["makelaarsland.nl",308],["bricklink.com",309],["bestinver.es",310],["icvs2023.conf.tuwien.ac.at",311],["racshop.co.uk",[312,313]],["baabuk.com",314],["sapien.io",314],["app.lepermislibre.fr",315],["multioferta.es",316],["testwise.com",[317,318]],["tonyschocolonely.com",319],["fitplus.is",319],["fransdegrebber.nl",319],["lilliputpress.ie",319],["lexibo.com",319],["marin-milou.com",319],["dare2tri.com",319],["t3micro.*",319],["la-vie-naturelle.com",[320,321]],["inovelli.com",322],["uonetplus.vulcan.net.pl",[323,324]],["consent.helagotland.se",325],["oper.koeln",[326,327]],["deezer.com",328],["hoteldesartssaigon.com",329],["groupeonepoint.com",330],["geneanet.org",330],["clickskeks.at",331],["abt-sportsline.de",331],["nerdstar.de",332],["prace.cz",332],["profesia.sk",332],["profesia.cz",332],["pracezarohem.cz",332],["atmoskop.cz",332],["seduo.sk",332],["seduo.cz",332],["teamio.com",332],["arnold-robot.com",332],["cvonline.lt",332],["cv.lv",332],["cv.ee",332],["dirbam.lt",332],["visidarbi.lv",332],["otsintood.ee",332],["pamiatki.pl",333],["initse.com",334],["salvagny.org",335],["taxinstitute.ie",336],["get-in-it.de",337],["tempcover.com",[338,339]],["guildford.gov.uk",340],["easyparts.*",[341,342]],["easyparts-recambios.es",[341,342]],["easyparts-rollerteile.de",[341,342]],["drimsim.com",343],["canyon.com",[344,345]],["vevovo.be",[346,347]],["vendezvotrevoiture.be",[346,347]],["wirkaufendeinauto.at",[346,347]],["vikoberallebiler.dk",[346,347]],["wijkopenautos.nl",[346,347]],["vikoperdinbil.se",[346,347]],["noicompriamoauto.it",[346,347]],["vendezvotrevoiture.fr",[346,347]],["compramostucoche.es",[346,347]],["wijkopenautos.be",[346,347]],["auto-doc.*",348],["autodoc.*",348],["autodoc24.*",348],["topautoosat.fi",348],["autoteiledirekt.de",348],["autoczescionline24.pl",348],["tuttoautoricambi.it",348],["onlinecarparts.co.uk",348],["autoalkatreszek24.hu",348],["autodielyonline24.sk",348],["reservdelar24.se",348],["pecasauto24.pt",348],["reservedeler24.co.no",348],["piecesauto24.lu",348],["rezervesdalas24.lv",348],["besteonderdelen.nl",348],["recambioscoche.es",348],["antallaktikaexartimata.gr",348],["piecesauto.fr",348],["teile-direkt.ch",348],["lpi.org",349],["refurbed.*",350],["flyingtiger.com",351],["borgomontecedrone.it",351],["recaro-shop.com",351],["gera.de",352],["mfr-chessy.fr",353],["mfr-lamure.fr",353],["mfr-saint-romain.fr",353],["mfr-lapalma.fr",353],["mfrvilliemorgon.asso.fr",353],["mfr-charentay.fr",353],["mfr.fr",353],["nationaltrust.org.uk",354],["hej-natural.*",355],["ib-hansmeier.de",356],["rsag.de",357],["esaa-eu.org",357],["answear.*",358],["theprotocol.it",[359,360]],["lightandland.co.uk",361],["etransport.pl",362],["wohnen-im-alter.de",363],["johnmuirhealth.com",[364,365]],["markushaenni.com",366],["airbaltic.com",367],["gamersgate.com",367],["zorgzaam010.nl",368],["paruvendu.fr",369],["cmpv2.bistro.sk",371],["privacy.bazar.sk",371],["hennamorena.com",372],["newsello.pl",373],["porp.pl",374],["golfbreaks.com",375],["lieferando.de",376],["just-eat.*",376],["justeat.*",376],["pyszne.pl",376],["lieferando.at",376],["takeaway.com",376],["thuisbezorgd.nl",376],["holidayhypermarket.co.uk",377],["atu.de",378],["atu-flottenloesungen.de",378],["but.fr",378],["fortuneo.fr",378],["maif.fr",378],["sparkasse.at",378],["dpdgroup.com",379],["dpd.fr",379],["dpd.com",379],["cosmosdirekt.de",379],["bstrongoutlet.pt",380],["nobbot.com",381],["isarradweg.de",[382,383]],["finlayson.fi",[384,385]],["cowaymega.ca",[384,385]],["arktis.de",386],["desktronic.de",386],["belleek.com",386],["brauzz.com",386],["cowaymega.com",386],["dockin.de",386],["dryrobe.com",386],["formswim.com",386],["hairtalk.se",386],["hallmark.co.uk",386],["loopearplugs.com",386],["peopleofshibuya.com",386],["pullup-dip.com",386],["sanctum.shop",386],["tartanblanketco.com",386],["beam.co.uk",[387,388]],["malaikaraiss.com",389],["wefashion.com",390],["merkur.dk",391],["ionos.*",393],["omegawatches.com",394],["carefully.be",395],["aerotime.aero",395],["rocket-league.com",396],["dws.com",397],["bosch-homecomfort.com",398],["elmleblanc-optibox.fr",398],["monservicechauffage.fr",398],["boschrexroth.com",398],["home-connect.com",399],["lowrider.at",[400,401]],["mesto.de",402],["veiligverkeer.be",403],["vsv.be",403],["dehogerielen.be",403],["intersport.gr",404],["intersport.bg",404],["intersport.com.cy",404],["intersport.ro",404],["ticsante.com",405],["techopital.com",405],["millenniumprize.org",406],["hepster.com",407],["ellisphere.fr",408],["peterstaler.de",409],["blackforest-still.de",409],["tiendaplayaundi.com",410],["ajtix.co.uk",411],["raja.fr",412],["rajarani.de",412],["rajapack.*",[412,413]],["avery-zweckform.com",414],["1xinternet.de",414],["futterhaus.de",414],["dasfutterhaus.at",414],["frischeparadies.de",414],["fmk-steuer.de",414],["selgros.de",414],["mediapart.fr",415],["athlon.com",416],["alumniportal-deutschland.org",417],["snoopmedia.com",417],["myguide.de",417],["study-in-germany.de",417],["daad.de",417],["cornelsen.de",[418,419]],["vinmonopolet.no",421],["tvp.info",422],["tvp.pl",422],["tvpworld.com",422],["brtvp.pl",422],["tvpparlament.pl",422],["belsat.eu",422],["warnung.bund.de",423],["mediathek.lfv-bayern.de",424],["allegro.*",425],["allegrolokalnie.pl",425],["czc.cz",425],["eon.pl",[426,427]],["ylasatakunta.fi",[428,429]],["mega-image.ro",430],["louisvuitton.com",431],["bodensee-airport.eu",432],["department56.com",433],["allendesignsstudio.com",433],["designsbylolita.co",433],["shop.enesco.com",433],["savoriurbane.com",434],["miumiu.com",435],["church-footwear.com",435],["clickdoc.fr",436],["car-interface.com",437],["monolithdesign.it",437],["smileypack.de",[438,439]],["malijunaki.si",440],["finom.co",441],["orange.es",[442,443]],["skousen.no",444],["energinet.dk",444],["medimax.de",445],["lotto.it",446],["readspeaker.com",446],["ibistallinncenter.ee",447],["aaron.ai",448],["thebathcollection.com",449],["coastfashion.com",[450,451]],["oasisfashion.com",[450,451]],["warehousefashion.com",[450,451]],["misspap.com",[450,451]],["karenmillen.com",[450,451]],["boohooman.com",[450,451]],["hdt.de",452],["wolt.com",453],["myprivacy.dpgmedia.nl",454],["myprivacy.dpgmedia.be",454],["www.dpgmediagroup.com",454],["tnt.com",455],["uza.be",456],["uzafoundation.be",456],["uzajobs.be",456],["bergzeit.*",[457,458]],["cinemas-lumiere.com",459],["cdiscount.com",460],["brabus.com",461],["roborock.com",462],["strumentimusicali.net",463],["maisonmargiela.com",464],["webfleet.com",465],["dragonflyshipping.ca",466],["broekhuis.nl",467],["nemck.cz",468],["bokio.se",469],["sap-press.com",470],["roughguides.com",[471,472]],["rexbo.*",473],["topannonces.fr",474],["homap.fr",475],["artifica.fr",476],["plan-interactif.com",476],["ville-cesson.fr",476],["moismoliere.com",477],["unihomes.co.uk",478],["bkk.hu",479],["coiffhair.com",480],["ptc.eu",481],["ziegert-group.com",482],["toureiffel.paris",483],["livoo.fr",483],["interieur.gouv.fr",483],["su.se",483],["smdv.de",484],["digitalo.de",484],["petiteamelie.*",485],["mojanorwegia.pl",486],["koempf24.ch",[487,488]],["teichitekten24.de",[487,488]],["koempf24.de",[487,488]],["wolff-finnhaus-shop.de",[487,488]],["asnbank.nl",489],["blgwonen.nl",489],["regiobank.nl",489],["snsbank.nl",489],["vulcan.net.pl",[490,491]],["ogresnovads.lv",492],["partenamut.be",493],["pirelli.com",494],["unicredit.it",495],["effector.pl",496],["zikodermo.pl",[497,498]],["wassererleben.ch",499],["devolksbank.nl",500],["vejdirektoratet.dk",502],["usaa.com",503],["consorsbank.de",504],["metroag.de",505],["kupbilecik.pl",506],["oxfordeconomics.com",507],["oxfordeconomics.com.au",[508,509]],["ceneo.pl",510],["routershop.nl",511],["druni.es",512],["druni.pt",512],["e-jumbo.gr",513],["alza.cz",514],["rmf.fm",516],["rmf24.pl",516],["tracfone.com",517],["lequipe.fr",518],["gala.fr",519],["purepeople.com",520],["3sat.de",521],["zdf.de",521],["filmfund.lu",522],["rai.it",523],["fbto.nl",524],["studentagency.sk",525],["studentagency.eu",525],["nsinternational.com",526],["laposte.fr",527],["meinbildkalender.de",528],["gls-group.com",529],["chilis.com",530],["swiss-sport.tv",531],["consent.thetimes.com",532],["cadenaser.com",533],["offistore.fi",534],["technomarket.bg",535]]);
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
