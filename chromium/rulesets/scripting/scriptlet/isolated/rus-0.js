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

// ruleset: rus-0

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
        timer = onIdleFn(( ) => {
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

function setAttr(
    selector = '',
    attr = '',
    value = '',
    ...varargs
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
    const options = safe.parseVarargs(varargs);
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
        const root = document.documentElement;
        if ( root instanceof self.Node === false ) { return; }
        observer.observe(root, { subtree: true, childList: true });
    };
    runAt(( ) => { start(); }, options.runAt || 'idle');
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

function setCookieReload(name, value, path, ...args) {
    setCookie(name, value, path, 'reload', '1', ...args);
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
    const $scriptletHostnames$ = /* 299 */ ["i.ua","14.ru","26.ru","29.ru","35.ru","43.ru","45.ru","48.ru","51.ru","53.ru","56.ru","59.ru","60.ru","63.ru","68.ru","71.ru","72.ru","74.ru","76.ru","86.ru","89.ru","93.ru","d3.ru","e1.ru","eg.ru","iz.ru","kp.ru","nn.ru","nv.ua","rg.ru","tv.ua","v1.ru","vc.ru","vk.ru","vz.ru","ya.ru","116.ru","161.ru","164.ru","173.ru","178.ru","dtf.ru","ngs.ru","rbc.ru","vk.com","wmj.ru","ahen.me","dzen.ru","izh1.ru","mail.ru","msk1.ru","ng72.ru","quto.ru","sm.news","tass.ru","ufa1.ru","viva.ua","ya62.ru","avito.ru","beton.ua","chita.ru","dengi.ua","ferra.ru","hot.game","id.vk.ru","infox.sg","ivona.ua","kufar.by","lenta.ru","liga.net","meteo.ua","motor.ru","ngs22.ru","ngs24.ru","ngs42.ru","ngs55.ru","ngs70.ru","utorr.cc","yandex.*","24parik.*","24smi.org","3dnews.ru","ditey.com","drive2.ru","e.mail.ru","factor.ua","fapvdo.ru","gazeta.ru","gazeta.ua","gsm.in.ua","howdyho.*","innal.top","ircity.ru","isport.ua","kinotv.ru","mgorsk.ru","my-lib.ru","naylo.top","parik24.*","pikabu.ru","rutube.ru","sochi1.ru","soft2u.ru","sso.ya.ru","uwupad.me","vsetv.com","zannn.top","znayka.cc","aj2738.top","bigmir.net","bilshe.com","censor.net","eneyida.tv","fap-guru.*","fishki.net","freehat.cc","gorodvo.ru","hvylya.net","kolobok.ua","lenta.news","letidor.ru","litruso.ru","my.mail.ru","myshows.me","nnmclub.ro","nnmclub.to","nullcms.ru","o2.mail.ru","opennet.me","opennet.ru","passion.ru","rambler.ru","reactor.cc","ritsatv.ru","rsload.net","rustorka.*","stravy.net","tochka.net","tv.mail.ru","vgtimes.ru","vkvideo.ru","x-libri.ru","agronews.ua","biz.mail.ru","direct.farm","doramatv.ru","facenews.ua","farposst.ru","fastpic.org","glianec.com","gorod.dp.ua","gorodche.ru","kichkas.biz","kriminal.tv","lit-web.net","mcs.mail.ru","moslenta.ru","nnm-club.me","novkniga.ru","nsportal.ru","relax-fm.ru","remanga.org","seedoff.net","sichnews.ua","sso.dzen.ru","tolyatty.ru","top.mail.ru","vgtimes.com","www.ukr.net","youtube.com","agroweek.com","auto.mail.ru","blog.mail.ru","bookdream.ru","booksreed.ru","deti.mail.ru","doramatv.one","findanime.me","finuslugi.ru","game4you.top","gazeta.press","help.mail.ru","horo.mail.ru","indicator.ru","kakprosto.ru","kino.mail.ru","lady.mail.ru","love.mail.ru","mag.relax.by","motorpage.ru","mp3party.net","mult-porno.*","news.mail.ru","newsyou.info","panno4ka.net","pets.mail.ru","pogodaua.com","real-vin.com","rustorka.com","rustorka.net","rustorka.top","secretmag.ru","shedevrum.ai","skanbooks.ru","tapochek.net","voronezh1.ru","wotspeak.org","www.ixbt.com","bonus.mail.ru","calls.mail.ru","championat.ru","cloud.mail.ru","disk.yandex.*","dobro.mail.ru","doramatv.live","football24.ua","gibdd.mail.ru","joyreactor.cc","lalapaluza.ru","lifehacker.ru","light.mail.ru","nnovosti.info","online-fix.me","otvet.mail.ru","patephone.com","playground.ru","pravda.com.ua","questtime.net","softoroom.org","touch.mail.ru","agroreview.com","avtovod.com.ua","businessua.com","championat.com","cosplay-porn.*","disk.yandex.ru","epravda.com.ua","f1analytic.com","forum.ixbt.com","health.mail.ru","inforesist.org","kluchikipro.ru","libertycity.ru","lust-girls.com","mail.yandex.ru","ouraidream.com","playvillage.ru","pogoda.mail.ru","stalkermods.ru","24boxing.com.ua","3igames.mail.ru","account.mail.ru","appleinsider.ru","champion.com.ua","comedy-radio.ru","connect.mail.ru","electrobooks.ru","finance.mail.ru","hi-tech.mail.ru","kriminal.net.ua","libertycity.net","liveinternet.ru","livejournal.com","lk.emias.mos.ru","mail.rambler.ru","meteofor.com.ua","new.fastpic.org","overclockers.ru","rustorkacom.lib","sex-studentki.*","sterlitamak1.ru","veseloeradio.ru","vfokuse.mail.ru","vladivostok1.ru","widgets.mail.ru","www.fontanka.ru","zdorovia.com.ua","buhgalter.com.ua","buhgalter911.com","calendar.mail.ru","filmitorrent.net","goddess-game.com","octavius.mail.ru","proceedflow.info","silvercube12.xyz","sport-express.ru","tv.acestream.org","minigames.mail.ru","radioromantika.ru","sport-express.net","sportanalytic.com","footballgazeta.com","passport.yandex.ru","okminigames.mail.ru","football-ukraine.com","captcha-api.yandex.ru","player-smotri.mail.ru","footballtransfer.com.ua","portalvirtualreality.ru"];
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
        const $scriptletArglistRefs$ = /* 299 */ "132;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;130;91;130;62;101;85;130;132;2,99;132;130;16,32,67,100,102;10,124;14,15;46,113;130;130;130;130;130;16,67,100,102;130;68,72;10,124;93;58;11,96;130;121;130;62;93;2;131;130;132;130;83;103;130;132;93;25,111;0;106;132;2,76,86;93;82,132;132;93;130;130;130;130;130;45;113;107;4;75;132;3;8,18,31,34,38,-122,122,123;132;57;93;132;59;112;23,48,63,111,133;130;132;92;130;125,126;48,63,111,133;107;25,33,53;35;130;36;0;54,64;132;23;22,24;1;132;132;132;71;108,109;69,70,111;12;62;132;132;93;93;125,126;120,-122;77;81;81;47;0;17;17;93;20,30;74;49;26;111;132;132;-122;127;10;125,126;55;-122;80;79;132;44;114,115,116,117;132;132;62;26;132;125,126;-122;93;81;125,126;37;2;90;23;61;0;130;-122;127;132;40;55;-122;-122;125,126;125,126;-122;79;88;97;48,63,111,133;93;-122;-122;93;6;-122;-122;-122;41;42;94,111;108,109;-122;56;132;-122;132;132;48,63,133;48,63,133;48,63,133;93;5;125,126;50;130;29;28,65;-122;-122;93;-122;110;-122;79;132;-122;74;12;25,27;118,119;132;43;-122;128,129;89,98;132;52;9;-122;55;132;132;93;108,109;110;132;132;84;-122;51,132;21;127;1;8,18,31,34,38;1;66;-122;13;132;-122;0;22;78;2;-122;125,126;-122;-122;60;127;19;39;87;8,18,31,34,38;132;-115,-116,-117,-118;73;48,63,111,133;108,109;130;2;-122;130;-122;130;132;132;132;-122;45;1;8,18,31,34,38,-122,122,123;1;104;95;105;-122;2;95;132;132;0;-122;132;0;-122;132;7";
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
    const $scriptletFunctions$ = /* 9 */
[closeWindow,removeCookie,hrefSanitizer,removeClass,removeNodeText,setAttr,setCookie,setLocalStorageItem,setCookieReload];
    const $scriptletArgs$ = /* 189 */ ["/^bda|^bltsr/","hurricane","isab","shedevrum-aab","yadb","a[href*=\"&link=https://\"]","?link","a[href*=\".mck\"][href*=\".ru/c/\"]","?u","a[href*=\".php?go=\"]","?go","a[href*=\"/away.php?\"]","?to -uricomponent","a[href*=\"/away?\"]","?to","a[href*=\"/bitrix/rk.php?goto=https\"]","?goto","a[href*=\"/redir.php?r=\"]","?r","a[href*=\"/redir/\"]","?exturl","?vzurl","a[href*=\"/redirect?to=\"]","a[href*=\"://click.opennet.ru/cgi-bin/\"]","a[href*=\"://opros.mosreg.ru/callback/survey\"][href*=\"/direct_url/?redirect=\"]","?redirect","a[href*=\"?action=redirect&url=\"]","?url","a[href*=\"?utm_\"][data-main-link]","+https","a[href*=\"deeplink=\"]","?deeplink","a[href*=\"goto=https\"]","a[href*=\"to=aHR0c\"]","?to -base64","a[href*=\"to=https\"]","a[href*=\"ulp=\"][target=\"_blank\"]","?ulp","a[href*=\"url=aHR0c\"]","?url -base64","a[href][rel*=\"sponsored\"][target=\"_blank\"]","a[href^=\"//www.ixbt.com/click/?c=\"]","[title]","a[href^=\"/engine/dwn\"]","?xf","a[href^=\"http:\"][aria-label^=\"Перейти на страницу источника\"]","a[href^=\"https://click.email4customers.com/Link?\"]","?args","a[href^=\"https://go.2038.pro/\"][href*=\"?dl=\"]","?dl","a[href^=\"https://pikabu.ru/\"][href*=\"?u=http\"]","a[href^=\"https://robot.mos.ru/\"]","a[href^=\"https://rutube.ru/api/routing/\"][href*=\"away?target\"]","?target","a[href^=\"https://soft2u.ru/url.php?to=\"]","a[href^=\"https://www.google.com/url?q=\"]","a[href^=\"https://www.gosuslugi.ru/ref?t=\"]","a[href^=\"https://www.livejournal.com/away?to=\"]","a[href^=\"https://www.youtube.com/redirect?event=\"][href*=\"&q=http\"]","?q","b-global-branding","html","noscroll","body","#text","РЕКЛАМНЫЙ БЛОК:","Реклама","Реклама:","a","/Установите Яндекс Браузер|Установить поиск Яндекса/","script","decodeURIComponent(escape","/A.d.b.|Adb-|A-d-b-|-Gua|dGua|dblo|tick|Адгу-/","/checkAds|initAdblockCheck/","/document.head.appendChild|document.referrer/","/gtag\\('event'/","MsgNoAD","addPlaceholder","checkAdBlock","clickedOnContent","error-report.com","getComputedStyle","isAdBlock","message_ads","nidclick","right_click","showBanner","style","epom-brend","lb-banner-height","rose.ixbt.com/banner/","._1z_ ._21_","",".comment-media .andropov-video video","loop","true",".content-custom [href*=\"?from=\"]:not([href*=\"utm\"])","target",".cycle-carousel-wrap > a.bottom_slide__item > img","src","[data-src]",".drag_element a[href*=\".html\"]",".owl-item > a > img","a[href*=\"?from=newsfeed\"][data-role=\"title-link\"]","img[src=\"https://overclockers.ru/assets/logo_gray_stub.gif\"]","video","controls","video[controls=\"controls\"]","KUF_SUGGESTER_SHOW_2_ITERATION","1","adBlockModal","age_confirmed","auth-required-win","callToRegisterClosed","clear","ok","reload","cookieAccepted","cookie_consent_shown","cookie_policy_accepted","110","geoid","32767","/","dontOverwrite","kuf_agr","lk-hasConsent","True","mose-banner","pg_SuggestGameFollow","promo-toast-tg","purchase_invite_shown","telegram_popup","Y","unity_pause_sso","yandexFull","__videoboxActive","false","browser-switch-trap-ts","{}","headerBannerShownAt","pg_GPbackVideo","on","rekl_modal_shown","video-autoplay","vipler.player.live.play","visits-count:plus-promotion","$remove$","/acestream/i","/dispatch","/p/?q=","utm","/adtag|creative_id/","/initTeasers|initVads/","is_age_verified","has-fullscreen-banner|has-right-direct",".public__root","stay","[href*=\"url=https\"]","#progress-value","data-timer","25","/DistributionLinkBro|-masonry-feed-/","return;try","/0,window|a0_0x|ad-provider|AdProvider|adManager|atOptions|disconnect|document,window|globalThis|isTrusted|parentNode\\.removeChild|Math\\.random|MAX_CLICKS|setTimeout/","getElementById","includes","referrer","/divExo|ex-over-top|214748364/","[href^=\"https://checklink.mail.ru/proxy?\"]","[href^=\"https://click.mail.ru/redir?u=\"]","[href^=\"https://clicker.mail.ru/redir?u=\"]","violatedDirective","[data-cke-saved-href^=\"https://checklink.mail.ru/proxy?\"]",".html-fishing a","html[lang]","href-sanitizer",".specialcontdown > a[href^=\"/download?downloadlink=\"]","?downloadlink",".specialcontdown > a","download","is_mobile","no","rwDemo","rws","[class^=\"articleBlockVideo_\"] video[src*=\"hsmedia.ru/\"]","video[class*=\"HLSPlayback_player\"]","\"Shadow","/agl007|blockPage/"];
    const $scriptletArglists$ = /* 134 */ ";0;1,0;1,1;1,2;1,3;1,4;2,5,6;2,7,8;2,9,10;2,11,12;2,13,14;2,15,16;2,17,18;2,19,20;2,19,21;2,22,14;2,23,14;2,24,25;2,26,27;2,28,29;2,30,31;2,32,16;2,33,34;2,35,14;2,36,37;2,38,39;2,40,16;2,41,42;2,43,44;2,45,29;2,46,47;2,48,49;2,50,8;2,51,27;2,52,53;2,54,14;2,55;2,56,14;2,57,14;2,58,59;3,60,61;3,62,63;4,64,65;4,64,66;4,64,67;4,68,69;4,70,71;4,70,72;4,70,73;4,70,74;4,70,75;4,70,76;4,70,77;4,70,78;4,70,79;4,70,80;4,70,81;4,70,82;4,70,83;4,70,84;4,70,85;4,70,86;4,87,88;4,87,89;4,87,90;5,91,87,92;5,93,94,95;5,96,97,95;5,98,99,100;5,101,97,95;5,102,99,100;5,103,97,95;5,104,99,100;5,105,106,95;5,107,106,95;6,108,109;6,110,95;6,111,109;6,112,95;6,113,95;6,114,115,92,116,109;6,117,95;6,118,109;6,119,120;6,121,122,123,124,109;6,125,95;6,126,127;6,128,95;6,129,95;6,130,95;6,131,109;6,132,133;6,134,109,92,116,109;6,135,95;7,136,137;7,138,139;7,140,109;7,141,142;7,143,139;7,144,137;7,145,137;7,146,147;0,148;0,149;0,150;0,151;0,152;4,70,153;8,154,109;3,155,156,157;2,158,27;5,159,160,161;4,70,162;4,70,163;4,70,164;4,70,165,166,167;4,87,168;2,169,27;2,170,8;2,171,8;4,70,172;2,173;5,174,97,95;5,175,176,95;2,177,178;5,179,180;6,181,182,92,116,109;7,183,147;7,184,147;5,185,106,95;5,186,106,95;4,70,187;4,70,188";
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
