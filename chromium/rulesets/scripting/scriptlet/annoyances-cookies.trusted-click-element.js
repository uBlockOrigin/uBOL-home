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
const argsList = [["button#W0wltc","","500"],["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[role=\"dialog\"]:has([href=\"https://www.facebook.com/policies/cookies/\"]) [aria-hidden=\"true\"] + [aria-label][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],["button#cmp-consent-button","","2500"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","800"],["button[title=\"REJECT ALL\"]","","1200"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["button[title=\"I do not agree\"]"],["#qc-cmp2-container button#disagree-btn"],["button#CybotCookiebotDialogBodyButtonDecline"],["#pubtech-cmp button[aria-label=\"Continue without accepting\"]"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button[data-t=\"rejectAll\"]","","1000"],["#gdpr-banner-cmp-button","","1000"],["button[aria-label=\"Datenschutzbestimmungen und Einstellungen ablehnen\"]","","1200"],["#iubenda-cs-banner button.iubenda-cs-close-btn"],["button.message-button[aria-label=\"More Options\"]"],["button.sp_choice_type_REJECT_ALL","","2000"],["button[aria-label=\"Reject All\"]"],["div[data-project=\"mol-fe-cmp\"] button[class*=\"consent\"]:not([class*=\"reject\"])"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[aria-label]","","1000"],["ytm-button-renderer.eom-accept button","","2000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],[".cmp-scroll-padding .cmp-info[style] #cmp-paywall #cmp-consent #cmp-btn-accept","","2000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],["button[title=\"Godta alle\"]","","1000"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button.glue-cookie-notification-bar__reject","","1000"],["button[data-gdpr-expression=\"acceptAll\"]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1800"],["button[title^=\"Alle akzeptieren\" i]","","1000"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button.cookie-decline-all","","1800"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[action-name=\"agreeAll\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","2000"],["button.iubenda-cs-close-btn"],["button[title=\"Aceitar todos\"]","","1000"],["button.cta-button[title=\"Tümünü reddet\"]"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#didomi-notice-agree-button"],["#pmConsentWall .pmConsentWall-button:not([href])","","1000","reloadAfterClick:200"],["button#cookie-onetrust-show-info","","900"],[".save-preference-btn-handler","","1100"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["div.decline","","1000"],["button#declineAllConsentSummary","","1500"],["button.deny-btn","","1000"],["span#idxrcookiesKO","","1000"],["button[data-action=\"cookie-consent#onToggleShowManager\"]","","900"],["button[data-action=\"cookie-consent#onSaveSetting\"]","","1200"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept","","1500"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll","","1000"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["#qc-cmp2-container button#accept-btn"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[aria-label=\"Reject All\"]","","1000"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],[".cmp-accept","","3500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1500"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1500"],["button[title=\"Zustimmen\"]","","1000"],["a.cookie-permission--accept-button","","1600"],["button[title=\"Alle ablehnen\"]","","1800"],["button.pixelmate-general-deny","","1000"],["a.mmcm-btn-decline","","1000"],["button.hi-cookie-btn-accept-necessary","","1000"],["button[data-testid=\"buttonCookiesAccept\"]","","1500"],["a[fs-consent-element=\"deny\"]","","1000"],["a#cookies-consent-essential","","1000"],["a.hi-cookie-continue-without-accepting","","1500"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-e2e=\"pure-accept-ads\"]","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1600"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button.brlbs-btn-save","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["a[href=\"javascript:Didomi.setUserDisagreeToAll()\"]","","1000"],["button[id=\"fupi_decline_cookies_btn\"]","","1000"],["button[onclick=\"Didomi.setUserDisagreeToAll();\"]","","1000"],["a#cookie-accept","","1000"],["button.decline-button","","1000"],["button.inv-cmp-button.inv-font-btn","","1800"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"i]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button[title=\"Schließen & Akzeptieren\"]","","1000"],["button.js-alert-cookie-reject","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","2600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button[title=\"Accept & Continue\"]","","1000"],["button#ensRejectAll","","1500"],["button#ensSave","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],[".modal-actions-decline-btn","","2000"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","2500"],["button[title=\"Accept\"]","","1000"],["button.btn.customize","","800"],["button.confirm-button","","1200"],["button[onclick=\"CookieInformation.declineAllCategories()\"]","","1000"],["button.js-decline-all-cookies","","1500"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button[id=\"ketch-banner-button-secondary\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button.gdpr-btn.gdpr-btn-white","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#reject-all-gdpr","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["button.cmplz-deny","","1000"],["button[aria-label=\"Reject all\"]","","1000"],["button[title=\"Agree\"]","","1000"],["button[title=\"Aceptar y continuar\"]","","1000"],["button[title=\"Accettare e continuare\"]","","1000"],["button[title=\"Concordar\"]","","1000"],["button[title=\"Accepter et continuer\"]","","1500"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button.si-cookie-notice__button--reject","","1000"],["button.cookieselection-confirm-necessary","","2500"],["button[value=\"essential\"]","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1600"],["button[data-testing=\"cookie-bar-deny-all\"]","","1000"],["button.shared-elements-cookies-popup__modify-button","","1100"],["button.shared-cookies-modal__current-button","","1300"],["button#cookie-custom","","1200"],["button#cookie-save","","1800"],["div.rejectLink___zHIdj","","1000"],[".cmp-root-container >>> .cmp-button-accept-all","","1000"],["a[data-mrf-role=\"userPayToReject\"]","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button#c-rall-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["button#pgwl_pur-option-accept-button","","1800"],["button.cc-btn.save","","1000"],["button.btn-reject-additional-cookies","","1000"],["button#c-s-bn","","700"],["button#s-sv-bn","","850"],["button#btn-accept-banner","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button#js-data-privacy-manage-cookies","","1000"],["button#js-manage-data-privacy-save-button","1500"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button.primary","","1000"],["a[onclick=\"denyCookiePolicyAndSetHash();\"]","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button.cc-deny","","1000"],["button.consent-reject","","1500"],["button[data-omcookie-panel-save=\"min\"]","","3500"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["button#cookie-dismiss","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#btn-accept-required-banner","","1000"],["button.js-cookies-panel-reject-all","","1000"],["button.acbut.continue","","1000"],["button#btnAcceptPDPA","","1000"],["button#popin_tc_privacy_button_2","","1800"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button.CookieBar__Button-decline","","600"],["button.btn.btn-success","","750"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["[aria-label=\"allow cookies\"]","","1000"],["button[aria-label=\"allow cookies\"]","","1000"],["button.ios-modal-cookie","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["button[data-cookieman-save]","","1000"],["button.swal2-cancel","","1000"],["button[data-component-name=\"reject\"]","","1000"],["button.fides-reject-all-button","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["div[aria-label=\"Only allow essential cookies\"]","","1000"],["button[title=\"Agree & Continue\"]","","1800"],["button[title=\"Reject All\"]","","1000"],["button[title=\"Agree and continue\"]","","1000"],["span.gmt_refuse","","1000"],["span.btn-btn-save","","1500"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],["button.btn-secondary[autofocus=\"true\"]","","1000"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","2800"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["button[data-test=\"cookie-finom-card-continue-without-accepting\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a[fs-cc=\"deny\"]","","1000"],["button#ccc-notify-accept","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["button[data-test-id=\"decline-button\"]","","2400"],["button[title=\"Accept all\"]","","1000"],["button#consent_wall_optout","","1000"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button[data-testid=\"cmp-revoke-all\"]","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[aria-label=\"deny cookies\"]","","1000"],["button[aria-label=\"deny cookies\"]","","1000"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["itau-cookie-consent-banner >>> button#itau-cookie-consent-banner-reject-cookies-btn","","1000"],[".layout-modal[style] .cookiemanagement .middle-center .intro .text-center .cookie-refuse","","1000"],["button.cc-button.cc-secondary","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1800"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#elc-decline-all-link","","1000"],["a[data-ref-origin=\"POLITICA-COOKIES-DENEGAR-NAVEGANDO-FALDON\"]","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["button[title=\"Accept and continue\"]","","2000"],["button#consent-reject-all","","1000"],["a[role=\"button\"].button--secondary","","1000"],["button#denyBtn","","1000"],["button#accept-all-cookies","","1000"],["button[data-testid=\"zweiwegen-accept-button\"]","","1000"],["button[data-selector-cookie-button=\"reject-all\"]","","500"],["button[aria-label=\"Reject\"]","","1000"],["button.ens-reject","","1000"],["a#reject-button","","700"],["a#reject-button","","900"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","2000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["button#_tealiumModalClose","","1000"],["button.Cmp__action--yes","","2500"],["button[onclick*=\"(()=>{ CassieWidgetLoader.Widget.rejectAll\"]","","1000"],["button.fig-consent-banner__accept","","1000"],["button[onclick*=\"setTimeout(Didomi.setUserAgreeToAll","0);\"]","","1800"],["button#zdf-cmp-deny-btn","","1000"],["button#axeptio_btn_dismiss","","1000"],["a#setCookieLinkIn","","400"],["span.as-js-close-banner","","1000"],["button[value=\"popup_decline\"]","","1000"],[".wt-ecl-button[href=\"#refuse\"]","","1000"],["button#no_consent_btn","","1000"],["button.cc-nb-reject","","1000"],["a.weigeren.active","","1000"],["a.aanvaarden.green.active","","1000"],["button.button--preferences","","900"],["button.button--confirm","","1100"],["button.js-btn-reject-all","","1300"],["button[aria-label=\"Nur notwendige\"]","","1000"],["button[aria-label=\"Only necessary\"]","","1000"],["button[aria-label=\"Seulement nécessaire\"]","","1000"],["button[aria-label=\"Alleen noodzakelijk\"]","","1000"],["button[aria-label=\"Solo necessario\"]","","1000"],["a#optout_link","","1000"],["button[kind=\"purple\"]","","1000"],["button#cookie-consent-decline","","1000"],["button.tiko-btn-primary.tiko-btn-is-small","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["button[data-action=\"reject\"]","","1000"],["button.osano-cm-denyAll","","1000"],["button[data-dismiss=\"modal\"]","","1500"],["button.bh-cookies-popup-save-selection","","1000"],["a.avg-btn-allow","","1000"],["button[title=\"ACEPTAR Y GUARDAR\"]","","1000"],["#cookiescript_reject","","500"],["._brlbs-refuse-btn > ._brlbs-cursor._brlbs-btn","","1000"],["._brlbs-accept > ._brlbs-btn-accept-all","","1000"],[".cookie-footer > button[type=\"submit\"]","","1000"],["button#cookie-banner-agree-all","","1000"],["button[class=\"amgdprcookie-button -allow\"]","","1000"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["button.it-cc__button-decline","","1000"],["button#btn-accept-cookie","","1000"],["button#acceptCookiesTerms","","1000"],["a.footer-cookies-button-save-all","","1000"],[".in.modal .modal-dialog .modal-content .modal-footer #cc-mainpanel-btnsmain button[onclick=\"document._cookie_consentrjctll.submit()\"]","","1000"],["button#CTA_BUTTON_TEXT_CTA_WRAPPER","","2000"],["button#js_keksNurNotwendigeKnopf","","1000"],[".show .modal-dialog .modal-content .modal-footer #RejectAllCookiesModal","","1000"],["button#accept-selected","","1000"],["div#ccmgt_explicit_accept","","1000"],["button[data-testid=\"privacy-banner-decline-all-btn-desktop\"]","","1000"],["button[title=\"Reject All\"]","","1800"],[".show.gdpr-modal .gdpr-modal-dialog .js-gdpr-modal-1 .modal-body .row .justify-content-center .js-gdpr-accept-all","","1000"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["a.necessary_cookies","","1200"],["a#r-cookies-wall--btn--accept","","1000"],["button[data-trk-consent=\"J'accepte les cookies\"]","","1000"],["button.cookies-btn","","1000"],[".show.modal .modal-dialog .modal-content .modal-body button[onclick=\"wsConsentReject();\"]","","1000"],[".show.modal .modal-dialog .modal-content .modal-body #cookieStart input[onclick=\"wsConsentDefault();\"]","","1000"],["a.gdpr-cookie-notice-nav-item-decline","","1000"],["span[data-cookieaccept=\"current\"]","","1500"],["button.js_cookie-consent-modal__disagreement","","1000"],["button.tm-button.secondary-invert","","1000"],["div.t_cm_ec_reject_button","","1000"],[".show .modal-dialog .modal-content #essentialCookies","","1000"],["button#UCButtonSettings","","800"],["button#CybotCookiebotDialogBodyLevelButtonAccept","","900"],[".show .modal-dialog .modal-content .modal-footer .s-cookie-transparency__btn-accept-all-and-close","","1000"],["a#accept-cookies","","1000"],["button.gdpr-accept-all-btn","","1000"],["span[data-ga-action=\"disallow_all_cookies\"]","","1000"],["button.cookie-notification-secondary-btn","","1000"],["a[data-gtm-action=\"accept-all\"]","","1000"],["input[value=\"I agree\"]","","1000"],["button[label*=\"Essential\"]","","1800"],["div[class=\"hylo-button\"][role=\"button\"]","","1000"],[".cookie-warning-active .cookie-warning-wrapper .gdpr-cookie-btns a.gdpr_submit_all_button","","1000"],["a#emCookieBtnAccept","","1000"],[".yn-cookies--show .yn-cookies__inner .yn-cookies__page--visible .yn-cookies__footer #yn-cookies__deny-all","","1000"],["button[title=\"Do not sell or share my personal information\"]","","1000"],["#onetrust-consent-sdk button.ot-pc-refuse-all-handler"],["body > div[class=\"x1n2onr6 x1vjfegm\"] div[aria-hidden=\"false\"] > .x1o1ewxj div[class]:last-child > div[aria-hidden=\"true\"] + div div[role=\"button\"] > div[role=\"none\"][class^=\"x1ja2u2z\"][class*=\"x1oktzhs\"]"],["button[onclick=\"cancelCookies()\"]","","1000"],["button.js-save-all-cookies","","2600"],["a#az-cmp-btn-refuse","","1000"],["button.sp-dsgvo-privacy-btn-accept-nothing","","1000"],["pnl-cookie-wall-widget >>> button.pci-button--secondary","","2500"],["button#refuse-cookies-faldon","","1000"],["button.btn-secondary","","1800"],["button[onclick=\"onClickRefuseCookies(event)\"]","","1000"],["input#popup_ok","","1000"],["button[data-test=\"terms-accept-button\"]","","1000"],["button[title=\"Ausgewählten Cookies zustimmen\"]","","1000"],["input[onclick=\"choseSelected()\"]","","1000"],["a#alcaCookieKo","","1000"],["button.Distribution-Close"],["div[class]:has(a[href*=\"holding.wp.pl\"]) div[class]:only-child > button[class*=\" \"] + button:not([class*=\" \"])","","2300"],["body > div[class] > div[class] > div[class]:has(a[href*=\"holding.wp.pl\"]) > div[class] > div[class]:only-child > button:first-child"],["[id=\"CybotCookiebotDialogBodyButtonDecline\"]","","2000"],["button.allow-cookies-once"],["#CybotCookiebotDialogBodyLevelButtonStatisticsInline, #CybotCookiebotDialogBodyLevelButtonMarketingInline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection"],["button#acceptCookies","","1000"],["#cmpwrapper >>> a.cust-btn[onclick*=\"__cmp('setConsent'","1)\"]","","1500"],["button.cta-size-big.cta-outline"],["pie-cookie-banner >>> [data-test-id=\"actions-manage-prefs\"], pie-cookie-banner >>> #functional >>> .c-switch-input, pie-cookie-banner >>> pie-modal >>> pie-button >>> button[type=\"submit\"]","","1000"],["[data-form=\".eprivacy_optin_decline\"]","","1000"],["#cookie-consent-button","","1500"],["com-consent-layer >>> #cmpDenyAll","","2500"],["div[data-project=\"mol-fe-cmp\"] button[class*=\"level1PrimaryButton-\"]:not([class*=\"reject\"])"],["div#continueWithoutAccepting","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["body > div.w-screen.p-\\[1\\.25rem\\].fixed.left-0.top-0.flex button:first-child + button"],["#ketch-banner-buttons-container-compact > button#ketch-banner-button-primary"],[".prelim-manage-cookies-button.btn-default"],["button[data-role=\"necessary\"]"],[".cookie-banner--open button[data-variant=\"primary\"] + [data-variant=\"primary\"]","","1000"],["button[data-hook=\"consent-banner-decline-all-button\""],["cmp-banner >>> cmp-dialog >>> cmp-button >>> .button.button--primary","","1000"],["button#c-t-bn"],["a[fs-consent-element=\"deny\"]","","2000"],["button.c_link","","1000"],["#pubtech-cmp button#pt-close"]];
const hostnamesMap = new Map([["www.google.*",0],["consent.google.*",1],["consent.youtube.com",[1,2]],["facebook.com",3],["instagram.com",4],["sourcepointcmp.bloomberg.com",[5,6,7]],["sourcepointcmp.bloomberg.co.jp",[5,6,7]],["giga.de",7],["heise.de",7],["bloomberg.com",[8,9]],["forbes.com",[8,85]],["consent.fastcar.co.uk",8],["tapmaster.ca",8],["cmpv2.standard.co.uk",[10,11]],["cmpv2.independent.co.uk",[12,13,14,193]],["wetransfer.com",[15,16]],["spiegel.de",[17,18]],["nytimes.com",[19,189]],["consent.yahoo.com",20],["tumblr.com",21],["fplstatistics.co.uk",22],["fplstatistics.com",22],["e-shop.leonidas.com",23],["tomsguide.com>>",[24,25]],["walmart.ca",26],["sams.com.mx",27],["my.tonies.com",28],["cambio-carsharing.de",28],["festool.*",28],["festoolcanada.com",28],["fuso-trucks.*",28],["tracker.fressnapf.de",28],["myfabrics.co.uk",28],["zinus.*",28],["oeamtc.at",28],["consent.ladbible.com",[29,30]],["consent.unilad.com",[29,30]],["consent.uniladtech.com",[29,30]],["consent.gamingbible.com",[29,30]],["consent.sportbible.com",[29,30]],["consent.tyla.com",[29,30]],["consent.ladbiblegroup.com",[29,30]],["m2o.it",31],["deejay.it",31],["capital.it",31],["ilmattino.it",[31,32]],["leggo.it",[31,32]],["libero.it",31],["tiscali.it",31],["consent-manager.ft.com",[33,34,35]],["hertz.*",36],["mediaworld.it",37],["mediamarkt.*",37],["mediamarktsaturn.com",38],["uber.com",[39,190]],["ubereats.com",[39,190]],["lego.com",40],["ai.meta.com",41],["lilly.com",42],["bbc.com>>",43],["ilgiornale.it",44],["dimensione.com",45],["wero-wallet.eu",45],["everyeye.it",[46,760]],["pepper.pl",47],["dealabs.com",47],["hotukdeals.com",47],["chollometro.com",47],["preisjaeger.at",48],["mydealz.de",48],["kleinanzeigen.de",[49,50]],["105.net",51],["pcgamer.com>>",[52,53]],["businessinsider.com>>",54],["dailymail.co.uk",55],["almamedia.fi>>",56],["ampparit.com>>",56],["arvopaperi.fi>>",56],["iltalehti.fi>>",56],["kauppalehti.fi>>",56],["mikrobitti.fi>>",56],["talouselama.fi>>",56],["tekniikkatalous.fi>>",56],["tivi.fi>>",56],["uusisuomi.fi>>",56],["aamulehti.fi>>",[57,58,59]],["etlehti.fi>>",[57,58,59]],["gloria.fi>>",[57,58,59]],["hs.fi>>",[57,58,59]],["hyvaterveys.fi>>",[57,58,59]],["is.fi>>",[57,58,59]],["jamsanseutu.fi>>",[57,58,59]],["janakkalansanomat.fi>>",[57,58,59]],["kankaanpaanseutu.fi>>",[57,58,59]],["kmvlehti.fi>>",[57,58,59]],["kodinkuvalehti.fi>>",[57,58,59]],["merikarvialehti.fi>>",[57,58,59]],["nokianuutiset.fi>>",[57,58,59]],["pelikone.fi>>",[57,58,59]],["rannikkoseutu.fi>>",[57,58,59]],["ruutu.fi>>",[57,58,59]],["satakunnankansa.fi>>",[57,58,59]],["soppa365.fi>>",[57,58,59]],["suurkeuruu.fi>>",[57,58,59]],["sydansatakunta.fi>>",[57,58,59]],["tyrvaansanomat.fi>>",[57,58,59]],["valkeakoskensanomat.fi>>",[57,58,59]],["vauva.fi>>",[57,58,59]],["telekom.com",60],["telekom.de",60],["abola.pt",61],["flytap.com",61],["ansons.de",61],["blick.ch",61],["buienradar.be",61],["crunchyroll.com",61],["digi24.ro",61],["digisport.ro",61],["digitalfoundry.net",61],["egx.net",61],["emirates.com",61],["eurogamer.it",61],["foto-erhardt.de",61],["gmx.*",61],["kizi.com",61],["mail.com",61],["mcmcomiccon.com",61],["nachrichten.at",61],["nintendolife.com",61],["oe24.at",61],["observatornews.ro",61],["paxsite.com",61],["peacocktv.com",61],["player.pl",61],["plus500.*",61],["pricerunner.com",61],["pricerunner.se",61],["pricerunner.dk",61],["proximus.be",[61,664]],["proximus.com",61],["purexbox.com",61],["pushsquare.com",61],["rugbypass.com",61],["southparkstudios.com",[61,306]],["southwest.com",61],["starwarscelebration.com",61],["sweatybetty.com",61],["theaa.ie",61],["thehaul.com",61],["timeextension.com",61],["travelandleisure.com",61],["tunein.com",61],["tvn24.pl",61],["uefa.com",61],["videoland.com",61],["wizzair.com",61],["wetter.at",61],["wowbiz.ro",61],["dicebreaker.com",[62,63]],["eurogamer.es",[62,63]],["eurogamer.net",[62,63]],["eurogamer.nl",[62,63]],["eurogamer.pl",[62,63]],["eurogamer.pt",[62,63]],["gamesindustry.biz",[62,63]],["reedpop.com",[62,63]],["rockpapershotgun.com",[62,63]],["thepopverse.com",[62,63]],["vg247.com",[62,63]],["videogameschronicle.com",[62,63]],["eurogamer.de",64],["roadtovr.com",65],["jotex.*",65],["mundodeportivo.com",[66,137]],["www.youtube.com",67],["m.youtube.com",68],["ohra.nl",69],["corriere.it",70],["gazzetta.it",70],["oggi.it",70],["cmp.sky.it",71],["tennisassa.fi",72],["formula1.com",73],["f1racing.pl",74],["music.amazon.*",[75,76]],["consent-pref.trustarc.com",77],["highlights.legaseriea.it",78],["calciomercato.com",78],["sosfanta.com",79],["chrono24.*",[80,81]],["wetter.com",82],["youmath.it",83],["pip.gov.pl",84],["dailybuzz.nl",86],["bnn.de",86],["dosenbach.ch",86],["dw.com",86],["kinepolis.*",86],["mediaite.com",86],["nzz.ch",86],["winfuture.de",86],["lippu.fi",86],["racingnews365.com",86],["reifendirekt.ch",86],["vaillant.*",86],["bauhaus.no",87],["bauhaus.se",87],["beko-group.de",87],["billiger.de",87],["burda.com",87],["vanharen.nl",87],["deichmann.com",[87,110,495]],["meraluna.de",87],["slashdot.org",87],["hermann-saunierduval.it",87],["protherm.cz",87],["saunierduval.es",87],["protherm.sk",87],["protherm.ua",87],["saunierduval.hu",87],["saunierduval.ro",87],["saunierduval.at",87],["awb.nl",87],["spar.hu",88],["group.vattenfall.com",88],["mediaset.it",89],["fortune.com",90],["ilrestodelcarlino.it",91],["quotidiano.net",91],["lanazione.it",91],["ilgiorno.it",91],["iltelegrafolivorno.it",91],["auto.it",92],["beauxarts.com",92],["beinsports.com",92],["bfmtv.com",[92,138]],["boursobank.com",92],["boursorama.com",[92,138]],["boursier.com",[92,237]],["brut.media",92],["canalplus.com",92],["decathlon.fr",[92,233]],["diverto.tv",92],["eden-park.com",92],["foodvisor.io",92],["franceinfo.fr",92],["frandroid.com",92],["jobijoba.*",92],["hotelsbarriere.com",92],["intersport.*",[92,204]],["idealista.it",92],["o2.fr",92],["lejdd.fr",[92,137]],["lechorepublicain.fr",92],["la-croix.com",92],["linfo.re",92],["lamontagne.fr",92],["laredoute.fr",92],["largus.fr",92],["leprogres.fr",92],["lesnumeriques.com",92],["libramemoria.com",92],["lopinion.fr",92],["marieclaire.fr",92],["maville.com",92],["michelin.*",92],["midilibre.fr",[92,693]],["meteofrance.com",92],["mondialtissus.fr",92],["orange.fr",92],["orpi.com",92],["oscaro.com",92],["ouest-france.fr",[92,106,138,694]],["parismatch.com",92],["pagesjaunes.fr",92],["programme-television.org",[92,138]],["publicsenat.fr",[92,138]],["rmcbfmplay.com",[92,138]],["science-et-vie.com",[92,137]],["seloger.com",92],["societe.com",92],["suzuki.fr",92],["sudouest.fr",92],["web-agri.fr",92],["nutri-plus.de",93],["americanairlines.*",94],["consent.capital.fr",95],["consent.programme.tv",95],["consent.voici.fr",95],["programme-tv.net",95],["cmpv2.finn.no",96],["cmp.tek.no",[97,98]],["cmp.e24.no",[97,98]],["minmote.no",[97,98]],["cmp.vg.no",[97,98]],["cloud.google.com",99],["developer.android.com",99],["registry.google",99],["safety.google",99],["huffingtonpost.fr",100],["rainews.it",101],["remarkable.com",102],["netzwelt.de",103],["money.it",104],["imore.com>>",105],["allocine.fr",106],["jeuxvideo.com",106],["ozap.com",106],["le10sport.com",106],["xataka.com",106],["cmp.fitbook.de",107],["cmp.autobild.de",107],["sourcepoint.sport.de",107],["cmp-sp.tagesspiegel.de",107],["cmp.bz-berlin.de",107],["cmp.cicero.de",107],["cmp.techbook.de",107],["cmp.stylebook.de",107],["cmp2.bild.de",107],["cmp2.freiepresse.de",107],["sourcepoint.wetter.de",107],["consent.finanzen.at",107],["consent.finanzen.net",107],["consent.up.welt.de",107],["sourcepoint.n-tv.de",107],["sourcepoint.kochbar.de",107],["sourcepoint.rtl.de",107],["cmp.computerbild.de",107],["cmp.petbook.de",107],["cmp-sp.siegener-zeitung.de",107],["cmp-sp.sportbuzzer.de",107],["klarmobil.de",107],["technikum-wien.at",108],["eneco.nl",109],["salomon.com",111],["blackpoolgazette.co.uk",112],["lep.co.uk",112],["northamptonchron.co.uk",112],["scotsman.com",112],["shieldsgazette.com",112],["thestar.co.uk",112],["portsmouth.co.uk",112],["sunderlandecho.com",112],["northernirelandworld.com",112],["3addedminutes.com",112],["anguscountyworld.co.uk",112],["banburyguardian.co.uk",112],["bedfordtoday.co.uk",112],["biggleswadetoday.co.uk",112],["bucksherald.co.uk",112],["burnleyexpress.net",112],["buxtonadvertiser.co.uk",112],["chad.co.uk",112],["daventryexpress.co.uk",112],["derbyshiretimes.co.uk",112],["derbyworld.co.uk",112],["derryjournal.com",112],["dewsburyreporter.co.uk",112],["doncasterfreepress.co.uk",112],["falkirkherald.co.uk",112],["fifetoday.co.uk",112],["glasgowworld.com",112],["halifaxcourier.co.uk",112],["harboroughmail.co.uk",112],["harrogateadvertiser.co.uk",112],["hartlepoolmail.co.uk",112],["hemeltoday.co.uk",112],["hucknalldispatch.co.uk",112],["lancasterguardian.co.uk",112],["leightonbuzzardonline.co.uk",112],["lincolnshireworld.com",112],["liverpoolworld.uk",112],["londonworld.com",112],["lutontoday.co.uk",112],["manchesterworld.uk",112],["meltontimes.co.uk",112],["miltonkeynes.co.uk",112],["newcastleworld.com",112],["newryreporter.com",112],["newsletter.co.uk",112],["northantstelegraph.co.uk",112],["northumberlandgazette.co.uk",112],["nottinghamworld.com",112],["peterboroughtoday.co.uk",112],["rotherhamadvertiser.co.uk",112],["stornowaygazette.co.uk",112],["surreyworld.co.uk",112],["thescarboroughnews.co.uk",112],["thesouthernreporter.co.uk",112],["totallysnookered.com",112],["wakefieldexpress.co.uk",112],["walesworld.com",112],["warwickshireworld.com",112],["wigantoday.net",112],["worksopguardian.co.uk",112],["yorkshireeveningpost.co.uk",112],["yorkshirepost.co.uk",112],["eurocard.com",113],["saseurobonusmastercard.se",114],["barrons.com>>",115],["tver.jp",116],["linkedin.com",117],["elmundo.es",[118,138]],["expansion.com",118],["s-pankki.fi",119],["srf.ch",119],["alternate.de",119],["bayer04.de",119],["douglas.de",119],["dr-beckmann.com",119],["falke.com",119],["fitnessfirst.de",119],["flaschenpost.de",119],["gloeckle.de",119],["hornbach.nl",119],["hypofriend.de",119],["lactostop.de",119],["neumann.com",119],["post.ch",119],["postbank.de",119],["rts.ch",119],["zalando.*",119],["immowelt.de",120],["joyn.*",120],["morenutrition.de",120],["mapillary.com",121],["transfermarkt.com>>",122],["cmp.seznam.cz",123],["marca.com",124],["raiplay.it",125],["raiplaysound.it",125],["consent.faz.net",126],["derstandard.at",126],["derstandard.de",126],["automoto.it",127],["ansa.it",127],["cdt.ch",127],["delladio.it",127],["huffingtonpost.it",127],["internazionale.it",127],["lastampa.it",127],["macitynet.it",127],["moto.it",127],["movieplayer.it",127],["multiplayer.it",127],["repubblica.it",127],["tomshw.it",127],["skuola.net",127],["spaziogames.it",127],["today.it",127],["tuttoandroid.net",127],["tuttotech.net",127],["ilgazzettino.it",128],["ilmessaggero.it",128],["ilsecoloxix.it",128],["weather.com>>",[129,130]],["privacy.motorradonline.de",131],["impulse.de>>",131],["consent.watson.de",131],["consent.kino.de",131],["consent.desired.de",131],["cmpv2.fn.de",131],["spp.nextpit.de",131],["dailystar.co.uk",[132,133,134,135]],["mirror.co.uk",[132,133,134,135]],["idnes.cz",136],["20minutes.fr",137],["20minutos.es",137],["24sata.hr",137],["abc.es",137],["actu.fr",137],["antena3.com",137],["antena3internacional.com",137],["atresmedia.com",137],["atresmediapublicidad.com",137],["atresmediastudios.com",137],["atresplayer.com",137],["autopista.es",137],["belfasttelegraph.co.uk",137],["bemad.es",137],["bonduelle.it",137],["bonniernews.se",137],["bt.se",137],["cadenadial.com",137],["caracol.com.co",137],["cas.sk",137],["charentelibre.fr",137],["ciclismoafondo.es",137],["cnews.fr",137],["cope.es",137],["correryfitness.com",137],["courrier-picard.fr",137],["cuatro.com",137],["decathlon.nl",137],["decathlon.pl",137],["di.se",137],["diariocordoba.com",137],["diariodenavarra.es",137],["diariosur.es",137],["diariovasco.com",137],["diepresse.com",137],["divinity.es",137],["dn.se",137],["dnevnik.hr",137],["dumpert.nl",137],["ebuyclub.com",137],["edreams.de",137],["edreams.net",137],["elcomercio.es",137],["elconfidencial.com",137],["elcorreo.com",137],["eldesmarque.com",137],["eldiario.es",137],["eldiariomontanes.es",137],["elespanol.com",137],["elle.fr",137],["elpais.com",[137,139]],["elperiodico.com",137],["elperiodicodearagon.com",137],["elplural.com",137],["energytv.es",137],["engadget.com",137],["es.ara.cat",137],["euronews.com",137],["europafm.com",137],["expressen.se",137],["factoriadeficcion.com",137],["filmstarts.de",137],["flooxernow.com",137],["folkbladet.nu",137],["footmercato.net",137],["france.tv",137],["france24.com",137],["fussballtransfers.com",137],["ghacks.net",137],["gva.be",137],["hbvl.be",137],["heraldo.es",137],["hoy.es",137],["ideal.es",137],["idealista.pt",137],["krone.at",137],["kurier.at",137],["lacoste.com",137],["ladepeche.fr",137],["lalibre.be",137],["lanouvellerepublique.fr",137],["larazon.es",137],["lasexta.com",137],["lasprovincias.es",137],["latribune.fr",137],["lavanguardia.com",137],["laverdad.es",137],["lavozdegalicia.es",137],["leboncoin.fr",137],["lecturas.com",137],["ledauphine.com",137],["lejsl.com",137],["leparisien.fr",137],["lesoir.be",137],["letelegramme.fr",137],["libremercado.com",137],["localeyes.dk",137],["los40.com",137],["lotoquebec.com",137],["lunion.fr",137],["m6.fr",137],["marianne.cz",137],["marmiton.org",137],["mediaset.es",137],["melodia-fm.com",137],["metronieuws.nl",137],["moviepilot.de",137],["mtmad.es",137],["multilife.com.pl",137],["naszemiasto.pl",137],["nationalgeographic.com.es",137],["nicematin.com",137],["nieuwsblad.be",137],["notretemps.com",137],["numerama.com",137],["okdiario.com",137],["ondacero.es",137],["podiumpodcast.com",137],["portail.lotoquebec.com",137],["profil.at",137],["public.fr",137],["publico.es",137],["radiofrance.fr",137],["rankia.com",137],["rfi.fr",137],["rossmann.pl",137],["rtbf.be",[137,233]],["rtl.lu",137],["sensacine.com",137],["sfgame.net",137],["shure.com",137],["silicon.es",137],["sncf-connect.com",137],["sport.es",137],["sydsvenskan.se",137],["techcrunch.com",137],["telegraaf.nl",137],["telequebec.tv",137],["tf1.fr",137],["tradingsat.com",137],["trailrun.es",137],["video-streaming.orange.fr",137],["xpress.fr",137],["laprovincia.es",138],["informacion.es",138],["tportal.hr",138],["ivoox.com",138],["as.com",138],["slam.nl",138],["bienpublic.com",138],["funradio.fr",138],["gamepro.de",[138,201,202]],["lemon.fr",138],["lexpress.fr",138],["shadow.tech",138],["letemps.ch",138],["mein-mmo.de",138],["heureka.sk",138],["film.at",138],["dhnet.be",138],["lesechos.fr",[138,239]],["marianne.net",[138,233]],["jeanmarcmorandini.com",[138,234]],["dna.fr",138],["sudinfo.be",138],["europe1.fr",[138,234]],["rtl.be",[138,233]],["reviewingthebrew.com",138],["jaysjournal.com",138],["reignoftroy.com",138],["ryobitools.eu",[140,141]],["americanexpress.com",142],["rtvc.es>>",143],["beteve.cat>>",144],["whatcar.com>>",144],["bloodyelbow.com>>",145],["consent.radiotimes.com",145],["sp-consent.szbz.de",146],["cmp.omni.se",147],["cmp.svd.se",147],["cmp.aftonbladet.se",147],["cmp.tv.nu",147],["weltkunst.de>>",148],["consent.economist.com",149],["studentagency.cz",149],["driving.co.uk>>",150],["cmpv2.foundryco.com",150],["cmpv2.infoworld.com",150],["cmpv2.arnnet.com.au",150],["sp-cdn.pcgames.de",151],["sp-cdn.pcgameshardware.de",151],["consentv2.sport1.de",151],["boerse-online.de>>",151],["cmp.mz.de",151],["cmpv2.tori.fi",152],["tidende.dk>>",153],["consent.spielaffe.de",154],["bondekompaniet.no",155],["degiro.*",155],["epochtimes.de",155],["vikingline.com",155],["tfl.gov.uk",155],["drklein.de",155],["hildegardis-krankenhaus.de",155],["kleer.se",155],["lekiaviation.com",155],["lotto.pl",155],["mineralstech.com",155],["volunteer.digitalboost.org.uk",155],["starhotels.com",155],["tefl.com",155],["universumglobal.com",155],["tui.com",156],["rexel.*",157],["csob.sk",158],["greenstuffworld.com",159],["morele.net",[160,161]],["1und1.de",162],["infranken.de",163],["cmp.tvspielfilm.de",164],["cmp.tvtoday.de",164],["cmp.bunte.de",164],["cmp.chip.de",164],["cmp.focus.de",[164,521]],["stol.it>>",164],["estadiodeportivo.com",165],["tameteo.*",165],["tempo.pt",165],["meteored.*",165],["pogoda.com",165],["yourweather.co.uk",165],["tempo.com",165],["theweather.net",165],["tiempo.com",165],["ilmeteo.net",165],["daswetter.com",165],["kicker.de",166],["formulatv.com",167],["web.de",168],["lefigaro.fr",169],["linternaute.com",170],["consent.caminteresse.fr",171],["volksfreund.de",172],["rp-online.de",172],["dailypost.co.uk",173],["the-express.com",173],["vide-greniers.org",173],["dailyrecord.co.uk",174],["bluray-disc.de",175],["elio-systems.com",175],["stagatha-fachklinik.de",175],["tarife.mediamarkt.de",175],["lz.de",175],["gaggenau.com",175],["saturn.de",176],["eltiempo.es",[177,178]],["otempo.pt",179],["atlasformen.*",180],["cmp-sp.goettinger-tageblatt.de",181],["cmp-sp.saechsische.de",181],["cmp-sp.ln-online.de",181],["cz.de",181],["dewezet.de",181],["dnn.de",181],["haz.de",181],["gnz.de",181],["landeszeitung.de",181],["lvz.de",181],["maz-online.de",181],["ndz.de",181],["op-marburg.de",181],["ostsee-zeitung.de",181],["paz-online.de",181],["reisereporter.de",181],["rga.de",181],["rnd.de",181],["siegener-zeitung.de",181],["sn-online.de",181],["solinger-tageblatt.de",181],["sportbuzzer.de",181],["szlz.de",181],["tah.de",181],["torgauerzeitung.de",181],["waz-online.de",181],["privacy.maennersache.de",181],["refinery29.com>>",182],["sinergy.ch",183],["agglo-valais-central.ch",183],["biomedcentral.com",184],["hsbc.*",185],["hsbcnet.com",185],["hsbcinnovationbanking.com",185],["create.hsbc",185],["gbm.hsbc.com",185],["hsbc.co.uk",186],["internationalservices.hsbc.com",186],["history.hsbc.com",186],["about.hsbc.co.uk",187],["privatebanking.hsbc.com",188],["independent.co.uk",191],["privacy.crash.net",191],["the-independent.com",192],["argos.co.uk",194],["poco.de",[195,196]],["moebelix.*",195],["moemax.*",195],["xxxlutz.*",195],["xxxlesnina.*",195],["moebel24.at",196],["moebel24.ch",196],["meubles.fr",196],["meubelo.nl",196],["moebel.de",196],["lipo.ch",197],["schubiger.ch",198],["aedt.de",199],["berlin-live.de",199],["bike-magazin.de",199],["connect.de",199],["gutefrage.net",199],["insideparadeplatz.ch",199],["morgenpost.de",199],["thueringen24.de",199],["pdfupload.io",200],["gamestar.de",[201,202,243]],["verksamt.se",203],["acmemarkets.com",204],["amtrak.com",204],["beko.com",204],["bepanthen.com.au",204],["berocca.com.au",204],["booking.com",204],["carrefour.fr",204],["centrum.sk",204],["claratyne.com.au",204],["credit-suisse.com",204],["ceskatelevize.cz",204],["deporvillage.*",204],["de.vanguard",204],["dhl.de",204],["digikey.*",204],["drafthouse.com",204],["dunelm.com",204],["eurosport.fr",204],["fello.se",204],["fielmann.*",204],["flashscore.fr",204],["flightradar24.com",204],["fnac.es",204],["foodandwine.com",204],["fourseasons.com",204],["khanacademy.org",204],["konami.com",204],["jll.*",204],["jobs.redbull.com",204],["hellenicbank.com",204],["gemini.pl",204],["groceries.asda.com",204],["lamborghini.com",204],["menshealth.com",204],["n26.com",204],["nintendo.com",204],["nokia.com",204],["oneweb.net",204],["omnipod.com",204],["oralb.*",204],["panasonic.com",204],["parkside-diy.com",204],["pluto.tv",204],["popularmechanics.com",204],["polskieradio.pl",204],["pringles.com",204],["questdiagnostics.com",204],["radissonhotels.com",204],["ricardo.ch",204],["rockstargames.com",204],["rte.ie",204],["salesforce.com",204],["samsonite.*",204],["spiele.heise.de",204],["spirit.com",204],["stenaline.co.uk",204],["swisscom.ch",204],["swisspass.ch",204],["technologyfromsage.com",204],["telenet.be",204],["tntsports.co.uk",204],["theepochtimes.com",204],["toujeo.com",204],["uber-platz.de",204],["vinted.com",204],["wallapop.com",204],["wickes.co.uk",204],["workingtitlefilms.com",204],["vattenfall.de",204],["winparts.fr",204],["yoigo.com",204],["zoominfo.com",204],["allegiantair.com",205],["hallmarkchannel.com",205],["incorez.com",205],["noovle.com",205],["otter.ai",205],["plarium.com",205],["telsy.com",205],["timenterprise.it",205],["tim.it",205],["tradersunion.com",205],["fnac.*",205],["yeti.com",205],["here.com",[206,702]],["vodafone.com",206],["kooora.com>>",207],["cmp.heise.de",[208,209]],["cmp.am-online.com",208],["cmp.motorcyclenews.com",208],["consent.newsnow.co.uk",208],["cmp.todays-golfer.com",208],["koeser.com",210],["shop.schaette-pferd.de",210],["schaette.de",210],["central-bb.de",211],["fitnessfoodcorner.de",212],["kuehlungsborn.de",213],["espressocoffeeshop.com",214],["brainmarket.pl",215],["getroots.app",216],["cart-in.re",[217,627]],["prestonpublishing.pl",218],["zara.com",219],["lepermislibre.fr",219],["negociardivida.spcbrasil.org.br",220],["pons.com",221],["adidas.*",222],["privacy.topreality.sk",223],["privacy.autobazar.eu",223],["vu.lt",224],["adnkronos.com",[225,226]],["cornwalllive.com",[225,226]],["cyprus-mail.com",[225,226]],["einthusan.tv",[225,226]],["informazione.it",[225,226]],["mymovies.it",[225,226]],["tuttoeuropei.com",[225,226]],["video.lacnews24.it",[225,226]],["protothema.gr",225],["flash.gr",225],["taxscouts.com",227],["heute.at>>",228],["online.no",229],["telenor.no",229],["austrian.com",230],["lufthansa.com",230],["kampfkunst-herz.de",231],["glow25.de",231],["h-f.at",231],["hornetsecurity.com",231],["ifun.de",231],["kayzen.io",231],["wasserkunst-hamburg.de",231],["zahnspange-oelde.de",231],["xinedome.de",232],["bnc.ca",233],["egora.fr",233],["engelvoelkers.com",233],["estrategiasdeinversion.com",233],["festo.com",233],["francebleu.fr",233],["francemediasmonde.com",233],["geny.com",233],["giphy.com",233],["idealista.com",233],["infolibre.es",233],["inpost.pl",233],["information.tv5monde.com",233],["ing.es",233],["knipex.de",233],["laprovence.com",233],["lemondeinformatique.fr",233],["libertaddigital.com",233],["mappy.com",233],["orf.at",233],["philibertnet.com",233],["researchgate.net",233],["standaard.be",233],["stroilioro.com",233],["taxfix.de",233],["telecinco.es",233],["vistaalegre.com",233],["wsp.com",233],["zimbra.free.fr",233],["tribecawine.com",235],["usinenouvelle.com",236],["reussir.fr",238],["bruendl.at",240],["latamairlines.com",241],["elisa.ee",242],["baseendpoint.brigitte.de",243],["baseendpoint.gala.de",243],["baseendpoint.haeuser.de",243],["baseendpoint.stern.de",243],["baseendpoint.urbia.de",243],["cmp.tag24.de",243],["cmp-sp.handelsblatt.com",243],["cmpv2.berliner-zeitung.de",243],["golem.de",243],["rockhard.de>>",243],["consent.t-online.de",243],["sp-consent.stuttgarter-nachrichten.de",244],["btc-echo.de>>",244],["sp-consent.stuttgarter-zeitung.de",244],["regjeringen.no",245],["sp-manager-magazin-de.manager-magazin.de",246],["consent.11freunde.de",246],["f1academy.com>>",247],["timeout.com>>",[247,248]],["karlsruhe-insider.de>>",249],["promiflash.de>>",250],["wallester.com",251],["centrum24.pl",252],["replay.lsm.lv",253],["ltv.lsm.lv",253],["bernistaba.lsm.lv",253],["verl.de",254],["cubo-sauna.de",254],["mbl.is",254],["auto-medienportal.net",254],["mobile.de",255],["cookist.it",256],["fanpage.it",256],["geopop.it",256],["lexplain.it",256],["royalmail.com",257],["gmx.net",258],["gmx.ch",259],["mojehobby.pl",260],["super-hobby.*",260],["sp.stylevamp.de",[261,262]],["cmp.wetteronline.de",261],["sp.stylevamp.com",262],["audi.*",[263,264]],["easyjet.com",263],["experian.co.uk",263],["postoffice.co.uk",263],["tescobank.com",263],["internetaptieka.lv",[265,266]],["nike.com",267],["wells.pt",268],["dskdirect.bg",269],["cmpv2.dba.dk",270],["spcmp.crosswordsolver.com",271],["gbnews.com>>",[271,631]],["cdn.privacy-mgmt.com",271],["homary.com",[272,273]],["ecco.com",274],["georgjensen.com",274],["thomann.*",275],["landkreis-kronach.de",276],["effectiefgeven.be",277],["northcoast.com",277],["chaingpt.org",277],["bandenconcurrent.nl",278],["bandenexpert.be",278],["reserved.com",279],["metro.it",280],["makro.es",280],["metro.sk",280],["metro-cc.hr",280],["makro.nl",280],["metro.bg",280],["metro.at",280],["metro-tr.com",280],["metro.de",280],["metro.fr",280],["makro.cz",280],["metro.ro",280],["makro.pt",280],["makro.pl",280],["sklepy-odido.pl",280],["rastreator.com",280],["metro.ua",281],["metro.rs",281],["metro-kz.com",281],["metro.md",281],["metro.hu",281],["metro-cc.ru",281],["metro.pk",281],["balay.es",282],["constructa.com",282],["dafy-moto.com",283],["akku-shop.nl",284],["akkushop-austria.at",284],["akkushop-b2b.de",284],["akkushop.de",284],["akkushop.dk",284],["batterie-boutique.fr",284],["akkushop-schweiz.ch",285],["evzuttya.com.ua",286],["eobuv.cz",286],["eobuwie.com.pl",286],["ecipele.hr",286],["eavalyne.lt",286],["chaussures.fr",286],["ecipo.hu",286],["eobuv.sk",286],["epantofi.ro",286],["epapoutsia.gr",286],["escarpe.it",286],["eschuhe.de",286],["obuvki.bg",286],["zapatos.es",286],["swedbank.ee",287],["mudanzavila.es",288],["bienmanger.com",289],["gesipa.*",290],["gesipausa.com",290],["beckhoff.com",290],["zitekick.dk",291],["eltechno.dk",291],["okazik.pl",291],["batteryempire.*",292],["maxi.rs",293],["garmin.com",294],["invisalign.*",294],["one4all.ie",294],["osprey.com",294],["wideroe.no",295],["bmw.*",296],["kijk.nl",297],["nordania.dk",298],["danskebank.*",298],["danskeci.com",298],["danica.dk",298],["dehn.*",299],["gewerbegebiete.de",300],["cordia.fr",301],["vola.fr",302],["lafi.fr",303],["skyscanner.*",304],["coolblue.*",305],["chipotle.com",306],["sanareva.*",307],["atida.fr",307],["bbva.*",308],["bbvauk.com",308],["expertise.unimi.it",309],["altenberg.de",310],["vestel.es",311],["tsb.co.uk",312],["buienradar.nl",[313,314]],["linsenplatz.de",315],["budni.de",316],["erstecardclub.hr",316],["teufel.de",[317,318]],["abp.nl",319],["simplea.sk",320],["flip.bg",321],["kiertokanki.com",322],["supla.fi>>",323],["leirovins.be",324],["vias.be",325],["edf.fr",326],["virbac.com",326],["diners.hr",326],["squarehabitat.fr",326],["arbitrobancariofinanziario.it",327],["ivass.it",327],["economiapertutti.bancaditalia.it",327],["smit-sport.de",328],["gekko-computer.de",328],["jysk.al",329],["go-e.com",330],["malerblatt-medienservice.de",331],["architekturbuch.de",331],["medienservice-holz.de",331],["leuchtstark.de",331],["casius.nl",332],["coolinarika.com",333],["giga-hamburg.de",333],["vakgaragevannunen.nl",333],["fortuluz.es",333],["finna.fi",333],["eurogrow.es",333],["paid.ai",333],["topnatur.cz",333],["topnatur.eu",333],["vakgarage.nl",333],["whufc.com",333],["zomaplast.cz",333],["envafors.dk",334],["dabbolig.dk",[335,336]],["daruk-emelok.hu",337],["exakta.se",338],["larca.de",339],["roli.com",340],["okazii.ro",341],["lr-shop-direkt.de",341],["portalprzedszkolny.pl",341],["tgvinoui.sncf",342],["l-bank.de",343],["interhyp.de",344],["indigoneo.*",345],["transparency.meta.com",346],["dojusagro.lt",347],["eok.ee",347],["kripa.it",347],["nextdaycatering.co.uk",347],["safran-group.com",347],["sr-ramenendeuren.be",347],["ilovefreegle.org",347],["tribexr.com",347],["understandingsociety.ac.uk",347],["bestbuycyprus.com",348],["strato.*",349],["strato-hosting.co.uk",349],["auto.de",350],["contentkingapp.com",351],["comune.palermo.it",352],["get-in-engineering.de",353],["spp.nextpit.com",354],["spp.nextpit.es",355],["spp.nextpit.it",356],["spp.nextpit.com.br",357],["spp.nextpit.fr",358],["otterbox.com",359],["stoertebeker-brauquartier.com",360],["stoertebeker.com",360],["stoertebeker-eph.com",360],["aparts.pl",361],["sinsay.com",[362,363]],["benu.cz",364],["stockholmresilience.org",365],["ludvika.se",365],["kammarkollegiet.se",365],["cazenovecapital.com",366],["statestreet.com",367],["beopen.lv",368],["cesukoncertzale.lv",369],["dodo.fr",370],["makelaarsland.nl",371],["bezirk-schwaben.de",372],["dorfen.de",372],["nutsinbulk.co.uk",373],["bricklink.com",374],["bestinver.es",375],["icvs2023.conf.tuwien.ac.at",376],["racshop.co.uk",[377,378]],["baabuk.com",379],["sapien.io",379],["tradedoubler.com",379],["app.lepermislibre.fr",380],["multioferta.es",381],["testwise.com",[382,383]],["tonyschocolonely.com",384],["fitplus.is",384],["fransdegrebber.nl",384],["lilliputpress.ie",384],["lexibo.com",384],["marin-milou.com",384],["dare2tri.com",384],["t3micro.*",384],["la-vie-naturelle.com",[385,386]],["inovelli.com",387],["uonetplus.vulcan.net.pl",[388,389]],["consent.helagotland.se",390],["oper.koeln",[391,392]],["deezer.com",393],["hoteldesartssaigon.com",394],["autoritedelaconcurrence.fr",395],["groupeonepoint.com",395],["geneanet.org",395],["carrieres.groupegalerieslafayette.com",395],["immo-banques.fr",395],["lingvanex.com",395],["turncamp.com",396],["ejobs.ro",[397,398]],["kupbilecik.*",[399,400]],["coolbe.com",401],["serienjunkies.de",402],["computerhoy.20minutos.es",403],["clickskeks.at",404],["clickskeks.de",404],["abt-sportsline.de",404],["wittmann-group.com",404],["exemplary.ai",405],["forbo.com",405],["stores.sk",405],["nerdstar.de",405],["prace.cz",405],["profesia.sk",405],["profesia.cz",405],["pracezarohem.cz",405],["atmoskop.cz",405],["seduo.sk",405],["seduo.cz",405],["teamio.com",405],["arnold-robot.com",405],["cvonline.lt",405],["cv.lv",405],["cv.ee",405],["dirbam.lt",405],["visidarbi.lv",405],["otsintood.ee",405],["webtic.it",405],["gerth.de",406],["pamiatki.pl",407],["initse.com",408],["salvagny.org",409],["augsburger-allgemeine.de",410],["stabila.com",411],["stwater.co.uk",412],["suncalc.org",[413,414]],["swisstph.ch",415],["taxinstitute.ie",416],["get-in-it.de",417],["tempcover.com",[418,419]],["guildford.gov.uk",420],["easyparts.*",[421,422]],["easyparts-recambios.es",[421,422]],["easyparts-rollerteile.de",[421,422]],["drimsim.com",423],["canyon.com",[424,425,426]],["vevovo.be",[427,428]],["vendezvotrevoiture.be",[427,428]],["wirkaufendeinauto.at",[427,428]],["vikoberallebiler.dk",[427,428]],["wijkopenautos.nl",[427,428]],["vikoperdinbil.se",[427,428]],["noicompriamoauto.it",[427,428]],["vendezvotrevoiture.fr",[427,428]],["compramostucoche.es",[427,428]],["wijkopenautos.be",[427,428]],["auto-doc.*",429],["autodoc.*",429],["autodoc24.*",429],["topautoosat.fi",429],["autoteiledirekt.de",429],["autoczescionline24.pl",429],["tuttoautoricambi.it",429],["onlinecarparts.co.uk",429],["autoalkatreszek24.hu",429],["autodielyonline24.sk",429],["reservdelar24.se",429],["pecasauto24.pt",429],["reservedeler24.co.no",429],["piecesauto24.lu",429],["rezervesdalas24.lv",429],["besteonderdelen.nl",429],["recambioscoche.es",429],["antallaktikaexartimata.gr",429],["piecesauto.fr",429],["teile-direkt.ch",429],["lpi.org",430],["divadelniflora.cz",431],["mahle-aftermarket.com",432],["refurbed.*",433],["eingutertag.org",434],["flyingtiger.com",[434,577]],["borgomontecedrone.it",434],["maharishistore.com",434],["recaro-shop.com",434],["gartenhotel-crystal.at",434],["fayn.com",435],["serica-watches.com",435],["sklavenitis.gr",436],["eam-netz.de",437],["umicore.*",438],["veiligverkeer.be",438],["vsv.be",438],["dehogerielen.be",438],["gera.de",439],["mfr-chessy.fr",440],["mfr-lamure.fr",440],["mfr-saint-romain.fr",440],["mfr-lapalma.fr",440],["mfrvilliemorgon.asso.fr",440],["mfr-charentay.fr",440],["mfr.fr",440],["nationaltrust.org.uk",441],["hej-natural.*",442],["ib-hansmeier.de",443],["rsag.de",444],["esaa-eu.org",444],["aknw.de",444],["answear.*",445],["theprotocol.it",[446,447]],["lightandland.co.uk",448],["etransport.pl",449],["wohnen-im-alter.de",450],["johnmuirhealth.com",[451,452]],["markushaenni.com",453],["airbaltic.com",454],["gamersgate.com",454],["zorgzaam010.nl",455],["etos.nl",456],["paruvendu.fr",457],["privacy.bazar.sk",458],["hennamorena.com",459],["newsello.pl",460],["porp.pl",461],["golfbreaks.com",462],["lieferando.de",463],["just-eat.*",463],["justeat.*",463],["pyszne.pl",463],["lieferando.at",463],["takeaway.com",463],["thuisbezorgd.nl",463],["holidayhypermarket.co.uk",464],["unisg.ch",465],["wassererleben.ch",465],["psgaz.pl",466],["play-asia.com",467],["centralthe1card.com",468],["atu.de",469],["atu-flottenloesungen.de",469],["but.fr",469],["edeka.de",469],["fortuneo.fr",469],["maif.fr",469],["meteo.tf1.fr",469],["particuliers.sg.fr",469],["sparkasse.at",469],["group.vig",469],["tf1info.fr",469],["dpdgroup.com",470],["dpd.com",470],["cosmosdirekt.de",470],["bstrongoutlet.pt",471],["isarradweg.de",[472,473]],["flaxmanestates.com",473],["inland-casas.com",473],["finlayson.fi",[474,475]],["cowaymega.ca",[474,475]],["arktis.de",476],["desktronic.de",476],["belleek.com",476],["brauzz.com",476],["cowaymega.com",476],["dockin.de",476],["dryrobe.com",[476,477]],["formswim.com",476],["hairtalk.se",476],["hallmark.co.uk",[476,477]],["loopearplugs.com",[476,477]],["oleus.com",476],["peopleofshibuya.com",476],["pullup-dip.com",476],["sanctum.shop",476],["tbco.com",476],["desktronic.*",477],["hq-germany.com",477],["tepedirect.com",477],["maxi-pet.ro",477],["paper-republic.com",477],["pullup-dip.*",477],["vitabiotics.com",477],["smythstoys.com",478],["beam.co.uk",[479,480]],["autobahn.de",481],["krakow.pl",482],["shop.app",483],["shopify.com",483],["wufoo.com",484],["consent.dailymotion.com",485],["laposte.fr",485],["help.instagram.com",486],["crazygames.com>>",[487,689]],["consent-manager.thenextweb.com",488],["consent-cdn.zeit.de",489],["coway-usa.com",490],["steiners.shop",491],["ecmrecords.com",492],["cigarjournal.com",492],["invidis.com",492],["malaikaraiss.com",492],["koch-mit.de",492],["zeitreisen.zeit.de",492],["wefashion.com",493],["merkur.dk",494],["ionos.*",496],["omegawatches.com",497],["carefully.be",498],["aerotime.aero",498],["rocket-league.com",499],["dws.com",500],["bosch-homecomfort.com",501],["elmleblanc-optibox.fr",501],["monservicechauffage.fr",501],["boschrexroth.com",501],["home-connect.com",502],["lowrider.at",[503,504]],["mesto.de",505],["intersport.gr",506],["intersport.bg",506],["intersport.com.cy",506],["intersport.ro",506],["ticsante.com",507],["techopital.com",507],["millenniumprize.org",508],["hepster.com",509],["peterstaler.de",510],["blackforest-still.de",510],["tiendaplayaundi.com",511],["ajtix.co.uk",512],["raja.fr",513],["rajarani.de",513],["rajapack.*",[513,514]],["avery-zweckform.com",515],["1xinternet.com",515],["futterhaus.de",515],["dasfutterhaus.at",515],["frischeparadies.de",515],["fmk-steuer.de",515],["selgros.de",515],["transgourmet.de",515],["mediapart.fr",516],["athlon.com",517],["alumniportal-deutschland.org",518],["snoopmedia.com",518],["myguide.de",518],["daad.de",518],["cornelsen.de",[519,520]],["vinmonopolet.no",522],["tvp.info",523],["tvp.pl",523],["tvpworld.com",523],["brtvp.pl",523],["tvpparlament.pl",523],["belsat.eu",523],["warnung.bund.de",524],["mediathek.lfv-bayern.de",525],["allegro.*",526],["allegrolokalnie.pl",526],["ceneo.pl",526],["czc.cz",526],["eon.pl",[527,528]],["ylasatakunta.fi",[529,530]],["mega-image.ro",531],["louisvuitton.com",532],["bodensee-airport.eu",533],["department56.com",534],["allendesignsstudio.com",534],["designsbylolita.co",534],["shop.enesco.com",534],["savoriurbane.com",535],["miumiu.com",536],["church-footwear.com",536],["clickdoc.fr",537],["car-interface.com",538],["monolithdesign.it",538],["thematchahouse.com",538],["smileypack.de",[539,540]],["finom.co",541],["orange.es",[542,543]],["fdm-travel.dk",544],["hummel.dk",544],["jysk.nl",544],["power.no",544],["skousen.dk",544],["velliv.dk",544],["whiteaway.com",544],["whiteaway.no",544],["whiteaway.se",544],["skousen.no",544],["energinet.dk",544],["elkjop.no",544],["medimax.de",545],["costautoricambi.com",546],["lotto.it",546],["readspeaker.com",546],["team.blue",546],["ibistallinncenter.ee",547],["aaron.ai",548],["futureverse.com",549],["tandem.co.uk",549],["insights.com",550],["thebathcollection.com",551],["coastfashion.com",[552,553]],["oasisfashion.com",[552,553]],["warehousefashion.com",[552,553]],["misspap.com",[552,553]],["karenmillen.com",[552,553]],["boohooman.com",[552,553]],["hdt.de",554],["wolt.com",555],["xohotels.com",556],["sourcepoint.theguardian.com",[556,718]],["sim24.de",557],["tnt.com",558],["uza.be",559],["uzafoundation.be",559],["uzajobs.be",559],["bergzeit.*",[560,561]],["cinemas-lumiere.com",562],["cdiscount.com",563],["brabus.com",564],["roborock.com",565],["strumentimusicali.net",566],["maisonmargiela.com",567],["webfleet.com",568],["dragonflyshipping.ca",569],["broekhuis.nl",570],["groningenairport.nl",570],["nemck.cz",571],["zdfheute.de",572],["sap-press.com",573],["roughguides.com",[574,575]],["korvonal.com",576],["rexbo.*",578],["itau.com.br",579],["bbg.gv.at",580],["portal.taxi.eu",581],["topannonces.fr",582],["homap.fr",583],["artifica.fr",584],["plan-interactif.com",584],["ville-cesson.fr",584],["moismoliere.com",585],["unihomes.co.uk",586],["bkk.hu",587],["coiffhair.com",588],["ptc.eu",589],["ziegert-group.com",[590,699]],["lassuranceretraite.fr",591],["interieur.gouv.fr",591],["toureiffel.paris",591],["economie.gouv.fr",591],["education.gouv.fr",591],["livoo.fr",591],["su.se",591],["zappo.fr",591],["smdv.de",592],["digitalo.de",592],["petiteamelie.*",593],["mojanorwegia.pl",594],["koempf24.ch",[595,596]],["teichitekten24.de",[595,596]],["koempf24.de",[595,596]],["wolff-finnhaus-shop.de",[595,596]],["asnbank.nl",597],["blgwonen.nl",597],["regiobank.nl",597],["snsbank.nl",597],["vulcan.net.pl",[598,599]],["ogresnovads.lv",600],["partenamut.be",601],["pirelli.com",602],["unicredit.it",603],["effector.pl",604],["zikodermo.pl",[605,606]],["devolksbank.nl",607],["caixabank.es",608],["me.motorsport.com>>",609],["motorsport.com>>",610],["cyberport.de",611],["cyberport.at",611],["slevomat.cz",612],["kfzparts24.de",613],["runnersneed.com",614],["aachener-zeitung.de",615],["sportpursuit.com",616],["druni.es",[617,628]],["druni.pt",[617,628]],["delta.com",618],["onliner.by",[619,620]],["vejdirektoratet.dk",621],["usaa.com",622],["consorsbank.de",623],["metroag.de",624],["kupbilecik.pl",625],["oxfordeconomics.com",626],["routershop.nl",627],["woo.pt",627],["e-jumbo.gr",629],["alza.*",630],["rmf.fm",632],["rmf24.pl",632],["tracfone.com",633],["lequipe.fr",634],["global.abb",635],["gala.fr",636],["purepeople.com",637],["3sat.de",638],["zdf.de",638],["filmfund.lu",639],["welcometothejungle.com",639],["triblive.com",640],["rai.it",641],["fbto.nl",642],["europa.eu",643],["caisse-epargne.fr",644],["banquepopulaire.fr",644],["bigmammagroup.com",645],["studentagency.sk",645],["studentagency.eu",645],["winparts.be",646],["winparts.nl",646],["winparts.eu",647],["winparts.ie",647],["winparts.se",647],["sportano.*",[648,649]],["crocs.*",650],["chronext.ch",651],["chronext.de",651],["chronext.at",651],["chronext.com",652],["chronext.co.uk",652],["chronext.fr",653],["chronext.nl",654],["chronext.it",655],["galerieslafayette.com",656],["bazarchic.com",657],["stilord.*",658],["tiko.pt",659],["nsinternational.com",660],["meinbildkalender.de",661],["gls-group.com",662],["gls-group.eu",662],["univie.ac.at",662],["chilis.com",663],["account.bhvr.com",665],["everand.com",665],["lucidchart.com",665],["intercars.ro",[665,666]],["scribd.com",665],["guidepoint.com",665],["erlebnissennerei-zillertal.at",667],["hintertuxergletscher.at",667],["tiwag.at",667],["playseatstore.com",668],["tivify.tv>>",669],["swiss-sport.tv",670],["targobank-magazin.de",671],["zeit-verlagsgruppe.de",671],["online-physiotherapie.de",671],["kieferorthopaede-freisingsmile.de",672],["nltraining.nl",673],["kmudigital.at",674],["mintysquare.com",675],["consent.thetimes.com",676],["cadenaser.com",677],["berlinale.de",678],["lebonlogiciel.com",679],["iberiaexpress.com",680],["easycosmetic.ch",681],["pharmastar.it",682],["washingtonpost.com",683],["brillenplatz.de",684],["angelplatz.de",684],["dt.mef.gov.it",685],["raffeldeals.com",686],["stepstone.de",687],["kobo.com",688],["zoxs.de",690],["offistore.fi",691],["collinsaerospace.com",692],["radioapp.lv",695],["hagengrote.de",696],["hemden-meister.de",696],["vorteilshop.com",697],["capristores.gr",698],["getaround.com",700],["technomarket.bg",701],["epiphone.com",703],["gibson.com",703],["maestroelectronics.com",703],["cropp.com",[704,705]],["housebrand.com",[704,705]],["mohito.com",[704,705]],["autoczescizielonki.pl",706],["b-s.de",707],["novakid.pl",708],["piecesauto24.com",709],["earpros.com",710],["portalridice.cz",711],["kitsapcu.org",712],["nutsinbulk.*",713],["berlin-buehnen.de",714],["metropoliten.rs",715],["educa2.madrid.org",716],["immohal.de",717],["rtlplay.be",719],["natgeotv.com",719],["llama.com",720],["meta.com",720],["setasdesevilla.com",721],["cruyff-foundation.org",722],["allianz.*",723],["energiedirect-bayern.de",724],["postnl.be",725],["postnl.nl",725],["sacyr.com",726],["volkswagen-newsroom.com",727],["openbank.*",728],["tagus-eoficina.grupogimeno.com",729],["tidal.com",730],["knax.de",731],["ordblindenetvaerket.dk",732],["boligbeton.dk",732],["dukh.dk",732],["pevgrow.com",733],["ya.ru",734],["ipolska24.pl",735],["17bankow.com",735],["kazimierzdolny.pl",735],["vpolshchi.pl",735],["dobreprogramy.pl",[735,736]],["essanews.com",735],["money.pl",735],["autokult.pl",735],["komorkomania.pl",735],["polygamia.pl",735],["autocentrum.pl",735],["homebook.pl",735],["domodi.pl",735],["jastrzabpost.pl",735],["open.fm",735],["gadzetomania.pl",735],["fotoblogia.pl",735],["abczdrowie.pl",735],["parenting.pl",735],["kafeteria.pl",735],["vibez.pl",735],["wakacje.pl",735],["extradom.pl",735],["totalmoney.pl",735],["superauto.pl",735],["nerwica.com",735],["forum.echirurgia.pl",735],["dailywrap.net",735],["pysznosci.pl",735],["genialne.pl",735],["finansowysupermarket.pl",735],["deliciousmagazine.pl",735],["audioteka.com",735],["easygo.pl",735],["so-magazyn.pl",735],["o2.pl",735],["pudelek.pl",735],["benchmark.pl",735],["wp.pl",735],["altibox.dk",737],["altibox.no",737],["talksport.com",738],["zuiderzeemuseum.nl",739],["gota.io",740],["nwzonline.de",741],["scaleway.com",742],["bistro.sk",743],["spk-schaumburg.de",744],["computerbase.de",745],["comdirect.de",746],["metro.co.uk",747],["imaios.com",748],["myprivacy.dpgmedia.nl",749],["myprivacy.dpgmedia.be",749],["www.dpgmediagroup.com",749],["exxen.com",750],["cbsnews.com",751],["infshop.fi",752],["jimms.fi",753],["avinor.no",754],["accursia-capital.de",755],["joyn.de",756],["oeq.org",757],["codewars.com",758],["formazionepro.it",759]]);
const exceptionsMap = new Map([["facebook.com",[52,53]],["twitter.com",[52,53,54]],["youtube.com",[52,53,54]],["businessinsider.com",[54]],["instagram.com",[54]]]);
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
