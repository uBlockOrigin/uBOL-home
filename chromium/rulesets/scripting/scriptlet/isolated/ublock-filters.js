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

function trustedSetCookieReload(name, value, offsetExpiresSec, path, ...args) {
    trustedSetCookie(name, value, offsetExpiresSec, path, 'reload', '1', ...args);
}

function trustedSetLocalStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('local', true, key, value, options);
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 18 */
[replaceNodeText,removeNodeText,trustedCreateHTML,trustedSetAttr,trustedSetLocalStorageItem,setAttr,preventRefresh,setCookie,removeCookie,setLocalStorageItem,trustedSetCookie,hrefSanitizer,trustedClickElement,removeClass,closeWindow,multiup,setSessionStorageItem,trustedSetCookieReload];

const $scriptletArgs$ = /* 1047 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const t={apply:(t,e,o)=>{const n=o[0];return\"function\"==typeof n&&n.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(t,e,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i","ins.adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4999999999&adk=1777777777&adf=1059123170&pi=t.ma~as.4999999999&w=300&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!3\" data-google-query-id=\"CMiylL-r1pEDFYBewgUd-C8e3w\" data-load-complete=\"true\"></iframe></div>","ins.adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6644444444&adk=622222222&adf=1800000000&pi=t.ma~as.6644444444&w=311&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=6111111111111&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=7778888888888890&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!4\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","ins.adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4999999999&adk=3666666666&adf=1000000000&pi=t.ma~as.4999999999&w=336&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4555555555888&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4222228888888888&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\" data-google-container-id=\"a!3\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","body:has(ins.adsbygoogle.nitro-body > div#aswift_1_host)","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1777777777&adf=3000000000&lmt=1777777777&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=966666666666&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12222222&ady=-12244444&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\" data-google-container-id=\"a!1\" data-load-complete=\"true\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","unfill-optimized","*:not(.main-wrap:has(~ [id^=\"nitro-sidebar\"] .nitro-side) #nitro-top,.main-wrap:has(~ [id^=\"nitro-sidebar\"] .nitro-side) #nitro-body-desktop,[id^=\"nitro-sidebar\"]:has(.nitro-side) ~ #nitro-header-mobile) > ins.adsbygoogle:not(:has(#aswift_0_host))","filled","var menuSlideProtection","/*start*/(()=>{const t=Promise.prototype.then;Promise.prototype.then=new Proxy(t,{apply:(t,e,o)=>{const n=o[0];return\"function\"!=typeof n||(o[0]=new Proxy(n,{apply:(t,e,o)=>{let n=o[0];if(n&&\"object\"==typeof n){const t=Object.keys(n);if(4===t.length&&\"totalMessages\"in n){const e=t.find((t=>\"boolean\"==typeof n[t]));e&&!1===n[e]&&(n[e]=!0)}}return Reflect.apply(t,e,o)}})),Reflect.apply(t,e,o)}});try{Promise.prototype.then.toString=()=>\"function then() { [native code] }\"}catch(t){}})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//,\"\");/*end*/var menuSlideProtection","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","/document\\.createElement|\\.banner-in/","admbenefits","ref_cookie","/\\badblock\\b/","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","imps","3","reload","adexp","31000, .VerifyBtn, 100, .exclude-pop.NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/ABDetected|navigator.brave|fetch/","Android/","false/","stay","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","close-modal","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","AdbModel","/popup/i","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","window.open","timeLeft = duration","timeLeft = 1","/aclib|break;|zoneNativeSett/","/fetch|popupshow/","justDetectAdblock",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","/\\d{4}/gm","count","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","true","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","(isAdsenseBlocked)","(false)","onDevToolOpen","/#Intent.*?end/","intent","https","firstp","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","3000","getElementById","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","/window\\.location\\.href.*/","_blank","_self","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","head","<div id=\"popads-script\" style=\"display: none;\"></div>","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","ai_adb","\"v4ac1eiZr0\"","admiral","'').split(',')[4]","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","__adblocker","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","html-load.com","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","\"data-sdk\"","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","domain=?eventId=&error=",";confirm(","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/window.open.*/gms","window.open(url, \"_self\");}","/window\\.location\\.href.*?;/","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","style","text-decoration","/break;case|FingerprintJS/","push","(isAdblock)","get-link",".ybtn.get-link[target=\"_blank\"]","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64",".btn-success.get-link[target=\"_blank\"]","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","charCodeAt","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","localStorage","popunder","adbl","/protect?","disabled","a#redirect-btn","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","unlock_chapter_guest","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","off","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","ab","IFRAME","BODY","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","const ad_slot_","(()=>{window.addEventListener(\"load\",(()=>{document.querySelectorAll(\"ins.adsbygoogle\").forEach((element=>element.dataset.adsbygoogleStatus=\"done\"))}))})();const ad_slot_","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","window.googletag.pubads","'flex'","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","/getComputedStyle|overlay/","in_d4","hanime.tv","p","/videoAssetId.+introSplashVideo.+renderStoresWidgetsPendingList/s",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","body","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","offsetHeight","student_id",".offsetLeft",":{content:","no:{content:","AdBlockChecker",".modal-content","ins.adsbygoogle","data-adsbygoogle-status","done","div","document.body.innerHTML","/popunder|contextmenu/","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 831 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13;2,14,15;2,16,17;2,18,19;3,20,21,22;3,12,21,23;3,24,21,25;0,0,26,27,3,4;0,0,28,29;0,0,30;0,0,31,32;1,0,33;1,0,34;1,0,35,36,37;0,0,38,39;4,40,41,42,43,44,45,46,47,48,49,50;0,0,51,52;5,53,54,55;6;0,0,56,57;0,0,58,59,60,61;7,62,4;8,63;9,63,64;0,0,65,66;1,0,67;10,68,69,70,69,71,72;0,0,73,74;1,0,75;0,0,76,77;1,0,35;1,0,78;1,0,79;1,0,80;1,0,81;1,0,82;7,83,4;1,0,84;7,85,86;7,87,4;1,0,88;0,0,89,90;0,0,91,92;8,93;1,0,94;1,0,95;1,0,96;11,97,98;1,0,99;0,0,100,69,60,101;1,0,102;1,0,103;1,0,104;8,105;1,0,106;1,0,107;0,0,108;1,0,109;1,0,110;0,0,111,112;0,0,113;0,0,114,115;0,0,116,117;1,0,118;0,0,119,120;1,0,121;7,122,4;7,123,4;7,124,4;1,0,125;1,0,126;9,127,64;7,128,129,69,130,4;7,131,4,69,130,4;12,132;0,0,133,134;0,0,135,136,60,137;0,0,138,139;0,0,140,141;1,0,142;1,0,143;0,0,144,145,146,4;0,0,147,74;0,0,148,149;1,0,150;1,0,151;0,0,152,149,60,153;0,0,154,69,60,155;0,0,156,4,60,157;0,0,158,159;13,160;1,0,161;1,0,162;0,0,163,164;0,0,165,166;1,0,167;10,168,169;0,0,170,70,60,171;0,0,172,149,60,171;1,0,173;0,0,174,175,3,176;1,0,177;1,0,178;0,0,179;0,0,180,74;0,0,181,69,60,182;1,0,183;1,0,184;1,0,185;0,0,186,187;1,0,188;1,0,189;7,190,4;1,0,191;1,0,192;1,0,193;1,0,194;0,0,195,196;1,0,197;1,0,198;1,0,199;0,0,200,69,60,201;0,0,202,203;7,204,4;0,0,205,206;1,0,207;0,0,208,149,60,209;0,0,210,211,60,209;0,0,212,213;0,0,214,215;0,0,216,217;1,0,218;0,0,219,220;0,0,221,74;0,0,39,136,60,222;0,0,223,224;0,0,225,74;1,0,226;1,0,227;0,0,228,229,230,231;0,0,232,233;1,0,234;0,0,235;0,0,236,237;1,0,238;0,0,239,74;0,0,240,241;1,0,242;1,0,243;0,0,244,149,60,245;1,0,246;0,0,247,74;0,0,248,149;1,0,249;0,0,250;0,0,251,252;1,0,253;1,0,254;1,0,255;1,0,256;1,0,257;1,0,258;1,0,259;2,260,261;0,0,262,263;1,0,264;1,0,265;0,0,266,267;1,0,268;1,0,269;1,0,270;0,0,271;1,0,272;1,0,273;1,0,274;1,0,275;1,0,276;1,0,277;1,0,278;1,0,279;1,0,280;1,0,281;1,0,282;1,0,283;0,0,284,285,3,4;7,286,74;0,0,287,288;0,0,289,290;0,0,291,292;0,0,289,293;0,0,289,294;0,0,295,296,3,4;0,0,297,298,3,4;0,0,299,300,60,301;1,0,302;1,0,301;1,0,303;1,0,304;1,0,305;1,0,306;1,0,307;1,0,308;1,0,309;1,0,310;1,0,311;1,0,312;1,0,313;1,0,314;1,0,315;1,0,316;0,0,317,318,60,319;0,0,320,321;0,0,322,323;12,324,69,325;1,0,326;1,0,327;1,0,328;1,0,329;1,0,330;1,0,331;1,0,332;1,0,333;1,0,334;1,0,335;0,0,336,337;1,0,338;0,0,339,340,3,4;0,0,341,342;7,343,176;0,0,344,345,60,346;0,0,347,348;0,0,349,350,3,4;0,0,351;0,0,352,353;1,0,354;1,0,355;0,0,356,357;13,358;1,0,359;7,360,4;0,0,361;1,0,362;9,363,224;1,0,364;1,0,365;1,0,366;10,367,368,69,69,71,369;1,0,370;8,284;0,0,371,372;0,0,373;0,0,374,321,60,375;8,376;9,376,64;7,377,4;1,378,379;1,0,380;1,0,381;0,0,382,233;13,383,384,146;1,0,385;11,386,387;13,383,388,146;0,378,389,390;13,391,392,146;13,393,394,146;7,395,4;13,396;8,286;1,0,397;13,398,399,146;1,0,400;1,0,401;1,0,402;0,0,403,404;13,405,406;13,405,407;1,0,408;1,0,409;1,0,410;7,409,4;14,411;13,412,413;2,260,414;1,0,415;0,0,416,417,60,418;1,0,419;8;1,0,420;7,421,4;1,0,422;1,0,423;7,424,86;1,0,425;1,0,426;1,0,427;1,0,428;8,429;9,429,64;5,430,54,431;7,190,432,69,130,4;10,433,434;0,378,435,436,60,437;1,0,438;1,0,439;1,0,440;1,0,441;1,0,442;13,443;0,0,444,445;13,446,447;9,448,224;7,449,4;11,450,451;1,0,452;8,453;7,454,4;7,455,224;1,0,456;1,378,457;13,458,69,146;1,0,459;15;1,0,147,60,110;1,0,460;1,0,461;1,0,462;0,0,463,464;1,0,465;1,0,466;7,330,467;8,468;1,0,469;1,0,470;1,471,472;1,471,473;1,471,474;1,471,475;1,471,476;1,471,477;1,471,478;1,0,479;1,471,480;0,0,481;12,482;1,0,483;0,0,484,485,3,4;0,0,486,74;12,487;0,0,488,489,60,490;11,491,492;11,493,451;1,0,494;1,0,495;1,0,496;1,0,497;1,0,498;1,0,499;1,0,500;1,0,501;1,0,502;7,503,4;1,0,504;1,0,505;1,0,506;1,0,507;0,0,508,509,60,510;9,511,176;0,0,512,69,60,513;5,514,54,515;1,0,516;13,517,518;1,0,519;1,0,520;11,521,451;0,0,522,523,60,524;7,525,4,69,130,4;1,0,526;1,0,527;1,0,528;1,0,529;1,0,530;1,0,531;1,0,532;1,0,533;1,0,534;8,535;0,0,536,537;1,0,538;1,0,539;1,0,540;1,0,541;0,0,542,233;0,543,544;1,0,545;1,0,546;1,0,547;0,0,548,549;1,0,550;6,551;9,552,224;1,0,553;1,0,554;1,0,555;1,0,556;1,0,557;0,0,558,559;12,560;13,561,562;1,0,563;12,564;1,0,565;0,0,566,567;0,0,568,569;1,0,570;1,0,571;0,0,572,573;0,0,574,575;0,0,576,233;7,577,4;7,578,4;1,0,579;7,580,224,69,130,4;0,0,409,69,60,409,146,4;8,581;0,0,582,321;0,0,583,233;1,0,584;0,0,585,586,3,4;1,0,587;1,0,588;1,0,589;1,0,590;7,591,4;1,0,592;7,593,4;1,0,594;7,595,4;10,596,597;1,0,598;0,0,599,600;1,0,601;1,0,602;1,0,603;1,0,604;16,605,64;5,606,54,607;7,409,86;1,0,608;1,0,609;0,0,610,224;0,0,611,321;1,0,612;0,0,613,69,60,570;1,0,614;1,0,615;16,616,224;0,0,617,618;0,0,619,620;7,621,4;7,622,4;1,0,623;0,0,624,625;9,626,64;0,0,627,628;7,629,4,69,130,4;0,0,630;1,631,632;0,0,633,74;1,0,634;7,635,4,69,130,4;0,0,636,69,60,637;0,0,638,639;1,0,640;1,0,641;16,642,224;1,0,643;1,0,644;9,645,74;1,0,646;0,0,647,648,60,649;1,0,650;1,0,651;1,0,652;0,0,653,654,3,4;7,655,4;1,0,656;10,657,169;1,0,658;1,0,659;0,0,289,660,3,4;1,0,661;0,0,662,663,3,4;1,0,664;0,0,665;0,0,666,667;1,0,668;1,0,669;1,0,670;1,0,671;0,378,672,673;0,0,674,675;1,0,676;7,677,4;1,0,678;9,679,224;1,0,680;0,0,681,682;7,683,4;1,0,684;0,0,7,685;1,0,686;1,0,687;3,688,689,690;1,0,691;13,692,693;1,0,694;10,695,4,69,69,71,696;0,0,409,697;1,0,698;12,699,69,700;1,0,701;8,702;1,0,703;1,0,704;1,0,705;10,706,707;1,0,708;1,0,709;1,0,710;0,0,711,224;1,0,712;1,0,713;0,0,714,715,3,4;9,716,64;1,0,717;0,0,718,719;0,0,720;1,0,721;17,722,722;1,0,723;13,724,69,146;7,725,4;8,726;1,0,286;16,727,728;1,0,729;0,0,730,731;1,0,732;0,0,733;1,0,734;1,0,735;1,0,736;1,0,737;1,0,738;8,739;10,740,224,69,69,130,4;1,0,741;1,0,742;1,0,743;7,744,224;1,0,745;1,0,746;1,0,747;0,0,748,69;7,749,224;7,750,224;1,0,751;1,0,752;1,0,201;0,0,753;9,754,4;4,755,169;1,0,756;1,0,757;1,0,758;1,0,759;10,760,761;2,762,763;1,0,764;1,0,37;0,0,765,766;0,0,289,767,3,4;0,0,768,769,3,4;0,0,770,771;1,0,772;1,0,773;1,0,774;7,775,4;7,776,4,69,130,4;11,777,387;1,0,778;0,0,779,780;0,0,228,781;0,0,782,783;0,0,784;1,0,785;1,0,786;0,0,787,788;1,0,789;1,0,790;1,0,791;1,0,792;1,0,793;1,0,794;1,471,795;1,0,796;1,0,797;1,0,798;9,799,64;1,0,800;0,0,801,802;1,0,803;1,378,804;3,805,806,807;2,805,808;1,0,809;1,0,810;5,811,812,4;1,0,813;1,0,814;1,0,815;1,0,816;9,817,64;9,818,64;9,819,64;9,820,64;9,821,64;9,822,64;11,823,451;8,824,825,826;9,827,64;11,828,451;11,829,830;9,831,64;11,832,833;11,834,835;11,836,451;11,837,838;11,839,840;11,841,98;11,842,838;11,843,451;11,844,840;11,845,846;11,847,451;11,848,451;11,849,838;11,850,851;11,852,451;11,853,451;11,854,840;11,855,856;11,857,451;11,858,859;11,860,861;11,862,451;11,863,98;11,864,451;11,865,866;11,867,868;11,869,870;11,871,872;11,873,874;11,875,840;11,876,451;11,877,878;11,879,451;11,880,881;11,882,883;11,884,451;11,885,886;11,887,888;11,889,890;11,891,451;11,892,893;11,894,451;11,895,451;8,896;8,897;8,898;8,899,825,826;8,900;8,901;8,902,825,826;8,903;10,902,69,70;7,904,432;7,905,432;8,906;8,907;8,908;8,909,825,826;8,910,825,826;9,911,64;16,912,64;8,913;9,914,64;8,915,825,826;10,915,70,69,69,71,916;8,917,825,826;10,918,69,70,69,71,919;8,920;8,921,825,826;9,922,64;16,923,64;8,924,825,826;8,925;9,926,64;8,927;9,928,64;8,929,825,826;8,930;8,931;8,932,825,826;9,933,64;16,934,64;8,935,825,826;8,936,825,826;9,937,64;8,938;8,939,825,826;9,940,64;8,941,825,826;8,942,825,826;9,943,64;16,943,64;8,944;8,945;9,945,64;9,946,64;9,947,64;10,948,69,70,69,71,949;10,950,69,70,69,71,949;9,951,64;8,952,825,826;9,953,64;9,954,64;8,955;8,956;8,957,825,826;9,958,64;8,959,825,826;9,960,64;9,961,64;9,962,64;8,963,825,826;8,964;8,965,825,826;8,966;9,967,64;8,968;8,969,825,826;8,970,825,826;10,971,69,70,69,71,972;10,971,69,70,69,71,973;9,974,64;8,975,825,826;9,976,64;9,977,64;10,978,69,70,69,71,979;10,980,69,70,69,71,979;10,981,69,70,69,71,979;10,982,69,70,69,71,983;9,984,64;9,985,64;8,986;9,987,64;9,988,64;9,989,64;8,990,825,826;9,991,64;8,992,825,826;9,993,64;8,994,825,826;9,995,64;8,996,825,826;9,997,64;9,998,64;8,999;9,1000,64;11,1001,851;11,1002,851;11,1003,851;11,1004,851;11,1005,851;11,1006,851;11,1007,851;11,1008,851;11,1009,851;11,1010,851;11,1011,451;1,0,1012;8,1013;8,1014;16,1015,74;11,1016,1017;8,1018;11,1019,451;10,918,69,70,69,71,1020;8,1021;9,1022,64;8,1023;10,1024,1025,69,69,71,1026;10,1027,69,70,69,71,1026;10,1028,69,70,69,71,1026;10,1024,1025,69,69,71,1029;10,1027,69,70,69,71,1029;10,1028,69,70,69,71,1029;8,1030;8,1031;1,0,1032;8,1033;9,1034,64;8,1035;9,1036,64;16,1037,64;9,1038,64;9,1039,64;8,1040;16,1041,64;8,1042,825,826;11,1043,451;1,0,1044,60,1045;1,0,1046";

const $scriptletArglistRefs$ = /* 3803 */ "174;174;166;41;166;21,462;629,630,631,632,633,634;166;36,166;166;405;189;276;201,212,629,630,631,632,633,634;215;799,800;166,479;174,215;36;36;166;201,629,630,631,632,633,634;179;201;189;174;176;57;39,166,176;189,205;211;166;77;166;121;201,629,630,631,632,633,634;174;41;34;40;36,166;324;203;174;201;201;201,629,630,631,632,633,634;174;189;166;201,629,630,631,632,633,634;35;201,629,630,631,632,633,634;162;166;220;201;215;166;176;286;97;174;176;81;66,162;174;166;166;200;629,630,631,632,633,634;66,162;189;351;176;166;485;105;166;166;201,629,630,631,632,633,634;166;684;690;568;625;166;409;36;492;645;174;749;166,241;166;201,629,630,631,632,633,634;201,629,630,631,632,633,634;201,629,630,631,632,633,634;166;2;174;174;174;162,201,212,629,630,631,632,633,634;189,210;256;189;174,375;761,762;468;174;201;627;200;162;201;4,638,690;274;201,629,630,631,632,633,634;166;434;113;670,671;336;166;830;174,215;567;52;36;36;189;151;290;166;405;174;162;784;201;201,629,630,631,632,633,634;166;474;474;752;200;180;166;166;166;201;220;201;201;174;715,716;379;201,629,630,631,632,633,634;189;164;547;744;166;201,629,630,631,632,633,634;641;178;201;168;610;717;166;166;201;166;26;166,174;166;166;201;178;166;166;727;166;492;166;166;166;282;68,162;166;166,241;166;168;629,630,631,632,633,634;166;189;595;52,166;302;201,629,630,631,632,633,634;174;166;166;36,52,174;201;46;52,166,174;166;166;166;189;201;201,629,630,631,632,633,634;201;186,189;748;36;166,178;255;166;166;166;166;570;570;166;467;201;220;760,762;166;166;166,174;166;166,174,177;166;174;220;166,178;629,630,631,632,633,634;166;201;166;166;439;205,629,630,631,632,633,634;201,629,630,631,632,633,634;166;201,629,630,631,632,633,634;108,109;561;319;645;645;166;166;166;697;332;166,174;126,166;684;176;405;220;113;336;215;215;166;166;166;201,629,630,631,632,633,634;215;215;166;215;210;201;166,174;91,166;396;174;174;166;166;106;113;223;645;5;174;166;166;174;455;174;131;201,629,630,631,632,633,634;182;166;166;91;252;629,630,631,632,633,634;81;201;523;166;730,731,732;174;382;166;166;50;738,739,740;751;166,174;185;201,629,630,631,632,633,634;166;189,260;201,629,630,631,632,633,634;545;385;201;166;166;166;221;30;431,432;166;36,52;189;261;697;629,630,631,632,633,634;220;178;629,630,631,632,633,634;201,629,630,631,632,633,634;629,630,631,632,633,634;200,629,630,631,632,633,634;801;162;448;166;166;201,629,630,631,632,633,634;36,166;166;166;609;58,189;201;201;629,630,631,632,633,634;545;556;36;166,178;166;36;36;166;166;804;201,629,630,631,632,633,634;792;793;794;629,630,631,632,633,634;220;174;43;166;106;166;166;201;166;353;106;106;135,136,137;85;166;166;224;801;166;428,429,430;115;405;321;176;166;166;323;122;232;644,670,671,672,674,675;162;604;126;178,389;389;166,241;106;201;82,83;166,174;166;166,286,367;166;106;106;166;166;166;201,629,630,631,632,633,634;36,174;215;166;166;106;824;556;148,149,150;106;106;162;201;107;186;201,629,630,631,632,633,634;438;515;286;-256;145;277;428,429,430;646;166;166;629,630,631,632,633,634;174;166;166;85;670,671,672;333,334;166;166;166;36;166;201,629,630,631,632,633,634;166;91;166;174;278;283;220;132,133;174;285;72,73,74;174;166;166,221;169;215;201;166;176;166;201;123;174;522;226;106;106;267;174;166,174;379;580;166;117;201;166;188;166;203;556;250;220;201;115;174;684;113;201;215;201,629,630,631,632,633,634;66,162;166;512;114;654,655,704,705;135,136,137;209,212;178;201;106;201;345;122;389;608;64;823;248,249;166;131;693;577,578;174;54;166;184;520;201,629,630,631,632,633,634;201;220;389;174;166;422;498;166;472;232;122,414,415;174;174;166;64;189;166;782,783;174;162;166;645;428,429,430;201,629,630,631,632,633,634;176;729;82,83;174;348;174;562;174;166;189;331;174;166;201,629,630,631,632,633,634;174;166;166;201;770;670,671;166;220;395;166;166;231;193,629,630,631,632,633,634;629,630,631,632,633,634;629,630,631,632,633,634;201,629,630,631,632,633,634;201,629,630,631,632,633,634;166;166;166;166;91;201,629,630,631,632,633,634;201,629,630,631,632,633,634;201,629,630,631,632,633,634;131;170;166,185;135,136,137;221;166;91;166;174;745;745;166;98,99,100,101,102;64;166;223;174;318;366;576;166;201;52;428,429,430;556;201,629,630,631,632,633,634;174;91;166;166;56;218;189;380;328;62,328;790;114;176;629,630,631,632,633,634;178;201;339;201;208,209;162;551;166;489;189;287;91;174;32;174;56;189;201,629,630,631,632,633,634;125;36;166;166;201,629,630,631,632,633,634;220;265;650;166,174;91;91;2;91,117;220;166;166;176;166;166;629,630,631,632,633,634;166;318;394;166;174;189;828;174;201,629,630,631,632,633,634;201;201;521;210;201;63;166,178;166,174;166;166;117;166;166;182;122;189;232;166;39;295;38;69;36;166,241;617;166,241;110;166;166;82,83;50;166,479;178;115;115;189;174;288;200,629,630,631,632,633,634;201,629,630,631,632,633,634;449;174;413;166;166;189;166;205,629,630,631,632,633,634;178,284;166;166;106;36;91;166;645;166;215;166,174;201,629,630,631,632,633,634;201,629,630,631,632,633,634;215;189;201;318;147;207;174;166;189;442,443;166;397;428,429,430;428,429,430;428,429,430;428,429,430;166;166;220;166;645;293;201,629,630,631,632,633,634;166;166;201,629,630,631,632,633,634;174;498;166;174,176;174;201,629,630,631,632,633,634;201,629,630,631,632,633,634;152,153;408;22;506,825,826;537;91;126;75;36;256;166;166;201,629,630,631,632,633,634;189,212;166;36;166;174;166;126;201,629,630,631,632,633,634;210;368;189;266;185;201;166;166;166;629,630,631,632,633,634;182;115,329;189;189;166;626;52;107;166;290;189,709,710,711;162;801;38;201;540;166;801;166;109;201,629,630,631,632,633,634;174;201,629,630,631,632,633,634;113;166;166,174,479;201,629,630,631,632,633,634;106;201;166;788;189;166;269;166;201;166;115,117;166;91;629,630,631,632,633,634,682;189;201,629,630,631,632,633,634;166;200,201,629,630,631,632,633,634;215;201;166;587;201,629,630,631,632,633,634;556;416;166;827;166;174;253;44,45;801;242;166;201;166;168,178,583;176;174;166;218;36;36;201;586;629,630,631,632,633,634;201;166;166;166;201;200;166;534;201;166;552;774;444;201,629,630,631,632,633,634;166;166;52,166;377;556;812,813,814;174;36;585;166;201,629,630,631,632,633,634;119;146;166;166;220;221;166;220;220;629,630,631,632,633,634;228;258,259;113;203;191,201;166;205,629,630,631,632,633,634;830;593;91;166;201,629,630,631,632,633,634;75;201,629,630,631,632,633,634;220;201,629,630,631,632,633,634;189;166;201;164;750;166;166;166;389;646;166;389;201;201;221;335;201;201,629,630,631,632,633,634;363;801;166;166;174;285;166;663;91;91;166;115;36;166;174;176;166;166;166,178;174;450;166;166;328;201,629,630,631,632,633,634;556;166;644,670,671,674,675;166;166;509;629,630,631,632,633,634;189;339;36;166;524;166;166;166;38;14,15,16,17;166;174;166;201;166;19,20,181;166;239;201,629,630,631,632,633,634;189,687;389;201,629,630,631,632,633,634;189;166;189;166;166;166;726;174;166;646;527;174;174;670,671;201,629,630,631,632,633,634;270,271;166;201;166;166;5;118;148,149;178;178;166;166;122;166;178,558;166;201,629,630,631,632,633,634;114;174;166;166;166;461;166;115;115;166;201;166;166;201;189;174;166;166,178;166;556;178;486;166;617;617;36;166,174;166,176;59;201;67;166;629,630,631,632,633,634;296,297;201;162,163;684;412;114;42;5;166;36,176,482;164;201;614;201;652;166;201,629,630,631,632,633,634;166;36,52;-37;166;154;174;165;166;389;201,629,630,631,632,633,634;407;58,189,201,668;174;166;174;166;338;166;36;203;388;629,630,631,632,633,634;556;189;389;606;366;166;498;308,309,310,311,312;221,591;-256;435;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;560;475,476;174;-37;166;201,629,630,631,632,633,634;201,629,630,631,632,633,634;176;166;201,629,630,631,632,633,634;166;201;201;36,174;284;166;703;166;166,556;166;189;189;166;201,629,630,631,632,633,634;201;622;166;166;166,241;106;174;389;115,117;281;148,149;189;166;124;201,629,630,631,632,633,634;166;201;629,630,631,632,633,634;385;166;166;24;629,630,631,632,633,634;166;117;56;189;166;294;556;801;629,630,631,632,633,634;556;737;201;201;201,629,630,631,632,633,634;201,629,630,631,632,633,634;-37,-557,-831;201;423;598;119;174;115;174;556;166;113;389;189;189;164;166;58,189,210;174;166;463,464;201;176;201,629,630,631,632,633,634;166;215;615;76;189;556;138,139,140;215;54;553;404;629,630,631,632,633,634;86;166;166;669;389;166;192,629,630,631,632,633,634;201,629,630,631,632,633,634;131;212;113;91;688,689;326;166;514;290;36;232;166,174;174;166;166;174;201;174;174;166;201;284;406;166;232;164;201;545;166;201,629,630,631,632,633,634;201;510;201;24;174;645;201,629,630,631,632,633,634;61;189;360;201,629,630,631,632,633,634;504;174;389;220;166;166;332;36;166;92,93,94,95;114;166;166;780,781;383;556;425,426;166;389;38;201,629,630,631,632,633,634;201,629,630,631,632,633,634;166;166;56,166;387;201;166;166;166;357;166;220;166;201,629,630,631,632,633,634;599;584;166,174;384;257;166;201,629,630,631,632,633,634;201,629,630,631,632,633,634;166,178;91;24,166;166;201;542;635;166;569;201,629,630,631,632,633,634;166;299;111;439;166;646;166;115,117;189;201,629,630,631,632,633,634;27;166;91;166;805,806,807;629,630,631,632,633,634;166;174;189;582;473;201;201;191,201;166;201;176;174;174;166;166;174;785;174;778,779;84;201,629,630,631,632,633,634;52;201,629,630,631,632,633,634;201,208,209,212;201;166;201,629,630,631,632,633,634;166;483;201,629,630,631,632,633,634;166;24;201,629,630,631,632,633,634;166;174;189;753;201,202;671;166;31;351;189;289;174;220;166;166;351;166;646;646;166;166;389;201,629,630,631,632,633,634;201,629,630,631,632,633,634;629,630,631,632,633,634;166;87,88,89;608;166;208,209;201,629,630,631,632,633,634;174;189;499;174;545;545;545;201;625;189;201,629,630,631,632,633,634;166;166;166;189,670;166,697;189;106;201,629,630,631,632,633,634;201;619;91;418;86;646;162;389;189;531;320;174;681;201;218;178;166;166;559;166,178,241,486;112;166;189;201,629,630,631,632,633,634;168;168;201;166,178,241,486;371;114;201;402;330;733;816;122;687,772,773;596;166;186;166;166;201;757;407;413;413;413;174;174;186;166;182;166;200;115,166;263;166;191,201;166;201;38;428,429,430;201,629,630,631,632,633,634;85;166;178;174;166;166,174,479;174;201;697;201;616;164;201,629,630,631,632,633,634;166;624;168;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;646;646;166;646;305;166;339;201;201,629,630,631,632,633,634;166;49;174;166;174;166;174;201;166;189,190;166;36;166;714;53;556;189;627;166;166,241;191,201;241,486;166;116;166;166;220;458;166;50;91;201,427;91;314;267;201;201;189;201,212,629,630,631,632,633,634;166;535;629,630,631,632,633,634;191,201;290;201;176;166;316;189;201;166;189;329;625;107;801;221;117;695;317;189;736;166;487;91;166;236,237;556;201;189,565;114;625;201,629,630,631,632,633,634;459;205,629,630,631,632,633,634;201,629,630,631,632,633,634;189;52,174;327;370;107,166;166;428,429,430;201;687;164;166;36;201,629,630,631,632,633,634;201;107;684;118;166,174;801;166;720,721,722;201;201,629,630,631,632,633,634;166;463;463;201;215;91;166;446;221;556;786;91;386;143;405;166;221;629,630,631,632,633,634;201,629,630,631,632,633,634;539;174;36;162;166;266;220;166;579;629,630,631,632,633,634;166;166;201;543;166;201;280;166;166;389;505;166;556;273;626;156,157,158,159,160,161;166;166;602;201;205,629,630,631,632,633,634;201,629,630,631,632,633,634;444;511;166;201,629,630,631,632,633,634;201,212;114;201,629,630,631,632,633,634;174;627;220;225;220;38;166;301;166;198,629,630,631,632,633,634;166;809,810,811;201;285;189;174;189;201,629,630,631,632,633,634;766,767,768;313;201;166;166;220;166;342;98,99,100,101,102;203;201,629,630,631,632,633,634;667;505;359;201,629,630,631,632,633,634;201,629,630,631,632,633,634;201,629,630,631,632,633,634;166;201,629,630,631,632,633,634;166;201,629,630,631,632,633,634;199,629,630,631,632,633,634;221;117;122;174;201,629,630,631,632,633,634;684;801;203;91;201,629,630,631,632,633,634;785;201,629,630,631,632,633,634;189;605;646;107;166;166;166;189;91;38,91;690,692;176;166;166;166;36;582;765;671;189;629,630,631,632,633,634;166;601;37,162;166;166;166;166;166;639,640;174;166;166;166;166;189;212;684;392;166;347;318;318;791;201,629,630,631,632,633,634;166,241;162;201,629,630,631,632,633,634;166;378;189;174;182;166;201;201;706;166;646;564;166;166;456,457;201,629,630,631,632,633,634;115;166;167;166;166;802;332;592;173;173;166,517;166;166;166;166;166;123;801;204,629,630,631,632,633,634;798;201,629,630,631,632,633,634;189;166;6,7,8,9,10,11,12,13;201;187;36,482;106;201;201;201;526;315;201,629,630,631,632,633,634;36,262;201;546;164;166;166;166;201,629,630,631,632,633,634;201;201,629,630,631,632,633,634;174;176;229;166,221;166;166;166;166;166;200;174;221;222;746,747;166,178;166;131;166;166;189;5;166;166,178;166;210;166,178,646;201;166;174;629,630,631,632,633,634;166;201;643;178;178;178;646;646;166;486;64,166;174;532;36;723;166;612;174;166,241;625;91;602;672;335;671;210;164;186;166;189;801;186;166;460;166;176;166;362;413;413;166;218;91;221;107;91;201;164;413;413;166;201,629,630,631,632,633,634;174;166;115,166;428,429,430;178,284;352;182;166;36;174;174;164;166;734,735;801;244,245;803;166;201,629,630,631,632,633,634;166;690,691;36;176;201;200;164;166;201;556;189,708;166;579;220;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;428,429,430;646;166;166;646;166;830;166;201;166;494;759;22;201;201;201;751;166;168;201,629,630,631,632,633,634;556;201,629,630,631,632,633,634;115;174;755,756;91,112;166,178;279;166;166;176;166;166;118;47,48;166;118;91;24,300;220;166;201;162;201,728;556;107;556;201;625;187;201,629,630,631,632,633,634;168;164;166,176;52,174;201;201;625;298;220;36,52,556;166;36,52;556;166;166;166;166;473;801;801;164;189;201,629,630,631,632,633,634;24;801;801;303,304;303,304;164;166;201;166;205,629,630,631,632,633,634;33;200,629,630,631,632,633,634;201;201;189;651;36,262;36,52,166,174,262;355;218;166;166;36;201;36;174;166;166,178;189;232;24,496,497;98,99,100,101,102;201;166;344;156,157,158,159,160,161;201;201;166;114;166;191,201;91;166;176;178;142;428,429,430;166;499;58;122;166;191,201;493;166;508;166,241;118;556;232;189;36;629,630,631,632,633,634;166,178;135,136,137;92,93,94,95;232;166,174;166;166;220;172;166;38;38;174;174;166,174;166;789;166,174;86;166;201;229;134;644,670,671,674,675,679;85;113;534;205,629,630,631,632,633,634;191,201;623;201,629,630,631,632,633,634;166;201,629,630,631,632,633,634;218;178;168;55;629,630,631,632,633,634;479;166,433;201,629,630,631,632,633,634;556;535;175;201,629,630,631,632,633,634;205,629,630,631,632,633,634;667;713;201;84;815;266;189;240;166,176;197;529;162;38;132,133;741,742,743;171;174;607;182;144;166;166;115;166;38;201,629,630,631,632,633,634;166;203;189;201,629,630,631,632,633,634;389;174;428,429,430;771;166;354;166;201,629,630,631,632,633,634;189,707;86;166;201,629,630,631,632,633,634;201,629,630,631,632,633,634;684;625;647,648,649;166,272;801;191,201;201;440;189;166;801;646;646;238;419;166;797;166;201;191,201;166;201;36;217;166;164;166;417;166;556;795;166;166;166;479,482;801;201,212;461;625;555;166;166;166;189;166;91;178;166;114;24;166;189;801;613;174;697;166;337;801;164;178;91;38;201;213;611;166;664,665;210;166;166,174;166;189;305;680,776,777;174;201;66;479;166;201;600;166;178;191,201;201;166;166;166;182;174;86;189;602;91;490;629,630,631,632,633,634;201;164;189;186;166;168;64;684;365;91;115;320;166;189;166;174;212;625;166;801;801;166;166;801;166;166;201;52;52,174;189;114;201;166;166;166;201;201,629,630,631,632,633,634;166;174,284;646;166;201;191,201;86;798;23;36;201,629,630,631,632,633,634;221;166;174;525;166;166;428,429,430;428,429,430;428,429,430;428,429,430;178;495;219;166;64;76,178;191,201;84;166;189;174,389;201,629,630,631,632,633,634;36;201;117;166;389;174;201,629,630,631,632,633,634;117;201,629,630,631,632,633,634;189;91;36;191,201;176;91;166;201;698,702;189;189;52;52;52;166;178;166;36;166;201;36;246;201;86;107;787;166;201;201,210,698;200,629,630,631,632,633,634;166;220;625;371;201;201;801;801;712;201;201;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;235;36;166;162;118;201;201;189;166;194,629,630,631,632,633,634;189;603;355;174;115;451,684;191,201;166;185;445;201,629,630,631,632,633,634;513;166;24,496,497;138,139,140;96;201,212;201,629,630,631,632,633,634;189;166;191,201;189;646;251;556;201,629,630,631,632,633,634;201,629,630,631,632,633,634;5;364;201;201,629,630,631,632,633,634;200;201;162;166;201,629,630,631,632,633,634;220;174;166;594;162;125;272;166;685,686,697;220;166;166;201;166;201;166;201;191,201;349;482;166;36;166;86;191,201;201,629,630,631,632,633,634;166;424;201,629,630,631,632,633,634;599;227;201,629,630,631,632,633,634;801;201,629,630,631,632,633,634;343;82,83;201,629,630,631,632,633,634;389;174;376;166;801;725;164;646;201,629,630,631,632,633,634;201,629,630,631,632,633,634;36;206,629,630,631,632,633,634;801;189;64;602;201;168;36;216;166;166;117;325;556;166;801;201;205,629,630,631,632,633,634;178;191,201;201;166,174;174;166;389;801;201,629,630,631,632,633,634;461;189;201,629,630,631,632,633,634;107;646;646;538;166;166;174;201,629,630,631,632,633,634;166;189;129,130;166;801;166;397;201;201;166,221;166;397;36,52,556;342;107;166;461;629,630,631,632,633,634;340;36;201;36;545;201,629,630,631,632,633,634;85,182;505;36,166;451,684;166;166,168;404;201;201,629,630,631,632,633,634;191,201;629,630,631,632,633,634;189;36;820;201,629,630,631,632,633,634;201,629,630,631,632,633,634;166;454;629,630,631,632,633,634;36;52,166,174,241;189;201;166;220;85;166,241;166,241;166;166;420;166;307;801;166;801;166;200;36;36;185;484;350;625;166;218;114;201;166;166;417;52;201;212;201,629,630,631,632,633,634;166;201,629,630,631,632,633,634;579;166;332;646;164;162;201;201;801;85;389;166;556;164;808,-813,-814,-815;0,1;166;646;166;201,629,630,631,632,633,634;201;166,241;166,241;166;166;201;166,533;166;36,174;233,234;174;646;191,201;115;166;284;201,629,630,631,632,633,634;201,629,630,631,632,633,634;212;801;758;203;629,630,631,632,633,634;166;166;220;201;162;166;694;201;52;393;191,201;556;556;556;118;191,201;201;201;51;201;801;801;166;397;36;628;166;166;201;201;683;390;122;166;201;801;355;201;201;397;166;191,201;185;122;143;201;164;629,630,631,632,633,634;201;201,629,630,631,632,633,634;166;201,629,630,631,632,633,634;166;166;232;646;86;166;166;629,630,631,632,633,634;86;166;166;268;118;306;114;185;201;75;232;166;214;182;191,201;201,629,630,631,632,633,634;191,201;114;201,629,630,631,632,633,634;90;212,629,630,631,632,633,634;191,201;174;189;36,166;361;166;556;166,178;201,629,630,631,632,633,634;191,201;389;274;189;201,629,630,631,632,633,634;201,629,630,631,632,633,634;629,630,631,632,633,634;166;381;189;189;201;189;164;201,629,630,631,632,633,634;178;123;189;201,629,630,631,632,633,634;203;166;166;480,481;189;166;122;174;174,389;189;164;646;86;201,629,630,631,632,633,634;201,629,630,631,632,633,634;189;112;191,201;272;166;166;201,629,630,631,632,633,634;801;670,671;644,670,671;201;588;201;65;389;556;491;201;164;201,629,630,631,632,633,634;201,629,630,631,632,633,634;801;541;185;114;305;189;166;166;168;763,764;174;174;201,629,630,631,632,633,634;286;201;671,677,678;196,201,629,630,631,632,633,634;389;176;389;166;201;201;556;174;176;166;166;556;530;166,241;166;201,629,630,631,632,633,634;801;201,629,630,631,632,633,634;356;174,241;189;92,93,94,95;106;629,630,631,632,633,634;191,201;91;189;201,629,630,631,632,633,634;115;189;155;571,572;189;644,653,670,671,672;166;38;403;166;166;218;541;28,29;182,183;166;168;118;174;244,245;646;166;482;201,629,630,631,632,633,634;201,629,630,631,632,633,634;629,630,631,632,633,634;201,629,630,631,632,633,634;275;428,429,430;36;189;646;556;166;166,241;166;801;201;191,201;284,453;785;118;201;120;191,201;78,79,80,81;91;221;164;221;166;166;185;754;191,201;201;189;201;166;507;189;201;201;201;581;36;201,629,630,631,632,633,634;801;201,212,629,630,631,632,633,634;191,201;482;191,201;629,630,631,632,633,634;36;106;801;801;141;201;191,201;166;166;589;129,130;123;201;629,630,631,632,633,634;36;166;817,818,819;544;166;118;201;369;769;625;200;251;166;436;174;201;189;189;191,201;201,629,630,631,632,633,634;166;201;166;174;232;123;166;166;210;166;176;120;174,500,501;500,501;500,501;86;51;189;189,201;200,629,630,631,632,633,634;201;125;201,629,630,631,632,633,634;327;201,629,630,631,632,633,634;166;166;201;201;166;391;189;36,482;166;518;174;185;201;166;164;201,629,630,631,632,633,634;637;203,629,630,631,632,633,634;189;201,212;166;166;189;201,629,630,631,632,633,634;208;201;201;670;166;201;201,629,630,631,632,633,634;52,174;629,630,631,632,633,634;548;201,629,630,631,632,633,634;201,629,630,631,632,633,634;339;166;65;166;168;801;801;92,93,94,95;191,201;556;166;36;164;36;166;164;166;166;118;200;401;166;174;191,201;166;801;36,52,556;166;629,630,631,632,633,634;201,212;556;201,629,630,631,632,633,634;166,241;86;201;230;556;114;166;166,174,241;482;166;166;556;166;176;670;201;115;201,629,630,631,632,633,634;189;389;186;166;189,201;135,136,137;629,630,631,632,633,634;186;447;801;801;166;191,201;166;106;189;201;166;186;118;63;38;398;441;574;162;174;389;186;174;191,201;191,201;166;808,-810,-811,-812;189;166;201;625;625;166,241;189;254;373,374;241;201;189;164;166;166;166;76;201;477;191,201;191,201;470,471;200,201;557;554;201;166;166;52;191,201;698;719;201;201;201;801;201;189;264;201;620,621;556;189;201;201;91;201,629,630,631,632,633,634;201;201;670;201;699,700,701;166;355;191,201;191,201;478;96;627;618;201;201;122;397;201;626;166;201;166;174;51;801;399;91,112;166;189;166;191,201;247;191,201;201;118;661,662;205;201;201;201,629,630,631,632,633,634;201,629,630,631,632,633,634;629,630,631,632,633,634;189;201,629,630,631,632,633,634;212;118;201,203,629,630,631,632,633,634;5;205,629,630,631,632,633,634;166;801;801;575;201;201;189;166;201;191,201;51;801;201,629,630,631,632,633,634;166;191,201;38;65;36;166;465,466;176;801;24;201,629,630,631,632,633,634;201,629,630,631,632,633,634;251;201;118;389;556;189;166;581;656,657;556;166,241;201;115;174,178,241;566;166;24;164;166;191,201;186;201;164;106;801;174;174;166;590;272;203;327;60;241,486;646;91;673;201;166;127,128;243,659,660,674,675,785;164;166,241;85;201,629,630,631,632,633,634;189;201;25;166;191,201;189;64;346;383;166;91;92,93,94,95;92,93,94,95;166;52;191,201;166;201;201,629,630,631,632,633,634;201;166,479;437;189;114;666;372;201;201;166;201;18,528;201;166;166;629,630,631,632,633,634;801;189;191,201;91;162;201,629,630,631,632,633,634;469;502,503;195,629,630,631,632,633,634;189;201,629,630,631,632,633,634;191,201;118;642;191,201;775;203;71;629,630,631,632,633,634;410;105;201,629,630,631,632,633,634;201,629,630,631,632,633,634;118;189;642;201,629,630,631,632,633,634;103,104;191,201;201,629,630,631,632,633,634;191,201;801;684;191,201;201;201;201,629,630,631,632,633,634;51;801;174;166;164;118;629,630,631,632,633,634;201;573;164;166;166;801;796;201,629,630,631,632,633,634;201,629,630,631,632,633,634;684;166;189;488;38;36,166;322;201,629,630,631,632,633,634;556;189;556;166,241;556;191,201;400;174;166,241,829;201;191,201;166;164;801;166;191,201;531;174;185;166;86;166;166;201,629,630,631,632,633,634;191,201;118;189;186;646;115;189;636,671;106;204,629,630,631,632,633,634;201;801;201;201;24;166;201,629,630,631,632,633,634;164;189,724;166;174;201;201;201,210;91;38;114;201;36;478;201;115;201,212;201,629,630,631,632,633,634;684;191,201;536;627;166;671,679;801;191,201;85;201;118;189;563;82,83;114;114;166;201;164;201,629,630,631,632,633,634;201,629,630,631,632,633,634;200,201;519;191,201;201;201;201;201;166;201,629,630,631,632,633,634;201,629,630,631,632,633,634;801;172;670,671,718;166;421;191,201;201,629,630,631,632,633,634;201;64;191,201;205,629,630,631,632,633,634;201;201;556;189;684;106;174,176,291,292;166;118;166;201,629,630,631,632,633,634;174;191,201;201;186;201;24;164;186;674,675;556;118;389;166;166;186;186;191,201;201;166;801;189;164;801;201;189;117;201,212,629,630,631,632,633,634;191,201;115;166;401;174;70;290;189;182;201;699,700,701;801;191,201;389;164;801;191,201;191,201;166;556;201;166;201;801;191,201;801;556;411;452;166;174,241;92,93,94,95;164;164;801;801;201,629,630,631,632,633,634;186;801;201;96;164;166;801;36;166;556;586;166;200,201,629,630,631,632,633,634;684;166;201;383;164;696;625;191,201;201;82,83;166;629,630,631,632,633,634;201;174;166;201;552;191,201;114;433;166;191,201;191,201;191,201;801;201;201,629,630,631,632,633,634;166;3,516;164;65;166;801;191,201;674,675;135,136,137;164;556;201,629,630,631,632,633,634;166;166;189;201;166;801;629,630,631,632,633,634;201;676;164;166;191,201;191,201;201,629,630,631,632,633,634;166;166,358;549,550,821,822;117;191,201;189;182;159;191,201;172;625;801;166;166,241;92,93,94,95;186;191,201;174;201;201;801;801;201,212,629,630,631,632,633,634;221;164;627;191,201;260;201;201;166;166;201;65;189;801;201;189;625;201,629,630,631,632,633,634;164;191,201;191,201;625;174;166;597;118;189;201;658;201;201;164;65;201;801;189;201,629,630,631,632,633,634;166;185;801;164;24;166;201,629,630,631,632,633,634;114;166;556;166;186;166;186;191,201;115;168,178;189;201,629,630,631,632,633,634;201;201,629,630,631,632,633,634;166;580;166;341;201;166;114;189;201,212,629,630,631,632,633,634;189;191,201;166;166;189;182;166;174";

const $scriptletHostnames$ = /* 3803 */ ["s.to","ak.sv","g3g.*","hqq.*","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","oko.sh","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","get2.in","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moin.de","movi.pk","mrt.com","msn.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","xfile.*","15min.lt","2embed.*","4game.ru","7mmtv.sx","9xflix.*","a5oc.com","adria.gg","alkas.lt","alpin.de","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cety.app","cnet.com","cybar.to","devlib.*","dlhd.*>>","dooood.*","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","file.org","findav.*","fir3.net","flixhq.*","focus.de","gala.com","game8.jp","golog.jp","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","redis.io","rintor.*","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wdwnt.jp","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xcloud.*","xvip.lat","yabai.si","ytstv.me","zooqle.*","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","24sata.hr","3minx.com","4game.com","4stream.*","5movies.*","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","alc.co.jp","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","beeg.porn","bigwarp.*","blkom.com","bokep.top","camhub.cc","casi3.xyz","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cutty.app","cybar.xyz","d000d.com","d0o0d.com","daddyhd.*","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","exego.app","expres.cz","fap18.net","faqwiki.*","faselhd.*","fc2db.com","file4go.*","finfang.*","fiuxy2.co","fmovies.*","fooak.com","forsal.pl","ftuapps.*","garota.cf","gayfor.us","ghior.com","globo.com","gloria.hr","gplinks.*","grapee.jp","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","igfap.com","imgur.com","imihu.net","innal.top","inxxx.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kickass.*","kissjav.*","knowt.com","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mynet.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","nhlbox.me","nlegs.com","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","raider.io","remaxhd.*","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","rokni.xyz","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seory.xyz","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","stfly.biz","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","tutele.sx","ucptt.com","upzur.com","usi32.com","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vogue.com","voodc.com","vplink.in","waezg.xyz","waezm.xyz","watson.de","wdwnt.com","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xcloud.eu","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","4porn4.com","555fap.com","5ghindi.in","720pflix.*","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","aether.mom","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","appnee.com","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","bmamag.com","boyfuck.me","btvplus.bg","bunshun.jp","buzter.xyz","c-span.org","cashurl.in","cboard.net","cdn256.xyz","cgtips.org","cnpics.org","corral.net","crewus.net","crictime.*","ctpost.com","cutnet.net","cvrain.com","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","drweil.com","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","exambd.net","f1stream.*","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fzmovies.*","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","love4u.net","m.4khd.com","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","motor1.com","movies4u.*","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","otakomu.jp","ovabee.com","paid4.link","paypal.com","pctfenix.*","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prmovies.*","proxybit.*","pxxbay.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thumb8.net","thumb9.net","tiscali.cz","tnmusic.in","top1iq.com","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zpaste.net","11xmovies.*","123movies.*","2monkeys.jp","373news.com","3dsfree.org","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","aipebel.com","airevue.net","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","atravan.net","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bg-mania.jp","bi-girl.net","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bolighub.dk","bowfile.com","btcbitco.in","caitlin.top","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","civinfo.com","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","crx7601.com","cuervotv.me","cults3d.com","cutlink.net","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","downvod.com","dropgame.jp","ds2play.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","embedpk.net","emuenzen.de","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnforum.net","fnjplay.xyz","fntimes.com","focusst.org","fsharetv.cc","fullymaza.*","g-porno.com","gamewith.jp","gbatemp.net","get-to.link","ghbrisk.com","gigafile.nu","gocast2.com","godlike.com","goodcar.com","govtech.com","grasoku.com","gupload.xyz","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","in91vip.win","itopmusic.*","jav-noni.cc","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","jawapos.com","jelonka.com","jetpunk.com","jixo.online","jjang0u.com","jocooks.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","kaliscan.io","karanpc.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","laposte.net","letocard.fr","lexpress.fr","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","mirrorace.*","misterio.ro","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","nodo313.net","nontonx.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","peeplink.in","pelisplus.*","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","rule34.club","sadisflix.*","safetxt.net","samax63.lol","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharing.wtf","shavetape.*","shinbhu.net","shinchu.net","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","syosetu.com","t-online.de","tabooflix.*","tbsradio.jp","teachoo.com","techguy.org","teltarif.de","thehour.com","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","xcloud.host","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","yesmovies.*","youtube.com","yumeost.net","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","46matome.net","4archive.org","4btswaps.com","50states.com","720pstream.*","723qrh1p.fun","7hitmovies.*","aamulehti.fi","adricami.com","alexsports.*","alexsportz.*","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animanch.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","autoc-one.jp","avseesee.com","avsforum.com","bamgosu.site","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepnya.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","capoplay.net","carparts.com","catfish1.com","catforum.com","cesoirtv.com","chaos2ch.com","chatango.com","cheftalk.com","choralia.net","clickapi.net","coingraph.us","crazyblog.in","crewbase.net","cricstream.*","cricwatch.io","cuevana3.fan","cutyurls.com","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","divicast.com","divxtotal1.*","dizikral.com","dogforum.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","edukaroo.com","egyanime.com","ekasiwap.com","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","exe-urls.com","expertvn.com","factable.com","falatron.com","fapptime.com","feed2all.org","fetchpik.com","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","footybite.to","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gulflive.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","huntress.com","ibelieve.com","ihdstreams.*","imagefap.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","jablickar.cz","jav-coco.com","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jp-films.com","kasiporn.com","kazefuri.net","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","learnmany.in","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","luluvdoo.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masslive.com","matacoco.com","mediaite.com","mega-mkv.com","mhdtvworld.*","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkvcinemas.*","mmamania.com","mmsbee42.com","modrinth.com","modsbase.com","modsfire.com","momsdish.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","myflixerz.to","mykitsch.com","nanolinks.in","nbadraft.net","neodrive.xyz","netatama.net","newatlas.com","newsyou.info","neymartv.net","niketalk.com","noni-jav.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","pennlive.com","photopea.com","playertv.net","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","pressian.com","pubfilmz.com","publicearn.*","rainmail.xyz","rapelust.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","ronaldo7.pro","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","ryaktive.com","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","sonixgvn.net","spatsify.com","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","teleclub.xyz","teluguflix.*","terra.com.br","thehindu.com","themezon.net","theverge.com","toonhub4u.me","topdrama.net","topspeed.com","torrage.info","torrents.vip","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","tusfiles.com","tutlehd4.com","tutsnode.org","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","ultraten.net","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","vi-music.app","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","volokit2.com","vpcxz19p.xyz","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xopenload.me","xopenload.pw","xpornium.net","xxxstream.me","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zvision.link","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","1911forum.com","1bitspace.com","247sports.com","4horlover.com","4kwebplay.xyz","560pmovie.com","680thefan.com","6hiidude.gold","7fractals.icu","abc17news.com","abhijith.page","actusports.eu","adblocktape.*","addapinch.com","advertape.net","aeblender.com","aiimgvlog.fun","alexsportss.*","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","bacasitus.com","badmouth1.com","bakedbree.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","bestfonts.pro","bethcakes.com","bettafish.com","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buffstreams.*","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","cefirates.com","chanto.jp.net","cheater.ninja","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","coltforum.com","columbian.com","concomber.com","coolcast2.com","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","daveockop.com","dayspedia.com","depvailon.com","dizikral1.pro","dizikral2.pro","dodgetalk.com","dooodster.com","downfile.site","dphunters.mom","dragontea.ink","drivenime.com","e2link.link>>","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","etoland.co.kr","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fjrowners.com","flixhouse.com","flyfaucet.com","focusstoc.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","gifu-np.co.jp","giornalone.it","globalrph.com","governing.com","gputrends.net","grantorrent.*","gundamlog.com","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","honkailab.com","hornylips.com","hoyoverse.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","indiewire.com","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itunesfre.com","javsunday.com","jimdofree.com","jisakuhibi.jp","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","kamababa.desi","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","krussdomi.com","kurashiru.com","lifehacker.jp","likemanga.ink","listar-mc.net","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lowellsun.com","m.inven.co.kr","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","motor-talk.de","moutogami.com","moviekhhd.biz","moviepilot.de","moviesverse.*","movieswbb.com","moviezwaphd.*","mp4upload.com","multicanais.*","musescore.com","myflixertv.to","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","overclock.net","ozlosleep.com","pagalworld.cc","pandamovie.in","pc-builds.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","phineypet.com","picdollar.com","pillowcase.su","pinkueiga.net","pirateiro.com","pitchfork.com","pkbiosfix.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","ramforumz.com","rarethief.com","raskakcija.lt","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rnbxclusive.*","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","s3embtaku.pro","saboroso.blog","savefiles.com","scatkings.com","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","silverblog.tv","silverpic.com","simana.online","sinsitio.site","skymovieshd.*","smartworld.it","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","speedporn.net","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","srtforums.com","starstyle.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","swissotel.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","tapmyback.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","thekitchn.com","thelayoff.com","thepoke.co.uk","thethings.com","thothub.today","tiermaker.com","timescall.com","timesnews.net","tlnovelas.net","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","vibestreams.*","vid-guard.com","vidspeeds.com","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","xcamcovid.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zorroplay.xyz","123movieshub.*","300cforums.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","9to5google.com","actugaming.net","acuraworld.com","aerotrader.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcryptoz.net","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","androidacy.com","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","artoffocas.com","ashemaletube.*","balkanteka.net","bhugolinfo.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buchstaben.com","camberlion.com","cheatsheet.com","choco0202.work","cine-calidad.*","clashdaily.com","clicknupload.*","cloudvideotv.*","clubsearay.com","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","cuevana3hd.com","cumception.com","curseforge.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dofusports.xyz","dolldivine.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","expatforum.com","extreme-down.*","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","filmizleplus.*","filmy4waps.org","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","foodtechnos.in","fordescape.org","fordforums.com","forex-trnd.com","formyanime.com","forumchat.club","foxyfolksy.com","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","galleryxh.site","gamepcfull.com","gameshop4u.com","gameskinny.com","gayforfans.com","gaypornhot.com","gearpatrol.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gravureblog.tv","gujjukhabar.in","gyanitheme.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hotgranny.live","hotukdeals.com","hwnaturkya.com","iisfvirtual.in","imgtraffic.com","indiatimes.com","infogenyus.top","inshorturl.com","insidehook.com","instanders.app","ios.codevn.net","iplayerhls.com","iplocation.net","isabeleats.com","isekaitube.com","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jizzbunker.com","joemonster.org","joyousplay.xyz","jpopsingles.eu","jyoseisama.com","kakarotfoot.ru","katoikos.world","kickassanime.*","kijolariat.net","kompasiana.com","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","mactechnews.de","mahajobwala.in","mahitimanch.in","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","marcialhub.xyz","mastkhabre.com","megapastes.com","meusanimes.net","midebalonu.net","mkv-pastes.com","monacomatin.mc","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mumuplayer.com","mundowuxia.com","my.irancell.ir","myeasymusic.ir","nana-press.com","naszemiasto.pl","nayisahara.com","newmovierulz.*","news-buzz1.com","news30over.com","nhregister.com","nookgaming.com","nowinstock.net","o2tvseries.com","ocregister.com","ohsheglows.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","pandamovies.me","pandamovies.pw","pandaspor.live","paste-drop.com","pastemytxt.com","pelando.com.br","pencarian.link","petitrobert.fr","pinchofyum.com","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playtube.co.za","populist.press","pornhd720p.com","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","projeihale.com","proxyninja.org","qiqitvx84.shop","quest4play.xyz","record-bee.com","reisefrage.net","remixsearch.es","resourceya.com","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","singjupost.com","sizecharts.net","skidrowcpy.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speisekarte.de","spieletipps.de","sportsurge.net","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","studyfinds.org","superhonda.com","supexfeeds.com","swatchseries.*","swipebreed.net","swordalada.org","tamilprinthd.*","tea-coffee.net","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","topcryptoz.net","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","toyokeizai.net","tracktheta.com","trannyteca.com","trentonian.com","troyrecord.com","tvs-widget.com","tvseries.video","twincities.com","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vahantoday.com","videocelts.com","vikistream.com","visifilmai.org","viveseries.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wellplated.com","wikifilmia.com","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xclusivejams.*","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yourupload.com","zeroupload.com","51bonusrummy.in","acedarspoon.com","adrinolinks.com","adz7short.space","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","allthetests.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","areaconnect.com","arstechnica.com","audiotools.blog","audioz.download","averiecooks.com","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxingstream.me","brilian-news.id","budgetbytes.com","buffstreams.app","bussyhunter.com","can-amforum.com","careersides.com","cempakajaya.com","chollometro.com","cizgivedizi.com","clubtouareg.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","cryptoearns.com","cycleforums.com","cycletrader.com","dailybreeze.com","dailycamera.com","diariovasco.com","dieselplace.com","diychatroom.com","dizipal1521.com","dizipal1522.com","dizipal1523.com","dizipal1524.com","dizipal1525.com","dizipal1526.com","dizipal1527.com","dizipal1528.com","dizipal1529.com","dizipal1530.com","dizipal1531.com","dizipal1532.com","dizipal1533.com","dizipal1534.com","dizipal1535.com","dizipal1536.com","dizipal1537.com","dizipal1538.com","dizipal1539.com","dizipal1540.com","dizipal1541.com","dizipal1542.com","dizipal1543.com","dizipal1544.com","dizipal1545.com","dizipal1546.com","dizipal1547.com","dizipal1548.com","dizipal1549.com","dizipal1550.com","dizipal1551.com","dizipal1552.com","dizipal1553.com","dizipal1554.com","dizipal1555.com","dizipal1556.com","dizipal1557.com","dizipal1558.com","dizipal1559.com","dizipal1560.com","dizipal1561.com","dizipal1562.com","dizipal1563.com","dizipal1564.com","dizipal1565.com","dizipal1566.com","dizipal1567.com","dizipal1568.com","dizipal1569.com","dizipal1570.com","dizipal1571.com","dizipal1572.com","dizipal1573.com","dizipal1574.com","dizipal1575.com","dizipal1576.com","dizipal1577.com","dizipal1578.com","dizipal1579.com","dizipal1580.com","dizipal1581.com","dizipal1582.com","dizipal1583.com","dizipal1584.com","dizipal1585.com","dizipal1586.com","dizipal1587.com","dizipal1588.com","dizipal1589.com","dizipal1590.com","dizipal1591.com","dizipal1592.com","dizipal1593.com","dizipal1594.com","dizipal1595.com","dizipal1596.com","dizipal1597.com","dizipal1598.com","dizipal1599.com","dizipal1600.com","dl-protect.link","doctormalay.com","donnerwetter.de","dopomininfo.com","dreamchance.net","e46fanatics.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","egoallstars.com","elamigosweb.com","empire-stream.*","esportivos.site","exactpay.online","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fmradiofree.com","footyhunter.lol","framedcooks.com","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gazetaprawna.pl","gentosha-go.com","geogridgame.com","gewinnspiele.tv","girlscanner.org","girlsreport.net","gofile.download","gowatchseries.*","gratispaste.com","greatandhra.com","gut-erklaert.de","hamrojaagir.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hotcopper.co.nz","hummusapien.com","idoitmyself.xyz","ilovetoplay.xyz","infosgj.free.fr","istreameast.app","japangaysex.com","jkssbalerts.com","juliasalbum.com","jumpsokuhou.com","khatrimazaful.*","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","kurashinista.jp","lamarledger.com","ldoceonline.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lordchannel.com","lulustream.live","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","matomeblade.com","matomelotte.com","mediacast.click","mentalfloss.com","mercurynews.com","miamiherald.com","miniwebtool.com","mobilestalk.net","modernhoney.com","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","myanimelist.net","nativesurge.net","naughtypiss.com","news-herald.com","news.zerkalo.io","niice-woker.com","noindexscan.com","nomnompaleo.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nuxhallas.click","nydailynews.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","phillyvoice.com","phongroblox.com","picsxxxporn.com","pilotonline.com","piratehaven.xyz","pisshamster.com","popdaily.com.tw","powerstroke.org","premiumporn.org","projectfreetv.*","punishworld.com","qatarstreams.me","rank1-media.com","readbitcoin.org","readhunters.xyz","remixsearch.net","reportera.co.kr","resizer.myct.jp","rnbastreams.com","robloxforum.com","rugbystreams.me","rustorkacom.lib","saikyo-jump.com","sampledrive.org","sat-sharing.com","seir-sanduk.com","sfchronicle.com","shadowrangers.*","shemalegape.net","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","streamnoads.com","stylecaster.com","sudokutable.com","suicidepics.com","sweetie-fox.com","tackledsoul.com","tapeantiads.com","tapeblocker.com","tennisstreams.*","theblueclit.com","thebullspen.com","themoviesflix.*","theporndude.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","truthsocial.com","trybawaryjny.pl","tuktukcinma.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","valhallas.click","vipsister23.com","viralharami.com","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","zakuzaku911.com","2coolfishing.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","asyaanimeleri.pw","backfirstwo.site","bananamovies.org","barbarabakes.com","batmanfactor.com","bestgirlsexy.com","bestpornflix.com","blog.esuteru.com","blog.livedoor.jp","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","buzzfeednews.com","canalesportivo.*","charexempire.com","chinese-pics.com","choosingchia.com","clever-tanken.de","clickndownload.*","clickorlando.com","coloradofans.com","coloredmanga.com","comidacaseira.me","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","cryptofactss.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cybercityhelp.in","cyclingabout.com","dailyfreeman.com","dailytribune.com","dailyuploads.net","darknessporn.com","dartsstreams.com","dataunlocker.com","detikkebumen.com","directupload.net","dobermantalk.com","dodgedurango.net","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","duramaxforum.com","eastbaytimes.com","empire-streamz.*","enclaveforum.net","f150ecoboost.net","familyporner.com","favoyeurtube.net","feedmephoebe.com","filecatchers.com","filespayouts.com","financacerta.com","firearmstalk.com","flagandcross.com","flatpanelshd.com","flyfishing.co.uk","football-2ch.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","funkeypagali.com","gamesrepacks.com","gaydelicious.com","genialetricks.de","getviralreach.in","giurgiuveanul.ro","gledajcrtace.xyz","go.gets4link.com","godstoryinfo.com","gourmetscans.net","gsm-solution.com","hallofseries.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hotcopper.com.au","howsweeteats.com","husseinezzat.com","ikarishintou.com","imagereviser.com","infinityfree.com","inspiralized.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","justfullporn.net","kakarotfoot.ru>>","khatrimazafull.*","kijolifehack.com","kimscravings.com","kingstreamz.site","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","mathplayzone.com","meconomynews.com","megapornpics.com","millionscast.com","moneycontrol.com","mostlymorgan.com","moviesmod.com.pl","mrproblogger.com","mydownloadtube.*","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newedutopics.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nocrumbsleft.net","o2tvseries4u.com","ojearnovelas.com","onionstream.live","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","plainchicken.com","player.buffed.de","powerover.online","powerover.site>>","pricearchive.org","programme-tv.net","protrumpnews.com","puzzlegarage.com","raetsel-hilfe.de","readingeagle.com","rebajagratis.com","repack-games.com","ripexbooster.xyz","rocketnews24.com","rollingstone.com","rsoccerlink.site","rule34hentai.net","saradahentai.com","shutterstock.com","skidrowcodex.net","smartermuver.com","solitairehut.com","south-park-tv.fr","soxprospects.com","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","statecollege.com","stellanspice.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","techkhulasha.com","telcoinfo.online","text-compare.com","thebakermama.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","thefitbrit.co.uk","theflowspace.com","thegadgetking.in","thelinuxcode.com","thenerdstash.com","tomshardware.com","topvideosgay.com","total-sportek.to","trainerscity.com","trendytalker.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","valeriabelen.com","veryfreeporn.com","vichitrainfo.com","voiranime.stream","voyeurfrance.net","watchfreexxx.net","watchmmafull.com","weblivehdplay.ru","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","xhamsterporno.mx","yifysubtitles.ch","yourcountdown.to","youwatchporn.com","ziggogratis.site","4chanarchives.com","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","amandascookin.com","andhrafriends.com","androidpolice.com","armypowerinfo.com","atlasandboots.com","auto-crypto.click","bakedbyrachel.com","banglagolpo.co.in","basketballbuzz.ca","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","blizzboygames.net","blog.tangwudi.com","buildtheearth.net","butterbeready.com","cadryskitchen.com","cagesideseats.com","caliberforums.com","camchickscaps.com","cdn.tiesraides.lv","chaptercheats.com","chargerforums.com","chargerforumz.com","cichlid-forum.com","cinemastervip.com","claplivehdplay.ru","cocokara-next.com","coloradodaily.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","crackstreamer.net","cryptednews.space","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","deepgoretube.site","deutschepornos.me","ditjesendatjes.nl","dl.apkmoddone.com","drinkspartner.com","ducatimonster.org","economictimes.com","euro2024direct.ru","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","filmesonlinex.org","fitnesssguide.com","focusfanatics.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","frugalvillage.com","funtasticlife.com","fwmadebycarli.com","galonamission.com","gamejksokuhou.com","gamesmountain.com","gardeningsoul.com","gaypornhdfree.com","globalstreams.xyz","hdfilmcehennemi.*","headlinerpost.com","hentaitube.online","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","innateblogger.com","intouchweekly.com","iphoneincanada.ca","islamicfinder.org","jaysbrickblog.com","kbconlinegame.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","laughingsquid.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lighterlegend.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","marineinsight.com","mdzsmutpcvykb.net","miaminewtimes.com","midhudsonnews.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","multicanaistv.com","musicfeeds.com.au","nationaltoday.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","okusama-kijyo.com","olympicstreams.co","ondemandkorea.com","opensubtitles.org","outdoormatome.com","paranormal-ch.com","pcgeeks-games.com","pinayscandalz.com","player.pcgames.de","plugintorrent.com","pornoenspanish.es","pressandguide.com","presstelegram.com","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","read-onepiece.net","reidoscanais.life","republicbrief.com","restlessouter.net","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","savemoneyinfo.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","shugarysweets.com","sideplusleaks.net","siliconvalley.com","soccerworldcup.me","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","starxinvestor.com","steamidfinder.com","steamseries88.com","stellarthread.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","substitutefor.com","sumaburayasan.com","superherohype.com","supertipzz.online","tablelifeblog.com","thaihotmodels.com","thecelticblog.com","thecubexguide.com","thefreebieguy.com","thegamescabin.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","tightsexteens.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tokusatsuindo.com","toyotaklub.org.pl","tradingfact4u.com","truyen-hentai.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","umatechnology.org","unsere-helden.com","viralitytoday.com","visualnewshub.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","atlasstudiousa.com","australiaforum.com","authenticateme.xyz","backforseconds.com","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","bimmerforums.co.uk","blackporncrazy.com","blog-peliculas.com","bluemediastorage.*","browneyedbaker.com","businessinsider.de","businessinsider.jp","cadillacforums.com","calculatorsoup.com","challengertalk.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","codingnepalweb.com","contractortalk.com","correotemporal.org","cr7-soccer.store>>","crooksandliars.com","dakota-durango.com","defensivecarry.com","descargaspcpro.net","digital-thread.com","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","downshiftology.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","feastingathome.com","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","fjlaboratories.com","flacdownloader.com","footballchannel.jp","fordfusionclub.com","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","future-fortune.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","germancarforum.com","greeleytribune.com","haveibeenpwned.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hopepaste.download","hungrypaprikas.com","hyundaitucson.info","iamhomesteader.com","insider-gaming.com","insurancesfact.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","jocjapantravel.com","kijyomatome-ch.com","laleggepertutti.it","leckerschmecker.me","lifeinleggings.com","listentotaxman.com","liveandletsfly.com","makeincomeinfo.com","maketecheasier.com","marinetraffic.live","mediaindonesia.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","moviesonlinefree.*","mrmakeithappen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","nlab.itmedia.co.jp","nourishedbynic.com","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","pancakerecipes.com","panel.play.hosting","player.gamezone.de","playoffsstream.com","pornfetishbdsm.com","porno-baguette.com","readcomiconline.li","reporterherald.com","ricettafitness.com","samsungmagazine.eu","shuraba-matome.com","siamblockchain.com","skyscrapercity.com","softwaredetail.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","steamclouds.online","steamcommunity.com","stream.nflbox.me>>","strtapeadblocker.*","subaruforester.org","talkforfitness.com","tapeadsenjoyer.com","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","theendlessmeal.com","thefashionspot.com","thefirearmblog.com","thepolitistick.com","tiktokrealtime.com","times-standard.com","torrentdosfilmes.*","travelplanspro.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","100percentfedup.com","adblockstreamtape.*","adrino1.bonloan.xyz","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","asumsikedaishop.com","awellstyledlife.com","barcablaugranes.com","bchtechnologies.com","betweenjpandkr.blog","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","brighteyedbaker.com","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dk.pcpartpicker.com","download.megaup.net","driveteslacanada.ca","duckhuntingchat.com","dvdfullestrenos.com","electriciantalk.com","embed.wcostream.com","equipmenttrader.com","estrenosdoramas.net","filmesonlinexhd.biz","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","foxeslovelemons.com","franceprefecture.fr","frustfrei-lernen.de","girlsvip-matome.com","hdfilmcehennemi2.cx","historicaerials.com","hometownstation.com","honeygirlsworld.com","honyaku-channel.net","hoosierhomemade.com","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","kenzo-flowertag.com","kitimama-matome.net","kreuzwortraetsel.de","learnmarketinfo.com","lifeandstylemag.com","lite.duckduckgo.com","logicieleducatif.fr","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","melskitchencafe.com","mendocinobeacon.com","middletownpress.com","minimalistbaker.com","movie-locations.com","mykoreankitchen.com","nandemo-uketori.com","negyzetmeterarak.hu","orlandosentinel.com","paidshitforfree.com","pendidikandasar.net","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","pressenterprise.com","promodescuentos.com","radio-australia.org","radio-osterreich.at","registercitizen.com","rojadirectaenvivo.*","royalmailchat.co.uk","secondhandsongs.com","shoot-yalla-tv.live","skidrowreloaded.com","smartkhabrinews.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","thecookierookie.com","thefoodieaffair.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thewatchseries.live","truyentranhfull.net","turkishseriestv.org","viewmyknowledge.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","whatjewwannaeat.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","adultdvdparadise.com","advertisingexcel.com","allthingsthrifty.com","androidauthority.com","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","brushnewstribune.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","crackstreamshd.click","dailynewshungary.com","dailytruthreport.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","detailingworld.co.uk","digitalcorvettes.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","fordmuscleforums.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gametechreviewer.com","gesundheitsfrage.net","heartlife-matome.com","houstonchronicle.com","ibreatheimhungry.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jljbacktoclassic.com","journal-advocate.com","juliescafebakery.com","keedabankingnews.com","kugaownersclub.co.uk","laweducationinfo.com","lehighvalleylive.com","letemsvetemapplem.eu","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda3revolution.com","meilleurpronostic.fr","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","mt-soft.sakura.ne.jp","neighborfoodblog.com","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","pasadenastarnews.com","player.smashy.stream","popularmechanics.com","pornstarsyfamosas.es","receitasdaora.online","redcurrantbakery.com","relevantmagazine.com","reptilesmagazine.com","securenetsystems.net","seededatthetable.com","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","tasteandtellblog.com","techsupportforum.com","thebeautysection.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videostreaming.rocks","viralviralvideos.com","windsorexpress.co.uk","yourhomebasedmom.com","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","barnsleychronicle.com","bigleaguepolitics.com","burlington-record.com","celebritynetworth.com","celiacandthebeast.com","client.pylexnodes.net","collinsdictionary.com","creative-culinary.com","documentaryplanet.xyz","dragontranslation.com","eroticmoviesonline.me","foreverwallpapers.com","forum.release-apk.com","hackerranksolution.in","hollywoodreporter.com","hoodtrendspredict.com","invoice-generator.com","journaldemontreal.com","julesburgadvocate.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","mountainmamacooks.com","mybakingaddiction.com","notformembersonly.com","pelotalibrevivo.net>>","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","runningonrealfood.com","santacruzsentinel.com","snapinstadownload.xyz","sousou-no-frieren.com","statisticsanddata.org","streamservicehd.click","tapeadvertisement.com","tech.trendingword.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","timesheraldonline.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","watchkobestreams.info","whittierdailynews.com","zone-telechargement.*","ahdafnews.blogspot.com","allevertakstream.space","andrenalynrushplay.cfd","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","canadianmoneyforum.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","crunchycreamysweet.com","dallashoopsjournal.com","drop.carbikenation.com","elrefugiodelpirata.com","eurointegration.com.ua","fertilityfriends.co.uk","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","jpop80ss3.blogspot.com","littlesunnykitchen.com","mexicanfoodjournal.com","mycolombianrecipes.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","player.gamesaktuell.de","portaldasnovinhas.shop","redlandsdailyfacts.com","shakentogetherlife.com","shutupandtakemyyen.com","smartfeecalculator.com","sonsoflibertymedia.com","totalsportek1000.com>>","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","bajarjuegospcgratis.com","excelsiorcalifornia.com","footballtransfer.com.ua","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","fromvalerieskitchen.com","healthyfitnessmeals.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","laurelberninteriors.com","makefreecallsonline.com","newlifeonahomestead.com","nothingbutnewcastle.com","osteusfilmestuga.online","pcoptimizedsettings.com","platingsandpairings.com","player.smashystream.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thecurvyfashionista.com","theplantbasedschool.com","afilmyhouse.blogspot.com","astraownersnetwork.co.uk","awealthofcommonsense.com","broomfieldenterprise.com","canoncitydailyrecord.com","dictionary.cambridge.org","dimensionalseduction.com","first-names-meanings.com","freelancer.taxmachine.be","healthylittlefoodies.com","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","mediapemersatubangsa.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","spaghetti-interactive.it","stacysrandomthoughts.com","stresshelden-coaching.de","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","thewanderlustkitchen.com","tip.etip-staging.etip.io","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","betweenenglandandiowa.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dictionnaire.lerobert.com","greatamericanrepublic.com","player.pcgameshardware.de","practicalselfreliance.com","sentinelandenterprise.com","sportsgamblingpodcast.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","keyakizaka46matomemory.net","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","thenonconsumeradvocate.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","aprettylifeinthesuburbs.com","beautifulfashionnailart.com","forums.socialmediagirls.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","russianmachineneverbreaks.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
