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
    const htmlTemplate = [
        '<div style="background-color:beige;color:black;border:1px solid black;display:flex;font-family:sans-serif;font-size:medium;position:fixed;top:0;white-space:pre-wrap;width:100%;z-index:2147483647">',
            '<span style="flex-grow:1;padding:0.5em 0 0.5em 0.5em;">${warning}</span>\n',
            '<button style="background-color:#8880;border:0;font-size:24px;padding:0.5em;">×</button>',
        '</div>',
    ].join('');
    const domAlert = clipboardText => {
        const doc = document;
        const domAlert = extraArgs.domAlert.replace(/\\n/g, '\n');
        let html;
        if ( domAlert.includes('${text}') ) {
            const code = doc.createElement('code');
            const styles = [
                'background-color: #ddc',
                'display: inline-block',
                'font-family: monospace',
                'font-size: 100%',
                'max-height: 8em',
                'overflow: auto',
                'padding: 0.25em',
                'user-select: all',
                'width: 100%;',
                'word-break: break-all'
            ];
            if ( Boolean(extraArgs.selectable ?? true) === false ) {
                styles.push('user-select: none');
            }
            code.style = styles.join(';');
            code.textContent = clipboardText;
            html = htmlTemplate.replace('${warning}',
                domAlert.replace('${text}', code.outerHTML)
            );
        } else {
            html = htmlTemplate.replace('${warning}', domAlert);
        }
        if ( currentAlert ) { currentAlert.remove(); }
        const domParser = new DOMParser();
        const fragment = domParser.parseFromString(html, 'text/html');
        currentAlert = fragment.querySelector('div');
        const button = currentAlert.querySelector('button');
        button.addEventListener('click', ( ) => {
            if ( currentAlert === null ) { return; }
            currentAlert.remove();
            currentAlert = null;
        });
        doc.documentElement.append(currentAlert);
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
    runAt(( ) => {
        self.document.addEventListener('mousemove', installTraps, {
            once: true,
            capture: true,
        });
    }, 'interactive')
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
    const $scriptletHostnames$ = /* 13875 */ ["*","edu","j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","ok.ru","op.gg","ouo.*","oxy.*","pnd.*","qmh.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","ebay.*","edu.cn","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","ntv.cx","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rdse.*","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","app.com","arbsd.*","atv.com","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","brew.sh","bunkr.*","car.com","cbox.ws","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","crn.com","ctrlv.*","dbna.de","dciuu.*","deco.fr","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","dnj.com","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","f6s.com","fakt.pl","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mlb.com","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","ntvs.cx","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rgj.com","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vids.st","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","ymix.to","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","2tencb.*","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9mod.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","amazon.*","anigo.to","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bsky.app","bunkr.la","bunkrr.*","bzzhr.co","bzzhr.to","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","firmy.cz","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fyxxr.to","fzlink.*","g9r6.com","game8.jp","ganool.*","garaz.cz","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","index.hr","isi7.net","its.porn","j91.asia","janjua.*","javgg.me","jmanga.*","jmmv.dev","jotea.cl","kagane.*","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kick.com","kimi.com","kizi.com","kloo.com","km77.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","live.com","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","miruro.*","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mlsbd.co","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","n.fcd.su","ncaa.com","net77.cc","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","scmp.com","seeeed.*","senda.pl","senpa.io","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","sj-r.com","slant.co","sms24.me","so1.asia","splay.id","sport.de","sport.es","spox.com","sptfy.be","stern.de","stfly.me","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","turbo.cr","turbo.fr","tv.wp.pl","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","wykop.pl","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yacht.de","yandex.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zovo.ink","zshort.*","0vg9r.com","10.com.au","10short.*","123av.com","123link.*","123mf9.my","127.0.0.1","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9-gld.net","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","aagmaal.*","abcya.com","acortar.*","adcorto.*","adobe.com","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ameblo.jp","ampav.com","andyday.*","anidl.org","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","apple.com","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","azure.com","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","canva.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chess.com","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","claude.ai","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","dom.wp.pl","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","dzapk.com","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","europix.*","evaki.fun","evo.co.uk","exego.app","expres.cz","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fbsbx.com","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","gitea.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.ml","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gry.wp.pl","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","jasmr.net","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javsub.my","javup.org","javwide.*","javxxx.me","jkanime.*","job.mt.de","job.nw.de","jootc.com","kagane.to","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lecker.de","legia.net","lenkino.*","lep.co.uk","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","localhost","lodynet.*","lohud.com","lookcam.*","lootup.me","los40.com","m.kuku.lu","m1xdrop.*","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mgread.io","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","noxx.to>>","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","proton.me","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rfiql.com","ridge.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rophimz.*","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","sat24.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","stly.link","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","sulasok.*","swame.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","themw.com","thesun.ie","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tubev.sex","tubexo.tv","tukoz.com","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","twitch.tv","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upbolt.to","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqload.co","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vidbox.vc","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidneo.cc","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vipurl.in","vladan.fr","vnuki.net","voodc.com","vplink.in","vsembed.*","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","webex.com","webmaal.*","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","www.wp.pl","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xca.cymru","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yahoo.com","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zokaj.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9anime.vip","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","alphatv.gr","amboss.com","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","avtub.cx>>","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","balbums.st","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdjobs.com","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","caller.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","capital.fr","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chad.co.uk","chiefs.com","chrome.com","ciberdvd.*","cimanow.cc","cinehd.app","cinemar.cc","cityam.com","citynow.it","ckxsfm.com","claude.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","costco.com","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cuttty.com","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drakkar.st","drivebot.*","driveup.in","driving.ca","drphil.com","ds.163.com","dtmaga.com","dvm360.com","dz4up1.com","eadt.co.uk","earncash.*","earnload.*","easysky.in","ebc.com.br","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fastly.net","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","filester.*","film.wp.pl","film1k.com","film4e.com","filmi7.net","filmo.to>>","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gamezop.io","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gentside.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","github.com","gitlab.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","goerie.com","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hochi.news","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","huavod.com","huavod.net","huavod.top","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indoav.app","indoav.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","kaamuu.cfd","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","kickbd.org","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","labgame.io","lacrima.jp","larazon.es","lasisa.net","ldnews.com","leakav.com","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","mdplay.top","medibok.se","megadb.net","megadede.*","megaflix.*","megalink.*","megaup.net","megaxh.com","meltol.net","meong.club","merinfo.se","meteox.com","mhdtvmax.*","miixdrop.*","milfzr.com","mistral.ai","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","moto.wp.pl","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mpnnow.com","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","napmap.net","natalie.mu","natfrp.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","ninguno.cc","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pidlio.com","pilsner.nu","pingit.com","pinkun.com","pirlotv.mx","pitube.net","pixelio.de","pixvid.org","pjstar.com","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","plejada.pl","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","ptztv.live","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","reddit.com","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rrstar.com","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","salina.com","samash.com","sanblo.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skinmc.net","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sohot.cyou","sokobj.com","solewe.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","stripe.com","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpalm.com","tcpvpn.com","tech.wp.pl","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiktok.com","tiscali.it","tmnews.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vcloud.lol","vcstar.com","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidbox.dev","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduro.top","viduyy.com","viewfr.com","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vscode.dev","vstream.id","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","worder.cat","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xprivo.com","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ystream.id","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4pornhd.com","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","and-more.co","andiim3.com","anibatch.me","anichin.top","anigogo.net","anihq.org>>","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniwixi.xyz","aniworld.to","anomize.xyz","anonymz.com","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arakpop.net","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","axomtube.in","ayatoon.com","azmath.info","azmovies.to","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blavity.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","braflix.win","brbeast.com","brbushare.*","brigitte.de","bristan.com","browser.lol","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civicxi.com","civitai.com","civitai.red","claimrbx.gg","clapway.com","clkmein.com","cloubix.com","cloudfam.io","club386.com","cocorip.net","coinclix.co","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","criczop.com","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","daily.co.jp","dailyweb.pl","damitv.live","daozoid.com","ddlvalley.*","decider.com","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dlstreams.*","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dstat.space","dsvplay.com","duboku.info","dudefilms.*","dz4link.com","dziennik.pl","e-glossa.it","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","edp24.co.uk","eductin.com","einthusan.*","elahmad.com","embasic.pro","embedhd.org","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f51rm.com>>","facet.wp.pl","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstream.is","fbstreams.*","fchopin.net","feedzop.com","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filmcdn.top","filmez.club","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","fosters.com","foumovies.*","foxtube.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamedrive.*","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","genpick.app","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","glianec.com","globetv.app","go.fakta.id","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gumtree.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hornyhill.*","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","htrnews.com","htsport.org","huaren.live","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","igorslab.de","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","irunfar.com","isaimini.ca","isosite.org","ispunlock.*","itavisen.no","itpro.co.uk","itudong.com","iv-soft.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbobo.com","javboys.com","javcock.com","javdock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jkanime.net","jnovels.com","jobnoid.net","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","kaembed.net","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","kumaraw.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lichess.org","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","mandiner.hu","manga1000.*","manga1001.*","mangahub.io","mangasail.*","mangatv.net","mangayy.org","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miiixdrop.*","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","motphimr.io","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mozilla.org","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrexcel.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onlyfans.to","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","pokopow.com","polygon.com","pomorska.pl","pooembed.eu","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","quizzop.com","radamel.icu","raiders.com","rainanime.*","rakuten.com","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","realbbc.xyz","redding.com","redgifs.com","redlion.net","redporno.cz","redtub.live","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","rogoyume.jp","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rubystm.com","rubyvid.com","rugby365.fr","rule34h.com","runmods.com","rvguide.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sctimes.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smarturl.it","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sonyliv.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spotify.com","spycock.com","srcimdb.com","sreality.cz","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamgg.net","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamix.so","streamm4u.*","streamup.ws","strikeout.*","strp2p.site","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","swtimes.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","thapcam.net","thaript.com","the-sun.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","timeful.app","titantv.com","titulky.com","tmailor.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","tukoz.com>>","tunebat.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uticaod.com","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","veronica.uk","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidavra.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidnest.fun","vidshar.org","vidshare.tv","vidspeed.cc","vidsrcme.ru","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipshort.in","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webtoon.xyz","weerslag.nl","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wideo.wp.pl","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xbokeps.com","xcandid.vip","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","yurn.online","zedporn.com","zeilink.net","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1primewire.*","2017tube.com","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","398fitus.com","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","5moviess.com","720pstream.*","7hitmovies.*","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","afrotech.com","airflix1.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amarillo.com","amateur8.com","amestrib.com","amnaymag.com","amtil.com.au","androidaba.*","anhdep24.com","animalia.bio","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animelok.xyz","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninami.site","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","anonmp4.help","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apnablogs.in","app.vaia.com","apps2app.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","astrozop.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","bike-news.jp","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","brainzaps.tv","brawlify.com","bright-b.com","brobokep.org","bronco6g.com","bsmaurya.com","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","bysebuho.com","bysekoze.com","bysewihe.com","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camaro7g.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","cataz.stream","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","cdn.vifey.de","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","cjonline.com","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","codeberg.org","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","daotekno.com","darkibox.com","datacheap.io","datanodes.to","datawav.club","dawntube.com","ddlvalley.me","deadline.com","deadspin.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","dispatch.com","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","doodstream.*","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","dredyson.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","euronews.com","eurostream.*","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","facebook.com","factable.com","fairyhorn.cc","faiviral.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmifen.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","fxpornhd.com","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gekkonen.net","gelbooru.com","gentside.com","gerbeaud.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","greekfun.net","grigtube.com","grosnews.com","gseagles.com","gsmarena.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","hanime24.com","harbigol.com","hbnews24.com","hbrfrance.fr","hcaptcha.com","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaicube.*","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","heqviral.com","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hispajav.com","hivetoon.com","hktvmall.com","hmanga.world","hometalk.com","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indian-tv.cz","indianxxx.us","indystar.com","infodani.net","infofuge.com","informer.com","instamod.app","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.cc","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jconline.com","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","knoxnews.com","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","lineup11.net","linfoweb.com","linkedin.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","looopings.nl","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakita.id","mangakoma.ac","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masahub2.com","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","miixdrop.net","mikohub.blog","milftoon.xxx","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkvcinemas.*","mlbstream.tv","mmsbee27.com","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momon-ga.com","momspost.com","momxxx.video","monaco.co.il","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsammo.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","niganpro.com","nilesoft.org","niu-pack.com","niyaniya.moe","njherald.com","nkunorse.com","nonktube.com","nosubapp.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","of-model.com","oimsmosy.fun","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","ondebola.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opinie.wp.pl","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pal-item.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pcgamesn.com","pdfindir.net","peachify.top","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","petguide.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.1188.lv","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playmogo.com","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","pogoda.wp.pl","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","porn4fans.me","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornobae.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","proxyorb.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranger5g.com","ranger6g.com","ranjeet.best","rapelust.com","rarepike.com","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","rome2rio.com","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","scotsman.com","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","starcima.com","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","supramkv.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tacoma4g.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","telegram.com","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","thecomet.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thesun.co.uk","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tieulam.info","tigernet.com","tik-tok.porn","timestamp.fr","tinypass.com","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokuzl.net>>","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","traingon.top","trendyol.com","tresdaos.com","trustnet.com","truthnews.de","truyenvn.dev","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv3monde.com","tvappapk.com","tvasports.ca","tvdigital.de","tvnow247.top","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","udoyoshi.com","ugreen.autos","uhdwalls.com","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umogames.com","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","uploadvr.com","upshrink.com","uptomega.net","ur-files.com","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","utsports.com","uur-tech.net","uwatchfree.*","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vijviral.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vivasexe.com","vocalley.com","voirseries.*","volokit2.com","voznovel.com","vr.pornhat.*","walftech.com","warddogs.com","warezcdn.lat","wargamer.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","weerplaza.nl","westword.com","whatgame.xyz","whatsapp.com","whyvpn.my.id","wikifeet.com","wikirise.com","wildsnow.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhamster46.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxpicss.com","xxxputas.net","xxxshake.com","xxxstream.me","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zpserver.com","zvision.link","zxcprime.icu","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","4runner6g.com","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","aha-music.com","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","aniworld.to>>","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","archive.today","archivebate.*","archlinux.org","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoembed.app","autoextrem.de","autofrage.net","autoguide.com","autoscout24.*","autosport.com","autotrader.nl","avnsgames.com","avpgalaxy.net","azcentral.com","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bikerumor.com","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bitwarden.com","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","buienalarm.be","buienalarm.nl","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canlikolik.my","cantonrep.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.com","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chieftain.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","cotemaison.fr","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cuisineaz.com","cumlouder.com","cuttlinks.com","cybermania.ws","cyklobazar.cz","daddylive.*>>","daddylivehd.*","dailymail.com","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","daveockop.com","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desertsun.com","desifakes.com","desijugar.net","desimmshd.com","devsoftwr.com","dfilmizle.com","dic.pixiv.net","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.*>>","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedseek.xyz","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","ev3forums.com","exe-links.com","expansion.com","extratipp.com","f150gen14.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fbstream.is>>","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","finanse.wp.pl","findheman.com","firescans.xyz","firestream.to","firmwarex.net","firstpost.com","fitness.wp.pl","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","galesburg.com","gamearter.com","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesider.com","gamesite.info","gamesmain.xyz","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","goupstate.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","guessthe.game","gutefrage.net","gutekueche.at","gwiazdy.wp.pl","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hamhigh.co.uk","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaicop.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","hertsad.co.uk","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hikvision.com","hilites.today","hillsdale.net","hindimovies.*","hindinest.com","hindishri.com","hindisink.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hostzteam.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hutchnews.com","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgouskel.sbs","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itdmusicy.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.com","javhdporn.net","javleaked.com","javmobile.net","javplayer.com","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jlaforums.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanald.com.tr","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","kitsapsun.com","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksiazki.wp.pl","ksusports.com","kuchnia.wp.pl","kumascans.com","kupiiline.com","kurashiru.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkshortx.in","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-tube.me","manga18fx.com","mangabats.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","massgrave.dev","math-aids.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maxegatos.net","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memedroid.com","menshealth.de","metalflirt.de","meteocity.com","meteopool.org","meteovista.be","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","microsoft.com","miiixdrop.net","milfnut.com>>","minhatela.xyz","miohentai.com","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morencius.com","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtvuutiset.fi","multicanais.*","musicsite.biz","musikradar.de","mustang6g.com","mustang7g.com","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakastream.tv","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","nelomanga.net","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newportri.com","newschief.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","nlcosplay.com","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nupload.top>>","nuviatoon.com","nvimfreak.com","nwemail.co.uk","nwusports.com","oakridger.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","oklahoman.com","onemanhua.com","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","openlua.cloud","openrouter.ai","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","phimfun.net>>","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","pinterest.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","plattformj.ch","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primewire.*>>","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","rakuten.co.jp","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","recaptcha.net","rechtslupe.de","recordnet.com","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","selfhostt.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortnest.com","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spotsaver.net","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startseite.to","statesman.com","ster-blog.xyz","stereogum.com","stock-rom.com","str8ongay.com","stre4mpay.one","stream-69.com","stream4free.*","streambtw.com","streamcash.to","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.dev","streamvid.net","strefaagro.pl","stripecdn.com","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","talksport.com","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techybuff.com","techyrick.com","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","theintell.com","thejournal.ie","thelayoff.com","theledger.com","thememypc.net","thenation.com","thespruce.com","thestar.co.uk","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","trilltrill.jp","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","twitchcdn.net","twojeip.wp.pl","twstalker.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vpzserver.com","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weeronline.nl","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","whtimes.co.uk","widewifes.com","wikipedia.org","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","wordshake.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","bergwelten.com","best18porn.com","bestofarea.com","betaseries.com","bgmiesports.in","bharian.com.my","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btvnovinite.bg","buccaneers.com","buchstaben.com","businessua.com","bustmonkey.com","bustybloom.com","bysefujedu.com","bysejikuar.com","byseqekaho.com","byseraguci.com","bysesukior.com","bysetayico.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","cg-gamespc.net","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","christitus.com","cincinnati.com","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudhostt.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","cpu-monkey.com","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","croq-kilos.com","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","daddylive.link","dafreeporn.com","dagensnytt.com","daily-jeff.com","dailycomet.com","dailylocal.com","dailyworld.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","donegallive.ie","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ebooksyard.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elaoffcial.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","elnacional.cat","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","euronews.com>>","eveningsun.com","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","faitsfizzle.fr","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmifen.com>>","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-4u3omzw0.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gearjunkie.com","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gisvacancy.com","gknutshell.com","gloryshole.com","gobearcats.com","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","growgritly.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heraldnews.com","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","horoskop.wp.pl","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","houmatoday.com","howtocivil.com","hpaudiobooks.*","huggingface.co","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","in-cumbria.com","inbbotlist.com","indeonline.com","indi-share.com","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itechfever.com","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksonsun.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kongregate.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","lcsun-news.com","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lenconnect.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","macheforum.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marionstar.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","merkmal-biz.jp","meteologix.com","mewingzone.com","miiiixdrop.net","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modapkfile.com","moddedguru.com","modenatoday.it","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","monroenews.com","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorcycle.com","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mprogaming.com","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naplesnews.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","news-press.com","newsbreak24.de","newscard24.com","newsherald.com","newsleader.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","packhacker.com","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pekintimes.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","pemersatu.link","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pinterpoin.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","play.xpass.top","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polsatsport.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","powershell.org","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","printables.com","proapkdown.com","pruefernavi.de","purediablo.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","puzzleship.com","queerdiary.com","querofilmehd.*","questloops.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","ravenscans.com","rbxscripts.net","rcostation.xyz","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaishd.*","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shelbystar.com","shemalesin.com","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","siusalukis.com","skat-karten.de","slickdeals.net","slidesaver.app","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","straemplay.org","stream2watch.*","streamdesi.com","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techcrunch.com","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","teleshow.wp.pl","telesrbija.com","temp.modpro.co","tennessean.com","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","the-leader.com","the-review.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thegleaner.com","thehesgoal.com","theinertia.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","tradingref.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidquickly.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","virustotal.com","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vscode-cdn.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wawalove.wp.pl","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","wigantoday.net","willyweather.*","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","0123movie.space","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","abyssplayer.com","adhs-zentrum.de","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","allclassic.porn","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","argusleader.com","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","autoshieldd.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestensuree.com","bestialporn.com","bestjavporn.com","beurettekeh.com","bgmateriali.com","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-magazin.de","bike-urious.com","bintangplus.com","biologianet.com","bizjournals.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","burytimes.co.uk","buzzheavier.com","caminteresse.fr","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","celticway.co.uk","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cheezburger.com","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","convertcase.net","coromon.wiki.gg","cosplaynsfw.xyz","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailyrecord.com","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","decomaniacos.es","definitions.net","delmarvanow.com","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","detroitnews.com","deutschsex.mobi","devonlife.co.uk","dhankasamaj.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","echo-news.co.uk","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedplayer.xyz","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","farminglife.com","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fayobserver.com","fcportables.com","fdlreporter.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","fifetoday.co.uk","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fitpractise.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","flywareagle.com","fmradiofree.com","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","ftsefutures.org","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gainesville.com","game.digitap.eu","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","gosanangelo.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","guidetechly.com","gut-erklaert.de","hacksnation.com","halohangout.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiocean.com","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hokiesports.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","huntspost.co.uk","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","inyatrust.co.in","iptvjournal.com","irvinetimes.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","jokerscores.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","kent-life.co.uk","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","leakgallery.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkvertise.com","linux-talks.com","live.arynews.tv","livescience.com","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","londonworld.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","mais.sbt.com.br","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","miiiiixdrop.net","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modelviewer.lol","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","myanimelist.net","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","nemzetisport.hu","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nissanzclub.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","northjersey.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","okiemrolnika.pl","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","paste4free.site","pawastreams.org","pawastreams.pro","pcgameszone.com","pdftoshokan.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phillyburbs.com","phonerotica.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","polenjournal.de","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radio-norge.org","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","ramdomlives.com","rangerboard.com","ravennatoday.it","rctechsworld.in","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","rule34video.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.org","santhoshrcf.com","savannahnow.com","savealoonie.com","scan-hentai.net","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","slateforums.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","ssdhostting.com","starcourier.com","stargazette.com","starstreams.pro","start-to-run.be","staugustine.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sulasokvids.net","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tallahassee.com","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","taycanforum.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","thenewsstar.com","theprovince.com","thereporter.com","thespectrum.com","thestreameast.*","theterrace.scot","thetoneking.com","thetowntalk.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","timesonline.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokuzilla.net>>","tokyomotion.com","tokyomotion.net","tophostdeal.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","travelnoire.com","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","truyenhentaiz.*","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","turystyka.wp.pl","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","uppercutmma.com","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","verywellfit.com","vfxdownload.net","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","wealthcatal.com","web.epalovo.com","webmatrices.com","webtoonscan.com","wegotcookies.co","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","world-iptv.club","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xterraforum.com","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yandexcloud.net","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","aberdeennews.com","about-drinks.com","account.bhvr.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adonisfansub.com","adult-empire.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","antiphishing.biz","aopathletics.org","apkandroidhub.in","app.khaddavi.net","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianimage.co.uk","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","augustacrime.com","autotrader.co.uk","avellinotoday.it","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","bangyourwife.com","barrheadnews.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","beta.plus.rtl.de","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","blueridgenow.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","book.trivago.com","booksbybunny.com","boolwowgirls.com","boote-magazin.de","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","bristolworld.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","bysedikamoum.com","bysesayeveum.com","call2friends.com","cambstimes.co.uk","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","capecodtimes.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courierpress.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofaucet.xyz","cryptojunkie.net","cryptomonitor.in","culturequizz.com","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","dakotaforums.com","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","derbyworld.co.uk","derryjournal.com","designparty.sx>>","desikamababa.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","divicast.watch>>","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","dudleynews.co.uk","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","explorersweb.com","fallbrook247.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","femmeactuelle.fr","fernsehserien.de","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","financeehelp.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","floridatoday.com","footwearnews.com","footymercato.com","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","gadsdentimes.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreegames.net","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","glasgowworld.com","globelempire.com","go.discovery.com","go.gociwidey.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","harpersbazaar.fr","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hemeltoday.co.uk","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hometalkpaid.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","infinityfree.com","infomatricula.pt","inprogrammer.com","intelligencer.ca","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jacksonville.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","journalduweb.org","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kawaii-anime.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","leaderlive.co.uk","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linkneverdie.net","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","lk21official.*>>","logofootball.net","london-now.co.uk","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","lutontoday.co.uk","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","mangakuri.online","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-cccdoz45.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","meteoradar.co.uk","metin2alerts.com","milanreports.com","milfxxxpussy.com","milkporntube.com","misterdonghua.in","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsletter.co.uk","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nikkansports.com","nintendolife.com","nl.hardware.info","nocsummer.com.br","nontonhentai.net","norfolkmag.co.uk","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","nwfdailynews.com","officecoach24.de","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineathens.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","outlook.live.com","overtakefans.com","oxfordmail.co.uk","ozbargain.com.au","pagalworld.video","pandaatlanta.com","pandafreegames.*","paradoxscans.com","parentcircle.com","parking-map.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","petoskeynews.com","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pilotsglobal.com","pinsexygirls.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","poconorecord.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","portsmouth.co.uk","post-gazette.com","postcrescent.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","printedwaste.com","privacy-mgmt.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-danmark.dk","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reporternews.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","rivianforums.com","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","scoutevforum.com","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","seriesflixhd.*>>","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sites.google.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sports.yahoo.com","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stalowemiasto.pl","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","suffolkmag.co.uk","sukidesuost.info","sunshine-live.de","supremebabes.com","sussexlife.co.uk","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","tatsumi-crew.net","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenational.scot","thenerdstash.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thestarpress.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tipsenweetjes.nl","tires.costco.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","trucosonline.com","truetrophies.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unfriend-app.com","unionpayintl.com","uniquestream.net","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeur-house.org","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vvdailypress.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","wearevoice.co.uk","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","woodmagazine.com","word-grabber.com","workxvacation.jp","worldhistory.org","worldjournal.com","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xvideos-full.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","3addedminutes.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","adrenaline.com.br","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","ayradvertiser.com","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","beaconjournal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","bryantenunder.com","bucksherald.co.uk","burymercury.co.uk","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","carensureplan.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","cheboygannews.com","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citizen-times.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","clarionledger.com","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cool-style.com.tw","coolmath4kids.com","coolmathgames.com","costcoinsider.com","countypress.co.uk","countytimes.co.uk","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","cumbrialife.co.uk","curiosidadtop.com","daemon-hentai.com","dailyamerican.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtbikerider.com","dirtyindianporn.*","dissmercury.co.uk","doctor-groups.com","dodi-repacks.site","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","ealingtimes.co.uk","earninginwork.com","easyjapanesee.com","easyvidplayer.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.net","elamigosgamez.com","elamigosgamez.net","elystandard.co.uk","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","fileditchfiles.me","financefernly.com","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","fitnakedgirls.com","fitnessplanss.com","flight-report.com","floridagators.com","foguinhogames.net","foodtalkdaily.com","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","free-wargamer.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gastongazette.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","googleapis.com.de","googleapis.com.do","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","harrowtimes.co.uk","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","heraldtribune.com","herefordtimes.com","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","hyperosthemes.org","iedprivatedqu.com","igniteseurope.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","integraforums.com","ipswichstar.co.uk","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","ithacajournal.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxworld.com","jardiner-malin.fr","jeechallenger.com","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lecanalauditif.ca","lectormangass.net","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lheritierblog.com","libertestreamvf.*","limerickleader.ie","limontorrents.com","line-stickers.com","link.snipcash.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","liverpoolworld.uk","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lubbockonline.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","macanevowners.com","madhentaitube.com","malaysiastock.biz","mangakakalove.com","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","meltontimes.co.uk","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","nationalworld.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","newryreporter.com","newsandstar.co.uk","newsshopper.co.uk","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","patriotledger.com","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","player.kinoton.cc","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","playstreaming.win","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","pressconnects.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","rancheroforum.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","redesigndaily.com","registerguard.com","reloadedsteam.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","rhyljournal.co.uk","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","steam-repacks.net","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","superflixapi.best","surreycomet.co.uk","surreyworld.co.uk","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","the-gazette.co.uk","theadvertiser.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","theresident.co.uk","thermoprzepisy.pl","thesprucepets.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","times-gazette.com","timesnowhindi.com","timesreporter.com","timestelegram.com","tippsundtricks.co","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","walesfarmer.co.uk","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","bedfordtoday.co.uk","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","birminghamworld.uk","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","bridportnews.co.uk","burnleyexpress.net","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cayenneevforum.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","cheshirelife.co.uk","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","climaaovivo.com.br","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","consejosytrucos.co","contractpharma.com","cornwalllife.co.uk","cotswoldlife.co.uk","couponscorpion.com","cr7-soccer.store>>","cravenherald.co.uk","creditcardrush.com","crimsonscrolls.net","crm.urlwebsite.com","cronachedibirra.it","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dawgpounddaily.com","dcdirtylaundry.com","delawareonline.com","denverpioneers.com","depressionhurts.us","derehamtimes.co.uk","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dramathical.stream","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","enterprisenews.com","ericeastweight.com","essexlifemag.co.uk","eugenemakedraw.com","evdeingilizcem.com","eveningtimes.co.uk","eveningtribune.com","exactlyhowlong.com","expressandstar.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","favoyeurtube.net>>","fightingillini.com","financialjuice.com","fireflix.pages.dev","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gazette-news.co.uk","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","glasgowtimes.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","guessthemovie.name","guessthephrase.xyz","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","heraldseries.co.uk","hibsobserver.co.uk","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jeepreconforum.com","jemontremabite.com","jeux.meteocity.com","johnfullwonder.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","juliewomanwish.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","keighleynews.co.uk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kilburntimes.co.uk","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","legiongamesgod.com","leighjournal.co.uk","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lincolncourier.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","lyricsongation.com","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mcdonoughvoice.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","melaterevancha.com","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","miltonkeynes.co.uk","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newarkadvocate.com","newcastleworld.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","omnicalculator.com","onemileatatime.com","onepunch-manga.com","onetimethrough.com","onlineradiobox.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passeportsante.net","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penarthtimes.co.uk","penisbuyutucum.net","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","progress-index.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radio-hrvatska.com","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","record-courier.com","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporter-times.com","reporterherald.com","resultadostris.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","royston-crow.co.uk","ryanagoinvolve.com","sabornutritivo.com","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seacoastonline.com","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","sheboyganpress.com","shemaletoonsex.com","shieldsgazette.com","shipseducation.com","shrivardhantech.in","shropshirestar.com","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","sooeveningnews.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sports-arena.space","sportstohfa.online","stapewithadblock.*","starnewsonline.com","sthelensstar.co.uk","stirlingnews.co.uk","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","sturgisjournal.com","sunderlandecho.com","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tauntongazette.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","thecalifornian.com","thecelticbhoys.com","theendlessmeal.com","thefirearmblog.com","thegardnernews.com","thegoldendaily.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thetimesherald.com","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-series.co.uk","times-standard.com","timesandstar.co.uk","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tuscaloosanews.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldofpcgames.com","worldstreams.click","wormser-zeitung.de","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","alloaadvertiser.com","allporncartoons.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","ardrossanherald.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","bluemediadownload.*","bordertelegraph.com","bracknellnews.co.uk","brentwoodlive.co.uk","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","clydebankpost.co.uk","collegeteentube.com","columbiacougars.com","columbiatribune.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","courier-journal.com","crackedsoftware.biz","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","dailycommercial.com","dailyjobposting.xyz","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","embed.tmp-url.pro>>","en-thunderscans.com","erotic-beauties.com","eveningnews24.co.uk","eventiavversinews.*","expresskaszubski.pl","fakenhamtimes.co.uk","falkirkherald.co.uk","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.dailymail.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","gazetteherald.co.uk","gazetteseries.co.uk","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","halesowennews.co.uk","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","heraldmailmedia.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","hollandsentinel.com","home-xxx-videos.com","horseshoeheroes.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ianrequireadult.com","ilbolerodiravel.org","ilforumdeibrutti.is","ilkleygazette.co.uk","independentmail.com","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","jessicaclearout.com","joguinhosgratis.com","journalstandard.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kingjamesgospel.com","kingsofkauffman.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","lindalastattack.com","livetv.moviebite.cc","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","m.jobinmeghalaya.in","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","miamiairportcam.com","miamibeachradio.com","midweekherald.co.uk","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minutemirror.com.pk","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","multicanaistt.space","mycentraljersey.com","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","norwichbulletin.com","noticiascripto.site","nottinghamworld.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","octavestreaming.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","pcgamebenchmark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornosubtitula2.com","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radio-australia.org","radio-osterreich.at","radiosantaclaus.com","radiotormentamx.com","rangersreview.co.uk","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","shreveporttimes.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somerset-life.co.uk","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","southcoasttoday.com","spa.center.ivof.com","sportitalialive.com","sportowefakty.wp.pl","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamcasthub.store","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","theboltonnews.co.uk","thecrazytourist.com","thedailyjournal.com","theglobeandmail.com","themehospital.co.uk","thenorthwestern.com","theoaklandpress.com","therecordherald.com","thesaltysoldier.com","thesimsresource.com","thesmokingcuban.com","thetorquereport.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","timesrecordnews.com","timmaybealready.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","urbandictionary.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vickisaveworker.com","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","wearesunderland.com","webhostingoffer.org","weneverbeenfree.com","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","witneygazette.co.uk","woffordterriers.com","worcesternews.co.uk","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yeovilexpress.co.uk","yorkshirelife.co.uk","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidauthority.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","augustachronicle.com","ayobelajarbareng.com","ayrshire-today.co.uk","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","birmingham-now.co.uk","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","boxofficebusiness.in","br.nacaodamusica.com","broncosportforum.com","browardpalmbeach.com","bucksfreepress.co.uk","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","captcha-delivery.com","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","centralfifetimes.com","charlestoughrace.com","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","commercialappeal.com","consiglietrucchi.com","coolmath4parents.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","cumnockchronicle.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","derbyshirelife.co.uk","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","dorsetmagazine.co.uk","downloadfilm.website","dunfermlinepress.com","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","eveshamjournal.co.uk","exmouthjournal.co.uk","extremereportbot.com","fairforexbrokers.com","falmouthpacket.co.uk","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fitbook-magazine.com","fle-5r8dchma-moo.com","football-ukraine.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-4urg44yg.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greenvilleonline.com","griffinathletics.com","hackingwithreact.com","hackneygazette.co.uk","halifaxcourier.co.uk","hampshire-life.co.uk","harboroughmail.co.uk","hartlepoolmail.co.uk","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heartsstandard.co.uk","heresyoursavings.com","hexham-courant.co.uk","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homehobbiesdaily.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","ilfordrecorder.co.uk","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","irresistiblepets.net","italiadascoprire.net","itpassportgokaku.com","jemontremonminou.com","jessicayeahcatch.com","jlwranglerforums.com","johnbeyondnation.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","lacronicabadajoz.com","lancashirelife.co.uk","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveonlinesports.net","loriwithinfamily.com","lostcoastoutpost.com","luxurydreamhomes.net","main.sportswordz.com","malverngazette.co.uk","mangcapquangvnpt.com","maps.blitzortung.org","maryspecialwatch.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","milforddailynews.com","milfordmercury.co.uk","mkvmoviespoint.autos","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","newhamrecorder.co.uk","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","northernfarmer.co.uk","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","oraridiapertura24.it","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","peeblesshirenews.com","pesprofessionals.com","petbook-magazine.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","readcomicsonline.lol","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","salamanca24horas.com","sanadegreecollege.in","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","sexypornpictures.org","sidmouthherald.co.uk","sloughobserver.co.uk","socialmediagirls.com","socket.pearsoned.com","solomaxlevelnewbie.*","southbendtribune.com","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","statesmanjournal.com","steamunderground.net","stevenfamilyedge.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","sudburymercury.co.uk","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","switchbacktravel.com","tainguyenmienphi.com","tasteandtellblog.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","the-daily-record.com","thedailyreporter.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","theleafchronicle.com","theoldhamtimes.co.uk","thepublicopinion.com","thescottishsun.co.uk","thesimplifydaily.com","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totallysnookered.com","totalsportek1000.com","toyoheadquarters.com","tracylocalschool.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","unblockedgames.world","underground.tboys.ro","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchsuitsonline.net","watchtheofficetv.com","weekendletters.store","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitehavennews.co.uk","wife-home-videos.com","wiltshiretimes.co.uk","wirtualnynowydwor.pl","worldgirlsportal.com","www.digitalocean.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banburyguardian.co.uk","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","cantondailyledger.com","celebritydeeplink.com","charlessheimprove.com","chesterstandard.co.uk","collinsdictionary.com","comentariodetexto.com","community-scripts.org","conselhosetruques.com","coolmath4teachers.com","cotswoldjournal.co.uk","courierpostonline.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","daventryexpress.co.uk","davescomputertips.com","derbyshiretimes.co.uk","desitab69.sextgem.com","desmoinesregister.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","dunmowbroadcast.co.uk","easyworldbusiness.com","elcriticodelatele.com","electricalstudent.com","ellwoodcityledger.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","essexcountynews.co.uk","exchangeandmart.co.uk","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-nv2xl8an.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","forestryjournal.co.uk","free-3dtextureshd.com","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freepressseries.co.uk","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greatfallstribune.com","greenwichmeantime.com","guardian-series.co.uk","hackedonlinegames.com","halsteadgazette.co.uk","heraldtimesonline.com","hersfelder-zeitung.de","higherorlowergame.com","hillingdontimes.co.uk","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","impartialreporter.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","jessicachoosemake.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","ledburyreporter.co.uk","lesbianfantasyxxx.com","lincolnshireworld.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","mavericktruckclub.com","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nationalgeographic.fr","netsentertainment.net","niederschlagsradar.de","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcmap.place.naver.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","petersfieldpost.co.uk","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","providencejournal.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","romfordrecorder.co.uk","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scotlandrugbynews.com","scriptgrowagarden.com","scrubson.blogspot.com","scrumpoker-online.org","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","southsideshowdown.com","southwalesargus.co.uk","southwestfarmer.co.uk","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stourbridgenews.co.uk","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","techbook-magazine.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","thenews-messenger.com","thenorthernecho.co.uk","theprofoundreport.com","thesavvyexplorers.com","thetruthaboutcars.com","thewebsitesbridge.com","thisiswiltshire.co.uk","thurrockgazette.co.uk","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","visaliatimesdelta.com","voyeur-pornvideos.com","walterprettytheir.com","warwickshireworld.com","watch-movies.com.pk>>","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","watfordobserver.co.uk","wausaudailyherald.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","wisbechstandard.co.uk","worksopguardian.co.uk","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","anguscountyworld.co.uk","appstore-discounts.com","arbitrarydecisions.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","bicesteradvertiser.net","biggleswadetoday.co.uk","blackamateursnaked.com","blackpoolgazette.co.uk","borehamwoodtimes.co.uk","brunettedeepthroat.com","buxtonadvertiser.co.uk","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","caseyimpactstation.com","celebritymovieblog.com","chillicothegazette.com","clixwarez.blogspot.com","cloudorchestranova.com","comandotorrentshds.org","conceptoweb-studio.com","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewsburyreporter.co.uk","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","eastlothiancourier.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","f150lightningforum.com","fantasticyoungporn.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","garylargeavailable.com","gazetteandherald.co.uk","gdl.freegogpcgames.xyz","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","greatbritishlife.co.uk","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","hucknalldispatch.co.uk","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","internetradio-horen.de","irasutoya.blogspot.com","islingtongazette.co.uk","jacquieetmicheltv2.net","jeepgladiatorforum.com","jessicaglassauthor.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","living-magazines.co.uk","livingincebuforums.com","llanfairpwllgwyngy.com","lonestarconference.org","lowestoftjournal.co.uk","ludlowadvertiser.co.uk","m.bloggingguidance.com","marissasharecareer.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","metrowestdailynews.com","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","news-journalonline.com","nicolehappyoutside.com","nilopolisonline.com.br","northamptonchron.co.uk","northnorfolknews.co.uk","obutecodanet.ig.com.br","oeffnungszeitenbuch.de","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","osint-info.netlify.app","paginadanoticia.com.br","palmbeachdailynews.com","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","pontiacdailyleader.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","readingchronicle.co.uk","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","southendstandard.co.uk","stornowaygazette.co.uk","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thewestonmercury.co.uk","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universityequality.com","wakefieldexpress.co.uk","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","westerntelegraph.co.uk","whitchurchherald.co.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","andoveradvertiser.co.uk","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","battlecreekenquirer.com","bestbondagevideos.com>>","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","bridgwatermercury.co.uk","buerstaedter-zeitung.de","burlingtonfreepress.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","columbiadailyherald.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","dumbartonreporter.co.uk","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","examiner-enterprise.com","exclusiveindianporn.com","fantasysports.yahoo.com","fightforthealliance.com","financeandinsurance.xyz","footballtransfer.com.ua","fourchette-et-bikini.fr","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","greenocktelegraph.co.uk","hattiesburgamerican.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","jefferycontrolmodel.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","knutsfordguardian.co.uk","kutubistan.blogspot.com","lancasterguardian.co.uk","lancewhosedifficult.com","lansingstatejournal.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","matthewhotelscience.com","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","myhomebook-magazine.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northdevongazette.co.uk","northwalespioneer.co.uk","northwichguardian.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pamelachangemission.com","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","peterboroughtoday.co.uk","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","poughkeepsiejournal.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","publicopiniononline.com","puzzles.pressherald.com","rebeccacostthousand.com","rebeccapracticeloss.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","standard-freeholder.com","stevenspointjournal.com","stowmarketmercury.co.uk","streamtapeadblockuser.*","swindonadvertiser.co.uk","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","thescottishfarmer.co.uk","thisisoxfordshire.co.uk","tips97tech.blogspot.com","traderepublic.community","travelbook-magazine.com","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","wiltsglosstandard.co.uk","wimbledonguardian.co.uk","windowsaplicaciones.com","xxxjapaneseporntube.com","yourlocalguardian.co.uk","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","basingstokegazette.co.uk","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","cybertruckownersclub.com","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","doncasterfreepress.co.uk","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","ellenpoliticalfollow.com","enfieldindependent.co.uk","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","gamershit.altervista.org","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hampshirechronicle.co.uk","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","jeanprofessorcentral.com","jennifereconomicgive.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","largsandmillportnews.com","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","majorleaguepickleball.co","mansfieldnewsjournal.com","mariatheserepublican.com","marshfieldnewsherald.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","montgomeryadvertiser.com","multivideodownloader.com","my-code4you.blogspot.com","northantstelegraph.co.uk","northernirelandworld.com","northsomersettimes.co.uk","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","play.mercadolivre.com.br","player.subespanolvip.com","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","redditchadvertiser.co.uk","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","southwalesguardian.co.uk","stream.googleapiscdn.com","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thescarboroughnews.co.uk","thunderousintentions.com","tirumalatirupatiyatra.in","tivysideadvertiser.co.uk","tricountyindependent.com","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","wandsworthguardian.co.uk","warringtonguardian.co.uk","watchdoctorwhoonline.com","watchtrailerparkboys.com","wharfedaleobserver.co.uk","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","bucyrustelegraphforum.com","burlingtoncountytimes.com","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fifties-beat.blogspot.com","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","harrogateadvertiser.co.uk","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","lancastereaglegazette.com","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","messengernewspapers.co.uk","northwaleschronicle.co.uk","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","peterboroughmatters.co.uk","pickleballteamleagues.com","pickleballtournaments.com","portclintonnewsherald.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","rotherhamadvertiser.co.uk","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","storage.googleapiscdn.com","telenovelas-turcas.com.es","thebeginningaftertheend.*","thesouthernreporter.co.uk","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","barryanddistrictnews.co.uk","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","bromsgroveadvertiser.co.uk","change-ta-vie-coaching.com","chelmsfordweeklynews.co.uk","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","eastlondonadvertiser.co.uk","elperiodicoextremadura.com","eppingforestguardian.co.uk","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","greatyarmouthmercury.co.uk","helmstedter-nachrichten.de","html5.gamedistribution.com","interestingengineering.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","kidderminstershuttle.co.uk","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stroudnewsandjournal.co.uk","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wisconsinrapidstribune.com","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","yorkshireeveningpost.co.uk","brittneystandardwestern.com","buckscountycouriertimes.com","celestialtributesonline.com","chardandilminsternews.co.uk","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","denbighshirefreepress.co.uk","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","helensburghadvertiser.co.uk","iphonechecker.herokuapp.com","kathyinformationwhether.com","leightonbuzzardonline.co.uk","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","northumberlandgazette.co.uk","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","redhillandreigatelife.co.uk","richardquestionbuilding.com","runcornandwidnesworld.co.uk","rupertisdivingintoocean.com","saffronwaldenreporter.co.uk","somersetcountygazette.co.uk","sztucznainteligencjablog.pl","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","zanesvilletimesrecorder.com","barkinganddagenhampost.co.uk","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","wattonandswaffhamtimes.co.uk","www-daftarharga.blogspot.com","xn--90afacv0cu2a3cr.xn--p1ai","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","becclesandbungayjournal.co.uk","braintreeandwithamtimes.co.uk","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","dumfriesandgallowaylife.co.uk","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","thefreedommatrix.blogspot.com","thetfordandbrandontimes.co.uk","thetottenhamindependent.co.uk","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","bordercountiesadvertizer.co.uk","caq21harderv991gpluralplay.xyz","clactonandfrintongazette.co.uk","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","kryptografie-de.translate.goog","maldonandburnhamstandard.co.uk","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","readgraphicnovels.blogspot.com","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","xn--90afacv0clj6ac0dxa.xn--p1ai","akihabarahitorigurasiseikatu.com","darlingtonandstocktontimes.co.uk","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","richmondandtwickenhamtimes.co.uk","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","hollywoodhinditracks2.blogspot.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","harwichandmanningtreestandard.co.uk","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","burnhamandhighbridgeweeklynews.co.uk","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","wymondhamandattleboroughmercury.co.uk","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];
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
        const $scriptletArglistRefs$ = /* 13875 */ "1916;-1917;426;1024,1743;1741;140;1562;61;120;477,623;61,486;3011;486,502,788,1122,1123;162;1128,2170;1743;1300,2584,2585;61,502,824,3765;1744,2251;162;61,1494;162;162;162;2839;-62;3505,3506;63,409,512,519,2049;440,2783,2784;426,512;2005;1372;564,1745;162;3283;1050;2164;162,449,1857;140;536,1123,1190;942;162;162;162;-161,-2833,-2834,2839;162;-1917,3085,3086,3087,3088,3089,3961,3962,3963;61;61,409,460,464,465,466,467,1743;486,992,993,994,995,996,997;162;3035;1024;409;1741;486,725;679;3298,3299;1743;1024;1940;61,409,486,1745;406;134,135;61,2449;1841;140;433;140;433,460,590,829;134,447;486,1990;2013,2014,2015,2016;223,744;1494;3967;1024;394;162;61;61,452,1024,1744,1887,1888;-1917;-1917;486,502,788,1216,1742;3674;61,512;1841;61,788,1217;61,397,409;634,725;162;406;969,1290;159,173,576,716,1841,1842;2816;-140,1367;162;61;63,1746;162,1841;426,433,486,535,788,1400;140;63,64,425;250,251;2544;3579;64;666,1766;63,666,3800,3801,3802;1562;1744,2251;1881,3628;1744,2251;1747,2938;433,458,459,1741;159;1164,3674;162;688;512;61,1070;2303;3716;406;162;1937;134;134;162;1938;162;-140,1367;61,3830;162;61,486,1024,1574,1575;61,134,486,1561,1562,1563,1564;627;426,433,486;1744;409,426,661;61,460,1562;833;162;61;1941,1942;162;61,1991;2941;486;162,1297,2657;162;61,62,63,64,1889;761;3912;162;1423;409,478,507;162;1289;1207;1562;1024;2164,2165;1745;2175;61,134,486,1561,1562,1563,1564;1301;2269;162;1150,1698;61,409,785;61,1608,1615;1024;162;2945;61,62,63,64;162,1074;576;61,824,840,2207,2725;162;172;1300;2283,2284,2285,2286;642;607;61,725,2597;61;61,452;3163;409,856;433;140;1494;931;3212;490;863;1128,1377;1852;1255;1745;61,426,486,578,622;1173,1211,1494,2708;479;2704,2705;627;434,1024,2802;61;811;1128,1458,1745,2325;61,3207;1622,2792;1814;1024;1843;1841;129;1841,1842;3608;1841;403,404,1841;452,453;-1917;627,657,1711;414;-1917;134,1820,1821,2505;2307,3127;162,375,1296;743,2509;433;2976,2977,2978,2979,2980,2981,3992,3995;447;152,2106;162;64,627;1841,1842;2180;1841;3266;2463;2474,2605,2673;1814;1402;61,452,1887,1888;61;420,629,849,850;1474;397;61,486,502,788,1216,1742;486,1214,1215,1743;3929;1527;415;1494;1743;3407;447,2534,2535;492,645;162,406;159,173,406,576,650;1272;433,533,1024,1562;162,1293;-140,1367;1704;61,1351,1742;1562;61,801,1742;627,1302,2439;1743;-140,1367;1363;-140,1367;591;409,426,534,661,878;1227;162;140;1821;1494;61,3174,3175;1494;64,580,627;627;1861;1174;1174;1174;627;64;61,655,1279;600;454,1131;3292;1128,1671,2325;3298,3299,3650;317,318;487;409,487,512;3245,3246;2636;162;1562;162;2911;747,748;61,1494;486;3703;61,486;507,627,1210;884;627,1562,1711,3029;725;162;1494,1496,1497,1498;-1917,3611,3612;3826,3827;1562;1745;1024,1153,1154;162,1841;162;2124;134;61,863,1744,2206;1821;939,1742;162,1297,1693;718;2972,2973;61,824,2207;162;152,737,2164,2399,2988,2989,2990,2991;162;3504;1562;512;61,3830;61,1633;2631;201,202;164,165,2598;433,487,512,889;140;409,426,661;61;-441,-2784,-2785;61;61,442,512,611,661,743,783,798;3412;3601;1353;1814;61,817;162,814,1203;64;1494;549,1141;580;1814;1328;162;61;458;61,1024,1744,1756;512,1562,1744;162;2076,2077;512;1841,1842;61,454,1748,1906;1024;1562;201;123,1841;486,1742;1456,1457;1775;61,460,493,494,495;511;2949,2950;1742,1743,1744,1747;1841,2726;1841,2726;3155,3156;61,63,634,1150;61;814;1615;61,1743;627;61,65,66,67,68,69,70,1024,1562;495;409,426,512,661;1744;61,536,1190;64,627,3597;536,1123;1062;138;1974,1975,1976,1977,1978,1979;1132,1133;1742;152,3291;1821;439;1938;1775;1744;840,2207;840,2207;75,76,162,1292,1299,1841,1842,2541;2349;428;414,1841,1842;645,1219;406,1814;526;3836,3837;61;61;162;140;1494;71,72;61,1024;2181;1562;1562;257,406;725,1744,1749,1896,2983;1494;1765;627,1724;1744;486,788;627,1618;1494;71,72;61,627;627,655,904;1841,1842,3503;3847;1562;1024;512,578,3180,3182;688;1775;477;1128;61,486;1083;402;2995;1153;1310;500,627;162;-1917;61;1377;162;162;666;64,159,627,2356,2357,2358,2359;1841,1842;1861;1211;1568,1583,1584;2557,2558;627;61,512,1745;1494;1494;162;406;78,-1917;61;627;406;162;1741;817,1106;61,627;533;1494;-1917;2863;64,627;-112,1580,1631,1651,1674,1675,1676,1677,1678,1679,1680,1681,1682;-112,1580,1631,1651,1674,1675,1676,1677,1678,1679,1680,1681,1682;1708;61;61,1775;486,1526,1527,1528,1529;2903;865;1744;1775;61,1775,1776;1745;2690;61,486,1128;1188;1821,3927;61,3794,3795,3796,3797,3798,3799,3836,3837;61,512,1742,1744;447,1803;1277;1810,3878,3879;1633,2870,2871,2872;1494;533;3250;162;3228;61,609;452;61,1562;61,65,66,68,69,70,1562;61;61,452,1024,1887,1888;507;1115;425,433;1277;3079;1841;1165,3674;1353;1494;119;63,1024;486;1741;61,1562,3203;666,1626,1627;61,442,634,725;512;2160;452,978;1743;162;486,725;3894;1024,1753;1741;375,416,1296,1688;3640,3641;871;447;693,1740;1744;61,1562,3203;1841;409,762;3894;1710;1562,3399;3059;433,2575;409;1024;1024;-140,1367;162,400,401,402,1289;1494;162;134;2223;61,1745;487,1742;402;507,580,1054;162;162;3306;3306;1494;1841;61;3052;1838;1785;965;414;892;3472,3473,3474,3475,3476,3477,3478,3479,3480,3481;460;61,454,1131,1771;502;627;467;-1932,1932,3926;61,426,583,606,607;471,606;471,606;61,609;1841,1842;378;2215,2216;627,2931;1741;1494;64;3920;627;61;1024;1744,2251;205;2384;61,1742;3992;-1917;2650;2384;1841;2384;669;2384;2384;2384;626;61;1494;2384;71,72;71,72;1841,1842;1687;152,1970,3988;699,1841;162;140;433,486,788;61;-1917;437;749,750,751;632;1810;1527,2583;61,609;512;1775;3986;3821;61,2602;433,442,486,502,534;61,1900,1902;2787;1745;61,1949;2439;134,2505;2399,2988;-161,-2829,-2830,-2831,-2832,2839;61;460,1746;1742;71,72;486;1743;2782;134;666,3079;2209;61;2951;378,1437,1438;406;61;1743;433;3911;2792;1526;627;533;442,512,1045,1046,1047,1744,1745;1861;61,609;426,433,486,512,622,889;762;590,1787,1788;3053,3054;697,698,1744;61,1743;1010;162,1841;61,506;425,627;487;61;71,72;1500,1501;162;1745;409,426,1745;162;162;162;162;162;162;162;162;162;1792;623,666,1580,1631,1634,1639,1640,1641,1674,1675,1676,1677,1678,1679,1680,1681,1682;509;2792;2107;471;-112,666,1580,1631,1635,1636,1637,1638,1674,1675,1676,1677,1678,1679,1680,1681,1682;627,1494,1705,1706;627;454;2474;634,725;634,725;634,655,725,2333;634,725;447;1755;1514;1106;1494;2741;470,1141,1142;1562;61,409,512,588,589,590,591,592,1741;533;140,1509,1510;987;1814;3928;1841,1842;1005,1015,2484;1671,3817;162;1547;162;1083;162,406,1290;836,1463,1579,1580,1581;61,454,1748,1906;688;1353;486,788;1841,1842;64,452,549,580,627,2221,3511;1744;1743,1753;775;500;162;1227;1744,2251;512,966;61;61,486,512,788;1068;1428;1294,3231;3000;162;61;61;1743;64;1841,1842;-161;1772;1440;3400;91;1277;802,2688;61,486,788,1633;1111;1024;1562,1744;416;929;409;1743,1748;61,2207;1749;1742;61,1397,1778;2193,2194;1841,1842;61;460,1742;1746,1747;61,454,512,634,1024,1562,1742,1772,3125;1775;528,529;711,712,713,714;61;437,711,712,938,1562,1744;2496;2183;61,62,63,64,1889;159,173,1841,1842;397;2010;2010;61;152;61,1220,2504,2510;1125;1701;1742;1562;585,1201;205;512;2025;1690;1838;715;162;1547,3132,3134,3135,3136;3651,3652;1494;486;1239;3904;2457;409,856;2741;61;71,72;972,973;627;627;627;61,725,1562,2597;101;-201,-1917;3741,3742,3743;1249;438,460,645;627;1742;2444;134,856;454,1562,1775;71,72;487,893;1494;171,3276;409,1028;486;486;61,1562,3203;255,256,2305,2306,2307,2308;1523;61;140,480,481,482,483,484,485,486;454;-1917;61,3294,3676;2315;437,465,533,1024;1562;71,72,1562;1746;71,72;1024;928,2217;159,920,925,926;644,645;3504;61,507;61,1743;470,497;1494;1397,1398;71,72;725,1024;71,72;580;61;61,1024,1562,2049,2107;1494;1024;1346;61;61,1743;682;3181;447;1784;128,3841;750,3166,3167,3168,3169;486,534,788,1745;-1917;61;61,426,486,1742;486,788;817,1532;2698;3692;433,518;1838;3940;406;1861;1841,1842;1562;1743;409;2254;607,959,1318,1562;666;64;2028;61,2592;666;61;666;1494;-1917;1742;3345;1562;2019;1443;3717;420;1752;437,1044,1743;1744;140,1509,1511;2221;627;402,1367,1494;-1917;658;140;972,973;470,620;61,1562;1743;443,445;61,1183,1562;1741;1758;433,486;162;2032;1494;1494;535,1742;162;433,1009;1340;3146,3147;3989;162;2856,2857;71,72;773,899;447;3413;1062,1063,1064,1065;378,1784;61,2880;693,984,3459;3418,3419;123,1841;-1917;1745;512;61,64,1562;1404;817,1532;627;1205;-1917;621,643;162,1074;661,1125,1741;486,725;817;-1917;1562,1744;1744;3504;162;720;788,937;486,788;1633,2870,2871;824;61,452,1024,1887,1888;61,452,1024,1887,1888;454;1494;929;3121;426;1742;162;61;1494;71,72;627;61,452,1024,1887,1888;61,452,1562,1887,1888;-2829;2915;1024;61;61,452,1562,1887,1888;1562;1841;1040,1312;61;396;61;1494;627;2504;63,1805,1806;626;666;1821;1791;433,623,766;140;1024;1754;162,416;61,1024,2624,3201,3202;1726;1024;1024;1562;439;3146;500;620,2590,2591;627;1742;134,3518;406;486,1501,1526,1527,1528,1529;1933;439;61,1562,2669,3203;627;2375;488;627;1024,1744;61;-1917;1122;587;416;627;1562;857,858,1562;61,1623;1743;737;61,1024,2624,3201,3202;1562;1742;1775;1494;1743;1746;2180;61,62,725,1744,3139;486;2545;266,267;2279;499,1814;2450;1562,1705;517,627;2135,2136;471,583,607,627;1494;425,433;61;1494;1494;645;549,580,627;549,580,1914;1745;3059;438,440,802,1724,3678;1562;-1917;1772,1774;1494;1744;3515;1274;1494;1743,1744;3593;3593,3724,3725;61;470,627;61;1749;1277;1562,3427,3428,3429,3430;486,1467;-161,-2829;1494;953,954;71,72;1494;3483,3484;918;1494;134;61,471,627;1562,1745;713;61,725,1024,1562;2893,2894;1742;817;61,1024,2624,3201,3202;627;1744;1494;1562;617;64,433,1709;71,72;1562;1562;162;1494;1416;1743;1227;1128;627;61,1744;1013;2309;845;61;1494;1302;843;468;1743;2350;487;61,426,583,607,608;61,426,606,608,841;61,426,583,606,607,608,609;2242,2243,3933;61,426,583,606,607;1787;162;811;1274;420;3046,3047;2326,2327,3050;439;61;1742;162;627;580,627,1494;627,1272,1372;2615;64,580;64,609;627;64,580;3645;64,1785;627;3833;580;512;627;61,1742;-163;-163;439;1775;1494;1211;61,978,1080,1633,3150;61,1742;632;1744,2251;1744,2251;162,227,375,1689;61,634,1024;627,1711;64,627,1744,2221;1024;627,1494,1949,3214;1949,3688;71,72;61;71,72;162;1014;693;1841;397;486;487;500,627;61,512;1494;749,750,751;3524,3525;433;1851;-1917;1742;1814;1239;2455;131,132,134,135;1093;61,1562;409,724,725,840;105,106,107,108,3772;1841;1242;409,3178;627;1061;1562,1705;1270;61,63,442,634,725,1150;2652,2653;402;1494;61,977,1745;162,449;162;609,2417,2418,2419,2420;1562;91;61,580,655,900,1922;486,788;1162;61,1901,1902;409,1743;1743;1024,1562,3361;406;811;248,249;1494;627;420;426;656;1742;61;61,510;627;3034;1494;2668;1838,2100;162,1092;1131,3580;634;64,588,3197;1744;1494;162;627;1024;3531;1743;1494;3972;134;1562;2221,2504;1938;61,3676;61;2884;1494;2025;1814;1745;1923,1929;1494;406,1841;533;61,409,1191,1743;1494;1277;438,500,627;61;1494;2386;3789,3790;486,1024,1547;1838;627;2070;1810;162,652,969;61,1125,1747;1494;162;1274;61;1838,1841;627;1562;1952,-3509,3509,3510;61,1742,1743,1744;1494;64;627;627;61;500,627;495,774,1159,1160,1161;433;61;607;627;61;281;162;-1917;426;1265;61;1494;2392;2855;627;486;1241;836;162;3614;1746;3058;634,1516,3620,3624,3625;61,495,774;1704;61,487;580;546;2232;1593,1594,1595;365;3426;3302,3303;378;3521,3522,3523;2017;61,1523;486,788;162;1744;1745;1711;2304;1841;3096,3097;1024;634,725;634,725;833;402,627,883;151;3603;3140,3141,3142;1743;486,725;627;627;61,3645,3646,3647,3648;1494;1743;1841;1494;2792;61,512,788,1217,1741;666,2498,2778,2779;1116;486,788,1572;433,577;1494;578;1562;684,685,686;1749;537,1208;814;1750;1562;162,376;859;447;2846;836,1463,1579,1580,1581;272,1600,1601;61;61,1562,3534;61,1562;61,454,1748,1906,1907,1908;3977;3813;1003;64;1081,2043;162;1742,1743,1744;409,578;990;580;1468;972,973;1487;486,1668;1277;2210;1390;1173;537,538,2288;2009;61,2982;-140,1367;1811;61,1024;64,627,2146;61,140,590,1743;627;409,437;502;1499,1500,1501;71,72;245,246;1733;627;666,3332,3333;1302;1021;162;1372;452,607,627;-1917;91;972,973;61;1494;1216;497,1033,1034;1411;627;162;1749;666,1899,3842;1745;1862;1381;452,627;1227,1699,1700;1742,1749;2311;434;600,1741;-195;1494;433,574;61,590;61;71,72;1745;2644;958;416,419;61;61,64,101,1562,3784;61,64,101,1562,3784;1742;666,737,1671;61,64,452,1562,1887,1888;61,63,442,634,725,801,1150;1705,1775;2176,2177,2178;3892,3893;3466;-1563,1775;1562;162;433,486,788,789,790;61,1562,2632;486;61,866;1494;467,712,1131;486,856;1775;61;1323;-1398,-1399;1275;2953;3960;1784;61;1024,1129;1494;1291;1742;61;834,1501,1503,1504,1507;3464,3465;134;439,2246;1494;1494;-2835,-2836,-2837;64,1704;452,607;3437;2741;3855;500,1243;471;71,72;843;433;627;645,1219;3140,3141,3142;1745;951;61,438;2283,2284,2285,2286;1494;607;627;627;61;-1917;61;1742;1850;1480,1494,1578;1745;3467;61,824,2207;495;1744;61;817;1742;1024;1278;1821;2362;2859,3924;3923;1562;634;1896;486,1580,1632,1633,1674,1675,1676,1677,1678,1679,1680,1681,1682;566;634;1744;63;61,801,1305;1024;278,279,1629,1947;61,1684,1784;540;2468;2118;1742,1744;1745;61;725,1745,2387;61,1024;1494;1494;578,1744;1805,1806;1494;1023;1024;1562,1591;162;984;627;566;61,3676;811,2137;1743;1024,1562;438,471,583;627;61;3706;61,1562;495;1562;447;1024,1743;162;61;507,1743,2107;61,3401;1163;750,3166,3167,3168,3169;61,2699,2700;447,486,580,627,1024,1562,2046,3164,3165;1345;3740;725;1742;61,452,1562,1887,1888;61;3829;352,353;1494;802;64;1494;61,1743;2588;633,1562;409;1743;1742;61,580,1562;1562,3427,3428,3429,3430;1024;2444;1494;772,773;1562;580;162;63,470,487,500,590,842;402,2377;447,1449,2568;1743,1744;460,1755;3989;3989;3989;3989;3989;3989;627,1772;162;2572;972,973;737;580,627;1745;1024;442,1047,1744;437;3020,3021;1562;3645,3649;1494;627;1494;1709,3787,3788;487;2323;1743;64,61;3234;2640;1001;486;627;3901;1494;510;507,1746,2107;1494;61;961,962;61,1397,1778;627;1277;1540;1211,1494;627;1938;3766;2524;61,471,627;64;1494,1805,1806;1494;1841;533;1744;460;134,447,2668,3357;1841;495;1814;1494;645,900,984,1065,1219,1731;537;645,900,902,984,1065,1219,1731;487;123,1841;969;1841,1842;1494;162;1852;1131,3580;563,564,565,1745;990;627;1805,1806;1841;3504;-1917;61,661;134,2912,3077,3078,3079,3080,3081,3082;737,1671;3849;705;1145;2674;-1917;984,2393;811;299;1494;2800;447,1803;162;1353,1494;-1917;1494;1239;1744,2435;3699;1742;426;627;1162;2454;627;61;487,764,765,1745;486,1526,1527,1528,1529;486,1526,1527,1528,1529;418;61,452,1024,1887,1888;61;2773,2774,2775,2776;1494;434,843;61;627;162,1294;564,565,1745;1415;134;2792;-62,-1563,-1762,-1763,-1764,-1917;134;1593,1594,1595;687;1841;784;788,1745;580;627;957;406;1744,1775;650;134;1125,1254;1671;2960;1749,2452;123,1841;1239;237,238,364;1743;2984;1070;1846;788;788,1340,1745;486;348;537,2261;626;627;2997;1744;1270;63;61,1397,1778;2674;3187,3188;1461;1743;433,512;500;2607;470;1343;1784;1494;486,1526,1527,1528,1529;486,1526,1527,1528,1529;162;437;1742,1743,1744,1745;512;2180;1745;1357;486;162;192,193,1841,1842,3762;61;533;63,64;627;84,1494,2762;-62,-63,-64,-65,-1890;1013;1743;1742,1743,1744,1745;564,565,1745;61,1260;1494;1252;1381;2809,2810;61;61,627,1013,1562,1744,2621,2622,2624,3203;61,63,627;666;64;-161,-2829;627;1024;1576;61,62,63,64,1889;1742;3094,-3096;1562;1024;1743;1747;61;162;1494;1841;-1917,2024;1704;3679;1024;1024;1562,3436;162;627;1745;162;3570;1277;3913;61;140,486,600;1089;1742;1742;3140,3141,3142;61,1218;1494;627;531,656,710;1128,1745,2170;585,2217;1468,1494;1494;162;1841;683;704;713;61;61;1659;1743;1841;563,564,565,1745;3504;1128,2334;1671;1063;-1917;-1917;2582;1494;1494;3541;79,80,81,82,83;1841,1857;717;2189,2192;1024;802;2461;1277;1494;1814;1743;666;701;1742;1277;61,579,725,1024,1775;-62,-1132,-1563,-1917,-3695;1277;579;1277;1277;1277;1746;1494;409,767;3252,-3254;959;162;2792;162;61,2850,2851;1913;1302;162;2684;627;1227;929;433,1024;489,490;63,1775;1024;1742;1841;1494;63,627;420;3066,3067;61,64;61;61;627;3224;1261;883;1562;1841;1745;1743,1744;495;627;1128;595,1474,1475;540;3828;3828;3828;1494;669;61,669,1683;3723;1746;1353;627;1494;1805,1806;713,2803;1704,1742;920;2214;590,1787,1788;64;590,1787,1788;2270;590,1787,1788;590,1787,1788;590,1787,1788;126;61;61;666;1494;1494;2517,2518;2801;1924;1741;1992;1838;1494;1494;1838;414;101;1149;1745;64;64,1785;634;627;627;627;1805,1806;627;3645;61;64,1785;627;61,63,64,3377,3378,3379;627,1494;3645;2319,2402,2403;627;64;671;634;627,1784;627,1373;627;627;64;549;487;627;627;64,580,761;3358;1809;1494;486;1743;1494;162;627;1494;1784;580;162;61;61;1743;2384;61;2384;2384;1239;627;61,627,1024,2624;1494;817,2071;1671;1744,2251;1744,2251;1744,2251;101,3881;434;1823;1017;1018;409;2384;1744,2251;2384;1591;162;872;1494;130;627;627;2384;1481,1482,-1484,1484;1494;221,222;1841;1814;580;3436,3636,3637,3638;140;1742,1743;61;2184;1494;1933,3926;2675;487;1494;2619,2620;486,788,2276,2277;61;1745;1743;2689;1744;1841;1261;1742;409;1744,2673;1523;1494;1596;1277;61,2757;452;136,216;162;2004;454,724;162,969;3629;3691;336,337;64;64,580,1024,1744,2221;1742;1440;1277;2258;665;134;666;61,1562,3203;2792;1024;627;61;486,788,1279;1745;3140,3141,3142;1131,3580;666;1841;1841;3216;61;61,981;-1917;447,564,1153,1711,1722;61;1562;3462,3463;666;452;61,962,1897;2719,2720;688;2952;-2829;426,535;521;580,990;61,2211;61;546;1024,1743;61,1024,1494,1562,2227,2762;61,1742;61,535;61;1745;498;426;61;1814;1024;61,420,1281;1352;487;1384;3752;-112,666,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,3752;1775;2790;2731;983;1838,1862;500,590;3698;402,1494;1945;1744;1742;1096;1745;1211,1274;1242;873,874,1841;836,1463,1579,1580,1581;1841;-1917;1562;1746;61;1334;406;906;1857;3578;911;61,611,661,743,783,798;1307;373,1694,1861;61,1562;1562;891;1494;1742,1743;2573,2574;162;1131,3580;64;1742;1494;627,1494;61;61,1413;1494,2481;-62;2794;162;627,1218;1494;2345;863,1743,2046;1747;1798;1621;414,2210,3932;64;918;1494;924;500;1153;61;2248,2249,2250;447,1388,1494,1803;811;61;627;1805,1806;467;426;162;1745;1742,3039,3151;1353;1342;666;817,1532;1494;2792;1833,1834,1835,1836,1882;522;512;1494;2388;162;442,512,1045,1046,1047,1744,1745;162;1527;452,607;1841;1841;1745;627;590,1787,1788;540,620,627,743;811;1494;-427,-434,-487,-513,-623,-890;1846;1742;580;162;666;1814;2791;134;162,414;1774;1024;838;1527;64,580,1494;1494,1562;61,65,66,67,68,69,70,1024,1562;3320;1494,3032;-140,1367;61,580,627;487;590,693,1243;61,512;627;61,425,545,546;627;607;500;627,904,2301;61,846;3326,3327;1709;438,512,580,627;512,627;513,514;61,426,442,3488,3489,3490,3491,3492;61,426,442,3488,3489,3490,3491,3492;61,426;61,426,442,3488,3489,3490,3491,3492;61,426,442,3488,3489,3490,3491,3492;1833,1834,1835,1836,1882;61;61,426,442,3488,3489,3490,3491,3492;61,426,442,3488,3489,3490,3491,3492;61,426,442,3488,3489,3490,3491,3492;61,426,442,3488,3489,3490,3491,3492;604,1462;1554;634;61,725,2174;762;1821,1830;162,1527;3896;2839;1178;1494;1709;1463,1464,1465,1466;788;1428;2361;1838,2774;1324;394,814,1824,1825,2933,3756,3757,3758;61,549,580,1775,2757;1524;414;580;-1917;1083,1494;627;1494;1165,3674;439;61;1024;1494;737;3643;441;3352;773;2606;1960;3645;1814;2792;627;424;64;1709;2092;61;1772;1024;439;1814;1185;1494;817,1532;1494;634,725;3448,3449,3450,3451,3452,3453,3454;1841,1842,3696,3697;1121;439;1562;1743;1745;1211,1274;425;2682;627;984,1340;1402;580;627;627;627,2915;2281;61,140;61;1024,2053;2763;627;913;1833,1834,1835,1836,1882;433,442,486,788,1239,2161,2162;486,658;61,486,788,1051,1128;1494,1562,1657;409,433,486,502,595,788;486,788,1572;433,442,486;2258;471,1913;406;64,1712;1841;2291;486,788,1024,1582;804,805;447;3715;1562;1562,1742;1494;1784;425;1527;1494;1320;162;162;162;61;1746;2961,2962;402;3052;1562;1743;61,1150;960;447,1803;61,454,1024,1906,1907,1908;61,634,725,2332;61,454,1748,1906,1907,1908;1494;-1917;1516,1517,1518,1519;2267;1833,1834,1835,1836,1882;162;1280,2047;3279,3280;64;1814;894;-161,-2829;1468;910;61,420,853;1377;2138;487,627;1277;2297;1562;61,934,1747;409,661;1494;627;1742,1743,1744;713,3039;-1917;2676;1814;2649;666,3331,3333;1494;1139;613;409,437;460;433,438;566;2360;907;3658;784;500,657;693;1547;433;1629;-1917,2394;3152;64;437;1274;61,140;1494,2795;2792;414,1841,1842;2367,2368;162,374,1296;500,583;1743;3586;500;156;208,209,210,211,212;627,656,1743;1024;605,691;1562;134;1775;486,1526,1529,1530,1531;627;1749;61,1052,1741;61,595,2430;500;2066;64,1526,1562,1759;627;858,1743;603,1744;140,458;61,1742;61,460,2369;1024,1562;148;1494;1562;3922;61,1024;1749;1024;1749;1562;1814;1024;1562;486,1476;1562;433,486,788,1742;1657;1095;1896;1749;666,737,1671;61,487,535,578,634,688,840;1742;1742;737,856,3729;3311,3312,3313;1128,1277,1401;61,3590,3591,3592,3593,3594;634;1745;61,1741;61,452,1562,1887,1888;61,1562;666,2646;486;454,712,938,1744,1772;1792;938;61;512,3466;61,501;2621;-1917;3645;61,452,1562,1887,1888;61;688;1356;1562;433,1743;153;1562;134,2955;1742;162;1153,3051;737,2399,2988,2989;61,549,580,1775,1918,2757;378,1619;2453;455;3284;61;1743;1772;61,467;3824,3825;162,1841;1832;61,1562;3683,3684,3685,3686;549;540;425,607;140,738;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;2732;522;3714;972,973;61,579,647,1742;627;627;61,1494;3889;452;487;627;61;627;627;64,487;487;979,2153;627;458;2915;972,973;2813;627;2617;627;433,1744;61;2792;487,1562,1744;433,1744;397,740,741;1494;1745;1743;61,1562,3203;442,627,1745,2118;500;666;1743;437;1277;1562;1209;627;61,1024,2624,3201,3202;61,977,978;1527;126,271;1024;1775;-112,690,802,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,1745;627;512,1024;1744;1140;2883;1742;1024,1562;512,801;433,1024;1277;627,1784;61,863;310;64;1024;1742;913;220,3386,3387;1494;61;627;1449;1487;1494;162;580;1053,1741;1494;658;61;61,627,671;1274;1024;1494;635;1744;1024;2171;627;1744,1786;152,312;61,3532;823;3669;64,549;1494;433,658;801;1494;533;402;688;1584;-112,666,1580,1610,1631,1654,1674,1675,1676,1677,1678,1679,1680,1681,1682;988;1494;688;1494;402,1367,2792;645,1219;1743;1841;870;656;61;634,725;61,62,63,64,1889;666;656;972,973;61;2002;1745;447;433,447,458,459,1742,2131;627;1562;1562,3427,3428,3429,3430,3432;3906;1744;140,1128;2294;634,1125;61,513,2741,2826;972,973;463;2098;1494;2028;1743;486,788;688;2292;688;611,661;1494;627;3835;1211;500;512;2792;1841,1842;1805,1806;1252;549;1745;1743;61,512,1562;64;667;1211;426,507,819;162;162,777,1841;-161,-2829,2839;134;162;2059;1494;1002;1274,1494;580;1494;1568,1583,1584;1439;2323,2324;1024;61;500;162;584;462;500;1494;627;627;1741;1743;1024;452,607,627;134;61;3504;1211;2335;61;447,701,1128,2471;447,1274,1494;61;580;61;627;1833,1834,1835,1836,1882;688;1745;883,1012,1211,1494,1504,1533,1534,1535,1536,1537;1841;1494;61;447,1211;627;3916,3917;1024;1785;1527;3238;-112,737,1024,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,1756,2406,2407,2408,2409;627;580,3832;61;1749;162,1290;269,270;3816;688;834,1501,1502,1503,1505,1507,1508;134,447,2668;658;627,2490;162;162;1494;1743;454;134;1494;546,590,645,773,1208,2155;693;64,773;61,471,492,537,773,904,934,2155,3034,3755;928,1494;134,1821,2505;1742,1743,1744;1494;-1917,3807,3808,3809,3810,3984,3985;406,1690;832,833;951;1753;3786;1965;1841,1842;134,3964;134;2158;2361;1745;1644,1670;666,1570,1669;3324;1494;1673;402;1049;3542,3543;433,627;2721;952;64,2910,2911,2912;578,1741;580;564,565,1745;2598;140,409,452,582;140,1511,1538,1539;3138;402;134,2658;1841;1024;1277;1277;1562;447,1302;61,486;433,486,788;486,1526,1527,1528,1529;61,486,512,582,788;1530;61,1562;61,409,512,727,2597;627,3667;64;3626;1494;1841;1494;3834;1576,1805,1806;426,735;2210;378;140;1122;1816;1459;2854;61;3949;134,486,2396;1504,1541,1542;649;502;1494;2716;1131;1494;75,76,1837;1494;3516;1494;687,776;426;477,600;1742;409;1745;2532;486,788;61,452,1024,1887,1888;3220;3819,3820;61,64,627;1775;1562;61,426,486;-3200;543;433;1504,3065;1030;140,444,446;852;580;-140,1367;162;1494;1846;402;728;2382,2383;1562;1562;61,627,2624;1024;1562,1971;61,570,571,572;2094;433,486;502;673,674;627;61;471,500;1381;627;397;879;61,420,512;3109,3110;1709,1720;397;486;1494;1494;71;-2829;2887,2888,2889;2426;627;2612;1562;420,2435;3052;1131;1562;1494;1841;1893,1894;1494,2102;1742;500;951,1580,1632,1634,1674,1675,1676,1677,1678,1679,1680,1681,1682;1648;1562,3427,3428,3429,3430;1760;61;1751,3446,3447;634;1024;1744,2618,2755;666;934;61;61;990,1765,1766,2244;63,634;1024;61;61;61;61,962,1897;2032;91;3600;658;394;409;61,1527,3164;1562;1494;134;1562;1527;1814;775,1742;61;409;2749,2750;1494;433,1744;1708;447,1803,1804;972,973;1024;61,64;2027,2787;61,671;1024;737,1745,1772,2319;863;1494;623,863,1274,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,1766,2867,2868,2869;1562,3436;1884,1885;1807;162;162;1108;1841,1861;162;1841,2125;1377;540,900;627;213;1330;63;162;2839;101,3854;61,500,607;502,1742;3014,3015;162;1841;627;61;500;91;140,1509,1510;130;1841;3774;666,1569,1570,1571;61,1580,1631,1674,1675,1676,1677,1678,1679,1680,1681,1682;1746;1277;1277;1024;1277;1240;814;1277;1744;1277;1494;61,62,578,579,580,1744;1277;1277;1494;897,1480,1494,1578;1277;1562;61;627;1744;1494;580;1954;433,809;1494;470,509,627;3281;1494;2528;1277;512,1745;-110,1863;3591,3791,3792;61;134,680,681,682;688;314,315;440,3678;162;630;1494;669,725;760;420,512;689;1742;627;470,496;1562;470,1141;2632;627;627;627;540;3007;1024,1562;1743;1775;1494;1494,1756;2993,2995,2996;1741;627;775;1494;627;1131,3580;580;61,64,627,3079;2561;471,934;134,2505;2759;627;627;627;61;61,2237;627;2916;1814;1562;3828;-62,-670;1277;61;1049;61,1744;1277;580;687;2877;1494;1277;1671,3638,3663,3664,3665,3666;1742;61,634;1494,3259;117;1449;140;61;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;61,426,606,607;470,471,472,473,474,475;590,1787,1788;627,1614;2060;2543,2747,2748;426,452,512,611,661,763;1841;1841;1787;1198;439;1841,1842;1742;433,1744;1050;1841;406;658;1742,1743,1744;3504;502;972,973;972,973;972,973;1024,2853;627;378,549,627;425,438;64,549;549,627,1494;627;627;581,1709;627;439,627;64,1709;634;64;64;627;627;627;627;64,1494;61;1494;402,2660;1125,1743;2239,2240,2241;130;1775;860;836,1463,1579,1580,1581;1494;2138;1283;627;1494;1494;1562;2176;1622;607;292,328;1494;627;1744,2251;1494,2099;1743;725;61,447,1742,1746;725,743;61;580,609;1742;808;162;580;2032;1494;1106,1322;433,434,1748;607;823;2384;1277;580;714;1153;1494;1861;414,1321;289;2157;402;2495;2597;1311;627;2040;123,1841;1494;2902;1741;-1917;162;1743;1024,1494;162;486;140,658;1562;433,486,530;434;433,1743;1742;1742;486,788,2179;1494;162;1128;502,725,1742,3037;1742;61,425;2787;452;1153;61,63,1279,1562,1711,3029;61,1562,1711,1775,3029;61;3200;2328;61;61;1121;1446;2824;64;685;1494;1841;1880;1744,2914;64,1744,2221;627,1742;845;580;549;438,627;134;627;1748;634;1562;1742;2036;666,1562;2515;162;1318;970;61;162;1743;2805;3953;534,1743;1562;1083,1494;1277;1024,3216;1494;61;486,788;512,886;666,1580,1647,1674,1675,1676,1677,1678,1679,1680,1681,1682,3436;1742,1743,1744,1745;1494;61;627;101;1742;61;487;61,1024,2624,3201,3202;61;1242;1608;1024;3679;1562;61;1024;61;61,1744;61,512,1744;1745;61,1024,2762;1024;1744;1746;61,725,1024,1562;61;1745;1745;433,1744;1743;61,1024,1562;433,1745;-1917;1743;61,2424;1743;61;918;2202;1841;2322;162;974;627;3752;406;2310;61,440,2845;1024;627;61;1063,2437;1494;2180;578;627;974;1131,3580;1742,1743,1744,1745;1745;814;863;2942,2943;61;64;61;64;-1917,3441,3442,3987;627,1805,1806;666;634;162,1848;823,2588,2898,2899,2900,2901;1414;3281;1741;1742,1743,1744,1745;61,3485,3486,3487;1742,1743,1744,1745;3006;1477;520;1494;1494;2299;512;512,627;-140,1367;1745;1099;64,1494;627;1277;61;64,1785;1383;1024;61;1024;61;576;1277;91,134;96,97,98,99,1562;409;140,1747;666,1899,3842;1494;2886;1431;276,277;2789;1332;61;453,1106;61,609;134,1515;3243;447,1803;1747;1909;3504;2210,3932;134;1494;688;162;1841;2119;1494;477,486,534,837;1972;406;3773;433,1744;61,442,512,611,661,662,1758;1274;2159;61,1024;486,788,1746,1747;627;3317;627;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;1957;627;2464,2465;512,762;1397,1398;1494;590,1787,1788;1787,1788,1789;1744;1024;2525;2525;2525,2526;829;1742;61;1295,3815;1550;817;437,1744,2046;1805,1806;134,1821,2505;-140,1367;61,3959;61,627,671;627;627;627;627;1035;556,557;433,470,794,795;627;655;627;627;495;2746;627;61,438;627,1709;500,627;627;3569;487,627,895;582,693;627,942;627,817;500,627;627;64,627;627;61,520,607,1172,1173;61,437,1743,1744;61;61;61;1841;61,666,3771;580,666,1742,3771;321;162;639,640,641;627;1494;3530;441,442,535,1024,1562,1741;627;1667;63;134,2486;507,2385;1841;1024;3504;1193;-1917;580;1743,1776,2339;64,1775;580;1494;162;1252;1814;3374,3375;3092;425;61,3676;1704;1704;540,627;486;596;1747;61;1747;627;1402;2317;1494;162;942;1562;162;823,3040;1494;162;486;439;1742,1745;433,1744;1494;627;433;863;64,615,3424;64,615,1562,3424;162;627;140;1843;1963;925,1269;1494;162;613;447;454;1494;162;708,1494;61,420,1766;61;433;634,725;634,725;2997;134;1494;1080;1814;2504;304;402;627;433,1276;1078;64,3764;1494;576;2534,3112;61;1745;688;452;452,580;492,2628;487;1724;627;627;487;534,2231;627;1024;1479;1024;1106,3282;61,454,1024,1745,1908;433,486,512,1746;1494;1746;61,999,1742;433,1744;433,1744;737;3957;61,500;2724;434;140;1494;3659;1390;3863;1494;533,802;426;2951,2974,2975;3314;61,3468,3469,3470,3942,3943;61,438;1308;814;162;2180;1744;477;1024;-1917;61,426,500,627;2543;3894;1024,1742;61,1743;2099;1024;409,585;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;61,426,442,520,590,1150,3968;61,1150,3760;61,454,1131,3580;1353;64,615,3424;1562;433,512;1562;1744;433,889;61,627,1024,2221;61;409,512;580,1562,3587,3588,3589;437,458,696;1909;627;1122;1709;1451;1494;1494;2361;439;1814;162,1691;627;1087;1921,2091;458;3221;595;2094;1068;3713;2629;1494;1841;1494;1256;1494;140;162;566;999,1485,1486;999,1485,1486;162;1388;1494;2210;1312;3504;130;1833,1834,1835,1836,1882;3008,3009,3010;2496;492;627;627;3925;3925;1862,3090;1841;2467;-1931;3242;540,573;61;936;134;627,1744;1775;300;61;1494;737,2399,2988,2989;1494;725,2431;627;627;1494;2786;1083;1494;2792;486;1461;701;540;1913;1227;2238;1909,1910;1841;1303,1741;1181,1418;2349;1562;162;666,3215;1562;2170;2054;432;-62,-63,-64,-65,-1563,-1890,-1917,3085,3086,3087,3088,3089;1277;61;1742,1743,1744,1745;61;3285;2940;1277;437;1494;1527,3130;486,1526,1529,1530,1531;773,2495;61,378,1024,2033;1024,1571,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,1743;64;985,2095,2174;1494;2372;63,433;1353;409,426,1144;1742,1743,1744;1277;793;1494;1814;61;61;61,1397,1778;1841;1147,1841,1842;377,3945;134;1745;1024;61,452;141;64,580;1746;1746;1743;394,1155,1156;61,101,3784;1742;1024,1745;3546,3950;61;61,891,1272,2391;452,607,627;64;134;3573,3574;467,666,1131,3381,3382,3383;512;3593,3594;1749;1741;1024;1775;1186;1024,1562;3435;3504;1803;2001;437,1562,1772;512,687;486;1743;61;1494;378,1353;313;1852;1024,1562,1775;512;140;61,578,661;1227;809,2030,2031;1213;2042;61,824;1110;1838;607,2340;1747;627;3978,3979;61,3507;486,2046,2718;1821;1494;162;666;1841;378;627;1128;502;2037;-161,-2829;1745;1862;162;1562;61;627;2603;1743;61,1494,3443;3455,3456,3457,3581;64;1995;627;1792;500,627;61;627;627,3189;2917;580,1913;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;904,984,2957,3034;1741;627,3307,3308,3309,3310;2441;549;627;486,1315;460,581,590,1745;2536;61,3128;627;972,973;972,973;61,1562;1743;3616;1494;61,409,512,1742,1744;1494;2404;725;1744;1494;433;23,-62,-1563,-1917;1562;61,3012;1743;2442,2443;1494;61;2741,2822;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;908;152;1861;425,609,1704;1742,1756;690;1775;1494;579,725,1746;61,74;975;61,1562;1494;1487;1494;1742;1745;1775;725,1742;714,976;578,2174;2384;1029;1744;1724;409,559,560;1744;1744;1724;61,74;61,74;1744;61,1562,3203;627;863;3381;627;61,1562;61;162;61,74;3634;460,1024;1024;61,465,1743;1562,1743;425;61,74;627;1494;513;1744,1891,1892,1893,1894;1377,1671;454;817,1532;929;-62,-63,-64,-65,-1890,-1917;1494;61;2180;61,74;61;1841;1775;162;1854,1855;-112,666,1580,1610,1631,1654,1674,1675,1676,1677,1678,1679,1680,1681,1682;815;725,1131,3580;656;661,743,783,1125,1304,1704,1741;1494;378;3221;500,530,590,627;1562;425,433,471,488;1091;1814;537,2261,2581;1814;1494;1494;688;863;1841;3759;1562;64,1707;63;1743;61,3840;1743;1562;1494;1024;666;580;658;1494;406;64;61,454,1906,1908;1499,1500,1501;627;972,973;2654;2801;2567;3120;454;580;3068;666;1504,1541,1542;447,2481;383;1862;140,1886;486,856;2081;1841,1842;3635;64;1742;1841;486,1204;1494;1970,2109,2110,2111,2112,2113,2114;1494;1810;1833,1834,1835,1836,1882;1494;61,512,3351;1821;162;162;2792;1494;64;540,583;402;134,2505;2674;1494;1850;1494;2505;1742;1085;1428;2937;487;688;1277;1742;627;486,788;2839;627;61;1841;3056;409,-1926,1926;1450;836,1463,1579,1580,1581;61,486,627,1742;447,3514;834;2266;3536;2758;1861;402;394,1155,1156;627;669,1562,1633,3534;1745;1841,1857;580;2150;1274;3414;584;2182;1562;666;3607;1494;1769;1841,1842;1494;1277;1562;725,1742;1494;863;439;2932;811;61;61,1562,3203;61,1562,3203;61,1562,3203;1494;1841;1277;784;1841,1842;3458;904;899,900;693;492,537,904,3755;1131,3580;863,1381;1311;1526;1153;1494;61,1131,3580;1562;1841,1857;2134;627;2432;666;906;487;414;3157,3158;3504;-62,-1132,-1563,-1917,-3581;439;1841,1857;3116;102,103;1741;1709;566;1814;1013;2102;666;627;566;1494;1156;471,500;452,607;-1917;1494;1315,1525;502,800;1494;134,1211;134,1821,2505;2041;1606;1024;378;1024,1025;3941;2080,2081;61,486,788,1128,1745;1131,3580;2205;61;486,788;1494;64;61;1277;1494;627;162;1024;1377;1323;64,500;3956;433,512,951;613;1278;1024;817,1532;951,1642,1643,1644;64;500;409;1841,1842;130;1861;3036;600,601;549;1494;162;512,534,661;1017;487,500,627;668,669,2107;500;487;2958;627;1494;61,1744,2422;487,627;452,607,627;1814;1743;1024;649;134;61,1746;1562;61;2290;1005;627;61,452,1887,1888;817;626,627,1366;402,2531;2906;687,863,1157,1158,3329;1494;512;3220;1622;1131,3580;61,1596;627;1494;61,452,1024,1887,1888;331;1494;3976;486,863,1026;1494,2432;1024;1745;3060,3061;650;1557;1494;1746;627;1494;784;2229;666,1912;1980;1165,3674;3920;1494;1024;197,198,199;627;61,2588,2589;627;585;627;1024;442;152;1494;406,1239;416;416;416;416;1841,1842;61;486;454;409,433,627,788;2785;1841;486,1526,1527,1528,1529;1568,1583,1584;1494;817;409;-62,-63,-64,-65,-1890,-1917;166;1274;1518,1520,1521,1522;1841,1857;61;433,500;64;1743;2180;1775;634,2845;2651;549;162;433,693;1494;1630;1743;61,1562;440;61;2543;433,486,788;1685,1921,1922;1742;61,1547,1919,1920;140,3069,3070,3071,3072,3073;1745;61;1745;1744;1494;627;1746;162,1296;134;2594,3405,3406;1708;1744;1553,2342,2343,2344;152;1494;467;61;3208;1024;1024;509,1024;1480,1494,1578;811;134;439;863,2169;1024;61;883,2614;2686;134;162;500;959;1704;627;666,1507;1742;140;1441;1562;580;402;439;737;433,1744;699,1069;410;134,1820,1821,2505;1494,1526,2762;1884,1885;1336,1337;1743;990;811;1575;439;1494;627,1219;627,1914;512,627;1277;1800;64,627;576;1841;1435;2026;666,3211;627;816;1494;1494;2050,2051;990;2694;1494;134;1562,3427,3428,3429,3430;1277;1744;1024;61,420,1745;1277;1277;580;452,607,627;1277;500,1225;500;1277;1153,3074;1494;666;627;2174;1277;152,3639;447;585;134;447,2882;1494;580;1038,1039;1037;540;627;1494;1494;576,1841,1842;-1917;280;1683;1024;1024;1744;1744,1749;1742;2146;2313;61;2741;2469;64,540,1704,3482;627;64;471,624;627;2563;2173;627;1743;1518,1520,1521,1522;61,74;609,627,1096;627;1465,1478;1657;1494;366;2646;1843;134,1239;972,973;627;-62,-670;1849,1856,2516;1775;2799;1494;3662;438;627;433,486,932,933;1704;1278;1494;631;2435;1131;1322;1428;2378,3122;71,72;470,471,472,473,474,475;471;590,1787,1788;590,1787,1788;590,1787,1788;426;469,470,471,472,473,474,475;627;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;504,505;590,1787,1788;1743;590,1787,1788;425,460,500;590,1787,1788;590,1787,1788;502;1934,1935;627;1814;1494;2169;436;61;626;447,1494,3099;581,2736,2737;1694;402;502;2435;3423;1024;1838;1494;3025;1175;1494;130;452,2375;627;1709;61,62,63,64,1889;64,580;61;634;64,580;3645;627;627;634;61;61;627;61;627;64,458,487,580,609,1461,1704;61;1814;500;910;61,74;152,737,3421;1083,1494;433,1024,1743,2874;1993;2792;3653,3654;1814;1204;627;162;2839;61;3645;627;910;2495;1744,2251;1494,1799;140,507,666,1353;515,743,990,2046;2384;1744,2251;1494;452,607,627;668;409,1742;1247;1024,1744;1494;1814;1494;502;1832;1076;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,2409;2656;1709;162;409,426,1741;627;1153;1766;1024;512;683,2225,2226,2227;1012;162;626;64,627;1494;1494;658,1539;580;394,1155,1156;433,540,1737;487,537,2261;627,1711,3460,3461;1494;737,2399,2988,2989;1841;1024;627;3871,3872,3873;2075;-1917;486;1377;433,486,1746;1494;1494;420,578;332,333;1143;162;140,507,666,1353,1571,1603,1604;61,471,627;3728;3728;1841;1577;2496,3391,3392;1024,1562;2099;1562;64,1562,1775;64;61,590,627,1393,1394,1709;723;547,548,549;1704;737;433,1744;1523;627;627,1742;666,3836,3837;549,1775;2599;64;838;1088,1746;61,64;2371;64,1744,2221;1742;61,438;533,984;1591;1743;580,1744;1494,1808;627;1435;627,1353;487;1504,1541,1542,1543,1544,1545,1546;414;64;1742;1051;406;2560;397;500;512;1922;402;1772,1800;503;1024;61,883,1903;627;134,159,1660;2892;1494;627;690,726,1742;433,1742;2792;840;603,1024;1494;406;1353;439;627;426;1494;1905;580;627;177,178,3575,3947;152,1353,1709;1838;1494;512,626;61,74;1024,1775;452;580;580;1415;140;61,1744;162;409;1743;1494;650;1922,2314;64;627;627;1494;1020;1743;-140,1367;512;666,3402;64;1743;1024;1562;61;61;1562;627;1775;1562,1775;1742;63;512,634,1743;1764;61,1024;378,1745;452,607,627;134,1821,2505;452,607;658,762,831;1743;627;859;447;500,627;1494;1277;2988;1562;1080;1494;61;1469;452,627;658;3937,3938;452;1274;1487;61,1775;264,265;61;1841,1857;1928;378,3905;513;2460;3256,3257,3258;477,1057;1562,1743;1131;452;1494;162;1861;600;1494;2780;1277;1767;1814;1277;61,487;3883;626;1494;1494;512;512,627;1024;1024;1024;898;61,1562;627;634;447;627;627;64;2221,2695;1277;1841,1857;1277;162;2959;752;61,74;452;61,74;1377;1792;2401;3973;433,486,937;3860;615;452,607,627;863,2349,3329;627,840,2207,2615;1494;162;1785;-2829;627;1082;1742,1743,1744;1841;2030,3107,3108;964,1236;627;402;61;1072;1494;906;1742;1708;742;1814;3980;61,438;3504;1804;2839;1265;447,1803,2911;661;61;3504;61;1494;1841;460;3876;433,1107;580;580;1562;1125;507,662,1359,1360,1361;660,1758;406,1137;2035;627;1843;1113;2852;2569,2570;433,460,471,1709;590,1787,1788;590,1787,1788;2710;162;972,973;1709;580;420;1428;1277;590,1787,1788;590,1787,1788;1494;590,1787,1788;590,1787,1788;590,1787,1788;162;140;3848;2677;3143,3144;433,1744;1896;1742;2792;162;61,452,1887,1888;1173,1211,2708;433,1107;1494;1494;1745;607;-161,-2829;1121;143;2839;3205;1494;1740;500,627;627;627;627;1494;1252;433,1107;61,671;1709;972,973;425,433,627;1701;584,586;433,500;1153,2911;433;627,3701,3702;495;627;500,693;784;580;433,540,1737,2313;627;433,540,1737,2313;470;2426;627;1340;627;61,438;627;500;627;1024;447,486,1051,1494,1523;91;3493,3494,3495,3496;1494;1838;1494;3793;1263;406,1841,1842;162;1176;627;354;2627;1381;3248;433;426,1742;61;1742,1743;2839;1746;2062;1432;378;71,72;2557;3296;1494;666;1841,1842;1841,1842;1494;2504;1915;1494;512;1184;1857;1494;1432,2814,2815,2923;1494;162;420,433,627;634,886,3617,3618,3619,3620,3621,3622,3623;580;61,1562;1747;3030;486;3228;1494;840;439;425;1211;1277;1428;1879;1743;1024;971;1862;1122;162;1841;1128;162;863;627;527;2988;627;1562;3262;2494;1211,1494;817,2860,2861,2862;2087,2088;1494,1622;61;919;917;61,74;1841;3504;3350;1166;627;1339;512;1227;152,737,3549,3550,3551,3552,3553,3554;3118;1745;627;2436;627;1252;61,627;627;1277;2515;1494;61;585;580;1841,1842;487;486,1409;836,1463,1579,1580,1581;1494;438,471,583;1499,1500,1501;433,1744;433,1744;627;650;1494;61,3490;500,1252;2221;3376;3983;1277;863,1388,2733,2793;990;61;1841,1857;61,512,1741;2432,2658,3101,3102,3103,3104;537,2261;533,802;61,1743;585;1494;3055;162;1494;1494;1841,1842;61;487;721;134,447,2762,2763,3518;134,159,402,447,1038,2760,2761,3518;1744,2435;666;2428;1744,3818;650;61,962,1897;3504;394,1155,1156;1494;61,3761;64,1775;1741;1743;409,454,1127,1128,1129,1130,1562;61;61,454,1024,1562,1748,1906,1907,1908;614,615,634;1562;1841;1709;1442;438,583,1704;433,1744;447,1576,1805,2451,2483;512;1841,1842;2519,2520,2521,2522;61;402;152;634;1424,1425;860;1024,1562;1239;406;1494;1211;580,627,725;3919;1841,1842;1504,1656,2742;1745;1743;1742;833;1038,1039,1040;1381;61,454,1562,1748,1906,1908;1742,1743,1744;1494;1473;1494;2038;1273;836,1463,1579,1580,1581;1494;162;1494;1282;1083,1494;61;2792;627;972,973;500;433,500;738;1162;1939;1814;61;447;999,1485,1486;666,3316;999,1485,1486;580;1494;1494;613;580;1846;1494;61,1562;61,592,1077;134,1820,1821,2505;1060;1744,2251;1742;486,788,1572;130,228,229;61;1494;439;2210;2384;1821;1415;1000;844;1596;2454;3767,3768;2935;-1917;627;239,240;972,973;1024;245,246,247;1909,1910;61,420,460,512;1494;1744,2251;134,2505;409,437,1282;627;627;64;3935,3936;1798;360;402;627;433,438;627;627;470,867;2741;607;656;433,452;61,962,1897;546;512;2069;61,426,533,1744,1756;2792;1792;1943;162;3782;1024;100,101;3914;433;71,72;1391;73;439;454;3886;3219;627,2258;1494;627;811;1841;134;61,1024,1562,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;64;970;1743;1743;3877;486,1472;1024,1562;1741;406,1814,1815;627;1494;162;1277;1494;3394;1277;1494;460,1743;1415;1494;1743,2268;634;2426;627;3403,3404;61,3590,3591,3592,3593,3594;1745;1775,3595;1775;2624;1024;1518,1520,1521,1522;487,540;1494;627;1494;1494;1944;595,1474,1475;63;454,712,1024,1562;2018;-501;61,3884;2400;1982;1841;1743;433,492,599;2792;1024;452,607;580,1740;437;1562;1347;627;612;61;1841;887;1480,1494,1578;-1917;3548;940;1415;1841,1842;162;162,1838,1841,1860,3186;134;615;811;162;61;667;500,627,767;823,990,2753,2754;1671;3910;1704,3372;627,1704;627;627;3140,3141,3142;3140,3141,3142;3140,3141,3142;3993,3994;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;2845;546,627;438;61,627;61,3128;1252;512;487;452,607,627;64;61,471,627;61,438,645;61,438;1431;627;426;2503;1494;1724;495;425,540;1744;2605;546;1494;1494;1622;471;3011;425,1724,1735;61;409,433;1919;756,757;1745;1494;1024;61;1745;512,535,1179,1741;580;255,256,2305,2306,2307;1024;2550,2551;2551,2564;3381;1745;1743;1745;725,2234;1742;487,1743;1024;1591;1744;1744;1024;609,2117,2118,2421;1024;784;1822;580;1494;669,1615;447;627;140,929;1494;1742;1494;666;61,1024;1841,1842;627;61;1024;1131,3580;61,140,502,1153;61;61,1024;159,1660;61;1591;1494;-161,2839;162;162;1277;784;61,1024,1906,1908;447,1803;61,454,1562,1906,1908;3843,3844,3845;1353;1494;3204;1560;1494;1494;778;409;972,973;1724;1274;2126;2401;688;2604;540,583,1235;1024;439,627;447;61;447;836;666,1562;433,1744;1562,3427,3428,3429,3430;627;1775;64;1742;1562,3427,3428,3429,3430;1562,3427,3428,3429,3430;61;3432;1562;61,62,63,64,1889;1494;627;1494;1562;1697;3989;64;-1917;2353,2659;580;162;1153;402;1576;61,1742;134,140;500;1838;2528;2090;1494;439;1202,2561;3602;1024;471;438,627;64,159,627,737,2356,2357,2358,2359;3582;784;1494;162;456;1004;1494;1429;701;1953;414;1527,3868;162;1841;1843;3113;2734,2735;162;1468;2608;1814;1742;1494;471;487;487;2195;1494;500,627;61;526;2199,2200;1494;406;162;1841,1842;1197;2012,3556,3557;1841,1842;1494;1024;134,486,863,2817;1494;1494;1494;-1917;402;627;1122;1024;929;1494;500,693,1731;1153;1024;1742;471;627,1211;439;627,1494;2743;2741;2059;3261;1388;2121,2122;1716;1716;1494;1772;1024,1772;1841;1841;627;439;627;1354;1704,2085;1476;901,902;899,900;61,471,773,934,2155;899,901;1999,2000;1814;1024;1131,3580;162;1332;1547;1274,1494;1838;1743;64,627;124,125;2940;394;1008;1494;3974;2405;1494;1801,3353;2296;1211;604;604,817;604,1128,1527;1494;1814;1494;1494;134,990;1841,1853;1743;2271,2272;1859;1024;3338;134;3217;3704,3705;1494;130;61,725,1011,1756;3645;666;1353;546,1234,1740,1987,1988,1989;425,500,1724;2487;2576;1494;683;1494;1494;409,588,1757;433,486,788,1013,1244;1720;1024;2515;2792;397;447;1144;453;1744;1252;2895;1841,1842;1494;1742,2336;433,1744;627;695;1252;1494;627,3668;3670;2741;1153;823,1501,1503,1506,1507,1588;976,1494;3263,3264;1841,1842;621;486,1526,1527,1528,1529;1805,1806;3895;61,1562;437,1024,1129,2673;767;833;1841;1353;409;3232;-112,1580,1623,1624,1625,1674,1675,1676,1677,1678,1679,1680,1681,1682;1841;1277;1381;64,580;1744;627;162;627;155;1833,1834,1835,1836,1882;406;64,627,2547,2548;1494;811;1814;64;627;500,1709;1494;1095;1861;1841,1842;61;1494;670,773;1494;1746;460,801;3680;533;1131;134;863,1793,2538,2539,2540;61,598;1325;2824;61,452,1562,1887,1888;2152;1562;627;1568,1583,1584;1494;61,1024;61,1382,1383;3225,3226;1494;61,863,1353,1562;1494;1038,1039;580;1562;63,811,1562;447,1803;1282;1494;61,889;800;162;1841,1857;61;442;433,1744;447,1319;1494;1841;1031;1562;1744;61;1024;61;666,1909;634;1494;1277;1602;486,725;784;1494;1494;2556;501;162;627;1494;1727;471;1494;416,419;1841,1842;486,1526,1527,1528,1529;1270;162;1841,1842;512,655;162;1287,1288;666;61;502;1165,3674;1494;1131,3580;1744;61,634;627;452;61,426,600,1650;2792;585;61,2623,2624,3201,3202;1749;1862;1744;61;627;1562;-2829;1494;1494;101,1562;447,2244,2537;2478,2479;-161;502;1494;1252;454,1527;1153;61;1024;1998;1494;1494;1384;1428;272,275;1841;2777;-161,-2829,2839;1494;2534,2535;3042,3043;1709;1494;1494;433,1744;3671;1415,2380;458,627,1128;537,2261,2581;627;627,3319;2440;500;627;471;454,1131;134,1704;1024;1562;972,973;972,973;-112,1580,1597,1598,1599,1674,1675,1676,1677,1678,1679,1680,1681,1682;580;61;61,470,520,1220,1221;162;502;162;2171;1562,2171;1814;1257,1258;405,1181;791;2819;1884,1885;1884,1885;1841,1842;433,1744;1480,1578,1656;859;1024;959;627;500,627;61;1494;991;162;1238;585;1128;61,500;134,1803;580;162;627;1494;864;541;929;134;1616;1277;61,512,581;1743;1743;1277;61;414,1841,1842;1377;1775;1494;1814;1277;512;420,426,452,507,730,731,1704;683;627;627;235;658;2263;3839;1272,1841;1105;-161,-2829;1277;680,681,682;1277;500;1846;3356;486;1063;1024,1744;162;627;1744,2474;1742;1746;1749;627;406;1252;433;1494;2741;627;3838;3732;61,2804;3173;64,2948;972,973;549,580;627;1846;1729;1494;426,1744;3395;162;1024,1893,1894;1894;185,322,359;447,1350;1814;1743;1494;1494;1672;433,1744;452,549,1453;1024;61;1494;627;1744;627;627;61,1565,1566;1494;627;656;134,1820,1821,2505;784;627;784;677;779;1024,1775;1814;1123,1893,1894;2132;638;1401;241,242,243;439;813;773;1024;784;768,769,770;3471;1745;1494;162;1428;61,1262;1262;590,1787,1788;590,1787,1788;607;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;469,470,471,472,473,474,475;590,1787,1788;3709;972,973;2941;414,1841,1842;1496;61,1745;447,3106;722;-1917,2655;1024,1562;1106,1181,1449;817,818;326;1613,2727;101,3737,3738,3739;2561;434,863;1494;1494;1024,1494;658;688;1128;486,788;972,973;627;666;61,1397,1778;627;627,2142;634;627;64,3899;627,2253;627,1784;627;63;634;1709;1128;3011;663;471;471;1465;402;540;1494;1083,1494;3856;2099;1481,1482,-1484,1484;1852;1743;507;1884,1885;471;1791;394;2792;3769,3770;1494;2213;1494;1494;1353;2003;140;669;61,592;1153,2473;1809;1841,1857;1494;487,580;1000;688;1494;61;1814;500;627;1494;2384;-161,1278,-2829;840;1494;1494;985,1213;-2829;1277;-2829;1742;1494;1841;580;1494;1494;2247;1252;1494;811;1003;1494;3288;2459;1428;1428;580;162;460,470;1326;627;3911;1755;1562;1744;1024;486;486;486;1494;906,949;3558;2154;1101;1397,1398,1777,1778;1353;134,1591;2415;666;967;1562;61,471;442;3037;1596;1841;486;658;984;61;1242;1277;1277;1446;3233;1494;1743;984,2586;627;500;500;1222;23,367,368,369,370,371,372;2040;1426;426;1211;1745;1128;471,583;61;627;134,1821,2505;627;162;438,627,2274;61,64;2665;1805,1806;627;61,692;629,1193;580;1272;580;3710;433,1744;61,500,515,516;1494;1494;580,666;580;1504,1506;1950;-1917;3781,3822;1494,1803;162;134;1494;627;162;3389;61,1904;61;61;1051;421,422,423;737;3954;906;1148;726;1250;134;661;811;1688;162;3041;162;162;1841,1842;447;1844;61,134;439,1742;1562,3427,3428,3429,3430;1038,1039,1040;1494,1562;1024;1024;-1917;1905;61;1986;2196;2049;61,2602;61,2602;140,61;61;61;61;3117;467,1024;2500;434;1743;1086;627;972,973;1409;1278;840;1428;1059;152;471;627;666;162;1494;1743;1494;162,1861;162;162;1596;1743;414;433;162,826;666,1717,3415,3416;159,162,431;1494;1742,2278,2641;1743;433,1744;1024,1743;972,973;1742;1024,1743;2425;420;442,454,1024;627;1494;817;3716;1024;433,1744;162;1841,1842;1841,1842;626;1841;1742,1743,1744;1024;1153;1841;1494;1841;1461;1148;595,1474,1475;61,64,1562;3057;1494;627;1745;3852,3853;500;1434;500;2354;61,64;843;303;2515;863,1742;3661;1780,1781,1782,1783;2792;61;1841;402,1367;3079;1024;2171;182;162;217;2577;1504;1814;1814;378;2116;1153;666,1949;3033;437,1024,1772;1494;3720;61,549,580,1775,2757;61,2757;1494;1791;64,549,580,1494;61,454,1024,1756,1906,1908;1494;1744;817;162;814;2099;1841;1742;64;1743;1562;627;1252;495;500;1277;64;1494;61,62,63,64,1889;3890;1494;1846;1277;1814;1494;580;146,147;1562;2057;786;801,2045;1814;1368,1369;1838;3548;1741;162;61;101,3864,3865,3866,3867;-1917;1742;1494;627;1841;123,1841;1277;1277;817;1428;420,2178;2107;61,2178;1743;64,549,580;580,863,1713,2770,2771;1494;1494;1428;127;580;433,1744;61;1811;162;2376;2681;487;661,799;63;661;1742;1747;61,442;1747;1742;3944;487;1384;61;688;426;590,1787,1788;470;3718;1591;-1917;61,934,1747;409,426,762,838,839;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;402;1981;3885;2994;2373;61;61;1169,1170;502;134,2505;1494;2040;927;1744;64,693,1740;627;627,679;1704;1709;627;627;433;471;540,627;433,540,1737;1704;627;627;627;433,540,1737;1252;546;433;500;2313;433,540,1737;784;470,1729,1730;487,540,597;452,607,627;784;500;61,420;61,420;1252;64,666;471;452,607,627;1494;685;627;61,447,792;1838;1745;1562;1562;162;1909,1910;2744;3766;566;1494;425;1494;1136;3024;1032;487,627;61;963;85,86,87,88,89,90;627;1499,1500,1501;1128;2084;500;-1917;1494;1494;3501,3502;1745;425;2988;-1917;162;1814;549;972,973;1562,2262,3420;1747;2099;3559;727;688;1841,1857;425;1494;3011;61,610,611,1745;2606;809;512;1494;61,714,1024;1123,1893,1894;627;1841,1857;1494;140;3092;487,2488;61,500;64,1562,3424,3585;627;2684,3287;863;152;447;3075;627;188;433,1744;486,1555;627;627;500;64;61;627;1747;500;3222;500;634;140;438,583,1150;272,273,274,275;502;1111;1742;1494;580;486;447,1803;1742;486;1745;1494,2497,2498;3298,3299;3004;1494;486;2329,2330,2331;447,3079;627;61;433,1744;1494;1749;447;3642;134;580;1494;817;1494;512;1744;1274;1841;288;61;61;627;736;3733;2515;1259;3227;1744;487;487;-140,1367;666;437;454;1838;817,1532;61;394,1155,1156;61,1744;2180;1745;1494;409;1814;1494;3850,3851;1494;627;61,3761;627;658;467,1562,3560,3561;61,3861;1024;737,836,1562;1024;2006,2007;64;452,607,627;61,460,1743;1562;467;61,64,3857;61,63,1005,1024,2866;-140,1367;-1917;471;180;437;409,730,782,783;835;1024;972,973;512;1745;447,792,830;627;2728,2729;863;1494;1494;500;627;1343;3440;64,580;2069;3874;1743;1744;1494;61,454,1024,1906,1908;1494;613,717,1083,1106,1567,1568;1129;1494;1283;134;406;1745;134,447;1278;1494;1494;2985;2646;947;2858;3359;1428;2094;1946;1277;1814;61;1440,1841;1814;703,704,1743,1744;1374;1841;1841;1833,1834,1835,1836,1882;378;134,2505;134,2505;1628;406;1862;2661;486;627;1841;162;282;833;1562;61;1396;425,627,1146;1468;627;3267,3268,3269,3270,3271,3272,3273,3274,3275;666,3330,3333;460;162;452,801,802;101,997,1521,1580,1661,1662,1663,1664,1665,1666,1674,1675,1676,1677,1678,1679,1680,1681,1682;666;613;784;1153;1399;61,962,1897;717,1568,1583,1584;3566;580;1702;1841;1449;1277;1277;863;1841;1841;1494;784;61;1080,3030;1006;1743;1775;1494;1715;656;1449;1024;627;-1917;-161;1562;1227;61;2466;1494;1428;1277;1277;627;434;3140,3141,3142;162;162;1526,1759;486,1526,1529,1530,1531;61;1743;627;1277;1277;1388;64,1494;2355;627;2374;666,1279;471;61,1024,1397,1778;236;1024;1562,1775;1744;1753;685;1277;972,973;61,471;64;1131,3580;626;134;754;627;1494;1494;1747;1003;2844;1494;1494;402;402;627,1743;433,1744;2293;537,904,984,3034;666,1703;1024;61,409,454,535,536,1562,1709,1775;433,1744;2881;1562;1862;1844;61;766;61;627;2044;3098;1846;500;-1917;1265;1494;2217;2722;1277;162;1742;1772;1841;3131,3133;460,863,1743;61;1131;320,1821;1494;378;162;1277;3497,3498,3499,3500;2764;694;1875;64,1704;627;627,1128;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;3140,3141,3142;648;972,973;1024;61,409,426,762;1024;627;856,1220;458;433,453,1009,1211,1212;61;627;64;972,973;61,438;972,973;425;1562,2703;162;61;1271;1494,1805,1806;1397,1398;1024;61;61,1745;1199;972,973;1494;425,540,627,1724;61,627;1745;1743;3630,3631;1494;1024;434;806,807;3438;1627;471;1562;1744;2550,2551;2551,2564;666,2446;1742;1775;1744;61;1743;725;714,1024,1753;1494;61;487,1724;61,1024,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,2409,2413,2414;1277;1745;1387;1745;1494;1494;2416;1742;500;500;500;1332;1494;61,486,788;1562;784;784;863;627;1131,3580;986;1724;1494;627;1742;1743;863;1841;452;2347,2348;1323;470,655,2741;817;627;585,627,984;1709;512,762;1428;1265;3916,3917;943;1494;2032,2097;1562,3427,3428,3429,3430;134;1745;460;378,1671,3535;1744;1741;3515;452;1494;666,1569,1570,1571;1742,1743,1744;929;2349;627;2543;1805,1806;631;439;1494;447,1501,1549,1550,1551,1552;742;487;972,973;1743;134,447,2475,2476;1494;627;1841;1277;2839;1256;101;626;1494;1841,1857;134;1742;958;627;1494;1494;425,582,627;1494;1494;972,973;627;91,3251;3898;438;1494;397;1278;699;1494;162;447,2482;434;1173,1440,1494,1497,1504,2685;817,1532;1494;627,2236;627;1671;1725;1256;162;627;627;409;471;1065,1731,3533;515,1095;1494;1494;1131,3580;2741;972,973;1494;1494;2499;134,447,2668;3504;1841;1841;627;438,471;61,1562,3203;61,1562,3203;61,1562,3203;61,1562,3203;61,1562,3203;61,1562,3203;2515;161;991;123,1841;773;883;488;470;134,135;402;1083;1428;670;627,984;2890,2891;1428;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,1990;1494;1494;1494;1494;1767;63,604,1494,3129;1428;-1917;1814;442,627,662,2273;3338;61,512;1494,2432;1745;823,2827;61,1019;1744;507;-62,-63,-64,-65,-1563,-1890,-1910,-1911,-1917;1494;61,1012,1756;425;1494;1494;1814;3526,3527;627;533;3504;817;162;61;858,2634;3223;1134;61;725;1861;3355;714,1131,3580;3305;770;1494;1562;1131,3580;1841,1842;433,2507,2508;2873;1742;1403;2884;1128;1494;140;61,904,905;2651;627;-728;2261;1572;1814;1814;833;1814;745;1113;3239;2515;61;632,2751,2752;112,113,114,2164,3079,3341,3342,3343,3344,3345,3346,3347,3348,3349;3281;833;2702;2702;1562;1562;1696;460,1118;2026;600;3970;634;688;162;447;1024;627;2796,2797;1494;1841,1857;717,3565;1841;1235;814;784;784;439;2515;775,1742;1494;61,613;439;1805,1806;985;1742;1494;1841;439;1277;162;1745;2140;1504;737,1051;3674;863;433;442;533;1841;884;2262;714,1024,1756,2262;997,1521,2924,2925,2926,2927,2928,2929,2930;61,962,1897;1277;1494;61,1565,1566;814;627;3921;2169;580;513;406;3286;811;442;442,714;1494;3695;1814;1211;439;3045;972,973;61,2597;1348,1349,1742;627;1024;1494;140;1841;1743;1744;394,1155,1156;2123;863;452,607,627;1024;3680;627;1282;1277;500,627;162;1494;1494;61,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;3422;1151;1592;666;1742;61,62,63,64,1889;627,1744;61;1083,1494,1553;1051,1805,1806,1807;2220;162;627,2236;627;1494;1200;1481,1482,-1484,1484;1494;454;61,486,627,811,1315,1607;1024;1494;1494;1480,1578,1656;162;471;704,1024,1128;3766;627;784;1153;863,3329;1494,3001;2579;433,1744;2571;1494;812;3048;2997;500;71,72;627;515,972,973;670,2957;688;378;1494;500,1728;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;848;848;814;666;540,627;627,717,3099,3599;627;814;2302;512,1338,1562;1841,1842;92,3397,3398;1428;1494;134,2638,2639;2792;61,454,1744,1906,1908;1494;447,1501,1549,1550,1551,1552;2798;1277;666,3436;1277;1277;801;1746;1862;3610;61,725;1274;2384;1277;1277;433,1744;1277;487;1277;487;1277;817;500;426,452,730;507;3076;836,1463,1579,1580,1581;432;909;1593,1594,1595;1494;471;162;1465,1478;1742;817;580;2792;500;1494;162;882;1494;1742;1744;2723;61;784;920;1468;627;627;2948;580,627;627;627;627;627;540;471,627,1913,2230;627;627;540,627,2587;1814;394,1155,1156;502,1461;1743;1562,1744,3427,3428,3429,3430;627,1741,1744,1753;61,2533;784;627;1024;911;1496;-161;3048;2312;627;3445;1814;1494;458;-1917;1494;669,1617;1742;447,1449,1622,2601;447;140;439;627;956,1262;590,1787,1788;590,1787,1788;590,1787,1788;590,1787,1788;1846;134;1814;603,604;1838,1847;61;1494;1494;783;3674;2427;814;1252;666,2740;61,1562;580;2378;1106;701,1024,1494,1705;1494;1277;1814;1283;2107;1494;1494;434;537,771,1062,2146,2147;61,962,1897;1274;627;61;627;580;540,627;627;61,2933,2934;1742,1743,1744;767,979,1009;512;454,1562;447,580,1024,1562,1584,1770,2638,3161,3162,3163;507;1449;627;500;61;549;500;580;1131;61;607;439;471;1494;1494;1024,3229;1744,2251;486,1377,1504;162;434;580;1449,2244;1494;811;61;64;1364;2163;1339;1494,1720;1841;1494;688;1165,3674;566;134;1428;61,62,63,64;1153;1814;123,1841;627;134;1494;487;394,1155,1156;1814;627;162;460,470;460,470;460,470;460,470;460,470;460,470;1332;130;1284,1285;61,420,434,460,535,851;439;1469;140;683,1211;471;334,335;666;1742;2160;61,1279,1711,1775,3029;2511;1841,1842;162;162;884,1187;470;2505;1494;91,1865,1866,1867,1868,1869,1870,1871,1872,1873,1874,3159,3160;162;1791;1742;580;1743;580;580;1024;61,580;1744;666;1772,1773;627;1814;1444;579;162;1494;61;1083,1501,1656;1152;454;690;433,1744;690;162;409,1704;162;1841;162;1494;61,1905;1428;2349;433,540,1737,2313;1915;134,2039;1494;2818;394,1155,1156;690;627;1494;1746;863;1428;1527;394;452;972,973;1814;2792;1775;398,399;1742,1743,1744,1745;1843;3918;2734,2735;1838,1841;3645;433,1744;61,1562;61,134,1018,2955;1024;1684;1776;666,1562,2128;607,801;1494;1027;396;1494;1841,1857;1494;409;627;1861;1494;2995;134;627,1219,2379;471;2218;471,2259;486;1494;1742;580;2803;1814;-140,1367;1277;62,1123,1744,1890;1741;1659;1494;2896;2185;1023;1814;162;1494;1814;1814;2637;627;1494;3396;1841,1857;1181;1494;1494;61;440,567;1277;1494;61;61;3679;1428;1494;61,580,1973;167;512;-140,1367;438,583;1261;746;402;964,1449;447,1803;500;833;3911;2787;1743;1767;3196;1562;627;1494;836,3513;406;439;500;470,593,594,595;833;1277;2030,3107,3108;1494;1791;627;1841,1842;688;1494;61,438;61,425,500,515,533;1494;580,3672;1833,1834,1835,1836,1882;1494;666,3105;2985;583;1814;1743;3707;61,1360;1743;64;497,513,627;497,513;627;3711;1833,1834,1835,1836,1882;1494;2502;906;1494,2046;590,1787,1788;1841,1858;590,1787,1788;61,470;149,2130;3244;1841;1743;1277;1277;1277;1494;1168;568,569;502;990;1686;61,1751;62,1123,1744,1890,1893,1894;1298;61;1893,1894;61;62,1123,1890,1891,1892,1893,1894;533;1959;-140,1367;3027,3028;693;912;627;1252;972,973;470,497,499,500;688,1807;2436;3609;471;1211,1494;627,904;580,863,2770;433,540,1737;470;433,540,1737;433,540,1737;470,1729,1730;627;627;433,470,627;433,540,1737;627;433,540,1737,2313;61,627;627;544;627;452;500;2231;972,973;1494;1494;1562;1131;-1917;1494;134,2513;1494;814;1494;61,1909;3501;3880;1494;308,309;3234;234;550,551,552,553,554;550,551,552,553,554;512;1743;1743;1592,3903;627;1742;1274,1494;438,471,583;406;3011;1024,1494;1841,1857;1377;863;447,1449;1775;500;425,470,530,531,532,533;3370,3371;972,973;1841;833;627;1131;634,886,3623;1494;627;627;533;1428;1841;3091;654;162;1562;1745;1494;1428;2180;61;2664;1277;2738;1841,1842;627;1277;2361;1494;2321;3235;61,64;64,615,3424;1742,1743,1744,1745;814;2893;627;2956;63,580,666,1562,3627;1415;811;814;833;134,1803;1862;1023,1741;61,512;1494;61;1494;2907;134,1821,2505;1494;447;820;1841,1857;701;61;1494;627;814;1024;1024;1024;402,2792;627;1742,1743,1744;627,1747;61;1913;904,984;2218;452;784;627;627;61,627,1709,2875,2876;627;583,1235;471,583;512;833;3408,3981;1805,1806;1562;787;537,1113;1494;1814;2261;2696;447;61,2257;1341;140,861;61,452,486,534,1440,1743;433;1714;1277;666,2008;814;1841;627,683;1277;1791;1861;666;1841,2807,2808;1494;580;61;1277;426;2711,2712,2713,2714,2715;1353;1384,3687;2275;2787;405;162;533;64;205;863;437,2626;454,1024;627;1494;1494;305,306,307;2511,2721;3093;63,1792;63;1494;3775,3776;627;61;61,3761;628,629,1745;666;1562;64,615,1562,3424;1841,1857;1804;2255;409,730,782,783;471;1562,3427,3428,3429,3430;1494;61;61;1024;1494;2462;2058;683;1494;1562;1024,1562;1562;1743;1153;3660;162;1381;1353;1827,1828,1829;2885;1494;1494;507,1743;524;2477;1743;1038,1039,1040;2059;1494;863;64;972,973;784;972,973;3114;-140,1367;-161,-2829;2806;1024;1814;834;2399;1192;2289;1862;1814;1814;414,1846;394,1155,1156;627;1562,1775;1814;1562;1841,1842;507,619;1745;608,762,979;537,538;134,2505;1494;130;2288;2897;1743;1494;61,64,580;487,627,2772;1805,1806;2086;1024;159,402,412,863,1038,2760,2761;627;1428;442;123,1841;1024;402,1756,2687;509,1024,1562;836,1463,1579,1580,1581;454,1562;1494;1841;627;101,737;1841;1576;627;1535;1252;1833,1834,1835,1836,1882;1841;1494;833;1428;876;1504;162;627;2746;784;1494;61,962,1897;1743;3598;14,23,367,368,369,370,372;162,1296;833;1742;1277;1494;1277;140;1494;3155,3156;985,2095,2174,2264;433,1009;1277;1277;1277;1277;1494,1744;2029;1465,3373;668;2063;1144;433,487;1841,1842;1277;1277;-112,666,1017,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,3336;1277;1122;61;1024,2739;1743;1562;420;549,580,811;590,1787,1788;1562;715,2126;1811;159,1504;755,761;61;1494;61,1397;3328;634;604;1024;3982;627;1024,1743;61;-1917;1494;1494;1494;1000;3254;627;-1917;500;1128;627;1743;61,409,535,536;655,1279,1775;1024,1743;61,500,515,1096;627,1024;725;-161,-2829;920;585;585,920;1744;162;134,1490,2068;627;162,394;1080;260,261,1831;1494;1743;1841,1857;3545;1277;1742;1841;1841;1494;409;1277;1277;627;1743;502;61,580,863,1527;627;627;-140,1367;1277;61;3497,3498,3499,3500;3939;3907,3908;3304;3003;61,64,1704;487;2222;1372,1622;1709;3140,3141,3142;984;3140,3141,3142;1309;580,627,645;438;61,471,627;61;784;438;540;784;756,759;1704;627;645,2221;972,973;580;1494;2792;717,3565;447;627;495;61;626,688;1494;500;1494;471,672;2600;134;2313;461,3236,3237;756,759;-1762,-1763,-1764;1562;512,1024;61,1024,1743;535;1724;500;627;1724;1024;1024;627;1051;666;627,1709;1895,1896;3745,3746,3965;817,1532;1494;439;1469;817,1494,1557;1446;1024;2593;1927;1494;1494;1024;627;61;1562;863;627;1128,2166;1841,1857;627;1494;394;433,1744;433,1744;2792;1743;1494,2227;447;1278;972,973;1024;972,973;714,1024;627;708;863,990;2919,2920;1805,1806;1331,1795;134,452,627;2788;923;1814;3259;580;1743;1494;1494;1494;1494;152,2667;394;162;1494;1494;1494;1494;683;661;3504;512;438,471,500,583;433,471,500,627;394;2954;1277;1252;1089;500;1745;1353;394;580,1494,1591;1742,1743,1744;1494;3948;1128,2148;627;1494;433;627;487;1964;1277;439;1277;627;537,2261;101;394,1155,1156;688;209,210,211;737;626;546,627;627;1211;2397;784;1494;397;1841,1857;433,487;433,487;433,487;64,666;535,1752;627;425;1494;1775;1562,1772;1494;1113,1385,1386;1494;1428;162;340,341;454;409,1249;447;2542;1711;477,623;1846;-112,951,1535,1580,1631,1651,1652,1653,1674,1675,1676,1677,1678,1679,1680,1681,1682;1841,1842;61,471,900,902;61,899,900,901;904,2145;1494;3195;394;1428;454;1846;1501,1503,1504;3632,3633;627;929;1494;1494;1812,1813;1235;2940;2180;447,1449,2345,2346;3338;207;1071;1494,1573;1622;447,1803;1494;1562,1775;1494;1494;1494;414,417;737;627;1494;1041,1042;162,1841;809;1841;2553;1252;2151;1316;1494;1494;1494;1194,1195;1494;3022;1494;1841,1857;425;627;486,1315;121,122,406;533;666,811,863,1720,1862,1964,1968,1969;406;500;833;1819;832,833;414,1846;1841,1857;767;-1917,3693;177,178;1814;177,178,3947;181;1841,1857;3115;1277;1277;1377;1239;1814;732,733,734;1741;1494;607;1494;1814;2315;1846;1494;836,1463,1579,1580,1581;688;1749;627;2187,2188,2190;1494;627;1494;3909;2515;61;827;162;447,1501,1549,1550,1551,1552;1128;1153;1494;1277;3563;1562;2099;869;61;2543;2940;61;2635;750;61;1846;1494;123,1841;378;688;1274;416,1814;3674;3778;1744;1562;61,3823;454,1772;454;1494,1796;997,1521,2924,2925,2926,2927,2928;454,1562;1591;1494;1494;1494;1173,1501,1587,1588,1589,1590;1494;1915,2821;1024;627,2258;454;442;2089;1494;687;1841;1024;101;1211;1814;3184,3185;1814;1379;627;627;814;2099;1841;1649;1580,1632,1674,1675,1676,1677,1678,1679,1680,1681,1682;1619;3783;61,1562;61;1745;61,840,2125,2207;61;1562;1494;61,1523;61,1596;1468;1494;1841;1494;3920;162;1153;1494;1841;1841;1024;1494;1562,3427,3428,3429,3430;285;1841,1857;1841;627;1841;1129;1494;486,1022;502,800;2274;409;1804;2792;1791;1494;61,438;627;2046,2432;1473;61,2816;1051,2141;1562;2515;784;487;2170;61,64;1494;-161,-2829,2839;1814;3862;950;311,1884,1885;162;1884,1885;1884,1885;162;420;1435;1415;162;627;1449;627;439,470,889;61;1838;250,254;162;447,1803;1277;2792;162;3241;162;1534;784;1709;134,2505;627;659;486;1277;1277;784;378,1704;467;1277;1494;972,973;665;1277;1277;1277;1814;784;972,973;3645;784;784;195,196;1494;1494;2092;1494;1494;836,1463,1579,1580,1581;162;1353;1841,1857;1252;658;627;162;972,973;1656;784;540;627;1743;1494;492,3931;162;1211,1591;984,1740;627;61,63,64,627,1704,1775;500,627;2696;2998;512,1633,2144,2145;378;487,2128,2129;2218;627;627;2706;61,1345,2851,3170,3171,3172,3173;1734;627,2186;513;627;627;434;784;1277;1562;2101;1494;447;840;953;999,1485,1486;540,822,823,824,825;627;438,471,583;972,973;784;2244;1846;162;1007;2149;627;134,1494;1494;3384;1003;3384;2730;1024,1123,1893,1894;590,1787,1788;580;2814;1494;162;159,1660;495;61;1862;134;1846;500;447,1803;500;1744;549,580;972,973;784;2839;627;3645;3645;627;627;627;500;2201;1841,1857;814;1494;1494;3359;1742,1743,1744;3062,3063,3064;814;1743;1494;2361;972,973;1846;650;1206,1494;3734,3735;3230;1501,3119;2099;580;634;964;1494,1797;61,1948;-161,-2829,2839;61,101,1526,1610,1611,1612;162;2384;1742,1743,1744;162;1211;1742,1744;1741;402;447;565;1841;3869;1494;3615;1494;520,1494;627;1165,3674;1787;1494;162;2635;486;486,788;1377,2139;486;61,1562;585,658,1488,1489,1490,1491,1492,1493;1494;3700;1841;437,454,1745;1024;1742,1743,1744;134;406;1428;1841,1857;1841;1742;2498;1562;500,627,972;64,1494;1494;1494;61,62,63,64;61,1279,1711,3029;1494;1494;833;297,298,1097,1098;823;3295;2630;2562;1743;61,64;627;580;627;627;1547;627;164;1494;859;1494;626;2172;1494;134;134;91;627;61,1440,2352;61,627;1038,1039,1040;1211,1494,1562;1211,1494;447;1024;1211;61,1751;1024;61,1562;409,1704;409,1704;409,1704;507;1833,1834,1835,1836,1882;1833,1834,1835,1836,1882;1841,1857,2065;1277;833;1428;162;61,1905;394,1155,1156;2115;688;2792;134;580;439;2792;3897;784;1397,1779;3290;627;627;537,538,645,1219;61,1775,1894;420,3577;61;1023;1775;420,460,1742;1744;590,2212;1745;1024;1743;955,956,957;1211,1494;1671;1494;1277;63,64;1746;1211,1494;162;3952;433,500;627;1112;471,583;409,627,1562;627;452;1024;2311;471,583,1235;627;1131,3580;61;627;1355;2364;1128;425,627;1562;1841;1841;1862;1259;406,1814;1494;3504;1841,1857;784;1841,1842;1024;627;134;2613;1814;61,934;162,1120,1841;1494;1494;61;61,486,1742,2683;1494;440,540,3678;64;1494;1671;549,580,1494;438,627;1494;402;2313;627;1742;378;1562,3681,3682;1128;1547,3657;162;1422;2361;1125;2514;627;1494;1494;140,549,580,627,1745;1377,1504,3811;1211;3031;1277;650;483,1841;1428;2635;61,580;2635;397;1430,1671;454;1526,1768,1802;1494;115,116;61,824,2725;409,700;71;1743;1461;613;1718;1841;627;1353;1428;130;1494;1814;627;3340;471;590,1787,1788;3278;396;394,1155,1156;580;540,627;590,1787,1788;590,1787,1788;409;1252;2677,2678,2679,2680,3992,3995;61;1051;134,2505;3891;1416,1417,1741;1841;580,863,2770;433,540,1737;784;1057;2218;500,627;467,1131,3439;627,1494;627;627;433,540,1737;540,1736,2313;433,540,1737;627;627;1128,1576;1463,1464,1465,1466;549;1449,2365,2658;63,460,1024,1742;1494;949;540,627;934;627;784;1131,3580;1743;1862;1494;2217;1841;2228;2228;2228;1494;1596;627;447,1332;1428;1494;1494;1805,1806;512;1036;162;447,1803;1419;1838;3206;972,973;1841,1857;1494;1319;611,1745;162;1494;1342;2561;3281;64;1739;162;1658;1494;1861;1428;1128,2137;1805,1806,1807,3556;447;1494;1814;1422;1921;627;625;1153,1742;627;1743;2672;1775;1841;1494;2498;784;627,2915;972,973;627;2393;378;972,973;627;627;1372,2765,2766;1373;1494;1743;2174;580;627,1805,1806;2922;1494;666;3060,3061;1494;1743,1744;1746;678;63;626;507;433,1744;1494;1841,1857;1841,1842;627;487,537,538,539;299;409;942;75,76,77;1277;1277;61,409,985;2082;1211;1252;1428;717,1562,3099;507,1841,2491;2517,2518;1494;3315;1744;1494;714;467;847;1838;2709;1742;447;1814;1814;378;1494;1814;325;2524;61,454,1024,1906,1908;-140,1367;792,1494,2451;1562;162,406,407,408;3813;1494;1494;1494;1165,3674;61;2055;1744;2958;1128;922;972,973;162,767;1814;1494;1494;61,454,1024,1906,1908;61,454,1024,1906,1908;1841,1842;688,1494;1688;1494;134,1494,1584,2801,3016,3017,3018,3019;2143;1446;1494;1494;1494;1494;1494;486,863;1494;438;972,973;627;500;627;136,137;140,1562;1494;1494;725,1742;467,1024,1772;437,1742,1743,1744,1745,1772;3547;1277;3388;183,184;1494;394;2648;580,627;1494;91;1494;123,1841;1841,1857;1494;666;1814;123,1841;833;1814;409,1127,1128,1129,1131;1846;2180;1814;134;642;627,2235;140,1841;1742;61;162;1429,2295;3369;1609;480;191;811;1814;329;1494;402;1494;1909,1910;627,2221;627;447;683,1494;439;3918;439;828;2986;1494;61,725,2597;1461;152;162,429,430;1841;1494;1428;1428;2913;627;2246;627;627;2964;1494,1805,1806;61,962,1897;1494;-2829;666;152;1562;61;64,3785;627,2258;61,1562;1277;1841;1744;810;140,1427;1277;378;2543;2546;1841,1842;1841;283,284;737,863;61;61;1428;3338;1841;863;1428;1494;1745;61;1494;627;61,454;64,-112,666,1131,1580,1644,1647,1674,1675,1676,1677,1678,1679,1680,1681,1682;3137;962;627;1201;61,824;471,500;972,973;491;3209;1562;61,438;64,627;1742;61,627;61,438;1562;1742;409;61,438;1518,1520,1521,1522;1740;447;627;447,1803;162;982;1494,2904,2905,2906;1494;500;162;1494;1494;486,1315;123,1841;123,1841;402,817;162;3846;1494;402;1131,3580;500;972,973;915;1800;1494;61;1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,19,20,21,22,23,24,367,368,369,370,372;784;91;600;1377;627;1711;134;972,973;627;1841,1842;607;61,438;972,973;784;784;784;1742;-1917;1841,1857;1494;1746;688;595,1474,1475;1743;414,1846;540,627;1494;425;2104;458,537,538;23,367,368,369,370,371,372;836,1463,1579,1580,1581;1743;1494;2180;627;61,1745;3656;2361;1024;500;1724;627,3538;64;61;1353;425;1458;1494;1745;319;1814;162;355,356,357,358;425,1724;1009,1023;863;61,454,1748,1906;61,454,1748,1906;1106;627;627;1494;784;1494;162;1742,1743,1744;1936;1936;1494,2756,3123,3124;607,1189;2438;2300;1494;1494;378;61;972,973;1435,1446,1494,2864,2865;1494;502;688;682,889,1741;972,973;1494;61;1024;-1917;1277;134;1571,1603,1604;2009;1494;863,1453;1428;1494;1846;1252;671;152;1994;1833,1834,1835,1836,1882;1494;1277;1048;980;1841;2549;1428;168;162;1024;134,2505;500;1846;1211;1841,1842;1277;1494;688;1494;972,973;627;61,486;433;627;61;627,904;627;3814;1861;1547,3657;252,253;1841,1857;914;61;1841,1857;811;784;1817;1494;433,1266,1267;264,265;1814;1332;1841;162;1742;627;361,362,363;1494;627;101,3875;549;832,833;580,904;3918;425;645,1219;2067;425;1841;3504;1841,1857;1494;1277;863;61,1562,3203;61,1562,3203;1063;1846;899,900,901,902;185,322;1239;771;1841,1857;1814;61,491;1494;1743;402;627;454;433,486,1528,1742;2707;3091;1494;3504;1494;402;627;1494;1656;162;1744;1024,1562;1743;512,590;1277;1261,1494;500;1494;2433;1494;1494;627;487;627;817,1494;61;409;1814;1131,3580;1131;1131,3580;2944;3100;863;1106;402;1841,1842;1559,1560;1274;1744;134;454,1131;1494;61,440;1841,1842;540,627;402;162;3916,3917;1562,3427,3428,3429,3430;1494;1128;1277;61;433;1252;1562,1775;1841;1841;61,1562;580;3504;1165,3674;500;817;1761,1762,1763;1838;1242;2839,2840,2841;666,1494,1622;414,1846;1744;1494;433,1744;1323,1433;1494;650;134,1821,2505;1846;944;64,1494,2432;2686;394,1155,1156;833;784;1562;237,238;2559;162;1494;1335;1743;1211;64,1279,1911;467;997,1521,2924,2925,2926,2927,2928;433,1744;1494;627;394;3564;627;2645,2646,2647;406;1841,1842;814;540,627;627;1562;1211,1494;61,582,627;134,821;486,1590,2578;583;580;1841,1842;1405;487;1608;2792;2336,2337;1024;1602;1494;972,973;729;1083,1494;1494;1838;1814;1841,1842;1494;1562;1494;486;714,1131;402;702;1494;487;627;1745;1372,1841;784;433,1744;2224;1494;1494;580;61,438;1494;162;1494;1814;61,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;402;1494;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;2040;2543;1051;1494;540;162;439;-140,1367;1841,1857;1024;1494;1494;162;1743;394,1155,1156;2103;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;1494;402;627;1494;1562;1841,1857;1841;1841;1494;2188,2189;140,507,666,1353,1571,1603,1604;61,1620;1277;447,1501,1549,1550,1551,1552;1277;1494;1277;1277;972,973;1277;784;1494;394,1155,1156;1861;447,1803;797;2072;1265;2313;1494;427;1841;784;627;1841,1842;1353,1354;863;500;61,1565,1566;1841;162;1841;1841;61,2245;863,1657;2078,2079;2079;1843;719;957;972,973;784;887;627;1841,1857;327;1083;1494;1742;1470,1471;1262;2745;1494;1841;1527;1494;1841;3930;434;1841;1556,1557;1562,3427,3428,3429,3430;682;1814;1742;627;425;627;627;627;1278;1841,1857;840;1131,3580;394,1155,1156;666,1671;1449;420;1743;1562;1494;402;61;3969;1494;1494;627;2643;1339;1277;1277;2987;1024;1841,1857;1494;929,1128,2102;1494;533,863;627,1125,2470;2164,2480;1494;1846;1775;1646;1015,1016;1277;627;409;1841;549;140;394;1558;784;1775;-3149;162;1494;162;595,1474,1475;1562;1494;1846;-3038;3713;1494;1841,1842;439;162;580;1841;1494;394;964;737;627;658;627;1745;1767;61,62;61;863;1032;1494;627;406,1841;3918;71,72;627;1742;784;409,1704;1494;159;1841;134;1153;972,973;627;61;627;1494;2244;1494;1277;1024;61;61;1562;1562;1494;61;1024;486,788,1572;2674;1277;1494;162;1494;263;1772;1024;262;2252;467,1024;414;447,1803;3111;784;1591;123,1841;454;1277;1494;784;784;61,438;1024;972,973;1454;1841;1436;439;1494;2099;2706;2515;1841;406;162;1494;64;1846;162;688;658;500,627;627;402;1814;811;490;500;1494;1814;452,627;627;627;583,627;607;3996,3997,3998,3999;512;1024;1180;1494;1277;1562,3427,3428,3429,3430;3902;1562;414,1846;3882;61;1494;935;1494;2879;1494;1494;688;1106,1113;1494;1814;1841,1857;1494;447;3859;627;2992;61;840;3027,3028;64,1279,1911;2203;438,471,583;500;627;1814;1494;91;61;500;1227,1233;784;582,1732;627;627;433;477;784;627;627;500;433,856;470,500,627;784;1704;964;1841;1184;1814;2244;1131,3580;688;1804,2530;1494;1106;-1917;447,1803;406,1841,1842;2792;162;1277;2156;1884,1885;118;3576;62;1841;2792;814,2025;972,973;1494;793,1814;1841,1857;134;1024,1580,1674,1675,1676,1677,1678,1679,1680,1681,1682,3436;1494;1814;1494;447,2246;814;1562;1841,1842;1494;1494;1841,1842;3539;433;1494;1494;688;3354;500,627;468;1494;61;394,1155,1156;91;1494;2410,2411,2412;1841,1842;3915;523;1237;1415;500;162;61,62,63,64,1889;1167;627;972,973;1252;2219;784;972,973;784;972,973;1252;627;602;583;972,973;63;3434;627;627;61,1106;61;1494;1024;627;1024;1743;486,788;1494;1861;2180;134,2505;406;1917;433,1744;3265;409;650;1494;162;454;1608;2763;3811;433,1744;61;1277;533,802;2951,2975;500,540;1494;402;130;1428;1876,1877;1562;1562;1410;1562;929;61;1277;61,1024,2878;1960;438;500,627;1841,1857;2361;1743;1741;1131,3580;1744;1562;1131,3580;452,607,627;61,1131;426,512,578,1745;1741;-140,1367;61,454,1745,1748,1906,1907,1908;294,295,296;1846;1128;258,259;627;1846;61,1580,1634,1674,1675,1676,1677,1678,1679,1680,1681,1682,2868,3365,3366;964;688;402;61,454,1024,1906,1908;508;1106;2217;61,486,1024,1355;1465,1478;1494;863;470;1683;666,1569,1570,1571;1838;1791;650;1415,2445;64;1655;838;130;1251;1841,1857;1743;650;627;1846;1883;737;1494;61,1024,2982;439;426,607;1355;134,814,2505;1494;1814;1277;1083,1494;1841,1857;651;894;395,2370;1841;329,330;658;3504;1494;1494;1038,1039,1040;140,682,2936;433;811,1153,1274;1784;1743;2792;185;1277;3425;3218;158;1024;1494;101;438;61;906;627;61,962,1897;61,1898,1899;378;2609;1494;923;1277;1106;272,274;3804,3805,3806;397;170;486,1526,1529,1530,1531;1841,1843;1843;512,1058;2792;1277;1277;123,1841;3298,3299,3300;61;61,2616;1841;447,1501,1549,1550,1551,1552;61;607;666,1526,1645,1646;1494;134;61;492,627,1731;1494;1562;1743;61,580;1003;627;61,1565;61;1814;627;61,2697;627;425,470,533,540,1094,1095,1096;61,1024;433,1744;1083;1562;1846;22,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,384,385,386,387,388,389,390,391,392,393;1173;561,562;61;439;580,863,2770;134;162;1792;784;-161,1958,-2829;487,627;61;152;1494;1128;1841;1841;1494;1838,1861,1864;1841,1842;1811;817;152,286,287,414,1821;1277;3497,3498,3499,3500;3497,3498,3499,3500;22,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,384,385,386,387,388,389,390,391,392,393;972,973;3140,3141,3142;627;61;972,973;972,973;627;972,973;972,973;425;1268,2093;580;627;627;1745;666;64;811;2256;1494;1131,3580;1494;1494;1494;434;1749;471;1841,1857;433;433,520;627;1353;627;425;1841;1043;1420,1421;61,454,1744,1906,1908;1131;1841;1277;2792;2820;1494;500;627;1024;2265;3249;1327;134,1820,1821,2505;1494;1494;1494;627;2487;1024;972,973;1562,3427,3428,3429,3430;972,973;701;1494;3645;1884,1885;447,1501,1549,1550,1551,1552;972,973;972,973;1494;3719;406;1846;688;964;1841,1857;162;290,291;394,1155,1156;1814;1841,1857;64,3567,3568;688;784;580,627;500;627;1841,1857;3079;784;61,555;627;1353,3023;566;409;788;2756;1153;3013;1494;420,1251;688;1277;627;1428;1494;61,62;454;1494;61,62,63,64;1841;1846;123,1841;1148;1277;972,973;61,1565,1566;1494;1494;2811;1494;2320;2965,2966,2967,2968,2969;1743;1814;1128;2433;61,62;1494;1494;444;1814;1745;434;1024;1814;820;268;1805,1806;918;683;3431;1494;433,1744;1841;162;656;1277;471;1838;1845;140,157,1845,3747,3748,3749,3750,3751;1841;1846;1846;1562;402;1499,1500,1501;1744;1494;1494;1846;1494,1562;666,1720,1802,1965,1966,1967;1814;833;833;781;525;823,1153;3504;338,339,394;134;1841,1857;402,737;394;162;433,540,1737;1494;737,3504;688;1494;2423;2504;323,324;1494;1165,3674;3674;1494;1841;607;1846;1746;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;627;1744;1494;2046,2531;1744;2180;-140,1367;162;1846;1494;1494;61,64,580,1279,1911,1912;627;1494;1494;433,540,1737;1990;574;1990;1846;997,1521,2924,2925,2926,2927,2928;2197,2198;486,1024,1261,1302;1494;1791;500;784;1494;2948;394;1562;1277;1024,3277;658;533;433;3444;999,1485,1486;972,973;2595,2596;927;627;1406;1277;1277;1005;63,3958;836,1463,1579,1580,1581;123,1841;486;784;784;61;1805,1806;2034;1277;688;1843;452;627;904,984,3034;447;152;3946;817,3247;1494;500;447,1449;1134;717,863,1274,2046,2204;1494;616;500,509;452,607;425;2233;972,973;3190,3191,3192,3193;1220,3077,3080,3081,3082,3083,3084;500,627;1024;1377;566;753;1428;1791;162;1024,1123,1893,1894;433;3512;1494;1884,1885;1884,1885;471;2231;1814;627;627,1494;162;3812;656;540,1735;627;1024;784;1277;61;1494;1494;566;886;886;1277;784;627;2244;447,1803;1494;1562;162;1494;134,2505;1793;1846;394,1155,1156;1996,1997;972,973;1494;688;1494;1235;232,233;627;627,2186;2173;1814;1846;1239;1743;1841,2555;687;134;972,973;1494;1841;3504;134;447,1805,3528;378;61;3991;534,580,1067,1114,1742;1128;152;533;688;666,3597;3409,3410,3411;3409,3410,3411;3409,3410,3411;162;1286;61;1494;1841,1842;1846;2137;1494;439;1117;1814;61,62;1083,1494;64;972,973;972,973;2052;3887;3359;1884,1885;1277;1277;1277;1494;3763;1494;1494;1744,2251;627;61;2401;1494;1591;502;1494;1494;162;-140,1367;162;476;1370,1371,1372;632;1494;1494;1775;394;378,486;1494;1494;1742,1743,1744;1841;1211,1494;688;486,666,1315;486;658;61,62;1841;1024;1226;394;1814;2221;1494;1562;1277;1841,1842;972,973;2108;61,64;1494;1841;540,627;784;61;2492;972,973;1841;2180;447,1803;3504;887;784;1494;811;1840;61;1494;1804;784;134;627;784;1743;1841;162;3520;61,3415,3416;1744;1745;1494;1494;23,367,368,369,370,371,372;888;1201,1239;158;394;433;627,1772;2515;3436;1841;1494;3658;1743;784;1841;1846;1846;1841;406;3298,3299;627;2515;964;1494;487;1049;433;409;1494;144,145;1494;1277;1629,3753,3754;1024,1131;542;627;784;123,1841;920;3583;688;2485;1688;123,1841;1494;162;2221;1744;1814;486;2214;500;2307,3127;3338;1814;1377;64,1775;1494;1494;688;1841,1857;1494;2633;1893,1894;449,450;3849;1562;634;1249;1766;2771;2025;875,1841;1562,1775;627;972,973;627;1494;2313;627;1494;1494;61;1494;1086;1814;1814;833;972,973;1745;814;1024;1744;1494;61,486,1512;61;2099;1494;1494;2472;2064;471;1131,3580;500;2228;2228;627;1841,1842;627;3517;500;1494;1355,1775,3153,3154;627;500;1843;1814;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;3529;1494;972,973;833;1846;447,1803;1051;460;1743;1494;627;1277;814;1494;439;1494,-1496;179;2180;1494;1494;1494;2366;61;500;627;627;1750;1024;627;64,580;1494;1605;433,3966;1277;1567;1494;627;1841;394;863;1742;1576;162;61,487;945,946;1131,3580;1280;1494;1365;1494;1494;2662,2663;1838;1562;1841;1024;1562;1131,3580;61,454,1906,1908;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;1131,3580;583;402;133;2046;61,437,454,1024,1906;1741;1562;1562;1024;1494;1131;447;140;1128,1494;1982;1846;1841;61,62;2070;394,1155,1156;2349;627;2395;2180;162;1494;1494;1494;3390;2447;500;425;1454;1353;627;1494;1846;1814;502;650;1593,1594,1595;169;2523;1861;1494;3708;1745;1745;1494;1265;1407,1408;1846;1494;1841;1494;512;162;1499,1500,1501;1814;894,2370;1814;1814;1841;1494;134;627;2180;1494;627;61,1775,2174,3149;627;627;61,3044;1356;784;784;1245,1494;500;3613;1841,1857;162;863,1480;2401;140;1277;3161;1243,1274;817;164,165;162;61;2964;1743;162;454,1131;134;3571;972,973;784;784;1846;546,627;585;1153;549,1744;1494;1671;1494;406,1846;1955,1956;1261;727,1381;1743;1494;402;627;2313;433,540,1737,1738;452,607;972,973;784;140;627;784;378;1494;394;1494;3572;134,3360;1743;1745;433,520,521;1494;1274;61,454,1749,1906,1908;2061;540;61,454,1562,1906,1908;1128;1494;1494;627;1211;627;566;1562,3427,3428,3429,3430;1494;454;1884,1885;1196;1436;175;500;784;627;1494;627;3504;440,666;1494;964;1742;1494;737;2512;500;3644;1494;1841;501;627;162;1494;784;755;1494;813;1494;1525;447,1803;1277;784;650;1841;1494;1841,1857;811;627;784;1494;433,487;650;1153;1841,1857;1846;1841;162;1841,1842;899,900,903;3744;61,1787;1128;1841,1842;627;1805,1806;185,186;1846;863;2454;2454;627;580;811;1742;3011;627;3990;627;2341;1494;627;61,1565,1566;2062;1841;918;1846;1846;447;1131,3580;1846;1251;3669;666,1569,1570,1571;1494;1494;1494;887;666,1569,1570,1571;1841,1857;1694;1814;1277;1494;1846;1153;972,973;2668;666;61,62,63,64;1079,1080;214,215;784;627;378;2781;1494;61,62;1128;1494;863;433,1744;1744;63,426,666;1494;61,1562,3203;134;162;3934;1494;61;997,1521,2924,2925,2926,2927,2928;1494;1494;1814;61,62,63,64;1846;61,62,63,64;1494;414;1814;1153;1841;-140,1367;1024;414,650;1909,1910;1277;2769;1719;666;859;500,1234;3431;394,1155,1156;688;817,865;1494;627;61;452,607,627;1494;402,863;1494;61,402,447;500;2244;1024;972,973;540,627;1272;584,585;3555;2278;1494;134;1562;1277;2172;784;627;3803;1494;814;1884,1885;1884,1885;1884,1885;1884,1885;2529;439;-140,1367;1494;1846;580,1024,1562;162;134,1576;814;1846;1081;739;3393;843;1277;972,973;1494;61;784;162;1460;2646;2646;1277;500;595,1474,1475;1742,1743,1744;1468;453;1447,1448;972,973;414,1846;1846;1846;784;817;1592,2208;134,447,1354,1513,1514;64,487,580,2393;972,973;583;972,973;784;414;1274;142;2120;434;2642;2246;2792;134;784;394,1155,1156;784;607;627;61;863;1494;1494;447,2127;667;1494;1494;-1549;162;1277;452;1153;627,3005;176;61,62;784;972,973;61,62;1841,1842;1012;1884,1885;61,62,63,64;580,627,1562;2458;627;61,62,63,64;2363;2221;627;1494;1846;61,62,63,64;397;1744,2251;1846;784;394,1155,1156;1494;627;1861;1791;1277;1277;1165,3674;91;162,1841;1800;1846;1791;866;549;1494;811;1814;486;61,486,1585,1586;1024;162;1306;1494;3363,3364;1841;2180;1277;1494;1277;61,62;1087;1106;397;3540;1576,1805,1806;1839;1796;1165,3674;162;1841;627;3339;1277;101,3779,3780,3781;537,2261,2581;627;1814;2792;1494;1024;972,973;627,1124;162;1841;1494;2911;627;1268;1841;1494;1494;140;2170;1494;1775;833;406;1743;61;439;101,3721;2471;906;425,627;1423;1024;583;471;2792;2792;1380;162;1277;1814;1841;972,973;1494;406;972,973;2180;512;580;2258;627;636,637;626;964;1746;1277;1264;1841;1841;627;394;1841;859;1377;580,1741;500;634;110;607;1841,1842;1494;1494;1494;162;2908;629,726;1846;1409;2032;627;972,973;134;61;3351;61,1562;709;1494;3673;61,1565,1566;1527;433,540,1737;784;580;433,540,1737;854,855;457;1362;3038;650;631;433,1744;1814;1742;1494;2964;1494;784;2557;1791;1841;2228;2228;1117;1494;1494;3234;1814;627;1494;1277;1449;1814;833;1841;1494;2395;1841,1857;627;2260;1846;61,62;134;1494;1494;61,62;448,627;1841,1857;1277;162,406,1290;2189;500;1814;439;134;61,62;61,487;972,973;627;470,471,881;784;1024;1814;627;1841;1494;1494;1841;394,1155,1156;1841,1857;1494;1023;61,985,2095,2096;1494;1861,3334,3335;1024;1494;1814;502;1841;2951,2974,2975;452;91,1278;1131;1749;1814;1846;1846;1131,3580;272,1600,1601;1744;61,454,1906;1814;1841;1494;580;1277;1494;61,454,1024,1906,1908;1814;1743;1494;1261;1695;433,486,788;1814;1841,1857;650;1841;1814;1843;500,627;627;1841,1857;979;688;123,1841;1742;1814;1494;394,1155,1156;162;1499,1500,1501;1846;833;1846;1494;1841;627;1003,1126;1494;1744;409,1775,2174;509;701;627;1494;1743;1744;3935,3936;1277;1494;402;1415;627;627;1277;580,627;1814;2525;433,1744;1838;1277;1277;534;627;394,1155,1156;61;1239;566;1494;460,627,670;1841;1804;558;1454;627;580,1494;784;784;224,225,226;1182,1183;2011;3321,3322,3323;61,454,1562,1906,1908;1479;1562;1841;409,1743,1744;61,1743;134;162;394,1155,1156;972,973;927;1841,1857;1333;154;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;1024,2673;162;3945;3497,3498,3499,3500;61,811;134,1821,2505;1494;1494;438;972,973;972,973;2963;972,973;2893;134;1743;1622;162;929;666;688;61,454,1748,1906;920,1211;3544;1428;2964;500,627;1378;1846;627;434;1742,1743,1744;438,1252;1494;627;451;1128;972,973;1744;1494;627;1746;929;61;3068;1494;502;1846;1277;1745;1841,1857;1252;61;972,973;500;402;61;447,1803;3504;918,1177;1494;162;500;61,62;784;1277;1810;3945;433,487;414,1846;1846;1846;61,62;150;1494;2792;1841;627;627;1494;1494;1494;1277;2454;1494;627;443,444,445;485;487,1012,1220;500;3504;1846;425;1277;1814;627;237,238;2180;1742;1252;920;3571;1494;533;1814;433,1744;916;627;1841;1743;134;972,973;1814;836,1463,1579,1580,1581;1445;1277;162;627,1494;1766,2554;61,512,535;1494;1841,1857;-3921;1055;1165,3674;1494;134;2847,2848,2849;162;1494;502;1494;642;394;1024;863,1432,2814,2815;2970,2971;1791;3436;-140,1367;-140,1367;-140,1367;123,1841;61,3198;727;724,2381;61,62,63,64,1889;3367;1913;1846;1494;2694;1846;1841;3248;627;863;1494;1089;61,1077;61;1746;972,973;134,2505;1562;1838;2166;134;2792;627;863;658;890;1368;607;62,1123,1744,1890;1494;784;1494;784;162;784;500;185,206;929;784;1277;1884,1885;-768,1884,1885;1884,1885;1884,1885;1884,1885;-140,1367;1846;1846;626;1494;811;93,94,95;-140,1367;1277;1277;1277;394,1155,1156;1841,1857;1846;1024;1252;2316;1841,1857;3298,3299;162;1494;1277;811;1494;2022;1494;580,1723,1784,2146;972,973;1814;91,1613;1494;1494;61;1745;104,3417;1201;402;1814;500,540;1841,1857;650;972,973;784;61,62,63,64;1494;1201;1846;1814;487;1494;627;2280;1841,1857;1494;1494;1494;1274;409;1003,1344;972,973;627;61,62;61,62,63,64;2792;1814;2363;627;1277;1277;1277;1841,1857;1841,1857;784;162;1841;1277;1494;1494;1494;1015,1016;611,661,1015,1016;814,869;3260;1494;1841,1842;3297;61,62,63,64;1671,3831;736,1814;1128;61,62;134;1494;1494;784;627;394;2493;3971;972,973;1800;964;2228;1846;627;61,62,63,64;2137;426;664;159,1239;1278;162;2218;123,1841;1494;406;1744;1960;1814;3722;650;438;1814;1038,1039,1040;1841;1494;627;2079;2046;1494;3888;500;452,607,627;627;420;502;162;420;1086;1211;1841;1841;593;627;626;887;447,1501,1549,1550,1551,1552;1841,1858;627;203,204;1884,1885;3293;2994;64;3027,3028;840,2207,2691;964;972,973;1841;972,973;627;627;580,1494;500,627;964;964;1083,1494;487,546;1494;1494;1480,1494,1578;627;1841;1841;2228;434;1846;533;627;1743;1278,1949;1861;61,62;1277;454;61,62;1562;61;1494;1252;162;1494;613;1494;1128;1274;1494;1494;658;3385;737;2785;1494;1744,1749;1494;972,973;972,973;1494;1494;1814;653;411,412,413,1494;2767;1024;3730;1131,3580;2909;1846;627;1841,1842;627;1814;1800;1446;-161,-2838,-2839;1131,3580;580;1494;2160;814;1841,1857;1562;1277;3537;1742;61,454,1748,1906,1908;1909;1131,3580;61,454,1748;627;1745;1841;134,447,2668;784;61,725,1744;1743;61,454,1024,1906,1908;1494;378;1744;343,344;688;1841;1494;1846;1171;1814;968;3228;1814;833;1814;1792;706,707;1841,1857;1841;1743;1494;894,2370;1814;61,62,63,64;1395;1913;1494;972,973;972,973;627;1063,2787;1841;1227,1228,1229,1230,1231,1232,1233;784;1494;394,1155,1156;1494;1128;1742;3155,3156;3210;1841;162;1277;1841,1857;1742,2338;61,62,63,64;885;61;1494;3234;1494;140;1775;61;433;61;1562;1846;1494;1562;162;162;1248;1846;1277;1846;1821;1446;1494;433,540,1737;1211,1494;627;2218;972,973;972,973;972,973;1721;650;1846;1846;1841;1100;627;61;1153;61;2762;906;1494;471;803;2218;61,438;627;1494;1494;972,973;1613;1709;1709;1494;1494;2918;1128;1494;972,973;1494;61,134,502;1841,1857;434;1814;1276;1846;964,2083;3213;580;2580;627;784;1846;1499,1500,1501;394;433,1494;1353;1494;688,877;1494;688;1841,1842;887;1846;627;2213;702;-1917;2792;627;627;1846;61,62,63,64;61;1494;1841,1857;1742;1814;1841;1845;1562;1024;1494;817;1846;2180;1841,1857;1494;471;1024;2839;1494;62;1846;1494;140;61,2669;1494;-3921;627;1846;817;1846;2674;1261;580;1494;134;61;1494;627;627;162,416;1024;1846;1846;1223,1224;688;1846;627;3736;61;540;162;627;1841;61,74;1841;1024;394,1155,1156;61,2244;3689,3690;2287;1063;134;502;883,1024;397;784;2074;863;1494;402;1805,1806;1743;61,1562;1554;627;578;1494;811;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;989,990;1841;600;61,74;1494;880;1742;439,502;1091;627;1814;1277;1104;1846;1841;1846;1841;1841;1743;414;1494;1494;1846;394;1846;627;1494;394,1155,1156;162;500,1252;1843;394,1155,1156;2792;1494;972,973;972,973;414;1494;1846;162;1596;918;1743;394;1494;1800;1012;61,62,63,64;1841,1842;61,62,63,64;1277;162;1494;737;3674;1846;1165,3674;1165,3674;1165,3674;2506;1494;447,1501,1549,1550,1551,1552;439;394;2401;1252;3596;394,1155,1156;1468;1744;502,868;1918;61,62;1826;688;1479;1846;1494;3858;61,62,63,64;627;784;1277;1805,1806;162;61,62;1814;1846;1024;972,973;964;1839,1841,1842;1841,1857;162;1741;1390;1683;433,755;394;817,1494;1494;2684;487,502,627;2073;61,471,796;1494;1846;3504;1375,1376;1066;1846;1841;1841;162,1119,1841;162,1841;972,973;666,1909,1910;3026;1494;1841,1857;784;784;1841;972,973;378;833;1077;1846;402;1841;688;944;1313;-3086,-3087,-3088,-3089,-3090;3777;293;61,1562,3126;402;646;1494;470,1729,1730;964;658;1494;61;650;627;2228;1494;2792;1671;397,1109;378;1841,1857;162;737,1494;61,62;416,419;162;454;1743;862;1463,1464,1465,1466;61,62;1494;394,1155,1156;471;162;187;1494;61;1846;1846;61,627;244;627;1814;972,973;1131,3580;1499,1500,1501;1814;1580,1674,1675,1676,1677,1678,1679,1680,1681,1682;61,62,63,64;665;452,666,959,1744,2610,2611;61,454,1024;1846;3726,3727;1494;1494;1841,1842;1494,3240;650;1494,1796;61;627;1814;1814;64;1392;347,1100;2154;1814;1846;1814;2210;1843;811;394,1155,1156;627;1841;1131;500;61,62,63,64;101;2032;3049;3301;1494;394,1155,1156;1277;1704;627,1704;433,758;425,540,627;1818;1791;814;162,1692;1265;1024,3507;512,1106;61;1743;3855,3900;814;162;972,973;863;1846;500;1846;1494;1745;-1917;1494;1724;627;784;23,-62,367,368,369,370,371,372,-1917;394,1155,1156;409,856;1494;948;1090;434;1742;2561;162;502;1458;688;1841;627;688;1494;1547,3657;627;627;502;1494;414,1846;1211;1389;1277;972,973;627;152,566,3584;817,2434;1791;1814;64;61,62,63,64;1846;1841;447,1449;-1917;1841;1845;1846;1814;1458;61,1562;1401,2168;1841;1940,2939;1841;61;1814;1494;1494;1165;1494;512;394;1805,1806;2444;627;1494;1846;1477;1494;1494;1814;1494;2768;409;881;1846;1846;-140,1367;2625;2625;627;394;2501;1846;1494;533;439;627;972,973;2999;1846;784;1494;162;439;1884,1885;1884,1885;-768,1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1458;1791;452,607,627;1494;650;500;162;627;784;162;1494;1277;1814;1841;414,1846;823;1846;1814;162;1841;1846;162;1494;1841,1842;972,973;627;1494;2566;1494;1211;3179;1846;2378;1494;447,1803;1494;1003,3176,3177;1012;61,62,63,64;152,159,3934;1480,1494,1578;1277;1494;1494;1277;1277;1277;918;1494;1494;656;1846;784;1841;972,973;61,512;1277;502;2167;1714;1841,1842;1742;1960,1985;1494;1277;618;1494;2735;627;140,738;576,1075;1494;1841;3655;585;2398;1494;627;1494;1744;1277;964;1951;1128;162;1131,3580;1841;688;1319;1841,1858;1791;2282;964;2180;2908;237,345;1814;1277;3604,3605;2228;2228;833;1562;1252;2527;1494;1846;162;833;3713;1846;1465,1478;1452;1878;540,627;627;140,682;1277;1261;1791;2069;1131,3580;953;1167,1314;627;627;1841,1857;1846;1846;1494;688;1494;1494;61;1846;1340;1562;1562;2137;512;784;1494;61,454,1024,1906,1908;454;610,611;1791;1494;1465,1478;1841;941;1801;1494;1794;3190,3191,3192;1494;1814;1846;1494;1843;1841,1843;134;1846;1846;833;3151;1841;1494;1252;439;1841;434;833;2323;1468;1507;134;1814;784;61,62,63,64;1841;61;2188,2189;3507;627;1067;61,1024;627;1742;1846;1814;162;162;512;833;162;1494;1846;1841;1494;3694;509;1791;656;61,412,1220;1743;453;3604,3605;452;495;811;627,1024,1494;1131,3580;3093;1841;600;61,1562,3203;1839,1841,1842;2180;1741;755;1846;1841;627;1841;1846;1252;1841;896;1494;627;61,62,63,64;515;1814;502;666;1745;349,350,351;3289;658;1246;2565;1556,1557;540,627;1562;1841;61,62;627;2448;1562;1468;580;1846;1494;1494;397;162;688;439;367,368,370,3002;1838;972,973;471;3318;1841,1842;972,973;1024;1494;2768;2768;964;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;61,62,63,64;1846;1430;2792;162;627;486;1846;627;626;2823;1494;1494;972,973;1841,1857;1841;2940;627;627;972,973;1277;1277;1277;1841;811;1846;3177;1841,1842;61,62;140,507;964;1277;1277;1277;1494;61,62,63,64;2056;1329;1494;1846;2163;1983,1984;1277;1846;1846;486;61,62,63,64;1494;316;1494;2946,2947;1494;1814;811;1377;1277;101,1580,1661,1663,1664,1665,1666,1674,1675,1676,1677,1678,1679,1680,1681,1682;1494;1814;61,62,63,64;1268;1841;1846;447;1841;1494;61,1742;1494;1494;972,973;1602;1455;1814;3504;1084;1277;944;2191,3992,3995;1814;964;136,216;656;1277;1884,1885;1884,1885;2228;1846;833;394,1155,1156;1494;627;414,1846;162;1791;627;502;1593,1594,1595;397;1846;1841;2137;1073;162;397;394,1155,1156;292;2023;1494;1841,1857;394;627;3145;1846;1841;1841;1131,3580;402;1377;1350;1128;134;1841;1841;811,1671;250,254;1846;1846;2313;627,1494;941;1494;502;162;61,1756,1908;811;61;61,62,63,64;61,62;425;1846;1791;1884,1885;627;162;2792;1814;61,62,63,64,1889;1884,1885;394,1155,1156;1494;2792;1846;162;1814;3604,3605;2674;941;1814;823;1251;3712;1494;811;1846;666,1562;3674;-1524;394,1155,1156;627;301,302;502,515;1814;500;1876,1877;1743;1494;1838;1841,1842;1494;1494;627,939;1494;2365;1884,1885;1884,1885;1884,1885;1884,1885;1494;162;64;1846;1814;61,62,63,64;2939;650;61,512,1743;1494;627,2318;1277;2489;1098,1286;1741;61,62,63,64;737;394;61,62;656;964;1846;1458;1841;61,62,63,64;1814;338,3951;1494;3955;626;61;61,62,63,64;2048;811;688;1377;2456;2919,2920,2921;61,62;1277;162;1562;1494;1841;162;1494;566;1841;416,1846;1846;627;918;3368;1494;61,62,63,64;930;1833,1834,1835,1836,1882;1277;1792;454;1841;1056;61;61,3126;840;840;1494;964;964;1814;811;1841,1857;3675;394,1155,1156;500;134,2825;1814;1884,1885;61,62,63,64;61,62,63,64;435;1458;944;627;627;438;61,62;1791;1494;1494;1449;1841;1814;1846;61,454,1906,1908;1846;1494;1494;1465,1478;162,1253;394,1155,1156;650;1494;1846;1846;1323;2552;1841;1494;811;502,1128;409;162;1846;1846;1494;972,973;1846;1744;1791;3362;894;61,1102,1103;162;2429;61,1745;688;1494;1494;1562,3380;1277;162;1846;433;1494;1494;2816;1743;1562;627;447,1803;1494;546,656;2670;394,1494;1841,1842;406,1814;1841;656;1494;1841;1494;61;2389,2390;2717;61,62,63,64;1846;162;627;487;964;1494;1494;1106;1884,1885;1884,1885;1884,1885;1884,1885;863,1353;162;162;1814;1846;515;3604,3605;627;1494;447,1803;1743;1494;687;61,62;61,62,63,64;61,62,63,64;1884,1885;929;162;1846;439;162;1742,1743,1744;972,973;1841,1858;1814;61,62,63;1814;811;162;1494;162;1752;1814;2792;2020,2021;1841;1841;1846;3026;1494;162;575;346;61;1884,1885;485;4000,4001;840;3731;964;661;1884,1885;434;1024;1846;1494;2792;1277;61,62;1405;658;1128;627;1458;1846;2012;1841;1274;1696;394;1841;1841,1857;1494;1846;1814;784;2298;3337;2812;627;218,219;1846;1846;1743;1741;1846;447,1501,1549,1550,1551,1552;627,2258;1323;402;162;1814;1814;2701;1562,3427,3428,3429,3430,3431;61,62,63,64;1494;1355;3604,3605;447,1803;1377;2489;627;434;1841;1494;2309;1278;1494;134,2505;1265;1038,1039,1040;2105;140;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;1884,1885;174;61,62;1841;61,62;61,62;61;1494;2133;414,1846;1814;688;502;1846;1846;3026;162,3194;650;627;1494;1204;1846;1841,1858;1841,1858;1814;918;1450;626;1884,1885;3325;1745;1841;91;1494;1494;833;1494;394;61,2816;507;2012;61,840;627;1841;599;101;1377;394,1155,1156;1494;1805,1806;61,675,676;2258;811;2351;1317;61,74;61,74;1884,1885;1494;658;394,1155,1156;1846;61;1135;1494;1846;1494;1846;1277;394;533;1106,1358,1744,1749;1494;1494;1846;3674;1846;941;1494;162;811;1884,1885;1884,1885;1846;162;163;3870;2189,2192;533;61,62,63,64;1742,1743,1744;1846;3604,3605;1742;3677;524;3026;1211;1884,1885;1745;1131,3580;3255;439;1791;2792;1846;162;1211;1494;414,1846;189,190;1128;1494;2842,2843;2671;1743;1377;402;1814;162;162;1841;61,62;1814;1494;1846;1494;342;2692,2693;1884,1885;1494;3604,3605;1846;1494;1961,1962;433;3674;1775;1494;595;1884,1885;447,884;397;1846;737;61,62,63,64;1841;1494;626;811;1841;3562;1494;814;1884,1885;394,1155,1156;1846;61,62,63,64;1846;61,1562,3203;1846;1846;1494;406,1846;379,380,396,397,3975;1131;61;61;1494;1814;1846;2180;1494;1494;381,382;1494;1884,1885;3604,3605;458,486,788,1745;394,1155,1156;1494;1494;409,626;3604,3605;3604,3605;658;3519;134;780;1458;134;627;62;1562;1846;61,1220,1261,1790;634;811;1458;1138;1846;1846;3204;1494;1846;1744;3604,3605;2666;394;1413;2972,3183;1494;626,1106;1846;1846;1377;3604,3605;1412;1846;1562;1846;502;3604,3605;1494;3604,3605;1846;1745;2498;1841;1377;3604,3605;1106;162;811;811;61;2074;61;3604,3605;627;998;1494;3606;162;1494;634;1494;1846;91;452,626;1884,1885;159,1660;1846;921;3604,3605;62;1884,1885;512;929;3433;1494;578;439;3604,3605;1846;951;823;1846;627;3604,3605;1846;1494;3604,3605;1494;230,231;61,74;634";
        const arglistRefs = $scriptletArglistRefs$.split(';');
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","71,72","moonfile","^moonfile-[a-z0-9-]+\\.com$","71,72",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","71,72","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","71,72","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","71,72","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","71,72","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","71,72","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","134,1562,2531"];
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
[trustedJsonEditXhrRequest,setConstant,trustedReplaceArgument,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedOverrideElementMethod,abortOnPropertyRead,trustedReplaceOutboundText,trustedSuppressNativeMethod,preventAddEventListener,trustedSetConstant,abortOnStackTrace,preventSetInterval,adjustSetInterval,abortOnPropertyWrite,noWebrtc,preventRequestAnimationFrame,noEvalIf,preventBab,trustedPreventFetch,disableNewtabLinks,trustedJsonEditFetchResponse,preventInnerHTML,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditFetchResponse,preventClipboardWrite,jsonEditXhrResponse,xmlPrune,m3uPrune,trustedPreventXhr,trustedEditInboundObject,spoofCSS,alertBuster,preventCanvas,jsonEditFetchRequest,proxyApplyConfig,mpegdashPrune];
    const $scriptletArgs$ = /* 3402 */ ["[?.context.client.userAgent*=\"channel\"].context.client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/player?","[?.context.client.userAgent*=\"lactmilli\"]+={\"params\":\"8AUB\"}","[?.context.client.userAgent*=\"yahi\"]+={\"params\":\"YAHI\"}","[?.context.client.userAgent*=\"instream\"].playbackContext[?.contentPlaybackContext]+={\"adPlaybackContext\":{\"adType\":\"AD_TYPE_INSTREAM\"}}","[?.context.client.userAgent=/channel|lactmilli|instream/].playbackContext.contentPlaybackContext.lactMilliseconds=\"${now}\"","[?.context.client.userAgent=/adunit|channel|lactmilli|instream|inline|yahi|eafg/].playbackContext.contentPlaybackContext.referer=repl({\"regex\":\"(?:#reloadxhr)?$\",\"replacement\":\"#reloadxhr\"})","ytcfg.data_.EXPERIMENT_FLAGS.all_web_enable_network_machine","false","ytcfg.data_.EXPERIMENT_FLAGS.all_web_network_machine_raw_request","String.prototype.split","this","repl:/all_web_enable_network_machine=true&all_web_network_machine_raw_request=true/all_web_enable_network_machine=false&all_web_network_machine_raw_request=false/","condition","H5_async_logging_delay_ms=","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..data.viewer..nodes.*[?.__typename==\"AdsSideFeedUnit\"]","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..node[?.*.__typename==\"SponsoredData\"]","..nodes.*[?.sponsored_data]",".data[?.category==\"SPONSORED\"].node",".data.viewer.news_feed.edges.*[?.category==\"SPONSORED\"].node","Function.prototype.toString","Node.prototype.insertBefore","Element.prototype.insertAdjacentElement","Element.prototype.append","Element.prototype.prepend","Element.prototype.before","Element.prototype.after","Object.getOwnPropertyDescriptor","XMLHttpRequest.prototype","console.clear","undefined","globalThis","break;case","WebAssembly","atob","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","document.getElementById","0","json:\"body\"","ad-detection-bait","document.querySelector","-id-","scriptBlocked","blocked","testUrls","[]",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","Worker.prototype.postMessage","adblock","4000-","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","Object.prototype.hasRightPartnership","falseFunc","Object.prototype.hasLeftPartnership","Object.prototype.hasTopPartnership","Object.prototype.hasBottomPartnership","experimentOverrides","json:\"%5B%7B%20defaultValue%3A%20%22OFF%22%7D%5D\"","document.querySelectorAll","security.js","Document.prototype.createElement.call","noopFunc","OffscreenCanvas.prototype.getContext","=== false","Element.prototype.removeChild","/blocked|tick/","/click|load/","/document\\.location|pop\\.|exo|cookie|\\.php/","ok_","%22vt%22","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","MONETIZER101.init","/outboundLink/","Object.prototype.adService.initialize","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","pp_adblock_is_off","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","WP.prebid","onLoad","History","/(^(?!.*(Function|HTMLDocument).*))/",".call(null)","10","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","document.createElement","break;case $.","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","Object.prototype.renderDirect):matches-path(/\\/(?:weather\\/|pogoda\\/|hava\\/)/","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","freestar.newAdSlots","String.prototype.allReplace","executaGoogleAnalytics3","initJWPlayerMux","initJWPlayerMux.utils","initJWPlayerMux.utils.now","ambossAnalytics","ambossAnalytics.getUserAttribution","dataset.ready","script[src^=\"https://www.googletagmanager.com/gtag/js?id=\"]","Osano","Osano.cm","Osano.cm.addEventListener","Osano.cm.removeEventListener","pa.getVisitorId","googletag.setConfig","RISKX","RISKX.go","RISKX.setSid","Sentry.configureScope","baMet.register","Object.prototype.componentInScreen","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber","..node[?.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","adblock_added","setTimeout","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","adcashMacros","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","decodeURIComponent","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","shift","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.write","redirect","4000","inlineScript","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","btoa","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","AdservingModule","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","error","[src]","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","adblockcheck","!bergblock","overlayBtn","adBlockRunning","Date","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.protect_block","flashvars.video_click_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","alert","check","isBlanketFound","showModal","myaabpfun","sec","_wm","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","Pub2a","/adsbygoogle|initDetection/","block","console","send","ab_cl","V4ss","#clickfakeplayer","popunders","visibility","sadbl","aclib","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","MessageChannel","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","jwplayer.utils.Timer","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","adBlock","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","LIDetector","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion.homad.enabled","getHomadConfig","aud.springserve.com","<VAST version=\"3.0\"></VAST>","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","secondsLeft","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","tid","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","tp-time","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]","disabled",".btn-primary","focusOut","googletagmanager","suaads","/window\\.location\\.href|n/","8000","json:\"drall_Suaads_annersads_JS__randomAds\"","/randomAds|div-gpt-ad|divAdsInit/","json:\"ADs-1\"","json:\"click\"","visibilitychange","window.addEventListener","/visibilitychange|blur|pageshow|keydown|beforeunload|pagehide/","/\\$\\('|ai-close/","app_vars.please_disable_adblock","/scorecardresearch\\.com|outbrain\\.com|taboola\\.com|criteo\\.net|rubiconproject\\.com|adform\\.net|casalemedia\\.com|adservice\\.google\\.com/","shouldOpenPopUp","/blur|focus/","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","remainingSeconds","mode:no-cors","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","http","Element.prototype.closest","rel","chp_ad","document.documentElement.lang.toLowerCase","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","localStorage._d","blank","google_srt","json:0.61234","vizier","checkAdBlock","xnjThB","googlesyn","displayAdBlockerMessage","pastepc","checkMockObjects","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","isTabActive","HTMLAnchorElement.prototype.click","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","clicked","charCodeAt","decodeURIComponent(escape","clicksCount",".data.isAdsEnabled=false","/api/files","document.createTreeWalker","json:{\"acceptNode\": \"function() { return NodeFilter.FILTER_REJECT; }\"}","if","prevent","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper",".downloadbtn","zigi_tag_id","self.Math","setCookie","advertisement3","start","AdLink","!buzzheavier.com","removeChild",".href","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","/seconds--|timeLeft--/","json:\"main\"","/div-gpt-ad-dgking|\\.GoogleActiveViewElement/","/div-gpt-ad-|\\.adsbygoogle/","json:\"container\"","adblock_detected","/pub\\.clickadu|bing\\.com/","a","\"/chp_?ad/\"","/blocked|null/","remaining--","json:\"header\"","/ad-chk|aads-frame/","!/document|window|const|var|let/","RegExp.prototype.exec.constructor","\"+\"","Function.prototype.constructor","anonymous@https","Document.prototype.addEventListener.call","HTMLElement.prototype.click.call","HTMLElement.prototype.click.apply","/document\\.createElement|window\\.open/",".cfd","script[data-domain=","document.body.appendChild(s)","document.head||","push","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","clearTimeout","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","document.body.appendChild(s","no-referrer-when-downgrade","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","appendTo:","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain",".ads_mode=\"0\"","/embed/settings",".ads_mode_dl=\"0\"","$+={\"ads_suppressed\":true}","/inlineScript|stackDepth:1/","Date.prototype.toISOString","wpadmngr.com","adserverDomain","AtcshAltNm",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","Document.prototype.querySelector","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral",".EnableAdmiral=false",".ShowAds=false","gnt.x.uam","interactive","gnt.u.z","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/admiral/","runtimeConfig.AM_PATH","CACHE",".indexOf","/runtime-config","__disableAds","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","..Admiral.isEnabled=false","..admiral=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","Element.prototype.setAttribute","/error-report|new Promise|;await new|:\\[?window|&&window,|void 0\\]|location\\.href|void 0\\|\\|window|,window,|void 0,window|,window\\]|\\)\\.join\\(String\\.fromCharCode|adShieldError/","script[id][onerror]","asap stay","loadShield","Range.prototype.createContextualFragment","json:\"<script></script>\"","html-load.com",".scriptLoader.*[?.id==\"ad_stack_split_provider\"]","adLight","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/content-loader\\.com|css-load\\.com|html-load\\.com/","json:\"setTimeout((()=>{if(!location.pathname.startsWith('/game'))return;const t=document.getElementById('question-label');t&&(window.animation=lottie.loadAnimation({container:t,renderer:'svg',loop:!0,autoplay:!1,path:'/assets/animationsLottielab/gameDots.json'}))}),1e3);\"","__cfRLUnblockHandlers","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","features.ad02 features.adshield","AHE.is_member","AppBootstrapData.config.adshieldAdblockRecovery","AppBootstrapData.config.adshieldNativeAdRecovery","AppBootstrapData.__initializeFeatures__.adshieldAdblockRecovery.enabled","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","..adshieldAdblockRecovery.enabled=false","/error-report|nowprocket/","loadRecoveryScripts","autoRecovery","Object.prototype._adShieldLoaded",".featureFlags.*[?.featureName==\"AdShield\"]","/configs","Object.prototype.htmlLoadScriptService.loadScript","HTMLScriptElement.prototype.onload","..AdShield.isEnabled=false","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","__aaZoneid","DoodPop",".check=false","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","#downloadvideo","ads playerAds","..allowAdblock=true","displayLayer","adId","pop_init","adsbyjuicy","np.detect","/^mshta |^msiexec |^(bash <<<|curl -kfsSL) \\$\\(echo .+? base64 -d\\b|^cmd \\/c .*?\\bcurl .+?(\\.exe|\\.bat)\\b|^cmd .*?\\bfor \\/f .*?\\bdelims .*?\\bpow |(^|\\\\)powershell(\\.exe)? .*?-w(indowStyle)? h(idden)?\\b|(^|\\\\)powershell(\\.exe)? .*?-w[a-z]* m[a-z]* |(^|\\\\)powershell(\\.exe)? .*?-NoP\\b|(^|\\\\)powershell(\\.exe)? .*?-e(xecution)?p(olicy)? b(ypass)?\\b|(^|\\\\)powershell(\\.exe)? .*?-e(xecution)?p(olicy)? u(nrestricted)?\\b|(^|\\\\)powershell(\\.exe)? .*?\\biex\\(|(^|\\\\)powershell.+?Invoke-Expression|(^|\\\\)powershell.+?Invoke-WebRequest|(^|\\\\)powershell.+?-UseBasicParsing|^cmd .*?\\/c .+? -nop .+? iex\\b|^(cmd|powershell)\\b.+?recaptcha|^(cmd|powershell)\\b.+?#(Verification|     )|^(cmd|powershell)\\b.+?     #|^osascript .+?\\bcurl http|^curl -s\\b.+?\\| (bash|sh|zsh)\\b|^\\/bin\\/(bash|sh|zsh) -c\\b.+?\\bcurl|^bash -c\\b.+?\\$\\(curl|^python3? -c\\b.+?\\b(exec|urllib|subprocess)\\b|^echo .+?base64 .+?\\b(bash|osascript|z?sh)\\b|openssl base64 -d|^curl\\b .+?chmod \\+x.+?&&|^(bash|sh|osascript)\\b.+?recaptcha|^(bash|sh|osascript)\\b.+?#(Verification|     )|^(bash|sh|osascript)\\b.+?     #|^wget .+?\\| (bash|sh)\\b|^curl\\b.+?-o\\b.+?\\/tmp\\/.+?&&|^nc .+?-e \\/bin\\/(bash|sh)\\b|^\\/tmp\\/.+?chmod \\+x.+?&&|^wget -q.+?\\.(sh|py|bin|elf)\\b|^cmd .+?\\bcertutil .+?\\b(\\.exe|\\.bat)\\b|(^|\\\\)powershell(\\.exe)? .+?\\birm .+?\\.[a-z]+\\/.+?powershell|\\bpcalua(\\.exe)? .*?\\b(curl|powershell|saps|cmd)\\b|^cmd .+?\\bcmdkey .+?\\bschtasks|^Invoke-Command .+?Base64String|^c(onhost|md) .*?--headless |^iex\\(i(rm|wr) |^irm .+? iex\\b/msi","domAlert","Beware, uBlock Origin blocked a potential ClickFix attack: ${text}","excludeMatches","/Maintainer|Contributor|^\\{|^http|^(git|import|require|use) /i","Beware. uBlock Origin blocked a potential ClickFix attack: ${text}","dataset.zone","length:40000-60000","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","api/v1/detail","xmxalr","HTMLIFrameElement.prototype.contentWindow","reklama-flash-body","/scoreUrl|pingUrl/","appPageData.appAds","appPageData.appAdsHandles","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.ad.adBlockerDetectorEnabled","..adBlockerDetectorEnabled=false","history.replaceState","data.[].relationships.advert data.[].relationships.vast","offers","/#EXT-X-DISCONTINUITY\\n(?:#EXTINF:.*,\\n.+?adType=preroll[\\s\\S]+?)(?=#EXT-X-DISCONTINUITY)/gm","/.*\\.m3u8/","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json",".*[?.adId]","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","xml","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best","pop_","POP_URL","repl:/\"popactive\":true/\"popactive\":false/","[style*=\"z-index\"]","(!1)","backRedirect","adv_pre_duration","adv_post_duration",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","data.header_script data.footer_script data.direct_link_ads data.direct_link_ads_vip_1 data.direct_link_ads_vip_2 data.direct_link_ads_play_vip_2 data.direct_link_ads_zoom_vip_2","/config","createAgeModal","Object[_0x","adsPlayer","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","a[target=\"_blank\"][rel*=\"sponsored\"]","shopeeLinks","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","clientSide.adbDetect","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","Pop","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","!vidmoly","anchor.href","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]]/@mediaPresentationDuration | //*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]]//*[name()=\"Period\"]/@start | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]])","ssaiInfo","data.attributes.ssaiInfo","/videoPlaybackInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","/atob|overlay/","vads","doSecondPop","a[href][onclick^=\"getFullStory\"]","!newdmn","parentNode.removeChild","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","ai_run_scripts","clearInterval(i)","xpv","xpv.v",".clientHeight===0","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","__spotSettings","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","xv.conf.dyn.ads","xv.conf.dyn.excld","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"https:\")]])","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","function","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","contador","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","detector_launch","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","/(?=^(?!.*(http)))/","()=>","$onet","adsRedirectPopups","canGetAds","method:/head/i","Storage.prototype.setItem","bannerDismissed","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","fallback.ssaiInfo manifest.url","fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])][not(.//*[name()=\"AdaptationSet\"][@contentType=\"text\"])])","/dash.mpd","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","arrvast","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","Object.prototype.rekids","Object.prototype.gafSlot","Object.prototype.advViewability","WP.inline","/getComputedStyle[\\s\\S]*?style\\.display=\"none\"[\\s\\S]*?styleBlocked[\\s\\S]*?detected/","__headpayload","WP","r https","WP.gaf.loadBunch","Object.prototype.loadBunch","Object.prototype.bodyCode","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1",".access=true","/no_ads/config","/zefoy\\.com\\S+:3:1/","/getComputedStyle|bait/","AController_3","json:\"div\"","ins",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST",".props.pageProps.page.blocks.*[?..resource^=\"nc-ad\"]","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","searchCount","empire.pop","empire.direct","empire.directHideAds","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","ssaiInfo fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"_ad\") and contains(text(),\"creative\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","criteo","HTMLImageElement.prototype.onerror","++","\"flashtalking\"","war:32x32.png","triggered","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","powerAPITag","rodo.checkIsDidomiConsent","newAdblockBoardDisplayed","protection","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","window.ts","/googlesyndication|googima\\.js|imasdk/","__brn_private_mode","download_click","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick",".Playlist.ContentBreaks.*.TimeCode=\"99:59:59:999\"","/playlist","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","Node.prototype.removeChild","/^\\[object HTMLImageElement\\]$/","/emojis8\\.js:/","/attachonce == false/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","tmDetectAdBlocker","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","data_source_modules.*.module_data.search_response.products.[-].sponsored_ad.ad_source","/pages/slp","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","sandDetect",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","/#EXTINF:[^\\n]+\\n[^\\n]+?\\/preroll\\/[^\\n]+/gms","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod",".streams.*.adUnits=[]","/manifest/video","/#EXTINF[^\\n]+\\n[^\\n]+?segment[^\\n]+/gms","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","a[href][onclick^=\"window.open\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","/ethicalads\\.io|nitropay\\.com/","HTMLImageElement.prototype.onload","img","Image.prototype.complete","2d","Element.prototype.getBoundingClientRect",".length","HTMLImageElement.prototype.naturalWidth","240","#artifactFileContent","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","playerEnhancedConfig.run","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","sentry","showTav","document['\\x","showADBOverlay","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","JSON.stringify","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","/inter","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","grecaptcha.ready","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","moa_id","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising.ad_server","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","cloudflareinsights","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","location.reload","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","HTMLScriptElement.prototype.setAttribute","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","Array.prototype.includes","adblockTrigger","20","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","rot_url","pop_type","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","google-ca-pub-4459622307906677","wbDeadHinweis","()=>{var c=Kb","0.2","__venatusLoaderInit","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","googlesyndication.com","repl:/blank/self/","stoCazzo","fetchAdsScript","_insertDirectAdLink","/doubleclick|atob|return new Promise|aHR0c/","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","custom_ads","/settings","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","/googletagmanager|ip-api/","&&",".ads={\"movie\":false,\"series\":false,\"episode\":false,\"comments\":false,\"preroll\":false}",".preroll.ad",".preroll.countdownSec=0","()=>j(e=>e-1)","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/createElement|addEventListener|clientHeight/","uberad_mode",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","DMP_ENABLE_ADS","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","link.click","document.body.style.overflow","fallback","!addons.mozilla.org","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","/googlesyndication\\.com|offsetHeight/","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","/Werbeblocker|refresh\\\\/","cwAdblockDisabled","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","pbjs.libLoaded",".features.pv=false","/playerConfig","flashvars.adv_pre_url","()&&","Object.prototype.adBlockerPop","BACK","wgAffiliateEnabled","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","vglnk","clkUnder","adsArr","data.getFinalClickoutUrl data.sendSraBid","data.getAd","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","steamBanner clickAds clickAdsUa clickAdsRu pushNotification","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","En(e-1)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","adClickThrough","..showAds=false","ad_blocker_detector","._$",".result.items.*[?.content*=\"'+'\"]","/comments","img[onerror]","KAA.state.revspot","enforceVideoShield","/initPops|popLite|popunder/","__US_CONFIG__.ads.adblock_measure_enabled","__US_CONFIG__.ads.adblock_wall_enabled","__US_CONFIG__.ads.urls","[?.type==\"ads\"].visibility.status=\"hidden\"","..suppress_ads=true","messages.*.ads messages.*.renderedAdsHtml","TextDecoder.prototype.decode","/<template data-assistant-ads-html=\"\"><aside aria-label.+?<\\/aside><\\/template>/","shouldRun","ad-ipd","smartclip","window.getComputedStyle","maddenwiped","/redirect.php?","*.*","/api/banners","checkBanners","__SSR_CONFIG__.monkey","__revCatchInitialized","json:\"none\"","ab.dt","/^[a-zA-Z]{15}$/","data.initPlaybackSession.adScenarios data.initPlaybackSession.adExperience.adExperienceTypes",".data.initPlaybackSession.adExperience.adsEnabled=false","ConFig.config.ads","json:{\"pause\":{\"state\":{}}}","Object.prototype.adblockPlugin","initializeNtvxSheet","fireAd","juicy_tags","!youtu","injectAd",".isAdFree=true","resumeGame","/admaven|adspyglass/","__tcfapi","ezRewardedAds.requestAndShow","timeout","/eeea5e31|new\\s+Function/","timeLeft--","source.ads","/player",".props.pageProps.globalData.publisherFeatureFlags.enableAdBlockDetection=false",".props.pageProps.globalData.publisherFeatureFlags.enableHardAdBlockDetection=false",".adsEnabled=false","/access","adsterraSmartLink adsterraSmartLink2","/^[a-zA-Z]{12}$/","/popup/i","length:1000-1010","/_0x|window\\.open/","Advert","popup-dialog-id","utilAds","/^a$/","/ADBLOCK|ADSENSE/","pubads.g.doubleclick.net","sponsor ad_provider","api.openlua.cloud","script-error","Element.prototype.remove","probe","HTMLElement.prototype.remove","/adsbygoogle|google-analytics|ads-twitter|doubleclick/","String.prototype.replace","decideForPlacement","=void 0","/\\{[a-z]+\\(\\)\\}/",".value||",".value&&","bf-ad.net","poseidonAdBootstrap.freestarReady","cue_points","/playback","..ads_enabled=\"0\"","data.promotions","__kbAdBait","OzB.adb","/offsetHeight|getComputedStyle/","Object.prototype.special","foxizParams.adDetectorMethod","String.prototype.startsWith","/^\\/contact-us\\/$/","()=>e()","sponsored_ads","tag.min.js","..playGateQueue","playerHeadScriptSnippets","/api/config","shaman",".stories.*[?.storyType==\"ad\"]","cykloStories","innerHTML.length:0","isBlocked","/adblock|Error|getComputedStyle/","/click|pointerup/","handleUserAction",".bannerConfig..advertise.*","/\"features\":\\[/","\"features\":[\"ads-shutdown-nativeAds\",\"ads-shutdown-displayAds\",","/\\/owa\\/startupdata\\.ashx/","client=ca-pub-",".pub-slot-wrapper","top","0px",".showModal","triggerPopunder","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","method:POST body:/content_view|impression|page_view/",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","linkfire.tracking","method:POST body:/pageview|engagement/","body:pageview method:POST","svc.webex.com/metrics","/i/api/1.1/flow/viewer.json","/i/api/1.1/flow/timeline.json","{\"skipToString\":true}","faro.civitai.com","method:POST body:/\"track\"|adblock/","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/","igniteseurope.com/stats/","litix.io","/hpyjmp|marzaent/","brightline.tv",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive","json:\"https://\"","data:video/mp4",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_id=1","/track-playback",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_url=\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"","$..durationInSeconds=0","-ssai-vod-","Period:has(> EventStream[schemeIdUri=\"urn:sva:advertising-wg:ad-id-signaling\"])","/dash"];
    const $scriptletArglists$ = /* 4002 */ ";0,0,1,2;0,3,1,2;0,4,1,2;0,5,1,2;0,6,1,2;0,7,1,2;1,8,9;1,10,9;2,11,12,13,14,15;3,16,17,18;4,19,20,1,2;4,21,20,1,22;5,19,20,1,23;6,24,25,26;6,27,20,26;6,28,29,23;7,24,25,30;7,31,25,30;7,31,25,32;8,33,34;8,33,35;8,33,36;9,37;7,31,25,38;9,39;5,40,20,1,41;10,42;9,43;10,44;10,45;11,46,1,41;11,44,1,41;11,47,1,41;8,33,48;8,49,36;8,49,48;8,50,36;8,50,48;8,51,36;8,51,48;8,52,36;8,52,48;8,53,36;8,53,48;8,54,36;8,54,48;8,33,55;8,33,56;8,49,55;8,49,56;8,54,55;8,54,56;8,51,55;8,51,56;8,53,55;8,53,56;8,50,55;8,50,56;8,52,55;8,52,56;12;1,57,58;13,59,60;13,61,62;14,63;14,64,65;15,66,67;14,68,69;14,70;14,71;12,72;13,73,74;1,75,58;13,76,77;16,78,79;15,80,81;15,82,81;14,83;2,84,85,86,14,87;2,88,85,86,14,89;1,90,9;1,91,9;1,92,93;15,94;14,95;17,96,97,98;16,99,20,20,100,101;2,102,85,103,14,104;18,105,106;19,107;15,108;15,20,109;16,110,111;2,112,85,20,14,113;16,114,115;20,116,117,118,14,119;2,116,85,120,14,121;2,122,85,120,14,121;16,123,124,125;15,126;1,127,58;16,128,129;21,130,131,132;22,133,134;1,135,136;1,137,136;1,138,136;1,139,136;23,140,141;24,142,143;1,144,145;1,146,58;25,147;24,148,149;22,150,151;12,152;16,153;19,154;5,155,20,1,156;1,157,145;19,158;3,159;1,160,145;16,161,162;14,161,162;1,163,145;1,164,165;3,166,67;1,167,165;1,168,145;17,169,170;1,171,172;9,173;16,174;1,175,145;1,176,177;1,178,145;14,179;1,180,165;26;1,181,145;1,182,145;1,183,145;1,184,145;1,185,145;1,186,177;1,187,145;1,188,145;16,189;25,190;16,191;16,192;3,193,194;17,195,196;17,197,198,98;13,199;1,200,20;14,201;14,192;24,202,203;24,204,205;15,206,207;16,208;1,209,177;1,210,177;1,211,177;26,212,20,213;14,214;1,215,177;14,216;1,217,145;14,208;1,218,145;1,219,69;1,220,177;1,221,177;3,222,223,18;3,224,225,18;1,226,93;1,227,145;14,228;1,229,145;1,230,145;1,231,145;1,232,177;1,233,145;14,234;19,235;1,236,145;1,237,145;1,238,145;1,239,177;1,240,69;13,241,242;1,243,177;1,244,145;1,245,177;1,246,145;1,247,20;19,248;1,249,177;1,250,145;1,251,177;1,252,145;1,253,145;1,254,177;1,255,145;1,256,145;1,257,177;1,258,177;1,259,177;1,260,177;1,261,177;1,262,177;1,263,145;1,264,145;3,265,225;1,266,177;14,267;26,268,194;1,269,177;1,270,145;22,271,272;1,273,177;1,274,145;1,275,145;1,276,145;3,277,278;3,279,194;1,280,177;1,281,145;1,282,177;1,283,145;2,88,85,284,14,285;1,286,58;1,287,69;1,288,177;1,289,145;1,290,177;1,291,93;1,292,177;1,293,145;1,294,145;1,295,145;1,296,177;1,297,145;1,298,145;1,299,177;1,300,93;1,301,177;1,302,145;1,303,145;1,304,145;1,305,145;1,306,177;1,307,145;3,308,225,18;1,309,177;1,310,20;1,311,177;1,312,145;1,313,145;14,314;1,315,177;1,316,145;1,317,177;1,318,145;1,319,145;1,320,177;1,321,145;1,322,145;1,323,177;1,324,145;1,325,145;1,326,145;1,327,177;1,328,145;3,329,194,18;3,330,225,18;1,331,145;16,201;3,332,194,18;1,333,177;1,334,145;16,335;3,193,336,18;3,193,337,18;1,338,145;15,339;1,340,177;1,341,145;1,342,177;14,343;1,344,145;1,345,177;1,346,145;1,347,177;1,348,145;1,349,177;1,350,145;1,351,177;1,352,145;1,353,145;23,354,355;1,356,9;3,16,278,18;3,357,358,18;1,359,177;1,360,145;1,361,145;3,362,194,18;14,363;1,364,177;1,365,177;1,366,145;1,367,145;1,368,177;1,369,145;1,370,145;1,371,9;1,372,145;1,373,145;1,374,177;1,375,145;1,376,145;1,377,58;1,378,145;1,379,145;1,380,145;1,381,145;22,271,20,382,383;1,384,177;1,385,145;1,386,177;1,387,145;1,388,177;1,389,145;1,390,69;2,391,392,393,14,394;1,395,177;1,396,145;1,397,145;1,398,69;1,399,9;1,400,145;1,401,165;1,402,392;1,403,145;1,404,177;1,405,177;1,406,145;1,407,177;1,408,145;22,133,409,382,410;1,411,177;1,412,177;1,413,145;1,414,145;1,415,145;1,416,145;1,417,177;1,418,145;1,419,145;1,420,145;1,421,145;1,422,145;1,423,58;1,424,58;1,425,58;1,426,58;9,427;4,428,20,1,429;22,133,430;25,431,67;9,432,433;22,133,434;25,435,436;16,437;1,438,85;16,439;1,440,20;25,441;19,442;9,443;6,444,177,445;6,446,177,445;6,447,177,445;9,448,449;9,450;9,451;5,452,20,1,445;10,453;11,453,1,41;19,454;19,455;22,20,441;15,441;1,456,172;13,457,458;13,459;15,460;15,461;19,462;2,36,85,463,14,464;3,20,436;19,465;27,466;1,467,58;28;19,468;13,469;16,470;22,271,471;27,472;13,473,465;19,474;19,475;19,476;27,477;19,478;22,271,479;22,133,480;15,481,482;19,483;19,484;27,485;14,486;1,487,145;13,88,488;13,76,489;3,490,194;19,491;19,469;22,133,492;19,493;19,494;13,495,496;19,497;24,498,499;13,473,500;27,469;27,501;19,502;19,503;22,133,504;22,133,505;14,174;1,506,69;1,507,145;16,508;13,473,509;13,510,511;19,512;19,513;13,473,514;27,515;27,516;13,517,518;19,519;22,20,490;13,473,520;22,20,521;13,522,523;19,524;15,496;13,241,496;27,513;19,459;13,457,525;19,526;19,527;27,528;27,529;13,84,530;3,531,532;24,492,533;17,534;19,535;22,536,537;19,538;13,473,539;13,473,540;13,473,58;19,541;19,542;1,543,9;19,510;13,492,469;19,544;19,545;19,546;1,547,20;1,548,9;27,549;1,550,69;27,551;27,552;27,553;1,554,69;19,555;13,473,521;19,75;27,556;19,241;17,557,558,559;1,560,165;3;27,561;22,20,469;19,562;1,563,9;19,564;13,526;19,565;13,566,567;27,568;25,569;13,473,570;26,571;19,572;19,573;27,574;15,575;1,542,69;19,576;15,577;19,578;1,579,145;1,580,69;27,581;22,271,582;22,583,584;13,241,585;27,586;13,76,587;1,57,165;1,588,20;1,589,20;1,590,392;22,591;15,592;19,593;15,594,595;1,596,69;19,597;22,20,598;13,473,599;1,600,20;19,601;24,442,602;22,133,603;29,604;22,605;24,241,606;19,607;1,608,145;1,609,172;24,88,610;3,611,612;3,613,482,18;1,614,69;15,615,85;1,616,145;1,59,172;19,617;1,108,9;13,618,500;1,619,69;13,457,620;27,621;1,622,136;22,20,623;19,624;15,625,482;13,495,482;15,626,627;19,628;13,62,511;1,629,69;13,241,630;25,490;22,20,631;19,632;27,633;1,634,9;19,635;13,636;13,62,637;13,638,639;19,57;22,640,641;15,642;19,643;19,644;30,645;19,646;19,647;19,648;1,649,145;13,84,58;1,650,145;27,651;3,652;26,653;15,88,225;19,654;19,655;19,656;13,522,657;27,658;27,659;1,660,9;15,661,662;1,663,69;1,664,9;26,665,666;13,491,108;22,133,667;26,668,595;27,669;27,526;19,670;22,271,641;19,671;1,672,9;22,133,595;13,142,584;13,62;19,673;13,674,675;27,676;22,133,441;13,457,677;19,678;1,679,9;19,619;15,142,482;13,510,62;19,680;27,681;15,682;15,683;19,551;30,526;1,684,20;15,522,85;22,685,686;22,20,642;13,457,572;13,572,687;19,688;19,689;19,690;1,691,69;1,57,145;15,661,595;19,692;22,133,661;22,693,694;13,695,534;27,696;17,697,698;15,699,225;13,700,701;1,702,9;12,631;19,108;13,703;22,20,704;19,705;1,566,69;22,706,707;27,708;15,709,710;13,619;13,495,711;16,712;13,713,714;15,715,595;22,133,716;13,473,717;1,459,69;15,718;22,20,719;15,719;22,720,20,382,721;13,473,461;27,75;15,722,278;22,723,724;15,725,67;13,495,88;15,726,595;12,727;13,457,728;12,729;1,730,177;1,731,20;19,732;27,733;13,84,108;1,734,145;19,735;26,736,595;19,737;1,738,9;14,739;15,740;3,741,194,213;1,108,145;1,742,20;9,194,743;12,20,207;13,36,62;13,572;27,744;14,745;1,746,58;13,473,747;1,748,9;1,542,145;19,749;15,715,750;15,751;19,752;22,723,753;19,754;14,755;1,756,145;19,757;13,492,572;22,640,758;1,759,69;12,760;13,510,761;19,472;16,762;1,763,9;19,764;13,84,765;14,766;1,767,145;22,20,768;27,769;15,770,278;13,473,771;19,772;26,20,773;19,774;26,20,20,85;15,775;13,84,776;14,777;13,778,531;13,473,778;19,779;24,728,780;22,536,781;22,723,782;13,573,783;19,784;22,536,490;13,495,785;19,786;27,787;15,490,595;19,788;13,522,241;27,572;17,789,790;13,791;13,62,510;13,492;13,391,792;27,511;17,793,794;19,795;19,728;25,796,482;15,279,797;13,473,798;19,799;1,572,172;19,800;22,801,631;1,802,69;19,581;19,803;27,804;17,805,806;26,807,194;1,808,9;1,809,145;22,271,810;15,811,67;13,581;19,812;22,133,813;13,814;1,815,58;19,816;13,473,469;22,133,817;15,521,225;15,818,819;14,820;27,808;15,821,85;26,822;13,84,823;13,824,825;1,826,9;19,827;19,828;19,829;15,830,482;16,279;1,831,9;27,832;15,833;25,834,482;27,835;15,490;1,836,9;12,837,207;13,84,838;27,839;1,62,145;22,20,840;19,841;1,842,145;15,843,392;1,844,145;13,84,279;1,845,145;14,762;22,723,846;13,517,511;13,391,847;19,848;3,849,532;19,850;19,633;13,473,851;1,108,392;1,852,392;15,853;17,854;27,855;9,856,857;13,858,781;15,473;15,859,482;27,643;27,860;15,811;13,84,861;1,862,85;1,279,69;27,863;22,271,864;19,865;13,866,645;1,867,69;27,868;15,441,85;22,20,869;15,870;1,871,145;13,457,872;1,538,392;13,495,873;13,495,874;27,875;13,573,873;13,76,876;19,877;24,517,878;15,879,880;25,881;17,697,882;27,883;13,241,884;15,437;13,457,885;22,271,490;1,886,9;16,174,762;19,842;15,887,67;19,888;19,889;19,890;15,521;19,891;27,892;26,20,20,18;1,893,165;13,894;13,492,534;19,895;1,896,69;24,897,533;1,898,20;1,899,58;1,538,9;15,811,436;19,900;13,84,901;1,902,69;13,84,903;13,84,904;15,905,595;15,906,482;19,907;27,908;13,473,909;13,473,910;13,473,901;15,902;13,84,911;13,473,912;13,84,913;27,914;16,192,124,125;15,172,532;22,133,915;22,133,916;13,522,661;15,715,358;15,917,278;26,862;1,918,85;19,919;15,920,358;15,715,223;22,271,758;12,921;27,510;19,922;1,923,9;13,473,108;16,924;15,925;22,926,927;15,928;1,929,145;13,473,930;15,715,482;13,241,931;13,517,62;1,932,69;27,933;3,934;27,935;13,695,585;27,936;1,937,9;1,75,145;1,938,145;15,728,358;15,500;27,939;15,940;1,941,145;15,942,595;1,943,69;27,937;22,133,944;25,715,225;19,945;19,946;22,947,948;27,949;19,950;24,241,533;17,534,951;3,952;27,953;1,954,69;13,498,637;13,473,955;25,956,957;1,958,20;19,511;13,473,959;1,914,69;1,960,69;15,961;14,279;15,962;13,824,271;13,84,963;13,190,701;19,964;12,965,85;1,966,69;1,700,69;26,653,194;1,967,9;22,536,968;15,969,666;1,970,9;15,971;3,20,20,213;15,972,67;15,973,436;22,271,222;19,587;1,974,85;1,832,145;19,975;26,652;15,976;26,20,20,213;1,977,85;22,271,631;19,978;19,979;13,75;13,473,980;12,981;19,517;13,982,242;13,638,768;26,983,482;27,984;22,985,768;1,986,145;13,73,901;1,987,85;22,271,988;12,108,392,989;16,990;22,271;1,991,9;13,992;13,993;13,994;13,995;22,723,996;19,997;15,998,392;12,999;13,855;19,1000;12,1001;1,1002,145;19,1003;19,1004;15,1005;1,1006,145;25,1007,482;22,640,1008;1,1009,9;19,232;13,457,781;13,728,1010;27,1011;1,521,9;19,1012;13,824,1013;19,492;1,1014,20;1,1015,20;1,1016,9;24,62,533;19,908;15,1017;13,84,1018;13,62,633;13,1019,490;15,1020;14,1021;14,1022;15,963,595;24,76,533;19,1023;22,723,1024;15,1024;13,473,776;15,897,482;1,1025,85;1,1026,69;1,1027,69;1,1028,9;15,108,1029;22,1030;19,1031;15,1032;15,172;13,241,1033;13,495,1034;19,1035;19,1036;19,1037;13,638,642;27,1038;1,1039,136;19,1040;13,241,1041;13,76,1042;19,1043;1,1044,69;1,1045,69;31;1,1046,172;24,84,1047;1,1048,69;1,1049,9;3,952,482,18;27,1050;19,781;19,1051;22,20,1052;15,441,627;13,84,1053;13,241,1054;13,84,1055;27,1056;19,913;13,824,661;12,470,392;19,1057;17,697,1058;19,1059;22,470,768;25,1060,482;15,1061;13,391,60;19,1062;1,1063,9;1,1064,9;15,1065;19,561;19,1066;22,133,1067;22,1068,490;19,1069;1,1070,69;13,530,790;19,1071;19,1072;1,1037,145;19,1073;30,1074;19,1075;27,1076;1,1077,69;19,1078;27,1079;1,1080,392;30,279;17,1081,1082;13,840,876;13,1033,876;27,1083;1,75,9;15,1084;12,279;1,1085,392;19,1086;27,1087;15,1088;1,1089,69;13,572,697;19,1090;13,1091;13,824,1092;1,1093,165;13,695,1094;13,73,1095;15,1096;16,1097;13,457,58;15,1098;27,1099;27,1100;22,723,1101;27,1102;13,473,872;13,1103,963;13,241,963;19,1104;13,84,1105;12,1106,207,989;27,108;1,1107,69;27,1108;22,1109,1110;13,473,1111;15,715;19,1112;9,1113;25,1114;13,73,1115;19,1116;13,241,598;19,1117;1,1118,69;15,872;24,430,1119;15,1120;19,1121;15,1122;15,1123,595;16,1124;1,958,58;13,560;22,20,1125;19,808;17,1126;19,1127;13,633,587;13,1128;16,1129;19,1130;15,1131;1,1132,20;22,947;1,268,69;27,1133;15,1134;25,1134;22,271,1135;19,1136;13,1137;13,241,1138;22,20,500;19,1139;25,559,750;25,1140;1,1141,58;22,1142,686;13,527,1143;22,133,1094;13,84,1144;15,1145;1,1146,69;27,1147;15,1148;15,20,392;22,20,1149;1,485,69;15,58;15,914,392;13,473,1150;27,916;13,473,1151;13,457,1117;15,808;1,1152,20;19,1153;1,1154,145;19,1155;13,457,108;26,1156;3,1156;19,1157;13,517,1158;15,661;22,20,1159;1,75,69;13,897,1115;13,457,1005;26,1160;1,1161,85;15,1162;14,192,124;19,1163;15,1164,595;25,768;25,776;19,1165;9,1166;26,20,194,85;1,542,165;15,998;22,271,781;13,473,495;13,84,1167;13,473,279;13,457,776;13,473,1168;19,1169;13,76,642;13,473,73;1,1170,69;14,1171;1,1172,177;14,1173;1,1174,9;24,1175,1176;6,1177,1178,1176;9,1179;1,1180,58;1,1181,9;1,1182,145;32,1183,1184;22,1185;9,432,1186;15,1187,662;15,91;13,1188;13,495,1189;13,1190;22,1068,1111;19,1191;13,473,1192;15,1193,85;15,661,1194;22,133,58;1,1195,9;22,723,1090;1,1196,177;22,133,768;15,1197;22,723,572;13,473,1198;13,84,1199;1,1200,69;1,437,172;13,241,108;14,1201;26,1202,482;15,1203,85;19,933;25,1060;25,790;22,1204;19,1205;13,473,572;19,1206;1,1207,9;15,615,880;1,1208,69;1,1209,69;12,1210;13,1211,781;33;27,1212;13,866,872;13,473,1213;17,1214;30,751;22,271,1215;19,1070;13,473,1216;13,76,511;13,473,492;22,271,20,382,1217;15,1218;14,437;1,1219,145;19,893;19,1220;1,1221,69;13,842;13,1222;17,697,1223;17,697,1224;17,697,1225;13,76,1226;19,1227;19,1228;13,517,1229;22,20,461;22,849,584;15,1230;24,895,1231;1,1232,172;15,768;13,142,362;19,1233;19,1234;17,854,1235;13,522,825;15,1236,67;13,88,1237;13,473,1238;15,1239;22,20,279;19,1131;13,473,1240;27,1241;22,271,1242;1,1243,69;15,1151;22,133,1244;25,437;1,1245,69;15,1246,482;16,1247;1,1248,9;13,473,1162;13,457,1162;15,1249;9,1250;15,1246;22,133,1251;1,1252,69;1,1253,69;13,492,108;1,1254,9;19,1190;19,1255;19,1256;13,241,1257;1,469,58;19,1258;1,1259,172;13,522,1260;13,457,271;1,1261,69;13,511,499;15,814;22,20,572;15,1262;12,1263;15,1264;26,668,194,18;19,1147;1,1265,172;1,437,165;1,1266,58;19,1267;12,1268;15,1269;15,701;26,1270;1,75,172;22,723,872;1,1271,392;19,1272;19,530;1,1273,9;19,1274;19,1275;13,62,490;15,913;19,1276;1,1148,9;9,1277;22,1278,1279;15,1280,85;15,279;13,473,1281;22,1282,1283;22,723,808;24,633,533;3,20,436,85;19,501;19,1284;1,1285,69;19,1286;12,1287;17,1288,1289;13,522,1162;13,522,1290;13,522,520;13,824,808;25,940;1,966,9;27,1291;1,1292,58;23,1293,1294,1295,1296;19,1297;26,849,194,213;15,913,595;2,1187,85,1298,14,1187;1,1299,165;23,442,1300;26,736,194,213;1,1301,85;3,1302,194,18;26,1303,194,18;26,1304,194,213;3,1305,194,213;19,1291;26,849,194,18;22,1306;22,814,1307;26,1308,194,213;30,1309;9,1310;3,1311,194;1,1312,69;13,522,1313;13,555,654;13,492,437;9,1314;9,1315;9,1316;30,1317;26,1318,194,18;15,1319;16,1320;13,1321,1322;15,1323;16,192,20,1324;1,1325,165;13,1321,940;16,1326;22,133,1327;13,522,1322;13,522,279;12,1328;1,1329,69;19,1330;17,1331,1332;17,1331,1333,98;17,1334,1335;22,814,1336;16,1337;26,822,194,18;19,993;24,88,1338;15,1339,1340;2,84,85,1341,14,1342;2,84,85,1343,14,1342;2,824,85,1344,14,1345;2,1346,85,1344,14,1347;26,1304,194,18;3,1348,194,18;26,736,194,18;22,723,704;15,1198;19,1349;16,1350,20,1324;22,271,1351;22,1352;22,133,1353;17,697,1354;22,723,1355;22,723,811;15,490,67;27,1356;17,1288,20,98;12,1357;1,788,58;3,1358;1,1359,9;1,1360,145;1,995,145;22,1361,641;22,1345,1362;16,1363;3,20,194,1364;20,511,1365,9;27,1321;24,442,1366;19,1367;26,1304,482,18;26,1304,1368,18;13,241,1355;19,994;26,1025,194,18;1,1369,69;22,1370,1371;1,913,1372;14,1373;13,1374,1375;22,723,625;15,907;26,1376,194,18;3,1111,194,18;30,441;19,1377;16,1378,1379;26,849,194;3,849,194;22,133,1380;19,1381;17,534,1382;30,968;24,84,808;12,20,1029;3,849,194,18;24,34,1383;1,1384,136;22,271,1385;3,1111,194;30,1386;22,723,1387;22,271,1388;22,271,20,382,1389;19,1327;19,1390;16,1391;14,1392;30,437;16,1393;12,1394;26,20,194,213;3,20,194,213;16,437,1395;1,1396,172;13,36,1397;22,271,1398;23,1399,1400;1,1401,177;15,1402;2,84,85,86,14,1403;16,1404;15,1405;13,142,1406;22,723,1407;22,271,241;1,1408,58;22,723,469;16,1409;16,1410;26,668;1,1411,69;18,1412,1413;17,697,1414,98;22,271,1415;26,668,482,18;22,814;3,20,627;13,495,975;24,695,808;1,1416,1296;13,62,1417;15,811,225;26,668,482;3,952,482;13,34,73;16,745;25,1328;13,495,1418;13,36,1033;22,271,469;22,271,1419;34,1420,1,1421;2,1422,1296,1423;22,271,1424;22,271,1425;10,1426;10,1427;16,1428;17,1334,1429;22,271,598;22,271,1094;12,1430;19,62;13,62,1431;13,703,1432;1,1433,69;19,1434;1,1435,20;12,1436;22,271,1437;22,271,1438;25,1439;13,241,808;24,84,1440;5,1441,20,1,1442;12,1443;14,1129,124;12,20,207,989;26,1444,194;2,88,85,1445,14,1446;2,142,85,1445,14,1447;2,84,85,1448,14,1449;16,1450;15,1451,662;21,866,1452;15,1453;26,1454,194;15,1187;22,1345;2,84,85,1455,14,1456;35,585,1457;13,1458,1459;13,1460,1459;24,824,1461;24,1462,1461;1,1463,145;1,1464,145;22,271,1465;12,1466;22,723,1467;13,241,1467;22,133,1468;13,241,1469;15,1470,67;15,206;1,1471,145;15,224,207;1,1472,9;15,1473;19,1474;24,76,884;24,73,1475;24,73,1476;24,73,1477;13,495,1478;1,1479,177;1,1480,145;13,1481;9,1482;20,62,117,20,14,1483;22,271,584;13,62,1484;13,1485,1484;20,62,117,20,14,1486;27,842;22,20,584;13,473,584;13,61,1103;22,20,1487;13,495,630;13,1488,630;13,241,1489;13,241,1490;22,133,1491;13,241,1492;15,1492;13,241,630,1493;21,1494,1495,1425,1496;13,241,1497;30,630;13,555,1498;19,1499;12,1500;19,1501;22,20,582;15,1502;24,241,1503;1,1504,20;19,1505;27,1506;13,654,526;25,470;1,1507,58;15,1094;27,1508;1,588;15,1096,595;13,76,1509;13,36,242;13,1510,242;22,20,242;13,76,242;13,517,1511;24,73,1512;13,36,1103;13,1513,242;24,430,1514;13,1374,1515;19,1516;19,1517;13,1103,36;13,1103,242;13,1019,60;13,510,1518;24,73,1519;13,76,1520;14,1521;34,1522,1,1523;34,1524,1,1523;34,1525,1,1523;24,587,1526;13,61,62,1493;22,723,500;13,1527,1528;13,59,1529,1493;13,522,1062;1,1530,69;13,530,1531;13,1513,1532;24,572,1533;13,34,60;13,522,1534;22,640,1535;12,1536;1,1537,93;15,1538;24,695,1539;22,1540,16,382,1541;1,1542,69;1,1543,1544;1,1545,145;22,133,1546;22,271,1546;26,1304;12,1547;1,1548,9;22,20,1549;15,523,595;30,1550;13,241,1550;30,1551;22,133,940;24,142,1552;19,1553;21,866,1452,1425;15,1554;27,1555;13,1165,1005;13,1165,1005,1493;22,133,1556;15,499;16,1557,124,1379;14,1557,124;22,723,1558;21,1559,1560,132,1561;1,1562,9;13,241,1563;1,1563,145;36,1564;36,1565;1,1566,58,1295,1567;1,1568,69;10,1569;10,1570;13,241,1571,1493;1,1572,69;22,720,1162;13,1563;1,1573;35,585,1574;22,1575;1,1576,58;24,510,1577;22,720,1578;22,133,1578;15,1578;4,279,20,1,1579;1,1580,69;10,1581;10,1582;36,1583;36,1584;36,1585;16,1586;15,1587;15,1588;15,1589;2,1590,392,20,14,1591;17,884,1592,1593;1,1594,145;2,1595,85,1596,14,1597;10,1598;1,1599,69;1,1600,145;1,1601,145;9,1602;2,1590,392,1603,14,1604;2,1590,392,1605,14,1604;30,1606;35,585,1597;2,1590,392,1607,14,1591;1,1608,69;1,1609,69;15,16,67;2,84,85,1610,14,1611;21,1590,1612,132;22,133,1587;13,241,1613;1,1121,145;9,1614;1,1615,392;1,1616,9;1,1616,9,1295,1567;1,1617,9;1,1617,9,1295,1567;1,1618,9;1,1618,9,1295,1567;1,1619,9;1,1619,9,1295,1567;37,1620,1,1621;37,1622,1,1621;35,585,1623;35,585,1624;9,1625;1,1626,69;38,1627,1,1628;1,1629,145;1,1630,58;36,1631;13,1632,1633,1493;1,1634,9;26,1635,194,18;1,1636,165;19,1637;27,1638;36,1639;17,682,1640;1,1641,172;1,1211,172;20,1642,1643,20,14,780;24,1644,490;1,856,93;12,20,392;23,1645,1646;1,1647,392;24,241,1648;22,133,1649;1,1650,85;13,473,517;30,190;3,1651,194,18;13,522,1529;25,108;17,854,1652;3,736;9,1653;36,1654;24,241,1655;22,271,1656;13,1657;19,1658;22,1659;39,1660,1661,1662,1663,1664;39,1660,1661,1665,1663,1664;13,241,1666;16,174,1667;16,1521;22,723,441;22,1361;4,1668,20,1,1669;22,723,1670;4,1671,20,1672;4,1671,20,1,1672;1,1673,69;1,1674,69;4,1668,20,1,1675;1,1676,20;13,1677;13,1211,1678;22,1540,1679;1,1680,177;1,1681,177;13,824,1682;4,1683,20,1,1684;4,1685,20,1,1686;16,1687;25,461;1,1688,9;1,1689,9;36,1690;13,1691,811;9,1692;9,1693;6,1694,20,1695;22,271,1696;13,824,500;40,1697,1,1698;10,1699;16,1700,1701;15,1702;1,1703,9;1,1704,58;22,271,1705,382,1298;1,1706,69;15,20,880;14,1707;22,133,610;15,1708;2,84,85,1709,14,1710;16,1711;15,1712;22,271,767;15,767;22,133,1713;22,20,1714;22,723,1715;1,1716,69;15,1717;1,1718,9;22,723,998;9,1719,1720;41,1721,20,1722;5,279,1723,1,1724;9,1725;9,1726;42,1727,1728;12,1729;13,495,108;22,20,1730;13,824,1731;2,866,85,1732;17,682,1733,98;25,1734;15,1735;27,1736;27,1737;15,625;22,271,1730;13,241,1738;13,638,442;12,1739;10,1740;13,824,1741;1,1742,93;24,495,492;22,1743,1744;23,1745,1746;4,279,20,1,1747;1,1748,9;1,1190,58;1,1749,69;5,1750,20,1,1751;24,241,1752;12,631,392,989;13,824,1753;15,1713;13,824,1031;1,1754,58;22,723,490;2,112,12,1755,14,1756;12,1757;22,271,495;22,271,1758,382,1759;18,1412,1760;22,271,1761;1,1762,165;15,1763;1,1764,9;13,457,430;13,522,872;1,1765,9;19,1766;13,84,1767;19,1768;26,1769;3,1770;15,1771;25,1771;1,1772,172;15,811,482;22,133,1773;15,1774;15,908;15,1775,85;13,84,437;13,511,1776;30,461;15,457;22,536,1777;13,695,776;13,473,1778;13,391,587;15,916;15,470;22,723,1779;13,517,1780;1,1781,392;1,1782,9;1,1783,9;13,241,518;1,1784,172;13,473,1785;19,1786;1,1787,9;1,1788,9;15,914;19,1778;19,1789;19,1790;19,1791;13,813,73;1,1792,85;1,1793,9;15,1794;15,1795;13,473,1246;30,872;15,1796;13,473,1797;24,473,1514;1,1798,172;13,573,530;24,1799,1800;24,241,1801;22,133,585;30,1802;13,473,1803;13,638,1804;13,473,1805;1,1806,145;1,1807,145;16,781;27,1808;12,1809;23,1810,1811;15,1812;13,492,441;13,84,1813;13,866,1814;1,1815,136;15,1213,482;19,1816;22,20,1817;1,1818,58;1,1819,145;26,736,194;15,1190;13,88,441;22,133,1053;19,1813;13,473,1820;13,587,1821;1,1822,9;22,20,1823;19,1824;1,1825,177;1,1826,69;1,1827,392;1,1828,177;1,1829,177;1,1830,392;9,1831;1,1832,145;13,495,1833;19,1834;22,723,108;30,719;1,1835,69;1,1836,58;15,1738,880;1,1837,145;25,751;1,946,9;14,1838;27,1839;15,1840;19,1841;27,1842;15,1843;15,1844;15,1845;13,492,1846;1,1847,136;26,1848;27,1849;1,668,85;13,473,1850;24,76,916;1,1851,145;15,1852;1,510,145;19,1853;13,492,1854;1,1855,20;19,943;15,1744;15,1856;19,1857;19,1858;19,1033;13,76,1267;22,20,1859;15,828;15,1860,880;15,1861,67;15,1862,482;19,1146;24,73,1863;9,1864;15,1738;22,720;17,697,1865;15,1866;15,1867,482;22,133,1868;15,1869;17,534,1870,98;1,1871,145;15,1872;19,1873;13,501;3,1874,1875;12,1876;1,1412,145;22,723,1877;17,1878,1879;19,1880;15,1881;13,1011,1882;9,1883;22,271,1487;26,1884,482,18;1,1885,20;9,1886;9,1887;41,1888,20,1722;41,1889,20,1722;9,1890;5,1891,20,1,1892;1,1893,145;1,1894,69;15,1895;19,1896;26,20,20,1897;3,20,1898,85;25,1738;22,723,1198;17,697,1899,98;15,1900,436;13,1901;22,723,1902;13,84,1298;22,20,1903;19,1904;17,534,1905;12,1906,392;13,62,1907;19,1908;22,1909;19,1910;19,460;1,1911,9;1,1912,145;1,1913,69;15,1914;13,1915;13,473,1916;27,1637;30,500;22,801,511;15,1917,710;1,1918,69;1,1919,69;27,1715;19,1920;13,1921,1922;19,1923;19,1691;19,1924;13,517,1925;1,1926,58;13,391,1927;13,1928;27,566;15,1929;14,1930;23,1931,1932;23,1933,1934;1,1935,9;1,1936,9;24,495,808;1,441,85;19,1937;25,1938,482;1,1939,177;1,1940,69;13,1374,1941;27,1942;22,271,1943;13,1944;1,1945,9;1,1946,9;13,457,279;13,695,340;3,1947,1948;1,1949,145;19,1950;27,1951;22,1743;22,20,1952;24,73,20;1,1069,69;13,492,34;25,84,436;24,457,1005;9,1953;13,241,1954;1,1955,20;1,1956,85;22,271,1222;15,34;24,36,1957;13,76,645;16,1958;13,84,808;22,133,894;13,457,1199;15,1959;16,1960;22,723,1961;1,1962,145;1,1963,58;1,1964,58;13,587,1965;24,975,533;19,634;13,473,1771;20,62,1966,1967;9,1968;16,1969,20,1970;24,842,1971;17,1972,1973;13,241,1814;22,1974,1975;26,1976;22,814,222;22,814,1977;13,511,768;1,1978,69;1,1979,145;13,457,901;42,1980,1981;9,1982,1983;41,1984,20,1985;16,1986;13,517,499;15,1987;24,573,20;19,1988;15,1989;19,847;24,573,1990;19,1991;26,490;24,897,492;22,723,768;15,1992;26,1993;13,511,62;19,902;19,1994;27,1995;1,1996,145;1,1997,392;1,1998,20;14,1999;16,1999;15,20,278;19,1638;13,824,1198;13,728,2000;22,1068,58;13,2001;26,2002;19,2003;22,2004,2005;17,697,2006;3,2007;13,34,2008;13,84,2009;14,2010;13,824,437;26,2011;26,2012;17,1334,2013;13,473,615;22,1068,610;22,271,2014;3,2015,278;13,34,2016;19,2017;17,1081,2018,1593;14,174,124;38,2019,1,2020;4,2021,20,1,2020;9,2022;26,2023;25,2024;26,2025;13,241,2026;1,1220,145;15,2027;26,2028;16,2029;41,2030,20,1722;13,84,2031;16,2032;19,36;26,1848,2033,2034;9,2035;19,2036;13,573,526;13,2037;1,682,145;1,2038,145;13,241,2039;24,76,499;3,2040;15,2041;16,2042;1,1827,2043;1,2044,58;15,967;13,241,458;24,241,2045;13,498,645;1,2046,85;22,801,2047;15,2048;22,271,1297;4,2049,20,1,2050;26,2051;26,1025,194;15,2052;24,842;15,1129;22,133,907;22,1068,2053;19,2054;19,568;26,2055;13,473,437;12,2056;16,2057;17,2058,2059,98;43,174,2060;1,2061,177;1,2062,145;15,2063;25,2064;16,2065;13,84,2066;24,2067,2068;13,824,2069;15,2070,595;1,2071,9;3,490,223;3,811,1340;24,76,20;1,2072,9;24,73,1957;26,2073;24,473,533;19,2074;14,2075;15,2076;1,2012,85;24,76,780;24,495,279;24,73,533;1,2040,165;19,1995;1,2077,392;13,241,441;13,522,499;24,2078,2079;13,2080;24,2081,430;12,2082;3,2083,1875;24,498,780;3,1929,194;1,2084,145;15,2085,225;24,34,533;17,534,2086;14,470;13,1165;12,470,85;16,1812;13,84,1019;13,84,491;1,2087,145;16,221;15,2088;13,473,34;13,84,610;14,2089;22,133,2090;19,566;9,2091;9,2092;27,1165;22,133,2093;14,2094;13,492,790;13,241,2095;19,2096;24,1054,492;19,35;24,241,884;15,2097;14,1812;13,695,2098;17,697,2099,98;17,2100,2101,98;14,2102;17,1334,806;26,736,20,213;1,2103,93;17,1334,2104;13,473,2105;3,2106,225;22,133,584;13,88,490;19,2107;22,271,2108;1,2109,69;3,2110,194;3,2111,194;1,2112,85;13,2113;13,530;24,34,780;19,2114;13,84,872;16,2115;14,2116;13,495,2117;3,2118,194;1,2119,145;1,2120,69;15,2121;32,174,2122,1379;22,723,1712;22,20,2123;13,638,751;22,1068;19,2124;13,2125;13,73,998;13,457,2066;1,2126,9;1,2127,9;22,20,2128;3,2129,223,213;1,2130,69;1,2131,20;22,1185,20,382,2132;25,2133;24,76,490;1,2134,177;1,2135,69;26,2136;30,108;13,522,781;15,2137;3,668;13,2138;13,76,517;9,279;42,2139,2140;3,2141,482,18;16,174,124,125;16,2142;15,2143;22,133,2144;17,2145,2146,98;1,2147,145;26,736;24,492,2148;16,2149;3,461,532;19,2150;27,2151;9,2152;13,473,2153;19,2154;15,2155;24,241,2156;26,2157;1,2158,9;13,190,2159;13,473,808;15,2160;26,2085;1,279,58;1,1012,58;19,2161;13,840,518;13,457,2027;13,241,2162;15,2163;13,517,1005;1,75,136;1,2164,58;16,2165;14,2166;1,2167,392;19,2168;19,2169;27,2170;15,2171;1,943,145;13,866,511;22,723,62;12,2172;22,2173,2047;13,824,2174;1,2175,145;15,2176;1,2177,58;1,2178,69;12,2179;25,279;19,2180;13,473,2181;19,2182;3,2183,194;27,2184;19,2185;25,2186;17,534,20,98;27,2187;22,441;1,2188,69;19,2189;13,84,661;13,241,2190;26,2191;13,530,2192;15,715,2193;3,1370,225;13,517,645;1,2194,69;19,2195;14,2196;22,271,2197;14,1357;19,1252;16,2198;19,2199;19,430;15,697;24,498,2200;19,2201;19,2202;13,1513,781;19,2203;30,781;13,76,2204;13,573,2205;13,391,1042;13,84,940;24,241,1514;19,2206;19,2207;13,473,2208;13,241,469;26,2209;13,2210,701;1,2211,69;13,2212;15,2213;30,808;14,1557;13,473,1432;24,241,2214;15,2215;13,2216,108;19,2217;1,2218,69;16,2219;2,2220,392,20,14,2221;16,437,2222;13,2223;1,2224,9;1,2225,145;3,2226,595;17,697,2227,98;22,723,683;9,2228;13,2229,1121;15,172,207;26,1025;27,870;1,2230,165;13,2231;22,271,2232;1,781,58;13,241,872;15,20,67;15,598;3,16,225;16,2233;2,2234,85,145,14,598;1,2136,85;12,2235;19,2187;27,1834;13,84,2236;1,1211,20;1,2237,69;9,2238;4,1890,20,1,2239;4,2240,2241,1,2239;41,2242,20,2243;41,2244,20,2245;13,36,2246;22,271,2247;22,133,108;14,1320;14,2248;22,20,76;22,723,2249;1,2250,85;14,2251;19,2252;13,62,2253;15,657;25,2254;13,473,2255;13,241,1094;17,697,2256;15,2085;1,2257,85;26,668,194,213;15,2258;15,2259,278;12,2260;17,1334,2261;17,1334,2262;13,2168;1,2263,69;1,2264,85;9,2265;24,847;16,2266;17,2267,2268;17,2267,2269;17,2267,2270;17,2267,2271;22,133,587;22,133,520;22,20,916;25,2272;22,20,2272;22,20,2273;1,2274,58;27,2275;24,473,2276;1,2252,93;1,2277,145;16,2278;9,2279;9,2280;15,2281;1,2282,85;13,2283,781;22,20,1151;30,2284;2,88,85,145,14,108;15,811,278;16,2285;1,2286,145;1,893,145;25,1198;1,2287,9;13,913;16,2288;17,1334,2289;1,2290,9;27,2291;15,168;1,2292,93;22,271,2293;1,2294,69;1,2295,145;1,2296,9;3,2297,223;27,2298;22,814,895;19,2299;2,112,85,2300,14,2301;26,862,20,213;14,2302;15,1862;13,2303;19,1355;22,723,2304;1,2305,2306;17,682,2307,98;17,697,2308,98;16,2309;16,2310;13,457,1151;15,2311;15,271;13,573,73;7,2312,2313,2314;15,2315;1,2316,69;36,2317;15,2318;15,2319;12,2320;24,241,2321;22,20,2322;13,473,2323;25,2324;13,473,975;15,469;15,2325;15,2326;13,457,168;16,2327;1,822,85;1,2328,145;21,866,2329;24,824,2079;24,1766,533;24,1510,808;9,2330;9,2331;13,555;15,2332;9,2333;30,2334;13,1834;15,2335;13,241,2336;42,2337,2338;13,1103,1989;1,2339,9;1,2340,9;12,2341;26,2342;30,517;1,2343,69;13,62,2344;3,2345,2346,18;15,1198,880;1,2347,9;1,2348,69;16,2349;1,967,145;9,2350;16,2351;27,848;22,723,2352;1,2353,93;22,723,174;1,2354,9;30,1162;15,1192,710;1,2355,58;1,2356,58;1,2357,58;19,2358;15,2359;19,2360;24,2361,2362;1,2363,145;1,2364,145;19,2365;26,2366;44,2367,85,2368;2,2369,85,2370,14,2371;3,2372,194;26,2373,194;15,2374;13,241,500;1,2375,9;22,133,781;27,2376;27,2377;9,2378;27,2168;13,473,542;15,2379;15,1198,819;19,2380;26,2381,194,18;37,2382,1,2383;15,455;24,62,2384;15,2385;1,2386,145;2,241,85,2387,14,2388;13,241,271;1,2096,145;22,723,2389;1,2390,69;24,88,2391;13,517,34;22,271,2392;12,2393;15,2394;17,534,2395,559;12,2396;17,492,2397;15,645;24,495,2398;19,2399;17,534,2400;22,1068,2401;15,2402;1,2403,93;22,723,2404;15,2405;15,1195;15,2406;22,133,1162;24,62,866;16,2407,2408;15,2409;15,2410;1,2411,85;1,2412,69;15,523;13,824,2413;24,2414,2415;19,2416;27,617;1,828,69;27,2417;1,2418,2193;26,490,194,18;13,2419,441;24,2420,2421;22,133,84;25,884;1,868,145;24,975,2422;15,2423;13,522,1168;19,1402;15,2424;19,1292;27,2425;27,2426;17,697,2427;9,2428;19,2429;10,2430;23,442,2431;1,2432,69;23,2433,2434;21,2220,2435;26,736,482,18;1,2436,58;1,2437,58;1,2438,58;3,1734,194;14,2439;1,2440,392;1,2441,392;15,2442;13,638,473;15,610;24,241,808;17,534,2443;1,2444,85;27,2445;12,2446,392;22,723,2447;1,2448,85;15,2449;15,2450;29,2451;15,2298;1,2452,145;15,2453;1,2454,69;15,2455,2456;1,2457,177;1,2458,177;16,2459;22,271,2460;15,2461;15,75;1,2462,207;19,2463;19,362;1,2464,2465;15,2466;15,2467;1,2468,145;14,2469;27,736;13,88,108;13,84,2470;27,2471;25,2472;1,2473,145;1,2474,177;45,2475,1060,2476;45,2477,1060,2476;9,2478;4,2478,20,1,2479;16,2480;4,2233,20,1,2481;1,2482,9;1,2483,9;1,2484,9;4,2485,20,1,2239;5,2485,20,1,2239;41,2486,20,2243;15,1929,710;22,271,2487;25,2488;24,511,2489;24,498,473;30,2490;16,2491;22,723,1917;29,470;1,127,172;9,2492;14,2493;7,2494,2495;42,2496,2497;1,2498,2306;1,2499,145;13,457,2500;22,133,2501;1,2502,2503;22,271,2504;9,2505;19,2506;1,2507,145;22,640,2508;13,511,2509;13,824,872;24,241,610;3,2510,194;26,2511,194;1,2512,9;17,534,2513,98;22,271,2514;16,2515;1,2516,145;22,133,16;1,2114,145;15,2517;22,133,142;13,241,2518;17,534,2519;27,2520;30,520;27,2197;1,2521,9;1,2522,9;9,2523;4,2523,20,1,2524;13,530,2525;22,1024;1,2526,145;15,1773;1,2527,9;1,899,20;26,461,482,18;13,1390;1,2528,85;3,2529;15,2530;15,2531;15,2532;41,2533,2534,1722;9,2535,2536;19,2537;13,2538;4,2539;9,2539;25,901;13,522,34;1,2540,177;26,2541;16,2542;4,2543,20,1,2544;41,2545,20,2546;9,2547;1,2548,136;13,530,2549;19,2550;13,473,781;13,728,1033;13,2551;15,2552;17,682,2553,98;17,697,2554,98;24,492,2555;1,2556,69;1,2557,165;6,2558,2559,2560;1,2561,85;1,2562,85;1,2563,392;1,2564,20;15,2565;24,495,2566;19,2567;22,133,2310;16,2568,2569;14,2570;1,2571,58;29,2572;13,241,59;21,34,2573;14,2266,2574;22,271,2575;5,2576,20,1,2577;5,2578,20,1,2579;5,2580,20,1,2581;5,2582,20,1,2583;5,2584,20,1,2585;1,2586,2306;15,776;1,2399,9;27,2114;1,2587,145;13,511,2588;27,2589;1,2590,85;13,522,2591;16,745,124,125;13,34,108;15,2592;16,2593,124,1379;22,723,2594;13,1381;13,473,2595;3,2465,194,18;14,2596;27,2597;16,2598;1,2599,145;1,2600,9;41,2601,20,1722;15,2602;27,127;13,824,2603;26,1947;15,1437;3,2604,482,18;27,1146;26,20,482,18;3,668,194,18;13,473,2605;22,133,279;14,745,124;25,2606;13,59,1535;1,2607,9;22,271,2608;15,2609;3,2610,1340;16,2611;17,697,2612,98;12,2613;25,2614;16,2615;15,20,2616;15,2617;4,2618,20,1,2619;13,530,2620;1,2621,20;22,271,16,382,2622;13,241,2623;14,2624;16,2624;3,768,194;15,758,85;19,2625;15,977;13,36,60;1,2626,69;13,473,2530;1,2627,69;14,2628;22,640,975;14,2629;16,2629;14,2630;9,2631;9,2632;15,2633;26,2634;16,2635,124,1379;1,1408,145;16,2636;1,2637,145;1,1416,69;1,2638,69;1,2639,85;1,2640,69;1,2641,145;16,2642;9,194,2643;16,2644;37,2645,1,2646;41,2647,20,2648;1,548,145;1,2649,93;13,473,534;16,2650,2651;1,2652,145;22,271,811;13,473,2653;4,2523,20,1,2654;1,2655,58;1,2656,85;9,2657,432;1,2658,2659;24,457,2660;15,2661;15,2662;19,2663;1,2664,69;1,2665,392;1,2666,9;13,473,1024;46;22,20,1744;24,824,1162;13,1510,108;13,866,490;13,36,2667;30,2668;15,2669;19,2670;14,437,124;26,2671,482;3,668,194;15,1187,595;9,2672;1,2673,145;26,1947,194,213;26,668,194;13,473,2674;13,530,884;13,1140,2675;24,34,2676;1,1790,145;15,2677;22,271,2678;19,1918;15,1219;1,2679,93;2,84,85,172,14,2680;22,133,2681;21,2682,2683,1425,2684;26,2685,2456,18;15,1778;13,457,12;1,2686,69;30,518;9,2687;15,2688;24,391,780;1,2689,69;14,2690;1,2691,145;2,84,85,172,14,1151;16,174,2692;13,84,2334,2693;13,824,2694;15,2695;1,2696,136;27,2697;1,2698,85;12,2699;22,271,975;15,2700;19,2701;1,2702,392;9,2703;1,2704,69;16,174,20,125;16,2439;3,1947,482,18;13,457,2705;9,2706;9,2707;9,2708;13,1140,2709;16,2710;15,2711;15,2712;15,2713,710;15,2714;22,723,2715;22,720,2716;9,2717;9,2718;9,2719;7,2720,20,2721;7,2722,20,2723;7,2724,20,2725;7,2726,20,2725;7,2727,20,2728;7,2729,20,2730;4,2731,20,1,2732;13,241,60;3,1025;4,2733,20,1,2734;4,2735,20,1,2736;1,2737,145;1,2738,85;20,2739,117,2740,14,2741;1,2742,2743;13,1140,2744;1,2745,145;2,88,85,86,14,2746;22,133,2747;1,2748,2749;15,2750;15,2751;16,2752;4,2753,20,1,2754;15,2389;6,2755,20,2497;15,2756;24,84,2757;1,2758,20;36,2759;14,2760;26,2761,20,18;1,2762,58;1,1242,58;4,2763,20,1,2764;16,2765;12,2766;13,1928,2767;13,522,1917;13,1513,2768;15,1917;15,57;1,2769,9;1,2770,85;15,2771;13,344,108;22,271,2772,382,2773;42,2774,2497;1,2775,58;16,2776;27,1408;4,2777,20,1,2778;34,2779,1,2780;6,2781,20,2497;1,1012;4,2782,20,1,2783;22,271,2784;13,84,2785;12,2786;15,241;17,534,2787,559;17,534,2788,559;17,534,2789,559;22,271,963;22,723,2790;13,824,2791;19,2108;9,2792;23,2793,2794;19,2795;13,84,2796;16,2797;1,2798,58;22,133,2799;1,2800,9;47,2801;1,2802,58;15,2803;1,2804,2805;35,2806;12,2807;1,2808;9,2809;30,2810;9,2811;13,1011,2812;16,2813;1,2814,1372;25,598;12,2815;3,20,436,18;12,2816;13,495,2817;1,2818,9;23,2819,2820;17,534,2821;22,723,1199;15,2822;1,460,9;25,455;22,271,2823;19,2824;13,573,2825;12,1430,207,989;9,2826;9,2827;1,2828,69;22,271,2829;16,2830;24,241,2831;12,2832;13,1485,2833;25,1062;24,241,2834;1,2835,177;24,84,533;1,2836,392;1,2837,392;16,2838;1,2839,177;19,2840;1,2841,145;13,495,84;22,723,542;12,2842;22,271,2843;12,2844;2,142,85,86,14,2845;2,142,85,2846,14,790;22,723,2038;9,2847;22,723,925;13,824,781;22,271,2848;13,824,811;4,2849,20,1,2850;16,2851,2852;4,2853,20,1,2854;16,2855;15,2856;20,62,2857,2858;20,62,2859,69;1,2860,145;13,492,975;1,922,145;18,1412,2861;22,271,2862;15,2863;41,2864,20,2865;7,2866,20,2867;1,2868,58;15,2869;13,2870;15,2871;27,2872;14,2873;19,2874;43,2875,1521;43,2876,2877;43,2878,2879;43,2880,2881;15,2882;14,2883;27,2884;16,1557;15,2885;22,271,500;24,1485,2886;19,1715;19,2817;16,1337,124;9,2887;9,2888;13,84,500;16,2889;13,824,521;1,2890,9;17,534,2891;42,2892,2497;14,2496;9,2893;19,2894;43,2895,2896;43,2897,2898;43,2899,2900;4,2901,20,1,2902;4,194,2903,1,2904;4,2905,20,1,2906;15,1060,595;1,2907,145;26,2908;3,2909,2910;15,2911;13,473,2912;1,2913,69;2,142,85,2914,14,2915;17,2916,2917,98;3,20,20,85;1,2918,177;1,2919,145;1,2920,145;13,2921;1,2922,145;1,2923,145;1,2924,136;4,2925,2926,1,2646;4,2925,2927,1,2646;4,2928,20,1,2646;9,2928;9,2925,2926;9,2925,2927;41,2929,2930,1722;13,73,526;22,271,2931;1,2932,9;1,2933,172;1,2934,9;1,2935,177;19,2936;27,2937;3,2938,194;15,2939,880;1,2940,9;22,2941,490;1,2942,145;27,2943;27,2944;9,2945;41,2946,2947,1722;41,2948,2949,1722;41,2950,20,1722;1,2951,392;1,1146,392;13,241,2952;32,2233,2953;27,2954;15,108,595;13,241,2955;9,2956;5,2957,20,1,22;37,2958,2959;1,2960,177;13,84,441;14,2961;9,2962;1,1848,85;1,2963,145;1,2964,69;21,2965,2966;13,1168,2967;13,241,879;23,2968,2969;7,2970,2971,2972;7,2973,2974,2972;17,534,2400,98;17,534,2975,98;13,473,2976;23,2036,2977;14,2978,124;1,916,145;22,801,469;16,2979;13,34,441;1,2980,20;13,241,2981;12,631,392;1,738,145;16,2982;1,2983,93;13,824,975;22,723,2984;13,241,1117;1,2985,177;1,2986,145;1,545,58;13,1140,808;13,473,2987;15,2988;13,88,2298;15,20,2989;15,2990;25,2990;29,2991;22,720,2992;1,2993,177;15,1199;30,2031;25,2097;30,2097;1,2994,145;13,1062;15,62,2995;1,2996,145;24,1140,2997;22,723,610;16,745,124,1379;3,2141,20,213;13,241,2998;21,2999,3000,132;24,241,3001;30,1712;1,3002,145;45,3003,2085,1053;24,241,492;24,587,3004;9,3005;15,3006;24,3007,3008;12,631,3009;13,530,3010;12,3011;16,174,3012;1,3013,69;1,3014,69;13,473,3015;1,3016,145;13,495,500;1,3017,145;22,723,1103;15,1470;15,1917,880;13,1374,469;15,3018;9,194,3019;9,194,3020;22,720,1024;16,3021;13,241,3022;15,520;24,62,3023;16,3024;1,168,165;21,2965,2966,1425,3025;32,174,3026;15,3027;15,20,436;26,3028,482,3029;1,3030,69;15,3031;22,271,3032;1,3033,85;4,194,3034,1,3035;2,2369,85,3036,14,3037;22,723,3038;22,271,3039;1,3040,9;12,3041;19,3042;19,3043;19,3044;19,3045;19,1929;19,3046;1,2637,58;19,995;19,3047;13,824,3048;17,534,3049,559;15,3050;12,3051,392;16,3052;2,500,392,3053;1,3054,69;13,866,3055;22,723,868;24,573,3056;13,142,975;22,1068,1434;15,1434;22,723,3057;22,723,3058;15,3058;1,851,9;22,723,1031;1,3059,58;1,3060,93;15,3061;23,1645,3062;18,1412,3063;4,3064,20,1,3065;14,3066;1,3067,9;1,3068,9;1,3069,177;1,3070,177;30,174;19,3071;16,3072;15,174;22,133,542;13,241,1024;14,3073;22,133,3074;34,3075,1,3065;34,3076,20,1,1724;34,3077,1,1724;3,3078,194;26,3079,482,18;22,271,3080;13,824,108;9,3081;15,3082;22,3083,767;25,3084;15,3085;27,3086;15,3087;1,3088;12,3089;12,3090;22,723,3091;30,1024;15,3092;16,3093;14,3093;4,2233,20,1,3094;5,2233,20,1,3094;9,2566,3095;22,723,190;9,3096;16,3097;1,3098,69;1,3099,145;1,3100,69;41,3101,20,3102;1,3103,9;5,3104,20,1,3105;37,3106,1,3107;22,271,701;13,828;1,3108,9;1,3109;1,3110;34,3111,1,3112;15,3113;22,723,3114;1,3115,145;22,271,697;13,1374,884;15,3116;13,824,3117;22,1743,490;22,947,1929;15,3118;12,3119;15,3120;34,3121,1,3122;13,495,1187;22,271,3123;15,192;15,3124;13,522,3125;13,824,3125;15,2402,482;12,3126;30,940;22,133,3127;15,3128;37,3129,1,3130;12,3131;12,3132;30,3133;16,3134;16,3135;12,3136;13,190,500;1,3137,93;16,3138;15,3139;15,3140;2,11,12,20,14,3141;10,3142;10,3143;38,3143,1,3144;23,3145,3146;15,3147;1,3148,69;1,3149,9;1,3150,9;1,1129,9;1,3151,9;1,3152,69;25,3153;19,3154;37,3155,1,3156;1,3157,20;22,1068,3158;1,3159,58;1,1563,58;19,2184;22,20,3160;19,2942;1,3161,9;1,279,172;12,3162;1,1061,9;13,473,3163;22,271,3164;1,3165,177;9,3166;4,3167,20,1,41;24,573,3168;34,3169,1,3170;18,1644,3171;3,3172,194,18;9,3173;12,3174;1,3175,145;40,3176,1,3177;14,3178,124;22,720,3179;15,3180;1,1062,165;22,271,3181;13,241,3182;15,20,3183;15,3184;1,3185,145;1,3186,145;16,3187;14,3187;22,271,3188;36,3189;15,3190;22,271,842;25,500;25,3191;15,3191;38,3192,1,3193;17,884,3194,98;13,1374,500;1,3195,58;25,3196;15,3197;1,3198,9;1,3199,9;1,3200;36,3201;36,3202;9,3203;20,3204,3205;30,521;26,2023,194;13,871,3206;14,3207;14,3208;15,3209;12,3210;22,271,3211;4,3212,20,1,3213;22,723,3214;1,3215,58;1,3216,69;2,88,85,3217,14,279;1,3218,9;2,84,85,1455,14,3219;5,3220,20,1,41;37,3221,1,41;23,3222,3223;1,3224,58;1,3225,145;25,1187;22,271,3226;19,3227;12,3228;13,572,645;15,3191,595;25,3191,278;22,133,3229;16,2010;36,3230;3,3231,225,18;14,3232;27,3233;1,3234,145;3,3235,194,213;13,495,3236;3,3237,194;5,3238,20,1,3239;2,102,85,3217,14,2429;36,3240;36,3241;34,3242,1,3243;4,3244,20,1,3243;2,84,85,1455,14,3245;13,824,3246;14,174,3247;13,495,3248;15,3249;22,723,3250;15,3251;2,241,85,2387,14,3252;22,3253;16,3254;4,3255,20,1,3256;22,720,3257;24,3258,3259;24,3260,3259;16,3261;24,3262,3263;15,3264;15,3265;25,3266;22,1345,3267;15,2215,482;16,3268;22,271,62;1,3269,69;5,3270,20,1,3271;37,3272,1,3271;4,3273,20,1,41;1,3274,69;15,3275;15,1121;15,3276;1,3277,69;1,3278,20;2,3279,85,103,14,3280;29,3281;9,3282;16,3283;22,133,1260;10,3284;4,3285,20,1,3286;19,3287;38,3288,1,3289;15,3290;22,723,3291;15,3292;22,3293,3294;1,127,145;10,3295;7,3296,3297,3298;16,3299;45,3300,1060,2476,3301,3302;15,3303;22,20,3304;9,3305;9,3306;14,3307;1,3308,145;13,241,3309;19,3310;27,3311;24,572,1055;16,3312;1,3313,58;1,1933,58;30,3314;1,3315,9;14,3316;19,2229;14,3317;14,3318;1,3319,145;9,3320;22,20,3321;1,3322,145;2,3323,85,3324,14,3325;22,20,531;14,3326;1,3327,20;9,3328;1,3329,165;29,3330;1,3331,177;1,3332,177;14,3333;1,3334,177;2,1691,1296,3335,14,3336;14,3337;16,3338;1,3339,145;1,3340,145;24,3341,495;16,3342;17,3343,3344,98;14,3345;14,3346;14,3347;17,534,3348,559;1,3349,145;16,3350;48,3351,1,3352;27,3353;1,2566,69;16,3354;1,3355,177;16,3356;14,3357;14,3358;14,3359;14,3360;49,3361;16,3362;14,3363;19,61;19,3364;27,3365;25,3366;24,3367,3368;14,3369;16,3370;16,3371;16,3372;16,3373;14,3374;14,3375;14,3376;1,3377,145;16,3378;16,3379;14,3380;16,3381;16,3382;16,3383;14,3384;16,3385;14,3386;25,34;25,2991;14,3387;16,3388;14,3389;16,3389;14,3390;34,3391,1,3392;2,2369,85,3393,14,3394;34,3395,1,3396;34,3397,1,3396;34,3398,1,3399;50,3400,3401";
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
