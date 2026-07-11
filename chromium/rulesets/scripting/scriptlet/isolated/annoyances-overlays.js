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

function lookupElementsFn(directive, until = 0) {
    if ( lookupElementsFn.querySelectorEx === undefined ) {
        lookupElementsFn.getShadowRoot = elem => {
            if ( elem.openOrClosedShadowRoot ) { // Firefox
                return elem.openOrClosedShadowRoot;
            }
            if ( typeof chrome === 'object' ) { // Chromium
                if ( chrome.dom && chrome.dom.openOrClosedShadowRoot ) {
                    return chrome.dom.openOrClosedShadowRoot(elem);
                }
            }
            return elem.shadowRoot;
        };
        lookupElementsFn.queryOrEvaluateSelector = (selector, context) => {
            if ( selector.startsWith('xpath:') === false ) {
                return Array.from(context.querySelectorAll(selector));
            }
            const result = document.evaluate(selector.slice(6), context, null, 7, null);
            const out = [];
            if ( result.resultType === 7 ) {
                for ( let i = 0; i < result.snapshotLength; i++ ) {
                    out[i] = result.snapshotItem(i);
                }
            }
            return out;
        }
        lookupElementsFn.querySelectorEx = (selector, context = document) => {
            const pos = selector.indexOf(' >>> ');
            if ( pos === -1 ) {
                return lookupElementsFn.queryOrEvaluateSelector(selector, context);
            }
            const outside = selector.slice(0, pos).trim();
            const inside = selector.slice(pos + 5).trim();
            const elems = lookupElementsFn.queryOrEvaluateSelector(outside, context);
            const out = [];
            for ( let i = 0; i < elems.length; i++ ) {
                const shadowRoot = lookupElementsFn.getShadowRoot(elems[i]);
                if ( Boolean(shadowRoot) === false ) { continue; }
                lookupElementsFn.querySelectorEx(inside, shadowRoot).forEach(a => out.push(a));
            }
            return out;
        };
        lookupElementsFn.lookup = directive => {
            const beVisible = directive.startsWith('when-visible:');
            const selector = beVisible ? directive.slice(13) : directive;
            const elems = lookupElementsFn.querySelectorEx(selector);
            if ( beVisible !== true ) { return elems; }
            return elems.filter(a => a.checkVisibility({
                opacityProperty: true,
                visibilityProperty: true,
            }));
        };
        lookupElementsFn.lookupAsync = details => {
            const elems = lookupElementsFn.lookup(details.directive);
            if ( elems.length || Date.now() >= details.until ) {
                if ( details.observer ) {
                    details.observer.disconnect();
                    details.observer = undefined;
                }
                if ( details.timer ) {
                    offIdleFn(details.timer);
                    details.timer = undefined;
                }
                return details.resolve(elems);
            }
            if ( details.observer === undefined ) {
                details.observer = new MutationObserver(( ) => {
                    lookupElementsFn.lookupAsync(details);
                });
                details.observer.observe(document, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                });
            }
            if ( details.timer === undefined ) {
                details.timer = onIdleFn(( ) => {
                    details.timer = undefined;
                    lookupElementsFn.lookupAsync(details);
                }, { timeout: 151 });
            }
        };
    }
    if ( until === 0 ) {
        return lookupElementsFn.lookup(directive);
    }
    return new Promise(resolve => {
        lookupElementsFn.lookupAsync({ directive, until, resolve });
    });
}

function offIdleFn(id) {
    if ( self.requestIdleCallback ) {
        return self.cancelIdleCallback(id);
    }
    return self.cancelAnimationFrame(id);
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

function replaceNodeText(
    nodeName,
    pattern,
    replacement,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, pattern, replacement, ...extraArgs);
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
    if ( safeSelf.safe ) {
        return safeSelf.safe;
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
    safeSelf.safe = safe;
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
            out.re = new RegExp(`^${safe.escapeRegexChars(key)}=${safe.escapeRegexChars(value)}`);
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
        steps.push(11000);
    }

    const timeout = steps.pop();

    const waitForTime = ms => {
        return new Promise(resolve => {
            safe.uboLog(logPrefix, `Waiting for ${ms} ms`);
            waitForTime.timer = setTimeout(( ) => {
                waitForTime.timer = undefined;
                resolve();
            }, ms);
        });
    };

    const waitForElement = directive => {
        safe.uboLog(logPrefix, `Waiting for ${directive}`);
        return lookupElementsFn(directive, Date.now() + timeout).then(elems => {
            if ( elems.length === 0 ) { return false; }
            elems[0].click();
            safe.uboLog(logPrefix, `Clicked ${directive}`);
            return true;
        });
    };

    const process = async ( ) => {
        while ( steps.length !== 0 ) {
            const step = steps.shift();
            if ( step === undefined ) { break; }
            if ( typeof step === 'number' ) {
                await waitForTime(step);
                if ( step === 1 ) { continue; }
                continue;
            }
            if ( step.startsWith('!') ) { continue; }
            const clicked = await waitForElement(step);
            if ( clicked ) { continue; }
            safe.uboLog(logPrefix, `Timed out waiting on ${step}`);
            break;
        }
    };

    runAtHtmlElementFn(process);
}

