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

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const logPrefix = safe.makeLogPrefix('prevent-addEventListener', type, pattern);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const debug = shouldDebug(extraArgs);
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
        if ( debug === 1 && matchesBoth || debug === 2 && matchesEither ) {
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
        proxyApplyFn('document.addEventListener', proxyFn);
    }, extraArgs.runAt);
}

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
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
    const fetchProps = (src, out) => {
        if ( typeof src !== 'object' || src === null ) { return; }
        const props = [
            'body', 'cache', 'credentials', 'duplex', 'headers',
            'integrity', 'keepalive', 'method', 'mode', 'priority',
            'redirect', 'referrer', 'referrerPolicy', 'signal',
        ];
        for ( const prop of props ) {
            if ( src[prop] === undefined ) { continue; }
            out[prop] = src[prop];
        }
    };
    const fetchDetails = args => {
        const out = {};
        if ( args[0] instanceof self.Request ) {
            out.url = `${args[0].url}`;
            fetchProps(args[0], out);
        } else {
            out.url = `${args[0]}`;
        }
        fetchProps(args[1], out);
        return out;
    };
    proxyApplyFn('fetch', function fetch(context) {
        const { callArgs } = context;
        const details = fetchDetails(callArgs);
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 17 */
[preventSetTimeout,setConstant,addEventListenerDefuser,preventXhr,abortOnPropertyRead,preventFetch,abortCurrentScript,abortOnStackTrace,abortOnPropertyWrite,noWindowOpenIf,removeAttr,adjustSetInterval,m3uPrune,jsonPrune,preventSetInterval,noEvalIf,adjustSetTimeout];

const $scriptletArgs$ = /* 200 */ ["0===o.offsetLeft&&0===o.offsetTop","adblock.check","noopFunc",".offsetHeight === 0","load","/adblock/i","adBlock","adBlockDetected","App.detectAdBlock","adsbygoogle","canRunAds","true","pagead2.googlesyndication.com","adblockmesaj","adblockalert","AdBlock","offsetParent","EventTarget.prototype.addEventListener",".height();","ad_block_detected","eyeOfErstream.detectedBloke","falseFunc","/advert.js","$('body').empty().append","https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","static.doubleclick.net/instream/ad_status.js","kanews-modal-adblock","5000","XV","tie.ad_blocker_disallow_images_placeholder","undefined","/assets/js/prebid","detectedAdBlock","eazy_ad_unblocker_msg_var","","www3.doubleclick.net","detector_active","adblock_active","false","document.addEventListener","/abisuq/","adBlockRunning","$","adblock","detectAdBlock","adb","!document.getElementById(btoa","maari","adBlockEnabled","/div#gpt-passback|playerNew\\.dispose\\(\\)/","doubleclick.net","kan_vars.adblock","hasAdblock","AdblockDetector","arlinablock","adblockCheckUrl","adservice","{}","jQuery.adblock","koddostu_com_adblock_yok","null","document.querySelector","window.onload","ad_killer","adsBlocked","adregain_wall","rTargets","rInt","puShown","isShow","initPu","initAd","click","checkTarget","initPop","oV1","Object.prototype.isAdMonetizationDisabled","/img[\\s\\S]*?\\.gif/","document.write","_blank","app.ads","openRandomUrl","openPopup","popURL","wpsaData","style","#episode","after-ads","*","0.001",".hit.gemius.","data-money","div[data-money]","data-href","span[data-href^=\"https://ensonhaber.me/\"]","money--skip","0.02","pop_status","AdmostClient","/cdn\\.net\\/.*\\/ad\\//","/daioncdn\\.net\\/.*\\.m3u8/","sagAltReklamListesi","S_Popup","2","loadPlayerAds","trueFunc","reklamsayisi","0","reklam","productAds","spotxchange.com","volumeClearInterval","clicked","adSearchTitle","wt()","100","ads","popundr","placeholder","input[id=\"search-textbox\"]","showPop","yeniSekmeAdresi","initDizi",".addClass('getir')","HBiddings.vastUrl","flipHover","bit.ly","initOpen","#myModal","loadBrands","maxActive","rg","sessionStorage.getItem","Object.prototype.video_ads","Object.prototype.ads_enable","td_ad_background_click_link","wpsite_clickable_data","advert","/ads/","jsPopunder","start","1","popup","openHiddenPopup","DOMContentLoaded","popupLastOpened","window.open","message","localStorage","jwSetup.advertising","disabled","button#skipBtn","lastOpened","/reklam/i","href","div[class^=\"swiper-\"] > a[href^=\"https://www.sinpasyts.com/\"]",".swiper-pagination > a[href=\"null\"]","isFirstLoad","checkAndOpenPopup","/hlktrpl.cfd\\/\\w+.xml/","Popunder","popupInterval","window.config.adv.enabled","doOpen","popURLs","edsiga.com","manset_adv_imp","var adx =","popupShown","jsAd","document.createElement","/\\.src=[\\s\\S]*?getElementsByTagName/","adsConfig","PopBanner","config.adv","getLink","data-front","#tv-spoox2","adx","a[href^=\"https://www.haber7.com/advertorial/\"].headline-slider-item",".slick-dots > li > a[href^=\"https://www.haber7.com/advertorial/\"]","config.advertisement.enabled","config.adv.enabled","window.advertisement.states.activate","popns","videotutucu","onPopUnderLoaded","player.vroll","getFrontVideo","sec--","loading","iframe[loading=\"lazy\"]","timeleft","window.config.advertisement.0.enabled","reklam_1","#rekgecyen","/filmizletv\\..*\\/uploads\\/Psk\\//","video_shown","reklam_","ifrld"];

const $scriptletArglists$ = /* 173 */ "0,0;1,1,2;0,3;2,4,5;0,6;1,7,2;1,8,2;0,9;1,10,11;3,12;4,13;0,14;5,12;0,15;0,16;6,17,18;0,19;1,20,21;3,22;0,23;5,24;3,25;0,26,27;4,28;1,29,30;5,31;4,32;1,33,34;5,35;1,36,11;1,37,38;6,39,40;1,41,38;6,42,43;4,44;1,45,38;6,42,46;1,47,2;1,48,38;0,49;5,50;1,51,30;1,52,38;1,53,30;6,17,54;1,55,34;1,56,57;1,58,38;1,59,60;7,61,62;6,17,63;1,43,38;4,64;8,65;4,66;8,67;1,68,11;1,69,11;4,70;4,71;2,72,73;4,74;4,75;1,76,11;0,77;6,78,79;1,80,57;8,81;4,82;8,83;9;1,84,30;10,85,86;11,87,88,89;6,78,90;10,91,92;10,93,94;11,95,34,96;4,97;1,98,2;12,99,100;4,101;1,102,103;1,104,105;1,106,107;11,108,88,96;13,109;3,110;1,111,107;1,112,11;1,113,34;0,114,115;13,116;2,72,117;10,118,119;2,72,120;8,121;4,122;14,123;1,124,34;14,125;9,126;1,127,30;6,42,128;6,129;13,85,130;1,131,2;6,132,108;1,133,2;1,134,38;1,135,34;4,136;11,137,88,89;6,42,138;4,139;1,140,141;1,142,2;2,72,143;2,144,143;2,144,145;15,146;2,147,148;1,149,30;10,150,151;2,72,152;2,72,153;10,154,155;10,154,156;1,157,38;2,72,82;2,34,158;3,159;6,17,160;6,39,161;1,162,107;4,163;8,164;6,163,165;1,166,2;2,144,167;1,168,11;0,169;6,170,171;1,172,57;1,173,30;1,174,57;8,175;1,116,57;10,176,177;8,178;10,154,179;10,154,180;1,181,38;1,182,38;1,182,107;1,183,38;4,184;2,144,185;8,186;1,187,2;1,188,2;1,106,141;11,189,88,89;10,190,191;11,192,88,96;1,193,107;2,72,146;1,194,34;11,195,88,96;0,196;1,197,141;11,198,88,89;16,199,88,89";

const $scriptletArglistRefs$ = /* 1104 */ "56,58;54,55;56,58;56,59;172;119;0;56;71;136;56;56;17;56;12;134;8,58;161,162;56,75;63;80;92;80,99;28;56;56;117,118;71;56,97;56;56;172;56;6;150,151;2;112;134;80;103;80;12;12,37,38,39,40;56,62;142;56,73;56,73;1;24;58;80,87;122;56;67;56;70,132;42,43;102;116;15;64,65;56;139;69;56;95;80;107;56;56;58;56;135;58;71;56,161,162,172;131;16;56;10,21;35;96;36;36;56;56,58;56;80;120;92;56;62;80;41;56;56;58;58;56;61;58;56;56;56,161,162,167,168,169,172;56,84,85,172;161,162,172;70;83;141;30;98;47;56;145;25,26;80;80;56;89;56;36;80;160;160;160;160;160;160;160;160;160;160;160;104;10;56;59;80;56;113;56;58;56;56;56;56;56;56;56;121;56;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;159;58;147;56;56;56,70,75,77;56;23;60;56;58;121;56;0;10;140;80;56;136;11;70,148,149;70,82;134;45,46,80;56;32;32;56;50;56;80;56;138;80;134;134;110,111;49;70,140;88;56,114;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;56,170;74;9,27,56,70,129;135;59;57;163,164;70;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;56;12;80;12;71;71;71;71;71;71;71;71;71;71;71;71;71;71;71;135;135;135;135;135;135;135;135;135;135;135;135;135;135;135;135;135;135;135;135;91,94;58,70,129;76,100;70,130,136;70;56;58;172;58;56,161,162,172;56;56;172;59;59,78,96;134;52;1;123;134;158;56;56;2;56;70;60;56;56;31;57;57;57;57;57;57;57;57;57;57;57;57;57;57;57;57;57;56;58;126,127;58;154;154;154;154;154;154;154;154;154;154;154;15,158;80;133;70,124;93;56;140;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;56;60;134;105;134;134;0;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;18,19;3,4,5;70;101,110;56,59;56;58;56;56,75;58;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;57,145;22;57;57;57;57;57;57;57;57;57;57;57;57;144;58;70,149;68;72;0;58;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;56;56;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;167,168,169;56,167,168,169;167,168,169;167,168,169;56,84,85,161,162,172;81;172;56;156;156;156;156;51;33;58;56;7;68;57;57;57;57;57;57;57;57;57;57;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;165,166;137;115;1;153;153;153;153;153;153;153;153;153;153;58,70;12;58;9;125;56;128;158;61;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;156;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;58;56;157;157;157;157;157;157;157;157;157;56;56;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;152;53;56;134;7;56;58;57;29;121;0;56,61;79;134;56;56;161,162,172;61,66;161,162,172;135;161,162;157;157;157;157;157;157;157;157;157;157;157;10;0;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;56,171;70;56;59;59;70;56;56;56;58;60;60;106;146;56;56,60;134;8;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;0;56;20;56;48;60;60;0;56;108,109;12;145;56;59;66;56;7;56;56;56;59;57;56;34;134;134;134;134;134;134;134;134;134;134;134;134;134;134;134;134;134;134;134;134;48;56;59;59;58;70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;56,70;13,14;61;59;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;56;143;90;59;56;47;31;125;155;155;155;155;155;155;155;155;155;155;155;155;155;155;155;155;155;155;155;155;83;86;56;56;56;56;56;44;58;56;152;56;56;56;56;56;56;56";

const $scriptletHostnames$ = /* 1104 */ ["anizm.*","r10.net","anizle.*","diziyo.*","sinema.*","ag2m4.cfd","azbuz.org","dafflix.*","dizilla.*","dizimag.*","dizimov.*","dizipal.*","exxen.com","hdfilm.us","nedir.org","pages.dev","promy.pro","sinema.cx","sinepal.*","sporx.com","tabii.com","trstx.org","atv.com.tr","bikifi.com","dizicaps.*","dizimag.eu","dizipala.*","diziroll.*","diziyou.co","filmfc.com","filmhe.com","filmizle.*","filmjr.org","haber3.com","haber7.com","isgfrm.com","itemci.com","justintv.*","kanal7.com","kenttv.net","ntv.com.tr","ogznet.com","puhutv.com","shirl.club","sinefil.tv","tafdi3.com","tafdi4.com","teknop.net","tgyama.com","trfilm.net","tv8.com.tr","vidlax.xyz","volsex.com","yeppuu.com","zarize.com","animeler.me","cnnturk.com","contentx.me","diziall.com","dizifon.com","dizigom1.tv","dizikorea.*","dizipal.org","dizipia.com","dizirex.com","dizirix.net","dmax.com.tr","duzcetv.com","efendim.xyz","filmcus.com","filmcuss.cc","filmgo1.com","filmizle.cx","filmjr2.org","filmmodu.co","hdfilmcix.*","hlktrpl.cfd","intekno.net","izlekolik.*","mangawt.com","miuitr.info","mixizle.com","osxinfo.net","otopark.com","pembetv18.*","puffytr.com","tranimaci.*","trtizle.com","turkanime.*","vipifsa.com","zerotik.com","altporno.xyz","aspor.com.tr","coinotag.com","cristal.guru","diziboxx.com","diziday1.com","dizimax2.com","dizimore.com","diziwatch.tv","dolufilm.org","erotikgo.com","filmcusx.com","filmizletv.*","fullhdfilm.*","fullhdizle.*","izleorg3.org","izlesene.com","joymaxtr.com","karnaval.com","nowtv.com.tr","oyungibi.com","playerzz.xyz","pllsfored.co","sozcu.com.tr","teve2.com.tr","tlctv.com.tr","turkaliz.com","turkanime.co","turkifsa.xyz","turkrock.com","tv8bucuk.com","tvboff10.com","tvboff11.com","tvboff12.com","tvboff13.com","tvboff14.com","tvboff15.com","tvboff16.com","tvboff17.com","tvboff18.com","tvboff19.com","tvboff20.com","ulker.com.tr","vidtekno.com","zzerotik.com","720pizleme.cc","ahaber.com.tr","arrowizle.com","bizimyaka.com","burdenfly.com","dipfilmizle.*","dizikral.club","dizikral.live","dizikral1.pro","dizikral2.pro","dizikral3.pro","dizikral4.pro","dizikral5.pro","dizilla40.com","dizipaltv.net","diziyou11.com","diziyou12.com","diziyou13.com","diziyou14.com","diziyou15.com","diziyou16.com","diziyou17.com","diziyou18.com","diziyou19.com","diziyou20.com","diziyou21.com","diziyou22.com","diziyou23.com","diziyou24.com","diziyou25.com","diziyou26.com","diziyou27.com","diziyou28.com","diziyou29.com","diziyou30.com","diziyou31.com","diziyou32.com","diziyou33.com","diziyou34.com","diziyou35.com","diziyou36.com","diziyou37.com","diziyou38.com","diziyou39.com","diziyou40.com","diziyou41.com","diziyou42.com","diziyou43.com","diziyou44.com","diziyou45.com","diziyou46.com","diziyou47.com","diziyou48.com","diziyou49.com","diziyou50.com","diziyoutv.com","domplayer.org","ediziizle.com","efullizle.com","elzemfilm.org","erotikjam.com","exceldepo.com","filmizlemax.*","filmizletv1.*","filmmoduu.com","flatscher.net","fluffcore.com","genelpara.com","gsmturkey.net","guzelfilm.com","haberturk.com","hdfilmizle.in","hdnetflix.net","inceleriz.com","izlekolik.org","jetfilmizle.*","justin-tv.org","kanald.com.tr","korkuseli.com","mangaship.com","mangaship.net","maxfilmizle.*","mordefter.com","pornoanne.com","showtv.com.tr","sinemaizle.co","sondakika.com","startv.com.tr","t24giris2.cfd","taraftarium.*","technopat.net","tekniknot.com","tranimaci.com","tranimeci.com","tranimeizle.*","trgoals11.top","trgoals12.top","trgoals13.top","trgoals14.top","trgoals15.top","trgoals16.top","trgoals17.top","trgoals18.top","trgoals19.top","trgoals20.top","trgoals21.top","trgoals22.top","trgoals23.top","trgoals24.top","trgoals25.top","trgoals26.top","trgoals27.top","trgoals28.top","trgoals29.top","trgoals30.top","trgoals31.top","trgoals32.top","trgoals33.top","trgoals34.top","trgoals35.top","trgoals36.top","trgoals37.top","trgoals38.top","trgoals39.top","trgoals40.top","trgoals41.top","trgoals42.top","trgoals43.top","trgoals44.top","trgoals45.top","trgoals46.top","trgoals47.top","trgoals48.top","trgoals49.top","trgoals50.top","ulketv.com.tr","uzaymanga.com","vkfilmizlee.*","vkfilmizlet.*","webteizle.xyz","yabancidizi.*","youtubemp3.us","zeustv109.com","zeustv110.com","zeustv111.com","zeustv112.com","zeustv113.com","zeustv114.com","zeustv115.com","zeustv116.com","zeustv117.com","zeustv118.com","zeustv119.com","zeustv120.com","zeustv121.com","zeustv122.com","zeustv123.com","zeustv124.com","zeustv125.com","zeustv126.com","zeustv127.com","zeustv128.com","asfilmizle.com","bafrahaber.com","beyaztv.com.tr","dentalilan.com","dizipal12.site","dizipal13.site","dizipal14.site","dizipal15.site","dizipal16.site","dizipal17.site","dizipal19.site","dizipal21.site","dizipal22.site","dizipal23.site","dizipal24.site","dizipal25.site","dizipal26.site","dizipal27.site","dizipal28.site","dizipalx54.com","dizipalx55.com","dizipalx56.com","dizipalx57.com","dizipalx58.com","dizipalx59.com","dizipalx60.com","dizipalx61.com","dizipalx62.com","dizipalx63.com","dizipalx64.com","dizipalx65.com","dizipalx66.com","dizipalx67.com","dizipalx68.com","dizipalx69.com","dizipalx70.com","dizipalx71.com","dizipalx72.com","dizipalx73.com","eksisozluk.com","eldermanga.com","ensonhaber.com","epikplayer.xyz","erosfilmizle.*","erotikfimm.com","erotikhoot.com","filmizleplus.*","filmzevkim.com","fullfilmizle.*","geziforumu.com","hdfilmizle.org","hdfilmsitesi.*","hdfreeizle.com","hdmixfilim.com","justintvde.com","kanalmaras.com","ozgunbilgi.com","pandaspor.live","selcuksports.*","seyredeger.com","sinekolikk.com","sinemangoo.org","sinematurk.com","sinetiktok.com","videojs.online","videoseyred.in","vizyon18tv.com","vkfilmizle.net","vknsorgula.net","webteizle.info","webteizle1.xyz","webteizle2.xyz","webteizle3.com","webteizle3.xyz","webteizle4.com","webteizle4.xyz","webteizle5.com","webteizle5.xyz","webteizle6.com","webteizle6.xyz","webteizle7.com","webteizle7.xyz","webteizle8.com","webteizle8.xyz","webteizle9.com","webteizle9.xyz","yavuzfilmm.com","zerotiktok.com","aydinlik.com.tr","bamfilmizle.com","betivotv156.com","betivotv157.com","betivotv158.com","betivotv159.com","betivotv160.com","betivotv161.com","betivotv162.com","betivotv163.com","betivotv164.com","betivotv165.com","betivotv166.com","birasyadizi.com","bloomberght.com","cizgivedizi.com","dizipal.website","eescobarvip.com","erotikkizle.com","filmdizibox.com","filmizletv3.com","filmizletv4.com","filmizletv5.com","filmizletv6.com","filmizletv7.com","filmizletv8.com","filmizletv9.com","filmkuzusu1.com","filmmakinesi1.*","hayrirsds24.cfd","ifsamerkezi.com","inattvgiris.pro","justintvsh.baby","kriptoradar.com","kuponuna476.top","kuponuna477.top","kuponuna478.top","kuponuna479.top","kuponuna480.top","kuponuna481.top","kuponuna482.top","kuponuna483.top","kuponuna484.top","kuponuna485.top","kuponuna486.top","kuponuna487.top","kuponuna488.top","kuponuna489.top","kuponuna490.top","kuponuna491.top","kuponuna492.top","kuponuna493.top","kuponuna494.top","kuponuna495.top","kuponuna496.top","kuponuna497.top","kuponuna498.top","kuponuna499.top","kuponuna500.top","kuponuna501.top","kuponuna502.top","kuponuna503.top","kuponuna504.top","kuponuna505.top","kuponuna506.top","kuponuna507.top","kuponuna508.top","kuponuna509.top","kuponuna510.top","kuponuna511.top","kuponuna512.top","kuponuna513.top","kuponuna514.top","kuponuna515.top","kuponuna516.top","kuponuna517.top","kuponuna518.top","kuponuna519.top","kuponuna520.top","kuponuna521.top","kuponuna522.top","kuponuna523.top","kuponuna524.top","kuponuna525.top","kuponuna526.top","kuponuna527.top","kuponuna528.top","kuponuna529.top","kuponuna530.top","kuponuna531.top","kuponuna532.top","kuponuna533.top","kuponuna534.top","kuponuna535.top","kuponuna536.top","kuponuna537.top","kuponuna538.top","kuponuna539.top","kuponuna540.top","kuponuna541.top","kuponuna542.top","kuponuna543.top","kuponuna544.top","kuponuna545.top","kuponuna546.top","kuponuna547.top","kuponuna548.top","kuponuna549.top","kuponuna550.top","kuponuna551.top","kuponuna552.top","kuponuna553.top","kuponuna554.top","kuponuna555.top","kuponuna556.top","kuponuna557.top","kuponuna558.top","kuponuna559.top","kuponuna560.top","kuponuna561.top","kuponuna562.top","kuponuna563.top","kuponuna564.top","kuponuna565.top","kuponuna566.top","kuponuna567.top","kuponuna568.top","kuponuna569.top","merlinscans.com","movietube32.xyz","pchocasi.com.tr","sinemakolik.net","sinemakolik.org","sinemakolix.com","sinemakolix.net","siyahfilmizle.*","tenshimanga.com","trgoals1471.xyz","trgoals1472.xyz","trgoals1473.xyz","trgoals1474.xyz","trgoals1475.xyz","trgoals1476.xyz","trgoals1477.xyz","trgoals1478.xyz","trgoals1479.xyz","trgoals1480.xyz","trgoals1481.xyz","trgoals1482.xyz","trgoals1483.xyz","trgoals1484.xyz","trgoals1485.xyz","trgoals1486.xyz","trgoals1487.xyz","trgoals1488.xyz","trgoals1489.xyz","trgoals1490.xyz","trgoals1491.xyz","trgoals1492.xyz","trgoals1493.xyz","trgoals1494.xyz","trgoals1495.xyz","trgoals1496.xyz","trgoals1497.xyz","trgoals1498.xyz","trgoals1499.xyz","trgoals1500.xyz","trgoals1501.xyz","trgoals1502.xyz","trgoals1503.xyz","trgoals1504.xyz","trgoals1505.xyz","trgoals1506.xyz","trgoals1507.xyz","trgoals1508.xyz","trgoals1509.xyz","trgoals1510.xyz","trgoals1511.xyz","trgoals1512.xyz","trgoals1513.xyz","trgoals1514.xyz","trgoals1515.xyz","trgoals1516.xyz","trgoals1517.xyz","trgoals1518.xyz","trgoals1519.xyz","trgoals1520.xyz","trgoals1521.xyz","trgoals1522.xyz","trgoals1523.xyz","trgoals1524.xyz","trgoals1525.xyz","trgoals1526.xyz","trgoals1527.xyz","trgoals1528.xyz","trgoals1529.xyz","trgoals1530.xyz","trgoals1531.xyz","trgoals1532.xyz","trgoals1533.xyz","trgoals1534.xyz","trgoals1535.xyz","trgoals1536.xyz","trgoals1537.xyz","trgoals1538.xyz","trgoals1539.xyz","trgoals1540.xyz","trgoals1541.xyz","trgoals1542.xyz","trgoals1543.xyz","veryansintv.com","webteizle.click","webteizle1.info","webteizle10.com","webteizle10.xyz","webteizle2.info","webteizle3.info","webteizle4.info","webteizle5.info","webteizle6.info","webteizle7.info","webteizle8.info","webteizle9.info","yeniasya.com.tr","zipfilmizle.com","4kfilmizlesene.*","afroditscans.com","asyadiziizle.com","bakimlikadin.net","balfilmizle2.org","belestepe701.sbs","belestepe702.sbs","belestepe703.sbs","belestepe704.sbs","belestepe705.sbs","belestepe706.sbs","belestepe707.sbs","belestepe708.sbs","belestepe709.sbs","belestepe710.sbs","belestepe711.sbs","belestepe712.sbs","belestepe713.sbs","belestepe714.sbs","belestepe715.sbs","belestepe716.sbs","belestepe717.sbs","belestepe718.sbs","belestepe719.sbs","belestepe720.sbs","bumfilmizle1.com","filmerotixxx.com","filmizletv10.com","filmizletv11.com","filmizletv12.com","filmizletv13.com","filmizletv14.com","filmizletv15.com","filmizletv16.com","filmizletv17.com","filmizletv18.com","filmizletv19.com","filmizletv20.com","fullhdfilmizle.*","goodfilmizle.com","hdfilmizlesene.*","hdfilmizletv.net","hentaizm6.online","hentaizm7.online","hentaizm8.online","hentaizm9.online","klavyeanaliz.org","okultanitimi.net","sinemadafilm.com","sinemadelisi.com","teknoinfo.com.tr","webdramaturkey.*","webteizle1.click","webteizle10.info","webteizle2.click","webteizle3.click","webteizle4.click","webteizle5.click","webteizle6.click","webteizle7.click","webteizle8.click","webteizle9.click","xyzsports173.xyz","xyzsports174.xyz","xyzsports175.xyz","xyzsports176.xyz","xyzsports177.xyz","xyzsports178.xyz","xyzsports179.xyz","xyzsports180.xyz","xyzsports181.xyz","xyzsports182.xyz","xyzsports183.xyz","xyzsports184.xyz","xyzsports185.xyz","xyzsports186.xyz","xyzsports187.xyz","xyzsports188.xyz","xyzsports189.xyz","xyzsports190.xyz","xyzsports191.xyz","xyzsports192.xyz","xyzsports193.xyz","xyzsports194.xyz","xyzsports195.xyz","xyzsports197.xyz","xyzsports198.xyz","xyzsports199.xyz","xyzsports200.xyz","asyaanimeleri.com","aydindenge.com.tr","beceriksizler.net","bosssports214.com","bosssports215.com","bosssports216.com","bosssports217.com","bosssports218.com","bosssports219.com","bosssports220.com","bosssports221.com","bosssports222.com","bosssports223.com","breakingbadizle.*","discordsunucu.com","erotizmvadisi.com","forumchess.com.tr","fullfilmcibaba.nl","fullhdfilmmodu2.*","hdfilmcehennemi.*","hdfilmizleamk.net","hdfilmizlesen.com","hentaizm10.online","hentaizm11.online","hentaizm12.online","hentaizm13.online","hentaizm14.online","hentaizm15.online","hentaizm16.online","hentaizm17.online","hentaizm18.online","hentaizm19.online","hentaizm20.online","hentaizm21.online","hentaizm22.online","hentaizm23.online","hentaizm24.online","hentaizm25.online","inattvizle199.top","inattvizle200.top","inattvizle201.top","inattvizle203.top","inattvizle204.top","inattvizle205.top","inattvizle206.top","inattvizle207.top","inattvizle208.top","inattvizle209.top","inattvizle210.top","inattvizle211.top","inattvizle212.top","inattvizle213.top","inattvizle214.top","inattvizle215.top","inattvizle216.top","inattvizle217.top","jetfilmizletv.net","kelebekfilmm1.com","klasikfilmler1.cc","klasikfilmler2.cc","klasikfilmler3.cc","klasikfilmler4.cc","klasikfilmler5.cc","klasikfilmler6.cc","klasikfilmler7.cc","klasikfilmler8.cc","klasikfilmler9.cc","kuzufilmizle1.com","macicanliizle.sbs","macizlevip741.sbs","macizlevip742.sbs","macizlevip743.sbs","macizlevip744.sbs","macizlevip745.sbs","macizlevip746.sbs","macizlevip747.sbs","macizlevip748.sbs","macizlevip749.sbs","macizlevip750.sbs","macizlevip751.sbs","macizlevip752.sbs","macizlevip753.sbs","macizlevip754.sbs","macizlevip755.sbs","macizlevip756.sbs","macizlevip757.sbs","macizlevip758.sbs","macizlevip759.sbs","macizlevip760.sbs","mactanmaca791.sbs","mactanmaca792.sbs","mactanmaca793.sbs","mactanmaca794.sbs","mactanmaca795.sbs","mactanmaca796.sbs","mactanmaca797.sbs","mactanmaca798.sbs","mactanmaca799.sbs","mactanmaca800.sbs","mactanmaca801.sbs","mactanmaca802.sbs","mactanmaca803.sbs","mactanmaca804.sbs","mactanmaca805.sbs","mactanmaca806.sbs","mactanmaca807.sbs","mactanmaca808.sbs","mactanmaca809.sbs","mactanmaca810.sbs","memoryhackers.org","royalfilmizle.com","selcuk-sports.com","sosyogaraj.com.tr","taraftariumxx.cfd","turkifsaalemi.com","webteizle10.click","wheel-size.com.tr","yabancidiziio.com","zamaninvarken.com","1080hdfilmizle.com","arsiv.mackolik.com","dmlstechnology.com","erotikfilmtube.com","filmifullizlet.com","filmizlehdfilm.com","filmizlehdizle.com","fullhdfilmizletv.*","hdfilmizlesene.net","hdfilmizlesene.org","klasikfilmler10.cc","klasikfilmler11.cc","klasikfilmler12.cc","klasikfilmler13.cc","klasikfilmler14.cc","klasikfilmler15.cc","klasikfilmler16.cc","klasikfilmler17.cc","klasikfilmler18.cc","klasikfilmler19.cc","klasikfilmler20.cc","komputerdelisi.com","korsanedebiyat.com","lorabettvhd68.shop","lorabettvhd69.shop","lorabettvhd70.shop","lorabettvhd71.shop","lorabettvhd72.shop","lorabettvhd73.shop","lorabettvhd74.shop","lorabettvhd75.shop","lorabettvhd76.shop","lorabettvhd77.shop","lorabettvhd78.shop","lorabettvhd79.shop","lorabettvhd80.shop","lorabettvhd81.shop","lorabettvhd82.shop","lorabettvhd83.shop","lorabettvhd84.shop","lorabettvhd85.shop","lorabettvhd86.shop","lorabettvhd87.shop","papazsports842.pro","papazsports843.pro","papazsports844.pro","papazsports845.pro","papazsports846.pro","papazsports847.pro","papazsports848.pro","papazsports849.pro","papazsports850.pro","papazsports851.pro","papazsports852.pro","papazsports853.pro","papazsports854.pro","papazsports855.pro","papazsports856.pro","papazsports857.pro","papazsports858.pro","papazsports859.pro","papazsports860.pro","papazsports861.pro","player.filmizle.in","sinemafilmizle.net","superfilmgeldi.biz","superfilmgeldi.net","turkerotikfilm.com","yabancidizibax.com","yabancidizilertv.*","yabancidizivip.com","yenierotikfilm.xyz","720pfilmizleme1.com","720pfilmizletir.com","edebiyatdefteri.com","erotikhdfilmx3.shop","filmseyretizlet.net","hdfilmcehennem.live","hudsonlegalblog.com","iddaaorantahmin.com","justintvizle550.top","justintvizle551.top","justintvizle552.top","justintvizle553.top","justintvizle554.top","justintvizle555.top","justintvizle556.top","justintvizle557.top","justintvizle558.top","justintvizle559.top","justintvizle560.top","justintvizle561.top","justintvizle562.top","justintvizle563.top","justintvizle564.top","justintvizle565.top","justintvizle566.top","justintvizle567.top","justintvizle568.top","justintvizle569.top","mustafabukulmez.com","onlinefilmizle.site","raindropteamfan.com","sexfilmleriizle.com","turkdenizcileri.com","1080pfilmizletir.com","720pfilmizlesene.com","ankarakampkafasi.com","asyafanatiklerim.com","belgeselizlesene.com","boxofficeturkiye.com","buenosairesideal.com","filmifullizle.online","fullfilmizlebaba.com","fullfilmizlesene.net","fullhdfilmizlesene.*","menufiyatlari.com.tr","netfullfilmizle3.com","sinemadafilmizle.net","sinemadafilmizle.org","supernaturalizle.com","tekfullfilmizle5.com","tekparthdfilmizle.cc","telegramgruplari.com","beintvcanliizle52.com","beintvcanliizle53.com","beintvcanliizle54.com","beintvcanliizle55.com","beintvcanliizle56.com","beintvcanliizle57.com","beintvcanliizle58.com","beintvcanliizle59.com","beintvcanliizle60.com","beintvcanliizle61.com","beintvcanliizle62.com","beintvcanliizle63.com","beintvcanliizle64.com","beintvcanliizle65.com","beintvcanliizle66.com","beintvcanliizle67.com","beintvcanliizle68.com","beintvcanliizle69.com","beintvcanliizle70.com","beintvcanliizle71.com","bilgalem.blogspot.com","fullhdfilmcenneti.pro","fullhdfilmizleabi.com","fullhdfilmizlett1.com","guneykoresinemasi.com","hdselcuksports368.top","hdselcuksports420.top","hdselcuksports421.top","hdselcuksports422.top","hdselcuksports423.top","hdselcuksports424.top","hdselcuksports425.top","hdselcuksports426.top","hdselcuksports427.top","hdselcuksports428.top","hdselcuksports429.top","hdselcuksports430.top","hdselcuksports431.top","hdselcuksports432.top","hdselcuksports433.top","hdselcuksports434.top","hdselcuksports435.top","hdselcuksports436.top","hdselcuksports437.top","hdselcuksports438.top","hdselcuksports439.top","hdselcuksports440.top","hdselcuksports441.top","hdselcuksports442.top","hdselcuksports443.top","hdselcuksports444.top","hdselcuksports445.top","hdselcuksports446.top","hdselcuksports447.top","hdselcuksports448.top","hdselcuksports449.top","hdselcuksports450.top","hdselcuksports451.top","hdselcuksports452.top","hdselcuksports453.top","hdselcuksports454.top","hdselcuksports455.top","hdselcuksports456.top","hdselcuksports457.top","hdselcuksports458.top","hdselcuksports459.top","hdselcuksports460.top","hdselcuksports461.top","hdselcuksports462.top","hdselcuksports463.top","hdselcuksports464.top","hdselcuksports465.top","hdselcuksports466.top","hdselcuksports467.top","hdselcuksports468.top","hdselcuksports469.top","hdselcuksports470.top","hdselcuksports471.top","hdselcuksports472.top","sinnerclownceviri.com","yabancidiziizlesene.*","bettercallsaulizle.com","canlimacizlemax446.top","canlimacizlemax447.top","canlimacizlemax448.top","canlimacizlemax449.top","canlimacizlemax450.top","canlimacizlemax451.top","canlimacizlemax452.top","canlimacizlemax453.top","canlimacizlemax454.top","canlimacizlemax455.top","canlimacizlemax456.top","canlimacizlemax457.top","canlimacizlemax458.top","canlimacizlemax459.top","canlimacizlemax460.top","canlimacizlemax461.top","canlimacizlemax462.top","canlimacizlemax463.top","canlimacizlemax464.top","canlimacizlemax465.top","canlimacizlemax466.top","canlimacizlemax467.top","canlimacizlemax468.top","canlimacizlemax469.top","canlimacizlemax470.top","canlimacizlemax471.top","canlimacizlemax472.top","canlimacizlemax473.top","canlimacizlemax474.top","canlimacizlemax475.top","canlimacizlemax476.top","canlimacizlemax477.top","canlimacizlemax478.top","canlimacizlemax479.top","da95848c82c933d2.click","forum.donanimhaber.com","fullhdfilmizlepala.com","hdfilmcehennemizle.com","veterinerhekimleri.com","azsekerlik.blogspot.com","fullfilmcibabaizlet.com","goley90canlitv3003.site","goley90canlitv3004.site","goley90canlitv3005.site","goley90canlitv3006.site","goley90canlitv3007.site","goley90canlitv3008.site","goley90canlitv3009.site","goley90canlitv3010.site","goley90canlitv3011.site","goley90canlitv3012.site","goley90canlitv3013.site","goley90canlitv3014.site","goley90canlitv3015.site","goley90canlitv3016.site","goley90canlitv3017.site","goley90canlitv3018.site","goley90canlitv3019.site","goley90canlitv3020.site","goley90canlitv3021.site","goley90canlitv3022.site","nefisyemektarifleri.com","search.donanimhaber.com","tekparthdfilmizlesene.*","justintvx30.blogspot.com","justintvxx10.blogspot.com","turkcealtyazilipornom.com","justintvgiris.blogspot.com","kampanyatakip.blogspot.com","canlimacizlene.blogspot.com","taraftarium402.blogspot.com","cinque.668a396e58bcbc27.click","taraftariummdeneme.blogspot.com","sportboss-macizlesbs.blogspot.com","taraftarium24hdgiris1.blogspot.com","inattv-taraftarium24-macizle.blogspot.com","taraftarium24canli-macizlesene.blogspot.com","canli-mac-izle-taraftarium24-izle.blogspot.com","selcukspor-taraftarium24canliizle1.blogspot.com"];

const $hasEntities$ = true;
const $hasAncestors$ = true;

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

if ( todoIndices.size === 0 ) { return; }

// Collect arglist references
const todo = new Set();
{
    const arglistRefs = $scriptletArglistRefs$.split(';');
    for ( const i of todoIndices ) {
        for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
            todo.add(ref);
        }
    }
}

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
