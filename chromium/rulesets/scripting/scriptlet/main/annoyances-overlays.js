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

class ArglistParser {
    constructor(separatorChar = ',', mustQuote = false) {
        this.separatorChar = this.actualSeparatorChar = separatorChar;
        this.separatorCode = this.actualSeparatorCode = separatorChar.charCodeAt(0);
        this.mustQuote = mustQuote;
        this.quoteBeg = 0; this.quoteEnd = 0;
        this.argBeg = 0; this.argEnd = 0;
        this.separatorBeg = 0; this.separatorEnd = 0;
        this.transform = false;
        this.failed = false;
        this.reWhitespaceStart = /^\s+/;
        this.reWhitespaceEnd = /(?:^|\S)(\s+)$/;
        this.reOddTrailingEscape = /(?:^|[^\\])(?:\\\\)*\\$/;
        this.reTrailingEscapeChars = /\\+$/;
    }
    nextArg(pattern, beg = 0) {
        const len = pattern.length;
        this.quoteBeg = beg + this.leftWhitespaceCount(pattern.slice(beg));
        this.failed = false;
        const qc = pattern.charCodeAt(this.quoteBeg);
        if ( qc === 0x22 /* " */ || qc === 0x27 /* ' */ || qc === 0x60 /* ` */ ) {
            this.indexOfNextArgSeparator(pattern, qc);
            if ( this.argEnd !== len ) {
                this.quoteEnd = this.argEnd + 1;
                this.separatorBeg = this.separatorEnd = this.quoteEnd;
                this.separatorEnd += this.leftWhitespaceCount(pattern.slice(this.quoteEnd));
                if ( this.separatorEnd === len ) { return this; }
                if ( pattern.charCodeAt(this.separatorEnd) === this.separatorCode ) {
                    this.separatorEnd += 1;
                    return this;
                }
            }
        }
        this.indexOfNextArgSeparator(pattern, this.separatorCode);
        this.separatorBeg = this.separatorEnd = this.argEnd;
        if ( this.separatorBeg < len ) {
            this.separatorEnd += 1;
        }
        this.argEnd -= this.rightWhitespaceCount(pattern.slice(0, this.separatorBeg));
        this.quoteEnd = this.argEnd;
        if ( this.mustQuote ) {
            this.failed = true;
        }
        return this;
    }
    normalizeArg(s, char = '') {
        if ( char === '' ) { char = this.actualSeparatorChar; }
        let out = '';
        let pos = 0;
        while ( (pos = s.lastIndexOf(char)) !== -1 ) {
            out = s.slice(pos) + out;
            s = s.slice(0, pos);
            const match = this.reTrailingEscapeChars.exec(s);
            if ( match === null ) { continue; }
            const tail = (match[0].length & 1) !== 0
                ? match[0].slice(0, -1)
                : match[0];
            out = tail + out;
            s = s.slice(0, -match[0].length);
        }
        if ( out === '' ) { return s; }
        return s + out;
    }
    leftWhitespaceCount(s) {
        const match = this.reWhitespaceStart.exec(s);
        return match === null ? 0 : match[0].length;
    }
    rightWhitespaceCount(s) {
        const match = this.reWhitespaceEnd.exec(s);
        return match === null ? 0 : match[1].length;
    }
    indexOfNextArgSeparator(pattern, separatorCode) {
        this.argBeg = this.argEnd = separatorCode !== this.separatorCode
            ? this.quoteBeg + 1
            : this.quoteBeg;
        this.transform = false;
        if ( separatorCode !== this.actualSeparatorCode ) {
            this.actualSeparatorCode = separatorCode;
            this.actualSeparatorChar = String.fromCharCode(separatorCode);
        }
        while ( this.argEnd < pattern.length ) {
            const pos = pattern.indexOf(this.actualSeparatorChar, this.argEnd);
            if ( pos === -1 ) {
                return (this.argEnd = pattern.length);
            }
            if ( this.reOddTrailingEscape.test(pattern.slice(0, pos)) === false ) {
                return (this.argEnd = pos);
            }
            this.transform = true;
            this.argEnd = pos + 1;
        }
    }
}

class RangeParser {
    constructor(s) {
        this.not = s.charAt(0) === '!';
        if ( this.not ) { s = s.slice(1); }
        if ( s === '' ) { return; }
        const pos = s.indexOf('-');
        if ( pos !== 0 ) {
            this.min = this.max = parseInt(s, 10) || 0;
        }
        if ( pos !== -1 ) {
            this.max = parseInt(s.slice(pos + 1), 10) || Number.MAX_SAFE_INTEGER;
        }
    }
    unbound() {
        return this.min === undefined && this.max === undefined;
    }
    test(v) {
        const n = Math.min(Math.max(Number(v) || 0, 0), Number.MAX_SAFE_INTEGER);
        if ( this.min === this.max ) {
            return (this.min === undefined || n === this.min) !== this.not;
        }
        if ( this.min === undefined ) {
            return (n <= this.max) !== this.not;
        }
        if ( this.max === undefined ) {
            return (n >= this.min) !== this.not;
        }
        return (n >= this.min && n <= this.max) !== this.not;
    }
}

function abortCurrentScript(...args) {
    runAtHtmlElementFn(( ) => {
        abortCurrentScriptFn(...args);
    });
}