function trustedCreateHTML(
    parentSelector,
    htmlStr = '',
    durationStr = ''
) {
    if ( parentSelector === '' ) { return; }
    if ( htmlStr === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-create-html', parentSelector, htmlStr, durationStr);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    // We do not want to recursively create elements
    self.trustedCreateHTML = true;
    let ancestor = self.frameElement;
    while ( ancestor ) {
        const doc = ancestor.ownerDocument;
        if ( doc === null ) { break; }
        const win = doc.defaultView;
        if ( win === null ) { break; }
        if ( win.trustedCreateHTML ) { return; }
        ancestor = ancestor.frameElement;
    }
    const duration = parseInt(durationStr, 10);
    const domParser = new DOMParser();
    const externalDoc = domParser.parseFromString(htmlStr, 'text/html');
    const toAppend = [];
    while ( externalDoc.body.firstChild !== null ) {
        toAppend.push(document.adoptNode(externalDoc.body.firstChild));
    }
    if ( toAppend.length === 0 ) { return; }
    const toRemove = [];
    const remove = ( ) => {
        for ( const node of toRemove ) {
            if ( node.parentNode === null ) { continue; }
            node.parentNode.removeChild(node);
        }
        safe.uboLog(logPrefix, 'Node(s) removed');
    };
    const appendOne = (target, nodes) => {
        for ( const node of nodes ) {
            target.append(node);
            if ( isNaN(duration) ) { continue; }
            toRemove.push(node);
        }
    };
    const append = ( ) => {
        const targets = document.querySelectorAll(parentSelector);
        if ( targets.length === 0 ) { return false; }
        const limit = Math.min(targets.length, extraArgs.limit || 1) - 1;
        for ( let i = 0; i < limit; i++ ) {
            appendOne(targets[i], toAppend.map(a => a.cloneNode(true)));
        }
        appendOne(targets[limit], toAppend);
        safe.uboLog(logPrefix, 'Node(s) appended');
        if ( toRemove.length === 0 ) { return true; }
        setTimeout(remove, duration);
        return true;
    };
    const start = ( ) => {
        if ( append() ) { return; }
        const observer = new MutationObserver(( ) => {
            if ( append() === false ) { return; }
            observer.disconnect();
        });
        const observerOptions = {
            childList: true,
            subtree: true,
        };
        if ( /[#.[]/.test(parentSelector) ) {
            observerOptions.attributes = true;
            if ( parentSelector.includes('[') === false ) {
                observerOptions.attributeFilter = [];
                if ( parentSelector.includes('#') ) {
                    observerOptions.attributeFilter.push('id');
                }
                if ( parentSelector.includes('.') ) {
                    observerOptions.attributeFilter.push('class');
                }
            }
        }
        observer.observe(document, observerOptions);
    };
    runAt(start, extraArgs.runAt || 'loading');
}

function trustedSetCookie(
    name = '',
    value = '',
    offsetExpiresSec = '',
    path = ''
) {
    if ( name === '' ) { return; }

    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-cookie', name, value, path);
    const time = new Date();

    if ( value.includes('$now$') ) {
        value = value.replaceAll('$now$', time.getTime());
    }
    if ( value.includes('$currentDate$') ) {
        value = value.replaceAll('$currentDate$', time.toUTCString());
    }
    if ( value.includes('$currentISODate$') ) {
        value = value.replaceAll('$currentISODate$', time.toISOString());
    }

    let expires = '';
    if ( offsetExpiresSec !== '' ) {
        if ( offsetExpiresSec === '1day' ) {
            time.setDate(time.getDate() + 1);
        } else if ( offsetExpiresSec === '1year' ) {
            time.setFullYear(time.getFullYear() + 1);
        } else {
            if ( /^\d+$/.test(offsetExpiresSec) === false ) { return; }
            time.setSeconds(time.getSeconds() + parseInt(offsetExpiresSec, 10));
        }
        expires = time.toUTCString();
    }

    const done = setCookieFn(
        true,
        name,
        value,
        expires,
        path,
        safeSelf().getExtraArgs(Array.from(arguments), 4)
    );

    if ( done ) {
        safe.uboLog(logPrefix, 'Done');
    }
}

function trustedSetLocalStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('local', true, key, value, options);
}

function trustedSetSessionStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('session', true, key, value, options);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $hasHostnames$ = true;
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
if ( $hasHostnames$ ) {
    const $scriptletHostnames$ = /* 438 */ ["dgb.de","t3.com","bbc.com","cbr.com","duck.ai","fic.fan","pbs.org","sbot.cf","tvhay.*","wear.jp","wrtn.jp","abema.tv","core.app","dkb.blog","hetek.hu","rds.live","vembed.*","2mnews.ro","assos.com","bintv.fun","brainly.*","cespun.eu","cnn.co.jp","eodev.com","funko.com","itpro.com","jpost.com","money.com","nebula.tv","pling.com","pornhub.*","redisex.*","sears.com","space.com","strtape.*","teller.jp","vezess.hu","vidmoly.*","vokey.com","action.com","all3dp.com","baumbet.ro","bintvs.fun","camcaps.io","deezer.com","entra.news","fandom.com","fjordd.com","forbes.com","lowpass.cc","modxvm.com","nny360.com","oploverz.*","scenexe.io","snopes.com","toysrus.ca","watchx.top","webworm.co","xanimu.com","161.97.70.5","ambrook.com","anascrie.ro","bg-gledai.*","diastixo.gr","dropbox.com","ficbook.net","hiphopa.net","huckmag.com","j-lyric.net","mandiner.hu","mostream.us","mrbenne.com","nicekkk.com","novelza.com","patreon.com","pcgamer.com","pinterest.*","postype.com","racket.news","semafor.com","stblion.xyz","teamkong.tk","theweek.com","270towin.com","adressit.com","advnture.com","audialab.com","babiesrus.ca","bangbros.com","bitchute.com","bookto09.com","coinbase.com","cosxplay.com","cu.tbs.co.jp","doordash.com","flowstate.fm","gamerant.com","getemoji.com","heidisql.com","kashiland.jp","kunstler.com","latent.space","liddread.com","linkedin.com","magnolia.com","movieweb.com","novelpia.com","paxdei.th.gl","playertv.net","popular.info","redecanais.*","sambowman.co","saucerco.com","shojiwax.com","streamtape.*","substack.com","thegamer.com","theverge.com","valid.x86.fr","wahaca.co.uk","whathifi.com","wonkette.com","30seconds.com","aeropress.com","afterclass.io","artribune.com","avnetwork.com","broncoshq.com","camspider.com","cyberdom.blog","dossier.today","elysian.press","eugyppius.com","gamefile.news","howtogeek.com","jingdaily.com","kiplinger.com","livingetc.com","loungefly.com","makeuseof.com","mathcrave.com","moneyweek.com","moovitapp.com","nihongoaz.com","nosdevoirs.fr","oled-info.com","petsradar.com","roleplayer.me","shortlist.com","store.kde.org","streamily.com","streamvid.net","sweet-shop.si","tastemade.com","teamblind.com","techradar.com","theankler.com","thethings.com","tomsguide.com","tweaktown.com","up4stream.com","vyvymanga.net","wallpaper.com","xfce-look.org","afterbabel.com","bolugundem.com","bonappetit.com","breachmedia.ca","cowcotland.com","duckduckgo.com","duffelblog.com","e-panigiria.gr","estadao.com.br","fitandwell.com","gamesradar.com","gnome-look.org","infotrucker.ro","iptvromania.ro","isekaitube.com","karsaz-law.com","klartext-ne.de","lemon8-app.com","linux-apps.com","moviesapi.club","musicradar.com","newgrounds.com","nullforums.net","otpportalok.hu","railsnotes.xyz","readergrev.com","realpython.com","redecanaistv.*","screenrant.com","seriesperu.com","similarweb.com","slowboring.com","streamruby.com","sweetwater.com","techemails.com","thebulwark.com","themeslide.com","zipcode.com.ng","alphacoders.com","android1pro.com","appimagehub.com","asumanaksoy.com","awardsradar.com","bangkokpost.com","cinemablend.com","crunchyroll.com","cyclingnews.com","dozaanimata.net","espressocafe.ro","flamecomics.xyz","forkingpaths.co","fourfourtwo.com","golfmonthly.com","goto10retro.com","guitarworld.com","idealhome.co.uk","ilovetoplay.xyz","insider.fitt.co","intellinews.com","japonhentai.com","kermitlynch.com","livescience.com","loudersound.com","marieclaire.com","medeberiya.site","mightyape.co.nz","noahpinion.blog","opendesktop.org","piratewires.com","platformer.news","publicnotice.co","puzzle-lits.com","puzzle-loop.com","puzzle-tapa.com","restofworld.org","streambuddy.net","thedriftmag.com","thelensnola.org","togetogebox.org","traffihunter.hu","warungkomik.com","whatculture.com","whattowatch.com","whowhatwear.com","asiasentinel.com","clutchpoints.com","commondreams.org","creativebloq.com","dualshockers.com","egopowerplus.com","empirical.health","erzsebetvaros.hu","freefilesync.org","garbageday.email","guitarplayer.com","in.investing.com","inattvcom117.xyz","klsescreener.com","lofi-nopixel.com","michaelmoore.com","monarchmoney.com","nichepcgamer.com","ofertecatalog.ro","paulaschoice.com","puzzle-chess.com","puzzle-masyu.com","puzzle-pipes.com","puzzle-slant.com","puzzle-tents.com","puzzle-words.com","scitechdaily.com","seattletimes.com","securityweek.com","semianalysis.com","sharperimage.com","simpleflying.com","suzukicycles.com","techlearning.com","theintercept.com","timesnownews.com","tomshardware.com","tvtechnology.com","womanandhome.com","androidpolice.com","blog.tangwudi.com","brokensilenze.net","countrylife.co.uk","cyclingweekly.com","duluthtrading.com","fanfictionero.com","foodnavigator.com","freemagazines.top","girlscoutshop.com","googleapis.com.de","googleapis.com.do","hamiltonnolan.com","honest-broker.com","marieclaire.co.uk","puzzle-hitori.com","puzzle-kakuro.com","puzzle-sudoku.com","terramirabilis.ro","thefederalist.com","tmnascommunity.eu","virginvoyages.com","americasvoice.news","androidcentral.com","aporiamagazine.com","bcliquorstores.com","campaignlive.co.uk","cheersandgears.com","chicagotribune.com","cityandstateny.com","gdrivedescarga.com","henrikkarlsson.xyz","homebuilding.co.uk","puzzle-binairo.com","puzzle-bridges.com","puzzle-shikaku.com","readcomiconline.li","theinformation.com","thejakartapost.com","tunovelaligera.com","windowscentral.com","xda-developers.com","yvonnebennetti.com","canuckaudiomart.com","clevercreations.org","computerenhance.com","duneawakening.th.gl","freshlifecircle.com","friendlyatheist.com","homegymreview.co.uk","homesandgardens.com","jointhefollowup.com","press.princeton.edu","puzzle-aquarium.com","puzzle-dominosa.com","puzzle-galaxies.com","puzzle-heyawake.com","puzzle-kakurasu.com","puzzle-light-up.com","puzzle-norinori.com","puzzle-nurikabe.com","puzzle-shingoki.com","puzzle-stitches.com","puzzle-yin-yang.com","scaleofuniverse.com","skepticalraptor.com","skidrowreloaded.com","smartkhabrinews.com","starresonance.th.gl","statsignificant.com","technologyreview.jp","theclimatebrink.com","toweroffantasy.info","understandingai.org","urbanoutfitters.com","zabawkahurtownia.pl","adevarurisecrete.com","aventurainromania.ro","camereliveromania.ro","gardeningknowhow.com","gourmetfoodstore.com","japanesewithtomo.com","lyrical-nonsense.com","moreisdifferent.blog","myvouchercodes.co.uk","persuasion.community","plantpowercouple.com","puzzle-futoshiki.com","puzzle-nonograms.com","secretsofprivacy.com","strangeloopcanon.com","thebignewsletter.com","thestudentroom.co.uk","audiologyresearch.org","columbiasportswear.at","columbiasportswear.de","columbiasportswear.es","columbiasportswear.fr","columbiasportswear.it","hebrew4christians.com","monitoruldevrancea.ro","objectivebayesian.com","puzzle-shakashaka.com","stream.hownetwork.xyz","americafirstreport.com","digitalcameraworld.com","fullstackeconomics.com","ghostinternational.com","mskmangaz.blogspot.com","puzzle-battleships.com","puzzle-minesweeper.com","puzzle-skyscrapers.com","puzzle-star-battle.com","thebarentsobserver.com","jailbreakchangelogs.xyz","puzzle-thermometers.com","tips97tech.blogspot.com","www.watermarkremover.io","antiracismnewsletter.com","columbiasportswear.co.uk","construction-physics.com","experimental-history.com","puzzle-jigsaw-sudoku.com","puzzle-killer-sudoku.com","read.perspectiveship.com","engineeringleadership.xyz","newsletter.banklesshq.com","astoryofmasasstruggles.com","blog.codingconfessions.com","informationisbeautiful.net","interestingengineering.com","theintrinsicperspective.com","xn--90afacv0cu2a3cr.xn--p1ai","microsoftsecurityinsights.com","newsletter.eng-leadership.com","noicetranslations.blogspot.com","xn--90afacv0clj6ac0dxa.xn--p1ai","www-devonlive-com.translate.goog","www-insider-co-uk.translate.goog","www-kentlive-news.translate.goog","www-themirror-com.translate.goog","www-essexlive-news.translate.goog","newsletter.maartengrootendorst.com","www-football-london.translate.goog","unchartedterritories.tomaspueyo.com","www-cornwalllive-com.translate.goog","www-glasgowlive-co-uk.translate.goog","www-leeds--live-co-uk.translate.goog","www-liverpoolecho-co-uk.translate.goog","www-lincolnshirelive-co-uk.translate.goog","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];
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
}

// Collect arglist references
const todo = new Set();
if ( todoIndices.size !== 0 ) {
    const $scriptletArglistRefs$ = /* 438 */ "37;228;166,167,168,169;151;231;210;7;130;131;174;177;183,213;60;52,53,54;220;93;155;209;87;225,226,227;118,119;93;68;119;74;228;127;17;192,233;141;114;158;84;228;111;165;223;129;27;14;10;160;225,226,227;89;105;126;191;132;13;21;208;96;93,133;157;64,65;47;129;52,53,54;172;138;44;152;140;2;201;210;90;25;92;56;190;163,164;89;115;170;228;103,104;121;52,53,54;50;156;128;228;144;212;228;77;47;202;198,199,200;97;38;172;185;232;52,53,54;151;144;147;95;52,53,54;52,53,54;217;106;58,59;151;116,117;99;134;52,53,54;158;52,53,54;76;67;111;52,53,54,126;151;15,16;120;70;228;52,53,54;57;229;159;6;228;150;184;187;52,53,54;52,53,54;52,53,54;52,53,54;151;36;228;228;74;151;145;228;154;193;119;20;228;98;228;141;22;89;1;11;215;228;52,53,54;151;228;56;89;188;228;141;52,53,54;122;41,42;5;196;203;52,53,54;90;236,237;228;228;141;90;93;91;179;93;195;141;129;228;176;93;222;4;21;113;158;151;93;62;52,53,54;189;86;52,53,54;52,53,54;135;142;239;112;141;129;28;206;228;178;228;235;93;102;52,53,54;228;228;52,53,54;228;228;89;23;33;186;34;228;228;228;123;56;52,53,54;141;52,53,54;52,53,54;52,53,54;161;161;161;24;90;40;46;94;221;135;228;228;228;52,53,54;48;19;228;151;26;51;219;125;52,53,54;228;32;162;172,175;101;52,53,54;4;211;205;75;161;161;161;161;161;161;136;63;9;52,53,54;85;151;56;228;214;3;228;228;228;151;123;148,149;228;228;8;210;216;238;71;230;230;52,53,54;52,53,54;228;161;161;161;137;55;204;72;52,53,54;228;52,53,54;88;61;153;35;12;139;52,53,54;228;161;161;161;182;31;143;107,108;228;151;73;218;49;52,53,54;99;129;52,53,54;128;228;21;0;161;161;161;161;161;161;161;161;161;161;161;29;67;110;97;99;52,53,54;124;52,53,54;207;52,53,54;69;197;209;140;234;228;30;93;93;52,53,54;228;52,53,54;18;161;161;52,53,54;52,53,54;52,53,54;224;140;78;79;80;81;82;109;123,181;21;161;89;52,53,54;228;52,53,54;43;180;161;161;161;161;45;100;161;89;146;52,53,54;83;52,53,54;52,53,54;161;161;52,53,54;52,53,54;52,53,54;194;52,53,54;39;66;52,53,54;158;126;52,53,54;173;158;171;171;171;171;171;52,53,54;171;52,53,54;171;171;171;171;171;158";
    const arglistRefs = $scriptletArglistRefs$.split(';');
    for ( const i of todoIndices ) {
        for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
            todo.add(ref);
        }
    }
}
if ( $hasRegexes$ ) {
    const $scriptletFromRegexes$ = /* 0 */ [];
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
    const $scriptletFunctions$ = /* 12 */
[setCookie,setLocalStorageItem,removeClass,removeCookie,setSessionStorageItem,removeNodeText,replaceNodeText,trustedSetLocalStorageItem,trustedClickElement,trustedSetCookie,trustedSetSessionStorageItem,trustedCreateHTML];
    const $scriptletArgs$ = /* 287 */ ["block-popuproadblock","true","aonehidepopupnewsletter1727208240","1","the_cookie719","useExitIntent","exit-intent","cp_style_3841","m6e-newsletter","popupIsClosed","emailLightBox","pum-open-overlay","body","stay","root-modal-container-open","hide-cookbook-modal-0","interstitial","aside","zephr-modal-open","newsletterPopupCount","blaize_session","blaize_tracking_id","open-pw","awpopup_450030403","popupShown","awpopup_501941328","popup_closed","email_modal","subscribe-pop-active","blocking-signup","html","huck-newsletter-popup","newsletterModal","enewsOptin","g1_popup_disabled","email-subscribe-check-41be04a9","false","SuppressInterstitial","","reload","marketing-modal-closed-1","2","r_p_s_n","viewedOuibounceModal","hidePopUp","modal-open","newsletter","js-show-newsletter-popup","bytes_signup_modal_viewed","iib_signup_popup","-1","dpp_paywall","pay_ent_msmp","pay_ent_pass","pum-9137","ar-newsletter-promo-dismissed","mm_f_45691","pum-605611","isNewsletterPopupShown","nbaSIBWidgetSeen","mailerlite:forms:shown:109925949413262377","floating-sign-up-dismissed","emailPopupDismissed","has-intro-popup","modal-in","show-intro-popup","pum-276000","uf_signup_bar","BRANCH_BANNER_PAGE_LOAD","EMAIL_CAPTURE_MODAL_STOP","show-email-intake-form","articleModalShown","sgID","st_newsletter_splash_desktop_seen","newsletter_signup_promo","newsletter_signup_views","hasShownPopup","jetpack_post_subscribe_modal_dismissed","CNN_MAIL_MAGAZIN","modalViewed","oxy-modal-active","newsletterLightboxDisplayed","emailSignupModal_isShown","MCPopupClosed","yes","welcome_modal_email_ts","signUpModalClosed_slot-paulaschoice_us-global-signUpModal-sfmcModal","newsletter-newsletter-popup","user_closed_pop_up","Columbia_AT_emailPopup","Columbia_DE_emailPopup","Columbia_ES_emailPopup","Columbia_FR_emailPopup","Columbia_IT_emailPopup","Columbia_UK_emailPopup","banner_session","mystery_popup","sws-gwpop","popup-newsletter","enews_popup_session","script","debugger","oncontextmenu","\"copyRProtection\":true","\"copyRProtection\":false","style","@media print {body { display: none !important; }}","contextmenu","-ms-user-select: none","onselectstart","rcoverride < 1","ctrlKey","__ADB_COOLDOWN__","/^self\\./","(()=>{const a={apply:(a,e,o)=>(o[0]?.src?.includes?.(\"nitropay.com/ads\")&&setTimeout((()=>{window.nitroAds=window.nitroAds||{createAd:()=>{let n='function ye(e,t){var r;if(\"\"!=typeof t)return y.R.error(typeof t),y.R.error(t),null;const n=JSON.parse(JSON.stringify(t));if(t.acceptable)return null;if(t.sizes||=[],t.sizes&&t.sizes.length>0){const e=[];for(const r of t.sizes)2===r.length?e.push([Number(r[0]),Number(r[1])]):y.R.error(\"\");t.sizes=e}if(t.format&&t.format===w.e.Article)return(0,v.zL)(e,t,ve);if(t.format&&t.format===w.e.StickyStack)return(0,v.ek)(e,t,ve);if((0,c.zI)(t.format)||t.format===w.e.Rail){const n=me.findIndex((t=>e===t.id)),i=n>-1?me[n]:null;if(i&&i.createdAt&&Date.now()-i.createdAt<50)return y.R.debug(\"\"),null;const o=document.getElementById(e);if(o){try{y.R.debug(\"\"),o.remove(),i&&null!=(r=document.getElementById(i.id+\"\"))&&r.remove()}catch(e){y.R.debug(e)}return ve(e,t)}}return t.delayLoading?(0,v.hZ)(e,t,ve):t.format===w.e.SmartFlex?async function(e,t,r){const n=document.getElementById(e);if(!n)return y.R.warn(\"\"),[];t.format=w.e.SmartFlex,t.video||={},t.video.float=w.jz.Never;const i=[],o=W(n);if((o.width||o.maxWidth||window.innerWidth)<300)return y.R.warn(\"\"),n.remove(),[];n.style.maxWidth=\"\",n.style.width=\"\",n.style.height=\"\",n.style.display=\"\",n.style.flexWrap=\"\",n.style.flexDirection=\"\",n.style.placeContent=\"\";let l=document.getElementById(\"\");return l||(l=document.createElement(\"\"),l.id=\"\",n.appendChild(l)),t.sizes=L(n,{ignoreBounds:!0}),i.push(await r(\"\",t)),i}(e,t,ve):(y.R.getLevel()===y.R.levels.TRACE&&console.log(\"\",{id:e,originalOptions:n,options:t}),ve(e,t))}'},siteId:1487,addUserToken:()=>{},clearUserTokens:()=>{},blocklist:[],queue:[],loaded:!0,version:\"20251114 2dd5c12\",geo:\"\"}}),1e3),Reflect.apply(a,e,o))};window.HTMLBodyElement.prototype.appendChild=new Proxy(window.HTMLBodyElement.prototype.appendChild,a)})();self.","sedCount","adblock_modal_dismissed","adBlockerAlert_lastShown","$now$","adBlockedModal:lastDismiss","DWEB_PIN_IMAGE_CLICK_COUNT","$remove$","unauthDownloadCount",".chakra-portal .chakra-modal__content-container > section.chakra-modal__content > .chakra-modal__header:has(> .chakra-stack > a[href^=\"https://www.deezer.com/payment/go.php?origin=paywall_pressure\"]) + button.chakra-modal__close-btn","contextual-sign-in-modal-cool-off-hidden","/wccp|contextmenu/","/wccp|user-select/","disableSelection","copyprotect","/parseInt.*push.*setTimeout.*try.*catch/","/contextmenu|wpcp/","rprw","hasAdAlert","header","click-to-scroll",".np{",".dummy{","condition","@media print","/disableclick|devtool/","social-qa/machineId","simple-funnel-name","/setTimeout.*style/","disable-selection","reEnable","stopPrntScr","kpwc","/adblock/i","intro_popup_last_hidden_at","$currentDate$","stopRefreshSite","nocontextmenu","devtoolsDetector","console.clear","wccp_pro","initPopup","user-select","/contextmenu|devtool/","preventDefault","ezgwcc","wccp","isadb","e.preventDefault();","document.oncontextmenu","btnHtml","document.onselectstart","/$.*ready.*setInterval/","fs.adb.dis","disable_show_error","WkdGcGJIbEpiV0ZuWlVSaGRHRT0=","if(floovy()) {","if(false) {","disable_copy","nocontext","XF","/articlesLimit|articlesRead|previousPage/","when","scroll keydown","/document.onkeydown|document.ondragstart/","fetch","[data-automation=\"continue-to-ads-btn\"]","10000","devtools","while(!![]){try{var","ad_blocker","/closeWindow\\(\\)|clickIE\\(\\)|reEnable\\(\\)/","adblock","window.location.reload","ab927c49cf1b","detectDevTool","/Clipboard|oncontextmenu|wpcp|keyCode/","/-webkit-user-select|webkit-appearance/",".z_share_popover div.gap_2 > button.mt_24px.rounded_100vh + button.text_tint.disabled\\:opacity_0\\.4.h_50px","[data-testid=\"consentBanner\"] > button[data-testid=\"banner-button\"]","1000","1100","1200","1300","halfSheetAppBannerDismissed","{\"halfSheetAppBannerDismissed\":{\"expiration\":2000000000000,\"data\":true}}","loc.hostname","disableselect","status_of_app_redirect_half_modal_on_coordinate_list","{\"displayed\":true}","_ad","0","_ngViCo-SupporterPromo","#web-modal button.css-1d86b5p",".erc-existing-profile-onboarding-modal button[class^=\"modal-portal__close-button\"]","/\\.novel-box \\*:not\\(a\\)|@media print/g","selection","checkAdsBlocked","#com-onboarding-OnboardingWelcomeModal__title + div .com-a-Button--dark","adblockNoticePermaDismiss","lastViewTime","::selection","keyCode","window.location.href","/devtool|debugger/","/devtoolsDetector|keyCode|preventDefault/","leftPanelOpen","/^freeVideoFriendly/","contentprotector","/contextmenu|reEnable/",".seo-landing-modal-cancel-btn .design-system-button-container","500","/adbl/i","/oncontextmenu|disableselect/","reference_offer","__q_objt|{\"offer_type\":\"PROMOTION\"}","show_offer","__q_bool|0","show_offer_timestamp","__q_numb|9999999999999",".dig-Modal:has(div[data-testid=\"digTruncateTooltipTrigger\"]) > .dig-Modal-close-btn","2000","iAgree","adblockNotice","{\"dismissed\":true,\"impressionCount\":1}","firebox_3330","/contextmenu|oncopy/","getComputedStyle","onerror","xvmDialogLastShown","/oncontextmenu|wccp/","android-install-modal-skipped-until","9999999999999","dragscroll","clipboard_disabled",".com-onboarding-OnboardingWelcomeModal__button-wrapper > .com-a-Button--dark","userData_","mobile-app-recommend","{\"dismissed\":true,\"day\":30}","CopyrightLayer","abc","/wpcp|contextmenu|unselectable/","as_init","popupClosed","darken","no_scroll","complete","blurry","body > :not(.m-fbPopup)","_tsr_pc","keydown","ooo","onkeydown","ccc","FTR_Article_PageView","div[id^=\"alia-popup-root-alia-\"] div[aria-label=\"Close popup\"]","/oncontextmenu|onselectstart/","aichatPromoDismissal","{\"promoReleaseDate\":\"2026-01-05\",\"dismissedPromos\":[\"subscription\",\"browserUpsell\"],\"allPromosDismissed\":true}","appDownloadPromptDismissedV3Ttl","{\"value\":\"99999999999999\",\"expiresAt\":99999999999999}","main div[data-theater-mode] button[type=\"submit\"]","/wpcp|contextmenu/","<details open style='display:none' ontoggle='(function(){     window.addEventListener(\"contextmenu\", (e) => { e.stopImmediatePropagation(); return true; }, true);     const allow = (e) => { e.stopImmediatePropagation(); return true; };     document.addEventListener(\"selectstart\", allow, true);     document.addEventListener(\"copy\", allow, true);     window.addEventListener(\"keydown\", (e) => {         if ((e.ctrlKey || e.metaKey) && (e.key === \"c\" || e.key === \"a\")) {             e.stopImmediatePropagation();         }     }, true);     document.querySelectorAll(\"*\").forEach(el => {         el.oncontextmenu = null;         el.onselectstart = null;         el.oncopy = null;         el.onkeydown = null;         el.style.userSelect = \"auto\";     }); })();'></details>","TUTORIAL_CLOSED_SNACKS_HOME","fechado","TUTORIAL_VIEWED_SNACKS_HOME","timeLeft > 0","timeLeft = 0","includes","clearInterval","countdown <= 0","countdown => 0"];
    const $scriptletArglists$ = /* 240 */ "0,0,1;0,2,3;0,4,1;1,5,1;0,6,1;0,7,1;0,8,3;0,9,3;1,10,1;2,11,12,13;2,14,12,13;1,15,1;2,16,17,13;2,18,12,13;1,19,3;3,20;3,21;2,22,12,13;0,23,3;0,24,1;0,25,3;0,26,1;0,27,1;2,28,12,13;2,29,30,13;0,31,1;0,32,1;0,33,3;0,34,3;1,35,36;0,37,1,38,39,3;0,40,41;0,42,3;0,43,1;0,44,1;2,45,38,13;0,46,1;2,47,38,13;0,48,3;0,49,50;3,51;3,52;3,53;0,54,1;0,55,3;0,56,1;0,57,1;0,58,36,38,39,3;1,59,1;0,60,3;4,61,1;4,62,3;2,63,30,13;2,64,30,13;2,65,30,13;0,66,1;2,45,12,13;0,67,3;1,68,3;1,69,3;1,70,36;4,71,1;3,72;0,73,1;0,74,1;0,75,3;1,76,1;0,77,1;0,78,3;1,79,3;2,80,12,13;0,81,1;4,82,1;0,83,84;0,85,3;1,86,3;0,87,1;1,88,1;0,89,3;0,90,3;0,91,3;0,92,3;0,93,3;0,94,3;4,95,1;0,96,1;0,97,3;0,98,1;4,99,3;5,100,101;5,100,102;6,100,103,104;6,105,106;5,100,107;5,105,108;5,100,109;6,100,110,36;5,100,111;5,100,112;6,100,113,114,115,3;4,116,1;7,117,118;7,119,118;1,120,121;1,122,121;8,123;7,124,118;5,100,125;5,105,126;5,100,127;5,100,128;5,100,129;5,100,130;1,131,121;2,132,133;2,134,12;6,105,135,136,137,138;5,100,139;1,140,121;1,141,121;5,100,142;2,143,12;5,100,144;5,100,145;3,146;5,100,147;9,148,149;5,100,150;5,100,151;5,100,152;5,100,153;5,100,154;5,100,155;5,105,156;5,100,157;5,100,158;0,159,3;5,100,160;5,100,161;5,100,162;5,100,163;5,100,164;5,100,165;5,100,166;4,167,3;5,100,168;1,169,121;6,100,170,171;5,100,172;5,100,173;5,100,174;3,175,176,177;5,100,178;5,100,179;8,180,38,181;5,100,182;5,100,183;1,184,36;5,100,185;4,186,1;6,100,187;5,100,188;5,100,189;5,100,190;5,105,191;8,192;8,193,38,194;8,193,38,195;8,193,38,196;8,193,38,197;7,198,199;5,100,200;5,100,186;5,100,201;10,202,203;0,204,205;3,206;8,207;8,208;6,105,138;6,105,209;5,105,210;5,100,211;8,212;1,213,1;7,214,149;5,105,215;5,100,216;5,100,217;5,100,218;5,100,219;0,220,205;1,221,121;5,100,222;5,100,223;8,224,38,225;5,100,226;5,100,227;7,228,229;7,230,231;7,232,233;8,234,38,235;0,236,3;7,237,238;0,239,3;5,100,240;5,100,241;5,100,242;7,243,118;5,100,244;7,245,246;2,247;5,100,248;8,249;5,100,250;7,251,252;6,100,253,254;5,100,255;5,100,256;4,257,1;2,45,12;2,258,12;2,12,259,260;2,261,262,13;0,263,205;6,100,264,265;6,100,266,265;6,100,107,267;0,268,41;8,269;5,100,270;7,271,272;7,273,274;8,275,38,194;5,100,276;11,30,277;7,278,279;1,280,1;6,100,281,282,283,284;6,100,285,286";
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
