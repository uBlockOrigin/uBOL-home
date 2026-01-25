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

const $scriptletArgs$ = /* 1098 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const t={apply:(t,e,o)=>{const n=o[0];return\"function\"==typeof n&&n.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(t,e,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i",".adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4999999999&adk=1777777777&adf=1059123170&pi=t.ma~as.4999999999&w=300&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!3\" data-google-query-id=\"CMiylL-r1pEDFYBewgUd-C8e3w\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6644444444&adk=622222222&adf=1800000000&pi=t.ma~as.6644444444&w=311&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=6111111111111&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=7778888888888890&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!4\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4999999999&adk=3666666666&adf=1000000000&pi=t.ma~as.4999999999&w=336&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4555555555888&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4222228888888888&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\" data-google-container-id=\"a!3\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","body:has(ins.adsbygoogle.nitro-body > div#aswift_1_host):has(.consent)","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1777777777&adf=3000000000&lmt=1777777777&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=966666666666&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12222222&ady=-12244444&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\" data-google-container-id=\"a!1\" data-load-complete=\"true\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","ins.adsbygoogle.nitro-body","unfill-optimized","ins.adsbygoogle.nitro-side,ins.adsbygoogle.nitro-banner","filled","var menuSlideProtection","/*start*/!function(){const t=Function.prototype.toString,e=new WeakMap;function n(t,n){return\"function\"==typeof t&&e.set(t,`function ${n}() { [native code] }`),t}Function.prototype.toString=n((function(){if(e.has(this))return e.get(this);return[\"XMLHttpRequest\",\"fetch\",\"querySelectorAll\",\"bind\",\"push\",\"toString\"].includes(this.name)?`function ${this.name}() { [native code] }`:t.apply(this,arguments)}),\"toString\");const o=Function.prototype.bind;Function.prototype.bind=n((function(t,...e){return o.apply(this,arguments)}),\"bind\");const r=t=>{try{const e=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,\"contentWindow\").get;Object.defineProperty(t,\"contentWindow\",{get:function(){const t=e.apply(this);return t&&t.Function&&t.Function.prototype.toString!==window.Function.prototype.toString&&(t.Function.prototype.toString=window.Function.prototype.toString),t},configurable:!0})}catch(t){}},i=document.createElement;document.createElement=n((function(t){const e=i.apply(this,arguments);return t&&\"iframe\"===t.toLowerCase()&&r(e),e}),\"createElement\");const c=Element.prototype.appendChild;Element.prototype.appendChild=n((function(t){return t&&\"IFRAME\"===t.tagName&&r(t),c.apply(this,arguments)}),\"appendChild\");let p=0,s=Date.now(),u=!1;const a=t=>{if(!t)return!1;const e=t.split(\"\\n\").length-1,n=t.includes(\"_executeCallback\"),o=/at\\s+([0-9A-Z_a-z]{1,3}|<anonymous>)\\s+\\(/.test(t);return e>=4&&e<=6&&(n||o)},l=(t,e)=>{const o=t[e];o&&(t[e]=n((function(t){if(0===arguments.length||void 0===t)return o.apply(this,arguments);if((\"iframe\"===t||\"IFRAME\"===t)&&a((new Error).stack)){const t=o.apply(this,arguments),e=(t=>{const e=Date.now(),n=e-s;s=e,p>=3&&n>2e3&&(u=!0);let o=t;return u?o=p%2==0?12:11:0===p?t>7&&(o=4):t>9&&(o=8),o})(t.length);return p++,new Proxy(t,{get:(t,n)=>\"length\"===n?e:t[n]})}return o.apply(this,arguments)}),e))};l(document,\"querySelectorAll\"),l(Element.prototype,\"querySelectorAll\"),n(window.XMLHttpRequest,\"XMLHttpRequest\"),window.fetch&&n(window.fetch,\"fetch\");const y=Array.prototype.push;Array.prototype.push=n((function(...t){try{if(a((new Error).stack)){const e=[\"fetch\",\"XMLHttpRequest\"],n=t.filter((t=>!e.includes(t)));return 0===n.length&&t.length>0?this.length:y.apply(this,n)}}catch(t){}return y.apply(this,t)}),\"push\");const h=window.addEventListener;window.addEventListener=n((function(t,e,n){return\"message\"===t&&\"function\"==typeof e&&e.toString().includes(\"googMsgType\")&&setTimeout((()=>{try{const t=document.getElementsByTagName(\"iframe\");for(let n=0;n<t.length;n++){const o=t[n].contentWindow;if(!o)continue;const r=JSON.stringify({msg_type:\"resize-me\",key_value:[{key:\"r_nh\",value:\"0\"},{key:\"r_ifr\",value:\"true\"},{key:\"qid\",value:\"CKjPmM7ezpEDFbyJ6QUdM0o3rw\"}],googMsgType:\"pvt\",token:\"AOrYGskPiXMUpj3CJQ8LsihEHwbNcui1URgWacoUghpsHfMEVL2nwMKey1eyEl6h8i29ah7WTlje42evSBak30X4pe673BR-KOZpAhiqCJO20pQ\"});e({data:r,source:o,origin:\"*\"})}}catch(t){}}),10),h.apply(this,arguments)}),\"addEventListener\")}();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//,\"\");/*end*/var menuSlideProtection","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","window.scriptExecuted = false;","(()=>{const n={getSlotElementId:function(){return\"historicaerials_728x90_ATF\"},getResponseInformation:function(){return!0}},t={getSlots:function(){return[n]},addEventListener:function(){return this}};window.googletag=window.googletag||{pubads:function(){return t},apiReady:!0}})();window.scriptExecuted = false;","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","window.open","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","admbenefits","ref_cookie","/\\badblock\\b/","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","31000, .VerifyBtn, 100, .exclude-pop.NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","counter_start\":\"load","counter_start\":\"DOMContentLoaded","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/ABDetected|navigator.brave|fetch/","Android/","false/","stay","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","timeLeft = duration","timeLeft = 0","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","close-modal","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","window.location.href = adsUrl;","div","<img src='/x.png' onerror=\"(function(){'use strict';function fixLinks(){document.querySelectorAll('a[href^=&quot;intent://&quot;]').forEach(link=>{const href=link.href;const match=href.match(/intent:\\/\\/([^#]+)/);if(match&&match[1]){link.href='https://'+match[1];link.onclick=e=>e.stopPropagation();}});}fixLinks();new MutationObserver(fixLinks).observe(document.body||document.documentElement,{childList:true,subtree:true});})()\">","4000","document.cookie.includes(\"adclicked=true\")","true","IFRAME","BODY","/func.*justDetect.*warnarea.*?;/gm","getComputedStyle(el","popup","/\\d{4}/gms","document.body.onclick","2000);","10);","(/android/i.test(t) || /Android/i.test(t))","(false)","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","fallbackUrl;","AdbModel","/popup/i","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","timeLeft = 1","/aclib|break;|zoneNativeSett/","1000, #next-timer-btn > .btn-success, 600, #mid-progress-wrapper > .btn-success, 1300, #final-nextbutton","3500","#next-link-wrapper > .btn-success","1600","/fetch|popupshow/","/= 3;|= 2;/","= 0;","count","progress_original = 6;","progress_original = 3;","countdown = 5;","countdown = 3;","= false;","= true;","focused","start_focused || !document.hidden","focused || !document.hidden","/android/gi","checkAdsBlocked","5000","1000, #continue-btn",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","!document.hasFocus()","document.hasFocus() == false","getStoredTabSwitchTime","/\\d{4}/gm","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","onpopstate","showBannerAdBlock","state.shown >= redirectUrls.length","(isAdsenseBlocked)","onDevToolOpen","/setTime.*[\\s\\S\\n]*href.*/gm","/#Intent.*?end/","intent","https","firstp","/window\\.location\\.href.*/","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","9000","continue-button","3000","getElementById","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","_blank","_self","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","head","<div id=\"popads-script\" style=\"display: none;\"></div>","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","style","min-height:300px","ai_adb","\"v4ac1eiZr0\"","admiral","'').split(',')[4]","window.admiral","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"|<a href=\"https:\\/\\/getad%/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","__adblocker","html-load.com","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","\"data-sdk\"","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","()=>eval","domain=?eventId=&error=",";confirm(","/\\(\\)=>eval|html-load\\.com|await eval/","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","d-none|media-filter-brightness|bg-dark",".media-main-image","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","const PREROLL_ACTIVE = true;","const PREROLL_ACTIVE = false;","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","text-decoration","/break;case|FingerprintJS/","push","(isAdblock)","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","charCodeAt","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","/mdp|adb/i","popunder","adbl","/protect?","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","reload","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","unlock_chapter_guest","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","off","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","ab","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","ins.adsbygoogle","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","in_d4","hanime.tv","p","window.renderStoresWidgetsPluginList=","//window.renderStoresWidgetsPluginList=","Custom Advertising/AWLS/Video Reveal",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|var FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","body","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","justDetectAdblock","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","/window\\.location\\.href.*?;/","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","offsetHeight","student_id",".offsetLeft",":{content:","no:{content:","AdBlockChecker",".modal-content","data-adsbygoogle-status","done","document.body.innerHTML","/popunder|contextmenu/","\"hidden\"","/overlay/i","/aoAdBlockDetected/i","button[aria-label^=\"Voir une\"]","button[aria-label=\"Lancer la lecture\"]","function(error)",",\"ads\"","pdadsLastClosed","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/cX_P|_pc/","/^_cX_/","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 872 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13;2,14,15;2,16,17;2,18,19;3,20,21,22;3,23,21,24;3,25,21,26;0,0,27,28,3,4;0,0,29,30;0,0,31;0,0,32,33;1,0,34;1,0,35;1,0,36,37,38;0,0,39,40;4,41,42,43,44,45,46,47,48,49,50,51;0,0,52,53;0,0,54,55;5,56,57,58;6;0,0,59,60;0,0,61,62,63,64;7,65,4;8,66;9,66,67;0,0,68,69;1,0,70;10,71,72,73,72,74,75;0,0,76,77;1,0,78;0,0,79,80;1,0,36;1,0,81;1,0,82;1,0,83;1,0,84;1,0,85;1,0,86;7,87,4;1,0,88;7,89,90;7,91,4;1,0,92;0,0,93,94;0,0,95,96;8,97;1,0,98;1,0,99;1,0,100;11,101,102;1,0,103;0,0,104,72,63,105;1,0,106;1,0,107;8,108;1,0,109;1,0,110;0,0,111;1,0,112;1,0,113;0,0,114,115;0,0,116;0,0,117,118;0,0,119,120;1,0,121;0,0,122,123;1,0,124;7,125,4;7,126,4;7,127,4;1,0,128;1,0,129;9,130,67;12,131;0,0,132,133;0,0,134,135,63,136;0,0,137,138;0,0,139,140;0,0,141,142;1,0,143;1,0,144;0,0,145,146,147,4;0,0,148,77;0,0,149,150;1,0,151;1,0,152;0,0,153,150,63,154;0,0,155,72,63,156;0,0,157,4,63,158;0,0,159,160;0,0,161,162;13,163;1,0,164;1,0,165;0,0,166,167;0,0,168,169;1,0,170;10,171,172;0,0,173,73,63,174;0,0,175,150,63,174;0,0,176;2,177,178;0,0,179,150;0,0,180,181;0,0,182,183;0,0,184;1,0,185;1,0,186;0,0,187,150;1,0,188;0,0,189,190;0,0,191,192;1,0,193;0,0,194,195,3,196;1,0,197;1,0,198;0,0,199;0,0,200,77;0,0,201,72,63,202;0,0,132,203,147,4;1,0,204;1,0,205;1,0,206;0,0,207,208;1,0,209;1,0,210;7,211,4;1,0,212;1,0,213;1,0,214;0,0,161,215;1,0,216;12,217,218;12,219,72,220;1,0,221;0,0,222,223,63,224;0,0,225,226;0,0,227,228;0,0,229,230,63,231;0,0,232,181;0,0,233,181;0,0,234,77,147,4;1,0,235;0,0,236,150;12,237,149;0,0,238,72,63,239;0,0,240,241;7,242,4;0,0,243,244;1,0,245;0,0,246,181;0,0,247,181;1,0,248;0,0,249,150,63,224;0,0,250,251,63,224;0,0,252,253;0,0,254,255;0,0,256,257;1,0,258;0,0,259,260;0,0,261,77;0,0,40,135,63,262;0,0,263,181;0,0,264,77;1,0,265;1,0,266;0,0,267,268,269,270;1,0,271;1,0,272;0,0,273,181;0,0,274,192;1,0,275;0,0,276;0,0,277;0,0,278,279;1,0,280;0,0,281;0,0,282,77;0,0,283,284;1,0,285;1,0,286;0,0,287,150,63,288;0,0,289,150,63,290;1,0,291;0,0,292,77;0,0,293,150;1,0,294;0,0,295,296;1,0,297;1,0,298;1,0,299;1,0,300;1,0,301;1,0,302;1,0,303;2,304,305;0,0,306,307;1,0,308;1,0,309;0,0,310,311;1,0,312;1,0,313;1,0,314;0,0,315;1,0,316;1,0,317;1,0,318;1,0,319;1,0,320;1,0,321;1,0,322;1,323,324;1,0,325;1,0,326;1,0,327;1,0,328;1,0,329;1,0,330;0,0,331,332,3,4;7,333,77;1,0,334;0,0,335,336;0,0,337,338;0,0,339,340;0,0,337,341;0,0,337,342;0,0,343,344,3,4;0,0,345,346,3,4;0,0,347,348,63,334;1,0,349;1,0,350;1,0,351;1,0,352;1,0,353;1,0,354;1,0,355;1,0,356;1,0,357;1,0,358;1,0,359;1,0,360;1,0,361;1,0,362;1,0,363;1,0,364;1,0,365;0,0,366,367,63,368;0,0,369,370;0,0,371,372;12,373,72,374;1,0,375;1,0,376;1,0,377;1,0,378;1,0,379;1,0,380;1,0,381;13,382,383;1,0,384;1,0,385;1,0,386;0,0,387,388;1,0,389;0,0,390,391,3,4;0,0,392,393;7,394,196;0,0,395,396,63,397;0,0,398,399;0,0,400,401;0,0,402,403,3,4;0,0,404;0,0,405,406;1,0,407;1,0,408;0,0,409,410;13,411;1,0,412;7,413,4;0,0,414;1,0,415;9,416,181;1,0,417;1,0,418;1,0,419;10,420,421,72,72,74,422;1,0,423;8,331;0,0,424,370,63,425;8,426;9,426,67;7,427,4;1,323,428;1,0,429;1,0,430;0,0,431,192;1,0,432;11,433,434;0,323,435,436;13,437,438,147;13,439,440,147;7,441,4;13,442;8,333;1,0,443;13,444,445,147;1,0,446;1,0,447;1,0,448;0,0,449,450;13,451,452;13,451,453;1,0,454;1,0,455;1,0,456;7,455,4;14,457;2,304,458;1,0,459;0,0,460,461,63,462;1,0,463;8;1,0,464;7,465,4;1,0,466;1,0,467;7,468,90;1,0,469;1,0,470;1,0,471;1,0,472;8,473;9,473,67;5,474,57,475;7,211,476,72,477,4;10,478,479;0,323,480,481,63,482;1,0,483;1,0,484;1,0,485;1,0,486;1,0,487;13,488;0,0,489,490;13,491,492;9,493,181;7,494,4;11,495,496;1,0,497;8,498;7,499,4;7,500,181;1,0,501;1,323,502;13,503,72,147;1,0,504;15;1,0,148,63,113;1,0,505;1,0,506;1,0,507;0,0,508,509;1,0,510;1,0,511;7,379,512;8,513;1,0,514;1,0,515;1,516,517;1,516,518;1,516,519;1,516,520;1,516,521;1,516,522;1,516,523;1,0,524;1,516,525;0,0,526;12,527;1,0,528;0,0,529,530,3,4;0,0,531,77;12,532;0,0,533,534,63,535;11,536,537;11,538,496;1,0,539;1,0,540;1,0,541;1,0,542;1,0,543;1,0,544;1,0,545;1,0,546;1,0,547;7,548,4;1,0,549;1,0,550;1,0,551;1,0,552;0,0,553,554,63,555;9,556,196;0,0,557,72,63,558;5,559,57,560;1,0,561;13,562,563;1,0,564;1,0,565;11,566,496;0,0,567,568,63,569;7,570,4,72,477,4;1,0,571;1,0,572;1,0,573;1,0,574;1,0,575;1,0,576;1,0,577;1,0,578;1,0,579;8,580;1,0,581;1,0,582;1,0,583;1,0,584;0,0,585,192;0,586,587;1,0,588;1,0,589;1,0,590;0,0,591,592;1,0,593;6,594;9,595,181;1,0,596;1,0,597;1,0,598;1,0,599;1,0,600;0,0,601,602;12,603;13,604,605;1,0,606;12,607;1,0,608;0,0,609,610;0,0,611,612;1,0,613;1,0,614;0,0,615,616;0,0,617,618;0,0,619,192;7,620,4;7,621,4;1,0,622;7,623,181,72,477,4;0,0,455,72,63,455,147,4;8,624;0,0,625,370;0,0,626,192;1,0,627;0,0,628,629,3,4;1,0,630;1,0,631;1,0,632;1,0,633;7,634,4;1,0,635;7,636,4;1,0,637;7,638,4;10,639,640;1,0,641;0,0,642,643;1,0,644;1,0,645;1,0,646;1,0,647;16,648,67;5,649,57,650;7,455,90;1,0,651;1,0,652;0,0,653,181;0,0,654,370;1,0,655;0,0,656,72,63,613;1,0,657;1,0,658;16,659,181;0,0,660,661;0,0,662,663;7,664,4;7,665,4;1,0,666;0,0,667,668;9,669,67;0,0,670,671;7,672,4,72,477,4;0,0,673;1,674,675;0,0,676,77;1,0,677;7,678,4,72,477,4;0,0,679,72,63,680;0,0,681,682;1,0,683;1,0,684;16,685,181;1,0,686;1,0,687;9,688,77;1,0,689;0,0,690,691,63,692;1,0,693;1,0,694;1,0,695;3,696,21,26;7,697,4;1,0,698;10,699,172;1,0,700;1,0,701;0,0,337,702,3,4;1,0,703;0,0,704,705,3,4;1,0,706;0,0,707;0,0,708,709;1,0,710;1,0,711;0,323,712,713;0,0,714,715;1,0,716;7,717,4;1,0,718;9,719,181;1,0,720;0,0,721,722;7,723,4;1,0,724;0,0,7,725;1,0,726;1,0,727;3,728,729,730;1,0,731;13,732,733;10,734,4,72,72,74,735;0,0,455,736;0,0,737,738,63,739;12,740,72,741;1,0,742;8,743;1,0,744;1,0,745;1,0,746;10,747,748;1,0,749;1,0,750;1,0,751;0,0,752,181;1,0,753;1,0,754;0,0,755,756,3,4;9,757,67;1,0,758;0,0,759,760;0,0,761;1,0,762;17,763,763;1,0,764;13,765,72,147;7,766,4;8,767;1,0,333;16,768,769;1,0,770;0,0,771,772;1,0,773;0,0,774;1,0,775;1,0,776;1,0,777;1,0,778;1,0,779;8,780;10,781,181,72,72,477,4;1,0,782;1,0,783;1,0,784;7,785,181;1,0,786;1,0,787;1,0,788;0,0,789,72;7,790,181;7,791,181;1,0,792;1,0,793;1,0,239;0,0,794;9,795,4;4,796,172;1,0,797;1,0,798;1,0,799;1,0,800;10,801,802;2,803,804;1,0,805;1,0,38;0,0,806,807;0,0,337,808,3,4;0,0,809,810,3,4;1,0,811;0,0,812,813;1,0,814;1,0,815;1,0,816;7,817,4;7,818,4,72,477,4;11,819,434;0,0,820;1,0,821;0,0,822,823;0,0,267,824;0,0,825,826;0,0,827;1,0,828;1,0,829;0,0,830,831;1,0,832;1,0,833;1,0,834;1,0,835;1,0,836;1,0,837;1,516,838;1,0,839;1,0,840;1,0,841;9,842,67;1,0,843;0,0,844,845;1,0,846;1,323,847;3,696,848,849;2,696,177;1,0,850;1,0,851;1,0,852;1,0,853;1,0,854;12,855;12,856;1,0,857;0,0,858;4,859,172;5,860,861,4;1,0,862;1,0,863;1,0,864;1,0,865;9,866,67;9,867,67;9,868,67;9,869,67;9,870,67;9,871,67;11,872,496;8,873,874,875;9,876,67;11,877,496;11,878,879;9,880,67;11,881,882;11,883,884;11,885,496;11,886,887;11,888,889;11,890,102;11,891,887;11,892,496;11,893,889;11,894,895;11,896,496;11,897,496;11,898,887;11,899,900;11,901,496;11,902,496;11,903,889;11,904,905;11,906,496;11,907,908;11,909,910;11,911,496;11,912,102;11,913,496;11,914,915;11,916,917;11,918,919;11,920,921;11,922,923;11,924,889;11,925,496;11,926,927;11,928,496;11,929,930;11,931,932;11,933,496;11,934,935;11,936,937;11,938,939;11,940,496;11,941,942;11,943,496;11,944,496;8,945;8,946;8,947;8,948,874,875;8,949;8,950;8,951,874,875;8,952;10,951,72,73;7,953,476;7,954,476;8,955;8,956;8,957;8,958,874,875;8,959,874,875;9,960,67;16,961,67;8,962;9,963,67;8,964,874,875;10,964,73,72,72,74,965;8,966,874,875;10,967,72,73,72,74,968;8,969;8,970,874,875;9,971,67;16,972,67;8,973,874,875;8,974;9,975,67;8,976;9,977,67;8,978,874,875;8,979;8,980;8,981,874,875;9,982,67;16,983,67;8,984,874,875;8,985,874,875;9,986,67;8,987;8,988,874,875;9,989,67;8,990,874,875;8,991,874,875;9,992,67;16,992,67;8,993;8,994;9,994,67;9,995,67;9,996,67;10,997,72,73,72,74,998;10,999,72,73,72,74,998;9,1000,67;8,1001,874,875;9,1002,67;9,1003,67;8,1004;8,1005;8,1006,874,875;9,1007,67;8,1008,874,875;9,1009,67;9,1010,67;9,1011,67;8,1012,874,875;8,1013;8,1014,874,875;8,1015;9,1016,67;8,1017;8,1018,874,875;8,1019,874,875;10,1020,72,73,72,74,1021;10,1020,72,73,72,74,1022;9,1023,67;8,1024,874,875;9,1025,67;9,1026,67;10,1027,72,73,72,74,1028;10,1029,72,73,72,74,1028;10,1030,72,73,72,74,1028;10,1031,72,73,72,74,1032;9,1033,67;9,1034,67;8,1035;9,1036,67;9,1037,67;9,1038,67;8,1039,874,875;9,1040,67;8,1041,874,875;9,1042,67;8,1043,874,875;9,1044,67;8,1045,874,875;9,1046,67;9,1047,67;8,1048;9,1049,67;11,1050,900;11,1051,900;11,1052,900;11,1053,900;11,1054,900;11,1055,900;11,1056,900;11,1057,900;11,1058,900;11,1059,900;11,1060,496;1,0,1061;8,1062;8,1063;16,1064,77;11,1065,1066;8,1067;11,1068,496;10,967,72,73,72,74,1069;8,1070;9,1071,67;8,1072;10,1073,1074,72,72,74,1075;10,1076,72,73,72,74,1075;10,1077,72,73,72,74,1075;10,1073,1074,72,72,74,1078;10,1076,72,73,72,74,1078;10,1077,72,73,72,74,1078;8,1079;8,1080;1,0,1081;8,1082;9,1083,67;8,1084;9,1085,67;16,1086,67;9,1087,67;9,1088,67;8,1089;16,1090,67;8,1091,874,875;11,1092,496;8,1093;9,1094,67;1,0,1095,63,1096;1,0,1097";

const $scriptletArglistRefs$ = /* 5390 */ "206;206;198;42;226;198;21,494;668,669,670,671,672,673;198;37,198;198;437;223;310;226,246,668,669,670,671,672,673;251;838,839;198,511;206,251;37;37;198;226,668,669,670,671,672,673;211;226;223;206;208;40,198,208;223,239;226,245;198;78;198;135;226;226,668,669,670,671,672,673;206;42;35;41;37,198;226;226;357;237;206;226;226;226,246,668,669,670,671,672,673;206;223;198;668,669,670,671,672,673;36;226,668,669,670,671,672,673;194;198;256;226,247;251;198;208;320;98;206;208;226;80;67,194;206;198;198;235;668,669,670,671,672,673;67,194;223;384;208;198;517;118;198;198;225,226;226,668,669,670,671,672,673;198;723;729;226;597;664;198;441;37;524;684;206;788;198,279;198;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226,668,669,670,671,672,673;198;2;206;206;206;194,226,246,668,669,670,671,672,673;223,244;223;226;206,408;800,801;500;206;226;666;226;235;194;226;226;4,677,729;308;226,668,669,670,671,672,673;198;466;127;709,710;369;198;871;206,251;225,226;226;596;54;37;37;223;183;226;323;198;437;206;194;225,226;226;823;226;226,668,669,670,671,672,673;226;226;198;506;506;791;235;212;198;198;198;226;256;226;226;206;754,755;412;226,668,669,670,671,672,673;223;196;576;783;198;244;226,668,669,670,671,672,673;680;210;226;200;641;756;198;198;226;226;225,226;198;27;198,206;198;198;226,246;210;198;198;225,226;766;198;226;226;524;198;198;198;316;69,194;198;198,279;198;200;668,669,670,671,672,673;198;223;225,226;625;54,198;335;226,668,669,670,671,672,673;206;198;198;37,54,206;226;48;54,198,206;198;198;198;223;226;226,668,669,670,671,672,673;226;219,223;787;37;198,210;198;198;198;226;198;226;599;599;198;499;256;799,801;198;198;226;198,206;198;198,206,209;198;206;256;198,210;668,669,670,671,672,673;198;198;198;471;239,668,669,670,671,672,673;226,668,669,670,671,672,673;198;226;226;226,668,669,670,671,672,673;121,122;590;352;684;226;684;198;198;226;198;736;250;365;226;198,206;198,619;723;208;437;256;127;369;251;251;198;226;198;198;226,668,669,670,671,672,673;251;251;198;251;244;226;198,206;91,198;428;206;206;198;198;119;127;259;225,226;684;5;206;111,112,113,114;198;198;206;487;226;206;155;668,669,670,671,672,673;214;138,139;198;198;91;290;226;668,669,670,671,672,673;80;226;226;226;226;552;198;769,770,771;206;415;198;198;226;52;777,778,779;790;198,206;218;226,668,669,670,671,672,673;226;198;226;223,296;226,668,669,670,671,672,673;574;418;226;226;198;198;198;257;31;463,464;198;37,54;223;235;297;736;668,669,670,671,672,673;256;210;668,669,670,671,672,673;226,668,669,670,671,672,673;668,669,670,671,672,673;661;235,668,669,670,671,672,673;840;194;480;198;226;198;226,668,669,670,671,672,673;37,198;198;198;640;223;226;226;226;138,139;668,669,670,671,672,673;226;574;585;37;198,210;198;37;226;37;198;226;198;843;226,668,669,670,671,672,673;831;832;833;668,669,670,671,672,673;256;206;45;198;119;198;198;226;226;198;386;119;119;162,163,164;198;198;260;840;198;460,461,462;437;354;208;198;198;356;43;269;683,709,710,711,713,714;194;635;210,422;422;198,279;119;226;226;81,82;198,206;198;198,320,400;198;119;119;226;198;198;198;226,668,669,670,671,672,673;226;37,206;251;198;198;119;226;863;585;179,180,181,182;226;119;119;194;226;120;219;226,668,669,670,671,672,673;470;545;320;115;172;311;460,461,462;685;198;198;668,669,670,671,672,673;138,139;206;198;198;85;709,710,711;366,367;198;198;226;226;226;198;37;198;226,668,669,670,671,672,673;198;91;198;206;312;256;159,160;206;319;73,74,75;206;198;198,257;201;226;251;226;198;208;198;226;136;206;262;119;119;302;206;198,206;412;226;609;198;131;198;221;198;237;226;226;585;288;226;226;226;256;226;206;723;127;226;251;226,668,669,670,671,672,673;67,194;198;542;128;693,694,743,744;162,163,164;243,246;210;119;226;378;43;422;639;65;862;226;286,287;198;226;155;732;606,607;206;56;198;216;550;226,668,669,670,671,672,673;226;256;422;206;198;454;530;198;504;269;43,446,447;206;206;198;250;65;223;198;821,822;206;194;198;684;460,461,462;226,668,669,670,671,672,673;226;208;226;768;81,82;206;381;226;240;226;206;591;206;198;223;226;364;206;198;226,668,669,670,671,672,673;206;198;198;226;809;709,710;198;226;226;226;256;427;198;198;268;228,668,669,670,671,672,673;668,669,670,671,672,673;668,669,670,671,672,673;226,668,669,670,671,672,673;226,668,669,670,671,672,673;198;198;198;198;91;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226,668,669,670,671,672,673;155;202;198,218;162,163,164;257;198;91;198;206;784;784;198;99,100,101,102,103;65;198;259;206;225,226;351;226;226;399;605;198;226;54;460,461,462;585;226,668,669,670,671,672,673;206;91;198;198;58;254;226;226;223;413;658,659;361;63,361;829;128;208;668,669,670,671,672,673;210;226;226;372;226;242,243;194;580;198;521;198;223;321;91;206;33;206;58;226;223;226,668,669,670,671,672,673;140;37;198;198;226;226,668,669,670,671,672,673;256;689;198,206;91;91;2;91,131;256;198;198;226;208;198;198;79,80;226;668,669,670,671,672,673;198;351;426;198;206;223;867;206;226,668,669,670,671,672,673;226;226;551;244;226;64;198,210;198,206;198;198;131;198;198;214;43;223;269;148,149,150,198;40;328;39;70;37;198,279;648;198,279;123;226;198;198;81,82;52;198,511;210;226;223;226;206;235,668,669,670,671,672,673;226,668,669,670,671,672,673;481;206;445;198;198;223;198;239,668,669,670,671,672,673;210,318;198;198;119;37;91;198;684;198;251;198,206;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;251;223;226;351;177;241;206;198;223;474,475;198;429;226;460,461,462;460,461,462;460,461,462;460,461,462;226;198;198;256;198;684;326;226,668,669,670,671,672,673;225,226;198;198;226,668,669,670,671,672,673;206;530;225,226;198;226;206,208;206;226,668,669,670,671,672,673;226;226,668,669,670,671,672,673;226;184,185;226;440;23;536,864,865;566;226;91;76;37;627;198;198;226,668,669,670,671,672,673;223;198;37;198;206;198;226,668,669,670,671,672,673;250;401;223;301;218;226;198;198;198;58;668,669,670,671,672,673;214;43;129,362;223;223;198;665;54;120;198;226;323;223,748,749,750;194;840;39;226;226;226;569;198;840;198;122;223;226,668,669,670,671,672,673;206;668,669,670,671,672,673;127;198;198,206,511;226,668,669,670,671,672,673;119;226;198;827;223;198;303;198;226;198;129,131;198;91;668,669,670,671,672,673,721;223;226,668,669,670,671,672,673;226;198;226,235,668,669,670,671,672,673;251;226;226;198;616;668,669,670,671,672,673;585;448;198;866;198;225,226;206;291;225,226;46,47;840;280;198;226;198;200,210,612;208;206;198;254;37;37;226;615;668,669,670,671,672,673;226;226;225,226;198;198;198;226;226;226;235;198;563;226;226;187;198;581;138,139;813;476;226,668,669,670,671,672,673;226;198;226;226;198;54,198;410;585;851,852,853;206;37;614;198;226,668,669,670,671,672,673;133;226;176;198;226;256;257;198;256;256;198;668,669,670,671,672,673;265;226;294,295;127;237;225,226;198;239,668,669,670,671,672,673;871;226;226;623;91;226;198;226,668,669,670,671,672,673;76;226,668,669,670,671,672,673;256;226,668,669,670,671,672,673;223;198;226;196;789;222,250;198;198;198;422;685;198;422;226;198;226;257;368;226;226,668,669,670,671,672,673;396;840;198;198;206;319;198;702;91;91;226;198;37;198;206;208;198;198;198,210;206;482;198;198;361;226,668,669,670,671,672,673;226;226;585;198;683,709,710,713,714;198;198;539;668,669,670,671,672,673;223;372;37;198;553;198;198;198;226;39;14,15,16,17;226;198;206;198;226;198;19,20,213;226;225,226;198;277;226,668,669,670,671,672,673;223,726;422;226,668,669,670,671,672,673;223;198;223;662;198;198;226;198;765;206;198;685;556;206;206;709,710;226,668,669,670,671,672,673;304,305;198;226;198;147;198;5;132;179,180;210;210;198;43;226;210,587;198;226,668,669,670,671,672,673;128;206;198;198;198;96;493;198;198;226;198;198;226;223;206;198;198,210;198;585;210;518;198;648;648;37;198,206;198,208;60;226;226;68;198;226;668,669,670,671,672,673;329,330;250;226;194,195;226;723;226;226;225,226;444;128;44;5;198;37,208,514;196;226;226;226;645;226;691;198;226;226,668,669,670,671,672,673;198;37,54;-38;198;225,226;186;206;197;198;422;226,668,669,670,671,672,673;439;59,223,707;206;198;206;198;371;198;37;237;226;226;226;421;668,669,670,671,672,673;585;223;422;637;399;198;530;341,342,343,344,345;257,621;226;226;467;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;589;507,508;83;206;-38;198;226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;208;198;226;226;226,668,669,670,671,672,673;198;226;226;226;226;226;37,206;318;198;226;226;742;226;198;246;198,585;198;226;223;223;198;226,668,669,670,671,672,673;653;198;198;198,279;119;206;422;129,131;315;178,179,180;223;198;137;226;226,668,669,670,671,672,673;198;226;108;668,669,670,671,672,673;226;418;198;198;25;668,669,670,671,672,673;257;198;240;131;58;223;198;327;585;840;668,669,670,671,672,673;250;226;585;776;585;240;226;226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;-38,-586,-872;226;240;455;226;629;226;133;225,226;206;206;585;226;198;127;226;226;226;422;223;223;196;198;223,244;206;198;495,496;226;208;226,668,669,670,671,672,673;198;251;646;77;223;585;165,166,167;251;56;582;436;668,669,670,671,672,673;86;198;708;422;198;227,668,669,670,671,672,673;226,668,669,670,671,672,673;155;246;127;91;226;727,728;359;240;198;544;323;226;226;37;269;198,206;206;198;198;206;226;206;206;226;138,139;198;225,226;318;438;198;269;196;226;574;198;225,226;226,668,669,670,671,672,673;226;540;226;25;206;684;226,668,669,670,671,672,673;62;226;226;223;226;393;226,668,669,670,671,672,673;534;206;422;256;198;198;365;37;198;92,93,94,95;128;198;198;226;819,820;226;416;226;585;457,458;226;226;198;422;39;226,668,669,670,671,672,673;226;226,668,669,670,671,672,673;198;198;58,198;420;226;198;226;108,109,110;198;226;198;390;226;198;256;198;226,668,669,670,671,672,673;630;613;226;226;226;198,206;417;293;198;226,668,669,670,671,672,673;226,668,669,670,671,672,673;198,210;226;226;226;25,198;198;226;571;217;674;198;598;226,668,669,670,671,672,673;225,226;226;198;226;226;223;332;124;471;198;685;198;129,131;226;223;226,668,669,670,671,672,673;226;28;198;226;91;226;198;844,845,846;668,669,670,671,672,673;198;226;206;226;226;223;660;611;210;645;505;226;226;225,226;138,139;198;226;208;206;206;198;198;206;824;226;226;206;817,818;226;84;226,668,669,670,671,672,673;226;54;226;226,668,669,670,671,672,673;226,242,243,246;226;226;198;226,668,669,670,671,672,673;515;226,668,669,670,671,672,673;198;25;226,668,669,670,671,672,673;240;198;206;223;792;226,236;710;198;32;384;226;223;322;226;226;206;226;256;198;198;384;198;685;685;198;198;422;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;668,669,670,671,672,673;235;198;87,88,89;226;226;226;226;226;226;226;226;639;226;198;226;242,243;226,668,669,670,671,672,673;206;223;531;225,226;226;206;198;574;574;574;226;226;226;664;226;226;226;223;226,668,669,670,671,672,673;198;198;198;223,709;198,736;141,142,143,144,145,146;223;119;226,668,669,670,671,672,673;226;650;91;225,226;240;450;86;685;194;422;223;560;353;206;720;226;226;254;210;198;198;588;198,210,279,518;250;126;198;223;226,668,669,670,671,672,673;200;200;226;198,210,279,518;404;128;226;141,142,143,144,145,146;434;363;772;226;855;43;726,811,812;626;198;219;198;198;226;226;796;439;445;445;445;206;206;219;198;214;198;235;226;226;226;198;225,226;299;198;225,226;198;226;39;460,461,462;226,668,669,670,671,672,673;226;657;198;210;206;198;5;198,206,511;206;226;226;736;226;647;196;138,139;226,668,669,670,671,672,673;198;663;200;226;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;226;226;685;685;198;226;685;655;338;198;372;226;226,668,669,670,671,672,673;198;51;226;206;226;198;206;198;206;226;226;198;226;223,224;226;226;226;198;37;226;198;753;55;226;585;223;666;226;198;198,279;225,226;279,518;198;130;198;226;198;256;490;198;52;91;459;91;347;302;225,226;226;226;226;223;226,246,668,669,670,671,672,673;198;226;564;668,669,670,671,672,673;225,226;226;323;226;208;198;226;226;349;223;226;198;223;362;664;120;226;840;257;131;734;39,350;223;775;226;198;226;226;519;91;198;274,275;585;226;223,594;128;664;226,668,669,670,671,672,673;491;226;226;225;239,668,669,670,671,672,673;226,668,669,670,671,672,673;223;54,206;226;226;360;403;120,198;198;460,461,462;226;726;196;198;226;37;668,669,670,671,672,673;226;120;723;225,226;226;226;132;198,206;840;198;759,760,761;226,668,669,670,671,672,673;198;226;495;495;226;226;251;91;198;225,226;478;257;585;240;226;226;825;91;419;170;437;198;257;129,156,157,158;226;668,669,670,671,672,673;226;226;226,668,669,670,671,672,673;568;206;37;194;198;301;256;198;608;668,669,670,671,672,673;198;198;226;226;572;198;226;226;226;226;226;314;198;198;422;535;198;585;307;665;182,189,190,191,192,193;198;198;633;226;226;239,668,669,670,671,672,673;226;226;226,668,669,670,671,672,673;226;226;226;476;541;198;226;226;226,668,669,670,671,672,673;226;226,246;128;226,668,669,670,671,672,673;206;666;256;261;256;39;198;334;198;226;226;233,668,669,670,671,672,673;198;848,849,850;226;226;319;223;206;226;226;223;226,668,669,670,671,672,673;805,806,807;346;226;198;868,869;198;256;226;198;375;108,109,110;99,100,101,102,103;237;226,668,669,670,671,672,673;706;226;226;535;240;392;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226,668,669,670,671,672,673;198;226,668,669,670,671,672,673;226,235;198;226;226,668,669,670,671,672,673;198;234,668,669,670,671,672,673;257;131;106,107;43;206;226,668,669,670,671,672,673;723;226;840;237;226;91;226,668,669,670,671,672,673;824;226,668,669,670,671,672,673;223;636;685;120;225,226;198;198;198;223;39;91;39,91;729,731;208;198;198;198;37;611;804;710;223;226;668,669,670,671,672,673;226;198;632;38,194;198;198;198;198;226;198;198;678,679;226;226;206;225,226;250;198;198;198;198;223;246;226;226;226;723;425;198;380;351;351;830;226,668,669,670,671,672,673;198,279;194;226,668,669,670,671,672,673;198;411;223;206;214;198;226;222,250;226;745;198;226;685;226;593;226;198;198;488,489;226,668,669,670,671,672,673;198;199;226;198;226;198;841;365;226;226;622;205;205;198,547;198;198;198;198;198;136;840;238,668,669,670,671,672,673;837;226,668,669,670,671,672,673;225,226;223;198;6,7,8,9,10,11,12,13;226;220;37,514;119;226;226;226;226;226;226;555;348;226,668,669,670,671,672,673;37,298;226;575;196;226;240;198;226;198;198;226,668,669,670,671,672,673;226;226,668,669,670,671,672,673;206;226;226;240;226;208;226;266;226;198,257;198;198;198;198;198;235;206;257;258;785,786;317;198,210;198;155;246;198;198;226;223;226;5;198;198,210;198;244;226;198,210,685;226;226;198;206;668,669,670,671,672,673;198;226;226;682;226;210;210;210;685;685;198;518;65,198;206;561;37;226;762;226;198;643;206;198,279;664;91;633;711;368;226;710;244;226;196;219;198;226;223;840;219;226;198;226;492;198;208;198;395;445;445;198;254;91;257;250;226;120;91;226;196;226;226;445;445;198;226,668,669,670,671,672,673;206;226;225,226;198;198;460,461,462;210,318;385;214;198;226;37;206;206;585;196;198;773,774;840;226;282,283;842;198;226,668,669,670,671,672,673;226;198;729,730;37;208;226;235;196;198;226;585;223,747;198;608;226;256;226;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;460,461,462;685;198;198;685;198;226;871;226;226;226;198;226;226;198;526;798;226;23;226;263;226;226;226;226;790;198;200;226,668,669,670,671,672,673;585;226,668,669,670,671,672,673;226;206;794,795;91,126;198,210;313;198;198;208;198;198;226;226;226;132;49,50;246;226;226;226;226;198;240;226;132;226;91;25,333;256;198;225,226;226;226;194;223,767;585;120;585;226;226;226;222,250;226;664;226;85;220;226,668,669,670,671,672,673;200;226;196;198,208;54,206;226;226;226;664;331;256;37,54,585;198;226;37,54;585;198;198;226;198;198;505;226;226;840;840;196;223;226,668,669,670,671,672,673;226;25;840;840;336,337;336,337;196;198;226;226;240;198;239,668,669,670,671,672,673;226;34;235,668,669,670,671,672,673;226;226;223;690;37,298;37,54,198,206,298;225,226;388;254;226;226;226;198;198;37;226;226;37;226;226;226;206;198;198,210;223;226;269;25,528,529;226;226;226;99,100,101,102,103;226;198;377;182,189,190,191,192,193;226;226;226;198;128;226;198;225,226;226;91;198;208;210;169;226;226;226;460,461,462;226;198;531;226;43;198;225,226;525;198;538;198,279;132;226;226;226;585;269;223;37;668,669,670,671,672,673;226;198,210;226;226;162,163,164;226;92,93,94,95;226;269;198,206;198;198;256;204;198;39;39;206;206;198,206;226;226;226;198;226;828;226;198,206;86;198;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;226;226;266;161;683,709,710,713,714,718;226;127;563;239,668,669,670,671,672,673;225,226;654;226,668,669,670,671,672,673;198;226,668,669,670,671,672,673;254;210;200;226;226;57;668,669,670,671,672,673;511;226;198,465;226;226,668,669,670,671,672,673;226;585;226;564;226;226;207;226,668,669,670,671,672,673;226;239,668,669,670,671,672,673;226;250;706;752;226;84;854;301;223;278;226;198,208;232;558;226;226;194;39;159,160;226;780,781,782;203;206;638;226;214;171;226;226;198;198;226;226;198;39;226;226,668,669,670,671,672,673;198;237;223;226,668,669,670,671,672,673;422;206;460,461,462;116;810;198;240;387;198;226;226,668,669,670,671,672,673;223,746;86;198;226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;226;723;240;226;226;664;686,687,688;226;226;198,306;840;225,226;226;472;223;198;840;226;685;685;276;225,226;451;198;225,226;836;198;226;225,226;225,226;198;226;37;253;225,226;198;196;198;656;449;198;585;834;226;198;198;226;226;198;511,514;226;240;226;226;226;840;226,246;493;664;584;198;198;198;223;198;91;210;198;226;226;128;25;198;223;840;240;644;206;736;198;370;840;225,226;196;210;91;39;226;226;248;642;198;226;703,704;244;198;198,206;198;226;223;338;719,815,816;206;226;226;67;226;511;226;226;226;226;226;198;226;631;198;210;240;225,226;226;198;198;226;198;214;206;226;226;226;226;86;223;633;91;522;668,669,670,671,672,673;226;225,226;196;223;223;198;200;65;723;398;91;226;353;198;223,246;198;206;141,142,143,144,145,146;246;664;198;840;226;226;840;226;254;226;198;198;226;840;226;198;198;226;54;54,206;223;226;128;226;198;226;198;198;226;226;226,668,669,670,671,672,673;198;206,318;685;198;226;225,226;240;226;86;837;24;37;226,668,669,670,671,672,673;257;198;206;554;198;226;198;226;460,461,462;460,461,462;460,461,462;460,461,462;210;527;255;226;226;198;226;226;65;226;226;226;226;77,210;226;226;226;226;225,226;226;226;225,226;226;84;198;226;223;206,422;226,668,669,670,671,672,673;37;226;131;198;422;206;668,669,670,671,672,673;131;226;226,668,669,670,671,672,673;226;223;226;226;226;226;91;37;226;225,226;208;91;198;226;737,741;223;223;240;54;54;54;198;210;198;226;226;37;198;226;225,226;37;284;225,226;226;86;226;226;226;120;226;826;226;198;226;226;250,737;235,668,669,670,671,672,673;198;256;664;111,112,113,114;226;404;226;226;240;226;226;226;840;840;240;223;240;226;751;226;226;225,226;141,142,143,144,145,146;226;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;272;37;198;226;226;194;132;226;226;226;226;223;198;229,668,669,670,671,672,673;222,250;223;634;388;226;206;129;225,226;483,723;225,226;198;218;477;226;226,668,669,670,671,672,673;543;198;25,528,529;165,166,167;97;226,246;226,668,669,670,671,672,673;223;198;226;225,226;235;223;685;289;585;226,668,669,670,671,672,673;226,668,669,670,671,672,673;5;397;225,226;226;226,668,669,670,671,672,673;226;235;226;194;226;198;226,668,669,670,671,672,673;226;225,226;256;226;206;198;624;226;194;140;226;306;198;724,725,736;256;198;198;226;198;226;198;226;226;225,226;226;382;514;226;226;226;198;226;37;226;198;240;226;226;226;86;225,226;226,668,669,670,671,672,673;226;226;226;198;226;226;456;226,668,669,670,671,672,673;630;264;173,174,175;226,668,669,670,671,672,673;226;840;226,668,669,670,671,672,673;226;376;81,82;226,668,669,670,671,672,673;422;206;240;409;226;226;198;226;226;226;840;764;196;685;226;225,226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;37;226;226;240,668,669,670,671,672,673;226;840;226;223;226;65;660;633;226;37;200;37;252;198;198;131;116;358;585;198;226;840;226;240;239,668,669,670,671,672,673;226;226;210;225,226;226;198,206;206;198;225,226;422;840;226;226,668,669,670,671,672,673;493;223;226,668,669,670,671,672,673;120;685;685;226;226;567;198;198;206;226,668,669,670,671,672,673;198;226;223;153,154;198;226;840;198;429;226;226;226;226;226;226;226;198,257;226;198;226;429;37,54,585;226;226;226;375;226;120;198;226;226;493;668,669,670,671,672,673;373;226;226;240;37;226;226;226;37;574;226;226,668,669,670,671,672,673;85,214;535;226;226;226;37,198;226;483,723;198;198,200;117;436;226;226,668,669,670,671,672,673;225,226;226;240;226;668,669,670,671,672,673;223;37;859;226,668,669,670,671,672,673;226,668,669,670,671,672,673;198;486;668,669,670,671,672,673;37;226;54,198,206,279;226;223;226;198;226;256;226;226;226;198,279;198,279;226;226;198;226;225,226;226;198;452;226;240;198;340;222,250;226;840;198;840;198;235;37;37;218;516;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;273;383;664;198;226;254;128;226;198;226;247;198;449;54;226;246;226,668,669,670,671,672,673;226;226;198;226;226;226;226;226,668,669,670,671,672,673;608;226;226;198;365;685;196;194;226;226;840;85;222,250;422;198;585;196;847,-852,-853,-854;0,1;198;685;198;226;240;226;141,142,143,144,145,146;226,668,669,670,671,672,673;226;226;226;226;226;225,226;226;198,279;198,279;198;198;225,226;226;226;226;226;198,562;198;37,206;226;226;226;270,271;206;226;685;225,226;226;226;198;318;226;240;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;246;840;797;237;226;240;226;668,669,670,671,672,673;226;226;198;240;226;198;226;226;226;226;256;226;226;226;226;194;198;733;226;226;226;54;110;225,226;585;585;585;226;226;132;226;225,226;226;226;53;225,226;226;840;840;198;226;429;37;667;226;225,226;198;226;226;226;198;226;226;226;722;423;43;198;226;840;226;226;226;226;388;226;226;226;226;226;429;198;225,226;226;218;43;170;226;196;668,669,670,671,672,673;226;226,668,669,670,671,672,673;226;226;198;226,668,669,670,671,672,673;198;198;269;685;86;226;198;225,226;198;240;668,669,670,671,672,673;86;226;198;226;198;226;226;132;339;226;128;218;226;246;226;76;269;198;249;214;225,226;226;226;226;226;226,668,669,670,671,672,673;225,226;240;128;226,668,669,670,671,672,673;226;90;226;226;226;226;226;246,668,669,670,671,672,673;225,226;206;223;37,198;394;226;225,226;240;198;585;226;226;198,210;226;226,668,669,670,671,672,673;225,226;422;225,226;308;223;226,668,669,670,671,672,673;226;226;226,668,669,670,671,672,673;240,668,669,670,671,672,673;198;225,226;226;226;414;223;223;226;223;196;226;226;226,668,669,670,671,672,673;210;136;223;226;226;226,668,669,670,671,672,673;226;226;237;225,226;198;198;226;226;226;512,513;223;226;198;43;226;226;226;206;226;206,422;222,223,246;196;685;86;226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;223;126;226;226;225,226;226;306;198;198;226;226,668,669,670,671,672,673;840;709,710;683,709,710;226;617;226;240;226;226;226;66;226;422;585;226;226;523;226;196;226;226,668,669,670,671,672,673;226;226,668,669,670,671,672,673;226;226;226;226;840;570;240;218;226;128;226;338;223;226;198;198;226;200;226;226;226;226;226;226;226;802,803;206;226;206;226;226;226,668,669,670,671,672,673;226;320;226;226;710,716,717;226,231,668,669,670,671,672,673;422;208;422;198;226;226;226;226;240;585;206;208;198;198;585;559;226;226;198,279;198;226,668,669,670,671,672,673;840;226,668,669,670,671,672,673;389;206,279;223;226;92,93,94,95;119;226;226;226;668,669,670,671,672,673;225,226;226;226;91;223;226,668,669,670,671,672,673;223;188;240;226;600,601;226;226;223;225;240;226;226;683,692,709,710,711;198;39;226;226;435;226;198;226;226;198;254;570;29,30;214,215;226;226;226;198;222,250;226;226;200;132;226;206;226;226;226;282,283;226;226;685;198;147;514;225,226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;668,669,670,671,672,673;226,668,669,670,671,672,673;309;226;226;460,461,462;226;226;226;226;37;223;685;585;240;226;225,226;198;226;198,279;198;840;226;225,226;226;225,226;318,485;225,226;824;226;226;132;226;226;225,226;226;226;134;226;240;225,226;91;240;257;196;257;198;240;226;198;218;226;793;226;225,226;225,226;223;222,250;226;226;198;226;537;223;226;226;226;610;37;225;226;668,669,670,671,672,673;840;226;226,246,668,669,670,671,672,673;225,226;514;225,226;668,669,670,671,672,673;37;226;119;226;226;840;840;168;226;225,226;240;226;198;198;226;618;153,154;226;136;226;226;225,226,235;668,669,670,671,672,673;226;226;226;226;37;226;225,226;198;856,857,858;573;226;226;198;132;226;402;808;664;235;226;289;198;468;206;226;223;223;225,226;226,668,669,670,671,672,673;198;226;198;226;226;226;225,226;206;226;226;226;226;226;226;226;269;136;226;198;226;198;244;198;208;134;226;206,532,533;532,533;532,533;86;53;223;226;223,226;235,668,669,670,671,672,673;226;226;226;226;226;226;226;140;226;226;226,668,669,670,671,672,673;360;226,668,669,670,671,672,673;198;198;226;226;198;424;223;37,514;226;226;548;206;218;225,226;226;198;226;196;226,668,669,670,671,672,673;226;676;237,668,669,670,671,672,673;223;226,246;198;116;198;223;226;226;226,668,669,670,671,672,673;226;242;226;226;226;226;709;198;226;226;226,668,669,670,671,672,673;54,206;225,226;668,669,670,671,672,673;250;577;222,250;226,668,669,670,671,672,673;226;226;226,668,669,670,671,672,673;226;372;226;198;226;240;66;198;226;200;226;226;840;840;226;92,93,94,95;225,226;585;226;226;198;226;37;226;196;37;226;198;196;198;198;226;132;226;226;235;433;198;206;226;226;226;225,226;198;226;840;225,226;111,112,113,114;226;37,54,585;226;226;198;668,669,670,671,672,673;226,246;585;226,668,669,670,671,672,673;198,279;86;226;267;585;226;128;198;198,206,279;514;198;198;585;198;208;709;226;226;226,668,669,670,671,672,673;223;422;226;226;226;226;223;226;226;226;198;225,226;223,226;162,163,164;226;668,669,670,671,672,673;479;840;840;198;225,226;226;198;226;119;223;226;226;198;226;226;219;132;226;64;226;39;430;473;226;603;194;226;226;226;226;206;422;226;219;206;225,226;225,226;198;225,226;847,-849,-850,-851;223;198;226;225,226;226;226;226;226;226;664;664;198,279;223;292;406,407;279;226;223;196;198;198;198;226;77;226;509;226;225,226;225,226;502,503;226,235;586;583;226;198;198;240;54;225,226;240;225,226;226;737;758;226;226;226;226;226;226;226;840;226;223;226;226;300;226;226;226;651,652;226;585;223;226;226;226;226;226;225,226;226;226;91;226;226;226,668,669,670,671,672,673;225,226;226;226;226;709;226;226;738,739,740;198;388;226;226;226;225,226;225,226;510;97;226;666;649;226;226;226;225,226;43;429;226;665;198;226;198;206;226;226;53;226;226;840;226;226;431;226;91,126;198;223;226;198;225,226;226;285;225,226;226;125;226;226;132;129,156,157,158;700,701;239;226;226;226;226;226,668,669,670,671,672,673;225,226;226;226,668,669,670,671,672,673;226;226;668,669,670,671,672,673;223;226;226,668,669,670,671,672,673;246;132;226,237,668,669,670,671,672,673;244;5;225,226;226;239,668,669,670,671,672,673;226;226;226;226;198;840;840;226;604;226;225,226;226;223;198;226;226;226;225,226;226;226;226;53;840;226,668,669,670,671,672,673;198;226;226;226;226;226;226;225,226;39;226;226;226;226;66;37;226;198;497,498;226;226;226;226;226;208;840;226;240;226;226;226;226;225,226;226,668,669,670,671,672,673;240;226;226;226,668,669,670,671,672,673;289;240;226;226;226;226;111,112,113,114;132;226;226;422;585;223;198;226;610;695,696;226;226;226;585;198,279;226;226;226;226;206,210,279;226;595;198;25;196;198;225,226;226;240;196;226;250;226;119;840;244;206;226;226;206;226;226;198;620;306;237;360;226;226;226;225,226;61;279,518;685;91;712;226;198;151,152;281,698,699,713,714,824;226;226;226;196;226;198,279;226;226,668,669,670,671,672,673;223;226;26;226;240;226;198;226;225,226;223;226;65;379;225,226;416;198;91;92,93,94,95;92,93,94,95;198;54;226;226;225,226;226;226;247;226;226;226;226;198;226;226,668,669,670,671,672,673;225,226;198,511;226;240;469;223;128;226;705;226;405;225,226;226;226;198;226;222,250;226;226;18,557;226;226;198;226;226;198;226;226;668,669,670,671,672,673;840;223;225,226;91;194;226;226;226;226;226,668,669,670,671,672,673;226;240;226;240;501;226;226;22;230,668,669,670,671,672,673;226;223;226,668,669,670,671,672,673;225,226;240;132;681;225,226;814;226;226;226;240;237;72;668,669,670,671,672,673;442;225,226;225,226;118;226;240;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;132;223;226;226;681;226,668,669,670,671,672,673;225,226;104,105;225,226;226,668,669,670,671,672,673;225,226;840;226;723;225,226;226;226;226;116;226;226;226,668,669,670,671,672,673;225,226;53;226;226;840;226;206;226;198;226;196;132;668,669,670,671,672,673;226;602;196;198;198;226;840;226;835;138,139;226,668,669,670,671,672,673;226,668,669,670,671,672,673;723;226;226;226;198;223;226;520;39;226;37,198;226;355;226;226;226;226,668,669,670,671,672,673;585;223;585;240;198,279;585;225,226;226;244;226;432;206;198,279,870;226;226;226;226;225,226;198;196;840;198;225,226;560;240;226;206;226;226;218;226;198;240;86;226;198;198;226,668,669,670,671,672,673;225,226;132;223;219;244;226;226;226;226;685;226;226;223;226;675,710;225,226;226;226;240;226;226;226;226;119;238,668,669,670,671,672,673;226;226;840;226;226;226;226;25;240;226;226;198;225,226;668,669,670,671,672,673;196;240;223,763;198;206;226;226;226,244;91;39;128;225,226;225,226;226;226;37;510;226;226,246;226;225,226;226;226;226,668,669,670,671,672,673;226;226;723;226;225,226;226;565;666;198;226;710,718;840;226;225,226;226;226;226;226;226;226;226;132;223;592;226;81,82;128;128;198;226;226;196;226;226;226;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226,235;240;226;549;226;226;226;226;225,226;226;226;226;226;226;226;225,226;226;198;226,668,669,670,671,672,673;226,668,669,670,671,672,673;226;840;226;226;204;226;226;709,710,757;198;226;453;225,226;226,668,669,670,671,672,673;226;240;226;226;65;225,226;226;239,668,669,670,671,672,673;226;226;585;223;226;723;119;206,208,324,325;198;132;198;226,668,669,670,671,672,673;206;225,226;226;226;226;25;196;225,226;223;713,714;585;132;422;198;226;198;219;219;226;226;225,226;226;226;198;840;226;226;223;196;226;840;226;226;226;225,226;223;131;226,246,668,669,670,671,672,673;226;226;225,226;198;226;433;226;226;206;71;226;226;225,226;323;223;226;226;226;214;226;226;226;226;738,739,740;138,139;840;226;225,226;422;196;840;226;226;226;226;226;225,226;225,226;226;198;226;226;585;226;226;226;198;226;840;226;226;226;226;226;225,226;840;92,93,94,95;226;585;226;226;443;484;226;198;226;226;206,279;92,93,94,95;226;196;196;840;226;840;226;226,668,669,670,671,672,673;219;840;226;226;97;196;226;198;840;226;226;37;198;226;585;615;225,226;198;226,235,668,669,670,671,672,673;723;198;225,226;226;226;226;416;196;735;664;225,226;225,226;226;226;81,82;226;198;668,669,670,671,672,673;226;226;206;198;226;581;225,226;128;465;240;226;226;198;226;226;225,226;225,226;226;226;225,226;226;226;225,226;840;226;226,668,669,670,671,672,673;198;3,546;196;66;198;226;840;226;226;226;225,226;713,714;162,163,164;226;196;129,156,157,158;240;226;585;226;225,226;226;226,247,668,669,670,671,672,673;198;198;223;226;226;226;198;225,226;226;226;226;226;840;668,669,670,671,672,673;226;715;196;198;225,226;225,226;226,668,669,670,671,672,673;198;198,391;578,579,860,861;131;226;226;225,226;223;225,226;226;214;192;225,226;204;226;226;240;226;225,226;664;840;198;198,279;92,93,94,95;225,226;225,226;226;225,226;226;206;226;226;226;225,226;226;840;840;226;226;226,246,668,669,670,671,672,673;257;226;226;226;196;666;226;226;225,226;296;226;226;225,226;226;226;226;198;226;198;226;66;223;840;226;226;226;225,226;223;226;664;225,226;226,668,669,670,671,672,673;196;225,226;225,226;240;664;226;226;206;198;628;132;225,226;223;226;226;225,226;697;226;226,246;226;196;226;226;226;225,226;226;226;66;226;225,226;840;225,226;223;128;226;226,668,669,670,671,672,673;198;218;840;196;225,226;25;198;244;226,668,669,670,671,672,673;226;128;198;585;198;226;198;219;225,226;200,210;226;223;226,668,669,670,671,672,673;226;226;226,668,669,670,671,672,673;198;609;226;198;374;226;198;128;226;223;226,246,668,669,670,671,672,673;223;225,226;198;198;223;214;198;206";

const $scriptletHostnames$ = /* 5390 */ ["s.to","ak.sv","g3g.*","hqq.*","my.is","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","tv3.lt","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","3si.org","6mt.net","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","g20.net","get2.in","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moco.gg","moin.de","movi.pk","mrt.com","msn.com","mx6.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","15min.lt","250r.net","2embed.*","4game.ru","7mmtv.sx","9xflix.*","a5oc.com","adria.gg","akff.net","alkas.lt","alpin.de","b15u.com","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cety.app","cnet.com","cybar.to","devlib.*","dlhd.*>>","dooood.*","dotgg.gg","ehmac.ca","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","feoa.net","file.org","findav.*","fir3.net","flixhq.*","focus.de","frvr.com","fz09.org","gala.com","game8.jp","golog.jp","gr86.org","gsxr.com","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","lejdd.fr","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","mtbr.com","nikke.gg","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","rdr2.org","redis.io","rintor.*","rs25.com","sb9t.com","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","tokon.gg","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wdwnt.jp","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xvip.lat","yabai.si","ytstv.me","zcar.com","zooqle.*","zx6r.com","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","3minx.com","4game.com","4stream.*","5movies.*","600rr.net","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","ats-v.org","ausrc.com","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","bc4x4.com","beeg.porn","bigwarp.*","blkom.com","bmwlt.com","bokep.top","camhub.cc","canoe.com","casi3.xyz","cbrxx.com","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cutty.app","cybar.xyz","d000d.com","d0o0d.com","daddyhd.*","dippy.org","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","exego.app","expres.cz","fabtcg.gg","fap18.net","faqwiki.*","faselhd.*","fawzy.xyz","fc2db.com","file4go.*","finfang.*","fiuxy2.co","flagle.io","fmovies.*","fooak.com","forsal.pl","ftuapps.*","fx-22.com","garota.cf","gayfor.us","ghior.com","globo.com","glock.pro","gloria.hr","gplinks.*","grapee.jp","gt350.org","gtr.co.uk","gunco.net","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hkpro.com","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","ifish.net","igfap.com","imboc.com","imgur.com","imihu.net","innal.top","inxxx.com","iwsti.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kezdo5.hu","kickass.*","kissjav.*","knowt.com","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","magma.com","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","mini2.com","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mr2oc.com","msic.site","mynet.com","nagca.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","ngemu.com","nhlbox.me","nlegs.com","novas.net","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","r32oc.com","raider.io","remaxhd.*","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tccoa.com","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","ttora.com","tutele.sx","ucptt.com","upzur.com","usi32.com","v6z24.com","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vn750.com","vogue.com","voodc.com","vplink.in","vtxoa.com","waezg.xyz","waezm.xyz","watson.de","wdwnt.com","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xdabo.com","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","yjiur.xyz","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1000rr.net","1130cc.com","1919a4.com","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","555fap.com","5ghindi.in","720pflix.*","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","aether.mom","alfabb.com","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","basset.net","bmamag.com","boyfuck.me","btvplus.bg","buzter.xyz","c-span.org","cashurl.in","cboard.net","cbr250.com","cbr250.net","cdn256.xyz","cgtips.org","club3g.com","club4g.org","clubxb.com","cnpics.org","corral.net","crictime.*","ctpost.com","cutnet.net","cztalk.com","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","ex-500.com","exambd.net","f1stream.*","f650.co.uk","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","fitbook.de","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fz07oc.com","fzmovies.*","g5club.net","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gixxer.com","gmenhq.com","go2gbo.com","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","gunhub.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","i4talk.com","i5talk.com","ib-game.jp","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","lorcana.gg","love4u.net","ls1gto.com","ls1lt1.com","m.4khd.com","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","model2.org","morels.com","motor1.com","movies4u.*","movix.blog","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","mytreg.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nonixxx.cc","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nybass.com","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","opelgt.com","otakomu.jp","ovabee.com","paypal.com","pctfenix.*","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prius5.com","prmovies.*","proxybit.*","pxxbay.com","qrixpe.com","r8talk.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","supra6.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thevog.net","tiscali.cz","tlzone.net","tnmusic.in","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vtcafe.com","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xdtalk.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xrv.org.uk","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","ygozone.gg","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zenless.gg","zpaste.net","zx-10r.net","11xmovies.*","123movies.*","2monkeys.jp","360tuna.com","373news.com","3800pro.com","3dsfree.org","460ford.com","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","adxtalk.com","aipebel.com","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bfclive.com","bg-mania.jp","bi-girl.net","bigshare.io","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bolighub.dk","bowfile.com","btcbitco.in","caitlin.top","camaros.net","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","civinfo.com","clubrsx.com","clubwrx.net","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","cracked.com","crx7601.com","cuervotv.me","cults3d.com","cutlink.net","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","dootalk.com","downvod.com","dropgame.jp","ds2play.com","ds450hq.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","elliott.org","embedpk.net","emuenzen.de","endfield.gg","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnforum.net","fnjplay.xyz","fntimes.com","focusrs.org","focusst.org","fplzone.com","fsharetv.cc","fullymaza.*","g-porno.com","g8board.com","g8forum.com","gamewith.jp","gbatemp.net","get-to.link","ghbrisk.com","gigafile.nu","gm-volt.com","go.zovo.ink","gocast2.com","godlike.com","gold-24.net","goodcar.com","govtech.com","grasoku.com","gtrlife.com","gupload.xyz","haytalk.com","hellcat.org","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","impalas.net","in91vip.win","itopmusic.*","jaginfo.org","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","javx357.com","jawapos.com","jelonka.com","jemsite.com","jetpunk.com","jixo.online","jjang0u.com","jocooks.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","k-bikes.com","k3forum.com","kaliscan.io","karanpc.com","kboards.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","laposte.net","letocard.fr","lexpress.fr","lfpress.com","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m1xdrop.net","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","minif56.com","mirrorace.*","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","mx5life.com","mx5nutz.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","ninjah2.org","nodo313.net","nontonx.com","noreast.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onefora.com","onepiece.gg","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","pdfdrive.to","peeplink.in","pelisplus.*","pigeons.biz","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","rekogap.xyz","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","sadisflix.*","safetxt.net","sailnet.com","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharclub.in","sharing.wtf","shavetape.*","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","svrider.com","syosetu.com","t-online.de","tabooflix.*","talkesg.com","tbsradio.jp","teachoo.com","techbook.de","techguy.org","teltarif.de","teryxhq.com","thehour.com","thektog.org","thenewx.org","tidymom.net","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","trx250r.net","trx450r.org","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tundra3.com","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","unixmen.com","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vtxcafe.com","vwforum.com","vwscout.org","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","x7forum.com","xdforum.com","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","xpshort.com","yesmovies.*","youtube.com","yumeost.net","yxztalk.com","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","1911talk.com","3dshoots.com","46matome.net","4archive.org","4btswaps.com","50states.com","68forums.com","700rifle.com","718forum.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8thcivic.com","992forum.com","aamulehti.fi","acrforum.com","adricami.com","akinator.com","alexsports.*","alexsportz.*","allcoast.com","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","audiforum.us","autoc-one.jp","avseesee.com","avsforum.com","babylinks.in","bamgosu.site","bapetalk.com","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepindoh.*","bokepnya.com","boltbeat.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","bz-berlin.de","bzforums.com","capoplay.net","carparts.com","casthill.net","catcrave.com","catfish1.com","catforum.com","cesoirtv.com","chaos2ch.com","chatango.com","cheftalk.com","chopchat.com","choralia.net","chrforums.uk","clickapi.net","cobaltss.com","coingraph.us","cookierun.gg","crazyblog.in","cricstream.*","cricwatch.io","crzforum.com","cuevana3.fan","cutyurls.com","cx30talk.com","cx3forum.com","d-series.org","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","divicast.com","divxtotal1.*","dizikral.com","dogforum.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","edukaroo.com","egyanime.com","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","exe-urls.com","expertvn.com","f6cforum.com","factable.com","falatron.com","fansided.com","fapptime.com","feed2all.org","fetchpik.com","fiestast.net","fiestast.org","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","footybite.to","fordtough.ca","forexrw7.com","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gcaptain.com","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gsxs1000.org","gtoforum.com","gulflive.com","gvforums.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","hrvforum.com","huntress.com","hvacsite.com","ibelieve.com","ibsgroup.org","ihdstreams.*","imagefap.com","impreza5.com","impreza6.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","ixforums.com","jablickar.cz","jav-coco.com","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jkowners.com","jobsheel.com","jp-films.com","k5owners.com","kasiporn.com","kazefuri.net","kfx450hq.com","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","klrforum.com","krxforum.com","ktmatvhq.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","lawnsite.com","layitlow.com","legacygt.org","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","liddread.com","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","lostsword.gg","ltr450hq.com","luluvdoo.com","lxforums.com","m14forum.com","macworld.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masscops.com","masslive.com","matacoco.com","mbeqclub.com","mediaite.com","mega-mkv.com","mg-rover.org","mhdtvworld.*","migweb.co.uk","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkcforum.com","mkvcinemas.*","mkzforum.com","mmaforum.com","mmamania.com","mmsbee27.com","mmsbee42.com","mmsbee47.com","modocine.com","modrinth.com","modsbase.com","modsfire.com","momsdish.com","mooonten.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","mvagusta.net","myaudiq5.com","myflixerz.to","mykitsch.com","mytiguan.com","nanolinks.in","nbadraft.net","ncangler.com","neodrive.xyz","neowners.com","netatama.net","newatlas.com","newninja.com","newsyou.info","neymartv.net","niketalk.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nugglove.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","paw-talk.net","pennlive.com","photopea.com","pigforum.com","planet-9.com","playertv.net","plowsite.com","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","prcforum.com","pressian.com","programme.tv","pubfilmz.com","publicearn.*","pwcforum.com","qyiforum.com","r1-forum.com","r1200gs.info","r2forums.com","r6-forum.com","r7forums.com","r9riders.com","rainmail.xyz","ramrebel.org","rapelust.com","ratforum.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","riftbound.gg","rlxforum.com","ronaldo7.pro","roporno.info","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","rxforums.com","rxtuners.com","ryaktive.com","rzforums.com","s10forum.com","saablink.net","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","shrtslug.biz","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","snowbreak.gg","sodomojo.com","sonixgvn.net","spatsify.com","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","ssforums.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","stylebook.de","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","technons.com","teleclub.xyz","teluguflix.*","terra.com.br","texas4x4.org","thehindu.com","themezon.net","theverge.com","toonhub4u.me","topdrama.net","topspeed.com","torrage.info","torrents.vip","tradtalk.com","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","tusfiles.com","tutlehd4.com","tutsnode.org","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","twospoke.com","uk-audis.net","uk-mkivs.net","ultraten.net","umamusume.gg","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","veloster.org","vertigis.com","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","vnjpclub.com","volokit2.com","vpcxz19p.xyz","vwidtalk.com","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","whatgame.xyz","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xcrforum.com","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xlrforum.com","xmowners.com","xopenload.me","xopenload.pw","xpornium.net","xtratime.org","xxxstream.me","youboxtv.com","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zrvforum.com","zvision.link","zxforums.com","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","124spider.org","1911forum.com","1bitspace.com","200forums.com","247sports.com","350z-tech.com","355nation.net","4c-forums.com","4horlover.com","4kwebplay.xyz","4xeforums.com","560pmovie.com","680thefan.com","6hiidude.gold","6thgenram.com","7fractals.icu","abc17news.com","abhijith.page","aceforums.net","actusports.eu","adblocktape.*","addapinch.com","advertape.net","aeblender.com","aiimgvlog.fun","alexsportss.*","alfaowner.com","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atchuseek.com","atv-forum.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","b15sentra.net","bacasitus.com","badmouth1.com","bakedbree.com","bcaquaria.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","benzforum.com","benzworld.org","bestfonts.pro","bethcakes.com","bettafish.com","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bluetraxx.com","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buelltalk.com","buffstreams.*","c10trucks.com","caferacer.net","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","cefirates.com","chanto.jp.net","cheater.ninja","chevelles.com","chevybolt.org","chumplady.com","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","club700xx.com","clubtitan.org","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","coltforum.com","columbian.com","concomber.com","coolcast2.com","corsa-c.co.uk","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","currytrail.in","cx70forum.com","cx90forum.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","dayspedia.com","depvailon.com","dfwstangs.net","dizikral1.pro","dizikral2.pro","dodgetalk.com","dogforums.com","dooodster.com","downfile.site","dphunters.mom","dragonball.gg","dragontea.ink","drivenime.com","e2link.link>>","ebonybird.com","elantraxd.com","eldingweb.com","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","esladvice.com","ethearmed.com","etoland.co.kr","evotuners.net","ex90forum.com","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fjcforums.com","fjrowners.com","flixhouse.com","flyfaucet.com","flyfishbc.com","fmachines.com","focusrsoc.com","focusstoc.com","fordgt500.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","geoguessr.com","gifu-np.co.jp","giornalone.it","glaowners.com","glcforums.com","globalrph.com","glocktalk.com","golfforum.com","gopitbull.com","governing.com","gputrends.net","grantorrent.*","gromforum.com","gunboards.com","gundamlog.com","gunforums.net","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","hobbytalk.com","hondagrom.net","honkailab.com","hornylips.com","hoyoverse.com","huntingpa.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","ikonforum.com","ilxforums.com","indiewire.com","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itmedia.co.jp","itunesfre.com","javsunday.com","jeepforum.com","jimdofree.com","jisakuhibi.jp","jkdamours.com","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","k900forum.com","kahrforum.com","kamababa.desi","kckingdom.com","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","krepsinis.net","krussdomi.com","ktmforums.com","kurashiru.com","lek-manga.net","lifehacker.jp","likemanga.ink","listar-mc.net","liteshort.com","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lotustalk.com","lowellsun.com","m.inven.co.kr","macheclub.com","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","marvel.church","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","metin2hub.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","mothering.com","motor-talk.de","motorgeek.com","moutogami.com","moviekhhd.biz","moviepilot.de","moviesleech.*","moviesverse.*","movieswbb.com","moviezwaphd.*","mp-pistol.com","mp4upload.com","multicanais.*","musescore.com","mx30forum.com","myfastgti.com","myflixertv.to","mygolfspy.com","myhomebook.de","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newbeetle.org","newcelica.org","newcougar.org","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","ottawasun.com","overclock.net","ozlosleep.com","pagalworld.cc","painttalk.com","pandamovie.in","patrol4x4.com","pc-builds.com","pearforum.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","picdollar.com","pillowcase.su","piloteers.org","pinkueiga.net","pirate4x4.com","pirateiro.com","pitchfork.com","pkbiosfix.com","planet4x4.net","pnwriders.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","ptcgpocket.gg","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","r125forum.com","r3-forums.com","ramforumz.com","rarethief.com","raskakcija.lt","rav4world.com","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rhinotalk.net","riggosrag.com","rnbxclusive.*","roadglide.org","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","rswarrior.com","rugertalk.com","rumbunter.com","rzrforums.net","s3embtaku.pro","saabscene.com","saboroso.blog","sarforums.com","savefiles.com","scatkings.com","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","shorttrick.in","silverblog.tv","silverpic.com","simana.online","sinemalar.com","sinsitio.site","skymovieshd.*","slotforum.com","smartworld.it","snackfora.com","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","sparktalk.com","speedporn.net","speedwake.com","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","sr20forum.com","srtforums.com","starstyle.com","steyrclub.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","sv-portal.com","swissotel.com","t-goforum.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","tapmyback.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","tennspeed.net","thekitchn.com","thelayoff.com","themgzr.co.uk","thepoke.co.uk","thethings.com","thothub.today","tidalfish.com","tiermaker.com","timescall.com","timesnews.net","titantalk.com","tlnovelas.net","tlxforums.com","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","travelbook.de","traxforum.com","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","trxforums.com","ttforum.co.uk","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","ukcorsa-d.com","umamigirl.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","velostern.com","vibestreams.*","vid-guard.com","vidspeeds.com","vipstand.pm>>","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","volkszone.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","vweosclub.com","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","xc40forum.com","xcamcovid.com","xfforum.co.uk","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zdxowners.com","zorroplay.xyz","zotyezone.com","zx4rforum.com","123easy4me.com","123movieshub.*","300cforums.com","300cforumz.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","7thmustang.com","9to5google.com","a1-forum.co.uk","actu.orange.fr","actugaming.net","acuraworld.com","aerotrader.com","afeelachat.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcorsa.co.uk","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","androidacy.com","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","ar15forums.com","arcticchat.com","armslocker.com","artoffocas.com","ashemaletube.*","astro-seek.com","at4xowners.com","atchfreeks.com","atvtorture.com","azbasszone.com","balkanteka.net","bamahammer.com","bersaforum.com","bhugolinfo.com","bimmerfest.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","bmw-driver.net","bmwevforum.com","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buceesfans.com","buchstaben.com","burgmanusa.com","calgarysun.com","camarozone.com","camberlion.com","can-amtalk.com","carrnissan.com","cheatsheet.com","choco0202.work","cine-calidad.*","cl500forum.com","clashdaily.com","clicknupload.*","cloudvideotv.*","clubarmada.com","clubsearay.com","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cretaforum.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","ctsvowners.com","cuevana3hd.com","cumception.com","curseforge.com","cx500forum.com","cx50forums.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","dealsforum.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dodge-dart.org","dodgersway.com","dofusports.xyz","dolldivine.com","dpselfhelp.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","epaceforum.com","erayforums.com","esportbike.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","evoxforums.com","expatforum.com","extreme-down.*","f-typeclub.com","f150forumz.com","f800riders.org","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","fiestastoc.com","filmizleplus.*","filmy4waps.org","fireblades.org","fishforums.com","fiskerbuzz.com","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","foodtechnos.in","fordescape.org","fordforums.com","fordranger.net","forex-trnd.com","formyanime.com","forteturbo.org","forumchat.club","foxyfolksy.com","fpaceforum.com","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","furyforums.com","fz-10forum.com","g310rforum.com","galleryxh.site","gamefishin.com","gamepcfull.com","gameshop4u.com","gamingfora.com","gayforfans.com","gaypornhot.com","gearpatrol.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","glockforum.com","glockforum.net","gmfullsize.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gr-yaris.co.uk","gravureblog.tv","gtaaquaria.com","guitars101.com","gujjukhabar.in","gunandgame.com","gyanitheme.com","hauntforum.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hinoforums.com","hondatwins.net","horseforum.com","hotgranny.live","hotrodders.com","hotukdeals.com","hummerchat.com","hwnaturkya.com","iisfvirtual.in","imgtraffic.com","inattv1212.xyz","inattv1213.xyz","inattv1214.xyz","inattv1215.xyz","inattv1216.xyz","inattv1217.xyz","inattv1218.xyz","inattv1219.xyz","inattv1220.xyz","inattv1221.xyz","inattv1222.xyz","inattv1223.xyz","inattv1224.xyz","inattv1225.xyz","inattv1226.xyz","inattv1227.xyz","inattv1228.xyz","inattv1229.xyz","inattv1230.xyz","inattv1231.xyz","inattv1232.xyz","inattv1233.xyz","inattv1234.xyz","inattv1235.xyz","inattv1236.xyz","inattv1237.xyz","inattv1238.xyz","inattv1239.xyz","inattv1240.xyz","inattv1241.xyz","inattv1242.xyz","inattv1243.xyz","inattv1244.xyz","inattv1245.xyz","inattv1246.xyz","inattv1247.xyz","inattv1248.xyz","inattv1249.xyz","inattv1250.xyz","inattv1251.xyz","inattv1252.xyz","inattv1253.xyz","inattv1254.xyz","inattv1255.xyz","inattv1256.xyz","inattv1257.xyz","inattv1258.xyz","inattv1259.xyz","inattv1260.xyz","inattv1261.xyz","inattv1262.xyz","inattv1263.xyz","inattv1264.xyz","inattv1265.xyz","inattv1266.xyz","inattv1267.xyz","inattv1268.xyz","inattv1269.xyz","inattv1270.xyz","inattv1271.xyz","inattv1272.xyz","inattv1273.xyz","inattv1274.xyz","inattv1275.xyz","inattv1276.xyz","inattv1277.xyz","inattv1278.xyz","inattv1279.xyz","inattv1280.xyz","inattv1281.xyz","inattv1282.xyz","inattv1283.xyz","inattv1284.xyz","inattv1285.xyz","inattv1286.xyz","inattv1287.xyz","inattv1288.xyz","inattv1289.xyz","inattv1290.xyz","inattv1291.xyz","inattv1292.xyz","inattv1293.xyz","inattv1294.xyz","inattv1295.xyz","inattv1296.xyz","inattv1297.xyz","inattv1298.xyz","inattv1299.xyz","inattv1300.xyz","indiatimes.com","infinitifx.org","infogenyus.top","inshorturl.com","insidehook.com","ioniqforum.com","ios.codevn.net","iplayerhls.com","iplocation.net","isabeleats.com","isekaitube.com","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jdfanatics.com","jeepgarage.org","jizzbunker.com","joemonster.org","joyousplay.xyz","jpaceforum.com","jpopsingles.eu","jukeforums.com","jyoseisama.com","k1600forum.com","kakarotfoot.ru","kanyetothe.com","katoikos.world","kawiforums.com","kia-forums.com","kickassanime.*","kijolariat.net","kimbertalk.com","kompasiana.com","ktmforum.co.uk","leaderpost.com","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","low-riders.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","m109riders.com","macanforum.com","mactechnews.de","mahajobwala.in","mahitimanch.in","majestyusa.com","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","manutdtalk.com","marcialhub.xyz","mastkhabre.com","mazda6club.com","mazdaworld.org","megapastes.com","meusanimes.net","microskiff.com","minitorque.com","mkv-pastes.com","monacomatin.mc","mondeostoc.com","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mtc3.jobsvb.in","mumuplayer.com","mundowuxia.com","musketfire.com","my.irancell.ir","myeasymusic.ir","mymbonline.com","nana-press.com","naszemiasto.pl","nayisahara.com","newmovierulz.*","newnissanz.com","news-buzz1.com","news30over.com","newscionxb.com","newtiburon.com","nhregister.com","ninernoise.com","niocarclub.com","nissanclub.com","nookgaming.com","nowinstock.net","nv200forum.com","nyfirearms.com","o2tvseries.com","ocregister.com","ohsheglows.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","outbackers.com","pandamovies.me","pandamovies.pw","pandaspor.live","pantrymama.com","paste-drop.com","pastemytxt.com","pathofexile.gg","pelando.com.br","pencarian.link","petitrobert.fr","pinchofyum.com","pipandebby.com","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playingmtg.com","playtube.co.za","populist.press","pornhd720p.com","pornincest.net","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","priusforum.com","projeihale.com","proxyninja.org","psychobike.com","q2forums.co.uk","qiqitvx84.shop","quest4play.xyz","rabbitdogs.net","ramblinfan.com","ramevforum.com","rc350forum.com","rc51forums.com","record-bee.com","reisefrage.net","remixsearch.es","resourceya.com","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rugerforum.net","runeriders.com","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","section215.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shadowverse.gg","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","sigarms556.com","singjupost.com","sizecharts.net","skidrowcpy.com","slatedroid.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","solanforum.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speedzilla.com","speisekarte.de","spieletipps.de","sportbikes.net","sportsurge.net","spyderchat.com","spydertalk.com","srt10forum.com","srt4mation.com","ssrfanatic.com","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","stripehype.com","studyfinds.org","superhonda.com","supexfeeds.com","swatchseries.*","swedespeed.com","swipebreed.net","swordalada.org","tamilprinthd.*","taosforums.com","tarokforum.com","taurusclub.com","tbssowners.com","tea-coffee.net","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thefitchen.com","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","tonaletalk.com","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","tournguide.com","toyokeizai.net","tracktheta.com","trannyteca.com","trentonian.com","triumph675.net","triumphrat.net","troyrecord.com","tundratalk.net","turbocloud.xyz","turbododge.com","tvs-widget.com","tvseries.video","tw200forum.com","twincities.com","uberpeople.net","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vagdrivers.net","vahantoday.com","videocelts.com","vikistream.com","viperalley.com","visifilmai.org","viveseries.com","volvoforum.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wellplated.com","whodatdish.com","wielerflits.be","wikifilmia.com","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xc100forum.com","xclusivejams.*","xeforums.co.uk","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yfzcentral.com","yourcobalt.com","yourupload.com","z1000forum.com","z125owners.com","zeroupload.com","zx25rforum.com","1911addicts.com","240sxforums.com","4activetalk.com","51bonusrummy.in","7thgenhonda.com","899panigale.org","959panigale.net","9thgencivic.com","a-z-animals.com","acadiaforum.net","accordxclub.com","acedarspoon.com","acemanforum.com","adrinolinks.com","adz7short.space","agoneerfans.com","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","amarokforum.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","archerytalk.com","areaconnect.com","ariyaforums.com","arstechnica.com","artistforum.com","astrosafari.com","audi-forums.com","audif1forum.com","audiotools.blog","audioz.download","audiq3forum.com","averiecooks.com","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxerforums.com","boxingforum.com","boxingstream.me","brilian-news.id","brutusforum.com","budgetbytes.com","buffstreams.app","bussyhunter.com","cafedelites.com","can-amforum.com","careersides.com","cattleforum.com","cbr300forum.com","celicasupra.com","cempakajaya.com","chevyblazer.org","chollometro.com","cigarforums.net","cizgivedizi.com","classic-jdm.com","clubtouareg.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","crizyman.online","crownforums.com","cryptoearns.com","ct200hforum.com","ctx700forum.com","cubbiescrib.com","customtacos.com","cycleforums.com","cycletrader.com","dailybreeze.com","dailycamera.com","dailyknicks.com","databazeknih.cz","dawindycity.com","dendroboard.com","diariovasco.com","dieseljeeps.com","dieselplace.com","digimonzone.com","digiztechno.com","diychatroom.com","dizipal1521.com","dizipal1522.com","dizipal1523.com","dizipal1524.com","dizipal1525.com","dizipal1526.com","dizipal1527.com","dizipal1528.com","dizipal1529.com","dizipal1530.com","dizipal1531.com","dizipal1532.com","dizipal1533.com","dizipal1534.com","dizipal1535.com","dizipal1536.com","dizipal1537.com","dizipal1538.com","dizipal1539.com","dizipal1540.com","dizipal1541.com","dizipal1542.com","dizipal1543.com","dizipal1544.com","dizipal1545.com","dizipal1546.com","dizipal1547.com","dizipal1548.com","dizipal1549.com","dizipal1550.com","dizipal1551.com","dizipal1552.com","dizipal1553.com","dizipal1554.com","dizipal1555.com","dizipal1556.com","dizipal1557.com","dizipal1558.com","dizipal1559.com","dizipal1560.com","dizipal1561.com","dizipal1562.com","dizipal1563.com","dizipal1564.com","dizipal1565.com","dizipal1566.com","dizipal1567.com","dizipal1568.com","dizipal1569.com","dizipal1570.com","dizipal1571.com","dizipal1572.com","dizipal1573.com","dizipal1574.com","dizipal1575.com","dizipal1576.com","dizipal1577.com","dizipal1578.com","dizipal1579.com","dizipal1580.com","dizipal1581.com","dizipal1582.com","dizipal1583.com","dizipal1584.com","dizipal1585.com","dizipal1586.com","dizipal1587.com","dizipal1588.com","dizipal1589.com","dizipal1590.com","dizipal1591.com","dizipal1592.com","dizipal1593.com","dizipal1594.com","dizipal1595.com","dizipal1596.com","dizipal1597.com","dizipal1598.com","dizipal1599.com","dizipal1600.com","dl-protect.link","doctormalay.com","dodge-nitro.com","dogfoodchat.com","donnerwetter.de","dopomininfo.com","driveaccord.net","drywalltalk.com","e-tronforum.com","e46fanatics.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","edmontonsun.com","egoallstars.com","elamigosweb.com","empire-stream.*","escape-city.com","esportivos.site","exactpay.online","expedition33.gg","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","ferrarilife.com","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fmradiofree.com","footyhunter.lol","forteforums.com","framedcooks.com","freeairpump.com","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gatorforums.net","gazetaprawna.pl","gen3insight.com","gentosha-go.com","geogridgame.com","gewinnspiele.tv","ghibliforum.com","girlscanner.org","girlsreport.net","gmtruckclub.com","godairyfree.org","gofile.download","goproforums.com","gowatchseries.*","gratispaste.com","greatandhra.com","gunnerforum.com","gut-erklaert.de","hamrojaagir.com","havocxforum.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hondashadow.net","hotcopper.co.nz","hummusapien.com","i-paceforum.com","idoitmyself.xyz","ilovetoplay.xyz","infinitiq30.org","infinitiq50.org","infinitiq60.org","infosgj.free.fr","integratalk.com","istreameast.app","jaguarforum.com","japangaysex.com","jaysjournal.com","jeepevforum.com","jeeppatriot.com","jettajunkie.com","jkssbalerts.com","juliasalbum.com","jumpsokuhou.com","kandiforums.com","kawieriders.com","keltecforum.com","khatrimazaful.*","kiaevforums.com","kickrunners.com","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","krakenfiles.com","kurashinista.jp","lakestclair.net","lamarledger.com","ldoceonline.com","lexusfforum.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lombardiave.com","lordchannel.com","lucid-forum.com","lugerforums.com","lulustream.live","lumberjocks.com","luxury4play.com","lynkcoforum.com","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","marlinforum.com","marvelrivals.gg","matomeblade.com","matomelotte.com","mclarenlife.com","mediacast.click","medstudentz.com","meganesport.net","mentalfloss.com","mercedescla.org","mercurynews.com","metrisforum.com","miamiherald.com","minievforum.com","miniwebtool.com","mmsmasala27.com","mobilestalk.net","modernhoney.com","modistreams.org","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","mtc1.jobtkz.com","myanimelist.net","nativesurge.net","naughtypiss.com","ncgunowners.com","news-herald.com","news.zerkalo.io","nflspinzone.com","niice-woker.com","ninetowners.com","nitroforumz.com","noindexscan.com","nomnompaleo.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nutmegnanny.com","nuxhallas.click","nydailynews.com","oceanforums.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","passatworld.com","paviseforum.com","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","petforums.co.uk","phillyvoice.com","phongroblox.com","picsxxxporn.com","pierandsurf.com","pilotonline.com","piratehaven.xyz","pisshamster.com","pistolsmith.com","pistolworld.com","planetminis.com","plantedtank.net","poodleforum.com","popdaily.com.tw","powerstroke.org","premiumporn.org","priusonline.com","projectfreetv.*","prowlertalk.net","punishworld.com","qatarstreams.me","r1200rforum.com","rallyforums.com","rangerovers.net","rank1-media.com","raptorforum.com","readbitcoin.org","readhunters.xyz","recon-forum.com","regalforums.com","remixsearch.net","reportera.co.kr","resizer.myct.jp","rhinoforums.net","riderforums.com","risingapple.com","rnbastreams.com","robloxforum.com","rodsnsods.co.uk","roofingtalk.com","rugbystreams.me","rustorkacom.lib","saabcentral.com","saikyo-jump.com","sampledrive.org","sat-sharing.com","saxontheweb.net","scr950forum.com","seadoospark.org","seir-sanduk.com","seltosforum.com","sfchronicle.com","shadowrangers.*","shemalegape.net","shortxlinks.com","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","skyroadster.com","slapthesign.com","smokinvette.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","stdrivers.co.uk","streamnoads.com","stripers247.com","stylecaster.com","sudokutable.com","suicidepics.com","supraforums.com","sweetie-fox.com","taikoboards.com","talkbudgies.com","talkparrots.com","tapeantiads.com","tapeblocker.com","taurusarmed.net","tennisforum.com","tennisstreams.*","teryxforums.net","the5krunner.com","thebassbarn.com","theblueclit.com","thebullspen.com","thegoatspot.net","thejetpress.com","themoviesflix.*","theporndude.com","theprovince.com","thereeftank.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","trgoals1495.xyz","trgoals1496.xyz","trgoals1497.xyz","trgoals1498.xyz","trgoals1499.xyz","trgoals1500.xyz","trgoals1501.xyz","trgoals1502.xyz","trgoals1503.xyz","trgoals1504.xyz","trgoals1505.xyz","trgoals1506.xyz","trgoals1507.xyz","trgoals1508.xyz","trgoals1509.xyz","trgoals1510.xyz","trgoals1511.xyz","trgoals1512.xyz","trgoals1513.xyz","trgoals1514.xyz","trgoals1515.xyz","trgoals1516.xyz","trgoals1517.xyz","trgoals1518.xyz","trgoals1519.xyz","trgoals1520.xyz","trgoals1521.xyz","trgoals1522.xyz","trgoals1523.xyz","trgoals1524.xyz","trgoals1525.xyz","trgoals1526.xyz","trgoals1527.xyz","trgoals1528.xyz","trgoals1529.xyz","trgoals1530.xyz","trgoals1531.xyz","trgoals1532.xyz","trgoals1533.xyz","trgoals1534.xyz","trgoals1535.xyz","trgoals1536.xyz","trgoals1537.xyz","trgoals1538.xyz","trgoals1539.xyz","trgoals1540.xyz","trgoals1541.xyz","trgoals1542.xyz","trgoals1543.xyz","truthsocial.com","trybawaryjny.pl","tuktukcinma.com","turbobuicks.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","uk-muscle.co.uk","ukaudiomart.com","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","v-twinforum.com","v8sleuth.com.au","valhallas.click","vantasforum.com","vikingforum.net","vikingforum.org","vinfasttalk.com","vipsister23.com","viralharami.com","volconforum.com","vwt4forum.co.uk","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","windsorstar.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","yamahaforum.com","yanksgoyard.com","yoursciontc.com","yrtourguide.com","zakuzaku911.com","2coolfishing.com","3dprinterful.com","4thgentacoma.com","790dukeforum.com","aclassclub.co.uk","acouplecooks.com","acura-legend.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","aheadofthyme.com","airflowforum.com","altherforums.com","altimaforums.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","archeryaddix.com","arteonforums.com","ascentforums.com","asyaanimeleri.pw","backfirstwo.site","badgerowners.com","bananamovies.org","barbarabakes.com","bcsportbikes.com","benelliforum.com","bestgirlsexy.com","bestpornflix.com","bigblockdart.com","blackandteal.com","blog.esuteru.com","blog.livedoor.jp","blowgunforum.com","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","brutecentral.com","buffalowdown.com","buickevforum.com","buzzfeednews.com","c-classforum.com","cadenzaforum.com","canalesportivo.*","caneswarning.com","cbr500riders.com","charexempire.com","cherokeesrt8.com","cherokeetalk.com","cheyennechat.com","chickenforum.com","chinese-pics.com","choosingchia.com","civic11forum.com","clarityforum.com","cleaningtalk.com","clever-tanken.de","clickndownload.*","clickorlando.com","clubfrontier.org","clubroadster.net","coloradofans.com","coloredmanga.com","comidacaseira.me","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","cricketforum.com","crxcommunity.com","cryptofactss.com","ctx1300forum.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cybercityhelp.in","cyclingabout.com","daciaforum.co.uk","dailyfreeman.com","dailytribune.com","dailyuploads.net","dakotaforumz.com","darknessporn.com","dartsstreams.com","dataunlocker.com","desertxforum.com","destiny2zone.com","detikkebumen.com","diavel-forum.com","diecastcrazy.com","dieselforums.com","directupload.net","dobermantalk.com","dodgedurango.net","dodgeevforum.com","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","duramaxforum.com","eastbaytimes.com","ebikerforums.com","echelonforum.com","elantraforum.com","elantrasport.com","empire-streamz.*","enclaveforum.net","envistaforum.com","evoqueforums.net","explorertalk.com","f150ecoboost.net","familyporner.com","favoyeurtube.net","feedmephoebe.com","ferrari-talk.com","filecatchers.com","filespayouts.com","financacerta.com","firearmstalk.com","flagandcross.com","flatpanelshd.com","flyfishing.co.uk","football-2ch.com","fordexplorer.org","fordstnation.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","funkeypagali.com","g6ownersclub.com","gamesrepacks.com","garminrumors.com","gaydelicious.com","gbmwolverine.com","genialetricks.de","getviralreach.in","giuliaforums.com","giurgiuveanul.ro","gl1800riders.com","gledajcrtace.xyz","gmdietforums.com","gminsidenews.com","godstoryinfo.com","gourmetscans.net","grecaleforum.com","gsm-solution.com","hallofseries.com","handgunforum.net","happyinshape.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hondacb1000r.com","hondaevforum.com","hondaforeman.com","hornetowners.com","hotcopper.com.au","howsweeteats.com","huskercorner.com","husseinezzat.com","ikarishintou.com","ildcatforums.net","imagereviser.com","impalaforums.com","infinitiqx30.org","infinitiqx50.org","infinitiqx60.org","infinitiqx80.org","infinityfree.com","inspiralized.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","jukeforums.co.uk","julieblanner.com","justblogbaby.com","justfullporn.net","kakarotfoot.ru>>","kawasakiz650.com","ketolifetalk.com","khatrimazafull.*","kianiroforum.com","kijolifehack.com","kimscravings.com","kingstreamz.site","kitchendivas.com","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kodiakowners.com","ktm1090forum.net","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","laurafuentes.com","lexusevforum.com","lexusnxforum.com","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","magnetoforum.com","magnumforumz.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","marlinowners.com","maseratilife.com","mathplayzone.com","maverickchat.com","mazda3forums.com","meconomynews.com","medievalists.net","megapornpics.com","millionscast.com","moddedraptor.com","moderncamaro.com","modularfords.com","moneycontrol.com","mostlymorgan.com","mountainbuzz.com","moviesmod.com.pl","mrproblogger.com","mudinmyblood.net","mullenowners.com","mybikeforums.com","mydownloadtube.*","mylargescale.com","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newedutopics.com","newf150forum.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nissanforums.com","nissanmurano.org","nocrumbsleft.net","nordenforums.com","o2tvseries4u.com","ojearnovelas.com","onionstream.live","optimaforums.com","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","perfectunion.com","phinphanatic.com","piranha-fury.com","plainchicken.com","planetisuzoo.com","player.buffed.de","plumbingzone.com","powerover.online","powerover.site>>","predatortalk.com","preludepower.com","pricearchive.org","programme-tv.net","protrumpnews.com","pursuitforum.com","puzzlegarage.com","r6messagenet.com","raetsel-hilfe.de","rangerforums.net","ranglerboard.com","ranglerforum.com","raptorforumz.com","readingeagle.com","rebajagratis.com","redbirdrants.com","repack-games.com","rinconriders.com","ripexbooster.xyz","risttwisters.com","rocketnews24.com","rollingstone.com","routerforums.com","rsoccerlink.site","rule34hentai.net","s1000rrforum.com","saradahentai.com","scioniaforum.com","scionimforum.com","seat-forum.co.uk","segwayforums.com","serial1forum.com","shercoforums.com","shotgunworld.com","shutterstock.com","skidrowcodex.net","skincaretalk.com","smartermuver.com","smartevforum.com","sniperforums.com","solitairehut.com","sonataforums.com","south-park-tv.fr","soxprospects.com","specialstage.com","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","starlinktalk.com","statecollege.com","stellanspice.com","stelvioforum.com","stillcurtain.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","stromerforum.com","stromtrooper.com","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","team-integra.net","techkhulasha.com","telcoinfo.online","terrainforum.com","terrainforum.net","teslabottalk.com","text-compare.com","thebakermama.com","thebassholes.com","theboxotruth.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","theflowspace.com","thegadgetking.in","thelandryhat.com","thelawnforum.com","thelinuxcode.com","thelupussite.com","thelureforum.com","thenerdstash.com","thenewcamera.com","thevikingage.com","thewatchsite.com","titanxdforum.com","tomshardware.com","topvideosgay.com","total-sportek.to","toyotanation.com","tractorforum.com","trainerscity.com","trapshooters.com","trendytalker.com","trocforums.co.uk","tucson-forum.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","usmle-forums.com","utahwildlife.net","v8bikeriders.com","valeriabelen.com","vancouversun.com","veggieboards.com","venuedrivers.com","veryfreeporn.com","vichitrainfo.com","vizslaforums.com","voiranime.stream","volvo-forums.com","volvoevforum.com","volvov40club.com","voyeurfrance.net","vulcanforums.com","vwatlasforum.com","watchfreexxx.net","watchmmafull.com","wbschemenews.com","weblivehdplay.ru","whipperberry.com","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","x-trail-uk.co.uk","xclassforums.com","xhamsterporno.mx","xpengevforum.com","xpowerforums.com","xsr700forums.com","yamaha-forum.net","yifysubtitles.ch","yourcountdown.to","youwatchporn.com","ziggogratis.site","12thmanrising.com","2-seriesforum.com","365cincinnati.com","4chanarchives.com","abarthforum.co.uk","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","amandascookin.com","amrapideforum.com","amybakesbread.com","andhrafriends.com","andrewzimmern.com","androidpolice.com","applecarforum.com","aquariumforum.com","armypowerinfo.com","aronaforums.co.uk","atecaforums.co.uk","atlasandboots.com","atvdragracers.com","aussieexotics.com","auto-crypto.click","avengerforumz.com","badgerofhonor.com","bakedbyrachel.com","basketballbuzz.ca","beargoggleson.com","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","beyondtheflag.com","blazerevforum.com","blizzboygames.net","blog.tangwudi.com","broncoevforum.com","buildtheearth.net","bulldogbreeds.com","butterbeready.com","cadryskitchen.com","cagesideseats.com","calgaryherald.com","caliberforums.com","caliberforumz.com","camchickscaps.com","cayenneforums.com","cdn.tiesraides.lv","chaptercheats.com","chargerforums.com","chargerforumz.com","cichlid-forum.com","cinemastervip.com","claplivehdplay.ru","closetcooking.com","clubcrosstrek.com","cocokara-next.com","coloradodaily.com","commandertalk.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","crackstreamer.net","crvownersclub.com","cryptednews.space","customdakotas.com","custommagnums.com","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","dawnofthedawg.com","daytonaowners.com","deepgoretube.site","deutschepornos.me","diabetesforum.com","ditjesendatjes.nl","dl.apkmoddone.com","dodgeintrepid.net","drinkspartner.com","ducatimonster.org","durangoforumz.com","eatlittlebird.com","economictimes.com","ecosportforum.com","envisionforum.com","epaceforums.co.uk","etransitforum.com","euro2024direct.ru","everestowners.com","evolvingtable.com","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","fiat500owners.com","fiestafaction.com","filmesonlinex.org","fitnesssguide.com","focusfanatics.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","fpaceforums.co.uk","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","frugalvillage.com","funtasticlife.com","fwmadebycarli.com","galonamission.com","gamejksokuhou.com","gamesmountain.com","gasserhotrods.com","gaypornhdfree.com","genesisforums.com","genesisforums.org","geocaching101.com","gimmesomeoven.com","globalstreams.xyz","goldwingfacts.com","gourbanhiking.com","greatlakes4x4.com","grizzlyowners.com","grizzlyriders.com","guitarscanada.com","havaneseforum.com","hdfilmcehennemi.*","headlinerpost.com","hemitruckclub.com","hentaitube.online","heresy-online.net","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","impalassforum.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","innateblogger.com","intouchweekly.com","ipaceforums.co.uk","iphoneincanada.ca","islamicfinder.org","jaguarxeforum.com","jaysbrickblog.com","jeepcommander.com","jeeptrackhawk.org","jockeyjournal.com","justlabradors.com","kawasakiworld.com","kbconlinegame.com","kfx450central.com","kiasoulforums.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","laughingsquid.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lexusrcowners.com","lexusrxowners.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","mamainastitch.com","marineinsight.com","mdzsmutpcvykb.net","mercurycougar.net","miaminewtimes.com","midhudsonnews.com","midwest-horse.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","mtc4.igimsopd.com","multicanaistv.com","musicfeeds.com.au","myjeepcompass.com","myturbodiesel.com","nationaltoday.com","newtahoeyukon.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","nissan-navara.net","nodakoutdoors.com","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","ohiosportsman.com","okusama-kijyo.com","olympicstreams.co","onceuponachef.com","ondemandkorea.com","ontariofarmer.com","opensubtitles.org","ottawacitizen.com","outdoormatome.com","palisadeforum.com","paracordforum.com","paranormal-ch.com","pavementsucks.com","pcgeeks-games.com","peugeotforums.com","pinayscandalz.com","pioneerforums.com","pistonpowered.com","player.pcgames.de","plugintorrent.com","polarisriders.com","pornoenspanish.es","preludeonline.com","prepperforums.net","pressandguide.com","presstelegram.com","prowlerforums.net","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","ram1500diesel.com","ramrebelforum.com","read-onepiece.net","redlineforums.com","reidoscanais.life","renegadeforum.com","republicbrief.com","restlessouter.net","restlingforum.com","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","santafeforums.com","savemoneyinfo.com","scirocconet.co.uk","seatroutforum.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","shootersforum.com","shootingworld.com","shotgunforums.com","shugarysweets.com","sideplusleaks.net","sierraevforum.com","siliconvalley.com","simplywhisked.com","sitm.al3rbygo.com","skylineowners.com","soccerworldcup.me","solsticeforum.com","solterraforum.com","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","starxinvestor.com","steamidfinder.com","steamseries88.com","stellarthread.com","stingerforums.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","subaruxvforum.com","sumaburayasan.com","superherohype.com","supertipzz.online","suzuki-forums.com","suzuki-forums.net","suzukicentral.com","t-shirtforums.com","tablelifeblog.com","talkclassical.com","talonsxsforum.com","taycanevforum.com","thaihotmodels.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedieselstop.com","thefreebieguy.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","thyroidboards.com","tightsexteens.com","tiguanevforum.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tnhuntingclub.com","tokusatsuindo.com","toyotacelicas.com","toyotaevforum.com","toyotaklub.org.pl","tradingfact4u.com","traverseforum.com","truyen-hentai.com","tundraevforum.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","twowheelforum.com","umatechnology.org","unsere-helden.com","v6performance.net","velarforums.co.uk","velosterturbo.org","victoryforums.com","viralitytoday.com","visualnewshub.com","volusiariders.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","wutheringwaves.gg","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","yourcupofcake.com","10thcivicforum.com","4-seriesforums.com","4runner-forums.com","502streetscene.net","5thrangerforum.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","astrakforums.co.uk","atlasstudiousa.com","australiaforum.com","authenticateme.xyz","authenticforum.com","backforseconds.com","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","bimmerforums.co.uk","blackporncrazy.com","blog-peliculas.com","blogredmachine.com","bluemediastorage.*","bombshellbling.com","bosoxinjection.com","browneyedbaker.com","bullnettlenews.com","businessinsider.de","businessinsider.jp","cactusforums.co.uk","cadillacforums.com","calculatorsoup.com","can-amelectric.com","carnivalforums.com","challengerlife.com","challengertalk.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","climbingforums.com","cmaxownersclub.com","codingnepalweb.com","coffeeforums.co.uk","coloradodiesel.org","contractortalk.com","correotemporal.org","corsaeforums.co.uk","cr7-soccer.store>>","crooksandliars.com","crossbownation.com","customfighters.com","cyberquadforum.com","cybertrucktalk.com","dakota-durango.com","dcworldscollide.gg","defendersource.com","defensivecarry.com","descargaspcpro.net","diecastxchange.com","dieselramforum.com","digital-thread.com","dinneratthezoo.com","discoverysport.net","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","downshiftology.com","elantragtforum.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","equinoxevforum.com","esprinterforum.com","familycheftalk.com","feastingathome.com","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","firebirdnation.com","fjlaboratories.com","flacdownloader.com","footballchannel.jp","fordfusionclub.com","fordinsidenews.com","forkknifeswoon.com","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","future-fortune.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","genesisevforum.com","georgiapacking.org","germancarforum.com","goldwingowners.com","grcorollaforum.com","greeleytribune.com","grizzlycentral.com","halloweenforum.com","haveibeenpwned.com","hdstreetforums.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hondaatvforums.net","hopepaste.download","hungrypaprikas.com","hyundai-forums.com","hyundaitucson.info","iamhomesteader.com","iawaterfowlers.com","indianshortner.com","insider-gaming.com","insightcentral.net","insurancesfact.com","islamicpdfbook.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","jocjapantravel.com","kawasakiversys.com","kiatuskerforum.com","kijyomatome-ch.com","kirbiecravings.com","kodiaqforums.co.uk","laleggepertutti.it","lancerregister.com","landroversonly.com","leckerschmecker.me","lifeinleggings.com","lincolnevforum.com","listentotaxman.com","liveandletsfly.com","makeincomeinfo.com","maketecheasier.com","manchesterworld.uk","marinetraffic.live","marvelsnapzone.com","maverickforums.net","mediaindonesia.com","metalguitarist.org","millwrighttalk.com","moddedmustangs.com","modelrailforum.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","motorhomefacts.com","moviesonlinefree.*","mrmakeithappen.com","myquietkitchen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","ninja400riders.com","nissancubelife.com","nlab.itmedia.co.jp","nourishedbynic.com","observedtrials.net","oklahomahunter.net","olverineforums.com","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","oodworkingtalk.com","orkingdogforum.com","orldseafishing.com","ourbeagleworld.com","pacificaforums.com","paintballforum.com","pancakerecipes.com","panel.play.hosting","panigalev4club.com","passportforums.com","pathfindertalk.com","perfectmancave.com","player.gamezone.de","playoffsstream.com","polestar-forum.com","pornfetishbdsm.com","porno-baguette.com","porscheevforum.com","promasterforum.com","prophecyowners.com","q3ownersclub.co.uk","ranglerjlforum.com","readcomiconline.li","reporterherald.com","rimfirecentral.com","ripcityproject.com","roadbikereview.com","roadstarraider.com","roadtripliving.com","runnersforum.co.uk","runtothefinish.com","samsungmagazine.eu","scarletandgame.com","scramblerforum.com","shipsnostalgia.com","shuraba-matome.com","siamblockchain.com","sidelionreport.com","sidexsideworld.com","skyscrapercity.com","slingshotforum.com","snowplowforums.com","soft.cr3zyblog.com","softwaredetail.com","spoiledmaltese.com","sportbikeworld.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","starbikeforums.com","steamclouds.online","steamcommunity.com","stevesnovasite.com","stingrayforums.com","stormtrakforum.com","stream.nflbox.me>>","strtapeadblocker.*","subarubrzforum.com","subaruforester.org","talkcockatiels.com","talkparrotlets.com","tapeadsenjoyer.com","tcrossforums.co.uk","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","theendlessmeal.com","thefirearmblog.com","thepewterplank.com","thepolitistick.com","thespeedtriple.com","thestarphoenix.com","tiguanforums.co.uk","tiktokrealtime.com","times-standard.com","tips-and-tricks.co","torrentdosfilmes.*","toyotachrforum.com","transalpowners.com","travelplanspro.com","treadmillforum.com","truestreetcars.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","upownersclub.co.uk","varminthunters.com","veggiegardener.com","vincenzosplate.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","yamahastarbolt.com","yariscrossclub.com","zafiraowners.co.uk","100percentfedup.com","208ownersclub.co.uk","adblockstreamtape.*","africatwinforum.com","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","arkansashunting.net","arrowheadaddict.com","astonmartinlife.com","asumsikedaishop.com","atchtalkforums.info","awellstyledlife.com","barcablaugranes.com","basketballforum.com","bchtechnologies.com","betweenjpandkr.blog","bible-knowledge.com","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","bowfishingforum.com","brightdropforum.com","brighteyedbaker.com","broncosporttalk.com","campercommunity.com","canuckaudiomart.com","checkhookboxing.com","chromebookforum.com","chryslerminivan.net","commanderforums.org","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","deerhuntersclub.com","detroitjockcity.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dieself150forum.com","dk.pcpartpicker.com","dodgedartforumz.com","download.megaup.net","driveteslacanada.ca","ds4ownersclub.co.uk","duckhuntingchat.com","dvdfullestrenos.com","ecoboostmustang.org","edmontonjournal.com","elcaminocentral.com","electriciantalk.com","embed.wcostream.com","equipmenttrader.com","escaladeevforum.com","estrenosdoramas.net","explorerevforum.com","ferrari296forum.com","filmesonlinexhd.biz","fjcruiserforums.com","flyfishingforum.com","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","foxeslovelemons.com","franceprefecture.fr","frustfrei-lernen.de","genealogyspeaks.com","genesisg70forum.com","genesisg80forum.com","germanshepherds.com","girlsvip-matome.com","glaownersclub.co.uk","hailfloridahail.com","hardcoresledder.com","hardwoodhoudini.com","hdfilmcehennemi2.cx","hdlivewireforum.com","hedgehogcentral.com","historicaerials.com","hometownstation.com","hondarebelforum.com","honeygirlsworld.com","honyaku-channel.net","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","ilovemycockapoo.com","indycityfishing.com","infinitijxforum.com","insidetheiggles.com","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","joyfoodsunshine.com","justonecookbook.com","kenzo-flowertag.com","kiaownersclub.co.uk","kingjamesgospel.com","kitimama-matome.net","kreuzwortraetsel.de","ktmduke390forum.com","learnmarketinfo.com","lifeandstylemag.com","lightningowners.com","lightningrodder.com","lite.duckduckgo.com","logicieleducatif.fr","louisianacookin.com","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","melskitchencafe.com","mendocinobeacon.com","michiganreefers.com","middletownpress.com","minimalistbaker.com","modeltrainforum.com","motorcycleforum.com","movie-locations.com","mtc5.flexthecar.com","mustangecoboost.net","mykoreankitchen.com","nandemo-uketori.com","natashaskitchen.com","negyzetmeterarak.hu","newjerseyhunter.com","ohiogamefishing.com","orlandosentinel.com","outlanderforums.com","paidshitforfree.com","pcgamebenchmark.com","pendidikandasar.net","personalitycafe.com","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","preparedsociety.com","pressenterprise.com","prologuedrivers.com","promodescuentos.com","quest.to-travel.net","radio-australia.org","radio-osterreich.at","registercitizen.com","renaultforums.co.uk","reptileforums.co.uk","roguesportforum.com","rojadirectaenvivo.*","royalmailchat.co.uk","santacruzforums.com","secondhandsongs.com","shoot-yalla-tv.live","silveradosierra.com","skidrowreloaded.com","slingshotforums.com","smartkhabrinews.com","snowblowerforum.com","snowmobileforum.com","snowmobileworld.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","stormininnorman.com","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","supermotojunkie.com","sussexexpress.co.uk","suzukiatvforums.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","tarracoforums.co.uk","thecombineforum.com","thecookierookie.com","thedieselgarage.com","thefoodieaffair.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thesmokingcuban.com","thewatchforum.co.uk","thewatchseries.live","tjcruiserforums.com","trailblazertalk.com","truyentranhfull.net","tundrasolutions.com","turkishseriestv.org","valleyofthesuns.com","viewmyknowledge.com","vintage-mustang.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","whatjewwannaeat.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","yorkshirepost.co.uk","125ccsportsbikes.com","2008ownersclub.co.uk","500xownersclub.co.uk","adamownersclub.co.uk","adultdvdparadise.com","alkingstickforum.com","alliancervforums.com","allthingsthrifty.com","amazonastroforum.com","androidauthority.com","androidheadlines.com","antaraownersclub.com","arizonagunowners.com","aroundthefoghorn.com","bcfishingreports.com","beaglesunlimited.com","beekeepingforums.com","bersapistolforum.com","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","bmaxownersclub.co.uk","brushnewstribune.com","carolinafishtalk.com","challengerforumz.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","climbingtalshill.com","cmaxownersclub.co.uk","coloradoevowners.com","crackstreamshd.click","dailydishrecipes.com","dailynewshungary.com","dailytruthreport.com","dairylandexpress.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","detailingworld.co.uk","digitalcorvettes.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","favfamilyrecipes.com","foodfaithfitness.com","fordforumsonline.com","fordmuscleforums.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gesundheitsfrage.net","goosehuntingchat.com","greensnchocolate.com","greentractortalk.com","gt86ownersclub.co.uk","heartlife-matome.com","hometheatershack.com","hondarebel3forum.com","houstonchronicle.com","hyundaikonaforum.com","ibreatheimhungry.com","indianasportsman.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jeepcherokeeclub.com","jljbacktoclassic.com","journal-advocate.com","jukeownersclub.co.uk","juliescafebakery.com","kawasakininja300.com","knittingparadise.com","kugaownersclub.co.uk","labradoodle-dogs.net","labradorforums.co.uk","lamborghini-talk.com","landroverevforum.com","laweducationinfo.com","lehighvalleylive.com","letemsvetemapplem.eu","librarium-online.com","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda2revolution.com","mazda3revolution.com","meilleurpronostic.fr","menstennisforums.com","mercedesclaforum.com","mercedesgleforum.com","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","motorcitybengals.com","motorcycleforums.net","mt-soft.sakura.ne.jp","muscularmustangs.com","mustangevolution.com","mylawnmowerforum.com","nationalgunforum.com","neighborfoodblog.com","nissankicksforum.com","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","noteownersclub.co.uk","onelittleproject.com","onesixthwarriors.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","panamericaforums.com","pasadenastarnews.com","performanceboats.com","pickleballertalk.com","player.smashy.stream","pocketbikeplanet.com","polarisatvforums.com","popularmechanics.com","pornstarsyfamosas.es","preservationtalk.com","receitasdaora.online","redcurrantbakery.com","relevantmagazine.com","reptilesmagazine.com","reviewingthebrew.com","rollsroyceforums.com","scoutmotorsforum.com","securenetsystems.net","seededatthetable.com","silveradoevforum.com","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","springfieldforum.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","tasteandtellblog.com","techsupportforum.com","thefirearmsforum.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","thekitchenmagpie.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videoeditingtalk.com","videostreaming.rocks","viralviralvideos.com","windsorexpress.co.uk","yetiownersclub.co.uk","yorkshire-divers.com","yourhomebasedmom.com","yourpatientvoice.com","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","applefitnessforum.com","austinbassfishing.com","barnsleychronicle.com","bigleaguepolitics.com","bowfishingcountry.com","burlington-record.com","californiaevforum.com","canamspyderforums.com","casecoltingersoll.com","celebritynetworth.com","celiacandthebeast.com","client.pylexnodes.net","collinsdictionary.com","coloradofisherman.com","corollacrossforum.com","creative-culinary.com","dragontranslation.com","elementownersclub.com","eroticmoviesonline.me","everything2stroke.com","fancymicebreeders.com","foreverwallpapers.com","forum.release-apk.com","fusionsportforums.com","gardentractortalk.com","greaterlongisland.com","hackerranksolution.in","hollywoodreporter.com","homesteadingtoday.com","hondacivicforum.co.uk","hondapioneerforum.com","hoodtrendspredict.com","indianmotorcycles.net","invoice-generator.com","iphoneographytalk.com","jeeprenegadeforum.com","journaldemontreal.com","journey.to-travel.net","julesburgadvocate.com","kawasakininja1000.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","marutisuzukiforum.com","mavericklightning.org","mitsubishi-forums.com","mokkaownersclub.co.uk","motorcycletherapy.net","mountainmamacooks.com","mybakingaddiction.com","nissanversaforums.com","notformembersonly.com","novascotiafishing.com","novascotiahunting.com","pelotalibrevivo.net>>","peugeot108forum.co.uk","politicaltownhall.com","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","retrievertraining.net","rivianownersforum.com","rottweilersonline.com","royalenfieldforum.com","rugerpistolforums.com","runningonrealfood.com","santacruzsentinel.com","scriptgrowagarden.com","smartcarofamerica.com","snapinstadownload.xyz","snowboardingforum.com","sonymobilityforum.com","sousou-no-frieren.com","statisticsanddata.org","stratolinerdeluxe.com","streamservicehd.click","survivalistboards.com","talkaboutmarriage.com","tapeadvertisement.com","tech.trendingword.com","teslaownersonline.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","theslingshotforum.com","timesheraldonline.com","trailhunterforums.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","ultimateaircooled.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","volkswagenforum.co.uk","watchkobestreams.info","whittierdailynews.com","xr1200ownersgroup.com","yamahastarstryker.com","zone-telechargement.*","ahdafnews.blogspot.com","airsoftsniperforum.com","allevertakstream.space","andrenalynrushplay.cfd","assessmentcentrehq.com","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","breastfeedingplace.com","canadianmoneyforum.com","capturownersclub.co.uk","chicagolandfishing.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","crayonsandcravings.com","crunchycreamysweet.com","dallashoopsjournal.com","discosportforums.co.uk","drop.carbikenation.com","eclipsecrossforums.com","elrefugiodelpirata.com","eurointegration.com.ua","evoqueownersclub.co.uk","fertilityfriends.co.uk","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","housethathankbuilt.com","hyundaicoupeclub.co.uk","hyundaiperformance.com","jpop80ss3.blogspot.com","kawasakimotorcycle.org","kiatellurideforums.com","kingshotcalculator.com","littlesunnykitchen.com","longislandfirearms.com","mainehuntingforums.com","mexicanfoodjournal.com","michigan-sportsman.com","missouriwhitetails.com","mycolombianrecipes.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","player.gamesaktuell.de","portaldasnovinhas.shop","rangerraptorowners.com","redlandsdailyfacts.com","rubiconownersforum.com","salmonfishingforum.com","saturnoutlookforum.net","shakentogetherlife.com","shutupandtakemyyen.com","smartfeecalculator.com","snowmobilefanatics.com","sonsoflibertymedia.com","stellar.quoteminia.com","thatballsouttahere.com","theflyfishingforum.com","totalsportek1000.com>>","triumphbobberforum.com","twopeasandtheirpod.com","utahconcealedcarry.com","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","ashingtonflyfishing.com","askandyaboutclothes.com","bajarjuegospcgratis.com","businesswritingblog.com","caraudioclassifieds.org","crosstourownersclub.com","danieldefenseforums.com","ducatisupersport939.net","excelsiorcalifornia.com","footballtransfer.com.ua","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","fromvalerieskitchen.com","healthyfitnessmeals.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","laurelberninteriors.com","makefreecallsonline.com","newbrunswickfishing.com","newbrunswickhunting.com","newlifeonahomestead.com","nothingbutnewcastle.com","onionringsandthings.com","orkingfromhomeforum.com","osteusfilmestuga.online","pcoptimizedsettings.com","platingsandpairings.com","player.smashystream.com","polarisgeneralforum.com","powerequipmentforum.com","predominantlyorange.com","ridgelineownersclub.com","runningtothekitchen.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thebestideasforkids.com","theplantbasedschool.com","tropicalfishkeeping.com","whatgreatgrandmaate.com","zeromotorcycleforum.com","afilmyhouse.blogspot.com","antiquetractorsforum.com","arizonahuntingforums.com","astraownersnetwork.co.uk","awealthofcommonsense.com","booksworthdiscussing.com","broomfieldenterprise.com","canoncitydailyrecord.com","carolinashootersclub.com","chiefmotorcycleforum.com","dictionary.cambridge.org","dimensionalseduction.com","ducatiscramblerforum.com","easttennesseefishing.com","ecosportownersclub.co.uk","first-names-meanings.com","freelancer.taxmachine.be","goldenretrieverforum.com","grandhighlanderforum.com","healthylittlefoodies.com","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","makingthymeforhealth.com","manitobafishingforum.com","manitobahuntingforum.com","maseratilevanteforum.com","mediapemersatubangsa.com","ohiowaterfowlerforum.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","smithandwessonforums.com","socialanxietysupport.com","spaghetti-interactive.it","spicysouthernkitchen.com","stacysrandomthoughts.com","streetfighterv2forum.com","stresshelden-coaching.de","sundaysuppermovement.com","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","thewanderlustkitchen.com","thunderousintentions.com","tip.etip-staging.etip.io","tropicalfishforums.co.uk","volkswagenownersclub.com","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","a-love-of-rottweilers.com","betweenenglandandiowa.com","chevroletownersclub.co.uk","chicagolandsportbikes.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dictionnaire.lerobert.com","floridaconcealedcarry.com","greatamericanrepublic.com","handgunsandammunition.com","harley-davidsonforums.com","hipointfirearmsforums.com","kitchenfunwithmy3sons.com","motorsportsracingtalk.com","pensacolafishingforum.com","player.pcgameshardware.de","practicalselfreliance.com","premeditatedleftovers.com","sentinelandenterprise.com","simply-delicious-food.com","sportsgamblingpodcast.com","technicians0.blogspot.com","theprofilebrotherhood.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cookiedoughandovenmitt.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","edinburghnews.scotsman.com","keyakizaka46matomemory.net","lakesimcoemessageboard.com","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","theworldofarchitecture.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","aprettylifeinthesuburbs.com","forums.socialmediagirls.com","georgianbaymessageboard.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","vauxhallownersnetwork.co.uk","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","electricmotorcyclesforum.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","russianmachineneverbreaks.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","chumplady.comclosetcooking.com","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
