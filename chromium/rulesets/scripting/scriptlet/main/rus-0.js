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

function alertBuster() {
    window.alert = new Proxy(window.alert, {
        apply: function(a) {
            console.info(a);
        },
        get(target, prop) {
            if ( prop === 'toString' ) {
                return target.toString.bind(target);
            }
            return Reflect.get(target, prop);
        },
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

function jsonPruneFetchResponse(
    rawPrunePaths = '',
    rawNeedlePaths = '',
    ...varargs
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune-fetch-response', rawPrunePaths, rawNeedlePaths);
    const extraArgs = safe.parseVarargs(varargs);
    const propNeedles = parsePropertiesToMatchFn(extraArgs.propsToMatch, 'url');
    const stackNeedle = safe.initPattern(extraArgs.stackToMatch || '', { canNegate: true });
    const logall = rawPrunePaths === '';
    const applyHandler = function(target, thisArg, args) {
        const fetchPromise = Reflect.apply(target, thisArg, args);
        if ( propNeedles.size !== 0 ) {
            const props = collateFetchArgumentsFn(...args);
            const matched = matchObjectPropertiesFn(propNeedles, props);
            if ( matched === undefined ) { return fetchPromise; }
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `Matched "propsToMatch":\n\t${matched.join('\n\t')}`);
            }
        }
        return fetchPromise.then(responseBefore => {
            const response = responseBefore.clone();
            return response.json().then(objBefore => {
                if ( typeof objBefore !== 'object' ) { return responseBefore; }
                if ( logall ) {
                    safe.uboLog(logPrefix, safe.JSON_stringify(objBefore, null, 2));
                    return responseBefore;
                }
                const objAfter = objectPruneFn(
                    objBefore,
                    rawPrunePaths,
                    rawNeedlePaths,
                    stackNeedle,
                    extraArgs
                );
                if ( typeof objAfter !== 'object' ) { return responseBefore; }
                safe.uboLog(logPrefix, 'Pruned');
                const responseAfter = Response.json(objAfter, {
                    status: responseBefore.status,
                    statusText: responseBefore.statusText,
                    headers: responseBefore.headers,
                });
                Object.defineProperties(responseAfter, {
                    ok: { value: responseBefore.ok },
                    redirected: { value: responseBefore.redirected },
                    type: { value: responseBefore.type },
                    url: { value: responseBefore.url },
                });
                return responseAfter;
            }).catch(reason => {
                safe.uboErr(logPrefix, 'Error:', reason);
                return responseBefore;
            });
        }).catch(reason => {
            safe.uboErr(logPrefix, 'Error:', reason);
            return fetchPromise;
        });
    };
    self.fetch = new Proxy(self.fetch, {
        apply: applyHandler
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
    const $scriptletHostnames$ = /* 944 */ ["14.ru","26.ru","29.ru","35.ru","43.ru","45.ru","48.ru","51.ru","53.ru","56.ru","59.ru","60.ru","63.ru","68.ru","71.ru","72.ru","74.ru","76.ru","86.ru","89.ru","93.ru","at.ua","bb.lv","ck.ua","cn.ua","do.am","e1.ru","k1.ua","kh.ua","kp.kg","kp.kz","kp.ru","kr.ua","mk.ru","nn.ru","ok.ru","rg.ru","rv.ua","te.ua","v1.ru","vk.ru","vm.ru","ya.ru","zp.ua","116.ru","161.ru","164.ru","173.ru","178.ru","1tv.ru","3dn.ru","ati.su","dni.ru","dtf.ru","eda.ru","gdz.ru","ivi.ru","m-z.tv","m24.ru","moy.su","my1.ru","ngs.ru","ntn.ua","ntv.ru","ogo.ua","pb.wtf","prm.ua","rbc.ru","ren.tv","stb.ua","sud.ua","surl.*","tut.by","tv8.md","u24.ua","vk.com","wmj.ru","yap.ru","zab.ru","3mod.ru","4pda.to","80-e.ru","aniu.ru","auto.ru","baby.ru","clan.su","cont.ws","depo.ua","dzen.ru","film.ru","gals.md","grad.ua","gwss.ru","i-ua.tv","ictv.ua","izh1.ru","mail.ru","mind.ua","msk1.ru","novy.tv","oxax.tv","pg11.ru","pkrc.ru","quto.ru","rezka.*","risu.ua","sm.news","spac.me","tass.ru","uatv.ua","ucoz.ru","ucoz.ua","ufa1.ru","viva.ua","vost.pw","wdho.ru","womo.ua","ya62.ru","24pdd.ru","4mama.ua","7days.ru","aione.ru","biqle.ru","chita.ru","cnews.ru","dota2.ru","draug.ru","fakty.ua","fixx.one","hd24.pro","hd365.ws","id.vk.ru","inter.ua","kodik.cc","kufar.by","l2top.ru","lenta.ru","liga.net","mc.today","mir24.tv","narod.ru","ngs22.ru","ngs24.ru","ngs42.ru","ngs55.ru","ngs70.ru","np.pl.ua","peers.tv","protv.md","publy.ru","ratel.kz","saske.tv","smaxim.*","spcs.bio","sport.ua","strip2.*","tivix.co","ucoz.com","ucoz.net","ucoz.org","ura.news","vecdn.pw","vibir.ru","vlast.kz","vmusi.ru","vnn24.ru","woman.ru","24smi.org","3dnews.ru","afisha.ru","aqicn.org","ashdi.vip","asn.in.ua","beauty.ua","biqle.org","crast.net","dclans.ru","drive2.ru","dumatv.ru","e.mail.ru","ehlita.ru","elegos.ru","f1comp.ru","factor.ua","forbes.ru","fraza.com","freetp.ru","gazeta.ru","gdz.ninja","goool7.ws","hdrezka.*","hlamer.ru","howdyho.*","innal.top","ircity.ru","kinogo.eu","krymr.com","limehd.tv","litehd.tv","magnit.ru","meteum.ai","mgorsk.ru","mixmuz.ru","mp3spy.cc","my-lib.ru","myjane.ru","naylo.top","nizhny.ru","ozlib.com","pikabu.ru","pirat.one","pl.com.ua","raes.tech","regnum.ru","retail.ru","rutor.org","rutube.ru","shaiba.kz","shakko.ru","sibnet.ru","sochi1.ru","spaces.im","sports.ru","sso.ya.ru","strip2.co","ucoz.club","ufchgu.ru","uma.media","upload.ee","usite.pro","versia.ru","vsetut.su","websdr.su","www.e1.ru","xittv.net","xsport.ua","xstud.org","xv-ru.com","zazloo.ru","7ogorod.ru","adme.media","ai-next.ru","aigenda.ru","anidub.vip","anifap.com","anifap.xyz","animix.lol","aniqit.com","anivod.com","asia-tv.su","bilshe.com","bstudy.net","chas.cv.ua","dni.expert","dyvys.info","fap-guru.*","fearmp4.ru","filmpro.ru","fishki.net","fon-ki.com","for-gsm.ru","freehat.cc","freetp.org","gameout.ru","gfycat.com","hd24.watch","htmlweb.ru","huyamba.tv","imgbase.ru","imgcach.ru","inkorr.com","kodik.info","kop.net.ua","krolik.biz","krolmen.ru","lenta.news","letidor.ru","levik.blog","litnet.com","litruso.ru","liveball.*","mem-hub.ru","mi100.info","mod-wot.ru","moika78.ru","moj-pes.ru","muzlan.top","my.mail.ru","naydex.net","newsua.one","nnmclub.ro","nnmclub.to","o2.mail.ru","oligarx.uz","ontivi.net","pik.net.ua","porno365.*","pornoakt.*","radiokp.ru","rambler.ru","reactor.cc","resheba.me","rintor.net","ritsatv.ru","rusjev.com","saltday.ru","sdamgia.ru","selflib.me","sextor.org","shd247.com","smotrim.ru","sorokam.ru","spishi.fun","sport7.biz","sportkp.ru","starhit.ru","stoigr.org","stravy.net","studme.org","tagaev.com","tests24.su","the-day.ru","tv.mail.ru","tva.org.ua","uainfo.org","vkvideo.ru","vuzlit.com","whd365.pro","www.mos.ru","x-libri.ru","xxxrip.net","xxxtor.com","zaruba.fun","zbirna.com","365news.biz","addfiles.ru","akkordam.ru","animekun.ru","anitokyo.tv","assiatv.com","biz.mail.ru","bonus-tv.ru","brigadtv.ru","cdnvideo.ru","city.ogo.ua","comments.ua","day.kyiv.ua","dorama.land","doramatv.ru","doramy.club","dp73.spb.ru","embed.rg.ru","f1ua.org.ua","fanserial.*","fastpic.org","fedpress.ru","footboom.kz","fssp.gov.ru","ftechedu.ru","gazeta1.com","gencit.info","gismeteo.by","gismeteo.kz","gismeteo.ru","glavpost.ua","glianec.com","hcdn.online","igroutka.ru","igrozoom.ru","igrul-ka.ru","imgclick.ru","infourok.ru","iptv.org.ua","itech.co.ua","itechua.com","its-kids.ru","kinoblin.ru","kinofilm.co","kinokong.li","kinonews.ru","kodikdb.com","kriminal.tv","ladys.media","limetvv.com","lit-web.net","lostfilm.tv","lostfilm.tw","lostpix.com","lumex.space","lyucifer.tv","mcs.mail.ru","md.kp.media","medicina.ua","miyzvuk.net","mp3crown.cc","musify.club","myshared.ru","ngp-ua.info","nnm-club.me","novkniga.ru","nsportal.ru","ohotniki.ru","others.name","otzovik.com","periskop.su","picclick.ru","picclock.ru","pingvin.pro","piratam.net","piratca.net","pokazuha.ru","porn720.biz","pravvest.ru","psxworld.ru","razlozhi.ru","relax-fm.ru","reporter.ua","reshuent.ru","rintor.info","rivne.media","russian7.ru","rusvesna.su","s7yours.com","serialai.ru","shrlink.top","sinoptik.ua","skam.online","softonic.ru","sportbar.pm","sportbox.ws","sportrbc.ru","sso.dzen.ru","stopgame.ru","strana.news","studref.com","svoboda.org","telecdn.net","tes-game.ru","times.zt.ua","tolyatty.ru","top.mail.ru","torfiles.ru","tortuga.wtf","tragtorr.in","tvzvezda.ru","uakino.best","ukrrain.com","vchaspik.ua","vestivrn.ru","videobel.by","vip-mods.ru","vodopads.ru","volynua.com","warezok.net","womanhit.ru","wona.com.ua","wowskill.ru","www.goha.ru","www.ukr.net","znanija.com","1news.com.ua","1plus1.video","595.ucoz.net","5wip-file.ru","7streams.pro","a-point.info","allapteki.ru","allboxing.ru","anipoisk.org","asteriatm.ru","astrakhan.ru","author.today","auto.mail.ru","autonevod.ru","blog.mail.ru","bombardir.ru","bookdream.ru","booksreed.ru","carservic.ru","cdn.viqeo.tv","cdnpotok.com","cvnews.cv.ua","db-energo.ru","deti.mail.ru","domahatv.com","doramakun.ru","expert.in.ua","file-mods.ru","firtka.if.ua","flightsim.su","footboom.com","footlook.top","game4you.top","gazeta.press","gidonline.eu","glavnoe24.ru","greenpost.ua","help.mail.ru","horo.mail.ru","igromania.ru","it-actual.ru","karateltv.ru","kg-portal.ru","kinescope.io","kino.mail.ru","kinomania.ru","kinozapas.co","korsars.info","kurskcity.ru","lady.mail.ru","livesport.ws","lostfilm.one","lostfilm.pro","lostfilm.uno","lostfilm.win","love.mail.ru","lrepacks.net","mail.ukr.net","megaprogz.ru","molitvy.guru","motorpage.ru","my-expert.ru","news.mail.ru","nnews.com.ua","omsimclub.ru","omskpress.ru","payforpic.ru","pes-files.ru","pets.mail.ru","picforall.ru","piratbit.fun","piratbit.org","piratbit.top","porngames.su","pornopuk.com","potokcdn.com","pro-books.ru","promin.cv.ua","radiodom.org","rbcrealty.ru","real-vin.com","romakatya.ru","rustorka.com","rustorka.net","rustorka.top","rvnews.rv.ua","samomdele.tv","sbautumn.com","sbsports.pro","sbstreams.ws","secretmag.ru","shedevrum.ai","shtrafsud.ru","sims3pack.ru","skanbooks.ru","southpark.su","sporting7.pw","sportmail.ru","strana.today","studizba.com","studwood.net","tapochek.net","techmusic.ru","tehnobzor.ru","terrikon.com","tv-assia.org","tverigrad.ru","ukranews.com","vedomosti.ru","voronezh1.ru","www.vesti.ru","xakevsoft.ru","xtorrent.net","yaplakal.com","yastatic.net","1informer.com","amazinghis.ru","anime-chan.me","animevost.org","animevost.top","anitokyo1.top","apnews.com.ua","autoinfo24.ru","avtodream.org","bez-smenki.ru","bitshare.link","bonus.mail.ru","boom365hd.com","calls.mail.ru","castle-tv.com","championat.ru","cikavosti.com","cloud.mail.ru","conversion.im","devdrivers.ru","dobro.mail.ru","elektrosat.ru","evribiont.xyz","examenpdd.com","fainaidea.com","fatcatslim.ru","fenglish.site","forpost.media","free-dream.ru","free-tor.info","friends.in.ua","gdzputina.net","gibdd.mail.ru","goldformat.ru","gorodrabot.by","gorodrabot.ru","greenflash.su","growhow.in.ua","iblitzmods.ru","id.rambler.ru","ifnews.org.ua","in-poland.com","informator.ua","inforpost.com","krasnickij.ru","lifehacker.ru","liveforums.ru","livesx.online","lostfilm.life","lvnews.org.ua","mania.gcdn.co","mediasat.info","megaclips.net","mintmanga.com","mistosumy.com","modsforwot.ru","moirebenok.ua","mow-portal.ru","mycompplus.ru","nashamama.com","newxboxone.ru","novozybkov.su","num-words.com","oneliketv.com","online-fix.me","only-paper.ru","otvet.mail.ru","patephone.com","phys-kids.com","pidru4nik.com","play-force.ru","playground.ru","pro-op.com.ua","procherk.info","progorod62.ru","programhub.ru","project-ss.ru","sblive.online","searchfloor.*","shadowcore.ru","shanson320.ru","shiro-kino.ru","showdream.org","simpsonsua.tv","soft-game.net","sportsdzen.ru","startgamer.ru","strategium.ru","stream365.pro","studbooks.net","svadba.expert","tambovnet.org","tehnar.net.ua","teleportal.ua","tenews.org.ua","touch.mail.ru","tragtorr.info","trychatgpt.ru","tverisport.ru","u-news.com.ua","uanews.org.ua","usersporn.com","vip7stream.pw","vita-water.ru","volyninfo.com","volynpost.com","vp.rambler.ru","vsviti.com.ua","wallegend.net","westnews.info","wildberries.*","win-lite.site","wworld.com.ua","zoobrilka.net","08sportbar.com","100popugaev.ru","777sportba.com","777sportba.org","777streams.pro","agroreview.com","agroter.com.ua","audioportal.su","autonews.co.ua","autotheme.info","avtovzglyad.ru","budport.com.ua","businessua.com","cdntvpotok.com","championat.com","cheline.com.ua","dialogs.org.ua","diplomsrazu.ru","doefiratv.info","dv-gazeta.info","dynamo.kiev.ua","f1analytic.com","fapreactor.com","forum.ixbt.com","freescreens.ru","gdz-putina.fun","gtavicecity.ru","health.mail.ru","hentai-mood.me","inforesist.org","itevonklass.ru","ivanovonews.ru","izmailovtv.xyz","kinogo-720.net","kvadratmetr.uz","live365tv.site","lostfilm.today","lostfilmtv.uno","marieclaire.ua","mega-music.pro","megaresheba.ru","moremania.info","music.yandex.*","nashbryansk.ru","novavlada.info","novynarnia.com","ohmywishes.com","panoptikon.org","partnerkin.com","payeer-gift.ru","penzainform.ru","players.com.ua","pogoda.mail.ru","poltava365.com","pornreactor.cc","portal.lviv.ua","pro-zakupki.ru","pro100hobbi.ru","profootball.ua","remont-aud.net","rplnews.online","russian.rt.com","samelectric.ru","sdr-deluxe.com","softomania.net","softportal.com","sport365hd.com","sport365hd.net","sporting77.com","stalker-gsc.ru","stalkermods.ru","sudya-dredd.ru","svadbatomsk.ru","telekritika.ua","testserver.pro","thelastupd.org","tophallclub.ru","turkcinema.org","tv-gubernia.ru","www.rambler.ru","24boxing.com.ua","3igames.mail.ru","account.mail.ru","asiaplustj.info","autosimgames.ru","autotema.org.ua","barsportbar.com","blitzfoxhub.com","channels247.net","comedy-radio.ru","connect.mail.ru","doctorrouter.ru","doramaland.plus","dropmefiles.net","economistua.com","electrobooks.ru","embed.twitch.tv","ferr-um.ucoz.ru","finance.mail.ru","hardwareluxx.ru","hdkinoteatr.com","hdstream365.com","hi-tech.mail.ru","khersonline.net","kodikplayer.com","liveinternet.ru","livejournal.com","lostfilmtv.site","mail.rambler.ru","megaresheba.com","new.fastpic.org","newgames.com.ua","news.rambler.ru","nova.rambler.ru","obozrevatel.com","prokadry.com.ua","root-nation.com","ru-minecraft.ru","rustorkacom.lib","sex-studentki.*","sexitorrent.com","sport-kr.com.ua","sportabar01.com","spotless365.net","stalker-mods.su","sterlitamak1.ru","taynyeistiny.ru","tech.onliner.by","thelastdb.games","tradingview.com","vadimrazumov.ru","veseloeradio.ru","vfokuse.mail.ru","vladivostok1.ru","volnorez.com.ua","widgets.mail.ru","www.fontanka.ru","zdorovia.com.ua","all-for-kompa.ru","anidubonline.com","api-video.khl.ru","buhgalter.com.ua","buhgalter911.com","calendar.mail.ru","castle-serial.ru","coderlessons.com","elektronika56.ru","elitesnooker.com","embed.dugout.com","fanserialstv.net","gdzotputina.club","gloria-cedric.ru","golosinfo.com.ua","gorodkiev.com.ua","hentai-share.one","lostfilmtv1.site","lostfilmtv2.site","lostfilmtv3.site","lostfilmtv4.site","lostfilmtv5.site","news24today.info","octavius.mail.ru","olegmakarenko.ru","pervyi-tv.online","platformcraft.ru","player.twitch.tv","player.vgtrk.com","prostoporno.help","radiosvoboda.org","ranobe-novels.ru","rivnenews.com.ua","russia-tv.online","seks-studentki.*","sorvigolovatv.ru","sportsite777.com","tv-kanali.online","uploadimagex.com","volyninfa.com.ua","www.kinopoisk.ru","www.xcom-shop.ru","zona-stalkera.ru","08sportbar.online","bryansknovosti.ru","eagleplatform.com","electric-house.ru","fukushima-news.ru","kolizhanka.com.ua","lostfilm.download","minigames.mail.ru","odessa-life.od.ua","onlineclass.space","oplatforma.com.ua","pogoda.onliner.by","pokatushki-pmr.ru","pravdatutnews.com","radioromantika.ru","rocketdockfree.ru","sportanalytic.com","stalker-zone.info","starlight.digital","torrent-pirat.com","transkarpatia.net","tvoymalysh.com.ua","ukrainianwall.com","vseinstrumenti.ru","dropmefiles.com.ua","dzplatforma.com.ua","footballgazeta.com","live-stream365.com","oblikbudget.com.ua","passport.yandex.ru","planetanovosti.com","podpricelom.com.ua","politnavigator.net","positiverecords.ru","sportbarchik88.com","themoscowtimes.com","translate.yandex.*","windows-driver.com","windows-driver.net","xn--b1aew.xn--p1ai","buhplatforma.com.ua","comments.rambler.ru","gra-prestoliv.in.ua","medplatforma.com.ua","mmminigames.mail.ru","okminigames.mail.ru","redheadsound.studio","russianshowbiz.info","technoportal.com.ua","transformator220.ru","translate.yandex.ru","windows-program.com","comp-service.kiev.ua","football-ukraine.com","novospasskoe-city.ru","pohoronnoe-byuro.com","smotret-anime-365.ru","stalker-mods.clan.su","theageoffootball.com","turkish-tv-series.ru","widgets.kinopoisk.ru","captcha-api.yandex.ru","forum.overclockers.ua","forums.rusmedserv.com","frontend.vh.yandex.ru","google-cloud.services","player-smotri.mail.ru","eurointegration.com.ua","online-supernatural.ru","footballtransfer.com.ua","portalvirtualreality.ru","stalker-2-2012.ucoz.net","xn--80aeshkkbdj.xn--p1ai","xn--80aikhbrhr.xn--j1amh"];
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
        const $scriptletArglistRefs$ = /* 944 */ "174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;420;76;19;19;420;57,174,253,343,423;289;19;179,310,426;179,310,426;179,310,426;19;310,426;174,253,343,423;390,391,392,397,400;141,275;19;19;174,253,343,423;45,287,329,331,344,421,422;327;69,153,154,201;19;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;294,317,351;370,420;311;67,310;427;303;334;288,299;27;347;420;420;174,253,343,423;289;416;19;337;19;50,55,179,304,322;298;289;19;373;6;275;276;45,287,329,331,344,421,422;328;48;123;214;221,254;141;357;56;67;420;67;19;53,218,258,267,319,326;277;420;19;31;274;289;174,253,343,423;389,393,394,399,403,405,406,407;19;174,253,343,423;289;354;19;420;328;359,363;19;44,67,72,122,257;361,362;415,418,419;19;420;420;174,253,343,423;19;94;353;19;174,253,343,423;144;19;159,426;180;160;174,253,343,423;275;110;12;137;66;354;354;0;275,289;203;72,195;5;39,187,278;19,36;354;414,415;420;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;174,253,343,423;19;284;275;66;19;27;372;361,362;249;361,362;354;420;420;420;268;354;66;19;355;19;310,426;58,312;67,327;277,304;235;203;3;19;160;20;93;47,170,199;265;-390,-394,-395,-400,-404,-406,-407,408,409,410,411,-412,428,429;27;420;61;233;173;19;220;102,109,338,339,340;334;354;359,363;121;364;364;174,253,343,423;128;19;237;237;172;290;174,253,343,423;207;11;412,413;112;364;66;73;67,198;337;19;354;172;314;46;176,185,189,205,263,300;1;49;163,230;174,253,343,423;361,362;309;0;361,362;420;94,146,147,180;193;74;420;75;142;225;44;121;275,293;73;167;106;106;255;156;270;252;43,216;43,216;224;203;203;420;34;73;19;310;19;360;79;277;104,286;420;420;80,121;220;27;275;354;41;370;10;10;19;203;19;18;420;39,187,278;328;49;168;412,413;357,358,366;262;19;17;129;81;208;-394,-395,-400,401,-404,-406,-407;258,326;19;21,68;21,68;0;260;356;19;368,369;365,370;310,426;162,178,350;42;334;64;88,192;19;121;54,191;67;370;354;196;210;334;354;310,426;253,343,423;119;34;73;61;145;310,426;-394,-395,-404,-406,-407;180;19;421,422;73;354;316;412,413;370;370;87;19;19;420;420;134;43;354;-394,-395,-404,-406,-407;184;27;303;117;19;19;113;157;107;217;325;34;359;376,377,378,379,380,381,382,383,384,354,385,386;19;77,103;130,148,149,150;420;19;62;59;59;59;19;34;43;301;216;420;10;207;180;129;19;66;365;43;212,318;302,426;203;137;310;354;412,413;281;281;121;204;27;-394,-395,-404,-406,-407;179,310,426;86;27;209;108;207,280;19;21,68;412,413;133;310,426;420;229,259;49;10;10;19,137;370;370;27;370;15,92;420;60,231,297,335;44,70;19;54,191;64;19;67;242,275;354;365;82;63,136;25;175;354;354;179,322;0;310;19;73;279;354;420;61;174,253,343,423;-394,-395,-404,-406,-407;420;203;236;152;212;19;19;135;190;216;420;19;216;310;19;121,215;67;136,222,285,425;202;19;197;207;207;354;420;232;14,169;43;115;112;283;-394,-395,-404,-406,-407;106;-394,-395,-404,-407;138;412,413;412,413;180;426;354;19;420;-394,-395,-404,-406,-407;370;134;19;207;19;247;77,103;125;364;102,109,338,339,340;84,128;19;19;-394,-395,-404,-406,-407;-394,-395,-404,-406,-407;200;120;27;21;346;-394,-395,-404,-406,-407;277;105;330;19;-394,-395,-404,-406,-407;35;281;281;281;281;-394,-395,-404,-406,-407;23,161,177;424;181,348;66;251;16,26,27,97;-394,-395,398,-400,-404,404,-406,-407;19;420;112;10;217;-394,-395,-404,-406,-407;10;337;337;337;64;370;121;216;19;420;322;19;183;364;364;364;19;27;354;354;354;328;170,320;106;207;412,413;148,149,150;354;389,398,-400;19;114,373;73;40;37,420;66,115;85;354;19;19;171;174,253,343,423;186;420;370;48;258,326;129;81;116,124,227,246;94;94;43;19;217;19;8;211;-394,-395,-404,-406,-407;354;-394,-395,-400,-404,-406,-407;65;107,188;19,137;-394,-395,-404,-406,-407;7;420;-394,-395,-404,-406,-407;420;269;141,313;129;226;11;19;420;330;84,91;334;-394,-395,-404,-406,-407;420;52;52;420;140;214;-163,-179;19;243,333,358;137;19;420;310;131;105;281;19;303;129;420;157;19;12;19;420;19;34;146,180;126;248;354;220;420;-394,-395,-404,-406,-407;417;151;420;420;296,341;107,165;19;268;181,348;420;354;371,430;141,155;22;49;19;91;420;53,267;213;234;354;73;66;112;260;289;19,323;392,-394,-395,-400,-404,-406,-407;236;182,223;19;137;19,137;361,362;354;145;19,228;19,137;-163,-179,303,324;19;207;19;375;212;19;334;354;66;354;354;354;13,30;19;336;358;19;67;2;34;354;107,188;19;137;216;94;19;38;34;42;272;10;334;217;-394,-395,-404,-406,-407;370;138;27;194;27;212;260;354;281;281;33;19;334;127;367;19;19;19;206;19;305;94;4;113;-394,-395,402,-404,-406,-407;19;42;19;420;66;19;352;125;310;66;420;216;139,248,349;354;354;354;420;420;115,126;420;19;245;277;106;148,149,150;292,342;303;34;-394,-395,-404,-406,-407;0;19;420;19;354;141,164;354;44,70;-394,-395,-404,-406,-407;145;113,166;217;19;412,413;315;241;-394,-395,398,-400,-404,-406,-407;32;240;354;-394,-395,-404,-406,-407;19;203;48,250,264;49,256;281;-179;334;-378,-379,-380,-381,-382,-383,-384,-385,-355,-386,-387;420;266;57;275;107,165;129;216;364;360;370;19;354;354;28,282;174,253,343,423;27;67;277;239;49;44,70;-394,-395,398,-400,-404,-406,-407;174,253,343,423;19;-394,-395,-404,-406,-407;174,253,343,423,426;34;420;252;295;233;233;-394,-395,-404,-406,-407;27;66;420;111;308;359;334;420;19;19,137;332,370;281;281;281;281;281;19;-390,-394,-395,-400,-404,-406,-407,408,409,410,411;49;237;275;315;291;121;19;145;19;237;360;27;354;219,238;121;19;51,258,261,326;138;420;354;126;307,345;78;420;19,89,90,118;281;387,-394,-395,-404,-406,-407;19;132;107,165;67;420;19;44,70;420;83;420;289;370;24,143;19;358;244;217;107,165;34;354;107,165;0;19;19;19;9,29;354;271;374;216;216;94,95,96,97,98,100,101;107,165;-351;91;107,165;388;-394,-395,395,-404,-406,-407;273;19;137;27;374;216;138;34;420;420;94;28,282;19;94,99,107;258,326;0;71;158;258,306,319,321,326;361,362;-394,-395,396,-404,-406,-407;83;420;34;310,426;241;420;105";
        const arglistRefs = $scriptletArglistRefs$.split(';');
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const $scriptletFromRegexes$ = /* 3 */ [];
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
[abortCurrentScript,abortOnPropertyRead,abortOnPropertyWrite,abortOnStackTrace,preventAddEventListener,adjustSetInterval,adjustSetTimeout,alertBuster,jsonPrune,jsonPruneFetchResponse,preventFetch,preventSetInterval,preventSetTimeout,preventXhr,noEvalIf,removeAttr,setConstant,noWindowOpenIf];
    const $scriptletArgs$ = /* 481 */ ["$","1xbet","append","contextmenu","divWrapper","get","init_x_place","mainContainer","showPopupextra","window.location.href","JSON.parse","atob","Math.floor","AdSense","Object.defineProperty","rcBuf","void","clickExplorer","disableSelection","reEnable","document.addEventListener","adsBlocked","document.createElement","/ru-n4p|ua-n4p|загрузка.../","Detected","Math.random","delete window","redtram","document.getElementById","composedPath","document.getElementsByTagName","unselectable","document.oncontextmenu","document.onkeydown","document.querySelector","className","encodeURIComponent","fuckAdBlock","undefined","jQuery","backgroundImage","redram","/загрузка.../","setInterval","reload","setTimeout","adblockwarn","window.innerWidth","window.onload","_uWnd","document.body.style.overflow","window._lentaData","url_for_scroll","ABNS","AdbBanner","CTRManager.host3","ClickUndercookie","Date.prototype.toUTCString","Groups.showDisclaimer","Light.Popup","Object.prototype.AdfoxXhrRequestPrepared","Object.prototype.Metrika","Object.prototype._getBanner","Object.prototype._isAutostartQueueSet","Object.prototype.bannerOptions","Object.prototype.direct","Object.prototype.initAdRefreshment","Object.prototype.isAdfox","Object.prototype.isApplySticky","Object.prototype.isTopAd","Object.prototype.loadBanner","Object.prototype.render","Object.prototype.scriptsViaXhr","Object.prototype.yaContextCb","PUM.getPopup","Radish","SIN.AdsLoader","TotemToolsObject","WebSocket","XMLHttpRequest","Ya","_0x1ece","__FEED_ES_BRIDGE_BAKED_STATE__","__vasActiveTestIds","a_urls","aab","abl","adcashMacros","addLink","adjustBackground","admiral","ads","ads_block_check","advFirstClickOpenNewTab","anOptions","app_vars.force_disable_adblock","as_retry","bdy","blocked_action","clickNS4","console.clear","disable_copy","disable_hot_keys","document.body.oncopy","mdl_adb","document.oncopy","document.ondragend","document.ondragstart","document.ondrop","document.onpaste","document.onselectstart","eaglePlayerPlugins.autoplay_position","echelon","fishki.branding","forTheFreeVideo.css","fpm_attr","getSelection","get_ya_browser","goTolink","helpUsImproveSite","initsnow","kav_cn","localStorage","m205","mdpDeBlocker","move_string","myatu_bgm","nocontext","noselect","onload","open","preventSelection","scrollw","sparkle","start_cl","stopPrntScr","t364_initPopup","target_script","td_ad_background_click_target","tingle","tnAdditionalParams","unSelect","updateDownloadLinks","utarget_script","video.preroll","vpb","weekCallbacks","window.alert","window.block","wpsite_clickable_data","yaContextCb","zfgformats","NiceScroll","ai_front","disable_keystrokes","fetch","Object.prototype.autoplay","assets","Object.prototype.feed","yandex-portal.naydex.net","Object.prototype.loadAdvertScriptMode","/yastatic\\.net/","checkAboba","/723-|ai-2-/","/createAdblockBlock|createBlock/","eval","/^(?:contextmenu|keydown)$/","/click|mousedown/","popunder","setClickedUrl","DOMContentLoaded",".j-mini-player__video","/EventTracker|utm_campaign/","AnalyticMonitor","StrategyHandler","_Modal","exo_tracker","feedback","popup","beforeunload","/477|setCookies|srcElement/","click","","elements","a[href*=\"?from=\"]","a[href*=\"utm_campaign\"]","a[href*=\"utm_campaign=\"]","[class^=\"plotsLine_\"] > div","[native code]","current","[data-testid=\"embed-wrapper\"]","pop","copy","extra","pagelink","download","isMonetized","error","[data-status=\"loading\"]","load","AdBlock","loadstart","isImmediatePropagationStopped","message","__messagesAtom","scroll","players","window.history.pushState","visibilitychange","document.hidden","opacity-.05","16","25","(!1)}","20000","appearance.extended_auto_start","banner.ytcode","data","errors","data.adverts data.ageRestriction","dl bpas","isVideoAutoplayMode","offers","results.fixed","rythm_market","tiers.TIER_ANY","vast","ads.banners.endtag ads.banners.pausebanner ads.rolls","appearance.auto_start","stackToMatch","embed","item.banners",".numcard",".time",".track-download__timer","closeWait","1800","countdown","js-game-loader-block","1000","0.0001","ks_counter","p","timer","()=>r(","15000","30000","zat_tick","/_events/","/mpsuadv\\.ru/","doubleclick.net","(clearInterval(e)","clientHeight","replaceWith","250","Adblock","X-Set-Adblock","_modal","adBlockEnabled","adblock","alert","antyadb","5000","apply","2000","doAd","evercookie","300000","getCookie","3000","getElementBy","getVisibleDivs","300","initServices","removeJuristicNotification","saa","tie-popup-adblock","toUTCString","window.location.reload","/ad\\.mail|adfox|adhigh|adriver|mc\\.yandex|mediametrics|otm-r|static-mon/","/br/","/getCode|\\/vast/","/hits/event/","method:POST","/m2?_","/wl-analytics\\.tsp\\.li/","livejournal.com/video/check?recordId=","method:GET","strm.yandex.ru/get/","ShadowRoot","/canplay|loadeddata|playing|timeupdate/","[poster][loop]","/adBlocks|adObserver|appPromoModal/","showRedirectPopup","AdvManager","AUTOPLAY","&origin_type=rtb","url:/rutube.ru/api/tags/video/","/stats/bulk|stats/pixels|zen_audit/","_rsc=","adTestElement","combinedDetector","contribute-modal","count_banners","initAds","autoplay","[data-video-player=\"small\"]","stay","video","autoplay|loop",".watch-live__link > video","class",".js-video-box__container","data-autoplay","disabled",".uk-modal-footer > button","oncontextmenu","[class]","oncontextmenu|oncopy|onselectstart","onmousedown|unselectable|onselectstart|oncontextmenu",".noselect","ADV_DISABLED","true","Clicks._test_meta_referer","null","HTMLVideoElement.prototype.volume","trueFunc","Object.prototype.AdChoices","Object.prototype.AdvObject","noopFunc","Object.prototype.AdvertisementManager","Object.prototype.BlockRenderSteps","Object.prototype.IS_CHECK_REGISTRATION","false","Object.prototype.MediaReady","Object.prototype.PLAYED","Object.prototype._currentAgeRestriction","Object.prototype.adblockSettings","Object.prototype.addRedirects","Object.prototype.advert","Object.prototype.advertObject","Object.prototype.advertsByUrl","Object.prototype.afg","Object.prototype.amp","Object.prototype.autoPlay","Object.prototype.autoPopups","Object.prototype.autostart","Object.prototype.branding","Object.prototype.changeVisible","Object.prototype.createBannerItem","Object.prototype.detect","Object.prototype.detectAdblock","Object.prototype.detectBlockAds","Object.prototype.disableAutoplay","Object.prototype.disablePaste","Object.prototype.disableSeek","Object.prototype.disableSelection","Object.prototype.getAutoplay","Object.prototype.getUaasConfig","Object.prototype.initialAutoplay","Object.prototype.livetv-state","Object.prototype.manualAutoplay_","Object.prototype.minPlayingVisibleHeight","Object.prototype.onIntersected","Object.prototype.partnerId","{}","Object.prototype.playVideo","Object.prototype.readMore","PageBottomBanners","String.fromCharCode","Unauthorized2","adBlock","adsenseIsLoaded","app.book.external","cadb","clicks","2","countdownNum","0","g_GazetaNoExchange","history.replaceState","isAdFree","localStorage.localstorageGameData","main_air_closed","navigator.sendBeacon","noAdsAtAll","player.options.scroll","playerOptions.behaviour.autoPlay","player_options.autoplay","portal.isRedirectToYandexSearchAfterDownloadEnabled","timeEnd","1","top100Counter","window.EUMP.plugins.antiblock","window.ab","window.c","4","/tutad\\.ru/","about:blank","debugger","/contextmenu|copy|keydown|selectstart/","Object.prototype.preroll","click_time","__require","/clickunder/","Object.prototype.ads/mobiads","AMSP.loadAsset","_0x","mousedown","pop.doEvent","start","wheel","shadowParent","bc_blocks","Object.prototype.parallax","document.querySelectorAll","popMagic","HelpProjectPromo","flashvars.protect_block","#timer","Object.prototype.dispatchSignalCallbacks","Object.prototype.prepareBannersList","Element.prototype.attachShadow","Event.prototype.preventDefault","/blob|injectedScript|inlineScript/","Event.prototype.stopImmediatePropagation","Event.prototype.stopPropagation","EventTarget","inlineScript","HTMLAnchorElement.prototype.dispatchEvent","document.onclick","onclick","html","HTMLHtmlElement.prototype.onclick","document.documentElement.onclick","blockWarnClass","mimicTopClass","__mediaTrend","TrendVideoArticle","globalAuthLoginPopupCounter","mailruEnabled","result.body.direct","/\\/apic\\//","&pgid=","NO_ADV","Object.prototype.autoPlayParams","Object.prototype.detectAdBlock","Object.prototype.enableMimic","Object.prototype.mimic","Object.prototype.obfuscateParams","Object.prototype.runMimic","Object.prototype.useMimic","__PHS._.props.html","document.title","mr._mimic.locator.transform","[].*.result.body","/click|destroy|mousedown/",".html-fishing","MIMIC_FORCE","_runBatch","100","Object.prototype.hasAdBlock","preventDefault","HTMLVideoElement.prototype.play","_app-","manualAutoplay","lastTick","onCanPlay","pause","video[class*=\"HLSPlayback_player\"]","u_global_data","Object.prototype.endscreenAnnouncement","Object.prototype.pauseSuggestions","Object.prototype.AdvertisingManager","Object.prototype.crossDomain","ecbrStart","captureContext","a[href^=\"/\"][data-router-link]","()=>n()","50","isDonatePage"];
    const $scriptletArglists$ = /* 431 */ ";0,0,1;0,0,2;0,0,3;0,0,4;0,0,5;0,0,6;0,0,7;0,0,8;0,0,9;0,10;0,10,11;0,12,13;0,14,15;0,11,16;0,17;0,18,19;0,20,21;0,22;0,22,23;0,22,24;0,22,25;0,22,11;0,22,26;0,22,27;0,28,29;0,30,31;0,32;0,33;0,34,35;0,36,15;0,37,38;0,39,40;0,41,42;0,43,44;0,45,46;0,47,15;0,48,49;0,28,50;0,51,52;1,53;1,54;1,55;1,56;1,57;1,58;1,59;1,60;1,61;1,62;1,63;1,64;1,65;1,66;1,67;1,68;1,69;1,70;1,71;1,72;1,73;1,74;1,75;1,76;1,77;1,78;1,79;1,80;1,81;1,82;1,83;1,84;1,85;1,86;1,87;1,88;1,89;1,90;1,91;1,92;1,93;1,94;1,95;1,96;1,11;1,97;1,98;1,99;1,100;1,101;1,102;1,20;1,103;1,28,104;1,32;1,105;1,106;1,107;1,108;1,33;1,109;1,110;1,111;1,112;1,113;1,114;1,115;1,116;1,117;1,118;1,119;1,120;1,121;1,122;1,123;1,124;1,125;1,126;1,127;1,128;1,129;1,130;1,131;1,132;1,133;1,134;1,135;1,136;1,137;1,138;1,139;1,140;1,141;1,142;1,143;1,144;1,145;1,146;1,147;1,148;1,149;1,150;1,151;2,152;2,21;2,153;2,18;2,154;2,32;2,107;2,110;2,155;3,156,157;3,158,159;3,160,161;3,22,162;3,28,163;3,28,164;3,155,165;4,166;4,167,168;4,167,169;4,170,171;4,170,172;4,170,173;4,170,174;4,170,175;4,170,176;4,170,177;4,170,178;4,179,180;4,181,182,183,184;4,181,182,183,185;4,181,182,183,186;4,181,182,183,187;4,181,188;4,181,189,183,190;4,181,191;4,192,193;4,192,116;4,192,194;4,195,196;4,197,182,183,198;4,199,200;4,201,202;4,203,204;4,205,206;4,205,207;4,205,9;4,208,209;5,210,211,212;6,213,214;7;8,215;8,216;8,217,218;8,219;8,220;8,221;8,222;8,223;8,224;8,225;8,226;9,227;9,228,182,229,230;9,231;5;5,232;5,233;5,234;5,235,236;5,237;5,238,239,240;5,241;5,242;5,243;6;6,244,245;6,182,246,240;6,243;6,247;10,248;10,249;10,250;11,251;11,252;11,125;11,253;12,182,254;12,255;12,256;12,257;12,258;12,259;12,260,245;12,261,262;12,263,264;12,265;12,266,267;12,268,269;12,270;12,271,272;12,273,262;12,274;12,275;12,133;12,276;12,277;12,278;13,279;13,280;13,281;13,282,283;13,284;13,285;13,286;13,287;13,288;14,289;14,21;4,290,182,183,291;4,170,292;4,181,293;4,199,294;4,203,295;10,296,297;10,298;10,299;12,300;12,301;12,302;12,303;12,304;15,305,306,307;15,305,308,307;15,309,310,307;15,309,308,307;15,311,312;15,313,308;15,314,315;15,316,317,307;15,318;15,319,320,307;16,321,322;16,323,324;16,325,326;16,327,38;16,328,329;16,330,38;16,331,38;16,332,333;16,334,329;16,335,324;16,336,324;16,337,38;16,338,329;16,339,324;16,339,38;16,340,324;16,341,38;16,342,322;16,343,329;16,344,333;16,344,324;16,345,38;16,156,333;16,156,324;16,346,329;16,347,38;16,348,329;16,349,324;16,350,329;16,351,329;16,352,329;16,353,322;16,354,333;16,355,329;16,356,329;16,357,329;16,358,38;16,359,324;16,360,322;16,361,324;16,362,329;16,363,38;16,364,365;16,366,329;16,367,38;16,368,38;16,369,326;16,370,38;16,371,333;16,372,322;16,373,324;16,374,333;16,375,376;16,377,378;16,379,322;16,380,329;16,381,329;16,382,182;16,383,322;16,384,329;16,385,365;16,386,333;16,387,333;16,388,333;16,389,333;16,390,391;16,392,333;16,393,329;16,394,333;16,395,396;17;17,397;17,398;11,399;4,400;16,401,38;4,170,402;0,403,404;16,405,38;0,30,406;12,407;4,408,409;4,170,410;4,411,412;1,413;3,414,48;0,415,416;2,417;16,418,182;5,419;16,420,38;16,421,329;1,422;3,423,424;3,425,424;3,426,424;3,427,428;3,429,424;3,430,428;3,431,428;4,181,182,183,432;16,433,329;16,434,329;0,0,435;0,0,436;0,437,438;1,439;2,440;8,441;10,442;13,443;16,444,391;16,445,333;16,446,38;16,447,329;16,448,38;16,449,38;16,450,329;16,451,329;16,452,324;16,452,365;16,453,324;16,454,38;8,455;4,456,182,183,457;12,458;12,459,460;16,461,324;1,154;4,192,462;3,463,464;16,344,365;3,463,465;12,466;3,463,467;4,468,182,183,469;1,470;16,471,38;16,472,38;16,156,38;16,473,329;3,474,475;4,208,476;4,181,182,183,477;12,478,479;16,461,333;4,170,480";
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
