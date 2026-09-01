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
        this.v2 = query.startsWith('v2:');
        if ( this.v2 ) { query = query.slice(3); }
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
        r.v2 = this.v2;
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
            if ( mv === this.#CHILDREN ) { return; }
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
        let needIdentifier = true;
        while ( i < query.length ) {
            const c0 = query.charCodeAt(i);
            if ( c0 === 0x5D /* ] */ ) { break; }
            if ( c0 === 0x20 /* SPACE */ ) {
                i += 1;
                continue;
            }
            if ( c0 === 0x2C /* , */ ) {
                if ( needIdentifier ) { return; }
                i += 1;
                needIdentifier = true;
                continue;
            }
            if ( c0 === 0x22 /* " */ || c0 === 0x27 /* ' */ ) {
                const r = this.#untilChar(query, c0, i+1);
                if ( r === undefined ) { return; }
                keys.push(r.s);
                i = r.i;
                needIdentifier = false;
                continue;
            }
            if ( c0 === 0x2D /* - */ || c0 >= 0x30 && c0 <= 0x39 ) {
                const match = this.#reIndice.exec(query.slice(i));
                if ( match === null ) { return; }
                const indice = parseInt(query.slice(i), 10);
                keys.push(indice);
                i += match[0].length;
                needIdentifier = false;
                continue;
            }
            if ( this.v2 ) { return; }
            const r = this.#consumeUnquotedIdentifier(query, i);
            if ( r === undefined ) { return; }
            keys.push(r.s);
            i = r.i;
        }
        if ( needIdentifier ) { return; }
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

function jsonEdit(jsonq = '', ...varargs) {
    jsonEditFn(false, jsonq, ...varargs);
}

function jsonEditFetchRequest(jsonq = '', ...args) {
    jsonEditFetchRequestFn(false, jsonq, ...args);
}

function jsonEditFetchRequestFn(trusted, jsonq = '', ...varargs) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit-fetch-request`,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.parseVarargs(varargs);
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

function jsonEditFetchResponseFn(trusted, jsonq = '', ...varargs) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit-fetch-response`,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.parseVarargs(varargs);
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

function jsonEditFn(trusted = false, jsonq = '', ...varargs) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}json-edit`,
        jsonq,
        ...varargs
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const extraArgs = safe.parseVarargs(varargs);
    const pattern = extraArgs.matches && safe.initPattern(extraArgs.matches);
    proxyApplyFn('JSON.parse', function(context) {
        const json = context.callArgs[0];
        const obj = context.reflect();
        if ( pattern && safe.testPattern(pattern, json) === false ) { return obj; }
        const objAfter = jsonp.apply(obj);
        if ( objAfter === undefined ) { return obj; }
        safe.uboLog(logPrefix, 'Edited');
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `After edit:\n${safe.JSON_stringify(objAfter, null, 2)}`);
        }
        return objAfter;
    });
}

function jsonEditXhrRequestFn(trusted, jsonq = '', ...varargs) {
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
    const extraArgs = safe.parseVarargs(varargs);
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

function jsonEditXhrResponseFn(trusted, jsonq = '', ...varargs) {
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
    const extraArgs = safe.parseVarargs(varargs);
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

function jsonPruneXhrResponse(
    rawPrunePaths = '',
    rawNeedlePaths = '',
    ...varargs
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('json-prune-xhr-response', rawPrunePaths, rawNeedlePaths);
    const xhrInstances = new WeakMap();
    const extraArgs = safe.parseVarargs(varargs);
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

function jsonlEditXhrResponseFn(trusted, jsonq = '', ...varargs) {
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
    const extraArgs = safe.parseVarargs(varargs);
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

function modifyXhrResponseFn(
    propsToMatch = '',
    modifierFn = ''
) {
    if ( typeof propsToMatch !== 'string' ) { return; }
    const safe = safeSelf();
    if ( modifyXhrResponseFn.xhrInstances === undefined ) {
        modifyXhrResponseFn.xhrInstances = new WeakMap();
    }
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const NativeXMLHttpRequest = self.XMLHttpRequest;
    const TrappedXMLHttpRequest = class XMLHttpRequest extends NativeXMLHttpRequest {
        open(method, url, ...args) {
            const haystack = { method, url };
            if ( propsToMatch === '' ) {
                safe.uboLog(`modifyXhrResponseFn() / Called: ${safe.JSON_stringify(haystack, null, 2)}`);
            } else if ( matchObjectPropertiesFn(propNeedles, haystack) ) {
                modifyXhrResponseFn.xhrInstances.set(this, modifierFn);
            }
            return super.open(method, url, ...args);
        }
        get response() {
            const modifierFn = modifyXhrResponseFn.xhrInstances.get(this);
            return modifierFn
                ? modifierFn(this, super.response)
                : super.response;
        }
        get responseText() {
            const modifierFn = modifyXhrResponseFn.xhrInstances.get(this);
            return modifierFn
                ? modifierFn(this, super.responseText)
                : super.responseText;
        }
        get responseXML() {
            const modifierFn = modifyXhrResponseFn.xhrInstances.get(this);
            return modifierFn
                ? modifierFn(this, super.responseXML)
                : super.responseXML;
        }
    };
    proxyToStringFn(TrappedXMLHttpRequest.prototype.open, NativeXMLHttpRequest.prototype.open);
    proxyToStringFn(TrappedXMLHttpRequest, NativeXMLHttpRequest);
    self.XMLHttpRequest = TrappedXMLHttpRequest;
}

function mpegdashPrune(
    selector = '',
    propsToMatch = ''
) {
    if ( typeof selector !== 'string' ) { return; }
    if ( selector === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('mpegdash-prune', selector, propsToMatch);
    const queryAll = (xmlDoc, selector) => {
        if ( selector.startsWith('xpath:') === false ) {
            return Array.from(xmlDoc.querySelectorAll(selector));
        }
        const xpr = xmlDoc.evaluate(
            selector.slice(6),
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
    const rePTparse = /^PT(\d+D)?(\d+H)?(\d+M)?([\d.]+S)?$/;
    const secondsPerDay = 24 * 60 * 60;
    const secondsPerHour = 60 * 60;
    const secondsPerMinute = 60;
    const secondsFromPT = pt => {
        const match = rePTparse.exec(pt);
        if ( match === null ) { return; }
        let seconds = 0;
        if ( match[1] ) {
            const d = parseFloat(match[1].slice(0, -1));
            if ( isNaN(d) ) { return; }
            seconds += d * secondsPerDay;
        }
        if ( match[2] ) {
            const h = parseFloat(match[2].slice(0, -1));
            if ( isNaN(h) ) { return; }
            seconds += h * secondsPerHour;
        }
        if ( match[3] ) {
            const m = parseFloat(match[3].slice(0, -1));
            if ( isNaN(m) ) { return; }
            seconds += m * secondsPerMinute;
        }
        if ( match[4] ) {
            const s = parseFloat(match[4].slice(0, -1));
            if ( isNaN(s) ) { return; }
            seconds += s;
        }
        return seconds;
    };
    const ptFromSeconds = seconds => {
        const parts = [ 'PT' ];
        const d = Math.floor(seconds / secondsPerDay);
        if ( d ) {
            parts.push(`${d}D`);
            seconds -= d * secondsPerDay;
        }
        const h = Math.floor(seconds / secondsPerHour);
        if ( h ) {
            parts.push(`${h}H`);
            seconds -= h * secondsPerHour;
        }
        const m = Math.floor(seconds / secondsPerMinute);
        if ( m ) {
            parts.push(`${m}M`);
            seconds -= m * secondsPerMinute;
        }
        parts.push(`${seconds}S`);
        return parts.join('');
    };
    const fixTimeAttributes = xmlDoc => {
        try {
            const periods = queryAll(xmlDoc, 'MPD > Period');
            if ( periods.length === 0 ) { return; }
            let seconds = 0;
            for ( const period of periods ) {
                const startAttrBefore = period.getAttribute('start');
                const durAttr = period.getAttribute('duration');
                if ( startAttrBefore === null || durAttr === null ) { continue; }
                const startAttrAfter = ptFromSeconds(seconds);
                period.setAttribute('start', startAttrAfter);
                if ( period.hasAttribute('id') ) {
                    const idAttr = period.getAttribute('id');
                    period.setAttribute('id', idAttr.replace(startAttrBefore, startAttrAfter));
                }
                seconds += secondsFromPT(durAttr);
            }
            const mpds = queryAll(xmlDoc, 'MPD[mediaPresentationDuration]');
            if ( mpds.length !== 1 ) { return; }
            mpds[0].setAttribute('mediaPresentationDuration', ptFromSeconds(seconds));
        } catch {
        }
    };
    const pruneFromDoc = xmlDoc => {
        try {
            if ( selector === '' ) {
                const serializer = new XMLSerializer();
                safe.uboLog(logPrefix, `Document is\n\t${serializer.serializeToString(xmlDoc)}`);
            }
            const items = queryAll(xmlDoc, selector);
            if ( items.length === 0 ) { return xmlDoc; }
            safe.uboLog(logPrefix, `Patching ${items.length} items`);
            for ( const item of items ) {
                if ( item.nodeType !== 1 ) { continue; }
                item.setAttribute('duration', 'PT0S');
            }
            fixTimeAttributes(xmlDoc);
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
    modifyXhrResponseFn(propsToMatch, (xhr, before) => {
        if ( before instanceof XMLDocument ) {
            return pruneFromDoc(before);
        }
        if ( typeof before === 'string' ) {
            return pruneFromText(before);
        }
        return before;
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

function preventBab() {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-bab');
    const signatures = [
        [ 'blockadblock' ],
        [ 'babasbm' ],
        [ /getItem\('babn'\)/ ],
        [
            'getElementById',
            'String.fromCharCode',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
            'charAt',
            'DOMContentLoaded',
            'AdBlock',
            'addEventListener',
            'doScroll',
            'fromCharCode',
            '<<2|r>>4',
            'sessionStorage',
            'clientWidth',
            'localStorage',
            'Math',
            'random',
        ],
    ];
    const check = function(s) {
        if ( typeof s !== 'string' ) { return false; }
        for ( const tokens of signatures ) {
            let match = 0;
            for ( const token of tokens ) {
                const hit = token instanceof RegExp
                    ? token.test(s)
                    : s.includes(token);
                if ( hit ) { match += 1; }
            }
            if ( (match / tokens.length) >= 0.8 ) { return true; }
        }
        return false;
    };
    proxyApplyFn('eval', function(context) {
        const a = context.callArgs[0];
        if ( !check(a) ) {
            return context.reflect();
        }
        safe.uboLog(logPrefix, 'Prevented');
        if ( document.body ) {
            document.body.style.removeProperty('visibility');
        }
        const el = document.getElementById('babasbmsgx');
        if ( el ) {
            el.parentNode.removeChild(el);
        }
    });
    proxyApplyFn('setTimeout', function(context) {
        const { callArgs } = context;
        const a = callArgs[0];
        if ( typeof a === 'string'  && /\.bab_elementid.$/.test(a) ) {
            callArgs[0] = ( ) => { };
            safe.uboLog(logPrefix, 'Prevented');
        }
        return context.reflect();
    });
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

function preventClipboardWrite(matches = '', ...varargs) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-clipboard-write');
    const pattern = safe.initPattern(matches);
    const extraArgs = safe.parseVarargs(varargs);
    const excludePattern = extraArgs.excludeMatches &&
        safe.initPattern(extraArgs.excludeMatches);
    const domAlert = clipboardText => {
        const doc = document;
        const div = doc.createElement('div');
        const span = doc.createElement('span');
        span.style = 'flex-grow:1;padding:0.5em 0 0.5em 0.5em;';
        const domAlert = extraArgs.domAlert.replace(/\\n/g, '\n');
        const placeholder = /\$\{text\}/.exec(domAlert);
        if ( placeholder ) {
            const code = doc.createElement('code');
            const styles = [
                'background-color: #ddc',
                'display: inline-block',
                'font-family: monospace',
                'max-height: 8em',
                'overflow: auto',
                'padding: 0.25em',
                'word-break: break-all'
            ];
            if ( Boolean(extraArgs.selectable ?? true) === false ) {
                styles.push('user-select: none');
            }
            code.style = styles.join(';');
            code.textContent = clipboardText;
            span.append(
                domAlert.slice(0, placeholder.index),
                code,
                domAlert.slice(placeholder.index + placeholder[0].length)
            );
        } else {
            span.append(domAlert);
        }
        const button = doc.createElement('button');
        button.style = 'font-size:32px;padding:0.5em';
        button.textContent = '×';
        button.addEventListener('click', ( ) => {
            if ( currentAlert === null ) { return; }
            currentAlert.remove();
            currentAlert = null;
        });
        div.append(span, button);
        div.style = 'background-color:beige;color:black;border:1px solid black;display:flex;font-family:sans-serif;font-size:medium;position:fixed;top:0;white-space:pre-wrap;width:100%;z-index:2147483647';
        doc.documentElement.append(div);
        if ( currentAlert ) {
            currentAlert.remove();
        }
        currentAlert = div;
    };
    let currentAlert = null;
    const prevent = text => {
        if ( typeof text !== 'string' ) { return; }
        text = text.trim();
        if ( safe.testPattern(pattern, text) !== true ) { return; }
        if ( extraArgs.excludeMatches ) {
            if ( safe.testPattern(excludePattern, text) ) { return; }
        }
        if ( extraArgs.domAlert ) {
            domAlert(text);
        }
        safe.uboLog(logPrefix, 'Prevented:\n\t', text);
        return true;
    };
    const installTraps = ( ) => {
        proxyApplyFn('navigator.clipboard.writeText', async function(context) {
            const text = `${context.callArgs[0]}`;
            if ( prevent(text) ) { return; }
            return context.reflect();
        }, { skipToString: true });
        proxyApplyFn('document.execCommand', function(context) {
            const { callArgs } = context;
            if ( callArgs[0] === 'copy' || callArgs[0] === 'cut' ) {
                const text = document.getSelection()?.toString();
                if ( prevent(text) ) { return true; }
            }
            return context.reflect();
        }, { skipToString: true });
    };
    self.addEventListener('mousedown', installTraps, {
        once: true,
        capture: true,
    });
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

function proxyApplyConfig(config = '') {
    try {
        if ( typeof proxyApplyFn !== 'function' ) { return; }
        config = JSON.parse(config);
        if ( typeof config !== 'object' ) { return; }
        Object.assign(proxyApplyFn, config);
    } catch {
    }
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

function proxyToStringFn(proxiedFn, nativeFn) {
    if ( proxyToStringFn.proxies === undefined ) {
        proxyToStringFn.proxies = new WeakMap();
        proxyToStringFn.nativeToString = Function.prototype.toString;
        const proxiedToString = new Proxy(Function.prototype.toString, {
            apply(target, thisArg) {
                let proxied = thisArg;
                for(;;) {
                    const fn = proxyToStringFn.proxies.get(proxied);
                    if ( fn === undefined ) { break; }
                    proxied = fn;
                }
                return proxyToStringFn.nativeToString.call(proxied);
            }
        });
        proxyToStringFn.proxies.set(proxiedToString, proxyToStringFn.nativeToString);
        Function.prototype.toString = proxiedToString;
    }
    proxyToStringFn.proxies.set(proxiedFn, nativeFn);
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
    propsToMatch = '',
    ...varargs
) {
    if ( trusted !== true ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-fetch-response', pattern, replacement, propsToMatch);
    if ( pattern === '*' ) { pattern = '.*'; }
    const rePattern = safe.patternToRegex(pattern);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const extraArgs = safe.parseVarargs(varargs);
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

function trustedEditInboundObject(propChain = '', argPos = '', jsonq = '') {
    editInboundObjectFn(true, propChain, argPos, jsonq);
}

function trustedJsonEdit(jsonq = '', ...varargs) {
    jsonEditFn(true, jsonq, ...varargs);
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
    disposition = '',
    ...varargs
) {
    if ( methodPath === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-override-element-method', methodPath, selector, disposition);
    const extraArgs = safe.parseVarargs(varargs);
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
    preventXhrFn(true, ...args);
}

function trustedReplaceArgument(
    propChain = '',
    argposRaw = '',
    argraw = '',
    ...varargs
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-argument', propChain, argposRaw, argraw);
    const argoffset = parseInt(argposRaw, 10) || 0;
    const extraArgs = safe.parseVarargs(varargs);
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
            if ( safe.RegExp_test(reCondition, argBefore) === false ) {
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
    ...varargs
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-outbound-text', propChain, rawPattern, rawReplacement, ...varargs);
    const rePattern = safe.patternToRegex(rawPattern);
    const replacement = rawReplacement.startsWith('json:')
        ? safe.JSON_parse(rawReplacement.slice(5))
        : rawReplacement;
    const extraArgs = safe.parseVarargs(varargs);
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
    propsToMatch = '',
    ...varargs
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-replace-xhr-response', pattern, replacement, propsToMatch);
    const xhrInstances = new WeakMap();
    if ( pattern === '*' ) { pattern = '.*'; }
    const rePattern = safe.patternToRegex(pattern);
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const extraArgs = safe.parseVarargs(varargs);
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
                if ( safe.RegExp_test(signatureArg.re, targetArg) === false ) {
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
    urlPattern = '',
    ...varargs
) {
    if ( typeof selector !== 'string' ) { return; }
    if ( selector === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('xml-prune', selector, selectorCheck, urlPattern);
    const reUrl = safe.patternToRegex(urlPattern);
    const extraArgs = safe.parseVarargs(varargs);
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
    modifyXhrResponseFn(urlPattern, (xhr, before) => {
        if ( before instanceof XMLDocument ) {
            return pruneFromDoc(before);
        }
        if ( typeof before === 'string' ) {
            return pruneFromText(before);
        }
        return before;
    });
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line

const $hasHostnames$ = true;
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

const todo = new Set();

if ( $hasHostnames$ ) {
    const $scriptletHostnames$ = /* 13831 */ ["*","j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","ok.ru","op.gg","ouo.*","oxy.*","pnd.*","qmh.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","ebay.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","ntv.cx","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","app.com","arbsd.*","atv.com","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","crn.com","ctrlv.*","dbna.de","dciuu.*","deco.fr","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","dnj.com","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","f6s.com","fakt.pl","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mlb.com","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","ntvs.cx","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rgj.com","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vids.st","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","ymix.to","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","2tencb.*","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9mod.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","amazon.*","anigo.to","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bsky.app","bunkr.la","bunkrr.*","bzzhr.co","bzzhr.to","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","firmy.cz","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fyxxr.to","fzlink.*","g9r6.com","game8.jp","ganool.*","garaz.cz","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","index.hr","isi7.net","its.porn","j91.asia","janjua.*","javgg.me","jmanga.*","jmmv.dev","jotea.cl","kagane.*","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kick.com","kimi.com","kizi.com","kloo.com","km77.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","live.com","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","miruro.*","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mlsbd.co","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","n.fcd.su","ncaa.com","net77.cc","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdse.lat","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","scmp.com","seeeed.*","senda.pl","senpa.io","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","sj-r.com","slant.co","sms24.me","so1.asia","splay.id","sport.de","sport.es","spox.com","sptfy.be","stern.de","stfly.me","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","turbo.cr","turbo.fr","tv.wp.pl","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yacht.de","yandex.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123av.com","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9-gld.net","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","aagmaal.*","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ameblo.jp","ampav.com","andyday.*","anidl.org","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","apple.com","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","azure.com","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chess.com","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","claude.ai","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","dom.wp.pl","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","dzapk.com","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","europix.*","evaki.fun","evo.co.uk","exego.app","expres.cz","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fbsbx.com","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.ml","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gry.wp.pl","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","jasmr.net","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javsub.my","javup.org","javwide.*","javxxx.me","jkanime.*","job.mt.de","job.nw.de","jootc.com","kagane.to","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lecker.de","legia.net","lenkino.*","lep.co.uk","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lohud.com","lookcam.*","lootup.me","los40.com","m.kuku.lu","m1xdrop.*","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mgread.io","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","noxx.to>>","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","proton.me","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rfiql.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rophimz.*","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","sat24.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","stly.link","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","sulasok.*","swame.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","themw.com","thesun.ie","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tubev.sex","tubexo.tv","tukoz.com","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","twitch.tv","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upbolt.to","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqload.co","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vidbox.vc","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidneo.cc","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vipurl.in","vladan.fr","vnuki.net","voodc.com","vplink.in","vsembed.*","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","webex.com","webmaal.*","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","www.wp.pl","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xca.cymru","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yahoo.com","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zokaj.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9anime.vip","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","alphatv.gr","amboss.com","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","avtub.cx>>","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","balbums.st","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdjobs.com","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","caller.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","capital.fr","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chad.co.uk","chiefs.com","ciberdvd.*","cimanow.cc","cinehd.app","cinemar.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cuttty.com","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drakkar.st","drivebot.*","driveup.in","driving.ca","drphil.com","ds.163.com","dtmaga.com","dvm360.com","dz4up1.com","eadt.co.uk","earncash.*","earnload.*","easysky.in","ebc.com.br","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fastly.net","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","filester.*","film.wp.pl","film1k.com","film4e.com","filmi7.net","filmo.to>>","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gamezop.io","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gentside.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","github.com","gitlab.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","goerie.com","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hochi.news","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","huavod.com","huavod.net","huavod.top","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indoav.app","indoav.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","kaamuu.cfd","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","kickbd.org","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","labgame.io","lacrima.jp","larazon.es","lasisa.net","ldnews.com","leakav.com","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","mdplay.top","medibok.se","megadb.net","megadede.*","megaflix.*","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","meteox.com","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","moto.wp.pl","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mpnnow.com","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","napmap.net","natalie.mu","natfrp.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","ninguno.cc","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pidlio.com","pilsner.nu","pingit.com","pinkun.com","pirlotv.mx","pitube.net","pixelio.de","pixvid.org","pjstar.com","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","plejada.pl","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","ptztv.live","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","reddit.com","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rrstar.com","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","salina.com","samash.com","sanblo.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skinmc.net","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sohot.cyou","sokobj.com","solewe.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","stripe.com","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpalm.com","tcpvpn.com","tech.wp.pl","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiktok.com","tiscali.it","tmnews.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vcloud.lol","vcstar.com","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidbox.dev","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduro.top","viduyy.com","viewfr.com","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vscode.dev","vstream.id","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","worder.cat","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xprivo.com","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ystream.id","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4pornhd.com","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","and-more.co","andiim3.com","anibatch.me","anichin.top","anigogo.net","anihq.org>>","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arakpop.net","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","axomtube.in","ayatoon.com","azmath.info","azmovies.to","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blavity.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","braflix.win","brbeast.com","brbushare.*","brigitte.de","bristan.com","browser.lol","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civicxi.com","civitai.com","civitai.red","claimrbx.gg","clapway.com","clkmein.com","cloubix.com","cloudfam.io","club386.com","cocorip.net","coinclix.co","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","criczop.com","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","daily.co.jp","dailyweb.pl","damitv.live","daozoid.com","ddlvalley.*","decider.com","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dlstreams.*","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dstat.space","dsvplay.com","duboku.info","dudefilms.*","dz4link.com","dziennik.pl","e-glossa.it","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","edp24.co.uk","eductin.com","einthusan.*","elahmad.com","embasic.pro","embedhd.org","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f51rm.com>>","facet.wp.pl","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstream.is","fbstreams.*","fchopin.net","feedzop.com","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","fosters.com","foumovies.*","foxtube.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamedrive.*","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","genpick.app","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","glianec.com","globetv.app","go.fakta.id","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gumtree.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hornyhill.*","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","htrnews.com","htsport.org","huaren.live","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itavisen.no","itpro.co.uk","itudong.com","iv-soft.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbobo.com","javboys.com","javcock.com","javdock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jkanime.net","jnovels.com","jobnoid.net","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","kaembed.net","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","kumaraw.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lichess.org","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","mandiner.hu","manga1000.*","manga1001.*","mangahub.io","mangasail.*","mangatv.net","mangayy.org","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","motphimr.io","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mozilla.org","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrexcel.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onlyfans.to","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","pokopow.com","polygon.com","pomorska.pl","pooembed.eu","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","quizzop.com","radamel.icu","raiders.com","rainanime.*","rakuten.com","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","realbbc.xyz","redding.com","redgifs.com","redlion.net","redporno.cz","redtub.live","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","rogoyume.jp","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rubystm.com","rubyvid.com","rugby365.fr","rule34h.com","runmods.com","rvguide.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sctimes.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smarturl.it","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sonyliv.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spotify.com","spycock.com","srcimdb.com","sreality.cz","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamgg.net","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamix.so","streamm4u.*","streamup.ws","strikeout.*","strp2p.site","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","swtimes.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","thapcam.net","thaript.com","the-sun.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","timeful.app","titantv.com","titulky.com","tmailor.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","tukoz.com>>","tunebat.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uticaod.com","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","veronica.uk","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidavra.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidnest.fun","vidshar.org","vidshare.tv","vidspeed.cc","vidsrcme.ru","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipshort.in","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webtoon.xyz","weerslag.nl","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wideo.wp.pl","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xbokeps.com","xcandid.vip","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","yurn.online","zedporn.com","zeilink.net","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1primewire.*","2017tube.com","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","398fitus.com","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","5moviess.com","720pstream.*","7hitmovies.*","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","afrotech.com","airflix1.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amarillo.com","amateur8.com","amestrib.com","amnaymag.com","amtil.com.au","androidaba.*","anhdep24.com","animalia.bio","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animelok.xyz","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninami.site","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","anonmp4.help","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apnablogs.in","app.vaia.com","apps2app.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","astrozop.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","bike-news.jp","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","brainzaps.tv","brawlify.com","bright-b.com","brobokep.org","bronco6g.com","bsmaurya.com","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","bysebuho.com","bysekoze.com","bysewihe.com","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camaro7g.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","cataz.stream","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","cdn.vifey.de","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","cjonline.com","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","codeberg.org","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","daotekno.com","darkibox.com","datacheap.io","datanodes.to","datawav.club","dawntube.com","ddlvalley.me","deadline.com","deadspin.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","dispatch.com","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","doodstream.*","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","dredyson.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","euronews.com","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","facebook.com","factable.com","fairyhorn.cc","faiviral.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmifen.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","fxpornhd.com","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gekkonen.net","gelbooru.com","gentside.com","gerbeaud.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","greekfun.net","grigtube.com","grosnews.com","gseagles.com","gsmarena.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","hanime24.com","harbigol.com","hbnews24.com","hbrfrance.fr","hcaptcha.com","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaicube.*","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","heqviral.com","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hometalk.com","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indian-tv.cz","indianxxx.us","indystar.com","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.cc","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jconline.com","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","knoxnews.com","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","lineup11.net","linfoweb.com","linkedin.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","looopings.nl","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakita.id","mangakoma.ac","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masahub2.com","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","miixdrop.com","miixdrop.net","mikohub.blog","milftoon.xxx","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkvcinemas.*","mlbstream.tv","mmsbee27.com","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momon-ga.com","momspost.com","momxxx.video","monaco.co.il","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","niganpro.com","nilesoft.org","niu-pack.com","niyaniya.moe","njherald.com","nkunorse.com","nonktube.com","nosubapp.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","of-model.com","oimsmosy.fun","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","ondebola.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opinie.wp.pl","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pal-item.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pcgamesn.com","pdfindir.net","peachify.top","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","petguide.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.1188.lv","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playmogo.com","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","pogoda.wp.pl","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","porn4fans.me","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornobae.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","proxyorb.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranger5g.com","ranger6g.com","ranjeet.best","rapelust.com","rarepike.com","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","rome2rio.com","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","scotsman.com","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","starcima.com","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","supramkv.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tacoma4g.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","telegram.com","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","thecomet.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thesun.co.uk","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tieulam.info","tigernet.com","tik-tok.porn","timestamp.fr","tinypass.com","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokuzl.net>>","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","trustnet.com","truthnews.de","truyenvn.dev","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv3monde.com","tvappapk.com","tvasports.ca","tvdigital.de","tvnow247.top","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","udoyoshi.com","ugreen.autos","uhdwalls.com","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umogames.com","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","utsports.com","uur-tech.net","uwatchfree.*","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vijviral.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vivasexe.com","vocalley.com","voirseries.*","volokit2.com","voznovel.com","vr.pornhat.*","walftech.com","warddogs.com","warezcdn.lat","wargamer.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","weerplaza.nl","westword.com","whatgame.xyz","whatsapp.com","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhamster46.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxpicss.com","xxxputas.net","xxxshake.com","xxxstream.me","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zpserver.com","zvision.link","zxcprime.icu","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","4runner6g.com","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","aha-music.com","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","aniworld.to>>","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","archive.today","archivebate.*","archlinux.org","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoembed.app","autoextrem.de","autofrage.net","autoguide.com","autoscout24.*","autosport.com","autotrader.nl","avnsgames.com","avpgalaxy.net","azcentral.com","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bitwarden.com","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","buienalarm.be","buienalarm.nl","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canlikolik.my","cantonrep.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.com","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chieftain.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","cotemaison.fr","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cuisineaz.com","cumlouder.com","cuttlinks.com","cybermania.ws","cyklobazar.cz","daddylive.*>>","daddylivehd.*","dailymail.com","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","daveockop.com","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desertsun.com","desifakes.com","desijugar.net","desimmshd.com","devsoftwr.com","dfilmizle.com","dic.pixiv.net","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.*>>","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedseek.xyz","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","ev3forums.com","exe-links.com","expansion.com","extratipp.com","f150gen14.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fbstream.is>>","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","finanse.wp.pl","findheman.com","firescans.xyz","firestream.to","firmwarex.net","firstpost.com","fitness.wp.pl","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","galesburg.com","gamearter.com","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesider.com","gamesite.info","gamesmain.xyz","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","goupstate.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","guessthe.game","gutefrage.net","gutekueche.at","gwiazdy.wp.pl","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hamhigh.co.uk","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaicop.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","hertsad.co.uk","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hikvision.com","hilites.today","hillsdale.net","hindimovies.*","hindinest.com","hindishri.com","hindisink.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hostzteam.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hutchnews.com","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgouskel.sbs","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itdmusicy.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.com","javhdporn.net","javleaked.com","javmobile.net","javplayer.com","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jlaforums.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanald.com.tr","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","kitsapsun.com","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksiazki.wp.pl","ksusports.com","kuchnia.wp.pl","kumascans.com","kupiiline.com","kurashiru.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkshortx.in","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-tube.me","manga18fx.com","mangabats.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","massgrave.dev","math-aids.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maxegatos.net","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memedroid.com","menshealth.de","metalflirt.de","meteocity.com","meteopool.org","meteovista.be","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","microsoft.com","miiixdrop.com","miiixdrop.net","miohentai.com","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morencius.com","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtvuutiset.fi","multicanais.*","musicsite.biz","musikradar.de","mustang6g.com","mustang7g.com","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakastream.tv","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","nelomanga.net","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newportri.com","newschief.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","nlcosplay.com","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nupload.top>>","nuviatoon.com","nvimfreak.com","nwemail.co.uk","nwusports.com","oakridger.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","oklahoman.com","onemanhua.com","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","openlua.cloud","openrouter.ai","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","phimfun.net>>","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","pinterest.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","plattformj.ch","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primewire.*>>","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","rakuten.co.jp","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","recaptcha.net","rechtslupe.de","recordnet.com","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","selfhostt.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortnest.com","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spotsaver.net","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startseite.to","statesman.com","ster-blog.xyz","stereogum.com","stock-rom.com","str8ongay.com","stre4mpay.one","stream-69.com","stream4free.*","streambtw.com","streamcash.to","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.dev","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","talksport.com","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techybuff.com","techyrick.com","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","theintell.com","thejournal.ie","thelayoff.com","theledger.com","thememypc.net","thenation.com","thespruce.com","thestar.co.uk","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","trilltrill.jp","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","twitchcdn.net","twojeip.wp.pl","twstalker.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vpzserver.com","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weeronline.nl","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","whtimes.co.uk","widewifes.com","wikipedia.org","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","wordshake.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","bergwelten.com","best18porn.com","bestofarea.com","betaseries.com","bgmiesports.in","bharian.com.my","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btvnovinite.bg","buccaneers.com","buchstaben.com","businessua.com","bustmonkey.com","bustybloom.com","bysefujedu.com","bysejikuar.com","byseqekaho.com","byseraguci.com","bysesukior.com","bysetayico.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","cg-gamespc.net","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cincinnati.com","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","cpu-monkey.com","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","croq-kilos.com","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","daddylive.link","dafreeporn.com","dagensnytt.com","daily-jeff.com","dailycomet.com","dailylocal.com","dailyworld.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","donegallive.ie","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ebooksyard.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elaoffcial.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","elnacional.cat","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","euronews.com>>","eveningsun.com","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","faitsfizzle.fr","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmifen.com>>","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-4u3omzw0.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gisvacancy.com","gknutshell.com","gloryshole.com","gobearcats.com","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","growgritly.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heraldnews.com","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","horoskop.wp.pl","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","houmatoday.com","howtocivil.com","hpaudiobooks.*","huggingface.co","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","in-cumbria.com","inbbotlist.com","indeonline.com","indi-share.com","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itechfever.com","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksonsun.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","lcsun-news.com","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lenconnect.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","macheforum.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marionstar.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","merkmal-biz.jp","meteologix.com","mewingzone.com","miiiixdrop.net","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modapkfile.com","moddedguru.com","modenatoday.it","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","monroenews.com","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorcycle.com","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mprogaming.com","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naplesnews.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","news-press.com","newsbreak24.de","newscard24.com","newsherald.com","newsleader.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pekintimes.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","pemersatu.link","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pinterpoin.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","play.xpass.top","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polsatsport.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","printables.com","proapkdown.com","pruefernavi.de","purediablo.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","questloops.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","rcostation.xyz","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaishd.*","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shelbystar.com","shemalesin.com","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","siusalukis.com","skat-karten.de","slickdeals.net","slidesaver.app","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","straemplay.org","stream2watch.*","streamdesi.com","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techcrunch.com","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","teknoasian.com","telemagazyn.pl","teleshow.wp.pl","telesrbija.com","temp.modpro.co","tennessean.com","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","the-leader.com","the-review.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thegleaner.com","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","tradingref.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidquickly.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","virustotal.com","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vscode-cdn.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wawalove.wp.pl","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","wigantoday.net","willyweather.*","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","0123movie.space","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","abyssplayer.com","adhs-zentrum.de","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","allclassic.porn","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","argusleader.com","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","autoshieldd.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestensuree.com","bestialporn.com","bestjavporn.com","beurettekeh.com","bgmateriali.com","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-magazin.de","bike-urious.com","bintangplus.com","biologianet.com","bizjournals.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","burytimes.co.uk","buzzheavier.com","caminteresse.fr","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","celticway.co.uk","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cheezburger.com","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","convertcase.net","coromon.wiki.gg","cosplaynsfw.xyz","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailyrecord.com","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","decomaniacos.es","definitions.net","delmarvanow.com","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","detroitnews.com","deutschsex.mobi","devonlife.co.uk","dhankasamaj.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","echo-news.co.uk","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedplayer.xyz","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","farminglife.com","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fayobserver.com","fcportables.com","fdlreporter.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","fifetoday.co.uk","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fitpractise.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","flywareagle.com","fmradiofree.com","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","ftsefutures.org","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gainesville.com","game.digitap.eu","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","gosanangelo.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","guidetechly.com","gut-erklaert.de","hacksnation.com","halohangout.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiocean.com","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hokiesports.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","huntspost.co.uk","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","inyatrust.co.in","iptvjournal.com","irvinetimes.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","jokerscores.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","kent-life.co.uk","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","leakgallery.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkvertise.com","linux-talks.com","live.arynews.tv","livescience.com","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","londonworld.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","mais.sbt.com.br","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","miiiiixdrop.net","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modelviewer.lol","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","myanimelist.net","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","nemzetisport.hu","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nissanzclub.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","northjersey.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","okiemrolnika.pl","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","paste4free.site","pawastreams.org","pawastreams.pro","pcgameszone.com","pdftoshokan.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phillyburbs.com","phonerotica.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","polenjournal.de","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radio-norge.org","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","ramdomlives.com","rangerboard.com","ravennatoday.it","rctechsworld.in","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","rule34video.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.org","santhoshrcf.com","savannahnow.com","savealoonie.com","scan-hentai.net","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","slateforums.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","ssdhostting.com","starcourier.com","stargazette.com","starstreams.pro","start-to-run.be","staugustine.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sulasokvids.net","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tallahassee.com","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","taycanforum.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","thenewsstar.com","theprovince.com","thereporter.com","thespectrum.com","thestreameast.*","theterrace.scot","thetoneking.com","thetowntalk.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","timesonline.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokuzilla.net>>","tokyomotion.com","tokyomotion.net","tophostdeal.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","travelnoire.com","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","truyenhentaiz.*","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","turystyka.wp.pl","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","uppercutmma.com","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","verywellfit.com","vfxdownload.net","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","wealthcatal.com","web.epalovo.com","webmatrices.com","webtoonscan.com","wegotcookies.co","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","world-iptv.club","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xterraforum.com","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yandexcloud.net","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","aberdeennews.com","about-drinks.com","account.bhvr.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adonisfansub.com","adult-empire.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.khaddavi.net","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianimage.co.uk","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","augustacrime.com","autotrader.co.uk","avellinotoday.it","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","bangyourwife.com","barrheadnews.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","beta.plus.rtl.de","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","blueridgenow.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","book.trivago.com","booksbybunny.com","boolwowgirls.com","boote-magazin.de","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","bristolworld.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","bysedikamoum.com","bysesayeveum.com","call2friends.com","cambstimes.co.uk","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","capecodtimes.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courierpress.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofaucet.xyz","cryptojunkie.net","cryptomonitor.in","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","dakotaforums.com","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","derbyworld.co.uk","derryjournal.com","designparty.sx>>","desikamababa.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","divicast.watch>>","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","dudleynews.co.uk","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","femmeactuelle.fr","fernsehserien.de","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","floridatoday.com","footwearnews.com","footymercato.com","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","gadsdentimes.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreegames.net","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","glasgowworld.com","globelempire.com","go.discovery.com","go.gociwidey.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","harpersbazaar.fr","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hemeltoday.co.uk","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hometalkpaid.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","infinityfree.com","infomatricula.pt","inprogrammer.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jacksonville.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","journalduweb.org","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kawaii-anime.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","leaderlive.co.uk","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linkneverdie.net","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","lk21official.*>>","logofootball.net","london-now.co.uk","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","lutontoday.co.uk","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","mangakuri.online","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-cccdoz45.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","meteoradar.co.uk","metin2alerts.com","milanreports.com","milfxxxpussy.com","milkporntube.com","misterdonghua.in","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsletter.co.uk","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nikkansports.com","nintendolife.com","nl.hardware.info","nocsummer.com.br","nontonhentai.net","norfolkmag.co.uk","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","nwfdailynews.com","officecoach24.de","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineathens.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","outlook.live.com","overtakefans.com","oxfordmail.co.uk","ozbargain.com.au","pagalworld.video","pandaatlanta.com","pandafreegames.*","paradoxscans.com","parentcircle.com","parking-map.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","petoskeynews.com","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pilotsglobal.com","pinsexygirls.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","poconorecord.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","portsmouth.co.uk","post-gazette.com","postcrescent.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","printedwaste.com","privacy-mgmt.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-danmark.dk","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reporternews.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","rivianforums.com","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","scoutevforum.com","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","seriesflixhd.*>>","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sites.google.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stalowemiasto.pl","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","suffolkmag.co.uk","sukidesuost.info","sunshine-live.de","supremebabes.com","sussexlife.co.uk","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","tatsumi-crew.net","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenational.scot","thenerdstash.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thestarpress.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tipsenweetjes.nl","tires.costco.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","trucosonline.com","truetrophies.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unfriend-app.com","unionpayintl.com","uniquestream.net","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeur-house.org","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vvdailypress.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","wearevoice.co.uk","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","woodmagazine.com","word-grabber.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xvideos-full.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","3addedminutes.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","adrenaline.com.br","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","ayradvertiser.com","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","beaconjournal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","bryantenunder.com","bucksherald.co.uk","burymercury.co.uk","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","carensureplan.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","cheboygannews.com","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citizen-times.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","clarionledger.com","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cool-style.com.tw","coolmath4kids.com","coolmathgames.com","costcoinsider.com","countypress.co.uk","countytimes.co.uk","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","cumbrialife.co.uk","curiosidadtop.com","daemon-hentai.com","dailyamerican.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtbikerider.com","dirtyindianporn.*","dissmercury.co.uk","doctor-groups.com","dodi-repacks.site","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","ealingtimes.co.uk","earninginwork.com","easyjapanesee.com","easyvidplayer.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.net","elamigosgamez.com","elamigosgamez.net","elystandard.co.uk","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","fileditchfiles.me","financefernly.com","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","fitnakedgirls.com","fitnessplanss.com","flight-report.com","floridagators.com","foguinhogames.net","foodtalkdaily.com","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","free-wargamer.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gastongazette.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","googleapis.com.de","googleapis.com.do","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","harrowtimes.co.uk","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","heraldtribune.com","herefordtimes.com","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","hyperosthemes.org","iedprivatedqu.com","igniteseurope.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","integraforums.com","ipswichstar.co.uk","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","ithacajournal.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxworld.com","jardiner-malin.fr","jeechallenger.com","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lecanalauditif.ca","lectormangass.net","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lheritierblog.com","libertestreamvf.*","limerickleader.ie","limontorrents.com","line-stickers.com","link.snipcash.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","liverpoolworld.uk","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lubbockonline.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","macanevowners.com","madhentaitube.com","malaysiastock.biz","mangakakalove.com","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","meltontimes.co.uk","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","nationalworld.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","newryreporter.com","newsandstar.co.uk","newsshopper.co.uk","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","patriotledger.com","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","player.kinoton.cc","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","playstreaming.win","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","pressconnects.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","rancheroforum.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","redesigndaily.com","registerguard.com","reloadedsteam.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","rhyljournal.co.uk","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","superflixapi.best","surreycomet.co.uk","surreyworld.co.uk","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","the-gazette.co.uk","theadvertiser.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","theresident.co.uk","thermoprzepisy.pl","thesprucepets.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","times-gazette.com","timesnowhindi.com","timesreporter.com","timestelegram.com","tippsundtricks.co","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","walesfarmer.co.uk","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","bedfordtoday.co.uk","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","birminghamworld.uk","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","bridportnews.co.uk","burnleyexpress.net","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cayenneevforum.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","cheshirelife.co.uk","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","climaaovivo.com.br","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","consejosytrucos.co","contractpharma.com","cornwalllife.co.uk","cotswoldlife.co.uk","couponscorpion.com","cr7-soccer.store>>","cravenherald.co.uk","creditcardrush.com","crimsonscrolls.net","crm.urlwebsite.com","cronachedibirra.it","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dawgpounddaily.com","dcdirtylaundry.com","delawareonline.com","denverpioneers.com","depressionhurts.us","derehamtimes.co.uk","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dramathical.stream","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","enterprisenews.com","ericeastweight.com","erikcoldperson.com","essexlifemag.co.uk","evdeingilizcem.com","eveningtimes.co.uk","eveningtribune.com","exactlyhowlong.com","expressandstar.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","favoyeurtube.net>>","fightingillini.com","financialjuice.com","fireflix.pages.dev","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gazette-news.co.uk","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","glasgowtimes.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","guessthemovie.name","guessthephrase.xyz","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","heraldseries.co.uk","hibsobserver.co.uk","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jeepreconforum.com","jemontremabite.com","jeux.meteocity.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","juliewomanwish.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","keighleynews.co.uk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kilburntimes.co.uk","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","legiongamesgod.com","leighjournal.co.uk","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lincolncourier.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","lyricsongation.com","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mcdonoughvoice.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","melaterevancha.com","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","miltonkeynes.co.uk","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newarkadvocate.com","newcastleworld.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","omnicalculator.com","onemileatatime.com","onepunch-manga.com","onetimethrough.com","onlineradiobox.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passeportsante.net","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penarthtimes.co.uk","penisbuyutucum.net","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","progress-index.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radio-hrvatska.com","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","record-courier.com","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporter-times.com","reporterherald.com","resultadostris.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","royston-crow.co.uk","ryanagoinvolve.com","sabornutritivo.com","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seacoastonline.com","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","sheboyganpress.com","shemaletoonsex.com","shieldsgazette.com","shipseducation.com","shrivardhantech.in","shropshirestar.com","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","sooeveningnews.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sports-arena.space","sportstohfa.online","stapewithadblock.*","starnewsonline.com","sthelensstar.co.uk","stirlingnews.co.uk","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","sturgisjournal.com","sunderlandecho.com","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tauntongazette.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","thecalifornian.com","thecelticbhoys.com","theendlessmeal.com","thefirearmblog.com","thegardnernews.com","thegoldendaily.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thetimesherald.com","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-series.co.uk","times-standard.com","timesandstar.co.uk","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tuscaloosanews.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldofpcgames.com","worldstreams.click","wormser-zeitung.de","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","alloaadvertiser.com","allporncartoons.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","ardrossanherald.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","bluemediadownload.*","bordertelegraph.com","bracknellnews.co.uk","brentwoodlive.co.uk","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","clydebankpost.co.uk","collegeteentube.com","columbiacougars.com","columbiatribune.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","courier-journal.com","crackedsoftware.biz","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailycommercial.com","dailyjobposting.xyz","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","embed.tmp-url.pro>>","en-thunderscans.com","erotic-beauties.com","eveningnews24.co.uk","eventiavversinews.*","expresskaszubski.pl","fakenhamtimes.co.uk","falkirkherald.co.uk","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.dailymail.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","gazetteherald.co.uk","gazetteseries.co.uk","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","halesowennews.co.uk","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","heraldmailmedia.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","hollandsentinel.com","home-xxx-videos.com","horseshoeheroes.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ianrequireadult.com","ilbolerodiravel.org","ilforumdeibrutti.is","ilkleygazette.co.uk","independentmail.com","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","jessicaclearout.com","joguinhosgratis.com","journalstandard.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kingjamesgospel.com","kingsofkauffman.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","lindalastattack.com","livetv.moviebite.cc","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","m.jobinmeghalaya.in","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","miamiairportcam.com","miamibeachradio.com","midweekherald.co.uk","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minutemirror.com.pk","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","multicanaistt.space","mycentraljersey.com","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","norwichbulletin.com","noticiascripto.site","nottinghamworld.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","octavestreaming.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","pcgamebenchmark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornosubtitula2.com","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radio-australia.org","radio-osterreich.at","radiosantaclaus.com","radiotormentamx.com","rangersreview.co.uk","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","shreveporttimes.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somerset-life.co.uk","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","southcoasttoday.com","spa.center.ivof.com","sportitalialive.com","sportowefakty.wp.pl","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamcasthub.store","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","theboltonnews.co.uk","thecrazytourist.com","thedailyjournal.com","theglobeandmail.com","themehospital.co.uk","thenorthwestern.com","theoaklandpress.com","therecordherald.com","thesaltysoldier.com","thesimsresource.com","thesmokingcuban.com","thetorquereport.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","timesrecordnews.com","timmaybealready.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","urbandictionary.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vickisaveworker.com","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","wearesunderland.com","webhostingoffer.org","weneverbeenfree.com","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","witneygazette.co.uk","woffordterriers.com","worcesternews.co.uk","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yeovilexpress.co.uk","yorkshirelife.co.uk","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidauthority.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","augustachronicle.com","ayobelajarbareng.com","ayrshire-today.co.uk","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","birmingham-now.co.uk","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","boxofficebusiness.in","br.nacaodamusica.com","broncosportforum.com","browardpalmbeach.com","bucksfreepress.co.uk","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","captcha-delivery.com","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","centralfifetimes.com","charlestoughrace.com","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","commercialappeal.com","consiglietrucchi.com","coolmath4parents.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","cumnockchronicle.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","derbyshirelife.co.uk","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","dorsetmagazine.co.uk","downloadfilm.website","dunfermlinepress.com","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","eveshamjournal.co.uk","exmouthjournal.co.uk","extremereportbot.com","fairforexbrokers.com","falmouthpacket.co.uk","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fitbook-magazine.com","fle-5r8dchma-moo.com","football-ukraine.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-4urg44yg.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greenvilleonline.com","griffinathletics.com","hackingwithreact.com","hackneygazette.co.uk","halifaxcourier.co.uk","hampshire-life.co.uk","harboroughmail.co.uk","hartlepoolmail.co.uk","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heartsstandard.co.uk","heresyoursavings.com","hexham-courant.co.uk","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homehobbiesdaily.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","ilfordrecorder.co.uk","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","irresistiblepets.net","italiadascoprire.net","itpassportgokaku.com","jemontremonminou.com","jessicayeahcatch.com","jlwranglerforums.com","johnbeyondnation.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","lacronicabadajoz.com","lancashirelife.co.uk","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveonlinesports.net","loriwithinfamily.com","lostcoastoutpost.com","luxurydreamhomes.net","main.sportswordz.com","malverngazette.co.uk","mangcapquangvnpt.com","maps.blitzortung.org","maryspecialwatch.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","milforddailynews.com","milfordmercury.co.uk","mkvmoviespoint.autos","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","newhamrecorder.co.uk","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","northernfarmer.co.uk","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","oraridiapertura24.it","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","peeblesshirenews.com","pesprofessionals.com","petbook-magazine.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","readcomicsonline.lol","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","salamanca24horas.com","sanadegreecollege.in","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","sexypornpictures.org","sidmouthherald.co.uk","sloughobserver.co.uk","socialmediagirls.com","socket.pearsoned.com","solomaxlevelnewbie.*","southbendtribune.com","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","statesmanjournal.com","steamunderground.net","stevenfamilyedge.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","sudburymercury.co.uk","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","the-daily-record.com","thedailyreporter.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","theleafchronicle.com","theoldhamtimes.co.uk","thepublicopinion.com","thescottishsun.co.uk","thesimplifydaily.com","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totallysnookered.com","totalsportek1000.com","toyoheadquarters.com","tracylocalschool.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","unblockedgames.world","underground.tboys.ro","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchsuitsonline.net","watchtheofficetv.com","weekendletters.store","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitehavennews.co.uk","wife-home-videos.com","wiltshiretimes.co.uk","wirtualnynowydwor.pl","worldgirlsportal.com","www.digitalocean.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banburyguardian.co.uk","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","cantondailyledger.com","celebritydeeplink.com","charlessheimprove.com","chesterstandard.co.uk","collinsdictionary.com","comentariodetexto.com","community-scripts.org","conselhosetruques.com","coolmath4teachers.com","cotswoldjournal.co.uk","courierpostonline.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","daventryexpress.co.uk","davescomputertips.com","derbyshiretimes.co.uk","desitab69.sextgem.com","desmoinesregister.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","dunmowbroadcast.co.uk","easyworldbusiness.com","elcriticodelatele.com","electricalstudent.com","ellwoodcityledger.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","essexcountynews.co.uk","evelynthankregion.com","exchangeandmart.co.uk","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-nv2xl8an.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","forestryjournal.co.uk","free-3dtextureshd.com","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freepressseries.co.uk","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greatfallstribune.com","greenwichmeantime.com","guardian-series.co.uk","hackedonlinegames.com","halsteadgazette.co.uk","heraldtimesonline.com","hersfelder-zeitung.de","higherorlowergame.com","hillingdontimes.co.uk","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","impartialreporter.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","jessicachoosemake.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","ledburyreporter.co.uk","lesbianfantasyxxx.com","lincolnshireworld.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","mavericktruckclub.com","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nationalgeographic.fr","netsentertainment.net","niederschlagsradar.de","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcmap.place.naver.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","petersfieldpost.co.uk","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","providencejournal.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","romfordrecorder.co.uk","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scotlandrugbynews.com","scriptgrowagarden.com","scrubson.blogspot.com","scrumpoker-online.org","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","southsideshowdown.com","southwalesargus.co.uk","southwestfarmer.co.uk","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stourbridgenews.co.uk","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","techbook-magazine.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","thenews-messenger.com","thenorthernecho.co.uk","theprofoundreport.com","thesavvyexplorers.com","thetruthaboutcars.com","thewebsitesbridge.com","thisiswiltshire.co.uk","thurrockgazette.co.uk","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","visaliatimesdelta.com","voyeur-pornvideos.com","walterprettytheir.com","warwickshireworld.com","watch-movies.com.pk>>","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","watfordobserver.co.uk","wausaudailyherald.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","wisbechstandard.co.uk","worksopguardian.co.uk","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","anguscountyworld.co.uk","appstore-discounts.com","arbitrarydecisions.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","bicesteradvertiser.net","biggleswadetoday.co.uk","blackamateursnaked.com","blackpoolgazette.co.uk","borehamwoodtimes.co.uk","brunettedeepthroat.com","buxtonadvertiser.co.uk","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","caseyimpactstation.com","celebritymovieblog.com","chillicothegazette.com","clixwarez.blogspot.com","cloudorchestranova.com","comandotorrentshds.org","conceptoweb-studio.com","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewsburyreporter.co.uk","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","eastlothiancourier.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","f150lightningforum.com","fantasticyoungporn.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","garylargeavailable.com","gazetteandherald.co.uk","gdl.freegogpcgames.xyz","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","greatbritishlife.co.uk","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","hucknalldispatch.co.uk","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","internetradio-horen.de","irasutoya.blogspot.com","islingtongazette.co.uk","jacquieetmicheltv2.net","jeepgladiatorforum.com","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","living-magazines.co.uk","livingincebuforums.com","llanfairpwllgwyngy.com","lonestarconference.org","lowestoftjournal.co.uk","ludlowadvertiser.co.uk","m.bloggingguidance.com","marissasharecareer.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","metrowestdailynews.com","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","news-journalonline.com","nicolehappyoutside.com","nilopolisonline.com.br","northamptonchron.co.uk","northnorfolknews.co.uk","obutecodanet.ig.com.br","oeffnungszeitenbuch.de","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","osint-info.netlify.app","paginadanoticia.com.br","palmbeachdailynews.com","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","pontiacdailyleader.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","readingchronicle.co.uk","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","southendstandard.co.uk","stornowaygazette.co.uk","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thewestonmercury.co.uk","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universityequality.com","wakefieldexpress.co.uk","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","westerntelegraph.co.uk","whitchurchherald.co.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","andoveradvertiser.co.uk","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","battlecreekenquirer.com","bestbondagevideos.com>>","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","bridgwatermercury.co.uk","buerstaedter-zeitung.de","burlingtonfreepress.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","columbiadailyherald.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","dumbartonreporter.co.uk","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","examiner-enterprise.com","exclusiveindianporn.com","fightforthealliance.com","financeandinsurance.xyz","footballtransfer.com.ua","fourchette-et-bikini.fr","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","greenocktelegraph.co.uk","hattiesburgamerican.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","jefferycontrolmodel.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","knutsfordguardian.co.uk","kutubistan.blogspot.com","lancasterguardian.co.uk","lancewhosedifficult.com","lansingstatejournal.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","matthewhotelscience.com","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","myhomebook-magazine.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northdevongazette.co.uk","northwalespioneer.co.uk","northwichguardian.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pamelachangemission.com","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","peterboroughtoday.co.uk","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","poughkeepsiejournal.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","publicopiniononline.com","puzzles.pressherald.com","rebeccacostthousand.com","rebeccapracticeloss.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","stevenspointjournal.com","stowmarketmercury.co.uk","streamtapeadblockuser.*","swindonadvertiser.co.uk","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","thescottishfarmer.co.uk","thisisoxfordshire.co.uk","tips97tech.blogspot.com","traderepublic.community","travelbook-magazine.com","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","wiltsglosstandard.co.uk","wimbledonguardian.co.uk","windowsaplicaciones.com","xxxjapaneseporntube.com","yourlocalguardian.co.uk","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","basingstokegazette.co.uk","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","cybertruckownersclub.com","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","doncasterfreepress.co.uk","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","ellenpoliticalfollow.com","enfieldindependent.co.uk","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","gamershit.altervista.org","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hampshirechronicle.co.uk","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","jeanprofessorcentral.com","jennifereconomicgive.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","largsandmillportnews.com","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","majorleaguepickleball.co","mansfieldnewsjournal.com","mariatheserepublican.com","marshfieldnewsherald.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","montgomeryadvertiser.com","multivideodownloader.com","my-code4you.blogspot.com","northantstelegraph.co.uk","northernirelandworld.com","northsomersettimes.co.uk","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","play.mercadolivre.com.br","player.subespanolvip.com","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","redditchadvertiser.co.uk","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","southwalesguardian.co.uk","stream.googleapiscdn.com","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thescarboroughnews.co.uk","thunderousintentions.com","tirumalatirupatiyatra.in","tivysideadvertiser.co.uk","tricountyindependent.com","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","wandsworthguardian.co.uk","warringtonguardian.co.uk","watchdoctorwhoonline.com","watchtrailerparkboys.com","wharfedaleobserver.co.uk","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","bucyrustelegraphforum.com","burlingtoncountytimes.com","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fifties-beat.blogspot.com","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","harrogateadvertiser.co.uk","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","lancastereaglegazette.com","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","messengernewspapers.co.uk","northwaleschronicle.co.uk","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","peterboroughmatters.co.uk","pickleballteamleagues.com","pickleballtournaments.com","portclintonnewsherald.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","rotherhamadvertiser.co.uk","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","storage.googleapiscdn.com","telenovelas-turcas.com.es","thebeginningaftertheend.*","thesouthernreporter.co.uk","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","barryanddistrictnews.co.uk","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","bromsgroveadvertiser.co.uk","change-ta-vie-coaching.com","chelmsfordweeklynews.co.uk","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","eastlondonadvertiser.co.uk","elperiodicoextremadura.com","eppingforestguardian.co.uk","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","greatyarmouthmercury.co.uk","helmstedter-nachrichten.de","html5.gamedistribution.com","interestingengineering.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","kidderminstershuttle.co.uk","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stroudnewsandjournal.co.uk","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wisconsinrapidstribune.com","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","yorkshireeveningpost.co.uk","brittneystandardwestern.com","buckscountycouriertimes.com","celestialtributesonline.com","chardandilminsternews.co.uk","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","denbighshirefreepress.co.uk","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","helensburghadvertiser.co.uk","iphonechecker.herokuapp.com","kathyinformationwhether.com","leightonbuzzardonline.co.uk","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","northumberlandgazette.co.uk","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","redhillandreigatelife.co.uk","richardquestionbuilding.com","runcornandwidnesworld.co.uk","rupertisdivingintoocean.com","saffronwaldenreporter.co.uk","somersetcountygazette.co.uk","sztucznainteligencjablog.pl","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","zanesvilletimesrecorder.com","barkinganddagenhampost.co.uk","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","wattonandswaffhamtimes.co.uk","www-daftarharga.blogspot.com","xn--90afacv0cu2a3cr.xn--p1ai","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","becclesandbungayjournal.co.uk","braintreeandwithamtimes.co.uk","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","dumfriesandgallowaylife.co.uk","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","thefreedommatrix.blogspot.com","thetfordandbrandontimes.co.uk","thetottenhamindependent.co.uk","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","bordercountiesadvertizer.co.uk","caq21harderv991gpluralplay.xyz","clactonandfrintongazette.co.uk","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","kryptografie-de.translate.goog","maldonandburnhamstandard.co.uk","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","readgraphicnovels.blogspot.com","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","xn--90afacv0clj6ac0dxa.xn--p1ai","akihabarahitorigurasiseikatu.com","darlingtonandstocktontimes.co.uk","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","richmondandtwickenhamtimes.co.uk","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","hollywoodhinditracks2.blogspot.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","harwichandmanningtreestandard.co.uk","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","burnhamandhighbridgeweeklynews.co.uk","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","wymondhamandattleboroughmercury.co.uk","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];
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
        const $scriptletArglistRefs$ = /* 13831 */ "1908;419;1018,1738;1736;135;1556;58;116;470,616;58,479;3002;479,495,782,1116,1117;157;1122,2161;1738;1294,2575,2576;58,495,818,3753;1739,2242;157;58,1488;157;157;157;2830;-59;3494,3495;60,402,505,512,2040;433,2774,2775;419,505;1996;1366;557,1740;157;3273;1044;2155;157,442,1851;135;529,1117,1184;936;157;157;157;-156,-2824,-2825,2830;157;-1909,3076,3077,3078,3079,3080,3943,3944;58;58,402,453,457,458,459,460,1738;479,986,987,988,989,990,991;157;3026;1018;402;1736;479,718;672;3288,3289;1738;1018;1932;58,402,479,1740;399;129,130;58,2440;1835;135;426;135;426,453,583,823;129,440;479,1981;2004,2005,2006,2007;218,737;1488;3948;1018;387;157;58;58,445,1018,1739,1879,1880;-1909;479,495,782,1210,1737;3662;58,505;1835;58,782,1211;58,390,402;627,718;157;399;963,1284;154,168,569,709,1835;2807;-135,1361;157;58;60,1741;157,1835;419,426,479,528,782,1394;135;60,61,418;245,246;2535;3568;61;659,1761;60,659,3787,3788,3789;1556;1739,2242;1873,3617;1739,2242;1742,2929;426,451,452,1736;154;1158,3662;157;681;505;58,1064;2294;3704;399;157;1929;129;129;157;1930;157;-135,1361;58,3817;157;58,479,1018,1568,1569;58,129,479,1555,1556,1557,1558;620;419,426,479;1739;402,419,654;58,453,1556;827;157;58;1933,1934;157;2932;479;157,1291,2648;157;58,59,60,61,1881;754;3894;157;1417;402,471,500;157;1283;1201;1556;1018;2155,2156;1740;2166;58,129,479,1555,1556,1557,1558;1295;2260;157;1144,1693;58,402,779;58,1603,1610;1018;157;2936;58,59,60,61;157,1068;569;58,818,834,2198,2716;157;167;1294;2274,2275,2276,2277;635;600;58,718,2588;58;58,445;3154;402,850;426;135;1488;925;3202;483;857;1122,1371;1846;1249;1740;58,419,479,571,615;1167,1205,1488,2699;472;2695,2696;620;427,1018,2793;58;805;1122,1452,1740,2316;58,3197;1617,2783;1808;1018;1837;1835;124;1835,1836;3597;1835;396,397,1835;445,446;620,650,1706;407;129,1814,1815,2496;2298,3118;157,368,1290;736,2500;426;2967,2968,2969,2970,2971,2972,3973,3976;440;147,2097;157;61,620;1835;2171;1835;3256;2454;2465,2596,2664;1808;1396;58,445,1879,1880;58;413,622,843,844;1468;390;58,479,495,782,1210,1737;479,1208,1209,1738;3911;1521;408;1488;1738;3398;440,2525,2526;485,638;157,399;154,168,399,569,643;1266;426,526,1018,1556;157,1287;-135,1361;1699;58,1345,1737;1556;58,795,1737;620,1296,2430;1738;-135,1361;1357;-135,1361;584;402,419,527,654,872;1221;157;135;1815;1488;58,3165;1488;61,573,620;620;1855;1168;1168;1168;620;61;58,648,1273;593;447,1125;3282;1122,1666,2316;3288,3289,3637;312,313;480;402,480,505;3235,3236;2627;157;1556;157;2902;740,741;58,1488;479;3691;58,479;500,620,1204;878;620,1556,1706,3020;718;157;1488,1490,1491,1492;-1909,3600,3601;3813,3814;1556;1740;1018,1147,1148;157,1835;157;2115;129;58,857,1739,2197;1815;933,1737;157,1291,1688;711;2963,2964;58,818,2198;157;147,730,2155,2390,2979,2980,2981,2982;157;3493;1556;505;58,3817;58,1628;2622;196,197;159,160,2589;426,480,505,883;135;402,419,654;58;-434,-2775,-2776;58;58,435,505,604,654,736,777,792;3403;3590;1347;1808;58,811;157,808,1197;61;1488;542,1135;573;1808;1322;157;58;451;58,1018,1739,1751;505,1556,1739;157;2067,2068;505;1835,1836;58,447,1743,1898;1018;1556;196;1835;479,1737;1450,1451;1769;58,453,486,487,488;504;2940,2941;1737,1738,1739,1742;1835,2717;1835,2717;3146,3147;58,60,627,1144;58;808;1610;58,1738;620;58,62,63,64,65,66,67,1018,1556;488;402,419,505,654;1739;58,529,1184;61,620,3586;529,1117;1056;133;1966,1967,1968,1969,1970,1971;1126,1127;1737;147,3281;1815;432;1930;1769;1739;834,2198;834,2198;72,73,157,1286,1293,1835,1836,2532;2340;421;407,1835,1836;638,1213;399,1808;519;3823,3824;58;58;157;135;1488;68,69;58,1018;2172;1556;1556;252,399;718,1739,1744,1888,2974;1488;1760;620,1719;1739;479,782;620,1613;1488;68,69;58,620;620,648,898;1835,1836,3492;3834;1556;1018;505,571,3170,3172;681;1769;470;1122;58,479;1077;395;2986;1147;1304;493,620;157;-1909;58;1371;157;157;659;61,154,620,2347,2348,2349,2350;1835,1836;1855;1205;1562,1577,1578;2548,2549;620;58,505,1740;1488;1488;157;399;75,-1909;58;620;399;157;1736;811,1100;58,620;526;1488;-1909;2854;61,620;-109,1574,1626,1646,1669,1670,1671,1672,1673,1674,1675,1676,1677;-109,1574,1626,1646,1669,1670,1671,1672,1673,1674,1675,1676,1677;1703;58;58,1769;479,1520,1521,1522,1523;2894;859;1739;1769;58,1769,1770;1740;2681;58,479,1122;1182;1815,3909;58,3781,3782,3783,3784,3785,3786,3823,3824;58,505,1737,1739;440,1797;1271;1804,3864,3865;1628,2861,2862,2863;1488;526;3240;157;3218;58,602;445;58,1556;58,62,63,65,66,67,1556;58;58,445,1018,1879,1880;500;1109;418,426;1271;3070;1835;1159,3662;1347;1488;115;60,1018;479;1736;58,1556,3193;659,1621,1622;58,435,627,718;505;2151;445,972;1738;157;479,718;3880;1018,1748;1736;368,409,1290,1683;3627,3628;865;440;686,1735;1739;58,1556,3193;1835;402,755;3880;1705;1556,3390;3050;426,2566;402;1018;1018;-135,1361;157,393,394,395,1283;1488;157;129;2214;58,1740;480,1737;395;500,573,1048;157;157;3296;3296;1488;1835;58;3043;1832;1779;959;407;886;3461,3462,3463,3464,3465,3466,3467,3468,3469,3470;453;58,447,1125,1765;495;620;460;-1924,1924,3908;58,419,576,599,600;464,599;464,599;58,602;1835,1836;371;2206,2207;620,2922;1736;1488;61;3902;620;58;1018;1739,2242;200;2375;58,1737;3973;-1909;2641;2375;1835;2375;662;2375;2375;2375;619;58;1488;2375;68,69;68,69;1835,1836;1682;147,1962,3969;692,1835;157;135;426,479,782;58;-1909;430;742,743,744;625;1804;1521,2574;58,602;505;1769;3967;3808;58,2593;426,435,479,495,527;58,1892,1894;2778;1740;58,1941;2430;129,2496;2390,2979;-156,-2820,-2821,-2822,-2823,2830;58;453,1741;1737;68,69;479;1738;2773;129;659,3070;2200;58;2942;371,1431,1432;399;58;1738;426;3893;2783;1520;620;526;435,505,1039,1040,1041,1739,1740;1855;58,602;419,426,479,505,615,883;755;583,1781,1782;3044,3045;690,691,1739;58,1738;1004;157,1835;58,499;418,620;480;58;68,69;1494,1495;157;1740;402,419,1740;157;157;157;157;157;157;157;157;157;1786;616,659,1574,1626,1629,1634,1635,1636,1669,1670,1671,1672,1673,1674,1675,1676,1677;502;2783;58,1982;2098;464;-109,659,1574,1626,1630,1631,1632,1633,1669,1670,1671,1672,1673,1674,1675,1676,1677;620,1488,1700,1701;620;447;2465;627,718;627,718;627,648,718,2324;627,718;440;1750;1508;1100;1488;2732;463,1135,1136;1556;58,402,505,581,582,583,584,585,1736;526;135,1503,1504;981;1808;3910;1835,1836;999,1009,2475;1666,3804;157;1541;157;1077;157,399,1284;830,1457,1573,1574,1575;58,447,1743,1898;681;1347;479,782;1835,1836;61,445,542,573,620,2212,3500;1739;1738,1748;769;493;157;1221;1739,2242;505,960;58;58,479,505,782;1062;1422;1288,3221;2991;157;58;58;1738;61;1835;-156;1766;1434;3391;88;1271;796,2679;58,479,782,1628;1105;1018;1556,1739;409;923;402;1738,1743;58,2198;1744;1737;58,1391,1772;2184,2185;1835,1836;58;453,1737;1741,1742;58,447,505,627,1018,1556,1737,1766,3116;1769;521,522;704,705,706,707;58;430,704,705,932,1556,1739;2487;2174;58,59,60,61,1881;154,168,1835;390;2001;2001;58;147;58,1214,2495,2501;1119;1696;1737;1556;578,1195;200;505;2016;1685;1832;708;157;1541,3123,3125,3126,3127;3638,3639;1488;479;1233;2448;402,850;2732;58;68,69;966,967;620;620;620;58,718,1556,2588;98;-196,-1909;3729,3730,3731;1243;431,453,638;620;1737;2435;129,850;447,1556,1769;68,69;480,887;1488;166,3266;402,1022;479;58,1556,3193;250,251,2296,2297,2298,2299;1517;58;135,473,474,475,476,477,478,479;447;58,3284,3664;2306;430,458,526,1018;1556;68,69,1556;1741;68,69;1018;922,2208;154,914,919,920;637,638;3493;58,500;58,1738;463,490;1488;1391,1392;68,69;718,1018;68,69;573;58;58,1018,1556,2040,2098;1488;1018;1340;58;58,1738;675;3171;440;1778;123,3828;743,3157,3158,3159,3160;479,527,782,1740;58;58,419,479,1737;479,782;811,1526;2689;3680;426,511;1832;3922;399;1855;1835,1836;1556;1738;402;2245;600,953,1312,1556;659;61;2019;58,2583;659;58;659;1488;-1909;1737;3335;1556;2010;1437;3705;413;1747;430,1038,1738;1739;135,1503,1505;2212;620;395,1361,1488;-1909;651;135;966,967;463,613;58,1556;1738;436,438;58,1177,1556;1736;1753;426,479;157;2023;1488;1488;528,1737;157;426,1003;1334;3137,3138;3970;157;2847,2848;68,69;767,893;440;3404;1056,1057,1058,1059;371,1778;58,2871;686,978,3448;3409,3410;1835;1740;505;58,61,1556;1398;811,1526;620;1199;-1909;614,636;157,1068;654,1119,1736;479,718;811;-1909;1556,1739;1739;3493;157;713;782,931;479,782;1628,2861,2862;818;58,445,1018,1879,1880;58,445,1018,1879,1880;447;1488;923;3112;419;1737;157;58;1488;68,69;620;58,445,1018,1879,1880;58,445,1556,1879,1880;-2820;2906;1018;58;58,445,1556,1879,1880;1556;1835;1034,1306;58;389;58;1488;620;2495;60,1799,1800;619;659;1815;1785;426,616,760;135;1018;1749;157,409;58,1018,2615,3191,3192;1721;1018;1018;1556;432;3137;493;613,2581,2582;620;1737;129,3507;399;479,1495,1520,1521,1522,1523;1925;432;58,1556,2660,3193;620;2366;481;620;1018,1739;58;-1909;1116;580;409;620;1556;851,852,1556;58,1618;1738;730;58,1018,2615,3191,3192;1556;1737;1769;1488;1738;1741;2171;58,59,718,1739,3130;479;2536;261,262;2270;492,1808;2441;1556,1700;510,620;2126,2127;464,576,600,620;1488;418,426;58;1488;1488;638;542,573,620;542,573,1906;1740;3050;431,433,796,1719,3666;1556;1766,1768;1488;1739;3504;1268;1488;1738,1739;3582;3582,3712,3713;58;463,620;58;1744;1271;1556,3417,3418,3419,3420;479,1461;-156,-2820;1488;947,948;68,69;1488;3472,3473;912;1488;129;58,464,620;1556,1740;706;58,718,1018,1556;2884,2885;1737;811;58,1018,2615,3191,3192;620;1739;1488;1556;610;61,426,1704;68,69;1556;1556;157;1488;1410;1738;1221;1122;620;58,1739;1007;2300;839;58;1488;1296;837;461;1738;2341;480;58,419,576,600,601;58,419,599,601,835;58,419,576,599,600,601,602;2233,2234,3915;58,419,576,599,600;1781;157;805;1268;413;3037,3038;2317,2318,3041;432;58;1737;157;620;573,620,1488;620,1266,1366;2606;61,573;61,602;620;61,573;3632;61,1779;620;3820;573;505;620;58,1737;-158;-158;432;1769;1488;1205;58,972,1074,1628,3141;58,1737;625;1739,2242;1739,2242;157,222,368,1684;58,627,1018;620,1706;61,620,1739,2212;1018;620,1488,1941,3204;1941,3676;68,69;58;68,69;157;1008;686;1835;390;479;480;493,620;58,505;1488;742,743,744;3513,3514;426;1845;1737;1808;1233;2446;126,127,129,130;1087;58,1556;402,717,718,834;102,103,104,105,3759;1835;1236;402,3168;620;1055;1556,1700;1264;58,60,435,627,718,1144;2643,2644;395;1488;58,971,1740;157,442;157;602,2408,2409,2410,2411;1556;88;58,573,648,894,1914;479,782;1156;58,1893,1894;402,1738;1738;1018,1556,3352;399;805;243,244;1488;620;413;419;649;1737;58;58,503;620;3025;1488;2659;1832,2091;157,1086;1125,3569;627;61,581,3187;1739;1488;157;620;1018;3520;1738;1488;3953;129;1556;2212,2495;1930;58,3664;58;2875;1488;2016;1808;1740;1915,1921;1488;399,1835;526;58,402,1185,1738;1488;1271;431,493,620;58;1488;2377;3776,3777;479,1018,1541;1832;620;2061;1804;157,645,963;58,1119,1742;1488;157;1268;58;1832,1835;620;1556;1944,-3498,3498,3499;58,1737,1738,1739;1488;61;620;620;58;493,620;488,768,1153,1154,1155;426;58;600;620;58;276;157;-1909;419;1259;58;1488;2383;2846;620;479;1235;830;157;3603;1741;3049;627,1510,3609,3613,3614;58,488,768;1699;58,480;573;539;2223;1588,1589,1590;3416;3292,3293;371;3510,3511,3512;2008;58,1517;479,782;157;1739;1740;1706;2295;1835;3087,3088;1018;627,718;627,718;827;395,620,877;146;3592;3131,3132,3133;1738;479,718;620;620;58,3632,3633,3634,3635;1488;1738;1835;1488;2783;58,505,782,1211,1736;659,2489,2769,2770;1110;479,782,1566;426,570;1488;571;1556;677,678,679;1744;530,1202;808;1745;1556;157,369;853;440;2837;830,1457,1573,1574,1575;267,1595,1596;58;58,1556,3523;58,1556;58,447,1743,1898,1899,1900;3958;3800;997;61;1075,2034;157;1737,1738,1739;402,571;984;573;1462;966,967;1481;479,1663;1271;2201;1384;1167;530,531,2279;2000;58,2973;-135,1361;1805;58,1018;61,620,2137;58,135,583,1738;620;402,430;495;1493,1494,1495;68,69;240,241;1728;620;659,3322,3323;1296;1015;157;1366;445,600,620;-1909;88;966,967;58;1488;1210;490,1027,1028;1405;620;157;1744;659,1891,3829;1740;1856;1375;445,620;1221,1694,1695;1737,1744;2302;427;593,1736;-190;1488;426,567;58,583;58;68,69;1740;2635;952;409,412;58;58,61,98,1556,3771;58,61,98,1556,3771;1737;659,730,1666;58,61,445,1556,1879,1880;58,60,435,627,718,795,1144;1700,1769;2167,2168,2169;3878,3879;3455;-1557,1769;1556;157;426,479,782,783,784;58,1556,2623;479;58,860;1488;460,705,1125;479,850;1769;58;1317;-1392,-1393;1269;2944;3942;1778;58;1018,1123;1488;1285;1737;58;828,1495,1497,1498,1501;3453,3454;129;432,2237;1488;1488;-2826,-2827,-2828;61,1699;445,600;3426;2732;3842;493,1237;464;68,69;837;426;620;638,1213;3131,3132,3133;1740;945;58,431;2274,2275,2276,2277;1488;600;620;620;58;-1909;58;1737;1844;1474,1488,1572;1740;3456;58,818,2198;488;1739;58;811;1737;1018;1272;1815;2353;2850,3906;3905;1556;627;1888;1574,1627,1628,1669,1670,1671,1672,1673,1674,1675,1676,1677;559;627;1739;60;58,795,1299;1018;273,274,1624,1939;58,1679,1778;533;2459;2109;1737,1739;1740;58;718,1740,2378;58,1018;1488;1488;571,1739;1799,1800;1488;1017;1018;1556,1586;157;978;620;559;58,3664;805,2128;1738;1018,1556;431,464,576;620;58;3694;58,1556;488;1556;440;1018,1738;157;58;500,1738,2098;58,3392;1157;743,3157,3158,3159,3160;58,2690,2691;440,479,573,620,1018,1556,2037,3155,3156;1339;3728;718;1737;58,445,1556,1879,1880;58;3816;347,348;1488;796;61;1488;58,1738;2579;626,1556;402;1738;1737;58,573,1556;1556,3417,3418,3419,3420;1018;2435;1488;766,767;1556;573;157;60,463,480,493,583,836;395,2368;440,1443,2559;1738,1739;453,1750;3970;3970;3970;3970;3970;3970;620,1766;157;2563;966,967;730;573,620;1740;1018;435,1041,1739;430;3011,3012;1556;3632,3636;1488;620;1488;1704,3774,3775;480;2314;1738;61,58;3224;2631;995;479;620;3887;1488;503;500,1741,2098;1488;58;955,956;58,1391,1772;620;1271;1534;1205,1488;620;1930;756;2515;58,464,620;61;1488,1799,1800;1488;1835;526;1739;453;129,440,2659,3348;1835;488;1808;1488;638,894,978,1059,1213,1726;530;638,894,896,978,1059,1213,1726;480;1835;963;1835;1488;157;1846;1125,3569;556,557,558,1740;984;620;1799,1800;1835;3493;58,654;129,2903,3068,3069,3070,3071,3072,3073;730,1666;3836;698;1139;2665;978,2384;805;294;1488;2791;440,1797;157;1347,1488;1488;1233;1739,2426;3687;1737;419;620;1156;2445;620;58;480,758,759,1740;479,1520,1521,1522,1523;479,1520,1521,1522,1523;411;58,445,1018,1879,1880;58;2764,2765,2766,2767;1488;427,837;58;620;157,1288;557,558,1740;1409;129;2783;-59,-1557,-1757,-1758,-1759,-1909;129;1588,1589,1590;680;1835;778;782,1740;573;620;951;399;1739,1769;643;129;1119,1248;1666;2951;1744,2443;1835;1233;232,233,359;1738;2975;1064;1840;782;782,1334,1740;479;343;530,2252;619;620;2988;1739;1264;60;58,1391,1772;2665;3177,3178;1455;1738;426,505;493;2598;463;1337;1778;1488;479,1520,1521,1522,1523;479,1520,1521,1522,1523;157;430;1737,1738,1739,1740;505;2171;1740;1351;479;157;187,188,1835,1836,3750;58;526;60,61;620;81,1488,2753;-59,-60,-61,-62,-1882;1007;1738;1737,1738,1739,1740;557,558,1740;58,1254;1488;1246;1375;2800,2801;58;58,620,1007,1556,1739,2612,2613,2615,3193;58,60,620;659;61;-156,-2820;620;1018;1570;58,59,60,61,1881;1737;3085,-3087;1556;1018;1738;1742;58;157;1488;1835;-1909,2015;1699;3667;1018;1018;1556,3341;157;620;1740;157;3559;1271;3895;58;135,479,593;1083;1737;1737;3131,3132,3133;58,1212;1488;620;524,649,703;1122,1740,2161;578,2208;1462,1488;1488;157;1835;676;697;706;58;58;1654;1738;1835;556,557,558,1740;3493;1122,2325;1666;1057;-1909;-1909;2573;1488;1488;3530;76,77,78,79,80;1835,1851;710;2180,2183;1018;796;2452;1271;1488;1808;1738;659;694;1737;1271;58,572,718,1018,1769;-59,-1126,-1557,-1909,-3683;1271;572;1271;1271;1271;1741;1488;402,761;3242,-3244;953;157;2783;157;58,2841,2842;1905;1296;157;2675;620;1221;923;426,1018;482,483;60,1769;1018;1737;1835;1488;60,620;413;3057,3058;58,61;58;58;620;3214;1255;877;1556;1835;1740;1738,1739;488;620;1122;588,1468,1469;533;3815;3815;3815;1488;662;58,662,1678;3711;1741;1347;620;1488;1799,1800;706,2794;1699,1737;914;2205;583,1781,1782;61;583,1781,1782;2261;583,1781,1782;583,1781,1782;583,1781,1782;121;58;58;659;1488;1488;2508,2509;2792;1916;1736;1983;1832;1488;1488;1832;407;98;1143;1740;61;61,1779;627;620;620;620;1799,1800;620;3632;58;61,1779;620;58,60,61,3368,3369,3370;620,1488;3632;2310,2393,2394;620;61;664;627;620,1778;620,1367;620;620;61;542;480;620;620;61,573,754;3349;1803;1488;479;1738;1488;157;620;1488;1778;573;157;58;58;1738;2375;58;2375;2375;1233;620;58,620,1018,2615;1488;811,2062;1666;1739,2242;1739,2242;1739,2242;98,3867;427;1817;1011;1012;402;2375;1739,2242;2375;1586;157;866;1488;125;620;620;2375;1475,1476,-1478,1478;1488;216,217;1835;1808;573;3341,3624,3625;135;1737,1738;58;2175;1488;1925,3908;2666;480;1488;2610,2611;479,782,2267,2268;58;1740;1738;2680;1739;1835;1255;1737;402;1739,2664;1517;1488;1591;1271;58,2748;445;131,211;157;1995;447,717;157,963;3618;3679;331,332;61;61,573,1018,1739,2212;1737;1434;1271;2249;658;129;659;58,1556,3193;2783;1018;620;58;479,782,1273;1740;479,1579;3131,3132,3133;1125,3569;659;1835;1835;3206;58,975;440,557,1147,1706,1717;58;1556;3451,3452;659;445;58,956,1889;2710,2711;681;2943;-2820;419,528;514;573,984;58,2202;58;539;1018,1738;58,1018,1488,1556,2218,2753;58,1737;58,528;58;1740;491;419;58;1808;1018;58,413,1275;1346;480;1378;3740;-109,659,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,3740;1769;2781;2722;977;1832,1856;493,583;3686;395,1488;1937;1739;1737;1090;1740;1205,1268;1236;867,868,1835;830,1457,1573,1574,1575;1835;-1909;1556;1741;58;1328;399;900;1851;3567;905;58,604,654,736,777,792;1301;366,1689,1855;58,1556;1556;885;1488;1737,1738;2564,2565;157;1125,3569;61;1737;1488;620,1488;58;58,1407;1488,2472;-59;2785;157;620,1212;1488;2336;857,1738,2037;1742;1792;1616;407,2201,3914;61;912;1488;918;493;1147;58;2239,2240,2241;440,1382,1488,1797;805;58;620;1799,1800;460;419;157;1740;1737,3030,3142;1347;1336;659;811,1526;1488;2783;1827,1828,1829,1830,1874;515;505;1488;2379;157;435,505,1039,1040,1041,1739,1740;157;1521;445,600;1835;1835;1740;620;583,1781,1782;533,613,620,736;805;1488;-420,-427,-480,-506,-616,-884;1840;1737;573;157;659;1808;2782;129;157,407;1768;1018;832;1521;61,573,1488;1488,1556;58,62,63,64,65,66,67,1018,1556;3310;1488,3023;-135,1361;58,573,620;480;583,686,1237;58,505;620;58,418,538,539;620;600;493;620,898,2292;58,840;3316,3317;1704;431,505,573,620;505,620;506,507;58,419,435,3477,3478,3479,3480,3481;58,419,435,3477,3478,3479,3480,3481;58,419;58,419,435,3477,3478,3479,3480,3481;58,419,435,3477,3478,3479,3480,3481;1827,1828,1829,1830,1874;58;58,419,435,3477,3478,3479,3480,3481;58,419,435,3477,3478,3479,3480,3481;58,419,435,3477,3478,3479,3480,3481;58,419,435,3477,3478,3479,3480,3481;597,1456;1548;627;58,718,2165;755;1815,1824;157,1521;3882;2830;1172;1488;1704;1457,1458,1459,1460;782;1422;2352;1832,2765;1318;387,808,1818,1819,2924,3744,3745,3746;58,542,573,1769,2748;1518;407;573;-1909;1077,1488;620;1488;1159,3662;432;58;1018;1488;730;3630;434;3343;767;2597;1952;3632;1808;2783;620;417;61;1704;2083;58;1766;1018;432;1808;1179;1488;811,1526;1488;627,718;3437,3438,3439,3440,3441,3442,3443;1835,3684,3685;1115;432;1556;1738;1740;1205,1268;418;2673;620;978,1334;1396;573;620;620;620,2906;2272;58,135;58;1018,2044;2754;620;907;1827,1828,1829,1830,1874;426,435,479,782,1233,2152,2153;479,651;58,479,782,1045,1122;1488,1556,1652;402,426,479,495,588,782;479,782,1566;426,435,479;2249;464,1905;399;61,1707;1835;2282;479,782,1018,1576;798,799;440;3703;1556;1556,1737;1488;1778;418;1521;1488;1314;157;157;157;58;1741;2952,2953;395;3043;1556;1738;58,1144;954;440,1797;58,447,1018,1898,1899,1900;58,627,718,2323;58,447,1743,1898,1899,1900;1488;-1909;1510,1511,1512,1513;2258;1827,1828,1829,1830,1874;157;1274,2038;3269,3270;61;1808;888;-156,-2820;1462;904;58,413,847;1371;2129;480,620;1271;2288;1556;58,928,1742;402,654;1488;620;1737,1738,1739;706,3030;-1909;2667;1808;2640;659,3321,3323;1488;1133;606;402,430;453;426,431;559;2351;901;3645;778;493,650;686;1541;426;1624;-1909,2385;3143;61;430;1268;58,135;1488,2786;2783;407,1835,1836;2358,2359;157,367,1290;493,576;1738;3575;493;151;203,204,205,206,207;620,649,1738;1018;598,684;1556;129;1769;479,1520,1523,1524,1525;620;1744;58,1046,1736;58,588,2421;493;2057;61,1520,1556,1754;620;852,1738;596,1739;135,451;58,1737;58,453,2360;1018,1556;143;1488;1556;3904;58,1018;1744;1018;1744;1556;1808;1018;1556;479,1470;1556;426,479,782,1737;1652;1089;1888;1744;659,730,1666;58,480,528,571,627,681,834;1737;1737;730,850,3717;3301,3302,3303;1122,1271,1395;58,3579,3580,3581,3582,3583;627;1740;58,1736;58,445,1556,1879,1880;58,1556;659,2637;479;447,705,932,1739,1766;1786;932;58;505,3455;58,494;2612;-1909;3632;58,445,1556,1879,1880;58;681;1350;1556;426,1738;148;1556;129,2946;1737;157;1147,3042;730,2390,2979,2980;58,542,573,1769,1910,2748;371,1614;2444;448;3274;58;1738;1766;58,460;3811,3812;157,1835;1826;58,1556;3671,3672,3673,3674;542;533;418,600;135,731;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;2723;515;3702;966,967;58,572,640,1737;620;620;58,1488;3875;445;480;620;58;620;620;61,480;480;973,2144;620;451;2906;966,967;2804;620;2608;620;426,1739;58;2783;480,1556,1739;426,1739;390,733,734;1488;1740;1738;58,1556,3193;435,620,1740,2109;493;659;1738;430;1271;1556;1203;620;58,1018,2615,3191,3192;58,971,972;1521;121,266;1018;1769;-109,683,796,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,1740;620;505,1018;1739;1134;2874;1737;1018,1556;505,795;426,1018;1271;620,1778;58,857;305;61;1018;1737;907;215,3377,3378;1488;58;620;1443;1481;1488;157;573;1047,1736;1488;651;58;58,620,664;1268;1018;1488;628;1739;1018;2162;620;1739,1780;147,307;58,3521;817;3657;61,542;1488;426,651;795;1488;526;395;681;1578;-109,659,1574,1605,1626,1649,1669,1670,1671,1672,1673,1674,1675,1676,1677;982;1488;681;1488;395,1361,2783;638,1213;1738;1835;864;649;58;627,718;58,59,60,61,1881;659;649;966,967;58;1993;1740;440;426,440,451,452,1737,2122;620;1556;1556,3417,3418,3419,3420,3422;1739;135,1122;2285;627,1119;58,506,2732,2817;966,967;456;2089;1488;2019;1738;479,782;681;2283;681;604,654;1488;620;3822;1205;493;505;2783;1835,1836;1799,1800;1246;542;1740;1738;58,505,1556;61;660;1205;419,500,813;157;157,771,1835;-156,-2820,2830;129;157;2050;1488;996;1268,1488;573;1488;1562,1577,1578;1433;2314,2315;1018;58;493;157;577;455;493;1488;620;620;1736;1738;1018;445,600,620;129;58;3493;1205;2326;58;440,694,1122,2462;440,1268,1488;58;573;58;620;1827,1828,1829,1830,1874;681;1740;877,1006,1205,1488,1498,1527,1528,1529,1530,1531;1835;1488;58;440,1205;620;3898,3899;1018;1779;1521;3228;-109,730,1018,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,1751,2397,2398,2399,2400;620;573,3819;58;1744;157,1284;264,265;3803;681;828,1495,1496,1497,1499,1501,1502;129,440,2659;651;620,2481;157;157;1488;1738;447;129;1488;539,583,638,767,1202,2146;686;767;58,464,485,530,767,898,928,2146,3025,3743;922,1488;129,1815,2496;1737,1738,1739;1488;-1909,3794,3795,3796,3797,3965,3966;399,1685;826,827;945;1748;3773;1957;1835,1836;129,3945;129;2149;2352;1740;1639,1665;659,1564,1664;3314;1488;1668;395;1043;3531,3532;426,620;2712;946;61,2901,2902,2903;571,1736;573;557,558,1740;2589;135,402,445,575;135,1505,1532,1533;3129;395;129,2649;1835;1018;1271;1271;1556;440,1296;58,479;426,479,782;479,1520,1521,1522,1523;58,479,505,575,782;1524;58,1556;58,402,505,720,2588;620,3655;61;3615;1488;1835;1488;3821;1570,1799,1800;419,728;2201;371;135;1116;1810;1453;2845;58;3931;129,479,2387;1498,1535,1536;642;495;1488;2707;1125;1488;72,73,1831;1488;3505;1488;680,770;419;470,593;1737;402;1740;2523;479,782;58,445,1018,1879,1880;3210;3806,3807;58,61,620;1769;1556;58,419,479;-3190;536;426;1498,3056;1024;135,437,439;846;573;-135,1361;157;1488;1840;395;721;2373,2374;1556;1556;58,620,2615;1018;1556,1963;58,563,564,565;2085;426,479;495;666,667;620;58;464,493;1375;620;390;873;58,413,505;3100,3101;1704,1715;390;479;1488;1488;68;-2820;2878,2879,2880;2417;620;2603;1556;413,2426;3043;1125;1556;1488;1835;1885,1886;1488,2093;1737;493;945,1574,1627,1629,1669,1670,1671,1672,1673,1674,1675,1676,1677;1643;1556,3417,3418,3419,3420;1755;58;1746,3435,3436;627;1018;1739,2609,2746;659;928;58;984,1760,1761,2235;60,627;1018;58;58;58;58,956,1889;2023;88;3589;651;387;402;58,1521,3155;1556;1488;129;1556;1521;1808;769,1737;58;402;2740,2741;1488;426,1739;1703;440,1797,1798;966,967;1018;58,61;2018,2778;58,664;1018;730,1740,1766,2310;857;1488;616,857,1268,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,1761,2858,2859,2860;1556,3341;1876,1877;1801;157;157;1102;1835,1855;157;1835,2116;1371;533,894;620;208;1324;60;157;2830;98,3841;58,493,600;495,1737;3005,3006;157;1835;620;58;493;88;135,1503,1504;125;1835;3761;659,1563,1564,1565;58,1574,1626,1669,1670,1671,1672,1673,1674,1675,1676,1677;1741;1271;1271;1018;1271;1234;808;1271;1739;1271;1488;58,59,571,572,573,1739;1271;1271;1488;891,1474,1488,1572;1271;1556;58;620;1739;1488;573;1946;426,803;1488;463,502,620;3271;1488;2519;1271;505,1740;-107,1857;3580,3778,3779;58;129,673,674,675;681;309,310;433,3666;157;623;1488;662,718;753;413,505;682;1737;620;463,489;1556;463,1135;2623;620;620;620;533;2998;1018,1556;1738;1769;1488;1488,1751;2984,2986,2987;1736;620;769;1488;620;1125,3569;573;58,61,620,3070;2552;464,928;129,2496;2750;620;620;620;58;58,2228;620;2907;1808;1556;3815;-59,-663;1271;58;1043;675;58,1739;1271;573;680;2868;1488;1271;1666,3650,3651,3652,3653,3654;1737;58,627;1488,3249;1443;135;58;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;58,419,599,600;463,464,465,466,467,468;583,1781,1782;620,1609;2051;2534,2738,2739;419,445,505,604,654,757;1835;1835;1781;1192;432;1737;426,1739;1044;1835;399;651;1737,1738,1739;3493;495;966,967;966,967;966,967;1018,2844;620;371,542,620;418,431;61,542;542,620,1488;620;620;574,1704;620;432,620;61,1704;627;61;61;620;620;620;620;61,1488;58;1488;395,2651;1119,1738;2230,2231,2232;125;1769;854;830,1457,1573,1574,1575;1488;2129;1277;620;1488;1488;1556;2167;1617;600;287,323;1488;620;1739,2242;1488,2090;1738;718;58,440,1737,1741;718,736;58;573,602;1737;802;157;573;2023;1488;1100,1316;426,427,1743;600;817;2375;1271;573;707;1147;1488;1855;407,1315;284;2148;395;2486;2588;1305;620;2031;1835;1488;2893;1736;-1909;157;1738;1018,1488;157;479;135,651;1556;426,479,523;427;426,1738;1737;1737;479,782,2170;1488;157;1122;495,718,1737,3028;1737;58,418;2778;445;1147;58,60,1273,1556,1706,3020;58,1556,1706,1769,3020;58;3190;2319;58;58;1115;1440;2815;61;678;1488;1835;1872;1739,2905;61,1739,2212;620,1737;839;573;542;431,620;129;620;1743;627;1556;1737;2027;659,1556;2506;157;1312;964;58;157;1738;2796;3935;527,1738;1556;1077,1488;1271;1018,3206;1488;479,782;505,880;659,1574,1642,1669,1670,1671,1672,1673,1674,1675,1676,1677,3341;1737,1738,1739,1740;1488;58;620;98;1737;58;480;58,1018,2615,3191,3192;58;1236;1603;1018;3667;1556;58;1018;58;58,1739;58,505,1739;1740;58,1018,2753;1018;1739;1741;58,718,1018,1556;58;1740;1740;426,1739;1738;58,1018,1556;426,1740;-1909;1738;58,2415;1738;58;912;2193;1835;2313;157;968;620;3740;399;2301;58,433,2836;1018;620;58;1057,2428;1488;2171;571;620;968;1125,3569;1737,1738,1739,1740;1740;808;857;2933,2934;58;61;58;61;-1909,3430,3431,3968;620,1799,1800;659;627;157,1842;817,2579,2889,2890,2891,2892;1408;3271;1736;1737,1738,1739,1740;58,3474,3475,3476;1737,1738,1739,1740;2997;1471;513;1488;1488;2290;505;505,620;-135,1361;1740;1093;61,1488;620;1271;58;61,1779;1377;1018;58;1018;58;569;1271;88,129;93,94,95,96,1556;402;135,1742;659,1891,3829;1488;2877;1425;271,272;2780;1326;58;446,1100;58,602;129,1509;3233;440,1797;1742;1901;3493;2201,3914;129;1488;681;157;1835;2110;1488;470,479,527,831;1964;399;3760;426,1739;58,435,505,604,654,655,1753;1268;2150;58,1018;479,782,1741,1742;620;3307;620;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;1949;620;2455,2456;505,755;1391,1392;1488;583,1781,1782;1781,1782,1783;1739;1018;2516;2516;2516,2517;823;1737;58;1289,3802;1544;811;430,1739,2037;1799,1800;129,1815,2496;-135,1361;58,3941;58,620,664;620;620;620;620;1029;549,550;426,463,788,789;620;648;620;620;488;2737;620;58,431;620,1704;493,620;620;3558;480,620,889;575,686;620,936;620,811;493,620;620;61,620;620;58,513,600,1166,1167;58,430,1738,1739;58;58;58;1835;58,659,3758;573,659,1737,3758;316;157;632,633,634;620;1488;3519;434,435,528,1018,1556,1736;620;1662;60;129,2477;500,2376;1835;1018;3493;1187;-1909;573;1738,1770,2330;61,1769;573;1488;157;1246;1808;3365,3366;3083;418;58,3664;1699;1699;533,620;479;589;1742;58;1742;620;1396;2308;1488;157;936;1556;157;817,3031;1488;157;479;432;1737,1740;426,1739;1488;620;426;857;61,608,3414;61,608,1556,3414;157;620;135;1837;1955;919,1263;1488;157;606;440;447;1488;157;701,1488;58,413,1761;58;426;627,718;627,718;2988;129;1488;1074;1808;2495;299;395;620;426,1270;1072;61,3752;1488;569;2525,3103;58;1740;681;445;445,573;485,2619;480;1719;620;620;480;527,2222;620;1018;1473;1018;1100,3272;58,447,1018,1740,1900;426,479,505,1741;1488;1741;58,993,1737;426,1739;426,1739;730;3939;58,493;2715;427;135;1488;3646;1384;3850;1488;526,796;419;2942,2965,2966;3304;58,3457,3458,3459,3924,3925;58,431;1302;808;157;2171;1739;470;1018;-1909;58,419,493,620;2534;3880;1018,1737;58,1738;2090;1018;402,578;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;58,419,435,513,583,1144,3949;58,1144,3748;58,447,1125,3569;1347;61,608,3414;1556;426,505;1556;1739;426,883;58,620,1018,2212;58;402,505;573,1556,3576,3577,3578;430,451,689;1901;620;1116;1704;1445;1488;1488;2352;432;1808;157,1686;620;1081;1913,2082;451;3211;588;2085;1062;3701;2620;1488;1835;1488;1250;1488;135;157;559;993,1479,1480;993,1479,1480;157;1382;1488;2201;1306;3493;125;1827,1828,1829,1830,1874;2999,3000,3001;2487;485;620;620;3907;3907;1856,3081;1835;2458;-1923;3232;533,566;58;930;129;620,1739;1769;295;58;1488;730,2390,2979,2980;1488;718,2422;620;620;1488;2777;1077;1488;2783;479;1455;694;533;1905;1221;2229;1901,1902;1835;1297,1736;1175,1412;2340;1556;157;659,3205;1556;2161;2045;425;-59,-60,-61,-62,-1557,-1882,-1909,3076,3077,3078,3079,3080;1271;58;1737,1738,1739,1740;58;3275;2931;1271;430;1488;1521,3121;479,1520,1523,1524,1525;767,2486;58,371,1018,2024;1018,1565,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,1738;61;979,2086,2165;1488;2363;60,426;1347;402,419,1138;1737,1738,1739;1271;787;1488;1808;58;58;58,1391,1772;1835;1141,1835,1836;370,3927;129;1740;1018;58,445;136;61,573;1741;1741;1738;387,1149,1150;58,98,3771;1737;1018,1740;3535,3932;58;58,885,1266,2382;445,600,620;61;129;3562,3563;460,659,1125,3372,3373,3374;505;3582,3583;1744;1736;1018;1769;1180;1018,1556;3425;3493;1797;1992;430,1556,1766;505,680;479;1738;58;1488;371,1347;308;1846;1018,1556,1769;505;135;58,571,654;1221;803,2021,2022;1207;2033;58,818;1104;1832;600,2331;1742;620;3959,3960;58,3496;479,2037,2709;1815;1488;157;659;1835;371;620;1122;495;2028;-156,-2820;1740;1856;157;1556;58;620;2594;1738;58,1488,3432;3444,3445,3446,3570;61;1986;620;1786;493,620;58;620;620,3179;2908;573,1905;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;898,978,2948,3025;1736;620,3297,3298,3299,3300;2432;542;620;479,1309;453,574,583,1740;2527;58,3119;620;966,967;966,967;58,1556;1738;3605;1488;58,402,505,1737,1739;1488;2395;718;1739;1488;426;20,-59,-1557,-1909;1556;58,3003;1738;2433,2434;1488;58;2732,2813;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;902;147;1855;418,602,1699;1737,1751;683;1769;1488;572,718,1741;58,71;969;58,1556;1488;1481;1488;1737;1740;1769;718,1737;707,970;571,2165;2375;1023;1739;1719;402,552,553;1739;1739;1719;58,71;58,71;1739;58,1556,3193;620;857;3372;620;58,1556;58;157;58,71;3622;453,1018;1018;58,458,1738;1556,1738;418;58,71;620;1488;506;1739,1883,1884,1885,1886;1371,1666;447;811,1526;923;-59,-60,-61,-62,-1882;1488;58;2171;58,71;58;1835;1769;157;1848,1849;-109,659,1574,1605,1626,1649,1669,1670,1671,1672,1673,1674,1675,1676,1677;809;718,1125,3569;649;654,736,777,1119,1298,1699,1736;1488;371;3211;493,523,583,620;1556;418,426,464,481;1085;1808;530,2252,2572;1808;1488;1488;681;857;1835;3747;1556;61,1702;60;1738;58,3827;1738;1556;1488;1018;659;573;651;1488;399;61;58,447,1898,1900;1493,1494,1495;620;966,967;2645;2792;2558;3111;447;573;3059;659;1498,1535,1536;440,2472;376;1856;135,1878;479,850;2072;1835,1836;3623;61;1737;1835;479,1198;1488;1962,2100,2101,2102,2103,2104,2105;1488;1804;1827,1828,1829,1830,1874;1488;58,505,3342;1815;157;157;2783;1488;61;533,576;395;129,2496;2665;1488;1844;1488;2496;1737;1079;1422;2928;480;681;1271;1737;620;479,782;2830;620;58;1835;3047;402,-1918,1918;1444;830,1457,1573,1574,1575;58,479,620,1737;440,3503;828;2257;3525;2749;1855;395;387,1149,1150;620;662,1556,1628,3523;1740;1835,1851;573;2141;1268;3405;577;2173;1556;659;3596;1488;1764;1835,1836;1488;1271;1556;718,1737;1488;857;432;2923;805;58;58,1556,3193;58,1556,3193;58,1556,3193;1488;1835;1271;778;1835,1836;3447;898;893,894;686;485,530,898,3743;1125,3569;857,1375;1305;1520;1147;1488;58,1125,3569;1556;1835,1851;2125;620;2423;659;900;480;407;3148,3149;3493;-59,-1126,-1557,-1909,-3570;432;1835,1851;3107;99,100;1736;1704;559;1808;1007;2093;659;620;559;1488;1150;464,493;445,600;-1909;1488;1309,1519;495,794;1488;129,1205;129,1815,2496;2032;1601;1018;371;1018,1019;3923;2071,2072;58,479,782,1122,1740;1125,3569;2196;58;479,782;1488;61;58;1271;1488;620;157;1018;1371;1317;61,493;3938;426,505,945;606;1272;1018;811,1526;945,1637,1638,1639;61;493;402;1835,1836;125;1855;3027;593,594;542;1488;157;505,527,654;1011;480,493,620;661,662,2098;493;480;2949;620;1488;58,1739,2413;480,620;445,600,620;1808;1738;1018;642;129;58,1741;1556;58;2281;999;620;58,445,1879,1880;811;619,620,1360;395,2522;2897;680,857,1151,1152,3319;1488;505;3210;1617;1125,3569;58,1591;620;1488;58,445,1018,1879,1880;326;1488;3957;479,857,1020;1488,2423;1018;1740;3051,3052;643;1551;1488;1741;620;1488;778;2220;659,1904;1972;1159,3662;3902;1488;1018;192,193,194;620;58,2579,2580;620;578;620;1018;435;147;1488;399,1233;409;409;409;409;1835,1836;479;447;402,426,620,782;2776;1835;479,1520,1521,1522,1523;1562,1577,1578;1488;811;402;-59,-60,-61,-62,-1882,-1909;161;1268;1512,1514,1515,1516;1835,1851;58;426,493;61;1738;2171;1769;627,2836;2642;542;157;426,686;1488;1625;1738;58,1556;433;58;2534;426,479,782;1680,1913,1914;1737;58,1541,1911,1912;135,3060,3061,3062,3063,3064;1740;58;1740;1739;1488;620;1741;157,1290;129;2585,3396,3397;1703;1739;1547,2333,2334,2335;147;1488;460;58;3198;1018;1018;502,1018;1474,1488,1572;805;129;432;857,2160;1018;58;877,2605;2677;129;157;493;953;1699;620;659,1501;1737;135;1435;1556;573;395;432;730;426,1739;692,1063;403;129,1814,1815,2496;1488,1520,2753;1876,1877;1330,1331;1738;984;805;1569;432;1488;620,1213;620,1906;505,620;1271;1794;61,620;569;1835;1429;2017;659,3201;620;810;1488;1488;2041,2042;984;2685;1488;129;1556,3417,3418,3419,3420;1271;1739;1018;58,413,1740;1271;1271;573;445,600,620;1271;493,1219;493;1271;1147,3065;1488;659;620;2165;1271;147,3626;440;578;129;440,2873;1488;573;1032,1033;1031;533;620;1488;1488;569,1835;-1909;275;1678;1018;1018;1739;1739,1744;1737;2137;2304;58;2732;2460;61,533,1699,3471;620;61;464,617;620;2554;2164;620;1738;1512,1514,1515,1516;58,71;602,620,1090;620;1459,1472;1488;2637;1837;129,1233;966,967;620;-59,-663;1843,1850,2507;1769;2790;1488;3649;431;620;426,479,926,927;1699;1272;1488;624;2426;1125;1316;1422;2369,3113;68,69;463,464,465,466,467,468;464;583,1781,1782;583,1781,1782;583,1781,1782;419;462,463,464,465,466,467,468;620;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;497,498;583,1781,1782;1738;583,1781,1782;418,453,493;583,1781,1782;583,1781,1782;495;1926,1927;620;1808;1488;2160;429;619;440,1488,3090;574,2727,2728;1689;395;495;2426;3413;1018;1832;1488;3016;1169;1488;125;445,2366;620;1704;58,59,60,61,1881;61,573;58;627;61,573;3632;620;620;627;58;58;620;58;620;61,451,480,573,602,1455,1699;58;1808;493;904;58,71;147;1077,1488;426,1018,1738,2865;1984;2783;3640,3641;1808;1198;620;157;2830;58;3632;620;904;2486;1739,2242;1488,1793;135,500,659,1347;508,736,984,2037;2375;1739,2242;1488;445,600,620;661;402,1737;1241;1018,1739;1488;1808;1488;495;1826;1070;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,2400;2647;1704;157;402,419,1736;620;1147;1761;1018;505;676,2216,2217,2218;1006;157;619;61,620;1488;1488;651,1533;573;387,1149,1150;426,533,1732;480,530,2252;620,1706,3449,3450;1488;730,2390,2979,2980;1835;1018;620;3858,3859,3860;2066;-1909;479;1371;426,479,1741;1488;1488;413,571;327,328;1137;157;135,500,659,1347,1565,1598,1599;58,464,620;3716;3716;1835;1571;2487,3382,3383;1018,1556;2090;1556;61,1556,1769;61;58,583,620,1387,1388,1704;716;540,541,542;1699;730;426,1739;1517;620;620,1737;659,3823,3824;542,1769;2590;61;832;1082,1741;58,61;2362;61,1739,2212;1737;58,431;526,978;1586;1738;573,1739;1488,1802;620;1429;620,1347;480;1498,1535,1536,1537,1538,1539,1540;407;61;1737;1045;399;2551;390;493;505;1914;395;1766,1794;496;1018;58,877,1895;620;129,154,1655;2883;1488;620;683,719,1737;426,1737;2783;834;596,1018;1488;399;1347;432;620;419;1488;58;58,1897;573;620;172,173,3564,3929;147,1347,1704;1832;1488;505,619;58,71;1018,1769;445;573;573;1409;135;58,1739;157;402;1738;1488;643;1914,2305;61;620;620;1488;1014;1738;-135,1361;505;659,3393;61;1738;1018;1556;58;58;1556;620;1769;1556,1769;1737;60;505,627,1738;1759;58,1018;371,1740;445,600,620;129,1815,2496;445,600;651,755,825;1738;620;853;440;493,620;1488;1271;2979;1556;1074;1488;58;1463;445,620;651;3919,3920;445;1268;1481;58,1769;259,260;58;1835,1851;1920;506;2451;3246,3247,3248;470,1051;1556,1738;1125;445;1488;157;1855;593;1488;2771;1271;1762;1808;1271;58,480;3869;619;1488;1488;505;505,620;1018;1018;1018;892;58,1556;620;627;440;620;620;61;2212,2686;1271;1835,1851;1271;157;2950;745;58,71;445;58,71;1371;1786;2392;3954;426,479,931;3847;608;445,600,620;857,2340,3319;620,834,2198,2606;1488;157;1779;-2820;620;1076;1737,1738,1739;1835;2021,3098,3099;958,1230;620;395;58;1066;1488;900;1737;1703;735;1808;3961;58,431;3493;1798;2830;1259;440,1797,2902;654;58;3493;58;1488;1835;453;3863;426,1101;573;573;1556;1119;500,655,1353,1354,1355;653,1753;399,1131;2026;620;1837;1107;2843;2560,2561;426,453,464,1704;583,1781,1782;583,1781,1782;2701;157;966,967;1704;573;413;1422;1271;583,1781,1782;583,1781,1782;1488;583,1781,1782;583,1781,1782;583,1781,1782;157;135;3835;2668;3134,3135;426,1739;1888;1737;2783;157;58,445,1879,1880;1167,1205,2699;426,1101;1488;1488;1740;600;-156,-2820;1115;138;2830;3195;1488;1735;493,620;620;620;620;1488;1246;426,1101;58,664;1704;966,967;418,426,620;1696;577,579;426,493;1147,2902;426;620,3689,3690;488;620;493,686;778;573;426,533,1732,2304;620;426,533,1732,2304;463;2417;620;1334;620;58,431;620;493;620;1018;440,479,1045,1488,1517;88;3482,3483,3484,3485;1488;1832;1488;3780;1257;399,1835;157;1170;620;349;2618;1375;3238;426;419,1737;58;1737,1738;2830;1741;2053;1426;371;68,69;2548;3286;1488;659;1835,1836;1835,1836;1488;2495;1907;1488;505;1178;1851;1488;1426,2805,2806,2914;1488;157;413,426,620;627,880,3606,3607,3608,3609,3610,3611,3612;573;58,1556;1742;3021;479;3218;1488;834;432;418;1205;1271;1422;1871;1738;1018;965;1856;1116;157;1835;1122;157;857;620;520;2979;620;1556;3252;2485;1205,1488;811,2851,2852,2853;2078,2079;1488,1617;58;913;911;58,71;1835;3493;3340;1160;620;1333;505;1221;147,730,3538,3539,3540,3541,3542,3543;3109;1740;620;2427;620;1246;58,620;620;1271;2506;1488;58;578;573;1835,1836;480;479,1403;830,1457,1573,1574,1575;1488;431,464,576;1493,1494,1495;426,1739;426,1739;620;643;1488;58,3479;493,1246;2212;3367;3964;1271;857,1382,2724,2784;984;58;1835,1851;58,505,1736;2423,2649,3092,3093,3094,3095;530,2252;526,796;58,1738;578;1488;3046;157;1488;1488;1835,1836;58;480;714;129,440,2753,2754,3507;129,154,395,440,1032,2751,2752,3507;1739,2426;659;2419;1739,3805;643;58,956,1889;3493;387,1149,1150;1488;58,3749;61,1769;1736;1738;402,447,1121,1122,1123,1124,1556;58;58,447,1018,1556,1743,1898,1899,1900;607,608,627;1556;1835;1704;1436;431,576,1699;426,1739;440,1570,1799,2442,2474;505;1835,1836;2510,2511,2512,2513;58;395;147;627;1418,1419;854;1018,1556;1233;399;1488;1205;573,620,718;3901;1835,1836;1498,1651,2733;1740;1738;1737;827;1032,1033,1034;1375;58,447,1556,1743,1898,1900;1737,1738,1739;1488;1467;1488;2029;1267;830,1457,1573,1574,1575;1488;157;1488;1276;1077,1488;58;2783;620;966,967;493;426,493;731;1156;1931;1808;58;440;993,1479,1480;659,3306;993,1479,1480;573;1488;1488;606;573;1840;1488;58,1556;58,585,1071;129,1814,1815,2496;1054;1739,2242;1737;479,782,1566;125,223,224;58;1488;432;2201;2375;1815;1409;994;838;1591;2445;3754,3755;2926;-1909;620;234,235;966,967;1018;240,241,242;1901,1902;58,413,453,505;1488;1739,2242;129,2496;402,430,1276;620;620;3917,3918;1792;355;395;620;426,431;620;620;463,861;2732;600;649;426,445;58,956,1889;539;505;2060;58,419,526,1739,1751;2783;1786;1935;157;3769;1018;97,98;3896;426;68,69;1385;70;432;447;3872;3209;620,2249;1488;620;805;1835;129;58,1018,1556,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;61;964;1738;1738;479,1466;1018,1556;1736;399,1808,1809;620;1488;157;1271;1488;3385;1271;1488;453,1738;1409;1488;1738,2259;627;2417;620;3394,3395;58,3579,3580,3581,3582,3583;1740;1769,3584;1769;2615;1018;1512,1514,1515,1516;480,533;1488;620;1488;1488;1936;588,1468,1469;60;447,705,1018,1556;2009;-494;58,3870;2391;1974;1835;1738;426,485,592;2783;1018;445,600;573,1735;430;1556;1341;620;605;58;1835;881;1474,1488,1572;-1909;3537;934;1409;157;157,1832,1835,1854,3176;129;608;805;157;58;660;493,620,761;817,984,2744,2745;1666;3892;1699,3363;620,1699;620;620;3131,3132,3133;3131,3132,3133;3131,3132,3133;3974,3975;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;2836;539,620;431;58,620;58,3119;1246;505;480;445,600,620;61;58,464,620;58,431,638;58,431;1425;620;419;2494;1488;1719;488;418,533;1739;2596;539;1488;1488;1617;464;3002;418,1719,1730;58;402,426;1911;749,750;1740;1488;1018;58;1740;505,528,1173,1736;573;250,251,2296,2297,2298;1018;2541,2542;2542,2555;3372;1740;1738;1740;718,2225;1737;480,1738;1018;1586;1739;1739;1018;602,2108,2109,2412;1018;778;1816;573;1488;662,1610;440;620;135,923;1488;1737;1488;659;58,1018;1835,1836;620;58;1018;1125,3569;58,135,495,1147;58;58,1018;154,1655;58;1586;1488;-156,2830;157;157;1271;778;58,1018,1898,1900;440,1797;58,447,1556,1898,1900;3830,3831,3832;1347;1488;3194;1554;1488;1488;772;402;966,967;1719;1268;2117;2392;681;2595;533,576,1229;1018;432,620;440;58;440;830;659,1556;426,1739;1556,3417,3418,3419,3420;620;1769;61;1737;1556,3417,3418,3419,3420;1556,3417,3418,3419,3420;58;3422;1556;58,59,60,61,1881;1488;620;1488;1556;1692;3970;61;-1909;2344,2650;573;157;1147;395;1570;58,1737;129,135;493;1832;2519;2081;1488;432;1196,2552;3591;1018;464;431,620;61,154,620,730,2347,2348,2349,2350;3571;778;1488;157;449;998;1488;1423;694;1945;407;1521,3855;157;1835;1837;3104;2725,2726;157;1462;2599;1808;1737;1488;464;480;480;2186;1488;493,620;58;519;2190,2191;1488;399;157;1191;2003,3545,3546;1835,1836;1488;1018;129,479,857,2808;1488;1488;1488;-1909;395;620;1116;1018;923;1488;493,686,1726;1147;1018;1737;464;620,1205;432;620,1488;2734;2732;2050;3251;1382;2112,2113;1711;1711;1488;1766;1018,1766;1835;1835;620;432;620;1348;1699,2076;1470;895,896;893,894;58,464,767,928,2146;893,895;1990,1991;1808;1018;1125,3569;157;1326;1541;1268,1488;1832;1738;61,620;119,120;2931;387;1002;1488;3955;2396;1488;1795,3344;2287;1205;597;597,811;597,1122,1521;1488;1808;1488;1488;129,984;1835,1847;1738;2262,2263;1853;1018;3328;129;3207;3692,3693;1488;125;58,718,1005,1751;3632;659;1347;539,1228,1735,1978,1979,1980;418,493,1719;2478;2567;1488;676;1488;1488;402,581,1752;426,479,782,1007,1238;1715;1018;2506;2783;390;440;1138;446;1739;1246;2886;1835;1488;1737,2327;426,1739;620;688;1246;1488;620,3656;3658;2732;1147;817,1495,1497,1500,1501,1583;970,1488;3253,3254;1835;614;479,1520,1521,1522,1523;1799,1800;3881;58,1556;430,1018,1123,2664;761;827;1835;1347;402;3222;-109,1574,1618,1619,1620,1669,1670,1671,1672,1673,1674,1675,1676,1677;1835;1271;1375;61,573;1739;620;157;620;150;1827,1828,1829,1830,1874;399;61,620,2538,2539;1488;805;1808;61;620;493,1704;1488;1089;1855;1835,1836;58;1488;663,767;1488;1741;453,795;3668;526;1125;129;857,1787,2529,2530,2531;58,591;1319;2815;58,445,1556,1879,1880;2143;1556;620;1562,1577,1578;1488;58,1018;58,1376,1377;3215,3216;1488;58,857,1347,1556;1488;1032,1033;573;1556;60,805,1556;440,1797;1276;1488;58,883;794;157;1835,1851;58;435;426,1739;440,1313;1488;1835;1025;1556;1739;58;1018;58;659,1901;627;1488;1271;1597;479,718;778;1488;1488;2547;494;157;620;1488;1722;464;1488;409,412;1835,1836;479,1520,1521,1522,1523;1264;157;1835,1836;505,648;157;1281,1282;659;58;495;1159,3662;1488;1125,3569;1739;58,627;620;445;58,419,593,1645;2783;578;58,2614,2615,3191,3192;1744;1856;1739;58;620;1556;-2820;1488;1488;98,1556;440,2235,2528;2469,2470;-156;495;1488;1246;447,1521;1147;58;1018;1989;1488;1488;1378;1422;267,270;1835;2768;-156,-2820,2830;1488;2525,2526;3033,3034;1704;1488;1488;426,1739;3659;1409,2371;451,620,1122;530,2252,2572;620;620,3309;2431;493;620;464;447,1125;129,1699;1018;1556;966,967;966,967;-109,1574,1592,1593,1594,1669,1670,1671,1672,1673,1674,1675,1676,1677;573;58;58,463,513,1214,1215;157;495;157;2162;1556,2162;1808;1251,1252;398,1175;785;2810;1876,1877;1876,1877;1835;426,1739;1474,1572,1651;853;1018;953;620;493,620;58;1488;985;157;1232;578;1122;58,493;129,1797;573;157;620;1488;858;534;923;129;1611;1271;58,505,574;1738;1738;1271;58;407,1835,1836;1371;1769;1488;1808;1271;505;413,419,445,500,723,724,1699;676;620;620;230;651;2254;3826;1266,1835;1099;-156,-2820;1271;673,674,675;1271;493;1840;3347;479;1057;1018,1739;157;620;1739,2465;1737;1741;1744;620;399;1246;426;1488;2732;620;3825;3720;58,2795;3164;61,2939;966,967;542,573;620;1840;1724;1488;419,1739;3386;157;1018,1885,1886;1886;180,317,354;440,1344;1808;1738;1488;1488;1667;426,1739;445,542,1447;1018;58;1488;620;1739;620;620;58,1559,1560;1488;620;649;129,1814,1815,2496;778;620;778;670;773;1018,1769;1808;1117,1885,1886;2123;631;1395;236,237,238;432;807;767;1018;778;762,763,764;3460;1740;1488;157;1422;58,1256;1256;583,1781,1782;583,1781,1782;600;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;462,463,464,465,466,467,468;583,1781,1782;3697;966,967;2932;407,1835,1836;1490;58,1740;440,3097;715;-1909,2646;1018,1556;1100,1175,1443;811,812;321;1608,2718;98,3725,3726,3727;2552;427,857;1488;1488;1018,1488;651;681;1122;479,782;966,967;620;659;58,1391,1772;620;620,2133;627;620;61,3885;620,2244;620,1778;620;60;627;1704;1122;3002;656;464;464;1459;395;533;1488;1077,1488;3843;2090;1475,1476,-1478,1478;1846;1738;500;1876,1877;464;1785;387;2783;3756,3757;1488;2204;1488;1488;1347;1994;135;662;58,585;1147,2464;1803;1835,1851;1488;480,573;994;681;1488;58;1808;493;620;1488;2375;-156,1272,-2820;834;1488;1488;979,1207;-2820;1271;-2820;1737;1488;1835;573;1488;1488;2238;1246;1488;805;997;1488;3278;2450;1422;1422;573;157;453,463;1320;620;3893;1750;1556;1739;1018;479;479;479;1488;900,943;3547;2145;1095;1391,1392,1771,1772;1347;129,1586;2406;659;961;1556;58,464;435;3028;1591;1835;479;651;978;58;1236;1271;1271;1440;3223;1488;1738;978,2577;620;493;493;1216;20,360,361,362,363,364,365;2031;1420;419;1205;1740;1122;464,576;58;620;129,1815,2496;620;157;431,620,2265;58,61;2656;1799,1800;620;58,685;622,1187;573;1266;573;3698;426,1739;58,493,508,509;1488;1488;573,659;573;1498,1500;1942;-1909;3768,3809;1488,1797;157;129;1488;620;157;3380;58,1896;58;58;1045;414,415,416;730;3936;900;1142;719;1244;129;654;805;1683;157;3032;157;157;1835;440;1838;58,129;432,1737;1556,3417,3418,3419,3420;1032,1033,1034;1488,1556;1018;1018;-1909;58;58,1897;2187;2040;58,2593;58,2593;135,58;58;58;58;3108;460,1018;2491;427;1738;1080;620;966,967;1403;1272;834;1422;1053;147;464;620;659;157;1488;1738;1488;157,1855;157;157;1591;1738;407;426;157,820;659,1712,3406,3407;154,157,424;1488;1737,2269,2632;1738;426,1739;1018,1738;966,967;1737;1018,1738;2416;413;435,447,1018;620;1488;811;3704;1018;426,1739;157;1835,1836;1835,1836;619;1835;1737,1738,1739;1018;1147;1835;1488;1835;1455;1142;588,1468,1469;58,61,1556;3048;1488;620;1740;3839,3840;493;1428;493;2345;58,61;837;298;2506;857,1737;3648;1774,1775,1776,1777;2783;58;1835;395,1361;3070;1018;2162;177;157;212;2568;1498;1808;1808;371;2107;1147;659,1941;3024;430,1018,1766;1488;3708;58,542,573,1769,2748;58,2748;1488;1785;61,542,573,1488;58,447,1018,1751,1898,1900;1488;1739;811;157;808;2090;1835;1737;61;1738;1556;620;1246;488;493;1271;61;1488;58,59,60,61,1881;3876;1488;1840;1271;1808;1488;573;141,142;1556;2048;780;795,2036;1808;1362,1363;1832;3537;1736;157;58;98,3851,3852,3853,3854;-1909;1737;1488;620;1835;1835;1271;1271;811;1422;413,2169;2098;58,2169;1738;61,542,573;573,857,1708,2761,2762;1488;1488;1422;122;573;426,1739;58;1805;157;2367;2672;480;654,793;60;654;1737;1742;58,435;1742;1737;3926;480;1378;58;681;419;583,1781,1782;463;3706;1586;-1909;58,928,1742;402,419,755,832,833;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;395;1973;3871;2985;2364;58;58;1163,1164;495;129,2496;1488;2031;921;1739;61,686,1735;620;620,672;1699;1704;620;620;426;464;533,620;426,533,1732;1699;620;620;620;426,533,1732;1246;539;426;493;2304;426,533,1732;778;463,1724,1725;480,533,590;445,600,620;778;493;58,413;58,413;1246;61,659;464;445,600,620;1488;678;620;58,440,786;1832;1740;1556;1556;157;1901,1902;2735;756;559;1488;418;1488;1130;3015;1026;480,620;58;957;82,83,84,85,86,87;620;1493,1494,1495;1122;2075;493;-1909;1488;1488;3490,3491;1740;418;2979;-1909;157;1808;542;966,967;1556,2253,3411;1742;2090;3548;720;681;1835,1851;418;1488;3002;58,603,604,1740;2597;803;505;1488;58,707,1018;1117,1885,1886;620;1835,1851;1488;135;3083;480,2479;58,493;61,1556,3414,3574;620;2675,3277;857;147;440;3066;620;183;426,1739;479,1549;620;620;493;61;58;620;1742;493;3212;493;627;135;431,576,1144;267,268,269,270;495;1105;1737;1488;573;479;440,1797;1737;479;1740;1488,2488,2489;3288,3289;2995;1488;479;2320,2321,2322;440,3070;620;58;426,1739;1488;1744;440;3629;129;573;1488;811;1488;505;1739;1268;1835;283;58;58;620;729;3721;2506;1253;3217;1739;480;480;-135,1361;659;430;447;1832;811,1526;58;387,1149,1150;58,1739;2171;1740;1488;402;1808;1488;3837,3838;1488;620;58,3749;620;651;460,1556,3549,3550;58,3848;1018;730,830,1556;1018;1997,1998;61;445,600,620;58,453,1738;1556;460;58,61,3844;58,60,999,1018,2857;-135,1361;464;175;430;402,723,776,777;829;1018;966,967;505;1740;440,786,824;620;2719,2720;857;1488;1488;493;620;1337;3429;61,573;2060;3861;1738;1739;1488;58,447,1018,1898,1900;1488;606,710,1077,1100,1561,1562;1123;1488;1277;129;399;1740;129,440;1272;1488;1488;2976;2637;941;2849;3350;1422;2085;1938;1271;1808;58;1434,1835;1808;696,697,1738,1739;1368;1835;1835;1827,1828,1829,1830,1874;371;129,2496;129,2496;1623;399;1856;2652;479;620;1835;157;277;827;1556;58;1390;418,620,1140;1462;620;3257,3258,3259,3260,3261,3262,3263,3264,3265;659,3320,3323;453;157;445,795,796;98,991,1515,1574,1656,1657,1658,1659,1660,1661,1669,1670,1671,1672,1673,1674,1675,1676,1677;659;606;778;1147;1393;58,956,1889;710,1562,1577,1578;3555;573;1697;1835;1443;1271;1271;857;1835;1835;1488;778;58;1074,3021;1000;1738;1769;1488;1710;649;1443;1018;620;-1909;-156;1556;1221;58;2457;1488;1422;1271;1271;620;427;3131,3132,3133;157;157;1520,1754;479,1520,1523,1524,1525;58;1738;620;1271;1271;1382;61,1488;2346;620;2365;659,1273;464;58,1018,1391,1772;231;1018;1556,1769;1739;1748;678;1271;966,967;58,464;61;1125,3569;619;129;747;620;1488;1488;1742;997;2835;1488;1488;395;395;620,1738;426,1739;2284;530,898,978,3025;659,1698;1018;58,402,447,528,529,1556,1704,1769;426,1739;2872;1556;1856;1838;58;760;58;620;2035;3089;1840;493;-1909;1259;1488;2208;2713;1271;157;1737;1766;1835;3122,3124;453,857,1738;58;1125;315,1815;1488;371;157;1271;3486,3487,3488,3489;2755;687;1869;61,1699;620;620,1122;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;3131,3132,3133;641;966,967;1018;58,402,419,755;1018;620;850,1214;451;426,446,1003,1205,1206;58;620;61;966,967;58,431;966,967;418;1556,2694;157;58;1265;1488,1799,1800;1391,1392;1018;58;58,1740;1193;966,967;1488;418,533,620,1719;58,620;1740;1738;3619,3620;1488;1018;427;800,801;3427;1622;464;1556;1739;2541,2542;2542,2555;659,2437;1737;1769;1739;58;1738;718;707,1018,1748;1488;58;480,1719;58,1018,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,2400,2404,2405;1271;1740;1381;1740;1488;1488;2407;1737;493;493;493;1326;1488;58,479,782;1556;778;778;857;620;1125,3569;980;1719;1488;620;1737;1738;857;1835;445;2338,2339;1317;463,648,2732;811;620;578,620,978;1704;505,755;1422;1259;3898,3899;937;1488;2023,2088;1556,3417,3418,3419,3420;129;1740;453;371,1666,3524;1739;1736;3504;445;1488;659,1563,1564,1565;1737,1738,1739;923;2340;620;2534;1799,1800;624;432;1488;440,1495,1543,1544,1545,1546;735;480;966,967;1738;129,440,2466,2467;1488;620;1835;1271;2830;1250;98;619;1488;1835,1851;129;1737;952;620;1488;1488;418,575,620;1488;1488;966,967;620;88,3241;3884;431;1488;390;1272;692;1488;157;440,2473;427;1167,1434,1488,1491,1498,2676;811,1526;1488;620,2227;620;1666;1720;1250;157;620;620;402;464;1059,1726,3522;508,1089;1488;1488;1125,3569;2732;966,967;1488;1488;2490;129,440,2659;3493;1835;1835;620;431,464;58,1556,3193;58,1556,3193;58,1556,3193;58,1556,3193;58,1556,3193;58,1556,3193;2506;156;985;1835;767;877;481;463;129,130;395;1077;1422;663;620,978;2881,2882;1422;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,1981;1488;1488;1488;1488;1762;60,597,1488,3120;1422;1808;435,620,655,2264;3328;58,505;1488,2423;1740;817,2818;58,1013;1739;500;-59,-60,-61,-62,-1557,-1882,-1902,-1903,-1909;58,1006,1751;418;1488;1488;1808;3515,3516;620;526;3493;811;157;58;852,2625;3213;1128;58;718;1855;3346;707,1125,3569;3295;764;1488;1556;1125,3569;1835;426,2498,2499;2864;1737;1397;2875;1122;1488;135;58,898,899;2642;620;-721;2252;1566;1808;1808;827;1808;738;1107;3229;2506;58;625,2742,2743;109,110,111,2155,3070,3331,3332,3333,3334,3335,3336,3337,3338,3339;3271;827;2693;2693;1556;1556;1691;453,1112;2017;593;3951;627;681;157;440;1018;620;2787,2788;1488;1835,1851;710,3554;1835;1229;808;778;778;432;2506;769,1737;1488;58,606;432;1799,1800;979;1737;1488;1835;432;1271;157;1740;2131;1498;730,1045;3662;857;426;435;526;1835;878;2253;707,1018,1751,2253;991,1515,2915,2916,2917,2918,2919,2920,2921;58,956,1889;1271;1488;58,1559,1560;808;620;3903;2160;573;506;399;3276;805;435;435,707;1488;3683;1808;1205;432;3036;966,967;58,2588;1342,1343,1737;620;1018;1488;135;1835;1738;1739;387,1149,1150;2114;857;445,600,620;1018;3668;620;1276;1271;493,620;157;1488;1488;58,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;3412;1145;1587;659;1737;58,59,60,61,1881;620,1739;58;1077,1488,1547;1045,1799,1800,1801;2211;157;620,2227;620;1488;1194;1475,1476,-1478,1478;1488;447;58,479,620,805,1309,1602;1018;1488;1488;1474,1572,1651;157;464;697,1018,1122;756;620;778;1147;857,3319;1488,2992;2570;426,1739;2562;1488;806;3039;2988;493;68,69;620;508,966,967;663,2948;681;371;1488;493,1723;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;842;842;808;659;533,620;620,710,3090,3588;620;808;2293;505,1332,1556;89,3388,3389;1422;1488;129,2629,2630;2783;58,447,1739,1898,1900;1488;440,1495,1543,1544,1545,1546;2789;1271;659,3341;1271;1271;795;1741;1856;3599;58,718;1268;2375;1271;1271;426,1739;1271;480;1271;480;1271;811;493;419,445,723;500;3067;830,1457,1573,1574,1575;425;903;1588,1589,1590;1488;464;157;1459,1472;1737;811;573;2783;493;1488;157;876;1488;1737;1739;2714;58;778;914;1462;620;620;2939;573,620;620;620;620;620;533;464,620,1905,2221;620;620;533,620,2578;1808;387,1149,1150;495,1455;1738;1556,1739,3417,3418,3419,3420;620,1736,1739,1748;58,2524;778;620;1018;905;1490;-156;3039;2303;620;3434;1808;1488;451;-1909;1488;662,1612;1737;440,1443,1617,2592;440;135;432;620;950,1256;583,1781,1782;583,1781,1782;583,1781,1782;583,1781,1782;1840;129;1808;596,597;1832,1841;58;1488;1488;777;3662;2418;808;1246;659,2731;58,1556;573;2369;1100;694,1018,1488,1700;1488;1271;1808;1277;2098;1488;1488;427;530,765,1056,2137,2138;58,956,1889;1268;620;58;620;573;533,620;620;58,2924,2925;1737,1738,1739;761,973,1003;505;447,1556;440,573,1018,1556,1578,2629,3152,3153,3154;500;1443;620;493;58;542;493;573;1125;58;600;432;464;1488;1488;1018,3219;1739,2242;479,1371,1498;157;427;573;1443,2235;1488;805;58;61;1358;1333;1488,1715;1835;1488;681;1159,3662;559;129;1422;58,59,60,61;1147;1808;1835;620;129;1488;480;387,1149,1150;1808;620;157;453,463;453,463;453,463;453,463;453,463;453,463;1326;125;1278,1279;58,413,427,453,528,845;432;1463;135;676,1205;464;329,330;659;1737;2151;58,1273,1706,1769,3020;2502;1835,1836;157;157;878,1181;463;2496;1488;88,1859,1860,1861,1862,1863,1864,1865,1866,1867,1868,3150,3151;157;1785;1737;573;1738;573;573;1018;58,573;1739;659;1766,1767;620;1808;1438;572;157;1488;58;1077,1495,1651;1146;447;683;426,1739;683;157;402,1699;157;1835;157;1488;58,1897;1422;2340;426,533,1732,2304;1907;129,2030;1488;2809;387,1149,1150;683;620;1488;1741;857;1422;1521;387;445;966,967;1808;2783;1769;391,392;1737,1738,1739,1740;1837;3900;2725,2726;1832,1835;3632;426,1739;58,1556;58,129,1012,2946;1018;1679;1770;659,1556,2119;600,795;1488;1021;389;1488;1835,1851;1488;402;620;1855;1488;2986;129;620,1213,2370;464;2209;464,2250;479;1488;1737;573;2794;1808;-135,1361;1271;59,1117,1739,1882;1736;1654;1488;2887;2176;1017;1808;157;1488;1808;1808;2628;620;1488;3387;1835,1851;1175;1488;1488;58;433,560;1271;1488;58;58;3667;1422;1488;58,573,1965;162;505;-135,1361;431,576;1255;739;395;958,1443;440,1797;493;827;3893;2778;1738;1762;3186;1556;620;1488;830,3502;399;432;493;463,586,587,588;827;1271;2021,3098,3099;1488;1785;620;681;1488;58,431;58,418,493,508,526;1488;573,3660;1827,1828,1829,1830,1874;1488;659,3096;2976;576;1808;1738;3695;58,1354;1738;61;490,506,620;490,506;620;3699;1827,1828,1829,1830,1874;1488;2493;900;1488,2037;583,1781,1782;1835,1852;583,1781,1782;58,463;144,2121;3234;1835;1738;1271;1271;1271;1488;1162;561,562;495;984;1681;58,1746;59,1117,1739,1882,1885,1886;1292;58;1885,1886;58;59,1117,1882,1883,1884,1885,1886;526;1951;-135,1361;3018,3019;686;906;620;1246;966,967;463,490,492,493;681,1801;2427;3598;464;1205,1488;620,898;573,857,2761;426,533,1732;463;426,533,1732;426,533,1732;463,1724,1725;620;620;426,463,620;426,533,1732;620;426,533,1732,2304;58,620;620;537;620;445;493;2222;966,967;1488;1488;1556;1125;1488;129,2504;1488;808;1488;58,1901;3490;3866;1488;303,304;3224;229;543,544,545,546,547;543,544,545,546,547;505;1738;1738;620;1737;1268,1488;431,464,576;399;3002;1018,1488;1835,1851;1371;1459;857;440,1443;1769;493;418,463,523,524,525,526;3361,3362;966,967;1835;827;620;1125;627,880,3612;1488;620;620;526;1422;1835;3082;647;157;1556;1740;1488;1422;2171;58;2655;1271;2729;1835,1836;620;1271;2352;1488;2312;3225;58,61;61,608,3414;1737,1738,1739,1740;808;2884;620;2947;60,573,659,1556,3616;1409;805;808;827;129,1797;1856;1017,1736;58,505;1488;58;1488;2898;129,1815,2496;1488;440;814;1835,1851;694;58;1488;620;808;1018;1018;1018;395,2783;620;1737,1738,1739;620,1742;58;1905;898,978;2209;445;778;620;620;58,620,1704,2866,2867;620;576,1229;464,576;505;827;3399,3962;1799,1800;1556;781;530,1107;1488;1808;2252;2687;440;58,2248;1335;135,855;58,445,479,527,1434,1738;426;1709;1271;659,1999;808;1835;620,676;1271;1785;1855;659;1835,2798,2799;1488;573;58;1271;419;2702,2703,2704,2705,2706;1347;1378,3675;2266;2778;398;157;526;61;200;857;430,2617;447,1018;620;1488;1488;300,301,302;2502,2712;3084;60,1786;60;1488;3762,3763;620;58;58,3749;621,622,1740;659;1556;61,608,1556,3414;1835,1851;1798;2246;402,723,776,777;464;1556,3417,3418,3419,3420;1488;58;58;1018;1488;2453;2049;676;1488;1556;1018,1556;1556;1738;1147;3647;157;1375;1347;1821,1822,1823;2876;1488;1488;500,1738;517;2468;1738;1032,1033,1034;2050;1488;857;61;966,967;778;966,967;3105;58,1541;-135,1361;-156,-2820;2797;1018;1808;828;2390;1186;2280;1856;1808;1808;407,1840;387,1149,1150;620;1556,1769;1808;1556;500,612;1740;601,755,973;530,531;129,2496;1488;125;2279;2888;1738;1488;58,61,573;480,620,2763;1799,1800;2077;1018;154,395,405,857,1032,2751,2752;620;1422;435;1835;1018;395,1751,2678;502,1018,1556;830,1457,1573,1574,1575;447,1556;1488;1835;620;98,730;1835;1570;620;1529;1246;1827,1828,1829,1830,1874;1835;1488;827;1422;870;1498;157;620;2737;778;1488;58,956,1889;1738;3587;11,20,360,361,362,363,365;157,1290;827;1737;1271;1488;1271;135;1488;3146,3147;979,2086,2165,2255;426,1003;1271;1271;1271;1271;1488,1739;2020;1459,3364;661;2054;1138;426,480;1835,1836;1271;1271;-109,659,1011,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677,3326;1271;1116;58;1018,2730;1738;1556;413;542,573,805;583,1781,1782;1556;708,2117;1805;154,1498;748,754;58;1488;58,1391;3318;627;597;1018;3963;620;1018,1738;58;-1909;1488;1488;1488;994;3244;620;-1909;493;1122;620;1738;58,402,528,529;648,1273,1769;1018,1738;58,493,508,1090;620,1018;718;-156,-2820;914;578;578,914;1739;157;129,1484,2059;620;157,387;1074;255,256,1825;1488;1738;1835,1851;3534;1271;1737;1835;1835;1488;402;1271;1271;620;1738;495;58,573,857,1521;620;620;-135,1361;1271;58;3486,3487,3488,3489;3921;3889,3890;3294;2994;58,61,1699;480;2213;1366,1617;1704;3131,3132,3133;978;3131,3132,3133;1303;573,620,638;431;58,464,620;58;778;431;533;778;749,752;1699;620;638,2212;966,967;573;1488;2783;710,3554;440;620;488;58;619,681;1488;493;1488;464,665;2591;129;2304;454,3226,3227;749,752;-1757,-1758,-1759;1556;505,1018;58,1018,1738;528;1719;493;620;1719;1018;1018;620;1045;659;620,1704;1887,1888;3733,3734,3946;811,1526;1488;432;1463;811,1488,1551;1440;1018;2584;1919;1488;1488;1018;620;58;1556;857;620;1122,2157;1835,1851;620;1488;387;426,1739;426,1739;2783;1738;1488,2218;440;1272;966,967;1018;966,967;707,1018;620;701;857,984;2910,2911;1799,1800;1325,1789;129,445,620;2779;917;1808;3249;573;1738;1488;1488;1488;1488;147,2658;387;157;1488;1488;1488;1488;676;654;3493;505;431,464,493,576;426,464,493,620;387;2945;1271;1246;1083;493;1740;1347;387;573,1488,1586;1737,1738,1739;1488;3930;1122,2139;620;1488;426;620;480;1956;1271;432;1271;620;530,2252;98;387,1149,1150;681;204,205,206;730;619;539,620;620;1205;2388;778;1488;390;1835,1851;426,480;426,480;426,480;61,659;528,1747;620;418;1488;1769;1556,1766;1488;1107,1379,1380;1488;1422;157;335,336;447;402,1243;440;2533;1706;470,616;1840;-109,945,1529,1574,1626,1646,1647,1648,1669,1670,1671,1672,1673,1674,1675,1676,1677;1835;58,464,894,896;58,893,894,895;898,2136;1488;3185;387;1422;447;1840;1495,1497,1498;3621;620;923;1488;1488;1806,1807;1229;2931;2171;440,1443,2336,2337;3328;202;1065;1488,1567;1617;440,1797;1488;1556,1769;1488;1488;1488;407,410;730;620;1488;1035,1036;157,1835;803;1835;2544;1246;2142;1310;1488;1488;1488;1188,1189;1488;3013;1488;1835,1851;418;620;479,1309;117,118,399;526;659,805,857,1715,1856,1956,1960,1961;399;493;827;1813;826,827;407,1840;1835,1851;761;-1909,3681;172,173;1808;172,173,3929;176;1835,1851;3106;1271;1271;1371;1233;1808;725,726,727;1736;1488;600;1488;1808;2306;1840;1488;830,1457,1573,1574,1575;681;1744;620;2178,2179,2181;1488;620;1488;3891;2506;58;821;157;440,1495,1543,1544,1545,1546;1122;1147;1488;1271;3552;1556;2090;863;58;2534;2931;58;2626;743;58;1840;1488;1835;371;681;1268;409,1808;3662;3765;1739;1556;58,3810;447,1766;447;1488,1790;991,1515,2915,2916,2917,2918,2919;447,1556;1586;1488;1488;1488;1167,1495,1582,1583,1584,1585;1488;1907,2812;1018;620,2249;447;435;2080;1488;680;1835;1018;98;1205;1808;3174,3175;1808;1373;620;620;808;2090;1835;1644;1574,1627,1669,1670,1671,1672,1673,1674,1675,1676,1677;1614;3770;58,1556;58;1740;58,834,2116,2198;58;1556;1488;58,1517;58,1591;1462;1488;1835;1488;3902;157;1147;1488;1835;1835;1018;1488;1556,3417,3418,3419,3420;280;1835,1851;1835;620;1835;1018,1123;1488;479,1016;495,794;2265;402;1798;2783;1785;1488;58,431;620;2037,2423;1467;58,2807;1045,2132;1556;2506;778;480;2161;58,61;1488;-156,-2820,2830;1808;3849;944;306,1876,1877;157;1876,1877;1876,1877;157;413;1429;1409;157;620;1443;620;432,463,883;58;1832;245,249;157;440,1797;1271;2783;157;3231;157;1528;778;1704;129,2496;620;652;479;1271;1271;778;371,1699;460;1271;1488;966,967;658;1271;1271;1271;1808;778;966,967;3632;778;778;190,191;1488;1488;2083;1488;1488;830,1457,1573,1574,1575;157;1347;1835,1851;1246;651;620;157;966,967;1651;778;533;620;1738;1488;485,3913;157;1205,1586;978,1735;620;58,60,61,620,1699,1769;493,620;2687;2989;505,1628,2135,2136;371;480,2119,2120;2209;620;620;2697;58,1339,2842,3161,3162,3163,3164;1729;620,2177;506;620;620;427;778;1271;1556;2092;1488;440;834;947;993,1479,1480;533,816,817,818,819;620;431,464,576;966,967;778;2235;1840;157;1001;2140;620;129,1488;1488;3375;997;3375;2721;1018,1117,1885,1886;583,1781,1782;573;2805;1488;157;154,1655;488;58;1856;129;1840;493;440,1797;493;1739;542,573;966,967;778;2830;620;3632;3632;620;620;620;493;2192;1835,1851;808;1488;1488;3350;1737,1738,1739;3053,3054,3055;808;1738;1488;2352;966,967;1840;643;1200,1488;3722,3723;3220;1495,3110;2090;573;627;958;1488,1791;58,1940;-156,-2820,2830;58,98,1520,1605,1606,1607;157;2375;1737,1738,1739;157;1205;1737,1739;1736;395;440;558;1835;3856;1488;3604;1488;513,1488;620;1159,3662;1781;1488;157;2626;479;479,782;1371,2130;479;58,1556;578,651,1482,1483,1484,1485,1486,1487;1488;3688;1835;430,447,1740;1018;1737,1738,1739;129;399;1422;1835,1851;1835;1737;2489;1556;493,620,966;61,1488;1488;1488;58,59,60,61;58,1273,1706,3020;1488;1488;827;292,293,1091,1092;817;3285;2621;2553;1738;58,61;620;573;620;620;1541;620;159;1488;853;1488;619;2163;1488;129;129;88;620;58,1434,2343;58,620;1032,1033,1034;1205,1488,1556;1205,1488;440;1018;1205;58,1746;1018;58,1556;402,1699;402,1699;402,1699;500;1827,1828,1829,1830,1874;1827,1828,1829,1830,1874;1835,1851,2056;1271;827;1422;157;58,1897;387,1149,1150;2106;681;2783;129;573;432;2783;3883;778;1391,1773;3280;620;620;530,531,638,1213;58,1769,1886;413,3566;58;1017;1769;413,453,1737;1739;583,2203;1740;1018;1738;949,950,951;1205,1488;1666;1488;1271;60,61;1741;1205,1488;157;3934;426,493;620;1106;464,576;402,620,1556;620;445;1018;2302;464,576,1229;620;1125,3569;58;620;1349;2355;1122;418,620;1556;1835;1835;1856;1253;399,1808;1488;3493;1835,1851;778;1835,1836;1018;620;129;2604;1808;58,928;157,1114,1835;1488;1488;58;58,479,1737,2674;1488;433,533,3666;61;1488;1666;542,573,1488;431,620;1488;395;2304;620;1737;371;1556,3669,3670;1122;1541,3644;157;1416;2352;1119;2505;620;1488;1488;135,542,573,620,1740;1371,1498,3798;1205;3022;1271;643;476,1835;1422;2626;58,573;2626;390;1424,1666;447;1520,1763,1796;1488;112,113;58,818,2716;402,693;68;1738;1455;606;1713;1835;620;1347;1422;125;1488;1808;620;3330;464;583,1781,1782;3268;389;387,1149,1150;573;533,620;583,1781,1782;583,1781,1782;402;1246;2668,2669,2670,2671,3973,3976;58;1045;129,2496;3877;1410,1411,1736;1835;573,857,2761;426,533,1732;778;1051;2209;493,620;460,1125,3428;620,1488;620;620;426,533,1732;533,1731,2304;426,533,1732;620;620;1122,1570;1457,1458,1459,1460;542;1443,2356,2649;60,453,1018,1737;1488;943;533,620;928;620;778;1125,3569;1738;1856;1488;2208;1835;2219;2219;2219;1488;1591;620;440,1326;1422;1488;1488;1799,1800;505;1030;157;440,1797;1413;1832;3196;966,967;1835,1851;1488;1313;604,1740;157;1488;1336;2552;3271;61;1734;157;1653;1488;1855;1422;1122,2128;1799,1800,1801,3545;440;1488;1808;1416;1913;620;618;1147,1737;620;1738;2663;1769;1835;1488;2489;778;620,2906;966,967;620;2384;371;966,967;620;620;1366,2756,2757;1367;1488;1738;2165;573;620,1799,1800;2913;1488;659;3051,3052;1488;1738,1739;1741;671;60;619;500;426,1739;1488;1835,1851;1835,1836;620;480,530,531,532;294;402;936;72,73,74;1271;1271;58,402,979;2073;1205;1246;1422;710,1556,3090;500,1835,2482;2508,2509;1488;3305;1739;1488;707;460;841;1832;2700;1737;440;1808;1808;371;1488;1808;320;2515;58,447,1018,1898,1900;-135,1361;786,1488,2442;1556;157,399,400,401;3800;1488;1488;1488;1159,3662;58;2046;1739;2949;1122;916;966,967;157,761;1808;1488;1488;58,447,1018,1898,1900;58,447,1018,1898,1900;1835,1836;681,1488;1683;1488;129,1488,1578,2792,3007,3008,3009,3010;2134;1440;1488;1488;1488;1488;1488;479,857;1488;431;966,967;620;493;620;131,132;135,1556;1488;1488;718,1737;460,1018,1766;430,1737,1738,1739,1740,1766;3536;1271;3379;178,179;1488;387;2639;573,620;1488;88;1488;1835;1835,1851;1488;659;1808;1835;827;1808;402,1121,1122,1123,1125;1840;2171;1808;129;635;620,2226;135,1835;1737;58;157;1423,2286;3360;1604;473;186;805;1808;324;1488;395;1488;1901,1902;620,2212;620;440;676,1488;432;3900;432;822;2977;1488;58,718,2588;1455;147;157,422,423;1835;1488;1422;1422;2904;620;2237;620;620;2955;1488,1799,1800;58,956,1889;1488;-2820;659;147;1556;58;61,3772;620,2249;58,1556;1271;1835;1739;804;135,1421;1271;371;2534;2537;1835;1835;278,279;730,857;58;58;1422;3328;1835;857;1422;1488;1740;58;1488;620;58,447;61,-109,659,1125,1574,1639,1642,1669,1670,1671,1672,1673,1674,1675,1676,1677;3128;956;620;1195;58,818;464,493;966,967;484;3199;1556;58,431;61,620;1737;58,620;58,431;1556;1737;402;58,431;1512,1514,1515,1516;1735;440;620;440,1797;157;976;1488,2895,2896,2897;1488;493;157;1488;1488;479,1309;1835;1835;395,811;157;3833;1488;395;1125,3569;493;966,967;909;1794;1488;58;1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,19,20,21,360,361,362,363,365;778;88;593;1371;620;1706;129;966,967;620;1835,1836;600;58,431;966,967;778;778;778;1737;-1909;1835,1851;1488;1741;681;588,1468,1469;1738;407,1840;533,620;1488;418;2095;451,530,531;20,360,361,362,363,364,365;830,1457,1573,1574,1575;1738;1488;2171;620;58,1740;3643;2352;1018;493;1719;620,3527;61;58;1347;418;1452;1488;1740;314;1808;157;350,351,352,353;418,1719;1003,1017;857;58,447,1743,1898;58,447,1743,1898;1100;620;620;1488;778;1488;157;1737,1738,1739;1928;1928;1488,2747,3114,3115;600,1183;2429;2291;1488;1488;371;58;966,967;1429,1440,1488,2855,2856;1488;495;681;675,883,1736;966,967;1488;58;1018;1271;129;1565,1598,1599;2000;1488;857,1447;1422;1488;1840;1246;664;147;1985;1827,1828,1829,1830,1874;1488;1271;1042;974;1835;2540;1422;163;157;1018;129,2496;493;1840;1205;1835,1836;1271;1488;681;1488;966,967;620;58,479;426;620;58;620,898;620;3801;1855;1541,3644;247,248;1835,1851;908;58;1835,1851;805;778;1811;1488;426,1260,1261;259,260;1808;1326;1835;157;1737;620;356,357,358;1488;620;98,3862;542;826,827;573,898;3900;418;638,1213;2058;418;1835;3493;1835,1851;1488;1271;857;58,1556,3193;58,1556,3193;1057;1840;893,894,895,896;180,317;1233;765;1835,1851;1808;58,484;1488;1738;395;620;447;426,479,1522,1737;2698;3082;1488;3493;1488;395;620;1488;1651;157;1739;1018,1556;1738;505,583;1271;1255,1488;493;1488;2424;1488;1488;620;480;620;811,1488;58;402;1808;1125,3569;1125;1125,3569;2935;3091;857;1100;395;1553,1554;1268;1739;129;447,1125;1488;58,433;1835,1836;533,620;395;157;3898,3899;1556,3417,3418,3419,3420;1488;1122;1271;58;426;1246;1556,1769;1835;1835;58,1556;573;3493;1159,3662;493;811;1756,1757,1758;1832;1236;2830,2831,2832;659,1488,1617;407,1840;1739;1488;426,1739;1317,1427;1488;643;129,1815,2496;1840;938;61,1488,2423;2677;387,1149,1150;827;778;1556;232,233;2550;157;1488;1329;1738;1205;61,1273,1903;460;991,1515,2915,2916,2917,2918,2919;426,1739;1488;620;387;3553;620;2636,2637,2638;399;808;533,620;620;1556;1205,1488;58,575,620;129,815;479,1585,2569;576;573;1835;1399;480;1603;2783;2327,2328;1018;1597;966,967;722;1077,1488;1488;1832;1808;1835,1836;1488;1556;1488;479;707,1125;395;695;1488;480;620;1740;1366,1835;778;426,1739;2215;1488;1488;573;58,431;1488;157;1488;1808;58,1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;395;1488;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;2031;2534;1045;1488;533;157;432;-135,1361;1835,1851;1018;1488;1488;157;1738;387,1149,1150;2094;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;1488;395;620;1488;1556;1835,1851;1835;1835;1488;2179,2180;135,500,659,1347,1565,1598,1599;58,1615;1271;440,1495,1543,1544,1545,1546;1271;1488;1271;1271;966,967;1271;778;1488;387,1149,1150;1855;440,1797;791;2063;1259;2304;1488;420;1835;778;620;1835;1347,1348;857;493;58,1559,1560;1835;157;1835;1835;58,2236;857,1652;2069,2070;2070;1837;712;951;966,967;778;881;620;1835,1851;322;1077;1488;1737;1464,1465;1256;2736;1488;1835;1521;1488;3912;427;1835;1550,1551;1556,3417,3418,3419,3420;675;1808;1737;620;418;620;620;620;1272;1835,1851;834;1125,3569;387,1149,1150;659,1666;1443;413;1738;1556;1488;395;58;3950;1488;1488;620;2634;1333;1271;1271;2978;1018;1835,1851;1488;923,1122,2093;1488;526,857;620,1119,2461;2155,2471;1488;1840;1769;1641;1009,1010;1271;620;402;1835;542;135;387;1552;778;1769;-3140;157;1488;157;588,1468,1469;1556;1488;1840;-3029;3701;1488;1835,1836;432;157;573;1835;1488;387;958;730;620;651;620;1740;1762;58,59;58;857;1026;1488;620;399,1835;3900;68,69;620;1737;778;402,1699;1488;154;1835;129;1147;966,967;620;58;620;1488;2235;1488;1271;1018;58;58;1556;1556;1488;58;1018;479,782,1566;2665;1271;1488;157;1488;258;1766;1018;257;2243;460,1018;407;440,1797;3102;778;1586;1835;447;1271;1488;778;778;58,431;1018;966,967;1448;1835;1430;432;1488;2090;2697;2506;1835;399;157;1488;61;1840;157;681;651;493,620;620;395;1808;805;483;493;1488;1808;445,620;620;620;576,620;600;3977,3978,3979,3980;505;1018;1174;1488;1271;1556,3417,3418,3419,3420;3888;1556;407,1840;3868;58;1488;929;1488;2870;1488;1488;681;1100,1107;1488;1808;1835,1851;1488;440;3846;620;2983;58;834;3018,3019;61,1273,1903;2194;431,464,576;493;620;1808;1488;88;58;493;1221,1227;778;575,1727;620;620;426;470;778;620;620;493;426,850;463,493,620;778;1699;958;1835;1178;1808;2235;1125,3569;681;1798,2521;1488;1100;-1909;440,1797;399,1835;2783;157;1271;2147;1876,1877;114;3565;59;1835;2783;808,2016;966,967;1488;787,1808;1835,1851;129;1018,3341;1488;1808;1488;440,2237;808;1556;1835,1836;1488;1488;1835,1836;3528;426;1488;1488;681;3345;493,620;461;1488;58;387,1149,1150;88;1488;2401,2402,2403;1835,1836;3897;516;1231;1409;493;157;58,59,60,61,1881;1161;620;966,967;1246;2210;778;966,967;778;966,967;1246;620;595;576;966,967;60;3424;620;620;58,1100;58;1488;1018;620;1018;1738;479,782;1488;1855;2171;129,2496;399;1909;426,1739;3255;402;643;1488;157;447;1603;2754;3798;426,1739;58;1271;526,796;2942,2966;493,533;1488;395;125;1422;1556;1556;1404;1556;923;58;1271;58,1018,2869;1952;431;493,620;1835,1851;2352;1738;1736;1125,3569;1739;1556;1125,3569;445,600,620;58,1125;419,505,571,1740;1736;-135,1361;58,447,1740,1743,1898,1899,1900;289,290,291;1840;1122;253,254;620;1840;58,1574,1629,1669,1670,1671,1672,1673,1674,1675,1676,1677,2859,3356,3357;958;681;395;58,447,1018,1898,1900;501;1100;2208;58,479,1018,1349;1459,1472;1488;857;463;1678;659,1563,1564,1565;1832;1785;643;1409,2436;61;1650;832;125;1245;1835,1851;1738;643;620;1840;1875;730;1488;58,1018,2973;432;419,600;1349;129,808,2496;1488;1808;1271;1077,1488;1835,1851;644;888;388,2361;1835;324,325;651;3493;1488;1488;1032,1033,1034;135,675,2927;426;805,1147,1268;1778;1738;2783;180;1271;3415;3208;153;1018;1488;98;431;58;900;620;58,956,1889;58,1890,1891;371;2600;1488;917;1271;1100;267,269;3791,3792,3793;390;165;479,1520,1523,1524,1525;1835,1837;1837;505,1052;2783;1271;1271;1835;3288,3289,3290;58;58,2607;1835;440,1495,1543,1544,1545,1546;58;600;659,1520,1640,1641;1488;129;58;485,620,1726;1488;1556;1738;58,573;997;620;58,1559;58;1808;620;58,2688;620;418,463,526,533,1088,1089,1090;58,1018;426,1739;1077;1556;1840;19,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,377,378,379,380,381,382,383,384,385,386;1167;554,555;58;432;573,857,2761;129;157;1786;778;-156,1950,-2820;480,620;58;147;1488;1122;1835;1835;1488;1832,1855,1858;1805;811;147,281,282,407,1815;1271;3486,3487,3488,3489;3486,3487,3488,3489;19,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,377,378,379,380,381,382,383,384,385,386;966,967;3131,3132,3133;620;58;966,967;966,967;620;966,967;966,967;418;1262,2084;573;620;620;1740;659;61;805;2247;1488;1125,3569;1488;1488;1488;427;1744;464;1835,1851;426;426,513;620;1347;620;418;1835;1037;1414,1415;58,447,1739,1898,1900;1125;1835;1271;2783;2811;1488;493;620;1018;2256;3239;1321;129,1814,1815,2496;1488;1488;1488;620;2478;1018;966,967;1556,3417,3418,3419,3420;966,967;694;1488;3632;1876,1877;440,1495,1543,1544,1545,1546;966,967;966,967;1488;3707;399;1840;681;958;1835,1851;157;285,286;387,1149,1150;1808;1835,1851;61,3556,3557;681;778;573,620;493;620;1835,1851;3070;778;58,548;620;1347,3014;559;402;782;2747;1147;3004;1488;413,1245;681;1271;620;1422;1488;58,59;447;1488;58,59,60,61;1835;1840;1835;1142;1271;966,967;58,1559,1560;1488;1488;2802;1488;2311;2956,2957,2958,2959,2960;1738;1808;1122;2424;58,59;1488;1488;437;1808;1740;427;1018;1808;814;263;1799,1800;912;676;3421;1488;426,1739;1835;157;649;1271;464;1832;1839;135,152,1839,3735,3736,3737,3738,3739;1835;1840;1840;1556;395;1493,1494,1495;1739;1488;1488;1840;1488,1556;659,1715,1796,1957,1958,1959;1808;827;827;775;518;817,1147;3493;333,334,387;129;1835,1851;395,730;387;157;426,533,1732;1488;730,3493;681;1488;2414;2495;318,319;1488;1159,3662;3662;1488;1835;600;1840;1741;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;620;1739;1488;2037,2522;1739;2171;-135,1361;157;1840;1488;1488;58,61,573,1273,1903,1904;620;1488;1488;426,533,1732;1981;567;1981;1840;991,1515,2915,2916,2917,2918,2919;2188,2189;479,1018,1255,1296;1488;1785;493;778;1488;2939;387;1556;1271;1018,3267;651;526;426;3433;993,1479,1480;966,967;2586,2587;921;620;1400;1271;1271;999;60,3940;830,1457,1573,1574,1575;1835;479;778;778;58;1799,1800;2025;1271;681;1837;445;620;898,978,3025;440;147;3928;811,3237;1488;493;440,1443;1128;710,857,1268,2037,2195;1488;609;493,502;445,600;418;2224;966,967;3180,3181,3182,3183;1214,3068,3071,3072,3073,3074,3075;493,620;1018;1371;559;746;1422;1785;157;1018,1117,1885,1886;426;3501;1488;1876,1877;1876,1877;464;2222;1808;620;620,1488;157;3799;649;533,1730;620;1018;778;1271;58;1488;1488;559;880;880;1271;778;620;2235;440,1797;1488;1556;157;1488;129,2496;1787;1840;387,1149,1150;1987,1988;966,967;1488;681;1488;1229;227,228;620;620,2177;2164;1808;1840;1233;1738;1835,2546;680;129;966,967;1488;1835;3493;129;440,1799,3517;371;58;3972;527,573,1061,1108,1737;1122;147;526;681;659,3586;3400,3401,3402;3400,3401,3402;3400,3401,3402;157;1280;58;1488;1835,1836;1840;2128;1488;432;1111;1808;58,59;1077,1488;61;966,967;966,967;2043;3873;3350;1876,1877;1271;1271;1271;1488;3751;1488;1488;1739,2242;620;58;2392;1488;1586;495;1488;1488;157;-135,1361;157;469;1364,1365,1366;625;1488;1488;1769;387;371,479;1488;1488;1737,1738,1739;1835;1205,1488;681;479,659,1309;479;651;58,59;1835;1018;1220;387;1808;2212;1488;1556;1271;1835,1836;966,967;2099;58,61;1488;1835;533,620;778;58;2483;966,967;1835;2171;440,1797;3493;881;778;1488;805;1834;58;1488;1798;778;129;620;778;1738;1835;157;3509;58,3406,3407;1739;1740;1488;1488;20,360,361,362,363,364,365;882;1195,1233;153;387;426;620,1766;2506;3341;1835;1488;3645;1738;778;1835;1840;1840;1835;399;3288,3289;620;2506;958;1488;480;1043;426;402;1488;139,140;1488;1271;1624,3741,3742;1018,1125;535;620;778;1835;914;3572;681;2476;1683;1835;1488;157;2212;1739;1808;479;2205;493;2298,3118;3328;1808;1371;61,1769;1488;1488;681;1835,1851;1488;2624;1885,1886;442,443;3836;1556;627;1243;1761;2762;2016;869,1835;1556,1769;620;966,967;620;1488;2304;620;1488;1488;58;1488;1080;1808;1808;827;966,967;1740;808;1018;1739;1488;58,479,1506;58;2090;1488;1488;2463;2055;464;1125,3569;493;2219;2219;620;1835,1836;620;3506;493;1488;1349,1769,3144,3145;620;493;1837;1808;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;3518;1488;966,967;827;1840;440,1797;1045;453;1738;1488;620;1271;808;1488;432;1488,-1490;174;2171;1488;1488;1488;2357;58;493;620;620;1745;1018;620;61,573;1488;1600;426,3947;1271;1561;1488;620;1835;387;857;1737;1570;157;58,480;939,940;1125,3569;1274;1488;1359;1488;1488;2653,2654;1832;1556;1835;1018;1556;1125,3569;58,447,1898,1900;1125,3569;576;395;128;2037;58,430,447,1018,1898;1736;1556;1556;1018;1488;1125;440;135;1122,1488;1974;1840;1835;58,59;2061;387,1149,1150;2340;620;2386;2171;157;1488;1488;1488;3381;2438;493;418;1448;1347;620;1488;1840;1808;495;643;1588,1589,1590;164;2514;1855;1488;3696;1740;1740;1488;1259;1401,1402;1840;1488;1835;1488;505;157;1493,1494,1495;1808;888,2361;1808;1808;1835;1488;129;620;2171;1488;620;58,1769,2165,3140;620;620;58,3035;1350;778;778;1239,1488;493;3602;1835,1851;157;857,1474;2392;135;1271;3152;1237,1268;811;159,160;157;58;2955;1738;157;447,1125;129;3560;966,967;778;778;1840;539,620;578;1147;542,1739;1488;1666;1488;399,1840;1947,1948;1255;720,1375;1738;1488;395;620;2304;426,533,1732,1733;445,600;966,967;778;135;620;778;371;1488;387;1488;3561;129,3351;1738;1740;426,513,514;1488;1268;58,447,1744,1898,1900;2052;533;58,447,1556,1898,1900;1122;1488;1488;620;1205;620;559;1556,3417,3418,3419,3420;1488;447;1876,1877;1190;1430;170;493;778;620;1488;620;3493;433,659;1488;958;1737;1488;730;2503;493;3631;1488;1835;494;620;157;1488;778;748;1488;807;1488;1519;440,1797;1271;778;643;1835;1488;1835,1851;805;620;778;1488;426,480;643;1147;1835,1851;1840;1835;157;1835,1836;893,894,897;3732;58,1781;1122;1835,1836;620;1799,1800;180,181;1840;857;2445;2445;620;573;805;1737;3002;620;3971;620;2332;1488;620;58,1559,1560;2053;1835;912;1840;1840;440;1125,3569;1840;1245;3657;659,1563,1564,1565;1488;1488;1488;881;659,1563,1564,1565;1835,1851;1689;1808;1271;1488;1840;1147;966,967;2659;659;58,59,60,61;1073,1074;209,210;778;620;371;2772;1488;58,59;1122;1488;857;426,1739;1739;60,419,659;1488;58,1556,3193;129;157;3916;1488;58;991,1515,2915,2916,2917,2918,2919;1488;1488;1808;58,59,60,61;58,59;1840;1488;407;1808;1147;1835;-135,1361;1018;407,643;1901,1902;1271;2760;1714;659;853;493,1228;3421;387,1149,1150;681;811,859;1488;620;58;445,600,620;1488;395,857;1488;58,395,440;493;2235;1018;966,967;533,620;1266;577,578;3544;2269;1488;129;1556;1271;2163;778;620;3790;1488;808;1876,1877;1876,1877;1876,1877;1876,1877;2520;432;-135,1361;1488;1840;573,1018,1556;157;129,1570;808;1840;1075;732;3384;837;1271;966,967;1488;58;778;157;1454;2637;2637;1271;493;588,1468,1469;1737,1738,1739;1462;446;1441,1442;966,967;407,1840;1840;1840;778;811;1587,2199;129,440,1348,1507,1508;61,480,573,2384;966,967;576;966,967;778;407;1268;137;2111;427;2633;2237;2783;129;778;387,1149,1150;778;600;620;58;857;1488;1488;440,2118;660;1488;1488;58,1541,-1543;157;1271;445;1147;620,2996;171;58,59;778;966,967;58,59;1835,1836;1006;1876,1877;573,620,1556;2449;620;58,59,60,61;2354;2212;620;1488;1840;58,59,60,61;390;1739,2242;1840;778;387,1149,1150;1488;620;1855;1785;1271;1271;1159,3662;88;157,1835;1794;1840;1785;860;542;1488;805;1808;479;58,479,1580,1581;1018;157;1300;1488;3354,3355;1835;2171;1271;1488;1271;58,59;1081;1100;390;3529;1570,1799,1800;1833;1790;1159,3662;157;1835;620;3329;1271;98,3766,3767,3768;530,2252,2572;620;1808;2783;1488;1018;966,967;620,1118;157;1835;1488;2902;620;1262;1835;1488;1488;135;2161;1488;1769;827;399;1738;58;432;98,3709;2462;900;418,620;1417;1018;576;464;2783;2783;1374;157;1271;1808;1835;966,967;1488;399;966,967;2171;505;573;2249;620;629,630;619;958;1741;1271;1258;1835;1835;620;387;1835;853;1371;573,1736;493;627;107;600;1835;1488;1488;1488;157;2899;622,719;1840;1403;2023;620;966,967;129;58;3342;58,1556;702;1488;3661;58,1559,1560;1521;426,533,1732;778;573;426,533,1732;848,849;450;1356;3029;643;624;426,1739;1808;1737;1488;2955;1488;778;2548;1785;1835;2219;2219;1111;1488;1488;3224;1808;620;1488;1271;1443;1808;827;1835;1488;2386;1835,1851;620;2251;1840;58,59;129;1488;1488;58,59;441,620;1835,1851;1271;157,399,1284;2180;493;1808;432;129;58,59;58,480;966,967;620;463,464,875;778;1018;1808;620;1835;1488;1488;1835;387,1149,1150;1835,1851;1488;1017;58,979,2086,2087;1488;1855,3324,3325;1018;1488;1808;495;1835;2942,2965,2966;445;88,1272;1125;1744;1808;1840;1840;1125,3569;267,1595,1596;1739;58,447,1898;1808;1835;1488;573;1271;1488;58,447,1018,1898,1900;1808;1738;1488;1255;1690;426,479,782;1808;1835,1851;643;1835;1808;1837;493,620;620;1835,1851;973;681;1835;1737;1808;1488;387,1149,1150;157;1493,1494,1495;1840;827;1840;1488;1835;620;997,1120;1488;1739;402,1769,2165;502;694;620;1488;1738;1739;3917,3918;1271;1488;395;1409;620;620;1271;573,620;1808;2516;426,1739;1832;1271;1271;527;620;387,1149,1150;58;1233;559;1488;453,620,663;1835;1798;551;1448;620;573,1488;778;778;219,220,221;1176,1177;2002;3311,3312,3313;58,447,1556,1898,1900;1473;1556;1835;402,1738,1739;58,1738;129;157;387,1149,1150;966,967;921;1835,1851;1327;149;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;1018,2664;157;3927;3486,3487,3488,3489;58,805;129,1815,2496;1488;1488;431;966,967;966,967;2954;966,967;2884;129;1738;1617;157;923;659;681;58,447,1743,1898;914,1205;3533;1422;2955;493,620;1372;1840;620;427;1737,1738,1739;431,1246;1488;620;444;1122;966,967;1739;1488;620;1741;923;58;3059;1488;495;1840;1271;1740;1835,1851;1246;58;966,967;493;395;58;440,1797;3493;912,1171;1488;157;493;58,59;778;1271;1804;3927;426,480;407,1840;1840;1840;58,59;145;1488;2783;1835;620;620;1488;1488;1488;1271;2445;1488;620;436,437,438;478;480,1006,1214;493;3493;1840;418;1271;1808;620;232,233;2171;1737;1246;914;3560;1488;526;1808;426,1739;910;620;1835;1738;129;966,967;1556;1808;830,1457,1573,1574,1575;1439;1271;157;620,1488;1761,2545;58,505,528;1488;1835,1851;-3903;1049;1159,3662;1488;129;2838,2839,2840;157;1488;495;1488;635;387;1018;857,1426,2805,2806;2961,2962;1785;3341;-135,1361;-135,1361;-135,1361;1835;58,3188;720;717,2372;58,59,60,61,1881;3358;1905;1840;1488;2685;1840;1835;3238;620;857;1488;1083;58,1071;58;1741;966,967;129,2496;1556;1832;2157;129;2783;620;857;651;884;1362;600;59,1117,1739,1882;1488;778;1488;778;157;778;493;180,201;923;778;1271;1876,1877;-762,1876,1877;1876,1877;1876,1877;1876,1877;-135,1361;1840;1840;619;1488;805;90,91,92;-135,1361;1271;1271;1271;387,1149,1150;1835,1851;1840;1018;1246;2307;1835,1851;3288,3289;157;1488;1271;805;1488;2013;1488;573,1718,1778,2137;966,967;1808;88,1608;1488;1488;58;1740;101,3408;1195;395;1808;493,533;1835,1851;643;966,967;778;58,59,60,61;1488;1195;1840;1808;480;1488;620;2271;1835,1851;1488;1488;1488;1268;402;997,1338;966,967;620;58,59;58,59,60,61;2783;1808;2354;620;1271;1271;1271;1835,1851;1835,1851;778;157;1835;1271;1488;1488;1488;1009,1010;604,654,1009,1010;808,863;3250;1488;1835,1836;3287;58,59,60,61;1666,3818;729,1808;1122;58,59;129;1488;1488;778;620;387;2484;3952;966,967;1794;958;2219;1840;620;58,59,60,61;2128;419;657;154,1233;1272;157;2209;1835;1488;399;1739;1952;1808;3710;643;431;1808;1032,1033,1034;1835;1488;620;2070;2037;1488;3874;493;445,600,620;620;413;495;157;413;1080;1205;1835;1835;586;620;619;881;440,1495,1543,1544,1545,1546;1835,1852;620;198,199;1876,1877;3283;2985;61;3018,3019;834,2198,2682;958;966,967;1835;966,967;620;620;573,1488;493,620;958;958;1077,1488;480,539;1488;1488;1474,1488,1572;620;1835;1835;2219;427;1840;526;620;1738;1272,1941;1855;58,59;1271;447;58,59;1556;58;1488;1246;157;1488;606;1488;1122;1268;1488;1488;651;3376;730;2776;1488;1739,1744;1488;966,967;966,967;1488;1488;1808;646;404,405,406,1488;2758;1018;3718;1125,3569;2900;1840;620;1835,1836;620;1808;1794;1440;-156,-2829,-2830;1125,3569;573;1488;2151;808;1835,1851;1556;1271;3526;1737;58,447,1743,1898,1900;1901;1125,3569;58,447,1743;620;1740;1835;129,440,2659;778;58,718,1739;1738;58,447,1018,1898,1900;1488;371;1739;338,339;681;1835;1488;1840;1165;1808;962;3218;1808;827;1808;1786;699,700;1835,1851;1835;1738;1488;888,2361;1808;58,59,60,61;1389;1905;1488;966,967;966,967;620;1057,2778;1835;1221,1222,1223,1224,1225,1226,1227;778;1488;387,1149,1150;1488;1122;1737;3146,3147;3200;1835;157;1271;1835,1851;1737,2329;58,59,60,61;879;58;1488;3224;1488;135;1769;58;426;58;1556;1840;1488;1556;157;157;1242;1840;1271;1840;1815;1440;1488;426,533,1732;1205,1488;620;2209;966,967;966,967;966,967;1716;643;1840;1840;1835;1094;620;58;1147;58;2753;900;1488;464;797;2209;58,431;620;1488;1488;966,967;1608;1704;1704;1488;1488;2909;1122;1488;966,967;1488;58,129,495;1835,1851;427;1808;1270;1840;958,2074;3203;573;2571;620;778;1840;1493,1494,1495;387;426,1488;1347;1488;681,871;1488;681;1835,1836;881;1840;620;2204;695;-1909;2783;620;620;1840;58,59,60,61;58;1488;1835,1851;1737;1808;1835;1839;1556;1018;1488;811;1840;2171;1835,1851;1488;464;1018;2830;1488;59;1840;1488;135;58,2660;1488;-3903;620;1840;811;1840;2665;1255;573;1488;129;58;1488;620;620;157,409;1018;1840;1840;1217,1218;681;1840;620;3724;58;533;157;620;1835;58,71;1835;1018;387,1149,1150;58,2235;3677,3678;2278;1057;129;495;877,1018;390;778;2065;857;1488;395;1799,1800;1738;58,1556;1548;620;571;1488;805;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;983,984;1835;593;58,71;1488;874;1737;432,495;1085;620;1808;1271;1098;1840;1835;1840;1835;1835;1738;407;1488;1488;1840;387;1840;620;1488;387,1149,1150;157;493,1246;1837;387,1149,1150;2783;1488;966,967;966,967;407;1488;1840;157;1591;912;1738;387;1488;1794;1006;58,59,60,61;1835,1836;58,59,60,61;1271;157;1488;730;3662;1840;1159,3662;1159,3662;1159,3662;2497;1488;440,1495,1543,1544,1545,1546;432;387;2392;1246;3585;387,1149,1150;1462;1739;495,862;1910;58,59;1820;681;1473;1840;1488;3845;58,59,60,61;620;778;1271;1799,1800;157;58,59;1808;1840;1018;966,967;958;1833,1835,1836;1835,1851;157;1736;1384;1678;426,748;387;811,1488;1488;2675;480,495,620;2064;58,464,790;1488;1840;3493;1369,1370;1060;1840;1835;1835;157,1113,1835;157,1835;966,967;659,1901,1902;3017;1488;1835,1851;778;778;1835;966,967;371;827;1071;1840;395;1835;681;938;1307;-3077,-3078,-3079,-3080,-3081;3764;288;58,1556,3117;395;639;1488;463,1724,1725;958;651;1488;58;643;620;2219;1488;2783;1666;390,1103;371;1835,1851;157;730,1488;58,59;409,412;157;447;1738;856;1457,1458,1459,1460;58,59;1488;387,1149,1150;464;157;182;1488;58;1840;1840;58,620;239;620;1808;966,967;1125,3569;1493,1494,1495;1808;1574,1669,1670,1671,1672,1673,1674,1675,1676,1677;58,59,60,61;658;445,659,953,1739,2601,2602;58,447,1018;1840;3714,3715;1488;1488;1488,3230;643;1488,1790;58;620;1808;1808;61;1386;342,1094;2145;1808;1840;1808;2201;1837;805;387,1149,1150;620;1835;1125;493;58,59,60,61;98;2023;3040;3291;1488;387,1149,1150;1271;1699;620,1699;426,751;418,533,620;1812;1785;808;157,1687;1259;1018,3496;505,1100;58;1738;3842,3886;808;157;966,967;857;1840;493;1840;1488;1740;-1909;1488;1719;620;778;20,-59,360,361,362,363,364,365;387,1149,1150;402,850;1488;942;1084;427;1737;2552;157;495;1452;681;1835;620;681;1488;1541,3644;620;620;495;1488;407,1840;1205;1383;1271;966,967;620;147,559,3573;811,2425;1785;1808;61;58,59,60,61;1840;1835;440,1443;-1909;1835;1839;1840;1808;1452;58,1556;1395,2159;1835;1932,2930;1835;58;1808;1488;1488;1159;1488;505;387;1799,1800;2435;620;1488;1840;1471;1488;1488;1808;1488;2759;402;875;1840;58,59;1840;-135,1361;2616;2616;620;387;2492;1840;1488;526;432;620;966,967;2990;1840;778;1488;157;432;1876,1877;1876,1877;-762,1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1452;1785;445,600,620;1488;643;493;157;620;778;157;1488;1271;1808;1835;407,1840;817;1840;1808;157;1835;1840;157;1488;1835,1836;966,967;620;1488;2557;1488;1205;3169;1840;2369;1488;440,1797;1488;997,3166,3167;1006;58,59,60,61;147,154,3916;1474,1488,1572;1271;1488;1488;1271;1271;1271;912;1488;1488;649;1840;778;1835;966,967;58,505;1271;495;2158;1709;1835,1836;1737;1952,1977;1488;1271;611;1488;2726;620;135,731;569,1069;1488;1835;3642;578;2389;1488;620;1488;1739;1271;958;1943;1122;157;1125,3569;1835;681;1313;1835,1852;1785;2273;958;2171;2899;232,340;1808;1271;3593,3594;2219;2219;827;1556;1246;2518;1488;1840;157;827;3701;1840;1459,1472;1446;1870;533,620;620;135,675;1271;1255;1785;2060;1125,3569;947;1161,1308;620;620;1835,1851;1840;1840;1488;681;1488;1488;58;1840;1334;1556;1556;2128;505;778;1488;58,447,1018,1898,1900;447;603,604;1785;1488;1459,1472;1835;935;1795;1488;1788;3180,3181,3182;1488;1808;1840;1488;1837;1835,1837;129;1840;1840;827;3142;1835;1488;1246;432;1835;427;827;2314;1462;1501;129;1808;778;58,59,60,61;1835;58;2179,2180;3496;620;1061;58,1018;620;1737;1840;1808;157;157;505;827;157;1488;1840;1835;1488;3682;502;1785;649;58,405,1214;1738;446;3593,3594;445;488;805;620,1018,1488;1125,3569;3084;1835;593;58,1556,3193;1833,1835,1836;2171;1736;748;1840;1835;620;1835;1840;1246;1835;890;1488;620;58,59,60,61;508;1808;495;659;1740;344,345,346;3279;651;1240;2556;1550,1551;533,620;1556;1835;58,59;620;2439;1556;1462;573;1840;1488;1488;390;157;681;432;360,361,363,2993;1832;966,967;464;3308;1835,1836;966,967;1018;1488;2759;2759;958;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;58,59,60,61;1840;1424;2783;157;620;479;1840;620;619;2814;1488;1488;966,967;1835,1851;1835;2931;620;620;966,967;1271;1271;1271;1835;805;1840;3167;1835,1836;58,59;58,59,61;135,500;958;1271;1271;1271;1488;58,59,60,61;2047;1323;1488;1840;2154;1975,1976;1271;1840;1840;479;58,59,60,61;1488;311;1488;2937,2938;1488;1808;805;1371;1271;98,1574,1656,1658,1659,1660,1661,1669,1670,1671,1672,1673,1674,1675,1676,1677;1488;1808;58,59,60,61;1262;1835;1840;440;1835;1488;58,1737;1488;1488;966,967;1597;1449;1808;3493;1078;1271;938;2182,3973,3976;1808;958;131,211;649;1271;1876,1877;1876,1877;2219;1840;827;387,1149,1150;1488;620;407,1840;157;1785;620;495;1588,1589,1590;390;1840;1835;2128;1067;157;390;387,1149,1150;287;2014;1488;1835,1851;387;620;3136;1840;1835;1835;1125,3569;395;1371;1344;1122;129;1835;1835;805,1666;245,249;1840;1840;2304;620,1488;935;1488;495;157;58,1751,1900;805;58;58,59,60,61;58,59;418;1840;1785;1876,1877;620;157;2783;1808;58,59,60,61,1881;1876,1877;387,1149,1150;1488;2783;1840;157;1808;3593,3594;2665;935;1808;817;1245;3700;1488;805;1840;659,1556;3662;-1518;387,1149,1150;620;296,297;495,508;1808;493;1738;1488;1832;1835;1488;1488;620,933;1488;2356;1876,1877;1876,1877;1876,1877;1876,1877;1488;157;61;1840;1808;58,59,60,61;2930;643;58,505,1738;1488;620,2309;1271;2480;1092,1280;1736;58,59,60,61;730;387;58,59;649;958;1840;1452;1835;58,59,60,61;1808;333,3933;1488;3937;619;58;58,59,60,61;2039;805;681;1371;2447;2910,2911,2912;58,59;1271;157;1556;1488;1835;157;1488;559;1835;409,1840;1840;620;912;3359;1488;58,59,60,61;924;1827,1828,1829,1830,1874;1271;1786;447;1835;1050;58;58,3117;834;834;1488;958;958;1808;805;1835,1851;3663;387,1149,1150;493;129,2816;1808;1876,1877;58,59,60,61;58,59,60,61;428;1452;938;620;620;431;58,59;1785;1488;1488;1443;1808;1840;58,447,1898,1900;1840;1488;1488;1459,1472;157,1247;387,1149,1150;643;1488;1840;1840;1317;2543;1835;1488;805;495,1122;402;157;1840;1840;1488;966,967;1840;1739;1785;3353;888;58,1096,1097;157;2420;58,1740;681;1488;1488;1556,3371;1271;157;1840;426;1488;1488;2807;1738;1556;620;440,1797;1488;539,649;2661;387,1488;1835,1836;399,1808;1835;649;1488;1835;1488;58;2380,2381;2708;58,59,60,61;1840;157;620;480;958;1488;1488;1100;1876,1877;1876,1877;1876,1877;1876,1877;857,1347;157;157;1808;1840;508;3593,3594;620;1488;440,1797;1738;1488;680;58,59;58,59,60,61;58,59,60,61;58,59;1876,1877;923;157;1840;432;157;1737,1738,1739;966,967;1835,1852;1808;58,59,60;1808;805;157;1488;157;1747;1808;2783;2011,2012;1835;1835;1840;3017;1488;157;568;341;58;1876,1877;478;3981,3982;834;3719;958;654;1876,1877;427;1018;1840;1488;2783;1271;58,59;1399;651;1122;620;1452;1840;2003;1835;1268;1691;387;1835;1835,1851;1488;1840;1808;778;2289;3327;2803;620;213,214;1840;1840;1738;1736;1840;440,1495,1543,1544,1545,1546;620,2249;1317;395;157;1808;1808;2692;1556,3417,3418,3419,3420,3421;58,59,60,61;1488;1349;3593,3594;440,1797;1371;2480;620;427;1835;1488;2300;1272;1488;129,2496;1259;1032,1033,1034;2096;135;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;1876,1877;169;58,59;1835;58,59;58,59;58;1488;2124;407,1840;1808;681;495;1840;1840;3017;157,3184;643;620;1488;1198;1840;1835,1852;1835,1852;1808;912;1444;619;1876,1877;3315;1740;1835;88;1488;1488;827;1488;387;58,2807;500;2003;58,834;620;1835;592;98;1371;387,1149,1150;1488;1799,1800;58,668,669;2249;805;2342;1311;58,71;58,71;1876,1877;1488;651;387,1149,1150;1840;58;1129;1488;1840;1488;1840;1271;387;526;1100,1352,1739,1744;1488;1488;1840;3662;1840;935;1488;157;805;1876,1877;1876,1877;1840;157;158;3857;2180,2183;526;58,59,60,61;1737,1738,1739;1840;3593,3594;1737;3665;517;3017;1205;1876,1877;1740;1125,3569;3245;432;1785;2783;1840;157;1205;1488;407,1840;184,185;1122;1488;2833,2834;2662;1738;1371;395;1808;157;157;1835;58,59;1808;1488;1840;1488;337;2683,2684;1876,1877;1488;3593,3594;1840;1488;1953,1954;426;3662;1769;1488;588;1876,1877;440,878;390;1840;730;58,59,60,61;1835;1488;619;805;1835;3551;1488;808;1876,1877;387,1149,1150;1840;58,59,60,61;1840;58,1556,3193;1840;1840;1488;399,1840;372,373,389,390,3956;1125;58;58;1488;1808;1840;2171;1488;1488;374,375;1488;1876,1877;3593,3594;451,479,782,1740;387,1149,1150;1488;1488;402,619;3593,3594;3593,3594;651;3508;129;774;1452;129;620;59;1556;1840;58,1214,1255,1784;627;805;1452;1132;1840;1840;3194;1488;1840;1739;3593,3594;2657;387;1407;2963,3173;1488;619,1100;1840;1840;1371;3593,3594;1406;1840;1556;1840;495;3593,3594;1488;3593,3594;1840;1740;2489;1835;1371;3593,3594;1100;157;805;805;58;2065;58;3593,3594;620;992;1488;3595;157;1488;627;1488;1840;88;445,619;1876,1877;154,1655;1840;915;3593,3594;59;1876,1877;505;923;3423;1488;571;432;3593,3594;1840;945;817;1840;620;3593,3594;1840;1488;3593,3594;1488;225,226;58,71;627";
        const arglistRefs = $scriptletArglistRefs$.split(';');
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","68,69","moonfile","^moonfile-[a-z0-9-]+\\.com$","68,69",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","68,69","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","68,69","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","68,69","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","68,69","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","68,69","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","129,1556,2522"];
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
    const $scriptletFunctions$ = /* 51 */
[trustedJsonEditXhrRequest,setConstant,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,preventXhr,preventSetTimeout,preventFetch,trustedReplaceArgument,removeAttr,trustedOverrideElementMethod,abortOnPropertyRead,trustedReplaceOutboundText,trustedSuppressNativeMethod,preventAddEventListener,trustedSetConstant,abortOnStackTrace,preventSetInterval,adjustSetInterval,abortOnPropertyWrite,noWebrtc,preventRequestAnimationFrame,noEvalIf,preventBab,trustedPreventFetch,disableNewtabLinks,trustedJsonEditFetchResponse,preventInnerHTML,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditFetchResponse,preventClipboardWrite,jsonEditXhrResponse,xmlPrune,m3uPrune,trustedPreventXhr,trustedEditInboundObject,spoofCSS,alertBuster,preventCanvas,jsonEditFetchRequest,proxyApplyConfig,mpegdashPrune];
    const $scriptletArgs$ = /* 3382 */ ["[?..userAgent*=\"channel\"]..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/player?","[?..userAgent*=\"lactmilli\"]+={\"params\":\"8AUB\"}","[?..userAgent*=\"lactmilli\"]..playbackContext.contentPlaybackContext.lactMilliseconds=\"${now}\"","[?..userAgent=/adunit|channel|lactmilli|instream|eafg/]..referer=repl({\"regex\":\"(?:#reloadxhr)?$\",\"replacement\":\"#reloadxhr\"})","ytcfg.data_.EXPERIMENT_FLAGS.all_web_enable_network_machine","false","ytcfg.data_.EXPERIMENT_FLAGS.all_web_network_machine_raw_request","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..data.viewer..nodes.*[?.__typename==\"AdsSideFeedUnit\"]","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..node[?.*.__typename==\"SponsoredData\"]","..nodes.*[?.sponsored_data]",".data[?.category==\"SPONSORED\"].node",".data.viewer.news_feed.edges.*[?.category==\"SPONSORED\"].node","Function.prototype.toString","Node.prototype.insertBefore","Element.prototype.insertAdjacentElement","Element.prototype.append","Element.prototype.prepend","Element.prototype.before","Element.prototype.after","Object.getOwnPropertyDescriptor","XMLHttpRequest.prototype","console.clear","undefined","globalThis","break;case","WebAssembly","atob","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","document.getElementById","0","json:\"body\"","condition","ad-detection-bait","document.querySelector","-id-","scriptBlocked","blocked","testUrls","[]",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","Worker.prototype.postMessage","adblock","4000-","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","Object.prototype.hasRightPartnership","falseFunc","Object.prototype.hasLeftPartnership","Object.prototype.hasTopPartnership","Object.prototype.hasBottomPartnership","experimentOverrides","json:\"%5B%7B%20defaultValue%3A%20%22OFF%22%7D%5D\"","document.querySelectorAll","security.js","Document.prototype.createElement.call","noopFunc","OffscreenCanvas.prototype.getContext","=== false","Element.prototype.removeChild","/blocked|tick/","/click|load/","/document\\.location|pop\\.|exo|cookie|\\.php/","ok_","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","pp_adblock_is_off","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","WP.prebid","onLoad","History","/(^(?!.*(Function|HTMLDocument).*))/",".call(null)","10","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","document.createElement","break;case $.","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","Object.prototype.renderDirect):matches-path(/\\/(?:weather\\/|pogoda\\/|hava\\/)/","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","freestar.newAdSlots","String.prototype.allReplace","executaGoogleAnalytics3","initJWPlayerMux","initJWPlayerMux.utils","initJWPlayerMux.utils.now","ambossAnalytics","ambossAnalytics.getUserAttribution","dataset.ready","script[src^=\"https://www.googletagmanager.com/gtag/js?id=\"]","Osano","Osano.cm","Osano.cm.addEventListener","Osano.cm.removeEventListener","pa.getVisitorId","googletag.setConfig","RISKX","RISKX.go","RISKX.setSid","Sentry.configureScope","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber","..node[?.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","adblock_added","setTimeout","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","adcashMacros","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","decodeURIComponent","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","shift","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.write","redirect","4000","inlineScript","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","btoa","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","AdservingModule","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","error","[src]","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","adblockcheck","!bergblock","overlayBtn","adBlockRunning","Date","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.protect_block","flashvars.video_click_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","alert","check","isBlanketFound","showModal","myaabpfun","sec","_wm","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","Pub2a","/adsbygoogle|initDetection/","block","console","send","ab_cl","V4ss","#clickfakeplayer","popunders","visibility","sadbl","aclib","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","MessageChannel","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","jwplayer.utils.Timer","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","adBlock","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","LIDetector","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion.homad.enabled","getHomadConfig","aud.springserve.com","<VAST version=\"3.0\"></VAST>","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","secondsLeft","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","tid","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","tp-time","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]","disabled",".btn-primary","focusOut","googletagmanager","suaads","/window\\.location\\.href|n/","8000","json:\"drall_Suaads_annersads_JS__randomAds\"","/randomAds|div-gpt-ad|divAdsInit/","json:\"ADs-1\"","json:\"click\"","visibilitychange","window.addEventListener","/visibilitychange|blur|pageshow|keydown|beforeunload|pagehide/","/\\$\\('|ai-close/","app_vars.please_disable_adblock","/scorecardresearch\\.com|outbrain\\.com|taboola\\.com|criteo\\.net|rubiconproject\\.com|adform\\.net|casalemedia\\.com|adservice\\.google\\.com/","shouldOpenPopUp","/blur|focus/","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","remainingSeconds","mode:no-cors","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","http","Element.prototype.closest","rel","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","localStorage._d","blank","google_srt","json:0.61234","vizier","checkAdBlock","xnjThB","googlesyn","displayAdBlockerMessage","pastepc","checkMockObjects","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","isTabActive","HTMLAnchorElement.prototype.click","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","clicked","charCodeAt","decodeURIComponent(escape","clicksCount",".data.isAdsEnabled=false","/api/files","document.createTreeWalker","json:{\"acceptNode\": \"function() { return NodeFilter.FILTER_REJECT; }\"}","if","prevent","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper",".downloadbtn","zigi_tag_id","self.Math","setCookie","advertisement3","start","AdLink","!buzzheavier.com","removeChild",".href","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","/seconds--|timeLeft--/","json:\"main\"","/div-gpt-ad-dgking|\\.GoogleActiveViewElement/","/div-gpt-ad-|\\.adsbygoogle/","json:\"container\"","adblock_detected","/pub\\.clickadu|bing\\.com/","a","\"/chp_?ad/\"","/blocked|null/","remaining--","json:\"header\"","/ad-chk|aads-frame/","!/document|window|const|var|let/","RegExp.prototype.exec.constructor","\"+\"","Function.prototype.constructor","anonymous@https","Document.prototype.addEventListener.call","HTMLElement.prototype.click.call","HTMLElement.prototype.click.apply","/document\\.createElement|window\\.open/",".cfd","script[data-domain=","document.body.appendChild(s)","document.head||","push","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","clearTimeout","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","document.body.appendChild(s","no-referrer-when-downgrade","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","appendTo:","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain",".ads_mode=\"0\"","/embed/settings",".ads_mode_dl=\"0\"","$+={\"ads_suppressed\":true}","/inlineScript|stackDepth:1/","Date.prototype.toISOString","wpadmngr.com","adserverDomain",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","Document.prototype.querySelector","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral",".EnableAdmiral=false",".ShowAds=false","gnt.x.uam","interactive","gnt.u.z","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/admiral/","runtimeConfig.AM_PATH","CACHE",".indexOf","/runtime-config","__disableAds","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","..Admiral.isEnabled=false","..admiral=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","Element.prototype.setAttribute","/error-report|new Promise|;await new|:\\[?window|&&window,|void 0\\]|location\\.href|void 0\\|\\|window|,window,|void 0,window|,window\\]|\\)\\.join\\(String\\.fromCharCode|adShieldError/","script[id][onerror]","asap stay","loadShield","Range.prototype.createContextualFragment","json:\"<script></script>\"","html-load.com",".scriptLoader.*[?.id==\"ad_stack_split_provider\"]","adLight","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/content-loader\\.com|css-load\\.com|html-load\\.com/","json:\"setTimeout((()=>{if(!location.pathname.startsWith('/game'))return;const t=document.getElementById('question-label');t&&(window.animation=lottie.loadAnimation({container:t,renderer:'svg',loop:!0,autoplay:!1,path:'/assets/animationsLottielab/gameDots.json'}))}),1e3);\"","__cfRLUnblockHandlers","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","features.ad02 features.adshield","AHE.is_member","AppBootstrapData.config.adshieldAdblockRecovery","AppBootstrapData.config.adshieldNativeAdRecovery","AppBootstrapData.__initializeFeatures__.adshieldAdblockRecovery.enabled","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","..adshieldAdblockRecovery.enabled=false","/error-report|nowprocket/","Object.prototype._adShieldLoaded",".featureFlags.*[?.featureName==\"AdShield\"]","/configs","Object.prototype.htmlLoadScriptService.loadScript","HTMLScriptElement.prototype.onload","..AdShield.isEnabled=false","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","__aaZoneid","DoodPop",".check=false","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","#downloadvideo","ads playerAds","..allowAdblock=true","displayLayer","adId","pop_init","adsbyjuicy","np.detect","/^mshta |^msiexec |^(bash <<<|curl -kfsSL) \\$\\(echo .+? base64 -d\\b|^cmd \\/c .*?\\bcurl .+?(\\.exe|\\.bat)\\b|^cmd .*?\\bfor \\/f .*?\\bdelims .*?\\bpow |^powershell .*?-w(indowStyle)? h(idden)?\\b|^powershell .*?-NoP\\b|^powershell .*?-ep bypass\\b|^powershell .*?-EP (B|U)\\b|^powershell.+?-ExecutionPolicy (Bypass|Unrestricted)|\\\\PowerShell\\.exe.+?-ep bypass\\b|^powershell.+?\\biex\\(|^powershell.+?Invoke-Expression|^powershell.+?Invoke-WebRequest|^powershell.+?-UseBasicParsing|^cmd .*?\\/c .+? -nop .+? iex\\b|^(cmd|powershell)\\b.+?recaptcha|^(cmd|powershell)\\b.+?#(Verification|     )|^(cmd|powershell)\\b.+?     #|^osascript .+?\\bcurl http|^curl -s\\b.+?\\| (bash|sh|zsh)\\b|^\\/bin\\/(bash|sh|zsh) -c\\b.+?\\bcurl|^bash -c\\b.+?\\$\\(curl|^python3? -c\\b.+?\\b(exec|urllib|subprocess)\\b|^echo .+?base64 .+?\\b(bash|osascript|z?sh)\\b|openssl base64 -d|^curl\\b .+?chmod \\+x.+?&&|^(bash|sh|osascript)\\b.+?recaptcha|^(bash|sh|osascript)\\b.+?#(Verification|     )|^(bash|sh|osascript)\\b.+?     #|^wget .+?\\| (bash|sh)\\b|^curl\\b.+?-o\\b.+?\\/tmp\\/.+?&&|^nc .+?-e \\/bin\\/(bash|sh)\\b|^\\/tmp\\/.+?chmod \\+x.+?&&|^wget -q.+?\\.(sh|py|bin|elf)\\b|^cmd .+?\\bcertutil .+?\\b(\\.exe|\\.bat)\\b|^powershell .+?\\birm .+?\\.[a-z]+\\/.+?powershell|\\bpcalua(\\.exe)? .*?\\b(curl|powershell|saps|cmd)\\b|^cmd .+?\\bcmdkey .+?\\bschtasks|^Invoke-Command .+?Base64String|^conhost .*?--headless .*?\\bcmd\\b|^iex\\(i(rm|wr) |^irm .+? iex\\b/msi","domAlert","Beware, uBlock Origin blocked a potential ClickFix attack: ${text}","excludeMatches","/Maintainer|Contributor|^import /i","Beware. uBlock Origin blocked a potential ClickFix attack: ${text}","dataset.zone","length:40000-60000","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","api/v1/detail","xmxalr","HTMLIFrameElement.prototype.contentWindow","reklama-flash-body","/scoreUrl|pingUrl/","appPageData.appAds","appPageData.appAdsHandles","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.ad.adBlockerDetectorEnabled","..adBlockerDetectorEnabled=false","history.replaceState","data.[].relationships.advert data.[].relationships.vast","offers","/#EXT-X-DISCONTINUITY\\n(?:#EXTINF:.*,\\n.+?adType=preroll[\\s\\S]+?)(?=#EXT-X-DISCONTINUITY)/gm","/.*\\.m3u8/","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json",".*[?.adId]","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","xml","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best","pop_","POP_URL","repl:/\"popactive\":true/\"popactive\":false/","[style*=\"z-index\"]","backRedirect","adv_pre_duration","adv_post_duration",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","data.header_script data.footer_script data.direct_link_ads data.direct_link_ads_vip_1 data.direct_link_ads_vip_2 data.direct_link_ads_play_vip_2 data.direct_link_ads_zoom_vip_2","/config","createAgeModal","Object[_0x","adsPlayer","this","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","a[target=\"_blank\"][rel*=\"sponsored\"]","shopeeLinks","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","clientSide.adbDetect","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","Pop","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","!vidmoly","anchor.href","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]]/@mediaPresentationDuration | //*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]]//*[name()=\"Period\"]/@start | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]])","ssaiInfo","data.attributes.ssaiInfo","/videoPlaybackInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","/atob|overlay/","vads","doSecondPop","a[href][onclick^=\"getFullStory\"]","!newdmn","parentNode.removeChild","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","ai_run_scripts","clearInterval(i)","xpv","xpv.v",".clientHeight===0","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","__spotSettings","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","xv.conf.dyn.ads","xv.conf.dyn.excld","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"https:\")]])","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","function","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","contador","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","detector_launch","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","/(?=^(?!.*(http)))/","()=>","$onet","adsRedirectPopups","canGetAds","method:/head/i","Storage.prototype.setItem","bannerDismissed","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","fallback.ssaiInfo manifest.url","fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])][not(.//*[name()=\"AdaptationSet\"][@contentType=\"text\"])])","/dash.mpd","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","arrvast","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","Object.prototype.rekids","Object.prototype.gafSlot","Object.prototype.advViewability","WP.inline","/getComputedStyle[\\s\\S]*?style\\.display=\"none\"[\\s\\S]*?styleBlocked[\\s\\S]*?detected/","__headpayload","WP","r https","WP.gaf.loadBunch","Object.prototype.loadBunch","Object.prototype.bodyCode","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1",".access=true","/no_ads/config","/zefoy\\.com\\S+:3:1/","/getComputedStyle|bait/","AController_3","json:\"div\"","ins",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST",".props.pageProps.page.blocks.*[?..resource^=\"nc-ad\"]","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","searchCount","empire.pop","empire.direct","empire.directHideAds","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","ssaiInfo fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"_ad\") and contains(text(),\"creative\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","criteo","HTMLImageElement.prototype.onerror","++","\"flashtalking\"","war:32x32.png","triggered","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","powerAPITag","rodo.checkIsDidomiConsent","newAdblockBoardDisplayed","protection","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","window.ts","/googlesyndication|googima\\.js|imasdk/","__brn_private_mode","download_click","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","Node.prototype.removeChild","/^\\[object HTMLImageElement\\]$/","/emojis8\\.js:/","/attachonce == false/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","tmDetectAdBlocker","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","data_source_modules.*.module_data.search_response.products.[-].sponsored_ad.ad_source","/pages/slp","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","sandDetect",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","/#EXTINF:[^\\n]+\\n[^\\n]+?\\/preroll\\/[^\\n]+/gms","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod",".streams.*.adUnits=[]","/manifest/video","/#EXTINF[^\\n]+\\n[^\\n]+?segment[^\\n]+/gms","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","a[href][onclick^=\"window.open\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","/ethicalads\\.io|nitropay\\.com/","HTMLImageElement.prototype.onload","img","Image.prototype.complete","2d","Element.prototype.getBoundingClientRect",".length","HTMLImageElement.prototype.naturalWidth","240","#artifactFileContent","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","playerEnhancedConfig.run","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","JSON.stringify","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","/inter","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","grecaptcha.ready","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","moa_id","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising.ad_server","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","cloudflareinsights","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","location.reload","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","HTMLScriptElement.prototype.setAttribute","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","Array.prototype.includes","adblockTrigger","20","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","rot_url","pop_type","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","google-ca-pub-4459622307906677","wbDeadHinweis","()=>{var c=Kb","0.2","__venatusLoaderInit","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","googlesyndication.com","repl:/blank/self/","stoCazzo","_insertDirectAdLink","/doubleclick|atob|return new Promise|aHR0c/","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","custom_ads","/settings","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","/googletagmanager|ip-api/","&&",".ads={\"movie\":false,\"series\":false,\"episode\":false,\"comments\":false,\"preroll\":false}",".preroll.ad",".preroll.countdownSec=0","()=>j(e=>e-1)","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/createElement|addEventListener|clientHeight/","uberad_mode",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","DMP_ENABLE_ADS","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","link.click","document.body.style.overflow","fallback","!addons.mozilla.org","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","/googlesyndication\\.com|offsetHeight/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","/Werbeblocker|refresh\\\\/","cwAdblockDisabled","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","pbjs.libLoaded",".features.pv=false","/playerConfig","flashvars.adv_pre_url","()&&","Object.prototype.adBlockerPop","BACK","wgAffiliateEnabled","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","clkUnder","adsArr","data.getFinalClickoutUrl data.sendSraBid","data.getAd","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","steamBanner clickAds clickAdsUa clickAdsRu pushNotification","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","En(e-1)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","adClickThrough","..showAds=false","ad_blocker_detector","._$",".result.items.*[?.content*=\"'+'\"]","/comments","img[onerror]","KAA.state.revspot","enforceVideoShield","/initPops|popLite|popunder/","__US_CONFIG__.ads.adblock_measure_enabled","__US_CONFIG__.ads.adblock_wall_enabled","__US_CONFIG__.ads.urls","[?.type==\"ads\"].visibility.status=\"hidden\"","..suppress_ads=true","messages.*.ads messages.*.renderedAdsHtml","TextDecoder.prototype.decode","/<template data-assistant-ads-html=\"\"><aside aria-label.+?<\\/aside><\\/template>/","shouldRun","ad-ipd","smartclip","window.getComputedStyle","maddenwiped","/redirect.php?","*.*","/api/banners","checkBanners","__SSR_CONFIG__.monkey","__revCatchInitialized","json:\"none\"","ab.dt","/^[a-zA-Z]{15}$/","data.initPlaybackSession.adScenarios data.initPlaybackSession.adExperience.adExperienceTypes",".data.initPlaybackSession.adExperience.adsEnabled=false","ConFig.config.ads","json:{\"pause\":{\"state\":{}}}","Object.prototype.adblockPlugin","initializeNtvxSheet","fireAd","juicy_tags","!youtu","injectAd",".isAdFree=true","resumeGame","/admaven|adspyglass/","__tcfapi","ezRewardedAds.requestAndShow","timeout","/eeea5e31|new\\s+Function/","timeLeft--","source.ads","/player",".props.pageProps.globalData.publisherFeatureFlags.enableAdBlockDetection=false",".props.pageProps.globalData.publisherFeatureFlags.enableHardAdBlockDetection=false",".adsEnabled=false","/access","adsterraSmartLink adsterraSmartLink2","/^[a-zA-Z]{12}$/","/popup/i","length:1000-1010","/_0x|window\\.open/","Advert","popup-dialog-id","utilAds","/^a$/","/ADBLOCK|ADSENSE/","pubads.g.doubleclick.net","sponsor ad_provider","api.openlua.cloud","script-error","Element.prototype.remove","probe","HTMLElement.prototype.remove","/adsbygoogle|google-analytics|ads-twitter|doubleclick/","String.prototype.replace","decideForPlacement","=void 0","/\\{[a-z]+\\(\\)\\}/",".value||",".value&&","bf-ad.net","cue_points","/playback","..ads_enabled=\"0\"","data.promotions","__kbAdBait","OzB.adb","/offsetHeight|getComputedStyle/","json:\"x\"","/^w$/","foxizParams.adDetectorMethod","String.prototype.startsWith","/^\\/contact-us\\/$/","()=>e()","sponsored_ads","tag.min.js","..playGateQueue","playerHeadScriptSnippets","/api/config","shaman",".stories.*[?.storyType==\"ad\"]","cykloStories","innerHTML.length:0","isBlocked","/adblock|Error|getComputedStyle/","/click|pointerup/","handleUserAction",".bannerConfig..advertise.*","/\"features\":\\[/","\"features\":[\"ads-shutdown-nativeAds\",\"ads-shutdown-displayAds\",","/\\/owa\\/startupdata\\.ashx/","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","method:POST body:/content_view|impression|page_view/",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","linkfire.tracking","method:POST body:/pageview|engagement/","body:pageview method:POST","svc.webex.com/metrics","/i/api/1.1/flow/viewer.json","{\"skipToString\":true}","faro.civitai.com","method:POST body:/\"track\"|adblock/","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/","igniteseurope.com/stats/","litix.io","/hpyjmp|marzaent/","brightline.tv",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive","json:\"https://\"","data:video/mp4",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_id=1","/track-playback",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_url=\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"","$..durationInSeconds=0","-ssai-vod-","Period:has(> EventStream[schemeIdUri=\"urn:sva:advertising-wg:ad-id-signaling\"])","/dash"];
    const $scriptletArglists$ = /* 3983 */ ";0,0,1,2;0,3,1,2;0,4,1,2;0,5,1,2;1,6,7;1,8,7;2,9,10,11;3,12,13,1,2;3,14,13,1,15;4,12,13,1,16;5,17,18,19;5,20,13,19;5,21,22,16;6,17,18,23;6,24,18,23;6,24,18,25;7,26,27;7,26,28;7,26,29;8,30;6,24,18,31;8,32;4,33,13,1,34;9,35;8,36;9,37;9,38;10,39,1,34;10,37,1,34;10,40,1,34;7,26,41;7,42,29;7,42,41;7,43,29;7,43,41;7,44,29;7,44,41;7,45,29;7,45,41;7,46,29;7,46,41;7,47,29;7,47,41;7,26,48;7,26,49;7,42,48;7,42,49;7,47,48;7,47,49;7,44,48;7,44,49;7,46,48;7,46,49;7,43,48;7,43,49;7,45,48;7,45,49;11;1,50,51;12,52,53;12,54,55;13,56;13,57,58;14,59,60;13,61,62;13,63;13,64;11,65;12,66,67;1,68,51;12,69,70;15,71,72;14,73,74;14,75,74;13,76;16,77,78,79,80,81;16,82,78,79,80,83;1,84,7;1,85,7;1,86,87;14,88;13,89;17,90,91,92;15,93,13,13,94,95;16,96,78,97,80,98;18,99,100;19,101;14,102;14,13,103;15,104,105;16,106,78,13,80,107;15,108,109;20,110,111,112,80,113;16,110,78,114,80,115;16,116,78,114,80,115;15,117,118,119;14,120;1,121,51;15,122,123;21,124,125,126;22,127,128;1,129,130;1,131,130;1,132,130;1,133,130;23,134,135;24,136,137;1,138,139;1,140,51;25,141;24,142,143;22,144,145;11,146;19,147;4,148,13,1,149;1,150,139;19,151;2,152;15,153,154;13,153,154;1,155,139;1,156,157;2,158,60;1,159,157;1,160,139;17,161,162;1,163,164;8,165;15,166;1,167,139;1,168,169;1,170,139;13,171;1,172,157;26;1,173,139;1,174,139;1,175,139;1,176,139;1,177,139;1,178,169;1,179,139;1,180,139;15,181;25,182;15,183;15,184;2,185,186;17,187,188;17,189,190,92;12,191;1,192,13;13,193;13,184;24,194,195;24,196,197;14,198,199;15,200;1,201,169;1,202,169;1,203,169;26,204,13,205;13,206;1,207,169;13,208;1,209,139;13,200;1,210,139;1,211,62;1,212,169;1,213,169;2,214,215,11;2,216,217,11;1,218,87;1,219,139;13,220;1,221,139;1,222,139;1,223,139;1,224,169;1,225,139;13,226;19,227;1,228,139;1,229,139;1,230,139;1,231,169;1,232,62;12,233,234;1,235,169;1,236,139;1,237,169;1,238,139;1,239,13;19,240;1,241,169;1,242,139;1,243,169;1,244,139;1,245,139;1,246,169;1,247,139;1,248,139;1,249,169;1,250,169;1,251,169;1,252,169;1,253,169;1,254,169;1,255,139;1,256,139;2,257,217;1,258,169;13,259;26,260,186;1,261,169;1,262,139;22,263,264;1,265,169;1,266,139;1,267,139;1,268,139;2,269,270;2,271,186;1,272,169;1,273,139;1,274,169;1,275,139;16,82,78,276,80,277;1,278,51;1,279,62;1,280,169;1,281,139;1,282,169;1,283,87;1,284,169;1,285,139;1,286,139;1,287,139;1,288,169;1,289,139;1,290,139;1,291,169;1,292,87;1,293,169;1,294,139;1,295,139;1,296,139;1,297,139;1,298,169;1,299,139;2,300,217,11;1,301,169;1,302,13;1,303,169;1,304,139;1,305,139;13,306;1,307,169;1,308,139;1,309,169;1,310,139;1,311,139;1,312,169;1,313,139;1,314,139;1,315,169;1,316,139;1,317,139;1,318,139;1,319,169;1,320,139;2,321,186,11;2,322,217,11;1,323,139;15,193;2,324,186,11;1,325,169;1,326,139;15,327;2,185,328,11;2,185,329,11;1,330,139;14,331;1,332,169;1,333,139;1,334,169;13,335;1,336,139;1,337,169;1,338,139;1,339,169;1,340,139;1,341,169;1,342,139;1,343,169;1,344,139;1,345,139;23,346,347;1,348,7;2,9,270,11;2,349,350,11;1,351,169;1,352,139;1,353,139;2,354,186,11;13,355;1,356,169;1,357,169;1,358,139;1,359,139;1,360,169;1,361,139;1,362,139;1,363,7;1,364,139;1,365,139;1,366,169;1,367,139;1,368,139;1,369,51;1,370,139;1,371,139;1,372,139;1,373,139;22,263,13,374,375;1,376,169;1,377,139;1,378,169;1,379,139;1,380,169;1,381,139;1,382,62;16,383,384,385,80,386;1,387,169;1,388,139;1,389,139;1,390,62;1,391,7;1,392,139;1,393,157;1,394,384;1,395,139;1,396,169;1,397,169;1,398,139;1,399,169;1,400,139;22,127,401,374,402;1,403,169;1,404,169;1,405,139;1,406,139;1,407,139;1,408,139;1,409,169;1,410,139;1,411,139;1,412,139;1,413,51;1,414,51;1,415,51;1,416,51;8,417;3,418,13,1,419;22,127,420;25,421,60;8,422,423;22,127,424;25,425,426;15,427;1,428,78;15,429;1,430,13;25,431;19,432;8,433;5,434,169,435;5,436,169,435;5,437,169,435;8,438,439;8,440;8,441;4,442,13,1,435;9,443;10,443,1,34;19,444;19,445;22,13,431;14,431;1,446,164;12,447,448;12,449;14,450;14,451;19,452;16,29,78,453,80,454;2,13,426;19,455;27,456;1,457,51;28;19,458;12,459;15,460;22,263,461;27,462;12,463,455;19,464;19,465;19,466;27,467;19,468;22,263,469;22,127,470;14,471,472;19,473;19,474;27,475;13,476;1,477,139;12,82,478;12,69,479;2,480,186;19,481;19,459;22,127,482;19,483;19,484;12,485,486;19,487;24,488,489;12,463,490;27,459;27,491;19,492;19,493;22,127,494;22,127,495;13,166;1,496,62;1,497,139;15,498;12,463,499;12,500,501;19,502;19,503;12,463,504;27,505;27,506;12,507,508;19,509;22,13,480;12,463,510;22,13,511;12,512,513;19,514;14,486;12,233,486;27,503;19,449;12,447,515;19,516;19,517;27,518;27,519;12,77,520;2,521,522;24,482,523;17,524;19,525;22,526,527;19,528;12,463,529;12,463,530;12,463,51;19,531;19,532;1,533,7;19,500;12,482,459;19,534;19,535;19,536;1,537,13;1,538,7;27,539;1,540,62;27,541;27,542;27,543;1,544,62;19,545;12,463,511;19,68;27,546;19,233;17,547,548,549;1,550,157;2;27,551;22,13,459;19,552;1,553,7;19,554;12,516;19,555;12,556,557;27,558;25,559;12,463,560;26,561;19,562;19,563;27,564;14,565;1,532,62;19,566;14,567;19,568;1,569,139;1,570,62;27,571;22,263,572;22,573,574;12,233,575;27,576;12,69,577;1,50,157;1,578,13;1,579,13;1,580,384;22,581;14,582;19,583;14,584,585;1,586,62;19,587;22,13,588;12,463,589;1,590,13;19,591;24,432,592;22,127,593;29,594;22,595;24,233,596;19,597;1,598,139;1,599,164;24,82,600;2,601,602;2,603,472,11;1,604,62;14,605,78;1,606,139;1,52,164;19,607;1,102,7;12,608,490;1,609,62;12,447,610;27,611;1,612,130;22,13,613;19,614;14,615,472;12,485,472;14,616,617;19,618;12,55,501;1,619,62;12,233,620;25,480;22,13,621;19,622;27,623;1,624,7;19,625;12,626;12,55,627;12,628,629;19,50;22,630,631;14,632;19,633;19,634;30,635;19,636;19,637;19,638;1,639,139;12,77,51;1,640,139;27,641;2,642;26,643;14,82,217;19,644;19,645;19,646;12,512,647;27,648;27,649;1,650,7;14,651,652;1,653,62;1,654,7;26,655,656;12,481,102;22,127,657;26,658,585;27,659;27,516;19,660;22,263,631;19,661;1,662,7;22,127,585;12,136,574;12,55;19,663;12,664,665;27,666;22,127,431;12,447,667;19,668;1,669,7;19,609;14,136,472;12,500,55;19,670;27,671;14,672;14,673;19,541;30,516;1,674,13;14,512,78;22,675,676;22,13,632;12,447,562;12,562,677;19,678;19,679;19,680;1,681,62;1,50,139;14,651,585;19,682;22,127,651;22,683,684;12,685,524;27,686;17,687,688;14,689,217;12,690,691;1,692,7;11,621;19,102;12,693;22,13,694;19,695;1,556,62;22,696,697;27,698;14,699,700;12,609;12,485,701;15,702;12,703,704;14,705,585;22,127,706;12,463,707;1,449,62;14,708;22,13,709;14,709;22,710,13,374,711;12,463,451;27,68;14,712,270;22,713,714;14,715,60;12,485,82;14,716,585;11,717;12,447,718;11,719;1,720,169;1,721,13;19,722;27,723;12,77,102;1,724,139;19,725;26,726,585;19,727;1,728,7;13,729;14,730;2,731,186,205;1,102,139;1,732,13;8,186,733;11,13,199;12,29,55;12,562;27,734;13,735;1,736,51;12,463,737;1,738,7;1,532,139;19,739;14,705,740;14,741;19,742;22,713,743;19,744;13,745;1,746,139;19,747;12,482,562;22,630,748;1,749,62;11,750;12,500,751;19,462;15,752;1,753,7;19,754;12,77,755;13,756;1,757,139;22,13,758;27,759;14,760,270;12,463,761;19,762;26,13,763;19,764;26,13,13,78;14,765;12,77,766;13,767;12,768,521;12,463,768;19,769;24,718,770;22,526,771;22,713,772;12,563,773;19,774;22,526,480;12,463,775;12,485,776;19,777;27,778;14,480,585;19,779;12,512,233;27,562;17,780,781;12,782;12,55,500;12,482;12,383,783;27,501;17,784,785;19,786;19,718;25,787,472;14,271,788;12,463,789;19,790;1,562,164;19,791;22,792,621;1,793,62;19,571;19,794;27,795;17,796,797;26,798,186;1,799,7;1,800,139;22,263,801;14,802,60;12,571;19,803;22,127,804;12,805;1,806,51;19,807;12,463,459;22,127,808;14,511,217;14,809,810;13,811;27,799;14,812,78;26,813;12,77,814;12,815,816;1,817,7;19,818;19,819;19,820;14,821,472;15,271;1,822,7;27,823;14,824;25,825,472;27,826;14,480;1,827,7;11,828,199;12,77,829;27,830;1,55,139;22,13,831;19,832;1,833,139;14,834,384;1,835,139;12,77,271;1,836,139;13,752;22,713,837;12,507,501;12,383,838;19,839;2,840,522;19,841;19,623;12,463,842;1,102,384;1,843,384;14,844;17,845;27,846;8,847,848;12,849,771;14,463;14,850,472;27,633;27,851;14,802;12,77,852;1,853,78;1,271,62;27,854;22,263,855;19,856;12,857,635;1,858,62;27,859;14,431,78;22,13,860;14,861;1,862,139;12,447,863;1,528,384;12,485,864;12,485,865;27,866;12,563,864;12,69,867;19,868;24,507,869;14,870,871;25,872;17,687,873;27,874;12,233,875;14,427;12,447,876;22,263,480;1,877,7;15,166,752;19,833;14,878,60;19,879;19,880;19,881;14,511;19,882;27,883;26,13,13,11;1,884,157;12,885;12,482,524;19,886;1,887,62;24,888,523;1,889,13;1,890,51;1,528,7;14,802,426;19,891;12,77,892;1,893,62;12,77,894;12,77,895;14,896,585;14,897,472;19,898;27,899;12,463,900;12,463,901;12,463,892;14,893;12,77,902;12,463,903;12,77,904;27,905;15,184,118,119;14,164,522;22,127,906;22,127,907;12,512,651;14,705,350;14,908,270;26,853;1,909,78;19,910;14,911,350;14,705,215;22,263,748;11,912;27,500;19,913;1,914,7;12,463,102;15,915;14,916;22,917,918;14,919;1,920,139;12,463,921;14,705,472;12,233,922;12,507,55;1,923,62;27,924;2,925;27,926;12,685,575;27,927;1,928,7;1,68,139;1,929,139;14,718,350;14,490;27,930;14,931;1,932,139;14,933,585;1,934,62;27,928;22,127,935;25,705,217;19,936;19,937;22,938,939;27,940;19,941;24,233,523;17,524,942;2,943;27,944;1,945,62;12,488,627;12,463,946;25,947,948;1,949,13;19,501;12,463,950;1,905,62;1,951,62;14,952;13,271;14,953;12,815,263;12,77,954;12,182,691;19,955;11,956,78;1,957,62;1,690,62;26,643,186;1,958,7;22,526,959;14,960,656;1,961,7;14,962;2,13,13,205;14,963,60;14,964,426;22,263,214;19,577;1,965,78;1,823,139;19,966;26,642;14,967;26,13,13,205;1,968,78;22,263,621;19,969;19,970;12,68;12,463,971;11,972;19,507;12,973,234;12,628,758;26,974,472;27,975;22,976,758;1,977,139;12,66,892;1,978,78;22,263,979;11,102,384,980;15,981;22,263;1,982,7;12,983;12,984;12,985;12,986;22,713,987;19,988;14,989,384;11,990;12,846;19,991;11,992;1,993,139;19,994;19,995;14,996;1,997,139;25,998,472;22,630,999;1,1000,7;19,224;12,447,771;12,718,1001;27,1002;1,511,7;19,1003;12,815,1004;19,482;1,1005,13;1,1006,13;1,1007,7;24,55,523;19,899;14,1008;12,77,1009;12,55,623;12,1010,480;14,1011;13,1012;13,1013;14,954,585;24,69,523;19,1014;22,713,1015;14,1015;12,463,766;14,888,472;1,1016,78;1,1017,62;1,1018,62;1,1019,7;14,102,1020;22,1021;19,1022;14,1023;14,164;12,233,1024;12,485,1025;19,1026;19,1027;19,1028;12,628,632;27,1029;1,1030,130;19,1031;12,233,1032;12,69,1033;19,1034;1,1035,62;1,1036,62;31;1,1037,164;24,77,1038;1,1039,62;1,1040,7;2,943,472,11;27,1041;19,771;19,1042;22,13,1043;14,431,617;12,77,1044;12,233,1045;12,77,1046;27,1047;19,904;12,815,651;11,460,384;19,1048;17,687,1049;19,1050;22,460,758;25,1051,472;14,1052;12,383,53;19,1053;1,1054,7;1,1055,7;14,1056;19,551;19,1057;22,127,1058;22,1059,480;19,1060;1,1061,62;12,520,781;19,1062;19,1063;1,1028,139;19,1064;30,1065;19,1066;27,1067;1,1068,62;19,1069;27,1070;1,1071,384;30,271;17,1072,1073;12,831,867;12,1024,867;27,1074;1,68,7;14,1075;11,271;1,1076,384;19,1077;27,1078;14,1079;1,1080,62;12,562,687;19,1081;12,1082;12,815,1083;1,1084,157;12,685,1085;12,66,1086;14,1087;15,1088;12,447,51;14,1089;27,1090;27,1091;22,713,1092;27,1093;12,463,863;12,1094,954;12,233,954;19,1095;12,77,1096;11,1097,199,980;27,102;1,1098,62;27,1099;22,1100,1101;12,463,1102;14,705;19,1103;8,1104;25,1105;12,66,1106;19,1107;12,233,588;19,1108;1,1109,62;14,863;24,420,1110;14,1111;19,1112;14,1113;14,1114,585;15,1115;1,949,51;12,550;22,13,1116;19,799;17,1117;19,1118;12,623,577;12,1119;15,1120;19,1121;14,1122;1,1123,13;22,938;1,260,62;27,1124;14,1125;25,1125;22,263,1126;19,1127;12,1128;12,233,1129;22,13,490;19,1130;25,549,740;25,1131;1,1132,51;22,1133,676;12,517,1134;22,127,1085;12,77,1135;14,1136;1,1137,62;27,1138;14,1139;14,13,384;22,13,1140;1,475,62;14,51;14,905,384;12,463,1141;27,907;12,463,1142;12,447,1108;14,799;1,1143,13;19,1144;1,1145,139;19,1146;12,447,102;26,1147;2,1147;19,1148;12,507,1149;14,651;22,13,1150;1,68,62;12,888,1106;12,447,996;26,1151;1,1152,78;14,1153;13,184,118;19,1154;14,1155,585;25,758;25,766;19,1156;8,1157;26,13,186,78;1,532,157;14,989;22,263,771;12,463,485;12,77,1158;12,463,271;12,447,766;12,463,1159;19,1160;12,69,632;12,463,66;1,1161,62;13,1162;1,1163,169;13,1164;1,1165,7;24,1166,1167;5,1168,1169,1167;8,1170;1,1171,51;1,1172,7;1,1173,139;32,1174,1175;22,1176;8,422,1177;14,1178,652;14,85;12,1179;12,485,1180;12,1181;22,1059,1102;19,1182;12,463,1183;14,1184,78;14,651,1185;22,127,51;1,1186,7;22,713,1081;1,1187,169;22,127,758;14,1188;22,713,562;12,463,1189;12,77,1190;1,1191,62;1,427,164;12,233,102;13,1192;26,1193,472;14,1194,78;19,924;25,1051;25,781;22,1195;19,1196;12,463,562;19,1197;1,1198,7;14,605,871;1,1199,62;1,1200,62;11,1201;12,1202,771;33;27,1203;12,857,863;12,463,1204;17,1205;30,741;22,263,1206;19,1061;12,463,1207;12,69,501;12,463,482;22,263,13,374,1208;14,1209;13,427;1,1210,139;19,884;19,1211;1,1212,62;12,833;12,1213;17,687,1214;17,687,1215;17,687,1216;12,69,1217;19,1218;19,1219;12,507,1220;22,13,451;22,840,574;14,1221;24,886,1222;1,1223,164;14,758;12,136,354;19,1224;19,1225;17,845,1226;12,512,816;14,1227,60;12,82,1228;12,463,1229;14,1230;22,13,271;19,1122;12,463,1231;27,1232;22,263,1233;1,1234,62;14,1142;22,127,1235;25,427;1,1236,62;14,1237,472;15,1238;1,1239,7;12,463,1153;12,447,1153;14,1240;8,1241;14,1237;22,127,1242;1,1243,62;1,1244,62;12,482,102;1,1245,7;19,1181;19,1246;19,1247;12,233,1248;1,459,51;19,1249;1,1250,164;12,512,1251;12,447,263;1,1252,62;12,501,489;14,805;22,13,562;14,1253;11,1254;14,1255;26,658,186,11;19,1138;1,1256,164;1,427,157;1,1257,51;19,1258;11,1259;14,1260;14,691;26,1261;1,68,164;22,713,863;1,1262,384;19,1263;19,520;1,1264,7;19,1265;19,1266;12,55,480;14,904;19,1267;1,1139,7;8,1268;22,1269,1270;14,1271,78;14,271;12,463,1272;22,1273,1274;22,713,799;24,623,523;2,13,426,78;19,491;19,1275;1,1276,62;19,1277;11,1278;17,1279,1280;12,512,1153;12,512,1281;12,512,510;12,815,799;25,931;1,957,7;27,1282;1,1283,51;23,1284,1285,1286,1287;19,1288;26,840,186,205;14,904,585;16,1178,78,1289,80,1178;1,1290,157;23,432,1291;26,726,186,205;1,1292,78;2,1293,186,11;26,1294,186,11;26,1295,186,205;2,1296,186,205;19,1282;26,840,186,11;22,1297;22,805,1298;26,1299,186,205;30,1300;8,1301;2,1302,186;1,1303,62;12,512,1304;12,545,644;12,482,427;8,1305;8,1306;8,1307;30,1308;26,1309,186,11;14,1310;15,1311;12,1312,1313;14,1314;15,184,13,1315;1,1316,157;12,1312,931;15,1317;22,127,1318;12,512,1313;12,512,271;11,1319;1,1320,62;19,1321;17,1322,1323;17,1322,1324,92;17,1325,1326;22,805,1327;15,1328;26,813,186,11;19,984;24,82,1329;14,1330,1331;16,77,78,1332,80,1333;16,77,78,1334,80,1333;16,815,78,1335,80,1336;16,1337,78,1335,80,1338;26,1295,186,11;2,1339,186,11;26,726,186,11;22,713,694;14,1189;19,1340;15,1341,13,1315;22,263,1342;22,1343;22,127,1344;17,687,1345;22,713,1346;22,713,802;14,480,60;27,1347;17,1279,13,92;11,1348;1,779,51;2,1349;1,1350,7;1,1351,139;1,986,139;22,1352,631;22,1336,1353;15,1354;2,13,186,1355;20,501,1356,7;27,1312;24,432,1357;19,1358;26,1295,472,11;26,1295,1359,11;12,233,1346;19,985;26,1016,186,11;1,1360,62;22,1361,1362;1,904,1363;13,1364;12,1365,1366;22,713,615;14,898;26,1367,186,11;2,1102,186,11;30,431;19,1368;15,1369,1370;26,840,186;2,840,186;22,127,1371;19,1372;17,524,1373;30,959;24,77,799;11,13,1020;2,840,186,11;24,27,1374;1,1375,130;22,263,1376;2,1102,186;30,1377;22,713,1378;17,524,1379;22,263,1380;22,263,13,374,1381;19,1318;19,1382;15,1383;13,1384;30,427;15,1385;11,1386;26,13,186,205;2,13,186,205;15,427,1387;1,1388,164;12,29,1389;22,263,1390;23,1391,1392;1,1393,169;14,1394;16,77,78,79,80,1395;15,1396;14,1397;12,136,1398;22,713,1399;22,263,233;1,1400,51;22,713,459;15,1401;15,1402;26,658;1,1403,62;18,1404,1405;17,687,1406,92;22,263,1407;26,658,472,11;22,805;2,13,617;12,485,966;24,685,799;1,1408,1287;12,55,1409;14,802,217;26,658,472;2,943,472;12,27,66;15,735;25,1319;12,485,1410;12,29,1024;22,263,459;22,263,1411;34,1412,1,1413;16,1414,1287,1415;22,263,1416;22,263,1417;9,1418;9,1419;15,1420;17,1325,1421;22,263,588;22,263,1085;11,1422;19,55;12,55,1423;12,693,1424;1,1425,62;19,1426;1,1427,13;11,1428;22,263,1429;22,263,1430;25,1431;12,233,799;24,77,1432;4,1433,13,1,1434;11,1435;13,1120,118;11,13,199,980;26,1436,186;16,82,78,1437,80,1438;16,136,78,1437,80,1439;16,77,78,1440,80,1441;15,1442;14,1443,652;21,857,1444;14,1445;26,1446,186;14,1178;22,1336;16,77,78,1447,80,1448;35,575,1449;12,1450,1451;12,1452,1451;24,815,1453;24,1454,1453;1,1455,139;1,1456,139;22,263,1457;11,1458;22,713,1459;12,233,1459;22,127,1460;12,233,1461;14,1462,60;14,198;1,1463,139;14,216,199;1,1464,7;14,1465;19,1466;24,69,875;24,66,1467;24,66,1468;24,66,1469;12,485,1470;1,1471,169;1,1472,139;12,1473;8,1474;20,55,111,13,80,1475;22,263,574;12,55,1476;12,1477,1476;20,55,111,13,80,1478;27,833;22,13,574;12,463,574;12,54,1094;22,13,1479;12,485,620;12,1480,620;12,233,1481;12,233,1482;22,127,1483;12,233,1484;14,1484;12,233,620,1485;21,1486,1487,1417,1488;12,233,1489;30,620;12,545,1490;19,1491;11,1492;19,1493;22,13,572;14,1494;24,233,1495;1,1496,13;19,1497;27,1498;12,644,516;25,460;1,1499,51;14,1085;27,1500;1,578;14,1087,585;12,69,1501;12,29,234;12,1502,234;22,13,234;12,69,234;12,507,1503;24,66,1504;12,29,1094;12,1505,234;24,420,1506;12,1365,1507;19,1508;19,1509;12,1094,29;12,1094,234;12,1010,53;12,500,1510;24,66,1511;12,69,1512;13,1513;34,1514,1,1515;34,1516,1,1515;34,1517,1,1515;24,577,1518;12,54,55,1485;22,713,490;12,1519,1520;12,52,1521,1485;12,512,1053;12,520,1522;12,1505,1523;24,562,1524;12,27,53;12,512,1525;22,630,1526;11,1527;1,1528,87;14,1529;24,685,1530;22,1531,9,374,1532;1,1533,62;1,1534,1535;1,1536,139;22,127,1537;22,263,1537;26,1295;11,1538;1,1539,7;22,13,1540;14,513,585;30,1541;12,233,1541;30,1542;22,127,931;24,136,1543;19,1544;21,857,1444,1417;14,1545;27,1546;12,1156,996;12,1156,996,1485;22,127,1547;14,489;15,1548,118,1370;13,1548,118;22,713,1549;21,1550,1551,126,1552;1,1553,7;12,233,1554;1,1554,139;36,1555;36,1556;1,1557,51,1286,1558;1,1559,62;9,1560;9,1561;12,233,1562,1485;1,1563,62;22,710,1153;12,1554;1,1564;35,575,1565;22,1566;1,1567,51;24,500,1568;22,710,1569;22,127,1569;14,1569;3,271,13,1,1570;1,1571,62;9,1572;9,1573;36,1574;36,1575;36,1576;15,1577;14,1578;14,1579;14,1580;16,1581,384,13,80,1582;17,875,1583,1584;1,1585,139;16,1586,78,1587,80,1588;9,1589;1,1590,62;1,1591,139;1,1592,139;8,1593;16,1581,384,1594,80,1595;16,1581,384,1596,80,1595;30,1597;35,575,1588;16,1581,384,1598,80,1582;1,1599,62;1,1600,62;14,9,60;16,77,78,1601,80,1602;21,1581,1603,126;22,127,1578;12,233,1604;1,1112,139;8,1605;1,1606,384;1,1607,7;1,1607,7,1286,1558;1,1608,7;1,1608,7,1286,1558;1,1609,7;1,1609,7,1286,1558;1,1610,7;1,1610,7,1286,1558;37,1611,1,1612;37,1613,1,1612;35,575,1614;1,1615,62;38,1616,1,1617;1,1618,139;1,1619,51;36,1620;12,1621,1622,1485;1,1623,7;26,1624,186,11;1,1625,157;19,1626;27,1627;36,1628;17,672,1629;1,1630,164;1,1202,164;20,1631,1632,13,80,770;24,1633,480;1,847,87;11,13,384;23,1634,1635;1,1636,384;24,233,1637;22,127,1638;1,1639,78;12,463,507;30,182;2,1640,186,11;12,512,1521;25,102;17,845,1641;2,726;8,1642;36,1643;24,233,1644;22,263,1645;12,1646;19,1647;22,1648;39,1649,1650,1651,1652,1653;39,1649,1650,1654,1652,1653;12,233,1655;15,166,1656;15,1513;22,713,431;22,1352;3,1657,13,1,1658;22,713,1659;3,1660,13,1661;3,1660,13,1,1661;1,1662,62;1,1663,62;3,1657,13,1,1664;1,1665,13;12,1666;12,1202,1667;22,1531,1668;1,1669,169;1,1670,169;12,815,1671;3,1672,13,1,1673;3,1674,13,1,1675;15,1676;25,451;1,1677,7;1,1678,7;36,1679;12,1680,802;8,1681;8,1682;5,1683,13,1684;22,263,1685;12,815,490;40,1686,1,1687;9,1688;15,1689,1690;14,1691;1,1692,7;1,1693,51;22,263,1694,374,1289;1,1695,62;14,13,871;13,1696;22,127,600;14,1697;16,77,78,1698,80,1699;15,1700;14,1701;22,263,757;14,757;22,127,1702;22,13,1703;22,713,1704;1,1705,62;14,1706;1,1707,7;22,713,989;8,1708,1709;41,1710,13,1711;4,271,1712,1,1713;8,1714;8,1715;42,1716,1717;11,1718;12,485,102;22,13,1719;12,815,1720;16,857,78,1721;17,672,1722,92;14,1723;27,1724;27,1725;14,615;22,263,1719;12,233,1726;12,628,432;11,1727;9,1728;12,815,1729;1,1730,87;24,485,482;22,1731,1732;23,1733,1734;3,271,13,1,1735;1,1736,7;1,1181,51;1,1737,62;4,1738,13,1,1739;24,233,1740;11,621,384,980;12,815,1741;14,1702;12,815,1022;1,1742,51;22,713,480;16,106,1743,1744,80,1745;11,1746;22,263,485;22,263,1747,374,1748;18,1404,1749;22,263,1750;1,1751,157;14,1752;1,1753,7;12,447,420;12,512,863;1,1754,7;19,1755;12,77,1756;19,1757;26,1758;2,1759;14,1760;25,1760;1,1761,164;14,802,472;22,127,1762;14,1763;14,899;14,1764,78;12,77,427;12,501,1765;30,451;14,447;22,526,1766;12,685,766;12,463,1767;12,383,577;14,907;14,460;22,713,1768;12,507,1769;1,1770,384;1,1771,7;1,1772,7;12,233,508;1,1773,164;12,463,1774;19,1775;1,1776,7;1,1777,7;14,905;19,1767;19,1778;19,1779;19,1780;12,804,66;1,1781,78;1,1782,7;14,1783;14,1784;12,463,1237;30,863;14,1785;12,463,1786;24,463,1506;1,1787,164;12,563,520;24,1788,1789;24,233,1790;22,127,575;30,1791;12,463,1792;12,628,1793;12,463,1794;1,1795,139;1,1796,139;15,771;27,1797;11,1798;23,1799,1800;14,1801;12,482,431;12,77,1802;12,857,1803;1,1804,130;14,1204,472;19,1805;22,13,1806;1,1807,51;1,1808,139;26,726,186;14,1181;12,82,431;22,127,1044;19,1802;12,463,1809;12,577,1810;1,1811,7;22,13,1812;19,1813;1,1814,169;1,1815,62;1,1816,384;1,1817,169;1,1818,169;1,1819,384;8,1820;1,1821,139;12,485,1822;19,1823;22,713,102;30,709;1,1824,62;1,1825,51;14,1726,871;1,1826,139;25,741;1,937,7;13,1827;27,1828;14,1829;19,1830;27,1831;14,1832;14,1833;14,1834;12,482,1835;1,1836,130;26,1837;27,1838;1,658,78;12,463,1839;24,69,907;1,1840,139;14,1841;1,500,139;19,1842;12,482,1843;1,1844,13;19,934;14,1732;14,1845;19,1846;19,1847;19,1024;12,69,1258;22,13,1848;14,819;14,1849,871;14,1850,60;14,1851,472;19,1137;24,66,1852;8,1853;14,1726;22,710;17,687,1854;14,1855;14,1856,472;22,127,1857;14,1858;17,524,1859,92;1,1860,139;14,1861;19,1862;12,491;2,1863,1864;11,1865;1,1404,139;22,713,1866;17,1867,1868;19,1869;14,1870;12,1002,1871;8,1872;22,263,1479;26,1873,472,11;1,1874,13;8,1875;8,1876;41,1877,13,1711;41,1878,13,1711;8,1879;4,1880,13,1,1881;1,1882,139;1,1883,62;14,1884;19,1885;26,13,13,1886;2,13,1887,78;25,1726;22,713,1189;17,687,1888,92;14,1889,426;12,1890;22,713,1891;12,77,1289;22,13,1892;19,1893;17,524,1894;11,1895,384;12,55,1896;19,1897;22,1898;19,1899;19,450;1,1900,7;1,1901,139;1,1902,62;14,1903;12,1904;12,463,1905;27,1626;30,490;22,792,501;14,1906,700;1,1907,62;1,1908,62;27,1704;19,1909;12,1910,1911;19,1912;19,1680;19,1913;12,507,1914;1,1915,51;12,383,1916;12,1917;27,556;14,1918;13,1919;23,1920,1921;23,1922,1923;1,1924,7;1,1925,7;24,485,799;1,431,78;19,1926;25,1927,472;1,1928,169;1,1929,62;12,1365,1930;27,1931;22,263,1932;12,1933;1,1934,7;1,1935,7;12,447,271;12,685,332;2,1936,1937;1,1938,139;19,1939;27,1940;22,1731;22,13,1941;24,66,13;1,1060,62;12,482,27;25,77,426;24,447,996;8,1942;12,233,1943;1,1944,13;1,1945,78;22,263,1213;14,27;24,29,1946;12,69,635;15,1947;12,77,799;22,127,885;12,447,1190;14,1948;15,1949;22,713,1950;1,1951,139;1,1952,51;1,1953,51;12,577,1954;24,966,523;19,624;12,463,1760;20,55,1955,1956;8,1957;15,1958,13,1959;24,833,1960;17,1961,1962;12,233,1803;22,1963,1964;26,1965;22,805,214;22,805,1966;12,501,758;1,1967,62;1,1968,139;12,447,892;42,1969,1970;8,1971,1972;41,1973,13,1974;15,1975;12,507,489;14,1976;24,563,13;19,1977;14,1978;19,838;24,563,1979;19,1980;26,480;24,888,482;22,713,758;14,1981;26,1982;12,501,55;19,893;19,1983;27,1984;1,1985,139;1,1986,384;1,1987,13;13,1988;15,1988;14,13,270;19,1627;12,815,1189;12,718,1989;22,1059,51;12,1990;26,1991;19,1992;22,1993,1994;17,687,1995;2,1996;12,27,1997;12,77,1998;13,1999;12,815,427;26,2000;26,2001;17,1325,2002;12,463,605;22,1059,600;22,263,2003;2,2004,270;12,27,2005;19,2006;17,1072,2007,1584;13,166,118;38,2008,1,2009;3,2010,13,1,2009;8,2011;26,2012;25,2013;26,2014;12,233,2015;1,1211,139;14,2016;26,2017;15,2018;41,2019,13,1711;12,77,2020;15,2021;19,29;26,1837,2022,2023;8,2024;19,2025;12,563,516;12,2026;1,672,139;1,2027,139;12,233,2028;24,69,489;2,2029;14,2030;15,2031;1,1816,2032;1,2033,51;14,958;12,233,448;24,233,2034;12,488,635;1,2035,78;22,792,2036;14,2037;22,263,1288;3,2038,13,1,2039;26,2040;26,1016,186;14,2041;24,833;14,1120;22,127,898;22,1059,2042;19,2043;19,558;26,2044;12,463,427;11,2045;15,2046;17,2047,2048,92;43,166,2049;1,2050,169;1,2051,139;14,2052;25,2053;15,2054;12,77,2055;24,2056,2057;12,815,2058;14,2059,585;1,2060,7;2,480,215;2,802,1331;24,69,13;1,2061,7;24,66,1946;26,2062;24,463,523;19,2063;13,2064;14,2065;1,2001,78;24,69,770;24,485,271;24,66,523;1,2029,157;19,1984;1,2066,384;12,233,431;12,512,489;24,2067,2068;12,2069;24,2070,420;11,2071;2,2072,1864;24,488,770;2,1918,186;1,2073,139;14,2074,217;24,27,523;17,524,2075;13,460;12,1156;11,460,78;15,1801;12,77,1010;12,77,481;1,2076,139;15,213;14,2077;12,463,27;12,77,600;13,2078;22,127,2079;19,556;8,2080;8,2081;27,1156;22,127,2082;13,2083;12,482,781;12,233,2084;19,2085;24,1045,482;19,28;24,233,875;14,2086;13,1801;12,685,2087;17,687,2088,92;17,2089,2090,92;13,2091;17,1325,797;26,726,13,205;1,2092,87;17,1325,2093;12,463,2094;2,2095,217;22,127,574;12,82,480;19,2096;22,263,2097;1,2098,62;2,2099,186;2,2100,186;1,2101,78;12,2102;12,520;24,27,770;19,2103;12,77,863;15,2104;13,2105;12,485,2106;2,2107,186;1,2108,139;1,2109,62;14,2110;32,166,2111,1370;22,713,1701;22,13,2112;12,628,741;22,1059;19,2113;12,2114;12,66,989;12,447,2055;1,2115,7;1,2116,7;22,13,2117;2,2118,215,205;1,2119,62;1,2120,13;22,1176,13,374,2121;25,2122;24,69,480;1,2123,169;1,2124,62;26,2125;30,102;12,512,771;14,2126;2,658;12,2127;12,69,507;8,271;42,2128,2129;2,2130,472,11;15,166,118,119;15,2131;14,2132;22,127,2133;17,2134,2135,92;1,2136,139;26,726;24,482,2137;15,2138;2,451,522;19,2139;27,2140;8,2141;12,463,2142;19,2143;14,2144;24,233,2145;26,2146;1,2147,7;12,182,2148;12,463,799;14,2149;26,2074;1,271,51;1,1003,51;19,2150;12,831,508;12,447,2016;12,233,2151;14,2152;12,507,996;1,68,130;1,2153,51;15,2154;13,2155;1,2156,384;19,2157;19,2158;27,2159;14,2160;1,934,139;12,857,501;22,713,55;11,2161;22,2162,2036;12,815,2163;1,2164,139;14,2165;1,2166,51;1,2167,62;11,2168;25,271;19,2169;12,463,2170;19,2171;2,2172,186;27,2173;19,2174;25,2175;17,524,13,92;27,2176;22,431;1,2177,62;19,2178;12,77,651;12,233,2179;26,2180;12,520,2181;14,705,2182;2,1361,217;12,507,635;1,2183,62;19,2184;13,2185;22,263,2186;13,1348;19,1243;15,2187;19,2188;19,420;14,687;24,488,2189;19,2190;19,2191;12,1505,771;19,2192;30,771;12,69,2193;12,563,2194;12,383,1033;12,77,931;24,233,1506;19,2195;19,2196;12,463,2197;12,233,459;26,2198;12,2199,691;1,2200,62;12,2201;14,2202;30,799;13,1548;12,463,1424;24,233,2203;14,2204;12,2205,102;19,2206;1,2207,62;15,2208;16,2209,384,13,80,2210;15,427,2211;12,2212;1,2213,7;1,2214,139;2,2215,585;17,687,2216,92;22,713,673;8,2217;12,2218,1112;14,164,199;26,1016;27,861;1,2219,157;12,2220;22,263,2221;1,771,51;12,233,863;14,13,60;14,588;2,9,217;15,2222;16,2223,78,139,80,588;1,2125,78;11,2224;19,2176;27,1823;12,77,2225;1,1202,13;1,2226,62;8,2227;3,1879,13,1,2228;3,2229,2230,1,2228;41,2231,13,2232;41,2233,13,2234;12,29,2235;22,263,2236;22,127,102;13,1311;13,2237;22,13,69;22,713,2238;1,2239,78;13,2240;19,2241;12,55,2242;14,647;25,2243;12,463,2244;12,233,1085;17,687,2245;14,2074;1,2246,78;26,658,186,205;14,2247;14,2248,270;11,2249;17,1325,2250;17,1325,2251;12,2157;1,2252,62;1,2253,78;8,2254;24,838;15,2255;17,2256,2257;17,2256,2258;17,2256,2259;17,2256,2260;22,127,577;22,127,510;22,13,907;25,2261;22,13,2261;22,13,2262;1,2263,51;27,2264;24,463,2265;1,2241,87;1,2266,139;15,2267;8,2268;8,2269;14,2270;1,2271,78;12,2272,771;22,13,1142;30,2273;16,82,78,139,80,102;14,802,270;15,2274;1,2275,139;1,884,139;25,1189;1,2276,7;12,904;15,2277;17,1325,2278;1,2279,7;27,2280;14,160;1,2281,87;22,263,2282;1,2283,62;1,2284,139;1,2285,7;2,2286,215;27,2287;22,805,886;19,2288;16,106,78,2289,80,2290;26,853,13,205;13,2291;14,1851;12,2292;19,1346;22,713,2293;1,2294,2295;17,672,2296,92;17,687,2297,92;15,2298;15,2299;12,447,1142;14,2300;14,263;12,563,66;6,2301,2302,2303;14,2304;1,2305,62;36,2306;14,2307;14,2308;11,2309;24,233,2310;22,13,2311;12,463,2312;25,2313;12,463,966;14,459;14,2314;14,2315;12,447,160;15,2316;1,813,78;1,2317,139;21,857,2318;24,815,2068;24,1755,523;24,1502,799;8,2319;8,2320;12,545;14,2321;8,2322;30,2323;12,1823;14,2324;12,233,2325;42,2326,2327;12,1094,1978;1,2328,7;1,2329,7;11,2330;26,2331;30,507;1,2332,62;12,55,2333;2,2334,2335,11;14,1189,871;1,2336,7;1,2337,62;15,2338;1,958,139;8,2339;15,2340;27,839;22,713,2341;1,2342,87;22,713,166;1,2343,7;30,1153;14,1183,700;1,2344,51;1,2345,51;1,2346,51;19,2347;14,2348;19,2349;24,2350,2351;1,2352,139;1,2353,139;19,2354;26,2355;44,2356,78,2357;16,2358,78,2359,80,2360;2,2361,186;26,2362,186;14,2363;12,233,490;1,2364,7;22,127,771;27,2365;27,2366;8,2367;27,2157;12,463,532;14,2368;14,1189,810;19,2369;26,2370,186,11;37,2371,1,2372;14,445;24,55,2373;14,2374;1,2375,139;16,233,78,2376,80,2377;12,233,263;1,2085,139;22,713,2378;1,2379,62;24,82,2380;12,507,27;22,263,2381;11,2382;14,2383;17,524,2384,549;11,2385;17,482,2386;14,635;24,485,2387;19,2388;17,524,2389;22,1059,2390;14,2391;1,2392,87;22,713,2393;14,2394;14,1186;14,2395;22,127,1153;24,55,857;15,2396,2397;14,2398;14,2399;1,2400,78;1,2401,62;14,513;12,815,2402;24,2403,2404;19,2405;27,607;1,819,62;27,2406;1,2407,2182;26,480,186,11;12,2408,431;24,2409,2410;22,127,77;25,875;1,859,139;24,966,2411;14,2412;12,512,1159;19,1394;14,2413;19,1283;27,2414;27,2415;17,687,2416;8,2417;19,2418;9,2419;23,432,2420;1,2421,62;23,2422,2423;21,2209,2424;26,726,472,11;1,2425,51;1,2426,51;1,2427,51;2,2428,186;13,2429;1,2430,384;1,2431,384;14,2432;12,628,463;14,600;24,233,799;17,524,2433;1,2434,78;27,2435;11,2436,384;22,713,2437;1,2438,78;14,2439;14,2440;29,2441;14,2287;1,2442,139;14,2443;1,2444,62;14,2445,2446;1,2447,169;1,2448,169;15,2449;22,263,2450;14,2451;14,68;1,2452,199;19,2453;19,354;1,2454,2455;14,2456;14,2457;1,2458,139;13,2459;27,726;12,82,102;12,77,2460;27,2461;25,2462;1,2463,139;1,2464,169;45,2465,1051,2466;45,2467,1051,2466;8,2468;3,2468,13,1,2469;15,2470;3,2222,13,1,2471;1,2472,7;1,2473,7;1,2474,7;3,2475,13,1,2228;4,2475,13,1,2228;41,2476,13,2232;14,1918,700;22,263,2477;25,2478;24,501,2479;24,488,463;30,2480;15,2481;22,713,1906;29,460;1,121,164;8,2482;13,2483;6,2484,2485;42,2486,2487;1,2488,2295;1,2489,139;12,447,2490;22,127,2491;1,2492,2493;22,263,2494;8,2495;19,2496;1,2497,139;22,630,2498;12,501,2499;12,815,863;24,233,600;2,2500,186;26,2501,186;1,2502,7;17,524,2503,92;22,263,2504;15,2505;1,2506,139;22,127,9;1,2103,139;14,2507;22,127,136;12,233,2508;17,524,2509;27,2510;30,510;27,2186;1,2511,7;1,2512,7;8,2513;3,2513,13,1,2514;12,520,2515;22,1015;1,2516,139;14,1762;1,2517,7;1,890,13;26,451,472,11;12,1382;1,2518,78;2,2519;14,2520;14,2521;14,2522;41,2523,2524,1711;8,2525,2526;19,2527;12,2528;3,2529;8,2529;25,892;12,512,27;1,2530,169;26,2531;15,2532;3,2533,13,1,2534;41,2535,13,2536;8,2537;1,2538,130;12,520,2539;19,2540;12,463,771;12,718,1024;12,2541;14,2542;17,672,2543,92;17,687,2544,92;24,482,2545;1,2546,62;1,2547,157;5,2548,2549,2550;1,2551,78;1,2552,78;1,2553,384;1,2554,13;14,2555;24,485,2556;19,2557;22,127,2299;15,2558,2559;13,2560;1,2561,51;29,2562;12,233,52;21,27,2563;13,2255,2564;22,263,2565;4,2566,13,1,2567;4,2568,13,1,2569;4,2570,13,1,2571;4,2572,13,1,2573;4,2574,13,1,2575;1,2576,2295;14,766;1,2388,7;27,2103;1,2577,139;12,501,2578;27,2579;1,2580,78;12,512,2581;15,735,118,119;12,27,102;14,2582;15,2583,118,1370;22,713,2584;12,1372;12,463,2585;2,2455,186,11;13,2586;27,2587;15,2588;1,2589,139;1,2590,7;41,2591,13,1711;14,2592;27,121;12,815,2593;26,1936;14,1429;2,2594,472,11;27,1137;26,13,472,11;2,658,186,11;12,463,2595;22,127,271;13,735,118;25,2596;12,52,1526;1,2597,7;22,263,2598;14,2599;2,2600,1331;15,2601;17,687,2602,92;11,2603;25,2604;15,2605;14,13,2606;14,2607;3,2608,13,1,2609;12,520,2610;1,2611,13;22,263,9,374,2612;12,233,2613;13,2614;15,2614;2,758,186;14,748,78;19,2615;14,968;12,29,53;1,2616,62;12,463,2520;1,2617,62;13,2618;22,630,966;13,2619;15,2619;13,2620;8,2621;8,2622;14,2623;26,2624;15,2625,118,1370;1,1400,139;15,2626;1,2627,139;1,1408,62;1,2628,62;1,2629,78;1,2630,62;1,2631,139;15,2632;8,186,2633;15,2634;41,2635,13,2636;1,538,139;1,2637,87;12,463,524;15,2638,2639;1,2640,139;22,263,802;12,463,2641;3,2513,13,1,2642;1,2643,51;1,2644,78;8,2645,422;1,2646,2647;24,447,2648;14,2649;14,2650;19,2651;1,2652,62;1,2653,384;1,2654,7;12,463,1015;46;22,13,1732;24,815,1153;12,1502,102;12,857,480;12,29,2655;30,2656;14,2657;19,2658;13,427,118;26,2659,472;2,658,186;14,1178,585;8,2660;1,2661,139;26,1936,186,205;26,658,186;12,463,2662;12,520,875;12,1131,2663;24,27,2664;1,1779,139;14,2665;22,263,2666;19,1907;14,1210;1,2667,87;16,77,78,164,80,2668;22,127,2669;21,2670,2671,1417,2672;26,2673,2446,11;14,1767;12,447,1743;1,2674,62;30,508;8,2675;14,2676;24,383,770;1,2677,62;13,2678;1,2679,139;16,77,78,164,80,1142;15,166,2680;12,77,2323,2681;12,815,2682;14,2683;1,2684,130;27,2685;1,2686,78;11,2687;22,263,966;14,2688;19,2689;1,2690,384;8,2691;1,2692,62;15,166,13,119;15,2429;2,1936,472,11;12,447,2693;8,2694;8,2695;8,2696;12,1131,2697;15,2698;14,2699;14,2700;14,2701,700;14,2702;22,713,2703;22,710,2704;8,2705;8,2706;8,2707;6,2708,13,2709;6,2710,13,2711;6,2712,13,2713;6,2714,13,2713;6,2715,13,2716;6,2717,13,2718;3,2719,13,1,2720;12,233,53;2,1016;3,2721,13,1,2722;3,2723,13,1,2724;1,2725,139;1,2726,78;20,2727,111,2728,80,2729;1,2730,2731;12,1131,2732;1,2733,139;16,82,78,79,80,2734;22,127,2735;1,2736,2737;14,2738;14,2739;15,2740;3,2741,13,1,2742;14,2378;5,2743,13,2487;14,2744;24,77,2745;1,2746,13;36,2747;13,2748;26,2749,13,11;1,2750,51;1,1233,51;3,2751,13,1,2752;15,2753;11,2754;12,1917,2755;12,512,1906;12,1505,2756;14,1906;14,50;1,2757,7;1,2758,78;14,2759;12,336,102;22,263,2760,374,2761;42,2762,2487;1,2763,51;15,2764;27,1400;3,2765,13,1,2766;34,2767,1,2768;5,2769,13,2487;1,1003;3,2770,13,1,2771;22,263,2772;12,77,2773;11,2774;14,233;17,524,2775,549;17,524,2776,549;17,524,2777,549;22,263,954;22,713,2778;12,815,2779;19,2097;8,2780;23,2781,2782;19,2783;12,77,2784;15,2785;1,2786,51;22,127,2787;1,2788,7;47,2789;1,2790,51;14,2791;1,2792,2793;35,2794;11,2795;22,263,490;1,2796;8,2797;30,2798;8,2799;12,1002,2800;15,2801;1,2802,1363;25,588;11,2803;2,13,426,11;11,2804;12,485,2805;1,2806,7;23,2807,2808;17,524,2809;22,713,1190;14,2810;1,450,7;25,445;22,263,2811;19,2812;12,563,2813;11,1422,199,980;8,2814;8,2815;1,2816,62;22,263,2817;15,2818;24,233,2819;11,2820;12,1477,2821;25,1053;24,233,2822;1,2823,169;24,77,523;1,2824,384;1,2825,384;15,2826;1,2827,169;19,2828;1,2829,139;12,485,77;22,713,532;11,2830;22,263,2831;11,2832;16,136,78,79,80,2833;16,136,78,2834,80,781;22,713,2027;8,2835;22,713,916;12,815,771;22,263,2836;12,815,802;3,2837,13,1,2838;15,2839,2840;3,2841,13,1,2842;15,2843;14,2844;20,55,2845,2846;20,55,2847,62;1,2848,139;12,482,966;1,913,139;18,1404,2849;22,263,2850;14,2851;41,2852,13,2853;6,2854,13,2855;1,2856,51;12,2857;14,2858;27,2859;13,2860;19,2861;43,2862,1513;43,2863,2864;43,2865,2866;43,2867,2868;14,2869;13,2870;27,2871;15,1548;14,2872;24,1477,2873;19,1704;19,2805;15,1328,118;8,2874;8,2875;12,77,490;15,2876;12,815,511;1,2877,7;17,524,2878;42,2879,2487;13,2486;8,2880;19,2881;43,2882,2883;43,2884,2885;43,2886,2887;3,2888,13,1,2889;3,186,2890,1,2891;3,2892,13,1,2893;14,1051,585;1,2894,139;26,2895;2,2896,2897;14,2898;12,463,2899;1,2900,62;16,136,78,2901,80,2902;17,2903,2904,92;2,13,13,78;1,2905,169;1,2906,139;1,2907,139;12,2908;1,2909,139;1,2910,139;1,2911,130;3,2912,2913,1,2914;3,2912,2915,1,2914;3,2916,13,1,2914;8,2916;8,2912,2913;8,2912,2915;41,2917,2918,1711;12,66,516;22,263,2919;1,2920,7;1,2921,164;1,2922,7;1,2923,169;19,2924;27,2925;2,2926,186;14,2927,871;1,2928,7;22,2929,480;1,2930,139;27,2931;27,2932;8,2933;41,2934,2935,1711;41,2936,2937,1711;41,2938,13,1711;1,2939,384;1,1137,384;12,233,2940;32,2222,2941;27,2942;14,102,585;12,233,2943;8,2944;4,2945,13,1,15;37,2946,2947;1,2948,169;12,77,431;13,2949;8,2950;1,1837,78;1,2951,139;1,2952,62;21,2953,2954;12,1159,2955;12,233,870;23,2956,2957;6,2958,2959,2960;6,2961,2962,2960;17,524,2389,92;17,524,2963,92;12,463,2964;23,2025,2965;13,2966,118;1,907,139;22,792,459;15,2967;12,27,431;1,2968,13;12,233,2969;11,621,384;1,728,139;15,2970;1,2971,87;12,815,966;22,713,2972;12,233,1108;1,2973,169;1,2974,139;1,535,51;12,1131,799;12,463,2975;14,2976;12,82,2287;14,13,2977;14,2978;25,2978;29,2979;22,710,2980;1,2981,169;14,1190;30,2020;25,2086;30,2086;1,2982,139;12,1053;14,55,2983;1,2984,139;24,1131,2985;22,713,600;15,735,118,1370;2,2130,13,205;12,233,2986;21,2987,2988,126;24,233,2989;30,1701;1,2990,139;45,2991,2074,1044;24,233,482;24,577,2992;8,2993;14,2994;24,2995,2996;11,621,2997;12,520,2998;11,2999;15,166,3000;1,3001,62;1,3002,62;12,463,3003;1,3004,139;12,485,490;1,3005,139;22,713,1094;14,1462;14,1906,871;12,1365,459;14,3006;8,186,3007;8,186,3008;22,710,1015;15,3009;12,233,3010;14,510;24,55,3011;15,3012;1,160,157;21,2953,2954,1417,3013;32,166,3014;14,3015;14,13,426;26,3016,472,3017;1,3018,62;14,3019;22,263,3020;1,3021,78;3,186,3022,1,3023;16,2358,78,3024,80,3025;22,713,3026;22,263,3027;1,3028,7;11,3029;19,3030;19,3031;19,3032;19,3033;19,1918;19,3034;1,2627,51;19,986;19,3035;12,815,3036;17,524,3037,549;14,3038;11,3039,384;15,3040;16,490,384,3041;1,3042,62;22,713,859;24,563,3043;12,136,966;22,1059,1426;22,713,3044;22,713,3045;14,3045;1,842,7;22,713,1022;1,3046,51;1,3047,87;14,3048;23,1634,3049;18,1404,3050;3,3051,13,1,3052;13,3053;1,3054,7;1,3055,7;1,3056,169;1,3057,169;30,166;19,3058;15,3059;14,166;22,127,532;12,233,1015;13,3060;22,127,3061;34,3062,1,3052;34,3063,13,1,1713;34,3064,1,1713;2,3065,186;14,1426;26,3066,472,11;22,263,3067;12,815,102;8,3068;14,3069;22,3070,757;25,3071;14,3072;27,3073;14,3074;1,3075;11,3076;11,3077;22,713,3078;30,1015;14,3079;15,3080;13,3080;3,2222,13,1,3081;4,2222,13,1,3081;8,2556,3082;22,713,182;8,3083;15,3084;1,3085,62;1,3086,139;1,3087,62;41,3088,13,3089;1,3090,7;4,3091,13,1,3092;37,3093,1,3094;22,263,691;12,819;1,3095,7;1,3096;1,3097;34,3098,1,3099;14,3100;22,713,3101;1,3102,139;22,263,687;12,1365,875;14,3103;12,815,3104;22,1731,480;22,938,1918;14,3105;11,3106;14,3107;34,3108,1,3109;12,485,1178;22,263,3110;14,184;14,3111;12,512,3112;12,815,3112;14,2391,472;11,3113;30,931;22,127,3114;14,3115;37,3116,1,3117;11,3118;11,3119;30,3120;15,3121;15,3122;11,3123;12,182,490;1,3124,87;15,3125;14,3126;14,3127;16,3128,1743,13,80,3129;9,3130;9,3131;38,3131,1,3132;23,3133,3134;14,3135;1,3136,62;1,3137,7;1,3138,7;1,1120,7;1,3139,7;1,3140,62;25,3141;19,3142;37,3143,1,3144;1,3145,13;22,1059,3146;1,3147,51;1,1554,51;19,2173;22,13,3148;19,2930;1,3149,7;1,271,164;11,3150;1,1052,7;22,263,3151;1,3152,169;8,3153;3,3154,13,1,34;24,563,3155;34,3156,1,3157;18,1633,3158;2,3159,186,11;8,3160;11,3161;1,3162,139;40,3163,1,3164;13,3165,118;22,710,3166;14,3167;1,1053,157;22,263,3168;12,233,3169;14,13,3170;14,3171;1,3172,139;1,3173,139;15,3174;13,3174;22,263,3175;36,3176;14,3177;22,263,833;25,490;25,3178;14,3178;38,3179,1,3180;17,875,3181,92;12,1365,490;1,3182,51;25,3183;14,3184;1,3185,7;1,3186,7;1,3187;36,3188;36,3189;8,3190;20,3191,3192;30,511;26,2012,186;12,862,3193;13,3194;13,3195;14,3196;11,3197;22,263,3198;3,3199,13,1,3200;22,713,3201;1,3202,51;1,3203,62;16,82,78,3204,80,271;1,3205,7;16,77,78,1447,80,3206;4,3207,13,1,34;37,3208,1,34;23,3209,3210;1,3211,51;1,3212,139;25,1178;22,263,3213;19,3214;11,3215;12,562,635;14,3178,585;25,3178,270;22,127,3216;15,1999;36,3217;2,3218,217,11;13,3219;27,3220;1,3221,139;2,3222,186,205;12,485,3223;2,3224,186;4,3225,13,1,3226;16,96,78,3204,80,2418;36,3227;36,3228;34,3229,1,3230;3,3231,13,1,3230;16,77,78,1447,80,3232;12,815,3233;13,166,3234;12,485,3235;14,3236;22,713,3237;14,3238;16,233,78,2376,80,3239;22,3240;15,3241;3,3242,13,1,3243;22,710,3244;24,3245,3246;24,3247,3246;15,3248;24,3249,3250;14,3251;14,3252;25,3253;22,1336,3254;14,2204,472;15,3255;22,263,55;4,3256,13,1,3257;37,3258,1,3257;3,3259,13,1,34;1,3260,62;14,3261;14,1112;14,3262;16,96,78,3263,80,3264;1,3265,13;16,3266,78,97,80,3267;29,3268;8,3269;15,3270;22,127,1251;9,3271;3,3272,13,1,3273;19,3274;38,3275,1,3276;14,3277;22,713,3278;14,3279;22,3280,3281;1,121,139;9,3282;6,3283,3284,3285;8,3286;8,3287;13,3288;1,3289,139;12,233,3290;19,3291;27,3292;24,562,1046;15,3293;1,3294,51;1,1922,51;30,3295;1,3296,7;13,3297;19,2218;13,3298;13,3299;1,3300,139;8,3301;22,13,3302;1,3303,139;16,3304,78,3305,80,3306;22,13,521;13,3307;1,3308,13;8,3309;1,3310,157;29,3311;1,3312,169;1,3313,169;13,3314;1,3315,169;16,1680,1287,3316,80,3317;13,3318;15,3319;1,3320,139;1,3321,139;24,3322,485;15,3323;17,3324,3325,92;13,3326;13,3327;13,3328;17,524,3329,549;1,3330,139;15,3331;48,3332,1,3333;27,3334;1,2556,62;15,3335;1,3336,169;15,3337;13,3338;13,3339;13,3340;49,3341;15,3342;13,3343;19,54;19,3344;27,3345;25,3346;24,3347,3348;13,3349;15,3350;15,3351;15,3352;15,3353;13,3354;13,3355;13,3356;1,3357,139;15,3358;15,3359;13,3360;15,3361;15,3362;15,3363;13,3364;15,3365;13,3366;25,27;25,2979;13,3367;15,3368;13,3369;15,3369;13,3370;34,3371,1,3372;16,2358,78,3373,80,3374;34,3375,1,3376;34,3377,1,3376;34,3378,1,3379;50,3380,3381";
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
