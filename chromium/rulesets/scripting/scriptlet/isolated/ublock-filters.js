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
    const options = safe.getExtraArgs(Array.from(arguments), 3);
    setAttrFn(false, logPrefix, selector, attr, value, options);
}

function setAttrFn(
    trusted = false,
    logPrefix,
    selector = '',
    attr = '',
    value = '',
    options = {}
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
    runAt(( ) => { start(); }, options.runAt || 'idle');
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

function trustedSetAttr(
    selector = '',
    attr = '',
    value = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-set-attr', selector, attr, value);
    const options = safe.getExtraArgs(Array.from(arguments), 3);
    setAttrFn(true, logPrefix, selector, attr, value, options);
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

function urlSkip(url, blocked, steps) {
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
                const re = new RegExp(step.slice(1, -1));
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

const $scriptletArgs$ = /* 1112 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const t={apply:(t,e,o)=>{const n=o[0];return\"function\"==typeof n&&n.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(t,e,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i",".adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4977442009&adk=2039331362&adf=1059123170&pi=t.ma~as.4977442009&w=300&fwrn=1&fwrnh=100&lmt=1770030787&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787823&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!3\" data-google-query-id=\"CMiylL-r1pEDFYBewgUd-C8e3w\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6641328723&adk=3449722971&adf=1807356644&pi=t.ma~as.6641328723&w=311&fwrn=1&fwrnh=100&lmt=1770030787&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787824&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=5800016212302&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!4\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4977442009&adk=2039331362&adf=1059123170&pi=t.ma~as.4977442009&w=336&fwrn=1&fwrnh=100&lmt=1770031522&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770031522085&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4062124963340&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4281178270640280&tmod=72059292&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=2&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\" data-google-container-id=\"a!3\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","body:has(ins.adsbygoogle.nitro-body > div#aswift_1_host):has(.consent)","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1812271804&adf=3025194257&lmt=1770030787&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787821&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=5800016212302&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12245933&ady=-12245933&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\" data-google-container-id=\"a!1\" data-load-complete=\"true\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","ins.adsbygoogle.nitro-body","unfill-optimized","ins.adsbygoogle.nitro-side,ins.adsbygoogle.nitro-banner","filled","var menuSlideProtection","/*start*/!function(){\"use strict\";const t=Function.prototype.toString,e=new WeakMap,n=(t,n)=>{if(\"function\"==typeof t&&(e.set(t,`function ${n}() { [native code] }`),n))try{Object.defineProperty(t,\"name\",{value:n,configurable:!0})}catch(t){}return t},o=window.Date,r=o.now,i=window.performance.now.bind(window.performance),c=1770030787823;let s=0;const a=/at\\s+([0-9A-Z_a-z]{1,3}|<anonymous>)\\s+\\(/,p=()=>{const t=(new Error).stack;if(!t)return!1;const e=t.split(\"\\n\"),n=e.slice(3).join(\"\\n\"),o=a.test(n),r=e.length>=4&&e.length<=12;return o&&r};function u(...t){return 0===t.length&&p()?new o(c+s):new o(...t)}u.prototype=o.prototype,u.now=n((()=>p()?c+s:r()),\"now\"),u.parse=o.parse,u.UTC=o.UTC,window.Date=n(u,\"Date\"),window.performance.now=n((function(){return i()+s}),\"now\");const l=String.prototype.match;String.prototype.match=n((function(t){const e=l.apply(this,arguments);if(p()&&t&&t.toString().includes(\"url=\")&&e&&e[1])try{const t=window.location.href;e[1]=encodeURIComponent(t)}catch(t){}return e}),\"match\"),Function.prototype.toString=n((function(){if(e.has(this))return e.get(this);return[\"XMLHttpRequest\",\"fetch\",\"querySelectorAll\",\"bind\",\"push\",\"toString\",\"addEventListener\",\"now\",\"Date\",\"match\",\"createElement\"].includes(this.name)?`function ${this.name}() { [native code] }`:t.apply(this,arguments)}),\"toString\");const d=window.fetch;window.fetch=n((function(t,e){const n=\"string\"==typeof t?t:t?.url||\"\",o=d.apply(this,arguments);if(n.includes(\"googleads.g.doubleclick.net\")){const t=o.then;o.then=function(e,n){return t.call(this,(function(t){return s+=Math.floor(20*Math.random()+40),e(t)}),n)}}return o}),\"fetch\");const w=Function.prototype.bind;Function.prototype.bind=n((function(t,...e){const o=w.apply(this,arguments);return this===i||this===r||this&&\"now\"===this.name?n((function(){return this===r?window.Date.now():window.performance.now()}),\"now\"):o}),\"bind\");const h=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,\"contentWindow\"),f=t=>{try{Object.defineProperty(t,\"contentWindow\",{get:n((function(){const t=h.get.apply(this);return t&&!t._patched&&(t.Date=window.Date,t.Function&&(t.Function.prototype.toString=window.Function.prototype.toString),t.performance&&(t.performance.now=window.performance.now),t.String&&(t.String.prototype.match=window.String.prototype.match),t._patched=!0),t}),\"get\"),configurable:!0})}catch(t){}},y=document.createElement;document.createElement=n((function(t){const e=y.apply(this,arguments);return\"iframe\"===t?.toLowerCase()&&f(e),e}),\"createElement\");const g=t=>t&&(t.includes(\"_executeCallback\")||a.test(t)),m=document.querySelectorAll,S=Element.prototype.querySelectorAll,E=function(t){const e=(this instanceof Element?S:m).apply(this,arguments);return\"iframe\"!==t&&\"IFRAME\"!==t||!g((new Error).stack)?e:new Proxy(e,{get:(t,e)=>\"length\"===e?12:t[e]})};document.querySelectorAll=n(E,\"querySelectorAll\"),Element.prototype.querySelectorAll=n(E,\"querySelectorAll\");const b=Array.prototype.push;Array.prototype.push=n((function(...t){if(g((new Error).stack)){const e=t.filter((t=>![\"fetch\",\"XMLHttpRequest\"].includes(t)));return 0===e.length&&t.length>0?this.length:b.apply(this,e)}return b.apply(this,t)}),\"push\");const A=window.addEventListener;window.addEventListener=n((function(t,e,n){return\"message\"===t&&\"function\"==typeof e&&e.toString().includes(\"googMsgType\")&&setTimeout((()=>{try{const t=document.getElementsByTagName(\"iframe\"),n=Array.from(t).find((t=>t.src.includes(\"google\")))||t[0];n&&n.contentWindow&&e({data:JSON.stringify({msg_type:\"resize-me\",googMsgType:\"pvt\",token:\"AOrYG...\",key_value:[{key:\"r_nh\",value:\"0\"}]}),source:n.contentWindow,origin:\"https://googleads.g.doubleclick.net\"})}catch(t){}}),500),A.apply(this,arguments)}),\"addEventListener\"),n(window.XMLHttpRequest,\"XMLHttpRequest\"),console.log(\"%c[iH-Shield] Revision 46: URL-Sync & Time-Ad Hybrid Active.\",\"color: #00ffff; font-weight: bold;\")}();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//,\"\");/*end*/var menuSlideProtection","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","#historicaerials_728x90_ATF, #historicaerials_160x600_Right, #historicaerials_160x600_Left","data-google-query-id","CJeD5_n3tZIDFfL1PAIdfZYjwQ","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","/(window\\.AdObserverManager\\.register\\('ds[ps][cp]-bottomRecommend'\\);)/","(()=>{window.addEventListener(\"load\",(()=>{const t=document.querySelector(\"#openwebSection\"),e=document.querySelector(\"div[data-spot-id]\");if(!e||!t)return;const d=e.getAttribute(\"data-spot-id\");if(!d)return;var o;((t,e,d)=>{const o=document.createElement(\"div\");o.setAttribute(\"data-spotim-module\",\"conversation\"),o.setAttribute(\"data-spot-id\",t),o.setAttribute(\"data-post-id\",e),d.appendChild(o)})(d,Math.abs((o=document.title,[...o].reduce(((t,e)=>Math.imul(31,t)+e.charCodeAt(0)|0),0))),t);const a=document.createElement(\"script\");a.setAttribute(\"src\",`https://launcher.spot.im/spot/${d}`),a.setAttribute(\"async\",\"\"),document.head.appendChild(a)}));})();$1","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","window.open","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","admbenefits","ref_cookie","/\\badblock\\b/","/if((.*))/","if(1==1)","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","31000, .VerifyBtn, 100, .exclude-pop.NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","counter_start\":\"load","counter_start\":\"DOMContentLoaded","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/\"http.*?\"/","REDIRECT_URL","/android/gi","stay","Android/","false/","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","timeLeft = duration","timeLeft = 0","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","close-modal","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","window.location.href = adsUrl;","div","<img src='/x.png' onerror=\"(function(){'use strict';function fixLinks(){document.querySelectorAll('a[href^=&quot;intent://&quot;]').forEach(link=>{const href=link.href;const match=href.match(/intent:\\/\\/([^#]+)/);if(match&&match[1]){link.href='https://'+match[1];link.onclick=e=>e.stopPropagation();}});}fixLinks();new MutationObserver(fixLinks).observe(document.body||document.documentElement,{childList:true,subtree:true});})()\">","4000","document.cookie.includes(\"adclicked=true\")","true","IFRAME","BODY","/func.*justDetect.*warnarea.*?;/gm","getComputedStyle(el","popup","/\\d{4}/gms","document.body.onclick","2000);","10);","(/android/i.test(t) || /Android/i.test(t))","(false)","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","fallbackUrl;","AdbModel","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","offsetHeight","offsetHeight+100","timeLeft = 1","/aclib|break;|zoneNativeSett/","1000, #next-timer-btn > .btn-success, 600, #mid-progress-wrapper > .btn-success, 1300, #final-nextbutton","3500","#next-link-wrapper > .btn-success","1600","/fetch|popupshow/","/= 3;|= 2;/","= 0;","count","progress_original = 6;","progress_original = 3;","countdown = 5;","countdown = 3;","= false;","= true;","focused","start_focused || !document.hidden","focused || !document.hidden","checkAdsBlocked","5000","1000, #continue-btn",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","!document.hasFocus()","document.hasFocus() == false","getStoredTabSwitchTime","/\\d{4}/gm","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","onpopstate","showBannerAdBlock","state.shown >= redirectUrls.length","(isAdsenseBlocked)","onDevToolOpen","/#Intent.*?end/","intent","https","adUrl","_blank","_self","href","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","9000","continue-button","3000","getElementById","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","/window\\.location\\.href.*/","/kiwi|firefox/","isFirefox || isKiwi || !isChrome","/2000|1000/","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","head","<div id=\"popads-script\" style=\"display: none;\"></div>","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","style","min-height:300px","ai_adb","window.admiral","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"|<a href=\"https:\\/\\/getad%/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","__adblocker","html-load.com","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","\"data-sdk\"","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","()=>eval","domain=?eventId=&error=",";confirm(","/\\(\\)=>eval|html-load\\.com|await eval/","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","d-none|media-filter-brightness|bg-dark",".media-main-image","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","prerollEnabled:true","prerollEnabled:false","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup/i","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","text-decoration","/break;case|FingerprintJS/","push","(isAdblock)","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","/mdp|adb/i","popunder","adbl","/protect?","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","reload","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","unlock_chapter_guest","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","off","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","ab","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","blockCompletely();","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","ins.adsbygoogle","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","in_d4","hanime.tv","p","window.renderStoresWidgetsPluginList=","//window.renderStoresWidgetsPluginList=","Custom Advertising/AWLS/Video Reveal",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|var FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","body","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","justDetectAdblock","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","/window\\.location\\.href.*?;/","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","student_id",".offsetLeft",":{content:","no:{content:","AdBlockChecker",".modal-content","data-adsbygoogle-status","done","document.body.innerHTML","/popunder|contextmenu/","\"hidden\"","/overlay/i","/aoAdBlockDetected/i","button[aria-label^=\"Voir une\"]","button[aria-label=\"Lancer la lecture\"]","function(error)",",\"ads\"","pdadsLastClosed","window.SCHEDULE.home","/^/gms","__INITIAL_STATE__","/$/gms","(()=>{const url=__INITIAL_STATE__.page.clickthroughPageData.url;if(url){window.location.href=url}})();","/offsetHeight|\\.test/","anti-adblock-message","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/cX_P|_pc/","/^_cX_/","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 880 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13;2,14,15;2,16,17;2,18,19;3,20,21,22;3,23,21,24;3,25,21,26;0,0,27,28,3,4;0,0,29,30;0,0,31;0,0,32,33;1,0,34;1,0,35;1,0,36,37,38;0,0,39,40;4,41,42,43,44,45,46,47,48,49,50,51;3,52,53,54;0,0,55,56;5,57,58,59;6;0,0,60,61;0,0,62,63,64,65;7,66,4;8,67;9,67,68;0,0,69,70;1,0,71;10,72,73,74,73,75,76;0,0,77,78;0,0,79,80,3,4;1,0,81;0,0,82,83;1,0,36;1,0,84;1,0,85;1,0,86;1,0,87;1,0,88;1,0,89;7,90,4;1,0,91;7,92,93;7,94,4;1,0,95;0,0,96,97;0,0,98,99;8,100;1,0,101;1,0,102;1,0,103;11,104,105;1,0,106;0,0,107,73,64,108;1,0,109;1,0,110;8,111;1,0,112;0,0,113,114;1,0,115;0,0,116;1,0,117;1,0,118;0,0,119,120;0,0,121;0,0,122,123;0,0,124,125;1,0,126;0,0,127,128;1,0,129;7,130,4;7,131,4;7,132,4;1,0,133;1,0,134;9,135,68;12,136;0,0,137,138;0,0,139,140,64,141;0,0,142,143;0,0,144,145;0,0,146,147;1,0,148;0,0,149,73,64,150;0,0,151,78,152,4;0,0,153,154,152,4;0,0,155,78;0,0,156,157;1,0,158;1,0,159;0,0,160,157,64,161;0,0,162,73,64,163;0,0,164,4,64,165;0,0,166,167;0,0,168,169;13,170;1,0,171;1,0,172;0,0,173,174;0,0,175,176;1,0,177;10,178,179;0,0,180,74,64,181;0,0,182,157,64,181;0,0,183;2,184,185;0,0,186,157;0,0,187,188;0,0,189,190;0,0,191;1,0,192;1,0,193;0,0,194,157;1,0,195;0,0,196,197;0,0,198,199;1,0,200;0,0,201,202,3,203;1,0,204;1,0,205;0,0,206;0,0,207,78;0,0,208,73,64,209;0,0,137,210,152,4;1,0,211;1,0,212;0,0,213,214;1,0,215;1,0,216;7,217,4;1,0,218;1,0,219;1,0,220;0,0,221,222;0,0,168,223;1,0,224;12,225,226;12,227,73,228;1,0,229;0,0,230,231,64,232;0,0,233,234;0,0,235,236;0,0,237,238,64,239;0,0,240,188;0,0,241,188;1,0,242;0,0,243,157;12,244,156;0,0,245,73,64,246;0,0,247,248;7,249,4;0,0,250,251;1,0,252;0,0,253,188;0,0,254,188;1,0,255;0,0,256,157,64,232;0,0,257,258,64,232;0,0,259,260;0,0,261,262;0,0,263,264;1,0,265;0,0,266,267;0,0,268,78;0,0,40,140,64,269;0,0,270,188;0,0,271,78;1,0,272;1,0,273;0,0,274,275,276,277;1,0,278;1,0,279;0,0,280,188;0,0,281,199;1,0,282;0,0,283;0,0,284,285;0,0,149,73,64,286;0,0,287,288,64,289;0,0,290,78;0,0,291,292;1,0,293;1,0,294;0,0,295,157,64,296;0,0,297,157,64,298;1,0,299;0,0,300,78;0,0,301,157;1,0,302;0,0,303;0,0,287,288;0,0,304,78,152,4;0,0,305,78,152,4;0,0,306,157;1,0,307;1,0,308;1,0,309;1,0,310;1,0,311;1,0,312;1,0,313;2,314,315;0,0,316,317;1,0,318;1,0,319;0,0,320,321;1,0,322;1,0,323;1,0,324;0,0,325;1,0,326;1,0,327;1,0,328;1,0,329;1,0,330;1,0,331;1,0,332;1,333,334;1,0,335;1,0,336;1,0,337;0,0,338,339,3,4;7,340,78;1,0,341;0,0,342,343;0,0,344,345;0,0,346,347;0,0,344,348;0,0,344,349;0,0,350,351,3,4;0,0,352,353,3,4;0,0,354,355,64,341;1,0,356;1,0,357;1,0,358;1,0,359;1,0,360;1,0,361;1,0,362;1,0,363;1,0,364;1,0,365;1,0,366;1,0,367;1,0,368;1,0,369;1,0,370;1,0,371;1,0,372;0,0,373,374,64,375;0,0,376,377;0,0,378,379;12,380,73,381;1,0,382;1,0,383;1,0,384;1,0,385;1,0,386;1,0,387;1,0,388;13,389,390;1,0,391;1,0,392;1,0,393;0,0,394,395;1,0,396;0,0,397,398,3,4;0,0,399,400;7,401,203;0,0,402,403,64,404;0,0,405,406;0,0,407,408;0,0,409,410,3,4;0,0,411;0,0,412,413;1,0,414;1,0,415;1,0,416;0,0,417,418;13,419;1,0,420;7,421,4;0,0,422;1,0,423;9,424,188;1,0,425;1,0,426;1,0,427;10,428,429,73,73,75,430;1,0,431;8,338;0,0,432,377,64,433;8,434;9,434,68;7,435,4;1,333,436;1,0,437;1,0,438;0,0,439,199;1,0,440;11,441,442;0,333,443,444;13,445,446,152;13,447,448,152;7,449,4;13,450;8,340;1,0,451;13,452,453,152;1,0,454;1,0,455;0,0,456,457;13,458,459;13,458,460;1,0,461;1,0,462;1,0,463;7,462,4;14,464;2,314,465;1,0,466;0,0,467,468,64,469;1,0,470;8;1,0,471;7,472,4;1,0,473;1,0,474;7,475,93;1,0,476;1,0,477;1,0,478;1,0,479;8,480;9,480,68;5,481,58,482;7,217,483,73,484,4;10,485,486;0,333,487,488,64,489;1,0,490;1,0,491;1,0,492;1,0,493;1,0,494;13,495;0,0,496,497;13,498,499;9,500,188;7,501,4;11,502,503;1,0,504;8,505;7,506,4;7,507,188;1,0,508;1,333,509;13,510,73,152;1,0,511;15;1,0,155,64,118;1,0,512;1,0,513;1,0,514;0,0,515,516;1,0,517;1,0,518;7,386,519;8,520;1,0,521;1,0,522;1,523,524;1,523,525;1,523,526;1,523,527;1,523,528;1,523,529;1,523,530;1,0,531;1,523,532;0,0,533;12,534;1,0,535;0,0,536,537,3,4;0,0,538,78;12,539;0,0,540,541,64,542;11,543,544;11,545,503;1,0,546;1,0,547;1,0,548;1,0,549;1,0,550;1,0,551;1,0,552;1,0,553;1,0,554;7,555,4;1,0,556;1,0,557;1,0,558;1,0,559;0,0,560,561,64,562;9,563,203;0,0,564,73,64,565;5,566,58,567;1,0,568;13,569,570;1,0,571;1,0,572;11,573,503;0,0,574,575,64,576;7,577,4,73,484,4;1,0,578;1,0,579;1,0,580;1,0,581;1,0,582;1,0,583;1,0,584;1,0,585;1,0,586;8,587;1,0,588;1,0,589;1,0,590;1,0,591;0,0,592,199;0,593,594;1,0,595;1,0,596;1,0,597;0,0,598,599;1,0,600;6,601;9,602,188;1,0,603;1,0,604;1,0,605;1,0,606;1,0,607;0,0,608,609;12,610;13,611,612;1,0,613;12,614;1,0,615;0,0,616,617;0,0,618,619;1,0,620;1,0,621;0,0,622,623;0,0,624,625;0,0,626,199;7,627,4;7,628,4;1,0,629;7,630,188,73,484,4;0,0,462,73,64,462,152,4;8,631;0,0,632,377;0,0,633,199;0,0,634;1,0,635;0,0,636,637,3,4;1,0,638;1,0,639;1,0,640;1,0,641;7,642,4;1,0,643;7,644,4;1,0,645;7,646,4;10,647,648;1,0,649;0,0,650,651;1,0,652;1,0,653;1,0,654;1,0,655;16,656,68;5,657,58,658;7,462,93;1,0,659;1,0,660;0,0,661,188;0,0,662,377;1,0,663;0,0,664,73,64,620;1,0,665;1,0,666;16,667,188;0,0,668,669;0,0,670,671;7,672,4;7,673,4;1,0,674;0,0,675,676;9,677,68;0,0,678,679;7,680,4,73,484,4;0,0,681;1,682,683;0,0,684,78;1,0,685;7,686,4,73,484,4;0,0,687,73,64,688;0,0,689,690;1,0,691;1,0,692;16,693,188;1,0,694;1,0,695;9,696,78;1,0,697;0,0,698,699,64,700;1,0,701;1,0,702;1,0,703;3,704,21,26;7,705,4;1,0,706;10,707,179;1,0,708;1,0,709;0,0,344,710,3,4;1,0,711;0,0,712,713,3,4;1,0,714;0,0,715;0,0,716,717;1,0,718;1,0,719;0,333,720,721;0,0,722,723;1,0,724;7,725,4;1,0,726;9,727,188;1,0,728;0,0,729,730;7,731,4;1,0,732;0,0,7,733;1,0,734;1,0,735;3,736,737,738;1,0,739;13,740,741;10,742,4,73,73,75,743;0,0,462,744;0,0,745,746,64,747;12,748,73,749;1,0,750;8,751;1,0,752;1,0,753;1,0,754;10,755,756;1,0,757;1,0,758;1,0,759;0,0,760,188;1,0,761;1,0,762;0,0,763,764,3,4;9,765,68;1,0,766;0,0,767,768;0,0,769;1,0,770;17,771,771;1,0,772;13,773,73,152;7,774,4;8,775;1,0,340;16,776,777;1,0,778;0,0,779,780;1,0,781;0,0,782;1,0,783;1,0,784;1,0,785;1,0,786;1,0,787;8,788;10,789,188,73,73,484,4;1,0,790;1,0,791;1,0,792;7,793,188;1,0,794;1,0,795;1,0,796;0,0,797,73;7,798,188;7,799,188;1,0,800;1,0,801;1,0,246;0,0,802;9,803,4;4,804,179;1,0,805;1,0,806;1,0,807;1,0,808;10,809,810;2,811,812;1,0,813;1,0,38;0,0,814,815;0,0,344,816,3,4;0,0,817,818,3,4;1,0,819;0,0,820,821;1,0,822;1,0,823;1,0,824;7,825,4;7,826,4,73,484,4;11,827,442;0,0,828;1,0,829;0,0,830,831;0,0,274,832;0,0,833,834;0,0,835;1,0,836;1,0,837;0,0,838,839;1,0,840;1,0,841;1,0,842;1,0,843;1,0,844;1,0,845;1,523,846;1,0,847;1,0,848;1,0,221;9,849,68;1,0,850;0,0,851,852;1,0,853;1,333,854;3,704,855,856;2,704,184;1,0,857;1,0,858;1,0,859;1,0,860;1,0,861;12,862;12,863;1,0,864;0,0,865;4,866,179;1,0,867;1,0,868,37,869;0,0,870,871,64,869;1,0,872;1,0,873;5,874,875,4;1,0,876;1,0,877;1,0,878;1,0,879;9,880,68;9,881,68;9,882,68;9,883,68;9,884,68;9,885,68;11,886,503;8,887,888,889;9,890,68;11,891,503;11,892,893;9,894,68;11,895,896;11,897,898;11,899,503;11,900,901;11,902,903;11,904,105;11,905,901;11,906,503;11,907,903;11,908,909;11,910,503;11,911,503;11,912,901;11,913,914;11,915,503;11,916,503;11,917,903;11,918,919;11,920,503;11,921,922;11,923,924;11,925,503;11,926,105;11,927,503;11,928,929;11,930,931;11,932,933;11,934,935;11,936,937;11,938,903;11,939,503;11,940,941;11,942,503;11,943,944;11,945,946;11,947,503;11,948,949;11,950,951;11,952,953;11,954,503;11,955,956;11,957,503;11,958,503;8,959;8,960;8,961;8,962,888,889;8,963;8,964;8,965,888,889;8,966;10,965,73,74;7,967,483;7,968,483;8,969;8,970;8,971;8,972,888,889;8,973,888,889;9,974,68;16,975,68;8,976;9,977,68;8,978,888,889;10,978,74,73,73,75,979;8,980,888,889;10,981,73,74,73,75,982;8,983;8,984,888,889;9,985,68;16,986,68;8,987,888,889;8,988;9,989,68;8,990;9,991,68;8,992,888,889;8,993;8,994;8,995,888,889;9,996,68;16,997,68;8,998,888,889;8,999,888,889;9,1000,68;8,1001;8,1002,888,889;9,1003,68;8,1004,888,889;8,1005,888,889;9,1006,68;16,1006,68;8,1007;8,1008;9,1008,68;9,1009,68;9,1010,68;10,1011,73,74,73,75,1012;10,1013,73,74,73,75,1012;9,1014,68;8,1015,888,889;9,1016,68;9,1017,68;8,1018;8,1019;8,1020,888,889;9,1021,68;8,1022,888,889;9,1023,68;9,1024,68;9,1025,68;8,1026,888,889;8,1027;8,1028,888,889;8,1029;9,1030,68;8,1031;8,1032,888,889;8,1033,888,889;10,1034,73,74,73,75,1035;10,1034,73,74,73,75,1036;9,1037,68;8,1038,888,889;9,1039,68;9,1040,68;10,1041,73,74,73,75,1042;10,1043,73,74,73,75,1042;10,1044,73,74,73,75,1042;10,1045,73,74,73,75,1046;9,1047,68;9,1048,68;8,1049;9,1050,68;9,1051,68;9,1052,68;8,1053,888,889;9,1054,68;8,1055,888,889;9,1056,68;8,1057,888,889;9,1058,68;8,1059,888,889;9,1060,68;9,1061,68;8,1062;9,1063,68;11,1064,914;11,1065,914;11,1066,914;11,1067,914;11,1068,914;11,1069,914;11,1070,914;11,1071,914;11,1072,914;11,1073,914;11,1074,503;1,0,1075;8,1076;8,1077;16,1078,78;11,1079,1080;8,1081;11,1082,503;10,981,73,74,73,75,1083;8,1084;9,1085,68;8,1086;10,1087,1088,73,73,75,1089;10,1090,73,74,73,75,1089;10,1091,73,74,73,75,1089;10,1087,1088,73,73,75,1092;10,1090,73,74,73,75,1092;10,1091,73,74,73,75,1092;8,1093;8,1094;1,0,1095;8,1096;9,1097,68;8,1098;9,1099,68;16,1100,68;9,1101,68;9,1102,68;8,1103;16,1104,68;8,1105,888,889;11,1106,503;8,1107;9,1108,68;1,0,1109,64,1110;1,0,1111";

const $scriptletArglistRefs$ = /* 5274 */ "211;211;203;43;228;203;21,497;676,677,678,679,680,681;203;38,203;203;439;225;313;228,248,676,677,678,679,680,681;253;846,847;203,514;211,253;38;38;203;228,676,677,678,679,680,681;216;228;225;211;138,213;41,203,213;225,241;228,247;203;80;203;137,138;228;228,676,677,678,679,680,681;211;43;36;42;38,203;228;228;359;239;211;228;228;228,248,676,677,678,679,680,681;211;225;203;676,677,678,679,680,681;37;228,676,677,678,679,680,681;199;203;258;228,249;253;203;213;322;101;211;213;228;82;69,199;211;203;203;237;676,677,678,679,680,681;69,199;225;386;213;203;520;121;203;203;227,228;228,676,677,678,679,680,681;203;731;737;228;600;672;203;443;38;527;692;211;796;203,282;203;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228,676,677,678,679,680,681;203;2;211;211;211;199,228,248,676,677,678,679,680,681;225,246;225;228;211,410;808,809;503;249;211;228;674;228;237;199;670;228;228;4,685,737;311;228,676,677,678,679,680,681;203;469;717,718;371;203;879;211,253;227,228;248;228;599;55;38;38;225;184;228;325;203;439;211;199;227,228;228;831;228;228,676,677,678,679,680,681;228;228;203;509;509;799;237;217;203;203;203;228;258;228;228;211;762,763;414;228,676,677,678,679,680,681;225;201;579;791;203;246;228,676,677,678,679,680,681;688;215;228;205;644;764;203;203;228;228;227,228;203;27;203,211;203;203;228,248;215;203;203;227,228;774;203;228;228;527;203;203;203;318;71,199;203;203,282;203;205;676,677,678,679,680,681;203;225;227,228;628;55,203;337;228,676,677,678,679,680,681;211;203;203;38,55,211;228;49;55,203,211;203;203;203;225;228;228,676,677,678,679,680,681;228;225;795;38;203,215;203;203;203;228;203;228;602;602;203;502;258;807,809;203;203;228;203,211;203;203,211,214;203;211;258;203,215;676,677,678,679,680,681;203;203;203;474;241,676,677,678,679,680,681;228,676,677,678,679,680,681;203;228;228;228,676,677,678,679,680,681;124,125;593;354;692;228;692;203;203;228;203;744;252;367;228;203,211;203,622;731;213;439;258;371;253;253;203;228;203;203;228,676,677,678,679,680,681;253;253;203;253;246;228;203,211;94,203;430;211;211;203;203;122;261;227,228;692;5;211;114,115,116,117;203;203;211;490;228;211;157;676,677,678,679,680,681;219;141,142;203;203;94;293;228;676,677,678,679,680,681;82;228;228;228;228;555;203;777,778,779;211;417;203;203;228;53;785,786,787;798;203,211;223;228,676,677,678,679,680,681;228;203;228;225,299;228,676,677,678,679,680,681;577;420;228;228;203;203;203;259;31;465,466,467;203;38,55;225;237;300;744;676,677,678,679,680,681;89;258;215;676,677,678,679,680,681;228,676,677,678,679,680,681;676,677,678,679,680,681;664;248;237,676,677,678,679,680,681;848;199;483;203;228;203;228,676,677,678,679,680,681;38,203;203;203;643;225;228;228;228;141,142;676,677,678,679,680,681;228;577;588;38;203,215;203;38;228;38;203;228;203;851;228,676,677,678,679,680,681;839;840;841;676,677,678,679,680,681;258;211;46;203;122;203;203;228;228;203;388;122;122;164,165,166;203;203;262;848;203;462,463,464;439;356;213;203;203;358;44;271;691,717,718,719,721,722;199;638;215,424;424;203,282;122;228;228;83,84;203,211;203;203,322,402;203;122;122;228;203;203;203;228,676,677,678,679,680,681;228;38,211;253;203;203;122;228;871;588;180,181,183;228;122;122;199;228;123;225;228,676,677,678,679,680,681;473;548;322;118;174;314;462,463,464;693;203;203;676,677,678,679,680,681;141,142;211;203;203;87;717,718,719;368,369;203;203;228;228;228;203;38;203;228,676,677,678,679,680,681;203;94;203;211;315;258;161,162;211;321;75,76,77;211;203;203,259;206;228;253;228;203;213;203;228;139;211;264;122;122;305;211;203,211;414;228;63;612;203;133;203;203;239;228;228;588;291;228;228;228;258;228;211;731;228;253;228,676,677,678,679,680,681;69,199;203;545;130;701,702,751,752;164,165,166;245,248;215;122;228;380;44;424;642;67;870;228;289,290;203;228;157;740;609,610;211;57;203;221;553;228,676,677,678,679,680,681;228;258;424;211;203;456;533;203;507;271;44,448,449;211;211;203;252;67;225;203;829,830;211;199;203;692;462,463,464;228,676,677,678,679,680,681;228;213;228;776;83,84;211;383;228;242;228;211;594;211;203;225;228;366;211;203;228,676,677,678,679,680,681;211;203;203;228;817;717,718;203;228;228;228;258;429;203;203;270;230,676,677,678,679,680,681;676,677,678,679,680,681;676,677,678,679,680,681;228,676,677,678,679,680,681;228,676,677,678,679,680,681;203;203;203;203;94;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228,676,677,678,679,680,681;157;207;203,223;164,165,166;259;203;94;203;211;792;792;203;102,103,104,105,106;67;203;261;211;227,228;353;228;228;401;225;608;203;228;55;462,463,464;588;249;228,676,677,678,679,680,681;211;94;203;203;59;256;228;228;225;415;661,662;363;65,363;837;130;213;676,677,678,679,680,681;215;228;228;374;228;244,245;199;583;203;524;203;225;323;94;211;33;211;59;228;225;228,676,677,678,679,680,681;143;38;203;203;228;228,676,677,678,679,680,681;258;697;203,211;252;94;94;2;94,133;258;203;203;228;213;203;203;81,82;228;676,677,678,679,680,681;203;353;428;203;211;225;875;211;228,676,677,678,679,680,681;228;228;554;246;228;66;203,215;203,211;203;203;133;203;203;219;63;44;225;271;150,151,152,203;41;330;40;72;38;203,282;651;203,282;126;228;203;203;83,84;53;203,514;215;228;225;228;211;237,676,677,678,679,680,681;228,676,677,678,679,680,681;484;211;447;203;203;225;203;241,676,677,678,679,680,681;215,320;203;203;122;38;94;203;692;203;253;203,211;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;253;225;228;353;179;243;211;203;225;477,478;203;431;228;462,463,464;462,463,464;462,463,464;462,463,464;228;203;203;258;203;692;328;228,676,677,678,679,680,681;227,228;203;203;228,676,677,678,679,680,681;211;533;227,228;203;228;211,213;211;228,676,677,678,679,680,681;228;228,676,677,678,679,680,681;228;185,186;228;442;23;539,872,873;569;228;94;78;38;630;203;203;228,676,677,678,679,680,681;225;203;38;203;211;203;228,676,677,678,679,680,681;252;403;225;304;223;228;203;203;203;59;676,677,678,679,680,681;219;44;131,364;225;225;203;55;123;203;228;325;225,756,757,758;199;848;40;228;228;228;572;203;848;203;125;225;228,676,677,678,679,680,681;211;676,677,678,679,680,681;203;203,211,514;35,228,676,677,678,679,680,681;122;228;203;835;225;203;306;203;228;203;131,133;203;94;676,677,678,679,680,681,729;225;228,676,677,678,679,680,681;228;203;228,237,676,677,678,679,680,681;253;228;228;203;619;676,677,678,679,680,681;588;450;203;874;203;227,228;211;294;227,228;47,48;848;283;203;228;203;205,215,615;213;211;203;256;38;38;228;618;676,677,678,679,680,681;228;228;227,228;203;203;203;228;228;228;237;203;248;566;228;228;188;203;584;141,142;821;479;228,676,677,678,679,680,681;228;203;228;228;203;55,203;412;588;859,860,861;211;38;617;203;228,676,677,678,679,680,681;135;228;178;203;228;258;259;203;258;258;203;676,677,678,679,680,681;267;228;297,298;239;227,228;203;241,676,677,678,679,680,681;879;228;228;626;94;228;203;228,676,677,678,679,680,681;78;228,676,677,678,679,680,681;258;228,676,677,678,679,680,681;225;203;228;201;797;224,252;203;203;203;424;693;203;424;228;203;203;228;259;370;228;228,676,677,678,679,680,681;398;848;203;203;211;321;203;710;94;94;228;203;38;203;211;213;203;203;203,215;211;485;203;203;363;228,676,677,678,679,680,681;228;228;588;203;691,717,718,721,722;203;203;542;676,677,678,679,680,681;225;374;38;203;556;203;203;203;228;40;14,15,16,17;228;203;211;203;228;203;19,20,218;228;227,228;203;279;228,676,677,678,679,680,681;225,734;424;228,676,677,678,679,680,681;225;203;225;665;203;203;228;203;773;211;203;693;559;211;211;717,718;228,676,677,678,679,680,681;307,308;203;228;203;89;203;5;134;180,181;215;215;203;44;228;215,590;203;228,676,677,678,679,680,681;130;211;203;203;203;99;496;203;203;228;203;203;228;225;211;203;203,215;203;588;215;521;203;651;651;38;203,211;203,213;61;228;228;70;203;228;676,677,678,679,680,681;331,332;252;228;199,200;228;731;228;228;215;227,228;446;130;45;5;203;38,213,517;201;228;228;228;648;228;699;203;228;228,676,677,678,679,680,681;203;38,55;-39;203;227,228;187;211;202;203;424;228,676,677,678,679,680,681;441;249;60,225,715;211;203;211;203;373;203;38;239;228;228;228;423;676,677,678,679,680,681;588;225;424;640;401;203;533;343,344,345,346,347;259,624;228;228;470;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;592;510,511;85;211;-39;203;228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;213;203;228;228;228,676,677,678,679,680,681;203;228;228;228;228;228;38,211;320;203;228;228;750;228;203;248;203,588;203;228;225;225;203;228,676,677,678,679,680,681;656;203;203;203,282;122;211;424;131,133;317;180,181,182,183;225;203;140;228;228,676,677,678,679,680,681;203;228;111;676,677,678,679,680,681;228;420;203;203;25;676,677,678,679,680,681;259;203;242;133;59;225;203;329;588;848;676,677,678,679,680,681;252;228;588;784;588;242;228;228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;-39,-589,-880;228;242;457;228;116;632;228;135;227,228;211;211;588;228;203;228;228;228;424;225;225;201;203;225,246;227,228;211;203;498,499;228;213;228,676,677,678,679,680,681;203;253;649;79;225;588;167,168,169;253;57;585;438;676,677,678,679,680,681;203;53;716;424;203;229,676,677,678,679,680,681;228,676,677,678,679,680,681;157;248;94;228;735,736;361;227,228;242;203;547;325;228;228;38;271;203,211;211;203;203;211;228;211;211;228;141,142;203;227,228;320;440;203;271;201;228;577;203;227,228;228,676,677,678,679,680,681;228;543;228;25;211;692;228,676,677,678,679,680,681;64;228;228;225;228;395;228,676,677,678,679,680,681;537;211;424;258;203;203;259;367;38;203;95,96,97,98;130;203;203;228;827,828;228;227,228;418;228;588;459,460;228;228;203;424;40;228,676,677,678,679,680,681;228;228,676,677,678,679,680,681;203;203;59,203;422;228;203;228;111,112,113;203;228;203;392;228;203;258;203;228,676,677,678,679,680,681;633;616;228;228;228;203,211;419;296;203;228,676,677,678,679,680,681;228,676,677,678,679,680,681;203,215;228;228;228;25,203;203;228;574;222;682;203;601;228,676,677,678,679,680,681;227,228;228;203;228;228;225;334;127;474;203;693;203;131,133;228;225;228,676,677,678,679,680,681;228;198;28;203;228;94;228;203;852,853,854;676,677,678,679,680,681;203;228;211;228;228;225;663;614;215;648;508;228;228;227,228;141,142;203;228;213;211;211;203;203;211;832;228;228;211;825,826;228;86;228,676,677,678,679,680,681;228;55;228;228,676,677,678,679,680,681;228,244,245,248;228;228;203;228,676,677,678,679,680,681;518;228,676,677,678,679,680,681;203;25;228,676,677,678,679,680,681;242;203;211;225;800;228,238;718;203;32;386;228;225;324;228;228;211;228;258;203;203;386;203;693;693;203;203;424;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;676,677,678,679,680,681;237;203;90,91,92;228;228;228;228;228;228;228;228;642;228;203;228;244,245;228,676,677,678,679,680,681;211;225;534;227,228;228;211;203;577;577;577;228;228;228;672;228;228;228;225;228,676,677,678,679,680,681;203;203;203;225,717;203,744;144,145,146,147,148,149;225;122;228,676,677,678,679,680,681;228;653;94;227,228;242;452;693;199;424;225;563;355;211;728;228;228;256;215;203;203;591;203,215,282,521;252;129;203;225;228,676,677,678,679,680,681;205;205;228;203,215,282,521;406;130;228;144,145,146,147,148,149;436;365;780;228;863;44;734,819,820;629;203;203;203;228;228;804;441;447;447;447;256;211;211;203;219;203;237;228;228;228;203;227,228;302;203;227,228;203;228;40;462,463,464;228,676,677,678,679,680,681;228;660;203;215;211;203;5;203,211,514;211;228;228;744;228;650;201;141,142;228,676,677,678,679,680,681;203;671;205;228;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;228;228;693;693;203;89,196,197;228;693;658;340;203;374;228;228,676,677,678,679,680,681;203;52;228;211;228;203;211;203;211;228;228;203;228;225,226;228;228;228;203;38;228;203;761;56;228;588;89,196,197,198;225;674;228;203;203,282;227,228;282,521;203;132;203;228;203;258;493;203;53;94;461;94;349;305;227,228;228;228;228;225;228,248,676,677,678,679,680,681;203;228;567;676,677,678,679,680,681;227,228;228;325;228;213;203;228;228;351;225;228;259;203;225;364;672;123;228;848;259;133;742;40,352;225;783;228;203;667,668;228;228;522;94;203;276,277;588;228;225,597;130;228,676,677,678,679,680,681;494;228;228;227,228;241,676,677,678,679,680,681;228,676,677,678,679,680,681;225;55,211;228;228;362;405;123,203;203;462,463,464;228;734;201;203;228;38;676,677,678,679,680,681;228;123;731;227,228;228;228;134;203,211;848;203;767,768,769;228,676,677,678,679,680,681;203;228;498;498;228;228;253;94;203;227,228;481;259;588;242;248;228;228;833;94;421;172;439;203;259;131,158,159,160;228;676,677,678,679,680,681;228;228;228,676,677,678,679,680,681;571;211;38;199;203;304;258;203;611;676,677,678,679,680,681;203;203;228;228;575;203;228;228;228;228;228;316;203;203;424;538;203;588;310;673;190,191,192,193,194,195;203;203;636;228;228;241,676,677,678,679,680,681;228;228;228,676,677,678,679,680,681;228;228;228;479;544;203;228;228;228,676,677,678,679,680,681;228;228,248;130;228,676,677,678,679,680,681;211;674;258;263;258;40;203;336;203;228;228;235,676,677,678,679,680,681;203;856,857,858;228;228;321;225;211;228;228;225;228,676,677,678,679,680,681;813,814,815;348;228;203;876,877;203;258;228;203;377;111,112,113;102,103,104,105,106;239;228,676,677,678,679,680,681;714;228;228;538;242;394;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228,676,677,678,679,680,681;203;228,676,677,678,679,680,681;228,237;203;228;228,676,677,678,679,680,681;203;236,676,677,678,679,680,681;259;133;109,110;44;211;228,676,677,678,679,680,681;731;228;848;239;228;94;228,676,677,678,679,680,681;832;228,676,677,678,679,680,681;225;639;693;123;227,228;203;203;203;225;40;94;40,94;737,739;213;203;203;203;38;614;812;718;225;228;676,677,678,679,680,681;228;203;635;39,199;203;203;203;203;228;203;203;686,687;228;228;211;227,228;252;203;203;203;203;225;248;228;228;228;731;427;203;382;353;353;838;228,676,677,678,679,680,681;203,282;199;228,676,677,678,679,680,681;203;413;225;211;219;203;228;248;224,252;228;753;203;228;693;228;596;228;203;203;491,492;228,676,677,678,679,680,681;203;204;228;203;228;203;849;367;228;228;625;210;210;203,550;203;203;203;203;203;139;848;240,676,677,678,679,680,681;845;228,676,677,678,679,680,681;227,228;225;203;6,7,8,9,10,11,12,13;228;225;38,517;122;228;228;228;228;228;228;558;350;228,676,677,678,679,680,681;38,301;228;578;201;228;242;203;228;203;203;228,676,677,678,679,680,681;228;228,676,677,678,679,680,681;211;228;228;242;228;213;228;268;228;203,259;203;203;203;203;203;237;211;259;260;793,794;319;203,215;203;157;248;203;203;228;225;228;5;203;203,215;203;246;228;203,215,693;228;228;203;211;676,677,678,679,680,681;203;228;228;690;228;215;215;215;693;693;203;521;67,203;211;564;38;228;770;228;203;646;211;203,282;94;636;719;370;228;718;246;228;201;203;228;225;848;228;203;228;495;203;213;203;397;447;447;203;256;94;259;252;228;123;94;228;201;228;228;447;447;203;228,676,677,678,679,680,681;211;228;227,228;203;203;462,463,464;215,320;387;219;203;228;38;211;211;588;201;203;781,782;848;228;285,286;850;203;228,676,677,678,679,680,681;228;203;737,738;38;213;228;237;201;203;228;588;225,755;203;611;228;258;228;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;462,463,464;693;203;203;693;203;228;879;228;228;228;203;228;228;203;529;806;228;23;228;265;228;228;228;228;798;203;205;228,676,677,678,679,680,681;588;228,676,677,678,679,680,681;228;211;802,803;94,129;203,215;203;203;213;203;203;228;228;228;134;50,51;248;228;228;228;228;203;242;228;134;228;94;25,335;258;203;227,228;228;228;199;225,775;588;123;588;228;228;228;224,252;228;672;228;87;225;228,676,677,678,679,680,681;205;228;201;203,213;55,211;228;228;228;672;333;258;38,55,588;203;228;38,55;588;203;203;228;203;203;508;228;228;848;848;201;225;228,676,677,678,679,680,681;228;25;848;848;338,339;338,339;201;203;228;228;242;203;241,676,677,678,679,680,681;228;34;237,676,677,678,679,680,681;228;228;225;698;38,301;38,55,203,211,301;227,228;390;256;228;228;228;203;203;38;228;228;38;228;228;228;211;203;203,215;225;228;271;25,531,532;228;228;228;102,103,104,105,106;228;203;379;190,191,192,193,194,195;228;228;228;203;130;228;203;227,228;228;94;203;213;215;171;228;228;228;462,463,464;228;203;534;228;44;203;227,228;528;203;541;203,282;134;228;228;228;588;271;225;38;676,677,678,679,680,681;228;203,215;228;228;164,165,166;228;95,96,97,98;228;271;203,211;203;203;258;209;203;40;40;211;211;203,211;228;228;228;203;228;836;228;203,211;203;228;228;268;163;691,717,718,721,722,726;228;280;566;241,676,677,678,679,680,681;227,228;657;228,676,677,678,679,680,681;203;228,676,677,678,679,680,681;256;215;205;228;228;58;676,677,678,679,680,681;514;228;203,468;228;228,676,677,678,679,680,681;228;588;228;567;228;228;212;228,676,677,678,679,680,681;228;241,676,677,678,679,680,681;228;252;227,228;714;760;228;86;862;304;225;281;228;203,213;234;561;228;228;199;40;161,162;228;788,789,790;208;211;641;228;219;173;228;228;203;203;228;228;203;40;228;228,676,677,678,679,680,681;203;239;225;228,676,677,678,679,680,681;424;211;462,463,464;119;818;203;242;389;203;228;228,676,677,678,679,680,681;225,754;203;228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;228;731;242;228;228;672;694,695,696;228;228;203,309;848;227,228;228;475;225;203;848;228;693;693;278;227,228;453;203;227,228;844;203;228;227,228;227,228;203;228;38;255;227,228;203;201;203;659;451;203;588;842;228;203;203;228;228;203;514,517;228;242;228;228;228;848;228,248;496;587;203;203;203;225;203;94;215;203;228;228;130;25;203;225;848;242;647;211;744;203;372;848;227,228;201;215;94;40;228;228;250;645;203;228;711,712;246;203;203,211;203;228;225;340;727,823,824;211;228;228;69;228;514;228;228;228;228;228;203;228;634;203;215;242;227,228;228;203;203;228;203;219;211;228;228;228;228;225;636;94;525;676,677,678,679,680,681;228;227,228;201;225;225;203;205;67;731;400;94;228;355;203;225,248;203;211;144,145,146,147,148,149;248;672;248;203;848;228;228;848;228;256;228;203;203;228;848;228;203;203;228;55;55,211;225;228;130;228;203;228;203;203;228;228;228,676,677,678,679,680,681;203;211,320;693;203;228;227,228;242;228;845;24;38;228,676,677,678,679,680,681;259;203;211;557;203;228;203;228;462,463,464;462,463,464;462,463,464;462,463,464;215;530;257;228;228;203;228;228;67;228;228;228;228;79,215;228;228;228;228;227,228;228;228;227,228;228;86;203;228;225;211,424;228,676,677,678,679,680,681;38;228;133;203;424;211;676,677,678,679,680,681;133;228;228,676,677,678,679,680,681;228;225;228;228;228;228;94;38;228;227,228;213;94;203;228;745,749;225;225;242;55;55;55;203;215;203;228;228;38;203;228;227,228;38;287;667,668;227,228;228;228;228;228;123;228;834;228;203;228;228;252,745;237,676,677,678,679,680,681;203;258;672;114,115,116,117;228;406;63;228;228;242;228;228;228;848;848;242;225;242;228;759;228;228;227,228;144,145,146,147,148,149;228;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;274;38;203;228;228;199;134;228;228;228;228;225;203;231,676,677,678,679,680,681;224,252;225;637;390;228;211;131;227,228;486,731;227,228;203;223;480;228;228,676,677,678,679,680,681;546;203;25,531,532;167,168,169;100;228,248;228,676,677,678,679,680,681;248;225;203;228;227,228;237;225,228;693;292;588;228,676,677,678,679,680,681;228,676,677,678,679,680,681;5;399;227,228;228;228,676,677,678,679,680,681;228;237;228;199;228;203;228,676,677,678,679,680,681;228;227,228;258;228;211;203;627;228;199;143;228;309;203;732,733,744;258;203;203;228;203;228;203;228;228;227,228;228;384;517;228;228;228;203;198;228;38;228;203;242;228;228;228;227,228;228,676,677,678,679,680,681;228;228;228;203;228;228;458;228,676,677,678,679,680,681;633;266;175,176,177;228,676,677,678,679,680,681;228;848;228,676,677,678,679,680,681;228;378;83,84;228,676,677,678,679,680,681;424;211;242;411;228;228;203;228;228;228;848;772;201;693;228;227,228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;38;228;228;242,676,677,678,679,680,681;228;848;228;225;228;67;663;636;228;38;205;38;254;203;203;133;119;360;588;203;228;848;228;242;241,676,677,678,679,680,681;228;228;215;227,228;228;203,211;211;203;227,228;424;848;228;228,676,677,678,679,680,681;496;225;228,676,677,678,679,680,681;123;693;693;228;228;570;203;203;211;228,676,677,678,679,680,681;203;228;225;155,156;203;228;848;203;431;228;228;228;228;228;228;81,82;228;203,259;228;203;228;431;38,55,588;228;228;228;377;228;123;203;228;228;496;676,677,678,679,680,681;375;228;228;242;38;228;228;228;38;577;228;228,676,677,678,679,680,681;87,219;538;228;228;228;38,203;228;486,731;203;203,205;120;438;228;228,676,677,678,679,680,681;227,228;228;242;228;676,677,678,679,680,681;225;38;867;228,676,677,678,679,680,681;228,676,677,678,679,680,681;203;489;676,677,678,679,680,681;38;228;55,203,211,282;228;225;228;203;228;258;228;228;228;203,282;203,282;228;228;203;228;227,228;228;203;454;228;242;203;342;224,252;228;848;203;848;203;237;38;38;223;519;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;385;203;228;256;130;228;203;228;249;203;451;55;228;248;228,676,677,678,679,680,681;228;228;203;228;55;228;228;228;228,676,677,678,679,680,681;611;228;228;203;367;693;201;199;666;228;228;848;87;224,252;424;203;588;201;855,-860,-861,-862;0,1;203;693;203;228;242;228;144,145,146,147,148,149;228,676,677,678,679,680,681;228;228;228;228;228;227,228;228;203,282;203,282;203;203;227,228;228;228;228;228;203,565;203;38,211;228;228;228;272,273;211;228;693;227,228;228;228;203;320;228;242;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;248;848;805;239;228;242;228;676,677,678,679,680,681;228;228;203;242;228;203;228;228;228;228;258;228;228;228;228;199;203;741;228;228;228;55;113;227,228;588;588;588;228;228;134;228;227,228;228;228;54;227,228;228;848;848;203;228;431;38;675;228;227,228;203;228;228;228;203;228;228;228;730;425;44;203;228;848;228;228;228;228;390;228;228;228;228;228;431;203;227,228;228;223;44;172;228;201;676,677,678,679,680,681;228;228,676,677,678,679,680,681;228;228;203;228,248,676,677,678,679,680,681;203;203;271;693;228;203;227,228;203;242;676,677,678,679,680,681;228;203;228;203;228;228;134;341;228;130;223;228;248;228;78;271;203;251;219;227,228;228;228;228;228;228,676,677,678,679,680,681;227,228;242;130;88;228,676,677,678,679,680,681;228;93;228;228;228;228;228;248,676,677,678,679,680,681;227,228;211;225;38,203;396;228;227,228;242;203;588;228;228;203,215;228;228,676,677,678,679,680,681;227,228;424;227,228;311;225;228,676,677,678,679,680,681;228;228;228,676,677,678,679,680,681;242,676,677,678,679,680,681;203;227,228;228;228;416;225;225;228;225;201;228;228;228,676,677,678,679,680,681;215;139;225;228;228;228,676,677,678,679,680,681;228;228;239;227,228;203;203;228;228;228;515,516;225;228;203;44;228;228;228;211;228;211,424;224,225,248;201;693;228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;225;129;228;228;227,228;228;309;203;203;228;228,676,677,678,679,680,681;848;717,718;691,717,718;228;620;228;242;228;228;228;68;228;424;588;228;228;526;228;201;228;228,676,677,678,679,680,681;228;228,676,677,678,679,680,681;228;228;228;228;848;573;242;223;228;130;228;340;225;228;203;203;228;205;228;228;228;228;228;228;228;810,811;211;228;211;228;228;228,676,677,678,679,680,681;228;322;228;228;718,724,725;228,233,676,677,678,679,680,681;424;213;424;203;228;228;228;228;242;588;211;213;203;203;588;562;228;228;203,282;203;228,676,677,678,679,680,681;848;228,676,677,678,679,680,681;391;211,282;225;228;95,96,97,98;122;228;228;228;676,677,678,679,680,681;227,228;228;228;94;225;228,676,677,678,679,680,681;225;189;242;228;603,604;228;228;225;227;227,228;242;228;228;691,700,717,718,719;203;40;228;228;437;228;203;228;228;203;256;573;29,30;219,220;228;228;228;203;224,252;228;228;205;134;228;211;228;228;228;285,286;228;228;693;203;89;517;227,228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;676,677,678,679,680,681;228,676,677,678,679,680,681;312;228;228;462,463,464;228;228;228;228;38;225;693;588;242;228;227,228;203;228;203,282;203;848;228;227,228;228;227,228;320,488;227,228;832;228;228;134;228;228;227,228;228;228;136;228;242;227,228;94;242;259;201;259;203;242;228;203;223;228;801;228;227,228;227,228;225;224,252;228;228;203;648;228;540;225;228;228;228;613;38;227,228;228;676,677,678,679,680,681;848;228;228,248,676,677,678,679,680,681;227,228;517;227,228;676,677,678,679,680,681;38;228;122;228;228;848;848;170;228;227,228;242;228;203;203;228;621;155,156;228;139;228;228;227,228;227,228;676,677,678,679,680,681;228;228;228;228;38;228;227,228;203;864,865,866;576;228;228;203;134;228;404;816;672;237;228;292;203;471;211;228;225;225;227,228;228,676,677,678,679,680,681;203;228;203;228;228;228;227,228;211;228;228;228;228;228;228;228;271;139;228;203;228;203;246;203;213;136;227,228;227,228;228;211,535,536;535,536;535,536;54;225;228;225,228;237,676,677,678,679,680,681;228;228;228;228;228;228;228;143;228;228;228,676,677,678,679,680,681;362;228,676,677,678,679,680,681;203;203;228;228;203;426;225;38,517;228;228;551;211;223;227,228;228;203;228;201;228,676,677,678,679,680,681;228;684;239,676,677,678,679,680,681;225;228,248;203;119;203;225;228;228;228,676,677,678,679,680,681;228;244;228;228;228;228;717;203;228;228;228,676,677,678,679,680,681;55,211;227,228;676,677,678,679,680,681;252;580;224,252;228,676,677,678,679,680,681;228;228;228,676,677,678,679,680,681;228;374;228;203;228;242;68;203;228;205;228;228;848;848;228;95,96,97,98;227,228;588;228;228;203;227,228;228;38;228;201;38;228;275;203;201;203;203;228;134;228;228;237;435;203;211;228;228;228;227,228;203;228;848;227,228;114,115,116,117;228;38,55,588;228;228;203;676,677,678,679,680,681;228,248;588;228,676,677,678,679,680,681;203,282;228;269;588;228;130;203;203,211,282;517;203;203;588;203;213;717;228;228;228,676,677,678,679,680,681;225;424;228;228;228;228;225;228;228;228;203;227,228;225,228;164,165,166;228;676,677,678,679,680,681;482;848;848;203;227,228;228;203;228;122;225;228;228;203;228;228;134;228;66;228;40;432;476;228;606;199;228;228;228;228;211;424;228;225;211;227,228;227,228;203;227,228;855,-857,-858,-859;225;203;228;227,228;228;228;228;228;228;672;672;203,282;225;295;408,409;282;228;225;201;203;203;203;228;79;228;512;228;227,228;227,228;505,506;228,237;589;586;228;203;203;242;55;227,228;242;227,228;228;745;766;228;228;228;228;228;228;228;848;228;225;228;228;303;228;228;228;654,655;228;588;225;228;228;228;228;228;227,228;228;228;94;228;228;228,676,677,678,679,680,681;227,228;228;228;228;717;228;228;746,747,748;203;390;228;228;228;227,228;227,228;513;100;228;674;652;228;228;228;227,228;44;431;228;203;228;203;211;228;228;54;228;228;848;228;228;433;228;94,129;203;225;228;203;227,228;228;288;227,228;228;128;228;228;134;131,158,159,160;708,709;241;228;228;228;228;228,676,677,678,679,680,681;227,228;228;228,676,677,678,679,680,681;228;228;676,677,678,679,680,681;225;228;228,676,677,678,679,680,681;248;134;228,239,676,677,678,679,680,681;246;5;227,228;228;241,676,677,678,679,680,681;228;228;228;228;203;848;848;228;607;228;227,228;228;225;203;228;228;228;227,228;228;228;228;54;848;228,676,677,678,679,680,681;203;228;228;228;228;228;228;227,228;228;228;228;228;68;38;228;203;500,501;228;228;228;228;228;213;848;228;242;228;228;228;228;227,228;228,676,677,678,679,680,681;242;228;228;228,676,677,678,679,680,681;292;242;228;228;228;228;114,115,116,117;134;228;228;424;588;225;203;228;613;703,704;228;228;228;588;203,282;228;228;228;228;211,215,282;228;598;203;25;201;203;227,228;228;242;201;228;252;228;122;848;246;211;228;228;211;228;228;203;623;309;239;362;228;228;228;227,228;62;282,521;693;94;720;228;203;153,154;284,706,707,721,722,832;228;228;228;201;228;203,282;228;228,676,677,678,679,680,681;225;228;26;228;242;228;203;228;227,228;225;228;67;381;227,228;418;203;94;95,96,97,98;95,96,97,98;203;55;228;228;227,228;228;228;249;228;228;228;228;203;228;228,676,677,678,679,680,681;227,228;203,514;228;242;472;225;130;228;713;228;407;227,228;228;228;203;228;224,252;228;228;18,560;228;228;203;228;228;203;228;228;676,677,678,679,680,681;848;225;227,228;94;199;228;228;228;228;228,676,677,678,679,680,681;228;242;228;242;504;228;228;22;232,676,677,678,679,680,681;228;225;228,676,677,678,679,680,681;227,228;242;134;689;227,228;822;228;228;228;242;239;74;676,677,678,679,680,681;444;227,228;227,228;121;228;242;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;227,228;134;225;228;228;689;228,676,677,678,679,680,681;227,228;107,108;227,228;228,676,677,678,679,680,681;227,228;848;228;731;227,228;228;228;228;119;228;228;228,676,677,678,679,680,681;227,228;54;228;228;848;228;211;228;203;228;201;134;676,677,678,679,680,681;228;605;201;203;203;228;848;228;843;141,142;228,676,677,678,679,680,681;228,676,677,678,679,680,681;731;228;228;228;203;225;228;523;40;228;38,203;228;357;228;228;228;228,676,677,678,679,680,681;588;225;588;242;203,282;588;227,228;228;246;228;434;211;203,282,878;228;228;228;228;227,228;203;201;848;203;227,228;563;242;228;211;228;228;248;223;228;203;242;228;203;203;228,676,677,678,679,680,681;227,228;134;225;225;246;228;228;228;228;693;228;228;225;228;683,718;227,228;228;228;242;228;228;228;228;122;240,676,677,678,679,680,681;228;228;848;228;228;228;228;25;242;228;228;227,228;203;227,228;676,677,678,679,680,681;201;242;225,771;203;211;228;228;228,246;94;40;130;227,228;227,228;228;228;38;513;228;228,248;228;227,228;228;228;228,676,677,678,679,680,681;228;228;731;228;227,228;228;568;674;203;228;718,726;848;228;227,228;228;228;228;228;228;228;228;134;669;225;595;228;83,84;130;130;203;228;228;201;228;228;228;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228,237;242;228;552;228;228;228;228;227,228;228;228;228;228;228;228;227,228;228;203;228,676,677,678,679,680,681;228,676,677,678,679,680,681;228;848;228;228;209;228;228;717,718,765;203;228;455;227,228;228,676,677,678,679,680,681;228;242;228;228;67;227,228;228;241,676,677,678,679,680,681;228;228;588;225;228;731;122;211,213,326,327;203;134;203;228,676,677,678,679,680,681;211;227,228;228;228;228;25;201;227,228;225;721,722;588;134;424;203;228;203;227,228;225;228;228;227,228;228;228;203;848;228;228;225;201;228;848;228;228;228;227,228;225;227,228;133;228,248,676,677,678,679,680,681;228;228;227,228;203;228;435;228;228;211;73;228;228;227,228;325;225;228;228;228;219;228;228;228;228;746,747,748;141,142;848;228;227,228;424;201;848;228;228;228;228;228;227,228;227,228;228;203;228;228;588;228;228;228;203;228;848;228;228;228;228;228;227,228;848;95,96,97,98;228;588;228;228;445;487;228;203;228;228;211,282;95,96,97,98;228;201;201;848;228;848;228;228,676,677,678,679,680,681;248;848;228;228;100;201;228;203;848;228;228;38;203;228;588;618;227,228;203;228,237,676,677,678,679,680,681;731;203;227,228;228;228;228;227,228;418;201;743;672;227,228;227,228;228;228;83,84;228;203;676,677,678,679,680,681;228;228;211;203;228;584;227,228;130;468;242;228;228;203;228;228;227,228;227,228;228;228;227,228;228;228;227,228;848;228;228,676,677,678,679,680,681;203;3,549;201;68;203;228;848;228;228;228;227,228;721,722;164,165,166;228;201;131,158,159,160;703,704;242;228;588;228;227,228;228;228,249,676,677,678,679,680,681;203;203;225;228;228;228;203;227,228;228;228;228;228;848;676,677,678,679,680,681;228;723;201;203;227,228;227,228;228,676,677,678,679,680,681;203;203,393;227,228;581,582,868,869;133;228;228;227,228;225;227,228;228;219;193;227,228;209;228;228;242;228;227,228;672;848;203;203,282;95,96,97,98;227,228;227,228;228;227,228;228;211;228;228;228;227,228;228;848;848;228;228;228,248,676,677,678,679,680,681;259;228;228;228;201;674;228;228;227,228;299;228;228;227,228;228;228;228;203;228;203;228;68;225;848;228;228;228;227,228;225;228;672;227,228;228,676,677,678,679,680,681;201;227,228;227,228;242;672;228;228;211;203;631;134;227,228;225;228;228;227,228;705;228;227,228;228,248;228;201;228;228;228;227,228;275;228;228;68;228;227,228;848;227,228;225;130;228;228,676,677,678,679,680,681;203;223;848;201;227,228;25;203;246;228,676,677,678,679,680,681;228;130;203;588;203;228;203;225;227,228;205,215;228;225;228,676,677,678,679,680,681;228;228;228,676,677,678,679,680,681;203;612;228;203;376;228;203;130;225;228,248,676,677,678,679,680,681;225;227,228;203;198;203;225;219;203;211";

const $scriptletHostnames$ = /* 5274 */ ["s.to","ak.sv","g3g.*","hqq.*","my.is","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","tv3.lt","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","3si.org","6mt.net","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","g20.net","get2.in","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moco.gg","moin.de","movi.pk","mrt.com","msn.com","mx6.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","15min.lt","250r.net","2embed.*","4game.ru","7mmtv.sx","9gag.com","9xflix.*","a5oc.com","adria.gg","akff.net","alkas.lt","alpin.de","asd.pics","b15u.com","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cnet.com","cybar.to","devlib.*","dlhd.*>>","dooood.*","dotgg.gg","egolf.jp","ehmac.ca","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","feoa.net","file.org","findav.*","fir3.net","flixhq.*","focus.de","frvr.com","fz09.org","gala.com","game8.jp","golog.jp","gr86.org","gsxr.com","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","lejdd.fr","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","mtbr.com","nikke.gg","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","rdr2.org","redis.io","rintor.*","rs25.com","sb9t.com","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","tokon.gg","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wdwnt.jp","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xvip.lat","yabai.si","ytstv.me","zcar.com","zooqle.*","zx6r.com","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","3minx.com","4game.com","4stream.*","5movies.*","600rr.net","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","ats-v.org","ausrc.com","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","bc4x4.com","beeg.porn","bigwarp.*","blkom.com","bmwlt.com","bokep.top","camhub.cc","canoe.com","casi3.xyz","cbrxx.com","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cybar.xyz","d000d.com","d0o0d.com","daddyhd.*","dippy.org","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","expres.cz","fabtcg.gg","fap18.net","faqwiki.*","faselhd.*","fawzy.xyz","fc2db.com","file4go.*","finfang.*","fiuxy2.co","flagle.io","fmovies.*","fooak.com","forsal.pl","ftuapps.*","fx-22.com","garota.cf","gayfor.us","ghior.com","globo.com","glock.pro","gloria.hr","gplinks.*","grapee.jp","gt350.org","gtr.co.uk","gunco.net","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hkpro.com","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","ifish.net","igfap.com","imboc.com","imgur.com","imihu.net","innal.top","inxxx.com","iwsti.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kezdo5.hu","kickass.*","kissjav.*","knowt.com","kogap.xyz","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","magma.com","magmix.jp","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","mini2.com","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mr2oc.com","msic.site","mynet.com","nagca.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","ngemu.com","nhlbox.me","nlegs.com","novas.net","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","r32oc.com","raider.io","remaxhd.*","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tccoa.com","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","ttora.com","tutele.sx","ucptt.com","upzur.com","usi32.com","v6z24.com","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vn750.com","vogue.com","voodc.com","vplink.in","vtxoa.com","waezg.xyz","waezm.xyz","watson.de","wdwnt.com","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xdabo.com","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","yjiur.xyz","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1000rr.net","1130cc.com","1919a4.com","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","555fap.com","5ghindi.in","720pflix.*","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","aether.mom","alfabb.com","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","basset.net","bigbtc.win","bmamag.com","boyfuck.me","btvplus.bg","buzter.xyz","cashurl.in","cboard.net","cbr250.com","cbr250.net","cdn256.xyz","cgtips.org","club3g.com","club4g.org","clubxb.com","cnpics.org","corral.net","crictime.*","ctpost.com","cztalk.com","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","ex-500.com","exambd.net","f1stream.*","f650.co.uk","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","fitbook.de","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fz07oc.com","fzmovies.*","g5club.net","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gixxer.com","gmenhq.com","go2gbo.com","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","gunhub.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","i4talk.com","i5talk.com","ib-game.jp","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","lorcana.gg","love4u.net","ls1gto.com","ls1lt1.com","m.4khd.com","macwelt.de","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","merinfo.se","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","model2.org","morels.com","motor1.com","movies4u.*","movix.blog","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","mytreg.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nonixxx.cc","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nybass.com","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","opelgt.com","otakomu.jp","ovabee.com","paypal.com","pctfenix.*","petbook.de","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prius5.com","prmovies.*","proxybit.*","pxxbay.com","qrixpe.com","r8talk.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","supra6.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thevog.net","tiscali.cz","tlzone.net","tnmusic.in","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vtcafe.com","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xdtalk.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xrv.org.uk","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","ygozone.gg","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zenless.gg","zpaste.net","zx-10r.net","11xmovies.*","123movies.*","2monkeys.jp","360tuna.com","373news.com","3800pro.com","3dsfree.org","460ford.com","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","adxtalk.com","aipebel.com","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bfclive.com","bg-mania.jp","bi-girl.net","bigshare.io","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bowfile.com","btcbitco.in","caitlin.top","camaros.net","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","civinfo.com","clubrsx.com","clubwrx.net","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","cracked.com","crx7601.com","cuervotv.me","cults3d.com","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","dootalk.com","downvod.com","dropgame.jp","ds2play.com","ds450hq.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","elliott.org","embedpk.net","emuenzen.de","endfield.gg","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnforum.net","fnjplay.xyz","fntimes.com","focusrs.org","focusst.org","fplzone.com","fsharetv.cc","fullymaza.*","g-porno.com","g8board.com","g8forum.com","gamewith.jp","gbatemp.net","get-to.link","gezondnu.nl","ghbrisk.com","gigafile.nu","gm-volt.com","go.zovo.ink","gocast2.com","godlike.com","gold-24.net","goodcar.com","govtech.com","grasoku.com","gtrlife.com","gupload.xyz","haytalk.com","hellcat.org","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","impalas.net","in91vip.win","itopmusic.*","jaginfo.org","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","javx357.com","jawapos.com","jelonka.com","jemsite.com","jetpunk.com","jjang0u.com","jocooks.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","k-bikes.com","k3forum.com","kaliscan.io","karanpc.com","kboards.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","laposte.net","letocard.fr","lexpress.fr","lfpress.com","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m1xdrop.com","m1xdrop.net","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","minif56.com","mirrorace.*","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","mx5life.com","mx5nutz.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","ninjah2.org","nodo313.net","nontonx.com","noreast.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onefora.com","onepiece.gg","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","pdfdrive.to","peeplink.in","pelisplus.*","pigeons.biz","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","rekogap.xyz","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","sadisflix.*","safetxt.net","sailnet.com","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharclub.in","sharing.wtf","shavetape.*","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","svrider.com","syosetu.com","t-online.de","tabooflix.*","talkesg.com","tbsradio.jp","teachoo.com","techbook.de","techguy.org","teltarif.de","teryxhq.com","thehour.com","thektog.org","thenewx.org","thothub.lol","tidymom.net","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","trx250r.net","trx450r.org","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tundra3.com","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","unixmen.com","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","vague.style","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vtxcafe.com","vwforum.com","vwscout.org","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","x7forum.com","xdforum.com","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","xpshort.com","yesmovies.*","youtube.com","yumeost.net","yxztalk.com","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","1911talk.com","3dshoots.com","46matome.net","4archive.org","4btswaps.com","50states.com","68forums.com","700rifle.com","718forum.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8thcivic.com","992forum.com","aamulehti.fi","acrforum.com","adricami.com","akinator.com","alexsports.*","alexsportz.*","allcoast.com","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","audiforum.us","autoc-one.jp","avseesee.com","avsforum.com","babylinks.in","bamgosu.site","bapetalk.com","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepindoh.*","bokepnya.com","boltbeat.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","bz-berlin.de","bzforums.com","capoplay.net","carparts.com","casthill.net","catcrave.com","catfish1.com","catforum.com","cesoirtv.com","chaos2ch.com","chatango.com","cheftalk.com","chopchat.com","choralia.net","chrforums.uk","cima4u.forum","clickapi.net","cobaltss.com","coingraph.us","cookierun.gg","crazyblog.in","cricstream.*","cricwatch.io","crzforum.com","cuevana3.fan","cx30talk.com","cx3forum.com","d-series.org","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","diethood.com","divicast.com","divxtotal1.*","dizikral.com","dogforum.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","egyanime.com","embedtv.best","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","expertvn.com","f6cforum.com","factable.com","falatron.com","famivita.com","fansided.com","fapptime.com","feed2all.org","fetchpik.com","fiestast.net","fiestast.org","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","footybite.to","fordtough.ca","forexrw7.com","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gcaptain.com","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gsxs1000.org","gtoforum.com","gulflive.com","gvforums.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hentaitv.fun","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","hrvforum.com","huntress.com","hvacsite.com","iambaker.net","ibelieve.com","ibsgroup.org","ihdstreams.*","imagefap.com","impreza5.com","impreza6.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","ixforums.com","jablickar.cz","jav-coco.com","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jkowners.com","jobsheel.com","jp-films.com","k5owners.com","kasiporn.com","kazefuri.net","kfx450hq.com","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","klrforum.com","krxforum.com","ktmatvhq.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","lawnsite.com","layitlow.com","legacygt.org","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","liddread.com","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","lostsword.gg","ltr450hq.com","luluvdoo.com","lxforums.com","m14forum.com","macworld.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masscops.com","masslive.com","matacoco.com","mbeqclub.com","mealcold.com","mediaite.com","mega-mkv.com","mg-rover.org","mhdtvworld.*","migweb.co.uk","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkcforum.com","mkvcinemas.*","mkzforum.com","mmaforum.com","mmamania.com","mmsbee27.com","mmsbee42.com","mmsbee47.com","modocine.com","modrinth.com","modsbase.com","modsfire.com","momsdish.com","mooonten.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","mvagusta.net","myaudiq5.com","myflixerz.to","mykitsch.com","mytiguan.com","nanolinks.in","nbadraft.net","ncangler.com","neodrive.xyz","neowners.com","netatama.net","newatlas.com","newninja.com","newsyou.info","neymartv.net","niketalk.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nugglove.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","paw-talk.net","pennlive.com","photopea.com","pigforum.com","planet-9.com","playertv.net","plowsite.com","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","prcforum.com","pressian.com","programme.tv","pubfilmz.com","publicearn.*","pwcforum.com","qyiforum.com","r1-forum.com","r1200gs.info","r2forums.com","r6-forum.com","r7forums.com","r9riders.com","rainmail.xyz","ramrebel.org","rapelust.com","ratforum.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","riftbound.gg","rlxforum.com","ronaldo7.pro","roporno.info","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","rxforums.com","rxtuners.com","ryaktive.com","rzforums.com","s10forum.com","saablink.net","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","shrtslug.biz","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","snowbreak.gg","sodomojo.com","sonixgvn.net","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","ssforums.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","stylebook.de","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","technons.com","teleclub.xyz","teluguflix.*","terra.com.br","texas4x4.org","thehindu.com","themezon.net","theverge.com","toonhub4u.me","topdrama.net","torrage.info","torrents.vip","tradtalk.com","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","turbovid.vip","tusfiles.com","tutlehd4.com","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","twospoke.com","uk-audis.net","uk-mkivs.net","ultraten.net","umamusume.gg","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","veloster.org","vertigis.com","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","vnjpclub.com","volokit2.com","vpcxz19p.xyz","vwidtalk.com","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","whatgame.xyz","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xcrforum.com","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xlrforum.com","xmowners.com","xopenload.me","xopenload.pw","xpornium.net","xtglinks.com","xtratime.org","xxxstream.me","youboxtv.com","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zrvforum.com","zvision.link","zxforums.com","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","124spider.org","1911forum.com","1bitspace.com","200forums.com","247sports.com","350z-tech.com","355nation.net","4c-forums.com","4horlover.com","4kwebplay.xyz","4xeforums.com","560pmovie.com","680thefan.com","6hiidude.gold","6thgenram.com","7fractals.icu","7vibelife.com","abc17news.com","abhijith.page","aceforums.net","actusports.eu","adblocktape.*","addapinch.com","advertape.net","aeblender.com","aiimgvlog.fun","alexsportss.*","alfaowner.com","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atchuseek.com","atv-forum.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","b15sentra.net","bacasitus.com","badmouth1.com","bakedbree.com","bcaquaria.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","benzforum.com","benzworld.org","bestfonts.pro","bethcakes.com","bettafish.com","bighentai.org","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bluetraxx.com","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buelltalk.com","buffstreams.*","c.newsnow.com","c10trucks.com","caferacer.net","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","chanto.jp.net","cheater.ninja","chevelles.com","chevybolt.org","chumplady.com","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","club700xx.com","clubtitan.org","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","coltforum.com","columbian.com","concomber.com","coolcast2.com","corsa-c.co.uk","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","currytrail.in","cx70forum.com","cx90forum.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","dayspedia.com","depvailon.com","dfwstangs.net","dizikral1.pro","dizikral2.pro","dodgetalk.com","dogforums.com","dooodster.com","downfile.site","dphunters.mom","dragonball.gg","dragontea.ink","drivenime.com","e2link.link>>","ebonybird.com","egitim.net.tr","elantraxd.com","eldingweb.com","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","esladvice.com","ethearmed.com","etoland.co.kr","evotuners.net","ex90forum.com","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fjcforums.com","fjrowners.com","flixhouse.com","flyfaucet.com","flyfishbc.com","fmachines.com","focusrsoc.com","focusstoc.com","fordgt500.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","geoguessr.com","gifu-np.co.jp","giornalone.it","glaowners.com","glcforums.com","globalrph.com","glocktalk.com","golfforum.com","gopitbull.com","governing.com","gputrends.net","grantorrent.*","gromforum.com","gunboards.com","gundamlog.com","gunforums.net","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","hobbytalk.com","hondagrom.net","honkailab.com","hornylips.com","hoyoverse.com","huntingpa.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","ikonforum.com","ilxforums.com","indiewire.com","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itmedia.co.jp","itunesfre.com","javsunday.com","jeepforum.com","jimdofree.com","jisakuhibi.jp","jkdamours.com","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","k900forum.com","kahrforum.com","kamababa.desi","kckingdom.com","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","krepsinis.net","krussdomi.com","ktmforums.com","kurashiru.com","lek-manga.net","lifehacker.jp","likemanga.ink","listar-mc.net","liteshort.com","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lotustalk.com","lowellsun.com","m.inven.co.kr","macheclub.com","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","marvel.church","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","metin2hub.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","mothering.com","motor-talk.de","motorgeek.com","moutogami.com","moviekhhd.biz","moviepilot.de","moviesleech.*","moviesverse.*","movieswbb.com","moviezwaphd.*","mp-pistol.com","mp4upload.com","multicanais.*","musescore.com","mx30forum.com","myfastgti.com","myflixertv.to","mygolfspy.com","myhomebook.de","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newbeetle.org","newcelica.org","newcougar.org","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","otonanswer.jp","ottawasun.com","overclock.net","ozlosleep.com","pagalworld.cc","painttalk.com","pandamovie.in","patrol4x4.com","pc-builds.com","pearforum.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","picdollar.com","pillowcase.su","piloteers.org","pinkueiga.net","pirate4x4.com","pirateiro.com","pitchfork.com","pkbiosfix.com","planet4x4.net","pnwriders.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","ptcgpocket.gg","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","r125forum.com","r3-forums.com","ramforumz.com","rarethief.com","raskakcija.lt","rav4world.com","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rhinotalk.net","riggosrag.com","rnbxclusive.*","roadglide.org","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","rswarrior.com","rugertalk.com","rumbunter.com","rzrforums.net","s3embtaku.pro","saabscene.com","saboroso.blog","sarforums.com","savefiles.com","scatkings.com","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","shorttrick.in","silverblog.tv","silverpic.com","simana.online","sinemalar.com","sinsitio.site","skymovieshd.*","slotforum.com","smartworld.it","snackfora.com","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","sparktalk.com","speedporn.net","speedwake.com","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","sr20forum.com","srtforums.com","starstyle.com","steyrclub.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","sv-portal.com","swissotel.com","t-goforum.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","tennspeed.net","thekitchn.com","thelayoff.com","themgzr.co.uk","thepoke.co.uk","thothub.today","tidalfish.com","tiermaker.com","timescall.com","titantalk.com","tlnovelas.net","tlxforums.com","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","travelbook.de","traxforum.com","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","trxforums.com","ttforum.co.uk","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","ukcorsa-d.com","umamigirl.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","velostern.com","vibestreams.*","vid-guard.com","vidspeeds.com","vipstand.pm>>","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","volkszone.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","vweosclub.com","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","xc40forum.com","xcamcovid.com","xfforum.co.uk","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zdxowners.com","zorroplay.xyz","zotyezone.com","zx4rforum.com","123easy4me.com","123movieshub.*","300cforums.com","300cforumz.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","7thmustang.com","9to5google.com","a1-forum.co.uk","actu.orange.fr","actugaming.net","acuraworld.com","aerotrader.com","afeelachat.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcorsa.co.uk","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","ar15forums.com","arcticchat.com","armslocker.com","artoffocas.com","ashemaletube.*","astro-seek.com","at4xowners.com","atchfreeks.com","atvtorture.com","azbasszone.com","balkanteka.net","bamahammer.com","bersaforum.com","bhugolinfo.com","bimmerfest.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","bmw-driver.net","bmwevforum.com","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buceesfans.com","buchstaben.com","burgmanusa.com","calgarysun.com","camarozone.com","camberlion.com","can-amtalk.com","carrnissan.com","cheatsheet.com","choco0202.work","cine-calidad.*","cl500forum.com","clashdaily.com","clicknupload.*","cloudvideotv.*","clubarmada.com","clubsearay.com","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cretaforum.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","ctsvowners.com","cuevana3hd.com","cumception.com","curseforge.com","cx500forum.com","cx50forums.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","dealsforum.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dodge-dart.org","dodgersway.com","dofusports.xyz","dolldivine.com","dpselfhelp.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","epaceforum.com","erayforums.com","esportbike.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","evoxforums.com","expatforum.com","extreme-down.*","f-typeclub.com","f150forumz.com","f800riders.org","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","fiestastoc.com","filmizleplus.*","filmy4waps.org","fireblades.org","fishforums.com","fiskerbuzz.com","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","foodtechnos.in","fordescape.org","fordforums.com","fordranger.net","forex-trnd.com","formyanime.com","forteturbo.org","forumchat.club","foxyfolksy.com","fpaceforum.com","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","furyforums.com","fz-10forum.com","g310rforum.com","galleryxh.site","gamefishin.com","gamepcfull.com","gameshop4u.com","gamingfora.com","gayforfans.com","gaypornhot.com","gearpatrol.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","glockforum.com","glockforum.net","gmfullsize.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gr-yaris.co.uk","gravureblog.tv","gtaaquaria.com","guitars101.com","gujjukhabar.in","gunandgame.com","gyanitheme.com","hauntforum.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hinoforums.com","hondatwins.net","horseforum.com","hotgranny.live","hotrodders.com","hotukdeals.com","hummerchat.com","hwnaturkya.com","imgtraffic.com","indiatimes.com","infinitifx.org","infogenyus.top","inshorturl.com","insidehook.com","ioniqforum.com","ios.codevn.net","iplayerhls.com","iplocation.net","isabeleats.com","isekaitube.com","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jdfanatics.com","jeepgarage.org","jizzbunker.com","joemonster.org","joyousplay.xyz","jpaceforum.com","jpopsingles.eu","jukeforums.com","jyoseisama.com","k1600forum.com","kakarotfoot.ru","kanyetothe.com","katoikos.world","kawiforums.com","kia-forums.com","kickassanime.*","kijolariat.net","kimbertalk.com","kompasiana.com","ktmforum.co.uk","leaderpost.com","leahingram.com","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","low-riders.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","m109riders.com","macanforum.com","mactechnews.de","mahajobwala.in","mahitimanch.in","majestyusa.com","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","manutdtalk.com","marcialhub.xyz","mastkhabre.com","mazda6club.com","mazdaworld.org","megapastes.com","meusanimes.net","microskiff.com","minitorque.com","mkv-pastes.com","monacomatin.mc","mondeostoc.com","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mtc3.jobsvb.in","mumuplayer.com","mundowuxia.com","musketfire.com","my.irancell.ir","myeasymusic.ir","mymbonline.com","nana-press.com","naszemiasto.pl","newmovierulz.*","newnissanz.com","news-buzz1.com","news30over.com","newscionxb.com","newtiburon.com","nhregister.com","ninernoise.com","niocarclub.com","nissanclub.com","nookgaming.com","nowinstock.net","nv200forum.com","nyfirearms.com","o2tvseries.com","ocregister.com","ohsheglows.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","outbackers.com","pandamovies.me","pandamovies.pw","pandaspor.live","pantrymama.com","paste-drop.com","pastemytxt.com","pathofexile.gg","pelando.com.br","pencarian.link","petitrobert.fr","pinchofyum.com","pipandebby.com","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playingmtg.com","playtube.co.za","populist.press","pornhd720p.com","pornincest.net","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","priusforum.com","projeihale.com","proxyninja.org","psychobike.com","q2forums.co.uk","qiqitvx84.shop","quest4play.xyz","rabbitdogs.net","ramblinfan.com","ramevforum.com","rc350forum.com","rc51forums.com","record-bee.com","reisefrage.net","remixsearch.es","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rugerforum.net","runeriders.com","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","section215.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shadowverse.gg","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","sigarms556.com","singjupost.com","sizecharts.net","skidrowcpy.com","slatedroid.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","solanforum.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speedzilla.com","speisekarte.de","spieletipps.de","sportbikes.net","sportsurge.net","spyderchat.com","spydertalk.com","srt10forum.com","srt4mation.com","ssrfanatic.com","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","stripehype.com","studyfinds.org","superhonda.com","supexfeeds.com","swatchseries.*","swedespeed.com","swipebreed.net","swordalada.org","tamilprinthd.*","taosforums.com","tarokforum.com","taurusclub.com","tbssowners.com","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thefitchen.com","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","tonaletalk.com","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","tournguide.com","toyokeizai.net","tracktheta.com","trafficnews.jp","trannyteca.com","trentonian.com","triumph675.net","triumphrat.net","troyrecord.com","tundratalk.net","turbocloud.xyz","turbododge.com","tvs-widget.com","tvseries.video","tw200forum.com","twincities.com","uberpeople.net","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vagdrivers.net","vahantoday.com","videocelts.com","vikistream.com","viperalley.com","visifilmai.org","viveseries.com","volvoforum.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wellplated.com","whodatdish.com","wielerflits.be","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xc100forum.com","xclusivejams.*","xeforums.co.uk","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yfzcentral.com","yourcobalt.com","yourupload.com","z1000forum.com","z125owners.com","zeroupload.com","zx25rforum.com","1911addicts.com","240sxforums.com","4activetalk.com","51bonusrummy.in","7thgenhonda.com","899panigale.org","959panigale.net","9thgencivic.com","a-z-animals.com","acadiaforum.net","accordxclub.com","acedarspoon.com","acemanforum.com","adrinolinks.com","adz7short.space","agoneerfans.com","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","amarokforum.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","archerytalk.com","areaconnect.com","ariyaforums.com","arstechnica.com","artistforum.com","astrosafari.com","audi-forums.com","audif1forum.com","audiotools.blog","audioz.download","audiq3forum.com","averiecooks.com","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxerforums.com","boxingforum.com","boxingstream.me","brilian-news.id","brutusforum.com","budgetbytes.com","buffstreams.app","bussyhunter.com","c.newsnow.co.uk","cafedelites.com","can-amforum.com","cattleforum.com","cbr300forum.com","celicasupra.com","cempakajaya.com","chevyblazer.org","chollometro.com","cigarforums.net","cizgivedizi.com","classic-jdm.com","clubtouareg.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","crizyman.online","crownforums.com","cryptoearns.com","cryptofun.space","ct200hforum.com","ctx700forum.com","cubbiescrib.com","customtacos.com","cycleforums.com","cycletrader.com","dailybreeze.com","dailycamera.com","dailyknicks.com","databazeknih.cz","dawindycity.com","dendroboard.com","diariovasco.com","dieseljeeps.com","dieselplace.com","digimonzone.com","digiztechno.com","diychatroom.com","dizipal1536.com","dizipal1537.com","dizipal1538.com","dizipal1539.com","dizipal1540.com","dizipal1541.com","dizipal1542.com","dizipal1543.com","dizipal1544.com","dizipal1545.com","dizipal1546.com","dizipal1547.com","dizipal1548.com","dizipal1549.com","dizipal1550.com","dizipal1551.com","dizipal1552.com","dizipal1553.com","dizipal1554.com","dizipal1555.com","dizipal1556.com","dizipal1557.com","dizipal1558.com","dizipal1559.com","dizipal1560.com","dizipal1561.com","dizipal1562.com","dizipal1563.com","dizipal1564.com","dizipal1565.com","dizipal1566.com","dizipal1567.com","dizipal1568.com","dizipal1569.com","dizipal1570.com","dizipal1571.com","dizipal1572.com","dizipal1573.com","dizipal1574.com","dizipal1575.com","dizipal1576.com","dizipal1577.com","dizipal1578.com","dizipal1579.com","dizipal1580.com","dizipal1581.com","dizipal1582.com","dizipal1583.com","dizipal1584.com","dizipal1585.com","dizipal1586.com","dizipal1587.com","dizipal1588.com","dizipal1589.com","dizipal1590.com","dizipal1591.com","dizipal1592.com","dizipal1593.com","dizipal1594.com","dizipal1595.com","dizipal1596.com","dizipal1597.com","dizipal1598.com","dizipal1599.com","dizipal1600.com","dl-protect.link","doctormalay.com","dodge-nitro.com","dogfoodchat.com","donnerwetter.de","dopomininfo.com","driveaccord.net","drywalltalk.com","e-tronforum.com","e46fanatics.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","edmontonsun.com","egoallstars.com","elamigosweb.com","empire-stream.*","escape-city.com","esportivos.site","exactpay.online","expedition33.gg","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","ferrarilife.com","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fizzlefakten.de","fmradiofree.com","footyhunter.lol","forteforums.com","framedcooks.com","freeairpump.com","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gatorforums.net","gazetaprawna.pl","gen3insight.com","gentosha-go.com","geogridgame.com","gewinnspiele.tv","ghibliforum.com","girlscanner.org","girlsreport.net","gmtruckclub.com","godairyfree.org","gofile.download","goproforums.com","gowatchseries.*","gratispaste.com","greatandhra.com","gunnerforum.com","gut-erklaert.de","hamrojaagir.com","havocxforum.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hondashadow.net","hotcopper.co.nz","hummusapien.com","i-paceforum.com","idoitmyself.xyz","ilovetoplay.xyz","infinitiq30.org","infinitiq50.org","infinitiq60.org","infosgj.free.fr","instabiosai.com","integratalk.com","istreameast.app","jaguarforum.com","japangaysex.com","jaysjournal.com","jeepevforum.com","jeeppatriot.com","jettajunkie.com","juliasalbum.com","jumpsokuhou.com","kandiforums.com","kawieriders.com","keltecforum.com","khatrimazaful.*","kiaevforums.com","kickrunners.com","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","krakenfiles.com","kurashinista.jp","lakestclair.net","lamarledger.com","ldoceonline.com","lexusfforum.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lombardiave.com","lordchannel.com","lucid-forum.com","lugerforums.com","lulustream.live","lumberjocks.com","luxury4play.com","lynkcoforum.com","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","marlinforum.com","marvelrivals.gg","matomeblade.com","matomelotte.com","mclarenlife.com","mediacast.click","medstudentz.com","meganesport.net","mentalfloss.com","mercedescla.org","mercurynews.com","metrisforum.com","miamiherald.com","minievforum.com","miniwebtool.com","mmsmasala27.com","mobilestalk.net","modernhoney.com","modistreams.org","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","mtc1.jobtkz.com","myanimelist.net","nativesurge.net","naughtypiss.com","ncgunowners.com","news-herald.com","news.zerkalo.io","nflspinzone.com","niice-woker.com","ninetowners.com","nitroforumz.com","noindexscan.com","nomnompaleo.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nutmegnanny.com","nuxhallas.click","nydailynews.com","oceanforums.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","passatworld.com","paviseforum.com","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","petforums.co.uk","phillyvoice.com","phongroblox.com","picsxxxporn.com","pierandsurf.com","pilotonline.com","piratehaven.xyz","pisshamster.com","pistolsmith.com","pistolworld.com","planetminis.com","plantedtank.net","poodleforum.com","popdaily.com.tw","powergam.online","powerstroke.org","premiumporn.org","priusonline.com","projectfreetv.*","prowlertalk.net","punishworld.com","qatarstreams.me","r1200rforum.com","rallyforums.com","rangerovers.net","rank1-media.com","raptorforum.com","readbitcoin.org","readhunters.xyz","recon-forum.com","regalforums.com","remixsearch.net","reportera.co.kr","resizer.myct.jp","rhinoforums.net","riderforums.com","risingapple.com","rnbastreams.com","robloxforum.com","rodsnsods.co.uk","roofingtalk.com","rugbystreams.me","rustorkacom.lib","saabcentral.com","saikyo-jump.com","sampledrive.org","sat-sharing.com","saxontheweb.net","scr950forum.com","seadoospark.org","seir-sanduk.com","seltosforum.com","sfchronicle.com","shadowrangers.*","shemalegape.net","shortxlinks.com","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","skyroadster.com","slapthesign.com","smokinvette.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","stdrivers.co.uk","streamnoads.com","stripers247.com","stylecaster.com","sudokutable.com","suicidepics.com","supraforums.com","sweetie-fox.com","taikoboards.com","talkbudgies.com","talkparrots.com","tapeantiads.com","tapeblocker.com","taurusarmed.net","tennisforum.com","tennisstreams.*","teryxforums.net","the5krunner.com","thebassbarn.com","theblueclit.com","thebullspen.com","thegoatspot.net","thejetpress.com","themoviesflix.*","theporndude.com","theprovince.com","thereeftank.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","trgoals1526.xyz","trgoals1527.xyz","trgoals1528.xyz","trgoals1529.xyz","trgoals1530.xyz","trgoals1531.xyz","trgoals1532.xyz","trgoals1533.xyz","trgoals1534.xyz","trgoals1535.xyz","trgoals1536.xyz","trgoals1537.xyz","trgoals1538.xyz","trgoals1539.xyz","trgoals1540.xyz","trgoals1541.xyz","trgoals1542.xyz","trgoals1543.xyz","truthsocial.com","tuktukcinma.com","turbobuicks.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","uk-muscle.co.uk","ukaudiomart.com","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","v-twinforum.com","v8sleuth.com.au","valhallas.click","vantasforum.com","vik1ngfile.site","vikingforum.net","vikingforum.org","vinfasttalk.com","vipsister23.com","viralharami.com","volconforum.com","vwt4forum.co.uk","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wericmartin.com","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","windsorstar.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","yamahaforum.com","yanksgoyard.com","yoursciontc.com","yrtourguide.com","zakuzaku911.com","2coolfishing.com","3dprinterful.com","4thgentacoma.com","790dukeforum.com","aclassclub.co.uk","acouplecooks.com","acura-legend.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","aheadofthyme.com","airflowforum.com","altherforums.com","altimaforums.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","archeryaddix.com","arteonforums.com","ascentforums.com","asyaanimeleri.pw","backfirstwo.site","badgerowners.com","bananamovies.org","barbarabakes.com","bcsportbikes.com","benelliforum.com","bestgirlsexy.com","bestpornflix.com","bigblockdart.com","blackandteal.com","blog.esuteru.com","blog.livedoor.jp","blowgunforum.com","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","brutecentral.com","buffalowdown.com","buickevforum.com","buzzfeednews.com","c-classforum.com","cadenzaforum.com","canalesportivo.*","caneswarning.com","cbr500riders.com","charexempire.com","cherokeesrt8.com","cherokeetalk.com","cheyennechat.com","chickenforum.com","chinese-pics.com","choosingchia.com","civic11forum.com","clarityforum.com","cleaningtalk.com","clever-tanken.de","clickndownload.*","clickorlando.com","clubfrontier.org","clubroadster.net","coloradofans.com","coloredmanga.com","comidacaseira.me","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","cricketforum.com","crxcommunity.com","cryptofactss.com","ctx1300forum.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cybercityhelp.in","cyclingabout.com","daciaforum.co.uk","dailyfreeman.com","dailytribune.com","dailyuploads.net","dakotaforumz.com","darknessporn.com","dartsstreams.com","dataunlocker.com","desertxforum.com","destiny2zone.com","detikkebumen.com","diavel-forum.com","diecastcrazy.com","dieselforums.com","directupload.net","dobermantalk.com","dodgedurango.net","dodgeevforum.com","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","duramaxforum.com","eastbaytimes.com","ebikerforums.com","echelonforum.com","elantraforum.com","elantrasport.com","empire-streamz.*","enclaveforum.net","envistaforum.com","evoqueforums.net","explorertalk.com","f150ecoboost.net","familyporner.com","favoyeurtube.net","feedmephoebe.com","ferrari-talk.com","filecatchers.com","filespayouts.com","financacerta.com","firearmstalk.com","flagandcross.com","flatpanelshd.com","flyfishing.co.uk","football-2ch.com","fordexplorer.org","fordstnation.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","g6ownersclub.com","gamesrepacks.com","garminrumors.com","gaydelicious.com","gbmwolverine.com","genialetricks.de","giuliaforums.com","giurgiuveanul.ro","gl1800riders.com","gledajcrtace.xyz","gmdietforums.com","gminsidenews.com","godstoryinfo.com","gourmetscans.net","grecaleforum.com","gsm-solution.com","hallofseries.com","handgunforum.net","happyinshape.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hondacb1000r.com","hondaevforum.com","hondaforeman.com","hornetowners.com","hotcopper.com.au","howsweeteats.com","huskercorner.com","husseinezzat.com","idmextension.xyz","ikarishintou.com","ildcatforums.net","imagereviser.com","impalaforums.com","infinitiqx30.org","infinitiqx50.org","infinitiqx60.org","infinitiqx80.org","infinityfree.com","inspiralized.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","jukeforums.co.uk","julieblanner.com","justblogbaby.com","justfullporn.net","kakarotfoot.ru>>","kawasakiz650.com","ketolifetalk.com","khatrimazafull.*","kianiroforum.com","kijolifehack.com","kimscravings.com","kingstreamz.site","kitchendivas.com","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kodiakowners.com","ktm1090forum.net","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","laurafuentes.com","lexusevforum.com","lexusnxforum.com","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","magnetoforum.com","magnumforumz.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","marlinowners.com","maseratilife.com","mathplayzone.com","maverickchat.com","mazda3forums.com","meconomynews.com","medievalists.net","megapornpics.com","millionscast.com","moddedraptor.com","moderncamaro.com","modularfords.com","moneycontrol.com","mostlymorgan.com","mountainbuzz.com","moviesmod.com.pl","mrproblogger.com","mudinmyblood.net","mullenowners.com","mybikeforums.com","mydownloadtube.*","mylargescale.com","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newf150forum.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nissanforums.com","nissanmurano.org","nocrumbsleft.net","nordenforums.com","o2tvseries4u.com","ojearnovelas.com","onionstream.live","optimaforums.com","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","perfectunion.com","phinphanatic.com","piranha-fury.com","plainchicken.com","planetisuzoo.com","player.buffed.de","plumbingzone.com","powerover.online","powerover.site>>","predatortalk.com","preludepower.com","pricearchive.org","programme-tv.net","protrumpnews.com","pursuitforum.com","puzzlegarage.com","r6messagenet.com","raetsel-hilfe.de","rangerforums.net","ranglerboard.com","ranglerforum.com","raptorforumz.com","readingeagle.com","rebajagratis.com","redbirdrants.com","repack-games.com","rinconriders.com","ripexbooster.xyz","risttwisters.com","rocketnews24.com","rollingstone.com","routerforums.com","rsoccerlink.site","rule34hentai.net","s1000rrforum.com","saradahentai.com","scioniaforum.com","scionimforum.com","seat-forum.co.uk","segwayforums.com","serial1forum.com","shercoforums.com","shotgunworld.com","shutterstock.com","skidrowcodex.net","skincaretalk.com","smartermuver.com","smartevforum.com","sniperforums.com","solitairehut.com","sonataforums.com","south-park-tv.fr","soxprospects.com","specialstage.com","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","starlinktalk.com","statecollege.com","stellanspice.com","stelvioforum.com","stillcurtain.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","stromerforum.com","stromtrooper.com","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","team-integra.net","techkhulasha.com","telcoinfo.online","terrainforum.com","terrainforum.net","teslabottalk.com","text-compare.com","thebakermama.com","thebassholes.com","theboxotruth.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","theflowspace.com","thegadgetking.in","thelandryhat.com","thelawnforum.com","thelinuxcode.com","thelupussite.com","thelureforum.com","thenerdstash.com","thenewcamera.com","thescranline.com","thevikingage.com","thewatchsite.com","titanxdforum.com","tomshardware.com","topvideosgay.com","total-sportek.to","toyotanation.com","tractorforum.com","trainerscity.com","trapshooters.com","trendytalker.com","trocforums.co.uk","tucson-forum.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","usmle-forums.com","utahwildlife.net","v8bikeriders.com","valeriabelen.com","vancouversun.com","veggieboards.com","venuedrivers.com","veryfreeporn.com","vichitrainfo.com","vizslaforums.com","voiranime.stream","volvo-forums.com","volvoevforum.com","volvov40club.com","voyeurfrance.net","vulcanforums.com","vwatlasforum.com","watchfreexxx.net","watchmmafull.com","wbschemenews.com","weblivehdplay.ru","whipperberry.com","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","x-trail-uk.co.uk","xclassforums.com","xhamsterporno.mx","xpengevforum.com","xpowerforums.com","xsr700forums.com","yamaha-forum.net","yifysubtitles.ch","yourcountdown.to","youwatchporn.com","ziggogratis.site","12thmanrising.com","2-seriesforum.com","365cincinnati.com","4chanarchives.com","abarthforum.co.uk","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","amandascookin.com","amrapideforum.com","amybakesbread.com","andhrafriends.com","andrewzimmern.com","androidpolice.com","applecarforum.com","aquariumforum.com","armypowerinfo.com","aronaforums.co.uk","atecaforums.co.uk","atlasandboots.com","atvdragracers.com","aussieexotics.com","auto-crypto.click","avengerforumz.com","badgerofhonor.com","bakedbyrachel.com","basketballbuzz.ca","beargoggleson.com","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","beyondtheflag.com","blazerevforum.com","blizzboygames.net","blog.tangwudi.com","broncoevforum.com","buildtheearth.net","bulldogbreeds.com","butterbeready.com","cadryskitchen.com","cagesideseats.com","calgaryherald.com","caliberforums.com","caliberforumz.com","camchickscaps.com","carensureplan.com","cayenneforums.com","cdn.tiesraides.lv","chaptercheats.com","chargerforums.com","chargerforumz.com","cichlid-forum.com","cinemastervip.com","claplivehdplay.ru","closetcooking.com","clubcrosstrek.com","cocokara-next.com","coloradodaily.com","commandertalk.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","crackstreamer.net","crvownersclub.com","cryptednews.space","customdakotas.com","custommagnums.com","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","dawnofthedawg.com","daytonaowners.com","deepgoretube.site","deutschepornos.me","diabetesforum.com","ditjesendatjes.nl","dl.apkmoddone.com","dodgeintrepid.net","drinkspartner.com","ducatimonster.org","durangoforumz.com","eatingonadime.com","eatlittlebird.com","economictimes.com","ecosportforum.com","envisionforum.com","epaceforums.co.uk","etransitforum.com","euro2024direct.ru","everestowners.com","evolvingtable.com","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","fiat500owners.com","fiestafaction.com","filmesonlinex.org","fitnesssguide.com","focusfanatics.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","fpaceforums.co.uk","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","frugalvillage.com","funtasticlife.com","fwmadebycarli.com","galonamission.com","gamejksokuhou.com","gamesmountain.com","gasserhotrods.com","gaypornhdfree.com","genesisforums.com","genesisforums.org","geocaching101.com","gimmesomeoven.com","globalstreams.xyz","goldwingfacts.com","gourbanhiking.com","greatlakes4x4.com","grizzlyowners.com","grizzlyriders.com","guitarscanada.com","havaneseforum.com","hdfilmcehennemi.*","headlinerpost.com","hemitruckclub.com","hentaitube.online","heresy-online.net","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","idownloadblog.com","iheartnaptime.net","impalassforum.com","infinityscans.net","infinityscans.org","infinityscans.xyz","innateblogger.com","intouchweekly.com","ipaceforums.co.uk","iphoneincanada.ca","islamicfinder.org","jaguarxeforum.com","jaysbrickblog.com","jeepcommander.com","jeeptrackhawk.org","jockeyjournal.com","justlabradors.com","kawasakiworld.com","kbconlinegame.com","kfx450central.com","kiasoulforums.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","laughingsquid.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lexusrcowners.com","lexusrxowners.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","mamainastitch.com","marineinsight.com","mdzsmutpcvykb.net","mercurycougar.net","miaminewtimes.com","midhudsonnews.com","midwest-horse.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","mtc4.igimsopd.com","multicanaistv.com","musicfeeds.com.au","myjeepcompass.com","myturbodiesel.com","nationaltoday.com","newtahoeyukon.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","nissan-navara.net","nodakoutdoors.com","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","ohiosportsman.com","okusama-kijyo.com","olympicstreams.co","onceuponachef.com","ondemandkorea.com","ontariofarmer.com","opensubtitles.org","ottawacitizen.com","outdoormatome.com","palisadeforum.com","paracordforum.com","paranormal-ch.com","pavementsucks.com","pcgeeks-games.com","peugeotforums.com","pinayscandalz.com","pioneerforums.com","pistonpowered.com","player.pcgames.de","plugintorrent.com","polarisriders.com","pornoenspanish.es","preludeonline.com","prepperforums.net","pressandguide.com","presstelegram.com","prowlerforums.net","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","ram1500diesel.com","ramrebelforum.com","read-onepiece.net","recipetineats.com","redlineforums.com","reidoscanais.life","renegadeforum.com","republicbrief.com","restlessouter.net","restlingforum.com","restmacizle23.cfd","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","santafeforums.com","savemoneyinfo.com","scirocconet.co.uk","seatroutforum.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","shootersforum.com","shootingworld.com","shotgunforums.com","shugarysweets.com","sideplusleaks.net","sierraevforum.com","siliconvalley.com","simplywhisked.com","sitm.al3rbygo.com","skylineowners.com","soccerworldcup.me","solsticeforum.com","solterraforum.com","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","steamidfinder.com","steamseries88.com","stellarthread.com","stingerforums.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","subaruxvforum.com","sumaburayasan.com","superherohype.com","supertipzz.online","suzuki-forums.com","suzuki-forums.net","suzukicentral.com","t-shirtforums.com","tablelifeblog.com","talkclassical.com","talonsxsforum.com","taycanevforum.com","thaihotmodels.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedieselstop.com","thefreebieguy.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","thyroidboards.com","tightsexteens.com","tiguanevforum.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tnhuntingclub.com","tokusatsuindo.com","toyotacelicas.com","toyotaevforum.com","tradingfact4u.com","traverseforum.com","truyen-hentai.com","tundraevforum.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","twowheelforum.com","umatechnology.org","unsere-helden.com","v6performance.net","velarforums.co.uk","velosterturbo.org","victoryforums.com","viralitytoday.com","visualnewshub.com","volusiariders.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","wutheringwaves.gg","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","yourcupofcake.com","10thcivicforum.com","4-seriesforums.com","4runner-forums.com","502streetscene.net","5thrangerforum.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","astrakforums.co.uk","atlasstudiousa.com","australiaforum.com","authenticateme.xyz","authenticforum.com","backforseconds.com","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","bimmerforums.co.uk","blackporncrazy.com","blog-peliculas.com","blogredmachine.com","bluemediastorage.*","bombshellbling.com","bosoxinjection.com","browneyedbaker.com","bullnettlenews.com","businessinsider.de","businessinsider.jp","cactusforums.co.uk","cadillacforums.com","calculatorsoup.com","can-amelectric.com","carnivalforums.com","challengerlife.com","challengertalk.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","climbingforums.com","cmaxownersclub.com","codingnepalweb.com","coffeeforums.co.uk","coloradodiesel.org","contractortalk.com","correotemporal.org","corsaeforums.co.uk","cr7-soccer.store>>","crooksandliars.com","crossbownation.com","customfighters.com","cyberquadforum.com","cybertrucktalk.com","dakota-durango.com","dcworldscollide.gg","defendersource.com","defensivecarry.com","descargaspcpro.net","diecastxchange.com","dieselramforum.com","digital-thread.com","dinneratthezoo.com","discoverysport.net","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","downshiftology.com","elantragtforum.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","equinoxevforum.com","esprinterforum.com","familycheftalk.com","feastingathome.com","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","firebirdnation.com","fjlaboratories.com","flacdownloader.com","footballchannel.jp","fordfusionclub.com","fordinsidenews.com","forkknifeswoon.com","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","genesisevforum.com","georgiapacking.org","germancarforum.com","goldwingowners.com","grcorollaforum.com","greeleytribune.com","grizzlycentral.com","halloweenforum.com","haveibeenpwned.com","hdstreetforums.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hondaatvforums.net","hopepaste.download","hungrypaprikas.com","hyundai-forums.com","hyundaitucson.info","iamhomesteader.com","iawaterfowlers.com","indianshortner.com","insider-gaming.com","insightcentral.net","insurancesfact.com","islamicpdfbook.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","jocjapantravel.com","kawasakiversys.com","kiatuskerforum.com","kijyomatome-ch.com","kirbiecravings.com","kodiaqforums.co.uk","laleggepertutti.it","lancerregister.com","landroversonly.com","leckerschmecker.me","lifeinleggings.com","lincolnevforum.com","listentotaxman.com","liveandletsfly.com","makeincomeinfo.com","maketecheasier.com","manchesterworld.uk","marinetraffic.live","marvelsnapzone.com","maverickforums.net","mediaindonesia.com","metalguitarist.org","millwrighttalk.com","moddedmustangs.com","modelrailforum.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","motorhomefacts.com","moviesonlinefree.*","mrmakeithappen.com","myquietkitchen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","ninja400riders.com","nissancubelife.com","nlab.itmedia.co.jp","nourishedbynic.com","observedtrials.net","oklahomahunter.net","olverineforums.com","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","oodworkingtalk.com","orkingdogforum.com","orldseafishing.com","ourbeagleworld.com","pacificaforums.com","paintballforum.com","pancakerecipes.com","panigalev4club.com","passportforums.com","pathfindertalk.com","perfectmancave.com","player.gamezone.de","playoffsstream.com","polestar-forum.com","pornfetishbdsm.com","porno-baguette.com","porscheevforum.com","promasterforum.com","prophecyowners.com","q3ownersclub.co.uk","ranglerjlforum.com","readcomiconline.li","reporterherald.com","rimfirecentral.com","ripcityproject.com","roadbikereview.com","roadstarraider.com","roadtripliving.com","runnersforum.co.uk","runtothefinish.com","samsungmagazine.eu","scarletandgame.com","scramblerforum.com","shipsnostalgia.com","shuraba-matome.com","siamblockchain.com","sidelionreport.com","sidexsideworld.com","skyscrapercity.com","slingshotforum.com","snowplowforums.com","soft.cr3zyblog.com","softwaredetail.com","spoiledmaltese.com","sportbikeworld.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","starbikeforums.com","steamclouds.online","steamcommunity.com","stevesnovasite.com","stingrayforums.com","stormtrakforum.com","stream.nflbox.me>>","strtapeadblocker.*","subarubrzforum.com","subaruforester.org","talkcockatiels.com","talkparrotlets.com","tapeadsenjoyer.com","tcrossforums.co.uk","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","theendlessmeal.com","thefirearmblog.com","thepewterplank.com","thepolitistick.com","thespeedtriple.com","thestarphoenix.com","tiguanforums.co.uk","tiktokrealtime.com","times-standard.com","tips-and-tricks.co","torrentdosfilmes.*","toyotachrforum.com","transalpowners.com","travelplanspro.com","treadmillforum.com","truestreetcars.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","upownersclub.co.uk","varminthunters.com","veggiegardener.com","vincenzosplate.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","yamahastarbolt.com","yariscrossclub.com","zafiraowners.co.uk","100percentfedup.com","208ownersclub.co.uk","adblockstreamtape.*","africatwinforum.com","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","arkansashunting.net","arrowheadaddict.com","astonmartinlife.com","asumsikedaishop.com","atchtalkforums.info","awellstyledlife.com","barcablaugranes.com","basketballforum.com","bchtechnologies.com","betweenjpandkr.blog","bible-knowledge.com","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","bowfishingforum.com","brightdropforum.com","brighteyedbaker.com","broncosporttalk.com","campercommunity.com","canuckaudiomart.com","checkhookboxing.com","chromebookforum.com","chryslerminivan.net","commanderforums.org","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","deerhuntersclub.com","detroitjockcity.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dieself150forum.com","dk.pcpartpicker.com","dodgedartforumz.com","download.megaup.net","driveteslacanada.ca","ds4ownersclub.co.uk","duckhuntingchat.com","dvdfullestrenos.com","ecoboostmustang.org","edmontonjournal.com","elcaminocentral.com","electriciantalk.com","embed.wcostream.com","equipmenttrader.com","escaladeevforum.com","estrenosdoramas.net","explorerevforum.com","ferrari296forum.com","filmesonlinexhd.biz","fjcruiserforums.com","flyfishingforum.com","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","foxeslovelemons.com","franceprefecture.fr","frustfrei-lernen.de","genealogyspeaks.com","genesisg70forum.com","genesisg80forum.com","germanshepherds.com","girlsvip-matome.com","glaownersclub.co.uk","hailfloridahail.com","hardcoresledder.com","hardwoodhoudini.com","hdfilmcehennemi2.cx","hdlivewireforum.com","hedgehogcentral.com","historicaerials.com","hometownstation.com","hondarebelforum.com","honeygirlsworld.com","honyaku-channel.net","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","ilovemycockapoo.com","indycityfishing.com","infinitijxforum.com","insidetheiggles.com","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","joyfoodsunshine.com","justonecookbook.com","kenzo-flowertag.com","kiaownersclub.co.uk","kingjamesgospel.com","kitimama-matome.net","kreuzwortraetsel.de","ktmduke390forum.com","laughingspatula.com","learnmarketinfo.com","lifeandstylemag.com","lightningowners.com","lightningrodder.com","lite.duckduckgo.com","logicieleducatif.fr","louisianacookin.com","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","melskitchencafe.com","mendocinobeacon.com","michiganreefers.com","middletownpress.com","minimalistbaker.com","modeltrainforum.com","motorcycleforum.com","movie-locations.com","mtc5.flexthecar.com","mustangecoboost.net","mykoreankitchen.com","nandemo-uketori.com","natashaskitchen.com","negyzetmeterarak.hu","newjerseyhunter.com","ohiogamefishing.com","orlandosentinel.com","outlanderforums.com","paidshitforfree.com","pcgamebenchmark.com","pendidikandasar.net","personalitycafe.com","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","preparedsociety.com","pressenterprise.com","prologuedrivers.com","promodescuentos.com","quest.to-travel.net","radio-australia.org","radio-osterreich.at","registercitizen.com","renaultforums.co.uk","reptileforums.co.uk","roguesportforum.com","rojadirectaenvivo.*","royalmailchat.co.uk","santacruzforums.com","secondhandsongs.com","shoot-yalla-tv.live","silveradosierra.com","skidrowreloaded.com","slingshotforums.com","smartkhabrinews.com","snowblowerforum.com","snowmobileforum.com","snowmobileworld.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","stormininnorman.com","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","supermotojunkie.com","sussexexpress.co.uk","suzukiatvforums.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","tarracoforums.co.uk","thecombineforum.com","thecookierookie.com","thedieselgarage.com","thefoodieaffair.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thesmokingcuban.com","thewatchforum.co.uk","thewatchseries.live","tjcruiserforums.com","trailblazertalk.com","trucs-et-astuces.co","truyentranhfull.net","tundrasolutions.com","turkishseriestv.org","valleyofthesuns.com","vintage-mustang.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","whatjewwannaeat.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","yorkshirepost.co.uk","125ccsportsbikes.com","2008ownersclub.co.uk","500xownersclub.co.uk","adamownersclub.co.uk","adultdvdparadise.com","alkingstickforum.com","alliancervforums.com","allthingsthrifty.com","amazonastroforum.com","androidauthority.com","androidheadlines.com","antaraownersclub.com","arizonagunowners.com","aroundthefoghorn.com","bcfishingreports.com","beaglesunlimited.com","beekeepingforums.com","bersapistolforum.com","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","bmaxownersclub.co.uk","brushnewstribune.com","carolinafishtalk.com","challengerforumz.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","climbingtalshill.com","cmaxownersclub.co.uk","coloradoevowners.com","connoisseurusveg.com","crackstreamshd.click","dailydishrecipes.com","dailynewshungary.com","dailytruthreport.com","dairylandexpress.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","detailingworld.co.uk","digitalcorvettes.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","favfamilyrecipes.com","foodfaithfitness.com","fordforumsonline.com","fordmuscleforums.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gesundheitsfrage.net","goosehuntingchat.com","greensnchocolate.com","greentractortalk.com","gt86ownersclub.co.uk","heartlife-matome.com","hometheatershack.com","hondarebel3forum.com","houstonchronicle.com","hyundaikonaforum.com","ibreatheimhungry.com","indianasportsman.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jeepcherokeeclub.com","jljbacktoclassic.com","journal-advocate.com","jukeownersclub.co.uk","juliescafebakery.com","kawasakininja300.com","knittingparadise.com","kugaownersclub.co.uk","labradoodle-dogs.net","labradorforums.co.uk","lamborghini-talk.com","landroverevforum.com","laweducationinfo.com","legendsofmodding.org","lehighvalleylive.com","letemsvetemapplem.eu","librarium-online.com","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda2revolution.com","mazda3revolution.com","meilleurpronostic.fr","menstennisforums.com","mercedesclaforum.com","mercedesgleforum.com","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","motorcitybengals.com","motorcycleforums.net","mt-soft.sakura.ne.jp","muscularmustangs.com","mustangevolution.com","mylawnmowerforum.com","nationalgunforum.com","neighborfoodblog.com","nissankicksforum.com","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","noteownersclub.co.uk","onelittleproject.com","onesixthwarriors.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","panamericaforums.com","pasadenastarnews.com","performanceboats.com","pickleballertalk.com","player.smashy.stream","pocketbikeplanet.com","polarisatvforums.com","popularmechanics.com","pornstarsyfamosas.es","preservationtalk.com","receitasdaora.online","redcurrantbakery.com","relevantmagazine.com","reptilesmagazine.com","reviewingthebrew.com","rollsroyceforums.com","scoutmotorsforum.com","securenetsystems.net","seededatthetable.com","silveradoevforum.com","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","springfieldforum.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","tasteandtellblog.com","techsupportforum.com","thefirearmsforum.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","thekitchenmagpie.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videoeditingtalk.com","videostreaming.rocks","visualcapitalist.com","windsorexpress.co.uk","yetiownersclub.co.uk","yorkshire-divers.com","yourhomebasedmom.com","yourpatientvoice.com","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","applefitnessforum.com","austinbassfishing.com","barnsleychronicle.com","bigleaguepolitics.com","bowfishingcountry.com","burlington-record.com","californiaevforum.com","canamspyderforums.com","casecoltingersoll.com","celebritynetworth.com","celiacandthebeast.com","cleananddelicious.com","client.pylexnodes.net","collinsdictionary.com","coloradofisherman.com","corollacrossforum.com","creative-culinary.com","dragontranslation.com","elementownersclub.com","eroticmoviesonline.me","everything2stroke.com","fancymicebreeders.com","foreverwallpapers.com","forum.release-apk.com","fusionsportforums.com","gardentractortalk.com","greaterlongisland.com","hackerranksolution.in","hollywoodreporter.com","homesteadingtoday.com","hondacivicforum.co.uk","hondapioneerforum.com","hoodtrendspredict.com","indianmotorcycles.net","invoice-generator.com","iphoneographytalk.com","jeeprenegadeforum.com","journaldemontreal.com","journey.to-travel.net","julesburgadvocate.com","kawasakininja1000.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","marutisuzukiforum.com","mavericklightning.org","mitsubishi-forums.com","mokkaownersclub.co.uk","motorcycletherapy.net","mountainmamacooks.com","mybakingaddiction.com","nissanversaforums.com","notformembersonly.com","novascotiafishing.com","novascotiahunting.com","pelotalibrevivo.net>>","peugeot108forum.co.uk","politicaltownhall.com","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","retrievertraining.net","rivianownersforum.com","rottweilersonline.com","royalenfieldforum.com","rugerpistolforums.com","runningonrealfood.com","santacruzsentinel.com","scriptgrowagarden.com","smartcarofamerica.com","snapinstadownload.xyz","snowboardingforum.com","sonymobilityforum.com","sousou-no-frieren.com","statisticsanddata.org","stratolinerdeluxe.com","streamservicehd.click","survivalistboards.com","talkaboutmarriage.com","tapeadvertisement.com","tech.trendingword.com","teslaownersonline.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","theslingshotforum.com","timesheraldonline.com","trailhunterforums.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","ultimateaircooled.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","volkswagenforum.co.uk","watchkobestreams.info","whittierdailynews.com","xr1200ownersgroup.com","yamahastarstryker.com","zone-telechargement.*","ahdafnews.blogspot.com","airsoftsniperforum.com","allevertakstream.space","andrenalynrushplay.cfd","assessmentcentrehq.com","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","breastfeedingplace.com","canadianmoneyforum.com","capturownersclub.co.uk","chicagolandfishing.com","chocolatewithgrace.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","crayonsandcravings.com","crunchycreamysweet.com","dallashoopsjournal.com","discosportforums.co.uk","drop.carbikenation.com","eclipsecrossforums.com","elrefugiodelpirata.com","eurointegration.com.ua","evoqueownersclub.co.uk","fertilityfriends.co.uk","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","housethathankbuilt.com","hyundaicoupeclub.co.uk","hyundaiperformance.com","jpop80ss3.blogspot.com","kawasakimotorcycle.org","kiatellurideforums.com","kingshotcalculator.com","littlesunnykitchen.com","longislandfirearms.com","mainehuntingforums.com","mexicanfoodjournal.com","michigan-sportsman.com","missouriwhitetails.com","mycolombianrecipes.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","player.gamesaktuell.de","portaldasnovinhas.shop","rangerraptorowners.com","redlandsdailyfacts.com","rubiconownersforum.com","salmonfishingforum.com","saturnoutlookforum.net","shakentogetherlife.com","shutupandtakemyyen.com","smartfeecalculator.com","snowmobilefanatics.com","sonsoflibertymedia.com","stellar.quoteminia.com","store.steampowered.com","thatballsouttahere.com","theflyfishingforum.com","totalsportek1000.com>>","triumphbobberforum.com","twopeasandtheirpod.com","utahconcealedcarry.com","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","ashingtonflyfishing.com","askandyaboutclothes.com","bajarjuegospcgratis.com","businesswritingblog.com","caraudioclassifieds.org","crosstourownersclub.com","danieldefenseforums.com","ducatisupersport939.net","excelsiorcalifornia.com","footballtransfer.com.ua","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","fromvalerieskitchen.com","healthyfitnessmeals.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","julieseatsandtreats.com","laurelberninteriors.com","makefreecallsonline.com","newbrunswickfishing.com","newbrunswickhunting.com","newlifeonahomestead.com","nothingbutnewcastle.com","onionringsandthings.com","orkingfromhomeforum.com","osteusfilmestuga.online","pcoptimizedsettings.com","platingsandpairings.com","player.smashystream.com","polarisgeneralforum.com","powerequipmentforum.com","predominantlyorange.com","ridgelineownersclub.com","runningtothekitchen.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thebestideasforkids.com","theplantbasedschool.com","tropicalfishkeeping.com","whatgreatgrandmaate.com","zeromotorcycleforum.com","afilmyhouse.blogspot.com","antiquetractorsforum.com","arizonahuntingforums.com","astraownersnetwork.co.uk","awealthofcommonsense.com","booksworthdiscussing.com","broomfieldenterprise.com","canoncitydailyrecord.com","carolinashootersclub.com","chiefmotorcycleforum.com","dictionary.cambridge.org","dimensionalseduction.com","ducatiscramblerforum.com","easttennesseefishing.com","ecosportownersclub.co.uk","first-names-meanings.com","freelancer.taxmachine.be","goldenretrieverforum.com","grandhighlanderforum.com","healthylittlefoodies.com","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","makingthymeforhealth.com","manitobafishingforum.com","manitobahuntingforum.com","maseratilevanteforum.com","mediapemersatubangsa.com","ohiowaterfowlerforum.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","smithandwessonforums.com","socialanxietysupport.com","spaghetti-interactive.it","spicysouthernkitchen.com","stacysrandomthoughts.com","streetfighterv2forum.com","stresshelden-coaching.de","sundaysuppermovement.com","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","thewanderlustkitchen.com","thunderousintentions.com","tip.etip-staging.etip.io","tropicalfishforums.co.uk","volkswagenownersclub.com","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","a-love-of-rottweilers.com","betweenenglandandiowa.com","chevroletownersclub.co.uk","chicagolandsportbikes.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dancearoundthekitchen.com","dictionnaire.lerobert.com","floridaconcealedcarry.com","greatamericanrepublic.com","handgunsandammunition.com","harley-davidsonforums.com","hipointfirearmsforums.com","kitchenfunwithmy3sons.com","macizletaraftarium.online","motorsportsracingtalk.com","pensacolafishingforum.com","player.pcgameshardware.de","practicalselfreliance.com","premeditatedleftovers.com","sentinelandenterprise.com","simply-delicious-food.com","sportsgamblingpodcast.com","technicians0.blogspot.com","theprofilebrotherhood.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cookiedoughandovenmitt.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","edinburghnews.scotsman.com","keyakizaka46matomemory.net","lakesimcoemessageboard.com","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","theworldofarchitecture.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","aprettylifeinthesuburbs.com","forums.socialmediagirls.com","georgianbaymessageboard.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","vauxhallownersnetwork.co.uk","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","electricmotorcyclesforum.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","russianmachineneverbreaks.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","insuranceloan.akbastiloantips.in","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

const $scriptletFromRegexes$ = /* 0 */ [];

const $hasEntities$ = true;
const $hasAncestors$ = true;
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
