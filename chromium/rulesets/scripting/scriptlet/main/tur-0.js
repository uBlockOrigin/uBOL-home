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

// ruleset: tur-0

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets() {

/******************************************************************************/

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

function m3uPrune(
    m3uPattern = '',
    urlPattern = ''
) {
    if ( typeof m3uPattern !== 'string' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('m3u-prune', m3uPattern, urlPattern);
    const toLog = [];
    const regexFromArg = arg => {
        if ( arg === '' ) { return /^/; }
        const match = /^\/(.+)\/([gms]*)$/.exec(arg);
        if ( match !== null ) {
            let flags = match[2] || '';
            if ( flags.includes('m') ) { flags += 's'; }
            return new RegExp(match[1], flags);
        }
        return new RegExp(
            arg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*+/g, '.*?')
        );
    };
    const reM3u = regexFromArg(m3uPattern);
    const reUrl = regexFromArg(urlPattern);
    const pruneSpliceoutBlock = (lines, i) => {
        if ( lines[i].startsWith('#EXT-X-CUE:TYPE="SpliceOut"') === false ) {
            return false;
        }
        toLog.push(`\t${lines[i]}`);
        lines[i] = undefined; i += 1;
        if ( lines[i].startsWith('#EXT-X-ASSET:CAID') ) {
            toLog.push(`\t${lines[i]}`);
            lines[i] = undefined; i += 1;
        }
        if ( lines[i].startsWith('#EXT-X-SCTE35:') ) {
            toLog.push(`\t${lines[i]}`);
            lines[i] = undefined; i += 1;
        }
        if ( lines[i].startsWith('#EXT-X-CUE-IN') ) {
            toLog.push(`\t${lines[i]}`);
            lines[i] = undefined; i += 1;
        }
        if ( lines[i].startsWith('#EXT-X-SCTE35:') ) {
            toLog.push(`\t${lines[i]}`);
            lines[i] = undefined; i += 1;
        }
        return true;
    };
    const pruneInfBlock = (lines, i) => {
        if ( lines[i].startsWith('#EXTINF') === false ) { return false; }
        if ( reM3u.test(lines[i+1]) === false ) { return false; }
        toLog.push('Discarding', `\t${lines[i]}, \t${lines[i+1]}`);
        lines[i] = lines[i+1] = undefined; i += 2;
        if ( lines[i].startsWith('#EXT-X-DISCONTINUITY') ) {
            toLog.push(`\t${lines[i]}`);
            lines[i] = undefined; i += 1;
        }
        return true;
    };
    const pruner = text => {
        if ( (/^\s*#EXTM3U/.test(text)) === false ) { return text; }
        if ( m3uPattern === '' ) {
            safe.uboLog(` Content:\n${text}`);
            return text;
        }
        if ( reM3u.multiline ) {
            reM3u.lastIndex = 0;
            for (;;) {
                const match = reM3u.exec(text);
                if ( match === null ) { break; }
                let discard = match[0];
                let before = text.slice(0, match.index);
                if (
                    /^[\n\r]+/.test(discard) === false &&
                    /[\n\r]+$/.test(before) === false
                ) {
                    const startOfLine = /[^\n\r]+$/.exec(before);
                    if ( startOfLine !== null ) {
                        before = before.slice(0, startOfLine.index);
                        discard = startOfLine[0] + discard;
                    }
                }
                let after = text.slice(match.index + match[0].length);
                if (
                    /[\n\r]+$/.test(discard) === false &&
                    /^[\n\r]+/.test(after) === false
                ) {
                    const endOfLine = /^[^\n\r]+/.exec(after);
                    if ( endOfLine !== null ) {
                        after = after.slice(endOfLine.index);
                        discard += discard + endOfLine[0];
                    }
                }
                text = before.trim() + '\n' + after.trim();
                reM3u.lastIndex = before.length + 1;
                toLog.push('Discarding', ...safe.String_split.call(discard, /\n+/).map(s => `\t${s}`));
                if ( reM3u.global === false ) { break; }
            }
            return text;
        }
        const lines = safe.String_split.call(text, /\n\r|\n|\r/);
        for ( let i = 0; i < lines.length; i++ ) {
            if ( lines[i] === undefined ) { continue; }
            if ( pruneSpliceoutBlock(lines, i) ) { continue; }
            if ( pruneInfBlock(lines, i) ) { continue; }
        }
        return lines.filter(l => l !== undefined).join('\n');
    };
    const urlFromArg = arg => {
        if ( typeof arg === 'string' ) { return arg; }
        if ( arg instanceof Request ) { return arg.url; }
        return String(arg);
    };
    proxyApplyFn('fetch', async function fetch(context) {
        const args = context.callArgs;
        const fetchPromise = context.reflect();
        if ( reUrl.test(urlFromArg(args[0])) === false ) { return fetchPromise; }
        const responseBefore = await fetchPromise;
        const responseClone = responseBefore.clone();
        const textBefore = await responseClone.text();
        const textAfter = pruner(textBefore);
        if ( textAfter === textBefore ) { return responseBefore; }
        const responseAfter = new Response(textAfter, {
            status: responseBefore.status,
            statusText: responseBefore.statusText,
            headers: responseBefore.headers,
        });
        Object.defineProperties(responseAfter, {
            url: { value: responseBefore.url },
            type: { value: responseBefore.type },
        });
        if ( toLog.length !== 0 ) {
            toLog.unshift(logPrefix);
            safe.uboLog(toLog.join('\n'));
        }
        return responseAfter;
    })
    self.XMLHttpRequest.prototype.open = new Proxy(self.XMLHttpRequest.prototype.open, {
        apply: async (target, thisArg, args) => {
            if ( reUrl.test(urlFromArg(args[1])) === false ) {
                return Reflect.apply(target, thisArg, args);
            }
            thisArg.addEventListener('readystatechange', function() {
                if ( thisArg.readyState !== 4 ) { return; }
                const type = thisArg.responseType;
                if ( type !== '' && type !== 'text' ) { return; }
                const textin = thisArg.responseText;
                const textout = pruner(textin);
                if ( textout === textin ) { return; }
                Object.defineProperty(thisArg, 'response', { value: textout });
                Object.defineProperty(thisArg, 'responseText', { value: textout });
                if ( toLog.length !== 0 ) {
                    toLog.unshift(logPrefix);
                    safe.uboLog(toLog.join('\n'));
                }
            });
            return Reflect.apply(target, thisArg, args);
        }
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
        const matchesType = safe.RegExp_test(reType, type);
        const matchesHandler = safe.RegExp_test(rePattern, handler);
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
    behavior = '',
    ...varargs
) {
    if ( typeof rawToken !== 'string' ) { return; }
    if ( rawToken === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('remove-attr',
        rawToken, rawSelector, behavior, ...varargs
    );
    const tokens = safe.String_split.call(rawToken, /\s*\|\s*/);
    const selector = tokens.map(a => {
        const b = CSS.escape(a);
        return rawSelector.includes(`[${b}]`) ? rawSelector : `${rawSelector}[${b}]`;
    }).join(',');
    const lazily = /\basap\b/.test(behavior) === false;
    const options = safe.parseVarargs(varargs);
    if ( safe.logLevel > 1 ) {
        safe.uboLog(logPrefix, `Target selector:\n\t${selector}`);
    }
    const rmattrFromNode = node => {
        for ( const attr of tokens ) {
            if ( node.hasAttribute(attr) === false ) { continue; }
            node.removeAttribute(attr);
            safe.uboLog(logPrefix, `Removed attribute '${attr}'`);
        }
    };
    const rmattr = nodes => {
        for ( const node of nodes ?? document.querySelectorAll(selector) ) {
            rmattrFromNode(node);
        }
    };
    const rmAttrLazily = ( ) => {
        if ( rmAttrLazily.timer !== undefined ) { return; }
        rmAttrLazily.timer = onIdleFn(( ) => {
            rmAttrLazily.timer = undefined;
            rmattr();
        }, { timeout: 17 });
    };
    const mutationHandler = mutations => {
        for ( const { addedNodes, removedNodes } of mutations ) {
            for ( const node of addedNodes ) {
                if ( node.nodeType !== 1 ) { continue; }
                if ( lazily ) { return rmAttrLazily(); }
                if ( node.matches(selector) ) {
                    rmattrFromNode(node);
                }
                if ( node.childElementCount ) {
                    rmattr(node.querySelectorAll(selector));
                }
            }
            if ( lazily ) { return; }
            for ( const node of removedNodes ) {
                if ( node.nodeType !== 1 ) { continue; }
                if ( node.matches(selector) ) {
                    rmattrFromNode(node);
                }
            }
        }
    };
    const stop = ( ) => {
        if ( start.observer ) {
            start.observer.disconnect();
            start.observer = undefined;
        }
        if ( rmAttrLazily.timer ) {
            offIdleFn(rmAttrLazily.timer);
            rmAttrLazily.timer = undefined;
        }
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Quitting');
        }
    };
    const start = ( ) => {
        rmattr();
        if ( /\bstay\b/.test(behavior) === false ) {
            if ( options.quitAfter === undefined ) { return; }
        }
        start.observer = new MutationObserver(mutationHandler);
        start.observer.observe(document, {
            attributes: true,
            attributeFilter: tokens,
            childList: true,
            subtree: true,
        });
        if ( options.quitAfter ) {
            runAt(( ) => {
                self.setTimeout(stop, options.quitAfter * 1000);
            }, 'load');
        }
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

function zeta_j7s0f4ys() { // google-ima.js
'use strict';





if (!window.google || !window.google.ima || !window.google.ima.VERSION) {
  const VERSION = "3.764.0";
  const ima = {};

  class AdDisplayContainer {
    constructor(containerElement) {
      const divElement = document.createElement("div");
      divElement.style.setProperty("display", "none", "important");
      divElement.style.setProperty("visibility", "collapse", "important");
      containerElement.appendChild(divElement);
    }
    destroy() {}
    initialize() {}
  }

  class ImaSdkSettings {
    constructor() {
      this.c = true;
      this.f = {};
      this.i = false;
      this.l = "";
      this.p = "";
      this.r = 0;
      this.t = "";
      this.v = "";
    }
    getCompanionBackfill() {}
    getDisableCustomPlaybackForIOS10Plus() {
      return this.i;
    }
    getFeatureFlags() {
      return this.f;
    }
    getLocale() {
      return this.l;
    }
    getNumRedirects() {
      return this.r;
    }
    getPlayerType() {
      return this.t;
    }
    getPlayerVersion() {
      return this.v;
    }
    getPpid() {
      return this.p;
    }
    isCookiesEnabled() {
      return this.c;
    }
    setAutoPlayAdBreaks() {}
    setCompanionBackfill() {}
    setCookiesEnabled(c) {
      this.c = !!c;
    }
    setDisableCustomPlaybackForIOS10Plus(i) {
      this.i = !!i;
    }
    setFeatureFlags(f) {
      this.f = f;
    }
    setLocale(l) {
      this.l = l;
    }
    setNumRedirects(r) {
      this.r = r;
    }
    setPlayerType(t) {
      this.t = t;
    }
    setPlayerVersion(v) {
      this.v = v;
    }
    setPpid(p) {
      this.p = p;
    }
    setSessionId() {}
    setVpaidAllowed() {}
    setVpaidMode() {}

    // https://github.com/uBlockOrigin/uBlock-issues/issues/2265#issuecomment-1637094149
    getDisableFlashAds() {
    }
    setDisableFlashAds() {
    }
  }
  ImaSdkSettings.CompanionBackfillMode = {
    ALWAYS: "always",
    ON_MASTER_AD: "on_master_ad",
  };
  ImaSdkSettings.VpaidMode = {
    DISABLED: 0,
    ENABLED: 1,
    INSECURE: 2,
  };

  class EventHandler {
    constructor() {
      this.listeners = new Map();
    }

    _dispatch(e) {
      let listeners = this.listeners.get(e.type);
      listeners = listeners ? Array.from(listeners.values()) : [];
      for (const listener of listeners) {
        try {
          listener(e);
        } catch (r) {
          console.error(r);
        }
      }
    }

    addEventListener(types, c, options, context) {
      if (!Array.isArray(types)) {
        types = [types];
      }

      for (const t of types) {
        if (!this.listeners.has(t)) {
          this.listeners.set(t, new Map());
        }
        this.listeners.get(t).set(c, c.bind(context || this));
      }
    }

    removeEventListener(types, c) {
      if (!Array.isArray(types)) {
        types = [types];
      }

      for (const t of types) {
        const typeSet = this.listeners.get(t);
        if (typeSet) {
          typeSet.delete(c);
        }
      }
    }
  }

  class AdsLoader extends EventHandler {
    constructor() {
      super();
      this.settings = new ImaSdkSettings();
    }
    contentComplete() {}
    destroy() {}
    getSettings() {
      return this.settings;
    }
    getVersion() {
      return VERSION;
    }
    requestAds(_r, _c) {
      requestAnimationFrame(() => {
        const { ADS_MANAGER_LOADED } = AdsManagerLoadedEvent.Type;
        const event = new ima.AdsManagerLoadedEvent(ADS_MANAGER_LOADED, _r, _c);
        this._dispatch(event);
      });
      const error = new ima.AdError(
        "adPlayError",
        1205, 1205,
        "The browser prevented playback initiated without user interaction.",
        _r, _c
      );
      requestAnimationFrame( () => {
        this._dispatch(new ima.AdErrorEvent(error));
      });
    }
  }

  class AdsManager extends EventHandler {
    constructor() {
      super();
      this.volume = 1;
      this._enablePreloading = false;
    }
    collapse() {}
    configureAdsManager() {}
    destroy() {}
    discardAdBreak() {}
    expand() {}
    focus() {}
    getAdSkippableState() {
      return false;
    }
    getCuePoints() {
      return [0];
    }
    getCurrentAd() {
      return currentAd;
    }
    getCurrentAdCuePoints() {
      return [];
    }
    getRemainingTime() {
      return 0;
    }
    getVolume() {
      return this.volume;
    }
    init() {
      if (this._enablePreloading) {
        this._dispatch(new ima.AdEvent(AdEvent.Type.LOADED));
      }
    }
    isCustomClickTrackingUsed() {
      return false;
    }
    isCustomPlaybackUsed() {
      return false;
    }
    pause() {}
    requestNextAdBreak() {}
    resize() {}
    resume() {}
    setVolume(v) {
      this.volume = v;
    }
    skip() {}
    start() {
      requestAnimationFrame(() => {
        for (const type of [
          AdEvent.Type.LOADED,
          AdEvent.Type.STARTED,
          AdEvent.Type.CONTENT_PAUSE_REQUESTED,
          AdEvent.Type.AD_BUFFERING,
          AdEvent.Type.FIRST_QUARTILE,
          AdEvent.Type.MIDPOINT,
          AdEvent.Type.THIRD_QUARTILE,
          AdEvent.Type.COMPLETE,
          AdEvent.Type.ALL_ADS_COMPLETED,
          AdEvent.Type.CONTENT_RESUME_REQUESTED,
        ]) {
          try {
            this._dispatch(new ima.AdEvent(type));
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
    stop() {}
    updateAdsRenderingSettings() {}
  }

  class AdsRenderingSettings {}

  class AdsRequest {
    setAdWillAutoPlay() {}
    setAdWillPlayMuted() {}
    setContinuousPlayback() {}
  }

  class AdPodInfo {
    getAdPosition() {
      return 1;
    }
    getIsBumper() {
      return false;
    }
    getMaxDuration() {
      return -1;
    }
    getPodIndex() {
      return 1;
    }
    getTimeOffset() {
      return 0;
    }
    getTotalAds() {
      return 1;
    }
  }

  class Ad {
    constructor() {
      this._pi = new AdPodInfo();
    }
    getAdId() {
      return "";
    }
    getAdPodInfo() {
      return this._pi;
    }
    getAdSystem() {
      return "";
    }
    getAdvertiserName() {
      return "";
    }
    getApiFramework() {
      return null;
    }
    getCompanionAds() {
      return [];
    }
    getContentType() {
      return "";
    }
    getCreativeAdId() {
      return "";
    }
    getCreativeId() {
      return "";
    }
    getDealId() {
      return "";
    }
    getDescription() {
      return "";
    }
    getDuration() {
      return 8.5;
    }
    getHeight() {
      return 0;
    }
    getMediaUrl() {
      return null;
    }
    getMinSuggestedDuration() {
      return -2;
    }
    getSkipTimeOffset() {
      return -1;
    }
    getSurveyUrl() {
      return null;
    }
    getTitle() {
      return "";
    }
    getTraffickingParameters() {
      return {};
    }
    getTraffickingParametersString() {
      return "";
    }
    getUiElements() {
      return [""];
    }
    getUniversalAdIdRegistry() {
      return "unknown";
    }
    getUniversalAdIds() {
      return [new UniversalAdIdInfo()];
    }
    getUniversalAdIdValue() {
      return "unknown";
    }
    getVastMediaBitrate() {
      return 0;
    }
    getVastMediaHeight() {
      return 0;
    }
    getVastMediaWidth() {
      return 0;
    }
    getWidth() {
      return 0;
    }
    getWrapperAdIds() {
      return [""];
    }
    getWrapperAdSystems() {
      return [""];
    }
    getWrapperCreativeIds() {
      return [""];
    }
    isLinear() {
      return true;
    }
    isSkippable() {
      return true;
    }
  }

  class CompanionAd {
    getAdSlotId() {
      return "";
    }
    getContent() {
      return "";
    }
    getContentType() {
      return "";
    }
    getHeight() {
      return 1;
    }
    getWidth() {
      return 1;
    }
  }

  class AdError {
    constructor(type, code, vast, message, request, context) {
      this.errorCode = code;
      this.message = message;
      this.type = type;
      this.adsRequest = request;
      this.userRequestContext = context;
      this.vastErrorCode = vast;
    }
    getErrorCode() {
      return this.errorCode;
    }
    getInnerError() {
        return null;
    }
    getMessage() {
      return this.message;
    }
    getType() {
      return this.type;
    }
    getVastErrorCode() {
      return this.vastErrorCode;
    }
    toString() {
      return `AdError ${this.errorCode}: ${this.message}`;
    }
  }
  AdError.ErrorCode = {};
  AdError.Type = {};

  const isEngadget = () => {
    try {
      for (const ctx of Object.values(window.vidible._getContexts())) {
        const player = ctx.getPlayer();
        if (!player) { continue;}
        const div = player.div;
        if (!div) { continue; }
        if (div.innerHTML.includes("www.engadget.com")) {
          return true;
        }
      }
    } catch {
    }
    return false;
  };

  const currentAd = isEngadget() ? undefined : new Ad();

  class AdEvent {
    constructor(type) {
      this.type = type;
    }
    getAd() {
      return currentAd;
    }
    getAdData() {
      return {};
    }
  }
  AdEvent.Type = {
    AD_BREAK_READY: "adBreakReady",
    AD_BUFFERING: "adBuffering",
    AD_CAN_PLAY: "adCanPlay",
    AD_METADATA: "adMetadata",
    AD_PROGRESS: "adProgress",
    ALL_ADS_COMPLETED: "allAdsCompleted",
    CLICK: "click",
    COMPLETE: "complete",
    CONTENT_PAUSE_REQUESTED: "contentPauseRequested",
    CONTENT_RESUME_REQUESTED: "contentResumeRequested",
    DURATION_CHANGE: "durationChange",
    EXPANDED_CHANGED: "expandedChanged",
    FIRST_QUARTILE: "firstQuartile",
    IMPRESSION: "impression",
    INTERACTION: "interaction",
    LINEAR_CHANGE: "linearChange",
    LINEAR_CHANGED: "linearChanged",
    LOADED: "loaded",
    LOG: "log",
    MIDPOINT: "midpoint",
    PAUSED: "pause",
    RESUMED: "resume",
    SKIPPABLE_STATE_CHANGED: "skippableStateChanged",
    SKIPPED: "skip",
    STARTED: "start",
    THIRD_QUARTILE: "thirdQuartile",
    USER_CLOSE: "userClose",
    VIDEO_CLICKED: "videoClicked",
    VIDEO_ICON_CLICKED: "videoIconClicked",
    VIEWABLE_IMPRESSION: "viewable_impression",
    VOLUME_CHANGED: "volumeChange",
    VOLUME_MUTED: "mute",
  };

  class AdErrorEvent {
    constructor(error) {
      this.type = "adError";
      this.error = error;
    }
    getError() {
      return this.error;
    }
    getUserRequestContext() {
      return this.error?.userRequestContext || {};
    }
  }
  AdErrorEvent.Type = {
    AD_ERROR: "adError",
  };

  const manager = new AdsManager();

  class AdsManagerLoadedEvent {
    constructor(type, request, context) {
      this.type = type;
      this.adsRequest = request;
      this.userRequestContext = context;
    }
    getAdsManager(c, settings) {
      if (settings && settings.enablePreloading) {
        manager._enablePreloading = true;
      }
      return manager;
    }
    getUserRequestContext() {
      return this.userRequestContext || {};
    }
  }
  AdsManagerLoadedEvent.Type = {
    ADS_MANAGER_LOADED: "adsManagerLoaded",
  };

  class CustomContentLoadedEvent {}
  CustomContentLoadedEvent.Type = {
    CUSTOM_CONTENT_LOADED: "deprecated-event",
  };

  class CompanionAdSelectionSettings {}
  CompanionAdSelectionSettings.CreativeType = {
    ALL: "All",
    FLASH: "Flash",
    IMAGE: "Image",
  };
  CompanionAdSelectionSettings.ResourceType = {
    ALL: "All",
    HTML: "Html",
    IFRAME: "IFrame",
    STATIC: "Static",
  };
  CompanionAdSelectionSettings.SizeCriteria = {
    IGNORE: "IgnoreSize",
    SELECT_EXACT_MATCH: "SelectExactMatch",
    SELECT_NEAR_MATCH: "SelectNearMatch",
  };

  class AdCuePoints {
    getCuePoints() {
      return [];
    }
  }

  class AdProgressData {}

  class UniversalAdIdInfo {
    getAdIdRegistry() {
      return "";
    }
    getAdIdValue() {
      return "";
    }
  }

  Object.assign(ima, {
    AdCuePoints,
    AdDisplayContainer,
    AdError,
    AdErrorEvent,
    AdEvent,
    AdPodInfo,
    AdProgressData,
    AdsLoader,
    AdsManager: manager,
    AdsManagerLoadedEvent,
    AdsRenderingSettings,
    AdsRequest,
    CompanionAd,
    CompanionAdSelectionSettings,
    CustomContentLoadedEvent,
    gptProxyInstance: {},
    ImaSdkSettings,
    OmidAccessMode: {
      DOMAIN: "domain",
      FULL: "full",
      LIMITED: "limited",
    },
    OmidVerificationVendor: {
      1: "OTHER",
      2: "GOOGLE",
      GOOGLE: 2,
      OTHER: 1
    },
    settings: new ImaSdkSettings(),
    UiElements: {
      AD_ATTRIBUTION: "adAttribution",
      COUNTDOWN: "countdown",
    },
    UniversalAdIdInfo,
    VERSION,
    ViewMode: {
      FULLSCREEN: "fullscreen",
      NORMAL: "normal",
    },
  });

  if (!window.google) {
    window.google = {};
  }

  window.google.ima = ima;
}
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $hasHostnames$ = true;
const $hasEntities$ = true;
const $hasAncestors$ = false;
const $hasRegexes$ = true;

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
    const $scriptletHostnames$ = /* 1061 */ ["anizm.*","r10.net","anizle.*","diziyo.*","sinema.*","ag2m4.cfd","azbuz.org","dafflix.*","dizilla.*","dizimag.*","dizimov.*","dizipal.*","exxen.com","hdfilm.us","hisse.net","nedir.org","pages.dev","promy.pro","sinema.cx","sinepal.*","sporx.com","tabii.com","trstx.org","atv.com.tr","bikifi.com","dizicaps.*","dizimag.eu","dizipala.*","diziroll.*","diziyou.co","filmfc.com","filmhe.com","filmizle.*","filmjr.org","haber3.com","haber7.com","isgfrm.com","itemci.com","justintv.*","kanal7.com","kenttv.net","ntv.com.tr","ogznet.com","puhutv.com","shirl.club","sinefil.tv","tafdi3.com","tafdi4.com","teknop.net","tgyama.com","trfilm.net","tv8.com.tr","vidlax.xyz","volsex.com","yeppuu.com","zarize.com","animeler.me","contentx.me","diziall.com","dizifon.com","dizigom1.tv","dizikorea.*","dizillahd.*","dizipal.org","dizipia.com","dizirex.com","dizirix.net","diziwatch.*","diziyou.one","dmax.com.tr","duzcetv.com","efendim.xyz","filmcus.com","filmcus.org","filmcuss.cc","filmgo1.com","filmizle.cx","filmjr2.org","filmmodu.co","hboxcdn.xyz","hdfilmcix.*","hlktrpl.cfd","intekno.net","izlekolik.*","mangawt.com","miuitr.info","mixizle.com","osxinfo.net","otopark.com","pembetv18.*","puffytr.com","sierato.com","tranimaci.*","trhaber.com","trtizle.com","turkanime.*","vipifsa.com","zerotik.com","altporno.xyz","aspor.com.tr","cdnvexo.site","coinotag.com","cristal.guru","diziboxx.com","diziday1.com","dizigom.love","dizimax2.com","dizimore.com","dolufilm.org","dramaflix.cc","erotikgo.com","erotikgo.org","filmcusx.com","filmizletv.*","fullhdfilm.*","fullhdizle.*","izleorg3.org","izlesene.com","joymaxtr.com","karnaval.com","nowtv.com.tr","oyungibi.com","player01.cfd","playerzz.xyz","pllsfored.co","plusizle.com","sozcu.com.tr","teve2.com.tr","tlctv.com.tr","trendyol.com","turkaliz.com","turkanime.co","turkifsa.xyz","turkrock.com","tv8bucuk.com","tvboff10.com","tvboff11.com","tvboff12.com","tvboff13.com","tvboff14.com","tvboff15.com","tvboff16.com","tvboff17.com","tvboff18.com","tvboff19.com","tvboff20.com","ulker.com.tr","vidtekno.com","youizleo.sbs","zzerotik.com","720pizleme.cc","ahaber.com.tr","arrowizle.com","asyawatch.com","bingozade.com","bizimyaka.com","burdenfly.com","dipfilmizle.*","dizilla40.com","dizipaltv.net","diziyoutv.com","domplayer.org","ediziizle.com","efullizle.com","elzemfilm.org","erotikjam.com","filmizlemax.*","filmizletv1.*","filmmoduu.com","flatscher.net","fluffcore.com","genelpara.com","gsmturkey.net","guzelfilm.com","haberturk.com","hdfilmizle.in","hdnetflix.net","inceleriz.com","izlekolik.org","jetfilmizle.*","justin-tv.org","kanald.com.tr","korkuseli.com","mangaship.com","mangaship.net","maxfilmizle.*","mordefter.com","pornoanne.com","safirfilm.vip","showtv.com.tr","sinemaizle.co","sondakika.com","startv.com.tr","t24giris2.cfd","taraftarium.*","taratv41.shop","technopat.net","tekniknot.com","tranimaci.com","tranimeci.com","tranimeizle.*","turkifsa.porn","ulketv.com.tr","uzaymanga.com","vkfilmizlee.*","vkfilmizlet.*","yabancidizi.*","yeniizmir.com","youtubemp3.us","zeustv204.com","zeustv205.com","zeustv206.com","zeustv207.com","zeustv208.com","zeustv209.com","zeustv210.com","zeustv211.com","zeustv212.com","zeustv213.com","zeustv214.com","zeustv215.com","zeustv216.com","zeustv217.com","zeustv218.com","zeustv219.com","zeustv220.com","zeustv221.com","zeustv222.com","zeustv223.com","zeustv224.com","zeustv225.com","zeustv226.com","zeustv227.com","zeustv228.com","zeustv229.com","zeustv230.com","zeustv231.com","zeustv232.com","zeustv233.com","zeustv234.com","zeustv235.com","zeustv236.com","zeustv237.com","zeustv238.com","zeustv239.com","zeustv240.com","zeustv241.com","zeustv242.com","zeustv243.com","zeustv244.com","zeustv245.com","zeustv246.com","zeustv247.com","zeustv248.com","zeustv249.com","zeustv250.com","zeustv251.com","zeustv252.com","zeustv253.com","zeustv254.com","asfilmizle.com","bafrahaber.com","beyaztv.com.tr","dentalilan.com","dizipal12.site","dizipal13.site","dizipal14.site","dizipal15.site","dizipal16.site","dizipal17.site","dizipal19.site","dizipal21.site","dizipal22.site","dizipal23.site","dizipal24.site","dizipal25.site","dizipal26.site","dizipal27.site","dizipal28.site","dizipalx54.com","dizipalx55.com","dizipalx56.com","dizipalx57.com","dizipalx58.com","dizipalx59.com","dizipalx60.com","dizipalx61.com","dizipalx62.com","dizipalx63.com","dizipalx64.com","dizipalx65.com","dizipalx66.com","dizipalx67.com","dizipalx68.com","dizipalx69.com","dizipalx70.com","dizipalx71.com","dizipalx72.com","dizipalx73.com","eksisozluk.com","eldermanga.com","ensonhaber.com","epikplayer.xyz","erosfilmizle.*","erotikfimm.com","erotikhoot.com","filmizleplus.*","filmkuzusu.vip","filmzevkim.com","fullfilmizle.*","gecmisi.com.tr","geziforumu.com","hdfilmcixx.com","hdfilmizle.org","hdfilmsitesi.*","hdfreeizle.com","hdizleplus.com","hdmixfilim.com","justintvde.com","kaliteizle.com","kanalmaras.com","onlinedizi.sbs","ozgunbilgi.com","pandaspor.live","pornoizle9.icu","selcuksports.*","seyredeger.com","sinekolikk.com","sinemangoo.org","sinematurk.com","sinetiktok.com","sporcafe74.top","teknoistan.com","trgoals183.top","turkifsa1.porn","turkifsa2.porn","turkifsa3.porn","turkifsa4.porn","turkifsa5.porn","turkifsa6.porn","turkifsa7.porn","turkifsa8.porn","turkifsa9.porn","turkleak1.live","turkleak2.live","turkleak3.live","turkleak4.live","turkleak5.live","turkleak6.live","turkleak7.live","turkleak8.live","turkleak9.live","vegoltv981.com","videojs.online","videoplays.cfd","videoseyred.in","vizyon18tv.com","vkfilmizle.net","vknsorgula.net","webteizle3.xyz","webteizle4.xyz","webteizle5.xyz","webteizle6.xyz","webteizle7.xyz","webteizle8.xyz","webteizle9.xyz","yavuzfilmm.com","zerotiktok.com","aydinlik.com.tr","azginkizlar.com","bamfilmizle.com","betivotv156.com","betivotv157.com","betivotv158.com","betivotv159.com","betivotv160.com","betivotv161.com","betivotv162.com","betivotv163.com","betivotv164.com","betivotv165.com","betivotv166.com","birasyadizi.com","bloomberght.com","cehennemizle.cc","cimcime166.live","cizgivedizi.com","dizipal.website","dizipal3.com.tr","dizipal4.com.tr","dizipal5.com.tr","dizipal6.com.tr","dizipal7.com.tr","dizipal8.com.tr","dizipal9.com.tr","eescobarvip.com","erotikkizle.com","escobarvip.blog","filmdizibox.com","filmkuzusu1.com","filmmakinesi1.*","hayrirsds24.cfd","hurriyet.com.tr","ifsamerkezi.com","inattvgiris.pro","justintvsh.baby","kodamantv21.com","kriptoradar.com","kuponuna476.top","kuponuna477.top","kuponuna478.top","kuponuna479.top","kuponuna480.top","kuponuna481.top","kuponuna482.top","kuponuna483.top","kuponuna484.top","kuponuna485.top","kuponuna486.top","kuponuna487.top","kuponuna488.top","kuponuna489.top","kuponuna490.top","kuponuna491.top","kuponuna492.top","kuponuna493.top","kuponuna494.top","kuponuna495.top","kuponuna496.top","kuponuna497.top","kuponuna498.top","kuponuna499.top","kuponuna500.top","kuponuna501.top","kuponuna502.top","kuponuna503.top","kuponuna504.top","kuponuna505.top","kuponuna506.top","kuponuna507.top","kuponuna508.top","kuponuna509.top","kuponuna510.top","kuponuna511.top","kuponuna512.top","kuponuna513.top","kuponuna514.top","kuponuna515.top","kuponuna516.top","kuponuna517.top","kuponuna518.top","kuponuna519.top","kuponuna520.top","kuponuna521.top","kuponuna522.top","kuponuna523.top","kuponuna524.top","kuponuna525.top","kuponuna526.top","kuponuna527.top","kuponuna528.top","kuponuna529.top","kuponuna530.top","kuponuna531.top","kuponuna532.top","kuponuna533.top","kuponuna534.top","kuponuna535.top","kuponuna536.top","kuponuna537.top","kuponuna538.top","kuponuna539.top","kuponuna540.top","kuponuna541.top","kuponuna542.top","kuponuna543.top","kuponuna544.top","kuponuna545.top","kuponuna546.top","kuponuna547.top","kuponuna548.top","kuponuna549.top","kuponuna550.top","kuponuna551.top","kuponuna552.top","kuponuna553.top","kuponuna554.top","kuponuna555.top","kuponuna556.top","kuponuna557.top","kuponuna558.top","kuponuna559.top","kuponuna560.top","kuponuna561.top","kuponuna562.top","kuponuna563.top","kuponuna564.top","kuponuna565.top","kuponuna566.top","kuponuna567.top","kuponuna568.top","kuponuna569.top","merlinscans.com","milanotv61.shop","movietube32.xyz","pchocasi.com.tr","sinemakolik.net","sinemakolik.org","sinemakolix.com","sinemakolix.net","siyahfilmizle.*","summertoons.net","superfilmizle.*","tenshimanga.com","trgoals1495.xyz","trgoals1496.xyz","trgoals1497.xyz","trgoals1498.xyz","trgoals1499.xyz","trgoals1500.xyz","trgoals1501.xyz","trgoals1502.xyz","trgoals1503.xyz","trgoals1504.xyz","trgoals1505.xyz","trgoals1506.xyz","trgoals1507.xyz","trgoals1508.xyz","trgoals1509.xyz","trgoals1510.xyz","trgoals1511.xyz","trgoals1512.xyz","trgoals1513.xyz","trgoals1514.xyz","trgoals1515.xyz","trgoals1516.xyz","trgoals1517.xyz","trgoals1518.xyz","trgoals1519.xyz","trgoals1520.xyz","trgoals1521.xyz","trgoals1522.xyz","trgoals1523.xyz","trgoals1524.xyz","trgoals1525.xyz","trgoals1526.xyz","trgoals1527.xyz","trgoals1528.xyz","trgoals1529.xyz","trgoals1530.xyz","trgoals1531.xyz","trgoals1532.xyz","trgoals1533.xyz","trgoals1534.xyz","trgoals1535.xyz","trgoals1536.xyz","trgoals1537.xyz","trgoals1538.xyz","trgoals1539.xyz","trgoals1540.xyz","trgoals1541.xyz","trgoals1542.xyz","trgoals1543.xyz","turkifsa10.porn","turkifsa11.porn","turkifsa12.porn","turkifsa13.porn","turkifsa14.porn","turkifsa15.porn","turkifsa16.porn","turkifsa17.porn","turkifsa18.porn","turkifsa19.porn","turkifsa20.porn","turkifsa21.porn","turkifsa22.porn","turkifsa23.porn","turkifsa24.porn","turkifsa25.porn","turkifsa26.porn","turkifsa27.porn","turkifsa28.porn","turkifsa29.porn","turkleak10.live","turkleak11.live","turkleak12.live","turkleak13.live","turkleak14.live","turkleak15.live","turkleak16.live","turkleak17.live","turkleak18.live","turkleak19.live","turkleak20.live","turkleak21.live","turkleak22.live","turkleak23.live","turkleak24.live","turkleak25.live","turkleak26.live","turkleak27.live","turkleak28.live","turkleak29.live","turkleak30.live","veryansintv.com","webteizle10.xyz","yeniasya.com.tr","zipfilmizle.com","4kfilmizlesene.*","aeroinsta.com.tr","afroditscans.com","asyadiziizle.com","bakimlikadin.net","balfilmizle2.org","bumfilmizle1.com","dizipal10.com.tr","dizipal11.com.tr","dizipal12.com.tr","dizipal13.com.tr","dizipal14.com.tr","dizipal15.com.tr","dizipal16.com.tr","dizipal17.com.tr","dizipal18.com.tr","dizipal19.com.tr","dizipal20.com.tr","filmerotixxx.com","filmizletv18.com","fullhdfilmizle.*","goodfilmizle.com","hdfilmizlesene.*","hdfilmizletv.net","hentaizm6.online","hentaizm7.online","hentaizm8.online","hentaizm9.online","kanunyolu.com.tr","klavyeanaliz.org","okultanitimi.net","paradoxscans.com","sinemadafilm.com","sinemadelisi.com","teknoinfo.com.tr","webdramaturkey.*","www.filmmolly.cc","yavasgir136.live","yavasgir137.live","yavasgir138.live","yavasgir139.live","yavasgir140.live","yavasgir141.live","yavasgir142.live","yavasgir143.live","yavasgir144.live","yavasgir145.live","yavasgir146.live","yavasgir147.live","yavasgir148.live","yavasgir149.live","yavasgir150.live","asyaanimeleri.com","aydindenge.com.tr","beceriksizler.net","bosssports326.com","bosssports327.com","bosssports328.com","bosssports329.com","bosssports330.com","bosssports331.com","bosssports332.com","bosssports333.com","bosssports334.com","bosssports335.com","bosssports336.com","bosssports337.com","bosssports338.com","bosssports339.com","bosssports340.com","bosssports341.com","bosssports342.com","bosssports343.com","bosssports344.com","bosssports345.com","breakingbadizle.*","discordsunucu.com","erotizmvadisi.com","forumchess.com.tr","fullfilmcibaba.nl","fullhdfilmmodu2.*","hdfilmcehennemi.*","hdfilmizleamk.net","hdfilmizlesen.com","hemenfilmizle.com","hentaizm10.online","hentaizm11.online","hentaizm12.online","hentaizm13.online","hentaizm14.online","hentaizm15.online","hentaizm16.online","hentaizm17.online","hentaizm18.online","hentaizm19.online","hentaizm20.online","hentaizm21.online","hentaizm22.online","hentaizm23.online","hentaizm24.online","hentaizm25.online","inattvizle486.top","jetfilmizletv.net","kelebekfilmm1.com","keplersociety.com","klasikfilmler1.cc","klasikfilmler2.cc","klasikfilmler3.cc","klasikfilmler4.cc","klasikfilmler5.cc","klasikfilmler6.cc","klasikfilmler7.cc","klasikfilmler8.cc","klasikfilmler9.cc","kuzufilmizle1.com","macicanliizle.sbs","macizlevip741.sbs","macizlevip742.sbs","macizlevip743.sbs","macizlevip744.sbs","macizlevip745.sbs","macizlevip746.sbs","macizlevip747.sbs","macizlevip748.sbs","macizlevip749.sbs","macizlevip750.sbs","macizlevip751.sbs","macizlevip752.sbs","macizlevip753.sbs","macizlevip754.sbs","macizlevip755.sbs","macizlevip756.sbs","macizlevip757.sbs","macizlevip758.sbs","macizlevip759.sbs","macizlevip760.sbs","memoryhackers.org","royalfilmizle.com","selcuk-sports.com","sosyogaraj.com.tr","taraftariumxx.cfd","tempestmangas.com","trkifsalariz.site","turbofilmizle.net","turkifsaalemi.com","turkporoclub1.sbs","turkporoclub2.sbs","turkporoclub3.sbs","turkporoclub4.sbs","turkporoclub5.sbs","turkporoclub6.sbs","turkporoclub7.sbs","turkporoclub8.sbs","turkporoclub9.sbs","wheel-size.com.tr","yabancidiziio.com","zamaninvarken.com","1080hdfilmizle.com","arsiv.mackolik.com","dmlstechnology.com","dramadizilerim.com","erotikfilmtube.com","filmifullizlet.com","filmizlehdfilm.com","filmizlehdizle.com","fullhdfilmizletv.*","hdfilmizlesene.net","hdfilmizlesene.org","klasikfilmler10.cc","klasikfilmler11.cc","klasikfilmler12.cc","klasikfilmler13.cc","klasikfilmler14.cc","klasikfilmler15.cc","klasikfilmler16.cc","klasikfilmler17.cc","klasikfilmler18.cc","klasikfilmler19.cc","klasikfilmler20.cc","komputerdelisi.com","korsanedebiyat.com","player.filmizle.in","sinemafilmizle.net","superfilmgeldi.biz","superfilmgeldi.net","turkerotikfilm.com","turkifsalife64.lat","turkporoclub10.sbs","turkporoclub11.sbs","turkporoclub12.sbs","turkporoclub13.sbs","turkporoclub14.sbs","turkporoclub15.sbs","turkporoclub16.sbs","turkporoclub17.sbs","turkporoclub18.sbs","turkporoclub19.sbs","turkporoclub20.sbs","turkporoclub21.sbs","turkporoclub22.sbs","turkporoclub23.sbs","turkporoclub24.sbs","turkporoclub25.sbs","turkporoclub26.sbs","turkporoclub27.sbs","turkporoclub28.sbs","turkporoclub29.sbs","turkporoclub30.sbs","yabancidizibax.com","yabancidizilertv.*","yabancidizivip.com","yenierotikfilm.xyz","720pfilmizleme1.com","720pfilmizletir.com","99turkifsaizle.site","edebiyatdefteri.com","erotikhdfilmx3.shop","filmseyretizlet.net","hdfilmcehennem.live","hudsonlegalblog.com","iddaaorantahmin.com","justintvizle550.top","justintvizle551.top","justintvizle552.top","justintvizle553.top","justintvizle554.top","justintvizle555.top","justintvizle556.top","justintvizle557.top","justintvizle558.top","justintvizle559.top","justintvizle560.top","justintvizle561.top","justintvizle562.top","justintvizle563.top","justintvizle564.top","justintvizle565.top","justintvizle566.top","justintvizle567.top","justintvizle568.top","justintvizle569.top","kpsssorucevapba.com","mustafabukulmez.com","onlinefilmizle.site","onlinefilmizlee.com","primeembedpanel.com","raindropteamfan.com","sexfilmleriizle.com","sinefilmizlesem.com","tekparthdfilmizle.*","turkdenizcileri.com","turkifsalar26.space","turkifsalar27.space","turkifsalar28.space","turkifsalar29.space","turkifsalar30.space","turkifsalar31.space","turkifsalar32.space","turkifsalar33.space","turkifsalar34.space","turkifsalar35.space","turkifsalar36.space","turkifsalar37.space","turkifsalar38.space","turkifsalar39.space","turkifsalar40.space","turkifsalar41.space","turkifsalar42.space","turkifsalar43.space","turkifsalar44.space","turkifsalar45.space","turkifsalar46.space","turkifsalar47.space","turkifsalar48.space","turkifsalar49.space","turkifsalar50.space","turkifsalar51.space","turkifsalar52.space","turkifsalar53.space","turkifsalar54.space","turkifsalar55.space","turkzzersifsa3.blog","turkzzersifsa4.blog","turkzzersifsa5.blog","turkzzersifsa6.blog","turkzzersifsa7.blog","turkzzersifsa8.blog","turkzzersifsa9.blog","webdramaturkey2.com","1080pfilmizletir.com","720pfilmizlesene.com","ankarakampkafasi.com","asyafanatiklerim.com","belgeselizlesene.com","boxofficeturkiye.com","buenosairesideal.com","filmifullizle.online","fullfilmizlebaba.com","fullfilmizlesene.net","fullhdfilmizlesene.*","ifsaciturksex99.site","menufiyatlari.com.tr","netfullfilmizle3.com","sinemadafilmizle.net","sinemadafilmizle.org","supernaturalizle.com","tekfullfilmizle5.com","tekparthdfilmizle.cc","telegramgruplari.com","turkzzersifsa10.blog","turkzzersifsa11.blog","turkzzersifsa12.blog","turkzzersifsa13.blog","beintvcanliizle52.com","beintvcanliizle53.com","beintvcanliizle54.com","beintvcanliizle55.com","beintvcanliizle56.com","beintvcanliizle57.com","beintvcanliizle58.com","beintvcanliizle59.com","beintvcanliizle60.com","beintvcanliizle61.com","beintvcanliizle62.com","beintvcanliizle63.com","beintvcanliizle64.com","beintvcanliizle65.com","beintvcanliizle66.com","beintvcanliizle67.com","beintvcanliizle68.com","beintvcanliizle69.com","beintvcanliizle70.com","beintvcanliizle71.com","bilgalem.blogspot.com","fullhdfilmcenneti.pro","fullhdfilmizleabi.com","fullhdfilmizlett1.com","fullhdfilmsitesii.com","guneykoresinemasi.com","hdfilmcehennemi27.org","hdselcuksports368.top","hdselcuksports420.top","hdselcuksports421.top","hdselcuksports422.top","hdselcuksports423.top","hdselcuksports424.top","hdselcuksports425.top","hdselcuksports426.top","hdselcuksports427.top","hdselcuksports428.top","hdselcuksports429.top","hdselcuksports430.top","hdselcuksports431.top","hdselcuksports432.top","hdselcuksports433.top","hdselcuksports434.top","hdselcuksports435.top","hdselcuksports436.top","hdselcuksports437.top","hdselcuksports438.top","hdselcuksports439.top","hdselcuksports440.top","hdselcuksports441.top","hdselcuksports442.top","hdselcuksports443.top","hdselcuksports444.top","hdselcuksports445.top","hdselcuksports446.top","hdselcuksports447.top","hdselcuksports448.top","hdselcuksports449.top","hdselcuksports450.top","hdselcuksports451.top","hdselcuksports452.top","hdselcuksports453.top","hdselcuksports454.top","hdselcuksports455.top","hdselcuksports456.top","hdselcuksports457.top","hdselcuksports458.top","hdselcuksports459.top","hdselcuksports460.top","hdselcuksports461.top","hdselcuksports462.top","hdselcuksports463.top","hdselcuksports464.top","hdselcuksports465.top","hdselcuksports466.top","hdselcuksports467.top","hdselcuksports468.top","hdselcuksports469.top","hdselcuksports470.top","hdselcuksports471.top","hdselcuksports472.top","sinnerclownceviri.com","unutulmazfilmizle.com","yabancidiziizlesene.*","bettercallsaulizle.com","canlimacizlemax667.top","da95848c82c933d2.click","forum.donanimhaber.com","fullhdfilmizlepala.com","hdfilmcehennemizle.com","veterinerhekimleri.com","azsekerlik.blogspot.com","fullfilmcibabaizlet.com","goley90canlitv3003.site","goley90canlitv3004.site","goley90canlitv3005.site","goley90canlitv3006.site","goley90canlitv3007.site","goley90canlitv3008.site","goley90canlitv3009.site","goley90canlitv3010.site","goley90canlitv3011.site","goley90canlitv3012.site","goley90canlitv3013.site","goley90canlitv3014.site","goley90canlitv3015.site","goley90canlitv3016.site","goley90canlitv3017.site","goley90canlitv3018.site","goley90canlitv3019.site","goley90canlitv3020.site","goley90canlitv3021.site","goley90canlitv3022.site","nefisyemektarifleri.com","search.donanimhaber.com","tekparthdfilmizlesene.*","www.papazsports1022.pro","www.papazsports1023.pro","www.papazsports1024.pro","www.papazsports1025.pro","www.papazsports1026.pro","www.papazsports1027.pro","www.papazsports1028.pro","www.papazsports1029.pro","www.papazsports1030.pro","justintvx30.blogspot.com","justintvxx10.blogspot.com","turkcealtyazilipornom.com","justintvgiris.blogspot.com","kampanyatakip.blogspot.com","canlimacizlene.blogspot.com","taraftarium402.blogspot.com","cinque.668a396e58bcbc27.click","taraftariummdeneme.blogspot.com","sportboss-macizlesbs.blogspot.com","taraftarium24hdgiris1.blogspot.com","inattv-taraftarium24-macizle.blogspot.com","taraftarium24canli-macizlesene.blogspot.com","canli-mac-izle-taraftarium24-izle.blogspot.com","selcukspor-taraftarium24canliizle1.blogspot.com"];
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
        const $scriptletArglistRefs$ = /* 1061 */ "66,68,175;64,65;66,68,175;66,69;202;141;1;66;81;158;66;66;30;66;11;25;156;21,68;196,197;66,85;73;18,90;102;90,109;40;66;66;139;81;66,107;66;66;202;66;17;173,174;13;122;156;90;113;90;25;25,49,50,51,52;66,72;164;66,83;66,83;2;36;68;90,97;144;66;77;66;80,154;112;126;28;74,75;66;81;161;79;66;105;71,140;190;90;117;66;66;66;68;66;157;68;81;80;66,196,197,202;153;29;66;23,34;47;106;48;48;66;66,68,175;80;66;134;90;142;102;66;72;90;80,133;53;66;66;68;80;68;66;68;132;66;68;66;66,196,197,202;66,94,95,202;196,197,202;80;93;163;42;108;57;130;66;167;80;37,38;90;90;131;66;99;66;48;90;195;195;195;195;195;195;195;195;195;195;195;114;23;129;66;69;90;66;81;80;123;66;68;143;66;68;169;66;66;66,80,85,87;66;70;66;68;143;66;1;23;162;90;66;158;24;80,170,172;80,92;156;55,56,90;66;44;44;66;60;66;66;90;66;160;90;156;156;68;120,121;59;80,162;98;66,124;157;84;22,39,66,80,151;157;69;191,199;135;80;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;66;25;90;25;81;81;81;81;81;81;81;81;81;81;81;81;81;81;81;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;101,104;68,80,151;86,110;80,152,158;80;66;68;202;80;68;66,196,197,202;19,20;66;66;66;202;69;69;69,88,106;156;69;62;66;2;145;137;156;189;66;66;13;66;66;10;66,200;157;157;157;157;157;157;157;157;157;129;129;129;129;129;129;129;129;129;80;80;176;70;66;66;43;67;67;67;67;67;67;67;66;68;148,149;127,128;68;185;185;185;185;185;185;185;185;185;185;185;28,189;90;70,80;182;128,135,155;80,146;198;198;198;198;198;198;198;103;66;80,171;162;66;70;156;136;115;156;156;80;1;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;31,32;14,15,16;68;80;111,120;66,69;66;68;66;66,85;4;80;68;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;67,167;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;157;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;129;35;67;166;68;80,172;8;78;82;1;68;66;198;198;198;198;198;198;198;198;198;198;198;66;66;66,94,95,196,197,202;91;202;66;187;187;187;187;3;61;45;7;68;66;10;78;66;182;182;182;182;182;182;182;182;182;182;182;182;182;182;182;159;125;2;184;184;184;184;184;184;184;184;184;184;184;184;184;184;184;184;184;184;184;184;68,80;25;68;22;147;66;150;189;71;139;187;187;187;187;187;187;187;187;187;187;187;187;187;187;187;187;66,80;68;66;80;188;188;188;188;188;188;188;188;188;66;66;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;183;63;66;156;10;66;138;80;139;68;177;177;177;177;177;177;177;177;177;41;143;1;66,71;89;156;5,6;66;66;196,197,202;71,76;196,197,202;157;196,197;188;188;188;188;188;188;188;188;188;188;188;23;1;80;66;69;69;80;178,179,180;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;177;66;66;66;68;70;70;80;116;168;66;66,70;156;21;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;9;1;66;66;80;33;66;68;68;58;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;129,181;178,179;178,179;178,179;178,179;178,179;178,179;178,179;78;70;70;1;66;118,119;25;167;66;69;76;66;80;10;66;66;66;69;67;66;46;178,179;178,179;178,179;178,179;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;58;66;69;69;68;68;80;80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;66,80;26,27;139;71;69;66;165;100;69;66;57;43;147;186;186;186;186;186;186;186;186;186;186;186;186;186;186;186;186;186;186;186;186;93;96;66;66,201;66,201;66,201;66,201;66,201;66,201;66,201;66,201;66,201;66;66;66;66;54;68;66;183;66;66;66;66;66;66;66";
        const arglistRefs = $scriptletArglistRefs$.split(';');
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const $scriptletFromRegexes$ = /* 41 */ ["turkleak","turkleak\\d+.live$","12","canlimac","canlimacizlemax\\d+\\.top","66","hdselcuk","hdselcuksports\\d+\\.top","66,80","sporcafe","sporcafe\\d+\\.top","66","justintv","justintvizle\\d+\\.top","66,80","www.trgo","^www\\.trgoals\\d+\\.top$","66,200","inattviz","inattvizle\\d+\\.top","66,80","papazspo","papazsports\\d+\\.pro","66","webteizl","^webteizle\\d+\\.xyz","67","trgoals","trgoals\\d+\\.xyz$","67,167","milanotv","milanotv\\d+\\.shop$","68","taratv","taratv\\d+\\.shop$","68","kodamant","kodamantv\\d*\\.com$","80","hdfilmce","hdfilmcehennemi\\d+.org","80","turkleak","turkleak\\d+\\.live$","129","turkifsa","^turkifsalar\\d+\\.space$","129,181","beintvca","beintvcanliizle\\d+.com","156","turkifsa","turkifsa\\d?.porn$","157","dizipalx","dizipalx\\d+.com","157","turkporo","turkporoclub\\d+\\.sbs$","177","turkzzer","^turkzzersifsa\\d+\\.blog$","178,179","turkifsa","^turkifsalife\\d+\\.(blog|lat)$","178,179,180","sotwetur","^sotweturkifsa\\d+\\.blog$","178,179","yavasgir","yavasgir\\d+\\.(com|live)","182","cimcime","cimcime\\d+\\.\\w+$","182","zeustv","zeustv\\d+\\.com","183","canlimac","canlimaclar\\d+\\.sbs","183","macizlev","macizlevip\\d+\\.sbs","183","bossspor","bosssports\\d+\\.com","184","betivotv","betivotv\\d+\\.com","185","goley90c","goley90canlitv\\d+\\.site","186","hentaizm","hentaizm\\d+.online","187","klasikfi","klasikfilmler\\d+\\.cc","188","diziyou","diziyou\\d+\\.com","190","dizilla","dizilla\\d*\\.(club|com|nl)","191","main.uxs","^main\\.uxsyplayer[a-z0-9]+\\.click$","192,193","dcdl","dcdl[a-z0-9-]+\\.xyz$","193",".strmrdr","^i\\[a-z\\]*\\.strmrdr\\[a-z0-9\\]+\\..*","194","mackeyfi","mackeyfi\\d+\\.sbs$","194","tvboff","tvboff\\d+\\.com","195","dizipal","^dizipal\\d+\\.com\\.tr","198"];
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
    const $scriptletFunctions$ = /* 18 */
[preventSetTimeout,setConstant,preventAddEventListener,abortCurrentScript,preventFetch,abortOnPropertyWrite,zeta_j7s0f4ys,preventSetInterval,preventXhr,abortOnPropertyRead,abortOnStackTrace,noWindowOpenIf,removeAttr,adjustSetInterval,m3uPrune,jsonPrune,noEvalIf,adjustSetTimeout];
    const $scriptletArgs$ = /* 223 */ ["0===o.offsetLeft&&0===o.offsetTop","adblock.check","noopFunc","DOMContentLoaded","run","load","checkAdblock","EventTarget.prototype.addEventListener","/\\.offsetHeight[\\s]*?===[\\s]*?0|pagead2\\.googlesyndication\\.com/","llvpn.com/tag.min.js","detectAdBlock","/new Promise[\\s\\S]*?\"throw\"[\\s\\S]*?void 0/","adsbygoogle","document.querySelector","adBlocks","offsetHeight === 0",".offsetHeight === 0","/adblock/i","adBlock","adBlockDetected","App.detectAdBlock","adBlockerDetected","/agead2\\.googlesyndication\\.com|googleadservices\\.com/","canRunAds","true","pagead2.googlesyndication.com","adblockmesaj","adblockalert","AdBlock","offsetParent",".height();","ad_block_detected","eyeOfErstream.detectedBloke","falseFunc","/advert.js","$('body').empty().append","https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","static.doubleclick.net/instream/ad_status.js","kanews-modal-adblock","5000","tie.ad_blocker_disallow_images_placeholder","undefined","/assets/js/prebid","detectedAdBlock","eazy_ad_unblocker_msg_var","","www3.doubleclick.net","detector_active","adblock_active","false","document.addEventListener","/abisuq/","adBlockRunning","$","adblock","adb","!document.getElementById(btoa","maari","adBlockEnabled","/div#gpt-passback|playerNew\\.dispose\\(\\)/","doubleclick.net","kan_vars.adblock","arlinablock","adblockCheckUrl","adservice","{}","jQuery.adblock","koddostu_com_adblock_yok","null","window.onload","ad_killer","adsBlocked","adregain_wall","rTargets","rInt","puShown","isShow","initPu","initAd","click","checkTarget","initPop","oV1","Object.prototype.isAdMonetizationDisabled","/img[\\s\\S]*?\\.gif/","document.write","_blank","app.ads","openRandomUrl","openPopup","popURL","wpsaData","style","#episode","after-ads","*","0.001",".hit.gemius.","data-money","div[data-money]","data-href","span[data-href^=\"https://ensonhaber.me/\"]","money--skip","0.02","pop_status","AdmostClient","/cdn\\.net\\/.*\\/ad\\//","/daioncdn\\.net\\/.*\\.m3u8/","sagAltReklamListesi","S_Popup","2","loadPlayerAds","trueFunc","reklamsayisi","0","reklam","productAds","spotxchange.com","volumeClearInterval","clicked","adSearchTitle","wt()","100","ads","popundr","placeholder","input[id=\"search-textbox\"]","showPop","yeniSekmeAdresi","initDizi",".addClass('getir')","HBiddings.vastUrl","flipHover","bit.ly","initOpen","#myModal","loadBrands","maxActive","rg","sessionStorage.getItem","Object.prototype.video_ads","Object.prototype.ads_enable","td_ad_background_click_link","wpsite_clickable_data","advert","/ads/","jsPopunder","start","1","popup","AD_URL_","window.open","$.products.*[?(@.tagDetails.*.tag==\"sponsored\")]","__DRAMAFLIX_NO_ADS__","HTMLAnchorElement.prototype.click","href","a[href*=\"eminevim\"]","JSON.parse","injectOtherAds","data-right-href|data-right-href-mobile",".ke-pt-row","open","openHiddenPopup","popupLastOpened","message","localStorage","jwSetup.advertising","disabled","button#skipBtn","lastOpened","/reklam/i","div[class^=\"swiper-\"] > a[href^=\"https://www.sinpasyts.com/\"]",".swiper-pagination > a[href=\"null\"]","isFirstLoad","checkAndOpenPopup","/hlktrpl.cfd\\/\\w+.xml/","Popunder","popupInterval","window.config.adv.enabled","doOpen","popURLs","edsiga.com","manset_adv_imp","var adx =","popupShown","jsAd","document.createElement","/\\.src=[\\s\\S]*?getElementsByTagName/","adsConfig","PopBanner","config.adv","getLink","data-front","#tv-spoox2","adx","a[href^=\"https://www.haber7.com/advertorial/\"].headline-slider-item",".slick-dots > li > a[href^=\"https://www.haber7.com/advertorial/\"]",".parentNode.insertBefore(","getAdMountPoint","script","app_advert","popUnder","tik_sayac","promoContainers","config.advertisement.enabled","config.adv.enabled","window.advertisement.states.activate","popns","videotutucu","onPopUnderLoaded","player.vroll","loading","iframe[loading=\"lazy\"]","Object.prototype.adSkipped","document.referrer","adscfg.enabled","getFrontVideo","sec--","__dizipalPreroll","timeleft","video_shown","reklam_","ifrld"];
    const $scriptletArglists$ = /* 203 */ ";0,0;1,1,2;2,3,4;2,5,6;3,7,8;4,9;5,10;0,11;2,3,12;0,12;3,13,14;0,15;0,16;2,5,17;0,18;1,19,2;1,20,2;6;7,21;4,22;1,23,24;8,25;9,26;0,27;4,25;0,28;0,29;3,7,30;0,31;1,32,33;8,34;0,35;4,36;8,37;0,38,39;1,40,41;4,42;9,43;1,44,45;4,46;1,47,24;1,48,49;3,50,51;1,52,49;3,53,54;9,10;1,55,49;3,53,56;1,57,2;1,58,49;0,59;4,60;1,61,41;3,7,62;1,63,45;1,64,65;1,66,49;1,67,68;10,13,69;3,7,70;1,54,49;9,71;5,72;9,73;5,74;1,75,24;1,76,24;9,77;9,78;2,79,80;9,81;9,82;1,83,24;0,84;3,85,86;1,87,65;5,88;9,89;5,90;11;1,91,41;12,92,93;13,94,95,96;3,85,97;12,98,99;12,100,101;13,102,45,103;9,104;1,105,2;14,106,107;9,108;1,109,110;1,111,112;1,113,114;13,115,95,103;15,116;8,117;1,118,114;1,119,24;1,120,45;0,121,122;15,123;2,79,124;12,125,126;2,79,127;5,128;9,129;7,130;1,131,45;7,132;11,133;1,134,41;3,53,135;3,136;15,92,137;1,138,2;3,139,115;1,140,2;1,141,49;1,142,45;9,143;13,144,95,96;3,53,145;9,146;1,147,148;1,149,2;3,7,150;11,86;2,79,151;11,45,148;15,152;1,153,24;1,154,2;12,155,156;3,157,158;12,159,160;9,161;2,3,115;2,3,162;2,3,81;2,3,163;16,151;2,164,165;1,166,41;12,167,168;2,79,169;2,79,170;12,155,171;12,155,172;1,173,49;2,79,89;2,45,174;8,175;3,7,176;3,50,177;1,178,114;9,179;5,180;3,179,181;1,182,2;2,3,183;1,184,24;0,185;3,186,187;1,188,65;1,189,41;1,190,65;5,191;1,123,65;12,192,193;3,7,151;5,194;12,155,195;12,155,196;3,186,197;10,186,198;3,186,199;2,3,200;2,79,201;2,79,202;2,3,203;2,3,89;1,204,49;1,205,49;1,205,114;1,206,49;9,207;2,3,208;5,209;1,210,2;12,211,212;1,213,24;1,214,45;1,215,49;1,216,2;1,113,148;13,217,95,96;1,218,41;13,219,95,103;1,220,148;13,221,95,96;17,222,95,96";
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
