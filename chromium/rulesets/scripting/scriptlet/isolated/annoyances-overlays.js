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
        'set', 'unset',
        'given',
    ];
}

function lookupElementsFn(directive, until = 0) {
    if ( lookupElementsFn.querySelectorEx === undefined ) {
        lookupElementsFn.getShadowRoot = elem => {
            if ( elem.openOrClosedShadowRoot ) { // Firefox
                return elem.openOrClosedShadowRoot;
            }
            if ( self.chrome?.dom?.openOrClosedShadowRoot ) { // Chromium
                return self.chrome.dom.openOrClosedShadowRoot(elem);
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
    needle = '',
    ...varargs
) {
    if ( typeof needle !== 'string' ) { return; }
    const safe = safeSelf();
    const reName = safe.patternToRegex(needle);
    const extraArgs = safe.parseVarargs(varargs);
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
    replacement = '',
    ...varargs
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-node-text.fn', ...Array.from(arguments));
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.parseVarargs(varargs);
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
            if ( safe.RegExp_test(reIncludes, before) === false ) { return true; }
        }
        if ( reExcludes ) {
            reExcludes.lastIndex = 0;
            if ( safe.RegExp_test(reExcludes, before) ) { return true; }
        }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test(rePattern, before) === false ) { return true; }
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
        'Function_toString': Function.prototype.call.bind(self.Function.prototype.toString),
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
        'RegExp_test': Function.prototype.call.bind(self.RegExp.prototype.test),
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
        'JSON_parse': Function.prototype.call.bind(self.JSON.parse, self.JSON),
        'JSON_stringify': Function.prototype.call.bind(self.JSON.stringify, self.JSON),
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
                return this.RegExp_test(details.re, haystack) === details.expect;
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
        parseVarargs(varargs) {
            const entries = varargs.reduce((out, v, i, a) => {
                if ( i & 1 ) { return out; }
                const rawValue = a[i+1];
                const value = /^\d+$/.test(rawValue)
                    ? parseInt(rawValue, 10)
                    : rawValue;
                out.push([ a[i], value ]);
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
    path = '',
    ...varargs
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
        safe.parseVarargs(varargs)
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

function setLocalStorageItem(key = '', value = '', ...varargs) {
    const safe = safeSelf();
    const options = safe.parseVarargs(varargs)
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

function setSessionStorageItem(key = '', value = '', ...varargs) {
    const safe = safeSelf();
    const options = safe.parseVarargs(varargs)
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

    const steps = (( ) => {
        const steps = /^[;|]/.test(selectors)
            ? safe.String_split.call(selectors.slice(1), selectors.charAt(0))
            : safe.String_split.call(selectors, ',');
        return steps.map(a => {
            a = a.trim();
            if ( /^\d+$/.test(a) ) { return parseInt(a, 10); }
            return a;
        });
    })();
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
    durationStr = '',
    ...varargs
) {
    if ( parentSelector === '' ) { return; }
    if ( htmlStr === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-create-html', parentSelector, htmlStr, durationStr);
    const extraArgs = safe.parseVarargs(varargs);
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
    path = '',
    ...varargs
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
        safe.parseVarargs(varargs)
    );

    if ( done ) {
        safe.uboLog(logPrefix, 'Done');
    }
}

function trustedSetLocalStorageItem(key = '', value = '', ...varargs) {
    const safe = safeSelf();
    const options = safe.parseVarargs(varargs)
    setLocalStorageItemFn('local', true, key, value, options);
}

function trustedSetSessionStorageItem(key = '', value = '', ...varargs) {
    const safe = safeSelf();
    const options = safe.parseVarargs(varargs)
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

const todo = new Set();

if ( $hasHostnames$ ) {
    const $scriptletHostnames$ = /* 458 */ ["dgb.de","t3.com","bbc.com","cbr.com","duck.ai","fic.fan","pbs.org","sbot.cf","tvhay.*","wear.jp","wrtn.jp","abema.tv","core.app","dkb.blog","hetek.hu","rds.live","vembed.*","zgbk.com","2mnews.ro","assos.com","bintv.fun","brainly.*","cespun.eu","cnn.co.jp","eodev.com","funko.com","itpro.com","jpost.com","money.com","nebula.tv","pling.com","pornhub.*","redisex.*","sears.com","space.com","strtape.*","teller.jp","vezess.hu","vidmoly.*","vokey.com","zeteo.com","action.com","all3dp.com","atgames.us","baumbet.ro","bintvs.fun","camcaps.io","deezer.com","dejure.org","entra.news","fandom.com","fjordd.com","forbes.com","lowpass.cc","modxvm.com","nny360.com","oploverz.*","scenexe.io","snopes.com","stifler.ro","toysrus.ca","watchx.top","webworm.co","xanimu.com","161.97.70.5","ambrook.com","anascrie.ro","bg-gledai.*","cool-tv.net","diastixo.gr","dropbox.com","ficbook.net","hiphopa.net","huckmag.com","j-lyric.net","javx357.com","jelonka.com","mandiner.hu","mostream.us","mrbenne.com","nicekkk.com","novelza.com","parsatv.com","patreon.com","pcgamer.com","pinterest.*","postype.com","racket.news","semafor.com","stblion.xyz","teamkong.tk","theweek.com","vaughn.live","270towin.com","adressit.com","advnture.com","audialab.com","babiesrus.ca","bangbros.com","bitchute.com","bookto09.com","coinbase.com","cosxplay.com","cu.tbs.co.jp","dlstreams.st","doordash.com","flowstate.fm","gamerant.com","getemoji.com","heidisql.com","kashiland.jp","kunstler.com","latent.space","liddread.com","linkedin.com","magnolia.com","movieweb.com","novelpia.com","paxdei.th.gl","playertv.net","popular.info","redecanais.*","sambowman.co","saucerco.com","shojiwax.com","streamtape.*","substack.com","thegamer.com","theverge.com","valid.x86.fr","wahaca.co.uk","whathifi.com","wonkette.com","30seconds.com","aeropress.com","afterclass.io","artribune.com","avnetwork.com","broncoshq.com","camspider.com","canale-tv.net","cyberdom.blog","dossier.today","elysian.press","eugyppius.com","gamefile.news","howtogeek.com","jingdaily.com","kiplinger.com","livingetc.com","loungefly.com","makeuseof.com","mathcrave.com","moneyweek.com","moovitapp.com","nihongoaz.com","nosdevoirs.fr","oled-info.com","petsradar.com","roleplayer.me","shortlist.com","store.kde.org","streamily.com","streamvid.net","sweet-shop.si","tastemade.com","teamblind.com","techradar.com","theankler.com","thethings.com","tomsguide.com","tweaktown.com","up4stream.com","vyvymanga.net","wallpaper.com","xfce-look.org","afterbabel.com","bolugundem.com","bonappetit.com","breachmedia.ca","camere-live.ro","cowcotland.com","duckduckgo.com","duffelblog.com","e-panigiria.gr","estadao.com.br","fitandwell.com","gamesradar.com","gnome-look.org","infotrucker.ro","iptvromania.ro","isekaitube.com","karsaz-law.com","klartext-ne.de","lemon8-app.com","linux-apps.com","metacritic.com","moneygenius.ca","moviesapi.club","musicradar.com","newgrounds.com","nullforums.net","otpportalok.hu","railsnotes.xyz","readergrev.com","realpython.com","redecanaistv.*","screenrant.com","seriesperu.com","similarweb.com","slowboring.com","streamruby.com","sweetwater.com","techemails.com","thebulwark.com","themeslide.com","zipcode.com.ng","alphacoders.com","android1pro.com","appimagehub.com","asumanaksoy.com","awardsradar.com","bangkokpost.com","cinemablend.com","crunchyroll.com","cyclingnews.com","dozaanimata.net","espressocafe.ro","flamecomics.xyz","forkingpaths.co","fourfourtwo.com","golfmonthly.com","goto10retro.com","guitarworld.com","idealhome.co.uk","ilovetoplay.xyz","insider.fitt.co","intellinews.com","japonhentai.com","kermitlynch.com","livescience.com","loudersound.com","marieclaire.com","medeberiya.site","mightyape.co.nz","noahpinion.blog","opendesktop.org","piratewires.com","platformer.news","publicnotice.co","puzzle-lits.com","puzzle-loop.com","puzzle-tapa.com","restofworld.org","streambuddy.net","thedriftmag.com","thelensnola.org","togetogebox.org","traffihunter.hu","warungkomik.com","whatculture.com","whattowatch.com","whowhatwear.com","asiasentinel.com","clutchpoints.com","commondreams.org","creativebloq.com","dualshockers.com","egopowerplus.com","empirical.health","erzsebetvaros.hu","freefilesync.org","garbageday.email","guitarplayer.com","in.investing.com","inattvcom117.xyz","klsescreener.com","lofi-nopixel.com","michaelmoore.com","monarchmoney.com","nichepcgamer.com","ofertecatalog.ro","paulaschoice.com","puzzle-chess.com","puzzle-masyu.com","puzzle-pipes.com","puzzle-slant.com","puzzle-tents.com","puzzle-words.com","scitechdaily.com","seattletimes.com","securityweek.com","semianalysis.com","sharperimage.com","simpleflying.com","suzukicycles.com","techlearning.com","theintercept.com","timesnownews.com","tomshardware.com","tvtechnology.com","womanandhome.com","androidpolice.com","blog.tangwudi.com","brokensilenze.net","countrylife.co.uk","cyclingweekly.com","dollardescent.net","duluthtrading.com","fanfictionero.com","foodnavigator.com","freemagazines.top","girlscoutshop.com","googleapis.com.de","googleapis.com.do","hamiltonnolan.com","honest-broker.com","marieclaire.co.uk","puzzle-hitori.com","puzzle-kakuro.com","puzzle-sudoku.com","terramirabilis.ro","thefederalist.com","tmnascommunity.eu","virginvoyages.com","americasvoice.news","androidcentral.com","aporiamagazine.com","bcliquorstores.com","campaignlive.co.uk","cheersandgears.com","chicagotribune.com","cityandstateny.com","gdrivedescarga.com","henrikkarlsson.xyz","homebuilding.co.uk","primariasector2.ro","puzzle-binairo.com","puzzle-bridges.com","puzzle-shikaku.com","readcomiconline.li","theinformation.com","thejakartapost.com","tunovelaligera.com","windowscentral.com","xda-developers.com","yvonnebennetti.com","canuckaudiomart.com","clevercreations.org","computerenhance.com","duneawakening.th.gl","freshlifecircle.com","friendlyatheist.com","hamis.romponalis.st","homegymreview.co.uk","homesandgardens.com","jointhefollowup.com","press.princeton.edu","puzzle-aquarium.com","puzzle-dominosa.com","puzzle-galaxies.com","puzzle-heyawake.com","puzzle-kakurasu.com","puzzle-light-up.com","puzzle-norinori.com","puzzle-nurikabe.com","puzzle-shingoki.com","puzzle-stitches.com","puzzle-yin-yang.com","scaleofuniverse.com","skepticalraptor.com","skidrowreloaded.com","smartkhabrinews.com","starresonance.th.gl","statsignificant.com","technologyreview.jp","theclimatebrink.com","toweroffantasy.info","understandingai.org","urbanoutfitters.com","zabawkahurtownia.pl","adevarurisecrete.com","aventurainromania.ro","camereliveromania.ro","gardeningknowhow.com","gourmetfoodstore.com","japanesewithtomo.com","lyrical-nonsense.com","moreisdifferent.blog","myvouchercodes.co.uk","persuasion.community","plantpowercouple.com","puzzle-futoshiki.com","puzzle-nonograms.com","secretsofprivacy.com","strangeloopcanon.com","thebignewsletter.com","thestudentroom.co.uk","audiologyresearch.org","columbiasportswear.at","columbiasportswear.de","columbiasportswear.es","columbiasportswear.fr","columbiasportswear.it","hebrew4christians.com","monitoruldevrancea.ro","objectivebayesian.com","puzzle-shakashaka.com","stream.hownetwork.xyz","thedebriefnetwork.com","americafirstreport.com","digitalcameraworld.com","fullstackeconomics.com","ghostinternational.com","mskmangaz.blogspot.com","puzzle-battleships.com","puzzle-minesweeper.com","puzzle-skyscrapers.com","puzzle-star-battle.com","thebarentsobserver.com","jailbreakchangelogs.xyz","puzzle-thermometers.com","tips97tech.blogspot.com","www.watermarkremover.io","antiracismnewsletter.com","columbiasportswear.co.uk","construction-physics.com","experimental-history.com","puzzle-jigsaw-sudoku.com","puzzle-killer-sudoku.com","read.perspectiveship.com","engineeringleadership.xyz","newsletter.banklesshq.com","astoryofmasasstruggles.com","blog.codingconfessions.com","informationisbeautiful.net","interestingengineering.com","theintrinsicperspective.com","xn--90afacv0cu2a3cr.xn--p1ai","microsoftsecurityinsights.com","newsletter.eng-leadership.com","noicetranslations.blogspot.com","xn--90afacv0clj6ac0dxa.xn--p1ai","www-devonlive-com.translate.goog","www-insider-co-uk.translate.goog","www-kentlive-news.translate.goog","www-themirror-com.translate.goog","www-essexlive-news.translate.goog","newsletter.maartengrootendorst.com","www-football-london.translate.goog","unchartedterritories.tomaspueyo.com","www-cornwalllive-com.translate.goog","www-glasgowlive-co-uk.translate.goog","www-leeds--live-co-uk.translate.goog","www-liverpoolecho-co-uk.translate.goog","www-lincolnshirelive-co-uk.translate.goog","economictimes-indiatimes-com.translate.goog","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];
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
    const todoIndices = new Set();
    indicesFromHostname(todoIndices, entries[0]);
    if ( $hasAncestors$ ) {
        for ( const entry of entries ) {
            if ( entry.i === 0 ) { continue; }
            indicesFromHostname(todoIndices, entry, '>>');
        }
    }
    // Collect arglist references
    if ( todoIndices.size ) {
        const $scriptletArglistRefs$ = /* 458 */ "38;241;194,195,196,197;185;244;227;8;106;107;119;202;206,230;62;54,55,56;236;101;115;141;125;90;127,128,129;166,167;101;70;167;77;241;95;18;213,246;176;162;189;87;241;92;193;239;108;28;54,55,56;15;11;72;114;127,128,129;97;154;253;96;212;172;14;22;226;136;101,105;188;66,67;101;48;108;54,55,56;199;174;45;102;100;140;3;220;227;123;26;133;138;149,150;58;131;117,118;97;163;254;198;241;152,153;169;54,55,56;51;116;109;241;148;178;229;241;80;48;221;217,218,219;137;39;199;208;142;245;54,55,56;185;178;181;135;54,55,56;54,55,56;126;155;60,61;185;164,165;144;104;54,55,56;189;54,55,56;79;69;92;54,55,56,96;185;16,17;168;73;241;54,55,56;59;242;190;7;241;184;207;94,140;209;54,55,56;54,55,56;54,55,56;54,55,56;185;37;241;241;77;185;179;241;187;122;167;21;241;143;241;176;23;97;2;12;232;241;54,55,56;185;241;58;97;210;241;176;54,55,56;170;42,43;6;142;215;222;54,55,56;123;249,250;241;241;176;123;101;132;204;101;214;176;151;53;108;241;130;101;238;5;22;161;189;185;101;64;54,55,56;211;89;54,55,56;54,55,56;94;93;252;160;176;108;29;224;241;203;241;248;101;147;54,55,56;241;241;54,55,56;241;241;97;24;34;121;35;241;241;241;99;58;54,55,56;176;54,55,56;54,55,56;54,55,56;191;191;191;25;123;41;47;134;237;94;241;241;241;54,55,56;49;20;241;185;27;52;235;171;54,55,56;241;33;192;199,201;146;54,55,56;5;228;124;78;191;191;191;191;191;191;173;65;10;54,55,56;88;185;58;241;231;4;241;241;241;185;99;182,183;241;241;142;9;227;233;251;74;243;243;54,55,56;54,55,56;241;191;191;191;103;57;223;75;54,55,56;241;54,55,56;91;63;186;36;13;175;54,55,56;241;139;191;191;191;205;32;177;156,157;241;185;76;234;50;54,55,56;144;108;54,55,56;142;109;241;22;1;191;191;191;191;191;191;191;191;191;191;191;30;69;159;137;144;54,55,56;98;54,55,56;225;54,55,56;71;216;125;100;247;241;31;101;101;54,55,56;241;54,55,56;19;191;191;54,55,56;54,55,56;54,55,56;240;100;81;82;83;84;85;158;99,120;22;191;97;54,55,56;54,55,56;241;54,55,56;44;111;191;191;191;191;46;145;191;97;180;54,55,56;86;54,55,56;54,55,56;191;191;54,55,56;54,55,56;54,55,56;110;54,55,56;40;68;54,55,56;189;96;54,55,56;200;189;112;112;112;112;112;54,55,56;112;54,55,56;112;112;112;112;112;113;189";
        const arglistRefs = $scriptletArglistRefs$.split(';');
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
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

// Execute scriptlets
if ( todo.size && todo.has(0) === false ) {
    const $scriptletFunctions$ = /* 12 */
[setCookie,setLocalStorageItem,removeClass,removeCookie,setSessionStorageItem,removeNodeText,trustedSetCookie,replaceNodeText,trustedSetSessionStorageItem,trustedSetLocalStorageItem,trustedClickElement,trustedCreateHTML];
    const $scriptletArgs$ = /* 303 */ ["block-popuproadblock","true","aonehidepopupnewsletter1727208240","1","the_cookie719","useExitIntent","exit-intent","cp_style_3841","m6e-newsletter","popupIsClosed","emailLightBox","pum-open-overlay","body","stay","root-modal-container-open","hide-cookbook-modal-0","interstitial","aside","zephr-modal-open","newsletterPopupCount","blaize_session","blaize_tracking_id","open-pw","awpopup_450030403","popupShown","awpopup_501941328","popup_closed","email_modal","subscribe-pop-active","blocking-signup","html","huck-newsletter-popup","newsletterModal","enewsOptin","g1_popup_disabled","email-subscribe-check-41be04a9","false","SuppressInterstitial","","reload","marketing-modal-closed-1","2","r_p_s_n","viewedOuibounceModal","hidePopUp","modal-open","newsletter","js-show-newsletter-popup","bytes_signup_modal_viewed","iib_signup_popup","-1","dpp_paywall","pay_ent_msmp","pay_ent_pass","pum-9137","ar-newsletter-promo-dismissed","mm_f_45691","pum-605611","isNewsletterPopupShown","nbaSIBWidgetSeen","mailerlite:forms:shown:109925949413262377","floating-sign-up-dismissed","emailPopupDismissed","last-chance-optin","has-intro-popup","modal-in","show-intro-popup","pum-276000","uf_signup_bar","BRANCH_BANNER_PAGE_LOAD","EMAIL_CAPTURE_MODAL_STOP","show-email-intake-form","articleModalShown","sgID","st_newsletter_splash_desktop_seen","newsletter_signup_promo","newsletter_signup_views","hasShownPopup","jetpack_post_subscribe_modal_dismissed","CNN_MAIL_MAGAZIN","modalViewed","theme:popup-appeared","oxy-modal-active","newsletterLightboxDisplayed","emailSignupModal_isShown","MCPopupClosed","yes","welcome_modal_email_ts","signUpModalClosed_slot-paulaschoice_us-global-signUpModal-sfmcModal","newsletter-newsletter-popup","user_closed_pop_up","Columbia_AT_emailPopup","Columbia_DE_emailPopup","Columbia_ES_emailPopup","Columbia_FR_emailPopup","Columbia_IT_emailPopup","Columbia_UK_emailPopup","banner_session","mystery_popup","sws-gwpop","popup-newsletter","enews_popup_session","script","/parseInt.*push.*setTimeout.*try.*catch/","document.onselectstart","preventDefault","stopRefreshSite","intro_popup_last_hidden_at","$currentDate$","debugger","kpwc","stopPrntScr","document.oncontextmenu","contextmenu","/document.onkeydown|document.ondragstart/","wccp","/contextmenu|devtool/","style","user-select","console.clear","wccp_pro","devtoolsDetector","nocontextmenu","/contextmenu|reEnable/","/\\.novel-box \\*:not\\(a\\)|@media print/g","loc.hostname","var lh = location.host;","window.location.reload","devtools","while(!![]){try{var","/Clipboard|oncontextmenu|wpcp|keyCode/","/-webkit-user-select|webkit-appearance/","status_of_app_redirect_half_modal_on_coordinate_list","{\"displayed\":true}","selection","::selection","contentprotector","oncontextmenu","/contextmenu|oncopy/","/oncontextmenu|wccp/","/wpcp|contextmenu|unselectable/","keydown","ooo","onkeydown","ccc","_ngViCo-SupporterPromo","/devtoolsDetector|keyCode|preventDefault/","\"copyRProtection\":true","\"copyRProtection\":false","@media print {body { display: none !important; }}","-ms-user-select: none","onselectstart","rcoverride < 1","ctrlKey","disableRightClick",".blockContextMenu",".preventDefault()","includes","/\\be(vent)?\\.preventDefault\\(\\);?/g","'contextmenu'","__ADB_COOLDOWN__","/^self\\./","(()=>{const a={apply:(a,e,o)=>(o[0]?.src?.includes?.(\"nitropay.com/ads\")&&setTimeout((()=>{window.nitroAds=window.nitroAds||{createAd:()=>{let n='function ye(e,t){var r;if(\"\"!=typeof t)return y.R.error(typeof t),y.R.error(t),null;const n=JSON.parse(JSON.stringify(t));if(t.acceptable)return null;if(t.sizes||=[],t.sizes&&t.sizes.length>0){const e=[];for(const r of t.sizes)2===r.length?e.push([Number(r[0]),Number(r[1])]):y.R.error(\"\");t.sizes=e}if(t.format&&t.format===w.e.Article)return(0,v.zL)(e,t,ve);if(t.format&&t.format===w.e.StickyStack)return(0,v.ek)(e,t,ve);if((0,c.zI)(t.format)||t.format===w.e.Rail){const n=me.findIndex((t=>e===t.id)),i=n>-1?me[n]:null;if(i&&i.createdAt&&Date.now()-i.createdAt<50)return y.R.debug(\"\"),null;const o=document.getElementById(e);if(o){try{y.R.debug(\"\"),o.remove(),i&&null!=(r=document.getElementById(i.id+\"\"))&&r.remove()}catch(e){y.R.debug(e)}return ve(e,t)}}return t.delayLoading?(0,v.hZ)(e,t,ve):t.format===w.e.SmartFlex?async function(e,t,r){const n=document.getElementById(e);if(!n)return y.R.warn(\"\"),[];t.format=w.e.SmartFlex,t.video||={},t.video.float=w.jz.Never;const i=[],o=W(n);if((o.width||o.maxWidth||window.innerWidth)<300)return y.R.warn(\"\"),n.remove(),[];n.style.maxWidth=\"\",n.style.width=\"\",n.style.height=\"\",n.style.display=\"\",n.style.flexWrap=\"\",n.style.flexDirection=\"\",n.style.placeContent=\"\";let l=document.getElementById(\"\");return l||(l=document.createElement(\"\"),l.id=\"\",n.appendChild(l)),t.sizes=L(n,{ignoreBounds:!0}),i.push(await r(\"\",t)),i}(e,t,ve):(y.R.getLevel()===y.R.levels.TRACE&&console.log(\"\",{id:e,originalOptions:n,options:t}),ve(e,t))}'},siteId:1487,addUserToken:()=>{},clearUserTokens:()=>{},blocklist:[],queue:[],loaded:!0,version:\"20251114 2dd5c12\",geo:\"\"}}),1e3),Reflect.apply(a,e,o))};window.HTMLBodyElement.prototype.appendChild=new Proxy(window.HTMLBodyElement.prototype.appendChild,a)})();self.","sedCount","adblock_modal_dismissed","adBlockerAlert_lastShown","$now$","adBlockedModal:lastDismiss","button#vs_modal_v9_notice_dismiss","jelonka_news_ad_access_gate_first_detected_at","jelonka_news_ad_access_gate_soft_dismissed_at","BT_AM_SOFTWALL_DISMISSED","{\"element\":\"continue-to-site\"}","DWEB_PIN_IMAGE_CLICK_COUNT","$remove$","unauthDownloadCount",".chakra-portal .chakra-modal__content-container > section.chakra-modal__content > .chakra-modal__header:has(> .chakra-stack > a[href^=\"https://www.deezer.com/payment/go.php?origin=paywall_pressure\"]) + button.chakra-modal__close-btn","contextual-sign-in-modal-cool-off-hidden","/wccp|contextmenu/","/wccp|user-select/","disableSelection","copyprotect","/contextmenu|wpcp/","rprw","hasAdAlert","header","click-to-scroll",".np{",".dummy{","condition","@media print","/disableclick|devtool/","social-qa/machineId","simple-funnel-name","/setTimeout.*style/","disable-selection","reEnable","/adblock/i","initPopup","ezgwcc","isadb","e.preventDefault();","btnHtml","/$.*ready.*setInterval/","fs.adb.dis","disable_show_error","WkdGcGJIbEpiV0ZuWlVSaGRHRT0=","if(floovy()) {","if(false) {","disable_copy","nocontext","XF","/articlesLimit|articlesRead|previousPage/","when","scroll keydown","fetch","[data-automation=\"continue-to-ads-btn\"]","10000","ad_blocker","/ctrlKey|clickNS|disableselect/","quitAfter","2000","adblock","ab927c49cf1b","detectDevTool",".z_share_popover div.gap_2 > button.mt_24px.rounded_100vh + button.text_tint.disabled\\:opacity_0\\.4.h_50px","[data-testid=\"consentBanner\"] > button[data-testid=\"banner-button\"]","1000","1100","1200","1300","halfSheetAppBannerDismissed","{\"halfSheetAppBannerDismissed\":{\"expiration\":2000000000000,\"data\":true}}","disableselect","_ad","0","#web-modal button.css-1d86b5p",".erc-existing-profile-onboarding-modal button[class^=\"modal-portal__close-button\"]","checkAdsBlocked","#com-onboarding-OnboardingWelcomeModal__title + div .com-a-Button--dark","adblockNoticePermaDismiss","lastViewTime","keyCode","window.location.href","/devtool|debugger/","leftPanelOpen","/^freeVideoFriendly/",".seo-landing-modal-cancel-btn .design-system-button-container","500","/adbl/i","/oncontextmenu|disableselect/","reference_offer","__q_objt|{\"offer_type\":\"PROMOTION\"}","show_offer","__q_bool|0","show_offer_timestamp","__q_numb|9999999999999",".dig-Modal:has(div[data-testid=\"digTruncateTooltipTrigger\"]) > .dig-Modal-close-btn","iAgree","adblockNotice","{\"dismissed\":true,\"impressionCount\":1}","firebox_3330","getComputedStyle","onerror","xvmDialogLastShown","android-install-modal-skipped-until","9999999999999","dragscroll","clipboard_disabled",".com-onboarding-OnboardingWelcomeModal__button-wrapper > .com-a-Button--dark","userData_","mobile-app-recommend","{\"dismissed\":true,\"day\":30}","CopyrightLayer","abc","as_init","popupClosed","darken","no_scroll","complete","blurry","body > :not(.m-fbPopup)","_tsr_pc","FTR_Article_PageView","div[id^=\"alia-popup-root-alia-\"] div[aria-label=\"Close popup\"]","/oncontextmenu|onselectstart/","aichatPromoDismissal","{\"promoReleaseDate\":\"2026-01-05\",\"dismissedPromos\":[\"subscription\",\"browserUpsell\"],\"allPromosDismissed\":true}","appDownloadPromptDismissedV3Ttl","{\"value\":\"99999999999999\",\"expiresAt\":99999999999999}","main div[data-theater-mode] button[type=\"submit\"]","/wpcp|contextmenu/","<details open style='display:none' ontoggle='(function(){     window.addEventListener(\"contextmenu\", (e) => { e.stopImmediatePropagation(); return true; }, true);     const allow = (e) => { e.stopImmediatePropagation(); return true; };     document.addEventListener(\"selectstart\", allow, true);     document.addEventListener(\"copy\", allow, true);     window.addEventListener(\"keydown\", (e) => {         if ((e.ctrlKey || e.metaKey) && (e.key === \"c\" || e.key === \"a\")) {             e.stopImmediatePropagation();         }     }, true);     document.querySelectorAll(\"*\").forEach(el => {         el.oncontextmenu = null;         el.onselectstart = null;         el.oncopy = null;         el.onkeydown = null;         el.style.userSelect = \"auto\";     }); })();'></details>","TUTORIAL_CLOSED_SNACKS_HOME","fechado","TUTORIAL_VIEWED_SNACKS_HOME","timeLeft > 0","timeLeft = 0","clearInterval","countdown <= 0","countdown => 0","adblock_counter",".offsetHeight"];
    const $scriptletArglists$ = /* 255 */ ";0,0,1;0,2,3;0,4,1;1,5,1;0,6,1;0,7,1;0,8,3;0,9,3;1,10,1;2,11,12,13;2,14,12,13;1,15,1;2,16,17,13;2,18,12,13;1,19,3;3,20;3,21;2,22,12,13;0,23,3;0,24,1;0,25,3;0,26,1;0,27,1;2,28,12,13;2,29,30,13;0,31,1;0,32,1;0,33,3;0,34,3;1,35,36;0,37,1,38,39,3;0,40,41;0,42,3;0,43,1;0,44,1;2,45,38,13;0,46,1;2,47,38,13;0,48,3;0,49,50;3,51;3,52;3,53;0,54,1;0,55,3;0,56,1;0,57,1;0,58,36,38,39,3;1,59,1;0,60,3;4,61,1;4,62,3;0,63,1;2,64,30,13;2,65,30,13;2,66,30,13;0,67,1;2,45,12,13;0,68,3;1,69,3;1,70,3;1,71,36;4,72,1;3,73;0,74,1;0,75,1;0,76,3;1,77,1;0,78,1;0,79,3;1,80,3;1,81,1;2,82,12,13;0,83,1;4,84,1;0,85,86;0,87,3;1,88,3;0,89,1;1,90,1;0,91,3;0,92,3;0,93,3;0,94,3;0,95,3;0,96,3;4,97,1;0,98,1;0,99,3;0,100,1;4,101,3;5,102,103;5,102,104;5,102,105;5,102,106;6,107,108;5,102,109;3,110;5,102,111;5,102,112;5,102,113;5,102,114;5,102,115;5,102,116;5,117,118;5,102,119;5,102,120;5,102,121;5,102,122;5,102,123;7,117,124;5,102,125;5,102,126;7,102,127;5,102,128;5,102,129;5,102,130;5,117,131;8,132,133;5,117,134;5,117,135;5,102,136;5,102,137;5,102,138;5,102,139;5,102,140;7,102,141,142;7,102,143,142;7,102,113,144;3,145;5,102,146;7,102,147,148;7,117,149;5,117,150;5,102,151;7,102,152,36;5,102,153;5,102,154;5,102,155;5,102,156,157,113;7,102,158;5,102,159;5,102,160;7,102,161,162,163,3;4,164,1;9,165,166;9,167,166;10,168;9,169,166;9,170,166;8,171,172;1,173,174;1,175,174;10,176;9,177,166;5,102,178;5,117,179;5,102,180;5,102,181;5,102,182;1,183,174;2,184,185;2,186,12;7,117,187,188,189,190;5,102,191;1,192,174;1,193,174;5,102,194;2,195,12;5,102,196;5,102,197;5,102,198;0,199,3;5,102,200;5,102,201;5,102,202;5,102,203;4,204,3;5,102,205;1,206,174;7,102,207,208;5,102,209;5,102,210;5,102,211;3,212,213,214;5,102,215;10,216,38,217;1,218,36;5,102,219,220,221;4,222,1;5,102,223;5,102,224;10,225;10,226,38,227;10,226,38,228;10,226,38,229;10,226,38,230;9,231,232;5,102,222;5,102,233;0,234,235;10,236;10,237;7,117,190;5,102,238;10,239;1,240,1;9,241,108;5,102,242;5,102,243;5,102,244;0,245,235;1,246,174;10,247,38,248;5,102,249;5,102,250;9,251,252;9,253,254;9,255,256;10,257,38,221;0,258,3;9,259,260;0,261,3;5,102,262;5,102,263;9,264,166;9,265,266;2,267;5,102,268;10,269;5,102,270;9,271,272;7,102,273,274;5,102,275;4,276,1;2,45,12;2,277,12;2,12,278,279;2,280,281,13;0,282,235;0,283,41;10,284;5,102,285;9,286,287;9,288,289;10,290,38,227;5,102,291;11,30,292;9,293,294;1,295,1;7,102,296,297,157,298;7,102,299,300;3,301;5,102,302";
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
