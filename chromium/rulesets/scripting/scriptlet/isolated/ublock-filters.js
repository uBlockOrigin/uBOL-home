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

function trustedSetSessionStorageItem(key = '', value = '') {
    const safe = safeSelf();
    const options = safe.getExtraArgs(Array.from(arguments), 2)
    setLocalStorageItemFn('session', true, key, value, options);
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

const $scriptletFunctions$ = /* 19 */
[replaceNodeText,removeNodeText,trustedCreateHTML,trustedSetAttr,trustedSetLocalStorageItem,setAttr,preventRefresh,setCookie,removeCookie,setLocalStorageItem,trustedSetCookie,hrefSanitizer,trustedClickElement,removeClass,closeWindow,multiup,setSessionStorageItem,trustedSetCookieReload,trustedSetSessionStorageItem];

const $scriptletArgs$ = /* 1128 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){let e=\"\";const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;const o=t.getProgressState?.();if(o&&o.duration>0&&(o.loaded<o.duration||o.duration-o.current>1)){if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\")){const o=t.getPlayerResponse?.(),r=o.videoDetails?.videoId;return void(\"UNPLAYABLE\"!==o?.playabilityStatus?.status||!o?.playabilityStatus?.errorScreen?.playerErrorMessageRenderer?.subreason||o?.playabilityStatus?.errorScreen?.playerErrorMessageRenderer?.playerCaptchaViewModel||e&&e===r||(e=r,t.loadVideoById(r,o.playerConfig?.playbackStartConfig?.startSeconds??0)))}t.seekTo?.(o.duration)}};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const e={apply:(e,t,o)=>{const r=o[0];return\"function\"==typeof r&&r.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(e,t,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,e)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i",".adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4977442009&adk=2039331362&adf=1059123170&pi=t.ma~as.4977442009&w=300&fwrn=1&fwrnh=100&lmt=1770030787&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787823&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!3\" data-google-query-id=\"CMiylL-r1pEDFYBewgUd-C8e3w\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6641328723&adk=3449722971&adf=1807356644&pi=t.ma~as.6641328723&w=311&fwrn=1&fwrnh=100&lmt=1770030787&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787824&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=5800016212302&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!4\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4977442009&adk=2039331362&adf=1059123170&pi=t.ma~as.4977442009&w=336&fwrn=1&fwrnh=100&lmt=1770031522&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770031522085&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4062124963340&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4281178270640280&tmod=72059292&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=2&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\" data-google-container-id=\"a!3\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","body:has(ins.adsbygoogle.nitro-body > div#aswift_1_host):has(.consent)","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1812271804&adf=3025194257&lmt=1770030787&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787821&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=5800016212302&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12245933&ady=-12245933&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\" data-google-container-id=\"a!1\" data-load-complete=\"true\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","ins.adsbygoogle.nitro-body","unfill-optimized","ins.adsbygoogle.nitro-side,ins.adsbygoogle.nitro-banner","filled","var menuSlideProtection","/*start*/!function(){\"use strict\";const t=Function.prototype.toString,n=new WeakMap,e=(t,e)=>{if(\"function\"==typeof t&&(n.set(t,`function ${e}() { [native code] }`),e))try{Object.defineProperty(t,\"name\",{value:e,configurable:!0})}catch(t){}return t},o=/[A-Za-z]{3}\\d[0-9A-Za-z]{4,}\\.js\\?v=1\\./,r=1770030787823;let i=0,c=!1;const a=()=>{if(c)return!1;c=!0;try{const t=(new Error).stack;return!!t&&o.test(t)}finally{c=!1}},s=window.Date,p=s.now,u=window.performance.now.bind(window.performance);function d(...t){return 0===t.length&&a()?new s(r+i):new s(...t)}d.prototype=s.prototype,d.now=e((()=>a()?r+i:p()),\"now\"),window.Date=e(d,\"Date\"),window.performance.now=e((()=>u()+i),\"now\");const w=String.prototype.match;String.prototype.match=e((function(t){const n=w.apply(this,arguments);if(t&&t.toString().includes(\"url=\")&&a()&&n&&n[1])try{n[1]=encodeURIComponent(window.location.href)}catch(t){}return n}),\"match\");const h=Array.prototype.push;Array.prototype.push=e((function(...t){return t.length>0&&\"string\"==typeof t[0]&&(\"fetch\"===t[0]||\"XMLHttpRequest\"===t[0])&&a()?this.length:h.apply(this,t)}),\"push\"),Function.prototype.toString=e((function(){if(n.has(this))return n.get(this);return[\"XMLHttpRequest\",\"fetch\",\"querySelectorAll\",\"bind\",\"push\",\"toString\",\"addEventListener\",\"now\",\"Date\",\"match\",\"createElement\"].includes(this.name)?`function ${this.name}() { [native code] }`:t.apply(this,arguments)}),\"toString\");const f=window.fetch;window.fetch=e((function(t){const n=\"string\"==typeof t?t:t?.url||\"\",e=f.apply(this,arguments);if(n.includes(\"googleads.g.doubleclick.net\")){const t=e.then;e.then=function(n,e){return t.call(this,(function(t){return i+=Math.floor(20*Math.random()+40),n(t)}),e)}}return e}),\"fetch\");const l=window.addEventListener;window.addEventListener=e((function(t,n){return\"message\"===t&&n?.toString().includes(\"googMsgType\")&&setTimeout((()=>{try{const t=document.getElementsByTagName(\"iframe\"),e=Array.from(t).find((t=>t.src.includes(\"google\")))||t[0];e?.contentWindow&&n({data:JSON.stringify({msg_type:\"resize-me\",googMsgType:\"pvt\",token:\"AOrYG...\",key_value:[{key:\"r_nh\",value:\"0\"}]}),source:e.contentWindow,origin:\"https://googleads.g.doubleclick.net\"})}catch(t){}}),500),l.apply(this,arguments)}),\"addEventListener\");const y=Function.prototype.bind;Function.prototype.bind=e((function(t,...n){const o=y.apply(this,arguments);return this===u||this===p||this&&\"now\"===this.name?e((()=>this===p?window.Date.now():window.performance.now()),\"now\"):o}),\"bind\");const g=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,\"contentWindow\"),m=document.createElement;document.createElement=e((function(t){const n=m.apply(this,arguments);if(\"iframe\"===t?.toLowerCase())try{Object.defineProperty(n,\"contentWindow\",{get:e((function(){const t=g.get.apply(this);return t&&!t._patched&&(t.Date=window.Date,t.performance.now=window.performance.now,t.String.prototype.match=window.String.prototype.match,t._patched=!0),t}),\"get\"),configurable:!0})}catch(t){}return n}),\"createElement\"),e(window.XMLHttpRequest,\"XMLHttpRequest\")}();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//,\"\");/*end*/var menuSlideProtection","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","#historicaerials_g_728x90_ATF","<div id=\"google_ads_iframe_/22597447651/historicaerials_g_728x90_ATF_0__container__\"><iframe id=\"google_ads_iframe_/22597447651/historicaerials_g_728x90_ATF_0\" width=\"1\" height=\"1\" data-load-complete=\"true\"></iframe></div>","#historicaerials_g_160x600_Left","<div id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Left_0__container__\"><iframe id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Left_0\" width=\"1\" height=\"1\" data-load-complete=\"true\"></iframe></div>","#historicaerials_g_160x600_Right","<div id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Right_0__container__\"><iframe id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Right_0\" width=\"1\" height=\"1\" data-load-complete=\"true\"></iframe></div>","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","/(window\\.AdObserverManager\\.register\\('ds[ps][cp]-bottomRecommend'\\);)/","(()=>{window.addEventListener(\"load\",(()=>{const t=document.querySelector(\"#openwebSection\"),e=document.querySelector(\"div[data-spot-id]\");if(!e||!t)return;const d=e.getAttribute(\"data-spot-id\");if(!d)return;var o;((t,e,d)=>{const o=document.createElement(\"div\");o.setAttribute(\"data-spotim-module\",\"conversation\"),o.setAttribute(\"data-spot-id\",t),o.setAttribute(\"data-post-id\",e),d.appendChild(o)})(d,Math.abs((o=document.title,[...o].reduce(((t,e)=>Math.imul(31,t)+e.charCodeAt(0)|0),0))),t);const a=document.createElement(\"script\");a.setAttribute(\"src\",`https://launcher.spot.im/spot/${d}`),a.setAttribute(\"async\",\"\"),document.head.appendChild(a)}));})();$1","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","window.open","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","admbenefits","ref_cookie","/\\badblock\\b/","alert","/if((.*))/","if(1==1)","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","31000, .VerifyBtn, 100, .exclude-pop.NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","counter_start\":\"load","counter_start\":\"DOMContentLoaded","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/\"http.*?\"/","REDIRECT_URL","/android/gi","stay","Android/","false/","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","timeLeft = duration","timeLeft = 0","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","close-modal","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","window.location.href = adsUrl;","div","<img src='/x.png' onerror=\"(function(){'use strict';function fixLinks(){document.querySelectorAll('a[href^=&quot;intent://&quot;]').forEach(link=>{const href=link.href;const match=href.match(/intent:\\/\\/([^#]+)/);if(match&&match[1]){link.href='https://'+match[1];link.onclick=e=>e.stopPropagation();}});}fixLinks();new MutationObserver(fixLinks).observe(document.body||document.documentElement,{childList:true,subtree:true});})()\">","4000","document.cookie.includes(\"adclicked=true\")","true","IFRAME","BODY","/func.*justDetect.*warnarea.*?;/gm","getComputedStyle(el","popup","/\\d{4}/gms","document.body.onclick","2000);","10);","(/android/i.test(t) || /Android/i.test(t))","(false)","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","fallbackUrl;","AdbModel","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","scipt","_blank","_self","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","offsetHeight","offsetHeight+100","timeLeft = 1","/aclib|break;|zoneNativeSett/","1000, #next-timer-btn > .btn-success, 600, #mid-progress-wrapper > .btn-success, 1300, #final-nextbutton","3500","#next-link-wrapper > .btn-success","1600","/fetch|popupshow/","/= 3;|= 2;/","= 0;","count","progress_original = 6;","progress_original = 3;","countdown = 5;","countdown = 3;","= false;","= true;","focused","start_focused || !document.hidden","focused || !document.hidden","checkAdsBlocked","5000","1000, #continue-btn",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","!document.hasFocus()","document.hasFocus() == false","getStoredTabSwitchTime","/\\d{4}/gm","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","onpopstate","showBannerAdBlock","state.shown >= redirectUrls.length","(isAdsenseBlocked)","onDevToolOpen","/#Intent.*?end/","intent","https","adUrl","href","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","9000","continue-button","3000","getElementById","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","/window\\.location\\.href.*/","/kiwi|firefox/","isFirefox || isKiwi || !isChrome","/2000|1000/","/10;|6;/","1;","progress","isAndroid)","false)","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","head","<div id=\"popads-script\" style=\"display: none;\"></div>","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","style","min-height:300px","ai_adb","window.admiral","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"|<a href=\"https:\\/\\/getad%/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","__adblocker","html-load.com","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","()=>eval","domain=?eventId=&error=",";confirm(","\"data-sdk\"","/\\(\\)=>eval|html-load\\.com|await eval/","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","d-none|media-filter-brightness|bg-dark",".media-main-image","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","prerollEnabled:true","prerollEnabled:false","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup/i","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","text-decoration","/break;case|FingerprintJS/","function defaultTrace","(()=>{let e=!1;window.qyMesh=window.qyMesh||{},window.qyMesh=new Proxy(window.qyMesh,{get:function(a,t,d){return!e&&a?.preload?.Page_recommend_1?.response?.items&&(a.preload.Page_recommend_1.response.items.forEach((e=>{e.extData?.dataExtAd&&(e.extData.dataExtAd={}),e.video&&e.video.forEach((e=>{e.adverts&&(e.adverts=[]),e.data&&(e.data=e.data.filter((e=>!e.ad)))}))})),e=!0),Reflect.get(a,t,d)}})})(); function defaultTrace","!function(){const e={apply:(e,t,o)=>{const i=o[1];if(!i||\"object\"!=typeof i.QiyiPlayerProphetData)return Reflect.apply(e,t,o)}};window.Object.defineProperties=new Proxy(window.Object.defineProperties,e)}(); function defaultTrace","!function(){const s={apply:(c,e,n)=>(n[0]?.adSlots&&(n[0].adSlots=[]),n[1]?.success&&(n[1].success=new Proxy(n[1].success,s)),Reflect.apply(c,e,n))};window.Object.assign=new Proxy(window.Object.assign,s)}(); function defaultTrace","push","(isAdblock)","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","/mdp|adb/i","popunder","adbl","/protect?","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","reload","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","unlock_chapter_guest","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","off","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","ab","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","blockCompletely();","name=","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","ins.adsbygoogle","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","in_d4","hanime.tv","p","window.renderStoresWidgetsPluginList=","//window.renderStoresWidgetsPluginList=","Custom Advertising/AWLS/Video Reveal",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|var FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","body","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","justDetectAdblock","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","/window\\.location\\.href.*?;/","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","<img src='/n5dev.png' onerror=\"setTimeout(function(){if(typeof startWebSocket==='function'){startWebSocket();document.querySelectorAll('.liveupdates').forEach(el=>el.classList.remove('hidden'));const nl=document.getElementById('noliveupdates');if(nl)nl.classList.add('hidden');}window.showAdblockedMessage=()=>{};}, 2000);\">","student_id",".offsetLeft",":{content:","no:{content:","AdBlockChecker",".modal-content","data-adsbygoogle-status","done","document.body.innerHTML","/popunder|contextmenu/","\"hidden\"","/overlay/i","/aoAdBlockDetected/i","button[aria-label^=\"Voir une\"]","button[aria-label=\"Lancer la lecture\"]","function(error)",",\"ads\"","pdadsLastClosed","window.SCHEDULE.home","/^/gms","__INITIAL_STATE__","/$/gms","(()=>{const url=__INITIAL_STATE__.page.clickthroughPageData.url;if(url){window.location.href=url}})();","/offsetHeight|\\.test/","anti-adblock-message","updateTime","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/cX_P|_pc/","/^_cX_/","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 893 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13;2,14,15;2,16,17;2,18,19;3,20,21,22;3,23,21,24;3,25,21,26;0,0,27,28,3,4;0,0,29,30;0,0,31;0,0,32,33;1,0,34;1,0,35;1,0,36,37,38;0,0,39,40;4,41,42,43,44,45,46,47,48,49,50,51;2,52,53;2,54,55;2,56,57;0,0,58,59;5,60,61,62;6;0,0,63,64;0,0,65,66,67,68;7,69,4;8,70;9,70,71;0,0,72,73;1,0,74;10,75,76,77,76,78,79;0,0,80,81;0,0,82,83,3,4;1,0,84;0,0,85,86;1,0,36;1,0,87;1,0,88;1,0,89;1,0,90;1,0,91;1,0,92;7,93,4;1,0,94;7,95,96;7,97,4;1,0,98;0,0,99,100;0,0,101,102;8,103;1,0,104;1,0,105;1,0,106;11,107,108;1,0,109;0,0,110,76,67,111;1,0,112;1,0,113;8,114;1,0,115;1,0,116;0,0,117,118;1,0,119;0,0,120;1,0,121;1,0,122;0,0,123,124;0,0,125;0,0,126,127;0,0,128,129;1,0,130;0,0,131,132;1,0,133;7,134,4;7,135,4;7,136,4;1,0,137;1,0,138;9,139,71;12,140;0,0,141,142;0,0,143,144,67,145;0,0,146,147;0,0,148,149;0,0,150,151;1,0,152;0,0,153,76,67,154;0,0,155,81,156,4;0,0,157,158,156,4;0,0,116,81;0,0,159,160;1,0,161;1,0,162;0,0,163,160,67,164;0,0,165,76,67,166;0,0,167,4,67,168;0,0,169,170;0,0,171,172;13,173;1,0,174;1,0,175;0,0,176,177;0,0,178,179;1,0,180;10,181,182;0,0,183,77,67,184;0,0,185,160,67,184;0,0,186;2,187,188;0,0,189,160;0,0,190,191;0,0,192,193;0,0,194;1,0,195;1,0,196;0,0,197,160;1,0,198;0,0,199,200;0,0,201,202;1,0,203;0,0,204,205,3,206;1,0,207;1,0,208;0,0,209;0,0,210,81;0,0,211,76,67,212;0,0,141,213,156,4;1,0,214;1,0,215;0,0,216,217;1,0,218;1,0,219;7,220,4;0,221,222,223;1,0,224;1,0,225;1,0,226;0,0,227,228;0,0,171,229;1,0,230;12,231,232;12,233,76,234;1,0,235;0,0,236,237,67,238;0,0,239,240;0,0,241,242;0,0,243,244,67,245;0,0,246,191;0,0,247,191;1,0,248;0,0,249,160;12,250,159;0,0,251,76,67,252;0,0,253,254;7,255,4;0,0,256,257;1,0,258;0,0,259,191;0,0,260,191;1,0,261;0,0,262,160,67,238;0,0,263,264,67,238;0,0,265,266;0,0,267,268;0,0,269,270;1,0,271;0,0,272,273;0,0,274,81;0,0,40,144,67,275;0,0,276,191;0,0,277,81;1,0,278;1,0,279;0,0,280,281,282,283;1,0,284;1,0,285;0,0,286,191;0,0,287,202;1,0,288;0,0,289;0,0,290,291;0,0,153,76,67,292;0,0,222,223,67,293;0,0,294,81;0,0,295,296;1,0,297;1,0,298;0,0,299,160,67,300;0,0,301,160,67,302;1,0,303;0,0,304,81;0,0,305,160;1,0,306;0,0,307;0,0,222,223;0,0,308,81,156,4;0,0,309,81,156,4;0,0,310,160;0,0,311,312,67,313;0,0,314,315;1,0,316;1,0,317;1,0,318;1,0,319;1,0,320;1,0,321;1,0,322;2,323,324;0,0,325,326;1,0,327;1,0,328;0,0,329,330;1,0,331;1,0,332;1,0,333;0,0,334;1,0,335;1,0,336;1,0,337;1,0,338;1,0,339;1,0,340;1,0,341;1,342,343;1,0,344;1,0,345;1,0,346;0,0,347,348,3,4;7,349,81;1,0,350;0,0,351,352;0,0,353,354;0,0,355,356;0,0,353,357;0,0,353,358;0,0,359,360,3,4;0,0,361,362,3,4;0,0,363,364,67,350;1,0,365;1,0,366;1,0,367;1,0,368;1,0,369;1,0,370;1,0,371;1,0,372;1,0,373;1,0,374;1,0,375;1,0,376;1,0,377;1,0,378;1,0,379;1,0,380;1,0,381;0,0,382,383,67,384;0,0,385,386;0,0,387,388;12,389,76,390;1,0,391;1,0,392;1,0,393;1,0,394;1,0,395;1,0,396;1,0,397;13,398,399;1,0,400;1,0,401;1,0,402;0,0,403,404;1,0,405;0,0,406,407,3,4;0,0,408,409;7,410,206;0,0,411,412,67,413;0,0,414,415;0,0,416,417;0,0,418,419,3,4;0,0,420;0,0,421,422;1,0,423;1,0,424;1,0,425;0,0,426,427;13,428;1,0,429;7,430,4;0,0,431;1,0,432;9,433,191;1,0,434;1,0,435;1,0,436;10,437,438,76,76,78,439;1,0,440;8,347;0,0,441,386,67,442;8,443;9,443,71;7,444,4;1,342,445;1,0,446;0,0,447,448,3,4;0,0,447,449,3,4;0,0,447,450,3,4;1,0,451;0,0,452,202;1,0,453;11,454,455;0,342,456,457;13,458,459,156;13,460,461,156;7,462,4;13,463;8,349;1,0,464;13,465,466,156;1,0,467;1,0,468;0,0,469,470;13,471,472;13,471,473;1,0,474;1,0,475;1,0,476;7,475,4;14,477;2,323,478;1,0,479;0,0,480,481,67,482;1,0,483;8;1,0,484;7,485,4;1,0,486;1,0,487;7,488,96;1,0,489;1,0,490;1,0,491;1,0,492;8,493;9,493,71;5,494,61,495;7,220,496,76,497,4;10,498,499;0,342,500,501,67,502;1,0,503;1,0,504;1,0,505;1,0,506;1,0,507;13,508;0,0,509,510;13,511,512;9,513,191;7,514,4;11,515,516;1,0,517;8,518;7,519,4;7,520,191;1,0,521;1,342,522;13,523,76,156;1,0,524;15;1,0,116,67,122;1,0,525;1,0,526;1,0,527;0,0,528,529;1,0,530;1,0,531;7,395,532;8,533;1,0,534;1,0,535;1,536,537;1,536,538;1,536,539;1,536,540;1,536,541;1,536,542;1,536,543;1,0,544;1,536,545;0,0,546;12,547;1,0,548;0,0,549,550,3,4;0,0,551,81;12,552;0,0,553,554,67,555;11,556,557;11,558,516;1,0,559;1,0,560;1,0,561;1,0,562;1,0,563;1,0,564;1,0,565;1,0,566;1,0,567;7,568,4;1,0,569;1,0,570;1,0,571;1,0,572;0,0,573,574,67,575;9,576,206;0,0,577,76,67,578;5,579,61,580;1,0,581;13,582,583;1,0,584;1,0,585;11,586,516;0,0,587,588,67,589;7,590,4,76,497,4;1,0,591;1,0,592;1,0,593;1,0,594;1,0,595;1,0,596;1,0,597;1,0,598;1,0,599;8,600;1,0,601;1,0,602;1,0,603;1,0,604;0,0,605,202;0,606,607;1,0,608;1,0,609;1,0,610;0,0,611,612;1,0,613;6,614;9,615,191;1,0,616;1,0,617;1,0,618;1,0,619;1,0,620;0,0,621,622;12,623;13,624,625;1,0,626;12,627;1,0,628;0,0,629,630;0,0,631,632;1,0,633;1,0,634;0,0,635,636;0,0,637,638;0,0,639,202;7,640,4;7,641,4;1,0,642;7,643,191,76,497,4;0,0,475,76,67,475,156,4;8,644;0,0,645,386;0,0,646,202;0,0,647;7,395,160;1,0,648;1,0,649;0,0,650,651,3,4;1,0,652;1,0,653;1,0,654;1,0,655;7,656,4;1,0,657;7,658,4;1,0,659;7,660,4;10,661,662;1,0,663;0,0,664,665;1,0,666;1,0,667;1,0,668;1,0,669;16,670,71;5,671,61,672;7,475,96;1,0,673;1,0,674;0,0,675,191;0,0,676,386;1,0,677;0,0,678,76,67,633;1,0,679;1,0,680;16,681,191;0,0,682,683;0,0,684,685;7,686,4;7,687,4;1,0,688;0,0,689,690;9,691,71;0,0,692,693;7,694,4,76,497,4;0,0,695;1,696,697;0,0,698,81;1,0,699;7,700,4,76,497,4;0,0,701,76,67,702;0,0,703,704;1,0,705;1,0,706;16,707,191;1,0,708;1,0,709;9,710,81;1,0,711;0,0,712,713,67,714;1,0,715;1,0,716;1,0,717;3,718,21,26;7,719,4;1,0,720;10,721,182;1,0,722;1,0,723;0,0,353,724,3,4;1,0,725;0,0,726,727,3,4;1,0,728;0,0,729;0,0,730,731;1,0,732;1,0,733;0,342,734,735;0,0,736,737;1,0,738;7,739,4;1,0,740;9,741,191;1,0,742;0,0,743,744;7,745,4;1,0,746;0,0,7,747;1,0,748;1,0,749;3,750,751,752;1,0,753;13,754,755;10,756,4,76,76,78,757;0,0,475,758;0,0,759,760,67,761;12,762,76,763;1,0,764;8,765;1,0,766;1,0,767;1,0,768;10,769,770;1,0,771;1,0,772;1,0,773;0,0,774,191;1,0,775;1,0,776;0,0,777,778,3,4;9,779,71;1,0,780;0,0,781,782;0,0,783;1,0,784;17,785,785;1,0,786;13,787,76,156;7,788,4;8,789;1,0,349;16,790,791;1,0,792;0,0,793,794;1,0,795;0,0,796;1,0,797;1,0,798;1,0,799;1,0,800;1,0,801;8,802;10,803,191,76,76,497,4;1,0,804;1,0,805;1,0,806;7,807,191;1,0,808;1,0,809;1,0,810;0,0,811,76;7,812,191;7,813,191;1,0,814;1,0,815;1,0,252;0,0,816;9,817,4;4,818,182;1,0,819;1,0,820;1,0,821;1,0,822;10,823,824;2,825,826;1,0,827;1,0,38;0,0,828,829;0,0,353,830,3,4;0,0,831,832,3,4;1,0,833;0,0,834,835;1,0,836;1,0,837;1,0,838;7,839,4;7,840,4,76,497,4;11,841,455;0,0,842;1,0,843;0,0,844,845;0,0,280,846;0,0,847,848;0,0,849;1,0,850;1,0,851;0,0,852,853;1,0,854;1,0,855;1,0,856;1,0,857;1,0,858;1,0,859;1,536,860;1,0,861;1,0,862;1,0,227;2,825,863;9,864,71;1,0,865;0,0,866,867;1,0,868;1,342,869;3,718,870,871;2,718,187;1,0,872;1,0,873;1,0,874;1,0,875;1,0,876;12,877;12,878;1,0,879;0,0,880;4,881,182;1,0,882;1,0,883,37,884;0,0,885,886,67,884;1,0,887;1,0,888;18,889,182;5,890,891,4;1,0,892;1,0,893;1,0,894;1,0,895;9,896,71;9,897,71;9,898,71;9,899,71;9,900,71;9,901,71;11,902,516;8,903,904,905;9,906,71;11,907,516;11,908,909;9,910,71;11,911,912;11,913,914;11,915,516;11,916,917;11,918,919;11,920,108;11,921,917;11,922,516;11,923,919;11,924,925;11,926,516;11,927,516;11,928,917;11,929,930;11,931,516;11,932,516;11,933,919;11,934,935;11,936,516;11,937,938;11,939,940;11,941,516;11,942,108;11,943,516;11,944,945;11,946,947;11,948,949;11,950,951;11,952,953;11,954,919;11,955,516;11,956,957;11,958,516;11,959,960;11,961,962;11,963,516;11,964,965;11,966,967;11,968,969;11,970,516;11,971,972;11,973,516;11,974,516;8,975;8,976;8,977;8,978,904,905;8,979;8,980;8,981,904,905;8,982;10,981,76,77;7,983,496;7,984,496;8,985;8,986;8,987;8,988,904,905;8,989,904,905;9,990,71;16,991,71;8,992;9,993,71;8,994,904,905;10,994,77,76,76,78,995;8,996,904,905;10,997,76,77,76,78,998;8,999;8,1000,904,905;9,1001,71;16,1002,71;8,1003,904,905;8,1004;9,1005,71;8,1006;9,1007,71;8,1008,904,905;8,1009;8,1010;8,1011,904,905;9,1012,71;16,1013,71;8,1014,904,905;8,1015,904,905;9,1016,71;8,1017;8,1018,904,905;9,1019,71;8,1020,904,905;8,1021,904,905;9,1022,71;16,1022,71;8,1023;8,1024;9,1024,71;9,1025,71;9,1026,71;10,1027,76,77,76,78,1028;10,1029,76,77,76,78,1028;9,1030,71;8,1031,904,905;9,1032,71;9,1033,71;8,1034;8,1035;8,1036,904,905;9,1037,71;8,1038,904,905;9,1039,71;9,1040,71;9,1041,71;8,1042,904,905;8,1043;8,1044,904,905;8,1045;9,1046,71;8,1047;8,1048,904,905;8,1049,904,905;10,1050,76,77,76,78,1051;10,1050,76,77,76,78,1052;9,1053,71;8,1054,904,905;9,1055,71;9,1056,71;10,1057,76,77,76,78,1058;10,1059,76,77,76,78,1058;10,1060,76,77,76,78,1058;10,1061,76,77,76,78,1062;9,1063,71;9,1064,71;8,1065;9,1066,71;9,1067,71;9,1068,71;8,1069,904,905;9,1070,71;8,1071,904,905;9,1072,71;8,1073,904,905;9,1074,71;8,1075,904,905;9,1076,71;9,1077,71;8,1078;9,1079,71;11,1080,930;11,1081,930;11,1082,930;11,1083,930;11,1084,930;11,1085,930;11,1086,930;11,1087,930;11,1088,930;11,1089,930;11,1090,516;1,0,1091;8,1092;8,1093;16,1094,81;11,1095,1096;8,1097;11,1098,516;10,997,76,77,76,78,1099;8,1100;9,1101,71;8,1102;10,1103,1104,76,76,78,1105;10,1106,76,77,76,78,1105;10,1107,76,77,76,78,1105;10,1103,1104,76,76,78,1108;10,1106,76,77,76,78,1108;10,1107,76,77,76,78,1108;8,1109;8,1110;1,0,1111;8,1112;9,1113,71;8,1114;9,1115,71;16,1116,71;9,1117,71;9,1118,71;8,1119;16,1120,71;8,1121,904,905;11,1122,516;8,1123;9,1124,71;1,0,1125,67,1126;1,0,1127";

const $scriptletArglistRefs$ = /* 5294 */ "217;217;209;45;234;209;21,508;689,690,691,692,693,694;209;40,209;209;448;231;322;234,253,689,690,691,692,693,694;259;859,860;209,525;217,259;40;40;209;234,689,690,691,692,693,694;222;234;231;217;142,219;43,209,219;231,247;234,252;209;83;209;141,142;234;234,689,690,691,692,693,694;217;45;38;44;40,209;234;234;368;245;217;234;234;234,253,689,690,691,692,693,694;217;231;209;689,690,691,692,693,694;39;234,689,690,691,692,693,694;205;209;264;234,254;259;209;219;331;104;217;219;234;85;72,205;217;209;209;243;689,690,691,692,693,694;72,205;231;395;219;209;531;124;209;209;233,234;234,689,690,691,692,693,694;209;744;750;234;611;685;209;452;40;538;705;217;809;209,288;209;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234,689,690,691,692,693,694;209;2;217;217;217;205,234,253,689,690,691,692,693,694;231,251;231;234;217,419;821,822;514;254;217;234;687;234;243;205;682;234;234;4,698,750;320;234,689,690,691,692,693,694;209;480;730,731;380;209;892;217,259;233,234;253;234;610;57;40;40;231;188;234;334;209;448;217;205;233,234;234;844;234;234,689,690,691,692,693,694;234;234;209;520;520;812;243;223;209;209;209;234;264;234;234;217;775,776;423;234,689,690,691,692,693,694;231;207;590;804;209;251;234,689,690,691,692,693,694;701;221;234;211;655;777;209;209;234;234;233,234;209;29;209,217;209;209;234,253;221;209;209;233,234;787;209;234;234;538;209;209;209;327;74,205;209;209,288;209;211;689,690,691,692,693,694;209;231;233,234;639;57,209;346;234,689,690,691,692,693,694;217;209;209;40,57,217;234;51;57,209,217;209;209;209;231;234;234,689,690,691,692,693,694;234;231;808;40;209,221;209;209;209;234;209;234;613;613;209;513;264;820,822;209;209;234;209,217;209;209,217,220;209;217;264;209,221;689,690,691,692,693,694;209;209;209;485;247,689,690,691,692,693,694;234,689,690,691,692,693,694;209;234;234;234,689,690,691,692,693,694;127,128;604;363;705;234;705;209;209;234;209;757;258;376;234;209,217;209,633;744;219;448;264;380;259;259;209;234;209;209;234,689,690,691,692,693,694;259;259;209;259;251;234;209,217;97,209;439;217;217;209;209;125;267;233,234;705;5;217;117,118,119,120;209;209;217;501;234;217;161;689,690,691,692,693,694;225;145,146;209;209;97;299;234;689,690,691,692,693,694;85;234;234;234;234;566;209;790,791,792;217;426;209;209;234;55;798,799,800;811;209,217;229;234,689,690,691,692,693,694;234;209;234;231,305;234,689,690,691,692,693,694;588;429;308;234;234;209;209;209;265;33;474,475,476,477,478;209;40,57;231;243;306;757;689,690,691,692,693,694;92;264;221;689,690,691,692,693,694;234,689,690,691,692,693,694;689,690,691,692,693,694;676;253;243,689,690,691,692,693,694;861;205;494;209;234;209;234,689,690,691,692,693,694;40,209;209;209;654;231;234;234;234;145,146;689,690,691,692,693,694;234;588;599;40;209,221;209;40;234;40;209;234;209;864;234,689,690,691,692,693,694;852;853;854;689,690,691,692,693,694;264;217;48;209;125;209;209;234;234;209;204;397;125;125;168,169,170;209;209;268;861;209;471,472,473;113;448;365;219;209;209;367;46;277;704,730,731,732,734,735;205;649;221,433;433;209,288;125;234;234;86,87;209,217;209;209,331,411;209;125;125;234;209;209;209;234,689,690,691,692,693,694;234;209;209;40,217;259;209;209;125;234;884;599;184,185,187;234;125;125;205;234;126;231;234,689,690,691,692,693,694;484;559;331;121;178;323;471,472,473;706;209;209;689,690,691,692,693,694;145,146;217;209;209;90;730,731,732;377,378;209;209;234;234;234;209;40;209;234,689,690,691,692,693,694;209;97;209;217;324;264;165,166;217;330;78,79,80;217;209;209,265;212;234;259;234;209;219;209;234;143;217;270;125;125;314;217;209,217;423;234;65;623;209;136;209;209;245;234;234;599;297;234;234;234;264;234;217;744;234;259;234,689,690,691,692,693,694;72,205;209;556;133;714,715,764,765;168,169,170;250,253;221;125;234;389;46;433;653;70;883;234;295,296;209;234;161;753;620,621;217;59;209;227;564;234,689,690,691,692,693,694;234;264;433;217;209;465;544;209;518;277;46,457,458;217;217;209;258;70;231;209;842,843;217;205;209;705;471,472,473;234,689,690,691,692,693,694;234;219;234;789;86,87;217;392;234;257;234;217;605;217;209;231;234;375;217;209;234,689,690,691,692,693,694;217;209;209;234;830;730,731;209;234;234;234;264;438;209;209;276;236,689,690,691,692,693,694;689,690,691,692,693,694;689,690,691,692,693,694;234,689,690,691,692,693,694;234,689,690,691,692,693,694;209;209;209;209;209;97;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234,689,690,691,692,693,694;161;213;209,229;168,169,170;265;209;97;209;217;805;805;209;105,106,107,108,109;70;209;267;217;233,234;362;234;234;410;231;619;209;234;57;471,472,473;599;254;234,689,690,691,692,693,694;217;97;209;209;61;262;234;234;231;424;673,674;372;68,372;850;133;219;689,690,691,692,693,694;221;234;234;383;234;249,250;205;594;209;535;209;231;332;97;217;35;217;61;234;231;234,689,690,691,692,693,694;147;40;209;209;234;234,689,690,691,692,693,694;264;710;209,217;258;97;97;2;97,136;264;209;209;234;219;209;209;84,85;234;689,690,691,692,693,694;209;362;437;209;217;231;888;217;234,689,690,691,692,693,694;234;234;565;251;234;69;209,221;209,217;209;209;136;209;209;225;66;46;231;277;154,155,156,209;43;339;42;75;40;209,288;663;209,288;129;234;209;209;86,87;55;209,525;221;234;231;234;217;243,689,690,691,692,693,694;234,689,690,691,692,693,694;495;217;456;209;209;231;209;247,689,690,691,692,693,694;221,329;209;209;125;40;97;209;705;219;209;259;209,217;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;259;231;234;362;183;248;217;209;231;488,489;209;440;234;471,472,473;471,472,473;471,472,473;471,472,473;234;209;209;264;209;705;337;234,689,690,691,692,693,694;233,234;209;209;234,689,690,691,692,693,694;217;544;233,234;209;234;217,219;217;234,689,690,691,692,693,694;234;234,689,690,691,692,693,694;234;189,190;234;451;25;550,885,886;580;234;97;81;40;641;209;209;234,689,690,691,692,693,694;231;209;40;209;217;209;234,689,690,691,692,693,694;258;412;231;313;229;234;209;209;209;61;689,690,691,692,693,694;225;46;134,373;231;231;209;57;126;209;234;334;231,769,770,771;205;861;42;234;234;234;583;209;861;209;128;231;234,689,690,691,692,693,694;217;689,690,691,692,693,694;209;209,217,525;37,234,689,690,691,692,693,694;125;234;209;848;231;209;315;209;234;209;134,136;209;97;689,690,691,692,693,694,742;231;234,689,690,691,692,693,694;234;209;234,243,689,690,691,692,693,694;259;234;234;209;630;689,690,691,692,693,694;599;459;209;887;209;233,234;217;300;233,234;49,50;861;289;209;234;209;211,221,626;219;217;209;262;40;40;234;629;689,690,691,692,693,694;234;234;233,234;209;209;209;234;234;234;243;209;253;577;234;234;192;209;595;145,146;834;490;234,689,690,691,692,693,694;234;209;234;234;209;57,209;421;599;872,873,874;217;40;628;209;234,689,690,691,692,693,694;139;234;182;209;234;264;265;209;264;264;209;689,690,691,692,693,694;273;234;303,304;245;233,234;209;247,689,690,691,692,693,694;892;234;234;637;97;234;209;234,689,690,691,692,693,694;81;234,689,690,691,692,693,694;264;234,689,690,691,692,693,694;231;209;234;207;810;230,258;209;209;209;433;706;209;433;234;310;209;209;234;265;379;234;234,689,690,691,692,693,694;407;861;209;209;217;330;209;723;97;97;234;209;40;209;217;219;209;209;209,221;217;496;209;209;372;234,689,690,691,692,693,694;234;234;599;209;704,730,731,734,735;209;209;553;689,690,691,692,693,694;231;383;40;209;567;209;209;209;234;42;14,15,16,17;234;209;217;209;234;209;19,20,224;234;233,234;209;285;234,689,690,691,692,693,694;231,747;433;234,689,690,691,692,693,694;231;209;231;677;209;209;234;209;786;217;209;706;570;217;217;730,731;234,689,690,691,692,693,694;316,317;209;234;209;92;209;5;137;184,185;221;221;209;46;234;221,601;209;234,689,690,691,692,693,694;133;217;209;209;209;102;507;209;209;234;209;209;234;231;217;209;209,221;209;599;221;532;209;663;663;40;209,217;209,219;63;234;234;73;209;234;689,690,691,692,693,694;340,341;258;234;205,206;234;744;234;234;221;233,234;455;133;47;5;209;40,219,528;207;234;234;234;659;234;712;209;234;234,689,690,691,692,693,694;209;40,57;-41;209;233,234;191;217;208;209;433;234,689,690,691,692,693,694;450;254;62,231,728;217;209;217;209;382;209;40;245;234;234;234;432;689,690,691,692,693,694;599;231;433;651;410;209;544;352,353,354,355,356;265,635;234;234;481;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;603;521,522;88;217;-41;209;234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;219;209;234;234;234,689,690,691,692,693,694;209;234;234;234;234;234;40,217;329;209;234;234;763;234;209;253;209,599;209;234;231;231;209;234,689,690,691,692,693,694;668;209;209;209,288;125;217;433;134,136;326;184,185,186,187;231;209;144;234;234,689,690,691,692,693,694;209;234;114;689,690,691,692,693,694;234;429;209;209;27;689,690,691,692,693,694;265;209;257;136;61;231;209;338;599;861;689,690,691,692,693,694;258;234;599;797;599;257;234;234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;-41,-600,-893;234;257;466;234;119;643;234;139;233,234;217;217;599;234;209;234;234;234;433;231;231;207;209;231,251;233,234;217;209;509,510;234;219;234,689,690,691,692,693,694;209;259;661;82;231;599;171,172,173;259;59;596;447;689,690,691,692,693,694;209;55;729;433;209;235,689,690,691,692,693,694;234,689,690,691,692,693,694;161;253;97;234;748,749;370;233,234;257;209;558;334;234;234;40;277;209,217;217;209;209;217;234;217;217;234;145,146;209;233,234;329;449;209;277;207;234;588;209;233,234;234,689,690,691,692,693,694;234;554;234;27;217;705;234,689,690,691,692,693,694;67;234;234;231;234;404;234,689,690,691,692,693,694;548;217;433;264;209;209;265;376;40;209;98,99,100,101;133;209;209;234;840,841;234;233,234;427;234;599;468,469;234;234;209;433;42;234,689,690,691,692,693,694;234;234,689,690,691,692,693,694;209;209;61,209;431;234;209;234;114,115,116;209;234;209;401;234;209;264;209;234,689,690,691,692,693,694;644;627;234;234;234;209,217;428;302;209;234,689,690,691,692,693,694;234,689,690,691,692,693,694;209,221;234;234;234;27,209;209;234;585;228;695;209;612;234,689,690,691,692,693,694;233,234;234;209;234;234;231;343;130;485;209;706;209;134,136;234;231;234,689,690,691,692,693,694;234;202;30;209;234;97;234;209;865,866,867;689,690,691,692,693,694;209;234;217;234;234;231;675;625;221;659;519;234;234;233,234;145,146;209;234;219;217;217;209;209;217;845;234;234;217;838,839;234;89;234,689,690,691,692,693,694;234;57;234;234,689,690,691,692,693,694;234,249,250,253;234;234;209;234,689,690,691,692,693,694;529;234,689,690,691,692,693,694;209;27;234,689,690,691,692,693,694;257;209;217;231;813;234,244;731;209;34;395;234;231;333;234;234;217;234;264;209;209;395;209;706;706;209;209;433;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;689,690,691,692,693,694;243;209;93,94,95;234;234;234;234;234;234;234;234;653;234;209;234;249,250;234,689,690,691,692,693,694;217;231;545;233,234;234;217;209;588;588;588;234;234;234;685;234;234;234;231;234,689,690,691,692,693,694;209;209;209;231,730;209,757;148,149,150,151,152,153;231;125;234,689,690,691,692,693,694;234;665;97;233,234;257;461;706;205;433;231;574;364;217;741;234;234;262;221;209;209;602;209,221,288,532;258;132;209;231;234,689,690,691,692,693,694;211;211;234;209,221,288,532;415;133;234;148,149,150,151,152,153;445;374;793;234;876;46;747,832,833;233,234;640;209;209;209;234;234;817;450;456;456;456;262;217;217;209;225;209;243;234;234;234;209;233,234;311;209;233,234;209;234;42;471,472,473;234,689,690,691,692,693,694;234;672;209;221;217;209;5;209,217,525;217;234;234;757;234;662;207;145,146;234,689,690,691,692,693,694;209;684;211;234;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;683;234;234;706;706;209;92,200,201;234;706;670;349;209;383;234;234,689,690,691,692,693,694;209;54;234;217;234;209;217;209;217;234;234;209;234;231,232;234;234;234;209;40;234;209;774;58;234;599;92,200,201,202;231;687;234;209;209,288;233,234;288,532;209;135;209;234;209;264;504;209;55;97;470;97;358;314;233,234;234;234;234;231;234,253,689,690,691,692,693,694;209;234;578;689,690,691,692,693,694;233,234;234;334;234;219;209;234;234;360;231;234;265;209;231;373;685;126;234;861;265;136;755;42,361;231;796;234;209;679,680;234;234;533;97;209;282,283;599;234;231,608;133;234,689,690,691,692,693,694;505;234;234;233,234;247,689,690,691,692,693,694;234,689,690,691,692,693,694;231;57,217;234;234;371;414;126,209;209;471,472,473;234;747;207;209;234;40;689,690,691,692,693,694;234;126;744;233,234;234;234;137;209,217;861;209;780,781,782;234,689,690,691,692,693,694;209;234;509;509;234;234;259;97;209;233,234;492;265;599;257;253;234;234;846;97;430;176;448;209;265;134,162,163,164;234;689,690,691,692,693,694;234;234;234,689,690,691,692,693,694;582;217;40;205;209;313;264;209;622;689,690,691,692,693,694;209;209;234;234;586;209;234;234;234;234;234;325;209;209;433;549;209;599;319;686;194,195,196,197,198,199;209;209;647;234;234;247,689,690,691,692,693,694;234;234;234,689,690,691,692,693,694;234;234;234;490;555;209;234;234;234,689,690,691,692,693,694;234;234,253;133;234,689,690,691,692,693,694;217;687;264;269;264;42;209;345;209;234;234;241,689,690,691,692,693,694;209;869,870,871;234;234;330;231;217;234;234;231;203;234,689,690,691,692,693,694;826,827,828;357;234;209;889,890;209;264;234;209;386;114,115,116;105,106,107,108,109;245;234,689,690,691,692,693,694;727;234;234;549;257;403;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234,689,690,691,692,693,694;209;234,689,690,691,692,693,694;234,243;209;234;234,689,690,691,692,693,694;209;242,689,690,691,692,693,694;265;136;112,113;46;217;234,689,690,691,692,693,694;744;234;861;245;234;97;234,689,690,691,692,693,694;845;234,689,690,691,692,693,694;231;650;706;126;233,234;209;209;209;231;42;97;42,97;750,752;219;209;209;209;40;625;825;731;231;234;689,690,691,692,693,694;234;209;646;41,205;209;209;209;209;234;209;209;699,700;234;234;217;233,234;258;209;209;209;209;231;253;234;234;234;744;436;209;391;362;362;851;234,689,690,691,692,693,694;209,288;205;234,689,690,691,692,693,694;209;422;231;217;225;209;234;253;230,258;234;766;209;234;706;234;607;234;209;209;502,503;234,689,690,691,692,693,694;209;210;234;209;234;209;862;376;234;234;636;216;216;209,561;209;209;209;209;209;143;861;246,689,690,691,692,693,694;858;234,689,690,691,692,693,694;233,234;231;209;6,7,8,9,10,11,12,13;234;231;40,528;125;234;234;234;234;234;234;569;359;234,689,690,691,692,693,694;40,307;234;589;207;234;257;209;234;209;209;234,689,690,691,692,693,694;234;234,689,690,691,692,693,694;217;234;234;257;234;219;234;274;234;209,265;209;112,138;209;209;209;209;243;217;265;266;806,807;328;209,221;209;161;253;209;209;234;231;234;5;209;209,221;209;251;234;209,221,706;234;234;209;217;689,690,691,692,693,694;209;234;234;203;703;234;221;221;221;706;706;209;532;70,209;217;575;40;234;783;234;209;657;217;209,288;97;647;732;379;234;731;251;234;207;209;234;231;861;234;209;234;506;209;219;209;406;456;456;209;262;97;265;258;234;126;97;234;207;234;234;456;456;209;234,689,690,691,692,693,694;217;234;233,234;209;209;471,472,473;221,329;396;225;209;234;40;217;217;599;207;209;794,795;861;234;291,292;863;209;234,689,690,691,692,693,694;234;209;750,751;40;219;234;243;207;209;234;599;231,768;209;622;309,310;234;264;234;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;471,472,473;706;209;209;706;209;234;892;234;234;234;209;234;234;209;540;819;234;25;234;271;234;234;234;234;811;209;211;234,689,690,691,692,693,694;599;234,689,690,691,692,693,694;234;217;815,816;97,132;209,221;209;209;219;209;209;234;234;234;137;52,53;253;234;234;234;234;209;257;234;203;137;234;97;27,344;264;209;233,234;234;234;205;231,788;599;126;599;234;234;234;230,258;234;685;234;90;231;234,689,690,691,692,693,694;211;234;207;209,219;57,217;234;234;234;685;342;264;40,57,599;209;234;40,57;599;209;209;234;209;209;519;234;234;861;861;207;231;234,689,690,691,692,693,694;234;27;861;861;347,348;347,348;207;209;234;234;257;209;247,689,690,691,692,693,694;234;36;243,689,690,691,692,693,694;234;234;231;711;40,307;40,57,209,217,307;233,234;399;262;234;234;234;209;209;40;234;234;40;234;234;234;217;209;209,221;231;234;277;27,542,543;234;234;234;105,106,107,108,109;234;209;388;194,195,196,197,198,199;234;234;234;209;133;234;209;233,234;234;97;209;219;221;175;234;234;234;471,472,473;234;209;545;234;46;209;233,234;539;209;552;209,288;137;234;234;234;599;277;231;40;689,690,691,692,693,694;234;209,221;234;234;168,169,170;234;98,99,100,101;234;277;209,217;209;209;264;215;209;42;42;217;217;209,217;234;234;234;209;234;849;234;209,217;209;234;234;274;167;704,730,731,734,735,739;234;286;577;247,689,690,691,692,693,694;233,234;669;234,689,690,691,692,693,694;209;234,689,690,691,692,693,694;262;221;211;234;234;60;689,690,691,692,693,694;525;234;209,479;234;234,689,690,691,692,693,694;234;599;234;578;234;234;218;234,689,690,691,692,693,694;234;247,689,690,691,692,693,694;234;258;233,234;727;773;234;89;875;313;231;287;234;209,219;240;572;234;234;205;42;165,166;234;801,802,803;214;217;652;234;225;177;234;234;209;209;234;234;209;42;234;234,689,690,691,692,693,694;209;245;231;234,689,690,691,692,693,694;433;217;471,472,473;122;831;209;257;398;209;234;234,689,690,691,692,693,694;231,767;209;234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;234;744;257;234;234;685;707,708,709;234;234;209,318;861;233,234;234;486;231;209;861;234;706;706;284;233,234;462;209;233,234;857;209;234;233,234;233,234;209;234;40;261;233,234;209;207;209;671;460;209;599;855;234;209;209;234;234;209;525,528;234;257;234;234;234;861;234,253;507;598;209;209;209;231;209;97;221;209;234;234;133;27;209;231;861;257;658;217;757;209;381;861;233,234;207;221;97;42;234;234;255;656;209;234;724,725;251;209;209,217;209;234;231;349;740,836,837;217;234;234;72;234;525;234;234;234;234;234;209;234;645;209;221;257;233,234;234;209;209;234;209;225;217;234;234;234;234;231;647;97;536;689,690,691,692,693,694;234;233,234;207;231;231;209;211;70;744;409;97;234;364;209;231,253;209;217;148,149,150,151,152,153;253;685;253;209;861;234;234;861;234;262;234;209;209;234;861;234;209;209;234;57;57,217;231;234;133;234;209;234;209;209;234;234;234,689,690,691,692,693,694;209;217,329;706;209;234;233,234;257;234;858;26;40;234,689,690,691,692,693,694;265;209;217;568;209;234;209;234;471,472,473;471,472,473;471,472,473;471,472,473;221;541;263;234;234;209;234;234;70;660;234;234;234;234;82,221;234;234;234;234;233,234;234;234;233,234;234;89;209;234;231;217,433;234,689,690,691,692,693,694;40;234;136;209;433;217;689,690,691,692,693,694;136;234;234,689,690,691,692,693,694;234;231;234;234;234;234;97;40;234;233,234;219;97;209;234;758,762;231;231;257;57;57;57;209;221;209;234;234;40;209;234;233,234;40;293;679,680;233,234;234;234;234;234;126;234;847;234;209;234;234;258,758;243,689,690,691,692,693,694;209;264;685;117,118,119,120;234;415;66;234;234;257;234;234;234;861;861;257;231;257;234;772;234;234;233,234;148,149,150,151,152,153;234;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;280;40;209;234;234;205;137;234;234;234;234;231;209;237,689,690,691,692,693,694;230,258;231;648;399;234;217;134;233,234;497,744;233,234;209;229;491;234;234,689,690,691,692,693,694;557;209;27,542,543;171,172,173;103;234,253;234,689,690,691,692,693,694;253;231;209;234;233,234;243;231,234;706;298;599;234,689,690,691,692,693,694;234,689,690,691,692,693,694;5;408;233,234;234;234,689,690,691,692,693,694;234;243;234;205;234;209;234,689,690,691,692,693,694;234;233,234;264;234;217;209;638;234;205;147;234;318;209;745,746,757;264;209;209;234;209;234;209;234;234;233,234;234;393;528;234;234;234;209;202;234;40;234;209;257;234;234;234;233,234;234,689,690,691,692,693,694;234;234;234;209;234;234;467;234,689,690,691,692,693,694;644;272;179,180,181;234,689,690,691,692,693,694;234;861;234,689,690,691,692,693,694;234;387;86,87;234,689,690,691,692,693,694;433;217;257;420;234;234;209;234;234;234;861;785;207;706;234;233,234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;40;234;234;257,689,690,691,692,693,694;234;861;234;231;234;70;675;647;234;40;211;40;260;209;209;136;122;369;599;209;234;861;234;257;247,689,690,691,692,693,694;234;234;221;233,234;234;209,217;217;209;233,234;433;861;234;234,689,690,691,692,693,694;507;231;234,689,690,691,692,693,694;126;706;706;234;234;581;209;209;217;234,689,690,691,692,693,694;209;234;231;159,160;209;234;861;209;440;234;234;234;234;234;234;84,85;234;209,265;234;209;234;440;40,57,599;234;234;234;386;234;126;209;234;234;507;689,690,691,692,693,694;384;234;234;257;40;234;234;234;40;588;234;234,689,690,691,692,693,694;90,225;549;234;234;234;40,209;234;497,744;209;209,211;123;447;234;234,689,690,691,692,693,694;233,234;234;257;234;689,690,691,692,693,694;231;40;880;234,689,690,691,692,693,694;234,689,690,691,692,693,694;209;500;689,690,691,692,693,694;40;234;57,209,217,288;234;231;234;209;234;264;234;234;234;209,288;209,288;234;234;209;234;233,234;234;209;463;234;257;209;351;230,258;234;861;209;861;209;243;40;40;229;530;281;281;281;281;281;281;281;281;281;281;281;281;281;281;281;281;281;281;394;209;234;262;133;234;209;234;254;209;460;57;234;253;234,689,690,691,692,693,694;234;234;209;234;57;234;234;234;234,689,690,691,692,693,694;622;234;234;209;376;706;207;205;678;234;234;861;90;230,258;433;209;599;207;868,-873,-874,-875;0,1;209;706;209;234;257;234;148,149,150,151,152,153;234,689,690,691,692,693,694;234;234;234;234;234;233,234;234;209,288;209,288;209;209;233,234;234;234;234;234;209,576;209;40,217;234;234;234;278,279;217;234;706;233,234;234;234;209;329;234;257;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;253;861;818;245;234;257;234;689,690,691,692,693,694;234;234;209;257;234;209;234;234;234;234;264;234;234;234;234;205;209;754;234;234;234;57;116;233,234;599;599;599;234;234;137;234;233,234;234;234;56;233,234;234;861;861;209;234;440;40;688;234;233,234;209;234;234;234;209;234;234;234;743;434;46;209;234;861;234;234;234;234;399;234;234;234;234;234;440;209;233,234;234;229;46;176;234;207;689,690,691,692,693,694;234;234,689,690,691,692,693,694;234;234;209;234,253,689,690,691,692,693,694;209;209;277;706;234;209;233,234;209;257;689,690,691,692,693,694;234;209;234;209;234;234;137;350;234;133;229;234;253;234;81;277;209;253;256;225;233,234;234;234;234;234;234,689,690,691,692,693,694;233,234;257;133;91;234,689,690,691,692,693,694;234;96;234;234;234;234;234;253,689,690,691,692,693,694;233,234;217;231;40,209;405;234;233,234;257;209;599;234;234;209,221;234;234,689,690,691,692,693,694;233,234;433;233,234;320;231;234,689,690,691,692,693,694;234;234;234,689,690,691,692,693,694;257,689,690,691,692,693,694;209;233,234;234;234;425;231;231;234;231;207;234;234;234,689,690,691,692,693,694;221;143;231;234;234;234,689,690,691,692,693,694;234;234;245;233,234;209;209;234;234;234;526,527;231;234;209;46;234;234;234;217;234;217,433;230,231,253;207;706;234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;231;132;234;234;233,234;234;318;209;209;234;234,689,690,691,692,693,694;861;730,731;704,730,731;234;631;234;257;234;234;234;71;234;433;599;234;234;537;234;207;234;234,689,690,691,692,693,694;234;234,689,690,691,692,693,694;234;234;234;234;861;584;257;229;234;133;234;349;231;234;209;209;234;211;234;234;234;234;234;234;234;823,824;217;234;217;234;234;234,689,690,691,692,693,694;234;331;234;234;731,737,738;234,239,689,690,691,692,693,694;433;219;433;209;234;234;234;234;257;599;217;219;209;209;599;573;234;234;209,288;209;234,689,690,691,692,693,694;861;234,689,690,691,692,693,694;400;217,288;231;234;98,99,100,101;125;234;234;234;689,690,691,692,693,694;233,234;234;234;97;231;234,689,690,691,692,693,694;231;193;257;234;614,615;234;234;231;233;233,234;257;234;234;704,713,730,731,732;209;42;234;234;446;234;209;234;234;209;262;584;31,32;225,226;234;234;234;209;230,258;234;234;211;137;234;217;234;234;234;291,292;234;234;706;209;92;528;233,234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;689,690,691,692,693,694;234,689,690,691,692,693,694;321;234;234;471,472,473;234;234;234;234;40;231;706;599;257;234;233,234;209;234;209,288;209;861;234;233,234;234;233,234;329,499;233,234;845;234;234;137;234;234;233,234;234;234;140;234;257;233,234;97;257;265;207;265;209;257;234;209;229;234;814;234;233,234;233,234;231;230,258;234;234;209;659;234;551;231;234;234;234;624;40;233,234;234;689,690,691,692,693,694;861;234;234,253,689,690,691,692,693,694;233,234;528;233,234;689,690,691,692,693,694;40;234;125;234;234;861;861;174;234;233,234;257;234;209;209;234;632;159,160;234;143;234;234;233,234;233,234;689,690,691,692,693,694;234;234;234;234;40;234;233,234;209;877,878,879;587;234;234;209;137;234;413;829;685;243;234;298;209;482;217;234;231;231;233,234;234,689,690,691,692,693,694;209;234;209;234;234;234;233,234;217;234;234;234;234;234;234;234;277;143;234;209;234;209;251;209;219;140;233,234;233,234;234;217,546,547;546,547;546,547;56;231;234;231,234;243,689,690,691,692,693,694;234;234;234;234;234;234;234;147;234;234;234,689,690,691,692,693,694;371;234,689,690,691,692,693,694;209;209;234;234;209;435;231;40,528;234;234;562;217;229;233,234;234;209;234;207;234,689,690,691,692,693,694;234;697;245,689,690,691,692,693,694;231;234,253;209;122;209;231;234;234;234,689,690,691,692,693,694;234;249;234;234;234;234;730;209;234;234;234,689,690,691,692,693,694;57,217;233,234;689,690,691,692,693,694;258;591;230,258;234,689,690,691,692,693,694;234;234;234,689,690,691,692,693,694;234;383;234;209;234;257;71;209;234;211;234;234;861;861;234;98,99,100,101;233,234;599;234;234;209;233,234;234;40;234;207;40;234;281;209;207;209;209;234;137;234;234;243;444;209;217;234;234;234;233,234;209;234;861;233,234;117,118,119,120;234;40,57,599;234;234;209;689,690,691,692,693,694;234,253;599;234,689,690,691,692,693,694;209,288;234;275;599;234;133;209;209,217,288;528;209;209;599;209;219;730;234;234;234,689,690,691,692,693,694;231;433;234;234;234;234;231;234;234;234;209;233,234;231,234;168,169,170;234;689,690,691,692,693,694;493;861;861;209;233,234;234;209;234;125;231;234;234;209;234;234;137;234;69;234;42;441;487;234;617;205;234;234;234;234;217;433;234;231;217;233,234;233,234;209;233,234;868,-870,-871,-872;231;209;234;233,234;234;234;234;234;234;685;685;209,288;231;301;417,418;288;234;231;207;209;209;209;234;82;234;523;234;233,234;233,234;516,517;234,243;600;597;234;209;209;257;57;233,234;257;233,234;234;758;779;234;234;234;234;234;234;234;861;234;231;234;234;312;234;234;234;666,667;234;599;231;234;234;234;234;234;233,234;234;234;97;234;234;234,689,690,691,692,693,694;233,234;234;234;234;730;234;234;759,760,761;209;399;234;234;234;233,234;233,234;524;103;234;687;664;234;234;234;233,234;46;440;234;209;234;209;217;234;234;56;234;234;861;234;234;442;234;97,132;209;231;234;209;233,234;234;294;233,234;234;131;234;234;137;134,162,163,164;721,722;247;234;234;234;234;234,689,690,691,692,693,694;233,234;234;234,689,690,691,692,693,694;234;234;689,690,691,692,693,694;231;234;234,689,690,691,692,693,694;253;137;234,245,689,690,691,692,693,694;251;5;233,234;234;247,689,690,691,692,693,694;234;234;234;234;209;861;861;234;618;234;233,234;234;231;209;234;234;234;233,234;234;234;234;56;861;234,689,690,691,692,693,694;209;234;234;234;234;234;234;233,234;234;234;234;234;71;40;234;209;511,512;234;234;234;234;234;219;861;234;257;234;234;234;234;233,234;234,689,690,691,692,693,694;257;234;234;234,689,690,691,692,693,694;298;257;234;234;234;234;117,118,119,120;137;234;234;433;599;231;209;234;624;716,717;234;234;234;599;209,288;234;234;234;234;217,221,288;234;609;209;27;207;209;233,234;234;257;207;234;258;234;125;861;251;217;234;234;217;234;234;209;634;318;245;371;234;234;234;233,234;64;288,532;706;97;733;234;209;157,158;290,719,720,734,735,845;234;234;234;207;234;209,288;234;234,689,690,691,692,693,694;231;234;28;234;257;234;209;234;233,234;231;234;70;390;233,234;427;209;97;98,99,100,101;98,99,100,101;209;57;234;234;233,234;234;234;254;234;234;234;234;209;234;234,689,690,691,692,693,694;233,234;209,525;234;257;483;231;133;234;726;234;416;233,234;234;234;209;234;230,258;234;234;18,571;234;234;209;234;234;209;234;234;689,690,691,692,693,694;861;231;233,234;97;205;234;234;234;234;234,689,690,691,692,693,694;234;257;234;257;515;234;234;22,23,24;238,689,690,691,692,693,694;234;231;234,689,690,691,692,693,694;233,234;257;137;702;233,234;835;234;234;234;257;245;77;689,690,691,692,693,694;453;233,234;233,234;124;234;257;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;233,234;137;231;234;234;702;234,689,690,691,692,693,694;233,234;110,111;233,234;234,689,690,691,692,693,694;233,234;861;234;744;233,234;234;234;234;122;234;234;234,689,690,691,692,693,694;233,234;56;234;234;861;234;217;234;209;234;207;137;689,690,691,692,693,694;234;616;207;209;209;234;861;234;856;145,146;234,689,690,691,692,693,694;234,689,690,691,692,693,694;744;234;234;234;209;231;234;534;42;234;40,209;234;366;234;234;234;234,689,690,691,692,693,694;599;231;599;257;209,288;599;233,234;234;251;234;443;217;209,288,891;234;234;234;234;233,234;209;207;861;209;233,234;574;257;234;217;234;234;253;229;234;209;257;234;209;209;234,689,690,691,692,693,694;233,234;137;231;231;251;234;234;234;234;706;234;234;231;234;696,731;233,234;234;234;257;234;234;234;234;125;246,689,690,691,692,693,694;234;234;861;234;234;234;234;27;257;234;234;233,234;209;233,234;689,690,691,692,693,694;207;257;231,784;209;217;234;234;234,251;97;42;133;233,234;233,234;234;234;40;524;234;234,253;234;233,234;234;234;234,689,690,691,692,693,694;234;234;744;234;233,234;234;579;687;209;234;731,739;861;234;233,234;234;234;234;234;234;234;234;137;681;231;606;234;86,87;133;133;209;234;234;207;234;234;234;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234,243;257;234;563;234;234;234;234;233,234;234;234;234;234;234;234;233,234;234;209;234,689,690,691,692,693,694;234,689,690,691,692,693,694;234;861;234;234;215;234;234;730,731,778;209;234;464;233,234;234,689,690,691,692,693,694;234;257;234;234;70;233,234;234;247,689,690,691,692,693,694;234;234;599;231;234;744;125;217,219,335,336;209;137;209;234,689,690,691,692,693,694;217;233,234;234;234;234;27;207;233,234;231;734,735;599;137;433;209;234;209;233,234;231;234;234;233,234;234;234;209;861;234;234;231;207;234;861;234;234;234;233,234;231;233,234;136;234,253,689,690,691,692,693,694;234;234;233,234;209;234;444;234;234;217;76;234;234;233,234;334;231;234;234;234;225;234;234;234;234;759,760,761;145,146;861;234;233,234;433;207;861;234;234;234;234;234;233,234;233,234;234;209;234;234;599;234;234;234;209;234;861;234;234;234;234;234;233,234;861;98,99,100,101;234;599;234;234;454;498;234;209;234;234;217,288;98,99,100,101;234;207;207;861;234;861;253;234;234,689,690,691,692,693,694;253;861;234;234;103;207;234;209;861;234;234;40;209;234;599;629;233,234;209;234,243,689,690,691,692,693,694;744;209;233,234;234;234;234;233,234;427;207;756;685;233,234;233,234;234;234;86,87;234;209;689,690,691,692,693,694;234;234;217;209;234;595;233,234;133;479;257;234;234;209;234;234;233,234;233,234;234;234;233,234;234;234;233,234;861;234;234,689,690,691,692,693,694;209;3,560;207;71;209;234;861;234;234;234;233,234;734,735;168,169,170;234;207;134,162,163,164;716,717;257;234;253;253;599;234;233,234;234;234,254,689,690,691,692,693,694;209;209;231;234;234;234;209;233,234;234;234;234;234;861;689,690,691,692,693,694;234;736;207;209;233,234;233,234;234,689,690,691,692,693,694;209;209,402;233,234;592,593,881,882;136;234;234;233,234;231;233,234;234;225;197;233,234;215;234;234;257;234;233,234;685;861;209;209,288;98,99,100,101;233,234;233,234;234;233,234;234;217;234;234;234;233,234;234;861;861;234;234;234,253,689,690,691,692,693,694;265;234;234;234;207;687;234;234;233,234;305;234;234;233,234;234;234;234;209;234;209;234;71;231;861;234;234;234;233,234;231;234;685;233,234;234,689,690,691,692,693,694;207;233,234;233,234;257;685;234;234;217;209;642;137;233,234;231;234;234;233,234;718;234;233,234;234,253;234;207;234;234;234;233,234;281;234;234;71;234;233,234;861;233,234;231;133;234;234,689,690,691,692,693,694;209;229;861;207;233,234;27;209;251;234,689,690,691,692,693,694;234;133;209;599;209;234;209;231;233,234;211,221;234;231;234,689,690,691,692,693,694;234;234;234,689,690,691,692,693,694;209;623;234;209;385;234;209;133;231;234,253,689,690,691,692,693,694;231;233,234;209;202;209;231;225;209;217";

const $scriptletHostnames$ = /* 5294 */ ["s.to","ak.sv","g3g.*","hqq.*","my.is","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","tv3.lt","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","3si.org","6mt.net","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","g20.net","get2.in","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moco.gg","moin.de","movi.pk","mrt.com","msn.com","mx6.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","15min.lt","250r.net","2embed.*","4game.ru","7mmtv.sx","9gag.com","9xflix.*","a5oc.com","adria.gg","akff.net","alkas.lt","alpin.de","asd.pics","b15u.com","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cnet.com","cybar.to","devlib.*","dlhd.*>>","dooood.*","dotgg.gg","egolf.jp","ehmac.ca","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","feoa.net","file.org","findav.*","fir3.net","flixhq.*","focus.de","frvr.com","fz09.org","gala.com","game8.jp","golog.jp","gr86.org","gsxr.com","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","lejdd.fr","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","mtbr.com","nikke.gg","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","rdr2.org","redis.io","rintor.*","rs25.com","sb9t.com","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","tokon.gg","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wdwnt.jp","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xvip.lat","yabai.si","ytstv.me","zcar.com","zooqle.*","zx6r.com","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","3minx.com","4game.com","4stream.*","5movies.*","600rr.net","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","ats-v.org","ausrc.com","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","bc4x4.com","beeg.porn","bigwarp.*","blkom.com","bmwlt.com","bokep.top","camhub.cc","canoe.com","casi3.xyz","cbrxx.com","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cybar.xyz","d000d.com","d0o0d.com","daddyhd.*","dippy.org","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","expres.cz","fabtcg.gg","fap18.net","faqwiki.*","faselhd.*","fawzy.xyz","fc2db.com","file4go.*","finfang.*","fiuxy2.co","flagle.io","fmovies.*","fooak.com","forsal.pl","ftuapps.*","fx-22.com","garota.cf","gayfor.us","ghior.com","globo.com","glock.pro","gloria.hr","gplinks.*","grapee.jp","gt350.org","gtr.co.uk","gunco.net","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hkpro.com","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","ifish.net","igfap.com","imboc.com","imgur.com","imihu.net","innal.top","inxxx.com","iqiyi.com","iwsti.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kezdo5.hu","kickass.*","kissjav.*","knowt.com","kogap.xyz","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","magma.com","magmix.jp","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","mini2.com","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mr2oc.com","msic.site","mynet.com","nagca.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","ngemu.com","nhlbox.me","nlegs.com","novas.net","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","r32oc.com","raider.io","remaxhd.*","rempo.xyz","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seturl.in","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tccoa.com","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","ttora.com","tutele.sx","ucptt.com","upzur.com","usi32.com","v6z24.com","vidara.so","vidara.to","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vn750.com","vogue.com","voodc.com","vplink.in","vtxoa.com","waezg.xyz","waezm.xyz","watson.de","wdwnt.com","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xdabo.com","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","yjiur.xyz","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1000rr.net","1130cc.com","1919a4.com","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","555fap.com","5ghindi.in","720pflix.*","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","aether.mom","alfabb.com","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","basset.net","bigbtc.win","bmamag.com","boyfuck.me","btvplus.bg","buzter.xyz","cashurl.in","cboard.net","cbr250.com","cbr250.net","cdn256.xyz","cgtips.org","club3g.com","club4g.org","clubxb.com","cnpics.org","corral.net","crictime.*","ctpost.com","cztalk.com","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","ex-500.com","exambd.net","f1stream.*","f650.co.uk","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","fitbook.de","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fz07oc.com","fzmovies.*","g5club.net","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gixxer.com","gmenhq.com","go2gbo.com","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","gunhub.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","i4talk.com","i5talk.com","ib-game.jp","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","jav-coco.*","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","lorcana.gg","love4u.net","ls1gto.com","ls1lt1.com","m.4khd.com","macwelt.de","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","merinfo.se","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","model2.org","morels.com","motor1.com","movies4u.*","movix.blog","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","mytreg.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nonixxx.cc","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nybass.com","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","opelgt.com","otakomu.jp","ovabee.com","paypal.com","pctfenix.*","petbook.de","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prius5.com","prmovies.*","proxybit.*","pxxbay.com","qrixpe.com","r8talk.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","supra6.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thevog.net","tiscali.cz","tlzone.net","tnmusic.in","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidnest.io","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vtcafe.com","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xdtalk.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xrv.org.uk","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","ygozone.gg","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zenless.gg","zpaste.net","zx-10r.net","11xmovies.*","123movies.*","2monkeys.jp","360tuna.com","373news.com","3800pro.com","3dsfree.org","460ford.com","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","adxtalk.com","aipebel.com","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bfclive.com","bg-mania.jp","bi-girl.net","bigshare.io","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bowfile.com","btcbitco.in","caitlin.top","camaros.net","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","civinfo.com","clubrsx.com","clubwrx.net","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","cracked.com","crx7601.com","cuervotv.me","cults3d.com","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","dootalk.com","downvod.com","dropgame.jp","ds2play.com","ds450hq.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","elliott.org","embedpk.net","emuenzen.de","endfield.gg","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnforum.net","fnjplay.xyz","fntimes.com","focusrs.org","focusst.org","fplzone.com","fsharetv.cc","fullymaza.*","g-porno.com","g8board.com","g8forum.com","gamewith.jp","gbatemp.net","get-to.link","gezondnu.nl","ghbrisk.com","gigafile.nu","gm-volt.com","go.zovo.ink","gocast2.com","godlike.com","gold-24.net","goodcar.com","govtech.com","grasoku.com","gtrlife.com","gupload.xyz","haytalk.com","hellcat.org","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","impalas.net","in91vip.win","itopmusic.*","jaginfo.org","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","javx357.com","jawapos.com","jelonka.com","jemsite.com","jetpunk.com","jjang0u.com","jocooks.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","k-bikes.com","k3forum.com","kaliscan.io","karanpc.com","kboards.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","laposte.net","letocard.fr","lexpress.fr","lfpress.com","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","minif56.com","mirrorace.*","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","mx5life.com","mx5nutz.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","ninjah2.org","nodo313.net","nontonx.com","noreast.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onefora.com","onepiece.gg","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","pdfdrive.to","peeplink.in","pelisplus.*","pigeons.biz","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","rekogap.xyz","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","sadisflix.*","safetxt.net","sailnet.com","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharclub.in","sharing.wtf","shavetape.*","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","svrider.com","syosetu.com","t-online.de","tabooflix.*","talkesg.com","tbsradio.jp","teachoo.com","techbook.de","techguy.org","teltarif.de","teryxhq.com","thehour.com","thektog.org","thenewx.org","thothub.lol","tidymom.net","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","trx250r.net","trx450r.org","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tundra3.com","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","unixmen.com","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","vague.style","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vtxcafe.com","vwforum.com","vwscout.org","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","x7forum.com","xdforum.com","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","xpshort.com","yesmovies.*","youtube.com","yumeost.net","yxztalk.com","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","1911talk.com","3dshoots.com","46matome.net","4archive.org","4btswaps.com","50states.com","68forums.com","700rifle.com","718forum.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8thcivic.com","992forum.com","aamulehti.fi","acrforum.com","adricami.com","akinator.com","alexsports.*","alexsportz.*","allcoast.com","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","audiforum.us","autoc-one.jp","avseesee.com","avsforum.com","babylinks.in","bamgosu.site","bapetalk.com","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepindoh.*","bokepnya.com","boltbeat.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","bz-berlin.de","bzforums.com","capoplay.net","carparts.com","casthill.net","catcrave.com","catfish1.com","catforum.com","cesoirtv.com","chaos2ch.com","chatango.com","cheftalk.com","chopchat.com","choralia.net","chrforums.uk","cima4u.forum","clickapi.net","cobaltss.com","coingraph.us","cookierun.gg","crazyblog.in","cricstream.*","cricwatch.io","crzforum.com","cuevana3.fan","cx30talk.com","cx3forum.com","d-series.org","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","diethood.com","divicast.com","divxtotal1.*","dizikral.com","dogforum.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","egyanime.com","embedtv.best","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","expertvn.com","f6cforum.com","factable.com","falatron.com","famivita.com","fansided.com","fapptime.com","feed2all.org","fetchpik.com","fiestast.net","fiestast.org","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","footybite.to","fordtough.ca","forexrw7.com","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gcaptain.com","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gsxs1000.org","gtoforum.com","gulflive.com","gvforums.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hentaitv.fun","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","hrvforum.com","huntress.com","hvacsite.com","iambaker.net","ibelieve.com","ibsgroup.org","ihdstreams.*","imagefap.com","impreza5.com","impreza6.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","ixforums.com","jablickar.cz","jav-noni.org","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jkowners.com","jobsheel.com","jp-films.com","k5owners.com","kasiporn.com","kazefuri.net","kfx450hq.com","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","klrforum.com","krxforum.com","ktmatvhq.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","lawnsite.com","layitlow.com","legacygt.org","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","liddread.com","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","lostsword.gg","ltr450hq.com","luluvdoo.com","lxforums.com","m14forum.com","macworld.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masscops.com","masslive.com","matacoco.com","mbeqclub.com","mealcold.com","mediaite.com","mega-mkv.com","mg-rover.org","mhdtvworld.*","migweb.co.uk","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkcforum.com","mkvcinemas.*","mkzforum.com","mmaforum.com","mmamania.com","mmsbee27.com","mmsbee42.com","mmsbee47.com","modocine.com","modrinth.com","modsbase.com","modsfire.com","momsdish.com","mooonten.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","mvagusta.net","myaudiq5.com","myflixerz.to","mykitsch.com","mytiguan.com","nanolinks.in","nbadraft.net","ncangler.com","neodrive.xyz","neowners.com","netatama.net","newatlas.com","newninja.com","newsyou.info","neymartv.net","niketalk.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nugglove.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","paw-talk.net","pennlive.com","photopea.com","pigforum.com","planet-9.com","playertv.net","plowsite.com","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","prcforum.com","pressian.com","programme.tv","pubfilmz.com","publicearn.*","pwcforum.com","qyiforum.com","r1-forum.com","r1200gs.info","r2forums.com","r6-forum.com","r7forums.com","r9riders.com","rainmail.xyz","ramrebel.org","rapelust.com","ratforum.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","riftbound.gg","rlxforum.com","ronaldo7.pro","roporno.info","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","rxforums.com","rxtuners.com","ryaktive.com","rzforums.com","s10forum.com","saablink.net","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","shrtslug.biz","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","snowbreak.gg","sodomojo.com","sonixgvn.net","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","ssforums.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","stylebook.de","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","technons.com","teleclub.xyz","teluguflix.*","terra.com.br","texas4x4.org","thehindu.com","themezon.net","theverge.com","thurrott.com","toonhub4u.me","topdrama.net","torrage.info","torrents.vip","tradtalk.com","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","turbovid.vip","tusfiles.com","tutlehd4.com","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","twospoke.com","uk-audis.net","uk-mkivs.net","ultraten.net","umamusume.gg","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","veloster.org","vertigis.com","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","vnjpclub.com","volokit2.com","vpcxz19p.xyz","vwidtalk.com","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","whatgame.xyz","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xcrforum.com","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xitongku.com","xlrforum.com","xmowners.com","xopenload.me","xopenload.pw","xpornium.net","xtglinks.com","xtratime.org","xxxstream.me","youboxtv.com","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zrvforum.com","zvision.link","zxforums.com","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","124spider.org","1911forum.com","1bitspace.com","200forums.com","247sports.com","350z-tech.com","355nation.net","4c-forums.com","4horlover.com","4kwebplay.xyz","4xeforums.com","560pmovie.com","680thefan.com","6hiidude.gold","6thgenram.com","7fractals.icu","7vibelife.com","abc17news.com","abhijith.page","aceforums.net","actusports.eu","adblocktape.*","addapinch.com","advertape.net","aeblender.com","aiimgvlog.fun","alexsportss.*","alfaowner.com","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atchuseek.com","atv-forum.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","b15sentra.net","bacasitus.com","badmouth1.com","bakedbree.com","bcaquaria.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","benzforum.com","benzworld.org","bestfonts.pro","bethcakes.com","bettafish.com","bighentai.org","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bluetraxx.com","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buelltalk.com","buffstreams.*","c.newsnow.com","c10trucks.com","caferacer.net","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","chanto.jp.net","cheater.ninja","chevelles.com","chevybolt.org","chumplady.com","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","club700xx.com","clubtitan.org","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","coltforum.com","columbian.com","concomber.com","coolcast2.com","corsa-c.co.uk","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","currytrail.in","cx70forum.com","cx90forum.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","dayspedia.com","depvailon.com","dfwstangs.net","dizikral1.pro","dizikral2.pro","dodgetalk.com","dogforums.com","dooodster.com","downfile.site","dphunters.mom","dragonball.gg","dragontea.ink","drivenime.com","e2link.link>>","ebonybird.com","egitim.net.tr","elantraxd.com","eldingweb.com","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","esladvice.com","ethearmed.com","etoland.co.kr","evotuners.net","ex90forum.com","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fjcforums.com","fjrowners.com","flixhouse.com","flyfaucet.com","flyfishbc.com","fmachines.com","focusrsoc.com","focusstoc.com","fordgt500.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","geoguessr.com","gifu-np.co.jp","giornalone.it","glaowners.com","glcforums.com","globalrph.com","glocktalk.com","golfforum.com","gopitbull.com","governing.com","gputrends.net","grantorrent.*","gromforum.com","gunboards.com","gundamlog.com","gunforums.net","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","hobbytalk.com","hondagrom.net","honkailab.com","hornylips.com","hoyoverse.com","huntingpa.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","ikonforum.com","ilxforums.com","indiewire.com","inkvoyage.xyz","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itmedia.co.jp","itunesfre.com","javsunday.com","jeepforum.com","jimdofree.com","jisakuhibi.jp","jkdamours.com","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","k900forum.com","kahrforum.com","kamababa.desi","kckingdom.com","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","krepsinis.net","krussdomi.com","ktmforums.com","kurashiru.com","lek-manga.net","lifehacker.jp","likemanga.ink","listar-mc.net","liteshort.com","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lotustalk.com","lowellsun.com","m.inven.co.kr","macheclub.com","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","marvel.church","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","metin2hub.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","mothering.com","motor-talk.de","motorgeek.com","moutogami.com","moviekhhd.biz","moviepilot.de","moviesleech.*","moviesverse.*","movieswbb.com","moviezwaphd.*","mp-pistol.com","mp4upload.com","multicanais.*","musescore.com","mx30forum.com","myfastgti.com","myflixertv.to","mygolfspy.com","myhomebook.de","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newbeetle.org","newcelica.org","newcougar.org","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","otonanswer.jp","ottawasun.com","overclock.net","ozlosleep.com","pagalworld.cc","painttalk.com","pandamovie.in","patrol4x4.com","pc-builds.com","pearforum.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","picdollar.com","pillowcase.su","piloteers.org","pinkueiga.net","pirate4x4.com","pirateiro.com","pitchfork.com","pkbiosfix.com","planet4x4.net","pnwriders.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","ptcgpocket.gg","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","r125forum.com","r3-forums.com","ramforumz.com","rarethief.com","raskakcija.lt","rav4world.com","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rhinotalk.net","riggosrag.com","rnbxclusive.*","roadglide.org","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","rswarrior.com","rugertalk.com","rumbunter.com","rzrforums.net","s3embtaku.pro","saabscene.com","saboroso.blog","sarforums.com","savefiles.com","scatkings.com","set.seturl.in","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","shorttrick.in","silverblog.tv","silverpic.com","simana.online","sinemalar.com","sinsitio.site","skymovieshd.*","slotforum.com","smartworld.it","snackfora.com","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","sparktalk.com","speedporn.net","speedwake.com","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","sr20forum.com","srtforums.com","stackmint.ink","starstyle.com","steyrclub.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","sv-portal.com","swissotel.com","t-goforum.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","tennspeed.net","thekitchn.com","thelayoff.com","themgzr.co.uk","thepoke.co.uk","thothub.today","tidalfish.com","tiermaker.com","timescall.com","titantalk.com","tlnovelas.net","tlxforums.com","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","travelbook.de","traxforum.com","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","trxforums.com","ttforum.co.uk","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","ukcorsa-d.com","umamigirl.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","velostern.com","vibestreams.*","vid-guard.com","vidspeeds.com","vipstand.pm>>","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","volkszone.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","vweosclub.com","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","www.iqiyi.com","xc40forum.com","xcamcovid.com","xfforum.co.uk","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zdxowners.com","zorroplay.xyz","zotyezone.com","zx4rforum.com","123easy4me.com","123movieshub.*","300cforums.com","300cforumz.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","7thmustang.com","9to5google.com","a1-forum.co.uk","actu.orange.fr","actugaming.net","acuraworld.com","aerotrader.com","afeelachat.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcorsa.co.uk","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","ar15forums.com","arcticchat.com","armslocker.com","artoffocas.com","ashemaletube.*","astro-seek.com","at4xowners.com","atchfreeks.com","atvtorture.com","azbasszone.com","balkanteka.net","bamahammer.com","bersaforum.com","bgmiconfig.ink","bhugolinfo.com","bimmerfest.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","bmw-driver.net","bmwevforum.com","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buceesfans.com","buchstaben.com","burgmanusa.com","calgarysun.com","camarozone.com","camberlion.com","can-amtalk.com","carrnissan.com","cheatsheet.com","choco0202.work","cine-calidad.*","cl500forum.com","clashdaily.com","clicknupload.*","cloudvideotv.*","clubarmada.com","clubsearay.com","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cretaforum.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","ctsvowners.com","cuevana3hd.com","cumception.com","curseforge.com","cx500forum.com","cx50forums.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","dealsforum.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dodge-dart.org","dodgersway.com","dofusports.xyz","dolldivine.com","dpselfhelp.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","epaceforum.com","erayforums.com","esportbike.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","evoxforums.com","expatforum.com","extreme-down.*","f-typeclub.com","f150forumz.com","f800riders.org","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","fiestastoc.com","filmizleplus.*","filmy4waps.org","fireblades.org","fishforums.com","fiskerbuzz.com","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","foodtechnos.in","fordescape.org","fordforums.com","fordranger.net","forex-trnd.com","formyanime.com","forteturbo.org","forumchat.club","foxyfolksy.com","fpaceforum.com","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","furyforums.com","fz-10forum.com","g310rforum.com","galleryxh.site","gamefishin.com","gamepcfull.com","gameshop4u.com","gamingfora.com","gayforfans.com","gaypornhot.com","gearpatrol.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","glockforum.com","glockforum.net","gmfullsize.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gr-yaris.co.uk","gravureblog.tv","gtaaquaria.com","guitars101.com","gujjukhabar.in","gunandgame.com","gyanitheme.com","hauntforum.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hinoforums.com","hondatwins.net","horseforum.com","hotgranny.live","hotrodders.com","hotukdeals.com","hummerchat.com","hwnaturkya.com","imgtraffic.com","indiatimes.com","infinitifx.org","infogenyus.top","inshorturl.com","insidehook.com","ioniqforum.com","ios.codevn.net","iplayerhls.com","iplocation.net","isabeleats.com","isekaitube.com","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jdfanatics.com","jeepgarage.org","jizzbunker.com","joemonster.org","joyousplay.xyz","jpaceforum.com","jpopsingles.eu","jukeforums.com","jyoseisama.com","k1600forum.com","kakarotfoot.ru","kanyetothe.com","katoikos.world","kawiforums.com","kia-forums.com","kickassanime.*","kijolariat.net","kimbertalk.com","kompasiana.com","ktmforum.co.uk","leaderpost.com","leahingram.com","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","low-riders.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","m109riders.com","macanforum.com","mactechnews.de","mahajobwala.in","mahitimanch.in","majestyusa.com","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","manutdtalk.com","marcialhub.xyz","mastkhabre.com","mazda6club.com","mazdaworld.org","megapastes.com","meusanimes.net","microskiff.com","minitorque.com","mkv-pastes.com","monacomatin.mc","mondeostoc.com","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mtc3.jobsvb.in","mumuplayer.com","mundowuxia.com","musketfire.com","my.irancell.ir","myeasymusic.ir","mymbonline.com","nana-press.com","naszemiasto.pl","newmovierulz.*","newnissanz.com","news-buzz1.com","news30over.com","newscionxb.com","newtiburon.com","nhregister.com","ninernoise.com","niocarclub.com","nissanclub.com","nookgaming.com","nowinstock.net","nv200forum.com","nyfirearms.com","o2tvseries.com","ocregister.com","ohsheglows.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","outbackers.com","pandamovies.me","pandamovies.pw","pandaspor.live","pantrymama.com","paste-drop.com","pastemytxt.com","pathofexile.gg","pelando.com.br","pencarian.link","petitrobert.fr","pinchofyum.com","pipandebby.com","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playingmtg.com","playtube.co.za","populist.press","pornhd720p.com","pornincest.net","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","priusforum.com","projeihale.com","proxyninja.org","psychobike.com","q2forums.co.uk","qiqitvx84.shop","quest4play.xyz","rabbitdogs.net","ramblinfan.com","ramevforum.com","rc350forum.com","rc51forums.com","record-bee.com","reisefrage.net","remixsearch.es","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rugerforum.net","runeriders.com","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","section215.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shadowverse.gg","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","sigarms556.com","singjupost.com","sizecharts.net","skidrowcpy.com","slatedroid.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","solanforum.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speedzilla.com","speisekarte.de","spieletipps.de","sportbikes.net","sportsurge.net","spyderchat.com","spydertalk.com","srt10forum.com","srt4mation.com","ssrfanatic.com","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","stripehype.com","studyfinds.org","superhonda.com","supexfeeds.com","swatchseries.*","swedespeed.com","swipebreed.net","swordalada.org","tamilprinthd.*","taosforums.com","tarokforum.com","taurusclub.com","tbssowners.com","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thefitchen.com","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","tonaletalk.com","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","tournguide.com","toyokeizai.net","tracktheta.com","trafficnews.jp","trannyteca.com","trentonian.com","triumph675.net","triumphrat.net","troyrecord.com","tundratalk.net","turbocloud.xyz","turbododge.com","tvs-widget.com","tvseries.video","tw200forum.com","twincities.com","uberpeople.net","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vagdrivers.net","vahantoday.com","videocelts.com","vikistream.com","viperalley.com","visifilmai.org","viveseries.com","volvoforum.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wellplated.com","whodatdish.com","wielerflits.be","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xc100forum.com","xclusivejams.*","xeforums.co.uk","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yfzcentral.com","yourcobalt.com","yourupload.com","z1000forum.com","z125owners.com","zeroupload.com","zkillboard.com","zx25rforum.com","1911addicts.com","240sxforums.com","4activetalk.com","51bonusrummy.in","7thgenhonda.com","899panigale.org","959panigale.net","9thgencivic.com","a-z-animals.com","acadiaforum.net","accordxclub.com","acedarspoon.com","acemanforum.com","adrinolinks.com","adz7short.space","agoneerfans.com","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","amarokforum.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","archerytalk.com","areaconnect.com","ariyaforums.com","arstechnica.com","artistforum.com","astrosafari.com","audi-forums.com","audif1forum.com","audiotools.blog","audioz.download","audiq3forum.com","averiecooks.com","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxerforums.com","boxingforum.com","boxingstream.me","brilian-news.id","brutusforum.com","budgetbytes.com","buffstreams.app","bussyhunter.com","c.newsnow.co.uk","cafedelites.com","can-amforum.com","cattleforum.com","cbr300forum.com","celicasupra.com","cempakajaya.com","chevyblazer.org","chollometro.com","cigarforums.net","cizgivedizi.com","classic-jdm.com","clubtouareg.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","crizyman.online","crownforums.com","cryptoearns.com","cryptofun.space","ct200hforum.com","ctx700forum.com","cubbiescrib.com","customtacos.com","cycleforums.com","cycletrader.com","dailybreeze.com","dailycamera.com","dailyknicks.com","databazeknih.cz","dawindycity.com","dendroboard.com","diariovasco.com","dieseljeeps.com","dieselplace.com","digimonzone.com","digiztechno.com","diychatroom.com","dizipal1536.com","dizipal1537.com","dizipal1538.com","dizipal1539.com","dizipal1540.com","dizipal1541.com","dizipal1542.com","dizipal1543.com","dizipal1544.com","dizipal1545.com","dizipal1546.com","dizipal1547.com","dizipal1548.com","dizipal1549.com","dizipal1550.com","dizipal1551.com","dizipal1552.com","dizipal1553.com","dizipal1554.com","dizipal1555.com","dizipal1556.com","dizipal1557.com","dizipal1558.com","dizipal1559.com","dizipal1560.com","dizipal1561.com","dizipal1562.com","dizipal1563.com","dizipal1564.com","dizipal1565.com","dizipal1566.com","dizipal1567.com","dizipal1568.com","dizipal1569.com","dizipal1570.com","dizipal1571.com","dizipal1572.com","dizipal1573.com","dizipal1574.com","dizipal1575.com","dizipal1576.com","dizipal1577.com","dizipal1578.com","dizipal1579.com","dizipal1580.com","dizipal1581.com","dizipal1582.com","dizipal1583.com","dizipal1584.com","dizipal1585.com","dizipal1586.com","dizipal1587.com","dizipal1588.com","dizipal1589.com","dizipal1590.com","dizipal1591.com","dizipal1592.com","dizipal1593.com","dizipal1594.com","dizipal1595.com","dizipal1596.com","dizipal1597.com","dizipal1598.com","dizipal1599.com","dizipal1600.com","dl-protect.link","doctormalay.com","dodge-nitro.com","dogfoodchat.com","donnerwetter.de","dopomininfo.com","driveaccord.net","drywalltalk.com","e-tronforum.com","e46fanatics.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","edmontonsun.com","egoallstars.com","elamigosweb.com","empire-stream.*","escape-city.com","esportivos.site","exactpay.online","expedition33.gg","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","ferrarilife.com","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fizzlefakten.de","fmradiofree.com","footyhunter.lol","forteforums.com","framedcooks.com","freeairpump.com","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gatorforums.net","gazetaprawna.pl","gen3insight.com","gentosha-go.com","geogridgame.com","gewinnspiele.tv","ghibliforum.com","girlscanner.org","girlsreport.net","gmtruckclub.com","godairyfree.org","gofile.download","goproforums.com","gowatchseries.*","gratispaste.com","greatandhra.com","gunnerforum.com","gut-erklaert.de","hamrojaagir.com","havocxforum.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hondashadow.net","hotcopper.co.nz","hummusapien.com","i-paceforum.com","idoitmyself.xyz","ilovetoplay.xyz","infinitiq30.org","infinitiq50.org","infinitiq60.org","infosgj.free.fr","instabiosai.com","integratalk.com","istreameast.app","jaguarforum.com","japangaysex.com","jaysjournal.com","jeepevforum.com","jeeppatriot.com","jettajunkie.com","juliasalbum.com","jumpsokuhou.com","kandiforums.com","kawieriders.com","keltecforum.com","khatrimazaful.*","kiaevforums.com","kickrunners.com","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","krakenfiles.com","kurashinista.jp","lakestclair.net","lamarledger.com","ldoceonline.com","lexusfforum.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lombardiave.com","lordchannel.com","lucid-forum.com","lugerforums.com","lulustream.live","lumberjocks.com","luxury4play.com","lynkcoforum.com","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","marlinforum.com","marvelrivals.gg","matomeblade.com","matomelotte.com","mclarenlife.com","mediacast.click","medstudentz.com","meganesport.net","mentalfloss.com","mercedescla.org","mercurynews.com","metrisforum.com","miamiherald.com","minievforum.com","miniwebtool.com","mmsmasala27.com","mobilestalk.net","modernhoney.com","modistreams.org","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","mtc1.jobtkz.com","myanimelist.net","nativesurge.net","naughtypiss.com","ncgunowners.com","news-herald.com","news.zerkalo.io","nflspinzone.com","niice-woker.com","ninetowners.com","nitroforumz.com","noindexscan.com","nomnompaleo.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nutmegnanny.com","nuxhallas.click","nydailynews.com","oceanforums.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","passatworld.com","paviseforum.com","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","petforums.co.uk","phillyvoice.com","phongroblox.com","picsxxxporn.com","pierandsurf.com","pilotonline.com","piratehaven.xyz","pisshamster.com","pistolsmith.com","pistolworld.com","planetminis.com","plantedtank.net","poodleforum.com","popdaily.com.tw","powergam.online","powerstroke.org","premiumporn.org","priusonline.com","projectfreetv.*","prowlertalk.net","punishworld.com","qatarstreams.me","r1200rforum.com","rallyforums.com","rangerovers.net","rank1-media.com","raptorforum.com","readbitcoin.org","readhunters.xyz","recon-forum.com","regalforums.com","remixsearch.net","reportera.co.kr","resizer.myct.jp","rhinoforums.net","riderforums.com","risingapple.com","rnbastreams.com","robloxforum.com","rodsnsods.co.uk","roofingtalk.com","rugbystreams.me","rustorkacom.lib","saabcentral.com","saikyo-jump.com","sampledrive.org","sat-sharing.com","saxontheweb.net","scr950forum.com","seadoospark.org","seir-sanduk.com","seltosforum.com","sfchronicle.com","shadowrangers.*","shemalegape.net","shortxlinks.com","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","skyroadster.com","slapthesign.com","smokinvette.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","stdrivers.co.uk","streamnoads.com","stripers247.com","stylecaster.com","sudokutable.com","suicidepics.com","supraforums.com","sweetie-fox.com","taikoboards.com","talkbudgies.com","talkparrots.com","tapeantiads.com","tapeblocker.com","taurusarmed.net","tennisforum.com","tennisstreams.*","teryxforums.net","the5krunner.com","thebassbarn.com","theblueclit.com","thebullspen.com","thegoatspot.net","thejetpress.com","themoviesflix.*","theporndude.com","theprovince.com","thereeftank.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","trgoals1526.xyz","trgoals1527.xyz","trgoals1528.xyz","trgoals1529.xyz","trgoals1530.xyz","trgoals1531.xyz","trgoals1532.xyz","trgoals1533.xyz","trgoals1534.xyz","trgoals1535.xyz","trgoals1536.xyz","trgoals1537.xyz","trgoals1538.xyz","trgoals1539.xyz","trgoals1540.xyz","trgoals1541.xyz","trgoals1542.xyz","trgoals1543.xyz","truthsocial.com","tuktukcinma.com","turbobuicks.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","uk-muscle.co.uk","ukaudiomart.com","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","v-twinforum.com","v8sleuth.com.au","valhallas.click","vantasforum.com","vik1ngfile.site","vikingforum.net","vikingforum.org","vinfasttalk.com","vipsister23.com","viralharami.com","volconforum.com","vwt4forum.co.uk","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wericmartin.com","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","windsorstar.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","yamahaforum.com","yanksgoyard.com","yoursciontc.com","yrtourguide.com","zakuzaku911.com","2coolfishing.com","3dprinterful.com","4thgentacoma.com","790dukeforum.com","aclassclub.co.uk","acouplecooks.com","acura-legend.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","aheadofthyme.com","airflowforum.com","altherforums.com","altimaforums.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","archeryaddix.com","arteonforums.com","ascentforums.com","asyaanimeleri.pw","backfirstwo.site","badgerowners.com","bananamovies.org","barbarabakes.com","bcsportbikes.com","benelliforum.com","bestgirlsexy.com","bestpornflix.com","bigblockdart.com","blackandteal.com","blog.esuteru.com","blog.livedoor.jp","blowgunforum.com","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","brutecentral.com","buffalowdown.com","buickevforum.com","buzzfeednews.com","c-classforum.com","cadenzaforum.com","canalesportivo.*","caneswarning.com","cbr500riders.com","charexempire.com","cherokeesrt8.com","cherokeetalk.com","cheyennechat.com","chickenforum.com","chinese-pics.com","choosingchia.com","civic11forum.com","clarityforum.com","cleaningtalk.com","clever-tanken.de","clickndownload.*","clickorlando.com","clubfrontier.org","clubroadster.net","coloradofans.com","coloredmanga.com","comidacaseira.me","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","cricketforum.com","crxcommunity.com","cryptofactss.com","ctx1300forum.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cybercityhelp.in","cyclingabout.com","daciaforum.co.uk","dailyfreeman.com","dailytribune.com","dailyuploads.net","dakotaforumz.com","darknessporn.com","dartsstreams.com","dataunlocker.com","desertxforum.com","destiny2zone.com","detikkebumen.com","diavel-forum.com","diecastcrazy.com","dieselforums.com","directupload.net","dobermantalk.com","dodgedurango.net","dodgeevforum.com","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","duramaxforum.com","eastbaytimes.com","ebikerforums.com","echelonforum.com","elantraforum.com","elantrasport.com","empire-streamz.*","enclaveforum.net","envistaforum.com","evoqueforums.net","explorertalk.com","f150ecoboost.net","familyporner.com","favoyeurtube.net","feedmephoebe.com","ferrari-talk.com","filecatchers.com","filespayouts.com","financacerta.com","firearmstalk.com","flagandcross.com","flatpanelshd.com","flyfishing.co.uk","football-2ch.com","fordexplorer.org","fordstnation.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","g6ownersclub.com","gamesrepacks.com","garminrumors.com","gaydelicious.com","gbmwolverine.com","genialetricks.de","giuliaforums.com","giurgiuveanul.ro","gl1800riders.com","gledajcrtace.xyz","gmdietforums.com","gminsidenews.com","godstoryinfo.com","gourmetscans.net","grecaleforum.com","gsm-solution.com","hallofseries.com","handgunforum.net","happyinshape.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","hechosfizzle.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hondacb1000r.com","hondaevforum.com","hondaforeman.com","hornetowners.com","hotcopper.com.au","howsweeteats.com","huskercorner.com","husseinezzat.com","idmextension.xyz","ikarishintou.com","ildcatforums.net","imagereviser.com","impalaforums.com","infinitiqx30.org","infinitiqx50.org","infinitiqx60.org","infinitiqx80.org","infinityfree.com","inspiralized.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","jukeforums.co.uk","julieblanner.com","justblogbaby.com","justfullporn.net","kakarotfoot.ru>>","kawasakiz650.com","ketolifetalk.com","khatrimazafull.*","kianiroforum.com","kijolifehack.com","kimscravings.com","kingstreamz.site","kitchendivas.com","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kodiakowners.com","ktm1090forum.net","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","laurafuentes.com","lexusevforum.com","lexusnxforum.com","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","magnetoforum.com","magnumforumz.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","marlinowners.com","maseratilife.com","mathplayzone.com","maverickchat.com","mazda3forums.com","meconomynews.com","medievalists.net","megapornpics.com","millionscast.com","moddedraptor.com","moderncamaro.com","modularfords.com","moneycontrol.com","mostlymorgan.com","mountainbuzz.com","moviesmod.com.pl","mrproblogger.com","mudinmyblood.net","mullenowners.com","mybikeforums.com","mydownloadtube.*","mylargescale.com","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newf150forum.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nissanforums.com","nissanmurano.org","nocrumbsleft.net","nordenforums.com","o2tvseries4u.com","ojearnovelas.com","onionstream.live","optimaforums.com","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","perfectunion.com","phinphanatic.com","piranha-fury.com","plainchicken.com","planetisuzoo.com","player.buffed.de","plumbingzone.com","powerover.online","powerover.site>>","predatortalk.com","preludepower.com","pricearchive.org","programme-tv.net","protrumpnews.com","pursuitforum.com","puzzlegarage.com","r6messagenet.com","raetsel-hilfe.de","rangerforums.net","ranglerboard.com","ranglerforum.com","raptorforumz.com","readingeagle.com","rebajagratis.com","redbirdrants.com","repack-games.com","rinconriders.com","ripexbooster.xyz","risttwisters.com","rocketnews24.com","rollingstone.com","routerforums.com","rsoccerlink.site","rule34hentai.net","s1000rrforum.com","saradahentai.com","scioniaforum.com","scionimforum.com","seat-forum.co.uk","segwayforums.com","serial1forum.com","shercoforums.com","shotgunworld.com","shutterstock.com","skidrowcodex.net","skincaretalk.com","smartermuver.com","smartevforum.com","sniperforums.com","solitairehut.com","sonataforums.com","south-park-tv.fr","soxprospects.com","specialstage.com","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","starlinktalk.com","statecollege.com","stellanspice.com","stelvioforum.com","stillcurtain.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","stromerforum.com","stromtrooper.com","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","team-integra.net","techkhulasha.com","telcoinfo.online","terrainforum.com","terrainforum.net","teslabottalk.com","text-compare.com","thebakermama.com","thebassholes.com","theboxotruth.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","theflowspace.com","thegadgetking.in","thelandryhat.com","thelawnforum.com","thelinuxcode.com","thelupussite.com","thelureforum.com","thenerdstash.com","thenewcamera.com","thescranline.com","thevikingage.com","thewatchsite.com","titanxdforum.com","tomshardware.com","topvideosgay.com","total-sportek.to","toyotanation.com","tractorforum.com","trainerscity.com","trapshooters.com","trendytalker.com","trocforums.co.uk","tucson-forum.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","usmle-forums.com","utahwildlife.net","v8bikeriders.com","valeriabelen.com","vancouversun.com","veggieboards.com","venuedrivers.com","veryfreeporn.com","vichitrainfo.com","vizslaforums.com","voiranime.stream","volvo-forums.com","volvoevforum.com","volvov40club.com","voyeurfrance.net","vulcanforums.com","vwatlasforum.com","watchfreexxx.net","watchmmafull.com","wbschemenews.com","weblivehdplay.ru","whipperberry.com","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","x-trail-uk.co.uk","xclassforums.com","xhamsterporno.mx","xpengevforum.com","xpowerforums.com","xsr700forums.com","yamaha-forum.net","yifysubtitles.ch","yourcountdown.to","youwatchporn.com","ziggogratis.site","12thmanrising.com","2-seriesforum.com","365cincinnati.com","4chanarchives.com","abarthforum.co.uk","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","amandascookin.com","amrapideforum.com","amybakesbread.com","andhrafriends.com","andrewzimmern.com","androidpolice.com","applecarforum.com","aquariumforum.com","armypowerinfo.com","aronaforums.co.uk","atecaforums.co.uk","atlasandboots.com","atvdragracers.com","aussieexotics.com","auto-crypto.click","avengerforumz.com","badgerofhonor.com","bakedbyrachel.com","basketballbuzz.ca","beargoggleson.com","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","beyondtheflag.com","blazerevforum.com","blizzboygames.net","blog.tangwudi.com","broncoevforum.com","buildtheearth.net","bulldogbreeds.com","butterbeready.com","cadryskitchen.com","cagesideseats.com","calgaryherald.com","caliberforums.com","caliberforumz.com","camchickscaps.com","carensureplan.com","cayenneforums.com","cdn.tiesraides.lv","chaptercheats.com","chargerforums.com","chargerforumz.com","cichlid-forum.com","cinemastervip.com","claplivehdplay.ru","closetcooking.com","clubcrosstrek.com","cocokara-next.com","coloradodaily.com","commandertalk.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","crackstreamer.net","crvownersclub.com","cryptednews.space","customdakotas.com","custommagnums.com","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","dawnofthedawg.com","daytonaowners.com","deepgoretube.site","deutschepornos.me","diabetesforum.com","ditjesendatjes.nl","dl.apkmoddone.com","dodgeintrepid.net","drinkspartner.com","ducatimonster.org","durangoforumz.com","eatingonadime.com","eatlittlebird.com","economictimes.com","ecosportforum.com","envisionforum.com","epaceforums.co.uk","etransitforum.com","euro2024direct.ru","everestowners.com","evolvingtable.com","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","fiat500owners.com","fiestafaction.com","filmesonlinex.org","fitnesssguide.com","focusfanatics.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","fpaceforums.co.uk","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","frugalvillage.com","funtasticlife.com","fwmadebycarli.com","galonamission.com","gamejksokuhou.com","gamesmountain.com","gasserhotrods.com","gaypornhdfree.com","genesisforums.com","genesisforums.org","geocaching101.com","gimmesomeoven.com","globalstreams.xyz","goldwingfacts.com","gourbanhiking.com","greatlakes4x4.com","grizzlyowners.com","grizzlyriders.com","guitarscanada.com","havaneseforum.com","hdfilmcehennemi.*","headlinerpost.com","hemitruckclub.com","hentaitube.online","heresy-online.net","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","idownloadblog.com","iheartnaptime.net","impalassforum.com","infinityscans.net","infinityscans.org","infinityscans.xyz","innateblogger.com","intouchweekly.com","ipaceforums.co.uk","iphoneincanada.ca","islamicfinder.org","jaguarxeforum.com","jaysbrickblog.com","jeepcommander.com","jeeptrackhawk.org","jockeyjournal.com","justlabradors.com","kawasakiworld.com","kbconlinegame.com","kfx450central.com","kiasoulforums.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","laughingsquid.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lexusrcowners.com","lexusrxowners.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","mamainastitch.com","marineinsight.com","mdzsmutpcvykb.net","mercurycougar.net","miaminewtimes.com","midhudsonnews.com","midwest-horse.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","mtc4.igimsopd.com","multicanaistv.com","musicfeeds.com.au","myjeepcompass.com","myturbodiesel.com","nationaltoday.com","newtahoeyukon.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","nissan-navara.net","nodakoutdoors.com","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","ohiosportsman.com","okusama-kijyo.com","olympicstreams.co","onceuponachef.com","ondemandkorea.com","ontariofarmer.com","opensubtitles.org","ottawacitizen.com","outdoormatome.com","palisadeforum.com","paracordforum.com","paranormal-ch.com","pavementsucks.com","pcgeeks-games.com","peugeotforums.com","pinayscandalz.com","pioneerforums.com","pistonpowered.com","player.pcgames.de","plugintorrent.com","polarisriders.com","pornoenspanish.es","preludeonline.com","prepperforums.net","pressandguide.com","presstelegram.com","prowlerforums.net","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","ram1500diesel.com","ramrebelforum.com","read-onepiece.net","recipetineats.com","redlineforums.com","reidoscanais.life","renegadeforum.com","republicbrief.com","restlessouter.net","restlingforum.com","restmacizle23.cfd","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","santafeforums.com","savemoneyinfo.com","scirocconet.co.uk","seatroutforum.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","shootersforum.com","shootingworld.com","shotgunforums.com","shugarysweets.com","sideplusleaks.net","sierraevforum.com","siliconvalley.com","simplywhisked.com","sitm.al3rbygo.com","skylineowners.com","soccerworldcup.me","solsticeforum.com","solterraforum.com","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","steamidfinder.com","steamseries88.com","stellarthread.com","stingerforums.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","subaruxvforum.com","sumaburayasan.com","superherohype.com","supertipzz.online","suzuki-forums.com","suzuki-forums.net","suzukicentral.com","t-shirtforums.com","tablelifeblog.com","talkclassical.com","talonsxsforum.com","taycanevforum.com","thaihotmodels.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedieselstop.com","thefreebieguy.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","thyroidboards.com","tightsexteens.com","tiguanevforum.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tnhuntingclub.com","tokusatsuindo.com","toyotacelicas.com","toyotaevforum.com","tradingfact4u.com","traverseforum.com","truyen-hentai.com","tundraevforum.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","twowheelforum.com","umatechnology.org","unsere-helden.com","v6performance.net","velarforums.co.uk","velosterturbo.org","victoryforums.com","viralitytoday.com","visualnewshub.com","volusiariders.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","wutheringwaves.gg","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","yourcupofcake.com","10thcivicforum.com","4-seriesforums.com","4runner-forums.com","502streetscene.net","5thrangerforum.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","astrakforums.co.uk","atlasstudiousa.com","australiaforum.com","authenticateme.xyz","authenticforum.com","backforseconds.com","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","bimmerforums.co.uk","blackporncrazy.com","blog-peliculas.com","blogredmachine.com","bluemediastorage.*","bombshellbling.com","bosoxinjection.com","browneyedbaker.com","bullnettlenews.com","businessinsider.de","businessinsider.jp","cactusforums.co.uk","cadillacforums.com","calculatorsoup.com","can-amelectric.com","carnivalforums.com","challengerlife.com","challengertalk.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","climbingforums.com","cmaxownersclub.com","codingnepalweb.com","coffeeforums.co.uk","coloradodiesel.org","contractortalk.com","correotemporal.org","corsaeforums.co.uk","cr7-soccer.store>>","crooksandliars.com","crossbownation.com","customfighters.com","cyberquadforum.com","cybertrucktalk.com","dakota-durango.com","dcworldscollide.gg","defendersource.com","defensivecarry.com","descargaspcpro.net","diecastxchange.com","dieselramforum.com","digital-thread.com","dinneratthezoo.com","discoverysport.net","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","downshiftology.com","elantragtforum.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","equinoxevforum.com","esprinterforum.com","familycheftalk.com","feastingathome.com","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","firebirdnation.com","fjlaboratories.com","flacdownloader.com","footballchannel.jp","fordfusionclub.com","fordinsidenews.com","forkknifeswoon.com","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","genesisevforum.com","georgiapacking.org","germancarforum.com","goldwingowners.com","grcorollaforum.com","greeleytribune.com","grizzlycentral.com","halloweenforum.com","haveibeenpwned.com","hdstreetforums.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hondaatvforums.net","hopepaste.download","hungrypaprikas.com","hyundai-forums.com","hyundaitucson.info","iamhomesteader.com","iawaterfowlers.com","indianshortner.com","insider-gaming.com","insightcentral.net","insurancesfact.com","islamicpdfbook.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","jocjapantravel.com","kawasakiversys.com","kiatuskerforum.com","kijyomatome-ch.com","kirbiecravings.com","kodiaqforums.co.uk","laleggepertutti.it","lancerregister.com","landroversonly.com","leckerschmecker.me","lifeinleggings.com","lincolnevforum.com","listentotaxman.com","liveandletsfly.com","makeincomeinfo.com","maketecheasier.com","manchesterworld.uk","marinetraffic.live","marvelsnapzone.com","maverickforums.net","mediaindonesia.com","metalguitarist.org","millwrighttalk.com","moddedmustangs.com","modelrailforum.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","motorhomefacts.com","moviesonlinefree.*","mrmakeithappen.com","myquietkitchen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","ninja400riders.com","nissancubelife.com","nlab.itmedia.co.jp","nourishedbynic.com","observedtrials.net","oklahomahunter.net","olverineforums.com","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","oodworkingtalk.com","orkingdogforum.com","orldseafishing.com","ourbeagleworld.com","pacificaforums.com","paintballforum.com","pancakerecipes.com","panigalev4club.com","passportforums.com","pathfindertalk.com","perfectmancave.com","player.gamezone.de","playoffsstream.com","polestar-forum.com","pornfetishbdsm.com","porno-baguette.com","porscheevforum.com","promasterforum.com","prophecyowners.com","q3ownersclub.co.uk","ranglerjlforum.com","readcomiconline.li","reporterherald.com","rimfirecentral.com","ripcityproject.com","roadbikereview.com","roadstarraider.com","roadtripliving.com","runnersforum.co.uk","runtothefinish.com","samsungmagazine.eu","scarletandgame.com","scramblerforum.com","shipsnostalgia.com","shuraba-matome.com","siamblockchain.com","sidelionreport.com","sidexsideworld.com","skyscrapercity.com","slingshotforum.com","snowplowforums.com","soft.cr3zyblog.com","softwaredetail.com","spoiledmaltese.com","sportbikeworld.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","starbikeforums.com","steamclouds.online","steamcommunity.com","stevesnovasite.com","stingrayforums.com","stormtrakforum.com","stream.nflbox.me>>","strtapeadblocker.*","subarubrzforum.com","subaruforester.org","talkcockatiels.com","talkparrotlets.com","tapeadsenjoyer.com","tcrossforums.co.uk","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","theendlessmeal.com","thefirearmblog.com","thepewterplank.com","thepolitistick.com","thespeedtriple.com","thestarphoenix.com","tiguanforums.co.uk","tiktokrealtime.com","times-standard.com","tips-and-tricks.co","torrentdosfilmes.*","toyotachrforum.com","transalpowners.com","travelplanspro.com","treadmillforum.com","truestreetcars.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","upownersclub.co.uk","varminthunters.com","veggiegardener.com","vincenzosplate.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","yamahastarbolt.com","yariscrossclub.com","zafiraowners.co.uk","100percentfedup.com","208ownersclub.co.uk","adblockstreamtape.*","africatwinforum.com","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","arkansashunting.net","arrowheadaddict.com","astonmartinlife.com","asumsikedaishop.com","atchtalkforums.info","awellstyledlife.com","barcablaugranes.com","basketballforum.com","bchtechnologies.com","betweenjpandkr.blog","bible-knowledge.com","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","bowfishingforum.com","brightdropforum.com","brighteyedbaker.com","broncosporttalk.com","campercommunity.com","canuckaudiomart.com","checkhookboxing.com","chromebookforum.com","chryslerminivan.net","commanderforums.org","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","deerhuntersclub.com","detroitjockcity.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dieself150forum.com","dk.pcpartpicker.com","dodgedartforumz.com","download.megaup.net","driveteslacanada.ca","ds4ownersclub.co.uk","duckhuntingchat.com","dvdfullestrenos.com","ecoboostmustang.org","edmontonjournal.com","elcaminocentral.com","electriciantalk.com","embed.wcostream.com","equipmenttrader.com","escaladeevforum.com","estrenosdoramas.net","explorerevforum.com","ferrari296forum.com","filmesonlinexhd.biz","fjcruiserforums.com","flyfishingforum.com","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","foxeslovelemons.com","franceprefecture.fr","frustfrei-lernen.de","genealogyspeaks.com","genesisg70forum.com","genesisg80forum.com","germanshepherds.com","girlsvip-matome.com","glaownersclub.co.uk","hailfloridahail.com","hardcoresledder.com","hardwoodhoudini.com","hdfilmcehennemi2.cx","hdlivewireforum.com","hedgehogcentral.com","historicaerials.com","hometownstation.com","hondarebelforum.com","honeygirlsworld.com","honyaku-channel.net","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","ilovemycockapoo.com","indycityfishing.com","infinitijxforum.com","insidetheiggles.com","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","joyfoodsunshine.com","justonecookbook.com","kenzo-flowertag.com","kiaownersclub.co.uk","kingjamesgospel.com","kitimama-matome.net","kreuzwortraetsel.de","ktmduke390forum.com","laughingspatula.com","learnmarketinfo.com","lifeandstylemag.com","lightningowners.com","lightningrodder.com","lite.duckduckgo.com","logicieleducatif.fr","louisianacookin.com","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","melskitchencafe.com","mendocinobeacon.com","michiganreefers.com","middletownpress.com","minimalistbaker.com","modeltrainforum.com","motorcycleforum.com","movie-locations.com","mtc5.flexthecar.com","mustangecoboost.net","mykoreankitchen.com","nandemo-uketori.com","natashaskitchen.com","negyzetmeterarak.hu","newjerseyhunter.com","ohiogamefishing.com","orlandosentinel.com","outlanderforums.com","paidshitforfree.com","pcgamebenchmark.com","pendidikandasar.net","personalitycafe.com","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","preparedsociety.com","pressenterprise.com","prologuedrivers.com","promodescuentos.com","quest.to-travel.net","radio-australia.org","radio-osterreich.at","registercitizen.com","renaultforums.co.uk","reptileforums.co.uk","roguesportforum.com","rojadirectaenvivo.*","royalmailchat.co.uk","santacruzforums.com","secondhandsongs.com","shoot-yalla-tv.live","silveradosierra.com","skidrowreloaded.com","slingshotforums.com","smartkhabrinews.com","snowblowerforum.com","snowmobileforum.com","snowmobileworld.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","stormininnorman.com","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","supermotojunkie.com","sussexexpress.co.uk","suzukiatvforums.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","tarracoforums.co.uk","thecombineforum.com","thecookierookie.com","thedieselgarage.com","thefoodieaffair.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thesmokingcuban.com","thewatchforum.co.uk","thewatchseries.live","tjcruiserforums.com","trailblazertalk.com","trucs-et-astuces.co","truyentranhfull.net","tundrasolutions.com","turkishseriestv.org","valleyofthesuns.com","vintage-mustang.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","whatjewwannaeat.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","yorkshirepost.co.uk","125ccsportsbikes.com","2008ownersclub.co.uk","500xownersclub.co.uk","adamownersclub.co.uk","adultdvdparadise.com","alkingstickforum.com","alliancervforums.com","allthingsthrifty.com","amazonastroforum.com","androidauthority.com","androidheadlines.com","antaraownersclub.com","arizonagunowners.com","aroundthefoghorn.com","bcfishingreports.com","beaglesunlimited.com","beekeepingforums.com","bersapistolforum.com","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","bmaxownersclub.co.uk","brushnewstribune.com","carolinafishtalk.com","challengerforumz.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","climbingtalshill.com","cmaxownersclub.co.uk","coloradoevowners.com","connoisseurusveg.com","crackstreamshd.click","dailydishrecipes.com","dailynewshungary.com","dailytruthreport.com","dairylandexpress.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","detailingworld.co.uk","digitalcorvettes.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","favfamilyrecipes.com","foodfaithfitness.com","fordforumsonline.com","fordmuscleforums.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gesundheitsfrage.net","goosehuntingchat.com","greensnchocolate.com","greentractortalk.com","gt86ownersclub.co.uk","heartlife-matome.com","hometheatershack.com","hondarebel3forum.com","houstonchronicle.com","hyundaikonaforum.com","ibreatheimhungry.com","indianasportsman.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jeepcherokeeclub.com","jljbacktoclassic.com","journal-advocate.com","jukeownersclub.co.uk","juliescafebakery.com","kawasakininja300.com","knittingparadise.com","kugaownersclub.co.uk","labradoodle-dogs.net","labradorforums.co.uk","lamborghini-talk.com","landroverevforum.com","laweducationinfo.com","legendsofmodding.org","lehighvalleylive.com","letemsvetemapplem.eu","librarium-online.com","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda2revolution.com","mazda3revolution.com","meilleurpronostic.fr","menstennisforums.com","mercedesclaforum.com","mercedesgleforum.com","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","motorcitybengals.com","motorcycleforums.net","mt-soft.sakura.ne.jp","muscularmustangs.com","mustangevolution.com","mylawnmowerforum.com","nationalgunforum.com","neighborfoodblog.com","nissankicksforum.com","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","noteownersclub.co.uk","onelittleproject.com","onesixthwarriors.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","panamericaforums.com","pasadenastarnews.com","performanceboats.com","pickleballertalk.com","player.smashy.stream","pocketbikeplanet.com","polarisatvforums.com","popularmechanics.com","pornstarsyfamosas.es","preservationtalk.com","receitasdaora.online","redcurrantbakery.com","relevantmagazine.com","reptilesmagazine.com","reviewingthebrew.com","rollsroyceforums.com","scoutmotorsforum.com","securenetsystems.net","seededatthetable.com","silveradoevforum.com","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","springfieldforum.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","tasteandtellblog.com","techsupportforum.com","thefirearmsforum.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","thekitchenmagpie.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videoeditingtalk.com","videostreaming.rocks","visualcapitalist.com","windsorexpress.co.uk","yetiownersclub.co.uk","yorkshire-divers.com","yourhomebasedmom.com","yourpatientvoice.com","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","applefitnessforum.com","austinbassfishing.com","barnsleychronicle.com","bigleaguepolitics.com","bowfishingcountry.com","burlington-record.com","californiaevforum.com","canamspyderforums.com","casecoltingersoll.com","celebritynetworth.com","celiacandthebeast.com","cleananddelicious.com","client.pylexnodes.net","collinsdictionary.com","coloradofisherman.com","corollacrossforum.com","creative-culinary.com","dragontranslation.com","elementownersclub.com","eroticmoviesonline.me","everything2stroke.com","fancymicebreeders.com","foreverwallpapers.com","forum.release-apk.com","fusionsportforums.com","gardentractortalk.com","greaterlongisland.com","hackerranksolution.in","hollywoodreporter.com","homesteadingtoday.com","hondacivicforum.co.uk","hondapioneerforum.com","hoodtrendspredict.com","indianmotorcycles.net","invoice-generator.com","iphoneographytalk.com","jeeprenegadeforum.com","journaldemontreal.com","journey.to-travel.net","julesburgadvocate.com","kawasakininja1000.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","marutisuzukiforum.com","mavericklightning.org","mitsubishi-forums.com","mokkaownersclub.co.uk","motorcycletherapy.net","mountainmamacooks.com","mybakingaddiction.com","nissanversaforums.com","notformembersonly.com","novascotiafishing.com","novascotiahunting.com","pelotalibrevivo.net>>","peugeot108forum.co.uk","politicaltownhall.com","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","retrievertraining.net","rivianownersforum.com","rottweilersonline.com","royalenfieldforum.com","rugerpistolforums.com","runningonrealfood.com","santacruzsentinel.com","scriptgrowagarden.com","smartcarofamerica.com","snapinstadownload.xyz","snowboardingforum.com","sonymobilityforum.com","sousou-no-frieren.com","statisticsanddata.org","stratolinerdeluxe.com","streamservicehd.click","survivalistboards.com","talkaboutmarriage.com","tapeadvertisement.com","tech.trendingword.com","teslaownersonline.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","theslingshotforum.com","timesheraldonline.com","tipsandtricksarab.com","trailhunterforums.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","ultimateaircooled.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","volkswagenforum.co.uk","watchkobestreams.info","whittierdailynews.com","xr1200ownersgroup.com","yamahastarstryker.com","zone-telechargement.*","ahdafnews.blogspot.com","airsoftsniperforum.com","allevertakstream.space","andrenalynrushplay.cfd","assessmentcentrehq.com","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","breastfeedingplace.com","canadianmoneyforum.com","capturownersclub.co.uk","chicagolandfishing.com","chocolatewithgrace.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","crayonsandcravings.com","crunchycreamysweet.com","dallashoopsjournal.com","discosportforums.co.uk","drop.carbikenation.com","eclipsecrossforums.com","elrefugiodelpirata.com","eurointegration.com.ua","evoqueownersclub.co.uk","fertilityfriends.co.uk","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","housethathankbuilt.com","hyundaicoupeclub.co.uk","hyundaiperformance.com","jpop80ss3.blogspot.com","kawasakimotorcycle.org","kiatellurideforums.com","kingshotcalculator.com","littlesunnykitchen.com","longislandfirearms.com","mainehuntingforums.com","mexicanfoodjournal.com","michigan-sportsman.com","missouriwhitetails.com","mycolombianrecipes.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","player.gamesaktuell.de","portaldasnovinhas.shop","rangerraptorowners.com","redlandsdailyfacts.com","rubiconownersforum.com","salmonfishingforum.com","saturnoutlookforum.net","shakentogetherlife.com","shutupandtakemyyen.com","smartfeecalculator.com","snowmobilefanatics.com","sonsoflibertymedia.com","stellar.quoteminia.com","store.steampowered.com","thatballsouttahere.com","theflyfishingforum.com","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","triumphbobberforum.com","twopeasandtheirpod.com","utahconcealedcarry.com","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","ashingtonflyfishing.com","askandyaboutclothes.com","bajarjuegospcgratis.com","businesswritingblog.com","caraudioclassifieds.org","crosstourownersclub.com","danieldefenseforums.com","ducatisupersport939.net","excelsiorcalifornia.com","footballtransfer.com.ua","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","fromvalerieskitchen.com","healthyfitnessmeals.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","julieseatsandtreats.com","laurelberninteriors.com","makefreecallsonline.com","newbrunswickfishing.com","newbrunswickhunting.com","newlifeonahomestead.com","nothingbutnewcastle.com","onionringsandthings.com","orkingfromhomeforum.com","osteusfilmestuga.online","pcoptimizedsettings.com","platingsandpairings.com","player.smashystream.com","polarisgeneralforum.com","powerequipmentforum.com","predominantlyorange.com","ridgelineownersclub.com","runningtothekitchen.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thebestideasforkids.com","theplantbasedschool.com","tropicalfishkeeping.com","whatgreatgrandmaate.com","zeromotorcycleforum.com","afilmyhouse.blogspot.com","antiquetractorsforum.com","arizonahuntingforums.com","astraownersnetwork.co.uk","awealthofcommonsense.com","booksworthdiscussing.com","broomfieldenterprise.com","canoncitydailyrecord.com","carolinashootersclub.com","chiefmotorcycleforum.com","dictionary.cambridge.org","dimensionalseduction.com","ducatiscramblerforum.com","easttennesseefishing.com","ecosportownersclub.co.uk","first-names-meanings.com","freelancer.taxmachine.be","goldenretrieverforum.com","grandhighlanderforum.com","healthylittlefoodies.com","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","makingthymeforhealth.com","manitobafishingforum.com","manitobahuntingforum.com","maseratilevanteforum.com","mediapemersatubangsa.com","ohiowaterfowlerforum.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","smithandwessonforums.com","socialanxietysupport.com","spaghetti-interactive.it","spicysouthernkitchen.com","stacysrandomthoughts.com","streetfighterv2forum.com","stresshelden-coaching.de","sundaysuppermovement.com","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","thewanderlustkitchen.com","thunderousintentions.com","tip.etip-staging.etip.io","tropicalfishforums.co.uk","volkswagenownersclub.com","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","a-love-of-rottweilers.com","betweenenglandandiowa.com","chevroletownersclub.co.uk","chicagolandsportbikes.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dancearoundthekitchen.com","dictionnaire.lerobert.com","floridaconcealedcarry.com","greatamericanrepublic.com","handgunsandammunition.com","harley-davidsonforums.com","hipointfirearmsforums.com","kitchenfunwithmy3sons.com","macizletaraftarium.online","motorsportsracingtalk.com","pensacolafishingforum.com","player.pcgameshardware.de","practicalselfreliance.com","premeditatedleftovers.com","sentinelandenterprise.com","simply-delicious-food.com","sportsgamblingpodcast.com","technicians0.blogspot.com","theprofilebrotherhood.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cookiedoughandovenmitt.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","edinburghnews.scotsman.com","keyakizaka46matomemory.net","lakesimcoemessageboard.com","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","theworldofarchitecture.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","aprettylifeinthesuburbs.com","forums.socialmediagirls.com","georgianbaymessageboard.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","vauxhallownersnetwork.co.uk","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","electricmotorcyclesforum.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","russianmachineneverbreaks.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","insuranceloan.akbastiloantips.in","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
