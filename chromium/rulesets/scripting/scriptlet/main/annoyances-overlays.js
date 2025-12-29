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

const $scriptletArgs$ = /* 660 */ ["scroll","$","modal_newsletter","/^(mouseout|mouseleave)$/","pum_popups","show-login-layer-article","document.oncontextmenu","document.onselectstart","oncontextmenu","/^(contextmenu|copy)$/","getSelection","disableSelection","nocontext","contextmenu","disableselect","reEnable","clickIE4","ConsoleBan.init","noopFunc","document.onkeydown","devtoolsDetector","{}","document.addEventListener","||!!","/contextmenu|copy|cut|key/","","elements","document","keydown","123","[arguments];","console.clear","trueFunc","console.table","console.log","key","/copy|selectstart/","return","/preventDefault|pointerType/","onkeydown|onselectstart|oncontextmenu","body[onkeydown*=\"__cfRLUnblockHandlers\"]","complete","uxGuid","killads","true","www3.doubleclick.net","PASSER_videoPAS_apres","0","ads_enabled","adsbygoogle","AdBlocker","load","adblock","pro-modal","doubleclick","googlesyndication","length:10",".getState();","4500","Storage.prototype.setItem","json:\"DWEB\"","condition","DWEB_PIN_IMAGE_CLICK_COUNT","json:\"\"","unauthDownloadCount","blur","ThriveGlobal","blazemedia_adBlock","copy","addLink","_sp_","check","100","document.getElementById","advert-tester","nebula.session.flags.adblock","undefined","document.oncopy","_adBlockCheck","navigator.storage.estimate","abde","ads","2000","/^(?:contextmenu|copy|selectstart)$/","/^(?:contextmenu|copy)$/","preventDefault","/^(?:contextmenu|keydown)$/","onbeforeunload","valid_user","Drupal.behaviors.detectAdblockers","scan","500","oncopy","jQuery","AdBlock","#sign-up-popup","/,\"category_sensitive\"[^\\n]+?\"follow_button\":\\{\"__typename\":\"CometFeedStoryFollowButtonStrategy\"[^\\n]+\"cursor\":\"[^\"]+\"\\}/g","}","/api/graphql","require.0.3.0.__bbox.define.[].2.is_linkshim_supported require.0.3.0.__bbox.define.[].2.click_ids","overlay","adBlockDetected","ADBdetected","onload_popup","8000","_sp_._networkListenerData","onselectstart","stay","ad-blocker",".ab_detected","document.ondragstart","disableEnterKey","adMessage","tweaker","adBlockEnabled","$adframe","false","BIA.ADBLOCKER","Adblocker","10000","()","samDetected","4000","ABDSettings","adBlockFunction","block","hidekeep","checkAds","google_jobrunner","#advert-tracker","3000","disable_copy","disable_hot_keys","alert","oncontextmenu|oncopy|ondragstart|onselect|onselectstart","body","isAdblockDisabled","1000","clickIE","checkPrivacyWall","loadOutbrain","intsFequencyCap","w3ad","oncontextmenu|ondragstart|onselectstart","killCopy","oncontextmenu|ondragstart|onselectstart|onkeydown","restriction","adsAreShown","1500","bioEp.showPopup","/^(?:contextmenu|copy|keydown)$/","Date.prototype.toUTCString","document.onmousedown","abd","innerHTML","intializemarquee","oncontextmenu|onselectstart","oSpPOptions","oncontextmenu|onselectstart|ondragstart","detector_active","aoezone_adchecker","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart","message","preventSelection","fuckAdBlock","pageService.initDownloadProtection","mouseout","pop","oncontextmenu|onselectstart|onselect|oncopy","Drupal","a1lck","adsBlocked","/^(?:keyup|keydown)$/","detectPrivateMode","webkitRequestFileSystem","null","addLinkToCopy","_sharedData.is_whitelisted_crawl_bot","showOverlay","NoAd","killcopy","loginModal","stopPrntScr","700","document.documentElement.oncopy","oncontextmenu|onkeydown|onmousedown","ads_not_blocked","disable_in_input","disable_keystrokes","can_i_run_ads","__cmpGdprAppliesGlobally","/contextmenu|keydown|keyup|copy/","stopSelect","warning","ytInitialPlayerResponse.auxiliaryUi.messageRenderers.upsellDialogRenderer","auxiliaryUi.messageRenderers.upsellDialogRenderer","visibilitychange","/bgmobile|\\{\\w\\.\\w+\\(\\)\\}/","hideBannerBlockedMessage","__ext_loaded","slideout","faq/whitelist","_sp_.mms.startMsg","blurred","height","document.getElementsByTagName","RL.licenseman.init","abStyle","modal","eval","offsetHeight","ga_ExitPopup3339","t.preventDefault","ai_adb","none","replaceCopiedText","oncontextmenu|onselectstart|ondragstart|oncopy|oncut|onpaste|onbeforecopy","ABD","ondragstart","better_ads_adblock","onselectstart|ondragstart","console.debug","addEventListener","which","window.addEventListener","ctrlKey","/^(contextmenu|copy|dragstart|selectstart)$/","alerte_declanchee","initimg","oncontextmenu|onCopy","adBlock","oncontextmenu|onmousedown|onselectstart","appendMessage","document.body.setAttribute","5000","vSiteRefresher","popup","banner","/contextmenu|selectstart|copy/","oncontextmenu|ondragstart|onselectstart|onkeydown|onmousedown","oncontextmenu|onkeydown","onkeydown","adtoniq","ondragstart|onselectstart","/contextmenu|copy|keydown/","/contextmenu|select|copy/","/^(contextmenu|keydown)$/","a","adblocker","exit_popup","adsEnabled","locdau","show","ondrop|ondragstart","onload","onselectstart|ondragstart|oncontextmenu","div.story_text","document.body.oncopy","test.remove","oncontextmenu|ondragstart","mouseleave","noscroll","onmousemove|ondragstart|onselectstart|oncontextmenu","/contextmenu|selectstart/","ai_check","bait","onselectstart|ondragstart|onmousedown|onkeydown|oncontextmenu","window.SteadyWidgetSettings.adblockActive","adblockerdetected","juicyads","gdpr_popin_path","showEmailNewsletterModal","generatePopup","dragstart|keydown/","/contextmenu|keydown|dragstart/","oncontextmenu|onselectstart|ondragstart|onclick","btoa","_0x","f12lock","debugger","checkFeed","visibility","style","div#novelBoby","HTMLIFrameElement","FuckAdBlock","samOverlay","adStillHere","tjQuery","oncontextmenu|onMouseDown|style","/^(?:contextmenu|copy|keydown|mousedown)$/","document.onkeyup","commonUtil.openToast","adb","/contextmenu|keydown/","NS_TVER_EQ.checkEndEQ","nd_shtml","canRunAds","Adblock","isNaN","mps._queue.abdetect","contribute","devtoolschange","/contextmenu|copy/","ondragstart|oncontextmenu","clickNS","mdp","setTimeout","newsletterPopup","onContextMenu","premium","onkeydown|oncontextmenu","oncontextmenu|oncopy","abp","/contextmenu|cut|copy|paste/","oncontextmenu|onselectstart|style","#body_game","blocked","blocker","SignUPPopup_load","oncontextmenu|onselectstart|onselect|ondragstart|ondrag","removeChild","_0xfff1","event","stopPropagation","/contextmenu|mousedown/",".modal","soclInit","Zord.analytics.registerBeforeLeaveEvent","myModal","an_message",".height","oncontextmenu|onselectstart|onmousedown","admrlWpJsonP","oncopy|oncontextmenu|onselectstart|onselect|ondragstart|ondrag|onbeforeprint|onafterprint","document.onclick","document.onkeypress","disable_ext_code","/contextmenu|copy|selectstart/","adsbygoogle.length","oncontextmenu|onDragStart|onSelectStart","x5engine.utils.imCodeProtection","pipaId","oncontextmenu|ondragstart|onselectstart|onkeydown|oncopy|oncut","0x","matchMedia","shortcut","append_link","/^(?:contextmenu|dragstart|selectstart)$/","ai_front","ansFrontendGlobals.settings.signupWallType","journeyCompilerGateway","pgblck","/dragstart|keyup|keydown/","/keyup|keydown/","wpcc","oncopy|oncontextmenu","document.documentElement.AdBlockDetection","oncontextmenu|ondragstart|oncopy|oncut",".select-none","carbonLoaded","/contextmenu|cut|copy|keydown/","initAdBlockerPanel","/contextmenu|selectstart|copy|dragstart/","cpp_loc","String.prototype.charCodeAt","ai_","forceRefresh","head","/copy|dragstart/","/copy|contextmenu/","/getScript|error:/","error","dragstart","nocontextmenu","AdB","oncontextmenu|ondragstart|onselectstart|onselect|oncopy|onbeforecopy|onkeydown|onunload","selectionchange","quill.emitter","oncontextmenu|onDragStart|onselectstart","/contextmenu|selectstart|select|copy|dragstart/","adLazy","_0x1a4c","jQuery!==\"undefined\"","clearInterval(loginReady)","document.body.onmouseup","addCopyright","selectstart","&adslot","copy_div_id","oncontextmenu|onkeydown|onselectstart","LBF.define","oncopy|oncontextmenu|oncut|onpaste","input","oncontextmenu|oncopy|onselectstart","onbeforecopy|oncontextmenu|oncopy|ondragstart|onmouseup|onselect|onselectstart","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|style","SD_BLOCKTHROUGH","body[style=\"user-select: none;\"]","cookie","/^(?:copy|paste)$/","b2a","/copy|keydown/","ab","oncopy|oncut|onselectstart|style|unselectable","document.body.oncut","/copy|cut|selectstart/","oncontextmenu|onselectstart|oncut|oncopy","oncontextmenu|ondragstart|onselect","encodeURIComponent","inlineScript","debugchange","donation-modal","isMoz","onpaste","#tr_mesaj > td > .text-input.validate\\[required\\]","Delay","/keydown|keyup/","keyCode","disabledEvent","/copy|cut|paste|selectstart/","/contextmenu|dragstart|keydown/","event.dispatch.apply","document.querySelector","beforepaste","gif","DOMContentLoaded","rprw","\"input\"","contentprotector","mb.advertisingShouldBeEnabled","update_visit_count","replace","test","Promise","onscroll","5500","login","showAdblockerModal","dfgh-adsbygoogle","oncontextmenu|ondragstart|ondrop|onselectstart","[oncontextmenu]","jsData.hasVideoMeteringUnlogEnabled","lepopup_abd_enabled","広告","devtoolIsOpening","document.referer","pagelink","Object.prototype.preroll","[]","/keydown|mousedown/","Drupal.CTools.Modal.show","/(^(?!.*(injectedScript|makeProxy).*))/","#VdoPlayerDiv","a#download_link","Object.prototype.bgOverlay","Object.prototype.fixedContentPos","html","console.dir","navigator.userAgent","quoty-public","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|onselect|oncopy|onbeforecopy|onmouseup","onContextmenu|onMouseDown|onSelectStart","kan_vars.adblock","securityTool.disableRightClick","securityTool.disableF12","securityTool.disableCtrlP","securityTool.disableCtrlS","securityTool.disablePrintScreen","securityTool.disablePrintThisPage","securityTool.disableElementForPrintThisPage","wccp_pro_iscontenteditable",".all-lyrics","document.body.oncontextmenu","attachToDom","ad-fallback","document.createElement","createAdblockFallbackSubscribeToProtopageAdDiv","gnt_mol_oy","adsok","runPageBugger","Source","length","nouplaod","img[oncontextmenu=\"return false;\"]","Object","/(?=^(?!.*(jquery|inlineScript)))/","ab_tests","scribd_ad","admiral","/contextmenu|copy|drag|dragstart/","userAgent","analytics","mousedown",".entry-content","wccp_pro","clear_body_at_all_for_extentions","RegExp","googlebot","document.querySelectorAll","/contextmenu|keydown|keypress|copy/","blockFuckingEverything","build.js","openLayer","sneakerGoogleTag","devtools","/_0x|devtools/","flashvars.autoplay","popupScreen","checkAdblockBait","dispatch","onclick","[onclick=\"myFunction()\"]","navigator","setInterval","stateObject","devtool","return\"undefined\"","ready","3","document.body.onselectstart","debug","disabledKeys","Time_Start","i--","0.02","/hotjar|googletagmanager/","Clipboard","0.001","ad","detect","DD","Object.prototype._detectLoop","_detectLoop","AudiosL10n","forbiddenList","concertAds","whetherdo","devtoolsDetector.addListener","String.fromCharCode","Premium","SteadyWidgetSettings.adblockActive","devtoolsOpen","phimv","||null","DisDevTool","preventDeleteDialog","/googlesyndication|googletag/","googletag","[native code]","openOverlaySignup","count","/contextmenu|keyup|keydown/","initials.layout.layoutPromoProps.promoMessagesWrapperProps.shouldDisplayAdblockMessage","mtGlobal.disabledAds","devtoolsDetector.launch","/DevTools|_0x/","throwFunc","ANN.ads.adblocked","cloudflareinsights.com","pleaseSupportUs","nn_mpu1","maxUnauthenicatedArticleViews","googletag.cmd","rocket-DOMContentLoaded","bind(document)","innerHeight","[oncontextmenu=\"return false;\"]","/^(contextmenu|mousedown|keydown)$/","placeAdsHandler","hmwp_is_devtool","mensagem","ramp.addUnits","pqdxwidthqt","browser-plugin","nitroAds.loaded","checkDevTools","DevToolsOpen","ABB_config","jh_disabled_options_data","/select|copy|contextmenu/","topMessage","/cut|copy|paste|contextmenu/","forbidDebug","2","RegExp.prototype.toString",".join(\"\")","DisableDevtool","Function.prototype.constructor","\"debugger\"","abort","/isEnable|isOpen/","oncontextmenu|ondragstart|onselectstart|onload|onblur","nitroAds","afterKeydown","void","getComputedStyle","viewClickAttributeId","ad-wrap","oncopy|oncut","__NEXT_DATA__.props.pageProps.adPlacements","/contextmenu|selectstart|dragstart/","loadexternal","login_completed","disableclick","disableRightClick","layerid","1","/,\"expanded_url\":\"([^\"]+)\",\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"url\":\"$1\"","/graphql","/,\"expanded_url\":\"([^\"]+)\",\"indices\":([^\"]+)\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"indices\":$2\"url\":\"$1\"","/tweet-result","#__next","style.display","clipboardData","console","/Timeout\":\\d+/","Timeout\":0","/api/v","html[onselectstart]","linkPrefixMessage","adb-enabled","/mainseto.js:286:1","Array.prototype.includes","visitor-gate",".LoginSection","document.getSelection","detect_modal","ays_tooltip","disableCTRL","/adsbygoogle|ad-manager/","/devtool|console\\.clear/","Object.prototype.disableMenu","confirm","counter","oncontextmenu|oncopy|oncut","[id^=\"chapter\"]",".html","RegExp.prototype.test","\"contact@foxteller.com\"","onselectstart|oncopy","json:\"freeVideoFriendly\"","freeVideoFriendlySlug","/^function\\(.*\\|\\|.*}$/","(!0)","HTMLImageElement.prototype.onerror","player.pause","/stackDepth:(9|10).+https:[./0-9a-z]+\\/video\\.[0-9a-f]+\\.js:1\\d{2}:1.+\\.emit/","PieScriptConfig","method:HEAD","location.href","function(t)","ad_blocker_detector_modal","clientHeight","String.prototype.trim","iframe","nonframe","Object.prototype.dbskrat"];

