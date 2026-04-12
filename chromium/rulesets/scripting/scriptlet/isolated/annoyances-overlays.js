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
        timer = safe.onIdle(rmclass, { timeout: 67 });
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
        return elem.shadowRoot;
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

const $scriptletFunctions$ = /* 11 */
[setCookie,setLocalStorageItem,removeClass,removeCookie,setSessionStorageItem,removeNodeText,replaceNodeText,trustedSetLocalStorageItem,trustedClickElement,trustedSetCookie,trustedSetSessionStorageItem];

const $scriptletArgs$ = /* 272 */ ["block-popuproadblock","true","aonehidepopupnewsletter1727208240","1","the_cookie719","useExitIntent","exit-intent","cp_style_3841","m6e-newsletter","popupIsClosed","emailLightBox","pum-open-overlay","body","stay","root-modal-container-open","hide-cookbook-modal-0","interstitial","aside","zephr-modal-open","newsletterPopupCount","blaize_session","blaize_tracking_id","open-pw","awpopup_450030403","popupShown","awpopup_501941328","popup_closed","email_modal","subscribe-pop-active","blocking-signup","html","huck-newsletter-popup","newsletterModal","enewsOptin","g1_popup_disabled","email-subscribe-check-41be04a9","false","SuppressInterstitial","","reload","marketing-modal-closed-1","2","r_p_s_n","viewedOuibounceModal","hidePopUp","modal-open","newsletter","js-show-newsletter-popup","bytes_signup_modal_viewed","iib_signup_popup","-1","dpp_paywall","pay_ent_msmp","pay_ent_pass","pum-9137","isNewsletterPopupShown","nbaSIBWidgetSeen","mailerlite:forms:shown:109925949413262377","floating-sign-up-dismissed","emailPopupDismissed","has-intro-popup","modal-in","show-intro-popup","pum-276000","uf_signup_bar","BRANCH_BANNER_PAGE_LOAD","EMAIL_CAPTURE_MODAL_STOP","show-email-intake-form","articleModalShown","sgID","st_newsletter_splash_desktop_seen","newsletter_signup_promo","newsletter_signup_views","hasShownPopup","jetpack_post_subscribe_modal_dismissed","CNN_MAIL_MAGAZIN","modalViewed","oxy-modal-active","newsletterLightboxDisplayed","emailSignupModal_isShown","MCPopupClosed","yes","welcome_modal_email_ts","signUpModalClosed_slot-paulaschoice_us-global-signUpModal-sfmcModal","newsletter-newsletter-popup","user_closed_pop_up","Columbia_AT_emailPopup","Columbia_DE_emailPopup","Columbia_ES_emailPopup","Columbia_FR_emailPopup","Columbia_IT_emailPopup","Columbia_UK_emailPopup","banner_session","mystery_popup","sws-gwpop","popup-newsletter","enews_popup_session","script","debugger","oncontextmenu","\"copyRProtection\":true","\"copyRProtection\":false","style","@media print {body { display: none !important; }}","contextmenu","-ms-user-select: none","onselectstart","rcoverride < 1","__ADB_COOLDOWN__","/^self\\./","(()=>{const a={apply:(a,e,o)=>(o[0]?.src?.includes?.(\"nitropay.com/ads\")&&setTimeout((()=>{window.nitroAds=window.nitroAds||{createAd:()=>{let n='function ye(e,t){var r;if(\"\"!=typeof t)return y.R.error(typeof t),y.R.error(t),null;const n=JSON.parse(JSON.stringify(t));if(t.acceptable)return null;if(t.sizes||=[],t.sizes&&t.sizes.length>0){const e=[];for(const r of t.sizes)2===r.length?e.push([Number(r[0]),Number(r[1])]):y.R.error(\"\");t.sizes=e}if(t.format&&t.format===w.e.Article)return(0,v.zL)(e,t,ve);if(t.format&&t.format===w.e.StickyStack)return(0,v.ek)(e,t,ve);if((0,c.zI)(t.format)||t.format===w.e.Rail){const n=me.findIndex((t=>e===t.id)),i=n>-1?me[n]:null;if(i&&i.createdAt&&Date.now()-i.createdAt<50)return y.R.debug(\"\"),null;const o=document.getElementById(e);if(o){try{y.R.debug(\"\"),o.remove(),i&&null!=(r=document.getElementById(i.id+\"\"))&&r.remove()}catch(e){y.R.debug(e)}return ve(e,t)}}return t.delayLoading?(0,v.hZ)(e,t,ve):t.format===w.e.SmartFlex?async function(e,t,r){const n=document.getElementById(e);if(!n)return y.R.warn(\"\"),[];t.format=w.e.SmartFlex,t.video||={},t.video.float=w.jz.Never;const i=[],o=W(n);if((o.width||o.maxWidth||window.innerWidth)<300)return y.R.warn(\"\"),n.remove(),[];n.style.maxWidth=\"\",n.style.width=\"\",n.style.height=\"\",n.style.display=\"\",n.style.flexWrap=\"\",n.style.flexDirection=\"\",n.style.placeContent=\"\";let l=document.getElementById(\"\");return l||(l=document.createElement(\"\"),l.id=\"\",n.appendChild(l)),t.sizes=L(n,{ignoreBounds:!0}),i.push(await r(\"\",t)),i}(e,t,ve):(y.R.getLevel()===y.R.levels.TRACE&&console.log(\"\",{id:e,originalOptions:n,options:t}),ve(e,t))}'},siteId:1487,addUserToken:()=>{},clearUserTokens:()=>{},blocklist:[],queue:[],loaded:!0,version:\"20251114 2dd5c12\",geo:\"\"}}),1e3),Reflect.apply(a,e,o))};window.HTMLBodyElement.prototype.appendChild=new Proxy(window.HTMLBodyElement.prototype.appendChild,a)})();self.","sedCount","adblock_modal_dismissed","adBlockerAlert_lastShown","$now$","adBlockedModal:lastDismiss","DWEB_PIN_IMAGE_CLICK_COUNT","$remove$","unauthDownloadCount",".chakra-portal .chakra-modal__content-container > section.chakra-modal__content > .chakra-modal__header:has(> .chakra-stack > a[href^=\"https://www.deezer.com/payment/go.php?origin=paywall_pressure\"]) + button.chakra-modal__close-btn","contextual-sign-in-modal-cool-off-hidden","/wccp|contextmenu/","/wccp|user-select/","disableSelection","copyprotect","/parseInt.*push.*setTimeout.*try.*catch/","/contextmenu|wpcp/","rprw","hasAdAlert","header","click-to-scroll",".np{",".dummy{","condition","@media print","/disableclick|devtool/","social-qa/machineId","simple-funnel-name","/setTimeout.*style/","disable-selection","reEnable","stopPrntScr","kpwc","/adblock/i","intro_popup_last_hidden_at","$currentDate$","stopRefreshSite","nocontextmenu","devtoolsDetector","console.clear","wccp_pro","initPopup","user-select","/contextmenu|devtool/","preventDefault","ezgwcc","wccp","isadb","e.preventDefault();","document.oncontextmenu","btnHtml","document.onselectstart","/$.*ready.*setInterval/","fs.adb.dis","disable_show_error","WkdGcGJIbEpiV0ZuWlVSaGRHRT0=","if(floovy()) {","if(false) {","disable_copy","nocontext","XF","/articlesLimit|articlesRead|previousPage/","when","scroll keydown","/document.onkeydown|document.ondragstart/","ctrlKey","fetch","[data-automation=\"continue-to-ads-btn\"]","10000","devtools","while(!![]){try{var","ad_blocker","/closeWindow\\(\\)|clickIE\\(\\)|reEnable\\(\\)/","adblock","window.location.reload","ab927c49cf1b","detectDevTool","/Clipboard|oncontextmenu|wpcp|keyCode/","/-webkit-user-select|webkit-appearance/",".z_share_popover div.gap_2 > button.mt_24px.rounded_100vh + button.text_tint.disabled\\:opacity_0\\.4.h_50px","[data-testid=\"consentBanner\"] > button[data-testid=\"banner-button\"]","1000","1100","1200","1300","halfSheetAppBannerDismissed","{\"halfSheetAppBannerDismissed\":{\"expiration\":2000000000000,\"data\":true}}","loc.hostname","disableselect","status_of_app_redirect_half_modal_on_coordinate_list","{\"displayed\":true}","_ad","0","_ngViCo-SupporterPromo","#web-modal button.css-1d86b5p",".erc-existing-profile-onboarding-modal button[class^=\"modal-portal__close-button\"]","/\\.novel-box \\*:not\\(a\\)|@media print/g","selection","checkAdsBlocked","#com-onboarding-OnboardingWelcomeModal__title + div .com-a-Button--dark","adblockNoticePermaDismiss","lastViewTime","::selection","keyCode","window.location.href","/devtool|debugger/","/devtoolsDetector|keyCode|preventDefault/","leftPanelOpen","/^freeVideoFriendly/","contentprotector","/contextmenu|reEnable/",".seo-landing-modal-cancel-btn .design-system-button-container","500","/adbl/i","/oncontextmenu|disableselect/","reference_offer","__q_objt|{\"offer_type\":\"PROMOTION\"}","show_offer","__q_bool|0","show_offer_timestamp","__q_numb|9999999999999",".dig-Modal:has(div[data-testid=\"digTruncateTooltipTrigger\"]) > .dig-Modal-close-btn","2000","iAgree","adblockNotice","{\"dismissed\":true,\"impressionCount\":1}","firebox_3330","/contextmenu|oncopy/","getComputedStyle","onerror","xvmDialogLastShown","/oncontextmenu|wccp/","android-install-modal-skipped-until","9999999999999","dragscroll","clipboard_disabled",".com-onboarding-OnboardingWelcomeModal__button-wrapper > .com-a-Button--dark","userData_","mobile-app-recommend","{\"dismissed\":true,\"day\":30}","CopyrightLayer","abc","/wpcp|contextmenu|unselectable/","as_init","popupClosed","darken","no_scroll","complete","blurry","body > :not(.m-fbPopup)","_tsr_pc","keydown","ooo","onkeydown","ccc","FTR_Article_PageView","div[id^=\"alia-popup-root-alia-\"] div[aria-label=\"Close popup\"]","/oncontextmenu|onselectstart/","aichatPromoDismissal","{\"promoReleaseDate\":\"2026-01-05\",\"dismissedPromos\":[\"subscription\",\"browserUpsell\"],\"allPromosDismissed\":true}","appDownloadPromptDismissedV3Ttl","{\"value\":\"99999999999999\",\"expiresAt\":99999999999999}"];

