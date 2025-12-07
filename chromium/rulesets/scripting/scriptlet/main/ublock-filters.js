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

// ruleset: ublock-filters

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets() {

/******************************************************************************/

function trustedEditInboundObject(propChain = '', argPos = '', jsonq = '') {
    editInboundObjectFn(true, propChain, argPos, jsonq);
}

function editInboundObjectFn(
    trusted = false,
    propChain = '',
    argPosRaw = '',
    jsonq = '',
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}edit-inbound-object`,
        propChain,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const argPos = parseInt(argPosRaw, 10);
    if ( isNaN(argPos) ) { return; }
    const getArgPos = args => {
        if ( Array.isArray(args) === false ) { return; }
        if ( argPos >= 0 ) {
            if ( args.length <= argPos ) { return; }
            return argPos;
        }
        if ( args.length < -argPos ) { return; }
        return args.length + argPos;
    };
    const editObj = obj => {
        let clone;
        try {
            clone = safe.JSON_parse(safe.JSON_stringify(obj));
        } catch {
        }
        if ( typeof clone !== 'object' || clone === null ) { return; }
        const objAfter = jsonp.apply(clone);
        if ( objAfter === undefined ) { return; }
        safe.uboLog(logPrefix, 'Edited');
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `After edit:\n${safe.JSON_stringify(objAfter, null, 2)}`);
        }
        return objAfter;
    };
    proxyApplyFn(propChain, function(context) {
        const i = getArgPos(context.callArgs);
        if ( i !== undefined ) {
            const obj = editObj(context.callArgs[i]);
            if ( obj ) {
                context.callArgs[i] = obj;
            }
        }
        return context.reflect();
    });
}

class JSONPath {
    static create(query) {
        const jsonp = new JSONPath();
        jsonp.compile(query);
        return jsonp;
    }
    static toJSON(obj, stringifier, ...args) {
        return (stringifier || JSON.stringify)(obj, ...args)
            .replace(/\//g, '\\/');
    }
    get value() {
        return this.#compiled && this.#compiled.rval;
    }
    set value(v) {
        if ( this.#compiled === undefined ) { return; }
        this.#compiled.rval = v;
    }
    get valid() {
        return this.#compiled !== undefined;
    }
    compile(query) {
        this.#compiled = undefined;
        const r = this.#compile(query, 0);
        if ( r === undefined ) { return; }
        if ( r.i !== query.length ) {
            let val;
            if ( query.startsWith('=', r.i) ) {
                if ( /^=repl\(.+\)$/.test(query.slice(r.i)) ) {
                    r.modify = 'repl';
                    val = query.slice(r.i+6, -1);
                } else {
                    val = query.slice(r.i+1);
                }
            } else if ( query.startsWith('+=', r.i) ) {
                r.modify = '+';
                val = query.slice(r.i+2);
            }
            try { r.rval = JSON.parse(val); }
            catch { return; }
        }
        this.#compiled = r;
    }
    evaluate(root) {
        if ( this.valid === false ) { return []; }
        this.#root = root;
        const paths = this.#evaluate(this.#compiled.steps, []);
        this.#root = null;
        return paths;
    }
    apply(root) {
        if ( this.valid === false ) { return; }
        const { rval } = this.#compiled;
        this.#root = { '$': root };
        const paths = this.#evaluate(this.#compiled.steps, []);
        let i = paths.length
        if ( i === 0 ) { this.#root = null; return; }
        while ( i-- ) {
            const { obj, key } = this.#resolvePath(paths[i]);
            if ( rval !== undefined ) {
                this.#modifyVal(obj, key);
            } else if ( Array.isArray(obj) && typeof key === 'number' ) {
                obj.splice(key, 1);
            } else {
                delete obj[key];
            }
        }
        const result = this.#root['$'] ?? null;
        this.#root = null;
        return result;
    }
    dump() {
        return JSON.stringify(this.#compiled);
    }
    toJSON(obj, ...args) {
        return JSONPath.toJSON(obj, null, ...args)
    }
    get [Symbol.toStringTag]() {
        return 'JSONPath';
    }
    #UNDEFINED = 0;
    #ROOT = 1;
    #CURRENT = 2;
    #CHILDREN = 3;
    #DESCENDANTS = 4;
    #reUnquotedIdentifier = /^[A-Za-z_][\w]*|^\*/;
    #reExpr = /^([!=^$*]=|[<>]=?)(.+?)\]/;
    #reIndice = /^-?\d+/;
    #root;
    #compiled;
    #compile(query, i) {
        if ( query.length === 0 ) { return; }
        const steps = [];
        let c = query.charCodeAt(i);
        if ( c === 0x24 /* $ */ ) {
            steps.push({ mv: this.#ROOT });
            i += 1;
        } else if ( c === 0x40 /* @ */ ) {
            steps.push({ mv: this.#CURRENT });
            i += 1;
        } else {
            steps.push({ mv: i === 0 ? this.#ROOT : this.#CURRENT });
        }
        let mv = this.#UNDEFINED;
        for (;;) {
            if ( i === query.length ) { break; }
            c = query.charCodeAt(i);
            if ( c === 0x20 /* whitespace */ ) {
                i += 1;
                continue;
            }
            // Dot accessor syntax
            if ( c === 0x2E /* . */ ) {
                if ( mv !== this.#UNDEFINED ) { return; }
                if ( query.startsWith('..', i) ) {
                    mv = this.#DESCENDANTS;
                    i += 2;
                } else {
                    mv = this.#CHILDREN;
                    i += 1;
                }
                continue;
            }
            if ( c !== 0x5B /* [ */ ) {
                if ( mv === this.#UNDEFINED ) {
                    const step = steps.at(-1);
                    if ( step === undefined ) { return; }
                    i = this.#compileExpr(query, step, i);
                    break;
                }
                const s = this.#consumeUnquotedIdentifier(query, i);
                if  ( s === undefined ) { return; }
                steps.push({ mv, k: s });
                i += s.length;
                mv = this.#UNDEFINED;
                continue;
            }
            // Bracket accessor syntax
            if ( query.startsWith('[?', i) ) {
                const not = query.charCodeAt(i+2) === 0x21 /* ! */;
                const j = i + 2 + (not ? 1 : 0);
                const r = this.#compile(query, j);
                if ( r === undefined ) { return; }
                if ( query.startsWith(']', r.i) === false ) { return; }
                if ( not ) { r.steps.at(-1).not = true; }
                steps.push({ mv: mv || this.#CHILDREN, steps: r.steps });
                i = r.i + 1;
                mv = this.#UNDEFINED;
                continue;
            }
            if ( query.startsWith('[*]', i) ) {
                mv ||= this.#CHILDREN;
                steps.push({ mv, k: '*' });
                i += 3;
                mv = this.#UNDEFINED;
                continue;
            }
            const r = this.#consumeIdentifier(query, i+1);
            if ( r === undefined ) { return; }
            mv ||= this.#CHILDREN;
            steps.push({ mv, k: r.s });
            i = r.i + 1;
            mv = this.#UNDEFINED;
        }
        if ( steps.length === 0 ) { return; }
        if ( mv !== this.#UNDEFINED ) { return; }
        return { steps, i };
    }
    #evaluate(steps, pathin) {
        let resultset = [];
        if ( Array.isArray(steps) === false ) { return resultset; }
        for ( const step of steps ) {
            switch ( step.mv ) {
            case this.#ROOT:
                resultset = [ [ '$' ] ];
                break;
            case this.#CURRENT:
                resultset = [ pathin ];
                break;
            case this.#CHILDREN:
            case this.#DESCENDANTS:
                resultset = this.#getMatches(resultset, step);
                break;
            default:
                break;
            }
        }
        return resultset;
    }
    #getMatches(listin, step) {
        const listout = [];
        for ( const pathin of listin ) {
            const { value: owner } = this.#resolvePath(pathin);
            if ( step.k === '*' ) {
                this.#getMatchesFromAll(pathin, step, owner, listout);
            } else if ( step.k !== undefined ) {
                this.#getMatchesFromKeys(pathin, step, owner, listout);
            } else if ( step.steps ) {
                this.#getMatchesFromExpr(pathin, step, owner, listout);
            }
        }
        return listout;
    }
    #getMatchesFromAll(pathin, step, owner, out) {
        const recursive = step.mv === this.#DESCENDANTS;
        for ( const { path } of this.#getDescendants(owner, recursive) ) {
            out.push([ ...pathin, ...path ]);
        }
    }
    #getMatchesFromKeys(pathin, step, owner, out) {
        const kk = Array.isArray(step.k) ? step.k : [ step.k ];
        for ( const k of kk ) {
            const normalized = this.#evaluateExpr(step, owner, k);
            if ( normalized === undefined ) { continue; }
            out.push([ ...pathin, normalized ]);
        }
        if ( step.mv !== this.#DESCENDANTS ) { return; }
        for ( const { obj, key, path } of this.#getDescendants(owner, true) ) {
            for ( const k of kk ) {
                const normalized = this.#evaluateExpr(step, obj[key], k);
                if ( normalized === undefined ) { continue; }
                out.push([ ...pathin, ...path, normalized ]);
            }
        }
    }
    #getMatchesFromExpr(pathin, step, owner, out) {
        const recursive = step.mv === this.#DESCENDANTS;
        if ( Array.isArray(owner) === false ) {
            const r = this.#evaluate(step.steps, pathin);
            if ( r.length !== 0 ) { out.push(pathin); }
            if ( recursive !== true ) { return; }
        }
        for ( const { obj, key, path } of this.#getDescendants(owner, recursive) ) {
            if ( Array.isArray(obj[key]) ) { continue; }
            const q = [ ...pathin, ...path ];
            const r = this.#evaluate(step.steps, q);
            if ( r.length === 0 ) { continue; }
            out.push(q);
        }
    }
    #normalizeKey(owner, key) {
        if ( typeof key === 'number' ) {
            if ( Array.isArray(owner) ) {
                return key >= 0 ? key : owner.length + key;
            }
        }
        return key;
    }
    #getDescendants(v, recursive) {
        const iterator = {
            next() {
                const n = this.stack.length;
                if ( n === 0 ) {
                    this.value = undefined;
                    this.done = true;
                    return this;
                }
                const details = this.stack[n-1];
                const entry = details.keys.next();
                if ( entry.done ) {
                    this.stack.pop();
                    this.path.pop();
                    return this.next();
                }
                this.path[n-1] = entry.value;
                this.value = {
                    obj: details.obj,
                    key: entry.value,
                    path: this.path.slice(),
                };
                const v = this.value.obj[this.value.key];
                if ( recursive ) {
                    if ( Array.isArray(v) ) {
                        this.stack.push({ obj: v, keys: v.keys() });
                    } else if ( typeof v === 'object' && v !== null ) {
                        this.stack.push({ obj: v, keys: Object.keys(v).values() });
                    }
                }
                return this;
            },
            path: [],
            value: undefined,
            done: false,
            stack: [],
            [Symbol.iterator]() { return this; },
        };
        if ( Array.isArray(v) ) {
            iterator.stack.push({ obj: v, keys: v.keys() });
        } else if ( typeof v === 'object' && v !== null ) {
            iterator.stack.push({ obj: v, keys: Object.keys(v).values() });
        }
        return iterator;
    }
    #consumeIdentifier(query, i) {
        const keys = [];
        for (;;) {
            const c0 = query.charCodeAt(i);
            if ( c0 === 0x5D /* ] */ ) { break; }
            if ( c0 === 0x2C /* , */ ) {
                i += 1;
                continue;
            }
            if ( c0 === 0x27 /* ' */ ) {
                const r = this.#untilChar(query, 0x27 /* ' */, i+1)
                if ( r === undefined ) { return; }
                keys.push(r.s);
                i = r.i;
                continue;
            }
            if ( c0 === 0x2D /* - */ || c0 >= 0x30 && c0 <= 0x39 ) {
                const match = this.#reIndice.exec(query.slice(i));
                if ( match === null ) { return; }
                const indice = parseInt(query.slice(i), 10);
                keys.push(indice);
                i += match[0].length;
                continue;
            }
            const s = this.#consumeUnquotedIdentifier(query, i);
            if ( s === undefined ) { return; }
            keys.push(s);
            i += s.length;
        }
        return { s: keys.length === 1 ? keys[0] : keys, i };
    }
    #consumeUnquotedIdentifier(query, i) {
        const match = this.#reUnquotedIdentifier.exec(query.slice(i));
        if ( match === null ) { return; }
        return match[0];
    }
    #untilChar(query, targetCharCode, i) {
        const len = query.length;
        const parts = [];
        let beg = i, end = i;
        for (;;) {
            if ( end === len ) { return; }
            const c = query.charCodeAt(end);
            if ( c === targetCharCode ) {
                parts.push(query.slice(beg, end));
                end += 1;
                break;
            }
            if ( c === 0x5C /* \ */ && (end+1) < len ) {
                const d = query.charCodeAt(end+1);
                if ( d === targetCharCode ) {
                    parts.push(query.slice(beg, end));
                    end += 1;
                    beg = end;
                }
            }
            end += 1;
        }
        return { s: parts.join(''), i: end };
    }
    #compileExpr(query, step, i) {
        if ( query.startsWith('=/', i) ) {
            const r = this.#untilChar(query, 0x2F /* / */, i+2);
            if ( r === undefined ) { return i; }
            const match = /^[i]/.exec(query.slice(r.i));
            try {
                step.rval = new RegExp(r.s, match && match[0] || undefined);
            } catch {
                return i;
            }
            step.op = 're';
            if ( match ) { r.i += match[0].length; }
            return r.i;
        }
        const match = this.#reExpr.exec(query.slice(i));
        if ( match === null ) { return i; }
        try {
            step.rval = JSON.parse(match[2]);
            step.op = match[1];
        } catch {
        }
        return i + match[1].length + match[2].length;
    }
    #resolvePath(path) {
        if ( path.length === 0 ) { return { value: this.#root }; }
        const key = path.at(-1);
        let obj = this.#root
        for ( let i = 0, n = path.length-1; i < n; i++ ) {
            obj = obj[path[i]];
        }
        return { obj, key, value: obj[key] };
    }
    #evaluateExpr(step, owner, key) {
        if ( owner === undefined || owner === null ) { return; }
        if ( typeof key === 'number' ) {
            if ( Array.isArray(owner) === false ) { return; }
        }
        const k = this.#normalizeKey(owner, key);
        const hasOwn = Object.hasOwn(owner, k);
        if ( step.op !== undefined && hasOwn === false ) { return; }
        const target = step.not !== true;
        const v = owner[k];
        let outcome = false;
        switch ( step.op ) {
        case '==': outcome = (v === step.rval) === target; break;
        case '!=': outcome = (v !== step.rval) === target; break;
        case  '<': outcome = (v < step.rval) === target; break;
        case '<=': outcome = (v <= step.rval) === target; break;
        case  '>': outcome = (v > step.rval) === target; break;
        case '>=': outcome = (v >= step.rval) === target; break;
        case '^=': outcome = `${v}`.startsWith(step.rval) === target; break;
        case '$=': outcome = `${v}`.endsWith(step.rval) === target; break;
        case '*=': outcome = `${v}`.includes(step.rval) === target; break;
        case 're': outcome = step.rval.test(`${v}`); break;
        default: outcome = hasOwn === target; break;
        }
        if ( outcome ) { return k; }
    }
    #modifyVal(obj, key) {
        const { modify, rval } = this.#compiled;
        switch ( modify ) {
        case undefined:
            obj[key] = rval;
            break;
        case '+': {
            if ( rval instanceof Object === false ) { return; }
            const lval = obj[key];
            if ( lval instanceof Object === false ) { return; }
            if ( Array.isArray(lval) ) { return; }
            for ( const [ k, v ] of Object.entries(rval) ) {
                lval[k] = v;
            }
            break;
        }
        case 'repl': {
            const lval = obj[key];
            if ( typeof lval !== 'string' ) { return; }
            if ( this.#compiled.re === undefined ) {
                this.#compiled.re = null;
                try {
                    this.#compiled.re = rval.regex !== undefined
                        ? new RegExp(rval.regex, rval.flags)
                        : new RegExp(rval.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                } catch {
                }
            }
            if ( this.#compiled.re === null ) { return; }
            obj[key] = lval.replace(this.#compiled.re, rval.replacement);
            break;
        }
        default:
            break;
        }
    }
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

function trustedJsonEditFetchRequest(jsonq = '', ...args) {
    jsonEditFetchRequestFn(true, jsonq, ...args);
}

function jsonEditFetchRequestFn(trusted, jsonq = '') {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit-fetch-request`,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const propNeedles = parsePropertiesToMatchFn(extraArgs.propsToMatch, 'url');
    const filterBody = body => {
        if ( typeof body !== 'string' ) { return; }
        let data;
        try { data = safe.JSON_parse(body); }
        catch { }
        if ( data instanceof Object === false ) { return; }
        const objAfter = jsonp.apply(data);
        if ( objAfter === undefined ) { return; }
        return safe.JSON_stringify(objAfter);
    }
    const proxyHandler = context => {
        const args = context.callArgs;
        const [ resource, options ] = args;
        const bodyBefore = options?.body;
        if ( Boolean(bodyBefore) === false ) { return context.reflect(); }
        const bodyAfter = filterBody(bodyBefore);
        if ( bodyAfter === undefined || bodyAfter === bodyBefore ) {
            return context.reflect();
        }
        if ( propNeedles.size !== 0 ) {
            const objs = [
                resource instanceof Object ? resource : { url: `${resource}` }
            ];
            if ( objs[0] instanceof Request ) {
                try {
                    objs[0] = safe.Request_clone.call(objs[0]);
                } catch(ex) {
                    safe.uboErr(logPrefix, 'Error:', ex);
                }
            }
            const matched = matchObjectPropertiesFn(propNeedles, ...objs);
            if ( matched === undefined ) { return context.reflect(); }
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `Matched "propsToMatch":\n\t${matched.join('\n\t')}`);
            }
        }
        safe.uboLog(logPrefix, 'Edited');
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `After edit:\n${bodyAfter}`);
        }
        options.body = bodyAfter;
        return context.reflect();
    };
    proxyApplyFn('fetch', proxyHandler);
    proxyApplyFn('Request', proxyHandler);
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
            const objs = [ args[0] instanceof Object ? args[0] : { url: args[0] } ];
            if ( objs[0] instanceof Request ) {
                try {
                    objs[0] = safe.Request_clone.call(objs[0]);
                } catch(ex) {
                    safe.uboErr(logPrefix, 'Error:', ex);
                }
            }
            if ( args[1] instanceof Object ) {
                objs.push(args[1]);
            }
            const matched = matchObjectPropertiesFn(propNeedles, ...objs);
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