function abortCurrentScriptFn(
    target = '',
    needle = '',
    context = ''
) {
    if ( typeof target !== 'string' ) { return; }
    if ( target === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('abort-current-script', target, needle, context);
    const reNeedle = safe.patternToRegex(needle);
    const reContext = safe.patternToRegex(context);
    const thisScript = document.currentScript;
    const exceptionToken = getExceptionTokenFn();
    const scriptTexts = new WeakMap();
    const textContentGetter = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').get;
    const getScriptText = elem => {
        let text = textContentGetter.call(elem);
        if ( text.trim() !== '' ) { return text; }
        if ( scriptTexts.has(elem) ) { return scriptTexts.get(elem); }
        const [ , mime, content ] = /^data:([^,]*),(.+)$/.exec(elem.src.trim()) ||
            [ '', '', '' ];
        try {
            switch ( true ) {
            case mime.endsWith(';base64'):
                text = self.atob(content);
                break;
            default:
                text = self.decodeURIComponent(content);
                break;
            }
        } catch {
        }
        scriptTexts.set(elem, text);
        return text;
    };
    const validate = ( ) => {
        const e = document.currentScript;
        if ( e instanceof HTMLScriptElement === false ) { return; }
        if ( e === thisScript ) { return; }
        if ( context !== '' && reContext.test(e.src) === false ) { return; }
        if ( safe.logLevel > 1 && context !== '' ) {
            safe.uboLog(logPrefix, `Matched src\n${e.src}`);
        }
        const scriptText = getScriptText(e);
        if ( reNeedle.test(scriptText) === false ) { return; }
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Matched text\n${scriptText}`);
        }
        safe.uboLog(logPrefix, 'Aborted');
        throw new ReferenceError(exceptionToken);
    };
    let currentValue = trapPropertyFn(target, {
        get: function() {
            validate();
            return currentValue;
        },
        set: function(a) {
            validate();
            currentValue = a;
        }
    }, { canThrow: true });
}

function abortOnPropertyRead(
    chain = ''
) {
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('abort-on-property-read', chain);
    const exceptionToken = getExceptionTokenFn();
    const abort = function() {
        safe.uboLog(logPrefix, 'Aborted');
        throw new ReferenceError(exceptionToken);
    };
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            const desc = Object.getOwnPropertyDescriptor(owner, chain);
            if ( !desc || desc.get !== abort ) {
                Object.defineProperty(owner, chain, {
                    get: abort,
                    set: function(){}
                });
            }
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    makeProxy(owner, chain);
}

function abortOnPropertyWrite(
    prop = ''
) {
    if ( typeof prop !== 'string' ) { return; }
    if ( prop === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('abort-on-property-write', prop);
    const exceptionToken = getExceptionTokenFn();
    let owner = window;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        owner = owner[prop.slice(0, pos)];
        if ( owner instanceof Object === false ) { return; }
        prop = prop.slice(pos + 1);
    }
    delete owner[prop];
    Object.defineProperty(owner, prop, {
        set: function() {
            safe.uboLog(logPrefix, 'Aborted');
            throw new ReferenceError(exceptionToken);
        }
    });
}

function abortOnStackTrace(
    chain = '',
    needle = '',
    ...varargs
) {
    if ( typeof chain !== 'string' ) { return; }
    const safe = safeSelf();
    const needleDetails = safe.initPattern(needle, { canNegate: true });
    const extraArgs = safe.parseVarargs(varargs);
    if ( needle === '' ) { extraArgs.log = 'all'; }
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            let v = owner[chain];
            Object.defineProperty(owner, chain, {
                get: function() {
                    const log = safe.logLevel > 1 ? 'all' : 'match';
                    if ( matchesStackTraceFn(needleDetails, log) ) {
                        throw new ReferenceError(getExceptionTokenFn());
                    }
                    return v;
                },
                set: function(a) {
                    const log = safe.logLevel > 1 ? 'all' : 'match';
                    if ( matchesStackTraceFn(needleDetails, log) ) {
                        throw new ReferenceError(getExceptionTokenFn());
                    }
                    v = a;
                },
            });
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    makeProxy(owner, chain);
}

function adjustSetInterval(
    needleArg = '',
    delayArg = '',
    boostArg = ''
) {
    if ( typeof needleArg !== 'string' ) { return; }
    const safe = safeSelf();
    const reNeedle = safe.patternToRegex(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.001), 50)
        : 0.05;
    self.setInterval = new Proxy(self.setInterval, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
        }
    });
}

function adjustSetTimeout(
    needleArg = '',
    delayArg = '',
    boostArg = ''
) {
    if ( typeof needleArg !== 'string' ) { return; }
    const safe = safeSelf();
    const reNeedle = safe.patternToRegex(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.001), 50)
        : 0.05;
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
        }
    });
}

function collateFetchArgumentsFn(resource, options) {
    const safe = safeSelf();
    const props = [
        'body', 'cache', 'credentials', 'duplex', 'headers',
        'integrity', 'keepalive', 'method', 'mode', 'priority',
        'redirect', 'referrer', 'referrerPolicy', 'url'
    ];
    const out = {};
    if ( collateFetchArgumentsFn.collateKnownProps === undefined ) {
        collateFetchArgumentsFn.collateKnownProps = (src, out) => {
            for ( const prop of props ) {
                if ( src[prop] === undefined ) { continue; }
                out[prop] = src[prop];
            }
        };
    }
    if (
        typeof resource !== 'object' ||
        safe.Object_toString.call(resource) !== '[object Request]'
    ) {
        out.url = `${resource}`;
    } else {
        let clone;
        try {
            clone = safe.Request_clone.call(resource);
        } catch {
        }
        collateFetchArgumentsFn.collateKnownProps(clone || resource, out);
    }
    if ( typeof options === 'object' && options !== null ) {
        collateFetchArgumentsFn.collateKnownProps(options, out);
    }
    return out;
}

function generateContentFn(trusted, directive) {
    const safe = safeSelf();
    const randomize = len => {
        const chunks = [];
        let textSize = 0;
        do {
            const s = safe.Math_random().toString(36).slice(2);
            chunks.push(s);
            textSize += s.length;
        }
        while ( textSize < len );
        return chunks.join(' ').slice(0, len);
    };
    if ( directive === 'true' ) {
        return randomize(10);
    }
    if ( directive === 'emptyObj' ) {
        return '{}';
    }
    if ( directive === 'emptyArr' ) {
        return '[]';
    }
    if ( directive === 'emptyStr' ) {
        return '';
    }
    if ( directive.startsWith('length:') ) {
        const match = /^length:(\d+)(?:-(\d+))?$/.exec(directive);
        if ( match === null ) { return ''; }
        const min = parseInt(match[1], 10);
        const extent = safe.Math_max(parseInt(match[2], 10) || 0, min) - min;
        const len = safe.Math_min(min + extent * safe.Math_random(), 500000);
        return randomize(len | 0);
    }
    if ( directive.startsWith('war:') ) {
        if ( scriptletGlobals.warOrigin === undefined ) { return ''; }
        return new Promise(resolve => {
            const warOrigin = scriptletGlobals.warOrigin;
            const warName = directive.slice(4);
            const fullpath = [ warOrigin, '/', warName ];
            const warSecret = scriptletGlobals.warSecret;
            if ( warSecret !== undefined ) {
                fullpath.push('?secret=', warSecret);
            }
            const warXHR = new safe.XMLHttpRequest();
            warXHR.responseType = 'text';
            warXHR.onloadend = ev => {
                resolve(ev.target.responseText || '');
            };
            warXHR.open('GET', fullpath.join(''));
            warXHR.send();
        }).catch(( ) => '');
    }
    if ( directive.startsWith('join:') ) {
        const parts = directive.slice(7)
                .split(directive.slice(5, 7))
                .map(a => generateContentFn(trusted, a));
        return parts.some(a => a instanceof Promise)
            ? Promise.all(parts).then(parts => parts.join(''))
            : parts.join('');
    }
    if ( trusted ) {
        return directive;
    }
    return '';
}

function getExceptionTokenFn() {
    const token = getRandomTokenFn();
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
}

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

function jsonPrune(
    rawPrunePaths = '',
    rawNeedlePaths = '',
    stackNeedle = '',
    ...varargs
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune', rawPrunePaths, rawNeedlePaths, stackNeedle);
    const stackNeedleDetails = safe.initPattern(stackNeedle, { canNegate: true });
    const extraArgs = safe.parseVarargs(varargs);
    proxyApplyFn('JSON.parse', function(context) {
        const objBefore = context.reflect();
        if ( rawPrunePaths === '' ) {
            safe.uboLog(logPrefix, safe.JSON_stringify(objBefore, null, 2));
        }
        const objAfter = objectPruneFn(
            objBefore,
            rawPrunePaths,
            rawNeedlePaths,
            stackNeedleDetails,
            extraArgs
        );
        if ( objAfter === undefined ) { return objBefore; }
        safe.uboLog(logPrefix, 'Pruned');
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `After pruning:\n${safe.JSON_stringify(objAfter, null, 2)}`);
        }
        return objAfter;
    });
}

function matchObjectPropertiesFn(propNeedles, ...objs) {
    const safe = safeSelf();
    const matched = [];
    for ( const obj of objs ) {
        if ( obj instanceof Object === false ) { continue; }
        for ( const [ prop, details ] of propNeedles ) {
            let value = obj[prop];
            if ( value === undefined ) { continue; }
            if ( typeof value !== 'string' ) {
                try { value = safe.JSON_stringify(value); }
                catch { }
                if ( typeof value !== 'string' ) { continue; }
            }
            if ( safe.testPattern(details, value) === false ) { return; }
            matched.push(`${prop}: ${value}`);
        }
    }
    return matched;
}

function matchesStackTraceFn(
    needleDetails,
    logLevel = ''
) {
    const safe = safeSelf();
    const exceptionToken = getExceptionTokenFn();
    const error = new safe.Error(exceptionToken);
    const docURL = new URL(self.location.href);
    docURL.hash = '';
    // Normalize stack trace
    const reLine = /(.*?@)?(\S+)(:\d+):\d+\)?$/;
    const lines = [];
    for ( let line of safe.String_split.call(error.stack, /[\n\r]+/) ) {
        if ( line.includes(exceptionToken) ) { continue; }
        line = line.trim();
        const match = safe.RegExp_exec.call(reLine, line);
        if ( match === null ) { continue; }
        let url = match[2];
        if ( url.startsWith('(') ) { url = url.slice(1); }
        if ( url === docURL.href ) {
            url = 'inlineScript';
        } else if ( url.startsWith('<anonymous>') ) {
            url = 'injectedScript';
        }
        let fn = match[1] !== undefined
            ? match[1].slice(0, -1)
            : line.slice(0, match.index).trim();
        if ( fn.startsWith('at') ) { fn = fn.slice(2).trim(); }
        let rowcol = match[3];
        lines.push(' ' + `${fn} ${url}${rowcol}:1`.trim());
    }
    lines[0] = `stackDepth:${lines.length-1}`;
    const stack = lines.join('\t');
    const r = needleDetails.matchAll !== true &&
        safe.testPattern(needleDetails, stack);
    if (
        logLevel === 'all' ||
        logLevel === 'match' && r ||
        logLevel === 'nomatch' && !r
    ) {
        safe.uboLog(stack.replace(/\t/g, '\n'));
    }
    return r;
}

function noEvalIf(
    needle = ''
) {
    if ( typeof needle !== 'string' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('noeval-if', needle);
    const reNeedle = safe.patternToRegex(needle);
    proxyApplyFn('eval', function(context) {
        const { callArgs } = context;
        const a = String(callArgs[0]);
        if ( needle !== '' && reNeedle.test(a) ) {
            safe.uboLog(logPrefix, 'Prevented:\n', a);
            return;
        }
        if ( needle === '' || safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Not prevented:\n', a);
        }
        return context.reflect();
    });
}

function noWindowOpenIf(
    pattern = '',
    delay = '',
    decoy = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('no-window-open-if', pattern, delay, decoy);
    const targetMatchResult = pattern.startsWith('!') === false;
    if ( targetMatchResult === false ) {
        pattern = pattern.slice(1);
    }
    const rePattern = safe.patternToRegex(pattern);
    const autoRemoveAfter = (parseFloat(delay) || 0) * 1000;
    const setTimeout = self.setTimeout;
    const createDecoy = function(tag, urlProp, url) {
        const decoyElem = document.createElement(tag);
        decoyElem[urlProp] = url;
        decoyElem.style.setProperty('height','1px', 'important');
        decoyElem.style.setProperty('position','fixed', 'important');
        decoyElem.style.setProperty('top','-1px', 'important');
        decoyElem.style.setProperty('width','1px', 'important');
        document.body.appendChild(decoyElem);
        setTimeout(( ) => { decoyElem.remove(); }, autoRemoveAfter);
        return decoyElem;
    };
    const noopFunc = function(){};
    proxyApplyFn('open', function open(context) {
        if ( pattern === 'debug' && safe.logLevel !== 0 ) {
            debugger; // eslint-disable-line no-debugger
            return context.reflect();
        }
        const { callArgs } = context;
        const haystack = callArgs.join(' ');
        if ( rePattern.test(haystack) !== targetMatchResult ) {
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `Allowed (${callArgs.join(', ')})`);
            }
            return context.reflect();
        }
        safe.uboLog(logPrefix, `Prevented (${callArgs.join(', ')})`);
        if ( delay === '' ) { return null; }
        if ( decoy === 'blank' ) {
            callArgs[0] = 'about:blank';
            const r = context.reflect();
            setTimeout(( ) => { r.close(); }, autoRemoveAfter);
            return r;
        }
        const decoyElem = decoy === 'obj'
            ? createDecoy('object', 'data', ...callArgs)
            : createDecoy('iframe', 'src', ...callArgs);
        let popup = decoyElem.contentWindow;
        if ( typeof popup === 'object' && popup !== null ) {
            Object.defineProperty(popup, 'closed', { value: false });
        } else {
            popup = new Proxy(self, {
                get: function(target, prop, ...args) {
                    if ( prop === 'closed' ) { return false; }
                    const r = Reflect.get(target, prop, ...args);
                    if ( typeof r === 'function' ) { return noopFunc; }
                    return r;
                },
                set: function(...args) {
                    return Reflect.set(...args);
                },
            });
        }
        if ( safe.logLevel !== 0 ) {
            popup = new Proxy(popup, {
                get: function(target, prop, ...args) {
                    const r = Reflect.get(target, prop, ...args);
                    safe.uboLog(logPrefix, `popup / get ${prop} === ${r}`);
                    if ( typeof r === 'function' ) {
                        return (...args) => { return r.call(target, ...args); };
                    }
                    return r;
                },
                set: function(target, prop, value, ...args) {
                    safe.uboLog(logPrefix, `popup / set ${prop} = ${value}`);
                    return Reflect.set(target, prop, value, ...args);
                },
            });
        }
        return popup;
    });
}

function objectFindOwnerFn(
    root,
    path,
    prune = false
) {
    const safe = safeSelf();
    let owner = root;
    let chain = path;
    for (;;) {
        if ( typeof owner !== 'object' || owner === null  ) { return false; }
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            if ( prune === false ) {
                return safe.Object_hasOwn(owner, chain);
            }
            let modified = false;
            if ( chain === '*' ) {
                for ( const key in owner ) {
                    if ( safe.Object_hasOwn(owner, key) === false ) { continue; }
                    delete owner[key];
                    modified = true;
                }
            } else if ( safe.Object_hasOwn(owner, chain) ) {
                delete owner[chain];
                modified = true;
            }
            return modified;
        }
        const prop = chain.slice(0, pos);
        const next = chain.slice(pos + 1);
        let found = false;
        if ( prop === '[-]' && Array.isArray(owner) ) {
            let i = owner.length;
            while ( i-- ) {
                if ( objectFindOwnerFn(owner[i], next) === false ) { continue; }
                owner.splice(i, 1);
                found = true;
            }
            return found;
        }
        if ( prop === '{-}' && owner instanceof Object ) {
            for ( const key of Object.keys(owner) ) {
                if ( objectFindOwnerFn(owner[key], next) === false ) { continue; }
                delete owner[key];
                found = true;
            }
            return found;
        }
        if (
            prop === '[]' && Array.isArray(owner) ||
            prop === '{}' && owner instanceof Object ||
            prop === '*' && owner instanceof Object
        ) {
            for ( const key of Object.keys(owner) ) {
                if (objectFindOwnerFn(owner[key], next, prune) === false ) { continue; }
                found = true;
            }
            return found;
        }
        if ( safe.Object_hasOwn(owner, prop) === false ) { return false; }
        owner = owner[prop];
        chain = chain.slice(pos + 1);
    }
}

function objectPruneFn(
    obj,
    rawPrunePaths,
    rawNeedlePaths,
    stackNeedleDetails = { matchAll: true },
    extraArgs = {}
) {
    if ( typeof rawPrunePaths !== 'string' ) { return; }
    const safe = safeSelf();
    const prunePaths = rawPrunePaths !== ''
        ? safe.String_split.call(rawPrunePaths, / +/)
        : [];
    const needlePaths = prunePaths.length !== 0 && rawNeedlePaths !== ''
        ? safe.String_split.call(rawNeedlePaths, / +/)
        : [];
    if ( stackNeedleDetails.matchAll !== true ) {
        if ( matchesStackTraceFn(stackNeedleDetails, extraArgs.logstack) === false ) {
            return;
        }
    }
    if ( objectPruneFn.mustProcess === undefined ) {
        objectPruneFn.mustProcess = (root, needlePaths) => {
            for ( const needlePath of needlePaths ) {
                if ( objectFindOwnerFn(root, needlePath) === false ) {
                    return false;
                }
            }
            return true;
        };
    }
    if ( prunePaths.length === 0 ) { return; }
    let outcome = 'nomatch';
    if ( objectPruneFn.mustProcess(obj, needlePaths) ) {
        for ( const path of prunePaths ) {
            if ( objectFindOwnerFn(obj, path, true) ) {
                outcome = 'match';
            }
        }
    }
    if ( outcome === 'match' ) { return obj; }
}

function offIdleFn(id) {
    if ( self.requestIdleCallback ) {
        return self.cancelIdleCallback(id);
    }
    return self.cancelAnimationFrame(id);
}

function onIdleFn(fn, options) {
    if ( self.requestIdleCallback ) {
        return self.requestIdleCallback(fn, options);
    }
    return self.requestAnimationFrame(fn);
}

function parsePropertiesToMatchFn(propsToMatch, implicit = '') {
    const safe = safeSelf();
    const needles = new Map();
    if ( propsToMatch === undefined || propsToMatch === '' ) { return needles; }
    const options = { canNegate: true };
    for ( const needle of safe.String_split.call(propsToMatch, /\s+/) ) {
        let [ prop, pattern ] = safe.String_split.call(needle, ':');
        if ( prop === '' ) { continue; }
        if ( pattern !== undefined && /[^$\w -]/.test(prop) ) {
            prop = `${prop}:${pattern}`;
            pattern = undefined;
        }
        if ( pattern !== undefined ) {
            needles.set(prop, safe.initPattern(pattern, options));
        } else if ( implicit !== '' ) {
            needles.set(implicit, safe.initPattern(prop, options));
        }
    }
    return needles;
}

function parseReplaceFn(s) {
    if ( s.charCodeAt(0) !== 0x2F /* / */ ) { return; }
    const parser = new ArglistParser('/');
    parser.nextArg(s, 1);
    let pattern = s.slice(parser.argBeg, parser.argEnd);
    if ( parser.transform ) {
        pattern = parser.normalizeArg(pattern);
    }
    if ( pattern === '' ) { return; }
    parser.nextArg(s, parser.separatorEnd);
    let replacement = s.slice(parser.argBeg, parser.argEnd);
    if ( parser.separatorEnd === parser.separatorBeg ) { return; }
    if ( parser.transform ) {
        replacement = parser.normalizeArg(replacement);
    }
    const flags = s.slice(parser.separatorEnd);
    try {
        return { re: new RegExp(pattern, flags), replacement };
    } catch {
    }
}

function preventAddEventListener(
    type = '',
    pattern = '',
    ...varargs
) {
    const safe = safeSelf();
    const extraArgs = safe.parseVarargs(varargs);
    const logPrefix = safe.makeLogPrefix('prevent-addEventListener', type, pattern);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const targetSelector = extraArgs.elements || undefined;
    const elementMatches = elem => {
        if ( targetSelector === 'window' ) { return elem === window; }
        if ( targetSelector === 'document' ) { return elem === document; }
        if ( elem && elem.matches && elem.matches(targetSelector) ) { return true; }
        const elems = Array.from(document.querySelectorAll(targetSelector));
        return elems.includes(elem);
    };
    const elementDetails = elem => {
        if ( elem instanceof Window ) { return 'window'; }
        if ( elem instanceof Document ) { return 'document'; }
        if ( elem instanceof Element === false ) { return '?'; }
        const parts = [];
        // https://github.com/uBlockOrigin/uAssets/discussions/17907#discussioncomment-9871079
        const id = String(elem.id);
        if ( id !== '' ) { parts.push(`#${CSS.escape(id)}`); }
        for ( let i = 0; i < elem.classList.length; i++ ) {
            parts.push(`.${CSS.escape(elem.classList.item(i))}`);
        }
        for ( let i = 0; i < elem.attributes.length; i++ ) {
            const attr = elem.attributes.item(i);
            if ( attr.name === 'id' ) { continue; }
            if ( attr.name === 'class' ) { continue; }
            parts.push(`[${CSS.escape(attr.name)}="${attr.value}"]`);
        }
        return parts.join('');
    };
    const shouldPrevent = (thisArg, type, handler) => {
        const matchesType = safe.RegExp_test.call(reType, type);
        const matchesHandler = safe.RegExp_test.call(rePattern, handler);
        const matchesEither = matchesType || matchesHandler;
        const matchesBoth = matchesType && matchesHandler;
        if ( safe.logLevel > 1 && matchesEither ) {
            debugger; // eslint-disable-line no-debugger
        }
        if ( matchesBoth && targetSelector !== undefined ) {
            if ( elementMatches(thisArg) === false ) { return false; }
        }
        return matchesBoth;
    };
    const proxyFn = function(context) {
        const { callArgs, thisArg } = context;
        let t, h;
        try {
            t = String(callArgs[0]);
            if ( typeof callArgs[1] === 'function' ) {
                h = String(safe.Function_toString(callArgs[1]));
            } else if ( typeof callArgs[1] === 'object' && callArgs[1] !== null ) {
                if ( typeof callArgs[1].handleEvent === 'function' ) {
                    h = String(safe.Function_toString(callArgs[1].handleEvent));
                }
            } else {
                h = String(callArgs[1]);
            }
        } catch {
        }
        if ( type === '' && pattern === '' ) {
            safe.uboLog(logPrefix, `Called: ${t}\n${h}\n${elementDetails(thisArg)}`);
        } else if ( shouldPrevent(thisArg, t, h) ) {
            return safe.uboLog(logPrefix, `Prevented: ${t}\n${h}\n${elementDetails(thisArg)}`);
        }
        return context.reflect();
    };
    const protect = owner => {
        const { addEventListener } = owner;
        Object.defineProperty(owner, 'addEventListener', {
            set() { },
            get() { return addEventListener; }
        });
    };
    runAt(( ) => {
        proxyApplyFn('EventTarget.prototype.addEventListener', proxyFn);
        if ( extraArgs.protect ) { protect(EventTarget.prototype); }
        if ( Object.hasOwn(document, 'addEventListener') ) {
            proxyApplyFn('document.addEventListener', proxyFn);
            if ( extraArgs.protect ) { protect(document); }
        }
        if ( Object.hasOwn(window, 'addEventListener') ) {
            proxyApplyFn('window.addEventListener', proxyFn);
            if ( extraArgs.protect ) { protect(window); }
        }
    }, extraArgs.runAt);
}

function preventFetch(...args) {
    preventFetchFn(false, ...args);
}

function preventFetchFn(
    trusted = false,
    propsToMatch = '',
    responseBody = '',
    responseType = '',
    ...varargs
) {
    const safe = safeSelf();
    const setTimeout = self.setTimeout;
    const scriptletName = `${trusted ? 'trusted-' : ''}prevent-fetch`;
    const logPrefix = safe.makeLogPrefix(
        scriptletName,
        propsToMatch,
        responseBody,
        responseType
    );
    const extraArgs = safe.parseVarargs(varargs);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const validResponseProps = {
        ok: [ false, true ],
        status: [ 403 ],
        statusText: [ '', 'Not Found' ],
        type: [ 'basic', 'cors', 'default', 'error', 'opaque' ],
    };
    const responseProps = {
        statusText: { value: 'OK' },
    };
    const responseHeaders = {};
    if ( /^\{.*\}$/.test(responseType) ) {
        try {
            Object.entries(JSON.parse(responseType)).forEach(([ p, v ]) => {
                if ( p === 'headers' && trusted ) {
                    Object.assign(responseHeaders, v);
                    return;
                }
                if ( validResponseProps[p] === undefined ) { return; }
                if ( validResponseProps[p].includes(v) === false ) { return; }
                responseProps[p] = { value: v };
            });
        }
        catch { }
    } else if ( responseType !== '' ) {
        if ( validResponseProps.type.includes(responseType) ) {
            responseProps.type = { value: responseType };
        }
    }
    proxyApplyFn('fetch', function fetch(context) {
        const { callArgs } = context;
        const details = collateFetchArgumentsFn(...callArgs);
        if ( safe.logLevel > 1 || propsToMatch === '' && responseBody === '' ) {
            const out = Array.from(Object.entries(details)).map(a => `${a[0]}:${a[1]}`);
            safe.uboLog(logPrefix, `Called: ${out.join('\n')}`);
        }
        if ( propsToMatch === '' && responseBody === '' ) {
            return context.reflect();
        }
        const matched = matchObjectPropertiesFn(propNeedles, details);
        if ( matched === undefined || matched.length === 0 ) {
            return context.reflect();
        }
        return Promise.resolve(generateContentFn(trusted, responseBody)).then(text => {
            safe.uboLog(logPrefix, `Prevented with response "${text}"`);
            const headers = Object.assign({}, responseHeaders);
            if ( headers['content-length'] === undefined ) {
                headers['content-length'] = text.length;
            }
            const response = new Response(text, { headers });
            const props = Object.assign(
                { url: { value: details.url } },
                responseProps
            );
            safe.Object_defineProperties(response, props);
            if ( extraArgs.throttle ) {
                return new Promise(resolve => {
                    setTimeout(( ) => { resolve(response); }, extraArgs.throttle);
                });
            }
            return response;
        });
    });
}

function preventSetInterval(
    needleRaw = '',
    delayRaw = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-setInterval', needleRaw, delayRaw);
    const needleNot = needleRaw.charAt(0) === '!';
    const reNeedle = safe.patternToRegex(needleNot ? needleRaw.slice(1) : needleRaw);
    const range = new RangeParser(delayRaw);
    proxyApplyFn('setInterval', function(context) {
        const { callArgs } = context;
        const a = callArgs[0] instanceof Function
            ? safe.String(safe.Function_toString(callArgs[0]))
            : safe.String(callArgs[0]);
        const b = callArgs[1];
        if ( needleRaw === '' && range.unbound() ) {
            safe.uboLog(logPrefix, `Called:\n${a}\n${b}`);
            return context.reflect();
        }
        if ( reNeedle.test(a) !== needleNot && range.test(b) ) {
            callArgs[0] = function(){};
            safe.uboLog(logPrefix, `Prevented:\n${a}\n${b}`);
        }
        return context.reflect();
    });
}

function preventSetTimeout(
    needleRaw = '',
    delayRaw = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-setTimeout', needleRaw, delayRaw);
    const needleNot = needleRaw.charAt(0) === '!';
    const reNeedle = safe.patternToRegex(needleNot ? needleRaw.slice(1) : needleRaw);
    const range = new RangeParser(delayRaw);
    proxyApplyFn('setTimeout', function(context) {
        const { callArgs } = context;
        const a = callArgs[0] instanceof Function
            ? safe.String(safe.Function_toString(callArgs[0]))
            : safe.String(callArgs[0]);
        const b = callArgs[1];
        if ( needleRaw === '' && range.unbound() ) {
            safe.uboLog(logPrefix, `Called:\n${a}\n${b}`);
            return context.reflect();
        }
        if ( reNeedle.test(a) !== needleNot && range.test(b) ) {
            callArgs[0] = function(){};
            safe.uboLog(logPrefix, `Prevented:\n${a}\n${b}`);
        }
        return context.reflect();
    });
}

function preventXhr(...args) {
    preventXhrFn(false, ...args);
}

function preventXhrFn(
    trusted = false,
    propsToMatch = '',
    directive = ''
) {
    if ( typeof propsToMatch !== 'string' ) { return; }
    const safe = safeSelf();
    const scriptletName = trusted ? 'trusted-prevent-xhr' : 'prevent-xhr';
    const logPrefix = safe.makeLogPrefix(scriptletName, propsToMatch, directive);
    const xhrInstances = new WeakMap();
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const warOrigin = scriptletGlobals.warOrigin;
    const safeDispatchEvent = (xhr, type) => {
        try {
            xhr.dispatchEvent(new Event(type));
        } catch {
        }
    };
    proxyApplyFn('XMLHttpRequest.prototype.open', function(context) {
        const { thisArg, callArgs } = context;
        xhrInstances.delete(thisArg);
        const [ method, url, ...args ] = callArgs;
        if ( warOrigin !== undefined && url.startsWith(warOrigin) ) {
            return context.reflect();
        }
        const haystack = { method, url };
        if ( propsToMatch === '' && directive === '' ) {
            safe.uboLog(logPrefix, `Called: ${safe.JSON_stringify(haystack, null, 2)}`);
            return context.reflect();
        }
        if ( matchObjectPropertiesFn(propNeedles, haystack) ) {
            const xhrDetails = Object.assign(haystack, {
                xhr: thisArg,
                defer: args.length === 0 || !!args[0],
                directive,
                headers: {
                    'date': '',
                    'content-type': '',
                    'content-length': '',
                },
                url: haystack.url,
                props: {
                    response: { value: '' },
                    responseText: { value: '' },
                    responseXML: { value: null },
                },
            });
            xhrInstances.set(thisArg, xhrDetails);
        }
        return context.reflect();
    });
    proxyApplyFn('XMLHttpRequest.prototype.send', function(context) {
        const { thisArg } = context;
        const xhrDetails = xhrInstances.get(thisArg);
        if ( xhrDetails === undefined ) {
            return context.reflect();
        }
        xhrDetails.headers['date'] = (new Date()).toUTCString();
        let xhrText = '';
        switch ( thisArg.responseType ) {
        case 'arraybuffer':
            xhrDetails.props.response.value = new ArrayBuffer(0);
            xhrDetails.headers['content-type'] = 'application/octet-stream';
            break;
        case 'blob':
            xhrDetails.props.response.value = new Blob([]);
            xhrDetails.headers['content-type'] = 'application/octet-stream';
            break;
        case 'document': {
            const parser = new DOMParser();
            const doc = parser.parseFromString('', 'text/html');
            xhrDetails.props.response.value = doc;
            xhrDetails.props.responseXML.value = doc;
            xhrDetails.headers['content-type'] = 'text/html';
            break;
        }
        case 'json':
            xhrDetails.props.response.value = {};
            xhrDetails.props.responseText.value = '{}';
            xhrDetails.headers['content-type'] = 'application/json';
            break;
        default: {
            if ( directive === '' ) { break; }
            xhrText = generateContentFn(trusted, xhrDetails.directive);
            if ( xhrText instanceof Promise ) {
                xhrText = xhrText.then(text => {
                    xhrDetails.props.response.value = text;
                    xhrDetails.props.responseText.value = text;
                });
            } else {
                xhrDetails.props.response.value = xhrText;
                xhrDetails.props.responseText.value = xhrText;
            }
            xhrDetails.headers['content-type'] = 'text/plain';
            break;
        }
        }
        if ( xhrDetails.defer === false ) {
            xhrDetails.headers['content-length'] = `${xhrDetails.props.response.value}`.length;
            Object.defineProperties(xhrDetails.xhr, {
                readyState: { value: 4 },
                responseURL: { value: xhrDetails.url },
                status: { value: 200 },
                statusText: { value: 'OK' },
            });
            Object.defineProperties(xhrDetails.xhr, xhrDetails.props);
            return;
        }
        Promise.resolve(xhrText).then(( ) => xhrDetails).then(details => {
            Object.defineProperties(details.xhr, {
                readyState: { value: 1, configurable: true },
                responseURL: { value: xhrDetails.url },
            });
            safeDispatchEvent(details.xhr, 'readystatechange');
            return details;
        }).then(details => {
            xhrDetails.headers['content-length'] = `${details.props.response.value}`.length;
            Object.defineProperties(details.xhr, {
                readyState: { value: 2, configurable: true },
                status: { value: 200 },
                statusText: { value: 'OK' },
            });
            safeDispatchEvent(details.xhr, 'readystatechange');
            return details;
        }).then(details => {
            Object.defineProperties(details.xhr, {
                readyState: { value: 3, configurable: true },
            });
            Object.defineProperties(details.xhr, details.props);
            safeDispatchEvent(details.xhr, 'readystatechange');
            return details;
        }).then(details => {
            Object.defineProperties(details.xhr, {
                readyState: { value: 4 },
            });
            safeDispatchEvent(details.xhr, 'readystatechange');
            safeDispatchEvent(details.xhr, 'load');
            safeDispatchEvent(details.xhr, 'loadend');
            safe.uboLog(logPrefix, `Prevented with response:\n${details.xhr.response}`);
        });
    });
    proxyApplyFn('XMLHttpRequest.prototype.getResponseHeader', function(context) {
        const { thisArg } = context;
        const xhrDetails = xhrInstances.get(thisArg);
        if ( xhrDetails === undefined || thisArg.readyState < thisArg.HEADERS_RECEIVED ) {
            return context.reflect();
        }
        const headerName = `${context.callArgs[0]}`;
        const value = xhrDetails.headers[headerName.toLowerCase()];
        if ( value !== undefined && value !== '' ) { return value; }
        return null;
    });
    proxyApplyFn('XMLHttpRequest.prototype.getAllResponseHeaders', function(context) {
        const { thisArg } = context;
        const xhrDetails = xhrInstances.get(thisArg);
        if ( xhrDetails === undefined || thisArg.readyState < thisArg.HEADERS_RECEIVED ) {
            return context.reflect();
        }
        const out = [];
        for ( const [ name, value ] of Object.entries(xhrDetails.headers) ) {
            if ( !value ) { continue; }
            out.push(`${name}: ${value}`);
        }
        if ( out.length !== 0 ) { out.push(''); }
        return out.join('\r\n');
    });
}

function proxyApplyFn(
    target = '',
    handler = '',
    options = {}
) {
    let context = globalThis;
    let prop = target;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        context = context[prop.slice(0, pos)];
        if ( context instanceof Object === false ) { return; }
        prop = prop.slice(pos+1);
    }
    const fn = context[prop];
    if ( typeof fn !== 'function' ) { return; }
    if ( proxyApplyFn.CtorContext === undefined ) {
        proxyApplyFn.ctorContexts = [];
        proxyApplyFn.CtorContext = class {
            constructor(...args) {
                this.init(...args);
            }
            init(callFn, callArgs) {
                this.callFn = callFn;
                this.callArgs = callArgs;
                return this;
            }
            reflect() {
                const r = Reflect.construct(this.callFn, this.callArgs);
                this.callFn = this.callArgs = this.private = undefined;
                proxyApplyFn.ctorContexts.push(this);
                return r;
            }
            static factory(...args) {
                return proxyApplyFn.ctorContexts.length !== 0
                    ? proxyApplyFn.ctorContexts.pop().init(...args)
                    : new proxyApplyFn.CtorContext(...args);
            }
        };
        proxyApplyFn.applyContexts = [];
        proxyApplyFn.ApplyContext = class {
            constructor(...args) {
                this.init(...args);
            }
            init(callFn, thisArg, callArgs) {
                this.callFn = callFn;
                this.thisArg = thisArg;
                this.callArgs = callArgs;
                return this;
            }
            reflect() {
                const r = Reflect.apply(this.callFn, this.thisArg, this.callArgs);
                this.callFn = this.thisArg = this.callArgs = this.private = undefined;
                proxyApplyFn.applyContexts.push(this);
                return r;
            }
            static factory(...args) {
                return proxyApplyFn.applyContexts.length !== 0
                    ? proxyApplyFn.applyContexts.pop().init(...args)
                    : new proxyApplyFn.ApplyContext(...args);
            }
        };
        proxyApplyFn.isCtor = new Map();
        proxyApplyFn.proxies = new WeakMap();
        if ( (options.skipToString || proxyApplyFn.skipToString) !== true ) {
            proxyApplyFn.nativeToString = Function.prototype.toString;
            const proxiedToString = new Proxy(Function.prototype.toString, {
                apply(target, thisArg) {
                    let proxied = thisArg;
                    for(;;) {
                        const fn = proxyApplyFn.proxies.get(proxied);
                        if ( fn === undefined ) { break; }
                        proxied = fn;
                    }
                    return proxyApplyFn.nativeToString.call(proxied);
                }
            });
            proxyApplyFn.proxies.set(proxiedToString, proxyApplyFn.nativeToString);
            Function.prototype.toString = proxiedToString;
        }
    }
    if ( proxyApplyFn.isCtor.has(target) === false ) {
        proxyApplyFn.isCtor.set(target, fn.prototype?.constructor === fn);
    }
    const proxyDetails = {
        apply(target, thisArg, args) {
            return handler(proxyApplyFn.ApplyContext.factory(target, thisArg, args));
        }
    };
    if ( proxyApplyFn.isCtor.get(target) ) {
        proxyDetails.construct = function(target, args) {
            return handler(proxyApplyFn.CtorContext.factory(target, args));
        };
    }
    const proxiedTarget = new Proxy(fn, proxyDetails);
    proxyApplyFn.proxies.set(proxiedTarget, fn);
    context[prop] = proxiedTarget;
}

