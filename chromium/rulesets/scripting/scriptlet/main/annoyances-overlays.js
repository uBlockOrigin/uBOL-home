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
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const thisScript = document.currentScript;
    const chain = safe.String_split.call(target, '.');
    let owner = window;
    let prop;
    for (;;) {
        prop = chain.shift();
        if ( chain.length === 0 ) { break; }
        if ( prop in owner === false ) { break; }
        owner = owner[prop];
        if ( owner instanceof Object === false ) { return; }
    }
    let value;
    let desc = Object.getOwnPropertyDescriptor(owner, prop);
    if (
        desc instanceof Object === false ||
        desc.get instanceof Function === false
    ) {
        value = owner[prop];
        desc = undefined;
    }
    const debug = shouldDebug(extraArgs);
    const exceptionToken = getExceptionTokenFn();
    const scriptTexts = new WeakMap();
    const textContentGetter = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').get;
    const getScriptText = elem => {
        let text = textContentGetter.call(elem);
        if ( text.trim() !== '' ) { return text; }
        if ( scriptTexts.has(elem) ) { return scriptTexts.get(elem); }
        const [ , mime, content ] =
            /^data:([^,]*),(.+)$/.exec(elem.src.trim()) ||
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
        if ( context !== '' && reContext.test(e.src) === false ) {
            // eslint-disable-next-line no-debugger
            if ( debug === 'nomatch' || debug === 'all' ) { debugger; }
            return;
        }
        if ( safe.logLevel > 1 && context !== '' ) {
            safe.uboLog(logPrefix, `Matched src\n${e.src}`);
        }
        const scriptText = getScriptText(e);
        if ( reNeedle.test(scriptText) === false ) {
            // eslint-disable-next-line no-debugger
            if ( debug === 'nomatch' || debug === 'all' ) { debugger; }
            return;
        }
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Matched text\n${scriptText}`);
        }
        // eslint-disable-next-line no-debugger
        if ( debug === 'match' || debug === 'all' ) { debugger; }
        safe.uboLog(logPrefix, 'Aborted');
        throw new ReferenceError(exceptionToken);
    };
    // eslint-disable-next-line no-debugger
    if ( debug === 'install' ) { debugger; }
    try {
        Object.defineProperty(owner, prop, {
            get: function() {
                validate();
                return desc instanceof Object
                    ? desc.get.call(owner)
                    : value;
            },
            set: function(a) {
                validate();
                if ( desc instanceof Object ) {
                    desc.set.call(owner, a);
                } else {
                    value = a;
                }
            }
        });
    } catch(ex) {
        safe.uboErr(logPrefix, `Error: ${ex}`);
    }
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
    needle = ''
) {
    if ( typeof chain !== 'string' ) { return; }
    const safe = safeSelf();
    const needleDetails = safe.initPattern(needle, { canNegate: true });
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
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
    stackNeedle = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune', rawPrunePaths, rawNeedlePaths, stackNeedle);
    const stackNeedleDetails = safe.initPattern(stackNeedle, { canNegate: true });
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    JSON.parse = new Proxy(JSON.parse, {
        apply: function(target, thisArg, args) {
            const objBefore = Reflect.apply(target, thisArg, args);
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
        },
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
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
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
    runAt(( ) => {
        proxyApplyFn('EventTarget.prototype.addEventListener', proxyFn);
        if ( extraArgs.protect ) {
            const { addEventListener } = EventTarget.prototype;
            Object.defineProperty(EventTarget.prototype, 'addEventListener', {
                set() { },
                get() { return addEventListener; }
            });
        }
        proxyApplyFn('document.addEventListener', proxyFn);
        if ( extraArgs.protect ) {
            const { addEventListener } = document;
            Object.defineProperty(document, 'addEventListener', {
                set() { },
                get() { return addEventListener; }
            });
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
    responseType = ''
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
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 4);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const validResponseProps = {
        ok: [ false, true ],
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
    return preventXhrFn(false, ...args);
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
    const XHRBefore = XMLHttpRequest.prototype;
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(method, url, ...args) {
            xhrInstances.delete(this);
            if ( warOrigin !== undefined && url.startsWith(warOrigin) ) {
                return super.open(method, url, ...args);
            }
            const haystack = { method, url };
            if ( propsToMatch === '' && directive === '' ) {
                safe.uboLog(logPrefix, `Called: ${safe.JSON_stringify(haystack, null, 2)}`);
                return super.open(method, url, ...args);
            }
            if ( matchObjectPropertiesFn(propNeedles, haystack) ) {
                const xhrDetails = Object.assign(haystack, {
                    xhr: this,
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
                xhrInstances.set(this, xhrDetails);
            }
            return super.open(method, url, ...args);
        }
        send(...args) {
            const xhrDetails = xhrInstances.get(this);
            if ( xhrDetails === undefined ) {
                return super.send(...args);
            }
            xhrDetails.headers['date'] = (new Date()).toUTCString();
            let xhrText = '';
            switch ( this.responseType ) {
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
        }
        getResponseHeader(headerName) {
            const xhrDetails = xhrInstances.get(this);
            if ( xhrDetails === undefined || this.readyState < this.HEADERS_RECEIVED ) {
                return super.getResponseHeader(headerName);
            }
            const value = xhrDetails.headers[headerName.toLowerCase()];
            if ( value !== undefined && value !== '' ) { return value; }
            return null;
        }
        getAllResponseHeaders() {
            const xhrDetails = xhrInstances.get(this);
            if ( xhrDetails === undefined || this.readyState < this.HEADERS_RECEIVED ) {
                return super.getAllResponseHeaders();
            }
            const out = [];
            for ( const [ name, value ] of Object.entries(xhrDetails.headers) ) {
                if ( !value ) { continue; }
                out.push(`${name}: ${value}`);
            }
            if ( out.length !== 0 ) { out.push(''); }
            return out.join('\r\n');
        }
    };
    self.XMLHttpRequest.prototype.open.toString = function() {
        return XHRBefore.open.toString();
    };
    self.XMLHttpRequest.prototype.send.toString = function() {
        return XHRBefore.send.toString();
    };
    self.XMLHttpRequest.prototype.getResponseHeader.toString = function() {
        return XHRBefore.getResponseHeader.toString();
    };
    self.XMLHttpRequest.prototype.getAllResponseHeaders.toString = function() {
        return XHRBefore.getAllResponseHeaders.toString();
    };
}

function proxyApplyFn(
    target = '',
    handler = ''
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
    }
    if ( proxyApplyFn.isCtor.has(target) === false ) {
        proxyApplyFn.isCtor.set(target, fn.prototype?.constructor === fn);
    }
    const fnStr = fn.toString();
    const toString = (function toString() { return fnStr; }).bind(null);
    const proxyDetails = {
        apply(target, thisArg, args) {
            return handler(proxyApplyFn.ApplyContext.factory(target, thisArg, args));
        },
        get(target, prop) {
            if ( prop === 'toString' ) { return toString; }
            return Reflect.get(target, prop);
        },
    };
    if ( proxyApplyFn.isCtor.get(target) ) {
        proxyDetails.construct = function(target, args) {
            return handler(proxyApplyFn.CtorContext.factory(target, args));
        };
    }
    context[prop] = new Proxy(fn, proxyDetails);
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
        timerId = safe.onIdle(( ) => {
            timerId = undefined;
            rmattr();
        }, { timeout: 17 });
    };
    const rmattr = ( ) => {
        if ( timerId !== undefined ) {
            safe.offIdle(timerId);
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

function setConstant(
    ...args
) {
    setConstantFn(false, ...args);
}

function setConstantFn(
    trusted = false,
    chain = '',
    rawValue = ''
) {
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-constant', chain, rawValue);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
}

function trustedReplaceArgument(
    propChain = '',
    argposRaw = '',
    argraw = ''
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-argument', propChain, argposRaw, argraw);
    const argoffset = parseInt(argposRaw, 10) || 0;
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
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
        ? safe.patternToRegex(extraArgs.condition)
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
    ...args
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-outbound-text', propChain, rawPattern, rawReplacement, ...args);
    const rePattern = safe.patternToRegex(rawPattern);
    const replacement = rawReplacement.startsWith('json:')
        ? safe.JSON_parse(rawReplacement.slice(5))
        : rawReplacement;
    const extraArgs = safe.getExtraArgs(args);
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
    propsToMatch = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-xhr-response', pattern, replacement, propsToMatch);
    const xhrInstances = new WeakMap();
    if ( pattern === '*' ) { pattern = '.*'; }
    const rePattern = safe.patternToRegex(pattern);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
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

const $scriptletFunctions$ = /* 20 */
[preventAddEventListener,abortCurrentScript,abortOnPropertyRead,preventSetTimeout,abortOnPropertyWrite,removeAttr,setConstant,preventFetch,preventXhr,trustedReplaceArgument,trustedReplaceXhrResponse,jsonPrune,preventSetInterval,noEvalIf,abortOnStackTrace,adjustSetInterval,noWindowOpenIf,adjustSetTimeout,trustedSuppressNativeMethod,trustedReplaceOutboundText];

const $scriptletArgs$ = /* 659 */ ["scroll","$","modal_newsletter","/^(mouseout|mouseleave)$/","pum_popups","show-login-layer-article","document.oncontextmenu","document.onselectstart","oncontextmenu","/^(contextmenu|copy)$/","getSelection","disableSelection","nocontext","contextmenu","disableselect","reEnable","clickIE4","document.onkeydown","devtoolsDetector","{}","document.addEventListener","||!!","/contextmenu|copy|cut|key/","","elements","document","keydown","123","[arguments];","console.clear","trueFunc","console.table","console.log","key","/copy|selectstart/","return","/preventDefault|pointerType/","onkeydown|onselectstart|oncontextmenu","body[onkeydown*=\"__cfRLUnblockHandlers\"]","complete","uxGuid","killads","true","www3.doubleclick.net","PASSER_videoPAS_apres","0","ads_enabled","adsbygoogle","AdBlocker","load","adblock","pro-modal","doubleclick","googlesyndication","length:10",".getState();","4500","Storage.prototype.setItem","json:\"DWEB\"","condition","DWEB_PIN_IMAGE_CLICK_COUNT","json:\"\"","unauthDownloadCount","blur","ThriveGlobal","blazemedia_adBlock","copy","addLink","_sp_","check","100","document.getElementById","advert-tester","nebula.session.flags.adblock","undefined","document.oncopy","_adBlockCheck","navigator.storage.estimate","abde","ads","2000","/^(?:contextmenu|copy|selectstart)$/","/^(?:contextmenu|copy)$/","preventDefault","/^(?:contextmenu|keydown)$/","onbeforeunload","valid_user","Drupal.behaviors.detectAdblockers","noopFunc","scan","500","oncopy","jQuery","AdBlock","#sign-up-popup","/,\"category_sensitive\"[^\\n]+?\"follow_button\":\\{\"__typename\":\"CometFeedStoryFollowButtonStrategy\"[^\\n]+\"cursor\":\"[^\"]+\"\\}/g","}","/api/graphql","require.0.3.0.__bbox.define.[].2.is_linkshim_supported require.0.3.0.__bbox.define.[].2.click_ids","overlay","adBlockDetected","ADBdetected","onload_popup","8000","_sp_._networkListenerData","onselectstart","stay","ad-blocker",".ab_detected","document.ondragstart","disableEnterKey","adMessage","tweaker","adBlockEnabled","$adframe","false","BIA.ADBLOCKER","Adblocker","10000","()","samDetected","4000","ABDSettings","adBlockFunction","block","hidekeep","checkAds","google_jobrunner","#advert-tracker","3000","disable_copy","disable_hot_keys","alert","oncontextmenu|oncopy|ondragstart|onselect|onselectstart","body","isAdblockDisabled","1000","clickIE","checkPrivacyWall","loadOutbrain","intsFequencyCap","w3ad","oncontextmenu|ondragstart|onselectstart","killCopy","oncontextmenu|ondragstart|onselectstart|onkeydown","restriction","adsAreShown","1500","bioEp.showPopup","/^(?:contextmenu|copy|keydown)$/","Date.prototype.toUTCString","document.onmousedown","abd","innerHTML","intializemarquee","oncontextmenu|onselectstart","oSpPOptions","oncontextmenu|onselectstart|ondragstart","detector_active","aoezone_adchecker","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart","message","preventSelection","fuckAdBlock","pageService.initDownloadProtection","mouseout","pop","oncontextmenu|onselectstart|onselect|oncopy","Drupal","a1lck","adsBlocked","/^(?:keyup|keydown)$/","detectPrivateMode","webkitRequestFileSystem","null","addLinkToCopy","_sharedData.is_whitelisted_crawl_bot","showOverlay","NoAd","killcopy","loginModal","stopPrntScr","700","document.documentElement.oncopy","oncontextmenu|onkeydown|onmousedown","ads_not_blocked","disable_in_input","disable_keystrokes","can_i_run_ads","__cmpGdprAppliesGlobally","/contextmenu|keydown|keyup|copy/","stopSelect","warning","ytInitialPlayerResponse.auxiliaryUi.messageRenderers.upsellDialogRenderer","auxiliaryUi.messageRenderers.upsellDialogRenderer","visibilitychange","/bgmobile|\\{\\w\\.\\w+\\(\\)\\}/","hideBannerBlockedMessage","__ext_loaded","slideout","faq/whitelist","_sp_.mms.startMsg","blurred","height","document.getElementsByTagName","RL.licenseman.init","abStyle","modal","eval","offsetHeight","ga_ExitPopup3339","t.preventDefault","ai_adb","none","replaceCopiedText","oncontextmenu|onselectstart|ondragstart|oncopy|oncut|onpaste|onbeforecopy","ABD","ondragstart","better_ads_adblock","onselectstart|ondragstart","console.debug","addEventListener","which","window.addEventListener","ctrlKey","/^(contextmenu|copy|dragstart|selectstart)$/","alerte_declanchee","initimg","oncontextmenu|onCopy","adBlock","oncontextmenu|onmousedown|onselectstart","appendMessage","document.body.setAttribute","5000","vSiteRefresher","popup","banner","/contextmenu|selectstart|copy/","oncontextmenu|ondragstart|onselectstart|onkeydown|onmousedown","oncontextmenu|onkeydown","onkeydown","adtoniq","ondragstart|onselectstart","/contextmenu|copy|keydown/","/contextmenu|select|copy/","/^(contextmenu|keydown)$/","a","adblocker","exit_popup","adsEnabled","locdau","show","ondrop|ondragstart","onload","onselectstart|ondragstart|oncontextmenu","div.story_text","document.body.oncopy","test.remove","oncontextmenu|ondragstart","mouseleave","noscroll","onmousemove|ondragstart|onselectstart|oncontextmenu","/contextmenu|selectstart/","ai_check","bait","onselectstart|ondragstart|onmousedown|onkeydown|oncontextmenu","window.SteadyWidgetSettings.adblockActive","adblockerdetected","juicyads","gdpr_popin_path","showEmailNewsletterModal","generatePopup","dragstart|keydown/","/contextmenu|keydown|dragstart/","oncontextmenu|onselectstart|ondragstart|onclick","btoa","_0x","f12lock","debugger","checkFeed","visibility","style","div#novelBoby","HTMLIFrameElement","FuckAdBlock","samOverlay","adStillHere","tjQuery","oncontextmenu|onMouseDown|style","/^(?:contextmenu|copy|keydown|mousedown)$/","document.onkeyup","commonUtil.openToast","adb","/contextmenu|keydown/","NS_TVER_EQ.checkEndEQ","nd_shtml","canRunAds","Adblock","isNaN","mps._queue.abdetect","contribute","devtoolschange","/contextmenu|copy/","ondragstart|oncontextmenu","clickNS","mdp","setTimeout","newsletterPopup","onContextMenu","premium","onkeydown|oncontextmenu","oncontextmenu|oncopy","abp","/contextmenu|cut|copy|paste/","oncontextmenu|onselectstart|style","#body_game","blocked","blocker","SignUPPopup_load","oncontextmenu|onselectstart|onselect|ondragstart|ondrag","removeChild","_0xfff1","event","stopPropagation","/contextmenu|mousedown/",".modal","soclInit","Zord.analytics.registerBeforeLeaveEvent","myModal","an_message",".height","oncontextmenu|onselectstart|onmousedown","admrlWpJsonP","oncopy|oncontextmenu|onselectstart|onselect|ondragstart|ondrag|onbeforeprint|onafterprint","document.onclick","document.onkeypress","disable_ext_code","/contextmenu|copy|selectstart/","adsbygoogle.length","oncontextmenu|onDragStart|onSelectStart","x5engine.utils.imCodeProtection","pipaId","oncontextmenu|ondragstart|onselectstart|onkeydown|oncopy|oncut","0x","matchMedia","shortcut","append_link","/^(?:contextmenu|dragstart|selectstart)$/","ai_front","ansFrontendGlobals.settings.signupWallType","journeyCompilerGateway","pgblck","/dragstart|keyup|keydown/","/keyup|keydown/","wpcc","oncopy|oncontextmenu","document.documentElement.AdBlockDetection","oncontextmenu|ondragstart|oncopy|oncut",".select-none","carbonLoaded","/contextmenu|cut|copy|keydown/","initAdBlockerPanel","/contextmenu|selectstart|copy|dragstart/","cpp_loc","String.prototype.charCodeAt","ai_","forceRefresh","head","/copy|dragstart/","/copy|contextmenu/","/getScript|error:/","error","dragstart","nocontextmenu","AdB","oncontextmenu|ondragstart|onselectstart|onselect|oncopy|onbeforecopy|onkeydown|onunload","selectionchange","quill.emitter","oncontextmenu|onDragStart|onselectstart","/contextmenu|selectstart|select|copy|dragstart/","adLazy","_0x1a4c","jQuery!==\"undefined\"","clearInterval(loginReady)","document.body.onmouseup","addCopyright","selectstart","&adslot","copy_div_id","oncontextmenu|onkeydown|onselectstart","LBF.define","oncopy|oncontextmenu|oncut|onpaste","input","oncontextmenu|oncopy|onselectstart","onbeforecopy|oncontextmenu|oncopy|ondragstart|onmouseup|onselect|onselectstart","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|style","SD_BLOCKTHROUGH","body[style=\"user-select: none;\"]","cookie","/^(?:copy|paste)$/","b2a","/copy|keydown/","ab","oncopy|oncut|onselectstart|style|unselectable","document.body.oncut","/copy|cut|selectstart/","oncontextmenu|onselectstart|oncut|oncopy","oncontextmenu|ondragstart|onselect","encodeURIComponent","inlineScript","debugchange","donation-modal","isMoz","onpaste","#tr_mesaj > td > .text-input.validate\\[required\\]","Delay","/keydown|keyup/","keyCode","disabledEvent","/copy|cut|paste|selectstart/","/contextmenu|dragstart|keydown/","event.dispatch.apply","document.querySelector","beforepaste","gif","DOMContentLoaded","rprw","\"input\"","contentprotector","mb.advertisingShouldBeEnabled","update_visit_count","replace","test","Promise","onscroll","5500","login","showAdblockerModal","dfgh-adsbygoogle","oncontextmenu|ondragstart|ondrop|onselectstart","[oncontextmenu]","jsData.hasVideoMeteringUnlogEnabled","lepopup_abd_enabled","広告","devtoolIsOpening","document.referer","pagelink","Object.prototype.preroll","[]","/keydown|mousedown/","Drupal.CTools.Modal.show","/(^(?!.*(injectedScript|makeProxy).*))/","#VdoPlayerDiv","a#download_link","Object.prototype.bgOverlay","Object.prototype.fixedContentPos","html","console.dir","navigator.userAgent","quoty-public","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|onselect|oncopy|onbeforecopy|onmouseup","onContextmenu|onMouseDown|onSelectStart","kan_vars.adblock","securityTool.disableRightClick","securityTool.disableF12","securityTool.disableCtrlP","securityTool.disableCtrlS","securityTool.disablePrintScreen","securityTool.disablePrintThisPage","securityTool.disableElementForPrintThisPage","wccp_pro_iscontenteditable",".all-lyrics","document.body.oncontextmenu","attachToDom","ad-fallback","document.createElement","createAdblockFallbackSubscribeToProtopageAdDiv","gnt_mol_oy","adsok","runPageBugger","Source","length","nouplaod","img[oncontextmenu=\"return false;\"]","Object","/(?=^(?!.*(jquery|inlineScript)))/","ab_tests","scribd_ad","admiral","/contextmenu|copy|drag|dragstart/","userAgent","analytics","mousedown",".entry-content","wccp_pro","clear_body_at_all_for_extentions","RegExp","googlebot","document.querySelectorAll","/contextmenu|keydown|keypress|copy/","blockFuckingEverything","build.js","openLayer","sneakerGoogleTag","devtools","/_0x|devtools/","flashvars.autoplay","popupScreen","checkAdblockBait","dispatch","onclick","[onclick=\"myFunction()\"]","navigator","setInterval","stateObject","devtool","return\"undefined\"","ready","3","document.body.onselectstart","debug","disabledKeys","Time_Start","i--","0.02","/hotjar|googletagmanager/","Clipboard","0.001","ad","detect","DD","Object.prototype._detectLoop","_detectLoop","AudiosL10n","forbiddenList","concertAds","whetherdo","devtoolsDetector.addListener","String.fromCharCode","Premium","SteadyWidgetSettings.adblockActive","devtoolsOpen","phimv","||null","DisDevTool","preventDeleteDialog","/googlesyndication|googletag/","googletag","[native code]","openOverlaySignup","count","/contextmenu|keyup|keydown/","initials.layout.layoutPromoProps.promoMessagesWrapperProps.shouldDisplayAdblockMessage","mtGlobal.disabledAds","devtoolsDetector.launch","/DevTools|_0x/","throwFunc","ANN.ads.adblocked","cloudflareinsights.com","pleaseSupportUs","nn_mpu1","maxUnauthenicatedArticleViews","googletag.cmd","rocket-DOMContentLoaded","bind(document)","innerHeight","[oncontextmenu=\"return false;\"]","/^(contextmenu|mousedown|keydown)$/","placeAdsHandler","hmwp_is_devtool","mensagem","ramp.addUnits","pqdxwidthqt","browser-plugin","nitroAds.loaded","checkDevTools","DevToolsOpen","ABB_config","jh_disabled_options_data","/select|copy|contextmenu/","topMessage","/cut|copy|paste|contextmenu/","forbidDebug","2","RegExp.prototype.toString",".join(\"\")","DisableDevtool","Function.prototype.constructor","\"debugger\"","abort","/isEnable|isOpen/","oncontextmenu|ondragstart|onselectstart|onload|onblur","nitroAds","afterKeydown","void","getComputedStyle","viewClickAttributeId","ad-wrap","oncopy|oncut","__NEXT_DATA__.props.pageProps.adPlacements","/contextmenu|selectstart|dragstart/","loadexternal","login_completed","disableclick","disableRightClick","layerid","1","/,\"expanded_url\":\"([^\"]+)\",\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"url\":\"$1\"","/graphql","/,\"expanded_url\":\"([^\"]+)\",\"indices\":([^\"]+)\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"indices\":$2\"url\":\"$1\"","/tweet-result","#__next","style.display","clipboardData","console","/Timeout\":\\d+/","Timeout\":0","/api/v","html[onselectstart]","linkPrefixMessage","adb-enabled","/mainseto.js:286:1","Array.prototype.includes","visitor-gate",".LoginSection","document.getSelection","detect_modal","ays_tooltip","disableCTRL","/adsbygoogle|ad-manager/","/devtool|console\\.clear/","Object.prototype.disableMenu","confirm","counter","oncontextmenu|oncopy|oncut","[id^=\"chapter\"]",".html","RegExp.prototype.test","\"contact@foxteller.com\"","onselectstart|oncopy","json:\"freeVideoFriendly\"","freeVideoFriendlySlug","/^function\\(.*\\|\\|.*}$/","(!0)","HTMLImageElement.prototype.onerror","player.pause","/stackDepth:(9|10).+https:[./0-9a-z]+\\/video\\.[0-9a-f]+\\.js:1\\d{2}:1.+\\.emit/","PieScriptConfig","method:HEAD","location.href","function(t)","ad_blocker_detector_modal","clientHeight","String.prototype.trim","iframe","nonframe","Object.prototype.dbskrat"];

const $scriptletArglists$ = /* 792 */ "0,0;1,1,2;0,3;2,4;3,5;2,6;1,7;4,6;5,8;2,8;2,7;0,9;2,10;2,11;4,12;1,1,13;1,14,15;4,16;4,11;1,17;6,18,19;1,20,13;3,21;0,22,23,24,25;0,26,27;0,26,28;6,29,30;6,31,30;6,32,30;0,26,33;0,34,35;0,13,36;5,37,38,39;2,40;6,41,42;7,43;6,44,45;6,46,42;3,47;3,48;0,49,50;3,51;7,52;8,53,54;3,53;3,55,56;9,57,45,58,59,60;9,57,45,61,59,62;1,6;0,63;3,64;2,65;0,66;4,67;0,13;4,68;4,7;3,69,70;1,71,72;6,73,74;1,75;2,67;6,76,42;6,77,74;2,78;3,79,80;0,81;0,82,83;0,84;2,85;6,86,42;6,87,88;3,89,90;5,91;1,92,93;1,92,94;10,95,96,97;11,98;1,92,99;6,11,88;4,100;6,101,88;3,102,103;2,104;5,105,23,106;1,71,107;1,71,108;4,109;4,110;4,111;1,92,112;4,113;4,114;6,50,115;6,116,115;3,117,118;1,92,74;3,119,80;6,120,42;3,119,121;1,92,79;2,122;6,123,30;1,71,124;4,125;6,126,30;4,122;6,127,42;3,128,90;3,119,129;4,130;4,131;1,20,132;5,133,134,39;6,135,42;3,119,136;4,137;6,138,88;4,139;2,140;3,141;5,142;1,109,6;6,12,88;4,143;5,144;1,92,25;1,71,74;1,92,145;6,146,42;3,119,147;3,148;0,149;2,150;2,151;5,105;6,152,115;3,153;4,154;5,155;2,156;1,6,7;5,157;6,158,42;6,159,42;5,160;1,161,137;1,162;2,163;6,164,88;1,92,13;0,165,166;5,167;1,92,168;4,75;2,169;3,170;4,17;0,171;2,109;6,172,88;6,173,74;6,47,174;1,1,63;4,175;6,176,42;3,177;3,178,103;1,15,179;3,180,90;4,181;3,119,182;2,183;5,184;0,26;6,185,42;0,26,186;4,187;1,1,49;0,26,83;2,188;2,189;0,190;4,191;3,192;6,193,74;11,194;0,195,196;6,197,42;3,198;2,14;3,199;3,200;2,201;6,202,115;12,203;1,204,174;2,205;4,15;0,66,10;2,206;3,207;1,208,152;3,209;2,210;0,23,211;1,92,212;3,50;1,71,213;0,66,214;5,215;2,17;4,216;1,1,74;4,217;6,218,45;2,132;5,219;5,8,134,39;1,20;1,6,33;6,220,30;1,221,222;1,223,224;0,225;3,134;2,226;4,227;5,228;6,229,115;5,230;3,174;2,216;0,23,79;3,231;2,232;3,119,233;2,100;3,234;3,235;1,71,236;0,237;5,238;5,239;5,240;2,241;5,242;0,243;7,53;8,53;0,244;0,245;6,6,74;1,92,131;2,130;0,13,246;3,247;3,248,118;6,249,42;2,250;3,251;5,252;1,253;5,254,255,39;2,256;3,257;5,258;0,259;1,1,209;3,260,129;3,47,233;5,261,134;0,262;1,11;3,127;1,92,263;5,8,134;1,71,50;1,253,13;3,264;1,109;1,1,66;5,265,134;6,218,174;6,6,174;6,266,115;1,71,267;1,1,268;4,269;1,1,270;4,271;13,8;0,272;0,273;5,274;1,1,275;0,23,276;6,277,115;12,278;3,279,136;12,280,136;0,13,83;2,253;5,281,282,106;0,66,83;6,7,174;2,283;6,29,74;0,23,241;4,284;6,100,115;3,285;3,286;2,287;5,288;0,289;2,131;6,290,174;6,109,174;6,291,174;3,292;0,293;6,294,30;1,11,15;2,295;2,296;1,1,297;1,208,298;6,299,174;1,20,300;0,301;0,302;5,303;2,304;3,209,70;0,23,305;1,221,224;1,306,307;5,308,134;6,163,30;3,100;3,309;5,310,134;5,311;6,312,115;0,313;5,314,315;3,316,136;3,317;4,14;3,318,233;6,17,88;5,319,134;1,151;12,320;5,142,134;2,321;1,322,323;6,10,74;0,324;3,325,136;1,326;3,327,129;3,328,129;1,20,83;3,329,90;4,253;1,1,330;6,17,174;5,331,134;2,332;2,75;3,276;6,29,88;6,6,88;0,165;5,333,134;12,207;2,334;2,335;2,110;1,130;1,131;4,336;1,92,66;5,155,134;0,337;1,221,338;5,339;1,69,278;12,276;6,340,174;3,341,45;1,20,7;5,342;0,23,343;1,344;2,345;1,1,93;2,346;1,1,229;0,347;4,348;6,349,74;4,350;3,351;4,335;0,82;1,92,26;0,352;0,353,354;6,253,174;5,355,134;6,356,88;4,332;5,357,358,106;2,359;0,360;6,109,88;6,151,88;6,7,88;2,361;1,92,8;0,23,74;0,362;2,363;1,364,365;1,92,83;3,366;3,166;3,79;3,367;4,151;6,14,30;0,368;0,369;1,1,370;6,6,23;6,7,23;6,17,23;6,151,23;6,334,23;1,221,26;0,371;0,372;2,373;0,23,374;5,375;0,376,377;5,378;0,379;0,49,380;1,373;2,381;0,66,382;12,383;4,256;6,384,174;2,385;0,386;3,387;2,388;5,389,134;2,390;5,391,392;5,393;5,394;5,395,134;6,75,174;6,396,42;12,209;5,281,397,106;6,17,30;3,278;1,71,398;0,399,74;12,47;3,365;2,400;0,401;6,402,115;6,296,42;5,403,134,106;6,404,174;6,256,174;0,405;4,69;5,406;5,407;14,408,409;2,410;6,32,88;3,411;1,71,412;6,335,174;5,413,414;5,389;3,415;0,416,417;1,29;0,26,418;0,419;1,8,26;2,18;0,420,421;1,6,373;1,7,14;13,130;2,12;1,422,50;0,423;0,23,417;8,424;0,425,426;1,1,427;1,92,323;0,23,33;2,428;6,429,115;0,23,224;1,430;1,208,431;1,1,432;3,1;1,1,433;3,434,435;3,436,233;1,437;1,181;12,438;6,109,30;6,7,30;5,439,440,39;6,441,74;6,442,23;3,443;1,345;3,444,70;1,32,445;0,66,446;6,447,448;14,364,365;0,449;6,6,30;1,20,240;14,450,451;1,29,13;5,8,452;6,18,74;5,8,453,106;6,454,88;6,455,88;5,8,456;6,457,88;6,458,23;6,444,88;1,110;1,335;14,10,459;3,312;5,460;5,461;2,462;6,463,88;6,464,88;6,465,88;6,466,88;6,467,88;6,468,88;6,469,88;1,470;5,230,471;6,126,88;6,181,88;1,472;5,142,134,39;1,473,474;14,475,476;3,477;3,478;1,12;1,479;0,66,480;3,481,129;6,11,74;14,71,482;5,8,483,106;1,208,13;14,6;14,484,485;1,486;0,259,487;14,475,488;0,489;1,92,490;7,491;0,492,23,24,493;1,15;1,92,494;1,495;6,12,74;6,131,74;1,496,497;1,498,50;0,499;0,23,500;14,208,501;1,20,66;0,165,502;2,503;0,293,83;3,504;12,505;6,506,23;5,105,134;3,507;1,508;0,492,509;5,510,511;1,20,26;1,496,278;1,8;1,512,504;1,513,514;1,306,278;1,92,417;2,470;13,48;1,92,515;0,324,516;0,425,517;6,256,174,518;6,519,174,518;6,472,174,518;12,520;0,26,521;6,522,45;15,523,23,524;1,496,13;8,525;15,526,136,527;3,528;7,79;12,529;6,530,30;6,6,174,518;0,425,49;0,13,276;0,26,417;6,531,88;3,532;1,533;6,534,448;3,535;6,335,30;3,536;2,537;6,6,42;13,132;13,538;6,531,74;12,29;3,539;6,540,115;6,541,115;14,458,542;3,543;14,29;6,544,74;14,20,545;7,546;16;0,13,74;2,547;1,475,488;1,204,488;6,488,88;0,13,548;2,549;17,550;0,551;6,75,88;0,165,398;6,552,115;6,553,42;6,554,88;12,555;6,29,556;6,557,115;7,558;3,559;3,560,233;6,561,174;0,425,79;12,79;2,562;0,563,564;0,165,565;5,8,566;0,567,83;6,568,88;12,18;1,92,569;4,570;6,571,88;13,278;6,572,115;0,371,573;6,574,42;2,575;12,576;3,515;4,577;6,578,174;3,47,80;2,519;0,579;6,580,88;0,581;5,258,23,39;6,151,174;6,582,88;6,50,583;1,584,585;12,515;6,586,88;18,587,588,589;14,433,590;5,591;2,592;0,492,74,24,134;0,593;0,26,594;0,66,594;12,595;17,596;8,79;0,49,597;5,598;6,599,74;0,600;15,601,136;6,602,42;1,151,603;1,496,604;16,605,606;2,284;10,607,608,609;10,610,611,612;0,66,23,24,613;0,425,614;0,66,615;1,496,616;10,617,618,619;5,105,620;0,195,509;0,66,621;3,622;14,1,623;9,624,45,74,59,625;3,626;14,627,409;3,628;1,221,629;1,17,630;7,631;12,632;6,633,115;6,634,88;15,635,136,527;5,636,637,39;0,376,638;18,639,640,589;5,393,134,39;5,641,134,39;0,13,516;9,57,45,642,59,643;0,26,644;15;3,645,103;1,6,83;6,646,74;14,647,648;2,649;7,47;7,650;1,132,651;0,492,652;3,653;3,654;19,655,656,657;6,658,42";

const $scriptletArglistRefs$ = /* 2059 */ "747;201;666,667,668;6,48;595;54;480;15;284,373,472,473;57;307;7;54;685;171;54;768;193;48;255;255;54,498;5,10,453;405;375;578;87,380;735;25,26,27,28;202;487;692;9;194;755;5;7;578;307;673;276;608;413;117;323,508;674;255;321;191;230;83;616;7,52,56,87;578;301,605,606;578;661;255;752;156;54;638;5,10,453;578;375;333;20;326;22,687,777;704;704;54;7;52;7;54;8,48;52;5,211,721;24,724;61;54;666,667;560;52;54;54;701,726;371;375;664;234;610;346;249;335;237;343;8;323,508;278;647;612;22,687,777;612;611,612;578;272;391;251;255;54,324;363;711,724;24,26,685,723,724,725;54,135,374;697;148;22,687,777;38;2;180;48;15;170;5;154;352;22,687,777;666,667,668;739;0;787;80;330;533;657;284;347;285;155;54,307;52;52;15;306;156;15,52,678;48;3;133;44;48,159,323,667;203;578,674;52;608;7;685;15;458;331;7,174,254,316,317,318;304;236;200;5,10,134;578;54;335;259;15,54;8,54;667;687;48,548;8,476;740;776;54;48,280,445;578;665;459;255;679;403;167;11;683;612;790;271;322;38;323,508;131;54;647;488;54;276;335;547;48;233;668;244;5,135;39;39;745;404;52;7,60,381,382,383;301,302;255;255;683;48;5;52;473;48;331;52;5,456,457;48,301;54;302;359,455;390;19,301;368;337;54;81;503;22,687,777;787;376;34;711,724;610;0;674;48;610;578;620;503;54,406;48,111,280;19,54;768;156;307;8;69,279;48;726;2;323,508;270;5,6;194;73;711,724;7;443;576;49;779;651;301;535;52;683;690;157;550,551;578;48;54;52;666,667,668;8;26,221;54;8,419;8;15;578;309;48;323,508,596;54;5,66;398,746;578;675;8;54;52;698;285;52;5,298;708;501;260;0;683;470;287;12,48;140;578;88,284,368,471;121;193;323,508;54;695;97;486;95;54,406;48,597,598,599;449;583;578;41,42;54;94;331;263,264;156;355;323,508;578;578;97;389,390;2;87,88;15;331;578;7,190,342;301;578;536;13;662;278;52,53;8;139;578;7;20;301;54;683;683;683;450;10,56,432,433;779;278;278;169;80;48,323,372,373;38;19;54,371;61;481;18,177;685;54;144;54;552,553,554;787;48;162;54;791;54;48;24,26,27,28;661;170;670,671;5;674;173;323,508;154;751;244;672;48;729;323,508;695;216;7,134,135;674;48,273;54,307;54;121;726;727;7;7,17,121;576;754;19,48;52;48,597,598,599;667;301;666,668;105;578;7,13,351;48;7;284,410,411;8,15;321;685;594;54,463;24,301;24,301;130;260;578;104;48,170;79,123;7,87;48,597,598,599;2;139;48,597,598,599;15;15;768;578;387;48,597,598,599,600,601;54;48;7,157;48,313;54;48,422,423;749;468;48;575;323,508;301,507;320;48;762;286;373;52;687;687;52;285;537;728;52,54;87,88;710;415;528;557;272;8;62,63;52;142;357;203;48;682;48;695;157;73,281;54;298,650;46,47;5;593;54;118,156;54;276;7;788;157;149;578;627;503;503;291;15;18,48,157,158,159;389,390;578;13;673;19,54;19,54;113;774;343;48,435;685;54;578;54;174;505;53;52;321,685;48,87,88;7;514;24,301;359;8;473;561;184;713;255;255;255;747;327;48;48,356;241;578;711,724;301;52;373,643,644;307;307;248;5,10;8,434;13,19,48,174;329;90;323,508;175;779;131;683;683;683;683;683;683;683;683;683;683;683;738;685;38;300;757;465;310,311;52;685;670,671;323,508;52;436;578;578;689;127;192;5,18,179,211;163;726;296,297,298;170,182;52,448,782;196;355;321;5,456;578;323,508;54,373;19,54;209;48;578;48,280,445;54,307;5,10,371;742;53;99;207;734;323,508;121;656;365;290;692;482,483,484,485;13,14;54,685;59;48;13,48;7;48,385;6,48;7;48,88,110,111;323,508;641;578;674;93;255;15;323,508;578;87,380;630,631,632,633;578;323,508;756;578;48,597,598,599,600,601;412;323,508;17,18;235;19,48,222;39,676;559;8;516;203;189;753;707;673;685;360;8;8;285;712;156;367;692;48;390;48;578;278;52;530,531,532;52;141;546;306;8;276,557;784;571;48;6;578;136;45;8;7,8;48,52;373;505;323,508;203;298;54;657;172;685;390;37;338;6,48;87,254;508,556;52;156;135;436,673;650;368,408,493,494;33;109;389,390;54;24,766,767;54;427;216;578;250,394,395;414;692;156;615;19,48;52;5,254,408;8;255;70;19,54;249;276,368;578;683;666,667,668;666,667;323,508;301,500;7,87;331,373,634;129;696;54;34;683;683;683;683;683;683;683;683;683;683;683;683;683;683;683;517;472,531,543,654;8;687;6,48,88;283;693,694;775;8;192;685;765;6,54;207;48;13;578;276,544;773;304;150,190,211;691;543,730;54;5;295;188;578;206;96;578;52;61;54;323,508;683;764;54;578;19;48;546;276,544;58;52;52;276,557;150;702;48;74;229;32,462;301,351,770,771,772;8;277;578;54;323,508;152,153;374,419;48,150;578;142;729;323,508;578;5,13;692;578;341;48;323,508;165;323,508;628;323,508;578;170;193;496;52;48;711,724;216;8;84;344;778;185,186,187;692;48;248,249;72;285;8;276,544;518;158,276,301,373,490,491;256;705;686;268;307;414;639;655;578;578;578;13,48;446;578;711;578;48,223;52;759;289;787;323,508;52;340;0;577;685;8;743;8;687;54,463;578;262;48;8;674;54;477;629;52;52;402;307;102;8;42,781;578,673;679;54;284,720;8;576;726;98;578;578;549;692;335;460;14,18,110;83;6;780;276,544;237;761;426;5;19,54;683;19,20;121;711,724;103;667;390,685;15;722;301,500;301,500;131;638;8;541;7,254;301;679;683;683;683;683;683;7;48;375;497;50;8;207;19,54;323,508;48;323,508;719;52;320;301;268;248;5,13;718;323,508;276;48,88;241;10;54;5,10,159;48;284,305;578;142;7;54;578;673;48;248;578;578;578;7,56,423;121;5;474;13,48;466;268;350;87,88;54;331;473;663;52;52;578;323,508;451;0;21;156;683;237,238;673;19,280;679;592;19,54;578;578;706;5,19,371;211;36;578;52;260;284;300;139;578;353;323,508;307,660;19,48,150,170,301,619;6;18,88,505;276;323,508;255;386;578;301,648,649;323,508;578;19;679;426;127,673;5;647;54;578;5,10;64;54,685;54,56;454;323,508;578;20,685;683;193;218;447;13;578;6;371;60,266;685;578;52;276;543;578;578;52;8;52;78;48;48,88,280;61;48,607;5;787;578;18,54;503;431;83;685;563,564,565,566,567,568,569;513;741;137;156;5,13,134;54,174,724;323,508;16,48,142;692;578;301,614;301,659;578;6,48;590,591;353;699;374;375;477;173;578;578;578;390;578;578;335;267;48;787;19,54;680;54,276;284;185,186;54,685;6,280;48;5,10,150,159,211,379,625;301,500;8;348;400;143;48;26,27,28,29,30,31;150;683;683;683;582;15;8,15;288;37;54;7;273;280,444,445;679;452;323,508;578;243;464;48,79,573;48,548;52;636,637;95;108;478;116;555;181;399;7,56;416;54;578;578;578;5;312;428;408,557;48;87,380;523,524;578;48;323,508;578;224;578;254,280,323;323,508;54,685;54;5,6;578;7,79;578;193;80;218;613;54;54;5,10,211,379;52;475;267;240;758;763;332;307;267;48;19,48;5;478;673;323,508;104;193;321;83;388;48;301,302,574;323,508;323,508;687;652;255;156;52;667;54;578;199;578;284;640;679;674;473;52;373;502,503;787;178;789;211,407;323,508;323,508;48,79,177,539;375;667;5,13;5;18;54;48,597,598,599,600,601;7;578;677;578;48;97;195;609;469;578;578;5,176;578;48;578;183;669;674;674;787;248;315;335;54;578;578;578;737;578;323,508;156;54;54;687;307;54,498,499;301,500;301,500;285;504;674;185,186;150;185,186;301;48;578;528;166;100;284,303,304,305;540;124,125;48,150;8,19;139;578;272;18,126;48,382;87,88;219,220;578;114;661;323,508;54;7,79;206;285;461;578;193;578;10;6;744;371;54;700;515;345;692;254,316,508,626;7;276;323,508;91;13;19,54;48;578;48;52;705;54;48;578;7;48,88,570;521;368,417;52;578;97;54,174;13,48;48;61;6;658;562;389;578;588,589;67;307;282;5;323,508;277;674;89;48;293;285;673;261;314;247;715;48,244;587;674;301,500;120;54,511,512;578;6;84;578;52;48;391;285;578;578;150;5,10,13;137;578;495;206;685;92;578;150;578;787;17,18;48;54;7,19;7;54,335;274;8;135;323,508;692;323,508;54,170;581;248;736;54;509;2;716;718;304;7,13,179;52;323,508;18,110;7,16;268;142;48,597,598,599,600,601;578;52;578;578;2;139;35;714;54;274;301,500;750;701;323,508;301,635;323,508;301,500;323,508;578;769;576;76;82;323,508;576;218,390;52;76,77;8,48,111,393;323,508;301;299;48;692;205;48;704;208;8,19,168;578;48,534;5,135;60;505;130;321;578;7,13,56;190;5;578;242;8;578;7;529;48,597,598,599;48,273;578;6,10;54;48;673;48;285;68;306;703;142;146,147;775;522;578;525,526,527;48,380;237;175;687;334;578;101;87,380;429,501;232;578;170;15;7,128;323,508;71;429;21;54;285;48;8;323,508;578;151;6,7;18,48;684;16;642;157,323,508;602;213;510;48,198;185,186;414;323,508;214;284,409;142;10,13,211,252;578;578;503,621,622,623,624;578;578;370;787;578;284,305,318;54;48,570;48;254,316,508,626;301,500;401;18,48;13,48;8;478;578;48,323,508,597,598,599,600,601;392;103;245;578;578;578;424,425;374,418,419,420;301,500;301,500;301,500;206;206;294;554;673;301,500;48;213;578;48;787;80;7,479;787;52;12,164;115;97;127;323,508;579;578;48,253,254;48;274;578;80;5,6;578;585,586;48,597,598,599;301,500;54;323,508;5,13,211;48,211;269;1;5;121;323,508;323,508;156;323,508;5,13;193;385;19;276;578;48;578;335;225;325;618;674;578;640;640;640;307;760;323,508;7,56;107;61;5,170,214,323,508,604;578;254,408,508;578;280,302,437,438,439,440,441;578;787;328;323,508;48,60;578;285;578;335;578;339;127;578;603;48;258;578;578;132;506;578;578;231;210;681;262,368,442;578;470;285;321;48,110,111,597,598,599;578;538;112;582;6;54;54;301;674,692;203;301,500;48,382;5,87,88;354;578;578;578;323,508;578;170;578;542,543;13,14;54;54;5,13;48;216;45;87,380;5,6;54;539;52;7,254;285;285;673;578;578;323,508;578;520;5;578;85;18,48;48,56;578;358;54;160;572;48;48;578;80;212;323,508;323,508;578;335;640;254,280;250;467;13;48;452;48;254,280;578;127;8,54;578;45;578;674;578;642;578;578;323,508;787;323,508;617;103;673;323,508;688;768;578;787;787;10,134,204;276;361,362;54;578;300;267;578;13,48,211,371,519;492;8;48,597,598,599,600,601;578;212;13,48,54,384;226;257;323,508;87,88;206;52;40;142;331;301,500;578;284,368;787;335;274;-748,748;16,48;51;787;421;56,88,150,280,292;121;578;578;48;161;323,508;578;138;578;308;578;300;578;97;5;19,396,397;181,215;323,508;787;12;13,48;323,508;52;578;65;578;150;578;578;246;54;674;241,335;578;5,10,134;301,500;175;323,508;653;43;578;48,88,280;275;48,217;48;558;54,731,732,733;100;106;506;98;640;5;6,48;687;706;8;578;75;295;276;54,170,280,323;578;48;48;578;578;86;578;323,508;54;193;13,48,336;301,500;323,508;717;230;48,597,598,599;783;5;578;301,500;6,48;48,219,280;0,54;578;714;10,174;578;7,56;578;88,122;10;301,500;272;349;373;265;784;353;578;578;578;578;371;5,13,134;83;301,500;578;13,48;578;48;54;323,508;578;54;578;301,500;197;14;227,228;239;150;578;48;48;726;377;54,472;323,508;578;5;578;366;19,48,584;578;578;578;211;301,500;319;323,508;54;545;578;55;23;787;301,500;578;578;52;48;301,500;12;301,500;301,500;578;301,500;381,580;578;301,500;307,650;2;211;301,500;301,500;87,88;785;2;121;48,489,597,598,599,600,601;16,121;578;10,134,378;578;633,645,646;54;430;218;578;8;54,119;7;61;768;301,500;768;48,511;56,87,284;48;301,500;301,500;285;19,135;786;301,500;87,254;48,323;48;364;369;145;5,6;48;4;6,15,19,262,709";

const $scriptletHostnames$ = /* 2059 */ ["x.com","xe.gr","anix.*","clk.sh","ddys.*","dood.*","epn.bz","evz.ro","hqq.to","hqq.tv","kmo.to","mbs.jp","mio.to","netu.*","rp5.by","sgd.de","shz.al","t3.com","tfp.is","ttv.pl","tvn.pl","voe.sx","wjx.cn","xtv.cz","1mg.com","app.com","appd.at","bbc.com","bflix.*","bold.dk","c315.cn","cbr.com","cine.to","clk.ink","cnn.com","coag.pl","csid.ro","dnj.com","doods.*","edn.com","gats.io","gmx.com","gmx.net","humo.be","ibps.in","ijr.com","itvn.pl","jfdb.jp","lifo.gr","mdpr.jp","med1.de","mgsm.pl","onna.kr","pnj.com","pobre.*","rgj.com","sbot.cf","tvn7.pl","veev.to","vox.com","vsco.co","vtbe.to","wjx.top","ydr.com","10tv.com","2219.net","9tsu.vip","abola.pt","anigo.to","arras.io","arrax.io","asiatv.*","bcs16.ro","citas.in","cmg24.pl","cnki.net","daum.net","delfi.lt","dngz.net","embed.su","emol.com","espn.com","flixhq.*","gakki.me","glam.com","hemas.pl","j91.asia","jetv.xyz","jpnn.com","khou.com","kukaj.io","libgen.*","likey.me","mhwg.org","nsmb.com","pisr.org","poedb.tw","railf.jp","romet.pl","rukim.id","sbflix.*","senpa.io","sflix.ca","sflix.fi","sflix.is","sflix.to","sj-r.com","tadu.com","talpo.it","tepat.id","tvn24.pl","ufret.jp","utour.me","vembed.*","vidsrc.*","virpe.cc","wtsp.com","xnxx.com","yflix.to","yuuki.me","zaui.com","zdnet.de","zgbk.com","47news.jp","adpres.ro","ahzaa.net","aicesu.cn","anauk.net","anikai.to","aniwave.*","archon.gg","artsy.net","autodoc.*","b4usa.com","bmovies.*","brainly.*","brutal.io","cda-hd.cc","cpuid.com","critic.de","ctrl.blog","d0o0d.com","deepl.com","digi24.ro","dramaqu.*","earth.com","eater.com","edurev.in","felico.pl","filhub.gr","fin24.com","flagle.io","fmovies.*","fotor.com","freep.com","globo.com","gmx.co.uk","hdrez.com","hianime.*","ibomma.pw","imooc.com","invado.pl","jootc.com","juejin.cn","keybr.com","lesoir.be","lexlog.pl","lohud.com","lublin.eu","lunas.pro","m4uhd.net","mangaku.*","matzoo.pl","mcloud.to","megaup.cc","mm9841.cc","mocah.org","naver.com","nebula.tv","news24.jp","newsme.gr","ocala.com","ophim.vip","peekme.cc","player.pl","pling.com","quora.com","ruwix.com","s0urce.io","seexh.com","sflix2.to","shein.com","sopot.net","tbs.co.jp","tides.net","tiempo.hn","tomshw.it","turbo1.co","txori.com","uemeds.cn","uihtm.com","umk.co.jp","uplod.net","veblr.com","velicu.eu","venea.net","vidplay.*","vinaurl.*","virpe.com","watson.ch","watson.de","weibo.com","wired.com","women.com","world4.eu","wstream.*","x-link.pl","x-news.pl","xhbig.com","yeane.org","ytv.co.jp","yuque.com","zefoy.com","zgywyd.cn","zhihu.com","ziare.com","360doc.com","3xyaoi.com","4media.com","52bdys.com","699pic.com","actvid.com","adslink.pw","allsmo.com","analizy.pl","ananweb.jp","ancient.eu","animedao.*","animekai.*","auto-doc.*","bdb.com.pl","bejson.com","bembed.net","bestcam.tv","boards.net","boston.com","bpcj.or.jp","broflix.cc","caller.com","camcaps.to","chillx.top","citroen.pl","clujust.ro","crewus.net","crichype.*","curbed.com","d0000d.com","debeste.de","deezer.com","depedlps.*","dlions.pro","dlnews.com","drkrok.com","dxmaps.com","e-sushi.fr","earnload.*","ebc.com.br","embedv.net","esaral.com","fauxid.com","fflogs.com","filefox.cc","filiser.eu","film4e.com","fjordd.com","fnbrjp.com","foodie.com","fullxh.com","galinos.gr","gaz.com.br","ggwash.org","goerie.com","gomovies.*","gplinks.co","grunge.com","hdtoday.so","hienzo.com","hindipix.*","hitcena.pl","hoca4u.com","img999.com","javbix.com","jdnews.com","jeu2048.fr","jeyran.net","jnews5.com","kapiert.de","knshow.com","lcpdfr.com","ldnews.com","legacy.com","listatv.pl","lofter.com","looper.com","love4u.net","lwlies.com","mashed.com","masuit.com","maxroll.gg","mbalib.com","mdlinx.com","medium.com","megaxh.com","menrec.com","milfzr.com","mongri.net","motogon.ru","mpnnow.com","naaree.com","neobux.com","neowin.net","newspao.gr","njjzxl.net","nypost.com","opedge.com","oploverz.*","pc3mag.com","peugeot.pl","piklodz.pl","pixnet.net","pixwox.com","pjstar.com","pokeos.com","polyvsp.ru","protest.eu","qidian.com","quotev.com","racked.com","rdsong.com","riwyat.com","rrstar.com","salina.com","sbenny.com","sbface.com","scribd.com","sdewery.me","sexpox.com","skuola.net","tcpalm.com","texte.work","tiktok.com","tmnews.com","top1iq.com","totemat.pl","tumblr.com","tvzingvn.*","uol.com.br","utamap.com","utaten.com","vcstar.com","wader.toys","watchx.top","wormate.io","wpchen.net","xhamster.*","xhopen.com","xhspot.com","yamibo.com","youmath.it","zalukaj.io","zingtvhd.*","zingvntv.*","zulily.com","102bank.com","123movies.*","9xbuddy.com","abstream.to","accgroup.vn","adevarul.ro","affbank.com","amlesson.ru","aniwatch.to","antena3.com","aoezone.net","asia2tv.com","ask4movie.*","autodoc24.*","badayak.com","bdcraft.net","bg-gledai.*","bhaskar.com","bianity.net","bimiacg.net","bitcine.app","bluphim.com","boke112.com","bypass.city","canale.live","cattime.com","cepuluh.com","clockks.com","cmjornal.pt","cnblogs.com","coinurl.net","comikey.com","cookhero.gr","d4armory.io","day-hoc.org","decider.com","disheye.com","djelfa.info","dogtime.com","dramacute.*","ds2play.com","duracell.de","elahmad.com","embasic.pro","embtaku.pro","eoreuni.com","epitesti.ro","esologs.com","esscctv.com","europixhd.*","explore.com","ezmanga.net","f2movies.ru","faptiti.com","flixrave.to","fosshub.com","fosters.com","fruit01.xyz","funivie.org","gamegame.kr","geotips.net","goalup.live","goodhub.xyz","hianimez.to","hidemywp.co","hongxiu.com","hotleak.vip","hotleaks.tv","howjsay.com","htforum.net","htrnews.com","hukmatpro.*","hulnews.top","ideapod.com","ilife97.com","infokik.com","inverse.com","j-lyric.net","jafekri.com","javbest.xyz","javgrab.com","jio.pftv.ws","kinston.com","kitguru.net","koltry.life","kpopsea.com","ktm2day.com","l2gamers.cl","lalawin.com","lasexta.com","lataifas.ro","leetcode.cn","logonews.cn","lolle21.com","lover93.net","maduras.vip","magesy.blog","malekal.com","mangatoon.*","manhwa18.cc","masrawy.com","maxt.church","mediafax.ro","megaup.live","megaup.site","milenio.com","mobiflip.de","moviepl.xyz","mrbenne.com","nettv4u.com","newsbook.pl","ngelmat.net","novelism.jp","novelza.com","ntuplay.xyz","ntvspor.net","nulled.life","nytimes.com","odiario.com","ohli365.vip","ohmygirl.ml","olarila.com","ontools.net","oreilly.com","otakudesu.*","pagesix.com","pancreas.ro","pandurul.ro","pashplus.jp","phimfit.com","pinterest.*","pngitem.com","poipiku.com","poli-vsp.ru","polygon.com","postype.com","promotor.pl","putlocker.*","qrcode.best","racevpn.com","radioony.fm","redding.com","romviet.com","rubystm.com","rubyvid.com","runmods.com","safetxt.net","satcesc.com","sbbrisk.com","sctimes.com","shaamtv.com","sherdog.com","shinbhu.net","shinchu.net","skionline.*","smalley.com","spectank.jp","starbene.it","stbnetu.xyz","strcloud.in","swtimes.com","taxo-acc.pl","teachoo.com","techgyd.com","tekstowo.pl","thelist.com","thotsbay.tv","tinyppt.com","tistory.com","titulky.com","topfaps.com","trakteer.id","trentino.pl","tuborstb.co","tunegate.me","turbolab.it","tv.bdix.app","tvn24bis.pl","tvnstyle.pl","tvnturbo.pl","twitter.com","unixhow.com","untitle.org","upstream.to","uta-net.com","uticaod.com","v6embed.xyz","vedantu.com","veneto.info","vgembed.com","vidembed.me","videovard.*","viewing.nyc","voirfilms.*","wattpad.com","wawlist.com","wikihow.com","winaero.com","winmeen.com","wired.co.uk","wishflix.cc","wizcase.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhtotal.com","xhwide5.com","xossipy.com","ymovies.vip","zerogpt.net","ziperto.com","zonatmo.com","30edu.com.cn","4x4earth.com","abril.com.br","abysscdn.com","adbypass.org","afrikmag.com","agrointel.ro","allmovie.com","amarillo.com","amestrib.com","amtraker.com","anime2you.de","anisearch.de","anisubindo.*","athletic.net","autoembed.cc","avdelphi.com","bigulnews.tv","bilibili.com","bitblokes.de","bonobono.com","bphimmoi.net","ciweimao.com","cjonline.com","codedosa.com","cool-etv.net","crewbase.net","cronista.com","descopera.ro","dispatch.com","dollarvr.com","ds2video.com","dushu.qq.com","einthusan.tv","elheraldo.hn","fabricjs.com","fairyabc.com","fightful.com","filmzone.com","foodviva.com","forplayx.ink","fosspost.org","fxstreet.com","gamerant.com","gardenia.net","gay69.stream","gdplayertv.*","gearside.com","geniusjw.com","ggeguide.com","ggulpass.com","globaledu.jp","gnt24365.net","habuteru.com","hindi-gk.com","ieltsliz.com","ikorektor.pl","indystar.com","inquirer.net","intramed.net","itvnextra.pl","javjavhd.com","jbjbgame.com","jconline.com","jobskaro.com","joysound.com","jsonline.com","kaystls.site","kentucky.com","knoxnews.com","kolnovel.com","korona.co.jp","kritichno.bg","kurazone.net","kurosave.com","kusonime.com","lazyadmin.nl","leekduck.com","ligowiec.net","linkmate.xyz","liverpool.no","lookmovie.ag","lookmovie2.*","lowcygier.pl","mangainn.net","megacloud.tv","megapixl.com","megatube.xxx","meteo.org.pl","mimikama.org","mineskin.org","mmamania.com","moneyguru.co","movieweb.com","msubplix.com","myflixerz.to","myoplay.club","njherald.com","nonton78.com","novagente.pt","novelpia.com","nowcoder.com","npnews24.com","nsfwzone.xyz","nwherald.com","nzbstars.com","olacast.live","omnisets.com","oricon.co.jp","otakukan.com","ouasafat.com","pal-item.com","palemoon.org","paxdei.th.gl","pcpobierz.pl","pelispedia.*","pentruea.com","photopea.com","picallow.com","pitesti24.ro","playbill.com","pornhd8k.net","portalwrc.pl","powerline.io","priberam.org","pupupul.site","putlocker.pe","radarbox.com","radichubu.jp","reflectim.fr","relet365.com","revenue.land","sarthaks.com","sbnation.com","shumilou.com","sidereel.com","solarmovie.*","sportnews.to","sportsnet.ca","steptalk.org","streamsb.net","streamtape.*","sussytoons.*","suzylu.co.uk","techsini.com","tecmundo.net","telegram.com","th-world.com","theblaze.com","thegamer.com","theverge.com","thizissam.in","topeuropix.*","transinfo.pl","tritinia.com","tutlehd4.com","tvnfabula.pl","tvtropes.org","ultraten.net","unidivers.fr","urbharat.xyz","usatoday.com","valuexh.life","vid2faf.site","vidplay.site","visse.com.br","voeunblk.com","volokit2.com","webnovel.com","webwereld.nl","wrosinski.pl","wzamrani.com","xclient.info","xhaccess.com","xhadult4.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","yhocdata.com","0123movies.ch","4kwebplay.xyz","4spromax.site","7misr4day.com","adslayuda.com","alfred.camera","animedrive.hu","animeunity.it","anisearch.com","aniwatchtv.to","ark-unity.com","artesacro.org","asheville.com","audiotools.in","autophorie.de","azcentral.com","aztravels.net","blindhelp.net","blog.csdn.net","blog.kwick.de","bluesnews.com","bongdaplus.vn","box-manga.com","bricksrus.com","broncoshq.com","buienradar.nl","cantonrep.com","casertace.net","centrumher.eu","chieftain.com","chowhound.com","city-data.com","cocomanga.com","coffeeapps.ir","colourxh.site","cyberalert.gr","dddance.party","desertsun.com","desijugar.net","deutschaj.com","dlmovies.link","downfile.site","eca-anime.net","economica.net","emailfake.com","eplayer.click","fantricks.com","firescans.xyz","flory4all.com","flyertalk.com","fontsfree.pro","foxaholic.com","foxteller.com","fraudnavi.com","full-anime.fr","galesburg.com","gaminplay.com","getective.com","gezimanya.com","gmarket.co.kr","goodbakery.ru","goupstate.com","gukjenews.com","helldivers.io","hellokpop.com","hillsdale.net","holakikou.com","howtogeek.com","hutchnews.com","icy-veins.com","ideas0419.com","infodifesa.it","instagram.com","iptv4best.com","jk-market.com","kapitalis.com","kitsapsun.com","kpopjjang.com","laptopmag.com","leeyiding.com","libertatea.ro","limametti.com","listeamed.net","live.b-c-e.us","liveonsat.com","livetennis.it","longecity.org","loverslab.com","m.youtube.com","makeuseof.com","mangaid.click","maxedtech.com","mediafire.com","mediotejo.net","megawypas.com","memangbau.com","meteoblue.com","miraculous.to","mocospace.com","movie-web.app","movie4kto.net","mt07-forum.de","mzzcloud.life","nbcsports.com","neilpatel.com","neoseeker.com","newbernsj.com","newportri.com","newschief.com","neyrologos.gr","nicematin.com","oakridger.com","oceanplay.org","oklahoman.com","otakudesu.org","otempo.com.br","perplexity.ai","phrasemix.com","piecesauto.fr","plural.jor.br","polsatnews.pl","polyflore.net","proboards.com","protopage.com","putlocker.vip","qqwebplay.xyz","radartest.com","radio5.com.pl","rapidshare.cc","readnovel.com","recordnet.com","routenote.com","sachonthi.com","sat-charts.eu","savvytime.com","scrolller.com","shopomo.co.uk","shortform.com","slashfilm.com","slashgear.com","solotrend.net","southcloud.tv","spookshow.net","sportsupa.com","sporttotal.tv","statesman.com","store.kde.org","streamvid.net","studyadda.com","suedkurier.de","swtorlogs.com","t.17track.net","techkings.org","theintell.com","theledger.com","thememypc.net","thethings.com","thewpclub.net","tiermaker.com","timponline.ro","tomsguide.com","top.howfn.com","torontosom.ca","trangchu.news","trojmiasto.pl","tweaktown.com","ubuntudde.com","unikampus.net","uniqueten.net","unlockxh4.com","up4stream.com","uwayapply.com","vid-guard.com","videohelp.com","vidstream.pro","vipstreams.in","visionias.net","vnexpress.net","voe-unblock.*","voeunblck.com","vpnmentor.com","vtube.network","warning.or.kr","waves4you.com","wikibious.com","www.ntv.co.jp","xfce-look.org","xhbranch5.com","xhchannel.com","xhplanet1.com","xhplanet2.com","xhvictory.com","xiaomi4mi.com","yoyofilmeys.*","zerohedge.com","zwei-euro.com","99bitcoins.com","adnan-tech.com","ajanstv.com.tr","allcryptoz.net","ananda-yoga.ro","androidmtk.com","anime-drama.jp","animefire.plus","arlinadzgn.com","audiostereo.pl","audiotools.pro","auto-treff.com","autopareri.com","battle-one.com","bharatavani.in","bigdatauni.com","bikesell.co.kr","bingotingo.com","blog.naver.com","brownsboys.com","btvnovinite.bg","cafe.naver.com","cdramalove.com","chronologia.pl","cincinnati.com","clasicotas.org","clipartmax.com","coinsparty.com","coloradoan.com","comingsoon.net","crunchyscan.fr","curseforge.com","daily-jeff.com","dailycomet.com","dailyworld.com","daotranslate.*","dba-oracle.com","demolandia.net","developpez.com","diaforetiko.gr","doc.mbalib.com","dodge-forum.eu","dreamstime.com","droidtekno.com","dzwignice.info","edailybuzz.com","emturbovid.com","enduro-mtb.com","erinsakura.com","estadao.com.br","eveningsun.com","evreporter.com","fimfiction.net","freeforums.net","fucktube4k.com","funnyordie.com","galleryxh.site","gamebanana.com","gearjunkie.com","genesistls.com","gnome-look.org","golfdigest.com","guiasaude.info","heraldnews.com","houmatoday.com","how-to-pc.info","icourse163.org","ideaberita.com","impots.gouv.fr","indeonline.com","indiatimes.com","infoplease.com","intergate.info","iphonecake.com","iwanichi.co.jp","jacksonsun.com","japan-fans.com","javsubtitle.co","jeniusplay.com","jpopsingles.eu","kangmartho.com","karsaz-law.com","katosatoshi.jp","kicknews.today","kuchniaplus.pl","kutub3lpdf.com","lcsun-news.com","leakedzone.com","learninsta.com","lenconnect.com","lendagames.com","linux-apps.com","lowkeytech.com","majorgeeks.com","malybelgrad.pl","mangareader.to","mangaschan.net","marionstar.com","megapastes.com","mixmods.com.br","mixstreams.top","mkv-pastes.com","moegirl.org.cn","moneyexcel.com","monroenews.com","moviesapi.club","movingxh.world","musicradar.com","musixmatch.com","myhtebooks.com","naijagists.com","naplesnews.com","naukridisha.in","ndtvprofit.com","nekopoi.web.id","netuplayer.top","news-press.com","news.17173.com","news.dwango.jp","news.ntv.co.jp","newsherald.com","newsleader.com","nickiswift.com","nogizaka46.com","ofuxico.com.br","oggiscuola.com","oparana.com.br","openfinanza.it","otvfoco.com.br","paidiatreio.gr","payeer-gift.ru","pecasauto24.pt","pekintimes.com","peliculas24.me","playerx.stream","prepostseo.com","pushsquare.com","rapid-cloud.co","readawrite.com","realpython.com","remixsearch.es","reviewmeta.com","riftherald.com","rightnonel.com","rivestream.org","rozbor-dila.cz","runningnews.gr","screenrant.com","scsun-news.com","selfstudys.com","seriesperu.com","shelbystar.com","shrinkearn.com","slideshare.net","sokolow-mlp.pl","starzunion.com","szkolawohyn.pl","techjunkie.com","techus.website","tekloggers.com","tennessean.com","the-leader.com","the-review.com","theflixertv.to","thegleaner.com","thehawkeye.com","themebanks.com","thestar.com.my","thezealots.org","topautoosat.fi","topcryptoz.net","translate.goog","tv-asahi.co.jp","tv-tokyo.co.jp","tv.youtube.com","tvfreemium.top","tvstreampf.xyz","urbanbrush.net","verselemzes.hu","voeunbl0ck.com","wasza-farma.pl","webcamtaxi.com","whatfontis.com","wheel-size.com","whoisnovel.com","world-novel.fr","wpplugins.tips","xhamster46.com","xhofficial.com","xhwebsite5.com","zipcode.com.ng","10000recipe.com","aepos.ap.gov.in","airfrance.co.jp","airnavradar.com","all4pets.com.pl","alltechnerd.com","altranotizia.it","androidtvbox.eu","appimagehub.com","appofmirror.com","arcanescans.com","argusleader.com","atribuna.com.br","auth.alipay.com","awebstories.com","bestjavporn.com","blitzrechner.de","bluemediafile.*","books-world.net","bucketpages.com","c4ddownload.com","calorielijst.nl","cinegrabber.com","cinemablend.com","comprerural.com","cristoiublog.ro","cssreference.io","cypherscans.xyz","daily-times.com","dailyrecord.com","delmarvanow.com","desbloqueador.*","diffchecker.com","drawasaurus.org","dubznetwork.com","dztechphone.com","elektrikmen.com","elitepvpers.com","elpasotimes.com","fabioambrosi.it","famousintel.com","fayobserver.com","fcportables.com","fdlreporter.com","flinsetyadi.com","formatatmak.com","freewatchtv.top","futbollatam.com","gagetmatome.com","gainesville.com","glistranieri.it","gosanangelo.com","guitarworld.com","halotracker.com","hansa-online.de","heavyfetish.com","hentaihaven.xxx","hibiki-radio.jp","hotpornfile.org","housedigest.com","ihbarweb.org.tr","ilsole24ore.com","includehelp.com","indahonline.com","japonhentai.com","kanjukulive.com","katerionews.com","kickante.com.br","kooora4livs.com","koszalincity.pl","langitmovie.com","lethalpanda.com","lgbtqnation.com","licensekeys.org","linuxslaves.com","livescience.com","loginhit.com.ng","loudersound.com","loveplay123.com","manhwahentai.me","maxstream.video","medeberiya.site","mediahiburan.my","megaup22.online","mehoathinh2.com","miniminiplus.pl","mmafighting.com","moneydigest.com","movies2watch.ru","music.apple.com","news-leader.com","news.chosun.com","northjersey.com","noweconomy.live","onlinetools.com","opendesktop.org","order-order.com","pawastreams.pro","pendulumedu.com","pepperlive.info","phimdinhcao.com","piecesauto24.lu","playonlinux.com","pogdesign.co.uk","polagriparts.pl","poolpiscina.com","primicia.com.ve","privivkainfo.ru","promobit.com.br","putlockernew.vc","qiangwaikan.com","quicksleeper.pl","randomstory.org","read.amazon.com","reborntrans.com","romprovider.com","ruidosonews.com","saikaiscans.net","savannahnow.com","sekaikomik.live","short-story.net","smashboards.com","sneakernews.com","spanishdict.com","starcourier.com","stargazette.com","statelibrary.us","staugustine.com","stream.bunkr.is","tallahassee.com","targetstudy.com","team-octavi.com","techlicious.com","technicpack.net","teile-direkt.ch","textcleaner.net","thegearhunt.com","thememazing.com","thenekodark.com","thenewsstar.com","thespectrum.com","thetowntalk.com","timeanddate.com","timesonline.com","tvshowstars.com","twinkietown.com","ukrainashop.com","uslsoftware.com","venusembed.site","videobot.stream","voe-unblock.com","voeun-block.net","voeunblock3.com","wallauonline.de","wenku.baidu.com","wrestlezone.com","www.youtube.com","yeuphimmoik.com","youtubekids.com","zippyupload.com","zoommastory.com","aberdeennews.com","acupoffrench.com","addons.opera.com","airlinercafe.com","alphapolis.co.jp","animecruzers.com","apornstories.com","arenavalceana.ro","articlesmania.me","as-selection.net","blueridgenow.com","book.zhulang.com","booksmedicos.org","bumigemilang.com","cabinetexpert.ro","canondrivers.org","capecodtimes.com","carsguide.com.au","cdnmoviking.tech","celebzcircle.com","celtadigital.com","cittadinanza.biz","civildigital.com","cleanthinking.de","commandlinux.com","courierpress.com","creativebloq.com","currentargus.com","cyberspace.world","dailynews.us.com","daya-jewelry.com","deccanherald.com","dicasdevalor.net","digminecraft.com","dongphimmoiz.com","dreamsfriend.com","dualshockers.com","easyayurveda.com","englishlands.net","erovideoseek.com","eurooptyk.com.pl","ewrc-results.com","experciencia.com","felizemforma.com","firmwarefile.com","floridatoday.com","fmhikayeleri.com","foodrepublic.com","freetvsports.xyz","freewaysintl.com","fv2freegifts.org","gadsdentimes.com","gordiando.com.br","gourmetscans.net","grandoldteam.com","hardcoregames.ca","healthdigest.com","hoosiertimes.com","htmlreference.io","husseinezzat.com","ilovevaldinon.it","info-beihilfe.de","infomoney.com.br","interviewgig.com","isekaipalace.com","iskandinavya.com","itscybertech.com","jacksonville.com","jamilacuisine.ro","jusbrasil.com.br","justswallows.net","kamerabudaya.com","karyawanesia.com","kitchennovel.com","klsescreener.com","knowyourmeme.com","kollyinsider.com","kooora4lives.net","lokercirebon.com","madeinbocholt.de","medievalists.net","metropoliaztm.pl","money-sense.club","myschool-eng.com","ncrtsolutions.in","newsforbolly.org","nhentaihaven.org","nofilmschool.com","nonesnanking.com","numberempire.com","nusantararom.org","nwfdailynews.com","nydailyquote.com","ofertecatalog.ro","onlineathens.com","outdoorguide.com","outidesigoto.com","paesifantasma.it","perlentaucher.de","petoskeynews.com","poconorecord.com","polskacanada.com","ponselharian.com","portableapps.com","postcrescent.com","pttws.ptt.gov.tr","pureinfotech.com","rabbitstream.net","raven-mythic.com","recordonline.com","repack-games.com","reporternews.com","reservdelar24.se","resourcepack.net","ribbelmonster.de","rule34hentai.net","sabishiidesu.com","savoriurbane.com","script-stack.com","segnidalcielo.it","sekai-kabuka.com","seoul.cs.land.to","sertracen.com.pa","simpleflying.com","sinhasannews.com","skidrowcodex.net","smokelearned.net","socialcounts.org","solarmagazine.nl","sssscanlator.com","ssuathletics.com","straitstimes.com","studiestoday.com","studyrankers.com","sweetslyrics.com","tabonitobrasil.*","tastingtable.com","tech-recipes.com","techtrickseo.com","tecnotutoshd.net","telefon-treff.de","tercihiniyap.net","thailandopen.org","the-dispatch.com","thedailymeal.com","thestarpress.com","thetimesnews.com","todaysparent.com","tohkaishimpo.com","tools.jabrek.net","tweaking4all.com","twitchemotes.com","ukworkshop.co.uk","un-block-voe.net","unknowncheats.me","vidstreaming.xyz","viewsofgreece.gr","vinstartheme.com","visefierbinti.ro","voe-un-block.com","voxvalachorum.ro","vvdailypress.com","wallpapercat.com","warcraftlogs.com","web.facebook.com","webcodegeeks.com","wikiofcelebs.com","wildstarlogs.com","wouterplanet.com","wrestlinginc.com","www.facebook.com","zdravenportal.eu","ziarulargesul.ro","zsti.zsti.civ.pl","affiliate.fc2.com","androidmakale.com","androidpolice.com","androidweblog.com","answersafrica.com","arras.netlify.app","balticlivecam.com","banglainsider.com","beaconjournal.com","blueraindrops.com","book.zongheng.com","braziljournal.com","brooklyneagle.com","cagesideseats.com","charbelnemnom.com","cheboygannews.com","chessimprover.com","chimica-online.it","cinemakottaga.top","citizen-times.com","citpekalongan.com","claplivehdplay.ru","clarionledger.com","classnotes.org.in","coolwallpapers.me","counciloflove.com","daily-tohoku.news","dailyamerican.com","dailynewsview.com","daimangajiten.com","dassen-azara4.com","daysoftheyear.com","deportealdia.live","der-postillon.com","descarga-animex.*","digitaltrends.com","encurtandourl.com","enjoytaiwan.co.kr","fordogtrainers.pl","francis-bacon.com","gamingsinners.com","gastongazette.com","geeksforgeeks.org","geeksoncoffee.com","good-football.org","gq-magazine.co.uk","grostembed.online","guides4gamers.com","heraldtribune.com","heypoorplayer.com","hitproversion.com","hollywoodmask.com","insidermonkey.com","ithacajournal.com","janvissersweer.nl","japanxxxmovie.com","jobsbotswana.info","jornaljoca.com.br","justtrucks.com.au","katholisches.info","kursnacukrzyce.pl","labs.j-novel.club","langweiledich.net","letsdownloads.com","lewblivehdplay.ru","liveyourmaths.com","lubbockonline.com","lugarcerto.com.br","luoghidavedere.it","manianomikata.com","marinetraffic.com","mcocguideblog.com","mcskinhistory.com","media.framu.world","memoryhackers.org","molineuxmix.co.uk","mooc.chaoxing.com","mtbtutoriales.com","music.youtube.com","nbcsportsedge.com","neuroteam-metz.de","nfltraderumors.co","nordkorea-info.de","nostracasa.com.br","oceanof-games.com","palmbeachpost.com","patriotledger.com","phimlongtieng.net","press-citizen.com","pressconnects.com","progameguides.com","recambioscoche.es","registerguard.com","reportergazeta.pl","roztoczanskipn.pl","scarysymptoms.com","serwis-zamkow.com","sharktankblog.com","sizyreelingly.com","sklep-agroland.pl","starsunfolded.com","tchadcarriere.com","terramirabilis.ro","the-scorpions.com","theadvertiser.com","theaircurrent.com","theepochtimes.com","thegraillords.net","theregister.co.uk","times-gazette.com","timesreporter.com","timestelegram.com","toppremiumpro.com","torrentlawyer.com","urochsunloath.com","v-o-e-unblock.com","valeronevijao.com","venusarchives.com","verpornocomic.com","visaonoticias.com","watch.lonelil.com","winhelponline.com","wolfdyslectic.com","workhouses.org.uk","yaledailynews.com","alamogordonews.com","asianexpress.co.uk","autoteiledirekt.de","badgerandblade.com","baixedetudo.net.br","besteonderdelen.nl","bloomberglinea.com","bloombergquint.com","boerse-express.com","bronze-bravery.com","coffeeforums.co.uk","cours-de-droit.net","craftpip.github.io","delawareonline.com","doranobi-fansub.id","eduardo-monica.com","endorfinese.com.br","enterprisenews.com","esercizinglese.com","evasion-online.com","eveningtribune.com","fantasytagtree.com","ferroviando.com.br","figeterpiazine.com","financasdeouro.com","flashdumpfiles.com","flashplayer.org.ua","followmikewynn.com","foreignaffairs.com","freesmsgateway.com","gaypornmasters.com","giromarilia.com.br","gossipnextdoor.com","hayatbilgileri.com","heroesneverdie.com","immobiliaremia.com","iovivoatenerife.it","keighleynews.co.uk","kijyomatome-ch.com","krunkercentral.com","kuroko-analyze.com","lincolncourier.com","luyenthithukhoa.vn","mcdonoughvoice.com","mesquitaonline.com","minecraftforge.net","motortrader.com.my","myfreemp3juices.cc","nationalreview.com","newarkadvocate.com","onlinegiftools.com","onlinejpgtools.com","onlinepngtools.com","onscreensvideo.com","openanesthesia.org","placementstore.com","planetagibi.com.br","pokemonforever.com","portalportuario.cl","postcourier.com.pg","progress-index.com","psihologiadeazi.ro","record-courier.com","renditepassive.net","reporter-times.com","rezervesdalas24.lv","rottentomatoes.com","samsungtechwin.com","sdelatotoplenie.ru","seacoastonline.com","serieslyawesome.tv","sheboyganpress.com","skandynawiainfo.pl","sooeveningnews.com","sovetromantica.com","space-engineers.de","starnewsonline.com","steamcollector.com","stiridinromania.ro","strangermeetup.com","sturgisjournal.com","tauntongazette.com","techsupportall.com","theasianparent.com","thecalifornian.com","thegardnernews.com","theherald-news.com","theitaliantimes.it","thejakartapost.com","themosvagas.com.br","thetimesherald.com","thinkamericana.com","titanic-magazin.de","topperlearning.com","truyenbanquyen.com","tuscaloosanews.com","unlimitedfiles.xyz","upsrtconline.co.in","vercalendario.info","verdadeiroolhar.pt","viveretenerife.com","wirtualnyspac3r.pl","wpb.shueisha.co.jp","xda-developers.com","xxxonlinegames.com","yodelswartlike.com","aileen-novel.online","atlas-geografic.net","bluemoon-mcfc.co.uk","columbiatribune.com","courier-journal.com","courier-tribune.com","csiplearninghub.com","dailycommercial.com","darktranslation.com","demingheadlight.com","descargatepelis.com","dialectsarchive.com","dicasdefinancas.net","digitalfernsehen.de","digitalsynopsis.com","download.ipeenk.com","dreamlandresort.com","duneawakening.th.gl","empregoestagios.com","exclusifvoyages.com","festival-cannes.com","frameboxxindore.com","gazetadopovo.com.br","generationamiga.com","goodnews-magazin.de","handball-world.news","harvardmagazine.com","heraldmailmedia.com","hollandsentinel.com","home.novel-gate.com","independentmail.com","investorvillage.com","jacquieetmichel.net","journalstandard.com","kashmirobserver.net","kirannewsagency.com","legionprogramas.org","livingstondaily.com","lyricstranslate.com","marksandspencer.com","mexiconewsdaily.com","morosedog.gitlab.io","mostrodifirenze.com","musicallyvideos.com","mycentraljersey.com","mzk.starachowice.eu","nakedcapitalism.com","ncert-solutions.com","ncertsolutions.guru","norwichbulletin.com","onlinecoursebay.com","onlinetexttools.com","opportunitydesk.org","orangespotlight.com","perangkatguruku.com","raccontivietati.com","raindropteamfan.com","samurai.wordoco.com","seikatsu-hyakka.com","selfstudyanthro.com","shreveporttimes.com","siliconinvestor.com","smartkhabrinews.com","southcoasttoday.com","starresonance.th.gl","thedailyjournal.com","thedraftnetwork.com","thenorthwestern.com","theonegenerator.com","therecordherald.com","timesrecordnews.com","tipssehatcantik.com","tuttoautoricambi.it","viatasisanatate.com","wallpaperaccess.com","worldscientific.com","aboutchromebooks.com","alphagirlreviews.com","animenewsnetwork.com","astro-cric.pages.dev","augustachronicle.com","autoalkatreszek24.hu","autodielyonline24.sk","badzjeszczelepszy.pl","cdn.gamemonetize.com","cissamagazine.com.br","clubulbebelusilor.ro","commercialappeal.com","compartiendofull.net","corriereadriatico.it","coshoctontribune.com","cristelageorgescu.ro","criticalthinking.org","elektro-plast.com.pl","freereadnovel.online","greenvilleonline.com","hedgeaccordingly.com","ifdreamscametrue.com","impotsurlerevenu.org","karamellstore.com.br","koalasplayground.com","lazytranslations.com","lesmoutonsenrages.fr","lyrical-nonsense.com","magesyrevolution.com","mainframegurukul.com","marriedbiography.com","metagnathtuggers.com","milforddailynews.com","odiarioonline.com.br","onlinecarparts.co.uk","onlinefreecourse.net","photoshop-online.biz","platform.twitter.com","psychologiazycia.com","punto-informatico.it","reservedeler24.co.no","revistavanityfair.es","selfstudyhistory.com","shushan.zhangyue.net","southbendtribune.com","statesmanjournal.com","stockpokeronline.com","technologyreview.com","tempatwisataseru.com","the-daily-record.com","theartofnakedwoman.*","thedailyreporter.com","thegatewaypundit.com","theleafchronicle.com","themeparktourist.com","thepublicopinion.com","ultimate-bravery.net","viafarmaciaonline.it","vinaurl.blogspot.com","windows101tricks.com","aprendeinglessila.com","autoczescionline24.pl","bibliacatolica.com.br","blasianluvforever.com","blogvisaodemercado.pt","bloomberglinea.com.br","cantondailyledger.com","columbiaspectator.com","courierpostonline.com","delicateseliterare.ro","desmoinesregister.com","devilslakejournal.com","diariodoiguacu.com.br","digital.lasegunda.com","download.mokeedev.com","downloadtutorials.net","ellwoodcityledger.com","filmpornoitaliano.org","gamoneinterrupted.com","glamourmagazine.co.uk","globaldefensecorp.com","goldenstateofmind.com","granfondo-cycling.com","greatfallstribune.com","guidingliterature.com","hearthstone-decks.net","hebrew4christians.com","ilclubdellericette.it","ilovefreesoftware.com","ipphone-warehouse.com","japancamerahunter.com","juancarlosmolinos.net","links.extralinks.casa","northwestfirearms.com","onlinestringtools.com","pcso-lottoresults.com","practicetestgeeks.com","premiumembeding.cloud","programming-link.info","promotor-poz.kylos.pl","providencejournal.com","searchenginewatch.com","smokingmeatforums.com","streamservicehd.click","the-masters-voice.com","thenews-messenger.com","tinyhouse-baluchon.fr","uptimeside.webnode.gr","visaliatimesdelta.com","wausaudailyherald.com","cathouseonthekings.com","chillicothegazette.com","cyberkrafttraining.com","dicasfinanceirasbr.com","digitalcameraworld.com","elizabeth-mitchell.org","generatesnitrosate.com","hiraethtranslation.com","hitokageproduction.com","japan-academy-prize.jp","kulinarnastronamocy.pl","labreakfastburrito.com","mainframestechhelp.com","metrowestdailynews.com","monorhinouscassaba.com","mt-milcom.blogspot.com","musicindustryhowto.com","nationalgeographic.com","news-journalonline.com","notificationsounds.com","operatorsekolahdbn.com","palmbeachdailynews.com","planetagibiblog.com.br","pontiacdailyleader.com","qualityfilehosting.com","techieway.blogspot.com","telyn610zoanthropy.com","thehouseofportable.com","tutoganga.blogspot.com","unbiasedsenseevent.com","underconsideration.com","wiibackupmanager.co.uk","zeeebatch.blogspot.com","battlecreekenquirer.com","burlingtonfreepress.com","columbiadailyherald.com","examiner-enterprise.com","farm-ro.desigusxpro.com","feel-the-darkness.rocks","greenocktelegraph.co.uk","guidon40hyporadius9.com","hattiesburgamerican.com","juegosdetiempolibre.org","lansingstatejournal.com","mercenaryenrollment.com","oferty.dsautomobiles.pl","onlineonderdelenshop.nl","poughkeepsiejournal.com","przegladpiaseczynski.pl","publicopiniononline.com","rationalityaloelike.com","recantodasletras.com.br","republicadecuritiba.net","ryuryuko.blog90.fc2.com","searchenginejournal.com","sqlserveregitimleri.com","stevenspointjournal.com","theghostinmymachine.com","usmleexperiences.review","ate60vs7zcjhsjo5qgv8.com","bendigoadvertiser.com.au","cloudcomputingtopics.net","colegiosconcertados.info","democratandchronicle.com","gamershit.altervista.org","greenbaypressgazette.com","hentaialtadefinizione.it","indianhealthyrecipes.com","mansfieldnewsjournal.com","marshfieldnewsherald.com","montgomeryadvertiser.com","my-code4you.blogspot.com","phenomenalityuniform.com","photobank.mainichi.co.jp","programasvirtualespc.net","stowarzyszenie-impuls.eu","timeshighereducation.com","tricountyindependent.com","warringtonguardian.co.uk","webnoveltranslations.com","antallaktikaexartimata.gr","audaciousdefaulthouse.com","bucyrustelegraphforum.com","burlingtoncountytimes.com","ciberduvidas.iscte-iul.pt","creative-chemistry.org.uk","cyamidpulverulence530.com","dicionariocriativo.com.br","greaseball6eventual20.com","kathleenmemberhistory.com","lancastereaglegazette.com","matriculant401merited.com","portalcriatividade.com.br","portclintonnewsherald.com","realfinanceblogcenter.com","telenovelas-turcas.com.es","worldpopulationreview.com","yusepjaelani.blogspot.com","30sensualizeexpression.com","boonlessbestselling244.com","businessemailetiquette.com","globalairportconcierge.com","interestingengineering.com","northumberland-walks.co.uk","secondlifetranslations.com","singingdalong.blogspot.com","wisconsinrapidstribune.com","69translations.blogspot.com","buckscountycouriertimes.com","colors.sonicthehedgehog.com","garyfeinbergphotography.com","streaminglearningcenter.com","wasserstoff-leitprojekte.de","zanesvilletimesrecorder.com","courseware.cemc.uwaterloo.ca","economictimes.indiatimes.com","mimaletamusical.blogspot.com","springfieldspringfield.co.uk","tnt2-cricstreaming.pages.dev","toxitabellaeatrebates306.com","wlo-cricstreamiing.pages.dev","www-daftarharga.blogspot.com","arti-definisi-pengertian.info","divineyogaschool.blogspot.com","fittingcentermondaysunday.com","launchreliantcleaverriver.com","nahrungsmittel-intoleranz.com","utorrentgamesps2.blogspot.com","zeustranslations.blogspot.com","20demidistance9elongations.com","projektowanie-wnetrz-online.pl","audioreview.m1001.coreserver.jp","freerapidleechlist.blogspot.com","observatoriodocinema.uol.com.br","poplinks.idolmaster-official.jp","insurance-corporate.blogspot.com","mimaletadepeliculas.blogspot.com","certificationexamanswers.890m.com","telecom.economictimes.indiatimes.com","librospreuniversitariospdf.blogspot.com"];

const $scriptletFromRegexes$ = /* 0 */ [];

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