function jsonPruneXhrResponse(
    rawPrunePaths = '',
    rawNeedlePaths = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune-xhr-response', rawPrunePaths, rawNeedlePaths);
    const xhrInstances = new WeakMap();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const propNeedles = parsePropertiesToMatchFn(extraArgs.propsToMatch, 'url');
    const stackNeedle = safe.initPattern(extraArgs.stackToMatch || '', { canNegate: true });
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(method, url, ...args) {
            const xhrDetails = { method, url };
            let outcome = 'match';
            if ( propNeedles.size !== 0 ) {
                if ( matchObjectPropertiesFn(propNeedles, xhrDetails) === undefined ) {
                    outcome = 'nomatch';
                }
            }
            if ( outcome === 'match' ) {
                if ( safe.logLevel > 1 ) {
                    safe.uboLog(logPrefix, `Matched optional "propsToMatch", "${extraArgs.propsToMatch}"`);
                }
                xhrInstances.set(this, xhrDetails);
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
            let objBefore;
            if ( typeof innerResponse === 'object' ) {
                objBefore = innerResponse;
            } else if ( typeof innerResponse === 'string' ) {
                try {
                    objBefore = safe.JSON_parse(innerResponse);
                } catch {
                }
            }
            if ( typeof objBefore !== 'object' ) {
                return (xhrDetails.response = innerResponse);
            }
            const objAfter = objectPruneFn(
                objBefore,
                rawPrunePaths,
                rawNeedlePaths,
                stackNeedle,
                extraArgs
            );
            let outerResponse;
            if ( typeof objAfter === 'object' ) {
                outerResponse = typeof innerResponse === 'string'
                    ? safe.JSON_stringify(objAfter)
                    : objAfter;
                safe.uboLog(logPrefix, 'Pruned');
            } else {
                outerResponse = innerResponse;
            }
            return (xhrDetails.response = outerResponse);
        }
        get responseText() {
            const response = this.response;
            return typeof response !== 'string'
                ? super.responseText
                : response;
        }
    };
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

function trustedReplaceFetchResponse(...args) {
    replaceFetchResponseFn(true, ...args);
}

function replaceFetchResponseFn(
    trusted = false,
    pattern = '',
    replacement = '',
    propsToMatch = ''
) {
    if ( trusted !== true ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-fetch-response', pattern, replacement, propsToMatch);
    if ( pattern === '*' ) { pattern = '.*'; }
    const rePattern = safe.patternToRegex(pattern);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 4);
    const reIncludes = extraArgs.includes ? safe.patternToRegex(extraArgs.includes) : null;
    self.fetch = new Proxy(self.fetch, {
        apply: function(target, thisArg, args) {
            const fetchPromise = Reflect.apply(target, thisArg, args);
            if ( pattern === '' ) { return fetchPromise; }
            if ( propNeedles.size !== 0 ) {
                const objs = [ args[0] instanceof Object ? args[0] : { url: args[0] } ];
                if ( objs[0] instanceof Request ) {
                    try {
                        objs[0] = safe.Request_clone.call(objs[0]);
                    }
                    catch(ex) {
                        safe.uboErr(logPrefix, ex);
                    }
                }
                if ( args[1] instanceof Object ) {
                    objs.push(args[1]);
                }
                const matched = matchObjectPropertiesFn(propNeedles, ...objs);
                if ( matched === undefined ) { return fetchPromise; }
                if ( safe.logLevel > 1 ) {
                    safe.uboLog(logPrefix, `Matched "propsToMatch":\n\t${matched.join('\n\t')}`);
                }
            }
            return fetchPromise.then(responseBefore => {
                const response = responseBefore.clone();
                return response.text().then(textBefore => {
                    if ( reIncludes && reIncludes.test(textBefore) === false ) {
                        return responseBefore;
                    }
                    const textAfter = textBefore.replace(rePattern, replacement);
                    if ( textAfter === textBefore ) { return responseBefore; }
                    safe.uboLog(logPrefix, 'Replaced');
                    const responseAfter = new Response(textAfter, {
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
                    safe.uboErr(logPrefix, reason);
                    return responseBefore;
                });
            }).catch(reason => {
                safe.uboErr(logPrefix, reason);
                return fetchPromise;
            });
        }
    });
}

function trustedPreventDomBypass(
    methodPath = '',
    targetProp = ''
) {
    if ( methodPath === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-prevent-dom-bypass', methodPath, targetProp);
    proxyApplyFn(methodPath, function(context) {
        const elems = new Set(context.callArgs.filter(e => e instanceof HTMLElement));
        const r = context.reflect();
        if ( elems.length === 0 ) { return r; }
        for ( const elem of elems ) {
            try {
                if ( `${elem.contentWindow}` !== '[object Window]' ) { continue; }
                if ( elem.contentWindow.location.href !== 'about:blank' ) {
                    if ( elem.contentWindow.location.href !== self.location.href ) {
                        continue;
                    }
                }
                if ( targetProp !== '' ) {
                    let me = self, it = elem.contentWindow;
                    let chain = targetProp;
                    for (;;) {
                        const pos = chain.indexOf('.');
                        if ( pos === -1 ) { break; }
                        const prop = chain.slice(0, pos);
                        me = me[prop]; it = it[prop];
                        chain = chain.slice(pos+1);
                    }
                    it[chain] = me[chain];
                } else {
                    Object.defineProperty(elem, 'contentWindow', { value: self });
                }
                safe.uboLog(logPrefix, 'Bypass prevented');
            } catch {
            }
        }
        return r;
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

function jsonEdit(jsonq = '') {
    editOutboundObjectFn(false, 'JSON.parse', jsonq);
}

function editOutboundObjectFn(
    trusted = false,
    propChain = '',
    jsonq = '',
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}edit-outbound-object`,
        propChain,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    proxyApplyFn(propChain, function(context) {
        const obj = context.reflect();
        const objAfter = jsonp.apply(obj);
        if ( objAfter === undefined ) { return obj; }
        safe.uboLog(logPrefix, 'Edited');
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `After edit:\n${safe.JSON_stringify(objAfter, null, 2)}`);
        }
        return objAfter;
    });
}

function jsonlEditXhrResponse(jsonq = '', ...args) {
    jsonlEditXhrResponseFn(false, jsonq, ...args);
}

function jsonlEditXhrResponseFn(trusted, jsonq = '') {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}jsonl-edit-xhr-response`,
        jsonq
    );
    const xhrInstances = new WeakMap();
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const propNeedles = parsePropertiesToMatchFn(extraArgs.propsToMatch, 'url');
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(method, url, ...args) {
            const xhrDetails = { method, url };
            const matched = propNeedles.size === 0 ||
                matchObjectPropertiesFn(propNeedles, xhrDetails);
            if ( matched ) {
                if ( safe.logLevel > 1 && Array.isArray(matched) ) {
                    safe.uboLog(logPrefix, `Matched "propsToMatch":\n\t${matched.join('\n\t')}`);
                }
                xhrInstances.set(this, xhrDetails);
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
            const outerResponse = jsonlEditFn(jsonp, innerResponse);
            if ( outerResponse !== innerResponse ) {
                safe.uboLog(logPrefix, 'Pruned');
            }
            return (xhrDetails.response = outerResponse);
        }
        get responseText() {
            const response = this.response;
            return typeof response !== 'string'
                ? super.responseText
                : response;
        }
    };
}

function jsonlEditFn(jsonp, text = '') {
    const safe = safeSelf();
    const lineSeparator = /\r?\n/.exec(text)?.[0] || '\n';
    const linesBefore = text.split('\n');
    const linesAfter = [];
    for ( const lineBefore of linesBefore ) {
        let obj;
        try { obj = safe.JSON_parse(lineBefore); } catch { }
        if ( typeof obj !== 'object' || obj === null ) {
            linesAfter.push(lineBefore);
            continue;
        }
        const objAfter = jsonp.apply(obj);
        if ( objAfter === undefined ) {
            linesAfter.push(lineBefore);
            continue;
        }
        const lineAfter = safe.JSON_stringify(objAfter);
        linesAfter.push(lineAfter);
    }
    return linesAfter.join(lineSeparator);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
}

function spoofCSS(
    selector,
    ...args
) {
    if ( typeof selector !== 'string' ) { return; }
    if ( selector === '' ) { return; }
    const toCamelCase = s => s.replace(/-[a-z]/g, s => s.charAt(1).toUpperCase());
    const propToValueMap = new Map();
    const privatePropToValueMap = new Map();
    for ( let i = 0; i < args.length; i += 2 ) {
        const prop = toCamelCase(args[i+0]);
        if ( prop === '' ) { break; }
        const value = args[i+1];
        if ( typeof value !== 'string' ) { break; }
        if ( prop.charCodeAt(0) === 0x5F /* _ */ ) {
            privatePropToValueMap.set(prop, value);
        } else {
            propToValueMap.set(prop, value);
        }
    }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('spoof-css', selector, ...args);
    const instanceProperties = [ 'cssText', 'length', 'parentRule' ];
    const spoofStyle = (prop, real) => {
        const normalProp = toCamelCase(prop);
        const shouldSpoof = propToValueMap.has(normalProp);
        const value = shouldSpoof ? propToValueMap.get(normalProp) : real;
        if ( shouldSpoof ) {
            safe.uboLog(logPrefix, `Spoofing ${prop} to ${value}`);
        }
        return value;
    };
    const cloackFunc = (fn, thisArg, name) => {
        const trap = fn.bind(thisArg);
        Object.defineProperty(trap, 'name', { value: name });
        Object.defineProperty(trap, 'toString', {
            value: ( ) => `function ${name}() { [native code] }`
        });
        return trap;
    };
    self.getComputedStyle = new Proxy(self.getComputedStyle, {
        apply: function(target, thisArg, args) {
            // eslint-disable-next-line no-debugger
            if ( privatePropToValueMap.has('_debug') ) { debugger; }
            const style = Reflect.apply(target, thisArg, args);
            const targetElements = new WeakSet(document.querySelectorAll(selector));
            if ( targetElements.has(args[0]) === false ) { return style; }
            const proxiedStyle = new Proxy(style, {
                get(target, prop) {
                    if ( typeof target[prop] === 'function' ) {
                        if ( prop === 'getPropertyValue' ) {
                            return cloackFunc(function getPropertyValue(prop) {
                                return spoofStyle(prop, target[prop]);
                            }, target, 'getPropertyValue');
                        }
                        return cloackFunc(target[prop], target, prop);
                    }
                    if ( instanceProperties.includes(prop) ) {
                        return Reflect.get(target, prop);
                    }
                    return spoofStyle(prop, Reflect.get(target, prop));
                },
                getOwnPropertyDescriptor(target, prop) {
                    if ( propToValueMap.has(prop) ) {
                        return {
                            configurable: true,
                            enumerable: true,
                            value: propToValueMap.get(prop),
                            writable: true,
                        };
                    }
                    return Reflect.getOwnPropertyDescriptor(target, prop);
                },
            });
            return proxiedStyle;
        },
        get(target, prop) {
            if ( prop === 'toString' ) {
                return target.toString.bind(target);
            }
            return Reflect.get(target, prop);
        },
    });
    Element.prototype.getBoundingClientRect = new Proxy(Element.prototype.getBoundingClientRect, {
        apply: function(target, thisArg, args) {
            // eslint-disable-next-line no-debugger
            if ( privatePropToValueMap.has('_debug') ) { debugger; }
            const rect = Reflect.apply(target, thisArg, args);
            const targetElements = new WeakSet(document.querySelectorAll(selector));
            if ( targetElements.has(thisArg) === false ) { return rect; }
            let { x, y, height, width } = rect;
            if ( privatePropToValueMap.has('_rectx') ) {
                x = parseFloat(privatePropToValueMap.get('_rectx'));
            }
            if ( privatePropToValueMap.has('_recty') ) {
                y = parseFloat(privatePropToValueMap.get('_recty'));
            }
            if ( privatePropToValueMap.has('_rectw') ) {
                width = parseFloat(privatePropToValueMap.get('_rectw'));
            } else if ( propToValueMap.has('width') ) {
                width = parseFloat(propToValueMap.get('width'));
            }
            if ( privatePropToValueMap.has('_recth') ) {
                height = parseFloat(privatePropToValueMap.get('_recth'));
            } else if ( propToValueMap.has('height') ) {
                height = parseFloat(propToValueMap.get('height'));
            }
            return new self.DOMRect(x, y, width, height);
        },
        get(target, prop) {
            if ( prop === 'toString' ) {
                return target.toString.bind(target);
            }
            return Reflect.get(target, prop);
        },
    });
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

function noWebrtc() {
    var rtcName = window.RTCPeerConnection ? 'RTCPeerConnection' : (
        window.webkitRTCPeerConnection ? 'webkitRTCPeerConnection' : ''
    );
    if ( rtcName === '' ) { return; }
    var log = console.log.bind(console);
    var pc = function(cfg) {
        log('Document tried to create an RTCPeerConnection: %o', cfg);
    };
    const noop = function() {
    };
    pc.prototype = {
        close: noop,
        createDataChannel: noop,
        createOffer: noop,
        setRemoteDescription: noop,
        toString: function() {
            return '[object RTCPeerConnection]';
        }
    };
    var z = window[rtcName];
    window[rtcName] = pc.bind(window);
    if ( z.prototype ) {
        z.prototype.createDataChannel = function() {
            return {
                close: function() {},
                send: function() {}
            };
        }.bind(null);
    }
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

function disableNewtabLinks() {
    document.addEventListener('click', ev => {
        let target = ev.target;
        while ( target !== null ) {
            if ( target.localName === 'a' && target.hasAttribute('target') ) {
                ev.stopPropagation();
                ev.preventDefault();
                break;
            }
            target = target.parentNode;
        }
    }, { capture: true });
}

function trustedOverrideElementMethod(
    methodPath = '',
    selector = '',
    disposition = ''
) {
    if ( methodPath === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-override-element-method', methodPath, selector, disposition);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    proxyApplyFn(methodPath, function(context) {
        let override = selector === '';
        if ( override === false ) {
            const { thisArg } = context;
            try {
                override = thisArg.closest(selector) === thisArg;
            } catch {
            }
        }
        if ( override === false ) {
            return context.reflect();
        }
        safe.uboLog(logPrefix, 'Overridden');
        if ( disposition === '' ) { return; }
        if ( disposition === 'debug' && safe.logLevel !== 0 ) {
            debugger; // eslint-disable-line no-debugger
        }
        if ( disposition === 'throw' ) {
            throw new ReferenceError();
        }
        return validateConstantFn(true, disposition, extraArgs);
    });
}

function jsonEditXhrResponse(jsonq = '', ...args) {
    jsonEditXhrResponseFn(false, jsonq, ...args);
}

function jsonEditXhrResponseFn(trusted, jsonq = '') {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit-xhr-response`,
        jsonq
    );
    const xhrInstances = new WeakMap();
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const propNeedles = parsePropertiesToMatchFn(extraArgs.propsToMatch, 'url');
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(method, url, ...args) {
            const xhrDetails = { method, url };
            const matched = propNeedles.size === 0 ||
                matchObjectPropertiesFn(propNeedles, xhrDetails);
            if ( matched ) {
                if ( safe.logLevel > 1 && Array.isArray(matched) ) {
                    safe.uboLog(logPrefix, `Matched "propsToMatch":\n\t${matched.join('\n\t')}`);
                }
                xhrInstances.set(this, xhrDetails);
            }
            return super.open(method, url, ...args);
        }
        get response() {
            const innerResponse = super.response;
            const xhrDetails = xhrInstances.get(this);
            if ( xhrDetails === undefined ) { return innerResponse; }
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
            let obj;
            if ( typeof innerResponse === 'object' ) {
                obj = innerResponse;
            } else if ( typeof innerResponse === 'string' ) {
                try { obj = safe.JSON_parse(innerResponse); } catch { }
            }
            if ( typeof obj !== 'object' || obj === null ) {
                return (xhrDetails.response = innerResponse);
            }
            const objAfter = jsonp.apply(obj);
            if ( objAfter === undefined ) {
                return (xhrDetails.response = innerResponse);
            }
            safe.uboLog(logPrefix, 'Edited');
            const outerResponse = typeof innerResponse === 'string'
                ? JSONPath.toJSON(objAfter, safe.JSON_stringify)
                : objAfter;
            return (xhrDetails.response = outerResponse);
        }
        get responseText() {
            const response = this.response;
            return typeof response !== 'string'
                ? super.responseText
                : response;
        }
    };
}

function xmlPrune(
    selector = '',
    selectorCheck = '',
    urlPattern = ''
) {
    if ( typeof selector !== 'string' ) { return; }
    if ( selector === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('xml-prune', selector, selectorCheck, urlPattern);
    const reUrl = safe.patternToRegex(urlPattern);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const queryAll = (xmlDoc, selector) => {
        const isXpath = /^xpath\(.+\)$/.test(selector);
        if ( isXpath === false ) {
            return Array.from(xmlDoc.querySelectorAll(selector));
        }
        const xpr = xmlDoc.evaluate(
            selector.slice(6, -1),
            xmlDoc,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null
        );
        const out = [];
        for ( let i = 0; i < xpr.snapshotLength; i++ ) {
            const node = xpr.snapshotItem(i);
            out.push(node);
        }
        return out;
    };
    const pruneFromDoc = xmlDoc => {
        try {
            if ( selectorCheck !== '' && xmlDoc.querySelector(selectorCheck) === null ) {
                return xmlDoc;
            }
            if ( extraArgs.logdoc ) {
                const serializer = new XMLSerializer();
                safe.uboLog(logPrefix, `Document is\n\t${serializer.serializeToString(xmlDoc)}`);
            }
            const items = queryAll(xmlDoc, selector);
            if ( items.length === 0 ) { return xmlDoc; }
            safe.uboLog(logPrefix, `Removing ${items.length} items`);
            for ( const item of items ) {
                if ( item.nodeType === 1 ) {
                    item.remove();
                } else if ( item.nodeType === 2 ) {
                    item.ownerElement.removeAttribute(item.nodeName);
                }
                safe.uboLog(logPrefix, `${item.constructor.name}.${item.nodeName} removed`);
            }
        } catch(ex) {
            safe.uboErr(logPrefix, `Error: ${ex}`);
        }
        return xmlDoc;
    };
    const pruneFromText = text => {
        if ( (/^\s*</.test(text) && />\s*$/.test(text)) === false ) {
            return text;
        }
        try {
            const xmlParser = new DOMParser();
            const xmlDoc = xmlParser.parseFromString(text, 'text/xml');
            pruneFromDoc(xmlDoc);
            const serializer = new XMLSerializer();
            text = serializer.serializeToString(xmlDoc);
        } catch {
        }
        return text;
    };
    const urlFromArg = arg => {
        if ( typeof arg === 'string' ) { return arg; }
        if ( arg instanceof Request ) { return arg.url; }
        return String(arg);
    };
    self.fetch = new Proxy(self.fetch, {
        apply: function(target, thisArg, args) {
            const fetchPromise = Reflect.apply(target, thisArg, args);
            if ( reUrl.test(urlFromArg(args[0])) === false ) {
                return fetchPromise;
            }
            return fetchPromise.then(responseBefore => {
                const response = responseBefore.clone();
                return response.text().then(text => {
                    const responseAfter = new Response(pruneFromText(text), {
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
                }).catch(( ) =>
                    responseBefore
                );
            });
        }
    });
    self.XMLHttpRequest.prototype.open = new Proxy(self.XMLHttpRequest.prototype.open, {
        apply: async (target, thisArg, args) => {
            if ( reUrl.test(urlFromArg(args[1])) === false ) {
                return Reflect.apply(target, thisArg, args);
            }
            thisArg.addEventListener('readystatechange', function() {
                if ( thisArg.readyState !== 4 ) { return; }
                const type = thisArg.responseType;
                if (
                    type === 'document' ||
                    type === '' && thisArg.responseXML instanceof XMLDocument
                ) {
                    pruneFromDoc(thisArg.responseXML);
                    const serializer = new XMLSerializer();
                    const textout = serializer.serializeToString(thisArg.responseXML);
                    Object.defineProperty(thisArg, 'responseText', { value: textout });
                    if ( typeof thisArg.response === 'string' ) {
                        Object.defineProperty(thisArg, 'response', { value: textout });
                    }
                    return;
                }
                if (
                    type === 'text' ||
                    type === '' && typeof thisArg.responseText === 'string'
                ) {
                    const textin = thisArg.responseText;
                    const textout = pruneFromText(textin);
                    if ( textout === textin ) { return; }
                    Object.defineProperty(thisArg, 'response', { value: textout });
                    Object.defineProperty(thisArg, 'responseText', { value: textout });
                    return;
                }
            });
            return Reflect.apply(target, thisArg, args);
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

function jsonEditFetchResponse(jsonq = '', ...args) {
    jsonEditFetchResponseFn(false, jsonq, ...args);
}

function jsonEditFetchResponseFn(trusted, jsonq = '') {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit-fetch-response`,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const propNeedles = parsePropertiesToMatchFn(extraArgs.propsToMatch, 'url');
    proxyApplyFn('fetch', function(context) {
        const args = context.callArgs;
        const fetchPromise = context.reflect();
        if ( propNeedles.size !== 0 ) {
            const objs = [ args[0] instanceof Object ? args[0] : { url: args[0] } ];
            if ( objs[0] instanceof Request ) {
                try {
                    objs[0] = safe.Request_clone.call(objs[0]);
                } catch(ex) {
                    safe.uboErr(logPrefix, 'Error:', ex);
                }
            }
            if ( args[1] instanceof Object ) {
                objs.push(args[1]);
            }
            const matched = matchObjectPropertiesFn(propNeedles, ...objs);
            if ( matched === undefined ) { return fetchPromise; }
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `Matched "propsToMatch":\n\t${matched.join('\n\t')}`);
            }
        }
        return fetchPromise.then(responseBefore => {
            const response = responseBefore.clone();
            return response.json().then(obj => {
                if ( typeof obj !== 'object' ) { return responseBefore; }
                const objAfter = jsonp.apply(obj);
                if ( objAfter === undefined ) { return responseBefore; }
                safe.uboLog(logPrefix, 'Edited');
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
    });
}

function trustedPreventXhr(...args) {
    return preventXhrFn(true, ...args);
}

function trustedPreventFetch(...args) {
    preventFetchFn(true, ...args);
}

function trustedJsonEdit(jsonq = '') {
    editOutboundObjectFn(true, 'JSON.parse', jsonq);
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

function trustedJsonEditXhrResponse(jsonq = '', ...args) {
    jsonEditXhrResponseFn(true, jsonq, ...args);
}

function preventCanvas(
    contextType = ''
) {
    const safe = safeSelf();
    const pattern = safe.initPattern(contextType, { canNegate: true });
    const proto = globalThis.HTMLCanvasElement.prototype;
    proto.getContext = new Proxy(proto.getContext, {
        apply(target, thisArg, args) {
            if ( safe.testPattern(pattern, args[0]) ) { return null; }
            return Reflect.apply(target, thisArg, args);
        }
    });
}

function trustedJsonEditFetchResponse(jsonq = '', ...args) {
    jsonEditFetchResponseFn(true, jsonq, ...args);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 45 */
[trustedEditInboundObject,trustedJsonEditFetchRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,jsonlEditXhrResponse,noWindowOpenIf,setConstant,abortCurrentScript,spoofCSS,trustedSetConstant,trustedSuppressNativeMethod,preventXhr,preventSetTimeout,preventFetch,trustedReplaceArgument,trustedReplaceOutboundText,preventSetInterval,removeAttr,preventRequestAnimationFrame,abortOnPropertyRead,adjustSetInterval,abortOnStackTrace,addEventListenerDefuser,abortOnPropertyWrite,noWebrtc,noEvalIf,disableNewtabLinks,trustedOverrideElementMethod,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedPreventFetch,trustedJsonEdit,alertBuster,trustedJsonEditXhrResponse,preventCanvas,trustedJsonEditFetchResponse];

const $scriptletArgs$ = /* 3005 */ ["JSON.stringify","0","..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/\\/(player|get_watch)/","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","/player?","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..sideFeed.nodes.*[?.__typename==\"AdsSideFeedUnit\"]","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..__bbox.result.data.node[?@.*.__typename==\"SponsoredData\"]",".data[?@.category==\"SPONSORED\"].node","..node[?.*.__typename==\"SponsoredData\"]",".data.viewer.news_feed.edges.*[?@.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","body > div.full-container > div.full-container.text-center > div.mt-2[style=\"margin: 0px auto; display: block;\"] > a.Aikoi.donate[target=\"_blank\"][rel][href^=\"https://www.longosto.shop/?utm_source=\"] > img.img-fluid","visibility","visible","pubadxtag","json:{\"divIds\":[]}","aclib","json:{\"isShowingPop\":false}","aclib.runInPagePush","noopFunc","aclib.runBanner","{}","as","function","aclib.runInterstitial","1","Document.prototype.getElementById","\"/^[A-Z][-0-9A-Z_a-z]{3,}$/\"","Document.prototype.querySelector","\"/^[#.][A-Z][-A-Z_a-z]+$/\"","\"/^\\[data-/\"","Document.prototype.querySelectorAll","\"/^div\\[/\"","aclib.runPop","Document.prototype.getElementsByTagName","\"i\"","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","decodeURIComponent","condition","script.innerHTML","/.+/g","await","adsbygoogle","adsbygoogle.push",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","adblock","String.prototype.includes","json:\"gecmisi\"","googleads","json:\"googleads\"","gecmisi","++","g.doubleclick.net","length:100000","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","json:\"\"","unlock","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","[]","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","stmCustomEvent","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","document.querySelector","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","false","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","sensorsDataAnalytic201505.register","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","load","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber",".data.viewer.marketplace_feed_stories.edges.*[?@.node.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","Adcash","_blank","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","adblock_added","setTimeout","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","shift","/0x|google|ecoded|==/","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","Date.prototype.toUTCString","lobster","openLity","ad_abblock_ad","String.fromCharCode","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.getElementById","document.write","redirect","4000","inlineScript","sadbl","adblockcheck","doSecondPop","arrvast","onclick","1200","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","pbjs.libLoaded","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","mousedown","popundrInit","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","Notification","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","ExoLoader.addZone","href","a[href=\"https://vpn-choice.com\"]","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","error","Adblocker","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","alert","8000","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","navigator","FingerprintJS","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","ClickUnder","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","Pop","_wm","flashvars.adv_pre_url","flashvars.protect_block","flashvars.video_click_url","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","adBlock","spoof","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","Date","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","valid","document.body.appendChild","BetterJsPop","/.?/","vastAds","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.adv_start_html","flashvars.popunder_url","flashvars.adv_post_src","flashvars.adv_post_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","check","showTrkURL","/window\\['(?:\\\\x\\d{2}){1}/","isBlanketFound","showModal","myaabpfun","sec","/chp_?ad/","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","cmgpbjs","displayAdblockOverlay","google","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","#clickfakeplayer","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","detector_launch","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","/googlesyndication|inklinkor|ads\\/load/","inklinkor.com","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","length:2001","block","console","send","ab_cl","V4ss","popunders","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","MessageChannel","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","unescape","uas","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","parcelRequire","mdpDeBlocker","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","base64_decode","adsrefresh","/ai_adb|_0x/","canRunAds",".submit","mdp_deblocker","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","timeupdate","testhide","getComputedStyle","blocked","doOnce","popi","googlefc","angular","detected","{r()","!/ytmp3|dropbox/","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","timeSec","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","contador","Light.Popup.create","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","document.activeElement","json:{\"tagName\": \"IFRAME\"}","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","navigator.brave","tid","ppuQnty","stopCountdown","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","shortcut","suaads","/\\$\\('|ai-close/","/handleClick|popup/","a[target=\"_blank\"][style]","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","AdbModel","protection","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","visibilitychange","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/counter|wait/","tempat.org","doTest","checkAdsBlocked",".btn","interval","sec--","!buzzheavier.com","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","google_srt","json:0.61234","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","2","notifyExec","spinner","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","script[data-domain=","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","/^data:/","Document.prototype.createElement","\"script\"","prevent","litespeed/js","pop_init","adsbyjuicy","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","\"/chp_?ad/\"","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","{\"type\": \"cors\"}","src=atob","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","__cmpGdprAppliesGlobally","..admiralScriptCode","gnt.x.uam","runAt","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","()=>","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","HTMLScriptElement.prototype.setAttribute","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","AHE.is_member","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","DoodPop","__aaZoneid","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","Object.prototype.advertising","data.[].relationships.advert data.[].relationships.vast","offers","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","createAgeModal","Object[_0x","adsPlayer","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker","#downloadvideo",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","mixpanel.get_distinct_id","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","/adbl/i","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"AdaptationSet\"][@contentType=\"video\"][not(@bitstreamSwitching=\"true\")]])",".mpd","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","downloadTimer","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","f.parentNode.removeChild(f)","swal","keepChecking","openPopup","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","xv_ad_block","()=>{","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","/(?=^(?!.*(challenge-platform|jquery|challenges\\.cloudflare\\.com|jwplayer)))/","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler",".previewhd > a","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","removeChild","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","#continue","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]","asap stay",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","/width|innerHTML/","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","!yt2api","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","!clickmp3","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","app_vars.please_disable_adblock","proclayer","Math.imul","charCodeAt","afStorage","!coinsearns.com","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","ad_link","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","App.AdblockDetected","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","adb-btn","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl",".click()","a#redirect-btn","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","POSTPART_prototype.ADKEY","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","/\\.fadeIn|\\.show\\(.?\\)/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","pu_url","Click","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","updatePercentage","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","setCookie","/(?=^(?!.*(http)))/","$onet","adsRedirectPopups","canGetAds","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","!/^\\//","fakeElement","adEnable","ssaiInfo fallback.ssaiInfo","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","htmlSectionsEncoded","event.dispatch","adx","popupurls","/(?=^(?!.*(https|Parse|Image)))/","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","rejectWith","goog","document.body",".downloadbtn","abpblocked","p$00a",".data?","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","adskeeper","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","adSession","Cookiebot","\"adsBlocked\"","/appendChild|e\\(\"/","=>","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","np.detect","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","cpmecs","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","json:\"click\"","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.max.com/\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","HTMLImageElement.prototype.onload","sessionStorage","createDecoy","/form\\.submit|urlToOpen/","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","/\\.php\\b.*_blank/",".[?.media_entities.*.video_info.variants]..url_data.url=\"https://twitter.undefined\"","twitter.undefined","powerAPITag","playerEnhancedConfig.run","rodo.checkIsDidomiConsent","xtime","smartpop","Div_popup","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","method:GET url:!/idlix|jwpcdn/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","mode:no-cors","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","advertisement3","start","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","pda","w87.abd","w87.dsab","onerror|onload","img[onerror][onload]","/popunder/i","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","this","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","stackTrace","sandDetect","json:\"body\"",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/",".m3u8","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","malisx","alim","shutterstock.com","sorts.[-].recommendationList.[].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","/aff|jump/","!/mlbbox\\.me|_self/","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","zigi_tag_id","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","clearTimeout","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","nitroAds.createAd","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","..directLink","..props[?.children*=\"clicksCount\"].children","clicksCount","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","Dataffcecd","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","Array.prototype.includes","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","length:40000-60000","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","stoCazzo","_insertDirectAdLink","Visibility","importFAB","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&","json:\"0\"","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid","adId",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","method:/head/i","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","player.preroll",".redirected","promos","TNCMS.DMP","/pop?",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","fusetag","/await|clientHeight/","Function","..adTimeout=0","/api/v","vast popup adblock","!/\\/download|\\/play|cdn\\.videy\\.co/","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","api.theathletic.com/graphql body:/PostEvent|PostImpressions/","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","url:/api/statsig/log_event method:POST","ftr__startScriptLoad","url:/undefined method:POST","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/^https?:\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive"];

const $scriptletArglists$ = /* 3601 */ "0,0,1,2;1,2,3,4;2,5,6,7;3,8,9,3,10;3,11,9,3,12;4,8,9,3,13;5,14,15,16;5,17,9,16;5,18,19,13;6,14,15,20;6,21,15,20;6,21,15,22;7,23,24;7,23,25;7,23,26;8,27;6,21,15,28;8,29;4,30,9,3,31;9,32;8,33;9,34;10,35,3,31;10,36,3,31;10,37,3,31;11;12,38,39;13,40,41;13,42,43;14,44,45,46;15,47,48;15,49,50;12,51,52;12,53,54,55,56;12,57,58;16,59,60;16,61,62;16,61,63;16,64,62;16,61,65;12,66,58;16,67,68;17,69;17,70,71;18,72,73;17,74,75;17,76;17,77;11,78;13,79,80;12,81,39;13,82,83;19,84,85;18,86,87;18,88,87;17,89;20,90,1,9,91,92;21,43,93,9,91,92;22,94;12,95,54;12,96,52;18,97;17,98;23,99,100,101;19,102,9,9,103,104;18,105;20,106,1,107,91,108;20,106,1,109,91,110;24,111;19,112,113;20,106,1,9,91,114;19,115,116;21,117,118,119,91,120;20,117,1,121,91,122;20,123,1,121,91,122;19,124,125,126;18,127;12,128,39;19,129,130;16,131,132,133;20,106,1,134,91,135;25,136;4,137,9,3,138;12,139,52;25,140;2,141;19,142,143;17,142,143;12,144,52;12,145,146;2,147,73;12,148,146;12,149,52;23,150,151;12,152,153;8,154;19,155;12,156,52;12,157,54;12,158,52;17,159;26;12,160,52;12,161,52;12,162,52;12,163,52;12,164,52;12,165,54;12,166,52;12,167,52;19,168;22,169;19,170;19,171;2,172,173;23,174,175;23,176,177,101;13,178;12,179,9;17,180;17,171;27,181,182;19,183;12,184,54;12,185,54;12,186,54;26,187,9,188;17,189;12,190,54;17,191;12,192,52;17,183;12,193,52;12,194,75;12,195,54;12,196,54;2,197,198,7;2,199,200,7;12,201,202;12,203,52;17,204;12,205,52;12,206,52;12,207,52;12,208,54;12,209,52;17,210;25,211;12,212,52;12,213,52;12,214,52;12,215,54;12,216,75;12,217,54;12,218,52;12,219,54;12,220,52;12,221,52;12,222,9;12,223,54;12,224,52;12,225,54;12,226,52;12,227,52;12,228,54;12,229,52;12,230,52;12,231,54;12,232,54;12,233,54;12,234,54;12,235,54;12,236,54;12,237,52;12,238,52;2,239,200;12,240,54;17,241;26,242,173;12,243,54;12,244,52;28,245,246;12,247,54;12,248,52;12,249,52;12,250,52;2,251,252;2,253,173;12,254,54;12,255,52;12,256,54;12,257,52;20,258,1,259,91,260;12,261,39;12,262,75;12,263,54;12,264,52;12,265,54;12,266,202;12,267,54;12,268,52;12,269,52;12,270,52;12,271,54;12,272,52;12,273,52;12,274,54;12,275,202;12,276,54;12,277,52;12,278,52;12,279,52;12,280,52;12,281,54;12,282,52;2,283,200,7;12,284,54;12,285,9;12,286,54;12,287,52;12,288,52;17,289;12,290,54;12,291,52;12,292,54;12,293,52;12,294,52;12,295,54;12,296,52;12,297,52;12,298,54;12,299,52;12,300,52;12,301,52;12,302,54;12,303,52;2,304,173,7;2,305,200,7;12,306,52;19,180;2,307,173,7;12,308,54;12,309,52;19,310;2,172,311,7;2,172,312,7;12,313,52;18,314;12,315,54;12,316,52;12,317,54;17,318;12,319,52;12,320,54;12,321,52;12,322,54;12,323,52;12,324,54;12,325,52;12,326,54;12,327,52;12,328,52;15,329,330;12,331,332;2,5,252,7;2,333,334,7;12,335,54;12,336,52;12,337,52;2,338,173,7;17,339;12,340,54;12,341,54;12,342,52;12,343,52;12,344,54;12,345,52;12,346,52;12,347,332;12,348,52;12,349,52;12,350,54;12,351,52;28,245,352;12,353,52;12,354,39;12,355,52;12,356,52;12,357,52;28,245,9,358,359;12,360,54;12,361,52;12,362,54;12,363,52;12,364,54;12,365,52;12,366,75;20,367,58,368,91,369;12,370,54;12,371,52;12,372,52;12,373,75;12,374,332;12,375,52;12,376,52;12,377,39;12,378,39;12,379,39;12,380,39;8,381;3,382,9,3,383;28,384,385;22,386,73;8,387,388;28,384,389;22,390,391;19,95;12,392,1;19,393;12,394,9;22,395;25,396;8,397;5,398,54,399;5,400,54,399;5,401,54,399;8,402,403;8,404;8,405;4,406,9,3,399;10,407,31;25,408;25,409;28,9,395;18,395;12,410,153;13,411,412;13,413;18,414;18,415;25,416;20,26,1,417,91,418;2,9,391;25,419;29,420;12,421,39;30;25,422;13,423;19,424;28,245,425;29,426;13,427,419;25,428;25,429;25,430;29,431;25,432;28,245,433;28,384,434;18,435,436;25,437;25,438;29,439;17,440;12,441,52;13,258,442;13,82,443;2,444,173;25,445;25,423;28,384,446;25,447;12,38,52;25,448;11,449;25,450;25,38;29,451;2,452,173;28,9,453;25,454;25,455;13,456,457;25,458;27,459,460;13,427,461;29,423;25,462;25,463;28,384,464;28,384,465;13,90,466;22,467;17,155;12,468,75;12,469,52;19,470;13,427,471;13,472,90;25,473;13,427,474;29,475;29,476;13,477,466;25,478;28,9,444;13,427,479;28,9,480;13,481,482;25,483;18,457;13,484,457;29,448;25,413;13,411,485;25,486;25,487;29,488;29,489;13,490,491;2,492,493;27,446,494;25,81;12,495,332;12,496,332;25,497;12,498,202;23,499;26,9,500,1;25,501;28,502,503;25,504;13,427,505;13,427,506;13,427,39;25,507;25,508;12,509,332;25,472;13,446,423;25,510;25,511;25,512;12,513,9;12,514,332;29,515;12,516,75;29,517;29,518;29,519;12,520,75;25,521;13,427,480;29,522;25,484;23,523,524,525;12,526,146;2;29,527;25,528;28,9,423;25,529;12,530,332;25,531;13,486;25,532;13,533,534;29,535;22,536;13,427,537;26,538;25,539;29,540;18,541;12,508,75;25,542;18,543;25,544;12,545,52;12,546,75;29,547;28,245,548;28,549,550;13,484,551;28,552,553;29,554;13,82,555;12,38,146;12,556,9;12,557,9;12,558,58;28,559;18,560;25,561;18,562,563;12,564,75;25,565;28,9,566;13,427,567;12,568,9;25,569;27,396,570;28,384,571;24,572;28,573;27,484,574;25,575;12,576,52;12,577,153;27,258,578;2,579,580;25,581;12,582,75;18,583,1;12,584,52;12,40,153;25,585;12,105,332;13,586,461;12,587,75;13,411,588;29,589;12,590,591;28,9,592;25,593;18,594,436;13,456,436;18,595,596;25,597;13,43,90;12,598,75;13,484,599;22,444;28,9,449;25,600;23,601,602;29,603;12,604,332;25,605;13,606;13,43,607;13,608,609;28,552,610;18,611;25,612;25,613;31,614;25,615;25,616;25,617;12,618,52;13,490,39;12,619,52;29,620;2,621;26,622;18,258,200;25,623;25,624;25,625;13,481,626;29,627;29,628;12,629,332;18,630,631;12,632,75;12,633,332;26,634,635;13,445,105;28,384,636;26,637,563;29,638;29,486;25,639;28,245,610;25,640;12,641,332;28,384,563;13,642,550;13,43;25,643;18,644;29,645;29,646;28,647,648;13,649,650;29,651;28,384,395;13,411,652;25,653;12,654,332;25,587;18,642,436;13,472,43;25,655;29,656;18,657;18,658;25,517;31,486;12,659,9;18,481,1;28,660,648;28,9,611;13,411,450;13,450,661;25,662;25,663;25,664;12,665,75;18,630,563;25,666;28,384,630;28,667,668;13,669,499;29,670;23,601,671;18,672,200;13,673,674;12,675,332;25,105;13,676;28,9,677;25,678;12,533,75;28,679,680;29,681;18,682,683;13,587;13,456,684;19,685;13,686,687;18,688,563;28,384,689;13,427,690;12,413,75;18,691;28,692,693;13,427,415;29,81;18,694,252;28,695,696;18,697,73;13,456,258;18,698,563;11,699;13,411,700;11,701;12,702,54;12,703,9;25,704;29,705;18,706,707;13,490,105;12,708,52;25,709;26,710,563;25,711;12,712,332;17,713;18,714;2,715,173,188;12,105,52;12,716,9;8,173,717;11,9,718;13,26,43;13,719,720;13,450;29,721;17,722;12,723,39;13,427,724;12,725,332;12,508,52;25,726;18,688,727;18,728;25,729;28,695,730;25,731;17,732;12,733,52;25,734;13,446,450;28,552,735;12,736,75;11,737;13,472,738;25,426;19,739;12,740,332;25,741;13,490,742;17,743;12,744,52;28,9,745;29,746;12,747,52;18,748,252;13,427,749;25,750;26,9,751;25,752;26,9,9,1;18,753;13,490,754;17,755;13,756,492;13,446;28,9,757;25,758;12,759,9;12,760,9;12,761,9;13,427,756;25,762;27,700,763;28,502,764;28,695,765;13,539,766;25,767;28,502,444;13,427,768;13,456,769;25,770;29,771;18,444,563;13,481,484;29,450;23,772,773;13,774;13,43,472;13,367,775;29,90;23,776,777;25,778;25,700;22,779,436;18,253,780;12,781,332;12,782,52;13,427,783;25,784;12,450,153;25,785;28,786,449;12,787,75;25,547;25,788;29,789;23,790,791;26,792,173;12,793,332;12,794,52;28,245,795;18,796,73;13,547;25,797;28,384,798;13,799;12,800,39;25,801;13,427,423;28,384,802;18,480,200;18,803,804;17,805;29,793;18,806,1;26,807;13,490,808;13,809,810;12,811,332;25,812;25,813;25,814;18,815,436;19,253;12,816,332;29,817;18,818;22,819,436;29,820;18,444;11,821,718;13,490,822;29,823;12,43,52;28,9,824;25,825;12,826,52;18,827,58;12,828,52;13,490,253;12,829,52;17,739;28,695,830;12,831,58;13,477,90;13,367,832;25,833;2,834,493;12,835,202;25,836;25,603;13,427,837;12,105,58;12,838,58;18,839;23,840;29,841;8,842,843;13,844,764;18,427;18,845,436;29,612;29,846;18,796;13,490,847;12,848,1;12,253,75;29,849;28,245,850;25,851;13,852,614;12,853,75;29,854;18,395,1;28,9,855;18,856;12,857,52;13,411,858;12,504,58;13,456,859;13,456,860;29,861;13,539,859;13,82,862;25,863;27,477,864;18,865,866;22,867;23,601,868;29,869;13,484,870;18,95;13,411,871;28,245,444;12,872,332;19,155,739;25,826;18,873,73;25,874;25,875;25,876;18,480;25,877;29,878;26,9,9,7;31,253;12,879,146;13,880;13,446,499;25,881;12,882,75;27,883,494;12,761,39;12,884,9;12,885,9;12,886,9;12,887,9;12,504,332;18,796,391;25,888;13,490,889;12,890,75;13,490,891;13,490,892;18,893,563;18,894,436;25,895;29,896;13,427,897;13,427,898;13,427,889;18,890;13,490,899;13,427,900;13,490,706;29,901;13,26,902;13,82,903;19,171,125,126;18,153,493;28,384,904;28,384,905;13,481,630;18,688,334;18,906,252;26,848;12,907,1;26,848,334;31,908;18,909,334;18,688,198;28,245,735;11,910;29,472;25,911;12,912,332;13,427,105;19,913;18,914;28,915,916;18,917;12,918,52;13,427,919;18,688,436;13,484,920;12,921,52;12,922,52;28,695,923;13,477,43;12,924,75;29,925;2,926;29,927;13,669,551;29,928;12,929,332;12,81,52;12,930,52;18,700,334;18,461;29,931;18,932;12,933,52;18,934,563;12,935,75;29,929;28,384,936;22,688,200;25,937;25,938;28,939,940;29,941;25,942;27,484,494;23,499,943;2,944;29,945;12,946,75;13,459,607;13,427,947;22,948,949;25,90;13,427,950;12,901,75;12,951,75;18,952;17,253;18,953;13,809,245;13,490,954;13,169,674;25,955;11,956,1;12,957,75;12,673,75;26,622,173;12,958,332;28,502,959;18,960,635;12,961,332;18,962;2,9,9,188;18,963,73;18,693,391;28,245,197;25,555;12,964,1;12,817,52;25,965;26,621;18,966;26,9,9,188;12,967,1;28,245,449;25,968;25,969;13,81;13,427,970;11,971;25,477;13,972,973;13,608,745;26,974,436;29,975;28,976,745;12,977,52;13,79,889;12,978,1;28,245,979;11,105,58,980;19,981;28,245;12,982,332;13,983;13,984;13,985;13,986;28,695,987;25,988;12,989,332;12,990,332;12,991,332;18,992,58;11,993;13,841;25,994;11,995;12,996,52;25,997;25,998;18,999;12,1000,52;22,1001,436;28,552,1002;12,1003,332;25,208;13,411,764;13,700,1004;29,1005;12,480,332;25,1006;13,809,1007;25,446;12,1008,9;12,1009,9;12,1010,332;27,43,494;25,896;18,1011;13,490,1012;13,43,603;13,1013,444;18,1014;17,1015;23,601,1016;17,1017;18,954,563;27,82,494;25,1018;28,695,1019;18,1019;13,427,754;18,883,436;12,1020,1;12,1021,75;12,1022,75;12,1023,332;25,1024;18,105,1025;28,1026;25,1027;18,1028;18,153;13,484,1029;13,456,1030;25,1031;25,1032;25,1033;13,608,611;29,1034;12,1035,591;25,1036;13,484,1037;13,82,1038;25,1039;12,1040,75;12,1041,75;12,1042,153;27,490,1043;12,1044,75;19,1045;13,555,395;17,1046;12,1047,332;29,1048;25,764;23,499,9,101;11,1049;25,1050;19,155,1051;18,395,596;13,490,1052;13,484,1053;13,490,1054;29,1055;25,706;13,809,630;11,424,58;25,1056;25,1057;28,424,745;22,45,436;18,495;13,367,41;25,49;12,1058,332;12,1059,332;18,1060;25,527;25,1061;28,384,1062;28,1063,444;25,1064;12,1065,75;13,491,773;25,1066;25,1067;12,1033,52;25,1068;31,1069;25,1070;29,1071;12,1072,75;29,1073;12,1074,58;23,1075,1076;13,824,862;13,1029,862;29,1077;12,81,332;18,1078;11,253;12,1079,58;25,1080;29,1081;18,1082;12,1083,75;13,450,601;25,1084;13,1085;13,809,1086;12,1087,146;13,669,1088;13,79,1089;18,1090;19,1091;13,411,39;18,1092;29,1093;29,1094;28,695,1095;29,1096;13,427,858;13,1097,954;13,484,954;25,1098;13,490,1099;11,1100,718,980;29,105;12,1101,75;29,1102;28,1103,1104;13,427,1105;18,688;25,1106;8,1107;22,1108;13,79,1109;25,1110;13,484,566;25,1111;12,1112,75;13,491,1113;12,633,75;12,1114,202;18,858;27,385,1115;18,1116;25,1117;18,1118;18,1119,563;19,1120;12,885,39;13,526;28,9,1121;25,793;23,1122;25,1123;13,603,555;13,1124;19,991;25,1125;18,1126;28,939;12,242,75;29,1127;18,1128;22,1128;28,245,1129;25,1130;13,1131;13,484,1132;28,9,461;25,1133;22,525,727;22,1134;12,1135,39;13,487,1136;29,1137;28,384,1088;13,490,1138;18,1139;12,1140,75;22,1141;29,1142;18,781;18,9,58;28,9,1143;12,439,75;18,39;18,901,58;13,427,1144;29,905;13,427,1145;13,411,1111;18,793;12,1146,9;25,1147;12,1148,52;25,1149;13,411,105;26,1150;2,1150;25,1151;13,477,1152;18,630;28,9,1153;12,81,75;13,883,1109;13,411,999;26,1154;12,1155,1;18,1156;17,171,125;25,1157;18,1158,563;22,745;22,754;25,1159;8,1160;26,9,173,1;12,508,146;18,992;28,245,764;13,427,456;13,490,1161;13,427,253;13,411,754;13,427,1162;13,82,611;13,427,79;12,1163,75;17,1164;12,1165,54;17,1166;12,1167,332;27,1168,1169;5,1170,1171,1169;8,1172;12,1173,39;12,1174,52;12,1175,52;28,1176;8,387,1177;18,1178,631;18,1179;13,1180;13,456,1181;13,1182;28,1063,1105;25,1183;13,427,1184;18,1185,1;11,1186;18,630,1187;28,384,39;12,1188,332;28,695,1084;12,1189,54;28,384,745;18,1190;28,695,450;13,427,1191;13,490,1192;12,1193,75;12,95,153;13,484,105;17,1194;26,1195,436;18,1196,1;25,925;22,45;22,773;28,1197;25,1198;13,427,450;25,1199;12,1200,332;18,583,866;12,1201,75;12,1202,75;12,1203,332;12,253,153;11,1204;13,1205,764;32;29,1206;13,852,858;13,427,1207;23,1208;31,728;28,245,1209;25,1065;13,427,1210;13,82,90;13,427,446;28,245,9,358,1211;13,427,245;18,1212;17,95;12,1213,52;25,879;25,1214;12,1215,75;13,826;13,1216;23,601,1217;23,601,1218;23,601,1219;13,82,1220;25,1221;25,1222;13,477,1223;28,9,415;28,834,550;18,1224;27,881,1225;12,1226,153;18,745;13,642,338;25,1227;25,1228;23,840,1229;13,481,810;18,1230,73;13,258,1231;13,427,1232;18,1233;28,9,253;25,1126;13,427,1234;29,1235;28,245,1236;12,1237,75;18,1145;28,384,1238;28,695,793;22,95;12,1239,75;18,1240,436;19,1241;12,1242,332;13,427,1156;13,411,1156;12,1243,1;18,1244;8,1245;18,1240;28,384,1246;12,1247,75;12,1248,75;13,446,105;18,905;13,490,630;12,1249,332;25,1182;25,1250;25,1251;13,484,1252;12,423,39;25,1253;12,1254,153;13,481,1255;13,411,245;12,1256,75;13,90,460;18,799;28,9,450;18,1257;11,1258;18,1259;26,637,173,7;25,1142;12,1260,153;12,95,146;12,1261,39;25,1262;11,1263;18,1264;18,674;12,81,153;28,695,858;12,1265,58;25,1266;25,491;12,1267,332;25,1268;25,1269;18,706;25,1270;28,384,1156;8,1271;28,1272,1273;2,1274,173,7;13,1275;18,1276,1;18,253;13,427,1277;28,1278,1279;27,603,494;2,9,391,1;25,451;25,1280;12,1281,75;25,1282;11,1283;23,1284,1285;13,481,1156;13,481,1286;13,481,479;13,809,793;22,932;12,957,332;29,1287;15,1288,1289;25,1290;26,834,173,188;18,706,563;20,1178,1,1291,91,1178;12,1292,146;15,396,1293;26,710,173,188;2,1294,173,7;26,1295,173,7;26,1296,173,188;2,1297,173,188;12,1298,39;26,1296,173;27,456,793;26,834,173,7;26,1299,173,188;31,1300;28,799,1301;8,1302;2,1303,173;12,1304,75;13,481,1305;13,521,623;13,446,95;8,1306;8,1307;8,1308;18,1309;19,1310;13,1311,1312;18,1313;19,171,9,1314;12,1315,146;13,1311,932;19,1316;28,384,1317;13,481,1312;13,481,253;11,1318;12,1319,75;25,1320;23,1321,1322;23,1321,1323,101;23,499,1324,101;12,1325,75;23,1326,1327;28,799,1328;19,1329;26,807,173,7;25,984;25,1330;27,258,1331;26,1296,173,7;2,1332,173,7;26,710,173,7;28,245,1333;33,922,1334;28,695,677;28,384,1335;31,793;23,601,1336;28,695,1337;28,695,796;18,444,73;29,1338;23,1284,9,101;11,1339;12,581,39;17,764;29,1340;28,9,550;12,1341,52;2,1342;12,1343,332;12,1344,52;12,986,52;28,1345,610;28,1346,1347;2,9,173,1348;21,90,1349,332;29,1311;27,396,1350;25,1351;26,1296,436,7;26,1296,1352,7;28,245,1027;13,484,1337;23,1353,1354,101;25,985;26,1020,173,7;28,1345;18,1319;19,1355;12,1356,75;28,1357,1358;12,706,1359;17,1360;13,1361,1362;28,695,594;18,895;26,1363,173,7;2,1105,173,7;31,395;25,1364;28,799,710;26,1365,173,7;11,1366;28,384,1367;25,1368;23,499,1369;31,959;27,490,793;11,9,1025;26,1370,173;25,1298;26,1371,173,7;11,1372;18,1373;19,1374;11,424,718;18,9,563;18,424,436;12,1375,1;11,1376;31,1377;28,695,1378;23,499,1379;25,1380;28,245,1381;28,245,9,358,1382;25,1317;25,1383;19,1384;17,1385;31,95;19,1386;27,669,793;11,1387;26,9,173,188;2,9,173,188;19,95,1388;12,1389,153;15,1390,1391;18,1392;28,245,461;28,245,1393;18,1394;13,642,1395;12,1396,39;28,695,423;26,637;12,1397,75;33,922,1398;23,601,1399,101;28,245,1400;26,637,436,7;19,1401;28,799;2,9,596;13,456,965;12,1402,1403;26,637,436;2,944,436;13,24,79;19,722;22,1318;22,1404;2,1405,173,7;13,484,793;27,490,1406;4,1407,9,3,1408;11,1409;28,245,484;28,695,1410;13,484,1410;18,1411,73;18,1412,718;18,1412;12,1413,52;18,199,718;12,1414,332;18,1415;25,1416;27,82,870;27,79,1417;27,79,1418;27,79,1419;13,456,1420;12,1421,54;12,1422,52;13,1423;8,1424;21,43,118,9,91,1425;13,43,1426;29,826;28,245,550;13,427,550;13,42,1097;28,9,1427;13,456,599;13,1428,599;13,484,1429;13,484,1430;13,484,599,1431;16,1432,1433,1434,1435;13,1436;25,1437;13,521,1438;25,1439;11,1440;25,1441;28,9,548;18,1442;27,484,1443;12,1444,9;25,1445;29,1446;22,424;12,1447,39;18,1088;29,1448;13,82,1449;13,26,973;13,1450,973;28,9,973;13,82,973;13,477,1451;27,79,1452;13,26,1097;13,719,973;27,385,1453;13,1361,1454;25,1455;25,1456;13,1097,26;13,1097,973;13,1013,41;13,385,973;13,472,1457;27,79,1458;13,82,1459;17,1460;27,555,1461;13,42,43,1431;13,824,1462;13,40,1463,1431;13,491,1464;27,450,1465;13,24,41;13,481,1466;28,552,1467;11,1468;12,1469,202;18,1470;27,669,1471;28,1472,5,358,1473;12,1474,75;12,1475,1476;12,1477,52;26,1296;11,1478;12,1479,332;28,9,1480;18,1178;18,482,563;31,1481;28,384,932;27,642,1482;25,1483;16,852,1484,1434;18,1485;29,1486;13,1159,999;13,1159,999,1431;28,384,1487;18,460;19,1488,125,1489;17,1488,125;28,695,1490;16,61,1491,133,1492;12,1493,332;13,484,813;13,484,1494;25,1495;12,1494,52;9,1496;28,692,1156;13,1494;12,1497,39,1498,1499;15,1500,1501;12,1502,75;12,1503;19,1504;18,1505;18,1506;18,1507;18,1508,200;12,1509,52;12,1510,52;8,1511;20,1512,58,1513,91,1514;20,1512,58,1515,91,1514;31,1516;20,1512,58,9,91,1514;18,5,73;16,1512,1517,133;28,384,1505;13,484,1518;12,1117,52;12,1519,58;12,1520,332;26,1521,173,7;12,1522,146;29,1523;25,1524;23,657,1525;12,1526,153;12,1205,153;21,1527,1528,9,91,763;27,1529,444;15,1530,1531;12,1532,58;27,484,1533;28,384,1534;12,1535,1;13,427,477;31,169;2,1536,173,7;3,1537,9,3,1538;28,695,1539;3,1540,9,3,1541;12,1542,75;12,1543,75;13,1205,1544;13,809,1545;3,1546,9,3,1547;3,1548,9,3,1549;19,1550;12,1551,332;12,1552,54;8,1553;8,1554;28,245,1555;34,1556,3,1557;19,1558,1559;18,1560;12,1561,332;12,1562,39;28,245,1563,358,1291;18,1564;20,490,1,1565,91,1566;19,1567;18,1568;28,245,744;18,744;28,384,1569;28,9,1570;28,695,1571;12,1572,75;18,1573;12,1574,332;13,484,1575;13,608,396;11,1576;9,1577;13,809,1578;12,1579,202;27,456,446;28,1580,1581;15,1582,1583;3,253,9,3,1584;27,484,1585;11,449,58,980;13,809,1586;18,1569;13,809,1027;12,1587,39;12,1588,146;18,1191;18,1589;12,1590,332;13,411,385;13,481,858;12,1591,332;25,1592;13,490,1593;25,1594;26,1595;2,1596;18,1597;22,1597;12,1598,153;18,796,436;28,384,1599;18,1600;18,896;18,1601,1;13,490,95;13,90,1602;31,415;18,411;28,502,1603;13,669,754;13,427,1604;13,367,555;18,424;22,105;23,840,1605;2,710;28,695,1606;13,477,1607;12,1608,58;12,1609,332;12,1610,332;13,484,466;12,1611,153;13,427,1612;25,1613;12,1614,332;12,1615,332;18,901;25,1604;25,1616;25,1617;25,1618;13,798,79;12,1619,1;12,1620,332;18,1621;18,1622;12,1623,75;13,427,1240;31,858;18,1624;13,427,1625;27,427,1453;12,1626,153;13,539,491;27,1627,1628;27,484,1629;28,384,551;31,1630;13,427,1631;13,608,1632;13,427,1633;12,1634,52;12,1635,52;19,764;29,1636;11,1637;15,1638,1639;18,1640;13,446,395;13,490,1641;13,852,1642;12,1643,591;18,1207,436;25,1644;28,9,1645;12,1646,39;12,1647,52;26,710,173;18,1182;13,258,395;28,384,1052;25,1641;13,427,1648;13,555,1649;12,1650,332;28,9,1651;25,1652;12,1653,54;12,1654,75;12,1655,58;12,1656,54;12,1657,54;12,1658,58;8,1659;12,1660,52;13,456,1661;25,1662;28,695,105;31,1663;12,1664,75;12,1665,39;18,1575,866;12,1666,52;22,728;12,938,332;17,1667;29,1668;18,1669;25,1670;8,1671,1672;35,1673,9,1674;8,1675;8,1676;36,1677,1678;29,1679;18,1680;18,1681;18,1682;13,446,1683;12,1684,591;26,1685;29,1686;12,637,1;13,427,1687;26,1688;27,82,905;18,1689;28,245,423;12,472,52;25,1690;13,446,1691;12,1692,9;25,935;18,1581;18,1693;25,1694;25,1695;25,1029;13,82,1262;18,813;18,1696,866;18,1697,73;18,1698,436;25,1140;18,1699;27,79,1700;8,1701;18,1575;28,692;23,601,1702;12,1703,1;28,1346;18,1704;18,1705;18,1706,436;28,384,1707;18,1708;23,499,1709,101;12,1710,52;18,1711;25,1712;13,451;2,1713,1714;23,1715,1716;25,1717;18,1718;13,1005,1719;8,1720;28,245,1427;26,1721,436,7;12,1722,9;8,1723;8,1724;35,1725,9,1674;8,1726;12,1727,52;12,1728,75;18,1729;25,1730;26,9,9,1731;2,9,1732,1;22,1575;23,601,1733,101;18,1734,391;28,695,461;13,1735;28,695,43;13,490,1291;28,9,1736;23,499,1737;11,1738,58;25,1739;28,1740;25,1741;25,414;12,1742,332;12,1743,52;12,1744,75;18,1745;13,1746;13,427,1747;29,1524;31,461;27,1361,1748;28,786,90;18,1749,683;12,1750,75;12,1751,75;29,1571;25,1752;13,1753,1754;25,1755;25,1756;25,1757;13,477,1758;12,1759,39;13,367,1760;23,499,1761;13,1762;29,533;18,1763;17,1764;15,1765,1766;15,1767,1768;12,1769,332;12,1770,332;28,9,1771;12,395,1;25,1772;22,1773,436;13,477,1774;29,1775;12,477,146;28,245,1776;13,1777;12,1778,332;12,1779,332;13,411,253;13,669,315;2,1780,1781;12,1782,52;25,1783;25,1784;28,1580;28,9,1785;27,79,9;12,1064,75;13,446,24;22,490,391;27,411,999;8,1786;13,484,1787;12,1788,9;12,1789,1;28,245,1216;18,24;27,26,1790;13,82,614;19,1791;13,490,793;28,384,880;13,411,1192;18,1792;19,1793;28,695,1794;12,1795,52;13,555,1796;27,965,494;25,604;13,427,1597;21,43,1797,1798;8,1799;19,1800,9,1801;27,826,1802;23,1803,1804;13,484,1642;28,1805,1806;26,1807;28,799,197;28,799,1808;13,90,745;12,1809,75;12,1810,52;13,411,889;36,1811,1812;8,1813,1814;35,1815,9,1816;19,1817;13,477,460;18,1818;27,539,9;25,1819;18,1820;25,832;27,539,1821;25,1822;26,444;27,883,446;28,695,745;23,601,1823;18,1824;28,245,954;26,1825;13,90,43;25,890;25,1826;29,1827;12,1828,52;12,1829,58;12,1830,9;17,1831;19,1831;18,9,252;25,1523;13,700,1832;28,1063,39;13,1833;26,1834;25,1835;28,1836,1837;23,601,1838;2,1839;13,24,1840;13,490,1841;17,1842;13,809,95;26,1843;26,1844;23,1326,1845;13,427,583;28,1063,578;28,245,1846;2,1847,252;13,24,1848;25,1849;23,1075,1850,1851;17,155,125;37,1852,3,1853;3,1854,9,3,1853;8,1855;26,1856;22,1857;26,1858;13,484,1859;12,1214,52;18,1860;18,1861;26,1862;19,1863;13,490,1864;19,1865;25,26;26,1685,1866,1867;8,1868;25,1869;13,539,486;13,1870;12,657,52;12,1871,52;13,484,1872;27,82,460;2,1873;11,1874;18,1875;19,1876;12,1655,1877;12,1878,39;18,958;13,484,412;27,484,1879;13,459,614;12,1880,1;28,786,1881;18,1882;28,245,1290;3,1883,9,3,1884;26,1885;11,1886;26,1020,173;18,1887;27,826;18,991;28,384,895;28,1063,1888;25,1889;25,535;26,1890;13,427,95;11,1891;19,1892;23,1893,1894,101;38,155,1895;12,1896,54;12,1897,52;18,1898;22,1899;19,1900;13,490,1901;27,1902,1903;13,809,1904;18,1905,563;12,1906,332;2,444,198;2,796,707;27,82,9;12,1907,332;27,79,1790;26,1908;27,427,494;25,1909;17,1910;18,1911;25,1912;12,1913,52;12,1844,1;27,82,763;27,456,253;27,79,494;12,1873,146;25,1827;13,1914,1915;22,1916;11,1917;28,1918;25,1919;12,1920,58;13,484,395;13,481,460;27,1921,1922;13,1923;27,1924,385;11,1925;2,1926,1714;27,459,763;2,1763,173;12,1927,52;18,1928,200;27,24,494;23,499,1929;17,424;13,1159;11,424,1;19,1640;13,490,1013;25,459;13,490,445;12,1930,52;19,196;18,1931;13,427,24;13,490,578;17,1932;28,384,1933;25,533;8,1934;8,1935;29,1159;28,384,1936;17,1937;13,446,773;13,484,1938;25,1939;27,1053,446;25,25;27,484,870;18,1940;17,1640;13,669,1941;23,601,1942,101;23,1943,1944,101;17,1945;23,1326,791;26,710,9,188;12,1946,9;12,1947,202;23,1326,1948;13,427,1949;2,1950,200;12,1951,332;28,384,550;13,258,444;25,1952;28,245,1953;12,1954,75;2,1955,173;2,1956,173;12,1957,1;13,1914;13,491;27,24,763;25,1958;13,490,858;19,1959;17,1960;13,456,1961;2,1962,173;12,1963,52;12,1964,75;18,1965;39,155,56,1489;28,695,1568;28,9,1966;13,608,728;28,1063;25,1967;13,1968;13,79,992;13,411,1901;12,1969,332;12,1970,332;28,9,1971;2,1972,198,188;12,1973,75;12,1974,9;28,1176,9,358,1975;22,1976;13,427,608;27,82,444;13,427,1977;18,9,436;12,1978,54;12,1979,75;26,1980;31,105;13,481,764;18,1981;2,637;13,1982;13,82,477;8,253;36,1983,1984;2,1985,436,7;19,155,125,126;19,1986;18,1987;28,384,1988;23,1989,1990,101;12,1991,52;26,710;27,446,1992;19,1993;13,456,1994;23,1326,1995;2,415,493;25,1996;29,1997;8,1998;13,427,1999;25,2000;18,2001;27,484,2002;26,1274;12,2003,332;13,169,2004;13,427,793;18,2005;26,1928;12,253,39;12,1006,39;25,2006;13,824,466;13,411,1861;13,484,2007;18,2008;13,477,999;25,498;12,2009,52;12,81,591;12,2010,39;19,2011;17,2012;12,2013,58;25,2014;25,2015;29,2016;18,2017;12,935,52;13,852,90;11,2018;28,2019,1881;13,427,2020;13,809,2021;12,2022,52;18,2023;12,2024,39;12,2025,75;11,2026;22,253;25,2027;13,427,2028;25,2029;2,2030,173;29,1024;25,2031;22,2032;29,1916;28,395;12,2033,75;25,2034;13,484,2035;26,2036;13,491,2037;18,688,2038;2,1357,200;13,477,614;12,2039,75;25,2040;17,2041;28,245,2042;17,1339;25,1247;19,2043;25,2044;25,385;18,601;27,459,2045;25,2046;25,2047;13,719,764;25,2048;31,764;13,82,2049;13,539,2050;13,367,1038;26,2051,866,188;13,490,932;27,484,1453;25,2052;25,2053;13,427,2054;13,484,423;26,2055;13,2056,674;12,2057,75;13,2058;18,2059;17,1488;13,427,2060;27,484,2061;18,1508;13,2062,105;25,2063;12,2064,75;19,95,2065;13,2066;12,2067,332;12,2068,52;2,2069,563;23,601,2070,101;28,695,658;8,2071;13,2072,1117;18,153,718;26,1020;29,856;12,2073,146;13,2074;28,245,2075;12,764,39;13,484,858;18,9,73;18,566;2,5,200;19,2076;12,1980,1;11,2077;25,1916;29,1662;13,490,2078;12,1205,9;12,2079,75;8,2080;8,2081;3,2080,9,3,2082;35,2083,9,1674;13,26,2084;28,245,2085;28,384,105;17,1310;17,2086;28,9,82;28,695,2087;27,642,2088;12,2089,1;17,2090;18,1663;13,43,2091;18,626;22,2092;13,427,2093;13,484,1088;23,601,2094;18,1928;12,2095,1;26,637,173,188;18,2096;18,2097,252;11,2098;23,1326,2099;23,1326,2100;13,2014;12,2101,75;12,2102,1;8,2103;27,832;19,2104;23,2105,2106;23,2105,2107;23,2105,2108;23,2105,2109;18,2110;28,384,555;28,384,479;28,9,905;22,2111;28,9,2111;28,9,2112;23,1326,2113;12,2114,39;29,2115;18,2116;27,427,2117;12,2118,52;19,2119;8,2120;8,2121;18,2122;12,2123,1;13,2124,764;28,9,1145;31,2125;20,258,1,52,91,105;18,796,252;19,2126;12,2127,52;12,879,52;22,1191;12,2128,332;13,706;19,2129;23,1326,2130;12,2131,332;29,2132;18,149;12,2133,202;28,245,2134;12,2135,75;12,2136,52;12,2137,332;2,2138,198;29,2139;28,799,881;25,2140;26,848,9,188;17,2141;18,1698;13,2142;25,1337;28,695,2143;12,2144,2145;23,657,2146,101;23,601,2147,101;19,2148;19,2149;13,411,1145;18,2150;18,245;13,539,79;6,2151,2152,2153;18,2154;12,2155,75;18,2156;18,2157;11,2158;27,484,2159;28,9,2160;13,427,2161;22,2162;13,427,965;18,423;18,2163;18,2164;13,411,149;19,2165;28,384,2166;12,807,1;12,2167,52;16,852,2168;27,809,1922;27,1592,494;27,1450,793;18,2169;18,2170;8,2171;8,2172;13,521;18,2173;8,2174;31,2175;13,1662;18,2176;13,484,2177;36,2178,2179;13,1097,1820;12,2180,332;12,2181,332;18,594;11,2182;26,2183;31,477;12,2184,75;13,43,2185;2,2186,2187,7;18,1191,866;12,2188,332;12,2189,75;19,2190;12,958,52;28,2191;19,2192;29,833;28,695,2193;12,2194,202;28,695,155;12,2195,332;31,1156;26,2196;0,2197,1,2198;20,2199,1,2200,91,2201;2,2202,173;26,2203,173;18,2204;13,484,461;12,2205,332;28,384,764;29,2206;29,2207;29,2014;13,427,508;18,2208;18,1191,804;25,2209;26,2210,173,7;18,409;27,43,2211;13,484,245;12,1939,52;28,695,2212;12,2213,75;27,258,2214;11,2215;23,446,2216;18,614;27,456,2217;25,2218;23,499,2219;28,1063,2220;18,2221;12,2222,202;28,695,2223;18,2224;18,1188;18,2225;27,43,852;19,2226,2227;18,2228;18,2229;12,2230,1;12,2231,75;18,482;13,809,1699;27,2232,2233;25,2234;29,585;12,813,75;29,2235;12,2236,2038;26,444,173,7;13,2237,395;27,2238,2239;28,384,490;22,870;12,854,52;27,965,2240;18,2241;13,481,1162;25,1392;18,2242;29,2243;29,2244;23,601,2245;8,2246;25,2247;15,396,2248;12,2249,75;15,2250,2251;16,2252,2253;26,710,436,7;12,2254,39;12,2255,39;12,2256,39;20,809,1,2257,91,1346;2,2258,173;17,2259;12,2260,58;12,2261,58;18,2262;13,608,427;18,578;27,484,793;23,499,2263;12,2264,1;29,2265;11,2266,58;22,415;28,695,2267;12,2268,1;18,2269;18,2270;24,2271;18,2139;12,2272,52;18,2273;12,2274,75;18,2275,2276;12,2277,54;12,2278,54;19,2279;18,847;28,245,2280;18,2281;18,81;12,2282,718;25,2283;25,338;12,2284,2285;18,2286;18,2287;12,2288,52;17,2289;29,710;13,258,105;13,42,444;13,490,2290;29,2291;22,2292;12,2293,52;12,2294,54;14,2295,45,46;14,2296,45,46;8,2297;3,2297,9,3,2298;19,2299;3,2076,9,3,2300;12,2301,332;12,2302,332;12,2303,332;4,2080,9,3,2082;35,2304,9,1674;18,1763,683;11,9,58;28,245,2305;22,2306;27,90,2307;27,459,427;31,2308;19,2309;28,695,1749;24,424;12,128,153;8,2310;17,2311;6,2312,2313;12,2314,52;13,411,2315;28,384,2316;12,2317,2318;28,245,2319;8,2320;20,2321,1,39,91,2322;25,2323;12,2324,52;28,552,2325;13,90,2326;13,809,858;27,484,578;2,2327,173;26,2328,173;12,2329,332;23,499,2330,101;28,245,2331;19,2332;12,2333,52;28,384,5;12,1958,52;18,2334;28,384,642;13,484,2335;23,499,2336;29,2337;31,479;29,2042;12,2338,332;12,2339,332;8,2340;3,2340,9,3,2341;28,1019;12,2342,52;18,1599;12,2343,332;26,415,436,7;13,1383;12,2344,1;2,2345;18,2346;18,2347;35,2348,2349,1674;8,2350,2351;25,2352;13,2353;3,2354;8,2354;22,889;13,481,24;12,2355,54;26,2356;19,2357;3,2358,9,3,2359;8,2360;12,2361,591;13,491,2362;25,2363;13,427,764;13,700,1029;13,2364;18,2365;23,657,2366,101;23,601,2367,101;27,446,2368;12,2369,75;12,2370,146;5,2371,2372,2373;12,2374,1;12,2375,1;12,2376,58;12,2377,9;18,2378;27,456,2379;25,2380;28,384,2149;19,2381,2382;23,601,2383,101;13,484,40;16,24,2384;27,258,2385;17,2386;17,2104,2387;12,2388,39;12,2389,39;28,9,2390;27,484,2391;28,245,2392;4,2393,9,3,2394;4,2395,9,3,2396;4,2397,9,3,2398;4,2399,9,3,2400;4,2401,9,3,2402;11,2403;40,2404;11,2405;12,2406,2145;25,43;18,754;12,2407,1359;12,2218,332;29,1958;12,2408,52;29,1341;12,2409,1;13,481,2410;12,2411,9;19,722,125,126;13,24,105;18,2412;19,2413,125,1489;28,695,2414;13,1368;13,427,2415;2,2285,173,7;17,2416;29,2417;19,2418;12,2419,52;12,2420,332;35,2421,9,1674;18,2422;29,128;13,809,2423;17,2424;26,1780;18,1771;2,2425,436,7;2,944,436,7;29,1140;26,9,436,7;2,637,173,7;13,427,2426;28,384,253;17,722,125;22,2427;13,40,1467;12,2428,332;28,245,2429;18,2430;2,2431,707;19,2432;23,601,2433,101;11,2434;22,2435;19,2436;19,2437;18,9,2438;18,2439;3,2440,9,3,2441;13,491,2442;12,2443,9;28,245,5,358,2444;17,2445;19,2445;2,745,173;18,735,1;25,2446;13,26,41;13,676,2060;12,2447,75;25,2448;13,427,2346;12,2449,75;17,2450;28,552,965;17,2451;19,2451;17,2452;8,2453;8,2454;18,2455;19,2456,125,1489;27,43,2457;19,2458;12,2459,52;12,1402,75;12,2460,75;12,2461,1;12,2462,75;12,2463,52;19,2464;8,173,2465;19,2466;35,2467,9,2468;12,514,52;12,2469,202;13,427,499;19,2470,2471;12,2472,52;28,245,796;13,427,2473;3,2340,9,3,2474;12,2475,39;12,2476,1;8,2477,387;12,2478,2479;27,411,2480;18,2481;18,2482;25,2483;12,2484,75;12,2485,58;12,2486,332;13,427,1019;41;28,9,1581;27,484,2487;12,2488,52;12,2489,52;23,2490,2491,1851;18,169;27,809,1156;12,1869,9;13,852,444;31,2492;25,2493;17,95,125;26,2494,436;2,637,173;18,1178,563;8,2495;12,2496,52;26,1780,173,188;26,637,173;13,427,2497;13,1134,2498;27,24,2499;12,1617,52;18,2500;28,245,2501;25,1750;18,1213;12,2502,202;20,490,1,153,91,2503;28,384,2504;22,2505;18,1604;13,411,2506;12,2507,75;31,466;8,2508;18,2509;27,367,763;12,2510,75;17,2511;12,2512,52;20,490,1,153,91,1145;19,155,2513;13,490,2175,2514;13,809,2515;18,2516;29,2517;12,2518,1;11,2519;28,245,965;18,2520;25,2521;12,2522,58;8,2523;12,2524,75;19,155,9,126;2,1780,436,7;13,411,2525;8,2526;8,2527;8,2528;13,1134,2529;19,2530;18,2531;18,2532;18,2533,683;18,2534;28,695,2535;28,695,395;28,692,2536;8,2537;8,2538;8,2539;6,2540,9,2541;6,2542,9,2543;6,2544,9,2545;6,2546,9,2545;6,2547,9,2548;6,2549,9,2550;3,2551,9,3,2552;13,484,41;2,1020;3,2553,9,3,2554;12,2555,52;12,2556,1;21,2557,118,2558,91,2559;12,2560,2561;13,1134,2562;18,2563;12,2564,52;20,258,1,2565,91,2566;28,384,2567;12,2568,2569;18,2570;18,2571;19,2572;3,2573,9,3,2574;18,2212;18,2575;27,490,2576;12,2577,9;40,2578;17,2579;26,2580,9,7;12,2581,39;12,1236,39;3,2582,9,3,2583;19,2584;11,2585;13,1762,2586;13,481,1749;13,719,2587;18,1749;18,38;12,2588,332;12,2589,1;18,2590;13,319,105;28,245,2591,358,2592;36,2593,2594;12,2595,39;19,2596;29,1396;3,2597,9,3,2598;12,1006;3,2599,9,3,2600;28,245,2601;13,490,2602;11,2603;18,484;23,499,2604,525;23,499,2605,525;28,695,2606;13,809,2607;25,1953;8,2608;15,2609,2610;25,2611;13,490,2612;13,490,1019;12,2613,75;12,2614,75;11,2615;28,695,24;8,2616;31,2617;8,2618;13,1005,2619;19,2620;22,566;11,2621;2,9,391,7;11,2622;13,456,66;12,2623,332;15,2624,2625;23,499,2626;18,2627;12,414,332;22,409;28,245,2628;25,2629;13,539,2630;11,2631,718,980;8,2632;8,2633;12,2634,75;28,245,2635;19,2636;27,484,2637;11,2638;13,2639,2640;22,49;27,484,2641;12,2642,54;27,490,494;12,2643,58;12,2644,58;19,2645;12,2646,54;25,2647;12,2648,52;13,456,490;11,2631;28,695,508;11,2649;11,2650;11,2651;28,245,2652;11,2653;28,384,578;20,642,1,2565,91,2654;20,642,1,2655,91,773;28,695,1871;12,1396,52;8,2656;28,695,914;13,809,764;28,245,2657;13,809,796;3,2658,9,3,2659;19,2660,2661;3,2662,9,3,2663;19,2664;18,2665;21,43,2666,2667;21,43,2668,75;12,2669,52;13,446,965;12,1705,54;12,2670,52;12,911,52;28,245,2671;18,2672;35,2673,9,2674;6,2675,9,2676;12,2677,39;13,2678;18,2679;29,2680;9,2681;9,2682;28,245,2683;17,2684;25,2685;38,2686,1460;38,2687,2688;38,2689,2690;38,2691,2692;18,2693;17,2694;29,2695;25,2696;18,2697;27,2639,2698;25,1571;25,66;19,1329,125;8,2699;8,2700;13,490,461;19,2701;13,809,480;12,2702,332;23,499,2703;36,2704,2594;17,2705;8,2706;25,2707;38,2708,2709;38,2710,2711;38,2712,2713;3,2714,9,3,2715;3,173,2716,3,2717;3,2718,9,3,2719;18,45,563;12,2720,52;26,2721;2,2722,2723;18,2724;18,2725;13,427,2726;12,2727,75;20,642,1,2728,91,2729;23,2730,2731,101;2,9,9,1;12,2732,54;12,2733,52;12,2734,52;13,0;12,2735,52;12,2736,52;12,2737,591;3,2738,2739,3,2740;3,2738,2741,3,2740;3,2742,9,3,2740;8,2742;8,2738,2739;8,2738,2741;35,2743,2744,1674;13,79,486;12,2745,332;12,2746,153;12,2747,332;12,2748,54;25,2749;29,2750;18,2751,866;12,2752,332;28,2753,444;12,2754,52;29,2755;29,2756;8,2757;35,2758,2759,1674;35,2760,2761,1674;35,2762,9,1674;12,2763,58;12,1140,58;29,2764;18,105,563;13,484,2765;4,2766,9,3,12;42,2767,2768;12,2769,54;13,490,395;8,2770;12,1685,1;12,2771,52;12,2772,75;16,2773,2774;13,1361,706;13,484,865;15,2775,2776;6,2777,2778,2779;6,2780,2781,2779;23,499,2219,101;23,499,2782,101;13,427,2783;15,1869,2784;17,2785,125;12,905,52;28,786,423;19,2786;13,24,395;12,2787,9;13,484,2788;11,449,58;12,712,52;19,2789;12,2790,202;13,809,965;28,695,2791;13,484,1111;12,2792,54;12,2793,52;12,511,39;13,1134,793;13,427,2794;18,2795;13,258,2139;18,9,2796;18,2797;22,2797;28,384,2798;28,692,2799;12,2800,54;12,2801,146;18,1192;28,695,444;31,1864;22,1940;31,1940;12,2802,52;13,49;18,43,2803;12,2804,52;27,1134,2805;28,695,578;19,722,125,1489;2,1985,9,188;13,484,2806;16,1512,2807,133;27,484,2808;31,1568;12,2809,52;14,2810,1928,1052;27,484,446;27,555,2811;8,2812;18,2813;27,2814,2815;11,449,2816;13,2817,1462;13,491,2818;11,2819;19,155,2820;19,155,2821;12,2822,75;12,2823,75;13,427,2824;12,2825,52;13,456,461;12,2826,52;28,695,1097;18,1411;19,2827;13,484,2828;18,479;27,43,2829;19,2830;12,149,146;16,2773,2774,1434,2831;39,2832,991;18,2833;18,9,391;26,2834,436,2835;18,2836;28,245,2837;12,2838,1;3,173,2839,3,2840;20,2199,1,2841,91,2842;28,695,2843;28,245,2844;12,2845,332;11,2846;25,2847;25,2848;25,2849;25,2850;25,1763;25,2851;25,986;25,2852;13,809,2853;23,499,2854,525;18,2855;11,2856,58;12,2857,75;13,481,578;28,695,854;27,539,2858;13,642,965;28,695,2859;18,2859;12,837,332;28,695,1027;12,2860,39;18,2861;15,1530,2862;33,922,2863;17,2864;12,2865,332;12,2866,332;12,2867,54;12,2868,54;31,155;13,809,992;25,2869;19,2870;18,155;43,2871;28,384,508;13,484,1019;17,2872;28,384,2873;15,2609,2874;18,2448;26,2875,436,7;28,245,2876;13,809,105;8,2877;18,2878;28,2879,744;22,2880;18,2881;29,2882;28,695,2883;19,2884;11,2885;18,2886;13,809,461;12,2887;8,2888;28,245,2889;11,2890;11,2891;28,695,2892;31,1019;18,2893;19,2894;17,2894;3,2076,9,3,2895;4,2076,9,3,2895;19,2896;8,2379,2897;28,695,169;8,2898;19,2899;12,2900,75;12,2901,52;12,2902,75;4,2903,9,3,2904;42,2905,3,2906;28,245,674;13,813;12,2907,332;12,2908;12,2909;44,2910,3,2911;12,2912,52;28,245,601;13,1361,870;18,2913;13,809,2914;28,1580,444;28,939,1763;18,2915;11,2916;44,2917,3,2918;13,456,1178;12,2919,52;28,245,2920;18,171;18,2921;13,481,2922;12,2923,54;18,2221,436;28,384,2924;18,2925;42,2926,3,2927;8,2928;11,2929;8,2930;8,2931;17,2932;12,2933,52;13,484,2934;25,2935;29,2936;27,450,1054;19,2937;12,2938,39;12,1767,39;12,2939,332;17,2940;25,2072;17,2941;17,2942;12,2943,52;8,2944;28,9,2945;12,2946,52;20,2947,1,2948,91,2949;12,2950,9;8,2951;12,2952,146;24,2953;12,2954,54;12,2955,54;17,2956;12,2957,54;20,1756,1403,2958,91,2959;17,2960;19,2961;12,2962,52;12,2963,52;27,2964,456;19,2965;19,2966;23,2967,2968,101;15,2969,2970;12,2971,52;17,2972;17,2973;17,2974;23,499,2975,525;12,2976,52;19,2977;29,2978;12,2379,75;19,2979;25,42;25,2980;29,2981;22,2982;27,2983,2984;17,2985;19,2986;19,2987;19,2988;19,2989;17,2990;17,2991;17,2992;12,2993,52;19,2994;19,2995;17,2996;19,2997;19,2998;19,2999;17,3000;19,3001;17,3002;44,3003,3,3004";

const $scriptletArglistRefs$ = /* 12937 */ "363;996,1674;1672;101;1548;25;83;428,575;25,438;2823;423,438,750,1102,1103;1627;1107,1992;1674;1278,2418,2419;25,423,424,425;1675,2066;1627;25,904;1627;1627;1627;2661;3314,3315;27,346,464,471,1861;386,2612,2613;363,464;1354;516,1676;1627;3100;1025;1983;396,1627,1755;101;488,1103,1167;25;912;1627;1627;1627;2661;1627;2897,2898,2899,2900,2901,2902,2903,2904;25;25,346,406,410,411,412,413,1674;438,964,965,966,967,968,969;1627;2845;996;346;1672;438,679;633;3115,3116;1179,1180;1674;996;25,346,438,1676;343;97;25,2273;101;370;101;370,377,406,790;96,394;438,2641;181,698;25,438;904;25,399;3578;996;331;1627;25;25,399,996,1675,1764,1765;423,438,750,1196,1673;3470;25,464;25,750,1197;25,334,346;590,679;1627;343;423;942,1269;120,132,528,670;2649;1349;1627;779,1509;25;27,1677;1627;363,370,438,487,750,1384;101;826,1295,3016,3017,3018,3019,3020;27,362;208,209;2374;3389;28;375,2019;1548;1675,2066;2955,3431;1675,2066;1678,2748;370,404,405,1672;120;1141,3470;1627;640;464;25,1045;2117;3514;343;1627;1786;96;96;1627;1787;1627;1349;1627;25,438,996,1560,1561;25,96,438,1547,1548,1549,1550;579;363,370,438;370,438,464,857,1086,1087,1088,1675;346,363,616;25,406,1548;794;370,438,750;1627;25;1789;1627;2752;438;1276,1627,2487;1627;722;3533;1627;1409;346,430,458;1627;1268;1187;1548;996;1983,1984;1676;1997;25,96,438,1547,1548,1549,1550;1279;2085;1627;381,1638;25,346,747;25,1603,1623;996;1627;2756;25,26,27,28;1049,1627;528;25,425,426,427,802;1627;131;1278;2099,2100;598;559;25,679,2430;25;25,399;3209;346,819;370;101;904;900;3033;442;357,377,438,750;826;1107,1359;1753;1235;1676;25,363,438,530,574;904,1150,1191,2537;431;2533,2534;579;371,996,2634;25;773;1107,1443,1676,2141;25,3028;1587,2622;996;91;3412;340,341;399,400;579,612,1648;351;96,1737,1738,2332;2121,2946;25;313,1275,1627;697,2336;370;2508,2789,2790,2791,2792,2793;438;394;113,1919;1507,1508;1627;1999;3084;2288;2299,2437,2502;1386;25,1764;25;357,581,812,813;1380;334;25,423,438,750,1196,1673;423,438,750,1673;438,1194,1195,1674;352;904;1674;1548;3217;394,2364,2365;444,601;343,1627;120,132,343,528,606;1252;370,484,996,1548;1272,1627;1349;1646;25,1332,1673;1548;25,763,1673;579,1280,2263;1674;1349;1345;1349;543;346,363,486,616,841;1206;1627;101;1738;904;25,2993;579;28,532,579;579;1758;1151;1151;1151;579;28;25,373,1259;552;374,1110;3110;1107,1714,2141;3115,3116,3446;275,276;439;346,439,464;3063,3064;2469;1627;1548;1627;2722;702,703;25,904;438;3504;458,579,1190;847;579,1178,1548,1648;679;1627;904,1478,1479,1480;3415,3416;1700;1548;25,826,1676;861,996,1131;1627,1754;1627;1937;96;25,826,1675,2023;1738;909,1673;1276,1627,1633;672;2785,2786;25,425,426;1627;113,691,1983,2216,2801,2802,2803,2804;1627;2498;1548;464;25,1962;2464;159,160;123,124,2431;370,439,464,852;101;346,363,616;25;-387,-2613,-2614;25;25,378,464,563,616,697,745,760;3222;3406;1335;25,779;776,1183,1627;27,666,2894,2895,2896;28,375;904;501,1120;532;1307;1627;25;404;25,996,1675,1687;464,1548,1675;1627;1889,1890;464;25,1679,1857;996;1548;159;438,1673;1441,1442;25,406,445,446,447;463;2760,2761;1673,1674,1675,1678;2557;2557;2975,2976;25,27,381,590;25;776;1603;25,1674;579;25,42,43,44,45,46,47,996,1548;447;346,363,464,616;1675;25,488,1167;488,1103;1037;100;1944,1945,1946,1947,1948;1111,1112;1673;113,3109;1738;385;1787;1675;426,802;426,802;52,53,1271,1627,1754,2371;2164;365;351,1754;25,892,893;601,869;343,1739,1740;477;25;25;1627;101;904;48,49;25,996;2000;1548;1548;215,343;679,1675,1680,2795,2796;904;579,1658;1675;438,750;579,1606;904;48,49;25,579;373,579,714;996;464,530,2998,3000;640;1700;428;1107;25,438;1059;339;861;1288;452,579;1627;1359;1627;1627;28,120,579,2171,2172,2173,2174;25,699;1758;1191;1554,1575,1576;2389,2390;579;25,464,1676;904;904;1627;343;55;25;579;343;1627;1672;779;25,579;484;904;2680;28,579;25;1645;25;25,1700;438,668,1506,1507,1508;2714;828;1675;1700;25,1700,1701;1676;2519;25,438,1107;1165;1738,3547;25,464,1673,1675;394,1725;1257;1733;904;484;3068;1627;3047;25,561;399;25,1548;25,42,43,45,46,47,1548;25;25,996,1764;458;1095;362,370;1257;1142,3470;1335;904;82;27,996;438;1672;375,1612,1613;25,378,590,679;464;1978;399,951;1674;1627;438,679;996,1684;1672;313,353,1275,1628;3438,3439;834;394;1675;346,723;1647;1548,3208;2867;370,2409;346;996;996;1349;337,338,339,1268,1627;3573;904;1627;96;2039;25,1676;439,1673;339;458,532,1029;1627;1627;3123;3123;904;25;2861;1744;938;351;855;3285,3286,3287,3288,3289,3290,3291,3292,3293,3294;406;25,374,1110,1697;423;579;413;1784,3546;25,363,535,558,559;417,558;417,558;25,561;316;2030,2031;579,2741;1672;28;3540;579;996;1675,2066;163;2200;25,1673;2480;2200;2200;623;2200;2200;2200;578;25;904;2200;48,49;48,49;1626;113,1809,3599;651;1627;101;370,438,750;25;383;704,705,706;25,1562;588;1733;1829,2417;25,561;464;1700;3597;25,2434;370,378,423,438,486;25,1774,1776;2616;1676;25,590;2263;96,2332;2216,2801;2661;25;406,1677;25,392,393,1673;48,49;438;1674;25,392,393,1673;25,392,393,1673;25,392,393,1673;777;2611;96;2025;25;2762;2313;316,1422,1423;343;25;1674;370;3532;2622;1508;579;484;378,464,1020,1021,1022,1675,1676;1758;25,561;363,370,438,464,574,852;723;377,1710,1711;2862;649,650,1675;25,1674;982;1627;25,457;362,579;439;25;48,49;1482,1483;1627;1676;346,363,1676;1627;1627;1627;1627;1627;1627;1627;1627;1627;1716;375,2574,3235,3236,3237;461;2622;1920;417;579,904,1644;579;374;2299;590,679;590,679;373,590,679;590,679;1686;1498;904;2572;416,1120,1121;1548;25,346,377,464,541,542,543,544,1672;346,370,423,438,547,750,1674;484;101,1491,1492;959;3548;977,987,2310;1627;2955;1627;1059;343,1269,1627;25,1679,1857;640;1335;438,750;28,399,501,532,579,2036,3319;1675;1674,1684;735;452;1627;1206;1675,2066;464,939;25;25,438,464,750;1043;1414;1273,3050;2811;1627;25;25;1674;668;1424;3210;65;1257;764,2516;2937;25,711,996,2067;1548,1675;353;898;346;1674,1679;25,426;1680;1673;25,1381,1703;2010,2011;1754;25;406,1673;1677,1678;25,374,464,590,668,996,1548,1673,2944;479,480;664,665,666,667;383,664,665,908,1548,1675;2323;2002;25,26,27;120,132;334;1826;1826;25;113;25,1199,2331,2337;1050;1641;1673;1548;538,1181;163;464;1835;1630;1744;669;1627;2951,2953,2954,2955,2956;3447,3448;904;438;1218;25;2282;346,819;1548,2037,2038;2572;2037;25;48,49;25,945,946;945,946;579;579;579;25,679,1548,2430;1229;384,406,601;579;1673;2268;96,819;374,1548;1289;48,49;439,856;904;130,3094;346,1000;438;1548;213,214,2119,2120,2121,2122;1503;101,432,433,434,435,436,437,438;374;25,3112,3475;2129;383,411,484,996;1548;48,49,1548;25,1677;48,49;996;897,2032;120,887,894,895;600,601;25,458;25,1674;416,449;904;1381,1382;48,49;679,996;48,49;532;25;25,996,1548,1861,1920;996;1327;25;25,1674;636;2999;90;705,2985,2986,2987,2988;438,486,750,1676;25;25,363,438,1673;438,750;779,1509;2527;3495;370,470;1744;3558;343;1548;1674;375;346;2070;559,932,1297,1548;375;28;25;1838;25,2426;375;25;375;904;1673;3456;1548;1828;1427;3515;357;1683;383,1019,1674;1675;101,1491,1493;2036;579;339,904,1349;613;101;945,946;416,572;25,1548;1674;388,390;25,1160,1548;1672;1690;370,438;1627;1842;904;904;487,1673;1627;370,981;1321;2965,2966;1627;2677;48,49;710,863;25,444,601,713,863,864,865,866,869,870,871,872;394;3223;1037,1038,1039,1040;316,1709;25,2692;645,870,3271;3229,3230;339;438,750,1676;464;25,28,1548;1390;779,1509;579;1185;573,599;1049,1627;616,1050,1672;438,679;779;1548,1675;1675;1627;674;750,907;438,750;438,668,1506;2685;25,423,425;25,996;25,399,996;904;898;2940;363;1673;1627;25;904;48,49;579;25,399,996;25,399,1548;2725;996;25;25,399,1548;1548;1754;25;333;25;904;579;2331;27,1727,1728;578;1738;1715;668;370,575,728;101;996;1685;353,1627;25,892,996,2456,3024;1660;996;996;1548;385;2965;452;572,2424,2425;579;1481,1482,1483;1673;96,3325;343;438,668,1483,1506;385;25,1548;579;2190;440;579;996,1675;25;1102;540;353;579;820,821,1548;1674;25,892,996,2456,3024;1548;1673;1700;904;1674;25,1677;1294;1999;25,26,679,1675,2959;438;2375;224,225;2095;451;2274;1548,1644;469,579;1953,1954;417,535,559,579;904;362,370;25;860,904,1552,1566;904;601;501,532,579;501,532,1657;1676;2867;384,386,764,1658,3480;1548;1975,3566,3567;668,1699;904;1675;3322;1254;904;1674,1675;1326;25;416,579;25;1680;1257;1548,3240,3241,3242,3243;438,1451;904;926,927;48,49;904;3296;885;904;96;25,417,579;1548,1676;666;25,679,996,1548;2704,2705;1673;779;25,892,996,2456,3024;579;1675;904;1548;569;28,370,1521;48,49;1548;1548;1627;904;1402;1674;1206;1107;579;25,1675;985;2123;808;25;1548;904;1280;806;414;1674;2165;439;25,363,535,559,560;25,363,558,560,803;25,363,535,558,559,560,561;2059,2060,3551;25,363,535,558,559;1710;1627;773;1254;283;357;2855,2856;2142,2143,2859;385;25;1673;1627;29,30,31,32,33,34,35,36,37,38,39,40,41;579;579;532,579,904;579,1252,1354;2447;28,561;579;28,532;1180;28;579;532;464;25,1673;385;904;1191;25,951,1056;25,1673;588;1675,2066;1675,2066;185,313,1627,1629;25,590,996;579,1648;28,579,1675,2036;996;579,904;3491;48,49;25;48,49;1478;1627;986;645;334;438;439;452,579;25,464;904;704,705,706;3331,3332;370;1752;1673;1218;2280;93,94,96,97;1070;346,678,679,802;1222;346,2996;579;1036;1548,1644;1250;1790;25,27,378,381,590,679;2482,2483;339;904;25,950,1676;396,1627;1627;561,2234,2235,2236,2237;65;2036;25,373,532,864,1541;438,750;1139;25,1775,1776;346,1674;1674;996,1548,3167;343;773;206,207;579;357;363;611;1673;25;25,462;579;904,1552,1566;715;904;1744,1913;1069,1627;1110,3390;590;28,541,3015;1675;904;1627;579;996;3338;1674;904;3583;96;2036,2331;1787;25,3475;25;2696;904;1835;1676;1779;904;343;484;25,346,1168,1674;904;1257;384,452,579;25;25;904;2202;996;1744;579;1883;1733;608,942,1627;25,1050,1678;904;1627;25;1254;25;1744,1754;579;1548;1795,3317,3318;25,1673,1674,1675;904;1481,1482,1483;579;579;25;452,579;447,734,1136,1137,1138;370;25;559;579;25;239;1627;363;1245;25;904;2208;2676;579;438;1221;797;1627;3418;1677;2866;1500,3424,3427,3428;25,447,734;1646;25,439;532;498;2048;1481,1482,1483;1481,1482,1483;1588,1589,1590;1460;3239;3119,3120;316,1059;3328,3329,3330;25,1503;438,750;1627;1675;1676;1648;2118;2912,2913;996;590,679;590,679;794;339,579,846;112;3408;2960,2961;1483;1674;438,679;579;25,1180,3443,3444,3445;904;1674;904;2622;25,464,750,1197,1672;375,2325,2607,2608;1096;438,750,1558;370,529;904;530;1548;638;1680;489,1188;776;1681;1548;314,1627;822;394;2668;962,1548;25;25,1548,3341;25,1679,1857,1858,1859;3588;975;1481,1482,1483;28;1057,1853;1627;1673,1674,1675;346,530;962;532;1452;945,946;1471;1673;1257;1373;1150;2102;1825;25,2794;1349;1735;25,996;28,579,1965;25,101,377,1674;579;346,383;423;1481,1482,1483;48,49;203,204;1481,1482,1483;1667;579;1280;993;1627;1354;399,559,579;65;945,946;25;904;1196;449,1005,1006;1397;579;1627;1680;438,750,1676;1759;1363;399,579;1206,1639,1640;1673,1680;2125;371;552,1672;904;370,526;25,377;25;48,49;1676;2476;931;353,356;25;1673;802,2400;25,28,399,1548;25,27,378,381,590,679,763;1644,1700;25,922,923;3279;1700;1548;1627;370,438,750,751,752;25,1548,2465;1571;438;25,357,439,465,507,512;1481,1482,1483;25,829;904;413,665,1110;25;1302;-1382,-1383;1255;2765;1481,1482,1483;1481,1482,1483;25;996,1108;904;1270;1673;25;795,1483,1485,1486,1489;3277,3278;96;385,2063;904;904;1646;399,559;3249;2572;452,1223;417;-2038,-2039;48,49;806;370;579;601,869;2960,2961;1676;2036;924;25,384;1178;2099,2100;904;559;579;579;25;25;1673;1751;1676;3280;25,425,426;447;1675;25;779;1673;996;1738;2177;2679,3544;3543;1548;590;518;492;590;1675;27;25,763,1283;996;236,237,1615;1625,1709;492;2293;1931;1673,1675;1676;25;679,1676,2203;25,996;826;2413;25,51;904;904;530,1675;904;995;996;1627;870;579;518;25,3475;773,1955;1674;996,1548;384,417,535;579;25;3505;25,1548;447;394;996,1674;1627;25;458,1674,1920;25,3211;1140;705,2985,2986,2987,2988;25,2528,2529;394,438,532,579,996,1388,1548,2983,2984;1326;679;1673;25,399,1548;25;904;764;904;25,1674;2422;589,1548;346;375;1674;1673;25,532,1548;1548,3240,3241,3242,3243;996;2268;904;710,733;1548;532;1627;27,377,416,439,452,804,805;339,2192;394,1372,2402;1674,1675;406,1686;579,668;1627;2406;1481,1482,1483;1481,1482,1483;945,946;691;532;25,699;1676;996;378,1022,1675;383;25;2832,2833;1548;904;579;904;439;2139;1674;3053;2472;973;438;579;904;462;458,1677,1920;1702;904;25;934,935;25,1381,1703;579;25,51;1257;1518;826;904,1191;579;1787;724;776;2352;25,417,579;28;904,1727,1728;904;484;1675;406;2908;447;904;601,864,869,870,1040,1665;489;601,864,866,869,870,1040,1665;439;942;904;1627;1753;1110,3390;515,516,517,1676;962;579;1727,1728;25,616;68,96,1565,2885,2887,2888,2889,2890,2892;658;1124;2503;870,2209;773;257;904;2632;394,1725;1627;904,1335;904;1218;1483;25,1675,2254;3500;1673;363;579;1139;2278;579;25;439,726,727,1676;438,668,1506;355;25,996;25;2603,2604,2605;904;371,806;25;579;1273,1627;516,517,1676;1401;96;2622;25,711;-26,-1549;96;1588,1589,1590;639;1754;746;750,1676;532;579;930;343;1675,1700;606;96;1050,1234;2772;1680,2276;1218;1481,1482,1483;1543;1674;438;2797;1045;750;750,1321,1676;438;489;578;579;2808;1675;1250;27;25,1381,1703;2503;3005,3006;1446;1674;370,464;452;2439;416;1324;1709;904;1507,1508;1627;383;1673,1674,1675,1676;464;1999;1676;1339;438;1627;151,152,1317;25;484;27,28;579;61,904,2592;985;1674;1673,1674,1675,1676;516,517,1676;25,1240;904;1232;1363;2642,2643;25;25,579,985,1675,2453,2454,2456;25,27,579;25,1038,1092;375;579;996;1562;1673;2911;1548;996;1674;1678;25;1627;904,1503;1834;1646;3481;25;996;25,892,996,2456,3024;1548,1595;1627;579;1676;1627;3379;1257;3534;25;101,438,552;1066;1673;1673;2960,2961;25,1198;904;579;482,611,663;1107,1676,1992;538,2032;904,1452;904;1627;637;657;666;25;25;1622;1674;515,516,517,1676;1107,2149;1714;1038;2416;904;904;3348;394;1755;671;2212;2008;996;764;2286;1257;904;1674;375;654;1673;1257;25,531,679,996,1700;-26,-1549;1257;531;1257;1257;1257;1677;904;346,512;3070;932;1627;2622;1627;25,2672;1656;904;1280;1627;2512;579;1206;898;370,996;441,442;27,1700;996;1673;904;357;2874,2875;25,28;25;25;579;3044;1241;846;1548;1676;1674,1675;447;579;1107;547,1380,1458;492;904;623;25,623,1624;3522;1677;1335;579;904;2933;1727,1728;666,2635;1646,1673;887;2029;377,1710,1711;28;377,1710,1711;2086;377,1710,1711;377,1710,1711;377,1710,1711;88;375;904;904;2344,2345;2633;1780;1672;1812;1744;904;904;1744;351;77;1128;1676;28;579;28;590;579;579;579;1727,1728;579;1180;25;28;579;25,27,28,3182,3183,3184;579,904;1180;2133,2219,2220;579;590;625;590;579,1709;579,1355;579;579;28;501;439;579;579;28,532,722;3164;1731;904;438;1674;904;1627;579;904;590;1588,1589,1590;532;1627;25;25;1674;2200;25;2200;2200;1218;579;25,579,996,2456;904;779,1884;1714;1675,2066;1675,2066;1675,2066;371;989;990;346;2200;1675,2066;2200;1585;1627;835;904;92;579;579;2200;25,51;1466,1467,1468;904;179,180;3437;101;1673,1674;25;2003;904;3546;2504;439;904;2451,2452;438,750,2092,2093;25;1676;25,438,750,1674;2518;1675;1241;1673;346;1675,2502;1503;904;1591;1257;80;399;98,174;1627;374,678;942,1627;3432;3494;294,295;28,532,996,1675,2036;1673;1424;1257;2074;620;96;375;2622;996;579;25;438,1577;438,750,1259;1676;438,1577;2960,2961;1110,3390;375;3036;25,954;394,516,904,1648;25,438,1905;25;1548;25;25,590;590;3275,3276;375;399;25,935,1771;2549,2550;640;2764;532;363,487;472;532,962;25,2026;25;498;996,1674;25,904,996,1548,2043,2592;25,1673;25,487;1676;450;363;25;996;25,357,1261;1334;439;1366;399,1219;375,399,1219;425,498;1700;2620;2562;956;1744,1759;377,452;3499;339,904;1791;1675;1673;1073;1676;1191,1254;1222;836,837;1548;1677;25;1313;343;873;1755;3387;878;25,563,616,697,745,760;1285;311,1634,1758;25,1548;1548;854;904;1673,1674;2407,2408;1627;28;1673;904;579,904;25;25,1399;904,2306;-26;2624;1627;579,1198;904;904;2160;826,1388,1674;1678;25;1720;1610;351,3550;28;885;904;891;452;861;25;2065;394,904,1370,1725;773;25;579;1727,1728;413;363;1732;1627;1676;1673,2849,2971;1323;375;779,1509;25,438;904;2622;473;464;904;2204;1627;378,464,1020,1021,1022,1675,1676;1627;1829;399,559;1676;579;377,1710,1711;492,572,579,697;904;-364,-371,-439,-465,-575,-853;1673;1627;2621;96;351,1627;1699;996;800;28,532,904;904,1548;25,42,43,44,45,46,47,996,1548;3137;904,2843;1349;25,532,579;399,579;439;377,645,1223;25,464;579;25,362,497,498;579;559;452;579,714,2115;25,809;3141,3142;1521;384,464,532,579;464,579;465,466;25,363,378,379,3300,3301,3302,3303;25,363,378,379,3300,3301,3302,3303;25,363;25,363,378,379,3300,3301,3302,3303;25,363,378,379,3300,3301,3302,3303;25;25,363,378,379,3300,3301,3302,3303;25,363,378,379,3300,3301,3302,3303;25,363,378,379,3300,3301,3302,3303;25,363,378,379,3300,3301,3302,3303;556,1447;374;1535;590;25,679,1996;723;1738;1627,1829;2661;1155;904;439,1521;750;1414;2176;1744,2604;1303;331,776;80,501,532,1700;1504;351;904;579;904;1142,3470;385;25;996;904;691;3441;387;3159;710;2438;3205;1180;394,826,1402;2622;579;361;28;1521;1905;668;996;385;1162;779,1509;904;590,679;3260,3261,3262,3263,3264,3265,3266;1754,3497,3498;1101;385;579;1548;1674;1676;1191,1254;362;2510;579;870,1321;1386;532;579;579;579,2725;2097;25,101;25;996,1865;2593;579;880;25,373,799;370,378,438,750,1218,1980,1981;438,613;25,438,750,1026,1107;904,1548,1620;438,750,1558;370,378,438;2074;417,1656;343;28,1649;25;2105;438,750,996;766,767;394;2627;1548;668,1548,1673;904;362;1829;1107;904;1299;1627;1627;1627;25;1677;2773,2774;339;2861;1548;1674;25,381;933;394,1725;25,996,1857,1858,1859;25,590,679,2148;25,1679,1857,1858,1859;904;399,438,1280;1500,1501,1502;779;2083;1627;1260,1856;3097;28;857;1452;877;25,357,816;1191,2641;1359;1956;439,579;1257;2111;1548;25,712,1678;346,616;779,1564;904;579;1673,1674,1675;1483;1483;666,2849;2505;489,1521;2479;375,2136,3146;904;927,2377;1118;565;346,383;406;904;370,384;518;2175;874;3455;746;452,612;645;2955;370;1615;2210;2972;383;1254;25,101;904,2625;2622;351;2183;312,1275,1627;452,535;1674;3397;452;117;166,167,168,169,170;579,611,1674;996;557,643;1548;96;1700;438,1508,1596;579;1680;25,1027,1672;25,547,2249;452;1878;28,1508,1548,1691;579;1674;555,1675;101,404;25,1673;25,406,2184;996,1548;109;904;1548;3542;25,996;1680;996;1680;1481,1482,1483;1548;996;1548;438,1459;1548;370,438,750,1673;1620;1072;2795;1680;25,439,487,530,590,640,802;1673;1673;691,819,3527;3128,3129,3130;1107,1257,1385;590;1676;25,1672;25,399,1548;438;1381,1382,1703;374,665,668,908,1675;1716;908;25;464,3279;25,453;2453;25,399,1548;25;640;1338;1548;370,1674;114;1548;96,2767;1673;1627;861,2860;691,2216,2801,2802;25,80,501,532,1700;316,1608;2277;401;3101;1674;668;25,413;1627;25,1548;3485,3486,3487,3488;501;492,579;362,559;101,692;2960,2961;2960,2961;2960,2961;2960,2961;2563;473;3513;945,946;25,531,603,1673;579;579;25,904;399;439;579;579;579;28,439;439;952,1972;579;404;2725;945,946;2646;579;2449;579;370,1675;25;2622;439,1548,1675;370,1675;334,694,695;904;1676;1674;378,579,1676,1931;452;375;1674;383;1257;1548;1189;579;25,892,996,2456,3024;25,950,951;1829;88,229;996;1700;642,764,1676;579;464,996;1675;1119;2695;1673;996,1548;464,763;370,996;1257;579,1709;25,826;268;28;996;847;1673;880;178,3191,3192;904;25;25,892,2456,3024;579;1372;1471;904;1627;1028,1672;904;613;25;25,579,625;25,892,2456,3024;1254;996;904;591;1548,1675;996;1993;579;1675,1709;113,270;25,3339;785;28,501;904;370,613;763;904;484;339;640;1576;962,1548;375,1600;960;904;640;904;339,1349,2622;601,869;1674;833;611;25;590,679;375;611;945,946;25;1676;394;370,394,404,405,1673,1949;579;1548;1548,3240,3241,3242,3243,3245;1675;101,1107;2108;25,51;590,1050;25,465,2572,2659;945,946;409;1911;547,1380,1458;904;1838;1674;438,750;640;2106;640;563,616;904;579;1191;452;464;2622;1754;1727,1728;1232;25,27,381,464,590,921;501;1676;1674;25,464,1548;28;621;1191;962,1548;363,458,781;1627;737,1627,1754;2661;96;1627;1871;904;974;904,1254;565;532;904;1554,1575,1576;2139,2140;996;25;452;1627;537;408;452;904;579;579;1672;1674;996;399,559,579;96;25;1191;2150;25;394,654,1107,2296;394,904,1254;25;532;579;640;1676;96,846,904,984,1191,1486,1511,1512,1513,1514,1515;826;904;25;394,1191;579;996;1829;3057;691,996,1687,2223,2224,2225,2226;579;25;1680;1269,1627;227,228;640;795,1483,1484,1485,1487,1489,1490;96,394;613;579,2317;1627;1627;904;1674;374;96;904;377,498,601,710,711,1188;230,231,233,304;645;710;25,417,444,489,710,711,712,713,714,715;897,904;96,1738,2332;25,51;1673,1674,1675;904;3595,3596;343,1627;793,794;924;1684;779,1564;96;1976;2176;1676;3139;904;339;1024;3349,3350;370,579;2551;925;28,1565,2721,2722;530,1672;516,517,1676;2431;25,518;101,346,399,534;101,1493,1516,1517;2958;339;96,2488;25;996;1257;1881;1257;1548;1754;394,1280;25,438;370,438,750;438,668,1506;25,438,464,534,750;1596;25,346,464,681,2430;579,3463;28;3429;904;904;1562;1481,1482,1483;363,689;316;101;1102;1736;1444;2675;25;3570;96,438,2213;1486,1523,1524;605;423;96,904;2546;904;52,53,1743;776;904;3323;904;639,736;363;428,552;1673;346;1676;2362;750;1012,1291;25,996,1764;3040;25,28,579;1548;25,363,438;1744;495;1110;1426;370;1486,2873;1002;101,389,391;815;532;1349;1627;904;339;682;2198,2199;653;1548;25,579,2456;996;1548,1810;25,522,523,524;1907;370,438;423;627,628;579;25;417,452;1363;579;334;842;25,357,464;2926,2927;1521,1654;334;438;904;904;27;48;2698,2699,2700;2243;579;2444;1548;2254;2861;1548;904;25,51;904,1915;1673;452;2968;1548,3240,3241,3242,3243;1692;25;1682,3258,3259;590;996;1675,2450,2586;375;712;1280;25;962,1464,1694;27,590;996;25;25;25;25,935,1771;1842;65;3405;613;331;346;25,1829,2983;904;96;1548;1829;735,1673;25;423,750;346;2580,2581;904;370,1675;1645;394,1725,1726;945,946;996;25,28;1837,2616;25,625;996;668,691,1676,2133;826;904;1548,1595;1761,1762;1729;1627;1627;1084;1758;1627;1938;1359;492,864;579;171;1309;27;1627;2661;25,452,559;423,1673;2826,2827;1627;579;25;452;65;101,1491,1492;92;1677;1257;1257;996;1257;1220;776;1257;1675;1257;904;25,26,530,531,532,1675;1257;1257;904;860,904,1552,1566;1257;1548;25;579;1675;904;532;1797;370,771;904;416,461,579;3098;3247;904;2358;1257;464,1676;25;96,634,635,636;640;272,273;386,3480;1627;586;904;623,679;721;357,464;641;1673;579;416,448;1548;416,1120;2465;579;579,3526;579;492;2819;996,1548;1674;1700;904;904,1687;2806;1672;579;735;904;579;1110,3390;2393;417,712;96,2332;2589;579;579;579;25;25,2054;579;2726;-26,-624;1257;25;1024;636;25,1675;1257;532;639;2689;904;1257;3461,3462;1673;25,590;904,3076;1372;101;25;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;25,363,558,559;416,417,418,419,420,421;377,1710,1711;1542;579,1602;1872;2373,2578,2579;363,399,464,563,616,725;1710;1175;385;339;1673;370,1675;1025;343;25,2052;613;1673,1674,1675;579;423;945,946;945,946;945,946;996,2674;579;316,501,579;579;362,384;28,501;501,904;579;533,1521;579;385,579;1521;590;28;579;579;579;579;25;904;339,2490;1050,1674;2056,2057,2058;92;438,668,1506;1747;1700;823;904;1956;1263;579;904;904;590;1548;1587;559;250,287;904;579;1675,2066;904,1912;1674;679;25,394,1673,1677;679,697;25;532,561;1673;770;1627;532;1842;904;904;1301;370,371,1679;559;785;2200;1257;667;861;904;1758;351,1300;247;1975;339;2322;2430;1503;1290;579;1850;904;2713;1672;1627;1674;904,996;1627;438;101,613;1548;370,438,481;371;370,1674;1673;1673;438,750,1998;904;1627;1107;423,679,1673,2847;1673;25,362;2616;399;1452;861;25,27,1178,1259,1548,1648;25,1178,1548,1648,1700;25;3023;2144;1101;1432;2657;28;904;1675,2724;28,1675,2036;579,1673;808;384,579;96;579;1679;590;1548;1673;1846;375,1548;779;2342;1627;1297;943;25;1627;1674;2637;486,1674;1548;1257;996,3036;904;438,750;464,849;375,1595;1483;1673,1674,1675,1676;904;25;579;438,750;77;1673;25;439;25,892,996,2456,3024;25;1222;996;3481;1548;25;996;25;25,1675;25,464,1675;1676;25,996,2592;996;1675;1677;25,679,996,1548;25;1676;1676;370,1675;1674;25,996,1548;370,1676;1674;25,2241;1674;25;885;2018;2138;1627;947;579;399,1219;343;2124;2667;996;579;25;1038,2261;904;1999;530;579;947;1110,3390;1673,1674,1675,1676;1676;776;826;2753,2754;25;28;25;28;3253,3254,3598;579,1372,1727,1728;375;590;1627,1749;1734;785,2422,2709,2710,2711,2712;1400;3098;1672;1673,1674,1675,1676;25,3297,3298,3299;1673,1674,1675,1676;2818;1460;376;904;904;2113;464;464,579;1349;1676;1076;28,904;579;1257;25;1365;3563;996;25;996;25;528;1257;394,3472,3473,3474;65,96;25,72,73,74,75,1548,3274;346;101,1678;904;1426;1416;234,235;2618;1311;25;400;25,561;96,1499;3061;394,1725;1678;3550;96;904;904;640;1627;1932;904;2306;428,438,486,798;1811;343;370,1675;25,378,464,563,616,617,1690;1254;1977;25,996;438,750,1677,1678;579;3134;579;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;579;2289,2290;464,723;1381,1382;904;377,1710,1711;1710,1711,1712;1675;996;2355;2355;2355,2356;790;1673;1548;1274;1531;779;383,1388,1675;96,1738;1349;25,579,625;579;579;579;579;1007;508,509;370,416,756,757;373;579;579;447;2036;2577;579;25,384;579,1521;452,579;579;3378;439,579,858;534,645;579,912;579,779;452,579;579;28,579;579;25,376,559,1149,1150;25,383,1674,1675;25;25;25;373,374,375,1673;279;1627;595,596,597;579;904;3337;378,387,487,996,1548,1672;579;27;96,2312;458,2201;996;1170;532;1674,1701,2154;28,1700;532;904;1627;3179,3180;2909;362;25,3475;374,440;1646;1646;492,579;548;1678;25;1678;579;1386;2131;904;1627;912;1548;1627;785;904;1627;438;1673,1676;370,1675;904;579;370;826;394,1483,1530,1531,1532,1533;28,567,3234;28,567,1548,3234;1627;492;101;1802;894,1249;904;1627;25;565;394;374;904;1627;661,904;25,357,2019;25;370;590,679;590,679;2808;96;904;1056;2331;262;339;579;370,1256;1054;1093;904;528;2364,2929;25;1676;640;399;399,532;444,2461;439;1658;579;579;439;486,2047;579;996;996;3099;25,996,1676,1859;1483;1483;370,438,464,1677;904;1677;25,971,1673;370,1675;370,1675;691;25,452;2556;371;101;904;3457;1373;904;484,764;363;2762,2787,2788;3131;25,3281,3282,3283,3560,3561;25,384;1286;776;1627;1999;1675;428;996;25,363,452,579;2373;996,1673;25,1674;1912;996;346,538;25,363,376,377,378,381,3579;25,380,381;25,374,1110,3390;1335;28,567,3234;1548;370,464;1548;1675;370,852;25,579,996,2036;25,51;346,464;532,1548,3398,3399,3400;383,404,648;96;579;1102;1521;1436;904;904;2176;385;1627,1631;579;1064;1904,3083;404;3041;547;1907;1043;3512;2462;904;904;1236;904;937;101;442,2777;1627;518;971,1469,1470;971,1469,1470;1627;904;1370;904;1291;92;2820,2821,2822;483;444;579;579;3545;3545;1759,2905;438,1294,1510;2292;492,525;25;906;96;579,1675;1700;1548;258;25;904;691,2216,2801,2802;904;679,2250;579;579;904;2615;1059;904;2622;438;1446;654;492;1656;1206;2055;1281,1672;1158,1404;2164;1548;1627;375,3035;1548;1992;1866;369;-26,-1549,2897,2898,2899,2900,2901;1257;25;1673,1674,1675,1676;25;3102;2751;1257;383;904;2949;438,1508,1596;710,2322;25,316,996,1843;1674;957,1908,1996;904;2187;27,370;1335;346,363,1123;1673,1674,1675;1257;755;904;25;25;25,1381,1703;1126,1754;315;96;1676;996;25,399;102;1677;1677;1674;331,1132,1133;1673;996,1676;3353,3571;25;25,854,1252,2207;399,559,579;28;96;3382,3383;375,413,1110,3186,3187,3188;464;1680;1672;996;1163;996,1548;3248;1725;1821;383,668,1548;464,639;1674;25;904;316,1335;271;1753;996,1548;464;101;25,530,616;1206;771,1840,1841;1193;1852;25,425;1089;1744;559,2155;1678;439,561,645,870;579;1110,1548,3390;3589,3590;25,3316;438,1388,2548;1738;904;1627;1709;375;316;579;1107;423;1847;1676;1759;1627;1548;25;579;2435;1674;25,904,3255;3267,3268,3269,3392;28;1815;-2038,-2039;452,579;25;579;579,3007;2727;532,1656;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;714,715,870,2769;1672;579,3124,3125,3126,3127;2265;501;579;438,1294;377,406,533,1676;2366;25,2947;579;945,946;945,946;25,1548;1674;3420;1452;904;25,346,464,1673,1675;904;2221;679;1675;904;370;15,-26,-1549;1548;25;25,2824;1674;2266,2267;904;25,51;2572,2655;875;113;1758;362,561,1646;1673,1687;642;1700;25;904;531,679,1677;25,51;948;25,1548;904;1471;904;1673;1676;1700;679,1673;667,949;530,1996;2200;1001;1675;1658;346,511;1675;25,51;1675;1658;25,51;25,51;25,51;1675;25,51;579;826;3186;579;25,1548;25;1627;25,51;3435;406,996;25,51;996;25,411,1674;25,51;1548,1674;25,51;25,51;362;25,51;579;904;465;1675,1767,1768,1769,1770;1359;374;779,1509;898;904;25;776;1999;25,51;25;1627;375,1600;777;679,1110,3390;611;616,697,745,1050,1282,1646,1672;904;316;3041;377,452,481,579;1548;362,370,417,440;776,1068;489,2077,2414;904;904;385,1050;640;826;1063;1548;27;1674;1674;1548;904;996;532;613;904;343;25,1857,1859;1481,1482,1483;579;945,946;2484;2633;2399;2939;374,1548;779;532;2876;1486,1523,1524;394,2306;321;1759;101,1763;819;1894;3436;28;1673;438;904;1809,1922,1923,1924,1925,1926,1927;904;1733;904;25,464;1738;1627;565;1627;2622;904;28;492,535;339;96,2332;25;2503;904;1751;904;2332;1673;1061;1414;2747;439;640;1257;1673;579;438,750;2661;579;25;2864;346,1781;1435;25,438,579,1673;394,3321;795;2082;25,51;3343;2588;1758;339;331,1132,1133;579;623,1548,1962,3341;1676;1755;532;1969;1463;1254;3226;537;2001;1548;904;904;1110;1257;1548;679,1673;904;826;385;2742;773;25;1754;904;1257;746;3270;714;863,864;645;444,489,713,714;1110,3390;826,1363;1290;1508;861;904;1755;1952;579;2251;873;439;351;2977,2978;-26,-1111,-1549,-3391;385;25;1755;2934;78,79;25;1672;1521;518;985;1915;375;579;2036;518;904;1133;25,590;417,452;399,559;904;1294,1505;423,762;904,1541,1542;96,1191;96,1738,2332;1851;1598;996;316;996,997;3559;1893,1894;25,438,750,1107,1676;1483;1110,3390;25,438,1486;2022;25;101;438,750;438,668,1506;904;28;25;1257;904;579;1627;996;1359;1302;28,452;3576;370,464,924;565;996;779,1509;2552;579;28;452;904;346;1754;92;579;1758;2846;552,553;904;1627;464,486,616;989;439,452,579;622,623,1920;452;439;2770;579;904;25,1675,2239;439,579;399,559,579;1674;996;605;96;25,1677;1548;25;2104;977;579;779;578,579,1348;339,2361;2717;639,826,1134,1135,3144;464;3040;1587;1110,3390;25,1591;579;904;25,399,996;289;904;3587;438,826,998;904,2251;996;438,750;1676;2868,2869;606;96,904,1059,1540;904;1677;579;28,399;904;746;25,51;2045;375,3479;1142,3470;3540;904;996;155,156,157,158;579;25,2422,2423;579;538;579;96,339,1349;996;378;113;904;343,1218;353;353;353;353;438;374;346,370,579,750;2614;1754;668;25,51;1554,1575,1576;904;779;346;125;1254;1755;25;370,452;28;96;1674;1999;1700;590,2667;2481;501;1627;370,645;904;1616;1674;25,1548;386;25;2373;370,438,750;1673;101,2877,2878,2879,2880,2881;1676;25;1676;1675;904;579;1677;1275,1627;96;1513,3200;2428,3215,3216;1645;1675;1534,2157,2158,2159;113;904;413;25;3029;996;1548;996;461,996;25,860,861;860,904,1552,1566;773;96;385;826,1991;996;25;826,846,2446;2514;96;1627;452;932;579;375,1489;1673;101;1425;1548;25,51;339;385;691;370,1675;651,1044;347;96,1737,1738,2332;904,1508,2592;1761,1762;1315,1316;1674;962;773;1561;385;904;579,869;579,1657;464,579;1257;579;528;1420;1836;375,3032;579;778;904;904;1862,1863;962;2523;904;96;1548,3240,3241,3242,3243;1257;1675;996;25,357,1676;1257;1257;532;399,559,579;1257;452,1204;452;1257;861,2882;904;579;1996;1257;394;538;96;394,2694;25,51;904;532;1010,1011;1009;492;904;904;528;238;1624;996;996;1675;1675,1680;1673;1965;2127;25;2572;2294;28,492,1646,3295;579;579;417,576;579;579;2395;1995;579;1674;25,51;561,579,1073;579;1461,1462;904;3489;96,1218;945,946;579;-26,-624;1750,2343;1700;25,51;2631;904;3460;384;579;370,438,901,902;1646;904;904;587;2254;1110;1301;1414;2941;48,49;416,417,418,419,420,421;417;377,1710,1711;377,1710,1711;377,1710,1711;363;415,416,417,418,419,420,421;579;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;455,456;377,1710,1711;1674;25,416,485;377,1710,1711;362,406,452;377,1710,1711;377,1710,1711;423;579;904;1991;382;578;394,904,2916;533,2567,2568;1634;339;423;2254;3233;996;1744;904;2837;1152;904;92;399,2190;579;1521;25,26,27;28,532;25;590;28,532;1180;579;579;590;25;579;25;579;28,404,439,532,561,1446,1646;25;452;877;25,51;113;370,996,1674,2686;1813;2622;3449,3450;1184;579;1627;2661;25;1180;579;877;2322;1675,2066;904,1721;101,375,1335;467,697,962,1388;2200;1675,2066;904;399,559,579;622;346,1673;1227;996,1675;904;904;423;1052;2226;2486;1521;1627;346,363,1672;579;861;2019;996;464;637,2041,2042,2043;984;1627;578;579;579;579;904;904;613;532;331,1132,1133;370,492,1670;439,489,492,2077;1648,3272,3273;691,2216,2801,2802;996;579;1888;438;1359;370,438,1677;904;904;357,530;290,291;1122;1627;101,375,1335;25,417,579;3525;3525;1563;2323,3196,3197;996,1548;1912;1548;28,1548,1700;25,377,579,1376,1377,1521;677;499,500,501;1646;691;370,1675;25,536;25,536;1503;579;579,1673;375;501,1700;579;2432;800;1065,1677;2186;399,464;28,1675,2036;1673;25,384;484,870;1585;1674;1674;904,1730;579;1420;579,1335;439;1486,1523,1524,1525,1526,1527,1528;351;1673;1026;343;2392;334;452;464;1541;339;668,1722;454;996;25,846,1777;579;96;2703;904;579;642,680,1673;370,1673;2622;802;555,996;904;343;1335;385;579;363;904;532;579;668;136,137,3384,3568;113,1521;1744;904;464,578;25,51;25,51;996,1700;399;1401;101;25,1675;750,1333;1627;346;1674;904;606;1541,2128;579;579;904;904,1552,1566;992;1674;1349;464;375,3212;28;1674;996;1548;25;25;1548;579;1548,1700;1673;27;464,590,1674;1693;25,996;316,1676;399,559,579;96,1738,2332;399,559;613,723,792;1674;579;822;394;779,904,1587;452,579;904;1257;2801;1548;1056;904;1359,1486;25;1453;399,579;613;3555,3556;399;1254;1471;25,1700;222,223;25;1754,1755;1783;465;2285;2401;3073,3074,3075;428,1032;1548,1674;1110;399;904;1627;552;2609;1257;1695;1257;25,439;578;904;2626,2627;904;464;464,579;996;996;996;862;25,1548;579;590;394;579;579;28;2036,2524;1257;1755;1257;1627;2771;1709;707;25,51;1676;399;25,51;1359;2218;3584;370,438,907;567;399,559,579;826,2164,3144;426,579,802,2447;904;1627;579;1058;1673,1674,1675;1754;1840,2924,2925;937,1215;579;339;25;1047;904;873;1673;1645;696;3591;25,384;1726;2661;1245;394,1725,2722;616;25;25;904;406;370,1083;1548;1050;458,617,1341,1342,1343;615,1690;343,1116;1845;1091;2673;2403,2404;370,406,417,1521;377,1710,1711;417;377,1710,1711;579;2539;1627;945,946;1521;532;357;1414;1257;377,1710,1711;377,1710,1711;904;377,1710,1711;377,1710,1711;25,2248;377,1710,1711;1627;101;2506,2507,2508,2509;2962,2963;370,1675;2795;1673;2622;1627;1150,1191,2537;370,1083;904;904;1676;559;1101;104;2661;3026;904;452,579;579;579;579;904;1232;370,1083;25,625;1521;945,946;362,370,579;1641;537,539;370,452;861,2722;370;579,3502,3503;447;579;452,645;746;370,492,1670,2127;579;370,492,1670,2127;416;2243;579;1321;579;25,384;579;452;579;996;394,438,904,1026,1503;65;3304,3305,3306,3307;904;1744;904;1243;343;1627;1153;579;2460;1363;3066;370;363,1673;25;1673,1674;2661;1677;1874;1417;316;48,49;2389;3113;904;375;904;2331;579;904;464;1161;1755;904;1417,2647,2648,2732;904;1627;357,370,579;3421,3422,3423,3424,3425,3426;532;25,1548;779;1678;2841;438;3047;904;802;385;362;1191;1257;1414;1674;996;944;1759;1102;1627;1107;1627;826;579;478;2801;579;1548;3079;101;2321;904,1191;779;1900,1901;904,1587;25;886;884;25,51;2498;25;3157;1143;579;1320;464;1206;113,3356,3357,3358,3359,3360,3361,3362;2936;1676;579;2260;579;1232;25,579;579;1257;2342;904;25;538;532;439;438,1395;904;384,417,535;1481,1482,1483;370,1675;370,1675;579;606;904;25,379;452,1232;2036;3181;3594;1257;826,1370,2564,2623;962;25;1755;25,464,1672;2251,2488,2918,2919,2920,2921;489,2077;484,764;25,1674;538;904;96,904,1059;2863;1627;904;904;1754;25;439;675;96,394,2592,2593,3325;96,120,339,394,1010,2590,2591,3325;1675,2254;2245;1675;606;25,935,1771;331,1132,1133;904;25;28,1700;1672;1674;346,374,1106,1107,1108,1109,1548;25;25,374,996,1548,1679,1857,1858,1859;566,567,590;1548;1521;741;384,535,1646;370,1675;394,1562,1727,2275,2309;464;1107;2346,2347,2348,2349;25;339;113;590;1410,1411;823;996,1548;1218;343;904;1191;532,579,679;3539;1486,1619,2573;1676;1674;1673;794;1010,1011,1012;1363;25,1548,1679,1857,1859;1673,1674,1675;1323;904;1457;904;1848;1253;904;1627;904;1262;904;25;2622;579;945,946;452;370,452;692;1139;1788;25;394;971,1469,1470;375,3133;971,1469,1470;904;904;565;532;904;25,1548;25,544,1053;96,1737,1738,2332;1035;1675,2066;1673;438,750,1558;92,186,187;25;904;385;2200;1738;710,870,2136;1401;972;807;2278;2745;579;197,198;945,946;996;203,204,205;1191;861;25,357,406,464;904;1675,2066;96,2332;346,383,1262;579;579;3553,3554;1720;339;370,384;579;579;416,830;2572;559;611;370,399;28;498;464;1882;25,363,484,1675,1687;1982;2622;1716;1627;996;76,77;3535;370;48,49;1374;25,50,51;25,51;385;374;3039;579,2074;904;579,1483;773;96;25,996;943;1674;1674;438,1456;996,1548;1672;25,51;343,1739,1740,1741;579;904;1627;1257;904;3202;25,51;1257;904;406,1674;2960,2961;25,51;1401;904;1059;1674,2084;590;2243;579;3213,3214;590;1676;2456;996;439,492;904;579;904;904;547,1380,1458;25,1281,2415;27;374,665,996,1548;25,51;2217;1674;370,444,551;2622;996;399,559;714,870;383;1548;1328;579;564;25;850;904,1552,1566;3355;910;1401;1627;1627,1744,1754,1757,3004;96;567;25;773;1627;25;621;96;452,512,579;785,962,2584,2585;3531;1646,3177;579;579,1646;579;579;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;362,387,1123;25,384;2667;498,579;384;25,579;25,2947;1232;464;439;399,559,579;25,417,579;25,384,601;25,384;25,51;1416;579;363;2330;904;1658;447;2545;362,492;1675;2437;498;904;2036;904;25,51;1587;417;2823;362,1658,1668;25;346,370;3391;717,718;1676;996;1676;464,487,1156,1672;532;213,214,2119,2120,2121;996;2382,2383;2383,2396;3186;1676;1674;1676;679,2050;1673;439,1674;996;1585;1675;1675;996;561,1930,1931,2238;996;746;1742;532;904;623,1603;394;579;101,898;904;1673;904;375;25,996;579;25;996;1110,3390;25,101,423,861;25;25,996;25;904;1548;2661;1627;1627;1257;746;25,996,1857,1859;394,1725;826,1359,1483,1519,1520,1521,1522;1335;904;3025;1546;904;904;738;1372,1486;346;945,946;1658;1254;1939;2218;640;2436;492,535,1213;996;385,579;394;25;394;797;375,1548;370,1675;1548,3240,3241,3242,3243;579;28;1673;1548,3240,3241,3242,3243;1548,3240,3241,3242,3243;25;1548;904;579;904;1548;1637;1522;28;2168,2489;532;1627;861;339;1562;25,1673;826;96,101;452;1744;2358;1903;904;385;1182,2393;3407;996;417;384,579;28,120,579,691,2171,2172,2173,2174;3393;746;904;1627;402;976;904;1415;654;1796;351;1627;1754;2930;2565,2566;1627;2440;1739,1740;1554,1575,1576;1673;904;417;439;439;2012;579;904;452,579;25;477;2016;904;25;343;1627;1174;3364,3365,3366;1754;904;996;96,438,826,2650;904;904;904;339;579;1102;996;898;904;452,645,1665;861;996;1673;417;579,1191;385;579,904;2574;2572;1871;3078;1370;1934,1935;1653;1653;904;668;668,996;579;826;385;579;1336;1646,1898;1459;865,866;863,864;25,417,710,711,712;863,865;1615;1819,1820;1548;996;1110,3390;1627;1311;904,1254;1744;1674;28,579;86,87;2751;331;980;904;3585;2222;904;1723,3160;2110;1191;556;556,779;556,1107;904;904;904;962;1674;1321;2087,2088;1548;1756;996;3151;96;1191,1578;3037;847;904;92;25,679,983,1687;1180;370;375;1335;498,582,583,584,585;362,452,1658;2314;2410;904;637;904;904;346,541,1689;370,438,750,985,1224;1654;2960,2961;996;2342;2622;334;394;1123;400;1675;1232;2706;339,1349;904;1673,2151;370,1675;579;647;1232;904;374,668;579,3464;3466;2572;861;1744;785,1483,1485,1488,1489,1582;904,949;3080,3081;776;573;547,1380,1458;394,1483,1530,1531,1532,1533;1727,1728;25,1548;383,996,1108,2502;794;1335;346;3051;1611;1257;1363;28,532;1675;579;1627;116;343;28,579,2379,2380;904;773;579;452,1521;1072;25;904;624,710;904;1677;406,763;3482;484;96;826,2368,2369,2370;25,550;1304;2657;25,399,1548,1764;1971;1548;1683;579;1554,1575,1576;904;25,996;25,1364,1365;3045;904;375,826,1548;904;1010,1011;532;1548,1595;27,773,1548;394,1725;1262;904;25,852;762;1110,3390;1627;1755;25;378;370,1675;394,1298;904;1003;1548;1675;25;996;25;590;904;1257;1594;438,679;746;904;904;2388;453;1627;579;904;1661;417;904;353,356;1250;1627;1478;373,464;1627;1266,1267;375,904;25;423;1142,3470;339;1675;25,590;492,579;579;399;25,363,552,2970;2622;538;25,892,2455,2456,3024;25;1680;1759;1675;25;579;1548;904;904;394,1464,2367;2303,2304;423;904;1232;374,1829;861;25;996;1818;904;904;1366;1414;230,233;1754;2606;2661;904;2364,2365;2851,2852;1521;904;904;370,1675;3467;1401,2195;404,579,1107;489,2077,2414;579;579,3136;2264;452;579;417;374,1110;96;996;1548;1110;945,946;945,946;532;25;25,376,416,1199,1200;1627;423;1627;1993;1548,1993;1237,1238;826,1254,2019,2684;342,1158;753;2652;1761,1762;1761,1762;370,1675;904;822;996;932;579;452,579;25;904;963;1627;1217;538;1107;25,452;96,1725;532;1627;579;904;827;493;898;96;1604;1257;25,464,533;1674;1674;1257;25;351,1754;1359;1700;904;1257;464;357,363,399,458,684,685,1646;1464;637;579;579;193;613;2079;1754;1082;1257;634,635,636;1257;452;3163;438;1038;996,1675;1627;579;1675,2299;1673;1677;1680;579;579;343;1232;370;904;2572;25,2636;2992;28,2759;945,946;501,532;579;1663;904;363,1675;3203;1627;996,1769,1770;1770;394,1331;1674;904;904;370,1675;399,501,1438;996;25;904;579;1675;579;579;25,1551,1552;579;611;96,1737,1738,2332;746;579;746;631;739;996,1700;1103,1769,1770;1950;594;1385;199,200,201;385;775;710;996;746;668,729,730,731;3284;1676;904;1627;1414;25,1242;1242;377,1710,1711;377,1710,1711;559;377,1710,1711;377,1710,1711;377,1710,1711;415,416,417,418,419,420,421;377,1710,1711;3508;945,946;2752;351,1754;1478;25,1676;394,2923;676;2485;996;1158,1372;779,780;285;1601,2558;2393;371,826;904;904,996;613;640;1107;438,750;945,946;579;375;25,1381,1703;921;590;579;579,2069;579,1709;579;27;590;1521;1107;2823;618;417;417;1462;339;492;904;1912;1466,1467,1468;1753;1674;458;1761,1762;417;547,1380,1458;1715;331;2622;3478;904;2028;904;904;1335;904;101;623;25,544;861,2298;1755;904;439,532;972;640;904;25;452;579;904;2200;904;802;904;904;957,1193;1257;1673;904;532;904;904;2064;1232;904;773;975;904;3106;2284;1414;1414;532;1627;406,416;1305;579;3532;1026;1686;1548;1675;996;438;438;904;873,919;3367;1973;1078;1381,1382,1702,1703;1335;96,1585;2232;375;940;1548;25,417;378;2847;1591;438;613;870;25;1222;1257;1257;1759,2255,2256,2257;1432;3052;904;1674;870,2420;579;452;452;2763;1201;15,305,306,307,308,309,310;1850;1412;363;1191;1676;1107;417,535;25;579;96,1738,2332;579;579;1627;384,579,2090;2495;1727,1728;579;25,644;581,1170;532;1252;532;3509;370,1675;25,452,467,468;904;904;375,532;532;1486,1488;1794;904,1725;1627;96;904;1627;3194;25,1778;25;25;1026;358,359,360;691;3574;873;1127;680;1230;96;616;773;1628;1627;1554,1575,1576;2850;1627;1627;394;25,96;385,1673;1548,3240,3241,3242,3243;1010,1011,1012;904,1548;996;996;2013;25,363,1199,2258,2259;1861;25,2434;25,2434;101,25;25;25;2935;413,996;2327;371;1674;1062;579;945,946;1395;1258;802;1414;1034;113;417;579;1627;904;1674;904;1627,1758;1627;1627;1591;1674;351;370;787,1627;375,1507,3227;120,368,1627;904;1673,2094,2473;1674;370,1675;996,1674;945,946;1673;996,1674;2242;357;374,378,996;579;904;779;375;996;370,1675;1627;578;1673,1674,1675;996;861;904;1446;1127;547,1380,1458;28;2865;904;25,579;1676;452;370,438,750;1419;452;2169;28;806;261;2342;826,1673;3459;1705,1706,1707,1708;2622;1754;339,1349;996;1993;141;1627;175;2411;1486;316;1929;861;375,3476;2844;383,668,996;904;3519;25,80,501,532,1700;80;904;1715;25,996,1687,1857,1859;904;1675;779;1627;776;1912;1673;1674;1548;579;1232;447;452;1257;28;904;904;1257;532;107,108;1548;1869;748;763,1855;25;1350,1351;2180;1744;3355;1672;1627;25;1673;904;579;1257;1257;779;1414;357,923;1920;25,923;1674;532,826,1650,2600,2601;904;904;1414;89;370,1675;25;1735;1627;2191;2509;439;616,761;27;616;1673;1678;25,378;1678;1673;3562;439;1366;1483;640;363;377,1710,1711;416;3517;1585;25,712,1678;346,363,723,800,801;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;339;2807;2188;25;1146,1147;423;96,2332;904;1850;896;1675;28;579,633;1646;1521;579;579;370;417;492,579;370,492,1670;1646;579;579;579;370,492,1670;1232;498;370;452;2127;370,492,1670;746;416,1663,1664;439,492,549;399,559,579;746;452;25,357;25,357;1232;28,375;417;399,559,579;904;2520;579;25,394,754;1744;1676;1548;1548;1627;25,464;2575;724;518;904;362;904;1115;2836;1004;439,579;25;936;62,63,64;776;579;996,1548,3103;1481,1482,1483;1107;1897;452;904;904;3312,3313;1676;362;2801;1627;501;945,946;25,1548,2078,3231;1678;1912;3368;681;25,892,1302,2456,3024;640;1755;362;904;2823;25,562,563,1676;904;2438;771;464;904;25,667,996;25;1103,1769,1770;1755;904;101;2909;1359;438,750;439,2315;25,452;28,1548,3234,3396;25,438,750;579;2512,3105;826;113;2883;579;147;370,1675;1537;579;579;452;28;25;25;579;1678;452;3042;452;590;101;381,384,535;230,231,232,233;423;346;1673;904;532;438;394,1725;1673;1676;904,2324,2325;3115,3116;2816;904;438;2145,2146,2147;579;25;370,1675;904;25,438,1107;1680;394;3440;96;532;904;779;904;464;1675;1254;1754;246;25;25;579;690;2342;1239;3046;1675;439;439;1349;375;383;374;1744;779,1509;331,1132,1133;25,1675;1999;1676;904;2814;346;904;25,2052;904;579;579;613;413,1548,3369,3370;996;691,797,1548;996;1822,1823;28;399,559,579;25,406,1674;1548;413;25,27,977,996,2683;1349;417;139;383;346,684,744,745;796;904;996;945,946;464;1676;394,754,791;579;2559,2560;826;904;904;452;579;1324;3252;3224,3225;1882;1674;1675;904;25,996,1857,1859;904;565,671,1059,1553,1554;1108;904;1263;779,1564;96;343;1676;96,394;25;904;579;904;779,1564,1565;2798;438,750,1359;3489;917;1734,2678;3165;1414;1907;1792;1257;25;1424,1754;656,657,1674,1675;1356;96,2332;96,2332;1614;343;1759;2491;438;579;1627;240;794;1548;25;362,579,1125;1452;579;3085,3086,3087,3088,3089,3090,3091,3092,3093;375,2136,3145;406;1627;399,763,764;375;565;746;861;1383;25,935,1771;671,1554,1575,1576;3375;532;1642;1372;1257;1257;826;904;746;25;1056,2841;978;1674;1700;904;1652;611;1372;996;579;1206;25;2291;904;1414;1257;1257;579,1483;371;2960,2961;1627;1627;1508,1691;25;1674;579;1257;1257;1370;28,904;2170;579;2189;375,1259;417;25,996,1381,1703;194;996;1548,1700;1675;1684;2520;1257;945,946;25,417;578;96;709;579;25,1281,2415;25,1281,2415;904;904;1678;975;2666;904;339;339;579,1674;370,1675;2107;489,714,715,870;375,1643;996;25,346,374,487,488,1521,1548,1700;370,1675;2693;1548;1759;25;728;25;579;1854;2914;452;1245;904;2032;2553;1257;1627;1673;668;2950,2952;406,826,1674;25;1110;278,1738;904;316;1627;1257;3308,3309,3310,3311;2594;646;28,1646;579;579,1107;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;2960,2961;604;945,946;996;25,346,363,723;996;579;819,1199;802;404;370,400,981,1191,1192;25;579;28;945,946;25,384;945,946;362;1548,2532;1627;25;1251;904;1381,1382;996;25;25,1676;1176;945,946;904;362,492,579,1658;25,579;25,447;1676;25;1674;904;996;25,903,904;371;768,769;3250;1613;417;1548;1675;2382,2383;2383,2396;375,2270;1673;1700;1675;25;1674;679;667,996,1684;904;25;439,1658;25,996,2226,2230,2231;1257;1676;1369;1676;904;904;2233;1673;452;623;452;452;1311;904;25,438,750;1548;746;746;826;579;1110,3390;958;1658;904;579;1483;1673;1674;826;399;2162,2163;1302;373,416,2572;779;579;538,579,870;1521;464,723;1414;1245;691,3537,3538;913;904;1842,1910;1548,3240,3241,3242,3243;96;1676;406;316,1714,3342;1675;1672;3322;399;904;1673,1674,1675;898;2164;579;2373;1727,1728;587;385;776;904;394,1483,1530,1531,1532,1533;696;439;945,946;1674;96,394,2300,2301;904;579;1257;1733;2661;1236;77;578;904;1755;826,904,1059,1536;96;1673;931;579;904;904;362,534,579;904;904;945,946;579;65,3069;384;904;334;651;394,1483,1530,1531,1532,1533;904;1627;394,2307;371;904,1150,1424,1479,1486,2513;779,1509;904;579,2053;579;1714;1659;1236;1627;579;579;346;417;1040,1665,3340;467,1072;904;904;1110,3390;2572;945,946;904;904;2326;795,1483,1485,1489;96,394;1110,3390;579;384,417;2342;121;963;710;846;440;416;97;339;1414;56,57,58,59,60;624;579,870;2701,2702;1414;904;904;904;904;1695;27,556,904,2948;1733;1414;2886;378,579,617,2089;3151;25,464;904,2251;637;1676;785,2660;25,991;1675;458;-26,-27,-28,-1549;25,984,1687;362;904;904;1739,1740;3333,3334;579;484;779;1627;25;821,2467;3043;1113;25;679;3162;667,1110,3390;3122;731;904;1548;1110,3390;779,1555,1556,1557;370,2334,2335;1673;1387;904;2696;1107;904;101;25,714,868;2481;25,579;1558;794;700;1091;3058;2342;25;588,2582,2583;3154,3155,3156;3098;794;2531;2531;1548;1548;1636;406,1098;1836;552;3581;590;640;1627;394;996;579;2628,2629;904;1755;671,3374;1213;776;746;746;2342;438;735,1673;904;25,565;385;1727,1728;957;1673;904;1257;1627;1676;1958;1486;3470;826;370;378;484;847;2078;667,996,1687,2078;969,2733,2734,2735,2736,2737,2738,2739,2740;25,935,1771;1257;904;776;579;3541;1991;532;465;343;3104;773;378;378,667;904;1191;385;2854;945,946;25,2430;1329,1330,1673;579;996;904;101;1674;1675;331,1132,1133;1936;826;399,559,579;996;3482;579;1262;25,423,439,530;1257;452,579;1627;904;904;25;3232;1129;1586;375;1673;579,1675;25;904,1059,1534;1026,1727,1728,1729;2035;1627;579,2053;579;904;1177;1466,1467,1468;904;374,996,1548;25,438,579,773,1294;25,892,996,2456,3024;904;904;1618,1619;1627;417;657,996,1107;385;724;579;746;861;826,3144;904,2812;1521;2021;370,1675;2405;904;774;2857;2808;452;25,51;25,51;48,49;25,51;25,51;25,51;25,51;25,51;25,51;25,51;579;467,945,946;624,2769;640;316;2960,2961;904;452,1662;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;811;811;776;375;492,579;579,671,2916,3404;579;776;2116;464,1319,1548;66,67,3206,3207;1414;904;96,1510,2471;2622;25,1675,1857,1859;826;904;394,1483,1530,1531,1532,1533;2630;1110,3390;1257;101,2877,2878,2879,2880,2881;375,1595;1257;1257;763;1677;1759;3414;25,679;1254;2200;1257;1257;370,1675;1257;439;1257;439;1257;779;452;363,399,684;458;2884;369;876;1588,1589,1590;904;417;1627;1461,1462;1673;904;779;532;2622;452;904;1627;845;904;1673;1675;2554;25;746;887;579;579;2759;532,579;579;579;579;579;492;417,579,1656,2046;579;579;579;492,579,2421;331,1132,1133;423,1446;1674;1548,1675,3240,3241,3242,3243;579,1672,1675,1684;25,2363;746;579;996;878;1478;25;3158;2857;2126;579;3257;904;404;904;623,1605;1673;394,1372,1389,1587;394;101;96,904,1059;385;579;929,1242;377,1710,1711;377,1710,1711;377,1710,1711;377,1710,1711;96;555,556;1607;1744,1748;904;904;745;3470;2244;776;1059;1232;375,2571;25,1548;501;2193;654,904,996,1644;904;1257;1263;1920;904;904;579;371;489,732,1037,1965,1966;25,935,1771;1254;579;25;579;532;492,579;579;25,2743,2744;1673,1674,1675;512,952,981;464;374,1548;394,532,996,1510,1548,1576,1959,2981,2982;458;1372;579;452;452;532;1110;25;559;385;417;904;904;996,3048;1675,2066;438,1359,1486;1627;371;532;1372,1464;590;904;773;25;28;1346;1320;904,1654;904;640;1142,3470;518;96;1414;861;579;96;2351;904;439;331,1132,1133;579;1627;406,416;406,416;406,416;406,416;406,416;406,416;1311;92;1264;25,357,371,406,487,814;385;1453;101;637,1191;417;292,293;375;1673;1978;25,1178,1259,1648,1700;2338;1627;1627;847,1164;416;2332;65,2979,2980;1627;1715;1673;532;1674;532;996;1675;375;668,1698;579;1428;531;1627;904;25;1059,1483,1619;1130;374;642;370,1675;642;1627;346,1646;1627;1627;904;1483;1414;2164;370,492,1670,2127;2653;96,1849;904;2651;331,1132,1133;642;579;904;439,458,667,1388;1677;826;1414;826,904,1059,1536;1829;331;399;945,946;2622;1700;335,336;1673,1674,1675,1676;1753;2565,2566;1744;1180;370,1675;25,1548;25,96,990,2767;996;1625;1701;375,1548,1941;2960,2961;559,763;999;333;904;1755;904;346;579;1758;904;96;579,869,2194;417;2033;417,2075;438;904;1673;532;2635;1349;1257;96,904,1059;26,1103,1675,1766;1672;1622;904;2707;3326;2004;995;1627;904;2470;579;904;3204;1755;1158;904;904;386,519;1257;904;25;25;3481;1414;904;126;464;1349;384,535;1241;701;339;937,1372;394,1725;452;794;3532;2616;1674;3388;3014;1548;579;1311;904;797;343;385;452;416,545,546,547;794;1257;1840,2924,2925;904;1715;579;25;640;904;25,384;25,362,452,467,484;904;532,3468;438;904;904;375,2922;2798;535;1674;3506;25,1342;1674;449,465,579;449,465;579;3510;904;2329;873;904,1388;377,1710,1711;377,1710,1711;25,416;110,1943;3062;1674;1257;1257;1257;904;1145;520,521;423;962;25,1682;26,1103,1675,1766,1769,1770;1277;25;1769,1770;25;26,1103,1766,1767,1768,1769,1770;484;1349;2839,2840;645;879;579;1232;945,946;416,449,451,452;640,1729;2260;3413;417;904,1191;579,714;532,826,2600;370,492,1670;416;370,492,1670;370,492,1670;416,1663,1664;579;579;370,416,579;370,492,1670;579;370,492,1670,2127;25,579;579;496;579;399;452;2047;945,946;904;904;1548;1110;904;96,2340;904;776;904;3312;904;1448,1449,1450;266,267;192;502,503,504,505,506;502,503,504,505,506;464;1674;1674;579;1673;1548;904,1254;826,904,1059,1536;384,417,535;343;2823;904,996,1107;1755;1359;1462;826;394,1372;452;362,416,481,482,483,484;3175,3176;945,946;794;579;904;579;579;484;1414;1754;2907;610;1627;1676;904;1414;1999;25;2494;1257;2569;1754;579;1257;2176;904;2137;3054;28,567,3234;1673,1674,1675,1676;776;579;2704;579;2768;27,375,532,1548,3430;1401;773;776;794;96,1725;1759;995,1672;25,464;904;25;904;2718;96,1738,2332;904;394;782;1755;654;904;579;776;996;996;996;339,2622;579;1673,1674,1675;579,1678;25;1656;714,870;2033;399;746;579;579;25,579,1521,2687,2688;579;535,1213;417,535;464;794;3218,3592;1548;749;489,1091;904;2525;394;25,2073;1322;101,824;1107;25,399,438,486,1424,1674;370;1651;1257;375,1824;776;1754;579,637;1571;1257;1715;1758;1754,2639,2640;904;532;25;1257;363;2540,2541,2542,2543,2544,2545;1335;1366,3490;2091;2459;2616;342;1627;484;28;163;826;1734;383,2458;374,996;579;904;904;263,264,265;2338,2551;2910;27,1716;904;25;580,581,1676;3434;1548;28,567,1548,3234;1755;1726;2071;346,684,744,745;417;1548,3240,3241,3242,3243;904;25;996;904;2287;1870;637;904;1548;996,1548;1548;1674;861;3458;1627;96,904,1059;1363;1335;671,1850,2175,2697;904;904;458,1674;475;2302;1674;1010,1011,1012;1871;904;826;28;945,946;746;945,946;2931;1349;2638;996;795;2216;1169;2103;1759;351;331,1132,1133;579;1548,1700;1548;458,571;1676;560,723,952;489,490;96,2332;904;92;2102;2708;1674;904;25;439,579,2602;1379;1727,1728;1899;996;1483;120,339,349,826,1010,2590,2591;579;1414;378;996;339,1687,2515;461,996,1548;374,1548;904;579;1562;579;1513,3201;1232;904;794;1414;839;1486;1627;579;2577;746;904;28;1674;3403;6,15,305,306,307,308,310;1275,1627;794;1673;1257;904;1257;101;904;2975,2976;957,1908,1996,2080;370,981;1257;1257;1107;1257;1257;904,1675;1839;1462,3178;622;1875;1123;370,439;1257;1257;375,989,3149;1257;1102;25;996,2570;1674;25,1503;1548;357;377,1710,1711;1548;669,1939;1735;120,1486;716,722;25;904;25,1381;3143;590;996;3593;579;996,1674;25;904;904;25,1281,2415;25,1281,2415;904;972;3071;579;452;1107;579;1674;25,346,487,488;373,1259,1700;996,1674;25,452,467,1073;579,996;679;887;538;538,887;741,742;1675;1627;96,1474,1880;579;331,1627;1056;218,219;904;1674;1755;3352;1257;1673;96,904,1059;904;346;1257;1257;579;394,1372;1674;423;25,532,826,1829;579;579;1349;1257;25;3308,3309,3310,3311;3557;3528,3529;3121;2815;25,28,1646;439;2037;1354,1587;1521;2960,2961;2960,2961;870;2960,2961;2960,2961;1287;532,601;384;25,417,579;25;746;384;492;746;717,720;1646;579;601,2036;945,946;532;904;2622;671,3374;394;579;447;25;578,640;904;452;904;417,626;2433;96;3521;2127;407,3055,3056;717,720;1548;464,996;25,996,1674;487;1658;452;579;1658;826;996;996;1548;579;1026;375;579,1521;779,1509;904;385;1453;779,904,1540;2134;1432;579;996;2427;1782;904;904;996;25;1548;826;579;1107,1988;579;904;331;370,1675;776;370,1675;2622;1674;904,2043;394;945,946;996;945,946;667,996;579;661;826,962;2728,2729;1727,1728;1310,1717;96,399,579;2617;890;3076;532;1674;904;904;904;904;113,2497;331;1627;904;904;904;637;616;464;384,417,452,535;370,417,452,579;331;2766;1257;579;1232;1066;452;1676;1335;331;904;1673,1674,1675;904;3569;1107,1967;579;370;439;1803;826,904,1059,1536;1257;385;1257;579;384,489,2077;331,1132,1133;640;167,168,169;578;498,579;579;1191;2214;746;904;334;1755;370,439;370,439;370,439;28,375;487,1683;623;579;362;1448,1449,1450;904;1700;668,1548;904;1091,1367,1368;904;1414;1627;298,299;374;346,1229;394;2372;1648;428,575;1513,1567,1592;25,417,864,866;25,863,864,865;714,1964;904;3013;96,904,1059;331;1414;374;25;1483,1485,1486;3433;579;898;904;904;1213;2751;1999;394,1372,2160,2161;3151;165;1046;904,1559;1486;1587;394,1725;904;1548;904;904;904;351,354;691;579;904;1013,1014;1627,1754;771;2385;1232;1113;1970;1295;904;904;904;826,904,1059,1536;1171,1172;904;1595;2834;904;1755;362;579;316;438,1294;84,85,343;484;375,773,826,1654,1759,1803,1807,1808;343;452;794;776;793,794;351;1755;512;3496;136,137;136,137,3568;140;1755;2932;1257;1257;904;1359;1218;686,687,688;1672;904;559;904;2129;904;904;640;1680;579;2006,2007,2008;904;579;904;3530;2342;25;788;1627;394,1483,1530,1531,1532,1533;1107;861;1554,1575,1576;904;1257;3372;1548;1912;832;25;2373;2751;826,2353,2354;25;2468;705;25;904;316;640;1254;353;3470;1675;1548;374,668;374;2376;904,1718;969,2733,2734,2735,2736,2737,2738;374,1548;1585;904;904;904;1150,1483,1581,1582,1583,1584;904;2653,2654;996;579,2074;374;378;1902;639;996;1191;3002,3003;1361;579;579;776;1912;2969;1608;25,1548;25;1676;25,426,802,1938;25;25;1548;904;25,1503;25,1591;1452;904,1503;1754;904;3540;1627;996;996;904;1548,3240,3241,3242,3243;243;579;996,1108;904;438,994;423,762;2090;346;1726;2622;1715;904;25,384;579;1388,2251;1457;25,2649;1026,1960;1548;1110,3390;2342;25,51;25,51;25,51;25,51;25,51;746;1592;101,2877,2878,2879,2880,2881;439;1992;25,28;904;2661;920;269,1761,1762;1627;1761,1762;1761,1762;1627;357;1420;1401;1627;579;1372;579;385,416,852;25;1744;208,212;1627;394,1725;1257;2622;1627;3060;1627;1512;746;1521;96,2332;579;614;1257;1257;746;316,1646;413;1257;904;945,946;620;1257;1257;1257;746;945,946;1180;746;746;153,154;904;904;1905;904;904;1627;1335;1232;613;579;1627;945,946;1619;746;492;579;1674;1676;904;444,3549;1627;1191,1585;870;579;25,27,28,579,1646,1700;452,579;2525;2809;464,1962,1963,1964;316;439,1941,1942;2033;579;579;2535;25,1326,2672,2989,2990,2991,2992;579,2005;465;579;579;371;746;316;1257;394;1548;1914;904;802;926;971,1469,1470;425,492,784,785,786;579;384,417,535;945,946;746;1464;316;1627;979;1968;579;96,904;904;3189;975;3189;374,1548;2561;996,1103,1769,1770;377,1710,1711;532;2647;904;1627;447;25;96;1759;96;452;394,1725;452;1675;501,532;945,946;746;2661;579;579;1180;1180;579;579;579;452;2017;1755;776;96,904,1059;904;25,26;3165;27;1673,1674,1675;2870,2871,2872;776;1674;904;2176;945,946;606;1186;3049;1483,2938;1912;532;590;937;904,1719;25,1793;2661;25,1508,1600;1627;2200;1673,1674,1675;1627;1191;1673,1675;1672;339;394;517;904;3419;904;376,904;579;1142,3470;1710;904;1627;2468;438;438,750;1359,1957;438;25,1548;1452;538,613,1472,1473,1474,1475,1476,1477;904;3501;374,383,1676;996;1673,1674,1675;96;343;1414;1755;1673;2325;1548;452,579,945;28,904;904;904;25,26,27,28;25,1178,1259,1648;904;904;794;255,256,1074,1075;785;2463;2394;1674;28;579;532;579;578;579;2955;579;123;904;822;904;578;1994;904;96;96;65;579;25,1424,2167;25,579;1010,1011,1012;904,1191,1548;904,1191;394;996;1191;25,1682;996;25,1548;346,1646;346,1646;346,1646;458;1877;1257;794;1414;1627;331,1132,1133;1928;640;2622;96;385;2622;746;1381,1704;3108;579;579;489,490,601,869;25,1700,1770;357,3386;25;995;1700;357,406,1673;1675;377,2027;1676;996;25;1674;928,929,930;904,1191;1714;904;1257;27,668;1677;904;1627;370,452;579;1090;417,535;346,579,1548;579;399;996;2125;417,535,1213;579;1110,3390;25;579;1337;2179;1107;362,579;1548;1759;1239;343;904;1755;746;996;579;96;2445;25,712;1100,1627;904;904;25;25,438,1673,2511;386,492,3480;28;904;1714;501,532,904;384,579;904;339;2127;579;1673;343;316;904;1548,3483,3484;1107;2955,3454;1627;1408;2176;1050;2341;579;904;904;101,501,532,579,1676;1359,1486;1191;2842;1257;606;435;1414;2468;2468;1985,1986,1987;374;1508,1696,1724;904;25,425,427;346,652;48;1674;1446;565;1688;1754;579;1335;1414;92;904;579;1572,1573,1574;861;3153;417;377,1710,1711;3096;333;331,1132,1133;532;492,579;579;377,1710,1711;377,1710,1711;346;1232;2506,2507,2508,2509;25;1026;96,2332;1402,1403,1672;1754;532,826,2600;370,492,1670;746;1032;2033;452,579;3251;579,904;579;579;370,492,1670;492,1669,2127;370,492,1670;579;362,439;579;1107,1562;25,501;1372,2181,2488;27,406,996,1673;904;919;492,579;712;579;746;1110,3390;1674;1759;904;2032;2044;2044;2044;904;1591;394,1311;1414;904;1483,1485,1488,1489;904;1727,1728;464;1008;1627;394,1725;1405;1744;3027;945,946;1755;904;1298;563,1676;1627;904;1323;2393;3098;28;1627;1621;904;1758;1414;1107,1955;3365;826;394;904;438,1241,1494,1495;1408;579;577;861,1673;579;1674;2501;1700;904;2325;746;579,2725;945,946;579;2209;316;945,946;579;579;1354,2595,2596;1355;904;1674;1996;532;579,1727,1728;2731;904;438;2868,2869;904;1674,1675;1677;632;27;578;458;370,1675;904;1755;579;439,489,490,491;257;346;912;52,53,54;1257;1257;25,346,957;1895;1191;1232;1414;671,1548,2916;458,1754,2318;2344,2345;904;3132;1675;904;667;413;810;1744;2538;1673;316;904;904;284;2352;25;25,996,1857,1859;1349;754,904,2275;1548;343,344,345,1627;637;904;904;904;1142,3470;25;1867;1675;2770;1107;889;945,946;1059;512,1627;904;904;25,996,1857,1859;25,996,1857,1859;904;640,904;1628;904;96,904,1576,2633,2828,2829,2830,2831;1961;1432;904;904;904;904;904;438,826;904;384;532;945,946;579;452;579;98,99;101,1548;904;904;679,1673;413,668,996;383,668,1673,1674,1675,1676;3354;1257;3193;142,143;904;331;2478;579;904;65;904;1755;904;375;794;346,1106,1107,1108,1110;1999;96;598;579,2051;101;1673;25;1627;1415,2109;3174;1599;432;150;773;288;904;339;904;579,2036;579;1734;637,904;385;1753;385;789;2799;904;25,679,2430;1446;113;366,367,1627;904;1414;1414;2723;2063;579;579;2776;904,1727,1728;25,935,1771;904;375;113;1548;25;579,2074;25,1548;1257;1675;772;101,1413;1257;316;2373;2378;241,242;691,826;25;25;1414;3151;904;826;904;1414;904;1676;25;904;579;25,374;28,375;2957;935;579;25,1281,2415;25,1281,2415;1181;25,425;417,452;945,946;443;3030;1548;25,384;579;1673;25,384;1548;1673;346;25,384;394;2626,2627;579;394,1725;501,532,1700;1627;955;904,2715,2716,2717;904;452;1627;904;904;904;438,1294;339,779;1627;904;339;1110,3390;452;945,946;882;1722;904;0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,305,306,307,308,310;746;65;552;1359;579;1648;96;945,946;579;559;399,559,579;25,384;945,946;746;746;746;1673;1755;904;1677;640;1677;547,1380,1458;1674;351;492,579;904;362;1917;404,489,490;15,305,306,307,308,309,310;1674;904;1999;579;25,1676;3453;2176;996;452;1658;579,3345;28;25;1335;362;1443;904;1676;277;1627;362,1658;981,995;826;25,1679,1857;25,1679,1857;579;579;579;904;746;904;1627;1673,1674,1675;1785;1785;904,2587,2942,2943;559,1166;2262;2114;904;904;316;25;945,946;904,1420,1432,2681,2682;904;423;640;636,852,1672;945,946;904;996;1257;96;1825;904;826,1438;1414;904;1232;625;113;1814;904;1257;1023;953;2381;1414;904;127;1627;996;96,2332;904;452;1191;1483;1257;904;640;904;945,946;579;25,438;1519;370;579;25;579;579;1758;2955,3454;210,211;881;2619;1755;773;746;904;370,1246,1247;222,223;1311;1754;1627;1673;579;904;579;501;793,794;1753;362;601,869;1879;362;1755;904;1257;826;1754;1038;863,864,865,866;144,280;1218;732;1755;25,443;904;1674;339;579;374;370,438,1673,2247;2536;2907;904;904;339;579;904;1619;1627;1675;996,1548;1674;377,464;776;1257;904,1241;452;904;2252;904;904;579;439;579;779,904;25;346;1110,3390;1110;1110,3390;2755;2917;394,1483,1530,1531,1532,1533;826;101;339;1545,1546;1254;1675;96;374,1110;904;25,386;492,579;339;1627;3537,3538;1548,3240,3241,3242,3243;904;1107;1257;25;370;1232;1548,1700;25,1548;1142,3470;452;779;316;1744;1222;2661,2663;375,904,1587;351;1675;904;370,1675;1302,1418;904;606;96,1738,2332;914;28,904,2251;2514;331,1132,1133;794;679;746;1548;195,196;2391;1627;904;1314;1674;1191;413;969,2733,2734,2735,2736,2737,2738;370,1675;904;579;331;3373;579;394,2477;343;776;1734;492,579;579;1548;904,1191;25,534,579;96,783;438,1584,2412;535;532;1391;904;439;1196;1623;2622;2151,2152;996;1594;945,946;683;904,1059;904;1744;904;544;1548;904;438;667,1110;339;655;904;439;579;1676;1354;746;370,1675;2040;904;904;532;25,384;904;96,904,1059;1627;904;339;904;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1850;2373;1026;904;492;1627;385;1349;1755;996;904;904;1627,1754;1674;331,1132,1133;1916;1107;96,904,1059;904;339;579;904;1548;904;2007,2008;25,438;25,1609;1257;394,1483,1530,1531,1532,1533;1257;904;1257;1257;945,946;1257;746;2555;904;331,1132,1133;1758;394,1725;759;1885;1245;2127;904;364;746;579;1335,1336;826;452;25,1551,1552;1627;1754;2062;25,2062;826,1620;1891,1892;1892;673;930;945,946;746;850;579;1755;286;1059,1576;904;1673;1454,1455;1242;2576;904;785;52,53;1829;904;371;1539,1540;1548,3240,3241,3242,3243;636;1673;579;362;579;579;579;1755;802;1110,3390;331,1132,1133;1372;357;1674;25,362,1214;1548;904;339;25;3580;904;904;579;2475;1320;1257;1257;2800;996;1755;904;898,1107,1915;904;484,826;579,1050,2295;1983,2305;904;1700;2906;987,988;1257;579;346;501;101;331;1544;746;1700;1627;904;1627;547,1380,1458;904;-2848;3512;904;385;1627;532;904;331;937;691;579;613;579;1676;25,26;25;826;1004;904;579;343;1753;25,51;48,49;25,51;25,51;579;1673;746;346,1646;904;120;861;945,946;579;579;904;1464;904;1257;996;25;25;1548;1548;904;25;996;438,750,1558;2503;1257;904;1627;904;221;668;996;220;2068;413,996;351;394,1725;2928;746;1585;374;1257;904;746;746;25,384;996;25,425;945,946;96,904,1059;1439;1421;385;904;1912;2535;2342;343;1627;904;25;1627;640;613;452,579;579;339;438,1294;773;1486;413,996;442;452;904;399,579;579;535,579;559;3600;464;996;1157;904;1257;1548,3240,3241,3242,3243;351;25;904;905;2691;904;413;904;640;1091;904;1755;904;394;579;2805;25;802;2839,2840;2020;384,417,535;452;579;904;65;25;452;1206,1212;746;534,1666;579;579;370;428;746;579;579;452;370,819;416,452,579;746;1646;937;1161;1464;1110,3390;640;1726,2360;904;394,1725;343;2622;1627;1257;1974;1761,1762;81;3385;26;2622;776,1835;945,946;904;755;1755;96;996;904;904;904;394,2063;776;1548;904;2545;1754;3346;370;904;904;640;3161;452,579;414;904;25;331,1132,1133;65;904;2227,2228,2229;3536;474;1216;1401;452;1627;1144;579;945,946;1232;2034;746;945,946;746;945,946;1232;579;554;535;945,946;27;96;579;579;25;25;904;996;579;25,438,750,1107,1959;996;370;1674;438,750;904;1758;1999;96,2332;343;370,1675;3082;346;606;904;1627;374;1623;2593;370,1675;25;1257;484,764;2762,2788;452,492;904;339;92;1414;1548;1548;1396;1548;898;25;1257;25,996,2690;384;452,579;1755;2176;1674;1672;1110,3390;1675;1548;1110,3390;399,559,579;363,464,530,1676;1672;1349;25,1676,1679,1857,1858,1859;252,253,254;1107;216,217;25;579;25,3171;937;640;339;25,996,1857,1859;459;2032;25,438,996,1337;1461,1462;904;826;416;1481,1482,1483;1624;1744;1715;606;1401,2269;28;1483;1617;800;92;1231;1755;1674;606;579;691;904;25,996,2794;385;363,559;1337;96,776,2332;904;1257;1755;607;857;332,2185;288;613;613;904;904;1010,1011,1012;101,636,2746;370;773,861,1254;1709;1674;2622;144;1257;3238;3038;779,1555,1556;119;996;26;904;77;1503;384;25;873;370,579;25,935,1771;25,1772,1773;316;2441;904;890;1257;25,1281,2415;230,232;334;129;438,1508,1596;25,1674;464,1033;2622;1257;1257;3115,3116,3117;25;25,2448;394,1483,1530,1531,1532,1533;25;579;559;25,2915;25;375,1508,2906,3198;904;96;25;444,1665;904;1548;25,1281,2415;1674;975;579;25,1551;25;579;25,2526;579;362,416,484,492,1071,1072,1073;25,996;370,1675;17,18,19,20,21,22,23,24,322,323,324,325,326,327,328,329,330;1150;513,514;25;385;962;1548;532,826,2600;96;1627;1716;746;439,579;113;904;1107;904;1744,1758,1760;1735;779;113,244,245,351,1738;1257;3308,3309,3310,3311;3308,3309,3310,3311;17,18,19,20,21,22,23,24,322,323,324,325,326,327,328,329,330;945,946;2960,2961;579;945,946;945,946;579;945,946;945,946;362;439,2331;1248,1906;532;579;579;1676;375;28;25,384;773;2072;904;1110,3390;904;904;904;371;1680;417;1755;370;370,376;579;1335;1716;579;362;1018;1406,1407;25;25,1675,1857,1859;1257;2622;904;452;579;492,579;996;2081;3067;1306;96,1737,1738,2332;904;904;904;579;2314;996;945,946;1548,3240,3241,3242,3243;945,946;654;904;1180;1761,1762;394,1483,1530,1531,1532,1533;945,946;945,946;904;3518;343;640;937;1755;1627;248,249;331,1132,1133;904;1755;28,3376,3377;640;746;532,579;452;779,904,1540;579;1755;2892;746;25,507;579;1335,2835;518;346;750;2587;861;2825;904;357,1231;640;1257;579;1414;904;25,26;374;904;1127;1257;945,946;904;904;2644;904;2135;2778,2779,2780,2781,2782;1674;1107;2252;25,26;904;904;389;1676;371;996;782;226;885;637;3244;904;370,1675;1754;1627;611;1257;417;1548;1744;101,118,1015,1016,1017;1548;339;1481,1482,1483;1675;904;904;904,1548;375,1654,1724,1804,1805,1806;794;794;743;476;785,861;296,297,331;96;1755;339,691;331;1627;370,492,1670;904;691;25,429,1673;640;904;2240;2331;281,282;904;1142,3470;3470;904;559;1572,1573,1574;1677;579;1675;904;1388,2361;1675;1999;1349;1627;904;904;25;1503;579;904;904;370,492,1670;2641;526;969,2733,2734,2735,2736,2737,2738;2014,2015;438,996,1241,1280;904;1715;452;746;904;2759;331;1548;1257;996,3095;613;484;370;3256;971,1469,1470;945,946;1092,2429;896;579;1392;1257;1257;977;438;746;746;25,1483;25;394;394,1483,1530,1531,1532,1533;1844;1257;640;399;579;714,715,870;394;113;3565;779,3065;452;394,1372;1113;671,826,1254,1388,2021;904;568;452,461;399,559;362;2049;945,946;3008,3009,3010,3011;68,2885,2887,2888,2891,2893;452,579;996;1359;518;708;1414;1715;1627;996,1103,1769,1770;370;334;3320;904;1761,1762;1761,1762;417;2047;579;579,904;611;492,1668;996;746;1257;25;904;904;518;1257;746;579;1464;394,1725;904;1548;1627;904;96,2332;331,1132,1133;1816,1817;579;945,946;904;640;904;1213;190,191;579;579,2005;1995;1218;1674;1754,2387;639;96;945,946;904;96;394,1548,1727,3335;25;2517;486,532,1042,1094,1673;1107;113;484;640;375,3402;3219,3220,3221;3219,3220,3221;3219,3220,3221;96,904,1059;1627;1265;25;904;1955;904;385;1097;25,26;945,946;579;945,946;1864;3165;1761,1762;1257;1257;1257;904;1318;904;904;1675,2066;579;25;2218;904;1585;423;904;904;1627;1349;1627;422;1352,1353,1354;588;904;904;331;316,438;904;904;996,1548;904;1673,1674,1675;904,1191;640;438;613;25,26;996;1205;331;2036;904;1548;1257;945,946;1921;904;492,579;746;25;2319;945,946;1999;394,1725;850;746;904;773;1746;25;904;1726;746;96;579;746;25,51;25,51;1674;1754;1627;3327;25,1507,3227;1675;1676;904;904;15,305,306,307,308,309,310;904;851;1181,1218;119;331;370;2342;1595;904;3455;1674;746;1754;343;579;1758;2342;937;904;439;1107;1024;370;346;904;105,106;904;1257;460;996,1110;494;579;746;887;3394;640;2311;1628;904;1627;2036;1675;1739,1740;438;2029;452;2121,2946;3151;1359;28,1700;904;904;640;1755;904;2466;666;396,397;1548;590;1229;2019;1835;838;1548;579;945,946;579;904;2127;579;904;904;904;1062;794;945,946;1676;776;996;1675;904;25,438,1496;25;1461,1462;1912;904;904;2297;1876;417;1110,3390;452;2044;2044;579;579;3324;452;904;1337,1700,2973,2974;579;452;3336;904;945,946;794;394,1725;1026;406;1674;904;579;1059;1257;776;904;385;394,1483,1530,1531,1532,1533;138;1999;904;904;904;2182;25;826,1465;452;579;579;1681;996;579;28,532;904;1597;370,3577;1257;1553;904;579;331;826;25,1281,2415;1673;1562;1627;25,439;915,916;1110,3390;2308;1260;394;904;1347;904;3516;904;2492,2493;1744;1548;1754;996;1548;1110,3390;25,1857,1859;96,904,1059;1110,3390;535;339;95;1388;25,383,996,1857;1548;1672;1548;1548;996;904;1110;394;101;1483;904,1107;25,26;1883;331,1132,1133;2164;579;2211;1999;1627;779,904,1540;904;904;904;3195;2271;452;362;1439;1335;579;904;423;606;1588,1589,1590;128;2350;1758;904;3507;1676;1676;904;1245;1393,1394;904;904;25;464;1627;1481,1482,1483;857,2185;375,613;904;96;579;339;1999;904;579;25,1700,1996,2967;394,1483,1530,1531,1532,1533;579;579;25,2853;1338;746;746;25;904,1225;452;3417;1627;826,1465;2218;101;25,1281,2415;1257;25,1281,2415;25,1281,2415;1959;1223,1254;779;123,124;1627;25;2776;1674;1627;374,1110;96;3380;945,946;746;746;498,579;538;861;501,1675;904;1714;904;96;343;1798,1799;1241;681,1363;1674;904;339;579;2127;370,492,1670,1671;399,559;945,946;746;101;579;746;316;904;331;904;3381;96,3166;2763;1674;1676;370,376,472;579,1199;904;1254;25,1680,1857,1859;1873;492;25,1548,1857,1859;1107;904;904;579;1191;579;413;518;1548,3240,3241,3242,3243;904;374;1761,1762;1173;1421;134;452;746;579;452,579;904;579;375,386;904;937;1673;904;691;2339;452;3442;904;453;579;1627;904;746;716;904;775;904;1505;394,1725;1257;746;606;1755;773;579;746;904;370,439;606;861;1755;1627;863,864,867;25,1710;1107;579;1727,1728;144,145;826;2278;2278;579;96;2376;773;1673;2823;579;579;2156;904;579;25,1551,1552;1874;885;394;1110,3390;1231;3465;904;904;850;1634;1257;904;861;945,946;2498;375;1055,1056;172,173;746;579;316;2610;904;25,26;1107;904;826;370,1675;1675;27,363,375;904;96;1627;2641;2641;3552;904;25;969,2733,2734,2735,2736,2737,2738;904;904;25,26;904;351;861;1349;996;351,606;1257;101,2877,2878,2879,2880,2881;1452;2599;375;822;452,585;3244;331,1132,1133;640;779,828;904;579;25;399,559,579;904;339,826;904;25,339,394;452;1464;996;945,946;492,579;1252;537,538;3363;2094;904;96;1548;1257;1994;746;579;904;776;1761,1762;1761,1762;1761,1762;1761,1762;2359;385;1349;904;532,996,1548;1627;96,1562;776;1057;693;3199;806;1257;945,946;904;25;25,51;25,51;25,51;746;1627;1445;1257;452;547,1380,1458;1673,1674,1675;1452;400;1433,1434;945,946;351;746;779;1586,2024;96,394,1336,1497,1498;28,439,532,2209;945,946;535;945,946;746;351;1254;103;1933;371;2474;2063;25;2622;96;746;331,1132,1133;746;559;579;904;904;25;826;904;904;394,1940;621;904;904;394,1483,1530,1531,1532,1533;1529;1627;1257;399;861;579,2817;135;25,26;746;945,946;25,26;984;1761,1762;25,26,27,28;532,579,1548;2283;579;2178;2036;579;904;611;25,26,27,28;334;1675,2066;746;331,1132,1133;904;579;1758;1715;1257;1257;1142,3470;65;1627,1754;1715;829;501;904;773;2626,2627;25,438,1579,1580;996;1627;1284;904;3169,3170;1999;1257;904;1257;25,26;1064;334;3347;1562,1727,1728;394,1483,1530,1531,1532,1533;1745;1718;1142,3470;1627;579;3152;1257;489,2077,2414;579;2622;904;996;945,946;579,1104;1627;904;2722;579;1248;904;904;101;1992;904;1700;794;343;1674;25;385;77,3520;2296;873;362,579;1409;996;535;417;2622;2622;1362;1627;1257;945,946;904;343;945,946;1999;464;2074;904;579;592,593;578;937;1677;1257;1244;1389;1754;579;331;822;1359;532,1672;452;590;559;904;904;904;1627;2719;581,680;1395;1912;1842;579;945,946;96;3516;25;25,1548;662;904;3469;25,1551,1552;370,492,1670;746;532;370,492,1670;817,818;403;1344;2848;606;587;370,1675;1673;904;2776;904;746;2389;1715;2044;2044;1097;904;904;3053;579;904;1257;1372;794;904;2211;1755;579;2076;25,26;96;904;904;904;25,26;395,579;826,904,1059,1536;1755;1257;343,1269,1627;2008;452;385;96;25,26;25,439;945,946;579;416,417,844;746;996;579;904;904;331,1132,1133;1755;904;995;25,957,1908,1909;904;1758,3147,3148;996;904;394,1483,1530,1531,1532,1533;423;2762,2787,2788;399;1110;1680;1110,3390;230,1593;1675;25,1857;904;532;1257;1483;904;25,996,1857,1859;1674;904;1241;1635;370,438,750;606;1754;452,579;579;1755;952;640;1673;904;331,1132,1133;1627;1481,1482,1483;794;904;579;975,1105;904;1675;346,1700,1996;461;654;579;904;1674;1675;3553,3554;1257;904;339;1401;579;579;1257;532,579;2355;370,1675;1744;1257;1257;486;579;331,1132,1133;25;1218;518;904;406,579,624;1726;510;1439;579;532,904;746;746;182,183,184;1159,1160;1827;3138;25,374,1548,1857,1859;1548;346,1674,1675;25,1674;96;1627;331,1132,1133;945,946;896;1312;115;996,2502;1627;1568,1569,1570;3564;3308,3309,3310,3311;25,773;96,1738,2332;904;904;384;945,946;945,946;25;2775;25,1281,2415;945,946;2704;96;1674;904;1587;1627;898;375;640;25,1679,1857;887,1191;1059;3351;1414;779,1555,1556,1557;2776;452,579;1360;579;1372;371;1673,1674,1675;384,1232;904;579;398;1107;945,946;1675;904;579;1677;898;25;2876;904;423;1257;1676;1755;1232;25;945,946;452;339;25;394,1725;2498;885,1154;904;1627;452;25,26;746;1257;1733;3564;1461,1462;1461,1462;370,439;351;25,26;111;904;2622;25,1503;579;579;904;904;904;1257;2278;904;579;388,389,390;437;439,984,1199;452;362;1257;579;195,196;1999;1673;1232;887;3380;904;484;370,1675;1294;883;579;1674;96;945,946;1548;1431;1257;1627;579,904;2019,2386;25,464,487;904;1755;-3541;1030;1142,3470;904;96;2669,2670,2671;1627;904;423;904;598;331;996;826,1417,2647,2648;2783,2784;1715;1595;1349;1349;1349;826,904,1059,1536;25,3021;681;678,2196;3172;547,1380,1458;1656;904;2523;3066;579;826;904;1066;25,1053;25;1677;945,946;96,2332;1548;1744;1988;611;1734;96;2622;579;826;613;853;1350;559;26,1103,1675,1766;904;746;904;746;1627;746;452;144,164;898;746;1257;1761,1762;1761,1762;1761,1762;1761,1762;1349;578;904;773;69,70,71;1349;25,51;1257;1257;1257;331,1132,1133;1755;996;1232;2130;1755;3115,3116;1627;904;1257;773;904;1832;904;532,1965;945,946;65,1601;904;904;25;1676;3228;1181;339;452,492;1755;394,1483,1530,1531,1532,1533;606;945,946;746;904;1181;439;904;579;2096;1755;904;904;904;1254;346;975,1325;945,946;579;25,26;2622;2178;579;1257;1257;1257;1478;1755;746;1627;1257;904;904;904;394,1483,1530,1531,1532,1533;987,988;563,616,987,988;776,832;3077;904;3114;690;1107;25,26;773;96;904;904;746;579;331;2320;3582;945,946;1722;1734;937;2044;579;25,26,27,28;1955;363;619;120,1218;1627;2033;904;343;1675;606;384;2376;904;904;1010,1011,1012;962,1991,2061;579;1892;1388;904;452;399,559,579;579;357;423;1627;357;1062;1191;25,26;545;579;578;850;394,1483,1530,1531,1532,1533;579;161,162;1761,1762;3111;2807;28;2839,2840;426,802,2400;937;945,946;945,946;579;579;452,579;937;937;904;439,498;904;904;579;2044;371;579;484;579;1674;1241;1758;25,26;1257;374;25,26;1548;25;904;1232;1627;904;565;904;1107;1254;904;904;613;3190;691;2614;904;1675,1680;904;945,946;945,946;904;904;609;348,349,350,904;2597;996;1110,3390;2720;579;579;1432;1110,3390;532;904;1978;776;25;3452;1755;1548;1257;3344;1673;25,1679,1857,1859;1110,3390;25,1679;579;1676;746;25,679,1675;1674;25,996,1857,1859;904;316;1675;25;301,302;640;904;1148;941;3047;794;659,660;1755;1674;904;857,2185;1378;1656;904;945,946;945,946;579;1038,2616;1206,1207,1208,1209,1210,1211,1212;746;904;331,1132,1133;904;1107;1673;2975,2976;3031;1627;1257;1755;1673,2153;96,904,1059;848;904;3053;904;101;1700;25;370;25;1548;904;1627;1627;1228;1257;394,1483,1530,1531,1532,1533;1738;1432;904;370,492,1670;904,1191;439,579;2033;945,946;945,946;945,946;1655;606;1077;579;25;861;25;2592;873;904;417;765;2033;25,384;1483;579;904;904;945,946;1601;1521;1521;904;904;1107;904;945,946;904;25,423;1755;371;1256;937,1896;3034;532;826,904,1059,1536;2413;579;746;1481,1482,1483;331;370,904;1335;904;640,840;773;904;640;850;25,51;579;2028;655;2622;579;25,579;25;904;1755;1673;1548;996;904;779;1999;1755;904;3022;417;996;2661;904;26;904;776;101;25;904;579;779;2503;1241;532;2197;904;96;25;904;579;579;353,1627;996;1202,1203;640;579;25;25;492;1627;579;25,51;25,51;25,51;996;331,1132,1133;25,1464;3492,3493;2101;1038;423;846,996;334;746;904;1887;826;904;339;1727,1728;1674;25,1548;1535;579;530;904;773;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1483;961,962;1754;552;25,51;25,51;25,51;25,51;25,51;25,51;25,51;25,51;25,51;25,51;904;843;1673;385,423;1068;579;1257;1081;1674;351;904;904;331;579;904;331,1132,1133;1627;452,1232;331,1132,1133;2622;904;945,946;945,946;351;904;1627;1591;885;1674;1429,1430;331;904;984;1257;1627;904;691;316,1059;3470;1142,3470;1142,3470;1142,3470;2333;904;394,1483,1530,1531,1532,1533;385;826,904,1059,1536;331;2218;3401;331,1132,1133;1452;1675;423,831;-1060,1538;1059;25,26;640;25,1380;904;579;746;1257;25,26;1727,1728;1627;25,1281,2415;25,26;996;826,904,1059,1536;945,946;937;1745;1755;1627;1672;1373;1624;370,716;331;779,904;904;2512;423,439,579;1886;25,417,758;904;1357,1358;1041;1099,1627;1627;2036;945,946;2838;904;746;746;945,946;316;794;1053;339;640;914;1292;-2898,-2899,-2900,-2901,-2902;251;25,1548,2945;339;602;904;416,1663,1664;937;613;904;606;579;2376;2044;904;2622;25,26;438,750;334,1085;316;1755;1627;691,904;25,26;353,356;1627;374;1674;904;825;25,26;904;331,1132,1133;417;1627;146;904;578;25;25,579;385;202;579;945,946;1110,3390;1481,1482,1483;620;375,399,932,1675,2442,2443;25,996;394,1483,1530,1531,1532,1533;3523,3524;904;904;904,3059;606;579;904,1718;25;579;28;1375;1077;1973;904;773;331,1132,1133;579;1110;452;394,1483,1530,1531,1532,1533;77;1842;2858;904;904,1385;331,1132,1133;1257;1646;579,1646;370,719;362,492,579;1715;776;1627,1632;1245;996,3316;464;439;25;1674;776;1627;945,946;826;452;904;1676;2662;904;1658;579;746;15,-26,305,306,307,308,309,310;331,1132,1133;346,819;904;918;1067;371;1673;2393;1627;423;1443;640;776;579;640;904;2955,3454;579;579;423;904;351;1191;1371;1257;945,946;579;113,518,3395;779,2253;1715;394,1372;1443;25,1548;1385,1990;2749,2750;25;904;904;1142;904;464;331;25;1483;1727,1728;2268;579;904;826,904,1059,1536;1460;25,26;904;904;904;2598;346;844;25,26;1349;2457;25,51;2457;25,51;579;331;2328;484;385;579;945,946;2810;746;904;1627;385;1761,1762;1761,1762;-513,1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;25,1281,2415;1443;1715;399,559,579;904;606;452;1627;579;746;1627;904;1257;351;826;785;1627;1627;904;1754;945,946;579;904;2398;904;1191;2997;2193;904;394,1725;904;975,2994,2995;984;113,120,3552;1257;904;904;1257;1257;1257;885;904;904;611;746;945,946;25,464;1257;423;1989;1651;1673;904;1257;570;904;25,51;25,51;2566;579;101,692;25,26,27,28;528,1051;904;3451;538;2215;904;579;904;1675;1257;937;1107;1627;1110,3390;640;1298;1715;2098;937;1999;2719;195,303;1257;3409,3410;2044;2044;794;1548;1232;2357;904;1627;794;3512;1437;25,51;25,51;25,51;25,51;25,51;25,51;25,51;25,51;492,579;579;101,636;1257;1241;1715;1882;1110,3390;926;1144,1293;579;579;904;640;904;904;25;1321;1548;1548;1955;464;746;904;25,996,1857,1859;374;562,563;1715;904;1461,1462;911;1723;904;3008,3009,3010;904;904;96;794;2971;25,26;904;1232;385;371;794;2139;1452;1489;579;96;746;25,26,27,28;2007,2008;3316;579;1042;25,996;579;1673;1627;1627;464;794;1627;904;904;461;1715;25,349,1199;1674;400;3409,3410;399;447;773;579,904,996;1110,3390;2910;552;1745;1999;1672;716;579;1232;859;904;579;467;423;779,1555,1556;1676;3107;613;1226;2397;1539,1540;492,579;1548;904;25,26;579;2272;1548;1452;532;904;904;334;1627;640;385;305,306,308,2813;1744;945,946;417;3135;945,946;25,51;996;904;2598;2598;937;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;25,1281,2415;2622;1627;579;438;385;579;578;2656;904;904;945,946;1755;2751;579;579;945,946;1257;1257;1257;773;2995;25,26;25,26,28;101,458;937;1257;1257;1257;904;25,26,27,28;1868;1308;1252,1354;904;1982;1257;438;904;274;904;2757,2758;904;1359;25,1281,2415;1257;904;1248;394;904;25,1673;904;904;945,946;1440;1060;1257;914;2009;937;98,174;611;1257;1761,1762;1761,1762;2044;794;331,1132,1133;904;579;351;1627;1715;579;423;1588,1589,1590;334;1955;1048;1627;334;331,1132,1133;250;1833;904;25,1281,2415;1755;331;579;2964;1110,3390;339;1359;1331;1107;96;96;25,1548;773,1714;208,212;2127;579,904;483,2331;911;904;423;1627;25,1687,1859;25,26,27;773;25;25,26,27,28;25,26;362;2376;1715;1761,1762;579;1627;2622;1761,1762;331,1132,1133;904;2622;1627;3409,3410;2503;911;785;1231;3511;904;773;375,1548;3470;-1504;331,1132,1133;579;259,260;423,467;452;1674;25,51;904;1744;904;904;579,909;904;2181;1761,1762;1761,1762;1761,1762;1761,1762;904;1627;25,2279;28;25,1281,2415;25,26,27,28;2750;606;25,464,1674;579,2132;1257;2316;1075,1265;1672;691;331;25,26;611;937;1443;296,3572;904;3575;578;25;1860;773;640;1359;2281;2728,2729,2730;25,51;25,51;25,51;25,51;25,51;25,51;25,26;1257;1627;1548;904;1627;904;518;353;579;885;3173;904;899;1257;374;1031;25;25,2945;802;802;904;937;937;773;1755;3471;331,1132,1133;452;96,2658;1761,1762;25,1281,2415;372;1443;914;579;579;384;25,26;1715;904;904;1372;25,1857,1859;904;904;1461,1462;1233,1627;331,1132,1133;606;904;26;1302;613;2384;904;773;423,1107;346;1627;904;945,946;1675;1715;3168;857;25,1079,1080;1627;2246;25,1676;640;904;25,1281,2415;904;1548,3185;1257;1627;370;904;904;2649;1674;1548;579;394,1725;904;498,611;2499;331,904;343;611;904;904;25;2205,2206;2547;1627;579;439;937;904;904;1761,1762;1761,1762;1761,1762;1761,1762;826,1335;1627;1627;25,378,909,2279;1739,1740;467;3409,3410;579;904;394,1725;1674;904;639;25,26;25,26;1761,1762;898;1627;385;1627;1673,1674,1675;945,946;25,26,27;773;1627;904;1627;1683;2622;1830,1831;904;2838;904;1627;527;25;1761,1762;437;802;1734;937;616;1761,1762;371;996;904;2622;1257;25,26;1391;613;1107;579;1443;25,51;25,51;25,51;25,51;25,51;1254;1636;331;1755;904;746;2112;3150;2645;579;176,177;1674;1672;394,1483,1530,1531,1532,1533;579,2074;1302;25,1281,2415;826,904,1059,1536;339;1627;2530;1548,3240,3241,3242,3243,3244;25,26,27,28;904;1337;3409,3410;394,1725;776;25,1281,2415;1359;2316;579;371;904;2123;904;96,2332;1245;1010,1011,1012;1918;101;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;1761,1762;133;25,26;25,1281,2415;25,26;25,26;25;904;1951;351;640;25,1281,2415;423;2838;1627,3012;606;579;904;1184;885;1435;578;1761,1762;3140;25,1281,2415;1676;65;904;904;794;904;331;25,2649;458;3118;25,802;579;551;77;1359;331,1132,1133;904;1727,1728;25,629,630;2074;773;2166;1296;25,1281,2415;25,51;25,51;25,51;25,51;1761,1762;904;613;331,1132,1133;25;1114;904;25,1281,2415;904;1257;331;484;1340,1675,1680;904;904;3470;911;904;1627;773;1761,1762;1761,1762;1627;122;2007,2008;484;25,26,27,28;1673,1674,1675;3409,3410;1673;3477;475;2838;1191;1761,1762;1676;1110,3390;3072;385;1715;579;2622;1627;1191;904;351;148,149;1107;904;2664,2665;2500;1674;1359;339;1627;1627;1483;25,26;904;904;300;2521,2522;1761,1762;904;3409,3410;904;1800,1801;370;3470;904;547;1761,1762;394,847;334;691;904;578;773;371;3371;904;776;1761,1762;331,1132,1133;343;317,318,333,334,3586;25;25;904;1999;904;904;319,320;904;1761,1762;3409,3410;404,438,750,1676;331,1132,1133;904;904;346,578;3409,3410;3409,3410;613;96;740;1443;96;579;25,1281,2415;26;1548;25,1199,1241,1713;773;1443;1117;3025;904;1675;25,1281,2415;3409,3410;2496;25,1281,2415;331;1399;2785,3001;904;370,438,750;578;1359;3409,3410;1398;25,1281,2415;25,1281,2415;1548;423;3409,3410;904;25,26,27,28;3409,3410;1676;2325;1359;3409,3410;1627;773;773;25,1979;25;1887;26;25;3409,3410;579;970;904;3411;1627;904;904;65;399,578;1761,1762;888;3409,3410;26;1761,1762;464;898;3246;904;385;3409,3410;924;785;579;3409,3410;904;3409,3410;25,51;25,51;25,51;25,51;25,51;904;188,189;25,51;25,51;25,51;25,51;25,51;25,51;25,51;25,51;25,51";

const $scriptletHostnames$ = /* 12937 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","voe.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","74k.io","9tsu.*","a8ix.*","aii.sh","al.com","as.com","av01.*","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cbc.ca","ckk.ai","crn.pl","d-s.io","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","g9g.eu","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","im9.eu","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pkr.pw","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7r6.com","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","bbc.com","bgsi.gg","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","cdna.tv","chip.de","cine.to","clik.pw","cnn.com","cpm.icu","crn.com","ctrlv.*","cuty.me","dbna.de","delo.bg","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exee.io","exey.io","faz.net","ffcv.es","filmy.*","fojik.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","jav.one","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pobre.*","prad.de","qiwi.gg","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","stape.*","stfly.*","swfr.tv","szbz.de","tlin.me","tr.link","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","x08.ovh","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","afly.pro","agefi.fr","al4a.com","alpin.de","anoboy.*","arcor.de","ariva.de","asiaon.*","assia.tv","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","crichd.*","crone.es","cuse.com","cwtv.com","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fzlink.*","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","grok.com","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hltv.org","howdy.id","hoyme.jp","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","loadx.ws","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mm9844.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","myl1nk.*","myli3k.*","mylink.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","ninja.io","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shrink.*","shtab.su","shtms.co","shush.se","slant.co","so1.asia","sport.de","sport.es","spox.com","sptfy.be","stern.de","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","viki.com","vipbox.*","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","ww9g.com","wyze.com","x1337x.*","xcloud.*","xcum.com","xdld.lat","xh.video","xo7c.com","xpics.me","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","ytmp3.cc","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apiyt.com","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","buffed.de","busuu.com","c1z39.com","cambabe.*","cambay.tv","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","casi3.xyz","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cutty.app","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efhjd.com","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","file4go.*","filma24.*","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","flyad.vip","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javbob.co","javboys.*","javcl.com","javct.net","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m4ufree.*","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","matele.be","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","mihand.ir","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","opvid.net","orunk.com","owlzo.com","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phica.net","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","seory.xyz","series9.*","seulink.*","sexmv.com","sextb.*>>","sezia.com","sflix.pro","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","stfly.biz","strmup.cc","strmup.to","strtape.*","study.com","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidbm.com","vidcdn.co","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivud.com","vivuq.com","vladan.fr","vnuki.net","voodc.com","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcloud.eu","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xnxxw.net","xpaja.net","xtapes.me","xtapes.to","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zrozz.com","zubby.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","1ytmp3.com","222i8x.lol","2best.club","2the.space","2umovies.*","3fnews.com","3hiidude.*","3kmovies.*","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","ameede.com","amindi.org","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","assia4.com","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av-cdn.xyz","av01.media","avjosa.com","awpd24.com","axporn.com","ayuka.link","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beastx.top","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bf0skv.org","bigten.org","bildirim.*","bithub.win","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","bodytr.com","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brillen.de","brmovies.*","brstej.com","btvplus.bg","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","capital.de","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","ciberdvd.*","cimanow.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","crewus.net","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","digjav.com","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filerio.in","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","flickr.com","flixbaba.*","flixhub.co","flv2mp3.by","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gestyy.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go-mp3.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","hechos.net","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlix.asia","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javibe.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jvideo.xyz","jytechs.in","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","l1afav.net","labgame.io","lacrima.jp","larazon.es","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","mhdtvmax.*","milfzr.com","mitaku.net","miuiku.com","mixdroop.*","mlbb.space","mlsbd.news","mm9842.com","mm9846.com","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","multiup.us","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nwanime.tv","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onmsft.com","onvista.de","openload.*","oploverz.*","orirom.com","otomoto.pl","owsafe.com","paid4.link","paminy.com","papafoot.*","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pixelio.de","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","pornbox.cc","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","primevid.*","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","routech.ro","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seed69.com","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shortit.pw","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skeimg.com","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sokobj.com","solewe.com","sombex.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","sturls.com","suaurl.com","sumoweb.to","sunhope.it","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","terafly.me","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thevouz.in","thosa.info","thothd.com","thripy.com","thumb8.net","thumb9.net","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","top1iq.com","topito.com","toppng.com","torlock2.*","torrent9.*","tr3fit.xyz","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wintub.com","woiden.com","wooflix.tv","woxikon.de","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3ixcf45.cfd","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","76078rb.sbs","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","airevue.net","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anqkdhcm.nl","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","atravan.net","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","avjamak.net","axomtube.in","ayatoon.com","azmath.info","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigwank.com","bitco.world","bitlinks.pw","bitzite.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bollyflix.*","bootdey.com","botrix.live","bowfile.com","boxporn.net","brbeast.com","brbushare.*","brigitte.de","bristan.com","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camel3.live","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ccyig2ub.nl","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinedesi.in","civitai.com","claimrbx.gg","clapway.com","clkmein.com","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","corneey.com","corriere.it","covrhub.com","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","cricplay2.*","crvsport.ru","csurams.com","cube365.net","cubuffs.com","cuevana.pro","cults3d.com","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dma-upd.org","dogdrip.net","dogtime.com","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","dropmms.com","ds2play.com","dsharer.com","dsvplay.com","dudefilms.*","dz4link.com","dziennik.pl","e-glossa.it","e2link.link","e9china.net","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","elfqrin.com","embasic.pro","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f2movies.to","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fdvzg.world","feyorra.top","fffmovies.*","figtube.com","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filesus.com","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","freebcc.org","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","gpldose.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","ipa-apps.me","iporntv.net","iptvbin.com","iptvrun.com","isaimini.ca","isosite.org","ispunlock.*","itpro.co.uk","itsfuck.com","itudong.com","iv-soft.com","j-pussy.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbest.xyz","javbobo.com","javboys.com","javcock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jixo.online","jjang0u.com","jkanime.net","jnovels.com","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jvembed.com","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","koltry.life","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesypro.*","manga1000.*","manga1001.*","mangahub.io","mangasail.*","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcqmall.com","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","messitv.net","messitv.org","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","misterio.ro","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","modapk.link","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","news.com.au","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nysainfo.pl","nytimes.com","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parispi.net","pasokau.com","paste1s.com","payskip.org","pcbolsa.com","pcgamer.com","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","polygon.com","pomorska.pl","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porngem.com","porngun.net","pornhex.com","pornhub.com","pornium.net","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","qdembed.com","quizack.com","quizlet.com","radamel.icu","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","redgifs.com","redlion.net","redporno.cz","redtub.live","redvido.com","redwap2.com","redwap3.com","reifporn.de","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","rumporn.com","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","samax63.lol","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharedisk.*","sharing.wtf","shavetape.*","shinbhu.net","shinchu.net","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamio.to","streamm4u.*","streamup.ws","strikeout.*","studyis.xyz","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techforu.in","technews.tw","tecnomd.com","teevee.asia","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","theroot.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","tinys.click","titantv.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topembed.pw","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchmdh.to","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webmaal.cfd","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xcloud.host","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt1s.com.co","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","z9sayu0m.nl","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zoosex.pink","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1nmnozg1.fun","1primewire.*","2017tube.com","2btmc2r0.fun","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","3a38xmiv.fun","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","56m605zk.fun","5moviess.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8mhlloqo.fun","8rm3l0i9.fun","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","adsurfle.com","adultfun.net","advocate.com","aegeanews.gr","afl3ua5u.xyz","afreesms.com","airliners.de","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","amyscans.com","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animeflv.net","animefreak.*","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","avjamack.com","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bacakomik.co","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","bk9nmsxs.com","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","bookszone.in","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","bright-b.com","bsmaurya.com","btvsports.my","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","buzzfeed.com","byswiizen.fr","calbears.com","callfuck.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chatango.com","chibchat.com","chooyomi.com","chopchat.com","choralia.net","chzzkban.xyz","cinebaz.site","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clip-sex.biz","clix4btc.com","clockskin.us","closermag.fr","cloudrls.com","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","crewbase.net","cricwatch.io","cryptosh.pro","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cutyurls.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","dz-linkk.com","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","ekasiwap.com","elcultura.pl","electsex.com","eljgocmn.fun","elvocero.com","embed4me.com","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esopress.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","eximeuet.fun","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","factable.com","fairyhorn.cc","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmisongs.*","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","fmoviesto.cc","focus4ca.com","footybite.to","forexlap.com","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","g8rnyq84.fun","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gelbooru.com","gentside.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","h8jizwea.fun","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai3z.com","hentai4k.com","hentaigo.com","hentaihd.xyz","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","huzi6or1.fun","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idesign.wiki","idevfast.com","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgspice.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","latino69.fun","ldkmanga.com","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","lifestyle.bg","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","magnetdl.com","magnetdl.org","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganelo.tv","mangaraw.org","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkm7c3sm.com","mkvcinemas.*","mlbstream.tv","mobitool.net","modcombo.com","moddroid.com","modebaca.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","mtcremix.com","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naijafav.top","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","newtumbl.com","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelpub.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nyahentai.re","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","pay4fans.com","pc-hobby.com","pdfindir.net","peekvids.com","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picmoney.org","picnwqez.sbs","picsfuck.org","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixroute.com","pixrqqz.shop","pkw-forum.de","platinmods.*","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranjeet.best","rapelust.com","rapidzona.tv","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","sama-pro.com","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seatguru.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","sheshaft.com","shorteet.com","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","spatsify.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","surf-trx.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","tatangga.com","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","thotvids.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokenmix.pro","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.xyz","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv247us.live","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","u9206kzt.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","unitystr.com","up-4ever.net","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","ur70sq6j.fun","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","uthr5j7t.com","utsports.com","uur-tech.net","uwatchfree.*","valuexh.life","vdiflcsl.fun","veganinja.hu","vegas411.com","vi-music.app","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidmedia.top","vidsaver.net","vidsrc.click","viidshar.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voeunblk.com","voirseries.*","volokit2.com","vqjhqcfk.fun","warddogs.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","witanime.com","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xopenload.me","xopenload.pw","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","y5vx1atg.fun","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","youpouch.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurineko.net","yurudori.com","z1ekv717.fun","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","94.103.83.138","9ketsuki.info","9xmoovies.com","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","aiimgvlog.fun","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allfaucet.xyz","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","aniwatchtv.to","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","aresmanga.com","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoscout24.*","autosport.com","autotrader.nl","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","bdsm-fuck.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bigyshare.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buxfaucet.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo4play.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","cima100fm.com","cine24.online","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","colourxh.site","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","cricstream.me","criollasx.com","criticker.com","crocotube.com","crotpedia.net","cruciverba.it","crypto4yu.com","cryptonor.xyz","cryptorank.io","cultofmac.com","cumlouder.com","cureclues.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailynews.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","demae-can.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desijugar.net","desimmshd.com","dfilmizle.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","expansion.com","extratipp.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","farsinama.com","fclecteur.com","fembed9hd.com","fetish-bb.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmdelisi.co","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamevcore.com","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicuv.com","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdpornzap.com","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","italpress.com","itdmusics.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","libreriamo.it","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","luckydice.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","myadslink.com","myfernweh.com","myflixertv.to","myhindigk.com","myicloud.info","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","namaidani.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","novamovie.net","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","one.ibomma.pw","onemanhua.com","online-fix.me","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","phineypet.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","play.aetv.com","player.stv.tv","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primetubsub.*","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pwinsider.com","pygodblog.com","qqwebplay.xyz","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","rgeyyddl.skin","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rto.bappam.eu","rufiiguta.com","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sakaiplus.com","samaa-pro.com","sarapbabe.com","sassytube.com","savefiles.com","savelink.site","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexgalaxy.net","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skincarie.com","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stilltube.com","stock-rom.com","str8ongay.com","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","tactics.tools","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","techishant.in","technofino.in","techradar.com","techrecur.com","techtrim.tech","techydino.net","techyrick.com","teenbabe.link","tehnotone.com","tejtime24.com","teknisitv.com","teknomuda.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voe-unblock.*","voeunblck.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.net","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youpornru.com","youtubeai.com","youtubemp3.us","yoyofilmeys.*","yumekomik.com","zamundatv.com","zegtrends.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allcryptoz.net","allmovieshub.*","allosoccer.com","allpremium.net","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","arobasenet.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","atlantic10.com","audiotools.pro","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","btvsports.my>>","bustmonkey.com","bustybloom.com","cacfutures.org","cadenadial.com","calculate.plus","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","casertanews.it","cdn.gledaitv.*","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","cheatsheet.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","citychilli.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","crm.cekresi.me","crunchyscan.fr","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","dowfutures.org","download3s.net","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","faucethero.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","fosslovers.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-1abozhcd.nl","fu-1fbolpvq.nl","fu-4u3omzw0.nl","fu-e4nzgj78.nl","fu-m03aenr9.nl","fu-mqsng72r.nl","fu-p6pwkgig.nl","fu-pl1lqloj.nl","fu-v79xn6ct.nl","fu-ys0tjjs1.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","galleryxh.site","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofilmizle.net","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiteca.net","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","homemature.net","homesports.net","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","iisfvirtual.in","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instanders.app","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kissmovies.net","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","layardrama21.*","leakedzone.com","leakshaven.com","learnmania.org","learnospot.com","lebahmovie.com","ledauphine.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangareader.to","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","midebalonu.net","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modagamers.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movingxh.world","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nayisahara.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","netronline.com","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","pajalusta.club","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","panyshort.link","papafoot.click","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevideo.com","proapkdown.com","procinehub.com","pruefernavi.de","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","quest4play.xyz","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","record-bee.com","recordbate.com","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","rule34porn.net","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","short-zero.com","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speedynews.xyz","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsnaut.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","stireazilei.eu","stownrusis.com","stream2watch.*","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tea-coffee.net","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tiz-cycling.io","tojimangas.com","tomshardware.*","topcartoons.tv","topcryptoz.net","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torovalley.net","torrentmac.net","totalsportek.*","tous-sports.ru","towerofgod.top","tpornstars.com","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unionmanga.xyz","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voeunbl0ck.com","voeunblock.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","weatherx.co.in","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","wikifilmia.com","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhamster46.com","xhofficial.com","xhomealone.com","xhwebsite2.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zkillboard.com","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","193.124.191.200","1direct-cloud.*","1vid1shar.space","2tamilprint.pro","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","adz7short.space","aeroxplorer.com","aflamsexnek.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidcure.com","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","avoiderrors.com","awdescargas.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsm-photos.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookmystrip.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","careersides.com","casutalaurei.ro","cataniatoday.it","catchthrust.net","cdn1.fastvid.co","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","claimcoins.site","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","coursewikia.com","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","crypt.cybar.xyz","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","dubznetwork.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.meomeo.pw","embedcanais.com","embedsports.top","embedstreams.me","emmy-rossum.com","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","farmeramania.de","faselhd-watch.*","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file.gocmod.com","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmovitica.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fiveyardlab.com","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","folgenporno.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fu-12qjdjqh.lol","fu-c66heipu.lol","fu-hbr4fzp4.lol","fu-hjyo3jqu.lol","fu-l6d0ptc6.lol","fuckedporno.com","fuckingfast.net","fullfilmizle.cc","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","hdstreamss.club","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilovetoplay.xyz","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","jav-torrent.org","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jkssbalerts.com","jobslampung.net","johntryopen.com","jokerscores.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangaromance.eu","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3-convert.org","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","networkhint.com","news-herald.com","news-leader.com","newstechone.com","nflspinzone.com","nicexxxtube.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","ohmirevista.com","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandasnovel.com","paperzonevn.com","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","phpscripttr.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pissingporn.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornomovies.com","pornrusskoe.com","portable4pc.com","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.com","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","shortxlinks.com","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamers.watch","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","suicidepics.com","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tackledsoul.com","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","team-octavi.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenager365.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thejetpress.com","thejoblives.com","themoviesflix.*","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokyomotion.com","tokyomotion.net","toledoblade.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","veryfuntime.com","vfxdownload.net","vibezhub.com.ng","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voeunblock2.com","voeunblock3.com","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","webmatrices.com","webnovelpub.com","webtoonscan.com","wegotcookies.co","welovemanga.one","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","witcherhour.com","womenshealth.de","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xxxindianporn.*","xxxopenload.com","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yifysubtitles.*","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultoffline.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barrier-free.net","batmanfactor.com","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestclaimtrx.xyz","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","biblegateway.com","bigbuttshub2.top","bikeportland.org","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","buzzfeednews.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","clutchpoints.com","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easyexploits.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyminded.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","fernsehserien.de","fessesdenfer.com","fetishshrine.com","figurehunter.net","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","funkeypagali.com","fussballdaten.de","gadgetxplore.com","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreecourses.*","getviralreach.in","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","globelempire.com","go.discovery.com","go.gets4link.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","gourmetscans.net","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","heilpraxisnet.de","helpdeskgeek.com","hentai-party.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","indexsubtitle.cc","infinityfree.com","infomatricula.pt","inprogrammer.com","interviewgig.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingsofteens.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-6zeqsgv2.com","mee-cccdoz45.com","mee-dp6h8dp2.com","mee-s9o6p31p.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","netu.frembed.lol","newanimeporn.com","newedutopics.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocsummer.com.br","nonesnanking.com","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","odisha-remix.com","officecoach24.de","ohionowcast.info","olalivehdplay.ru","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pawastreams.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","riwayat-word.com","rocketnews24.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenbuddy.com","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supersextube.pro","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thefitbrit.co.uk","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thesundevils.com","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.com","tiroalpaloes.net","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travel.vebma.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","un-block-voe.net","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","upload-4ever.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","vichitrainfo.com","videocdnal24.xyz","videodotados.com","videosection.com","vidstreaming.xyz","vidsvidsvids.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voe-un-block.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webforefront.com","weblivehdplay.ru","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wildpictures.net","windowsonarm.org","wolfgame-ar.site","womenreality.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","xxxvideotube.net","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1movierulzhd.wiki","1teentubeporn.com","2japaneseporn.com","acapellas4u.co.uk","acdriftingpro.com","acrackstreams.com","adblockplustape.*","alaskananooks.com","allcelebspics.com","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amateurs-fuck.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestloanoffer.net","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","camchickscaps.com","cameronaggies.com","candyteenporn.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cookiewebplay.xyz","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","deportealdia.live","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.org","elamigosgamez.com","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbollibrehd.com","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gewinde-normen.de","girlsofdesire.org","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hbculifestyle.com","hdfilmizlesen.com","hdporn-movies.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","howtoconcepts.com","hunterscomics.com","iedprivatedqu.com","imageupscaler.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","japanpornclip.com","japanxxxmovie.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lectorhub.j5z.xyz","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lewblivehdplay.ru","lheritierblog.com","libertestreamvf.*","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","madhentaitube.com","malaysiastock.biz","maps4study.com.br","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moon-fm43w1qv.com","moon-kg83docx.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","musicforchoir.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","novelasligera.com","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","player.cuevana.ac","player.glomex.com","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","prensaesports.com","prescottenews.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplywhisked.com","simulatormods.com","sizyreelingly.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","social-unlock.com","softwaresblue.com","softwaretotal.net","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","starxinvestor.com","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streamcaster.live","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","substitutefor.com","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techconnection.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","theworldobits.com","thienhatruyen.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tiroalpaloweb.xyz","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","topcomicporno.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","tutorialspots.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","urochsunloath.com","utepathletics.com","v-o-e-unblock.com","valeronevijao.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","1youngteenporn.com","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","anarchy-stream.com","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asianpornphoto.net","asiansexdiarys.com","asianstubefuck.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","businessinsider.de","camwhorescloud.com","cararegistrasi.com","casos-aislados.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","choiceappstore.xyz","christinaricci.net","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","cronachesalerno.it","cryptonworld.space","dallasobserver.com","dcdirtylaundry.com","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dulichkhanhhoa.net","e-mountainbike.com","elamigos-games.com","elamigos-games.net","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","fightingillini.com","filmizlehdfilm.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","gorro-9mqnb7j2.fun","gorro-chfzoaas.fun","gorro-ry0ziftc.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","indiasmagazine.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lightnovelspot.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","mangas-origines.fr","manoramaonline.com","maraudersports.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","noodlemagazine.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","ogrenciyegelir.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","pakistaniporn2.com","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pennbookcenter.com","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","ryanagoinvolve.com","sabornutritivo.com","samanarthishabd.in","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","talkforfitness.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","weakstreams.online","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","xxxonlinegames.com","yify-subtitles.org","yodelswartlike.com","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adrino1.bonloan.xyz","adultgamesworld.com","agrigentonotizie.it","ai.tempatwisata.pro","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","alludemycourses.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","cravesandflames.com","creativebusybee.com","crossdresserhub.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","forum-pokemon-go.fr","foxvalleyfoodie.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","go-for-it-wgt1a.fun","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","joguinhosgratis.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kissmaturestube.com","klettern-magazin.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","limiteddollqjc.shop","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","love-stoorey210.net","m.jobinmeghalaya.in","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","merriam-webster.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","mittelbayerische.de","mobilesexgamesx.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","mynaturalfamily.com","myreadingmanga.info","natalie-portman.org","neo.usachannel.info","nepaljobvacancy.com","noticiascripto.site","novelmultiverse.com","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stem-cells-news.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","teenage-nudists.net","tekniikanmaailma.fi","telecharger-igli4.*","theberserkmanga.com","thecrazytourist.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","viewmyknowledge.com","vinylcollective.com","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","advertisingexcel.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","bouamra.blogspot.com","boxofficebusiness.in","br.nacaodamusica.com","browardpalmbeach.com","brr-69xwmut5-moo.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","dcdlplayer8a06f4.xyz","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","digitalmusicnews.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","easymp3converter.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-2ggdmu8q-moo.com","fle-5r8dchma-moo.com","fle-rvd0i9o8-moo.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gametechreviewer.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-04bl9y7x.lol","ghajini-1fef5bqn.lol","ghajini-1flc3i96.lol","ghajini-4urg44yg.lol","ghajini-8nz2lav9.lol","ghajini-9b3wxqbu.lol","ghajini-emtftw1o.lol","ghajini-jadxelkw.lol","ghajini-vf70yty6.lol","ghajini-y9yq0v8t.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","investnewsbrazil.com","irresistiblepets.net","italiadascoprire.net","jemontremonminou.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","luxurydreamhomes.net","makemoneywithurl.com","mangcapquangvnpt.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","metagnathtuggers.com","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudecelebsimages.com","nudeplayboygirls.com","nutraingredients.com","nylonstockingsex.net","online-xxxmovies.com","onlinegrannyporn.com","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","psychologyjunkie.com","pussymaturephoto.com","rachel-brosnahan.org","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","s920221683.online.de","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","server.satunivers.tv","sexypornpictures.org","socialmediagirls.com","socialmediaverve.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thesarkariresult.net","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","underground.tboys.ro","unityassets4free.com","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","www.dobreprogramy.pl","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","attackofthefanboy.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","comentariodetexto.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","divxfilmeonline.net>>","documentaryplanet.xyz","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-ep11lgxt.xyz","filemoon-nv2xl8an.xyz","filemoon-oe4w6g0u.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gamoneinterrupted.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","guardian-series.co.uk","haber.eskisehirde.net","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","megashare-website.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","moo-teau4c9h-mkay.com","moonfile-62es3l9z.com","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scrubson.blogspot.com","semprefi-1h3u8pkc.fun","semprefi-2tazedzl.fun","semprefi-5ut0d23g.fun","semprefi-7oliaqnr.fun","semprefi-8xp7vfr9.fun","semprefi-hdm6l8jq.fun","semprefi-uat4a3jd.fun","semprefi-wdh7eog3.fun","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","videosxxxporno.gratis","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","brunettedeepthroat.com","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","clixwarez.blogspot.com","cloud.majalahhewan.com","comandotorrentshds.org","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","fantasticyoungporn.com","file-1bl9ruic-moon.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","generatesnitrosate.com","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hairstylesthatwork.com","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","live.dragaoconnect.net","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","moneywar2.blogspot.com","monorhinouscassaba.com","muleriderathletics.com","newbookmarkingsite.com","nilopolisonline.com.br","obutecodanet.ig.com.br","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","paginadanoticia.com.br","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","telyn610zoanthropy.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchserieshd.stream>>","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","xvideos-downloader.net","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","alycia-debnam-carey.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","file-kg88oaak-embed.com","financeandinsurance.xyz","footballtransfer.com.ua","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","glotorrents.theproxy.ws","goctruyentranhvui17.com","guidon40hyporadius9.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","moon-3uykdl2w-embed.com","morgan0928-5386paz2.fun","morgan0928-6v7c14vs.fun","morgan0928-8ufkpqp8.fun","morgan0928-oqdmw7bl.fun","morgan0928-t9xc5eet.fun","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","patriotathleticfund.com","pepperlivestream.online","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","rationalityaloelike.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","toutes-les-solutions.fr","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","antecoxalbobbing1010.com","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","democratandchronicle.com","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","glotorrents.fr-proxy.com","greenbaypressgazette.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","playstationlifestyle.net","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","stephenking-00qvxikv.fun","stephenking-3u491ihg.fun","stephenking-7tm3toav.fun","stephenking-c8bxyhnp.fun","stephenking-vy5hgkgu.fun","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","audaciousdefaulthouse.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","currentaffairs.gktoday.in","cyamidpulverulence530.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","greaseball6eventual20.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","matriculant401merited.com","mega-hentai2.blogspot.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","realfinanceblogcenter.com","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","tech.unblockedgames.world","telenovelas-turcas.com.es","thebeginningaftertheend.*","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","30sensualizeexpression.com","a-b-f-dd-aa-bb-cc61uyj.fun","a-b-f-dd-aa-bb-ccn1nff.fun","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","boonlessbestselling244.com","change-ta-vie-coaching.com","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","secondcomingofgluttony.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","beautifulfashionnailart.com","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","otakuworldsite.blogspot.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","toxitabellaeatrebates306.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fittingcentermondaysunday.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","launchreliantcleaverriver.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","shorturl.unityassets4free.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","20demidistance9elongations.com","449unceremoniousnasoseptal.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","vpn-anbieter-vergleich-test.de","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","0x7jwsog5coxn1e0mk2phcaurtrmbxfpouuz.fun","279kzq8a4lqa0ddt7sfp825b0epdl922oqu6.fun","2g8rktp1fn9feqlhxexsw8o4snafapdh9dn1.fun","5rr03ujky5me3sjzvfosr6p89hk6wd34qamf.fun","jmtv4zqntu5oyprw4seqtn0dmjulf9nebif0.fun","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f7011d0w3j3aor0dczs5ctoo2zpz1t6bm5f49.fun","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","a-b-c-d-e-fla3m19lerkfex1z9kdr5pd4hx0338uwsvbjx.fun","a-b-f2muvhnjw63ruyhoxhhrd61eszezz6jdj4jy1-b-d-t-s.fun","a-b-f7mh86v4lirbwg7m4qiwwlk2e4za9uyngqy1u-b-d-t-s.fun","a-b-fjkt8v1pxgzrc3lqoaz8fh7pjgygf4zh3eqhl-b-d-t-s.fun","a-b-fnv7h0323ap2wfqj1ruyo8id2bcuoq4kufzon-b-d-t-s.fun","a-b-fqmze5gr05g3y4azx9adr9bd2eow7xoqwbuxg-b-d-t-s.fun","ulike-filter-sowe-canplay-rightlets-generate-themrandomlyl89u8.fun"];

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
