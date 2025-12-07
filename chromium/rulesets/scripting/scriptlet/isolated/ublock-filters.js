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

// ruleset: ublock-filters

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets() {

/******************************************************************************/

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

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
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

function removeNodeText(
    nodeName,
    includes,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'includes', includes || '', ...extraArgs);
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
    // We do not want to recursively create elements
    self.trustedCreateHTML = true;
    let ancestor = self.frameElement;
    while ( ancestor !== null ) {
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
    const docFragment = new DocumentFragment();
    const toRemove = [];
    while ( externalDoc.body.firstChild !== null ) {
        const imported = document.adoptNode(externalDoc.body.firstChild);
        docFragment.appendChild(imported);
        if ( isNaN(duration) ) { continue; }
        toRemove.push(imported);
    }
    if ( docFragment.firstChild === null ) { return; }
    const remove = ( ) => {
        for ( const node of toRemove ) {
            if ( node.parentNode === null ) { continue; }
            node.parentNode.removeChild(node);
        }
        safe.uboLog(logPrefix, 'Node(s) removed');
    };
    const append = ( ) => {
        const parent = document.querySelector(parentSelector);
        if ( parent === null ) { return false; }
        parent.append(docFragment);
        safe.uboLog(logPrefix, 'Node(s) appended');
        if ( toRemove.length === 0 ) { return true; }
        setTimeout(remove, duration);
        return true;
    };
    if ( append() ) { return; }
    const observer = new MutationObserver(( ) => {
        if ( append() === false ) { return; }
        observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
}

function trustedSetAttr(
    selector = '',
    attr = '',
    value = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-set-attr', selector, attr, value);
    setAttrFn(true, logPrefix, selector, attr, value);
}

function setAttrFn(
    trusted = false,
    logPrefix,
    selector = '',
    attr = '',
    value = ''
) {
    if ( selector === '' ) { return; }
    if ( attr === '' ) { return; }

    const safe = safeSelf();
    const copyFrom = trusted === false && /^\[.+\]$/.test(value)
        ? value.slice(1, -1)
        : '';

    const extractValue = elem => copyFrom !== ''
        ? elem.getAttribute(copyFrom) || ''
        : value;

    const applySetAttr = ( ) => {
        let elems;
        try {
            elems = document.querySelectorAll(selector);
        } catch {
            return false;
        }
        for ( const elem of elems ) {
            const before = elem.getAttribute(attr);
            const after = extractValue(elem);
            if ( after === before ) { continue; }
            if ( after !== '' && /^on/i.test(attr) ) {
                if ( attr.toLowerCase() in elem ) { continue; }
            }
            elem.setAttribute(attr, after);
            safe.uboLog(logPrefix, `${attr}="${after}"`);
        }
        return true;
    };

    let observer, timer;
    const onDomChanged = mutations => {
        if ( timer !== undefined ) { return; }
        let shouldWork = false;
        for ( const mutation of mutations ) {
            if ( mutation.addedNodes.length === 0 ) { continue; }
            for ( const node of mutation.addedNodes ) {
                if ( node.nodeType !== 1 ) { continue; }
                shouldWork = true;
                break;
            }
            if ( shouldWork ) { break; }
        }
        if ( shouldWork === false ) { return; }
        timer = self.requestAnimationFrame(( ) => {
            timer = undefined;
            applySetAttr();
        });
    };

    const start = ( ) => {
        if ( applySetAttr() === false ) { return; }
        observer = new MutationObserver(onDomChanged);
        observer.observe(document.body, {
            subtree: true,
            childList: true,
        });
    };
    runAt(( ) => { start(); }, 'idle');
}

function trustedSetLocalStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('local', true, key, value, options);
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

function setAttr(
    selector = '',
    attr = '',
    value = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-attr', selector, attr, value);
    const validValues = [ '', 'false', 'true' ];

    if ( validValues.includes(value.toLowerCase()) === false ) {
        if ( /^\d+$/.test(value) ) {
            const n = parseInt(value, 10);
            if ( n >= 32768 ) { return; }
            value = `${n}`;
        } else if ( /^\[.+\]$/.test(value) === false ) {
            return;
        }
    }

    setAttrFn(false, logPrefix, selector, attr, value);
}

function preventRefresh(
    delay = ''
) {
    if ( typeof delay !== 'string' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-refresh', delay);
    const stop = content => {
        window.stop();
        safe.uboLog(logPrefix, `Prevented "${content}"`);
    };
    const defuse = ( ) => {
        const meta = document.querySelector('meta[http-equiv="refresh" i][content]');
        if ( meta === null ) { return; }
        const content = meta.getAttribute('content') || '';
        const ms = delay === ''
            ? Math.max(parseFloat(content) || 0, 0) * 500
            : 0;
        if ( ms === 0 ) {
            stop(content);
        } else {
            setTimeout(( ) => { stop(content); }, ms);
        }
    };
    self.addEventListener('load', defuse, { capture: true, once: true });
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

function setLocalStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('local', false, key, value, options);
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

function hrefSanitizer(
    selector = '',
    source = ''
) {
    if ( typeof selector !== 'string' ) { return; }
    if ( selector === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('href-sanitizer', selector, source);
    if ( source === '' ) { source = 'text'; }
    const sanitizeCopycats = (href, text) => {
        let elems = [];
        try {
            elems = document.querySelectorAll(`a[href="${href}"`);
        }
        catch {
        }
        for ( const elem of elems ) {
            elem.setAttribute('href', text);
        }
        return elems.length;
    };
    const validateURL = text => {
        if ( typeof text !== 'string' ) { return ''; }
        if ( text === '' ) { return ''; }
        if ( /[\x00-\x20\x7f]/.test(text) ) { return ''; }
        try {
            const url = new URL(text, document.location);
            return url.href;
        } catch {
        }
        return '';
    };
    const extractURL = (elem, source) => {
        if ( /^\[.*\]$/.test(source) ) {
            return elem.getAttribute(source.slice(1,-1).trim()) || '';
        }
        if ( source === 'text' ) {
            return elem.textContent
                .replace(/^[^\x21-\x7e]+/, '')  // remove leading invalid characters
                .replace(/[^\x21-\x7e]+$/, ''); // remove trailing invalid characters
        }
        const steps = source.replace(/(\S)\?/g, '\\1 ?').split(/\s+/);
        const url = urlSkip(elem.href, false, steps);
        if ( url === undefined ) { return; }
        return url.replace(/ /g, '%20');
    };
    const sanitize = ( ) => {
        let elems = [];
        try {
            elems = document.querySelectorAll(selector);
        }
        catch {
            return false;
        }
        for ( const elem of elems ) {
            if ( elem.localName !== 'a' ) { continue; }
            if ( elem.hasAttribute('href') === false ) { continue; }
            const href = elem.getAttribute('href');
            const text = extractURL(elem, source);
            const hrefAfter = validateURL(text);
            if ( hrefAfter === '' ) { continue; }
            if ( hrefAfter === href ) { continue; }
            elem.setAttribute('href', hrefAfter);
            const count = sanitizeCopycats(href, hrefAfter);
            safe.uboLog(logPrefix, `Sanitized ${count+1} links to\n${hrefAfter}`);
        }
        return true;
    };
    let observer, timer;
    const onDomChanged = mutations => {
        if ( timer !== undefined ) { return; }
        let shouldSanitize = false;
        for ( const mutation of mutations ) {
            if ( mutation.addedNodes.length === 0 ) { continue; }
            for ( const node of mutation.addedNodes ) {
                if ( node.nodeType !== 1 ) { continue; }
                shouldSanitize = true;
                break;
            }
            if ( shouldSanitize ) { break; }
        }
        if ( shouldSanitize === false ) { return; }
        timer = safe.onIdle(( ) => {
            timer = undefined;
            sanitize();
        });
    };
    const start = ( ) => {
        if ( sanitize() === false ) { return; }
        observer = new MutationObserver(onDomChanged);
        observer.observe(document.body, {
            subtree: true,
            childList: true,
        });
    };
    runAt(( ) => { start(); }, 'interactive');
}

function urlSkip(url, blocked, steps, directive = {}) {
    try {
        let redirectBlocked = false;
        let urlout = url;
        for ( const step of steps ) {
            const urlin = urlout;
            const c0 = step.charCodeAt(0);
            // Extract from hash
            if ( c0 === 0x23 && step === '#' ) { // #
                const pos = urlin.indexOf('#');
                urlout = pos !== -1 ? urlin.slice(pos+1) : '';
                continue;
            }
            // Extract from URL parameter name at position i
            if ( c0 === 0x26 ) { // &
                const i = (parseInt(step.slice(1)) || 0) - 1;
                if ( i < 0 ) { return; }
                const url = new URL(urlin);
                if ( i >= url.searchParams.size ) { return; }
                const params = Array.from(url.searchParams.keys());
                urlout = decodeURIComponent(params[i]);
                continue;
            }
            // Enforce https
            if ( c0 === 0x2B && step === '+https' ) { // +
                const s = urlin.replace(/^https?:\/\//, '');
                if ( /^[\w-]:\/\//.test(s) ) { return; }
                urlout = `https://${s}`;
                continue;
            }
            // Decode
            if ( c0 === 0x2D ) { // -
                // Base64
                if ( step === '-base64' ) {
                    urlout = self.atob(urlin);
                    continue;
                }
                // Safe Base64
                if ( step === '-safebase64' ) {
                    if ( urlSkip.safeBase64Replacer === undefined ) {
                        urlSkip.safeBase64Map = { '-': '+', '_': '/' };
                        urlSkip.safeBase64Replacer = s => urlSkip.safeBase64Map[s];
                    }
                    urlout = urlin.replace(/[-_]/g, urlSkip.safeBase64Replacer);
                    urlout = self.atob(urlout);
                    continue;
                }
                // URI component
                if ( step === '-uricomponent' ) {
                    urlout = decodeURIComponent(urlin);
                    continue;
                }
                // Enable skip of blocked requests
                if ( step === '-blocked' ) {
                    redirectBlocked = true;
                    continue;
                }
            }
            // Regex extraction from first capture group
            if ( c0 === 0x2F ) { // /
                const re = directive.cache ?? new RegExp(step.slice(1, -1));
                if ( directive.cache === null ) {
                    directive.cache = re;
                }
                const match = re.exec(urlin);
                if ( match === null ) { return; }
                if ( match.length <= 1 ) { return; }
                urlout = match[1];
                continue;
            }
            // Extract from URL parameter
            if ( c0 === 0x3F ) { // ?
                urlout = (new URL(urlin)).searchParams.get(step.slice(1));
                if ( urlout === null ) { return; }
                if ( urlout.includes(' ') ) {
                    urlout = urlout.replace(/ /g, '%20');
                }
                continue;
            }
            // Unknown directive
            return;
        }
        const urlfinal = new URL(urlout);
        if ( urlfinal.protocol !== 'https:' ) {
            if ( urlfinal.protocol !== 'http:' ) { return; }
        }
        if ( blocked && redirectBlocked !== true ) { return; }
        return urlout;
    } catch {
    }
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

function closeWindow(
    arg1 = ''
) {
    if ( typeof arg1 !== 'string' ) { return; }
    const safe = safeSelf();
    let subject = '';
    if ( /^\/.*\/$/.test(arg1) ) {
        subject = window.location.href;
    } else if ( arg1 !== '' ) {
        subject = `${window.location.pathname}${window.location.search}`;
    }
    try {
        const re = safe.patternToRegex(arg1);
        if ( re.test(subject) ) {
            window.close();
        }
    } catch(ex) {
        console.log(ex);
    }
}

function multiup() {
    const handler = ev => {
        const target = ev.target;
        if ( target.matches('button[link]') === false ) { return; }
        const ancestor = target.closest('form');
        if ( ancestor === null ) { return; }
        if ( ancestor !== target.parentElement ) { return; }
        const link = (target.getAttribute('link') || '').trim();
        if ( link === '' ) { return; }
        ev.preventDefault();
        ev.stopPropagation();
        document.location.href = link;
    };
    document.addEventListener('click', handler, { capture: true });
}

function setSessionStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('session', false, key, value, options);
}

function trustedSetCookieReload(name, value, offsetExpiresSec, path, ...args) {
    trustedSetCookie(name, value, offsetExpiresSec, path, 'reload', '1', ...args);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 18 */
[replaceNodeText,removeNodeText,trustedCreateHTML,trustedSetAttr,trustedSetLocalStorageItem,setCookie,setAttr,preventRefresh,removeCookie,setLocalStorageItem,trustedSetCookie,hrefSanitizer,removeClass,trustedClickElement,closeWindow,multiup,setSessionStorageItem,trustedSetCookieReload];

const $scriptletArgs$ = /* 1025 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const t={apply:(t,e,o)=>{const n=o[0];return\"function\"==typeof n&&n.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(t,e,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i","ins.adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4999999999&adk=1777777777&adf=1059123170&pi=t.ma~as.4999999999&w=300&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\"></iframe></div>","20000","ins.adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6644444444&adk=622222222&adf=1800000000&pi=t.ma~as.6644444444&w=311&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=6111111111111&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=7778888888888890&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\"></iframe></div>","ins.adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4999999999&adk=3666666666&adf=1000000000&pi=t.ma~as.4999999999&w=336&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4555555555888&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4222228888888888&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\"></iframe></div>","body","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1777777777&adf=3000000000&lmt=1777777777&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=966666666666&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12222222&ady=-12244444&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","*:not(.main-wrap:has(~ [id^=\"nitro-sidebar\"] .nitro-side) #nitro-top,.main-wrap:has(~ [id^=\"nitro-sidebar\"] .nitro-side) #nitro-body-desktop,[id^=\"nitro-sidebar\"]:has(.nitro-side) ~ #nitro-header-mobile) > ins.adsbygoogle:not(:has(#aswift_0_host))","filled","#text","/広告ブロックはエラーを|Werbeblocker können|Los bloqueadores de anuncios|Les bloqueurs de publicité|I blocchi pubblicitari|Os bloqueadores de/","＿＿＿＿＿＿＿＿＿＿＿","/引き起こす場合があります|Fehler verursachen|pueden causar errores|peuvent provoquer des erreurs|possono causare errori|anúncios podem causar erros/","＿＿＿＿＿＿＿＿＿＿＿＿＿","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","unlock_chapter_guest","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","/document\\.createElement|\\.banner-in/","admbenefits","ref_cookie","/\\badblock\\b/","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/ABDetected|navigator.brave|fetch/","Android/","false/","stay","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","AdbModel","/popup/i","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","window.open","timeLeft = duration","timeLeft = 1","/aclib|break;|zoneNativeSett/","/fetch|popupshow/","justDetectAdblock",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","/\\d{4}/gm","count","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","true","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","(isAdsenseBlocked)","(false)","onDevToolOpen","/#Intent.*?end/","intent","https","firstp","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","3000","getElementById",".onerror","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/popMagic|pop1stp/","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","ai_adb","\"v4ac1eiZr0\"","admiral","'').split(',')[4]","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","html-load.com","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","\"data-sdk\"","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","domain=?eventId=&error=",";confirm(","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","_cpv","pingUrl","ads","_ADX_","dataLayer","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/window.open.*/gms","window.open(url, \"_self\");}","/window\\.location\\.href.*?;/","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","style","text-decoration","/break;case|FingerprintJS/","push","(isAdblock)","get-link",".ybtn.get-link[target=\"_blank\"]","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64",".btn-success.get-link[target=\"_blank\"]","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","__adblocker","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","charCodeAt","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","localStorage","popunder","adbl","/protect?","disabled","a#redirect-btn","head","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","reload","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","= getSetTimeout()","= function newTimeout(func, timer) {func()}","ab","IFRAME","BODY","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","const ad_slot_","(()=>{window.addEventListener(\"load\",(()=>{document.querySelectorAll(\"ins.adsbygoogle\").forEach((element=>element.dataset.adsbygoogleStatus=\"done\"))}))})();const ad_slot_","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","window.googletag.pubads","'hidden'","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","/getComputedStyle|overlay/","in_d4","hanime.tv","p","/videoAssetId.+introSplashVideo.+renderStoresWidgetsPendingList/s",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","offsetHeight","student_id",".offsetLeft","banner:","nobanner:","AdBlockChecker","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 812 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13,14;2,15,16,14;2,17,18,14;2,19,20,14;3,21,22,23;3,24,22,25;0,26,27,28;0,26,29,30;0,0,31,32;0,0,33;0,0,34,35;1,0,36;1,0,37;1,0,38,39,40;0,0,41,42;4,43,44,45,46,47,48,49,50,51,52,53;5,54,4;0,0,55,56;6,57,58,59;7;0,0,60,61;0,0,62,63,64,65;5,66,4;8,67;9,67,68;0,0,69,70;1,0,71;10,72,73,74,73,75,76;0,0,77,78;1,0,79;0,0,80,81;1,0,38;1,0,82;1,0,83;1,0,84;1,0,85;1,0,86;5,87,4;1,0,88;5,89,90;5,91,4;1,0,92;0,0,93,94;0,0,95,96;8,97;1,0,98;1,0,99;1,0,100;11,101,102;1,0,103;0,0,104,73,64,105;1,0,106;1,0,107;1,0,108;8,109;1,0,110;1,0,111;0,0,112;1,0,113;1,0,114;0,0,115,116;0,0,117;0,0,118,119;0,0,120,121;1,0,122;0,0,123,124;1,0,125;5,126,4;5,127,4;5,128,4;1,0,129;1,0,130;9,131,68;0,0,132,133,64,134;0,0,135,136;0,0,137,138;1,0,139;1,0,140;0,0,141,142,143,4;0,0,144,78;0,0,145,146;1,0,147;1,0,148;0,0,149,146,64,150;0,0,151,73,64,152;0,0,153,4,64,154;0,0,155,156;12,157;1,0,158;1,0,159;0,0,160,161;0,0,162,163;10,164,165;0,0,166,74,64,167;0,0,168,146,64,167;1,0,169;0,0,170,171,3,172;1,0,173;1,0,174;0,0,175;0,0,176,78;0,0,177,73,64,178;1,0,179;1,0,180;1,0,181;0,0,182,183;1,0,184;1,0,185;5,186,4;1,0,187;1,0,188;1,0,189;1,0,190;0,0,191,192;1,0,193;1,0,194;1,0,195;0,0,196,73,64,197;0,0,198,199;5,200,4;0,0,201,202;1,0,203;0,0,204,146,64,205;0,0,206,207,64,205;0,0,208,209;0,0,210,211;0,0,212,213;1,0,214;0,0,215,216;0,0,217,78;0,0,42,133,64,218;0,0,219,220;0,0,221,78;1,0,222;1,0,223;0,0,224,225,226,227;0,0,228,229;1,0,230;0,0,231;0,0,232,233;1,0,234;0,0,235,78;0,0,236,237;1,0,238;1,0,239;0,0,240,146,64,241;1,0,242;1,0,243;1,0,244;1,0,245;1,0,246;1,0,247;1,0,248;1,0,249;0,0,250,251;1,0,252;1,0,253;1,0,254;0,0,255,256;1,0,257;1,0,258;1,0,259;0,0,260;1,0,261;1,0,262;1,0,263;1,0,264;1,0,265;1,0,266;1,0,267;1,0,268;1,0,269;1,0,270;1,0,271;1,0,272;0,0,273,274,3,4;0,0,275,276;0,0,277,278;0,0,279,280;0,0,277,281;0,0,277,282;0,0,283,284,3,4;0,0,285,286,3,4;0,0,287,288,64,289;1,0,290;1,0,289;1,0,291;1,0,292;1,0,293;1,0,294;1,0,295;1,0,296;1,0,297;1,0,298;1,0,299;1,0,300;1,0,301;1,0,302;1,0,303;1,0,304;0,0,305,306,64,307;0,0,308,309;0,0,310,311;13,312,73,313;1,0,314;1,0,315;1,0,316;1,0,317;1,0,318;1,0,319;1,0,320;1,0,321;1,0,322;0,0,323,324;1,0,325;0,0,326,327,3,4;0,0,328,329;5,330,172;0,0,331,332,64,333;0,0,334,335;0,0,336,337,3,4;0,0,338;0,0,339,340;1,0,341;1,0,342;0,0,343,344;12,345;1,0,346;5,347,4;0,0,348;1,0,349;9,350,220;1,0,351;1,0,352;1,0,353;10,354,355,73,73,75,356;1,0,357;8,273;0,0,358,359;0,0,360;0,0,361,309,64,362;8,363;9,363,68;5,364,4;1,365,366;1,0,367;1,0,368;0,0,369,229;12,370,371,143;1,0,372;11,373,374;12,370,375,143;0,365,376,377;12,378,379,143;12,380,381,143;5,382,4;12,383;8,384;1,0,385;12,386,387,143;1,0,388;1,0,389;1,0,390;0,0,391,392;12,393,394;12,393,395;1,0,396;1,0,397;1,0,398;5,397,4;14,399;12,400,401;2,402,403;1,0,404;0,0,405,406,64,407;1,0,408;8;1,0,409;5,410,4;1,0,411;1,0,412;5,413,90;1,0,414;1,0,415;1,0,416;1,0,417;8,418;9,418,68;6,419,58,420;5,186,421,73,422,4;10,423,424;0,365,425,426,64,427;1,0,428;1,0,429;1,0,430;1,0,431;1,0,432;12,433;0,0,434,435;12,436,437;9,438,220;11,439,440;1,0,441;8,442;5,443,4;5,444,220;1,0,445;1,365,446;12,447,73,143;1,0,448;15;1,0,144,64,114;1,0,449;1,0,450;1,0,451;0,0,452,453;1,0,454;1,0,455;8,456;1,0,457;1,0,458;1,26,459;1,26,460;1,26,461;1,26,462;1,26,463;1,26,464;1,26,465;1,0,466;1,26,467;0,0,468;13,469;1,0,470;0,0,471,472,3,4;0,0,473,78;13,474;0,0,475,476,64,477;11,478,479;11,480,440;1,0,481;1,0,482;1,0,483;1,0,484;1,0,485;1,0,486;1,0,487;1,0,488;1,0,489;5,490,4;1,0,491;1,0,492;1,0,493;1,0,494;0,0,495,496,64,497;9,498,172;0,0,499,73,64,500;6,501,58,502;1,0,503;1,0,504;1,0,505;11,506,440;0,0,507,508,64,509;5,510,4,73,422,4;1,0,511;1,0,512;1,0,513;1,0,514;1,0,515;1,0,516;1,0,517;1,0,518;1,0,519;0,0,520,521;8,522;0,0,523,524;1,0,525;1,0,526;1,0,527;1,0,528;0,0,529,229;0,530,531;1,0,532;1,0,533;1,0,534;0,0,535,536;1,0,537;7,538;9,539,220;1,0,540;1,0,541;1,0,542;1,0,543;1,0,544;0,0,545,546;13,547;12,548,549;1,0,550;13,551;1,0,552;0,0,553,554;0,0,555,556;1,0,557;1,0,558;0,0,559,560;0,0,561,562;0,0,563,229;5,564,4;5,565,4;1,0,566;5,567,220,73,422,4;0,0,397,73,64,397,143,4;8,568;0,0,569,309;0,0,570,229;1,0,571;0,0,572,573,3,4;1,0,574;1,0,575;1,0,576;1,0,577;5,578,4;1,0,579;5,580,4;1,0,581;5,582,4;10,583,584;1,0,585;0,0,586,587;1,0,588;1,0,589;1,0,590;1,0,591;16,592,68;6,593,58,594;5,397,90;1,0,595;1,0,596;0,0,597,220;0,0,598,309;1,0,599;0,0,600,73,64,557;1,0,601;1,0,602;16,603,220;0,0,604,605;0,0,606,607;5,608,4;5,609,4;1,0,610;0,0,611,612;9,613,68;0,0,614,615;5,616,4,73,422,4;0,0,617;1,618,619;0,0,620,78;1,0,621;5,622,4,73,422,4;0,0,623,73,64,624;0,0,625,626;1,0,627;1,0,628;16,629,220;1,0,630;1,0,631;9,632,78;1,0,633;0,0,634,635,64,636;1,0,637;1,0,638;1,0,639;0,0,640,641,3,4;5,642,4;1,0,643;10,644,165;1,0,645;1,0,646;0,0,277,647,3,4;1,0,648;0,0,649,650,3,4;1,0,651;0,0,652;0,0,653,654;1,0,655;1,0,656;1,0,657;1,0,658;0,365,659,660;0,0,661,662;1,0,663;5,664,4;1,0,665;9,666,220;1,0,667;0,0,668,669;5,670,4;1,0,671;0,0,7,672;1,0,673;1,0,674;3,675,676,677;1,0,678;12,679,680;1,0,681;10,682,4,73,73,75,683;0,0,397,684;1,0,685;13,686,73,687;1,0,688;8,689;1,0,690;1,0,691;1,0,692;10,693,694;1,0,695;1,0,696;1,0,697;0,0,698,220;1,0,699;1,0,700;0,0,701,702,3,4;9,703,68;1,0,704;0,0,705,706;0,0,707;1,0,708;17,709,709;1,0,710;12,711,73,143;5,712,4;8,713;1,0,384;16,714,715;1,0,716;0,0,717,718;1,0,719;0,0,720;1,0,721;1,0,722;1,0,723;1,0,724;1,0,725;8,726;10,727,220,73,73,422,4;1,0,728;1,0,729;1,0,730;5,731,220;1,0,732;1,0,733;1,0,734;0,0,735,73;5,736,220;5,737,220;1,0,738;1,0,739;1,0,197;0,0,740;9,741,4;4,742,165;1,0,743;1,0,744;1,0,745;10,746,747;2,19,748;1,0,749;1,0,40;0,0,750,751;0,0,277,752,3,4;0,0,753,754,3,4;0,0,755,756;1,0,757;1,0,758;1,0,759;5,760,4;5,761,4,73,422,4;11,762,374;1,0,763;0,0,764,765;0,0,224,766;0,0,767,768;0,0,769;1,0,770;1,0,771;0,0,772,773;1,0,774;1,0,775;1,0,776;1,0,777;1,0,778;1,0,779;1,26,780;1,0,781;1,0,782;1,0,783;9,784,68;1,0,785;0,0,786,787;1,0,788;6,789,790,4;1,0,791;1,0,792;1,0,793;1,0,794;9,795,68;9,796,68;9,797,68;9,798,68;9,799,68;9,800,68;11,801,440;8,802,803,804;9,805,68;11,806,440;11,807,808;9,809,68;11,810,811;11,812,813;11,814,440;11,815,816;11,817,818;11,819,102;11,820,816;11,821,440;11,822,818;11,823,824;11,825,440;11,826,440;11,827,816;11,828,829;11,830,440;11,831,440;11,832,818;11,833,834;11,835,440;11,836,837;11,838,839;11,840,440;11,841,102;11,842,440;11,843,844;11,845,846;11,847,848;11,849,850;11,851,852;11,853,818;11,854,440;11,855,856;11,857,440;11,858,859;11,860,861;11,862,440;11,863,864;11,865,866;11,867,868;11,869,440;11,870,871;11,872,440;11,873,440;8,874;8,875;8,876;8,877,803,804;8,878;8,879;8,880,803,804;8,881;10,880,73,74;5,882,421;5,883,421;8,884;8,885;8,886;8,887,803,804;8,888,803,804;9,889,68;16,890,68;8,891;9,892,68;8,893,803,804;10,893,74,73,73,75,894;8,895,803,804;10,896,73,74,73,75,897;8,898;8,899,803,804;9,900,68;16,901,68;8,902,803,804;8,903;9,904,68;8,905;9,906,68;8,907,803,804;8,908;8,909;8,910,803,804;9,911,68;16,912,68;8,913,803,804;8,914,803,804;9,915,68;8,916;8,917,803,804;9,918,68;8,919,803,804;8,920,803,804;9,921,68;16,921,68;8,922;8,923;9,923,68;9,924,68;9,925,68;10,926,73,74,73,75,927;10,928,73,74,73,75,927;9,929,68;8,930,803,804;9,931,68;9,932,68;8,933;8,934;8,935,803,804;9,936,68;8,937,803,804;9,938,68;9,939,68;9,940,68;8,941,803,804;8,942;8,943,803,804;8,944;9,945,68;8,946;8,947,803,804;8,948,803,804;10,949,73,74,73,75,950;10,949,73,74,73,75,951;9,952,68;8,953,803,804;9,954,68;9,955,68;10,956,73,74,73,75,957;10,958,73,74,73,75,957;10,959,73,74,73,75,957;10,960,73,74,73,75,961;9,962,68;9,963,68;8,964;9,965,68;9,966,68;9,967,68;8,968,803,804;9,969,68;8,970,803,804;9,971,68;8,972,803,804;9,973,68;8,974,803,804;9,975,68;9,976,68;8,977;9,978,68;11,979,829;11,980,829;11,981,829;11,982,829;11,983,829;11,984,829;11,985,829;11,986,829;11,987,829;11,988,829;11,989,440;1,0,990;8,991;8,992;16,993,78;11,994,995;8,996;11,997,440;10,896,73,74,73,75,998;8,999;9,1000,68;8,1001;10,1002,1003,73,73,75,1004;10,1005,73,74,73,75,1004;10,1006,73,74,73,75,1004;10,1002,1003,73,73,75,1007;10,1005,73,74,73,75,1007;10,1006,73,74,73,75,1007;8,1008;8,1009;1,0,1010;8,1011;9,1012,68;8,1013;9,1014,68;16,1015,68;9,1016,68;9,1017,68;8,1018;16,1019,68;8,1020,803,804;11,1021,440;1,0,1022,64,1023;1,0,1024";

const $scriptletArglistRefs$ = /* 3846 */ "165;165;157;42;157;21,449;610,611,612,613,614,615;157;37,157;157;392;180;265;191,610,611,612,613,614,615;205;780,781;157,466;165,205;37;37;5;157;191,610,611,612,613,614,615;170;191;180;165;167;58;40,157,167;180,195;201;157;78;157;117;191,610,611,612,613,614,615;165;42;35;41;37,157;312;193;165;191;191;191,610,611,612,613,614,615;165;180;157;191,610,611,612,613,614,615;36;191,610,611,612,613,614,615;153;157;210;191;205;157;167;275;94;165;167;67,153;165;157;157;190;610,611,612,613,614,615;67,153;180;338;167;157;472;101;157;157;191,610,611,612,613,614,615;157;665;671;555;606;157;396;37;479;626;165;730;157,230;157;191,610,611,612,613,614,615;191,610,611,612,613,614,615;191,610,611,612,613,614,615;157;2;165;165;165;153,191,202,610,611,612,613,614,615;180,200;245;180;165,362;742,743;455;165;191;608;153;191;4,619,671;263;191,610,611,612,613,614,615;157;421;109;651,652;157;811;165,205;554;53;37;37;180;147;279;157;392;165;153;765;191;191,610,611,612,613,614,615;157;461;461;733;190;171;157;157;157;191;210;191;191;165;696,697;365;191,610,611,612,613,614,615;180;155;534;725;157;191,610,611,612,613,614,615;622;169;191;159;596;698;157;157;191;157;27;157,165;157;157;191;169;157;157;708;157;479;157;157;157;271;69,153;157;157,230;157;159;610,611,612,613,614,615;157;180;581;53,157;291;191,610,611,612,613,614,615;165;157;157;37,53,165;191;47;53,157,165;157;157;157;180;191,610,611,612,613,614,615;191;177,180;729;37;157,169;244;157;157;157;157;557;557;157;454;191;210;741,743;157;157;165;157;157,165,168;157;165;210;157,169;610,611,612,613,614,615;157;191;157;157;426;195,610,611,612,613,614,615;191,610,611,612,613,614,615;157;191,610,611,612,613,614,615;104,105;548;307;626;626;157;157;157;678;320;157,165;122,157;665;167;392;210;109;205;205;157;157;191,610,611,612,613,614,615;205;205;157;205;200;157,165;88,157;383;165;165;157;157;102;109;212;626;5;165;157;157;165;442;165;127;191,610,611,612,613,614,615;173;157;157;88;241;610,611,612,613,614,615;191;510;157;711,712,713;165;368;157;157;51;719,720,721;732;157,165;176;191,610,611,612,613,614,615;157;180,249;191,610,611,612,613,614,615;532;371;191;157;157;157;161;31;418,419;157;37,53;180;250;678;610,611,612,613,614,615;210;169;610,611,612,613,614,615;191,610,611,612,613,614,615;610,611,612,613,614,615;190,610,611,612,613,614,615;782;153;435;157;157;191,610,611,612,613,614,615;37,157;157;157;595;59,180;191;191;610,611,612,613,614,615;532;543;37;157,169;157;37;37;157;157;785;191,610,611,612,613,614,615;773;774;775;610,611,612,613,614,615;210;165;44;157;102;157;157;191;157;340;102;102;131,132,133;82;157;157;213;782;157;415,416,417;111;392;309;167;157;157;311;118;221;625,651,652,653,655,656;153;590;122;169,375;157,230;102;191;79,80;157,165;157;157,275,354;157;102;102;157;157;157;191,610,611,612,613,614,615;37,165;205;157;157;102;805;543;144,145,146;102;102;153;103;177;191,610,611,612,613,614,615;425;502;275;-245;141;266;415,416,417;627;157;157;610,611,612,613,614,615;165;157;157;82;651,652,653;321,322;157;157;157;37;157;191,610,611,612,613,614,615;157;88;157;165;267;272;210;128,129;165;157;274;73,74,75;165;157;157,161;205;191;157;167;157;191;119;165;509;215;102;102;256;165;157,165;365;567;157;113;191;157;179;157;193;543;239;210;111;165;665;109;205;191,610,611,612,613,614,615;67,153;157;499;110;635,636,685,686;131,132,133;199,202;169;191;102;332;118;375;594;65;804;237,238;157;127;674;564,565;165;55;157;175;507;191,610,611,612,613,614,615;210;375;165;157;409;485;157;459;221;118,401,402;165;165;157;65;180;157;763,764;165;153;157;626;415,416,417;191,610,611,612,613,614,615;167;710;79,80;165;335;165;549;165;157;180;319;165;157;191,610,611,612,613,614,615;165;157;157;191;751;651,652;157;210;382;157;157;220;183,610,611,612,613,614,615;610,611,612,613,614,615;610,611,612,613,614,615;191,610,611,612,613,614,615;191,610,611,612,613,614,615;157;157;157;157;88;191,610,611,612,613,614,615;191,610,611,612,613,614,615;191,610,611,612,613,614,615;127;160;157,176;131,132,133;161;157;88;157;165;726;726;157;95,96,97,98;65;157;212;165;22;353;563;157;191;53;415,416,417;543;191,610,611,612,613,614,615;165;88;157;157;57;208;180;366;316;63,316;771;110;167;610,611,612,613,614,615;169;191;326;191;198,199;153;538;157;476;180;276;88;165;33;165;57;180;191,610,611,612,613,614,615;121;37;157;157;191,610,611,612,613,614,615;210;254;631;157,165;88;88;2;88,113;210;157;157;167;157;157;610,611,612,613,614,615;157;22;381;157;165;180;809;165;191,610,611,612,613,614,615;191;191;508;200;191;64;157,169;157,165;157;157;113;157;157;173;118;180;221;157;40;284;39;70;37;157,230;157,230;106;157;157;79,80;51;157,466;169;111;111;180;165;277;190,610,611,612,613,614,615;191,610,611,612,613,614,615;436;165;400;157;157;180;157;195,610,611,612,613,614,615;169,273;157;157;102;37;88;157;626;157;205;157,165;191,610,611,612,613,614,615;191,610,611,612,613,614,615;205;180;191;22;143;197;165;157;180;429,430;157;384;415,416,417;415,416,417;415,416,417;415,416,417;157;157;210;157;626;282;191,610,611,612,613,614,615;157;157;191,610,611,612,613,614,615;165;485;157;165,167;165;191,610,611,612,613,614,615;191,610,611,612,613,614,615;148,149;395;23;493,806,807;524;88;122;76;37;245;157;157;191,610,611,612,613,614,615;180,202;157;37;157;165;157;122;191,610,611,612,613,614,615;200;355;180;255;176;191;157;157;157;610,611,612,613,614,615;173;111,317;180;180;157;607;53;103;157;279;180,690,691,692;153;782;39;527;157;782;157;105;191,610,611,612,613,614,615;165;191,610,611,612,613,614,615;109;157;157,165,466;191,610,611,612,613,614,615;102;157;769;180;157;258;157;191;157;111,113;157;88;610,611,612,613,614,615,663;180;191,610,611,612,613,614,615;157;190,191,610,611,612,613,614,615;205;157;573;191,610,611,612,613,614,615;543;403;157;808;157;165;242;45,46;782;231;157;191;157;159,169,569;167;165;157;208;37;37;572;610,611,612,613,614,615;157;157;157;191;190;157;521;191;157;539;755;431;191,610,611,612,613,614,615;157;157;53,157;543;793,794,795;165;37;571;157;191,610,611,612,613,614,615;115;142;157;157;210;161;157;210;210;610,611,612,613,614,615;217;247,248;109;193;157;195,610,611,612,613,614,615;811;579;88;157;191,610,611,612,613,614,615;76;191,610,611,612,613,614,615;210;191,610,611,612,613,614,615;180;157;157;191;155;731;157;157;157;375;627;157;375;191;161;323;191;191,610,611,612,613,614,615;350;782;157;157;165;274;157;644;88;88;157;111;37;157;165;167;157;157;157,169;165;437;157;157;316;191,610,611,612,613,614,615;543;157;625,651,652,655,656;157;157;496;610,611,612,613,614,615;180;326;37;157;511;157;157;157;39;14,15,16,17;157;165;157;191;157;19,20,172;157;228;191,610,611,612,613,614,615;180,668;375;191,610,611,612,613,614,615;180;157;180;157;157;157;157;707;165;157;627;514;165;165;651,652;191,610,611,612,613,614,615;259,260;157;191;157;157;5;114;144,145;169;169;157;157;118;157;169,545;157;191,610,611,612,613,614,615;110;165;157;157;157;448;157;111;111;157;191;157;157;191;180;165;157;157,169;157;543;169;473;157;603;37;157,165;157,167;60;191;68;157;610,611,612,613,614,615;285,286;191;153,154;665;399;110;43;5;157;37,167,469;155;600;633;157;191,610,611,612,613,614,615;157;37,53;-38;157;150;165;156;157;375;191,610,611,612,613,614,615;394;59,180,191,649;165;157;165;157;325;157;37;193;374;610,611,612,613,614,615;543;180;375;592;353;157;485;297,298,299,300,301;161,577;-245;422;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;547;462,463;165;-38;157;191,610,611,612,613,614,615;191,610,611,612,613,614,615;167;157;191,610,611,612,613,614,615;157;37,165;273;157;684;157;157,543;157;180;180;157;191,610,611,612,613,614,615;191;157;157;157,230;102;165;375;111,113;270;144,145;180;157;120;191,610,611,612,613,614,615;157;191;610,611,612,613,614,615;371;157;157;25;610,611,612,613,614,615;157;113;57;180;157;283;543;782;610,611,612,613,614,615;543;718;191;191,610,611,612,613,614,615;191,610,611,612,613,614,615;-38,-544,-812;410;584;115;165;111;165;543;157;109;375;180;180;155;157;59,180,200;165;157;450,451;167;191,610,611,612,613,614,615;157;205;601;77;180;543;134,135,136;205;55;540;391;610,611,612,613,614,615;83;157;157;650;375;157;182,610,611,612,613,614,615;191,610,611,612,613,614,615;127;202;109;88;669,670;314;157;501;279;37;221;157,165;165;157;157;165;165;165;157;191;273;393;157;221;155;191;532;157;191,610,611,612,613,614,615;191;497;191;25;165;626;191,610,611,612,613,614,615;62;180;347;191,610,611,612,613,614,615;491;165;375;210;157;157;320;37;157;89,90,91,92;110;157;157;761,762;369;543;412,413;157;375;39;191,610,611,612,613,614,615;191,610,611,612,613,614,615;157;157;57,157;373;191;157;157;157;344;157;210;157;191,610,611,612,613,614,615;585;570;157,165;370;246;157;191,610,611,612,613,614,615;191,610,611,612,613,614,615;157,169;88;25,157;157;191;529;616;157;556;191,610,611,612,613,614,615;157;288;107;426;157;627;157;111,113;180;191,610,611,612,613,614,615;28;157;88;157;786,787,788;610,611,612,613,614,615;157;165;180;568;460;191;191;157;191;167;165;165;157;157;165;766;165;759,760;81;191,610,611,612,613,614,615;53;191,610,611,612,613,614,615;191,198,199;191;157;191,610,611,612,613,614,615;157;470;191,610,611,612,613,614,615;157;25;191,610,611,612,613,614,615;157;165;180;734;191,192;652;157;32;338;180;278;165;210;157;157;338;157;627;627;157;157;375;191,610,611,612,613,614,615;191,610,611,612,613,614,615;610,611,612,613,614,615;157;84,85,86;594;157;198,199;191,610,611,612,613,614,615;165;180;486;165;532;532;532;191;606;180;191,610,611,612,613,614,615;157;157;157;180,651;157,678;180;102;191,610,611,612,613,614,615;88;405;83;627;153;375;180;518;308;165;662;191;208;169;157;157;546;157,169,230,473;108;157;180;191,610,611,612,613,614,615;159;159;157,169,230,473;358;110;191;389;318;714;797;118;668,753,754;582;157;177;157;157;191;738;394;400;400;400;165;165;177;157;173;157;190;111,157;252;157;191;157;191;39;415,416,417;191,610,611,612,613,614,615;82;157;169;165;157;157,165,466;165;191;678;191;602;155;191,610,611,612,613,614,615;157;605;159;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;627;627;157;627;294;157;326;191,610,611,612,613,614,615;157;50;165;157;165;157;165;157;180,181;157;37;157;695;54;543;180;608;157;157,230;157;112;157;157;210;445;157;51;88;191,414;88;303;256;191;191;180;191,202,610,611,612,613,614,615;157;522;610,611,612,613,614,615;279;191;167;157;305;180;157;180;317;606;103;782;161;113;676;306;180;717;157;474;88;157;225,226;543;191;180,552;110;606;191,610,611,612,613,614,615;446;195,610,611,612,613,614,615;191,610,611,612,613,614,615;180;53,165;315;357;103,157;157;415,416,417;668;155;157;37;191,610,611,612,613,614,615;103;665;114;157,165;782;157;701,702,703;191;191,610,611,612,613,614,615;157;450;450;205;88;157;433;161;543;767;88;372;139;392;157;161;610,611,612,613,614,615;191,610,611,612,613,614,615;526;165;37;153;157;255;210;157;566;610,611,612,613,614,615;157;157;530;157;269;157;157;375;492;157;543;262;607;152;157;157;588;191;195,610,611,612,613,614,615;191,610,611,612,613,614,615;431;498;157;191,610,611,612,613,614,615;191,202;110;191,610,611,612,613,614,615;165;608;210;214;210;39;157;290;157;188,610,611,612,613,614,615;157;790,791,792;191;274;180;165;180;191,610,611,612,613,614,615;747,748,749;302;191;157;157;210;157;329;95,96,97,98;193;191,610,611,612,613,614,615;648;492;346;191,610,611,612,613,614,615;191,610,611,612,613,614,615;191,610,611,612,613,614,615;157;191,610,611,612,613,614,615;191,610,611,612,613,614,615;189,610,611,612,613,614,615;161;113;118;165;191,610,611,612,613,614,615;665;782;193;88;191,610,611,612,613,614,615;766;191,610,611,612,613,614,615;180;591;627;103;157;157;157;180;88;39,88;671,673;167;157;157;37;568;746;652;180;610,611,612,613,614,615;157;587;38,153;157;157;157;157;157;620,621;165;157;157;157;157;180;202;665;378,379;157;334;22;22;772;191,610,611,612,613,614,615;157,230;153;191,610,611,612,613,614,615;157;364;180;165;173;157;191;191;687;157;627;551;157;157;443,444;191,610,611,612,613,614,615;111;157;158;157;157;783;320;578;164;164;157,504;157;157;157;157;157;119;782;194,610,611,612,613,614,615;779;191,610,611,612,613,614,615;180;157;6,7,8,9,10,11,12,13;191;178;37,469;102;191;191;513;304;191,610,611,612,613,614,615;37,251;191;533;155;157;157;157;191,610,611,612,613,614,615;191;191,610,611,612,613,614,615;165;167;218;157,161;157;157;157;157;157;190;165;161;211;727,728;157,169;157;127;157;157;180;5;157;157,169;157;200;157,169,627;191;157;165;610,611,612,613,614,615;157;624;169;169;169;627;627;157;473;65,157;165;519;37;704;157;598;165;157,230;606;88;588;653;323;652;200;155;177;157;180;782;177;157;447;157;167;157;349;400;400;157;208;88;161;103;88;191;155;400;400;157;191,610,611,612,613,614,615;165;157;111,157;415,416,417;169,273;339;173;157;37;165;165;155;157;715,716;782;233,234;784;157;191,610,611,612,613,614,615;157;671,672;37;167;191;190;155;157;191;543;180,689;157;566;210;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;415,416,417;627;157;157;627;157;811;157;191;157;481;740;23;191;191;191;732;157;159;191,610,611,612,613,614,615;543;191,610,611,612,613,614,615;111;165;736,737;88,108;157,169;268;157;157;167;157;157;114;48,49;157;114;88;25,289;210;157;191;153;191,709;543;103;543;191;606;178;191,610,611,612,613,614,615;159;155;157,167;53,165;191;606;287;210;37,53,543;157;37,53;543;157;157;157;157;460;782;782;155;180;191,610,611,612,613,614,615;25;782;782;292,293;292,293;155;157;191;157;195,610,611,612,613,614,615;34;190,610,611,612,613,614,615;191;191;180;632;37,251;37,53,157,165,251;342;208;157;157;37;191;37;165;157;157,169;180;221;25,483,484;95,96,97,98;191;157;331;191;157;110;157;88;157;167;169;138;415,416,417;157;486;59;118;157;480;157;495;157,230;114;543;221;180;37;610,611,612,613,614,615;157,169;131,132,133;89,90,91,92;221;157,165;157;157;210;163;157;39;39;165;165;157,165;157;770;157,165;83;157;191;218;130;625,651,652,655,656,660;82;109;521;195,610,611,612,613,614,615;191,610,611,612,613,614,615;157;191,610,611,612,613,614,615;208;169;159;56;610,611,612,613,614,615;466;157,420;191,610,611,612,613,614,615;543;157;522;166;191,610,611,612,613,614,615;195,610,611,612,613,614,615;648;694;81;796;255;180;229;157,167;187;516;153;39;128,129;722,723,724;162;165;593;173;140;157;157;111;157;39;191,610,611,612,613,614,615;157;193;180;191,610,611,612,613,614,615;375;165;415,416,417;752;157;341;157;191,610,611,612,613,614,615;180,688;83;157;191,610,611,612,613,614,615;191,610,611,612,613,614,615;665;606;628,629,630;157,261;782;191;427;180;157;782;627;627;227;406;157;778;157;191;157;191;37;207;157;155;157;404;157;543;776;157;157;157;466,469;782;191,202;448;606;542;157;157;157;180;157;88;169;157;110;25;157;180;782;599;165;678;157;324;782;155;169;88;39;191;203;597;157;645,646;200;157;157,165;157;180;294;661,757,758;165;191;67;466;157;191;586;157;169;191;157;157;157;173;165;83;180;588;88;477;610,611,612,613,614,615;191;155;180;177;157;159;65;665;352;88;111;308;157;180;157;165;606;157;782;782;157;157;782;157;157;191;53;53,165;180;110;191;157;157;157;191;191,610,611,612,613,614,615;157;165,273;627;157;191;83;779;24;37;191,610,611,612,613,614,615;161;157;165;512;157;157;415,416,417;415,416,417;415,416,417;415,416,417;169;482;209;157;65;77,169;81;157;180;165,375;191,610,611,612,613,614,615;37;191;113;157;375;165;191,610,611,612,613,614,615;113;191,610,611,612,613,614,615;180;88;37;167;88;157;191;679,683;180;180;53;53;53;157;169;157;37;157;191;37;235;191;83;103;768;157;200,679;190,610,611,612,613,614,615;157;210;606;358;191;782;782;693;191;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;224;37;157;153;114;191;180;157;184,610,611,612,613,614,615;180;589;342;165;111;438,665;191;157;176;432;191,610,611,612,613,614,615;500;157;25,483,484;134,135,136;93;191,202;191,610,611,612,613,614,615;180;157;180;627;240;543;191,610,611,612,613,614,615;191,610,611,612,613,614,615;5;351;191;191,610,611,612,613,614,615;190;191;153;157;191,610,611,612,613,614,615;210;165;157;580;153;121;261;157;666,667,678;210;157;157;191;157;191;157;191;336;469;157;37;157;83;191,610,611,612,613,614,615;157;411;191,610,611,612,613,614,615;585;216;191,610,611,612,613,614,615;782;191,610,611,612,613,614,615;330;79,80;191,610,611,612,613,614,615;375;165;363;157;782;706;155;627;191,610,611,612,613,614,615;191,610,611,612,613,614,615;37;196,610,611,612,613,614,615;782;180;65;588;191;159;37;206;157;157;113;313;543;157;782;191;195,610,611,612,613,614,615;169;191;157,165;165;157;375;782;191,610,611,612,613,614,615;448;180;191,610,611,612,613,614,615;103;627;627;525;157;157;165;191,610,611,612,613,614,615;157;180;125,126;157;782;157;384;191;157;384;37,53,543;329;103;157;448;610,611,612,613,614,615;327;37;191;37;532;191,610,611,612,613,614,615;82,173;492;37,157;438,665;157;157,159;391;191;191,610,611,612,613,614,615;610,611,612,613,614,615;180;37;801;191,610,611,612,613,614,615;191,610,611,612,613,614,615;157;441;610,611,612,613,614,615;37;53,157,165,230;180;191;157;210;82;157,230;157,230;157;157;407;157;296;782;157;782;157;190;37;37;176;471;337;606;157;208;110;191;157;157;404;53;191;191,610,611,612,613,614,615;157;191,610,611,612,613,614,615;566;157;320;627;155;153;191;191;782;82;375;157;543;155;789,-794,-795,-796;0,1;157;627;157;191,610,611,612,613,614,615;157,230;157,230;157;157;191;157,520;157;37,165;222,223;165;627;111;157;273;191,610,611,612,613,614,615;191,610,611,612,613,614,615;202;782;739;193;610,611,612,613,614,615;157;157;210;191;153;157;675;191;53;380;543;543;543;114;191;191;52;782;782;157;384;37;609;157;157;664;376;118;157;782;342;384;157;176;118;139;155;610,611,612,613,614,615;191,610,611,612,613,614,615;157;191,610,611,612,613,614,615;157;157;221;627;83;157;157;610,611,612,613,614,615;83;157;157;257;114;295;110;176;191;76;221;157;204;173;191;191,610,611,612,613,614,615;191;110;191,610,611,612,613,614,615;87;610,611,612,613,614,615;165;180;37,157;348;157;543;157,169;191,610,611,612,613,614,615;191;375;263;180;191,610,611,612,613,614,615;191,610,611,612,613,614,615;610,611,612,613,614,615;157;367;180;180;191;180;155;191,610,611,612,613,614,615;169;119;180;191,610,611,612,613,614,615;193;157;157;467,468;180;157;118;165;165,375;180;155;627;83;191,610,611,612,613,614,615;191,610,611,612,613,614,615;180;108;191;261;157;157;191,610,611,612,613,614,615;782;651,652;625,651,652;191;574;191;66;375;543;478;191;155;191,610,611,612,613,614,615;191,610,611,612,613,614,615;782;528;176;110;294;180;157;157;159;744,745;165;165;191,610,611,612,613,614,615;275;652,658,659;186,191,610,611,612,613,614,615;375;167;375;157;191;191;543;165;167;157;157;543;517;157,230;157;191,610,611,612,613,614,615;782;191,610,611,612,613,614,615;343;165,230;180;89,90,91,92;102;610,611,612,613,614,615;88;180;191,610,611,612,613,614,615;111;180;151;558,559;180;625,634,651,652,653;157;39;390;157;157;208;528;29,30;173,174;157;159;114;165;233,234;627;157;469;191,610,611,612,613,614,615;191,610,611,612,613,614,615;610,611,612,613,614,615;191,610,611,612,613,614,615;264;415,416,417;180;627;543;157;157,230;157;782;191;273,440;766;114;191;116;88;161;155;161;157;157;176;735;191;180;157;494;180;490;37;191,610,611,612,613,614,615;782;191,202,610,611,612,613,614,615;191;469;610,611,612,613,614,615;37;102;782;782;137;191;191;157;157;575;125,126;119;610,611,612,613,614,615;37;157;798,799,800;531;157;114;356;750;606;190;240;157;423;165;180;180;191,610,611,612,613,614,615;157;191;157;165;221;119;157;157;200;157;167;116;165,487,488;487,488;487,488;83;52;180;180,191;190,610,611,612,613,614,615;191;121;191,610,611,612,613,614,615;315;191,610,611,612,613,614,615;157;157;191;157;377;180;37,469;157;505;165;176;191;157;155;191,610,611,612,613,614,615;618;193,610,611,612,613,614,615;180;191,202;157;157;180;191,610,611,612,613,614,615;198;191;191;651;157;191;191,610,611,612,613,614,615;53,165;610,611,612,613,614,615;535;191,610,611,612,613,614,615;191,610,611,612,613,614,615;326;157;66;157;159;782;782;89,90,91,92;191;543;157;37;155;37;157;155;157;157;114;190;388;157;165;157;782;37,53,543;157;610,611,612,613,614,615;191,202;543;191,610,611,612,613,614,615;157,230;83;191;219;543;110;157;157,165,230;469;157;157;543;157;167;651;191;111;191,610,611,612,613,614,615;180;375;177;157;180,191;131,132,133;610,611,612,613,614,615;177;434;782;782;157;191;157;102;180;191;157;177;114;64;39;385;428;561;153;165;375;177;165;191;191;157;789,-791,-792,-793;180;157;191;606;606;157,230;180;243;360,361;230;191;180;155;157;157;157;77;464;191;457,458;190,191;544;541;157;157;53;191;679;700;191;782;191;180;253;543;180;88;191,610,611,612,613,614,615;651;191;680,681,682;157;342;191;465;93;608;604;191;118;384;191;607;157;191;157;165;52;782;386;88,108;157;180;157;236;114;642,643;195;191;191,610,611,612,613,614,615;191,610,611,612,613,614,615;610,611,612,613,614,615;180;191,610,611,612,613,614,615;114;191,193,610,611,612,613,614,615;5;195,610,611,612,613,614,615;157;782;782;562;191;191;180;157;191;52;782;191,610,611,612,613,614,615;157;191;39;66;37;157;452,453;167;782;25;191,610,611,612,613,614,615;191,610,611,612,613,614,615;240;191;114;375;543;180;157;637,638;543;157,230;111;165,169,230;553;157;25;155;157;177;191;155;102;782;165;165;157;576;261;193;315;61;230,473;627;88;654;191;157;123,124;232,640,641,655,656,766;155;157,230;82;191,610,611,612,613,614,615;180;191;26;157;180;65;333;369;157;88;89,90,91,92;89,90,91,92;157;53;157;191;191,610,611,612,613,614,615;191;157,466;424;180;110;647;359;191;157;18,515;191;157;157;610,611,612,613,614,615;782;180;88;153;191,610,611,612,613,614,615;456;489,490;185,610,611,612,613,614,615;180;191,610,611,612,613,614,615;114;623;191;756;193;72;610,611,612,613,614,615;397;101;191,610,611,612,613,614,615;191,610,611,612,613,614,615;114;180;623;191,610,611,612,613,614,615;99,100;191;191,610,611,612,613,614,615;782;665;191;191;191;191,610,611,612,613,614,615;52;782;165;157;155;114;610,611,612,613,614,615;191;560;155;157;157;782;777;191,610,611,612,613,614,615;191,610,611,612,613,614,615;665;157;180;475;39;37,157;310;191,610,611,612,613,614,615;543;180;543;157,230;543;387;165;157,230,810;191;157;155;782;157;191;518;165;176;157;83;157;157;191,610,611,612,613,614,615;114;180;177;627;111;180;617,652;191;102;194,610,611,612,613,614,615;782;191;191;25;157;191,610,611,612,613,614,615;155;180,705;157;165;191,200;88;39;110;37;465;191;111;191,202;191,610,611,612,613,614,615;665;523;608;157;652,660;782;82;114;180;550;79,80;110;110;157;191;155;191,610,611,612,613,614,615;191,610,611,612,613,614,615;190,191;506;191;191;191;191;157;191,610,611,612,613,614,615;191,610,611,612,613,614,615;782;163;651,652,699;157;408;191,610,611,612,613,614,615;191;65;195,610,611,612,613,614,615;191;191;543;180;665;102;165,167,280,281;157;114;157;191,610,611,612,613,614,615;165;191;177;191;25;155;177;655,656;543;114;375;157;157;177;177;191;157;782;180;155;782;180;113;191,610,611,612,613,614,615;111;157;388;165;71;279;180;173;191;680,681,682;782;191;375;155;782;157;543;157;782;782;543;398;439;157;165,230;89,90,91,92;155;155;782;782;191,610,611,612,613,614,615;177;782;191;93;155;157;782;37;157;543;572;157;190,191,610,611,612,613,614,615;665;157;191;369;155;677;606;191;79,80;157;610,611,612,613,614,615;165;157;191;539;191;110;420;157;782;191;191,610,611,612,613,614,615;157;3,503;155;157;66;157;782;655,656;131,132,133;155;543;191,610,611,612,613,614,615;157;157;180;191;157;782;610,611,612,613,614,615;657;155;157;191,610,611,612,613,614,615;157;157,345;536,537,802,803;113;191;180;173;152;163;606;782;157;157,230;89,90,91,92;177;191;165;191;782;782;191,610,611,612,613,614,615;161;155;608;249;191;191;157;157;191;66;180;782;191;180;606;191,610,611,612,613,614,615;155;191;606;165;157;583;114;180;191;639;191;191;155;66;191;782;180;191,610,611,612,613,614,615;157;176;782;155;25;157;191,610,611,612,613,614,615;110;157;543;157;177;157;177;111;159,169;180;191,610,611,612,613,614,615;191;191,610,611,612,613,614,615;157;567;157;328;157;110;180;191,610,611,612,613,614,615;180;191;157;157;180;173;157;165";

const $scriptletHostnames$ = /* 3846 */ ["s.to","ak.sv","g3g.*","hqq.*","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","im9.eu","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","oko.sh","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moin.de","movi.pk","mrt.com","msn.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","xfile.*","15min.lt","2embed.*","4game.ru","7mmtv.sx","9xflix.*","a5oc.com","adria.gg","alpin.de","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cety.app","cnet.com","devlib.*","dlhd.*>>","dooood.*","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","file.org","findav.*","fir3.net","flixhq.*","focus.de","gala.com","game8.jp","golog.jp","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","redis.io","rintor.*","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xcloud.*","xvip.lat","yabai.si","ytstv.me","zooqle.*","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","24sata.hr","3minx.com","4game.com","4stream.*","5movies.*","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","alc.co.jp","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","beeg.porn","bigwarp.*","blkom.com","bokep.top","camhub.cc","casi3.xyz","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cutty.app","d000d.com","d0o0d.com","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","exego.app","expres.cz","fap18.net","faqwiki.*","faselhd.*","fc2db.com","file4go.*","finfang.*","fiuxy2.co","fmovies.*","fooak.com","forsal.pl","ftuapps.*","garota.cf","gayfor.us","ghior.com","globo.com","gloria.hr","grapee.jp","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","igfap.com","imgur.com","imihu.net","innal.top","inxxx.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kickass.*","kissjav.*","knowt.com","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mynet.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","nhlbox.me","nlegs.com","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","raider.io","remaxhd.*","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","rokni.xyz","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seory.xyz","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","stfly.biz","strmup.to","strtape.*","swgop.com","tbs.co.jp","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","tutele.sx","ucptt.com","upzur.com","usi32.com","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vogue.com","voodc.com","vplink.in","waezg.xyz","waezm.xyz","watson.de","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xcloud.eu","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","4porn4.com","555fap.com","5ghindi.in","720pflix.*","7starhd.my","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","appnee.com","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","bmamag.com","boyfuck.me","btvplus.bg","bunshun.jp","buzter.xyz","c-span.org","cashurl.in","cboard.net","cdn256.xyz","cgtips.org","cnpics.org","crewus.net","crictime.*","ctpost.com","cutnet.net","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","drweil.com","dshytb.com","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","exambd.net","f1stream.*","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fzmovies.*","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","love4u.net","m.4khd.com","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","motor1.com","movies4u.*","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","otakomu.jp","ovabee.com","paid4.link","paypal.com","pctfenix.*","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prmovies.*","proxybit.*","pxxbay.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streamta.*","suaurl.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thumb8.net","thumb9.net","tiscali.cz","tnmusic.in","top1iq.com","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zpaste.net","11xmovies.*","123movies.*","2monkeys.jp","373news.com","3dsfree.org","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","aipebel.com","airevue.net","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","atravan.net","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bg-mania.jp","bi-girl.net","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bolighub.dk","bowfile.com","btcbitco.in","caitlin.top","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","crx7601.com","cuervotv.me","cults3d.com","cutlink.net","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","downvod.com","dropgame.jp","ds2play.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","embedpk.net","emuenzen.de","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnjplay.xyz","fntimes.com","fsharetv.cc","fullymaza.*","g-porno.com","gamewith.jp","gbatemp.net","get-to.link","ghbrisk.com","gigafile.nu","gocast2.com","godlike.com","goodcar.com","govtech.com","grasoku.com","gupload.xyz","hhkungfu.tv","hiphopa.net","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","in91vip.win","itopmusic.*","jav-noni.cc","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","jawapos.com","jelonka.com","jetpunk.com","jixo.online","jjang0u.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","kaliscan.io","karanpc.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","koltry.life","laposte.net","letocard.fr","lexpress.fr","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","mirrorace.*","misterio.ro","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","nodo313.net","nontonx.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","peeplink.in","pelisplus.*","phim12h.com","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","rule34.club","sadisflix.*","safetxt.net","samax63.lol","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharing.wtf","shavetape.*","shinbhu.net","shinchu.net","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.su","streamhub.*","strikeout.*","subdivx.com","syosetu.com","t-online.de","tabooflix.*","tbsradio.jp","teachoo.com","techguy.org","teltarif.de","thehour.com","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","tryigit.dev","tube188.com","tumanga.net","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","xcloud.host","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","yesmovies.*","youtube.com","yumeost.net","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","46matome.net","4archive.org","720pstream.*","723qrh1p.fun","7hitmovies.*","aamulehti.fi","adricami.com","alexsports.*","alexsportz.*","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animanch.com","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","autoc-one.jp","avseesee.com","avsforum.com","bamgosu.site","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepnya.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","capoplay.net","carparts.com","catfish1.com","cesoirtv.com","chaos2ch.com","chatango.com","choralia.net","clickapi.net","coingraph.us","crazyblog.in","crewbase.net","cricstream.*","cricwatch.io","cuevana3.fan","cutyurls.com","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","divicast.com","divxtotal1.*","dizikral.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","edukaroo.com","egyanime.com","ekasiwap.com","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","exe-urls.com","expertvn.com","factable.com","falatron.com","fapptime.com","feed2all.org","fetchpik.com","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focus4ca.com","footybite.to","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gulflive.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","huntress.com","ibelieve.com","ihdstreams.*","imagefap.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","jablickar.cz","jav-coco.com","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jp-films.com","kasiporn.com","kazefuri.net","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","learnmany.in","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","luluvdoo.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masslive.com","matacoco.com","mediaite.com","mega-mkv.com","mhdtvworld.*","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkvcinemas.*","mmamania.com","mmsbee42.com","modrinth.com","modsbase.com","modsfire.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","myflixerz.to","mykitsch.com","nanolinks.in","nbadraft.net","neodrive.xyz","netatama.net","newatlas.com","newsyou.info","neymartv.net","niketalk.com","noni-jav.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","pennlive.com","photopea.com","playertv.net","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","pressian.com","pubfilmz.com","publicearn.*","rainmail.xyz","rapelust.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","ronaldo7.pro","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","ryaktive.com","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","sidereel.com","sinonimos.de","slashdot.org","snlookup.com","sonixgvn.net","spatsify.com","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","tapepops.com","tchatche.com","techawaaz.in","techdico.com","teleclub.xyz","teluguflix.*","terra.com.br","thehindu.com","themezon.net","theverge.com","toonhub4u.me","topdrama.net","topspeed.com","torrage.info","torrents.vip","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","tusfiles.com","tutlehd4.com","tutsnode.org","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","ultraten.net","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","vi-music.app","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","volokit2.com","vpcxz19p.xyz","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xopenload.me","xopenload.pw","xpornium.net","xxxstream.me","youpouch.com","youswear.com","yunjiema.top","zakzak.co.jp","zerocoin.top","zootube1.com","zvision.link","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","1bitspace.com","247sports.com","4horlover.com","4kwebplay.xyz","560pmovie.com","680thefan.com","6hiidude.gold","7fractals.icu","abc17news.com","abhijith.page","actusports.eu","adblocktape.*","aeblender.com","aiimgvlog.fun","alexsportss.*","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","bacasitus.com","badmouth1.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","bestfonts.pro","bethcakes.com","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buffstreams.*","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","cefirates.com","chanto.jp.net","cheater.ninja","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","columbian.com","concomber.com","coolcast2.com","cricstream.me","cruciverba.it","crypto4yu.com","ctinsider.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","daveockop.com","dayspedia.com","depvailon.com","dizikral1.pro","dizikral2.pro","dooodster.com","downfile.site","dphunters.mom","dragontea.ink","drivenime.com","e2link.link>>","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","etoland.co.kr","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","flixhouse.com","flyfaucet.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","gifu-np.co.jp","giornalone.it","globalrph.com","governing.com","gputrends.net","grantorrent.*","gundamlog.com","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","honkailab.com","hornylips.com","hoyoverse.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","indiewire.com","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itunesfre.com","javsunday.com","jimdofree.com","jisakuhibi.jp","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","kamababa.desi","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","kurashiru.com","lifehacker.jp","likemanga.ink","listar-mc.net","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lowellsun.com","m.inven.co.kr","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","motor-talk.de","moutogami.com","moviekhhd.biz","moviepilot.de","moviesverse.*","movieswbb.com","moviezwaphd.*","mp4upload.com","multicanais.*","musescore.com","myflixertv.to","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","overclock.net","ozlosleep.com","pagalworld.cc","pandamovie.in","pc-builds.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","phineypet.com","picdollar.com","pillowcase.su","pinkueiga.net","pirateiro.com","pitchfork.com","pkbiosfix.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","rarethief.com","raskakcija.lt","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rnbxclusive.*","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","s3embtaku.pro","saboroso.blog","savefiles.com","scatkings.com","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","silverblog.tv","silverpic.com","simana.online","sinsitio.site","skymovieshd.*","smartworld.it","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","speedporn.net","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","starstyle.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","swissotel.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","tapmyback.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","thekitchn.com","thelayoff.com","thepoke.co.uk","thethings.com","thothub.today","tiermaker.com","timescall.com","timesnews.net","tlnovelas.net","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","vibestreams.*","vid-guard.com","vidspeeds.com","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","xcamcovid.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zorroplay.xyz","123movieshub.*","300cforums.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","9to5google.com","actugaming.net","acuraworld.com","aerotrader.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcryptoz.net","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","androidacy.com","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","artoffocas.com","ashemaletube.*","balkanteka.net","bhugolinfo.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buchstaben.com","camberlion.com","cheatsheet.com","choco0202.work","cine-calidad.*","clashdaily.com","clicknupload.*","cloudvideotv.*","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","cuevana3hd.com","cumception.com","curseforge.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dofusports.xyz","dolldivine.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","expatforum.com","extreme-down.*","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","filmizleplus.*","filmy4waps.org","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","fordescape.org","forex-trnd.com","formyanime.com","forumchat.club","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","galleryxh.site","gamepcfull.com","gameshop4u.com","gameskinny.com","gayforfans.com","gaypornhot.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gravureblog.tv","gujjukhabar.in","gyanitheme.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hotgranny.live","hotukdeals.com","hwnaturkya.com","iisfvirtual.in","imgtraffic.com","indiatimes.com","infogenyus.top","inshorturl.com","insidehook.com","instanders.app","ios.codevn.net","iplayerhls.com","iplocation.net","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jizzbunker.com","joemonster.org","joyousplay.xyz","jpopsingles.eu","jyoseisama.com","kakarotfoot.ru","kantotflix.net","katoikos.world","kickassanime.*","kijolariat.net","kompasiana.com","letterboxd.com","lifehacker.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","mactechnews.de","mahajobwala.in","mahitimanch.in","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","marcialhub.xyz","mastkhabre.com","megapastes.com","meusanimes.net","midebalonu.net","mkv-pastes.com","monacomatin.mc","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mumuplayer.com","mundowuxia.com","my.irancell.ir","myeasymusic.ir","nana-press.com","naszemiasto.pl","nayisahara.com","newmovierulz.*","news-buzz1.com","news30over.com","nhregister.com","nookgaming.com","nowinstock.net","o2tvseries.com","ocregister.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","pandamovies.me","pandamovies.pw","pandaspor.live","paste-drop.com","pastemytxt.com","pelando.com.br","pencarian.link","petitrobert.fr","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playtube.co.za","populist.press","pornhd720p.com","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","projeihale.com","proxyninja.org","qiqitvx84.shop","quest4play.xyz","record-bee.com","reisefrage.net","remixsearch.es","resourceya.com","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","singjupost.com","sizecharts.net","skidrowcpy.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speisekarte.de","spieletipps.de","sportsurge.net","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","superhonda.com","supexfeeds.com","swatchseries.*","swipebreed.net","swordalada.org","tamilprinthd.*","tea-coffee.net","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","topcryptoz.net","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","tracktheta.com","trannyteca.com","trentonian.com","troyrecord.com","tvs-widget.com","tvseries.video","twincities.com","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vahantoday.com","videocelts.com","vikistream.com","visifilmai.org","viveseries.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wikifilmia.com","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xclusivejams.*","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yourupload.com","zeroupload.com","51bonusrummy.in","adrinolinks.com","adz7short.space","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","allthetests.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","areaconnect.com","arstechnica.com","audiotools.blog","audioz.download","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxingstream.me","brilian-news.id","budgetbytes.com","buffstreams.app","bussyhunter.com","can-amforum.com","careersides.com","cempakajaya.com","chollometro.com","cizgivedizi.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","cryptoearns.com","cycletrader.com","dailybreeze.com","dailycamera.com","diariovasco.com","diychatroom.com","dizipal1057.com","dizipal1058.com","dizipal1059.com","dizipal1060.com","dizipal1061.com","dizipal1062.com","dizipal1063.com","dizipal1064.com","dizipal1065.com","dizipal1066.com","dizipal1067.com","dizipal1068.com","dizipal1069.com","dizipal1070.com","dizipal1071.com","dizipal1072.com","dizipal1073.com","dizipal1074.com","dizipal1075.com","dizipal1076.com","dizipal1077.com","dizipal1078.com","dizipal1079.com","dizipal1080.com","dizipal1081.com","dizipal1082.com","dizipal1083.com","dizipal1084.com","dizipal1085.com","dizipal1086.com","dizipal1087.com","dizipal1088.com","dizipal1089.com","dizipal1090.com","dizipal1091.com","dizipal1092.com","dizipal1093.com","dizipal1094.com","dizipal1095.com","dizipal1096.com","dizipal1097.com","dizipal1098.com","dizipal1099.com","dizipal1100.com","dizipal1101.com","dizipal1102.com","dizipal1103.com","dizipal1104.com","dizipal1105.com","dizipal1106.com","dizipal1107.com","dizipal1108.com","dizipal1109.com","dizipal1110.com","dizipal1111.com","dizipal1112.com","dizipal1113.com","dizipal1114.com","dizipal1115.com","dizipal1116.com","dizipal1117.com","dizipal1118.com","dizipal1119.com","dizipal1120.com","dizipal1121.com","dizipal1122.com","dizipal1123.com","dizipal1124.com","dizipal1125.com","dizipal1126.com","dizipal1127.com","dizipal1128.com","dizipal1129.com","dizipal1130.com","dizipal1131.com","dizipal1132.com","dizipal1133.com","dizipal1134.com","dizipal1135.com","dizipal1136.com","dizipal1137.com","dizipal1138.com","dizipal1139.com","dizipal1140.com","dizipal1141.com","dizipal1142.com","dizipal1143.com","dizipal1144.com","dizipal1145.com","dizipal1146.com","dizipal1147.com","dizipal1148.com","dizipal1149.com","dizipal1150.com","dizipal1151.com","dizipal1152.com","dizipal1153.com","dizipal1154.com","dizipal1155.com","dizipal1156.com","dizipal1157.com","dizipal1158.com","dizipal1159.com","dizipal1160.com","dizipal1161.com","dizipal1162.com","dizipal1163.com","dizipal1164.com","dizipal1165.com","dizipal1166.com","dizipal1167.com","dizipal1168.com","dizipal1169.com","dizipal1170.com","dizipal1171.com","dizipal1172.com","dizipal1173.com","dizipal1174.com","dizipal1175.com","dizipal1176.com","dizipal1177.com","dizipal1178.com","dizipal1179.com","dizipal1180.com","dizipal1181.com","dizipal1182.com","dizipal1183.com","dizipal1184.com","dizipal1185.com","dizipal1186.com","dizipal1187.com","dizipal1188.com","dizipal1189.com","dizipal1190.com","dizipal1191.com","dizipal1192.com","dizipal1193.com","dizipal1194.com","dizipal1195.com","dizipal1196.com","dizipal1197.com","dizipal1198.com","dizipal1199.com","dizipal1200.com","dizipal1201.com","dizipal1202.com","dizipal1203.com","dizipal1204.com","dizipal1205.com","dizipal1206.com","dizipal1207.com","dizipal1208.com","dizipal1209.com","dizipal1210.com","dizipal1211.com","dizipal1212.com","dizipal1213.com","dizipal1214.com","dizipal1215.com","dizipal1216.com","dizipal1217.com","dizipal1218.com","dizipal1219.com","dizipal1220.com","dizipal1221.com","dizipal1222.com","dizipal1223.com","dizipal1224.com","dizipal1225.com","dizipal1226.com","dizipal1227.com","dizipal1228.com","dizipal1229.com","dizipal1230.com","dizipal1231.com","dizipal1232.com","dizipal1233.com","dizipal1234.com","dizipal1235.com","dizipal1236.com","dizipal1237.com","dizipal1238.com","dizipal1239.com","dizipal1240.com","dizipal1241.com","dizipal1242.com","dizipal1243.com","dizipal1244.com","dizipal1245.com","dizipal1246.com","dizipal1247.com","dizipal1248.com","dizipal1249.com","dizipal1250.com","dizipal1251.com","dizipal1252.com","dizipal1253.com","dizipal1254.com","dizipal1255.com","dizipal1256.com","dizipal1257.com","dizipal1258.com","dizipal1259.com","dizipal1260.com","dizipal1261.com","dizipal1262.com","dizipal1263.com","dizipal1264.com","dizipal1265.com","dizipal1266.com","dizipal1267.com","dizipal1268.com","dizipal1269.com","dizipal1270.com","dizipal1271.com","dizipal1272.com","dizipal1273.com","dizipal1274.com","dizipal1275.com","dizipal1276.com","dizipal1277.com","dizipal1278.com","dizipal1279.com","dizipal1280.com","dizipal1281.com","dizipal1282.com","dizipal1283.com","dizipal1284.com","dizipal1285.com","dizipal1286.com","dizipal1287.com","dizipal1288.com","dizipal1289.com","dizipal1290.com","dizipal1291.com","dizipal1292.com","dizipal1293.com","dizipal1294.com","dizipal1295.com","dizipal1296.com","dizipal1297.com","dizipal1298.com","dizipal1299.com","dizipal1300.com","dizipal1301.com","dizipal1302.com","dizipal1303.com","dizipal1304.com","dizipal1305.com","dizipal1306.com","dizipal1307.com","dizipal1308.com","dizipal1309.com","dizipal1310.com","dizipal1311.com","dizipal1312.com","dizipal1313.com","dizipal1314.com","dizipal1315.com","dizipal1316.com","dizipal1317.com","dizipal1318.com","dizipal1319.com","dizipal1320.com","dizipal1321.com","dizipal1322.com","dizipal1323.com","dizipal1324.com","dizipal1325.com","dizipal1326.com","dizipal1327.com","dizipal1328.com","dizipal1329.com","dizipal1330.com","dizipal1331.com","dizipal1332.com","dizipal1333.com","dizipal1334.com","dizipal1335.com","dizipal1336.com","dizipal1337.com","dizipal1338.com","dizipal1339.com","dizipal1340.com","dizipal1341.com","dizipal1342.com","dizipal1343.com","dizipal1344.com","dizipal1345.com","dizipal1346.com","dizipal1347.com","dizipal1348.com","dizipal1349.com","dizipal1350.com","dl-protect.link","doctormalay.com","donnerwetter.de","dopomininfo.com","dreamchance.net","ebaumsworld.com","ebookhunter.net","economist.co.kr","egoallstars.com","elamigosweb.com","empire-stream.*","esportivos.site","exactpay.online","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fmradiofree.com","footyhunter.lol","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gazetaprawna.pl","gentosha-go.com","geogridgame.com","gewinnspiele.tv","girlscanner.org","girlsreport.net","gofile.download","gowatchseries.*","gratispaste.com","greatandhra.com","gut-erklaert.de","hamrojaagir.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hotcopper.co.nz","idoitmyself.xyz","ilovetoplay.xyz","infosgj.free.fr","istreameast.app","japangaysex.com","jkssbalerts.com","jumpsokuhou.com","khatrimazaful.*","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","kurashinista.jp","lamarledger.com","ldoceonline.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lordchannel.com","lulustream.live","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","matomeblade.com","matomelotte.com","mediacast.click","mentalfloss.com","mercurynews.com","miamiherald.com","miniwebtool.com","mobilestalk.net","modernhoney.com","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","myanimelist.net","nativesurge.net","naughtypiss.com","news-herald.com","news.zerkalo.io","niice-woker.com","noindexscan.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nuxhallas.click","nydailynews.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","phillyvoice.com","phongroblox.com","picsxxxporn.com","pilotonline.com","piratehaven.xyz","pisshamster.com","popdaily.com.tw","projectfreetv.*","punishworld.com","qatarstreams.me","rank1-media.com","readbitcoin.org","readhunters.xyz","remixsearch.net","reportera.co.kr","resizer.myct.jp","rnbastreams.com","robloxforum.com","rugbystreams.me","rustorkacom.lib","saikyo-jump.com","sampledrive.org","sat-sharing.com","seir-sanduk.com","sfchronicle.com","shadowrangers.*","shemalegape.net","showcamrips.com","sipandfeast.com","ske48matome.net","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","streamnoads.com","stylecaster.com","sudokutable.com","suicidepics.com","sweetie-fox.com","tackledsoul.com","tapeantiads.com","tapeblocker.com","tennisstreams.*","theblueclit.com","thebullspen.com","themoviesflix.*","theporndude.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","truthsocial.com","trybawaryjny.pl","tuktukcinma.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","uwakitaiken.com","valhallas.click","vipsister23.com","viralharami.com","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","zakuzaku911.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","asyaanimeleri.pw","backfirstwo.site","bananamovies.org","batmanfactor.com","bestgirlsexy.com","bestpornflix.com","blog.esuteru.com","blog.livedoor.jp","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","buzzfeednews.com","canalesportivo.*","charexempire.com","chinese-pics.com","choosingchia.com","clever-tanken.de","clickndownload.*","clickorlando.com","coloradofans.com","coloredmanga.com","comidacaseira.me","courseleader.net","cr7-soccer.store","cracksports.me>>","cryptofactss.com","culinaryhill.com","culturequizz.com","cybercityhelp.in","dailyfreeman.com","dailytribune.com","dailyuploads.net","darknessporn.com","dartsstreams.com","dataunlocker.com","detikkebumen.com","directupload.net","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","eastbaytimes.com","empire-streamz.*","familyporner.com","favoyeurtube.net","filecatchers.com","filespayouts.com","financacerta.com","flagandcross.com","flatpanelshd.com","football-2ch.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","funkeypagali.com","gamesrepacks.com","gaydelicious.com","genialetricks.de","getviralreach.in","giurgiuveanul.ro","gledajcrtace.xyz","go.gets4link.com","godstoryinfo.com","gourmetscans.net","gsm-solution.com","hallofseries.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hotcopper.com.au","howsweeteats.com","husseinezzat.com","ikarishintou.com","imagereviser.com","infinityfree.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","justfullporn.net","kakarotfoot.ru>>","khatrimazafull.*","kijolifehack.com","kimscravings.com","kingstreamz.site","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","mathplayzone.com","meconomynews.com","megapornpics.com","millionscast.com","moneycontrol.com","mostlymorgan.com","moviesmod.com.pl","mrproblogger.com","mydownloadtube.*","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newedutopics.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nocrumbsleft.net","o2tvseries4u.com","ojearnovelas.com","onionstream.live","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","plainchicken.com","player.buffed.de","powerover.online","powerover.site>>","pricearchive.org","programme-tv.net","protrumpnews.com","puzzlegarage.com","raetsel-hilfe.de","readingeagle.com","rebajagratis.com","repack-games.com","ripexbooster.xyz","rocketnews24.com","rollingstone.com","rsoccerlink.site","rule34hentai.net","saradahentai.com","shutterstock.com","skidrowcodex.net","smartermuver.com","solitairehut.com","south-park-tv.fr","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","statecollege.com","stellanspice.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","techkhulasha.com","telcoinfo.online","text-compare.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","thefitbrit.co.uk","theflowspace.com","thegadgetking.in","thelinuxcode.com","thenerdstash.com","tomshardware.com","topvideosgay.com","total-sportek.to","trainerscity.com","trendytalker.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","valeriabelen.com","veryfreeporn.com","vichitrainfo.com","voiranime.stream","voyeurfrance.net","watchfreexxx.net","watchmmafull.com","weblivehdplay.ru","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","xhamsterporno.mx","yourcountdown.to","youwatchporn.com","ziggogratis.site","4chanarchives.com","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","andhrafriends.com","androidpolice.com","armypowerinfo.com","atlasandboots.com","auto-crypto.click","basketballbuzz.ca","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","blizzboygames.net","blog.tangwudi.com","buildtheearth.net","cadryskitchen.com","cagesideseats.com","camchickscaps.com","cdn.tiesraides.lv","chaptercheats.com","cinemastervip.com","claplivehdplay.ru","cocokara-next.com","coloradodaily.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cool-style.com.tw","crackstreamer.net","cryptednews.space","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","deepgoretube.site","deutschepornos.me","ditjesendatjes.nl","dl.apkmoddone.com","drinkspartner.com","economictimes.com","euro2024direct.ru","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","filmesonlinex.org","fitnesssguide.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","funtasticlife.com","fwmadebycarli.com","gamejksokuhou.com","gamesmountain.com","gardeningsoul.com","gaypornhdfree.com","globalstreams.xyz","hdfilmcehennemi.*","headlinerpost.com","hentaitube.online","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","innateblogger.com","intouchweekly.com","iphoneincanada.ca","islamicfinder.org","jaysbrickblog.com","kbconlinegame.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lighterlegend.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","marineinsight.com","mdzsmutpcvykb.net","miaminewtimes.com","midhudsonnews.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","multicanaistv.com","musicfeeds.com.au","nationaltoday.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","okusama-kijyo.com","olympicstreams.co","ondemandkorea.com","opensubtitles.org","outdoormatome.com","paranormal-ch.com","pcgeeks-games.com","pinayscandalz.com","player.pcgames.de","plugintorrent.com","pornoenspanish.es","pressandguide.com","presstelegram.com","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","read-onepiece.net","reidoscanais.life","republicbrief.com","restlessouter.net","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","savemoneyinfo.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","sideplusleaks.net","siliconvalley.com","soccerworldcup.me","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","starxinvestor.com","steamidfinder.com","steamseries88.com","stellarthread.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","substitutefor.com","sumaburayasan.com","superherohype.com","supertipzz.online","tablelifeblog.com","thaihotmodels.com","thecelticblog.com","thecubexguide.com","thefreebieguy.com","thegamescabin.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","tightsexteens.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tokusatsuindo.com","toyotaklub.org.pl","tradingfact4u.com","truyen-hentai.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","umatechnology.org","unsere-helden.com","viralitytoday.com","visualnewshub.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","atlasstudiousa.com","authenticateme.xyz","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","blackporncrazy.com","blog-peliculas.com","bluemediastorage.*","browneyedbaker.com","businessinsider.de","businessinsider.jp","calculatorsoup.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","codingnepalweb.com","cr7-soccer.store>>","crooksandliars.com","descargaspcpro.net","digital-thread.com","dogfoodadvisor.com","downshiftology.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","fjlaboratories.com","flacdownloader.com","footballchannel.jp","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","future-fortune.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","germancarforum.com","greeleytribune.com","haveibeenpwned.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hopepaste.download","hyundaitucson.info","insurancesfact.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","kijyomatome-ch.com","laleggepertutti.it","leckerschmecker.me","lifeinleggings.com","listentotaxman.com","makeincomeinfo.com","maketecheasier.com","marinetraffic.live","mediaindonesia.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","moviesonlinefree.*","mrmakeithappen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","nlab.itmedia.co.jp","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","pancakerecipes.com","panel.play.hosting","player.gamezone.de","playoffsstream.com","pornfetishbdsm.com","porno-baguette.com","readcomiconline.li","reporterherald.com","ricettafitness.com","samsungmagazine.eu","shuraba-matome.com","siamblockchain.com","skyscrapercity.com","softwaredetail.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","steamcommunity.com","stream.nflbox.me>>","strtapeadblocker.*","talkforfitness.com","tapeadsenjoyer.com","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","thefashionspot.com","thefirearmblog.com","thepolitistick.com","tiktokrealtime.com","times-standard.com","torrentdosfilmes.*","travelplanspro.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","100percentfedup.com","adblockstreamtape.*","adrino1.bonloan.xyz","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","asumsikedaishop.com","barcablaugranes.com","bchtechnologies.com","betweenjpandkr.blog","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dk.pcpartpicker.com","download.megaup.net","driveteslacanada.ca","dvdfullestrenos.com","embed.wcostream.com","equipmenttrader.com","estrenosdoramas.net","filmesonlinexhd.biz","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","franceprefecture.fr","frustfrei-lernen.de","girlsvip-matome.com","hdfilmcehennemi2.cx","historicaerials.com","hometownstation.com","honeygirlsworld.com","honyaku-channel.net","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","kenzo-flowertag.com","kitimama-matome.net","kreuzwortraetsel.de","learnmarketinfo.com","lifeandstylemag.com","lite.duckduckgo.com","logicieleducatif.fr","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","mendocinobeacon.com","middletownpress.com","minimalistbaker.com","movie-locations.com","mykoreankitchen.com","nandemo-uketori.com","negyzetmeterarak.hu","orlandosentinel.com","paidshitforfree.com","pendidikandasar.net","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","pressenterprise.com","promodescuentos.com","radio-australia.org","radio-osterreich.at","registercitizen.com","rojadirectaenvivo.*","royalmailchat.co.uk","secondhandsongs.com","shoot-yalla-tv.live","skidrowreloaded.com","smartkhabrinews.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","streamadblockplus.*","streamshunters.eu>>","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","thecookierookie.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thewatchseries.live","truyentranhfull.net","turkishseriestv.org","viewmyknowledge.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","adultdvdparadise.com","advertisingexcel.com","allthingsthrifty.com","androidauthority.com","awellstyledlife.comm","blackwoodacademy.org","bleepingcomputer.com","brushnewstribune.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","crackstreamshd.click","dailynewshungary.com","dailytruthreport.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gametechreviewer.com","gesundheitsfrage.net","heartlife-matome.com","houstonchronicle.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jljbacktoclassic.com","journal-advocate.com","keedabankingnews.com","laweducationinfo.com","lehighvalleylive.com","letemsvetemapplem.eu","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda3revolution.com","meilleurpronostic.fr","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","mt-soft.sakura.ne.jp","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","pasadenastarnews.com","player.smashy.stream","popularmechanics.com","pornstarsyfamosas.es","receitasdaora.online","relevantmagazine.com","reptilesmagazine.com","securenetsystems.net","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","techsupportforum.com","thebeautysection.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videostreaming.rocks","viralviralvideos.com","windsorexpress.co.uk","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","barnsleychronicle.com","bigleaguepolitics.com","burlington-record.com","celiacandthebeast.com","client.pylexnodes.net","collinsdictionary.com","documentaryplanet.xyz","dragontranslation.com","eroticmoviesonline.me","foreverwallpapers.com","forum.release-apk.com","hackerranksolution.in","hollywoodreporter.com","hoodtrendspredict.com","invoice-generator.com","journaldemontreal.com","julesburgadvocate.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","notformembersonly.com","pelotalibrevivo.net>>","publicsexamateurs.com","redbluffdailynews.com","santacruzsentinel.com","snapinstadownload.xyz","sousou-no-frieren.com","statisticsanddata.org","streamservicehd.click","tapeadvertisement.com","tech.trendingword.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","timesheraldonline.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","watchkobestreams.info","whittierdailynews.com","zone-telechargement.*","ahdafnews.blogspot.com","allevertakstream.space","andrenalynrushplay.cfd","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","canadianmoneyforum.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","dallashoopsjournal.com","drop.carbikenation.com","elrefugiodelpirata.com","eurointegration.com.ua","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","jpop80ss3.blogspot.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","pervertgirlsvideos.com","player.gamesaktuell.de","portaldasnovinhas.shop","redlandsdailyfacts.com","shutupandtakemyyen.com","smartfeecalculator.com","sonsoflibertymedia.com","totalsportek1000.com>>","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","bajarjuegospcgratis.com","excelsiorcalifornia.com","footballtransfer.com.ua","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","laurelberninteriors.com","makefreecallsonline.com","newlifeonahomestead.com","nothingbutnewcastle.com","osteusfilmestuga.online","pcoptimizedsettings.com","player.smashystream.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thecurvyfashionista.com","theplantbasedschool.com","afilmyhouse.blogspot.com","astraownersnetwork.co.uk","broomfieldenterprise.com","canoncitydailyrecord.com","dictionary.cambridge.org","dimensionalseduction.com","first-names-meanings.com","freelancer.taxmachine.be","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","mediapemersatubangsa.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","spaghetti-interactive.it","stacysrandomthoughts.com","stresshelden-coaching.de","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","tip.etip-staging.etip.io","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","betweenenglandandiowa.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dictionnaire.lerobert.com","greatamericanrepublic.com","player.pcgameshardware.de","practicalselfreliance.com","sentinelandenterprise.com","sportsgamblingpodcast.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","keyakizaka46matomemory.net","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","thenonconsumeradvocate.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","beautifulfashionnailart.com","forums.socialmediagirls.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

const $hasEntities$ = true;
const $hasAncestors$ = true;

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

if ( todoIndices.size === 0 ) { return; }

// Collect arglist references
const todo = new Set();
{
    const arglistRefs = $scriptletArglistRefs$.split(';');
    for ( const i of todoIndices ) {
        for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
            todo.add(ref);
        }
    }
}

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
