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

const $scriptletArgs$ = /* 1051 */ ["script","(function serverContract()","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})}));const t={apply:(t,e,o)=>{const n=o[0];return\"function\"==typeof n&&n.toString().includes(\"onAbnormalityDetected\")&&(o[0]=function(){}),Reflect.apply(t,e,o)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();(function serverContract()","sedCount","1","window,\"fetch\"","offsetParent","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); localStorage.setItem(\"tuna\", \"dW5kZWZpbmVk\"); localStorage.setItem(\"sausage\", \"ZmFsc2U=\"); window.setTimeout(function(){fuckYouUblockAndJobcenterTycoon(false)},200);","_w.keyMap=","(()=>{const e={apply:(e,t,n)=>{let o=Reflect.apply(e,t,n);return o instanceof HTMLIFrameElement&&!o.src&&o.contentWindow&&(o.contentWindow.document.body.getElementsByTagName=window.document.body.getElementsByTagName,o.contentWindow.MutationObserver=void 0),o}};HTMLBodyElement.prototype.appendChild=new Proxy(HTMLBodyElement.prototype.appendChild,e);const t={apply:(e,t,n)=>(t instanceof HTMLLIElement&&\"b_algo\"===t?.classList?.value&&\"a\"===n?.[0]&&setTimeout((()=>{t.style.display=\"none\"}),100),Reflect.apply(e,t,n))};HTMLBodyElement.prototype.getElementsByTagName=new Proxy(HTMLBodyElement.prototype.getElementsByTagName,t)})();_w.keyMap=","/adblock/i",".adsbygoogle.nitro-body","<div id=\"aswift_1_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=4999999999&adk=1777777777&adf=1059123170&pi=t.ma~as.4999999999&w=300&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=300x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=400&idt=228&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie_enabled=1&eoidce=1&prev_fmts=0x0%2C780x280&nras=1&correlator=3696633791444&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=95&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1611%2C908%2C1595%2C740&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=231\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!3\" data-google-query-id=\"CMiylL-r1pEDFYBewgUd-C8e3w\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_3_host))","<div id=\"aswift_2_host\" style=\"height: 250px; width: 300px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=250&slotname=6644444444&adk=622222222&adf=1800000000&pi=t.ma~as.6644444444&w=311&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=311x250&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=48&idt=39&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280%2C311x250&nras=1&correlator=6111111111111&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=1156&ady=1073&biw=1400&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=7778888888888890&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C20%2C1920%2C0%2C1503%2C908%2C1487%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=4&uci=a!4&fsb=1&dtd=42\" style=\"width:300px;height:250px;\" width=\"300\" height=\"250\" data-google-container-id=\"a!4\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>",".adsbygoogle.nitro-side:not(:has(> #aswift_2_host))","<div id=\"aswift_3_host\" style=\"height: 280px; width: 336px;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&h=280&slotname=4999999999&adk=3666666666&adf=1000000000&pi=t.ma~as.4999999999&w=336&fwrn=1&fwrnh=100&lmt=1777777777&rafmt=1&format=336x280&url=https%3A%2F%2Fpvpoke-re.com%2F&fwr=0&fwrattr=false&rpe=1&resp_fmts=3&wgl=1&aieuf=1&uach=WWyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=1&bdt=38&idt=27&shv=r20250910&mjsv=m202509160101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&prev_fmts=0x0%2C780x280&nras=1&correlator=4555555555888&frm=20&pv=1&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=5&ady=1073&biw=1500&bih=900&scr_x=0&scr_y=978&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=4222228888888888&tmod=1111111111&uas=0&nvt=2&fc=1920&brdim=135%2C40%2C235%2C40%2C1920%2C0%2C1553%2C908%2C1537%2C519&vis=1&rsz=%7C%7CfoeE%7C&abl=CF&pfx=0&fu=128&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=3&uci=a!3&fsb=1&dtd=30\" style=\"width:336px;height:280px;\" width=\"336\" height=\"280\" data-google-container-id=\"a!3\" data-google-query-id=\"CN6mlL-r1pEDFXVIwgUdYkMTag\" data-load-complete=\"true\"></iframe></div>","body:has(ins.adsbygoogle.nitro-body > div#aswift_1_host):has(.consent)","<ins class=\"adsbygoogle adsbygoogle-noablate\" style=\"display: none !important;\" data-adsbygoogle-status=\"done\" data-ad-status=\"unfilled\"><div id=\"aswift_0_host\" style=\"border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-block;\"><iframe allow=\"attribution-reporting; run-ad-auction\" src=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299&output=html&adk=1777777777&adf=3000000000&lmt=1777777777&plaf=1%3A1%2C2%3A2%2C7%3A2&plat=1%3A16777716%2C2%3A16777716%2C3%3A128%2C4%3A128%2C8%3A128%2C9%3A32776%2C16%3A8388608%2C17%3A32%2C24%3A32%2C25%3A32%2C30%3A34635776%2C32%3A32%2C41%3A32%2C42%3A32&fba=1&format=0x0&url=https%3A%2F%2Fpvpoke-re.com%2F&pra=5&wgl=1&aihb=0&asro=0&aifxl=29_18~30_19&aiapm=0.1542&aiapmd=0.1423&aiapmi=0.16&aiapmid=1&aiact=0.5423&aiactd=0.7&aicct=0.7&aicctd=0.5799&ailct=0.5849&ailctd=0.65&aimart=4&aimartd=4&uach=WyJXaW5kb3dzIiwiMTkuMC4wIiwieDg2IiwiIiwiMTQwLjAuNzMzOS4xMjciLG51bGwsMCxudWxsLCI2NCIsW1siQ2hyb21pdW0iLCIxNDAuMC43MzM5LjEyNyJdLFsiTm90PUE_QnJhbmQiLCIyNC4wLjAuMCJdLFsiR29vZ2xlIENocm9tZSIsIjE0MC4wLjczMzkuMTI3Il1dLDBd&abgtt=6&dt=1777777777777&bpp=2&bdt=617&idt=12&shv=r20250910&mjsv=m202509090101&ptt=9&saldr=aa&abxe=1&cookie=ID%3Df9ff9d85de22864a%3AT%3D1759485678%3ART%3D1759468123%3AS%3DALNI_MbxpFMHXxNUuCyWH6v9bG0HYb9CAA&gpic=UID%3D0000119ee4397d0e%3AT%3D1759485653%3ART%3D1759486123%3AS%3DALNI_MaM7_XK5d3ZNzHUSRiSxebpYHHkqQ&eo_id_str=ID%3Dc5c3b54a79c7654a%3AT%3D1579486234%3ART%3D1579468123%3AS%3DAA-AfjaTNZ7cvD7GU7Ldz2zVXaRx&nras=1&correlator=966666666666&frm=20&pv=2&u_tz=540&u_his=2&u_h=1080&u_w=1920&u_ah=1032&u_aw=1920&u_cd=24&u_sd=1&dmc=8&adx=-12222222&ady=-12244444&biw=1600&bih=900&scr_x=0&scr_y=0&eid=31993849%2C31094918%2C42531705%2C95367554%2C95370628%2C95372358%2C31095029%2C95340252%2C95340254&oid=2&pvsid=6669999996390579&tmod=555555555&uas=0&nvt=1&fsapi=1&fc=1920&brdim=135%2C20%2C235%2C20%2C1920%2C0%2C1553%2C992%2C1537%2C687&vis=1&rsz=%7C%7Cs%7C&abl=NS&fu=32768&bc=31&bz=1.01&td=1&tdf=2&psd=W251bGwsbnVsbCxudWxsLDNd&nt=1&ifi=1&uci=a!1&fsb=1&dtd=18\" style=\"left:0;position:absolute;top:0;border:0;width:undefinedpx;height:undefinedpx;min-height:auto;max-height:none;min-width:auto;max-width:none;\" data-google-container-id=\"a!1\" data-load-complete=\"true\"></iframe></div></ins>","ins.adsbygoogle:has(> #aswift_0_host)","data-ad-status","unfilled","ins.adsbygoogle.nitro-body","unfill-optimized","ins.adsbygoogle.nitro-side,ins.adsbygoogle.nitro-banner","filled","var menuSlideProtection","/*start*/!function(){const e=window.addEventListener;window.addEventListener=function(t,n,i){return\"message\"===t&&\"function\"==typeof n&&n.toString().includes(\"googMsgType\")&&setTimeout((()=>{try{const e=document.getElementsByTagName(\"iframe\");for(let t=0;t<e.length;t++){const i=e[t];if(!i.contentWindow)continue;let o;try{o=i.src?new URL(i.src).origin:\"*\"}catch(e){o=\"*\"}const s={msg_type:\"resize-me\",key_value:[{key:\"r_nh\",value:\"0\"},{key:\"r_ifr\",value:\"true\"},{key:\"qid\",value:\"CKjPmM7ezpEDFbyJ6QUdM0o3rw\"}],googMsgType:\"pvt\",token:\"AOrYGskPiXMUpj3CJQ8LsihEHwbNcui1URgWacoUghpsHfMEVL2nwMKey1eyEl6h8i29ah7WTlje42evSBak30X4pe673BR-KOZpAhiqCJO20pQ\"};n({data:JSON.stringify(s),source:i.contentWindow,origin:o})}}catch(e){}}),10),e.apply(this,arguments)}}();!function(){const e=document.querySelectorAll;let t=0;document.querySelectorAll=function(n){const l=(new Error).stack;if(\"iframe\"===n&&l&&l.includes(\"_executeCallback\")){const n=e.apply(this,arguments),l=n.length;let r=l;return 0===t&&l>7?r=4:1===t&&l>9&&(r=8),t++,new Proxy(n,{get:function(e,t){return\"length\"===t?r:e[t]}})}return e.apply(this,arguments)}}();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//,\"\");/*end*/var menuSlideProtection","//tele();","telek3();","/!\\(Object\\.values.*?return false;/g","/[a-z]+\\(\\) &&/","!0&&","location.reload","/google_jobrunner|AdBlock|pubadx|embed\\.html/i","adserverDomain","excludes","debugger","/window.navigator.brave.+;/","false;","account-storage","{\"state\":{\"_hasHydrated\":true","\"userId\":null","\"decryptedUserId\":null","\"email\":null","\"perks\":{\"adRemoval\":true","\"comments\":false","\"premiumFeatures\":true","\"previewReleaseAccess\":true}","\"showUserDialog\":false}","\"version\":2}","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)",":is(.watch-on-link-logo, li.post) img.ezlazyload[src^=\"data:image\"][data-ezsrc]","src","[data-ezsrc]","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition","am-sub","didomi_token","$remove$","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB","adBlockEnabled","ak_bmsc","","0","domain",".nvidia.com","gtag != null","false","\"Anzeige\"","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false","Promise","/adbl/i","Reflect","document.write","self == top","popunder_stop","exdynsrv","ADBp","yes","ADBpcount","/delete window|adserverDomain|FingerprintJS/","/vastURL:.*?',/","vastURL: '',","/url:.*?',/","url: '',","da325","delete window","adsbygoogle","FingerprintJS","a[href^=\"https://cdns.6hiidude.gold/file.php?link=http\"]","?link","/adblock.php","/\\$.*embed.*.appendTo.*;/","appendTo","/adb/i","/document\\.createElement|\\.banner-in/","admbenefits","ref_cookie","/\\badblock\\b/","myreadCookie","setInterval","ExoLoader","adblock","/'globalConfig':.*?\",\\s};var exportz/s","};var exportz","/\\\"homad\\\",/","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}","useAdBlockDefend: true","useAdBlockDefend: false","homad","/if \\([a-z0-9]{10} === [a-z0-9]{10}/","if(true","popUnderUrl","juicyads0","juicyads1","juicyads2","Adblock","WebAssembly","ADB_ACTIVE_STATUS","imps","3","reload","adexp","31000, .VerifyBtn, 100, .exclude-pop.NextBtn, 33000","intentUrl;","destination;","/false;/gm","true;","isSubscribed","('t_modal')","('go_d2')","/window\\.location\\.href\\s*=\\s*\"intent:\\/\\/([^#]+)#Intent;[^\"]*\"/gm","window.location.href = \"https://$1\"","detectAdBlock","/ABDetected|navigator.brave|fetch/","Android/","false/","stay","alert","2000","10","/ai_|b2a/","deblocker","/\\d{2}00/gms","/timer|count|getElementById/gms","/^window\\.location\\.href.*\\'$/gms","buoy","/1000|100|6|30|40/gm","/timerSeconds|counter/","getlink.removeClass('hidden');","gotolink.removeClass('hidden');","no_display","/DName|#iframe_id/","adblockDetector","stopCountdown();","resumeCountdown();","/initialTimeSeconds = \\d+/","initialTimeSeconds = 7","close-modal","ad_expire=true;","$now$","/10|20/","/countdownSeconds|wpsafelinkCount/","/1000|1700|5000/gm","/bypass.php","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","2","htmls","toast","/window\\.location.*?;/","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","/window\\.location\\.href='.*';/","openLink","AdbModel","/popup/i","antiAdBlockerHandler","'IFRAME'","'BODY'","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i","onerror","__gads","/checkAdBlocker|AdblockRegixFinder/","catch","/adb_detected|AdBlockCheck|;break;case \\$\\./i","window.open","timeLeft = duration","timeLeft = 1","/aclib|break;|zoneNativeSett/","/fetch|popupshow/","justDetectAdblock",";return;","_0x","/return Array[^;]+/","return true","antiBlock","return!![]","return![]","/FingerprintJS|openPopup/","/\\d{4}/gm","count","/getElementById\\('.*'\\).*'block';/gm","getElementById('btn6').style.display = 'block';","3000)","10)","isadblock = 1;","isadblock = 0;","\"#sdl\"","\"#dln\"","DisableDevtool","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/","/\\.cloudfront\\.net|window\\.open/g","rundirectad","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","true","!seen && ad","popUp","/adsbygoogle|detectAdBlock/","window.location.href","temp","includes","linkToOpen","(isAdsenseBlocked)","(false)","onDevToolOpen","/#Intent.*?end/","intent","https","firstp","!isAdTriggered","900","100","ctrlKey","/\\);break;case|advert_|POPUNDER_URL|adblock/","3000","getElementById","/adScriptURL|eval/","typeof window.adsbygoogle === \"undefined\"","/30000/gm",".onerror","/window\\.location\\.href.*/","_blank","_self","DisplayAcceptableAdIfAdblocked","adslotFilledByCriteo","/==undefined.*body/","/popunder|isAdBlock|admvn.src/i","/h=decodeURIComponent|popundersPerIP/","/h=decodeURIComponent|\"popundersPerIP\"/","popMagic","head","<div id=\"popads-script\" style=\"display: none;\"></div>","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();","/exoloader/i","/shown_at|WebAssembly/","a.onerror","xxx",";}}};break;case $.","globalThis;break;case","{delete window[","break;case $.","wpadmngr.com","\"adserverDomain\"","sandbox","var FingerprintJS=","/decodeURIComponent\\(escape|fairAdblock/","/ai_|googletag|adb/","adsBlocked","ai_adb","\"v4ac1eiZr0\"","admiral","'').split(',')[4]","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']|decodeURI\\(decodeURI\\(\"|<a href=\"https:\\/\\/getad%/","/^/","(()=>{window.admiral=function(d,a,b){if(\"function\"==typeof b)try{b({})}catch(a){}}})();","__adblocker","html-load.com","window.googletag =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.googletag =","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer =","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","/^.+/gms","!function(){var e=Object.getOwnPropertyDescriptor(Element.prototype,\"innerHTML\").set;Object.defineProperty(Element.prototype,\"innerHTML\",{set:function(t){return t.includes(\"html-load.com\")?e.call(this,\"\"):e.call(this,t)}})}();","error-report.com","/\\(async\\(\\)=>\\{try\\{(const|var)/","KCgpPT57bGV0IGU","Ad-Shield","adrecover.com","\"data-sdk\"","/wcomAdBlock|error-report\\.com/","head.appendChild.bind","/^\\(async\\(\\)=>\\{function.{1,200}head.{1,100}\\.bind.{1,900}location\\.href.{1,100}\\}\\)\\(\\);$/","/\\(async\\s*\\(\\)\\s*=>\\s*\\{\\s*try\\s*\\{\\s*(const|var)/","\"https://html-load.com/loader.min.js\"","await eval","()=>eval","domain=?eventId=&error=",";confirm(","/adblock|popunder|openedPop|WebAssembly|wpadmngr/","/.+/gms","document.addEventListener(\"load\",()=>{if (typeof jwplayer!=\"undefined\"&&typeof jwplayer().play==\"function\"){jwplayer().play();}})","FuckAdBlock","(isNoAds)","(true)","/openNewTab\\(\".*?\"\\)/g","null","#player-option-1","500","/detectAdblock|WebAssembly|pop1stp|popMagic/i","/popMagic|pop1stp/","_cpv","pingUrl","ads","_ADX_","dataLayer","d-none|media-filter-brightness|bg-dark",".media-main-image","location.href","div.offsetHeight","/bait/i","let playerType","window.addEventListener(\"load\",()=>{if(typeof playMovie===\"function\"){playMovie()}});let playerType","/adbl|RegExp/i","window.lazyLoadOptions =","if(typeof ilk_part_getir===\"function\"){ilk_part_getir()}window.lazyLoadOptions =","popactive","nopop","popcounter","/manageAds\\(video_urls\\[activeItem\\], video_seconds\\[activeItem\\], ad_urls\\[activeItem],true\\);/","playVideo();","playAdd","skipButton.innerText !==","\"\" ===","var controlBar =","skipButton.click();var controlBar =","await runPreRollAds();","shouldShowAds() ?","false ?","/popup|arrDirectLink/","/WebAssembly|forceunder/","vastTag","v","twig-body","/isAdBlocked|popUnderUrl/","dscl2","/protect_block.*?,/","/adb|offsetWidth|eval/i","lastRedirect","contextmenu","/adblock|var Data.*];/","var Data","_ga","GA1.1.000000000.1900000000","globo.com","replace","/window.open.*/gms","window.open(url, \"_self\");}","/window\\.location\\.href.*?;/","/\\(window\\.show[^\\)]+\\)/","classList.add","PageCount","WHITELISTED_CLOSED","style","text-decoration","/break;case|FingerprintJS/","push","(isAdblock)","get-link",".ybtn.get-link[target=\"_blank\"]","AdBlocker","a[href^=\"https://link.asiaon.top/full?api=\"][href*=\"&url=aHR0c\"]","?url -base64",".btn-success.get-link[target=\"_blank\"]","visibility: visible !important;","display: none !important;","has-sidebar-adz|DashboardPage-inner","div[class^=\"DashboardPage-inner\"]","hasStickyAd","div.hasStickyAd[class^=\"SetPage\"]","downloadbypass","cnx-ad-container|cnx-ad-bid-slot","clicky","vjs-hidden",".vjs-control-bar","XV","Popunder","charCodeAt","currentTime = 1500 * 2","currentTime = 0","hidden","button",".panel-body > .text-center > button","/mdp|adb/i","popunder","adbl","/protect?","<img src='/ad-choices.png' onerror='if (localStorage.length !== 0 || typeof JSON.parse(localStorage._ppp)[\"0_uid\"] !== \"undefined\") {Object.defineProperty(window, \"innerWidth\", {get() { return document.documentElement.offsetWidth + 315 }});}'></img>","googlesyndication","/^.+/s","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"streamingcommunity.computer\")){registration.unregister()}}}));","swDidInit","blockAdBlock","/downloadJSAtOnload|Object.prototype.toString.call/","softonic-r2d2-view-state","numberPages","brave","modal_cookie","AreLoaded","AdblockRegixFinder","/adScript|adsBlocked/","serve","zonck",".lazy","[data-sco-src]","OK","wallpaper","click","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","text-decoration:none;vertical-align:middle","?metric=transit.counter&key=fail_redirect&tags=","/pushAdTag|link_click|getAds/","/\\', [0-9]{3}\\)\\]\\; \\}  \\}/","/\\\",\\\"clickp\\\"\\:[0-9]{1,2}\\}\\;/","textContent","td-ad-background-link","?30:0","?0:0","download-font-button2",".download-font-button","a_render","unlock_chapter_guest","a[href^=\"https://azrom.net/\"][href*=\"?url=\"]","?url","/ConsoleBan|alert|AdBlocker/","qusnyQusny","visits","ad_opened","/AdBlock/i","body:not(.ownlist)","unclickable","mdpDeblocker","/deblocker|chp_ad/","await fetch","AdBlock","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/","insertAdjacentHTML","off","/vs|to|vs_spon|tgpOut|current_click/","popUnder","adb","#text","/スポンサーリンク|Sponsored Link|广告/","スポンサーリンク","スポンサードリンク","/\\[vkExUnit_ad area=(after|before)\\]/","【広告】","関連動画","PR:","leave_recommend","/Advertisement/","/devtoolsDetector\\.launch\\(\\)\\;/","button[data-testid=\"close-modal\"]","navigator.brave","//$('#btn_download').click();","$('#btn_download').click();","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","div[class^=\"css-\"][style=\"transition-duration: 0s;\"] > div[dir=\"auto\"][data-testid=\"needDownloadPS\"]","/data: \\[.*\\],/","data: [],","ads_num","a[href^=\"/p/download.html?ntlruby=\"]","?ntlruby","a[href^=\"https://www.adtival.network/\"][href*=\"&url=\"]","liedetector","end_click","getComputedStyle","closeAd","/adconfig/i","is_antiblock_refresh","/userAgent|adb|htmls/","myModal","open","visited","app_checkext","ad blocker","clientHeight","Brave","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","attribute","adf_plays","adv_","flashvars","iframe#iframesrc","[data-src]","await","has-ad-top|has-ad-right",".m-gallery-overlay.has-ad-top.has-ad-right","axios","/charAt|XMLHttpRequest/","a[href^=\"https://linkshortify.com/\"][href*=\"url=http\"]","/if \\(api && url\\).+/s","window.location.href = url","quick-link","inter","AdBlockEnabled","window.location.replace","egoTab","/$.*(css|oncontextmenu)/","/eval.*RegExp/","wwads","popundersPerIP","/ads?Block/i","chkADB","ab","IFRAME","BODY","Symbol.iterator","ai_cookie","/innerHTML.*appendChild/","Exo","(hasBlocker)","P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/","AaDetector","/window\\[\\'open\\'\\]/","Error","startTime: '5'","startTime: '0'","/document\\.head\\.appendChild|window\\.open/","12","email","pop1stp","Number","NEXT_REDIRECT","ad-block-activated","pop.doEvent","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}","#no-thanks-btn","rodo","body.rodo","Ads","button[data-test=\"watch-ad-button\"]","detect","buton.setAttribute","location.href=urldes;buton.setAttribute","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount","fetch","/hasAdblock|detect/","/if\\(.&&.\\.target\\)/","if(false)","document.getElementById('choralplayer_reference_script')","!document.getElementById('choralplayer_reference_script')","(document.hasFocus())","show_only_once_per_day","show_only_once_per_day2","document.createTextNode","ts_popunder","video_view_count","(adEnable)","(download_click == false)","adsSrc","var debounceTimer;","window.addEventListener(\"load\",()=>{document.querySelector('#players div[id]:has(> a > div[class^=\"close_reklama\"])')?.click?.()});var debounceTimer;","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/","window.warn","adBlock","adBlockDetected","__pf","/fetch|adb/i","npabp","location","aawsmackeroo0","adTakeOver","seen","showAd","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});","imgSrc","document.createElement(\"script\")","antiAdBlock","/fairAdblock|popMagic/","realm.Oidc.3pc","iframe[data-src-cmplz][src=\"about:blank\"]","[data-src-cmplz]","aclib.runPop","mega-enlace.com/ext.php?o=","scri12pts && ifra2mes && coo1kies","(scri12pts && ifra2mes)","Popup","/catch[\\s\\S]*?}/","displayAdsV3","adblocker","_x9f2e_20251112","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();","video_urls.length != activeItem","!1","dscl","ppndr","break;case","var _Hasync","jfun_show_TV();var _Hasync","adDisplayed","window._taboola =","(()=>{const e={apply:(e,o,l)=>o.closest(\"body > video[src^=\\\"blob:\\\"]\")===o?Promise.resolve(!0):Reflect.apply(e,o,l)};HTMLVideoElement.prototype.play=new Proxy(HTMLVideoElement.prototype.play,e)})();window._taboola =","dummy","/window.open.*;/","h2","/creeperhost/i","!seen","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/","clicked","/if.*Disable.*?;/g","blocker","this.ads.length > this.ads_start","1==2","/adserverDomain|\\);break;case /","initializeInterstitial","adViewed","popupBackground","/h=decodeURIComponent|popundersPerIP|adserverDomain/","forcefeaturetoggle.enable_ad_block_detect","m9-ad-modal","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","srclink","Anzeige","blocking","HTMLAllCollection","const ad_slot_","(()=>{window.addEventListener(\"load\",(()=>{document.querySelectorAll(\"ins.adsbygoogle\").forEach((element=>element.dataset.adsbygoogleStatus=\"done\"))}))})();const ad_slot_","aalset","LieDetector","_ym_uid","advads","document.cookie","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/","(self.__next_f=","[\"timeupdate\",\"durationchange\",\"ended\",\"enterpictureinpicture\",\"leavepictureinpicture\",\"loadeddata\",\"loadedmetadata\",\"loadstart\",\"pause\",\"play\",\"playing\",\"ratechange\",\"resize\",\"seeked\",\"seeking\",\"suspend\",\"volumechange\",\"waiting\"].forEach((e=>{window.addEventListener(e,(()=>{const e=document.getElementById(\"player\"),t=document.querySelector(\".plyr__time\");e.src.startsWith(\"https://i.imgur.com\")&&\"none\"===window.getComputedStyle(t).display&&(e.src=\"https://cdn.plyr.io/static/blank.mp4\",e.paused&&e.plyr.play())}))}));(self.__next_f=","/_0x|brave|onerror/","/  function [a-zA-Z]{1,2}\\([a-zA-Z]{1,2},[a-zA-Z]{1,2}\\).*?\\(\\)\\{return [a-zA-Z]{1,2}\\;\\}\\;return [a-zA-Z]{1,2}\\(\\)\\;\\}/","/\\}\\)\\;\\s+\\(function\\(\\)\\{var .*?\\)\\;\\}\\)\\(\\)\\;\\s+\\$\\(\\\"\\#reportChapte/","}); $(\"#reportChapte","kmtAdsData","navigator.userAgent","{height:370px;}","{height:70px;}","vid.vast","//vid.vast","checkAdBlock","pop","detectedAdblock","adWatched","setADBFlag","/(function reklamla\\([^)]+\\) {)/","$1rekgecyen(0);","BetterJsPop0","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);","/wpadmngr|adserverDomain/","/account_ad_blocker|tmaAB/","frameset[rows=\"95,30,*\"]","rows","0,30,*","ads_block","ad-controls",".bitmovinplayer-container.ad-controls","in_d4","hanime.tv","p","window.renderStoresWidgetsPluginList=","//window.renderStoresWidgetsPluginList=","Custom Advertising/AWLS/Video Reveal",".kw-ads-pagination-button:first-child,.kw-ads-pagination-button:first-child","1000","/Popunder|Banner/","PHPSESSID","return a.split","/popundersPerIP|adserverDomain|wpadmngr/","==\"]","lastClicked","9999999999999","ads-blocked","#adbd","AdBl","preroll_timer_current == 0 && preroll_player_called == false","/adblock|Cuba|noadb|popundersPerIP/i","/adserverDomain|ai_cookie/","/^var \\w+=\\[.+/","(()=>{let e=[];document.addEventListener(\"DOMContentLoaded\",(()=>{const t=document.querySelector(\"body script\").textContent.match(/\"] = '(.*?)'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*'(.*?)'/,\"$1\");e.push(r)}));const r=document.querySelector('.dl_button[href*=\"preview\"]').href.split(\"?\")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(\".dl_button[href]\").forEach((t=>{t.target=\"_blank\";let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();","adblock_warning_pages_count","/adsBlocked|\"popundersPerIP\"/","/vastSource.*?,/","vastSource:'',","/window.location.href[^?]+this[^?]+;/","ab.php","godbayadblock","wpquads_adblocker_check","froc-blur","download-counter","/__adblocker|ccuid/","_x_popped","{}","/alert|brave|blocker/i","/function _.*JSON.*}}/gms","function checkName(){const a = document.querySelector(\".monsters .button_wrapper .button\");const b = document.querySelector(\"#nick\");const c = \"/?from_land=1&nick=\";a.addEventListener(\"click\", function () {document.location.href = c + b.value;}); } checkName();","/ai_|eval|Google/","/document.body.appendChild.*;/","/delete window|popundersPerIP|FingerprintJS|adserverDomain|globalThis;break;case|ai_adb|adContainer/","/eval|adb/i","catcher","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/","/isAdBlockActive|WebAssembly/","videoPlayedNumber","welcome_message_1","videoList","freestar","/admiral/i","not-robot","self.loadPW","onload","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/","window.location.replace(urlRandom);","pum-32600","pum-44957","closePlayer","/banner/i","/window\\.location\\.replace\\([^)]+\\);?/g","superberb_disable","superberb_disable_date","destroyContent","advanced_ads_check_adblocker","'hidden'","/dismissAdBlock|533092QTEErr/","k3a9q","$now$%7C1","body","<div id=\"rpjMdOwCJNxQ\" style=\"display: none;\"></div>","/bait|adblock/i","!document.getElementById","document.getElementById","(()=>{document.querySelectorAll(`form:has(> input[value$=\".mp3\"])`).forEach(el=>{let url=el.querySelector(\"input\").getAttribute(\"value\");el.setAttribute(\"action\",url)})})();window.dataLayer =",",availableAds:[",",availableAds:[],noAds:[","function OptanonWrapper() {}","/*start*/(()=>{const o={apply:(o,t,e)=>(\"ads\"===e[0]&&\"object\"==typeof t&&null!==t&&(t.ads=()=>{}),Reflect.apply(o,t,e))};window.Object.prototype.hasOwnProperty=new Proxy(window.Object.prototype.hasOwnProperty,o)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/function OptanonWrapper() {}","decodeURIComponent","adblock_popup","MutationObserver","garb","skipAd","a[href^=\"https://toonhub4u.com/redirect/\"]","ad-gate","popupAdsUrl","nopopup","// window.location.href","playerUnlocked = false","playerUnlocked = true","/self.+ads.+;/","isWindows",":visible","jQuery.fn.center","window.addEventListener(\"load\",()=>{if (typeof load_3rdparties===\"function\"){load_3rdparties()}});jQuery.fn.center","Datafadace","/popunder/i","adConfig","enable_ad_block_detector","/FingerprintJS|Adcash/","/const ads/i","adinserter","AD_URL","/pirate/i","offsetHeight","student_id",".offsetLeft",":{content:","no:{content:","AdBlockChecker",".modal-content","ins.adsbygoogle","data-adsbygoogle-status","done","div","document.body.innerHTML","/popunder|contextmenu/","\"hidden\"","/overlay/i","/aoAdBlockDetected/i","c-wiz[data-p] [data-query] a[target=\"_blank\"][role=\"link\"]","rlhc","/join\\(\\'\\'\\)/","/join\\(\\\"\\\"\\)/","api.dataunlocker.com","/^Function\\(\\\"/","adshield-analytics-uuid","/_fa_bGFzdF9iZmFfYXQ=$/","/_fa_dXVpZA==$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWNjZXB0YWJsZV9hZHM=$/","/_fa_Y2FjaGVfaXNfYmxvY2tpbmdfYWRz$/","/_fa_Y2FjaGVfYWRibG9ja19jaXJjdW12ZW50X3Njb3Jl$/","a[href^=\"https://www.linkedin.com/redir/redirect?url=http\"]","_ALGOLIA","when","scroll keydown","segmentDeviceId","body a[href^=\"/rebates/welcome?url=http\"]","a[href^=\"https://deeplink.musescore.com/redirect?to=http\"]","?to","/^rt_/","a[href^=\"/redirects/link-ad?redirectUrl=aHR0c\"]","?redirectUrl -base64","a[href^=\"//duckduckgo.com/l/?uddg=\"]","?uddg","a[href^=\"https://go.skimresources.com/\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/\"][href*=\"link?id=\"][href*=\"&murl=http\"]","?murl","a[href^=\"/vp/player/to/?u=http\"], a[href^=\"/vp/download/goto/?u=http\"]","?u","a[href^=\"https://drivevideo.xyz/link?link=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=\"]","a[href*=\"?\"][href*=\"&url=http\"]","a[href*=\"?\"][href*=\"&u=http\"]","a[href^=\"https://app.adjust.com/\"][href*=\"?fallback=http\"]","?fallback","a[href^=\"https://go.redirectingat.com?url=http\"]","a[href^=\"/check.php?\"][href*=\"&url=http\"]","a[href^=\"https://click.linksynergy.com/deeplink?id=\"][href*=\"&murl=http\"]","a[href^=\"https://disq.us/url?url=\"][title^=\"http\"]","[title]","a[href^=\"https://disq.us/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?url=http\"]","a[href^=\"https://steamcommunity.com/linkfilter/?u=http\"]","a[href^=\"https://colab.research.google.com/corgiredirector?site=http\"]","?site","a[href^=\"https://shop-links.co/link/?\"][href*=\"&url=http\"]","a[href^=\"https://redirect.viglink.com/?\"][href*=\"ourl=http\"]","?ourl","a[href^=\"http://www.jdoqocy.com/click-\"][href*=\"?URL=http\"]","?URL","a[href^=\"https://track.adtraction.com/t/t?\"][href*=\"&url=http\"]","a[href^=\"https://metager.org/partner/r?link=http\"]","a[href*=\"go.redirectingat.com\"][href*=\"url=http\"]","a[href^=\"https://slickdeals.net/?\"][href*=\"u2=http\"]","?u2","a[href^=\"https://online.adservicemedia.dk/\"][href*=\"deeplink=http\"]","?deeplink","a[href*=\".justwatch.com/a?\"][href*=\"&r=http\"]","?r","a[href^=\"https://clicks.trx-hub.com/\"][href*=\"bn5x.net\"]","?q?u","a[href^=\"https://shopping.yahoo.com/rdlw?\"][href*=\"gcReferrer=http\"]","?gcReferrer","body a[href*=\"?\"][href*=\"u=http\"]:is([href*=\".com/c/\"],[href*=\".io/c/\"],[href*=\".net/c/\"],[href*=\"?subId1=\"],[href^=\"https://affportal.bhphoto.com/dl/redventures/?\"])","body a[href*=\"?\"][href*=\"url=http\"]:is([href^=\"https://cc.\"][href*=\".com/v1/otc/\"],[href^=\"https://go.skimresources.com\"],[href^=\"https://go.redirectingat.com\"],[href^=\"https://invol.co/aff_m?\"],[href^=\"https://shop-links.co/link\"],[href^=\"https://track.effiliation.com/servlet/effi.redir?\"],[href^=\"https://atmedia.link/product?url=http\"],[href*=\".com/a.ashx?\"],[href^=\"https://www.\"][href*=\".com/t/\"],[href*=\".prsm1.com/r?\"],[href*=\".com/click-\"],[href*=\".net/click-\"],a[href*=\".com/t/t?a=\"],a[href*=\".dk/t/t?a=\"])","body a[href*=\"/Proxy.ashx?\"][href*=\"GR_URL=http\"]","?GR_URL","body a[href^=\"https://go.redirectingat.com/\"][href*=\"&url=http\"]","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"ued=http\"]","?ued","body a[href*=\"awin1.com/\"][href*=\".php?\"][href*=\"p=http\"]","?p","a.autolinker_link[href*=\".com/t/\"][href*=\"url=http\"]","body a[rel=\"sponsored nofollow\"][href^=\"https://fsx.i-run.fr/?\"][href*=\"redir=http\"]","?redir","body a[rel=\"sponsored nofollow\"][href*=\".tradeinn.com/ts/\"][href*=\"trg=http\"]","?trg","body a[href*=\".com/r.cfm?\"][href*=\"urllink=http\"]","?urllink","body a[href^=\"https://gate.sc\"][href*=\"?url=http\"]","body a[href^=\"https://spreaker.onelink.me/\"][href*=\"&af_web_dp=http\"]","?af_web_dp","body a[href^=\"/link.php?url=http\"]","body a[href^=\"/ExternalLinkRedirect?\"][href*=\"url=http\"]","realm.cookiesAndJavascript","kt_qparams","kt_referer","/^blaize_/","akaclientip","hive_geoloc","MicrosoftApplicationsTelemetryDeviceId","MicrosoftApplicationsTelemetryFirstLaunchTime","Geo","bitmovin_analytics_uuid","_boundless_tracking_id","/LithiumVisitor|ValueSurveyVisitorCount|VISITOR_BEACON/","kt_ips","/^(_pc|cX_)/","/_pcid|_pctx|amp_|cX|incap/","/amplitude|lastUtms|gaAccount|cX|_ls_ttl/","_cX_S","/^AMCVS?_/","/^(pe-|sndp-laneitem-impressions)/","disqus_unique","disqus.com","/_shopify_(y|sa_)/","_sharedid",".naszemiasto.pl","/ana_client_session_id|wshh_uid/","fly_vid","/fmscw_resp|intercom/","CBSNEWS.features.fms-params","/^(ev|vocuser)_/","gtagSessionId","uuid","/^_pubcid|sbgtvNonce|SUID/","/^uw-/","ajs_anonymous_id","/_HFID|mosb/","/ppid$/","/ph_phc|remark_lead/","remark_lead","/^ph_phc/","/incap_|s_fid/","/^_pubcid/","youbora.youboraDeviceUUID","anonymous_user_id","rdsTracking","bp-analytics","/^\\.(b|s|xp|ub\\.)id/","/^ig-|ph_phc_/","/^ph_phc_/","X-XAct-ID","/^fosp_|orig_aid/","/^recommendation_uuid/","optimizely-vuid","fw_se",".hpplus.jp","fw_uid","/^fw_/","dvid","marketingCloudVisitorID","PERSONAL_FLIGHT_emperiaResponse","device_id","kim-tracker-uid","/swym-|yotpo_/","/^boostSD/","/bitmovin_analytics_uuid|sbgtvNonce|SUID/","/sales-ninja|snj/","etx-settings","/__anon_id|browserId/","/_pk_id|hk01_annonymous_id/","ga_store_user_id","/^_pk_id./","/_sharedid|_lc2_fpi/","/_li_duid|_lc2_fpi/","/anonUserId|pid|sid/","/__ta_|_shopify_y/","_pkc","trk",".4game.com",".4game.ru","/fingerprint|trackingEvents/","/sstk_anonymous_id|htjs_anonymous_id/","/htjs_|stck_|statsig/","/mixpanel/","inudid",".investing.com","udid","smd","attribution_user_id",".typeform.com","ld:$anonUserId","/_user_id$/","vmidv1","csg_uid","uw-uid","RC_PLAYER_USER_ID","/sc_anonymous_id|sc_tracking_anonymous_id/","/sc_tracking_anonymous_id|statsig/","_shopify_y","/lc_anon_user_id|_constructorio_search_client_id/","/^_sp_id/","/builderVisitorId|snowplowOutQueue_cf/","bunsar_visitor_id","/__anon_id|efl-uuid/","_gal1","/articlesRead|previousPage/","IIElevenLabsDubbingResult","a[href*=\"https://www.chollometro.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.dealabs.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.hotukdeals.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.mydealz.de/visit/\"][title^=\"https://\"]","a[href*=\"https://nl.pepper.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.it/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.pl/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pepper.ru/visit/\"][title^=\"https://\"]","a[href*=\"https://www.preisjaeger.at/visit/\"][title^=\"https://\"]","a[href*=\"https://www.promodescuentos.com/visit/\"][title^=\"https://\"]","a[href*=\"https://www.pelando.com.br/api/redirect?url=\"]","vglnk","ahoy_visitor","ahoy_visit","nxt_is_incognito","a[href^=\"https://cna.st/\"][data-offer-url^=\"https://\"]","[data-offer-url]","/_alooma/","a.btn[href^=\"https://zxro.com/u/?url=http\"]",".mirror.co.uk","/_vf|mantisid|pbjs_/","/_analytics|ppid/","/^DEVICEFP/","DEVICEFP","00000000000",".hoyoverse.com","DEVICEFP_SEED_ID","DEVICEFP_SEED_TIME",".hoyolab.com","/^_pk_/","_pc_private","/detect|FingerprintJS/","_vid_t","/^_vid_(lr|t)$/","/^(_tccl_|_scc_session|fpfid)/","/adthrive|ccuid|at_sticky_data|geo-location|OPTABLE_/","/previous/","/cnc_alien_invasion_code|pixelsLastFired/","/^avoinspector/","/^AMP_/","VR-INJECTOR-INSTANCES-MAP","/_shopify_y|yotpo_pixel/","a[href^=\"https://cts.businesswire.com/ct/CT?\"][href*=\"url=http\"]","/RegExp\\(\\'/","RegExp","sendFakeRequest"];

