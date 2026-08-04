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
    stackNeedle = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune', rawPrunePaths, rawNeedlePaths, stackNeedle);
    const stackNeedleDetails = safe.initPattern(stackNeedle, { canNegate: true });
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
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

const todoIndices = new Set();
if ( $hasHostnames$ ) {
    const $scriptletHostnames$ = /* 2100 */ ["x.com","xe.gr","anix.*","clk.sh","ddys.*","dood.*","epn.bz","evz.ro","ft.com","hqq.to","hqq.tv","kmo.to","mbs.jp","mio.to","netu.*","rp5.by","sgd.de","shz.al","t3.com","tfp.is","ttv.pl","tvn.pl","voe.sx","wjx.cn","xtv.cz","1mg.com","app.com","appd.at","bbc.com","bflix.*","bold.dk","c315.cn","cbr.com","cine.to","clk.ink","cnn.com","coag.pl","csid.ro","dnj.com","doods.*","edn.com","gats.io","gmx.com","gmx.net","humo.be","ibps.in","ijr.com","itvn.pl","jfdb.jp","lifo.gr","mdpr.jp","med1.de","mgsm.pl","onna.kr","pnj.com","pobre.*","rgj.com","sbot.cf","t3.chat","tvn7.pl","veev.to","vox.com","vsco.co","vtbe.to","wjx.top","ydr.com","10tv.com","2219.net","9tsu.vip","abola.pt","allen.in","arras.io","arrax.io","asiatv.*","bcs16.ro","blikk.hu","citas.in","cmg24.pl","cnki.net","daum.net","delfi.lt","dngz.net","dooood.*","embed.su","emol.com","espn.com","flixhq.*","gakki.me","glam.com","hemas.pl","j91.asia","jetv.xyz","jpnn.com","khou.com","kukaj.io","libgen.*","likey.me","mhwg.org","nsmb.com","pisr.org","poedb.tw","railf.jp","romet.pl","rukim.id","s.awa.fm","sbflix.*","senpa.io","sflix.ca","sflix.is","sflix.to","sj-r.com","tadu.com","talpo.it","tepat.id","tvn24.pl","ufret.jp","utour.me","vembed.*","vidsrc.*","virpe.cc","wtsp.com","xnxx.com","yuuki.me","zaui.com","zdnet.de","zgbk.com","1shows.ru","47news.jp","adpres.ro","ahzaa.net","aicesu.cn","anauk.net","aniwave.*","archon.gg","artsy.net","autodoc.*","b4usa.com","bmovies.*","brainly.*","brutal.io","cda-hd.cc","cpuid.com","critic.de","ctrl.blog","d000d.com","d0o0d.com","deepl.com","digi24.ro","do0od.com","do7go.com","doply.net","dramaqu.*","earth.com","eater.com","edurev.in","felico.pl","filhub.gr","fin24.com","flagle.io","fmovies.*","fotor.com","freep.com","globo.com","gmx.co.uk","hdrez.com","hianime.*","ibomma.pw","imooc.com","invado.pl","jootc.com","juejin.cn","keybr.com","lesoir.be","lexlog.pl","lohud.com","lublin.eu","lunas.pro","m4uhd.net","mangaku.*","matzoo.pl","mcloud.to","mm9841.cc","mocah.org","naver.com","nebula.tv","news24.jp","newsme.gr","ocala.com","ophim.vip","peekme.cc","player.pl","pling.com","quora.com","ruwix.com","s0urce.io","scmp3.org","seexh.com","sflix2.to","shein.com","sopot.net","tbs.co.jp","tides.net","tiempo.hn","tomshw.it","turbo1.co","txori.com","uemeds.cn","uihtm.com","umk.co.jp","uplod.net","veblr.com","velicu.eu","venea.net","vezess.hu","vide0.net","vidplay.*","vinaurl.*","virpe.com","watson.ch","watson.de","weibo.com","wired.com","women.com","world4.eu","wstream.*","x-link.pl","x-news.pl","xhbig.com","yeane.org","ytv.co.jp","yuque.com","zefoy.com","zgywyd.cn","zhihu.com","ziare.com","360doc.com","3xyaoi.com","4media.com","52bdys.com","699pic.com","actvid.com","adslink.pw","all3do.com","allsmo.com","analizy.pl","ananweb.jp","ancient.eu","animedao.*","auto-doc.*","bdb.com.pl","bejson.com","bembed.net","bestcam.tv","boards.net","boston.com","bpcj.or.jp","broflix.cc","caller.com","camcaps.to","chillx.top","citroen.pl","clujust.ro","crewus.net","crichype.*","curbed.com","d0000d.com","debeste.de","deezer.com","dejure.org","depedlps.*","dlions.pro","dlnews.com","drkrok.com","dxmaps.com","e-sushi.fr","earnload.*","ebc.com.br","embedv.net","esaral.com","fauxid.com","fflogs.com","filefox.cc","filiser.eu","film4e.com","fjordd.com","fnbrjp.com","foodie.com","fullxh.com","galinos.gr","gaz.com.br","ggwash.org","goerie.com","gomovies.*","gplinks.co","grunge.com","hdtoday.so","hienzo.com","hindipix.*","hitcena.pl","hoca4u.com","img999.com","ing-sat.hu","javbix.com","jdnews.com","jeu2048.fr","jeyran.net","jnews5.com","kapiert.de","knshow.com","lcpdfr.com","ldnews.com","legacy.com","listatv.pl","lofter.com","looper.com","love4u.net","lwlies.com","mashed.com","masuit.com","maxroll.gg","mbalib.com","mdlinx.com","medium.com","megaxh.com","menrec.com","milfzr.com","mongri.net","motogon.ru","mpnnow.com","naaree.com","neobux.com","neowin.net","newspao.gr","njjzxl.net","nny360.com","nypost.com","opedge.com","oploverz.*","pc3mag.com","peugeot.pl","piklodz.pl","pixnet.net","pixwox.com","pjstar.com","pokeos.com","polyvsp.ru","protest.eu","qidian.com","quotev.com","racked.com","rdsong.com","riwyat.com","rrstar.com","salina.com","sbenny.com","sbface.com","scribd.com","sdewery.me","sexpox.com","skuola.net","tcpalm.com","texte.work","tiktok.com","tmnews.com","top1iq.com","totemat.pl","tumblr.com","tvzingvn.*","uol.com.br","utamap.com","utaten.com","vcstar.com","vidply.com","vvide0.com","wader.toys","watchx.top","wormate.io","wpchen.net","xhamster.*","xhopen.com","xhspot.com","yamibo.com","youmath.it","zalukaj.io","zingtvhd.*","zingvntv.*","zulily.com","102bank.com","123movies.*","9xbuddy.com","abstream.to","accgroup.vn","adevarul.ro","affbank.com","amlesson.ru","anikaitv.to","aniwatch.to","antena3.com","aoezone.net","arcanum.com","asia2tv.com","ask4movie.*","autodoc24.*","badayak.com","bdcraft.net","bg-gledai.*","bhaskar.com","bianity.net","bimiacg.net","bitcine.app","bluphim.com","boke112.com","bypass.city","canale.live","cattime.com","cepuluh.com","civitai.com","civitai.red","clockks.com","cmjornal.pt","cnblogs.com","coinurl.net","comikey.com","cookhero.gr","d4armory.io","day-hoc.org","decider.com","disheye.com","djelfa.info","dogtime.com","dramacute.*","ds2play.com","duracell.de","elahmad.com","embasic.pro","embtaku.pro","eoreuni.com","epitesti.ro","esologs.com","esscctv.com","europixhd.*","explore.com","ezmanga.net","f2movies.ru","faptiti.com","flixrave.to","fosshub.com","fosters.com","fruit01.xyz","funivie.org","gamegame.kr","geotips.net","goalup.live","goodhub.xyz","hianimez.to","hidemywp.co","hongxiu.com","hotleak.vip","hotleaks.tv","howjsay.com","hoyolab.com","htrnews.com","hukmatpro.*","hulnews.top","ideapod.com","ilife97.com","infokik.com","inverse.com","j-lyric.net","jafekri.com","javbest.xyz","javgrab.com","jio.pftv.ws","keytube.net","kinston.com","kitguru.net","koltry.life","kpopsea.com","ktm2day.com","l2gamers.cl","lalawin.com","lasexta.com","lataifas.ro","leetcode.cn","logonews.cn","lolle21.com","lover93.net","maduras.vip","magesy.blog","malekal.com","mangatoon.*","manhwa18.cc","masrawy.com","maxt.church","mediafax.ro","milenio.com","mobiflip.de","moviepl.xyz","mrbenne.com","nettv4u.com","newsbook.pl","ngelmat.net","novelism.jp","novelza.com","ntuplay.xyz","ntvspor.net","nulled.life","nytimes.com","odiario.com","ohli365.vip","ohmygirl.ml","olarila.com","ontools.net","oreilly.com","otakudesu.*","pagesix.com","pancreas.ro","pandurul.ro","pashplus.jp","phimfit.com","pinterest.*","pngitem.com","poipiku.com","poli-vsp.ru","polygon.com","postype.com","promotor.pl","putlocker.*","qrcode.best","racevpn.com","radioony.fm","redding.com","romviet.com","rubystm.com","rubyvid.com","runmods.com","safetxt.net","satcesc.com","sbbrisk.com","sctimes.com","shaamtv.com","sherdog.com","shinbhu.net","shinchu.net","skionline.*","smalley.com","spectank.jp","starbene.it","stbnetu.xyz","strcloud.in","swtimes.com","taxo-acc.pl","teachoo.com","techgyd.com","tekstowo.pl","thelist.com","thotsbay.tv","tinyppt.com","tistory.com","titulky.com","topfaps.com","trakteer.id","trentino.pl","tuborstb.co","tunegate.me","turbolab.it","tv.bdix.app","tvn24bis.pl","tvnstyle.pl","tvnturbo.pl","twitter.com","unixhow.com","untitle.org","upstream.to","uta-net.com","uticaod.com","v6embed.xyz","vedantu.com","veneto.info","vgembed.com","vidembed.me","videovard.*","viewing.nyc","voirfilms.*","wattpad.com","wawlist.com","wikihow.com","winaero.com","winmeen.com","wired.co.uk","wishflix.cc","wizcase.com","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhtotal.com","xhwide5.com","xossipy.com","ymovies.vip","zerogpt.net","ziperto.com","zonatmo.com","30edu.com.cn","4x4earth.com","abril.com.br","abysscdn.com","adbypass.org","afrikmag.com","agrointel.ro","allmovie.com","amarillo.com","amestrib.com","amtraker.com","anikototv.to","anime2you.de","anisearch.de","anisubindo.*","athletic.net","autoembed.cc","avdelphi.com","bigulnews.tv","bilibili.com","bitblokes.de","bonobono.com","bphimmoi.net","ciweimao.com","cjonline.com","codedosa.com","cool-etv.net","crewbase.net","cronista.com","descopera.ro","dispatch.com","dollarvr.com","doodstream.*","ds2video.com","dushu.qq.com","einthusan.tv","elektroda.pl","elheraldo.hn","enternity.gr","fabricjs.com","fairyabc.com","fightful.com","filmzone.com","foodviva.com","forplayx.ink","fosspost.org","fpmmusic.com","fxstreet.com","gamerant.com","gardenia.net","gay69.stream","gdplayertv.*","gearside.com","geniusjw.com","ggeguide.com","ggulpass.com","globaledu.jp","gnt24365.net","habuteru.com","hindi-gk.com","ieltsliz.com","ikorektor.pl","indystar.com","inquirer.net","intramed.net","itvnextra.pl","javjavhd.com","jbjbgame.com","jconline.com","jobskaro.com","joysound.com","jsonline.com","kaystls.site","kentucky.com","knoxnews.com","kolnovel.com","korona.co.jp","kritichno.bg","kurazone.net","kurosave.com","kusonime.com","lazyadmin.nl","leekduck.com","lifestory.hu","ligowiec.net","linkmate.xyz","liverpool.no","lookmovie.ag","lookmovie2.*","lowcygier.pl","mangainn.net","megacloud.tv","megapixl.com","megatube.xxx","meteo.org.pl","mimikama.org","mineskin.org","mmamania.com","moneyguru.co","movieweb.com","msubplix.com","myflixerz.to","myoplay.club","napiszar.com","njherald.com","nonton78.com","novagente.pt","novelpia.com","nowcoder.com","npnews24.com","nsfwzone.xyz","nwherald.com","nzbstars.com","olacast.live","omnisets.com","oricon.co.jp","otakukan.com","ouasafat.com","pal-item.com","palemoon.org","paxdei.th.gl","pcpobierz.pl","pelispedia.*","pentruea.com","photopea.com","picallow.com","pitesti24.ro","playbill.com","playmogo.com","pornhd8k.net","portalwrc.pl","powerline.io","priberam.org","pupupul.site","putlocker.pe","radarbox.com","radichubu.jp","reflectim.fr","relet365.com","revenue.land","rocklyric.jp","sarthaks.com","sbnation.com","shumilou.com","sidereel.com","solarmovie.*","sportnews.to","sportsnet.ca","steptalk.org","streamsb.net","streamtape.*","sussytoons.*","suzylu.co.uk","techsini.com","tecmundo.net","telegram.com","th-world.com","theblaze.com","thegamer.com","theverge.com","thizissam.in","topeuropix.*","transinfo.pl","tritinia.com","tutlehd4.com","tvnfabula.pl","tvtropes.org","ultraten.net","unidivers.fr","urbharat.xyz","usatoday.com","valuexh.life","vid2faf.site","vidplay.site","vidtube.site","visse.com.br","voeunblk.com","volokit2.com","webnovel.com","webwereld.nl","wrosinski.pl","wzamrani.com","xclient.info","xhaccess.com","xhadult4.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhamster46.*","xhdate.world","yhocdata.com","0123movies.ch","4kwebplay.xyz","7misr4day.com","adslayuda.com","alfred.camera","animedrive.hu","animeunity.it","anisearch.com","aniwatchtv.to","ark-unity.com","artesacro.org","asheville.com","audiotools.in","autophorie.de","azcentral.com","aztravels.net","blindhelp.net","blog.csdn.net","blog.kwick.de","bluesnews.com","bongdaplus.vn","box-manga.com","bricksrus.com","broncoshq.com","buienradar.nl","cantonrep.com","casertace.net","centrumher.eu","chieftain.com","chowhound.com","city-data.com","cocomanga.com","coffeeapps.ir","colourxh.site","cyberalert.gr","dddance.party","desertsun.com","desijugar.net","deutschaj.com","dlmovies.link","dooodster.com","downfile.site","eca-anime.net","economica.net","emailfake.com","eplayer.click","fantricks.com","firescans.xyz","flory4all.com","flyertalk.com","fontsfree.pro","foxaholic.com","foxteller.com","fraudnavi.com","full-anime.fr","galesburg.com","gaminplay.com","getective.com","gezimanya.com","gmarket.co.kr","goodbakery.ru","goupstate.com","gukjenews.com","helldivers.io","hellokpop.com","hillsdale.net","holakikou.com","howtogeek.com","hutchnews.com","icy-veins.com","ideas0419.com","infodifesa.it","instagram.com","iptv4best.com","jk-market.com","kapitalis.com","kashinavi.com","kitsapsun.com","kpopjjang.com","laptopmag.com","leeyiding.com","libertatea.ro","limametti.com","listeamed.net","live.b-c-e.us","liveonsat.com","livetennis.it","longecity.org","loverslab.com","m.youtube.com","makeuseof.com","mangaid.click","maxedtech.com","mediafire.com","mediotejo.net","megaplay.buzz","megawypas.com","memangbau.com","meteoblue.com","miraculous.to","mocospace.com","movie-web.app","movie4kto.net","mt07-forum.de","mzzcloud.life","nbcsports.com","neilpatel.com","neoseeker.com","newbernsj.com","newportri.com","newschief.com","neyrologos.gr","nicematin.com","oakridger.com","oceanplay.org","oklahoman.com","okuhanako.net","otakudesu.org","otempo.com.br","perplexity.ai","phrasemix.com","piecesauto.fr","plural.jor.br","polsatnews.pl","polyflore.net","proboards.com","protopage.com","putlocker.vip","qqwebplay.xyz","radartest.com","radio5.com.pl","readnovel.com","recordnet.com","routenote.com","sachonthi.com","sat-charts.eu","savvytime.com","scrolller.com","shopomo.co.uk","shortform.com","slashfilm.com","slashgear.com","solotrend.net","southcloud.tv","spookshow.net","sportsupa.com","sporttotal.tv","statesman.com","store.kde.org","streamvid.net","studyadda.com","suedkurier.de","swtorlogs.com","t.17track.net","techkings.org","temperatur.nu","theintell.com","theledger.com","thememypc.net","thethings.com","thewpclub.net","tiermaker.com","timponline.ro","tomsguide.com","top.howfn.com","torontosom.ca","trangchu.news","trojmiasto.pl","tweaktown.com","ubuntudde.com","unikampus.net","uniqueten.net","unlockxh4.com","up4stream.com","uwayapply.com","vid-guard.com","videohelp.com","vidstream.pro","vipstreams.in","visionias.net","vnexpress.net","voe-unblock.*","voeunblck.com","vpnmentor.com","vtube.network","warning.or.kr","waves4you.com","wikibious.com","www.ntv.co.jp","xfce-look.org","xhbranch5.com","xhchannel.com","xhplanet1.com","xhplanet2.com","xhvictory.com","xiaomi4mi.com","yoyofilmeys.*","zerohedge.com","zwei-euro.com","99bitcoins.com","adnan-tech.com","ajanstv.com.tr","allcryptoz.net","ananda-yoga.ro","androidmtk.com","anime-drama.jp","animefire.plus","arlinadzgn.com","audiostereo.pl","auto-treff.com","autopareri.com","battle-one.com","bharatavani.in","bigdatauni.com","bikesell.co.kr","bingotingo.com","blog.naver.com","brownsboys.com","btvnovinite.bg","cafe.naver.com","cdramalove.com","chronologia.pl","cincinnati.com","clasicotas.org","clipartmax.com","coinsparty.com","coloradoan.com","comingsoon.net","crunchyscan.fr","curseforge.com","daily-jeff.com","dailycomet.com","dailyworld.com","daotranslate.*","dba-oracle.com","demolandia.net","developpez.com","diaforetiko.gr","doc.mbalib.com","dodge-forum.eu","dreamstime.com","droidtekno.com","dzwignice.info","edailybuzz.com","emturbovid.com","enduro-mtb.com","erinsakura.com","estadao.com.br","eveningsun.com","evreporter.com","fimfiction.net","freeforums.net","fucktube4k.com","funnyordie.com","galleryxh.site","gamebanana.com","gearjunkie.com","genesistls.com","gnome-look.org","golfdigest.com","guiasaude.info","heraldnews.com","houmatoday.com","how-to-pc.info","icourse163.org","ideaberita.com","impots.gouv.fr","indeonline.com","indiatimes.com","infoplease.com","intergate.info","iphonecake.com","iwanichi.co.jp","jacksonsun.com","japan-fans.com","javsubtitle.co","jeniusplay.com","jpopsingles.eu","kangmartho.com","karsaz-law.com","katosatoshi.jp","kicknews.today","kuchniaplus.pl","kutub3lpdf.com","lcsun-news.com","leakedzone.com","learninsta.com","lenconnect.com","lendagames.com","linux-apps.com","lowkeytech.com","mail.yahoo.com","majorgeeks.com","malybelgrad.pl","mangareader.to","mangaschan.net","marionstar.com","megapastes.com","mindmegette.hu","mixmods.com.br","mixstreams.top","mkv-pastes.com","moegirl.org.cn","moneyexcel.com","monroenews.com","moviesapi.club","movingxh.world","musicradar.com","musixmatch.com","myhtebooks.com","naijagists.com","naplesnews.com","naukridisha.in","ndtvprofit.com","nekopoi.web.id","netuplayer.top","news-press.com","news.17173.com","news.dwango.jp","news.ntv.co.jp","newsherald.com","newsleader.com","nickiswift.com","nogizaka46.com","ofuxico.com.br","oggiscuola.com","oparana.com.br","openfinanza.it","otvfoco.com.br","paidiatreio.gr","payeer-gift.ru","pecasauto24.pt","pekintimes.com","peliculas24.me","playerx.stream","prepostseo.com","pushsquare.com","rapid-cloud.co","readawrite.com","realpython.com","remixsearch.es","reviewmeta.com","riftherald.com","rightnonel.com","rivestream.org","rozbor-dila.cz","runningnews.gr","screenrant.com","scsun-news.com","selfstudys.com","seriesperu.com","shelbystar.com","shrinkearn.com","slideshare.net","sokolow-mlp.pl","starzunion.com","szkolawohyn.pl","techjunkie.com","techus.website","tekloggers.com","tennessean.com","the-leader.com","the-review.com","theflixertv.to","thegleaner.com","thehawkeye.com","themebanks.com","thestar.com.my","thezealots.org","timeanddate.de","timeanddate.no","topautoosat.fi","topcryptoz.net","translate.goog","tv-asahi.co.jp","tv-tokyo.co.jp","tv.youtube.com","tvfreemium.top","tvstreampf.xyz","urbanbrush.net","verselemzes.hu","voeunbl0ck.com","wasza-farma.pl","webcamtaxi.com","whatfontis.com","wheel-size.com","whoisnovel.com","world-novel.fr","wpplugins.tips","xhofficial.com","xhwebsite5.com","zipcode.com.ng","10000recipe.com","aepos.ap.gov.in","airfrance.co.jp","airnavradar.com","all4pets.com.pl","alltechnerd.com","altranotizia.it","androidtvbox.eu","appimagehub.com","appofmirror.com","arcanescans.com","argusleader.com","atribuna.com.br","auth.alipay.com","awebstories.com","bestjavporn.com","blitzrechner.de","bluemediafile.*","books-world.net","bucketpages.com","c4ddownload.com","calorielijst.nl","cinegrabber.com","cinemablend.com","comprerural.com","cristoiublog.ro","cssreference.io","cypherscans.xyz","daily-times.com","dailyrecord.com","delmarvanow.com","desbloqueador.*","diffchecker.com","drawasaurus.org","dubznetwork.com","dztechphone.com","elektrikmen.com","elitepvpers.com","elpasotimes.com","fabioambrosi.it","famousintel.com","fayobserver.com","fcportables.com","fdlreporter.com","flinsetyadi.com","formatatmak.com","freewatchtv.top","futbollatam.com","gagetmatome.com","gainesville.com","glistranieri.it","gosanangelo.com","guitarworld.com","halotracker.com","hansa-online.de","heavyfetish.com","hentaihaven.xxx","hibiki-radio.jp","hotpornfile.org","housedigest.com","ihbarweb.org.tr","ilsole24ore.com","includehelp.com","indahonline.com","japonhentai.com","kanjukulive.com","katerionews.com","kickante.com.br","kooora4livs.com","koszalincity.pl","langitmovie.com","lethalpanda.com","lgbtqnation.com","licensekeys.org","linuxslaves.com","livescience.com","loginhit.com.ng","loudersound.com","loveplay123.com","manhwahentai.me","maxstream.video","medeberiya.site","mediahiburan.my","mehoathinh2.com","miniminiplus.pl","mmafighting.com","moneydigest.com","movies2watch.ru","music.apple.com","news-leader.com","news.chosun.com","northjersey.com","noweconomy.live","onlinetools.com","opendesktop.org","order-order.com","pawastreams.pro","pendulumedu.com","pepperlive.info","phimdinhcao.com","piecesauto24.lu","playonlinux.com","pogdesign.co.uk","polagriparts.pl","poolpiscina.com","primicia.com.ve","privivkainfo.ru","promobit.com.br","prpm.dbp.gov.my","putlockernew.vc","qiangwaikan.com","quicksleeper.pl","randomstory.org","read.amazon.com","reborntrans.com","romprovider.com","ruidosonews.com","saikaiscans.net","savannahnow.com","sekaikomik.live","short-story.net","smashboards.com","sneakernews.com","spanishdict.com","starcourier.com","stargazette.com","statelibrary.us","staugustine.com","stream.bunkr.is","tallahassee.com","targetstudy.com","team-octavi.com","techlicious.com","technicpack.net","teile-direkt.ch","textcleaner.net","thegearhunt.com","thememazing.com","thenekodark.com","thenewsstar.com","thespectrum.com","thetowntalk.com","timeanddate.com","timesonline.com","tvshowstars.com","twinkietown.com","ukrainashop.com","uslsoftware.com","venusembed.site","videobot.stream","voe-unblock.com","voeun-block.net","voeunblock3.com","wallauonline.de","wenku.baidu.com","wrestlezone.com","www.youtube.com","yeuphimmoik.com","youtubekids.com","zippyupload.com","zoommastory.com","aberdeennews.com","acupoffrench.com","addons.opera.com","airlinercafe.com","alphapolis.co.jp","animecruzers.com","apornstories.com","arenavalceana.ro","articlesmania.me","as-selection.net","blueridgenow.com","book.zhulang.com","booksmedicos.org","bumigemilang.com","cabinetexpert.ro","canondrivers.org","capecodtimes.com","carsguide.com.au","cdnmoviking.tech","celebzcircle.com","celtadigital.com","cittadinanza.biz","civildigital.com","cleanthinking.de","commandlinux.com","courierpress.com","creativebloq.com","currentargus.com","cyberspace.world","dailynews.us.com","daya-jewelry.com","deccanherald.com","dicasdevalor.net","digminecraft.com","dongphimmoiz.com","dreamsfriend.com","dualshockers.com","easyayurveda.com","englishlands.net","erovideoseek.com","eurooptyk.com.pl","experciencia.com","felizemforma.com","firmwarefile.com","floridatoday.com","fmhikayeleri.com","foodrepublic.com","freetvsports.xyz","freewaysintl.com","fv2freegifts.org","gadsdentimes.com","gordiando.com.br","grandoldteam.com","hardcoregames.ca","healthdigest.com","hoosiertimes.com","htmlreference.io","husseinezzat.com","ilovevaldinon.it","info-beihilfe.de","infomoney.com.br","interviewgig.com","isekaipalace.com","iskandinavya.com","itscybertech.com","jacksonville.com","jamilacuisine.ro","jusbrasil.com.br","justswallows.net","kamerabudaya.com","karyawanesia.com","kitchennovel.com","klsescreener.com","knowyourmeme.com","kollyinsider.com","kooora4lives.net","lokercirebon.com","madeinbocholt.de","medievalists.net","metropoliaztm.pl","milesofmusik.com","money-sense.club","myschool-eng.com","ncrtsolutions.in","newsforbolly.org","nhentaihaven.org","nofilmschool.com","nonesnanking.com","numberempire.com","nusantararom.org","nwfdailynews.com","nydailyquote.com","ofertecatalog.ro","onlineathens.com","outdoorguide.com","outidesigoto.com","paesifantasma.it","perlentaucher.de","petoskeynews.com","poconorecord.com","polskacanada.com","ponselharian.com","portableapps.com","postcrescent.com","pttws.ptt.gov.tr","pureinfotech.com","rabbitstream.net","rapidairmax.site","raven-mythic.com","recordonline.com","repack-games.com","reporternews.com","reservdelar24.se","resourcepack.net","ribbelmonster.de","rule34hentai.net","sabishiidesu.com","savoriurbane.com","script-stack.com","segnidalcielo.it","sekai-kabuka.com","seoul.cs.land.to","sertracen.com.pa","simpleflying.com","sinhasannews.com","skidrowcodex.net","smokelearned.net","socialcounts.org","solarmagazine.nl","songs-wayaku.com","sssscanlator.com","ssuathletics.com","straitstimes.com","studiestoday.com","studyrankers.com","sweetslyrics.com","tabonitobrasil.*","tastingtable.com","tech-recipes.com","techtrickseo.com","tecnotutoshd.net","telefon-treff.de","tercihiniyap.net","thailandopen.org","the-dispatch.com","thedailymeal.com","thestarpress.com","thetimesnews.com","todaysparent.com","tohkaishimpo.com","tools.jabrek.net","tweaking4all.com","twitchemotes.com","ukworkshop.co.uk","un-block-voe.net","unknowncheats.me","vidstreaming.xyz","viewsofgreece.gr","vinstartheme.com","visefierbinti.ro","voe-un-block.com","voxvalachorum.ro","vvdailypress.com","wallpapercat.com","warcraftlogs.com","web.facebook.com","webcodegeeks.com","wikiofcelebs.com","wildstarlogs.com","willow.arlen.icu","wouterplanet.com","wrestlinginc.com","www.facebook.com","zdravenportal.eu","ziarulargesul.ro","zsti.zsti.civ.pl","affiliate.fc2.com","androidmakale.com","androidpolice.com","androidweblog.com","answersafrica.com","arras.netlify.app","balticlivecam.com","banglainsider.com","beaconjournal.com","blueraindrops.com","book.zongheng.com","braziljournal.com","brooklyneagle.com","cagesideseats.com","charbelnemnom.com","cheboygannews.com","chessimprover.com","chimica-online.it","cinemakottaga.top","citizen-times.com","citpekalongan.com","claplivehdplay.ru","clarionledger.com","classnotes.org.in","coolwallpapers.me","counciloflove.com","daily-tohoku.news","dailyamerican.com","dailynewsview.com","daimangajiten.com","dassen-azara4.com","daysoftheyear.com","deportealdia.live","der-postillon.com","descarga-animex.*","digitaltrends.com","encurtandourl.com","enjoytaiwan.co.kr","fordogtrainers.pl","francis-bacon.com","gamingsinners.com","gastongazette.com","geeksforgeeks.org","geeksoncoffee.com","good-football.org","googleapis.com.de","googleapis.com.do","gq-magazine.co.uk","grostembed.online","guides4gamers.com","heraldtribune.com","heypoorplayer.com","hitproversion.com","hollywoodmask.com","insidermonkey.com","ithacajournal.com","janvissersweer.nl","japanxxxmovie.com","jobsbotswana.info","jornaljoca.com.br","justtrucks.com.au","katholisches.info","kursnacukrzyce.pl","labs.j-novel.club","langweiledich.net","letsdownloads.com","lewblivehdplay.ru","liveyourmaths.com","lubbockonline.com","lugarcerto.com.br","luoghidavedere.it","manianomikata.com","marinetraffic.com","mcocguideblog.com","mcskinhistory.com","media.framu.world","memoryhackers.org","molineuxmix.co.uk","mooc.chaoxing.com","mtbtutoriales.com","music.youtube.com","nbcsportsedge.com","neuroteam-metz.de","nfltraderumors.co","nordkorea-info.de","nostracasa.com.br","oceanof-games.com","palmbeachpost.com","patriotledger.com","phimlongtieng.net","press-citizen.com","pressconnects.com","progameguides.com","recambioscoche.es","registerguard.com","reportergazeta.pl","roztoczanskipn.pl","scarysymptoms.com","serwis-zamkow.com","sharktankblog.com","sizyreelingly.com","sklep-agroland.pl","soundcloudmp3.org","starsunfolded.com","tchadcarriere.com","terramirabilis.ro","the-scorpions.com","theadvertiser.com","theaircurrent.com","theepochtimes.com","thegraillords.net","theregister.co.uk","times-gazette.com","timesreporter.com","timestelegram.com","toppremiumpro.com","torrentlawyer.com","urochsunloath.com","v-o-e-unblock.com","valeronevijao.com","venusarchives.com","verpornocomic.com","visaonoticias.com","watch.lonelil.com","winhelponline.com","wolfdyslectic.com","workhouses.org.uk","yaledailynews.com","alamogordonews.com","asianexpress.co.uk","autoteiledirekt.de","badgerandblade.com","baixedetudo.net.br","besteonderdelen.nl","bloomberglinea.com","bloombergquint.com","boerse-express.com","bronze-bravery.com","coffeeforums.co.uk","cografyahocasi.com","cours-de-droit.net","craftpip.github.io","delawareonline.com","doranobi-fansub.id","eduardo-monica.com","endorfinese.com.br","enterprisenews.com","esercizinglese.com","evasion-online.com","eveningtribune.com","fantasytagtree.com","ferroviando.com.br","figeterpiazine.com","financasdeouro.com","flashdumpfiles.com","flashplayer.org.ua","followmikewynn.com","foreignaffairs.com","freesmsgateway.com","gaypornmasters.com","giromarilia.com.br","gossipnextdoor.com","hayatbilgileri.com","heroesneverdie.com","immobiliaremia.com","iovivoatenerife.it","keighleynews.co.uk","kijyomatome-ch.com","krunkercentral.com","kuroko-analyze.com","lincolncourier.com","luyenthithukhoa.vn","mcdonoughvoice.com","mesquitaonline.com","minecraftforge.net","motortrader.com.my","myfreemp3juices.cc","nationalreview.com","newarkadvocate.com","onlinegiftools.com","onlinejpgtools.com","onlinepngtools.com","onscreensvideo.com","openanesthesia.org","placementstore.com","planetagibi.com.br","pokemonforever.com","portalportuario.cl","postcourier.com.pg","progress-index.com","psihologiadeazi.ro","record-courier.com","renditepassive.net","reporter-times.com","rezervesdalas24.lv","rottentomatoes.com","samsungtechwin.com","sdelatotoplenie.ru","seacoastonline.com","serieslyawesome.tv","sheboyganpress.com","skandynawiainfo.pl","sooeveningnews.com","sovetromantica.com","space-engineers.de","starnewsonline.com","steamcollector.com","stiridinromania.ro","strangermeetup.com","sturgisjournal.com","tauntongazette.com","techsupportall.com","theasianparent.com","thecalifornian.com","thegardnernews.com","theherald-news.com","theitaliantimes.it","thejakartapost.com","themosvagas.com.br","thetimesherald.com","thinkamericana.com","titanic-magazin.de","topperlearning.com","truyenbanquyen.com","tuscaloosanews.com","unlimitedfiles.xyz","upsrtconline.co.in","vercalendario.info","verdadeiroolhar.pt","viveretenerife.com","wirtualnyspac3r.pl","wpb.shueisha.co.jp","xda-developers.com","xxxonlinegames.com","yodelswartlike.com","aileen-novel.online","atlas-geografic.net","bluemoon-mcfc.co.uk","columbiatribune.com","courier-journal.com","courier-tribune.com","csiplearninghub.com","dailycommercial.com","darktranslation.com","demingheadlight.com","descargatepelis.com","dialectsarchive.com","dicasdefinancas.net","digitalfernsehen.de","digitalsynopsis.com","download.ipeenk.com","dreamlandresort.com","duneawakening.th.gl","empregoestagios.com","exclusifvoyages.com","festival-cannes.com","frameboxxindore.com","gazetadopovo.com.br","generationamiga.com","goodnews-magazin.de","handball-world.news","harvardmagazine.com","heraldmailmedia.com","hollandsentinel.com","home.novel-gate.com","independentmail.com","investorvillage.com","jacquieetmichel.net","journalstandard.com","kashmirobserver.net","kirannewsagency.com","legionprogramas.org","livingstondaily.com","lyricstranslate.com","marksandspencer.com","mexiconewsdaily.com","morosedog.gitlab.io","mostrodifirenze.com","musicallyvideos.com","mycentraljersey.com","mzk.starachowice.eu","nakedcapitalism.com","ncert-solutions.com","ncertsolutions.guru","norwichbulletin.com","onlinecoursebay.com","onlinetexttools.com","opportunitydesk.org","orangespotlight.com","perangkatguruku.com","raccontivietati.com","raindropteamfan.com","samurai.wordoco.com","seikatsu-hyakka.com","selfstudyanthro.com","shreveporttimes.com","siliconinvestor.com","smartkhabrinews.com","southcoasttoday.com","starresonance.th.gl","thedailyjournal.com","thedraftnetwork.com","thenorthwestern.com","theonegenerator.com","therecordherald.com","timesrecordnews.com","tipssehatcantik.com","tuttoautoricambi.it","viatasisanatate.com","wallpaperaccess.com","worldscientific.com","aboutchromebooks.com","alphagirlreviews.com","animenewsnetwork.com","astro-cric.pages.dev","augustachronicle.com","autoalkatreszek24.hu","autodielyonline24.sk","badzjeszczelepszy.pl","cdn.gamemonetize.com","cissamagazine.com.br","clubulbebelusilor.ro","commercialappeal.com","compartiendofull.net","corriereadriatico.it","coshoctontribune.com","cristelageorgescu.ro","criticalthinking.org","elektro-plast.com.pl","freereadnovel.online","greenvilleonline.com","hedgeaccordingly.com","ifdreamscametrue.com","impotsurlerevenu.org","karamellstore.com.br","koalasplayground.com","lazytranslations.com","lesmoutonsenrages.fr","magesyrevolution.com","mainframegurukul.com","marriedbiography.com","metagnathtuggers.com","milforddailynews.com","odiarioonline.com.br","onlinecarparts.co.uk","onlinefreecourse.net","photoshop-online.biz","platform.twitter.com","psychologiazycia.com","punto-informatico.it","readcomicsonline.lol","reservedeler24.co.no","revistavanityfair.es","selfstudyhistory.com","shushan.zhangyue.net","southbendtribune.com","statesmanjournal.com","stockpokeronline.com","technologyreview.com","tempatwisataseru.com","the-daily-record.com","theartofnakedwoman.*","thedailyreporter.com","thegatewaypundit.com","theleafchronicle.com","themeparktourist.com","thepublicopinion.com","ultimate-bravery.net","viafarmaciaonline.it","vinaurl.blogspot.com","windows101tricks.com","aprendeinglessila.com","autoczescionline24.pl","bibliacatolica.com.br","blasianluvforever.com","blogvisaodemercado.pt","bloomberglinea.com.br","cantondailyledger.com","columbiaspectator.com","courierpostonline.com","delicateseliterare.ro","desmoinesregister.com","devilslakejournal.com","diariodoiguacu.com.br","digital.lasegunda.com","download.mokeedev.com","downloadtutorials.net","ellwoodcityledger.com","filmpornoitaliano.org","gamoneinterrupted.com","glamourmagazine.co.uk","globaldefensecorp.com","goldenstateofmind.com","granfondo-cycling.com","greatfallstribune.com","guidingliterature.com","hearthstone-decks.net","hebrew4christians.com","ilclubdellericette.it","ilovefreesoftware.com","ipphone-warehouse.com","japancamerahunter.com","juancarlosmolinos.net","links.extralinks.casa","northwestfirearms.com","onlinestringtools.com","pcso-lottoresults.com","practicetestgeeks.com","premiumembeding.cloud","programming-link.info","promotor-poz.kylos.pl","providencejournal.com","searchenginewatch.com","smokingmeatforums.com","streamservicehd.click","the-masters-voice.com","thenews-messenger.com","tinyhouse-baluchon.fr","uptimeside.webnode.gr","visaliatimesdelta.com","wausaudailyherald.com","cathouseonthekings.com","chillicothegazette.com","cyberkrafttraining.com","dicasfinanceirasbr.com","digitalcameraworld.com","elizabeth-mitchell.org","generatesnitrosate.com","hiraethtranslation.com","hitokageproduction.com","japan-academy-prize.jp","kulinarnastronamocy.pl","labreakfastburrito.com","mainframestechhelp.com","metrowestdailynews.com","monorhinouscassaba.com","mt-milcom.blogspot.com","musicindustryhowto.com","nationalgeographic.com","news-journalonline.com","notificationsounds.com","operatorsekolahdbn.com","palmbeachdailynews.com","planetagibiblog.com.br","pontiacdailyleader.com","qualityfilehosting.com","techieway.blogspot.com","telyn610zoanthropy.com","thehouseofportable.com","tutoganga.blogspot.com","unbiasedsenseevent.com","underconsideration.com","wiibackupmanager.co.uk","zeeebatch.blogspot.com","battlecreekenquirer.com","burlingtonfreepress.com","columbiadailyherald.com","examiner-enterprise.com","farm-ro.desigusxpro.com","feel-the-darkness.rocks","greenocktelegraph.co.uk","guidon40hyporadius9.com","hattiesburgamerican.com","jimpenopisonline.online","juegosdetiempolibre.org","lansingstatejournal.com","mercenaryenrollment.com","oferty.dsautomobiles.pl","onlineonderdelenshop.nl","poughkeepsiejournal.com","przegladpiaseczynski.pl","publicopiniononline.com","rationalityaloelike.com","recantodasletras.com.br","republicadecuritiba.net","ryuryuko.blog90.fc2.com","searchenginejournal.com","sqlserveregitimleri.com","stevenspointjournal.com","theghostinmymachine.com","usmleexperiences.review","ate60vs7zcjhsjo5qgv8.com","bendigoadvertiser.com.au","cloudcomputingtopics.net","colegiosconcertados.info","democratandchronicle.com","gamershit.altervista.org","greenbaypressgazette.com","hentaialtadefinizione.it","indianhealthyrecipes.com","mansfieldnewsjournal.com","marshfieldnewsherald.com","montgomeryadvertiser.com","my-code4you.blogspot.com","phenomenalityuniform.com","photobank.mainichi.co.jp","programasvirtualespc.net","stowarzyszenie-impuls.eu","timeshighereducation.com","tricountyindependent.com","warringtonguardian.co.uk","webnoveltranslations.com","antallaktikaexartimata.gr","audaciousdefaulthouse.com","bucyrustelegraphforum.com","burlingtoncountytimes.com","ciberduvidas.iscte-iul.pt","creative-chemistry.org.uk","cyamidpulverulence530.com","dicionariocriativo.com.br","docs.paloaltonetworks.com","greaseball6eventual20.com","kathleenmemberhistory.com","lancastereaglegazette.com","matriculant401merited.com","portalcriatividade.com.br","portclintonnewsherald.com","realfinanceblogcenter.com","telenovelas-turcas.com.es","worldpopulationreview.com","yusepjaelani.blogspot.com","30sensualizeexpression.com","boonlessbestselling244.com","businessemailetiquette.com","globalairportconcierge.com","interestingengineering.com","northumberland-walks.co.uk","secondlifetranslations.com","singingdalong.blogspot.com","wisconsinrapidstribune.com","69translations.blogspot.com","buckscountycouriertimes.com","colors.sonicthehedgehog.com","garyfeinbergphotography.com","streaminglearningcenter.com","wasserstoff-leitprojekte.de","zanesvilletimesrecorder.com","courseware.cemc.uwaterloo.ca","economictimes.indiatimes.com","mimaletamusical.blogspot.com","springfieldspringfield.co.uk","tnt2-cricstreaming.pages.dev","toxitabellaeatrebates306.com","wlo-cricstreamiing.pages.dev","www-daftarharga.blogspot.com","arti-definisi-pengertian.info","divineyogaschool.blogspot.com","fittingcentermondaysunday.com","launchreliantcleaverriver.com","nahrungsmittel-intoleranz.com","utorrentgamesps2.blogspot.com","zeustranslations.blogspot.com","20demidistance9elongations.com","projektowanie-wnetrz-online.pl","audioreview.m1001.coreserver.jp","freerapidleechlist.blogspot.com","observatoriodocinema.uol.com.br","poplinks.idolmaster-official.jp","insurance-corporate.blogspot.com","mimaletadepeliculas.blogspot.com","certificationexamanswers.890m.com","telecom.economictimes.indiatimes.com","librospreuniversitariospdf.blogspot.com"];
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
    indicesFromHostname(todoIndices, entries[0]);
    if ( $hasAncestors$ ) {
        for ( const entry of entries ) {
            if ( entry.i === 0 ) { continue; }
            indicesFromHostname(todoIndices, entry, '>>');
        }
    }
}