const $scriptletArglists$ = /* 793 */ "0,0;1,1,2;0,3;2,4;3,5;2,6;1,7;4,6;5,8;2,8;2,7;0,9;2,10;2,11;4,12;1,1,13;1,14,15;4,16;4,11;6,17,18;2,19;1,19;6,20,21;1,22,13;3,23;0,24,25,26,27;0,28,29;0,28,30;6,31,32;6,33,32;6,34,32;0,28,35;0,36,37;0,13,38;5,39,40,41;2,42;6,43,44;7,45;6,46,47;6,48,44;3,49;3,50;0,51,52;3,53;7,54;8,55,56;3,55;3,57,58;9,59,47,60,61,62;9,59,47,63,61,64;1,6;0,65;3,66;2,67;0,68;4,69;0,13;4,70;4,7;3,71,72;1,73,74;6,75,76;1,77;2,69;6,78,44;6,79,76;2,80;3,81,82;0,83;0,84,85;0,86;2,87;6,88,44;6,89,18;3,90,91;5,92;1,93,94;1,93,95;10,96,97,98;11,99;1,93,100;6,11,18;4,101;6,102,18;3,103,104;2,105;5,106,25,107;1,73,108;1,73,109;4,110;4,111;4,112;1,93,113;4,114;4,115;6,52,116;6,117,116;3,118,119;1,93,76;3,120,82;6,121,44;3,120,122;1,93,81;2,123;6,124,32;1,73,125;4,126;6,127,32;4,123;6,128,44;3,129,91;3,120,130;4,131;4,132;1,22,133;5,134,135,41;6,136,44;3,120,137;4,138;6,139,18;4,140;2,141;3,142;5,143;1,110,6;6,12,18;4,144;5,145;1,93,27;1,73,76;1,93,146;6,147,44;3,120,148;3,149;0,150;2,151;2,152;5,106;6,153,116;3,154;4,155;5,156;2,157;1,6,7;5,158;6,159,44;6,160,44;5,161;1,162,138;1,163;2,164;6,165,18;1,93,13;0,166,167;5,168;1,93,169;4,77;2,170;3,171;4,19;0,172;2,110;6,173,18;6,174,76;6,49,175;1,1,65;4,176;6,177,44;3,178;3,179,104;1,15,180;3,181,91;4,182;3,120,183;2,184;5,185;0,28;6,186,44;0,28,187;4,188;1,1,51;0,28,85;2,189;2,190;0,191;4,192;3,193;6,194,76;11,195;0,196,197;6,198,44;3,199;2,14;3,200;3,201;2,202;6,203,116;12,204;1,205,175;2,206;4,15;0,68,10;2,207;3,208;1,209,153;3,210;2,211;0,25,212;1,93,213;3,52;1,73,214;0,68,215;5,216;4,217;1,1,76;4,218;6,219,47;2,133;5,220;5,8,135,41;1,22;1,6,35;6,221,32;1,222,223;1,224,225;0,226;3,135;2,227;4,228;5,229;6,230,116;5,231;3,175;2,217;0,25,81;3,232;2,233;3,120,234;2,101;3,235;3,236;1,73,237;0,238;5,239;5,240;5,241;2,242;5,243;0,244;7,55;8,55;0,245;0,246;6,6,76;1,93,132;2,131;0,13,247;3,248;3,249,119;6,250,44;2,251;3,252;5,253;1,254;5,255,256,41;2,257;3,258;5,259;0,260;1,1,210;3,261,130;3,49,234;5,262,135;0,263;1,11;3,128;1,93,264;5,8,135;1,73,52;1,254,13;3,265;1,110;1,1,68;5,266,135;6,219,175;6,6,175;6,267,116;1,73,268;1,1,269;4,270;1,1,271;4,272;13,8;0,273;0,274;5,275;1,1,276;0,25,277;6,278,116;12,279;3,280,137;12,281,137;0,13,85;2,254;5,282,283,107;0,68,85;6,7,175;2,284;6,31,76;0,25,242;4,285;6,101,116;3,286;3,287;2,288;5,289;0,290;2,132;6,291,175;6,110,175;6,292,175;3,293;0,294;6,295,32;1,11,15;2,296;2,297;1,1,298;1,209,299;6,300,175;1,22,301;0,302;0,303;5,304;2,305;3,210,72;0,25,306;1,222,225;1,307,308;5,309,135;6,164,32;3,101;3,310;5,311,135;5,312;6,313,116;0,314;5,315,316;3,317,137;3,318;4,14;3,319,234;6,19,18;5,320,135;1,152;12,321;5,143,135;2,322;1,323,324;6,10,76;0,325;3,326,137;1,327;3,328,130;3,329,130;1,22,85;3,330,91;4,254;1,1,331;6,19,175;5,332,135;2,333;2,77;3,277;6,31,18;6,6,18;0,166;5,334,135;12,208;2,335;2,336;2,111;1,131;1,132;4,337;1,93,68;5,156,135;0,338;1,222,339;5,340;1,71,279;12,277;6,341,175;3,342,47;1,22,7;5,343;0,25,344;1,345;2,346;1,1,94;2,347;1,1,230;0,348;4,349;6,350,76;4,351;3,352;4,336;0,84;1,93,28;0,353;0,354,355;6,254,175;5,356,135;6,357,18;4,333;5,358,359,107;2,360;0,361;6,110,18;6,152,18;6,7,18;2,362;1,93,8;0,25,76;0,363;2,364;1,365,366;1,93,85;3,367;3,167;3,81;3,368;4,152;6,14,32;0,369;0,370;1,1,371;6,6,25;6,7,25;6,19,25;6,152,25;6,335,25;1,222,28;0,372;0,373;2,374;0,25,375;5,376;0,377,378;5,379;0,380;0,51,381;1,374;2,382;0,68,383;12,384;4,257;6,385,175;2,386;0,387;3,388;2,389;5,390,135;2,391;5,392,393;5,394;5,395;5,396,135;6,77,175;6,397,44;12,210;5,282,398,107;6,19,32;3,279;1,73,399;0,400,76;12,49;3,366;2,401;0,402;6,403,116;6,297,44;5,404,135,107;6,405,175;6,257,175;0,406;4,71;5,407;5,408;14,409,410;2,411;6,34,18;3,412;1,73,413;6,336,175;5,414,415;5,390;3,416;0,417,418;1,31;0,28,419;0,420;1,8,28;2,20;0,421,422;1,6,374;1,7,14;13,131;2,12;1,423,52;0,424;0,25,418;8,425;0,426,427;1,1,428;1,93,324;0,25,35;2,429;6,430,116;0,25,225;1,431;1,209,432;1,1,433;3,1;1,1,434;3,435,436;3,437,234;1,438;1,182;12,439;6,110,32;6,7,32;5,440,441,41;6,442,76;6,443,25;3,444;1,346;3,445,72;1,34,446;0,68,447;6,448,449;14,365,366;0,450;6,6,32;1,22,241;14,451,452;1,31,13;5,8,453;6,20,76;5,8,454,107;6,455,18;6,456,18;5,8,457;6,458,18;6,459,25;6,445,18;1,111;1,336;14,10,460;3,313;5,461;5,462;2,463;6,464,18;6,465,18;6,466,18;6,467,18;6,468,18;6,469,18;6,470,18;1,471;5,231,472;6,127,18;6,182,18;1,473;5,143,135,41;1,474,475;14,476,477;3,478;3,479;1,12;1,480;0,68,481;3,482,130;6,11,76;14,73,483;5,8,484,107;1,209,13;14,6;14,485,486;1,487;0,260,488;14,476,489;0,490;1,93,491;7,492;0,493,25,26,494;1,15;1,93,495;1,496;6,12,76;6,132,76;1,497,498;1,499,52;0,500;0,25,501;14,209,502;1,22,68;0,166,503;2,504;0,294,85;3,505;12,506;6,507,25;5,106,135;3,508;1,509;0,493,510;5,511,512;1,22,28;1,497,279;1,8;1,513,505;1,514,515;1,307,279;1,93,418;2,471;13,50;1,93,516;0,325,517;0,426,518;6,257,175,519;6,520,175,519;6,473,175,519;12,521;0,28,522;6,523,47;15,524,25,525;1,497,13;8,526;15,527,137,528;3,529;7,81;12,530;6,531,32;6,6,175,519;0,426,51;0,13,277;0,28,418;6,532,18;3,533;1,534;6,535,449;3,536;6,336,32;3,537;2,538;6,6,44;13,133;13,539;6,532,76;12,31;3,540;6,541,116;6,542,116;14,459,543;3,544;14,31;6,545,76;14,22,546;7,547;16;0,13,76;2,548;1,476,489;1,205,489;6,489,18;0,13,549;2,550;17,551;0,552;6,77,18;0,166,399;6,553,116;6,554,44;6,555,18;12,556;6,31,557;6,558,116;7,559;3,560;3,561,234;6,562,175;0,426,81;12,81;2,563;0,564,565;0,166,566;5,8,567;0,568,85;6,569,18;12,20;1,93,570;4,571;6,572,18;13,279;6,573,116;0,372,574;6,575,44;2,576;12,577;3,516;4,578;6,579,175;3,49,82;2,520;0,580;6,581,18;0,582;5,259,25,41;6,152,175;6,583,18;6,52,584;1,585,586;12,516;6,587,18;18,588,589,590;14,434,591;5,592;2,593;0,493,76,26,135;0,594;0,28,595;0,68,595;12,596;17,597;8,81;0,51,598;5,599;6,600,76;0,601;15,602,137;6,603,44;1,152,604;1,497,605;16,606,607;2,285;10,608,609,610;10,611,612,613;0,68,25,26,614;0,426,615;0,68,616;1,497,617;10,618,619,620;5,106,621;0,196,510;0,68,622;3,623;14,1,624;9,625,47,76,61,626;3,627;14,628,410;3,629;1,222,630;1,19,631;7,632;12,633;6,634,116;6,635,18;15,636,137,528;5,637,638,41;0,377,639;18,640,641,590;5,394,135,41;5,642,135,41;0,13,517;9,59,47,643,61,644;0,28,645;15;3,646,104;1,6,85;6,647,76;14,648,649;2,650;7,49;7,651;1,133,652;0,493,653;3,654;3,655;19,656,657,658;6,659,44";