const $scriptletArglists$ = /* 832 */ "0,0,1,2,3,4;1,0,5;1,0,6;0,0,7,8;0,0,9,10;1,0,11;2,12,13;2,14,15;2,16,17;2,18,19;3,20,21,22;3,23,21,24;3,25,21,26;0,0,27,28,3,4;0,0,29,30;0,0,31;0,0,32,33;1,0,34;1,0,35;1,0,36,37,38;0,0,39,40;4,41,42,43,44,45,46,47,48,49,50,51;0,0,52,53;5,54,55,56;6;0,0,57,58;0,0,59,60,61,62;7,63,4;8,64;9,64,65;0,0,66,67;1,0,68;10,69,70,71,70,72,73;0,0,74,75;1,0,76;0,0,77,78;1,0,36;1,0,79;1,0,80;1,0,81;1,0,82;1,0,83;7,84,4;1,0,85;7,86,87;7,88,4;1,0,89;0,0,90,91;0,0,92,93;8,94;1,0,95;1,0,96;1,0,97;11,98,99;1,0,100;0,0,101,70,61,102;1,0,103;1,0,104;1,0,105;8,106;1,0,107;1,0,108;0,0,109;1,0,110;1,0,111;0,0,112,113;0,0,114;0,0,115,116;0,0,117,118;1,0,119;0,0,120,121;1,0,122;7,123,4;7,124,4;7,125,4;1,0,126;1,0,127;9,128,65;7,129,130,70,131,4;7,132,4,70,131,4;12,133;0,0,134,135;0,0,136,137,61,138;0,0,139,140;0,0,141,142;1,0,143;1,0,144;0,0,145,146,147,4;0,0,148,75;0,0,149,150;1,0,151;1,0,152;0,0,153,150,61,154;0,0,155,70,61,156;0,0,157,4,61,158;0,0,159,160;13,161;1,0,162;1,0,163;0,0,164,165;0,0,166,167;1,0,168;10,169,170;0,0,171,71,61,172;0,0,173,150,61,172;1,0,174;0,0,175,176,3,177;1,0,178;1,0,179;0,0,180;0,0,181,75;0,0,182,70,61,183;1,0,184;1,0,185;1,0,186;0,0,187,188;1,0,189;1,0,190;7,191,4;1,0,192;1,0,193;1,0,194;1,0,195;0,0,196,197;1,0,198;1,0,199;1,0,200;0,0,201,70,61,202;0,0,203,204;7,205,4;0,0,206,207;1,0,208;0,0,209,150,61,210;0,0,211,212,61,210;0,0,213,214;0,0,215,216;0,0,217,218;1,0,219;0,0,220,221;0,0,222,75;0,0,40,137,61,223;0,0,224,225;0,0,226,75;1,0,227;1,0,228;0,0,229,230,231,232;0,0,233,234;1,0,235;0,0,236;0,0,237,238;1,0,239;0,0,240,75;0,0,241,242;1,0,243;1,0,244;0,0,245,150,61,246;1,0,247;0,0,248,75;0,0,249,150;1,0,250;0,0,251;0,0,252,253;1,0,254;1,0,255;1,0,256;1,0,257;1,0,258;1,0,259;1,0,260;2,261,262;0,0,263,264;1,0,265;1,0,266;0,0,267,268;1,0,269;1,0,270;1,0,271;0,0,272;1,0,273;1,0,274;1,0,275;1,0,276;1,0,277;1,0,278;1,0,279;1,0,280;1,0,281;1,0,282;1,0,283;1,0,284;0,0,285,286,3,4;7,287,75;1,0,288;0,0,289,290;0,0,291,292;0,0,293,294;0,0,291,295;0,0,291,296;0,0,297,298,3,4;0,0,299,300,3,4;0,0,301,302,61,288;1,0,303;1,0,304;1,0,305;1,0,306;1,0,307;1,0,308;1,0,309;1,0,310;1,0,311;1,0,312;1,0,313;1,0,314;1,0,315;1,0,316;1,0,317;1,0,318;0,0,319,320,61,321;0,0,322,323;0,0,324,325;12,326,70,327;1,0,328;1,0,329;1,0,330;1,0,331;1,0,332;1,0,333;1,0,334;13,335,336;1,0,337;1,0,338;1,0,339;0,0,340,341;1,0,342;0,0,343,344,3,4;0,0,345,346;7,347,177;0,0,348,349,61,350;0,0,351,352;0,0,353,354,3,4;0,0,355;0,0,356,357;1,0,358;1,0,359;0,0,360,361;13,362;1,0,363;7,364,4;0,0,365;1,0,366;9,367,225;1,0,368;1,0,369;1,0,370;10,371,372,70,70,72,373;1,0,374;8,285;0,0,375,376;0,0,377;0,0,378,323,61,379;8,380;9,380,65;7,381,4;1,382,383;1,0,384;1,0,385;0,0,386,234;13,387,388,147;1,0,389;11,390,391;13,387,392,147;0,382,393,394;13,395,396,147;13,397,398,147;7,399,4;13,400;8,287;1,0,401;13,402,403,147;1,0,404;1,0,405;1,0,406;0,0,407,408;13,409,410;13,409,411;1,0,412;1,0,413;1,0,414;7,413,4;14,415;2,261,416;1,0,417;0,0,418,419,61,420;1,0,421;8;1,0,422;7,423,4;1,0,424;1,0,425;7,426,87;1,0,427;1,0,428;1,0,429;1,0,430;8,431;9,431,65;5,432,55,433;7,191,434,70,131,4;10,435,436;0,382,437,438,61,439;1,0,440;1,0,441;1,0,442;1,0,443;1,0,444;13,445;0,0,446,447;13,448,449;9,450,225;7,451,4;11,452,453;1,0,454;8,455;7,456,4;7,457,225;1,0,458;1,382,459;13,460,70,147;1,0,461;15;1,0,148,61,111;1,0,462;1,0,463;1,0,464;0,0,465,466;1,0,467;1,0,468;7,332,469;8,470;1,0,471;1,0,472;1,473,474;1,473,475;1,473,476;1,473,477;1,473,478;1,473,479;1,473,480;1,0,481;1,473,482;0,0,483;12,484;1,0,485;0,0,486,487,3,4;0,0,488,75;12,489;0,0,490,491,61,492;11,493,494;11,495,453;1,0,496;1,0,497;1,0,498;1,0,499;1,0,500;1,0,501;1,0,502;1,0,503;1,0,504;7,505,4;1,0,506;1,0,507;1,0,508;1,0,509;0,0,510,511,61,512;9,513,177;0,0,514,70,61,515;5,516,55,517;1,0,518;13,519,520;1,0,521;1,0,522;11,523,453;0,0,524,525,61,526;7,527,4,70,131,4;1,0,528;1,0,529;1,0,530;1,0,531;1,0,532;1,0,533;1,0,534;1,0,535;1,0,536;8,537;0,0,538,539;1,0,540;1,0,541;1,0,542;1,0,543;0,0,544,234;0,545,546;1,0,547;1,0,548;1,0,549;0,0,550,551;1,0,552;6,553;9,554,225;1,0,555;1,0,556;1,0,557;1,0,558;1,0,559;0,0,560,561;12,562;13,563,564;1,0,565;12,566;1,0,567;0,0,568,569;0,0,570,571;1,0,572;1,0,573;0,0,574,575;0,0,576,577;0,0,578,234;7,579,4;7,580,4;1,0,581;7,582,225,70,131,4;0,0,413,70,61,413,147,4;8,583;0,0,584,323;0,0,585,234;1,0,586;0,0,587,588,3,4;1,0,589;1,0,590;1,0,591;1,0,592;7,593,4;1,0,594;7,595,4;1,0,596;7,597,4;10,598,599;1,0,600;0,0,601,602;1,0,603;1,0,604;1,0,605;1,0,606;16,607,65;5,608,55,609;7,413,87;1,0,610;1,0,611;0,0,612,225;0,0,613,323;1,0,614;0,0,615,70,61,572;1,0,616;1,0,617;16,618,225;0,0,619,620;0,0,621,622;7,623,4;7,624,4;1,0,625;0,0,626,627;9,628,65;0,0,629,630;7,631,4,70,131,4;0,0,632;1,633,634;0,0,635,75;1,0,636;7,637,4,70,131,4;0,0,638,70,61,639;0,0,640,641;1,0,642;1,0,643;16,644,225;1,0,645;1,0,646;9,647,75;1,0,648;0,0,649,650,61,651;1,0,652;1,0,653;1,0,654;0,0,655,656,3,4;7,657,4;1,0,658;10,659,170;1,0,660;1,0,661;0,0,291,662,3,4;1,0,663;0,0,664,665,3,4;1,0,666;0,0,667;0,0,668,669;1,0,670;1,0,671;0,382,672,673;0,0,674,675;1,0,676;7,677,4;1,0,678;9,679,225;1,0,680;0,0,681,682;7,683,4;1,0,684;0,0,7,685;1,0,686;1,0,687;3,688,689,690;1,0,691;13,692,693;10,694,4,70,70,72,695;0,0,413,696;0,0,697,698,61,699;12,700,70,701;1,0,702;8,703;1,0,704;1,0,705;1,0,706;10,707,708;1,0,709;1,0,710;1,0,711;0,0,712,225;1,0,713;1,0,714;0,0,715,716,3,4;9,717,65;1,0,718;0,0,719,720;0,0,721;1,0,722;17,723,723;1,0,724;13,725,70,147;7,726,4;8,727;1,0,287;16,728,729;1,0,730;0,0,731,732;1,0,733;0,0,734;1,0,735;1,0,736;1,0,737;1,0,738;1,0,739;8,740;10,741,225,70,70,131,4;1,0,742;1,0,743;1,0,744;7,745,225;1,0,746;1,0,747;1,0,748;0,0,749,70;7,750,225;7,751,225;1,0,752;1,0,753;1,0,202;0,0,754;9,755,4;4,756,170;1,0,757;1,0,758;1,0,759;1,0,760;10,761,762;2,763,764;1,0,765;1,0,38;0,0,766,767;0,0,291,768,3,4;0,0,769,770,3,4;0,0,771,772;1,0,773;1,0,774;1,0,775;7,776,4;7,777,4,70,131,4;11,778,391;1,0,779;0,0,780,781;0,0,229,782;0,0,783,784;0,0,785;1,0,786;1,0,787;0,0,788,789;1,0,790;1,0,791;1,0,792;1,0,793;1,0,794;1,0,795;1,473,796;1,0,797;1,0,798;1,0,799;9,800,65;1,0,801;0,0,802,803;1,0,804;1,382,805;3,806,807,808;2,806,809;1,0,810;1,0,811;1,0,812;1,0,813;1,0,814;5,815,816,4;1,0,817;1,0,818;1,0,819;1,0,820;9,821,65;9,822,65;9,823,65;9,824,65;9,825,65;9,826,65;11,827,453;8,828,829,830;9,831,65;11,832,453;11,833,834;9,835,65;11,836,837;11,838,839;11,840,453;11,841,842;11,843,844;11,845,99;11,846,842;11,847,453;11,848,844;11,849,850;11,851,453;11,852,453;11,853,842;11,854,855;11,856,453;11,857,453;11,858,844;11,859,860;11,861,453;11,862,863;11,864,865;11,866,453;11,867,99;11,868,453;11,869,870;11,871,872;11,873,874;11,875,876;11,877,878;11,879,844;11,880,453;11,881,882;11,883,453;11,884,885;11,886,887;11,888,453;11,889,890;11,891,892;11,893,894;11,895,453;11,896,897;11,898,453;11,899,453;8,900;8,901;8,902;8,903,829,830;8,904;8,905;8,906,829,830;8,907;10,906,70,71;7,908,434;7,909,434;8,910;8,911;8,912;8,913,829,830;8,914,829,830;9,915,65;16,916,65;8,917;9,918,65;8,919,829,830;10,919,71,70,70,72,920;8,921,829,830;10,922,70,71,70,72,923;8,924;8,925,829,830;9,926,65;16,927,65;8,928,829,830;8,929;9,930,65;8,931;9,932,65;8,933,829,830;8,934;8,935;8,936,829,830;9,937,65;16,938,65;8,939,829,830;8,940,829,830;9,941,65;8,942;8,943,829,830;9,944,65;8,945,829,830;8,946,829,830;9,947,65;16,947,65;8,948;8,949;9,949,65;9,950,65;9,951,65;10,952,70,71,70,72,953;10,954,70,71,70,72,953;9,955,65;8,956,829,830;9,957,65;9,958,65;8,959;8,960;8,961,829,830;9,962,65;8,963,829,830;9,964,65;9,965,65;9,966,65;8,967,829,830;8,968;8,969,829,830;8,970;9,971,65;8,972;8,973,829,830;8,974,829,830;10,975,70,71,70,72,976;10,975,70,71,70,72,977;9,978,65;8,979,829,830;9,980,65;9,981,65;10,982,70,71,70,72,983;10,984,70,71,70,72,983;10,985,70,71,70,72,983;10,986,70,71,70,72,987;9,988,65;9,989,65;8,990;9,991,65;9,992,65;9,993,65;8,994,829,830;9,995,65;8,996,829,830;9,997,65;8,998,829,830;9,999,65;8,1000,829,830;9,1001,65;9,1002,65;8,1003;9,1004,65;11,1005,855;11,1006,855;11,1007,855;11,1008,855;11,1009,855;11,1010,855;11,1011,855;11,1012,855;11,1013,855;11,1014,855;11,1015,453;1,0,1016;8,1017;8,1018;16,1019,75;11,1020,1021;8,1022;11,1023,453;10,922,70,71,70,72,1024;8,1025;9,1026,65;8,1027;10,1028,1029,70,70,72,1030;10,1031,70,71,70,72,1030;10,1032,70,71,70,72,1030;10,1028,1029,70,70,72,1033;10,1031,70,71,70,72,1033;10,1032,70,71,70,72,1033;8,1034;8,1035;1,0,1036;8,1037;9,1038,65;8,1039;9,1040,65;16,1041,65;9,1042,65;9,1043,65;8,1044;16,1045,65;8,1046,829,830;11,1047,453;1,0,1048,61,1049;1,0,1050";

