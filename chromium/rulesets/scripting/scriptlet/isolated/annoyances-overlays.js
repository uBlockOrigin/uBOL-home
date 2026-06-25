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

// ruleset: annoyances-overlays

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets() {

/******************************************************************************/

function getCookieFn(
    name = ''
) {
    const safe = safeSelf();
    for ( const s of safe.String_split.call(document.cookie, /\s*;\s*/) ) {
        const pos = s.indexOf('=');
        if ( pos === -1 ) { continue; }
        if ( s.slice(0, pos) !== name ) { continue; }
        return s.slice(pos+1).trim();
    }
}

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

function getSafeCookieValuesFn() {
    return [
        'accept', 'reject',
        'accepted', 'rejected', 'notaccepted',
        'allow', 'disallow', 'deny',
        'allowed', 'denied',
        'approved', 'disapproved',
        'checked', 'unchecked',
        'dismiss', 'dismissed',
        'enable', 'disable',
        'enabled', 'disabled',
        'essential', 'nonessential',
        'forbidden', 'forever',
        'hide', 'hidden',
        'necessary', 'required',
        'ok',
        'on', 'off',
        'true', 't', 'false', 'f',
        'yes', 'y', 'no', 'n',
        'all', 'none', 'functional',
        'granted', 'done',
        'decline', 'declined',
        'closed', 'next', 'mandatory',
        'disagree', 'agree',
    ];
}

function onIdleFn(fn, options) {
    if ( self.requestIdleCallback ) {
        return self.requestIdleCallback(fn, options);
    }
    return self.requestAnimationFrame(fn);
}

function removeClass(
    rawToken = '',
    rawSelector = '',
    behavior = ''
) {
    if ( typeof rawToken !== 'string' ) { return; }
    if ( rawToken === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('remove-class', rawToken, rawSelector, behavior);
    const tokens = safe.String_split.call(rawToken, /\s*\|\s*/);
    const selector = tokens
        .map(a => `${rawSelector}.${CSS.escape(a)}`)
        .join(',');
    if ( safe.logLevel > 1 ) {
        safe.uboLog(logPrefix, `Target selector:\n\t${selector}`);
    }
    const mustStay = /\bstay\b/.test(behavior);
    let timer;
    const rmclass = ( ) => {
        timer = undefined;
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                node.classList.remove(...tokens);
                safe.uboLog(logPrefix, 'Removed class(es)');
            }
        } catch {
        }
        if ( mustStay ) { return; }
        if ( document.readyState !== 'complete' ) { return; }
        observer.disconnect();
    };
    const mutationHandler = mutations => {
        if ( timer !== undefined ) { return; }
        let skip = true;
        for ( let i = 0; i < mutations.length && skip; i++ ) {
            const { type, addedNodes, removedNodes } = mutations[i];
            if ( type === 'attributes' ) { skip = false; }
            for ( let j = 0; j < addedNodes.length && skip; j++ ) {
                if ( addedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
            for ( let j = 0; j < removedNodes.length && skip; j++ ) {
                if ( removedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
        }
        if ( skip ) { return; }
        timer = onIdleFn(rmclass, { timeout: 67 });
    };
    const observer = new MutationObserver(mutationHandler);
    const start = ( ) => {
        rmclass();
        observer.observe(document, {
            attributes: true,
            attributeFilter: [ 'class' ],
            childList: true,
            subtree: true,
        });
    };
    runAt(( ) => {
        start();
    }, /\bcomplete\b/.test(behavior) ? 'idle' : 'loading');
}

function removeCookie(
    needle = ''
) {
    if ( typeof needle !== 'string' ) { return; }
    const safe = safeSelf();
    const reName = safe.patternToRegex(needle);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 1);
    const throttle = (fn, ms = 500) => {
        if ( throttle.timer !== undefined ) { return; }
        throttle.timer = setTimeout(( ) => {
            throttle.timer = undefined;
            fn();
        }, ms);
    };
    const baseURL = new URL(document.baseURI);
    let targetDomain = extraArgs.domain;
    if ( targetDomain && /^\/.+\//.test(targetDomain) ) {
        const reDomain = new RegExp(targetDomain.slice(1, -1));
        const match = reDomain.exec(baseURL.hostname);
        targetDomain = match ? match[0] : undefined;
    }
    const remove = ( ) => {
        safe.String_split.call(document.cookie, ';').forEach(cookieStr => {
            const pos = cookieStr.indexOf('=');
            if ( pos === -1 ) { return; }
            const cookieName = cookieStr.slice(0, pos).trim();
            if ( reName.test(cookieName) === false ) { return; }
            const part1 = cookieName + '=';
            const part2a = `; domain=${baseURL.hostname}`;
            const part2b = `; domain=.${baseURL.hostname}`;
            let part2c, part2d;
            if ( targetDomain ) {
                part2c = `; domain=${targetDomain}`;
                part2d = `; domain=.${targetDomain}`;
            } else if ( document.domain ) {
                const domain = document.domain;
                if ( domain !== baseURL.hostname ) {
                    part2c = `; domain=.${domain}`;
                }
                if ( domain.startsWith('www.') ) {
                    part2d = `; domain=${domain.replace('www', '')}`;
                }
            }
            const part3 = '; path=/';
            const part4 = '; Max-Age=-1000; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = part1 + part4;
            document.cookie = part1 + part2a + part4;
            document.cookie = part1 + part2b + part4;
            document.cookie = part1 + part3 + part4;
            document.cookie = part1 + part2a + part3 + part4;
            document.cookie = part1 + part2b + part3 + part4;
            if ( part2c !== undefined ) {
                document.cookie = part1 + part2c + part3 + part4;
            }
            if ( part2d !== undefined ) {
                document.cookie = part1 + part2d + part3 + part4;
            }
        });
    };
    remove();
    window.addEventListener('beforeunload', remove);
    if ( typeof extraArgs.when !== 'string' ) { return; }
    const supportedEventTypes = [ 'scroll', 'keydown' ];
    const eventTypes = safe.String_split.call(extraArgs.when, /\s/);
    for ( const type of eventTypes ) {
        if ( supportedEventTypes.includes(type) === false ) { continue; }
        document.addEventListener(type, ( ) => {
            throttle(remove);
        }, { passive: true });
    }
}

function removeNodeText(
    nodeName,
    includes,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'includes', includes || '', ...extraArgs);
}

function replaceNodeTextFn(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-node-text.fn', ...Array.from(arguments));
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const reIncludes = extraArgs.includes || extraArgs.condition
        ? safe.patternToRegex(extraArgs.includes || extraArgs.condition, 'ms')
        : null;
    const reExcludes = extraArgs.excludes
        ? safe.patternToRegex(extraArgs.excludes, 'ms')
        : null;
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Quitting');
        }
    };
    const textContentFactory = (( ) => {
        const out = { createScript: s => s };
        const { trustedTypes: tt } = self;
        if ( tt instanceof Object ) {
            if ( typeof tt.getPropertyType === 'function' ) {
                if ( tt.getPropertyType('script', 'textContent') === 'TrustedScript' ) {
                    return tt.createPolicy(getRandomTokenFn(), out);
                }
            }
        }
        return out;
    })();
    let sedCount = extraArgs.sedCount || 0;
    const handleNode = node => {
        const before = node.textContent;
        if ( reIncludes ) {
            reIncludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reIncludes, before) === false ) { return true; }
        }
        if ( reExcludes ) {
            reExcludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reExcludes, before) ) { return true; }
        }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        rePattern.lastIndex = 0;
        const after = pattern !== ''
            ? before.replace(rePattern, replacement)
            : replacement;
        node.textContent = node.nodeName === 'SCRIPT'
            ? textContentFactory.createScript(after)
            : after;
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Text before:\n${before.trim()}`);
        }
        safe.uboLog(logPrefix, `Text after:\n${after.trim()}`);
        return sedCount === 0 || (sedCount -= 1) !== 0;
    };
    const handleMutations = mutations => {
        for ( const mutation of mutations ) {
            for ( const node of mutation.addedNodes ) {
                if ( reNodeName.test(node.nodeName) === false ) { continue; }
                if ( handleNode(node) ) { continue; }
                stop(false); return;
            }
        }
    };
    const observer = new MutationObserver(handleMutations);
    observer.observe(document, { childList: true, subtree: true });
    if ( document.documentElement ) {
        const treeWalker = document.createTreeWalker(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let count = 0;
        for (;;) {
            const node = treeWalker.nextNode();
            count += 1;
            if ( node === null ) { break; }
            if ( reNodeName.test(node.nodeName) === false ) { continue; }
            if ( node === document.currentScript ) { continue; }
            if ( handleNode(node) ) { continue; }
            stop(); break;
        }
        safe.uboLog(logPrefix, `${count} nodes present before installing mutation observer`);
    }
    if ( extraArgs.stay ) { return; }
    runAt(( ) => {
        const quitAfter = extraArgs.quitAfter || 0;
        if ( quitAfter !== 0 ) {
            setTimeout(( ) => { stop(); }, quitAfter);
        } else {
            stop();
        }
    }, 'interactive');
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( Object.hasOwn(targets, prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
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
        'Object_toString': Object.prototype.toString,
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

function setCookie(
    name = '',
    value = '',
    path = ''
) {
    if ( name === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-cookie', name, value, path);
    const normalized = value.toLowerCase();
    const match = /^("?)(.+)\1$/.exec(normalized);
    const unquoted = match && match[2] || normalized;
    const validValues = getSafeCookieValuesFn();
    if ( validValues.includes(unquoted) === false ) {
        if ( /^-?\d+$/.test(unquoted) === false ) { return; }
        const n = parseInt(value, 10) || 0;
        if ( n < -32767 || n > 32767 ) { return; }
    }

    const done = setCookieFn(
        false,
        name,
        value,
        '',
        path,
        safe.getExtraArgs(Array.from(arguments), 3)
    );

    if ( done ) {
        safe.uboLog(logPrefix, 'Done');
    }
}

function setCookieFn(
    trusted = false,
    name = '',
    value = '',
    expires = '',
    path = '',
    options = {},
) {
    // https://datatracker.ietf.org/doc/html/rfc2616#section-2.2
    // https://github.com/uBlockOrigin/uBlock-issues/issues/2777
    if ( trusted === false && /[^!#$%&'*+\-.0-9A-Z[\]^_`a-z|~]/.test(name) ) {
        name = encodeURIComponent(name);
    }
    // https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1
    // The characters [",] are given a pass from the RFC requirements because
    // apparently browsers do not follow the RFC to the letter.
    if ( /[^ -:<-[\]-~]/.test(value) ) {
        value = encodeURIComponent(value);
    }

    const cookieBefore = getCookieFn(name);
    if ( cookieBefore !== undefined && options.dontOverwrite ) { return; }
    if ( cookieBefore === value && options.reload ) { return; }

    const cookieParts = [ name, '=', value ];
    if ( expires !== '' ) {
        cookieParts.push('; expires=', expires);
    }

    if ( path === '' ) { path = '/'; }
    else if ( path === 'none' ) { path = ''; }
    if ( path !== '' && path !== '/' ) { return; }
    if ( path === '/' ) {
        cookieParts.push('; path=/');
    }

    if ( trusted ) {
        if ( options.domain ) {
            let domain = options.domain;
            if ( /^\/.+\//.test(domain) ) {
                const baseURL = new URL(document.baseURI);
                const reDomain = new RegExp(domain.slice(1, -1));
                const match = reDomain.exec(baseURL.hostname);
                domain = match ? match[0] : undefined;
            }
            if ( domain ) {
                cookieParts.push(`; domain=${domain}`);
            }
        }
        cookieParts.push('; Secure');
    } else if ( /^__(Host|Secure)-/.test(name) ) {
        cookieParts.push('; Secure');
    }

    try {
        document.cookie = cookieParts.join('');
    } catch {
    }

    const done = getCookieFn(name) === value;
    if ( done && options.reload ) {
        window.location.reload();
    }

    return done;
}

function setLocalStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('local', false, key, value, options);
}

function setLocalStorageItemFn(
    which = 'local',
    trusted = false,
    key = '',
    value = '',
    options = {}
) {
    if ( key === '' ) { return; }

    // For increased compatibility with AdGuard
    if ( value === 'emptyArr' ) {
        value = '[]';
    } else if ( value === 'emptyObj' ) {
        value = '{}';
    }

    const trustedValues = [
        '',
        'undefined', 'null',
        '{}', '[]', '""',
        '$remove$',
        ...getSafeCookieValuesFn(),
    ];

    if ( trusted ) {
        if ( value.includes('$now$') ) {
            value = value.replaceAll('$now$', Date.now());
        }
        if ( value.includes('$currentDate$') ) {
            value = value.replaceAll('$currentDate$', `${Date()}`);
        }
        if ( value.includes('$currentISODate$') ) {
            value = value.replaceAll('$currentISODate$', (new Date()).toISOString());
        }
    } else {
        const normalized = value.toLowerCase();
        const match = /^("?)(.+)\1$/.exec(normalized);
        const unquoted = match && match[2] || normalized;
        if ( trustedValues.includes(unquoted) === false ) {
            if ( /^-?\d+$/.test(unquoted) === false ) { return; }
            const n = parseInt(unquoted, 10) || 0;
            if ( n < -32767 || n > 32767 ) { return; }
        }
    }

    let modified = false;

    try {
        const storage = self[`${which}Storage`];
        if ( value === '$remove$' ) {
            const safe = safeSelf();
            const pattern = safe.patternToRegex(key, undefined, true );
            const toRemove = [];
            for ( let i = 0, n = storage.length; i < n; i++ ) {
                const key = storage.key(i);
                if ( pattern.test(key) ) { toRemove.push(key); }
            }
            modified = toRemove.length !== 0;
            for ( const key of toRemove ) {
                storage.removeItem(key);
            }
        } else {

            const before = storage.getItem(key);
            const after = `${value}`;
            modified = after !== before;
            if ( modified ) {
                storage.setItem(key, after);
            }
        }
    } catch {
    }

    if ( modified && typeof options.reload === 'number' ) {
        setTimeout(( ) => { window.location.reload(); }, options.reload);
    }
}

function setSessionStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('session', false, key, value, options);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 6 */
[setCookie,setLocalStorageItem,removeClass,removeCookie,setSessionStorageItem,removeNodeText];

const $scriptletArgs$ = /* 209 */ ["block-popuproadblock","true","aonehidepopupnewsletter1727208240","1","the_cookie719","useExitIntent","exit-intent","cp_style_3841","m6e-newsletter","popupIsClosed","emailLightBox","pum-open-overlay","body","stay","root-modal-container-open","hide-cookbook-modal-0","interstitial","aside","zephr-modal-open","newsletterPopupCount","blaize_session","blaize_tracking_id","open-pw","awpopup_450030403","popupShown","awpopup_501941328","popup_closed","email_modal","subscribe-pop-active","blocking-signup","html","huck-newsletter-popup","newsletterModal","enewsOptin","g1_popup_disabled","email-subscribe-check-41be04a9","false","SuppressInterstitial","","reload","marketing-modal-closed-1","2","r_p_s_n","viewedOuibounceModal","hidePopUp","modal-open","newsletter","js-show-newsletter-popup","bytes_signup_modal_viewed","iib_signup_popup","-1","dpp_paywall","pay_ent_msmp","pay_ent_pass","pum-9137","mm_f_45691","pum-605611","isNewsletterPopupShown","nbaSIBWidgetSeen","mailerlite:forms:shown:109925949413262377","floating-sign-up-dismissed","emailPopupDismissed","has-intro-popup","modal-in","show-intro-popup","pum-276000","uf_signup_bar","BRANCH_BANNER_PAGE_LOAD","EMAIL_CAPTURE_MODAL_STOP","show-email-intake-form","articleModalShown","sgID","st_newsletter_splash_desktop_seen","newsletter_signup_promo","newsletter_signup_views","hasShownPopup","jetpack_post_subscribe_modal_dismissed","CNN_MAIL_MAGAZIN","modalViewed","oxy-modal-active","newsletterLightboxDisplayed","emailSignupModal_isShown","MCPopupClosed","yes","welcome_modal_email_ts","signUpModalClosed_slot-paulaschoice_us-global-signUpModal-sfmcModal","newsletter-newsletter-popup","user_closed_pop_up","Columbia_AT_emailPopup","Columbia_DE_emailPopup","Columbia_ES_emailPopup","Columbia_FR_emailPopup","Columbia_IT_emailPopup","Columbia_UK_emailPopup","banner_session","mystery_popup","sws-gwpop","popup-newsletter","enews_popup_session","script","debugger","oncontextmenu","contextmenu","style","-ms-user-select: none","onselectstart","ctrlKey","__ADB_COOLDOWN__","adblock_modal_dismissed","DWEB_PIN_IMAGE_CLICK_COUNT","$remove$","unauthDownloadCount","/wccp|contextmenu/","/wccp|user-select/","disableSelection","copyprotect","/parseInt.*push.*setTimeout.*try.*catch/","/contextmenu|wpcp/","rprw","hasAdAlert","header","click-to-scroll","/disableclick|devtool/","social-qa/machineId","simple-funnel-name","/setTimeout.*style/","disable-selection","reEnable","stopPrntScr","kpwc","/adblock/i","stopRefreshSite","nocontextmenu","devtoolsDetector","console.clear","wccp_pro","initPopup","user-select","/contextmenu|devtool/","preventDefault","ezgwcc","wccp","isadb","e.preventDefault();","document.oncontextmenu","btnHtml","document.onselectstart","/$.*ready.*setInterval/","fs.adb.dis","disable_show_error","WkdGcGJIbEpiV0ZuWlVSaGRHRT0=","disable_copy","nocontext","XF","/articlesLimit|articlesRead|previousPage/","when","scroll keydown","/document.onkeydown|document.ondragstart/","fetch","devtools","while(!![]){try{var","ad_blocker","/closeWindow\\(\\)|clickIE\\(\\)|reEnable\\(\\)/","adblock","ab927c49cf1b","detectDevTool","/Clipboard|oncontextmenu|wpcp|keyCode/","/-webkit-user-select|webkit-appearance/","loc.hostname","disableselect","_ad","0","_ngViCo-SupporterPromo","selection","checkAdsBlocked","adblockNoticePermaDismiss","::selection","keyCode","window.location.href","/devtool|debugger/","/devtoolsDetector|keyCode|preventDefault/","leftPanelOpen","/^freeVideoFriendly/","contentprotector","/contextmenu|reEnable/","/adbl/i","/oncontextmenu|disableselect/","iAgree","firebox_3330","/contextmenu|oncopy/","getComputedStyle","onerror","/oncontextmenu|wccp/","dragscroll","clipboard_disabled","userData_","/wpcp|contextmenu|unselectable/","as_init","popupClosed","darken","no_scroll","complete","blurry","body > :not(.m-fbPopup)","_tsr_pc","FTR_Article_PageView","/oncontextmenu|onselectstart/","/wpcp|contextmenu/","TUTORIAL_VIEWED_SNACKS_HOME"];

const $scriptletArglists$ = /* 191 */ "0,0,1;0,2,3;0,4,1;1,5,1;0,6,1;0,7,1;0,8,3;0,9,3;1,10,1;2,11,12,13;2,14,12,13;1,15,1;2,16,17,13;2,18,12,13;1,19,3;3,20;3,21;2,22,12,13;0,23,3;0,24,1;0,25,3;0,26,1;0,27,1;2,28,12,13;2,29,30,13;0,31,1;0,32,1;0,33,3;0,34,3;1,35,36;0,37,1,38,39,3;0,40,41;0,42,3;0,43,1;0,44,1;2,45,38,13;0,46,1;2,47,38,13;0,48,3;0,49,50;3,51;3,52;3,53;0,54,1;0,55,1;0,56,1;0,57,36,38,39,3;1,58,1;0,59,3;4,60,1;4,61,3;2,62,30,13;2,63,30,13;2,64,30,13;0,65,1;2,45,12,13;0,66,3;1,67,3;1,68,3;1,69,36;4,70,1;3,71;0,72,1;0,73,1;0,74,3;1,75,1;0,76,1;0,77,3;1,78,3;2,79,12,13;0,80,1;4,81,1;0,82,83;0,84,3;1,85,3;0,86,1;1,87,1;0,88,3;0,89,3;0,90,3;0,91,3;0,92,3;0,93,3;4,94,1;0,95,1;0,96,3;0,97,1;4,98,3;5,99,100;5,99,101;5,99,102;5,103,104;5,99,105;5,99,106;5,99,107;4,108,1;1,109,110;1,111,110;5,99,112;5,103,113;5,99,114;5,99,115;5,99,116;5,99,117;1,118,110;2,119,120;2,121,12;5,99,122;1,123,110;1,124,110;5,99,125;2,126,12;5,99,127;5,99,128;3,129;5,99,130;5,99,131;5,99,132;5,99,133;5,99,134;5,99,135;5,99,136;5,103,137;5,99,138;5,99,139;0,140,3;5,99,141;5,99,142;5,99,143;5,99,144;5,99,145;5,99,146;5,99,147;4,148,3;5,99,149;1,150,110;5,99,151;5,99,152;5,99,153;3,154,155,156;5,99,157;5,99,158;5,99,159;5,99,160;1,161,36;5,99,162;4,163,1;5,99,164;5,99,165;5,99,166;5,103,167;5,99,168;5,99,163;5,99,169;0,170,171;3,172;5,103,173;5,99,174;1,175,1;5,103,176;5,99,177;5,99,178;5,99,179;5,99,180;0,181,171;1,182,110;5,99,183;5,99,184;5,99,185;5,99,186;0,187,3;0,188,3;5,99,189;5,99,190;5,99,191;5,99,192;2,193;5,99,194;5,99,195;5,99,196;5,99,197;4,198,1;2,45,12;2,199,12;2,12,200,201;2,202,203,13;0,204,171;0,205,41;5,99,206;5,99,207;1,208,1";

const $scriptletArglistRefs$ = /* 394 */ "37;187;139;7;119;120;59;51,52,53;182;90;142;175;86;108,109;90;67;109;73;187;116;17;165;130;105;145;83;187;102;185;118;27;14;10;88;164;121;13;21;90,122;144;63,64;46;118;51,52,53;152;127;140;129;2;89;25;55;163;149,150;88;106;187;96,97;111;51,52,53;49;143;117;187;133;177;187;76;46;170;93;38;152;51,52,53;139;133;92;51,52,53;51,52,53;179;57,58;139;107;123;51,52,53;145;51,52,53;75;66;102;51,52,53;139;15,16;110;69;187;51,52,53;56;146;6;187;138;158;160;51,52,53;51,52,53;51,52,53;51,52,53;139;36;187;187;73;139;134;187;166;109;20;187;94;187;130;22;88;1;11;187;51,52,53;139;187;55;88;161;187;130;51,52,53;112;41,42;5;168;51,52,53;89;190;187;187;130;89;90;90;130;118;187;155;90;184;4;21;104;145;139;90;61;51,52,53;162;85;51,52,53;51,52,53;124;131;103;130;118;28;173;187;187;90;51,52,53;187;187;51,52,53;187;187;88;23;33;159;34;187;187;187;113;55;51,52,53;130;51,52,53;51,52,53;51,52,53;147;147;147;24;89;40;45;91;183;124;187;187;187;51,52,53;47;19;187;139;26;50;181;115;51,52,53;187;32;148;152,154;51,52,53;4;176;172;74;147;147;147;147;147;147;125;62;9;51,52,53;84;139;55;187;178;3;187;187;187;139;113;136,137;187;187;8;70;188;188;51,52,53;51,52,53;187;147;147;147;126;54;171;71;51,52,53;187;51,52,53;87;60;141;35;12;128;51,52,53;187;147;147;147;157;31;132;98,99;187;139;72;180;48;51,52,53;118;51,52,53;117;187;21;0;147;147;147;147;147;147;147;147;147;147;147;29;66;101;93;51,52,53;114;51,52,53;174;51,52,53;68;169;175;129;189;187;30;90;90;51,52,53;187;51,52,53;18;147;147;51,52,53;51,52,53;51,52,53;186;129;77;78;79;80;81;100;113,156;21;147;88;51,52,53;187;51,52,53;43;147;147;147;147;44;95;147;88;135;51,52,53;82;51,52,53;51,52,53;147;147;51,52,53;51,52,53;51,52,53;167;51,52,53;39;65;51,52,53;145;51,52,53;153;145;151;151;151;151;151;51,52,53;151;51,52,53;151;151;151;151;151;145";

const $scriptletHostnames$ = /* 394 */ ["dgb.de","t3.com","cbr.com","pbs.org","sbot.cf","tvhay.*","core.app","dkb.blog","hetek.hu","rds.live","vembed.*","2mnews.ro","assos.com","brainly.*","cespun.eu","cnn.co.jp","eodev.com","funko.com","itpro.com","jpost.com","money.com","nebula.tv","pling.com","pornhub.*","redisex.*","sears.com","space.com","strtape.*","vezess.hu","vidmoly.*","vokey.com","action.com","all3dp.com","camcaps.io","fandom.com","fjordd.com","forbes.com","lowpass.cc","oploverz.*","scenexe.io","snopes.com","toysrus.ca","watchx.top","webworm.co","xanimu.com","161.97.70.5","anascrie.ro","bg-gledai.*","diastixo.gr","hiphopa.net","huckmag.com","mandiner.hu","mostream.us","mrbenne.com","nicekkk.com","novelza.com","pcgamer.com","pinterest.*","postype.com","racket.news","semafor.com","stblion.xyz","teamkong.tk","theweek.com","270towin.com","adressit.com","advnture.com","audialab.com","babiesrus.ca","bangbros.com","bookto09.com","coinbase.com","cosxplay.com","flowstate.fm","gamerant.com","getemoji.com","kashiland.jp","kunstler.com","latent.space","liddread.com","magnolia.com","movieweb.com","novelpia.com","playertv.net","popular.info","redecanais.*","sambowman.co","saucerco.com","shojiwax.com","streamtape.*","substack.com","thegamer.com","theverge.com","valid.x86.fr","wahaca.co.uk","whathifi.com","wonkette.com","30seconds.com","afterclass.io","artribune.com","avnetwork.com","broncoshq.com","camspider.com","cyberdom.blog","dossier.today","elysian.press","eugyppius.com","gamefile.news","howtogeek.com","jingdaily.com","kiplinger.com","livingetc.com","loungefly.com","makeuseof.com","mathcrave.com","moneyweek.com","nihongoaz.com","nosdevoirs.fr","oled-info.com","petsradar.com","roleplayer.me","shortlist.com","store.kde.org","streamily.com","streamvid.net","sweet-shop.si","tastemade.com","techradar.com","theankler.com","thethings.com","tomsguide.com","tweaktown.com","up4stream.com","vyvymanga.net","wallpaper.com","xfce-look.org","afterbabel.com","bolugundem.com","bonappetit.com","breachmedia.ca","cowcotland.com","duffelblog.com","e-panigiria.gr","estadao.com.br","fitandwell.com","gamesradar.com","gnome-look.org","infotrucker.ro","iptvromania.ro","klartext-ne.de","linux-apps.com","moviesapi.club","musicradar.com","newgrounds.com","nullforums.net","otpportalok.hu","railsnotes.xyz","readergrev.com","realpython.com","redecanaistv.*","screenrant.com","seriesperu.com","similarweb.com","slowboring.com","streamruby.com","sweetwater.com","techemails.com","thebulwark.com","themeslide.com","zipcode.com.ng","android1pro.com","appimagehub.com","asumanaksoy.com","awardsradar.com","bangkokpost.com","cinemablend.com","cyclingnews.com","espressocafe.ro","forkingpaths.co","fourfourtwo.com","golfmonthly.com","goto10retro.com","guitarworld.com","idealhome.co.uk","ilovetoplay.xyz","insider.fitt.co","intellinews.com","japonhentai.com","kermitlynch.com","livescience.com","loudersound.com","marieclaire.com","medeberiya.site","mightyape.co.nz","noahpinion.blog","opendesktop.org","piratewires.com","platformer.news","publicnotice.co","puzzle-lits.com","puzzle-loop.com","puzzle-tapa.com","restofworld.org","streambuddy.net","thedriftmag.com","thelensnola.org","togetogebox.org","traffihunter.hu","warungkomik.com","whatculture.com","whattowatch.com","whowhatwear.com","asiasentinel.com","clutchpoints.com","commondreams.org","creativebloq.com","dualshockers.com","egopowerplus.com","empirical.health","erzsebetvaros.hu","freefilesync.org","garbageday.email","guitarplayer.com","in.investing.com","inattvcom117.xyz","klsescreener.com","michaelmoore.com","monarchmoney.com","nichepcgamer.com","ofertecatalog.ro","paulaschoice.com","puzzle-chess.com","puzzle-masyu.com","puzzle-pipes.com","puzzle-slant.com","puzzle-tents.com","puzzle-words.com","scitechdaily.com","seattletimes.com","securityweek.com","semianalysis.com","sharperimage.com","simpleflying.com","suzukicycles.com","techlearning.com","theintercept.com","timesnownews.com","tomshardware.com","tvtechnology.com","womanandhome.com","androidpolice.com","blog.tangwudi.com","brokensilenze.net","countrylife.co.uk","cyclingweekly.com","duluthtrading.com","girlscoutshop.com","googleapis.com.de","googleapis.com.do","hamiltonnolan.com","honest-broker.com","marieclaire.co.uk","puzzle-hitori.com","puzzle-kakuro.com","puzzle-sudoku.com","terramirabilis.ro","thefederalist.com","tmnascommunity.eu","virginvoyages.com","americasvoice.news","androidcentral.com","aporiamagazine.com","bcliquorstores.com","campaignlive.co.uk","cheersandgears.com","chicagotribune.com","cityandstateny.com","gdrivedescarga.com","henrikkarlsson.xyz","homebuilding.co.uk","puzzle-binairo.com","puzzle-bridges.com","puzzle-shikaku.com","readcomiconline.li","theinformation.com","thejakartapost.com","tunovelaligera.com","windowscentral.com","xda-developers.com","yvonnebennetti.com","canuckaudiomart.com","clevercreations.org","computerenhance.com","freshlifecircle.com","friendlyatheist.com","homegymreview.co.uk","homesandgardens.com","jointhefollowup.com","press.princeton.edu","puzzle-aquarium.com","puzzle-dominosa.com","puzzle-galaxies.com","puzzle-heyawake.com","puzzle-kakurasu.com","puzzle-light-up.com","puzzle-norinori.com","puzzle-nurikabe.com","puzzle-shingoki.com","puzzle-stitches.com","puzzle-yin-yang.com","scaleofuniverse.com","skepticalraptor.com","skidrowreloaded.com","smartkhabrinews.com","statsignificant.com","technologyreview.jp","theclimatebrink.com","toweroffantasy.info","understandingai.org","urbanoutfitters.com","zabawkahurtownia.pl","adevarurisecrete.com","aventurainromania.ro","camereliveromania.ro","gardeningknowhow.com","gourmetfoodstore.com","japanesewithtomo.com","lyrical-nonsense.com","moreisdifferent.blog","myvouchercodes.co.uk","persuasion.community","plantpowercouple.com","puzzle-futoshiki.com","puzzle-nonograms.com","secretsofprivacy.com","strangeloopcanon.com","thebignewsletter.com","thestudentroom.co.uk","audiologyresearch.org","columbiasportswear.at","columbiasportswear.de","columbiasportswear.es","columbiasportswear.fr","columbiasportswear.it","hebrew4christians.com","monitoruldevrancea.ro","objectivebayesian.com","puzzle-shakashaka.com","stream.hownetwork.xyz","americafirstreport.com","digitalcameraworld.com","fullstackeconomics.com","ghostinternational.com","puzzle-battleships.com","puzzle-minesweeper.com","puzzle-skyscrapers.com","puzzle-star-battle.com","thebarentsobserver.com","jailbreakchangelogs.xyz","puzzle-thermometers.com","tips97tech.blogspot.com","www.watermarkremover.io","antiracismnewsletter.com","columbiasportswear.co.uk","construction-physics.com","experimental-history.com","puzzle-jigsaw-sudoku.com","puzzle-killer-sudoku.com","read.perspectiveship.com","engineeringleadership.xyz","newsletter.banklesshq.com","astoryofmasasstruggles.com","blog.codingconfessions.com","informationisbeautiful.net","interestingengineering.com","theintrinsicperspective.com","xn--90afacv0cu2a3cr.xn--p1ai","newsletter.eng-leadership.com","noicetranslations.blogspot.com","xn--90afacv0clj6ac0dxa.xn--p1ai","www-devonlive-com.translate.goog","www-insider-co-uk.translate.goog","www-kentlive-news.translate.goog","www-themirror-com.translate.goog","www-essexlive-news.translate.goog","newsletter.maartengrootendorst.com","www-football-london.translate.goog","unchartedterritories.tomaspueyo.com","www-cornwalllive-com.translate.goog","www-glasgowlive-co-uk.translate.goog","www-leeds--live-co-uk.translate.goog","www-liverpoolecho-co-uk.translate.goog","www-lincolnshirelive-co-uk.translate.goog","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

const $scriptletFromRegexes$ = /* 0 */ [];

const $hasEntities$ = true;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const entries = (( ) => {
    const docloc = document.location;
    const origins = [ docloc.origin ];
    if ( docloc.ancestorOrigins ) {
        origins.push(...docloc.ancestorOrigins);
    }
    return origins.map((origin, i) => {
        const beg = origin.indexOf('://');
        if ( beg === -1 ) { return; }
        const hn1 = origin.slice(beg+3)
        const end = hn1.indexOf(':');
        const hn2 = end === -1 ? hn1 : hn1.slice(0, end);
        if ( hn2.length === 0 ) { return; }
        const hns = [ hn2 ];
        for ( let pos = 0; ; ) {
            pos = hn2.indexOf('.', pos) + 1;
            if ( pos === 0 ) { break; }
            hns.push(hn2.slice(pos));
        }
        hns.push('*');
        const ens = [];
        if ( $hasEntities$ ) {
            for ( let hn of hns ) {
                for (;;) {
                    const pos = hn.lastIndexOf('.');
                    if ( pos === -1 ) { break; }
                    hn = hn.slice(0, pos);
                    ens.push(`${hn}.*`);
                }
            }
            ens.sort((a, b) => {
                const d = b.length - a.length;
                if ( d !== 0 ) { return d; }
                return a > b ? -1 : 1;
            });
        }
        return { hns, ens, i };
    }).filter(a => a);
})();
if ( entries.length === 0 ) { return; }

const todoIndices = new Set();
if ( $scriptletHostnames$.length ) {
    const collectArglistRefIndices = (out, hn, r) => {
        let l = 0, i = 0, d = 0;
        let candidate = '';
        while ( l < r ) {
            i = l + r >>> 1;
            candidate = $scriptletHostnames$[i];
            d = hn.length - candidate.length;
            if ( d === 0 ) {
                if ( hn === candidate ) {
                    out.add(i); break;
                }
                d = hn < candidate ? -1 : 1;
            }
            if ( d < 0 ) {
                r = i;
            } else {
                l = i + 1;
            }
        }
        return i + 1;
    };
    const indicesFromHostname = (out, hnDetails, suffix = '') => {
        if ( hnDetails.hns.length === 0 ) { return; }
        let r = $scriptletHostnames$.length;
        for ( const hn of hnDetails.hns ) {
            r = collectArglistRefIndices(out, `${hn}${suffix}`, r);
        }
        if ( $hasEntities$ ) {
            let r = $scriptletHostnames$.length;
            for ( const en of hnDetails.ens ) {
                r = collectArglistRefIndices(out, `${en}${suffix}`, r);
            }
        }
    };
    indicesFromHostname(todoIndices, entries[0]);
    if ( $hasAncestors$ ) {
        for ( const entry of entries ) {
            if ( entry.i === 0 ) { continue; }
            indicesFromHostname(todoIndices, entry, '>>');
        }
    }
    $scriptletHostnames$.length = 0;
}

// Collect arglist references
const todo = new Set();
if ( todoIndices.size !== 0 ) {
    const arglistRefs = $scriptletArglistRefs$.split(';');
    for ( const i of todoIndices ) {
        for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
            todo.add(ref);
        }
    }
}
if ( $hasRegexes$ ) {
    const { hns } = entries[0];
    for ( let i = 0, n = $scriptletFromRegexes$.length; i < n; i += 3 ) {
        const needle = $scriptletFromRegexes$[i+0];
        let regex;
        for ( const hn of hns ) {
            if ( hn.includes(needle) === false ) { continue; }
            if ( regex === undefined ) {
                regex = new RegExp($scriptletFromRegexes$[i+1]);
            }
            if ( regex.test(hn) === false ) { continue; }
            for ( const ref of JSON.parse(`[${$scriptletFromRegexes$[i+2]}]`) ) {
                todo.add(ref);
            }
        }
    }
}
if ( todo.size === 0 ) { return; }

// Execute scriplets
{
    const arglists = $scriptletArglists$.split(';');
    const args = $scriptletArgs$;
    for ( const ref of todo ) {
        if ( ref < 0 ) { continue; }
        if ( todo.has(~ref) ) { continue; }
        const arglist = JSON.parse(`[${arglists[ref]}]`);
        const fn = $scriptletFunctions$[arglist[0]];
        try { fn(...arglist.slice(1).map(a => args[a])); }
        catch { }
    }
}

/******************************************************************************/

// End of local scope
})();

void 0;