const $scriptletArglistRefs$ = /* 2065 */ "748;203;667,668,669;6,50;596;56;481;15;285,374,473,474;59;308;7;56;686;173;56;769;195;50;256;256;56,499;5,10,454;406;376;579;89,381;736;27,28,29,30;204;488;693;9;196;756;5;7;579;308;674;277;609;414;119;324,509;675;256;322;193;231;85;617;7,54,58,89;579;302,606,607;579;662;256;753;158;56;639;5,10,454;579;376;334;22;327;24,688,778;705;705;56;7;54;7;56;8,50;54;5,20,722;26,725;63;56;667,668;561;54;56;56;702,727;372;376;665;235;611;347;250;336;238;344;8;324,509;279;648;613;24,688,778;613;612,613;579;273;392;252;256;56,325;364;712,725;26,28,686,724,725,726;56,137,375;698;150;24,688,778;40;2;182;50;15;172;5;156;353;24,688,778;667,668,669;740;0;788;82;331;534;658;285;348;286;157;56,308;54;54;15;307;158;15,54,679;50;3;135;46;50,161,324,668;205;579,675;54;609;7;686;15;459;332;7,176,255,317,318,319;305;237;202;5,10,136;579;56;336;260;15,56;8,56;668;688;50,549;8,477;741;777;56;50,281,446;579;666;460;256;680;404;169;11;684;613;791;272;323;40;324,509;133;56;648;489;56;277;336;548;50;234;669;245;5,137;41;41;746;405;54;7,62,382,383,384;302,303;256;256;684;50;5;54;474;50;332;54;5,457,458;50,302;56;303;360,456;391;21,302;369;338;56;83;504;24,688,778;788;377;36;712,725;611;0;675;50;611;579;621;504;26,28,29,30;56,407;50,113,281;21,56;769;158;308;8;71,280;50;727;2;324,509;271;5,6;196;75;712,725;7;444;577;51;780;652;302;536;54;684;691;159;551,552;579;50;56;54;667,668,669;8;28,222;56;8,420;8;15;579;310;50;324,509,597;56;5,68;399,747;579;676;8;56;54;699;286;54;5,299;709;502;261;0;684;471;288;12,50;142;579;90,285,369,472;123;195;324,509;56;696;99;487;97;56,407;50,598,599,600;450;584;579;43,44;56;96;332;264,265;158;356;324,509;579;579;99;390,391;2;89,90;15;332;579;7,192,343;302;579;537;13;663;279;54,55;21,22;8;141;579;7;22;302;56;684;684;684;451;10,58,433,434;780;279;279;171;82;50,324,373,374;40;21;56,372;63;482;18,179;686;56;146;56;553,554,555;788;50;164;56;792;56;50;26,28,29,30;662;172;671,672;5;675;175;324,509;156;752;245;673;50;730;324,509;696;217;7,136,137;675;50,274;56,308;56;123;727;728;7;7,17,123;577;755;21,50;54;50,598,599,600;668;302;667,669;107;579;7,13,352;50;7;285,411,412;8,15;322;686;595;56,464;26,302;26,302;132;261;579;106;50,172;81,125;7,89;50,598,599,600;2;141;50,598,599,600;15;15;769;579;388;50,598,599,600,601,602;56;50;7,159;50,314;56;50,423,424;750;469;50;576;7;324,509;302,508;321;50;763;287;374;54;688;688;54;286;538;729;54,56;89,90;711;416;529;558;273;8;64,65;54;144;358;205;50;683;50;696;159;75,282;56;299,651;48,49;5;594;56;120,158;56;277;7;789;159;151;579;628;504;504;292;15;18,50,159,160,161;390,391;579;13;674;21,56;21,56;115;775;344;50,436;686;56;579;56;176;506;55;54;322,686;50,89,90;7;515;26,302;360;8;474;562;186;714;256;256;256;748;328;50;50,357;242;579;712,725;302;54;374,644,645;308;308;249;5,10;8,435;13,21,50,176;330;92;324,509;177;780;133;684;684;684;684;684;684;684;684;684;684;684;739;686;40;301;758;466;311,312;54;686;671,672;324,509;54;437;579;579;690;129;194;5,18,20,181;165;727;297,298,299;172,184;54,449,783;198;356;322;5,457;579;324,509;56,374;21,56;211;50;579;50,281,446;56,308;5,10,372;743;55;101;209;735;324,509;123;657;366;291;693;483,484,485,486;13,14;56,686;61;50;13,50;7;50,386;6,50;7;50,90,112,113;324,509;642;579;675;95;256;15;324,509;579;89,381;631,632,633,634;579;324,509;757;579;50,598,599,600,601,602;413;324,509;17,18;236;21,50,223;41,677;560;8;517;205;191;754;708;674;686;361;8;8;286;713;158;368;693;50;391;50;579;279;54;531,532,533;54;143;547;307;8;277,558;785;572;50;6;579;138;47;8;7,8;50,54;374;506;324,509;205;299;56;658;174;686;391;39;339;6,50;89,255;509,557;54;158;137;437,674;651;369,409,494,495;35;111;390,391;56;26,767,768;56;428;217;579;251,395,396;415;693;158;616;21,50;54;5,255,409;8;256;72;21,56;250;277,369;579;684;667,668,669;667,668;324,509;302,501;7,89;332,374,635;131;697;56;36;684;684;684;684;684;684;684;684;684;684;684;684;684;684;684;518;473,532,544,655;8;6,50,90;284;694,695;776;8;194;686;766;6,56;209;50;13;579;277,545;774;305;20,152,192;692;544,731;56;5;296;190;579;208;98;579;54;63;56;324,509;684;765;56;579;21;50;547;277,545;60;54;54;277,558;152;703;50;76;230;34,463;302,352,771,772,773;8;278;579;56;324,509;154,155;375,420;50,152;579;144;730;324,509;579;5,13;693;579;342;50;324,509;167;324,509;629;324,509;579;172;195;497;54;50;712,725;217;8;86;345;779;187,188,189;693;50;249,250;74;286;8;277,545;519;160,277,302,374,491,492;257;706;687;269;308;415;640;656;579;579;579;13,50;447;579;712;579;50,224;54;760;290;788;324,509;54;341;0;578;686;8;744;8;688;56,464;579;263;50;8;675;56;478;630;54;54;403;308;104;8;44,782;579,674;680;56;285,721;8;577;727;100;579;579;550;693;336;461;14,18,112;85;6;781;277,545;238;762;427;5;21,56;684;21,22;123;712,725;105;668;391,686;15;723;302,501;302,501;133;639;8;542;7,255;302;680;684;684;684;684;684;7;50;376;498;52;8;209;21,56;324,509;50;324,509;720;54;321;302;269;249;5,13;719;324,509;277;50,90;242;10;56;5,10,161;50;285,306;579;144;7;56;579;674;50;249;579;579;579;7,58,424;123;5;475;13,50;467;269;351;89,90;56;332;474;664;54;54;579;324,509;452;0;23;158;684;238,239;674;21,281;680;593;21,56;579;579;707;5,21,372;20;38;579;54;261;285;301;141;579;354;324,509;308,661;21,50,152,172,302,620;6;18,90,506;277;324,509;256;387;579;302,649,650;324,509;579;21;680;427;129,674;5;648;56;579;5,10;66;56,686;56,58;455;324,509;579;22,686;684;195;219;448;13;579;6;372;62,267;686;579;54;277;544;579;579;54;8;54;80;50;50,90,281;63;50,608;5;788;579;18,56;504;432;85;686;564,565,566,567,568,569,570;514;742;139;158;5,13,136;56,176,725;324,509;16,50,144;693;579;302,615;302,660;579;6,50;591,592;354;700;375;376;478;175;579;579;579;391;579;579;336;268;50;788;21,56;681;56,277;285;26,28,29,30;187,188;56,686;6,281;50;5,10,20,152,161,380,626;302,501;8;349;401;145;50;28,29,30,31,32,33;152;684;684;684;583;15;8,15;289;39;56;7;274;281,445,446;680;453;324,509;579;244;465;50,81,574;50,549;54;637,638;97;110;479;118;556;183;400;7,58;417;56;579;579;579;5;313;429;409,558;50;89,381;524,525;579;50;324,509;579;225;579;255,281,324;324,509;56,686;56;5,6;579;7,81;579;195;82;219;614;56;56;5,10,20,380;54;476;268;241;759;764;333;308;268;50;21,50;5;479;674;324,509;106;195;322;85;389;50;302,303,575;324,509;324,509;688;653;256;158;54;668;56;579;201;579;285;641;680;675;474;54;374;503,504;788;180;790;20,408;324,509;324,509;50,81,179,540;376;668;5,13;5;18;56;50,598,599,600,601,602;7;579;678;579;50;99;197;610;470;579;579;5,178;579;50;579;185;670;675;675;788;249;316;336;56;579;579;579;738;579;324,509;158;56;56;688;308;56,499,500;302,501;302,501;286;505;675;187,188;152;187,188;302;50;579;529;168;102;285,304,305,306;541;126,127;50,152;8,21;141;579;273;18,128;50,383;89,90;220,221;579;116;662;324,509;56;7,81;208;286;462;579;195;579;10;6;745;372;56;701;516;346;693;255,317,509,627;7;277;324,509;93;13;21,56;50;579;50;54;706;56;50;579;7;50,90,571;522;369,418;54;579;99;56,176;13,50;50;63;6;659;563;390;579;589,590;69;308;283;5;324,509;278;675;91;50;294;286;674;262;315;248;716;50,245;588;675;302,501;122;56,512,513;579;6;86;579;54;50;392;286;579;579;152;5,10,13;139;579;496;208;686;94;579;152;579;788;17,18;50;56;7,21;7;56,336;275;8;137;324,509;693;324,509;56,172;582;249;737;56;510;2;717;719;305;7,13,181;54;324,509;18,112;7,16;269;144;50,598,599,600,601,602;579;54;579;579;2;141;37;715;56;275;302,501;751;702;324,509;302,636;324,509;302,501;324,509;579;770;577;78;84;324,509;577;219,391;54;78,79;8,50,113,394;324,509;302;300;50;693;207;50;705;210;8,21,170;579;50,535;5,137;62;506;132;322;579;7,13,58;192;5;579;243;8;579;7;530;50,598,599,600;50,274;579;6,10;56;50;674;50;286;70;307;704;144;148,149;776;523;579;526,527,528;50,381;238;177;688;335;579;103;89,381;430,502;233;579;172;15;7,130;324,509;73;430;23;56;286;50;8;324,509;579;153;6,7;18,50;685;16;643;159,324,509;603;28,29,30;214;511;50,200;187,188;415;324,509;215;285,410;144;10,13,20,253;579;579;504,622,623,624,625;579;579;371;788;579;285,306,319;56;50,571;50;255,317,509,627;302,501;402;18,50;13,50;8;479;579;50,324,509,598,599,600,601,602;393;105;246;579;579;579;425,426;375,419,420,421;302,501;302,501;302,501;208;208;295;555;674;302,501;50;214;579;50;788;82;7,480;788;54;12,166;117;99;129;324,509;580;579;50,254,255;50;275;579;82;5,6;579;586,587;50,598,599,600;302,501;56;324,509;5,13,20;20,50;270;1;5;123;324,509;324,509;158;324,509;5,13;195;386;21;277;579;50;579;336;226;326;619;675;579;641;641;641;308;761;324,509;7,58;109;63;5,172,215,324,509,605;579;255,409,509;579;281,303,438,439,440,441,442;579;788;329;324,509;50,62;579;286;579;336;579;340;129;579;604;50;259;579;579;134;507;579;579;232;212;682;263,369,443;579;471;286;322;50,112,113,598,599,600;579;539;114;583;6;56;56;302;675,693;205;302,501;50,383;5,89,90;355;579;579;579;324,509;579;172;579;543,544;13,14;56;56;5,13;50;217;47;89,381;5,6;56;540;54;7,255;286;286;674;579;579;324,509;579;521;5;579;87;18,50;50,58;579;359;56;162;573;50;50;579;82;213;324,509;324,509;579;336;641;255,281;251;468;13;50;453;50;255,281;579;129;8,56;579;47;579;675;579;643;579;579;324,509;788;324,509;618;105;674;324,509;689;769;579;788;788;10,136,206;277;362,363;56;579;301;268;579;13,20,50,372,520;493;8;50,598,599,600,601,602;579;213;13,50,56,385;227;258;324,509;89,90;208;54;42;144;332;302,501;579;285,369;788;336;275;-749,749;16,50;53;788;422;58,90,152,281,293;123;579;579;50;163;324,509;579;140;579;309;579;301;579;99;5;21,397,398;183,216;324,509;788;12;13,50;324,509;54;579;67;579;152;579;579;247;56;675;242,336;579;5,10,136;302,501;177;324,509;654;45;579;50,90,281;276;50,218;50;559;56,732,733,734;102;108;507;100;641;5;6,50;688;707;8;579;77;296;277;56,172,281,324;579;50;50;579;579;88;579;324,509;56;195;13,50,337;302,501;324,509;718;231;50,598,599,600;784;5;579;302,501;6,50;50,220,281;0,56;579;715;10,176;579;7,58;579;5,13;90,124;10;302,501;273;350;374;266;785;354;579;579;579;579;372;5,13,136;85;302,501;579;13,50;579;50;56;324,509;579;56;579;302,501;199;14;228,229;240;152;579;50;50;727;378;56,473;324,509;579;5;579;367;21,50,585;579;579;579;20;302,501;320;324,509;56;546;579;57;25;788;302,501;579;579;54;50;302,501;12;302,501;302,501;579;302,501;382,581;579;302,501;308,651;2;20;302,501;302,501;89,90;786;2;123;50,490,598,599,600,601,602;16,123;579;10,136,379;579;634,646,647;56;431;219;579;8;56,121;7;63;769;302,501;769;50,512;58,89,285;50;302,501;302,501;286;21,137;787;302,501;89,255;50,324;50;365;370;147;5,6;50;4;6,15,21,263,710;19,20";

