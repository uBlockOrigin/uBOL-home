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

    const steps = safe.String_split.call(selectors, /\s*,\s*/).map(a => {
        if ( /^\d+$/.test(a) ) { return parseInt(a, 10); }
        return a;
    });
    if ( steps.length === 0 ) { return; }
    const clickDelay = parseInt(delay, 10) || 1;
    for ( let i = steps.length-1; i > 0; i-- ) {
        if ( typeof steps[i] !== 'string' ) { continue; }
        if ( typeof steps[i-1] !== 'string' ) { continue; }
        steps.splice(i, 0, clickDelay);
    }
    if ( steps.length === 1 && delay !== '' ) {
        steps.unshift(clickDelay);
    }
    if ( typeof steps.at(-1) !== 'number' ) {
        steps.push(10000);
    }

    const waitForTime = ms => {
        return new Promise(resolve => {
            safe.uboLog(logPrefix, `Waiting for ${ms} ms`);
            waitForTime.timer = setTimeout(( ) => {
                waitForTime.timer = undefined;
                resolve();
            }, ms);
        });
    };
    waitForTime.cancel = ( ) => {
        const { timer } = waitForTime;
        if ( timer === undefined ) { return; }
        clearTimeout(timer);
        waitForTime.timer = undefined;
    };

    const waitForElement = selector => {
        return new Promise(resolve => {
            const elem = querySelectorEx(selector);
            if ( elem !== null ) {
                elem.click();
                resolve();
                return;
            }
            safe.uboLog(logPrefix, `Waiting for ${selector}`);
            const observer = new MutationObserver(( ) => {
                const elem = querySelectorEx(selector);
                if ( elem === null ) { return; }
                waitForElement.cancel();
                elem.click();
                resolve();
            });
            observer.observe(document, {
                attributes: true,
                childList: true,
                subtree: true,
            });
            waitForElement.observer = observer;
        });
    };
    waitForElement.cancel = ( ) => {
        const { observer } = waitForElement;
        if ( observer === undefined ) { return; }
        waitForElement.observer = undefined;
        observer.disconnect();
    };

    const waitForTimeout = ms => {
        waitForTimeout.cancel();
        waitForTimeout.timer = setTimeout(( ) => {
            waitForTimeout.timer = undefined;
            terminate();
            safe.uboLog(logPrefix, `Timed out after ${ms} ms`);
        }, ms);
    };
    waitForTimeout.cancel = ( ) => {
        if ( waitForTimeout.timer === undefined ) { return; }
        clearTimeout(waitForTimeout.timer);
        waitForTimeout.timer = undefined;
    };

    const terminate = ( ) => {
        waitForTime.cancel();
        waitForElement.cancel();
        waitForTimeout.cancel();
    };

    const process = async ( ) => {
        waitForTimeout(steps.pop());
        while ( steps.length !== 0 ) {
            const step = steps.shift();
            if ( step === undefined ) { break; }
            if ( typeof step === 'number' ) {
                await waitForTime(step);
                if ( step === 1 ) { continue; }
                continue;
            }
            if ( step.startsWith('!') ) { continue; }
            await waitForElement(step);
            safe.uboLog(logPrefix, `Clicked ${step}`);
        }
        terminate();
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
const argsList = [["button#W0wltc","","500"],["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","800"],["button[title=\"REJECT ALL\"]","","1200"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button#CybotCookiebotDialogBodyButtonDecline"],["#pubtech-cmp button[aria-label=\"Continue without accepting\"]"],["button[data-t=\"rejectAll\"]","","1000"],["#gdpr-banner-cmp-button","","1000"],["button[aria-label=\"Datenschutzbestimmungen und Einstellungen ablehnen\"]","","1200"],["#iubenda-cs-banner button.iubenda-cs-close-btn"],["button.message-button[aria-label=\"More Options\"]"],["button.sp_choice_type_REJECT_ALL","","2000"],["button[aria-label=\"Reject All\"]"],["div[data-project=\"mol-fe-cmp\"] button[class*=\"consent\"]:not([class*=\"reject\"])"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[aria-label]","","1000"],["ytm-button-renderer.eom-accept button","","2000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button.glue-cookie-notification-bar__reject","","1000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","1000"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button.cookie-decline-all","","1800"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[action-name=\"agreeAll\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","2000"],["button.iubenda-cs-close-btn"],["button[title=\"Aceitar todos\"]","","1000"],["button.cta-button[title=\"Tümünü reddet\"]"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["#pmConsentWall .pmConsentWall-button:not([href])","","1000","reloadAfterClick:200"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Zustimmen und weiter\"]","","1000"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["div.decline","","1000"],["button#declineAllConsentSummary","","1500"],["button.deny-btn","","1000"],["span#idxrcookiesKO","","1000"],["button[data-action=\"cookie-consent#onToggleShowManager\"]","","900"],["button[data-action=\"cookie-consent#onSaveSetting\"]","","1200"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","1500"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["#qc-cmp2-container button#accept-btn"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-decline\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1500"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1500"],["button[title=\"Zustimmen\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[title=\"Alle ablehnen\"]","","1800"],["button.pixelmate-general-deny","","1000"],["a.mmcm-btn-decline","","1000"],["button.hi-cookie-btn-accept-necessary","","1000"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-e2e=\"pure-accept-ads\"]","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button.brlbs-btn-save","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[id=\"fupi_decline_cookies_btn\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button[title=\"Schließen & Akzeptieren\"]","","1000"],["button.js-alert-cookie-reject","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button[title=\"Accept & Continue\"]","","1000"],["button#ensRejectAll","","1500"],["button#ensSave","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],[".modal-actions-decline-btn","","2000"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button.btn.customize","","800"],["button.confirm-button","","1200"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1500"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button[id=\"ketch-banner-button-secondary\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["button.cmplz-deny","","1000"],["button[aria-label=\"Reject all\"]","","1000"],["button[title=\"Agree\"]","","1000"],["button[title=\"Aceptar y continuar\"]","","1000"],["button[title=\"Accettare e continuare\"]","","1000"],["button[title=\"Concordar\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button.si-cookie-notice__button--reject","","1000"],["button.cookieselection-confirm-necessary","","2500"],["button[value=\"essential\"]","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1600"],["button[data-testing=\"cookie-bar-deny-all\"]","","1000"],["button.shared-elements-cookies-popup__modify-button","","1100"],["button.shared-cookies-modal__current-button","","1300"],["button#cookie-custom","","1200"],["button#cookie-save","","1800"],["div.rejectLink___zHIdj","","1000"],[".cmp-root-container >>> .cmp-button-accept-all","","1000"],["a[data-mrf-role=\"userPayToReject\"]","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button#js-data-privacy-manage-cookies","","1000"],["button#js-manage-data-privacy-save-button","1500"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button.primary","","1000"],["a[onclick=\"denyCookiePolicyAndSetHash();\"]","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#btn-accept-required-banner","","1000"],["button.js-cookies-panel-reject-all","","1000"],["button.acbut.continue","","1000"],["button#btnAcceptPDPA","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button.swal2-cancel","","1000"],["button[data-component-name=\"reject\"]","","1000"],["button.fides-reject-all-button","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["div[aria-label=\"Only allow essential cookies\"]","","1000"],["button[title=\"Agree & Continue\"]","","1800"],["button[title=\"Reject All\"]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],["button.btn-secondary[autofocus=\"true\"]","","1000"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","2800"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["button[data-test-id=\"decline-button\"]","","2400"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button[data-testid=\"cmp-revoke-all\"]","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button[title=\"Accept and continue\"]","","2000"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","2500"],["button[onclick*=\"(()=>{ CassieWidgetLoader.Widget.rejectAll\"]","","1000"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],[".wt-ecl-button[href=\"#refuse\"]","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],["button#acceptCookiesTerms","","1000"],["a.footer-cookies-button-save-all","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.gdpr-accept-all-btn","","1000"],["span[data-ga-action=\"disallow_all_cookies\"]","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button.btn-secondary","","1800"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["input#popup_ok","","1000"],["button[data-test=\"terms-accept-button\"]","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["body > div[class] > div[class] > div[class]:has(a[href*=\"holding.wp.pl\"]) > div[class] > div[class]:only-child > button:first-child"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"],["#cmpwrapper >>> a.cust-btn[onclick*=\"__cmp('setConsent'","1)\"]","","1500"],["button.cta-size-big.cta-outline"],["pie-cookie-banner >>> [data-test-id=\"actions-manage-prefs\"], pie-cookie-banner >>> #functional >>> .c-switch-input, pie-cookie-banner >>> pie-modal >>> pie-button >>> button[type=\"submit\"]","","1000"],["[data-form=\".eprivacy_optin_decline\"]","","1000"],["#cookie-consent-button","","1500"],["com-consent-layer >>> #cmpDenyAll","","2500"],["div[data-project=\"mol-fe-cmp\"] button[class*=\"level1PrimaryButton-\"]:not([class*=\"reject\"])"],["div#continueWithoutAccepting","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["body > div.w-screen.p-\\[1\\.25rem\\].fixed.left-0.top-0.flex button:first-child + button"],["#ketch-banner-buttons-container-compact > button#ketch-banner-button-primary"],[".prelim-manage-cookies-button.btn-default"],["button[data-role=\"necessary\"]"],[".cookie-banner--open button[data-variant=\"primary\"] + [data-variant=\"primary\"]","","1000"],["button[data-hook=\"consent-banner-decline-all-button\""],["cmp-banner >>> cmp-dialog >>> cmp-button >>> .button.button--primary","","1000"],["button#c-t-bn"],["a[fs-consent-element=\"deny\"]","","2000"],["button.c_link","","1000"],["#pubtech-cmp button#pt-close"]];
const hostnamesMap = new Map([["www.google.*",0],["consent.google.*",1],["consent.youtube.com",[1,2]],["facebook.com",3],["instagram.com",4],["sourcepointcmp.bloomberg.com",[5,6,7]],["sourcepointcmp.bloomberg.co.jp",[5,6,7]],["giga.de",7],["heise.de",7],["bloomberg.com",[8,9]],["forbes.com",[8,84]],["consent.fastcar.co.uk",8],["tapmaster.ca",8],["cmpv2.standard.co.uk",[10,11]],["cmpv2.independent.co.uk",[12,13,14,194]],["wetransfer.com",[15,16]],["spiegel.de",[17,18]],["nytimes.com",[19,190]],["consent.yahoo.com",20],["tumblr.com",21],["fplstatistics.co.uk",22],["fplstatistics.com",22],["e-shop.leonidas.com",23],["tomsguide.com>>",[24,25]],["walmart.ca",26],["sams.com.mx",27],["my.tonies.com",28],["cambio-carsharing.de",28],["festool.*",28],["festoolcanada.com",28],["fuso-trucks.*",28],["tracker.fressnapf.de",28],["myfabrics.co.uk",28],["zinus.*",28],["oeamtc.at",28],["consent.ladbible.com",[29,30]],["consent.unilad.com",[29,30]],["consent.uniladtech.com",[29,30]],["consent.gamingbible.com",[29,30]],["consent.sportbible.com",[29,30]],["consent.tyla.com",[29,30]],["consent.ladbiblegroup.com",[29,30]],["m2o.it",31],["deejay.it",31],["capital.it",31],["ilmattino.it",[31,32]],["leggo.it",[31,32]],["libero.it",31],["tiscali.it",31],["consent-manager.ft.com",[33,34,35]],["hertz.*",36],["mediaworld.it",37],["mediamarkt.*",37],["mediamarktsaturn.com",38],["uber.com",[39,191]],["ubereats.com",[39,191]],["lego.com",40],["ai.meta.com",41],["lilly.com",42],["bbc.com>>",43],["ilgiornale.it",44],["dimensione.com",45],["wero-wallet.eu",45],["everyeye.it",[46,762]],["reisjaeger.at",47],["mydealz.de",47],["pepper.pl",47],["dealabs.com",47],["hotukdeals.com",47],["chollometro.com",47],["kleinanzeigen.de",[48,49]],["105.net",50],["pcgamer.com>>",[51,52]],["businessinsider.com>>",53],["dailymail.co.uk",54],["almamedia.fi>>",55],["ampparit.com>>",55],["arvopaperi.fi>>",55],["kauppalehti.fi>>",55],["mikrobitti.fi>>",55],["talouselama.fi>>",55],["tekniikkatalous.fi>>",55],["tivi.fi>>",55],["uusisuomi.fi>>",55],["aamulehti.fi>>",[56,57,58]],["etlehti.fi>>",[56,57,58]],["gloria.fi>>",[56,57,58]],["hyvaterveys.fi>>",[56,57,58]],["jamsanseutu.fi>>",[56,57,58]],["janakkalansanomat.fi>>",[56,57,58]],["kankaanpaanseutu.fi>>",[56,57,58]],["kmvlehti.fi>>",[56,57,58]],["kodinkuvalehti.fi>>",[56,57,58]],["merikarvialehti.fi>>",[56,57,58]],["nokianuutiset.fi>>",[56,57,58]],["pelikone.fi>>",[56,57,58]],["rannikkoseutu.fi>>",[56,57,58]],["ruutu.fi>>",[56,57,58]],["satakunnankansa.fi>>",[56,57,58]],["soppa365.fi>>",[56,57,58]],["suurkeuruu.fi>>",[56,57,58]],["sydansatakunta.fi>>",[56,57,58]],["tyrvaansanomat.fi>>",[56,57,58]],["valkeakoskensanomat.fi>>",[56,57,58]],["vauva.fi>>",[56,57,58]],["telekom.com",59],["telekom.de",59],["abola.pt",60],["flytap.com",60],["ansons.de",60],["blick.ch",60],["buienradar.be",60],["crunchyroll.com",60],["digi24.ro",60],["digisport.ro",60],["digitalfoundry.net",60],["egx.net",60],["emirates.com",60],["eurogamer.it",60],["foto-erhardt.de",60],["gmx.*",60],["kizi.com",60],["mail.com",60],["mcmcomiccon.com",60],["nachrichten.at",60],["nintendolife.com",60],["oe24.at",60],["observatornews.ro",60],["paxsite.com",60],["peacocktv.com",60],["player.pl",60],["plus500.*",60],["pricerunner.com",60],["pricerunner.se",60],["pricerunner.dk",60],["proximus.be",[60,666]],["proximus.com",60],["purexbox.com",60],["pushsquare.com",60],["rugbypass.com",60],["southparkstudios.com",[60,308]],["southwest.com",60],["starwarscelebration.com",60],["sweatybetty.com",60],["theaa.ie",60],["thehaul.com",60],["timeextension.com",60],["travelandleisure.com",60],["tunein.com",60],["tvn24.pl",60],["uefa.com",60],["videoland.com",60],["wizzair.com",60],["wetter.at",60],["wowbiz.ro",60],["dicebreaker.com",[61,62]],["eurogamer.es",[61,62]],["eurogamer.net",[61,62]],["eurogamer.nl",[61,62]],["eurogamer.pl",[61,62]],["eurogamer.pt",[61,62]],["gamesindustry.biz",[61,62]],["reedpop.com",[61,62]],["rockpapershotgun.com",[61,62]],["thepopverse.com",[61,62]],["vg247.com",[61,62]],["videogameschronicle.com",[61,62]],["eurogamer.de",63],["roadtovr.com",64],["jotex.*",64],["mundodeportivo.com",[65,136]],["www.youtube.com",66],["m.youtube.com",67],["ohra.nl",68],["corriere.it",69],["gazzetta.it",69],["oggi.it",69],["cmp.sky.it",70],["tennisassa.fi",71],["formula1.com",72],["f1racing.pl",73],["music.amazon.*",[74,75]],["consent-pref.trustarc.com",76],["highlights.legaseriea.it",77],["calciomercato.com",77],["sosfanta.com",78],["chrono24.*",[79,80]],["wetter.com",81],["youmath.it",82],["pip.gov.pl",83],["dailybuzz.nl",85],["bnn.de",85],["dosenbach.ch",85],["dw.com",85],["kinepolis.*",85],["mediaite.com",85],["nzz.ch",85],["winfuture.de",85],["lippu.fi",85],["racingnews365.com",85],["reifendirekt.ch",85],["vaillant.*",85],["bauhaus.no",86],["bauhaus.se",86],["beko-group.de",86],["billiger.de",86],["burda.com",86],["continental-tires.com",86],["vanharen.nl",86],["deichmann.com",[86,109,497]],["meraluna.de",86],["slashdot.org",86],["hermann-saunierduval.it",86],["protherm.cz",86],["saunierduval.es",86],["protherm.sk",86],["protherm.ua",86],["saunierduval.hu",86],["saunierduval.ro",86],["saunierduval.at",86],["awb.nl",86],["spar.hu",87],["group.vattenfall.com",87],["mediaset.it",88],["fortune.com",89],["ilrestodelcarlino.it",90],["quotidiano.net",90],["lanazione.it",90],["ilgiorno.it",90],["iltelegrafolivorno.it",90],["auto.it",91],["beauxarts.com",91],["beinsports.com",91],["bfmtv.com",[91,137]],["boursobank.com",91],["boursorama.com",[91,137]],["boursier.com",[91,239]],["brut.media",91],["canalplus.com",91],["decathlon.fr",[91,235]],["diverto.tv",91],["eden-park.com",91],["foodvisor.io",91],["franceinfo.fr",91],["frandroid.com",91],["jobijoba.*",91],["hotelsbarriere.com",91],["intersport.*",[91,206]],["idealista.it",91],["o2.fr",91],["lejdd.fr",[91,136]],["lechorepublicain.fr",91],["la-croix.com",91],["linfo.re",91],["lamontagne.fr",91],["laredoute.fr",91],["largus.fr",91],["leprogres.fr",91],["lesnumeriques.com",91],["libramemoria.com",91],["lopinion.fr",91],["marieclaire.fr",91],["maville.com",91],["michelin.*",91],["midilibre.fr",[91,695]],["meteofrance.com",91],["mondialtissus.fr",91],["orange.fr",91],["orpi.com",91],["oscaro.com",91],["ouest-france.fr",[91,105,137,696]],["parismatch.com",91],["pagesjaunes.fr",91],["programme-television.org",[91,137]],["publicsenat.fr",[91,137]],["rmcbfmplay.com",[91,137]],["science-et-vie.com",[91,136]],["seloger.com",91],["societe.com",91],["suzuki.fr",91],["sudouest.fr",91],["web-agri.fr",91],["nutri-plus.de",92],["americanairlines.*",93],["consent.capital.fr",94],["consent.programme.tv",94],["consent.voici.fr",94],["programme-tv.net",94],["cmpv2.finn.no",95],["cmp.tek.no",[96,97]],["cmp.e24.no",[96,97]],["minmote.no",[96,97]],["cmp.vg.no",[96,97]],["cloud.google.com",98],["developer.android.com",98],["registry.google",98],["safety.google",98],["huffingtonpost.fr",99],["rainews.it",100],["remarkable.com",101],["netzwelt.de",102],["money.it",103],["imore.com>>",104],["allocine.fr",105],["jeuxvideo.com",105],["ozap.com",105],["le10sport.com",105],["xataka.com",105],["cmp.fitbook.de",106],["cmp.autobild.de",106],["sourcepoint.sport.de",106],["cmp-sp.tagesspiegel.de",106],["cmp.bz-berlin.de",106],["cmp.cicero.de",106],["cmp.techbook.de",106],["cmp.stylebook.de",106],["cmp2.bild.de",106],["cmp2.freiepresse.de",106],["sourcepoint.wetter.de",106],["consent.finanzen.at",106],["consent.finanzen.net",106],["consent.up.welt.de",106],["sourcepoint.n-tv.de",106],["sourcepoint.kochbar.de",106],["sourcepoint.rtl.de",106],["cmp.computerbild.de",106],["cmp.petbook.de",106],["cmp-sp.siegener-zeitung.de",106],["cmp-sp.sportbuzzer.de",106],["klarmobil.de",106],["technikum-wien.at",107],["eneco.nl",108],["salomon.com",110],["blackpoolgazette.co.uk",111],["lep.co.uk",111],["northamptonchron.co.uk",111],["scotsman.com",111],["shieldsgazette.com",111],["thestar.co.uk",111],["portsmouth.co.uk",111],["sunderlandecho.com",111],["northernirelandworld.com",111],["3addedminutes.com",111],["anguscountyworld.co.uk",111],["banburyguardian.co.uk",111],["bedfordtoday.co.uk",111],["biggleswadetoday.co.uk",111],["bucksherald.co.uk",111],["burnleyexpress.net",111],["buxtonadvertiser.co.uk",111],["chad.co.uk",111],["daventryexpress.co.uk",111],["derbyshiretimes.co.uk",111],["derbyworld.co.uk",111],["derryjournal.com",111],["dewsburyreporter.co.uk",111],["doncasterfreepress.co.uk",111],["falkirkherald.co.uk",111],["fifetoday.co.uk",111],["glasgowworld.com",111],["halifaxcourier.co.uk",111],["harboroughmail.co.uk",111],["harrogateadvertiser.co.uk",111],["hartlepoolmail.co.uk",111],["hemeltoday.co.uk",111],["hucknalldispatch.co.uk",111],["lancasterguardian.co.uk",111],["leightonbuzzardonline.co.uk",111],["lincolnshireworld.com",111],["liverpoolworld.uk",111],["londonworld.com",111],["lutontoday.co.uk",111],["manchesterworld.uk",111],["meltontimes.co.uk",111],["miltonkeynes.co.uk",111],["newcastleworld.com",111],["newryreporter.com",111],["newsletter.co.uk",111],["northantstelegraph.co.uk",111],["northumberlandgazette.co.uk",111],["nottinghamworld.com",111],["peterboroughtoday.co.uk",111],["rotherhamadvertiser.co.uk",111],["stornowaygazette.co.uk",111],["surreyworld.co.uk",111],["thescarboroughnews.co.uk",111],["thesouthernreporter.co.uk",111],["totallysnookered.com",111],["wakefieldexpress.co.uk",111],["walesworld.com",111],["warwickshireworld.com",111],["wigantoday.net",111],["worksopguardian.co.uk",111],["yorkshireeveningpost.co.uk",111],["yorkshirepost.co.uk",111],["eurocard.com",112],["saseurobonusmastercard.se",113],["barrons.com>>",114],["tver.jp",115],["linkedin.com",116],["elmundo.es",[117,137]],["expansion.com",117],["s-pankki.fi",118],["srf.ch",118],["alternate.de",118],["bayer04.de",118],["douglas.de",118],["dr-beckmann.com",118],["falke.com",118],["fitnessfirst.de",118],["flaschenpost.de",118],["gloeckle.de",118],["hornbach.nl",118],["hypofriend.de",118],["lactostop.de",118],["neumann.com",118],["post.ch",118],["postbank.de",118],["rts.ch",118],["zalando.*",118],["immowelt.de",119],["joyn.*",119],["morenutrition.de",119],["mapillary.com",120],["transfermarkt.com>>",121],["cmp.seznam.cz",122],["marca.com",123],["raiplay.it",124],["raiplaysound.it",124],["consent.faz.net",125],["derstandard.at",125],["derstandard.de",125],["automoto.it",126],["ansa.it",126],["cdt.ch",126],["delladio.it",126],["huffingtonpost.it",126],["internazionale.it",126],["lastampa.it",126],["macitynet.it",126],["moto.it",126],["movieplayer.it",126],["multiplayer.it",126],["repubblica.it",126],["tomshw.it",126],["skuola.net",126],["spaziogames.it",126],["today.it",126],["tuttoandroid.net",126],["tuttotech.net",126],["ilgazzettino.it",127],["ilmessaggero.it",127],["ilsecoloxix.it",127],["weather.com>>",[128,129]],["privacy.motorradonline.de",130],["impulse.de>>",130],["consent.watson.de",130],["consent.kino.de",130],["consent.desired.de",130],["cmpv2.fn.de",130],["spp.nextpit.de",130],["dailystar.co.uk",[131,132,133,134]],["mirror.co.uk",[131,132,133,134]],["idnes.cz",135],["20minutes.fr",136],["20minutos.es",136],["24sata.hr",136],["abc.es",136],["actu.fr",136],["antena3.com",136],["antena3internacional.com",136],["atresmedia.com",136],["atresmediapublicidad.com",136],["atresmediastudios.com",136],["atresplayer.com",136],["autopista.es",136],["belfasttelegraph.co.uk",136],["bemad.es",136],["bonduelle.it",136],["bonniernews.se",136],["bt.se",136],["cadenadial.com",136],["caracol.com.co",136],["cas.sk",136],["charentelibre.fr",136],["ciclismoafondo.es",136],["cnews.fr",136],["cope.es",136],["correryfitness.com",136],["courrier-picard.fr",136],["cuatro.com",136],["decathlon.nl",136],["decathlon.pl",136],["di.se",136],["diariocordoba.com",136],["diariodenavarra.es",136],["diariosur.es",136],["diariovasco.com",136],["diepresse.com",136],["divinity.es",136],["dn.se",136],["dnevnik.hr",136],["dumpert.nl",136],["ebuyclub.com",136],["edreams.de",136],["edreams.net",136],["elcomercio.es",136],["elconfidencial.com",136],["elcorreo.com",136],["eldesmarque.com",136],["eldiario.es",136],["eldiariomontanes.es",136],["elespanol.com",136],["elle.fr",136],["elpais.com",[136,138]],["elperiodico.com",136],["elperiodicodearagon.com",136],["elplural.com",136],["energytv.es",136],["engadget.com",136],["es.ara.cat",136],["euronews.com",136],["europafm.com",136],["expressen.se",136],["factoriadeficcion.com",136],["filmstarts.de",136],["flooxernow.com",136],["folkbladet.nu",136],["footmercato.net",136],["france.tv",136],["france24.com",136],["fussballtransfers.com",136],["ghacks.net",136],["gva.be",136],["hbvl.be",136],["heraldo.es",136],["hoy.es",136],["ideal.es",136],["idealista.pt",136],["krone.at",136],["kurier.at",136],["lacoste.com",136],["ladepeche.fr",136],["lalibre.be",136],["lanouvellerepublique.fr",136],["larazon.es",136],["lasexta.com",136],["lasprovincias.es",136],["latribune.fr",136],["lavanguardia.com",136],["laverdad.es",136],["lavozdegalicia.es",136],["leboncoin.fr",136],["lecturas.com",136],["ledauphine.com",136],["lejsl.com",136],["leparisien.fr",136],["lesoir.be",136],["letelegramme.fr",136],["libremercado.com",136],["localeyes.dk",136],["los40.com",136],["lotoquebec.com",136],["lunion.fr",136],["m6.fr",136],["marianne.cz",136],["marmiton.org",136],["mediaset.es",136],["melodia-fm.com",136],["metronieuws.nl",136],["moviepilot.de",136],["mtmad.es",136],["multilife.com.pl",136],["naszemiasto.pl",136],["nationalgeographic.com.es",136],["nicematin.com",136],["nieuwsblad.be",136],["notretemps.com",136],["numerama.com",136],["okdiario.com",136],["ondacero.es",136],["podiumpodcast.com",136],["portail.lotoquebec.com",136],["profil.at",136],["public.fr",136],["publico.es",136],["radiofrance.fr",136],["rankia.com",136],["rfi.fr",136],["rossmann.pl",136],["rtbf.be",[136,235]],["rtl.lu",136],["sensacine.com",136],["sfgame.net",136],["shure.com",136],["silicon.es",136],["sncf-connect.com",136],["sport.es",136],["sydsvenskan.se",136],["techcrunch.com",136],["telegraaf.nl",136],["telequebec.tv",136],["tf1.fr",136],["tradingsat.com",136],["trailrun.es",136],["video-streaming.orange.fr",136],["xpress.fr",136],["laprovincia.es",137],["informacion.es",137],["tportal.hr",137],["ivoox.com",137],["as.com",137],["slam.nl",137],["bienpublic.com",137],["funradio.fr",137],["gamepro.de",[137,203,204]],["lemon.fr",137],["lexpress.fr",137],["shadow.tech",137],["letemps.ch",137],["mein-mmo.de",137],["heureka.sk",137],["film.at",137],["dhnet.be",137],["lesechos.fr",[137,241]],["marianne.net",[137,235]],["jeanmarcmorandini.com",[137,236]],["dna.fr",137],["sudinfo.be",137],["europe1.fr",[137,236]],["rtl.be",[137,235]],["reviewingthebrew.com",137],["jaysjournal.com",137],["reignoftroy.com",137],["cdn.privacy-mgmt.com",[139,273]],["cmp.motorsport-magazin.com",140],["ryobitools.eu",[141,142]],["americanexpress.com",143],["rtvc.es>>",144],["beteve.cat>>",145],["whatcar.com>>",145],["bloodyelbow.com>>",146],["consent.radiotimes.com",146],["sp-consent.szbz.de",147],["cmp.omni.se",148],["cmp.svd.se",148],["cmp.aftonbladet.se",148],["cmp.tv.nu",148],["weltkunst.de>>",149],["consent.economist.com",150],["studentagency.cz",150],["driving.co.uk>>",151],["cmpv2.foundryco.com",151],["cmpv2.infoworld.com",151],["cmpv2.arnnet.com.au",151],["sp-cdn.pcgames.de",152],["sp-cdn.pcgameshardware.de",152],["consentv2.sport1.de",152],["boerse-online.de>>",152],["cmp.mz.de",152],["cmpv2.tori.fi",153],["tidende.dk>>",154],["consent.spielaffe.de",155],["bondekompaniet.no",156],["degiro.*",156],["epochtimes.de",156],["vikingline.com",156],["tfl.gov.uk",156],["drklein.de",156],["hildegardis-krankenhaus.de",156],["kleer.se",156],["lekiaviation.com",156],["lotto.pl",156],["mineralstech.com",156],["volunteer.digitalboost.org.uk",156],["starhotels.com",156],["tefl.com",156],["universumglobal.com",156],["tui.com",157],["rexel.*",158],["csob.sk",159],["greenstuffworld.com",160],["morele.net",[161,162]],["1und1.de",163],["infranken.de",164],["cmp.tvspielfilm.de",165],["cmp.tvtoday.de",165],["cmp.bunte.de",165],["cmp.chip.de",165],["cmp.focus.de",[165,523]],["stol.it>>",165],["estadiodeportivo.com",166],["tameteo.*",166],["tempo.pt",166],["meteored.*",166],["pogoda.com",166],["yourweather.co.uk",166],["tempo.com",166],["theweather.net",166],["tiempo.com",166],["ilmeteo.net",166],["daswetter.com",166],["kicker.de",167],["formulatv.com",168],["web.de",169],["lefigaro.fr",170],["linternaute.com",171],["consent.caminteresse.fr",172],["volksfreund.de",173],["rp-online.de",173],["dailypost.co.uk",174],["the-express.com",174],["vide-greniers.org",174],["dailyrecord.co.uk",175],["bluray-disc.de",176],["elio-systems.com",176],["stagatha-fachklinik.de",176],["tarife.mediamarkt.de",176],["lz.de",176],["gaggenau.com",176],["saturn.de",177],["eltiempo.es",[178,179]],["otempo.pt",180],["atlasformen.*",181],["cmp-sp.goettinger-tageblatt.de",182],["cmp-sp.saechsische.de",182],["cmp-sp.ln-online.de",182],["cz.de",182],["dewezet.de",182],["dnn.de",182],["haz.de",182],["gnz.de",182],["landeszeitung.de",182],["lvz.de",182],["maz-online.de",182],["ndz.de",182],["op-marburg.de",182],["ostsee-zeitung.de",182],["paz-online.de",182],["reisereporter.de",182],["rga.de",182],["rnd.de",182],["siegener-zeitung.de",182],["sn-online.de",182],["solinger-tageblatt.de",182],["sportbuzzer.de",182],["szlz.de",182],["tah.de",182],["torgauerzeitung.de",182],["waz-online.de",182],["privacy.maennersache.de",182],["refinery29.com>>",183],["sinergy.ch",184],["agglo-valais-central.ch",184],["biomedcentral.com",185],["hsbc.*",186],["hsbcnet.com",186],["hsbcinnovationbanking.com",186],["create.hsbc",186],["gbm.hsbc.com",186],["hsbc.co.uk",187],["internationalservices.hsbc.com",187],["history.hsbc.com",187],["about.hsbc.co.uk",188],["privatebanking.hsbc.com",189],["independent.co.uk",192],["privacy.crash.net",192],["the-independent.com",193],["argos.co.uk",195],["poco.de",[196,198]],["moemax.*",196],["xxxlutz.*",196],["xxxlesnina.*",196],["moebel.de",[197,198]],["mobi24.es",197],["moebel24.ch",[197,198]],["moebel24.at",[197,198]],["meubelo.nl",[197,198]],["mobi24.it",197],["meubles.fr",[197,198]],["living24.uk",197],["living24.pl",197],["lipo.ch",199],["schubiger.ch",200],["aedt.de",201],["berlin-live.de",201],["bike-magazin.de",201],["connect.de",201],["gutefrage.net",201],["insideparadeplatz.ch",201],["morgenpost.de",201],["thueringen24.de",201],["pdfupload.io",202],["gamestar.de",[203,204,245]],["verksamt.se",205],["acmemarkets.com",206],["amtrak.com",206],["beko.com",206],["bepanthen.com.au",206],["berocca.com.au",206],["booking.com",206],["carrefour.fr",206],["centrum.sk",206],["claratyne.com.au",206],["credit-suisse.com",206],["ceskatelevize.cz",206],["deporvillage.*",206],["de.vanguard",206],["dhl.de",206],["digikey.*",206],["drafthouse.com",206],["dunelm.com",206],["eurosport.fr",206],["fello.se",206],["fielmann.*",206],["flashscore.fr",206],["flightradar24.com",206],["fnac.es",206],["foodandwine.com",206],["fourseasons.com",206],["khanacademy.org",206],["konami.com",206],["jll.*",206],["jobs.redbull.com",206],["hellenicbank.com",206],["gemini.pl",206],["groceries.asda.com",206],["lamborghini.com",206],["menshealth.com",206],["n26.com",206],["nintendo.com",206],["nokia.com",206],["oneweb.net",206],["omnipod.com",206],["oralb.*",206],["panasonic.com",206],["parkside-diy.com",206],["pluto.tv",206],["popularmechanics.com",206],["polskieradio.pl",206],["pringles.com",206],["questdiagnostics.com",206],["radissonhotels.com",206],["ricardo.ch",206],["rockstargames.com",206],["rte.ie",206],["salesforce.com",206],["samsonite.*",206],["spiele.heise.de",206],["spirit.com",206],["stenaline.co.uk",206],["swisscom.ch",206],["swisspass.ch",206],["technologyfromsage.com",206],["telenet.be",206],["tntsports.co.uk",206],["theepochtimes.com",206],["toujeo.com",206],["uber-platz.de",206],["vinted.com",206],["wallapop.com",206],["wickes.co.uk",206],["workingtitlefilms.com",206],["vattenfall.de",206],["winparts.fr",206],["yoigo.com",206],["zoominfo.com",206],["allegiantair.com",207],["hallmarkchannel.com",207],["incorez.com",207],["noovle.com",207],["otter.ai",207],["plarium.com",207],["telsy.com",207],["timenterprise.it",207],["tim.it",207],["tradersunion.com",207],["fnac.*",207],["yeti.com",207],["here.com",[208,704]],["vodafone.com",208],["kooora.com>>",209],["cmp.heise.de",[210,211]],["cmp.am-online.com",210],["cmp.motorcyclenews.com",210],["consent.newsnow.co.uk",210],["cmp.todays-golfer.com",210],["koeser.com",212],["shop.schaette-pferd.de",212],["schaette.de",212],["central-bb.de",213],["fitnessfoodcorner.de",214],["kuehlungsborn.de",215],["espressocoffeeshop.com",216],["brainmarket.pl",217],["getroots.app",218],["cart-in.re",[219,629]],["prestonpublishing.pl",220],["zara.com",221],["lepermislibre.fr",221],["negociardivida.spcbrasil.org.br",222],["pons.com",223],["adidas.*",224],["privacy.topreality.sk",225],["privacy.autobazar.eu",225],["vu.lt",226],["adnkronos.com",[227,228]],["cornwalllive.com",[227,228]],["cyprus-mail.com",[227,228]],["einthusan.tv",[227,228]],["informazione.it",[227,228]],["mymovies.it",[227,228]],["tuttoeuropei.com",[227,228]],["video.lacnews24.it",[227,228]],["protothema.gr",227],["flash.gr",227],["taxscouts.com",229],["heute.at>>",230],["online.no",231],["telenor.no",231],["austrian.com",232],["lufthansa.com",232],["kampfkunst-herz.de",233],["glow25.de",233],["h-f.at",233],["hornetsecurity.com",233],["ifun.de",233],["kayzen.io",233],["straschu-ev.de",233],["wasserkunst-hamburg.de",233],["zahnspange-oelde.de",233],["xinedome.de",234],["bnc.ca",235],["egora.fr",235],["engelvoelkers.com",235],["estrategiasdeinversion.com",235],["festo.com",235],["francebleu.fr",235],["francemediasmonde.com",235],["geny.com",235],["giphy.com",235],["idealista.com",235],["infolibre.es",235],["inpost.pl",235],["information.tv5monde.com",235],["ing.es",235],["knipex.de",235],["laprovence.com",235],["lemondeinformatique.fr",235],["libertaddigital.com",235],["mappy.com",235],["orf.at",235],["philibertnet.com",235],["researchgate.net",235],["standaard.be",235],["stroilioro.com",235],["taxfix.de",235],["telecinco.es",235],["vistaalegre.com",235],["wsp.com",235],["zimbra.free.fr",235],["tribecawine.com",237],["usinenouvelle.com",238],["reussir.fr",240],["bruendl.at",242],["latamairlines.com",243],["elisa.ee",244],["baseendpoint.brigitte.de",245],["baseendpoint.gala.de",245],["baseendpoint.haeuser.de",245],["baseendpoint.stern.de",245],["baseendpoint.urbia.de",245],["cmp.tag24.de",245],["cmp-sp.handelsblatt.com",245],["cmpv2.berliner-zeitung.de",245],["golem.de",245],["rockhard.de>>",245],["consent.t-online.de",245],["sp-consent.stuttgarter-nachrichten.de",246],["btc-echo.de>>",246],["sp-consent.stuttgarter-zeitung.de",246],["regjeringen.no",247],["sp-manager-magazin-de.manager-magazin.de",248],["consent.11freunde.de",248],["f1academy.com>>",249],["timeout.com>>",[249,250]],["karlsruhe-insider.de>>",251],["promiflash.de>>",252],["wallester.com",253],["centrum24.pl",254],["replay.lsm.lv",255],["ltv.lsm.lv",255],["bernistaba.lsm.lv",255],["verl.de",256],["cubo-sauna.de",256],["mbl.is",256],["auto-medienportal.net",256],["mobile.de",257],["cookist.it",258],["fanpage.it",258],["geopop.it",258],["lexplain.it",258],["royalmail.com",259],["gmx.net",260],["gmx.ch",261],["mojehobby.pl",262],["super-hobby.*",262],["sp.stylevamp.de",[263,264]],["cmp.wetteronline.de",263],["sp.stylevamp.com",264],["audi.*",[265,266]],["easyjet.com",265],["experian.co.uk",265],["postoffice.co.uk",265],["tescobank.com",265],["internetaptieka.lv",[267,268]],["nike.com",269],["wells.pt",270],["dskdirect.bg",271],["cmpv2.dba.dk",272],["spcmp.crosswordsolver.com",273],["gbnews.com>>",[273,633]],["homary.com",[274,275]],["ecco.com",276],["georgjensen.com",276],["thomann.*",277],["landkreis-kronach.de",278],["effectiefgeven.be",279],["northcoast.com",279],["chaingpt.org",279],["bandenconcurrent.nl",280],["bandenexpert.be",280],["reserved.com",281],["metro.it",282],["makro.es",282],["metro.sk",282],["metro-cc.hr",282],["makro.nl",282],["metro.bg",282],["metro.at",282],["metro-tr.com",282],["metro.de",282],["metro.fr",282],["makro.cz",282],["metro.ro",282],["makro.pt",282],["makro.pl",282],["sklepy-odido.pl",282],["rastreator.com",282],["metro.ua",283],["metro.rs",283],["metro-kz.com",283],["metro.md",283],["metro.hu",283],["metro-cc.ru",283],["metro.pk",283],["balay.es",284],["constructa.com",284],["dafy-moto.com",285],["akku-shop.nl",286],["akkushop-austria.at",286],["akkushop-b2b.de",286],["akkushop.de",286],["akkushop.dk",286],["batterie-boutique.fr",286],["akkushop-schweiz.ch",287],["evzuttya.com.ua",288],["eobuv.cz",288],["eobuwie.com.pl",288],["ecipele.hr",288],["eavalyne.lt",288],["chaussures.fr",288],["ecipo.hu",288],["eobuv.sk",288],["epantofi.ro",288],["epapoutsia.gr",288],["escarpe.it",288],["eschuhe.de",288],["obuvki.bg",288],["zapatos.es",288],["swedbank.ee",289],["mudanzavila.es",290],["bienmanger.com",291],["gesipa.*",292],["gesipausa.com",292],["beckhoff.com",292],["zitekick.dk",293],["eltechno.dk",293],["okazik.pl",293],["batteryempire.*",294],["maxi.rs",295],["garmin.com",296],["invisalign.*",296],["one4all.ie",296],["osprey.com",296],["wideroe.no",297],["bmw.*",298],["kijk.nl",299],["nordania.dk",300],["danskebank.*",300],["danskeci.com",300],["danica.dk",300],["dehn.*",301],["gewerbegebiete.de",302],["cordia.fr",303],["vola.fr",304],["lafi.fr",305],["skyscanner.*",306],["coolblue.*",307],["chipotle.com",308],["sanareva.*",309],["atida.fr",309],["bbva.*",310],["bbvauk.com",310],["expertise.unimi.it",311],["altenberg.de",312],["vestel.es",313],["tsb.co.uk",314],["buienradar.nl",[315,316]],["linsenplatz.de",317],["budni.de",318],["erstecardclub.hr",318],["teufel.de",[319,320]],["abp.nl",321],["simplea.sk",322],["flip.bg",323],["kiertokanki.com",324],["supla.fi>>",325],["leirovins.be",326],["vias.be",327],["edf.fr",328],["virbac.com",328],["diners.hr",328],["squarehabitat.fr",328],["arbitrobancariofinanziario.it",329],["ivass.it",329],["economiapertutti.bancaditalia.it",329],["smit-sport.de",330],["gekko-computer.de",330],["jysk.al",331],["go-e.com",332],["malerblatt-medienservice.de",333],["architekturbuch.de",333],["medienservice-holz.de",333],["leuchtstark.de",333],["casius.nl",334],["coolinarika.com",335],["giga-hamburg.de",335],["vakgaragevannunen.nl",335],["fortuluz.es",335],["finna.fi",335],["eurogrow.es",335],["paid.ai",335],["topnatur.cz",335],["topnatur.eu",335],["vakgarage.nl",335],["whufc.com",335],["zomaplast.cz",335],["envafors.dk",336],["dabbolig.dk",[337,338]],["daruk-emelok.hu",339],["exakta.se",340],["larca.de",341],["roli.com",342],["okazii.ro",343],["lr-shop-direkt.de",343],["portalprzedszkolny.pl",343],["tgvinoui.sncf",344],["l-bank.de",345],["interhyp.de",346],["indigoneo.*",347],["transparency.meta.com",348],["dojusagro.lt",349],["eok.ee",349],["kripa.it",349],["gameinformer.com",349],["nextdaycatering.co.uk",349],["safran-group.com",349],["sr-ramenendeuren.be",349],["ilovefreegle.org",349],["tribexr.com",349],["understandingsociety.ac.uk",349],["bestbuycyprus.com",350],["strato.*",351],["strato-hosting.co.uk",351],["auto.de",352],["contentkingapp.com",353],["comune.palermo.it",354],["get-in-engineering.de",355],["spp.nextpit.com",356],["spp.nextpit.es",357],["spp.nextpit.it",358],["spp.nextpit.com.br",359],["spp.nextpit.fr",360],["otterbox.com",361],["stoertebeker-brauquartier.com",362],["stoertebeker.com",362],["stoertebeker-eph.com",362],["aparts.pl",363],["sinsay.com",[364,365]],["benu.cz",366],["stockholmresilience.org",367],["ludvika.se",367],["kammarkollegiet.se",367],["cazenovecapital.com",368],["statestreet.com",369],["beopen.lv",370],["cesukoncertzale.lv",371],["dodo.fr",372],["makelaarsland.nl",373],["bezirk-schwaben.de",374],["dorfen.de",374],["nutsinbulk.co.uk",375],["bricklink.com",376],["bestinver.es",377],["icvs2023.conf.tuwien.ac.at",378],["racshop.co.uk",[379,380]],["baabuk.com",381],["sapien.io",381],["tradedoubler.com",381],["app.lepermislibre.fr",382],["multioferta.es",383],["testwise.com",[384,385]],["tonyschocolonely.com",386],["fitplus.is",386],["fransdegrebber.nl",386],["lilliputpress.ie",386],["lexibo.com",386],["marin-milou.com",386],["dare2tri.com",386],["t3micro.*",386],["la-vie-naturelle.com",[387,388]],["inovelli.com",389],["uonetplus.vulcan.net.pl",[390,391]],["consent.helagotland.se",392],["oper.koeln",[393,394]],["deezer.com",395],["hoteldesartssaigon.com",396],["autoritedelaconcurrence.fr",397],["groupeonepoint.com",397],["geneanet.org",397],["carrieres.groupegalerieslafayette.com",397],["immo-banques.fr",397],["lingvanex.com",397],["turncamp.com",398],["ejobs.ro",[399,400]],["kupbilecik.*",[401,402]],["coolbe.com",403],["serienjunkies.de",404],["computerhoy.20minutos.es",405],["clickskeks.at",406],["clickskeks.de",406],["abt-sportsline.de",406],["wittmann-group.com",406],["exemplary.ai",407],["forbo.com",407],["stores.sk",407],["nerdstar.de",407],["prace.cz",407],["profesia.sk",407],["profesia.cz",407],["pracezarohem.cz",407],["atmoskop.cz",407],["seduo.sk",407],["seduo.cz",407],["teamio.com",407],["arnold-robot.com",407],["cvonline.lt",407],["cv.lv",407],["cv.ee",407],["dirbam.lt",407],["visidarbi.lv",407],["otsintood.ee",407],["webtic.it",407],["gerth.de",408],["pamiatki.pl",409],["initse.com",410],["salvagny.org",411],["augsburger-allgemeine.de",412],["stabila.com",413],["stwater.co.uk",414],["suncalc.org",[415,416]],["swisstph.ch",417],["taxinstitute.ie",418],["get-in-it.de",419],["tempcover.com",[420,421]],["guildford.gov.uk",422],["easyparts.*",[423,424]],["easyparts-recambios.es",[423,424]],["easyparts-rollerteile.de",[423,424]],["drimsim.com",425],["canyon.com",[426,427,428]],["vevovo.be",[429,430]],["vendezvotrevoiture.be",[429,430]],["wirkaufendeinauto.at",[429,430]],["vikoberallebiler.dk",[429,430]],["wijkopenautos.nl",[429,430]],["vikoperdinbil.se",[429,430]],["noicompriamoauto.it",[429,430]],["vendezvotrevoiture.fr",[429,430]],["compramostucoche.es",[429,430]],["wijkopenautos.be",[429,430]],["auto-doc.*",431],["autodoc.*",431],["autodoc24.*",431],["topautoosat.fi",431],["autoteiledirekt.de",431],["autoczescionline24.pl",431],["tuttoautoricambi.it",431],["onlinecarparts.co.uk",431],["autoalkatreszek24.hu",431],["autodielyonline24.sk",431],["reservdelar24.se",431],["pecasauto24.pt",431],["reservedeler24.co.no",431],["piecesauto24.lu",431],["rezervesdalas24.lv",431],["besteonderdelen.nl",431],["recambioscoche.es",431],["antallaktikaexartimata.gr",431],["piecesauto.fr",431],["teile-direkt.ch",431],["lpi.org",432],["divadelniflora.cz",433],["mahle-aftermarket.com",434],["refurbed.*",435],["eingutertag.org",436],["flyingtiger.com",[436,579]],["borgomontecedrone.it",436],["maharishistore.com",436],["recaro-shop.com",436],["gartenhotel-crystal.at",436],["fayn.com",437],["serica-watches.com",437],["sklavenitis.gr",438],["eam-netz.de",439],["umicore.*",440],["veiligverkeer.be",440],["vsv.be",440],["dehogerielen.be",440],["gera.de",441],["mfr-chessy.fr",442],["mfr-lamure.fr",442],["mfr-saint-romain.fr",442],["mfr-lapalma.fr",442],["mfrvilliemorgon.asso.fr",442],["mfr-charentay.fr",442],["mfr.fr",442],["nationaltrust.org.uk",443],["hej-natural.*",444],["ib-hansmeier.de",445],["rsag.de",446],["esaa-eu.org",446],["aknw.de",446],["answear.*",447],["theprotocol.it",[448,449]],["lightandland.co.uk",450],["etransport.pl",451],["wohnen-im-alter.de",452],["johnmuirhealth.com",[453,454]],["markushaenni.com",455],["airbaltic.com",456],["gamersgate.com",456],["zorgzaam010.nl",457],["etos.nl",458],["paruvendu.fr",459],["privacy.bazar.sk",460],["hennamorena.com",461],["newsello.pl",462],["porp.pl",463],["golfbreaks.com",464],["lieferando.de",465],["just-eat.*",465],["justeat.*",465],["pyszne.pl",465],["lieferando.at",465],["takeaway.com",465],["thuisbezorgd.nl",465],["holidayhypermarket.co.uk",466],["unisg.ch",467],["wassererleben.ch",467],["psgaz.pl",468],["play-asia.com",469],["centralthe1card.com",470],["atu.de",471],["atu-flottenloesungen.de",471],["but.fr",471],["edeka.de",471],["fortuneo.fr",471],["maif.fr",471],["meteo.tf1.fr",471],["particuliers.sg.fr",471],["sparkasse.at",471],["group.vig",471],["tf1info.fr",471],["dpdgroup.com",472],["dpd.com",472],["cosmosdirekt.de",472],["bstrongoutlet.pt",473],["isarradweg.de",[474,475]],["flaxmanestates.com",475],["inland-casas.com",475],["finlayson.fi",[476,477]],["cowaymega.ca",[476,477]],["arktis.de",478],["desktronic.de",478],["belleek.com",478],["brauzz.com",478],["cowaymega.com",478],["dockin.de",478],["dryrobe.com",[478,479]],["formswim.com",478],["hairtalk.se",478],["hallmark.co.uk",[478,479]],["loopearplugs.com",[478,479]],["oleus.com",478],["peopleofshibuya.com",478],["pullup-dip.com",478],["sanctum.shop",478],["tbco.com",478],["desktronic.*",479],["hq-germany.com",479],["tepedirect.com",479],["maxi-pet.ro",479],["paper-republic.com",479],["pullup-dip.*",479],["vitabiotics.com",479],["smythstoys.com",480],["beam.co.uk",[481,482]],["autobahn.de",483],["krakow.pl",484],["shop.app",485],["shopify.com",485],["wufoo.com",486],["consent.dailymotion.com",487],["laposte.fr",487],["help.instagram.com",488],["crazygames.com>>",[489,691]],["consent-manager.thenextweb.com",490],["consent-cdn.zeit.de",491],["coway-usa.com",492],["steiners.shop",493],["ecmrecords.com",494],["cigarjournal.com",494],["invidis.com",494],["malaikaraiss.com",494],["koch-mit.de",494],["zeitreisen.zeit.de",494],["wefashion.com",495],["merkur.dk",496],["ionos.*",498],["omegawatches.com",499],["carefully.be",500],["aerotime.aero",500],["rocket-league.com",501],["dws.com",502],["bosch-homecomfort.com",503],["elmleblanc-optibox.fr",503],["monservicechauffage.fr",503],["boschrexroth.com",503],["home-connect.com",504],["lowrider.at",[505,506]],["mesto.de",507],["intersport.gr",508],["intersport.bg",508],["intersport.com.cy",508],["intersport.ro",508],["ticsante.com",509],["techopital.com",509],["millenniumprize.org",510],["hepster.com",511],["peterstaler.de",512],["blackforest-still.de",512],["tiendaplayaundi.com",513],["ajtix.co.uk",514],["raja.fr",515],["rajarani.de",515],["rajapack.*",[515,516]],["avery-zweckform.com",517],["1xinternet.com",517],["futterhaus.de",517],["dasfutterhaus.at",517],["frischeparadies.de",517],["fmk-steuer.de",517],["selgros.de",517],["transgourmet.de",517],["mediapart.fr",518],["athlon.com",519],["alumniportal-deutschland.org",520],["snoopmedia.com",520],["myguide.de",520],["daad.de",520],["cornelsen.de",[521,522]],["vinmonopolet.no",524],["tvp.info",525],["tvp.pl",525],["tvpworld.com",525],["brtvp.pl",525],["tvpparlament.pl",525],["belsat.eu",525],["warnung.bund.de",526],["mediathek.lfv-bayern.de",527],["allegro.*",528],["allegrolokalnie.pl",528],["ceneo.pl",528],["czc.cz",528],["eon.pl",[529,530]],["ylasatakunta.fi",[531,532]],["mega-image.ro",533],["louisvuitton.com",534],["bodensee-airport.eu",535],["department56.com",536],["allendesignsstudio.com",536],["designsbylolita.co",536],["shop.enesco.com",536],["savoriurbane.com",537],["miumiu.com",538],["church-footwear.com",538],["clickdoc.fr",539],["car-interface.com",540],["monolithdesign.it",540],["thematchahouse.com",540],["smileypack.de",[541,542]],["finom.co",543],["orange.es",[544,545]],["fdm-travel.dk",546],["hummel.dk",546],["jysk.nl",546],["power.no",546],["skousen.dk",546],["velliv.dk",546],["whiteaway.com",546],["whiteaway.no",546],["whiteaway.se",546],["skousen.no",546],["energinet.dk",546],["elkjop.no",546],["medimax.de",547],["costautoricambi.com",548],["lotto.it",548],["readspeaker.com",548],["team.blue",548],["ibistallinncenter.ee",549],["aaron.ai",550],["futureverse.com",551],["tandem.co.uk",551],["insights.com",552],["thebathcollection.com",553],["coastfashion.com",[554,555]],["oasisfashion.com",[554,555]],["warehousefashion.com",[554,555]],["misspap.com",[554,555]],["karenmillen.com",[554,555]],["boohooman.com",[554,555]],["hdt.de",556],["wolt.com",557],["xohotels.com",558],["sourcepoint.theguardian.com",[558,720]],["sim24.de",559],["tnt.com",560],["uza.be",561],["uzafoundation.be",561],["uzajobs.be",561],["bergzeit.*",[562,563]],["cinemas-lumiere.com",564],["cdiscount.com",565],["brabus.com",566],["roborock.com",567],["strumentimusicali.net",568],["maisonmargiela.com",569],["webfleet.com",570],["dragonflyshipping.ca",571],["broekhuis.nl",572],["groningenairport.nl",572],["nemck.cz",573],["zdfheute.de",574],["sap-press.com",575],["roughguides.com",[576,577]],["korvonal.com",578],["rexbo.*",580],["itau.com.br",581],["bbg.gv.at",582],["portal.taxi.eu",583],["topannonces.fr",584],["homap.fr",585],["artifica.fr",586],["plan-interactif.com",586],["ville-cesson.fr",586],["moismoliere.com",587],["unihomes.co.uk",588],["bkk.hu",589],["coiffhair.com",590],["ptc.eu",591],["ziegert-group.com",[592,701]],["lassuranceretraite.fr",593],["interieur.gouv.fr",593],["toureiffel.paris",593],["economie.gouv.fr",593],["education.gouv.fr",593],["livoo.fr",593],["su.se",593],["zappo.fr",593],["smdv.de",594],["digitalo.de",594],["petiteamelie.*",595],["mojanorwegia.pl",596],["koempf24.ch",[597,598]],["teichitekten24.de",[597,598]],["koempf24.de",[597,598]],["wolff-finnhaus-shop.de",[597,598]],["asnbank.nl",599],["blgwonen.nl",599],["regiobank.nl",599],["snsbank.nl",599],["vulcan.net.pl",[600,601]],["ogresnovads.lv",602],["partenamut.be",603],["pirelli.com",604],["unicredit.it",605],["effector.pl",606],["zikodermo.pl",[607,608]],["devolksbank.nl",609],["caixabank.es",610],["me.motorsport.com>>",611],["motorsport.com>>",612],["cyberport.de",613],["cyberport.at",613],["slevomat.cz",614],["kfzparts24.de",615],["runnersneed.com",616],["aachener-zeitung.de",617],["sportpursuit.com",618],["druni.es",[619,630]],["druni.pt",[619,630]],["delta.com",620],["onliner.by",[621,622]],["vejdirektoratet.dk",623],["usaa.com",624],["consorsbank.de",625],["metroag.de",626],["kupbilecik.pl",627],["oxfordeconomics.com",628],["routershop.nl",629],["woo.pt",629],["e-jumbo.gr",631],["alza.*",632],["rmf.fm",634],["rmf24.pl",634],["tracfone.com",635],["lequipe.fr",636],["global.abb",637],["gala.fr",638],["purepeople.com",639],["3sat.de",640],["zdf.de",640],["filmfund.lu",641],["welcometothejungle.com",641],["triblive.com",642],["rai.it",643],["fbto.nl",644],["europa.eu",645],["caisse-epargne.fr",646],["banquepopulaire.fr",646],["bigmammagroup.com",647],["studentagency.sk",647],["studentagency.eu",647],["winparts.be",648],["winparts.nl",648],["winparts.eu",649],["winparts.ie",649],["winparts.se",649],["sportano.*",[650,651]],["crocs.*",652],["chronext.ch",653],["chronext.de",653],["chronext.at",653],["chronext.com",654],["chronext.co.uk",654],["chronext.fr",655],["chronext.nl",656],["chronext.it",657],["galerieslafayette.com",658],["bazarchic.com",659],["stilord.*",660],["tiko.pt",661],["nsinternational.com",662],["meinbildkalender.de",663],["gls-group.com",664],["gls-group.eu",664],["univie.ac.at",664],["chilis.com",665],["account.bhvr.com",667],["everand.com",667],["lucidchart.com",667],["intercars.ro",[667,668]],["scribd.com",667],["guidepoint.com",667],["erlebnissennerei-zillertal.at",669],["hintertuxergletscher.at",669],["tiwag.at",669],["playseatstore.com",670],["tivify.tv>>",671],["swiss-sport.tv",672],["targobank-magazin.de",673],["zeit-verlagsgruppe.de",673],["online-physiotherapie.de",673],["adisfaction.ch",674],["kieferorthopaede-freisingsmile.de",674],["jockenhoefer.de",674],["nltraining.nl",675],["kmudigital.at",676],["mintysquare.com",677],["consent.thetimes.com",678],["cadenaser.com",679],["berlinale.de",680],["lebonlogiciel.com",681],["iberiaexpress.com",682],["easycosmetic.ch",683],["pharmastar.it",684],["washingtonpost.com",685],["brillenplatz.de",686],["angelplatz.de",686],["dt.mef.gov.it",687],["raffeldeals.com",688],["stepstone.de",689],["kobo.com",690],["zoxs.de",692],["offistore.fi",693],["collinsaerospace.com",694],["radioapp.lv",697],["hagengrote.de",698],["hemden-meister.de",698],["vorteilshop.com",699],["capristores.gr",700],["getaround.com",702],["technomarket.bg",703],["epiphone.com",705],["gibson.com",705],["maestroelectronics.com",705],["cropp.com",[706,707]],["housebrand.com",[706,707]],["mohito.com",[706,707]],["autoczescizielonki.pl",708],["b-s.de",709],["novakid.pl",710],["piecesauto24.com",711],["earpros.com",712],["portalridice.cz",713],["kitsapcu.org",714],["nutsinbulk.*",715],["berlin-buehnen.de",716],["metropoliten.rs",717],["educa2.madrid.org",718],["immohal.de",719],["rtlplay.be",721],["natgeotv.com",721],["llama.com",722],["meta.com",722],["setasdesevilla.com",723],["cruyff-foundation.org",724],["allianz.*",725],["energiedirect-bayern.de",726],["postnl.be",727],["postnl.nl",727],["sacyr.com",728],["volkswagen-newsroom.com",729],["openbank.*",730],["tagus-eoficina.grupogimeno.com",731],["tidal.com",732],["knax.de",733],["ordblindenetvaerket.dk",734],["boligbeton.dk",734],["dukh.dk",734],["pevgrow.com",735],["ya.ru",736],["ipolska24.pl",737],["17bankow.com",737],["kazimierzdolny.pl",737],["vpolshchi.pl",737],["dobreprogramy.pl",[737,738]],["essanews.com",737],["money.pl",737],["autokult.pl",737],["komorkomania.pl",737],["polygamia.pl",737],["autocentrum.pl",737],["homebook.pl",737],["domodi.pl",737],["jastrzabpost.pl",737],["open.fm",737],["gadzetomania.pl",737],["fotoblogia.pl",737],["abczdrowie.pl",737],["parenting.pl",737],["kafeteria.pl",737],["vibez.pl",737],["wakacje.pl",737],["extradom.pl",737],["totalmoney.pl",737],["superauto.pl",737],["nerwica.com",737],["forum.echirurgia.pl",737],["dailywrap.net",737],["pysznosci.pl",737],["genialne.pl",737],["finansowysupermarket.pl",737],["deliciousmagazine.pl",737],["audioteka.com",737],["easygo.pl",737],["so-magazyn.pl",737],["o2.pl",737],["pudelek.pl",737],["benchmark.pl",737],["wp.pl",737],["altibox.dk",739],["altibox.no",739],["talksport.com",740],["zuiderzeemuseum.nl",741],["gota.io",742],["nwzonline.de",743],["scaleway.com",744],["bistro.sk",745],["spk-schaumburg.de",746],["computerbase.de",747],["comdirect.de",748],["metro.co.uk",749],["imaios.com",750],["myprivacy.dpgmedia.nl",751],["myprivacy.dpgmedia.be",751],["www.dpgmediagroup.com",751],["exxen.com",752],["cbsnews.com",753],["infshop.fi",754],["jimms.fi",755],["avinor.no",756],["accursia-capital.de",757],["joyn.de",758],["oeq.org",759],["codewars.com",760],["formazionepro.it",761]]);
const exceptionsMap = new Map([["facebook.com",[51,52]],["twitter.com",[51,52,53]],["youtube.com",[51,52,53]],["businessinsider.com",[53]],["instagram.com",[53]]]);
const hasEntities = true;
const hasAncestors = true;

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