const $scriptletArglistRefs$ = /* 5118 */ "174;174;166;41;192;166;21,463;630,631,632,633,634,635;166;36,166;166;406;189;278;192,212,630,631,632,633,634,635;216;800,801;166,480;174,216;36;36;166;192,630,631,632,633,634,635;179;192;189;174;176;57;39,166,176;189,205;192,211;166;77;166;121;192;192,630,631,632,633,634,635;174;41;34;40;36,166;192;192;325;203;174;192;192;192,212,630,631,632,633,634,635;174;189;166;630,631,632,633,634,635;35;192,630,631,632,633,634,635;162;166;221;192;216;166;176;288;97;174;176;192;81;66,162;174;166;166;201;630,631,632,633,634,635;66,162;189;352;176;166;486;105;166;166;191,192;192,630,631,632,633,634,635;166;685;691;192;566;626;166;410;36;493;646;174;750;166,243;166;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192,630,631,632,633,634,635;166;2;174;174;174;162,192,212,630,631,632,633,634,635;189,210;258;189;192;174,376;762,763;469;174;192;628;192;201;162;192;192;4,639,691;276;192,630,631,632,633,634,635;166;435;113;671,672;337;166;831;174,216;191,192;192;565;52;36;36;189;151;192;291;166;406;174;162;192;785;192;192,630,631,632,633,634,635;192;192;166;475;475;753;201;180;166;166;166;192;221;192;192;174;716,717;380;192,630,631,632,633,634,635;189;164;545;745;166;210;192,630,631,632,633,634,635;642;178;192;168;608;718;166;166;192;192;166;26;166,174;166;166;192;178;166;166;728;166;192;192;493;166;166;166;284;68,162;166;166,243;166;168;630,631,632,633,634,635;166;189;191,192;593;52,166;303;192,630,631,632,633,634,635;174;166;166;36,52,174;192;46;52,166,174;166;166;166;189;192;192,630,631,632,633,634,635;192;186,189;749;36;166,178;257;166;166;166;192;166;192;568;568;166;468;221;761,763;166;166;192;166,174;166;166,174,177;166;174;221;166,178;630,631,632,633,634,635;166;166;166;440;205,630,631,632,633,634,635;192,630,631,632,633,634,635;166;192;192;192,630,631,632,633,634,635;108,109;559;320;646;192;646;166;166;192;166;698;333;192;166,174;126,166;685;176;406;221;113;337;216;216;166;192;166;166;192,630,631,632,633,634,635;216;216;166;216;210;192;166,174;91,166;397;174;174;166;166;106;113;224;191,192;646;5;174;166;166;174;456;174;131;192,630,631,632,633,634,635;182;166;166;91;254;192;630,631,632,633,634,635;81;192;192;192;192;521;166;731,732,733;174;383;166;166;192;50;739,740,741;752;166,174;185;192,630,631,632,633,634,635;192;166;192;189,262;192,630,631,632,633,634,635;543;386;192;192;166;166;166;222;30;432,433;166;36,52;189;201;263;698;630,631,632,633,634,635;221;178;630,631,632,633,634,635;192,630,631,632,633,634,635;630,631,632,633,634,635;201,630,631,632,633,634,635;802;162;449;166;192;166;192,630,631,632,633,634,635;36,166;166;166;607;189;192;192;192;630,631,632,633,634,635;192;543;554;36;166,178;166;36;192;36;166;192;166;805;192,630,631,632,633,634,635;793;794;795;630,631,632,633,634,635;221;174;43;166;106;166;166;192;192;166;354;106;106;135,136,137;85;166;166;225;802;166;429,430,431;115;406;322;176;166;166;324;122;234;645,671,672,673,675,676;162;602;126;178,390;390;166,243;106;192;192;82,83;166,174;166;166,288,368;166;106;106;192;166;166;166;192,630,631,632,633,634,635;192;36,174;216;166;166;106;192;825;554;148,149,150;192;106;106;162;192;107;186;192,630,631,632,633,634,635;439;514;288;-258;145;279;429,430,431;647;166;166;630,631,632,633,634,635;174;166;166;85;671,672,673;334,335;166;166;192;192;192;166;36;166;192,630,631,632,633,634,635;166;91;166;174;280;221;132,133;174;287;72,73,74;174;166;166,222;169;192;216;192;166;176;166;192;123;174;227;106;106;269;174;166,174;380;192;578;166;117;192;166;188;166;203;192;192;554;252;192;192;192;221;192;115;174;685;113;192;192;216;192,630,631,632,633,634,635;66,162;166;511;114;655,656,705,706;135,136,137;209,212;178;192;106;192;346;122;390;606;64;824;192;250,251;166;192;131;694;575,576;174;54;166;184;519;192,630,631,632,633,634,635;192;221;390;174;166;423;499;166;473;234;122,415,416;174;174;166;64;189;166;783,784;174;162;166;646;429,430,431;192,630,631,632,633,634,635;192;176;192;730;82,83;174;349;192;192;174;560;174;166;189;192;332;174;166;192,630,631,632,633,634,635;174;166;166;192;771;671,672;166;192;192;221;396;166;166;233;194,630,631,632,633,634,635;630,631,632,633,634,635;630,631,632,633,634,635;192,630,631,632,633,634,635;192,630,631,632,633,634,635;166;166;166;166;91;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192,630,631,632,633,634,635;131;170;166,185;135,136,137;222;166;91;166;174;746;746;166;98,99,100,101,102;64;166;224;174;191,192;319;192;192;367;574;166;192;52;429,430,431;554;192,630,631,632,633,634,635;174;91;166;166;56;219;192;192;189;381;329;62,329;791;114;176;630,631,632,633,634,635;178;192;192;340;192;208,209;162;549;166;490;166;189;289;91;174;32;174;56;192;189;192,630,631,632,633,634,635;125;36;166;166;192;192,630,631,632,633,634,635;221;267;651;166,174;91;91;2;91,117;221;166;166;192;176;166;166;192;630,631,632,633,634,635;166;319;395;166;174;189;829;174;192,630,631,632,633,634,635;192;192;520;210;192;63;166,178;166,174;166;166;117;166;166;182;122;189;234;166;39;296;38;69;36;166,243;615;166,243;110;192;166;166;82,83;50;166,480;178;192;115;115;189;192;174;201,630,631,632,633,634,635;192,630,631,632,633,634,635;450;174;414;166;166;189;166;205,630,631,632,633,634,635;178,286;166;166;106;36;91;166;646;166;216;166,174;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;216;189;192;319;147;207;174;166;189;443,444;166;398;192;429,430,431;429,430,431;429,430,431;429,430,431;192;166;166;221;166;646;294;192,630,631,632,633,634,635;191,192;166;166;192,630,631,632,633,634,635;174;499;191,192;166;192;174,176;174;192,630,631,632,633,634,635;192;192,630,631,632,633,634,635;192;152,153;192;409;22;505,826,827;535;192;91;126;75;36;258;166;166;192,630,631,632,633,634,635;189;166;36;166;174;166;126;192,630,631,632,633,634,635;210;369;189;268;185;192;166;166;166;630,631,632,633,634,635;182;115,330;189;189;166;627;52;107;166;192;291;189,710,711,712;162;802;38;192;192;192;538;166;802;166;109;192,630,631,632,633,634,635;174;192,630,631,632,633,634,635;113;166;166,174,480;192,630,631,632,633,634,635;106;192;166;789;189;166;271;166;192;166;115,117;166;91;630,631,632,633,634,635,683;189;192,630,631,632,633,634,635;192;166;192,201,630,631,632,633,634,635;216;192;192;166;585;192,630,631,632,633,634,635;554;417;166;828;166;191,192;174;255;191,192;44,45;802;244;166;192;166;168,178,581;176;174;166;219;36;36;192;584;630,631,632,633,634,635;192;192;191,192;166;166;166;192;192;192;201;166;532;192;192;166;550;775;445;192,630,631,632,633,634,635;192;166;192;192;166;52,166;378;554;813,814,815;174;36;583;166;192,630,631,632,633,634,635;119;192;146;166;192;221;222;166;221;221;166;630,631,632,633,634,635;230;192;260,261;113;203;191,192;166;205,630,631,632,633,634,635;831;192;192;591;91;192;166;192,630,631,632,633,634,635;75;192,630,631,632,633,634,635;221;192,630,631,632,633,634,635;189;166;192;164;751;166;166;166;390;647;166;390;192;166;192;222;336;192;192,630,631,632,633,634,635;364;802;166;166;174;287;166;664;91;91;192;166;115;36;166;174;176;166;166;166,178;174;451;166;166;329;192,630,631,632,633,634,635;192;192;554;166;645,671,672,675,676;166;166;508;630,631,632,633,634,635;189;340;36;166;522;166;166;166;192;38;14,15,16,17;192;166;174;166;192;166;19,20,181;192;191,192;166;241;192,630,631,632,633,634,635;189,688;390;192,630,631,632,633,634,635;189;166;189;166;166;192;166;727;174;166;647;525;174;174;671,672;192,630,631,632,633,634,635;272,273;166;192;166;166;5;118;148,149;178;178;166;122;192;166;178,556;166;192,630,631,632,633,634,635;114;174;166;166;166;462;166;115;115;166;192;166;166;192;189;174;166;166,178;166;554;178;487;166;615;615;36;166,174;166,176;59;192;192;67;166;192;630,631,632,633,634,635;297,298;192;162,163;192;685;192;192;191,192;413;114;42;5;166;36,176,483;164;192;192;192;612;192;653;166;192;192,630,631,632,633,634,635;166;36,52;-37;166;154;174;165;166;390;192,630,631,632,633,634,635;408;58,189,669;174;166;174;166;339;166;36;203;192;192;192;389;630,631,632,633,634,635;554;189;390;604;367;166;499;309,310,311,312,313;222,589;192;-258;192;436;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;558;476,477;174;-37;166;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;176;166;192;192;192,630,631,632,633,634,635;166;192;192;192;192;192;36,174;286;166;192;192;704;192;166;212;166,554;166;192;189;189;166;192,630,631,632,633,634,635;620;166;166;166,243;106;174;390;115,117;283;148,149;189;166;124;192;192,630,631,632,633,634,635;166;192;630,631,632,633,634,635;192;386;166;166;24;630,631,632,633,634,635;222;166;117;56;189;166;295;554;802;630,631,632,633,634,635;192;554;738;192;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;-37,-555,-832;192;424;192;596;192;119;191,192;174;115;174;554;192;166;113;192;192;192;390;189;189;164;166;189,210;174;166;464,465;192;176;192,630,631,632,633,634,635;166;216;613;76;189;554;138,139,140;216;54;551;405;630,631,632,633,634,635;86;166;670;390;166;193,630,631,632,633,634,635;192,630,631,632,633,634,635;131;212;113;91;192;689,690;327;166;513;291;192;192;36;234;166,174;174;166;166;174;192;174;174;192;166;192;286;407;166;234;164;192;543;166;192,630,631,632,633,634,635;192;509;192;24;174;646;192,630,631,632,633,634,635;61;192;192;189;192;361;192,630,631,632,633,634,635;503;174;390;221;166;166;333;36;166;92,93,94,95;114;166;166;192;781,782;192;384;192;554;426,427;192;192;166;390;38;192,630,631,632,633,634,635;192;192,630,631,632,633,634,635;166;166;56,166;388;192;166;192;166;192;166;358;192;166;221;166;192,630,631,632,633,634,635;597;582;192;192;192;166,174;385;259;166;192,630,631,632,633,634,635;192,630,631,632,633,634,635;166,178;192;192;91;192;24,166;166;192;540;636;166;567;192,630,631,632,633,634,635;191,192;192;166;192;192;189;300;111;440;166;647;166;115,117;192;189;192,630,631,632,633,634,635;192;27;166;192;91;192;166;806,807,808;630,631,632,633,634,635;166;192;174;192;192;189;580;474;192;192;191,192;166;192;176;174;174;166;166;174;786;192;192;174;779,780;192;84;192,630,631,632,633,634,635;192;52;192;192,630,631,632,633,634,635;192,208,209,212;192;192;166;192,630,631,632,633,634,635;484;192,630,631,632,633,634,635;166;24;192,630,631,632,633,634,635;166;174;189;754;192,202;672;166;31;352;192;189;290;192;192;174;192;221;166;166;352;166;647;647;166;166;390;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;630,631,632,633,634,635;201;166;87,88,89;192;192;192;192;192;192;192;192;606;192;166;192;208,209;192,630,631,632,633,634,635;174;189;500;191,192;192;174;543;543;543;192;192;192;626;192;192;192;189;192,630,631,632,633,634,635;166;166;166;189,671;166,698;189;106;192,630,631,632,633,634,635;192;617;91;191,192;419;86;647;162;390;189;529;321;174;682;192;192;219;178;166;166;557;166,178,243,487;112;166;189;192,630,631,632,633,634,635;168;168;192;166,178,243,487;372;114;192;403;331;734;192;817;122;688,773,774;594;166;186;166;166;192;192;758;408;414;414;414;174;174;186;166;182;166;201;192;192;192;115,166;191,192;265;166;191,192;166;192;38;429,430,431;192,630,631,632,633,634,635;192;624;85;166;178;174;166;166,174,480;174;192;192;698;192;614;164;192,630,631,632,633,634,635;166;625;168;192;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;192;192;647;647;166;192;647;622;306;166;340;192;192,630,631,632,633,634,635;166;49;192;174;192;166;174;166;174;192;192;166;192;189,190;192;192;192;166;36;192;166;715;53;192;554;189;628;192;166;166,243;191,192;243,487;166;116;166;192;166;221;459;166;50;91;428;91;315;269;191,192;192;192;192;189;192,212,630,631,632,633,634,635;166;192;533;630,631,632,633,634,635;191,192;192;291;192;176;166;192;192;317;189;192;166;189;330;626;107;192;802;222;117;696;38,318;189;737;192;166;192;192;488;91;166;238,239;554;192;189,563;114;626;192,630,631,632,633,634,635;460;192;192;191;205,630,631,632,633,634,635;192,630,631,632,633,634,635;189;52,174;192;192;328;371;107,166;166;429,430,431;192;688;164;166;192;36;192,630,631,632,633,634,635;192;107;685;192;192;118;166,174;802;166;721,722,723;192;192,630,631,632,633,634,635;166;192;464;464;192;192;216;91;166;191,192;447;222;554;192;192;787;91;387;143;406;166;222;192;630,631,632,633,634,635;192;192;192,630,631,632,633,634,635;537;174;36;162;166;268;221;166;577;630,631,632,633,634,635;166;166;192;192;541;166;192;192;192;192;192;282;166;166;390;504;166;554;275;627;156,157,158,159,160,161;166;166;600;192;192;205,630,631,632,633,634,635;192;192;192,630,631,632,633,634,635;192;192;192;445;510;166;192;192;192,630,631,632,633,634,635;192;192,212;114;192,630,631,632,633,634,635;174;628;221;226;221;38;166;302;166;192;192;199,630,631,632,633,634,635;166;810,811,812;192;192;287;189;174;192;192;189;192,630,631,632,633,634,635;767,768,769;314;192;166;166;221;192;166;343;98,99,100,101,102;203;192,630,631,632,633,634,635;668;192;192;504;360;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192,630,631,632,633,634,635;166;192,630,631,632,633,634,635;166;192;192,630,631,632,633,634,635;166;200,630,631,632,633,634,635;222;117;122;174;192,630,631,632,633,634,635;685;192;802;203;192;91;192,630,631,632,633,634,635;786;192,630,631,632,633,634,635;189;603;647;107;166;166;166;189;38;91;38,91;691,693;176;166;166;166;36;580;766;672;189;192;630,631,632,633,634,635;192;166;599;37,162;166;166;166;166;192;166;166;640,641;192;192;174;166;166;166;166;189;212;192;192;192;685;393;166;348;319;319;792;192,630,631,632,633,634,635;166,243;162;192,630,631,632,633,634,635;166;379;189;174;182;166;192;192;707;166;192;647;192;562;192;166;166;457,458;192,630,631,632,633,634,635;115;166;167;192;166;192;166;803;333;192;192;590;173;173;166,516;166;166;166;166;166;123;802;204,630,631,632,633,634,635;799;192,630,631,632,633,634,635;191,192;189;166;6,7,8,9,10,11,12,13;192;187;36,483;106;192;192;192;192;192;192;524;316;192,630,631,632,633,634,635;36,264;192;544;164;192;166;192;166;166;192,630,631,632,633,634,635;192;192,630,631,632,633,634,635;174;192;192;192;176;192;231;192;166,222;166;166;166;166;166;201;174;222;223;747,748;285;166,178;166;131;212;166;166;192;189;192;5;166;166,178;166;210;192;166,178,647;192;192;166;174;630,631,632,633,634,635;166;192;192;644;192;178;178;178;647;647;166;487;64,166;174;530;36;192;724;192;166;610;174;166,243;626;91;600;673;336;192;672;210;192;164;186;166;192;189;802;186;192;166;192;461;166;176;166;363;414;414;166;219;91;222;192;107;91;192;164;192;192;414;414;166;192,630,631,632,633,634,635;174;192;191,192;166;115,166;429,430,431;178,286;353;182;166;192;36;174;174;164;166;735,736;802;192;246,247;804;166;192,630,631,632,633,634,635;192;166;691,692;36;176;192;201;164;166;192;554;189,709;166;577;192;221;192;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;429,430,431;647;166;166;647;166;192;831;192;192;192;166;192;192;166;495;760;192;22;192;228;192;192;192;192;752;166;168;192,630,631,632,633,634,635;554;192,630,631,632,633,634,635;192;115;174;756,757;91,112;166,178;281;166;166;176;166;166;192;192;192;118;47,48;212;192;192;192;192;166;192;118;192;91;24,301;221;166;191,192;192;192;162;189,729;554;107;554;192;192;192;192;626;192;187;192,630,631,632,633,634,635;168;192;164;166,176;52,174;192;192;192;626;299;221;36,52,554;166;192;36,52;554;166;166;192;166;166;474;192;192;802;802;164;189;192,630,631,632,633,634,635;192;24;802;802;304,305;304,305;164;166;192;192;166;205,630,631,632,633,634,635;192;33;201,630,631,632,633,634,635;192;192;189;652;36,264;36,52,166,174,264;191,192;356;219;192;192;192;166;166;36;192;192;36;192;192;192;174;166;166,178;189;192;234;24,497,498;192;192;192;98,99,100,101,102;192;166;345;156,157,158,159,160,161;192;192;192;166;114;192;166;191,192;192;91;166;176;178;142;192;192;192;429,430,431;192;166;500;192;122;166;191,192;494;166;507;166,243;118;192;192;192;554;234;189;36;630,631,632,633,634,635;192;166,178;192;192;135,136,137;192;92,93,94,95;192;234;166,174;166;166;221;172;166;38;38;174;174;166,174;192;192;192;166;192;790;192;166,174;86;166;192;192;231;134;645,671,672,675,676,680;85;192;113;532;205,630,631,632,633,634,635;191,192;621;192,630,631,632,633,634,635;166;192,630,631,632,633,634,635;219;178;168;192;192;55;630,631,632,633,634,635;480;192;166,434;192;192,630,631,632,633,634,635;192;554;192;533;192;192;175;192,630,631,632,633,634,635;192;205,630,631,632,633,634,635;192;668;714;192;84;816;268;189;242;192;166,176;198;527;192;192;162;38;132,133;192;742,743,744;171;174;605;192;182;144;192;192;166;166;192;115;192;166;38;192;192,630,631,632,633,634,635;166;203;189;192,630,631,632,633,634,635;390;174;429,430,431;772;166;355;166;192;192,630,631,632,633,634,635;189,708;86;166;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;192;685;192;192;626;648,649,650;192;192;166,274;802;191,192;192;441;189;166;802;192;647;647;240;191,192;420;166;191,192;798;166;192;191,192;191,192;166;192;36;218;191,192;166;164;166;623;418;166;554;796;192;166;166;192;192;166;480,483;192;192;192;192;802;192,212;462;626;553;166;166;166;189;166;91;178;166;192;192;114;24;166;189;802;611;174;698;166;338;802;191,192;164;178;91;38;192;192;214;609;166;192;665,666;210;166;166,174;166;192;189;306;681,777,778;174;192;192;66;192;480;192;192;192;192;192;166;192;598;166;178;191,192;192;166;166;192;166;182;174;192;192;192;192;86;189;600;91;491;630,631,632,633,634,635;192;191,192;164;189;186;166;168;64;685;366;91;192;115;321;166;189;166;174;212;626;166;802;192;192;802;192;219;192;166;166;192;802;192;166;166;192;52;52,174;189;192;114;192;166;192;166;166;192;192;192,630,631,632,633,634,635;166;174,286;647;166;192;191,192;192;86;799;23;36;192,630,631,632,633,634,635;222;166;174;523;166;192;166;192;429,430,431;429,430,431;429,430,431;429,430,431;178;496;220;192;192;166;192;192;64;192;192;192;192;76,178;192;192;192;192;191,192;192;192;191,192;192;84;166;192;189;174,390;192,630,631,632,633,634,635;36;192;117;166;390;174;630,631,632,633,634,635;117;192;192,630,631,632,633,634,635;192;189;192;192;192;192;91;36;192;191,192;176;91;166;192;699,703;189;189;52;52;52;166;178;166;192;192;36;166;192;191,192;36;248;192;86;192;192;192;107;192;788;192;166;192;192;192,210,699;201,630,631,632,633,634,635;166;221;626;192;372;192;192;192;192;192;802;802;192;713;192;192;191,192;192;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;237;36;166;192;192;162;118;192;192;192;192;192;189;166;195,630,631,632,633,634,635;189;601;356;192;174;115;191,192;452,685;191,192;166;185;446;192;192,630,631,632,633,634,635;512;166;24,497,498;138,139,140;96;192,212;192,630,631,632,633,634,635;189;166;192;191,192;201;189;647;253;554;192,630,631,632,633,634,635;192,630,631,632,633,634,635;5;365;192;192;192,630,631,632,633,634,635;192;201;192;162;192;166;192,630,631,632,633,634,635;192;191,192;221;192;174;166;592;192;162;125;192;274;166;686,687,698;221;166;166;192;166;192;166;192;192;191,192;192;350;483;192;192;192;166;192;36;192;166;192;192;192;86;191,192;192,630,631,632,633,634,635;192;192;192;166;192;192;425;192,630,631,632,633,634,635;597;229;192,630,631,632,633,634,635;192;802;192,630,631,632,633,634,635;192;344;82,83;192,630,631,632,633,634,635;390;174;377;192;192;166;192;192;192;802;726;164;647;192;191,192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;36;192;192;206,630,631,632,633,634,635;192;802;192;189;192;64;600;192;168;36;217;166;166;117;326;554;166;192;802;192;205,630,631,632,633,634,635;192;192;178;191,192;192;166,174;174;166;191,192;390;802;192;192,630,631,632,633,634,635;462;189;192,630,631,632,633,634,635;107;647;647;192;192;536;166;166;174;192,630,631,632,633,634,635;166;192;189;129,130;166;192;802;166;398;192;192;192;192;192;192;192;166,222;192;166;192;398;36,52,554;192;192;192;343;192;107;166;192;192;462;630,631,632,633,634,635;341;192;192;36;192;192;192;36;543;192;192,630,631,632,633,634,635;85,182;504;192;192;192;36,166;192;452,685;166;166,168;405;192;192,630,631,632,633,634,635;191,192;192;192;630,631,632,633,634,635;189;36;821;192,630,631,632,633,634,635;192,630,631,632,633,634,635;166;455;630,631,632,633,634,635;36;192;52,166,174,243;192;189;192;166;192;221;85;192;192;192;166,243;166,243;192;192;166;192;192;166;421;192;166;308;192;802;166;802;166;201;36;36;185;485;351;626;166;192;219;114;192;166;192;213;166;418;52;192;212;192,630,631,632,633,634,635;192;166;192;192;192;192;192,630,631,632,633,634,635;577;192;192;166;333;647;164;162;192;192;802;85;390;166;554;164;809,-814,-815,-816;0,1;166;647;166;192;192;192,630,631,632,633,634,635;192;192;192;192;192;192;166,243;166,243;166;166;191,192;192;192;192;192;166,531;166;36,174;192;192;192;235,236;174;192;647;191,192;115;192;192;166;286;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;212;802;759;203;192;192;630,631,632,633,634,635;192;192;166;192;166;192;192;192;192;221;192;192;192;192;162;166;695;192;192;192;52;394;191,192;554;554;554;192;192;118;192;191,192;192;192;51;192;192;802;802;166;192;398;36;629;192;191,192;166;192;192;192;166;192;192;192;684;391;122;166;192;802;192;192;192;192;356;192;192;192;192;192;398;166;191,192;192;185;122;143;192;164;630,631,632,633,634,635;192;192,630,631,632,633,634,635;192;192;166;192,630,631,632,633,634,635;166;166;234;647;86;192;166;191,192;166;630,631,632,633,634,635;86;192;166;192;166;192;192;270;118;307;192;114;185;192;212;192;75;234;166;215;182;191,192;192;192;192;192;192,630,631,632,633,634,635;191,192;114;192,630,631,632,633,634,635;192;90;192;192;192;192;192;212,630,631,632,633,634,635;191,192;174;189;36,166;362;192;166;554;192;192;166,178;192;192,630,631,632,633,634,635;191,192;390;191,192;276;189;192,630,631,632,633,634,635;192;192;192,630,631,632,633,634,635;630,631,632,633,634,635;166;191,192;192;192;382;189;189;192;189;164;192;192;192,630,631,632,633,634,635;178;123;189;192;192;192,630,631,632,633,634,635;192;192;203;191,192;166;166;192;192;192;481,482;189;192;166;122;192;192;192;174;192;174,390;189,212;164;647;86;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;189;112;192;192;191,192;192;274;166;166;192;192,630,631,632,633,634,635;802;671,672;645,671,672;192;586;192;192;192;192;65;192;390;554;192;192;492;192;164;192;192,630,631,632,633,634,635;192;192,630,631,632,633,634,635;192;192;192;192;802;539;185;192;114;192;306;189;192;166;166;192;168;192;192;192;192;192;192;192;764,765;174;192;174;192;192;192,630,631,632,633,634,635;192;288;192;192;672,678,679;192,197,630,631,632,633,634,635;390;176;390;166;192;192;192;192;554;174;176;166;166;554;528;192;192;166,243;166;192,630,631,632,633,634,635;802;192,630,631,632,633,634,635;357;174,243;189;192;92,93,94,95;106;192;192;192;630,631,632,633,634,635;191,192;192;192;91;189;192,630,631,632,633,634,635;115;189;155;192;569,570;192;192;189;191;192;192;645,654,671,672,673;166;38;192;192;404;192;166;192;192;166;219;539;28,29;182,183;192;192;192;166;192;192;168;118;192;174;192;192;192;246,247;192;192;647;166;483;191,192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;630,631,632,633,634,635;192,630,631,632,633,634,635;277;192;192;429,430,431;192;192;192;192;36;189;647;554;192;191,192;166;192;166,243;166;802;192;191,192;192;191,192;286,454;191,192;786;192;192;118;192;192;191,192;192;192;120;192;191,192;78,79,80,81;91;222;164;222;166;192;166;185;192;755;192;191,192;192;189;192;192;166;192;506;189;192;192;192;579;36;191;192;192,630,631,632,633,634,635;802;192;192,212,630,631,632,633,634,635;191,192;483;191,192;630,631,632,633,634,635;36;192;106;192;192;802;802;141;192;191,192;192;166;166;192;587;129,130;192;123;192;192;191,192,201;630,631,632,633,634,635;192;192;192;192;36;192;166;818,819,820;542;192;192;166;118;192;370;770;626;201;192;253;166;437;174;192;189;189;191,192;192,630,631,632,633,634,635;166;192;192;166;192;192;192;191,192;174;192;192;192;192;192;192;192;234;123;192;166;192;166;210;166;176;120;192;174,501,502;501,502;501,502;86;51;189;192;189,192;201,630,631,632,633,634,635;192;192;192;192;192;192;192;125;192;192;192,630,631,632,633,634,635;328;192,630,631,632,633,634,635;166;166;192;192;166;392;189;36,483;192;192;517;174;185;192;166;192;164;192,630,631,632,633,634,635;192;638;203,630,631,632,633,634,635;189;192,212;166;166;189;192;192;192,630,631,632,633,634,635;192;208;192;192;192;192;671;166;192;192;192,630,631,632,633,634,635;52,174;630,631,632,633,634,635;546;192,630,631,632,633,634,635;192;192;192,630,631,632,633,634,635;192;340;192;166;192;65;166;192;168;192;192;802;802;192;92,93,94,95;191,192;554;192;192;166;192;36;192;164;36;192;166;164;166;166;192;118;192;192;201;402;166;174;192;192;192;191,192;166;192;802;191,192;192;36,52,554;192;192;166;630,631,632,633,634,635;192,212;554;192,630,631,632,633,634,635;166,243;86;192;232;554;192;114;166;166,174,243;483;166;166;554;166;176;671;192;192;115;192,630,631,632,633,634,635;189;390;192;192;192;192;186;192;192;192;166;191,192;189,192;135,136,137;192;630,631,632,633,634,635;186;448;802;802;166;191,192;192;166;192;106;189;192;192;166;192;192;186;118;192;63;192;38;399;442;192;572;162;192;192;192;192;174;390;192;186;174;191,192;191,192;166;191,192;809,-811,-812,-813;189;166;192;191,192;192;192;192;192;192;626;626;166,243;189;256;374,375;243;192;189;164;166;166;166;192;76;192;478;192;191,192;191,192;471,472;192,201;555;552;192;166;166;52;191,192;191,192;192;699;720;192;192;192;192;192;192;192;802;192;189;192;192;266;192;192;192;618,619;192;554;189;192;192;192;192;192;191,192;192;192;91;192;192;192,630,631,632,633,634,635;191,192;192;192;192;671;192;192;700,701,702;166;356;192;192;192;191,192;191,192;479;96;192;628;616;192;192;192;191,192;122;398;192;627;166;192;166;174;192;192;51;192;192;802;192;192;400;192;91,112;166;189;192;166;191,192;192;249;191,192;192;192;192;118;662,663;205;192;192;192;192;192,630,631,632,633,634,635;191,192;192;192,630,631,632,633,634,635;192;192;630,631,632,633,634,635;189;192;192,630,631,632,633,634,635;212;118;192,203,630,631,632,633,634,635;5;191,192;192;205,630,631,632,633,634,635;192;192;192;192;166;802;802;192;573;192;192;189;166;192;192;192;191,192;192;192;192;51;802;192,630,631,632,633,634,635;166;192;192;192;192;192;192;191,192;38;192;192;192;192;65;36;192;166;466,467;192;192;192;192;192;176;802;192;192;192;192;192;191,192;192,630,631,632,633,634,635;192;192;192,630,631,632,633,634,635;253;192;192;192;192;118;192;192;390;554;189;166;192;579;657,658;192;192;192;554;166,243;192;192;192;115;192;174,178,243;192;564;166;24;164;166;191,192;186;192;164;192;192;106;802;210;174;192;192;174;192;192;166;588;274;203;328;192;192;192;60;243,487;647;91;674;192;166;127,128;245,660,661,675,676,786;192;192;192;164;192;166,243;85;192;192,630,631,632,633,634,635;189;192;25;192;192;166;192;191,192;189;192;64;347;191,192;384;166;91;92,93,94,95;92,93,94,95;166;52;192;192;191,192;192;192;192;192;192;192;166;192;192,630,631,632,633,634,635;192;166,480;192;438;189;114;192;667;192;373;192;192;192;166;192;192;192;18,526;192;192;166;192;192;166;192;192;630,631,632,633,634,635;802;189;191,192;91;162;192;192;192;192;192,630,631,632,633,634,635;192;192;470;192;192;196,630,631,632,633,634,635;192;189;192,630,631,632,633,634,635;191,192;118;643;191,192;776;192;192;192;203;71;630,631,632,633,634,635;411;191,192;191,192;105;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;118;189;192;192;643;192,630,631,632,633,634,635;103,104;191,192;192,630,631,632,633,634,635;191,192;802;192;685;191,192;192;192;192;192;192;192,630,631,632,633,634,635;191;51;192;192;802;192;174;166;192;164;118;630,631,632,633,634,635;192;571;164;166;166;192;802;192;797;192,630,631,632,633,634,635;192,630,631,632,633,634,635;685;192;192;192;166;189;192;489;38;192;36,166;192;323;192;192;192;192,630,631,632,633,634,635;554;189;554;166,243;554;191,192;192;210;192;401;174;166,243,830;192;192;192;192;191,192;166;164;802;166;191,192;529;192;174;192;192;185;192;166;86;192;166;166;192,630,631,632,633,634,635;191,192;118;189;186;210;192;192;192;192;647;115;192;192;189;192;637,672;191,192;192;192;192;192;192;192;106;204,630,631,632,633,634,635;192;192;802;192;192;192;192;24;192;192;166;191,192;192,630,631,632,633,634,635;164;189,725;166;174;192;192;192,210;91;38;114;191,192;191,192;192;192;36;479;192;115;192,212;192;191,192;192;192;192,630,631,632,633,634,635;192;192;685;192;191,192;192;534;628;166;192;672,680;802;192;191,192;192;85;192;192;192;192;192;192;118;189;561;192;82,83;114;114;166;192;192;164;192;192;192;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192,201;192;518;192;192;192;192;191,192;192;192;192;192;192;192;192;166;192,630,631,632,633,634,635;192,630,631,632,633,634,635;192;802;192;192;172;192;192;671,672,719;166;192;422;191,192;192,630,631,632,633,634,635;192;192;192;64;191,192;192;205,630,631,632,633,634,635;192;192;554;189;192;685;106;174,176,292,293;166;118;166;192,630,631,632,633,634,635;174;191,192;192;186;192;192;24;164;191,192;186;675,676;554;118;390;166;192;166;186;186;192;192;191,192;192;192;166;802;192;192;189;164;192;802;192;192;192;192;189;117;192,212,630,631,632,633,634,635;192;192;191,192;115;166;192;402;192;192;174;70;192;192;291;189;192;192;192;182;192;192;192;192;700,701,702;802;192;191,192;390;164;802;192;192;192;192;192;191,192;191,192;192;166;192;192;554;192;192;192;166;192;802;192;192;192;192;192;191,192;802;192;554;192;192;412;453;192;166;192;192;174,243;92,93,94,95;192;164;164;802;192;802;192;192,630,631,632,633,634,635;186;802;192;192;96;164;192;166;802;192;192;36;166;192;554;584;191,192;166;192,201,630,631,632,633,634,635;685;166;191,192;192;192;192;384;164;697;626;191,192;191,192;192;192;82,83;192;166;630,631,632,633,634,635;192;192;174;166;192;550;191,192;114;434;192;192;166;192;192;191,192;192;192;191,192;192;192;191,192;802;192;192,630,631,632,633,634,635;166;3,515;164;65;166;192;802;192;192;192;191,192;675,676;135,136,137;192;164;192;554;192;192;192,630,631,632,633,634,635;166;166;189;192;192;192;166;191,192;192;192;192;192;802;630,631,632,633,634,635;192;677;164;166;191,192;191,192;192,630,631,632,633,634,635;166;166,359;547,548,822,823;117;192;192;191,192;189;191,192;192;182;159;191,192;172;192;192;192;191,192;626;802;166;166,243;92,93,94,95;191,192;186;191,192;192;192;174;192;192;192;191,192;192;802;802;192;192;192,212,630,631,632,633,634,635;222;192;192;192;164;628;192;192;191,192;262;192;192;191,192;192;192;192;166;192;166;192;65;189;802;192;192;192;191,192;189;192;626;191,192;192,630,631,632,633,634,635;164;191,192;191,192;626;192;192;174;166;595;118;191,192;189;192;192;192;659;192;192,212;192;164;192;192;192;192;192;65;192;191,192;802;191,192;189;114;192;192,630,631,632,633,634,635;166;185;802;164;24;166;210;192,630,631,632,633,634,635;192;114;166;554;166;186;192;166;186;191,192;115;168,178;192;189;192,630,631,632,633,634,635;192;192;192,630,631,632,633,634,635;166;578;192;166;342;192;166;114;192;189;192,212,630,631,632,633,634,635;189;191,192;166;166;189;182;166;174";

