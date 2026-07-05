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
    static keys = Object.keys;
    static entries = Object.entries;
    static hasOwn = Object.hasOwn;
    static Regex = RegExp;
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
        const v2 = query.startsWith('v2:');
        if ( v2 ) { query = query.slice(3); }
        const r = this.#compile(query, 0);
        if ( r === undefined ) { return; }
        if ( r.i !== query.length ) {
            let val;
            if ( query.startsWith('=', r.i) ) {
                const match = this.#reRval.exec(query.slice(r.i));
                if ( match ) {
                    r.modify = match[1];
                    val = match[2];
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
        r.v2 = v2;
        this.#compiled = r;
    }
    evaluate(root) {
        if ( this.valid === false ) { return []; }
        this.#root = { '$': root };
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
            if ( obj === undefined ) { continue; }
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
    #QUANTIFIER = 5;
    #reUnquotedIdentifier = /^[A-Za-z_][\w]*|^\*/;
    #reExpr = /^\s*([!=^$*]=|[<>]=?)\s*(.+?)\]/;
    #reIndice = /^-?\d+/;
    #reRval = /^=([a-z]+)\((.+)\)$/;
    #reQuantifier = /^\{(\d+|\d+,\d+|\d+,|,\d+)\};\$/;
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
            if ( c === 0x3B /* ; */ ) {
                if ( query.startsWith(';$', i) === false ) { return; }
                steps.push(
                    { mv: this.#QUANTIFIER, min: 1, max: 1e6 },
                    { mv: this.#ROOT }
                );
                i += 2;
                mv = this.#UNDEFINED;
                continue;
            }
            if ( c === 0x7B /* { */ ) {
                const match = this.#reQuantifier.exec(query.slice(i));
                if ( match === null ) { return; }
                const comma = match[1].indexOf(',');
                let min, max;
                if ( comma === -1 ) {
                    min = max = parseInt(match[1]);
                } else {
                    min = parseInt(match[1].slice(0, comma)) || 0;
                    max = parseInt(match[1].slice(comma+1)) || 1e6;
                }
                steps.push(
                    { mv: this.#QUANTIFIER, min, max },
                    { mv: this.#ROOT }
                );
                i += match[0].length;
                mv = this.#UNDEFINED;
                continue;
            }
            if ( c !== 0x5B /* [ */ ) {
                if ( mv === this.#UNDEFINED ) {
                    const step = steps.at(-1);
                    if ( step === undefined ) { return; }
                    const j = this.#compileExpr(query, step, i);
                    if ( j ) { i = j; }
                    break;
                }
                const r = this.#consumeUnquotedIdentifier(query, i);
                if  ( r === undefined ) { return; }
                steps.push({ mv, k: r.s });
                i = r.i;
                mv = this.#UNDEFINED;
                continue;
            }
            // Bracket accessor syntax
            if ( query.startsWith('[?', i) ) {
                const not = query.charCodeAt(i+2) === 0x21 /* ! */ ? 1 : 0;
                const j = i + 2 + not;
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
                if ( step.op ) {
                    const { obj, key } = this.#resolvePath(pathin);
                    if ( obj === undefined ) { return []; }
                    const outcome = this.#evaluateExpr(step, obj, key);
                    if ( outcome !== true ) { break; }
                }
                resultset = [ pathin ];
                break;
            case this.#CHILDREN:
            case this.#DESCENDANTS: {
                if ( resultset.length === 0 ) { break; }
                resultset = this.#getMatches(resultset, step);
                break;
            }
            case this.#QUANTIFIER: {
                const { length } = resultset;
                if ( length < step.min || length > step.max ) { return []; }
                resultset = [];
                break;
            }
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
            if ( owner === undefined ) { continue; }
            if ( step.steps ) {
                this.#getMatchesFromExpr(pathin, step, owner, listout);
                continue;
            }
            const iter = this.#expandKey(owner, step.k);
            if ( iter ) {
                for ( const k of iter ) {
                    const outcome = this.#evaluateExpr(step, owner, k);
                    if ( outcome !== true ) { continue; }
                    listout.push([ ...pathin, k ]);
                }
            }
            if ( step.mv !== this.#DESCENDANTS ) { continue; }
            for ( const { obj, key, path } of this.#getDescendants(owner, true) ) {
                const iter = this.#expandKey(obj[key], step.k);
                if ( iter === undefined ) { continue; }
                for ( const k of iter ) {
                    const outcome = this.#evaluateExpr(step, obj[key], k);
                    if ( outcome !== true ) { continue; }
                    listout.push([ ...pathin, ...path, k ]);
                }
            }
        }
        return listout;
    }
    #expandKey(owner, k) {
        if ( typeof owner !== 'object' || owner === null ) { return; }
        if ( Array.isArray(k) ) {
            const out = [];
            for ( const a of k ) {
                const iter = this.#expandKey(owner, a);
                if ( iter === undefined ) { continue; }
                out.push(...iter);
            }
            return out;
        }
        if ( typeof k === 'number' ) {
            if ( Array.isArray(owner) === false ) { return; }
            return [ k >= 0 ? k : owner.length + k ];
        }
        if ( k === '*' ) {
            if ( Array.isArray(owner) ) { return owner.keys(); }
            return JSONPath.keys(owner);
        }
        if ( k instanceof JSONPath.Regex ) {
            const out = [];
            for ( const key of JSONPath.keys(owner) ) {
                if ( k.test(key) === false ) { continue; }
                out.push(key);
            }
            return out;
        }
        return [ k ];
    }
    #getMatchesFromExpr(pathin, step, owner, out) {
        const recursive = step.mv === this.#DESCENDANTS;
        const v2 = this.#compiled.v2 || recursive || Array.isArray(owner);
        for ( const { path } of this.#getDescendants(owner, recursive) ) {
            const q = v2 ? [ ...pathin, ...path ] : pathin;
            const r = this.#evaluate(step.steps, q);
            if ( Boolean(r?.length) === false ) { continue; }
            out.push(q);
            if ( v2 === false ) { break; }
        }
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
                        this.stack.push({ obj: v, keys: JSONPath.keys(v).values() });
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
            iterator.stack.push({ obj: v, keys: JSONPath.keys(v).values() });
        }
        return iterator;
    }
    #consumeIdentifier(query, i) {
        const keys = [];
        for (;;) {
            const c0 = query.charCodeAt(i);
            if ( c0 === 0x5D /* ] */ ) { break; }
            if ( c0 === 0x2C /* , */ || c0 === 0x20 /* SPACE */) {
                i += 1;
                continue;
            }
            if ( c0 === 0x22 /* " */ || c0 === 0x27 /* ' */ ) {
                const r = this.#untilChar(query, c0, i+1);
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
            const r = this.#consumeUnquotedIdentifier(query, i);
            if ( r === undefined ) { return; }
            keys.push(r.s);
            i = r.i;
        }
        return { s: keys.length === 1 ? keys[0] : keys, i };
    }
    #consumeUnquotedIdentifier(query, i) {
        if ( query.charCodeAt(i) === 0x2F /* / */ ) {
            const r = this.#untilChar(query, 0x2F, i+1);
            if ( r === undefined ) { return; }
            let re;
            try { re = new JSONPath.Regex(r.s); } catch { return; }
            return { s: re, i: r.i };
        }
        const match = this.#reUnquotedIdentifier.exec(query.slice(i));
        if ( match === null ) { return; }
        return { s: match[0], i: i + match[0].length };
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
                step.rval = new JSONPath.Regex(r.s, match && match[0] || undefined);
            } catch { return; }
            step.op = 're';
            if ( match ) { r.i += match[0].length; }
            return r.i;
        }
        const match = this.#reExpr.exec(query.slice(i));
        if ( match === null ) { return; }
        const op = match[1], rval = match[2];
        if ( rval.charCodeAt(0) === 0x27 /* ' */ ) {
            const r = this.#untilChar(rval, 0x27, 1);
            if ( r === undefined ) { return; }
            step.rval = r.s;
            step.op = op;
        } else {
            try {
                step.rval = JSON.parse(rval);
                step.op = op;
            } catch { return; }
        }
        return i + match[0].length - 1;
    }
    #resolvePath(path) {
        if ( path.length === 0 ) { return { value: this.#root }; }
        const key = path.at(-1);
        let obj = this.#root
        for ( let i = 0, n = path.length-1; i < n; i++ ) {
            obj = obj[path[i]];
            if ( obj instanceof Object === false ) { return {}; }
        }
        return { obj, key, value: obj[key] };
    }
    #evaluateExpr(step, owner, k) {
        if ( owner === undefined || owner === null ) { return; }
        const hasOwn = owner[k] !== undefined || JSONPath.hasOwn(owner, k);
        if ( step.op !== undefined && hasOwn === false ) { return; }
        const target = step.not !== true;
        const v = owner[k];
        switch ( step.op ) {
        case '==': return (v === step.rval) === target;
        case '!=': return (v !== step.rval) === target;
        case  '<': return (v < step.rval) === target;
        case '<=': return (v <= step.rval) === target;
        case  '>': return (v > step.rval) === target;
        case '>=': return (v >= step.rval) === target;
        case '^=': return `${v}`.startsWith(step.rval) === target;
        case '$=': return `${v}`.endsWith(step.rval) === target;
        case '*=': return `${v}`.includes(step.rval) === target;
        case 're': return step.rval.test(`${v}`);
        default: break;
        }
        return hasOwn === target;
    }
    #modifyVal(obj, key) {
        let { modify, rval } = this.#compiled;
        if ( typeof rval === 'string' ) {
            rval = rval.replace('${now}', `${Date.now()}`);
        }
        switch ( modify ) {
        case undefined:
            obj[key] = rval;
            break;
        case '+': {
            if ( rval instanceof Object === false ) { return; }
            const lval = obj[key];
            if ( lval instanceof Object === false ) { return; }
            if ( Array.isArray(lval) ) { return; }
            for ( const [ k, v ] of JSONPath.entries(rval) ) {
                lval[k] = v;
            }
            break;
        }
        case 'call': {
            const entries = rval.slice();
            if ( entries.length < 2 ) { break; }
            entries.forEach((a, i, aa) => {
                if ( a === '${obj}' ) { aa[i] = obj; }
                else if ( a === '${key}' ) { aa[i] = key; }
                else if ( a === '${val}' ) { aa[i] = obj[key]; }
            });
            const instance = entries[0] ?? self;
            instance[entries[1]](...entries.slice(2));
            break;
        }
        case 'repl': {
            const lval = obj[key];
            if ( typeof lval !== 'string' ) { return; }
            if ( this.#compiled.re === undefined ) {
                this.#compiled.re = null;
                try {
                    this.#compiled.re = rval.regex !== undefined
                        ? new JSONPath.Regex(rval.regex, rval.flags)
                        : new JSONPath.Regex(rval.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                } catch { }
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

function freezeElementProperty(
    property = '',
    selector = '',
    pattern = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('freeze-element-property', property, selector, pattern);
    const matcher = safe.initPattern(pattern, { canNegate: true });
    const owner = (( ) => {
        if ( Object.hasOwn(HTMLScriptElement.prototype, property) ) {
            return HTMLScriptElement.prototype;
        }
        if ( Object.hasOwn(HTMLElement.prototype, property) ) {
            return HTMLElement.prototype;
        }
        if ( Object.hasOwn(Element.prototype, property) ) {
            return Element.prototype;
        }
        if ( Object.hasOwn(Node.prototype, property) ) {
            return Node.prototype;
        }
        return null;
    })();
    if ( owner === null ) { return; }
    const current = safe.Object_getOwnPropertyDescriptor(owner, property);
    if ( current === undefined ) { return; }
    const shouldPreventSet = (elem, a) => {
        if ( selector !== '' ) {
            if ( typeof elem.matches !== 'function' ) { return false; }
            if ( elem.matches(selector) === false ) { return false; }
        }
        return safe.testPattern(matcher, `${a}`);
    };
    Object.defineProperty(owner, property, {
        get: function() {
            return current.get
                ? current.get.call(this)
                : current.value;
        },
        set: function(a) {
            if ( shouldPreventSet(this, a) ) {
                safe.uboLog(logPrefix, 'Assignment prevented');
            } else if ( current.set ) {
                current.set.call(this, a);
            }
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `Assigned:\n${a}`);
            }
            current.value = a;
        },
    });
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

function jsonEdit(jsonq = '') {
    editOutboundObjectFn(false, 'JSON.parse', jsonq);
}

function jsonEditFetchRequest(jsonq = '', ...args) {
    jsonEditFetchRequestFn(false, jsonq, ...args);
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
            const props = collateFetchArgumentsFn(resource, options);
            const matched = matchObjectPropertiesFn(propNeedles, props);
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
            const props = collateFetchArgumentsFn(...args);
            const matched = matchObjectPropertiesFn(propNeedles, props);
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

function jsonEditXhrRequestFn(trusted, jsonq = '') {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit-xhr-request`,
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
        send(body) {
            const xhrDetails = xhrInstances.get(this);
            if ( xhrDetails ) {
                body = this.#filterBody(body) || body;
            }
            super.send(body);
        }
        #filterBody(body) {
            if ( typeof body !== 'string' ) { return; }
            let data;
            try { data = safe.JSON_parse(body); }
            catch { }
            if ( data instanceof Object === false ) { return; }
            const objAfter = jsonp.apply(data);
            if ( objAfter === undefined ) { return; }
            body = safe.JSON_stringify(objAfter);
            safe.uboLog(logPrefix, 'Edited');
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `After edit:\n${body}`);
            }
            return body;
        }
    };
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

function preventInnerHTML(
    selector = '',
    pattern = ''
) {
    freezeElementProperty('innerHTML', selector, pattern);
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
                const props = collateFetchArgumentsFn(...args);
                const matched = matchObjectPropertiesFn(propNeedles, props);
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

function trustedEditInboundObject(propChain = '', argPos = '', jsonq = '') {
    editInboundObjectFn(true, propChain, argPos, jsonq);
}

function trustedJsonEdit(jsonq = '') {
    editOutboundObjectFn(true, 'JSON.parse', jsonq);
}

function trustedJsonEditFetchResponse(jsonq = '', ...args) {
    jsonEditFetchResponseFn(true, jsonq, ...args);
}

function trustedJsonEditXhrRequest(jsonq = '', ...args) {
    jsonEditXhrRequestFn(true, jsonq, ...args);
}

function trustedJsonEditXhrResponse(jsonq = '', ...args) {
    jsonEditXhrResponseFn(true, jsonq, ...args);
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

function trustedPreventFetch(...args) {
    preventFetchFn(true, ...args);
}

function trustedPreventXhr(...args) {
    return preventXhrFn(true, ...args);
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

function trustedReplaceFetchResponse(...args) {
    replaceFetchResponseFn(true, ...args);
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $scriptletFunctions$ = /* 47 */
[trustedJsonEditXhrRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,jsonlEditXhrResponse,noWindowOpenIf,setConstant,abortCurrentScript,trustedSuppressNativeMethod,abortOnStackTrace,preventRequestAnimationFrame,preventInnerHTML,trustedSetConstant,trustedReplaceOutboundText,trustedReplaceArgument,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedOverrideElementMethod,abortOnPropertyRead,preventAddEventListener,adjustSetInterval,preventSetInterval,abortOnPropertyWrite,noWebrtc,noEvalIf,trustedPreventFetch,disableNewtabLinks,trustedJsonEditFetchResponse,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedEditInboundObject,spoofCSS,alertBuster,preventCanvas,jsonEditFetchRequest];

const $scriptletArgs$ = /* 3280 */ ["[?..userAgent*=\"channel\"]..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/player?","[?..userAgent*=\"lactmilli\"]+={\"params\":\"8AUB\"}","[?..userAgent*=\"lactmilli\"]..playbackContext.contentPlaybackContext.lactMilliseconds=\"${now}\"","[?..userAgent=/adunit|channel|lactmilli|instream|eafg/]..referer=repl({\"regex\":\"(?:#reloadxhr)?$\",\"replacement\":\"#reloadxhr\"})","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..data.viewer..nodes.*[?.__typename==\"AdsSideFeedUnit\"]","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..node[?.*.__typename==\"SponsoredData\"]","..nodes.*[?.sponsored_data]",".data[?.category==\"SPONSORED\"].node",".data.viewer.news_feed.edges.*[?.category==\"SPONSORED\"].node","Function.prototype.toString","Element.prototype.insertAdjacentElement","console.clear","undefined","globalThis","break;case","WebAssembly","atob","Array.from","\"/NodeList/\"","prevent","inlineScript","Document.prototype.querySelectorAll","\"/^\\[d[a-z]t[a-z]?-[0-9a-z]{2,4}\\]$/\"","HTMLElement.prototype.querySelectorAll","\"/.*\\[[^imns].+\\].*/\"","Element.prototype.hasAttribute","\"/[\\S\\s]+/\"","Document.prototype.evaluate","\"/.*/\"","Document.prototype.createTreeWalker","aclib","/stackDepth:3\\s+get injectedScript.+inlineScript/","setTimeout","/stackDepth:3.+inlineScript:\\d{4}:1/","Date","MessageChannel","/stackDepth:2.+inlineScript/","/\\.(gif|jpe?g|png|webp)/","requestAnimationFrame","Array.prototype.join","/^[\\S\\s]{2000,6000}$/","DOMTokenList.prototype.remove","/^[\\S\\s]{3000,4000}$/","/cssText'|:'style'/","Promise.resolve","/jso\\$|\\(_0x|(['\"`]\\s*[-0-9A-Z_a-z]+\\s*['\"`],\\s*){50,}|ByDZ/","json:{\"isShowingPop\":false}","aclib.runInterstitial","{}","as","function","( ) => value","runInterstitial(e){if(this.#fe.interstitial)return void this.#r.error(\"interstitial zone already loaded on page\");this.#fe.interstitial=!0;const{zoneId:t,sub1:r,isAutoTag:n,collectiveZoneId:i,linkedZoneId:o,aggressivity:s,recordPageView:a,abTest:c,tagVersionSuffix:u}=e;if(!t)throw new Error(\"mandatory zoneId is not provided!\");if(!we(t))throw new Error(\"zoneId is not a string!\");this.#r.debug(\"loading interstitial on page\");const l={zoneId:t,sub1:r,isAutoTag:n,collectiveZoneId:i,linkedZoneId:o,aggressivity:s,recordPageView:a,abTest:c,tagVersionSuffix:u,adcashGlobalName:this.#xe,adserverDomain:this.#v,adblockSettings:this.#s,uniqueFingerprint:this.#C,isLoadedAsPartOfLibrary:!1};if(this.#pe.add(t),this.#Ce.Interstitial)return l.isLoadedAsPartOfLibrary=!0,void new this.#Ce.Interstitial(l);if(window.Interstitial)new Interstitial(l);else{const e=document.createElement(\"script\");e.type=\"text/javascript\",e.src=`${location.protocol}//${this.#he}/script/interstitial.js`,e.setAttribute(\"a-lib\",\"1\"),e.onload=()=>{new Interstitial(l)},e.onerror=()=>{this.#r.error(`failed loading ${e.src}`)},document.head.appendChild(e)}}","Element.prototype.getAttribute","0","json:\"class\"","condition","d-z","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","document.getElementById","json:\"body\"","ad-detection-bait","document.querySelector","-id-","scriptBlocked","false","blocked","testUrls","[]",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","Worker.prototype.postMessage","adblock","4000-","++","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","Object.prototype.hasRightPartnership","falseFunc","Object.prototype.hasLeftPartnership","Object.prototype.hasTopPartnership","Object.prototype.hasBottomPartnership","_adBlockState","document.querySelectorAll","security.js","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","freestar.newAdSlots","String.prototype.allReplace","executaGoogleAnalytics3","initJWPlayerMux","initJWPlayerMux.utils","initJWPlayerMux.utils.now","ambossAnalytics","ambossAnalytics.getUserAttribution","dataset.ready","script[src^=\"https://www.googletagmanager.com/gtag/js?id=\"]","Osano","Osano.cm","Osano.cm.addEventListener","Osano.cm.removeEventListener","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber","..node[?.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","adblock_added","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","adcashMacros","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","decodeURIComponent","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","shift","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","btoa","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","AdservingModule","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","error","[src]","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.protect_block","flashvars.video_click_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","alert","check","isBlanketFound","showModal","myaabpfun","sec","_wm","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","jwplayer.utils.Timer","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","block","console","send","ab_cl","V4ss","#clickfakeplayer","popunders","visibility","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","adBlock","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion.homad.enabled","getHomadConfig","aud.springserve.com","<VAST version=\"3.0\"></VAST>","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","secondsLeft","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]","disabled",".btn-primary","focusOut","googletagmanager","suaads","/window\\.location\\.href|n/","8000","json:\"drall_Suaads_annersads_JS__randomAds\"","/randomAds|div-gpt-ad|divAdsInit/","json:\"ADs-1\"","json:\"click\"","visibilitychange","window.addEventListener","/visibilitychange|blur|pageshow|keydown|beforeunload|pagehide/","/\\$\\('|ai-close/","app_vars.please_disable_adblock","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","http","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","localStorage._d","blank","google_srt","json:0.61234","vizier","checkAdBlock","googlesyn","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","clicked","charCodeAt","decodeURIComponent(escape","clicksCount",".data.isAdsEnabled=false","/api/files","document.createTreeWalker","json:{\"acceptNode\": \"function() { return NodeFilter.FILTER_REJECT; }\"}","if","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper",".downloadbtn","zigi_tag_id","self.Math","(function(","setCookie","advertisement3","start","AdLink","!buzzheavier.com","removeChild",".href","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","/seconds--|timeLeft--/","json:\"main\"","/div-gpt-ad-dgking|\\.GoogleActiveViewElement/","/div-gpt-ad-|\\.adsbygoogle/","json:\"container\"","adblock_detected","/pub\\.clickadu|bing\\.com/","a","\"/chp_?ad/\"","/blocked|null/","remaining--","json:\"header\"","/ad-chk|aads-frame/","Element.prototype.closest","script[data-domain=","document.body.appendChild(s)","document.head||","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","clearTimeout","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","document.body.appendChild(s","no-referrer-when-downgrade","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","appendTo:","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain",".ads_mode=\"0\"","/embed/settings",".ads_mode_dl=\"0\"","$+={\"ads_suppressed\":true}","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","Document.prototype.querySelector","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral",".EnableAdmiral=false",".ShowAds=false","gnt.x.uam","interactive","gnt.u.z","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/admiral/","runtimeConfig.AM_PATH","CACHE",".indexOf","/runtime-config","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","..Admiral.isEnabled=false","..admiral=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","Element.prototype.setAttribute","/error-report|new Promise|;await new|:\\[?window|&&window,|void 0\\]|location\\.href|void 0\\|\\|window|,window,|void 0,window|\\[0,window\\]|\\)\\.join\\(String\\.fromCharCode|adShieldError/","loadShield","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","repl:/\"$//","script[id][onerror]","asap stay","json:\"setTimeout((()=>{if(!location.pathname.startsWith('/game'))return;const t=document.getElementById('question-label');t&&(window.animation=lottie.loadAnimation({container:t,renderer:'svg',loop:!0,autoplay:!1,path:'/assets/animationsLottielab/gameDots.json'}))}),1e3);\"","__cfRLUnblockHandlers","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","features.ad02 features.adshield","AHE.is_member","AppBootstrapData.config.adshieldAdblockRecovery","AppBootstrapData.config.adshieldNativeAdRecovery","AppBootstrapData.__initializeFeatures__.adshieldAdblockRecovery.enabled","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","..adshieldAdblockRecovery.enabled=false","/error-report|nowprocket/","__NEXT_DATA__.runtimeConfig.enableShieldScript","Object.prototype._adShieldLoaded","HTMLScriptElement.prototype.onload","..AdShield.isEnabled=false","Range.prototype.createContextualFragment","json:\"<script></script>\"","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","__aaZoneid","DoodPop",".check=false","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","#downloadvideo","ads playerAds","..allowAdblock=true","displayLayer","adId","pop_init","adsbyjuicy","np.detect","dataset.zone","length:40000-60000","mode:no-cors","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","api/v1/detail","reklama-flash-body","/scoreUrl|pingUrl/","appPageData.appAds","appPageData.appAdsHandles","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","..adBlockerDetectorEnabled=false","history.replaceState","data.[].relationships.advert data.[].relationships.vast","offers","/#EXT-X-DISCONTINUITY\\n(?:#EXTINF:.*,\\n.+?adType=preroll[\\s\\S]+?)(?=#EXT-X-DISCONTINUITY)/gm","/.*\\.m3u8/","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json",".*[?.adId]","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","xml","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best","pop_","POP_URL","repl:/\"popactive\":true/\"popactive\":false/","[style*=\"z-index\"]","backRedirect","adv_pre_duration","adv_post_duration",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","data.header_script data.footer_script data.direct_link_ads data.direct_link_ads_vip_1 data.direct_link_ads_vip_2 data.direct_link_ads_play_vip_2 data.direct_link_ads_zoom_vip_2","/config","createAgeModal","Object[_0x","adsPlayer","this","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","a[target=\"_blank\"][rel*=\"sponsored\"]","shopeeLinks","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","Pop","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","data.attributes.ssaiInfo","/videoPlaybackInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","/atob|overlay/","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","xv.conf.dyn.ads","xv.conf.dyn.excld","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"https:\")]])","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","contador","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","detector_launch","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","/(?=^(?!.*(http)))/","()=>","$onet","adsRedirectPopups","canGetAds","method:/head/i","Storage.prototype.setItem","bannerDismissed","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","fallback.ssaiInfo manifest.url","fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])][not(.//*[name()=\"AdaptationSet\"][@contentType=\"text\"])])","/dash.mpd","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/","/getComputedStyle|bait/","AController_3","json:\"div\"","ins",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","searchCount","empire.pop","empire.direct","empire.directHideAds","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","ssaiInfo fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"_ad\") and contains(text(),\"creative\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","powerAPITag","rodo.checkIsDidomiConsent","protection","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","download_click","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","tmDetectAdBlocker","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","sandDetect",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","/#EXTINF:[^\\n]+\\n[^\\n]+?\\/preroll\\/[^\\n]+/gms","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod",".streams.*.adUnits=[]","/manifest/video","/#EXTINF[^\\n]+\\n[^\\n]+?segment[^\\n]+/gms","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","a[href][onclick^=\"window.open\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","/ethicalads\\.io|nitropay\\.com/","HTMLImageElement.prototype.onload","img","Image.prototype.complete","2d","Element.prototype.getBoundingClientRect",".length","HTMLImageElement.prototype.naturalWidth","240","#artifactFileContent","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","playerEnhancedConfig.run","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","JSON.stringify","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","/inter","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","grecaptcha.ready","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","moa_id","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","cloudflareinsights","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","location.reload","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","30","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","HTMLScriptElement.prototype.setAttribute","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","Array.prototype.includes","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","google-ca-pub-4459622307906677","wbDeadHinweis","()=>{var c=Kb","0.2","__venatusLoaderInit","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","googlesyndication.com","repl:/blank/self/","stoCazzo","_insertDirectAdLink","/doubleclick|atob/","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","/googletagmanager|ip-api/","&&",".ads={\"movie\":false,\"series\":false,\"episode\":false,\"comments\":false,\"preroll\":false}","/settings",".preroll.ad",".preroll.countdownSec=0","()=>j(e=>e-1)","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","DMP_ENABLE_ADS","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","!addons.mozilla.org","rot_url","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","/googlesyndication\\.com|offsetHeight/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","pbjs.libLoaded","flashvars.adv_pre_url","()&&","Object.prototype.adBlockerPop","BACK","clkUnder","adsArr","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","steamBanner clickAds clickAdsUa clickAdsRu pushNotification","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","En(e-1)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","adClickThrough","..showAds=false","ad_blocker_detector","._$",".result.items.*[?.content*=\"'+'\"]","/comments","img[onerror]","KAA.state.revspot","enforceVideoShield","/initPops|popLite|popunder/","__US_CONFIG__.ads.adblock_measure_enabled","__US_CONFIG__.ads.adblock_wall_enabled","__US_CONFIG__.ads.urls","[?.type==\"ads\"].visibility.status=\"hidden\"","shouldRun","ad-ipd","window.getComputedStyle","maddenwiped","/redirect.php?","*.*","/api/banners","checkBanners","/detect|bait/i","++;break;}}}}}","__adBlockState","__SSR_CONFIG__.monkey","__revCatchInitialized","json:\"none\"","ab.dt","/^[a-zA-Z]{15}$/","data.initPlaybackSession.adScenarios data.initPlaybackSession.adExperience.adExperienceTypes",".data.initPlaybackSession.adExperience.adsEnabled=false","ConFig.config.ads","json:{\"pause\":{\"state\":{}}}","Object.prototype.adblockPlugin","initializeNtvxSheet","fireAd","juicy_tags","!youtu","injectAd",".isAdFree=true","resumeGame","/admaven|adspyglass/","/eeea5e31|new\\s+Function/","timeLeft--","source.ads","/player",".props.pageProps.globalData.publisherFeatureFlags.enableAdBlockDetection=false",".props.pageProps.globalData.publisherFeatureFlags.enableHardAdBlockDetection=false",".adsEnabled=false","/access","adsterraSmartLink adsterraSmartLink2","/^[a-zA-Z]{12}$/","/popup/i","length:1000-1010","Advert","popup-dialog-id","utilAds","/^a$/","/ADBLOCK|ADSENSE/","pubads.g.doubleclick.net","sponsor ad_provider","api.openlua.cloud","/adsbygoogle|google-analytics|ads-twitter|doubleclick/","String.prototype.replace","decideForPlacement","=void 0","/\\{[a-z]+\\(\\)\\}/",".value||",".value&&",".banner_ad_wrapper","/(veta.naver.com\\/vas|veta.naver.com\\/gfp|veta.naver.com\\/call)/ method:OPTIONS","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","method:POST body:/content_view|impression|page_view/",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","linkfire.tracking","method:POST body:/pageview|engagement/","body:pageview method:POST","svc.webex.com/metrics","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive","json:\"https://\"","data:video/mp4",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_id=1","/track-playback",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_url=\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\""];

const $scriptletArglists$ = /* 3866 */ "0,0,1,2;0,3,1,2;0,4,1,2;0,5,1,2;1,6,7,8;2,9,10,1,2;2,11,10,1,12;3,9,10,1,13;4,14,15,16;4,17,10,16;4,18,19,13;5,14,15,20;5,21,15,20;5,21,15,22;6,23,24;6,23,25;6,23,26;7,27;5,21,15,28;7,29;3,30,10,1,31;8,32;7,33;8,34;8,35;9,36,1,31;9,34,1,31;9,37,1,31;6,23,38;6,39,26;6,39,38;10;11,40,41;12,42,43;12,44,45;13,46,47,48,49;13,50,51;13,52,53;13,54,55,48,49;13,56,57,48,49;13,58,57,48,49;14,59,60;14,61,62;15,63;14,64,65;16,10,66;15,67;12,68,69;12,70,71;12,23,72;12,73,74;17,59,75;11,76,77,78,79;18,38,80,81;19,82,83,84,85,86;20,87;20,88,89;21,90,91;20,92,93;20,94;20,95;10,96;12,97,98;11,99,41;12,100,101;22,102,103;21,104,105;21,106,105;20,107;19,108,83,109,85,110;19,111,83,109,85,112;11,113,114;11,115,114;11,116,117;21,118;20,119;23,120,121,122;22,123,10,10,124,125;19,126,83,127,85,128;24,129,130;25,131;21,132;21,10,133;15,134;22,135,136;19,137,83,10,85,138;22,139,140;18,141,142,143,85,144;19,141,83,145,85,146;19,147,83,145,85,146;22,148,149,150;21,151;11,152,41;22,153,154;13,155,156,157;26,158,159;11,160,161;11,162,161;11,163,161;11,164,161;11,165,41;14,166,167;25,168;3,169,10,1,170;11,171,172;25,173;1,174;22,175,176;20,175,176;11,177,172;11,178,179;1,180,91;11,181,179;11,182,172;23,183,184;11,185,186;7,187;22,188;11,189,172;11,190,77;11,191,172;20,192;27;11,193,172;11,194,172;11,195,172;11,196,172;11,197,172;11,198,77;11,199,172;11,200,172;22,201;28,202;22,203;22,204;1,205,206;23,207,208;23,209,210,122;12,211;11,212,10;20,213;20,204;14,214,215;22,216;11,217,77;11,218,77;11,219,77;27,220,10,221;20,222;11,223,77;20,224;11,225,172;20,216;11,226,172;11,227,93;11,228,77;11,229,77;1,230,231,8;1,232,233,8;11,234,117;11,235,172;20,236;11,237,172;11,238,172;11,239,172;11,240,77;11,241,172;20,242;25,243;11,244,172;11,245,172;11,246,172;11,247,77;11,248,93;11,249,77;11,250,172;11,251,77;11,252,172;11,253,10;11,254,77;11,255,172;11,256,77;11,257,172;11,258,172;11,259,77;11,260,172;11,261,172;11,262,77;11,263,77;11,264,77;11,265,77;11,266,77;11,267,77;11,268,172;11,269,172;1,270,233;11,271,77;20,272;27,273,206;11,274,77;11,275,172;26,276,277;11,278,77;11,279,172;11,280,172;11,281,172;1,282,283;1,284,206;11,285,77;11,286,172;11,287,77;11,288,172;19,111,83,289,85,290;11,291,41;11,292,93;11,293,77;11,294,172;11,295,77;11,296,117;11,297,77;11,298,172;11,299,172;11,300,172;11,301,77;11,302,172;11,303,172;11,304,77;11,305,117;11,306,77;11,307,172;11,308,172;11,309,172;11,310,172;11,311,77;11,312,172;1,313,233,8;11,314,77;11,315,10;11,316,77;11,317,172;11,318,172;20,319;11,320,77;11,321,172;11,322,77;11,323,172;11,324,172;11,325,77;11,326,172;11,327,172;11,328,77;11,329,172;11,330,172;11,331,172;11,332,77;11,333,172;1,334,206,8;1,335,233,8;11,336,172;22,213;1,337,206,8;11,338,77;11,339,172;22,340;1,205,341,8;1,205,342,8;11,343,172;21,344;11,345,77;11,346,172;11,347,77;20,348;11,349,172;11,350,77;11,351,172;11,352,77;11,353,172;11,354,77;11,355,172;11,356,77;11,357,172;11,358,172;17,359,360;11,361,114;1,6,283,8;1,362,363,8;11,364,77;11,365,172;11,366,172;1,367,206,8;20,368;11,369,77;11,370,77;11,371,172;11,372,172;11,373,77;11,374,172;11,375,172;11,376,114;11,377,172;11,378,172;11,379,77;11,380,172;11,381,172;11,382,41;11,383,172;11,384,172;11,385,172;11,386,172;26,276,10,387,388;11,389,77;11,390,172;11,391,77;11,392,172;11,393,77;11,394,172;11,395,93;19,396,397,398,85,399;11,400,77;11,401,172;11,402,172;11,403,93;11,404,114;11,405,172;11,406,179;11,407,397;11,408,172;11,409,77;11,410,77;11,411,172;11,412,77;11,413,172;26,158,414,387,415;11,416,77;11,417,77;11,418,172;11,419,172;11,420,41;11,421,41;11,422,41;11,423,41;7,424;2,425,10,1,426;26,158,427;28,428,91;7,429,430;26,158,431;28,432,433;22,434;11,435,83;22,436;11,437,10;28,438;25,439;7,440;4,441,77,442;4,443,77,442;4,444,77,442;7,445,446;7,447;7,448;3,449,10,1,442;8,450;9,450,1,31;25,451;25,452;26,10,438;21,438;11,453,186;12,454,455;12,456;21,457;21,458;25,459;19,26,83,460,85,461;1,10,433;25,462;29,463;11,464,41;30;25,465;12,466;22,467;26,276,468;29,469;12,470,462;25,471;25,472;25,473;29,474;25,475;26,276,476;26,158,477;21,478,479;25,480;25,481;29,482;20,483;11,484,172;12,111,485;12,100,486;1,487,206;25,488;25,466;26,158,489;25,490;25,491;12,61,492;25,493;14,494,495;12,470,496;29,466;29,497;25,498;25,499;26,158,500;26,158,501;20,188;11,502,93;11,503,172;22,504;12,470,505;12,506,507;25,508;25,509;12,470,510;29,511;29,512;12,513,514;25,515;26,10,487;12,470,516;26,10,517;12,518,519;25,520;21,492;12,521,492;29,509;25,456;12,454,522;25,523;25,524;29,525;29,526;12,108,527;1,528,529;14,489,49;25,99;11,530,114;11,531,114;25,532;11,533,117;23,534;25,535;26,536,537;25,538;12,470,539;12,470,540;12,470,41;25,541;25,542;11,543,114;25,506;12,489,466;25,544;25,545;25,546;11,547,10;11,548,114;29,549;11,550,93;29,551;29,552;29,553;11,554,93;25,555;12,470,517;29,556;25,521;23,557,558,559;11,560,179;1;29,561;26,10,466;25,562;11,563,114;25,564;12,523;25,565;12,566,567;29,568;28,569;12,470,570;27,571;25,572;25,573;29,574;21,575;11,542,93;25,576;21,577;25,578;11,579,172;11,580,93;29,581;26,276,582;26,583,584;12,521,585;29,586;12,100,587;11,40,179;11,588,10;11,589,10;11,590,397;26,591;21,592;25,593;21,594,595;11,596,93;25,597;26,10,598;12,470,599;11,600,10;25,601;14,439,602;26,158,603;15,604;26,605;14,521,606;25,607;11,608,172;11,609,186;14,111,610;1,611,612;1,613,479,8;11,614,93;21,615,83;11,616,172;11,42,186;25,617;11,132,114;12,618,496;11,619,93;12,454,620;29,621;11,622,161;26,10,623;25,624;21,625,479;12,61,479;21,626,627;25,628;12,45,507;11,629,93;12,521,630;28,487;26,10,631;25,632;29,633;11,634,114;25,635;12,636;12,45,637;12,638,639;25,40;26,640,641;21,642;25,643;25,644;31,645;25,646;25,647;25,648;11,649,172;12,108,41;11,650,172;29,651;1,652;27,653;21,111,233;25,654;25,655;25,656;12,518,657;29,658;29,659;11,660,114;21,661,662;11,663,93;11,664,114;27,665,666;12,488,132;26,158,667;27,668,595;29,669;29,523;25,670;26,276,641;25,671;11,672,114;26,158,595;12,166,584;12,45;25,673;12,674,675;29,676;26,158,438;12,454,677;25,678;11,679,114;25,619;21,166,479;12,506,45;25,680;29,681;21,682;21,683;25,551;31,523;11,684,10;21,518,83;26,685,686;26,10,642;12,454,572;12,572,687;25,688;25,689;25,690;11,691,93;11,40,172;21,661,595;25,692;26,158,661;26,693,694;12,695,534;29,696;23,697,698;21,699,233;12,700,701;11,702,114;10,631;25,132;12,703;26,10,704;25,705;11,566,93;26,706,707;29,708;21,709,710;12,619;12,61,711;22,712;12,713,714;21,715,595;26,158,716;12,470,717;11,456,93;21,718;26,10,719;21,719;26,720,10,387,721;12,470,458;29,99;21,722,283;26,723,724;21,725,91;12,61,111;21,726,595;10,727;12,454,728;10,729;11,730,77;11,731,10;25,732;29,733;12,108,132;11,734,172;25,735;27,736,595;25,737;11,738,114;20,739;21,740;1,741,206,221;11,132,172;11,742,10;7,206,743;10,10,744;12,26,45;12,572;29,745;20,746;11,747,41;12,470,748;11,749,114;11,542,172;25,750;21,715,751;21,752;25,753;26,723,754;25,755;20,756;11,757,172;25,758;12,489,572;26,640,759;11,760,93;10,761;12,506,762;25,469;22,763;11,764,114;25,765;12,108,766;20,767;11,768,172;26,10,769;29,770;21,771,283;12,470,772;25,773;27,10,774;25,775;27,10,10,83;21,776;12,108,777;20,778;12,779,528;12,470,779;25,780;14,728,781;26,536,782;26,723,783;12,573,784;25,785;26,536,487;12,470,786;12,61,787;25,788;29,789;21,487,595;25,790;12,518,521;29,572;23,791,792;12,793;12,45,506;12,489;12,396,794;29,507;23,795,796;25,797;25,728;28,798,479;21,284,799;12,470,800;25,801;11,572,186;25,802;26,803,631;11,804,93;25,581;25,805;29,806;23,807,808;27,809,206;11,810,114;11,811,172;26,276,812;21,813,91;12,581;25,814;26,158,815;12,816;11,817,41;25,818;12,470,466;26,158,819;21,517,233;21,820,821;20,822;29,810;21,823,83;27,824;12,108,825;12,826,827;11,828,114;25,829;25,830;25,831;21,832,479;22,284;11,833,114;29,834;21,835;28,836,479;29,837;21,487;10,838,744;12,108,839;29,840;11,45,172;26,10,63;25,841;11,842,172;21,843,397;11,844,172;12,108,284;11,845,172;20,763;26,723,846;12,513,507;12,396,847;25,848;1,849,529;25,850;25,633;12,470,851;11,132,397;11,852,397;21,853;23,854;29,855;7,856,857;12,858,782;21,470;21,859,479;29,643;29,860;21,813;12,108,861;11,862,83;11,284,93;29,863;26,276,864;25,865;12,866,645;11,867,93;29,868;21,438,83;26,10,869;21,870;11,871,172;12,454,872;11,538,397;12,61,873;12,61,874;29,875;12,573,873;12,100,876;25,877;14,513,878;21,879,880;28,881;23,697,882;29,883;12,521,884;21,434;12,454,885;26,276,487;11,886,114;22,188,763;25,842;21,887,91;25,888;25,889;25,890;21,517;25,891;29,892;27,10,10,8;11,893,179;12,894;12,489,534;25,895;11,896,93;14,897,49;11,898,10;11,899,41;11,538,114;21,813,433;25,900;12,108,901;11,902,93;12,108,903;12,108,904;21,905,595;21,906,479;25,907;29,908;12,470,909;12,470,910;12,470,901;21,902;12,108,911;12,470,912;12,108,913;29,914;22,204,149,150;21,186,529;26,158,915;26,158,916;12,518,661;21,715,363;21,917,283;27,862;11,918,83;25,919;21,920,363;21,715,231;26,276,759;10,921;29,506;25,922;11,923,114;12,470,132;22,924;21,925;26,926,927;21,928;11,929,172;12,470,930;21,715,479;12,521,931;11,932,172;25,933;11,934,172;26,723,935;12,513,45;11,936,93;29,937;1,938;29,939;12,695,585;29,940;11,941,114;11,99,172;11,942,172;21,728,363;21,496;29,943;21,944;11,945,172;21,946,595;11,947,93;29,941;26,158,948;28,715,233;25,949;25,950;26,951,952;29,953;25,954;14,521,49;23,534,955;1,956;29,957;11,958,93;12,494,637;12,470,959;28,960,961;11,962,10;25,507;12,470,963;11,914,93;11,964,93;21,965;20,284;21,966;12,826,276;12,108,967;12,202,701;25,968;10,969,83;11,970,93;11,700,93;27,653,206;11,971,114;26,536,972;21,973,666;11,974,114;21,975;1,10,10,221;21,976,91;21,977,433;26,276,230;25,587;11,978,83;11,834,172;25,979;27,652;21,980;27,10,10,221;11,981,83;26,276,631;25,982;25,983;12,99;12,470,984;10,985;25,513;12,986,987;12,638,769;27,988,479;29,989;26,990,769;11,991,172;12,97,901;11,992,83;26,276,993;10,132,397,994;22,995;26,276;11,996,114;12,997;12,998;12,999;12,1000;26,723,1001;25,1002;21,1003,397;10,1004;12,855;25,1005;10,1006;11,1007,172;25,1008;25,1009;21,1010;11,1011,172;28,1012,479;26,640,1013;11,1014,114;25,240;12,454,782;12,728,1015;29,1016;11,517,114;25,1017;12,826,1018;25,489;11,1019,10;11,1020,10;11,1021,114;14,45,49;25,908;21,1022;12,108,1023;12,45,633;12,1024,487;21,1025;20,1026;20,1027;21,967,595;14,100,49;25,1028;26,723,1029;21,1029;12,470,777;21,897,479;11,1030,83;11,1031,93;11,1032,93;11,1033,114;21,132,1034;26,1035;25,1036;21,1037;21,186;12,521,1038;12,61,1039;25,1040;25,1041;25,1042;12,638,642;29,1043;11,1044,161;25,1045;12,521,1046;12,100,1047;25,1048;11,1049,93;11,1050,93;11,1051,186;14,108,1052;11,1053,93;11,1054,114;1,956,479,8;29,1055;25,782;10,1056;25,1057;26,10,434;21,438,627;12,108,1058;12,521,1059;12,108,1060;29,1061;25,913;12,826,661;10,467,397;25,1062;23,697,1063;25,1064;26,467,769;28,1065,479;21,530;12,396,43;25,59;11,1066,114;11,1067,114;21,1068;25,561;25,1069;26,158,1070;26,1071,487;25,1072;11,1073,93;12,527,792;25,1074;25,64;11,1042,172;25,1075;31,1076;25,1077;29,1078;11,1079,93;29,1080;11,1081,397;31,284;23,1082,1083;12,63,876;12,1038,876;29,1084;11,99,114;21,1085;10,284;11,1086,397;25,1087;29,1088;21,1089;11,1090,93;12,572,697;25,1091;12,1092;12,826,1093;11,1094,179;12,695,1095;12,97,1096;21,1097;22,1098;12,454,41;21,1099;29,1100;29,1101;26,723,1102;29,1103;12,470,872;12,1104,967;12,521,967;25,1105;12,108,1106;10,1107,744,994;29,132;11,1108,93;29,1109;26,1110,1111;12,470,1112;21,715;25,1113;7,1114;28,1115;12,97,1116;25,1117;12,521,598;25,1118;11,1119,93;21,872;14,427,1120;21,1121;25,1122;21,1123;21,1124,595;22,1125;11,962,41;12,560;26,10,1126;25,810;23,1127;25,1128;12,633,587;12,1129;22,1130;25,1131;21,1132;11,1133,10;26,951;11,273,93;29,1134;21,1135;28,1135;26,276,1136;25,1137;12,1138;12,521,1139;26,10,496;25,1140;28,559,751;28,1141;11,1142,41;26,1143,686;12,524,1144;26,158,1095;12,108,1145;21,1146;11,1147,93;29,1148;21,1149;21,10,397;26,10,1150;11,482,93;21,41;21,914,397;12,470,1151;29,916;12,470,1152;12,454,1118;21,810;11,1153,10;25,1154;11,1155,172;25,1156;12,454,132;27,1157;1,1157;25,1158;12,513,1159;21,661;26,10,1160;11,99,93;12,897,1116;12,454,1010;27,1161;11,1162,83;21,1163;20,204,149;25,1164;21,1165,595;28,769;28,777;25,1166;7,1167;27,10,206,83;11,542,179;21,1003;26,276,782;12,470,61;12,108,1168;12,470,284;12,454,777;12,470,1169;12,100,642;12,470,97;11,1170,93;20,1171;11,1172,77;20,1173;11,1174,114;14,1175,1176;4,1177,1178,1176;7,1179;11,1180,41;11,1181,114;11,1182,172;32,1183,1184;26,1185;7,429,1186;21,1187,662;21,115;12,1188;12,61,1189;12,1190;26,1071,1112;25,1191;12,470,1192;21,1193,83;21,661,1194;26,158,41;11,1195,114;26,723,1091;11,1196,77;26,158,769;21,1197;26,723,572;12,470,1198;12,108,1199;11,1200,93;11,434,186;12,521,132;20,1201;27,1202,479;21,1203,83;25,937;28,1065;28,792;26,1204;25,1205;12,470,572;25,1206;11,1207,114;21,615,880;11,1208,93;11,1209,93;11,1210,114;11,284,186;10,1211;12,1212,782;33;29,1213;12,866,872;12,470,1214;23,1215;31,752;26,276,1216;25,1073;12,470,1217;12,100,507;12,470,489;26,276,10,387,1218;21,1219;20,434;11,1220,172;25,893;25,1221;11,1222,93;12,842;12,1223;23,697,1224;23,697,1225;23,697,1226;12,100,1227;25,1228;25,1229;12,513,1230;26,10,458;26,849,584;21,1231;14,895,1232;11,1233,186;21,769;12,166,367;25,1234;25,1235;23,854,1236;12,518,827;21,1237,91;12,111,1238;12,470,1239;21,1240;26,10,284;25,1132;12,470,1241;29,1242;26,276,1243;11,1244,93;21,1152;26,158,1245;28,434;11,1246,93;21,1247,479;22,1248;11,1249,114;12,470,1163;12,454,1163;21,1250;7,1251;21,1247;26,158,1252;11,1253,93;11,1254,93;12,489,132;11,1255,114;25,1190;25,1256;25,1257;12,521,1258;11,466,41;25,1259;11,1260,186;12,518,1261;12,454,276;11,1262,93;12,507,495;21,816;26,10,572;21,1263;10,1264;21,1265;27,668,206,8;25,1148;11,1266,186;11,434,179;11,1267,41;25,1268;10,1269;21,1270;21,701;27,1271;11,99,186;26,723,872;11,1272,397;25,1273;25,527;11,1274,114;25,1275;25,1276;12,45,487;21,913;25,1277;11,1149,114;7,1278;26,1279,1280;21,1281,83;21,284;12,470,1282;26,1283,1284;26,723,810;14,633,49;1,10,433,83;25,497;25,1285;11,1286,93;25,1287;10,1288;23,1289,1290;12,518,1163;12,518,1291;12,518,516;12,826,810;28,944;11,970,114;29,1292;11,1293,41;17,1294,1295,1296,1297;25,1298;27,849,206,221;21,913,595;19,1187,83,1299,85,1187;11,1300,179;17,439,1301;27,736,206,221;11,1302,83;1,1303,206,8;27,1304,206,8;27,1305,206,221;1,1306,206,221;25,1292;27,849,206,8;26,1307;26,816,1308;31,1309;7,1310;1,1311,206;11,1312,93;12,518,1313;12,555,654;12,489,434;7,1314;7,1315;7,1316;31,1317;21,1318;22,1319;12,1320,1321;21,1322;22,204,10,1323;11,1324,179;12,1320,944;22,1325;26,158,1326;12,518,1321;12,518,284;10,1327;11,1328,93;25,1329;23,1330,1331;23,1330,1332,122;23,1333,1334;26,816,1335;22,1336;27,824,206,8;25,998;14,111,1337;21,1338,1339;19,108,83,1340,85,1341;19,108,83,1342,85,1341;19,826,83,1343,85,1344;19,1345,83,1343,85,1346;27,1305,206,8;1,1347,206,8;27,736,206,8;26,723,704;21,1198;25,1348;26,158,1349;23,697,1350;26,723,1351;26,723,813;21,487,91;29,1352;23,1289,10,122;10,1353;11,790,41;1,1354;11,1355,114;11,1356,172;11,1000,172;26,1357,641;26,1344,1358;1,10,206,1359;18,507,1360,114;29,1320;14,439,1361;25,1362;27,1305,479,8;27,1305,1363,8;12,521,1351;25,999;27,1030,206,8;11,1364,93;26,1365,1366;11,913,1367;20,1368;12,1369,1370;26,723,625;21,907;27,1371,206,8;1,1112,206,8;31,438;25,1372;22,1373,1374;27,849,206;1,849,206;26,158,1375;25,1376;23,534,1377;31,972;14,108,810;10,10,1034;1,849,206,8;14,24,1378;1,1112,206;31,1379;26,723,1380;23,534,1381;26,276,1382;26,276,10,387,1383;25,1326;25,1384;22,1385;20,1386;31,434;22,1387;10,1388;27,10,206,221;1,10,206,221;22,434,1389;11,1390,186;12,26,1391;26,276,1392;17,1393,1394;11,1395,77;21,1396;22,1397;26,276,1398;21,1399;12,166,1400;26,276,521;11,1401,41;26,723,466;22,1402;22,1403;27,668;11,1404,93;24,934,1405;23,697,1406,122;26,276,1407;27,668,479,8;26,816;1,10,627;12,61,979;14,695,810;11,1408,1297;12,45,1409;21,813,233;27,668,479;1,956,479;12,24,97;22,746;28,1327;12,61,1410;12,26,1038;26,276,466;26,276,1411;34,1412,1,1413;19,1414,1297,1415;26,276,1416;26,276,48;8,1417;8,1418;22,1419;23,1333,1420;26,276,598;26,276,1095;10,1421;25,45;12,45,1422;12,126,1423;12,703,1424;11,1425,93;25,1426;11,1427,10;10,1428;26,276,1429;26,276,1430;28,1431;12,521,810;14,108,1432;3,1433,10,1,1434;10,1435;20,1130,149;10,10,744,994;27,1436,206;19,111,83,1437,85,1438;19,166,83,1437,85,1439;19,108,83,1440,85,1441;22,1442;21,1443,662;13,866,1444;21,1445;27,1446,206;21,1187;26,1344;19,108,83,1447,85,1448;11,1449,161;26,723,1450;12,521,1450;26,158,1451;12,521,1452;21,1453,91;21,1454,744;21,1454;11,1455,172;21,232,744;11,1456,114;21,1457;25,1458;14,100,884;14,97,1459;14,97,1460;14,97,1461;12,61,1462;11,1463,77;11,1464,172;12,1465;7,1466;18,45,142,10,85,1467;26,276,584;12,45,1468;12,1469,1468;18,45,142,10,85,1470;29,842;26,10,584;12,470,584;12,44,1104;26,10,1471;12,61,630;12,1472,630;12,521,1473;12,521,1474;26,158,1475;12,521,1476;12,521,630,1477;13,1478,1479,48,1480;12,521,1481;31,630;12,555,1482;25,1483;10,1484;25,1485;26,10,582;21,1486;14,521,1487;11,1488,10;25,1489;29,1490;12,654,523;28,467;11,1491,41;21,1095;29,1492;11,588;21,1097,595;12,100,1493;12,26,987;12,1494,987;26,10,987;12,100,987;12,513,1495;14,97,1496;12,26,1104;12,1497,987;14,427,1498;12,1369,1499;25,1500;25,1501;12,1104,26;12,1104,987;12,1024,43;12,506,1502;14,97,1503;12,100,1504;20,1505;34,1506,1,1507;34,1508,1,1507;34,1509,1,1507;14,587,1510;12,44,45,1477;26,723,496;12,63,1511;12,42,1512,1477;12,518,59;12,527,1513;12,1497,1514;14,572,1515;12,24,43;12,518,1516;26,640,1517;10,1518;11,1519,117;21,1520;14,695,1521;26,1522,6,387,1523;11,1524,93;11,1525,1526;11,1527,172;26,158,1528;26,276,1528;27,1305;10,1529;11,1530,114;26,10,1531;21,519,595;31,1532;12,521,1532;31,1533;26,158,944;14,166,1534;25,1535;13,866,1444,48;21,1536;29,1537;12,1166,1010;12,1166,1010,1477;26,158,1538;21,495;22,1539,149,1374;20,1539,149;26,723,1540;13,1541,1542,157,1543;11,1544,114;12,521,1545;11,1545,172;35,1546;35,1547;11,1548,41,1296,1549;11,1550,93;8,1551;8,1552;12,521,1553,1477;11,1554,93;26,720,1163;12,1545;11,1555;16,585,1556;26,1557;11,1558,41;14,506,1559;26,720,1560;26,158,1560;21,1560;2,284,10,1,1561;8,1562;8,1563;35,1564;35,1565;35,1566;22,1567;21,1568;21,1569;21,1570;19,1571,397,10,85,1572;11,1573,172;11,1574,172;11,1575,172;7,1576;19,1571,397,1577,85,1578;19,1571,397,1579,85,1578;31,1580;16,585,1581;19,1571,83,1582;23,884,1583,1584;19,1571,397,1585,85,1572;11,1586,93;11,1587,93;21,6,91;19,108,83,1588,85,1589;13,1571,1590,157;26,158,1568;12,521,1591;11,1122,172;7,1592;11,1593,397;11,1594,114;11,1594,114,1296,1549;11,1595,114;11,1595,114,1296,1549;11,1596,114;11,1596,114,1296,1549;11,1597,114;11,1597,114,1296,1549;36,1598,1,1599;36,1600,1,1599;16,585,1601;11,1602,114;11,1603,93;11,1604,41;35,1605;19,1606,83,1607,85,1581;12,1608,1609,1477;11,1610,114;27,1611,206,8;11,1612,179;25,1613;29,1614;35,1615;23,682,1616;11,1617,186;11,1212,186;18,1618,1619,10,85,781;14,1620,487;11,856,117;10,10,397;17,1621,1622;11,1623,397;14,521,1624;26,158,1625;11,1626,83;12,470,513;31,202;1,1627,206,8;12,518,1512;28,132;23,854,1628;1,736;7,1629;35,1630;14,521,1631;26,276,1632;12,1633;25,1634;26,1635;12,521,1636;22,188,1637;22,1638;22,1505;26,723,438;26,1357;2,1639,10,1,1640;26,723,1641;2,1642,10,1,1643;11,1644,93;11,1645,93;2,1639,10,1,1646;12,1212,1647;26,1522,1648;11,1649,77;11,1650,77;12,826,1651;2,1652,10,1,1653;2,1654,10,1,1655;22,1656;28,458;11,1657,114;35,1658;12,1659,813;7,1660;7,1661;4,1662,10,1663;26,276,1664;12,826,496;37,1665,1,1666;8,1667;22,1668,1669;21,1670;11,1671,114;11,1672,41;26,276,1673,387,1299;11,1674,93;21,10,880;20,1675;21,1676;19,108,83,1677,85,1678;22,1679;21,1680;26,276,768;21,768;26,158,1681;26,10,1682;26,723,1683;11,1684,93;21,1685;11,1686,114;26,723,1003;7,1687,1688;38,1689,10,1690;3,284,1691,1,1692;7,1693;7,1694;39,1695,1696;10,1697;12,61,132;26,10,1698;12,826,1699;19,866,83,1700;23,682,1701,122;26,158,610;21,1702;29,1703;29,1704;21,625;12,521,1705;12,638,439;10,1706;8,1707;12,826,1708;11,1709,117;14,61,489;26,1710,1711;17,1712,1713;2,284,10,1,1714;11,1715,114;11,1190,41;11,1716,93;3,1717,10,1,1718;14,521,1719;10,631,397,994;12,826,1720;21,1681;12,826,1036;11,1721,41;26,723,487;19,137,1722,1723,85,1724;10,1725;26,276,61;26,276,1726,387,1727;24,934,1728;26,276,1729;11,1730,179;21,1731;11,1732,114;12,454,427;12,518,872;11,1733,114;25,1734;12,108,1735;25,1736;27,1737;1,1738;21,1739;28,1739;11,1740,186;21,813,479;26,158,1741;21,1742;21,908;21,1743,83;12,108,434;12,507,1744;31,458;21,454;26,536,1745;12,695,777;12,470,1746;12,396,587;21,916;21,467;26,723,1747;12,513,1748;11,1749,397;11,1750,114;11,1751,114;12,521,514;11,1752,186;12,470,1753;25,1754;11,1755,114;11,1756,114;21,914;25,1746;25,1757;25,1758;25,1759;12,815,97;11,1760,83;11,1761,114;21,1762;21,1763;12,470,1247;31,872;21,1764;12,470,1765;14,470,1498;11,1766,186;12,573,527;14,1767,1768;14,521,1769;26,158,585;31,1770;12,470,1771;12,638,1772;12,470,1773;11,1774,172;11,1775,172;22,782;29,1776;10,1777;17,1778,1779;21,1780;12,489,438;12,108,1781;12,866,1782;11,1783,161;21,1214,479;25,1784;26,10,1785;11,1786,41;11,1787,172;27,736,206;21,1190;12,111,438;26,158,1058;25,1781;12,470,1788;12,587,1789;11,1790,114;26,10,1791;25,1792;11,1793,77;11,1794,93;11,1795,397;11,1796,77;11,1797,77;11,1798,397;7,1799;11,1800,172;12,61,1801;25,1802;26,723,132;31,719;11,1803,93;11,1804,41;21,1705,880;11,1805,172;28,752;11,950,114;20,1806;29,1807;21,1808;25,1809;29,1810;21,1811;21,1812;21,1813;12,489,1814;11,1815,161;27,1816;29,1817;11,668,83;12,470,1818;14,100,916;21,1819;11,506,172;25,1820;12,489,1821;11,1822,10;25,947;21,1711;21,1823;25,1824;25,1825;25,1038;12,100,1268;26,10,1826;21,830;21,1827,880;21,1828,91;21,1829,479;25,1147;14,97,1830;7,1831;21,1705;26,720;23,697,1832;21,1833;21,1834,479;26,158,1835;21,1836;23,534,1837,122;11,1838,172;21,1839;25,1840;12,497;1,1841,1842;23,1843,1844;25,1845;21,1846;12,1016,1847;7,1848;26,276,1471;27,1849,479,8;11,1850,10;7,1851;7,1852;38,1853,10,1690;7,1854;3,1855,10,1,1856;11,1857,172;11,1858,93;21,1859;25,1860;27,10,10,1861;1,10,1862,83;28,1705;23,697,1863,122;21,1864,433;12,1865;26,723,1866;12,108,1299;26,10,1867;23,534,1868;10,1869,397;25,1870;26,1871;25,1872;25,457;11,1873,114;11,1874,172;11,1875,93;21,1876;12,1877;12,470,1878;29,1613;31,496;26,803,507;21,1879,710;11,1880,93;11,1881,93;29,1683;25,1882;12,1883,1884;25,1885;25,1659;25,1886;12,513,1887;11,1888,41;12,396,1889;12,1890;29,566;21,1891;20,1892;17,1893,1894;17,1895,1896;11,1897,114;11,1898,114;26,10,1429;14,61,810;11,438,83;25,1899;28,1900,479;12,513,1901;29,1902;26,276,1903;12,1904;11,1905,114;11,1906,114;12,454,284;12,695,345;1,1907,1908;11,1909,172;25,1910;25,1911;26,1710;26,10,1912;14,97,10;11,1072,93;12,489,24;28,108,433;14,454,1010;7,1913;12,521,1914;11,1915,10;11,1916,83;26,276,1223;21,24;14,26,1917;12,100,645;22,1918;12,108,810;26,158,894;12,454,1199;21,1919;22,1920;26,723,1921;11,1922,172;11,1923,41;11,1924,41;12,587,1925;14,979,49;25,634;12,470,1739;18,45,1926,1927;7,1928;22,1929,10,1930;14,842,1931;23,1932,1933;12,521,1782;26,1934,1935;27,1936;26,816,230;26,816,1937;12,507,769;11,1938,93;11,1939,172;12,454,901;39,1940,1941;7,1942,1943;38,1944,10,1945;22,1946;12,513,495;21,1947;14,573,10;25,1948;21,1949;25,847;14,573,1950;25,1951;27,487;14,897,489;26,723,769;21,1952;27,1953;12,507,45;25,902;25,1954;29,1955;11,1956,172;11,1957,397;11,1958,10;20,1959;22,1959;21,10,283;25,1614;12,826,1198;12,728,1960;26,1071,41;12,1961;27,1962;25,1963;26,1964,1965;23,697,1966;1,1967;12,24,1968;12,108,1969;20,1970;12,826,434;27,1971;27,1972;23,1333,1973;12,470,615;26,1071,610;26,276,1974;1,1975,283;12,24,1976;25,1977;23,1082,1978,1584;20,188,149;40,1979,1,1980;2,1981,10,1,1980;7,1982;27,1983;28,1984;27,1985;12,521,1986;11,1221,172;21,1987;27,1988;22,1989;38,1990,10,1690;12,108,1991;22,1992;25,26;27,1816,1993,1994;7,1995;25,1996;12,573,523;12,1997;11,682,172;11,1998,172;12,521,1999;14,100,495;1,2000;21,2001;22,2002;11,1795,2003;11,2004,41;21,971;12,521,455;14,521,2005;12,494,645;11,2006,83;26,803,2007;21,2008;26,276,1298;2,2009,10,1,2010;27,2011;27,1030,206;21,2012;14,842;21,1130;26,158,907;26,1071,2013;25,2014;25,568;27,2015;12,470,434;10,2016;22,2017;23,2018,2019,122;41,188,2020;11,2021,77;11,2022,172;21,2023;28,2024;22,2025;12,108,2026;14,2027,2028;12,826,2029;21,2030,595;11,2031,114;1,487,231;1,813,1339;14,100,10;11,2032,114;14,97,1917;27,2033;14,470,49;25,2034;20,2035;21,2036;11,1972,83;14,100,781;14,61,284;14,97,49;11,2000,179;25,1955;26,2037;25,2038;11,2039,397;12,521,438;12,518,495;14,2040,2041;12,2042;14,2043,427;10,2044;1,2045,1842;14,494,781;1,1891,206;11,2046,172;21,2047,233;14,24,49;23,534,2048;20,467;12,1166;10,467,83;22,1780;12,108,1024;12,108,488;11,2049,172;22,229;21,2050;12,470,24;12,108,610;20,2051;26,158,2052;25,566;7,2053;7,2054;29,1166;26,158,2055;20,2056;12,489,792;12,521,2057;25,2058;14,1059,489;25,25;14,521,884;21,2059;20,1780;12,695,2060;23,697,2061,122;23,2062,2063,122;20,2064;23,1333,808;27,736,10,221;11,2065,117;23,1333,2066;12,470,2067;1,2068,233;26,158,584;12,111,487;25,2069;26,276,2070;11,2071,93;1,2072,206;1,2073,206;11,2074,83;12,2075;12,527;14,24,781;25,2076;12,108,872;22,2077;20,2078;12,61,2079;1,2080,206;11,2081,172;11,2082,93;21,2083;32,188,79,1374;26,723,1680;26,10,2084;12,638,752;26,1071;25,2085;12,2086;12,97,1003;12,454,2026;11,2087,114;11,2088,114;26,10,2089;1,2090,231,221;11,2091,93;11,2092,10;26,1185,10,387,2093;28,2094;14,100,487;11,2095,77;11,2096,93;27,2097;31,132;12,518,782;21,2098;1,668;12,2099;12,100,513;7,284;39,2100,2101;1,2102,479,8;22,188,149,150;22,2103;21,2104;26,158,2105;23,2106,2107,122;11,2108,172;27,736;14,489,2109;22,2110;1,458,529;25,2111;29,2112;7,2113;12,470,2114;25,2115;21,2116;14,521,2117;27,2118;11,2119,114;12,202,2120;12,470,810;21,2121;27,2047;11,284,41;11,1017,41;25,2122;12,63,514;12,454,1987;12,521,2123;21,2124;12,513,1010;11,99,161;11,2125,41;22,2126;20,2127;11,2128,397;25,2129;25,2130;29,2131;21,2132;11,947,172;12,866,507;26,723,45;10,2133;26,2134,2007;12,826,2135;11,2136,172;21,2137;11,2138,41;11,2139,93;10,2140;28,284;25,2141;12,470,2142;25,2143;1,2144,206;29,2145;25,2146;28,2147;23,534,10,122;29,2148;26,438;11,2149,93;25,2150;12,108,661;12,521,2151;27,2152;12,527,2153;21,715,2154;1,1365,233;12,513,645;11,2155,93;25,2156;20,2157;26,276,2158;20,1353;25,1253;22,2159;25,2160;25,427;21,697;14,494,2161;25,2162;25,2163;12,1497,782;25,2164;31,782;12,100,2165;12,573,2166;12,396,1047;12,108,944;14,521,1498;25,2167;25,2168;12,470,2169;12,521,466;27,2170;12,2171,701;11,2172,93;12,2173;21,2174;31,810;20,1539;12,470,1424;14,521,2175;21,2176;12,2177,132;25,2178;11,2179,93;22,2180;19,2181,397,10,85,2182;22,434,2183;12,2184;11,2185,114;11,2186,172;1,2187,595;23,697,2188,122;26,723,683;7,2189;12,2190,1122;21,186,744;27,1030;29,870;11,2191,179;12,2192;26,276,2193;11,782,41;12,521,872;21,10,91;21,598;1,6,233;22,2194;19,2195,83,172,85,598;11,2097,83;10,2196;25,2148;29,1802;12,108,2197;11,1212,10;11,2198,93;7,2199;2,1854,10,1,2200;2,2201,2202,1,2200;38,2203,10,2204;38,2205,10,2206;12,26,2207;26,276,2208;26,158,132;20,1319;20,2209;26,10,100;26,723,2210;11,2211,83;20,2212;25,533;12,45,2213;21,657;28,2214;12,470,2215;12,521,1095;23,697,2216;21,2047;11,2217,83;27,668,206,221;21,2218;21,2219,283;10,2220;23,1333,2221;23,1333,2222;12,2129;11,2223,93;11,2224,83;7,2225;14,847;22,2226;23,2227,2228;23,2227,2229;23,2227,2230;23,2227,2231;26,158,587;26,158,516;26,10,916;28,2232;26,10,2232;26,10,2233;11,2234,41;29,2235;14,470,2236;11,2237,172;22,2238;7,2239;7,2240;21,2241;11,2242,83;12,2243,782;26,10,1152;31,2244;19,111,83,172,85,132;21,813,283;22,2245;11,2246,172;11,893,172;28,1198;11,2247,114;12,913;22,2248;23,1333,2249;11,2250,114;29,2251;21,182;11,2252,117;26,276,2253;11,2254,93;11,2255,172;11,2256,114;1,2257,231;29,2258;26,816,895;25,2259;19,137,83,2260,85,2261;27,862,10,221;20,2262;21,1829;12,2263;25,1351;26,723,2264;11,2265,2266;23,682,2267,122;23,697,2268,122;22,2269;22,2270;12,454,1152;21,2271;21,276;12,573,97;5,2272,2273,2274;21,2275;11,2276,93;35,2277;21,2278;21,2279;10,2280;14,521,2281;26,10,2282;12,470,2283;28,2284;12,470,979;21,466;21,2285;21,2286;12,454,182;22,2287;11,824,83;11,2288,172;13,866,2289;14,826,2041;14,1734,49;14,1494,810;7,2290;7,2291;12,555;21,2292;7,2293;31,2294;12,1802;21,2295;12,521,2296;39,2297,2298;12,1104,1949;11,2299,114;11,2300,114;10,2301;27,2302;31,513;11,2303,93;12,45,2304;1,2305,2306,8;21,1198,880;11,2307,114;11,2308,93;22,2309;11,971,172;7,2310;22,2311;29,848;26,723,2312;11,2313,117;26,723,188;11,2314,114;31,1163;27,2315;42,2316,83,2317;19,2318,83,2319,85,2320;1,2321,206;27,2322,206;21,2323;12,521,496;11,2324,114;26,158,782;29,2325;29,2326;7,2327;29,2129;12,470,542;21,2328;21,1198,821;25,2329;27,2330,206,8;21,452;14,45,2331;21,2332;11,2333,172;19,521,83,2334,85,2335;12,521,276;11,2058,172;26,723,2336;11,2337,93;14,111,2338;12,513,24;26,276,2339;10,2340;21,2341;23,534,2342,559;10,2343;23,489,2344;21,645;14,61,2345;25,2346;23,534,2347;26,1071,2348;21,2349;11,2350,117;26,723,2351;21,2352;21,1195;21,2353;26,158,1163;14,45,866;22,2354,2355;21,2356;21,2357;11,2358,83;11,2359,93;21,519;12,826,2360;14,2361,2362;25,2363;29,617;11,830,93;29,2364;11,2365,2154;27,487,206,8;12,2366,438;14,2367,2368;26,158,108;28,884;11,868,172;14,979,2369;21,2370;12,518,1169;25,1396;21,2371;25,1293;29,2372;29,2373;23,697,2374;7,2375;25,2376;17,439,2377;11,2378,93;17,2379,2380;13,2181,2381;27,736,479,8;11,2382,41;11,2383,41;11,2384,41;1,2385,206;20,2386;11,2387,397;11,2388,397;21,2389;12,638,470;21,610;14,521,810;23,534,2390;11,2391,83;29,2392;10,2393,397;26,723,2394;11,2395,83;21,2396;21,2397;15,2398;21,2258;11,2399,172;21,2400;11,2401,93;21,2402,2403;11,2404,77;11,2405,77;22,2406;26,276,2407;21,2408;21,99;11,2409,744;25,2410;25,367;11,2411,2412;21,2413;21,2414;11,2415,172;20,2416;29,736;12,111,132;12,44,487;12,108,2417;29,2418;28,2419;11,2420,172;11,2421,77;43,2422,1065,2423;43,2424,1065,2423;7,2425;2,2425,10,1,2426;22,2427;2,2194,10,1,2428;11,2429,114;11,2430,114;11,2431,114;2,2432,10,1,2200;3,2432,10,1,2200;38,2433,10,2204;21,1891,710;26,276,2434;28,2435;14,507,2436;14,494,470;31,2437;22,2438;26,723,1879;15,467;11,152,186;7,2439;20,2440;5,2441,2442;39,2443,2444;11,2445,2266;11,2446,172;12,454,2447;26,158,2448;11,2449,2450;26,276,2451;7,2452;19,2453,83,41,85,2454;25,2455;11,2456,172;26,640,2457;12,507,2458;12,826,872;14,521,610;1,2459,206;27,2460,206;11,2461,114;23,534,2462,122;26,276,2463;22,2464;11,2465,172;26,158,6;11,2076,172;21,2466;26,158,166;12,521,2467;23,534,2468;29,2469;31,516;29,2158;11,2470,114;11,2471,114;7,2472;2,2472,10,1,2473;12,527,2474;26,1029;11,2475,172;21,1741;11,2476,114;11,899,10;27,458,479,8;12,1384;11,2477,83;1,2478;21,2479;21,2480;21,2481;38,2482,2483,1690;7,2484,2485;25,2486;12,2487;2,2488;7,2488;28,901;12,518,24;11,2489,77;27,2490;22,2491;2,2492,10,1,2493;38,2494,10,2495;7,2496;11,2497,161;12,527,2498;25,2499;12,470,782;12,728,1038;12,2500;21,2501;23,682,2502,122;23,697,2503,122;14,489,2504;11,2505,93;11,2506,179;4,2507,2508,2509;11,2510,83;11,2511,83;11,2512,397;11,2513,10;21,2514;14,61,2515;25,2516;26,158,2270;22,2517,2518;23,697,2519,122;12,521,42;13,24,2520;14,111,2521;20,2522;20,2226,2523;11,2524,41;3,2525,10,1,2526;3,2527,10,1,2528;3,2529,10,1,2530;3,2531,10,1,2532;3,2533,10,1,2534;11,2535,2266;21,777;11,2346,114;29,2076;11,2536,172;29,2537;11,2538,83;12,518,2539;22,746,149,150;12,24,132;21,2540;22,2541,149,1374;26,723,2542;12,1376;12,470,2543;1,2412,206,8;20,2544;29,2545;22,2546;11,2547,172;11,2548,114;38,2549,10,1690;21,2550;29,152;12,826,2551;27,1907;21,1429;1,2552,479,8;29,1147;27,10,479,8;1,668,206,8;12,470,2553;26,158,284;20,746,149;28,2554;12,42,1517;11,2555,114;26,276,2556;21,2557;1,2558,1339;22,2559;23,697,2560,122;10,2561;28,2562;22,2563;21,10,2564;21,2565;2,2566,10,1,2567;12,527,2568;11,2569,10;26,276,6,387,2570;20,2571;22,2571;1,769,206;21,759,83;25,2572;12,26,43;11,2573,93;12,470,2479;11,2574,93;20,2575;26,640,979;20,2576;22,2576;20,2577;7,2578;7,2579;21,2580;27,2581;22,2582,149,1374;14,45,2583;11,1401,172;22,2584;11,2585,172;11,1408,93;11,2586,93;11,2587,83;11,2588,93;11,2589,172;22,2590;7,206,2591;22,2592;38,2593,10,2594;11,548,172;11,2595,117;12,470,534;22,2596,2597;11,2598,172;26,276,813;12,470,2599;2,2472,10,1,2600;11,2601,41;11,2602,83;7,2603,429;11,2604,2605;14,454,2606;21,2607;21,2608;25,2609;11,2610,93;11,2611,397;11,2612,114;12,470,1029;44;26,10,1711;14,826,1163;12,866,487;12,26,2613;31,2614;21,2615;25,2616;20,434,149;27,2617,479;1,668,206;21,1187,595;7,2618;11,2619,172;27,1907,206,221;27,668,206;12,470,2620;12,527,884;12,1141,2621;14,24,2622;11,1758,172;21,2623;26,276,2624;25,1880;21,1220;11,2625,117;19,108,83,186,85,2626;26,158,2627;28,2628;21,1746;12,454,1722;11,2629,93;31,514;7,2630;21,2631;14,396,781;11,2632,93;20,2633;11,2634,172;19,108,83,186,85,1152;22,188,2635;12,108,2294,2636;12,826,2637;21,2638;11,2639,161;29,2640;11,2641,83;10,2642;26,276,979;21,2643;25,2644;11,2645,397;7,2646;11,2647,93;22,188,10,150;1,1907,479,8;12,454,2648;7,2649;7,2650;7,2651;12,1141,2652;22,2653;21,2654;21,2655;21,2656,710;21,2657;26,723,2658;26,720,2659;7,2660;7,2661;7,2662;5,2663,10,2664;5,2665,10,2666;5,2667,10,2668;5,2669,10,2668;5,2670,10,2671;5,2672,10,2673;2,2674,10,1,2675;12,521,43;1,1030;2,2676,10,1,2677;11,2678,172;11,2679,83;18,2680,142,2681,85,2682;11,2683,2684;11,2537,172;12,1141,2685;11,2686,172;19,111,83,109,85,2687;26,158,2688;11,2689,2690;21,2691;21,2692;22,2693;2,2694,10,1,2695;21,2336;4,2696,10,2444;21,2697;14,108,2698;11,2699,10;35,2700;20,2701;27,2702,10,8;11,2703,41;11,1243,41;2,2704,10,1,2705;22,2706;10,2707;12,1890,2708;12,518,1879;12,1497,2709;21,1879;21,40;11,2710,114;11,2711,83;21,2712;12,349,132;26,276,2713,387,2714;39,2715,2444;11,2716,41;22,2717;29,1401;2,2718,10,1,2719;34,2720,1,2721;4,2722,10,2444;11,1017;2,2723,10,1,2724;26,276,2725;12,108,2726;10,2727;21,521;23,534,2728,559;23,534,2729,559;23,534,2730,559;26,276,967;26,723,2731;12,826,2732;25,2070;7,2733;17,2734,2735;25,2736;12,108,2737;22,2738;11,2739,41;26,158,2740;11,2741,114;45,2742;11,2743,41;21,2744;11,2745,2746;16,2747;10,2748;26,276,496;11,2749;7,2750;31,2751;7,2752;12,1016,2753;22,2754;11,2755,1367;28,598;10,2756;1,10,433,8;10,2757;12,61,2758;11,2759,114;17,2760,2761;23,534,2762;26,723,1199;21,2763;11,457,114;28,452;26,276,2764;25,2765;12,573,2766;10,1421,744,994;7,2767;7,2768;11,2769,93;26,276,2770;22,2771;14,521,2772;10,2773;12,1469,2774;28,59;14,521,2775;11,2776,77;14,108,49;11,2777,397;11,2778,397;22,2779;11,2780,77;25,2781;11,2782,172;12,61,108;26,723,542;10,2783;26,276,2784;10,2785;19,166,83,109,85,2786;19,166,83,2787,85,792;26,723,1998;7,2788;26,723,925;12,826,782;26,276,2789;12,826,813;2,2790,10,1,2791;22,2792,2793;2,2794,10,1,2795;22,2796;21,2797;18,45,2798,2799;18,45,2800,93;11,2801,172;12,489,979;11,922,172;24,934,2802;26,276,2803;21,2804;38,2805,10,2806;5,2807,10,2808;11,2809,41;12,2810;21,2811;29,2812;20,2813;25,2814;41,2815,1505;41,2816,2817;41,2818,2819;41,2820,2821;21,2822;20,2823;29,2824;22,1539;21,2825;14,1469,2826;25,1683;25,2758;22,1336,149;7,2827;7,2828;12,108,496;22,2829;12,826,517;11,2830,114;23,534,2831;39,2832,2444;20,2443;7,2833;25,2834;41,2835,2836;41,2837,2838;41,2839,2840;2,2841,10,1,2842;2,206,2843,1,2844;2,2845,10,1,2846;21,1065,595;11,2847,172;27,2848;1,2849,2850;21,2851;12,470,2852;11,2853,93;19,166,83,2854,85,2855;23,2856,2857,122;1,10,10,83;11,2858,77;11,2859,172;11,2860,172;12,2861;11,2862,172;11,2863,172;11,2864,161;2,2865,2866,1,2867;2,2865,2868,1,2867;2,2869,10,1,2867;7,2869;7,2865,2866;7,2865,2868;38,2870,2871,1690;12,97,523;26,276,2872;11,2873,114;11,2874,186;11,2875,114;11,2876,77;25,2877;29,2878;1,2879,206;21,2880,880;11,2881,114;26,2882,487;11,2883,172;29,2884;29,2885;7,2886;38,2887,2888,1690;38,2889,2890,1690;38,2891,10,1690;11,2892,397;11,1147,397;12,521,2893;32,2194,2894;29,2895;21,132,595;12,521,2896;3,2897,10,1,12;36,2898,2899;11,2900,77;12,108,438;20,2901;7,2902;11,1816,83;11,2903,172;11,2904,93;13,2905,2906;12,1169,2907;12,521,879;17,2908,2909;5,2910,2911,2912;5,2913,2914,2912;23,534,2347,122;23,534,2915,122;12,470,2916;17,1996,2917;20,2918,149;11,916,172;26,803,466;22,2919;12,24,438;11,2920,10;12,521,2921;10,631,397;11,738,172;22,2922;11,2923,117;12,826,979;26,723,2924;12,521,1118;11,2925,77;11,2926,172;11,545,41;12,1141,810;12,470,2927;21,2928;12,111,2258;21,10,2929;21,2930;28,2930;15,2931;26,720,2932;11,2933,77;11,2934,179;21,6,2935;21,1199;31,1991;28,2059;31,2059;11,2936,172;12,59;21,45,2937;11,2938,172;14,1141,2939;26,723,610;22,746,149,1374;1,2102,10,221;12,521,2940;13,2941,2942,157;14,521,2943;31,1680;11,2944,172;43,2945,2047,1058;14,521,489;14,587,2946;7,2947;21,2948;14,2949,2950;10,631,2951;12,2952,1511;12,527,2953;10,2954;22,188,2955;11,2956,93;11,2957,93;12,470,2958;11,2959,172;12,61,496;11,2960,172;26,723,1104;21,1453;21,1879,880;12,1369,466;21,2961;26,720,1029;22,2962;12,521,2963;21,516;14,45,2964;22,2965;11,182,179;13,2905,2906,48,2966;32,188,2967;21,2968;21,10,433;27,2969,479,2970;11,2971,93;21,2972;26,276,2973;11,2974,83;2,206,2975,1,2976;19,2318,83,2977,85,2978;26,723,2979;26,276,2980;11,2981,114;10,2982;25,2983;25,2984;25,2985;25,2986;25,1891;25,2987;11,2585,41;25,1000;25,2988;12,826,2989;23,534,2990,559;21,2991;10,2992,397;22,2993;19,496,397,2994;11,2995,93;26,723,868;14,573,2996;12,166,979;26,723,2997;26,723,2998;21,2998;11,851,114;26,723,1036;11,2999,41;11,3000,117;21,3001;17,1621,3002;24,934,3003;20,3004;11,3005,114;11,3006,114;11,3007,77;11,3008,77;31,188;25,3009;22,3010;21,188;26,158,542;12,521,1029;20,3011;26,158,3012;34,3013,1,3014;34,3015,10,1,1692;34,3016,1,1692;1,3017,206;21,1426;27,3018,479,8;26,276,3019;12,826,132;7,3020;21,3021;26,3022,768;28,3023;21,3024;29,3025;26,723,3026;22,3027;10,3028;21,3029;11,3030;7,3031;10,3032;10,3033;26,723,3034;31,1029;21,3035;22,3036;20,3036;2,2194,10,1,3037;3,2194,10,1,3037;7,2515,3038;26,723,202;7,3039;22,3040;11,3041,93;11,3042,172;11,3043,93;38,3044,10,3045;11,3046,114;3,3047,10,1,3048;36,3049,1,3050;26,276,701;12,830;11,3051,114;11,3052;11,3053;34,3054,1,3055;21,3056;26,723,3057;11,3058,172;26,276,697;12,1369,884;21,3059;12,826,3060;26,1710,487;26,951,1891;21,3061;10,3062;21,3063;34,3064,1,3065;12,61,1187;11,3066,172;26,276,3067;21,204;21,3068;12,518,3069;12,826,3069;21,2349,479;10,3070;7,206,3071;31,944;26,158,3072;21,3073;36,3074,1,3075;10,3076;10,3077;31,3078;22,3079;22,3080;10,3081;12,202,496;11,3082,117;22,3083;21,3084;21,3085;19,3086,1722,10,85,3087;8,3088;8,3089;40,3089,1,3090;17,3091,3092;11,3093,114;11,3094,114;11,1130,114;11,3095,114;11,3096,93;28,3097;25,3098;11,3099,10;26,1071,3100;11,3101,41;11,1545,41;25,2145;26,10,3102;25,2883;26,276,3103;11,3104,77;14,573,3105;34,3106,1,3107;24,1620,3108;1,3109,206,8;7,3110;10,3111;11,3112,172;37,3113,1,3114;20,3115,149;26,720,3116;21,3117;26,276,3118;12,521,3119;21,10,3120;21,3121;11,3122,172;11,3123,172;22,3124;20,3124;26,276,3125;35,3126;21,3127;26,276,842;28,496;28,3128;21,3128;40,3129,1,3130;23,884,3131,122;12,1369,496;11,3132,41;28,3133;21,3134;11,3135,114;11,3136,114;11,3137;35,3138;31,517;27,1983,206;12,871,3139;20,3140;21,3141;10,3142;26,276,3143;2,3144,10,1,3145;26,723,3146;21,3147;21,3148;11,3149,41;11,3150,41;11,3151,93;19,111,83,3152,85,284;11,3153,114;19,108,83,1447,85,3154;3,3155,10,1,31;36,3156,1,31;17,3157,3158;11,3159,41;11,3160,172;28,1187;26,276,3161;25,3162;10,3163;12,572,645;26,158,3164;22,1970;35,3165;1,3166,233,8;20,3167;12,61,3168;1,3169,206;3,3170,10,1,3171;19,126,83,3152,85,2376;35,3172;35,3173;34,3174,1,3175;2,3176,10,1,3175;19,108,83,1447,85,3177;12,826,3178;20,188,3179;12,61,487;21,3180;26,723,3181;21,3182;19,521,83,2334,85,3183;26,3184;22,3185;2,3186,10,1,3187;22,3188;14,3189,3190;21,3191;21,3192;28,3193;26,1344,3194;43,3195,2047,1058;20,3196;7,3197;7,3198;20,3199;11,3200,172;12,521,3201;25,3202;29,3203;14,572,1060;22,3204;11,3205,41;11,1895,41;31,3206;11,3207,114;20,3208;25,2190;20,3209;20,3210;11,3211,172;7,3212;26,10,3213;11,3214,172;19,3215,83,84,85,3216;26,10,528;20,3217;11,3218,10;7,3219;11,3220,179;15,3221;11,3222,77;11,3223,77;20,3224;11,3225,77;19,1659,1297,3226,85,3227;20,3228;22,3229;11,3230,172;11,3231,172;14,3232,61;22,3233;23,3234,3235,122;20,3236;20,3237;20,3238;23,534,3239,559;11,3240,172;22,3241;46,3242,1,3243;29,3244;11,2515,93;22,3245;11,3246,77;22,3247;20,3248;20,3249;25,44;25,3250;29,3251;28,3252;14,3253,3254;20,3255;22,3256;22,3257;22,3258;22,3259;20,3260;20,3261;20,3262;11,3263,172;22,3264;22,3265;20,3266;22,3267;22,3268;22,3269;20,3270;22,3271;20,3272;28,24;28,2931;34,3273,1,3274;19,2318,83,3275,85,3276;34,3277,1,3278;34,3279,1,3278";

const $scriptletArglistRefs$ = /* 13436 */ "396;1002,1706;1704;122;1534;31;104;452,597;31,461;2942;447,461,763,1100,1101;1651;1106,2119;1706;1276,2527,2528;31,447,448,449;1707,2192;1651;31,1471;1651;1651;1651;2770;3429,3430;33,379,486,493,1999;410,2725,2726;396,486;1955;1350;538,1708;1651;3207;1028;2113;419,1651,1816;122;510,1101,1167;916;1651;1651;1651;2770;1651;3016,3017,3018,3019,3020;31;31,379,430,434,435,436,437,1706;461,970,971,972,973,974,975;1651;2966;1002;379;1704;461,699;653;3223,3224;1706;1002;1893;31,379,461,1708;376;117,118;31,2392;1802;122;403;122;403,430,564,803;117,417;461,1941;1963,1964,1965,1966;201,718;1471;3838;1002;364;1651;31;31,422,1002,1707,1844,1845;447,461,763,1193,1705;3595;31,486;1802;31,763,1194;31,367,379;608,699;1651;376;947,1266;141,153,550,690,1802;2758;1345;1651;31;33,1709;1651;396,403,461,509,763,1378;122;33,34,395;228,229;2487;3505;34;640,1729;33,640,3716,3717,3718;1534;1707,2192;1837,3552;1707,2192;1710,2867;403,428,429,1704;141;1141,3595;1651;662;486;31,1048;2244;3641;376;1651;1890;117;117;1651;1891;1651;1345;31,3745;1651;31,461,1002,1546,1547;31,117,461,1533,1534,1535,1536;601;396,403,461;1707;379,396,635;31,430,1534;807;1651;31;1894;1651;2870;461;1273,1651,2600;1651;31,32,33,34,1846;735;3788;1651;1401;379,453,481;1651;1265;1184;1534;1002;2113,2114;1708;2124;31,117,461,1533,1534,1535,1536;1277;2210;1651;926,1662;31,379,760;31,1578,1585;1002;1651;2874;31,32,33,34;1052,1651;550;31,449,450,451,814;1651;152;1276;2224,2225,2226,2227;616;581;31,699,2540;31;31,422;3092;379,830;403;122;1471;905;3139;465;837;1106,1355;1809;1232;1708;31,396,461,552,596;1150,1188,1471,2651;454;2647,2648;601;404,1002,2744;31;786;1106,1436,1708,2266;31,3134;1592,2734;1776;1002;1803;1802;112;1802;3532;1802;373,374,1802;422,423;601,631,1675;384;117,1782,1783,2448;2248,3057;345,1272,1651;717,2452;403;2906,2907,2908,2909,2910,2911;417;134,2056;1651;34,601;1802;2126;1802;3191;2406;2417,2548,2616;1776;1380;31,422,1844,1845;31;390,603,823,824;1452;367;31,447,461,763,1193,1705;461,1191,1192,1706;3805;1503;385;1471;1706;3333;417,2477,2478;467,619;376,1651;141,153,376,550,624;1249;403,507,1002,1534;1269,1651;1345;1668;31,1329,1705;1534;31,776,1705;601,1278,2382;1706;1345;1341;1345;565;379,396,508,635,852;1204;1651;122;1783;1471;31,3103;1471;34,554,601;601;1820;1151;1151;1151;601;34;31,629,1256;574;424,1109;3217;1106,1642,2266;3223,3224,3570;295,296;462;379,462,486;3171,3172;2579;1651;1534;1651;2841;721,722;31,1471;461;3628;31,461;481,601,1187;858;601,1534,1675,2960;699;1651;1471,1472,1473,1474;3535,3536;1737;3741,3742;1534;1708;1002,1130,1131;1651,1802;1651;2074;117;31,837,1707,2150;1783;913,1705;1273,1651,1657;692;2902,2903;31,449,450;1651;134,711,2113,2340,2918,2919,2920,2921;1651;3428;1534;486;31,1603;2574;179,180;144,145,2541;403,462,486,863;122;379,396,635;31;-411,-2726,-2727;31;31,412,486,585,635,717,758,773;3338;3525;1331;1776;31,792;789,1180,1651;34;1471;523,1119;554;1776;1304;1651;31;428;31,1002,1707,1719;486,1534,1707;1651;2026,2027;486;1802;31,424,1711,1863;1002;1534;179;1802;461,1705;1434,1435;1737;31,430,468,469,470;485;2878,2879;1705,1706,1707,1710;1802,2668;1802,2668;3083,3084;31,33,608,926;31;789;1585;31,1706;601;31,55,56,57,58,59,60,1002,1534;470;379,396,486,635;1707;31,510,1167;34,601,3521;510,1101;1040;121;1925,1926,1927,1928,1929,1930;1110,1111;1705;134,3216;1783;409;1891;1737;1707;450,814;450,814;65,66,1268,1275,1651,1802,1812,2484;2290;398;384,1802;619,1196;376,1776;500;31;31;1651;122;1471;61,62;31,1002;2127;1534;1534;235,376;699,1707,1712,1853,2913;1471;1728;601,1687;1707;461,763;601,1588;1471;61,62;31,601;601,629,878;1802,3427;3757;1534;1002;486,552,3108,3110;662;1737;452;1106;31,461;1061;372;2925;1130;1286;475,601;1651;31;1355;1651;1651;640;34,141,601,2297,2298,2299,2300;1802;1820;1188;1540,1553,1554;2500,2501;601;31,486,1708;1471;1471;1651;376;68;31;601;376;1651;1704;792;31,601;507;1471;2793;34,601;1601,1622,1645;1601,1622,1645;1672;31;31,1737;461,1502,1503,1504,711;2833;839;1707;1737;31,1737,1738;1708;2633;31,461,1106;1165;1783,3803;31,3710,3711,3712,3713,3714,3715;31,486,1705,1707;417,1765;1254;1772;1603,2800,2801,2802;1471;507;3176;1651;3154;31,583;422;31,1534;31,55,56,58,59,60,1534;31;31,422,1002,1844,1845;481;1093;395,403;1254;3015;1802;1142,3595;1331;1471;103;33,1002;461;1704;31,1534,3130;640,1596,1597;31,412,608,699;486;2109;422,956;1706;1651;461,699;1002,1716;1704;345,386,1272,1652;3561,3562;845;417;667,1703;1707;31,1534,3130;379,736;1674;1534,3325;2990;403,2518;379;1002;1002;1345;370,371,372,1265,1651;1471;1651;117;2165;31,1708;462,1705;372;481,554,1032;1651;1651;3231;3231;1471;1835;31;2983;1799;1747;943;384;866;3396,3397,3398,3399,3400,3401,3402,3403,3404,3405;430;31,424,1109,1733;447;601;437;1885,3802;31,396,557,580,581;441,580;441,580;31,583;1802,1812;348;2157,2158;601,2860;1704;34;3796;601;31;1002;1707,2192;183;2325;31,1705;2593;2325;1802;2325;643;2325;2325;2325;600;31;1471;2325;61,62;61,62;1802;1650;134,1921,3859;673,1802;1651;122;403,461,763;31;407;723,724,725;606;1772;1503,2526;31,583;486;1737;3857;3736;31,2545;403,412,447,461,508;31,1857,1859;2729;1708;2382;117,2448;2340,2918;2770;31;430,1709;1705;61,62;461;1706;790;2724;117;2152;31;2880;348,1415,1416;376;31;1706;403;3787;2734;1502;601;507;412,486,1023,1024,1025,1707,1708;1820;31,583;396,403,461,486,596,863;736;564,1749,1750;2984,2985;671,672,1707;31,1706;988;1651,1802;31,480;395,601;462;31;61,62;1476,1477;1651;1708;379,396,1708;1651;1651;1651;1651;1651;1651;1651;1651;1651;1754;597,640,1601,1604,1609,1610,1611,1645;483;2734;2057;441;640,1601,1605,1606,1607,1608,1645;601,1471,1669,1670;601;424;2417;608,699;608,699;608,629,699,2274;608,699;417;1718;1490;1471;2683;440,1119,1120;1534;31,379,486,562,563,564,565,566,1704;507;122,1485,1486;965;1776;3804;983,993,2427;1642,3729;1651;1875;1651;1061;376,1266,1651;810,1551;31,424,1711,1863;662;1331;461,763;1802;34,422,523,554,601,2163,3434;1707;1706,1716;750;475;1651;1204;1707,2192;486,944;31;31,461,486,763;1046;1406;1270,3157;2930;1651;31;31;1706;34;1802;1734;1418;3326;81;1254;777,2631;31,461,763,1603;1088;1002;1534,1707;386;903;379;1706,1711;31,450;1712;1705;31,1375,1740;2138,2139;1802;31;430,1705;1709,1710;31,424,486,608,1002,1534,1705,1734,3055;1737;502,503;685,686,687,688;31;407,685,686,912,1534,1707;2439;2129;31,32,33,34,1846;141,153,1802;367;1960;1960;31;134;31,1197,2447,2453;1103;1665;1705;1534;559,1178;183;486;1975;1654;1799;689;1651;1875,3062,3064,3065,3066;3571,3572;1471;461;1216;2400;379,830;2683;31;61,62;950,951;601;601;601;31,699,1534,2540;3668,3669,3670;1226;408,430,619;601;1705;2387;117,830;424,1534,1737;61,62;462,867;1471;151,3201;379,1006;461;31,1534,3130;233,234,2246,2247,2248,2249;1499;122,455,456,457,458,459,460,461;424;31,3219,3600;2256;407,435,507,1002;1534;61,62,1534;1709;61,62;1002;902,2159;141,894,899,900;618,619;3428;31,481;31,1706;440,472;1471;1375,1376;61,62;699,1002;61,62;554;31;31,1002,1534,1999,2057;1002;1324;31;31,1706;656;3109;417;1746;111,3754;724,3095,3096,3097,3098;461,508,763,1708;31;31,396,461,1705;461,763;792,1505;2641;3617;403,492;1799;3816;376;1802;1534;1706;379;2195;581,937,1294,1534;640;34;1978;31,2535;640;31;640;1471;1705;3270;1534;1969;1421;3642;390;1715;407,1022,1706;1707;122,1485,1487;2163;601;372,1345,1471;632;122;950,951;440,594;31,1534;1706;413,415;31,1160,1534;1704;1721;403,461;1651;1982;1471;1471;509,1705;1651;403,987;1318;3075,3076;3860;1651;2787;61,62;748,873;417;3339;1040,1041,1042,1043;348,1746;31,2810;667,962,3383;3344,3345;1802;1708;486;31,34,1534;1382;792,1505;601;1182;595,617;1052,1651;635,1103,1704;461,699;792;1534,1707;1707;3428;1651;694;763,911;461,763;1603,2800,2801;449;31,422,1002,1844,1845;31,422,1002,1844,1845;424;1471;903;3051;396;1705;1651;31;1471;61,62;601;31,422,1002,1844,1845;31,422,1534,1844,1845;2845;1002;31;31,422,1534,1844,1845;1534;1802;1018,1288;31;366;31;1471;601;2447;33,1767,1768;600;640;1783;1753;403,597,741;122;1002;1717;386,1651;31,1002,2567,3128,3129;1689;1002;1002;1534;409;3075;475;594,2533,2534;601;1705;117,3441;376;461,1477,1502,1503,1504,711;1886;409;31,1534,2612,3130;601;2316;463;601;1002,1707;31;1100;561;386;601;1534;831,832,1534;31,1593;1706;711;31,1002,2567,3128,3129;1534;1705;1737;1471;1706;1709;2126;31,32,699,1707,3069;461;2488;244,245;2220;474,1776;2393;1534,1669;491,601;2085,2086;441,557,581,601;1471;395,403;31;1471;1471;619;523,554,601;523,554,1871;1708;2990;408,410,777,1687,3603;1534;1734,1736;1471;1707;3438;1251;1471;1706,1707;3651;3650,3651,3652;31;440,601;31;1712;1254;1534,3352,3353,3354,3355;461,1445;1471;931,932;61,62;1471;3407,3408;892;1471;117;31,441,601;1534,1708;687;31,699,1002,1534;2823,2824;1705;792;31,1002,2567,3128,3129;601;1707;1471;1534;591;34,403,1673;61,62;1534;1534;1651;1471;1394;1706;1204;1106;601;31,1707;991;2250;819;31;1534;1471;1278;817;438;1706;2291;462;31,396,557,581,582;31,396,580,582,815;31,396,557,580,581,582,583;2184,2185,3809;31,396,557,580,581;1749;1651;786;1251;390;2977,2978;2267,2268,2981;409;31;1705;1651;35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54;601;554,601,1471;601,1249,1350;2558;34,554;34,583;601;34,554;3566;34,1747;601;3748;554;486;31,1705;409;1471;1188;31,956,1058,1603,3078;31,1705;606;1707,2192;1707,2192;205,345,1651,1653;31,608,1002;601,1675;34,601,1707,2163;1002;601,1471,1901,3141;1901,3613;61,62;31;61,62;1651;992;667;1802;367;461;462;475,601;31,486;1471;723,724,725;3447,3448;403;1808;1705;1776;1216;2398;114,115,117,118;1071;31,1534;379,698,699,814;96,97,98,99,3689;1802;1219;379,3106;601;1039;1534,1669;1247;31,33,412,608,699,926;2595,2596;372;1471;31,955,1708;419,1651;1651;583,2358,2359,2360,2361;1534;81;31,554,629,874,1878;461,763;1139;31,1858,1859;379,1706;1706;1002,1534,3287;376;786;226,227;1471;601;390;396;630;1705;31;31,484;601;2965;1471;2611;1799,2050;1070,1651;1109,3506;608;34,562,3125;1707;1471;1651;601;1002;3454;1706;1471;3843;117;1534;2163,2447;1891;31,3600;31;2814;1471;1975;1776;1708;1879,1884;1471;376,1802;507;31,379,1168,1706;1471;1254;408,475,601;31;1471;2327;3705,3706;1002;1799;601;2020;1772;626,947,1651;31,1103,1710;1471;1651;1251;31;1799,1802;601;1534;1904,3432,3433;31,1705,1706,1707;1471;34;601;601;31;475,601;470,749,1136,1137,1138;403;31;581;601;31;259;1651;396;1242;31;1471;2333;2786;601;461;1218;810;1651;3538;1709;2989;1492,3544,3548,3549;31,470,749;1668;31,462;554;520;2174;1564,1565,1566;3351;3227,3228;348;3444,3445,3446;1967;31,1499;461,763;1651;1707;1708;1675;2245;1802;3026,3027;1002;608,699;608,699;807;372,601,857;133;3527;3070,3071;1706;461,699;601;601;31,3566,3567,3568,3569;1471;1706;1802;1471;2734;31,486,763,1194,1704;640,2441,2720,2721;1094;461,763,1544;403,551;1471;552;1534;658,659,660;1712;511,1185;789;1713;1534;346,1651;833;417;2777;810,1551;250,1571,1572;31;31,1534,3457;31,1534;31,424,1711,1863,1864,1865;3848;3726;981;34;1059,1993;1651;1705,1706,1707;379,552;968;554;1446;950,951;1464;461,1639;1254;1368;1150;511,512,2229;1959;31,2912;1345;1773;31,1002;34,601,2095;31,122,564,1706;601;379,407;447;1475,1476,1477;61,62;223,224;1696;601;640,3257,3258;1278;999;1651;1350;422,581,601;81;950,951;31;1471;1193;472,1011,1012;1389;601;1651;1712;640,1856,3755;1708;1821;1359;422,601;1204,1663,1664;1705,1712;2252;404;574,1704;1471;403,548;31,564;31;61,62;1708;2587;936;386,389;31;31,34,1534,3700;31,34,92,1534,3700;1705;31,34,422,1534,1844,1845;31,33,412,608,699,776,926;1669,1737;31,927,928;3390;1737;1534;1651;403,461,763,764,765;31,1534,2575;461;31,840;1471;437,686,1109;461,830;1737;31;1299;-1376,-1377;1252;2882;3836;1746;31;1002,1107;1471;1267;1705;31;808,1477,1479,1480,1483;3388,3389;117;409,2189;1471;1471;34,1668;422,581;3361;2683;3765;475,1220;441;61,62;817;403;601;619,1196;3070,3071;1708;929;31,408;2224,2225,2226,2227;1471;581;601;601;31;31;1705;1807;1458,1471,1550;1708;3391;31,449,450;470;1707;31;792;1705;1002;1255;1783;2303;2789,3800;3799;1534;608;1853;1602,1603,1645;540;608;1707;33;31,776,1281;1002;256,257,1599,1899;31,1647,1746;514;2411;2068;1705,1707;1708;31;699,1708,2328;31,1002;1471;1471;552,1707;1767,1768;1471;1001;1002;1534,1562;1651;962;601;540;31,3600;786,2087;1706;1002,1534;408,441,557;601;31;3631;31,1534;470;1534;417;1002,1706;1651;31;481,1706,2057;31,3327;1140;724,3095,3096,3097,3098;31,2642,2643;417,461,554,601,1002,1534,1996,3093,3094;1323;3667;699;1705;31,422,1534,1844,1845;31;3744;330,331;1471;777;34;1471;31,1706;2531;607,1534;379;1706;1705;31,554,1534;1534,3352,3353,3354,3355;1002;2387;1471;747,748;1534;554;1651;33,440,462,475,564,816;372,2318;417,1427,2511;1706,1707;430,1718;3860;3860;3860;3860;3860;3860;601,1734;1651;2515;950,951;711;554,601;1708;1002;412,1025,1707;407;2951,2952;1534;3566;1471;601;1471;1673,3703,3704;462;2264;1706;3160;2583;979;461;601;1471;484;481,1709,2057;1471;31;939,940;31,1375,1740;601;1254;1513;1188,1471;601;1891;737;2467;31,441,601;34;1471,1767,1768;1471;1802;507;1707;430;117,417,2611,3283;1802;470;1776;1471;619,874,962,1043,1196,1694;511;619,874,876,962,1043,1196,1694;462;1802;947;1802;1471;1651;1809;1109,3506;537,538,539,1708;968;601;1767,1768;1802;3428;31,635;83,117,2842,3008,3010,3011,3012,3013,3015;711,1642;3759;679;1123;2617;962,2334;786;277;1471;2742;417,1765;1651;1331,1471;1471;1216;1707,2376;3624;1705;396;601;1139;2397;601;31;462,739,740,1708;461,1502,1503,1504,711;461,1502,1503,1504,711;388;31,422,1002,1844,1845;31;2715,2716,2717,2718;1471;404,817;31;601;1270,1651;538,539,1708;1393;117;2734;-32,-1535,-1725,-1726,-1727;117;1564,1565,1566;661;1802;759;763,1708;554;601;935;376;1707,1737;624;117;1103,1231;1642;2889;1712,2395;1802;1216;1706;2914;1048;763;763,1318,1708;461;326;511;600;601;2927;1707;1247;33;31,1375,1740;2617;3115,3116;1439;1706;403,486;475;2550;440;1321;1746;1471;461,1502,1503,1504,711;461,1502,1503,1504,711;1651;407;1705,1706,1707,1708;486;2126;1708;1335;461;1651;172,173,1314,1802;31;507;33,34;601;74,1471,2704;-32,-33,-34,-35,-1847;991;1706;1705,1706,1707,1708;538,539,1708;31,1237;1471;1229;1359;2751,2752;31;31,601,991,1534,1707,2564,2565,2567,3130;31,33,601;640;601;1002;1548;1705;3025;1534;1002;1706;1710;31;1651;1471;1802;1974;1668;3604;1002;1002;1534,3276;1651;601;1708;1651;3495;1254;3789;31;122,461,574;1067;1705;1705;3070,3071;31,1195;1471;601;505,630,684;1106,1708,2119;559,2159;1446,1471;1471;1651;1802;657;678;687;31;31;1630;1706;1802;537,538,539,1708;3428;1106,2275;1642;1041;2525;1471;1471;3464;69,70,71,72,73;1802,1816;691;2135,2137;1002;777;2404;1254;1471;1776;1706;640;675;1705;1254;31,553,699,1002,1737;-32,-1110,-1535,-3620;1254;553;1254;1254;1254;1709;1471;379,742;3178;937;1651;2734;1651;31,2781,2782;1870;1278;1651;2627;601;1204;903;403,1002;464,465;33,1737;1002;1705;1802;1471;33,601;390;2997,2998;31,34;31;31;601;3151;1238;857;1534;1802;1708;1706,1707;470;601;1106;569,1452,1453;514;3743;3743;3743;1471;643;31,643,1646;3649;1709;1331;601;1471;1767,1768;687,2745;1668,1705;894;2156;564,1749,1750;34;564,1749,1750;2211;564,1749,1750;564,1749,1750;564,1749,1750;109;31;31;640;1471;1471;2460,2461;2743;1880;1704;1942;1799;1471;1471;1799;384;92;1127;1708;34;601;34,1747;608;601;601;601;1767,1768;601;3566;31;34,1747;601;31,33,34,3303,3304,3305;601,1471;3566;2260,2343,2344;601;34;645;608;601,1746;601,1351;601;601;34;523;462;601;601;34,554,735;3284;1771;1471;461;1706;1471;1651;601;1471;1746;554;1651;31;31;1706;2325;31;2325;2325;1216;601;31,601,1002,2567;1471;792,2021;1642;1707,2192;1707,2192;1707,2192;404;1785;995;996;379;2325;1707,2192;2325;1562;1651;846;1471;113;601;601;2325;1459,1460,1461;1471;199,200;1776;554;3276,3559;122;1705,1706;31;2130;1471;1886,3802;2618;462;1471;2562,2563;461,763,2217,2218;31;1708;1706;2632;1707;1802;1238;1705;379;1707,2616;1499;1471;1567;1254;31,2699;422;119,194;1651;1954;424,698;947,1651;3553;3616;314,315;34;34,554,1002,1707,2163;1705;1418;1254;2199;639;117;640;31,1534,3130;2734;1002;601;31;461,763,1256;1708;461,1555;3070,3071;1109,3506;640;1802;1802;3143;31,959;417,538,1130,1675,1685;31;1534;3386,3387;640;422;31,940,1854;2662,2663;662;2881;396,509;495;554,968;31,2153;31;520;1002,1706;31,1002,1471,1534,2169,2704;31,1705;31,509;31;1708;473;396;31;1776;1002;31,390,1258;1330;462;1362;3677;640,1645,1734,3677;1737;2732;2673;961;1799,1821;475,564;3623;372,1471;1897;1707;1705;1074;1708;1188,1251;1219;847,848;810,1551;1802;1534;1709;31;1310;376;880;1816;3503;885;31,585,635,717,758,773;1283;343,1658,1820;31,1534;1534;865;1471;1705,1706;2516,2517;1651;34;1705;1471;601,1471;31;31,1391;1471,2424;-32;2736;1651;601,1195;1471;2286;837,1706,1996;1710;1760;1591;384,3808;34;892;1471;898;475;1130;31;2191;417,1366,1471,1765;786;31;601;1767,1768;437;396;1651;1708;1705,2970,3079;1331;1320;640;792,1505;1471;2734;1794,1795,1796,1797,1838;496;486;1471;2329;1651;412,486,1023,1024,1025,1707,1708;1651;1503;422,581;1802;1802;1708;601;564,1749,1750;514,594,601,717;1471;-397,-404,-462,-487,-597,-864;1705;554;1651;640;1776;2733;117;384,1651;1736;1002;812;1503;34,554,1471;1471,1534;31,55,56,57,58,59,60,1002,1534;3245;1471,2963;1345;31,554,601;462;564,667,1220;31,486;601;31,395,519,520;601;581;475;601,878,2242;31,820;3251,3252;1673;408,486,554,601;486,601;487,488;31,396,412,3412,3413,3414,3415,3416;31,396,412,3412,3413,3414,3415,3416;31,396;31,396,412,3412,3413,3414,3415,3416;31,396,412,3412,3413,3414,3415,3416;1794,1795,1796,1797,1838;31;31,396,412,3412,3413,3414,3415,3416;31,396,412,3412,3413,3414,3415,3416;31,396,412,3412,3413,3414,3415,3416;31,396,412,3412,3413,3414,3415,3416;578,1440;1526;608;31,699,2123;736;1783,1792;1503,1651;2770;1155;1471;1673;1441,1442,1443,1444;763;1406;2302;1799,2716;1300;364,789,1786,1787,2862,3680,3681,3682;31,523,554,1737,2699;1500;384;554;1061,1471;601;1471;1142,3595;409;31;1002;1471;711;3564;411;3278;748;2549;1937;3566;1776;2734;601;394;34;1673;2042;31;1734;1002;409;1776;1162;1471;792,1505;1471;608,699;3372,3373,3374,3375,3376,3377,3378;1802,3621,3622;1099;409;1534;1706;1708;1188,1251;395;2625;601;962,1318;1380;554;601;601;601,2845;2222;31,122;31;1002,2003;2705;601;887;1794,1795,1796,1797,1838;403,412,461,763,1216,2110,2111;461,632;31,461,763,1029,1106;1471,1534,1628;379,403,447,461,569,763;461,763,1544;403,412,461;2199;441,1870;376;34,1676;1802;2232;461,763,1002,1552;779,780;417;3640;1534;1534,1705,1734;1471;1746;395;1503;1471;1296;1651;1651;1651;31;1709;2890,2891;372;2983;1534;1706;31,926;938;417,1765;31,424,1002,1863,1864,1865;31,608,699,2273;31,424,1711,1863,1864,1865;1471;1492,1493,1494,1495;2208;1794,1795,1796,1797,1838;1651;1257,1997;3204;34;1776;868;1446;884;31,390,827;1355;2088;462,601;1254;2238;1534;31,908,1710;379,635;1471;601;1705,1706,1707;687,2970;2619;1776;2592;640,3256,3258;1471;1117;587;379,407;430;403,408;540;2301;881;3578;759;475,631;667;1875;403;1599;2335;3080;34;407;1251;31,122;1471,2737;2734;384,1802;2308,2309;344,1272,1651;475,557;1706;3512;475;138;186,187,188,189,190;601,630,1706;1002;579,665;1534;117;1737;461,711,1502,1575;601;1712;31,1030,1704;31,569,2371;475;2016;34,1502,1534,1722;601;832,1706;577,1707;122,428;31,1705;31,430,2310;1002,1534;130;1471;1534;3798;31,1002;1712;1002;1712;1534;1776;1002;1534;461,1454;1534;403,461,763,1705;1628;1073;1853;1712;711,1642;31,462,509,552,608,662,814;1705;1705;711,830,3656;3236,3237,3238;1106,1254,1379;31,3516,3517,3518;608;1708;31,1704;31,422,1534,1844,1845;31,1534;640,2589;461;424,686,912,1707,1734;1754;912;31;486,3390;31,476;2564;3566;31,422,1534,1844,1845;31;662;1334;1534;403,1706;135;1534;117,2884;1705;1651;1130,2982;711,2340,2918,2919;31,523,554,1737,1873,2699;348,1589;2396;425;3208;31;1706;1734;31,437;3739,3740;1651,1802;1793;31,1534;3608,3609,3610,3611;523;514,601;395,581;122,712;3070,3071;3070,3071;3070,3071;3070,3071;2674;496;3639;950,951;31,553,621,1705;601;601;31,1471;422;462;601;31;601;601;34,462;462;957,2102;601;428;2845;950,951;2755;601;2560;601;403,1707;31;2734;462,1534,1707;403,1707;367,714,715;1471;1708;1706;31,1534,3130;412,601,1708,2068;475;640;1706;407;1254;1534;1186;601;31,1002,2567,3128,3129;31,955,956;1503;109,249;1002;1737;664,777,1645,1708;601;486,1002;1707;1118;2813;1705;1002,1534;486,776;403,1002;1254;601,1746;31,837;288;34;1002;858;1705;887;198,3312,3313;1471;31;601;1427;1464;1471;1651;1031,1704;1471;632;31;31,601,645;1251;1002;1471;609;1707;1002;2120;601;1707,1748;134,290;31,3455;798;3590;34,523;1471;403,632;776;1471;507;372;662;1554;640,1580,1601,1625,1645;966;1471;662;1471;372,1345,2734;619,1196;1706;1802;844;630;31;608,699;31,32,33,34,1846;640;630;950,951;31;34;1952;1708;417;403,417,428,429,1705,2081;601;1534;1534,3352,3353,3354,3355,3357;1707;122,1106;2235;608,1103;31,487,2683,2768;950,951;433;2048;1471;1978;1706;461,763;662;2233;662;585,635;1471;601;3750;1188;475;486;2734;1802;1767,1768;1229;31,33,486,608,925,926;523;1708;1706;31,486,1534;34;641;1188;396,481,794;1651;752,1651,1802;2770;117;1651;2009;1471;980;1251,1471;554;1471;1540,1553,1554;1417;2264,2265;1002;31;475;1651;558;432;475;1471;601;601;1704;1706;1002;422,581,601;117;31;3428;1188;2276;31;417,675,1106,2414;417,1251,1471;31;554;31;601;1794,1795,1796,1797,1838;662;1708;857,990,1188,1471,1480,1506,1507,1508,1509,1510;1802;1471;31;417,1188;601;3792,3793;1002;1747;1503;3164;711,1002,1645,1719,2347,2348,2349,2350;601;554,3747;31;1712;1266,1651;247,248;3728;662;808,1477,1478,1479,1481,1483,1484;117,417,2611;632;601,2433;1651;1651;1471;1706;424;117;1471;520,564,619,748,1185,2104;667;748;31,441,467,511,748,878,908,2104,2965,3679;902,1471;117,1783,2448;1705,1706,1707;1471;3723,3855,3856;376,1654;806,807;929;1716;3702;1916;1802;117;117;2107;2302;1708;1614,1641;640,1542,1543,1640;3249;1471;1644;372;1027;3465,3466;403,601;2664;930;34,2840,2841,2842;552,1704;554;538,539,1708;2541;122,379,422,556;122,1487,1511,1512;3068;372;117,2601;1802;1002;1254;1254;1534;417,1278;31,461;403,461,763;461,1502,1503,1504,711;31,461,486,556,763;1575;31,1534;31,379,486,701,2540;601,3588;34;3550;1471;1802;1471;3749;1548,1767,1768;396,709;348;122;1100;1778;1437;2785;31;3825;117,461,2337;1480,1514,1515;623;447;1471;2659;1109;1471;65,66,1798;1471;3439;1471;661,751;396;452,574;1705;379;1708;2475;461,763;31,422,1002,1844,1845;3147;3731,3732;31,34,601;1737;1534;31,396,461;517;1109;403;1480,2996;1008;122,414,416;826;554;1345;1651;1471;372;702;2323,2324;1534;1534;31,601,2567;1002;1534,1922;31,544,545,546;2044;403,461;447;647,648;601;31;441,475;1359;601;367;853;31,390,486;3039,3040;1673,1683;367;461;1471;1471;61;2817,2818,2819;2367;601;2555;1534;390,2376;2983;1534;1471;1802;1850,1851;1471,2052;1705;475;929,1602,1604,1645;1619;1534,3352,3353,3354,3355;1723;31;1714,3370,3371;608;1002;1707,2561,2697;640;908;31;968,1728,1729,2187;33,608;1002;31;31;31;31,940,1854;1982;81;3524;632;364;379;31,1503,3093;1534;1471;117;1534;1503;1776;750,1705;31;379;2691,2692;1471;403,1707;1672;417,1765,1766;950,951;1002;31,34;1977,2729;31,645;1002;711,1708,1734,2260;837;1471;597,837,1251,1645,1729,2797,2798,2799;1534,3276;1841,1842;1769;1651;1651;1085;1802,1820;1651;1802,2075;1355;514,874;601;191;1306;33;1651;2770;92,3764;31,475,581;447,1705;2945,2946;1651;1802;601;31;475;81;122,1485,1486;113;1802;3691;640,1541,1542,1543;31,1601,1645;1709;1254;1254;1002;1254;1217;789;1254;1707;1254;1471;31,32,552,553,554,1707;1254;1254;1471;871,1458,1471,1550;1254;1534;31;601;1707;1471;554;1906;403,784;1471;440,483,601;3205;1471;2471;1254;486,1708;1822;3517,3707,3708;31;117,654,655,656;662;292,293;410,3603;1651;604;1471;643,699;734;390,486;663;1705;601;440,471;1534;440,1119;2575;601;601;601;514;2938;1002,1534;1706;1737;1471;1471,1719;2923,2925,2926;1704;601;750;1471;601;1109,3506;554;31,34,601,3015;2504;441,908;117,2448;2701;601;601;601;31;31,2179;601;2846;1776;3743;-32,-644;1254;31;1027;656;31,1707;1254;554;661;2807;1471;1254;1642,3583,3584,3585,3586,3587;1705;31,608;1471,3184;1427;122;31;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;31,396,580,581;440,441,442,443,444,445;564,1749,1750;601,1584;2010;2486,2689,2690;396,422,486,585,635,738;1802;1802;1749;1175;409;1705;403,1707;1028;1802;376;632;1705,1706,1707;3428;447;950,951;950,951;950,951;1002,2784;601;348,523,601;395,408;34,523;523,601,1471;601;601;555,1673;601;409,601;34,1673;608;34;34;601;601;601;601;34;31;1471;372,2603;1103,1706;2181,2182,2183;113;1737;834;810,1551;1471;2088;1260;601;1471;1471;1534;1592;581;270,306;1471;601;1707,2192;1471,2049;1706;699;31,417,1705,1709;699,717;31;554,583;1705;783;1651;554;1982;1471;1298;403,404,1711;581;798;2325;1254;554;688;1130;1471;1820;384,1297;267;2106;372;2438;2540;1287;601;1990;1802;1471;2832;1704;1651;1706;1002,1471;1651;461;122,632;1534;403,461,504;404;403,1706;1705;1705;461,763,2125;1471;1651;1106;447,699,1705,2968;1705;31,395;2729;422;1130;31,33,1256,1534,1675,2960;31,1534,1675,1737,2960;31;3127;2269;31;31;1099;1424;2766;34;659;1471;1802;1707,2844;34,1707,2163;601,1705;819;554;523;408,601;117;601;1711;608;1534;1705;1986;640,1534;2458;1651;1294;948;31;1651;1706;2747;3829;508,1706;1534;1061,1471;1254;1002,3143;1471;461,763;486,860;640,3276;1705,1706,1707,1708;1471;31;601;92;1705;31;462;31,1002,2567,3128,3129;31;1219;1578;1002;3604;1534;31;1002;31;31,1707;31,486,1707;1708;31,1002,2704;1002;1707;1709;31,699,1002,1534;31;1708;1708;403,1707;1706;31,1002,1534;403,1708;1706;31,2365;1706;31;892;2146;1802;2263;1651;952;601;3677;376;2251;31,410,2776;1002;601;31;1041,2380;1471;2126;552;601;952;1109,3506;1705,1706,1707,1708;1708;789;837;2871,2872;31;34;31;34;3365,3366,3858;601,1767,1768;640;608;1651,1805;798,2531,2828,2829,2830,2831;1392;3205;1704;1705,1706,1707,1708;31,3409,3410,3411;1705,1706,1707,1708;2937;1455;494;1471;1471;2240;486;486,601;1345;1708;1077;34,1471;601;1254;31;1747;1361;1002;31;1002;31;550;1254;417,3597,3598,3599;81,117;87,88,89,90,1534;379;122,1710;640,1856,3755;1471;2816;1409;254,255;2731;1308;31;423;31,583;117,1491;3169;417,1765;1710;1866;3428;3808;117;1471;1471;662;1651;1802;2069;1471;452,461,508,811;1923;376;3690;403,1707;31,412,486,585,635,636,1721;1251;2108;31,1002;461,763,1709,1710;601;3242;601;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;1909;601;2407,2408;486,736;1375,1376;1471;564,1749,1750;1749,1750,1751;1707;1002;2468;2468;2468,2469;803;1705;1534;1271;1522;792;407,1707,1996;1767,1768;117,1783;1345;31,3835;31,601,645;601;601;601;601;1013;530,531;403,440,769,770;601;629;601;601;470;2688;601;31,408;601,1673;475,601;601;3494;462,601,869;556,667;601,916;601,792;475,601;601;34,601;601;31,494,581,1149,1150;31,407,1706,1707;31;31;31;1802;31;554,640,1705,3688;299;1651;613,614,615;601;1471;3453;411,412,509,1002,1534,1704;601;1638;33;117,2429;481,2326;1802;1002;3428;1170;554;1706,1738,2280;34,1737;554;1471;1651;1229;1776;3300,3301;3023;395;31,3600;1668;1668;514,601;461;570;1710;31;1710;601;1380;2258;1471;1651;916;1534;1651;798,2971;1471;1651;461;409;1705,1708;403,1707;1471;601;403;837;34,589,3349;34,589,1534,3349;1651;601;122;1803;1914;899,1246;1471;1651;587;417;424;1471;1651;682,1471;31,390,1729;31;403;608,699;608,699;2927;117;1471;1058;1776;2447;282;372;601;403,1253;1056;34,1091;1471;550;2477,3042;31;1708;662;422;422,554;467,2571;462;1687;601;601;462;508,2173;601;1002;1457;1002;3206;31,424,1002,1708,1865;403,461,486,1709;1471;1709;31,977,1705;403,1707;403,1707;711;3833;31,475;2667;404;122;1471;3579;1368;3773;1471;507,777;396;2880,2904,2905;3239;31,3392,3393,3394,3818,3819;31,408;1284;789;1651;2126;1707;452;1002;31,396,475,601;2486;1002,1705;31,1706;2049;1002;379,559;1645;31,396,412,494,564,926,3839;31,926,3684;31,424,1109,3506;1331;34,589,3349;1534;403,486;1534;1707;403,863;31,601,1002,2163;31;379,486;554,1534,3513,3514,3515;407,428,670;1866;601;1100;1673;1429;1471;1471;2302;409;1776;1651,1655;601;1065;1877,2041;428;3148;569;2044;1046;3638;2572;1471;1802;1471;1233;1471;122;465,2894;1651;540;977,1462,1463;977,1462,1463;1651;1366;1471;1288;3428;113;1794,1795,1796,1797,1838;2939,2940,2941;506;467;601;601;3801;3801;1821,3021;1802;2410;3168;514,547;31;910;117;601,1707;1737;278;31;1471;711,2340,2918,2919;1471;699,2372;601;601;1471;2728;1061;1471;2734;461;1439;675;514;1870;1204;2180;1866,1867;1279,1704;1158,1396;2290;1534;1651;640,3142;1534;2119;2004;402;-32,-33,-34,-35,-1535,-1847,3016,3017,3018,3019,3020;1254;31;1705,1706,1707,1708;31;3210;2869;1254;407;1471;1503,3060;461,711,1502,1575;748,2438;31,348,1002,1983;1002,1543,1706;34;963,2045,2123;1471;2313;33,403;1331;379,396,1122;1705,1706,1707;1254;768;1471;1776;31;31;31,1375,1740;1802;1125,1802;347;117;1708;1002;31,422;123;34,554;1709;1709;1706;364,1132,1133;1705;1002,1708;3469,3826;31;31,865,1249,2332;422,581,601;34;117;3498,3499;437,640,1109,3307,3308,3309;486;1712;1704;1002;1163;1002,1534;3360;3428;1765;1951;407,1534,1734;486,661;461;1706;31;1471;348,1331;291;1809;1002,1534,1737;486;122;31,552,635;1204;784,1980,1981;1190;1992;31,449;1087;1799;581,2281;1710;601;1109,1534,3506;3849,3850;31,3431;461,1996,2661;1783;1471;1651;640;1802;348;601;1106;447;1987;1708;1821;1651;1534;31;601;2546;1706;31,1471,3367;3379,3380,3381,3507;34;1945;1754;475,601;31;601;601,3117;2847;554,1870;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;878,962,2886,2965;1704;601,3232,3233,3234,3235;2384;523;601;461,1291;430,555,564,1708;2479;31,3058;601;950,951;950,951;31,1534;1706;3540;1471;31,379,486,1705,1707;1471;2345;699;1707;1471;403;17,-32,-1535;1534;31,2943;1706;2385,2386;1471;31;2683,2764;1645;882;134;1820;395,583,1668;1705,1719;664;1737;1471;553,699,1709;31,64;953;31,1534;1471;1464;1471;1705;1708;1737;699,1705;688,954;552,2123;2325;1007;1707;1687;379,533,534;1707;1707;1687;31,64;31,64;1707;31,1534,3130;601;837;3307;601;31,1534;31;1651;31,64;3557;430,1002;1002;31,435,1706;1534,1706;395;31,64;601;1471;487;1707,1848,1849,1850,1851;1355,1642;424;792,1505;903;-32,-33,-34,-35,-1847;1471;31;2126;31,64;31;1802;1737;1651;1813,1814;640,1580,1601,1625,1645;790;699,1109,3506;630;635,717,758,1103,1280,1668,1704;1471;348;3148;475,504,564,601;1534;395,403,441,463;1069;1776;511,2202,2524;1776;1471;1471;662;837;1802;3683;1534;1671;33;1706;31,3753;1706;1534;1471;1002;640;554;632;1471;376;34;31,424,1863,1865;1475,1476,1477;601;950,951;2597;2743;2510;3050;424;554;2999;640;1480,1514,1515;417,2424;353;1821;122,1843;461,830;2031;1802;3558;34;1705;1802;461,1181;1471;1921,2059,2060,2061,2062,2063,2064;1471;1772;1794,1795,1796,1797,1838;1471;31,486,3277;1783;1651;1651;2734;1471;34;514,557;372;117,2448;2617;1471;1807;1471;2448;1705;1063;1406;2866;462;662;1254;1705;601;461,763;2770;601;31;2987;379,1881;1428;810,1551;31,461,601,1705;417,3437;808;2207;3459;2700;1820;372;364,1132,1133;601;643,1534,1603,3457;1708;1802,1816;554;2099;1251;3340;558;2128;1534;640;3531;1471;1732;1802;1471;1254;1534;699,1705;1471;837;409;2861;786;31;31,1534,3130;31,1534,3130;31,1534,3130;1471;1802;1254;759;1802;3382;878;873,874;667;467,511,878,3679;1109,3506;837,1359;1287;1502;1130;1471;31,1109,3506;1534;1802,1816;2084;601;2373;640;880;462;384;3085,3086;3428;-32,-1110,-1535,-3507;409;1802,1816;3046;93,94;1704;1673;540;1776;991;2052;640;601;540;1471;1133;441,475;422,581;1471;1291,1501;447,775;1471;117,1188;117,1783,2448;1991;1577;1002;348;1002,1003;3817;2030,2031;31,461,763,1106,1708;1109,3506;2149;31;122;461,763;1471;34;31;1254;1471;601;1651;1002;1355;1299;34,475;3832;403,486,929;587;1255;1002;792,1505;929,1612,1613,1614;34;475;1471;379;1802;113;1820;2967;574,575;523;1471;1651;486,508,635;995;462,475,601;642,643,2057;475;462;2887;601;1471;31,1707,2363;462,601;422,581,601;1776;1706;1002;623;117;31,1709;1534;31;2231;983;601;31,422,1844,1845;792;600,601,1344;372,2474;2836;661,837,1134,1135,3254;486;3147;1592;1109,3506;31,1567;601;1471;31,422,1002,1844,1845;309;1471;3847;461,837,1004;1471,2373;1002;1708;2991,2992;624;1529;1471;1709;601;1471;759;2171;640,1869;1931;1142,3595;3796;1471;1002;176,177,178;601;31,2531,2532;601;559;601;1002;412;134;1471;376,1216;386;386;386;386;1802,1812;461;424;379,403,601,763;2727;1802;461,1502,1503,1504,711;1540,1553,1554;1471;792;379;-32,-33,-34,-35,-1847;146;1251;1494,1496,1497,1498;1802,1816;31;403,475;34;1706;2126;1737;608,2776;2594;523;1651;403,667;1471;1600;1706;31,1534;410;31;2486;403,461,763;1648,1877,1878;1705;31,1874,1875,1876;122,3000,3001,3002,3003,3004;1708;31;1708;1707;1471;601;1709;1272,1651;117;2537,3331,3332;1672;1707;1525,2283,2284,2285;134;1471;437;31;3135;1002;1002;483,1002;1458,1471,1550;786;117;409;837,2118;1002;31;857,2557;2629;117;1651;475;937;1668;601;640,1483;1705;122;1419;1534;554;372;409;711;403,1707;673,1047;380;117,1782,1783,2448;1471,1502,2704;1841,1842;1312,1313;1706;968;786;1547;409;1471;601,1196;601,1871;486,601;1254;34,601;550;1802;1413;1976;640,3138;601;791;1471;1471;2000,2001;968;2637;1471;117;1534,3352,3353,3354,3355;1254;1707;1002;31,390,1708;1254;1254;554;422,581,601;1254;475,1202;475;1254;1130,3005;1471;640;601;2123;1254;3560;417;559;117;417,2812;1471;554;1016,1017;1015;514;601;1471;1471;550,1802;258;1646;1002;1002;1707;1707,1712;1705;2095;2254;31;2683;2412;34,514,1668,3406;601;34;441,598;601;2506;2122;601;1706;1494,1496,1497,1498;31,64;583,601,1074;601;1443,1456;1471;2589;1803;117,1216;950,951;601;-32,-644;1806,1815,2459;1737;2741;1471;3582;408;601;403,461,906,907;1668;1255;1471;605;2376;1109;1298;1406;2319,3052;61,62;440,441,442,443,444,445;441;564,1749,1750;564,1749,1750;564,1749,1750;396;439,440,441,442,443,444,445;601;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;478,479;564,1749,1750;1706;564,1749,1750;395,430,475;564,1749,1750;564,1749,1750;447;1887,1888;601;1776;1471;2118;406;600;417,1471,3029;555,2678,2679;1658;372;447;2376;3348;1002;1799;1471;2956;1152;1471;113;422,2316;601;1673;31,32,33,34,1846;34,554;31;608;34,554;3566;601;601;608;31;601;31;601;34,428,462,554,583,1439,1668;31;1776;475;884;31,64;134;1061,1471;403,1002,1706,2804;1943;2734;3573,3574;1776;1181;601;1651;2770;31;3566;601;884;2438;1707,2192;1471,1761;122,481,640,1331;489,717,968,1996;2325;1707,2192;1471;422,581,601;642;379,1705;1224;1002,1707;1471;1776;1471;447;1793;1054;1645,2350;2599;1673;1651;379,396,1704;601;1130;1729;1002;486;657,2167,2168,2169;990;1651;600;34,601;1471;1471;632,1512;554;364,1132,1133;403,514,1700;462,511,514,2202;601,1675,3384,3385;1471;711,2340,2918,2919;1802;1002;601;3778,3779,3780;2025;461;1355;403,461,1709;1471;1471;390,552;310,311;1121;1651;122,481,640,1331,1543,1574;31,441,601;3655;3655;1549;2439,3317,3318;1002,1534;2049;1534;34,1534,1737;34;31,564,601,1371,1372,1673;697;521,522,523;1668;711;403,1707;1499;601;601,1705;640;523,1737;2542;34;812;1066,1709;31,34;2312;34,1707,2163;1705;31,408;507,962;1562;1706;554,1707;1471,1770;601;1413;601,1331;462;1480,1514,1515,1516,1517,1518,1519;384;34;1705;1029;376;2503;367;475;486;1878;372;1734,1762;477;1002;31,857,1860;601;117,141,1631;2822;1471;601;664,700,1705;403,1705;2734;814;577,1002;1471;376;1331;409;601;396;1471;31,1862;554;601;1734;157,158,3500,3823;134,1331,1673;1799;1471;486,600;31,64;1002,1737;422;554;554;1393;122;31,1707;1651;379;1706;1471;624;1878,2255;601;601;1471;998;1706;1345;486;640,3328;34;1706;1002;1534;31;31;1534;601;1737;1534,1737;1705;33;486,608,1706;1727;31,1002;348,1708;422,581,601;117,1783,2448;422,581;632,736,805;1706;601;833;417;475,601;1471;1254;2918;1534;1058;1471;31;1447;422,601;632;3813,3814;422;1251;1464;31,1737;242,243;31;1802,1816;1883;487;2403;3181,3182,3183;452,1035;1534,1706;1109;422;1471;1651;1820;574;2722;1254;1730;1776;1254;31,462;600;1471;1471;486;486,601;1002;1002;1002;872;31,1534;601;608;417;601;601;34;2163,2638;1254;1802,1816;1254;1651;2888;726;31,64;422;31,64;1355;1754;2342;3844;403,461,911;3770;589;422,581,601;837,2290,3254;450,601,814,2558;1471;1651;1747;601;1060;1705,1706,1707;1802;1980,3037,3038;942,1213;601;372;31;1050;1471;880;1705;1672;716;1776;3851;31,408;3428;1766;2770;1242;417,1765,2841;635;31;3428;31;1471;1802;430;403,1084;554;554;1534;1103;481,636,1337,1338,1339;634,1721;376,1115;1985;601;1803;1090;2783;2512,2513;403,430,441,1673;564,1749,1750;564,1749,1750;2653;1651;950,951;1673;554;390;1406;1254;564,1749,1750;564,1749,1750;1471;564,1749,1750;564,1749,1750;564,1749,1750;1651;122;3758;2620;3072,3073;403,1707;1853;1705;2734;1651;31,422,1844,1845;1150,1188,2651;403,1084;1471;1471;1708;581;1099;125;2770;3132;1471;475,601;601;601;601;1471;1229;403,1084;31,645;1673;950,951;395,403,601;1665;558,560;403,475;1130,2841;403;601,3626,3627;470;601;475,667;759;554;403,514,1700,2254;601;403,514,1700,2254;440;2367;601;1318;601;31,408;601;475;601;1002;417,461,1029,1471,1499;81;3417,3418,3419,3420;1471;1799;1471;3709;1240;376,1802;1651;1153;601;332;2570;1359;3174;403;396,1705;31;1705,1706;2770;1709;2012;1410;348;61,62;2500;3221;1471;640;1802;1802;1471;2447;1872;1471;486;1161;1816;1471;1410,2756,2757,2852;1471;1651;390,403,601;860,3541,3542,3543,3544,3545,3546,3547;554;31,1534;1710;2961;461;3154;1471;814;409;395;1188;1254;1406;1706;1002;949;1821;1100;1651;1802;1106;1651;837;601;501;2918;601;1534;3187;2437;1188,1471;792,2790,2791,2792;2037,2038;1471,1592;31;893;891;31,64;1802;3428;3275;1143;601;1317;486;1204;134,3472,3473,3474,3475,3476,3477,3478,3479;3048;1708;601;2379;601;1229;31,601;601;1254;2458;1471;31;559;554;1802;462;461,1387;810,1551;1471;408,441,557;1475,1476,1477;403,1707;403,1707;601;624;1471;31,3414;475,1229;2163;3302;3854;1254;837,1366,2675,2735;968;31;1802,1816;31,486,1704;2373,2601,3031,3032,3033,3034;511,2202;507,777;31,1706;559;1471;2986;1651;1471;1471;1802;31;462;695;117,417,2704,2705,3441;117,141,372,417,1016,2702,2703,3441;1707,2376;640;2369;1707,3730;624;31,940,1854;3428;364,1132,1133;1471;31,3685;34,1737;1704;1706;379,424,1105,1106,1107,1108,1534;31;31,424,1002,1534,1711,1863,1864,1865;588,589,608;1534;1802;1673;1420;408,557,1668;403,1707;417,1548,1767,2394,2426;486;1802;2462,2463,2464,2465;31;372;134;608;1402,1403;834;1002,1534;1216;376;1471;1188;554,601,699;3795;1802;1480,1627,2684;1708;1706;1705;807;1016,1017,1018;1359;31,424,1534,1711,1863,1865;1705,1706,1707;1471;1451;1471;1988;1250;810,1551;1471;1651;1471;1259;1061,1471;31;2734;601;950,951;475;403,475;712;1139;1892;1776;31;417;977,1462,1463;640,3241;977,1462,1463;554;1471;1471;587;554;1471;31,1534;31,566,1055;117,1782,1783,2448;1038;1707,2192;1705;461,763,1544;113,206,207;31;1471;409;2325;1783;1393;978;818;1567;2397;3686,3687;2864;601;217,218;950,951;1002;223,224,225;1866,1867;31,390,430,486;1471;1707,2192;117,2448;379,407,1259;601;601;3811,3812;1760;372;601;403,408;601;601;440,841;2683;581;630;403,422;31,940,1854;520;486;2019;31,396,507,1707,1719;2734;1754;1895;1651;1002;91,92;3790;403;61,62;1369;63;409;424;3146;601,2199;1471;601;786;1802;117;31,1002,1534;34;948;1706;1706;461,1450;1002,1534;1704;376,1776,1777;601;1471;1651;1254;1471;3320;1254;1471;430,1706;1393;1471;1706,2209;608;2367;601;3329,3330;31,3516,3517,3518;1708;1737,3519;1737;2567;1002;1494,1496,1497,1498;462,514;1471;601;1471;1471;1896;569,1452,1453;33;424,686,1002,1534;1968;2341;1933;1802;1706;403,467,573;2734;1002;422,581;554,1703;407;1534;1325;601;586;31;861;1458,1471,1550;3471;914;1393;1651;1651,1799,1802,1819,3114;117;589;786;1651;31;641;475,601,742;798,968,2695,2696;1642;3786;1668,3298;601;601,1668;601;601;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;2776;520,601;408;31,601;31,3058;1229;486;462;422,581,601;34;31,441,601;31,408,619;31,408;1409;601;396;2446;1471;1687;470;395,514;1707;2548;520;1471;1471;1592;441;2942;395,1687,1698;31;379,403;1874;730,731;1708;1471;1002;31;1708;486,509,1156,1704;554;233,234,2246,2247,2248;1002;2493,2494;2494,2507;3307;1708;1706;1708;699,2176;1705;462,1706;1002;1562;1707;1707;1002;583,2067,2068,2362;1002;759;1784;554;1471;643,1585;417;601;122,903;1471;1705;1471;640;31,1002;1802;601;31;1002;1109,3506;31,122,447,1130;31;31,1002;141,1631;31;1562;1471;2770;1651;1651;1254;759;31,1002,1863,1865;417,1765;31,424,1534,1863,1865;1331;1471;3131;1532;1471;1471;753;379;950,951;1687;1251;2076;2342;662;2547;514,557,1212;1002;409,601;417;31;417;810;640,1534;403,1707;1534,3352,3353,3354,3355;601;1737;34;1705;1534,3352,3353,3354,3355;1534,3352,3353,3354,3355;31;3357;1534;31,32,33,34,1846;1471;601;1471;1534;1661;3209;3860;34;2294,2602;554;1651;1130;372;1548;31,1705;117,122;475;1799;2471;2040;1471;409;1179,2504;3526;1002;441;408,601;34,141,601,711,2297,2298,2299,2300;3508;759;1471;1651;426;982;1471;1407;675;1905;384;1503,3775;1651;1802;1803;3043;2676,2677;1651;1446;2551;1776;1705;1471;441;462;462;2140;1471;475,601;31;500;2144;1471;376;1651;1174;1962,3481,3482;1802;1471;1002;117,461,837,2759;1471;1471;1471;372;601;1100;1002;903;1471;475,667,1694;1130;1002;1705;441;601,1188;409;601,1471;2685;2683;2009;3186;1366;2071,2072;1680;1680;1471;1734;1002,1734;1802;601;409;601;1332;1668,2035;1454;875,876;873,874;31,441,748,908,2104;873,875;1949,1950;1776;1002;1109,3506;1651;1308;1875;1251,1471;1799;1706;34,601;107,108;2869;364;986;1471;3845;2346;1471;1763,3279;2237;1188;578;578,792;578,1106,1503;1471;1776;1471;1471;117,968;1802,1810;1706;2212,2213;1818;1002;3263;117;3144;3629,3630;1471;113;31,699,989,1719;3566;640;1331;520,1211,1703,1938,1939,1940;395,475,1687;2430;2519;1471;657;1471;1471;379,562,1720;403,461,763,991,1221;1683;1002;2458;2734;367;417;1122;423;1707;1229;2825;1802;372,1345;1471;1705,2277;403,1707;601;669;1229;1471;601,3589;3591;2683;1130;798,1477,1479,1482,1483,1559;954,1471;3188,3189;1802;595;461,1502,1503,1504,711;1767,1768;31,1534;407,1002,1107,2616;742;807;1802;1331;379;3158;1593,1594,1595,1645;1254;1359;34,554;1707;601;1651;601;137;1794,1795,1796,1797,1838;376;34,601,2490,2491;1471;786;1776;34;601;475,1673;1471;1073;1802;31;1471;644,748;1471;1709;430,776;3605;507;1109;117;837,1755,2481,2482,2483;31,572;1301;2766;31,422,1534,1844,1845;2101;1534;601;1540,1553,1554;1471;31,1002;31,1360,1361;3152;1471;31,837,1331,1534;1471;1016,1017;554;1534;33,786,1534;417,1765;1259;1471;31,863;775;1109,3506;1651;1802,1816;31;412;403,1707;417,1295;1471;1802;1009;1534;1707;31;1002;31;640,1866;608;1471;1254;1573;461,699;759;1471;1471;2499;476;1651;601;1471;1690;441;1471;386,389;1802;461,1502,1503,1504,711;1247;1651;1802;486,629;1651;1263,1264;640;31;447;1142,3595;1471;1707;31,608;601;422;31,396,574,1621;2734;559;31,2566,2567,3128,3129;1712;1821;1707;31;601;1534;1471;1471;417,2187,2480;2421,2422;447;1471;1229;424,1503;1130;31;1002;1948;1471;1471;1362;1406;250,253;1802;2719;2770;1471;2477,2478;2973,2974;1673;1471;1471;403,1707;3592;1393,2321;428,601,1106;511,2202,2524;601;601,3244;2383;475;601;441;424,1109;117,1668;1002;1534;1109;950,951;950,951;1568,1569,1570,1645;554;31;31,440,494,1197,1198;1651;447;1651;2120;1534,2120;1776;1234,1235;375,1158;766;2761;1841,1842;1841,1842;1802;403,1707;1458,1550,1627;833;1002;937;601;475,601;31;1471;969;1651;1215;559;1106;31,475;117,1765;554;1651;601;1471;838;515;903;117;1586;1254;31,486,555;1706;1706;1254;31;384,1802;1355;1737;1471;1776;1254;486;390,396,422,481,704,705,1668;657;601;601;213;632;2204;3752;1249,1802;1083;1254;654,655,656;1254;475;3282;461;1041;1002,1707;1651;601;1707,2417;1705;1709;1712;601;376;1229;403;1471;2683;601;3751;3659;31,2746;3102;34,2877;950,951;523,554;601;1692;1471;396,1707;3321;1651;1002,1850,1851;1851;417,1328;1776;1706;1471;1471;1643;403,1707;422,523,1431;1002;31;1471;601;1707;601;601;31,1537,1538;1471;601;630;117,1782,1783,2448;759;601;759;651;754;1002,1737;1776;1101,1850,1851;2082;612;1379;219,220,221;409;788;748;1002;759;743,744,745,1734;3395;1708;1471;1651;1406;31,1239;1239;564,1749,1750;564,1749,1750;581;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;439,440,441,442,443,444,445;564,1749,1750;3634;950,951;2870;384,1802;1472;31,1708;417,3036;696;2598;1002,1534;1158,1427;792,793;304;1583,2669;92,3664,3665,3666;2504;404,837;1471;1471;1002,1471;632;662;1106;461,763;950,951;601;640;31,1375,1740;601;601,925;608;601;601,2194;601,1746;601;33;608;1673;1106;2942;637;441;441;1443;372;514;1471;1061,1471;3766;2049;1459,1460,1461;1809;1706;481;1841,1842;441;1753;364;2734;3602;1471;2155;1471;1471;1331;1471;1953;122;643;31,566;1130,2416;1771;1802,1816;1471;462,554;978;662;1471;31;1776;475;601;1471;2325;1255;1471;814;1471;1471;963,1190;1254;1705;1471;1802;554;1471;1471;2190;1229;1471;786;981;1471;3213;2402;1406;1406;554;1651;430,440;1302;601;3787;1718;1534;1707;1002;461;461;461;1471;880,923;3483;2103;1079;1375,1376,1739,1740;1331;117,1562;2356;640;945;1534;31,441;412;2968;1567;1802;461;632;962;31;1219;1254;1254;1424;3159;1471;1706;962,2529;601;475;475;1199;17,337,338,339,340,341,342;1990;1404;396;1188;1708;1106;441,557;31;601;117,1783,2448;601;1651;408,601,2215;34;2608;1767,1768;601;31,666;603,1170;554;1249;554;3635;403,1707;31,475,489,490;1471;1471;554,640;554;1480,1482;1902;3698,3737;1471,1765;1651;117;1471;601;1651;3315;31,1861;31;31;1029;391,392,393;711;3830;880;1126;700;1227;117;635;786;1652;1651;2972;1651;1651;1802;417;31,117;409,1705;1534,3352,3353,3354,3355;1016,1017,1018;1471,1534;1002;1002;31,1862;2141;31,396,1197,2377,2378;1999;31,2545;31,2545;122,31;31;31;31;3047;437,1002;2443;404;1706;1064;601;950,951;1387;1255;814;1406;1037;134;441;601;640;1651;1471;1706;1471;1651,1820;1651;1651;1567;1706;384;403;800,1651;640,1681,3341,3342;141,401,1651;1471;1705,2219,2584;1706;403,1707;1002,1706;950,951;1705;1002,1706;2366;390;412,424,1002;601;1471;792;1002;403,1707;1651;1802;1802;600;1802;1705,1706,1707;1002;1130;1802;1471;1802;1439;1126;569,1452,1453;31,34,1534;2988;1471;601;1708;3762,3763;475;1412;475;2295;34;817;281;2458;837,1705;3581;1742,1743,1744,1745;2734;1802;372,1345;3015;1002;2120;162;1651;195;2520;1480;1776;1776;348;2066;1130;640,1901;2964;407,1002,1734;1471;3646;31,523,554,1737,2699;31,2699;1471;1753;34,523,554,1471;31,424,1002,1719,1863,1865;1471;1707;792;1651;789;2049;1802;1705;34;1706;1534;601;1229;470;475;1254;34;1471;1471;1254;1776;1471;554;128,129;1534;2007;761;776,1995;1776;1346,1347;1799;3471;1704;1651;31;92,3774;1705;1471;601;1802;1802;1254;1254;792;1406;390,928;2057;31,928;1706;34,523,554;554,837,1677,2712,2713;1471;1471;1406;110;554;403,1707;31;1773;1651;2317;2624;462;635,774;33;635;1705;1710;31,412;1710;1705;3820;462;1362;662;396;564,1749,1750;440;3644;1562;31,908,1710;379,396,736,812,813;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;372;1932;2924;2314;31;31;1146,1147;447;117,2448;1471;1990;901;1707;34,667;601;601,653;1668;1673;601;601;403;441;514,601;403,514,1700;1668;601;601;601;403,514,1700;1229;520;403;475;2254;403,514,1700;759;440,1692,1693;462,514,571;422,581,601;759;475;31,390;31,390;1229;34,640;441;422,581,601;1471;659;601;31,417,767;1799;1708;1534;1534;1651;1866,1867;2686;737;540;1471;395;1471;1114;2955;1010;462,601;31;941;75,76,77,78,79,80;601;1475,1476,1477;1106;2034;475;1471;1471;3425,3426;1708;395;2918;1651;1776;523;950,951;1534,2203,3346;1710;2049;3484;701;662;1802,1816;395;1471;2942;31,584,585,1708;1471;2549;784;486;1471;31,688,1002;1101,1850,1851;601;1802,1816;1471;122;3023;462,2431;31,475;34,1534,3349,3511;601;2627,3212;837;134;3006;601;168;403,1707;461,1527;601;601;475;34;31;601;1710;475;3149;475;608;122;408,557,926;250,251,252,253;447;1088;1705;1471;554;461;417,1765;1705;461;1708;1471,2440,2441;3223,3224;2935;1471;461;2270,2271,2272;417;601;31;403,1707;1471;1712;417;3563;117;554;1471;792;1471;486;1707;1251;1802;266;31;31;601;710;3660;2458;1236;3153;1707;462;462;1345;640;407;424;1799;792,1505;364,1132,1133;31,1707;2126;1708;1471;2933;379;1776;1471;3760,3761;1471;601;31,3685;601;632;437,1534,3485,3486;31,3771;1002;711,810,1534;1002;1956,1957;34;422,581,601;31,430,1706;1534;437;34,3767;31,33,983,1002,2796;1345;441;160;407;379,704,757,758;809;1471;1002;950,951;486;1708;417,767,804;601;2670,2671;837;1471;1471;475;601;1321;3364;34,554;2019;1706;1707;1471;31,424,1002,1863,1865;1471;587,691,1061,1539,1540;1107;1471;1260;117;376;1708;117,417;1255;1471;1471;2915;2589;921;2788;3285;1406;2044;1898;1254;1776;31;1418,1802;1776;677,678,1706,1707;1352;1802;1802;1794,1795,1796,1797,1838;348;117,2448;117,2448;1598;376;1821;2604;461;601;1802;1651;260;807;1534;31;1374;395,601,1124;1446;601;3192,3193,3194,3195,3196,3197,3198,3199,3200;640,3255,3258;430;1651;422,776,777;92,975,1497,1632,1633,1634,1635,1636,1637;640;587;759;1130;1377;31,940,1854;691,1540,1553,1554;3491;554;1666;1802;1427;1254;1254;837;1802;1802;1471;759;31;1058,2961;984;1706;1737;1471;1679;630;1427;1002;601;1534;1204;31;2409;1471;1406;1254;1254;601;404;3070,3071;1651;1651;1502,1722;461,711,1502,1575;31;1706;601;1254;1254;1366;34,1471;2296;601;2315;640,1256;441;31,1002,1375,1740;214;1002;1534,1737;1707;1716;659;1254;950,951;31,441;34;1109,3506;600;117;728;601;1471;1471;1710;981;2775;1471;1471;372;372;601,1706;403,1707;2234;511,878,962,2965;640,1667;1002;31,379,424,509,510,1534,1673,1737;403,1707;2811;1534;1821;1839;31;741;31;601;1994;3028;475;1242;1471;2159;2665;1254;1651;1705;1734;1802;3061,3063;430,837,1706;31;1109;298,1783;1471;348;1651;1254;3421,3422,3423,3424;2706;668;1834;34,1668;601;601,1106;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;3070,3071;622;950,951;1002;31,379,396,736;1002;601;830,1197;428;403,423,987,1188,1189;31;601;34;950,951;31,408;950,951;395;1534,2646;1651;31;1248;1471,1767,1768;1375,1376;1002;31;31,1708;1176;950,951;1471;395,514,601,1687;31,601;1708;1706;3554,3555;1471;1002;404;781,782;3362;1597;441;1534;1707;2493,2494;2494,2507;640,2389;1705;1737;1707;31;1706;699;688,1002,1716;1471;31;462,1687;31,1002,1645,2350,2354,2355;1254;1708;1365;1708;1471;1471;2357;1705;475;475;475;1308;1471;31,461,763;1534;759;759;837;601;1109,3506;964;1687;1471;601;1705;1706;837;1802;422;2288,2289;1299;440,629,2683;792;601;559,601,962;1673;486,736;1406;1242;3792,3793;917;1471;1982,2047;1534,3352,3353,3354,3355;117;1708;430;348,1642,3458;1707;1704;3438;422;1471;640,1541,1542,1543;1705,1706,1707;903;2290;601;2486;1767,1768;605;409;1471;417,1477,1521,1522,1523,1524;716;462;950,951;1706;117,417,2418,2419;1471;601;1802;1254;2770;1233;92;600;1471;1802,1816;117;1705;936;601;1471;1471;395,556,601;1471;1471;950,951;601;81,3177;408;1471;367;1255;673;1471;1651;417,2425;404;1150,1418,1471,1473,1480,2628;792,1505;1471;601,2178;601;1642;1688;1233;1651;601;601;379;441;1043,1694,3456;489,1073;1471;1471;1109,3506;2683;950,951;1471;1471;2442;117,417,2611;3428;1802;1802;601;408,441;31,1534,3130;31,1534,3130;31,1534,3130;31,1534,3130;31,1534,3130;31,1534,3130;2458;142;969;1802;748;857;463;440;117,118;372;1061;1406;644;601,962;2820,2821;1406;1645,1941;1471;1471;1471;1471;1730;33,578,1471,3059;1406;3009;1776;412,601,636,2214;3263;31,486;1471,2373;1708;798,2769;31,997;1707;481;-32,-33,-34,-35,-1535,-1847,-1867,-1868;31,990,1719;395;1471;1471;1776;3449,3450;601;507;3428;792;1651;31;832,2577;3150;1112;31;699;1820;3281;688,1109,3506;3230;745;1471;1534;1109,3506;1802;403,2450,2451;2803;1705;1381;1471;2814;1106;1471;122;31,878,879;2594;601;1544;1776;1776;807;1776;719;1090;3165;2458;31;606,2693,2694;2113,3015,3266,3267,3268,3269,3270,3271,3272,3273,3274;3205;807;2645;2645;1534;1534;1660;430,1096;1976;574;3841;608;662;1651;417;1002;601;2738,2739;1471;1802,1816;691,3490;1802;1212;789;759;759;409;2458;750,1705;1471;31,587;409;1767,1768;963;1705;1471;1802;409;1254;1651;1708;2090;1480;3595;837;403;412;507;1802;858;2203;688,1002,1719,2203;975,1497,2853,2854,2855,2856,2857,2858,2859;31,940,1854;1254;1471;31,1537,1538;789;601;3797;2118;554;487;376;3211;786;412;412,688;1471;3620;1776;1188;409;2976;950,951;31,2540;1326,1327,1705;601;1002;1471;122;1802;1706;1707;364,1132,1133;2073;837;422,581,601;1002;3605;601;1259;1254;475,601;1651;1471;1471;31,1645;3347;1128;1563;640;1705;601,1707;31;1061,1471,1525;1029,1767,1768,1769;2162;1651;601,2178;601;1471;1177;1459,1460,1461;1471;424,1002,1534;31,461,601,786,1291;1002;1471;1471;1458,1550,1627;1651;441;678,1002,1106;737;601;759;1130;837,3254;1471,2931;1673;2522;403,1707;2514;1471;787;2979;2927;475;61,62;1645;601;489,950,951;644,2886;662;348;1471;475,1691;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;822;822;789;640;514,601;601,691,3029,3523;601;789;2243;486,1316,1534;82,3323,3324;1406;1471;117,2581,2582;2734;31,424,1707,1863,1865;100,3733,3734,3735;837;1471;417,1477,1521,1522,1523,1524;2740;1254;640,3276;1254;1254;776;1709;1821;3534;31,699;1251;2325;1254;1254;403,1707;1254;462;1254;462;1254;792;475;396,422,704;481;3007;810,1551;402;883;1564,1565,1566;1471;441;1651;1443,1456;1705;792;554;2734;475;1471;1651;856;1471;1705;1707;2666;31;759;894;1446;601;601;2877;554,601;601;601;601;601;514;441,601,1870,2172;601;601;514,601,2530;1776;364,1132,1133;447,1439;1706;1534,1707,3352,3353,3354,3355;601,1704,1707,1716;31,2476;759;601;1002;885;1472;2979;2253;601;3369;1776;1471;428;1471;643,1587;1705;417,1427,1592,2544;417;122;409;601;934,1239;564,1749,1750;564,1749,1750;564,1749,1750;564,1749,1750;117;1776;577,578;1799,1804;31;1471;1471;758;3595;2368;789;1229;640,2682;31,1534;554;2319;675,1002,1471,1669;1471;1254;1776;1260;2057;1471;1471;601;404;511,746,1040,2095,2096;31,940,1854;1251;601;31;601;554;514,601;601;31,2862,2863;1705,1706,1707;742,957,987;486;424,1534;417,554,1002,1534,1554,2581,3089,3090,3091,3092;481;1427;601;475;31;523;475;554;1109;31;581;409;441;1471;1471;1002,3155;1707,2192;461,1355,1480;1651;404;554;1427,2187;1471;786;31;34;1342;1317;1471,1683;1802;1471;662;1142,3595;540;117;1406;31,32,33,34;1130;1776;1802;601;117;1471;462;364,1132,1133;1776;601;1651;430,440;430,440;430,440;430,440;430,440;430,440;1308;113;1261;31,390,404,430,509,825;409;1447;122;657,1188;441;312,313;640;1705;2109;31,1256,1675,1737,2960;2454;1802;1651;1651;858,1164;440;2448;1471;81,1824,1825,1826,1827,1828,1829,1830,1831,1832,1833,3087,3088;1651;1753;1705;554;1706;554;554;1002;31,554;1707;640;1734,1735;601;1776;1422;553;1651;1471;31;1061,1477,1627;1129;424;664;403,1707;664;1651;379,1668;1651;1651;1471;1406;2290;403,514,1700,2254;1872;117,1989;1471;2760;364,1132,1133;664;601;1471;1709;837;1406;1503;364;422;950,951;1776;2734;1737;368,369;1705,1706,1707,1708;1803;3794;2676,2677;1799,1802;3566;403,1707;31,1534;31,117,996,2884;1002;1647;1738;640,1534,2078;581,776;1471;1005;366;1471;1802,1816;1471;379;601;1820;1471;2925;117;601,1196,2320;441;2160;441,2200;461;1471;1705;554;2745;1776;1345;1254;32,1101,1707,1847;1704;1630;1471;2826;2131;1001;1776;1651;1471;1776;1776;2580;601;1471;3322;1802,1816;1158;1471;1471;31;410,541;1254;1471;31;31;3604;1406;1471;31,554,1924;147;486;1345;408,557;1238;720;372;942,1427;417,1765;475;807;3787;2729;1706;3504;3124;1534;601;1308;1471;810,3436;376;409;475;440,567,568,569;807;1254;1980,3037,3038;1471;1753;601;662;1471;31,408;31,395,475,489,507;1471;554,3593;1471;1794,1795,1796,1797,1838;1471;640,3035;2915;557;1776;1706;3632;31,1338;1706;34;472,487,601;472,487;601;3636;1794,1795,1796,1797,1838;1471;2445;880;1471,1996;564,1749,1750;1802,1817;564,1749,1750;31,440;131,2080;3170;1802;1706;1254;1254;1254;1471;1145;542,543;447;968;1649;31,1714;32,1101,1707,1847,1850,1851;1274;31;1850,1851;31;32,1101,1847,1848,1849,1850,1851;507;1911;1345;2958,2959;667;886;601;1229;950,951;440,472,474,475;662,1769;2379;3533;441;1188,1471;601,878;554,837,2712;403,514,1700;440;403,514,1700;403,514,1700;440,1692,1693;601;601;403,440,601;403,514,1700;601;403,514,1700,2254;31,601;601;518;601;422;475;2173;950,951;1471;1471;1534;1109;1471;117,2456;1471;789;1471;31,1866;3425;1471;286,287;3160;212;524,525,526,527,528;524,525,526,527,528;486;1706;1706;601;1705;1251,1471;408,441,557;376;2942;1002,1471;1802,1816;1355;1443;837;417,1427;1737;475;395,440,504,505,506,507;3296,3297;950,951;1802;807;601;860,3547;1471;601;601;507;1406;1802;3022;628;1651;1534;1708;1471;1406;2126;31;2607;1254;2680;1802;601;1254;2302;1471;2262;3161;31,34;34,589,3349;1705,1706,1707,1708;789;2823;601;2885;33,554,640,1534,3551;1393;786;789;807;117,1765;1821;1001,1704;31,486;1471;31;1471;2837;117,1783,2448;1471;417;795;1802,1816;675;31;1471;601;789;1002;1002;1002;372,2734;601;1705,1706,1707;601,1710;31;1870;878,962;2160;422;759;601;601;31,601,1673,2805,2806;601;557,1212;441,557;486;807;3334,3852;1767,1768;1534;762;511,1090;1471;1776;2639;417;31,2198;1319;122,835;31,422,461,508,1418,1706;403;1678;1254;640,1958;789;1802;601,657;1254;1753;1820;640;1802,2749,2750;1471;554;31;1254;396;2654,2655,2656,2657,2658;1331;1362,3612;2216;2729;375;1651;507;34;183;837;407,2569;424,1002;601;1471;1471;283,284,285;2454,2664;3024;33,1754;33;1471;3692,3693;601;31;31,3685;602,603,1708;640;1534;34,589,1534,3349;1802,1816;1766;2196;379,704,757,758;441;1534,3352,3353,3354,3355;1471;31;31;1002;1471;2405;2008;657;1471;1534;1002,1534;1534;1706;1130;3580;1651;1359;1331;1789,1790,1791;2815;1471;1471;481,1706;498;2420;1706;1016,1017,1018;2009;1471;837;34;950,951;759;950,951;3044;1345;2748;1002;1776;808;2340;1169;2230;1821;1776;1776;384;364,1132,1133;601;1534,1737;1776;1534;481,593;1708;582,736,957;511,512;117,2448;1471;113;2229;2827;1706;1471;31,34,554;462,601,2714;1767,1768;2036;1002;141,372,382,837,1016,2702,2703;601;1406;412;1802;1002;372,1719,2630;483,1002,1534;810,1551;424,1534;1471;1802;601;1802;1548;601;1508;1229;1794,1795,1796,1797,1838;1802;1471;807;1406;850;1480;1651;601;2688;759;1471;31,940,1854;1706;3522;8,17,337,338,339,340,342;1272,1651;807;1705;1254;1471;1254;122;1471;3083,3084;963,2045,2123,2205;403,987;1254;1254;1254;1254;1471,1707;1979;1443,3299;642;2013;1122;403,462;1802;1254;1254;640,995,1645,3261;1254;1100;31;1002,2681;1706;1534;390;523,554,786;564,1749,1750;1534;689,2076;1773;141,1480;729,735;31;1471;31,1375;3253;608;578;1002;3853;601;1002,1706;31;1471;1471;1471;978;3179;601;475;1106;601;1706;31,379,509,510;629,1256,1737;1002,1706;31,475,489,1074;601,1002;699;894;559;559,894;1707;1651;117,1467,2018;601;364,1651;1058;238,239;1471;1706;1802,1816;3468;1254;1705;1802;1802;1471;379;1254;1254;601;417,1427;1706;447;31,554,837,1503;601;601;1345;1254;31;3421,3422,3423,3424;3815;3783,3784;3229;2934;31,34,1668;462;2164;1350,1592;1673;3070,3071;962;3070,3071;1285;554,601,619;408;31,441,601;31;759;408;514;759;730,733;1668;601;619,2163;950,951;554;1471;2734;691,3490;417;601;470;31;600,662;1471;475;1471;441,646;2543;117;2254;431,3162,3163;730,733;-1725,-1726,-1727;1534;486,1002;31,1002,1706;509;1687;475;601;1687;1002;1002;601;1029;640;601,1673;1852,1853;792,1505;1471;409;1447;792,1471,1529;1424;1002;2536;1882;1471;1471;1002;601;31;1534;837;601;1106,2115;1802,1816;601;1471;364;403,1707;403,1707;2734;1706;1471,2169;417;1255;950,951;1002;950,951;688,1002;601;682;837,968;2848,2849;1767,1768;1307,1757;117,422,601;2730;897;1776;3184;554;1706;1471;1471;1471;1471;134,2610;364;1651;1471;1471;1471;657;635;3428;486;408,441,475,557;403,441,475,601;364;2883;1254;1229;1067;475;1708;1331;364;554,1471,1562;1705,1706,1707;1471;3824;1106,2097;601;1471;403;601;462;1915;1254;409;1254;601;408,511,2202;364,1132,1133;662;187,188,189;600;520,601;601;1188;2338;759;1471;367;1802,1816;403,462;403,462;403,462;34,640;509,1715;601;395;1471;1737;1534,1734;1471;1090,1363,1364;1471;1406;1651;318,319;424;379,1226;417;2485;1675;452,597;929,1508,1601,1622,1623,1624,1645;1802;31,441,874,876;31,873,874,875;878,2094;1471;3123;364;1406;424;1477,1479,1480;3556;601;903;1471;1471;1774,1775;1212;2869;3781,3782;2126;417,1427,2286,2287;3263;185;1049;1471,1545;1592;417,1765;1471;1534,1737;1471;1471;1471;384,387;711;601;1471;1019,1020;1651,1802;784;1802;2496;1229;2100;1292;1471;1471;1471;1171,1172;1471;2953;1471;1802,1816;395;601;461,1291;105,106,376;507;640,786,837,1683,1821,1915,1919,1920;376;475;807;1781;806,807;384;1802,1816;742;3618;157,158;1776;157,158,3823;161;1802,1816;3045;1254;1254;1471;1355;1216;1776;706,707,708;1704;1471;581;1471;1776;2256;1471;810,1551;662;1712;601;2133,2134,2135;1471;601;1471;3785;2458;31;801;1651;417,1477,1521,1522,1523,1524;1106;1130;1471;1254;3488;1534;2049;843;31;2486;2869;31;2578;724;31;1471;1802;348;662;1251;386,1776;3595;3695;1707;1534;31,3738;424,1734;424;1471,1758;975,1497,2853,2854,2855,2856,2857;424,1534;1562;1471;1471;1471;1150,1477,1558,1559,1560,1561;1471;1872,2763;1002;601,2199;424;412;2039;1471;661;1802;1002;92;1188;1776;3112,3113;1776;1357;601;601;789;2049;1802;1620;1602;1589;3699;31,1534;31;1708;31,450,814,2075;31;1534;1471;31,1499;31,1567;1446;1471;1802;1471;3796;1651;1130;1002;1802;1802;1002;1471;1534,3352,3353,3354,3355;263;1802,1816;601;1802;1002,1107;1471;461,1000;447,775;2215;379;1766;2734;1753;1471;31,408;601;1996,2373;1451;31,2758;1029,2091;1534;1109,3506;2458;759;462;2119;31,34;1471;2770;1776;3772;924;289,1841,1842;1651;1841,1842;1841,1842;1651;390;1413;1393;1651;601;1427;601;409,440,863;31;1799;228,232;1651;417,1765;1254;2734;1651;3167;1651;1507;759;1673;117,2448;601;633;461;1254;1254;759;348,1668;437;1254;1471;950,951;639;1254;1254;1254;1776;759;950,951;3566;759;759;174,175;1471;1471;2042;1471;1471;810,1551;1651;1331;1802,1816;1229;632;601;1651;950,951;1627;759;514;601;1706;1471;467,3807;1651;1188,1562;962;601;31,33,34,601,1668,1737;475,601;2639;2928;486,1603,2093,2094;348;462,2078,2079;2160;601;601;2649;31,1323,2782,3099,3100,3101,3102;1697;601,2132;487;601;601;404;759;1254;417;1534;2051;1471;417;814;931;977,1462,1463;449,514,797,798,799;601;408,441,557;950,951;759;2187;1651;985;2098;601;117,1471;1471;3310;981;3310;2672;1002,1101,1850,1851;564,1749,1750;554;2756;1471;1651;141,1631;470;31;1821;117;475;417,1765;475;1707;523,554;950,951;759;2770;601;3566;3566;601;601;601;475;2145;1802,1816;789;1471;1471;31,32;3285;1705,1706,1707;2993,2994,2995;789;1706;1471;2302;950,951;624;1183,1471;3661,3662;3156;1477,3049;2049;554;608;942;1471,1759;31,1900;2770;31,92,1502,1580,1581,1582;1651;2325;1705,1706,1707;1651;1188;1705,1707;1704;372;417;539;1802;3776;1471;3539;1471;494,1471;601;1142,3595;1749;1471;1651;2578;461;461,763;1355,2089;461;31,1534;559,632,1465,1466,1467,1468,1469,1470;1471;3625;1802;407,424,1708;1002;1705,1706,1707;117;376;1406;1802,1816;1802;1705;2441;1534;475,601,950;34,1471;1471;1471;31,32,33,34;31,1256,1675,2960;1471;1471;807;275,276,1075,1076;798;3220;2573;2505;1706;34;601;554;601;601;1875;601;144;1471;833;1471;600;2121;1471;117;117;81;601;31,1418,2293;31,601;1016,1017,1018;1188,1471,1534;1188,1471;417;1002;1188;31,1714;1002;31,1534;379,1668;379,1668;379,1668;481;1794,1795,1796,1797,1838;1794,1795,1796,1797,1838;1802,1816,2015;1254;807;1406;1651;364,1132,1133;2065;662;2734;117;554;409;2734;759;1375,1741;3215;601;601;511,512,619,1196;31,1737,1851;390,3502;31;1001;1737;390,430,1705;1707;564,2154;1708;1002;1706;933,934,935;1188,1471;1642;1471;1254;33,34,1734;1709;1188,1471;1651;3828;403,475;601;1089;441,557;379,601,1534;601;422;1002;2252;441,557,1212;601;1109,3506;31;601;1333;2305;1106;395,601;1534;1802;1802;1821;1236;376,1776;1471;3428;1802,1816;759;1802;1002;601;117;2556;1776;31,908;1098,1651;1471;1471;31;31,461,1705,2626;1471;410,514,3603;34;1471;1642;523,554,1471;408,601;1471;372;2254;601;1705;348;1471;1534,3606,3607;1106;1875,3577;1651;1400;2302;1103;2457;601;1471;1471;122,523,554,601,1708;1355,1480,3724;1188;2962;1254;624;458,1802;1406;2578;31,554;2578;367;1408,1642;424;1502,1731,1764;1471;31,449,451;379,674;61;1706;1439;587;1682;1802;601;1331;1406;113;1471;1776;601;3265;441;564,1749,1750;3203;366;364,1132,1133;554;514,601;564,1749,1750;564,1749,1750;379;1229;2620,2621,2622,2623;31;1029;117,2448;1394,1395,1704;1802;554,837,2712;403,514,1700;759;1035;2160;475,601;437,1109,3363;601,1471;601;601;403,514,1700;514,1699,2254;403,514,1700;601;601;1106,1548;1441,1442,1443,1444;523;1427,2306,2601;33,430,1002,1705;1471;923;514,601;908;601;759;1109,3506;1706;1821;1471;2159;2170;2170;2170;1471;1567;601;417,1308;1406;1471;1471;1767,1768;486;1014;1651;417,1765;1397;1799;3133;950,951;1802,1816;1471;1295;585,1708;1651;1471;1320;2504;3205;34;1702;1651;1629;1471;1820;1406;1106,2087;1767,1768,1769,3481;417;1471;1776;1400;1877;601;599;1130,1705;601;1706;2615;1737;1802;1471;2441;759;601,2845;950,951;601;2334;348;950,951;601;601;1350,2707,2708;1351;1471;1706;2123;554;601,1767,1768;2851;1471;640;2991,2992;1471;1706,1707;1709;652;33;600;481;403,1707;1471;1802,1816;1802;601;462,511,512,513;277;379;916;65,66,67;1254;1254;31,379,963;2032;1188;1229;1406;691,1534,3029;481,1802,2434;2460,2461;1471;3240;1707;1471;688;437;821;1799;2652;1705;1776;1776;348;1471;1776;1471;303;2467;31,424,1002,1863,1865;1345;767,1471,2394;1534;376,377,378,1651;3726;1471;1471;1471;1142,3595;31;2005;1707;2887;1106;896;950,951;742,1651;1776;1471;1471;31,424,1002,1863,1865;31,424,1002,1863,1865;1802;662,1471;1652;1471;117,1471,1554,2743,2947,2948,2949,2950;2092;1424;1471;1471;1471;1471;1471;461,837;1471;408;950,951;601;475;601;119,120;122,1534;1471;1471;699,1705;437,1002,1734;407,1705,1706,1707,1708,1734;3470;1254;3314;163,164;1471;364;2591;554,601;1471;81;1471;1802;1802,1816;1471;640;1776;1802;807;1776;379,1105,1106,1107,1109;2126;1776;117;616;601,2177;122,1802;1705;31;1651;1407,2236;3295;1579;455;171;786;1776;307;1471;372;1471;1866,1867;601,2163;601;417;657,1471;409;3794;409;802;2916;1471;31,699,2540;1439;134;399,400,1651;1802;1471;1406;1406;2843;601;2189;601;601;2893;1471,1767,1768;31,940,1854;1471;640;134;1534;31;34,3701;601,2199;31,1534;1254;1802;1707;785;122,1405;1254;348;2486;2489;1802;1802;261,262;711,837;31;31;1406;3263;1802;837;1406;1471;1708;31;1471;601;31,424;34,640,1614,1617,1618,1645;3067;940;601;1178;31,449;441,475;950,951;466;3136;1534;31,408;34,601;1705;31,601;31,408;1534;1705;379;31,408;1494,1496,1497,1498;417;601;417,1765;1651;960;1471,2834,2835,2836;1471;475;1651;1471;1471;461,1291;1802;1802;372,792;1651;3756;1471;372;1109,3506;475;950,951;889;1762;1471;31;0,1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,337,338,339,340,342;759;81;574;1355;601;1675;117;950,951;601;1802;581;31,408;950,951;759;759;759;1705;1802,1816;1471;1709;662;569,1452,1453;1706;384;514,601;1471;395;2054;428,511,512;17,337,338,339,340,341,342;810,1551;1706;1471;2126;601;31,1708;3576;2302;1002;475;1687;601,3461;34;31;1331;395;1436;1471;1708;297;1776;1651;333,334,335,336;395,1687;987,1001;837;31,424,1711,1863;31,424,1711,1863;601;601;1471;759;1471;1651;1705,1706,1707;1889;1889;1471,2698,3053,3054;581,1166;2381;2241;1471;1471;348;31;950,951;1413,1424,1471,2794,2795;1471;447;662;656,863,1704;950,951;1471;31;1002;1254;117;1543,1574;1959;1471;837,1431;1406;1471;1229;645;134;1944;1794,1795,1796,1797,1838;1471;1254;1026;958;1802;2492;1406;1471;148;1651;1002;117,2448;475;1188;1802;1254;1471;662;1471;950,951;601;31,461;403;601;31;601,878;601;3727;1820;1875,3577;230,231;1802,1816;888;31;1802,1816;786;759;1779;1471;403,1243,1244;242,243;1776;1308;1802;1651;1705;601;1471;601;523;806,807;554,878;3794;395;619,1196;2017;395;1802;3428;1802,1816;1471;1254;837;31,1534,3130;31,1534,3130;1041;873,874,875,876;165,300;1216;746;1802,1816;1776;31,466;1471;1706;372;601;424;403,461,1504,1705;2650;3022;1471;3428;1471;372;601;1471;1627;1651;1707;1002,1534;1706;486,564;1254;1238,1471;475;1471;2374;1471;1471;601;462;601;792,1471;31;379;1776;1109,3506;1109;1109,3506;2873;3030;837;372;1531,1532;1251;1707;117;424,1109;1471;31,410;1802;514,601;372;1651;3792,3793;1534,3352,3353,3354,3355;1471;1106;1254;31;403;1229;1534,1737;1802;1802;31,1534;554;3428;1142,3595;475;792;1724,1725,1726;1799;1219;2770,2771,2772;640,1471,1592;384;1707;1471;403,1707;1299,1411;1471;624;117,1783,2448;918;34,1471,2373;2629;364,1132,1133;807;759;1534;215,216;2502;1651;1471;1311;1706;1188;34,1256,1868;437;975,1497,2853,2854,2855,2856,2857;403,1707;1471;601;364;3489;601;2588,2589,2590;376;789;514,601;601;1534;1188,1471;31,556,601;117,796;461,1561,2521;557;554;1802;1383;462;1578;2734;2277,2278;1002;1573;950,951;703;1061,1471;1471;1799;1776;1802;1471;1534;1471;461;688,1109;372;676;1471;462;601;1708;1350,1802;759;403,1707;2166;1471;1471;554;31,408;1471;1651;1471;1776;31,1645;372;1471;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1990;2486;1029;1471;514;1651;409;1345;1802,1816;1002;1471;1471;1651;1706;364,1132,1133;2053;1645;1471;372;601;1471;1534;1802,1816;1802;1802;1471;2134,2135;31,1590;1254;417,1477,1521,1522,1523,1524;1254;1471;1254;1254;950,951;1254;759;1471;364,1132,1133;1820;417,1765;772;2022;1242;2254;1471;397;1802;759;601;1802;1331,1332;837;475;31,1537,1538;1802;1651;1802;1802;31,2188;837,1628;2028,2029;2029;1803;693;935;950,951;759;861;601;1802,1816;305;1061;1471;1705;1448,1449;1239;2687;1471;1802;1503;1471;3806;404;1802;1528,1529;1534,3352,3353,3354,3355;656;1776;1705;601;395;601;601;601;1255;1802,1816;814;1109,3506;364,1132,1133;640,1642;1427;390;1706;1534;1471;372;31;3840;1471;1471;601;2586;1317;1254;1254;2917;1002;1802,1816;1471;903,1106,2052;1471;507,837;601,1103,2413;2113,2423;1471;1737;1616;993,994;1254;601;379;1802;523;122;364;1530;759;1737;1651;1471;1651;569,1452,1453;1534;1471;-2969;3638;1471;1802;409;1651;554;1802;1471;364;942;711;601;632;601;1708;31,32;31;837;1010;1471;601;376,1802;3794;61,62;601;1705;759;379,1668;1471;141;1802;117;1130;950,951;601;31;601;1471;2187;1471;1254;1002;31;31;1534;1534;1471;31;1002;461,763,1544;2617;1254;1471;1651;1471;241;1734;1002;240;2193;437,1002;384;417,1765;3041;759;1562;1802;424;1254;1471;759;759;31,408;1002;950,951;1432;1802;1414;409;1471;2049;2649;2458;376;1651;1471;34;1651;662;632;475,601;601;372;1776;786;465;475;1471;1776;422,601;601;601;557,601;581;3862,3863,3864,3865;486;1002;1157;1471;1254;1534,3352,3353,3354,3355;1534;384;31;1471;909;2809;1471;1471;662;1090;1471;1776;1802,1816;1471;417;3769;601;2922;31;814;2958,2959;34,1256,1868;2147;408,441,557;475;601;1776;1471;81;31;475;1204,1210;759;556,1695;601;601;403;452;759;601;601;475;403,830;440,475,601;759;1668;942;1802;1161;1776;2187;1109,3506;662;1766,2473;1471;417,1765;376,1802;2734;1651;1254;2105;1841,1842;102;3501;32;2734;789,1975;950,951;1471;768,1776;1802,1816;117;1002,3276;1471;1776;1471;1471;417,2189;789;1534;1802;1471;1471;1802;3462;403;1471;1471;662;3280;475,601;438;1471;31;364,1132,1133;81;1471;2351,2352,2353;1802;3791;497;1214;1393;475;1651;1144;601;950,951;1229;2161;759;950,951;759;950,951;1229;601;576;557;950,951;33;3359;601;601;31;31;1471;1002;601;1002;1706;461,763;1471;1820;2126;117,2448;376;403,1707;3190;379;624;1471;1651;424;1578;2705;3724;403,1707;31;1254;507,777;2880,2905;475,514;1471;372;113;1406;1534;1534;1388;1534;903;31;1254;31,1002,2808;408;475,601;1802,1816;2302;1706;1704;1109,3506;1707;1534;1109,3506;422,581,601;31,1109;396,486,552,1708;1704;1345;31,424,1708,1711,1863,1864,1865;272,273,274;1106;236,237;601;31,1604,1645,2798,3291,3292;942;662;372;31,424,1002,1863,1865;482;2159;31,461,1002,1333;1443,1456;1471;837;440;1646;640,1541,1542,1543;1799;1753;624;1393,2388;34;1626;812;113;1228;1802,1816;1706;624;601;1840;711;1471;31,1002,2912;409;396,581;1333;117,789,2448;1471;1776;1254;1061,1471;1802,1816;625;868;365,2311;1802;307,308;632;3428;1471;1471;1016,1017,1018;122,656,2865;403;786,1130,1251;1746;1706;2734;165;1254;3350;3145;140;1002;32;1471;92;408;31;880;601;31,940,1854;31,1855,1856;348;2552;1471;897;1254;250,252;3720,3721,3722;367;150;461,711,1502,1575;1802,1803;1803;486,1036;2734;1254;1254;1802;3223,3224,3225;31;31,2559;1802;417,1477,1521,1522,1523,1524;31;581;640,1502,1615,1616;1471;117;31;467,601,1694;1471;1534;1706;981;601;31,1537;31;1776;601;31,2640;601;395,440,507,514,1072,1073,1074;31,1002;403,1707;1061;1534;16,19,20,21,22,23,24,25,26,27,28,29,30,354,355,356,357,358,359,360,361,362,363;1150;535,536;31;409;554,837,2712;117;1651;1754;759;1910;462,601;31;134;1471;1106;1802;1802;1471;1799,1820,1823;1773;792;134,264,265,384,1783;1254;3421,3422,3423,3424;3421,3422,3423,3424;16,19,20,21,22,23,24,25,26,27,28,29,30,354,355,356,357,358,359,360,361,362,363;950,951;3070,3071;601;31;950,951;950,951;601;950,951;950,951;395;1245,2043;554;601;601;1708;640;34;786;2197;1471;1109,3506;1471;1471;1471;404;1712;441;1802,1816;403;403,494;601;1331;601;395;1021;1398,1399;31,424,1707,1863,1865;1109;1802;1254;2734;2762;1471;475;601;1002;2206;3175;1303;117,1782,1783,2448;1471;1471;1471;601;2430;1002;950,951;1534,3352,3353,3354,3355;950,951;675;1471;3566;1841,1842;417,1477,1521,1522,1523,1524;950,951;950,951;1471;3645;376;662;942;1802,1816;1651;268,269;364,1132,1133;1776;1802,1816;34,3492,3493;662;759;554,601;475;601;1802,1816;3015;759;31,529;601;1331,2954;540;379;763;2698;1130;2944;1471;390,1228;662;1254;601;1406;1471;31,32;424;1471;31,32,33,34;1802;1802;1126;1254;950,951;31,1537,1538;1471;1471;2753;1471;2261;2895,2896,2897,2898,2899;1706;1776;1106;2374;31,32;1471;1471;414;1776;1708;404;1002;1776;795;246;1767,1768;892;657;3356;1471;403,1707;1802;1651;630;1254;441;1799;122,139,3672,3673,3674,3675,3676;1802;1534;372;1475,1476,1477;1707;1471;1471;1471,1534;640,1683,1764,1916,1917,1918;1776;807;807;756;499;798,1130;3428;316,317,364;117;1802,1816;372,711;364;1651;403,514,1700;1471;711,3428;662;1471;2364;2447;301,302;1471;1142,3595;3595;1471;1802;581;1709;1645;601;1707;1471;1996,2474;1707;2126;1345;1651;1471;1471;31,34,554,1256,1868,1869;601;1471;1471;403,514,1700;1941;548;1941;975,1497,2853,2854,2855,2856,2857;2142,2143;461,1002,1238,1278;1471;1753;475;759;1471;2877;364;1534;1254;1002,3202;632;507;403;3368;977,1462,1463;950,951;2538,2539;901;601;1384;1254;1254;983;33,3834;810,1551;1802;461;759;759;31;1767,1768;1984;1254;662;1803;422;601;878,962,2965;417;134;3822;792,3173;1471;475;417,1427;1112;691,837,1251,1996,2148;1471;590;475,483;422,581;395;2175;950,951;3118,3119,3120,3121;83,3008,3010,3011,3014;475,601;1002;1355;540;727;1406;1753;1651;1002,1101,1850,1851;403;3435;1471;1841,1842;1841,1842;441;2173;1776;601;601,1471;1651;3725;630;514,1698;601;1002;759;1254;31;1471;1471;540;860;860;1254;759;601;2187;417,1765;1471;1534;1651;1471;117,2448;1755;364,1132,1133;1946,1947;950,951;1471;662;1471;1212;210,211;601;601,2132;2122;1776;1216;1706;1802,2498;661;117;950,951;1471;1802;3428;117;417,1534,1767,3451;348;31;508,554,1045,1092,1705;1106;134;507;662;640,3521;3335,3336,3337;3335,3336,3337;3335,3336,3337;1651;1262;31;1471;1802;2087;1471;409;1095;1776;31,32;1061,1471;34;950,951;950,951;2002;3285;1841,1842;1254;1254;1254;1471;1315;1471;1471;1707,2192;601;31;2342;1471;1562;447;1471;1471;1651;1345;1651;446;1348,1349,1350;606;1471;1737;364;348,461;1471;1471;1705,1706,1707;1802;1188,1471;662;461;632;31,32;1802;1002;1203;364;1776;2163;1471;1534;1254;1802;950,951;2058;34;1471;1802;514,601;759;31;2435;950,951;1802;2126;417,1765;3428;861;759;1471;786;1801;31;1471;1766;759;117;601;759;1706;1802;1651;3443;31,3341,3342;1707;1708;1471;1471;17,337,338,339,340,341,342;862;1178,1216;140;364;403;601,1734;2458;3276;1802;1471;3578;1706;759;1802;1802;376;3223,3224;601;2458;942;1471;462;1027;403;379;1471;126,127;1471;1254;1599,3678;1002,1109;516;601;759;1802;894;3509;662;2428;1652;1802;1471;1651;2163;1707;1776;461;2156;475;2248,3057;3263;1776;1355;34,1737;1471;1471;662;1802,1816;1471;2576;1850,1851;419,420;3759;1534;608;1226;1729;1975;849,1802;1534,1737;601;950,951;601;1471;2254;601;1471;1471;31;1471;1064;1776;1776;807;950,951;1708;789;1002;1707;1471;31,461,1488;31;2049;1471;1471;2415;2014;441;1109,3506;475;2170;2170;601;1802;601;3440;475;1471;1333,1737,3081,3082;601;475;1803;1776;1645;3452;1471;950,951;807;417,1765;1029;430;1706;1471;601;1254;789;1471;409;1471;159;2126;1471;1471;1471;2307;31;475;601;601;1713;1002;601;34,554;1471;1576;403,3837;1254;1539;1471;601;1802;364;837;1705;1548;1651;31,462;919,920;1109,3506;1257;1471;1343;1471;3643;1471;2605,2606;1799;1534;1802;1002;1534;1109,3506;31,424,1863,1865;1109,3506;557;372;116;1996;31,407,424,1002,1863;1704;1534;1534;1002;1471;1109;417;122;1106,1471;1933;1802;31,32;2020;364,1132,1133;2290;601;2336;2126;1651;1471;1471;1471;3316;2390;475;395;1432;1331;601;1471;1776;447;624;1564,1565,1566;149;2466;1820;1471;3633;1708;1708;1471;1242;1385,1386;1471;1802;1471;486;1651;1475,1476,1477;1776;868,2311;1776;1776;1802;1471;117;601;2126;1471;601;31,1737,2123,3077;601;601;31,2975;1334;759;759;1222,1471;475;3537;1802,1816;1651;837,1458;2342;122;1254;3089;1220,1251;792;144,145;1651;31;2893;1706;1651;424,1109;117;3496;950,951;759;759;520,601;559;1130;523,1707;1471;1642;1471;376;1907,1908;1238;701,1359;1706;1471;372;601;2254;403,514,1700,1701;422,581;950,951;759;122;601;759;348;1471;364;1471;3497;117,3286;1706;1708;403,494,495;1471;1251;31,424,1712,1863,1865;2011;514;31,424,1534,1863,1865;1106;1471;1471;601;1188;601;540;1534,3352,3353,3354,3355;1471;424;1841,1842;1173;1414;155;475;759;601;1471;601;3428;410,640;1471;942;1705;1471;711;2455;475;3565;1471;1802;476;601;1651;1471;759;729;1471;788;1471;1501;417,1765;1254;759;624;1802;1471;1802,1816;786;601;759;1471;403,462;624;1130;1802,1816;1802;1651;1802,1811;873,874,877;3671;31,1749;1106;1802;601;1767,1768;165,166;837;2397;2397;601;554;786;1705;2942;601;3861;601;2282;1471;601;31,1537,1538;2012;1802;892;417;1109,3506;1228;3590;640,1541,1542,1543;1471;1471;861;640,1541,1542,1543;1802,1816;1658;1776;1254;1471;1130;950,951;2611;640;31,32,33,34;1057,1058;192,193;759;601;348;2723;1471;31,32;1106;1471;837;403,1707;1707;33,396,640;1471;31,1534,3130;117;1651;3810;1471;31;975,1497,2853,2854,2855,2856,2857;1471;1471;1776;31,32,33,34;31,32;1471;384;1776;1130;1802;1345;1002;384,624;1866,1867;1254;2711;640;833;475,1211;3356;364,1132,1133;662;792,839;1471;601;31;422,581,601;1471;372,837;1471;31,372,417;475;2187;1002;950,951;514,601;1249;558,559;3480;2219;1471;117;1534;1254;2121;759;601;3719;1471;789;1841,1842;1841,1842;1841,1842;1841,1842;2472;409;1345;1471;554,1002,1534;1651;117,1548;789;1059;713;3319;817;1254;950,951;1471;31;759;1651;1438;2589;2589;1254;475;569,1452,1453;1705,1706,1707;1446;423;1425,1426;950,951;384;759;792;1563,2151;117,417,1332,1489,1490;34,462,554,2334;950,951;557;950,951;759;384;1251;124;2070;404;2585;2189;2734;117;759;364,1132,1133;759;581;601;31;837;1471;1471;417,2077;641;1471;1471;1520;1651;1254;422;1130;601,2936;156;31,32;759;950,951;31,32;1802;990;1841,1842;31,32,33,34;554,601,1534;2401;601;31,32,33;2304;2163;601;1471;630;31,32,33,34;367;1707,2192;759;364,1132,1133;1471;601;1820;1753;1254;1254;1142,3595;81;1651,1802;1762;1753;840;523;1471;786;1776;461;31,461,1556,1557;1002;1651;1282;1471;3289,3290;1802;2126;1254;1471;1254;31,32;1065;367;3463;1548,1767,1768;1800;1758;1142,3595;1651;1802;601;3264;1254;92,3696,3697,3698;511,2202,2524;601;1776;2734;1471;1002;950,951;601,1102;1651;1802;1471;2841;601;1245;1802;1471;1471;122;2119;1471;1737;807;376;1706;31;409;92,3647;2414;880;395,601;1401;1002;557;441;2734;2734;1358;1651;1254;1776;1802;950,951;1471;376;950,951;2126;486;554;2199;1471;601;610,611;600;942;1709;1254;1241;1802;601;364;833;1355;554,1704;475;608;101;581;1802;1471;1471;1471;1651;2838;603,700;1387;1982;601;950,951;117;31;3277;31,1534;683;1471;3594;31,1537,1538;1503;403,514,1700;759;554;403,514,1700;828,829;427;1340;2969;624;605;403,1707;1776;1705;1471;2893;1471;759;2500;1753;2170;2170;1095;1471;1471;3160;1776;601;1471;1254;1427;1776;807;1802;1471;2336;1802,1816;601;2201;31,32;117;1471;1471;31,32;418,601;1802,1816;1254;376,1266,1651;2135;475;1776;409;117;31,32;31,462;950,951;601;440,441,855;759;1002;1776;601;1802;1471;1471;1802;364,1132,1133;1802,1816;1471;1001;31,963,2045,2046;1471;1820,3259,3260;1002;1471;1776;447;1802;2880,2904,2905;422;81,1255;1109;1712;1776;1109,3506;250,1571,1572;1707;31,424,1863;1776;1802;1471;554;1254;1471;31,424,1002,1863,1865;1776;1706;1471;1238;1659;403,461,763;1776;1802,1816;624;1802;1776;1803;475,601;601;1802,1816;957;662;1802;1705;1776;1471;364,1132,1133;1651;1475,1476,1477;807;1471;1802;601;981,1104;1471;1707;379,1737,2123;483;675;601;1471;1706;1707;3811,3812;1254;1471;372;1393;601;601;1254;554,601;1776;2468;403,1707;1799;1254;1254;508;601;364,1132,1133;31;1216;540;1471;430,601,644;1802;1766;532;1432;601;554,1471;759;759;202,203,204;1159,1160;1961;3246,3247,3248;31,424,1534,1863,1865;1457;1534;1802;379,1706,1707;31,1706;117;1651;364,1132,1133;950,951;901;1802,1816;1309;136;1645;1002,2616;1651;3821;3421,3422,3423,3424;31,786;117,1783,2448;1471;1471;408;950,951;950,951;2892;950,951;2823;117;1706;1592;1651;903;640;662;31,424,1711,1863;894,1188;3467;1406;2893;475,601;1356;601;404;1705,1706,1707;408,1229;1471;601;421;1106;950,951;1707;1471;601;1709;903;31;2999;1471;447;1254;1708;1802,1816;1229;31;950,951;475;372;31;417,1765;3428;892,1154;1471;1651;475;31,32;759;1254;1772;3821;403,462;384;31,32;132;1471;2734;1802;601;601;1471;1471;1471;1254;2397;1471;601;413,414,415;460;462,990,1197;475;3428;395;1254;1776;601;215,216;2126;1705;1229;894;3496;1471;507;1776;403,1707;890;601;1802;1706;117;950,951;1534;1776;810,1551;1423;1254;1651;601,1471;1729,2497;31,486,509;1471;1802,1816;-3797;1033;1142,3595;1471;117;2778,2779,2780;1651;1471;447;1471;616;364;1002;837,1410,2756,2757;2900,2901;1753;3276;1345;1345;1345;1802;31,3126;701;698,2322;3293;1870;1471;2637;1802;3174;601;837;1471;1067;31,1055;31;1709;950,951;117,2448;1534;1799;2115;117;2734;601;837;632;864;1346;581;32,1101,1707,1847;1471;759;1471;759;1651;759;475;165,184;903;759;1254;1841,1842;-743,1841,1842;1841,1842;1841,1842;1841,1842;1345;600;1471;786;84,85,86;1345;1254;1254;1254;364,1132,1133;1802,1816;1002;1229;2257;1802,1816;3223,3224;1651;1471;1254;786;1471;1972;1471;554,1686,1746,2095;950,951;1776;81,1583;1471;1471;31;1708;95,3343;1178;372;1776;475,514;1802,1816;624;950,951;759;31,32,33,34;1471;1178;1776;462;1471;601;2221;1802,1816;1471;1471;1471;1251;379;981,1322;950,951;601;31,32;31,32,33,34;2734;1776;2304;601;1254;1254;1254;1802,1816;1802,1816;759;1651;1802;1254;1471;1471;1471;993,994;585,635,993,994;789,843;3185;1471;1802;3222;31,32,33,34;1642,3746;710,1776;1106;31,32;117;1471;1471;759;601;364;2436;3842;950,951;1762;942;2170;601;31,32,33,34;2087;396;638;141,1216;1255;1651;2160;1802;1471;376;1707;1937;1776;3648;624;408;1776;1016,1017,1018;1802;968,2118,2186;1471;601;2029;1996;1471;475;422,581,601;601;390;447;1651;390;1064;1188;1802;1802;567;601;600;861;417,1477,1521,1522,1523,1524;1802,1817;601;181,182;1841,1842;3218;2924;34;2958,2959;450,814,2634;942;950,951;1802;950,951;601;601;554,1471;475,601;942;942;1061,1471;462,520;1471;1471;1458,1471,1550;601;2170;404;507;601;1706;1255,1901;1820;31,32;1254;424;31,32;1534;31;1471;1229;1651;1471;587;1471;1106;1251;1471;1471;632;3311;711;2727;1471;1707,1712;1471;950,951;950,951;1471;1471;1776;627;381,382,383,1471;2709;1002;3657;1109,3506;2839;601;1802;601;1776;1424;1109,3506;554;1471;2109;789;1802,1816;1534;1254;3460;1705;31,424,1711,1863,1865;1866;1109,3506;31,424,1711;601;1708;1802;117,417,2611;759;31,699,1707;1706;31,424,1002,1863,1865;1471;348;1707;321,322;662;1802;1471;1148;1776;946;3154;1776;807;1776;1754;680,681;1802,1816;1802;1706;1471;868,2311;1776;31,32,33,34;1373;1870;1471;950,951;950,951;601;1041,2729;1802;1204,1205,1206,1207,1208,1209,1210;759;1471;364,1132,1133;1471;1106;1705;3083,3084;3137;1802;1651;1254;1802,1816;1705,2279;31,32,33,34;859;31;1471;3160;1471;122;1737;31;403;31;1534;1471;1534;1651;1651;1225;1254;1783;1424;1471;403,514,1700;1188,1471;601;2160;950,951;950,951;950,951;1684;624;1802;1078;601;31;1130;31;2704;880;1471;441;778;2160;31,408;601;1471;1471;950,951;1583;1673;1673;1471;1471;1106;1471;950,951;1471;31,117,447;1802,1816;404;1776;1253;942,2033;3140;554;2523;601;759;1475,1476,1477;364;403,1471;1331;1471;662,851;1471;662;1802;861;601;2155;676;2734;601;601;31,32,33,34;31;1471;1802,1816;1705;1776;1802;1534;1002;1471;792;2126;1802,1816;1471;441;1002;2770;1471;32;1471;122;31,2612;1471;-3797;601;792;2617;1238;554;1471;117;31;1471;601;601;386,1651;1002;1200,1201;662;601;3663;31;514;1651;601;1802;31,64;1802;1002;364,1132,1133;31,2187;3614,3615;2228;1041;117;447;857,1002;367;759;1471;2024;837;1471;372;1767,1768;1706;31,1534;1526;601;552;1471;786;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;967,968;1802;574;31,64;1471;854;1705;409,447;1069;601;1776;1254;1082;1802;1802;1802;1706;384;1471;1471;364;601;1471;364,1132,1133;1651;475,1229;1803;364,1132,1133;2734;1471;950,951;950,951;384;1471;1651;1567;892;1706;364;1471;1762;990;31,32,33,34;1802;1254;1651;1471;711;3595;1142,3595;1142,3595;1142,3595;2449;1471;417,1477,1521,1522,1523,1524;409;364;2342;1229;3520;364,1132,1133;1446;1707;447,842;1873;31,32;1788;662;1457;1471;3768;31,32,33,34;601;759;1254;31,32;1767,1768;1651;31,32;1776;1002;950,951;942;1800,1802;1802,1816;1651;1704;1368;1646;403,729;364;792,1471;1471;2627;447,462,601;2023;31,441,771;1471;3428;1353,1354;1044;1097,1651;1651;950,951;640,1866,1867;2957;1471;1802,1816;759;759;1802;950,951;348;807;1055;372;1802;662;918;1289;-3017,-3018,-3019,-3020,-3021;3694;271;31,1534,3056;372;620;1471;440,1692,1693;942;632;1471;31;624;601;2170;1471;2734;31,32;367,1086;348;1802,1816;1651;711,1471;31,32;386,389;1651;424;1706;836;1441,1442,1443,1444;31,32;1471;364,1132,1133;441;1651;167;1471;31;31,601;222;601;1776;950,951;1109,3506;1475,1476,1477;1776;1645;639;422,640,937,1707,2553,2554;31,424,1002;3653,3654;1471;1471;1471,3166;624;1471,1758;31;601;1776;1776;34;1370;325,1078;2103;1776;1776;1803;786;364,1132,1133;601;1802;1109;475;92;1982;2980;3226;1471;364,1132,1133;1254;1668;601,1668;403,732;395,514,601;1780;1753;789;1651,1656;1242;1002,3431;486;462;31;1706;789;1651;950,951;837;475;1471;1708;1471;1687;601;759;17,-32,337,338,339,340,341,342;364,1132,1133;379,830;1471;922;1068;404;1705;2504;1651;447;1436;662;1802;601;662;1471;1875,3577;601;601;447;1471;384;1188;1367;1254;950,951;601;134,540,3510;792,2375;1753;1776;34;31,32,33,34;1802;417,1427;1802;1776;1436;31,1534;1379,2117;1802;1893,2868;1802;31;1776;1471;1471;1142;1471;486;364;1767,1768;2387;601;1471;1455;31,32;1471;1471;1776;1471;2710;379;855;31,32;1345;2568;2568;601;364;2444;1471;507;409;601;950,951;2929;759;1471;1651;409;1841,1842;1841,1842;-743,1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1436;1753;422,581,601;1471;624;475;1651;601;759;1651;1471;1254;1776;1802;384;798;1776;1651;1802;1651;1471;1802;950,951;601;1471;2509;1471;1188;3107;2319;1471;417,1765;1471;981,3104,3105;990;134,141,3810;1458,1471,1550;1254;1471;1471;1254;1254;1254;892;1471;1471;630;759;1802;950,951;31,486;1254;447;2116;1678;1802;1705;1936,1937;1471;1254;592;1471;2677;601;122,712;31,32,33,34;550,1053;1471;1802;3575;559;2339;1471;601;1471;1707;1254;942;1903;1106;1651;1109,3506;1802;662;1295;1802,1817;1753;2223;942;2126;2838;215,323;1776;1254;3528,3529;2170;2170;807;1534;1229;2470;1471;1651;807;3638;1443,1456;1430;1836;514,601;601;122,656;1254;1238;1753;2019;1109,3506;931;1144,1290;601;601;1802,1816;1471;662;1471;1471;31;1318;1534;1534;2087;486;759;1471;31,424,1002,1863,1865;424;584,585;1753;1471;1443,1456;1802;915;1763;1471;1756;3118,3119,3120;1471;1776;1471;1803;1802,1803;117;807;3079;1802;31,32;1471;1229;409;1802;404;807;2264;1446;1483;117;1776;759;31,32,33,34;1802;2134,2135;3431;601;1045;31,1002;601;1705;1776;1651;1651;486;807;1651;1471;1802;1471;3619;483;1753;630;31,382,1197;1706;423;3528,3529;422;470;786;601,1002,1471;1109,3506;3024;1802;574;31,1534,3130;1800,1802;2126;1704;729;1802;601;1802;1229;1802;870;1471;601;489;1776;447;1708;327,328,329;3214;632;1223;2508;1528,1529;514,601;1534;1802;31,32;601;2391;1534;1446;554;1471;1471;367;1651;662;409;337,338,340,2932;1799;950,951;441;3243;1802;950,951;1002;1471;2710;2710;942;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;31,32,33,34;1408;2734;1651;601;461;601;600;2765;1471;1471;950,951;1802,1816;1802;2869;601;601;950,951;1254;1254;1254;786;3105;1802;31,32;31,32;122,481;942;1254;1254;1254;1471;31,32,33,34;2006;1305;1471;2112;1934,1935;1254;461;31,32,33,34;1471;294;1471;2875,2876;1471;1776;786;1355;1254;92,1632,1634,1635,1636,1637;1471;1776;1245;1802;417;1802;1471;31,1705;1471;1471;950,951;1573;1433;1776;3428;1062;1254;918;2136;1776;942;119,194;630;1254;1841,1842;1841,1842;2170;807;364,1132,1133;1471;601;384;1651;1753;601;447;1564,1565,1566;367;1802;2087;1051;1651;367;364,1132,1133;270;1973;1471;1802,1816;364;601;3074;1802;1802;1109,3506;372;1355;1328;1106;117;1802;1802;786,1642;228,232;2254;601,1471;915;1471;447;1651;31,1719,1865;31,32,33;786;31;31,32,33,34;31,32;395;1753;1841,1842;601;1651;2734;1776;31,32,33,34,1846;1841,1842;364,1132,1133;1471;2734;1651;1776;3528,3529;2617;915;1776;798;1228;3637;1471;786;640,1534;3595;-1500;364,1132,1133;601;279,280;447,489;1776;475;1706;1471;1799;1802;1471;1471;601,913;1471;2306;1841,1842;1841,1842;1841,1842;1841,1842;1471;1651;34;1776;31,32,33,34;2868;624;31,486,1706;1471;601,2259;1254;2432;1076,1262;1704;31,32,33,34;711;364;31,32;630;942;1436;1802;31,32,33,34;1776;316,3827;1471;3831;600;31;1998;786;662;1355;2399;2848,2849,2850;31,32;1254;1651;1534;1471;1802;1651;1471;540;1802;386;601;892;3294;1471;31,32,33,34;904;1794,1795,1796,1797,1838;1254;1754;424;1802;1034;31;31,3056;814;814;1471;942;942;1776;786;1802,1816;3596;364,1132,1133;475;117,2767;1776;1841,1842;31,32,33,34;405;1436;918;601;601;408;31,32;1753;1471;1471;1427;1776;31,424,1863,1865;1471;1471;1443,1456;1230,1651;364,1132,1133;624;1471;32;1299;2495;1802;1471;786;447,1106;379;1651;1471;950,951;1707;1753;3288;868;31,1080,1081;1651;2370;31,1708;662;1471;1471;1534,3306;1254;1651;403;1471;1471;2758;1706;1534;601;417,1765;1471;520,630;2613;364,1471;1802;376,1776;1802;630;1471;1802;1471;31;2330,2331;2660;1651;601;462;942;1471;1471;1841,1842;1841,1842;1841,1842;1841,1842;837,1331;1651;1651;1776;489;3528,3529;601;1471;417,1765;1706;1471;661;31,32;31,32,33,34;31,32,33,34;31,32;1841,1842;903;1651;409;1651;1705,1706,1707;950,951;1802,1817;1776;31,32,33;1776;786;1651;1471;1651;1715;1776;2734;1970,1971;1471;1802;1802;2957;1471;1651;549;324;31;1841,1842;460;814;3658;942;635;1841,1842;404;1002;1471;2734;1254;31,32;1383;632;1106;601;1436;1962;1802;1251;1660;364;1802;1802,1816;1471;1776;759;2239;3262;2754;601;196,197;1706;1704;417,1477,1521,1522,1523,1524;601,2199;1299;372;1651;1776;1776;2644;1534,3352,3353,3354,3355,3356;31,32,33,34;1471;1333;3528,3529;417,1765;1355;2432;601;404;1802;1471;2250;1471;117,2448;1242;1016,1017,1018;2055;122;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;1841,1842;154;31,32;1802;31,32;31,32;31;1471;2083;384;1776;662;447;2957;1651,3122;624;601;1471;1181;1802,1817;1802,1817;1776;892;1428;600;1841,1842;3250;1708;1802;81;1471;1471;807;1471;364;31,2758;481;1962;31,814;601;1802;573;92;1355;364,1132,1133;1471;1767,1768;31,649,650;2199;786;2292;1293;31,64;31,64;1841,1842;1471;632;364,1132,1133;31;1113;1471;1471;1254;364;507;1336,1707,1712;1471;1471;3595;915;1471;1651;786;1841,1842;1841,1842;1651;143;3777;2135,2137;507;31,32,33,34;1705,1706,1707;3528,3529;1705;3601;498;2957;1188;1841,1842;1708;1109,3506;3180;409;1753;2734;1651;1188;1471;384;169,170;1106;1471;2773,2774;2614;1706;1355;372;1776;1651;1651;1802;31,32;1776;1471;1471;320;2635,2636;1841,1842;1471;3528,3529;1471;1912,1913;403;3595;1737;1471;569;1841,1842;417,858;367;711;31,32,33,34;1802;1471;600;786;1802;3487;1471;789;1841,1842;364,1132,1133;31,32,33,34;31,1534,3130;1471;376;349,350,366,367,3846;1109;31;31;1471;1776;2126;1471;1471;351,352;1471;1841,1842;3528,3529;428,461,763,1708;364,1132,1133;1471;1471;379,600;3528,3529;3528,3529;632;3442;117;755;1436;117;601;32;1534;31,1197,1238,1752;786;1436;1116;3131;1471;1707;3528,3529;2609;364;1391;2902,3111;1471;600;1355;3528,3529;1390;1534;447;3528,3529;1471;3528,3529;1708;2441;1802;1355;3528,3529;1651;786;786;31;2024;32;31;3528,3529;601;976;1471;3530;1651;1471;1471;81;422,600;1841,1842;141,1631;895;3528,3529;32;1841,1842;486;903;3358;1471;409;3528,3529;929;798;601;3528,3529;1471;3528,3529;1471;34;208,209;31,64";

const $scriptletHostnames$ = /* 13436 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","qmh.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","ntv.cx","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","app.com","arbsd.*","atv.com","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","crn.com","ctrlv.*","dbna.de","dciuu.*","deco.fr","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","dnj.com","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","f6s.com","fakt.pl","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlb.com","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rgj.com","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vids.st","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","2tencb.*","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9mod.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anigo.to","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","bzzhr.co","bzzhr.to","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fyxxr.to","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","index.hr","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kagane.*","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","km77.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","miruro.*","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","scmp.com","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","sj-r.com","slant.co","so1.asia","splay.id","sport.de","sport.es","spox.com","sptfy.be","stern.de","stfly.me","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","turbo.cr","turbo.fr","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","aagmaal.*","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","dzapk.com","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","europix.*","evaki.fun","evo.co.uk","exego.app","expres.cz","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.ml","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javsub.my","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lecker.de","legia.net","lenkino.*","lep.co.uk","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lohud.com","lookcam.*","lootup.me","los40.com","m.kuku.lu","m1xdrop.*","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mgread.io","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","noxx.to>>","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rfiql.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rophimz.*","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","sat24.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","stly.link","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","sulasok.*","swame.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tubev.sex","tubexo.tv","tukoz.com","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upbolt.to","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vipurl.in","vladan.fr","vnuki.net","voodc.com","vplink.in","vsembed.*","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","webex.com","webmaal.*","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xca.cymru","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zokaj.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9anime.vip","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","alphatv.gr","amboss.com","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","avtub.cx>>","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","caller.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","capital.fr","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chad.co.uk","chiefs.com","ciberdvd.*","cimanow.cc","cinehd.app","cinemar.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cuttty.com","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drakkar.st","drivebot.*","driveup.in","driving.ca","drphil.com","dtmaga.com","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebc.com.br","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fastly.net","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gamezop.io","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gentside.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","goerie.com","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hochi.news","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","huavod.com","huavod.net","huavod.top","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indoav.app","indoav.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","kaamuu.cfd","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","labgame.io","lacrima.jp","larazon.es","ldnews.com","leakav.com","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","mdplay.top","medibok.se","megadb.net","megadede.*","megaflix.*","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","meteox.com","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mpnnow.com","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","napmap.net","natalie.mu","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pitube.net","pixelio.de","pixvid.org","pjstar.com","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","plejada.pl","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rrstar.com","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","salina.com","samash.com","sanblo.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skinmc.net","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sohot.cyou","sokobj.com","solewe.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpalm.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiscali.it","tmnews.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vcloud.lol","vcstar.com","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidbox.dev","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduro.top","viduyy.com","viewfr.com","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vstream.id","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","worder.cat","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ystream.id","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","and-more.co","andiim3.com","anibatch.me","anichin.top","anigogo.net","anihq.org>>","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arakpop.net","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","axomtube.in","ayatoon.com","azmath.info","azmovies.to","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blavity.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","braflix.win","brbeast.com","brbushare.*","brigitte.de","bristan.com","browser.lol","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civicxi.com","civitai.com","civitai.red","claimrbx.gg","clapway.com","clkmein.com","cloubix.com","cloudfam.io","club386.com","cocorip.net","coinclix.co","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","criczop.com","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","daily.co.jp","dailyweb.pl","damitv.live","daozoid.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dlstreams.*","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dstat.space","dsvplay.com","duboku.info","dudefilms.*","dz4link.com","e-glossa.it","e2link.link","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","embasic.pro","embedhd.org","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","feedzop.com","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","fosters.com","foumovies.*","foxtube.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamedrive.*","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","genpick.app","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","glianec.com","globetv.app","go.fakta.id","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gumtree.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hornyhill.*","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","htrnews.com","huaren.live","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itavisen.no","itpro.co.uk","itudong.com","iv-soft.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbobo.com","javboys.com","javcock.com","javdock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jkanime.net","jnovels.com","jobnoid.net","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","kumaraw.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","manga1000.*","manga1001.*","mangahub.io","mangasail.*","mangatv.net","mangayy.org","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","motphimr.io","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrexcel.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onlyfans.to","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","pokopow.com","polygon.com","pomorska.pl","pooembed.eu","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","quizzop.com","radamel.icu","raiders.com","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","realbbc.xyz","redding.com","redgifs.com","redlion.net","redporno.cz","redtub.live","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","rogoyume.jp","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rubystm.com","rubyvid.com","rugby365.fr","rule34h.com","runmods.com","rvguide.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sctimes.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smarturl.it","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sonyliv.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamgg.net","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamix.so","streamm4u.*","streamup.ws","strikeout.*","strp2p.site","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","swtimes.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","thapcam.net","thaript.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","timeful.app","titantv.com","tmailor.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","tukoz.com>>","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uticaod.com","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","veronica.uk","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipshort.in","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webtoon.xyz","weerslag.nl","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xcandid.vip","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","yurn.online","zedporn.com","zeilink.net","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1primewire.*","2017tube.com","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","398fitus.com","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","5moviess.com","720pstream.*","7hitmovies.*","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","afrotech.com","airflix1.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amarillo.com","amateur8.com","amestrib.com","amnaymag.com","amtil.com.au","androidaba.*","anhdep24.com","animalia.bio","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animelok.xyz","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninami.site","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","anonmp4.help","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apnablogs.in","app.vaia.com","apps2app.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","astrozop.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","brainzaps.tv","brawlify.com","bright-b.com","brobokep.org","bronco6g.com","bsmaurya.com","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","bysebuho.com","bysekoze.com","bysewihe.com","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camaro7g.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","cataz.stream","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","cdn.vifey.de","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","cjonline.com","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","daotekno.com","darkibox.com","datacheap.io","datanodes.to","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","dispatch.com","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","doodstream.*","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","euronews.com","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","facebook.com","factable.com","fairyhorn.cc","faiviral.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmifen.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","fxpornhd.com","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gelbooru.com","gentside.com","gerbeaud.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","greekfun.net","grigtube.com","grosnews.com","gseagles.com","gsmarena.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","hanime24.com","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaicube.*","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","heqviral.com","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hometalk.com","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indian-tv.cz","indianxxx.us","indystar.com","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jconline.com","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","knoxnews.com","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","lineup11.net","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakita.id","mangakoma.ac","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masahub2.com","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","miixdrop.net","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkvcinemas.*","mlbstream.tv","mmsbee27.com","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momspost.com","momxxx.video","monaco.co.il","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","njherald.com","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","of-model.com","oimsmosy.fun","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","ondebola.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pal-item.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pcgamesn.com","pdfindir.net","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","petguide.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.1188.lv","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playmogo.com","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornobae.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","proxyorb.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranger5g.com","ranger6g.com","ranjeet.best","rapelust.com","rarepike.com","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","scotsman.com","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","starcima.com","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","supramkv.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tacoma4g.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","telegram.com","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tieulam.info","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokuzl.net>>","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","truyenvn.dev","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv3monde.com","tvappapk.com","tvasports.ca","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umogames.com","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","utsports.com","uur-tech.net","uwatchfree.*","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vijviral.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vivasexe.com","vocalley.com","voirseries.*","volokit2.com","voznovel.com","warddogs.com","warezcdn.lat","wargamer.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhamster46.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxpicss.com","xxxputas.net","xxxshake.com","xxxstream.me","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zpserver.com","zvision.link","zxcprime.icu","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","4runner6g.com","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","aniworld.to>>","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoembed.app","autoextrem.de","autofrage.net","autoguide.com","autoscout24.*","autosport.com","autotrader.nl","avnsgames.com","avpgalaxy.net","azcentral.com","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","buienalarm.nl","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canlikolik.my","cantonrep.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.com","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chieftain.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","cotemaison.fr","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cuisineaz.com","cumlouder.com","cuttlinks.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailymail.com","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desertsun.com","desifakes.com","desijugar.net","desimmshd.com","devsoftwr.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.*>>","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedseek.xyz","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","ev3forums.com","exe-links.com","expansion.com","extratipp.com","f150gen14.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","galesburg.com","gamearter.com","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesider.com","gamesite.info","gamesmain.xyz","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","goupstate.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","guessthe.game","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaicop.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hillsdale.net","hindimovies.*","hindinest.com","hindishri.com","hindisink.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hostzteam.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hutchnews.com","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgouskel.sbs","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itdmusicy.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.com","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jlaforums.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kanald.com.tr","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","kitsapsun.com","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kurashiru.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkshortx.in","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-tube.me","manga18fx.com","mangabats.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","math-aids.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maxegatos.net","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memedroid.com","menshealth.de","metalflirt.de","meteocity.com","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miiixdrop.net","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morencius.com","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","multicanais.*","musicsite.biz","musikradar.de","mustang6g.com","mustang7g.com","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakastream.tv","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newportri.com","newschief.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","nlcosplay.com","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","oakridger.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","oklahoman.com","onemanhua.com","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","openlua.cloud","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primewire.*>>","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","recordnet.com","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortnest.com","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","statesman.com","ster-blog.xyz","stereogum.com","stock-rom.com","str8ongay.com","stre4mpay.one","stream-69.com","stream4free.*","streambtw.com","streamcash.to","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.dev","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techybuff.com","techyrick.com","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","theintell.com","thejournal.ie","thelayoff.com","theledger.com","thememypc.net","thenation.com","thespruce.com","thestar.co.uk","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","trilltrill.jp","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","twstalker.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vpzserver.com","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weeronline.nl","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","wordshake.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bgmiesports.in","bharian.com.my","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btvnovinite.bg","buccaneers.com","buchstaben.com","businessua.com","bustmonkey.com","bustybloom.com","bysefujedu.com","bysejikuar.com","byseqekaho.com","byseraguci.com","bysesukior.com","bysetayico.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","cg-gamespc.net","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cimanow.online","cincinnati.com","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","cpu-monkey.com","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","croq-kilos.com","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","daily-jeff.com","dailycomet.com","dailylocal.com","dailyworld.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","donegallive.ie","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ebooksyard.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","elnacional.cat","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","euronews.com>>","eveningsun.com","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","faitsfizzle.fr","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-4u3omzw0.nl","fuckingfast.co","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","getthispdf.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","gobearcats.com","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","growgritly.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heraldnews.com","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","houmatoday.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indeonline.com","indi-share.com","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksonsun.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","lcsun-news.com","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lenconnect.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","macheforum.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marionstar.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modapkfile.com","moddedguru.com","modenatoday.it","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","monroenews.com","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorcycle.com","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mprogaming.com","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naplesnews.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","news-press.com","newsbreak24.de","newscard24.com","newsherald.com","newsleader.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","papafoot.click","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pekintimes.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","pemersatu.link","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pinterpoin.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","play.xpass.top","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polsatsport.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","proapkdown.com","pruefernavi.de","purediablo.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","questloops.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","rcostation.xyz","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shelbystar.com","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","siusalukis.com","skat-karten.de","slickdeals.net","slidesaver.app","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","straemplay.org","stream2watch.*","streamdesi.com","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techcrunch.com","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennessean.com","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","the-leader.com","the-review.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thegleaner.com","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidquickly.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","wigantoday.net","willyweather.*","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","0123movie.space","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","abyssplayer.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","allclassic.porn","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","argusleader.com","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestensuree.com","bestialporn.com","bestjavporn.com","beurettekeh.com","bgmateriali.com","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","caminteresse.fr","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cheezburger.com","cherrynudes.com","chromeready.com","chzzk.naver.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","convertcase.net","coromon.wiki.gg","cosplaynsfw.xyz","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailyrecord.com","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","delmarvanow.com","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","detroitnews.com","deutschsex.mobi","dhankasamaj.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedplayer.xyz","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","farminglife.com","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fayobserver.com","fcportables.com","fdlreporter.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","fifetoday.co.uk","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fiveyardlab.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","flywareagle.com","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gainesville.com","game.digitap.eu","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","gosanangelo.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","guidetechly.com","gut-erklaert.de","hacksnation.com","halohangout.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiocean.com","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","johntryopen.com","jokerscores.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","leakgallery.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkvertise.com","linux-talks.com","live.arynews.tv","livescience.com","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","londonworld.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","mais.sbt.com.br","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","myanimelist.net","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","nemzetisport.hu","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nissanzclub.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","northjersey.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","paste4free.site","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phillyburbs.com","phonerotica.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","ramdomlives.com","rangerboard.com","ravennatoday.it","rctechsworld.in","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","rule34video.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.org","santhoshrcf.com","savannahnow.com","savealoonie.com","scan-hentai.net","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","slateforums.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starcourier.com","stargazette.com","starstreams.pro","start-to-run.be","staugustine.com","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sulasokvids.net","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tallahassee.com","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","taycanforum.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","thenewsstar.com","theprovince.com","thereporter.com","thespectrum.com","thestreameast.*","thetoneking.com","thetowntalk.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","timesonline.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokuzilla.net>>","tokyomotion.com","tokyomotion.net","tophostdeal.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","travelnoire.com","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","truyenhentaiz.*","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","uppercutmma.com","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","verywellfit.com","vfxdownload.net","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","wealthcatal.com","webmatrices.com","webtoonscan.com","wegotcookies.co","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","world-iptv.club","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xterraforum.com","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","aberdeennews.com","about-drinks.com","account.bhvr.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.khaddavi.net","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","augustacrime.com","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","bangyourwife.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","beta.plus.rtl.de","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","blueridgenow.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","bristolworld.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","bysedikamoum.com","bysesayeveum.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","capecodtimes.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courierpress.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofaucet.xyz","cryptomonitor.in","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","dakotaforums.com","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","derbyworld.co.uk","derryjournal.com","designparty.sx>>","desikamababa.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","divicast.watch>>","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","femmeactuelle.fr","fernsehserien.de","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","floridatoday.com","footwearnews.com","footymercato.com","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","gadsdentimes.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreegames.net","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","glasgowworld.com","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","harpersbazaar.fr","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hemeltoday.co.uk","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hometalkpaid.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","infinityfree.com","infomatricula.pt","inprogrammer.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jacksonville.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","journalduweb.org","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kawaii-anime.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","lk21official.*>>","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","lutontoday.co.uk","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-cccdoz45.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","meteoradar.co.uk","metin2alerts.com","milanreports.com","milfxxxpussy.com","milkporntube.com","misterdonghua.in","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsletter.co.uk","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocsummer.com.br","nontonhentai.net","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","nwfdailynews.com","officecoach24.de","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineathens.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","overtakefans.com","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","petoskeynews.com","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pilotsglobal.com","pinsexygirls.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","poconorecord.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","portsmouth.co.uk","post-gazette.com","postcrescent.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reporternews.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","rivianforums.com","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","scoutevforum.com","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenerdstash.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thestarpress.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tipsenweetjes.nl","tires.costco.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unionpayintl.com","uniquestream.net","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vvdailypress.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","woodmagazine.com","word-grabber.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xvideos-full.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","adrenaline.com.br","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","beaconjournal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","bryantenunder.com","bucksherald.co.uk","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","carensureplan.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","cheboygannews.com","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citizen-times.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","clarionledger.com","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cool-style.com.tw","coolmathgames.com","costcoinsider.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailyamerican.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtbikerider.com","dirtyindianporn.*","doctor-groups.com","dodi-repacks.site","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.net","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","fileditchfiles.me","financefernly.com","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","fitnakedgirls.com","fitnessplanss.com","flight-report.com","floridagators.com","foguinhogames.net","foodtalkdaily.com","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","free-wargamer.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gastongazette.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","googleapis.com.de","googleapis.com.do","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","heraldtribune.com","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","hyperosthemes.org","iedprivatedqu.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","integraforums.com","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","ithacajournal.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lectormangass.net","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lheritierblog.com","libertestreamvf.*","limerickleader.ie","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","liverpoolworld.uk","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lubbockonline.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","macanevowners.com","madhentaitube.com","malaysiastock.biz","mangakakalove.com","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","meltontimes.co.uk","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","nationalworld.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","newryreporter.com","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","patriotledger.com","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","player.kinoton.cc","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","pressconnects.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","rancheroforum.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","redesigndaily.com","registerguard.com","reloadedsteam.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","superflixapi.best","surreyworld.co.uk","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theadvertiser.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","times-gazette.com","timesnowhindi.com","timesreporter.com","timestelegram.com","tippsundtricks.co","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","bedfordtoday.co.uk","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","birminghamworld.uk","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","burnleyexpress.net","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cayenneevforum.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","climaaovivo.com.br","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","consejosytrucos.co","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","crm.urlwebsite.com","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dawgpounddaily.com","dcdirtylaundry.com","delawareonline.com","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dramathical.stream","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","enterprisenews.com","ericeastweight.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","eveningtribune.com","exactlyhowlong.com","expressandstar.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","favoyeurtube.net>>","fightingillini.com","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","guessthemovie.name","guessthephrase.xyz","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jeepreconforum.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","juliewomanwish.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","legiongamesgod.com","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lincolncourier.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mcdonoughvoice.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","melaterevancha.com","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","miltonkeynes.co.uk","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newarkadvocate.com","newcastleworld.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passeportsante.net","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","progress-index.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","record-courier.com","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporter-times.com","reporterherald.com","resultadostris.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","ryanagoinvolve.com","sabornutritivo.com","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seacoastonline.com","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","sheboyganpress.com","shemaletoonsex.com","shieldsgazette.com","shipseducation.com","shrivardhantech.in","shropshirestar.com","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","sooeveningnews.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sports-arena.space","sportstohfa.online","stapewithadblock.*","starnewsonline.com","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","sturgisjournal.com","sunderlandecho.com","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tauntongazette.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","thecalifornian.com","thecelticbhoys.com","theendlessmeal.com","thefirearmblog.com","thegardnernews.com","thegoldendaily.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thetimesherald.com","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tuscaloosanews.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldofpcgames.com","worldstreams.click","wormser-zeitung.de","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","bluemediadownload.*","bordertelegraph.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","collegeteentube.com","columbiacougars.com","columbiatribune.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","courier-journal.com","crackedsoftware.biz","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailycommercial.com","dailyjobposting.xyz","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","falkirkherald.co.uk","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.dailymail.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","heraldmailmedia.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","hollandsentinel.com","home-xxx-videos.com","horseshoeheroes.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ianrequireadult.com","ilbolerodiravel.org","ilforumdeibrutti.is","independentmail.com","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","jessicaclearout.com","joguinhosgratis.com","journalstandard.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kingjamesgospel.com","kingsofkauffman.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","lindalastattack.com","livetv.moviebite.cc","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","m.jobinmeghalaya.in","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minutemirror.com.pk","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","multicanaistt.space","mycentraljersey.com","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","norwichbulletin.com","noticiascripto.site","nottinghamworld.com","novelmultiverse.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","pcgamebenchmark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornosubtitula2.com","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","shreveporttimes.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","southcoasttoday.com","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamcasthub.store","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","thecrazytourist.com","thedailyjournal.com","theglobeandmail.com","themehospital.co.uk","thenorthwestern.com","theoaklandpress.com","therecordherald.com","thesaltysoldier.com","thesimsresource.com","thesmokingcuban.com","thetorquereport.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","timesrecordnews.com","timmaybealready.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","urbandictionary.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vickisaveworker.com","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weneverbeenfree.com","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","augustachronicle.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","boxofficebusiness.in","br.nacaodamusica.com","broncosportforum.com","browardpalmbeach.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","charlestoughrace.com","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","commercialappeal.com","consiglietrucchi.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fitbook-magazine.com","fle-5r8dchma-moo.com","football-ukraine.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-4urg44yg.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greenvilleonline.com","griffinathletics.com","hackingwithreact.com","halifaxcourier.co.uk","harboroughmail.co.uk","hartlepoolmail.co.uk","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homehobbiesdaily.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","irresistiblepets.net","italiadascoprire.net","itpassportgokaku.com","jemontremonminou.com","jessicayeahcatch.com","jlwranglerforums.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveonlinesports.net","loriwithinfamily.com","lostcoastoutpost.com","luxurydreamhomes.net","main.sportswordz.com","mangcapquangvnpt.com","maps.blitzortung.org","maryspecialwatch.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","milforddailynews.com","mkvmoviespoint.autos","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","oraridiapertura24.it","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","petbook-magazine.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","salamanca24horas.com","sanadegreecollege.in","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","sexypornpictures.org","socialmediagirls.com","socket.pearsoned.com","solomaxlevelnewbie.*","southbendtribune.com","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","statesmanjournal.com","steamunderground.net","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","the-daily-record.com","thedailyreporter.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","theleafchronicle.com","thepublicopinion.com","thesimplifydaily.com","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totallysnookered.com","totalsportek1000.com","toyoheadquarters.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","unblockedgames.world","underground.tboys.ro","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banburyguardian.co.uk","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","cantondailyledger.com","celebritydeeplink.com","charlessheimprove.com","collinsdictionary.com","comentariodetexto.com","conselhosetruques.com","courierpostonline.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","daventryexpress.co.uk","davescomputertips.com","derbyshiretimes.co.uk","desitab69.sextgem.com","desmoinesregister.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","ellwoodcityledger.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-nv2xl8an.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-3dtextureshd.com","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greatfallstribune.com","greenwichmeantime.com","guardian-series.co.uk","hackedonlinegames.com","heraldtimesonline.com","hersfelder-zeitung.de","higherorlowergame.com","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lincolnshireworld.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","mavericktruckclub.com","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","niederschlagsradar.de","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcmap.place.naver.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","petersfieldpost.co.uk","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","providencejournal.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scriptgrowagarden.com","scrubson.blogspot.com","scrumpoker-online.org","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","southsideshowdown.com","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","techbook-magazine.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","thenews-messenger.com","theprofoundreport.com","thesavvyexplorers.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","visaliatimesdelta.com","voyeur-pornvideos.com","walterprettytheir.com","warwickshireworld.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","wausaudailyherald.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worksopguardian.co.uk","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","anguscountyworld.co.uk","appstore-discounts.com","arbitrarydecisions.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","biggleswadetoday.co.uk","blackamateursnaked.com","blackpoolgazette.co.uk","brunettedeepthroat.com","buxtonadvertiser.co.uk","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","chillicothegazette.com","clixwarez.blogspot.com","comandotorrentshds.org","conceptoweb-studio.com","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewsburyreporter.co.uk","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","f150lightningforum.com","fantasticyoungporn.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","garylargeavailable.com","gdl.freegogpcgames.xyz","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","hucknalldispatch.co.uk","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jeepgladiatorforum.com","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","livingincebuforums.com","llanfairpwllgwyngy.com","lonestarconference.org","m.bloggingguidance.com","marissasharecareer.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","metrowestdailynews.com","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","news-journalonline.com","nilopolisonline.com.br","northamptonchron.co.uk","obutecodanet.ig.com.br","oeffnungszeitenbuch.de","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","osint-info.netlify.app","paginadanoticia.com.br","palmbeachdailynews.com","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","pontiacdailyleader.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","stornowaygazette.co.uk","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universityequality.com","wakefieldexpress.co.uk","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","battlecreekenquirer.com","bestbondagevideos.com>>","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","burlingtonfreepress.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","columbiadailyherald.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","examiner-enterprise.com","exclusiveindianporn.com","fightforthealliance.com","financeandinsurance.xyz","footballtransfer.com.ua","fourchette-et-bikini.fr","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","hattiesburgamerican.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","jefferycontrolmodel.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","lancasterguardian.co.uk","lancewhosedifficult.com","lansingstatejournal.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","myhomebook-magazine.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northdevongazette.co.uk","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pamelachangemission.com","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","peterboroughtoday.co.uk","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","poughkeepsiejournal.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","publicopiniononline.com","puzzles.pressherald.com","rebeccacostthousand.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","stevenspointjournal.com","streamtapeadblockuser.*","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","travelbook-magazine.com","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","cybertruckownersclub.com","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","doncasterfreepress.co.uk","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","jeanprofessorcentral.com","jennifereconomicgive.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","majorleaguepickleball.co","mansfieldnewsjournal.com","mariatheserepublican.com","marshfieldnewsherald.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","montgomeryadvertiser.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","northantstelegraph.co.uk","northernirelandworld.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","stream.googleapiscdn.com","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thescarboroughnews.co.uk","thunderousintentions.com","tirumalatirupatiyatra.in","tricountyindependent.com","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","bucyrustelegraphforum.com","burlingtoncountytimes.com","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","harrogateadvertiser.co.uk","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","lancastereaglegazette.com","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","pickleballteamleagues.com","pickleballtournaments.com","portclintonnewsherald.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","rotherhamadvertiser.co.uk","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","storage.googleapiscdn.com","telenovelas-turcas.com.es","thebeginningaftertheend.*","thesouthernreporter.co.uk","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","change-ta-vie-coaching.com","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","interestingengineering.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wisconsinrapidstribune.com","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","yorkshireeveningpost.co.uk","brittneystandardwestern.com","buckscountycouriertimes.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","kathyinformationwhether.com","leightonbuzzardonline.co.uk","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","northumberlandgazette.co.uk","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","richardquestionbuilding.com","rupertisdivingintoocean.com","sztucznainteligencjablog.pl","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","zanesvilletimesrecorder.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","jonathansociallike.commjuliewomanwish.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","61,62","moonfile","^moonfile-[a-z0-9-]+\\.com$","61,62",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","61,62","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","61,62","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","61,62","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","61,62","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","61,62","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","117,1534,2474"];

const $hasEntities$ = true;
const $hasAncestors$ = true;
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

const todoIndices = new Set();
if ( $scriptletHostnames$.length ) {
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
    $scriptletHostnames$.length = 0;
}

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