const $scriptletHostnames$ = /* 2065 */ ["x.com","xe.gr","anix.*","clk.sh","ddys.*","dood.*","epn.bz","evz.ro","hqq.to","hqq.tv","kmo.to","mbs.jp","mio.to","netu.*","rp5.by","sgd.de","shz.al","t3.com","tfp.is","ttv.pl","tvn.pl","voe.sx","wjx.cn","xtv.cz","1mg.com","app.com","appd.at","bbc.com","bflix.*","bold.dk","c315.cn","cbr.com","cine.to","clk.ink","cnn.com","coag.pl","csid.ro","dnj.com","doods.*","edn.com","gats.io","gmx.com","gmx.net","humo.be","ibps.in","ijr.com","itvn.pl","jfdb.jp","lifo.gr","mdpr.jp","med1.de","mgsm.pl","onna.kr","pnj.com","pobre.*","rgj.com","sbot.cf","tvn7.pl","veev.to","vox.com","vsco.co","vtbe.to","wjx.top","ydr.com","10tv.com","2219.net","9tsu.vip","abola.pt","anigo.to","arras.io","arrax.io","asiatv.*","bcs16.ro","citas.in","cmg24.pl","cnki.net","daum.net","delfi.lt","dngz.net","embed.su","emol.com","espn.com","flixhq.*","gakki.me","glam.com","hemas.pl","j91.asia","jetv.xyz","jpnn.com","khou.com","kukaj.io","libgen.*","likey.me","mhwg.org","nsmb.com","pisr.org","poedb.tw","railf.jp","romet.pl","rukim.id","sbflix.*","senpa.io","sflix.ca","sflix.fi","sflix.is","sflix.to","sj-r.com","tadu.com","talpo.it","tepat.id","tvn24.pl","ufret.jp","utour.me","vembed.*","vidsrc.*","virpe.cc","wtsp.com","xnxx.com","yflix.to","yuuki.me","zaui.com","zdnet.de","zgbk.com","47news.jp","adpres.ro","ahzaa.net","aicesu.cn","anauk.net","anikai.to","aniwave.*","archon.gg","artsy.net","autodoc.*","b4usa.com","bmovies.*","brainly.*","brutal.io","cda-hd.cc","cpuid.com","critic.de","ctrl.blog","d0o0d.com","deepl.com","digi24.ro","dramaqu.*","earth.com","eater.com","edurev.in","felico.pl","filhub.gr","fin24.com","flagle.io","fmovies.*","fotor.com","freep.com","globo.com","gmx.co.uk","hdrez.com","hianime.*","ibomma.pw","imooc.com","invado.pl","jootc.com","juejin.cn","keybr.com","lesoir.be","lexlog.pl","lohud.com","lublin.eu","lunas.pro","m4uhd.net","mangaku.*","matzoo.pl","mcloud.to","megaup.cc","mm9841.cc","mocah.org","naver.com","nebula.tv","news24.jp","newsme.gr","ocala.com","ophim.vip","peekme.cc","player.pl","pling.com","quora.com","ruwix.com","s0urce.io","seexh.com","sflix2.to","shein.com","sopot.net","tbs.co.jp","tides.net","tiempo.hn","tomshw.it","turbo1.co","txori.com","uemeds.cn","uihtm.com","umk.co.jp","uplod.net","veblr.com","velicu.eu","venea.net","vidplay.*","vinaurl.*","virpe.com","watson.ch","watson.de","weibo.com","wired.com","women.com","world4.eu","wstream.*","x-link.pl","x-news.pl","xhbig.com","yeane.org","ytv.co.jp","yuque.com","zefoy.com","zgywyd.cn","zhihu.com","ziare.com","360doc.com","3xyaoi.com","4media.com","52bdys.com","699pic.com","actvid.com","adslink.pw","allsmo.com","analizy.pl","ananweb.jp","ancient.eu","animedao.*","animekai.*","auto-doc.*","bdb.com.pl","bejson.com","bembed.net","bestcam.tv","boards.net","boston.com","bpcj.or.jp","broflix.cc","caller.com","camcaps.to","chillx.top","cineby.app","citroen.pl","clujust.ro","crewus.net","crichype.*","curbed.com","d0000d.com","debeste.de","deezer.com","depedlps.*","dlions.pro","dlnews.com","drkrok.com","dxmaps.com","e-sushi.fr","earnload.*","ebc.com.br","embedv.net","esaral.com","fauxid.com","fflogs.com","filefox.cc","filiser.eu","film4e.com","fjordd.com","fnbrjp.com","foodie.com","fullxh.com","galinos.gr","gaz.com.br","ggwash.org","goerie.com","gomovies.*","gplinks.co","grunge.com","hdtoday.so","hienzo.com","hindipix.*","hitcena.pl","hoca4u.com","img999.com","javbix.com","jdnews.com","jeu2048.fr","jeyran.net","jnews5.com","kapiert.de","knshow.com","lcpdfr.com","ldnews.com","legacy.com","listatv.pl","lofter.com","looper.com","love4u.net","lwlies.com","mashed.com","masuit.com","maxroll.gg","mbalib.com","mdlinx.com","medium.com","megaxh.com","menrec.com","milfzr.com","mongri.net","motogon.ru","mpnnow.com","naaree.com","neobux.com","neowin.net","newspao.gr","njjzxl.net","nypost.com","opedge.com","oploverz.*","pc3mag.com","peugeot.pl","piklodz.pl","pixnet.net","pixwox.com","pjstar.com","pokeos.com","polyvsp.ru","protest.eu","qidian.com","quotev.com","racked.com","rdsong.com","riwyat.com","rrstar.com","salina.com","sbenny.com","sbface.com","scribd.com","sdewery.me","sexpox.com","skuola.net","tcpalm.com","texte.work","tiktok.com","tmnews.com","top1iq.com","totemat.pl","tumblr.com","tvzingvn.*","uol.com.br","ups2up.fun","utamap.com","utaten.com","vcstar.com","wader.toys","watchx.top","wormate.io","wpchen.net","xhamster.*","xhopen.com","xhspot.com","yamibo.com","youmath.it","zalukaj.io","zingtvhd.*","zingvntv.*","zulily.com","102bank.com","123movies.*","9xbuddy.com","abstream.to","accgroup.vn","adevarul.ro","affbank.com","amlesson.ru","aniwatch.to","antena3.com","aoezone.net","asia2tv.com","ask4movie.*","autodoc24.*","badayak.com","bdcraft.net","bg-gledai.*","bhaskar.com","bianity.net","bimiacg.net","bitcine.app","bluphim.com","boke112.com","bypass.city","canale.live","cattime.com","cepuluh.com","clockks.com","cmjornal.pt","cnblogs.com","coinurl.net","comikey.com","cookhero.gr","d4armory.io","day-hoc.org","decider.com","disheye.com","djelfa.info","dogtime.com","dramacute.*","ds2play.com","duracell.de","elahmad.com","embasic.pro","embtaku.pro","eoreuni.com","epitesti.ro","esologs.com","esscctv.com","europixhd.*","explore.com","ezmanga.net","f2movies.ru","faptiti.com","flixrave.to","fosshub.com","fosters.com","fruit01.xyz","funivie.org","gamegame.kr","geotips.net","goalup.live","goodhub.xyz","hianimez.to","hidemywp.co","hongxiu.com","hotleak.vip","hotleaks.tv","howjsay.com","htforum.net","htrnews.com","hukmatpro.*","hulnews.top","ideapod.com","ilife97.com","infokik.com","inverse.com","j-lyric.net","jafekri.com","javbest.xyz","javgrab.com","jio.pftv.ws","kinston.com","kitguru.net","koltry.life","kpopsea.com","ktm2day.com","l2gamers.cl","lalawin.com","lasexta.com","lataifas.ro","leetcode.cn","logonews.cn","lolle21.com","lover93.net","m4ufree.com","maduras.vip","magesy.blog","malekal.com","mangatoon.*","manhwa18.cc","masrawy.com","maxt.church","mediafax.ro","megaup.live","megaup.site","milenio.com","mobiflip.de","moviepl.xyz","mrbenne.com","nettv4u.com","newsbook.pl","ngelmat.net","novelism.jp","novelza.com","ntuplay.xyz","ntvspor.net","nulled.life","nytimes.com","odiario.com","ohli365.vip","ohmygirl.ml","olarila.com","ontools.net","oreilly.com","otakudesu.*","pagesix.com","pancreas.ro","pandurul.ro","pashplus.jp","phimfit.com","pinterest.*","pngitem.com","poipiku.com","poli-vsp.ru","polygon.com","postype.com","promotor.pl","putlocker.*","qrcode.best","racevpn.com","radioony.fm","redding.com","romviet.com","rubystm.com","rubyvid.com","runmods.com","safetxt.net","satcesc.com","sbbrisk.com","sctimes.com","shaamtv.com","sherdog.com","shinbhu.net","shinchu.net","skionline.*","smalley.com","spectank.jp","starbene.it","stbnetu.xyz","strcloud.in","swtimes.com","taxo-acc.pl","teachoo.com","techgyd.com","tekstowo.pl","thelist.com","thotsbay.tv","tinyppt.com","tistory.com","titulky.com","topfaps.com","trakteer.id","trentino.pl","tuborstb.co","tunegate.me","turbolab.it","tv.bdix.app","tvn24bis.pl","tvnstyle.pl","tvnturbo.pl","twitter.com","unixhow.com","untitle.org","upstream.to","uta-net.com","uticaod.com","v6embed.xyz","vedantu.com","veneto.info","vgembed.com","vidembed.me","videovard.*","viewing.nyc","voirfilms.*","wattpad.com","wawlist.com","wikihow.com","winaero.com","winmeen.com","wired.co.uk","wishflix.cc","wizcase.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhtotal.com","xhwide5.com","xossipy.com","ymovies.vip","zerogpt.net","ziperto.com","zonatmo.com","30edu.com.cn","4x4earth.com","abril.com.br","abysscdn.com","adbypass.org","afrikmag.com","agrointel.ro","allmovie.com","amarillo.com","amestrib.com","amtraker.com","anime2you.de","anisearch.de","anisubindo.*","athletic.net","autoembed.cc","avdelphi.com","bigulnews.tv","bilibili.com","bitblokes.de","bonobono.com","bphimmoi.net","ciweimao.com","cjonline.com","codedosa.com","cool-etv.net","crewbase.net","cronista.com","descopera.ro","dispatch.com","dollarvr.com","ds2video.com","dushu.qq.com","einthusan.tv","elheraldo.hn","fabricjs.com","fairyabc.com","fightful.com","filmzone.com","foodviva.com","forplayx.ink","fosspost.org","fxstreet.com","gamerant.com","gardenia.net","gay69.stream","gdplayertv.*","gearside.com","geniusjw.com","ggeguide.com","ggulpass.com","globaledu.jp","gnt24365.net","habuteru.com","hindi-gk.com","ieltsliz.com","ikorektor.pl","indystar.com","inquirer.net","intramed.net","itvnextra.pl","javjavhd.com","jbjbgame.com","jconline.com","jobskaro.com","joysound.com","jsonline.com","kaystls.site","kentucky.com","knoxnews.com","kolnovel.com","korona.co.jp","kritichno.bg","kurazone.net","kurosave.com","kusonime.com","lazyadmin.nl","leekduck.com","ligowiec.net","linkmate.xyz","liverpool.no","lookmovie.ag","lookmovie2.*","lowcygier.pl","mangainn.net","megacloud.tv","megapixl.com","megatube.xxx","meteo.org.pl","mimikama.org","mineskin.org","mmamania.com","moneyguru.co","movieweb.com","msubplix.com","myflixerz.to","myoplay.club","njherald.com","nonton78.com","novagente.pt","novelpia.com","nowcoder.com","npnews24.com","nsfwzone.xyz","nwherald.com","nzbstars.com","olacast.live","omnisets.com","oricon.co.jp","otakukan.com","ouasafat.com","pal-item.com","palemoon.org","paxdei.th.gl","pcpobierz.pl","pelispedia.*","pentruea.com","photopea.com","picallow.com","pitesti24.ro","playbill.com","pornhd8k.net","portalwrc.pl","powerline.io","priberam.org","pupupul.site","putlocker.pe","radarbox.com","radichubu.jp","reflectim.fr","relet365.com","revenue.land","sarthaks.com","sbnation.com","shumilou.com","sidereel.com","solarmovie.*","sportnews.to","sportsnet.ca","steptalk.org","streamsb.net","streamtape.*","sussytoons.*","suzylu.co.uk","techsini.com","tecmundo.net","telegram.com","th-world.com","theblaze.com","thegamer.com","theverge.com","thizissam.in","topeuropix.*","transinfo.pl","tritinia.com","tutlehd4.com","tvnfabula.pl","tvtropes.org","ultraten.net","unidivers.fr","urbharat.xyz","usatoday.com","valuexh.life","vid2faf.site","vidplay.site","visse.com.br","voeunblk.com","volokit2.com","webnovel.com","webwereld.nl","wrosinski.pl","wzamrani.com","xclient.info","xhaccess.com","xhadult4.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","yhocdata.com","0123movies.ch","4kwebplay.xyz","7misr4day.com","adslayuda.com","alfred.camera","animedrive.hu","animeunity.it","anisearch.com","aniwatchtv.to","ark-unity.com","artesacro.org","asheville.com","audiotools.in","autophorie.de","azcentral.com","aztravels.net","blindhelp.net","blog.csdn.net","blog.kwick.de","bluesnews.com","bongdaplus.vn","box-manga.com","bricksrus.com","broncoshq.com","buienradar.nl","cantonrep.com","casertace.net","centrumher.eu","chieftain.com","chowhound.com","city-data.com","cocomanga.com","coffeeapps.ir","colourxh.site","cyberalert.gr","dddance.party","desertsun.com","desijugar.net","deutschaj.com","dlmovies.link","downfile.site","eca-anime.net","economica.net","emailfake.com","eplayer.click","fantricks.com","firescans.xyz","flory4all.com","flyertalk.com","fontsfree.pro","foxaholic.com","foxteller.com","fraudnavi.com","full-anime.fr","galesburg.com","gaminplay.com","getective.com","gezimanya.com","gmarket.co.kr","goodbakery.ru","goupstate.com","gukjenews.com","helldivers.io","hellokpop.com","hillsdale.net","holakikou.com","howtogeek.com","hutchnews.com","icy-veins.com","ideas0419.com","infodifesa.it","instagram.com","iptv4best.com","jk-market.com","kapitalis.com","kitsapsun.com","kpopjjang.com","laptopmag.com","leeyiding.com","libertatea.ro","limametti.com","listeamed.net","live.b-c-e.us","liveonsat.com","livetennis.it","longecity.org","loverslab.com","m.youtube.com","makeuseof.com","mangaid.click","maxedtech.com","mediafire.com","mediotejo.net","megawypas.com","memangbau.com","meteoblue.com","miraculous.to","mocospace.com","movie-web.app","movie4kto.net","mt07-forum.de","mzzcloud.life","nbcsports.com","neilpatel.com","neoseeker.com","newbernsj.com","newportri.com","newschief.com","neyrologos.gr","nicematin.com","oakridger.com","oceanplay.org","oklahoman.com","otakudesu.org","otempo.com.br","perplexity.ai","phrasemix.com","piecesauto.fr","plural.jor.br","polsatnews.pl","polyflore.net","proboards.com","protopage.com","putlocker.vip","qqwebplay.xyz","radartest.com","radio5.com.pl","rapidshare.cc","readnovel.com","recordnet.com","routenote.com","sachonthi.com","sat-charts.eu","savvytime.com","scrolller.com","shopomo.co.uk","shortform.com","slashfilm.com","slashgear.com","solotrend.net","southcloud.tv","spookshow.net","sportsupa.com","sporttotal.tv","statesman.com","store.kde.org","streamvid.net","studyadda.com","suedkurier.de","swtorlogs.com","t.17track.net","techkings.org","theintell.com","theledger.com","thememypc.net","thethings.com","thewpclub.net","tiermaker.com","timponline.ro","tomsguide.com","top.howfn.com","torontosom.ca","trangchu.news","trojmiasto.pl","tweaktown.com","ubuntudde.com","unikampus.net","uniqueten.net","unlockxh4.com","up4stream.com","uwayapply.com","vid-guard.com","videohelp.com","vidstream.pro","vipstreams.in","visionias.net","vnexpress.net","voe-unblock.*","voeunblck.com","vpnmentor.com","vtube.network","warning.or.kr","waves4you.com","wikibious.com","www.ntv.co.jp","xfce-look.org","xhbranch5.com","xhchannel.com","xhplanet1.com","xhplanet2.com","xhvictory.com","xiaomi4mi.com","yoyofilmeys.*","zerohedge.com","zwei-euro.com","99bitcoins.com","adnan-tech.com","ajanstv.com.tr","allcryptoz.net","ananda-yoga.ro","androidmtk.com","anime-drama.jp","animefire.plus","arlinadzgn.com","audiostereo.pl","audiotools.pro","auto-treff.com","autopareri.com","battle-one.com","bharatavani.in","bigdatauni.com","bikesell.co.kr","bingotingo.com","blog.naver.com","brownsboys.com","btvnovinite.bg","cafe.naver.com","cdramalove.com","chronologia.pl","cincinnati.com","clasicotas.org","clipartmax.com","coinsparty.com","coloradoan.com","comingsoon.net","crunchyscan.fr","curseforge.com","daily-jeff.com","dailycomet.com","dailyworld.com","daotranslate.*","dba-oracle.com","demolandia.net","developpez.com","diaforetiko.gr","doc.mbalib.com","dodge-forum.eu","dreamstime.com","droidtekno.com","dzwignice.info","edailybuzz.com","emturbovid.com","enduro-mtb.com","erinsakura.com","estadao.com.br","eveningsun.com","evreporter.com","fimfiction.net","freeforums.net","fucktube4k.com","funnyordie.com","galleryxh.site","gamebanana.com","gearjunkie.com","genesistls.com","gnome-look.org","golfdigest.com","guiasaude.info","heraldnews.com","houmatoday.com","how-to-pc.info","icourse163.org","ideaberita.com","impots.gouv.fr","indeonline.com","indiatimes.com","infoplease.com","intergate.info","iphonecake.com","iwanichi.co.jp","jacksonsun.com","japan-fans.com","javsubtitle.co","jeniusplay.com","jpopsingles.eu","kangmartho.com","karsaz-law.com","katosatoshi.jp","kicknews.today","kuchniaplus.pl","kutub3lpdf.com","lcsun-news.com","leakedzone.com","learninsta.com","lenconnect.com","lendagames.com","linux-apps.com","lowkeytech.com","majorgeeks.com","malybelgrad.pl","mangareader.to","mangaschan.net","marionstar.com","megapastes.com","mixmods.com.br","mixstreams.top","mkv-pastes.com","moegirl.org.cn","moneyexcel.com","monroenews.com","moviesapi.club","movingxh.world","musicradar.com","musixmatch.com","myhtebooks.com","naijagists.com","naplesnews.com","naukridisha.in","ndtvprofit.com","nekopoi.web.id","netuplayer.top","news-press.com","news.17173.com","news.dwango.jp","news.ntv.co.jp","newsherald.com","newsleader.com","nickiswift.com","nogizaka46.com","ofuxico.com.br","oggiscuola.com","oparana.com.br","openfinanza.it","otvfoco.com.br","paidiatreio.gr","payeer-gift.ru","pecasauto24.pt","pekintimes.com","peliculas24.me","playerx.stream","prepostseo.com","pushsquare.com","rapid-cloud.co","readawrite.com","realpython.com","remixsearch.es","reviewmeta.com","riftherald.com","rightnonel.com","rivestream.org","rozbor-dila.cz","runningnews.gr","screenrant.com","scsun-news.com","selfstudys.com","seriesperu.com","shelbystar.com","shrinkearn.com","slideshare.net","sokolow-mlp.pl","starzunion.com","szkolawohyn.pl","techjunkie.com","techus.website","tekloggers.com","tennessean.com","the-leader.com","the-review.com","theflixertv.to","thegleaner.com","thehawkeye.com","themebanks.com","thestar.com.my","thezealots.org","topautoosat.fi","topcryptoz.net","translate.goog","tv-asahi.co.jp","tv-tokyo.co.jp","tv.verizon.com","tv.youtube.com","tvfreemium.top","tvstreampf.xyz","urbanbrush.net","verselemzes.hu","voeunbl0ck.com","wasza-farma.pl","webcamtaxi.com","whatfontis.com","wheel-size.com","whoisnovel.com","world-novel.fr","wpplugins.tips","xhamster46.com","xhofficial.com","xhwebsite5.com","zipcode.com.ng","10000recipe.com","aepos.ap.gov.in","airfrance.co.jp","airnavradar.com","all4pets.com.pl","alltechnerd.com","altranotizia.it","androidtvbox.eu","appimagehub.com","appofmirror.com","arcanescans.com","argusleader.com","atribuna.com.br","auth.alipay.com","awebstories.com","bestjavporn.com","blitzrechner.de","bluemediafile.*","books-world.net","bucketpages.com","c4ddownload.com","calorielijst.nl","cinegrabber.com","cinemablend.com","comprerural.com","cristoiublog.ro","cssreference.io","cypherscans.xyz","daily-times.com","dailyrecord.com","delmarvanow.com","desbloqueador.*","diffchecker.com","drawasaurus.org","dubznetwork.com","dztechphone.com","elektrikmen.com","elitepvpers.com","elpasotimes.com","fabioambrosi.it","famousintel.com","fayobserver.com","fcportables.com","fdlreporter.com","flinsetyadi.com","formatatmak.com","freewatchtv.top","futbollatam.com","gagetmatome.com","gainesville.com","glistranieri.it","gosanangelo.com","guitarworld.com","halotracker.com","hansa-online.de","heavyfetish.com","hentaihaven.xxx","hibiki-radio.jp","hotpornfile.org","housedigest.com","ihbarweb.org.tr","ilsole24ore.com","includehelp.com","indahonline.com","japonhentai.com","kanjukulive.com","katerionews.com","kickante.com.br","kooora4livs.com","koszalincity.pl","langitmovie.com","lethalpanda.com","lgbtqnation.com","licensekeys.org","linuxslaves.com","livescience.com","loginhit.com.ng","loudersound.com","loveplay123.com","manhwahentai.me","maxstream.video","medeberiya.site","mediahiburan.my","megaup22.online","mehoathinh2.com","miniminiplus.pl","mmafighting.com","moneydigest.com","movies2watch.ru","music.apple.com","news-leader.com","news.chosun.com","northjersey.com","noweconomy.live","onlinetools.com","opendesktop.org","order-order.com","pawastreams.pro","pendulumedu.com","pepperlive.info","phimdinhcao.com","piecesauto24.lu","playonlinux.com","pogdesign.co.uk","polagriparts.pl","poolpiscina.com","primicia.com.ve","privivkainfo.ru","promobit.com.br","putlockernew.vc","qiangwaikan.com","quicksleeper.pl","randomstory.org","read.amazon.com","reborntrans.com","romprovider.com","ruidosonews.com","saikaiscans.net","savannahnow.com","sekaikomik.live","short-story.net","smashboards.com","sneakernews.com","spanishdict.com","starcourier.com","stargazette.com","statelibrary.us","staugustine.com","stream.bunkr.is","tallahassee.com","targetstudy.com","team-octavi.com","techlicious.com","technicpack.net","teile-direkt.ch","textcleaner.net","thegearhunt.com","thememazing.com","thenekodark.com","thenewsstar.com","thespectrum.com","thetowntalk.com","timeanddate.com","timesonline.com","tvshowstars.com","twinkietown.com","ukrainashop.com","uslsoftware.com","venusembed.site","videobot.stream","voe-unblock.com","voeun-block.net","voeunblock3.com","wallauonline.de","wenku.baidu.com","wrestlezone.com","www.youtube.com","yeuphimmoik.com","youtubekids.com","zippyupload.com","zoommastory.com","aberdeennews.com","acupoffrench.com","addons.opera.com","airlinercafe.com","alphapolis.co.jp","animecruzers.com","apornstories.com","arenavalceana.ro","articlesmania.me","as-selection.net","blueridgenow.com","book.zhulang.com","booksmedicos.org","bumigemilang.com","cabinetexpert.ro","canondrivers.org","capecodtimes.com","carsguide.com.au","cdnmoviking.tech","celebzcircle.com","celtadigital.com","cittadinanza.biz","civildigital.com","cleanthinking.de","commandlinux.com","courierpress.com","creativebloq.com","currentargus.com","cyberspace.world","dailynews.us.com","daya-jewelry.com","deccanherald.com","dicasdevalor.net","digminecraft.com","dongphimmoiz.com","dreamsfriend.com","dualshockers.com","easyayurveda.com","englishlands.net","erovideoseek.com","eurooptyk.com.pl","ewrc-results.com","experciencia.com","felizemforma.com","firmwarefile.com","floridatoday.com","fmhikayeleri.com","foodrepublic.com","freetvsports.xyz","freewaysintl.com","fv2freegifts.org","gadsdentimes.com","gordiando.com.br","gourmetscans.net","grandoldteam.com","hardcoregames.ca","healthdigest.com","hoosiertimes.com","htmlreference.io","husseinezzat.com","ilovevaldinon.it","info-beihilfe.de","infomoney.com.br","interviewgig.com","isekaipalace.com","iskandinavya.com","itscybertech.com","jacksonville.com","jamilacuisine.ro","jusbrasil.com.br","justswallows.net","kamerabudaya.com","karyawanesia.com","kitchennovel.com","klsescreener.com","knowyourmeme.com","kollyinsider.com","kooora4lives.net","lokercirebon.com","madeinbocholt.de","medievalists.net","metropoliaztm.pl","money-sense.club","myschool-eng.com","ncrtsolutions.in","newsforbolly.org","nhentaihaven.org","nofilmschool.com","nonesnanking.com","numberempire.com","nusantararom.org","nwfdailynews.com","nydailyquote.com","ofertecatalog.ro","onlineathens.com","outdoorguide.com","outidesigoto.com","paesifantasma.it","perlentaucher.de","petoskeynews.com","poconorecord.com","polskacanada.com","ponselharian.com","portableapps.com","postcrescent.com","pttws.ptt.gov.tr","pureinfotech.com","rabbitstream.net","raven-mythic.com","recordonline.com","repack-games.com","reporternews.com","reservdelar24.se","resourcepack.net","ribbelmonster.de","rule34hentai.net","sabishiidesu.com","savoriurbane.com","script-stack.com","segnidalcielo.it","sekai-kabuka.com","seoul.cs.land.to","sertracen.com.pa","simpleflying.com","sinhasannews.com","skidrowcodex.net","smokelearned.net","socialcounts.org","solarmagazine.nl","sssscanlator.com","ssuathletics.com","straitstimes.com","studiestoday.com","studyrankers.com","sweetslyrics.com","tabonitobrasil.*","tastingtable.com","tech-recipes.com","techtrickseo.com","tecnotutoshd.net","telefon-treff.de","tercihiniyap.net","thailandopen.org","the-dispatch.com","thedailymeal.com","thestarpress.com","thetimesnews.com","todaysparent.com","tohkaishimpo.com","tools.jabrek.net","tweaking4all.com","twitchemotes.com","ukworkshop.co.uk","un-block-voe.net","unknowncheats.me","vidstreaming.xyz","viewsofgreece.gr","vinstartheme.com","visefierbinti.ro","voe-un-block.com","voxvalachorum.ro","vvdailypress.com","wallpapercat.com","warcraftlogs.com","web.facebook.com","webcodegeeks.com","wikiofcelebs.com","wildstarlogs.com","wouterplanet.com","wrestlinginc.com","www.facebook.com","zdravenportal.eu","ziarulargesul.ro","zsti.zsti.civ.pl","affiliate.fc2.com","androidmakale.com","androidpolice.com","androidweblog.com","answersafrica.com","arras.netlify.app","balticlivecam.com","banglainsider.com","beaconjournal.com","blueraindrops.com","book.zongheng.com","braziljournal.com","brooklyneagle.com","cagesideseats.com","charbelnemnom.com","cheboygannews.com","chessimprover.com","chimica-online.it","cinemakottaga.top","citizen-times.com","citpekalongan.com","claplivehdplay.ru","clarionledger.com","classnotes.org.in","coolwallpapers.me","counciloflove.com","daily-tohoku.news","dailyamerican.com","dailynewsview.com","daimangajiten.com","dassen-azara4.com","daysoftheyear.com","deportealdia.live","der-postillon.com","descarga-animex.*","digitaltrends.com","encurtandourl.com","enjoytaiwan.co.kr","fordogtrainers.pl","francis-bacon.com","gamingsinners.com","gastongazette.com","geeksforgeeks.org","geeksoncoffee.com","good-football.org","gq-magazine.co.uk","grostembed.online","guides4gamers.com","heraldtribune.com","heypoorplayer.com","hitproversion.com","hollywoodmask.com","insidermonkey.com","ithacajournal.com","janvissersweer.nl","japanxxxmovie.com","jobsbotswana.info","jornaljoca.com.br","justtrucks.com.au","katholisches.info","kursnacukrzyce.pl","labs.j-novel.club","langweiledich.net","letsdownloads.com","lewblivehdplay.ru","liveyourmaths.com","lubbockonline.com","lugarcerto.com.br","luoghidavedere.it","manianomikata.com","marinetraffic.com","mcocguideblog.com","mcskinhistory.com","media.framu.world","memoryhackers.org","moflix-stream.day","molineuxmix.co.uk","mooc.chaoxing.com","mtbtutoriales.com","music.youtube.com","nbcsportsedge.com","neuroteam-metz.de","nfltraderumors.co","nordkorea-info.de","nostracasa.com.br","oceanof-games.com","palmbeachpost.com","patriotledger.com","phimlongtieng.net","press-citizen.com","pressconnects.com","progameguides.com","recambioscoche.es","registerguard.com","reportergazeta.pl","roztoczanskipn.pl","scarysymptoms.com","serwis-zamkow.com","sharktankblog.com","sizyreelingly.com","sklep-agroland.pl","starsunfolded.com","tchadcarriere.com","terramirabilis.ro","the-scorpions.com","theadvertiser.com","theaircurrent.com","theepochtimes.com","thegraillords.net","theregister.co.uk","times-gazette.com","timesreporter.com","timestelegram.com","toppremiumpro.com","torrentlawyer.com","urochsunloath.com","v-o-e-unblock.com","valeronevijao.com","venusarchives.com","verpornocomic.com","visaonoticias.com","watch.lonelil.com","winhelponline.com","wolfdyslectic.com","workhouses.org.uk","yaledailynews.com","alamogordonews.com","asianexpress.co.uk","autoteiledirekt.de","badgerandblade.com","baixedetudo.net.br","besteonderdelen.nl","bloomberglinea.com","bloombergquint.com","boerse-express.com","bronze-bravery.com","coffeeforums.co.uk","cours-de-droit.net","craftpip.github.io","delawareonline.com","doranobi-fansub.id","eduardo-monica.com","endorfinese.com.br","enterprisenews.com","esercizinglese.com","evasion-online.com","eveningtribune.com","fantasytagtree.com","ferroviando.com.br","figeterpiazine.com","financasdeouro.com","flashdumpfiles.com","flashplayer.org.ua","followmikewynn.com","foreignaffairs.com","freesmsgateway.com","gaypornmasters.com","giromarilia.com.br","gossipnextdoor.com","hayatbilgileri.com","heroesneverdie.com","immobiliaremia.com","iovivoatenerife.it","keighleynews.co.uk","kijyomatome-ch.com","krunkercentral.com","kuroko-analyze.com","lincolncourier.com","luyenthithukhoa.vn","mcdonoughvoice.com","mesquitaonline.com","minecraftforge.net","motortrader.com.my","myfreemp3juices.cc","nationalreview.com","newarkadvocate.com","onlinegiftools.com","onlinejpgtools.com","onlinepngtools.com","onscreensvideo.com","openanesthesia.org","placementstore.com","planetagibi.com.br","pokemonforever.com","portalportuario.cl","postcourier.com.pg","progress-index.com","psihologiadeazi.ro","record-courier.com","renditepassive.net","reporter-times.com","rezervesdalas24.lv","rottentomatoes.com","samsungtechwin.com","sdelatotoplenie.ru","seacoastonline.com","serieslyawesome.tv","sheboyganpress.com","skandynawiainfo.pl","sooeveningnews.com","sovetromantica.com","space-engineers.de","starnewsonline.com","steamcollector.com","stiridinromania.ro","strangermeetup.com","sturgisjournal.com","tauntongazette.com","techsupportall.com","theasianparent.com","thecalifornian.com","thegardnernews.com","theherald-news.com","theitaliantimes.it","thejakartapost.com","themosvagas.com.br","thetimesherald.com","thinkamericana.com","titanic-magazin.de","topperlearning.com","truyenbanquyen.com","tuscaloosanews.com","unlimitedfiles.xyz","upsrtconline.co.in","vercalendario.info","verdadeiroolhar.pt","viveretenerife.com","wirtualnyspac3r.pl","wpb.shueisha.co.jp","xda-developers.com","xxxonlinegames.com","yodelswartlike.com","aileen-novel.online","atlas-geografic.net","bluemoon-mcfc.co.uk","columbiatribune.com","courier-journal.com","courier-tribune.com","csiplearninghub.com","dailycommercial.com","darktranslation.com","demingheadlight.com","descargatepelis.com","dialectsarchive.com","dicasdefinancas.net","digitalfernsehen.de","digitalsynopsis.com","download.ipeenk.com","dreamlandresort.com","duneawakening.th.gl","empregoestagios.com","exclusifvoyages.com","festival-cannes.com","frameboxxindore.com","gazetadopovo.com.br","generationamiga.com","goodnews-magazin.de","handball-world.news","harvardmagazine.com","heraldmailmedia.com","hollandsentinel.com","home.novel-gate.com","independentmail.com","investorvillage.com","jacquieetmichel.net","journalstandard.com","kashmirobserver.net","kirannewsagency.com","legionprogramas.org","livingstondaily.com","lyricstranslate.com","marksandspencer.com","mexiconewsdaily.com","morosedog.gitlab.io","mostrodifirenze.com","musicallyvideos.com","mycentraljersey.com","mzk.starachowice.eu","nakedcapitalism.com","ncert-solutions.com","ncertsolutions.guru","norwichbulletin.com","onlinecoursebay.com","onlinetexttools.com","opportunitydesk.org","orangespotlight.com","perangkatguruku.com","raccontivietati.com","raindropteamfan.com","samurai.wordoco.com","seikatsu-hyakka.com","selfstudyanthro.com","shreveporttimes.com","siliconinvestor.com","smartkhabrinews.com","southcoasttoday.com","starresonance.th.gl","thedailyjournal.com","thedraftnetwork.com","thenorthwestern.com","theonegenerator.com","therecordherald.com","timesrecordnews.com","tipssehatcantik.com","tuttoautoricambi.it","viatasisanatate.com","wallpaperaccess.com","worldscientific.com","aboutchromebooks.com","alphagirlreviews.com","animenewsnetwork.com","astro-cric.pages.dev","augustachronicle.com","autoalkatreszek24.hu","autodielyonline24.sk","badzjeszczelepszy.pl","cdn.gamemonetize.com","cissamagazine.com.br","clubulbebelusilor.ro","commercialappeal.com","compartiendofull.net","corriereadriatico.it","coshoctontribune.com","cristelageorgescu.ro","criticalthinking.org","elektro-plast.com.pl","freereadnovel.online","greenvilleonline.com","hedgeaccordingly.com","ifdreamscametrue.com","impotsurlerevenu.org","karamellstore.com.br","koalasplayground.com","lazytranslations.com","lesmoutonsenrages.fr","lyrical-nonsense.com","magesyrevolution.com","mainframegurukul.com","marriedbiography.com","metagnathtuggers.com","milforddailynews.com","odiarioonline.com.br","onlinecarparts.co.uk","onlinefreecourse.net","photoshop-online.biz","platform.twitter.com","psychologiazycia.com","punto-informatico.it","reservedeler24.co.no","revistavanityfair.es","selfstudyhistory.com","shushan.zhangyue.net","southbendtribune.com","statesmanjournal.com","stockpokeronline.com","technologyreview.com","tempatwisataseru.com","the-daily-record.com","theartofnakedwoman.*","thedailyreporter.com","thegatewaypundit.com","theleafchronicle.com","themeparktourist.com","thepublicopinion.com","ultimate-bravery.net","viafarmaciaonline.it","vinaurl.blogspot.com","windows101tricks.com","aprendeinglessila.com","autoczescionline24.pl","bibliacatolica.com.br","blasianluvforever.com","blogvisaodemercado.pt","bloomberglinea.com.br","cantondailyledger.com","columbiaspectator.com","courierpostonline.com","delicateseliterare.ro","desmoinesregister.com","devilslakejournal.com","diariodoiguacu.com.br","digital.lasegunda.com","download.mokeedev.com","downloadtutorials.net","ellwoodcityledger.com","filmpornoitaliano.org","gamoneinterrupted.com","glamourmagazine.co.uk","globaldefensecorp.com","goldenstateofmind.com","granfondo-cycling.com","greatfallstribune.com","guidingliterature.com","hearthstone-decks.net","hebrew4christians.com","ilclubdellericette.it","ilovefreesoftware.com","ipphone-warehouse.com","japancamerahunter.com","juancarlosmolinos.net","links.extralinks.casa","northwestfirearms.com","onlinestringtools.com","pcso-lottoresults.com","practicetestgeeks.com","premiumembeding.cloud","programming-link.info","promotor-poz.kylos.pl","providencejournal.com","searchenginewatch.com","smokingmeatforums.com","streamservicehd.click","the-masters-voice.com","thenews-messenger.com","tinyhouse-baluchon.fr","uptimeside.webnode.gr","visaliatimesdelta.com","wausaudailyherald.com","cathouseonthekings.com","chillicothegazette.com","cyberkrafttraining.com","dicasfinanceirasbr.com","digitalcameraworld.com","elizabeth-mitchell.org","generatesnitrosate.com","hiraethtranslation.com","hitokageproduction.com","japan-academy-prize.jp","kulinarnastronamocy.pl","labreakfastburrito.com","mainframestechhelp.com","metrowestdailynews.com","monorhinouscassaba.com","mt-milcom.blogspot.com","musicindustryhowto.com","nationalgeographic.com","news-journalonline.com","notificationsounds.com","operatorsekolahdbn.com","palmbeachdailynews.com","planetagibiblog.com.br","pontiacdailyleader.com","programegratuitepc.com","qualityfilehosting.com","techieway.blogspot.com","telyn610zoanthropy.com","thehouseofportable.com","tutoganga.blogspot.com","unbiasedsenseevent.com","underconsideration.com","wiibackupmanager.co.uk","zeeebatch.blogspot.com","battlecreekenquirer.com","burlingtonfreepress.com","columbiadailyherald.com","examiner-enterprise.com","farm-ro.desigusxpro.com","feel-the-darkness.rocks","greenocktelegraph.co.uk","guidon40hyporadius9.com","hattiesburgamerican.com","juegosdetiempolibre.org","lansingstatejournal.com","mercenaryenrollment.com","oferty.dsautomobiles.pl","onlineonderdelenshop.nl","poughkeepsiejournal.com","przegladpiaseczynski.pl","publicopiniononline.com","rationalityaloelike.com","recantodasletras.com.br","republicadecuritiba.net","ryuryuko.blog90.fc2.com","searchenginejournal.com","sqlserveregitimleri.com","stevenspointjournal.com","theghostinmymachine.com","usmleexperiences.review","ate60vs7zcjhsjo5qgv8.com","bendigoadvertiser.com.au","cloudcomputingtopics.net","colegiosconcertados.info","democratandchronicle.com","gamershit.altervista.org","greenbaypressgazette.com","hentaialtadefinizione.it","indianhealthyrecipes.com","mansfieldnewsjournal.com","marshfieldnewsherald.com","montgomeryadvertiser.com","my-code4you.blogspot.com","phenomenalityuniform.com","photobank.mainichi.co.jp","programasvirtualespc.net","stowarzyszenie-impuls.eu","timeshighereducation.com","tricountyindependent.com","warringtonguardian.co.uk","webnoveltranslations.com","antallaktikaexartimata.gr","audaciousdefaulthouse.com","bucyrustelegraphforum.com","burlingtoncountytimes.com","ciberduvidas.iscte-iul.pt","creative-chemistry.org.uk","cyamidpulverulence530.com","dicionariocriativo.com.br","greaseball6eventual20.com","kathleenmemberhistory.com","lancastereaglegazette.com","matriculant401merited.com","portalcriatividade.com.br","portclintonnewsherald.com","realfinanceblogcenter.com","telenovelas-turcas.com.es","worldpopulationreview.com","yusepjaelani.blogspot.com","30sensualizeexpression.com","boonlessbestselling244.com","businessemailetiquette.com","globalairportconcierge.com","interestingengineering.com","northumberland-walks.co.uk","secondlifetranslations.com","singingdalong.blogspot.com","wisconsinrapidstribune.com","69translations.blogspot.com","buckscountycouriertimes.com","colors.sonicthehedgehog.com","garyfeinbergphotography.com","streaminglearningcenter.com","wasserstoff-leitprojekte.de","zanesvilletimesrecorder.com","courseware.cemc.uwaterloo.ca","economictimes.indiatimes.com","mimaletamusical.blogspot.com","springfieldspringfield.co.uk","tnt2-cricstreaming.pages.dev","toxitabellaeatrebates306.com","wlo-cricstreamiing.pages.dev","www-daftarharga.blogspot.com","arti-definisi-pengertian.info","divineyogaschool.blogspot.com","fittingcentermondaysunday.com","launchreliantcleaverriver.com","nahrungsmittel-intoleranz.com","utorrentgamesps2.blogspot.com","zeustranslations.blogspot.com","20demidistance9elongations.com","projektowanie-wnetrz-online.pl","audioreview.m1001.coreserver.jp","freerapidleechlist.blogspot.com","observatoriodocinema.uol.com.br","poplinks.idolmaster-official.jp","insurance-corporate.blogspot.com","mimaletadepeliculas.blogspot.com","certificationexamanswers.890m.com","telecom.economictimes.indiatimes.com","librospreuniversitariospdf.blogspot.com","xn-----0b4asja8cbew2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e7qri.xn--1ck2e1b"];

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