function removeAttr(
    rawToken = '',
    rawSelector = '',
    behavior = ''
) {
    if ( typeof rawToken !== 'string' ) { return; }
    if ( rawToken === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('remove-attr', rawToken, rawSelector, behavior);
    const tokens = safe.String_split.call(rawToken, /\s*\|\s*/);
    const selector = tokens
        .map(a => `${rawSelector}[${CSS.escape(a)}]`)
        .join(',');
    if ( safe.logLevel > 1 ) {
        safe.uboLog(logPrefix, `Target selector:\n\t${selector}`);
    }
    const asap = /\basap\b/.test(behavior);
    let timerId;
    const rmattrAsync = ( ) => {
        if ( timerId !== undefined ) { return; }
        timerId = onIdleFn(( ) => {
            timerId = undefined;
            rmattr();
        }, { timeout: 17 });
    };
    const rmattr = ( ) => {
        if ( timerId !== undefined ) {
            offIdleFn(timerId);
            timerId = undefined;
        }
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                for ( const attr of tokens ) {
                    if ( node.hasAttribute(attr) === false ) { continue; }
                    node.removeAttribute(attr);
                    safe.uboLog(logPrefix, `Removed attribute '${attr}'`);
                }
            }
        } catch {
        }
    };
    const mutationHandler = mutations => {
        if ( timerId !== undefined ) { return; }
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
        asap ? rmattr() : rmattrAsync();
    };
    const start = ( ) => {
        rmattr();
        if ( /\bstay\b/.test(behavior) === false ) { return; }
        const observer = new MutationObserver(mutationHandler);
        observer.observe(document, {
            attributes: true,
            attributeFilter: tokens,
            childList: true,
            subtree: true,
        });
    };
    runAt(( ) => { start(); }, safe.String_split.call(behavior, /\s+/));
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
    if ( safeSelf.safe ) {
        return safeSelf.safe;
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

function setConstant(
    ...args
) {
    setConstantFn(false, ...args);
}

function setConstantFn(
    trusted = false,
    chain = '',
    rawValue = '',
    ...varargs
) {
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-constant', chain, rawValue);
    const extraArgs = safe.parseVarargs(varargs);
    function setConstant(chain, rawValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            return new Proxy(fn, {
                defineProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.defineProperty(...arguments);
                    }
                    return true;
                },
                deleteProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.deleteProperty(...arguments);
                    }
                    return true;
                },
                get(target, prop) {
                    if ( prop === 'toString' ) {
                        return function() {
                            return `function ${trappedProp}() { [native code] }`;
                        }.bind(null);
                    }
                    return Reflect.get(...arguments);
                },
            });
        };
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        let normalValue = validateConstantFn(trusted, rawValue, extraArgs);
        if ( rawValue === 'noopFunc' || rawValue === 'trueFunc' || rawValue === 'falseFunc' ) {
            normalValue = cloakFunc(normalValue);
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (normalValue !== undefined && normalValue !== null) &&
                (typeof v !== typeof normalValue);
            if ( aborted ) {
                safe.uboLog(logPrefix, `Aborted because value set to ${v}`);
            }
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : normalValue) === false ) { return; }
            const odesc = safe.Object_getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof safe.Object ) {
                owner[prop] = normalValue;
                if ( odesc.get instanceof Function ) {
                    prevGetter = odesc.get;
                }
                if ( odesc.set instanceof Function ) {
                    prevSetter = odesc.set;
                }
            }
            try {
                safe.Object_defineProperty(owner, prop, {
                    configurable,
                    get() {
                        if ( prevGetter !== undefined ) {
                            prevGetter();
                        }
                        return handler.getter();
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
                safe.uboLog(logPrefix, 'Trap installed');
            } catch(ex) {
                safe.uboErr(logPrefix, ex);
            }
        };
        const trapChain = function(owner, chain) {
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                trapProp(owner, chain, false, {
                    v: undefined,
                    init: function(v) {
                        if ( mustAbort(v) ) { return false; }
                        this.v = v;
                        return true;
                    },
                    getter: function() {
                        if ( document.currentScript === thisScript ) {
                            return this.v;
                        }
                        safe.uboLog(logPrefix, 'Property read');
                        return normalValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        normalValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof safe.Object || typeof v === 'object' && v !== null ) {
                trapChain(v, chain);
                return;
            }
            trapProp(owner, prop, true, {
                v: undefined,
                init: function(v) {
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return this.v;
                },
                setter: function(a) {
                    this.v = a;
                    if ( a instanceof safe.Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, rawValue);
    }, extraArgs.runAt);
}

function trapPropertyFn(propChain, handler, options = {}) {
    if ( propChain === '' ) { return; }
    let owner = self;
    let prop = propChain;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        owner = owner[prop.slice(0, pos)];
        if ( owner instanceof Object === false ) { return; }
        prop = prop.slice(pos + 1);
    }
    const safe = safeSelf();
    if ( trapPropertyFn.db === undefined ) {
        trapPropertyFn.db = new WeakMap();
        trapPropertyFn.entryFromContext = (owner, prop) => {
            const handlers = trapPropertyFn.db.get(owner);
            return handlers?.get(prop);
        };
        trapPropertyFn.getter = (owner, prop) => {
            const entry = trapPropertyFn.entryFromContext(owner, prop);
            if ( entry === undefined ) { return; }
            let r = entry.value;
            for ( const desc of entry.stack ) {
                try { r = desc.get(); } catch (e) {
                    if ( entry.canThrow ) { throw e; }
                }
            }
            return r;
        };
        trapPropertyFn.setter = (owner, prop, value) => {
            const entry = trapPropertyFn.entryFromContext(owner, prop);
            if ( entry === undefined ) { return; }
            entry.value = value;
            for ( const desc of entry.stack ) {
                try { desc.set(value); } catch (e) {
                    if ( entry.canThrow ) { throw e; }
                }
            }
        };
    }
    const { db } = trapPropertyFn;
    const handlers = db.get(owner) || new Map();
    if ( handlers.size === 0 ) {
        db.set(owner, handlers);
    }
    const entry = handlers.get(prop) || {
        value: owner[prop],
        stack: [],
    };
    entry.stack.push(handler);
    if ( entry.stack.length > 1 ) { return entry.value; }
    Object.assign(entry, options);
    handlers.set(prop, entry);
    const desc = safe.Object_getOwnPropertyDescriptor(owner, prop);
    if ( desc instanceof safe.Object ) {
        if ( desc.get || desc.set ) {
            entry.stack.push(desc);
        }
    }
    try {
        safe.Object_defineProperty(owner, prop, {
            get() {
                return trapPropertyFn.getter(owner, prop);
            },
            set(value) {
                trapPropertyFn.setter(owner, prop, value);
            }
        });
    } catch {
    }
    return entry.value;
}

function trustedReplaceArgument(
    propChain = '',
    argposRaw = '',
    argraw = '',
    ...varargs
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-argument', propChain, argposRaw, argraw);
    const argoffset = parseInt(argposRaw, 10) || 0;
    const extraArgs = safe.parseVarargs(varargs);
    let replacer;
    if ( argraw.startsWith('repl:/') ) {
        const parsed = parseReplaceFn(argraw.slice(5));
        if ( parsed === undefined ) { return; }
        replacer = arg => `${arg}`.replace(replacer.re, replacer.replacement);
        Object.assign(replacer, parsed);
    } else if ( argraw.startsWith('add:') ) {
        const delta = parseFloat(argraw.slice(4));
        if ( isNaN(delta) ) { return; }
        replacer = arg => Number(arg) + delta;
    } else {
        const value = validateConstantFn(true, argraw, extraArgs);
        replacer = ( ) => value;
    }
    const reCondition = extraArgs.condition
        ? safe.patternToRegex(`${extraArgs.condition}`)
        : /^/;
    const getArg = context => {
        if ( argposRaw === 'this' ) { return context.thisArg; }
        const { callArgs } = context;
        const argpos = argoffset >= 0 ? argoffset : callArgs.length - argoffset;
        if ( argpos < 0 || argpos >= callArgs.length ) { return; }
        context.private = { argpos };
        return callArgs[argpos];
    };
    const setArg = (context, value) => {
        if ( argposRaw === 'this' ) {
            if ( value !== context.thisArg ) {
                context.thisArg = value;
            }
        } else if ( context.private ) {
            context.callArgs[context.private.argpos] = value;
        }
    };
    proxyApplyFn(propChain, function(context) {
        if ( argposRaw === '' ) {
            safe.uboLog(logPrefix, `Arguments:\n${context.callArgs.join('\n')}`);
            return context.reflect();
        }
        const argBefore = getArg(context);
        if ( extraArgs.condition !== undefined ) {
            if ( safe.RegExp_test.call(reCondition, argBefore) === false ) {
                return context.reflect();
            }
        }
        const argAfter = replacer(argBefore);
        if ( argAfter !== argBefore ) {
            setArg(context, argAfter);
            safe.uboLog(logPrefix, `Replaced argument:\nBefore: ${JSON.stringify(argBefore)}\nAfter: ${argAfter}`);
        }
        return context.reflect();
    });
}

function trustedReplaceOutboundText(
    propChain = '',
    rawPattern = '',
    rawReplacement = '',
    ...varargs
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-outbound-text', propChain, rawPattern, rawReplacement, ...varargs);
    const rePattern = safe.patternToRegex(rawPattern);
    const replacement = rawReplacement.startsWith('json:')
        ? safe.JSON_parse(rawReplacement.slice(5))
        : rawReplacement;
    const extraArgs = safe.parseVarargs(varargs);
    const reCondition = safe.patternToRegex(extraArgs.condition || '');
    proxyApplyFn(propChain, function(context) {
        const encodedTextBefore = context.reflect();
        let textBefore = encodedTextBefore;
        if ( extraArgs.encoding === 'base64' ) {
            try { textBefore = self.atob(encodedTextBefore); }
            catch { return encodedTextBefore; }
        }
        if ( rawPattern === '' ) {
            safe.uboLog(logPrefix, 'Decoded outbound text:\n', textBefore);
            return encodedTextBefore;
        }
        reCondition.lastIndex = 0;
        if ( reCondition.test(textBefore) === false ) { return encodedTextBefore; }
        const textAfter = textBefore.replace(rePattern, replacement);
        if ( textAfter === textBefore ) { return encodedTextBefore; }
        safe.uboLog(logPrefix, 'Matched and replaced');
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Modified decoded outbound text:\n', textAfter);
        }
        let encodedTextAfter = textAfter;
        if ( extraArgs.encoding === 'base64' ) {
            encodedTextAfter = self.btoa(textAfter);
        }
        return encodedTextAfter;
    });
}

function trustedReplaceXhrResponse(
    pattern = '',
    replacement = '',
    propsToMatch = '',
    ...varargs
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-xhr-response', pattern, replacement, propsToMatch);
    const xhrInstances = new WeakMap();
    if ( pattern === '*' ) { pattern = '.*'; }
    const rePattern = safe.patternToRegex(pattern);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const extraArgs = safe.parseVarargs(varargs);
    const reIncludes = extraArgs.includes ? safe.patternToRegex(extraArgs.includes) : null;
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(method, url, ...args) {
            const outerXhr = this;
            const xhrDetails = { method, url };
            let outcome = 'match';
            if ( propNeedles.size !== 0 ) {
                if ( matchObjectPropertiesFn(propNeedles, xhrDetails) === undefined ) {
                    outcome = 'nomatch';
                }
            }
            if ( outcome === 'match' ) {
                if ( safe.logLevel > 1 ) {
                    safe.uboLog(logPrefix, `Matched "propsToMatch"`);
                }
                xhrInstances.set(outerXhr, xhrDetails);
            }
            return super.open(method, url, ...args);
        }
        get response() {
            const innerResponse = super.response;
            const xhrDetails = xhrInstances.get(this);
            if ( xhrDetails === undefined ) {
                return innerResponse;
            }
            const responseLength = typeof innerResponse === 'string'
                ? innerResponse.length
                : undefined;
            if ( xhrDetails.lastResponseLength !== responseLength ) {
                xhrDetails.response = undefined;
                xhrDetails.lastResponseLength = responseLength;
            }
            if ( xhrDetails.response !== undefined ) {
                return xhrDetails.response;
            }
            if ( typeof innerResponse !== 'string' ) {
                return (xhrDetails.response = innerResponse);
            }
            if ( reIncludes && reIncludes.test(innerResponse) === false ) {
                return (xhrDetails.response = innerResponse);
            }
            const textBefore = innerResponse;
            const textAfter = textBefore.replace(rePattern, replacement);
            if ( textAfter !== textBefore ) {
                safe.uboLog(logPrefix, 'Match');
            }
            return (xhrDetails.response = textAfter);
        }
        get responseText() {
            const response = this.response;
            if ( typeof response !== 'string' ) {
                return super.responseText;
            }
            return response;
        }
    };
}

function trustedSetConstant(
    ...args
) {
    setConstantFn(true, ...args);
}

function trustedSuppressNativeMethod(
    methodPath = '',
    signature = '',
    how = '',
    stack = ''
) {
    if ( methodPath === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-suppress-native-method', methodPath, signature, how, stack);
    const signatureArgs = safe.String_split.call(signature, /\s*\|\s*/).map(v => {
        if ( /^".*"$/.test(v) ) {
            return { type: 'pattern', re: safe.patternToRegex(v.slice(1, -1)) };
        }
        if ( /^\/.+\/$/.test(v) ) {
            return { type: 'pattern', re: safe.patternToRegex(v) };
        }
        if ( v === 'false' ) {
            return { type: 'exact', value: false };
        }
        if ( v === 'true' ) {
            return { type: 'exact', value: true };
        }
        if ( v === 'null' ) {
            return { type: 'exact', value: null };
        }
        if ( v === 'undefined' ) {
            return { type: 'exact', value: undefined };
        }
    });
    const stackNeedle = safe.initPattern(stack, { canNegate: true });
    proxyApplyFn(methodPath, function(context) {
        const { callArgs } = context;
        if ( signature === '' ) {
            safe.uboLog(logPrefix, `Arguments:\n${callArgs.join('\n')}`);
            return context.reflect();
        }
        for ( let i = 0; i < signatureArgs.length; i++ ) {
            const signatureArg = signatureArgs[i];
            if ( signatureArg === undefined ) { continue; }
            const targetArg = i < callArgs.length ? callArgs[i] : undefined;
            if ( signatureArg.type === 'exact' ) {
                if ( targetArg !== signatureArg.value ) {
                    return context.reflect();
                }
            }
            if ( signatureArg.type === 'pattern' ) {
                if ( safe.RegExp_test.call(signatureArg.re, targetArg) === false ) {
                    return context.reflect();
                }
            }
        }
        if ( stackNeedle.matchAll !== true ) {
            const logLevel = safe.logLevel > 1 ? 'all' : '';
            if ( matchesStackTraceFn(stackNeedle, logLevel) === false ) {
                return context.reflect();
            }
        }
        if ( how === 'debug' ) {
            debugger; // eslint-disable-line no-debugger
            return context.reflect();
        }
        safe.uboLog(logPrefix, `Suppressed:\n${callArgs.join('\n')}`);
        if ( how === 'abort' ) {
            throw new ReferenceError();
        }
    });
}

function validateConstantFn(trusted, raw, extraArgs = {}) {
    const safe = safeSelf();
    let value;
    if ( raw === 'undefined' ) {
        value = undefined;
    } else if ( raw === 'false' ) {
        value = false;
    } else if ( raw === 'true' ) {
        value = true;
    } else if ( raw === 'null' ) {
        value = null;
    } else if ( raw === "''" || raw === '' ) {
        value = '';
    } else if ( raw === '[]' || raw === 'emptyArr' ) {
        value = [];
    } else if ( raw === '{}' || raw === 'emptyObj' ) {
        value = {};
    } else if ( raw === 'noopFunc' ) {
        value = function(){};
    } else if ( raw === 'trueFunc' ) {
        value = function(){ return true; };
    } else if ( raw === 'falseFunc' ) {
        value = function(){ return false; };
    } else if ( raw === 'throwFunc' ) {
        value = function(){ throw ''; };
    } else if ( /^-?\d+$/.test(raw) ) {
        value = parseInt(raw);
        if ( isNaN(raw) ) { return; }
        if ( Math.abs(raw) > 0x7FFF ) { return; }
    } else if ( trusted ) {
        if ( raw.startsWith('json:') ) {
            try { value = safe.JSON_parse(raw.slice(5)); } catch { return; }
        } else if ( raw.startsWith('{') && raw.endsWith('}') ) {
            try { value = safe.JSON_parse(raw).value; } catch { return; }
        }
    } else {
        return;
    }
    if ( extraArgs.as !== undefined ) {
        if ( extraArgs.as === 'function' ) {
            return ( ) => value;
        } else if ( extraArgs.as === 'callback' ) {
            return ( ) => (( ) => value);
        } else if ( extraArgs.as === 'resolved' ) {
            return Promise.resolve(value);
        } else if ( extraArgs.as === 'rejected' ) {
            return Promise.reject(value);
        }
    }
    return value;
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
    const $scriptletHostnames$ = /* 2102 */ ["x.com","xe.gr","anix.*","clk.sh","ddys.*","dood.*","epn.bz","evz.ro","ft.com","hqq.to","hqq.tv","kmo.to","mbs.jp","mio.to","netu.*","rp5.by","sgd.de","shz.al","t3.com","tfp.is","ttv.pl","tvn.pl","voe.sx","wjx.cn","xtv.cz","1mg.com","app.com","appd.at","bbc.com","bflix.*","bold.dk","c315.cn","cbr.com","cine.to","clk.ink","cnn.com","coag.pl","csid.ro","dnj.com","doods.*","edn.com","gats.io","gmx.com","gmx.net","humo.be","ibps.in","ijr.com","itvn.pl","jfdb.jp","lifo.gr","mdpr.jp","med1.de","mgsm.pl","onna.kr","pnj.com","pobre.*","rgj.com","sbot.cf","t3.chat","tvn7.pl","veev.to","vox.com","vsco.co","vtbe.to","wjx.top","ydr.com","10tv.com","2219.net","9tsu.vip","abola.pt","allen.in","arras.io","arrax.io","asiatv.*","bcs16.ro","blikk.hu","citas.in","cmg24.pl","cnki.net","daum.net","delfi.lt","dngz.net","dooood.*","embed.su","emol.com","espn.com","flixhq.*","gakki.me","glam.com","hemas.pl","hk01.com","j91.asia","jetv.xyz","jpnn.com","khou.com","kukaj.io","libgen.*","likey.me","mhwg.org","nsmb.com","pisr.org","poedb.tw","railf.jp","romet.pl","rukim.id","s.awa.fm","sbflix.*","senpa.io","sflix.ca","sflix.is","sflix.to","sj-r.com","tadu.com","talpo.it","tepat.id","tvn24.pl","ufret.jp","utour.me","vembed.*","vidsrc.*","virpe.cc","wtsp.com","xnxx.com","yuuki.me","zaui.com","zdnet.de","zgbk.com","1shows.ru","47news.jp","adpres.ro","ahzaa.net","aicesu.cn","anauk.net","aniwave.*","archon.gg","artsy.net","autodoc.*","b4usa.com","bmovies.*","brainly.*","brutal.io","cda-hd.cc","cpuid.com","critic.de","ctrl.blog","d000d.com","d0o0d.com","deepl.com","digi24.ro","do0od.com","do7go.com","doply.net","dramaqu.*","earth.com","eater.com","edurev.in","felico.pl","filhub.gr","fin24.com","flagle.io","fmovies.*","fotor.com","freep.com","globo.com","gmx.co.uk","hdrez.com","hianime.*","ibomma.pw","imooc.com","invado.pl","jootc.com","juejin.cn","keybr.com","lesoir.be","lexlog.pl","lohud.com","lublin.eu","lunas.pro","m4uhd.net","mangaku.*","matzoo.pl","mcloud.to","mm9841.cc","mocah.org","naver.com","nebula.tv","news24.jp","newsme.gr","ocala.com","ophim.vip","peekme.cc","player.pl","pling.com","quora.com","ruwix.com","s0urce.io","scmp3.org","seexh.com","sflix2.to","shein.com","sopot.net","tbs.co.jp","tides.net","tiempo.hn","tomshw.it","turbo1.co","txori.com","uemeds.cn","uihtm.com","umk.co.jp","uplod.net","veblr.com","velicu.eu","venea.net","vezess.hu","vide0.net","vidplay.*","vinaurl.*","virpe.com","watson.ch","watson.de","weibo.com","wired.com","women.com","world4.eu","wstream.*","x-link.pl","x-news.pl","xhbig.com","yeane.org","ytv.co.jp","yuque.com","zefoy.com","zgywyd.cn","zhihu.com","ziare.com","360doc.com","3xyaoi.com","4media.com","52bdys.com","699pic.com","actvid.com","adslink.pw","all3do.com","allsmo.com","analizy.pl","ananweb.jp","ancient.eu","animedao.*","auto-doc.*","bdb.com.pl","bejson.com","bembed.net","bestcam.tv","boards.net","boston.com","bpcj.or.jp","broflix.cc","caller.com","camcaps.to","chillx.top","citroen.pl","clujust.ro","crewus.net","crichype.*","curbed.com","d0000d.com","debeste.de","deezer.com","dejure.org","depedlps.*","dlions.pro","dlnews.com","drkrok.com","dxmaps.com","e-sushi.fr","earnload.*","ebc.com.br","embedv.net","esaral.com","fauxid.com","fflogs.com","filefox.cc","filiser.eu","film4e.com","fjordd.com","fnbrjp.com","foodie.com","fullxh.com","galinos.gr","gaz.com.br","ggwash.org","goerie.com","gomovies.*","gplinks.co","grunge.com","hdtoday.so","hienzo.com","hindipix.*","hitcena.pl","hoca4u.com","img999.com","ing-sat.hu","javbix.com","jdnews.com","jeu2048.fr","jeyran.net","jnews5.com","kapiert.de","knshow.com","lcpdfr.com","ldnews.com","legacy.com","listatv.pl","lofter.com","looper.com","love4u.net","lwlies.com","mashed.com","masuit.com","maxroll.gg","mbalib.com","mdlinx.com","medium.com","megaxh.com","menrec.com","milfzr.com","mongri.net","motogon.ru","mpnnow.com","naaree.com","neobux.com","neowin.net","newspao.gr","njjzxl.net","nny360.com","nypost.com","opedge.com","oploverz.*","pc3mag.com","peugeot.pl","piklodz.pl","pixnet.net","pixwox.com","pjstar.com","pokeos.com","polyvsp.ru","protest.eu","qidian.com","quotev.com","racked.com","rdsong.com","riwyat.com","rrstar.com","salina.com","sbenny.com","sbface.com","scribd.com","sdewery.me","sexpox.com","skuola.net","tcpalm.com","texte.work","tiktok.com","tmnews.com","top1iq.com","totemat.pl","tumblr.com","tvzingvn.*","uol.com.br","utamap.com","utaten.com","vcstar.com","vidply.com","vvide0.com","wader.toys","watchx.top","wormate.io","wpchen.net","xhamster.*","xhopen.com","xhspot.com","yamibo.com","youmath.it","zalukaj.io","zingtvhd.*","zingvntv.*","zulily.com","102bank.com","123movies.*","9xbuddy.com","abstream.to","accgroup.vn","adevarul.ro","affbank.com","amlesson.ru","anikaitv.to","aniwatch.to","antena3.com","aoezone.net","arcanum.com","asia2tv.com","ask4movie.*","autodoc24.*","badayak.com","bdcraft.net","bg-gledai.*","bhaskar.com","bianity.net","bimiacg.net","bitcine.app","bluphim.com","boke112.com","bypass.city","canale.live","cattime.com","cepuluh.com","civitai.com","civitai.red","clockks.com","cmjornal.pt","cnblogs.com","coinurl.net","comikey.com","cookhero.gr","d4armory.io","day-hoc.org","decider.com","disheye.com","djelfa.info","dogtime.com","dramacute.*","ds2play.com","duracell.de","elahmad.com","embasic.pro","embtaku.pro","eoreuni.com","epitesti.ro","esologs.com","esscctv.com","europixhd.*","explore.com","ezmanga.net","f2movies.ru","faptiti.com","flixrave.to","fosshub.com","fosters.com","fruit01.xyz","funivie.org","gamegame.kr","geotips.net","goalup.live","goodhub.xyz","hianimez.to","hidemywp.co","hongxiu.com","hotleak.vip","hotleaks.tv","howjsay.com","hoyolab.com","htrnews.com","hukmatpro.*","hulnews.top","ideapod.com","ilife97.com","infokik.com","inverse.com","j-lyric.net","jafekri.com","javbest.xyz","javgrab.com","jio.pftv.ws","keytube.net","kinston.com","kitguru.net","koltry.life","kpopsea.com","ktm2day.com","l2gamers.cl","lalawin.com","lasexta.com","lataifas.ro","leetcode.cn","logonews.cn","lolle21.com","lover93.net","maduras.vip","magesy.blog","malekal.com","mangatoon.*","manhwa18.cc","masrawy.com","maxt.church","mediafax.ro","milenio.com","mobiflip.de","moviepl.xyz","mrbenne.com","nettv4u.com","newsbook.pl","ngelmat.net","novelism.jp","novelza.com","ntuplay.xyz","ntvspor.net","nulled.life","nytimes.com","odiario.com","ohli365.vip","ohmygirl.ml","olarila.com","ontools.net","oreilly.com","otakudesu.*","pagesix.com","pancreas.ro","pandurul.ro","pashplus.jp","phimfit.com","pinterest.*","pngitem.com","poipiku.com","poli-vsp.ru","polygon.com","postype.com","promotor.pl","putlocker.*","qrcode.best","racevpn.com","radioony.fm","redding.com","romviet.com","rubystm.com","rubyvid.com","runmods.com","safetxt.net","satcesc.com","sbbrisk.com","sctimes.com","shaamtv.com","sherdog.com","shinbhu.net","shinchu.net","skionline.*","smalley.com","spectank.jp","starbene.it","stbnetu.xyz","strcloud.in","swtimes.com","taxo-acc.pl","teachoo.com","techgyd.com","tekstowo.pl","thelist.com","thotsbay.tv","tinyppt.com","tistory.com","titulky.com","topfaps.com","trakteer.id","trentino.pl","tuborstb.co","tunegate.me","turbolab.it","tv.bdix.app","tvn24bis.pl","tvnstyle.pl","tvnturbo.pl","twitter.com","unixhow.com","untitle.org","upstream.to","uta-net.com","uticaod.com","v6embed.xyz","vedantu.com","veneto.info","vgembed.com","vidembed.me","videovard.*","viewing.nyc","voirfilms.*","wattpad.com","wawlist.com","wikihow.com","winaero.com","winmeen.com","wired.co.uk","wishflix.cc","wizcase.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhtotal.com","xhwide5.com","xossipy.com","ymovies.vip","zerogpt.net","ziperto.com","zonatmo.com","30edu.com.cn","4x4earth.com","abril.com.br","abysscdn.com","adbypass.org","afrikmag.com","agrointel.ro","allmovie.com","amarillo.com","amestrib.com","amtraker.com","anikototv.to","anime2you.de","anisearch.de","anisubindo.*","athletic.net","autoembed.cc","avdelphi.com","bigulnews.tv","bilibili.com","bitblokes.de","bonobono.com","bphimmoi.net","ciweimao.com","cjonline.com","codedosa.com","cool-etv.net","crewbase.net","cronista.com","descopera.ro","dispatch.com","dollarvr.com","doodstream.*","ds2video.com","dushu.qq.com","einthusan.tv","elektroda.pl","elheraldo.hn","enternity.gr","fabricjs.com","fairyabc.com","fightful.com","filmzone.com","foodviva.com","forplayx.ink","fosspost.org","fpmmusic.com","fxstreet.com","gamerant.com","gardenia.net","gay69.stream","gdplayertv.*","gearside.com","geniusjw.com","ggeguide.com","ggulpass.com","globaledu.jp","gnt24365.net","habuteru.com","hindi-gk.com","ieltsliz.com","ikorektor.pl","indystar.com","inquirer.net","intramed.net","itvnextra.pl","javjavhd.com","jbjbgame.com","jconline.com","jobskaro.com","joysound.com","jsonline.com","kaystls.site","kentucky.com","knoxnews.com","kolnovel.com","korona.co.jp","kritichno.bg","kurazone.net","kurosave.com","kusonime.com","lazyadmin.nl","leekduck.com","lifestory.hu","ligowiec.net","linkmate.xyz","liverpool.no","lookmovie.ag","lookmovie2.*","lowcygier.pl","mangainn.net","megacloud.tv","megapixl.com","megatube.xxx","meteo.org.pl","mimikama.org","mineskin.org","mmamania.com","moneyguru.co","movieweb.com","msubplix.com","myflixerz.to","myoplay.club","napiszar.com","njherald.com","nonton78.com","novagente.pt","novelpia.com","nowcoder.com","npnews24.com","nsfwzone.xyz","nwherald.com","nzbstars.com","olacast.live","omnisets.com","oricon.co.jp","otakukan.com","ouasafat.com","pal-item.com","palemoon.org","paxdei.th.gl","pcpobierz.pl","pelispedia.*","pentruea.com","photopea.com","picallow.com","pitesti24.ro","playbill.com","playmogo.com","pornhd8k.net","portalwrc.pl","powerline.io","priberam.org","pupupul.site","putlocker.pe","radarbox.com","radichubu.jp","reflectim.fr","relet365.com","revenue.land","rocklyric.jp","sarthaks.com","sbnation.com","shumilou.com","sidereel.com","solarmovie.*","sportnews.to","sportsnet.ca","steptalk.org","streamsb.net","streamtape.*","sussytoons.*","suzylu.co.uk","techsini.com","tecmundo.net","telegram.com","th-world.com","theblaze.com","thegamer.com","theverge.com","thizissam.in","topeuropix.*","transinfo.pl","tritinia.com","tutlehd4.com","tvnfabula.pl","tvtropes.org","ultraten.net","unidivers.fr","urbharat.xyz","usatoday.com","valuexh.life","vid2faf.site","vidplay.site","vidtube.site","visse.com.br","voeunblk.com","volokit2.com","webnovel.com","webwereld.nl","wrosinski.pl","wzamrani.com","xclient.info","xhaccess.com","xhadult4.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhamster46.*","xhdate.world","yhocdata.com","0123movies.ch","4kwebplay.xyz","7misr4day.com","adslayuda.com","alfred.camera","animedrive.hu","animeunity.it","anisearch.com","aniwatchtv.to","ark-unity.com","artesacro.org","asheville.com","audiotools.in","autophorie.de","azcentral.com","aztravels.net","blindhelp.net","blog.csdn.net","blog.kwick.de","bluesnews.com","bongdaplus.vn","box-manga.com","bricksrus.com","broncoshq.com","buienradar.nl","cantonrep.com","casertace.net","centrumher.eu","chieftain.com","chowhound.com","city-data.com","cocomanga.com","coffeeapps.ir","colourxh.site","cyberalert.gr","dddance.party","desertsun.com","desijugar.net","deutschaj.com","dlmovies.link","dooodster.com","downfile.site","eca-anime.net","economica.net","emailfake.com","eplayer.click","fantricks.com","firescans.xyz","flory4all.com","flyertalk.com","fontsfree.pro","foxaholic.com","foxteller.com","fraudnavi.com","full-anime.fr","galesburg.com","gaminplay.com","getective.com","gezimanya.com","gmarket.co.kr","goodbakery.ru","goupstate.com","gukjenews.com","helldivers.io","hellokpop.com","hillsdale.net","holakikou.com","howtogeek.com","hutchnews.com","icy-veins.com","ideas0419.com","infodifesa.it","instagram.com","iptv4best.com","jk-market.com","kapitalis.com","kashinavi.com","kitsapsun.com","kpopjjang.com","laptopmag.com","leeyiding.com","libertatea.ro","limametti.com","listeamed.net","live.b-c-e.us","liveonsat.com","livetennis.it","longecity.org","loverslab.com","m.youtube.com","makeuseof.com","mangaid.click","maxedtech.com","mediafire.com","mediotejo.net","megaplay.buzz","megawypas.com","memangbau.com","meteoblue.com","mocospace.com","movie-web.app","movie4kto.net","mt07-forum.de","mzzcloud.life","nbcsports.com","neilpatel.com","neoseeker.com","newbernsj.com","newportri.com","newschief.com","neyrologos.gr","nicematin.com","oakridger.com","oceanplay.org","oklahoman.com","okuhanako.net","otakudesu.org","otempo.com.br","perplexity.ai","phrasemix.com","piecesauto.fr","plural.jor.br","polsatnews.pl","polyflore.net","proboards.com","protopage.com","putlocker.vip","qqwebplay.xyz","radartest.com","radio5.com.pl","readnovel.com","recordnet.com","routenote.com","sachonthi.com","sat-charts.eu","savvytime.com","scrolller.com","shopomo.co.uk","shortform.com","slashfilm.com","slashgear.com","solotrend.net","southcloud.tv","spookshow.net","sportsupa.com","sporttotal.tv","statesman.com","store.kde.org","streamvid.net","studyadda.com","suedkurier.de","swtorlogs.com","t.17track.net","techkings.org","temperatur.nu","theintell.com","theledger.com","thememypc.net","thethings.com","thewpclub.net","tiermaker.com","timponline.ro","tomsguide.com","top.howfn.com","torontosom.ca","trangchu.news","trojmiasto.pl","tweaktown.com","ubuntudde.com","unikampus.net","uniqueten.net","unlockxh4.com","up4stream.com","uwayapply.com","vid-guard.com","videohelp.com","vidstream.pro","vipstreams.in","visionias.net","vnexpress.net","voe-unblock.*","voeunblck.com","vpnmentor.com","vtube.network","warning.or.kr","waves4you.com","wikibious.com","www.ntv.co.jp","xfce-look.org","xhbranch5.com","xhchannel.com","xhplanet1.com","xhplanet2.com","xhvictory.com","xiaomi4mi.com","yoyofilmeys.*","zerohedge.com","zwei-euro.com","99bitcoins.com","adnan-tech.com","ajanstv.com.tr","allcryptoz.net","ananda-yoga.ro","androidmtk.com","anime-drama.jp","animefire.plus","arlinadzgn.com","audiostereo.pl","auto-treff.com","autopareri.com","bandwagon.asia","battle-one.com","bharatavani.in","bigdatauni.com","bikesell.co.kr","bingotingo.com","blog.naver.com","brownsboys.com","btvnovinite.bg","cafe.naver.com","cdramalove.com","chronologia.pl","cincinnati.com","clasicotas.org","clipartmax.com","coinsparty.com","coloradoan.com","comingsoon.net","crunchyscan.fr","curseforge.com","daily-jeff.com","dailycomet.com","dailyworld.com","daotranslate.*","dba-oracle.com","demolandia.net","developpez.com","diaforetiko.gr","doc.mbalib.com","dodge-forum.eu","dreamstime.com","droidtekno.com","dzwignice.info","edailybuzz.com","emturbovid.com","enduro-mtb.com","erinsakura.com","estadao.com.br","eveningsun.com","evreporter.com","fimfiction.net","freeforums.net","fucktube4k.com","funnyordie.com","galleryxh.site","gamebanana.com","gearjunkie.com","genesistls.com","gnome-look.org","golfdigest.com","guiasaude.info","heraldnews.com","houmatoday.com","how-to-pc.info","icourse163.org","ideaberita.com","impots.gouv.fr","indeonline.com","indiatimes.com","infoplease.com","intergate.info","iphonecake.com","iwanichi.co.jp","jacksonsun.com","japan-fans.com","javsubtitle.co","jeniusplay.com","jpopsingles.eu","kangmartho.com","karsaz-law.com","katosatoshi.jp","kicknews.today","kuchniaplus.pl","kutub3lpdf.com","lcsun-news.com","leakedzone.com","learninsta.com","lenconnect.com","lendagames.com","linux-apps.com","lowkeytech.com","mail.yahoo.com","majorgeeks.com","malybelgrad.pl","mangareader.to","mangaschan.net","marionstar.com","megapastes.com","mindmegette.hu","mixmods.com.br","mixstreams.top","mkv-pastes.com","moegirl.org.cn","moneyexcel.com","monroenews.com","moviesapi.club","movingxh.world","musicradar.com","musixmatch.com","myhtebooks.com","naijagists.com","naplesnews.com","naukridisha.in","ndtvprofit.com","nekopoi.web.id","netuplayer.top","news-press.com","news.17173.com","news.dwango.jp","news.ntv.co.jp","newsherald.com","newsleader.com","nickiswift.com","nogizaka46.com","ofuxico.com.br","oggiscuola.com","oparana.com.br","openfinanza.it","otvfoco.com.br","paidiatreio.gr","payeer-gift.ru","pecasauto24.pt","pekintimes.com","peliculas24.me","playerx.stream","prepostseo.com","pushsquare.com","rapid-cloud.co","readawrite.com","realpython.com","remixsearch.es","reviewmeta.com","riftherald.com","rightnonel.com","rivestream.org","rozbor-dila.cz","runningnews.gr","screenrant.com","scsun-news.com","selfstudys.com","seriesperu.com","shelbystar.com","shrinkearn.com","slideshare.net","sokolow-mlp.pl","starzunion.com","szkolawohyn.pl","techjunkie.com","techus.website","tekloggers.com","tennessean.com","the-leader.com","the-review.com","theflixertv.to","thegleaner.com","thehawkeye.com","themebanks.com","thestar.com.my","thezealots.org","timeanddate.de","timeanddate.no","topautoosat.fi","topcryptoz.net","translate.goog","tv-asahi.co.jp","tv-tokyo.co.jp","tv.youtube.com","tvfreemium.top","tvstreampf.xyz","urbanbrush.net","verselemzes.hu","voeunbl0ck.com","wasza-farma.pl","webcamtaxi.com","whatfontis.com","wheel-size.com","whoisnovel.com","world-novel.fr","wpplugins.tips","xhofficial.com","xhwebsite5.com","zipcode.com.ng","10000recipe.com","aepos.ap.gov.in","airfrance.co.jp","airnavradar.com","all4pets.com.pl","alltechnerd.com","altranotizia.it","androidtvbox.eu","appimagehub.com","appofmirror.com","arcanescans.com","argusleader.com","atribuna.com.br","auth.alipay.com","awebstories.com","bestjavporn.com","blitzrechner.de","bluemediafile.*","books-world.net","bucketpages.com","c4ddownload.com","calorielijst.nl","cinegrabber.com","cinemablend.com","comprerural.com","cristoiublog.ro","cssreference.io","cypherscans.xyz","daily-times.com","dailyrecord.com","delmarvanow.com","desbloqueador.*","diffchecker.com","drawasaurus.org","dubznetwork.com","dztechphone.com","elektrikmen.com","elitepvpers.com","elpasotimes.com","fabioambrosi.it","famousintel.com","fayobserver.com","fcportables.com","fdlreporter.com","flinsetyadi.com","formatatmak.com","freewatchtv.top","futbollatam.com","gagetmatome.com","gainesville.com","glistranieri.it","gosanangelo.com","guitarworld.com","halotracker.com","hansa-online.de","heavyfetish.com","hentaihaven.xxx","hibiki-radio.jp","hotpornfile.org","housedigest.com","ihbarweb.org.tr","ilsole24ore.com","includehelp.com","indahonline.com","japonhentai.com","kanjukulive.com","katerionews.com","kickante.com.br","kooora4livs.com","koszalincity.pl","langitmovie.com","lethalpanda.com","lgbtqnation.com","licensekeys.org","linuxslaves.com","livescience.com","loginhit.com.ng","loudersound.com","loveplay123.com","manhwahentai.me","maxstream.video","medeberiya.site","mediahiburan.my","mehoathinh2.com","miniminiplus.pl","mmafighting.com","moneydigest.com","movies2watch.ru","music.apple.com","news-leader.com","news.chosun.com","northjersey.com","noweconomy.live","onlinetools.com","opendesktop.org","order-order.com","pawastreams.pro","pendulumedu.com","pepperlive.info","phimdinhcao.com","piecesauto24.lu","playonlinux.com","pogdesign.co.uk","polagriparts.pl","poolpiscina.com","primicia.com.ve","privivkainfo.ru","promobit.com.br","prpm.dbp.gov.my","putlockernew.vc","qiangwaikan.com","quicksleeper.pl","randomstory.org","read.amazon.com","reborntrans.com","romprovider.com","ruidosonews.com","saikaiscans.net","savannahnow.com","sekaikomik.live","short-story.net","smashboards.com","sneakernews.com","spanishdict.com","starcourier.com","stargazette.com","statelibrary.us","staugustine.com","stream.bunkr.is","tallahassee.com","targetstudy.com","team-octavi.com","techlicious.com","technicpack.net","teile-direkt.ch","textcleaner.net","thegearhunt.com","thememazing.com","thenekodark.com","thenewsstar.com","thespectrum.com","thetowntalk.com","timeanddate.com","timesonline.com","tvshowstars.com","twinkietown.com","ukrainashop.com","uslsoftware.com","venusembed.site","videobot.stream","voe-unblock.com","voeun-block.net","voeunblock3.com","wallauonline.de","wenku.baidu.com","wrestlezone.com","www.youtube.com","yeuphimmoik.com","youtubekids.com","zippyupload.com","zoommastory.com","aberdeennews.com","acupoffrench.com","addons.opera.com","airlinercafe.com","alphapolis.co.jp","animecruzers.com","apornstories.com","arenavalceana.ro","articlesmania.me","as-selection.net","blueridgenow.com","book.zhulang.com","booksmedicos.org","bumigemilang.com","cabinetexpert.ro","canondrivers.org","capecodtimes.com","carsguide.com.au","cdnmoviking.tech","celebzcircle.com","celtadigital.com","cittadinanza.biz","civildigital.com","cleanthinking.de","commandlinux.com","courierpress.com","creativebloq.com","currentargus.com","cyberspace.world","dailynews.us.com","daya-jewelry.com","deccanherald.com","dicasdevalor.net","digminecraft.com","dongphimmoiz.com","dreamsfriend.com","dualshockers.com","easyayurveda.com","englishlands.net","erovideoseek.com","eurooptyk.com.pl","experciencia.com","felizemforma.com","firmwarefile.com","floridatoday.com","fmhikayeleri.com","foodrepublic.com","freetvsports.xyz","freewaysintl.com","fv2freegifts.org","gadsdentimes.com","gordiando.com.br","grandoldteam.com","hardcoregames.ca","healthdigest.com","hoosiertimes.com","htmlreference.io","husseinezzat.com","ilovevaldinon.it","info-beihilfe.de","infomoney.com.br","interviewgig.com","isekaipalace.com","iskandinavya.com","itscybertech.com","jacksonville.com","jamilacuisine.ro","jusbrasil.com.br","justswallows.net","kamerabudaya.com","karyawanesia.com","kitchennovel.com","klsescreener.com","knowyourmeme.com","kollyinsider.com","kooora4lives.net","lokercirebon.com","madeinbocholt.de","medievalists.net","metropoliaztm.pl","milesofmusik.com","money-sense.club","myschool-eng.com","ncrtsolutions.in","newsforbolly.org","nhentaihaven.org","nofilmschool.com","nonesnanking.com","numberempire.com","nusantararom.org","nwfdailynews.com","nydailyquote.com","ofertecatalog.ro","onlineathens.com","outdoorguide.com","outidesigoto.com","paesifantasma.it","perlentaucher.de","petoskeynews.com","poconorecord.com","polskacanada.com","ponselharian.com","popcornmovies.io","portableapps.com","postcrescent.com","pttws.ptt.gov.tr","pureinfotech.com","rabbitstream.net","rapidairmax.site","raven-mythic.com","recordonline.com","repack-games.com","reporternews.com","reservdelar24.se","resourcepack.net","ribbelmonster.de","rule34hentai.net","sabishiidesu.com","savoriurbane.com","script-stack.com","segnidalcielo.it","sekai-kabuka.com","seoul.cs.land.to","sertracen.com.pa","simpleflying.com","sinhasannews.com","skidrowcodex.net","smokelearned.net","socialcounts.org","solarmagazine.nl","songs-wayaku.com","sssscanlator.com","ssuathletics.com","straitstimes.com","studiestoday.com","studyrankers.com","sweetslyrics.com","tabonitobrasil.*","tastingtable.com","tech-recipes.com","techtrickseo.com","tecnotutoshd.net","telefon-treff.de","tercihiniyap.net","thailandopen.org","the-dispatch.com","thedailymeal.com","thestarpress.com","thetimesnews.com","todaysparent.com","tohkaishimpo.com","tools.jabrek.net","tweaking4all.com","twitchemotes.com","ukworkshop.co.uk","un-block-voe.net","unknowncheats.me","vidstreaming.xyz","viewsofgreece.gr","vinstartheme.com","visefierbinti.ro","voe-un-block.com","voxvalachorum.ro","vvdailypress.com","wallpapercat.com","warcraftlogs.com","web.facebook.com","webcodegeeks.com","wikiofcelebs.com","wildstarlogs.com","willow.arlen.icu","wouterplanet.com","wrestlinginc.com","www.facebook.com","zdravenportal.eu","ziarulargesul.ro","zsti.zsti.civ.pl","affiliate.fc2.com","androidmakale.com","androidpolice.com","androidweblog.com","answersafrica.com","arras.netlify.app","balticlivecam.com","banglainsider.com","beaconjournal.com","blueraindrops.com","book.zongheng.com","braziljournal.com","brooklyneagle.com","cagesideseats.com","charbelnemnom.com","cheboygannews.com","chessimprover.com","chimica-online.it","cinemakottaga.top","citizen-times.com","citpekalongan.com","claplivehdplay.ru","clarionledger.com","classnotes.org.in","coolwallpapers.me","counciloflove.com","daily-tohoku.news","dailyamerican.com","dailynewsview.com","daimangajiten.com","dassen-azara4.com","daysoftheyear.com","deportealdia.live","der-postillon.com","descarga-animex.*","digitaltrends.com","encurtandourl.com","enjoytaiwan.co.kr","fordogtrainers.pl","francis-bacon.com","gamingsinners.com","gastongazette.com","geeksforgeeks.org","geeksoncoffee.com","good-football.org","googleapis.com.de","googleapis.com.do","gq-magazine.co.uk","grostembed.online","guides4gamers.com","heraldtribune.com","heypoorplayer.com","hitproversion.com","hollywoodmask.com","insidermonkey.com","ithacajournal.com","janvissersweer.nl","japanxxxmovie.com","jobsbotswana.info","jornaljoca.com.br","justtrucks.com.au","katholisches.info","kursnacukrzyce.pl","labs.j-novel.club","langweiledich.net","letsdownloads.com","lewblivehdplay.ru","liveyourmaths.com","lubbockonline.com","lugarcerto.com.br","luoghidavedere.it","manianomikata.com","marinetraffic.com","mcocguideblog.com","mcskinhistory.com","media.framu.world","memoryhackers.org","molineuxmix.co.uk","mooc.chaoxing.com","mtbtutoriales.com","music.youtube.com","nbcsportsedge.com","neuroteam-metz.de","nfltraderumors.co","nordkorea-info.de","nostracasa.com.br","oceanof-games.com","palmbeachpost.com","patriotledger.com","phimlongtieng.net","press-citizen.com","pressconnects.com","progameguides.com","recambioscoche.es","registerguard.com","reportergazeta.pl","roztoczanskipn.pl","scarysymptoms.com","serwis-zamkow.com","sharktankblog.com","sizyreelingly.com","sklep-agroland.pl","soundcloudmp3.org","starsunfolded.com","tchadcarriere.com","terramirabilis.ro","the-scorpions.com","theadvertiser.com","theaircurrent.com","theepochtimes.com","thegraillords.net","theregister.co.uk","times-gazette.com","timesreporter.com","timestelegram.com","toppremiumpro.com","torrentlawyer.com","urochsunloath.com","v-o-e-unblock.com","valeronevijao.com","venusarchives.com","verpornocomic.com","visaonoticias.com","watch.lonelil.com","winhelponline.com","wolfdyslectic.com","workhouses.org.uk","yaledailynews.com","alamogordonews.com","asianexpress.co.uk","autoteiledirekt.de","badgerandblade.com","baixedetudo.net.br","besteonderdelen.nl","bloomberglinea.com","bloombergquint.com","boerse-express.com","bronze-bravery.com","coffeeforums.co.uk","cografyahocasi.com","cours-de-droit.net","craftpip.github.io","delawareonline.com","doranobi-fansub.id","eduardo-monica.com","endorfinese.com.br","enterprisenews.com","esercizinglese.com","evasion-online.com","eveningtribune.com","fantasytagtree.com","ferroviando.com.br","figeterpiazine.com","financasdeouro.com","flashdumpfiles.com","flashplayer.org.ua","followmikewynn.com","foreignaffairs.com","freesmsgateway.com","gaypornmasters.com","giromarilia.com.br","gossipnextdoor.com","hayatbilgileri.com","heroesneverdie.com","immobiliaremia.com","iovivoatenerife.it","keighleynews.co.uk","kijyomatome-ch.com","krunkercentral.com","kuroko-analyze.com","lincolncourier.com","luyenthithukhoa.vn","mcdonoughvoice.com","mesquitaonline.com","minecraftforge.net","motortrader.com.my","myfreemp3juices.cc","nationalreview.com","newarkadvocate.com","onlinegiftools.com","onlinejpgtools.com","onlinepngtools.com","onscreensvideo.com","openanesthesia.org","placementstore.com","planetagibi.com.br","pokemonforever.com","portalportuario.cl","postcourier.com.pg","progress-index.com","psihologiadeazi.ro","record-courier.com","renditepassive.net","reporter-times.com","rezervesdalas24.lv","rottentomatoes.com","samsungtechwin.com","sdelatotoplenie.ru","seacoastonline.com","serieslyawesome.tv","sheboyganpress.com","skandynawiainfo.pl","sooeveningnews.com","sovetromantica.com","space-engineers.de","starnewsonline.com","steamcollector.com","stiridinromania.ro","strangermeetup.com","sturgisjournal.com","tauntongazette.com","techsupportall.com","theasianparent.com","thecalifornian.com","thegardnernews.com","theherald-news.com","theitaliantimes.it","thejakartapost.com","themosvagas.com.br","thetimesherald.com","thinkamericana.com","titanic-magazin.de","topperlearning.com","truyenbanquyen.com","tuscaloosanews.com","unlimitedfiles.xyz","upsrtconline.co.in","vercalendario.info","verdadeiroolhar.pt","viveretenerife.com","wirtualnyspac3r.pl","wpb.shueisha.co.jp","xda-developers.com","xxxonlinegames.com","yodelswartlike.com","aileen-novel.online","atlas-geografic.net","bluemoon-mcfc.co.uk","columbiatribune.com","courier-journal.com","courier-tribune.com","csiplearninghub.com","dailycommercial.com","darktranslation.com","demingheadlight.com","descargatepelis.com","dialectsarchive.com","dicasdefinancas.net","digitalfernsehen.de","digitalsynopsis.com","download.ipeenk.com","dreamlandresort.com","duneawakening.th.gl","empregoestagios.com","exclusifvoyages.com","festival-cannes.com","frameboxxindore.com","gazetadopovo.com.br","generationamiga.com","goodnews-magazin.de","handball-world.news","harvardmagazine.com","heraldmailmedia.com","hollandsentinel.com","home.novel-gate.com","independentmail.com","investorvillage.com","jacquieetmichel.net","journalstandard.com","kashmirobserver.net","kirannewsagency.com","legionprogramas.org","livingstondaily.com","lyricstranslate.com","marksandspencer.com","mexiconewsdaily.com","morosedog.gitlab.io","mostrodifirenze.com","musicallyvideos.com","mycentraljersey.com","mzk.starachowice.eu","nakedcapitalism.com","ncert-solutions.com","ncertsolutions.guru","norwichbulletin.com","onlinecoursebay.com","onlinetexttools.com","opportunitydesk.org","orangespotlight.com","perangkatguruku.com","raccontivietati.com","raindropteamfan.com","samurai.wordoco.com","seikatsu-hyakka.com","selfstudyanthro.com","shreveporttimes.com","siliconinvestor.com","smartkhabrinews.com","southcoasttoday.com","starresonance.th.gl","thedailyjournal.com","thedraftnetwork.com","thenorthwestern.com","theonegenerator.com","therecordherald.com","timesrecordnews.com","tipssehatcantik.com","tuttoautoricambi.it","viatasisanatate.com","wallpaperaccess.com","worldscientific.com","aboutchromebooks.com","alphagirlreviews.com","animenewsnetwork.com","astro-cric.pages.dev","augustachronicle.com","autoalkatreszek24.hu","autodielyonline24.sk","badzjeszczelepszy.pl","cdn.gamemonetize.com","cissamagazine.com.br","clubulbebelusilor.ro","commercialappeal.com","compartiendofull.net","corriereadriatico.it","coshoctontribune.com","cristelageorgescu.ro","criticalthinking.org","elektro-plast.com.pl","freereadnovel.online","greenvilleonline.com","hedgeaccordingly.com","ifdreamscametrue.com","impotsurlerevenu.org","karamellstore.com.br","koalasplayground.com","lazytranslations.com","lesmoutonsenrages.fr","magesyrevolution.com","mainframegurukul.com","marriedbiography.com","metagnathtuggers.com","milforddailynews.com","odiarioonline.com.br","onlinecarparts.co.uk","onlinefreecourse.net","photoshop-online.biz","platform.twitter.com","psychologiazycia.com","punto-informatico.it","readcomicsonline.lol","reservedeler24.co.no","revistavanityfair.es","selfstudyhistory.com","shushan.zhangyue.net","southbendtribune.com","statesmanjournal.com","stockpokeronline.com","technologyreview.com","tempatwisataseru.com","the-daily-record.com","theartofnakedwoman.*","thedailyreporter.com","thegatewaypundit.com","theleafchronicle.com","themeparktourist.com","thepublicopinion.com","ultimate-bravery.net","viafarmaciaonline.it","vinaurl.blogspot.com","windows101tricks.com","aprendeinglessila.com","autoczescionline24.pl","bibliacatolica.com.br","blasianluvforever.com","blogvisaodemercado.pt","bloomberglinea.com.br","cantondailyledger.com","columbiaspectator.com","courierpostonline.com","delicateseliterare.ro","desmoinesregister.com","devilslakejournal.com","diariodoiguacu.com.br","digital.lasegunda.com","download.mokeedev.com","downloadtutorials.net","ellwoodcityledger.com","filmpornoitaliano.org","gamoneinterrupted.com","glamourmagazine.co.uk","globaldefensecorp.com","goldenstateofmind.com","granfondo-cycling.com","greatfallstribune.com","guidingliterature.com","hearthstone-decks.net","hebrew4christians.com","ilclubdellericette.it","ilovefreesoftware.com","ipphone-warehouse.com","japancamerahunter.com","juancarlosmolinos.net","links.extralinks.casa","northwestfirearms.com","onlinestringtools.com","pcso-lottoresults.com","practicetestgeeks.com","premiumembeding.cloud","programming-link.info","promotor-poz.kylos.pl","providencejournal.com","searchenginewatch.com","smokingmeatforums.com","streamservicehd.click","the-masters-voice.com","thenews-messenger.com","tinyhouse-baluchon.fr","uptimeside.webnode.gr","visaliatimesdelta.com","wausaudailyherald.com","cathouseonthekings.com","chillicothegazette.com","cyberkrafttraining.com","dicasfinanceirasbr.com","digitalcameraworld.com","elizabeth-mitchell.org","generatesnitrosate.com","hiraethtranslation.com","hitokageproduction.com","japan-academy-prize.jp","kulinarnastronamocy.pl","labreakfastburrito.com","mainframestechhelp.com","metrowestdailynews.com","monorhinouscassaba.com","mt-milcom.blogspot.com","musicindustryhowto.com","nationalgeographic.com","news-journalonline.com","notificationsounds.com","operatorsekolahdbn.com","palmbeachdailynews.com","planetagibiblog.com.br","pontiacdailyleader.com","qualityfilehosting.com","techieway.blogspot.com","telyn610zoanthropy.com","thehouseofportable.com","tutoganga.blogspot.com","unbiasedsenseevent.com","underconsideration.com","wiibackupmanager.co.uk","zeeebatch.blogspot.com","battlecreekenquirer.com","burlingtonfreepress.com","columbiadailyherald.com","examiner-enterprise.com","farm-ro.desigusxpro.com","feel-the-darkness.rocks","greenocktelegraph.co.uk","guidon40hyporadius9.com","hattiesburgamerican.com","jimpenopisonline.online","juegosdetiempolibre.org","lansingstatejournal.com","mercenaryenrollment.com","oferty.dsautomobiles.pl","onlineonderdelenshop.nl","poughkeepsiejournal.com","przegladpiaseczynski.pl","publicopiniononline.com","rationalityaloelike.com","recantodasletras.com.br","republicadecuritiba.net","ryuryuko.blog90.fc2.com","searchenginejournal.com","sqlserveregitimleri.com","stevenspointjournal.com","theghostinmymachine.com","usmleexperiences.review","ate60vs7zcjhsjo5qgv8.com","bendigoadvertiser.com.au","cloudcomputingtopics.net","colegiosconcertados.info","democratandchronicle.com","gamershit.altervista.org","greenbaypressgazette.com","hentaialtadefinizione.it","indianhealthyrecipes.com","mansfieldnewsjournal.com","marshfieldnewsherald.com","montgomeryadvertiser.com","my-code4you.blogspot.com","phenomenalityuniform.com","photobank.mainichi.co.jp","programasvirtualespc.net","stowarzyszenie-impuls.eu","timeshighereducation.com","tricountyindependent.com","warringtonguardian.co.uk","webnoveltranslations.com","antallaktikaexartimata.gr","audaciousdefaulthouse.com","bucyrustelegraphforum.com","burlingtoncountytimes.com","ciberduvidas.iscte-iul.pt","creative-chemistry.org.uk","cyamidpulverulence530.com","dicionariocriativo.com.br","docs.paloaltonetworks.com","greaseball6eventual20.com","kathleenmemberhistory.com","lancastereaglegazette.com","matriculant401merited.com","portalcriatividade.com.br","portclintonnewsherald.com","realfinanceblogcenter.com","telenovelas-turcas.com.es","worldpopulationreview.com","yusepjaelani.blogspot.com","30sensualizeexpression.com","boonlessbestselling244.com","businessemailetiquette.com","globalairportconcierge.com","interestingengineering.com","northumberland-walks.co.uk","secondlifetranslations.com","singingdalong.blogspot.com","wisconsinrapidstribune.com","69translations.blogspot.com","buckscountycouriertimes.com","colors.sonicthehedgehog.com","garyfeinbergphotography.com","streaminglearningcenter.com","wasserstoff-leitprojekte.de","zanesvilletimesrecorder.com","courseware.cemc.uwaterloo.ca","economictimes.indiatimes.com","mimaletamusical.blogspot.com","springfieldspringfield.co.uk","tnt2-cricstreaming.pages.dev","toxitabellaeatrebates306.com","wlo-cricstreamiing.pages.dev","www-daftarharga.blogspot.com","arti-definisi-pengertian.info","divineyogaschool.blogspot.com","fittingcentermondaysunday.com","launchreliantcleaverriver.com","nahrungsmittel-intoleranz.com","utorrentgamesps2.blogspot.com","zeustranslations.blogspot.com","20demidistance9elongations.com","projektowanie-wnetrz-online.pl","audioreview.m1001.coreserver.jp","freerapidleechlist.blogspot.com","observatoriodocinema.uol.com.br","poplinks.idolmaster-official.jp","insurance-corporate.blogspot.com","mimaletadepeliculas.blogspot.com","certificationexamanswers.890m.com","telecom.economictimes.indiatimes.com","librospreuniversitariospdf.blogspot.com"];
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
        const $scriptletArglistRefs$ = /* 2102 */ "764;223;684,685,686;7,51;612;77,328;501;16;768;48,394,493,494;80;328;8;77;703;192;77;785;215;51;277;277;77,517;6,11,474;426;396;595;110,401;752;25,26,27,28;224;508;710;10;216;772;6;8;595;77,328;691;298;625;434;139;344,527;692;277;342;213;252;106;633;8,75,79,110;595;42,622,623;595;679;825;277;769;177;77;655;6,11,474;595;396;354;21;347;817;722;722;77;8;810;75;8;77;9,51;75;6,233,738;77,328;24,741;84;77;684,685;579;75;77;53;77;719,743;392;396;682;256;627;367;271;356;259;364;9;344,527;40;300;665;629;629;628,629;595;294;412;273;277;77,345;384;729,741;24,26,703,740,741,742;77,157,395;715;169;59;3;201;51,52;26,27,28,818;16;191;6;175;373;684,685,686;756;1;804;103;351;552;675;48;368;306;176;77,328;77,328;75;75;77,328;77,328;77,328;16;327;177;16,75,696;51;4;155;65;51,180,344,685;225;595,692;75;625;8;703;16;479;352;8,195,276,337,338,339;325;258;222;6,11,156;595;77;356;281;16,77;9,77;685;51,567;9,497;757;793;77;51,302,466;595;683;480;277;697;424;188;12;68;701;629;807;293;343;59;344,527;153;77;665;509;77;298;356;566;51;255;813,814;77,328;686;266;6,157;60;60;762;425;75;8,83,402,403,404;42,323;277;277;701;51;6;75;494;51;352;75;6,477,478;42,51;77;323;380,476;411;20,42;77,328;389;358;77;104;522;804;397;55;729,741;627;1;692;51;627;595;637;522;77,427;51,133,302;20,77;785;177;77,328;9;92,301;823;51;743;3;344,527;292;6,7;216;96;729,741;8;464;593;72;795;669;42;554;75;701;708;178;569,570;595;51;77;75;684,685,686;9;26,243;77;9,440;9;48,49;16;595;330;51;344,527,613;77;6,89;419,763;595;693;9;77;75;716;306;75;6,320;726;520;282;1;701;491;308;13,51;161;595;48,111,389,492;143;215;344,527;77;42;713;119;507;117;77,427;51,614,615,616;470;600;595;62,63;77;116;352;285,286;177;376;344,527;595;595;119;410,411;3;110,111;16;352;595;8,212,363;42;595;555;14;680;300;75,76;9;33;595;77,328;77,328;8;21;42;77;701;701;701;471;11,79,453,454;795;300;300;190;103;51,344,393,394;59;20;77,392;84;502;19,198;26,28;703;77;165;809;77;571,572,573;804;51;183;77;808;77;51;24,26,27,28;679;191;688,689;6;692;194;69;69;344,527;175;768;266;690;51;746;344,527;713;238;8,156,157;692;51,295;77,328;77;143;743;744;8;8,18,143;593;771;20,51;75;51,614,615,616;685;42;684,686;127;595;8,14,372;51;8;48,431,432;9,16;342;703;611;77,484;24,42;24,42;152;43,44;595;126;51,191;102,145;8,110;51,614,615,616;3;38;51,614,615,616;16;16;785;37;595;408;51,614,615,616,617,618;77;51;8,178;51,334;77;51,443,444;766;489;51;592;344,527;42,526;341;51;779;307;394;75;75;306;556;745;75,77;110,111;728;436;547;576;294;9;85,86;75;163;378;225;51;700;51;713;178;96,303;77;320,668;70,71;6;610;77;140,177;77;298;8;805;178;170;595;644;522;522;312;16;19,51,178,179,180;410,411;595;14;691;20,77;20,77;135;791;364;51,456;703;77;595;77;195;524;76;75;342,703;51,110,111;8;533;24,42;380;9;494;580;205;731;277;277;277;764;348;51;51,377;263;595;729,741;42;75;394,661,662;328;328;270;6,11;9,455;14,20,51,195;350;113;344,527;196;795;153;701;701;701;701;701;701;701;701;701;701;701;755;703;59;322;774;486;331,332;75;703;688,689;344,527;75;457;595;595;707;26,28;149;214;6,19,200,233;184;743;318,319,320;191,203;75,469,798,-800;218;376;342;6,477;595;344,527;77,394;20,77;231;51;595;51,302,466;77,328;77,328;6,11,392;759;820;76;821;121;229;751;344,527;143;674;386;46;311;710;503,504,505,506;14,15;77,703;82;51;14,51;8;51,406;7,51;8;51,111,132,133;344,527;659;595;692;115;277;16;344,527;595;110,401;647,648,649,650;595;344,527;773;595;51,614,615,616,617,618;433;344,527;18,19;257;20,51,244;60,694;578;9;9;535;225;211;770;725;691;703;381;9;9;306;730;177;388;710;51;411;51;812;595;300;75;549,550,551;75;162;565;327;9;298,576;801;34,39;51;7;595;158;66;9;8,9;51,75;394;524;344,527;225;77,328;320;77;675;193;703;411;58;359;7,51;110,276;527,575;35,36;75;177;157;457,691;668;389,429,512,513;54;131;410,411;77;24,783,784;77;448;238;595;272,415,416;435;710;177;632;20,51;75;6,276,429;9;277;93;20,77;271;298,389;595;701;684,685,686;684,685;703;344,527;42,519;8,110;352,394,651;151;714;77;55;701;701;701;701;701;701;701;701;701;701;701;701;701;701;701;701;536;493,550,562,672;9;7,51,111;305;711,712;792;9;214;703;782;7,77;229;51;14;595;298,563;790;325;171,212,233;709;562,747;77;6;316;210;595;228;118;595;75;84;77;344,527;701;781;77;595;20;51;565;77,328;298,563;81;75;75;298,576;171;720;51;97;251;32,483;42,372,787,788,789;9;299;595;77;344,527;173,174;395,440;51,171;595;163;746;344,527;595;6,14;710;595;362;51;344,527;186;344,527;645;344,527;41;595;191;215;515;75;51;729,741;238;9;107;365;794;206,207,208,209;710;51;270,271;95;306;703;9;298,563;537;278;723;704;290;328;435;656;673;595;595;595;14,51;467;595;729;595;38;51,245;75;776;310;804;344,527;75;361;1;594;703;9;760;9;77,484;595;284;51;9;692;77;498;646;75;75;423;328;124;9;63,797;595,691;697;77;48,49;9;593;743;120;67;595;595;568;710;356;481;15,19,132;106;7;796;298,563;259;778;447;6;20,77;701;20,21;143;729,741;125;685;411,703;16;739;42,519;42,519;153;655;9;560;8,276;42;697;701;701;701;701;701;8;51;396;516;73;9;229;20,77;344,527;51;344,527;737;75;341;290;270;50;6,14;736;344,527;298;51,111;263;11;77;6,11,180;51;48,326;595;163;8;77;595;691;51;270;595;595;595;8,79,444;143;6;495;14,51;487;290;371;110,111;77;352;494;681;75;75;595;344,527;472;1;22;177;701;259,260;691;20,302;697;609;20,77;595;595;724;6,20,392;233;57;595;75;282;48;322;317;595;374;344,527;328,678;20,42,51,171,191,636;7;19,111,524;298;344,527;277;407;595;42,666,667;344,527;595;20;697;447;815;149,691;6;665;77;595;6,11;811;87;77,703;77,79;475;344,527;595;21,703;701;215;240;468;14;595;7;392;83,288;703;595;75;298;562;595;595;75;9;75;101;51;51,111,302;84;51,624;6;804;595;19,77;522;452;106;703;582,583,584,585,586,587,588;532;758;159;177;6,14,156;77,195,741;344,527;17,51,163;710;595;42,631;42,677;595;7,51;607,608;374;717;395;396;498;194;595;595;595;411;595;595;356;289;51;754;754;804;20,77;698;77,298;48;206,207;77,703;7,302;51;6,11,171,180,233,400,642;42,519;9;369;421;164;51;26,27,28,29,30,31;171;701;701;599;16;9,16;309;58;77;8;295;302,465,466;697;473;344,527;595;265;485;51,102,590;51,567;75;653,654;117;130;499;138;574;202;420;8,79;437;77;595;595;595;6;333;449;429,576;51;110,401;542,543;595;51;344,527;595;246;595;276,302,344;344,527;77,703;77;6,7;595;8,102;595;215;103;240;630;77;77;6,11,233,400;75;496;289;262;775;780;353;328;289;51;20,51;6;499;691;344,527;126;215;342;106;409;51;42,323,591;344,527;344,527;670;277;177;75;685;77;595;221;595;48;657;697;692;494;75;394;521,522;804;199;806;233,428;344,527;344,527;51,102,198,558;396;45;685;6,14;6;19;77;51,614,615,616,617,618;8;595;695;595;51;119;217;626;490;595;595;6,197;595;51;595;204;687;692;692;804;270;336;356;77;595;595;595;754;595;344,527;177;77;77;705;328;77,517,518;42,519;42,519;306;523;692;206,207;171;206,207;42;51;595;547;187;122;48,324,325,326;559;146,147;51,171;9,20;317;595;294;19,148;51,403;110,111;241,242;595;136;679;344,527;77;8,102;228;306;482;595;215;595;11;7;761;392;77;718;534;366;710;276,337,527,643;8;298;344,527;14;20,77;51;595;51;75;723;77;51;595;8;540;389,438;75;595;119;77,195;14,51;51;84;7;676;581;410;595;605,606;90;328;304;6;344,527;299;692;112;51;314;306;691;283;47;335;269;733;51,266;604;692;42,519;142;77,530,531;595;7;107;595;75;51;412;306;595;595;171;6,11,14;26,27,28,818;159;595;514;228;703;26,27,28;114;595;171;595;804;18,19;51;77;8,20;8;77,356;296;9;157;344,527;710;344,527;77,191;598;270;753;344,527;77;528;3;734;736;325;8,14,200;75;344,527;19,132;8,17;290;163;51,614,615,616,617,618;595;75;595;595;3;317;56;732;77;296;42,519;767;719;344,527;42,652;344,527;42,519;344,527;595;786;593;99;105;344,527;593;233,816;240,411;75;99,100;9,51,133,414;344,527;42;321;51;710;227;51;722;230;9,20,189;595;51,553;6,157;83;524;152;342;595;8,14,79;212;6;595;264;9;595;8;548;51,614,615,616;51,295;595;7,11;77;51;691;51;306;91;327;721;163;167,168;792;541;595;544,545,546;51,401;259;342;342;196;705;355;595;123;110,401;450,520;254;595;191;16;8,150;344,527;94;450;22;77;306;51;9;344,527;595;172;7,8;19,51;702;17;660;178,344,527;619;235;529;51,220;206,207;435;344,527;236;48,430;163;11,14,233,274;595;595;522,638,639,640,641;595;595;391;804;595;48,326,339;77;51,658;51;276,337,527,643;42,519;422;68;19,51;14,51;9;499;595;51,344,527,614,615,616,617,618;413;125;267;595;595;595;445,446;395,439,440,441;42,519;42,519;42,519;228;228;315;573;691;42,519;51;235;595;51;804;103;8,500;804;75;13,185;137;119;149;822;344,527;596;595;51,275,276;51;296;595;103;6,7;595;602,603;51,614,615,616;42,519;77;344,527;6,14,233;51,233;291;2;6;143;344,527;344,527;177;344,527;6,14;215;406;20;298;595;51;595;356;247;346;635;692;595;657;657;657;328;777;344,527;8,79;129;84;6,191,236,344,527,621;595;276,429,527;595;302,323,458,459,460,461,462;595;804;349;344,527;51,83;595;306;595;356;595;360;149;595;620;51;280;595;595;154;525;595;595;253;232;699;284,389,463;595;491;306;342;51,132,133,614,615,616;595;557;134;599;7;77;77;42;692,710;225;42,519;51,403;6,110,111;375;595;595;595;344,527;595;191;595;561,562;14,15;77;77;6,14;51;238;66;110,401;6,7;77;558;75;8,276;306;306;691;595;595;344,527;595;539;6;595;108;19,51;51,79;595;379;77;181;589;51;51;595;103;234;344,527;344,527;595;356;657;276,302;272;488;14;51;473;51;276,302;595;149;9,77;595;66;595;692;595;660;595;595;344,527;804;344,527;634;125;691;344,527;706;785;595;804;804;11,156,226;298;382,383;77;595;322;289;595;14,51,233,392,538;511;9;51,614,615,616,617,618;595;234;14,51,77,405;248;279;344,527;110,111;228;61;163;352;42,519;595;48,389;804;356;296;-765,765;17,51;74;824;804;442;79,111,171,302,313;143;595;595;51;182;344,527;595;160;595;329;595;322;595;119;6;20,417,418;202,237;344,527;804;13;14,51;344,527;75;595;88;595;171;595;595;268;77;692;263,356;595;6,11,156;42,519;196;344,527;671;64;595;51,111,302;297;51,239;51;577;77,748,749,750;122;128;525;120;657;6;7,51;705;724;9;595;98;316;298;77,191,302,344;595;51;51;595;595;109;595;344,527;77;215;14,51,357;42,519;344,527;735;252;51,614,615,616;800;6;595;42,519;7,51;51,241,302;1,77;595;732;11,195;595;8,79;595;111,144;11;42,519;294;370;394;287;801;374;595;595;595;595;392;6,14,156;106;42,519;595;42;14,51;595;51;77;344,527;595;77;595;42,519;219;15;249,250;261;171;595;51;51;743;398;77,493;344,527;595;6;595;387;20,51,601;595;595;595;233;42,519;340;344,527;77;564;595;78;23;804;42,519;595;595;75;51;42,519;13;819;42,519;42,519;595;42,519;402,597;595;42,519;328,668;3;233;42,519;42,519;110,111;802;3;143;51,510,614,615,616,617,618;17,143;595;11,156,399;595;650,663,664;77;451;240;595;9;77,141;8;84;785;42,519;785;51,530;48,79,110;51;42,519;42,519;306;20,157;803;42,519;110,276;51,344;51;385;390;166;6,7;51;5;7,16,20,284,727";
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
    const $scriptletFunctions$ = /* 21 */
[preventAddEventListener,abortCurrentScript,abortOnPropertyRead,preventSetTimeout,abortOnPropertyWrite,removeAttr,setConstant,trustedReplaceArgument,preventFetch,preventXhr,trustedReplaceXhrResponse,jsonPrune,trustedSetConstant,preventSetInterval,noEvalIf,abortOnStackTrace,adjustSetInterval,noWindowOpenIf,adjustSetTimeout,trustedSuppressNativeMethod,trustedReplaceOutboundText];
    const $scriptletArgs$ = /* 698 */ ["scroll","$","modal_newsletter","/^(mouseout|mouseleave)$/","pum_popups","show-login-layer-article","document.oncontextmenu","document.onselectstart","oncontextmenu","/^(contextmenu|copy)$/","getSelection","disableSelection","nocontext","contextmenu","disableselect","reEnable","clickIE4","document.onkeydown","devtoolsDetector","{}","document.addEventListener","/contextmenu|copy|cut|key/","","elements","document","keydown","123","[arguments];","console.clear","trueFunc","console.table","console.log","key","/copy|selectstart/","return","/preventDefault|pointerType/","onkeydown|onselectstart|oncontextmenu","body[onkeydown*=\"__cfRLUnblockHandlers\"]","complete","oncontextmenu|onselectstart",".lyricBody[oncontextmenu]","oncontextmenu|onselectstart|onmousedown",".all-lyrics[oncontextmenu]","oncopy|oncut|onmousemove|onmousedown|style","#lyric_area[oncopy]","#lyric_area > p[oncontextmenu]","#lyrics[oncontextmenu]","body[oncontextmenu]","dragstart",".all-lyrics","[native code]","#__next","oncopy|onSelectStart|oncontextmenu|style","[oncopy],[oncontextmenu]","preventDefault","img[no-copy=\"true\"]",".viewer-container","document.onmousedown","mousedown",".trackContainer",".fancybox-container","null","onmousedown|onselectstart|oncontextmenu",".article","blockEvent","String.prototype.includes","0","condition","preview-cms","uxGuid","killads","true","www3.doubleclick.net","PASSER_videoPAS_apres","ads_enabled","adsbygoogle","AdBlocker","load","adblock","pro-modal","doubleclick","googlesyndication","length:10",".getState();","4500","holidAds","detectAdBlock","noopFunc","String.prototype.endsWith","/edit","Storage.prototype.setItem","json:\"DWEB\"","DWEB_PIN_IMAGE_CLICK_COUNT","json:\"\"","unauthDownloadCount","blur","ThriveGlobal","blazemedia_adBlock","copy","addLink","_sp_","check","100","document.getElementById","advert-tester","nebula.session.flags.adblock","undefined","document.oncopy","_adBlockCheck","navigator.storage.estimate","abde","ads","2000","/^(?:contextmenu|copy|selectstart)$/","/^(?:contextmenu|copy)$/","/^(?:contextmenu|keydown)$/","onbeforeunload","valid_user","Drupal.behaviors.detectAdblockers","scan","500","oncopy","jQuery","AdBlock","#sign-up-popup","/,\"category_sensitive\"[^\\n]+?\"follow_button\":\\{\"__typename\":\"CometFeedStoryFollowButtonStrategy\"[^\\n]+\"cursor\":\"[^\"]+\"\\}/g","}","/api/graphql","require.0.3.0.__bbox.define.[].2.is_linkshim_supported require.0.3.0.__bbox.define.[].2.click_ids","overlay","adBlockDetected","ADBdetected","onload_popup","8000","_sp_._networkListenerData","onselectstart","stay","ad-blocker",".ab_detected","document.ondragstart","disableEnterKey","adMessage","tweaker","$adframe","false","BIA.ADBLOCKER","Adblocker","10000","()","samDetected","4000","ABDSettings","adBlockFunction","block","hidekeep","checkAds","google_jobrunner","#advert-tracker","3000","disable_copy","disable_hot_keys","alert","oncontextmenu|oncopy|ondragstart|onselect|onselectstart","body","isAdblockDisabled","1000","clickIE","checkPrivacyWall","loadOutbrain","intsFequencyCap","w3ad","oncontextmenu|ondragstart|onselectstart","killCopy","oncontextmenu|ondragstart|onselectstart|onkeydown","restriction","adsAreShown","1500","bioEp.showPopup","/^(?:contextmenu|copy|keydown)$/","Date.prototype.toUTCString","abd","innerHTML","intializemarquee","oSpPOptions","oncontextmenu|onselectstart|ondragstart","detector_active","aoezone_adchecker","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart","message","preventSelection","fuckAdBlock","pageService.initDownloadProtection","mouseout","pop","oncontextmenu|onselectstart|onselect|oncopy","Drupal","a1lck","adsBlocked","/^(?:keyup|keydown)$/","detectPrivateMode","webkitRequestFileSystem","addLinkToCopy","_sharedData.is_whitelisted_crawl_bot","showOverlay","NoAd","killcopy","loginModal","stopPrntScr","700","document.documentElement.oncopy","oncontextmenu|onkeydown|onmousedown","ads_not_blocked","disable_in_input","disable_keystrokes","can_i_run_ads","__cmpGdprAppliesGlobally","/contextmenu|keydown|keyup|copy/","stopSelect","warning","ytInitialPlayerResponse.auxiliaryUi.messageRenderers.upsellDialogRenderer","auxiliaryUi.messageRenderers.upsellDialogRenderer","visibilitychange","/bgmobile|\\{\\w\\.\\w+\\(\\)\\}|\\.getVisibilityState\\(\\)/","document.visibilityState","json:\"visible\"","hideBannerBlockedMessage","__ext_loaded","slideout","faq/whitelist","_sp_.mms.startMsg","blurred","height","document.getElementsByTagName","RL.licenseman.init","abStyle","modal","eval","offsetHeight","ga_ExitPopup3339","t.preventDefault","ai_adb","none","replaceCopiedText","oncontextmenu|onselectstart|ondragstart|oncopy|oncut|onpaste|onbeforecopy","ABD","ondragstart","better_ads_adblock","onselectstart|ondragstart","console.debug","addEventListener","which","window.addEventListener","ctrlKey","/^(contextmenu|copy|dragstart|selectstart)$/","alerte_declanchee","initimg","oncontextmenu|onCopy","adBlock","oncontextmenu|onmousedown|onselectstart","appendMessage","document.body.setAttribute","5000","vSiteRefresher","popup","banner","/contextmenu|selectstart|copy/","oncontextmenu|ondragstart|onselectstart|onkeydown|onmousedown","oncontextmenu|onkeydown","onkeydown","adtoniq","ondragstart|onselectstart","/contextmenu|copy|keydown/","/contextmenu|select|copy/","/^(contextmenu|keydown)$/","a","adblocker","exit_popup","adsEnabled","locdau","show","ondrop|ondragstart","onload","onselectstart|ondragstart|oncontextmenu","div.story_text","document.body.oncopy","test.remove","oncontextmenu|ondragstart","mouseleave","noscroll","onmousemove|ondragstart|onselectstart|oncontextmenu","/contextmenu|selectstart/","ai_check","bait","onselectstart|ondragstart|onmousedown|onkeydown|oncontextmenu","window.SteadyWidgetSettings.adblockActive","adblockerdetected","juicyads","gdpr_popin_path","showEmailNewsletterModal","generatePopup","dragstart|keydown/","/contextmenu|keydown|dragstart/","oncontextmenu|onselectstart|ondragstart|onclick","btoa","_0x","f12lock","debugger","checkFeed","visibility","style","div#novelBoby","HTMLIFrameElement","FuckAdBlock","samOverlay","adStillHere","tjQuery","oncontextmenu|onMouseDown|style","/^(?:contextmenu|copy|keydown|mousedown)$/","document.onkeyup","commonUtil.openToast","adb","/contextmenu|keydown/","NS_TVER_EQ.checkEndEQ","nd_shtml","canRunAds","Adblock","isNaN","mps._queue.abdetect","contribute","devtoolschange","/contextmenu|copy/","ondragstart|oncontextmenu","clickNS","mdp","setTimeout","newsletterPopup","onContextMenu","premium","onkeydown|oncontextmenu","oncontextmenu|oncopy","abp","/contextmenu|cut|copy|paste/","oncontextmenu|onselectstart|style","#body_game","blocked","blocker","SignUPPopup_load","oncontextmenu|onselectstart|onselect|ondragstart|ondrag","removeChild","_0xfff1","event","stopPropagation","/contextmenu|mousedown/",".modal","soclInit","Zord.analytics.registerBeforeLeaveEvent","myModal","an_message",".height","admrlWpJsonP","oncopy|oncontextmenu|onselectstart|onselect|ondragstart|ondrag|onbeforeprint|onafterprint","document.onclick","document.onkeypress","disable_ext_code","/contextmenu|copy|selectstart/","adsbygoogle.length","oncontextmenu|onDragStart|onSelectStart","x5engine.utils.imCodeProtection","pipaId","oncontextmenu|ondragstart|onselectstart|onkeydown|oncopy|oncut","0x","matchMedia","shortcut","append_link","/^(?:contextmenu|dragstart|selectstart)$/","ai_front","ansFrontendGlobals.settings.signupWallType","journeyCompilerGateway","pgblck","/dragstart|keyup|keydown/","/keyup|keydown/","wpcc","oncopy|oncontextmenu","document.documentElement.AdBlockDetection","oncontextmenu|ondragstart|oncopy|oncut",".select-none","carbonLoaded","/contextmenu|cut|copy|keydown/","initAdBlockerPanel","/contextmenu|selectstart|copy|dragstart/","cpp_loc","String.prototype.charCodeAt","ai_","forceRefresh","head","/copy|dragstart/","/copy|contextmenu/","/getScript|error:/","error","nocontextmenu","AdB","oncontextmenu|ondragstart|onselectstart|onselect|oncopy|onbeforecopy|onkeydown|onunload","selectionchange","quill.emitter","oncontextmenu|onDragStart|onselectstart","/contextmenu|selectstart|select|copy|dragstart/","adLazy","_0x1a4c","jQuery!==\"undefined\"","clearInterval(loginReady)","document.body.onmouseup","addCopyright","selectstart","&adslot","copy_div_id","oncontextmenu|onkeydown|onselectstart","LBF.define","oncopy|oncontextmenu|oncut|onpaste","input","oncontextmenu|oncopy|onselectstart","onbeforecopy|oncontextmenu|oncopy|ondragstart|onmouseup|onselect|onselectstart","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|style","SD_BLOCKTHROUGH","body[style=\"user-select: none;\"]","cookie","/^(?:copy|paste)$/","b2a","/copy|keydown/","ab","oncopy|oncut|onselectstart|style|unselectable","document.body.oncut","/copy|cut|selectstart/","oncontextmenu|onselectstart|oncut|oncopy","oncontextmenu|ondragstart|onselect","encodeURIComponent","inlineScript","donation-modal","isMoz","onpaste","#tr_mesaj > td > .text-input.validate\\[required\\]","Delay","/keydown|keyup/","keyCode","disabledEvent","/copy|cut|paste|selectstart/","/contextmenu|dragstart|keydown/","event.dispatch.apply","document.querySelector","beforepaste","gif","DOMContentLoaded","rprw","\"input\"","contentprotector","mb.advertisingShouldBeEnabled","update_visit_count","replace","test","Promise","onscroll","5500","login","showAdblockerModal","dfgh-adsbygoogle","oncontextmenu|ondragstart|ondrop|onselectstart","[oncontextmenu]","jsData.hasVideoMeteringUnlogEnabled","lepopup_abd_enabled","広告","devtoolIsOpening","document.referer","pagelink","Object.prototype.preroll","[]","/keydown|mousedown/","Drupal.CTools.Modal.show","/(^(?!.*(injectedScript|makeProxy).*))/","#VdoPlayerDiv","a#download_link","Object.prototype.bgOverlay","Object.prototype.fixedContentPos","html","console.dir","navigator.userAgent","quoty-public","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|onselect|oncopy|onbeforecopy|onmouseup","onContextmenu|onMouseDown|onSelectStart","kan_vars.adblock","securityTool.disableRightClick","securityTool.disableF12","securityTool.disableCtrlP","securityTool.disableCtrlS","securityTool.disablePrintScreen","securityTool.disablePrintThisPage","securityTool.disableElementForPrintThisPage","document.body.oncontextmenu","attachToDom","ad-fallback","document.createElement","createAdblockFallbackSubscribeToProtopageAdDiv","gnt_mol_oy","adsok","runPageBugger","Source","length","nouplaod","img[oncontextmenu=\"return false;\"]","Object","/(?=^(?!.*(jquery|inlineScript)))/","ab_tests","scribd_ad","admiral","/contextmenu|copy|drag|dragstart/","userAgent","analytics",".entry-content","wccp_pro","clear_body_at_all_for_extentions","RegExp","googlebot","document.querySelectorAll","/contextmenu|keydown|keypress|copy/","blockFuckingEverything","build.js","openLayer","sneakerGoogleTag","devtools","/_0x|devtools/","flashvars.autoplay","popupScreen","checkAdblockBait","dispatch","onclick","[onclick=\"myFunction()\"]","navigator","setInterval","stateObject","wccp_pro_iscontenteditable","devtool","return\"undefined\"","ready","3","document.body.onselectstart","debug","disabledKeys","Time_Start","i--","0.02","/hotjar|googletagmanager/","Clipboard","0.001","ad","detect","DD","Object.prototype._detectLoop","_detectLoop","AudiosL10n","forbiddenList","concertAds","whetherdo","devtoolsDetector.addListener","String.fromCharCode","Premium","SteadyWidgetSettings.adblockActive","devtoolsOpen","phimv","||null","DisDevTool","preventDeleteDialog","/googlesyndication|googletag/","googletag","openOverlaySignup","count","/contextmenu|keyup|keydown/","initials.layout.layoutPromoProps.promoMessagesWrapperProps.shouldDisplayAdblockMessage","mtGlobal.disabledAds","devtoolsDetector.launch","/DevTools|_0x/","throwFunc","ANN.ads.adblocked","cloudflareinsights.com","pleaseSupportUs","nn_mpu1","maxUnauthenicatedArticleViews","googletag.cmd","rocket-DOMContentLoaded","bind(document)","innerHeight","[oncontextmenu=\"return false;\"]","/^(contextmenu|mousedown|keydown)$/","placeAdsHandler","hmwp_is_devtool","mensagem","ramp.addUnits","pqdxwidthqt","browser-plugin","nitroAds.loaded","checkDevTools","DevToolsOpen","ABB_config","jh_disabled_options_data","/select|copy|contextmenu/","topMessage","/cut|copy|paste|contextmenu/","forbidDebug","2","RegExp.prototype.toString",".join(\"\")","DisableDevtool","Function.prototype.constructor","\"debugger\"","abort","/isEnable|isOpen/","oncontextmenu|ondragstart|onselectstart|onload|onblur","nitroAds","afterKeydown","void","getComputedStyle","viewClickAttributeId","ad-wrap","oncopy|oncut","__NEXT_DATA__.props.pageProps.adPlacements","/contextmenu|selectstart|dragstart/","loadexternal","login_completed","disableclick","disableRightClick","layerid","1","/,\"expanded_url\":\"([^\"]+)\",\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"url\":\"$1\"","/graphql","/,\"expanded_url\":\"([^\"]+)\",\"indices\":([^\"]+)\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"indices\":$2\"url\":\"$1\"","/tweet-result","style.display","clipboardData","console","/Timeout\":\\d+/","Timeout\":0","/api/v","html[onselectstart]","linkPrefixMessage","adb-enabled","/mainseto.js:286:1","Array.prototype.includes","visitor-gate",".LoginSection","document.getSelection","detect_modal","ays_tooltip","disableCTRL","/adsbygoogle|ad-manager/","/devtool|console\\.clear/","Object.prototype.disableMenu","confirm","counter","oncontextmenu|oncopy|oncut","[id^=\"chapter\"]",".html","RegExp.prototype.test","\"contact@foxteller.com\"","onselectstart|oncopy","json:\"freeVideoFriendly\"","freeVideoFriendlySlug","(!0)","HTMLImageElement.prototype.onerror","player.pause","/stackDepth:(9|10).+https:[./0-9a-z]+\\/video\\.[0-9a-f]+\\.js:1\\d{2}:1.+\\.emit/","/[0-9a-f]{40}\\.js:1\\d{2}([\\S\\s]+\\.emit.+core\\.){3}/","PieScriptConfig","method:HEAD","location.href","function(t)","ad_blocker_detector_modal","clientHeight","String.prototype.trim","iframe","nonframe","Object.prototype.dbskrat","show_modal","href","[href*=\"ad.adverticum.net\"]","showFbPopup","FbExit","navigator.registerProtocolHandler","mailto","e","data.page_content.slot_widgets","123===i","ad-block","typeof loadElement","json:\"header\"","/^[A-Za-z]{12}$/","/^data:text\\/javascript/","ad_allowed","e=>e-1",".abort();"];
    const $scriptletArglists$ = /* 826 */ ";0,0;1,1,2;0,3;2,4;3,5;2,6;1,7;4,6;5,8;2,8;2,7;0,9;2,10;2,11;4,12;1,1,13;1,14,15;4,16;4,11;1,17;6,18,19;1,20,13;0,21,22,23,24;0,25,26;0,25,27;6,28,29;6,30,29;6,31,29;0,25,32;0,33,34;0,13,35;5,36,37,38;5,39,40,38;5,41,42,38;5,43,44,38;5,8,45,38;5,8,46,38;5,39,47,38;0,48,22,23,49;0,13,50,23,51;5,52,53;0,13,54;0,13,22,23,55;0,13,54,23,56;6,57,29;0,58,22,23,59;0,58,22,23,60;6,6,61;6,57,61;5,62,63,38;1,6;0,22,64;7,65,66,22,67,68;2,69;6,70,71;8,72;6,73,66;6,74,71;3,75;3,76;0,77,78;3,79;8,80;9,81,82;3,81;3,83,84;3,85;6,86,87;7,88,66,22,67,89;7,90,66,91,67,92;7,90,66,93,67,94;0,95;3,96;2,97;0,98;4,99;0,13;4,100;4,7;3,101,102;1,103,104;6,105,106;1,107;2,99;6,108,71;6,109,106;2,110;3,111,112;0,113;0,114,54;0,115;2,116;6,117,71;6,118,87;3,119,120;5,121;1,122,123;1,122,124;10,125,126,127;11,128;1,122,129;6,11,87;4,130;6,131,87;3,132,133;2,134;5,135,22,136;1,103,137;1,103,138;4,139;4,140;4,141;1,122,142;4,143;6,78,144;6,145,144;3,146,147;1,122,106;3,148,112;6,149,71;3,148,150;1,122,111;2,151;6,152,29;1,103,153;4,154;6,155,29;4,151;6,156,71;3,157,120;3,148,158;4,159;4,160;1,20,161;5,162,163,38;6,164,71;3,148,165;4,166;6,167,87;4,168;2,169;3,170;5,171;1,139,6;6,12,87;4,172;5,173;1,122,24;1,103,106;1,122,174;6,175,71;3,148,176;3,177;0,178;2,179;2,57;5,135;6,180,144;3,181;4,182;2,183;1,6,7;5,184;6,185,71;6,186,71;5,187;1,188,166;1,189;2,190;6,191,87;1,122,13;0,192,193;5,194;1,122,195;4,107;2,196;3,197;4,17;0,198;2,139;6,199,87;6,200,106;6,75,61;1,1,95;4,201;6,202,71;3,203;3,204,133;1,15,205;3,206,120;4,207;3,148,208;2,209;5,210;0,25;6,211,71;0,25,212;4,213;1,1,77;0,25,54;2,214;2,215;0,216;4,217;3,218;6,219,106;11,220;0,221,222;12,223,224;6,225,71;3,226;2,14;3,227;3,228;2,229;6,230,144;13,231;1,232,61;2,233;4,15;0,98,10;2,234;3,235;1,236,180;3,237;2,238;0,22,239;1,122,240;3,78;1,103,241;0,98,242;5,243;2,17;4,244;1,1,106;4,245;6,246,66;2,161;5,247;5,8,163,38;1,20;1,6,32;6,248,29;1,249,250;1,251,252;0,253;3,163;2,254;4,255;5,256;6,257,144;5,258;3,61;2,244;0,22,111;3,259;2,260;3,148,261;2,130;3,262;3,263;1,103,264;0,265;5,266;5,267;5,268;2,269;5,270;0,271;8,81;9,81;0,272;0,273;6,6,106;1,122,160;2,159;0,13,274;3,275;3,276,147;6,277,71;2,278;3,279;5,280;1,281;5,282,283,38;2,284;3,285;5,286;0,287;1,1,237;3,288,158;3,75,261;5,289,163;0,290;1,11;3,156;1,122,291;5,8,163;1,103,78;1,281,13;3,292;1,139;1,1,98;5,293,163;6,246,61;6,294,144;1,103,295;1,1,296;4,297;1,1,298;4,299;14,8;0,300;0,301;5,302;1,1,303;5,39;0,22,304;6,305,144;13,306;3,307,165;13,308,165;2,281;5,309,310,136;0,98,54;6,7,61;2,311;6,28,106;0,22,269;4,312;6,130,144;3,313;3,314;2,315;5,316;0,317;2,160;6,318,61;6,139,61;6,319,61;3,320;0,321;6,322,29;1,11,15;2,323;2,324;1,1,325;1,236,326;6,327,61;1,20,328;0,329;0,330;5,331;2,332;3,237,102;0,22,333;1,249,252;1,334,335;5,336,163;6,190,29;3,130;3,337;5,338,163;5,339;6,340,144;0,341;5,342,343;3,344,165;3,345;4,14;3,346,261;6,17,87;5,347,163;1,57;13,348;5,171,163;2,349;1,350,351;6,10,106;0,352;3,353,165;1,354;3,355,158;3,356,158;1,20,54;3,357,120;4,281;1,1,358;6,17,61;5,41,163;2,359;2,107;3,304;6,28,87;6,6,87;0,192;5,360,163;13,235;2,361;2,362;2,140;1,159;1,160;4,363;1,122,98;5,39,163;0,364;1,249,365;5,366;1,101,306;13,304;6,367,61;3,368,66;1,20,7;5,369;0,22,370;1,371;2,372;1,1,123;2,373;1,1,257;0,374;4,375;6,376,106;4,377;3,378;4,362;0,114;1,122,25;0,379;0,380,381;6,281,61;5,382,163;6,383,87;4,359;5,384,385,136;2,386;0,387;6,139,87;6,57,87;6,7,87;2,388;1,122,8;0,22,106;0,389;2,390;1,391,392;1,122,54;3,393;3,193;3,111;3,394;4,57;6,14,29;0,395;0,396;1,1,397;6,6,22;6,7,22;6,17,22;6,57,22;6,361,22;1,249,25;0,398;0,48;2,399;0,22,400;5,401;0,402,403;5,404;0,405;0,77,406;1,399;2,407;0,98,408;13,409;4,284;6,410,61;2,411;0,412;3,413;2,414;5,415,163;2,416;5,417,418;5,419;5,420;5,421,163;6,107,61;6,422,71;13,237;5,309,423,136;6,17,29;3,306;1,103,424;0,425,106;13,75;3,392;2,426;0,427;6,428,144;6,324,71;5,429,163,136;6,430,61;6,284,61;0,431;4,101;5,432;5,433;15,434,435;3,436;1,103,437;6,362,61;5,438,439;5,415;3,440;0,441,442;1,28;0,25,443;0,444;1,8,25;2,18;0,445,446;1,6,399;1,7,14;14,159;2,12;1,447,78;0,448;0,22,442;9,449;0,450,451;1,1,452;1,122,351;0,22,32;2,453;6,454,144;0,22,252;1,455;1,236,456;1,1,457;3,1;1,1,458;3,459,460;3,461,261;1,462;1,207;13,463;6,139,29;6,7,29;5,464,465,38;6,466,106;6,467,22;3,468;1,372;3,469,102;1,31,470;0,98,471;6,472,473;15,391,392;0,474;6,6,29;1,20,268;15,475,476;1,28,13;5,8,477;6,18,106;5,8,478,136;6,479,87;6,480,87;5,8,481;6,482,87;6,483,22;6,469,87;1,140;1,362;15,10,484;3,340;5,485;5,486;2,487;6,488,87;6,489,87;6,490,87;6,491,87;6,492,87;6,493,87;6,494,87;6,155,87;6,207,87;1,495;5,171,163,38;1,496,497;15,498,499;3,500;3,501;1,12;1,502;0,98,503;3,504,158;6,11,106;15,103,505;5,8,506,136;1,236,13;15,6;15,507,508;1,509;0,287,510;15,498,511;0,512;1,122,513;8,514;0,58,22,23,515;1,15;1,122,516;1,517;6,12,106;6,160,106;1,518,519;1,520,78;0,521;0,22,522;15,236,523;1,20,98;0,192,524;2,525;0,321,54;3,526;13,527;6,528,22;5,135,163;3,529;1,530;0,58,531;5,532,533;1,20,25;1,518,306;1,8;1,534,526;1,535,536;1,334,306;1,122,442;2,537;14,76;1,122,538;0,352,539;0,450,540;6,284,61,541;6,542,61,541;6,495,61,541;13,543;0,25,544;6,545,66;16,546,22,547;1,518,13;9,548;16,549,165,550;1,537;3,551;8,111;13,552;6,553,29;6,6,61,541;0,450,77;0,13,304;0,25,442;6,554,87;3,555;1,556;6,557,473;3,558;6,362,29;3,559;2,560;6,6,71;14,161;14,561;6,554,106;13,28;3,562;6,563,144;6,564,144;15,483,565;3,566;15,28;6,567,106;15,20,568;8,569;17;0,13,106;2,570;1,498,511;1,232,511;6,511,87;0,13,50;2,571;18,572;0,573;6,107,87;0,192,424;6,574,144;6,575,71;6,576,87;13,577;6,28,578;6,579,144;8,580;3,581;3,582,261;6,583,61;0,450,111;13,111;2,584;0,585,586;0,192,587;5,8,588;0,589,54;6,590,87;13,18;1,122,591;4,592;6,593,87;14,306;6,594,144;0,398,595;6,596,71;2,597;13,598;3,538;4,599;6,600,61;3,75,112;2,542;0,601;6,602,87;0,603;5,286,22,38;6,604,87;6,78,605;1,606,607;13,538;6,608,87;19,609,610,611;15,458,612;5,613;2,614;0,58,106,23,163;0,615;0,25,616;0,98,616;13,617;18,618;9,111;0,77,619;5,620;6,621,106;0,622;16,623,165;6,624,71;1,57,625;1,518,626;17,627,628;2,312;10,629,630,631;10,632,633,634;0,98,22,23,51;0,450,635;0,98,636;1,518,637;10,638,639,640;5,135,641;0,221,531;0,98,642;3,643;15,1,644;7,645,66,106,67,646;3,647;15,648,435;3,649;1,249,650;1,17,651;8,652;13,653;6,654,144;6,655,87;16,656,165,550;5,657,658,38;0,402,659;19,660,661,611;5,419,163,38;5,662,163,38;0,13,539;7,90,66,663,67,664;16;3,665,133;1,6,54;6,666,106;15,667,668;15,667,669;2,670;8,75;8,671;1,161,672;0,58,673;3,674;3,675;20,676,677,678;6,679,71;6,680,87;5,309,163,136;5,681,682;1,498,334;0,287,683;3,684,158;7,685,66,87,67,686;13,687,165;11,688;0,25,689;3,690;3,691;7,103,66,692,67,693;1,20,54,694;6,695,71;18,696;3,697,165";
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