// Collect arglist references
const todo = new Set();
if ( todoIndices.size !== 0 ) {
    const $scriptletArglistRefs$ = /* 2100 */ "762;219;682,683,684;6,67;610;73,324;497;15;766;47,390,489,490;76;324;7;73;701;188;73;783;211;67;273;273;73,515;5,10,470;422;392;593;106,397;750;24,25,26,27;220;504;708;9;212;770;5;7;593;73,324;689;294;623;430;135;340,525;690;273;338;209;248;102;631;7,71,75,106;593;41,620,621;593;677;822;273;767;173;73;653;5,10,470;593;392;350;20;343;814;720;720;73;7;807;71;7;73;8,67;71;5,229,736;73,324;23,739;80;73;682,683;577;71;73;73;717,741;388;392;680;252;625;363;267;352;255;360;8;340,525;39;296;663;627;627;626,627;593;290;408;269;273;73,341;380;727,739;23,25,701,738,739,740;73,153,391;713;165;54;2;197;67;25,26,27,815;15;187;5;171;369;682,683,684;754;0;801;99;347;550;673;47;364;302;172;73,324;73,324;71;71;73,324;73,324;73,324;15;323;173;15,71,694;67;3;151;60;67,176,340,683;221;593,690;71;623;7;701;15;475;348;7,191,272,333,334,335;321;254;218;5,10,152;593;73;352;277;15,73;8,73;683;67,565;8,493;755;791;73;67,298,462;593;681;476;273;695;420;184;11;63;699;627;804;289;339;54;340,525;149;73;663;505;73;294;352;564;67;251;810,811;73,324;684;262;5,153;55;55;760;421;71;7,79,398,399,400;41,319;273;273;699;67;5;71;490;67;348;71;5,473,474;41,67;73;319;376,472;407;19,41;73,324;385;354;73;100;520;801;393;50;727,739;625;0;690;67;625;593;635;520;73,423;67,129,298;19,73;783;173;73,324;8;88,297;820;67;741;2;340,525;288;5,6;212;92;727,739;7;460;591;68;793;667;41;552;71;699;706;174;567,568;593;67;73;71;682,683,684;8;25,239;73;8,436;8;47,48;15;593;326;67;340,525,611;73;5,85;415,761;593;691;8;73;71;714;302;71;5,316;724;518;278;0;699;487;304;12,67;157;593;47,107,385,488;139;211;340,525;73;41;711;115;503;113;73,423;67,612,613,614;466;598;593;57,58;73;112;348;281,282;173;372;340,525;593;593;115;406,407;2;106,107;15;348;593;7,208,359;41;593;553;13;678;296;71,72;8;32;593;73,324;73,324;7;20;41;73;699;699;699;467;10,75,449,450;793;296;296;186;99;67,340,389,390;54;19;73,388;80;498;18,194;25,27;701;73;161;806;73;569,570,571;801;67;179;73;805;73;67;23,25,26,27;677;187;686,687;5;690;190;64;64;340,525;171;766;262;688;67;744;340,525;711;234;7,152,153;690;67,291;73,324;73;139;741;742;7;7,17,139;591;769;19,67;71;67,612,613,614;683;41;682,684;123;593;7,13,368;67;7;47,427,428;8,15;338;701;609;73,480;23,41;23,41;148;42,43;593;122;67,187;98,141;7,106;67,612,613,614;2;37;67,612,613,614;15;15;783;36;593;404;67,612,613,614,615,616;73;67;7,174;67,330;73;67,439,440;764;485;67;590;340,525;41,524;337;67;777;303;390;71;71;302;554;743;71,73;106,107;726;432;545;574;290;8;81,82;71;159;374;221;67;698;67;711;174;92,299;73;316,666;65,66;5;608;73;136,173;73;294;7;802;174;166;593;642;520;520;308;15;18,67,174,175,176;406,407;593;13;689;19,73;19,73;131;789;360;67,452;701;73;593;73;191;522;72;71;338,701;67,106,107;7;531;23,41;376;8;490;578;201;729;273;273;273;762;344;67;67,373;259;593;727,739;41;71;390,659,660;324;324;266;5,10;8,451;13,19,67,191;346;109;340,525;192;793;149;699;699;699;699;699;699;699;699;699;699;699;753;701;54;318;772;482;327,328;71;701;686,687;340,525;71;453;593;593;705;25,27;145;210;5,18,196,229;180;741;314,315,316;187,199;71,465,796;214;372;338;5,473;593;340,525;73,390;19,73;227;67;593;67,298,462;73,324;73,324;5,10,388;757;817;72;818;117;225;749;340,525;139;672;382;45;307;708;499,500,501,502;13,14;73,701;78;67;13,67;7;67,402;6,67;7;67,107,128,129;340,525;657;593;690;111;273;15;340,525;593;106,397;645,646,647,648;593;340,525;771;593;67,612,613,614,615,616;429;340,525;17,18;253;19,67,240;55,692;576;8;8;533;221;207;768;723;689;701;377;8;8;302;728;173;384;708;67;407;67;809;593;296;71;547,548,549;71;158;563;323;8;294,574;798;33,38;67;6;593;154;61;8;7,8;67,71;390;522;340,525;221;73,324;316;73;673;189;701;407;53;355;6,67;106,272;525,573;34,35;71;173;153;453,689;666;385,425,510,511;49;127;406,407;73;23,781,782;73;444;234;593;268,411,412;431;708;173;630;19,67;71;5,272,425;8;273;89;19,73;267;294,385;593;699;682,683,684;682,683;701;340,525;41,517;7,106;348,390,649;147;712;73;50;699;699;699;699;699;699;699;699;699;699;699;699;699;699;699;699;534;489,548,560,670;8;6,67,107;301;709,710;790;8;210;701;780;6,73;225;67;13;593;294,561;788;321;167,208,229;707;560,745;73;5;312;206;593;224;114;593;71;80;73;340,525;699;779;73;593;19;67;563;73,324;294,561;77;71;71;294,574;167;718;67;93;247;31,479;41,368,785,786,787;8;295;593;73;340,525;169,170;391,436;67,167;593;159;744;340,525;593;5,13;708;593;358;67;340,525;182;340,525;643;340,525;40;593;187;211;513;71;67;727,739;234;8;103;361;792;202,203,204,205;708;67;266,267;91;302;701;8;294,561;535;41,175,294,390,507,508;274;721;702;286;324;431;654;671;593;593;593;13,67;463;593;727;593;37;67,241;71;774;306;801;340,525;71;357;0;592;701;8;758;8;73,480;593;280;67;8;690;73;494;644;71;71;419;324;120;8;58,795;593,689;695;73;47,48;8;591;741;116;62;593;593;566;708;352;477;14,18,128;102;6;794;294,561;255;776;443;5;19,73;699;19,20;139;727,739;121;683;407,701;15;737;41,517;41,517;149;653;8;558;7,272;41;695;699;699;699;699;699;7;67;392;514;69;8;225;19,73;340,525;67;340,525;735;71;337;286;266;5,13;734;340,525;294;67,107;259;10;73;5,10,176;67;47,322;593;159;7;73;593;689;67;266;593;593;593;7,75,440;139;5;491;13,67;483;286;367;106,107;73;348;490;679;71;71;593;340,525;468;0;21;173;699;255,256;689;19,298;695;607;19,73;593;593;722;5,19,388;229;52;593;71;278;47;318;313;593;370;340,525;324,676;19,41,67,167,187,634;6;18,107,522;294;340,525;273;403;593;41,664,665;340,525;593;19;695;443;812;145,689;5;663;73;593;5,10;808;83;73,701;73,75;471;340,525;593;20,701;699;211;236;464;13;593;6;388;79,284;701;593;71;294;560;593;593;71;8;71;97;67;67,107,298;80;67,622;5;801;593;18,73;520;448;102;701;580,581,582,583,584,585,586;530;756;155;173;5,13,152;73,191,739;340,525;16,67,159;708;593;41,629;41,675;593;6,67;605,606;370;715;391;392;494;190;593;593;593;407;593;593;352;285;67;752;752;801;19,73;696;73,294;47;202,203;73,701;6,298;67;5,10,167,176,229,396,640;41,517;8;365;417;160;67;25,26,27,28,29,30;167;699;699;597;15;8,15;305;53;73;7;291;298,461,462;695;469;340,525;593;261;481;67,98,588;67,565;71;651,652;113;126;495;134;572;198;416;7,75;433;73;593;593;593;5;329;445;425,574;67;106,397;540,541;593;67;340,525;593;242;593;272,298,340;340,525;73,701;73;5,6;593;7,98;593;211;99;236;628;73;73;5,10,229,396;71;492;285;258;773;778;349;324;285;67;19,67;5;495;689;340,525;122;211;338;102;405;67;41,319,589;340,525;340,525;668;273;173;71;683;73;593;217;593;47;655;695;690;490;71;390;519,520;801;195;803;229,424;340,525;340,525;67,98,194,556;392;44;683;5,13;5;18;73;67,612,613,614,615,616;7;593;693;593;67;115;213;624;486;593;593;5,193;593;67;593;200;685;690;690;801;266;332;352;73;593;593;593;752;593;340,525;173;73;73;703;324;73,515,516;41,517;41,517;302;521;690;202,203;167;202,203;41;67;593;545;183;118;47,320,321,322;557;142,143;67,167;8,19;313;593;290;18,144;67,399;106,107;237,238;593;132;677;340,525;73;7,98;224;302;478;593;211;593;10;6;759;388;73;716;532;362;708;272,333,525,641;7;294;340,525;13;19,73;67;593;67;71;721;73;67;593;7;538;385,434;71;593;115;73,191;13,67;67;80;6;674;579;406;593;603,604;86;324;300;5;340,525;295;690;108;67;310;302;689;279;46;331;265;731;67,262;602;690;41,517;138;73,528,529;593;6;103;593;71;67;408;302;593;593;167;5,10,13;155;593;512;224;701;25,26,27;110;593;167;593;801;17,18;67;73;7,19;7;73,352;292;8;153;340,525;708;340,525;73,187;596;266;751;340,525;73;526;2;732;734;321;7,13,196;71;340,525;18,128;7,16;286;159;67,612,613,614,615,616;593;71;593;593;2;313;51;730;73;292;41,517;765;717;340,525;41,650;340,525;41,517;340,525;593;784;591;95;101;340,525;591;229,813;236,407;71;95,96;8,67,129,410;340,525;41;317;67;708;223;67;720;226;8,19,185;593;67,551;5,153;79;522;148;338;593;7,13,75;208;5;593;260;8;593;7;546;67,612,613,614;67,291;593;6,10;73;67;689;67;302;87;323;719;159;163,164;790;539;593;542,543,544;67,397;255;338;338;192;703;351;593;119;106,397;446,518;250;593;187;15;7,146;340,525;90;446;21;73;302;67;8;340,525;593;168;6,7;18,67;700;16;658;174,340,525;617;231;527;67,216;202,203;431;340,525;232;47,426;159;10,13,229,270;593;593;520,636,637,638,639;593;593;387;801;593;47,322,335;73;67,656;67;272,333,525,641;41,517;418;63;18,67;13,67;8;495;593;67,340,525,612,613,614,615,616;409;121;263;593;593;593;441,442;391,435,436,437;41,517;41,517;41,517;224;224;311;571;689;41,517;67;231;593;67;801;99;7,496;801;71;12,181;133;115;145;819;340,525;594;593;67,271,272;67;292;593;99;5,6;593;600,601;67,612,613,614;41,517;73;340,525;5,13,229;67,229;287;1;5;139;340,525;340,525;173;340,525;5,13;211;402;19;294;593;67;593;352;243;342;633;690;593;655;655;655;324;775;340,525;7,75;125;80;5,187,232,340,525,619;593;272,425,525;593;298,319,454,455,456,457,458;593;801;345;340,525;67,79;593;302;593;352;593;356;145;593;618;67;276;593;593;150;523;593;593;249;228;697;280,385,459;593;487;302;338;67,128,129,612,613,614;593;555;130;597;6;73;73;41;690,708;221;41,517;67,399;5,106,107;371;593;593;593;340,525;593;187;593;559,560;13,14;73;73;5,13;67;234;61;106,397;5,6;73;556;71;7,272;302;302;689;593;593;340,525;593;537;5;593;104;18,67;67,75;593;375;73;177;587;67;67;593;99;230;340,525;340,525;593;352;655;272,298;268;484;13;67;469;67;272,298;593;145;8,73;593;61;593;690;593;658;593;593;340,525;801;340,525;632;121;689;340,525;704;783;593;801;801;10,152,222;294;378,379;73;593;318;285;593;13,67,229,388,536;509;8;67,612,613,614,615,616;593;230;13,67,73,401;244;275;340,525;106,107;224;56;159;348;41,517;593;47,385;801;352;292;-763,763;16,67;70;821;801;438;75,107,167,298,309;139;593;593;67;178;340,525;593;156;593;325;593;318;593;115;5;19,413,414;198,233;340,525;801;12;13,67;340,525;71;593;84;593;167;593;593;264;73;690;259,352;593;5,10,152;41,517;192;340,525;669;59;593;67,107,298;293;67,235;67;575;73,746,747,748;118;124;523;116;655;5;6,67;703;722;8;593;94;312;294;73,187,298,340;593;67;67;593;593;105;593;340,525;73;211;13,67,353;41,517;340,525;733;248;67,612,613,614;797;5;593;41,517;6,67;67,237,298;0,73;593;730;10,191;593;7,75;593;107,140;10;41,517;290;366;390;283;798;370;593;593;593;593;388;5,13,152;102;41,517;593;41;13,67;593;67;73;340,525;593;73;593;41,517;215;14;245,246;257;167;593;67;67;741;394;73,489;340,525;593;5;593;383;19,67,599;593;593;593;229;41,517;336;340,525;73;562;593;74;22;801;41,517;593;593;71;67;41,517;12;816;41,517;41,517;593;41,517;398,595;593;41,517;324,666;2;229;41,517;41,517;106,107;799;2;139;67,506,612,613,614,615,616;16,139;593;10,152,395;593;648,661,662;73;447;236;593;8;73,137;7;80;783;41,517;783;67,528;47,75,106;67;41,517;41,517;302;19,153;800;41,517;106,272;67,340;67;381;386;162;5,6;67;4;6,15,19,280,725";
    const arglistRefs = $scriptletArglistRefs$.split(';');
    for ( const i of todoIndices ) {
        for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
            todo.add(ref);
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
if ( todo.size === 0 ) { return; }

// Execute scriplets
{
    const $scriptletFunctions$ = /* 21 */
[preventAddEventListener,abortCurrentScript,abortOnPropertyRead,preventSetTimeout,abortOnPropertyWrite,removeAttr,setConstant,preventFetch,preventXhr,trustedReplaceArgument,trustedReplaceXhrResponse,jsonPrune,trustedSetConstant,preventSetInterval,noEvalIf,abortOnStackTrace,adjustSetInterval,noWindowOpenIf,adjustSetTimeout,trustedSuppressNativeMethod,trustedReplaceOutboundText];
    const $scriptletArgs$ = /* 693 */ ["scroll","$","modal_newsletter","/^(mouseout|mouseleave)$/","pum_popups","show-login-layer-article","document.oncontextmenu","document.onselectstart","oncontextmenu","/^(contextmenu|copy)$/","getSelection","disableSelection","nocontext","contextmenu","disableselect","reEnable","clickIE4","document.onkeydown","devtoolsDetector","{}","document.addEventListener","/contextmenu|copy|cut|key/","","elements","document","keydown","123","[arguments];","console.clear","trueFunc","console.table","console.log","key","/copy|selectstart/","return","/preventDefault|pointerType/","onkeydown|onselectstart|oncontextmenu","body[onkeydown*=\"__cfRLUnblockHandlers\"]","complete","oncontextmenu|onselectstart",".lyricBody[oncontextmenu]","oncontextmenu|onselectstart|onmousedown",".all-lyrics[oncontextmenu]","oncopy|oncut|onmousemove|onmousedown|style","#lyric_area[oncopy]","#lyric_area > p[oncontextmenu]","#lyrics[oncontextmenu]","body[oncontextmenu]","dragstart",".all-lyrics","[native code]","#__next","oncopy|onSelectStart|oncontextmenu|style","[oncopy],[oncontextmenu]","preventDefault","img[no-copy=\"true\"]",".viewer-container","document.onmousedown","mousedown",".trackContainer",".fancybox-container","null","uxGuid","killads","true","www3.doubleclick.net","PASSER_videoPAS_apres","0","ads_enabled","adsbygoogle","AdBlocker","load","adblock","pro-modal","doubleclick","googlesyndication","length:10",".getState();","4500","holidAds","detectAdBlock","noopFunc","String.prototype.endsWith","condition","/edit","Storage.prototype.setItem","json:\"DWEB\"","DWEB_PIN_IMAGE_CLICK_COUNT","json:\"\"","unauthDownloadCount","blur","ThriveGlobal","blazemedia_adBlock","copy","addLink","_sp_","check","100","document.getElementById","advert-tester","nebula.session.flags.adblock","undefined","document.oncopy","_adBlockCheck","navigator.storage.estimate","abde","ads","2000","/^(?:contextmenu|copy|selectstart)$/","/^(?:contextmenu|copy)$/","/^(?:contextmenu|keydown)$/","onbeforeunload","valid_user","Drupal.behaviors.detectAdblockers","scan","500","oncopy","jQuery","AdBlock","#sign-up-popup","/,\"category_sensitive\"[^\\n]+?\"follow_button\":\\{\"__typename\":\"CometFeedStoryFollowButtonStrategy\"[^\\n]+\"cursor\":\"[^\"]+\"\\}/g","}","/api/graphql","require.0.3.0.__bbox.define.[].2.is_linkshim_supported require.0.3.0.__bbox.define.[].2.click_ids","overlay","adBlockDetected","ADBdetected","onload_popup","8000","_sp_._networkListenerData","onselectstart","stay","ad-blocker",".ab_detected","document.ondragstart","disableEnterKey","adMessage","tweaker","$adframe","false","BIA.ADBLOCKER","Adblocker","10000","()","samDetected","4000","ABDSettings","adBlockFunction","block","hidekeep","checkAds","google_jobrunner","#advert-tracker","3000","disable_copy","disable_hot_keys","alert","oncontextmenu|oncopy|ondragstart|onselect|onselectstart","body","isAdblockDisabled","1000","clickIE","checkPrivacyWall","loadOutbrain","intsFequencyCap","w3ad","oncontextmenu|ondragstart|onselectstart","killCopy","oncontextmenu|ondragstart|onselectstart|onkeydown","restriction","adsAreShown","1500","bioEp.showPopup","/^(?:contextmenu|copy|keydown)$/","Date.prototype.toUTCString","abd","innerHTML","intializemarquee","oSpPOptions","oncontextmenu|onselectstart|ondragstart","detector_active","aoezone_adchecker","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart","message","preventSelection","fuckAdBlock","pageService.initDownloadProtection","mouseout","pop","oncontextmenu|onselectstart|onselect|oncopy","Drupal","a1lck","adsBlocked","/^(?:keyup|keydown)$/","detectPrivateMode","webkitRequestFileSystem","addLinkToCopy","_sharedData.is_whitelisted_crawl_bot","showOverlay","NoAd","killcopy","loginModal","stopPrntScr","700","document.documentElement.oncopy","oncontextmenu|onkeydown|onmousedown","ads_not_blocked","disable_in_input","disable_keystrokes","can_i_run_ads","__cmpGdprAppliesGlobally","/contextmenu|keydown|keyup|copy/","stopSelect","warning","ytInitialPlayerResponse.auxiliaryUi.messageRenderers.upsellDialogRenderer","auxiliaryUi.messageRenderers.upsellDialogRenderer","visibilitychange","/bgmobile|\\{\\w\\.\\w+\\(\\)\\}|\\.getVisibilityState\\(\\)/","document.visibilityState","json:\"visible\"","hideBannerBlockedMessage","__ext_loaded","slideout","faq/whitelist","_sp_.mms.startMsg","blurred","height","document.getElementsByTagName","RL.licenseman.init","abStyle","modal","eval","offsetHeight","ga_ExitPopup3339","t.preventDefault","ai_adb","none","replaceCopiedText","oncontextmenu|onselectstart|ondragstart|oncopy|oncut|onpaste|onbeforecopy","ABD","ondragstart","better_ads_adblock","onselectstart|ondragstart","console.debug","addEventListener","which","window.addEventListener","ctrlKey","/^(contextmenu|copy|dragstart|selectstart)$/","alerte_declanchee","initimg","oncontextmenu|onCopy","adBlock","oncontextmenu|onmousedown|onselectstart","appendMessage","document.body.setAttribute","5000","vSiteRefresher","popup","banner","/contextmenu|selectstart|copy/","oncontextmenu|ondragstart|onselectstart|onkeydown|onmousedown","oncontextmenu|onkeydown","onkeydown","adtoniq","ondragstart|onselectstart","/contextmenu|copy|keydown/","/contextmenu|select|copy/","/^(contextmenu|keydown)$/","a","adblocker","exit_popup","adsEnabled","locdau","show","ondrop|ondragstart","onload","onselectstart|ondragstart|oncontextmenu","div.story_text","document.body.oncopy","test.remove","oncontextmenu|ondragstart","mouseleave","noscroll","onmousemove|ondragstart|onselectstart|oncontextmenu","/contextmenu|selectstart/","ai_check","bait","onselectstart|ondragstart|onmousedown|onkeydown|oncontextmenu","window.SteadyWidgetSettings.adblockActive","adblockerdetected","juicyads","gdpr_popin_path","showEmailNewsletterModal","generatePopup","dragstart|keydown/","/contextmenu|keydown|dragstart/","oncontextmenu|onselectstart|ondragstart|onclick","btoa","_0x","f12lock","debugger","checkFeed","visibility","style","div#novelBoby","HTMLIFrameElement","FuckAdBlock","samOverlay","adStillHere","tjQuery","oncontextmenu|onMouseDown|style","/^(?:contextmenu|copy|keydown|mousedown)$/","document.onkeyup","commonUtil.openToast","adb","/contextmenu|keydown/","NS_TVER_EQ.checkEndEQ","nd_shtml","canRunAds","Adblock","isNaN","mps._queue.abdetect","contribute","devtoolschange","/contextmenu|copy/","ondragstart|oncontextmenu","clickNS","mdp","setTimeout","newsletterPopup","onContextMenu","premium","onkeydown|oncontextmenu","oncontextmenu|oncopy","abp","/contextmenu|cut|copy|paste/","oncontextmenu|onselectstart|style","#body_game","blocked","blocker","SignUPPopup_load","oncontextmenu|onselectstart|onselect|ondragstart|ondrag","removeChild","_0xfff1","event","stopPropagation","/contextmenu|mousedown/",".modal","soclInit","Zord.analytics.registerBeforeLeaveEvent","myModal","an_message",".height","admrlWpJsonP","oncopy|oncontextmenu|onselectstart|onselect|ondragstart|ondrag|onbeforeprint|onafterprint","document.onclick","document.onkeypress","disable_ext_code","/contextmenu|copy|selectstart/","adsbygoogle.length","oncontextmenu|onDragStart|onSelectStart","x5engine.utils.imCodeProtection","pipaId","oncontextmenu|ondragstart|onselectstart|onkeydown|oncopy|oncut","0x","matchMedia","shortcut","append_link","/^(?:contextmenu|dragstart|selectstart)$/","ai_front","ansFrontendGlobals.settings.signupWallType","journeyCompilerGateway","pgblck","/dragstart|keyup|keydown/","/keyup|keydown/","wpcc","oncopy|oncontextmenu","document.documentElement.AdBlockDetection","oncontextmenu|ondragstart|oncopy|oncut",".select-none","carbonLoaded","/contextmenu|cut|copy|keydown/","initAdBlockerPanel","/contextmenu|selectstart|copy|dragstart/","cpp_loc","String.prototype.charCodeAt","ai_","forceRefresh","head","/copy|dragstart/","/copy|contextmenu/","/getScript|error:/","error","nocontextmenu","AdB","oncontextmenu|ondragstart|onselectstart|onselect|oncopy|onbeforecopy|onkeydown|onunload","selectionchange","quill.emitter","oncontextmenu|onDragStart|onselectstart","/contextmenu|selectstart|select|copy|dragstart/","adLazy","_0x1a4c","jQuery!==\"undefined\"","clearInterval(loginReady)","document.body.onmouseup","addCopyright","selectstart","&adslot","copy_div_id","oncontextmenu|onkeydown|onselectstart","LBF.define","oncopy|oncontextmenu|oncut|onpaste","input","oncontextmenu|oncopy|onselectstart","onbeforecopy|oncontextmenu|oncopy|ondragstart|onmouseup|onselect|onselectstart","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|style","SD_BLOCKTHROUGH","body[style=\"user-select: none;\"]","cookie","/^(?:copy|paste)$/","b2a","/copy|keydown/","ab","oncopy|oncut|onselectstart|style|unselectable","document.body.oncut","/copy|cut|selectstart/","oncontextmenu|onselectstart|oncut|oncopy","oncontextmenu|ondragstart|onselect","encodeURIComponent","inlineScript","debugchange","donation-modal","isMoz","onpaste","#tr_mesaj > td > .text-input.validate\\[required\\]","Delay","/keydown|keyup/","keyCode","disabledEvent","/copy|cut|paste|selectstart/","/contextmenu|dragstart|keydown/","event.dispatch.apply","document.querySelector","beforepaste","gif","DOMContentLoaded","rprw","\"input\"","contentprotector","mb.advertisingShouldBeEnabled","update_visit_count","replace","test","Promise","onscroll","5500","login","showAdblockerModal","dfgh-adsbygoogle","oncontextmenu|ondragstart|ondrop|onselectstart","[oncontextmenu]","jsData.hasVideoMeteringUnlogEnabled","lepopup_abd_enabled","広告","devtoolIsOpening","document.referer","pagelink","Object.prototype.preroll","[]","/keydown|mousedown/","Drupal.CTools.Modal.show","/(^(?!.*(injectedScript|makeProxy).*))/","#VdoPlayerDiv","a#download_link","Object.prototype.bgOverlay","Object.prototype.fixedContentPos","html","console.dir","navigator.userAgent","quoty-public","oncontextmenu|ondragstart|onkeydown|onmousedown|onselectstart|onselect|oncopy|onbeforecopy|onmouseup","onContextmenu|onMouseDown|onSelectStart","kan_vars.adblock","securityTool.disableRightClick","securityTool.disableF12","securityTool.disableCtrlP","securityTool.disableCtrlS","securityTool.disablePrintScreen","securityTool.disablePrintThisPage","securityTool.disableElementForPrintThisPage","document.body.oncontextmenu","attachToDom","ad-fallback","document.createElement","createAdblockFallbackSubscribeToProtopageAdDiv","gnt_mol_oy","adsok","runPageBugger","Source","length","nouplaod","img[oncontextmenu=\"return false;\"]","Object","/(?=^(?!.*(jquery|inlineScript)))/","ab_tests","scribd_ad","admiral","/contextmenu|copy|drag|dragstart/","userAgent","analytics",".entry-content","wccp_pro","clear_body_at_all_for_extentions","RegExp","googlebot","document.querySelectorAll","/contextmenu|keydown|keypress|copy/","blockFuckingEverything","build.js","openLayer","sneakerGoogleTag","devtools","/_0x|devtools/","flashvars.autoplay","popupScreen","checkAdblockBait","dispatch","onclick","[onclick=\"myFunction()\"]","navigator","setInterval","stateObject","wccp_pro_iscontenteditable","devtool","return\"undefined\"","ready","3","document.body.onselectstart","debug","disabledKeys","Time_Start","i--","0.02","/hotjar|googletagmanager/","Clipboard","0.001","ad","detect","DD","Object.prototype._detectLoop","_detectLoop","AudiosL10n","forbiddenList","concertAds","whetherdo","devtoolsDetector.addListener","String.fromCharCode","Premium","SteadyWidgetSettings.adblockActive","devtoolsOpen","phimv","||null","DisDevTool","preventDeleteDialog","/googlesyndication|googletag/","googletag","openOverlaySignup","count","/contextmenu|keyup|keydown/","initials.layout.layoutPromoProps.promoMessagesWrapperProps.shouldDisplayAdblockMessage","mtGlobal.disabledAds","devtoolsDetector.launch","/DevTools|_0x/","throwFunc","ANN.ads.adblocked","cloudflareinsights.com","pleaseSupportUs","nn_mpu1","maxUnauthenicatedArticleViews","googletag.cmd","rocket-DOMContentLoaded","bind(document)","innerHeight","[oncontextmenu=\"return false;\"]","/^(contextmenu|mousedown|keydown)$/","placeAdsHandler","hmwp_is_devtool","mensagem","ramp.addUnits","pqdxwidthqt","browser-plugin","nitroAds.loaded","checkDevTools","DevToolsOpen","ABB_config","jh_disabled_options_data","/select|copy|contextmenu/","topMessage","/cut|copy|paste|contextmenu/","forbidDebug","2","RegExp.prototype.toString",".join(\"\")","DisableDevtool","Function.prototype.constructor","\"debugger\"","abort","/isEnable|isOpen/","oncontextmenu|ondragstart|onselectstart|onload|onblur","nitroAds","afterKeydown","void","getComputedStyle","viewClickAttributeId","ad-wrap","oncopy|oncut","__NEXT_DATA__.props.pageProps.adPlacements","/contextmenu|selectstart|dragstart/","loadexternal","login_completed","disableclick","disableRightClick","layerid","1","/,\"expanded_url\":\"([^\"]+)\",\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"url\":\"$1\"","/graphql","/,\"expanded_url\":\"([^\"]+)\",\"indices\":([^\"]+)\"url\":\"[^\"]+\"/g",",\"expanded_url\":\"$1\",\"indices\":$2\"url\":\"$1\"","/tweet-result","style.display","clipboardData","console","/Timeout\":\\d+/","Timeout\":0","/api/v","html[onselectstart]","linkPrefixMessage","adb-enabled","/mainseto.js:286:1","Array.prototype.includes","visitor-gate",".LoginSection","document.getSelection","detect_modal","ays_tooltip","disableCTRL","/adsbygoogle|ad-manager/","/devtool|console\\.clear/","Object.prototype.disableMenu","confirm","counter","oncontextmenu|oncopy|oncut","[id^=\"chapter\"]",".html","RegExp.prototype.test","\"contact@foxteller.com\"","onselectstart|oncopy","json:\"freeVideoFriendly\"","freeVideoFriendlySlug","(!0)","HTMLImageElement.prototype.onerror","player.pause","/stackDepth:(9|10).+https:[./0-9a-z]+\\/video\\.[0-9a-f]+\\.js:1\\d{2}:1.+\\.emit/","PieScriptConfig","method:HEAD","location.href","function(t)","ad_blocker_detector_modal","clientHeight","String.prototype.trim","iframe","nonframe","Object.prototype.dbskrat","show_modal","href","[href*=\"ad.adverticum.net\"]","showFbPopup","FbExit","navigator.registerProtocolHandler","mailto","e","data.page_content.slot_widgets","123===i","ad-block","typeof loadElement","json:\"header\"","/^[A-Za-z]{12}$/","/^data:text\\/javascript/","ad_allowed","e=>e-1",".abort();"];
    const $scriptletArglists$ = /* 823 */ "0,0;1,1,2;0,3;2,4;3,5;2,6;1,7;4,6;5,8;2,8;2,7;0,9;2,10;2,11;4,12;1,1,13;1,14,15;4,16;4,11;1,17;6,18,19;1,20,13;0,21,22,23,24;0,25,26;0,25,27;6,28,29;6,30,29;6,31,29;0,25,32;0,33,34;0,13,35;5,36,37,38;5,39,40,38;5,41,42,38;5,43,44,38;5,8,45,38;5,8,46,38;5,39,47,38;0,48,22,23,49;0,13,50,23,51;5,52,53;0,13,54;0,13,22,23,55;0,13,54,23,56;6,57,29;0,58,22,23,59;0,58,22,23,60;6,6,61;6,57,61;2,62;6,63,64;7,65;6,66,67;6,68,64;3,69;3,70;0,71,72;3,73;7,74;8,75,76;3,75;3,77,78;3,79;6,80,81;9,82,67,22,83,84;9,85,67,86,83,87;9,85,67,88,83,89;1,6;0,90;3,91;2,92;0,93;4,94;0,13;4,95;4,7;3,96,97;1,98,99;6,100,101;1,102;2,94;6,103,64;6,104,101;2,105;3,106,107;0,108;0,109,54;0,110;2,111;6,112,64;6,113,81;3,114,115;5,116;1,117,118;1,117,119;10,120,121,122;11,123;1,117,124;6,11,81;4,125;6,126,81;3,127,128;2,129;5,130,22,131;1,98,132;1,98,133;4,134;4,135;4,136;1,117,137;4,138;6,72,139;6,140,139;3,141,142;1,117,101;3,143,107;6,144,64;3,143,145;1,117,106;2,146;6,147,29;1,98,148;4,149;6,150,29;4,146;6,151,64;3,152,115;3,143,153;4,154;4,155;1,20,156;5,157,158,38;6,159,64;3,143,160;4,161;6,162,81;4,163;2,164;3,165;5,166;1,134,6;6,12,81;4,167;5,168;1,117,24;1,98,101;1,117,169;6,170,64;3,143,171;3,172;0,173;2,174;2,57;5,130;6,175,139;3,176;4,177;2,178;1,6,7;5,179;6,180,64;6,181,64;5,182;1,183,161;1,184;2,185;6,186,81;1,117,13;0,187,188;5,189;1,117,190;4,102;2,191;3,192;4,17;0,193;2,134;6,194,81;6,195,101;6,69,61;1,1,90;4,196;6,197,64;3,198;3,199,128;1,15,200;3,201,115;4,202;3,143,203;2,204;5,205;0,25;6,206,64;0,25,207;4,208;1,1,71;0,25,54;2,209;2,210;0,211;4,212;3,213;6,214,101;11,215;0,216,217;12,218,219;6,220,64;3,221;2,14;3,222;3,223;2,224;6,225,139;13,226;1,227,61;2,228;4,15;0,93,10;2,229;3,230;1,231,175;3,232;2,233;0,22,234;1,117,235;3,72;1,98,236;0,93,237;5,238;2,17;4,239;1,1,101;4,240;6,241,67;2,156;5,242;5,8,158,38;1,20;1,6,32;6,243,29;1,244,245;1,246,247;0,248;3,158;2,249;4,250;5,251;6,252,139;5,253;3,61;2,239;0,22,106;3,254;2,255;3,143,256;2,125;3,257;3,258;1,98,259;0,260;5,261;5,262;5,263;2,264;5,265;0,266;7,75;8,75;0,267;0,268;6,6,101;1,117,155;2,154;0,13,269;3,270;3,271,142;6,272,64;2,273;3,274;5,275;1,276;5,277,278,38;2,279;3,280;5,281;0,282;1,1,232;3,283,153;3,69,256;5,284,158;0,285;1,11;3,151;1,117,286;5,8,158;1,98,72;1,276,13;3,287;1,134;1,1,93;5,288,158;6,241,61;6,289,139;1,98,290;1,1,291;4,292;1,1,293;4,294;14,8;0,295;0,296;5,297;1,1,298;5,39;0,22,299;6,300,139;13,301;3,302,160;13,303,160;2,276;5,304,305,131;0,93,54;6,7,61;2,306;6,28,101;0,22,264;4,307;6,125,139;3,308;3,309;2,310;5,311;0,312;2,155;6,313,61;6,134,61;6,314,61;3,315;0,316;6,317,29;1,11,15;2,318;2,319;1,1,320;1,231,321;6,322,61;1,20,323;0,324;0,325;5,326;2,327;3,232,97;0,22,328;1,244,247;1,329,330;5,331,158;6,185,29;3,125;3,332;5,333,158;5,334;6,335,139;0,336;5,337,338;3,339,160;3,340;4,14;3,341,256;6,17,81;5,342,158;1,57;13,343;5,166,158;2,344;1,345,346;6,10,101;0,347;3,348,160;1,349;3,350,153;3,351,153;1,20,54;3,352,115;4,276;1,1,353;6,17,61;5,41,158;2,354;2,102;3,299;6,28,81;6,6,81;0,187;5,355,158;13,230;2,356;2,357;2,135;1,154;1,155;4,358;1,117,93;5,39,158;0,359;1,244,360;5,361;1,96,301;13,299;6,362,61;3,363,67;1,20,7;5,364;0,22,365;1,366;2,367;1,1,118;2,368;1,1,252;0,369;4,370;6,371,101;4,372;3,373;4,357;0,109;1,117,25;0,374;0,375,376;6,276,61;5,377,158;6,378,81;4,354;5,379,380,131;2,381;0,382;6,134,81;6,57,81;6,7,81;2,383;1,117,8;0,22,101;0,384;2,385;1,386,387;1,117,54;3,388;3,188;3,106;3,389;4,57;6,14,29;0,390;0,391;1,1,392;6,6,22;6,7,22;6,17,22;6,57,22;6,356,22;1,244,25;0,393;0,48;2,394;0,22,395;5,396;0,397,398;5,399;0,400;0,71,401;1,394;2,402;0,93,403;13,404;4,279;6,405,61;2,406;0,407;3,408;2,409;5,410,158;2,411;5,412,413;5,414;5,415;5,416,158;6,102,61;6,417,64;13,232;5,304,418,131;6,17,29;3,301;1,98,419;0,420,101;13,69;3,387;2,421;0,422;6,423,139;6,319,64;5,424,158,131;6,425,61;6,279,61;0,426;4,96;5,427;5,428;15,429,430;2,431;6,31,81;3,432;1,98,433;6,357,61;5,434,435;5,410;3,436;0,437,438;1,28;0,25,439;0,440;1,8,25;2,18;0,441,442;1,6,394;1,7,14;14,154;2,12;1,443,72;0,444;0,22,438;8,445;0,446,447;1,1,448;1,117,346;0,22,32;2,449;6,450,139;0,22,247;1,451;1,231,452;1,1,453;3,1;1,1,454;3,455,456;3,457,256;1,458;1,202;13,459;6,134,29;6,7,29;5,460,461,38;6,462,101;6,463,22;3,464;1,367;3,465,97;1,31,466;0,93,467;6,468,469;15,386,387;0,470;6,6,29;1,20,263;15,471,472;1,28,13;5,8,473;6,18,101;5,8,474,131;6,475,81;6,476,81;5,8,477;6,478,81;6,479,22;6,465,81;1,135;1,357;15,10,480;3,335;5,481;5,482;2,483;6,484,81;6,485,81;6,486,81;6,487,81;6,488,81;6,489,81;6,490,81;6,150,81;6,202,81;1,491;5,166,158,38;1,492,493;15,494,495;3,496;3,497;1,12;1,498;0,93,499;3,500,153;6,11,101;15,98,501;5,8,502,131;1,231,13;15,6;15,503,504;1,505;0,282,506;15,494,507;0,508;1,117,509;7,510;0,58,22,23,511;1,15;1,117,512;1,513;6,12,101;6,155,101;1,514,515;1,516,72;0,517;0,22,518;15,231,519;1,20,93;0,187,520;2,521;0,316,54;3,522;13,523;6,524,22;5,130,158;3,525;1,526;0,58,527;5,528,529;1,20,25;1,514,301;1,8;1,530,522;1,531,532;1,329,301;1,117,438;2,533;14,70;1,117,534;0,347,535;0,446,536;6,279,61,537;6,538,61,537;6,491,61,537;13,539;0,25,540;6,541,67;16,542,22,543;1,514,13;8,544;16,545,160,546;1,533;3,547;7,106;13,548;6,549,29;6,6,61,537;0,446,71;0,13,299;0,25,438;6,550,81;3,551;1,552;6,553,469;3,554;6,357,29;3,555;2,556;6,6,64;14,156;14,557;6,550,101;13,28;3,558;6,559,139;6,560,139;15,479,561;3,562;15,28;6,563,101;15,20,564;7,565;17;0,13,101;2,566;1,494,507;1,227,507;6,507,81;0,13,50;2,567;18,568;0,569;6,102,81;0,187,419;6,570,139;6,571,64;6,572,81;13,573;6,28,574;6,575,139;7,576;3,577;3,578,256;6,579,61;0,446,106;13,106;2,580;0,581,582;0,187,583;5,8,584;0,585,54;6,586,81;13,18;1,117,587;4,588;6,589,81;14,301;6,590,139;0,393,591;6,592,64;2,593;13,594;3,534;4,595;6,596,61;3,69,107;2,538;0,597;6,598,81;0,599;5,281,22,38;6,600,81;6,72,601;1,602,603;13,534;6,604,81;19,605,606,607;15,454,608;5,609;2,610;0,58,101,23,158;0,611;0,25,612;0,93,612;13,613;18,614;8,106;0,71,615;5,616;6,617,101;0,618;16,619,160;6,620,64;1,57,621;1,514,622;17,623,624;2,307;10,625,626,627;10,628,629,630;0,93,22,23,51;0,446,631;0,93,632;1,514,633;10,634,635,636;5,130,637;0,216,527;0,93,638;3,639;15,1,640;9,641,67,101,83,642;3,643;15,644,430;3,645;1,244,646;1,17,647;7,648;13,649;6,650,139;6,651,81;16,652,160,546;5,653,654,38;0,397,655;19,656,657,607;5,414,158,38;5,658,158,38;0,13,535;9,85,67,659,83,660;16;3,661,128;1,6,54;6,662,101;15,663,664;2,665;7,69;7,666;1,156,667;0,58,668;3,669;3,670;20,671,672,673;6,674,64;6,675,81;5,304,158,131;5,676,677;1,494,329;0,282,678;3,679,153;9,680,67,81,83,681;13,682,160;11,683;0,25,684;3,685;3,686;9,98,67,687,83,688;1,20,54,689;6,690,64;18,691;3,692,160";
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
