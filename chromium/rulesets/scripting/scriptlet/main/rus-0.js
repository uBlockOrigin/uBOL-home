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

function jsonPruneFetchResponse(
    rawPrunePaths = '',
    rawNeedlePaths = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune-fetch-response', rawPrunePaths, rawNeedlePaths);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
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
        proxyApplyFn.proxies = new WeakMap();
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

const $scriptletFunctions$ = /* 18 */
[abortCurrentScript,abortOnPropertyRead,abortOnPropertyWrite,abortOnStackTrace,preventAddEventListener,adjustSetTimeout,alertBuster,jsonPrune,jsonPruneFetchResponse,adjustSetInterval,preventFetch,preventSetInterval,preventSetTimeout,preventXhr,noEvalIf,removeAttr,setConstant,noWindowOpenIf];

const $scriptletArgs$ = /* 463 */ ["$","1xbet","append","contextmenu","divWrapper","get","init_x_place","mainContainer","showPopupextra","window.location.href","JSON.parse","atob","Math.floor","AdSense","Object.defineProperty","rcBuf","XMLHttpRequest","document.querySelectorAll","addEventListener","DOMContentLoaded","void","clickExplorer","decodeURIComponent","fromCharCode","disableSelection","reEnable","document.addEventListener","adsBlocked","document.createElement","/ru-n4p|ua-n4p|загрузка.../","Detected","Math.random","delete window","document.head.appendChild","redtram","document.getElementById","composedPath","document.getElementsByTagName","unselectable","document.oncontextmenu","document.onkeydown","document.querySelector","className","encodeURIComponent","fuckAdBlock","undefined","jQuery","backgroundImage","redram","/загрузка.../","setInterval","reload","setTimeout","adblockwarn","window.innerWidth","window.onload","_uWnd","AdbBanner","CTRManager.host3","ClickUndercookie","Date.prototype.toUTCString","Groups.showDisclaimer","Light.Popup","Object.prototype.AdFox_getCodeScript","Object.prototype.AdfoxXhrRequestPrepared","Object.prototype.Metrika","Object.prototype.YA_TURBO_PAGES","Object.prototype._getBanner","Object.prototype._isAutostartQueueSet","Object.prototype.bannerOptions","Object.prototype.direct","Object.prototype.fakeDetect","Object.prototype.isAdfox","Object.prototype.isApplySticky","Object.prototype.loadBanner","Object.prototype.render","Object.prototype.scriptsViaXhr","Object.prototype.yaContextCb","PUM.getPopup","Radish","SIN.AdsLoader","TotemToolsObject","WebSocket","Ya","_0x1ece","__vasActiveTestIds","a_urls","aab","abl","adcashMacros","addLink","adjustBackground","admiral","ads","ads_block_check","advFirstClickOpenNewTab","anOptions","app_vars.force_disable_adblock","as_retry","bdy","blocked_action","clickNS4","console.clear","disable_copy","disable_hot_keys","document.body.oncopy","mdl_adb","document.oncopy","document.ondragend","document.ondragstart","document.ondrop","document.onpaste","document.onselectstart","eaglePlayerPlugins.autoplay_position","echelon","forTheFreeVideo.css","fpm_attr","getSelection","get_ya_browser","goTolink","helpUsImproveSite","initsnow","kav_cn","localStorage","m205","mdpDeBlocker","move_string","myatu_bgm","nocontext","noselect","onload","open","preventSelection","scrollw","sparkle","start_cl","stopPrntScr","t364_initPopup","target_script","td_ad_background_click_target","tingle","tnAdditionalParams","unSelect","updateDownloadLinks","utarget_script","video.preroll","vpb","weekCallbacks","window.alert","window.block","wpsite_clickable_data","yaContextCb","zfgformats","NiceScroll","ai_front","disable_keystrokes","fetch","window.yaProxy","HTMLVideoElement.prototype.play","/index-","Object.prototype.autoplay","assets","Object.prototype.dispatcher","/chunks/9635","Object.prototype.loadAdvertScriptMode","/yastatic\\.net/","checkAboba","/723-|ai-2-/","eval","/^(?:contextmenu|keydown)$/","/beforeunload|pagehide/","0x","/click|load/","popMagic","/click|mousedown/","popunder","setClickedUrl","/mouse/","cursorVisible","fullscreen-ad",".j-mini-player__video","/EventTracker|utm_campaign/","StrategyHandler","_Modal","exo_tracker","feedback","popup","click","","elements","a[href*=\"?from=\"]","a[href*=\"utm_campaign\"]","a[href*=\"utm_campaign=\"]","[class^=\"plotsLine_\"] > div","[native code]","current","[data-testid=\"embed-wrapper\"]","matches","pop","copy","extra","pagelink","preventDefault","download","isMonetized","error","[data-status=\"loading\"]","getexoloader","load","AdBlock","detect-modal","loadstart","isImmediatePropagationStopped","message","__messagesAtom","scroll","getBoundingClientRect","players","window.history.pushState","visibilitychange","document.hidden","(!1)}","20000","appearance.extended_auto_start","banner.ytcode","data","errors","dl bpas","isVideoAutoplayMode","results.fixed","rythm_market","tiers.TIER_ANY","vast","ads.banners.endtag ads.banners.pausebanner ads.rolls","appearance.auto_start","stackToMatch","embed","data.age_restrictions","data.template.disable_registration","item.banners",".numcard",".time",".track-download__timer","closeWait","1800","countdown","js-game-loader-block","1000","0.0001","ks_counter","p","timer","()=>r(","15000","30000","zat_tick","/_events/","/mpsuadv\\.ru/","doubleclick.net","(clearInterval(e)","clientHeight","replaceWith","250","Adblock","X-Set-Adblock","_modal","adBlockEnabled","adblock","alert","antyadb","5000","apply","2000","blocker","doAd","evercookie","300000","getCookie","3000","getElementBy","getVisibleDivs","300","initServices","is_adblock","removeJuristicNotification","saa","tie-popup-adblock","toUTCString","window.location.reload","/ad\\.mail|adfox|adhigh|adriver|mc\\.yandex|mediametrics|otm-r|static-mon/","/br/","/getCode|\\/vast/","/hits/event/","method:POST","/m2?_","/wl-analytics\\.tsp\\.li/","livejournal.com/video/check?recordId=","method:GET","strm.yandex.ru/get/","ShadowRoot","showRedirectPopup","&origin_type=rtb","url:/rutube.ru/api/tags/video/","/stats/bulk|stats/pixels|zen_audit/","_rsc=","autoplay","[data-video-player=\"small\"]","stay","video","autoplay|loop",".watch-live__link > video","class",".js-video-box__container","data-autoplay","disabled",".uk-modal-footer > button","oncontextmenu","[class]","oncontextmenu|oncopy|onselectstart","onmousedown|unselectable|onselectstart|oncontextmenu",".noselect","ADV_DISABLED","true","Clicks._test_meta_referer","null","Object.prototype.AdChoices","Object.prototype.AdvObject","noopFunc","Object.prototype.AdvertisementManager","Object.prototype.BlockRenderSteps","Object.prototype.IS_CHECK_REGISTRATION","false","Object.prototype.MediaReady","Object.prototype.PLAYED","Object.prototype._currentAgeRestriction","Object.prototype.adblockSettings","Object.prototype.addRedirects","Object.prototype.advert","Object.prototype.advertObject","Object.prototype.advertsByUrl","Object.prototype.afg","Object.prototype.amp","Object.prototype.autoPlay","Object.prototype.autoPopups","Object.prototype.autostart","Object.prototype.branding","Object.prototype.changeVisible","Object.prototype.createBannerItem","Object.prototype.detect","Object.prototype.detectAdblock","Object.prototype.detectBlockAds","Object.prototype.disableAutoplay","Object.prototype.disablePaste","Object.prototype.disableSeek","Object.prototype.disableSelection","Object.prototype.getAutoplay","Object.prototype.getUaasConfig","Object.prototype.initialAutoplay","Object.prototype.livetv-state","Object.prototype.manualAutoplay_","Object.prototype.minPlayingVisibleHeight","Object.prototype.onIntersected","Object.prototype.partnerId","{}","Object.prototype.playVideo","Object.prototype.readMore","PageBottomBanners","String.fromCharCode","trueFunc","Unauthorized2","adBlock","adsenseIsLoaded","app.book.external","cadb","clicks","2","countdownNum","0","g_GazetaNoExchange","history.replaceState","isAdFree","localStorage.localstorageGameData","main_air_closed","navigator.sendBeacon","noAdsAtAll","pl.getParams.isPlay","player.options.scroll","playerOptions.behaviour.autoPlay","player_options.autoplay","portal.isRedirectToYandexSearchAfterDownloadEnabled","timeEnd","1","top100Counter","window.EUMP.plugins.antiblock","window.ab","window.c","4","/tutad\\.ru/","about:blank","debugger","/contextmenu|copy|keydown|selectstart/","Object.prototype.preroll","click_time","__require","/clickunder/","Object.prototype.ads/mobiads","AMSP.loadAsset","_0x","mousedown","pop.doEvent","ABNS","bc_blocks","Object.prototype.parallax","HelpProjectPromo","flashvars.protect_block","#timer","Object.prototype.dispatchSignalCallbacks","Object.prototype._prepareBannersList","blockWarnClass","mimicTopClass","__mediaTrend","TrendVideoArticle","globalAuthLoginPopupCounter","mailruEnabled","result.body.direct","/\\/apic\\//","&pgid=","NO_ADV","Object.prototype.autoPlayParams","Object.prototype.detectAdBlock","Object.prototype.enableMimic","Object.prototype.mimic","Object.prototype.obfuscateParams","Object.prototype.runMimic","Object.prototype.useMimic","__PHS._.props.html","document.title","mr._mimic.locator.transform","[].*.result.body","/click|destroy|mousedown/",".html-fishing","MIMIC_FORCE","_runBatch","100","Object.prototype.hasAdBlock","_app-","manualAutoplay","lastTick","onCanPlay","pause","video[class*=\"HLSPlayback_player\"]","u_global_data","Object.prototype.pauseSuggestions","Object.prototype.AdvertisingManager","Object.prototype.crossDomain","ecbrStart","captureContext","dispatchEvent","zoomdecorate","a[href^=\"/\"][data-router-link]","()=>n()","50","isDonatePage"];

const $scriptletArglists$ = /* 417 */ "0,0,1;0,0,2;0,0,3;0,0,4;0,0,5;0,0,6;0,0,7;0,0,8;0,0,9;0,10;0,10,11;0,12,13;0,14,15;0,16,17;0,18,19;0,11,20;0,21;0,22,23;0,24,25;0,26,27;0,28;0,28,29;0,28,30;0,28,31;0,28,11;0,28,32;0,28,33;0,28,34;0,35,36;0,37,38;0,39;0,40;0,41,42;0,43,15;0,44,45;0,46,47;0,48,49;0,50,51;0,52,53;0,54,15;0,55,56;1,57;1,58;1,59;1,60;1,61;1,62;1,63;1,64;1,65;1,66;1,67;1,68;1,69;1,70;1,71;1,72;1,73;1,74;1,75;1,76;1,77;1,78;1,79;1,80;1,81;1,82;1,16;1,83;1,84;1,85;1,86;1,87;1,88;1,89;1,90;1,91;1,92;1,93;1,94;1,95;1,96;1,97;1,98;1,11;1,99;1,100;1,101;1,102;1,103;1,104;1,26;1,105;1,35,106;1,39;1,107;1,108;1,109;1,110;1,40;1,111;1,112;1,113;1,114;1,115;1,116;1,117;1,118;1,119;1,120;1,121;1,122;1,123;1,124;1,125;1,126;1,127;1,128;1,129;1,130;1,131;1,132;1,133;1,134;1,135;1,136;1,137;1,138;1,139;1,140;1,141;1,142;1,143;1,144;1,145;1,146;1,147;1,148;1,149;1,150;1,151;1,152;2,153;2,27;2,154;2,24;2,155;2,39;2,109;2,112;2,156;2,157;3,158,159;3,160,161;3,162,163;3,164,165;3,28,166;3,35,167;3,156,168;4,169;4,170,171;4,172,173;4,174,175;4,174,176;4,177,178;4,19,179;4,19,180;4,19,181;4,19,182;4,19,183;4,19,184;4,19,185;4,19,186;4,187,188,189,190;4,187,188,189,191;4,187,188,189,192;4,187,188,189,193;4,187,194;4,187,195,189,196;4,187,197;4,187,198;4,199,200;4,199,117;4,199,201;4,199,202;4,203,204;4,205,188,189,206;4,207;4,208,209;4,208,210;4,211,212;4,213,214;4,215,216;4,215,217;4,215,218;4,215,9;4,219,220;5,221,222;6;7,223;7,224;7,225,226;7,227;7,228;7,229;7,230;7,231;7,232;8,233;8,234,188,235,236;8,237;8,238;8,239;9;9,240;9,241;9,242;9,243,244;9,245;9,246,247,248;9,249;9,250;9,251;5;5,252,253;5,188,254,248;5,251;5,255;10,256;10,257;10,258;11,259;11,260;11,126;11,261;12,188,262;12,209;12,263;12,264;12,265;12,266;12,267;12,268,253;12,269,270;12,271,272;12,273;12,274;12,275,276;12,277,278;12,279;12,280,281;12,282,270;12,283;12,284;12,285;12,134;12,286;12,287;12,288;13,289;13,290;13,291;13,292,293;13,294;13,295;13,296;13,297;13,298;14,299;14,27;4,187,300;10,301,302;10,303;10,304;15,305,306,307;15,305,308,307;15,309,310,307;15,309,308,307;15,311,312;15,313,308;15,314,315;15,316,317,307;15,318;15,319,320,307;16,321,322;16,323,324;16,325,45;16,326,327;16,328,45;16,329,45;16,330,331;16,332,327;16,333,324;16,334,324;16,335,45;16,336,327;16,337,324;16,337,45;16,338,324;16,339,45;16,340,322;16,341,327;16,342,331;16,342,324;16,343,45;16,160,331;16,160,324;16,344,327;16,345,45;16,346,327;16,347,324;16,348,327;16,349,327;16,350,327;16,351,322;16,352,331;16,353,327;16,354,327;16,355,327;16,356,45;16,357,324;16,358,322;16,359,324;16,360,327;16,361,45;16,362,363;16,364,327;16,365,45;16,366,45;16,367,368;16,369,45;16,370,331;16,371,322;16,372,324;16,373,331;16,374,375;16,376,377;16,378,322;16,379,327;16,380,327;16,381,188;16,382,322;16,383,327;16,384,363;16,385,324;16,386,331;16,387,331;16,388,331;16,389,331;16,390,391;16,392,331;16,393,327;16,394,331;16,395,396;17;17,397;17,398;11,399;4,400;16,401,45;4,19,402;0,403,404;16,405,45;0,37,406;12,407;4,408,409;1,410;1,411;3,412,55;0,17,173;2,413;16,414,188;9,415;16,416,45;16,417,45;0,0,418;0,0,419;0,420,421;1,422;2,423;7,424;10,425;13,426;16,427,391;16,428,331;16,429,45;16,430,327;16,431,45;16,432,45;16,433,327;16,434,327;16,435,363;16,436,324;16,437,45;7,438;4,439,188,189,440;12,441;12,442,443;16,444,324;1,155;3,158,445;16,342,363;3,158,446;12,447;3,158,448;4,449,188,189,450;1,451;16,452,45;16,160,45;16,453,327;3,454,455;4,219,456;0,457,458;4,187,188,189,459;12,460,461;16,444,331;4,19,462";

const $scriptletArglistRefs$ = /* 943 */ "176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;406;76;21;21;165,184;406;58,176,262,342,408;288;21;182,309,411;182,309,411;182,309,411;182,309,411;21;309,411;176,262,342,408;378,379,380,385,388;140,275;21;21;176,262,342,408;152;45,154,286,328,330,343,407;326;155,205;21;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;293,316,351;369,406;310;68,309;152,413;302,412;333;287,298;30;347;406;406;176,262,342,408;288;402;21;336;21;52,57,182,303,321;297;288;21;372;5;275;276;45,154,286,328,330,343,407;327,412;49;122;220;227,263;140;357;56;68;406;68;21;47,224,267,272,318,325;277;406;21;34;274;288;176,262,342,408;377,381,382,387,392,393,394;21;176,262,342,408;288;354;21;406;327,412;359,363;21;44,68,72,121,266;361,362;401,404,405;21;406;406;176,262,342,408;21;94;353;21;176,262,342,408;143;21;159,411;183;162;176,262,342,408;275;109;11;136;67;354;354;275,288;207;72,201;4;194,278,412;21,39;354;400,401;412;406;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;176,262,342,408;21;284;275;67;21;30;371;361,362;258;361,362;354;88,164;406;406;406;273;354;67;21;355;21;309,411;88,164;59,311;68,326;277,303,412;242;207;2;21;162;22;93;48,61,160,245;-378,-382,-383,-388,-393,-394,395,396,397,398,414,415;30;406;62;240;88,164;175;21;226;102,108,337,338,339,412;333;354;359,363;120;364;364;176,262,342,408;204;127;21;244;244;289;176,262,342,408;213;10;184,399;111;364;67;73;58,68,201,203;336;21;354;174;313;46;178,191,196,209,270,299;0;51;167,237;176,262,342,408;361,362;308;361,362;406;94,145,146,183;199;74;406;75;141;231;44;120;275,292;73;170;105;105;264;157;261;43,222;43,222;230;207;207;406;37;73;21;309;21;360;79;277;55,252;406;406;80,120;226;30;275;354;41;369;9;9;21;207;21;20;406;327,412;51;171;184,399;357,358,366;192;21;19;128;81;214;-382,-383,-388,389,-393,-394;267,325;21;23,69;23,69;-378,-382,-383,-388,-393,-394;269;356;412;21;367,368;365,369;309,411;166,181,350,412;42;333;65;88,198,236;21;120;56,197;68;369;354;179;216;333;354;309,411;262,342,408;118;37;73;62;144;309,411;174;-382,-383,-393,-394;183;21;21;407;73;354;315;184,399;369;369;87;21;21;406;406;141;141;133;43;354;-382,-383,-393,-394;189;190;30;302;116;21;21;112;106;223;324;37;359;14,23,161,187;21;77,103;129,147,148,149;406;21;63;60;60;60;21;37;43;300;222;406;9;213;183;128;21;67;365;13,17;43;218,317;301,411;207;136;309;354;184,399;281;281;120;208;30;-382,-383,-393,-394;86;30;412;215;107;213,280;21;23,69;184,399;132;309,411;406;235,268;51;9;9;21,136;369;369;30;369;16,92;406;61,238,296,334;174;44,70;21;56,197;65;21;68;250,275;354;365;82;64,135;28;177;354;354;182,321;309;21;73;279;354;406;62;176,262,342,408;-382,-383,-393,-394;406;207;243;153;218;21;21;134;222;406;21;222;309;21;120,221;68;135,228,285,410;206;21;202;213;213;354;406;239;15,172;43;114;111;283;-382,-383,-393,-394;105;-382,-383,-394;137;184,399;184,399;183;411;354;21;406;-382,-383,-393,-394;369;133;21;213;13,17;21;256;77,103;124;364;102,108,337,338,339,412;84,127;21;21;-382,-383,-393,-394;-382,-383,-393,-394;204;119;151;30;23;346;-382,-383,-393,-394;104;329;21;-382,-383,-393,-394;38;281;281;281;281;-382,-383,-393,-394;25,163,180;409;185,348;67;260;18,29,30,97;-382,-383,386,-388,391,-393,-394;21;406;111;9;223;-382,-383,-393,-394;9;336;336;336;65;369;120;21;406;321;21;188;364;364;364;21;30;354;354;354;327;160,319;105;213;184,399;147,148,149;354;377,386,-388;21;113,372;73;366;40,406;67,114;85;354;21;21;173;176,262,342,408;193;406;369;49;267,325;128;81;115,123,233,255;94;94;43;21;223;21;7;217;-382,-383,-393,-394;354;-382,-383,-388,-393,-394;66;21,136;-382,-383,-393,-394;6;406;-382,-383,-393,-394;140;406;140,312;128;232;10;21;406;329;84,91;333;-382,-383,-393,-394;406;54;54;406;139;220;-167,-182;21;251,332,358;136;21;406;309;130;104;281;21;302;128;406;21;11;21;406;21;37;145,183;125;257;354;226;406;-382,-383,-393,-394;403;150;406;406;295,340;106,168;21;185,348;406;354;370,416;140,156;24;51;21;91;406;272;219;241;354;73;67;111;269;288;21,322;380,-382,-383,-388,-393,-394;243;26;186,229;21;136;21,136;361,362;354;144;21,234;21,136;-167,-182,302,323;21;213;21;374;218;21;333;354;67;354;354;354;12,33;21;335;358;412;21;68;1;37;354;106,195,412;21;136;222;94;21;37;42;9;333;223;-382,-383,-393,-394;369;137;30;200;30;218;269;354;281;281;36;21;333;126;21;21;21;212;21;304;94;3;112;-382,-383,390,-393,-394;21;42;21;406;67;21;352;124;309;67;406;222;138,257,349;354;354;354;406;406;114,125;406;21;254;277;105;147,148,149;291,341;302;37;-382,-383,-393,-394;-378,-382,-383,-393,-394;21;406;21;354;354;44,70;-382,-383,-393,-394;144;112,169;223;21;184,399;314;249;-382,-383,386,-388,-393,-394;35;248;354;-382,-383,-393,-394;21;207;49,50,259;51,265;281;-182;333;-15,-24,-162,-188;406;271;58;275;106,168;128;222;364;360;369;21;354;354;31,282;176,262,342,408;30;68;277;247;51;44,70;-382,-383,386,-388,-393,-394;176,262,342,408;21;-382,-383,-393,-394;176,262,342,408,411;37;406;261;294;240;240;-382,-383,-393,-394;30;67;406;110;307;359;333;406;21;21,136;331,369;281;281;281;281;281;21;-378,-382,-383,-388,-393,-394,395,396,397,398;51;244;275;314;290;120;21;144;21;244;360;30;354;225,246;120;21;53,245,267,325;137;406;354;125;306,345;78;406;21,89,90,117;281;375,-382,-383,-393,-394;21;131;106,168;-180,210,211,344;68;406;21;44,70;406;83;406;288;369;27,142;21;358;253;223;106,168;37;354;106,168;21;21;21;8,32;354;373;222;222;94,95,96,97,98,100,101;106,168;-351;91;106,168;376;-382,-383,383,-393,-394;21;136;30;373;222;137;37;406;406;94;31,282;21;94,99,106;267,325;71;158;267,305,318,320,325;361,362;-382,-383,384,-393,-394;83;406;37;309,411;249;406;104";

const $scriptletHostnames$ = /* 943 */ ["14.ru","26.ru","29.ru","35.ru","43.ru","45.ru","48.ru","51.ru","53.ru","56.ru","59.ru","60.ru","63.ru","68.ru","71.ru","72.ru","74.ru","76.ru","86.ru","89.ru","93.ru","at.ua","bb.lv","ck.ua","cn.ua","cq.ru","do.am","e1.ru","k1.ua","kh.ua","kp.kg","kp.kz","kp.md","kp.ru","kr.ua","mk.ru","nn.ru","ok.ru","rg.ru","rv.ua","te.ua","v1.ru","vc.ru","vk.ru","vm.ru","ya.ru","zp.ua","116.ru","161.ru","164.ru","173.ru","178.ru","1tv.ru","3dn.ru","ati.su","dni.ru","dtf.ru","eda.ru","gdz.ru","ivi.ru","m-z.tv","m24.ru","moy.su","my1.ru","ngs.ru","ntn.ua","ntv.ru","ogo.ua","pb.wtf","prm.ua","rbc.ru","ren.tv","stb.ua","sud.ua","surl.*","tut.by","tv8.md","u24.ua","vk.com","wmj.ru","yap.ru","zab.ru","3mod.ru","4pda.to","80-e.ru","aniu.ru","auto.ru","baby.ru","clan.su","cont.ws","depo.ua","dzen.ru","film.ru","gals.md","grad.ua","gwss.ru","i-ua.tv","ictv.ua","izh1.ru","mail.ru","mind.ua","msk1.ru","novy.tv","oxax.tv","pg11.ru","pkrc.ru","quto.ru","rezka.*","risu.ua","sm.news","spac.me","tass.ru","uatv.ua","ucoz.ru","ucoz.ua","ufa1.ru","viva.ua","vost.pw","wdho.ru","womo.ua","ya62.ru","24pdd.ru","4mama.ua","7days.ru","aione.ru","biqle.ru","chita.ru","cnews.ru","dota2.ru","draug.ru","fakty.ua","fixx.one","hd24.pro","hd365.ws","inter.ua","kodik.cc","kufar.by","l2top.ru","lenta.ru","liga.net","mc.today","mir24.tv","motor.ru","narod.ru","ngs22.ru","ngs24.ru","ngs42.ru","ngs55.ru","ngs70.ru","np.pl.ua","peers.tv","protv.md","publy.ru","ratel.kz","saske.tv","smaxim.*","spcs.bio","sport.ua","strip2.*","tivix.co","tvapp.su","ucoz.com","ucoz.net","ucoz.org","ura.news","vecdn.pw","vibir.ru","vlast.kz","vmusi.ru","vnn24.ru","woman.ru","yootv.ru","24smi.org","3dnews.ru","afisha.ru","aqicn.org","ashdi.vip","asn.in.ua","beauty.ua","biqle.org","crast.net","dclans.ru","drive2.ru","e.mail.ru","ehlita.ru","elegos.ru","f1comp.ru","factor.ua","fm-app.ru","forbes.ru","fraza.com","freetp.ru","gazeta.ru","gdz.ninja","goool7.ws","hdrezka.*","hlamer.ru","howdyho.*","innal.top","ircity.ru","kanobu.ru","kinogo.eu","krymr.com","limehd.tv","litehd.tv","meteum.ai","mgorsk.ru","mixmuz.ru","mp3spy.cc","my-lib.ru","myjane.ru","naylo.top","nizhny.ru","ozlib.com","pikabu.ru","pirat.one","pl.com.ua","raes.tech","regnum.ru","retail.ru","rutor.org","rutube.ru","shaiba.kz","shakko.ru","sibnet.ru","sochi1.ru","spaces.im","sports.ru","strip2.co","ucoz.club","ufchgu.ru","uma.media","upload.ee","usite.pro","versia.ru","vsetut.su","websdr.su","www.e1.ru","xittv.net","xsport.ua","xstud.org","xv-ru.com","zazloo.ru","7ogorod.ru","adme.media","ai-next.ru","anidub.vip","anifap.com","anifap.xyz","animix.lol","aniqit.com","anivod.com","asia-tv.su","bilshe.com","bstudy.net","chas.cv.ua","dni.expert","dyvys.info","fap-guru.*","fearmp4.ru","filmpro.ru","fishki.net","fon-ki.com","for-gsm.ru","freehat.cc","freetp.org","gameout.ru","gfycat.com","hd24.watch","htmlweb.ru","huyamba.tv","imgbase.ru","imgcach.ru","inkorr.com","kodik.info","kop.net.ua","krolik.biz","krolmen.ru","letidor.ru","levik.blog","litnet.com","litruso.ru","liveball.*","m.lenta.ru","mi100.info","mod-wot.ru","moika78.ru","moj-pes.ru","muzlan.top","my.mail.ru","naydex.net","newsua.one","nnmclub.ro","nnmclub.to","o2.mail.ru","oligarx.uz","ontivi.net","passion.ru","pik.net.ua","porno365.*","pornoakt.*","radiokp.ru","rambler.ru","reactor.cc","resheba.me","rintor.net","ritsatv.ru","rusjev.com","saltday.ru","sdamgia.ru","selflib.me","sextor.org","shd247.com","smotrim.ru","sorokam.ru","spishi.fun","sport7.biz","sportkp.ru","starhit.ru","stoigr.org","stravy.net","studme.org","tagaev.com","tests24.su","the-day.ru","tproger.ru","tv.mail.ru","tva.org.ua","uainfo.org","unn.com.ua","vkvideo.ru","vuzlit.com","whd365.pro","www.mos.ru","x-libri.ru","xxxrip.net","xxxtor.com","zaruba.fun","zbirna.com","365news.biz","addfiles.ru","akkordam.ru","animedia.tv","animedub.ru","animekun.ru","anitokyo.tv","assiatv.com","biz.mail.ru","blackwot.ru","bonus-tv.ru","brigadtv.ru","cdnvideo.ru","city.ogo.ua","comments.ua","day.kyiv.ua","dorama.land","doramy.club","dp73.spb.ru","embed.rg.ru","f1ua.org.ua","fanserial.*","fastpic.org","fedpress.ru","footboom.kz","fssp.gov.ru","ftechedu.ru","gazeta1.com","gencit.info","gismeteo.by","gismeteo.kz","gismeteo.ru","glavpost.ua","glianec.com","hcdn.online","igroutka.ru","igrozoom.ru","igrul-ka.ru","imgclick.ru","infourok.ru","iptv.org.ua","itech.co.ua","itechua.com","its-kids.ru","kinoblin.ru","kinofen.net","kinofilm.co","kinokong.sk","kinonews.ru","kodikdb.com","kriminal.tv","ladys.media","limetvv.com","lit-web.net","lostfilm.tv","lostfilm.tw","lostpix.com","lumex.space","lyucifer.tv","mcs.mail.ru","medicina.ua","miyzvuk.net","moslenta.ru","mp3crown.cc","musify.club","myshared.ru","ngp-ua.info","nnm-club.me","novkniga.ru","nsportal.ru","ohotniki.ru","others.name","otzovik.com","periskop.su","picclick.ru","picclock.ru","pingvin.pro","piratam.net","piratca.net","pokazuha.ru","porn720.biz","pravvest.ru","psxworld.ru","razlozhi.ru","regnum.news","relax-fm.ru","reporter.ua","reshuent.ru","rintor.info","rivne.media","russian7.ru","rusvesna.su","s7yours.com","serialai.ru","shrlink.top","sinoptik.ua","skam.online","softonic.ru","sportbar.pm","sportbox.ws","sportrbc.ru","stopgame.ru","strana.news","studref.com","svoboda.org","telecdn.net","tes-game.ru","times.zt.ua","tolyatty.ru","top.mail.ru","torfiles.ru","tortuga.wtf","tragtorr.in","tvzvezda.ru","uakino.best","ukrrain.com","vchaspik.ua","vestivrn.ru","vip-mods.ru","vodopads.ru","volynua.com","warezok.net","womanhit.ru","wona.com.ua","wowskill.ru","www.goha.ru","www.ukr.net","znanija.com","1news.com.ua","1plus1.video","595.ucoz.net","5wip-file.ru","7streams.pro","a-point.info","allapteki.ru","allboxing.ru","anipoisk.org","asteriatm.ru","astrakhan.ru","author.today","auto.mail.ru","autonevod.ru","blog.mail.ru","bombardir.ru","bookdream.ru","booksreed.ru","carservic.ru","cdn.viqeo.tv","cdnpotok.com","cvnews.cv.ua","db-energo.ru","deti.mail.ru","domahatv.com","doramakun.ru","expert.in.ua","file-mods.ru","filmisub.com","firtka.if.ua","flightsim.su","footboom.com","footlook.top","game4you.top","gazeta.press","gidonline.eu","glavnoe24.ru","greenpost.ua","help.mail.ru","horo.mail.ru","igromania.ru","it-actual.ru","kakprosto.ru","karateltv.ru","kg-portal.ru","kinescope.io","kino.mail.ru","kinozapas.co","korsars.info","kurskcity.ru","lady.mail.ru","livesport.ws","lostfilm.one","lostfilm.pro","lostfilm.uno","lostfilm.win","love.mail.ru","lrepacks.net","mail.ukr.net","megaprogz.ru","molitvy.guru","motorpage.ru","my-expert.ru","news.mail.ru","nnews.com.ua","omsimclub.ru","omskpress.ru","payforpic.ru","pes-files.ru","pets.mail.ru","picforall.ru","piratbit.fun","piratbit.org","piratbit.top","porngames.su","pornopuk.com","potokcdn.com","promin.cv.ua","radiodom.org","rbcrealty.ru","real-vin.com","romakatya.ru","rustorka.com","rustorka.net","rustorka.top","rvnews.rv.ua","samomdele.tv","sbautumn.com","sbsports.pro","sbstreams.ws","secretmag.ru","shedevrum.ai","shtrafsud.ru","sims3pack.ru","skanbooks.ru","southpark.su","sporting7.pw","sportmail.ru","strana.today","studizba.com","studwood.net","tapochek.net","techmusic.ru","tehnobzor.ru","terrikon.com","tv-assia.org","tverigrad.ru","ukranews.com","vedomosti.ru","voronezh1.ru","www.vesti.ru","xakevsoft.ru","xtorrent.net","yaplakal.com","yastatic.net","1informer.com","amazinghis.ru","anime-chan.me","animevost.org","animevost.top","anitokyo1.top","apnews.com.ua","autoinfo24.ru","avtodream.org","bez-smenki.ru","bitshare.link","bonus.mail.ru","boom365hd.com","calls.mail.ru","castle-tv.com","cikavosti.com","cloud.mail.ru","conversion.im","devdrivers.ru","dobro.mail.ru","doramatv.live","elektrosat.ru","examenpdd.com","fainaidea.com","fatcatslim.ru","fenglish.site","forpost.media","free-dream.ru","free-tor.info","friends.in.ua","gdzputina.net","gibdd.mail.ru","goldformat.ru","gorodrabot.by","gorodrabot.ru","greenflash.su","growhow.in.ua","iblitzmods.ru","id.rambler.ru","ifnews.org.ua","in-poland.com","informator.ua","inforpost.com","krasnickij.ru","lifehacker.ru","liveforums.ru","livesx.online","lostfilm.life","lvnews.org.ua","mania.gcdn.co","mediasat.info","megaclips.net","mistosumy.com","modsforwot.ru","moirebenok.ua","mow-portal.ru","mycompplus.ru","nashamama.com","newxboxone.ru","novozybkov.su","num-words.com","oneliketv.com","online-fix.me","only-paper.ru","otvet.mail.ru","patephone.com","phys-kids.com","pidru4nik.com","play-force.ru","playground.ru","pro-op.com.ua","procherk.info","programhub.ru","project-ss.ru","sblive.online","searchfloor.*","shadowcore.ru","shanson320.ru","shiro-kino.ru","showdream.org","simpsonsua.tv","soft-game.net","sportsdzen.ru","startgamer.ru","strategium.ru","stream365.pro","studbooks.net","svadba.expert","tambovnet.org","tehnar.net.ua","teleportal.ua","tenews.org.ua","touch.mail.ru","tragtorr.info","trainzland.ru","trychatgpt.ru","tverisport.ru","u-news.com.ua","uanews.org.ua","usersporn.com","vip7stream.pw","vita-water.ru","volyninfo.com","volynpost.com","vp.rambler.ru","vsviti.com.ua","wallegend.net","westnews.info","wildberries.*","win-lite.site","wworld.com.ua","zoobrilka.net","08sportbar.com","100popugaev.ru","777sportba.com","777sportba.org","777streams.pro","agroreview.com","agroter.com.ua","audioportal.su","autonews.co.ua","autorambler.ru","autotheme.info","avtovzglyad.ru","budport.com.ua","businessua.com","cdntvpotok.com","championat.com","cheline.com.ua","dialogs.org.ua","diplomsrazu.ru","doefiratv.info","dv-gazeta.info","f1analytic.com","fapreactor.com","freescreens.ru","gdz-putina.fun","gtavicecity.ru","health.mail.ru","hentai-mood.me","inforesist.org","itevonklass.ru","ivanovonews.ru","izmailovtv.xyz","kinogo-720.net","kvadratmetr.uz","live365tv.site","lostfilm.today","lostfilmtv.uno","marieclaire.ua","mega-music.pro","megaresheba.ru","moremania.info","nashbryansk.ru","novavlada.info","novynarnia.com","ohmywishes.com","panoptikon.org","partnerkin.com","payeer-gift.ru","penzainform.ru","players.com.ua","pogoda.mail.ru","poltava365.com","pornreactor.cc","portal.lviv.ua","pro-zakupki.ru","pro100hobbi.ru","profootball.ua","remont-aud.net","rplnews.online","russian.rt.com","samelectric.ru","sdr-deluxe.com","softomania.net","softportal.com","sport365hd.com","sport365hd.net","sporting77.com","stalker-gsc.ru","stalkermods.ru","sudya-dredd.ru","svadbatomsk.ru","telekritika.ua","testserver.pro","thelastupd.org","tophallclub.ru","turkcinema.org","tv-gubernia.ru","www.rambler.ru","24boxing.com.ua","3igames.mail.ru","account.mail.ru","asiaplustj.info","autosimgames.ru","autotema.org.ua","barsportbar.com","channels247.net","comedy-radio.ru","connect.mail.ru","doctorrouter.ru","doramaland.plus","dropmefiles.net","economistua.com","electrobooks.ru","embed.twitch.tv","ferr-um.ucoz.ru","finance.mail.ru","hardwareluxx.ru","hdkinoteatr.com","hdstream365.com","hi-tech.mail.ru","khersonline.net","kodikplayer.com","liveinternet.ru","livejournal.com","lostfilmtv.site","mail.rambler.ru","megaresheba.com","new.fastpic.org","newgames.com.ua","news.rambler.ru","nova.rambler.ru","obozrevatel.com","prokadry.com.ua","root-nation.com","ru-minecraft.ru","rustorkacom.lib","sex-studentki.*","sexitorrent.com","sport-kr.com.ua","sportabar01.com","spotless365.net","stalker-mods.su","sterlitamak1.ru","taynyeistiny.ru","tech.onliner.by","thelastdb.games","tradingview.com","vadimrazumov.ru","veseloeradio.ru","vfokuse.mail.ru","vladivostok1.ru","volnorez.com.ua","widgets.mail.ru","www.fontanka.ru","zdorovia.com.ua","all-for-kompa.ru","anidubonline.com","api-video.khl.ru","buhgalter.com.ua","buhgalter911.com","calendar.mail.ru","castle-serial.ru","coderlessons.com","elektronika56.ru","elitesnooker.com","embed.dugout.com","fanserialstv.net","gdzotputina.club","gloria-cedric.ru","golosinfo.com.ua","gorodkiev.com.ua","hentai-share.one","lostfilmtv1.site","lostfilmtv2.site","lostfilmtv3.site","lostfilmtv4.site","lostfilmtv5.site","news24today.info","octavius.mail.ru","olegmakarenko.ru","pervyi-tv.online","platformcraft.ru","player.twitch.tv","player.vgtrk.com","prostoporno.help","radiosvoboda.org","ranobe-novels.ru","rivnenews.com.ua","russia-tv.online","seks-studentki.*","sorvigolovatv.ru","sportsite777.com","tv-kanali.online","uploadimagex.com","volyninfa.com.ua","www.kinopoisk.ru","www.xcom-shop.ru","zona-stalkera.ru","08sportbar.online","bryansknovosti.ru","eagleplatform.com","electric-house.ru","fukushima-news.ru","kolizhanka.com.ua","lostfilm.download","minigames.mail.ru","odessa-life.od.ua","onlineclass.space","oplatforma.com.ua","player.smotrim.ru","pogoda.onliner.by","pokatushki-pmr.ru","pravdatutnews.com","radioromantika.ru","rocketdockfree.ru","sportanalytic.com","stalker-zone.info","starlight.digital","torrent-pirat.com","transkarpatia.net","tvoymalysh.com.ua","ukrainianwall.com","vseinstrumenti.ru","dropmefiles.com.ua","dzplatforma.com.ua","footballgazeta.com","live-stream365.com","oblikbudget.com.ua","planetanovosti.com","podpricelom.com.ua","politnavigator.net","positiverecords.ru","sportbarchik88.com","translate.yandex.*","windows-driver.com","windows-driver.net","xn--b1aew.xn--p1ai","buhplatforma.com.ua","comments.rambler.ru","gra-prestoliv.in.ua","medplatforma.com.ua","mmminigames.mail.ru","okminigames.mail.ru","russianshowbiz.info","technoportal.com.ua","transformator220.ru","translate.yandex.ru","windows-program.com","comp-service.kiev.ua","football-ukraine.com","novospasskoe-city.ru","pohoronnoe-byuro.com","smotret-anime-365.ru","stalker-mods.clan.su","theageoffootball.com","turkish-tv-series.ru","widgets.kinopoisk.ru","forum.overclockers.ua","forums.rusmedserv.com","frontend.vh.yandex.ru","google-cloud.services","player-smotri.mail.ru","eurointegration.com.ua","online-supernatural.ru","footballtransfer.com.ua","portalvirtualreality.ru","stalker-2-2012.ucoz.net","xn--80aeshkkbdj.xn--p1ai","xn--80aikhbrhr.xn--j1amh"];

const $scriptletFromRegexes$ = /* 3 */ [];

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
