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

function editObjectOnSetter(...args) {
    editObjectOnSetterFn(false, ...args);
}

function editObjectOnSetterFn(
    trusted = false,
    propChain = '',
    jsonq = '',
) {
    if ( propChain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix(
        `${trusted ? 'trusted-' : ''}edit-object-on-setter`,
        propChain,
        jsonq
    );
    const jsonp = JSONPath.create(jsonq);
    if ( jsonp.valid === false || jsonp.value !== undefined && trusted !== true ) {
        return safe.uboLog(logPrefix, 'Bad JSONPath query');
    }
    const editObj = objBefore => {
        const objAfter = jsonp.apply(objBefore);
        if ( objAfter === undefined ) { return; }
        safe.uboLog(logPrefix, 'Edited');
        if ( safe.logLevel <= 1 ) { return; }
        safe.uboLog(logPrefix, `After edit:\n${safe.JSON_stringify(objAfter, null, 2)}`);
    };
    let currentValue = trapPropertyFn(propChain, {
        get: function() {
            return currentValue;
        },
        set: function(a) {
            currentValue = a;
            if ( currentValue instanceof Object ) {
                editObj(currentValue);
            }
        }
    });
    if ( currentValue instanceof Object ) {
        editObj(currentValue);
    }
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

function jsonlEditFn(jsonp, text = '', jsonExtract) {
    const safe = safeSelf();
    const lineSeparator = /\r?\n/.exec(text)?.[0] || '\n';
    const linesBefore = text.split('\n');
    const linesAfter = [];
    for ( const lineBefore of linesBefore ) {
        const match = jsonExtract.exec(lineBefore);
        if ( match === null ) {
            linesAfter.push(lineBefore);
            continue;
        }
        const jsonBefore = match[1];
        let obj;
        try { obj = safe.JSON_parse(jsonBefore); } catch { }
        if ( typeof obj !== 'object' || obj === null ) {
            linesAfter.push(lineBefore);
            continue;
        }
        const objAfter = jsonp.apply(obj);
        if ( objAfter === undefined ) {
            linesAfter.push(lineBefore);
            continue;
        }
        const jsonAfter = safe.JSON_stringify(objAfter);
        const lineAfter = [
            lineBefore.slice(0, match.index),
            jsonAfter,
            lineBefore.slice(match.index + jsonBefore.length),
        ].join('');
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
    const jsonExtract = extraArgs.jsonExtract
        ? new RegExp(extraArgs.jsonExtract)
        : /^(.*)$/;
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
            const outerResponse = jsonlEditFn(jsonp, innerResponse, jsonExtract);
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
        '<div style="background-color:beige;color:black;border:1px solid black;display:flex;font-family:sans-serif;font-size:medium;margin:0;position:fixed;top:0;white-space:pre-wrap;width:100%;z-index:2147483647">',
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
        currentAlert.setAttribute('popover', 'manual');
        doc.documentElement.append(currentAlert);
        if ( typeof currentAlert.showPopover === 'function' ) {
            currentAlert.showPopover();
        }
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

function zeta_2brklsgs() { // popads.js
(function() {
    'use strict';
    const magic = String.fromCharCode(Date.now() % 26 + 97) +
                  Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const oe = window.onerror;
    window.onerror = function(msg, src, line, col, error) {
        if ( typeof msg === 'string' && msg.indexOf(magic) !== -1 ) { return true; }
        if ( oe instanceof Function ) {
            return oe(msg, src, line, col, error);
        }
    }.bind();
    const throwMagic = function() { throw new ReferenceError(magic); };
    delete window.PopAds;
    delete window.popns;
    Object.defineProperties(window, {
        PopAds: { set: throwMagic },
        popns: { set: throwMagic }
    });
})();
}

function zeta_8echnktd() { // nofab.js
(function() {
    'use strict';
    const noopfn = function() {
    };
    const Fab = function() {};
    Fab.prototype.check = noopfn;
    Fab.prototype.clearEvent = noopfn;
    Fab.prototype.emitEvent = noopfn;
    Fab.prototype.on = function(a, b) {
        if ( !a ) { b(); }
        return this;
    };
    Fab.prototype.onDetected = function() {
        return this;
    };
    Fab.prototype.onNotDetected = function(a) {
        a();
        return this;
    };
    Fab.prototype.setOption = noopfn;
    Fab.prototype.options = {
        set: noopfn,
        get: noopfn,
    };
    const fab = new Fab();
    const getSetFab = {
        get: function() { return Fab; },
        set: function() {}
    };
    const getsetfab = {
        get: function() { return fab; },
        set: function() {}
    };
    if ( window.hasOwnProperty('FuckAdBlock') ) { window.FuckAdBlock = Fab; }
    else { Object.defineProperty(window, 'FuckAdBlock', getSetFab); }
    if ( window.hasOwnProperty('BlockAdBlock') ) { window.BlockAdBlock = Fab; }
    else { Object.defineProperty(window, 'BlockAdBlock', getSetFab); }
    if ( window.hasOwnProperty('SniffAdBlock') ) { window.SniffAdBlock = Fab; }
    else { Object.defineProperty(window, 'SniffAdBlock', getSetFab); }
    if ( window.hasOwnProperty('fuckAdBlock') ) { window.fuckAdBlock = fab; }
    else { Object.defineProperty(window, 'fuckAdBlock', getsetfab); }
    if ( window.hasOwnProperty('blockAdBlock') ) { window.blockAdBlock = fab; }
    else { Object.defineProperty(window, 'blockAdBlock', getsetfab); }
    if ( window.hasOwnProperty('sniffAdBlock') ) { window.sniffAdBlock = fab; }
    else { Object.defineProperty(window, 'sniffAdBlock', getsetfab); }
})();
}

function zeta_djbdt5ns() { // popads-dummy.js
(function() {
    'use strict';
    delete window.PopAds;
    delete window.popns;
    Object.defineProperties(window, {
        PopAds: { value: {} },
        popns: { value: {} }
    });
})();
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

function zeta_mb58kw52() { // fingerprint2.js
// Reference:
// https://github.com/fingerprintjs/fingerprintjs/tree/v2

(function() {
    'use strict';
    const hex32 = len => {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
            .toString(16)
            .slice(-len)
            .padStart(len, '0');
    };
    const browserId = `${hex32(8)}${hex32(8)}${hex32(8)}${hex32(8)}`;
    const fp2 = function(){};
    fp2.get = function(opts, cb) {
        if ( !cb  ) { cb = opts; }
        setTimeout(( ) => { cb([]); }, 1);
    };
    fp2.getPromise = function() {
        return Promise.resolve([]);
    };
    fp2.getV18 = function() {
        return browserId;
    };
    fp2.x64hash128 = function() {
        return browserId;
    };
    fp2.prototype = {
        get: function(opts, cb) {
            if ( !cb  ) { cb = opts; }
            setTimeout(( ) => { cb(browserId, []); }, 1);
        },
    };
    self.Fingerprint2 = self.Fingerprint = fp2;
})();
}

function zeta_movh4xh5() { // noeval.js
(function() {
    'use strict';
    const log = console.log.bind(console);
    window.eval = new Proxy(window.eval, {          // jshint ignore: line
        apply: function(target, thisArg, args) {
            log(`Document tried to eval... ${args[0]}\n`);
        }
    });
})();
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
    const $scriptletHostnames$ = /* 13935 */ ["*","edu","j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","ok.ru","op.gg","ouo.*","oxy.*","pnd.*","qmh.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","ebay.*","edu.cn","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","mel.fm","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","ntv.cx","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","app.com","arbsd.*","atdhe.*","atv.com","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","brew.sh","bunkr.*","car.com","cbox.ws","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","crn.com","ctrlv.*","dbna.de","dciuu.*","deco.fr","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","dnj.com","docer.*","doods.*","doood.*","duck.ai","elixx.*","enit.in","eska.pl","exe.app","exey.io","f6s.com","fakt.pl","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mlb.com","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","ntvs.cx","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rgj.com","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vids.st","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","ymix.to","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","18jav.tv","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","2tencb.*","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9mod.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","amazon.*","anigo.to","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bsky.app","bunkr.la","bunkrr.*","bzzhr.co","bzzhr.to","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","firmy.cz","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fyxxr.to","fzlink.*","g9r6.com","game8.jp","ganool.*","garaz.cz","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","index.hr","isi7.net","its.porn","j91.asia","janjua.*","javgg.me","jmanga.*","jmmv.dev","jotea.cl","kagane.*","kagi.com","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kick.com","kimi.com","kizi.com","kloo.com","km77.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","live.com","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","miruro.*","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mlsbd.co","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","n.fcd.su","ncaa.com","net77.cc","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","piano.io","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","scmp.com","seeeed.*","self.com","senda.pl","senpa.io","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","sj-r.com","slant.co","sms24.me","so1.asia","splay.id","sport.de","sport.es","spox.com","sptfy.be","stern.de","stfly.me","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","turbo.cr","turbo.fr","tv.wp.pl","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","weloma.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","wykop.pl","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yacht.de","yandex.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zovo.ink","zshort.*","0vg9r.com","10.com.au","10short.*","123av.com","123link.*","123mf9.my","127.0.0.1","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9-gld.net","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","aagmaal.*","abcya.com","acortar.*","adcorto.*","adobe.com","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ameblo.jp","ampav.com","andyday.*","anidl.org","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","apple.com","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","astral.sh","atlaq.com","atomohd.*","avtub.*>>","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","azure.com","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","canva.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chess.com","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","claude.ai","clksz.com","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","dom.wp.pl","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","dzapk.com","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","europix.*","evaki.fun","evo.co.uk","exego.app","expres.cz","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fbsbx.com","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gazeta.ru","gdirect.*","ggjav.com","gifhq.com","giize.com","gitea.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.ml","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gry.wp.pl","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","jasmr.net","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javsub.my","javup.org","javwide.*","javxxx.me","jkanime.*","job.mt.de","job.nw.de","jootc.com","kagane.to","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lecker.de","legia.net","lenkino.*","lep.co.uk","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","localhost","lodynet.*","lohud.com","lookcam.*","lootup.me","los40.com","m.kuku.lu","m1xdrop.*","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mfw09.org","mgnet.xyz","mgread.io","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","noxx.to>>","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","proton.me","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","rdembed.*","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rfiql.com","ridge.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rophimz.*","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","sat24.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","srnky.com","sssam.com","ssstik.io","staige.tv","stly.link","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","stvid.com","sulasok.*","swame.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","themw.com","thesun.ie","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tubev.sex","tubexo.tv","tukoz.com","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","twitch.tv","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upbolt.to","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqload.co","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vidbox.vc","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidneo.cc","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vipurl.in","vladan.fr","vnuki.net","vogue.com","voodc.com","vplink.in","vsembed.*","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","webex.com","webmaal.*","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","www.wp.pl","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xca.cymru","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yahoo.com","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zokaj.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","444.coffee","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9anime.vip","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","alphatv.gr","amboss.com","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","avtub.cx>>","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","balbums.st","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdjobs.com","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brd.edu.pl","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","caller.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","capital.fr","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chad.co.uk","chiefs.com","chrome.com","ciberdvd.*","cimanow.cc","cinehd.app","cinemar.cc","cityam.com","citynow.it","ckxsfm.com","claude.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","costco.com","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cuttty.com","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","dilar.tube","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drakkar.st","drivebot.*","driveup.in","driving.ca","drphil.com","ds.163.com","dtmaga.com","dvm360.com","dz4up1.com","eadt.co.uk","earncash.*","earnload.*","easysky.in","ebc.com.br","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fastly.net","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","filester.*","film.wp.pl","film1k.com","film4e.com","filmi7.net","filmo.to>>","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gamezop.io","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gentside.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","github.com","gitlab.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","goerie.com","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hao123.com","hardsex.cc","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hochi.news","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","huavod.com","huavod.net","huavod.top","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indoav.app","indoav.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isbn.co.in","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","kaamuu.cfd","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","kickbd.org","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","labgame.io","lacrima.jp","larazon.es","lasisa.net","ldnews.com","leakav.com","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","mdplay.top","medibok.se","megadb.net","megadede.*","megaflix.*","megalink.*","megaup.net","megaxh.com","meltol.net","meong.club","merinfo.se","meteox.com","mhdtvmax.*","miixdrop.*","milfzr.com","mistral.ai","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","moto.wp.pl","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mpnnow.com","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","napmap.net","natalie.mu","natfrp.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","ninguno.cc","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pidlio.com","pilsner.nu","pingit.com","pinkun.com","pirlotv.mx","pitube.net","pixelio.de","pixvid.org","pjstar.com","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","plejada.pl","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","ptztv.live","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","rambler.ru","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","reddit.com","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rrstar.com","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","salina.com","samash.com","sanblo.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skinmc.net","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sohot.cyou","sokobj.com","solewe.com","sourds.net","soy502.com","spaste.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","stripe.com","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpalm.com","tcpvpn.com","tech.wp.pl","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiktok.com","tiscali.it","tmnews.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vcloud.lol","vcstar.com","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidbox.dev","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduro.top","viduyy.com","viewfr.com","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vscode.dev","vstream.id","vvide0.com","vvtlinks.*","wapkiz.com","warezcdn.*","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","worder.cat","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xprivo.com","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ystream.id","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","2gomovies.*","2rdroid.com","3bmeteo.com","3d-porn.org","3dyasan.com","3hentai.net","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4pornhd.com","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","and-more.co","andiim3.com","anibatch.me","anichin.top","anigogo.net","anihq.org>>","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniwixi.xyz","aniworld.to","anomize.xyz","anonymz.com","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arakpop.net","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","axomtube.in","ayatoon.com","azmath.info","azmovies.to","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batcave.biz","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blavity.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","braflix.win","brbeast.com","brbushare.*","brigitte.de","bristan.com","browser.lol","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civicxi.com","civitai.com","civitai.red","claimrbx.gg","clapway.com","clkmein.com","cloubix.com","cloudfam.io","club386.com","cocorip.net","coinclix.co","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","criczop.com","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","daily.co.jp","dailyweb.pl","damitv.live","daozoid.com","datadoghq.*","ddlvalley.*","decider.com","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dlstreams.*","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dstat.space","dsvplay.com","duboku.info","dudefilms.*","dz4link.com","dziennik.pl","e-glossa.it","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","edp24.co.uk","eductin.com","einthusan.*","elahmad.com","embasic.pro","embedhd.org","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","exeporn.net","ezmanga.net","f51rm.com>>","facet.wp.pl","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstream.is","fbstreams.*","fchopin.net","feedzop.com","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filmcdn.top","filmez.club","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","fosters.com","foumovies.*","foxtube.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamedrive.*","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","genpick.app","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","glianec.com","globetv.app","go.fakta.id","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gumtree.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hornyhill.*","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","htrnews.com","htsport.org","huaren.live","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","igorslab.de","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgcloud.pw","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","irunfar.com","isaimini.ca","isosite.org","ispunlock.*","itavisen.no","itpro.co.uk","itudong.com","iv-soft.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbobo.com","javboys.com","javcock.com","javdock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jkanime.net","jnovels.com","jobnoid.net","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","kaembed.net","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","kumaraw.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lichess.org","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","mandiner.hu","manga1000.*","manga1001.*","mangahub.io","mangasail.*","mangatv.net","mangayy.org","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miiixdrop.*","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","motphimr.io","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mozilla.org","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrexcel.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onlyfans.to","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","oubghas.xyz","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playmate.to","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","pokopow.com","polygon.com","pomorska.pl","pooembed.eu","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornoxo.com","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","quizzop.com","radamel.icu","raiders.com","rainanime.*","rakuten.com","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","realbbc.xyz","redding.com","redgifs.com","redlion.net","redporno.cz","redtub.live","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","rogoyume.jp","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rubystm.com","rubyvid.com","rugby365.fr","rule34h.com","runmods.com","rvguide.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sctimes.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smarturl.it","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sonyliv.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spotify.com","spycock.com","srcimdb.com","sreality.cz","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamgg.net","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamix.so","streamm4u.*","streamup.ws","strikeout.*","strp2p.site","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","swtimes.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","thapcam.net","thaript.com","the-sun.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thewhig.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","timeful.app","titantv.com","titulky.com","tmailor.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","tukoz.com>>","tunebat.com","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uticaod.com","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","veronica.uk","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidavra.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidnest.fun","vidshar.org","vidshare.tv","vidspeed.cc","vidsrcme.ru","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipshort.in","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webtoon.xyz","weerslag.nl","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wideo.wp.pl","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xbokeps.com","xcandid.vip","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xxxshut.com","xztgl.com>>","y-2mate.com","y2meta.mobi","yamsoti.com","yesmovies.*","yesporn.vip","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youjizz.com","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","yurn.online","zedporn.com","zeilink.net","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1primewire.*","2017tube.com","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","398fitus.com","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","5moviess.com","720pstream.*","7hitmovies.*","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","afrotech.com","airflix1.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amarillo.com","amateur8.com","amestrib.com","amnaymag.com","amtil.com.au","androidaba.*","anhdep24.com","animalia.bio","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animelok.xyz","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninami.site","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","anonmp4.help","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apnablogs.in","app.vaia.com","apps2app.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","astrozop.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","bike-news.jp","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","brainzaps.tv","brawlify.com","bright-b.com","brobokep.org","bronco6g.com","bsmaurya.com","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","bysebuho.com","bysekoze.com","bysewihe.com","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camaro7g.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","cataz.stream","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","cdn.vifey.de","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","cjonline.com","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","codeberg.org","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","daotekno.com","darkibox.com","datacheap.io","datanodes.to","datawav.club","dawntube.com","ddlvalley.me","deadline.com","deadspin.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","dispatch.com","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","doodstream.*","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","dredyson.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","euronews.com","eurostream.*","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","facebook.com","factable.com","fairyhorn.cc","faiviral.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmifen.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","fxpornhd.com","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gazeta.press","gculopes.com","gekkonen.net","gelbooru.com","gentside.com","gerbeaud.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","greekfun.net","grigtube.com","grosnews.com","gseagles.com","gsmarena.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","hanime24.com","harbigol.com","hbnews24.com","hbrfrance.fr","hcaptcha.com","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaicube.*","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","heqviral.com","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hispajav.com","hivetoon.com","hktvmall.com","hmanga.world","hometalk.com","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgshots.com","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indian-tv.cz","indianxxx.us","indystar.com","infodani.net","infofuge.com","informer.com","instamod.app","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.cc","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jconline.com","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","knoxnews.com","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","lineup11.net","linfoweb.com","linkedin.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","looopings.nl","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakita.id","mangakoma.ac","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masahub2.com","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","miixdrop.net","mikohub.blog","milftoon.xxx","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkvcinemas.*","mlbstream.tv","mmsbee27.com","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momon-ga.com","momspost.com","momxxx.video","monaco.co.il","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsammo.com","newsextv.com","newslive.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","niganpro.com","nilesoft.org","niu-pack.com","niyaniya.moe","njherald.com","nkunorse.com","nonktube.com","nosubapp.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","of-model.com","oimsmosy.fun","oklivetv.com","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","ondebola.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opinie.wp.pl","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pal-item.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pcgamesn.com","pdfindir.net","peachify.top","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","petguide.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.1188.lv","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playmogo.com","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","pogoda.wp.pl","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","porn4fans.me","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornobae.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","proxyorb.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","px-cloud.net","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranger5g.com","ranger6g.com","ranjeet.best","rapelust.com","rarepike.com","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","rome2rio.com","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","scotsman.com","seahawks.com","seeklogo.com","seireshd.com","seirsanduk.*","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","starcima.com","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","supramkv.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tacoma4g.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","telegram.com","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","thecomet.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","theherta.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thertstv.com","thesleak.com","thesukan.net","thesun.co.uk","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tieulam.info","tigernet.com","tik-tok.porn","timestamp.fr","tinypass.com","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokuzl.net>>","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","traingon.top","trendyol.com","tresdaos.com","trustnet.com","truthnews.de","truyenvn.dev","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkdown.com","turkrock.com","tusfiles.com","tv3monde.com","tvappapk.com","tvasports.ca","tvdigital.de","tvnow247.top","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","udoyoshi.com","ugreen.autos","uhdwalls.com","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umogames.com","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","uploadvr.com","upshrink.com","uptomega.net","ur-files.com","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","utsports.com","uur-tech.net","uwatchfree.*","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vijviral.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vivasexe.com","vocalley.com","voirseries.*","volokit2.com","voznovel.com","vr.pornhat.*","walftech.com","warddogs.com","warezcdn.lat","wargamer.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","weerplaza.nl","westword.com","whatgame.xyz","whatsapp.com","whyvpn.my.id","wikifeet.com","wikirise.com","wildsnow.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhamster46.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxpicss.com","xxxputas.net","xxxshake.com","xxxstream.me","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zpserver.com","zvision.link","zxcprime.icu","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","4runner6g.com","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","aha-music.com","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","aniworld.to>>","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","archive.today","archivebate.*","archlinux.org","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoembed.app","autoextrem.de","autofrage.net","autoguide.com","autoscout24.*","autosport.com","autotrader.nl","avnsgames.com","avpgalaxy.net","azcentral.com","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bikerumor.com","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bitwarden.com","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","buienalarm.be","buienalarm.nl","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canlikolik.my","cantonrep.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.com","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chieftain.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","cotemaison.fr","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cuisineaz.com","cumlouder.com","cuttlinks.com","cybermania.ws","cyklobazar.cz","daddylive.*>>","daddylivehd.*","dailymail.com","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","daveockop.com","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desertsun.com","desifakes.com","desijugar.net","desimmshd.com","devsoftwr.com","dfilmizle.com","dic.pixiv.net","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.*>>","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedseek.xyz","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","ev3forums.com","exe-links.com","expansion.com","extratipp.com","f150gen14.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fbstream.is>>","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","finanse.wp.pl","findheman.com","firescans.xyz","firestream.to","firmwarex.net","firstpost.com","fitness.wp.pl","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","galesburg.com","gamearter.com","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesider.com","gamesite.info","gamesmain.xyz","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","goupstate.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","guessthe.game","gutefrage.net","gutekueche.at","gwiazdy.wp.pl","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hamhigh.co.uk","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hb-nippon.com","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaicop.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","hertsad.co.uk","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hikvision.com","hilites.today","hillsdale.net","hindimovies.*","hindinest.com","hindishri.com","hindisink.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hostzteam.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hutchnews.com","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgouskel.sbs","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itdmusicy.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.com","javhdporn.net","javleaked.com","javmobile.net","javplayer.com","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jlaforums.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanald.com.tr","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","kitsapsun.com","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksiazki.wp.pl","ksusports.com","kuchnia.wp.pl","kumascans.com","kupiiline.com","kurashiru.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkshortx.in","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","loanbixby.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-tube.me","manga18fx.com","mangabats.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","massgrave.dev","math-aids.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maxegatos.net","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memedroid.com","menshealth.de","metalflirt.de","meteocity.com","meteopool.org","meteovista.be","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","microsoft.com","miiixdrop.net","milfnut.com>>","minhatela.xyz","miohentai.com","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morencius.com","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtvuutiset.fi","multicanais.*","musicsite.biz","musikradar.de","mustang6g.com","mustang7g.com","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakastream.tv","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","nelomanga.net","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newportri.com","newschief.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","nlcosplay.com","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nupload.top>>","nuviatoon.com","nvimfreak.com","nwemail.co.uk","nwusports.com","oakridger.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","oklahoman.com","onemanhua.com","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","openlua.cloud","openrouter.ai","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","phimfun.net>>","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","pinterest.com","piraproxy.app","pirateproxy.*","pitchfork.com","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","plattformj.ch","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primeflix.*>>","primewire.*>>","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","rakuten.co.jp","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","recaptcha.net","rechtslupe.de","recordnet.com","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","selfhostt.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortnest.com","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spotsaver.net","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startseite.to","statesman.com","ster-blog.xyz","stereogum.com","stock-rom.com","str8ongay.com","stre4mpay.one","stream-69.com","stream4free.*","streambtw.com","streamcash.to","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.dev","streamvid.net","strefaagro.pl","stripecdn.com","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","talksport.com","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techybuff.com","techyrick.com","teenvogue.com","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","theintell.com","thejournal.ie","thelayoff.com","theledger.com","thememypc.net","thenation.com","thespruce.com","thestar.co.uk","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","trilltrill.jp","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","twitchcdn.net","twojeip.wp.pl","twstalker.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vpzserver.com","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weeronline.nl","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","whtimes.co.uk","widewifes.com","wikipedia.org","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmagazine.com","wmoviesfree.*","wonderapk.com","wordshake.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","bergwelten.com","best18porn.com","bestofarea.com","betaseries.com","bgmiesports.in","bharian.com.my","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonappetit.com","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btvnovinite.bg","buccaneers.com","buchstaben.com","businessua.com","bustmonkey.com","bustybloom.com","bysefujedu.com","bysejikuar.com","byseqekaho.com","byseraguci.com","bysesukior.com","bysetayico.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebretea.com","celebwhore.com","cellmapper.net","cesenatoday.it","cg-gamespc.net","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","christitus.com","cincinnati.com","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudhostt.com","cloudvideotv.*","club-flank.com","cntraveler.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","cpu-monkey.com","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","croq-kilos.com","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","daddylive.link","dafreeporn.com","dagensnytt.com","daily-jeff.com","dailycomet.com","dailylocal.com","dailyworld.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","devuploads.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","donegallive.ie","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ebooksyard.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elaoffcial.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","elnacional.cat","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epicurious.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","euronews.com>>","eveningsun.com","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","faitsfizzle.fr","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmifen.com>>","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-4u3omzw0.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gearjunkie.com","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gisvacancy.com","gknutshell.com","gloryshole.com","gobearcats.com","gofirmware.com","goislander.com","golfdigest.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","growgritly.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heraldnews.com","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","horoskop.wp.pl","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","houmatoday.com","howtocivil.com","hpaudiobooks.*","huggingface.co","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","in-cumbria.com","inbbotlist.com","indeonline.com","indi-share.com","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itechfever.com","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksonsun.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kongregate.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","lcsun-news.com","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lenconnect.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","macheforum.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","mangatrend.org","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marionstar.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","merkmal-biz.jp","meteologix.com","mewingzone.com","miiiixdrop.net","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modapkfile.com","moddedguru.com","modenatoday.it","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","monroenews.com","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorcycle.com","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mprogaming.com","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naplesnews.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","news-press.com","newsbreak24.de","newscard24.com","newsherald.com","newsleader.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nudisteens.com","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","packhacker.com","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pekintimes.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","pemersatu.link","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pinterpoin.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","play.xpass.top","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polsatsport.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","powershell.org","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","printables.com","proapkdown.com","pruefernavi.de","purediablo.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","puzzleship.com","queerdiary.com","querofilmehd.*","questloops.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","ravenscans.com","rbxscripts.net","rcostation.xyz","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaishd.*","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","saita-puls.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shelbystar.com","shemalesin.com","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","siusalukis.com","skat-karten.de","slickdeals.net","slidesaver.app","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsonline.*","sportsurge.net","sproutgigs.com","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","straemplay.org","stream2watch.*","streamdesi.com","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techcrunch.com","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","teleshow.wp.pl","telesrbija.com","temp.modpro.co","tennessean.com","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","the-leader.com","the-review.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thegleaner.com","thehesgoal.com","theinertia.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","tradingref.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","trustpilot.com","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vanityfair.com","vavada5com.com","vbox7-mp3.info","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidquickly.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","virustotal.com","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vscode-cdn.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wawalove.wp.pl","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","wigantoday.net","willyweather.*","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zentralplus.ch","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","0123movie.space","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","abyssplayer.com","adhs-zentrum.de","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","allclassic.porn","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","argusleader.com","arstechnica.com","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","autoshieldd.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestensuree.com","bestialporn.com","bestjavporn.com","beurettekeh.com","bgmateriali.com","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-magazin.de","bike-urious.com","bintangplus.com","biologianet.com","bizjournals.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","burytimes.co.uk","buzzheavier.com","caminteresse.fr","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","celticway.co.uk","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cheezburger.com","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","convertcase.net","coromon.wiki.gg","cosplaynsfw.xyz","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailyrecord.com","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","decomaniacos.es","definitions.net","delmarvanow.com","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","detroitnews.com","deutschsex.mobi","devonlife.co.uk","dhankasamaj.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","echo-news.co.uk","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedplayer.xyz","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","farminglife.com","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fayobserver.com","fcportables.com","fdlreporter.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","fifetoday.co.uk","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fitpractise.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","flywareagle.com","fmradiofree.com","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","ftsefutures.org","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gainesville.com","game.digitap.eu","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","gosanangelo.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","guidetechly.com","gut-erklaert.de","hacksnation.com","halohangout.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiocean.com","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hokiesports.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","huntspost.co.uk","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","inyatrust.co.in","iptvjournal.com","irvinetimes.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","jokerscores.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","kent-life.co.uk","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","leakgallery.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkvertise.com","linux-talks.com","live.arynews.tv","livescience.com","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","londonworld.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","mais.sbt.com.br","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","miiiiixdrop.net","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modelviewer.lol","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","myanimelist.net","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","nemzetisport.hu","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nissanzclub.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","northjersey.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","okiemrolnika.pl","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","paste4free.site","pawastreams.org","pawastreams.pro","pcgameszone.com","pdftoshokan.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phillyburbs.com","phonerotica.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","polenjournal.de","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radio-norge.org","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","ramdomlives.com","rangerboard.com","ravennatoday.it","rctechsworld.in","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","rule34video.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.org","santhoshrcf.com","savannahnow.com","savealoonie.com","scan-hentai.net","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","slateforums.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","ssdhostting.com","starcourier.com","stargazette.com","starstreams.pro","start-to-run.be","staugustine.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sulasokvids.net","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","surf-magazin.de","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tallahassee.com","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","taycanforum.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","thenewsstar.com","theprovince.com","thereporter.com","thespectrum.com","thestreameast.*","theterrace.scot","thetoneking.com","thetowntalk.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","timesonline.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokuzilla.net>>","tokyomotion.com","tokyomotion.net","tophostdeal.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tour-magazin.de","tradingview.com","transfermarkt.*","travelnoire.com","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","truyenhentaiz.*","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","turystyka.wp.pl","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","uppercutmma.com","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","verywellfit.com","vfxdownload.net","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","wealthcatal.com","weatherzone.com","web.epalovo.com","webmatrices.com","webtoonscan.com","wegotcookies.co","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","world-iptv.club","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xterraforum.com","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yandexcloud.net","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","aberdeennews.com","about-drinks.com","account.bhvr.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adonisfansub.com","adult-empire.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","antiphishing.biz","aopathletics.org","apkandroidhub.in","app.khaddavi.net","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianimage.co.uk","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","augustacrime.com","autotrader.co.uk","avellinotoday.it","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","bangyourwife.com","barrheadnews.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","beta.plus.rtl.de","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","blueridgenow.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","book.trivago.com","booksbybunny.com","boolwowgirls.com","boote-magazin.de","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","bristolworld.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","bysedikamoum.com","bysesayeveum.com","call2friends.com","cambstimes.co.uk","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","capecodtimes.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courierpress.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofaucet.xyz","cryptojunkie.net","cryptomonitor.in","culturequizz.com","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","dakotaforums.com","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","derbyworld.co.uk","derryjournal.com","designparty.sx>>","desikamababa.com","detroitlions.com","devaccellabs.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","divicast.watch>>","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","dudleynews.co.uk","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","explorersweb.com","fallbrook247.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","femmeactuelle.fr","fernsehserien.de","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","financeehelp.com","financeguidz.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","floridatoday.com","footwearnews.com","footymercato.com","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","gadsdentimes.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreegames.net","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","glasgowworld.com","globelempire.com","go.discovery.com","go.gociwidey.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","harpersbazaar.fr","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hemeltoday.co.uk","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hometalkpaid.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","infinityfree.com","inprogrammer.com","intelligencer.ca","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jacksonville.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","journalduweb.org","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kawaii-anime.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","leaderlive.co.uk","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linkneverdie.net","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","lk21official.*>>","logofootball.net","london-now.co.uk","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","lutontoday.co.uk","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","mangakuri.online","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-cccdoz45.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","meteoradar.co.uk","metin2alerts.com","milanreports.com","milfxxxpussy.com","milkporntube.com","misterdonghua.in","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","mypapercraft.net","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","namethatporn.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsletter.co.uk","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nikkansports.com","nintendolife.com","nl.hardware.info","nocsummer.com.br","nontonhentai.net","norfolkmag.co.uk","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","nwfdailynews.com","officecoach24.de","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineathens.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","outlook.live.com","overtakefans.com","oxfordmail.co.uk","ozbargain.com.au","pagalworld.video","pandaatlanta.com","pandafreegames.*","paradoxscans.com","parentcircle.com","parking-map.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","petoskeynews.com","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pilotsglobal.com","pinsexygirls.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","poconorecord.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","portsmouth.co.uk","post-gazette.com","postcrescent.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","printedwaste.com","privacy-mgmt.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-danmark.dk","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reporternews.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","rivianforums.com","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","scoutevforum.com","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","seriesflixhd.*>>","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sites.google.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sports.yahoo.com","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stalowemiasto.pl","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","suffolkmag.co.uk","sukidesuost.info","sunshine-live.de","supremebabes.com","sussexlife.co.uk","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","tatsumi-crew.net","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenational.scot","thenerdstash.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thestarpress.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tipsenweetjes.nl","tires.costco.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","trucosonline.com","truetrophies.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unfriend-app.com","unionpayintl.com","uniquestream.net","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeur-house.org","voyeurfrance.net","voyeurxxxsex.com","vrporngalaxy.com","vvdailypress.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","wearevoice.co.uk","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","woodmagazine.com","word-grabber.com","workxvacation.jp","worldhistory.org","worldjournal.com","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xvideos-full.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","3addedminutes.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","adrenaline.com.br","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","ayradvertiser.com","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","beaconjournal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","browncrossing.net","brushednickel.biz","bryantenunder.com","bucksherald.co.uk","burymercury.co.uk","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","cheboygannews.com","checkfiletype.com","chicksonright.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citizen-times.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","clarionledger.com","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cool-style.com.tw","coolmath4kids.com","coolmathgames.com","costcoinsider.com","countypress.co.uk","countytimes.co.uk","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","cumbrialife.co.uk","curiosidadtop.com","daemon-hentai.com","dailyamerican.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtbikerider.com","dirtyindianporn.*","dissmercury.co.uk","doctor-groups.com","dodi-repacks.site","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","duellinksmeta.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","ealingtimes.co.uk","earninginwork.com","easyjapanesee.com","easyvidplayer.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.net","elamigosgamez.com","elamigosgamez.net","elystandard.co.uk","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","fileditchfiles.me","financefernly.com","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","fitnakedgirls.com","fitnessplanss.com","flight-report.com","floridagators.com","foguinhogames.net","foodtalkdaily.com","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","free-wargamer.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gastongazette.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","googleapis.com.de","googleapis.com.do","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","harrowtimes.co.uk","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","heraldtribune.com","herefordtimes.com","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","hyperosthemes.org","iedprivatedqu.com","igniteseurope.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","integraforums.com","ipswichstar.co.uk","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","ithacajournal.com","jamesbornmain.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxworld.com","jardiner-malin.fr","jeechallenger.com","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lecanalauditif.ca","lectormangass.net","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lheritierblog.com","libertestreamvf.*","limerickleader.ie","limontorrents.com","line-stickers.com","link.snipcash.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","liverpoolworld.uk","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lubbockonline.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","macanevowners.com","madhentaitube.com","malaysiastock.biz","mangakakalove.com","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","meltontimes.co.uk","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","nationalworld.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","newryreporter.com","newsandstar.co.uk","newsshopper.co.uk","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","patriotledger.com","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","player.kinoton.cc","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","playstreaming.win","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","pressconnects.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","rancheroforum.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","redesigndaily.com","registerguard.com","reloadedsteam.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","rhyljournal.co.uk","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","sotemnovinhas.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","steam-repacks.net","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","superflixapi.best","surreycomet.co.uk","surreyworld.co.uk","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","the-gazette.co.uk","theadvertiser.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","theresident.co.uk","thermoprzepisy.pl","thesprucepets.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","times-gazette.com","timesnowhindi.com","timesreporter.com","timestelegram.com","tippsundtricks.co","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","walesfarmer.co.uk","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","bedfordtoday.co.uk","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","birminghamworld.uk","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","bridportnews.co.uk","burnleyexpress.net","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cayenneevforum.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","cheshirelife.co.uk","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","climaaovivo.com.br","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comeumamao.monster","comicspornoxxx.com","comparteunclic.com","consejosytrucos.co","consentmanager.net","contractpharma.com","cornwalllife.co.uk","cotswoldlife.co.uk","couponscorpion.com","cr7-soccer.store>>","cravenherald.co.uk","creditcardrush.com","crimsonscrolls.net","crm.urlwebsite.com","cronachedibirra.it","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dawgpounddaily.com","dcdirtylaundry.com","delawareonline.com","denverpioneers.com","depressionhurts.us","derehamtimes.co.uk","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dramathical.stream","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","enterprisenews.com","ericeastweight.com","essexlifemag.co.uk","eugenemakedraw.com","evdeingilizcem.com","eveningtimes.co.uk","eveningtribune.com","exactlyhowlong.com","expressandstar.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","favoyeurtube.net>>","fightingillini.com","financialjuice.com","fireflix.pages.dev","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gazette-news.co.uk","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","glasgowtimes.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","greeksubsmovies.me","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","guessthemovie.name","guessthephrase.xyz","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","heraldseries.co.uk","hibsobserver.co.uk","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","japanesemomsex.com","japanesetube.video","jeepreconforum.com","jemontremabite.com","jeux.meteocity.com","johnfullwonder.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","juliewomanwish.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","keighleynews.co.uk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kilburntimes.co.uk","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","legiongamesgod.com","leighjournal.co.uk","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lincolncourier.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","lyricsongation.com","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mcdonoughvoice.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","melaterevancha.com","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","miltonkeynes.co.uk","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newarkadvocate.com","newcastleworld.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","omnicalculator.com","onemileatatime.com","onepunch-manga.com","onetimethrough.com","onlineradiobox.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passeportsante.net","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penarthtimes.co.uk","penisbuyutucum.net","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","progress-index.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radio-hrvatska.com","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","record-courier.com","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporter-times.com","reporterherald.com","resultadostris.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","royston-crow.co.uk","ryanagoinvolve.com","sabornutritivo.com","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seacoastonline.com","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","sheboyganpress.com","shemaletoonsex.com","shieldsgazette.com","shipseducation.com","shrivardhantech.in","shropshirestar.com","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","sooeveningnews.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sports-arena.space","sportstohfa.online","stapewithadblock.*","starnewsonline.com","sthelensstar.co.uk","stirlingnews.co.uk","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","sturgisjournal.com","sunderlandecho.com","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tauntongazette.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","thecalifornian.com","thecelticbhoys.com","theendlessmeal.com","thefirearmblog.com","thegardnernews.com","thegoldendaily.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thetimesherald.com","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-series.co.uk","times-standard.com","timesandstar.co.uk","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tuscaloosanews.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldofpcgames.com","worldstreams.click","wormser-zeitung.de","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","alloaadvertiser.com","allporncartoons.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","ardrossanherald.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","bluemediadownload.*","bordertelegraph.com","bracknellnews.co.uk","brentwoodlive.co.uk","businessinsider.com","calculascendant.com","cambrevenements.com","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","clydebankpost.co.uk","collegeteentube.com","columbiacougars.com","columbiatribune.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","courier-journal.com","crackedsoftware.biz","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","dailycommercial.com","dailyjobposting.xyz","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","embed.tmp-url.pro>>","en-thunderscans.com","erotic-beauties.com","eveningnews24.co.uk","eventiavversinews.*","expresskaszubski.pl","fakenhamtimes.co.uk","falkirkherald.co.uk","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.dailymail.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","gazetteherald.co.uk","gazetteseries.co.uk","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","halesowennews.co.uk","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","heraldmailmedia.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","hollandsentinel.com","home-xxx-videos.com","horseshoeheroes.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ianrequireadult.com","ilbolerodiravel.org","ilforumdeibrutti.is","ilkleygazette.co.uk","independentmail.com","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jessicaclearout.com","joguinhosgratis.com","journalstandard.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kingjamesgospel.com","kingsofkauffman.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","lindalastattack.com","livetv.moviebite.cc","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","lufkindailynews.com","m.jobinmeghalaya.in","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","miamiairportcam.com","miamibeachradio.com","midweekherald.co.uk","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minutemirror.com.pk","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","multicanaistt.space","mycentraljersey.com","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","norwichbulletin.com","noticiascripto.site","nottinghamworld.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","octavestreaming.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","pcgamebenchmark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","planetminecraft.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornosubtitula2.com","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radio-australia.org","radio-osterreich.at","radiosantaclaus.com","radiotormentamx.com","rangersreview.co.uk","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","shreveporttimes.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somerset-life.co.uk","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","southcoasttoday.com","spa.center.ivof.com","sportitalialive.com","sportowefakty.wp.pl","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamcasthub.store","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","theboltonnews.co.uk","thecrazytourist.com","thedailyjournal.com","theglobeandmail.com","themehospital.co.uk","thenorthwestern.com","theoaklandpress.com","therecordherald.com","thesaltysoldier.com","thesimsresource.com","thesmokingcuban.com","thetorquereport.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","timesrecordnews.com","timmaybealready.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","urbandictionary.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vickisaveworker.com","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","wearesunderland.com","webhostingoffer.org","weneverbeenfree.com","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","witneygazette.co.uk","woffordterriers.com","worcesternews.co.uk","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yeovilexpress.co.uk","yorkshirelife.co.uk","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidauthority.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","augustachronicle.com","ayobelajarbareng.com","ayrshire-today.co.uk","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","birmingham-now.co.uk","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","boxofficebusiness.in","br.nacaodamusica.com","broncosportforum.com","browardpalmbeach.com","bucksfreepress.co.uk","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","captcha-delivery.com","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","centralfifetimes.com","charlestoughrace.com","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","commercialappeal.com","consiglietrucchi.com","coolmath4parents.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","cumnockchronicle.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","derbyshirelife.co.uk","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","dorsetmagazine.co.uk","downloadfilm.website","dunfermlinepress.com","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","eveshamjournal.co.uk","exmouthjournal.co.uk","extremereportbot.com","fairforexbrokers.com","falmouthpacket.co.uk","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fitbook-magazine.com","fle-5r8dchma-moo.com","football-ukraine.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-4urg44yg.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greenvilleonline.com","griffinathletics.com","hackingwithreact.com","hackneygazette.co.uk","halifaxcourier.co.uk","hampshire-life.co.uk","harboroughmail.co.uk","hartlepoolmail.co.uk","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heartsstandard.co.uk","heresyoursavings.com","hexham-courant.co.uk","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homehobbiesdaily.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","ilfordrecorder.co.uk","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","irresistiblepets.net","italiadascoprire.net","itpassportgokaku.com","jemontremonminou.com","jessicayeahcatch.com","jlwranglerforums.com","johnbeyondnation.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","lacronicabadajoz.com","lancashirelife.co.uk","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveonlinesports.net","loriwithinfamily.com","lostcoastoutpost.com","luxurydreamhomes.net","main.sportswordz.com","malverngazette.co.uk","mangcapquangvnpt.com","maps.blitzortung.org","maryspecialwatch.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","milforddailynews.com","milfordmercury.co.uk","mkvmoviespoint.autos","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","newhamrecorder.co.uk","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","northernfarmer.co.uk","notebookcheck-cn.com","notebookcheck-hu.com","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","odkrywamyzakryte.com","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","oraridiapertura24.it","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","peeblesshirenews.com","pembrokeobserver.com","pesprofessionals.com","petbook-magazine.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","readcomicsonline.lol","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","salamanca24horas.com","sanadegreecollege.in","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","sexypornpictures.org","sidmouthherald.co.uk","sloughobserver.co.uk","socialmediagirls.com","socket.pearsoned.com","solomaxlevelnewbie.*","southbendtribune.com","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","statesmanjournal.com","steamunderground.net","stevenfamilyedge.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","sudburymercury.co.uk","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","switchbacktravel.com","tainguyenmienphi.com","tasteandtellblog.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","the-daily-record.com","thedailyreporter.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","theleafchronicle.com","theoldhamtimes.co.uk","thepublicopinion.com","thescottishsun.co.uk","thesimplifydaily.com","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totallysnookered.com","totalsportek1000.com","toyoheadquarters.com","tracylocalschool.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","unblockedgames.world","underground.tboys.ro","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchsuitsonline.net","watchtheofficetv.com","weekendletters.store","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitehavennews.co.uk","wife-home-videos.com","wiltshiretimes.co.uk","wirtualnynowydwor.pl","worldgirlsportal.com","www.digitalocean.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banburyguardian.co.uk","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","cantondailyledger.com","celebritydeeplink.com","charlessheimprove.com","chesterstandard.co.uk","collinsdictionary.com","comentariodetexto.com","community-scripts.org","conselhosetruques.com","coolmath4teachers.com","cotswoldjournal.co.uk","courierpostonline.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","daventryexpress.co.uk","davescomputertips.com","derbyshiretimes.co.uk","desitab69.sextgem.com","desmoinesregister.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","dunmowbroadcast.co.uk","easyworldbusiness.com","elcriticodelatele.com","electricalstudent.com","ellwoodcityledger.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","essexcountynews.co.uk","exchangeandmart.co.uk","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-nv2xl8an.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","forestryjournal.co.uk","free-3dtextureshd.com","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freepressseries.co.uk","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greatfallstribune.com","greenwichmeantime.com","guardian-series.co.uk","hackedonlinegames.com","halsteadgazette.co.uk","heraldtimesonline.com","hersfelder-zeitung.de","higherorlowergame.com","hillingdontimes.co.uk","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","impartialreporter.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","jessicachoosemake.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","ledburyreporter.co.uk","lesbianfantasyxxx.com","lincolnshireworld.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","mavericktruckclub.com","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nationalgeographic.fr","netsentertainment.net","niederschlagsradar.de","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcmap.place.naver.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","petersfieldpost.co.uk","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","providencejournal.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","romfordrecorder.co.uk","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scotlandrugbynews.com","scriptgrowagarden.com","scrubson.blogspot.com","scrumpoker-online.org","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","southsideshowdown.com","southwalesargus.co.uk","southwestfarmer.co.uk","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stourbridgenews.co.uk","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","techbook-magazine.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","thenews-messenger.com","thenorthernecho.co.uk","theprofoundreport.com","thesavvyexplorers.com","thetruthaboutcars.com","thewebsitesbridge.com","thisiswiltshire.co.uk","thurrockgazette.co.uk","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","visaliatimesdelta.com","voyeur-pornvideos.com","walterprettytheir.com","warwickshireworld.com","watch-movies.com.pk>>","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","watfordobserver.co.uk","wausaudailyherald.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","wisbechstandard.co.uk","worksopguardian.co.uk","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","anguscountyworld.co.uk","appstore-discounts.com","arbitrarydecisions.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","bicesteradvertiser.net","biggleswadetoday.co.uk","blackamateursnaked.com","blackpoolgazette.co.uk","borehamwoodtimes.co.uk","brunettedeepthroat.com","buxtonadvertiser.co.uk","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","caseyimpactstation.com","celebritymovieblog.com","chillicothegazette.com","clixwarez.blogspot.com","cloudorchestranova.com","comandotorrentshds.org","conceptoweb-studio.com","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewsburyreporter.co.uk","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","eastlothiancourier.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","expatexplorer.hsbc.com","ezaudiobookforsoul.com","f150lightningforum.com","fantasticyoungporn.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","garylargeavailable.com","gazetteandherald.co.uk","gdl.freegogpcgames.xyz","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","greatbritishlife.co.uk","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","hucknalldispatch.co.uk","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","internetradio-horen.de","irasutoya.blogspot.com","islingtongazette.co.uk","jacquieetmicheltv2.net","jeepgladiatorforum.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","living-magazines.co.uk","livingincebuforums.com","llanfairpwllgwyngy.com","lonestarconference.org","lowestoftjournal.co.uk","ludlowadvertiser.co.uk","m.bloggingguidance.com","marissasharecareer.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","metrowestdailynews.com","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","news-journalonline.com","nicolehappyoutside.com","nilopolisonline.com.br","northamptonchron.co.uk","northnorfolknews.co.uk","obutecodanet.ig.com.br","oeffnungszeitenbuch.de","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","osint-info.netlify.app","paginadanoticia.com.br","palmbeachdailynews.com","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","pontiacdailyleader.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","readingchronicle.co.uk","redlandsdailyfacts.com","repositoratacadao.cyou","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","southendstandard.co.uk","stornowaygazette.co.uk","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thewestonmercury.co.uk","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universityequality.com","wakefieldexpress.co.uk","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","westerntelegraph.co.uk","whitchurchherald.co.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","allschoolboysecrets.com","andoveradvertiser.co.uk","aquarius-horoscopes.com","arcade.dailygazette.com","architecturaldigest.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","battlecreekenquirer.com","bestbondagevideos.com>>","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","bridgwatermercury.co.uk","buerstaedter-zeitung.de","burlingtonfreepress.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","columbiadailyherald.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","dumbartonreporter.co.uk","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","examiner-enterprise.com","exclusiveindianporn.com","fantasysports.yahoo.com","fightforthealliance.com","financeandinsurance.xyz","footballtransfer.com.ua","fourchette-et-bikini.fr","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","greenocktelegraph.co.uk","hattiesburgamerican.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","jefferycontrolmodel.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","knutsfordguardian.co.uk","kutubistan.blogspot.com","lancasterguardian.co.uk","lancewhosedifficult.com","lansingstatejournal.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","matthewhotelscience.com","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","myhomebook-magazine.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northdevongazette.co.uk","northwalespioneer.co.uk","northwichguardian.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pamelachangemission.com","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","peterboroughtoday.co.uk","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","poughkeepsiejournal.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","publicopiniononline.com","puzzles.pressherald.com","rebeccacostthousand.com","rebeccapracticeloss.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","standard-freeholder.com","stevenspointjournal.com","stowmarketmercury.co.uk","streamtapeadblockuser.*","swindonadvertiser.co.uk","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","thescottishfarmer.co.uk","thisisoxfordshire.co.uk","tips97tech.blogspot.com","traderepublic.community","travelbook-magazine.com","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","wiltsglosstandard.co.uk","wimbledonguardian.co.uk","windowsaplicaciones.com","xxxjapaneseporntube.com","yourlocalguardian.co.uk","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","basingstokegazette.co.uk","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","cybertruckownersclub.com","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","doncasterfreepress.co.uk","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","ellenpoliticalfollow.com","enfieldindependent.co.uk","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","gamershit.altervista.org","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hampshirechronicle.co.uk","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jeanprofessorcentral.com","jennifereconomicgive.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","katherineschoolphone.com","lampertheimer-zeitung.de","largsandmillportnews.com","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","majorleaguepickleball.co","mansfieldnewsjournal.com","mariatheserepublican.com","marshfieldnewsherald.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","montgomeryadvertiser.com","multivideodownloader.com","my-code4you.blogspot.com","northantstelegraph.co.uk","northernirelandworld.com","northsomersettimes.co.uk","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","play.mercadolivre.com.br","player.subespanolvip.com","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","redditchadvertiser.co.uk","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","southwalesguardian.co.uk","stream.googleapiscdn.com","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thescarboroughnews.co.uk","thunderousintentions.com","tirumalatirupatiyatra.in","tivysideadvertiser.co.uk","tricountyindependent.com","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","wandsworthguardian.co.uk","warringtonguardian.co.uk","watchdoctorwhoonline.com","watchtrailerparkboys.com","wharfedaleobserver.co.uk","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","bucyrustelegraphforum.com","burlingtoncountytimes.com","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fifties-beat.blogspot.com","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","harrogateadvertiser.co.uk","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","lancastereaglegazette.com","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","messengernewspapers.co.uk","northwaleschronicle.co.uk","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","peterboroughmatters.co.uk","pickleballteamleagues.com","pickleballtournaments.com","portclintonnewsherald.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","rotherhamadvertiser.co.uk","sataniabatch.blogspot.com","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","storage.googleapiscdn.com","telenovelas-turcas.com.es","thebeginningaftertheend.*","thesouthernreporter.co.uk","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","barryanddistrictnews.co.uk","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","bromsgroveadvertiser.co.uk","change-ta-vie-coaching.com","chelmsfordweeklynews.co.uk","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","eastlondonadvertiser.co.uk","elperiodicoextremadura.com","eppingforestguardian.co.uk","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","greatyarmouthmercury.co.uk","helmstedter-nachrichten.de","html5.gamedistribution.com","interestingengineering.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","kidderminstershuttle.co.uk","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stroudnewsandjournal.co.uk","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wisconsinrapidstribune.com","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","yorkshireeveningpost.co.uk","buckscountycouriertimes.com","celestialtributesonline.com","chardandilminsternews.co.uk","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","denbighshirefreepress.co.uk","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","helensburghadvertiser.co.uk","iphonechecker.herokuapp.com","kathyinformationwhether.com","leightonbuzzardonline.co.uk","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","northumberlandgazette.co.uk","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","redhillandreigatelife.co.uk","richardquestionbuilding.com","runcornandwidnesworld.co.uk","rupertisdivingintoocean.com","saffronwaldenreporter.co.uk","somersetcountygazette.co.uk","sztucznainteligencjablog.pl","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","zanesvilletimesrecorder.com","barkinganddagenhampost.co.uk","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","wattonandswaffhamtimes.co.uk","www-daftarharga.blogspot.com","xn--90afacv0cu2a3cr.xn--p1ai","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","becclesandbungayjournal.co.uk","braintreeandwithamtimes.co.uk","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","dumfriesandgallowaylife.co.uk","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","jeremyparticipantanything.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","thefreedommatrix.blogspot.com","thetfordandbrandontimes.co.uk","thetottenhamindependent.co.uk","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","bordercountiesadvertizer.co.uk","caq21harderv991gpluralplay.xyz","clactonandfrintongazette.co.uk","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","kryptografie-de.translate.goog","maldonandburnhamstandard.co.uk","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","readgraphicnovels.blogspot.com","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","xn--90afacv0clj6ac0dxa.xn--p1ai","akihabarahitorigurasiseikatu.com","darlingtonandstocktontimes.co.uk","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","richmondandtwickenhamtimes.co.uk","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","hollywoodhinditracks2.blogspot.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","harwichandmanningtreestandard.co.uk","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","burnhamandhighbridgeweeklynews.co.uk","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","wymondhamandattleboroughmercury.co.uk","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b"];
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
        const $scriptletArglistRefs$ = /* 13935 */ "1923;-1924;425;1028,1747;1745;136;1565;58;116;477,627;58,486;3021;377,486,502,792,1126,1127;158;1132,2182;1747;1304,2593,2594;58,502,828,3778;1748,2260;158;58,1497;158;158;158;2848;-59,-1924;3515,3516;60,408,513,521,2058;440,2792,2793;425,513;2014;1375;568,1749;158;3293;1054;2176;158,449,1863;136;538,1127,1194;946;158;158;158;-157,-2842,-2843,2848;158;-1924,3095,3096,3097,3098,3099,3983,3984,3985,3986;58;58,408,460,464,465,466,467,1747;486,996,997,998,999,1000,1001;158;3045;1028;408;1745;486,729;683;3308,3309;1747;1028;1947;58,408,486,1749;405;130,131;58,2458;1846;136;432;136,439;432,460,594,833;130,447;486,1999;2022,2023,2024,2025;220,748;1497;3991;1028;393;158;58;58,452,1028,1748,1894,1895;-1924;-1924;486,502,792,1220,1746;3686;58,513;1846;58,792,1221;58,396,408;638,729;158;405;973,1294;155,169,580,720,1846,1847;2825;-136,1370;158;58;60,1750;158,1846;425,432,486,537,792,1403;136;60,61,424;247,248;2553;3591;61;670,1770;60,670,3813,3814,3815;1565;1748,2260;1888,3640;1748,2260;1751,2947;432,458,459,1745;155;1168,3686;158;692;439;377,513;58,1074;2312;3729;405;158;1944;130;130;158;1945;158;-136,1370;58,3844;158;58,486,1028,1577,1578;58,130,486,1564,1565,1566,1567;631;425,432,486;1748;408,425,665;58,460,1565;837;158;58;1948,1949;158;2950;486;158,1301,2666;158;58,59,60,61,1896;765;3933;158;1426;408,478,508;158;1293;1211;1565;1028;2176,2177;1749;2187;58,130,486,1564,1565,1566,1567;1305;2278;158;1154,1701;58,377,-378,408,789;58,1611,1618;1028;158;2954;58,59,60,61;158,1078;580;58,828,844,2219,2734;158;168;1304;2292,2293,2294,2295;646;611;58,729,2606;58;58,452;3173;408,860;432;136;1497;935;3222;490;867;1132,1380;1857;1259;1749;58,425,486,582,626;1177,1215,1497,2717;479;2713,2714;631;433,1028,2811;58;815;1132,1461,1749,2334;58,3217;1625,2801;1819;1028;514;1848;1846;125;1846,1847;3620;1846;402,403,1846;452,453;-1924;631,661,1714;413;-1924;130,1825,1826,2514;2316,3137;158,373,1300;747,2518;432;2986,2987,2988,2989,2990,2991,4016,4019;447;148,2118;158;61,631;1846,1847;2192;1846;3276;2472;2483,2614,2682;1819;1405;58,452,1894,1895;58;-1924;419,633,853,854;1477;396;58,486,502,792,1220,1746;486,1218,1219,1747;3950;1530;414;1497;1747;3417;447,2543,2544;492,649;158,405;155,169,405,580,654;1276;432,535,1028,1565;158,1297;-136,1370;1707;58,1354,1746;1565;58,805,1746;631,1306,2448;1747;-136,1370;1366;-136,1370;595;408,425,536,665,882;1231;158;136;1826;1497;58,3184,3185;1497;61,584,631;631;1867;1178;1178;1178;631;61;58,659,1283;604;454,1135;3302;1132,1674,2334;3308,3309,3662;314,315;487;408,487,513;3255,3256;2645;158;1565;158;2920;751,752;58,1497;486;3715;58,486;508,631,1214;888;631,1565,1714,3039;729;158;1497,1499,1500,1501;-1924,3623,3624;3840,3841;1565;1749;1028,1157,1158;158,1846;158;2136;130;58,867,1748,2218;1826;943,1746;158,1301,1696;722;2981,2982;58,828,2219;158;148,741,2176,2408,2998,2999,3000,3001;158;3514;1565;513;58,3844;58,1636;2640;197,198;160,161,2607;432,487,513,893;136;408,425,665;58;-441,-2793,-2794;58;58,442,513,615,665,747,787,802;3422;3613;1356;1819;58,821;158,818,1207;61;1497;551,1145;584;1819;1331;158;58;458;58,1028,1748,1760;513,1565,1748;158;2088,2089;513;1846,1847;58,454,1752,1913;1028;1565;197;119,1846;486,1746;1459,1460;1779;58,460,493,494,495;512;2958,2959;1746,1747,1748,1751;1846,2735;1846,2735;3165,3166;58,60,638,1154;58;818;1618;58,1747;631;58,62,63,64,65,66,67,1028,1565;495;408,425,513,665;1748;58,538,1194;61,631,3609;538,1127;1066;134;1981,1982,1983,1984,1985,1986;1136,1137;1746;148,3301;1826;438;1945;1779;1748;844,2219;844,2219;72,73,158,1296,1303,1846,1847,2550;2358;427;413,1846,1847;649,1223;405,1819;528;3850,3851;58;58;158;136;1497;68,69;58,1028;2193;61;1565;1565;254,405;729,1748,1753,1903,2993;1497;1769;631,1727;1748;486,792;631,1621;1497;68,69;58,631;631,659,908;1846,1847,3513;3861;1565;1028;513,582,3190,3192;692;1779;477;1132;58,486;1087;401;3005;1157;1313;500,631;158;-1924;58;1380;158;158;670;61,155,631,2365,2366,2367,2368;1846,1847;1867;1215;1571,1586,1587;2566,2567;631;58,513,1749;1497;1497;158;405;75,-1924;58;631;405;158;1745;821,1110;58,631;535;1497;-1924;2872;61,631;1583,1634,1654,1677,1678,1679,1680,1681,1682,1683,1684,1685;1583,1634,1654,1677,1678,1679,1680,1681,1682,1683,1684,1685;1711;58;58,1779;486,1529,1530,1531,1532;2912;869;1748;1779;58,1779,1780;1749;2699;58,486,1132;1192;1826,3948;58,3807,3808,3809,3810,3811,3812,3850,3851;58,513,1746,1748;447,1808;1281;1815,3893,3894;1636,2879,2880,2881;1497;535;3260;158;3238;58,613;452;58,1565;58,62,63,65,66,67,1565;58;58,452,1028,1894,1895;508;1119;424,432,514;1281;3089;1846;1169,3686;1356;1497;115;60,1028;486;1745;58,1565,3213;670,1629,1630;58,442,638,729;513;2172;452,982;1747;158;486,729;3909;1028,1757;1745;373,415,1300,1691;3652,3653;875;447;697,1743;1748;58,1565,3213;1846;408,766;3909;1713;1565,3409;3069;432,2584;408;1028;1028;-136,1370;158,399,400,401,1293;1497;158;130;2235;58,1749;487,1746;401;508,584,1058;158;158;3316;3316;1497;1846;58;3062;1843;1789;969;413;896;3482,3483,3484,3485,3486,3487,3488,3489,3490,3491;460;58,454,1135,1775;502;631;467;-1939,1939,3947;58,425,587,610,611;471,610;471,610;58,613;1846,1847;376;2227,2228;631,2940;1745;1497;61;3941;631;58;-1924;1028;1748,2260;201;2393;58,1746;4016;-1924;2659;2393;1846;2393;673;2393;2393;2393;630;58;1497;2393;68,69;68,69;1846,1847;1690;148,1977,4012;703,1846;158;136;432,486,792;58;-1924;436;753,754,755;636;1815;1530,2592;58,613;513;1779;4010;3835;58,2611;432,442,486,502,536;58,1907,1909;2796;1749;58,1956;2448;130,2514;2408,2998;-157,-2838,-2839,-2840,-2841,2848;58;460,1750;1746;68,69;486;1747;2791;130;670,3089;2221;58;2960;376,1440,1441;405;58;1747;432;3932;2801;1529;631;535;442,513,1049,1050,1051,1748,1749;-1924;1867;58,613;425,432,486,513,626,893;766;594,1791,1792;3063,3064;701,702,1748;58,1747;1014;158,1846;58,507;424,631;487;58;68,69;1503,1504;158;1749;408,425,1749;158;158;158;158;158;158;158;158;158;1796;627,670,1583,1634,1637,1642,1643,1644,1677,1678,1679,1680,1681,1682,1683,1684,1685;510;2801;2119;471;670,1583,1634,1638,1639,1640,1641,1677,1678,1679,1680,1681,1682,1683,1684,1685;631,1497,1708,1709;631;454;2483;638,729;638,729;638,659,729,2342;638,729;447;1759;439;1517;1110;1497;2750;470,1145,1146;1565;58,408,513,592,593,594,595,596,1745;535;136,1512,1513;991;1819;3949;1846,1847;1009,1019,2493;1674,3831;158;1550;158;1087;158,405,1294;840,1466,1582,1583,1584;58,454,1752,1913;692;1356;486,792;1846,1847;61,452,551,584,631,2233,3522;1748;1747,1757;779;500;158;1231;1748,2260;513,970;58;58,486,513,792;1072;1431;1298,3241;3010;158;58;58;1747;61;1846,1847;-157;1776;1443;3410;88;1281;806,2697;58,486,792,1636;1115;1028;1565,1748;415;933;408;1747,1752;58,2219;1753;1746;58,1400,1782;439,2205,2206;1846,1847;58;460,1746;1750,1751;58,454,513,638,1028,1565,1746,3135;1779;530,531;715,716,717,718;58;436,715,716,942,1565,1748;2505;2195;58,59,60,61,1896;155,169,1846,1847;396;2019;2019;58;148;58,1224,2513,2519;1129;1704;1746;1565;589,1205;201;513;58,551,584,1779,1925,2766;2034;1693;1843;719;158;1550,3142,3144,3145,3146;3663,3664;1497;486;1243;3919;2466;408,860;2750;58;68,69;976,977;631;631;631;58,729,1565,2606;98;-197,-1924;3754,3755,3756;1253;437,460,649;631;1746;2453;130,860;454,1565,1779;68,69;487,897;1497;167,3286;408,1032;486;486;58,1565,3213;252,253,2314,2315,2316,2317;1526;58;136,480,481,482,483,484,485,486;454;-1924;58,3304,3688;2324;436,465,535,1028;1565;68,69,1565;1750;68,69;1028;932,2229;155,924,929,930;514,648,649;3514;58,508;58,1747;470,497;1497;1400,1401;68,69;729,1028;68,69;584;58;58,1028,1565,2058,2119;1497;1028;1349;58;58,1747;686;3191;447;1788;124,3855;439,754,3176,3177,3178,3179;486,536,792,1749;-1924;58;58,425,486,1746;486,792;821,1535;2707;3704;432,520;1843;3961;405;1867;1846,1847;1565;1747;408;2263;611,963,1321,1565;670;61;2037;58,2601;670;58;670;1497;-1924;1746;3355;1565;2028;1446;3730;419;-1924;1756;436,1048,1747;3661;1748;136,1512,1514;2233;631;401,1370,1497;-1924;662;136;976,977;470,624;58,1565;1747;443,445;58,1187,1565;1745;1762;432,486;158;2041;1497;1497;537,1746;158;432,1013;1343;3156,3157;4013;158;2865,2866;68,69;777,903;447;3423;1066,1067,1068,1069;376,1788;58,2889;697,988,3469;3428,3429;119,1846;-1924;1749;513;58,61,1565;1407;821,1535;631;1209;-1924;625,647;158,1078;665,1129,1745;486,729;821;-1924;58,130,486,1564,1565,1566,1567;1565,1748;1748;3514;158;724;792,941;486,792;1636,2879,2880;828;58,452,1028,1894,1895;58,452,1028,1894,1895;454;1497;933;3131;425;1746;158;58;1497;68,69;631;58,452,1028,1894,1895;58,452,1565,1894,1895;-2838;2924;1028;58;58,452,1565,1894,1895;1565;1846;1044,1315;58;395;58;1497;631;2513;60,1810,1811;377,630;670;1826;1795;432,627,770;136;1028;1758;158,415;58,1028,2633,3211,3212;1729;1028;1028;1565;438;3156;500;624,2599,2600;631;1746;130,3529;405;486,1504,1529,1530,1531,1532;1940;438;58,1565,2678,3213;631;2384;488;631;1028,1748;58;-1924;1126;591;415;631;1565;861,862,1565;58,1583,1626,1677,1678,1679,1680,1681,1682,1683,1684,1685;1747;741;58,1028,2633,3211,3212;1565;1746;1779;1497;1747;1750;2192;58,59,729,1748,3149;486;2554;263,264;2288;499,1819;2459;1565,1708;519,631;2147,2148;471,587,611,631;1497;424,432,514;58;1497;1497;649;551,584,631;551,584,1921;3963;1749;3069;437,440,806,1727,3690;1565;-1924;1776,1778;1497;1748;3526;1278;1497;1747,1748;3605;3605,3737,3738;58;470,631;58;1753;1281;1565,3437,3438,3439,3440;486,1470;-157,-2838;1497;957,958;68,69;1497;3493,3494;922;1497;130;58,471,631;1565,1749;717;58,729,1028,1565;2902,2903;1746;821;58,1028,2633,3211,3212;631;1748;1497;1565;621;61,377,432,1712;68,69;1565;1565;158;1497;1419;1747;1231;1132;631;58,1748;1017;2318;849;58;1497;1306;847;468;1747;2359;487;58,425,587,611,612;58,425,506,514,610,612,845;58,425,587,610,611,612,613;2254,2255,3954;58,425,587,610,611;1791;158;815;1278;419;3056,3057;2335,2336,3060;438;58;1746;158;631;584,631,1497;631,1276,1375;2624;61,584;61,613;631;61,584;3657;61,1789;631;3847;584;513;631;58,1746;-159;-159;438;1779;1497;1215;58,982,1084,1636,3160;58,1746;636;1748,2260;1748,2260;158,224,373,1692;58,638,1028;631,1714;61,631,1748,2233;1028;631,1497,1956,3224;1956,3700;68,69;58;68,69;158;1018;697;1846;396;486;487;500,631;58,513;1497;753,754,755;3535,3536;432;1856;-1924;1746;1819;1243;2464;127,128,130,131;1097;58,1565;408,728,729,844;102,103,104,105,3785;1846;1246;408,3188;631;1065;1565,1708;1274;58,60,442,638,729,1154;2661,2662;401;1497;58,981,1749;158,449;158;58;613,2426,2427,2428,2429;1565;88;58,584,659,904,1929;486,792;1166;58,1908,1909;408,1747;1747;1028,1565,3371;405;815;245,246;1497;631;419;425;660;1746;58;58,511;631;3044;1497;2677;1843,2112;158,1096;1135,3592;638;61,592,3207;1748;1497;158;631;1028;3542;1747;1497;3996;130;1565;2233,2513;1945;58,3688;58;2893;1497;2034;1819;1749;1930,1936;1497;405,1846;535;58,408,1195,1747;1497;1281;437,500,631;58;1497;2395;3802,3803;486,1028,1550;1843;631;2082;1815;158,656,973;58,1129,1751;1497;158;1278;58;1843,1846;631;1565;1959,-3520,3520,3521;58,1746,1747,1748;1497;61;631;631;58;500,631;495,778,1163,1164,1165;432;58;611;631;58;278;158;-1924;425;1269;58;1497;2401;2864;631;486;1245;840;158;3626;58,2000;1750;3068;638,1519,3632,3636,3637;58,495,778;1707;58,487;584;548;2244;1596,1597,1598;362;3436;3312,3313;376;3532,3533,3534;2026;58,1526;486,792;158;1748;1749;1714;2313;1846;3106,3107;1028;638,729;638,729;837;401,631,887;147;3615;3150,3151,3152;1747;486,729;631;631;58,3657,3658,3659,3660;1497;1747;1846;1497;2801;58,513,792,1221,1745;670,2507,2787,2788;1120;486,792,1575;432,581;1497;582;1565;688,689,690;1753;514,539,1212;818;1754;1565;158,374;58,130,486,1564,1565,1566,1567;863;447;2855;840,1466,1582,1583,1584;269,1603,1604;58;58,1565,3545;58,1565;58,454,1752,1913,1914,1915;4001;377;3827;1007;61;1085,2052;158;1746,1747,1748;408,582;994;584;1471;976,977;1490;486,1671;1281;2222;1393;1177;539,540,2297;2018;58,2992;-136,1370;1816;58,1028;61,631,2158;58,136,594,1747;631;408,436;502;1502,1503,1504;68,69;242,243;1736;631;670,3342,3343;1306;1025;158;1375;452,611,631;-1924;88;976,977;58;1497;1220;497,1037,1038;1414;631;158;1753;670,1906,3856;1749;1868;1384;452,631;1231,1702,1703;1746,1753;2320;433;604,1745;-191;1497;432,578;58,594;58;68,69;1749;2653;962;415,418;58;58,61,98,1565,3797;58,61,98,1565,3797;1746;670,741,1674;58,61,452,1565,1894,1895;58,60,442,638,729,805,1154;1708,1779;2188,2189,2190;3907,3908;3476;-1566,1779;1565;158;432,486,792,793,794;58,1565,2641;486;58,870;1497;439;467,716,1135;486,860;1779;58;1326;-1401,-1402;1279;2962;3982;1788;58;1028,1133;1497;1295;1746;58;838,1504,1506,1507,1510;3474,3475;130;438,2258;1497;1497;-2844,-2845,-2846;61,1707;452,611;3447;2750;3869;500,514,1247;471;68,69;847;432;631;649,1223;3150,3151,3152;1749;955;58,437;2292,2293,2294,2295;1497;611;631;631;58;-1924;58;1746;1855;1483,1497,1581;1749;3477;58,828,2219;495;1748;58;821;1746;1028;1282;1826;2371;2868,3945;3944;1565;638;1903;486,1583,1635,1636,1677,1678,1679,1680,1681,1682,1683,1684,1685;570;638;1748;60;58,805,1308;1028;275,276,1632,1954;58,1687,1788;542;2477;2130;1746,1748;1749;58;729,1749,2396;58,1028;1497;1497;582,1748;1810,1811;1497;1027;1028;1565,1594;158;377;988;631;570;58,3688;815,2149;1747;1028,1565;437,471,587;631;58;3718;58,1565;495;1565;447;1028,1747;158;58;508,1747,2119;58,3411;1167;439,754,3176,3177,3178,3179;58,2708,2709;447,486,584,631,1028,1565,2055,3174,3175;1348;3753;729;1746;58,452,1565,1894,1895;58;3843;349,350;1497;806;61;1497;58,1747;2597;637,1565;408;1747;1746;58,584,1565;1565,3437,3438,3439,3440;1028;2453;1497;776,777;1565;584;158;60,470,487,500,594,846;401,2386;447,1452,2577;1747,1748;460,1759;4013;4013;4013;4013;4013;4013;631,1776;158;2581;976,977;741;584,631;1749;1028;442,1051,1748;436;3030,3031;1565;3657;1497;631;1497;1712,3800,3801;487;2332;1747;61,58;3244;2649;1005;486;631;3916;1497;511;508,1750,2119;1497;58;965,966;58,1400,1782;631;1281;1543;1215,1497;631;1945;3779;2533;58,471,631;61;1497,1810,1811;1795;1497;439,1846;535;1748;460;130,447,2677,3367;1846;495;1819;1497;649,904,988,1069,1223,1734;539;649,904,906,988,1069,1223,1734;487;119,1846;973;1846,1847;1497;158;1857;1135,3592;567,568,569,1749;994;631;1810,1811;1846;3514;-1924;58,665;130,2921,3087,3088,3089,3090,3091,3092;741,1674;3863;709;1149;2683;-1924;988,2402;815;296;1497;2809;447,1808;158;1356,1497;-1924;1497;1243;1748,2444;3711;1746;425;631;1166;2463;631;58;487,768,769,1749;486,1529,1530,1531,1532;486,1529,1530,1531,1532;417;58,452,1028,1894,1895;58;2782,2783,2784,2785;1497;433,847;58;631;158,1298;568,569,1749;1418;130;2801;741,3089;-59,-1566,-1766,-1767,-1768,-1924;130;1596,1597,1598;691;1846;377,788;792,1749;584;631;961;405;1748,1779;654;130;1129,1258;1674;2969;1753,2461;119,1846;1243;234,235,361;1747;2994;1074;1851;792;792,1343,1749;486;345;539,2270;630;631;3007;1748;1274;60;58,1400,1782;2683;3197,3198;1464;1747;432,513;500;2616;470;1346;1788;1497;486,1529,1530,1531,1532;486,1529,1530,1531,1532;158;436;1746,1747,1748,1749;513;2192;1749;1360;486;158;188,189,1846,1847,3775;58;535;60,61;631;81,1497,2771;-59,-60,-61,-62,-1897;1017;1747;1746,1747,1748,1749;568,569,1749;58,1264;1497;1256;1384;2818,2819;58;58,631,1017,1565,1748,2630,2631,2633,3213;58,60,631;670;61;-157,-2838;631;1028;1579;58,59,60,61,1896;1746;3104,-3106;1565;1028;1747;1751;58;158;1497;1846;-1924,2033;1707;3691;1028;1028;1565,3446;158;631;1749;158;3582;1281;3934;58;136,486,604;1093;1746;1746;3150,3151,3152;58,1222;1497;631;533,660,714;1132,1749,2182;589,2229;1471,1497;1497;158;1846;687;708;717;58;58;1662;1747;1846;567,568,569,1749;3514;1132,2343;1674;1067;-1924;-1924;2591;1497;1497;3552;76,77,78,79,80;1846,1863;721;2201,2204;1028;806;2470;1281;1497;1819;1747;670;705;1746;1281;58,583,729,1028,1779;-59,-1136,-1566,-1924,-3707;1281;583;1281;1281;1281;1750;1497;408,771;3262,-3264;963;158;2801;158;58,2859,2860;3927;1920;1306;158;2693;631;1231;933;432,1028;489,490;60,1779;1028;1746;1846;1497;60,631;419;3076,3077;58,61;58;58;631;3234;1265;887;1565;1846;1749;1747,1748;495;631;1132;599,1477,1478;542;3842;3842;3842;1497;673;58,673,1686;3736;1750;1356;631;1497;1810,1811;717,2812;1707,1746;924;2226;594,1791,1792;61;594,1791,1792;2279;594,1791,1792;594,1791,1792;594,1791,1792;122;58;58;670;1497;1497;2526,2527;2810;1931;1745;1804;2001;1843;1497;1497;1843;413;98;1153;1749;61;61,1789;638;631;631;631;1810,1811;631;3657;58;61,1789;631;58,60,61,3387,3388,3389;631,1497;3657;2328,2411,2412;631;61;675;638;631,1788;631,1376;631;631;61;551;487;631;631;61,584,765;3368;1814;1497;486;1747;1497;158;631;1497;1788;584;158;58;58;1747;2393;58;2393;2393;1243;631;58,631,1028,2633;1497;821,2083;1674;1748,2260;1748,2260;1748,2260;98,3896;433;1828;1021;1022;408;2393;1748,2260;2393;1594;158;876;1497;126;631;631;2393;1484,1485,-1487,1487;1497;218,219;1846;1819;584;1497,3446,3648,3649,3650;136;1746,1747;58;2196;1497;1940,3947;2684;487;1497;2628,2629;486,792,2285,2286;58;1749;1747;2698;1748;1846;1265;1746;408;1748,2682;1526;1497;1599;1281;58,2766;452;132,212;158;2013;454,728;158,973;3641;3703;333,334;61;61,584,1028,1748,2233;1746;1443;1281;2267;669;130;670;58,1565,3213;2801;1028;631;58;486,792,1283;1749;3150,3151,3152;1135,3592;670;1846;1846;3226;58;58,985;-1924;447,568,1157,1714,1725;58;1565;3472,3473;670;452;58,966,1904;2728,2729;692;2961;-2838;425,537;523;584,994;58,2223;58;548;1028,1747;58,1028,1497,1565,2239,2771;58,1746;58,537;58;1749;498;425;58;1819;1028;58,419,1285;1355;487;1387;3765;670,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,3765;1779;2799;2740;987;1843,1868;500,594;3710;401,1497;1952;1748;1746;1100;1749;1215,1278;1246;877,878,1846;840,1466,1582,1583,1584;1846;-1924;1565;1750;58;1337;405;910;1863;3590;915;58,615,665,747,787,802;1310;371,1697,1867;58,1565;1565;895;1497;1746,1747;2582,2583;158;1135,3592;61;1746;1497;631,1497;58;58,1416;1497,2490;-59;2803;158;631,1222;1497;2354;867,1747,2055;1751;1802;1624;413,2222,3953;61;922;1497;928;500;1157;58;2059,2060,2061,3989;447,1391,1497,1808;815;58;631;1810,1811;467;425;158;1749;1746,3049,3161;1356;1345;670;821,1535;1497;2801;1838,1839,1840,1841,1889;524;513;1497;2397;158;442,513,1049,1050,1051,1748,1749;158;1530;452,611;1846;1846;1749;631;594,1791,1792;542,624,631,747;815;1497;-426,-433,-487,-514,-627,-894;1851;1746;584;158;670;1819;2800;130;158,413;1778;1028;842;1530;61,584,1497;1497,1565;58,62,63,64,65,66,67,1028,1565;3330;1497,3042;-136,1370;58,584,631;487;594,697,1247;58,513;631;58,424,514,547,548;631;611;500;631,908,2310;58,850;3336,3337;1712;437,513,584,631;513,631;515,516;58,425,442,3498,3499,3500,3501,3502;58,425,442,3498,3499,3500,3501,3502;58,425;58,425,442,3498,3499,3500,3501,3502;58,425,442,3498,3499,3500,3501,3502;1838,1839,1840,1841,1889;58;58,425,442,3498,3499,3500,3501,3502;58,425,442,3498,3499,3500,3501,3502;58,425,442,3498,3499,3500,3501,3502;58,425,442,3498,3499,3500,3501,3502;608,1465;1557;638;58,729,2186;766;1826,1835;158,1530;3911;2848;1182;1497;1712;1466,1467,1468,1469;792;1431;2370;1843,2783;1327;3963;393,818,1829,1830,2942,3769,3770,3771;58,551,584,1779,2766;1527;413;584;-1924;1087,1497;631;1497;1169,3686;438;58;1028;1497;741;3655;441;3362;777;2615;1967;3657;1819;2801;631;423;61;1712;2104;58;1776;1028;438;1819;1189;1497;821,1535;1497;638,729;3458,3459,3460,3461,3462,3463,3464;1846,1847,3708,3709;1125;438;1565;1747;1749;1215,1278;424;2691;631;988,1343;1405;584;631;631;631,2924;2290;58,136;58;1028,2065;2772;631;917;1838,1839,1840,1841,1889;432,442,486,792,1243,2173,2174;486,662;58,486,792,1055,1132;1497,1565,1660;408,432,486,502,599,792;486,792,1575;432,442,486;2267;471,1920;405;61,1715;1846;2300;486,792,1028,1585;808,809;447;3728;1565;1565,1746;1497;1788;424;1530;1497;1323;439;158;158;158;58;1750;2970,2971;401;3062;1565;1747;58,1154;964;447,1808;58,454,1028,1913,1914,1915;58,638,729,2341;58,454,1752,1913,1914,1915;1497;-1924;1519,1520,1521,1522;2276;1838,1839,1840,1841,1889;158;1284,2056;3289,3290;61;1819;898;-157,-2838;1471;914;58,419,857;1380;2150;487,631;1281;2306;1565;58,938,1751;408,665;1497;631;1746,1747,1748;717,3049;-1924;2685;1819;2658;670,3341,3343;1497;1143;617;408,436;460;432,437,514;570;2369;911;3670;377,788;500,661;697;1550;432;1632;-1924,2403;3162;61;436;1278;58,136;1497,2804;2801;413,1846,1847;2376,2377;158,372,1300;500,587;1747;3598;500;152;204,205,206,207,208;377,631,660,1747;1028;609,695;1565;130;1779;486,1529,1532,1533,1534;631;1753;58,1056,1745;58,599,2439;500;2078;61,1529,1565,1763;631;862,1747;607,1748;136,458;58,1746;58,460,2378;1028,1565;144;1497;1565;3943;58,1028;1753;1028;1753;1565;1819;1028;1565;486,1479;1565;432,486,792,1746;1660;1099;1903;1753;670,741,1674;58,487,537,582,638,692,844;1746;1746;741,860,3742;3321,3322,3323;1132,1281,1404;58,3602,3603,3604,3605,3606;638;1749;58,377,1745;58,452,1565,1894,1895;58,1565;670,2655;486;454,716,942,1748,1776;1796;942;58;513,3476;58,501;2630;-1924;3657;58,452,1565,1894,1895;58;692;58,1990;1359;1565;432,1747;149;1565;130,2964;1746;158;1157,3061;741,2408,2998,2999;376,1622;2462;455;3294;58;1747;1776;58,467;3838,3839;158,1846;1837;58,1565;3695,3696,3697,3698;551;542;424,611;136,742;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;2741;524;3727;976,977;58,583,651,1746;631;631;58,1497;3904;452;487;631;58;631;631;61,487;487;983,2165;631;458;2924;976,977;2822;631;2626;631;432,1748;58;2801;487,1565,1748;432,1748;396,744,745;1497;1749;1747;58,1565,3213;442,631,1749,2130;500;670;1747;436;1281;1565;1213;631;58,1028,2633,3211,3212;58,981,982;1530;122,268;1028;1779;694,806,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,1749;631;513,1028;1748;1144;2892;1746;1028,1565;513,805;432,1028;1281;631,1788;58,867;307;61;1028;1746;917;216,3396,3397;584;1497;58;631;1452;1490;1497;158;584,631;1057,1745;1497;662;58;58,631,675;1278;1028;1497;639;1748;1028;2183;631;1748,1790;148,309;58,3543;827;3681;61,551;1497;432,662;514,805;1497;535;401;692;1587;670,1583,1613,1634,1657,1677,1678,1679,1680,1681,1682,1683,1684,1685;992;1497;692;1497;401,1370,2801;649,1223;1747;1846;874;660;58;638,729;58,59,60,61,1896;670;660;976,977;58;2011;1749;447;432,447,458,459,1746,2143;631;1565;1565,3437,3438,3439,3440,3442;3923;1748;136,1132;2303;638,1129;58,515,2750,2835;976,977;463;2110;1497;2037;1747;486,792;692;2301;692;615,665;1497;631;3849;1215;500;513;2801;1846,1847;1810,1811;1256;551;1749;1747;58,513,1565;61;671;1215;425,508,823;158;158,781,1846;-157,-2838,2848;130;158;2071;1497;1006;1278,1497;584;1497;1571,1586,1587;1442;2332,2333;1028;58;500;158;588;462;500;61;1497;631;631;1745;1747;1028;452,611,631;130;58;3514;1215;2344;58;447,705,1132,2480;447,1278,1497;58;584;58;631;1838,1839,1840,1841,1889;692;1749;887,1016,1215,1497,1507,1536,1537,1538,1539,1540;1846;1497;58;447,1215;631;3937,3938;1028;1789;1530;3248;741,1028,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,1760,2415,2416,2417,2418;631;584,3846;58;1753;158,1294;266,267;3830;692;838,1504,1505,1506,1508,1510,1511;130,447,2677;662;631,2499;158;158;1497;1747;454;130;1497;548,594,649,777,1212,2167;697;61,777;58,471,492,539,777,908,938,2167,3044,3768;932,1497;130,1826,2514;1746,1747,1748;1497;-1924,3820,3821,3822,3823,3824,4008,4009;405,1693;836,837;955;1757;3799;1972;1846,1847;130,3987;130;2170;2370;1749;1647,1673;670,1573,1672;3334;1497;1676;401;1053;1599,3553,3554,3555;432,631;2730;956;61,2919,2920,2921;582,1745;584;568,569,1749;2607;136,408,452,586;136,1514,1541,1542;3148;401;130,2667;1846;1028;1281;1281;1565;447,1306;58,486;432,486,792;486,1529,1530,1531,1532;58,486,513,586,792;1533;58,1565;58,408,513,731,2606;631,3679;61;3638;1497;1846;1497;3848;1579,1810,1811;-1924;425,739;2222;376;136;1126;1821;1462;2863;58;3971;130,486,2405;1507,1544,1545;653;502;1497;2725;1135;1497;72,73,1842;1497;3527;1497;691,780;425;477,604;1746;408;1749;2541;486,792;58,452,1028,1894,1895;3230;3833,3834;58,61,631;1779;1565;58,425,486;-3210;545;432;1507,3075;1034;136,444,446;856;584;-136,1370;158;1497;1851;401;732;2391,2392;1565;1565;58,631,2633;1028;1565,1978;58,574,575,576;2106;432,486;502;677,678;631;58;471,500;1384;631;396;883;58,419,513,514;3119,3120;1712,1723;396;486;1497;631;1497;68;-2838;2896,2897,2898;2435;631;2621;1565;419,2444;3062;1135;1565;1497;1846;1900,1901;1497,2114;1746;500;955,1583,1635,1637,1677,1678,1679,1680,1681,1682,1683,1684,1685;1651;1565,3437,3438,3439,3440;1764;58;1755,3456,3457;638;1028;1748,2627,2764;670;938;58;58;994,1769,1770,2256;60,638;1028;58;58;58;58,966,1904;2041;88;3612;662;393;408;58,1530,3174;1565;1497;130;1565;1530;1819;779,1746;58;408;2758,2759;1497;432,1748;1711;447,1808,1809;976,977;1028;58,61;2036,2796;58,675;1028;741,1749,1776,2328;867;1497;627,867,1278,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,1770,2876,2877,2878;1565,3446;1891,1892;1812;158;158;1112;1846,1867;158;1846,2137;1380;542,904;631;209;1333;60;158;2848;98,3868;58,500,611;502,1746;3024,3025;158;1846;631;58;500;88;136,1512,1513;126;1846;3787;670,1572,1573,1574;58,1583,1634,1677,1678,1679,1680,1681,1682,1683,1684,1685;1750;1281;1281;1028;1281;1244;818;1281;1748;1281;1497;58,59,582,583,584,1748;1281;1281;1497;901,1483,1497,1581;1281;1565;58;631;1748;1497;584;1961;432,813;1497;470,510,631;3291;1497;2537;1281;513,1749;1869;3603,3804,3805;58;130,684,685,686;692;311,312;440,3690;158;634;1497;673,729;764;419,513,514;693;1746;631;470,496;1565;470,1145;2641;631;631;631;542;3017;1028,1565;1747;1779;1497;1497,1760;3003,3005,3006;1745;631;779;1497;631;1135,3592;584;58,61,631,3089;2570;471,938;130,2514;2768;631;631;631;58;58,2249;631;2925;1819;1565;3842;-59,-674;1281;58;1053;58,1748;1281;584;691;2886;1497;1281;1674,3650,3675,3676,3677,3678;1746;58,638;1497,3269;113;1452;136;58;594,1791,1792;514;594,1791,1792;594,1791,1792;594,1791,1792;58,425,610,611;470,471,472,473,474,475;594,1791,1792;631,1617;2072;2552,2756,2757;425,452,513,615,665,767;1846;1846;1791;1202;438;1846,1847;1746;432,1748;1054;1846;405;662;1746,1747,1748;3514;502;976,977;976,977;976,977;1028,2862;631;376,551,631;424,437;61,551;551,631,1497;631;631;585,1712;631;438,631;61,1712;638;61;61;631;631;631;631;61,1497;58;1497;401,2669;1129,1747;2251,2252,2253;126;1779;864;840,1466,1582,1583,1584;1497;2150;1287;631;1497;1497;1565;2188;1625;611;289,325;1497;631;1748,2260;1497,2111;1747;729;58,447,1746,1750;729,747;58;584,613;1746;812;158;584;2041;1497;1110,1325;432,433,1752;611;827;2393;1281;584;718;1157;1497;1867;413,1324;286;2169;401;2504;2606;1314;631;2049;119,1846;1497;2911;1745;-1924;158;1747;1028,1497;158;486;136,662;1565;432,486,532;433;432,1747;1746;1746;486,792,2191;1497;158;1132;502,729,1746,3047;1746;58,424;2796;452;1157;58,60,1283,1565,1714,3039;58,1565,1714,1779,3039;58;3210;2337;58;58;1125;1449;2833;61;689;1497;1846;1886;1748,2923;61,1748,2233;631,1746;849;584;551;437,631;130;631;1752;638;1565;1746;2045;670,1565;2524;158;1321;974;58;158;1747;2814;3975;536,1747;1565;1087,1497;1281;1028,3226;1497;58;486,792;513,514,890;670,1583,1650,1677,1678,1679,1680,1681,1682,1683,1684,1685,3446;1746,1747,1748,1749;1497;58;631;98;1746;58;487;58,1028,2633,3211,3212;58;1246;1611;1028;3691;1565;58;1028;58;58,1748;58,513,1748;1749;58,1028,2771;1028;1748;1750;58,729,1028,1565;58;1749;1749;432,1748;1747;58,1028,1565;432,1749;-1924;1747;58,2433;1747;58;922;2214;1846;2331;158;978;631;3765;405;2319;58,440,2854;1028;631;58;1067,2446;1497;2192;582;631;978;1135,3592;1746,1747,1748,1749;1749;818;867;2951,2952;58;61;58;61;-1924,3451,3452,4011;631,1810,1811;670;638;158,1853;827,2597,2907,2908,2909,2910;1417;3291;1745;1746,1747,1748,1749;58,3495,3496,3497;1746,1747,1748,1749;3016;1480;522;1497;1497;2308;513;513,631;-136,1370;1749;1103;61,1497;631;1281;58;61,1789;1386;1028;58;1028;58;580;1281;88,130;93,94,95,96,1565;408;136,1751;670,1906,3856;1497;2895;1434;273,274;2798;1335;58;453,1110;61;58,613;130,1518;3253;447,1808;1751;1916;3514;2222,3953;130;1497;692;158;1846;2131;1497;477,486,536,841;1979;405;3786;432,1748;58,442,513,615,665,666,1762;1278;2171;58,1028;486,792,1750,1751;631;3327;631;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;1964;631;2473,2474;513,766;1400,1401;1497;594,1791,1792;1791,1792,1793;1748;1028;2534;2534;2534,2535;3924;833;1746;58;1299,3829;1553;821;436,1748,2055;1810,1811;130,1826,2514;-136,1370;58,3981;58,631,675;631;631;631;631;1039;560,561;432,470,798,799;631;659;631;631;495;2755;631;58,437;631,1712;500,631;631;3581;487,631,899;586,697;631,946;631,821;514,3517;500,631;631;61,631;631;58,522,611,1176,1177;58,436,1747,1748;58;58;58;1846;58,670,3784;584,670,1746,3784;318;158;643,644,645;631;1497;3541;441,442,537,1028,1565,1745;631;1670;60;130,2495;508,2394;1846;1028;3514;1197;-1924;584;1747,1780,2348;61,1779;584;1497;158;1256;1819;3384,3385;3102;424;58,3688;1707;1707;542,631;486;600;1751;58;1751;631;1405;2326;1497;158;946;1565;158;827,3050;1497;158;486;438;1746,1749;432,1748;1497;631;432;867;61,619,3434;61,619,1565,3434;158;631;136;1848;1970;929,1273;1497;158;617;447;454;1497;158;712,1497;58,419,1770;58;432;638,729;638,729;3007;130;1497;1084;1819;2513;301;401;631;432,1280;1082;61,3777;1497;580;2543,3122;58;1749;692;452;452,584;492,2637;487;1727;631;631;487;536,2243;631;1028;1482;1028;1110,3292;58,454,1028,1749,1915;432,486,513,1750;1497;1750;58,1003,1746;432,1748;432,1748;741;3979;58,500;2733;433;136;1497;3671;1393;3877;1497;535,806;425;2960,2983,2984,-2986;3324;58,3478,3479,3480,3964,3965;58,437;1311;818;158;2192;1748;477;1028;-1924;58,425,500,631;2552;3909;1028,1746;58,1747;2111;1028;408,589;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;58,425,442,522,594,1154,3992;58,1154,3773;58,454,1135,3592;1356;61,619,3434;1565;432,513;1565;1748;432,893;58,631,1028,2233;58;408,513;584,1565,3599,3600,3601;436,458,700;1916;631;1126;1712;1454;1497;1497;2370;438;1819;158,1694;631;1091;1928,2103;458;3231;599;2106;1072;3725;2638;1497;1846;1497;1260;1497;136;158;570;1003,1488,1489;1003,1488,1489;158;1391;1497;2222;1315;3514;126;1838,1839,1840,1841,1889;3018,3019,3020;1846;2505;492;631;631;3946;3946;1868,3100;1846;2476;-1938;3252;542,577;58;940;130;631,1748;1779;297;58;1497;741,2408,2998,2999;1497;729,2440;631;631;1497;2795;1087;1497;2801;486;1464;705;542;1920;1231;2250;1916,1917;1846;1185,1421;2358;1565;158;670,3225;1565;2182;2066;431;-59,-60,-61,-62,-1566,-1897,-1924,3095,3096,3097,3098,3099;1281;58;1746,1747,1748,1749;58;3295;2949;1281;436;1497;1530,3140;486,1529,1532,1533,1534;777,2504;58,376,1028,2042;1028,1574,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,1747;61;989,2107,2186;1497;2381;60,432;1356;408,425,1148;1746,1747,1748;1281;797;1497;1819;58;58;58,1400,1782;1846;1151,1846,1847;375,3967;130;1749;1028;58,452;137;61,584;1750;1750;1747;393,1159,1160;58,98,3797;1746;1028,1749;3558,3972;58;58,895,1276,2400;452,611,631;61;130;3585,3586;467,670,1135,3391,3392,3393;513;3605,3606;1753;1745;1028;1779;1190;1028,1565;3445;3514;1808;2010;436,1565,1776;513,691;486;1747;58;1497;376,1356;310;1857;1028,1565,1779;513;136;58,582,665;1231;813,2039,2040;1217;2051;58,828;1114;1843;611,2349;1751;631;4002,4003;58,439,3518;486,2055,2727;1826;1497;158;670;1846;376;631;1132;502;2046;-157,-2838;1749;1868;158;1565;58;631;2612;1747;58,1497,3453;3465,3466,3467,3593;61;2004;631;1796;500,631;58;631;631,3199;2926;584,1920;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;908,988,2966,3044;1745;631,3317,3318,3319,3320;2450;551;631;486,1318;460,585,594,1749;2545;58,3138;631;976,977;976,977;631,1497;58,1565;1747;3628;1497;58,408,513,1746,1748;1743,1744,3925;1497;2413;729;1748;1497;377;432;20,-59,-1566,-1924;1565;58,3022;1747;2451,2452;1497;58;2750,2831;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;912;148;1867;424,613,1707;1746,1760;694;1779;1497;583,729,1750;58,71;979;58,1565;1497;1490;1497;1746;1749;1779;729,1746;718,980;582,2186;2393;1033;1748;1727;408,563,564;1748;1748;1727;58,71;58,71;1748;58,1565,3213;631;867;3391;631;58,1565;58;158;58,71;3646;460,1028;1028;58,465,1747;1565,1747;424;58,71;631;1497;515;1748,1898,1899,1900,1901;1380,1674;454;821,1535;933;-59,-60,-61,-62,-1897,-1924;1497;58;2192;58,71;58;1846;1779;158;1860,1861;670,1583,1613,1634,1657,1677,1678,1679,1680,1681,1682,1683,1684,1685;819;729,1135,3592;660;665,747,787,1129,1307,1707,1745;1497;376;3231;500,532,594,631;1565;424,432,471,488;1095;1819;539,2270,2590;1819;1497;1497;692;867;1846;3772;1565;61,1710;60;1747;58,3854;1747;1565;1497;1028;670;584;662;1497;405;61;58,454,1913,1915;1502,1503,1504;631;976,977;2663;2810;2576;3130;454;584;3078;670;1507,1544,1545;447,2490;382;1868;136,1893;486,860;2093;1846,1847;3647;61;1746;1846;486,1208;1497;1977,2121,2122,2123,2124,2125,2126;1497;1815;1838,1839,1840,1841,1889;1497;58,513,3361;1826;158;158;2801;1497;61;542,587;401;130,2514;2683;1497;1855;1497;2514;1746;1089;1431;2946;487;692;1281;1746;631;486,792;2848;631;58;1846;3066;408,-1933,1933;1453;840,1466,1582,1583,1584;58,486,631,1746;447,3525;838;2275;3547;2767;1867;401;393,1159,1160;631;673,1565,1636,3545;1749;1846,1863;584;2162;1278;3424;588;2194;1565;670;3619;1497;1773;1846,1847;1497;1281;1565;729,1746;1497;867;438;2941;815;58;58,1565,3213;58,1565,3213;58,1565,3213;1497;1846;1281;377,788;1846,1847;3468;908;903,904;697;492,539,908,3768;1135,3592;867,1384;1314;1529;1157;1497;58,1135,3592;1565;1846,1863;2146;631;2441;670;910;487;413;3167,3168;3514;-59,-1136,-1566,-1924,-3593;438;1846,1863;3126;99,100;1745;1712;570;1819;1017;2114;670;631;570;1497;1160;471,500;452,611;-1924;1497;1318,1528;502,804;1497;130,1215;130,1826,2514;2050;1609;1028;376;1028,1029;3962;2092,2093;58,486,792,1132,1749;1135,3592;2217;58;486,792;1497;61;58;1281;1497;631;158;1028;1380;1326;61,500;3978;432,513,955;617;1282;1028;821,1535;955,1645,1646,1647;61;500;408;1846,1847;126;1867;3046;604,605;551;1497;158;513,536,665;1021;487,500,631;672,673,2119;500;487;2967;631;1497;58,1748,2431;487,631;452,611,631;1819;1747;1028;653;130;58,1750;1565;58;2299;1009;631;58,452,1894,1895;821;630,631,1369;401,2540;2915;691,867,1161,1162,3339;1497;513;3230;1625;1135,3592;58,1599;631;1497;58,452,1028,1894,1895;328;1497;4000;486,867,1030;1497,2441;1028;1749;3070,3071;654;1560;1497;1750;631;1497;377,788;2241;670,1919;1987;1169,3686;3941;1497;1028;193,194,195;631;58,2597,2598;631;589;631;1028;442;148;1497;405,1243;415;415;415;415;1846,1847;58;486;454;408,432,631,792;2794;1846;486,1529,1530,1531,1532;1571,1586,1587;1497;821;408;-59,-60,-61,-62,-1897,-1924;162;1278;1521,1523,1524,1525;1846,1863;58;432,500;61;1747;2192;1779;638,2854;2660;551;158;432,697;1497;1633;1747;58,1565;440;58;2552;432,486,792;1688,1928,1929;1746;58,1550,1926,1927;136,3079,3080,3081,3082,3083;1749;58;1749;1748;1497;631;1750;158,1300;130;2603,3415,3416;1711;1748;1556,2351,2352,2353;148;1497;467;58;3218;1028;1028;510,1028;1483,1497,1581;815;130;438;867,2181;1028;58;887,2623;2695;130;158;500;963;1707;631;670,1510;1746;136;377,1444;1565;584;401;438;741;432,1748;703,1073;409;130,1825,1826,2514;1497,1529,2771;1891,1892;1339,1340;1747;994;815;1578;438;1497;631,1223;631,1921;513,631;3963;1281;1804;61,631;580;1846;1438;2035;670,3221;631;820;1497;1497;2062,2063;994;2703;1497;130;1565,3437,3438,3439,3440;1281;1748;1028;58,419,1749;1281;1281;584;452,611,631;1281;500,1229;500;1281;1157,3084;1497;670;631;2186;1281;148,3651;447;589;130;447,2891;1497;584;1042,1043;1041;542;631;1497;1497;580,1846,1847;-1924;277;1686;1028;1028;1748;1748,1753;1746;2158;2322;58;2750;2478;61,542,1707,3492;631;61;471,628;631;2572;2185;631;1747;1521,1523,1524,1525;58,71;613,631,1100;631;1468,1481;1660;1497;363;2655;1848;130,1243;976,977;631;-59,-674;1854,1862,2525;1779;2808;1497;3674;437;631;432,486,936,937;1707;1282;1497;635;2444;1135;1325;1431;2387,3132;68,69;470,471,472,473,474,475;471;594,1791,1792;594,1791,1792;594,1791,1792;377,425;469,470,471,472,473,474,475;631;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;504,505;594,1791,1792;506;1747;594,1791,1792;424,460,500;594,1791,1792;594,1791,1792;502;1941,1942;631;1819;1497;2181;435;58;630;447,1497,3109;585,2745,2746;1697;401;502;2444;3433;1028;1843;1497;3035;1179;1497;126;452,2384;631;1712;58,59,60,61,1896;61,584;58;638;61,584;3657;631;631;638;58;58;631;58;631;61,458,487,584,613,1464,1707;58;1819;500;914;58,71;148,741,3431;1087,1497;432,1028,1747,2883;2002;2801;3665,3666;1819;1208;631;158;2848;58;3657;631;914;2504;1748,2260;1497,1803;136,508,670,1356;517,747,994,2055;2393;1748,2260;1497;452,611,631;672;408,1746;1251;1028,1748;1497;1819;1497;502;1837;1080;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,2418;2665;1712;158;408,425,1745;631;1157;1770;1028;513;687,2237,2238,2239;1016;158;630;61,631;1497;1497;662,1542;584;393,1159,1160;432,542,1740;487,539,2270;631,1714,3470,3471;1497;741,2408,2998,2999;1846;1028;631;3885,3886,3887;2087;-1924;486;1380;432,486,1750;1497;1497;419,582;329,330;1147;158;136,508,670,1356,1574,1606,1607;58,471,631;3741;3741;1846;1580;2505,3401,3402;1028,1565;2111;1565;61,1565,1779;61;58,594,631,1396,1397,1712;727;549,550,551;1707;741;432,1748;1526;631;631,1746;670,3850,3851;551,1779;2608;61;842;1092,1750;58,61;2380;61,1748,2233;1746;58,437;535,988;1594;1747;584,1748;1497,1813;631;1438;631,1356;487;1507,1544,1545,1546,1547,1548,1549;413;61;1746;1055;405;2569;396;500;513;1929;401;1776,1804;503;1028;58,887,1910;631;130,155,1663;2901;1497;631;694,730,1746;432,1746;2801;844;607,1028;1497;405;1356;438;631;425;1497;1912;584;631;173,174,3587,3969;148,1356,1712;1843;1497;513,630;58,71;1028,1779;452;584;584;1418;136;58,1748;158;408;1747;1497;654;1929,2323;61;631;631;1497;1024;1747;-136,1370;513;670,3412;61;1747;1028;1565;58;58;1565;631;1779;1565,1779;1746;60;513,638,1747;1768;58,1028;376,1749;452,611,631;130,1826,2514;452,611;662,766,835;1747;631;863;447;500,631;1497;1281;2998;1565;1084;1497;58;1472;452,631;662;3958,3959;452;1278;1490;58,1779;261,262;58;1846,1863;1935;376,3922;515;377;2469;3266,3267,3268;477,1061;1565,1747;1135;452;1497;158;1867;604;1497;2789;1281;1771;1819;1281;58,487;3898;630;1497;1497;513;513,631;1028;1028;1028;902;58,1565;631;638;447;631;631;61;2233,2704;1281;1846,1863;1281;158;2968;756;58,71;452;58,71;2059,2060,2061,3989;1380;1796;2410;3997;432,486,941;3874;619;452,611,631;867,2358,3339;631,844,2219,2624;1497;158;1789;-2838;631;1086;1746,1747,1748;1846;2039,3117,3118;968,1240;631;401;58;1076;1497;910;1746;1711;746;1819;4004;58,437;3514;1809;2848;1269;447,1808,2920;665;58;3514;58;1497;1846;460;3891;432,1111;584;584;1565;1129;508,666,1362,1363,1364;664,1762;405,1141;2044;631;1848;1117;2861;2578,2579;377,432,460,471,1712;594,1791,1792;594,1791,1792;2719;158;976,977;1712;584;419;1431;1281;594,1791,1792;594,1791,1792;1497;594,1791,1792;594,1791,1792;594,1791,1792;158;136;3862;2686;3153,3154;432,1748;1903;1746;2801;158;58,452,1894,1895;1177,1215,2717;432,1111;1497;1497;1749;611;-157,-2838;1125;139;2848;3215;1497;1743;500,631;631;631;631;1497;1256;432,1111;58,675;1712;976,977;424,432,631;1704;588,590;432,500;1157,2920;432;631,3713,3714;495;631;500,697;377,788;584;432,542,1740,2322;631;432,542,1740,2322;470;2435;631;1343;631;58,437;631;500;631;1028;447,486,1055,1497,1526;88;3503,3504,3505,3506;1497;1843;1497;3806;1267;405,1846,1847;158;1180;631;351;2636;1384;3258;432;425,1746;58;1746,1747;-1924;2848;1750;2074;1435;376;68,69;2566;3306;1497;670;1846,1847;1846,1847;1497;2513;1922;1497;513;1188;1863;1497;1435,2823,2824,2932;1497;158;419,432,631;638,890,3629,3630,3631,3632,3633,3634,3635;584;58,1565;1751;3040;486;3238;1497;844;438;424;1215;1281;1431;1885;1747;1028;975;1868;1126;158;1846;1132;158;867;631;529;2998;631;1565;3272;2503;1215,1497;821,2869,2870,2871;2099,2100;1497,1625;58;923;921;58,71;1846;3514;3360;1170;506;631;1342;513;1231;148,741,3561,3562,3563,3564,3565,3566;3128;1749;631;2445;631;1256;58,631;631;1281;2524;1497;58;589;584;1846,1847;487;486,1412;840,1466,1582,1583,1584;1497;437,471,587;1502,1503,1504;432,1748;432,1748;631;654;1497;58,3500;500,1256;2233;3386;4007;1281;867,1391,2742,2802;994;58;1846,1863;58,513,1745;2441,2667,3111,3112,3113,3114;539,2270;535,806;58,1747;589;1497;3065;158;1497;1497;1846,1847;58;487;725;130,447,2771,2772,3529;130,155,401,447,1042,2769,2770,3529;1748,2444;670;2437;1748,3832;654;58,966,1904;3514;393,1159,1160;1497;58,3774;61,1779;1745;1747;408,454,1131,1132,1133,1134,1565;58;58,454,1028,1565,1752,1913,1914,1915;618,619,638;1565;1846;1712;1445;437,587,1707;432,1748;447,1579,1810,2460,2492;513;1846,1847;2528,2529,2530,2531;58;401;148;638;1427,1428;864;1028,1565;1243;405;1497;1215;584,631,729;3940;1846,1847;1507,1659,2751;1749;1747;1746;837;1042,1043,1044;1384;58,454,1565,1752,1913,1915;1746,1747,1748;1497;1476;1497;2047;1277;840,1466,1582,1583,1584;1497;158;1497;1286;1087,1497;58;2801;631;976,977;500;432,500;742;1166;1946;1819;58;447;1003,1488,1489;670,3326;1003,1488,1489;584;1497;1497;617;584;1851;1497;58,1565;58,596,1081;130,1825,1826,2514;98,3926;1064;1748,2260;1746;486,792,1575;126,225,226;58;3751;1497;438;2222;2393;1826;1418;1004;848;1599;2463;3780,3781;2944;-1924;631;236,237;976,977;1028;242,243,244;1916,1917;58,419,460,513,514;1497;1748,2260;130,2514;408,436,1286;631;631;61;3956,3957;1802;357;401;631;432,437;631;631;470,871;2750;611;660;432,452,514;58,966,1904;513;2081;58,425,535,1748,1760;2801;1796;1950;158;3795;1028;97,98;3935;432;68,69;1394;70;438;454;3901;3229;631,2267;1497;631;815;1846;130;58,1028,1565,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;61;974;1747;1747;3892;486,1475;1028,1565;1745;405,1819,1820;631;1497;158;1281;1497;3404;1281;1497;460,1747;1418;1497;1747,2277;638;2435;631;3413,3414;58,3602,3603,3604,3605,3606;1749;1779,3607;1779;2633;1028;1521,1523,1524,1525;487,542;1497;631;1497;1497;1951;599,1477,1478;60;454,716,1028,1565;2027;-501;58,3899;2409;1989;1846;1747;377,432,492,603;2801;1028;452,611;584,1743;436;1565;1350;631;616;58;1846;891;1483,1497,1581;-1924;3560;944;1418;1846,1847;158;158,1843,1846,1866,3196;130;619;815;158;58;671;500,631,771;827,994,2762,2763;1674;3931;1707,3382;631,1707;631;631;3150,3151,3152;3150,3151,3152;3150,3151,3152;4017,4018;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;2854;548,631;437;58,631;58,3138;1256;513;487;452,611,631;61;58,471,631;58,437,649;58,437;1434;631;425;2512;1497;1727;495;424,542;1748;2614;548;1497;1497;1625;471;3021;424,1727,1738;58;408,432;1926;760,761;1749;1497;1028;58;1749;513,537,1183,1745;584;252,253,2314,2315,2316;1028;2559,2560;2560,2573;3391;1749;1747;1749;729,2246;1746;487,1747;1028;1594;1748;1748;1028;613,2129,2130,2430;1028;377,788;1827;584;1497;673,1618;447;631;136,933;1497;1746;1497;670;58,1028;1846,1847;631;58;1028;1135,3592;58,136,502,1157;58;58,1028;155,1663;58;1594;1497;-157,2848;158;158;1281;788;58,1028,1913,1915;447,1808;58,454,1565,1913,1915;3857,3858,3859;1356;1497;3214;1563;1497;1497;782;408;976,977;1727;1278;2138;2410;692;2613;542,587,1239;1028;438,631;447;58;447;840;670,1565;432,1748;1565,3437,3438,3439,3440;631;1779;61;1746;1565,3437,3438,3439,3440;1565,3437,3438,3439,3440;58;3442;1565;58,59,60,61,1896;1497;631;1497;1565;1700;4013;61;-1924;2362,2668;584;158;1157;401;1579;58,1746;130,136;500;1843;2537;2102;1497;438;1206,2570;3614;1028;471;437,631;61,155,631,741,2365,2366,2367,2368;3594;377,788;1497;158;456;1008;1497;1432;705;1960;413;1530,3882;158;1846;1848;3123;2743,2744;158;1471;2617;1819;1746;1497;471;487;487;2207;1497;500,631;58;528;2211,2212;1497;405;158;1846,1847;1201;2021,3568,3569;1846,1847;1497;1028;130,486,867,2826;1497;1497;1497;-1924;401;631;1126;1028;933;1497;500,697,1734;1157;1028;1746;471;631,1215;438;631,1497;2752;2750;2071;3271;1391;2133,2134;1719;1719;1497;1776;1028,1776;1846;1846;631;438;631;1357;1707,2097;1479;905,906;903,904;58,471,777,938,2167;903,905;2008,2009;1819;1028;1135,3592;158;1335;1550;1278,1497;1843;1747;61,631;120,121;2949;393;1012;1497;3998;2414;1497;1805,3363;2305;1215;608;608,821;608,1132,1530;1497;1819;1497;1497;130,994;1846,1858;1747;2280,2281;1865;1028;3348;130;3227;3716,3717;1497;126;58,729,1015,1760;3657;670;1356;377,548,1238,1743,1996,1997,1998;424,500,1727;2496;2585;1497;687;1497;1497;408,592,1761;432,486,792,1017,1248;1723;1028;2524;2801;396;447;1148;453;1748;1256;2904;1846,1847;1497;1746,2345;432,1748;631;699;1256;1497;631,3680;3682;2750;1157;827,1504,1506,1509,1510,1591;980,1497;3273,3274;1846,1847;625;486,1529,1530,1531,1532;1810,1811;3910;58,1565;436,1028,1133,2682;771;837;1846;1356;408;3242;1583,1626,1627,1628,1677,1678,1679,1680,1681,1682,1683,1684,1685;1846;1281;1384;61,584;1748;631;158;631;151;1838,1839,1840,1841,1889;405;61,631,2556,2557;1497;815;1819;61;631;500,1712;1497;1099;1867;1846,1847;58;1497;674,777;1497;1750;460,805;3692;535;1135;130;867,1797,2547,2548,2549;58,602;1328;2833;58,452,1565,1894,1895;2164;1565;631;1571,1586,1587;1497;58,1028;58,1385,1386;3235,3236;1497;58,867,1356,1565;1497;1042,1043;584;1565;60,815,1565;447,1808;1286;1497;58,893;804;158;1846,1863;58;442;432,1748;447,1322;1497;1846;1035;1565;1748;58;1028;58;670,1916;638;1497;1281;1605;486,729;377,788;1497;1497;2565;501;158;631;1497;377,1730;471;1497;415,418;1846,1847;486,1529,1530,1531,1532;1274;158;1846,1847;513,659;158;1291,1292;670;58;502;1169,3686;1497;1135,3592;1748;58,638;631;452;58,425,604,1653;2801;589;58,2632,2633,3211,3212;1753;1868;1748;58;631;1565;-2838;1497;1497;98,1565;447,2256,2546;2487,2488;-157;502;1497;1256;454,1530;1157;58;1028;2007;1497;1497;1387;1431;269,272;1846;2786;-157,-2838,2848;1497;2543,2544;3052,3053;1712;1497;1497;432,1748;3683;1418,2389;458,631,1132;539,2270,2590;631;631,3329;2449;500;631;471;454,1135;130,1707;1028;1565;976,977;976,977;1583,1600,1601,1602,1677,1678,1679,1680,1681,1682,1683,1684,1685;584;58;58,470,522,1224,1225;158;502;158;2183;1565,2183;1819;1261,1262;404,1185;795;2828;1891,1892;1891,1892;1846,1847;432,1748;1483,1581,1659;863;1028;963;631;500,631;58;1497;995;158;1242;589;1132;58,500;130,1808;584;158;631;1497;868;543;933;130;1619;1281;58,513,585;1747;1747;1281;58;413,1846,1847;1380;1779;1497;1819;1281;513;419,425,452,508,734,735,1707;687;631;631;232;662;2272;3853;1276,1846;1109;-157,-2838;1281;684,685,686;1281;500;1851;3366;486;1067;1028,1748;158;1847;631;1748,2483;1746;1750;1753;631;405;1256;432;1497;2750;631;3852;3745;58,2813;3183;61,2957;976,977;551,584;631;1851;1732;1497;425,1748;3405;158;1028,1900,1901;1901;181,319,356;447,1353;1819;1747;1497;1497;1675;432,1748;452,551,1456;1028;58;1497;631;1748;631;631;58,1568,1569;1497;631;660;130,1825,1826,2514;377,788;631;377,788;681;783;1028,1779;1819;1127,1900,1901;2144;642;1404;238,239,240;438;817;777;1028;377,788;772,773,774;3481;1749;1497;158;1431;58,1266;1266;594,1791,1792;594,1791,1792;611;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;469,470,471,472,473,474,475;594,1791,1792;3721;976,977;2950;413,1846,1847;1499;58,1749;447,3116;726;-1924,2664;1028,1565;1110,1185,1452;821,822;323;1616,2736;98,3750,3751,3752;2570;433,867;1497;1497;1028,1497;662;692;1132;486,792;976,977;631;670;58,1400,1782;631;631,2154;638;631;61,3914;631,2262;631,1788;631;60;638;1712;439,1132;3021;667;471;471;1468;401;542;1497;1087,1497;3870;2111;1484,1485,-1487,1487;1857;1747;508;1891,1892;471;1795;393;2801;3782,3783;1497;2225;1497;1497;1356;2012;136,439;673;58,596;1157,2482;1814;1846,1863;1497;487,584;1004;692;1497;58;1819;500;631;1497;2393;-157,1282,-2838;844;1497;1497;989,1217;-2838;1281;-2838;1746;1497;1846;584;1497;1497;2259;1256;1497;815;1007;1497;3298;2468;1431;1431;584;158;460,470;1329;631;3932;1759;1565;1748;1028;486;486;486;1497;910,953;3570;2166;1105;1400,1401,1781,1782;1356;130,1594;2424;670;971;58,1568,1569;1565;58,471;442;3047;1599;1846;486;662;988;58;1246;1281;1281;1449;3243;1497;1747;988,2595;631;500;500;1226;20,365,366,367,368,369,370;2049;1429;425;1215;1749;1132;471,587;58;631;130,1826,2514;631;158;437,631,2283;58,61;2674;1810,1811;631;58,696;633,1197;584;1276;584;3722;432,1748;58,500,517,518;1497;1497;584,670;584;1507,1509;1957;-1924;3794,3836;1497,1808;158;130;1497;631;158;3399;58,1911;58;58;1055;420,421,422;741;3976;910;1152;730;1254;130;665;815;1691;158;3051;158;158;1846,1847;447;1849;58,130;438,1746;1565,3437,3438,3439,3440;1042,1043,1044;1497,1565;1028;1028;-1924;1912;58;1994,1995;2208;2058;58,2611;58,2611;136,58;58;58;58;3127;467,1028;2509;433;1747;1090;631;976,977;1412;1282;844;1431;1063;148;471;631;670;158;1497;1747;1497;158,1867;158;158;1599;1747;413;432;158,830;670,1720,3425,3426;155,158,430;1497;1746,2287,2650;1747;432,1748;1028,1747;976,977;1746;1028,1747;2434;419;442,454,1028;631;1497;821;3729;1028;432,1748;158;1846,1847;1846,1847;630;1846;1746,1747,1748;1028;1157;1846;1497;1846;1464;1152;599,1477,1478;58,61,1565;3067;1497;631;1749;3866,3867;500;1437;500;2363;58,61;847;300;2524;867,1746;3673;1784,1785,1786,1787;2801;58;1846;401,1370;3089;1028;2183;178;158;213;2586;1507;1819;1819;376;439,2128;1157;670,1956;3043;436,1028,1776;1497;3733;58,551,584,1779,2766;58,2766;1497;1795;61,551,584,1497;58,454,1028,1760,1913,1915;1497;1748;821;158;818;2111;1846;1746;61;1747;1565;631;1256;495;377,500;1281;61;1497;58,59,60,61,1896;3905;1497;1851;1281;1819;1497;584;142,143;1565;2069;790;514,805,2054;1819;1371,1372;1843;3560;1745;158;58;98,3878,3879,3880,3881;-1924;1746;1497;631;1846;119,1846;1281;1281;821;1431;419,2190;2119;58,2190;1747;61,551,584;584,867,1716,2779,2780;1497;1497;1431;123;584;432,1748;58;1816;158;2385;2690;487;665,803;60;665;1746;1751;58,442;1751;1746;3966;487;1387;58;692;425;594,1791,1792;470;3731;1594;-1924;58,938,1751;408,425,766,842,843;439;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;401;1988;3900;3004;2382;58;58;1173,1174;502;130,2514;1497;2049;931;1748;61,697,1743;631;631,683;1707;1712;631;631;432;471;542,631;432,542,1740;1707;631;631;631;432,542,1740;1256;548;432;500;2322;432,542,1740;377,788;470,1732,1733;487,514,542,601;452,611,631;377,788;500;58,419;58,419;1256;61,670;471;452,611,631;1497;689;631;58,447,796;1843;1749;1565;1565;158;58,1992;1916,1917;2753;3779;570;1497;424;1497;1140;3034;1036;487,631;58;967;82,83,84,85,86,87;631;1502,1503,1504;1132;2096;500;-1924;1497;1497;3511,3512;1749;424;2998;-1924;158;1819;551;976,977;1565,2271,3430;1751;2111;3571;731;692;1846,1863;424;1497;3021;58,614,615,1749;2615;813;513;1497;58,718,1028;1127,1900,1901;631;1846,1863;1497;136;3102;487,2497;58,500;61,1565,3434,3597;631;2693,3297;867;148;447;3085;631;184;432,1748;486,1558;631;631;500;61;58;631;1751;500;3232;500;638;136;437,587,1154;269,270,271,272;502;1115;1746;1497;584;486;447,1808;1746;486;1749;1497,2506,2507;3308,3309;3014;1497;486;2338,2339,2340;447,3089;631;58;432,1748;1497;1753;447;3654;130;584;1497;821;1497;513;1748;1278;1846;285;58;58;631;740;3746;2524;1263;3237;1748;487;487;-136,1370;670;436;454;1843;821,1535;58;393,1159,1160;58,1748;2192;1749;1497;408;1819;1497;3864,3865;1497;631;58,3774;631;662;467,1565,3572,3573;58,3875;1028;741,840,1565;1028;2015,2016;61;452,611,631;58,460,1747;1565;467;58,61,3871;58,60,1009,1028,2875;-136,1370;-1924;471;176;436;377,408,514,734,786,787;839;1028;976,977;513;1749;447,796,834;631;2737,2738;867;1497;1497;500;631;1346;3450;61,584;2081;3888;1747;1748;1497;58,454,1028,1913,1915;1497;617,721,1087,1110,1570,1571;1133;1497;1287;130;405;1749;130,447;1282;1497;439;1497;2995;2655;951;2867;3369;1431;2106;1953;1281;1819;58;1443,1846;1819;707,708,1747,1748;1377;1846;1846;1838,1839,1840,1841,1889;376;130,2514;130,2514;1631;405;1868;2670;486;631;1846;158;279;837;1565;58;1399;424,631,1150;1471;631;3277,3278,3279,3280,3281,3282,3283,3284,3285;670,3340,3343;460;158;452,805,806;98,1001,1524,1583,1664,1665,1666,1667,1668,1669,1677,1678,1679,1680,1681,1682,1683,1684,1685;670;617;377,788;1157;1402;58,966,1904;721,1571,1586,1587;3578;584;1705;1846;1452;1281;1281;867;1846;1846;1497;377,788;58;1084,3040;1010;1747;1779;1497;1718;660;1452;1028;631;-1924;-157;1565;1231;58;2475;1497;1431;1281;1281;631;433;3150,3151,3152;158;158;1529,1763;486,1529,1532,1533,1534;58;1747;631;1281;1281;1391;61,1497;2364;631;2383;670,1283;471;58,1028,1400,1782;233;1028;1565,1779;1748;1757;689;1281;976,977;58,471;61;1135,3592;630;130;758;631;1497;1497;1751;1007;2853;1497;1497;401;401;631,1747;432,1748;2302;539,908,988,3044;670,1706;1028;58,408,454,537,538,1565,1712,1779;432,1748;2890;1565;1868;1849;58;770;58;631;2053;3108;1851;500;-1924;1269;1497;2229;2731;1281;158;439;1746;1776;1846;3141,3143;460,867,1747;58;1135;317,1826;1497;376;158;1281;3507,3508,3509,3510;2773;698;1881;61,1707;631;631,1132;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;3150,3151,3152;652;976,977;1028;58,408,425,766;1028;631;860,1224;458;377,432,453,1013,1215,1216;58;631;61;976,977;58,437;976,977;424;1565,2712;158;58;1275;1497,1810,1811;1400,1401;1028;58;58,1749;1203;976,977;1497;424,542,631,1727;58,631;1749;1747;3642,3643;1497;1028;433;810,811;3448;1630;471;1565;1748;2559,2560;2560,2573;670,2455;1746;1779;1748;58;1747;729;718,1028,1757;1497;58;487,1727;58,1028,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,2418,2422,2423;1281;1749;1390;1749;1497;1497;2425;1746;500;500;500;1335;1497;58,486,792;1565;377,788;377,788;867;631;1135,3592;990;1727;1497;631;1746;1747;867;1846;452;2356,2357;1326;470,659,2750;821;631;589,631,988;1712;513,766;1431;1269;3937,3938;947;1497;2041,2109;1565,3437,3438,3439,3440;130;1749;460;376,1674,3546;1748;1745;3526;452;1497;670,1572,1573,1574;1746,1747,1748;933;2358;631;2552;1810,1811;635;438;1497;447,1504,1552,1553,1554,1555;746;487;976,977;1747;130,377,447,2484,2485;1497;631;1846;1281;2848;1260;98;630;1497;1846,1863;130;1746;439,962;631;1497;1497;424,586,631;1497;1497;976,977;631;88,3261;3913;437;1497;396;1282;703;1497;158;447,2491;433;1177,1443,1497,1500,1507,2694;821,1535;1497;631,2248;631;1674;1728;1260;158;631;631;439;408;471;1069,1734,3544;517,1099;1497;1497;1135,3592;2750;976,977;1497;1497;2508;130,447,2677;3514;1846;1846;631;437,471;58,1565,3213;58,1565,3213;58,1565,3213;58,1565,3213;58,1565,3213;58,1565,3213;2524;157;995;119,1846;777;887;488;470;130,131;401;1087;1431;674;1497;631,988;2899,2900;1431;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,1999;1497;1497;1497;1497;1771;60,608,1497,3139;1431;-1924;1819;442,631,666,2282;3348;58,513;1497,2441;1749;827,2836;58,1023;1748;508;-59,-60,-61,-62,-1566,-1897,-1917,-1918,-1924,-1993;1497;58,1016,1760;424;439;1497;1497;1819;3537,3538;631;535;3514;821;158;58;862,2643;3233;1138;58;729;1867;3365;718,1135,3592;3315;774;1497;1565;1135,3592;1846,1847;432,2516,2517;2882;1746;1406;2893;1132;1497;136;58,908,909;2660;631;-732;2270;1575;1819;1819;837;1819;749;1117;3249;2524;58;636,2760,2761;107,108,109,2176,3089,3351,3352,3353,3354,3355,3356,3357,3358,3359;3291;837;2711;2711;1565;1565;1699;460,1122;2035;604;3994;1466,1504,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;638;692;158;447;1028;631;2805,2806;1497;1846,1863;721,3577;1846;1239;818;377,788;377,788;438;2524;779,1746;1497;58,617;438;1810,1811;989;1746;1497;1846;438;1281;158;1749;2152;1507;741,1055;3686;867;432;442;535;1846;888;2271;718,1028,1760,2271;1001,1524,2933,2934,2935,2936,2937,2938,2939;58,966,1904;1281;1497;58,1568,1569;818;439;3942;2181;584;515;405;3296;815;442;442,718;1497;3707;1819;1215;438;3055;976,977;58,2606;1351,1352,1746;631;1028;1497;136;1846;1747;1748;393,1159,1160;2135;867;452,611,631;1028;3692;631;1286;1281;500,631;158;1497;1497;58,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;3432;1155;1595;670;1746;58,59,60,61,1896;631,1748;58;1087,1497,1556;1055,1810,1811,1812;2232;158;631,2248;631;1497;439,1204;1484,1485,-1487,1487;1497;454;58,486,631,815,1318,1610;1028;1497;1497;1483,1581,1659;158;471;708,1028,1132;3779;631;377,788;1157;867,3339;1497,3011;2588;432,1748;2580;1497;816;3058;3007;500;68,69;631;517,976,977;674,2966;692;376;1497;500,1731;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;852;852;818;670;542,631;631,721,3109,3611;631;818;2311;513,1341,1565;1846,1847;89,3407,3408;1431;1497;130,2647,2648;2801;58,454,1748,1913,1915;1497;447,1504,1552,1553,1554,1555;2807;1281;670,3446;1281;439;1281;805;1750;1868;3622;58,729;1278;2393;1281;1281;432,1748;1281;487;1281;487;1281;821;500;425,452,734;508;3086;840,1466,1582,1583,1584;431;913;1596,1597,1598;1497;471;158;1468,1481;1746;821;584;2801;500;1497;158;886;1497;1746;1748;2732;58;377,788;924;1471;631;631;2957;584,631;631;631;631;631;542;471,631,1920,2242;631;631;542,631,2596;1819;393,1159,1160;502,1464;1747;1565,1748,3437,3438,3439,3440;631,1745,1748,1757;58,2542;377,788;631;1028;915;1499;-157;3058;2321;631;3455;1819;1497;458;-1924;1497;673,1620;1746;447,1452,1625,2610;447;136;438;631;960,1266;594,1791,1792;594,1791,1792;594,1791,1792;594,1791,1792;1851;130;1819;607,608;1843,1852;58;1497;1497;787;3686;2436;818;1256;670,2749;58,1565;584;2387;1110;705,1028,1497,1708;1497;1281;1819;1287;2119;1497;1497;433;539,775,1066,2158,2159;58,966,1904;1278;631;58;631;584;542,631;631;58,2942,2943;1746,1747,1748;771,983,1013;513;454,1565;447,584,1028,1565,1587,1774,1797,2647,3171,3172,3173;508;1452;631;500;58;551;500;584;1135;58;611;438;471;1497;1497;1028,3239;1748,2260;486,1380,1507;158;433;584;1452,2256;1497;815;58;61;1367;2175;1342;1497,1723;1846;1497;692;1169,3686;570;130;1431;58,59,60,61;1157;1819;119,1846;631;130;1497;487;393,1159,1160;1819;631;158;460,470;460,470;460,470;460,470;460,470;460,470;1335;126;1288,1289;58,419,433,460,537,855;438;1472;136;687,1215;471;331,332;670;1746;2172;58,1283,1714,1779,3039;2520;1846,1847;158;158;888,1191;470;2514;1497;88,1871,1872,1873,1874,1875,1876,1877,1878,1879,1880,3169,3170;158;1795;1746;584;1747;584;584;1028;584;58,584;1748;670;1776,1777;631;1819;1447;583;158;1497;58;1087,1504,1659;1156;454;694;432,1748;694;158;408,1707;158;1846;158;1497;58,1912;1431;2358;432,542,1740,2322;1922;130,2048;1497;2827;393,1159,1160;694;631;1497;1750;867;1431;1530;393;452;976,977;1819;2801;1779;397,398;1746,1747,1748,1749;1848;3939;2743,2744;1843,1846;3657;432,1748;58,1565;58,130,1022,2964;1028;1687;1780;670,1565,2140;611,805;1497;1031;395;1497;1846,1863;1497;408;631;1867;1497;3005;130;631,1223,2388;471;2230;471,2268;486;1497;1746;584;2812;1819;-136,1370;1281;59,1127,1748,1897;1745;1662;1497;2905;2197;1027;1819;158;1497;1819;1819;2646;631;1497;3406;1846,1863;1185;1497;1497;58;440,571;1281;1497;58;58;3691;1431;1497;58,584,1980;163;513;-136,1370;437,587;377;1265;750;401;968,1452;447,1808;500;837;3932;2796;1747;1771;3206;1565;631;1497;840,3524;405;438;500;470,597,598,599;837;1281;2039,3117,3118;1497;1795;631;1846,1847;692;1497;58,437;58,424,500,517,535;1497;584,3684;1838,1839,1840,1841,1889;1497;670,3115;2995;587;1819;1747;3719;58,1363;1747;61;377,497,515,631;377,497,515;631;3723;1838,1839,1840,1841,1889;1497;2511;910;1497,2055;594,1791,1792;1846,1864;594,1791,1792;58,470;145,2142;3254;1846;1747;1281;1281;1281;1497;1172;572,573;502;994;1689;58,1755;59,1127,1748,1897,1900,1901;1302;58;1900,1901;58;59,1127,1897,1898,1899,1900,1901;535;1966;-136,1370;3037,3038;697;916;631;1256;976,977;470,497,499,500;692,1812;2445;3621;471;1215,1497;631,908;584,867,2779;432,542,1740;470;432,542,1740;432,542,1740;470,1732,1733;631;631;432,470,631;432,542,1740;631;432,542,1740,2322;58,631;631;546;631;452;500;2243;976,977;1497;1497;1565;1135;-1924;1497;130,2522;1497;818;1497;58,1916;3511;3895;1497;305,306;3244;231;552,553,554,555,556,557,558;552,553,554,555,556,557,558;513;1747;1747;1595,3918;631;1746;1278,1497;437,471,587;405;3021;1028,1497;1846,1863;1380;867;447,1452;1779;500;424,470,514,532,533,534,535;3380,3381;976,977;1846;837;631;1135;638,890,3635;1497;631;631;535;1431;1846;3101;658;158;1565;1749;1497;1431;2192;58;2673;1281;2747;1846,1847;631;1281;2370;1497;2330;3245;58,61;61,619,3434;1746,1747,1748,1749;818;2902;631;2965;60,584,670,1565,3639;1418;1846;815;818;837;130,1808;1868;1027,1745;58,513;1497;58;1497;2916;130,1826,2514;1497;447;824;1846,1863;705;58;1497;631;818;1028;1028;1028;401,2801;631;1746,1747,1748;631,1751;58;1920;908,988;2230;452;377,788;631;631;58,631,1712,2884,2885;631;587,1239;471,587;513;837;3418,4005;1810,1811;1565;791;539,1117;1497;1819;2270;2705;447;58,2266;1344;136,865;58,452,486,536,1443,1747;432;1717;1281;670,2017;818;1846;631,687;1281;1795;1867;670;1846,2816,2817;1497;584;58;1281;425;2720,2721,2722,2723,2724;1356;1387,3699;2284;2796;404;158;535;61;201;867;436,2635;454,1028;217;631;1497;1497;302,303,304;2520,2730;3103;60,1796;60;1497;3788,3789;631;58;58,3774;632,633,1749;670;1565;61,619,1565,3434;1846,1863;1809;2264;377,408,514,734,786,787;471;1565,3437,3438,3439,3440;1497;58;58;1028;1497;2471;2070;687;1497;1565;1028,1565;1565;1747;1157;3672;158;1384;1356;1832,1833,1834;2894;1497;1497;508,1747;526;2486;1747;1042,1043,1044;2071;1497;867;61;976,977;377,788;976,977;3124;-136,1370;-157,-2838;2815;1028;1819;838;2408;1196;2298;1868;1819;1819;413,1851;393,1159,1160;631;1565,1779;1819;1565;1846,1847;508,623;1749;612,766,983;539,540;130,2514;1497;126;2297;2906;1747;1497;58,61,584;487,631,2781;1810,1811;2098;1028;155,401,411,867,1042,2769,2770;631;1431;442;119,1846;1028;401,1760,2696;510,1028,1565;840,1466,1582,1583,1584;454,1565;1497;1846;631;98,741;1846;1579;631;1538;1256;1838,1839,1840,1841,1889;1846;1497;837;1431;880;1507;158;-1924;631;2755;377,788;1497;58,966,1904;1747;3610;11,20,365,366,367,368,370;158,1300;837;1746;1281;1497;1281;136;1497;3165,3166;989,2107,2186,2273;432,1013;1281;1281;1281;1281;1497,1748;2038;1468,3383;672;2075;1148;432,487;1846,1847;1281;1281;670,1021,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,3346;1281;1126;58;439;1028,2748;1747;1565;419;551,584,815;594,1791,1792;1565;719,2138;1816;155,1507;759,765;58;1497;58,1400;3338;638;608;1028;4006;631;1028,1747;58;-1924;1497;1497;1497;1004;3264;631;-1924;500;1132;631;1747;58,408,537,538;659,1283,1779;1028,1747;58,500,517,1100;631,1028;729;-157,-2838;924;589;589,924;1748;158;130,1493,2080;631;158,393;1084;257,258,1836;1497;1747;1846,1863;3557;1281;1746;1846;1846;1497;408;1281;1281;631;1747;502;58,584,867,1530;631;631;-136,1370;1281;58;3507,3508,3509,3510;3960;3928,3929;3314;3013;58,61,1707;487;2234;1375,1625;1712;3150,3151,3152;988;3150,3151,3152;1312;584,631,649;437;58,471,631;58;377,788;437;542;377,788;760,763;1707;631;649,2233;976,977;584;1497;2801;721,3577;447;631;495;58;630,692;1497;500;1497;471,676;439;2609;130;2322;461,3246,3247;760,763;58,-1766,-1767,-1768;1565;513,1028;58,1028,1747;537;1727;500;631;1727;1028;1028;631;1055;670;631,1712;1902,1903;3758,3759,3988;821,1535;1497;438;1472;821,1497,1560;1449;1028;2602;1934;1497;1497;1028;631;58;1565;867;631;1132,2178;1846,1863;631;1497;393;432,1748;432,1748;2801;1747;1497,2239;447;1282;976,977;1028;976,977;718,1028;631;712;867,994;2928,2929;1810,1811;377,1334,1799;130,452,631;2797;927;1819;439;3269;584;1747;1497;1497;1497;1497;148,2676;393;158;1497;1497;1497;1497;687;665;3514;513;437,471,500,587;432,471,500,631;393;2963;1281;1256;1093;500;1749;1356;393;584,1497,1594;1746,1747,1748;1497;3970;1132,2160;631;1497;432;631;487;1971;1281;438;1281;631;539,2270;98;393,1159,1160;692;205,206,207;741;630;548,631;631;1215;2406;377,788;1497;396;1846,1863;432,487;432,487;432,487;61,670;537,1756;631;424;1497;1779;1565,1776;1497;1117,1388,1389;1497;1431;158;337,338;454;408,1253;447;2551;1714;477,627;1851;955,1538,1583,1634,1654,1655,1656,1677,1678,1679,1680,1681,1682,1683,1684,1685;1846,1847;58,471,904,906;58,903,904,905;908,2157;1497;3205;393;1431;454;1851;1504,1506,1507;3644,3645;631;933;1497;1497;1817,1818;1239;2949;2192;447,1452,2354,2355;3348;203;1075;1497,1576;1625;447,1808;1497;1565,1779;1497;1497;1497;413,416;741;631;1497;1045,1046;158,1846;813;1846;2562;1256;2163;1319;1497;1497;1497;1198,1199;1497;3032;1497;1846,1863;424;631;486,1318;117,118,405;535;670,815,867,1723,1868,1971,1975,1976;405;500;837;1824;836,837;413,1851;1846,1863;771;-1924,3705;173,174;1819;173,174,3969;177;1846,1863;3125;1281;1281;1380;1243;1819;736,737,738;1745;1497;611;1497;1819;2324;1851;1497;840,1466,1582,1583,1584;692;1753;631;2199,2200,2202;1497;631;1497;3930;2524;58;831;158;447,1504,1552,1553,1554,1555;1132;1157;1497;1281;3575;1565;2111;873;58;2552;2949;58;2644;754;58;1851;1497;119,1846;376;692;1278;415,1819;3686;3791;1748;1565;58,3837;454,1776;454;1497,1800;1001,1524,2933,2934,2935,2936,2937;454,1565;1594;1497;1497;1497;1177,1504,1590,1591,1592,1593;1497;1922,2830;1028;631,2267;454;442;2101;1497;691;1846;1028;98;1215;1819;1497,3194,3195;1819;1382;631;631;818;2111;1846;1652;1583,1635,1677,1678,1679,1680,1681,1682,1683,1684,1685;1622;3796;58,1565;58;1749;58,844,2137,2219;58;1565;1497;58,1526;58,1599;1471;1497;1846;1497;3941;158;1157;1497;1846;1846;1028;1497;1565,3437,3438,3439,3440;282;1846,1863;1846;631;1846;1133;1497;486,1026;502,804;2283;408;1809;2801;1795;1497;58,437;631;2055,2441;1476;58,2825;1055,2153;1565;2524;377,788;487;2182;58,61;1497;-157,-2838,2848;1819;3876;954;308,1891,1892;158;1891,1892;1891,1892;158;419;1438;1418;158;631;1452;631;438,470,893;58;1843;247,251;158;447,1808;1281;2801;158;3251;158;1537;377,788;1712;130,2514;631;663;486;1281;1281;377,788;376,1707;467;1281;1497;976,977;669;1281;1281;1281;1819;377,788;976,977;3657;377,788;377,788;191,192;1497;1497;2104;1497;1497;840,1466,1582,1583,1584;158;1356;1846,1863;1256;662;631;158;976,977;1659;377,788;542;631;1747;1497;492,3952;158;1215,1594;988,1743;631;58,60,61,631,1707,1779;500,631;2705;3008;513,1636,2156,2157;376;487,2140,2141;2230;631;631;2715;58,1348,2860,3180,3181,3182,3183;1737;631,2198;515;631;631;433;377,788;1281;1565;2113;1497;447;844;957;1003,1488,1489;542,826,827,828,829;631;437,471,587;976,977;377,788;2256;1851;158;1011;2161;631;130,1497;1497;3394;1007;3394;2739;1028,1127,1900,1901;594,1791,1792;584;2823;1497;158;155,1663;495;58;1868;130;1851;500;447,1808;500;1748;551,584;976,977;377,788;2848;631;3657;3657;631;631;631;500;2213;1846,1863;818;1497;1497;3369;1746,1747,1748;3072,3073,3074;818;1747;1497;2370;976,977;1851;654;1210,1497;3747,3748;3240;1504,3129;2111;584;638;968;1497,1801;58,1955;-157,-2838,2848;58,98,1529,1613,1614,1615;158;2393;1746,1747,1748;158;1215;1746,1748;1745;401;447;569;1846;3883;1497;3627;1497;522,1497;631;1169,3686;1791;1497;158;2644;486;486,792;1380,2151;486;58,1565;589,662,1491,1492,1493,1494,1495,1496;1497;3712;1846;436,454,1749;1028;1746,1747,1748;130;405;1431;1846,1863;1846;1746;2507;1565;500,631,976;61,1497;1497;1497;58,59,60,61;58,1283,1714,3039;1497;1497;837;294,295,1101,1102;827;3305;2639;2571;1747;58,61;631;584;631;631;1550;631;160;1497;863;1497;630;2184;1497;130;130;88;631;58,1443,2361;58,631;1042,1043,1044;1215,1497,1565;1215,1497;447;1028;1215;58,1755;1028;58,1565;408,1707;408,1707;408,1707;508;1838,1839,1840,1841,1889;1838,1839,1840,1841,1889;1846,1863,2077;1281;837;1431;158;58,1912;393,1159,1160;2127;692;2801;130;584;438;2801;3912;377,788;1400,1783;3300;631;631;539,540,649,1223;58,1779,1901;419,3589;58;1027;1779;419,460,1746;1748;594,2224;1749;1028;1747;959,960,961;1215,1497;1674;1497;1281;60,61;1750;1215,1497;158;3974;432,500;631;1116;471,587;408,631,1565;631;452;1028;2320;471,587,1239;631;1135,3592;58;631;1358;2373;1132;424,631;1565;1846;1846;1868;1263;405,1819;1497;3514;1846,1863;377,788;1846,1847;1028;631;130;2622;1819;58,938;158,1124,1846;1497;1497;58;58,486,1746,2692;1497;440,542,3690;61;1497;1674;551,584,1497;377,437,631;1497;401;2322;631;1746;376;1565,3693,3694;1132;1550,3669;158;1425;2370;1129;2523;631;1497;1497;136,551,584,631,1749;1380,1507,3825;1215;3041;1281;654;483,1846;1431;2644;58,584;2644;396;1433,1674;454;1529,1772,1806;1497;110,111,112;58,828,2734;408,704;68;1747;1464;617;1721;1846;631;1356;1431;126;1497;1819;631;3350;471;594,1791,1792;3288;395;393,1159,1160;584;542,631;594,1791,1792;594,1791,1792;408;1256;2686,2687,2688,2689,4016,4019;58;1055;130,2514;3906;1419,1420,1745;1846;584,867,2779;432,542,1740;377,788;1061;2230;500,631;467,1135,3449;631,1497;631;631;432,542,1740;542,1739,2322;432,542,1740;631;631;1132,1579;1466,1467,1468,1469;551;1452,2374,2667;60,460,1028,1746;1497;953;542,631;938;631;377,788;1135,3592;1747;1868;1497;2229;1846;2240;2240;2240;1497;1599;631;447,1335;1431;1497;1497;1810,1811;513;1040;158;447,1808;1422;1843;3216;976,977;1846,1863;1497;1322;615,1749;158;1497;1345;2570;3291;61;1742;158;1661;1497;1867;1431;1132,2149;1810,1811,1812,3568;447;1497;1819;1425;1928;631;629;1157,1746;631;1747;2681;1779;1846;1497;2507;377,788;631,2924;976,977;631;2402;376;976,977;631;631;1375,2774,2775;1376;1497;1747;2186;584;631,1810,1811;2931;1497;670;3070,3071;1497;1747,1748;1750;682;60;630;508;432,1748;1497;1846,1863;1846,1847;631;487,539,540,541;296;408;946;72,73,74;1281;1281;58,408,989;2094;1215;1256;1431;721,1565,3109;508,1846,2500;2526,2527;1497;3325;1748;1497;718;467;851;1843;2718;1746;447;1819;1819;376;1497;1819;322;2533;58,454,1028,1913,1915;-136,1370;796,1497,2460;1565;158,405,406,407;3827;1497;1497;1497;1169,3686;58;2067;1748;98;2967;1132;926;976,977;158,771;1819;1497;1497;58,454,1028,1913,1915;58,454,1028,1913,1915;1846,1847;692,1497;1691;1497;130,1497,1587,2810,3026,3027,3028,3029;2155;1449;1497;1497;1497;1497;1497;486,867;1497;437;976,977;631;500;631;132,133;136,1565;1497;1497;729,1746;467,1028,1776;436,1746,1747,1748,1749,1776;3559;1281;3398;179,180;1497;393;2657;584,631;1497;88;1497;119,1846;1846,1863;1497;670;1819;119,1846;837;1819;408,1131,1132,1133,1135;1851;2192;1819;130;646;631,2247;136,1846;1746;58;158;1432,2304;3379;1612;480;187;815;1819;326;1497;401;1497;1916,1917;631,2233;631;447;687,1497;438;3939;438;832;2996;1497;58,729,2606;1464;98;148;158,428,429;1846;1497;1431;1431;2922;631;2258;631;631;2973;1497,1810,1811;58,966,1904;1497;-2838;670;148;1565;58;61,3798;631,2267;58,1565;1281;1846;1748;814;136,1430;1281;376;2552;2555;1846,1847;1846;280,281;741,867;58;58;1431;3348;1846;867;1431;1497;1749;58;1497;631;58,454;61,670,1135,1583,1647,1650,1677,1678,1679,1680,1681,1682,1683,1684,1685;3147;966;631;1205;58,828;471,500;976,977;491;3219;1565;58,437;61,631;1746;58,631;58,437;1565;1746;408;58,437;1521,1523,1524,1525;1887;1743;447;631;447,1808;158;986;1497,2913,2914,2915;1497;500;158;1497;1497;486,1318;119,1846;119,1846;401,821;158;1807,3860;1497;401;1135,3592;500;976,977;919;1804;1497;58;1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,19,20,21,365,366,367,368,370;377,788;88;604;1380;631;1714;130;976,977;631;1846,1847;611;58,437;976,977;377,788;377,788;788;1746;-1924;1846,1863;1497;1750;692;599,1477,1478;1747;413,1851;542,631;1497;424;2116;458,539,540;20,365,366,367,368,369,370;840,1466,1582,1583,1584;1747;1497;2192;631;58,1749;3668;2370;1028;500;1727;631,3549;61;58;1356;424;1461;1497;1749;316;1819;158;352,353,354,355;424,1727;1013,1027;867;58,454,1752,1913;58,454,1752,1913;1110;631;631;1497;377,788;1497;158;1746,1747,1748;1943;1943;1497,2765,3133,3134;611,1193;2447;2309;1497;1497;376;58;976,977;1438,1449,1497,2873,2874;1497;502;692;686,893,1745;976,977;1497;58;1028;-1924;1281;130;1574,1606,1607;2018;1497;867,1456;1431;1497;1851;1256;675;148;2003;1838,1839,1840,1841,1889;1497;1281;1052;984;1846;2558;1431;164;158;1028;130,2514;500;1851;1215;1846,1847;1281;1497;692;1497;976,977;631;58,486;432;631;58;631,908;631;3828;1867;1550,3669;249,250;1846,1863;918;58;1846,1863;815;377,788;1822;1497;432,1270,1271;261,262;1819;1335;1846;158;1746;631;358,359,360;1497;631;98,3890;551;836,837;584,908;3939;424;649,1223;2079;424;1846;3514;1846,1863;1497;1281;867;58,1565,3213;58,1565,3213;1067;1851;903,904,905,906;181,319;1243;775;1846,1863;1819;58,491;1497;1747;401;631;454;432,486,1531,1746;2716;3101;1497;3514;1497;401;631;1497;1659;158;1748;1028,1565;1747;513,594;1281;1265,1497;500;1497;2442;1497;1497;631;487;631;821,1497;58;408;1819;1135,3592;1135;1135,3592;2953;3110;867;1110;401;1846,1847;1562,1563;1278;1748;130;454,1135;1497;58,440;1846,1847;542,631;401;158;3937,3938;1565,3437,3438,3439,3440;1497;1132;1281;58;432;1256;1565,1779;1846;1846;58,1565;584;3514;-1924;1169,3686;500;821;1765,1766,1767;1843;1246;2848,2849,2850;670,1497,1625;413,1851;1748;1497;432,1748;1326,1436;1497;654;130,1826,2514;1851;948;61,1497,2441;2695;393,1159,1160;837;377,788;1565;234,235;2568;158;1497;1338;1747;1215;61,1283,1918;467;1001,1524,2933,2934,2935,2936,2937;432,1748;1497;393;3576;631;2654,2655,2656;405;1846,1847;818;542,631;631;1565;1215,1497;58,586,631;130,825;486,1593,2587;587;584;1846,1847;1408;487;1611;2801;2345,2346;1028;1605;1497;1497;976,977;733;1087,1497;1497;1843;1819;1846,1847;1497;1565;1497;486;718,1135;401;706;1497;487;631;1749;1846;377,788;432,1748;2236;1497;1497;584;58,437;1497;158;1497;1819;58,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;401;1497;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;2049;2552;1055;1497;542;158;438;-136,1370;1846,1863;1028;1497;1497;158;1747;393,1159,1160;2115;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;1497;401;631;1497;1565;1846,1863;1846;1846;1497;2200,2201;136,508,670,1356,1574,1606,1607;58,1623;1281;447,1504,1552,1553,1554,1555;1281;1497;1281;1281;976,977;1281;377,788;1497;393,1159,1160;1867;447,1808;801;2084;1269;2322;1497;426;1846;377,788;631;1846,1847;1356,1357;867;500;58,1568,1569;1846;158;1846;1846;58,2257;867,1660;2090,2091;2091;1848;723;961;976,977;377,788;891;631;1846,1863;324;1087;1497;1746;1473,1474;1266;2754;1497;1846;1497;1846;3951;433;1846;1559,1560;1565,3437,3438,3439,3440;686;1819;1746;631;424;631;631;631;1282;1846,1863;844;1135,3592;393,1159,1160;670,1674;1452;419;1747;1565;1497;401;58;3993;1497;1497;631;2652;1342;1281;1281;2997;1028;1846,1863;1497;933,1132,2114;1497;535,867;631,1129,2479;2176,2489;1497;1851;1779;1649;1019,1020;1281;631;408;1846;551;136;393;1561;377,788;1779;-3159;158;1497;158;599,1477,1478;1565;1497;1851;-3048;3725;1497;1846,1847;438;158;584;1846;1497;393;968;741;631;662;631;1749;1771;58,59;58;867;1036;1497;631;405,1846;3939;68,69;631;1746;377,788;408,1707;1497;155;1846;130;1157;976,977;631;58;631;1497;2256;1497;1281;1028;58;58;1565;1565;1497;58;1028;486,792,1575;2683;1281;1497;158;1497;260;1776;1028;259;2261;467,1028;413;439;447,1808;3121;377,788;514;1594;119,1846;454;1281;1497;377,788;377,788;58,437;1028;976,977;1457;1846;1439;438;1497;2111;2715;2524;1846;405;158;1497;61;1851;158;692;662;500,631;631;401;1819;815;490;500;1497;1819;452,631;631;631;587,631;611;4020,4021,4022,4023;513;1028;1184;1497;1281;1565,3437,3438,3439,3440;3917;1565;413,1851;3897;58;1497;939;1497;2888;1497;1497;692;1110,1117;1497;1819;1846,1863;1497;447;3873;631;3002;58;844;3037,3038;61,1283,1918;2215;437,471,587;500;631;1819;1497;88;58;500;1231,1237;377,788;586,1735;631;631;432;477;377,788;631;631;500;432,860;470,500,631;377,788;1707;968;1846;1188;1819;2256;1135,3592;692;1809,2539;1497;1110;-1924;447,1808;405,1846,1847;2801;158;1281;2168;1891,1892;114;3588;59;1846;2801;818,2034;976,977;1497;797,1819;1846,1863;130;1028,1583,1677,1678,1679,1680,1681,1682,1683,1684,1685,3446;1497;1819;1497;447,2258;818;1565;1846,1847;1497;1497;1846,1847;3550;432;1497;1497;692;3364;500,631;468;1497;58;393,1159,1160;88;1497;2419,2420,2421;1846,1847;3936;525;1241;1418;500;158;58,59,60,61,1896;1171;631;976,977;1256;2231;377,788;976,977;377,788;976,977;1256;631;606;587;976,977;60;3444;631;631;58,1110;58;1497;1028;631;1028;1747;486,792;1497;1867;2192;130,2514;405;1924;432,1748;3275;408;654;1497;158;454;1611;2772;3825;432,1748;58;1281;535,806;2960,2984,-2986;500,542;1497;401;126;1431;1882,1883;1565;1565;1413;1565;933;58;1281;58,1028,2887;1967;437;500,631;1846,1863;2370;1747;1745;1135,3592;1748;1565;1135,3592;452,611,631;58,1135;425,513,582,1749;1745;-136,1370;58,454,1749,1752,1913,1914,1915;291,292,293;1851;1132;255,256;631;1851;58,1583,1637,1677,1678,1679,1680,1681,1682,1683,1684,1685,2877,3375,3376;968;692;401;58,454,1028,1913,1915;509;1110;2229;58,486,1028,1358;1468,1481;1497;867;470;1686;670,1572,1573,1574;1843;1795;654;1418,2454;61;1658;842;126;1255;1846,1863;1747;654;631;1851;1890;741;1497;58,1028,2992;438;425,611;1358;130,818,2514;1497;1819;1281;1087,1497;1846,1863;655;898;394,2379;1846;326,327;662;3514;1497;1497;1042,1043,1044;136,686,2945;432;815,1157,1278;1788;1747;2801;181;1281;3435;3228;154;1028;1497;98;437;58;910;631;58,966,1904;58,1905,1906;376;2618;1497;927;1281;1110;269,271;3817,3818,3819;396;166;486,1529,1532,1533,1534;1846,1848;1848;513,1062;2801;1281;1281;119,1846;3308,3309,3310;58;58,2625;1846;447,1504,1552,1553,1554,1555;58;611;670,1529,1648,1649;1497;130;58;492,631,1734;1497;1565;1747;58,584;1007;631;58;1819;631;58,2706;631;424,470,535,542,1098,1099,1100;58,1028;432,1748;1087;1565;1851;19,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,383,384,385,386,387,388,389,390,391,392;1177;565,566;58;438;584,867,2779;130;158;1796;377,788;-157,1965,-2838;487,631;58;148;1497;1132;1846;1846;1497;1843,1867,1870;1846,1847;1816;821;148,283,284,413,1826;1281;3507,3508,3509,3510;3507,3508,3509,3510;19,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,383,384,385,386,387,388,389,390,391,392;976,977;3150,3151,3152;631;58;976,977;976,977;631;976,977;976,977;424;1272,2105;584;631;631;1749;670;61;815;2265;1497;1135,3592;1497;1497;1497;433;1753;471;1846,1863;432;432,522;631;1356;631;424;1846;1047;1423,1424;58,454,1748,1913,1915;1135;1846;1281;2801;2829;1497;500;631;1028;2274;3259;1330;130,1825,1826,2514;1497;1497;1497;631;2496;1028;976,977;1565,3437,3438,3439,3440;976,977;705;1497;3657;1891,1892;447,1504,1552,1553,1554,1555;976,977;976,977;1497;3732;405;1851;692;968;1846,1863;158;287,288;393,1159,1160;1819;1846,1863;61,3579,3580;692;377,788;584,631;500;631;1846,1863;3089;377,788;58,377,559;631;1356,3033;570;408;792;2765;1157;3023;1497;419,1255;692;1281;631;1431;1497;454;1497;58,59,60,61;1846;1851;119,1846;1152;1281;976,977;1497;1497;2820;1497;2329;2974,2975,2976,2977,2978;1747;1819;1132;2442;1497;1497;444;1819;1749;433;1028;1819;824;265;1810,1811;922;687;3441;1497;432,1748;1846;158;660;1281;471;1843;1850;136,153,1850,3760,3761,3762,3763,3764;1846;1851;1851;1565;401;1502,1503,1504;1748;1497;1497;1851;1497,1565;670,1723,1806,1972,1973,1974;1819;837;837;785;527;827,1157;3514;335,336,393;130;1846,1863;401,741;393;158;432,542,1740;1497;741,3514;692;1497;2432;2513;320,321;1497;1169,3686;3686;1497;1846;611;1851;1750;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;631;1748;1497;2055,2540;1748;377;2192;-136,1370;158;1851;1497;1497;58,61,584,1283,1918,1919;631;1497;1497;432,542,1740;1999;578;1999;1851;1001,1524,2933,2934,2935,2936,2937;2209,2210;486,1028,1265,1306;1497;1795;500;377,788;1497;2957;393;1565;1281;1028,3287;662;535;432;3454;1003,1488,1489;976,977;2604,2605;931;631;1409;1281;1281;1009;60,3980;840,1466,1582,1583,1584;119,1846;486;377,788;377,788;58;1810,1811;2043;1281;692;1848;452;631;908,988,3044;447;148;3968;821,3257;1497;500;447,1452;1138;721,867,1278,2055,2216;1497;620;500,510;452,611;424;2245;976,977;3200,3201,3202,3203;1224,3087,3090,3091,3092,3093,3094;500,631;1028;1380;570;757;1431;1795;158;1028,1127,1900,1901;432;3523;1497;1891,1892;1891,1892;471;2243;1819;631;631,1497;158;3826;660;542,1738;631;1028;377,788;1281;58;1497;1497;570;890;890;1281;377,788;631;2256;447,1808;1497;1565;158;1497;130,2514;1797;1851;393,1159,1160;2005,2006;976,977;1497;692;1497;1239;229,230;631;631,2198;2185;1819;1851;1243;1747;1846,2564;691;130;976,977;1497;1846;3514;130;447,1810,3539;376;58;4015;536,584,1071,1118,1746;1132;148;535;692;670,3609;3419,3420,3421;3419,3420,3421;3419,3420,3421;158;1290;58;1497;1846,1847;1851;2149;1497;438;1121;1819;58,59,60,61;58,59,60,61;1087,1497;61;976,977;976,977;2064;3902;3369;1891,1892;1281;1281;1281;1497;3776;1497;1497;1748,2260;631;58;2410;1497;1594;502;1497;1497;158;-136,1370;158;476;1373,1374,1375;636;1497;1497;1779;393;376,486;1497;1497;1746,1747,1748;1846;1215,1497;692;486,670,1318;486;662;58,59;1846;1028;1230;393;1819;2233;1497;1565;1281;1846,1847;976,977;2120;58,61;1497;1846;542,631;377,788;58;2501;976,977;1846;2192;447,1808;3514;891;377,788;1497;815;1845;58;1497;1809;377,788;130;631;377,788;1747;1846;158,439;3531;58,3425,3426;1748;1749;1497;1497;20,365,366,367,368,369,370;892;1205,1243;154;393;432;631,1776;2524;3446;1846;1497;3670;1747;377,788;1846;1851;1851;1846;405;3308,3309;631;2524;968;1497;487;1053;432;408;1497;140,141;1497;1281;1632,3766,3767;1028,1135;544;631;377,788;119,1846;924;3595;692;2494;1691;119,1846;1497;158;2233;1748;1819;486;2226;500;2316,3137;3348;1819;1380;61,1779;1497;1497;692;1846,1863;1497;2642;1900,1901;449,450;3863;1565;638;1253;1770;2780;2034;879,1846;1565,1779;631;976,977;631;1497;2322;631;1497;1497;58;1497;1090;1819;1819;837;976,977;1749;818;1028;1748;1497;58,486,1515;58;2111;1497;1497;2481;2076;471;1135,3592;500;2240;2240;631;1846,1847;631;3528;500;1497;1358,1779,3163,3164;631;500;1848;1819;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;3540;1497;976,977;837;1851;447,1808;1055;460;1747;1497;631;1281;818;1497;438;1497,-1499;175;2192;1497;1497;1497;2375;58;500;631;631;1754;1028;631;61,584;1497;1608;432,3990;1281;1570;1497;631;1846;393;867;1746;1579;158;58,487;949,950;1135,3592;1284;439;1497;1368;1497;1497;2671,2672;1843;1565;1846;1028;1565;1135,3592;58,454,1913,1915;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;1135,3592;587;401;129;2055;58,436,454,1028,1913;1745;1565;1565;1028;1497;1135;447;136;1132,1497;1989;1851;1846;58,59;2082;393,1159,1160;2358;631;2404;2192;158;1497;1497;1497;3400;2456;500;424;1457;1356;631;1497;1851;1819;502;654;1596,1597,1598;165;2532;1867;1497;3720;1749;1749;1497;1269;1410,1411;1851;1497;1846;1497;513;158;1502,1503,1504;1819;898,2379;1819;1819;1846;1497;130;631;2192;1497;631;58,1779,2186,3159;631;631;58,3054;1359;377,788;377,788;1249,1497;500;3625;1846,1863;158;867,1483;2410;136;1281;3171;1247,1278;821;160,161;158;58;2973;1747;158;454,1135;130;3583;976,977;377,788;377,788;1851;548,631;589;1157;551,1748;1497;1674;1497;405,1851;1962,1963;1265;731,1384;1747;1497;401;631;2322;432,542,1740,1741;452,611;976,977;377,788;136;631;377,788;376;1497;393;1497;3584;130,3370;1747;1749;432,522,523;1497;1278;58,454,1753,1913,1915;2073;542;58,454,1565,1913,1915;1132;1497;1497;631;1215;631;570;1565,3437,3438,3439,3440;1497;454;1891,1892;1200;1439;171;500;377,788;631;1497;631;3514;440,670;1497;968;1746;1497;741;2521;500;3656;1497;1846;501;631;158;1497;377,788;759;1497;817;1497;1528;447,1808;1281;377,788;654;1846;1497;1846,1863;815;631;377,788;1497;432,487;654;1157;1846,1863;1851;1846;158;1846,1847;903,904,907;3757;58,1791;1132;1846,1847;631;1810,1811;181,182;1851;867;2463;2463;631;584;815;1746;3021;631;4014;631;2350;1497;2000;631;2074;1846;-1924;922;1851;1851;447;1135,3592;1851;1255;3681;670,1572,1573,1574;1497;1497;1497;891;670,1572,1573,1574;1846,1863;1697;1819;1281;1497;1851;1157;976,977;2677;670;58,59,60,61;1083,1084;210,211;377,788;631;376;2790;1497;1132;1497;867;432,1748;1748;60,425,670;1497;58,1565,3213;130;158;3955;1497;58;1001,1524,2933,2934,2935,2936,2937;1497;1497;1819;58,59,60,61;1851;58,59,60,61;1497;413;1819;1157;1846;-136,1370;1028;413,654;1916,1917;1281;2778;1722;670;863;500,1238;3441;393,1159,1160;692;821,869;1497;631;58;452,611,631;1497;401,867;1497;58,401,447;500;2256;1028;976,977;542,631;1276;588,589;3567;2287;1497;130;1565;1281;2184;377,788;631;3816;1497;818;1891,1892;1891,1892;1891,1892;1891,1892;2538;438;-136,1370;1497;1851;584,1028,1565;158;130,1579;818;1851;1085;743;3403;847;1281;976,977;1497;58;3889;377,788;158;1463;2655;2655;1281;500;599,1477,1478;1746,1747,1748;1471;453;1450,1451;976,977;413,1851;1851;1851;377,788;821;1595,2220;130,447,1357,1516,1517;61,487,584,2402;976,977;587;976,977;377,788;413;1278;138;2132;433;2651;2258;2801;130;377,788;393,1159,1160;377,788;611;631;58;867;1497;1497;447,2139;671;1497;1497;-1552;158;1281;452;1157;631,3015;172;377,788;976,977;1846,1847;1016;1891,1892;58,59,60,61;584,631,1565;2467;631;58,59,60,61;2372;2233;631;1497;1851;58,59,60,61;396;1748,2260;1851;377,788;393,1159,1160;1497;631;1867;1795;1281;1281;1169,3686;88;158,1846;1804;1851;1795;870;551;1497;815;1819;486;58,486,1588,1589;1028;158;1309;1497;3373,3374;1846;2192;1281;1497;1281;58,59;1091;1110;396;3551;1579,1810,1811;1844;1800;1169,3686;158;1846;631;3349;1281;98,3792,3793,3794;539,2270,2590;631;1819;2801;1497;1028;976,977;631,1128;158;1846;1497;2920;631;1272;1846;1497;1497;136;2182;1497;1779;837;405;1747;58;438;98,3734;2480;910;424,631;1426;1028;587;471;2801;2801;1383;158;1281;1819;1846;976,977;1497;405;976,977;2192;513;584;2267;631;377,640,641;630;968;1750;1281;1268;1846;1846;631;393;1846;863;1380;584,1745;500;638;106;611;1846,1847;1497;1497;1497;158;2917;633,730;1851;1412;2041;631;976,977;130;58;3361;58,1565;713;1497;3685;58,1568,1569;1530;432,542,1740;377,788;584;432,542,1740;858,859;457;1365;3048;654;635;432,1748;1819;1746;1497;2973;1497;377,788;2566;1795;1846;2240;2240;1121;1497;1497;3244;1819;631;1497;1281;1452;1819;837;1846;1497;2404;1846,1863;631;2269;1851;58,59;130;1497;1497;58,59;448,631;1846,1863;1281;158,405,1294;2201;500;1819;438;130;58,59;58,487;976,977;631;470,471,885;377,788;1028;1819;631;1846;1497;1497;1846;393,1159,1160;1846,1863;1497;1027;58,989,2107,2108;1497;1867,3344,3345;1028;1497;1819;502;1846;2960,2983,2984,-2986;452;88,1282;1135;1753;1819;1851;1851;1135,3592;269,1603,1604;1748;58,454,1913;1819;1846;1497;584;1281;1497;58,454,1028,1913,1915;1819;1747;1497;1265;1698;432,486,792;1819;1846,1863;654;1846;1819;1848;500,631;631;1846,1863;983;692;119,1846;1746;1819;1497;393,1159,1160;158;1502,1503,1504;1851;837;1851;1497;1846;631;1007,1130;1497;1748;408,1779,2186;510;705;631;1497;1747;1748;3956,3957;1281;1497;401;1418;631;631;1281;584,631;1819;2534;432,1748;1843;1281;1281;536;631;393,1159,1160;58;1243;570;1497;460,631,674;1846;1809;562;1457;631;584,1497;377,788;377,788;221,222,223;1186,1187;2020;3331,3332,3333;58,454,1565,1913,1915;1482;1565;1846;408,1747,1748;58,1747;130;158;393,1159,1160;976,977;931;1846,1863;1336;150;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;1028,2682;158;3967;3507,3508,3509,3510;58,815;130,1826,2514;1497;1497;437;976,977;976,977;2972;976,977;2902;130;1747;1625;158;933;670;692;58,454,1752,1913;924,1215;3556;1431;2973;500,631;1381;1851;631;433;1746,1747,1748;437,1256;1497;631;451;1132;976,977;1748;1497;631;1750;933;58;3078;1497;502;1851;1281;1749;1846,1863;1256;58;976,977;500;401;58;447,1808;3514;922,1181;1497;158;500;377,788;1281;1815;3967;432,487;413,1851;1851;1851;146;1497;2801;1846;631;631;1497;1497;1497;1281;2463;1497;631;443,444,445;485;487,1016,1224;500;3514;1851;424;1281;1819;631;234,235;2192;1746;1256;924;3583;1497;535;1819;432,1748;920;631;1846;1747;130;976,977;1819;840,1466,1582,1583,1584;1448;1281;158;631,1497;1770,2563;58,513,537;1497;1846,1863;-3942;1059;1169,3686;1497;130;2856,2857,2858;158;1497;502;1497;646;393;1028;867,1435,2823,2824;2979,2980;1795;3446;-136,1370;-136,1370;-136,1370;119,1846;58,3208;731;728,2390;58,59,60,61,1896;3377;1920;1851;1497;2703;1851;1846;3258;631;867;1497;1093;58,1081;58;1750;976,977;130,2514;1565;1843;2178;130;2801;631;867;662;894;1371;611;59,1127,1748,1897;1497;377,788;1497;377,788;158;377,788;500;181,202;933;377,788;1281;1891,1892;-772,1891,1892;1891,1892;1891,1892;1891,1892;-136,1370;1851;1851;630;1497;815;90,91,92;-136,1370;1281;1281;1281;393,1159,1160;1846,1863;1851;1028;1256;2325;1846,1863;3308,3309;158;1497;1281;815;1497;2031;1497;584,1726,1788,2158;976,977;1819;88,1616;1497;1497;58;1749;101,3427;1205;401;1819;500,542;1846,1863;654;976,977;377,788;58,59,60,61;1497;1205;1851;1819;487;1497;631;2289;1846,1863;1497;1497;1497;1278;408;1007,1347;976,977;631;58,59,60,61;2801;1819;2372;631;1281;1281;1281;1846,1863;1846,1863;377,788;158;1846;1281;1497;1497;1497;1019,1020;615,665,1019,1020;818,873;3270;1497;1846,1847;3307;58,59,60,61;1674,3845;740,1819;1132;58,59;3726;130;1497;1497;377,788;631;393;2502;3995;976,977;1804;968;2240;1851;631;58,59,60,61;2149;425;668;155,1243;1282;158;2230;119,1846;1497;405;1748;1967;1819;3735;654;437;1819;1042,1043,1044;1846;1497;377,631;2091;2055;1497;3903;500;452,611,631;631;419;502;158;419;1090;1215;1846;1846;377,597;631;630;891;447,1504,1552,1553,1554,1555;1846,1864;631;1616;199,200;1891,1892;3303;3004;61;3037,3038;844,2219,2700;968;976,977;1846;976,977;631;631;584,1497;500,631;968;968;1087,1497;487,548;1497;1497;1483,1497,1581;631;1846;1846;2240;433;1851;535;631;1747;1282,1956;1867;58,59;1281;454;58,59;1565;58;1497;1256;158;1497;617;1497;1132;1278;1497;1497;662;3395;741;2794;1497;1748,1753;1497;976,977;976,977;1497;1497;1819;657;410,411,412,1497;2776;1028;3743;1135,3592;2918;1851;631;1846,1847;631;1819;1804;1449;-157,-2847,-2848;1135,3592;584;1497;2172;818;1846,1863;1565;1281;3548;1746;58,454,1752,1913,1915;1916;1135,3592;58,454,1752;631;1749;1846;130,447,2677;377,788;58,729,1748;1747;58,454,1028,1913,1915;1497;376;1748;340,341;692;1846;1497;1851;1175;1819;972;3238;1819;837;1819;1796;710,711;1846,1863;1846;1747;1497;898,2379;1819;58,59,60,61;1398;1920;1497;976,977;976,977;631;1067,2796;1846;1231,1232,1233,1234,1235,1236,1237;377,788;1497;393,1159,1160;1497;1132;1746;3165,3166;3220;1846;158;1281;1846,1863;1746,2347;58,59,60,61;889;58;1497;3244;1497;136;1779;58;432;58;1565;1851;1497;1565;158;158;1252;1851;1281;1851;1826;1449;1497;432,542,1740;1215,1497;631;2230;976,977;976,977;976,977;1724;654;1851;1851;1846;1104;631;58;1157;58;2771;910;1497;471;807;2230;58,437;631;1497;1497;976,977;1616;1712;1712;1497;1497;2927;1132;1497;976,977;1497;58,130,502;1846,1863;433;1819;1280;1851;968,2095;3223;584;2589;631;377,788;1851;1502,1503,1504;393;432,1497;1356;1497;692,881;1497;692;1846,1847;891;1851;631;2225;706;-1924;2801;631;631;1851;58,59,60,61;58;1497;1846,1863;1746;1819;1846;1850;1565;1028;1497;821;1851;2192;1846,1863;1497;471;1028;2848;1497;1851;1497;136;58,2678;1497;-3942;631;1851;821;1851;2683;1265;584;1497;130;58;1497;631;631;158,415;1028;1851;1851;1227,1228;692;1851;631;3749;58;542;158;631;1846;58,71;1846;1028;393,1159,1160;58,2256;3701,3702;2296;1067;130;502;887,1028;396;377,788;2086;867;1497;401;1810,1811;1747;58,1565;1557;631;582;1497;815;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;993,994;1846;604;58,71;1497;884;1746;438,502;1095;631;1819;1281;1108;1851;1846;1851;1846;1846;1747;413;1497;1497;1851;393;1851;631;1497;393,1159,1160;158;500,1256;1848;393,1159,1160;2801;1497;976,977;976,977;413;1497;1851;158;1599;922;1747;393;1497;1804;1016;58,59,60,61;1846,1847;58,59,60,61;1281;158;1497;741;3686;1851;1169,3686;1169,3686;1169,3686;2515;1497;447,1504,1552,1553,1554,1555;438;393;2410;1256;3608;393,1159,1160;1471;1748;502,872;1925;58,59;1831;692;1482;1851;1497;3872;58,59,60,61;631;377,788;1281;1810,1811;158;58,59;1819;1851;1028;976,977;968;1844,1846,1847;1846,1863;158;1745;1393;1686;432,759;393;821,1497;1497;2693;487,502,631;2085;58,471,800;1497;1851;3514;1378,1379;1070;1851;1846;1846;158,1123,1846;158,1846;976,977;670,1916,1917;3036;1497;439;1846,1863;377,788;377,788;1846;976,977;376;837;1081;1851;1846;401;1846;692;948;1316;-3096,-3097,-3098,-3099,-3100;3790;290;58,1565,3136;401;650;1497;470,1732,1733;968;662;1497;58;654;631;2240;1497;2801;1674;396,1113;376;1846,1863;158;741,1497;58,59;415,418;158;454;1747;866;1466,1467,1468,1469;58,59;1497;393,1159,1160;471;158;183;1497;58;1851;1851;58,631;241;631;1819;976,977;1135,3592;1502,1503,1504;1819;1583,1677,1678,1679,1680,1681,1682,1683,1684,1685;58,59,60,61;669;452,670,963,1748,2619,2620;58,454,1028;1851;3739,3740;1497;1497;1846,1847;1497,3250;654;1497,1800;58;631;1819;1819;61;1395;344,1104;2166;1819;1851;1819;2222;1848;815;393,1159,1160;631;1846;1135;500;58,59,60,61;98;2041;3059;3311;1497;393,1159,1160;1281;1707;631,1707;432,762;424,542,631;1823;1795;818;158,1695;1269;439,1028,3518;513,1110;58;1747;3869,3915;818;158;976,977;867;1851;500;1851;1497;1749;-1924;1497;1727;631;788;20,-59,365,366,367,368,369,370,-1924;393,1159,1160;408,860;1497;952;1094;433;1746;2570;158;502;1461;692;1846;631;692;1497;1550,3669;631;631;502;1497;413,1851;1215;1392;1281;976,977;631;148,570,3596;821,2443;1795;1819;61;58,59,60,61;1851;1846;447,1452;-1924;1846;1850;1851;1819;1461;58,1565;1404,2180;1846;1947,2948;1846;58;1819;1497;1497;1169;1497;513;393;1810,1811;2453;631;1497;1851;1480;1497;1497;1819;1497;2777;408;885;1851;1851;-136,1370;2634;2634;631;393;2510;1851;1497;535;438;631;976,977;3009;1851;377,788;1497;158;438;1891,1892;1891,1892;-772,1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1461;1795;452,611,631;1497;654;500;158;631;377,788;158;1497;1281;1819;1846;413,1851;827;1851;1819;158;1846;1851;158;1497;1846,1847;976,977;631;1497;2575;1497;1215;3189;1851;2387;1497;447,1808;1497;1007,3186,3187;1016;58,59,60,61;148,155,3955;1483,1497,1581;1281;1497;1497;1281;1281;1281;922;1497;1497;660;1851;377,788;1846;976,977;58,513;1281;502;2179;1717;1846,1847;1746;58,1967,1993;1497;1281;622;1497;2744;631;136,742;580,1079;1497;1846;3667;589;2407;1497;631;1497;1748;1281;968;1958;1132;158;1135,3592;1846;692;1322;1846,1864;1795;2291;968;2192;2917;234,342;1819;1281;3616,3617;2240;2240;837;1565;1256;2536;1497;1851;158;837;3725;1851;1468,1481;1455;1884;542,631;631;136,686;1281;1265;1795;2081;1135,3592;957;1171,1317;631;631;1846,1863;1851;1851;1497;692;1497;1497;58;1851;1343;1565;1565;2149;513;377,788;1497;58,454,1028,1913,1915;454;614,615;1795;1497;1468,1481;1846;945;1805;1497;1798;3200,3201,3202;1497;1819;1851;1497;1848;1846,1848;130;1851;1851;837;3161;1846;1497;1256;438;1846;433;837;2332;1471;1510;130;1819;377,788;58,59,60,61;1846;58;2200,2201;3518;631;1071;58,1028;631;1746;1851;1819;158;158;513;837;158;1497;1851;1846;1497;3706;510;1795;660;58,411,1224;1747;453;3616,3617;452;495;815;631,1028,1497;1135,3592;3103;1846;604;58,1565,3213;1844,1846,1847;2192;1745;759;1851;1846;631;1846;1851;1256;1846;900;1497;631;58,59,60,61;517;1819;502;670;1749;346,347,348;3299;662;1250;2574;1559,1560;542,631;1565;1846;631;2457;1565;1471;584;1851;1497;1497;396;158;692;438;365,366,368,3012;1843;976,977;471;364;3328;1846,1847;976,977;1028;1497;2777;2777;968;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;58,59,60,61;1851;1433;2801;158;631;486;1851;631;630;2832;1497;1497;976,977;1846,1863;1846;2949;631;631;976,977;1281;1281;1281;1846;815;1851;3187;1846,1847;136,508;968;1281;1281;1281;1497;58,59,60,61;2068;1332;1497;1851;2175;1991,1992;1281;1851;1851;486;58,59,60,61;1497;313;1497;2955,2956;1497;1819;815;1380;1281;98,1583,1664,1666,1667,1668,1669,1677,1678,1679,1680,1681,1682,1683,1684,1685;1497;1819;58,59,60,61;1272;1846;1851;447;1846;1497;58,1746;1497;1497;976,977;1605;1458;1819;3514;1088;1281;948;2203,4016,4019;1819;968;132,212;660;1281;1891,1892;1891,1892;2240;1851;837;2000;393,1159,1160;1497;631;413,1851;158;1795;631;502;1466,1504,1596,1597,1598;396;1851;1846;2149;1077;158;396;393,1159,1160;289;2032;1497;1846,1863;393;631;3155;1851;1846;1846;1135,3592;401;1380;1353;1132;130;1846;1846;815,1674;247,251;1851;1851;2322;631,1497;945;1497;502;158;58,1760,1915;815;58;58,59,60,61;424;1851;1795;1891,1892;439;631;158;2801;1819;58,59,60,61,1896;1891,1892;393,1159,1160;1497;2801;1851;158;1819;3616,3617;2683;945;1819;827;1255;3724;1497;815;1851;670,1565;3686;-1527;393,1159,1160;631;298,299;502,517;1819;500;1882,1883;1747;1497;1843;1846,1847;1497;1497;631,943;1497;2374;1891,1892;1891,1892;1891,1892;1891,1892;1497;158;61;1851;1819;58,59,60,61;2948;654;58,513,1747;1497;631,2327;1281;2498;1102,1290;1745;58,59,60,61;741;393;58,59;660;968;1851;1461;1846;58,59,60,61;1819;335,3973;1497;3977;630;58;58,59,60,61;2057;815;692;1380;2465;2928,2929,2930;58,59;1281;158;1565;1497;1846;158;1497;570;1846;415,1851;1851;631;922;3378;1497;58,59,60,61;934;1838,1839,1840,1841,1889;1281;1796;454;1846;1060;58;58,3136;844;844;1497;968;968;1819;815;1846,1863;3687;393,1159,1160;500;130,2834;1819;1891,1892;58,59,60,61;58,59,60,61;434;1461;948;631;631;437;58,59;1795;1497;1497;1452;1846;1819;1851;58,454,1913,1915;1851;1497;1497;1468,1481;158,1257;393,1159,1160;654;1497;1851;1851;1326;2561;1846;1497;815;502,1132;408;158;1851;1851;1497;976,977;1851;1748;1795;3372;898;58,1106,1107;158;2438;58,1749;692;1497;1497;1565,3390;1281;158;1851;432;1497;1497;2825;1747;1565;631;447,1808;1497;548,660;2679;393,1497;1846,1847;405,1819;1846,1847;660;1497;1846;1497;58;2398,2399;2726;58,59,60,61;1851;158;631;487;968;1497;1497;1110;1891,1892;1891,1892;1891,1892;1891,1892;867,1356;158;158;1819;1851;517;3616,3617;631;1497;447,1808;1747;1497;691;58,59,60,61;58,59,60,61;1891,1892;933;58,59,60,61;158;1851;438;158;1746,1747,1748;976,977;1846,1864;1819;58,59,60;1819;815;158;1497;158;1756;1819;2801;2029,2030;1846;1846;1851;3036;1497;158;579;343;58;1891,1892;485;3920,3921;844;3744;968;665;1891,1892;433;1028;1851;1497;2801;1281;58,59;1408;662;1132;631;1461;1851;2021;1846;1278;1699;393;1846;1846,1863;1497;1851;1819;377,788;2307;3347;2821;631;214,215;1851;1851;1747;1745;1851;447,1504,1552,1553,1554,1555;631,2267;1326;401;158;1819;1819;2710;1565,3437,3438,3439,3440,3441;58,59,60,61;1497;1358;3616,3617;447,1808;1380;2498;631;433;1846;1497;2318;1282;1497;130,2514;1269;1042,1043,1044;2117;136;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;1891,1892;170;1846;1497;2145;413,1851;1819;377,692;502;1851;1851;3036;158,3204;654;631;1497;1208;1851;1846,1864;1846,1864;1819;922;1453;630;1891,1892;3335;1749;1846;439;88;1497;1497;837;1497;393;58,2825;508;2021;58,844;631;1846;603;98;1380;393,1159,1160;1497;1810,1811;58,679,680;2267;815;2360;1320;58,71;58,71;1891,1892;1497;662;393,1159,1160;1851;58;1139;1497;1851;1497;1851;1281;393;535;1110,1361,1748,1753;1497;1497;1851;3686;1851;945;1497;158;815;1891,1892;1891,1892;1851;158;159;3884;2201,2204;535;58,59,60,61;1746,1747,1748;1851;3616,3617;1746;3689;526;3036;1215;1891,1892;1749;1135,3592;3265;438;1795;2801;1851;158;1215;1497;413,1851;185,186;1132;1497;2851,2852;2680;1747;1380;401;1819;158;158;1846;1819;1497;1851;1497;339;2701,2702;1891,1892;1497;3616,3617;1851;1497;1968,1969;432;3686;1779;1497;599;1891,1892;447,888;396;1851;741;58,59,60,61;1846;1497;630;815;1846;3574;1497;818;1891,1892;393,1159,1160;1851;58,59,60,61;1851;58,1565,3213;1851;1851;1497;405,1851;378,379,395,396,3999;1135;58;58;1497;1819;1851;2192;1497;1497;380,381;1497;1891,1892;3616,3617;458,486,792,1749;393,1159,1160;1497;1497;408,630;3616,3617;3616,3617;662;3530;130;784;1461;130;631;59;1565;1851;58,1224,1265,1794;638;815;1461;1142;1851;1851;3214;1497;1851;1748;3616,3617;2675;58,59,60,61;393;1416;2981,3193;1497;630,1110;1851;1851;1380;3616,3617;1415;1851;1565;1851;502;3616,3617;1497;3616,3617;1851;1749;2507;1846,1859;1380;3616,3617;1110;158;815;815;58;2086;58,439;3616,3617;631;1002;1497;3618;158;1497;638;1497;1851;88;452,630;1891,1892;155,1663;1851;925;3616,3617;59;1891,1892;513;933;3443;1497;582;438;3616,3617;1851;955;827;1851;631;3616,3617;1851;1497;3616,3617;1497;227,228;58,71;638";
        const arglistRefs = $scriptletArglistRefs$.split(';');
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","68,69","moonfile","^moonfile-[a-z0-9-]+\\.com$","68,69",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","68,69","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","68,69","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","68,69","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","68,69","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","68,69","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","130,1565,2540"];
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
    const $scriptletFunctions$ = /* 57 */
[trustedEditInboundObject,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,jsonlEditXhrResponse,noWindowOpenIf,setConstant,abortCurrentScript,preventXhr,preventSetTimeout,preventFetch,trustedReplaceArgument,removeAttr,trustedOverrideElementMethod,abortOnPropertyRead,trustedReplaceOutboundText,trustedSuppressNativeMethod,preventAddEventListener,abortOnStackTrace,preventSetInterval,adjustSetInterval,zeta_mb58kw52,trustedSetConstant,zeta_movh4xh5,abortOnPropertyWrite,noWebrtc,zeta_8echnktd,zeta_2brklsgs,zeta_djbdt5ns,preventRequestAnimationFrame,noEvalIf,preventBab,trustedPreventFetch,disableNewtabLinks,trustedJsonEditFetchResponse,preventInnerHTML,editObjectOnSetter,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditFetchResponse,preventClipboardWrite,jsonEditXhrResponse,xmlPrune,m3uPrune,trustedPreventXhr,spoofCSS,zeta_j7s0f4ys,alertBuster,preventCanvas,mpegdashPrune,jsonEditFetchRequest,proxyApplyConfig];
    const $scriptletArgs$ = /* 3422 */ ["JSON.stringify","0","[?.attestationRequest][?.context.client.userAgent*=\"channel\"].context.client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","[?.attestationRequest][?.context.client.userAgent*=\"lactmilli\"]+={\"params\":\"8AUB\"}","[?.attestationRequest][?.context.client.userAgent*=\"yahi\"]+={\"params\":\"YAHI\"}","[?.attestationRequest][?.context.client.userAgent*=\"instream\"].playbackContext[?.contentPlaybackContext]+={\"adPlaybackContext\":{\"adType\":\"AD_TYPE_INSTREAM\"}}","[?.attestationRequest][?.context.client.userAgent=/channel|lactmilli|instream/].playbackContext.contentPlaybackContext.lactMilliseconds=\"${now}\"","[?.attestationRequest][?.context.client.userAgent=/adunit|channel|lactmilli|instream|inline|yahi|eafg/].playbackContext.contentPlaybackContext.referer=repl({\"regex\":\"(?:#reloadxhr)?$\",\"replacement\":\"#reloadxhr\"})","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","propsToMatch","/player?","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..data.viewer..nodes.*[?.__typename==\"AdsSideFeedUnit\"]","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..node[?.*.__typename==\"SponsoredData\"]","..nodes.*[?.sponsored_data]",".data[?.category==\"SPONSORED\"].node",".data.viewer.news_feed.edges.*[?.category==\"SPONSORED\"].node","Function.prototype.toString","Node.prototype.insertBefore","Element.prototype.insertAdjacentElement","Element.prototype.append","Element.prototype.prepend","Element.prototype.before","Element.prototype.after","Object.getOwnPropertyDescriptor","XMLHttpRequest.prototype","console.clear","undefined","globalThis","break;case","WebAssembly","atob","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","document.getElementById","json:\"body\"","condition","ad-detection-bait","document.querySelector","-id-","scriptBlocked","false","blocked","testUrls","[]",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","Worker.prototype.postMessage","adblock","4000-","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","Object.prototype.hasRightPartnership","falseFunc","Object.prototype.hasLeftPartnership","Object.prototype.hasTopPartnership","Object.prototype.hasBottomPartnership","document.querySelectorAll","security.js","OffscreenCanvas.prototype.getContext","=== false","Element.prototype.removeChild","/blocked|tick/","/click|load/","/document\\.location|pop\\.|exo|cookie|\\.php/","/ok_|pemsrv\\.com/","/^https:\\/\\/s\\.pemsrv\\.com.+/","window.location.href","%22vt%22","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","Object.prototype.adService.initialize","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","pp_adblock_is_off","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","WP.prebid","onLoad","History","/(^(?!.*(Function|HTMLDocument).*))/",".call(null)","10","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","document.createElement","break;case $.","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","Object.prototype.renderDirect):matches-path(/\\/(?:weather\\/|pogoda\\/|hava\\/)/","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","freestar.newAdSlots","String.prototype.allReplace","executaGoogleAnalytics3","initJWPlayerMux","initJWPlayerMux.utils","initJWPlayerMux.utils.now","ambossAnalytics","ambossAnalytics.getUserAttribution","dataset.ready","script[src^=\"https://www.googletagmanager.com/gtag/js?id=\"]","Osano","Osano.cm","Osano.cm.addEventListener","Osano.cm.removeEventListener","pa.getVisitorId","googletag.setConfig","RISKX","RISKX.go","RISKX.setSid","Sentry.configureScope","baMet.register","Object.prototype.componentInScreen","HSBC","json:{\"SITE\":{},\"DCS\":{},\"PAGE\":{}}","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber","..node[?.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","adblock_added","setTimeout","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","adcashMacros","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","decodeURIComponent","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","shift","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.write","redirect","4000","inlineScript","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","btoa","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","tick","registerLazyExo","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","AdservingModule","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","error","[src]","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","adblockcheck","!bergblock","overlayBtn","adBlockRunning","Date","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.protect_block","flashvars.video_click_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","alert","check","isBlanketFound","showModal","myaabpfun","sec","_wm","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","Pub2a","/adsbygoogle|initDetection/","block","console","send","ab_cl","V4ss","#clickfakeplayer","popunders","visibility","sadbl","aclib","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","MessageChannel","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","jwplayer.utils.Timer","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","adBlock","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","LIDetector","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion.homad.enabled","getHomadConfig","aud.springserve.com","<VAST version=\"3.0\"></VAST>","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","secondsLeft","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","tid","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","tp-time","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]","disabled",".btn-primary","focusOut","googletagmanager","suaads","/window\\.location\\.href|n/","8000","json:\"drall_Suaads_annersads_JS__randomAds\"","/randomAds|div-gpt-ad|divAdsInit/","json:\"ADs-1\"","json:\"click\"","visibilitychange","window.addEventListener","/visibilitychange|blur|pageshow|keydown|beforeunload|pagehide/","/\\$\\('|ai-close/","app_vars.please_disable_adblock","/scorecardresearch\\.com|outbrain\\.com|taboola\\.com|criteo\\.net|rubiconproject\\.com|adform\\.net|casalemedia\\.com|adservice\\.google\\.com/","shouldOpenPopUp","/blur|focus/","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","remainingSeconds","mode:no-cors","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","http","Element.prototype.closest","rel","chp_ad","document.documentElement.lang.toLowerCase","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","localStorage._d","blank","google_srt","json:0.61234","vizier","checkAdBlock","xnjThB","googlesyn","displayAdBlockerMessage","pastepc","checkMockObjects","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","isTabActive","HTMLAnchorElement.prototype.click","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","clicked","charCodeAt","decodeURIComponent(escape","clicksCount",".data.isAdsEnabled=false","/api/files","document.createTreeWalker","json:{\"acceptNode\": \"function() { return NodeFilter.FILTER_REJECT; }\"}","if","prevent","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper",".downloadbtn","zigi_tag_id","self.Math","setCookie","advertisement3","start","AdLink","!buzzheavier.com","removeChild",".href","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","/seconds--|timeLeft--/","json:\"main\"","/div-gpt-ad-dgking|\\.GoogleActiveViewElement/","/div-gpt-ad-|\\.adsbygoogle/","json:\"container\"","adblock_detected","/pub\\.clickadu|bing\\.com/","a","\"/chp_?ad/\"","/blocked|null/","remaining--","json:\"header\"","/ad-chk|aads-frame/","!/document|window|const|var|let/","RegExp.prototype.exec.constructor","\"+\"","Function.prototype.constructor","anonymous@https","Document.prototype.addEventListener.call","HTMLElement.prototype.click.call","HTMLElement.prototype.click.apply","/document.createElement|window.open/",".cfd","script[data-domain=","document.body.appendChild(s)","document.head||","push","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","clearTimeout","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","document.body.appendChild(s","no-referrer-when-downgrade","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","appendTo:","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","flashvars","v2:$./^adv_/","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain",".ads_mode=\"0\"","/embed/settings",".ads_mode_dl=\"0\"","$+={\"ads_suppressed\":true}","/inlineScript|stackDepth:1/","Date.prototype.toISOString","wpadmngr.com","adserverDomain","AtcshAltNm",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","Document.prototype.querySelector","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral",".EnableAdmiral=false",".ShowAds=false","gnt.x.uam","interactive","gnt.u.z","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/admiral/","runtimeConfig.AM_PATH","CACHE",".indexOf","/runtime-config","__disableAds","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","..Admiral.isEnabled=false","..admiral=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","Element.prototype.setAttribute","/error-report|new Promise|;await new|:\\[?window|&&window,|void 0\\]|location\\.href|void 0\\|\\|window|,window,|void 0,window|,window\\]|\\)\\.join\\(String\\.fromCharCode|adShieldError/","script[id][onerror]","asap stay","loadShield","Range.prototype.createContextualFragment","json:\"<script></script>\"","html-load.com",".scriptLoader.*[?.id==\"ad_stack_split_provider\"]","adLight","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/content-loader\\.com|css-load\\.com|html-load\\.com/","asap","quitAfter","json:\"setTimeout((()=>{if(!location.pathname.startsWith('/game'))return;const t=document.getElementById('question-label');t&&(window.animation=lottie.loadAnimation({container:t,renderer:'svg',loop:!0,autoplay:!1,path:'/assets/animationsLottielab/gameDots.json'}))}),1e3);\"","__cfRLUnblockHandlers","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","features.ad02 features.adshield","AHE.is_member","AppBootstrapData.config.adshieldAdblockRecovery","AppBootstrapData.config.adshieldNativeAdRecovery","AppBootstrapData.__initializeFeatures__.adshieldAdblockRecovery.enabled","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","..adshieldAdblockRecovery.enabled=false","/error-report|nowprocket/","loadRecoveryScripts","autoRecovery","Object.prototype._adShieldLoaded",".featureFlags.*[?.featureName==\"AdShield\"]","/configs","Object.prototype.htmlLoadScriptService.loadScript","Object.prototype.removeAdScripts","HTMLScriptElement.prototype.onload","..AdShield.isEnabled=false","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","__aaZoneid","DoodPop",".check=false","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","#downloadvideo","ads playerAds","..allowAdblock=true","displayLayer","adId","pop_init","adsbyjuicy","np.detect","/^ms(hta|iexec)(\\.exe)? |^(bash <<<|curl -kfsSL) \\$\\(echo .+? base64 -d\\b|^cmd \\/c .*?\\bcurl .+?(\\.exe|\\.bat)\\b|^cmd .*?\\bfor \\/f .*?\\bdelims .*?\\bpow |(^|\\\\)powershell(\\.exe)? .*?-w(indowStyle)? h(idden)?\\b|(^|\\\\)powershell(\\.exe)? .*?-w[a-z]* m[a-z]* |(^|\\\\)powershell(\\.exe)? .*?-NoP\\b|(^|\\\\)powershell(\\.exe)? .*?-e(xecution)?p(olicy)? b(ypass)?\\b|(^|\\\\)powershell(\\.exe)? .*?-e(xecution)?p(olicy)? u(nrestricted)?\\b|(^|\\\\)powershell(\\.exe)? .*?\\biex\\(|(^|\\\\)powershell(\\.exe)? .*?Invoke-Expression|(^|\\\\)powershell.+?Invoke-WebRequest|(^|\\\\)powershell.+?-UseBasicParsing|^cmd .*?\\/c .+? -nop .+? iex\\b|^(cmd|powershell)\\b.+?recaptcha|^(cmd|powershell)\\b.+?#(Verification|     )|^(cmd|powershell)\\b.+?     #|^osascript .+?\\bcurl http|^curl -s\\b.+?\\| (bash|sh|zsh)\\b|^\\/bin\\/(bash|sh|zsh) -c\\b.+?\\bcurl|^bash -c\\b.+?\\$\\(curl|^python3? -c\\b.+?\\b(exec|urllib|subprocess)\\b|^echo .+?base64 .+?\\b(bash|osascript|z?sh)\\b|openssl base64 -d|^curl\\b .+?chmod \\+x.+?&&|^(bash|sh|osascript)\\b.+?recaptcha|^(bash|sh|osascript)\\b.+?#(Verification|     )|^(bash|sh|osascript)\\b.+?     #|^wget .+?\\| (bash|sh)\\b|^curl\\b.+?-o\\b.+?\\/tmp\\/.+?&&|^nc .+?-e \\/bin\\/(bash|sh)\\b|^\\/tmp\\/.+?chmod \\+x.+?&&|^wget -q.+?\\.(sh|py|bin|elf)\\b|^cmd .+?\\bcertutil .+?\\b(\\.exe|\\.bat)\\b|(^|\\\\)powershell(\\.exe)? .+?\\birm .+?\\.[a-z]+\\/.+?powershell|\\bpcalua(\\.exe)? .*?\\b(curl|powershell|saps|cmd)\\b|^cmd .+?\\bcmdkey .+?\\bschtasks|^Invoke-Command .+?Base64String|^c(onhost|md) .*?--headless |^iex\\(i(rm|wr) |^\\(?irm .+?\\biex\\b|^%COMSPEC% .*?\\bstart .*?\\/min\\b|^cmd .*?\\/c .*?%TEMP%.*?\\.bat\\b|\\bconvert\\b.*?\\$env:ComSpec\\b|^<#Verification|^Invoke-WebRequest .+?\\bwscript(\\.exe)?\\b/msi","domAlert","Beware, uBlock Origin blocked a potential ClickFix attack: ${text}","excludeMatches","/Maintainer|Contributor|^\\{|^http|^(git|import|require|use) /i","Beware. uBlock Origin blocked a potential ClickFix attack: ${text}","dataset.zone","length:40000-60000","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","api/v1/detail","xmxalr","HTMLIFrameElement.prototype.contentWindow","reklama-flash-body","/scoreUrl|pingUrl/","appPageData.appAds","appPageData.appAdsHandles","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.ad.adBlockerDetectorEnabled","..adBlockerDetectorEnabled=false","history.replaceState","data.[].relationships.advert data.[].relationships.vast","offers","/#EXT-X-DISCONTINUITY\\n(?:#EXTINF:.*,\\n.+?adType=preroll[\\s\\S]+?)(?=#EXT-X-DISCONTINUITY)/gm","/.*\\.m3u8/","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json",".*[?.adId]","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","xml","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best","pop_","Array.isArray","POP_URL","repl:/\"popactive\":true/\"popactive\":false/","[style*=\"z-index\"]","remove()","(!1)","backRedirect","adv_pre_duration","adv_post_duration",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","data.header_script data.footer_script data.direct_link_ads data.direct_link_ads_vip_1 data.direct_link_ads_vip_2 data.direct_link_ads_play_vip_2 data.direct_link_ads_zoom_vip_2","/config","createAgeModal","Object[_0x","adsPlayer","this","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","a[target=\"_blank\"][rel*=\"sponsored\"]","shopeeLinks","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker",".ready","/'shift'|break;/","xpv","xpv.v",".clientHeight===0","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","clientSide.adbDetect","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","Pop","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","!vidmoly","anchor.href","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]]/@mediaPresentationDuration | //*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]]//*[name()=\"Period\"]/@start | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),\"emea-free\")]])","ssaiInfo","data.attributes.ssaiInfo","/videoPlaybackInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","/atob|overlay/","vads","doSecondPop","a[href][onclick^=\"getFullStory\"]","!newdmn","parentNode.removeChild","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","ai_run_scripts","clearInterval(i)","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","__spotSettings","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","xv.conf.dyn.ads","xv.conf.dyn.excld","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"https:\")]])","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","function","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","contador","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","detector_launch","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","/(?=^(?!.*(http)))/","()=>","$onet","adsRedirectPopups","canGetAds","method:/head/i","Storage.prototype.setItem","bannerDismissed","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","fallback.ssaiInfo manifest.url","fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])][not(.//*[name()=\"AdaptationSet\"][@contentType=\"text\"])])","/dash.mpd","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","arrvast","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","Object.prototype.rekids","Object.prototype.gafSlot","Object.prototype.advViewability","WP.inline","/getComputedStyle[\\s\\S]*?style\\.display=\"none\"[\\s\\S]*?styleBlocked[\\s\\S]*?detected/","__headpayload","WP","r https","WP.gaf.loadBunch","Object.prototype.loadBunch","Object.prototype.bodyCode","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1",".access=true","/no_ads/config","/zefoy\\.com\\S+:3:1/","/getComputedStyle|bait/","AController_3","json:\"div\"","ins",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST",".props.pageProps.page.blocks.*[?..resource^=\"nc-ad\"]","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","searchCount","empire.pop","empire.direct","empire.directHideAds","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","ssaiInfo fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"_ad\") and contains(text(),\"creative\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","criteo","HTMLImageElement.prototype.onerror","++","\"flashtalking\"","war:32x32.png","triggered","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","powerAPITag","rodo.checkIsDidomiConsent","newAdblockBoardDisplayed","protection","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","window.ts","/googlesyndication|googima\\.js|imasdk/","__brn_private_mode","download_click","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick",".Playlist.ContentBreaks.*.TimeCode=\"99:59:59:999\"","/playlist","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","Node.prototype.removeChild","/^\\[object HTMLImageElement\\]$/","/emojis8\\.js:/","/attachonce == false/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","tmDetectAdBlocker","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","data_source_modules.*.module_data.search_response.products.[-].sponsored_ad.ad_source","/pages/slp","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","sandDetect",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","/#EXTINF:[^\\n]+\\n[^\\n]+?\\/preroll\\/[^\\n]+/gms","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod",".streams.*.adUnits=[]","/manifest/video","/#EXTINF[^\\n]+\\n[^\\n]+?segment[^\\n]+/gms","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","a[href][onclick^=\"window.open\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","/ethicalads\\.io|nitropay\\.com/","HTMLImageElement.prototype.onload","img","Image.prototype.complete","2d","Element.prototype.getBoundingClientRect",".length","HTMLImageElement.prototype.naturalWidth","240","#artifactFileContent","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","playerEnhancedConfig.run","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","sentry","showTav","document['\\x","showADBOverlay","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","/inter","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","grecaptcha.ready","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","moa_id","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","__videoPlayerData.popunder","jsc.mgid.com","movie.advertising.ad_server","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","cloudflareinsights","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","CAD.pageblockerWarning","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","location.reload","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","HTMLScriptElement.prototype.setAttribute","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","Array.prototype.includes","adblockTrigger","20","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","rot_url","pop_type","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","google-ca-pub-4459622307906677","wbDeadHinweis","()=>{var c=Kb","0.2","__venatusLoaderInit","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","googlesyndication.com","repl:/blank/self/","stoCazzo","fetchAdsScript","_insertDirectAdLink","/doubleclick|atob|return new Promise|aHR0c/","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","custom_ads","/settings","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","/googletagmanager|ip-api/","&&",".ads={\"movie\":false,\"series\":false,\"episode\":false,\"comments\":false,\"preroll\":false}",".preroll.ad",".preroll.countdownSec=0","()=>j(e=>e-1)","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/createElement|addEventListener|clientHeight/","uberad_mode",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","DMP_ENABLE_ADS","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP",".rules.*[?.name==\"Ad Blocker\"]","/access/rules","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","link.click","document.body.style.overflow","fallback","!addons.mozilla.org","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","/googlesyndication\\.com|offsetHeight/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","/Werbeblocker|refresh\\\\/","cwAdblockDisabled","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","pbjs.libLoaded",".features.pv=false","/playerConfig","flashvars.adv_pre_url","()&&","Object.prototype.adBlockerPop","BACK","wgAffiliateEnabled","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","vglnk","clkUnder","adsArr","data.getFinalClickoutUrl data.sendSraBid","data.getAd","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","steamBanner clickAds clickAdsUa clickAdsRu pushNotification","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","En(e-1)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","adClickThrough","..showAds=false","ad_blocker_detector","._$",".result.items.*[?.content*=\"'+'\"]","/comments","img[onerror]","KAA.state.revspot","enforceVideoShield","/initPops|popLite|popunder/","__US_CONFIG__.ads.adblock_measure_enabled","__US_CONFIG__.ads.adblock_wall_enabled","__US_CONFIG__.ads.urls","[?.type==\"ads\"].visibility.status=\"hidden\"","..suppress_ads=true","messages.*.ads messages.*.renderedAdsHtml","TextDecoder.prototype.decode","/<template data-assistant-ads-html=\"\"><aside aria-label.+?<\\/aside><\\/template>/","/<template for=\"conversation-partial-control\" data-web-mobile-dpu-apply=\"append\"><span( hidden)? data-conversation-control=\"assistant-ads\".+?<\\/(aside|div)><\\/template><\\/span><\\/template>/","shouldRun","ad-ipd","smartclip","window.getComputedStyle","maddenwiped","/redirect.php?","*.*","/api/banners","checkBanners","__SSR_CONFIG__.monkey","__revCatchInitialized","json:\"none\"","ab.dt","/^[a-zA-Z]{15}$/","data.initPlaybackSession.adScenarios data.initPlaybackSession.adExperience.adExperienceTypes",".data.initPlaybackSession.adExperience.adsEnabled=false","ConFig.config.ads","json:{\"pause\":{\"state\":{}}}","Object.prototype.adblockPlugin","initializeNtvxSheet","fireAd","juicy_tags","!youtu","injectAd",".isAdFree=true","resumeGame","/admaven|adspyglass/","__tcfapi","ezRewardedAds.requestAndShow","timeout","/eeea5e31|new\\s+Function/","timeLeft--","source.ads","/player",".props.pageProps.globalData.publisherFeatureFlags.enableAdBlockDetection=false",".props.pageProps.globalData.publisherFeatureFlags.enableHardAdBlockDetection=false",".adsEnabled=false","/access","adsterraSmartLink adsterraSmartLink2","/^[a-zA-Z]{12}$/","/popup/i","length:1000-1010","/_0x|window\\.open/","Advert","popup-dialog-id","utilAds","/^a$/","/ADBLOCK|ADSENSE/","pubads.g.doubleclick.net","sponsor ad_provider","api.openlua.cloud","script-error","Element.prototype.remove","probe","HTMLElement.prototype.remove","/adsbygoogle|google-analytics|ads-twitter|doubleclick/","String.prototype.replace","decideForPlacement","=void 0","/\\{[a-z]+\\(\\)\\}/",".value||",".value&&","gsmAccessGate","bf-ad.net","protect","poseidonAdBootstrap.freestarReady","cue_points","/playback","..ads_enabled=\"0\"","data.promotions","__kbAdBait","OzB.adb","/offsetHeight|getComputedStyle/","Object.prototype.special","foxizParams.adDetectorMethod","String.prototype.startsWith","/^\\/contact-us\\/$/","()=>e()","sponsored_ads","tag.min.js","..playGateQueue","playerHeadScriptSnippets","/api/config","shaman",".stories.*[?.storyType==\"ad\"]","cykloStories","innerHTML.length:0","isBlocked","/adblock|Error|getComputedStyle/","/click|pointerup/","handleUserAction",".bannerConfig..advertise.*","/\"features\":\\[/","\"features\":[\"ads-shutdown-nativeAds\",\"ads-shutdown-displayAds\",","/\\/owa\\/startupdata\\.ashx/","client=ca-pub-",".pub-slot-wrapper","top","0px","$..durationInSeconds=0","-ssai-vod-","Period:has(> EventStream[schemeIdUri=\"urn:sva:advertising-wg:ad-id-signaling\"])","/dash",".showModal","triggerPopunder","/getComputedStyle|offsetHeight/",".innerText","ads-prebid",".data.*[?.hasAd==true]","/card/fill","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","/#rcmrclid=[a-zA-Z0-9]+/g","rcm.rambler.ru","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","method:POST body:/content_view|impression|page_view/",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","linkfire.tracking","method:POST body:/pageview|engagement/","body:pageview method:POST","svc.webex.com/metrics","/i/api/1.1/flow/viewer.json","/i/api/1.1/flow/timeline.json","{\"skipToString\":true}","/i/api/1.1/graphql/viewer_context.json","faro.civitai.com","method:POST body:/\"track\"|adblock/","method:POST body:tracker","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/","igniteseurope.com/stats/","litix.io","/hpyjmp|marzaent/","brightline.tv",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive","json:\"https://\"","data:video/mp4",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_id=1","/track-playback",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_url=\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\""];
    const $scriptletArglists$ = /* 4024 */ ";0,0,1,2;0,0,1,3;0,0,1,4;0,0,1,5;0,0,1,6;0,0,1,7;1,8,9,10;2,11,12,13,14;2,15,12,13,16;3,11,12,13,17;4,18,19,20;4,21,12,20;4,22,23,17;5,18,19,24;5,25,19,24;5,25,19,26;6,27,28;6,27,29;6,27,30;7,31;5,25,19,32;7,33;3,34,12,13,35;8,36;7,37;8,38;8,39;9,40,13,35;9,38,13,35;9,41,13,35;6,27,42;6,43,30;6,43,42;6,44,30;6,44,42;6,45,30;6,45,42;6,46,30;6,46,42;6,47,30;6,47,42;6,48,30;6,48,42;6,27,49;6,27,50;6,43,49;6,43,50;6,48,49;6,48,50;6,45,49;6,45,50;6,47,49;6,47,50;6,44,49;6,44,50;6,46,49;6,46,50;10;11,51,52;12,53,54;12,55,56;13,57;13,58,59;14,60,61;13,62,63;13,64;13,65;10,66;12,67,68;11,69,52;12,70,71;15,72,73;14,74,75;14,76,75;13,77;16,78,1,79,80,81;16,82,1,79,80,83;11,84,85;11,86,85;11,87,88;14,89;13,90;17,91,92,93;15,94,12,12,95,96;16,97,1,98,80,99;18,100,101;19,102;14,103;14,12,104;15,105,106;16,107,1,12,80,108;15,109,110;20,111,112,113,80,114;16,111,1,115,80,116;16,117,1,115,80,116;15,118,119,120;14,121;11,122,52;15,123,124;21,125,126,127;22,128,129;11,130,131;11,132,131;11,133,131;11,134,131;23,135,136;11,137,52;24,138;23,139,140;22,141,142;10,143;20,56,144,145;15,146;19,147;3,148,12,13,149;11,150,151;19,152;1,153;11,154,151;15,155,156;13,155,156;11,157,151;11,158,159;1,160,61;11,161,159;11,162,151;17,163,164;11,165,166;7,167;15,168;11,169,151;11,170,171;11,172,151;13,173;11,174,159;25;11,175,151;11,176,151;11,177,151;11,178,151;11,179,151;11,180,171;11,181,151;11,182,151;15,183;24,184;15,185;15,186;1,187,188;17,189,190;17,191,192,93;12,193;11,194,12;13,195;13,186;23,196,197;23,198,199;14,200,201;15,202;11,203,171;11,204,171;11,205,171;25,206,12,207;13,208;11,209,171;13,210;11,211,151;13,202;11,212,151;11,213,63;11,214,171;11,215,171;1,216,217,10;1,218,219,10;11,220,88;11,221,151;13,222;11,223,151;11,224,151;11,225,151;11,226,171;11,227,151;13,228;19,229;11,230,151;11,231,151;11,232,151;11,233,171;11,234,63;12,235,236;11,237,171;11,238,151;11,239,171;11,240,151;11,241,12;19,242;11,243,171;11,244,151;11,245,171;11,246,151;11,247,151;11,248,171;11,249,151;11,250,151;11,251,171;11,252,171;11,253,171;11,254,171;11,255,171;11,256,171;11,257,151;11,258,151;1,259,219;11,260,171;13,261;25,262,188;26;11,263,171;11,264,151;22,265,266;11,267,171;11,268,151;11,269,151;11,270,151;1,271,272;1,273,188;11,274,171;11,275,151;11,276,171;11,277,151;16,82,1,278,80,279;11,280,52;11,281,63;11,282,171;11,283,151;11,284,171;11,285,88;11,286,171;11,287,151;11,288,151;11,289,151;11,290,171;11,291,151;11,292,151;11,293,171;11,294,88;11,295,171;11,296,151;11,297,151;11,298,151;11,299,151;11,300,171;11,301,151;1,302,219,10;11,303,171;11,304,12;11,305,171;11,306,151;11,307,151;13,308;11,309,171;11,310,151;11,311,171;11,312,151;11,313,151;11,314,171;11,315,151;11,316,151;11,317,171;11,318,151;11,319,151;11,320,151;11,321,171;11,322,151;1,323,188,10;1,324,219,10;11,325,151;15,195;1,326,188,10;11,327,171;11,328,151;15,329;1,187,330,10;1,187,331,10;11,332,151;14,333;11,334,171;11,335,151;11,336,171;13,337;11,338,151;11,339,171;11,340,151;11,341,171;11,342,151;11,343,171;11,344,151;11,345,171;11,346,151;11,347,151;27,348,349;11,350,85;1,8,272,10;1,351,352,10;11,353,171;11,354,151;11,355,151;1,356,188,10;13,357;11,358,171;11,359,171;11,360,151;11,361,151;11,362,171;11,363,151;11,364,151;11,365,85;11,366,151;11,367,151;11,368,171;11,369,151;11,370,151;11,371,52;11,372,151;11,373,151;11,374,151;11,375,151;22,265,12,376,377;11,378,171;11,379,151;11,380,171;11,381,151;11,382,171;11,383,151;11,384,63;16,385,386,387,80,388;11,389,171;11,390,151;11,391,151;11,392,63;11,393,85;11,394,151;11,395,159;11,396,386;11,397,151;11,398,171;11,399,171;11,400,151;11,401,171;11,402,151;22,128,403,376,404;11,405,171;11,406,171;11,407,151;11,408,151;11,409,151;11,410,151;11,411,171;11,412,151;11,413,151;11,414,151;11,415,151;11,416,151;27,417,418;11,419,52;11,420,52;11,421,52;11,422,52;7,423;2,424,12,13,425;22,128,426;24,427,61;7,428,429;22,128,430;24,431,432;15,433;28;11,434,1;15,435;11,436,12;24,437;19,438;7,439;4,440,171,441;4,442,171,441;4,443,171,441;7,444,445;7,446;7,447;3,448,12,13,441;8,449;9,449,13,35;19,450;19,451;22,12,437;14,437;11,452,166;12,453,454;12,455;14,456;14,457;19,458;16,30,1,459,80,460;1,12,432;19,461;29,462;11,463,52;30;19,464;12,465;15,466;22,265,467;29,468;12,469,461;19,470;19,471;19,472;29,473;19,474;22,265,475;22,128,476;14,477,478;19,479;19,480;29,481;13,482;11,483,151;12,82,484;12,70,485;1,486,188;19,487;19,465;22,128,488;19,489;19,490;12,491,492;19,493;23,494,495;31;12,469,496;29,465;29,497;19,498;19,499;22,128,500;22,128,501;13,168;11,502,63;11,503,151;15,504;12,469,505;12,506,507;19,508;19,509;12,469,510;29,511;29,512;12,513,514;19,515;22,12,486;12,469,516;22,12,517;12,518,519;19,520;14,492;12,235,492;29,509;19,455;12,453,521;19,522;19,523;29,524;29,525;12,78,526;1,527,528;23,488,529;17,530;19,531;22,532,533;19,534;12,469,535;12,469,536;12,469,52;19,537;19,538;11,539,85;19,506;12,488,465;19,540;19,541;19,542;11,543,12;11,544,85;29,545;11,546,63;29,547;29,548;29,549;11,550,63;19,551;12,469,517;19,69;29,552;19,235;17,553,554,555;32;11,556,159;1;29,557;22,12,465;19,558;11,559,85;19,560;33;12,522;19,561;12,562,563;29,564;24,565;12,469,566;25,567;19,568;19,569;29,570;14,571;11,538,63;19,572;14,573;19,574;11,575,151;11,576,63;29,577;22,265,578;22,579,580;12,235,581;29,582;12,70,583;11,51,159;11,584,12;11,585,12;11,586,386;22,587;14,588;19,589;14,590,591;11,592,63;19,593;22,12,594;12,469,595;11,596,12;19,597;23,438,598;22,128,599;34,600;22,601;23,235,602;14,603,478;11,604,151;19,605;11,606,151;11,607,166;23,82,608;1,609,610;1,611,478,10;11,612,63;14,613,1;11,614,151;11,53,166;19,615;11,103,85;12,616,496;11,617,63;12,453,618;29,619;11,620,131;22,12,621;19,622;14,623,478;12,491,478;14,624,625;19,626;12,56,507;11,627,63;12,235,628;24,486;22,12,629;19,630;29,631;11,632,85;19,633;12,634;12,56,635;12,636,637;19,51;22,638,639;14,640;19,641;19,642;35,643;19,644;19,645;19,646;11,647,151;12,78,52;11,648,151;29,649;1,650;25,651;14,82,219;19,652;19,653;19,654;12,518,655;29,656;29,657;11,658,85;14,659,660;11,661,63;11,662,85;25,663,664;12,487,103;22,128,665;25,666,591;29,667;29,522;19,668;22,265,639;19,669;11,670,85;22,128,591;12,135,580;12,56;19,671;12,672,673;29,674;22,128,437;12,453,675;19,676;11,677,85;19,617;14,135,478;12,506,56;19,678;29,679;14,680;14,681;19,547;35,522;11,682,12;14,518,1;22,683,684;22,12,640;12,453,568;12,568,685;19,686;19,687;19,688;11,689,63;11,51,151;14,659,591;19,690;22,128,659;22,691,692;12,693,530;29,694;17,695,696;14,697,219;12,698,699;11,700,85;10,629;19,103;12,701;22,12,702;19,703;11,562,63;22,704,705;29,706;14,707,708;12,617;12,491,709;15,710;12,711,712;14,713,591;22,128,714;12,469,715;11,455,63;14,716;22,12,717;14,717;22,718,12,376,719;12,469,457;29,69;14,720,272;22,721,722;14,723,61;12,491,82;14,724,591;10,725;12,453,726;10,727;11,728,171;11,729,12;19,730;29,731;12,78,103;11,732,151;19,733;25,734,591;19,735;11,736,85;13,737;14,738;1,739,188,207;11,103,151;11,740,12;7,188,741;10,12,201;12,30,56;12,568;29,742;13,743;11,744,52;12,469,745;11,746,85;11,538,151;19,747;14,713,748;14,749;19,750;22,721,751;19,752;13,753;11,754,151;19,755;12,488,568;22,638,756;11,757,63;10,758;12,506,759;19,468;15,760;11,761,85;19,762;12,78,763;13,764;11,765,151;22,12,766;29,767;14,768,272;12,469,769;19,770;25,12,771;19,772;25,12,12,1;14,773;12,78,774;13,775;12,776,527;12,469,776;19,777;23,726,778;22,532,779;22,721,780;12,569,781;19,782;22,532,486;12,491,783;19,784;29,785;14,486,591;19,786;12,518,235;29,568;17,787,788;12,789;12,56,506;12,488;12,385,790;29,507;17,791,792;19,793;19,726;24,794,478;14,273,795;12,469,796;19,797;11,568,166;19,798;22,799,629;11,800,63;19,577;19,801;29,802;17,803,804;25,805,188;11,806,85;11,807,151;22,265,808;14,809,61;12,577;19,810;22,128,811;12,812;11,813,52;19,814;12,469,465;22,128,815;14,517,219;14,816,817;13,818;29,806;14,819,1;25,820;12,78,821;12,822,823;11,824,85;19,825;19,826;19,827;14,828,478;15,273;11,829,85;29,830;14,831;24,832,478;29,833;14,486;11,834,85;10,835,201;12,78,836;29,837;11,56,151;22,12,838;19,839;11,840,151;14,841,386;11,842,151;12,78,273;11,843,151;13,760;22,721,844;12,513,507;12,385,845;19,846;1,847,528;19,848;19,631;12,469,849;11,103,386;11,850,386;14,851;17,852;29,853;7,854,855;12,856,779;14,469;14,857,478;29,641;29,858;14,809;12,78,859;11,860,1;11,273,63;29,861;22,265,862;19,863;12,864,643;11,865,63;29,866;14,437,1;22,12,867;14,868;11,869,151;12,453,870;11,534,386;12,491,871;12,491,872;29,873;12,569,871;12,70,874;19,875;23,513,876;14,877,878;24,879;17,695,880;29,881;12,235,882;14,433;12,453,883;22,265,486;11,884,85;15,168,760;19,840;14,885,61;19,886;19,887;19,888;14,517;19,889;29,890;25,12,12,10;11,891,159;12,892;12,488,530;19,893;11,894,63;23,895,529;11,896,12;11,897,52;11,534,85;14,809,432;19,898;12,78,899;11,900,63;12,78,901;12,78,902;14,903,591;14,904,478;19,905;29,906;12,469,907;12,469,908;12,469,899;14,900;12,78,909;12,469,910;12,78,911;29,912;15,186,119,120;14,166,528;22,128,913;22,128,914;12,518,659;14,713,352;14,915,272;25,860;11,916,1;19,917;14,918,352;14,713,217;22,265,756;10,919;29,506;19,920;11,921,85;12,469,103;15,922;14,923;22,924,925;14,926;11,927,151;12,469,928;14,713,478;12,235,929;12,513,56;11,930,63;29,931;1,932;29,933;12,693,581;29,934;11,935,85;11,69,151;11,936,151;14,726,352;14,496;29,937;14,938;11,939,151;14,940,591;11,941,63;29,935;22,128,942;24,713,219;19,943;19,944;22,945,946;29,947;19,948;23,235,529;17,530,949;1,603;29,950;11,951,63;12,494,635;12,469,952;24,953,954;11,955,12;19,507;12,469,956;11,912,63;11,957,63;14,958;13,273;14,959;12,822,265;12,78,960;12,184,699;19,961;10,962,1;11,963,63;11,698,63;25,651,188;11,964,85;22,532,965;14,966,664;11,967,85;14,968;1,12,12,207;14,969,61;14,970,432;22,265,216;19,583;11,971,1;11,830,151;19,972;25,650;14,973;25,12,12,207;11,974,1;22,265,629;19,975;19,976;12,69;12,469,977;10,978;19,513;12,979,236;12,636,766;25,980,478;29,981;22,982,766;11,983,151;12,67,899;11,984,1;22,265,985;10,103,386,986;15,987;22,265;11,988,85;12,989;12,990;12,991;12,992;22,721,993;19,994;14,995,386;10,996;12,853;19,997;10,998;11,999,151;19,1000;19,1001;14,1002;11,1003,151;24,1004,478;22,638,1005;11,1006,85;19,226;12,453,779;12,726,1007;29,1008;11,517,85;19,1009;12,822,1010;19,488;11,1011,12;11,1012,12;11,1013,85;23,56,529;19,906;14,1014;12,78,1015;12,56,631;12,1016,486;14,1017;13,1018;13,1019;14,960,591;23,70,529;19,1020;22,721,1021;14,1021;12,469,774;14,895,478;11,1022,1;11,1023,63;11,1024,63;11,1025,85;14,103,1026;22,1027;19,1028;14,1029;14,166;12,235,1030;12,491,1031;19,1032;19,1033;19,1034;12,636,640;29,1035;11,1036,131;19,1037;12,235,1038;12,70,1039;19,1040;11,1041,63;11,1042,63;36;11,1043,166;23,78,1044;11,1045,63;11,1046,85;1,603,478,10;29,1047;19,779;19,1048;22,12,1049;14,437,625;12,78,1050;12,235,1051;12,78,1052;29,1053;19,911;12,822,659;10,466,386;19,1054;17,695,1055;19,1056;22,466,766;24,1057,478;14,1058;12,385,54;19,1059;11,1060,85;11,1061,85;14,1062;19,557;19,1063;22,128,1064;22,1065,486;19,1066;11,1067,63;12,526,788;19,1068;19,1069;11,1034,151;19,1070;35,1071;19,1072;29,1073;11,1074,63;19,1075;29,1076;11,1077,386;35,273;17,1078,1079;12,838,874;12,1030,874;29,1080;11,69,85;14,1081;10,273;11,1082,386;19,1083;29,1084;14,1085;11,1086,63;12,568,695;19,1087;12,1088;12,822,1089;11,1090,159;12,693,1091;12,67,1092;14,1093;15,1094;12,453,52;14,1095;29,1096;29,1097;22,721,1098;29,1099;12,469,870;12,1100,960;12,235,960;19,1101;12,78,1102;10,1103,201,986;29,103;11,1104,63;29,1105;22,1106,1107;12,469,1108;14,713;19,1109;7,1110;24,1111;12,67,1112;19,1113;12,235,594;19,1114;11,1115,63;14,870;23,426,1116;14,1117;19,1118;14,1119;14,1120,591;15,1121;11,955,52;12,556;22,12,1122;19,806;17,1123;19,1124;12,631,583;12,1125;15,1126;19,1127;14,1128;11,1129,12;22,945;11,262,63;29,1130;14,1131;24,1131;22,265,1132;19,1133;12,1134;12,235,1135;22,12,496;19,1136;24,555,748;24,1137;11,1138,52;22,1139,684;12,523,1140;22,128,1091;12,78,1141;14,1142;11,1143,63;29,1144;14,1145;14,12,386;22,12,1146;11,481,63;14,52;14,912,386;12,469,1147;29,914;12,469,1148;12,453,1114;14,806;11,1149,12;19,1150;11,1151,151;19,1152;12,453,103;25,1153;1,1153;19,1154;12,513,1155;14,659;22,12,1156;11,69,63;12,895,1112;12,453,1002;25,1157;11,1158,1;14,1159;13,186,119;19,1160;14,1161,591;24,766;24,774;19,1162;7,1163;25,12,188,1;11,538,159;14,995;22,265,779;12,469,491;12,78,1164;12,469,273;12,453,774;12,469,1165;19,1166;12,70,640;12,469,67;11,1167,63;13,1168;11,1169,171;13,1170;11,1171,85;23,1172,1173;4,1174,1175,1173;7,1176;11,1177,52;11,1178,85;11,1179,151;37,1180,1181;22,1182;7,428,1183;14,1184,660;12,1185;12,491,1186;12,1187;22,1065,1108;19,1188;12,469,1189;14,1190,1;14,659,1191;22,128,52;11,1192,85;22,721,1087;11,1193,171;22,128,766;14,1194;22,721,568;12,469,1195;12,78,1196;11,1197,63;11,433,166;12,235,103;13,1198;25,1199,478;14,1200,1;19,931;24,1057;24,788;22,1201;19,1202;12,469,568;19,1203;11,1204,85;14,613,878;11,1205,63;11,1206,63;10,1207;12,1208,779;38;29,1209;12,864,870;12,469,1210;17,1211;35,749;22,265,1212;19,1067;12,469,1213;12,70,507;12,469,488;22,265,12,376,1214;14,1215;13,433;11,1216,151;19,891;19,1217;11,1218,63;12,840;12,1219;17,695,1220;17,695,1221;17,695,1222;12,70,1223;19,1224;19,1225;12,513,1226;22,12,457;22,847,580;14,1227;23,893,1228;11,1229,166;14,766;12,135,356;19,1230;19,1231;17,852,1232;12,518,823;14,1233,61;12,82,1234;12,469,1235;14,1236;22,12,273;19,1128;12,469,1237;29,1238;22,265,1239;11,1240,63;14,1148;22,128,1241;24,433;11,1242,63;14,1243,478;15,1244;11,1245,85;12,469,1159;12,453,1159;14,1246;7,1247;14,1243;22,128,1248;11,1249,63;11,1250,63;12,488,103;11,1251,85;19,1187;19,1252;19,1253;12,235,1254;11,465,52;19,1255;11,1256,166;12,518,1257;12,453,265;11,1258,63;12,507,495;14,812;22,12,568;14,1259;10,1260;14,1261;25,666,188,10;19,1144;11,1262,166;11,433,159;11,1263,52;19,1264;10,1265;14,1266;14,699;25,1267;11,69,166;22,721,870;11,1268,386;19,1269;19,526;11,1270,85;19,1271;19,1272;12,56,486;14,911;19,1273;11,1145,85;7,1274;22,1275,1276;14,1277,1;14,273;12,469,1278;22,1279,1280;22,721,806;23,631,529;1,12,432,1;19,497;19,1281;11,1282,63;19,1283;10,1284;17,1285,1286;12,518,1159;12,518,1287;12,518,516;12,822,806;24,938;11,963,85;29,1288;11,1289,52;27,1290,1291,1292,1293;19,1294;25,847,188,207;14,911,591;16,1184,1,1295,80,1184;11,1296,159;27,438,1297;25,734,188,207;11,1298,1;1,1299,188,10;25,1300,188,10;25,1301,188,207;1,1302,188,207;19,1288;25,847,188,10;22,1303;22,812,1304;25,1305,188,207;35,1306;7,1307;1,1308,188;11,1309,63;12,518,1310;12,551,652;12,488,433;7,1311;7,1312;7,1313;35,1314;25,1315,188,10;14,1316;15,1317;12,1318,1319;14,1320;15,186,12,1321;11,1322,159;12,1318,938;15,1323;22,128,1324;12,518,1319;12,518,273;10,1325;11,1326,63;19,1327;17,1328,1329;17,1328,1330,93;17,1331,1332;22,812,1333;15,1334;25,820,188,10;19,990;23,82,1335;14,1336,1337;16,78,1,1338,80,1339;16,78,1,1340,80,1339;16,822,1,1341,80,1342;16,1343,1,1341,80,1344;25,1301,188,10;1,1345,188,10;25,734,188,10;22,721,702;14,1195;19,1346;15,1347,12,1321;22,265,1348;22,1349;22,128,1350;17,695,1351;22,721,1352;22,721,809;14,486,61;29,1353;17,1285,12,93;10,1354;11,786,52;1,1355;11,1356,85;11,1357,151;11,992,151;22,1358,639;22,1342,1359;15,1360;1,12,188,1361;20,507,1362,85;29,1318;23,438,1363;19,1364;25,1301,478,10;25,1301,1365,10;12,235,1352;19,991;25,1022,188,10;11,1366,63;22,1367,1368;11,911,1369;13,1370;12,1371,1372;22,721,623;14,905;25,1373,188,10;1,1108,188,10;35,437;19,1374;15,1375,1376;25,847,188;1,847,188;22,128,1377;19,1378;17,530,1379;35,965;23,78,806;10,12,1026;1,847,188,10;23,28,1380;11,1381,131;22,265,1382;1,1108,188;35,1383;22,721,1384;22,265,1385;22,265,12,376,1386;19,1324;19,1387;15,1388;13,1389;35,433;15,1390;10,1391;25,12,188,207;1,12,188,207;15,433,1392;11,1393,166;12,30,1394;22,265,1395;27,1396,1397;11,1398,171;14,1399;16,78,1,79,80,1400;15,1401;14,1402;12,135,1403;22,721,1404;22,265,235;11,1405,52;22,721,465;15,1406;15,1407;25,666;11,1408,63;18,1409,1410;17,695,1411,93;22,265,1412;25,666,478,10;22,812;1,12,625;12,491,972;23,693,806;11,1413,1293;12,56,1414;14,809,219;25,666,478;1,603,478;12,28,67;15,743;24,1325;12,491,1415;12,30,1030;22,265,465;22,265,1416;39,1417,13,1418;16,1419,1293,1420;22,265,1421;22,265,1422;8,1423;8,1424;15,1425;17,1331,1426;22,265,594;22,265,1091;10,1427;19,56;12,56,1428;12,701,1429;11,1430,63;19,1431;11,1432,12;10,1433;22,265,1434;22,265,1435;24,1436;12,235,806;23,78,1437;3,1438,12,13,1439;10,1440;13,1126,119;10,12,201,986;25,1441,188;16,82,1,1442,80,1443;16,135,1,1442,80,1444;16,78,1,1445,80,1446;15,1447;14,1448,660;21,864,1449;14,1450;25,1451,188;14,1184;22,1342;16,78,1,1452,80,1453;40,581,1454;12,1455,1456;12,1457,1456;23,822,1458;23,1459,1458;11,1460,151;11,1461,151;22,265,1462;10,1463;22,721,1464;12,235,1464;22,128,1465;12,235,1466;14,1467,61;14,200;11,1468,151;14,218,201;11,1469,85;14,1470;19,1471;23,70,882;23,67,1472;23,67,1473;23,67,1474;12,491,1475;11,1476,171;11,1477,151;12,1478;7,1479;20,56,112,12,80,1480;22,265,580;12,56,1481;12,1482,1481;20,56,112,12,80,1483;29,840;22,12,580;12,469,580;12,55,1100;22,12,1484;12,491,628;12,1485,628;12,235,1486;12,235,1487;22,128,1488;12,235,1489;14,1489;12,235,628,1490;21,1491,1492,1422,1493;12,235,1494;35,628;12,551,1495;19,1496;10,1497;19,1498;22,12,578;14,1499;23,235,1500;11,1501,12;19,1502;29,1503;12,652,522;24,466;11,1504,52;14,1091;29,1505;11,584;14,1093,591;41,1506,1507;12,70,1508;12,30,236;12,1509,236;22,12,236;12,70,236;12,513,1510;23,67,1511;12,30,1100;12,1512,236;23,426,1513;12,1371,1514;19,1515;19,1516;12,1100,30;12,1100,236;12,1016,54;12,506,1517;23,67,1518;12,70,1519;13,1520;39,1521,13,1522;39,1523,13,1522;39,1524,13,1522;23,583,1525;12,55,56,1490;22,721,496;12,1526,1527;12,53,1528,1490;12,518,1059;11,1529,63;12,526,1530;12,1512,1531;23,568,1532;12,28,54;12,518,1533;22,638,1534;10,1535;11,1536,88;14,1537;23,693,1538;22,1539,8,376,1540;11,1541,63;11,1542,1543;11,1544,151;22,128,1545;22,265,1545;25,1301;10,1546;11,1547,85;22,12,1548;14,519,591;35,1549;12,235,1549;35,1550;22,128,938;23,135,1551;19,1552;21,864,1449,1422;14,1553;29,1554;12,1162,1002;12,1162,1002,1490;12,513,1002,1490;22,128,1555;14,495;15,1556,119,1376;13,1556,119;22,721,1557;21,1558,1559,127,1560;11,1561,85;12,235,1562;11,1562,151;42,1563;42,1564;11,1565,52,1292,1566;11,1567,63;8,1568;8,1569;12,235,1570,1490;11,1571,63;22,718,1159;12,1562;11,1572;40,581,1573;22,1574;11,1575,52;23,506,1576;22,718,1577;22,128,1577;14,1577;2,273,12,13,1578;11,1579,63;8,1580;8,1581;42,1582;42,1583;42,1584;15,1585;14,1586;14,1587;14,1588;16,1589,386,12,80,1590;17,882,1591,1592;11,1593,151;16,1594,1,1595,80,1596;8,1597;11,1598,63;11,1599,151;11,1600,151;7,1601;16,1589,386,1602,80,1603;16,1589,386,1604,80,1603;35,1605;40,581,1596;17,882,1591,1606,1607,201;16,1589,386,1608,80,1590;11,1609,63;11,1610,63;14,8,61;16,78,1,1611,80,1612;21,1589,1613,127;22,128,1586;12,235,1614;11,1118,151;7,1615;11,1616,386;11,1617,85;11,1617,85,1292,1566;11,1618,85;11,1618,85,1292,1566;11,1619,85;11,1619,85,1292,1566;11,1620,85;11,1620,85,1292,1566;43,1621,13,1622;43,1623,13,1622;40,581,1624;40,581,1625;7,1626;11,1627,63;44,1628,13,1629;11,1630,151;11,1631,63;11,1632,52;42,1633;12,1634,1635,1490;11,1636,85;25,1637,188,10;11,1638,159;19,1639;29,1640;42,1641;17,680,1642;11,1643,166;11,1208,166;20,1644,1645,12,80,778;23,1646,486;11,854,88;10,12,386;27,1647,1648;11,1649,386;23,235,1650;22,128,1651;11,1652,1;12,469,513;35,184;1,1653,188,10;12,518,1528;24,103;17,852,1654;1,734;7,1655;42,1656;23,235,1657;22,265,1658;12,1659;19,1660;22,1661;45,1662,1663,1664,1665,1666;45,1662,1663,1667,1665,1666;12,235,1668;15,168,1669;15,1520;22,721,437;22,1358;2,1670,12,13,1671;22,721,1672;2,1673,12,1674;2,1673,12,13,1674;11,1675,63;11,1676,63;2,1670,12,13,1677;11,1678,12;12,1679;12,1208,1680;22,1539,1681;11,1682,171;11,1683,171;12,822,1684;2,1685,12,13,1686;2,1687,12,13,1688;15,1689;24,457;11,1690,85;11,1691,85;42,1692;12,1693,809;7,1694;7,1695;4,1696,12,1697;22,265,1698;12,822,496;46,1699,13,1700;8,1701;15,1702,1703;14,1704;11,1705,85;11,1706,52;22,265,1707,376,1295;11,1708,63;14,12,878;13,1709;22,128,608;14,1710;16,78,1,1711,80,1712;15,1713;14,1714;22,265,765;14,765;22,128,1715;22,12,1716;22,721,1717;11,1718,63;14,1719;11,1720,85;22,721,995;7,1721,1722;47,1723,12,1724;3,273,1725,13,1726;7,1727;7,1728;48,1729,1730;10,1731;12,491,103;22,12,1732;12,1733,995;12,822,1734;16,864,1,1735;17,680,1736,93;14,1737;24,1738;14,1739;29,1740;29,1741;14,623;22,265,1732;12,235,1742;12,636,438;10,1743;8,1744;12,822,1745;11,1746,88;23,491,488;22,1747,1748;27,1749,1750;2,273,12,13,1751;11,1752,85;11,1187,52;11,1753,63;3,1754,12,13,1755;23,235,1756;10,629,386,986;12,822,1757;14,1715;12,822,1028;11,1758,52;22,721,486;16,107,1759,1760,80,1761;10,1762;22,265,491;22,265,1763,376,1764;18,1409,1765;22,265,1766;11,1767,159;14,1768;11,1769,85;12,453,426;12,518,870;11,1770,85;19,1771;12,78,1772;19,1773;25,1774;1,1775;14,1776;24,1776;11,1777,166;14,809,478;22,128,1778;14,1779;14,906;14,1780,1;12,78,433;12,507,1781;35,457;14,453;22,532,1782;12,693,774;12,469,1783;12,385,583;14,914;14,466;22,721,1784;12,513,1785;11,1786,171;11,1787,63;12,1371,1788;11,1789,386;11,1790,85;11,1791,85;12,235,514;11,1792,166;12,469,1793;19,1794;11,1795,85;11,1796,85;14,912;19,1783;19,1797;19,1798;19,1799;12,811,67;11,1800,1;11,1801,85;14,1802;14,1803;12,469,1243;35,870;14,1804;12,469,1805;23,469,1513;11,1806,166;12,569,526;23,1807,1808;23,235,1809;22,128,581;35,1810;12,469,1811;12,636,1812;12,469,1813;11,1814,151;11,1815,151;15,779;29,1816;10,1817;27,1818,1819;14,1820;12,488,437;12,78,1821;12,864,1822;11,1823,131;14,1210,478;19,1824;22,12,1825;11,1826,52;11,1827,151;25,734,188;14,1187;12,82,437;22,128,1050;19,1821;12,469,1828;12,583,1829;11,1830,85;22,12,1831;19,1832;11,1833,171;11,1834,63;11,1835,386;11,1836,171;11,1837,171;11,1838,386;7,1839;11,1840,151;12,491,1841;19,1842;22,721,103;35,717;11,1843,63;11,1844,52;14,1742,878;11,1845,151;24,749;11,944,85;13,1846;29,1847;14,1848;19,1849;29,1850;14,1851;14,1852;14,1853;12,488,1854;11,1855,131;25,1856;29,1857;11,666,1;12,469,1858;23,70,914;11,1859,151;14,1860;11,506,151;19,1861;12,488,1862;11,1863,12;19,941;14,1748;14,1864;19,1865;19,1866;19,1030;12,70,1264;22,12,1867;14,826;14,1868,878;14,1869,61;14,1870,478;19,1143;23,67,1871;7,1872;14,1742;22,718;17,695,1873;14,1874;14,1875,478;22,128,1876;14,1877;17,530,1878,93;11,1879,151;14,1880;19,1881;12,497;1,1882,1883;10,1884;11,1409,151;22,721,1885;17,1886,1887;19,1888;14,1889;12,1008,1890;7,1891;22,265,1484;25,1892,478,10;11,1893,12;7,1894;7,1895;47,1896,12,1724;47,1897,12,1724;7,1898;3,1899,12,13,1900;11,1901,151;11,1902,63;14,1903;19,1904;25,12,12,1905;1,12,1906,1;24,1742;22,721,1195;17,695,1907,93;14,1908,432;12,1909;22,721,1910;12,78,1295;22,12,1911;19,1912;17,530,1913;10,1914,386;12,56,1915;19,1916;22,1917;19,1918;19,456;11,1919,85;11,1920,151;11,1921,63;14,1922;12,1923;12,469,1924;29,1639;35,496;22,799,507;14,1925,708;11,1926,63;11,1927,63;29,1717;19,1928;12,1929,1930;19,1931;19,1693;19,1932;12,513,1933;11,1934,52;12,385,1935;12,1936;29,562;14,145;13,1937;27,1938,1939;27,1940,1941;11,1942,85;11,1943,85;23,491,806;11,437,1;19,1944;24,1945,478;29,1946;22,265,1947;12,1948;11,1949,85;11,1950,85;12,453,273;12,693,334;1,1951,1952;11,1953,151;19,1954;29,1955;22,1747;22,12,1956;23,67,12;11,1066,63;12,488,28;24,78,432;23,453,1002;7,1957;12,235,1958;11,1959,12;11,1960,1;22,265,1219;14,28;23,30,1961;12,70,643;15,1962;12,78,806;22,128,892;12,453,1196;14,1963;15,1964;22,721,1965;11,1966,151;11,1967,52;11,1968,52;12,583,1969;23,972,529;19,632;12,469,1776;20,56,1970,1971;7,1972;15,1973,12,1974;23,840,1975;17,1976,1977;12,235,1822;22,1978,1979;25,1980;22,812,216;22,812,1981;12,507,766;11,1982,63;11,1983,151;12,453,899;48,1984,1985;7,1986,1987;47,1988,12,1989;15,1990;12,513,495;14,1991;23,569,12;19,1992;14,1993;19,845;23,569,1994;19,1995;25,486;23,895,488;22,721,766;14,1996;25,1997;12,507,56;19,900;19,1998;29,1999;11,2000,151;11,2001,386;11,2002,12;13,2003;15,2003;14,12,272;19,1640;12,822,1195;12,726,2004;22,1065,52;12,2005;25,2006;19,2007;22,2008,2009;17,695,2010;1,2011;12,28,2012;12,78,2013;13,2014;12,822,433;25,2015;25,2016;17,1331,2017;12,469,613;22,1065,608;22,265,2018;1,2019,272;12,28,2020;19,2021;17,1078,2022,1592;13,168,119;44,2023,13,2024;2,2025,12,13,2024;7,2026;25,2027;24,2028;25,2029;12,235,2030;11,1217,151;14,2031;25,2032;15,2033;47,2034,12,1724;12,78,2035;15,2036;19,30;25,1856,2037,2038;7,2039;19,2040;12,569,522;12,2041;11,680,151;11,2042,151;12,235,2043;23,70,495;1,2044;14,2045;15,2046;11,1835,2047;11,2048,52;14,964;12,235,454;23,235,2049;12,494,643;11,2050,1;22,799,2051;14,2052;22,265,1294;2,2053,12,13,2054;25,2055;25,1022,188;14,2056;23,840;14,1126;22,128,905;22,1065,2057;19,2058;19,564;25,2059;12,469,433;10,2060;15,2061;17,2062,2063,93;49,168,2064;11,2065,171;11,2066,151;14,2067;24,2068;15,2069;12,78,2070;23,2071,2072;12,822,2073;14,2074,591;11,2075,85;1,486,217;1,809,1337;23,70,12;11,2076,85;23,67,1961;25,2077;23,469,529;19,2078;13,2079;14,2080;11,2016,1;23,70,778;23,491,273;23,67,529;11,2044,159;19,1999;11,2081,386;12,235,437;12,518,495;23,2082,2083;12,2084;23,2085,426;10,2086;1,2087,1883;23,494,778;1,145,188;11,2088,151;14,2089,219;23,28,529;17,530,2090;13,466;12,1162;10,466,1;15,1820;12,78,1016;12,78,487;11,2091,151;15,215;14,2092;12,469,28;12,78,608;13,2093;22,128,2094;19,562;7,2095;7,2096;29,1162;22,128,2097;13,2098;12,488,788;12,235,2099;19,2100;23,1051,488;19,29;23,235,882;14,2101;13,1820;12,693,2102;17,695,2103,93;17,2104,2105,93;13,2106;17,1331,804;25,734,12,207;11,2107,88;17,1331,2108;12,469,2109;1,2110,219;22,128,580;12,82,486;19,2111;22,265,2112;11,2113,63;1,2114,188;1,2115,188;11,2116,1;12,2117;12,526;23,28,778;19,2118;12,78,870;15,2119;13,2120;12,491,2121;1,2122,188;11,2123,151;11,2124,63;14,2125;37,168,2126,1376;22,721,1714;22,12,2127;12,636,749;22,1065;19,2128;12,2129;12,67,995;12,453,2070;11,2130,85;11,2131,85;22,12,2132;1,2133,217,207;11,2134,63;11,2135,12;22,1182,12,376,2136;24,2137;23,70,486;11,2138,171;11,2139,63;25,2140;35,103;12,518,779;14,2141;1,666;12,2142;12,70,513;7,273;48,2143,2144;1,2145,478,10;15,168,119,120;15,2146;14,2147;22,128,2148;17,2149,2150,93;11,2151,151;25,734;23,488,2152;15,2153;1,457,528;19,2154;29,2155;7,2156;12,469,2157;19,2158;14,2159;23,235,2160;25,2161;11,2162,85;12,184,2163;12,469,806;14,2164;25,2089;11,273,52;11,1009,52;19,2165;12,838,514;12,453,2031;12,235,2166;14,2167;12,513,1002;11,69,131;11,2168,52;15,2169;13,2170;11,2171,386;19,2172;19,2173;29,2174;14,2175;11,941,151;12,864,507;22,721,56;10,2176;22,2177,2051;12,822,2178;11,2179,151;14,2180;11,2181,52;11,2182,63;10,2183;24,273;19,2184;12,469,2185;19,2186;1,2187,188;29,2188;19,2189;24,2190;17,530,12,93;29,2191;22,437;11,2192,63;19,2193;12,78,659;12,235,2194;25,2195;12,526,2196;14,713,2197;1,1367,219;12,513,643;11,2198,63;19,2199;13,2200;22,265,2201;13,1354;19,1249;15,2202;19,2203;19,426;14,695;23,494,2204;19,2205;19,2206;12,1512,779;19,2207;35,779;12,70,2208;12,569,2209;12,385,1039;12,78,938;23,235,1513;19,2210;19,2211;12,469,2212;12,235,465;25,2213;12,2214,699;11,2215,63;12,2216;14,2217;35,806;13,1556;12,469,1429;23,235,2218;14,2219;12,2220,103;19,2221;11,2222,63;15,2223;16,2224,386,12,80,2225;15,433,2226;12,2227;11,2228,85;11,2229,151;1,2230,591;17,695,2231,93;22,721,681;7,2232;12,2233,1118;14,166,201;25,1022;29,868;11,2234,159;12,2235;22,265,2236;11,779,52;12,235,870;14,12,61;14,594;1,8,219;15,2237;16,2238,1,151,80,594;11,2140,1;10,2239;19,2191;29,1842;12,78,2240;11,1208,12;11,2241,63;7,2242;2,1898,12,13,2243;2,2244,2245,13,2243;47,2246,12,2247;47,2248,12,2249;12,30,2250;22,265,2251;22,128,103;13,1317;13,2252;22,12,70;22,721,2253;11,2254,1;13,2255;19,2256;12,56,2257;14,655;24,2258;12,469,2259;12,235,1091;17,695,2260;14,2089;11,2261,1;25,666,188,207;14,2262;14,2263,272;10,2264;17,1331,2265;17,1331,2266;12,2172;11,2267,63;11,2268,1;7,2269;23,845;15,2270;17,2271,2272;17,2271,2273;17,2271,2274;17,2271,2275;22,128,583;22,128,516;22,12,914;24,2276;22,12,2276;22,12,2277;11,2278,52;29,2279;23,469,2280;11,2256,88;11,2281,151;15,2282;7,2283;7,2284;14,2285;11,2286,1;12,2287,779;22,12,1148;35,2288;16,82,1,151,80,103;14,809,272;15,2289;11,2290,151;11,891,151;24,1195;11,2291,85;12,911;15,2292;17,1331,2293;11,2294,85;29,2295;14,162;11,2296,88;22,265,2297;11,2298,63;11,2299,151;11,2300,85;1,2301,217;29,2302;22,812,893;19,2303;16,107,1,2304,80,2305;25,860,12,207;13,2306;14,1870;12,2307;19,1352;22,721,2308;11,2309,2310;17,680,2311,93;17,695,2312,93;15,2313;15,2314;12,453,1148;14,2315;14,265;12,569,67;5,2316,2317,2318;14,2319;11,2320,63;42,2321;14,2322;14,2323;10,2324;23,235,2325;22,12,2326;12,469,2327;24,2328;12,469,972;14,465;14,2329;14,2330;12,453,162;15,2331;11,820,1;11,2332,151;21,864,2333;23,822,2083;23,1771,529;23,1509,806;7,2334;7,2335;12,551;14,2336;7,2337;35,2338;12,1842;14,2339;12,235,2340;48,2341,2342;12,1100,1993;11,2343,85;11,2344,85;10,2345;25,2346;35,513;11,2347,63;12,56,2348;1,2349,2350,10;14,1195,878;11,2351,85;11,2352,63;15,2353;11,964,151;7,2354;15,2355;29,846;22,721,2356;11,2357,88;22,721,168;11,2358,85;35,1159;14,1189,708;11,2359,52;11,2360,52;11,2361,52;19,2362;14,2363;19,2364;23,2365,2366;11,2367,151;11,2368,151;19,2369;25,2370;0,2371,1,2372;16,2373,1,2374,80,2375;1,2376,188;25,2377,188;14,2378;12,235,496;11,2379,85;22,128,779;29,2380;29,2381;7,2382;29,2172;12,469,538;14,2383;14,1195,817;19,2384;25,2385,188,10;43,2386,13,2387;14,451;23,56,2388;14,2389;11,2390,151;16,235,1,2391,80,2392;12,235,265;11,2100,151;22,721,2393;11,2394,63;23,82,2395;12,513,28;22,265,2396;10,2397;14,2398;17,530,2399,555;10,2400;17,488,2401;14,643;23,491,2402;19,2403;17,530,2404;22,1065,2405;14,2406;11,2407,88;22,721,2408;14,2409;14,1192;14,2410;22,128,1159;23,56,864;15,2411,2412;14,2413;14,2414;11,2415,1;11,2416,63;14,519;12,822,2417;23,2418,2419;19,2420;29,615;11,826,63;29,2421;11,2422,2197;25,486,188,10;12,2423,437;23,2424,2425;22,128,78;24,882;11,866,151;23,972,2426;14,2427;12,518,1165;19,1399;14,2428;19,1289;29,2429;29,2430;17,695,2431;7,2432;19,2433;8,2434;27,438,2435;11,2436,63;27,2437,2438;21,2224,2439;25,734,478,10;11,2440,52;11,2441,52;11,2442,52;1,1738,188;13,2443;11,2444,386;11,2445,386;14,2446;12,636,469;14,608;23,235,806;17,530,2447;11,2448,1;29,2449;10,2450,386;22,721,2451;11,2452,1;14,2453;14,2454;34,2455;14,2302;11,2456,151;14,2457;11,2458,63;14,2459,2460;11,2461,171;11,2462,171;15,2463;22,265,2464;14,2465;14,69;11,2466,201;19,2467;19,356;11,2468,2469;14,2470;14,2471;11,2472,151;13,2473;29,734;12,82,103;12,78,2474;29,2475;24,2476;11,2477,151;11,2478,171;50,2479,1057,2480;50,2481,1057,2480;7,2482;2,2482,12,13,2483;15,2484;2,2237,12,13,2485;51;11,2486,85;11,2487,85;11,2488,85;2,2489,12,13,2243;3,2489,12,13,2243;47,2490,12,2247;14,145,708;22,265,2491;24,2492;23,507,2493;23,494,469;35,2494;15,2495;22,721,1925;34,466;11,122,166;7,2496;13,2497;5,2498,2499;48,2500,2501;11,2502,2310;11,2503,151;12,453,2504;22,128,2505;11,2506,2507;22,265,2508;7,2509;19,2510;11,2511,151;22,638,2512;12,507,2513;12,822,870;23,235,608;1,2514,188;25,2515,188;11,2516,85;17,530,2517,93;22,265,2518;15,2519;11,2520,151;22,128,8;11,2118,151;14,2521;22,128,135;12,235,2522;17,530,2523;29,2524;35,516;29,2201;11,2525,85;11,2526,85;7,2527;2,2527,12,13,2528;12,526,2529;22,1021;11,2530,151;14,1778;11,2531,85;11,897,12;25,457,478,10;12,1387;11,2532,1;1,2533;14,2534;14,2535;14,2536;47,2537,2538,1724;7,2539,2540;19,2541;12,2542;2,2543;7,2543;24,899;12,518,28;11,2544,171;25,2545;15,2546;2,2547,12,13,2548;47,2549,12,2550;7,2551;11,2552,131;12,526,2553;19,2554;12,469,779;12,726,1030;12,2555;14,2556;17,680,2557,93;17,695,2558,93;23,488,2559;11,2560,63;11,2561,159;4,2562,2563,2564;11,2565,1;11,2566,1;11,2567,386;11,2568,12;14,2569;23,491,2570;19,2571;22,128,2314;15,2572,2573;13,2574;11,2575,52;34,2576;12,235,53;21,28,2577;13,2270,2578;22,265,2579;3,2580,12,13,2581;3,2582,12,13,2583;3,2584,12,13,2585;3,2586,12,13,2587;3,2588,12,13,2589;11,2590,2310;14,774;11,2403,85;29,2118;11,2591,151;12,507,2592;29,2593;11,2594,1;12,518,2595;15,743,119,120;12,28,103;14,2596;15,2597,119,1376;22,721,2598;12,1378;12,469,2599;1,2469,188,10;13,2600;29,2601;15,2602;11,2603,151;11,2604,85;47,2605,12,1724;14,2606;29,122;12,822,2607;25,1951;14,1434;1,2608,478,10;29,1143;25,12,478,10;1,666,188,10;12,469,2609;22,128,273;13,743,119;24,2610;12,53,1534;11,2611,85;22,265,2612;14,2613;1,2614,1337;15,2615;17,695,2616,93;10,2617;24,2618;15,2619;14,12,2620;14,2621;2,2622,12,13,2623;12,526,2624;11,2625,12;22,265,8,376,2626;12,235,2627;13,2628;15,2628;1,766,188;14,756,1;19,2629;14,974;12,30,54;11,2630,63;12,469,2534;11,2631,63;13,2632;22,638,972;13,2633;15,2633;13,2634;7,2635;7,2636;14,2637;25,2638;15,2639,119,1376;11,1405,151;15,2640;11,2641,151;11,1413,63;11,2642,63;11,2643,1;11,2644,63;11,2645,151;15,2646;7,188,2647;15,2648;43,2649,13,2650;47,2651,12,2652;11,544,151;11,2653,88;12,469,530;15,2654,2655;11,2656,151;22,265,809;12,469,2657;2,2527,12,13,2658;11,2659,52;11,2660,1;7,2661,428;11,2662,2663;23,453,2664;14,2665;14,2666;19,2667;11,2668,63;11,2669,386;11,2670,85;12,469,1021;52;22,12,1748;23,822,1159;12,1509,103;12,864,486;12,30,2671;35,2672;14,2673;19,2674;13,433,119;25,2675,478;1,666,188;14,1184,591;7,2676;11,2677,151;25,1951,188,207;25,666,188;12,469,2678;12,526,882;12,1137,2679;23,28,2680;11,1798,151;14,2681;22,265,2682;19,1926;14,1216;11,2683,88;16,78,1,166,80,2684;22,128,2685;21,2686,2687,1422,2688;25,2689,2460,10;14,1783;12,453,1759;11,2690,63;35,514;7,2691;14,2692;23,385,778;11,2693,63;13,2694;11,2695,151;16,78,1,166,80,1148;15,168,2696;12,78,2338,2697;12,822,2698;14,2699;11,2700,131;29,2701;11,2702,1;10,2703;22,265,972;14,2704;19,2705;11,2706,386;7,2707;11,2708,63;15,168,12,120;15,2443;1,1951,478,10;12,453,2709;7,2710;7,2711;7,2712;12,1137,2713;15,2714;14,2715;14,2716;14,2717,708;14,2718;22,721,2719;22,718,2720;7,2721;7,2722;7,2723;5,2724,12,2725;5,2726,12,2727;5,2728,12,2729;5,2730,12,2729;5,2731,12,2732;5,2733,12,2734;2,2735,12,13,2736;12,235,54;1,1022;2,2737,12,13,2738;2,2739,12,13,2740;11,2741,151;11,2742,1;20,2743,112,2744,80,2745;11,2746,2747;12,1137,2748;11,2749,151;16,82,1,79,80,2750;22,128,2751;11,2752,2753;14,2754;14,2755;15,2756;2,2757,12,13,2758;14,2393;4,2759,12,2501;14,2760;23,78,2761;11,2762,12;42,2763;13,2764;25,2765,12,10;11,2766,52;11,1239,52;2,2767,12,13,2768;15,2769;10,2770;12,1936,2771;12,518,1925;12,1512,2772;14,1925;14,51;11,2773,85;11,2774,1;14,2775;12,338,103;22,265,2776,376,2777;48,2778,2501;11,2779,52;15,2780;29,1405;2,2781,12,13,2782;39,2783,13,2784;4,2785,12,2501;11,1009;2,2786,12,13,2787;22,265,2788;12,78,2789;10,2790;14,235;17,530,2791,555;17,530,2792,555;17,530,2793,555;22,265,960;22,721,2794;12,822,2795;19,2112;7,2796;27,2797,2798;19,2799;12,78,2800;15,2801;11,2802,52;22,128,2803;11,2804,85;53,2805;11,2806,52;14,2807;11,2808,2809;40,2810;10,2811;11,2812;7,2813;35,2814;7,2815;12,1008,2816;15,2817;11,2818,1369;24,594;10,2819;1,12,432,10;10,2820;12,491,2821;11,2822,85;27,2823,2824;17,530,2825;22,721,1196;14,2826;11,456,85;24,451;22,265,2827;19,2828;12,569,2829;10,1427,201,986;7,2830;7,2831;11,2832,63;22,265,2833;15,2834;23,235,2835;10,2836;12,1482,2837;24,1059;23,235,2838;11,2839,171;23,78,529;11,2840,386;11,2841,386;15,2842;11,2843,171;19,2844;11,2845,151;12,491,78;22,721,538;10,2846;22,265,2847;10,2848;16,135,1,79,80,2849;16,135,1,2850,80,788;22,721,2042;7,2851;22,721,923;12,822,779;22,265,2852;12,822,809;2,2853,12,13,2854;15,2855,2856;2,2857,12,13,2858;15,2859;14,2860;20,56,2861,2862;20,56,2863,63;11,2864,151;12,488,972;11,920,151;18,1409,2865;22,265,2866;14,2867;47,2868,12,2869;5,2870,12,2871;11,2872,52;14,2873;12,2874;14,2875;29,2876;13,2877;19,2878;49,2879,1520;49,2880,2881;49,2882,2883;49,2884,2885;14,2886;13,2887;29,2888;15,1556;14,2889;22,265,496;23,1482,2890;19,1717;19,2821;15,1334,119;7,2891;7,2892;12,78,496;15,2893;12,822,517;11,2894,85;17,530,2895;48,2896,2501;13,2500;7,2897;19,2898;49,2899,2900;49,2901,2902;49,2903,2904;2,2905,12,13,2906;2,188,2907,13,2908;2,2909,12,13,2910;14,1057,591;11,2911,151;25,2912;1,2913,2914;14,2915;12,469,2916;11,2917,63;16,135,1,2918,80,2919;17,2920,2921,93;1,12,12,1;11,2922,171;11,2923,151;11,2924,151;12,0;11,2925,151;11,2926,151;11,2927,131;2,2928,2929,13,2650;2,2928,2930,13,2650;2,2931,12,13,2650;7,2931;7,2928,2929;7,2928,2930;47,2932,2933,1724;12,67,522;22,265,2934;11,2935,85;11,2936,166;11,2937,85;11,2938,171;19,2939;29,2940;1,2941,188;14,2942,878;11,2943,85;22,2944,486;11,2945,151;29,2946;29,2947;7,2948;47,2949,2950,1724;47,2951,2952,1724;47,2953,12,1724;11,2954,386;11,1143,386;12,235,2955;37,2237,2956;29,2957;14,103,591;11,2958,52;12,235,2959;7,2960;3,2961,12,13,16;43,2962,2963;11,2964,171;12,78,437;13,2965;7,2966;11,1856,1;11,2967,151;11,2968,63;21,2969,2970;12,1165,2971;12,235,877;27,2972,2973;5,2974,2975,2976;5,2977,2978,2976;17,530,2404,93;17,530,2979,93;12,469,2980;27,2040,2981;13,2982,119;11,914,151;22,799,465;15,2983;12,28,437;11,2984,12;12,235,2985;10,629,386;11,736,151;15,2986;11,2987,88;12,822,972;22,721,2988;12,235,1114;11,2989,171;11,2990,151;11,2991,151;11,541,52;12,1137,806;12,469,2992;14,2993;12,82,2302;14,12,2994;14,2995;24,2995;34,2996;22,718,2997;11,2998,171;14,1196;35,2035;24,2101;35,2101;11,2999,151;12,1059;14,56,3000;11,3001,151;23,1137,3002;22,721,608;15,743,119,1376;1,2145,12,207;12,235,3003;21,3004,3005,127;23,235,3006;35,1714;11,3007,151;50,3008,2089,1050;23,235,488;23,583,3009;7,3010;14,3011;23,3012,3013;10,629,3014;12,526,3015;10,3016;15,168,3017;11,3018,63;11,3019,63;12,469,3020;11,3021,151;12,491,496;11,3022,151;22,721,1100;14,1467;14,1925,878;12,1371,465;14,3023;7,188,3024;7,188,3025;22,718,1021;15,3026;12,235,3027;14,516;23,56,3028;15,3029;11,162,159;21,2969,2970,1422,3030;37,168,3031;14,3032;14,12,432;25,3033,478,3034;11,3035,63;14,3036;22,265,3037;11,3038,1;2,188,3039,13,3040;16,2373,1,3041,80,3042;22,721,3043;22,265,3044;11,3045,85;10,3046;19,3047;19,3048;19,3049;19,3050;19,145;19,3051;11,2641,52;19,992;19,3052;12,822,3053;17,530,3054,555;14,3055;10,3056,386;15,3057;16,496,386,3058;11,3059,63;12,864,3060;22,721,866;23,569,3061;12,135,972;22,1065,1431;14,1431;22,721,3062;22,721,3063;14,3063;11,849,85;22,721,1028;11,3064,52;11,3065,88;14,3066;27,1647,3067;18,1409,3068;2,3069,12,13,3070;13,3071;11,3072,85;11,3073,85;11,3074,171;11,3075,171;35,168;19,3076;15,3077;14,168;22,128,538;12,235,1021;13,3078;22,128,3079;39,3080,13,3070;39,3081,12,13,1726;39,3082,13,1726;1,3083,188;25,3084,478,10;22,265,3085;12,822,103;7,3086;14,3087;22,3088,765;24,3089;14,3090;29,3091;14,3092;11,3093;10,3094;10,3095;22,721,3096;35,1021;14,3097;15,3098;13,3098;2,2237,12,13,3099;3,2237,12,13,3099;7,2570,3100;22,721,184;7,3101;15,3102;11,3103,63;11,3104,151;11,3105,63;47,3106,12,3107;11,3108,85;3,3109,12,13,3110;43,3111,13,3112;22,265,699;12,826;11,3113,85;11,3114;11,3115;39,3116,13,3117;14,3118;22,721,3119;11,3120,151;22,265,695;12,1371,882;14,3121;12,822,3122;22,1747,486;22,945,145;14,3123;43,3124,13,3125;10,3126;14,3127;39,3128,13,3129;12,491,1184;22,265,3130;14,186;14,3131;12,518,3132;12,822,3132;14,2406,478;10,3133;35,938;22,128,3134;14,3135;43,3136,13,3137;10,3138;10,3139;35,3140;15,3141;15,3142;10,3143;12,184,496;11,3144,88;15,3145;14,3146;14,3147;16,3148,1759,12,80,3149;8,3150;8,3151;44,3151,13,3152;27,3153,3154;14,3155;11,3156,63;11,3157,85;11,3158,85;11,1126,85;11,3159,85;11,3160,63;24,3161;19,3162;43,3163,13,3164;11,3165,12;22,1065,3166;11,3167,52;11,1562,52;19,2188;22,12,3168;19,2945;11,3169,85;11,273,166;10,3170;11,1058,85;12,469,3171;22,265,3172;11,3173,171;7,3174;2,3175,12,13,35;23,569,3176;39,3177,13,3178;18,1646,3179;1,3180,188,10;7,3181;10,3182;11,3183,151;46,3184,13,3185;13,3186,119;22,718,3187;14,3188;11,1059,159;22,265,3189;12,235,3190;14,12,3191;14,3192;11,3193,151;11,3194,151;15,3195;13,3195;22,265,3196;42,3197;14,3198;22,265,840;24,496;24,3199;14,3199;44,3200,13,3201;17,882,3202,93;12,1371,496;11,3203,52;24,3204;14,3205;11,3206,85;11,3207,85;11,3208;42,3209;42,3210;7,3211;20,3212,3213;20,3212,3214;35,517;25,2027,188;12,869,3215;13,3216;13,3217;14,3218;10,3219;22,265,3220;2,3221,12,13,3222;22,721,3223;11,3224,52;11,3225,63;16,82,1,3226,80,273;11,3227,85;16,78,1,1452,80,3228;3,3229,12,13,35;43,3230,13,35;27,3231,3232;11,3233,52;11,3234,151;24,1184;22,265,3235;19,3236;10,3237;12,568,643;14,3199,591;24,3199,272;22,128,3238;15,2014;42,3239;1,3240,219,10;13,3241;29,3242;11,3243,151;1,3244,188,207;12,491,3245;1,3246,188;3,3247,12,13,3248;16,97,1,3226,80,2433;42,3249;42,3250;39,3251,13,3252;2,3253,12,13,3252;16,78,1,1452,80,3254;12,822,3255;13,168,3256;12,491,3257;14,3258;22,721,3259;14,3260;16,235,1,2391,80,3261;22,3262;15,3263;2,3264,12,13,3265;22,718,3266;23,3267,3268;23,3269,3268;15,3270;23,3271,3272;14,3273;14,3274;24,3275;22,1342,3276;14,2219,478;11,3277,151;15,3278;22,265,56,3279,386;11,3280,63;3,3281,12,13,3282;43,3283,13,3282;2,3284,12,13,35;11,3285,63;14,3286;14,1118;14,3287;11,3288,63;11,3289,12;16,3290,1,98,80,3291;34,3292;7,3293;15,3294;22,128,1257;8,3295;2,3296,12,13,3297;19,3298;44,3299,13,3300;14,3301;22,721,3302;14,3303;22,3304,3305;11,122,151;8,3306;5,3307,3308,3309;15,3310;50,3311,1057,2480,3312,3313;39,3314,13,3315;54,3316,3317;14,3318;22,12,3319;14,3320;14,3321,591;15,3322;46,3323,13,3324;7,3325;7,3326;13,3327;11,3328,151;12,235,3329;19,3330;29,3331;23,568,1052;15,3332;11,3333,52;11,1940,52;35,3334;11,3335,85;13,3336;19,2233;13,3337;13,3338;11,3339,151;7,3340;22,12,3341;11,3342,151;16,3343,1,3344,80,3345;22,12,527;13,3346;11,3347,12;7,3348;11,3349,159;34,3350;11,3351,171;11,3352,171;13,3353;11,3354,171;16,1693,1293,3355,80,3356;13,3357;15,3358;5,3359,12,3360;11,3361,151;11,3362,151;23,3363,491;15,3364;17,3365,3366,93;13,3367;13,3368;13,3369;17,530,3370,555;11,3371,151;15,3372;55,3373,13,3374;29,3375;11,2570,63;15,3376;11,3377,171;15,3378;13,3379;13,3380;13,3381;13,3382;56,3383;13,3384;15,3385;13,3386;15,3387;19,55;19,3388;29,3389;24,3390;23,3391,3392;13,3393;15,3394;15,3395;15,3396;15,3397;13,3398;13,3399;13,3400;11,3401,151;15,3402;15,3403;13,3404;15,3405;15,3406;15,3407;13,3408;15,3409;13,3410;24,28;24,2996;13,3411;15,3412;13,3413;15,3413;13,3414;39,3415,13,3416;16,2373,1,3417,80,3418;39,3419,13,3420;39,3421,13,3420";
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
