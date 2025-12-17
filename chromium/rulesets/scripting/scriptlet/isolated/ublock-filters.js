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
[replaceNodeText,removeNodeText,trustedCreateHTML,trustedSetAttr,trustedSetLocalStorageItem,setCookie,setAttr,preventRefresh,removeCookie,setLocalStorageItem,trustedSetCookie,hrefSanitizer,trustedClickElement,removeClass,closeWindow,multiup,setSessionStorageItem,trustedSetCookieReload];

const $scriptletArgs$ = /* 1037 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const t={apply:(t,e,o)=>{const n=o[0];return\"function\"==typeof n&&n.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(t,e,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i","ins.adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4999999999&adk=1777777777&adf=1059123170&pi=t.ma~as.4999999999&w=300&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\"></iframe></div>","20000","ins.adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6644444444&adk=622222222&adf=1800000000&pi=t.ma~as.6644444444&w=311&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=6111111111111&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=7778888888888890&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\"></iframe></div>","ins.adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4999999999&adk=3666666666&adf=1000000000&pi=t.ma~as.4999999999&w=336&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4555555555888&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4222228888888888&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\"></iframe></div>","body","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1777777777&adf=3000000000&lmt=1777777777&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=966666666666&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12222222&ady=-12244444&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","*:not(.main-wrap:has(~ [id^=\"nitro-sidebar\"] .nitro-side) #nitro-top,.main-wrap:has(~ [id^=\"nitro-sidebar\"] .nitro-side) #nitro-body-desktop,[id^=\"nitro-sidebar\"]:has(.nitro-side) ~ #nitro-header-mobile) > ins.adsbygoogle:not(:has(#aswift_0_host))","filled","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","unlock_chapter_guest","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","/document\\.createElement|\\.banner-in/","admbenefits","ref_cookie","/\\badblock\\b/","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","imps","3","reload","adexp","31000, .VerifyBtn, 100, .exclude-pop.NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/ABDetected|navigator.brave|fetch/","Android/","false/","stay","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","AdbModel","/popup/i","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","window.open","timeLeft = duration","timeLeft = 1","/aclib|break;|zoneNativeSett/","/fetch|popupshow/","justDetectAdblock",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","/\\d{4}/gm","count","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","true","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","(isAdsenseBlocked)","(false)","onDevToolOpen","/#Intent.*?end/","intent","https","firstp","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","3000","getElementById","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","/window\\.location\\.href.*?;/","_blank","_self","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","ai_adb","\"v4ac1eiZr0\"","admiral","'').split(',')[4]","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","html-load.com","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","\"data-sdk\"","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","domain=?eventId=&error=",";confirm(","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/window.open.*/gms","window.open(url, \"_self\");}","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","style","text-decoration","/break;case|FingerprintJS/","push","(isAdblock)","get-link",".ybtn.get-link[target=\"_blank\"]","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64",".btn-success.get-link[target=\"_blank\"]","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","__adblocker","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","charCodeAt","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","localStorage","popunder","adbl","/protect?","disabled","a#redirect-btn","head","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","= getSetTimeout()","= function newTimeout(func, timer) {func()}","ab","IFRAME","BODY","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","const ad_slot_","(()=>{window.addEventListener(\"load\",(()=>{document.querySelectorAll(\"ins.adsbygoogle\").forEach((element=>element.dataset.adsbygoogleStatus=\"done\"))}))})();const ad_slot_","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","window.googletag.pubads","'flex'","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","/getComputedStyle|overlay/","in_d4","hanime.tv","p","/videoAssetId.+introSplashVideo.+renderStoresWidgetsPendingList/s",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","offsetHeight","student_id",".offsetLeft","banner:","nobanner:","AdBlockChecker",".modal-content","document.body.innerHTML","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 822 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13,14;2,15,16,14;2,17,18,14;2,19,20,14;3,21,22,23;3,24,22,25;0,0,26,27;0,0,28;0,0,29,30;1,0,31;1,0,32;1,0,33,34,35;0,0,36,37;4,38,39,40,41,42,43,44,45,46,47,48;5,49,4;0,0,50,51;6,52,53,54;7;0,0,55,56;0,0,57,58,59,60;5,61,4;8,62;9,62,63;0,0,64,65;1,0,66;10,67,68,69,68,70,71;0,0,72,73;1,0,74;0,0,75,76;1,0,33;1,0,77;1,0,78;1,0,79;1,0,80;1,0,81;5,82,4;1,0,83;5,84,85;5,86,4;1,0,87;0,0,88,89;0,0,90,91;8,92;1,0,93;1,0,94;1,0,95;11,96,97;1,0,98;0,0,99,68,59,100;1,0,101;1,0,102;1,0,103;8,104;1,0,105;1,0,106;0,0,107;1,0,108;1,0,109;0,0,110,111;0,0,112;0,0,113,114;0,0,115,116;1,0,117;0,0,118,119;1,0,120;5,121,4;5,122,4;5,123,4;1,0,124;1,0,125;9,126,63;5,127,128,68,129,4;5,130,4,68,129,4;12,131;0,0,132,133;0,0,134,135,59,136;0,0,137,138;0,0,139,140;1,0,141;1,0,142;0,0,143,144,145,4;0,0,146,73;0,0,147,148;1,0,149;1,0,150;0,0,151,148,59,152;0,0,153,68,59,154;0,0,155,4,59,156;0,0,157,158;13,159;1,0,160;1,0,161;0,0,162,163;0,0,164,165;10,166,167;0,0,168,69,59,169;0,0,170,148,59,169;1,0,171;0,0,172,173,3,174;1,0,175;1,0,176;0,0,177;0,0,178,73;0,0,179,68,59,180;1,0,181;1,0,182;1,0,183;0,0,184,185;1,0,186;1,0,187;5,188,4;1,0,189;1,0,190;1,0,191;1,0,192;0,0,193,194;1,0,195;1,0,196;1,0,197;0,0,198,68,59,199;0,0,200,201;5,202,4;0,0,203,204;1,0,205;0,0,206,148,59,207;0,0,208,209,59,207;0,0,210,211;0,0,212,213;0,0,214,215;1,0,216;0,0,217,218;0,0,219,73;0,0,37,135,59,220;0,0,221,222;0,0,223,73;1,0,224;1,0,225;0,0,226,227,228,229;0,0,230,231;1,0,232;0,0,233;0,0,234,235;1,0,236;0,0,237,73;0,0,238,239;1,0,240;1,0,241;0,0,242,148,59,243;1,0,244;0,0,245,73;0,0,246,148;1,0,247;0,0,248;0,0,249,250;1,0,251;1,0,252;1,0,253;1,0,254;1,0,255;1,0,256;1,0,257;0,0,258,259;1,0,260;1,0,261;0,0,262,263;1,0,264;1,0,265;1,0,266;0,0,267;1,0,268;1,0,269;1,0,270;1,0,271;1,0,272;1,0,273;1,0,274;1,0,275;1,0,276;1,0,277;1,0,278;1,0,279;0,0,280,281,3,4;0,0,282,283;0,0,284,285;0,0,286,287;0,0,284,288;0,0,284,289;0,0,290,291,3,4;0,0,292,293,3,4;0,0,294,295,59,296;1,0,297;1,0,296;1,0,298;1,0,299;1,0,300;1,0,301;1,0,302;1,0,303;1,0,304;1,0,305;1,0,306;1,0,307;1,0,308;1,0,309;1,0,310;1,0,311;0,0,312,313,59,314;0,0,315,316;0,0,317,318;12,319,68,320;1,0,321;1,0,322;1,0,323;1,0,324;1,0,325;1,0,326;1,0,327;1,0,328;1,0,329;1,0,330;0,0,331,332;1,0,333;0,0,334,335,3,4;0,0,336,337;5,338,174;0,0,339,340,59,341;0,0,342,343;0,0,344,345,3,4;0,0,346;0,0,347,348;1,0,349;1,0,350;0,0,351,352;13,353;1,0,354;5,355,4;0,0,356;1,0,357;9,358,222;1,0,359;1,0,360;1,0,361;10,362,363,68,68,70,364;1,0,365;8,280;0,0,366,367;0,0,368,316,59,369;8,370;9,370,63;5,371,4;1,372,373;1,0,374;1,0,375;0,0,376,231;13,377,378,145;1,0,379;11,380,381;13,377,382,145;0,372,383,384;13,385,386,145;13,387,388,145;5,389,4;13,390;8,391;1,0,392;13,393,394,145;1,0,395;1,0,396;1,0,397;0,0,398,399;13,400,401;13,400,402;1,0,403;1,0,404;1,0,405;5,404,4;14,406;13,407,408;2,409,410;1,0,411;0,0,412,413,59,414;1,0,415;8;1,0,416;5,417,4;1,0,418;1,0,419;5,420,85;1,0,421;1,0,422;1,0,423;1,0,424;8,425;9,425,63;6,426,53,427;5,188,428,68,129,4;10,429,430;0,372,431,432,59,433;1,0,434;1,0,435;1,0,436;1,0,437;1,0,438;13,439;0,0,440,441;13,442,443;9,444,222;11,445,446;1,0,447;8,448;5,449,4;5,450,222;1,0,451;1,372,452;13,453,68,145;1,0,454;15;1,0,146,59,109;1,0,455;1,0,456;1,0,457;0,0,458,459;1,0,460;1,0,461;8,462;1,0,463;1,0,464;1,465,466;1,465,467;1,465,468;1,465,469;1,465,470;1,465,471;1,465,472;1,0,473;1,465,474;0,0,475;12,476;1,0,477;0,0,478,479,3,4;0,0,480,73;12,481;0,0,482,483,59,484;11,485,486;11,487,446;1,0,488;1,0,489;1,0,490;1,0,491;1,0,492;1,0,493;1,0,494;1,0,495;1,0,496;5,497,4;1,0,498;1,0,499;1,0,500;1,0,501;0,0,502,503,59,504;9,505,174;0,0,506,68,59,507;6,508,53,509;1,0,510;13,511,512;1,0,513;1,0,514;11,515,446;0,0,516,517,59,518;5,519,4,68,129,4;1,0,520;1,0,521;1,0,522;1,0,523;1,0,524;1,0,525;1,0,526;1,0,527;1,0,528;0,0,529,530;8,531;0,0,532,533;1,0,534;1,0,535;1,0,536;1,0,537;0,0,538,231;0,539,540;1,0,541;1,0,542;1,0,543;0,0,544,545;1,0,546;7,547;9,548,222;1,0,549;1,0,550;1,0,551;1,0,552;1,0,553;0,0,554,555;12,556;13,557,558;1,0,559;12,560;1,0,561;0,0,562,563;0,0,564,565;1,0,566;1,0,567;0,0,568,569;0,0,570,571;0,0,572,231;5,573,4;5,574,4;1,0,575;5,576,222,68,129,4;0,0,404,68,59,404,145,4;8,577;0,0,578,316;0,0,579,231;1,0,580;0,0,581,582,3,4;1,0,583;1,0,584;1,0,585;1,0,586;5,587,4;1,0,588;5,589,4;1,0,590;5,591,4;10,592,593;1,0,594;0,0,595,596;1,0,597;1,0,598;1,0,599;1,0,600;16,601,63;6,602,53,603;5,404,85;1,0,604;1,0,605;0,0,606,222;0,0,607,316;1,0,608;0,0,609,68,59,566;1,0,610;1,0,611;16,612,222;0,0,613,614;0,0,615,616;5,617,4;5,618,4;1,0,619;0,0,620,621;9,622,63;0,0,623,624;5,625,4,68,129,4;0,0,626;1,627,628;0,0,629,73;1,0,630;5,631,4,68,129,4;0,0,632,68,59,633;0,0,634,635;1,0,636;1,0,637;16,638,222;1,0,639;1,0,640;9,641,73;1,0,642;0,0,643,644,59,645;1,0,646;1,0,647;1,0,648;0,0,649,650,3,4;5,651,4;1,0,652;10,653,167;1,0,654;1,0,655;0,0,284,656,3,4;1,0,657;0,0,658,659,3,4;1,0,660;0,0,661;0,0,662,663;1,0,664;1,0,665;1,0,666;1,0,667;0,372,668,669;0,0,670,671;1,0,672;5,673,4;1,0,674;9,675,222;1,0,676;0,0,677,678;5,679,4;1,0,680;0,0,7,681;1,0,682;1,0,683;3,684,685,686;1,0,687;13,688,689;1,0,690;10,691,4,68,68,70,692;0,0,404,693;1,0,694;12,695,68,696;1,0,697;8,698;1,0,699;1,0,700;1,0,701;10,702,703;1,0,704;1,0,705;1,0,706;0,0,707,222;1,0,708;1,0,709;0,0,710,711,3,4;9,712,63;1,0,713;0,0,714,715;0,0,716;1,0,717;17,718,718;1,0,719;13,720,68,145;5,721,4;8,722;1,0,391;16,723,724;1,0,725;0,0,726,727;1,0,728;0,0,729;1,0,730;1,0,731;1,0,732;1,0,733;1,0,734;8,735;10,736,222,68,68,129,4;1,0,737;1,0,738;1,0,739;5,740,222;1,0,741;1,0,742;1,0,743;0,0,744,68;5,745,222;5,746,222;1,0,747;1,0,748;1,0,199;0,0,749;9,750,4;4,751,167;1,0,752;1,0,753;1,0,754;1,0,755;10,756,757;2,19,758;1,0,759;1,0,35;0,0,760,761;0,0,284,762,3,4;0,0,763,764,3,4;0,0,765,766;1,0,767;1,0,768;1,0,769;5,770,4;5,771,4,68,129,4;11,772,381;1,0,773;0,0,774,775;0,0,226,776;0,0,777,778;0,0,779;1,0,780;1,0,781;0,0,782,783;1,0,784;1,0,785;1,0,786;1,0,787;1,0,788;1,0,789;1,465,790;1,0,791;1,0,792;1,0,793;9,794,63;1,0,795;0,0,796,797;1,0,798;1,372,799;1,0,800;6,801,802,4;1,0,803;1,0,804;1,0,805;1,0,806;9,807,63;9,808,63;9,809,63;9,810,63;9,811,63;9,812,63;11,813,446;8,814,815,816;9,817,63;11,818,446;11,819,820;9,821,63;11,822,823;11,824,825;11,826,446;11,827,828;11,829,830;11,831,97;11,832,828;11,833,446;11,834,830;11,835,836;11,837,446;11,838,446;11,839,828;11,840,841;11,842,446;11,843,446;11,844,830;11,845,846;11,847,446;11,848,849;11,850,851;11,852,446;11,853,97;11,854,446;11,855,856;11,857,858;11,859,860;11,861,862;11,863,864;11,865,830;11,866,446;11,867,868;11,869,446;11,870,871;11,872,873;11,874,446;11,875,876;11,877,878;11,879,880;11,881,446;11,882,883;11,884,446;11,885,446;8,886;8,887;8,888;8,889,815,816;8,890;8,891;8,892,815,816;8,893;10,892,68,69;5,894,428;5,895,428;8,896;8,897;8,898;8,899,815,816;8,900,815,816;9,901,63;16,902,63;8,903;9,904,63;8,905,815,816;10,905,69,68,68,70,906;8,907,815,816;10,908,68,69,68,70,909;8,910;8,911,815,816;9,912,63;16,913,63;8,914,815,816;8,915;9,916,63;8,917;9,918,63;8,919,815,816;8,920;8,921;8,922,815,816;9,923,63;16,924,63;8,925,815,816;8,926,815,816;9,927,63;8,928;8,929,815,816;9,930,63;8,931,815,816;8,932,815,816;9,933,63;16,933,63;8,934;8,935;9,935,63;9,936,63;9,937,63;10,938,68,69,68,70,939;10,940,68,69,68,70,939;9,941,63;8,942,815,816;9,943,63;9,944,63;8,945;8,946;8,947,815,816;9,948,63;8,949,815,816;9,950,63;9,951,63;9,952,63;8,953,815,816;8,954;8,955,815,816;8,956;9,957,63;8,958;8,959,815,816;8,960,815,816;10,961,68,69,68,70,962;10,961,68,69,68,70,963;9,964,63;8,965,815,816;9,966,63;9,967,63;10,968,68,69,68,70,969;10,970,68,69,68,70,969;10,971,68,69,68,70,969;10,972,68,69,68,70,973;9,974,63;9,975,63;8,976;9,977,63;9,978,63;9,979,63;8,980,815,816;9,981,63;8,982,815,816;9,983,63;8,984,815,816;9,985,63;8,986,815,816;9,987,63;9,988,63;8,989;9,990,63;11,991,841;11,992,841;11,993,841;11,994,841;11,995,841;11,996,841;11,997,841;11,998,841;11,999,841;11,1000,841;11,1001,446;1,0,1002;8,1003;8,1004;16,1005,73;11,1006,1007;8,1008;11,1009,446;10,908,68,69,68,70,1010;8,1011;9,1012,63;8,1013;10,1014,1015,68,68,70,1016;10,1017,68,69,68,70,1016;10,1018,68,69,68,70,1016;10,1014,1015,68,68,70,1019;10,1017,68,69,68,70,1019;10,1018,68,69,68,70,1019;8,1020;8,1021;1,0,1022;8,1023;9,1024,63;8,1025;9,1026,63;16,1027,63;9,1028,63;9,1029,63;8,1030;16,1031,63;8,1032,815,816;11,1033,446;1,0,1034,59,1035;1,0,1036";

const $scriptletArglistRefs$ = /* 3939 */ "171;171;164;40;164;19,456;620,621,622,623,624,625;164;35,164;164;399;186;271;197,620,621,622,623,624,625;211;790,791;164,473;171,211;35;35;5;164;197,620,621,622,623,624,625;176;197;186;171;173;56;38,164,173;186,201;207;164;76;164;119;197,620,621,622,623,624,625;171;40;33;39;35,164;318;199;171;197;197;197,620,621,622,623,624,625;171;186;164;197,620,621,622,623,624,625;34;197,620,621,622,623,624,625;160;164;216;197;211;164;173;281;96;171;173;80;65,160;171;164;164;196;620,621,622,623,624,625;65,160;186;344;173;164;479;103;164;164;197,620,621,622,623,624,625;164;675;681;562;616;164;403;35;486;636;171;740;164,237;164;197,620,621,622,623,624,625;197,620,621,622,623,624,625;197,620,621,622,623,624,625;164;2;171;171;171;160,197,208,620,621,622,623,624,625;186,206;158;186;171,368;752,753;462;171;197;618;160;197;4,629,681;269;197,620,621,622,623,624,625;164;428;111;661,662;164;821;171,211;561;51;35;35;186;149;285;164;399;171;160;775;197;197,620,621,622,623,624,625;164;468;468;743;196;177;164;164;164;197;216;197;197;171;706,707;372;197,620,621,622,623,624,625;186;162;541;735;164;197,620,621,622,623,624,625;632;175;197;166;604;708;164;164;197;164;25;164,171;164;164;197;175;164;164;718;164;486;164;164;164;277;67,160;164;164,237;164;166;620,621,622,623,624,625;164;186;589;51,164;297;197,620,621,622,623,624,625;171;164;164;35,51,171;197;45;51,164,171;164;164;164;186;197,620,621,622,623,624,625;197;183,186;739;35;164,175;251;164;164;164;164;564;564;164;461;197;216;751,753;164;164;164,171;164;164,171,174;164;171;216;164,175;620,621,622,623,624,625;164;197;164;164;433;201,620,621,622,623,624,625;197,620,621,622,623,624,625;164;197,620,621,622,623,624,625;106,107;555;313;636;636;164;164;164;688;326;164,171;124,164;675;173;399;216;111;211;211;164;164;164;197,620,621,622,623,624,625;211;211;164;211;206;197;164,171;90,164;390;171;171;164;164;104;111;219;636;5;171;164;164;171;449;171;129;197,620,621,622,623,624,625;179;164;164;90;248;620,621,622,623,624,625;80;197;517;164;721,722,723;171;375;164;164;49;729,730,731;742;164,171;182;197,620,621,622,623,624,625;164;186,255;197,620,621,622,623,624,625;539;378;197;164;164;164;217;29;425,426;164;35,51;186;256;688;620,621,622,623,624,625;216;175;620,621,622,623,624,625;197,620,621,622,623,624,625;620,621,622,623,624,625;196,620,621,622,623,624,625;792;160;442;164;164;197,620,621,622,623,624,625;35,164;164;164;603;57,186;197;197;620,621,622,623,624,625;539;550;35;164,175;164;35;35;164;164;795;197,620,621,622,623,624,625;783;784;785;620,621,622,623,624,625;216;171;42;164;104;164;164;197;164;346;104;104;133,134,135;84;164;164;220;792;164;422,423,424;113;399;315;173;164;164;317;120;228;635,661,662,663,665,666;160;598;124;175,382;382;164,237;104;197;81,82;164,171;164;164,281,360;164;104;104;164;164;164;197,620,621,622,623,624,625;35,171;211;164;164;104;815;550;146,147,148;104;104;160;105;183;197,620,621,622,623,624,625;432;509;281;-252;143;272;422,423,424;637;164;164;620,621,622,623,624,625;171;164;164;84;661,662,663;327,328;164;164;164;35;164;197,620,621,622,623,624,625;164;90;164;171;273;278;216;130,131;171;280;71,72,73;171;164;164,217;211;197;164;173;164;197;121;171;516;222;104;104;262;171;164,171;372;574;164;115;197;164;185;164;199;550;246;216;197;113;171;675;111;211;197,620,621,622,623,624,625;65,160;164;506;112;645,646,695,696;133,134,135;205,208;175;197;104;197;338;120;382;602;63;814;244,245;164;129;684;571,572;171;53;164;181;514;197,620,621,622,623,624,625;197;216;382;171;164;416;492;164;466;228;120,408,409;171;171;164;63;186;164;773,774;171;160;164;636;422,423,424;197,620,621,622,623,624,625;173;720;81,82;171;341;171;556;171;164;186;325;171;164;197,620,621,622,623,624,625;171;164;164;197;761;661,662;164;216;389;164;164;227;189,620,621,622,623,624,625;620,621,622,623,624,625;620,621,622,623,624,625;197,620,621,622,623,624,625;197,620,621,622,623,624,625;164;164;164;164;90;197,620,621,622,623,624,625;197,620,621,622,623,624,625;197,620,621,622,623,624,625;129;167;164,182;133,134,135;217;164;90;164;171;736;736;164;97,98,99,100;63;164;219;171;20;359;570;164;197;51;422,423,424;550;197,620,621,622,623,624,625;171;90;164;164;55;214;186;373;322;61,322;781;112;173;620,621,622,623,624,625;175;197;332;197;204,205;160;545;164;483;186;282;90;171;31;171;55;186;197,620,621,622,623,624,625;123;35;164;164;197,620,621,622,623,624,625;216;260;641;164,171;90;90;2;90,115;216;164;164;173;164;164;620,621,622,623,624,625;164;20;388;164;171;186;819;171;197,620,621,622,623,624,625;197;197;515;206;197;62;164,175;164,171;164;164;115;164;164;179;120;186;228;164;38;290;37;68;35;164,237;611;164,237;108;164;164;81,82;49;164,473;175;113;113;186;171;283;196,620,621,622,623,624,625;197,620,621,622,623,624,625;443;171;407;164;164;186;164;201,620,621,622,623,624,625;175,279;164;164;104;35;90;164;636;164;211;164,171;197,620,621,622,623,624,625;197,620,621,622,623,624,625;211;186;197;20;145;203;171;164;186;436,437;164;391;422,423,424;422,423,424;422,423,424;422,423,424;164;164;216;164;636;288;197,620,621,622,623,624,625;164;164;197,620,621,622,623,624,625;171;492;164;171,173;171;197,620,621,622,623,624,625;197,620,621,622,623,624,625;150,151;402;21;500,816,817;531;90;124;74;35;158;164;164;197,620,621,622,623,624,625;186,208;164;35;164;171;164;124;197,620,621,622,623,624,625;206;361;186;261;182;197;164;164;164;620,621,622,623,624,625;179;113,323;186;186;164;617;51;105;164;285;186,700,701,702;160;792;37;197;534;164;792;164;107;197,620,621,622,623,624,625;171;197,620,621,622,623,624,625;111;164;164,171,473;197,620,621,622,623,624,625;104;197;164;779;186;164;264;164;197;164;113,115;164;90;620,621,622,623,624,625,673;186;197,620,621,622,623,624,625;164;196,197,620,621,622,623,624,625;211;197;164;581;197,620,621,622,623,624,625;550;410;164;818;164;171;249;43,44;792;238;164;197;164;166,175,577;173;171;164;214;35;35;197;580;620,621,622,623,624,625;197;164;164;164;197;196;164;528;197;164;546;765;438;197,620,621,622,623,624,625;164;164;51,164;370;550;803,804,805;171;35;579;164;197,620,621,622,623,624,625;117;144;164;164;216;217;164;216;216;620,621,622,623,624,625;224;253,254;111;199;164;201,620,621,622,623,624,625;821;587;90;164;197,620,621,622,623,624,625;74;197,620,621,622,623,624,625;216;197,620,621,622,623,624,625;186;164;164;197;162;741;164;164;164;382;637;164;382;197;197;217;329;197;197,620,621,622,623,624,625;356;792;164;164;171;280;164;654;90;90;164;113;35;164;171;173;164;164;164,175;171;444;164;164;322;197,620,621,622,623,624,625;550;164;635,661,662,665,666;164;164;503;620,621,622,623,624,625;186;332;35;164;518;164;164;164;37;12,13,14,15;164;171;164;197;164;17,18,178;164;235;197,620,621,622,623,624,625;186,678;382;197,620,621,622,623,624,625;186;164;186;164;164;164;164;717;171;164;637;521;171;171;661,662;197,620,621,622,623,624,625;265,266;164;197;164;164;5;116;146,147;175;175;164;164;120;164;175,552;164;197,620,621,622,623,624,625;112;171;164;164;164;455;164;113;113;164;197;164;164;197;186;171;164;164,175;164;550;175;480;164;611;611;35;164,171;164,173;58;197;66;164;620,621,622,623,624,625;291,292;197;160,161;675;406;112;41;5;164;35,173,476;162;197;608;197;643;164;197,620,621,622,623,624,625;164;35,51;-36;164;152;171;163;164;382;197,620,621,622,623,624,625;401;57,186,197,659;171;164;171;164;331;164;35;199;381;620,621,622,623,624,625;550;186;382;600;359;164;492;303,304,305,306,307;217,585;-252;429;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;554;469,470;171;-36;164;197,620,621,622,623,624,625;197,620,621,622,623,624,625;173;164;197,620,621,622,623,624,625;164;197;197;35,171;279;164;694;164;164,550;164;186;186;164;197,620,621,622,623,624,625;197;614;164;164;164,237;104;171;382;113,115;276;146,147;186;164;122;197,620,621,622,623,624,625;164;197;620,621,622,623,624,625;378;164;164;23;620,621,622,623,624,625;164;115;55;186;164;289;550;792;620,621,622,623,624,625;550;728;197;197;197,620,621,622,623,624,625;197,620,621,622,623,624,625;-36,-551,-822;197;417;592;117;171;113;171;550;164;111;382;186;186;162;164;57,186,206;171;164;457,458;197;173;197,620,621,622,623,624,625;164;211;609;75;186;550;136,137,138;211;53;547;398;620,621,622,623,624,625;85;164;164;660;382;164;188,620,621,622,623,624,625;197,620,621,622,623,624,625;129;208;111;90;679,680;320;164;508;285;35;228;164,171;171;164;164;171;197;171;171;164;197;279;400;164;228;162;197;539;164;197,620,621,622,623,624,625;197;504;197;23;171;636;197,620,621,622,623,624,625;60;186;353;197,620,621,622,623,624,625;498;171;382;216;164;164;326;35;164;91,92,93,94;112;164;164;771,772;376;550;419,420;164;382;37;197,620,621,622,623,624,625;197,620,621,622,623,624,625;164;164;55,164;380;197;164;164;164;350;164;216;164;197,620,621,622,623,624,625;593;578;164,171;377;252;164;197,620,621,622,623,624,625;197,620,621,622,623,624,625;164,175;90;23,164;164;197;536;626;164;563;197,620,621,622,623,624,625;164;294;109;433;164;637;164;113,115;186;197,620,621,622,623,624,625;26;164;90;164;796,797,798;620,621,622,623,624,625;164;171;186;576;467;197;197;164;197;173;171;171;164;164;171;776;171;769,770;83;197,620,621,622,623,624,625;51;197,620,621,622,623,624,625;197,204,205,208;197;164;197,620,621,622,623,624,625;164;477;197,620,621,622,623,624,625;164;23;197,620,621,622,623,624,625;164;171;186;744;197,198;662;164;30;344;186;284;171;216;164;164;344;164;637;637;164;164;382;197,620,621,622,623,624,625;197,620,621,622,623,624,625;620,621,622,623,624,625;164;86,87,88;602;164;204,205;197,620,621,622,623,624,625;171;186;493;171;539;539;539;197;616;186;197,620,621,622,623,624,625;164;164;164;186,661;164,688;186;104;197,620,621,622,623,624,625;197;613;90;412;85;637;160;382;186;525;314;171;672;197;214;175;164;164;553;164,175,237,480;110;164;186;197,620,621,622,623,624,625;166;166;197;164,175,237,480;364;112;197;396;324;724;807;120;678,763,764;590;164;183;164;164;197;748;401;407;407;407;171;171;183;164;179;164;196;113,164;258;164;197;164;197;37;422,423,424;197,620,621,622,623,624,625;84;164;175;171;164;164,171,473;171;197;688;197;610;162;197,620,621,622,623,624,625;164;615;166;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;637;637;164;637;300;164;332;197;197,620,621,622,623,624,625;164;48;171;164;171;164;171;197;164;186,187;164;35;164;705;52;550;186;618;164;164,237;197;164;114;164;164;216;452;164;49;90;197,421;90;309;262;197;197;186;197,208,620,621,622,623,624,625;164;529;620,621,622,623,624,625;285;197;173;164;311;186;197;164;186;323;616;105;792;217;115;686;312;186;727;164;481;90;164;232,233;550;197;186,559;112;616;197,620,621,622,623,624,625;453;201,620,621,622,623,624,625;197,620,621,622,623,624,625;186;51,171;321;363;105,164;164;422,423,424;197;678;162;164;35;197,620,621,622,623,624,625;197;105;675;116;164,171;792;164;711,712,713;197;197,620,621,622,623,624,625;164;457;457;197;211;90;164;440;217;550;777;90;379;141;399;164;217;620,621,622,623,624,625;197,620,621,622,623,624,625;533;171;35;160;164;261;216;164;573;620,621,622,623,624,625;164;164;197;537;164;197;275;164;164;382;499;164;550;268;617;154,155,156,157,158,159;164;164;596;197;201,620,621,622,623,624,625;197,620,621,622,623,624,625;438;505;164;197,620,621,622,623,624,625;197,208;112;197,620,621,622,623,624,625;171;618;216;221;216;37;164;296;164;194,620,621,622,623,624,625;164;800,801,802;197;280;186;171;186;197,620,621,622,623,624,625;757,758,759;308;197;164;164;216;164;335;97,98,99,100;199;197,620,621,622,623,624,625;658;499;352;197,620,621,622,623,624,625;197,620,621,622,623,624,625;197,620,621,622,623,624,625;164;197,620,621,622,623,624,625;197,620,621,622,623,624,625;195,620,621,622,623,624,625;217;115;120;171;197,620,621,622,623,624,625;675;792;199;90;197,620,621,622,623,624,625;776;197,620,621,622,623,624,625;186;599;637;105;164;164;164;186;90;37,90;681,683;173;164;164;164;35;576;756;662;186;620,621,622,623,624,625;164;595;36,160;164;164;164;164;164;630,631;171;164;164;164;164;186;208;675;385,386;164;340;20;20;782;197,620,621,622,623,624,625;164,237;160;197,620,621,622,623,624,625;164;371;186;171;179;164;197;197;697;164;637;558;164;164;450,451;197,620,621,622,623,624,625;113;164;165;164;164;793;326;586;170;170;164,511;164;164;164;164;164;121;792;200,620,621,622,623,624,625;789;197,620,621,622,623,624,625;186;164;6,7,8,9,10,11;197;184;35,476;104;197;197;197;520;310;197,620,621,622,623,624,625;35,257;197;540;162;164;164;164;197,620,621,622,623,624,625;197;197,620,621,622,623,624,625;171;173;225;164,217;164;164;164;164;164;196;171;217;218;737,738;164,175;164;129;164;164;186;5;164;164,175;164;206;164,175,637;197;164;171;620,621,622,623,624,625;164;197;634;175;175;175;637;637;164;480;63,164;171;526;35;714;164;606;171;164,237;616;90;596;663;329;662;206;162;183;164;186;792;183;164;454;164;173;164;355;407;407;164;214;90;217;105;90;197;162;407;407;164;197,620,621,622,623,624,625;171;164;113,164;422,423,424;175,279;345;179;164;35;171;171;162;164;725,726;792;240,241;794;164;197,620,621,622,623,624,625;164;681,682;35;173;197;196;162;164;197;550;186,699;164;573;216;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;422,423,424;637;164;164;637;164;821;164;197;164;488;750;21;197;197;197;742;164;166;197,620,621,622,623,624,625;550;197,620,621,622,623,624,625;113;171;746,747;90,110;164,175;274;164;164;173;164;164;116;46,47;164;116;90;23,295;216;164;197;160;197,719;550;105;550;197;616;184;197,620,621,622,623,624,625;166;162;164,173;51,171;197;197;616;293;216;35,51,550;164;35,51;550;164;164;164;164;467;792;792;162;186;197,620,621,622,623,624,625;23;792;792;298,299;298,299;162;164;197;164;201,620,621,622,623,624,625;32;196,620,621,622,623,624,625;197;197;186;642;35,257;35,51,164,171,257;348;214;164;164;35;197;35;171;164;164,175;186;228;23,490,491;97,98,99,100;197;164;337;154,155,156,157,158,159;197;197;164;112;164;90;164;173;175;140;422,423,424;164;493;57;120;164;487;164;502;164,237;116;550;228;186;35;620,621,622,623,624,625;164,175;133,134,135;91,92,93,94;228;164,171;164;164;216;169;164;37;37;171;171;164,171;164;780;164,171;85;164;197;225;132;635,661,662,665,666,670;84;111;528;201,620,621,622,623,624,625;197,620,621,622,623,624,625;164;197,620,621,622,623,624,625;214;175;166;54;620,621,622,623,624,625;473;164,427;197,620,621,622,623,624,625;550;164;529;172;197,620,621,622,623,624,625;201,620,621,622,623,624,625;658;704;197;83;806;261;186;236;164,173;193;523;160;37;130,131;732,733,734;168;171;601;179;142;164;164;113;164;37;197,620,621,622,623,624,625;164;199;186;197,620,621,622,623,624,625;382;171;422,423,424;762;164;347;164;197,620,621,622,623,624,625;186,698;85;164;197,620,621,622,623,624,625;197,620,621,622,623,624,625;675;616;638,639,640;164,267;792;197;434;186;164;792;637;637;234;413;164;788;164;197;164;197;35;213;164;162;164;411;164;550;786;164;164;164;473,476;792;197,208;455;616;549;164;164;164;186;164;90;175;164;112;23;164;186;792;607;171;688;164;330;792;162;175;90;37;197;209;605;164;655,656;206;164;164,171;164;186;300;671,767,768;171;197;65;473;164;197;594;164;175;197;164;164;164;179;171;85;186;596;90;484;620,621,622,623,624,625;197;162;186;183;164;166;63;675;358;90;113;314;164;186;164;171;208;616;164;792;792;164;164;792;164;164;197;51;51,171;186;112;197;164;164;164;197;197,620,621,622,623,624,625;164;171,279;637;164;197;85;789;22;35;197,620,621,622,623,624,625;217;164;171;519;164;164;422,423,424;422,423,424;422,423,424;422,423,424;175;489;215;164;63;75,175;83;164;186;171,382;197,620,621,622,623,624,625;35;197;115;164;382;171;197,620,621,622,623,624,625;115;197,620,621,622,623,624,625;186;90;35;173;90;164;197;689,693;186;186;51;51;51;164;175;164;35;164;197;35;242;197;85;105;778;164;197;197,206,689;196,620,621,622,623,624,625;164;216;616;364;197;197;792;792;703;197;197;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;231;35;164;160;116;197;197;186;164;190,620,621,622,623,624,625;186;597;348;171;113;445,675;197;164;182;439;197,620,621,622,623,624,625;507;164;23,490,491;136,137,138;95;197,208;197,620,621,622,623,624,625;186;164;186;637;247;550;197,620,621,622,623,624,625;197,620,621,622,623,624,625;5;357;197;197,620,621,622,623,624,625;196;197;160;164;197,620,621,622,623,624,625;216;171;164;588;160;123;267;164;676,677,688;216;164;164;197;164;197;164;197;342;476;164;35;164;85;197,620,621,622,623,624,625;164;418;197,620,621,622,623,624,625;593;223;197,620,621,622,623,624,625;792;197,620,621,622,623,624,625;336;81,82;197,620,621,622,623,624,625;382;171;369;164;792;716;162;637;197,620,621,622,623,624,625;197,620,621,622,623,624,625;35;202,620,621,622,623,624,625;792;186;63;596;197;166;35;212;164;164;115;319;550;164;792;197;201,620,621,622,623,624,625;175;197;164,171;171;164;382;792;197,620,621,622,623,624,625;455;186;197,620,621,622,623,624,625;105;637;637;532;164;164;171;197,620,621,622,623,624,625;164;186;127,128;164;792;164;391;197;197;164;391;35,51,550;335;105;164;455;620,621,622,623,624,625;333;35;197;35;539;197,620,621,622,623,624,625;84,179;499;35,164;445,675;164;164,166;398;197;197,620,621,622,623,624,625;197;620,621,622,623,624,625;186;35;811;197,620,621,622,623,624,625;197,620,621,622,623,624,625;164;448;620,621,622,623,624,625;35;51,164,171,237;186;197;164;216;84;164,237;164,237;164;164;414;164;302;792;164;792;164;196;35;35;182;478;343;616;164;214;112;197;164;164;411;51;197;208;197,620,621,622,623,624,625;164;197,620,621,622,623,624,625;573;164;326;637;162;160;197;197;792;84;382;164;550;162;799,-804,-805,-806;0,1;164;637;164;197,620,621,622,623,624,625;197;164,237;164,237;164;164;197;164,527;164;35,171;229,230;171;637;113;164;279;197,620,621,622,623,624,625;197,620,621,622,623,624,625;208;792;749;199;620,621,622,623,624,625;164;164;216;197;160;164;685;197;51;387;550;550;550;116;197;197;197;50;197;792;792;164;391;35;619;164;164;197;197;674;383;120;164;197;792;348;197;197;391;164;182;120;141;197;162;620,621,622,623,624,625;197;197,620,621,622,623,624,625;164;197,620,621,622,623,624,625;164;164;228;637;85;164;164;620,621,622,623,624,625;85;164;164;263;116;301;112;182;197;74;228;164;210;179;197;197,620,621,622,623,624,625;197;112;197,620,621,622,623,624,625;89;208,620,621,622,623,624,625;171;186;35,164;354;164;550;164,175;197,620,621,622,623,624,625;197;382;269;186;197,620,621,622,623,624,625;197,620,621,622,623,624,625;620,621,622,623,624,625;164;374;186;186;197;186;162;197,620,621,622,623,624,625;175;121;186;197,620,621,622,623,624,625;199;164;164;474,475;186;164;120;171;171,382;186;162;637;85;197,620,621,622,623,624,625;197,620,621,622,623,624,625;186;110;197;267;164;164;197,620,621,622,623,624,625;792;661,662;635,661,662;197;582;197;64;382;550;485;197;162;197,620,621,622,623,624,625;197,620,621,622,623,624,625;792;535;182;112;300;186;164;164;166;754,755;171;171;197,620,621,622,623,624,625;281;662,668,669;192,197,620,621,622,623,624,625;382;173;382;164;197;197;550;171;173;164;164;550;524;164,237;164;197,620,621,622,623,624,625;792;197,620,621,622,623,624,625;349;171,237;186;91,92,93,94;104;620,621,622,623,624,625;90;186;197,620,621,622,623,624,625;113;186;153;565,566;186;635,644,661,662,663;164;37;397;164;164;214;535;27,28;179,180;164;166;116;171;240,241;637;164;476;197,620,621,622,623,624,625;197,620,621,622,623,624,625;620,621,622,623,624,625;197,620,621,622,623,624,625;270;422,423,424;186;637;550;164;164,237;164;792;197;279,447;776;116;197;118;77,78,79,80;90;217;162;217;164;164;182;745;197;186;197;164;501;186;197;197;197;575;35;197,620,621,622,623,624,625;792;197,208,620,621,622,623,624,625;197;476;620,621,622,623,624,625;35;104;792;792;139;197;197;164;164;583;127,128;121;197;620,621,622,623,624,625;35;164;808,809,810;538;164;116;197;362;760;616;196;247;164;430;171;197;186;186;197,620,621,622,623,624,625;164;197;164;171;228;121;164;164;206;164;173;118;171,494,495;494,495;494,495;85;50;186;186,197;196,620,621,622,623,624,625;197;123;197,620,621,622,623,624,625;321;197,620,621,622,623,624,625;164;164;197;164;384;186;35,476;164;512;171;182;197;164;162;197,620,621,622,623,624,625;628;199,620,621,622,623,624,625;186;197,208;164;164;186;197,620,621,622,623,624,625;204;197;197;661;164;197;197,620,621,622,623,624,625;51,171;620,621,622,623,624,625;542;197,620,621,622,623,624,625;197,620,621,622,623,624,625;332;164;64;164;166;792;792;91,92,93,94;197;550;164;35;162;35;164;162;164;164;116;196;395;164;171;164;792;35,51,550;164;620,621,622,623,624,625;197,208;550;197,620,621,622,623,624,625;164,237;85;197;226;550;112;164;164,171,237;476;164;164;550;164;173;661;197;113;197,620,621,622,623,624,625;186;382;183;164;186,197;133,134,135;620,621,622,623,624,625;183;441;792;792;164;197;164;104;186;197;164;183;116;62;37;392;435;568;160;171;382;183;171;197;197;164;799,-801,-802,-803;186;164;197;616;616;164,237;186;250;366,367;237;197;186;162;164;164;164;75;471;197;464,465;196,197;551;548;197;164;164;51;197;689;710;197;197;197;792;197;186;259;197;550;186;197;197;90;197,620,621,622,623,624,625;197;197;661;197;690,691,692;164;348;197;472;95;618;612;197;197;120;391;197;617;164;197;164;171;50;792;393;90,110;164;186;164;243;116;652,653;201;197;197,620,621,622,623,624,625;197,620,621,622,623,624,625;620,621,622,623,624,625;186;197,620,621,622,623,624,625;116;197,199,620,621,622,623,624,625;5;201,620,621,622,623,624,625;164;792;792;569;197;197;186;164;197;50;792;197,620,621,622,623,624,625;164;197;37;64;35;164;459,460;173;792;23;197,620,621,622,623,624,625;197,620,621,622,623,624,625;247;197;116;382;550;186;164;647,648;550;164,237;197;113;171,175,237;560;164;23;162;164;183;197;162;104;792;171;171;164;584;267;199;321;59;237,480;637;90;664;197;164;125,126;239,650,651,665,666,776;162;164,237;84;197,620,621,622,623,624,625;186;197;24;164;186;63;339;376;164;90;91,92,93,94;91,92,93,94;164;51;164;197;197,620,621,622,623,624,625;197;164,473;431;186;112;657;365;197;197;164;197;16,522;197;164;164;620,621,622,623,624,625;792;186;90;160;197,620,621,622,623,624,625;463;496,497;191,620,621,622,623,624,625;186;197,620,621,622,623,624,625;116;633;197;766;199;70;620,621,622,623,624,625;404;103;197,620,621,622,623,624,625;197,620,621,622,623,624,625;116;186;633;197,620,621,622,623,624,625;101,102;197;197,620,621,622,623,624,625;792;675;197;197;197;197,620,621,622,623,624,625;50;792;171;164;162;116;620,621,622,623,624,625;197;567;162;164;164;792;787;197,620,621,622,623,624,625;197,620,621,622,623,624,625;675;164;186;482;37;35,164;316;197,620,621,622,623,624,625;550;186;550;164,237;550;197;394;171;164,237,820;197;164;162;792;164;197;525;171;182;164;85;164;164;197,620,621,622,623,624,625;116;186;183;637;113;186;627,662;197;104;200,620,621,622,623,624,625;197;792;197;197;23;164;197,620,621,622,623,624,625;162;186,715;164;171;197;197;197,206;90;37;112;197;35;472;197;113;197,208;197,620,621,622,623,624,625;675;530;618;164;662,670;792;84;197;116;186;557;81,82;112;112;164;197;162;197,620,621,622,623,624,625;197,620,621,622,623,624,625;196,197;513;197;197;197;197;164;197,620,621,622,623,624,625;197,620,621,622,623,624,625;792;169;661,662,709;164;415;197,620,621,622,623,624,625;197;63;201,620,621,622,623,624,625;197;197;550;186;675;104;171,173,286,287;164;116;164;197,620,621,622,623,624,625;171;197;183;197;23;162;183;665,666;550;116;382;164;164;183;183;197;164;792;186;162;792;186;115;197,620,621,622,623,624,625;113;164;395;171;69;285;186;179;197;690,691,692;792;197;382;162;792;164;550;197;164;197;792;792;550;405;446;164;171,237;91,92,93,94;162;162;792;792;197,620,621,622,623,624,625;183;792;197;95;162;164;792;35;164;550;580;164;196,197,620,621,622,623,624,625;675;164;197;376;162;687;616;197;81,82;164;620,621,622,623,624,625;197;171;164;197;546;197;112;427;164;792;197;197,620,621,622,623,624,625;164;3,510;162;164;64;164;792;665,666;133,134,135;162;550;197,620,621,622,623,624,625;164;164;186;197;164;792;620,621,622,623,624,625;197;667;162;164;197,620,621,622,623,624,625;164;164,351;543,544,812,813;115;197;186;179;157;169;616;792;164;164,237;91,92,93,94;183;197;171;197;197;792;792;197,620,621,622,623,624,625;217;162;618;255;197;197;164;164;197;64;186;792;197;186;616;197,620,621,622,623,624,625;162;197;616;171;164;591;116;186;197;649;197;197;162;64;197;792;186;197,620,621,622,623,624,625;164;182;792;162;23;164;197,620,621,622,623,624,625;112;164;550;164;183;164;183;113;166,175;186;197,620,621,622,623,624,625;197;197,620,621,622,623,624,625;164;574;164;334;164;112;186;197,620,621,622,623,624,625;186;197;164;164;186;179;164;171";

const $scriptletHostnames$ = /* 3939 */ ["s.to","ak.sv","g3g.*","hqq.*","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","im9.eu","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","oko.sh","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","get2.in","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moin.de","movi.pk","mrt.com","msn.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","xfile.*","15min.lt","2embed.*","4game.ru","7mmtv.sx","9xflix.*","a5oc.com","adria.gg","alpin.de","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cety.app","cnet.com","devlib.*","dlhd.*>>","dooood.*","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","file.org","findav.*","fir3.net","flixhq.*","focus.de","gala.com","game8.jp","golog.jp","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","redis.io","rintor.*","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xcloud.*","xvip.lat","yabai.si","ytstv.me","zooqle.*","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","24sata.hr","3minx.com","4game.com","4stream.*","5movies.*","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","alc.co.jp","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","beeg.porn","bigwarp.*","blkom.com","bokep.top","camhub.cc","casi3.xyz","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cutty.app","d000d.com","d0o0d.com","daddyhd.*","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","exego.app","expres.cz","fap18.net","faqwiki.*","faselhd.*","fc2db.com","file4go.*","finfang.*","fiuxy2.co","fmovies.*","fooak.com","forsal.pl","ftuapps.*","garota.cf","gayfor.us","ghior.com","globo.com","gloria.hr","gplinks.*","grapee.jp","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","igfap.com","imgur.com","imihu.net","innal.top","inxxx.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kickass.*","kissjav.*","knowt.com","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mynet.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","nhlbox.me","nlegs.com","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","raider.io","remaxhd.*","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","rokni.xyz","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seory.xyz","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","stfly.biz","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","tutele.sx","ucptt.com","upzur.com","usi32.com","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vogue.com","voodc.com","vplink.in","waezg.xyz","waezm.xyz","watson.de","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xcloud.eu","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","4porn4.com","555fap.com","5ghindi.in","720pflix.*","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","appnee.com","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","bmamag.com","boyfuck.me","btvplus.bg","bunshun.jp","buzter.xyz","c-span.org","cashurl.in","cboard.net","cdn256.xyz","cgtips.org","cnpics.org","corral.net","crewus.net","crictime.*","ctpost.com","cutnet.net","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","drweil.com","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","exambd.net","f1stream.*","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fzmovies.*","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","love4u.net","m.4khd.com","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","motor1.com","movies4u.*","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","otakomu.jp","ovabee.com","paid4.link","paypal.com","pctfenix.*","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prmovies.*","proxybit.*","pxxbay.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thumb8.net","thumb9.net","tiscali.cz","tnmusic.in","top1iq.com","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zpaste.net","11xmovies.*","123movies.*","2monkeys.jp","373news.com","3dsfree.org","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","aipebel.com","airevue.net","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","atravan.net","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bg-mania.jp","bi-girl.net","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bolighub.dk","bowfile.com","btcbitco.in","caitlin.top","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","civinfo.com","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","crx7601.com","cuervotv.me","cults3d.com","cutlink.net","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","downvod.com","dropgame.jp","ds2play.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","embedpk.net","emuenzen.de","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnforum.net","fnjplay.xyz","fntimes.com","focusst.org","fsharetv.cc","fullymaza.*","g-porno.com","gamewith.jp","gbatemp.net","get-to.link","ghbrisk.com","gigafile.nu","gocast2.com","godlike.com","goodcar.com","govtech.com","grasoku.com","gupload.xyz","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","in91vip.win","itopmusic.*","jav-noni.cc","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","jawapos.com","jelonka.com","jetpunk.com","jixo.online","jjang0u.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","kaliscan.io","karanpc.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","koltry.life","laposte.net","letocard.fr","lexpress.fr","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","mirrorace.*","misterio.ro","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","nodo313.net","nontonx.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","peeplink.in","pelisplus.*","phim12h.com","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","rule34.club","sadisflix.*","safetxt.net","samax63.lol","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharing.wtf","shavetape.*","shinbhu.net","shinchu.net","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","syosetu.com","t-online.de","tabooflix.*","tbsradio.jp","teachoo.com","techguy.org","teltarif.de","thehour.com","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","xcloud.host","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","yesmovies.*","youtube.com","yumeost.net","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","46matome.net","4archive.org","4btswaps.com","50states.com","720pstream.*","723qrh1p.fun","7hitmovies.*","aamulehti.fi","adricami.com","alexsports.*","alexsportz.*","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animanch.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","autoc-one.jp","avseesee.com","avsforum.com","bamgosu.site","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepnya.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","capoplay.net","carparts.com","catfish1.com","catforum.com","cesoirtv.com","chaos2ch.com","chatango.com","cheftalk.com","choralia.net","clickapi.net","coingraph.us","crazyblog.in","crewbase.net","cricstream.*","cricwatch.io","cuevana3.fan","cutyurls.com","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","divicast.com","divxtotal1.*","dizikral.com","dogforum.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","edukaroo.com","egyanime.com","ekasiwap.com","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","exe-urls.com","expertvn.com","factable.com","falatron.com","fapptime.com","feed2all.org","fetchpik.com","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","footybite.to","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gulflive.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","huntress.com","ibelieve.com","ihdstreams.*","imagefap.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","jablickar.cz","jav-coco.com","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jp-films.com","kasiporn.com","kazefuri.net","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","learnmany.in","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","luluvdoo.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masslive.com","matacoco.com","mediaite.com","mega-mkv.com","mhdtvworld.*","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkvcinemas.*","mmamania.com","mmsbee42.com","modrinth.com","modsbase.com","modsfire.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","myflixerz.to","mykitsch.com","nanolinks.in","nbadraft.net","neodrive.xyz","netatama.net","newatlas.com","newsyou.info","neymartv.net","niketalk.com","noni-jav.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","pennlive.com","photopea.com","playertv.net","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","pressian.com","pubfilmz.com","publicearn.*","rainmail.xyz","rapelust.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","ronaldo7.pro","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","ryaktive.com","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","sonixgvn.net","spatsify.com","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","teleclub.xyz","teluguflix.*","terra.com.br","thehindu.com","themezon.net","theverge.com","toonhub4u.me","topdrama.net","topspeed.com","torrage.info","torrents.vip","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","tusfiles.com","tutlehd4.com","tutsnode.org","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","ultraten.net","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","vi-music.app","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","volokit2.com","vpcxz19p.xyz","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xopenload.me","xopenload.pw","xpornium.net","xxxstream.me","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zvision.link","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","1911forum.com","1bitspace.com","247sports.com","4horlover.com","4kwebplay.xyz","560pmovie.com","680thefan.com","6hiidude.gold","7fractals.icu","abc17news.com","abhijith.page","actusports.eu","adblocktape.*","addapinch.com","aeblender.com","aiimgvlog.fun","alexsportss.*","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","bacasitus.com","badmouth1.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","bestfonts.pro","bethcakes.com","bettafish.com","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buffstreams.*","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","cefirates.com","chanto.jp.net","cheater.ninja","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","coltforum.com","columbian.com","concomber.com","coolcast2.com","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","daveockop.com","dayspedia.com","depvailon.com","dizikral1.pro","dizikral2.pro","dodgetalk.com","dooodster.com","downfile.site","dphunters.mom","dragontea.ink","drivenime.com","e2link.link>>","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","etoland.co.kr","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fjrowners.com","flixhouse.com","flyfaucet.com","focusstoc.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","gifu-np.co.jp","giornalone.it","globalrph.com","governing.com","gputrends.net","grantorrent.*","gundamlog.com","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","honkailab.com","hornylips.com","hoyoverse.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","indiewire.com","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itunesfre.com","javsunday.com","jimdofree.com","jisakuhibi.jp","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","kamababa.desi","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","kurashiru.com","lifehacker.jp","likemanga.ink","listar-mc.net","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lowellsun.com","m.inven.co.kr","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","motor-talk.de","moutogami.com","moviekhhd.biz","moviepilot.de","moviesverse.*","movieswbb.com","moviezwaphd.*","mp4upload.com","multicanais.*","musescore.com","myflixertv.to","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","overclock.net","ozlosleep.com","pagalworld.cc","pandamovie.in","pc-builds.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","phineypet.com","picdollar.com","pillowcase.su","pinkueiga.net","pirateiro.com","pitchfork.com","pkbiosfix.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","ramforumz.com","rarethief.com","raskakcija.lt","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rnbxclusive.*","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","s3embtaku.pro","saboroso.blog","savefiles.com","scatkings.com","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","silverblog.tv","silverpic.com","simana.online","sinsitio.site","skymovieshd.*","smartworld.it","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","speedporn.net","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","srtforums.com","starstyle.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","swissotel.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","tapmyback.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","thekitchn.com","thelayoff.com","thepoke.co.uk","thethings.com","thothub.today","tiermaker.com","timescall.com","timesnews.net","tlnovelas.net","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","vibestreams.*","vid-guard.com","vidspeeds.com","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","xcamcovid.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zorroplay.xyz","123movieshub.*","300cforums.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","9to5google.com","actugaming.net","acuraworld.com","aerotrader.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcryptoz.net","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","androidacy.com","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","artoffocas.com","ashemaletube.*","balkanteka.net","bhugolinfo.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buchstaben.com","camberlion.com","cheatsheet.com","choco0202.work","cine-calidad.*","clashdaily.com","clicknupload.*","cloudvideotv.*","clubsearay.com","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","cuevana3hd.com","cumception.com","curseforge.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dofusports.xyz","dolldivine.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","expatforum.com","extreme-down.*","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","filmizleplus.*","filmy4waps.org","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","foodtechnos.in","fordescape.org","fordforums.com","forex-trnd.com","formyanime.com","forumchat.club","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","galleryxh.site","gamepcfull.com","gameshop4u.com","gameskinny.com","gayforfans.com","gaypornhot.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gravureblog.tv","gujjukhabar.in","gyanitheme.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hotgranny.live","hotukdeals.com","hwnaturkya.com","iisfvirtual.in","imgtraffic.com","indiatimes.com","infogenyus.top","inshorturl.com","insidehook.com","instanders.app","ios.codevn.net","iplayerhls.com","iplocation.net","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jizzbunker.com","joemonster.org","joyousplay.xyz","jpopsingles.eu","jyoseisama.com","kakarotfoot.ru","kantotflix.net","katoikos.world","kickassanime.*","kijolariat.net","kompasiana.com","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","mactechnews.de","mahajobwala.in","mahitimanch.in","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","marcialhub.xyz","mastkhabre.com","megapastes.com","meusanimes.net","midebalonu.net","mkv-pastes.com","monacomatin.mc","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mumuplayer.com","mundowuxia.com","my.irancell.ir","myeasymusic.ir","nana-press.com","naszemiasto.pl","nayisahara.com","newmovierulz.*","news-buzz1.com","news30over.com","nhregister.com","nookgaming.com","nowinstock.net","o2tvseries.com","ocregister.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","pandamovies.me","pandamovies.pw","pandaspor.live","paste-drop.com","pastemytxt.com","pelando.com.br","pencarian.link","petitrobert.fr","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playtube.co.za","populist.press","pornhd720p.com","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","projeihale.com","proxyninja.org","qiqitvx84.shop","quest4play.xyz","record-bee.com","reisefrage.net","remixsearch.es","resourceya.com","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","singjupost.com","sizecharts.net","skidrowcpy.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speisekarte.de","spieletipps.de","sportsurge.net","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","superhonda.com","supexfeeds.com","swatchseries.*","swipebreed.net","swordalada.org","tamilprinthd.*","tea-coffee.net","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","topcryptoz.net","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","toyokeizai.net","tracktheta.com","trannyteca.com","trentonian.com","troyrecord.com","tvs-widget.com","tvseries.video","twincities.com","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vahantoday.com","videocelts.com","vikistream.com","visifilmai.org","viveseries.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wikifilmia.com","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xclusivejams.*","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yourupload.com","zeroupload.com","51bonusrummy.in","adrinolinks.com","adz7short.space","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","allthetests.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","areaconnect.com","arstechnica.com","audiotools.blog","audioz.download","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxingstream.me","brilian-news.id","budgetbytes.com","buffstreams.app","bussyhunter.com","can-amforum.com","careersides.com","cempakajaya.com","chollometro.com","cizgivedizi.com","clubtouareg.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","cryptoearns.com","cycleforums.com","cycletrader.com","dailybreeze.com","dailycamera.com","diariovasco.com","dieselplace.com","diychatroom.com","dizipal1057.com","dizipal1058.com","dizipal1059.com","dizipal1060.com","dizipal1061.com","dizipal1062.com","dizipal1063.com","dizipal1064.com","dizipal1065.com","dizipal1066.com","dizipal1067.com","dizipal1068.com","dizipal1069.com","dizipal1070.com","dizipal1071.com","dizipal1072.com","dizipal1073.com","dizipal1074.com","dizipal1075.com","dizipal1076.com","dizipal1077.com","dizipal1078.com","dizipal1079.com","dizipal1080.com","dizipal1081.com","dizipal1082.com","dizipal1083.com","dizipal1084.com","dizipal1085.com","dizipal1086.com","dizipal1087.com","dizipal1088.com","dizipal1089.com","dizipal1090.com","dizipal1091.com","dizipal1092.com","dizipal1093.com","dizipal1094.com","dizipal1095.com","dizipal1096.com","dizipal1097.com","dizipal1098.com","dizipal1099.com","dizipal1100.com","dizipal1101.com","dizipal1102.com","dizipal1103.com","dizipal1104.com","dizipal1105.com","dizipal1106.com","dizipal1107.com","dizipal1108.com","dizipal1109.com","dizipal1110.com","dizipal1111.com","dizipal1112.com","dizipal1113.com","dizipal1114.com","dizipal1115.com","dizipal1116.com","dizipal1117.com","dizipal1118.com","dizipal1119.com","dizipal1120.com","dizipal1121.com","dizipal1122.com","dizipal1123.com","dizipal1124.com","dizipal1125.com","dizipal1126.com","dizipal1127.com","dizipal1128.com","dizipal1129.com","dizipal1130.com","dizipal1131.com","dizipal1132.com","dizipal1133.com","dizipal1134.com","dizipal1135.com","dizipal1136.com","dizipal1137.com","dizipal1138.com","dizipal1139.com","dizipal1140.com","dizipal1141.com","dizipal1142.com","dizipal1143.com","dizipal1144.com","dizipal1145.com","dizipal1146.com","dizipal1147.com","dizipal1148.com","dizipal1149.com","dizipal1150.com","dizipal1151.com","dizipal1152.com","dizipal1153.com","dizipal1154.com","dizipal1155.com","dizipal1156.com","dizipal1157.com","dizipal1158.com","dizipal1159.com","dizipal1160.com","dizipal1161.com","dizipal1162.com","dizipal1163.com","dizipal1164.com","dizipal1165.com","dizipal1166.com","dizipal1167.com","dizipal1168.com","dizipal1169.com","dizipal1170.com","dizipal1171.com","dizipal1172.com","dizipal1173.com","dizipal1174.com","dizipal1175.com","dizipal1176.com","dizipal1177.com","dizipal1178.com","dizipal1179.com","dizipal1180.com","dizipal1181.com","dizipal1182.com","dizipal1183.com","dizipal1184.com","dizipal1185.com","dizipal1186.com","dizipal1187.com","dizipal1188.com","dizipal1189.com","dizipal1190.com","dizipal1191.com","dizipal1192.com","dizipal1193.com","dizipal1194.com","dizipal1195.com","dizipal1196.com","dizipal1197.com","dizipal1198.com","dizipal1199.com","dizipal1200.com","dizipal1201.com","dizipal1202.com","dizipal1203.com","dizipal1204.com","dizipal1205.com","dizipal1206.com","dizipal1207.com","dizipal1208.com","dizipal1209.com","dizipal1210.com","dizipal1211.com","dizipal1212.com","dizipal1213.com","dizipal1214.com","dizipal1215.com","dizipal1216.com","dizipal1217.com","dizipal1218.com","dizipal1219.com","dizipal1220.com","dizipal1221.com","dizipal1222.com","dizipal1223.com","dizipal1224.com","dizipal1225.com","dizipal1226.com","dizipal1227.com","dizipal1228.com","dizipal1229.com","dizipal1230.com","dizipal1231.com","dizipal1232.com","dizipal1233.com","dizipal1234.com","dizipal1235.com","dizipal1236.com","dizipal1237.com","dizipal1238.com","dizipal1239.com","dizipal1240.com","dizipal1241.com","dizipal1242.com","dizipal1243.com","dizipal1244.com","dizipal1245.com","dizipal1246.com","dizipal1247.com","dizipal1248.com","dizipal1249.com","dizipal1250.com","dizipal1251.com","dizipal1252.com","dizipal1253.com","dizipal1254.com","dizipal1255.com","dizipal1256.com","dizipal1257.com","dizipal1258.com","dizipal1259.com","dizipal1260.com","dizipal1261.com","dizipal1262.com","dizipal1263.com","dizipal1264.com","dizipal1265.com","dizipal1266.com","dizipal1267.com","dizipal1268.com","dizipal1269.com","dizipal1270.com","dizipal1271.com","dizipal1272.com","dizipal1273.com","dizipal1274.com","dizipal1275.com","dizipal1276.com","dizipal1277.com","dizipal1278.com","dizipal1279.com","dizipal1280.com","dizipal1281.com","dizipal1282.com","dizipal1283.com","dizipal1284.com","dizipal1285.com","dizipal1286.com","dizipal1287.com","dizipal1288.com","dizipal1289.com","dizipal1290.com","dizipal1291.com","dizipal1292.com","dizipal1293.com","dizipal1294.com","dizipal1295.com","dizipal1296.com","dizipal1297.com","dizipal1298.com","dizipal1299.com","dizipal1300.com","dizipal1301.com","dizipal1302.com","dizipal1303.com","dizipal1304.com","dizipal1305.com","dizipal1306.com","dizipal1307.com","dizipal1308.com","dizipal1309.com","dizipal1310.com","dizipal1311.com","dizipal1312.com","dizipal1313.com","dizipal1314.com","dizipal1315.com","dizipal1316.com","dizipal1317.com","dizipal1318.com","dizipal1319.com","dizipal1320.com","dizipal1321.com","dizipal1322.com","dizipal1323.com","dizipal1324.com","dizipal1325.com","dizipal1326.com","dizipal1327.com","dizipal1328.com","dizipal1329.com","dizipal1330.com","dizipal1331.com","dizipal1332.com","dizipal1333.com","dizipal1334.com","dizipal1335.com","dizipal1336.com","dizipal1337.com","dizipal1338.com","dizipal1339.com","dizipal1340.com","dizipal1341.com","dizipal1342.com","dizipal1343.com","dizipal1344.com","dizipal1345.com","dizipal1346.com","dizipal1347.com","dizipal1348.com","dizipal1349.com","dizipal1350.com","dl-protect.link","doctormalay.com","donnerwetter.de","dopomininfo.com","dreamchance.net","e46fanatics.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","egoallstars.com","elamigosweb.com","empire-stream.*","esportivos.site","exactpay.online","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fmradiofree.com","footyhunter.lol","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gazetaprawna.pl","gentosha-go.com","geogridgame.com","gewinnspiele.tv","girlscanner.org","girlsreport.net","gofile.download","gowatchseries.*","gratispaste.com","greatandhra.com","gut-erklaert.de","hamrojaagir.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hotcopper.co.nz","idoitmyself.xyz","ilovetoplay.xyz","infosgj.free.fr","istreameast.app","japangaysex.com","jkssbalerts.com","jumpsokuhou.com","khatrimazaful.*","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","kurashinista.jp","lamarledger.com","ldoceonline.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lordchannel.com","lulustream.live","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","matomeblade.com","matomelotte.com","mediacast.click","mentalfloss.com","mercurynews.com","miamiherald.com","miniwebtool.com","mobilestalk.net","modernhoney.com","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","myanimelist.net","nativesurge.net","naughtypiss.com","news-herald.com","news.zerkalo.io","niice-woker.com","noindexscan.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nuxhallas.click","nydailynews.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","phillyvoice.com","phongroblox.com","picsxxxporn.com","pilotonline.com","piratehaven.xyz","pisshamster.com","popdaily.com.tw","powerstroke.org","projectfreetv.*","punishworld.com","qatarstreams.me","rank1-media.com","readbitcoin.org","readhunters.xyz","remixsearch.net","reportera.co.kr","resizer.myct.jp","rnbastreams.com","robloxforum.com","rugbystreams.me","rustorkacom.lib","saikyo-jump.com","sampledrive.org","sat-sharing.com","seir-sanduk.com","sfchronicle.com","shadowrangers.*","shemalegape.net","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","streamnoads.com","stylecaster.com","sudokutable.com","suicidepics.com","sweetie-fox.com","tackledsoul.com","tapeantiads.com","tapeblocker.com","tennisstreams.*","theblueclit.com","thebullspen.com","themoviesflix.*","theporndude.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","truthsocial.com","trybawaryjny.pl","tuktukcinma.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","valhallas.click","vipsister23.com","viralharami.com","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","zakuzaku911.com","2coolfishing.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","asyaanimeleri.pw","backfirstwo.site","bananamovies.org","batmanfactor.com","bestgirlsexy.com","bestpornflix.com","blog.esuteru.com","blog.livedoor.jp","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","buzzfeednews.com","canalesportivo.*","charexempire.com","chinese-pics.com","choosingchia.com","clever-tanken.de","clickndownload.*","clickorlando.com","coloradofans.com","coloredmanga.com","comidacaseira.me","courseleader.net","cr7-soccer.store","cracksports.me>>","cryptofactss.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cybercityhelp.in","cyclingabout.com","dailyfreeman.com","dailytribune.com","dailyuploads.net","darknessporn.com","dartsstreams.com","dataunlocker.com","detikkebumen.com","directupload.net","dobermantalk.com","dodgedurango.net","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","duramaxforum.com","eastbaytimes.com","empire-streamz.*","enclaveforum.net","f150ecoboost.net","familyporner.com","favoyeurtube.net","filecatchers.com","filespayouts.com","financacerta.com","firearmstalk.com","flagandcross.com","flatpanelshd.com","flyfishing.co.uk","football-2ch.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","funkeypagali.com","gamesrepacks.com","gaydelicious.com","genialetricks.de","getviralreach.in","giurgiuveanul.ro","gledajcrtace.xyz","go.gets4link.com","godstoryinfo.com","gourmetscans.net","gsm-solution.com","hallofseries.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hotcopper.com.au","howsweeteats.com","husseinezzat.com","ikarishintou.com","imagereviser.com","infinityfree.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","justfullporn.net","kakarotfoot.ru>>","khatrimazafull.*","kijolifehack.com","kimscravings.com","kingstreamz.site","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","mathplayzone.com","meconomynews.com","megapornpics.com","millionscast.com","moneycontrol.com","mostlymorgan.com","moviesmod.com.pl","mrproblogger.com","mydownloadtube.*","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newedutopics.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nocrumbsleft.net","o2tvseries4u.com","ojearnovelas.com","onionstream.live","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","plainchicken.com","player.buffed.de","powerover.online","powerover.site>>","pricearchive.org","programme-tv.net","protrumpnews.com","puzzlegarage.com","raetsel-hilfe.de","readingeagle.com","rebajagratis.com","repack-games.com","ripexbooster.xyz","rocketnews24.com","rollingstone.com","rsoccerlink.site","rule34hentai.net","saradahentai.com","shutterstock.com","skidrowcodex.net","smartermuver.com","solitairehut.com","south-park-tv.fr","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","statecollege.com","stellanspice.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","techkhulasha.com","telcoinfo.online","text-compare.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","thefitbrit.co.uk","theflowspace.com","thegadgetking.in","thelinuxcode.com","thenerdstash.com","tomshardware.com","topvideosgay.com","total-sportek.to","trainerscity.com","trendytalker.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","valeriabelen.com","veryfreeporn.com","vichitrainfo.com","voiranime.stream","voyeurfrance.net","watchfreexxx.net","watchmmafull.com","weblivehdplay.ru","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","xhamsterporno.mx","yourcountdown.to","youwatchporn.com","ziggogratis.site","4chanarchives.com","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","andhrafriends.com","androidpolice.com","armypowerinfo.com","atlasandboots.com","auto-crypto.click","banglagolpo.co.in","basketballbuzz.ca","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","blizzboygames.net","blog.tangwudi.com","buildtheearth.net","cadryskitchen.com","cagesideseats.com","caliberforums.com","camchickscaps.com","cdn.tiesraides.lv","chaptercheats.com","chargerforums.com","chargerforumz.com","cichlid-forum.com","cinemastervip.com","claplivehdplay.ru","cocokara-next.com","coloradodaily.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cool-style.com.tw","crackstreamer.net","cryptednews.space","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","deepgoretube.site","deutschepornos.me","ditjesendatjes.nl","dl.apkmoddone.com","drinkspartner.com","ducatimonster.org","economictimes.com","euro2024direct.ru","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","filmesonlinex.org","fitnesssguide.com","focusfanatics.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","frugalvillage.com","funtasticlife.com","fwmadebycarli.com","gamejksokuhou.com","gamesmountain.com","gardeningsoul.com","gaypornhdfree.com","globalstreams.xyz","hdfilmcehennemi.*","headlinerpost.com","hentaitube.online","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","innateblogger.com","intouchweekly.com","iphoneincanada.ca","islamicfinder.org","jaysbrickblog.com","kbconlinegame.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lighterlegend.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","marineinsight.com","mdzsmutpcvykb.net","miaminewtimes.com","midhudsonnews.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","multicanaistv.com","musicfeeds.com.au","nationaltoday.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","okusama-kijyo.com","olympicstreams.co","ondemandkorea.com","opensubtitles.org","outdoormatome.com","paranormal-ch.com","pcgeeks-games.com","pinayscandalz.com","player.pcgames.de","plugintorrent.com","pornoenspanish.es","pressandguide.com","presstelegram.com","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","read-onepiece.net","reidoscanais.life","republicbrief.com","restlessouter.net","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","savemoneyinfo.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","sideplusleaks.net","siliconvalley.com","soccerworldcup.me","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","starxinvestor.com","steamidfinder.com","steamseries88.com","stellarthread.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","substitutefor.com","sumaburayasan.com","superherohype.com","supertipzz.online","tablelifeblog.com","thaihotmodels.com","thecelticblog.com","thecubexguide.com","thefreebieguy.com","thegamescabin.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","tightsexteens.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tokusatsuindo.com","toyotaklub.org.pl","tradingfact4u.com","truyen-hentai.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","umatechnology.org","unsere-helden.com","viralitytoday.com","visualnewshub.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","atlasstudiousa.com","authenticateme.xyz","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","bimmerforums.co.uk","blackporncrazy.com","blog-peliculas.com","bluemediastorage.*","browneyedbaker.com","businessinsider.de","businessinsider.jp","cadillacforums.com","calculatorsoup.com","challengertalk.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","codingnepalweb.com","contractortalk.com","cr7-soccer.store>>","crooksandliars.com","dakota-durango.com","defensivecarry.com","descargaspcpro.net","digital-thread.com","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","downshiftology.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","fjlaboratories.com","flacdownloader.com","footballchannel.jp","fordfusionclub.com","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","future-fortune.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","germancarforum.com","greeleytribune.com","haveibeenpwned.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hopepaste.download","hyundaitucson.info","insurancesfact.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","kijyomatome-ch.com","laleggepertutti.it","leckerschmecker.me","lifeinleggings.com","listentotaxman.com","makeincomeinfo.com","maketecheasier.com","marinetraffic.live","mediaindonesia.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","moviesonlinefree.*","mrmakeithappen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","nlab.itmedia.co.jp","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","pancakerecipes.com","panel.play.hosting","player.gamezone.de","playoffsstream.com","pornfetishbdsm.com","porno-baguette.com","readcomiconline.li","reporterherald.com","ricettafitness.com","samsungmagazine.eu","shuraba-matome.com","siamblockchain.com","skyscrapercity.com","softwaredetail.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","steamcommunity.com","stream.nflbox.me>>","strtapeadblocker.*","subaruforester.org","talkforfitness.com","tapeadsenjoyer.com","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","thefashionspot.com","thefirearmblog.com","thepolitistick.com","tiktokrealtime.com","times-standard.com","torrentdosfilmes.*","travelplanspro.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","100percentfedup.com","adblockstreamtape.*","adrino1.bonloan.xyz","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","asumsikedaishop.com","barcablaugranes.com","bchtechnologies.com","betweenjpandkr.blog","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dk.pcpartpicker.com","download.megaup.net","driveteslacanada.ca","duckhuntingchat.com","dvdfullestrenos.com","electriciantalk.com","embed.wcostream.com","equipmenttrader.com","estrenosdoramas.net","filmesonlinexhd.biz","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","franceprefecture.fr","frustfrei-lernen.de","girlsvip-matome.com","hdfilmcehennemi2.cx","historicaerials.com","hometownstation.com","honeygirlsworld.com","honyaku-channel.net","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","kenzo-flowertag.com","kitimama-matome.net","kreuzwortraetsel.de","learnmarketinfo.com","lifeandstylemag.com","lite.duckduckgo.com","logicieleducatif.fr","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","mendocinobeacon.com","middletownpress.com","minimalistbaker.com","movie-locations.com","mykoreankitchen.com","nandemo-uketori.com","negyzetmeterarak.hu","orlandosentinel.com","paidshitforfree.com","pendidikandasar.net","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","pressenterprise.com","promodescuentos.com","radio-australia.org","radio-osterreich.at","registercitizen.com","rojadirectaenvivo.*","royalmailchat.co.uk","secondhandsongs.com","shoot-yalla-tv.live","skidrowreloaded.com","smartkhabrinews.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","thecookierookie.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thewatchseries.live","truyentranhfull.net","turkishseriestv.org","viewmyknowledge.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","adultdvdparadise.com","advertisingexcel.com","allthingsthrifty.com","androidauthority.com","awellstyledlife.comm","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","brushnewstribune.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","crackstreamshd.click","dailynewshungary.com","dailytruthreport.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","detailingworld.co.uk","digitalcorvettes.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","fordmuscleforums.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gametechreviewer.com","gesundheitsfrage.net","heartlife-matome.com","houstonchronicle.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jljbacktoclassic.com","journal-advocate.com","keedabankingnews.com","kugaownersclub.co.uk","laweducationinfo.com","lehighvalleylive.com","letemsvetemapplem.eu","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda3revolution.com","meilleurpronostic.fr","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","mt-soft.sakura.ne.jp","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","pasadenastarnews.com","player.smashy.stream","popularmechanics.com","pornstarsyfamosas.es","receitasdaora.online","relevantmagazine.com","reptilesmagazine.com","securenetsystems.net","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","techsupportforum.com","thebeautysection.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videostreaming.rocks","viralviralvideos.com","windsorexpress.co.uk","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","barnsleychronicle.com","bigleaguepolitics.com","burlington-record.com","celiacandthebeast.com","client.pylexnodes.net","collinsdictionary.com","documentaryplanet.xyz","dragontranslation.com","eroticmoviesonline.me","foreverwallpapers.com","forum.release-apk.com","hackerranksolution.in","hollywoodreporter.com","hoodtrendspredict.com","invoice-generator.com","journaldemontreal.com","julesburgadvocate.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","notformembersonly.com","pelotalibrevivo.net>>","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","santacruzsentinel.com","snapinstadownload.xyz","sousou-no-frieren.com","statisticsanddata.org","streamservicehd.click","tapeadvertisement.com","tech.trendingword.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","timesheraldonline.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","watchkobestreams.info","whittierdailynews.com","zone-telechargement.*","ahdafnews.blogspot.com","allevertakstream.space","andrenalynrushplay.cfd","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","canadianmoneyforum.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","dallashoopsjournal.com","drop.carbikenation.com","elrefugiodelpirata.com","eurointegration.com.ua","fertilityfriends.co.uk","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","jpop80ss3.blogspot.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","pervertgirlsvideos.com","player.gamesaktuell.de","portaldasnovinhas.shop","redlandsdailyfacts.com","shutupandtakemyyen.com","smartfeecalculator.com","sonsoflibertymedia.com","totalsportek1000.com>>","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","bajarjuegospcgratis.com","excelsiorcalifornia.com","footballtransfer.com.ua","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","laurelberninteriors.com","makefreecallsonline.com","newlifeonahomestead.com","nothingbutnewcastle.com","osteusfilmestuga.online","pcoptimizedsettings.com","player.smashystream.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thecurvyfashionista.com","theplantbasedschool.com","afilmyhouse.blogspot.com","astraownersnetwork.co.uk","awealthofcommonsense.com","broomfieldenterprise.com","canoncitydailyrecord.com","dictionary.cambridge.org","dimensionalseduction.com","first-names-meanings.com","freelancer.taxmachine.be","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","mediapemersatubangsa.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","spaghetti-interactive.it","stacysrandomthoughts.com","stresshelden-coaching.de","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","tip.etip-staging.etip.io","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","betweenenglandandiowa.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dictionnaire.lerobert.com","greatamericanrepublic.com","player.pcgameshardware.de","practicalselfreliance.com","sentinelandenterprise.com","sportsgamblingpodcast.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","keyakizaka46matomemory.net","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","thenonconsumeradvocate.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","beautifulfashionnailart.com","forums.socialmediagirls.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
