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

// ruleset: annoyances-cookies

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets() {

/******************************************************************************/

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

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
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

function preventRequestAnimationFrame(
    needleRaw = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-requestAnimationFrame', needleRaw);
    const needleNot = needleRaw.charAt(0) === '!';
    const reNeedle = safe.patternToRegex(needleNot ? needleRaw.slice(1) : needleRaw);
    proxyApplyFn('requestAnimationFrame', function(context) {
        const { callArgs } = context;
        const a = callArgs[0] instanceof Function
            ? safe.String(safe.Function_toString(callArgs[0]))
            : safe.String(callArgs[0]);
        if ( needleRaw === '' ) {
            safe.uboLog(logPrefix, `Called:\n${a}`);
        } else if ( reNeedle.test(a) !== needleNot ) {
            callArgs[0] = function(){};
            safe.uboLog(logPrefix, `Prevented:\n${a}`);
        }
        return context.reflect();
    });
}

function trustedSetConstant(
    ...args
) {
    setConstantFn(true, ...args);
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 8 */
[abortOnPropertyRead,addEventListenerDefuser,setConstant,abortCurrentScript,abortOnPropertyWrite,preventRequestAnimationFrame,trustedSetConstant,preventSetTimeout];

const $scriptletArgs$ = /* 54 */ ["__cmpGdprAppliesGlobally","cookieconsent.Popup","load","function(){if(s.readyState==XMLHttpRequest.DONE","cicc.cookie_cat_statistic","true","config.requireCookieConsent","false","document.createElement","admiral","BrockmanAllowedCookies.targeting","BrockmanAllowedCookies.functional","FrodoPV","settings.consent","HB.CookieSettings.init","noopFunc","WHT.ShowConsentForm","trueFunc","CookiePolicy","{}","CookiePolicy.init","useGDPR","xv.disclaimer.displayCookiePopup","Didomi","catch","realCookieBanner","undefined","window.cmpmngr.setConsentViaBtn","tcfAllowUseCookies","cicc.cookie_cat_functional","cicc.cookie_cat_marketing","tweakersConfig.userConfiguredConsent.youtube.approved","tweakersConfig.userConfiguredConsent.omny.approved","tweakersConfig.userConfiguredConsent.pcnltelecom.approved","tweakersConfig.userConfiguredConsent.googlemaps.approved","tweakersConfig.userConfiguredConsent.streamable.approved","tweakersConfig.userConfiguredConsent.soundcloud.approved","tweakersConfig.userConfiguredConsent.knightlab.approved","yleConsentSdk._consentSdk._embedded_social_media","yleConsentSdk.show","cockieConsentManagement","window.scrollTo","flagTcfLoaded","dataLayer","{\"value\":[{\"signals\":[\"remixd\"]},{\"event\":\"remixd_gtm_fire\"}]}","_iub.cs.options.callback.onConsentRejected","_iub.cs.options.callback.onConsentFirstRejected","__tcfapi_user_acctepted","cmp_importvendors","{\"value\": [\"s23\",\"s2564\"]}","_gtm.consent.cm.strategy.options.cmpay.enabled","Object.prototype.hasConsent","cmp_autoreject","checkPURLayerMustBeShown"];

const $scriptletArglists$ = /* 44 */ "0,0;0,1;1,2,3;2,4,5;2,6,7;3,8,9;2,10,5;2,11,5;4,12;2,13,5;2,14,15;2,16,17;2,18,19;2,20,15;2,21,7;2,22,15;2,23,15;5,24;2,25,26;2,27,15;2,28,5;2,29,5;2,30,5;2,31,5;2,32,5;2,33,5;2,34,5;2,35,5;2,36,5;2,37,5;2,38,5;2,39,15;2,40,15;2,41,15;2,42,5;6,43,44;2,45,15;2,46,15;2,47,5;6,48,49;2,50,7;2,51,17;2,52,5;7,53";

const $scriptletArglistRefs$ = /* 603 */ "18;0;41,42;2;18;30,31;20;18;18;0;18;18;18;18;18;18;18;18;5;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;16;18;18;18;18;3,21,22;38;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;8;5;18;18;18;18;18;18;18;0;18;10;18;6,7;15;18;18;18;18;18;18;5;18;18;18;16;18;18;18;16;18;5;18;18;18;18;33;18;18;14;18;18;18;18;18;18;18;18;18;18;18;18;0;18;1;18;18;18;18;18;18;0;17,18;3;18;18;18;18;18;18;18;18;18;18;18;18;0;18;12,13;18;18;18;5;18;17,18;18;18;18;18;15;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;6,7;6,7;6,7;18;18;18;18;5;18;18;18;18;18;18;18;18;0;18;18;35;18;18;18;18;18;18;18;18;18;23,24,25,26,27,28,29;18;18;18;41,42,43;18;18;18;18;18;18;18;18;0;18;18;18;18;3;3;6,7;16;34;18;18;18;18;18;18;18;18;18;18;18;18;18;0;18;18;0;18;18;18;18;18;18;5;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;5;18;18;18;0;18;0;18;18;18;18;4;18;18;18;18;18;3,21,22;36,37;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;0;18;18;18;18;18;18;18;18;18;18;18;18;18;0;18;18;18;18;18;18;18;11;18;18;18;18;36,37;36,37;18;18;18;18;18;18;18;18;40;18;18;18;18;18;18;5;32;18;18;0;19;18;17;18;18;18;5;5;18;18;18;0;0;18;5;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;16;18;18;18;18;18;18;18;5;18;39;18;18;18;18;18;18;18;18;17;18;16;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;0,5;18;18;18;18;18;18;18;0;18;18;18;18;18;18;18;18;18;18;18;18;18;16;18;18;18;0;18;18;18;18;18;18;18;0;18;18;5;18;18;0;18;18;0;18;18;18;18;0;18;18;18;18;18;0;18;0;18;18;18;18;18;18;0;18;18;18;18;18;18;18;18;18;5;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;6,7;18;18;18;0;18;18;0;18;18;18;18;5;18;18;18;18;18;18;17;18;18;18;18;18;18;9;18;18;18;18;18;18;18;18;18;0;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;0;18;9;18;18;18;18;18;18;18;18;5;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18;18";

const $scriptletHostnames$ = /* 603 */ ["do.de","al.com","dw.com","sss.fi","vzm.de","yle.fi","anna.fi","asga.ch","blhv.de","ccn.com","ciss.de","devm.io","engl.it","fild.de","gcol.de","grid.de","host.pl","igvm.de","ijr.com","itv4.de","ivfp.de","iway.ch","kmsw.de","naku.at","noaf.de","ojas.de","osmc.de","popp.eu","bbfun.de","beeze.de","betec.de","dg-pw.de","ekiwi.de","gosch.de","htvb.org","m-m-m.de","m38a1.de","melty.fr","nmmn.com","pi3g.com","pinel.de","pulpe.eu","tieku.fi","tvn24.pl","yplay.de","accace.cz","accace.hu","accace.ro","accace.sk","artkon.de","asfour.ch","aspies.de","b757.info","baycix.de","carbon.ag","cargoe.at","dacsa.com","devowl.io","ejwleo.de","erp-up.de","farmer.pl","freep.com","gooloo.de","jadent.de","kjr-pi.de","klsys.com","kohlkg.de","maniac.de","medit.com","mlive.com","online.ch","stewes.de","ubisys.de","vg247.com","xv-ru.com","zipfer.at","4kfilme.de","accace.com","adzurro.de","aeotec.com","bestwig.de","boston.com","c-parts.de","epages.com","fobizz.com","gamepro.de","goesser.at","hookahx.de","hypnose.ac","jofogas.hu","jpgames.de","legacy.com","maxkoch.de","olmatic.de","ousuca.com","patria.net","podimo.com","prodopa.de","profiel.de","qastack.fr","ridee.bike","softedu.pl","stilweb.it","suitapp.de","tecsafe.de","tiesse.com","toplink.de","upreply.de","vivoil.com","wp-loft.de","24hessen.de","afi-ipl.org","allkpop.com","bierspot.de","claritin.ca","compari.net","crazeuk.com","europace.de","fahrstil.cc","fakturia.de","gamenite.de","gamepur.com","getaawp.com","gigantti.fi","hs-soft.com","ilyabiz.com","imprints.de","krefindo.de","lang-ag.com","lemarit.com","ltmemory.de","luegeten.ch","mikanews.de","myclim8.com","oculyze.net","ontuscia.it","pgatour.com","proofing.de","saos.org.pl","smiley.blue","subitec.com","theoblog.de","titantv.com","topblogs.de","tuhlteim.de","tutonaut.de","tv-sport.de","wildbits.de","winlocal.de","xvideos.com","yurishop.it","actrento.com","arsdigita.de","base-chat.de","basta.berlin","berberin.net","brancaia.com","brill-art.de","bs-achern.de","cornhub.army","cranimax.com","desser.co.uk","drhorvath.de","duft-werk.de","ellasblog.de","esderaiz.com","eurogamer.es","eurogamer.pl","eurogamer.pt","everbloom.eu","frohreich.de","hopfner.info","ilonpolku.fi","inquirer.net","jankarres.de","knoblauch.de","komm-mit.com","lightcon.com","manyanet.org","move-ment.at","mummelito.de","narrwalla.de","newatlas.com","patchbox.com","photofloh.de","radiox.co.uk","roschmann.de","rosgovas.com","salzerkfz.de","saunahuus.de","savvista.com","spherity.com","spytunes.com","thingybob.de","tulipize.com","tweakers.net","vapecoco.com","webtapete.de","wichmann.biz","winfuture.de","wp-ninjas.de","yenivatan.at","abcteile24.de","ac-grimmen.de","antik-shop.de","bklm-ahaus.de","blindbild.com","canvascga.com","cleveland.com","cloudiway.com","dasmagazin.de","efg-passau.de","ekiwi-blog.de","elgiganten.dk","elgiganten.se","eurogamer.net","euromaster.de","express.co.uk","feuerhexen.de","ffzblossin.de","forwardis.com","freegossip.gr","frixtender.de","fuckyeah.shop","gaming-pc.net","hof-droste.de","horizonte.com","hundewelpe.de","infobroker.de","inicionet.com","iqskitchen.de","keengamer.com","linzerbier.at","ls-service.at","mandatory.com","mario-kaps.de","mmo-sankar.de","picockpit.com","plzenoviny.cz","puntigamer.at","rossoft.co.uk","savvytime.com","signisalc.org","skiweltcup.tv","symposium.org","vectorsoft.de","visitmedia.de","vitalplus.com","wallygusto.de","weber-senf.at","webtimiser.de","wind-craft.eu","wunderpen.com","zouboulis.com","audiovision.de","balsamico.shop","bitreporter.de","bricksforge.io","britannica.com","brodbeck-dd.de","brunozimmer.de","cleverpush.com","comicsands.com","dayspamainz.de","duffelblog.com","elisazunder.de","euranetplus.de","farbenherz.com","fasteninfos.de","fimfiction.net","financeads.com","flughafen.tips","frickeldave.de","goldpreis24.de","grupo-loma.com","historianet.fi","ilsecoloxix.it","istdasvegan.eu","it-koehler.com","josefbergs.com","kiyoua-news.de","kwerfeldein.de","levne-sauny.cz","mannschaft.com","meinstream.net","odw-journal.de","playcentral.de","randombrick.de","roemermann.com","rotlichtaus.de","schwechater.at","senckenberg.de","sportsnaut.com","supereight.net","udo-lermann.de","vcfrankfurt.de","wzl-zwickau.de","youngimages.de","zabel-group.de","zertificon.com","zumkutscher.de","zur-glocke.com","aachen50plus.de","angelmagazin.de","babiceurican.cz","burzaucebnic.sk","cinemablend.com","createchange.me","derklassiker.de","domaintools.com","drive4brands.de","eventhotels.com","exitroom.berlin","flow-in-yoga.de","gadgethacks.com","goessential.com","hans-engelke.de","hauspanorama.de","hundgemacht.net","ilgazzettino.it","ilmessaggero.it","imprimare3d.com","istaf-indoor.de","kaiser-mania.de","karlhoeffkes.de","kasteninblau.de","kbmv-matting.de","kd-slovenija.de","lenovocampus.de","linternaute.com","locandazita.com","mack-design.com","music-on-net.de","neuneinhalb.org","nordlicht-ev.de","openforests.com","order-order.com","philips-hue.com","railwebcams.net","salzstreuner.de","sevenforums.com","sourceforge.net","swg-chemnitz.de","t-challenge.com","tango-flores.de","tc-equipment.de","tecalliance.net","techlicious.com","technicpack.net","techniknews.net","terra-natur.com","testefiorite.it","toledoblade.com","totalbeauty.com","windowspower.de","wrestlezone.com","zaunbau-koch.de","zimmerwetter.de","autobrinkmann.de","barracred.com.br","baumarkt-vogl.at","bildung-ab-50.de","danielederosa.de","denk-doch-mal.de","draisinenbahn.de","edr-software.com","englishradar.com","estudio-nous.com","foto-shooting.ch","gerdes-reisen.de","hotelkristall.it","insidetrading.de","klicks-kaufen.de","kuechenboerse.de","lameerooftop.com","lavanguardia.com","lazyinvestors.de","lichttraeumer.de","lobetalarbeit.de","louisreynier.com","miriamkreativ.de","missinfogeek.net","neumarkt-egna.it","nofilmschool.com","oakbeardcare.com","octopusenergy.de","pinel-medizin.de","pureselfmade.com","reise-zikaden.de","reisekontakte.at","running-green.de","schreiners-it.de","seifriz-preis.de","sonderversum.com","stadtreporter.de","stonk-market.com","strefabiznesu.pl","sv-langenfeld.de","thegeekfreaks.de","timo-bernhard.de","torinostoria.com","webfactory-i4.de","animalwebcams.net","blogyourthing.com","boeser-chinese.de","bsk-consulting.de","campingbuddies.de","compact-online.de","donostiroller.com","frigge-dinstak.de","gaming-grounds.de","goerlach-gmbh.com","guiademayores.com","knauer-galabau.de","leben-mit-ohne.de","locafrique-sf.com","mixingmonster.com","musicfeeds.com.au","nachbelichtet.com","phpconference.com","pndracingteam.net","rolandgermany.com","schuetzendepot.de","schulebruetten.ch","stw-langenfeld.de","superherohype.com","tuhlteim-pedia.de","verstehepferde.de","viel-unterwegs.de","visconti.partners","airportwebcams.net","akzent-magazin.com","arabesque-essen.de","ausfraukesfeder.de","brauerei-strate.de","classic-emaille.de","cocktailsworld.net","derhoerbuchblog.de","egon-w-kreutzer.de","elconfidencial.com","evkirche-eilsen.de","floristasgarcia.es","forum-koepenick.de","gamerevolution.com","gefahrgutjaeger.de","hannover-living.de","hardware-helden.de","industriemedien.at","juwelier-dringo.de","karver-systems.com","lb-consultores.com","listenonrepeat.com","mfu-pilotenclub.at","motivationstipp.de","nationalreview.com","notebook-doktor.de","pentadoc-radar.com","readlightnovel.org","stadt-schoeneck.de","suedafrika-wein.de","thefashionspot.com","therapiewerk-io.de","tsg6209weinheim.de","weingut-knipser.de","welte-glasuren.com","westernjournal.com","wrestling-point.de","yogainspires.co.uk","zahnarzt-kuboth.de","blueoceangaming.com","boheme-schwabing.de","calendarpedia.co.uk","feuerwehr-oberau.de","foxvalleyfoodie.com","herrlichergarten.de","immobilien-skiba.de","katzenbaumdesign.de","kieruneknorwegia.pl","madame-lenormand.de","media-consulting.ch","merriam-webster.com","pizzeria-algusto.de","readyforboarding.pl","reinhardstrempel.de","samenbank-berlin.de","stefan-froescher.eu","stefke-heilbronn.de","stricken-online.com","supertipp-online.de","tanzschulebogner.de","thedraftnetwork.com","thinkingwithyou.com","thomasschlechter.de","vienna-interiors.at","von-zinsen-leben.de","199-euro-computer.de","automatiksysteme.com","bewusstes-zentrum.de","blog.ipc-computer.de","der-windows-papst.de","die-werbeschmiede.de","erbsenprinzessin.com","flaviamelissa.com.br","holzkisten-fabrik.de","lichtempfindlich.org","piazzadeimestieri.it","rockpapershotgun.com","spieltraum-berlin.de","splendid-internet.de","teilzeitreisender.de","theodysseyonline.com","tkm-systemtechnik.de","trettin-apotheken.de","windows101tricks.com","wt-onlineakademie.de","brachmannofficial.com","compagniefruitiere.fr","coworkingrepublic.com","download.mokeedev.com","egro-direktwerbung.de","feucht-obsttechnik.de","gymnasium-hochdahl.de","haarausfall-stopp.com","janamaenz.photography","klangmassage-moser.de","mhmscreenprinting.com","philosophenlexikon.de","pocket-pirates-prt.de","schneelaeuferzunft.de","stefaniegoldmarie.com","technik-hauptstadt.de","tonispizza-rastatt.de","vadhander.kramfors.se","wildpark-ortenburg.de","wolfgangallgaeuer.com","zahnarzt-dr-henkel.de","1000-haushaltstipps.de","akademie-management.de","autoverwertung-berk.de","flugschule-hochries.de","fschemie-goettingen.de","goeltzschtal-reisen.de","interestingengineering","naturseifen-moosmed.de","nebenwerte-magazin.com","prodottidellapiazza.it","tourismus-uckermark.de","trirhena-consulting.de","volksfest-nuernberg.de","alquilerordenadores.com","annabeauty-stuttgart.de","blu-ray-rezensionen.net","caucasus-naturefund.org","frauzuckerbroetchen.com","gasthaus-schmidmayer.de","lacasadavantialsole.org","marketing-strategen.com","music-service-geiger.de","pandore-gendarmerie.org","rissland-kunststoffe.de","smorfianapoletanaweb.it","steinway-park-seesen.de","weiterbildungsfinder.de","accademiainformatica.com","continentale-hannover.de","crossculture-academy.com","dollenberg-isolierung.de","fitnesscenter-schardt.de","lattinepersonalizzate.it","mallorca-unternehmen.com","pferde-hunde-therapie.de","philosophia-perennis.com","playstationlifestyle.net","rechtsanwalt-nierfeld.de","vadhander.hogakusten.com","elektrotechnik-schabus.de","fabian-heinz-webdesign.de","hallesches-fotoatelier.de","kunstmuseum-heidenheim.de","lepetitmarchedauvergne.fr","presto-personaldienste.de","restaurantsbrighton.co.uk","von-neindorff-stiftung.de","worldpopulationreview.com","gesundheitsladen-online.de","manneskraft-gesteigert.com","schnittmuster-datenbank.de","tiermasseur-mannsberger.at","energiemetropole-leipzig.de","erlebnispark-ziegenhagen.de","grafische-visualisierung.de","schiffe-und-kreuzfahrten.de","sl-landschaftsgestaltung.de","erfurt-touristinformation.de","gutshaus-neuendorf-usedom.de","weimar-touristinformation.de","wohnmobilcenter-drechsler.de","china-central-consultants.com","nahrungsmittel-intoleranz.com","transport-versicherungen.info","bilderberg-bellevue-dresden.de","ichbindochnichthierumbeliebtzusein.com","versicherungsmakler-leistenschneider.de"];

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
