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
const argsList = [["button#W0wltc","","500"],["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","800"],["button[title=\"REJECT ALL\"]","","1200"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button#CybotCookiebotDialogBodyButtonDecline"],["#pubtech-cmp button[aria-label=\"Continue without accepting\"]"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button[data-t=\"rejectAll\"]","","1000"],["#gdpr-banner-cmp-button","","1000"],["button[aria-label=\"Datenschutzbestimmungen und Einstellungen ablehnen\"]","","1200"],["div[data-project=\"mol-fe-cmp\"] button[class*=\"consent\"]:not([class*=\"reject\"])"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button.glue-cookie-notification-bar__reject","","1000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","1000"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button.cookie-decline-all","","1800"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[action-name=\"agreeAll\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","2000"],["button.iubenda-cs-close-btn"],["button[title=\"Aceitar todos\"]","","1000"],["button.cta-button[title=\"Tümünü reddet\"]"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["div.decline","","1000"],["button#declineAllConsentSummary","","1500"],["button.deny-btn","","1000"],["span#idxrcookiesKO","","1000"],["button[data-action=\"cookie-consent#onToggleShowManager\"]","","900"],["button[data-action=\"cookie-consent#onSaveSetting\"]","","1200"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","1500"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["#qc-cmp2-container button#accept-btn"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1500"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1500"],["button[title=\"Zustimmen\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[title=\"Alle ablehnen\"]","","1800"],["button.pixelmate-general-deny","","1000"],["a.mmcm-btn-decline","","1000"],["button.hi-cookie-btn-accept-necessary","","1000"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-e2e=\"pure-accept-ads\"]","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button[title=\"Schließen & Akzeptieren\"]","","1000"],["button.js-alert-cookie-reject","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["button#ensSave","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],[".modal-actions-accept-btn","","2000"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1500"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button[id=\"ketch-banner-button-secondary\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["button.cmplz-deny","","1000"],["button[aria-label=\"Reject all\"]","","1000"],["button[title=\"Agree\"]","","1000"],["button[title=\"Aceptar y continuar\"]","","1000"],["button[title=\"Accettare e continuare\"]","","1000"],["button[title=\"Concordar\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button.si-cookie-notice__button--reject","","1000"],["button.cookieselection-confirm-necessary","","2500"],["button[value=\"essential\"]","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1600"],["button[data-testing=\"cookie-bar-deny-all\"]","","1000"],["button.shared-elements-cookies-popup__modify-button","","1100"],["button.shared-cookies-modal__current-button","","1300"],["button#cookie-custom","","1200"],["button#cookie-save","","1800"],["div.rejectLink___zHIdj","","1000"],[".cmp-root-container >>> .cmp-button-accept-all","","1000"],["a[data-mrf-role=\"userPayToReject\"]","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button.primary","","1000"],["a[onclick=\"denyCookiePolicyAndSetHash();\"]","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#btn-accept-required-banner","","1000"],["button.js-cookies-panel-reject-all","","1000"],["button.acbut.continue","","1000"],["button#btnAcceptPDPA","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button.swal2-cancel","","1000"],["button[data-component-name=\"reject\"]","","1000"],["button.fides-reject-all-button","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["div[aria-label=\"Only allow essential cookies\"]","","1000"],["button[title=\"Agree & Continue\"]","","1800"],["button[title=\"Reject All\"]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","2800"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["button[data-test-id=\"decline-button\"]","","2400"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button[data-testid=\"cmp-revoke-all\"]","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","2500"],["button[onclick*=\"(()=>{ CassieWidgetLoader.Widget.rejectAll\"]","","1000"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],[".wt-ecl-button[href=\"#refuse\"]","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],["button#acceptCookiesTerms","","1000"],["a.footer-cookies-button-save-all","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.gdpr-accept-all-btn","","1000"],["span[data-ga-action=\"disallow_all_cookies\"]","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button.btn-secondary","","1800"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["input#popup_ok","","1000"],["button[data-test=\"terms-accept-button\"]","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["body > div[class] > div[class] > div[class]:has(a[href*=\"holding.wp.pl\"]) > div[class] > div[class]:only-child > button:first-child"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"],["#cmpwrapper >>> a.cust-btn[onclick*=\"__cmp('setConsent'","1)\"]","","1500"],["button.cta-size-big.cta-outline"],["pie-cookie-banner >>> [data-test-id=\"actions-manage-prefs\"], pie-cookie-banner >>> #functional >>> .c-switch-input, pie-cookie-banner >>> pie-modal >>> pie-button >>> button[type=\"submit\"]","","1000"],["[data-form=\".eprivacy_optin_decline\"]","","1000"],["#cookie-consent-button","","1500"],["com-consent-layer >>> #cmpDenyAll","","2500"],["div[data-project=\"mol-fe-cmp\"] button[class*=\"level1PrimaryButton-\"]:not([class*=\"reject\"])"],["div#continueWithoutAccepting","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"]];
const hostnamesMap = new Map([["www.google.*",0],["consent.google.*",1],["consent.youtube.com",[1,2]],["facebook.com",3],["instagram.com",4],["sourcepointcmp.bloomberg.com",[5,6,7]],["sourcepointcmp.bloomberg.co.jp",[5,6,7]],["giga.de",7],["heise.de",7],["theguardian.com",7],["bloomberg.com",[8,9]],["forbes.com",[8,80]],["consent.fastcar.co.uk",8],["tapmaster.ca",8],["cmpv2.standard.co.uk",[10,11]],["cmpv2.independent.co.uk",[12,13,14,187]],["wetransfer.com",[15,16]],["spiegel.de",[17,18]],["nytimes.com",[19,183]],["consent.yahoo.com",20],["tumblr.com",21],["fplstatistics.co.uk",22],["fplstatistics.com",22],["e-shop.leonidas.com",23],["cdn.privacy-mgmt.com",[24,25,43,52,53,54,55,100,102,110,117,124,125,126,137,138,139,142,144,145,147,158,176,201,222,235,236,239,240,241,242,262,312,475,597,618,656,676]],["walmart.ca",26],["sams.com.mx",27],["my.tonies.com",28],["cambio-carsharing.de",28],["festool.*",28],["festoolcanada.com",28],["fuso-trucks.*",28],["tracker.fressnapf.de",28],["myfabrics.co.uk",28],["zinus.*",28],["consent.ladbible.com",[29,30]],["consent.unilad.com",[29,30]],["consent.uniladtech.com",[29,30]],["consent.gamingbible.com",[29,30]],["consent.sportbible.com",[29,30]],["consent.tyla.com",[29,30]],["consent.ladbiblegroup.com",[29,30]],["m2o.it",31],["deejay.it",31],["capital.it",31],["ilmattino.it",[31,32]],["leggo.it",[31,32]],["libero.it",31],["tiscali.it",31],["consent-manager.ft.com",[33,34,35]],["hertz.*",36],["mediaworld.it",37],["mediamarkt.*",37],["mediamarktsaturn.com",38],["uber.com",[39,184]],["ubereats.com",[39,184]],["lego.com",40],["ai.meta.com",41],["lilly.com",42],["ilgiornale.it",44],["dimensione.com",45],["wero-wallet.eu",45],["everyeye.it",46],["pepper.pl",47],["dealabs.com",47],["hotukdeals.com",47],["chollometro.com",47],["preisjaeger.at",48],["mydealz.de",48],["kleinanzeigen.de",[49,50]],["dailymail.co.uk",51],["telekom.com",56],["telekom.de",56],["abola.pt",57],["flytap.com",57],["ansons.de",57],["blick.ch",57],["buienradar.be",57],["crunchyroll.com",57],["digi24.ro",57],["digisport.ro",57],["digitalfoundry.net",57],["egx.net",57],["emirates.com",57],["eurogamer.it",57],["foto-erhardt.de",57],["gmx.*",57],["kizi.com",57],["mail.com",57],["mcmcomiccon.com",57],["nachrichten.at",57],["nintendolife.com",57],["oe24.at",57],["observatornews.ro",57],["paxsite.com",57],["peacocktv.com",57],["player.pl",57],["plus500.*",57],["pricerunner.com",57],["pricerunner.se",57],["pricerunner.dk",57],["proximus.be",[57,651]],["proximus.com",57],["purexbox.com",57],["pushsquare.com",57],["rugbypass.com",57],["southparkstudios.com",57],["southwest.com",57],["starwarscelebration.com",57],["sweatybetty.com",57],["theaa.ie",57],["thehaul.com",57],["timeextension.com",57],["travelandleisure.com",57],["tunein.com",57],["tvn24.pl",57],["uefa.com",57],["videoland.com",57],["wizzair.com",57],["wetter.at",57],["wowbiz.ro",57],["dicebreaker.com",[58,59]],["eurogamer.es",[58,59]],["eurogamer.net",[58,59]],["eurogamer.nl",[58,59]],["eurogamer.pl",[58,59]],["eurogamer.pt",[58,59]],["gamesindustry.biz",[58,59]],["reedpop.com",[58,59]],["rockpapershotgun.com",[58,59]],["thepopverse.com",[58,59]],["vg247.com",[58,59]],["videogameschronicle.com",[58,59]],["eurogamer.de",60],["roadtovr.com",61],["jotex.*",61],["mundodeportivo.com",[62,132]],["m.youtube.com",63],["www.youtube.com",63],["ohra.nl",64],["corriere.it",65],["gazzetta.it",65],["oggi.it",65],["cmp.sky.it",66],["tennisassa.fi",67],["formula1.com",68],["f1racing.pl",69],["music.amazon.*",[70,71]],["consent-pref.trustarc.com",72],["highlights.legaseriea.it",73],["calciomercato.com",73],["sosfanta.com",74],["chrono24.*",[75,76]],["wetter.com",77],["youmath.it",78],["pip.gov.pl",79],["dailybuzz.nl",81],["bnn.de",81],["dosenbach.ch",81],["dw.com",81],["kinepolis.*",81],["mediaite.com",81],["nzz.ch",81],["winfuture.de",81],["lippu.fi",81],["racingnews365.com",81],["reifendirekt.ch",81],["vaillant.*",81],["bauhaus.no",82],["bauhaus.se",82],["beko-group.de",82],["billiger.de",82],["burda.com",82],["vanharen.nl",82],["deichmann.com",[82,105,483]],["meraluna.de",82],["slashdot.org",82],["hermann-saunierduval.it",82],["protherm.cz",82],["saunierduval.es",82],["protherm.sk",82],["protherm.ua",82],["saunierduval.hu",82],["saunierduval.ro",82],["saunierduval.at",82],["awb.nl",82],["spar.hu",83],["group.vattenfall.com",83],["mediaset.it",84],["fortune.com",85],["ilrestodelcarlino.it",86],["quotidiano.net",86],["lanazione.it",86],["ilgiorno.it",86],["iltelegrafolivorno.it",86],["auto.it",87],["beauxarts.com",87],["beinsports.com",87],["bfmtv.com",[87,133]],["boursobank.com",87],["boursorama.com",[87,133]],["boursier.com",[87,229]],["brut.media",87],["canalplus.com",87],["decathlon.fr",[87,226]],["diverto.tv",87],["eden-park.com",87],["foodvisor.io",87],["franceinfo.fr",87],["frandroid.com",87],["jobijoba.*",87],["hotelsbarriere.com",87],["intersport.*",[87,198]],["idealista.it",87],["o2.fr",87],["lejdd.fr",[87,132]],["lechorepublicain.fr",87],["la-croix.com",87],["linfo.re",87],["lamontagne.fr",87],["laredoute.fr",87],["largus.fr",87],["leprogres.fr",87],["lesnumeriques.com",87],["libramemoria.com",87],["lopinion.fr",87],["marieclaire.fr",87],["maville.com",87],["michelin.*",87],["midilibre.fr",[87,680]],["meteofrance.com",87],["mondialtissus.fr",87],["orange.fr",87],["orpi.com",87],["oscaro.com",87],["ouest-france.fr",[87,101,133,681]],["parismatch.com",87],["pagesjaunes.fr",87],["programme-television.org",[87,133]],["publicsenat.fr",[87,133]],["rmcbfmplay.com",[87,133]],["science-et-vie.com",[87,132]],["seloger.com",87],["societe.com",87],["suzuki.fr",87],["sudouest.fr",87],["web-agri.fr",87],["nutri-plus.de",88],["americanairlines.*",89],["consent.capital.fr",90],["consent.programme.tv",90],["consent.voici.fr",90],["programme-tv.net",90],["cmpv2.finn.no",91],["cmp.tek.no",[92,93]],["cmp.e24.no",[92,93]],["minmote.no",[92,93]],["cmp.vg.no",[92,93]],["cloud.google.com",94],["developer.android.com",94],["registry.google",94],["safety.google",94],["huffingtonpost.fr",95],["rainews.it",96],["remarkable.com",97],["netzwelt.de",98],["money.it",99],["allocine.fr",101],["jeuxvideo.com",101],["ozap.com",101],["le10sport.com",101],["xataka.com",101],["cmp.fitbook.de",102],["cmp.autobild.de",102],["sourcepoint.sport.de",102],["cmp-sp.tagesspiegel.de",102],["cmp.bz-berlin.de",102],["cmp.cicero.de",102],["cmp.techbook.de",102],["cmp.stylebook.de",102],["cmp2.bild.de",102],["cmp2.freiepresse.de",102],["sourcepoint.wetter.de",102],["consent.finanzen.at",102],["consent.finanzen.net",102],["consent.up.welt.de",102],["sourcepoint.n-tv.de",102],["sourcepoint.kochbar.de",102],["sourcepoint.rtl.de",102],["cmp.computerbild.de",102],["cmp.petbook.de",102],["cmp-sp.siegener-zeitung.de",102],["cmp-sp.sportbuzzer.de",102],["klarmobil.de",102],["technikum-wien.at",103],["eneco.nl",104],["salomon.com",106],["blackpoolgazette.co.uk",107],["lep.co.uk",107],["northamptonchron.co.uk",107],["scotsman.com",107],["shieldsgazette.com",107],["thestar.co.uk",107],["portsmouth.co.uk",107],["sunderlandecho.com",107],["northernirelandworld.com",107],["3addedminutes.com",107],["anguscountyworld.co.uk",107],["banburyguardian.co.uk",107],["bedfordtoday.co.uk",107],["biggleswadetoday.co.uk",107],["bucksherald.co.uk",107],["burnleyexpress.net",107],["buxtonadvertiser.co.uk",107],["chad.co.uk",107],["daventryexpress.co.uk",107],["derbyshiretimes.co.uk",107],["derbyworld.co.uk",107],["derryjournal.com",107],["dewsburyreporter.co.uk",107],["doncasterfreepress.co.uk",107],["falkirkherald.co.uk",107],["fifetoday.co.uk",107],["glasgowworld.com",107],["halifaxcourier.co.uk",107],["harboroughmail.co.uk",107],["harrogateadvertiser.co.uk",107],["hartlepoolmail.co.uk",107],["hemeltoday.co.uk",107],["hucknalldispatch.co.uk",107],["lancasterguardian.co.uk",107],["leightonbuzzardonline.co.uk",107],["lincolnshireworld.com",107],["liverpoolworld.uk",107],["londonworld.com",107],["lutontoday.co.uk",107],["manchesterworld.uk",107],["meltontimes.co.uk",107],["miltonkeynes.co.uk",107],["newcastleworld.com",107],["newryreporter.com",107],["newsletter.co.uk",107],["northantstelegraph.co.uk",107],["northumberlandgazette.co.uk",107],["nottinghamworld.com",107],["peterboroughtoday.co.uk",107],["rotherhamadvertiser.co.uk",107],["stornowaygazette.co.uk",107],["surreyworld.co.uk",107],["thescarboroughnews.co.uk",107],["thesouthernreporter.co.uk",107],["totallysnookered.com",107],["wakefieldexpress.co.uk",107],["walesworld.com",107],["warwickshireworld.com",107],["wigantoday.net",107],["worksopguardian.co.uk",107],["yorkshireeveningpost.co.uk",107],["yorkshirepost.co.uk",107],["eurocard.com",108],["saseurobonusmastercard.se",109],["tver.jp",111],["linkedin.com",112],["elmundo.es",[113,133]],["expansion.com",113],["s-pankki.fi",114],["srf.ch",114],["alternate.de",114],["bayer04.de",114],["douglas.de",114],["dr-beckmann.com",114],["falke.com",114],["fitnessfirst.de",114],["flaschenpost.de",114],["gloeckle.de",114],["hornbach.nl",114],["hypofriend.de",114],["lactostop.de",114],["neumann.com",114],["post.ch",114],["postbank.de",114],["rts.ch",114],["zalando.*",114],["immowelt.de",115],["joyn.*",115],["morenutrition.de",115],["mapillary.com",116],["cmp.seznam.cz",118],["marca.com",119],["raiplay.it",120],["raiplaysound.it",120],["derstandard.at",121],["derstandard.de",121],["faz.net",121],["automoto.it",122],["ansa.it",122],["delladio.it",122],["huffingtonpost.it",122],["internazionale.it",122],["lastampa.it",122],["macitynet.it",122],["moto.it",122],["movieplayer.it",122],["multiplayer.it",122],["repubblica.it",122],["tomshw.it",122],["skuola.net",122],["spaziogames.it",122],["today.it",122],["tuttoandroid.net",122],["tuttotech.net",122],["ilgazzettino.it",123],["ilmessaggero.it",123],["ilsecoloxix.it",123],["privacy.motorradonline.de",126],["consent.watson.de",126],["consent.kino.de",126],["consent.desired.de",126],["cmpv2.fn.de",126],["spp.nextpit.de",126],["dailystar.co.uk",[127,128,129,130]],["mirror.co.uk",[127,128,129,130]],["idnes.cz",131],["20minutes.fr",132],["20minutos.es",132],["24sata.hr",132],["abc.es",132],["actu.fr",132],["antena3.com",132],["antena3internacional.com",132],["atresmedia.com",132],["atresmediapublicidad.com",132],["atresmediastudios.com",132],["atresplayer.com",132],["autopista.es",132],["belfasttelegraph.co.uk",132],["bemad.es",132],["bonduelle.it",132],["bonniernews.se",132],["bt.se",132],["cadenadial.com",132],["caracol.com.co",132],["cas.sk",132],["charentelibre.fr",132],["ciclismoafondo.es",132],["cnews.fr",132],["cope.es",132],["correryfitness.com",132],["courrier-picard.fr",132],["cuatro.com",132],["decathlon.nl",132],["decathlon.pl",132],["di.se",132],["diariocordoba.com",132],["diariodenavarra.es",132],["diariosur.es",132],["diariovasco.com",132],["diepresse.com",132],["divinity.es",132],["dn.se",132],["dnevnik.hr",132],["dumpert.nl",132],["ebuyclub.com",132],["edreams.de",132],["edreams.net",132],["elcomercio.es",132],["elconfidencial.com",132],["elcorreo.com",132],["eldesmarque.com",132],["eldiario.es",132],["eldiariomontanes.es",132],["elespanol.com",132],["elle.fr",132],["elpais.com",132],["elperiodico.com",132],["elperiodicodearagon.com",132],["elplural.com",132],["energytv.es",132],["engadget.com",132],["es.ara.cat",132],["euronews.com",132],["europafm.com",132],["expressen.se",132],["factoriadeficcion.com",132],["filmstarts.de",132],["flooxernow.com",132],["folkbladet.nu",132],["footmercato.net",132],["france.tv",132],["france24.com",132],["fussballtransfers.com",132],["ghacks.net",132],["gva.be",132],["hbvl.be",132],["heraldo.es",132],["hoy.es",132],["ideal.es",132],["idealista.pt",132],["krone.at",132],["kurier.at",132],["lacoste.com",132],["ladepeche.fr",132],["lalibre.be",132],["lanouvellerepublique.fr",132],["larazon.es",132],["lasexta.com",132],["lasprovincias.es",132],["latribune.fr",132],["lavanguardia.com",132],["laverdad.es",132],["lavozdegalicia.es",132],["leboncoin.fr",132],["lecturas.com",132],["ledauphine.com",132],["lejsl.com",132],["leparisien.fr",132],["lesoir.be",132],["letelegramme.fr",132],["libremercado.com",132],["localeyes.dk",132],["los40.com",132],["lotoquebec.com",132],["lunion.fr",132],["m6.fr",132],["marianne.cz",132],["marmiton.org",132],["mediaset.es",132],["melodia-fm.com",132],["metronieuws.nl",132],["moviepilot.de",132],["mtmad.es",132],["multilife.com.pl",132],["naszemiasto.pl",132],["nationalgeographic.com.es",132],["nicematin.com",132],["nieuwsblad.be",132],["notretemps.com",132],["numerama.com",132],["okdiario.com",132],["ondacero.es",132],["podiumpodcast.com",132],["portail.lotoquebec.com",132],["profil.at",132],["public.fr",132],["publico.es",132],["radiofrance.fr",132],["rankia.com",132],["rfi.fr",132],["rossmann.pl",132],["rtbf.be",[132,226]],["rtl.lu",132],["sensacine.com",132],["sfgame.net",132],["shure.com",132],["silicon.es",132],["sncf-connect.com",132],["sport.es",132],["sydsvenskan.se",132],["techcrunch.com",132],["telegraaf.nl",132],["telequebec.tv",132],["tf1.fr",132],["tradingsat.com",132],["trailrun.es",132],["video-streaming.orange.fr",132],["xpress.fr",132],["laprovincia.es",133],["informacion.es",133],["tportal.hr",133],["ivoox.com",133],["as.com",133],["slam.nl",133],["bienpublic.com",133],["funradio.fr",133],["gamepro.de",[133,195,196]],["lemon.fr",133],["lexpress.fr",133],["shadow.tech",133],["letemps.ch",133],["mein-mmo.de",133],["heureka.sk",133],["film.at",133],["dhnet.be",133],["lesechos.fr",[133,231]],["marianne.net",[133,226]],["jeanmarcmorandini.com",[133,227]],["dna.fr",133],["sudinfo.be",133],["europe1.fr",[133,227]],["rtl.be",[133,226]],["reviewingthebrew.com",133],["jaysjournal.com",133],["reignoftroy.com",133],["ryobitools.eu",[134,135]],["americanexpress.com",136],["consent.radiotimes.com",139],["sp-consent.szbz.de",140],["cmp.omni.se",141],["cmp.svd.se",141],["cmp.aftonbladet.se",141],["cmp.tv.nu",141],["consent.economist.com",143],["studentagency.cz",143],["cmpv2.foundryco.com",144],["cmpv2.infoworld.com",144],["cmpv2.arnnet.com.au",144],["sp-cdn.pcgames.de",145],["sp-cdn.pcgameshardware.de",145],["consentv2.sport1.de",145],["cmp.mz.de",145],["cmpv2.tori.fi",146],["consent.spielaffe.de",148],["bondekompaniet.no",149],["degiro.*",149],["epochtimes.de",149],["vikingline.com",149],["tfl.gov.uk",149],["drklein.de",149],["hildegardis-krankenhaus.de",149],["kleer.se",149],["lekiaviation.com",149],["lotto.pl",149],["mineralstech.com",149],["volunteer.digitalboost.org.uk",149],["starhotels.com",149],["tefl.com",149],["universumglobal.com",149],["tui.com",150],["rexel.*",151],["csob.sk",152],["greenstuffworld.com",153],["morele.net",[154,155]],["1und1.de",156],["infranken.de",157],["cmp.tvtoday.de",158],["cmp.tvspielfilm.de",158],["cmp.bunte.de",158],["cmp.chip.de",158],["cmp.focus.de",[158,509]],["estadiodeportivo.com",159],["tameteo.*",159],["tempo.pt",159],["meteored.*",159],["pogoda.com",159],["yourweather.co.uk",159],["tempo.com",159],["theweather.net",159],["tiempo.com",159],["ilmeteo.net",159],["daswetter.com",159],["kicker.de",160],["formulatv.com",161],["web.de",162],["lefigaro.fr",163],["linternaute.com",164],["consent.caminteresse.fr",165],["volksfreund.de",166],["rp-online.de",166],["dailypost.co.uk",167],["the-express.com",167],["vide-greniers.org",167],["dailyrecord.co.uk",168],["bluray-disc.de",169],["elio-systems.com",169],["stagatha-fachklinik.de",169],["tarife.mediamarkt.de",169],["lz.de",169],["gaggenau.com",169],["saturn.de",170],["eltiempo.es",[171,172]],["otempo.pt",173],["atlasformen.*",174],["cmp-sp.goettinger-tageblatt.de",175],["cmp-sp.saechsische.de",175],["cmp-sp.ln-online.de",175],["cz.de",175],["dewezet.de",175],["dnn.de",175],["haz.de",175],["gnz.de",175],["landeszeitung.de",175],["lvz.de",175],["maz-online.de",175],["ndz.de",175],["op-marburg.de",175],["ostsee-zeitung.de",175],["paz-online.de",175],["reisereporter.de",175],["rga.de",175],["rnd.de",175],["siegener-zeitung.de",175],["sn-online.de",175],["solinger-tageblatt.de",175],["sportbuzzer.de",175],["szlz.de",175],["tah.de",175],["torgauerzeitung.de",175],["waz-online.de",175],["privacy.maennersache.de",175],["sinergy.ch",177],["agglo-valais-central.ch",177],["biomedcentral.com",178],["hsbc.*",179],["hsbcnet.com",179],["hsbcinnovationbanking.com",179],["create.hsbc",179],["gbm.hsbc.com",179],["hsbc.co.uk",180],["internationalservices.hsbc.com",180],["history.hsbc.com",180],["about.hsbc.co.uk",181],["privatebanking.hsbc.com",182],["independent.co.uk",185],["privacy.crash.net",185],["the-independent.com",186],["argos.co.uk",188],["poco.de",[189,190]],["moebelix.*",189],["moemax.*",189],["xxxlutz.*",189],["xxxlesnina.*",189],["moebel24.ch",190],["meubles.fr",190],["meubelo.nl",190],["moebel.de",190],["lipo.ch",191],["schubiger.ch",192],["aedt.de",193],["berlin-live.de",193],["bike-magazin.de",193],["connect.de",193],["gutefrage.net",193],["insideparadeplatz.ch",193],["morgenpost.de",193],["thueringen24.de",193],["pdfupload.io",194],["gamestar.de",[195,196,235]],["verksamt.se",197],["acmemarkets.com",198],["amtrak.com",198],["beko.com",198],["bepanthen.com.au",198],["berocca.com.au",198],["booking.com",198],["carrefour.fr",198],["centrum.sk",198],["claratyne.com.au",198],["credit-suisse.com",198],["ceskatelevize.cz",198],["deporvillage.*",198],["de.vanguard",198],["dhl.de",198],["digikey.*",198],["drafthouse.com",198],["dunelm.com",198],["eurosport.fr",198],["fello.se",198],["fielmann.*",198],["flashscore.fr",198],["flightradar24.com",198],["fnac.es",198],["foodandwine.com",198],["fourseasons.com",198],["khanacademy.org",198],["konami.com",198],["jll.*",198],["jobs.redbull.com",198],["hellenicbank.com",198],["gemini.pl",198],["groceries.asda.com",198],["lamborghini.com",198],["menshealth.com",198],["n26.com",198],["nintendo.com",198],["nokia.com",198],["oneweb.net",198],["omnipod.com",198],["oralb.*",198],["panasonic.com",198],["parkside-diy.com",198],["pluto.tv",198],["popularmechanics.com",198],["polskieradio.pl",198],["pringles.com",198],["questdiagnostics.com",198],["radissonhotels.com",198],["ricardo.ch",198],["rockstargames.com",198],["rte.ie",198],["salesforce.com",198],["samsonite.*",198],["spiele.heise.de",198],["spirit.com",198],["stenaline.co.uk",198],["swisscom.ch",198],["swisspass.ch",198],["technologyfromsage.com",198],["telenet.be",198],["tntsports.co.uk",198],["theepochtimes.com",198],["toujeo.com",198],["uber-platz.de",198],["vinted.com",198],["wallapop.com",198],["wickes.co.uk",198],["workingtitlefilms.com",198],["vattenfall.de",198],["winparts.fr",198],["yoigo.com",198],["zoominfo.com",198],["allegiantair.com",199],["hallmarkchannel.com",199],["incorez.com",199],["noovle.com",199],["otter.ai",199],["plarium.com",199],["telsy.com",199],["timenterprise.it",199],["tim.it",199],["tradersunion.com",199],["fnac.*",199],["yeti.com",199],["here.com",[200,689]],["vodafone.com",200],["cmp.heise.de",[202,203]],["cmp.am-online.com",202],["cmp.motorcyclenews.com",202],["consent.newsnow.co.uk",202],["cmp.todays-golfer.com",202],["koeser.com",204],["shop.schaette-pferd.de",204],["schaette.de",204],["central-bb.de",205],["fitnessfoodcorner.de",206],["kuehlungsborn.de",207],["espressocoffeeshop.com",208],["brainmarket.pl",209],["getroots.app",210],["cart-in.re",[211,614]],["prestonpublishing.pl",212],["zara.com",213],["lepermislibre.fr",213],["negociardivida.spcbrasil.org.br",214],["pons.com",215],["adidas.*",216],["privacy.topreality.sk",217],["privacy.autobazar.eu",217],["vu.lt",218],["adnkronos.com",[219,220]],["cornwalllive.com",[219,220]],["cyprus-mail.com",[219,220]],["einthusan.tv",[219,220]],["informazione.it",[219,220]],["mymovies.it",[219,220]],["tuttoeuropei.com",[219,220]],["video.lacnews24.it",[219,220]],["protothema.gr",219],["flash.gr",219],["taxscouts.com",221],["online.no",223],["telenor.no",223],["austrian.com",224],["lufthansa.com",224],["kampfkunst-herz.de",225],["glow25.de",225],["h-f.at",225],["hornetsecurity.com",225],["kayzen.io",225],["wasserkunst-hamburg.de",225],["zahnspange-oelde.de",225],["bnc.ca",226],["egora.fr",226],["engelvoelkers.com",226],["estrategiasdeinversion.com",226],["festo.com",226],["francebleu.fr",226],["francemediasmonde.com",226],["geny.com",226],["giphy.com",226],["idealista.com",226],["infolibre.es",226],["inpost.pl",226],["information.tv5monde.com",226],["ing.es",226],["knipex.de",226],["laprovence.com",226],["lemondeinformatique.fr",226],["libertaddigital.com",226],["mappy.com",226],["orf.at",226],["philibertnet.com",226],["researchgate.net",226],["standaard.be",226],["stroilioro.com",226],["taxfix.de",226],["telecinco.es",226],["vistaalegre.com",226],["zimbra.free.fr",226],["usinenouvelle.com",228],["reussir.fr",230],["bruendl.at",232],["latamairlines.com",233],["elisa.ee",234],["baseendpoint.brigitte.de",235],["baseendpoint.gala.de",235],["baseendpoint.haeuser.de",235],["baseendpoint.stern.de",235],["baseendpoint.urbia.de",235],["cmp.tag24.de",235],["cmp-sp.handelsblatt.com",235],["cmpv2.berliner-zeitung.de",235],["golem.de",235],["consent.t-online.de",235],["sp-consent.stuttgarter-nachrichten.de",236],["sp-consent.stuttgarter-zeitung.de",236],["regjeringen.no",237],["sp-manager-magazin-de.manager-magazin.de",238],["consent.11freunde.de",238],["wallester.com",243],["centrum24.pl",244],["replay.lsm.lv",245],["ltv.lsm.lv",245],["bernistaba.lsm.lv",245],["verl.de",246],["cubo-sauna.de",246],["mbl.is",246],["auto-medienportal.net",246],["mobile.de",247],["cookist.it",248],["fanpage.it",248],["geopop.it",248],["lexplain.it",248],["royalmail.com",249],["gmx.net",250],["gmx.ch",251],["mojehobby.pl",252],["super-hobby.*",252],["sp.stylevamp.de",253],["cmp.wetteronline.de",253],["audi.*",[254,255]],["easyjet.com",254],["experian.co.uk",254],["postoffice.co.uk",254],["tescobank.com",254],["internetaptieka.lv",[256,257]],["nike.com",258],["wells.pt",259],["dskdirect.bg",260],["cmpv2.dba.dk",261],["spcmp.crosswordsolver.com",262],["ecco.com",263],["georgjensen.com",263],["thomann.*",264],["landkreis-kronach.de",265],["effectiefgeven.be",266],["northcoast.com",266],["chaingpt.org",266],["bandenconcurrent.nl",267],["bandenexpert.be",267],["reserved.com",268],["metro.it",269],["makro.es",269],["metro.sk",269],["metro-cc.hr",269],["makro.nl",269],["metro.bg",269],["metro.at",269],["metro-tr.com",269],["metro.de",269],["metro.fr",269],["makro.cz",269],["metro.ro",269],["makro.pt",269],["makro.pl",269],["sklepy-odido.pl",269],["rastreator.com",269],["metro.ua",270],["metro.rs",270],["metro-kz.com",270],["metro.md",270],["metro.hu",270],["metro-cc.ru",270],["metro.pk",270],["balay.es",271],["constructa.com",271],["dafy-moto.com",272],["akku-shop.nl",273],["akkushop-austria.at",273],["akkushop-b2b.de",273],["akkushop.de",273],["akkushop.dk",273],["batterie-boutique.fr",273],["akkushop-schweiz.ch",274],["evzuttya.com.ua",275],["eobuv.cz",275],["eobuwie.com.pl",275],["ecipele.hr",275],["eavalyne.lt",275],["chaussures.fr",275],["ecipo.hu",275],["eobuv.sk",275],["epantofi.ro",275],["epapoutsia.gr",275],["escarpe.it",275],["eschuhe.de",275],["obuvki.bg",275],["zapatos.es",275],["swedbank.ee",276],["mudanzavila.es",277],["bienmanger.com",278],["gesipa.*",279],["gesipausa.com",279],["beckhoff.com",279],["zitekick.dk",280],["eltechno.dk",280],["okazik.pl",280],["batteryempire.*",281],["maxi.rs",282],["garmin.com",283],["invisalign.*",283],["one4all.ie",283],["osprey.com",283],["wideroe.no",284],["bmw.*",285],["kijk.nl",286],["nordania.dk",287],["danskebank.*",287],["danskeci.com",287],["danica.dk",287],["dehn.*",288],["gewerbegebiete.de",289],["cordia.fr",290],["vola.fr",291],["lafi.fr",292],["skyscanner.*",293],["coolblue.*",294],["chipotle.com",295],["sanareva.*",296],["atida.fr",296],["bbva.*",297],["bbvauk.com",297],["expertise.unimi.it",298],["altenberg.de",299],["vestel.es",300],["tsb.co.uk",301],["buienradar.nl",[302,303]],["linsenplatz.de",304],["budni.de",305],["erstecardclub.hr",305],["teufel.de",[306,307]],["abp.nl",308],["simplea.sk",309],["flip.bg",310],["kiertokanki.com",311],["leirovins.be",313],["vias.be",314],["edf.fr",315],["virbac.com",315],["diners.hr",315],["squarehabitat.fr",315],["arbitrobancariofinanziario.it",316],["ivass.it",316],["economiapertutti.bancaditalia.it",316],["smit-sport.de",317],["gekko-computer.de",317],["jysk.al",318],["go-e.com",319],["malerblatt-medienservice.de",320],["architekturbuch.de",320],["medienservice-holz.de",320],["leuchtstark.de",320],["casius.nl",321],["coolinarika.com",322],["giga-hamburg.de",322],["vakgaragevannunen.nl",322],["fortuluz.es",322],["finna.fi",322],["eurogrow.es",322],["topnatur.cz",322],["topnatur.eu",322],["vakgarage.nl",322],["whufc.com",322],["zomaplast.cz",322],["envafors.dk",323],["dabbolig.dk",[324,325]],["daruk-emelok.hu",326],["exakta.se",327],["larca.de",328],["roli.com",329],["okazii.ro",330],["lr-shop-direkt.de",330],["portalprzedszkolny.pl",330],["tgvinoui.sncf",331],["l-bank.de",332],["interhyp.de",333],["indigoneo.*",334],["transparency.meta.com",335],["dojusagro.lt",336],["eok.ee",336],["kripa.it",336],["nextdaycatering.co.uk",336],["safran-group.com",336],["sr-ramenendeuren.be",336],["ilovefreegle.org",336],["tribexr.com",336],["understandingsociety.ac.uk",336],["bestbuycyprus.com",337],["strato.*",338],["strato-hosting.co.uk",338],["auto.de",339],["contentkingapp.com",340],["comune.palermo.it",341],["get-in-engineering.de",342],["spp.nextpit.com",343],["spp.nextpit.es",344],["spp.nextpit.it",345],["spp.nextpit.com.br",346],["spp.nextpit.fr",347],["otterbox.com",348],["stoertebeker-brauquartier.com",349],["stoertebeker.com",349],["stoertebeker-eph.com",349],["aparts.pl",350],["sinsay.com",[351,352]],["benu.cz",353],["stockholmresilience.org",354],["ludvika.se",354],["kammarkollegiet.se",354],["cazenovecapital.com",355],["statestreet.com",356],["beopen.lv",357],["cesukoncertzale.lv",358],["dodo.fr",359],["makelaarsland.nl",360],["bezirk-schwaben.de",361],["dorfen.de",361],["nutsinbulk.co.uk",362],["bricklink.com",363],["bestinver.es",364],["icvs2023.conf.tuwien.ac.at",365],["racshop.co.uk",[366,367]],["baabuk.com",368],["sapien.io",368],["tradedoubler.com",368],["app.lepermislibre.fr",369],["multioferta.es",370],["testwise.com",[371,372]],["tonyschocolonely.com",373],["fitplus.is",373],["fransdegrebber.nl",373],["lilliputpress.ie",373],["lexibo.com",373],["marin-milou.com",373],["dare2tri.com",373],["t3micro.*",373],["la-vie-naturelle.com",[374,375]],["inovelli.com",376],["uonetplus.vulcan.net.pl",[377,378]],["consent.helagotland.se",379],["oper.koeln",[380,381]],["deezer.com",382],["hoteldesartssaigon.com",383],["autoritedelaconcurrence.fr",384],["groupeonepoint.com",384],["geneanet.org",384],["carrieres.groupegalerieslafayette.com",384],["immo-banques.fr",384],["lingvanex.com",384],["turncamp.com",385],["ejobs.ro",[386,387]],["kupbilecik.*",[388,389]],["coolbe.com",390],["serienjunkies.de",391],["computerhoy.20minutos.es",392],["clickskeks.at",393],["clickskeks.de",393],["abt-sportsline.de",393],["exemplary.ai",394],["forbo.com",394],["stores.sk",394],["nerdstar.de",394],["prace.cz",394],["profesia.sk",394],["profesia.cz",394],["pracezarohem.cz",394],["atmoskop.cz",394],["seduo.sk",394],["seduo.cz",394],["teamio.com",394],["arnold-robot.com",394],["cvonline.lt",394],["cv.lv",394],["cv.ee",394],["dirbam.lt",394],["visidarbi.lv",394],["otsintood.ee",394],["webtic.it",394],["gerth.de",395],["pamiatki.pl",396],["initse.com",397],["salvagny.org",398],["augsburger-allgemeine.de",399],["stabila.com",400],["stwater.co.uk",401],["suncalc.org",[402,403]],["swisstph.ch",404],["taxinstitute.ie",405],["get-in-it.de",406],["tempcover.com",[407,408]],["guildford.gov.uk",409],["easyparts.*",[410,411]],["easyparts-recambios.es",[410,411]],["easyparts-rollerteile.de",[410,411]],["drimsim.com",412],["canyon.com",[413,414]],["vevovo.be",[415,416]],["vendezvotrevoiture.be",[415,416]],["wirkaufendeinauto.at",[415,416]],["vikoberallebiler.dk",[415,416]],["wijkopenautos.nl",[415,416]],["vikoperdinbil.se",[415,416]],["noicompriamoauto.it",[415,416]],["vendezvotrevoiture.fr",[415,416]],["compramostucoche.es",[415,416]],["wijkopenautos.be",[415,416]],["auto-doc.*",417],["autodoc.*",417],["autodoc24.*",417],["topautoosat.fi",417],["autoteiledirekt.de",417],["autoczescionline24.pl",417],["tuttoautoricambi.it",417],["onlinecarparts.co.uk",417],["autoalkatreszek24.hu",417],["autodielyonline24.sk",417],["reservdelar24.se",417],["pecasauto24.pt",417],["reservedeler24.co.no",417],["piecesauto24.lu",417],["rezervesdalas24.lv",417],["besteonderdelen.nl",417],["recambioscoche.es",417],["antallaktikaexartimata.gr",417],["piecesauto.fr",417],["teile-direkt.ch",417],["lpi.org",418],["divadelniflora.cz",419],["mahle-aftermarket.com",420],["refurbed.*",421],["eingutertag.org",422],["flyingtiger.com",[422,565]],["borgomontecedrone.it",422],["maharishistore.com",422],["recaro-shop.com",422],["gartenhotel-crystal.at",422],["fayn.com",423],["serica-watches.com",423],["sklavenitis.gr",424],["eam-netz.de",425],["umicore.*",426],["veiligverkeer.be",426],["vsv.be",426],["dehogerielen.be",426],["gera.de",427],["mfr-chessy.fr",428],["mfr-lamure.fr",428],["mfr-saint-romain.fr",428],["mfr-lapalma.fr",428],["mfrvilliemorgon.asso.fr",428],["mfr-charentay.fr",428],["mfr.fr",428],["nationaltrust.org.uk",429],["hej-natural.*",430],["ib-hansmeier.de",431],["rsag.de",432],["esaa-eu.org",432],["aknw.de",432],["answear.*",433],["theprotocol.it",[434,435]],["lightandland.co.uk",436],["etransport.pl",437],["wohnen-im-alter.de",438],["johnmuirhealth.com",[439,440]],["markushaenni.com",441],["airbaltic.com",442],["gamersgate.com",442],["zorgzaam010.nl",443],["etos.nl",444],["paruvendu.fr",445],["privacy.bazar.sk",446],["hennamorena.com",447],["newsello.pl",448],["porp.pl",449],["golfbreaks.com",450],["lieferando.de",451],["just-eat.*",451],["justeat.*",451],["pyszne.pl",451],["lieferando.at",451],["takeaway.com",451],["thuisbezorgd.nl",451],["holidayhypermarket.co.uk",452],["unisg.ch",453],["wassererleben.ch",453],["psgaz.pl",454],["play-asia.com",455],["centralthe1card.com",456],["atu.de",457],["atu-flottenloesungen.de",457],["but.fr",457],["edeka.de",457],["fortuneo.fr",457],["maif.fr",457],["meteo.tf1.fr",457],["particuliers.sg.fr",457],["sparkasse.at",457],["group.vig",457],["tf1info.fr",457],["dpdgroup.com",458],["dpd.com",458],["cosmosdirekt.de",458],["bstrongoutlet.pt",459],["isarradweg.de",[460,461]],["flaxmanestates.com",461],["inland-casas.com",461],["finlayson.fi",[462,463]],["cowaymega.ca",[462,463]],["arktis.de",464],["desktronic.de",464],["belleek.com",464],["brauzz.com",464],["cowaymega.com",464],["dockin.de",464],["dryrobe.com",[464,465]],["formswim.com",464],["hairtalk.se",464],["hallmark.co.uk",[464,465]],["loopearplugs.com",[464,465]],["oleus.com",464],["peopleofshibuya.com",464],["pullup-dip.com",464],["sanctum.shop",464],["tbco.com",464],["desktronic.*",465],["hq-germany.com",465],["tepedirect.com",465],["maxi-pet.ro",465],["paper-republic.com",465],["pullup-dip.*",465],["vitabiotics.com",465],["smythstoys.com",466],["beam.co.uk",[467,468]],["autobahn.de",469],["krakow.pl",470],["shop.app",471],["shopify.com",471],["wufoo.com",472],["consent.dailymotion.com",473],["laposte.fr",473],["help.instagram.com",474],["consent-manager.thenextweb.com",476],["consent-cdn.zeit.de",477],["coway-usa.com",478],["steiners.shop",479],["ecmrecords.com",480],["malaikaraiss.com",480],["koch-mit.de",480],["zeitreisen.zeit.de",480],["wefashion.com",481],["merkur.dk",482],["ionos.*",484],["omegawatches.com",485],["carefully.be",486],["aerotime.aero",486],["rocket-league.com",487],["dws.com",488],["bosch-homecomfort.com",489],["elmleblanc-optibox.fr",489],["monservicechauffage.fr",489],["boschrexroth.com",489],["home-connect.com",490],["lowrider.at",[491,492]],["mesto.de",493],["intersport.gr",494],["intersport.bg",494],["intersport.com.cy",494],["intersport.ro",494],["ticsante.com",495],["techopital.com",495],["millenniumprize.org",496],["hepster.com",497],["peterstaler.de",498],["blackforest-still.de",498],["tiendaplayaundi.com",499],["ajtix.co.uk",500],["raja.fr",501],["rajarani.de",501],["rajapack.*",[501,502]],["avery-zweckform.com",503],["1xinternet.com",503],["futterhaus.de",503],["dasfutterhaus.at",503],["frischeparadies.de",503],["fmk-steuer.de",503],["selgros.de",503],["transgourmet.de",503],["mediapart.fr",504],["athlon.com",505],["alumniportal-deutschland.org",506],["snoopmedia.com",506],["myguide.de",506],["daad.de",506],["cornelsen.de",[507,508]],["vinmonopolet.no",510],["tvp.info",511],["tvp.pl",511],["tvpworld.com",511],["brtvp.pl",511],["tvpparlament.pl",511],["belsat.eu",511],["warnung.bund.de",512],["mediathek.lfv-bayern.de",513],["allegro.*",514],["allegrolokalnie.pl",514],["ceneo.pl",514],["czc.cz",514],["eon.pl",[515,516]],["ylasatakunta.fi",[517,518]],["mega-image.ro",519],["louisvuitton.com",520],["bodensee-airport.eu",521],["department56.com",522],["allendesignsstudio.com",522],["designsbylolita.co",522],["shop.enesco.com",522],["savoriurbane.com",523],["miumiu.com",524],["church-footwear.com",524],["clickdoc.fr",525],["car-interface.com",526],["monolithdesign.it",526],["thematchahouse.com",526],["smileypack.de",[527,528]],["finom.co",529],["orange.es",[530,531]],["fdm-travel.dk",532],["hummel.dk",532],["jysk.nl",532],["power.no",532],["skousen.dk",532],["velliv.dk",532],["whiteaway.com",532],["whiteaway.no",532],["whiteaway.se",532],["skousen.no",532],["energinet.dk",532],["elkjop.no",532],["medimax.de",533],["costautoricambi.com",534],["lotto.it",534],["readspeaker.com",534],["team.blue",534],["ibistallinncenter.ee",535],["aaron.ai",536],["futureverse.com",537],["tandem.co.uk",537],["insights.com",538],["thebathcollection.com",539],["coastfashion.com",[540,541]],["oasisfashion.com",[540,541]],["warehousefashion.com",[540,541]],["misspap.com",[540,541]],["karenmillen.com",[540,541]],["boohooman.com",[540,541]],["hdt.de",542],["wolt.com",543],["xohotels.com",544],["sim24.de",545],["tnt.com",546],["uza.be",547],["uzafoundation.be",547],["uzajobs.be",547],["bergzeit.*",[548,549]],["cinemas-lumiere.com",550],["cdiscount.com",551],["brabus.com",552],["roborock.com",553],["strumentimusicali.net",554],["maisonmargiela.com",555],["webfleet.com",556],["dragonflyshipping.ca",557],["broekhuis.nl",558],["groningenairport.nl",558],["nemck.cz",559],["zdfheute.de",560],["sap-press.com",561],["roughguides.com",[562,563]],["korvonal.com",564],["rexbo.*",566],["itau.com.br",567],["bbg.gv.at",568],["portal.taxi.eu",569],["topannonces.fr",570],["homap.fr",571],["artifica.fr",572],["plan-interactif.com",572],["ville-cesson.fr",572],["moismoliere.com",573],["unihomes.co.uk",574],["bkk.hu",575],["coiffhair.com",576],["ptc.eu",577],["ziegert-group.com",[578,686]],["lassuranceretraite.fr",579],["interieur.gouv.fr",579],["toureiffel.paris",579],["economie.gouv.fr",579],["education.gouv.fr",579],["livoo.fr",579],["su.se",579],["zappo.fr",579],["smdv.de",580],["digitalo.de",580],["petiteamelie.*",581],["mojanorwegia.pl",582],["koempf24.ch",[583,584]],["teichitekten24.de",[583,584]],["koempf24.de",[583,584]],["wolff-finnhaus-shop.de",[583,584]],["asnbank.nl",585],["blgwonen.nl",585],["regiobank.nl",585],["snsbank.nl",585],["vulcan.net.pl",[586,587]],["ogresnovads.lv",588],["partenamut.be",589],["pirelli.com",590],["unicredit.it",591],["effector.pl",592],["zikodermo.pl",[593,594]],["devolksbank.nl",595],["caixabank.es",596],["cyberport.de",598],["cyberport.at",598],["slevomat.cz",599],["kfzparts24.de",600],["runnersneed.com",601],["aachener-zeitung.de",602],["sportpursuit.com",603],["druni.es",[604,615]],["druni.pt",[604,615]],["delta.com",605],["onliner.by",[606,607]],["vejdirektoratet.dk",608],["usaa.com",609],["consorsbank.de",610],["metroag.de",611],["kupbilecik.pl",612],["oxfordeconomics.com",613],["routershop.nl",614],["woo.pt",614],["e-jumbo.gr",616],["alza.*",617],["rmf.fm",619],["rmf24.pl",619],["tracfone.com",620],["lequipe.fr",621],["global.abb",622],["gala.fr",623],["purepeople.com",624],["3sat.de",625],["zdf.de",625],["filmfund.lu",626],["welcometothejungle.com",626],["triblive.com",627],["rai.it",628],["fbto.nl",629],["europa.eu",630],["caisse-epargne.fr",631],["banquepopulaire.fr",631],["bigmammagroup.com",632],["studentagency.sk",632],["studentagency.eu",632],["winparts.be",633],["winparts.nl",633],["winparts.eu",634],["winparts.ie",634],["winparts.se",634],["sportano.*",[635,636]],["crocs.*",637],["chronext.ch",638],["chronext.de",638],["chronext.at",638],["chronext.com",639],["chronext.co.uk",639],["chronext.fr",640],["chronext.nl",641],["chronext.it",642],["galerieslafayette.com",643],["bazarchic.com",644],["stilord.*",645],["tiko.pt",646],["nsinternational.com",647],["meinbildkalender.de",648],["gls-group.com",649],["gls-group.eu",649],["univie.ac.at",649],["chilis.com",650],["account.bhvr.com",652],["everand.com",652],["lucidchart.com",652],["intercars.ro",[652,653]],["scribd.com",652],["guidepoint.com",652],["erlebnissennerei-zillertal.at",654],["hintertuxergletscher.at",654],["tiwag.at",654],["playseatstore.com",655],["swiss-sport.tv",657],["targobank-magazin.de",658],["zeit-verlagsgruppe.de",658],["online-physiotherapie.de",658],["kieferorthopaede-freisingsmile.de",659],["nltraining.nl",660],["kmudigital.at",661],["mintysquare.com",662],["consent.thetimes.com",663],["cadenaser.com",664],["berlinale.de",665],["lebonlogiciel.com",666],["iberiaexpress.com",667],["easycosmetic.ch",668],["pharmastar.it",669],["washingtonpost.com",670],["brillenplatz.de",671],["angelplatz.de",671],["dt.mef.gov.it",672],["raffeldeals.com",673],["stepstone.de",674],["kobo.com",675],["zoxs.de",677],["offistore.fi",678],["collinsaerospace.com",679],["radioapp.lv",682],["hagengrote.de",683],["hemden-meister.de",683],["vorteilshop.com",684],["capristores.gr",685],["getaround.com",687],["technomarket.bg",688],["epiphone.com",690],["gibson.com",690],["maestroelectronics.com",690],["cropp.com",[691,692]],["housebrand.com",[691,692]],["mohito.com",[691,692]],["autoczescizielonki.pl",693],["b-s.de",694],["novakid.pl",695],["piecesauto24.com",696],["earpros.com",697],["portalridice.cz",698],["kitsapcu.org",699],["nutsinbulk.*",700],["berlin-buehnen.de",701],["metropoliten.rs",702],["educa2.madrid.org",703],["immohal.de",704],["sourcepoint.theguardian.com",705],["rtlplay.be",706],["natgeotv.com",706],["llama.com",707],["meta.com",707],["setasdesevilla.com",708],["cruyff-foundation.org",709],["allianz.*",710],["energiedirect-bayern.de",711],["postnl.be",712],["postnl.nl",712],["sacyr.com",713],["volkswagen-newsroom.com",714],["openbank.*",715],["tagus-eoficina.grupogimeno.com",716],["tidal.com",717],["knax.de",718],["ordblindenetvaerket.dk",719],["boligbeton.dk",719],["dukh.dk",719],["pevgrow.com",720],["ya.ru",721],["ipolska24.pl",722],["17bankow.com",722],["kazimierzdolny.pl",722],["vpolshchi.pl",722],["dobreprogramy.pl",[722,723]],["essanews.com",722],["money.pl",722],["autokult.pl",722],["komorkomania.pl",722],["polygamia.pl",722],["autocentrum.pl",722],["homebook.pl",722],["domodi.pl",722],["jastrzabpost.pl",722],["open.fm",722],["gadzetomania.pl",722],["fotoblogia.pl",722],["abczdrowie.pl",722],["parenting.pl",722],["kafeteria.pl",722],["vibez.pl",722],["wakacje.pl",722],["extradom.pl",722],["totalmoney.pl",722],["superauto.pl",722],["nerwica.com",722],["forum.echirurgia.pl",722],["dailywrap.net",722],["pysznosci.pl",722],["genialne.pl",722],["finansowysupermarket.pl",722],["deliciousmagazine.pl",722],["audioteka.com",722],["easygo.pl",722],["so-magazyn.pl",722],["o2.pl",722],["pudelek.pl",722],["benchmark.pl",722],["wp.pl",722],["altibox.dk",724],["altibox.no",724],["talksport.com",725],["zuiderzeemuseum.nl",726],["gota.io",727],["nwzonline.de",728],["scaleway.com",729],["bistro.sk",730],["spk-schaumburg.de",731],["computerbase.de",732],["comdirect.de",733],["metro.co.uk",734],["imaios.com",735],["myprivacy.dpgmedia.nl",736],["myprivacy.dpgmedia.be",736],["www.dpgmediagroup.com",736]]);
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