const $scriptletArglists$ = /* 230 */ "0,0,1;0,2,3;0,4,1;1,5,1;0,6,1;0,7,1;0,8,3;0,9,3;1,10,1;2,11,12,13;2,14,12,13;1,15,1;2,16,17,13;2,18,12,13;1,19,3;3,20;3,21;2,22,12,13;0,23,3;0,24,1;0,25,3;0,26,1;0,27,1;2,28,12,13;2,29,30,13;0,31,1;0,32,1;0,33,3;0,34,3;1,35,36;0,37,1,38,39,3;0,40,41;0,42,3;0,43,1;0,44,1;2,45,38,13;0,46,1;2,47,38,13;0,48,3;0,49,50;3,51;3,52;3,53;0,54,1;0,55,36,38,39,3;1,56,1;0,57,3;4,58,1;4,59,3;2,60,30,13;2,61,30,13;2,62,30,13;0,63,1;2,45,12,13;0,64,3;1,65,3;1,66,3;1,67,36;4,68,1;3,69;0,70,1;0,71,1;0,72,3;1,73,1;0,74,1;0,75,3;1,76,3;2,77,12,13;0,78,1;4,79,1;0,80,81;0,82,3;1,83,3;0,84,1;1,85,1;0,86,3;0,87,3;0,88,3;0,89,3;0,90,3;0,91,3;4,92,1;0,93,1;0,94,3;0,95,1;4,96,3;5,97,98;5,97,99;6,97,100,101;6,102,103;5,97,104;5,102,105;5,97,106;6,97,107,36;5,97,108;6,97,109,110,111,3;4,112,1;7,113,114;7,115,114;1,116,117;1,118,117;8,119;7,120,114;5,97,121;5,102,122;5,97,123;5,97,124;5,97,125;5,97,126;1,127,117;2,128,129;2,130,12;6,102,131,132,133,134;5,97,135;1,136,117;1,137,117;5,97,138;2,139,12;5,97,140;5,97,141;3,142;5,97,143;9,144,145;5,97,146;5,97,147;5,97,148;5,97,149;5,97,150;5,97,151;5,102,152;5,97,153;5,97,154;0,155,3;5,97,156;5,97,157;5,97,158;5,97,159;5,97,160;5,97,161;5,97,162;4,163,3;5,97,164;1,165,117;6,97,166,167;5,97,168;5,97,169;5,97,170;3,171,172,173;5,97,174;5,97,175;5,97,176;8,177,38,178;5,97,179;5,97,180;1,181,36;5,97,182;4,183,1;6,97,184;5,97,185;5,97,186;5,97,187;5,102,188;8,189;8,190,38,191;8,190,38,192;8,190,38,193;8,190,38,194;7,195,196;5,97,197;5,97,183;5,97,198;10,199,200;0,201,202;3,203;8,204;8,205;6,102,134;6,102,206;5,102,207;5,97,208;8,209;1,210,1;7,211,145;5,102,212;5,97,213;5,97,214;5,97,215;5,97,216;0,217,202;1,218,117;5,97,219;5,97,220;8,221,38,222;5,97,223;5,97,224;7,225,226;7,227,228;7,229,230;8,231,38,232;0,233,3;7,234,235;0,236,3;5,97,237;5,97,238;5,97,239;7,240,114;5,97,241;7,242,243;2,244;5,97,245;8,246;5,97,247;7,248,249;6,97,250,251;5,97,252;5,97,253;4,254,1;2,45,12;2,255,12;2,12,256,257;2,258,259,13;0,260,202;6,97,261,262;6,97,263,262;6,97,104,264;0,265,41;8,266;5,97,267;7,268,269;7,270,271";

