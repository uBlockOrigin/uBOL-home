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

const $scriptletArgs$ = /* 1164 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;const e=ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent,t=t=>{ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=t?e.replace?.(/(Mozilla\\/5\\.0 \\([^)]+)/,\"$1; \"+t):e},o=[\"channel\"];let a=!1,r=o;document.addEventListener(\"DOMContentLoaded\",(function(){const e=()=>{const e=document.getElementById(\"movie_player\");if(!e||!window.location.href.includes(\"/watch?\"))return void(r=o);const n=e.getPlayerResponse?.(),s=e.getProgressState?.(),i=e.getStatsForNerds?.();if(s&&s.duration>0&&(s.loaded<s.duration||s.duration-s.current>1)||n?.videoDetails?.isLive){if(!i?.debug_info?.startsWith?.(\"SSAP, AD\")){const o=n.videoDetails?.videoId,s=n.playerConfig?.playbackStartConfig?.startSeconds??0,d=e.getPlayerStateObject?.()?.isBuffering;return void(\"UNPLAYABLE\"!==n?.playabilityStatus?.status||n?.playabilityStatus?.errorScreen?.playerErrorMessageRenderer?.playerCaptchaViewModel||\"WEB_PAGE_TYPE_UNKNOWN\"!==n?.playabilityStatus?.errorScreen?.playerErrorMessageRenderer?.subreason?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.webPageType||\"https://support.google.com/youtube/answer/3037019\"!==n?.playabilityStatus?.errorScreen?.playerErrorMessageRenderer?.subreason?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?0===r.length?(a=!1,t(\"\")):d&&\"0.00 s\"===i?.buffer_health_seconds&&\"0x0\"===i?.resolution&&a&&(t(r[0]),a=!1,e.loadVideoById(o,s)):(r=r.slice(1),r.length>0?t(r[0]):t(\"\"),a=!1,e.loadVideoById(o,s)))}s.duration>0&&e.seekTo?.(s.duration)}};e(),new MutationObserver((()=>{e()})).observe(document,{childList:!0,subtree:!0})})),window.Map.prototype.has=new Proxy(window.Map.prototype.has,{apply:(e,t,o)=>{if(\"onSnackbarMessage\"===o?.[0]&&!a){const e=document.getElementById(\"movie_player\");if(!e)return;const t=e.getStatsForNerds?.(),o=e.getPlayerStateObject?.()?.isBuffering,n=e.getPlayerResponse?.()?.playbackTracking?.videostatsPlaybackUrl?.baseUrl;o&&\"0.00 s\"===t?.buffer_health_seconds&&\"0x0\"===t?.resolution&&r.length>0&&(n.includes(\"reloadxhr\")&&(r=r.slice(1)),a=!0)}return Reflect.apply(e,t,o)}});const n={apply:(e,t,o)=>{const a=o[0];return\"function\"==typeof a&&a.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(e,t,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,n)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","function processEmbImg","window.addEventListener(\"load\",(()=>{window.setTimeout((()=>{for(const t of Object.keys(window).sort()){if(t.startsWith(\"b\"))break;if(t.startsWith(\"ad_\")&&!t.includes(\"top\")&&/^ad_\\d+$/.test(t)){const s=window[t]?.toString?.();if(\"string\"==typeof s){const t=s.split('\"Sponsored\",\"')?.[1]?.split?.('\",\"')?.[0];t&&document.getElementsByClassName(t)[0].setAttribute(\"ads\",\"\")}}}}),1e3)}));function processEmbImg","/adblock/i",".adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4977442009&adk=2039331362&adf=1059123170&pi=t.ma~as.4977442009&w=300&fwrn=1&fwrnh=100&lmt=1770030787&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787823&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!3\" data-google-query-id=\"CMiylL-r1pEDFYBewgUd-C8e3w\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6641328723&adk=3449722971&adf=1807356644&pi=t.ma~as.6641328723&w=311&fwrn=1&fwrnh=100&lmt=1770030787&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787824&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=5800016212302&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!4\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4977442009&adk=2039331362&adf=1059123170&pi=t.ma~as.4977442009&w=336&fwrn=1&fwrnh=100&lmt=1770031522&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770031522085&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4062124963340&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4281178270640280&tmod=72059292&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=2&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\" data-google-container-id=\"a!3\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","body:has(ins.adsbygoogle.nitro-body > div#aswift_1_host):has(.consent)","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1812271804&adf=3025194257&lmt=1770030787&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1770030787821&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=5800016212302&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12245933&ady=-12245933&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6315203302152904&tmod=72059292&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\" data-google-container-id=\"a!1\" data-load-complete=\"true\"></iframe></div></ins>",".adsbygoogle.nitro-body:not(:has(> #aswift_1_host))","<div id=\"aswift_4_host\" style=\"width: 800px; margin: 0px; padding: 0px; position: relative;\"><div data-google-ad-efd=\"true\" class=\"google-aiuf\" style=\"width: 800px !important; display: flex !important; flex-wrap: wrap !important; place-content: center !important; align-items: center !important; gap: 10px !important; font-size: initial !important; height: auto !important; max-height: 280px !important;\"><div class=\"goog-rentries\" style=\"display: flex !important; width: 100% !important;\"><div class=\"google-anno-skip goog-rentry\" tabindex=\"0\" role=\"link\" aria-label=\"Pokemon\" data-google-vignette=\"false\" data-google-interstitial=\"false\" style=\"display: flex !important; width: 100% !important; color: rgb(60, 64, 67) !important; font-size: 18px !important; background: rgb(255, 255, 255) !important;\"><span title=\"Pokemon\" style=\"color: rgb(74, 74, 74) !important; font-size: 18px !important;\">Pokemon</span><span aria-hidden=\"true\" tabindex=\"-1\"><svg viewBox=\"0 0 24 24\" width=\"24px\" height=\"24px\"><path d=\"M7.59009 18.59L9.00009 20L17.0001 12L9.00009 4L7.59009 5.41L14.1701 12\"></path></svg></span></div><div class=\"google-anno-skip goog-rentry\" tabindex=\"0\" role=\"link\" aria-label=\"Pokémon GO\" data-google-vignette=\"false\" data-google-interstitial=\"false\" style=\"display: flex !important; width: 100% !important; color: rgb(60, 64, 67) !important; font-size: 18px !important; background: rgb(255, 255, 255) !important;\"><span title=\"Pokémon GO\" style=\"color: rgb(74, 74, 74) !important; font-size: 18px !important;\">Pokémon GO</span><span aria-hidden=\"true\" tabindex=\"-1\"><svg viewBox=\"0 0 24 24\" width=\"24px\" height=\"24px\"><path d=\"M7.59009 18.59L9.00009 20L17.0001 12L9.00009 4L7.59009 5.41L14.1701 12\"></path></svg></span></div></div></div></div>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","ins.adsbygoogle.nitro-body","unfill-optimized","ins.adsbygoogle.nitro-side,ins.adsbygoogle.nitro-banner","filled","var menuSlideProtection","/*start*/!function(){\"use strict\";const t=Function.prototype.toString,e=new WeakMap;let n=0;const o=(t,n)=>{if(\"function\"==typeof t&&(e.set(t,`function ${n}() { [native code] }`),n))try{Object.defineProperty(t,\"name\",{value:n,configurable:!0})}catch(t){}return t},r=()=>{const t=(new Error).stack;return t&&/[A-Za-z]{3}\\d[0-9A-Za-z]{4,}\\.js\\?v=1\\./.test(t)?t:null},i=1770030787823;let s=0;const c=window.Date,p=c.now,a=window.performance.now.bind(window.performance);window.Date=o(class extends c{constructor(...t){const e=r();return 0===t.length&&e?(n++,1===n?new c(i+s):new c):super(...t)}static now(){return r()?i+s:p()}},\"Date\"),window.performance.now=o((()=>a()+s),\"now\");const u=t=>{try{const e=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,\"contentWindow\").get;Object.defineProperty(t,\"contentWindow\",{get:function(){const t=e.apply(this);return t&&t.Function&&t.Function.prototype.toString!==window.Function.prototype.toString&&(t.Function.prototype.toString=window.Function.prototype.toString),t},configurable:!0})}catch(t){}},d=document.createElement;document.createElement=o((function(t){const e=d.apply(this,arguments);return t&&\"iframe\"===t.toLowerCase()&&u(e),e}),\"createElement\");const l=Element.prototype.appendChild;Element.prototype.appendChild=o((function(t){return t&&\"IFRAME\"===t.tagName&&u(t),l.apply(this,arguments)}),\"appendChild\");const g=window.performance.getEntriesByType.bind(window.performance),y=(t,e)=>({name:t,entryType:\"resource\",initiatorType:e,get hostname(){return new URL(this.name).hostname},duration:15,startTime:100,responseEnd:115,transferSize:0,encodedBodySize:0,decodedBodySize:0});window.performance.getEntriesByType=o((function(t){const e=g(t);return\"resource\"===t&&r()?[...e,y(\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3497863494706299\",\"script\"),y(\"https://pagead2.googlesyndication.com/pagead/managed/js/adsense/m202602170101/show_ads_impl_fy2021.js\",\"script\"),y(\"https://googleads.g.doubleclick.net/pagead/html/r20260218/r20190131/zrt_lookup_fy2021.html\",\"iframe\"),y(\"https://pagead2.googlesyndication.com/pagead/gen_204\",\"img\"),y(\"https://pagead2.googlesyndication.com/pagead/ping?e=1\",\"fetch\")]:e}),\"getEntriesByType\");const w=Array.prototype.push;Array.prototype.push=o((function(...t){if((t=>{if(!t)return!1;const e=t.split(\"\\n\").length-1,n=t.includes(\"_executeCallback\"),o=/at\\s+([0-9A-Z_a-z]{1,3}|<anonymous>)\\s+\\(/.test(t);return e>=4&&e<=6&&(n||o)})((new Error).stack)){const e=[\"fetch\",\"XMLHttpRequest\"],n=t.filter((t=>!e.includes(t)));return 0===n.length&&t.length>0?this.length:w.apply(this,n)}return w.apply(this,t)}),\"push\");const h=window.XMLHttpRequest,f=o((function(){return new h(...arguments)}),\"XMLHttpRequest\");f.prototype=h.prototype,Object.setPrototypeOf(f,h),window.XMLHttpRequest=f,Function.prototype.toString=o((function(){if(e.has(this))return e.get(this);return[\"XMLHttpRequest\",\"fetch\",\"querySelectorAll\",\"bind\",\"push\",\"toString\",\"addEventListener\",\"now\",\"Date\",\"match\",\"createElement\",\"getEntriesByType\",\"setTimeout\"].includes(this.name)?`function ${this.name}() { [native code] }`:t.apply(this,arguments)}),\"toString\");const m=window.fetch;window.fetch=o((function(t){return\"string\"==typeof t&&t.includes(\"googleads\")?m.apply(this,arguments).then((t=>(s+=40,t))):m.apply(this,arguments)}),\"fetch\");const E=window.setTimeout;window.setTimeout=o((function(t,e){if(\"function\"==typeof t){const e=t.toString().replace(/\\s+/g,\"\");if(e.length<50&&/[$0-9A-Z_a-z]+&&[$0-9A-Z_a-z]+\\(\\)/i.test(e))return}return E.apply(this,arguments)}),\"setTimeout\")}();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//,\"\");/*end*/var menuSlideProtection","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","#historicaerials_g_728x90_ATF","<div id=\"google_ads_iframe_/22597447651/historicaerials_g_728x90_ATF_0__container__\"><iframe id=\"google_ads_iframe_/22597447651/historicaerials_g_728x90_ATF_0\" width=\"1\" height=\"1\" data-load-complete=\"true\"></iframe></div>","#historicaerials_g_160x600_Left","<div id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Left_0__container__\"><iframe id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Left_0\" width=\"1\" height=\"1\" data-load-complete=\"true\"></iframe></div>","#historicaerials_g_160x600_Right","<div id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Right_0__container__\"><iframe id=\"google_ads_iframe_/22597447651/historicaerials_g_160x600_Right_0\" width=\"1\" height=\"1\" data-load-complete=\"true\"></iframe></div>","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","/(window\\.AdObserverManager\\.register\\('ds[ps][cp]-bottomRecommend'\\);)/","(()=>{window.addEventListener(\"load\",(()=>{const t=document.querySelector(\"#openwebSection\"),e=document.querySelector(\"div[data-spot-id]\");if(!e||!t)return;const d=e.getAttribute(\"data-spot-id\");if(!d)return;var o;((t,e,d)=>{const o=document.createElement(\"div\");o.setAttribute(\"data-spotim-module\",\"conversation\"),o.setAttribute(\"data-spot-id\",t),o.setAttribute(\"data-post-id\",e),d.appendChild(o)})(d,Math.abs((o=document.title,[...o].reduce(((t,e)=>Math.imul(31,t)+e.charCodeAt(0)|0),0))),t);const a=document.createElement(\"script\");a.setAttribute(\"src\",`https://launcher.spot.im/spot/${d}`),a.setAttribute(\"async\",\"\"),document.head.appendChild(a)}));})();$1","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","fundingChoicesCalled","/adbl/i","Reflect","document.write","self == top","window.open","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","admbenefits","ref_cookie","/\\badblock\\b/","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","31000, .VerifyBtn, 100, .NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","counter_start\":\"load","counter_start\":\"DOMContentLoaded","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/\"http.*?\"/","REDIRECT_URL","/android/gi","stay","Android/","false/","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","timeLeft = duration","timeLeft = 0","no_display","/DName|#iframe_id|AdscoreSignatureLoaded/","stopTimeout();","startTimeout();","stopCountdown();","resumeCountdown();","close-modal","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","window.location.href = adsUrl;","div","<img src='/x.png' onerror=\"(function(){'use strict';function fixLinks(){document.querySelectorAll('a[href^=&quot;intent://&quot;]').forEach(link=>{const href=link.href;const match=href.match(/intent:\\/\\/([^#]+)/);if(match&&match[1]){link.href='https://'+match[1];link.onclick=e=>e.stopPropagation();}});}fixLinks();new MutationObserver(fixLinks).observe(document.body||document.documentElement,{childList:true,subtree:true});})()\">","4000","document.cookie.includes(\"adclicked=true\")","true","IFRAME","BODY","/\\d{4}/","/\\d{5}/","/func.*justDetect.*warnarea.*?;/gm","getComputedStyle(el","popup","/\\d{4}/gms","document.body.onclick","2000);","10);","(/android/i.test(t) || /Android/i.test(t))","(false)","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","fallbackUrl;","AdbModel","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","scipt","_blank","_self","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","offsetHeight","offsetHeight+100","timeLeft = 1","/aclib|break;|zoneNativeSett/","1000, #next-timer-btn > .btn-success, 600, #mid-progress-wrapper > .btn-success, 1300, #final-nextbutton","3500","#next-link-wrapper > .btn-success","1600","/fetch|popupshow/","/= 3;|= 2;/","= 0;","count","progress_original = 6;","progress_original = 3;","countdown = 5;","countdown = 3;","= false;","= true;","focused","start_focused || !document.hidden","focused || !document.hidden","checkAdsBlocked","5000","1000, #continue-btn",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","!document.hasFocus()","document.hasFocus() == false","getStoredTabSwitchTime","/\\d{4}/gm","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","onpopstate","showBannerAdBlock","state.shown >= redirectUrls.length","(isAdsenseBlocked)","onDevToolOpen","/#Intent.*?end/","intent","https","/(['\"])https?:\\/\\/[^'\"]+\\1/","$1$1","/addEventListener|adUrl|open/","href","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","9000","continue-button","getElementById","3000","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","/window\\.location\\.href.*/","/\\d{5}\\);/gms","/\\d{4}\\);/gms","spinner.classList","readylink.classList","getNowButton.classList","downloadButton.classList","*Opens in new tab","/kiwi|firefox/","isFirefox || isKiwi || !isChrome","/2000|1000/","/10;|6;/","1;","progress","isAndroid)","false)","/if((.*))/","if(1==1)","#main","{delete window[","opened","/error|load/","fetch","/\\.adsbox|iframe|GoogleActiveViewElement|adsbygoogle|div-gpt-ad/i","/detectAdBlock|checkFakeAd|adBlockNotDetected/","1000","1000, #nextBtn, 1000, #redirectBtn > .btn-moobiedat","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","head","<div id=\"popads-script\" style=\"display: none;\"></div>","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx","protect_block","no_block",";}}};break;case $.","globalThis;break;case","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","style","min-height:300px","ai_adb","window.admiral","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"|<a href=\"https:\\/\\/getad%/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","__adblocker","html-load.com","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","()=>eval","domain=?eventId=&error=",";confirm(","\"data-sdk\"","/\\(\\)=>eval|html-load\\.com|await eval/","/__adblocker|html-load/","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","d-none|media-filter-brightness|bg-dark",".media-main-image","location.href","div.offsetHeight","/bait/i","locker_timestamp","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","prerollEnabled:true","prerollEnabled:false","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup/i","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","document.head.appendChild","text-decoration","/break;case|FingerprintJS/","function defaultTrace","(()=>{let e=!1;window.qyMesh=window.qyMesh||{},window.qyMesh=new Proxy(window.qyMesh,{get:function(a,t,d){return!e&&a?.preload?.Page_recommend_1?.response?.items&&(a.preload.Page_recommend_1.response.items.forEach((e=>{e.extData?.dataExtAd&&(e.extData.dataExtAd={}),e.video&&e.video.forEach((e=>{e.adverts&&(e.adverts=[]),e.data&&(e.data=e.data.filter((e=>!e.ad)))}))})),e=!0),Reflect.get(a,t,d)}})})(); function defaultTrace","!function(){const e={apply:(e,t,o)=>{const i=o[1];if(!i||\"object\"!=typeof i.QiyiPlayerProphetData)return Reflect.apply(e,t,o)}};window.Object.defineProperties=new Proxy(window.Object.defineProperties,e)}(); function defaultTrace","!function(){const s={apply:(c,e,n)=>(n[0]?.adSlots&&(n[0].adSlots=[]),n[1]?.success&&(n[1].success=new Proxy(n[1].success,s)),Reflect.apply(c,e,n))};window.Object.assign=new Proxy(window.Object.assign,s)}(); function defaultTrace","push","(isAdblock)","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","/mdp|adb/i","popunder","adbl","/protect?","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","reload","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","unlock_chapter_guest","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","off","/window.open.adUrl.*;/","openNewTabAdClicked = false","openNewTabAdClicked = true","3","copyAdClicked = false","copyAdClicked = true","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","ab","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","blockCompletely();","name=","/detectedAdblock|DevTools/","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","/adpreserve|\\/0x/i","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","fromCharCode","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","ins.adsbygoogle","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","localStorage.setItem","ad-controls",".bitmovinplayer-container.ad-controls","/key in document|popundersPerIP|var FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","in_d4","hanime.tv","p","window.renderStoresWidgetsPluginList=","//window.renderStoresWidgetsPluginList=","Custom Advertising/AWLS/Video Reveal",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|var FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","body","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","justDetectAdblock","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","/window\\.location\\.href.*?;/","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","<img src='/n5dev.png' onerror=\"setTimeout(function(){if(typeof startWebSocket==='function'){startWebSocket();document.querySelectorAll('.liveupdates').forEach(el=>el.classList.remove('hidden'));const nl=document.getElementById('noliveupdates');if(nl)nl.classList.add('hidden');}window.showAdblockedMessage=()=>{};}, 2000);\">","student_id",".offsetLeft",":{content:","no:{content:","AdBlockChecker",".modal-content","data-adsbygoogle-status","done","document.body.innerHTML","/popunder|contextmenu/","\"hidden\"","/overlay/i","/aoAdBlockDetected/i","button[aria-label^=\"Voir une\"]","button[aria-label=\"Lancer la lecture\"]","function(error)","pdadsLastClosed","window.SCHEDULE.home","/^/gms","__INITIAL_STATE__","/$/gms","(()=>{const url=__INITIAL_STATE__.page.clickthroughPageData.url;if(url){window.location.href=url}})();","/offsetHeight|\\.test/","document.getElementsByTagName","updateTime","piano","startPreroll();","window.location","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","APMPLUS1000165","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/cX_P|_pc/","/^_cX_/","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 921 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10,3,4;1,0,11;2,12,13;2,14,15;2,16,17;2,18,19;2,20,21;3,22,23,24;3,25,23,26;3,27,23,28;0,0,29,30,3,4;0,0,31,32;0,0,33;0,0,34,35;1,0,36;1,0,37;1,0,38,39,40;0,0,41,42;4,43,44,45,46,47,48,49,50,51,52,53;2,54,55;2,56,57;2,58,59;0,0,60,61;5,62,63,64;6;0,0,65,66;0,0,67,68,69,70;7,71,4;8,72;9,72,73;0,0,74,75;1,0,76;10,77,78,79,78,80,81;0,0,82,83;0,0,84,85,3,4;1,0,86;0,0,87,88;1,0,38;1,0,89;1,0,90;1,0,91;1,0,92;1,0,93;1,0,94;1,0,95;7,96,4;1,0,97;7,98,99;7,100,4;1,0,101;0,0,102,103;0,0,104,105;8,106;1,0,107;1,0,108;1,0,109;11,110,111;1,0,112;0,0,113,78,69,114;1,0,115;1,0,116;8,117;1,0,118;1,0,119;0,0,120;1,0,121;1,0,122;0,0,123,124;0,0,125;0,0,126,127;0,0,128,129;1,0,130;0,0,131,132;1,0,133;7,134,4;7,135,4;7,136,4;1,0,137;1,0,138;9,139,73;12,140;0,0,141,142;0,0,143,144,69,145;0,0,146,147;0,0,148,149;0,0,150,151;1,0,152;0,0,153,78,69,154;0,0,155,83,156,4;0,0,157,158,156,4;0,0,159,83;0,0,160,161;1,0,162;1,0,163;0,0,164,161,69,165;0,0,166,78,69,167;0,0,168,4,69,169;0,0,170,171;0,0,172,173;13,174;1,0,175;0,0,176,177;0,0,178,179;1,0,180;10,181,182;0,0,183,79,69,184;0,0,185,161,69,184;0,0,186;2,187,188;0,0,189,161;0,0,190,191;0,0,192,193;0,0,194,161;0,0,195,161;0,0,196;1,0,197;1,0,198;0,0,199,161;1,0,200;0,0,201,202;0,0,203,204;1,0,205;0,0,206,207,3,208;1,0,209;1,0,210;0,0,211;0,0,212,83;0,0,213,78,69,214;0,0,141,215,156,4;1,0,216;1,0,217;0,0,218,219;1,0,220;1,0,221;7,222,4;0,223,224,225;1,0,226;1,0,227;1,0,228;0,0,229,230;0,0,172,231;1,0,232;12,233,234;12,235,78,236;1,0,237;0,0,238,239,69,240;0,0,241,242;0,0,243,244;0,0,245,246,69,247;0,0,248,191;0,0,249,191;1,0,250;0,0,251,161;12,252,160;0,0,253,78,69,254;0,0,255,256;7,257,4;0,0,258,259;1,0,260;0,0,261,191;0,0,262,191;1,0,263;0,0,264,161,69,240;0,0,265,266,69,240;0,0,267,268;0,0,269,270;0,0,271,272;1,0,273;0,0,274,275;0,0,276,83;0,0,42,144,69,277;0,0,278,191;0,0,279,83;1,0,280;1,0,281;0,0,282,283,284,285;1,0,286;1,0,287;0,0,288,191;0,0,289,204;1,0,290;0,0,291;0,0,292,293;0,0,294,295,69,296;0,0,224,225,69,297;0,0,298,83;0,0,299,300;1,0,301;1,0,302;0,0,303,161,69,304;0,0,264,161,69,305;0,0,306,161,69,305;1,0,307;0,0,308,83;0,0,309,161;1,0,310;0,0,311;0,0,224,225;0,0,312,202;0,0,313,202;0,0,314,315;0,0,316,317;0,0,318;0,0,319,83,156,4;0,0,320,83,156,4;0,0,321,161;0,0,322,323,69,324;0,0,325,326;0,0,327,328,69,329;1,0,330;1,0,159;0,0,83,191,69,331;0,0,332,333;0,0,334,187;1,0,335;0,0,336,161;12,337,189;1,0,338;1,0,339;1,0,340;1,0,341;1,0,342;1,0,343;1,0,344;2,345,346;0,0,347,348;1,0,349;1,0,350;0,0,351,352;0,0,353,354;1,0,355;1,0,356;0,0,357;1,0,358;1,0,359;1,0,360;1,0,361;1,0,362;1,0,363;1,0,364;1,365,366;1,0,367;1,0,368;1,0,369;0,0,370,371,3,4;7,372,83;1,0,373;0,0,374,375;0,0,376,377;0,0,378,379;0,0,376,380;0,0,376,381;0,0,382,383,3,4;0,0,384,385,3,4;0,0,386,387,69,373;1,0,388;1,0,389;1,0,390;1,0,391;1,0,392;1,0,393;1,0,394;1,0,395;1,0,396;1,0,397;1,0,398;1,0,399;1,0,400;1,0,401;1,0,402;1,0,403;1,0,404;1,0,405;0,0,406,407,69,408;0,0,409,410;0,0,411,412;12,413,78,414;1,0,415;1,0,416;1,0,417;1,0,418;1,0,419;1,0,420;1,0,421;13,422,423;1,0,424;1,0,425;1,0,426;4,427,182;0,0,428,429;1,0,430;0,0,431,432,3,4;0,0,433,434;7,435,208;0,0,436,437,69,438;0,0,439,440;0,0,441,442;0,0,443,444,3,4;0,0,445;0,0,446,447;1,0,448;1,0,449;1,0,450;0,0,451,452;13,453;1,0,454;7,455,4;0,0,456;1,0,457;9,458,191;1,0,459;1,0,460;1,0,461;10,462,463,78,78,80,464;1,0,465;8,370;0,0,466,410,69,467;8,468;9,468,73;7,469,4;0,0,470,352;1,365,471;1,0,472;0,0,473,474,3,4;0,0,473,475,3,4;0,0,473,476,3,4;1,0,477;0,0,478,204;1,0,479;11,480,481;0,365,482,483;13,484,485,156;13,486,487,156;7,488,4;13,489;8,372;1,0,490;13,491,492,156;1,0,493;1,0,494;0,0,495,496;13,497,498;13,497,499;1,0,500;1,0,501;1,0,502;7,501,4;14,503;2,345,504;1,0,505;0,0,506,507,69,508;1,0,509;8;1,0,510;7,511,4;1,0,512;1,0,513;7,514,99;1,0,515;1,0,516;1,0,517;1,0,518;8,519;9,519,73;5,520,63,521;7,222,522,78,523,4;10,524,525;0,365,526,527,69,528;1,0,529;1,0,530;1,0,531;1,0,532;1,0,533;13,534;0,0,535,536;13,537,538;9,539,191;7,540,4;11,541,542;1,0,543;8,544;7,545,4;7,546,191;1,0,547;1,365,548;13,549,78,156;1,0,550;15;1,0,159,69,122;1,0,551;1,0,552;1,0,553;0,0,554,555;1,0,556;1,0,557;7,419,558;0,0,559;0,0,560,561,3,562;0,0,563,564,3,562;8,565;1,0,566;1,0,567;1,568,569;1,568,570;1,568,571;1,568,572;1,568,573;1,568,574;1,568,575;1,0,576;1,568,577;0,0,578;12,579;1,0,580;0,0,581,582,3,4;0,0,583,83;12,584;0,0,585,586,69,587;11,588,589;11,590,542;1,0,591;1,0,592;1,0,593;1,0,594;1,0,595;1,0,596;1,0,597;1,0,598;1,0,599;7,600,4;1,0,601;1,0,602;1,0,603;1,0,604;0,0,605,606,69,607;9,608,208;0,0,609,78,69,610;5,611,63,612;1,0,613;13,614,615;1,0,616;1,0,617;11,618,542;0,0,619,620,69,621;7,622,4,78,523,4;1,0,623;1,0,624;1,0,625;1,0,626;1,0,627;1,0,628;1,0,629;1,0,630;1,0,631;8,632;1,0,633;1,0,634;1,0,635;1,0,636;0,0,637,204;0,638,639;1,0,640;1,0,641;1,0,642;0,0,643,644;1,0,645;6,646;9,647,191;1,0,648;1,0,649;1,0,650;1,0,651;0,0,652,653;12,654;13,655,656;1,0,657;12,658;1,0,659;0,0,660,661;0,0,662,663;1,0,333;1,0,664;0,0,665,666;0,0,667,668;0,0,669,204;7,670,4;7,671,4;1,0,672;7,673,191,78,523,4;0,0,501,78,69,501,156,4;8,674;0,0,675,410;0,0,676,204;0,0,677;7,419,161;1,0,678;1,0,679;1,0,680;0,0,681,682,3,4;1,0,683;1,0,684;1,0,685;1,0,686;1,0,687;7,688,4;1,0,689;7,690,4;1,0,691;7,692,4;10,693,694;1,0,695;0,0,696,697;1,0,698;1,0,699;1,0,700;1,0,701;16,702,73;5,703,63,704;7,501,99;1,0,705;1,0,706;0,0,707,191;0,0,708,410;1,0,709;0,0,710,78,69,333;1,0,711;1,0,712;1,0,713;16,714,191;0,0,715,716;0,0,717,718;7,719,4;7,720,4;1,0,721;0,0,722,723;9,724,73;0,0,725,726;7,727,4,78,523,4;0,0,728;1,729,730;0,0,731,83;1,0,732;7,733,4,78,523,4;0,0,734,78,69,735;0,0,736,737;1,0,738;1,0,739;16,740,191;1,0,741;1,0,742;9,743,83;1,0,744;0,0,745,746,69,747;1,0,748;1,0,749;1,0,750;3,751,23,28;7,752,4;1,0,753;10,754,182;1,0,755;1,0,756;0,0,376,757,3,4;1,0,758;0,0,759,760,3,4;1,0,761;0,0,762;0,0,763,764;1,0,765;1,0,766;0,365,767,768;0,0,769,770;1,0,771;7,772,4;1,0,773;9,774,191;1,0,775;0,0,776,777;7,778,4;1,0,779;0,0,7,780;1,0,781;1,0,782;3,783,784,785;1,0,786;1,0,787;13,788,789;1,0,790;10,791,4,78,78,80,792;0,0,501,793;0,0,794,795,69,796;12,797,78,336;1,0,798;8,799;1,0,800;1,0,801;1,0,802;10,803,804;1,0,805;1,0,806;1,0,807;0,0,808,191;1,0,809;1,0,810;0,0,811,812,3,4;9,813,73;1,0,814;0,0,815,816;0,0,817;1,0,818;17,819,819;1,0,820;13,821,78,156;7,822,4;8,823;1,0,372;16,824,825;1,0,826;0,0,827,828;1,0,829;0,0,830;1,0,831;1,0,832;1,0,833;1,0,834;1,0,835;8,836;10,837,191,78,78,523,4;1,0,838;1,0,839;1,0,840;7,841,191;1,0,842;1,0,843;1,0,844;0,0,845,78;7,846,191;7,847,191;1,0,848;1,0,849;1,0,254;0,0,850;9,851,4;4,852,182;1,0,853;1,0,854;1,0,855;1,0,856;10,857,858;2,859,860;1,0,861;1,0,40;0,0,862,863;0,0,376,864,3,4;0,0,865,866,3,4;1,0,867;0,0,868,869;1,0,870;1,0,871;1,0,872;7,873,4;7,874,4,78,523,4;11,875,481;0,0,876;1,0,877;0,0,878,879;0,0,282,880;0,0,881,882;0,0,883;1,0,884;1,0,885;0,0,886,887;1,0,888;1,0,889;1,0,890;1,0,891;1,0,892;1,0,893;1,568,894;1,0,895;1,0,896;1,0,229;2,859,897;9,898,73;1,0,899;0,0,900,901;1,0,902;1,365,903;3,751,904,905;2,751,187;1,0,906;1,0,907;1,0,908;1,0,909;1,0,910;12,911;12,912;1,0,913;4,914,182;1,0,915;1,0,916,39,917;0,0,918,919,69,917;1,0,920;1,0,921;18,922,182;1,0,923;0,0,924;1,0,925;5,926,927,4;1,0,928;1,0,929;1,0,930;1,0,931;9,932,73;9,933,73;9,934,73;9,935,73;9,936,73;9,937,73;11,938,542;8,939,940,941;9,942,73;11,943,542;11,944,945;9,946,73;11,947,948;11,949,950;11,951,542;11,952,953;11,954,955;11,956,111;11,957,953;11,958,542;11,959,955;11,960,961;11,962,542;11,963,542;11,964,953;11,965,966;11,967,542;11,968,542;11,969,955;11,970,971;11,972,542;11,973,974;11,975,976;11,977,542;11,978,111;11,979,542;11,980,981;11,982,983;11,984,985;11,986,987;11,988,989;11,990,955;11,991,542;11,992,993;11,994,542;11,995,996;11,997,998;11,999,542;11,1000,1001;11,1002,1003;11,1004,1005;11,1006,542;11,1007,1008;11,1009,542;11,1010,542;8,1011;8,1012;8,1013;8,1014,940,941;8,1015;8,1016;8,1017,940,941;8,1018;10,1017,78,79;7,1019,522;7,1020,522;8,1021;8,1022;8,1023;8,1024,940,941;8,1025,940,941;9,1026,73;16,1027,73;8,1028;9,1029,73;8,1030,940,941;10,1030,79,78,78,80,1031;8,1032,940,941;10,1033,78,79,78,80,1034;8,1035;8,1036,940,941;9,1037,73;16,1038,73;8,1039,940,941;8,1040;9,1041,73;8,1042;9,1043,73;8,1044,940,941;8,1045;8,1046;8,1047,940,941;9,1048,73;16,1049,73;8,1050,940,941;8,1051,940,941;9,1052,73;8,1053;8,1054,940,941;9,1055,73;8,1056,940,941;8,1057,940,941;9,1058,73;16,1058,73;8,1059;8,1060;9,1060,73;9,1061,73;9,1062,73;10,1063,78,79,78,80,1064;10,1065,78,79,78,80,1064;9,1066,73;8,1067,940,941;9,1068,73;9,1069,73;8,1070;8,1071;8,1072,940,941;9,1073,73;8,1074,940,941;9,1075,73;9,1076,73;9,1077,73;8,1078,940,941;8,1079;8,1080,940,941;8,1081;9,1082,73;8,1083;8,1084,940,941;8,1085,940,941;10,1086,78,79,78,80,1087;10,1086,78,79,78,80,1088;9,1089,73;8,1090,940,941;9,1091,73;9,1092,73;10,1093,78,79,78,80,1094;10,1095,78,79,78,80,1094;10,1096,78,79,78,80,1094;10,1097,78,79,78,80,1098;9,1099,73;9,1100,73;8,1101;9,1102,73;9,1103,73;9,1104,73;8,1105,940,941;9,1106,73;8,1107,940,941;9,1108,73;8,1109,940,941;9,1110,73;8,1111,940,941;9,1112,73;9,1113,73;8,1114;9,1115,73;11,1116,966;11,1117,966;11,1118,966;11,1119,966;11,1120,966;11,1121,966;11,1122,966;11,1123,966;11,1124,966;11,1125,542;1,0,1126;8,1127;8,1128;16,1129,83;11,1130,1131;8,1132;11,1133,542;10,1033,78,79,78,80,1134;8,1135;9,1136,73;8,1137;10,1138,1139,78,78,80,1140;10,1141,78,79,78,80,1140;10,1142,78,79,78,80,1140;10,1138,1139,78,78,80,1143;10,1141,78,79,78,80,1143;10,1142,78,79,78,80,1143;9,1144,73;8,1145;8,1146;1,0,1147;8,1148;9,1149,73;8,1150;9,1151,73;16,1152,73;9,1153,73;9,1154,73;8,1155;16,1156,73;8,1157,940,941;11,1158,542;8,1159;9,1160,73;1,0,1161,69,1162;1,0,1163";

const $scriptletArglistRefs$ = /* 7703 */ "234;234;104;225;47;250;225;22,532;717,718,719,720,721,722;225;41,225;225;470;247;341;250,269,717,718,719,720,721,722;275;276;886,887;225,549;234,276;41;41;506;225;250,717,718,719,720,721,722;238;250;247;234;143,213;45,213,225;247,263;41;250,268;225;83;225;142,143;250;250,717,718,719,720,721,722;234;47;39;46;41,225;250;250;387;261;234;250;250;250,269,717,718,719,720,721,722;234;247,275;225;717,718,719,720,721,722;40;250,717,718,719,720,721,722;275;221;275;225;281;250,270;276;275;275;225;213;350;104;234;213;250;85;72,221;234;225;275;225;259;717,718,719,720,721,722;72,221;247;417;213;225;555;125;225;225;249,250;250,717,718,719,720,721,722;225;772;778;250;637;713;225;41;562;733;234;837;225,306;225;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250,717,718,719,720,721,722;225;2;234;234;234;221,250,269,717,718,719,720,721,722;247,267;247;250;234,441;849,850;538;270;234;250;715;250;259;221;250;250;4,726,778;339;250,717,718,719,720,721,722;225;502;275;275;758,759;275;399,400;225;275;920;234,276;275;269;250;636;275;59;275;41;41;247;189;250;353;225;470;234;221;275;275;250;872;250;275;250,717,718,719,720,721,722;250;250;225;544;544;840;259;239;225;225;225;250;281;250;250;234;803,804;445;250,717,718,719,720,721,722;247;223;250;616;832;225;267;250,717,718,719,720,721,722;729;237;250;227;681;805;225;225;250;250;249,250;225;30;225,234;225;225;250,269;237;225;225;249,250;815;225;250;250;562;225;225;212,213;225;346;74,221;225;225,306;225;227;717,718,719,720,721,722;225;247;249,250;665;59,225;365;250,717,718,719,720,721,722;234;225;225;41,59,234;250;53;59,225,234;225;225;225;247;250;250,717,718,719,720,721,722;250;247;836;41;225,237;225;225;225;250;225;250;639;639;225;537;281;848,850;225;225;250;275;225,234;225;225,234,236;225;234;281;225,237;717,718,719,720,721,722;225;275;225;225;508;263,717,718,719,720,721,722;250,717,718,719,720,721,722;225;250;275;250;250,717,718,719,720,721,722;128,129;630;382;733;250;733;275;225;225;250;225;275;785;274;250;225,234;225,659;772;213;470;281;399;276;276;225;250;225;225;250,717,718,719,720,721,722;276;276;225;276;267;250;225,234;97,225;461;234;234;225;225;126;284;275;733;5;234;118,119,120,121;225;225;234;524;250;234;162;717,718,719,720,721,722;241;146,147;225;225;97;275;317;250;717,718,719,720,721,722;85;250;250;250;250;592;225;818,819,820;234;448;225;225;250;57;826,827,828;839;225,234;245;250,717,718,719,720,721,722;250;225;250;247,323;250,717,718,719,720,721,722;614;451;327;250;250;225;225;225;282;34;495,496,497,498,499;225;41,59;247;259;325;785;717,718,719,720,721,722;92;281;237;717,718,719,720,721,722;250,717,718,719,720,721,722;717,718,719,720,721,722;269;259,717,718,719,720,721,722;888;221;517;225;250;225;250,717,718,719,720,721,722;41,225;225;225;680;247;250;250;250;146,147;717,718,719,720,721,722;250;614;625;41;225,237;225;41;250;41;225;250;225;891;250,717,718,719,720,721,722;880;881;717,718,719,720,721,722;281;234;50;225;126;225;225;250;250;225;211;419;126;126;169,170,171;225;225;285;888;225;492,493,494;112;470;384;213;225;225;386;48;295;732,758,759,760,762,763;221;675;237,455;455;225,306;126;250;250;86,87;225,234;225;225,350,433;225;126;126;250;225;225;225;250,717,718,719,720,721,722;250;225;225,707;41,234;276;225;225;126;250;912;625;185,186,188;250;126;126;221;250;127;247;250,717,718,719,720,721,722;507;583;350;122;179;342;492,493,494;734;225;225;717,718,719,720,721,722;146,147;234;225;225;90;758,759,760;396,397;225;225;194;250;250;275;275;250;225;275;41;225;275;250,717,718,719,720,721,722;225;97;225;234;343;281;166,167;275;234;275;349;78,79,80;234;225;225,282,500;228;275;250;276;250;275;275;225;213;225;250;144;234;287;275;126;126;333;234;225,234;275;445;275;250;275;214;275;275;649;225;137;225;274;275;225;261;250;250;625;315;275;250;250;250;281;250;234;772;275;250;276;250,717,718,719,720,721,722;72,221;225;580;275;275;134;742,743,792,793;275;169,170,171;266,269;237;246,274;275;126;250;411;48;455;679;275;70;911;250;313,314;225;250;162;781;646,647;234;61;225;243;588;250,717,718,719,720,721,722;250;275;281;455;234;225;486;568;225;542;295;48,478,479;234;234;225;274;70;247;225;870,871;234;275;275;221;225;733;275;492,493,494;250,717,718,719,720,721,722;250;213;250;817;86,87;234;414;275;275;250;275;273;275;275;250;234;631;234;-592;225;275;275;247,275;250;394;234;225;250,717,718,719,720,721,722;234;225;225;250;858;758,759;225;250;250;250;281;460;225;225;294;252,717,718,719,720,721,722;717,718,719,720,721,722;717,718,719,720,721,722;250,717,718,719,720,721,722;250,717,718,719,720,721,722;225;225;225;225;225;97;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250,717,718,719,720,721,722;162;229;225,245;169,170,171;282;225;97;225;234;833;833;225;105,106,107,108;70;225;284;234;249,250;381;250;250;432;225;247;645;225;250;59;492,493,494;625;270;250,717,718,719,720,721,722;234;97;225;225;63;279;250;250;247;446;699,700;391;68,391;878;134;213;717,718,719,720,721,722;237;250;250;405;250;265,266;221;620;225;559;225;247;351;97;234;36;234;63;250;247;250,717,718,719,720,721,722;148;41;225;225;250;250,717,718,719,720,721,722;281;738;225,234;274;97;97;2;97,137;281;225;225;250;213;225;225;84,85;250;717,718,719,720,721,722;225;381;459;225;234;247;916;234;250,717,718,719,720,721,722;250;250;590;267;250;69;225,237;225,234;225;225;137;225;225;241;48;247;295;155,156,157,225;45;358;44;75;41;225,306;689;225,306;130;250;225;225;86,87;57;225,549;237;250;247;250;234;259,717,718,719,720,721,722;250,717,718,719,720,721,722;518;234;477;225;225;247;225;263,717,718,719,720,721,722;237,348;225;225;126;41;97;225;733;213;225;276;225,234;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;276;247;250;381;184;264;234;225;247;511,512;225;462;250;492,493,494;492,493,494;492,493,494;492,493,494;250;225;225;281;225;733;356;250,717,718,719,720,721,722;249,250;225;225;250,717,718,719,720,721,722;234;568;249,250;225;250;213,234;234;275;250,717,718,719,720,721,722;275;250;250,717,718,719,720,721,722;250;190,191;250;275;275;473;26,43;574,913,914;606;250;275;97;275;275;275;81;41;667;225;225;250,717,718,719,720,721,722;247;225;41;225;234;225;275;250,717,718,719,720,721,722;274;434;247;332;245;250;225;275;225;225;63;717,718,719,720,721,722;241;275;48;275;135;275;247;247;225;275;275;275;59;275;127;275;275;225;250;353;275;275;247,797,798,799;275;275;275;221;888;250;250;250;609;275;275;225;275;888;225;129;275;247;250,717,718,719,720,721,722;234;717,718,719,720,721,722;275;225;275;225,234,549;38,250,717,718,719,720,721,722;126;250;275;225;876;247;225;334;225;275;250;225;135,137;225;275;97;717,718,719,720,721,722,770;275;275;247;250,717,718,719,720,721,722;250;225;275;43;250,259,717,718,719,720,721,722;275;276;250;250;225;656;717,718,719,720,721,722;625;480;225;275;915;225;43;275;234;318;275;51,52;888;307;225;250;225;275;227,237,652;275;275;213,589;234;225;279;275;275;275;275;275;41;41;275;250;655;717,718,719,720,721,722;250;250;275;249,250;275;275;225;225;275;225;250;250;275;250;259;275;225;269;603;250;250;193;225;621;146,147;275;862;275;513;250,717,718,719,720,721,722;275;250;275;225;250;250;225;59,225;443;625;899,900,901,902;234;41;654;225;250,717,718,719,720,721,722;140;250;183;225;250;281;282;225;281;281;225;717,718,719,720,721,722;290;250;321,322;261;249,250;225;263,717,718,719,720,721,722;920;250;250;663;97;250;225;250,717,718,719,720,721,722;81;250,717,718,719,720,721,722;281;250,717,718,719,720,721,722;247;225;250;223;838;246,274;225;225;225;455;734;225;455;250;329;225;225;250;282;398;250;250,717,718,719,720,721,722;429;888;225;225;234;349;225;751;97;97;250;225;41;225;234;213;225;225;225,237;234;519;225;225;391;250,717,718,719,720,721,722;250;250;625;225;732,758,759,762,763;225;225;577;717,718,719,720,721,722;247;405;41;225;593;225;225;225;250;44;15,16,17,18;250;225;234;225;250;225;20,21,240;250;249,250;225;303;250,717,718,719,720,721,722;247,775;455;250,717,718,719,720,721,722;247;225;247;702;225;225;250;225;814;234;225;734;596;234;234;758,759;219,220;250,717,718,719,720,721,722;335,336;225;250;225;92;225;5;138;185,186;237;237;225;48;250;237,627;225;250,717,718,719,720,721,722;134;234;225;225;225;102;531;225;225;250;225;225;250;247;234;225;149,150,151,152,153,154;225,237;225;625;237;556;225;689;689;41;225,234;213,225;65;250;250;73;225;250;717,718,719,720,721,722;359,360;274;250;221,222;250;772;250;250;237;249,250;476;134;49;5;225;41,213,552;223;250;250;250;685;250;740;225;250;250,717,718,719,720,721,722;225;41,59;-42;225;249,250;192;234;224;225;455;250,717,718,719,720,721,722;472;270;64,247,756;234;225;234;225;404;225;41;261;250;250;250;454;717,718,719,720,721,722;625;247;455;677;432;225;568;371,372,373,374,375;282,661;250;250;503;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;629;545,546;88;234;-42;225;250;250,717,718,719,720,721,722;250,717,718,719,720,721,722;213;275;275;225;275;275;250;275;275;275;250;275;250,717,718,719,720,721,722;225;250;275;250;250;250;250;41,234;348;225;250;275;250;275;43;791;250;225;275;275;269;275;225,625;225;250;275;247;247;225;275;275;275;275;250,717,718,719,720,721,722;694;225;225;225,306;126;234;455;135,137;345;185,186,187,188;247;275;275;225;275;145;250;275;250,717,718,719,720,721,722;275;275;225;250;113;275;717,718,719,720,721,722;250;275;275;275;451;275;275;225;275;275;275;275;275;275;149,150,151,152,153,154;225;225;28;275;717,718,719,720,721,722;275;282;225;273;137;275;63;275;247,275;225;357;625;275;888;717,718,719,720,721,722;274;250;275;625;275;825;625;273;250;250;275;250,717,718,719,720,721,722;250,717,718,719,720,721,722;-42,-592,-626,-921;275;250;275;275;273;487;250;275;120;275;275;669;275;250;275;140;275;275;275;234;234;625;275;250;225;275;275;250;250;250;455;247;247;223;275;225;247,267;275;275;275;275;234;225;275;275;533,534;275;250;275;213;275;250,717,718,719,720,721,722;225;276;275;687;82;247,275;275;275;275;275;625;172,173,174;276;61;275;275;622;275;275;469;717,718,719,720,721,722;275;225;275;41,57;275;757;275;455;225;251,717,718,719,720,721,722;250,717,718,719,720,721,722;162;269;97;250;776,777;389;275;273;225;582;353;250;250;41;295;225,234;275;275;234;225;275;225;234;250;234;275;275;234;250;146,147;275;275;225;250,275;348;471;225;225;295;275;223;250;614;275;275;225;275;250,717,718,719,720,721,722;250;578;250;28;275;234;733;250,717,718,719,720,721,722;275;67;275;275;275;275;275;250;250;247;250;426;250,717,718,719,720,721,722;572;234;455;281;225;225;282;395;41;225;98,99,100,101;134;225;225;250;868,869;250;249,250;449;250;625;489,490;250;250;225;455;44;250,717,718,719,720,721,722;250;250,717,718,719,720,721,722;225;225;63,225;453;250;225;250;113,114,115;225;250;225;423;250;225;281;225;250,717,718,719,720,721,722;670;653;250;250;250;225,234;450;320;225;250,717,718,719,720,721,722;250,717,718,719,720,721,722;225,237;250;250;250;28,225;225;250;611;244;723;225;638;250,717,718,719,720,721,722;249,250;250;225;250;250;247;362;131;508;734;225;135,137;250;247;250,717,718,719,720,721,722;250;209;31;225;250;97;250;225;892,893,894;717,718,719,720,721,722;225;250;234;250;250;247;625;701;651;237;685;543;250;250;249,250;146,147;225;250;213;234;234;225;225;234;873;250;250;234;866,867;250;89;250,717,718,719,720,721,722;250;59;250;250,717,718,719,720,721,722;250,265,266,269;250;250;225;250,717,718,719,720,721,722;553;250,717,718,719,720,721,722;225;28;250,717,718,719,720,721,722;273;225;234;247;841;250,260;759;225;530;35;417;250;247;352;250;250;234;250;281;225;225;417;225;734;734;225;225;455;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;717,718,719,720,721,722;259;225;93,94,95;250;250;250;250;250;250;250;250;679;250;225;250;265,266;250,717,718,719,720,721,722;234;247;569;249,250;250;234;225;270;614;614;614;250;250;250;713;250;250;250;247;250,717,718,719,720,721,722;225;225;225;247,758;225,785;149,150,151,152,153,154;247;126;250,717,718,719,720,721,722;250;691;97;249,250;273;482;734;221;455;247;600;383;234;769;250;250;279;237;225;225;628;225,237,306,556;274;133;225;247;250,717,718,719,720,721,722;227;227;250;225,237,306,556;437;134;250;149,150,151,152,153,154;467;393;821;250;904;48;775,860,861;249,250;666;225;225;225;250;250;845;472;477;477;477;279;234;234;225;241;225;259;250;250;250;225;249,250;330;225;249,250;225;250;44;250,717,718,719,720,721,722;250;698;225;237;213;234;225;5;225,234,549;234;250;250;785;250;688;223;146,147;250,717,718,719,720,721,722;225;712;227;250;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;708;250;250;734;734;225;92,207,208;250;734;696;368;225;405;250;250,717,718,719,720,721,722;225;56;250;234;250;275;225;234;225;234;250;250;225;250;275;247,248;275;275;250;250;275;250;225;41;250;225;802;60;250;625;92,207,208,209;275;275;247;715;275;275;275;250;225;225,306;275;306,556;225;275;136;275;225;250;275;275;275;275;275;275;225;281;527;225;57;275;97;491;97;275;275;377;275;275;333;275;275;250;250;250;247;275;275;250,269,717,718,719,720,721,722;225;275;250;275;604;717,718,719,720,721,722;275;275;275;275;250;353;275;250;213;275;225;250;250;379;275;247;250;275;282;275;225;247;275;275;392;713;127;275;275;250;275;888;282;137;783;275;275;275;275;275;44,380;247;824;250;225;275;275;275;275;275;704,705;250;250;275;275;557;97;225;275;300,301;625;250;275;275;275;275;247,634;134;275;250,717,718,719,720,721,722;275;528;275;250;250;275;275;275;263,717,718,719,720,721,722;250,717,718,719,720,721,722;275;275;247;59,234;250;250;390;436;127,225;225;250;775;223;275;275;225;250;275;275;275;41;717,718,719,720,721,722;250;127;772;275;275;250;250;138;225,234;888;275;275;275;225;808,809,810;275;250,717,718,719,720,721,722;275;275;275;275;225;275;275;250;275;275;275;275;275;275;275;533;533;591;250;250;276;97;225;275;515;282;275;275;275;625;275;275;273;269;250;250;874;97;452;275;177;470;275;225;275;282;275;135,163,164,165;250;275;717,718,719,720,721,722;250;250;250,717,718,719,720,721,722;275;608;234;41;275;221;275;225;332;275;281;275;275;275;225;275;648;717,718,719,720,721,722;225;225;275;250;250;275;612;711;275;225;250;250;250;250;275;275;250;275;344;225;225;455;275;573;225;625;176;275;338;714;275;275;196,197,198,199,200,201,202,203,204,205,206;225;225;275;673;250;275;250;275;263,717,718,719,720,721,722;275;250;250;250,717,718,719,720,721,722;250;275;275;250;250;275;513;579;275;225;275;250;275;250;250;275;250,717,718,719,720,721,722;250;250,269;134;250,717,718,719,720,721,722;234;715;281;286;281;44;225;364;225;250;250;257,717,718,719,720,721,722;225;896,897,898;250;250;349;247;234;250;250;247;210;250,717,718,719,720,721,722;854,855,856;376;250;225;917,918;225;281;250;225;408;113,114,115;105,106,107,108;261;250,717,718,719,720,721,722;755;250;250;573;273;425;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250,717,718,719,720,721,722;225;250,717,718,719,720,721,722;250,259;225;250;250,717,718,719,720,721,722;225;258,717,718,719,720,721,722;282;137;111,112;48;234;250,717,718,719,720,721,722;772;270;250;324;888;261;250;97;250,717,718,719,720,721,722;873;250,717,718,719,720,721,722;247;676;734;127;249,250;225;225;225;247;44;97;44,97;778,780;213;225;225;225;41;651;853;759;247;250;717,718,719,720,721,722;250;225;672;42,221;225;225;225;225;250;225;225;727,728;250;250;234;249,250;274;225;225;225;225;247;269;250;250;250;772;458;225;413;381;381;879;250,717,718,719,720,721,722;225,306;221;250,717,718,719,720,721,722;225;444;247;234;113,114,115,116,117,241;225;250;269;246,274;250;794;225;250;734;250;633;250;225;225;525,526;250,717,718,719,720,721,722;225;226;250;225;250;225;889;395;250;250;662;232;232;225,585;225;225;225;225;225;144;888;262,717,718,719,720,721,722;885;250,717,718,719,720,721,722;249,250;247;225;6,7,8,9,10,11,12,13,14;250;247;41,552;126;250;250;250;250;250;250;595;378;250,717,718,719,720,721,722;41,326;250;615;223;250;273;225;250;225;225;250,717,718,719,720,721,722;250;250,717,718,719,720,721,722;234;250;250;273;250;213;250;291;250;225,282;225;111,139;225;225;225;225;259;234;282;283;834,835;347;225,237;225;162;269;225;225;250;247;250;5;225;225,237;225;267;250;225,237,734;250;250;225;234;717,718,719,720,721,722;225;250;250;210;731;250;237;237;237;734;734;225;556;70,225;234;601;41;250;811;250;225;683;234;225,306;97;673;760;398;250;759;267;250;223;225;250;247;888;250;225;250;529;225;213;225;215;428;477;477;225;279;97;282;274;250;127;97;250;223;250;250;477;477;225;250,717,718,719,720,721,722;234;250;249,250;225;225;492,493,494;237,348;418;241;225;250;41;234;234;625;223;225;822,823;888;250;309,310;890;225;250,717,718,719,720,721,722;250;225;778,779;41;213;250;259;223;225;250;625;247,796;225;648;328,329;250;281;250;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;492,493,494;734;225;225;734;225;250;920;250;250;250;225;250;250;275;225;564;275;847;275;275;250;275;26,43;250;275;275;288;250;250;275;275;250;250;275;275;839;225;227;250,717,718,719,720,721,722;625;250,717,718,719,720,721,722;275;250;275;234;843,844;275;275;97,133;225,237;275;275;275;275;225;225;213;225;225;250;250;250;275;275;138;275;54,55;269;275;250;250;250;275;275;250;275;275;225;273;275;275;250;275;210;138;275;275;250;97;275;275;28,363;281;225;275;275;275;275;275;275;275;250;250;221;275;275;247,275,816;275;625;275;275;275;127;625;250;250;250;275;275;275;275;246,274;250;713;275;275;250;275;275;90;275;275;275;247,275;275;275;275;250,717,718,719,720,721,722;275;227;250;275;223;213,225;59,234;250;250;250;275;275;275;275;275;713;275;275;275;275;361;281;275;41,59,625;275;225;250;41,59;625;225;275;225;401,402;250;225;225;275;275;543;275;250;250;275;888;888;223;247;250,717,718,719,720,721,722;275;275;275;250;275;275;28;275;275;888;888;366,367;366,367;223;225;275;275;250;275;275;275;275;275;275;250;273;225;263,717,718,719,720,721,722;275;250;37;259,275,717,718,719,720,721,722;275;275;275;275;275;275;275;275;250;250;275;247;275;739;41,326;41,59,225,234,326;275;275;275;275;421;275;279;250;250;250;225;225;41;275;250;275;250;41;250;250;250;275;234;225,237;247;275;250;295;28,566,567;275;275;250;275;250;275;250;105,106,107,108;275;250;225;410;275;275;275;196,197,198,199,200,201,202,203,204,205,206;250;250;250;250;275;225;134;250;225;275;250;97;225;275;275;275;275;213;237;275;250;250;250;275;250;225;569;275;275;250;275;48;225;275;563;225;576;225,306;275;275;275;138;250;250;250;625;275;295;275;247;41;275;717,718,719,720,721,722;275;275;250;275;275;275;225,237;275;275;275;275;250;275;275;275;250;169,170,171;250;275;98,99,100,101;275;250;295;225,234;225;225;86,218;281;231;225;44;44;234;234;225,234;250;250;250;225;250;877;250;225,234;225;250;710;250;291;168;732,758,759,762,763,767;250;304;603;263,717,718,719,720,721,722;249,250;695;250,717,718,719,720,721,722;225;250,717,718,719,720,721,722;279;237;227;250;250;62;717,718,719,720,721,722;549;250;225,500,501;250;250,717,718,719,720,721,722;250;625;250;604;250;250;235;250,717,718,719,720,721,722;250;263,717,718,719,720,721,722;250;274;249,250;755;801;250;89;903;332;247;305;250;213,225;256;598;250;250;221;44;166,167;250;829,830,831;230;234;678;250;241;178;250;250;225;250;250;250;225;250;250,717,718,719,720,721,722;225;261;247;250,717,718,719,720,721,722;455;234;123;859;225;273;420;225;250;250,717,718,719,720,721,722;247,795;225;250;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;250;772;273;250;250;713;735,736,737;250;250;225,337;888;249,250;250;509;247;225;888;250;734;734;302;249,250;483;225;249,250;884;225;250;249,250;249,250;225;250;41;278;249,250;225;223;225;697;481;225;625;882;250;225;225;250;250;225;549,552;250;273;250;250;250;888;250,269;531;624;225;225;225;247;225;250;97;237;225;250;250;134;28;225;247;888;273;684;234;785;225;403;888;249,250;223;237;97;44;250;250;271;682;225;250;752,753;267;225;225,234;225;250;247;368;768,864,865;234;250;250;72;250;549;250;250;250;250;250;225;250;671;225;237;273;249,250;250;225;225;250;225;241;234;250;250;250;250;247;673;97;560;717,718,719,720,721,722;250;249,250;223;247;247;225;227;70;772;431;97;250;383;225;246,247,269,274;225;234;149,150,151,152,153,154;269;713;269;225;888;250;250;888;250;279;250;225;225;250;888;250;225;225;250;59;270;59,234;247;250;134;282;250;225;250;225;225;250;250;250,717,718,719,720,721,722;225;234,348;734;225;250;249,250;273;250;885;27;41;250,717,718,719,720,721,722;282;225;234;594;225;250;225;250;492,493,494;492,493,494;237;565;280;250;250;225;250;250;70;686;250;275;250;250;275;275;275;250;275;275;82,237;275;250;250;250;250;250;250;275;250;89;225;250;247;275;275;275;234,455;250,717,718,719,720,721,722;275;41;275;273;275;275;250;275;275;137;275;225;455;234;717,718,719,720,721,722;275;137;275;250;275;250,717,718,719,720,721,722;275;250;247;250;275;250;275;250;250;97;41;250;275;275;275;275;275;275;275;275;275;275;275;275;275;213;225,282;275;275;275;275;97;225;275;250;275;786,790;247;247;273;59;59;59;275;225;275;237;275;225;275;275;250;275;250;41;275;275;225;275;275;250;275;41;275;275;311;275;275;704,705;275;250,275;275;275;250;275;275;275;275;275;275;275;275;250;275;250;275;250;127;275;275;275;275;275;250;275;275;275;875;275;250;275;275;225;275;275;250;275;275;275;250;275;275;274,786;275;275;259,717,718,719,720,721,722;275;275;275;225;275;281;275;275;275;275;713;275;118,119,120,121;275;275;250;275;437;250;250;273;250;250;250;275;275;888;888;275;275;273;275;247;273;275;275;250;275;275;800;250;250;249,250;149,150,151,152,153,154;275;292;250;275;275;275;275;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;298;275;275;41;591;225;250;250;275;275;221;275;138;275;275;275;250;275;275;275;250;275;275;275;275;250;250;275;275;275;275;275;275;247;225;253,717,718,719,720,721,722;246,274;275;247;674;275;275;275;275;275;275;275;421;275;275;275;275;250;275;234;275;135;275;275;520,772;275;225;275;275;275;275;275;275;275;275;275;275;275;245;514;250;250,717,718,719,720,721,722;275;581;225;28,566,567;275;172,173,174;103;250,269;275;275;275;275;250,717,718,719,720,721,722;269;269;275;275;275;275;275;247;275;275;275;275;275;275;275;225;275;275;275;250;275;275;275;275;259,275;247,250;734;316;275;275;625;275;275;275;275;275;250,717,718,719,720,721,722;250,717,718,719,720,721,722;275;5;275;275;430;275;275;275;275;250;250,717,718,719,720,721,722;275;275;250;275;259;275;250;221;250;225;250,717,718,719,720,721,722;275;275;275;250;275;281;275;275;250;234;275;225;664;275;275;275;275;275;275;250;221;148;250;337;225;773,774,785;281;225;225;250;225;250;225;250;250;249,250;250;415;552;250;250;250;225;209;250;41;250;225;273;250;250;250;249,250;250,717,718,719,720,721,722;250;250;250;225;250;250;488;250,717,718,719,720,721,722;670;289;180,181,182;250,717,718,719,720,721,722;250;888;250,717,718,719,720,721,722;250;409;86,87;250,717,718,719,720,721,722;455;234;273;442;250;250;225;250;250;250;888;813;223;734;250;249,250;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;41;250;250;273,717,718,719,720,721,722;250;888;250;247;250;70;701;673;250;41;227;41;277;225;225;137;123;44,225;388;625;225;250;888;250;273;263,717,718,719,720,721,722;250;250;237;249,250;250;225,234;234;225;249,250;455;888;250;250,717,718,719,720,721,722;531;247;250,717,718,719,720,721,722;127;734;734;250;250;607;225;225;234;250,717,718,719,720,721,722;225;250;247;160,161;225;250;888;225;462;250;250;250;199;250;250;250;84,85;250;225,282;250;225;250;462;41,59,625;250;250;250;408;250;127;225;250;250;531;717,718,719,720,721,722;406;250;250;273;41;250;250;250;41;614;250;250,717,718,719,720,721,722;90,241;573;250;250;250;41,225;250;520,772;225;225,227;124;469;250;250,717,718,719,720,721,722;249,250;250;273;250;717,718,719,720,721,722;247;41;908;250,717,718,719,720,721,722;250,717,718,719,720,721,722;225;523;717,718,719,720,721,722;41;250;59,225,234,306;250;247;250;225;250;281;250;250;250;225,306;225,306;247;250;250;225;250;249,250;250;225;484;250;246,274;273;225;370;246,274;250;888;225;888;225;259;41;41;245;554;299;299;299;299;299;299;299;299;299;299;299;299;299;299;299;299;299;299;416;225;250;279;134;250;225;250;270;225;481;59;250;269;250,717,718,719,720,721,722;250;250;225;250;59;250;250;250;250,717,718,719,720,721,722;648;250;250;225;395;734;223;221;703;250;250;888;90;246,274;246,274;455;225;625;223;895,-900,-901,-902;0,1;225;734;225;250;273;250;149,150,151,152,153,154;250,717,718,719,720,721,722;275;275;275;275;275;275;250;275;250;250;275;275;275;275;250;275;275;250;275;275;275;250;225,306;225,306;275;225;225;275;275;275;250;275;275;275;275;275;275;275;275;275;275;275;250;250;275;250,275;275;275;275;275;275;225,602;225;41,234;275;275;275;275;275;275;275;250;250;275;275;250;275;275;296,297;275;275;275;275;275;275;275;275;234;275;250;275;275;275;275;275;275;734;275;275;270;275;250;275;275;275;275;275;275;250;275;225;348;275;275;275;250;275;275;273;275;273;275;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;269;275;275;275;275;275;275;888;846;275;275;261;275;250;275;273;250;275;275;275;275;275;717,718,719,720,721,722;275;250;250;275;275;275;275;275;275;225;273;275;275;275;275;275;275;250;275;275;275;275;225;275;275;275;275;250;250;275;250;250;275;281;250,275;275;250;250;275;250;221;225;782;275;250;250;275;275;275;275;250;59;115;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;625;625;625;275;275;275;275;275;250;275;275;275;250;138;250;275;250;250;275;275;58;275;250;275;275;888;888;225;250;275;462;275;41;275;275;716;275;275;250;275;225;275;275;250;250;250;225;275;275;275;275;275;275;250;250;250;275;275;275;275;275;771;456;275;48;225;275;275;275;275;275;250;275;888;275;250;250;250;250;275;275;421;250;275;275;250;275;275;275;275;250;275;250;275;250;275;462;275;275;225;275;275;275;275;250;275;245;48;275;177;275;275;250;275;223;275;717,718,719,720,721,722;275;275;275;250;275;275;275;275;275;275;250,717,718,719,720,721,722;250;275;250;275;275;225;250,269,717,718,719,720,721,722;225;225;275;275;295;275;734;275;275;250;275;225;275;275;275;225;273;717,718,719,720,721,722;275;275;275;275;275;275;250;225;250;275;225;275;250;250;275;138;275;275;275;369;275;275;275;250;275;275;134;275;275;275;245;250;269;250;81;295;225;269;272;241;249,250;250;250;250;250;250,717,718,719,720,721,722;249,250;273;134;91;250,717,718,719,720,721,722;250;96;250;250;250;250;250;269,717,718,719,720,721,722;249,250;234;247;41,225;427;250;249,250;273;225;625;250;250;225,237;250;250,717,718,719,720,721,722;249,250;455;249,250;339;247;250,717,718,719,720,721,722;250;250;250,717,718,719,720,721,722;273,717,718,719,720,721,722;225;249,250;250;250;447;247;247;250;247;223;250;250;250,717,718,719,720,721,722;237;144;247;250;250;250,717,718,719,720,721,722;250;250;261;249,250;225;225;250;250;250;550,551;247;250;225;48;250;250;250;234;250;234,455;246,247,274;223;734;250;250,717,718,719,720,721,722;250,717,718,719,720,721,722;247;133;250;250;249,250;250;337;225;225;250;250,717,718,719,720,721,722;888;758,759;732,758,759;250;657;250;273;250;250;250;71;250;455;625;250;250;561;250;223;250;250,717,718,719,720,721,722;250;250,717,718,719,720,721,722;250;250;250;250;888;610;273;245;250;134;250;368;247;250;225;225;250;227;250;250;250;250;250;250;250;851,852;234;250;234;250;250;250,717,718,719,720,721,722;250;350;250;250;759,765,766;250,255,717,718,719,720,721,722;455;213;455;225;250;250;250;250;273;625;234;213;225;225;625;599;250;250;225,306;225;250,717,718,719,720,721,722;888;250,717,718,719,720,721,722;422;234,306;247;250;98,99,100,101;126;250;250;250;717,718,719,720,721,722;249,250;250;250;97;247;250,717,718,719,720,721,722;247;275;195;273;250;640,641;250;250;247;249;249,250;273;250;250;732,741,758,759,760;225;44;250;250;468;250;225;250;250;225;279;610;32,33;241,242;250;250;250;225;246,274;250;250;227;138;233;250;234;250;250;250;309,310;250;250;734;225;92;552;249,250;250,717,718,719,720,721,722;250,717,718,719,720,721,722;717,718,719,720,721,722;250,717,718,719,720,721,722;340;250;250;492,493,494;250;250;250;250;41;247;734;625;275;273;250;275;275;275;225;275;250;275;275;275;225,306;225;591;888;275;275;275;275;275;275;275;275;275;275;275;275;250,275;275;250;275;275;348,522;275;275;873;275;275;275;275;250;250;275;138;250;275;275;275;275;275;275;275;275;275;275;275;250;275;275;250;275;250;275;141;275;250;275;275;275;275;275;275;275;273;275;275;275;275;275;275;275;275;275;275;275;275;275;97;273;275;275;275;275;275;282;275;223;275;275;282;225;275;275;273;275;275;275;275;275;250;275;275;225;245;275;275;275;275;275;275;275;275;275;275;275;275;275;250;275;275;842;275;250;275;275;275;250,275;247;246,274;250;250;225;275;275;275;275;275;685;275;275;275;275;250;575;275;275;247;250;250;275;250;275;650;275;275;275;275;41;275;275;275;275;275;275;275;250;275;275;275;275;717,718,719,720,721,722;275;275;888;250;250,269,717,718,719,720,721,722;275;275;275;275;275;275;552;275;275;275;275;717,718,719,720,721,722;275;275;41;275;275;275;275;275;275;275;275;275;275;275;275;250;126;275;275;275;275;275;250;250;888;888;275;175;250;275;275;273;250;275;225;275;275;275;275;225;250;275;275;275;275;658;160,161;250;275;275;275;275;144;275;275;275;275;250;275;250;275;275;275;275;275;275;275;275;717,718,719,720,721,722;250;275;275;275;275;275;250;250;275;275;275;275;250;275;41;250;275;275;275;275;225;275;275;275;275;905,906,907;275;613;250;275;250;225;275;274;275;138;275;275;275;250;275;275;275;275;275;275;435;857;275;713;259;275;250;275;275;275;275;316;225;504;275;234;275;275;275;275;275;250;275;275;275;247;247;275;250,717,718,719,720,721,722;275;225;275;275;275;250;225;275;250;250;275;250;275;275;275;275;275;234;250;275;275;250;250;275;275;250;250;275;275;275;275;275;250;275;250;295;144;250;225;250;225;267;269;225;213;141;249,250;249,250;250;234,570,571;570,571;570,571;58;247;250;247,250;259,717,718,719,720,721,722;250;250;250;250;250;250;250;148;250;250;250,717,718,719,720,721,722;390;250,717,718,719,720,721,722;225;225;250;250;225;457;247;41,552;250;250;586;234;245;249,250;250;225;250;223;250,717,718,719,720,721,722;250;725;261,717,718,719,720,721,722;247;250,269;225;123;225;247;250;250;250,717,718,719,720,721,722;250;265;250;250;250;250;758;225;250;250;250,717,718,719,720,721,722;59,234;249,250;717,718,719,720,721,722;274;617;246,274;250,717,718,719,720,721,722;250;250;250,717,718,719,720,721,722;250;405;250;225;250;273;71;225;250;227;250;250;888;888;250;98,99,100,101;249,250;625;250;250;225;249,250;250;41;250;223;41;250;299;225;223;225;225;250;138;113,114,115,116,117;250;250;259;466;225;234;250;250;250;249,250;225;250;888;249,250;118,119,120,121;250;41,59,625;250;250;225;717,718,719,720,721,722;250,269;625;250,717,718,719,720,721,722;225,306;250;293;625;250;134;225;225,234,306;552;225;225;625;225;213;758;250;250;250,717,718,719,720,721,722;247;455;250;250;250;250;247;250;250;250;225;249,250;247,250;169,170,171;250;717,718,719,720,721,722;516;888;888;225;249,250;250;225;250;126;247;250;250;225;250;250;138;250;69;250;44;463;510;250;643;273;221;250;250;250;250;234;455;250;247;234;249,250;249,250;225;249,250;895,-897,-898,-899;247;225;250;249,250;250;275;275;250;250;250;250;275;275;275;275;275;275;275;713;275;275;275;275;275;713;275;225,306;247;319;439,440;275;306;275;275;275;275;275;250;275;275;275;247;275;275;223;275;275;275;275;275;275;275;225;275;275;275;275;275;275;275;275;275;275;275;275;275;225;225;275;250;275;275;82;275;275;250;547;250;275;275;275;275;275;275;275;275;275;275;275;275;275;540,541;250,259;275;275;275;275;275;275;275;275;626;623;275;275;275;275;275;250;275;275;275;275;225;275;225;273;275;59;275;275;275;275;275;273;275;275;275;275;275;250;275;275;786;807;275;275;250;250;275;275;250,270;250,275;250;275;250;275;275;275;275;275;275;275;250;250;888;275;275;250;275;275;275;275;275;275;275;275;247;250;275;250;275;275;275;275;275;331;250;275;275;275;275;250;275;275;275;275;250;275;275;275;275;275;275;275;275;275;692,693;250;275;275;275;275;625;275;275;275;275;275;275;275;275;275;247;250;275;275;275;275;275;275;250;275;275;250;250;275;275;275;275;250;275;275;275;275;275;250;250;275;97;275;275;275;275;275;275;250;250;250,717,718,719,720,721,722;275;275;275;250;275;275;275;275;250;250;758;275;250,275;275;275;275;275;275;275;275;275;275;275;275;275;275;250;787,788,789;275;225;275;275;275;275;421;275;275;250;275;250;275;275;275;275;275;275;250;275;275;275;275;275;275;275;275;275;548;103;250;275;275;275;715;690;275;275;275;275;275;275;275;250;250;250;275;275;275;275;275;48;462;275;275;275;275;275;275;250;275;275;275;275;225;275;275;250;275;275;275;275;225;234;250;275;250;58;275;275;275;275;275;275;275;275;275;250;275;275;275;275;275;250;888;275;275;275;250;275;250;464;250;97,133;225;247;250;225;249,250;250;312;249,250;250;132;250;250;138;135,163,164,165;749,750;263;250;250;250;250;250,717,718,719,720,721,722;249,250;250;250,717,718,719,720,721,722;250;250;717,718,719,720,721,722;247;250;250,717,718,719,720,721,722;269;138;250,261,717,718,719,720,721,722;267;5;249,250;250;263,717,718,719,720,721,722;250;250;250;250;225;888;888;250;644;250;249,250;250;247;225;250;250;250;249,250;250;250;250;58;888;250,717,718,719,720,721,722;225;250;250;250;250;250;250;249,250;250;250;250;250;71;41;250;225;535,536;250;250;250;250;250;213;888;250;273;250;250;250;250;249,250;250,717,718,719,720,721,722;273;250;250;250,717,718,719,720,721,722;316;273;250;250;250;250;118,119,120,121;138;250;250;455;625;247;225;250;650;744,745;250;250;250;625;225,306;250;250;250;250;234,237,306;250;635;225;28;223;225;249,250;250;273;223;250;274;250;126;888;267;234;250;250;234;250;250;225;660;337;261;390;250;250;250;249,250;187;66;306,556;734;102;97;761;250;225;158,159;308,747,748,762,763,873;250;250;250;223;275;250;275;275;275;275;275;275;275;275;275;275;225,306;275;275;275;275;250;275;275;250,717,718,719,720,721,722;247;275;275;250;275;275;275;275;275;275;275;275;275;275;275;275;29;275;275;275;275;250;273;275;275;275;275;250;225;275;250;275;275;275;275;275;275;275;275;275;275;247;275;250;275;275;70;275;275;275;275;275;412;275;275;449;275;275;275;275;275;275;225;97;98,99,100,101;98,99,100,101;225;275;59;275;275;250;275;275;275;275;275;250;275;275;275;275;250;275;275;275;275;275;275;250;270;275;275;275;275;275;275;275;250;275;275;275;275;275;275;250;250;275;275;275;275;275;275;275;275;275;275;250;275;275;275;275;275;275;275;275;275;275;275;275;275;275;225;275;275;275;275;275;275;275;250,275;250,717,718,719,720,721,722;275;275;275;275;250,275;225,549;275;275;275;275;275;250;275;275;275;275;275;273;505;275;247;134;250;275;275;275;275;275;754;250;275;275;275;438;275;275;275;250,275;275;250;250;225;275;275;275;275;275;275;250;246,274;275;250;250;19,597;275;275;250;275;250;225;275;275;275;275;275;250;275;275;275;275;275;250;275;275;275;275;275;275;275;250;275;250;275;275;275;275;275;275;275;275;717,718,719,720,721,722;275;888;275;247;275;275;275;275;97;275;275;275;275;275;275;221;275;275;275;275;275;275;275;250;250;250;275;250;275;275;250,717,718,719,720,721,722;275;275;250;275;275;275;275;275;275;273;250;273;539;250;250;23,24,25;254,717,718,719,720,721,722;250;247;250,717,718,719,720,721,722;249,250;273;138;730;249,250;863;250;250;250;273;261;77;717,718,719,720,721,722;474;249,250;249,250;125;250;273;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;249,250;138;247;250;250;730;250,717,718,719,720,721,722;249,250;199;109,110;102;249,250;250,717,718,719,720,721,722;249,250;888;250;772;249,250;250;250;250;123;250;250;250,717,718,719,720,721,722;249,250;58;250;250;888;250;234;250;225;250;223;138;717,718,719,720,721,722;250;642;223;269;225;225;250;888;250;883;146,147;250,717,718,719,720,721,722;250,717,718,719,720,721,722;772;250;250;250;225;247;250;558;44;250;41,225;250;385;250;250;250;250,717,718,719,720,721,722;625;247;625;273;225,306;625;249,250;250;267;250;465;234;225,306,919;250;250;250;250;249,250;225;223;888;225;249,250;600;273;250;234;250;250;269;245;250;225;273;250;225;225;250,717,718,719,720,721,722;249,250;138;247;247;267;275;275;250;250;250;275;275;275;275;250;275;275;275;734;275;275;275;275;250;250;275;275;247;275;275;275;275;250;275;275;275;724,759;275;275;275;250;275;275;250;273;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;250;250;275;250;275;275;275;275;250;275;44;275;126;262,717,718,719,720,721,722;250;250;275;275;275;275;275;888;275;275;275;275;275;275;275;250;275;250;275;275;275;250,275;275;275;275;250;250;275;275;275;275;275;275;28;273;250;275;275;275;250;275;275;275;275;275;275;275;275;275;275;275;275;275;275;225;275;275;275;275;275;275;275;275;717,718,719,720,721,722;223;275;273;275;247,812;225;275;275;234;275;275;275;275;275;250;275;250;275;275;275;275;275;275;250,267;275;275;275;275;275;275;97;275;275;275;44;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;134;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;250;250;275;275;275;275;275;275;41;275;275;275;275;548;250;275;275;275;275;250,269;275;275;275;275;275;275;275;250;275;275;275;250;275;250;275;250,717,718,719,720,721,722;250;250;772;250;249,250;250;605;715;225;250;759,767;888;250;249,250;250;250;250;250;250;250;250;138;706;247;632;250;86,87;134;134;102;225;250;250;223;250;250;250;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250,259;273;250;587;250;250;250;250;249,250;250;250;250;250;250;250;273;249,250;250;225;250,717,718,719,720,721,722;250,717,718,719,720,721,722;250;888;250;250;231;250;250;758,759,806;225;250;485;249,250;250,717,718,719,720,721,722;250;273;250;250;70;249,250;250;263,717,718,719,720,721,722;250;250;625;247;250;772;126;213,234,354,355;225;138;225;250,717,718,719,720,721,722;234;249,250;250;250;250;28;223;249,250;247;762,763;625;138;455;225;250;225;249,250;245;247;250;250;249,250;250;250;275;225;275;275;275;275;275;275;888;275;275;275;275;275;275;275;250;275;275;275;275;275;275;275;275;250;275;275;275;247;275;275;275;275;275;275;223;275;275;275;275;275;275;250;275;275;275;888;275;275;275;275;250;275;250;275;275;275;275;250;275;275;250,275;247;275;275;275;275;275;275;275;275;275;137;275;250,269,717,718,719,720,721,722;250;275;275;275;275;275;275;275;275;275;275;275;275;275;250;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;225;275;275;275;275;275;275;275;275;275;275;250;275;275;466;275;275;275;275;250;275;275;250;275;275;275;275;275;275;275;275;275;275;275;275;234;275;76;275;275;275;275;250;250;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;353;247;250;250;250;241;250;250;250;250;787,788,789;146,147;888;250;249,250;455;223;888;250;250;250;250;250;249,250;249,250;250;225;250;250;625;250;250;250;225;250;888;250;250;250;250;250;249,250;888;98,99,100,101;250;625;250;250;475;521;250;225;250;250;234,306;98,99,100,101;250;223;223;888;250;888;269;250;250,717,718,719,720,721,722;269;888;250;250;103;223;250;225;888;250;250;41;275;275;275;275;225;250;275;625;275;275;655;275;275;275;275;225;275;275;250,259,717,718,719,720,721,722;275;275;275;275;275;275;275;772;275;275;275;275;275;225;275;275;275;275;275;275;275;275;275;250;250,275;250;275;275;275;275;275;275;250;275;449;275;275;275;275;275;275;223;784;275;713;275;275;275;275;275;275;275;275;275;250;275;275;275;275;275;275;250;275;275;275;275;275;275;275;275;86,87;275;275;275;275;275;250;275;275;225;275;275;717,718,719,720,721,722;275;275;275;275;250;275;275;275;275;275;275;275;250;275;234;225;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;250,275;275;275;275;621;275;275;275;275;275;275;275;275;275;275;249,250;134;501;273;250;250;225;250;250;249,250;249,250;250;250;249,250;250;250;249,250;888;215,216,217;250;250,717,718,719,720,721,722;225;3,584;223;71;225;250;888;250;250;250;249,250;762,763;169,170,171;250;223;135,163,164,165;744,745;273;250;269;269;625;250;249,250;250;250,270,717,718,719,720,721,722;225;275;225;275;275;275;275;275;275;275;275;275;247;275;275;275;275;250;275;250;250;275;275;225;275;275;275;275;275;275;275;275;275;275;275;275;250;275;275;275;275;275;275;275;275;275;275;275;250;275;275;275;275;275;275;275;250;275;275;275;275;275;275;250;275;275;275;275;888;275;275;275;275;275;275;275;275;717,718,719,720,721,722;275;250;764;223;275;225;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;249,250;250,717,718,719,720,721,722;225;225,424;709;249,250;618,619,909,910;137;250;250;249,250;247;249,250;250;241;199;249,250;231;250;250;273;250;249,250;713;888;225;225,306;98,99,100,101;249,250;249,250;250;249,250;250;275;275;234;275;275;275;250;275;250;275;250;275;275;275;275;275;275;275;275;275;275;250;275;275;888;888;250;275;275;250;275;275;275;275;275;275;275;275;250,269,717,718,719,720,721,722;282;275;275;250;250;275;275;275;275;250;275;275;275;275;275;275;275;275;223;275;275;275;715;275;275;275;250;250;249,250;323;250;250;249,250;250;250;250;225;250;225;250;71;247;888;250;250;250;249,250;247;250;713;249,250;250,270,717,718,719,720,721,722;223;249,250;249,250;273;713;250;250;234;225;668;138;275;275;275;275;275;275;275;275;275;275;247;275;275;275;250;250;250,275;275;275;746;250;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;250,269;275;275;275;275;275;275;275;275;275;275;275;275;250;275;275;223;275;250;250;250;249,250;299;250;250;71;250;249,250;888;249,250;247;134;250;250,717,718,719,720,721,722;225;275;275;275;275;275;275;275;245;275;275;275;275;275;275;275;888;223;275;275;275;275;28;275;275;275;225;267;275;275;275;275;275;275;275;250,717,718,719,720,721,722;250;134;225;625;225;250;225;247;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;275;227,237;275;250;275;247;250,717,718,719,720,721,722;250;250;250,717,718,719,720,721,722;225;275;649;275;275;275;250;275;275;225,511;275;275;275;225;275;275;275;275;275;407;250;225;134;275;275;247;275;250,269,717,718,719,720,721,722;247;275;249,250;275;275;225;209;225;275;247;241;275;225;275;275;234";

const $scriptletHostnames$ = /* 7703 */ ["s.to","ak.sv","fc.lc","g3g.*","hqq.*","my.is","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","czn.gg","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","im9.eu","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","pahe.*","pep.ph","ppv.to","si.com","srt.am","t3n.de","tfp.is","tpi.li","tv3.lt","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","3si.org","6mt.net","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","cfb.fan","chip.de","ck5.com","clik.pw","cnxx.me","dict.cc","doods.*","due.com","egpu.io","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","g20.net","get2.in","giga.de","goku.sx","gomo.to","good.is","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moco.gg","moin.de","movi.pk","mrt.com","msn.com","mx6.com","pfps.gg","ping.gg","prbay.*","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","15min.lt","250r.net","2embed.*","4game.ru","7mmtv.sx","9gag.com","9xflix.*","a5oc.com","adria.gg","akff.net","alkas.lt","alpin.de","b15u.com","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cats.com","cjls.com","cnet.com","codex.gg","cybar.to","devlib.*","devx.com","dlhd.*>>","dooood.*","dotgg.gg","egolf.jp","ehmac.ca","emoji.gg","enoki.nz","exeo.app","exrx.net","eztvx.to","f1box.me","fark.com","fastt.gg","feoa.net","file.org","findav.*","fir3.net","flixhq.*","focus.de","fpl.team","frvr.com","fz09.org","gala.com","game8.jp","glam.com","golog.jp","gr86.org","gsxr.com","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kstp.com","kwejk.pl","lared.cl","lat69.me","lejdd.fr","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","mtbr.com","nikke.gg","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","rdr2.org","redis.io","rintor.*","rs25.com","sb9t.com","send.now","shid4u.*","short.es","shrink.*","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","tokon.gg","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wdwnt.jp","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xvip.lat","yabai.si","ytstv.me","zcar.com","zooqle.*","zx6r.com","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","3minx.com","4game.com","4stream.*","5movies.*","600rr.net","7-min.com","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","alphr.com","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","ats-v.org","atshq.org","ausrc.com","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","bc4x4.com","beeg.porn","beupp.com","bigwarp.*","blkom.com","bmwlt.com","bokep.top","bolde.com","camhub.cc","canoe.com","cbrxx.com","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cybar.xyz","d000d.com","d0o0d.com","daddyhd.*","dippy.org","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","expres.cz","fabtcg.gg","fap18.net","faqwiki.*","faselhd.*","fawzy.xyz","fc2db.com","file4go.*","finfang.*","fiuxy2.co","flagle.io","fmovies.*","fooak.com","forsal.pl","ftuapps.*","fx-22.com","garota.cf","gayfor.us","ghior.com","gladly.io","globo.com","glock.pro","gloria.hr","gplinks.*","grapee.jp","gt350.org","gtr.co.uk","gunco.net","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hkpro.com","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","ifish.net","igfap.com","imboc.com","imgur.com","imihu.net","innal.top","inxxx.com","iqiyi.com","iwsti.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kezdo5.hu","kickass.*","kissjav.*","knowt.com","kogap.xyz","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","magmix.jp","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","mini2.com","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mr2oc.com","msic.site","mynet.com","nagca.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","ngemu.com","nhlbox.me","nlegs.com","novas.net","ohjav.com","onual.com","palabr.as","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","r32oc.com","raider.io","remaxhd.*","rempo.xyz","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seturl.in","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tccoa.com","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","ttora.com","tutele.sx","ucptt.com","upzur.com","usi32.com","v6z24.com","vidara.so","vidara.to","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vn750.com","vogue.com","voodc.com","vplink.in","vtxoa.com","waezg.xyz","waezm.xyz","watson.de","wdwnt.com","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xdabo.com","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","yjiur.xyz","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","zovo2.top","1000rr.net","1130cc.com","123atc.com","180sx.club","1919a4.com","1bit.space","1lumen.com","1stream.eu","1tamilmv.*","24bite.com","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","555fap.com","5ghindi.in","604now.com","720pflix.*","7gents.com","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","aether.mom","afk.global","alfabb.com","all3do.com","allpar.com","alxnow.com","ambotv.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","ariase.com","arlnow.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","azmind.com","bagi.co.in","bargpt.app","basset.net","bgfg.co.uk","bigbtc.win","bjjdoc.com","bjpenn.com","bmamag.com","boyfuck.me","btvplus.bg","buzter.xyz","canada.com","caroha.com","cashurl.in","cboard.net","cbr250.com","cbr250.net","cdn256.xyz","cgtips.org","clock.zone","club3g.com","club4g.org","clubxb.com","cnpics.org","corral.net","crictime.*","ctpost.com","curbly.com","cztalk.com","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","diablo4.gg","diffen.com","dipsnp.com","disqus.com","djcliq.com","djxmaza.in","dnevnik.hr","dojing.net","driving.ca","dronexl.co","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","entoin.com","eracast.cc","evropa2.cz","ex-500.com","exambd.net","f1stream.*","f650.co.uk","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","ffxnow.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","fitbook.de","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","foodal.com","foodie.com","formel1.de","freeuse.me","fuck55.net","fuelly.com","fullxh.com","fxstreet.*","fz07oc.com","fzmovies.*","g5club.net","galaxus.de","game5s.com","gdplayer.*","ghacks.net","giadzy.com","gitnux.org","gixxer.com","globle.fun","gmenhq.com","gmt400.com","gmt800.com","go2gbo.com","gocast.pro","goflix.sbs","gomovies.*","google.com","gostosa.cf","gotula.net","grkids.com","grunge.com","gunhub.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","i4talk.com","i5talk.com","ib-game.jp","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","jav-coco.*","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","lorcana.gg","love4u.net","ls1gto.com","ls1lt1.com","m.4khd.com","m1xdrop.bz","macwelt.de","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","merinfo.se","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","model2.org","morels.com","motor1.com","movies4u.*","movix.blog","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","mytreg.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nonixxx.cc","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nybass.com","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","opelgt.com","otakomu.jp","ovabee.com","paypal.com","pctfenix.*","petbook.de","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prius5.com","prmovies.*","proxybit.*","pxxbay.com","qrixpe.com","r8talk.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","supra6.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thevog.net","tiscali.cz","tlzone.net","tnmusic.in","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidnest.io","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vtcafe.com","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xdtalk.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xrv.org.uk","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","ygozone.gg","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zenless.gg","zpaste.net","zx-10r.net","11xmovies.*","123movies.*","17apart.com","2monkeys.jp","31daily.com","360tuna.com","373news.com","3800pro.com","3dsfree.org","460ford.com","4wdlife.com","6theory.com","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","adxtalk.com","aimlief.com","aipebel.com","allears.net","allkpop.com","almanac.com","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","atqa005.com","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","becoming.is","beinmatch.*","bestnhl.com","bfclive.com","bg-mania.jp","bi-girl.net","bigoven.com","bigshare.io","bittbox.com","bitzite.com","blendtw.com","blogher.com","blu-ray.com","blurayufr.*","bogoten.com","bookroo.com","bootspy.com","bowfile.com","brendid.com","btcbitco.in","buellxb.com","by-pink.com","caitlin.top","camaros.net","camsrip.com","cararac.com","catster.com","cbsnews.com","cheatcc.com","chefani.com","chefjar.com","chefkoch.de","chicoer.com","civinfo.com","clubrsx.com","clubwrx.net","colnect.com","colorkit.co","colorxs.com","comohoy.com","copykat.com","courant.com","cpmlink.net","cpmlink.pro","crabbet.com","cracked.com","crx7601.com","cuervotv.me","cults3d.com","cupofjo.com","cutpaid.com","cwfeats.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","dcfcfans.uk","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","devour.asia","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","diypete.com","djqunjab.in","dogdrip.net","dogsnet.com","dogster.com","dogtime.com","doorblog.jp","dootalk.com","downvod.com","drifted.com","dronedj.com","dropgame.jp","drumspy.com","ds2play.com","ds450hq.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edelwyn.com","edikted.com","egygost.com","electrek.co","elliott.org","embedpk.net","emuenzen.de","endfield.gg","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fanbuzz.com","fastpic.org","fatcalc.com","fauxsho.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","finurah.com","fishlab.com","fitrays.com","flabfix.com","flaggle.net","flix-wave.*","flixrave.me","fnfmods.net","fnforum.net","fnjplay.xyz","fntimes.com","focusrs.org","focusst.org","foodess.com","fplzone.com","fptrack.com","freeslp.com","fsharetv.cc","fullymaza.*","futmind.com","g-porno.com","g8board.com","g8forum.com","gameriv.com","gamewith.jp","gbatemp.net","geekspin.co","get-to.link","gezondnu.nl","ghbrisk.com","gigafile.nu","gm-volt.com","go.zovo.ink","gocast2.com","godlike.com","gold-24.net","gonomad.com","goodcar.com","gopests.com","govtech.com","grasoku.com","gtaboom.com","gtrlife.com","guided.news","gupload.xyz","haytalk.com","hellcat.org","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","impalas.net","in91vip.win","itopmusic.*","jaginfo.org","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","javx357.com","jawapos.com","jelonka.com","jemsite.com","jetpunk.com","jjang0u.com","jocooks.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","k-bikes.com","k3forum.com","kaliscan.io","karanpc.com","kboards.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","laposte.net","letocard.fr","lexpress.fr","lfpress.com","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","minif56.com","mirrorace.*","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","mx5life.com","mx5nutz.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","ninjah2.org","nodo313.net","nontonx.com","noreast.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onefora.com","onepiece.gg","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","pdfdrive.to","peeplink.in","pelisplus.*","pigeons.biz","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","pxtech.site","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","rekogap.xyz","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","sadisflix.*","safetxt.net","sailnet.com","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharclub.in","sharing.wtf","shavetape.*","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","srtslug.biz","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","svrider.com","syosetu.com","t-online.de","tabooflix.*","talkesg.com","tbsradio.jp","teachoo.com","techbook.de","techguy.org","teltarif.de","teryxhq.com","thehour.com","thektog.org","thenewx.org","thothub.lol","tidymom.net","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","trx250r.net","trx450r.org","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tundra3.com","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","unixmen.com","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","vague.style","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vtxcafe.com","vwforum.com","vwscout.org","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","x7forum.com","xdforum.com","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","xpshort.com","yesmovies.*","youtube.com","yumeost.net","yxztalk.com","zagreb.info","zch-vip.com","zonatmo.com","10beasts.com","10scopes.com","123-movies.*","1500days.com","16powers.com","1911talk.com","1dogwoof.com","247tempo.com","2xkofire.com","3dshoots.com","411mania.com","46matome.net","4archive.org","4btswaps.com","4filming.com","50states.com","68forums.com","700rifle.com","718forum.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8thcivic.com","976-tuna.com","992forum.com","99sounds.org","9to5toys.com","aamulehti.fi","acrforum.com","adricami.com","afamuche.com","airfried.com","akinator.com","alecooks.com","alexsports.*","alexsportz.*","allcoast.com","alleydog.com","allmovie.com","allmusic.com","allplayer.tk","allsides.com","alphamom.com","amish365.com","angrybbq.com","anihatsu.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","ash-eats.com","ashbaber.com","askim-bg.com","at4forum.com","atglinks.com","audiforum.us","audiolgy.com","autoc-one.jp","avforums.com","avidgamer.gg","avseesee.com","avsforum.com","babylinks.in","bakerita.com","bamgosu.site","bapetalk.com","barchart.com","begindot.com","belletag.com","bemyhole.com","benandme.com","benzinga.com","beruang.club","bestiefy.com","bevcooks.com","bigtimer.net","bikeexif.com","bikemunk.com","bikeride.com","biovetro.net","birdurls.com","bitsearch.to","blackmod.net","blifaloo.com","blogmura.com","boatsafe.com","bokepindoh.*","bokepnya.com","boltbeat.com","bookszone.in","boysahoy.com","brawlify.com","breaddad.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","bubbapie.com","buffzone.com","buzzfeed.com","bz-berlin.de","bzforums.com","cakewhiz.com","capoplay.net","carlocao.com","carparts.com","casthill.net","catcrave.com","catfish1.com","catforum.com","catvills.com","cesoirtv.com","chaos2ch.com","chatango.com","chefalli.com","cheftalk.com","chevyzr2.com","chindeep.com","chopchat.com","choralia.net","chrforums.uk","chrono.quest","cima4u.forum","citefast.com","classpop.com","clickapi.net","cnevpost.com","cobaltss.com","codeshack.io","coingraph.us","cookierun.gg","country94.ca","cozymeal.com","crazyblog.in","cricstream.*","cricwatch.io","crinacle.com","crzforum.com","cuevana3.fan","curlsbot.com","cushyspa.com","cx30talk.com","cx3forum.com","d-series.org","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","dailyyum.com","datawav.club","deadline.com","dealmama.com","dicecove.com","dieseliq.com","diethood.com","divicast.com","divxtotal1.*","diycandy.com","diyswank.com","dizikral.com","docstips.com","dogforum.com","dogvills.com","dokoembed.pw","domcooks.com","donbalon.com","doodskin.lat","doodstream.*","dotafire.com","doubtnut.com","doujindesu.*","dpreview.com","draftmag.com","draftsim.com","dralpana.com","dronezon.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","earth911.com","earthsky.org","eatcells.com","eatpicks.com","eazygrub.com","ecamrips.com","edaily.co.kr","edeneats.com","egyanime.com","elavegan.com","embedtv.best","emmymade.com","engadget.com","epicdope.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","expertvn.com","f6cforum.com","factable.com","falatron.com","famivita.com","fansided.com","fapptime.com","feed2all.org","fetchpik.com","fiestast.net","fiestast.org","filecrypt.cc","filmizletv.*","filmyzilla.*","fjrforum.com","flavcity.com","flexyhit.com","flickzap.com","flipsimu.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","foldnfly.com","foodsguy.com","footybite.to","fordtough.ca","forexrw7.com","fortunly.com","fpsindex.com","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fsileaks.com","fullboys.com","fullhdfilm.*","funattic.com","funnyand.com","futabanet.jp","game4you.top","gamespew.com","gamezebo.com","gaysex69.net","gcaptain.com","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","gocomics.com","godzcast.com","gofucker.com","golf-live.at","golfspan.com","gosexpod.com","gossitup.com","gotechug.com","govfacts.org","groupdiy.com","gsowners.com","gsxs1000.org","gtoforum.com","gulflive.com","gvforums.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hentaitv.fun","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","hrvforum.com","huntress.com","hvacsite.com","iambaker.net","ibelieve.com","ibsgroup.org","ihdstreams.*","imagefap.com","impreza5.com","impreza6.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","ixforums.com","jablickar.cz","jav-noni.org","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jkowners.com","jobsheel.com","jp-films.com","k5owners.com","kasiporn.com","kazefuri.net","kfx450hq.com","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","klrforum.com","krxforum.com","ktmatvhq.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","lawnsite.com","layitlow.com","legacygt.org","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","liddread.com","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","lostsword.gg","ltr450hq.com","luluvdoo.com","lxforums.com","m14forum.com","macworld.com","mafiatown.pl","mamahawa.com","mangafire.to","mangoporn.co","mangovideo.*","maqal360.com","masscops.com","masslive.com","matacoco.com","mbeqclub.com","mealcold.com","mediaite.com","mega-mkv.com","mg-rover.org","mhdtvworld.*","migweb.co.uk","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkcforum.com","mkvcinemas.*","mkzforum.com","mmaforum.com","mmamania.com","mmastream.me","mmsbee27.com","mmsbee42.com","mmsbee47.com","modocine.com","modrinth.com","modsbase.com","modsfire.com","momsdish.com","mooonten.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","mvagusta.net","myaudiq5.com","myflixerz.to","mykitsch.com","mytiguan.com","nanolinks.in","nbadraft.net","ncangler.com","neodrive.xyz","neowners.com","netatama.net","newatlas.com","newninja.com","newsyou.info","neymartv.net","niketalk.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nugglove.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","paktech2.com","pandadoc.com","paste.bin.sx","paw-talk.net","pennlive.com","photopea.com","pigforum.com","planet-9.com","playertv.net","plowsite.com","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","prcforum.com","pressian.com","programme.tv","pubfilmz.com","publicearn.*","pwcforum.com","qyiforum.com","r1-forum.com","r1200gs.info","r2forums.com","r6-forum.com","r7forums.com","r9riders.com","rainmail.xyz","ramrebel.org","rapelust.com","ratforum.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","riftbound.gg","rlxforum.com","ronaldo7.pro","roporno.info","rotowire.com","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","rxforums.com","rxtuners.com","ryaktive.com","rzforums.com","s10forum.com","saablink.net","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","shrtslug.biz","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","snowbreak.gg","sodomojo.com","sonixgvn.net","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","ssforums.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","stylebook.de","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","technons.com","teleclub.xyz","teluguflix.*","terra.com.br","texas4x4.org","thehindu.com","themezon.net","theverge.com","thurrott.com","toonhub4u.me","topdrama.net","torrage.info","torrents.vip","tradtalk.com","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","turbovid.vip","tusfiles.com","tutlehd4.com","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","twospoke.com","uk-audis.net","uk-mkivs.net","ultraten.net","umamusume.gg","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","vault76.info","veloster.org","vertigis.com","videowood.tv","videq.stream","vidnest.live","vidsaver.net","vidtapes.com","vnjpclub.com","volokit2.com","vpcxz19p.xyz","vwidtalk.com","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","whatgame.xyz","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xcrforum.com","xhaccess.com","xhadult2.com","xhadult3.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xitongku.com","xlrforum.com","xmowners.com","xopenload.me","xopenload.pw","xpornium.net","xtglinks.com","xtratime.org","xxxstream.me","youboxtv.com","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zrvforum.com","zvision.link","zxforums.com","1000logos.net","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","124spider.org","1911forum.com","1bitspace.com","200forums.com","21dayhero.com","247sports.com","247wallst.com","30seconds.com","350z-tech.com","355nation.net","3dsourced.com","4c-forums.com","4horlover.com","4kwebplay.xyz","4xeforums.com","560pmovie.com","680thefan.com","6hiidude.gold","6thgenram.com","7fractals.icu","7vibelife.com","7yearolds.com","919thebend.ca","abc17news.com","abhijith.page","aboutamom.com","ac3filter.net","acatholic.org","aceforums.net","actusports.eu","adblocktape.*","addapinch.com","advertape.net","aeblender.com","aeclectic.net","aiimgvlog.fun","airforums.com","alexsportss.*","alfaowner.com","alicedias.com","allnurses.com","allourway.com","allthings.how","altdriver.com","ana-white.com","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apexbikes.com","apkdelisi.net","apkmirror.com","appkamods.com","arabahjoy.com","arcaneeye.com","artribune.com","aseaofred.com","ashandpri.com","asiaontop.com","askpython.com","astyleset.com","atchuseek.com","atv-forum.com","atvtrader.com","audiomack.com","audiotips.com","authority.pub","autofrage.net","avcrempie.com","azlinamin.com","b15sentra.net","babyfoode.com","bacasitus.com","badmouth1.com","bakedbree.com","bakedlean.com","bakinghow.com","bassisthq.com","bcaquaria.com","beatsnoop.com","beautygab.com","beesource.com","beinmatch.fit","bellyfull.net","belowporn.com","benzforum.com","benzworld.org","bestfonts.pro","bethbryan.com","bethcakes.com","bettafish.com","bftactics.com","bighentai.org","bigsoccer.com","bikinbayi.com","billboard.com","birdforum.net","birdzilla.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bizapedia.com","blissonly.com","bluetraxx.com","bobbyberk.com","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","boxentriq.com","boxing247.com","boxofpuns.com","brainmass.com","brasshero.com","bravedown.com","briefeguru.de","briefly.co.za","buelltalk.com","buffstreams.*","builtlean.com","bullion.forum","bunnylady.com","busycooks.com","bydeannyd.com","c.newsnow.com","c10trucks.com","caferacer.net","cake-babe.com","cakesbymk.com","callofwar.com","camdigest.com","camgirls.casa","canadabuzz.ca","canlikolik.my","capo6play.com","carscoops.com","carshtuff.com","cat-world.com","cathydiep.com","cavsdaily.com","cbssports.com","cccam4sat.com","cellphones.ca","chanto.jp.net","chazhound.com","cheater.ninja","chefsavvy.com","chevelles.com","chevybolt.org","chilimath.com","chumplady.com","chunkbase.com","cinema.com.my","cinetrafic.fr","cladright.com","cleanmama.com","cleveland.com","cloudvideo.tv","club700xx.com","clubtitan.org","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","coltforum.com","columbian.com","concomber.com","cookeatgo.com","cooktoria.com","coolcast2.com","corsa-c.co.uk","corvsport.com","createlet.com","createyum.com","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","cupofzest.com","currytrail.in","cx70forum.com","cx90forum.com","cxissuegk.com","daddylivehd.*","dailynews.com","dailynous.com","danaberez.com","danny-cph.com","darkmahou.org","darntough.com","daysofjay.com","dayspedia.com","dealntech.com","dearwendy.com","decoholic.org","deesweets.com","depvailon.com","designmom.com","desireerd.com","dfwstangs.net","dietmenus.com","dimsimlim.com","dishytech.com","disneynews.us","distiller.com","diyandfun.com","diybunker.com","dizikral1.pro","dizikral2.pro","dlstreams.top","dodgetalk.com","dogforums.com","dooodster.com","downfile.site","dphunters.mom","dragonball.gg","dragontea.ink","drivenime.com","dsmtuners.com","dubsdaily.com","duoplanet.com","e2link.link>>","eatortoss.com","ebicycles.com","ebonybird.com","egitim.net.tr","elantraxd.com","eldingweb.com","elevenlabs.io","embdproxy.xyz","embedwish.com","emissions.org","encurtads.net","encurtalink.*","endomondo.com","eplayer.click","erinspain.com","erothots1.com","errorfixer.co","esladvice.com","ethearmed.com","etkjokken.com","etoland.co.kr","evotuners.net","ex90forum.com","exawarosu.net","exceldemy.com","exploader.net","extramovies.*","extrem-down.*","f4wonline.com","fanfiktion.de","fansfocus.com","fastreams.com","fastupload.io","fathermag.com","fc2ppv.stream","feastgood.com","fedandfit.com","feedgrump.com","fenixsite.net","fiatforum.com","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fivebarks.com","fjcforums.com","fjrowners.com","fliesonly.com","flixhouse.com","flixindia.xyz","florgeous.com","flyfaucet.com","flyfishbc.com","fmachines.com","focusrsoc.com","focusstoc.com","foodbanjo.com","foodtasia.com","fordgt500.com","forzafire.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","frondtech.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","fuckingfast.*","fun-a-day.com","funker530.com","furucombo.app","gameclubz.com","gamerhour.net","gamesmain.xyz","gamingguru.fr","gamovideo.com","gatorenvy.com","geekchamp.com","geoguessr.com","getarazor.com","gifu-np.co.jp","gigashock.com","giornalone.it","gislounge.com","glaowners.com","glcforums.com","globalrph.com","glocktalk.com","gnom-gnom.com","godandman.com","golfforum.com","gopitbull.com","gotechtor.com","governing.com","gputrends.net","grabcraft.com","grantorrent.*","gritdaily.com","gromforum.com","growfully.com","grseforum.com","gunboards.com","gundamcard.gg","gundamlog.com","gunforums.net","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","hobbytalk.com","hondagrom.net","honkailab.com","hornylips.com","hoyoverse.com","huntingpa.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","ikonforum.com","ilxforums.com","indiewire.com","inkvoyage.xyz","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itmedia.co.jp","itunesfre.com","javsunday.com","jeepforum.com","jimdofree.com","jisakuhibi.jp","jkdamours.com","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","k900forum.com","kahrforum.com","kamababa.desi","kckingdom.com","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","krepsinis.net","krussdomi.com","ktmforums.com","kurashiru.com","lek-manga.net","lifehacker.jp","likemanga.ink","listar-mc.net","liteshort.com","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lootlemon.com","lotustalk.com","love4porn.com","lowellsun.com","m.inven.co.kr","macheclub.com","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","marvel.church","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","metin2hub.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","mothering.com","motor-talk.de","motorgeek.com","moutogami.com","moviekhhd.biz","moviepilot.de","moviesleech.*","moviesverse.*","movieswbb.com","moviezwaphd.*","mp-pistol.com","mp4upload.com","multicanais.*","musescore.com","mx30forum.com","myfastgti.com","myflixertv.to","mygolfspy.com","myhomebook.de","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newbeetle.org","newcelica.org","newcougar.org","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","otonanswer.jp","ottawasun.com","overclock.net","ozlosleep.com","pagalworld.cc","painttalk.com","pandamovie.in","patrol4x4.com","pc-builds.com","pearforum.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","picdollar.com","pillowcase.su","piloteers.org","pinkueiga.net","pirate4x4.com","pirateiro.com","pitchfork.com","pkbiosfix.com","planet4x4.net","pnwriders.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","ptcgpocket.gg","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","r125forum.com","r3-forums.com","ramforumz.com","rarethief.com","raskakcija.lt","rav4world.com","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rhinotalk.net","riggosrag.com","rnbxclusive.*","roadglide.org","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","rswarrior.com","rugertalk.com","rumbunter.com","rzrforums.net","s3embtaku.pro","saabscene.com","saboroso.blog","sarforums.com","savefiles.com","scatkings.com","set.seturl.in","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","shorttrick.in","silverblog.tv","silverpic.com","simana.online","sinemalar.com","sinsitio.site","skymovieshd.*","slotforum.com","smartworld.it","snackfora.com","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","sparktalk.com","speedporn.net","speedwake.com","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","sr20forum.com","srtforums.com","stackmint.ink","starstyle.com","steyrclub.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","sv-portal.com","swissotel.com","t-goforum.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","tennspeed.net","thekitchn.com","thelayoff.com","themgzr.co.uk","thepoke.co.uk","thothub.today","tidalfish.com","tiermaker.com","timescall.com","titantalk.com","tlnovelas.net","tlxforums.com","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","torupload.com","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","travelbook.de","traxforum.com","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","trxforums.com","ttforum.co.uk","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","ukcorsa-d.com","umamigirl.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","velostern.com","vibestreams.*","vid-guard.com","vidspeeds.com","vipstand.pm>>","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","volkszone.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","vweosclub.com","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","www.iqiyi.com","xc40forum.com","xcamcovid.com","xfforum.co.uk","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zdxowners.com","zorroplay.xyz","zotyezone.com","zx4rforum.com","123easy4me.com","123movieshub.*","300cforums.com","300cforumz.com","3dinosaurs.com","3dporndude.com","3rooodnews.net","42droids.co.uk","4gamers.com.tw","50isnotold.com","5boysbaker.com","7thmustang.com","99boulders.com","9to5google.com","a1-forum.co.uk","aboderie.co.uk","activewild.com","actu.orange.fr","actugaming.net","acuraworld.com","adimesaved.com","aerocorner.com","aerotrader.com","afeelachat.com","agoudalife.com","ahoramismo.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","aline-made.com","allcorsa.co.uk","alliecarte.com","allmovieshub.*","allrecipes.com","allthesvgs.com","alpineella.com","amanguides.com","amateurblog.tv","americanwx.com","anagrammer.com","anerdcooks.com","animalspot.net","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","ar15forums.com","arcticchat.com","armslocker.com","arrmaforum.com","artbarblog.com","artoffocas.com","artsymomma.com","ashemaletube.*","astro-seek.com","astrostyle.com","at4xowners.com","atchfreeks.com","atvtorture.com","automoblog.net","avpcentral.com","azbasszone.com","babaganosh.org","baby-chick.com","balkanteka.net","bamahammer.com","bbqdryrubs.com","beautymone.com","bersaforum.com","bestplants.com","bgmiconfig.ink","bhugolinfo.com","biddytarot.com","bikesmarts.com","bimmerfest.com","bingotingo.com","birdnature.com","birdsphere.com","bitcotasks.com","blackwidof.org","blizzpaste.com","blogghetti.com","blogilates.com","blogmickey.com","blogofdoom.com","blondelish.com","bluearchive.gg","bluetracker.gg","bmw-driver.net","bmwevforum.com","boersennews.de","bookseries.org","boozyburbs.com","boredpanda.com","boxthislap.org","brainknock.net","britannica.com","broncozone.com","bsugarmama.com","btcsatoshi.net","btvsports.my>>","buceesfans.com","buchstaben.com","burgmanusa.com","butterhand.com","cafehailee.com","cakenknife.com","calfkicker.com","calgarysun.com","camarozone.com","camberlion.com","campaddict.com","campendium.com","can-amtalk.com","card-codex.com","carlaaston.com","carrnissan.com","cavsnation.com","celebitchy.com","cgdirector.com","cheatsheet.com","chefdehome.com","chefdenise.com","chelsweets.com","choco0202.work","cindermint.com","cine-calidad.*","cl500forum.com","clashdaddy.com","clashdaily.com","clicknupload.*","cloudvideotv.*","clubarmada.com","clubsearay.com","clubxterra.org","cncsourced.com","cocoandash.com","code9media.com","coleycooks.com","combotarot.com","comicleaks.com","comicsands.com","comicyears.com","cooksdream.com","coolcrafts.com","coolrom.com.au","cosplay18.pics","crackberry.com","cracksports.me","crazylaura.com","crespomods.com","cretaforum.com","cricstreams.re","cricwatch.io>>","crisanimex.com","cruisehive.com","crunchyscan.fr","crypt.cybar.to","ctsvowners.com","cuevana3hd.com","cumception.com","cupofflour.org","curlynikki.com","curseforge.com","cwbchicago.com","cx500forum.com","cx50forums.com","dailyactor.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","dashofjazz.com","dashofting.com","dcurbanmom.com","dealsforum.com","dearcrissy.com","debraklein.com","deckbandit.com","deedeedoes.com","deerfarmer.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","destguides.com","diablofans.com","digitalhome.ca","dinner-mom.com","dishbydish.net","disneytips.com","diy-forums.com","diynatural.com","diyshowoff.com","dodge-dart.org","dodgersway.com","dofusports.xyz","dolldivine.com","dollforums.com","dpselfhelp.com","dragonnest.com","dramabeans.com","driverbase.com","droidviews.com","drpsychmom.com","drumhelper.com","drumstrive.com","easysalads.com","eatliverun.com","eatthebite.com","ecranlarge.com","eigachannel.jp","eighteen25.com","eldiariony.com","elmundoeats.es","elotrolado.net","embedsports.me","embedstream.me","emfcaution.com","emilieeats.com","emilybites.com","emiraforum.com","empire-anime.*","emptyeasel.com","emturbovid.com","epaceforum.com","erayforums.com","esportbike.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","eurocheapo.com","evoxforums.com","exceltrick.com","expatforum.com","extreme-down.*","f-typeclub.com","f150forumz.com","f800riders.org","fakeginger.com","faselhdwatch.*","femdom-joi.com","femestella.com","fictionlit.com","fiestastoc.com","filmizleplus.*","filmy4waps.org","findtherun.com","finmasters.com","fireblades.org","fishedthat.com","fishforums.com","fishforums.net","fiskerbuzz.com","fitdynamos.com","fitibility.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","food-bites.com","foodbymars.com","foodstruct.com","foodtechnos.in","foramotive.com","fordescape.org","fordforums.com","fordranger.net","fordtremor.com","forex-trnd.com","formyanime.com","forteturbo.org","forumchat.club","foxyfolksy.com","fpaceforum.com","freepasses.org","freetvsports.*","freezeit.co.uk","freezerfit.com","freshapron.com","frommybowl.com","fstream365.com","fuckflix.click","funinfirst.com","furyforums.com","fz-10forum.com","g310rforum.com","gameanswer.net","gamefishin.com","gamepcfull.com","gameshop4u.com","gamesolver.net","gamestouse.com","gamingfora.com","gardenzeus.com","gayforfans.com","gaypornhot.com","gearpatrol.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gforgadget.com","giftrabbit.com","giverecipe.com","gknutshell.com","glockforum.com","glockforum.net","gmfullsize.com","goalsport.info","godownsize.com","gofilmizle.com","golfcartgo.com","golfdigest.com","golfstreams.me","goodgourds.com","goodreturns.in","gopherhole.com","gps-forums.com","gr-yaris.co.uk","graceelkus.com","grammarist.com","grantbakes.com","gravureblog.tv","greencoast.org","groovypost.com","growtomato.com","gta-xtreme.com","gtaaquaria.com","guide2free.com","guild-demo.com","guitarnick.com","guitars101.com","gujjukhabar.in","gunandgame.com","gwens-nest.com","gyanitheme.com","gymnaverse.com","hauntforum.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","healthmyst.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hinoforums.com","hondatwins.net","horseforum.com","hotgranny.live","hotrodders.com","hotukdeals.com","hummerchat.com","hwnaturkya.com","imgtraffic.com","indiatimes.com","indopanas.cyou","infinitifx.org","infogenyus.top","inshorturl.com","insidehook.com","ioniqforum.com","ios.codevn.net","iplayerhls.com","iplocation.net","isabeleats.com","isekaitube.com","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jdfanatics.com","jeepgarage.org","jizzbunker.com","joemonster.org","joyousplay.xyz","jpaceforum.com","jpopsingles.eu","jukeforums.com","jyoseisama.com","k1600forum.com","kakarotfoot.ru","kanyetothe.com","katoikos.world","kawiforums.com","kia-forums.com","kickassanime.*","kijolariat.net","kimbertalk.com","kompasiana.com","ktmforum.co.uk","leaderpost.com","leahingram.com","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","low-riders.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","m109riders.com","macanforum.com","mactechnews.de","mahajobwala.in","mahitimanch.in","majestyusa.com","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","manutdtalk.com","marcialhub.xyz","mastkhabre.com","mazda6club.com","mazdaworld.org","meusanimes.net","microskiff.com","milanotalk.com","minitorque.com","mkv-pastes.com","mondeostoc.com","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","mtc3.jobsvb.in","mumuplayer.com","mundowuxia.com","musketfire.com","my.irancell.ir","myeasymusic.ir","mymbonline.com","nana-press.com","naszemiasto.pl","newmovierulz.*","newnissanz.com","news-buzz1.com","news30over.com","newscionxb.com","newtiburon.com","nhregister.com","ninernoise.com","niocarclub.com","nissanclub.com","nookgaming.com","nowinstock.net","nv200forum.com","nyfirearms.com","o2tvseries.com","ocregister.com","ohsheglows.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","outbackers.com","pandamovies.me","pandamovies.pw","pandaspor.live","pantrymama.com","paste-drop.com","pastemytxt.com","pathofexile.gg","pelando.com.br","pencarian.link","petitrobert.fr","pinchofyum.com","pipandebby.com","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playingmtg.com","playtube.co.za","populist.press","pornhd720p.com","pornincest.net","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","priusforum.com","projeihale.com","proxyninja.org","psychobike.com","q2forums.co.uk","qiqitvx84.shop","quest4play.xyz","rabbitdogs.net","ramblinfan.com","ramevforum.com","rc350forum.com","rc51forums.com","record-bee.com","reisefrage.net","remixsearch.es","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","roninforum.com","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rugerforum.net","runeriders.com","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","section215.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shadowverse.gg","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","sigarms556.com","singjupost.com","sizecharts.net","skidrowcpy.com","slatedroid.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","solanforum.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speedzilla.com","speisekarte.de","spieletipps.de","sportbikes.net","sportsurge.net","spyderchat.com","spydertalk.com","srt10forum.com","srt4mation.com","ssrfanatic.com","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","stripehype.com","studyfinds.org","superhonda.com","supexfeeds.com","swatchseries.*","swedespeed.com","swipebreed.net","swordalada.org","tamilprinthd.*","taosforums.com","tarokforum.com","taurusclub.com","tbssowners.com","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thefitchen.com","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","tonaletalk.com","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","tournguide.com","toyokeizai.net","tracktheta.com","trafficnews.jp","trannyteca.com","trentonian.com","triumph675.net","triumphrat.net","troyrecord.com","tundratalk.net","turbocloud.xyz","turbododge.com","tvs-widget.com","tvseries.video","tw200forum.com","twincities.com","uberpeople.net","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","urldecoder.org","userscloud.com","usmagazine.com","vagdrivers.net","vahantoday.com","veo-hentai.com","videocelts.com","vikistream.com","viperalley.com","visifilmai.org","viveseries.com","volvoforum.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wellplated.com","whodatdish.com","wielerflits.be","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xc100forum.com","xclusivejams.*","xeforums.co.uk","xhofficial.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yfzcentral.com","yourcobalt.com","yourupload.com","z1000forum.com","z125owners.com","zeroupload.com","zkillboard.com","zx25rforum.com","101planners.com","1911addicts.com","240sxforums.com","368chickens.com","3dprinterly.com","40plusstyle.com","4activetalk.com","4lessbyjess.com","4pics1-word.com","51bonusrummy.in","7daysofplay.com","7thgenhonda.com","899panigale.org","959panigale.net","9thgencivic.com","acadiaforum.net","accordxclub.com","acedarspoon.com","acemanforum.com","adrinolinks.com","adz7short.space","agoneerfans.com","agrodigital.com","airfryermom.com","airfryeryum.com","alandacraft.com","aliezstream.pro","all-nationz.com","allaboutami.com","alldownplay.xyz","allsoundlab.net","allucanheat.com","alonelylife.com","alphafoodie.com","amarokforum.com","amazingribs.com","amytreasure.com","androjungle.com","animalnerdz.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","antennaland.com","app-sorteos.com","aquariadise.com","archerytalk.com","archtoolbox.com","areaconnect.com","areweranked.com","ariyaforums.com","arstechnica.com","artistforum.com","artofmemory.com","astrosafari.com","at-my-table.com","audi-forums.com","audif1forum.com","audiotools.blog","audioz.download","audiq3forum.com","averiecooks.com","aviationa2z.com","bahaiforums.com","bakeorbreak.com","bakerstable.net","baketobefit.com","bakingbites.com","bargainbabe.com","bballrumors.com","beanrecipes.com","beautysided.com","becomebetty.com","beehivehero.com","beinmatch1.live","bellezashot.com","bestofvegan.com","bethebudget.com","bettasource.com","beyerbeware.net","bharathwick.com","bikinitryon.net","billyparisi.com","bimmerwerkz.com","bitesofberi.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","boatdriving.org","bobsvagene.club","bodyketosis.com","bokepsin.in.net","boldjourney.com","bollyflix.cards","bonnibakery.com","boogieforum.com","boxerforums.com","boxingdaily.com","boxingforum.com","boxingstream.me","brandeating.com","breederbest.com","brilian-news.id","bromabakery.com","bromefields.com","brutusforum.com","budgetbytes.com","buffstreams.app","build-basic.com","bulbagarden.net","bussyhunter.com","busytoddler.com","bylisafonde.com","c.newsnow.co.uk","caabcrochet.com","cafedelites.com","cakesprices.com","calculateme.com","can-amforum.com","canonrumors.com","canvasrebel.com","cardsayings.net","careeralley.com","carseatsmom.com","casadecrews.com","caseihforum.com","catological.com","cattleforum.com","cattletoday.com","cbr300forum.com","celebsuburb.com","celicasupra.com","cempakajaya.com","chalkbucket.com","chefjacooks.com","chefspencil.com","chemicalaid.com","cheneetoday.com","chevyblazer.org","chevytrucks.org","chewoutloud.com","chilitochoc.com","chollometro.com","chordsworld.com","cigarforums.net","cinemablind.com","cinenerdle2.app","cizgivedizi.com","cjponyparts.com","classbforum.com","classic-jdm.com","classicnerd.com","cleantheair.org","clubthrifty.com","clubtouareg.com","comfyliving.net","comicbasics.com","computerbild.de","connections.run","contextures.com","convertcase.net","coopcancook.com","copycatchic.com","copykatchat.com","cordneutral.net","cosmicdeity.com","cosplay-xxx.com","cowboysnews.com","cowboyszone.com","cozydiyhome.com","craftionary.net","creatordrop.com","criticalhit.net","crizyman.online","crochething.com","crohnsforum.com","crownforums.com","cruiseradio.net","cryptoearns.com","ct200hforum.com","ctx700forum.com","cubbiescrib.com","customtacos.com","cycleforums.com","cycletrader.com","cyndispivey.com","daigasikfaan.co","dailybreeze.com","dailycamera.com","dailycaring.com","dailydish.co.uk","dailyknicks.com","dailyorange.com","databazeknih.cz","dawindycity.com","defendersxs.com","deltadigital.co","dendroboard.com","designorate.com","detoxinista.com","diariovasco.com","dieseljeeps.com","dieselplace.com","digimonzone.com","digiztechno.com","dinnerin321.com","disneyembed.wtf","diychatroom.com","diydecormom.com","diygarden.co.uk","diyhandymom.com","diyinspired.com","dizipal1536.com","dizipal1537.com","dizipal1538.com","dizipal1539.com","dizipal1540.com","dizipal1541.com","dizipal1542.com","dizipal1543.com","dizipal1544.com","dizipal1545.com","dizipal1546.com","dizipal1547.com","dizipal1548.com","dizipal1549.com","dizipal1550.com","dizipal1551.com","dizipal1552.com","dizipal1553.com","dizipal1554.com","dizipal1555.com","dizipal1556.com","dizipal1557.com","dizipal1558.com","dizipal1559.com","dizipal1560.com","dizipal1561.com","dizipal1562.com","dizipal1563.com","dizipal1564.com","dizipal1565.com","dizipal1566.com","dizipal1567.com","dizipal1568.com","dizipal1569.com","dizipal1570.com","dizipal1571.com","dizipal1572.com","dizipal1573.com","dizipal1574.com","dizipal1575.com","dizipal1576.com","dizipal1577.com","dizipal1578.com","dizipal1579.com","dizipal1580.com","dizipal1581.com","dizipal1582.com","dizipal1583.com","dizipal1584.com","dizipal1585.com","dizipal1586.com","dizipal1587.com","dizipal1588.com","dizipal1589.com","dizipal1590.com","dizipal1591.com","dizipal1592.com","dizipal1593.com","dizipal1594.com","dizipal1595.com","dizipal1596.com","dizipal1597.com","dizipal1598.com","dizipal1599.com","dizipal1600.com","djsaviation.net","dk894953543.com","dl-protect.link","dlstreams.top>>","doctormalay.com","dodge-nitro.com","dogfoodchat.com","doggysaurus.com","dollartimes.com","donnerwetter.de","doodledoods.com","dopomininfo.com","draftlegame.com","dragonball.guru","dreamystays.com","driveaccord.net","drkarenslee.com","droidgamers.com","drveganblog.com","drywalltalk.com","ducatiforum.com","ducatihyper.com","dukesavenue.com","dunkorthree.com","e-tronforum.com","e46fanatics.com","easygayoven.com","eatatmaudes.com","eatcookbake.com","eatmovemake.com","eatplayshae.com","eatthegains.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","edmontonsun.com","eggsallways.com","egoallstars.com","elamigosweb.com","electrikjam.com","elicitfolio.com","elleandpear.com","elmundoeats.com","emilyaclark.com","emilylaurae.com","emmacruises.com","empire-stream.*","endurancely.com","englishlinx.com","episodehive.com","erinobrien.life","escape-city.com","escapeforum.org","esportivos.site","eva-darling.com","exactpay.online","excelchamps.com","expedition33.gg","expressnews.com","extrapetite.com","extratorrent.st","fabeveryday.com","familysavvy.com","familyspice.com","famivita.com.br","fantasycalc.com","fantasydata.com","farmergrows.com","farmingbase.com","farmlifediy.com","fatherandus.com","fatimacooks.net","fcportables.com","fdownloader.net","ferrarilife.com","fgochaldeas.com","fierceboard.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financebuzz.com","financemonk.net","financewada.com","finanzfrage.net","firstsportz.com","fisheries.co.uk","fishonfirst.com","fitnessista.com","fiveslot777.com","fizzlefacts.com","fizzlefakten.de","flagle-game.com","flightaware.com","floandgrace.com","floralapron.com","fluxingwell.com","fmradiofree.com","fnafinsider.com","foodbymaria.com","fooddoodles.com","foodiecrush.com","foodieholly.com","foodnouveau.com","foodnutters.com","footyhunter.lol","forbusybees.com","fordraptor2.com","forktospoon.com","forteforums.com","foxandbriar.com","foxestalk.co.uk","foxfarmhome.com","framedcooks.com","freeairpump.com","freeconvert.com","freeomovie.info","freewebcart.com","frugalmomeh.com","frugalrules.com","fsportshd.xyz>>","fullydriven.com","fun-squared.com","funmoneymom.com","funny-jokes.com","funwithmama.com","fxstreet-id.com","fxstreet-vn.com","gamedayeats.com","gameplayneo.com","gamerempire.net","gaming-fans.com","gaminginfos.com","gamingsmart.com","gardenholic.com","gardenmyths.com","gatechecked.com","gatorforums.net","gazetaprawna.pl","gearthhacks.com","geeksofcolor.co","gen3insight.com","gentletummy.com","gentosha-go.com","genxfinance.com","geogridgame.com","gewinnspiele.tv","ghibliforum.com","girlscanner.org","girlsreport.net","glamperlife.com","global-view.com","gmauthority.com","gmtruckclub.com","godairyfree.org","gofile.download","gokartguide.com","golfergeeks.com","goproforums.com","gowatchseries.*","grannysquare.me","gratispaste.com","greatandhra.com","groomshaper.com","growingdawn.com","growingplay.com","guidingtech.com","guitarchalk.com","guitarlobby.com","gunnerforum.com","gut-erklaert.de","hamrojaagir.com","havocxforum.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hondashadow.net","hotcopper.co.nz","hummusapien.com","i-paceforum.com","idoitmyself.xyz","ilovetoplay.xyz","infinitiq30.org","infinitiq50.org","infinitiq60.org","infosgj.free.fr","instabiosai.com","integratalk.com","istreameast.app","jaguarforum.com","japangaysex.com","jaysjournal.com","jeepevforum.com","jeeppatriot.com","jettajunkie.com","juliasalbum.com","jumpsokuhou.com","kandiforums.com","kawieriders.com","keltecforum.com","khatrimazaful.*","kiaevforums.com","kickrunners.com","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","krakenfiles.com","kurashinista.jp","lakestclair.net","lamarledger.com","ldoceonline.com","lexusfforum.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lombardiave.com","lordchannel.com","lucid-forum.com","lugerforums.com","lulustream.live","lumberjocks.com","luxury4play.com","lynkcoforum.com","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","marlinforum.com","marvelrivals.gg","matomeblade.com","matomelotte.com","mclarenlife.com","mediacast.click","medstudentz.com","meganesport.net","mentalfloss.com","mercedescla.org","mercurynews.com","metrisforum.com","miamiherald.com","minievforum.com","miniwebtool.com","mmsmasala27.com","mobilestalk.net","modernhoney.com","modistreams.org","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","mtc1.jobtkz.com","musiclutter.xyz","myanimelist.net","nativesurge.net","naughtypiss.com","ncgunowners.com","news-herald.com","news.zerkalo.io","nflspinzone.com","niice-woker.com","ninetowners.com","nitroforumz.com","noindexscan.com","nomnompaleo.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nutmegnanny.com","nuxhallas.click","nydailynews.com","oceanforums.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","passatworld.com","paviseforum.com","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","petforums.co.uk","phillyvoice.com","phongroblox.com","picsxxxporn.com","pierandsurf.com","pilotonline.com","piratehaven.xyz","pisshamster.com","pistolsmith.com","pistolworld.com","planetminis.com","planetrugby.com","plantedtank.net","poodleforum.com","popdaily.com.tw","powergam.online","powerstroke.org","premiumporn.org","priusonline.com","projectfreetv.*","prowlertalk.net","punishworld.com","qatarstreams.me","r1200rforum.com","rallyforums.com","rangerovers.net","rank1-media.com","raptorforum.com","readbitcoin.org","readhunters.xyz","recon-forum.com","regalforums.com","remixsearch.net","reportera.co.kr","resizer.myct.jp","rhinoforums.net","riderforums.com","risingapple.com","rnbastreams.com","robloxforum.com","rodsnsods.co.uk","roofingtalk.com","rugbystreams.me","rustorkacom.lib","saabcentral.com","saikyo-jump.com","sampledrive.org","sat-sharing.com","saxontheweb.net","scr950forum.com","seadoospark.org","seir-sanduk.com","seltosforum.com","sfchronicle.com","shadowrangers.*","shemalegape.net","shortxlinks.com","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","skyroadster.com","slapthesign.com","smokinvette.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","stdrivers.co.uk","streamnoads.com","stripers247.com","stylecaster.com","sudokutable.com","suicidepics.com","supraforums.com","sweetie-fox.com","taikoboards.com","talkbudgies.com","talkparrots.com","tapeantiads.com","tapeblocker.com","tasteofhome.com","taurusarmed.net","tennisforum.com","tennisstreams.*","teryxforums.net","the5krunner.com","thebassbarn.com","theblueclit.com","thebullspen.com","thegoatspot.net","thegrowthop.com","thejetpress.com","themoviesflix.*","theporndude.com","theprovince.com","thereeftank.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","trgoals1526.xyz","trgoals1527.xyz","trgoals1528.xyz","trgoals1529.xyz","trgoals1530.xyz","trgoals1531.xyz","trgoals1532.xyz","trgoals1533.xyz","trgoals1534.xyz","trgoals1535.xyz","trgoals1536.xyz","trgoals1537.xyz","trgoals1538.xyz","trgoals1539.xyz","trgoals1540.xyz","trgoals1541.xyz","trgoals1542.xyz","trgoals1543.xyz","truthsocial.com","tuktukcinma.com","turbobuicks.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","uk-muscle.co.uk","ukaudiomart.com","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","v-twinforum.com","v8sleuth.com.au","valhallas.click","vantasforum.com","vik1ngfile.site","vikingforum.net","vikingforum.org","vinfasttalk.com","vipsister23.com","viralharami.com","volconforum.com","vwt4forum.co.uk","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wericmartin.com","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","windsorstar.com","winnipegsun.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","yamahaforum.com","yanksgoyard.com","yoursciontc.com","yrtourguide.com","zakuzaku911.com","100layercake.com","101cookbooks.com","101dogbreeds.com","104homestead.com","10fragrances.com","15worksheets.com","2coolfishing.com","3boysandadog.com","3dprinterful.com","4thgentacoma.com","5itemsorless.com","5letterwords.org","6thgenaccord.com","7173mustangs.com","790dukeforum.com","abrams-media.com","abraskitchen.com","aclassclub.co.uk","acouplecooks.com","acozykitchen.com","acrylgiessen.com","acura-legend.com","adblockstrtape.*","adblockstrtech.*","addicted2diy.com","adultstvlive.com","affordwonder.net","afrugalchick.com","ahaparenting.com","aheadofthyme.com","airflowforum.com","airfryerlove.com","aisleofshame.com","aldireviewer.com","alexroblesmd.com","alisononfoot.com","allaboutjazz.com","alluringsoul.com","allyscooking.com","allyskitchen.com","almarsguides.com","alphahistory.com","altherforums.com","altimaforums.net","amiablefoods.com","amindfullmom.com","amiraspantry.com","amishamerica.com","amortization.org","amtraktrains.com","andhereweare.net","androidadult.com","animestotais.xyz","antennasports.ru","apeachyplate.com","apistogramma.com","appletoolbox.com","appunwrapper.com","aquatic-eden.com","aquietrefuge.com","arboristsite.com","archeryaddix.com","arteonforums.com","arzyelbuilds.com","ascensionlogs.gg","ascentforums.com","ashadeofteal.com","asianacircus.com","asyaanimeleri.pw","attagirlsays.com","audio-forums.com","autismforums.com","automatelife.net","avocadopesto.com","awickedwhisk.com","awortheyread.com","azurelessons.com","backfirstwo.site","backyarddigs.com","badgerowners.com","bakeandbacon.com","bakersroyale.com","baking-sense.com","bakingbeauty.net","baldandhappy.com","ball-pythons.net","bananamovies.org","baptistboard.com","barbarabakes.com","base64decode.org","bassmagazine.com","bcsportbikes.com","beatofhawaii.com","beautymunsta.com","bedbuglawyer.org","beesandroses.com","beingpatient.com","belquistwist.com","benelliforum.com","bestdesserts.com","bestgirlsexy.com","bestpornflix.com","betterwander.com","beyondcruise.com","bigbearswife.com","bigblockdart.com","bikersrights.com","biplaneforum.com","birdswatcher.com","bitzngiggles.com","blackandteal.com","blesserhouse.com","blog.esuteru.com","blog.livedoor.jp","blowgunforum.com","boardingarea.com","bogglewizard.net","bojongourmet.com","boldappetite.com","bonappeteach.com","bookanalysis.com","bootstrapbee.com","bostonherald.com","bostonscally.com","bowl-me-over.com","boxycolonial.com","brandbrief.co.kr","brownsnation.com","brutecentral.com","budgettravel.com","buffalowdown.com","buickevforum.com","buildgreennh.com","bunnymuffins.lol","bunsinmyoven.com","burtonavenue.com","busbysbakery.com","buzzfeednews.com","bytheforkful.com","c-classforum.com","cadenzaforum.com","cakescottage.com","calendarkart.com","cambreabakes.com","camperreport.com","campersmarts.com","campgrilleat.com","canalesportivo.*","caneswarning.com","caribbeanpot.com","carlmurawski.com","carolinaroad.com","castandspear.com","castironketo.net","catchmyparty.com","cbr500riders.com","cellocentral.com","chainsawtalk.com","chalkacademy.com","chambanamoms.com","charexempire.com","chartmasters.org","cheerfulcook.com","chefjonwatts.com","chelseadamon.com","cherokeesrt8.com","cherokeetalk.com","chevronlemon.com","cheyennechat.com","chickenforum.com","chiefsreport.com","chinese-pics.com","choosingchia.com","cincyshopper.com","civic11forum.com","clarityforum.com","cleanerstalk.com","cleaningtalk.com","clever-tanken.de","clickndownload.*","clickorlando.com","cloudynights.com","clubfrontier.org","clubroadster.net","clutchpoints.com","coffeeforums.com","coffeelevels.com","collective.world","coloradofans.com","coloredmanga.com","comidacaseira.me","computeruser.com","conniekresin.com","construct101.com","controlbooth.com","cookeatpaleo.com","cookeryspace.com","cookilicious.com","cookincanuck.com","cookingandme.com","cookingbride.com","cookrepublic.com","cooksimply.co.uk","cookthestory.com","cookwithdana.com","cosascaseras.com","costcontessa.com","cottercrunch.com","counterstats.net","countryguess.com","countryrebel.com","courseleader.net","cr7-soccer.store","cracksports.me>>","craftbeering.com","craftknights.com","craftsyhacks.com","cravethegood.com","cravingtasty.com","cricketforum.com","crosswordjam.net","crowsurvival.com","cruisegalore.com","crxcommunity.com","cryptofactss.com","ctx1300forum.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cupfulofkale.com","curbingcarbs.com","cybercityhelp.in","cyclingabout.com","daciaforum.co.uk","daenskitchen.com","dailydiylife.com","dailyfreeman.com","dailytribune.com","dailyuploads.net","dakotaforumz.com","danielsplate.com","darknessporn.com","darlingquote.com","dartsstreams.com","dashofsanity.com","databasefaqs.com","dataunlocker.com","deliacreates.com","delishdlites.com","desertxforum.com","destiny2zone.com","detikkebumen.com","dfarq.homeip.net","diamondlobby.com","diavel-forum.com","diecastcrazy.com","dieselforums.com","directupload.net","discoverpods.com","disfordisney.com","dishedbykate.com","dishesdelish.com","disneydining.com","divascancook.com","dobermantalk.com","dodgedurango.net","dodgeevforum.com","dogfoodsmart.com","dogsbestlife.com","dogscatspets.org","dogsonplanes.com","dolphinstalk.com","donanimhaber.com","donghuaworld.com","dormroomcook.com","down.dataaps.com","downloadrips.com","drivenwheels.com","drivinggeeks.com","drummagazine.com","drummerworld.com","dryscalpgone.com","duramaxforum.com","eandpcrochet.com","eastbaytimes.com","eatdrinkpure.com","ebikerforums.com","echelonforum.com","elantraforum.com","elantrasport.com","ellieandco.co.uk","emojikeyboard.io","empire-streamz.*","enclaveforum.net","encyclopedia.com","enginepatrol.com","envistaforum.com","epawaweather.com","eregulations.com","esportstales.com","euphoriazine.com","evoqueforums.net","excelsemipro.com","explorertalk.com","extremehowto.com","f150ecoboost.net","facilycasero.com","familyporner.com","fashionbeans.com","fatimafarmer.com","favoyeurtube.net","feastandwest.com","feedmephoebe.com","feedthepudge.com","femalefoodie.com","ferrari-talk.com","fiberglassrv.com","filecatchers.com","filespayouts.com","filmcolossus.com","financacerta.com","findcatnames.com","findmyguitar.com","firearmstalk.com","firstdown.studio","flagandcross.com","flamingotoes.com","flatpanelshd.com","flavorfulife.com","flavormosaic.com","floorcritics.com","flyfishing.co.uk","fontsforpeas.com","foodcrumbles.com","foodieaholic.com","foodiefiasco.com","foodrenegade.com","foodrepublic.com","football-2ch.com","fordexplorer.org","fordfullsize.com","fordstnation.com","forthefamily.org","forthefrills.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","frugalginger.com","fufuskitchen.com","fullhdfilmizle.*","fullofplants.com","fullxxxmovies.me","funintheyard.com","fynesdesigns.com","g6ownersclub.com","gadgetreview.com","gamesrepacks.com","gardentherapy.ca","garminrumors.com","gatherlemons.com","gaydelicious.com","gbmwolverine.com","genialetricks.de","getmorevocab.com","getonmyplate.com","gettystewart.com","gina-michele.com","ginaccreates.com","gingerdivine.com","giuliaforums.com","giurgiuveanul.ro","gl1800riders.com","glamournglow.com","gledajcrtace.xyz","glow-diaries.com","gmdietforums.com","gminsidenews.com","gmsquarebody.com","godstoryinfo.com","goingconcern.com","golfsidekick.com","gopresstimes.com","gourmetscans.net","govalleykids.com","grassfedgirl.com","greatschools.org","grecaleforum.com","grillonadime.com","grosgrainfab.com","gsm-solution.com","guineapig101.com","guitaradvise.com","guitarstrive.com","hallofseries.com","handgunforum.net","happyinshape.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","hechosfizzle.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hondacb1000r.com","hondaevforum.com","hondaforeman.com","hornetowners.com","hotcopper.com.au","howsweeteats.com","huskercorner.com","husseinezzat.com","idmextension.xyz","ikarishintou.com","ildcatforums.net","imagereviser.com","impalaforums.com","infinitiqx30.org","infinitiqx50.org","infinitiqx60.org","infinitiqx80.org","infinityfree.com","inspiralized.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","jukeforums.co.uk","julieblanner.com","justblogbaby.com","justfullporn.net","kakarotfoot.ru>>","kawasakiz650.com","ketolifetalk.com","khatrimazafull.*","kianiroforum.com","kijolifehack.com","kimscravings.com","kingstreamz.site","kitchendivas.com","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kodiakowners.com","ktm1090forum.net","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","laurafuentes.com","lexusevforum.com","lexusnxforum.com","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","magnetoforum.com","magnumforumz.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","marlinowners.com","maseratilife.com","mathplayzone.com","maverickchat.com","mazda3forums.com","meconomynews.com","medievalists.net","megapornpics.com","millionscast.com","moddedraptor.com","moderncamaro.com","modularfords.com","moneycontrol.com","mostlymorgan.com","mountainbuzz.com","moviesmod.com.pl","mrproblogger.com","mudinmyblood.net","mullenowners.com","mybikeforums.com","mydownloadtube.*","mylargescale.com","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newf150forum.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nissanforums.com","nissanmurano.org","nocrumbsleft.net","nordenforums.com","o2tvseries4u.com","ojearnovelas.com","onionstream.live","optimaforums.com","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","perfectunion.com","phinphanatic.com","piranha-fury.com","plainchicken.com","planetisuzoo.com","player.buffed.de","plumbingzone.com","powerover.online","powerover.site>>","predatortalk.com","preludepower.com","pricearchive.org","programme-tv.net","protrumpnews.com","pursuitforum.com","puzzlegarage.com","r6messagenet.com","raetsel-hilfe.de","rangerforums.net","ranglerboard.com","ranglerforum.com","raptorforumz.com","readingeagle.com","rebajagratis.com","redbirdrants.com","repack-games.com","rinconriders.com","ripexbooster.xyz","risttwisters.com","rocketnews24.com","rollingstone.com","routerforums.com","rsoccerlink.site","rule34hentai.net","s1000rrforum.com","saradahentai.com","scioniaforum.com","scionimforum.com","seat-forum.co.uk","segwayforums.com","serial1forum.com","shercoforums.com","shotgunworld.com","shutterstock.com","skidrowcodex.net","skincaretalk.com","smartermuver.com","smartevforum.com","sniperforums.com","solitairehut.com","sonataforums.com","south-park-tv.fr","soxprospects.com","specialstage.com","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","starlinktalk.com","statecollege.com","stellanspice.com","stelvioforum.com","stillcurtain.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","stromerforum.com","stromtrooper.com","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","team-integra.net","techkhulasha.com","telcoinfo.online","terrainforum.com","terrainforum.net","teslabottalk.com","text-compare.com","thebakermama.com","thebassholes.com","theboxotruth.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","theflowspace.com","thefpsreview.com","thegadgetking.in","thelandryhat.com","thelawnforum.com","thelinuxcode.com","thelupussite.com","thelureforum.com","thenerdstash.com","thenewcamera.com","thescranline.com","thevikingage.com","thewatchsite.com","titanxdforum.com","tomshardware.com","topvideosgay.com","total-sportek.to","toyotanation.com","tractorforum.com","trainerscity.com","trapshooters.com","trendytalker.com","trocforums.co.uk","tucson-forum.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","usmle-forums.com","utahwildlife.net","v8bikeriders.com","valeriabelen.com","vancouversun.com","veggieboards.com","venuedrivers.com","veryfreeporn.com","vichitrainfo.com","viralxxxporn.com","vizslaforums.com","voiranime.stream","volvo-forums.com","volvoevforum.com","volvov40club.com","voyeurfrance.net","vulcanforums.com","vwatlasforum.com","watchfreexxx.net","watchmmafull.com","wbschemenews.com","weblivehdplay.ru","whipperberry.com","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","x-trail-uk.co.uk","xclassforums.com","xhamsterporno.mx","xpengevforum.com","xpowerforums.com","xsr700forums.com","yamaha-forum.net","yifysubtitles.ch","yourcountdown.to","youwatchporn.com","ziggogratis.site","100directions.com","12thmanrising.com","2-seriesforum.com","2foodtrippers.com","365cincinnati.com","48daysworkout.com","4chanarchives.com","730sagestreet.com","abarthforum.co.uk","abroadwithash.com","accelerate360.com","acurazdxforum.com","adblockplustape.*","adclickersbot.com","adffdafdsafds.sbs","advocate-news.com","afewshortcuts.com","agratefulmeal.com","aircondlounge.com","airfryerworld.com","airoomplanner.com","alidaskitchen.com","allcakeprices.com","allfortheboys.com","allmycravings.com","allnutritious.com","allthenoodles.com","allthingsdogs.com","altarofgaming.com","amandascookin.com","amrapideforum.com","amybakesbread.com","amycakesbakes.com","andhrafriends.com","andiemitchell.com","andrewzimmern.com","androidpolice.com","anightowlblog.com","anikasdiylife.com","anoffgridlife.com","antiqueradios.com","applecarforum.com","aquariumforum.com","aquiltinglife.com","armypowerinfo.com","aronaforums.co.uk","aroundthenook.com","artsandclassy.com","asimplepalate.com","asimplepantry.com","askmormongirl.com","asouthernsoul.com","aspdotnethelp.com","aspiringwinos.com","astrologyking.com","asweetpeachef.com","atastykitchen.com","atecaforums.co.uk","atlantatrails.com","atlasandboots.com","atvdragracers.com","audioassemble.com","aussieexotics.com","aussiepythons.com","auto-crypto.click","automatedhome.com","avengerforumz.com","avirtualvegan.com","awarenessdays.com","awaytothecity.com","awinterescape.com","ayunaconlaura.com","backyardables.com","backyardherds.com","badgerofhonor.com","bakeatmidnite.com","bakedambrosia.com","bakedbyrachel.com","bakemeacookie.com","bakeplaysmile.com","bakerbynature.com","bakewithjamie.com","baking-forums.com","bakingamoment.com","bakinghermann.com","ballershoesdb.com","barleyandsage.com","baseballrumors.me","basketballbuzz.ca","beargoggleson.com","beastlyenergy.com","beatthebudget.com","beautycrafter.com","beautyofbirds.com","beautytidbits.com","bebasbokep.online","beeyondcereal.com","beforeitsnews.com","bellybelly.com.au","berlyskitchen.com","besthdgayporn.com","bestporncomix.com","bestrecipebox.com","beyondkimchee.com","beyondtheflag.com","biancazapatka.com","bikergirllife.com","biteontheside.com","bitesbybianca.com","blackbeltwiki.com","blazerevforum.com","blessthismeal.com","blissfulbasil.com","blizzboygames.net","blog.tangwudi.com","boatbasincafe.com","bocadailynews.com","booboosbakery.com","bookishgoblin.com","borrowedbites.com","bottledprices.com","bottleraiders.com","boxingschedule.co","brewerfanatic.com","briana-thomas.com","brightsprouts.com","brilliantmaps.com","broccyourbody.com","broncoevforum.com","buggyandbuddy.com","buildabreak.co.uk","buildtheearth.net","buildyourbite.com","bulldogbreeds.com","butterbeready.com","bwillcreative.com","bykelseysmith.com","cadryskitchen.com","cagesideseats.com","calgaryherald.com","caliberforums.com","caliberforumz.com","camchickscaps.com","camillestyles.com","camperupgrade.com","cancerrehabpt.com","caninejournal.com","caralynmirand.com","carensureplan.com","carolbeecooks.com","castironforum.com","casualepicure.com","casualfoodist.com","cayenneforums.com","cdn.tiesraides.lv","chachingqueen.com","champsorchumps.us","chaptercheats.com","chargerforums.com","chargerforumz.com","chiselandfork.com","cichlid-forum.com","cillacrochets.com","cinemastervip.com","cinnamonsnail.com","circuitsforum.com","city-guide.london","cjeatsrecipes.com","claplivehdplay.ru","classicparker.com","classyclutter.net","claudiastable.com","clearlycoffee.com","cleverjourney.com","closetcooking.com","cloudykitchen.com","clubcrosstrek.com","cluckclucksew.com","clutterkeeper.com","coachrallyrus.com","cockroachzone.com","cocokara-next.com","coffeeatthree.com","coffeecopycat.com","coloradodaily.com","commandertalk.com","computerfrage.net","computerzilla.com","conanfanatics.com","convertbinary.com","cookathomemom.com","cookedbyjulie.com","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cookingmaniac.com","cookitwithtim.com","cookwithkushi.com","cool-style.com.tw","cosplayadvice.com","couponingfor4.net","crackstreamer.net","craftsonsea.co.uk","craftymorning.com","crazybusymama.com","crazyforcrust.com","crazytogether.com","createandfind.com","creepycatalog.com","crochettoplay.com","crosswordbuzz.com","crowdworknews.com","cruisemummy.co.uk","cruisersforum.com","crvownersclub.com","cryptednews.space","crystaldigest.com","cubscoutideas.com","cucinabyelena.com","cuckoo4design.com","culturedtable.com","customdakotas.com","custommagnums.com","dailybulletin.com","dailydemocrat.com","dailysoapdish.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","daringgourmet.com","dawnofthedawg.com","daytonaowners.com","debsdailydish.com","deepgoretube.site","deltiasgaming.com","derrickriches.com","desertnaturals.me","dessertfortwo.com","deutschepornos.me","diabetesforum.com","disheswithdad.com","dishingdelish.com","disneydreamer.com","disneyfanatic.com","ditjesendatjes.nl","dl.apkmoddone.com","dodgeintrepid.net","dogingtonpost.com","dollopofdough.com","dolphinnation.com","donnadundas.co.uk","drinkspartner.com","drivemehungry.com","drivenbydecor.com","drizzleanddip.com","drmonicabravo.com","ducatimonster.org","dumblittleman.com","durangoforumz.com","earthsfriends.com","easygoodideas.com","easynotecards.com","eatingonadime.com","eatlittlebird.com","eatwithcarmen.com","ecoenergygeek.com","economicshelp.org","economictimes.com","ecosportforum.com","electricmommy.com","electricteeth.com","emilyfabulous.com","empressofdirt.net","enchartedcook.com","envisionforum.com","epaceforums.co.uk","epicgardening.com","errenskitchen.com","essenparadies.com","essentialketo.com","etransitforum.com","eurasiareview.com","euro2024direct.ru","everestowners.com","everydayannie.com","everydaymaven.com","everylastbite.com","evolvingtable.com","extremotvplay.com","fadeawayworld.net","familydinners.com","familyroadtrip.co","fantabulosity.com","farmersjournal.ie","farmwifecooks.com","fetcheveryone.com","fiat500owners.com","fiberfluxblog.com","fiestafaction.com","filmesonlinex.org","filosofashion.com","financialpost.com","firstforwomen.com","fitnesssguide.com","fivehearthome.com","flooringforum.com","fmbrotherhood.com","focusfanatics.com","foodieandwine.com","foodologygeek.com","foodtasticmom.com","footballrumors.me","footprinthero.com","fordauthority.com","fordownloader.com","form.typeform.com","formatlibrary.com","fort-shop.kiev.ua","forum.mobilism.me","fosbasdesigns.com","fpaceforums.co.uk","fraicheliving.com","frameratetest.com","francevoyager.com","frearbroslabs.com","freemagazines.top","freeporncomic.net","freethesaurus.com","freightcourse.com","french-streams.cc","fromtheangels.com","frontrangefed.com","frugalfanatic.com","frugalforless.com","frugalreality.com","frugalvillage.com","funcraftskids.com","funfinderclub.com","funfoodfrolic.com","funtasticlife.com","fwmadebycarli.com","galonamission.com","gamejksokuhou.com","gamerzgateway.com","gamesmountain.com","gardenerspath.com","gardeningelsa.com","garlicandzest.com","gasserhotrods.com","gaypornhdfree.com","generatorgrid.com","genesisforums.com","genesisforums.org","gentlenursery.com","geocaching101.com","gfactorliving.com","gimmesomeoven.com","girlcarnivore.com","girlscangrill.com","givemehistory.com","globalstreams.xyz","goldwingfacts.com","goodcarbadcar.net","gooddinnermom.com","gourbanhiking.com","greatlakes4x4.com","greedygourmet.com","gritsandgouda.com","grizzlyowners.com","grizzlyriders.com","growagoodlife.com","growingslower.com","grownandflown.com","grumpyrecipes.com","guitarcommand.com","guitarscanada.com","gurlgonegreen.com","havaneseforum.com","hdfilmcehennemi.*","headlinerpost.com","hemitruckclub.com","hentaitube.online","heresy-online.net","hindimoviestv.com","hollywoodlife.com","houseandgarden.co","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","idownloadblog.com","iheartnaptime.net","impalassforum.com","infinityscans.net","infinityscans.org","infinityscans.xyz","innateblogger.com","intouchweekly.com","ipaceforums.co.uk","iphoneincanada.ca","islamicfinder.org","jaguarxeforum.com","jaysbrickblog.com","jeepcommander.com","jeeptrackhawk.org","jockeyjournal.com","justlabradors.com","kawasakiworld.com","kbconlinegame.com","kfx450central.com","kiasoulforums.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","laughingsquid.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lexusrcowners.com","lexusrxowners.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","mamainastitch.com","marineinsight.com","mdzsmutpcvykb.net","mercurycougar.net","miaminewtimes.com","midhudsonnews.com","midwest-horse.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","mtc4.igimsopd.com","multicanaistv.com","musicfeeds.com.au","myjeepcompass.com","myturbodiesel.com","nationaltoday.com","newtahoeyukon.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","nissan-navara.net","nodakoutdoors.com","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","ohiosportsman.com","okusama-kijyo.com","olympicstreams.co","onceuponachef.com","ondemandkorea.com","ontariofarmer.com","opensubtitles.org","ottawacitizen.com","outdoormatome.com","palisadeforum.com","paracordforum.com","paranormal-ch.com","pavementsucks.com","pcgeeks-games.com","peugeotforums.com","pinayscandalz.com","pioneerforums.com","pistonpowered.com","player.pcgames.de","plugintorrent.com","polarisriders.com","pornoenspanish.es","preludeonline.com","prepperforums.net","pressandguide.com","presstelegram.com","prowlerforums.net","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","ram1500diesel.com","ramrebelforum.com","read-onepiece.net","recipetineats.com","redlineforums.com","reidoscanais.life","renegadeforum.com","republicbrief.com","restlessouter.net","restlingforum.com","restmacizle23.cfd","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","santafeforums.com","savemoneyinfo.com","sayphotobooth.com","scirocconet.co.uk","seatroutforum.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","shootersforum.com","shootingworld.com","shotgunforums.com","shugarysweets.com","sideplusleaks.net","sierraevforum.com","siliconvalley.com","simplywhisked.com","sitm.al3rbygo.com","skylineowners.com","soccerworldcup.me","solsticeforum.com","solterraforum.com","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","steamidfinder.com","steamseries88.com","stellarthread.com","stingerforums.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","subaruxvforum.com","sumaburayasan.com","superherohype.com","supertipzz.online","suzuki-forums.com","suzuki-forums.net","suzukicentral.com","t-shirtforums.com","tablelifeblog.com","talkclassical.com","talonsxsforum.com","taycanevforum.com","thaihotmodels.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedieselstop.com","thefreebieguy.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","thyroidboards.com","tightsexteens.com","tiguanevforum.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tnhuntingclub.com","tokusatsuindo.com","toyotacelicas.com","toyotaevforum.com","tradingfact4u.com","traverseforum.com","truyen-hentai.com","tundraevforum.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","twowheelforum.com","umatechnology.org","undeadwalking.com","unsere-helden.com","v6performance.net","velarforums.co.uk","velosterturbo.org","victoryforums.com","viralitytoday.com","visualnewshub.com","volusiariders.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","wutheringwaves.gg","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","yourcupofcake.com","10thcivicforum.com","11magnolialane.com","15minutebeauty.com","4-seriesforums.com","4runner-forums.com","502streetscene.net","5thrangerforum.com","5thwheelforums.com","8020automotive.com","abakingjourney.com","abcdeelearning.com","abcsofliteracy.com","abeautifulmess.com","abrotherabroad.com","accuretawealth.com","acooknamedmatt.com","acousticbridge.com","acraftyconcept.com","acrylicpouring.com","adamantkitchen.com","adaptive.marketing","adayinourshoes.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","adventureinyou.com","advertisertape.com","aflavorfulbite.com","aflavorjournal.com","aglassofbovino.com","ahnfiredigital.com","airhostacademy.com","airsoftsociety.com","alexandracooks.com","alittleandalot.com","allabouttattoo.com","allaboutthetea.com","allsalonprices.com","allthingsmamma.com","allthingsvegas.com","amarcoplumbing.com","amateurprochef.com","american-rails.com","americanoceans.org","anestwithayard.com","anewwayforward.org","animated-teeth.com","animesorionvip.net","antimaximalist.com","apetogentleman.com","apieceoftravel.com","aquariumadvice.com","aquariumgenius.com","aquariumsource.com","aquariumsphere.com","arayofsunlight.com","areinventedmom.com","arrestyourdebt.com","artfrommytable.com","artsy-traveler.com","artycraftykids.com","asialiveaction.com","asianclipdedhd.net","askannamoseley.com","astrakforums.co.uk","astrology-seek.com","atastefortravel.ca","atlasstudiousa.com","atsloanestable.com","aubreyskitchen.com","australiaforum.com","authenticateme.xyz","authenticforum.com","aviatorinsider.com","avirtuouswoman.org","avocadoskillet.com","axleandchassis.com","b-inspiredmama.com","backforseconds.com","backtoourroots.net","badbatchbaking.com","bakeitwithlove.com","bakingmehungry.com","ballexclusives.com","barkingroyalty.com","barleyandbirch.com","barstoolsports.com","baseballchannel.jp","bearfoottheory.com","becomingunbusy.com","bedbugsinsider.com","bemorewithless.com","beneathmyheart.net","bestappetizers.com","bestboatreport.com","bestgamingtips.com","bestreamsports.org","bestsportslive.org","betterfoodguru.com","beyondfrosting.com","bhookedcrochet.com","bicycle-guider.com","bigsmallscreen.com","bimmerforums.co.uk","birdwatchinghq.com","blackberrybabe.com","blackcrossword.com","blackgirlnerds.com","blackporncrazy.com","blacksmithtalk.com","blog-peliculas.com","blogredmachine.com","bluecinetech.co.uk","bluemediastorage.*","boardgamequest.com","bombshellbling.com","boomhavenfarms.com","boothfindernyc.com","boraboraphotos.com","bosoxinjection.com","boundlessroads.com","bowerpowerblog.com","brianakdesigns.com","browneyedbaker.com","brownthumbmama.com","bullnettlenews.com","burncitysports.com","burntpelletbbq.com","businessinsider.de","businessinsider.jp","busydaydinners.com","butterandbliss.net","cactusforums.co.uk","cadillacforums.com","cakebycourtney.com","calculator.academy","calculatorsoup.com","campsitephotos.com","can-amelectric.com","careercontessa.com","carnivalforums.com","carolinevencil.com","carriecarvalho.com","casamiacooking.com","cattitudedaily.com","celebratednest.com","celebschitchat.com","centslessdeals.com","challengerlife.com","challengertalk.com","chicagotribune.com","childhoodmagic.com","chilesandsmoke.com","chinacarforums.com","chooseveganism.org","ciaoflorentina.com","cinderstravels.com","classic-armory.org","cleanfoodcrush.com","cleanplatemama.com","clevelanddaily.com","cleverlysimple.com","clickondetroit.com","climbingforums.com","clubtraderjoes.com","cmaxownersclub.com","cmbarndominium.com","cocinarepublic.com","cockroachfacts.com","cockroachsavvy.com","codewordsolver.com","codingnepalweb.com","coffeeforums.co.uk","coldsorescured.com","collegefootball.gg","collegegazette.com","color-meanings.com","coloradodiesel.org","colormadehappy.com","comestayawhile.com","conscioushacker.io","consumerboomer.com","contractortalk.com","cookedandloved.com","cookiesandcups.com","cookiesfordays.com","cookingorgeous.com","cookingwithlei.com","cookingwithria.com","cookinwithmima.com","cookitrealgood.com","cookwithmanali.com","correotemporal.org","corsaeforums.co.uk","costaricavibes.com","cottageandvine.net","countrydiaries.com","couponcravings.com","cr7-soccer.store>>","craftberrybush.com","craftsbyamanda.com","craftyartideas.com","craftycookbook.com","cravetheplanet.com","creeklinehouse.com","crisslecrossle.com","crochetncrafts.com","crockpotladies.com","crooksandliars.com","crossbownation.com","crossplaygames.com","crowdedkitchen.com","cruisingkids.co.uk","crystalandcomp.com","culinaryginger.com","culinaryshades.com","customfighters.com","customonesixth.com","cutnmakecrafts.com","cyberquadforum.com","cybertrucktalk.com","dadcooksdinner.com","dadsguidetowdw.com","dailycrypticle.com","dailyveganmeal.com","dakota-durango.com","daniellewalker.com","dateyourspouse.com","dcworldscollide.gg","decorandthedog.net","deepfriedhoney.com","defendersource.com","defensivecarry.com","delicioustable.com","descargaspcpro.net","designthusiasm.com","destinyislands.com","devotedgrandma.com","dgcoursereview.com","diamondcentric.net","dicecitysports.com","diecastxchange.com","dieselramforum.com","digital-thread.com","dimitrasdishes.com","dinneratthezoo.com","dirtbikeplanet.com","discoverysport.net","discusscooking.com","discussingfilm.net","disneyfoodblog.com","distanceparent.org","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","doityourselfrv.com","downshiftology.com","dreamspiritual.org","drugstoredivas.net","dutchmenowners.org","eatathomecooks.com","eatfigsnotpigs.com","eatingbirdfood.com","eatingbyelaine.com","eatingeuropean.com","eatingwithzion.com","eatplant-based.com","eatwithclarity.com","eazypeazymealz.com","effortlessgent.com","elantragtforum.com","elconfidencial.com","electricians.forum","electro-torrent.pl","electronicshub.org","eleganceechoes.com","eliteprospects.com","elizabethrider.com","empire-streaming.*","energydrinkhub.com","engineerboards.com","equinoxevforum.com","erinliveswhole.com","esprinterforum.com","everydaydishes.com","everydayeileen.com","exploringvegan.com","extinctanimals.org","factsinstitute.com","fairygardendiy.com","familycheftalk.com","familyfelicity.com","farmersalmanac.com","farmingshelter.com","farmwifedrinks.com","fearlessdining.com","feastingathome.com","feelgoodfoodie.net","feelingfoodish.com","fictionhorizon.com","filmizlehdizle.com","financenova.online","firebirdnation.com","firstdayofhome.com","fishtankreport.com","fitasamamabear.com","fjlaboratories.com","flacdownloader.com","flawlessfood.co.uk","flighthacks.com.au","flowerglossary.com","fluentincoffee.com","focusdailynews.com","fodmapeveryday.com","foodsharkmarfa.com","footballchannel.jp","fordfusionclub.com","fordinsidenews.com","foreverwingman.com","forgetfulmomma.com","forkknifeswoon.com","forscubadivers.com","fragrancetoday.com","freeadultcomix.com","freepublicporn.com","freshcoasteats.com","fridasofiaeats.com","fromabcstoacts.com","frugalfarmwife.com","frugalfun4boys.com","frugallyblonde.com","fullsizebronco.com","funcheaporfree.com","funclothcrafts.com","funinfairfaxva.com","funktionalhome.com","galinhasamurai.com","gamedayculture.com","gamerdiscovery.com","games.arkadium.com","gardenandbloom.com","gardenersoasis.com","gardenersyards.com","gatherforbread.com","gaypornmasters.com","gdrivelatinohd.net","genesisevforum.com","geographyrealm.com","georgiapacking.org","germancarforum.com","getmeonacruise.com","giangiskitchen.com","gimmedelicious.com","ginabnutrition.com","ginghamgardens.com","glorioustreats.com","glueandglitter.com","gluesticksblog.com","gocurrycracker.com","goldwingowners.com","golfcartreport.com","goodlookingtan.com","goodnessavenue.com","govexplained.co.uk","grainfreetable.com","grcorollaforum.com","greeleytribune.com","greenlitebites.com","grillinwithdad.com","grillo-designs.com","grizzlycentral.com","gymnastics-now.com","halloweenforum.com","haveibeenpwned.com","hdstreetforums.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hondaatvforums.net","hopepaste.download","hungrypaprikas.com","hyundai-forums.com","hyundaitucson.info","iamhomesteader.com","iawaterfowlers.com","indianshortner.com","insider-gaming.com","insightcentral.net","insurancesfact.com","islamicpdfbook.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","jocjapantravel.com","kawasakiversys.com","kiatuskerforum.com","kijyomatome-ch.com","kirbiecravings.com","kodiaqforums.co.uk","laleggepertutti.it","lancerregister.com","landroversonly.com","leckerschmecker.me","lifeinleggings.com","lincolnevforum.com","listentotaxman.com","liveandletsfly.com","makeincomeinfo.com","maketecheasier.com","manchesterworld.uk","marinetraffic.live","marvelsnapzone.com","maverickforums.net","mediaindonesia.com","metalguitarist.org","millwrighttalk.com","moddedmustangs.com","modelrailforum.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","motorhomefacts.com","moviesonlinefree.*","mrmakeithappen.com","myquietkitchen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","ninja400riders.com","nissancubelife.com","nlab.itmedia.co.jp","nourishedbynic.com","observedtrials.net","oklahomahunter.net","olverineforums.com","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","oodworkingtalk.com","orkingdogforum.com","orldseafishing.com","ourbeagleworld.com","pacificaforums.com","paintballforum.com","pancakerecipes.com","panigalev4club.com","passportforums.com","pathfindertalk.com","perfectmancave.com","player.gamezone.de","playoffsstream.com","polestar-forum.com","pornfetishbdsm.com","porno-baguette.com","porscheevforum.com","promasterforum.com","prophecyowners.com","q3ownersclub.co.uk","ranglerjlforum.com","readcomiconline.li","reporterherald.com","rimfirecentral.com","ripcityproject.com","roadbikereview.com","roadstarraider.com","roadtripliving.com","runnersforum.co.uk","runtothefinish.com","samsungmagazine.eu","scarletandgame.com","scramblerforum.com","shipsnostalgia.com","shuraba-matome.com","siamblockchain.com","sidelionreport.com","sidexsideworld.com","skyscrapercity.com","slingshotforum.com","snowplowforums.com","soft.cr3zyblog.com","softwaredetail.com","spoiledmaltese.com","sportbikeworld.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","starbikeforums.com","steamclouds.online","steamcommunity.com","stevesnovasite.com","stingrayforums.com","stormtrakforum.com","stream.nflbox.me>>","strtapeadblocker.*","subarubrzforum.com","subaruforester.org","talkcockatiels.com","talkparrotlets.com","tapeadsenjoyer.com","tcrossforums.co.uk","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","theendlessmeal.com","thefirearmblog.com","thepewterplank.com","thepolitistick.com","thespeedtriple.com","thestarphoenix.com","tiguanforums.co.uk","tiktokrealtime.com","times-standard.com","tips-and-tricks.co","torrentdosfilmes.*","toyotachrforum.com","transalpowners.com","travelplanspro.com","treadmillforum.com","truestreetcars.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","upownersclub.co.uk","varminthunters.com","veggiegardener.com","vincenzosplate.com","vplink.invplink.in","washingtonpost.com","watchadsontape.com","watchpornfree.info","wblaxmibhandar.com","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","yamahastarbolt.com","yariscrossclub.com","zafiraowners.co.uk","100percentfedup.com","12minuteathlete.com","208ownersclub.co.uk","23jumpmanstreet.com","2sistersmixitup.com","2sistersrecipes.com","320sycamoreblog.com","abnormalreturns.com","accordingtoelle.com","acharmingescape.com","acraftedpassion.com","activeweekender.com","acultivatednest.com","adblockstreamtape.*","addictedtodates.com","addsaltandserve.com","adventourbegins.com","adventuresofmel.com","africatwinforum.com","againstallgrain.com","airfryingfoodie.com","akb48matomemory.com","aliontherunblog.com","alittleinsanity.com","allaboutparrots.com","allfordmustangs.com","allhomerobotics.com","allthingstarget.com","allwritealright.com","alternativedish.com","alwaysusebutter.com","ambereverywhere.com","amomsimpression.com","amyinthekitchen.com","amynewnostalgia.com","andreasnotebook.com","anoregoncottage.com","antique-bottles.net","api.dock.agacad.com","apieceofrainbow.com","aplinsinthealps.com","architecturelab.net","areyouscreening.com","arkansashunting.net","arrowheadaddict.com","artsychicksrule.com","artsyfartsymama.com","ashevilletrails.com","aslobcomesclean.com","astonmartinlife.com","asumsikedaishop.com","atablefullofjoy.com","atchtalkforums.info","athletelunchbox.com","athomebyheather.com","attractiondiary.com","authoritytattoo.com","automaticwasher.org","awellstyledlife.com","bakedcollective.com","bakefromscratch.com","bakemesomesugar.com","bakinglikeachef.com","barcablaugranes.com","basicswithbails.com","basketballforum.com","basketballnoise.com","batesfamilyblog.com","bchtechnologies.com","beautyandbedlam.com","beerconnoisseur.com","believeintherun.com","bestofmachinery.com","betweencarpools.com","betweenjpandkr.blog","beyondthebutter.com","bible-knowledge.com","biblestudytools.com","bibliolifestyle.com","biggestuscities.com","biketestreviews.com","birdwatchingusa.org","bitesofwellness.com","blackcitadelrpg.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluebowlrecipes.com","bluemediadownload.*","bluestarcrochet.com","boardoftheworld.com","bowfishingforum.com","braidhairstyles.com","breadboozebacon.com","breadsandsweets.com","breakingbourbon.com","brianlagerstrom.com","brightdropforum.com","brighteyedbaker.com","brightgreendoor.com","brightrockmedia.com","brisbanekids.com.au","broncosporttalk.com","bucketlisttummy.com","budgetsavvydiva.com","buttermilkbysam.com","butternutrition.com","buythiscookthat.com","calculatemyroof.com","campercommunity.com","canuckaudiomart.com","cardcollector.co.uk","carrowaycrochet.com","carwindshields.info","cassiescroggins.com","castironrecipes.com","cavaliersnation.com","challengerforum.com","checkhookboxing.com","cheerfulchoices.com","cheflindseyfarr.com","chefnotrequired.com","chickensandmore.com","chins-n-hedgies.com","chrislovesjulia.com","chromebookforum.com","chryslerminivan.net","ciaochowbambina.com","civicsquestions.com","classyyettrendy.com","clevercreations.org","cocinarodriguez.com","collectorfreaks.com","coloredhaircare.com","coloringpageshq.com","colorpsychology.org","comfortablefood.com","commanderforums.org","commonsensehome.com","competitionplus.com","concertarchives.org","contexturesblog.com","cookeatlivelove.com","cooking-therapy.com","cookingcarnival.com","cookingforkeeps.com","cookingmydreams.com","cookingwithayeh.com","cookingwithcoit.com","cookingwithnart.com","cookwithnabeela.com","cosmetologyguru.com","countylocalnews.com","courtneyssweets.com","cozinhalegal.com.br","cozycornercharm.com","cozylittlehouse.com","craftingjeannie.com","cre8tioncrochet.com","createmindfully.com","creativecanning.com","crosswordsolver.com","cruisingfreedom.com","crystalmathlabs.com","cubesnjuliennes.com","culturedvoyages.com","curbsideclassic.com","daddylivestream.com","daisiesandpie.co.uk","damneasyrecipes.com","danslelakehouse.com","darngoodveggies.com","dealhuntingbabe.com","deerhuntersclub.com","delightfulplate.com","delishknowledge.com","designeatrepeat.com","designertrapped.com","dessertsonadime.com","detroitjockcity.com","dexterclearance.com","diaryofaquilter.com","didyouknowfacts.com","diendancauduong.com","dieself150forum.com","digitalcitizen.life","discordtemplates.me","discoverzermatt.com","dishnthekitchen.com","diysmarthomehub.com","dk.pcpartpicker.com","dodgedartforumz.com","dododsondesigns.com","domesticatedtom.com","domesticheights.com","download.megaup.net","downredbuddrive.com","dreamdictionary.org","dressedformyday.com","driveteslacanada.ca","drizzlemeskinny.com","ds4ownersclub.co.uk","duckhuntingchat.com","dvdfullestrenos.com","dwellbymichelle.com","easyrecipedepot.com","easythingstosew.com","eatinginstantly.com","eatingwitherica.com","eatlikebourdain.com","ecoboostmustang.org","edmontonjournal.com","eightforestlane.com","elcaminocentral.com","electriciantalk.com","embed.wcostream.com","emojiflashcards.com","enjoysharepoint.com","equipmenttrader.com","erinstraveltips.com","escaladeevforum.com","estrenosdoramas.net","ethanchlebowski.com","evergreenkitchen.ca","everydaythrifty.com","everylittlename.com","expeditionforum.com","explorerevforum.com","familystylefood.com","fannetasticfood.com","farmgirlgourmet.com","fatgirlhedonist.com","feastingonfruit.com","ferrari296forum.com","fifteenspatulas.com","financeformulas.net","firststepeurope.com","fitandfabliving.com","fitmamarealfood.com","fitnessfooddiva.com","fittoservegroup.com","fjcruiserforums.com","fluentin3months.com","flyfishingforum.com","foodandjourneys.net","foodfolksandfun.net","foodiesterminal.com","foodstoragemoms.com","foodtruckempire.com","foodwineandlove.com","foodwithfeeling.com","foolproofliving.com","footballtransfer.ru","fordraptorforum.com","fortmorgantimes.com","fortniteinsider.com","forums.hfboards.com","fourwheeltrends.com","foxeslovelemons.com","fractuslearning.com","fragrancereview.com","franceprefecture.fr","freetoursbyfoot.com","freezermeals101.com","freshbeanbakery.com","freshoffthegrid.com","fromhousetohome.com","frugallivingmom.com","frustfrei-lernen.de","fullcoffeeroast.com","gamertelligence.com","gameslikefinder.com","gardenforindoor.com","gardenpondforum.com","garnishandglaze.com","gedpracticetest.net","genealogyspeaks.com","genesisg70forum.com","genesisg80forum.com","genevieveogleman.ca","germanshepherds.com","giftofcuriosity.com","girlgonegourmet.com","girlsvip-matome.com","girlversusdough.com","giveagirlaspoon.com","glaownersclub.co.uk","goodinthesimple.com","goodlivingguide.com","gradecalculator.com","grandbaby-cakes.com","greenbeautymama.com","guardiansnation.com","hailfloridahail.com","hardcoresledder.com","hardwoodhoudini.com","hdfilmcehennemi2.cx","hdlivewireforum.com","hedgehogcentral.com","historicaerials.com","hometownstation.com","hondarebelforum.com","honeygirlsworld.com","honyaku-channel.net","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","ilovemycockapoo.com","indycityfishing.com","infinitijxforum.com","insidetheiggles.com","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","joyfoodsunshine.com","justonecookbook.com","kenzo-flowertag.com","kiaownersclub.co.uk","kingjamesgospel.com","kitimama-matome.net","kreuzwortraetsel.de","ktmduke390forum.com","laughingspatula.com","learnmarketinfo.com","lifeandstylemag.com","lightningowners.com","lightningrodder.com","lite.duckduckgo.com","logicieleducatif.fr","louisianacookin.com","loverugbyleague.com","m.jobinmeghalaya.in","main.24jobalert.com","makeitdairyfree.com","matometemitatta.com","melskitchencafe.com","mendocinobeacon.com","michiganreefers.com","middletownpress.com","minimalistbaker.com","modeltrainforum.com","motorcycleforum.com","movie-locations.com","mtc5.flexthecar.com","mustangecoboost.net","mykoreankitchen.com","nandemo-uketori.com","natashaskitchen.com","negyzetmeterarak.hu","newjerseyhunter.com","ohiogamefishing.com","orlandosentinel.com","outlanderforums.com","paidshitforfree.com","pcgamebenchmark.com","pendidikandasar.net","personalitycafe.com","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","poradyiwskazowki.pl","pornodominicano.net","pornotorrent.com.br","preparedsociety.com","pressenterprise.com","prologuedrivers.com","promodescuentos.com","quest.to-travel.net","radio-australia.org","radio-osterreich.at","registercitizen.com","renaultforums.co.uk","reptileforums.co.uk","roguesportforum.com","rojadirectaenvivo.*","royalmailchat.co.uk","santacruzforums.com","secondhandsongs.com","shoot-yalla-tv.live","silveradosierra.com","skidrowreloaded.com","slingshotforums.com","smartkhabrinews.com","snowblowerforum.com","snowmobileforum.com","snowmobileworld.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","stormininnorman.com","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","supermotojunkie.com","sussexexpress.co.uk","suzukiatvforums.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","tarracoforums.co.uk","thecombineforum.com","thecookierookie.com","thedieselgarage.com","thefoodieaffair.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thesmokingcuban.com","thewatchforum.co.uk","thewatchseries.live","tjcruiserforums.com","trailblazertalk.com","trucs-et-astuces.co","truyentranhfull.net","tundrasolutions.com","turkishseriestv.org","valleyofthesuns.com","vintage-mustang.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","whatjewwannaeat.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","yorkshirepost.co.uk","101cookingfortwo.com","123homeschool4me.com","125ccsportsbikes.com","2008ownersclub.co.uk","500xownersclub.co.uk","aberdeenskitchen.com","absolutesports.media","accountantforums.com","adabofgluewilldo.com","adamownersclub.co.uk","adamtheautomator.com","adayinthekitchen.com","adishofdailylife.com","adultdvdparadise.com","adventuresbylana.com","agirlandagluegun.com","airfryerfanatics.com","alexjessicamills.com","alkingstickforum.com","alliancervforums.com","alliannaskitchen.com","allthepartyideas.com","allthingsthrifty.com","alltopeverything.com","allwaysdelicious.com","allysonvanhouten.com","alwayseatdessert.com","amazonastroforum.com","ambitiouskitchen.com","amodernhomestead.com","andersonandgrant.com","androidauthority.com","androidheadlines.com","angelicalbalance.com","anorcadianabroad.com","antaraownersclub.com","anysoftwaretools.com","anytimecocktails.com","arizonagunowners.com","aroundthefoghorn.com","artandthekitchen.com","artfulhomemaking.com","aseasyasapplepie.com","aswbpracticeexam.com","atlantablackstar.com","atraditionallife.com","atthepicketfence.com","aussiegreenthumb.com","aussiehomebrewer.com","averagesocialite.com","backdoorsurvival.com","backyardchickens.com","baking4happiness.com","bakingforfriends.com","bakingupmemories.com","barrescueupdates.com","bcfishingreports.com","beaglesunlimited.com","beautymasterlist.com","beekeepingforums.com","beerintheevening.com","believeinabudget.com","bellacococrochet.com","bensabaconlovers.com","bersapistolforum.com","bestmenscolognes.com","bestmp3converter.com","bigdeliciouslife.com","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","bmaxownersclub.co.uk","booknotification.com","breedingbusiness.com","breezynetworks.co.za","bricksandlogic.co.uk","brokenovenbaking.com","brushnewstribune.com","budgettravelbuff.com","buildingelements.com","butfirstwebrunch.com","butterandbaggage.com","caloriesburnedhq.com","caminoadventures.com","capitalcounselor.com","carolinafishtalk.com","carolinescooking.com","challengerforumz.com","chamberofcommerce.uk","charactercounter.com","chasingoursimple.com","chef-in-training.com","chemistrylearner.com","cherryonmysundae.com","chevycobaltforum.com","chevymalibuforum.com","chihuahua-people.com","chinasichuanfood.com","christinascucina.com","christmasonadime.com","chunkyinkentucky.com","cleangreensimple.com","cleverlyinspired.com","click.allkeyshop.com","climbingtalshill.com","cmaxownersclub.co.uk","coastalwandering.com","cocinadominicana.com","coffeeandcarpool.com","coloradoevowners.com","commandersnation.com","conceptartempire.com","confettiandbliss.com","coniferousforest.com","connoisseurusveg.com","continuousroamer.com","cookinginmygenes.com","cookinginthekeys.com","cookingintheyard.com","cookingkatielady.com","cookingperfected.com","cookingwithbliss.com","cookingwithkarli.com","cozypeachkitchen.com","crackstreamshd.click","crazymonkeygames.com","createcraftprint.com","createprintables.com","creativecolorlab.com","crinkledcookbook.com","culturedvultures.com","curlygirlkitchen.com","dailydishrecipes.com","dailynewshungary.com","dailytruthreport.com","dailywritingtips.com","dairylandexpress.com","danishealthyeats.com","danslescoulisses.com","daughtertraining.com","dearlilliestudio.com","debtfreefamily.co.uk","defienietlynotme.com","dehydratorliving.com","deliciousonadime.com","delscookingtwist.com","derelictplaces.co.uk","desotocountynews.com","detailingworld.co.uk","diaryofafitmommy.com","digitalcorvettes.com","dimensionofstuff.com","dinnersdonequick.com","disabledveterans.org","discovertheburgh.com","discussfastpitch.com","dishingupthedirt.com","divinedaolibrary.com","doctorsofrunning.com","doesitreallywork.org","dominicancooking.com","dontmesswithmama.com","downsizingdinner.com","draftleunlimited.com","dribbblegraphics.com","drinkswithdanica.com","ducttapeanddenim.com","duggarfamilyblog.com","earn.punjabworks.com","easyhomemadelife.com","easytravelpoints.com","eatbetterrecipes.com","eating-made-easy.com","ecoconsumerguide.com","educationlibrary.org","effortlessfoodie.com","electricbluefood.com","eletric-vehicles.com","eliserosecrochet.com","emergencyprepguy.com","entertainingdiva.com","entertainmentnow.com","erinscozykitchen.com","erynwhalenonline.com","everyday-reading.com","everydaytechvams.com","everylittlecrumb.com","everythingmarina.com","everythingtrivia.com","exclusivepumping.com","exploreessaouira.com","extraordinarybbq.com","fabulesslyfrugal.com","factsjustforkids.com","falasteenifoodie.com","familiesgotravel.com","fashionablefoods.com","fastingwithlaura.com","favfamilyrecipes.com","fillmyrecipebook.com","financesuperhero.com","financialpanther.com","financialsamurai.com","findingtimetofly.com","finearttutorials.com","finishedwithsalt.com","fitbottomedgirls.com","fitmittenkitchen.com","fixthisbuildthat.com","floridapanhandle.com","flouronmyfingers.com","foodfaithfitness.com","foodforfitness.co.uk","foodiewithfamily.com","foodsharingvegan.com","fordforumsonline.com","fordmuscleforums.com","forensicfilesnow.com","forkinthekitchen.com","foxhollowcottage.com","franceadventurer.com","freedomcardboard.com","freedomresidence.com","freestreams-live.*>>","freshaprilflours.com","fridaywereinlove.com","fromscratchdaily.com","frugalyabundante.com","fullfilmizlesene.net","futabasha-change.com","gardening-forums.com","gardeningchannel.com","garnishwithlemon.com","germanyfootsteps.com","gesundheitsfrage.net","getbusygardening.com","gingerhomemaking.com","glutenfreepalate.com","goldenlucycrafts.com","gonnawantseconds.com","goodenoughmoming.com","goodmorningquote.com","goosehuntingchat.com","grayingwithgrace.com","greenesportszone.com","greensnchocolate.com","greentractortalk.com","greetingcardpoet.com","gt86ownersclub.co.uk","guidetodetailing.com","heartlife-matome.com","hometheatershack.com","hondarebel3forum.com","houstonchronicle.com","hyundaikonaforum.com","ibreatheimhungry.com","indianasportsman.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jeepcherokeeclub.com","jljbacktoclassic.com","journal-advocate.com","jukeownersclub.co.uk","juliescafebakery.com","kawasakininja300.com","knittingparadise.com","kugaownersclub.co.uk","labradoodle-dogs.net","labradorforums.co.uk","lamborghini-talk.com","landroverevforum.com","laweducationinfo.com","legendsofmodding.org","lehighvalleylive.com","letemsvetemapplem.eu","librarium-online.com","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","main.sportswordz.com","maturegrannyfuck.com","mazda2revolution.com","mazda3revolution.com","meilleurpronostic.fr","menstennisforums.com","mercedesclaforum.com","mercedesgleforum.com","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","motorcitybengals.com","motorcycleforums.net","mt-soft.sakura.ne.jp","muscularmustangs.com","mustangevolution.com","mylawnmowerforum.com","nationalgunforum.com","neighborfoodblog.com","nissankicksforum.com","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","noteownersclub.co.uk","onechicagocenter.com","onelittleproject.com","onesixthwarriors.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","panamericaforums.com","pasadenastarnews.com","performanceboats.com","pickleballertalk.com","player.smashy.stream","pocketbikeplanet.com","polarisatvforums.com","popularmechanics.com","pornstarsyfamosas.es","preservationtalk.com","receitasdaora.online","redcurrantbakery.com","relevantmagazine.com","reptilesmagazine.com","reviewingthebrew.com","rollsroyceforums.com","scoutmotorsforum.com","securenetsystems.net","seededatthetable.com","silveradoevforum.com","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","springfieldforum.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","tasteandtellblog.com","techsupportforum.com","thefirearmsforum.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","thekitchenmagpie.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videoeditingtalk.com","videostreaming.rocks","visualcapitalist.com","volksliederarchiv.de","windsorexpress.co.uk","yetiownersclub.co.uk","yorkshire-divers.com","yourhomebasedmom.com","yourpatientvoice.com","yugioh-starlight.com","100daysofrealfood.com","1337x.ninjaproxy1.com","365daysofcrockpot.com","abowlfulloflemons.net","acasaencantada.com.br","aconsciousrethink.com","afarmgirlsdabbles.com","ainttooproudtomeg.com","akronnewsreporter.com","alekasgettogether.com","allpurposeveggies.com","allthedifferences.com","allthingsjewelryy.com","alwaysfromscratch.com","amylattacreations.com","anythingtranslate.com","applefitnessforum.com","applegreencottage.com","apracticalwedding.com","aquariustraveller.com","arizonasportsfans.com","aspicyperspective.com","asweetalternative.com","aturtleslifeforme.com","audreyslittlefarm.com","austinbassfishing.com","az900practicetest.com","backyardknoxville.com","bakesbybrownsugar.com","barnsleychronicle.com","basic-mathematics.com","basketballbuckets.com","basketballhistory.org","beekeepingforum.co.uk","benidormandbeyond.com","biblemoneymatters.com","bigleaguepolitics.com","birdwatchingdaily.com","biscuitsandburlap.com","blessherheartyall.com","blissfullylowcarb.com","bloominghomestead.com","bonvoyagewithkids.com","bowfishingcountry.com","broncoraptorforum.com","brooklynlimestone.com","brownsnationforum.com","burlington-record.com","busyfamilyrecipes.com","busylittlekiddies.com","butterloveandsalt.com","cakemehometonight.com","californiaevforum.com","campingforfoodies.com","canamspyderforums.com","candlepowerforums.com","capitalizemytitle.com","carolinahoneybees.com","carrotsandcookies.com","casecoltingersoll.com","ccmapracticetests.com","celebratingsimply.com","celebritynetworth.com","celiacandthebeast.com","centsationalstyle.com","chamberofcommerce.com","chevyequinoxforum.com","chocolatesandchai.com","choosingnutrition.com","classiccasualhome.com","classicrockforums.com","cleananddelicious.com","clevergirlfinance.com","client.pylexnodes.net","clovermeadowsbeef.com","collinsdictionary.com","coloradofisherman.com","columbusnavigator.com","confettidaydreams.com","cookdinnertonight.com","cookingforpeanuts.com","cookingupmemories.com","cookingwithcarlee.com","cookingwithclaudy.com","cookingwithgenius.com","cookingwithmammac.com","cookingwithparita.com","cookprimalgourmet.com","cordcuttingreport.com","cornercoffeestore.com","corollacrossforum.com","countrylifedreams.com","countrythangdaily.com","couponingtodisney.com","craftinghappiness.com","craftylittlegnome.com","cravinghomecooked.com","crazyvegankitchen.com","creative-culinary.com","creativecaincabin.com","crochet365knittoo.com","crochetwithcarrie.com","crunchtimekitchen.com","cryptoquoteanswer.com","dabblesandbabbles.com","deliciouslyrushed.com","delightfulmomfood.com","denversportsradio.com","desertislanddishes.co","dessertsanddrinks.com","developgoodhabits.com","dimplesandtangles.com","dinnerthendessert.com","disneytouristblog.com","divorceandfinance.org","doityourselfdivas.com","dollarstorecrafts.com","domesticdreamboat.com","domesticsuperhero.com","dragontranslation.com","easybudgetrecipes.com","easydinnerrecipes.com","easydrawingguides.com","easyfamilyrecipes.com","eatsomethingvegan.com","eatwellspendsmart.com","eatyourselfskinny.com","economicsonline.co.uk","ecstatichappiness.com","edibleperspective.com","elementownersclub.com","elisabethmcknight.com","entirelyelizabeth.com","eroticmoviesonline.me","eutawstreetreport.com","eventstocelebrate.net","everydayelizabeth.com","everything-delish.com","everything2stroke.com","exactlywhatistime.com","expertworldtravel.com","fancymicebreeders.com","feastforafraction.com","feedingthefrasers.com","feelslikehomeblog.com","financialbestlife.com","findingseaturtles.com","firsthomelovelife.com","flippedupsidedown.com","foodforlifegarden.com","foodmetamorphosis.com","foodnetworkgossip.com","fordtruckfanatics.com","forestriverforums.com","foreverwallpapers.com","forgetsugarfriday.com","forum.release-apk.com","freemonogrammaker.com","freethankyounotes.com","fromachefskitchen.com","funwithoutfodmaps.com","fusionsportforums.com","gardentractortalk.com","garlicsaltandlime.com","gatherednutrition.com","gentlemansgazette.com","getonmysaladplate.com","giftofhospitality.com","gimmethegoodstuff.org","glutenfreeguidehq.com","goldrefiningforum.com","goodenessgracious.com","gracelikerainblog.com","grazedandenthused.com","greaterlongisland.com","greedygirlgourmet.com","greenweddingshoes.com","gritsandpinecones.com","groundbeefrecipes.com","gulfcoastjourneys.com","hackerranksolution.in","hollywoodreporter.com","homesteadingtoday.com","hondacivicforum.co.uk","hondapioneerforum.com","hoodtrendspredict.com","indianmotorcycles.net","invoice-generator.com","iphoneographytalk.com","jeeprenegadeforum.com","journaldemontreal.com","journey.to-travel.net","julesburgadvocate.com","kawasakininja1000.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","marutisuzukiforum.com","mavericklightning.org","mitsubishi-forums.com","mokkaownersclub.co.uk","motorcycletherapy.net","mountainmamacooks.com","mybakingaddiction.com","nissanversaforums.com","notformembersonly.com","novascotiafishing.com","novascotiahunting.com","pelotalibrevivo.net>>","peugeot108forum.co.uk","politicaltownhall.com","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","retrievertraining.net","rivianownersforum.com","rottweilersonline.com","royalenfieldforum.com","rugerpistolforums.com","runningonrealfood.com","santacruzsentinel.com","scriptgrowagarden.com","smartcarofamerica.com","snapinstadownload.xyz","snowboardingforum.com","sonymobilityforum.com","sousou-no-frieren.com","statisticsanddata.org","stratolinerdeluxe.com","streamservicehd.click","survivalistboards.com","talkaboutmarriage.com","tapeadvertisement.com","tech.trendingword.com","teslaownersonline.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","theslingshotforum.com","timesheraldonline.com","tipsandtricksarab.com","trailhunterforums.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","ultimateaircooled.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","volkswagenforum.co.uk","watchkobestreams.info","whittierdailynews.com","xr1200ownersgroup.com","yamahastarstryker.com","zone-telechargement.*","1plus1plus1equals1.net","addictedtovacation.com","addisonswonderland.com","advanced-astrology.com","ahdafnews.blogspot.com","airsoftsniperforum.com","allairfryerrecipes.com","allevertakstream.space","amazingclassiccars.com","amberskitchencooks.com","andrenalynrushplay.cfd","anniedesigncrochet.com","apaigeofpositivity.com","artprojectsforkids.org","assessmentcentrehq.com","assistirtvonlinebr.net","asvabpracticetests.com","authenticfoodquest.com","automobile-catalog.com","babygearessentials.com","backpacksandbubbly.com","bakerstreetsociety.com","bakingwithgranny.co.uk","barefootinthepines.com","batteryequivalents.com","beardeddragonforum.com","beaumontenterprise.com","becomeawritertoday.com","bettacarefishguide.com","bettermindbodysoul.com","biggerbolderbaking.com","bigheartlittlestar.com","blackcockadventure.com","blankcalendarpages.com","botanicalinterests.com","bramblewinecottage.com","breastfeedingplace.com","brightgreenrecipes.com","britneybreaksbread.com","bunsenburnerbakery.com","businesschronicler.com","businesstechplanet.com","canadianmoneyforum.com","canarystreetcrafts.com","capturownersclub.co.uk","carriebradshawlied.com","casualgeographical.com","cedarhillfarmhouse.com","centreofexcellence.com","chascrazycreations.com","chelseasmessyapron.com","chicagolandfishing.com","chocolatewithgrace.com","christianheadlines.com","christinamariablog.com","classicrockhistory.com","cleanandscentsible.com","closetfulofclothes.com","codycrosssolutions.com","collegetransitions.com","comicallyincorrect.com","community.fortinet.com","condolencemessages.com","controlconceptsusa.com","cookingmadehealthy.com","countrymusicfamily.com","countrymusicnation.com","cravingsofalunatic.com","crayonsandcravings.com","creativehomekeeper.com","crossword-explorer.net","crunchycreamysweet.com","cupcakesandcutlery.com","dallashoopsjournal.com","dayhikesneardenver.com","deeplysouthernhome.com","deliciouslyorganic.net","designerappliances.com","detroitsportsforum.com","dirtydiaperlaundry.com","discosportforums.co.uk","discoveringmontana.com","displacedhousewife.com","divaliciousrecipes.com","dontsweattherecipe.com","dontwastethecrumbs.com","dontworkanotherday.com","dreamalittlebigger.com","dreamhomebasedwork.com","drop.carbikenation.com","dubaitravelplanner.com","earthly-provisions.com","easychickenrecipes.com","easydessertrecipes.com","easyhomemaderecipes.ca","eclipsecrossforums.com","electricianforum.co.uk","ellaclaireinspired.com","elrefugiodelpirata.com","emilykylenutrition.com","englishbulldognews.com","eurointegration.com.ua","everydaycheapskate.com","everydayfamilyeats.com","everythingairfryer.com","everythingbackyard.net","evoqueownersclub.co.uk","extraordinarychaos.com","faithfulprovisions.com","familytreemagazine.com","fastandslowcooking.com","fastfoodmenuprices.com","feastingnotfasting.com","feedingtinybellies.com","fertilityfriends.co.uk","fillingandfabulous.com","filmeserialeonline.org","filmymaza.blogspot.com","financestrategists.com","firefighterinsider.com","footballgamingzone.com","forevermillennials.com","fouraroundtheworld.com","foxandpinestitches.com","free-n8n-templates.com","freescrapbookfonts.com","freestyletravelers.com","frenchbulldogowner.com","frugalcouponliving.com","funkyjunkinteriors.net","funlearningforkids.com","funthingsinhouston.com","gamespecifications.com","gardeninthekitchen.com","genealogyexplained.com","globalmousetravels.com","gluesticksgumdrops.com","godlikeproductions.com","goingawesomeplaces.com","goldendoodleadvice.com","goldengracekitchen.com","golfworkoutprogram.com","goodfoodpittsburgh.com","goodhomeautomation.com","greatwithoutgluten.com","greenchildmagazine.com","greenvalleykitchen.com","growinghandsonkids.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","housethathankbuilt.com","hyundaicoupeclub.co.uk","hyundaiperformance.com","jpop80ss3.blogspot.com","kawasakimotorcycle.org","kiatellurideforums.com","kingshotcalculator.com","littlesunnykitchen.com","longislandfirearms.com","mainehuntingforums.com","mexicanfoodjournal.com","michigan-sportsman.com","missouriwhitetails.com","mycolombianrecipes.com","nashobavalleyvoice.com","nathanmichaelphoto.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","player.gamesaktuell.de","portaldasnovinhas.shop","rangerraptorowners.com","redlandsdailyfacts.com","rubiconownersforum.com","salmonfishingforum.com","saturnoutlookforum.net","shakentogetherlife.com","shutupandtakemyyen.com","smartfeecalculator.com","snowmobilefanatics.com","sonsoflibertymedia.com","stellar.quoteminia.com","store.steampowered.com","thatballsouttahere.com","theflyfishingforum.com","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","triumphbobberforum.com","twopeasandtheirpod.com","utahconcealedcarry.com","watchdocumentaries.com","yourdailypornvideos.ws","52kitchenadventures.com","adblockeronstreamtape.*","addicted2decorating.com","adviceonlyfinancial.com","agrillforallseasons.com","alexwongcopywriting.com","allaboutplanners.com.au","allaccordingtoplann.com","allthehealthythings.com","alsothecrumbsplease.com","amazingfoodmadeeasy.com","amessagewithabottle.com","ancestral-nutrition.com","animalcrossingworld.com","anothercocktailblog.com","appellationmountain.net","aquaticplantcentral.com","ashcroftfamilytable.com","ashingtonflyfishing.com","askandyaboutclothes.com","attractionsmagazine.com","ayurvedawithrebecca.com","bajarjuegospcgratis.com","balancingeverything.com","balancingmotherhood.com","beatriceryandesigns.com","beautifulwithbrains.com","bellflowerlifestyle.com","berriesandbarnacles.com","bestjobdescriptions.com","blessthismessplease.com","braveryandbelonging.com","buildingwithkinfolk.com","businesswritingblog.com","butternutbakeryblog.com","caraudioclassifieds.org","chopstickchronicles.com","clashguideswithdusk.net","classiccountrymusic.com","cleaneatingwithkids.com","collegelifemadeeasy.com","completelydelicious.com","constellation-guide.com","cottageonbunkerhill.com","craftingagreenworld.com","craftyourhappyplace.com","crazylittleprojects.com","crosstourownersclub.com","crosswordanswers911.net","crosswordmasterhelp.com","cuddlystitchescraft.com","customcalendarmaker.com","cutegirlshairstyles.com","cycletraveloverload.com","daisycottagedesigns.net","danieldefenseforums.com","darlingcelebrations.com","deliciouslyseasoned.com","desertblossomcrafts.com","dixiedelightsonline.com","downhomeinspiration.com","dreaminterpretation.org","ducatisupersport939.net","easyrecipesfromhome.com","embracingsimpleblog.com","equippinggodlywomen.com","everythinglabradors.com","excelsiorcalifornia.com","extremeweatherwatch.com","familyfuntwincities.com","fatforweightloss.com.au","feedingourflamingos.com","financillustrations.com","findingouradventure.com","firefliesandmudpies.com","firstquarterfinance.com","footballtransfer.com.ua","foragersofhappiness.com","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freehomeschooldeals.com","freepornhdonlinegay.com","fromicecreamtosteak.com","fromvalerieskitchen.com","funhandprintartblog.com","gadgetsandwearables.com","generationacresfarm.com","getinspiredeveryday.com","girlwiththeironcast.com","girlwiththepassport.com","gluedtomycraftsblog.com","goodfooddiscoveries.com","grannysinthekitchen.com","grantourismotravels.com","greatholidayrecipes.com","greenhealthycooking.com","grilledcheesesocial.com","growingajeweledrose.com","healthyfitnessmeals.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","japannews.yomiuri.co.jp","julieseatsandtreats.com","laurelberninteriors.com","makefreecallsonline.com","newbrunswickfishing.com","newbrunswickhunting.com","newlifeonahomestead.com","nothingbutnewcastle.com","onionringsandthings.com","orkingfromhomeforum.com","osteusfilmestuga.online","pcoptimizedsettings.com","platingsandpairings.com","player.smashystream.com","polarisgeneralforum.com","powerequipmentforum.com","predominantlyorange.com","ridgelineownersclub.com","runningtothekitchen.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thebestideasforkids.com","theplantbasedschool.com","tropicalfishkeeping.com","whatgreatgrandmaate.com","zeromotorcycleforum.com","accidentalhappybaker.com","acrochetedsimplicity.com","afilmyhouse.blogspot.com","allthingswithpurpose.com","amandacooksandstyles.com","anitalianinmykitchen.com","antiquetractorsforum.com","apumpkinandaprincess.com","arizonahuntingforums.com","asprinklingofcayenne.com","astraownersnetwork.co.uk","athomewiththebarkers.com","athoughtfulplaceblog.com","awealthofcommonsense.com","barefeetinthekitchen.com","bbqingwiththenolands.com","beatsperminuteonline.com","bedroomproducersblog.com","behindthevoiceactors.com","beyondmeresustenance.com","bigislanditineraries.com","booksworthdiscussing.com","bostonterriersociety.com","bowlsarethenewplates.com","broomfieldenterprise.com","canoncitydailyrecord.com","carolinashootersclub.com","castleinthemountains.com","celebrateanddecorate.com","chiefmotorcycleforum.com","cookingontheweekends.com","creativecertificates.com","crochetconcupiscence.com","cupcakesandkalechips.com","cupcakesavvyskitchen.com","deliciouslysprinkled.com","delightfuladventures.com","dessertswithbenefits.com","dictionary.cambridge.org","dimensionalseduction.com","dontgobaconmyheart.co.uk","dreaminterpretation.info","ducatiscramblerforum.com","easttennesseefishing.com","easycheesyvegetarian.com","easylowsodiumrecipes.com","easysoutherndesserts.com","easyweeknightrecipes.com","ecosportownersclub.co.uk","engineeryourfinances.com","entertainingwithbeth.com","everydayessentialist.com","everywherewithclaire.com","evolutionofstyleblog.com","familyaroundthetable.com","familyvacationdesign.com","fermentingforfoodies.com","first-names-meanings.com","foodbloggersofcanada.com","fortressofsolitude.co.za","freecrochettutorials.com","freelancer.taxmachine.be","frenchcountrycottage.net","fromthiskitchentable.com","gedpracticequestions.com","goldenretrieverforum.com","grandhighlanderforum.com","healthylittlefoodies.com","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","makingthymeforhealth.com","manitobafishingforum.com","manitobahuntingforum.com","maseratilevanteforum.com","mediapemersatubangsa.com","ohiowaterfowlerforum.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","smithandwessonforums.com","socialanxietysupport.com","spaghetti-interactive.it","spicysouthernkitchen.com","stacysrandomthoughts.com","streetfighterv2forum.com","stresshelden-coaching.de","sundaysuppermovement.com","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","thewanderlustkitchen.com","thunderousintentions.com","tip.etip-staging.etip.io","tropicalfishforums.co.uk","volkswagenownersclub.com","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","a-love-of-rottweilers.com","abudhabitravelplanner.com","actuallygoodteamnames.com","alittlepinchofperfect.com","alldayidreamaboutfood.com","appliancerepairforums.com","bakedbroiledandbasted.com","baseballtrainingworld.com","best-minecraft-servers.co","bestchristmasdesserts.com","betweenenglandandiowa.com","betweennapsontheporch.net","chachingonashoestring.com","charlottefashionplate.com","chevroletownersclub.co.uk","chicagolandsportbikes.com","chocolatecoveredkatie.com","cindyhattersleydesign.com","cleaneatingveggiegirl.com","colab.research.google.com","commercialtrucktrader.com","conservationinstitute.org","cookerofdeliciousness.com","cookingwithkatiecross.com","countryroadssourdough.com","couponsandfreebiesmom.com","craftaholicsanonymous.net","cravingsomecreativity.com","creamofthecropcrochet.com","creativehealthyfamily.com","crochet-patterns-free.com","crockpotsandflipflops.com","dailythemedcrossword.info","dancearoundthekitchen.com","deliciousmeetshealthy.com","delightfultravelnotes.com","dessertnowdinnerlater.com","dictionnaire.lerobert.com","dogtrainingadvicetips.com","domestically-designed.com","domestically-speaking.com","eastcoastcreativeblog.com","educationaltechnology.net","electronicdrumadvisor.com","employmentlawhandbook.com","encouragingmomsathome.com","encyclopedia-titanica.org","everydayfamilycooking.com","everythingfishkeeping.com","fantasyfootballranker.com","floridaconcealedcarry.com","floridatravelwithkids.com","foodpleasureandhealth.com","greatamericanrepublic.com","growforagecookferment.com","handgunsandammunition.com","harley-davidsonforums.com","hipointfirearmsforums.com","kitchenfunwithmy3sons.com","macizletaraftarium.online","motorsportsracingtalk.com","pensacolafishingforum.com","player.pcgameshardware.de","practicalselfreliance.com","premeditatedleftovers.com","sentinelandenterprise.com","simply-delicious-food.com","sportsgamblingpodcast.com","technicians0.blogspot.com","theprofilebrotherhood.com","transparentcalifornia.com","watchelementaryonline.com","365daysofbakingandmore.com","accuplacerpracticetest.com","allthenourishingthings.com","attainable-sustainable.net","beautyandthebenchpress.com","bestfriendsforfrosting.com","betterhealthwhileaging.net","bibliopanda.visblog.online","binkysculinarycarnival.com","blackweightlosssuccess.com","braziliankitchenabroad.com","business-opportunities.biz","cocktailsandappetizers.com","coconutsandkettlebells.com","collegefootballnetwork.com","coloradohometownweekly.com","conservativefiringline.com","conserve-energy-future.com","cookiedoughandovenmitt.com","cottageatthecrossroads.com","cryptoprofitcalculator.com","cuatrolatastv.blogspot.com","dailycommutercrossword.com","dashboardwarninglights.com","diabetesselfmanagement.com","dipelis.junctionjive.co.uk","edinburghnews.scotsman.com","eleganceandenchantment.com","fantasyfootballreports.com","forthepleasureofeating.com","freeprettythingsforyou.com","friendshipbreadkitchen.com","frontporchlifemagazine.com","gracefullittlehoneybee.com","keyakizaka46matomemory.net","lakesimcoemessageboard.com","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","theworldofarchitecture.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","adebtfreestressfreelife.com","aprettylifeinthesuburbs.com","backyardchickencoops.com.au","bestbeginnermotorcycles.com","bootsandhooveshomestead.com","butterflyidentification.com","californiathroughmylens.com","chattanoogafishingforum.com","confessionsofafitfoodie.com","craftinessisnotoptional.com","cravingsomethinghealthy.com","destinationsanddesserts.com","english-grammar-lessons.com","enzasquailhollowkitchen.com","everydaynourishingfoods.com","familytravel-middleeast.com","fantasticfunandlearning.com","favoritepaintcolorsblog.com","feelinfabulouswithkayla.com","forevertwentysomethings.com","forums.socialmediagirls.com","gardeningproductsreview.com","georgianbaymessageboard.com","glutenfreeonashoestring.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","vauxhallownersnetwork.co.uk","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","amazingcharcuterieboards.com","bmacanberra.wpcomstaging.com","confidencemeetsparenting.com","cookingwithcocktailrings.com","dinnersdishesanddesserts.com","electricmotorcyclesforum.com","etiquetteschoolofamerica.com","festivalguidesandreviews.com","freedownload.flash-files.com","freeorganizingprintables.com","gingersnapsbakingaffairs.com","greatgrubdelicioustreats.com","mimaletamusical.blogspot.com","aroundtheworldpluskids.com.au","beautythroughimperfection.com","confessionsofabakingqueen.com","confessionsofaserialdiyer.com","fantasyfootballcalculator.com","gametohkenranbu.sakuraweb.com","russianmachineneverbreaks.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","alittlebitofeverythingblog.com","differentiatedkindergarten.com","free-power-point-templates.com","front-porch-ideas-and-more.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","confessionsofagroceryaddict.com","the-girl-who-ate-everything.com","aestheticsmilereconstruction.com","dinersdriveinsdiveslocations.com","everythinginherenet.blogspot.com","insuranceloan.akbastiloantips.in","watchrulesofengagementonline.com","countrylivinginacariboovalley.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","creatingreallyawesomefunthings.com","xn--verseriesespaollatino-obc.online","buckinghamshirelandscapegardeners.com","elkstudiohandcraftedcrochetdesigns.com","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