const $scriptletHostnames$ = /* 5118 */ ["s.to","ak.sv","g3g.*","hqq.*","my.is","ouo.*","th.gl","tz.de","u4m.*","yts.*","2ddl.*","4br.me","al.com","av01.*","bab.la","d-s.io","dev.to","dlhd.*","dood.*","ext.to","eztv.*","imx.to","j7p.jp","kaa.to","mmm.lt","nj.com","oii.io","oii.la","oko.sh","pahe.*","pep.ph","si.com","srt.am","t3n.de","tfp.is","tpi.li","tv3.lt","twn.hu","vido.*","waaw.*","web.de","yts.mx","1337x.*","3si.org","6mt.net","7xm.xyz","a-ha.io","adsh.cc","aina.lt","alfa.lt","babla.*","bflix.*","bgr.com","bhaai.*","bien.hu","bild.de","blog.jp","chip.de","clik.pw","cnxx.me","dict.cc","doods.*","elixx.*","ev01.to","fap.bar","fc-lc.*","filmy.*","fojik.*","g20.net","get2.in","giga.de","goku.sx","gomo.to","gotxx.*","hang.hu","jmty.jp","kino.de","last.fm","leak.sx","linkz.*","lulu.st","m9.news","mdn.lol","mexa.sh","mlsbd.*","moco.gg","moin.de","movi.pk","mrt.com","msn.com","mx6.com","pfps.gg","ping.gg","prbay.*","qiwi.gg","sanet.*","send.cm","sexu.tv","sflix.*","sky.pro","stape.*","tvply.*","tvtv.ca","tvtv.us","tyda.se","uns.bio","veev.to","vidoo.*","vudeo.*","vumoo.*","welt.de","wwd.com","xfile.*","15min.lt","250r.net","2embed.*","4game.ru","7mmtv.sx","9xflix.*","a5oc.com","adria.gg","akff.net","alkas.lt","alpin.de","b15u.com","bilis.lt","bing.com","blick.ch","blogo.jp","bokep.im","bombuj.*","cety.app","cnet.com","cybar.to","devlib.*","dlhd.*>>","dooood.*","dotgg.gg","ehmac.ca","emoji.gg","exeo.app","eztvx.to","f1box.me","fark.com","fastt.gg","feoa.net","file.org","findav.*","fir3.net","flixhq.*","focus.de","fz09.org","gala.com","game8.jp","golog.jp","gr86.org","gsxr.com","haho.moe","hidan.co","hidan.sh","hk01.com","hoyme.jp","hyhd.org","imgsen.*","imgsto.*","incest.*","infor.pl","javbee.*","jiji.com","k20a.org","kaido.to","katu.com","keran.co","km77.com","krem.com","kresy.pl","kwejk.pl","lared.cl","lat69.me","lejdd.fr","liblo.jp","lit.link","loadx.ws","mafab.hu","manwa.me","mgeko.cc","miro.com","mitly.us","mmsbee.*","msgo.com","mtbr.com","olweb.tv","ozap.com","pctnew.*","plyjam.*","plyvdo.*","pons.com","pornx.to","r18.best","racaty.*","redis.io","rintor.*","rs25.com","sb9t.com","send.now","shid4u.*","short.es","slut.mom","so1.asia","sport.de","sshhaa.*","strtpe.*","swzz.xyz","sxyprn.*","tasty.co","tmearn.*","tokfm.pl","tokon.gg","toono.in","tv247.us","udvl.com","ufret.jp","uqload.*","video.az","vidlox.*","vidsrc.*","vimm.net","vipbox.*","viprow.*","viral.wf","virpe.cc","w4hd.com","wcnc.com","wdwnt.jp","wfmz.com","whec.com","wimp.com","wpde.com","x1337x.*","xblog.tv","xcloud.*","xvip.lat","yabai.si","ytstv.me","zcar.com","zooqle.*","zx6r.com","1337x.fyi","1337x.pro","1stream.*","2024tv.ru","3minx.com","4game.com","4stream.*","5movies.*","600rr.net","7starhd.*","9xmovie.*","aagmaal.*","adcorto.*","adshort.*","ai18.pics","aiblog.tv","aikatu.jp","akuma.moe","anidl.org","aniplay.*","aniwave.*","ap7am.com","as-web.jp","atomohd.*","ats-v.org","ausrc.com","autoby.jp","aylink.co","azmen.com","azrom.net","babe8.net","bc4x4.com","beeg.porn","bigwarp.*","blkom.com","bmwlt.com","bokep.top","camhub.cc","casi3.xyz","cbrxx.com","ccurl.net","cdn1.site","chron.com","cinego.tv","cl1ca.com","cn-av.com","cutty.app","cybar.xyz","d000d.com","d0o0d.com","daddyhd.*","dippy.org","dixva.com","djmaza.my","dnevno.hr","do0od.com","do7go.com","doods.cam","doply.net","doviz.com","ducati.ms","dvdplay.*","dx-tv.com","dzapk.com","egybest.*","embedme.*","enjoy4k.*","eroxxx.us","erzar.xyz","exego.app","expres.cz","fabtcg.gg","fap18.net","faqwiki.*","faselhd.*","fc2db.com","file4go.*","finfang.*","fiuxy2.co","fmovies.*","fooak.com","forsal.pl","ftuapps.*","garota.cf","gayfor.us","ghior.com","globo.com","glock.pro","gloria.hr","gplinks.*","grapee.jp","gt350.org","gtr.co.uk","gunco.net","hanime.tv","hayhd.net","healf.com","hellnaw.*","hentai.tv","hitomi.la","hivflix.*","hkpro.com","hoca5.com","hpplus.jp","humbot.ai","hxfile.co","ibooks.to","idokep.hu","ifish.net","igfap.com","imboc.com","imgur.com","imihu.net","innal.top","inxxx.com","iwsti.com","iza.ne.jp","javcl.com","javmost.*","javsex.to","javup.org","jprime.jp","katfile.*","keepvid.*","kenitv.me","kens5.com","kezdo5.hu","kickass.*","kissjav.*","knowt.com","kr-av.com","krx18.com","lamire.jp","ldblog.jp","loawa.com","manta.com","mcall.com","messen.de","mielec.pl","milfnut.*","mini2.com","miniurl.*","minkou.jp","mixdrop.*","miztv.top","mkvcage.*","mlbbox.me","mlive.com","modhub.us","mp1st.com","mr2oc.com","mynet.com","nagca.com","naylo.top","nbabox.co","nbabox.me","nekopoi.*","new-fs.eu","nflbox.me","ngemu.com","nhlbox.me","nlegs.com","novas.net","ohjav.com","onual.com","palabr.as","pepper.it","pepper.pl","pepper.ru","picrew.me","pig69.com","pirlotv.*","pixhost.*","plylive.*","poqzn.xyz","pover.org","psarips.*","r32oc.com","raider.io","remaxhd.*","reymit.ir","rezst.xyz","rezsx.xyz","rfiql.com","rokni.xyz","safego.cc","safetxt.*","sbazar.cz","sbsun.com","scat.gold","seexh.com","seory.xyz","seulink.*","seznam.cz","sflix2.to","shahi4u.*","shorten.*","shrdsk.me","shrinke.*","sine5.dev","space.com","sport1.de","sporx.com","stfly.biz","strmup.to","strmup.ws","strtape.*","swgop.com","tbs.co.jp","tccoa.com","tech5s.co","tgo-tv.co","tojav.net","top16.net","torlock.*","tpayr.xyz","tryzt.xyz","ttora.com","tutele.sx","ucptt.com","upzur.com","usi32.com","v6z24.com","vidco.pro","vide0.net","vidz7.com","vinovo.to","vivuq.com","vn750.com","vogue.com","voodc.com","vplink.in","vtxoa.com","waezg.xyz","waezm.xyz","watson.de","wdwnt.com","wiour.com","woojr.com","woxikon.*","x86.co.kr","xbaaz.com","xcity.org","xcloud.eu","xdl.my.id","xenvn.com","xhbig.com","xtapes.me","xxx18.uno","yeshd.net","ygosu.com","ylink.bid","youdbox.*","ytmp3eu.*","z80ne.com","zdnet.com","zefoy.com","zerion.cc","zitss.xyz","1000rr.net","1130cc.com","1919a4.com","1bit.space","1stream.eu","1tamilmv.*","2chblog.jp","2umovies.*","3dmili.com","3hiidude.*","3kmovies.*","4kporn.xxx","555fap.com","5ghindi.in","720pflix.*","98zero.com","9hentai.so","9xmovies.*","acefile.co","adslink.pw","aether.mom","alfabb.com","all3do.com","allpar.com","animeyt.es","aniwave.uk","anroll.net","anyksta.lt","apcvpc.com","apkmody.io","ariase.com","ashrfd.xyz","ashrff.xyz","asiaon.top","atishmkv.*","atomixhq.*","bagi.co.in","basset.net","bmamag.com","boyfuck.me","btvplus.bg","bunshun.jp","buzter.xyz","c-span.org","cashurl.in","cboard.net","cbr250.com","cbr250.net","cdn256.xyz","cgtips.org","club3g.com","club4g.org","clubxb.com","cnpics.org","corral.net","crewus.net","crictime.*","ctpost.com","cutnet.net","cvrain.com","cztalk.com","d0000d.com","dareda.net","desired.de","desixx.net","dhtpre.com","dipsnp.com","disqus.com","djxmaza.in","dnevnik.hr","dojing.net","drweil.com","dshytb.com","ducati.org","dvdrev.com","e-sushi.fr","educ4m.com","edumail.su","eracast.cc","evropa2.cz","ex-500.com","exambd.net","f1stream.*","f650.co.uk","falpus.com","fandom.com","fapeza.com","faselhds.*","faucet.ovh","fbstream.*","fcsnew.net","fearmp4.ru","fesoku.net","ffcars.com","fikfok.net","filedot.to","filemoon.*","fileone.tv","filext.com","filiser.eu","film1k.com","filmi7.net","filmizle.*","filmweb.pl","filmyhit.*","filmywap.*","findporn.*","flatai.org","flickr.com","flixmaza.*","flo.com.tr","fmembed.cc","formel1.de","freeuse.me","fuck55.net","fullxh.com","fxstreet.*","fz07oc.com","fzmovies.*","g5club.net","galaxus.de","game5s.com","gdplayer.*","ghacks.net","gixxer.com","go2gbo.com","gocast.pro","goflix.sbs","gomovies.*","gostosa.cf","grunge.com","gunhub.com","hacoos.com","hdtoday.to","hesgoal.tv","heureka.cz","hianime.to","hitprn.com","hoca4u.com","hochi.news","hopper.com","hunker.com","huren.best","i4talk.com","i5talk.com","idol69.net","igay69.com","illink.net","imgsex.xyz","isgfrm.com","isplus.com","issuya.com","iusm.co.kr","j-cast.com","j-town.net","javboys.tv","javhay.net","javhun.com","javsek.net","jazbaat.in","jin115.com","jisaka.com","jnews1.com","joktop.com","jpvhub.com","jrants.com","jytechs.in","kaliscan.*","kaplog.com","kemiox.com","keralahd.*","kerapoxy.*","kimbino.bg","kimbino.ro","kimochi.tv","labgame.io","leeapk.com","leechall.*","lidovky.cz","linkshub.*","lorcana.gg","love4u.net","ls1gto.com","ls1lt1.com","m.4khd.com","magnetdl.*","masaporn.*","mdxers.org","megaup.net","megaxh.com","meltol.net","meteo60.fr","mhdsport.*","mhdtvmax.*","milfzr.com","mixdroop.*","mmacore.tv","mmtv01.xyz","model2.org","morels.com","motor1.com","movies4u.*","multiup.eu","multiup.io","mydealz.de","mydverse.*","myflixer.*","mykhel.com","mym-db.com","mytreg.com","namemc.com","narviks.nl","natalie.mu","neowin.net","nickles.de","njavtv.com","nocensor.*","nohost.one","nonixxx.cc","nordot.app","norton.com","nulleb.com","nuroflix.*","nvidia.com","nxbrew.com","nxbrew.net","nybass.com","nypost.com","ocsoku.com","odijob.com","ogladaj.in","on9.stream","onlyfams.*","opelgt.com","otakomu.jp","ovabee.com","paid4.link","paypal.com","pctfenix.*","plc247.com","plc4me.com","poophq.com","poplinks.*","porn4f.org","pornez.net","porntn.com","prius5.com","prmovies.*","proxybit.*","pxxbay.com","r8talk.com","raenonx.cc","rapbeh.net","rawinu.com","rediff.com","reshare.pm","rgeyyddl.*","rlfans.com","roblox.com","rssing.com","s2-log.com","sankei.com","sanspo.com","sbs.com.au","scribd.com","sekunde.lt","sexo5k.com","sgpics.net","shahed4u.*","shahid4u.*","shinden.pl","shortix.co","shorttey.*","shortzzy.*","showflix.*","shrinkme.*","silive.com","sinezy.org","smoner.com","soap2day.*","softonic.*","solewe.com","spiegel.de","sportshd.*","strcloud.*","streami.su","streamta.*","suaurl.com","supra6.com","sxnaar.com","teamos.xyz","tech8s.net","telerium.*","thedaddy.*","thefap.net","thevog.net","thumb8.net","thumb9.net","tiscali.cz","tlzone.net","tnmusic.in","tportal.hr","traicy.com","treasl.com","tubemate.*","turbobi.pw","tutelehd.*","tvglobe.me","tvline.com","upbaam.com","upmedia.mg","ups2up.fun","usagoals.*","ustream.to","vbnmll.com","vecloud.eu","veganab.co","vfxmed.com","vid123.net","vidorg.net","vidply.com","vipboxtv.*","vipnews.jp","vippers.jp","vtcafe.com","vvide0.com","wallup.net","wamgame.jp","weloma.art","weshare.is","wetter.com","woxikon.in","wwwsct.com","wzzm13.com","x-x-x.tube","x18hub.com","xanimu.com","xdtalk.com","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xrv.org.uk","xsober.com","xxgasm.com","xxpics.org","xxxmax.net","xxxmom.net","xxxxsx.com","yakkun.com","ygozone.gg","youjax.com","yts-subs.*","yutura.net","z12z0vla.*","zalukaj.io","zenless.gg","zpaste.net","zx-10r.net","11xmovies.*","123movies.*","2monkeys.jp","360tuna.com","373news.com","3800pro.com","3dsfree.org","460ford.com","9animetv.to","9to5mac.com","abs-cbn.com","abstream.to","adxtalk.com","aipebel.com","airevue.net","althub.club","anime4i.vip","anime4u.pro","animelek.me","animepahe.*","aqua2ch.net","artnews.com","asenshu.com","asiaflix.in","asianclub.*","asianplay.*","ask4movie.*","atravan.net","aucfree.com","autobild.de","automoto.it","awkward.com","azmath.info","babaktv.com","babybmw.net","beastvid.tv","beinmatch.*","bestnhl.com","bg-mania.jp","bi-girl.net","bitzite.com","blogher.com","blu-ray.com","blurayufr.*","bolighub.dk","bowfile.com","btcbitco.in","caitlin.top","camaros.net","camsrip.com","cbsnews.com","chefkoch.de","chicoer.com","cinedesi.in","civinfo.com","clubrsx.com","clubwrx.net","colnect.com","comohoy.com","courant.com","cpmlink.net","cpmlink.pro","crx7601.com","cuervotv.me","cults3d.com","cutlink.net","cutpaid.com","daddylive.*","daily.co.jp","dawenet.com","dbstalk.com","ddrmovies.*","dealabs.com","decider.com","deltabit.co","demonoid.is","desivdo.com","dexerto.com","diasoft.xyz","diudemy.com","divxtotal.*","djqunjab.in","dogdrip.net","dogtime.com","doorblog.jp","dootalk.com","downvod.com","dropgame.jp","ds2play.com","ds450hq.com","dsmtalk.com","dsvplay.com","dynamix.top","dziennik.pl","e2link.link","easybib.com","ebookbb.com","edikted.com","egygost.com","elliott.org","embedpk.net","emuenzen.de","endfield.gg","eporner.com","eptrail.com","eroasmr.com","erovoice.us","etaplius.lt","everia.club","fastpic.org","filecrypt.*","filemooon.*","filmisub.cc","findjav.com","flix-wave.*","flixrave.me","fnforum.net","fnjplay.xyz","fntimes.com","focusrs.org","focusst.org","fplzone.com","fsharetv.cc","fullymaza.*","g-porno.com","g8board.com","g8forum.com","gamewith.jp","gbatemp.net","get-to.link","ghbrisk.com","gigafile.nu","gm-volt.com","gocast2.com","godlike.com","goodcar.com","govtech.com","grasoku.com","gtrlife.com","gupload.xyz","haytalk.com","hellcat.org","hhkungfu.tv","hiphopa.net","history.com","hornpot.net","hoyolab.com","hurawatch.*","ianimes.one","idlixku.com","iklandb.com","imas-cg.net","impact24.us","impalas.net","in91vip.win","itopmusic.*","jaginfo.org","javball.com","javbobo.com","javleak.com","javring.com","javtele.net","javx357.com","jawapos.com","jelonka.com","jemsite.com","jetpunk.com","jixo.online","jjang0u.com","jocooks.com","jorpetz.com","jutarnji.hr","jxoplay.xyz","k-bikes.com","k3forum.com","kaliscan.io","karanpc.com","kboards.com","keeplinks.*","kidan-m.com","kiemlua.com","kijoden.com","kin8-av.com","kinmaweb.jp","kion546.com","kissasian.*","laposte.net","letocard.fr","lexpress.fr","linclik.com","linkebr.com","linkrex.net","livesnow.me","losporn.org","luluvdo.com","luluvid.com","luremaga.jp","m1xdrop.net","m5board.com","madouqu.com","mailgen.biz","mainichi.jp","mamastar.jp","manysex.com","marinij.com","masahub.com","masahub.net","maxstream.*","mediaset.es","messitv.net","metager.org","mhdsports.*","mhdstream.*","minif56.com","mirrorace.*","misterio.ro","mlbbite.net","mlbstream.*","moonembed.*","mostream.us","movgotv.net","movieplex.*","movies123.*","mp4moviez.*","mrbenne.com","mrskin.live","mrunblock.*","multiup.org","muragon.com","mx5life.com","mx5nutz.com","nbabox.co>>","nbastream.*","nbcnews.com","netfapx.com","netfuck.net","netplayz.ru","netzwelt.de","news.com.au","newscon.org","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nicesss.com","ninjah2.org","nodo313.net","nontonx.com","noreast.com","novelup.top","nowmetv.net","nsfwr34.com","odyclub.com","okanime.xyz","omuzaani.me","onefora.com","onepiece.gg","onifile.com","optraco.top","orusoku.com","pagesix.com","papahd.info","pashplus.jp","patheos.com","payskip.org","pcbolsa.com","peeplink.in","pelisplus.*","pigeons.biz","piratebay.*","pixabay.com","pkspeed.net","pmvzone.com","pornkino.cc","pornoxo.com","poscitech.*","primewire.*","purewow.com","quefaire.be","quizlet.com","ragnaru.net","ranking.net","rapload.org","retrotv.org","rl6mans.com","rsgamer.app","rslinks.net","rubystm.com","rubyvid.com","sadisflix.*","safetxt.net","sailnet.com","samax63.lol","savefiles.*","scatfap.com","scribens.fr","serial4.com","shaheed4u.*","shahid4u1.*","shahid4uu.*","shaid4u.day","sharing.wtf","shavetape.*","shinbhu.net","shinchu.net","shortearn.*","sigtalk.com","smplace.com","songsio.com","speakev.com","sport-fm.gr","sportcast.*","sporttuna.*","starblog.tv","starmusiq.*","sterham.net","stmruby.com","strcloud.in","streamcdn.*","streamed.pk","streamed.st","streamed.su","streamhub.*","strikeout.*","subdivx.com","svrider.com","syosetu.com","t-online.de","tabooflix.*","talkesg.com","tbsradio.jp","teachoo.com","techguy.org","teltarif.de","teryxhq.com","thehour.com","thektog.org","thenewx.org","tidymom.net","tikmate.app","tinys.click","tnaflix.com","toolxox.com","toonanime.*","topembed.pw","toptenz.net","trifive.com","trx250r.net","trx450r.org","tryigit.dev","tsxclub.com","tube188.com","tumanga.net","tundra3.com","tunebat.com","turbovid.me","tvableon.me","twitter.com","ufcstream.*","up4load.com","uploadrar.*","upornia.com","upstream.to","ustream.pro","uwakich.com","uyeshare.cc","variety.com","vegamovie.*","vexmoviex.*","vidcloud9.*","vidclouds.*","vidello.net","vipleague.*","vipstand.pm","viva100.com","vtxcafe.com","vwforum.com","vwscout.org","vxetable.cn","w.grapps.me","wavewalt.me","weather.com","webmaal.cfd","webtoon.xyz","westmanga.*","wincest.xyz","wishflix.cc","www.chip.de","x-x-x.video","x7forum.com","xcloud.host","xdforum.com","xfreehd.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmalay1.net","xnxxcom.xyz","yesmovies.*","youtube.com","yumeost.net","yxztalk.com","zagreb.info","zch-vip.com","zonatmo.com","123-movies.*","1911talk.com","3dshoots.com","46matome.net","4archive.org","4btswaps.com","50states.com","68forums.com","700rifle.com","718forum.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8thcivic.com","992forum.com","aamulehti.fi","acrforum.com","adricami.com","akinator.com","alexsports.*","alexsportz.*","allcoast.com","allmovie.com","allmusic.com","allplayer.tk","anihatsu.com","animefire.io","animesanka.*","animixplay.*","antiadtape.*","antonimos.de","api.webs.moe","apkship.shop","appsbull.com","appsmodz.com","arolinks.com","artforum.com","askim-bg.com","atglinks.com","audiforum.us","autoc-one.jp","avseesee.com","avsforum.com","bamgosu.site","bapetalk.com","bemyhole.com","birdurls.com","bitsearch.to","blackmod.net","blogmura.com","bokepindoh.*","bokepnya.com","bookszone.in","brawlify.com","brobible.com","brupload.net","btcbunch.com","btvsports.my","buffzone.com","buzzfeed.com","bzforums.com","capoplay.net","carparts.com","catfish1.com","catforum.com","cesoirtv.com","chaos2ch.com","chatango.com","cheftalk.com","choralia.net","chrforums.uk","clickapi.net","cobaltss.com","coingraph.us","cookierun.gg","crazyblog.in","crewbase.net","cricstream.*","cricwatch.io","crzforum.com","cuevana3.fan","cutyurls.com","cx30talk.com","cx3forum.com","d-series.org","daddylive1.*","dailydot.com","dailykos.com","dailylol.com","datawav.club","deadline.com","divicast.com","divxtotal1.*","dizikral.com","dogforum.com","dokoembed.pw","donbalon.com","doodskin.lat","doodstream.*","doubtnut.com","doujindesu.*","dpreview.com","dropbang.net","dropgalaxy.*","ds2video.com","dutchycorp.*","eatcells.com","ecamrips.com","edaily.co.kr","edukaroo.com","egyanime.com","engadget.com","esportivos.*","estrenosgo.*","etoday.co.kr","ev-times.com","evernia.site","exceljet.net","exe-urls.com","expertvn.com","f6cforum.com","factable.com","falatron.com","fapptime.com","feed2all.org","fetchpik.com","fiestast.net","fiestast.org","filecrypt.cc","filmizletv.*","filmyzilla.*","flexyhit.com","flickzap.com","flizmovies.*","fmoonembed.*","focaljet.com","focus4ca.com","footybite.to","fordtough.ca","freeproxy.io","freeride.com","freeroms.com","freewsad.com","fullboys.com","fullhdfilm.*","funnyand.com","futabanet.jp","game4you.top","gaysex69.net","gekiyaku.com","gencoupe.com","genelify.com","gerbeaud.com","getcopy.link","godzcast.com","gofucker.com","golf-live.at","gosexpod.com","gsxs1000.org","gtoforum.com","gulflive.com","gvforums.com","haafedk2.com","hacchaka.net","handirect.fr","hdmovies23.*","hdstream.one","hentai4f.com","hentais.tube","hentaitk.net","hes-goals.io","hikaritv.xyz","hiperdex.com","hipsonyc.com","hm4tech.info","hoodsite.com","hotmama.live","hrvforum.com","huntress.com","hvacsite.com","ibelieve.com","ibsgroup.org","ihdstreams.*","imagefap.com","impreza5.com","impreza6.com","incestflix.*","instream.pro","intro-hd.net","itainews.com","ixforums.com","jablickar.cz","jav-coco.com","javporn.best","javtiful.com","jenismac.com","jikayosha.jp","jiofiles.org","jkowners.com","jp-films.com","k5owners.com","kasiporn.com","kazefuri.net","kfx450hq.com","kimochi.info","kin8-jav.com","kinemania.tv","kitizawa.com","kkscript.com","klouderr.com","klrforum.com","krxforum.com","ktmatvhq.com","kunmanga.com","kuponigo.com","kusonime.com","kwithsub.com","kyousoku.net","lacuarta.com","latinblog.tv","lawnsite.com","layitlow.com","learnmany.in","legacygt.org","legendas.dev","legendei.net","lessdebt.com","lewdgames.to","linkedin.com","linkshorts.*","live4all.net","livedoor.biz","lostsword.gg","ltr450hq.com","luluvdoo.com","lxforums.com","m14forum.com","macworld.com","mafiatown.pl","mamahawa.com","mangafire.to","mangaweb.xyz","mangoporn.co","mangovideo.*","maqal360.com","masscops.com","masslive.com","matacoco.com","mbeqclub.com","mediaite.com","mega-mkv.com","mg-rover.org","mhdtvworld.*","migweb.co.uk","milfmoza.com","mirror.co.uk","missyusa.com","mixiporn.fun","mkcforum.com","mkvcinemas.*","mkzforum.com","mmaforum.com","mmamania.com","mmsbee42.com","modrinth.com","modsbase.com","modsfire.com","momsdish.com","moredesi.com","motor-fan.jp","moviedokan.*","moviekids.tv","moviesda9.co","moviesflix.*","moviesmeta.*","moviespapa.*","movieweb.com","mvagusta.net","myaudiq5.com","myflixerz.to","mykitsch.com","mytiguan.com","nanolinks.in","nbadraft.net","ncangler.com","neodrive.xyz","neowners.com","netatama.net","newatlas.com","newninja.com","newsyou.info","neymartv.net","niketalk.com","nontongo.win","norisoku.com","novelpdf.xyz","novsport.com","npb-news.com","nzbstars.com","o2tvseries.*","observer.com","oilprice.com","oricon.co.jp","otherweb.com","ovagames.com","pandadoc.com","paste.bin.sx","paw-talk.net","pennlive.com","photopea.com","pigforum.com","planet-9.com","playertv.net","plowsite.com","porn-pig.com","porndish.com","pornfits.com","pornleaks.in","pornobr.club","pornwatch.ws","pornwish.org","pornxbit.com","pornxday.com","poscitechs.*","powerpyx.com","pptvhd36.com","prcforum.com","pressian.com","programme.tv","pubfilmz.com","publicearn.*","pwcforum.com","qyiforum.com","r1-forum.com","r1200gs.info","r2forums.com","r6-forum.com","r7forums.com","r9riders.com","rainmail.xyz","ramrebel.org","rapelust.com","ratforum.com","razzball.com","recosoku.com","redecanais.*","reelmama.com","regenzi.site","riftbound.gg","rlxforum.com","ronaldo7.pro","rustorka.com","rustorka.net","rustorka.top","rvtrader.com","rxforums.com","rxtuners.com","ryaktive.com","rzforums.com","s10forum.com","saablink.net","sbnation.com","scribens.com","seirsanduk.*","sexgay18.com","shahee4u.cam","sheknows.com","shemale6.com","sidereel.com","sinonimos.de","slashdot.org","slkworld.com","snapinsta.to","snlookup.com","snowbreak.gg","sonixgvn.net","spatsify.com","speedporn.pw","spielfilm.de","sportea.link","sportico.com","sportnews.to","sportshub.to","sportskart.*","spreaker.com","ssforums.com","stayglam.com","stbturbo.xyz","stream18.net","stream25.xyz","streambee.to","streamhls.to","streamtape.*","sugarona.com","swiftload.io","syracuse.com","szamoldki.hu","tabooporn.tv","tabootube.to","talkford.com","tapepops.com","tchatche.com","techawaaz.in","techdico.com","teleclub.xyz","teluguflix.*","terra.com.br","texas4x4.org","thehindu.com","themezon.net","theverge.com","toonhub4u.me","topdrama.net","topspeed.com","torrage.info","torrents.vip","tradtalk.com","trailvoy.com","trendyol.com","tucinehd.com","turbobif.com","turbobit.net","turbobits.cc","tusfiles.com","tutlehd4.com","tutsnode.org","tv247us.live","tvappapk.com","tvpclive.com","tvtropes.org","twospoke.com","uk-audis.net","uk-mkivs.net","ultraten.net","umamusume.gg","unblocked.id","unblocknow.*","unefemme.net","uploadbuzz.*","uptodown.com","userupload.*","valuexh.life","vault76.info","veloster.org","vertigis.com","vi-music.app","videowood.tv","videq.stream","vidsaver.net","vidtapes.com","volokit2.com","vpcxz19p.xyz","vwidtalk.com","vwvortex.com","watchporn.to","wattedoen.be","webcamera.pl","westword.com","winfuture.de","wqstreams.tk","www.google.*","x-video.tube","xcrforum.com","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xlrforum.com","xmowners.com","xopenload.me","xopenload.pw","xpornium.net","xtratime.org","xxxstream.me","youboxtv.com","youpouch.com","youswear.com","yunjiema.top","z06vette.com","zakzak.co.jp","zerocoin.top","zootube1.com","zrvforum.com","zvision.link","zxforums.com","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","124spider.org","1911forum.com","1bitspace.com","200forums.com","247sports.com","350z-tech.com","355nation.net","4c-forums.com","4horlover.com","4kwebplay.xyz","4xeforums.com","560pmovie.com","680thefan.com","6hiidude.gold","6thgenram.com","7fractals.icu","abc17news.com","abhijith.page","aceforums.net","actusports.eu","adblocktape.*","addapinch.com","advertape.net","aeblender.com","aiimgvlog.fun","alexsportss.*","alfaowner.com","anhsexjav.xyz","anime-jav.com","animeunity.to","aotonline.org","apex2nova.com","apkdelisi.net","apkmirror.com","appkamods.com","artribune.com","asiaontop.com","askpython.com","atchuseek.com","atv-forum.com","atvtrader.com","audiomack.com","autofrage.net","avcrempie.com","b15sentra.net","bacasitus.com","badmouth1.com","bakedbree.com","bcaquaria.com","beatsnoop.com","beesource.com","beinmatch.fit","belowporn.com","benzforum.com","benzworld.org","bestfonts.pro","bethcakes.com","bettafish.com","bikinbayi.com","billboard.com","bitcosite.com","bitdomain.biz","bitsmagic.fun","bluetraxx.com","bocopreps.com","bokepindo13.*","bokugents.com","boundless.com","bravedown.com","briefeguru.de","briefly.co.za","buelltalk.com","buffstreams.*","c10trucks.com","caferacer.net","callofwar.com","camdigest.com","camgirls.casa","canlikolik.my","capo6play.com","carscoops.com","cbssports.com","cccam4sat.com","cefirates.com","chanto.jp.net","cheater.ninja","chevelles.com","chevybolt.org","chumplady.com","cinema.com.my","cinetrafic.fr","cleveland.com","cloudvideo.tv","club700xx.com","clubtitan.org","codec.kyiv.ua","codelivly.com","coin-free.com","coins100s.fun","colourxh.site","coltforum.com","columbian.com","concomber.com","coolcast2.com","corsa-c.co.uk","cricstream.me","cruciverba.it","cruzetalk.com","crypto4yu.com","ctinsider.com","cx70forum.com","cx90forum.com","cxissuegk.com","daddylivehd.*","dailynews.com","darkmahou.org","darntough.com","daveockop.com","dayspedia.com","depvailon.com","dfwstangs.net","dizikral1.pro","dizikral2.pro","dodgetalk.com","dogforums.com","dooodster.com","downfile.site","dphunters.mom","dragonball.gg","dragontea.ink","drivenime.com","e2link.link>>","elantraxd.com","eldingweb.com","elevenlabs.io","embdproxy.xyz","embedwish.com","encurtads.net","encurtalink.*","eplayer.click","erothots1.com","ethearmed.com","etoland.co.kr","evotuners.net","ex90forum.com","exawarosu.net","exploader.net","extramovies.*","extrem-down.*","fanfiktion.de","fastreams.com","fastupload.io","fc2ppv.stream","fenixsite.net","fileszero.com","filmibeat.com","filmnudes.com","filthy.family","fjcforums.com","fjrowners.com","flixhouse.com","flyfaucet.com","flyfishbc.com","fmachines.com","focusrsoc.com","focusstoc.com","fordgt500.com","freebie-ac.jp","freeomovie.to","freeshot.live","fromwatch.com","fsiblog3.club","fsicomics.com","fsportshd.xyz","funker530.com","furucombo.app","gamesmain.xyz","gamingguru.fr","gamovideo.com","geekchamp.com","geoguessr.com","gifu-np.co.jp","giornalone.it","glaowners.com","glcforums.com","globalrph.com","glocktalk.com","golfforum.com","gopitbull.com","governing.com","gputrends.net","grantorrent.*","gromforum.com","gunboards.com","gundamlog.com","gunforums.net","gutefrage.net","h-donghua.com","hb-nippon.com","hdfungamezz.*","helpmonks.com","hentaipig.com","hentaivost.fr","hentaixnx.com","hesgoal-tv.io","hexupload.net","hilites.today","hispasexy.org","hobbytalk.com","hondagrom.net","honkailab.com","hornylips.com","hoyoverse.com","huntingpa.com","hvac-talk.com","hwbusters.com","ibtimes.co.in","igg-games.com","ikonforum.com","ilxforums.com","indiewire.com","inutomo11.com","investing.com","ipalibrary.me","iq-forums.com","itdmusics.com","itunesfre.com","javsunday.com","jeepforum.com","jimdofree.com","jisakuhibi.jp","jobzhub.store","joongdo.co.kr","judgehype.com","justwatch.com","k900forum.com","kahrforum.com","kamababa.desi","khoaiphim.com","kijyokatu.com","kijyomita.com","kirarafan.com","kolnovel.site","kotaro269.com","krussdomi.com","ktmforums.com","kurashiru.com","lek-manga.net","lifehacker.jp","likemanga.ink","listar-mc.net","livecamrips.*","livecricket.*","livedoor.blog","lmtonline.com","lotustalk.com","lowellsun.com","m.inven.co.kr","macheclub.com","madaradex.org","majikichi.com","makeuseof.com","malaymail.com","mandatory.com","mangacrab.org","mangoporn.net","manofadan.com","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","melangery.com","metin2hub.com","mhdsportstv.*","mhdtvsports.*","microsoft.com","minoplres.xyz","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mlbstreams.ai","mmsmasala.com","mobalytics.gg","mobygames.com","momtastic.com","mothering.com","motor-talk.de","motorgeek.com","moutogami.com","moviekhhd.biz","moviepilot.de","moviesleech.*","moviesverse.*","movieswbb.com","moviezwaphd.*","mp-pistol.com","mp4upload.com","multicanais.*","musescore.com","mx30forum.com","myfastgti.com","myflixertv.to","myonvideo.com","myvidplay.com","myyouporn.com","mzansifun.com","nbcsports.com","neoseeker.com","newbeetle.org","newcelica.org","newcougar.org","newstimes.com","nexusmods.com","nflstreams.me","nft-media.net","nicomanga.com","nihonkuni.com","nl.pepper.com","nmb48-mtm.com","noblocktape.*","nordbayern.de","nouvelobs.com","novamovie.net","novelhall.com","nsjonline.com","o2tvseriesz.*","odiadance.com","onplustv.live","operawire.com","overclock.net","ozlosleep.com","pagalworld.cc","painttalk.com","pandamovie.in","patrol4x4.com","pc-builds.com","pearforum.com","peliculas24.*","pelisflix20.*","perchance.org","petitfute.com","phineypet.com","picdollar.com","pillowcase.su","piloteers.org","pinkueiga.net","pirate4x4.com","pirateiro.com","pitchfork.com","pkbiosfix.com","planet4x4.net","pnwriders.com","porn4fans.com","pornblade.com","pornfelix.com","pornhoarder.*","pornobr.ninja","pornofaps.com","pornoflux.com","pornredit.com","poseyoung.com","posterify.net","pottsmerc.com","pravda.com.ua","proboards.com","profitline.hu","ptcgpocket.gg","puckermom.com","punanihub.com","pvpoke-re.com","pwctrader.com","pwinsider.com","qqwebplay.xyz","quesignifi.ca","r125forum.com","r3-forums.com","ramforumz.com","rarethief.com","raskakcija.lt","rav4world.com","read.amazon.*","redketchup.io","references.be","reliabletv.me","respublika.lt","reviewdiv.com","reviveusa.com","rhinotalk.net","rnbxclusive.*","roadglide.org","rockdilla.com","rojadirecta.*","roleplayer.me","rootzwiki.com","rostercon.com","roystream.com","rswarrior.com","rugertalk.com","rzrforums.net","s3embtaku.pro","saabscene.com","saboroso.blog","sarforums.com","savefiles.com","scatkings.com","sexdicted.com","sexiezpix.com","shahed-4u.day","shahhid4u.cam","sharemods.com","sharkfish.xyz","shemaleup.net","shipin188.com","shoebacca.com","shorttrick.in","silverblog.tv","silverpic.com","simana.online","sinemalar.com","sinsitio.site","skymovieshd.*","slotforum.com","smartworld.it","snackfora.com","snapwordz.com","socceron.name","socialblog.tv","softarchive.*","songfacts.com","sparktalk.com","speedporn.net","speedwake.com","speypages.com","sportbar.live","sportshub.fan","sportsrec.com","sporttunatv.*","sr20forum.com","srtforums.com","starstyle.com","steyrclub.com","strcloud.club","strcloud.site","streampoi.com","streamporn.li","streamporn.pw","streamsport.*","streamta.site","streamvid.net","sulleiman.com","sumax43.autos","sushiscan.net","sv-portal.com","swissotel.com","t-goforum.com","taboosex.club","talksport.com","tamilarasan.*","tapenoads.com","tapmyback.com","techacode.com","techbloat.com","techradar.com","tempinbox.xyz","tennspeed.net","thekitchn.com","thelayoff.com","themgzr.co.uk","thepoke.co.uk","thethings.com","thothub.today","tidalfish.com","tiermaker.com","timescall.com","timesnews.net","titantalk.com","tlnovelas.net","tlxforums.com","tokopedia.com","tokyocafe.org","topcinema.cam","torrentz2eu.*","totalcsgo.com","tourbobit.com","tourbobit.net","tpb-proxy.xyz","trailerhg.xyz","trangchu.news","transflix.net","traxforum.com","tremamnon.com","trigonevo.com","trilltrill.jp","truthlion.com","trxforums.com","ttforum.co.uk","turbobeet.net","turbobita.net","turksub24.net","tweaktown.com","twstalker.com","ukcorsa-d.com","umamigirl.com","unblockweb.me","uniqueten.net","unlockxh4.com","up4stream.com","uploadboy.com","varnascan.xyz","vegamoviies.*","velostern.com","vibestreams.*","vid-guard.com","vidspeeds.com","vitamiiin.com","vladrustov.sx","vnexpress.net","voicenews.com","volkszone.com","vosfemmes.com","vpnmentor.com","vstorrent.org","vtubernews.jp","vweosclub.com","watchseries.*","web.skype.com","webcamrips.to","webxzplay.cfd","winbuzzer.com","wisevoter.com","wltreport.com","wolverdon.fun","wordhippo.com","worldsports.*","worldstar.com","wowstreams.co","wstream.cloud","xc40forum.com","xcamcovid.com","xfforum.co.uk","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xopenload.net","xxvideoss.org","xxxfree.watch","xxxscenes.net","xxxxvideo.uno","zdxowners.com","zorroplay.xyz","zotyezone.com","zx4rforum.com","123easy4me.com","123movieshub.*","300cforums.com","300cforumz.com","3dporndude.com","3rooodnews.net","4gamers.com.tw","7thmustang.com","9to5google.com","a1-forum.co.uk","actu.orange.fr","actugaming.net","acuraworld.com","aerotrader.com","afeelachat.com","aihumanizer.ai","ak47sports.com","akaihentai.com","akb48glabo.com","alexsports.*>>","alfalfalfa.com","allcorsa.co.uk","allcryptoz.net","allmovieshub.*","allrecipes.com","amanguides.com","amateurblog.tv","androidacy.com","animeblkom.net","animefire.plus","animesaturn.cx","animespire.net","anymoviess.xyz","ar15forums.com","arcticchat.com","armslocker.com","artoffocas.com","ashemaletube.*","astro-seek.com","at4xowners.com","atchfreeks.com","atvtorture.com","azbasszone.com","balkanteka.net","bersaforum.com","bhugolinfo.com","bimmerfest.com","bingotingo.com","bitcotasks.com","blackwidof.org","blizzpaste.com","bluearchive.gg","bmw-driver.net","bmwevforum.com","boersennews.de","boredpanda.com","brainknock.net","btcsatoshi.net","btvsports.my>>","buceesfans.com","buchstaben.com","burgmanusa.com","camarozone.com","camberlion.com","can-amtalk.com","cheatsheet.com","choco0202.work","cine-calidad.*","cl500forum.com","clashdaily.com","clicknupload.*","cloudvideotv.*","clubarmada.com","clubsearay.com","clubxterra.org","comicleaks.com","coolrom.com.au","cosplay18.pics","cracksports.me","crespomods.com","cretaforum.com","cricstreams.re","cricwatch.io>>","crisanimex.com","crunchyscan.fr","ctsvowners.com","cuevana3hd.com","cumception.com","curseforge.com","cx500forum.com","cx50forums.com","dailylocal.com","dailypress.com","dailysurge.com","dailyvoice.com","danseisama.com","dealsforum.com","deckbandit.com","delcotimes.com","denverpost.com","derstandard.at","derstandard.de","designbump.com","desiremovies.*","digitalhome.ca","dodge-dart.org","dofusports.xyz","dolldivine.com","dpselfhelp.com","dragonnest.com","dramabeans.com","ecranlarge.com","eigachannel.jp","eldiariony.com","elotrolado.net","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","epaceforum.com","erayforums.com","esportbike.com","estrenosflix.*","estrenosflux.*","eurekaddl.baby","evoxforums.com","expatforum.com","extreme-down.*","f-typeclub.com","f150forumz.com","f800riders.org","faselhdwatch.*","faucethero.com","femdom-joi.com","femestella.com","fiestastoc.com","filmizleplus.*","filmy4waps.org","fireblades.org","fishforums.com","fiskerbuzz.com","fitdynamos.com","fixthecfaa.com","flostreams.xyz","fm.sekkaku.net","foodtechnos.in","fordescape.org","fordforums.com","fordranger.net","forex-trnd.com","formyanime.com","forteturbo.org","forumchat.club","foxyfolksy.com","fpaceforum.com","freepasses.org","freetvsports.*","fstream365.com","fuckflix.click","fuckingfast.co","furyforums.com","fz-10forum.com","g310rforum.com","galleryxh.site","gamefishin.com","gamepcfull.com","gameshop4u.com","gamingfora.com","gayforfans.com","gaypornhot.com","gearpatrol.com","gecmisi.com.tr","gemstreams.com","getfiles.co.uk","gettapeads.com","gknutshell.com","glockforum.com","glockforum.net","gmfullsize.com","goalsport.info","gofilmizle.com","golfdigest.com","golfstreams.me","goodreturns.in","gr-yaris.co.uk","gravureblog.tv","gtaaquaria.com","guitars101.com","gujjukhabar.in","gunandgame.com","gyanitheme.com","hauntforum.com","hdfilmsitesi.*","hdmoviesfair.*","hdmoviesflix.*","hdpornflix.com","hentai-sub.com","hentaihere.com","hentaiworld.tv","hesgoal-vip.io","hesgoal-vip.to","hinatasoul.com","hindilinks4u.*","hindimovies.to","hinoforums.com","hondatwins.net","horseforum.com","hotgranny.live","hotrodders.com","hotukdeals.com","hummerchat.com","hwnaturkya.com","iisfvirtual.in","imgtraffic.com","indiatimes.com","infinitifx.org","infogenyus.top","inshorturl.com","insidehook.com","instanders.app","ioniqforum.com","ios.codevn.net","iplayerhls.com","iplocation.net","isabeleats.com","isekaitube.com","itaishinja.com","itsuseful.site","javatpoint.com","javggvideo.xyz","javsubindo.com","javtsunami.com","jdfanatics.com","jeepgarage.org","jizzbunker.com","joemonster.org","joyousplay.xyz","jpaceforum.com","jpopsingles.eu","jukeforums.com","jyoseisama.com","k1600forum.com","kakarotfoot.ru","kanyetothe.com","katoikos.world","kawiforums.com","kia-forums.com","kickassanime.*","kijolariat.net","kimbertalk.com","kompasiana.com","ktmforum.co.uk","letterboxd.com","lifehacker.com","liliputing.com","link.vipurl.in","liquipedia.net","listendata.com","localnews8.com","lokhung888.com","low-riders.com","lulustream.com","m.edaily.co.kr","m.shuhaige.net","m109riders.com","macanforum.com","mactechnews.de","mahajobwala.in","mahitimanch.in","majestyusa.com","makemytrip.com","malluporno.com","mangareader.to","manhwaclub.net","manutdtalk.com","marcialhub.xyz","mastkhabre.com","mazda6club.com","mazdaworld.org","megapastes.com","meusanimes.net","microskiff.com","midebalonu.net","minitorque.com","mkv-pastes.com","monacomatin.mc","mondeostoc.com","morikinoko.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","moviebaztv.com","movies2watch.*","movingxh.world","mumuplayer.com","mundowuxia.com","my.irancell.ir","myeasymusic.ir","mymbonline.com","nana-press.com","naszemiasto.pl","nayisahara.com","newmovierulz.*","newnissanz.com","news-buzz1.com","news30over.com","newscionxb.com","newtiburon.com","nhregister.com","niocarclub.com","nissanclub.com","nookgaming.com","nowinstock.net","nv200forum.com","nyfirearms.com","o2tvseries.com","ocregister.com","ohsheglows.com","onecall2ch.com","onlyfaucet.com","oregonlive.com","originporn.com","orovillemr.com","outbackers.com","pandamovies.me","pandamovies.pw","pandaspor.live","pantrymama.com","paste-drop.com","pastemytxt.com","pathofexile.gg","pelando.com.br","pencarian.link","petitrobert.fr","pinchofyum.com","pipandebby.com","piratefast.xyz","play-games.com","playcast.click","playhydrax.com","playingmtg.com","playtube.co.za","populist.press","pornhd720p.com","pornincest.net","pornohexen.com","pornstreams.co","powerover.site","preisjaeger.at","priusforum.com","projeihale.com","proxyninja.org","psychobike.com","q2forums.co.uk","qiqitvx84.shop","quest4play.xyz","rabbitdogs.net","ramevforum.com","rc350forum.com","rc51forums.com","record-bee.com","reisefrage.net","remixsearch.es","resourceya.com","ripplehub.site","rnbxclusive0.*","rnbxclusive1.*","robaldowns.com","robbreport.com","romancetv.site","rt3dmodels.com","rubyvidhub.com","rugbystreams.*","rugerforum.net","runeriders.com","rupyaworld.com","safefileku.com","sakurafile.com","sandrarose.com","saratogian.com","seoschmiede.at","serienstream.*","severeporn.com","sextubebbw.com","sexvideos.host","sgvtribune.com","shadowverse.gg","shark-tank.com","shavetape.cash","shemaleraw.com","shoot-yalla.me","siennachat.com","sigarms556.com","singjupost.com","sizecharts.net","skidrowcpy.com","slatedroid.com","slickdeals.net","slideshare.net","smallencode.me","socceronline.*","softairbay.com","solanforum.com","soldionline.it","soranews24.com","soundcloud.com","speedostream.*","speedzilla.com","speisekarte.de","spieletipps.de","sportbikes.net","sportsurge.net","spyderchat.com","spydertalk.com","srt10forum.com","srt4mation.com","ssrfanatic.com","stbemuiptv.com","stocktwits.com","streamflash.sx","streamkiste.tv","streamruby.com","studyfinds.org","superhonda.com","supexfeeds.com","swatchseries.*","swedespeed.com","swipebreed.net","swordalada.org","tamilprinthd.*","taosforums.com","tarokforum.com","taurusclub.com","tbssowners.com","tea-coffee.net","techcrunch.com","techyorker.com","teksnologi.com","tempmail.ninja","thatgossip.com","theakforum.net","thefitchen.com","thehayride.com","themarysue.com","thenerdyme.com","thepiratebay.*","theporngod.com","theshedend.com","timesunion.com","tinxahoivn.com","tomarnarede.pt","tonaletalk.com","topcryptoz.net","topsporter.net","tormalayalam.*","torontosun.com","torrsexvid.com","totalsportek.*","toyokeizai.net","tracktheta.com","trannyteca.com","trentonian.com","triumph675.net","triumphrat.net","troyrecord.com","tundratalk.net","turbocloud.xyz","turbododge.com","tvs-widget.com","tvseries.video","tw200forum.com","twincities.com","uberpeople.net","ufaucet.online","ultrahorny.com","universalis.fr","urlbluemedia.*","userscloud.com","usmagazine.com","vagdrivers.net","vahantoday.com","videocelts.com","vikistream.com","viperalley.com","visifilmai.org","viveseries.com","volvoforum.com","wallpapers.com","watarukiti.com","watch-series.*","watchomovies.*","watchpornx.com","webcamrips.com","weldingweb.com","wellplated.com","wielerflits.be","wikifilmia.com","winclassic.net","wnynewsnow.com","worldsports.me","wort-suchen.de","worthcrete.com","wpdeployit.com","www-y2mate.com","www.amazon.com","xanimeporn.com","xc100forum.com","xclusivejams.*","xeforums.co.uk","xhamster46.com","xhofficial.com","xhwebsite2.com","xhwebsite5.com","xmegadrive.com","xxxbfvideo.net","yabaisub.cloud","yfzcentral.com","yourcobalt.com","yourupload.com","z1000forum.com","z125owners.com","zeroupload.com","zx25rforum.com","1911addicts.com","240sxforums.com","4activetalk.com","51bonusrummy.in","7thgenhonda.com","899panigale.org","959panigale.net","9thgencivic.com","a-z-animals.com","acadiaforum.net","accordxclub.com","acedarspoon.com","acemanforum.com","adrinolinks.com","adz7short.space","agoneerfans.com","agrodigital.com","aliezstream.pro","all-nationz.com","alldownplay.xyz","amarokforum.com","androjungle.com","anime-loads.org","animeshqip.site","animesultra.net","aniroleplay.com","app-sorteos.com","archerytalk.com","areaconnect.com","ariyaforums.com","arstechnica.com","artistforum.com","astrosafari.com","audi-forums.com","audif1forum.com","audiotools.blog","audioz.download","audiq3forum.com","averiecooks.com","beinmatch1.live","bharathwick.com","bikinitryon.net","bimmerwerkz.com","bizjournals.com","blazersedge.com","bluegraygal.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bobsvagene.club","bokepsin.in.net","bollyflix.cards","boxerforums.com","boxingforum.com","boxingstream.me","brilian-news.id","brutusforum.com","budgetbytes.com","buffstreams.app","bussyhunter.com","can-amforum.com","careersides.com","cattleforum.com","cbr300forum.com","celicasupra.com","cempakajaya.com","chevyblazer.org","chollometro.com","cigarforums.net","cizgivedizi.com","classic-jdm.com","clubtouareg.com","computerbild.de","convertcase.net","cordneutral.net","cosplay-xxx.com","creatordrop.com","crownforums.com","cryptoearns.com","ct200hforum.com","ctx700forum.com","customtacos.com","cycleforums.com","cycletrader.com","dailybreeze.com","dailycamera.com","dendroboard.com","diariovasco.com","dieseljeeps.com","dieselplace.com","digimonzone.com","diychatroom.com","dizipal1521.com","dizipal1522.com","dizipal1523.com","dizipal1524.com","dizipal1525.com","dizipal1526.com","dizipal1527.com","dizipal1528.com","dizipal1529.com","dizipal1530.com","dizipal1531.com","dizipal1532.com","dizipal1533.com","dizipal1534.com","dizipal1535.com","dizipal1536.com","dizipal1537.com","dizipal1538.com","dizipal1539.com","dizipal1540.com","dizipal1541.com","dizipal1542.com","dizipal1543.com","dizipal1544.com","dizipal1545.com","dizipal1546.com","dizipal1547.com","dizipal1548.com","dizipal1549.com","dizipal1550.com","dizipal1551.com","dizipal1552.com","dizipal1553.com","dizipal1554.com","dizipal1555.com","dizipal1556.com","dizipal1557.com","dizipal1558.com","dizipal1559.com","dizipal1560.com","dizipal1561.com","dizipal1562.com","dizipal1563.com","dizipal1564.com","dizipal1565.com","dizipal1566.com","dizipal1567.com","dizipal1568.com","dizipal1569.com","dizipal1570.com","dizipal1571.com","dizipal1572.com","dizipal1573.com","dizipal1574.com","dizipal1575.com","dizipal1576.com","dizipal1577.com","dizipal1578.com","dizipal1579.com","dizipal1580.com","dizipal1581.com","dizipal1582.com","dizipal1583.com","dizipal1584.com","dizipal1585.com","dizipal1586.com","dizipal1587.com","dizipal1588.com","dizipal1589.com","dizipal1590.com","dizipal1591.com","dizipal1592.com","dizipal1593.com","dizipal1594.com","dizipal1595.com","dizipal1596.com","dizipal1597.com","dizipal1598.com","dizipal1599.com","dizipal1600.com","dl-protect.link","doctormalay.com","dodge-nitro.com","dogfoodchat.com","donnerwetter.de","dopomininfo.com","dreamchance.net","driveaccord.net","drywalltalk.com","e-tronforum.com","e46fanatics.com","ebaumsworld.com","ebookhunter.net","economist.co.kr","egoallstars.com","elamigosweb.com","empire-stream.*","escape-city.com","esportivos.site","exactpay.online","expedition33.gg","expressnews.com","extrapetite.com","extratorrent.st","fcportables.com","fdownloader.net","ferrarilife.com","fgochaldeas.com","filmizleplus.cc","filmovitica.com","filmy4wap.co.in","financemonk.net","financewada.com","finanzfrage.net","fiveslot777.com","fmradiofree.com","footyhunter.lol","forteforums.com","framedcooks.com","freeairpump.com","freeconvert.com","freeomovie.info","freewebcart.com","fsportshd.xyz>>","fxstreet-id.com","fxstreet-vn.com","gameplayneo.com","gaminginfos.com","gamingsmart.com","gatorforums.net","gazetaprawna.pl","gen3insight.com","gentosha-go.com","geogridgame.com","gewinnspiele.tv","ghibliforum.com","girlscanner.org","girlsreport.net","gmtruckclub.com","godairyfree.org","gofile.download","goproforums.com","gowatchseries.*","gratispaste.com","greatandhra.com","gunnerforum.com","gut-erklaert.de","hamrojaagir.com","havocxforum.com","hdmp4mania2.com","hdstreamss.club","heavyfetish.com","hentaicovid.com","hentaiporno.xxx","hentaistream.co","heygrillhey.com","hiidudemoviez.*","hockeyforum.com","hollymoviehd.cc","hondashadow.net","hotcopper.co.nz","hummusapien.com","i-paceforum.com","idoitmyself.xyz","ilovetoplay.xyz","infinitiq30.org","infinitiq50.org","infinitiq60.org","infosgj.free.fr","integratalk.com","istreameast.app","jaguarforum.com","japangaysex.com","jeepevforum.com","jeeppatriot.com","jettajunkie.com","jkssbalerts.com","juliasalbum.com","jumpsokuhou.com","kandiforums.com","kawieriders.com","keltecforum.com","khatrimazaful.*","kiaevforums.com","kickrunners.com","kiddyearner.com","kijyomatome.com","kkinstagram.com","komikdewasa.art","kurashinista.jp","lakestclair.net","lamarledger.com","ldoceonline.com","lexusfforum.com","lifematome.blog","linkss.rcccn.in","livenewschat.eu","livesports4u.pw","livestreames.us","lordchannel.com","lucid-forum.com","lugerforums.com","lulustream.live","lumberjocks.com","luxury4play.com","lynkcoforum.com","macombdaily.com","mais.sbt.com.br","mamieastuce.com","mangoparody.com","marlinforum.com","marvelrivals.gg","matomeblade.com","matomelotte.com","mclarenlife.com","mediacast.click","medstudentz.com","meganesport.net","mentalfloss.com","mercedescla.org","mercurynews.com","metrisforum.com","miamiherald.com","minievforum.com","miniwebtool.com","mobilestalk.net","modernhoney.com","monoschino2.com","motogpstream.me","mov18plus.cloud","movierulzlink.*","moviessources.*","msonglyrics.com","myanimelist.net","nativesurge.net","naughtypiss.com","ncgunowners.com","news-herald.com","news.zerkalo.io","niice-woker.com","ninetowners.com","nitroforumz.com","noindexscan.com","nomnompaleo.com","notebookcheck.*","novelssites.com","nowsportstv.com","nu6i-bg-net.com","nutmegnanny.com","nuxhallas.click","nydailynews.com","oceanforums.com","onihimechan.com","onlineweb.tools","ontvtonight.com","otoko-honne.com","ourcoincash.xyz","pandamovie.info","pandamovies.org","passatworld.com","paviseforum.com","pawastreams.pro","peliculasmx.net","pelisxporno.net","pepperlive.info","persoenlich.com","pervyvideos.com","petforums.co.uk","phillyvoice.com","phongroblox.com","picsxxxporn.com","pierandsurf.com","pilotonline.com","piratehaven.xyz","pisshamster.com","pistolsmith.com","pistolworld.com","planetminis.com","plantedtank.net","poodleforum.com","popdaily.com.tw","powerstroke.org","premiumporn.org","priusonline.com","projectfreetv.*","prowlertalk.net","punishworld.com","qatarstreams.me","r1200rforum.com","rallyforums.com","rangerovers.net","rank1-media.com","raptorforum.com","readbitcoin.org","readhunters.xyz","recon-forum.com","regalforums.com","remixsearch.net","reportera.co.kr","resizer.myct.jp","rhinoforums.net","riderforums.com","rnbastreams.com","robloxforum.com","rodsnsods.co.uk","roofingtalk.com","rugbystreams.me","rustorkacom.lib","saabcentral.com","saikyo-jump.com","sampledrive.org","sat-sharing.com","saxontheweb.net","scr950forum.com","seadoospark.org","seir-sanduk.com","seltosforum.com","sfchronicle.com","shadowrangers.*","shemalegape.net","showcamrips.com","sipandfeast.com","ske48matome.net","skinnytaste.com","skyroadster.com","smokinvette.com","smsonline.cloud","sneakernews.com","socceronline.me","souq-design.com","sourceforge.net","southhemitv.com","sports-stream.*","sportsonline.si","sportsseoul.com","sportzonline.si","stdrivers.co.uk","streamnoads.com","stripers247.com","stylecaster.com","sudokutable.com","suicidepics.com","supraforums.com","sweetie-fox.com","tackledsoul.com","taikoboards.com","talkbudgies.com","talkparrots.com","tapeantiads.com","tapeblocker.com","taurusarmed.net","tennisforum.com","tennisstreams.*","teryxforums.net","thebassbarn.com","theblueclit.com","thebullspen.com","thegoatspot.net","themoviesflix.*","theporndude.com","thereeftank.com","thereporter.com","thesexcloud.com","timesherald.com","tntsports.store","topstarnews.net","topstreams.info","totalsportek.to","toursetlist.com","tradingview.com","truthsocial.com","trybawaryjny.pl","tuktukcinma.com","turbobuicks.com","turbovidhls.com","tutorgaming.com","tutti-dolci.com","ufcfight.online","uk-muscle.co.uk","ukaudiomart.com","underhentai.net","unite-guide.com","uploadhaven.com","uranai.nosv.org","usaudiomart.com","uwakitaiken.com","v-twinforum.com","valhallas.click","vantasforum.com","vikingforum.net","vikingforum.org","vinfasttalk.com","vipsister23.com","viralharami.com","volconforum.com","vwt4forum.co.uk","watchf1full.com","watchhentai.net","watchxxxfree.pw","welovetrump.com","weltfussball.at","wetteronline.de","wieistmeineip.*","willitsnews.com","windroid777.com","wizistreamz.xyz","wordcounter.icu","worldsports.*>>","writerscafe.org","www.hoyolab.com","www.youtube.com","xmoviesforyou.*","xxxparodyhd.net","xxxwebdlxxx.top","yamahaforum.com","yoursciontc.com","zakuzaku911.com","2coolfishing.com","3dprinterful.com","4thgentacoma.com","790dukeforum.com","aclassclub.co.uk","acura-legend.com","adblockstrtape.*","adblockstrtech.*","adultstvlive.com","affordwonder.net","aheadofthyme.com","airflowforum.com","altherforums.com","altimaforums.net","amindfullmom.com","androidadult.com","animestotais.xyz","antennasports.ru","archeryaddix.com","arteonforums.com","ascentforums.com","asyaanimeleri.pw","backfirstwo.site","badgerowners.com","bananamovies.org","barbarabakes.com","batmanfactor.com","bcsportbikes.com","benelliforum.com","bestgirlsexy.com","bestpornflix.com","bigblockdart.com","blog.esuteru.com","blog.livedoor.jp","blowgunforum.com","boardingarea.com","bostonherald.com","bostonscally.com","brandbrief.co.kr","brutecentral.com","buickevforum.com","buzzfeednews.com","c-classforum.com","cadenzaforum.com","canalesportivo.*","cbr500riders.com","charexempire.com","cherokeesrt8.com","cherokeetalk.com","cheyennechat.com","chickenforum.com","chinese-pics.com","choosingchia.com","civic11forum.com","clarityforum.com","cleaningtalk.com","clever-tanken.de","clickndownload.*","clickorlando.com","clubfrontier.org","clubroadster.net","coloradofans.com","coloredmanga.com","comidacaseira.me","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","cricketforum.com","crxcommunity.com","cryptofactss.com","ctx1300forum.com","culinaryhill.com","culturequizz.com","cumminsforum.com","cybercityhelp.in","cyclingabout.com","daciaforum.co.uk","dailyfreeman.com","dailytribune.com","dailyuploads.net","dakotaforumz.com","darknessporn.com","dartsstreams.com","dataunlocker.com","desertxforum.com","destiny2zone.com","detikkebumen.com","diavel-forum.com","diecastcrazy.com","dieselforums.com","directupload.net","dobermantalk.com","dodgedurango.net","dodgeevforum.com","donanimhaber.com","donghuaworld.com","down.dataaps.com","downloadrips.com","duramaxforum.com","eastbaytimes.com","ebikerforums.com","echelonforum.com","elantraforum.com","elantrasport.com","empire-streamz.*","enclaveforum.net","envistaforum.com","evoqueforums.net","explorertalk.com","f150ecoboost.net","familyporner.com","favoyeurtube.net","feedmephoebe.com","ferrari-talk.com","filecatchers.com","filespayouts.com","financacerta.com","firearmstalk.com","flagandcross.com","flatpanelshd.com","flyfishing.co.uk","football-2ch.com","fordexplorer.org","fordstnation.com","forumlovers.club","freemcserver.net","freeomovie.co.in","freeusexporn.com","fullhdfilmizle.*","fullxxxmovies.me","funkeypagali.com","g6ownersclub.com","gamesrepacks.com","garminrumors.com","gaydelicious.com","genialetricks.de","getviralreach.in","giuliaforums.com","giurgiuveanul.ro","gl1800riders.com","gledajcrtace.xyz","gmdietforums.com","gminsidenews.com","go.gets4link.com","godstoryinfo.com","gourmetscans.net","grecaleforum.com","gsm-solution.com","hallofseries.com","handgunforum.net","happyinshape.com","happymoments.lol","hausbau-forum.de","hdfilmizlesene.*","hdsaprevodom.com","helpdeskgeek.com","hentaiseason.com","homemadehome.com","hondacb1000r.com","hondaevforum.com","hondaforeman.com","hornetowners.com","hotcopper.com.au","howsweeteats.com","husseinezzat.com","ikarishintou.com","ildcatforums.net","imagereviser.com","impalaforums.com","infinitiqx30.org","infinitiqx50.org","infinitiqx60.org","infinitiqx80.org","infinityfree.com","inspiralized.com","jalshamoviezhd.*","jasminemaria.com","jointexploit.net","jovemnerd.com.br","jukeforums.co.uk","justfullporn.net","kakarotfoot.ru>>","kawasakiz650.com","ketolifetalk.com","khatrimazafull.*","kianiroforum.com","kijolifehack.com","kimscravings.com","kingstreamz.site","kitchendivas.com","kleinezeitung.at","knowyourmeme.com","kobe-journal.com","kodiakowners.com","ktm1090forum.net","kyoteibiyori.com","lakeshowlife.com","latinomegahd.net","laurafuentes.com","lexusevforum.com","lexusnxforum.com","linkshortify.com","lizzieinlace.com","lonestarlive.com","loveinmyoven.com","madeeveryday.com","madworldnews.com","magnetoforum.com","magnumforumz.com","mahjongchest.com","mangaforfree.com","manishclasses.in","mardomreport.net","marlinowners.com","maseratilife.com","mathplayzone.com","maverickchat.com","mazda3forums.com","meconomynews.com","medievalists.net","megapornpics.com","millionscast.com","moddedraptor.com","moderncamaro.com","modularfords.com","moneycontrol.com","mostlymorgan.com","mountainbuzz.com","moviesmod.com.pl","mrproblogger.com","mudinmyblood.net","mullenowners.com","mybikeforums.com","mydownloadtube.*","mylargescale.com","mylivestream.pro","nationalpost.com","naturalblaze.com","netflixporno.net","newedutopics.com","newf150forum.com","newsinlevels.com","newsweekjapan.jp","ninersnation.com","nishankhatri.xyz","nissanforums.com","nissanmurano.org","nocrumbsleft.net","nordenforums.com","o2tvseries4u.com","ojearnovelas.com","onionstream.live","optimaforums.com","oumaga-times.com","paradisepost.com","pcgamingwiki.com","pcpartpicker.com","pelotonforum.com","pendujatt.com.se","perfectunion.com","piranha-fury.com","plainchicken.com","planetisuzoo.com","player.buffed.de","plumbingzone.com","powerover.online","powerover.site>>","predatortalk.com","preludepower.com","pricearchive.org","programme-tv.net","protrumpnews.com","pursuitforum.com","puzzlegarage.com","r6messagenet.com","raetsel-hilfe.de","rangerforums.net","ranglerboard.com","ranglerforum.com","raptorforumz.com","readingeagle.com","rebajagratis.com","repack-games.com","rinconriders.com","ripexbooster.xyz","risttwisters.com","rocketnews24.com","rollingstone.com","routerforums.com","rsoccerlink.site","rule34hentai.net","s1000rrforum.com","saradahentai.com","scioniaforum.com","scionimforum.com","seat-forum.co.uk","segwayforums.com","serial1forum.com","shercoforums.com","shotgunworld.com","shutterstock.com","skidrowcodex.net","skincaretalk.com","smartermuver.com","smartevforum.com","sniperforums.com","solitairehut.com","sonataforums.com","south-park-tv.fr","soxprospects.com","specialstage.com","sport-passion.fr","sportalkorea.com","sportmargin.live","sportshub.stream","sportsloverz.xyz","sportstream1.cfd","starlinktalk.com","statecollege.com","stellanspice.com","stelvioforum.com","stream.nflbox.me","stream4free.live","streamblasters.*","streambucket.net","streamcenter.pro","streamcenter.xyz","streamingnow.mov","stromerforum.com","stromtrooper.com","strtapeadblock.*","subtitleporn.com","sukattojapan.com","sun-sentinel.com","sutekinakijo.com","taisachonthi.com","tapelovesads.org","tastingtable.com","team-integra.net","techkhulasha.com","telcoinfo.online","terrainforum.com","terrainforum.net","teslabottalk.com","text-compare.com","thebakermama.com","thebassholes.com","theboxotruth.com","thecustomrom.com","thedailymeal.com","thedigestweb.com","thefitbrit.co.uk","theflowspace.com","thegadgetking.in","thelawnforum.com","thelinuxcode.com","thelupussite.com","thelureforum.com","thenerdstash.com","thenewcamera.com","thewatchsite.com","titanxdforum.com","tomshardware.com","topvideosgay.com","total-sportek.to","toyotanation.com","tractorforum.com","trainerscity.com","trapshooters.com","trendytalker.com","trocforums.co.uk","tucson-forum.com","turbogvideos.com","turboplayers.xyz","tv.latinlucha.es","tv5mondeplus.com","twobluescans.com","usmle-forums.com","utahwildlife.net","v8bikeriders.com","valeriabelen.com","veggieboards.com","venuedrivers.com","veryfreeporn.com","vichitrainfo.com","vizslaforums.com","voiranime.stream","volvo-forums.com","volvoevforum.com","volvov40club.com","voyeurfrance.net","vulcanforums.com","vwatlasforum.com","watchfreexxx.net","watchmmafull.com","weblivehdplay.ru","whipperberry.com","word-grabber.com","world-fusigi.net","worldhistory.org","worldjournal.com","wouterplanet.com","x-trail-uk.co.uk","xclassforums.com","xhamsterporno.mx","xpengevforum.com","xpowerforums.com","xsr700forums.com","yamaha-forum.net","yifysubtitles.ch","yourcountdown.to","youwatchporn.com","ziggogratis.site","2-seriesforum.com","365cincinnati.com","4chanarchives.com","abarthforum.co.uk","adblockplustape.*","adclickersbot.com","advocate-news.com","altarofgaming.com","amandascookin.com","amrapideforum.com","amybakesbread.com","andhrafriends.com","andrewzimmern.com","androidpolice.com","applecarforum.com","aquariumforum.com","armypowerinfo.com","aronaforums.co.uk","atecaforums.co.uk","atlasandboots.com","atvdragracers.com","aussieexotics.com","auto-crypto.click","avengerforumz.com","bakedbyrachel.com","banglagolpo.co.in","basketballbuzz.ca","bebasbokep.online","beforeitsnews.com","besthdgayporn.com","bestporncomix.com","blazerevforum.com","blizzboygames.net","blog.tangwudi.com","broncoevforum.com","buildtheearth.net","bulldogbreeds.com","butterbeready.com","cadryskitchen.com","cagesideseats.com","caliberforums.com","caliberforumz.com","camchickscaps.com","cayenneforums.com","cdn.tiesraides.lv","chaptercheats.com","chargerforums.com","chargerforumz.com","cichlid-forum.com","cinemastervip.com","claplivehdplay.ru","closetcooking.com","clubcrosstrek.com","cocokara-next.com","coloradodaily.com","commandertalk.com","computerfrage.net","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","crackstreamer.net","crvownersclub.com","cryptednews.space","customdakotas.com","custommagnums.com","dailybulletin.com","dailydemocrat.com","dailytech-news.eu","dairygoatinfo.com","damndelicious.net","daytonaowners.com","deepgoretube.site","deutschepornos.me","diabetesforum.com","ditjesendatjes.nl","dl.apkmoddone.com","dodgeintrepid.net","drinkspartner.com","ducatimonster.org","durangoforumz.com","eatlittlebird.com","economictimes.com","ecosportforum.com","envisionforum.com","epaceforums.co.uk","etransitforum.com","euro2024direct.ru","everestowners.com","extremotvplay.com","farmersjournal.ie","fetcheveryone.com","fiat500owners.com","fiestafaction.com","filmesonlinex.org","fitnesssguide.com","focusfanatics.com","fordownloader.com","form.typeform.com","fort-shop.kiev.ua","forum.mobilism.me","fpaceforums.co.uk","freemagazines.top","freeporncomic.net","freethesaurus.com","french-streams.cc","frugalvillage.com","funtasticlife.com","fwmadebycarli.com","galonamission.com","gamejksokuhou.com","gamesmountain.com","gardeningsoul.com","gasserhotrods.com","gaypornhdfree.com","genesisforums.com","genesisforums.org","geocaching101.com","gimmesomeoven.com","globalstreams.xyz","goldwingfacts.com","gourbanhiking.com","greatlakes4x4.com","grizzlyowners.com","grizzlyriders.com","guitarscanada.com","havaneseforum.com","hdfilmcehennemi.*","headlinerpost.com","hemitruckclub.com","hentaitube.online","heresy-online.net","hindimoviestv.com","hollywoodlife.com","hqcelebcorner.net","hunterscomics.com","iconicblogger.com","impalassforum.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","innateblogger.com","intouchweekly.com","ipaceforums.co.uk","iphoneincanada.ca","islamicfinder.org","jaguarxeforum.com","jaysbrickblog.com","jeepcommander.com","jeeptrackhawk.org","jockeyjournal.com","justlabradors.com","kawasakiworld.com","kbconlinegame.com","kfx450central.com","kiasoulforums.com","kijomatomelog.com","kimcilonlyofc.com","konoyubitomare.jp","konstantinova.net","koora-online.live","langenscheidt.com","laughingsquid.com","leechpremium.link","letsdopuzzles.com","lettyskitchen.com","lewblivehdplay.ru","lexusrcowners.com","lexusrxowners.com","lineupexperts.com","locatedinfain.com","luciferdonghua.in","marineinsight.com","mdzsmutpcvykb.net","mercurycougar.net","miaminewtimes.com","midhudsonnews.com","midwest-horse.com","mindbodygreen.com","mlbpark.donga.com","motherwellmag.com","motorradfrage.net","moviewatch.com.pk","multicanaistv.com","musicfeeds.com.au","myjeepcompass.com","myturbodiesel.com","nationaltoday.com","newtahoeyukon.com","nextchessmove.com","nikkan-gendai.com","nishinippon.co.jp","nissan-navara.net","nodakoutdoors.com","notebookcheck.net","nudebabesin3d.com","nyitvatartas24.hu","ohiosportsman.com","okusama-kijyo.com","olympicstreams.co","ondemandkorea.com","opensubtitles.org","outdoormatome.com","palisadeforum.com","paracordforum.com","paranormal-ch.com","pavementsucks.com","pcgeeks-games.com","peugeotforums.com","pinayscandalz.com","pioneerforums.com","player.pcgames.de","plugintorrent.com","polarisriders.com","pornoenspanish.es","preludeonline.com","prepperforums.net","pressandguide.com","presstelegram.com","prowlerforums.net","pubgaimassist.com","pumpkinnspice.com","qatarstreams.me>>","ram1500diesel.com","ramrebelforum.com","read-onepiece.net","redlineforums.com","reidoscanais.life","renegadeforum.com","republicbrief.com","restlessouter.net","restlingforum.com","retro-fucking.com","rightwingnews.com","rumahbokep-id.com","sambalpuristar.in","santafeforums.com","savemoneyinfo.com","scirocconet.co.uk","seatroutforum.com","secure-signup.net","series9movies.com","shahiid-anime.net","share.filesh.site","shootersforum.com","shootingworld.com","shotgunforums.com","shugarysweets.com","sideplusleaks.net","sierraevforum.com","siliconvalley.com","simplywhisked.com","skylineowners.com","soccerworldcup.me","solsticeforum.com","solterraforum.com","souexatasmais.com","sportanalytic.com","sportlerfrage.net","sportzonline.site","squallchannel.com","stapadblockuser.*","starxinvestor.com","steamidfinder.com","steamseries88.com","stellarthread.com","stingerforums.com","stitichsports.com","stream.crichd.vip","streamadblocker.*","streamcaster.live","streamingclic.com","streamoupload.xyz","streamshunters.eu","streamsoccer.site","streamtpmedia.com","streetinsider.com","subaruoutback.org","subaruxvforum.com","substitutefor.com","sumaburayasan.com","superherohype.com","supertipzz.online","suzuki-forums.com","suzuki-forums.net","suzukicentral.com","t-shirtforums.com","tablelifeblog.com","talkclassical.com","talonsxsforum.com","taycanevforum.com","thaihotmodels.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedieselstop.com","thefreebieguy.com","thegamescabin.com","thehackernews.com","themorningsun.com","thenewsherald.com","thepiratebay0.org","thewoksoflife.com","thyroidboards.com","tightsexteens.com","tiguanevforum.com","tiktokcounter.net","timesofisrael.com","tivocommunity.com","tnhuntingclub.com","tokusatsuindo.com","toyotacelicas.com","toyotaevforum.com","toyotaklub.org.pl","tradingfact4u.com","traverseforum.com","truyen-hentai.com","tundraevforum.com","turkedebiyati.org","tvbanywherena.com","twitchmetrics.net","twowheelforum.com","umatechnology.org","unsere-helden.com","v6performance.net","velarforums.co.uk","velosterturbo.org","victoryforums.com","viralitytoday.com","visualnewshub.com","volusiariders.com","wannacomewith.com","watchserie.online","wellnessbykay.com","workweeklunch.com","worldmovies.store","wutheringwaves.gg","www.hoyoverse.com","wyborkierowcow.pl","xxxdominicana.com","young-machine.com","yourcupofcake.com","10thcivicforum.com","4-seriesforums.com","4runner-forums.com","502streetscene.net","5thrangerforum.com","accuretawealth.com","adaptive.marketing","adblockeronstape.*","addictinggames.com","adultasianporn.com","adultdeepfakes.com","advertisertape.com","airsoftsociety.com","allaboutthetea.com","allthingsvegas.com","animesorionvip.net","asialiveaction.com","asianclipdedhd.net","astrakforums.co.uk","atlasstudiousa.com","australiaforum.com","authenticateme.xyz","authenticforum.com","backforseconds.com","bakeitwithlove.com","barstoolsports.com","baseballchannel.jp","bestreamsports.org","bestsportslive.org","bimmerforums.co.uk","blackporncrazy.com","blog-peliculas.com","bluemediastorage.*","bombshellbling.com","browneyedbaker.com","bullnettlenews.com","businessinsider.de","businessinsider.jp","cactusforums.co.uk","cadillacforums.com","calculatorsoup.com","can-amelectric.com","carnivalforums.com","challengerlife.com","challengertalk.com","chicagotribune.com","chinacarforums.com","clickondetroit.com","climbingforums.com","cmaxownersclub.com","codingnepalweb.com","coffeeforums.co.uk","coloradodiesel.org","contractortalk.com","correotemporal.org","corsaeforums.co.uk","cr7-soccer.store>>","crooksandliars.com","crossbownation.com","customfighters.com","cyberquadforum.com","cybertrucktalk.com","dakota-durango.com","dcworldscollide.gg","defendersource.com","defensivecarry.com","descargaspcpro.net","diecastxchange.com","dieselramforum.com","digital-thread.com","dinneratthezoo.com","discoverysport.net","diyelectriccar.com","diymobileaudio.com","dogfoodadvisor.com","downshiftology.com","elantragtforum.com","elconfidencial.com","electro-torrent.pl","empire-streaming.*","equinoxevforum.com","esprinterforum.com","familycheftalk.com","feastingathome.com","feelgoodfoodie.net","filmizlehdizle.com","financenova.online","firebirdnation.com","fjlaboratories.com","flacdownloader.com","footballchannel.jp","fordfusionclub.com","fordinsidenews.com","forkknifeswoon.com","freeadultcomix.com","freepublicporn.com","fullsizebronco.com","future-fortune.com","galinhasamurai.com","games.arkadium.com","gaypornmasters.com","gdrivelatinohd.net","genesisevforum.com","georgiapacking.org","germancarforum.com","goldwingowners.com","grcorollaforum.com","greeleytribune.com","grizzlycentral.com","halloweenforum.com","haveibeenpwned.com","hdstreetforums.com","highkeyfinance.com","highlanderhelp.com","homeglowdesign.com","hondaatvforums.net","hopepaste.download","hungrypaprikas.com","hyundai-forums.com","hyundaitucson.info","iamhomesteader.com","iawaterfowlers.com","insider-gaming.com","insightcentral.net","insurancesfact.com","isthereanydeal.com","jamaicajawapos.com","jigsawexplorer.com","jocjapantravel.com","kawasakiversys.com","kiatuskerforum.com","kijyomatome-ch.com","kirbiecravings.com","kodiaqforums.co.uk","laleggepertutti.it","lancerregister.com","landroversonly.com","leckerschmecker.me","lifeinleggings.com","lincolnevforum.com","listentotaxman.com","liveandletsfly.com","makeincomeinfo.com","maketecheasier.com","marinetraffic.live","marvelsnapzone.com","maverickforums.net","mediaindonesia.com","metalguitarist.org","millwrighttalk.com","moddedmustangs.com","modelrailforum.com","monaskuliner.ac.id","montereyherald.com","morningjournal.com","motorhomefacts.com","moviesonlinefree.*","mrmakeithappen.com","mytractorforum.com","nationalreview.com","newtorrentgame.com","ninja400riders.com","nissancubelife.com","nlab.itmedia.co.jp","nourishedbynic.com","observedtrials.net","oklahomahunter.net","olverineforums.com","omeuemprego.online","oneidadispatch.com","onlineradiobox.com","onlyfullporn.video","oodworkingtalk.com","orkingdogforum.com","orldseafishing.com","ourbeagleworld.com","pacificaforums.com","paintballforum.com","pancakerecipes.com","panel.play.hosting","panigalev4club.com","passportforums.com","pathfindertalk.com","perfectmancave.com","player.gamezone.de","playoffsstream.com","polestar-forum.com","pornfetishbdsm.com","porno-baguette.com","porscheevforum.com","promasterforum.com","prophecyowners.com","q3ownersclub.co.uk","ranglerjlforum.com","readcomiconline.li","reporterherald.com","rimfirecentral.com","roadbikereview.com","roadstarraider.com","roadtripliving.com","runnersforum.co.uk","runtothefinish.com","samsungmagazine.eu","scramblerforum.com","shipsnostalgia.com","shuraba-matome.com","siamblockchain.com","sidexsideworld.com","skyscrapercity.com","slingshotforum.com","snowplowforums.com","softwaredetail.com","spoiledmaltese.com","sportbikeworld.com","sportmargin.online","sportstohfa.online","ssnewstelegram.com","stapewithadblock.*","starbikeforums.com","steamclouds.online","steamcommunity.com","stevesnovasite.com","stingrayforums.com","stormtrakforum.com","stream.nflbox.me>>","strtapeadblocker.*","subarubrzforum.com","subaruforester.org","talkcockatiels.com","talkforfitness.com","talkparrotlets.com","tapeadsenjoyer.com","tcrossforums.co.uk","techtalkcounty.com","telegramgroups.xyz","telesintese.com.br","theblacksphere.net","thebussybandit.com","theendlessmeal.com","thefashionspot.com","thefirearmblog.com","thepolitistick.com","thespeedtriple.com","tiguanforums.co.uk","tiktokrealtime.com","times-standard.com","tips-and-tricks.co","torrentdosfilmes.*","toyotachrforum.com","transalpowners.com","travelplanspro.com","treadmillforum.com","truestreetcars.com","turboimagehost.com","tv.onefootball.com","tvshows4mobile.org","tweaksforgeeks.com","unofficialtwrp.com","upownersclub.co.uk","varminthunters.com","veggiegardener.com","washingtonpost.com","watchadsontape.com","watchpornfree.info","wemove-charity.org","windowscentral.com","worldle.teuteuf.fr","worldstreams.click","www.apkmoddone.com","xda-developers.com","yamahastarbolt.com","yariscrossclub.com","zafiraowners.co.uk","100percentfedup.com","208ownersclub.co.uk","adblockstreamtape.*","adrino1.bonloan.xyz","africatwinforum.com","akb48matomemory.com","aliontherunblog.com","allfordmustangs.com","api.dock.agacad.com","arkansashunting.net","astonmartinlife.com","asumsikedaishop.com","atchtalkforums.info","awellstyledlife.com","barcablaugranes.com","basketballforum.com","bchtechnologies.com","betweenjpandkr.blog","bible-knowledge.com","biblestudytools.com","blackcockchurch.org","blisseyhusbands.com","blog.itijobalert.in","blog.potterworld.co","blogtrabalhista.com","bluemediadownload.*","bowfishingforum.com","brightdropforum.com","brighteyedbaker.com","broncosporttalk.com","campercommunity.com","checkhookboxing.com","chromebookforum.com","chryslerminivan.net","commanderforums.org","countylocalnews.com","creativecanning.com","crosswordsolver.com","curbsideclassic.com","daddylivestream.com","deerhuntersclub.com","dexterclearance.com","didyouknowfacts.com","diendancauduong.com","dieself150forum.com","dk.pcpartpicker.com","dodgedartforumz.com","download.megaup.net","driveteslacanada.ca","ds4ownersclub.co.uk","duckhuntingchat.com","dvdfullestrenos.com","ecoboostmustang.org","elcaminocentral.com","electriciantalk.com","embed.wcostream.com","equipmenttrader.com","escaladeevforum.com","estrenosdoramas.net","explorerevforum.com","ferrari296forum.com","filmesonlinexhd.biz","fjcruiserforums.com","flyfishingforum.com","footballtransfer.ru","fortmorgantimes.com","forums.hfboards.com","foxeslovelemons.com","franceprefecture.fr","frustfrei-lernen.de","genealogyspeaks.com","genesisg70forum.com","genesisg80forum.com","germanshepherds.com","girlsvip-matome.com","glaownersclub.co.uk","hardcoresledder.com","hdfilmcehennemi2.cx","hdlivewireforum.com","hedgehogcentral.com","hometownstation.com","hondarebelforum.com","honeygirlsworld.com","honyaku-channel.net","hoosierhomemade.com","hostingdetailer.com","html.duckduckgo.com","hummingbirdhigh.com","ici.radio-canada.ca","ilovemycockapoo.com","indycityfishing.com","infinitijxforum.com","interfootball.co.kr","jacquieetmichel.net","jamaicaobserver.com","jornadaperfecta.com","joyfoodsunshine.com","justonecookbook.com","kenzo-flowertag.com","kiaownersclub.co.uk","kitimama-matome.net","kreuzwortraetsel.de","ktmduke390forum.com","learnmarketinfo.com","lifeandstylemag.com","lightningowners.com","lightningrodder.com","lite.duckduckgo.com","logicieleducatif.fr","m.jobinmeghalaya.in","makeitdairyfree.com","matometemitatta.com","melskitchencafe.com","mendocinobeacon.com","michiganreefers.com","middletownpress.com","minimalistbaker.com","modeltrainforum.com","motorcycleforum.com","movie-locations.com","mustangecoboost.net","mykoreankitchen.com","nandemo-uketori.com","natashaskitchen.com","negyzetmeterarak.hu","newjerseyhunter.com","ohiogamefishing.com","orlandosentinel.com","outlanderforums.com","paidshitforfree.com","pendidikandasar.net","personalitycafe.com","phoenixnewtimes.com","phonereviewinfo.com","picksandparlays.net","pllive.xmediaeg.com","pokemon-project.com","politicalsignal.com","pornodominicano.net","pornotorrent.com.br","preparedsociety.com","pressenterprise.com","prologuedrivers.com","promodescuentos.com","radio-australia.org","radio-osterreich.at","registercitizen.com","renaultforums.co.uk","reptileforums.co.uk","roguesportforum.com","rojadirectaenvivo.*","royalmailchat.co.uk","santacruzforums.com","secondhandsongs.com","shoot-yalla-tv.live","silveradosierra.com","skidrowreloaded.com","slingshotforums.com","smartkhabrinews.com","snowblowerforum.com","snowmobileforum.com","snowmobileworld.com","soccerdigestweb.com","soccerworldcup.me>>","sourcingjournal.com","sportzonline.site>>","streamadblockplus.*","streamshunters.eu>>","stylegirlfriend.com","supermotojunkie.com","sussexexpress.co.uk","suzukiatvforums.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","tarracoforums.co.uk","thecombineforum.com","thecookierookie.com","thedieselgarage.com","thefoodieaffair.com","thelastdisaster.vip","thelibertydaily.com","theoaklandpress.com","thepiratebay10.info","therecipecritic.com","thesciencetoday.com","thewatchforum.co.uk","thewatchseries.live","tjcruiserforums.com","trailblazertalk.com","truyentranhfull.net","tundrasolutions.com","turkishseriestv.org","viewmyknowledge.com","vintage-mustang.com","watchlostonline.net","watchmonkonline.com","webdesignledger.com","whatjewwannaeat.com","worldaffairinfo.com","worldstarhiphop.com","worldsurfleague.com","yorkshirepost.co.uk","125ccsportsbikes.com","2008ownersclub.co.uk","500xownersclub.co.uk","adamownersclub.co.uk","adultdvdparadise.com","advertisingexcel.com","alkingstickforum.com","alliancervforums.com","allthingsthrifty.com","amazonastroforum.com","androidauthority.com","androidheadlines.com","antaraownersclub.com","arizonagunowners.com","bcfishingreports.com","beaglesunlimited.com","beekeepingforums.com","bersapistolforum.com","blackwoodacademy.org","bleepingcomputer.com","blueovalfanatics.com","bmaxownersclub.co.uk","brushnewstribune.com","carolinafishtalk.com","challengerforumz.com","chevymalibuforum.com","chihuahua-people.com","click.allkeyshop.com","cmaxownersclub.co.uk","coloradoevowners.com","crackstreamshd.click","dailydishrecipes.com","dailynewshungary.com","dailytruthreport.com","danslescoulisses.com","daughtertraining.com","defienietlynotme.com","detailingworld.co.uk","digitalcorvettes.com","divinedaolibrary.com","dribbblegraphics.com","earn.punjabworks.com","everydaytechvams.com","favfamilyrecipes.com","foodfaithfitness.com","fordforumsonline.com","fordmuscleforums.com","freestreams-live.*>>","fullfilmizlesene.net","futabasha-change.com","gametechreviewer.com","gesundheitsfrage.net","goosehuntingchat.com","greensnchocolate.com","greentractortalk.com","gt86ownersclub.co.uk","heartlife-matome.com","hometheatershack.com","hondarebel3forum.com","houstonchronicle.com","hyundaikonaforum.com","ibreatheimhungry.com","indianasportsman.com","indianporngirl10.com","intercity.technology","investnewsbrazil.com","jeepcherokeeclub.com","jljbacktoclassic.com","journal-advocate.com","jukeownersclub.co.uk","juliescafebakery.com","kawasakininja300.com","keedabankingnews.com","knittingparadise.com","kugaownersclub.co.uk","labradoodle-dogs.net","labradorforums.co.uk","lamborghini-talk.com","landroverevforum.com","laweducationinfo.com","lehighvalleylive.com","letemsvetemapplem.eu","librarium-online.com","link.djbassking.live","loan.bgmi32bitapk.in","loan.creditsgoal.com","maturegrannyfuck.com","mazda2revolution.com","mazda3revolution.com","meilleurpronostic.fr","menstennisforums.com","mercedesclaforum.com","mercedesgleforum.com","minesweeperquest.com","mojomojo-licarca.com","motorbikecatalog.com","motorcycleforums.net","mt-soft.sakura.ne.jp","muscularmustangs.com","mustangevolution.com","mylawnmowerforum.com","nationalgunforum.com","neighborfoodblog.com","nissankicksforum.com","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","noteownersclub.co.uk","onesixthwarriors.com","onlinesaprevodom.net","oraridiapertura24.it","pachinkopachisro.com","panamericaforums.com","pasadenastarnews.com","performanceboats.com","pickleballertalk.com","player.smashy.stream","pocketbikeplanet.com","polarisatvforums.com","popularmechanics.com","pornstarsyfamosas.es","preservationtalk.com","receitasdaora.online","redcurrantbakery.com","relevantmagazine.com","reptilesmagazine.com","rollsroyceforums.com","scoutmotorsforum.com","securenetsystems.net","seededatthetable.com","silveradoevforum.com","slobodnadalmacija.hr","snowmobiletrader.com","spendwithpennies.com","sportstohfa.online>>","spotofteadesigns.com","springfieldforum.com","stamfordadvocate.com","starkroboticsfrc.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","talkwithstranger.com","tamilmobilemovies.in","tasteandtellblog.com","techsupportforum.com","thebeautysection.com","thefirearmsforum.com","thefoodcharlatan.com","thefootballforum.net","thegatewaypundit.com","thekitchenmagpie.com","theprudentgarden.com","thisiswhyimbroke.com","totalsportek1000.com","travellingdetail.com","ultrastreamlinks.xyz","verdragonball.online","videoeditingtalk.com","videostreaming.rocks","viralviralvideos.com","windsorexpress.co.uk","yetiownersclub.co.uk","yorkshire-divers.com","yourhomebasedmom.com","yourpatientvoice.com","yugioh-starlight.com","1337x.ninjaproxy1.com","akronnewsreporter.com","applefitnessforum.com","austinbassfishing.com","barnsleychronicle.com","bigleaguepolitics.com","bowfishingcountry.com","burlington-record.com","californiaevforum.com","canamspyderforums.com","casecoltingersoll.com","celebritynetworth.com","celiacandthebeast.com","client.pylexnodes.net","collinsdictionary.com","coloradofisherman.com","corollacrossforum.com","creative-culinary.com","documentaryplanet.xyz","dragontranslation.com","elementownersclub.com","eroticmoviesonline.me","everything2stroke.com","fancymicebreeders.com","foreverwallpapers.com","forum.release-apk.com","fusionsportforums.com","gardentractortalk.com","hackerranksolution.in","hollywoodreporter.com","homesteadingtoday.com","hondacivicforum.co.uk","hondapioneerforum.com","hoodtrendspredict.com","indianmotorcycles.net","invoice-generator.com","iphoneographytalk.com","jeeprenegadeforum.com","journaldemontreal.com","julesburgadvocate.com","kawasakininja1000.com","littlehouseliving.com","live.fastsports.store","livinggospeldaily.com","mainlinemedianews.com","marutisuzukiforum.com","mavericklightning.org","mitsubishi-forums.com","mokkaownersclub.co.uk","motorcycletherapy.net","mountainmamacooks.com","mybakingaddiction.com","nissanversaforums.com","notformembersonly.com","novascotiafishing.com","novascotiahunting.com","pelotalibrevivo.net>>","peugeot108forum.co.uk","politicaltownhall.com","powerstrokenation.com","publicsexamateurs.com","ramchargercentral.com","redbluffdailynews.com","retrievertraining.net","rivianownersforum.com","rottweilersonline.com","royalenfieldforum.com","rugerpistolforums.com","runningonrealfood.com","santacruzsentinel.com","smartcarofamerica.com","snapinstadownload.xyz","snowboardingforum.com","sonymobilityforum.com","sousou-no-frieren.com","statisticsanddata.org","stratolinerdeluxe.com","streamservicehd.click","survivalistboards.com","talkaboutmarriage.com","tapeadvertisement.com","tech.trendingword.com","teslaownersonline.com","thepalmierireport.com","thepatriotjournal.com","thereporteronline.com","theslingshotforum.com","timesheraldonline.com","trailhunterforums.com","transparentnevada.com","travelingformiles.com","ukiahdailyjournal.com","ultimateaircooled.com","uscreditcardguide.com","utkarshonlinetest.com","videogamesblogger.com","volkswagenforum.co.uk","watchkobestreams.info","whittierdailynews.com","xr1200ownersgroup.com","yamahastarstryker.com","zone-telechargement.*","ahdafnews.blogspot.com","airsoftsniperforum.com","allevertakstream.space","andrenalynrushplay.cfd","assessmentcentrehq.com","assistirtvonlinebr.net","automobile-catalog.com","beaumontenterprise.com","blackcockadventure.com","breastfeedingplace.com","canadianmoneyforum.com","capturownersclub.co.uk","chicagolandfishing.com","christianheadlines.com","comicallyincorrect.com","community.fortinet.com","controlconceptsusa.com","crayonsandcravings.com","crunchycreamysweet.com","dallashoopsjournal.com","discosportforums.co.uk","drop.carbikenation.com","eclipsecrossforums.com","elrefugiodelpirata.com","eurointegration.com.ua","evoqueownersclub.co.uk","fertilityfriends.co.uk","filmeserialeonline.org","filmymaza.blogspot.com","gardeninthekitchen.com","godlikeproductions.com","happyveggiekitchen.com","hindisubbedacademy.com","hiraethtranslation.com","hyundaicoupeclub.co.uk","hyundaiperformance.com","jpop80ss3.blogspot.com","kawasakimotorcycle.org","kiatellurideforums.com","littlesunnykitchen.com","longislandfirearms.com","mainehuntingforums.com","mexicanfoodjournal.com","michigan-sportsman.com","missouriwhitetails.com","mycolombianrecipes.com","nashobavalleyvoice.com","nintendoeverything.com","oeffnungszeitenbuch.de","olympusbiblioteca.site","panel.freemcserver.net","patriotnationpress.com","player.gamesaktuell.de","portaldasnovinhas.shop","rangerraptorowners.com","redlandsdailyfacts.com","rubiconownersforum.com","salmonfishingforum.com","saturnoutlookforum.net","shakentogetherlife.com","shutupandtakemyyen.com","smartfeecalculator.com","snowmobilefanatics.com","sonsoflibertymedia.com","theflyfishingforum.com","totalsportek1000.com>>","triumphbobberforum.com","utahconcealedcarry.com","watchdocumentaries.com","yourdailypornvideos.ws","adblockeronstreamtape.*","amessagewithabottle.com","aquaticplantcentral.com","ashingtonflyfishing.com","askandyaboutclothes.com","bajarjuegospcgratis.com","businesswritingblog.com","caraudioclassifieds.org","crosstourownersclub.com","danieldefenseforums.com","ducatisupersport939.net","excelsiorcalifornia.com","footballtransfer.com.ua","fordtransitusaforum.com","forums.redflagdeals.com","freedomfirstnetwork.com","freepornhdonlinegay.com","fromvalerieskitchen.com","healthyfitnessmeals.com","horairesdouverture24.fr","influencersgonewild.org","iwatchfriendsonline.net","laurelberninteriors.com","makefreecallsonline.com","newbrunswickfishing.com","newbrunswickhunting.com","newlifeonahomestead.com","nothingbutnewcastle.com","onionringsandthings.com","orkingfromhomeforum.com","osteusfilmestuga.online","pcoptimizedsettings.com","platingsandpairings.com","player.smashystream.com","polarisgeneralforum.com","powerequipmentforum.com","ridgelineownersclub.com","runningtothekitchen.com","segops.madisonspecs.com","southplattesentinel.com","stockingfetishvideo.com","streamtapeadblockuser.*","tech.pubghighdamage.com","thebestideasforkids.com","thecurvyfashionista.com","theplantbasedschool.com","tropicalfishkeeping.com","zeromotorcycleforum.com","afilmyhouse.blogspot.com","antiquetractorsforum.com","arizonahuntingforums.com","astraownersnetwork.co.uk","awealthofcommonsense.com","booksworthdiscussing.com","broomfieldenterprise.com","canoncitydailyrecord.com","carolinashootersclub.com","chiefmotorcycleforum.com","dictionary.cambridge.org","dimensionalseduction.com","ducatiscramblerforum.com","easttennesseefishing.com","ecosportownersclub.co.uk","first-names-meanings.com","freelancer.taxmachine.be","goldenretrieverforum.com","grandhighlanderforum.com","healthylittlefoodies.com","imgur-com.translate.goog","indianhealthyrecipes.com","lawyersgunsmoneyblog.com","makingthymeforhealth.com","manitobafishingforum.com","manitobahuntingforum.com","maseratilevanteforum.com","mediapemersatubangsa.com","ohiowaterfowlerforum.com","onepiece-mangaonline.com","percentagecalculator.net","player.videogameszone.de","playstationlifestyle.net","sandiegouniontribune.com","smithandwessonforums.com","socialanxietysupport.com","spaghetti-interactive.it","spicysouthernkitchen.com","stacysrandomthoughts.com","streetfighterv2forum.com","stresshelden-coaching.de","sundaysuppermovement.com","the-crossword-solver.com","thedesigninspiration.com","themediterraneandish.com","thewanderlustkitchen.com","tip.etip-staging.etip.io","tropicalfishforums.co.uk","volkswagenownersclub.com","watchdoctorwhoonline.com","watchfamilyguyonline.com","webnoveltranslations.com","workproductivityinfo.com","a-love-of-rottweilers.com","betweenenglandandiowa.com","chevroletownersclub.co.uk","chicagolandsportbikes.com","chocolatecoveredkatie.com","colab.research.google.com","commercialtrucktrader.com","dictionnaire.lerobert.com","floridaconcealedcarry.com","greatamericanrepublic.com","handgunsandammunition.com","harley-davidsonforums.com","hipointfirearmsforums.com","motorsportsracingtalk.com","pensacolafishingforum.com","player.pcgameshardware.de","practicalselfreliance.com","premeditatedleftovers.com","sentinelandenterprise.com","simply-delicious-food.com","sportsgamblingpodcast.com","technicians0.blogspot.com","theprofilebrotherhood.com","transparentcalifornia.com","watchelementaryonline.com","bibliopanda.visblog.online","coloradohometownweekly.com","conservativefiringline.com","cuatrolatastv.blogspot.com","dipelis.junctionjive.co.uk","edinburghnews.scotsman.com","keyakizaka46matomemory.net","lakesimcoemessageboard.com","panelprograms.blogspot.com","portugues-fcr.blogspot.com","redditsoccerstreams.name>>","rojitadirecta.blogspot.com","thenonconsumeradvocate.com","theworldofarchitecture.com","watchbrooklynnine-nine.com","worldoftravelswithkids.com","aprettylifeinthesuburbs.com","beautifulfashionnailart.com","forums.socialmediagirls.com","georgianbaymessageboard.com","maidenhead-advertiser.co.uk","optionsprofitcalculator.com","tastesbetterfromscratch.com","vauxhallownersnetwork.co.uk","verkaufsoffener-sonntag.com","watchmodernfamilyonline.com","bmacanberra.wpcomstaging.com","electricmotorcyclesforum.com","mimaletamusical.blogspot.com","gametohkenranbu.sakuraweb.com","russianmachineneverbreaks.com","tempodeconhecer.blogs.sapo.pt","unblockedgamesgplus.gitlab.io","chumplady.comclosetcooking.com","free-power-point-templates.com","oxfordlearnersdictionaries.com","commercialcompetentedigitale.ro","the-girl-who-ate-everything.com","everythinginherenet.blogspot.com","watchrulesofengagementonline.com","frogsandsnailsandpuppydogtail.com","ragnarokscanlation.opchapters.com","xn--verseriesespaollatino-obc.online","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];

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