const $scriptletArglistRefs$ = /* 428 */ "37;225;163,164,165,166;147;228;207;7;126;127;171;174;180,210;57;49,50,51;217;90;152;206;84;222,223,224;114,115;90;65;115;71;225;123;17;189;137;110;155;81;225;107;162;220;125;27;14;10;157;222,223,224;86;101;122;188;128;13;21;205;93;90,129;154;61,62;44;125;49,50,51;169;134;148;136;2;198;207;87;25;89;53;187;160,161;86;111;167;225;99,100;117;49,50,51;47;153;124;225;140;209;225;74;44;199;195,196,197;38;169;182;229;49,50,51;147;140;143;92;49,50,51;49,50,51;214;102;55,56;147;112,113;95;130;49,50,51;155;49,50,51;73;64;107;49,50,51,122;147;15,16;116;67;225;49,50,51;54;226;156;6;225;146;181;184;49,50,51;49,50,51;49,50,51;49,50,51;147;36;225;225;71;147;141;225;151;190;115;20;225;94;225;137;22;86;1;11;212;225;49,50,51;147;225;53;86;185;225;137;49,50,51;118;41,42;5;193;200;49,50,51;87;225;225;137;87;90;88;176;90;192;137;125;225;173;90;219;4;21;109;155;147;90;59;49,50,51;186;83;49,50,51;49,50,51;131;138;108;137;125;28;203;225;175;225;90;98;49,50,51;225;225;49,50,51;225;225;86;23;33;183;34;225;225;225;119;53;49,50,51;137;49,50,51;49,50,51;49,50,51;158;158;158;24;87;40;91;218;131;225;225;225;49,50,51;45;19;225;147;26;48;216;121;49,50,51;225;32;159;169,172;97;49,50,51;4;208;202;72;158;158;158;158;158;158;132;60;9;49,50,51;82;147;53;225;211;3;225;225;225;147;119;144,145;225;225;8;207;213;68;227;227;49,50,51;49,50,51;225;158;158;158;133;52;201;69;49,50,51;225;49,50,51;85;58;150;35;12;135;49,50,51;225;158;158;158;179;31;139;103,104;225;147;70;215;46;49,50,51;95;125;49,50,51;225;21;0;158;158;158;158;158;158;158;158;158;158;158;29;64;106;149;95;49,50,51;120;49,50,51;204;49,50,51;66;194;206;136;225;30;90;90;49,50,51;225;49,50,51;18;158;158;49,50,51;49,50,51;49,50,51;221;136;75;76;77;78;79;105;119,178;21;158;86;49,50,51;225;49,50,51;43;177;158;158;158;158;96;158;86;142;49,50,51;80;49,50,51;49,50,51;158;158;49,50,51;49,50,51;49,50,51;191;49,50,51;39;63;49,50,51;155;122;49,50,51;170;155;168;168;168;168;168;49,50,51;168;49,50,51;168;168;168;168;168;155";

const $scriptletHostnames$ = /* 428 */ ["dgb.de","t3.com","bbc.com","cbr.com","duck.ai","fic.fan","pbs.org","sbot.cf","tvhay.*","wear.jp","wrtn.jp","abema.tv","core.app","dkb.blog","hetek.hu","rds.live","vembed.*","2mnews.ro","assos.com","bintv.fun","brainly.*","cespun.eu","cnn.co.jp","eodev.com","funko.com","itpro.com","jpost.com","money.com","nebula.tv","pling.com","pornhub.*","redisex.*","sears.com","space.com","strtape.*","teller.jp","vezess.hu","vidmoly.*","vokey.com","action.com","all3dp.com","baumbet.ro","bintvs.fun","camcaps.io","deezer.com","entra.news","fandom.com","fjordd.com","forbes.com","lowpass.cc","modxvm.com","nny360.com","oploverz.*","scenexe.io","snopes.com","toysrus.ca","watchx.top","webworm.co","xanimu.com","161.97.70.5","anascrie.ro","bg-gledai.*","diastixo.gr","dropbox.com","ficbook.net","hiphopa.net","huckmag.com","j-lyric.net","mandiner.hu","mostream.us","mrbenne.com","nicekkk.com","novelza.com","patreon.com","pcgamer.com","pinterest.*","postype.com","racket.news","semafor.com","stblion.xyz","teamkong.tk","theweek.com","270towin.com","adressit.com","advnture.com","audialab.com","babiesrus.ca","bangbros.com","bitchute.com","coinbase.com","cosxplay.com","cu.tbs.co.jp","doordash.com","flowstate.fm","gamerant.com","getemoji.com","heidisql.com","kashiland.jp","kunstler.com","latent.space","liddread.com","linkedin.com","magnolia.com","movieweb.com","novelpia.com","paxdei.th.gl","playertv.net","popular.info","redecanais.*","sambowman.co","saucerco.com","shojiwax.com","streamtape.*","substack.com","thegamer.com","theverge.com","valid.x86.fr","wahaca.co.uk","whathifi.com","wonkette.com","30seconds.com","aeropress.com","afterclass.io","artribune.com","avnetwork.com","broncoshq.com","camspider.com","cyberdom.blog","dossier.today","elysian.press","eugyppius.com","gamefile.news","howtogeek.com","jingdaily.com","kiplinger.com","livingetc.com","loungefly.com","makeuseof.com","mathcrave.com","moneyweek.com","moovitapp.com","nihongoaz.com","nosdevoirs.fr","oled-info.com","petsradar.com","roleplayer.me","shortlist.com","store.kde.org","streamily.com","streamvid.net","sweet-shop.si","tastemade.com","teamblind.com","techradar.com","theankler.com","thethings.com","tomsguide.com","tweaktown.com","up4stream.com","vyvymanga.net","wallpaper.com","xfce-look.org","afterbabel.com","bolugundem.com","bonappetit.com","breachmedia.ca","cowcotland.com","duckduckgo.com","duffelblog.com","e-panigiria.gr","fitandwell.com","gamesradar.com","gnome-look.org","infotrucker.ro","iptvromania.ro","isekaitube.com","karsaz-law.com","klartext-ne.de","lemon8-app.com","linux-apps.com","moviesapi.club","musicradar.com","newgrounds.com","nullforums.net","otpportalok.hu","railsnotes.xyz","readergrev.com","realpython.com","redecanaistv.*","screenrant.com","seriesperu.com","similarweb.com","slowboring.com","streamruby.com","sweetwater.com","techemails.com","thebulwark.com","themeslide.com","zipcode.com.ng","android1pro.com","appimagehub.com","asumanaksoy.com","awardsradar.com","bangkokpost.com","cinemablend.com","crunchyroll.com","cyclingnews.com","espressocafe.ro","flamecomics.xyz","forkingpaths.co","fourfourtwo.com","golfmonthly.com","goto10retro.com","guitarworld.com","idealhome.co.uk","ilovetoplay.xyz","insider.fitt.co","intellinews.com","japonhentai.com","kermitlynch.com","livescience.com","loudersound.com","marieclaire.com","medeberiya.site","mightyape.co.nz","noahpinion.blog","opendesktop.org","piratewires.com","platformer.news","publicnotice.co","puzzle-lits.com","puzzle-loop.com","puzzle-tapa.com","restofworld.org","streambuddy.net","thedriftmag.com","togetogebox.org","traffihunter.hu","warungkomik.com","whatculture.com","whattowatch.com","whowhatwear.com","asiasentinel.com","clutchpoints.com","commondreams.org","creativebloq.com","dualshockers.com","egopowerplus.com","empirical.health","erzsebetvaros.hu","freefilesync.org","garbageday.email","guitarplayer.com","in.investing.com","inattvcom117.xyz","klsescreener.com","lofi-nopixel.com","michaelmoore.com","monarchmoney.com","nichepcgamer.com","ofertecatalog.ro","paulaschoice.com","puzzle-chess.com","puzzle-masyu.com","puzzle-pipes.com","puzzle-slant.com","puzzle-tents.com","puzzle-words.com","scitechdaily.com","seattletimes.com","securityweek.com","semianalysis.com","sharperimage.com","simpleflying.com","suzukicycles.com","techlearning.com","theintercept.com","timesnownews.com","tomshardware.com","tvtechnology.com","womanandhome.com","androidpolice.com","blog.tangwudi.com","brokensilenze.net","countrylife.co.uk","cyclingweekly.com","duluthtrading.com","fanfictionero.com","foodnavigator.com","girlscoutshop.com","googleapis.com.de","googleapis.com.do","hamiltonnolan.com","honest-broker.com","marieclaire.co.uk","puzzle-hitori.com","puzzle-kakuro.com","puzzle-sudoku.com","terramirabilis.ro","thefederalist.com","tmnascommunity.eu","virginvoyages.com","americasvoice.news","androidcentral.com","aporiamagazine.com","bcliquorstores.com","campaignlive.co.uk","cheersandgears.com","chicagotribune.com","cityandstateny.com","gdrivedescarga.com","henrikkarlsson.xyz","homebuilding.co.uk","puzzle-binairo.com","puzzle-bridges.com","puzzle-shikaku.com","readcomiconline.li","theinformation.com","thejakartapost.com","tunovelaligera.com","windowscentral.com","xda-developers.com","yvonnebennetti.com","canuckaudiomart.com","clevercreations.org","computerenhance.com","duneawakening.th.gl","freshlifecircle.com","friendlyatheist.com","homesandgardens.com","jointhefollowup.com","press.princeton.edu","puzzle-aquarium.com","puzzle-dominosa.com","puzzle-galaxies.com","puzzle-heyawake.com","puzzle-kakurasu.com","puzzle-light-up.com","puzzle-norinori.com","puzzle-nurikabe.com","puzzle-shingoki.com","puzzle-stitches.com","puzzle-yin-yang.com","scaleofuniverse.com","skepticalraptor.com","skidrowreloaded.com","smartkhabrinews.com","starresonance.th.gl","statsignificant.com","technologyreview.jp","theclimatebrink.com","toweroffantasy.info","understandingai.org","urbanoutfitters.com","zabawkahurtownia.pl","adevarurisecrete.com","aventurainromania.ro","gardeningknowhow.com","gourmetfoodstore.com","japanesewithtomo.com","lyrical-nonsense.com","moreisdifferent.blog","myvouchercodes.co.uk","persuasion.community","plantpowercouple.com","puzzle-futoshiki.com","puzzle-nonograms.com","secretsofprivacy.com","strangeloopcanon.com","thebignewsletter.com","thestudentroom.co.uk","audiologyresearch.org","columbiasportswear.at","columbiasportswear.de","columbiasportswear.es","columbiasportswear.fr","columbiasportswear.it","hebrew4christians.com","monitoruldevrancea.ro","objectivebayesian.com","puzzle-shakashaka.com","stream.hownetwork.xyz","americafirstreport.com","digitalcameraworld.com","fullstackeconomics.com","ghostinternational.com","mskmangaz.blogspot.com","puzzle-battleships.com","puzzle-minesweeper.com","puzzle-skyscrapers.com","puzzle-star-battle.com","jailbreakchangelogs.xyz","puzzle-thermometers.com","tips97tech.blogspot.com","www.watermarkremover.io","antiracismnewsletter.com","columbiasportswear.co.uk","construction-physics.com","experimental-history.com","puzzle-jigsaw-sudoku.com","puzzle-killer-sudoku.com","read.perspectiveship.com","engineeringleadership.xyz","newsletter.banklesshq.com","astoryofmasasstruggles.com","blog.codingconfessions.com","informationisbeautiful.net","interestingengineering.com","theintrinsicperspective.com","xn--90afacv0cu2a3cr.xn--p1ai","microsoftsecurityinsights.com","newsletter.eng-leadership.com","noicetranslations.blogspot.com","xn--90afacv0clj6ac0dxa.xn--p1ai","www-devonlive-com.translate.goog","www-insider-co-uk.translate.goog","www-kentlive-news.translate.goog","www-themirror-com.translate.goog","www-essexlive-news.translate.goog","newsletter.maartengrootendorst.com","www-football-london.translate.goog","unchartedterritories.tomaspueyo.com","www-cornwalllive-com.translate.goog","www-glasgowlive-co-uk.translate.goog","www-leeds--live-co-uk.translate.goog","www-liverpoolecho-co-uk.translate.goog","www-lincolnshirelive-co-uk.translate.goog","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
        const hnParts = hn2.split('.');
        if ( hn2.length === 0 ) { return; }
        const hns = [];
        for ( let i = 0; i < hnParts.length; i++ ) {
            hns.push(`${hnParts.slice(i).join('.')}`);
        }
        const ens = [];
        if ( $hasEntities$ ) {
            const n = hnParts.length - 1;
            for ( let i = 0; i < n; i++ ) {
                for ( let j = n; j > i; j-- ) {
                    ens.push(`${hnParts.slice(i,j).join('.')}.*`);
                }
            }
            ens.sort((a, b) => {
                const d = b.length - a.length;
                if ( d !== 0 ) { return d; }
                return a > b ? -1 : 1;
            });
        }
        return { hns, ens, i };
    }).filter(a => a !== undefined);
})();
if ( entries.length === 0 ) { return; }

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
    return i;
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
$scriptletHostnames$.length = 0;

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
